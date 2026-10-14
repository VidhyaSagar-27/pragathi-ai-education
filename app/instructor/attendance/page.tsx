'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  QrCode,
  Trash2,
  UserPlus,
  Phone,
  MessageSquare,
  ArrowLeft,
  LayoutGrid,
  List,
  X,
} from 'lucide-react';
import FastAttendanceScannerModal from '@/components/FastAttendanceScannerModal';
import FastRegisterStudentModal from '@/components/FastRegisterStudentModal';

interface StudentRosterItem {
  studentId: string;
  name: string;
  rollNumber: string;
  classGrade?: string;
  section?: string;
  schoolName?: string;
  phone: string;
  photoUrl: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  remarks: string;
  isRecorded: boolean;
}

interface WeekDayItem {
  dateStr: string;
  dayName: string;
  dayNum: number;
  isToday: boolean;
  isSelected: boolean;
}

export default function InstructorAttendancePage() {
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const getYesterdayStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  };

  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [deletingDate, setDeletingDate] = useState<boolean>(false);
  const [roster, setRoster] = useState<StudentRosterItem[]>([]);
  const [isMarkedAlready, setIsMarkedAlready] = useState<boolean>(false);
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>('GRID');
  const [absenteeModalOpen, setAbsenteeModalOpen] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [fastScanOpen, setFastScanOpen] = useState<boolean>(false);
  const [addStudentOpen, setAddStudentOpen] = useState<boolean>(false);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const loadAttendance = async (dateStr: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/attendance?date=${dateStr}&_t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setRoster(data.students || []);
        setIsMarkedAlready(Boolean(data.isMarkedForDate));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance(selectedDate);
  }, [selectedDate]);

  // Dynamic class list from roster
  const classList = useMemo(() => {
    const set = new Set<string>();
    roster.forEach((s) => {
      const val = (s.classGrade || '').trim();
      if (val && val !== 'Not Specified') {
        set.add(val);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [roster]);

  const formatClassLabel = (grade: string) => {
    if (!grade || grade === 'Not Specified' || grade === 'ALL') return 'All';
    return grade.toLowerCase().startsWith('class') ? grade : `Class ${grade}`;
  };

  // Generate current week days around selectedDate
  const weekDays = useMemo<WeekDayItem[]>(() => {
    try {
      const current = new Date(selectedDate + 'T00:00:00');
      const todayStr = getTodayStr();
      const dayOfWeek = current.getDay();
      const diffToMonday = (dayOfWeek + 6) % 7;

      const monday = new Date(current);
      monday.setDate(current.getDate() - diffToMonday);

      const days: WeekDayItem[] = [];
      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

      for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        days.push({
          dateStr,
          dayName: dayNames[i],
          dayNum: d.getDate(),
          isToday: dateStr === todayStr,
          isSelected: dateStr === selectedDate,
        });
      }
      return days;
    } catch {
      return [];
    }
  }, [selectedDate]);

  const formattedDateLong = useMemo(() => {
    try {
      return new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  const monthYearStr = useMemo(() => {
    try {
      return new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-GB', {
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  const rosterForClass = useMemo(() => {
    if (selectedClass === 'ALL') return roster;
    return roster.filter((s) => (s.classGrade || '').trim() === selectedClass);
  }, [roster, selectedClass]);

  const toggleStudentStatus = (studentId: string) => {
    setRoster((prev) =>
      prev.map((s) => {
        if (s.studentId !== studentId) return s;
        const newStatus = s.status === 'ABSENT' ? 'PRESENT' : 'ABSENT';
        return { ...s, status: newStatus };
      })
    );
  };

  const markClassAll = (status: 'PRESENT' | 'ABSENT') => {
    if (selectedClass === 'ALL') {
      setRoster((prev) => prev.map((s) => ({ ...s, status })));
    } else {
      setRoster((prev) =>
        prev.map((s) => ((s.classGrade || '').trim() === selectedClass ? { ...s, status } : s))
      );
    }
  };

  const resetAttendance = () => {
    markClassAll('PRESENT');
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccessToast(null);
    try {
      const payload = {
        date: selectedDate,
        records: roster.map((s) => ({
          studentId: s.studentId,
          status: s.status,
          remarks: s.remarks,
        })),
      };

      const res = await fetch('/api/admin/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');

      setSuccessToast(`Attendance saved for ${formattedDateLong}!`);
      setIsMarkedAlready(true);
      setAbsenteeModalOpen(false);
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Error saving attendance');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDate = async () => {
    if (!window.confirm(`Remove attendance for ${formattedDateLong}?`)) return;

    setDeletingDate(true);
    try {
      const res = await fetch(`/api/admin/attendance?date=${selectedDate}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete attendance');

      setSuccessToast(`Attendance for ${formattedDateLong} removed.`);
      setIsMarkedAlready(false);
      await loadAttendance(selectedDate);
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Error removing date attendance');
    } finally {
      setDeletingDate(false);
    }
  };

  const presentCount = rosterForClass.filter((s) => s.status === 'PRESENT' || s.status === 'LATE').length;
  const absentCount = rosterForClass.filter((s) => s.status === 'ABSENT').length;
  const absenteesList = useMemo(() => rosterForClass.filter((s) => s.status === 'ABSENT'), [rosterForClass]);

  return (
    <div className="w-full max-w-4xl mx-auto px-2.5 sm:px-4 pb-24 space-y-2.5">
      {/* 1. ULTRA-SLEEK COMPACT APP BAR */}
      <div className="flex items-center justify-between pt-1 pb-1">
        <div className="flex items-center space-x-2">
          <Link
            href="/instructor"
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              Attendance
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">
              {formattedDateLong} • {isMarkedAlready ? <span className="text-emerald-700 font-bold">Saved</span> : <span className="text-amber-700 font-bold">Unsaved</span>}
            </p>
          </div>
        </div>

        {/* Right Action Icons: Date picker + Fast Scanner + Add Student */}
        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={() => dateInputRef.current?.showPicker ? dateInputRef.current.showPicker() : dateInputRef.current?.focus()}
            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold transition border border-slate-200 cursor-pointer"
            title="Pick date"
          >
            <CalendarIcon className="w-3.5 h-3.5 text-slate-600" />
            <span>{monthYearStr}</span>
          </button>
          <input
            ref={dateInputRef}
            type="date"
            value={selectedDate}
            onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
            className="absolute opacity-0 pointer-events-none w-0 h-0"
          />

          <button
            type="button"
            onClick={() => setFastScanOpen(true)}
            className="p-1.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition cursor-pointer"
            title="Fast QR/Barcode Scanner"
          >
            <QrCode className="w-4 h-4 text-teal-300" />
          </button>

          <button
            type="button"
            onClick={() => setAddStudentOpen(true)}
            className="p-1.5 rounded-xl bg-teal-600 text-white hover:bg-teal-700 transition cursor-pointer"
            title="Add New Student"
          >
            <UserPlus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successToast && (
        <div className="py-2 px-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center space-x-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* 2. COMPACT WEEK DAY STRIP (Fitted to Screen) */}
      <div className="bg-white rounded-2xl p-2 sm:p-2.5 border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between gap-1">
          {weekDays.map((item) => (
            <button
              key={item.dateStr}
              type="button"
              onClick={() => setSelectedDate(item.dateStr)}
              className={`flex-1 py-1.5 sm:py-2 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                item.isSelected
                  ? 'bg-[#d94d43] text-white shadow-xs font-black'
                  : 'hover:bg-slate-50 text-slate-600'
              }`}
            >
              <span className={`text-[10px] font-semibold uppercase ${item.isSelected ? 'text-white' : 'text-slate-400'}`}>
                {item.dayName}
              </span>
              <span className={`text-sm sm:text-base font-black mt-0.5 ${item.isSelected ? 'text-white' : 'text-slate-800'}`}>
                {item.dayNum}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. COMPACT CLASS CHIPS (Horizontal Scroll) */}
      <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none py-0.5">
        <button
          type="button"
          onClick={() => setSelectedClass('ALL')}
          className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center space-x-1 whitespace-nowrap cursor-pointer ${
            selectedClass === 'ALL'
              ? 'bg-[#0c3960] text-white shadow-2xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <span>All</span>
          <span className={`text-[10px] px-1 py-0.2 rounded-full font-mono ${selectedClass === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {roster.length}
          </span>
        </button>

        {classList.map((cls) => {
          const countInClass = roster.filter((s) => (s.classGrade || '').trim() === cls).length;
          return (
            <button
              key={cls}
              type="button"
              onClick={() => setSelectedClass(cls)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center space-x-1 whitespace-nowrap cursor-pointer ${
                selectedClass === cls
                  ? 'bg-[#0c3960] text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>{formatClassLabel(cls)}</span>
              <span className={`text-[10px] px-1 py-0.2 rounded-full font-mono ${selectedClass === cls ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {countInClass}
              </span>
            </button>
          );
        })}
      </div>

      {/* 4. ACTION ROW (Instructions + Mark All Absent / Reset) */}
      <div className="flex items-center justify-between px-1 text-xs">
        <span className="text-slate-500 font-medium text-[11px] sm:text-xs truncate">
          Tap roll number to mark absent
        </span>

        <div className="flex items-center space-x-3 text-[11px] sm:text-xs font-bold shrink-0">
          {absentCount === rosterForClass.length && rosterForClass.length > 0 ? (
            <button
              type="button"
              onClick={() => markClassAll('PRESENT')}
              className="text-[#0c3960] hover:underline cursor-pointer"
            >
              Mark all present
            </button>
          ) : (
            <button
              type="button"
              onClick={() => markClassAll('ABSENT')}
              className="text-[#0c3960] hover:underline cursor-pointer"
            >
              Mark all absent
            </button>
          )}

          <button
            type="button"
            onClick={resetAttendance}
            className="text-[#ea580c] hover:underline cursor-pointer"
          >
            Reset
          </button>

          {/* View Mode Switcher */}
          <div className="flex items-center space-x-0.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('GRID')}
              className={`p-1 rounded cursor-pointer ${viewMode === 'GRID' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-400'}`}
              title="Roll Number Grid"
            >
              <LayoutGrid className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('TABLE')}
              className={`p-1 rounded cursor-pointer ${viewMode === 'TABLE' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-400'}`}
              title="Detailed Table"
            >
              <List className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. THE ROLL NUMBER GRID (Fits 100% Screen, No Horizontal Zooming) */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block w-8 h-8 border-4 border-[#0c3960] border-t-transparent rounded-full animate-spin mb-2"></div>
          <p className="text-xs font-semibold text-slate-500">Loading roster...</p>
        </div>
      ) : rosterForClass.length === 0 ? (
        <div className="py-12 text-center text-slate-500 text-xs bg-white rounded-2xl border border-slate-200">
          No students in this class.
        </div>
      ) : viewMode === 'GRID' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-2.5">
          {rosterForClass.map((student) => {
            const isAbsent = student.status === 'ABSENT';
            return (
              <div
                key={student.studentId}
                onClick={() => toggleStudentStatus(student.studentId)}
                className={`h-14 sm:h-16 rounded-xl transition-all duration-150 flex items-center justify-center relative cursor-pointer select-none active:scale-95 shadow-2xs ${
                  isAbsent
                    ? 'bg-rose-50/50 border-2 border-[#e53935] text-[#e53935]'
                    : 'bg-white border-2 border-[#5cb85c] text-slate-800'
                }`}
              >
                <span className="font-bold text-xs sm:text-sm tracking-wide">
                  {student.rollNumber || '—'}
                </span>

                {isAbsent && (
                  <span className="absolute top-1 right-1 px-1 py-0.2 bg-[#e53935] text-white text-[9px] font-bold rounded-xs uppercase tracking-wider">
                    Ab
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Detailed Table View */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">Roll</th>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3">Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rosterForClass.map((student) => {
                  const isAbsent = student.status === 'ABSENT';
                  return (
                    <tr key={student.studentId} className={isAbsent ? 'bg-rose-50/30' : ''}>
                      <td className="py-2 px-3 font-bold font-mono">{student.rollNumber}</td>
                      <td className="py-2 px-3 font-semibold text-slate-800">{student.name}</td>
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleStudentStatus(student.studentId)}
                          className={`px-2.5 py-0.5 rounded text-[11px] font-bold cursor-pointer ${
                            isAbsent ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                          }`}
                        >
                          {isAbsent ? 'Absent' : 'Present'}
                        </button>
                      </td>
                      <td className="py-2 px-3">
                        {student.phone ? (
                          <a href={`tel:${student.phone}`} className="text-teal-700 font-medium">
                            {student.phone}
                          </a>
                        ) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete / Remove date attendance link */}
      {isMarkedAlready && (
        <div className="pt-1 flex justify-end">
          <button
            type="button"
            onClick={handleDeleteDate}
            disabled={deletingDate}
            className="text-[11px] text-rose-700 hover:text-rose-900 font-bold flex items-center space-x-1 cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
            <span>Remove attendance for this date</span>
          </button>
        </div>
      )}

      {/* 6. FIXED BOTTOM DOCK (Submit Attendance) */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 z-30 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="text-xs text-slate-600 font-semibold">
            <span className="text-emerald-700 font-black">{presentCount} Present</span>
            <span className="mx-1.5">•</span>
            <span className="text-rose-700 font-black">{absentCount} Absent</span>
          </div>

          <button
            type="button"
            onClick={() => setAbsenteeModalOpen(true)}
            disabled={saving || roster.length === 0}
            className="flex-1 sm:flex-initial sm:min-w-[240px] py-2.5 px-5 bg-[#0c3960] hover:bg-[#082a48] text-white font-bold text-sm sm:text-base rounded-xl shadow-md transition active:scale-[0.99] flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            <span>Submit Attendance</span>
          </button>
        </div>
      </div>

      {/* 7. ABSENTEES BOTTOM SHEET / CONFIRMATION MODAL */}
      {absenteeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-slideUp">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900">
                Absentees
              </h3>
              <div className="flex items-center space-x-3">
                <span className="text-xs font-bold text-slate-900">
                  Count: {absentCount}
                </span>
                <button
                  type="button"
                  onClick={() => setAbsenteeModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
              {absentCount === 0 ? (
                <div className="p-6 text-center space-y-2">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    All Students Present!
                  </h4>
                  <p className="text-xs text-slate-500">
                    Click Proceed to confirm and save attendance.
                  </p>
                </div>
              ) : (
                absenteesList.map((st) => {
                  const waUrl = st.phone
                    ? `https://wa.me/91${st.phone.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(
                        `Dear Parent, ${st.name} (Roll: ${st.rollNumber}) was absent on ${formattedDateLong}.`
                      )}`
                    : null;

                  return (
                    <div
                      key={st.studentId}
                      className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-2xs"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-[#0c3960] font-black text-sm flex items-center justify-center shrink-0">
                          {st.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide truncate">
                            {st.name}
                          </h4>
                          <p className="text-[11px] text-slate-500 font-medium">
                            {st.rollNumber}
                          </p>
                        </div>
                      </div>

                      {st.phone && (
                        <div className="flex items-center space-x-1.5 shrink-0">
                          <a
                            href={`tel:${st.phone}`}
                            className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                            title={`Call ${st.phone}`}
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                          {waUrl && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                              title="Send WhatsApp Notice"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3 px-6 bg-[#0c3960] hover:bg-[#082a48] text-white font-bold text-sm sm:text-base rounded-xl shadow-md transition active:scale-[0.99] flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                <span>{saving ? 'Saving Records...' : 'Proceed'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fast QR / Barcode Scanner Modal */}
      <FastAttendanceScannerModal
        isOpen={fastScanOpen}
        onClose={() => setFastScanOpen(false)}
        dateStr={selectedDate}
        roster={roster}
        onMarkStudent={(studentId, status) => {
          toggleStudentStatus(studentId);
        }}
      />

      {/* Fast Register Student Modal */}
      <FastRegisterStudentModal
        isOpen={addStudentOpen}
        onClose={() => setAddStudentOpen(false)}
        onStudentCreated={() => {
          loadAttendance(selectedDate);
        }}
      />
    </div>
  );
}
