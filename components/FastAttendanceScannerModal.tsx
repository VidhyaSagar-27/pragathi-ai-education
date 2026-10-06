'use client';

import React, { useState, useRef, useEffect } from 'react';
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
} from 'lucide-react';

interface StudentItem {
  studentId: string;
  name: string;
  rollNumber: string;
  photoUrl?: string;
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
  const [inputCode, setInputCode] = useState('');
  const [lastScanned, setLastScanned] = useState<{
    student: StudentItem;
    timestamp: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [scanMode, setScanMode] = useState<'KEYPAD' | 'CAMERA'>('KEYPAD');
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Play pleasant chime on successful scan
  const playChime = () => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.08); // A5
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch {}
  };

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const query = inputCode.trim().toUpperCase();
    if (!query) return;

    // Match by exact PRG number, or raw number "1" -> "PRG001", or phone
    const matched = roster.find((s) => {
      const r = s.rollNumber.toUpperCase();
      if (r === query) return true;
      const numOnly = query.replace(/^PRG/i, '');
      if (numOnly && (r === `PRG${numOnly.padStart(3, '0')}` || r.endsWith(numOnly))) return true;
      return false;
    });

    if (matched) {
      onMarkStudent(matched.studentId, 'PRESENT');
      setLastScanned({
        student: matched,
        timestamp: new Date().toLocaleTimeString(),
      });
      playChime();
      setInputCode('');
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setErrorMsg(`No student found matching "${query}". Check roll number.`);
    }
  };

  const presentCount = roster.filter((s) => s.status === 'PRESENT' || s.status === 'LATE').length;
  const totalCount = roster.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-teal-700 to-slate-900 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
              <QrCode className="w-6 h-6 text-teal-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs uppercase tracking-wider font-extrabold text-teal-300">
                  Fast Attendance Terminal
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-teal-400 text-slate-950">
                  {dateStr}
                </span>
              </div>
              <h2 className="text-lg font-black tracking-tight">QR & Roll Number Fast Scanner</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Live Progress Bar */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
              <span className="flex items-center space-x-1.5">
                <Users className="w-4 h-4 text-teal-600" />
                <span>Marked Present: {presentCount} / {totalCount}</span>
              </span>
              <span className="text-teal-700 font-black">
                {totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0}% Attendance
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-300"
                style={{ width: `${totalCount > 0 ? (presentCount / totalCount) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Scanner Input Form */}
          <form onSubmit={handleScanSubmit} className="space-y-3">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-600">
              Scan Barcode / Type Roll Number (e.g., PRG001 or 1)
            </label>
            <div className="relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                autoFocus
                placeholder="Scan or type roll no. and hit Enter..."
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                className="w-full text-base sm:text-lg font-mono font-bold px-4 py-3.5 bg-slate-50 border-2 border-teal-500 rounded-2xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/20 text-slate-900 pr-24 shadow-inner"
              />
              <button
                type="submit"
                className="absolute right-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black shadow-xs transition cursor-pointer"
              >
                Mark
              </button>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Supports barcode scanners, QR guns, or numeric entry</span>
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="inline-flex items-center space-x-1 text-slate-600 hover:text-teal-700 font-semibold"
              >
                {soundEnabled ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-teal-600" />
                    <span>Sound On</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                    <span>Sound Muted</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Error Banner */}
          {errorMsg && (
            <div className="flex items-center space-x-2.5 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Last Scanned Feedback Card */}
          {lastScanned && (
            <div className="bg-emerald-50/70 border-2 border-emerald-300 rounded-2xl p-4 flex items-center space-x-4 animate-in zoom-in-95 duration-150">
              <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-white border border-emerald-300 flex items-center justify-center font-black text-emerald-800 shrink-0 shadow-2xs">
                {lastScanned.student.photoUrl ? (
                  <img
                    src={lastScanned.student.photoUrl}
                    alt={lastScanned.student.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{lastScanned.student.name.charAt(0)}</span>
                )}
                <div className="absolute -bottom-1 -right-1 bg-emerald-600 text-white rounded-full p-0.5 shadow-2xs">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 border border-emerald-300">
                    {lastScanned.student.rollNumber}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-semibold">{lastScanned.timestamp}</span>
                </div>
                <h4 className="text-sm font-black text-slate-900 truncate mt-0.5">
                  {lastScanned.student.name}
                </h4>
                <p className="text-xs font-bold text-emerald-800">
                  Marked Present Successfully!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Tip: Press Enter after each student to rapidly mark 65+ accounts.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
