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
  Search,
  FlipHorizontal,
  Maximize2,
  Minimize2,
  Check,
  Zap,
  CheckCheck,
} from 'lucide-react';

export interface StudentItem {
  studentId: string;
  name: string;
  rollNumber: string;
  photoUrl?: string;
  classGrade?: string;
  section?: string;
  schoolName?: string;
  phone?: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  remarks?: string;
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
  // Mode: KEYPAD (Barcode gun / Roll number) or CAMERA (QR Code scanner)
  const [scanMode, setScanMode] = useState<'KEYPAD' | 'CAMERA'>('KEYPAD');
  const [inputCode, setInputCode] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastScanned, setLastScanned] = useState<{
    student: StudentItem;
    timestamp: string;
    isAlready: boolean;
  } | null>(null);

  // Camera scanner state
  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scannedIdsRef = useRef<Set<string>>(new Set());
  const cooldownRef = useRef<boolean>(false);

  // Audio chimes
  const playChime = useCallback((type: 'SUCCESS' | 'ALREADY' | 'ERROR') => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'SUCCESS') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.08); // A5
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      } else if (type === 'ALREADY') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      }
    } catch {}
  }, [soundEnabled]);

  // Voice announcement
  const speakAnnouncement = useCallback((text: string) => {
    if (!voiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch {}
  }, [voiceEnabled]);

  // Auto-Save Attendance to Server API
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
        console.warn('Attendance auto-save background sync error:', e);
      }
    },
    [dateStr]
  );

  // Process verified student scan
  const handleMarkStudentScanned = useCallback(
    (student: StudentItem) => {
      const isAlready =
        student.status === 'PRESENT' || scannedIdsRef.current.has(student.studentId);

      scannedIdsRef.current.add(student.studentId);
      onMarkStudent(student.studentId, 'PRESENT');
      persistAttendanceRecord(student.studentId);

      setLastScanned({
        student,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        isAlready,
      });

      if (isAlready) {
        playChime('ALREADY');
        speakAnnouncement(`${student.name}, already marked.`);
      } else {
        playChime('SUCCESS');
        speakAnnouncement(`${student.name}, present!`);
      }

      setErrorMsg(null);
    },
    [onMarkStudent, persistAttendanceRecord, playChime, speakAnnouncement]
  );

  // Focus input on open or mode switch
  useEffect(() => {
    if (isOpen && scanMode === 'KEYPAD') {
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [isOpen, scanMode]);

  // Stop camera helper
  const stopCamera = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // Start camera helper
  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError('Unable to access camera. Please check camera permissions or use Keypad mode.');
      setCameraActive(false);
    }
  }, [facingMode, stopCamera]);

  // Camera toggle effect
  useEffect(() => {
    if (isOpen && scanMode === 'CAMERA') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, scanMode, startCamera, stopCamera]);

  // Camera QR / Barcode scanning loop using native BarcodeDetector
  useEffect(() => {
    if (!isOpen || scanMode !== 'CAMERA' || !cameraActive) return;

    let isScanning = true;
    let detector: any = null;

    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        detector = new (window as any).BarcodeDetector({
          formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'data_matrix'],
        });
      } catch {}
    }

    const interval = setInterval(async () => {
      if (!isScanning || !videoRef.current || cooldownRef.current || !detector) return;
      const video = videoRef.current;
      if (video.readyState < 2 || video.paused) return;

      try {
        const barcodes = await detector.detect(video);
        if (barcodes && barcodes.length > 0) {
          const rawVal = barcodes[0].rawValue?.trim().toUpperCase();
          if (rawVal) {
            const matched = roster.find((s) => {
              const r = s.rollNumber.toUpperCase();
              return (
                r === rawVal ||
                rawVal.includes(r) ||
                r.endsWith(rawVal) ||
                rawVal.endsWith(r)
              );
            });

            if (matched) {
              cooldownRef.current = true;
              handleMarkStudentScanned(matched);
              setTimeout(() => {
                cooldownRef.current = false;
              }, 1200);
            }
          }
        }
      } catch {}
    }, 150);

    return () => {
      isScanning = false;
      clearInterval(interval);
    };
  }, [isOpen, scanMode, cameraActive, roster, handleMarkStudentScanned]);

  if (!isOpen) return null;

  // Handle manual / barcode gun submit
  const handleKeypadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = inputCode.trim().toUpperCase();
    if (!query) return;

    // Match exact roll number or prefix/suffix or number e.g. "1" -> "PRG001"
    const matched = roster.find((s) => {
      const r = s.rollNumber.toUpperCase();
      if (r === query) return true;
      const numOnly = query.replace(/^PRG/i, '');
      if (numOnly && (r === `PRG${numOnly.padStart(3, '0')}` || r.endsWith(numOnly))) return true;
      if (s.name.toUpperCase() === query) return true;
      if (s.phone && s.phone.endsWith(query)) return true;
      return false;
    });

    if (matched) {
      handleMarkStudentScanned(matched);
      setInputCode('');
      setTimeout(() => inputRef.current?.focus(), 60);
    } else {
      setErrorMsg(`No student found matching "${query}". Check roll number.`);
      playChime('ERROR');
    }
  };

  const presentCount = roster.filter((s) => s.status === 'PRESENT' || s.status === 'LATE').length;
  const totalCount = roster.length;
  const percentPresent = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 px-5 sm:px-6 py-4 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10 shrink-0">
              <QrCode className="w-6 h-6 text-teal-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] uppercase tracking-wider font-extrabold text-teal-300">
                  Attendance Terminal
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-teal-400 text-slate-950">
                  {dateStr}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight leading-snug">
                QR & Roll Number Fast Scanner
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
            title="Close Scanner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="px-6 pt-3 pb-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
          <div className="flex bg-slate-200/90 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setScanMode('KEYPAD')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                scanMode === 'KEYPAD'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-teal-600" />
              <span>Barcode Gun & Roll No</span>
            </button>
            <button
              type="button"
              onClick={() => setScanMode('CAMERA')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                scanMode === 'CAMERA'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Camera className="w-3.5 h-3.5 text-teal-600" />
              <span>Camera QR Scanner</span>
            </button>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-1.5 rounded-lg border transition cursor-pointer ${
                soundEnabled
                  ? 'bg-teal-50 text-teal-800 border-teal-200'
                  : 'bg-slate-100 text-slate-400 border-slate-200'
              }`}
              title={soundEnabled ? 'Chime Sound Enabled' : 'Sound Muted'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`px-2 py-1 rounded-lg border text-[11px] font-bold transition cursor-pointer ${
                voiceEnabled
                  ? 'bg-teal-50 text-teal-800 border-teal-200'
                  : 'bg-slate-100 text-slate-400 border-slate-200'
              }`}
              title={voiceEnabled ? 'Voice Announcements On' : 'Voice Off'}
            >
              Voice {voiceEnabled ? 'On' : 'Off'}
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          {/* Live Attendance Progress Bar */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
              <span className="flex items-center space-x-1.5">
                <Users className="w-3.5 h-3.5 text-teal-600" />
                <span>Today&apos;s Attendance Tally</span>
              </span>
              <span className="text-teal-800 font-mono font-black">
                {presentCount} / {totalCount} Present ({percentPresent}%)
              </span>
            </div>
            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-teal-500 to-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${percentPresent}%` }}
              />
            </div>
          </div>

          {/* MODE 1: KEYPAD / BARCODE GUN */}
          {scanMode === 'KEYPAD' && (
            <div className="space-y-4">
              <form onSubmit={handleKeypadSubmit} className="space-y-2.5">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600">
                  Scan Barcode Gun or Type Roll Number
                </label>
                <div className="relative flex items-center">
                  <input
                    ref={inputRef}
                    type="text"
                    autoFocus
                    placeholder="e.g. PRG001 or 1 and hit Enter..."
                    value={inputCode}
                    onChange={(e) => {
                      setInputCode(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    className="w-full text-base sm:text-lg font-mono font-bold px-4 py-3 bg-slate-50 border-2 border-teal-500 rounded-2xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/20 text-slate-900 pr-24 shadow-inner"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black shadow-xs transition cursor-pointer"
                  >
                    Mark
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Compatible with all standard USB & Bluetooth barcode scanner guns or manual typing.
                </p>
              </form>

              {/* Error Message */}
              {errorMsg && (
                <div className="flex items-center space-x-2.5 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>
          )}

          {/* MODE 2: CAMERA QR SCANNER */}
          {scanMode === 'CAMERA' && (
            <div className="space-y-3">
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-video flex items-center justify-center border-2 border-teal-500 shadow-md">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* QR Targeting Frame Box */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-56 h-56 border-2 border-teal-400 rounded-2xl shadow-[0_0_20px_rgba(45,212,191,0.5)] relative">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-lg"></div>
                  </div>
                </div>

                {/* Camera Flip Button */}
                <button
                  type="button"
                  onClick={() => setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))}
                  className="absolute bottom-3 right-3 p-2 bg-slate-900/80 hover:bg-slate-900 text-white rounded-xl backdrop-blur-md text-xs font-bold transition flex items-center space-x-1 cursor-pointer border border-white/10"
                >
                  <FlipHorizontal className="w-3.5 h-3.5 text-teal-300" />
                  <span>Flip</span>
                </button>
              </div>

              {cameraError && (
                <div className="flex items-center space-x-2.5 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{cameraError}</span>
                </div>
              )}

              <p className="text-center text-xs text-slate-500 font-medium">
                Hold student QR card or ID badge steadily in front of the camera.
              </p>
            </div>
          )}

          {/* Last Scanned Feedback Card */}
          {lastScanned && (
            <div
              className={`border-2 rounded-2xl p-4 flex items-center space-x-4 animate-in zoom-in-95 duration-150 ${
                lastScanned.isAlready
                  ? 'bg-sky-50/80 border-sky-300'
                  : 'bg-emerald-50/80 border-emerald-400'
              }`}
            >
              <div
                className={`relative w-12 h-12 rounded-full overflow-hidden bg-white border-2 flex items-center justify-center font-black shrink-0 shadow-2xs ${
                  lastScanned.isAlready
                    ? 'border-sky-400 text-sky-800'
                    : 'border-emerald-500 text-emerald-800'
                }`}
              >
                {lastScanned.student.photoUrl ? (
                  <img
                    src={lastScanned.student.photoUrl}
                    alt={lastScanned.student.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{lastScanned.student.name.charAt(0)}</span>
                )}
                <div
                  className={`absolute -bottom-1 -right-1 text-white rounded-full p-0.5 shadow-2xs ${
                    lastScanned.isAlready ? 'bg-sky-600' : 'bg-emerald-600'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-slate-900 text-white">
                    {lastScanned.student.rollNumber}
                  </span>
                  <span className="text-[11px] text-slate-500 font-semibold">
                    {lastScanned.timestamp}
                  </span>
                  {lastScanned.student.classGrade && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-bold">
                      Grade {lastScanned.student.classGrade}
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-black text-slate-900 truncate mt-0.5">
                  {lastScanned.student.name}
                </h4>
                <p
                  className={`text-xs font-bold ${
                    lastScanned.isAlready ? 'text-sky-800' : 'text-emerald-800'
                  }`}
                >
                  {lastScanned.isAlready ? 'Already Marked Present' : 'Marked Present Successfully!'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-5 sm:px-6 py-3.5 border-t border-slate-200 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Tip: Press Enter after each student to rapidly mark attendance.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
