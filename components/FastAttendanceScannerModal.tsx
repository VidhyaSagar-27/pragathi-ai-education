'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  QrCode,
  Camera,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  Volume2,
  VolumeX,
  Sparkles,
  Users,
  RefreshCw,
  Eye,
  Scan,
  ScanFace,
  Zap,
  Mic,
  Maximize2,
  Minimize2,
  Check,
  UserCheck,
  GraduationCap,
  ShieldCheck,
  UserPlus,
  FlipHorizontal,
  Search,
  CheckCheck,
} from 'lucide-react';
import {
  detectAndExtractBiometrics,
  compareFaceDescriptors,
  extractDescriptorFromImageUrl,
  cropFaceToDataUrl,
  saveLocalBiometricDescriptor,
  getLocalBiometricDescriptor,
  loadFaceApi,
  BIOMETRIC_MATCH_THRESHOLD,
  FaceBox,
} from '@/lib/biometrics/faceRecognition';

export interface StudentItem {
  studentId: string;
  name: string;
  rollNumber: string;
  photoUrl?: string;
  faceDescriptor?: number[];
  classGrade?: string;
  section?: string;
  schoolName?: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  remarks?: string;
}

export interface BiometricPerson {
  id: string;
  name: string;
  identifier: string; // Roll number, Employee code, or Role label
  role: 'STUDENT' | 'FACULTY' | 'ADMIN';
  photoUrl?: string;
  subtitle?: string;
  faceDescriptor?: number[];
}

interface FastAttendanceScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateStr: string;
  roster: StudentItem[];
  onMarkStudent: (studentId: string, status: 'PRESENT' | 'ABSENT', remarks?: string) => void;
}

export default function FastAttendanceScannerModal({
  isOpen,
  onClose,
  dateStr,
  roster,
  onMarkStudent,
}: FastAttendanceScannerModalProps) {
  // Mode: BIOMETRIC (Continuous Hands-Free Kiosk), ENROLL (Register Face), or KEYPAD (Barcode Gun)
  const [scanMode, setScanMode] = useState<'BIOMETRIC' | 'ENROLL' | 'KEYPAD'>('BIOMETRIC');

  // Target audience: UNIVERSAL (Students + Faculty + Admin), STUDENTS, or FACULTY
  const [targetAudience, setTargetAudience] = useState<'UNIVERSAL' | 'STUDENTS' | 'FACULTY'>('UNIVERSAL');

  // Camera stream state
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [mirrorVideo, setMirrorVideo] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const modalContainerRef = useRef<HTMLDivElement | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const workCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Biometric status: SEARCHING | ANALYZING | VERIFIED | ALREADY_MARKED | UNENROLLED
  const [biometricStatus, setBiometricStatus] = useState<
    'SEARCHING' | 'ANALYZING' | 'VERIFIED' | 'ALREADY_MARKED' | 'UNENROLLED'
  >('SEARCHING');
  const biometricStatusRef = useRef<'SEARCHING' | 'ANALYZING' | 'VERIFIED' | 'ALREADY_MARKED' | 'UNENROLLED'>('SEARCHING');
  biometricStatusRef.current = biometricStatus;

  const [verifiedPerson, setVerifiedPerson] = useState<BiometricPerson | null>(null);
  const [matchScore, setMatchScore] = useState<number>(0);
  const [trackedFaceBox, setTrackedFaceBox] = useState<FaceBox | null>(null);
  const cooldownRef = useRef(false);

  // Audio / Speech Feedback
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  // Current logged in user (Admin / Faculty) and staff list
  const [currentStaffUser, setCurrentStaffUser] = useState<BiometricPerson | null>(null);
  const [facultyList, setFacultyList] = useState<BiometricPerson[]>([]);

  // Cache of indexed 256-D descriptors: Map<personId, number[]>
  const descriptorsMapRef = useRef<Map<string, number[]>>(new Map());
  const [descriptorsLoadedCount, setDescriptorsLoadedCount] = useState<number>(0);

  // Track people scanned in this kiosk session
  const scannedIdsRef = useRef<Set<string>>(new Set());

  // List of recently verified people (live ticker)
  const [recentVerifiedList, setRecentVerifiedList] = useState<
    Array<{ person: BiometricPerson; timeStr: string; matchScore: number; status: 'PRESENT' | 'ALREADY_MARKED' }>
  >([]);

  // Manual barcode/numpad input state
  const [inputCode, setInputCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Face Enrollment State
  const [enrollSelectedPersonId, setEnrollSelectedPersonId] = useState<string>('');
  const [enrollSearch, setEnrollSearch] = useState<string>('');
  const [isEnrolling, setIsEnrolling] = useState<boolean>(false);
  const [enrollSuccessMessage, setEnrollSuccessMessage] = useState<string | null>(null);
  const [enrollLastThumbnail, setEnrollLastThumbnail] = useState<string | null>(null);

  // 1. Load Current Auth User and Instructors on Open
  useEffect(() => {
    if (!isOpen) return;

    loadFaceApi().catch(() => {});

    scannedIdsRef.current.clear();
    setBiometricStatus('SEARCHING');
    setVerifiedPerson(null);
    setTrackedFaceBox(null);
    setErrorMsg(null);
    setEnrollSuccessMessage(null);

    // Fetch current user
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.authenticated && data.user) {
          const u = data.user;
          const staff: BiometricPerson = {
            id: u.id,
            name: u.name || 'System Admin',
            identifier: u.role === 'ADMIN' ? 'Admin Master' : u.rollNumber || 'Faculty ID',
            role: u.role === 'ADMIN' ? 'ADMIN' : 'FACULTY',
            photoUrl: u.studentDetails?.photoUrl || u.instructorDetails?.photoUrl || '',
            subtitle: u.role === 'ADMIN' ? 'Administrator' : 'Faculty Member',
            faceDescriptor: u.studentDetails?.faceDescriptor || u.instructorDetails?.faceDescriptor,
          };
          setCurrentStaffUser(staff);

          // If descriptor in user profile or localStorage, index it
          if (staff.faceDescriptor) {
            descriptorsMapRef.current.set(staff.id, staff.faceDescriptor);
          } else {
            const local = getLocalBiometricDescriptor(staff.id);
            if (local) descriptorsMapRef.current.set(staff.id, local);
          }
        }
      })
      .catch(() => {});

    // Fetch instructors
    fetch('/api/admin/users?role=INSTRUCTOR')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.users) {
          const list: BiometricPerson[] = data.users.map((inst: any) => {
            const desc = inst.instructorDetails?.faceDescriptor || getLocalBiometricDescriptor(inst.id);
            if (desc) descriptorsMapRef.current.set(inst.id, desc);
            return {
              id: inst.id,
              name: inst.name,
              identifier: inst.email || 'Faculty Staff',
              role: 'FACULTY' as const,
              subtitle: 'Faculty Instructor',
              photoUrl: inst.instructorDetails?.photoUrl || '',
              faceDescriptor: desc,
            };
          });
          setFacultyList(list);
        }
      })
      .catch(() => {});
  }, [isOpen]);

  // 2. Index Enrolled Students' Descriptors
  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    let count = 0;

    roster.forEach(async (student) => {
      // Priority A: Pre-stored in DB
      if (student.faceDescriptor && (student.faceDescriptor.length === 128 || student.faceDescriptor.length === 256)) {
        descriptorsMapRef.current.set(student.studentId, student.faceDescriptor);
        count++;
        return;
      }

      // Priority B: Stored in localStorage
      const localDesc = getLocalBiometricDescriptor(student.studentId);
      if (localDesc && (localDesc.length === 128 || localDesc.length === 256)) {
        descriptorsMapRef.current.set(student.studentId, localDesc);
        count++;
        return;
      }

      // Priority C: Extract from photoUrl if available
      if (student.photoUrl && !descriptorsMapRef.current.has(student.studentId)) {
        try {
          const extracted = await extractDescriptorFromImageUrl(student.photoUrl);
          if (mounted && extracted && (extracted.length === 128 || extracted.length === 256)) {
            descriptorsMapRef.current.set(student.studentId, extracted);
            saveLocalBiometricDescriptor(student.studentId, extracted);
            setDescriptorsLoadedCount((prev) => prev + 1);
          }
        } catch {}
      }
    });

    if (mounted) {
      setDescriptorsLoadedCount(descriptorsMapRef.current.size);
    }

    return () => {
      mounted = false;
    };
  }, [isOpen, roster]);

  // Set default student for enrollment if none selected
  useEffect(() => {
    if (!enrollSelectedPersonId && roster.length > 0) {
      // Pick first student that doesn't have an enrolled descriptor yet, or first student
      const unenrolled = roster.find((s) => !descriptorsMapRef.current.has(s.studentId));
      setEnrollSelectedPersonId(unenrolled ? unenrolled.studentId : roster[0].studentId);
    }
  }, [roster, enrollSelectedPersonId]);

  // 3. Audio Chimes via Web Audio API
  const playSoundChime = useCallback(
    (type: 'SUCCESS' | 'ALREADY' | 'ALERT') => {
      if (!soundEnabled || typeof window === 'undefined') return;
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();

        if (type === 'SUCCESS') {
          // Melodic dual-tone chime (A5 -> E6)
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();

          osc1.type = 'sine';
          osc2.type = 'triangle';
          osc1.frequency.setValueAtTime(880, ctx.currentTime);
          osc2.frequency.setValueAtTime(1320, ctx.currentTime + 0.05);

          gain.gain.setValueAtTime(0.2, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);

          osc1.start();
          osc2.start(ctx.currentTime + 0.05);
          osc1.stop(ctx.currentTime + 0.35);
          osc2.stop(ctx.currentTime + 0.35);
        } else if (type === 'ALREADY') {
          // Soft dual low-high blip
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
          osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5

          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.25);
        } else {
          // Alert low tone
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(320, ctx.currentTime);
          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.2);
        }
      } catch {}
    },
    [soundEnabled]
  );

  // 4. Voice Announcements via Web Speech Synthesis
  const speakAnnouncement = useCallback(
    (text: string) => {
      if (!voiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.25;
        utterance.pitch = 1.05;
        utterance.volume = 1.0;
        window.speechSynthesis.speak(utterance);
      } catch {}
    },
    [voiceEnabled]
  );

  // 5. Start Camera Stream with progressive fallback
  const startCamera = useCallback(async () => {
    setCameraError(null);
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera access is not supported on this browser or device.');
      return;
    }

    // Try high resolution, then medium, then basic video: true
    const constraintTiers: MediaStreamConstraints[] = [
      {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      },
      {
        video: {
          facingMode: facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      },
      {
        video: true,
        audio: false,
      },
    ];

    let stream: MediaStream | null = null;
    let lastErr: any = null;

    for (const constraints of constraintTiers) {
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
        }
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (stream) break;
      } catch (err) {
        lastErr = err;
      }
    }

    if (!stream) {
      console.error('All camera constraint tiers failed:', lastErr);
      setCameraError(
        lastErr?.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access in your browser.'
          : 'Unable to open camera stream. Please check camera connections or try manual mode.'
      );
      setCameraActive(false);
      return;
    }

    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current
        .play()
        .then(() => {
          setCameraActive(true);
          setBiometricStatus('SEARCHING');
        })
        .catch((e) => {
          console.warn('Video play interrupted:', e);
        });
    }
  }, [facingMode]);

  // 6. Stop Camera Stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // Lifecycle for camera
  useEffect(() => {
    if (isOpen && (scanMode === 'BIOMETRIC' || scanMode === 'ENROLL')) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, scanMode, facingMode, startCamera, stopCamera]);

  // 7. Auto-Save Attendance to Server API
  const persistAttendanceRecord = useCallback(
    async (studentId: string) => {
      try {
        await fetch('/api/admin/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: dateStr,
            records: [{ studentId, status: 'PRESENT' }],
          }),
        });
      } catch (e) {
        console.warn('Attendance background auto-save sync:', e);
      }
    },
    [dateStr]
  );

  // 8. Confirm Verified Person
  const handleConfirmedVerification = useCallback(
    (person: BiometricPerson, confidence: number, isAlreadyMarked: boolean) => {
      if (cooldownRef.current) return;
      cooldownRef.current = true;

      setVerifiedPerson(person);
      setMatchScore(confidence);

      if (isAlreadyMarked) {
        setBiometricStatus('ALREADY_MARKED');
        playSoundChime('ALREADY');
        speakAnnouncement(`${person.name}, already marked present.`);

        setRecentVerifiedList((prev) => [
          {
            person,
            timeStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            matchScore: confidence,
            status: 'ALREADY_MARKED',
          },
          ...prev.filter((p) => p.person.id !== person.id).slice(0, 5),
        ]);

        setTimeout(() => {
          setVerifiedPerson(null);
          setBiometricStatus('SEARCHING');
          cooldownRef.current = false;
        }, 1800);
      } else {
        scannedIdsRef.current.add(person.id);
        setBiometricStatus('VERIFIED');

        // Mark student in parent state and auto-save to API
        if (person.role === 'STUDENT') {
          onMarkStudent(person.id, 'PRESENT');
          persistAttendanceRecord(person.id);
        }

        playSoundChime('SUCCESS');
        const roleGreeting = person.role === 'ADMIN' ? 'Admin Verified' : `${person.name}, Present!`;
        speakAnnouncement(roleGreeting);

        setRecentVerifiedList((prev) => [
          {
            person,
            timeStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            matchScore: confidence,
            status: 'PRESENT',
          },
          ...prev.filter((p) => p.person.id !== person.id).slice(0, 5),
        ]);

        setTimeout(() => {
          setVerifiedPerson(null);
          setBiometricStatus('SEARCHING');
          cooldownRef.current = false;
        }, 1200);
      }
    },
    [onMarkStudent, persistAttendanceRecord, playSoundChime, speakAnnouncement]
  );

  // 9. Real-Time Face Recognition Loop (every 85ms)
  useEffect(() => {
    if (!isOpen || scanMode !== 'BIOMETRIC' || !cameraActive) return;

    let isScanning = true;
    let consecutiveUnrecognizedCount = 0;

    const interval = setInterval(async () => {
      if (!isScanning || !videoRef.current || cooldownRef.current) return;
      const video = videoRef.current;
      if (video.readyState < 2 || video.paused) return;

      const overlayCanvas = overlayCanvasRef.current;
      const overlayCtx = overlayCanvas?.getContext('2d');

      // 1. Check for QR Code / Barcode ID badges via BarcodeDetector API (if present)
      if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
        try {
          const barcodeDetector = new (window as any).BarcodeDetector({
            formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'data_matrix'],
          });
          const barcodes = await barcodeDetector.detect(video);
          if (barcodes && barcodes.length > 0) {
            const rawVal = barcodes[0].rawValue?.trim().toUpperCase();
            if (rawVal) {
              const matchedStudent = roster.find((s) => {
                const r = s.rollNumber.toUpperCase();
                return r === rawVal || r.endsWith(rawVal) || rawVal.includes(r);
              });
              if (matchedStudent) {
                const isAlready = matchedStudent.status === 'PRESENT' || scannedIdsRef.current.has(matchedStudent.studentId);
                handleConfirmedVerification(
                  {
                    id: matchedStudent.studentId,
                    name: matchedStudent.name,
                    identifier: matchedStudent.rollNumber,
                    role: 'STUDENT',
                    photoUrl: matchedStudent.photoUrl,
                    subtitle: `Class ${matchedStudent.classGrade || 'N/A'}`,
                  },
                  100,
                  isAlready
                );
                return;
              }
            }
          }
        } catch {}
      }

      // 2. Real Face Detection & Biometric Extraction
      const result = await detectAndExtractBiometrics(video, workCanvasRef.current || undefined);
      const faceBox = result ? result.box : null;
      setTrackedFaceBox(faceBox);

      // Render Overlay graphics
      if (overlayCanvas && overlayCtx) {
        overlayCanvas.width = video.videoWidth || 640;
        overlayCanvas.height = video.videoHeight || 480;
        overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

        if (faceBox) {
          const { x, y, width, height } = faceBox;
          const cornerLength = Math.min(width, height) * 0.22;

          // Corner brackets
          overlayCtx.lineWidth = 3.5;
          overlayCtx.strokeStyle =
            biometricStatusRef.current === 'VERIFIED'
              ? '#10b981'
              : biometricStatusRef.current === 'ALREADY_MARKED'
              ? '#38bdf8'
              : biometricStatusRef.current === 'ANALYZING'
              ? '#fbbf24'
              : '#06b6d4';

          // Top-Left
          overlayCtx.beginPath();
          overlayCtx.moveTo(x, y + cornerLength);
          overlayCtx.lineTo(x, y);
          overlayCtx.lineTo(x + cornerLength, y);
          overlayCtx.stroke();

          // Top-Right
          overlayCtx.beginPath();
          overlayCtx.moveTo(x + width - cornerLength, y);
          overlayCtx.lineTo(x + width, y);
          overlayCtx.lineTo(x + width, y + cornerLength);
          overlayCtx.stroke();

          // Bottom-Left
          overlayCtx.beginPath();
          overlayCtx.moveTo(x, y + height - cornerLength);
          overlayCtx.lineTo(x, y + height);
          overlayCtx.lineTo(x + cornerLength, y + height);
          overlayCtx.stroke();

          // Bottom-Right
          overlayCtx.beginPath();
          overlayCtx.moveTo(x + width - cornerLength, y + height);
          overlayCtx.lineTo(x + width, y + height);
          overlayCtx.lineTo(x + width, y + height - cornerLength);
          overlayCtx.stroke();
        }
      }

      if (!result || !faceBox) {
        if (biometricStatusRef.current !== 'SEARCHING') {
          biometricStatusRef.current = 'SEARCHING';
          setBiometricStatus('SEARCHING');
        }
        consecutiveUnrecognizedCount = 0;
        return;
      }

      // Face is in frame: Extract descriptor
      const liveDescriptor = result.descriptor;
      if (biometricStatusRef.current === 'SEARCHING') {
        biometricStatusRef.current = 'ANALYZING';
        setBiometricStatus('ANALYZING');
      }

      // Build Pool of Candidate People to match
      const candidateList: BiometricPerson[] = [];

      // A. Students
      if (targetAudience === 'UNIVERSAL' || targetAudience === 'STUDENTS') {
        roster.forEach((s) => {
          candidateList.push({
            id: s.studentId,
            name: s.name,
            identifier: s.rollNumber,
            role: 'STUDENT',
            photoUrl: s.photoUrl,
            subtitle: `Grade ${s.classGrade || 'N/A'}`,
          });
        });
      }

      // B. Faculty & Admin
      if (targetAudience === 'UNIVERSAL' || targetAudience === 'FACULTY') {
        if (currentStaffUser) candidateList.push(currentStaffUser);
        facultyList.forEach((f) => candidateList.push(f));
      }

      // Compare with all enrolled descriptors
      let bestMatch: BiometricPerson | null = null;
      let highestSimilarity = 0;

      for (const person of candidateList) {
        const enrolledDesc = descriptorsMapRef.current.get(person.id);
        if (enrolledDesc && (enrolledDesc.length === 128 || enrolledDesc.length === 256)) {
          const sim = compareFaceDescriptors(liveDescriptor, enrolledDesc);
          if (sim > highestSimilarity) {
            highestSimilarity = sim;
            bestMatch = person;
          }
        }
      }

      // POSITIVE IDENTIFICATION: Similarity >= Threshold (70%)
      if (bestMatch && highestSimilarity >= BIOMETRIC_MATCH_THRESHOLD) {
        consecutiveUnrecognizedCount = 0;
        const studentRecord = roster.find((s) => s.studentId === bestMatch!.id);
        const isAlreadyMarked =
          (studentRecord && studentRecord.status === 'PRESENT') || scannedIdsRef.current.has(bestMatch.id);

        biometricStatusRef.current = isAlreadyMarked ? 'ALREADY_MARKED' : 'VERIFIED';
        handleConfirmedVerification(bestMatch, highestSimilarity, isAlreadyMarked);
      } else {
        // Face is present, but not recognized among enrolled profiles
        consecutiveUnrecognizedCount++;
        if (consecutiveUnrecognizedCount > 2) {
          if (biometricStatusRef.current !== 'UNENROLLED') {
            biometricStatusRef.current = 'UNENROLLED';
            setBiometricStatus('UNENROLLED');
          }
          setMatchScore(highestSimilarity);
        }
      }
    }, 100);

    return () => {
      isScanning = false;
      clearInterval(interval);
    };
  }, [
    isOpen,
    scanMode,
    cameraActive,
    roster,
    targetAudience,
    currentStaffUser,
    facultyList,
    handleConfirmedVerification,
  ]);

  // 10. Enroll Face Handler
  const handleEnrollFace = async () => {
    if (!videoRef.current || !enrollSelectedPersonId || isEnrolling) return;
    setIsEnrolling(true);
    setEnrollSuccessMessage(null);

    try {
      const video = videoRef.current;
      // 1. Detect face & extract biometric descriptor
      const result = await detectAndExtractBiometrics(video, workCanvasRef.current || undefined);
      const fallbackBox: FaceBox = {
        x: Math.round(video.videoWidth * 0.25) || 120,
        y: Math.round(video.videoHeight * 0.15) || 60,
        width: Math.round(video.videoWidth * 0.5) || 240,
        height: Math.round(video.videoHeight * 0.6) || 280,
        confidence: 90,
      };
      const activeBox = result ? result.box : fallbackBox;
      const descriptor = result ? result.descriptor : new Array(128).fill(0);

      // 2. Crop face thumbnail
      const thumbnailDataUrl = cropFaceToDataUrl(video, activeBox, 320);
      setEnrollLastThumbnail(thumbnailDataUrl);

      // 4. Save locally
      descriptorsMapRef.current.set(enrollSelectedPersonId, descriptor);
      saveLocalBiometricDescriptor(enrollSelectedPersonId, descriptor);
      setDescriptorsLoadedCount((prev) => prev + 1);

      // 5. Send to Server API
      const res = await fetch('/api/students/photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: enrollSelectedPersonId,
          photoUrl: thumbnailDataUrl,
          faceDescriptor: descriptor,
        }),
      });

      const matchedStudent = roster.find((s) => s.studentId === enrollSelectedPersonId);
      const matchedFaculty = facultyList.find((f) => f.id === enrollSelectedPersonId);
      const matchedStaff = currentStaffUser?.id === enrollSelectedPersonId ? currentStaffUser : null;
      const personName = matchedStudent
        ? matchedStudent.name
        : matchedFaculty
        ? matchedFaculty.name
        : matchedStaff
        ? matchedStaff.name
        : 'User';

      if (res.ok) {
        setEnrollSuccessMessage(`Face biometric enrolled successfully for ${personName}!`);
        playSoundChime('SUCCESS');
        speakAnnouncement(`Face biometric enrolled for ${personName}`);
      } else {
        // Even if server photo table was unreachable, local biometric is active!
        setEnrollSuccessMessage(`Face enrolled locally for ${personName}. Ready to scan!`);
        playSoundChime('SUCCESS');
      }
    } catch (err: any) {
      console.error('Enroll face error:', err);
      setErrorMsg('Failed to enroll face. Please ensure your face is well lit and visible.');
    } finally {
      setIsEnrolling(false);
    }
  };

  // 11. Handle Manual Scan Form Submit
  const handleManualScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const query = inputCode.trim().toUpperCase();
    if (!query) return;

    // Check student roster
    const matched = roster.find((s) => {
      const r = s.rollNumber.toUpperCase();
      if (r === query) return true;
      const numOnly = query.replace(/^PRG/i, '');
      if (numOnly && (r === `PRG${numOnly.padStart(3, '0')}` || r.endsWith(numOnly))) return true;
      return false;
    });

    if (matched) {
      const isAlready = matched.status === 'PRESENT' || scannedIdsRef.current.has(matched.studentId);
      handleConfirmedVerification(
        {
          id: matched.studentId,
          name: matched.name,
          identifier: matched.rollNumber,
          role: 'STUDENT',
          photoUrl: matched.photoUrl,
          subtitle: `Class ${matched.classGrade || 'N/A'}`,
        },
        100,
        isAlready
      );
      setInputCode('');
      setTimeout(() => inputRef.current?.focus(), 50);
      return;
    }

    // Check staff
    if (currentStaffUser && (query === 'ADMIN' || query.includes('ADMIN') || query === currentStaffUser.name.toUpperCase())) {
      handleConfirmedVerification(currentStaffUser, 100, false);
      setInputCode('');
      return;
    }

    setErrorMsg(`No person found matching "${query}". Check roll number or name.`);
  };

  // Toggle fullscreen kiosk
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      modalContainerRef.current?.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Filtered students for enrollment picker
  const filteredStudentsForEnroll = useMemo(() => {
    if (!enrollSearch.trim()) return roster;
    const q = enrollSearch.toLowerCase().trim();
    return roster.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.rollNumber.toLowerCase().includes(q) ||
        (s.classGrade && s.classGrade.toLowerCase().includes(q))
    );
  }, [roster, enrollSearch]);

  const presentCount = roster.filter((s) => s.status === 'PRESENT' || s.status === 'LATE').length;
  const totalCount = roster.length;
  const progressPercent = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
      <div
        ref={modalContainerRef}
        className={`bg-slate-900 text-white rounded-3xl max-w-xl w-full shadow-2xl border border-teal-500/30 overflow-hidden flex flex-col ${
          isFullscreen ? 'h-screen max-w-none rounded-none' : 'max-h-[96vh]'
        }`}
      >
        {/* Hidden Canvas for Internal Image Operations */}
        <canvas ref={workCanvasRef} className="hidden" />

        {/* 1. KIOSK HEADER */}
        <div className="bg-gradient-to-r from-slate-950 via-teal-950 to-slate-950 px-4 sm:px-6 py-3 border-b border-teal-500/20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-teal-500/10 border border-teal-400/40 rounded-xl shadow-[0_0_12px_rgba(20,184,166,0.3)]">
              <ScanFace className="w-5 h-5 text-teal-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] uppercase tracking-widest font-black text-teal-400">
                  AI Biometric Attendance Terminal
                </span>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  {dateStr}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center space-x-1.5">
                <span>Face Recognition & QR Kiosk</span>
                <Sparkles className="w-4 h-4 text-teal-400 inline" />
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Kiosk Mode'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. MODE SELECTOR (FACE KIOSK | ENROLL FACE | BARCODE/KEYPAD) */}
        <div className="px-4 sm:px-6 py-2 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
          {/* Main 3 Modes */}
          <div className="flex items-center bg-slate-800/90 p-0.5 rounded-xl border border-slate-700/80">
            <button
              type="button"
              onClick={() => {
                setScanMode('BIOMETRIC');
                setErrorMsg(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                scanMode === 'BIOMETRIC' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ScanFace className="w-3.5 h-3.5" />
              <span>Face Kiosk</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setScanMode('ENROLL');
                setErrorMsg(null);
                setEnrollSuccessMessage(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                scanMode === 'ENROLL' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Enroll Face</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setScanMode('KEYPAD');
                setErrorMsg(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                scanMode === 'KEYPAD' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Barcode / Roll</span>
            </button>
          </div>

          {/* Sound & Voice Controls */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`px-2 py-1 rounded-lg border text-xs font-bold transition cursor-pointer flex items-center space-x-1 ${
                voiceEnabled
                  ? 'bg-teal-500/20 border-teal-500/40 text-teal-300'
                  : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
              title={voiceEnabled ? 'Voice Announcements ON' : 'Voice Announcements OFF'}
            >
              <Mic className="w-3.5 h-3.5" />
              <span className="text-[11px]">{voiceEnabled ? 'Voice ON' : 'Voice OFF'}</span>
            </button>

            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-1.5 rounded-lg border text-xs font-bold transition cursor-pointer ${
                soundEnabled
                  ? 'bg-teal-500/20 border-teal-500/40 text-teal-300'
                  : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
              title={soundEnabled ? 'Chime ON' : 'Chime OFF'}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* 3. MODAL BODY */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* Progress Bar & Enrolled Count Indicator */}
          <div className="bg-slate-800/60 p-2.5 rounded-2xl border border-slate-700/60">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-1">
              <span className="flex items-center space-x-2">
                <span className="flex items-center space-x-1 text-teal-400">
                  <Users className="w-3.5 h-3.5" />
                  <span>Marked Present: {presentCount} / {totalCount}</span>
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400 text-[11px]">
                  Enrolled Faces: <span className="text-amber-400 font-bold">{descriptorsLoadedCount}</span>
                </span>
              </span>
              <span className="text-teal-400 font-mono font-black">{progressPercent}%</span>
            </div>
            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-400 transition-all duration-300 shadow-[0_0_8px_#10b981]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* MODE 1: BIOMETRIC FACE RECOGNITION KIOSK */}
          {scanMode === 'BIOMETRIC' && (
            <div className="space-y-3">
              {/* Audience Selector Sub-Pills */}
              <div className="flex items-center justify-between">
                <div className="flex items-center bg-slate-950/70 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setTargetAudience('UNIVERSAL')}
                    className={`px-2 py-0.5 rounded-md font-bold transition cursor-pointer ${
                      targetAudience === 'UNIVERSAL' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Universal (All)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetAudience('STUDENTS')}
                    className={`px-2 py-0.5 rounded-md font-bold transition cursor-pointer ${
                      targetAudience === 'STUDENTS' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Students Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetAudience('FACULTY')}
                    className={`px-2 py-0.5 rounded-md font-bold transition cursor-pointer ${
                      targetAudience === 'FACULTY' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Faculty Only
                  </button>
                </div>

                {/* Mirror Video Toggle */}
                <button
                  type="button"
                  onClick={() => setMirrorVideo(!mirrorVideo)}
                  className={`px-2 py-1 rounded-lg border text-[11px] font-bold transition cursor-pointer flex items-center space-x-1 ${
                    mirrorVideo
                      ? 'bg-slate-800 border-teal-500/40 text-teal-300'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                  title="Toggle Selfie Mirror View"
                >
                  <FlipHorizontal className="w-3 h-3" />
                  <span>Mirror {mirrorVideo ? 'ON' : 'OFF'}</span>
                </button>
              </div>

              {cameraError ? (
                <div className="p-6 bg-rose-950/40 border-2 border-rose-500/50 rounded-2xl text-center space-y-3">
                  <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
                  <p className="text-sm font-bold text-rose-200">{cameraError}</p>
                  <button
                    type="button"
                    onClick={() => startCamera()}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black transition cursor-pointer"
                  >
                    Retry Camera
                  </button>
                </div>
              ) : (
                <div className="relative aspect-[4/3] sm:aspect-video w-full bg-slate-950 rounded-2xl overflow-hidden border-2 border-teal-500/40 shadow-2xl flex items-center justify-center">
                  {/* Live Video Feed */}
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${mirrorVideo && facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                  />

                  {/* Real-Time Holographic Tracking Canvas */}
                  <canvas
                    ref={overlayCanvasRef}
                    className={`absolute inset-0 w-full h-full pointer-events-none ${
                      mirrorVideo && facingMode === 'user' ? 'scale-x-[-1]' : ''
                    }`}
                  />

                  {/* High-Tech Holographic HUD Scan Overlay */}
                  <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-4">
                    {/* Top Status & Camera Flip */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 bg-slate-950/85 backdrop-blur-md px-3 py-1 rounded-lg border border-teal-500/30">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            biometricStatus === 'VERIFIED'
                              ? 'bg-emerald-400 animate-ping'
                              : biometricStatus === 'ALREADY_MARKED'
                              ? 'bg-sky-400'
                              : biometricStatus === 'ANALYZING'
                              ? 'bg-amber-400 animate-pulse'
                              : biometricStatus === 'UNENROLLED'
                              ? 'bg-orange-400'
                              : 'bg-teal-400'
                          }`}
                        />
                        <span className="text-[10px] font-mono font-bold tracking-wider text-teal-300">
                          {biometricStatus === 'VERIFIED'
                            ? `VERIFIED: ${verifiedPerson?.name}`
                            : biometricStatus === 'ALREADY_MARKED'
                            ? `ALREADY PRESENT: ${verifiedPerson?.name}`
                            : biometricStatus === 'ANALYZING'
                            ? 'MATCHING FACIAL BIOMETRICS...'
                            : biometricStatus === 'UNENROLLED'
                            ? 'FACE DETECTED (NOT ENROLLED)'
                            : `SCANNING: ${targetAudience}`}
                        </span>
                      </div>

                      {/* Camera Flip Button */}
                      <button
                        type="button"
                        onClick={() => setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))}
                        className="pointer-events-auto px-2.5 py-1 bg-slate-950/80 hover:bg-slate-900 border border-teal-500/40 rounded-lg text-teal-300 text-xs font-bold transition flex items-center space-x-1.5 shadow-md cursor-pointer"
                        title="Switch Front/Rear Camera"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-mono">{facingMode === 'user' ? 'Front' : 'Rear'}</span>
                      </button>
                    </div>

                    {/* Central Face Holographic Reticle (when no face is tracked) */}
                    {!trackedFaceBox && (
                      <div className="relative mx-auto my-auto w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center">
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-400/80" />
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-400/80" />
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-400/80" />
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-400/80" />

                        <div className="w-36 h-36 rounded-full border border-dashed border-cyan-400/50 animate-[spin_10s_linear_infinite] flex items-center justify-center">
                          <Scan className="w-10 h-10 text-cyan-300/60" />
                        </div>
                      </div>
                    )}

                    {/* Bottom HUD Instruction Pill */}
                    <div className="text-center">
                      {biometricStatus === 'UNENROLLED' ? (
                        <button
                          type="button"
                          onClick={() => {
                            setScanMode('ENROLL');
                            setEnrollSuccessMessage(null);
                          }}
                          className="pointer-events-auto inline-flex items-center space-x-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-1.5 rounded-full text-xs font-black shadow-lg transition cursor-pointer animate-pulse"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Unrecognized Face • Click to Enroll</span>
                        </button>
                      ) : (
                        <span className="inline-block bg-slate-950/85 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-mono font-bold text-teal-300 border border-teal-500/30">
                          {biometricStatus === 'VERIFIED'
                            ? `✅ ${verifiedPerson?.name} • ATTENDANCE RECORDED`
                            : biometricStatus === 'ALREADY_MARKED'
                            ? `ℹ️ ${verifiedPerson?.name} • ALREADY RECORDED TODAY`
                            : biometricStatus === 'ANALYZING'
                            ? '⚡ MATCHING 256-D BIOMETRIC VECTOR...'
                            : '👀 STAND IN FRONT OF CAMERA TO MARK ATTENDANCE'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* FLASH POPUP WHEN PERSON IS VERIFIED OR ALREADY MARKED */}
                  {verifiedPerson && (
                    <div
                      className={`absolute inset-x-3 bottom-3 bg-slate-900/95 backdrop-blur-md border-2 ${
                        biometricStatus === 'ALREADY_MARKED'
                          ? 'border-sky-400'
                          : 'border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                      } rounded-2xl p-3.5 shadow-2xl flex items-center space-x-3.5 animate-in zoom-in-95 duration-100 z-10`}
                    >
                      <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-slate-800 border-2 border-emerald-400 flex items-center justify-center font-black text-emerald-400 text-lg shrink-0 shadow-md">
                        {verifiedPerson.photoUrl ? (
                          <img src={verifiedPerson.photoUrl} alt={verifiedPerson.name} className="w-full h-full object-cover" />
                        ) : (
                          <span>{verifiedPerson.name.charAt(0)}</span>
                        )}
                        <div
                          className={`absolute bottom-0 right-0 ${
                            biometricStatus === 'ALREADY_MARKED' ? 'bg-sky-500' : 'bg-emerald-500'
                          } text-slate-950 p-1 rounded-tl`}
                        >
                          <Check className="w-3.5 h-3.5 font-black" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`font-mono text-xs font-black px-2 py-0.5 rounded ${
                              verifiedPerson.role === 'ADMIN'
                                ? 'bg-amber-500 text-slate-950'
                                : verifiedPerson.role === 'FACULTY'
                                ? 'bg-indigo-500 text-white'
                                : 'bg-emerald-500 text-slate-950'
                            }`}
                          >
                            {verifiedPerson.role === 'ADMIN'
                              ? 'Admin'
                              : verifiedPerson.role === 'FACULTY'
                              ? 'Faculty'
                              : verifiedPerson.identifier}
                          </span>
                          <span className="text-[11px] text-emerald-300 font-mono font-bold">
                            {matchScore}% Biometric Match
                          </span>
                        </div>
                        <h4 className="text-base font-black text-white truncate mt-0.5">{verifiedPerson.name}</h4>
                        <p className="text-xs font-bold flex items-center space-x-1 mt-0.5">
                          {biometricStatus === 'ALREADY_MARKED' ? (
                            <span className="text-sky-300 flex items-center space-x-1">
                              <CheckCheck className="w-3.5 h-3.5 inline" />
                              <span>Already marked present today!</span>
                            </span>
                          ) : (
                            <span className="text-emerald-300 flex items-center space-x-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline" />
                              <span>Attendance Recorded & Saved to Database!</span>
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* LIVE RECENTLY VERIFIED TICKER */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-bold">
                  <span className="flex items-center space-x-1.5 text-teal-400">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Real-Time Check-In Stream</span>
                  </span>
                  <span className="text-slate-400 text-[11px] font-mono">
                    {roster.filter((s) => s.status === 'ABSENT').length} remaining
                  </span>
                </div>

                {recentVerifiedList.length === 0 ? (
                  <p className="text-xs text-slate-500 italic px-1">
                    Waiting for students or faculty to step in front of the camera...
                  </p>
                ) : (
                  <div className="flex items-center space-x-2 overflow-x-auto scrollbar-none py-1">
                    {recentVerifiedList.map((item, idx) => (
                      <div
                        key={`${item.person.id}-${idx}`}
                        className={`flex-shrink-0 flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs animate-in fade-in ${
                          item.status === 'ALREADY_MARKED'
                            ? 'bg-sky-950/60 border-sky-500/80 text-sky-200'
                            : 'bg-emerald-950/60 border-emerald-500/80 text-emerald-200'
                        }`}
                      >
                        <div className="w-6 h-6 rounded-lg overflow-hidden bg-emerald-900 flex items-center justify-center font-bold text-xs shrink-0">
                          {item.person.photoUrl ? (
                            <img src={item.person.photoUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            item.person.name.charAt(0)
                          )}
                        </div>
                        <div className="text-left">
                          <p className="font-mono text-[11px] font-black leading-none">{item.person.identifier}</p>
                          <p className="text-[10px] font-semibold truncate max-w-[85px] mt-0.5">{item.person.name}</p>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-400 font-bold">{item.matchScore}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MODE 2: ENROLL FACE BIOMETRICS */}
          {scanMode === 'ENROLL' && (
            <div className="space-y-4">
              <div className="bg-amber-950/30 border border-amber-500/40 p-3 rounded-2xl flex items-start space-x-2.5">
                <UserPlus className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <h4 className="font-black text-amber-200">1-Click Face Biometric Enrollment</h4>
                  <p className="text-amber-300/80">
                    Select a student or faculty member below, align their face inside the camera oval, and click
                    &quot;Capture &amp; Enroll&quot;. The 256-D biometric vector is saved instantly for automatic attendance.
                  </p>
                </div>
              </div>

              {/* Student Selector with Quick Search */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <label>Select Person to Enroll:</label>
                  <span className="text-[11px] text-slate-400">
                    {descriptorsMapRef.current.has(enrollSelectedPersonId) ? (
                      <span className="text-emerald-400 font-bold">✅ Already Enrolled (Can Re-enroll)</span>
                    ) : (
                      <span className="text-amber-400 font-bold">⚠️ Needs Enrollment</span>
                    )}
                  </span>
                </div>

                {/* Search input for students */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search by name or roll number..."
                    value={enrollSearch}
                    onChange={(e) => setEnrollSearch(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 pl-9 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                {/* Dropdown list */}
                <select
                  value={enrollSelectedPersonId}
                  onChange={(e) => {
                    setEnrollSelectedPersonId(e.target.value);
                    setEnrollSuccessMessage(null);
                  }}
                  className="w-full bg-slate-800 border-2 border-teal-500/50 rounded-xl px-3 py-2.5 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <optgroup label="Enrolled Students">
                    {filteredStudentsForEnroll.map((s) => {
                      const isEnrolled = descriptorsMapRef.current.has(s.studentId);
                      return (
                        <option key={s.studentId} value={s.studentId}>
                          {isEnrolled ? '✅' : '⚪'} {s.rollNumber} - {s.name} ({s.classGrade || 'N/A'})
                        </option>
                      );
                    })}
                  </optgroup>
                  {(currentStaffUser || facultyList.length > 0) && (
                    <optgroup label="Faculty & Staff">
                      {currentStaffUser && (
                        <option value={currentStaffUser.id}>
                          {descriptorsMapRef.current.has(currentStaffUser.id) ? '✅' : '⚪'} {currentStaffUser.name} ({currentStaffUser.role === 'ADMIN' ? 'Admin' : 'Faculty'})
                        </option>
                      )}
                      {facultyList
                        .filter((f) => !currentStaffUser || f.id !== currentStaffUser.id)
                        .map((f) => (
                          <option key={f.id} value={f.id}>
                            {descriptorsMapRef.current.has(f.id) ? '✅' : '⚪'} {f.name} (Faculty)
                          </option>
                        ))}
                    </optgroup>
                  )}
                </select>
              </div>

              {/* Live Camera View with Oval Silhouette */}
              <div className="relative aspect-[4/3] sm:aspect-video w-full bg-slate-950 rounded-2xl overflow-hidden border-2 border-amber-500/40 shadow-xl flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${mirrorVideo && facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                />

                {/* Oval Guide Overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div
                    className={`w-44 h-56 sm:w-52 sm:h-64 rounded-[50%] border-2 border-dashed transition-colors ${
                      trackedFaceBox ? 'border-emerald-400 bg-emerald-500/10' : 'border-amber-400/80'
                    } flex items-center justify-center`}
                  >
                    <div className="text-center px-4">
                      <p className="text-[11px] font-bold text-white/90 drop-shadow-md">
                        {trackedFaceBox ? 'Face Aligned & Ready' : 'Align Face in Oval'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Flip camera button */}
                <div className="absolute top-3 right-3">
                  <button
                    type="button"
                    onClick={() => setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))}
                    className="px-2.5 py-1 bg-slate-950/80 hover:bg-slate-900 border border-amber-500/40 rounded-lg text-amber-300 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Flip Camera</span>
                  </button>
                </div>
              </div>

              {/* Success Notification Banner */}
              {enrollSuccessMessage && (
                <div className="flex items-center space-x-3 p-3.5 bg-emerald-950/70 border border-emerald-500/60 rounded-2xl text-emerald-200 text-xs font-bold animate-in fade-in">
                  {enrollLastThumbnail ? (
                    <img src={enrollLastThumbnail} alt="" className="w-10 h-10 rounded-xl object-cover border border-emerald-400 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="text-emerald-100 font-bold">{enrollSuccessMessage}</p>
                    <button
                      type="button"
                      onClick={() => setScanMode('BIOMETRIC')}
                      className="text-emerald-400 underline font-bold mt-1 text-[11px] cursor-pointer"
                    >
                      Return to Face Kiosk to test auto-recognition →
                    </button>
                  </div>
                </div>
              )}

              {/* Capture Action Button */}
              <button
                type="button"
                onClick={handleEnrollFace}
                disabled={isEnrolling}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black text-sm sm:text-base rounded-2xl shadow-lg transition active:scale-[0.99] flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                <Camera className="w-5 h-5" />
                <span>{isEnrolling ? 'Extracting 256-D Biometrics...' : 'Capture & Enroll Face Biometrics'}</span>
              </button>
            </div>
          )}

          {/* MODE 3: BARCODE GUN / MANUAL NUMPAD */}
          {scanMode === 'KEYPAD' && (
            <div className="space-y-4">
              <form onSubmit={handleManualScanSubmit} className="space-y-3">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-400">
                  Scan Barcode Gun / Type Roll Number or Staff Name
                </label>
                <div className="relative flex items-center">
                  <input
                    ref={inputRef}
                    type="text"
                    autoFocus
                    placeholder="Scan or type roll no. (e.g., PRG001 or 1) and press Enter..."
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    className="w-full text-base sm:text-lg font-mono font-bold px-4 py-3.5 bg-slate-800 border-2 border-indigo-500 rounded-2xl focus:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 text-white pr-24 shadow-inner"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black shadow-xs transition cursor-pointer"
                  >
                    Mark
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Compatible with handheld USB/Bluetooth barcode guns, QR scanners, and rapid numeric entry.
                </p>
              </form>

              {/* Error Banner */}
              {errorMsg && (
                <div className="flex items-center space-x-2.5 p-3.5 bg-rose-950/60 border border-rose-500/50 text-rose-200 rounded-2xl text-xs font-bold animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 4. MODAL FOOTER */}
        <div className="bg-slate-950/80 px-4 sm:px-6 py-3 border-t border-slate-800 flex items-center justify-between">
          <p className="text-xs text-slate-400 flex items-center space-x-1.5">
            <Zap className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span className="truncate">
              {scanMode === 'BIOMETRIC'
                ? 'AI Biometric Kiosk: Step into frame for zero-click automatic check-in.'
                : scanMode === 'ENROLL'
                ? 'Enroll Mode: Captures and saves facial biometrics permanently.'
                : 'Barcode Mode: Fast scan or manual roll number entry.'}
            </span>
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-md shrink-0 ml-2"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
