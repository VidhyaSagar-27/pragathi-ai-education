'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  UserPlus,
  Camera,
  Upload,
  X,
  Check,
  Copy,
  AlertCircle,
  Sparkles,
  Phone,
  School,
  User,
  GraduationCap,
  Image as ImageIcon,
  CheckCircle2,
} from 'lucide-react';
import { compressProfileImage } from '@/lib/utils/imageCompression';
import { broadcastDataChange } from '@/lib/utils/syncEvents';

interface FastRegisterStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStudentCreated: () => void;
}

export default function FastRegisterStudentModal({
  isOpen,
  onClose,
  onStudentCreated,
}: FastRegisterStudentModalProps) {
  const [nextRoll, setNextRoll] = useState<string>('PRG001');
  const [rollStatus, setRollStatus] = useState<{
    nextRollNumber: string;
    nextSequentialRollNumber: string;
    vacantRollNumbers: string[];
    hasVacant: boolean;
    activeCount: number;
  }>({
    nextRollNumber: 'PRG001',
    nextSequentialRollNumber: 'PRG001',
    vacantRollNumbers: [],
    hasVacant: false,
    activeCount: 0,
  });
  const [rollMode, setRollMode] = useState<'DEFAULT' | 'NEXT_SEQUENCE' | 'CUSTOM'>('DEFAULT');
  const [customRollInput, setCustomRollInput] = useState('');

  const [name, setName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [classGrade, setClassGrade] = useState('');
  const [parentName, setParentName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Photo state
  const [photoData, setPhotoData] = useState<string>('');
  const [photoSizeKB, setPhotoSizeKB] = useState<number | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdResult, setCreatedResult] = useState<{
    rollNumber: string;
    initialPassword: string;
    name: string;
    phone: string;
    email?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch roll number status when modal opens
  const fetchNextRoll = async () => {
    try {
      const res = await fetch(`/api/admin/students/register?_t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setRollStatus(data);
        setNextRoll(data.nextRollNumber || 'PRG001');
      }
    } catch (e) {
      console.warn('Could not fetch next roll number preview:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNextRoll();
      setErrorMsg(null);
      setCreatedResult(null);
      setCopied(false);
      setRollMode('DEFAULT');
      setCustomRollInput('');
    }
  }, [isOpen]);

  // Compute the chosen roll number based on mode
  const getEffectiveRollNumber = () => {
    if (rollMode === 'CUSTOM' && customRollInput.trim()) {
      return customRollInput.trim().toUpperCase();
    }
    if (rollMode === 'NEXT_SEQUENCE') {
      return rollStatus.nextSequentialRollNumber;
    }
    return rollStatus.nextRollNumber || 'PRG001';
  };

  // Handle image file selection (from camera or gallery)
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    setErrorMsg(null);
    try {
      const result = await compressProfileImage(file, {
        maxWidth: 400,
        maxHeight: 400,
        quality: 0.82,
        mimeType: 'image/jpeg',
      });
      setPhotoData(result.dataUrl);
      setPhotoSizeKB(result.sizeKB);
    } catch (err: any) {
      console.error('Image compression failed:', err);
      setErrorMsg('Failed to process photo. Please choose another image.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    const effectiveRoll = getEffectiveRollNumber();

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/students/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          schoolName: schoolName.trim(),
          classGrade: classGrade.trim(),
          parentName: parentName.trim(),
          phone: cleanPhone,
          email: email.trim() || undefined,
          photoData: photoData || undefined,
          selectedRollNumber: effectiveRoll,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to register student');
      }

      setCreatedResult({
        rollNumber: data.credentials.rollNumber,
        initialPassword: data.credentials.initialPassword,
        name: data.student.name,
        phone: cleanPhone,
        email: email.trim() || undefined,
      });

      broadcastDataChange('students', 'create');
      onStudentCreated();
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during student registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!createdResult) return;
    const text = `PRAGATHI AI LOGIN CREDENTIALS\nStudent Name: ${createdResult.name}\nLogin ID / Roll Number: ${createdResult.rollNumber}\nInitial Password: ${createdResult.initialPassword}\nPortal Link: https://pragathi-ai-education.vercel.app/login`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleRegisterNext = () => {
    // Keep school and class for fast batch entry, reset student-specific fields
    setName('');
    setParentName('');
    setPhone('');
    setEmail('');
    setPhotoData('');
    setPhotoSizeKB(null);
    setCreatedResult(null);
    setErrorMsg(null);
    setCopied(false);
    setRollMode('DEFAULT');
    setCustomRollInput('');
    fetchNextRoll();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 text-white rounded-t-3xl">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <UserPlus className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Fast Student Registration</h2>
              <p className="text-xs text-teal-200">Mobile-first batch enrollment workflow</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success View after creating student */}
        {createdResult ? (
          <div className="p-6 sm:p-8 space-y-6 text-center">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center border-2 border-emerald-200 shadow-sm animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900">Student Registered Successfully!</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Account created and ready for immediate student login.
              </p>
            </div>

            <div className="p-5 bg-gradient-to-br from-slate-50 to-teal-50/40 border border-teal-200 rounded-2xl text-left space-y-3 shadow-inner">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="text-xs font-semibold text-slate-500">Student Name</span>
                <span className="text-sm font-bold text-slate-900">{createdResult.name}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="text-xs font-semibold text-slate-500">Login ID / Roll Number</span>
                <span className="text-base font-black font-mono text-teal-800 bg-teal-100 px-2.5 py-0.5 rounded-lg border border-teal-300">
                  {createdResult.rollNumber}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-xs font-semibold text-slate-500 block">Initial Password</span>
                  <span className="text-[10px] text-slate-400">Registered phone number</span>
                </div>
                <span className="text-base font-black font-mono text-slate-900 bg-white px-2.5 py-0.5 rounded-lg border border-slate-300">
                  {createdResult.initialPassword}
                </span>
              </div>
            </div>

            {/* Auto-Dispatch Confirmation Banner */}
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-start space-x-2.5 text-left">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-900">Credentials Dispatched Automatically</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Roll Number and login password sent to WhatsApp (<strong>{createdResult.phone}</strong>)
                  {createdResult.email ? ` and Email (<strong>${createdResult.email}</strong>)` : ''}.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={handleCopyCredentials}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center space-x-2 transition cursor-pointer shadow-2xs"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                <span>{copied ? 'Credentials Copied!' : 'Copy Credentials'}</span>
              </button>

              <button
                type="button"
                onClick={handleRegisterNext}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold bg-teal-600 hover:bg-teal-700 text-white flex items-center justify-center space-x-2 transition cursor-pointer shadow-sm"
              >
                <UserPlus className="w-4 h-4" />
                <span>Register Next Student</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              Done & Close
            </button>
          </div>
        ) : (
          /* Registration Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Roll Number Assignment Options */}
            {rollStatus.hasVacant ? (
              <div className="p-4 bg-gradient-to-br from-amber-50 to-teal-50/40 border border-amber-300 rounded-2xl space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-amber-950 font-bold text-xs">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Roll Number Assignment Options</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-200 text-amber-900">
                    Removed Number Available
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  A previously removed student roll number is vacant. Choose whether to reuse the removed number, continue with the next sequence, or enter a custom number:
                </p>

                <div className="space-y-2 pt-1">
                  {/* Option 1: Reuse Removed Number (Recommended) */}
                  <label
                    className={`flex items-start space-x-3 p-2.5 rounded-xl border cursor-pointer transition ${
                      rollMode === 'DEFAULT'
                        ? 'bg-white border-teal-500 ring-2 ring-teal-500/20 shadow-xs'
                        : 'bg-white/60 border-slate-200 hover:bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="rollSelection"
                      checked={rollMode === 'DEFAULT'}
                      onChange={() => setRollMode('DEFAULT')}
                      className="mt-0.5 text-teal-600 focus:ring-teal-500"
                    />
                    <div className="flex-1 text-xs">
                      <div className="flex items-center justify-between">
                        <strong className="text-slate-900">
                          Reuse Removed Number:{' '}
                          <span className="font-mono text-teal-700 font-black">
                            {rollStatus.vacantRollNumbers[0]}
                          </span>
                        </strong>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-bold">
                          Recommended
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Assigns vacant roll number from the recently deleted student.
                      </p>
                    </div>
                  </label>

                  {/* Option 2: Continue Next Sequence */}
                  <label
                    className={`flex items-start space-x-3 p-2.5 rounded-xl border cursor-pointer transition ${
                      rollMode === 'NEXT_SEQUENCE'
                        ? 'bg-white border-teal-500 ring-2 ring-teal-500/20 shadow-xs'
                        : 'bg-white/60 border-slate-200 hover:bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="rollSelection"
                      checked={rollMode === 'NEXT_SEQUENCE'}
                      onChange={() => setRollMode('NEXT_SEQUENCE')}
                      className="mt-0.5 text-teal-600 focus:ring-teal-500"
                    />
                    <div className="flex-1 text-xs">
                      <strong className="text-slate-900">
                        Continue Next Sequence:{' '}
                        <span className="font-mono text-slate-700 font-bold">
                          {rollStatus.nextSequentialRollNumber}
                        </span>
                      </strong>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Leaves removed number gap and proceeds with the next sequential number.
                      </p>
                    </div>
                  </label>

                  {/* Option 3: Custom Roll Number */}
                  <label
                    className={`flex items-start space-x-3 p-2.5 rounded-xl border cursor-pointer transition ${
                      rollMode === 'CUSTOM'
                        ? 'bg-white border-teal-500 ring-2 ring-teal-500/20 shadow-xs'
                        : 'bg-white/60 border-slate-200 hover:bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="rollSelection"
                      checked={rollMode === 'CUSTOM'}
                      onChange={() => setRollMode('CUSTOM')}
                      className="mt-0.5 text-teal-600 focus:ring-teal-500"
                    />
                    <div className="flex-1 text-xs">
                      <strong className="text-slate-900">Specify Custom Roll Number</strong>
                      {rollMode === 'CUSTOM' && (
                        <div className="mt-2">
                          <input
                            type="text"
                            placeholder="e.g. PRG001"
                            value={customRollInput}
                            onChange={(e) => setCustomRollInput(e.target.value.toUpperCase())}
                            className="w-full sm:w-44 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                          />
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              </div>
            ) : (
              /* When no roll numbers are vacant */
              <div className="p-3.5 bg-teal-50/80 border border-teal-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-teal-600" />
                    <span className="text-xs font-semibold text-teal-900">
                      Assigned Roll Number:
                    </span>
                    <span className="text-xs font-black font-mono px-2.5 py-1 bg-teal-600 text-white rounded-lg shadow-2xs">
                      {rollMode === 'CUSTOM' && customRollInput.trim()
                        ? customRollInput.trim()
                        : rollStatus.nextRollNumber}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (rollMode === 'CUSTOM') {
                        setRollMode('DEFAULT');
                        setCustomRollInput('');
                      } else {
                        setRollMode('CUSTOM');
                        setCustomRollInput(rollStatus.nextRollNumber);
                      }
                    }}
                    className="text-[11px] font-bold text-teal-700 hover:text-teal-900 underline cursor-pointer"
                  >
                    {rollMode === 'CUSTOM' ? 'Use Auto Number' : 'Customize Number'}
                  </button>
                </div>

                {rollMode === 'CUSTOM' && (
                  <div className="pt-2 border-t border-teal-200 flex items-center space-x-2">
                    <span className="text-[11px] text-teal-800 font-medium shrink-0">
                      Enter Custom Number:
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. PRG001"
                      value={customRollInput}
                      onChange={(e) => setCustomRollInput(e.target.value.toUpperCase())}
                      className="w-36 px-2.5 py-1 bg-white border border-teal-300 rounded-lg text-xs font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Photo Capture & Upload Box */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Student Photo (Camera or Upload)
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoSelect}
                className="hidden"
              />

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center space-x-4">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white border-2 border-teal-500/40 flex items-center justify-center shrink-0 shadow-inner">
                  {photoData ? (
                    <img src={photoData} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-8 h-8 text-slate-300" />
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      disabled={isCompressing}
                      className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 transition cursor-pointer shadow-2xs"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Take Photo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isCompressing}
                      className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition cursor-pointer shadow-2xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Choose File</span>
                    </button>

                    {photoData && (
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoData('');
                          setPhotoSizeKB(null);
                        }}
                        className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {photoSizeKB ? (
                    <p className="text-[11px] text-emerald-700 font-semibold flex items-center space-x-1">
                      <Check className="w-3 h-3" />
                      <span>Optimized & compressed: {photoSizeKB} KB (stored in DB)</span>
                    </p>
                  ) : isCompressing ? (
                    <p className="text-[11px] text-teal-600 font-medium">Compressing photo...</p>
                  ) : (
                    <p className="text-[11px] text-slate-400">
                      High-resolution phone photos automatically resized to &lt;50KB.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Student Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Student Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
            </div>

            {/* School & Class */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  School Name *
                </label>
                <input
                  type="text"
                  required
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="e.g. ZPHS High School"
                  className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Class / Grade *
                </label>
                <input
                  type="text"
                  required
                  value={classGrade}
                  onChange={(e) => setClassGrade(e.target.value)}
                  placeholder="e.g. 9 or 10"
                  className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                />
              </div>
            </div>

            {/* Parent Name & Phone Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Parent / Guardian Name
                </label>
                <input
                  type="text"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder="e.g. Suresh Sharma"
                  className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Phone Number (Initial Password) *
                  </label>
                </div>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="10-digit mobile number"
                  className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                />
                <span className="text-[10px] text-teal-700 mt-1 block">
                  Siblings can share parent phone. Password is auto-set to this phone.
                </span>
              </div>
            </div>

            {/* Optional Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Student / Parent Email <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Optional - leave blank if student has no email"
                className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
            </div>

            {/* Submit CTA */}
            <div className="pt-2 flex items-center justify-end space-x-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isCompressing}
                className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white text-xs font-bold rounded-xl transition shadow-sm disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>{isSubmitting ? 'Registering...' : `Create Student (${nextRoll})`}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
