'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  Save,
  Clock,
  Search,
  QrCode,
  Trash2,
  GraduationCap,
  Phone,
  MessageSquare,
  ArrowLeft,
  MoreVertical,
  Check,
  RotateCcw,
  LayoutGrid,
  List,
  Bell,
  X,
  Lightbulb,
  History,
  AlertTriangle,
  Users,
} from 'lucide-react';
import FastAttendanceScannerModal from '@/components/FastAttendanceScannerModal';
import QuickNavigationHeader from '@/components/QuickNavigationHeader';

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

interface AttendanceOverviewData {
  markedDates: string[];
  studentStats: Array<{
    studentId: string;
    name: string;
    rollNumber: string;
    classGrade?: string;
    schoolName?: string;
    photoUrl: string;
    totalClasses: number;
    present: number;
    absent: number;
    percentage: number | null;
    isLowAttendance: boolean;
  }>;
  overallPercentage: number | null;
  totalMarkedDates: number;
}

interface WeekDayItem {
  dateStr: string;
  dayName: string;
  dayNum: number;
  isToday: boolean;
  isSelected: boolean;
}

export default function AdminAttendancePage() {
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const getYesterdayStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  };

  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());
  const [activeTab, setActiveTab] = useState<'MARK' | 'HISTORY'>('MARK');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [deletingDate, setDeletingDate] = useState<boolean>(false);
  const [roster, setRoster] = useState<StudentRosterItem[]>([]);
  const [isMarkedAlready, setIsMarkedAlready] = useState<boolean>(false);
  const [markerInfo, setMarkerInfo] = useState<any>(null);
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PRESENT' | 'ABSENT'>('ALL');
  const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>('GRID');
  const [absenteeModalOpen, setAbsenteeModalOpen] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [overviewData, setOverviewData] = useState<AttendanceOverviewData | null>(null);
  const [fastScanOpen, setFastScanOpen] = useState<boolean>(false);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const loadDateAttendance = async (dateStr: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/attendance?date=${dateStr}&_t=${Date.now()}`);
      if (!res.ok) throw new Error('Failed to load attendance');
      const data = await res.json();
      setRoster(data.students || []);
      setIsMarkedAlready(Boolean(data.isMarkedForDate));
      setMarkerInfo(data.markerInfo);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadOverview = async () => {
    try {
      const res = await fetch(`/api/admin/attendance?overview=true&_t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setOverviewData(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadDateAttendance(selectedDate);
    loadOverview();
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
    if (!grade || grade === 'Not Specified' || grade === 'ALL') return 'All Classes';
    return grade.toLowerCase().startsWith('class') ? grade : `Class ${grade}`;
  };

  // Helper: Generate current week days around selectedDate
  const weekDays = useMemo<WeekDayItem[]>(() => {
    try {
      const current = new Date(selectedDate + 'T00:00:00');
      const todayStr = getTodayStr();
      const dayOfWeek = current.getDay(); // 0 is Sunday, 1 is Monday...
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
        month: 'long',
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

  // Filter roster by selected class
  const rosterForClass = useMemo(() => {
    if (selectedClass === 'ALL') return roster;
    return roster.filter((s) => (s.classGrade || '').trim() === selectedClass);
  }, [roster, selectedClass]);

  // Toggle single student status between PRESENT and ABSENT
  const toggleStudentStatus = (studentId: string) => {
    setRoster((prev) =>
      prev.map((s) => {
        if (s.studentId !== studentId) return s;
        const newStatus = s.status === 'ABSENT' ? 'PRESENT' : 'ABSENT';
        return { ...s, status: newStatus };
      })
    );
  };

  const setSpecificStatus = (studentId: string, status: 'PRESENT' | 'ABSENT') => {
    setRoster((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, status } : s))
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

  const updateRemark = (studentId: string, remarks: string) => {
    setRoster((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, remarks } : s))
    );
  };

  const handleSaveAttendance = async () => {
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
      if (!res.ok) throw new Error(data.error || 'Failed to save attendance');

      setSuccessToast(`Attendance saved successfully for ${formattedDateLong}!`);
      setIsMarkedAlready(true);
      setAbsenteeModalOpen(false);
      await loadOverview();
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Error saving attendance');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDate = async (targetDate?: string) => {
    const dStr = targetDate || selectedDate;
    if (!window.confirm(`Are you sure you want to remove attendance records for ${dStr}? This will completely delete the recorded attendance for this date.`)) {
      return;
    }

    setDeletingDate(true);
    try {
      const res = await fetch(`/api/admin/attendance?date=${dStr}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete attendance');

      setSuccessToast(`Attendance for ${dStr} has been removed.`);
      setIsMarkedAlready(false);
      await loadDateAttendance(selectedDate);
      await loadOverview();
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Error deleting date attendance');
    } finally {
      setDeletingDate(false);
    }
  };

  const filteredRoster = useMemo(() => {
    return rosterForClass.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.phone.includes(searchQuery);

      if (!matchesSearch) return false;
      if (statusFilter === 'PRESENT') return s.status === 'PRESENT' || s.status === 'LATE';
      if (statusFilter === 'ABSENT') return s.status === 'ABSENT';
      return true;
    });
  }, [rosterForClass, searchQuery, statusFilter]);

  const presentCount = rosterForClass.filter((s) => s.status === 'PRESENT' || s.status === 'LATE').length;
  const absentCount = rosterForClass.filter((s) => s.status === 'ABSENT').length;
  const absenteesList = useMemo(() => rosterForClass.filter((s) => s.status === 'ABSENT'), [rosterForClass]);
  const totalInView = rosterForClass.length;

  return (
    <div className="space-y-5 max-w-4xl mx-auto pb-24">
      {/* Universal Quick Navigation Header */}
      <QuickNavigationHeader
        title="Institutional Attendance Register"
        subtitle="Select session date, confirm attendance on the roll number grid, and inspect historical rosters."
        role="ADMIN"
        extraActions={
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setFastScanOpen(true)}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-2xs cursor-pointer"
              title="Fast QR & Barcode Attendance Terminal"
            >
              <QrCode className="w-3.5 h-3.5 text-teal-400" />
              <span>Fast Scanner</span>
            </button>

            {/* Switch between MARK and HISTORY */}
            <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
              <button
                type="button"
                onClick={() => setActiveTab('MARK')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                  activeTab === 'MARK'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Daily Marking</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('HISTORY')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                  activeTab === 'HISTORY'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>History ({overviewData?.totalMarkedDates || 0})</span>
              </button>
            </div>
          </div>
        }
      />

      {/* Success Notification Banner */}
      {successToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-sm font-semibold flex items-center space-x-2 animate-fadeIn shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 1: DAILY ATTENDANCE MARKING (Exact Screenshots Flow)       */}
      {/* ============================================================== */}
      {activeTab === 'MARK' ? (
        <>
          {/* 1. SCHEDULE & DATE SELECTOR BAR (Exact Screen 1 Match) */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
            {/* Top Header: Schedule + Month/Year Calendar Picker Button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {selectedClass !== 'ALL' && (
                  <button
                    type="button"
                    onClick={() => setSelectedClass('ALL')}
                    className="p-1.5 hover:bg-slate-100 rounded-full text-slate-700 transition cursor-pointer"
                    title="Back to Schedule"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {selectedClass === 'ALL' ? 'Schedule' : formatClassLabel(selectedClass)}
                </h2>
              </div>

              {/* Month/Year Calendar Button ("dated will be selected and confirmed by us") */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => dateInputRef.current?.showPicker ? dateInputRef.current.showPicker() : dateInputRef.current?.focus()}
                  className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs sm:text-sm font-bold transition cursor-pointer border border-slate-200"
                  title="Click to select any date on calendar"
                >
                  <CalendarIcon className="w-4 h-4 text-slate-700" />
                  <span>{monthYearStr}</span>
                </button>
                <input
                  ref={dateInputRef}
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    if (e.target.value) {
                      setSelectedDate(e.target.value);
                    }
                  }}
                  className="absolute opacity-0 pointer-events-none w-0 h-0"
                />
              </div>
            </div>

            {/* Horizontal Week Days Strip with Coral-Red Active Pill */}
            <div className="flex items-center justify-between gap-1.5 sm:gap-2 overflow-x-auto py-1">
              {weekDays.map((item) => (
                <button
                  key={item.dateStr}
                  type="button"
                  onClick={() => setSelectedDate(item.dateStr)}
                  className={`flex-1 min-w-[44px] py-2.5 sm:py-3 px-1 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                    item.isSelected
                      ? 'bg-[#d94d43] text-white shadow-md ring-2 ring-[#d94d43]/30 scale-105'
                      : 'bg-white hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <span className={`text-[11px] font-semibold uppercase ${item.isSelected ? 'text-white' : 'text-slate-400'}`}>
                    {item.dayName}
                  </span>
                  <span className={`text-base sm:text-lg font-black mt-0.5 ${item.isSelected ? 'text-white' : 'text-slate-800'}`}>
                    {item.dayNum}
                  </span>
                </button>
              ))}
            </div>

            {/* Quick Date Jump Shortcuts & Date Confirmation */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center space-x-2">
                <span className="text-slate-500 font-medium">Confirmed Date:</span>
                <span className="font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                  {formattedDateLong}
                </span>
              </div>

              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedDate(getTodayStr())}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    selectedDate === getTodayStr()
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDate(getYesterdayStr())}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    selectedDate === getYesterdayStr()
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Yesterday
                </button>
              </div>
            </div>
          </div>

          {/* 2. SCHEDULE SESSIONS LIST (When in ALL view, Screen 1 Cards) */}
          {selectedClass === 'ALL' && (
            <div className="space-y-3.5">
              {/* Lavender Info Box with Lightbulb */}
              <div className="bg-[#e0e1f3] text-[#2d3154] rounded-2xl p-4 flex items-center space-x-3 shadow-2xs">
                <Lightbulb className="w-5 h-5 text-indigo-700 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-semibold">
                  Tap on a Class/Lab/Exam to take attendance
                </span>
              </div>

              {/* Session Cards */}
              <div className="space-y-3">
                {classList.length === 0 ? (
                  <div
                    onClick={() => setSelectedClass('ALL')}
                    className="bg-[#f0f9eb] rounded-2xl p-4.5 border border-emerald-200/60 shadow-2xs relative overflow-hidden flex items-center justify-between cursor-pointer hover:shadow-md transition"
                  >
                    <div className="w-2 h-full absolute left-0 top-0 bottom-0 bg-[#7cb342]"></div>
                    <div className="pl-3 space-y-1.5">
                      <h3 className="font-bold text-slate-900 text-base">
                        General Class Attendance Session
                      </h3>
                      <p className="text-xs text-slate-600 font-medium">
                        10:55 AM - 11:45 AM
                      </p>
                      <div className="flex items-center space-x-1.5 pt-1">
                        <span className="px-2.5 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-[11px] font-semibold">
                          2025 - 2026
                        </span>
                        <span className="px-2.5 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-[11px] font-semibold">
                          All Enrolled ({roster.length})
                        </span>
                      </div>
                    </div>
                    <div>
                      {isMarkedAlready ? (
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-2xs">
                          <Check className="w-5 h-5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-600 flex items-center justify-center shadow-2xs">
                          <MoreVertical className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  classList.map((cls, idx) => {
                    const countInClass = roster.filter((s) => (s.classGrade || '').trim() === cls).length;
                    const isEven = idx % 2 === 0;
                    return (
                      <div
                        key={cls}
                        onClick={() => setSelectedClass(cls)}
                        className={`rounded-2xl p-4.5 border shadow-2xs relative overflow-hidden flex items-center justify-between cursor-pointer hover:shadow-md transition ${
                          isEven
                            ? 'bg-[#f4fbf4] border-emerald-200/80 hover:border-emerald-300'
                            : 'bg-[#eef6f9] border-sky-200/80 hover:border-sky-300'
                        }`}
                      >
                        {/* Left Accent Color Strip */}
                        <div
                          className={`w-2 h-full absolute left-0 top-0 bottom-0 ${
                            isEven ? 'bg-[#7cb342]' : 'bg-[#29b6f6]'
                          }`}
                        ></div>

                        <div className="pl-3 space-y-1.5">
                          <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                            {formatClassLabel(cls)} Session
                          </h3>
                          <p className="text-xs text-slate-600 font-medium">
                            {isEven ? '9:15 AM - 10:55 AM' : '3:10 PM - 4:00 PM'}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="px-2.5 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-[11px] font-semibold">
                              2025 - 2026
                            </span>
                            <span className="px-2.5 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-[11px] font-semibold">
                              Sem No: {isEven ? '3' : '1'}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-[11px] font-semibold">
                              {cls} ({countInClass})
                            </span>
                          </div>
                        </div>

                        <div className="pl-2">
                          {isMarkedAlready ? (
                            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-2xs">
                              <Check className="w-5 h-5 stroke-[3]" />
                            </div>
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-600 flex items-center justify-center shadow-2xs">
                              <MoreVertical className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* 3. ATTENDANCE MARKING INTERFACE (Screen 3 Roll Number Grid) */}
          {selectedClass !== 'ALL' && (
            <div className="space-y-4">
              {/* Lavender Notice Banner with Lightbulb */}
              <div className="bg-[#e0e1f3] text-[#2d3154] rounded-2xl p-4 flex items-start space-x-3 shadow-2xs">
                <Lightbulb className="w-5 h-5 text-indigo-700 mt-0.5 flex-shrink-0" />
                <div className="text-xs sm:text-sm font-semibold leading-relaxed">
                  {isMarkedAlready ? (
                    <span>
                      Attendance has already been recorded. You are now editing the existing entry to update or correct any details as needed.
                    </span>
                  ) : (
                    <span>
                      All students are marked present by default. Click on any roll number to mark as absent.
                    </span>
                  )}
                </div>
              </div>

              {/* Subtitle Section: Attendance for session */}
              <div className="space-y-0.5 px-1">
                <p className="text-xs text-slate-500 font-medium">
                  Attendance for the following session
                </p>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  {formattedDateLong}, 10:55 AM - 11:45 AM
                </h3>
              </div>

              {/* Action Row: Instructions + Mark All Absent / Reset */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 pt-1">
                <span className="text-xs font-semibold text-slate-500">
                  Click on the roll number to mark as absent
                </span>

                <div className="flex items-center space-x-4 text-xs font-bold">
                  {statusFilter !== 'ALL' && (
                    <button
                      type="button"
                      onClick={() => setStatusFilter('ALL')}
                      className="text-slate-600 hover:underline cursor-pointer"
                    >
                      Show All ({rosterForClass.length})
                    </button>
                  )}

                  {absentCount === rosterForClass.length ? (
                    <button
                      type="button"
                      onClick={() => markClassAll('PRESENT')}
                      className="text-[#0c3960] hover:underline cursor-pointer"
                    >
                      Mark all as present
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => markClassAll('ABSENT')}
                      className="text-[#0c3960] hover:underline cursor-pointer"
                    >
                      Mark all as absent
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={resetAttendance}
                    className="text-[#ea580c] hover:underline cursor-pointer"
                  >
                    Reset
                  </button>

                  {/* View Switcher: Roll Grid vs Table */}
                  <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setViewMode('GRID')}
                      className={`p-1 rounded cursor-pointer ${
                        viewMode === 'GRID' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                      }`}
                      title="Roll Number Grid"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('TABLE')}
                      className={`p-1 rounded cursor-pointer ${
                        viewMode === 'TABLE' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                      }`}
                      title="Detailed Table"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search by roll number or student name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#0c3960]/20 focus:border-[#0c3960]"
                />
              </div>

              {/* THE ROLL NUMBER GRID */}
              {loading ? (
                <div className="py-20 text-center">
                  <div className="inline-block w-8 h-8 border-4 border-[#0c3960] border-t-transparent rounded-full animate-spin mb-3"></div>
                  <p className="text-sm font-semibold text-slate-500">Loading student roster...</p>
                </div>
              ) : filteredRoster.length === 0 ? (
                <div className="py-16 text-center text-slate-500 text-sm bg-white rounded-2xl border border-slate-200">
                  No students found for this class or filter.
                </div>
              ) : viewMode === 'GRID' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-3.5">
                  {filteredRoster.map((student) => {
                    const isAbsent = student.status === 'ABSENT';
                    return (
                      <div
                        key={student.studentId}
                        onClick={() => toggleStudentStatus(student.studentId)}
                        className={`h-16 sm:h-20 rounded-xl sm:rounded-2xl transition-all duration-150 flex items-center justify-center relative cursor-pointer select-none active:scale-95 shadow-2xs ${
                          isAbsent
                            ? 'bg-white border-2 border-[#e53935] hover:border-red-600 ring-2 ring-red-500/10'
                            : 'bg-white border-2 border-[#5cb85c] hover:border-emerald-600'
                        }`}
                      >
                        <span
                          className={`font-bold text-sm sm:text-base tracking-wide ${
                            isAbsent ? 'text-[#e53935]' : 'text-slate-800'
                          }`}
                        >
                          {student.rollNumber || '—'}
                        </span>

                        {isAbsent && (
                          <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-[#e53935] text-white text-[10px] font-bold rounded-sm uppercase tracking-wider">
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
                  <div className="overflow-x-auto max-h-[550px] overflow-y-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                        <tr>
                          <th className="py-3 px-4">Roll Number</th>
                          <th className="py-3 px-4">Student</th>
                          <th className="py-3 px-4">Contact</th>
                          <th className="py-3 px-4 text-center">Status</th>
                          <th className="py-3 px-4">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                        {filteredRoster.map((student) => {
                          const isAbsent = student.status === 'ABSENT';
                          return (
                            <tr key={student.studentId} className={isAbsent ? 'bg-rose-50/30' : ''}>
                              <td className="py-3 px-4 font-bold text-slate-900 font-mono">
                                {student.rollNumber}
                              </td>
                              <td className="py-3 px-4 font-semibold text-slate-800">
                                {student.name}
                              </td>
                              <td className="py-3 px-4 text-slate-600">
                                {student.phone ? (
                                  <a href={`tel:${student.phone}`} className="text-teal-700 hover:underline">
                                    {student.phone}
                                  </a>
                                ) : (
                                  '—'
                                )}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <button
                                  type="button"
                                  onClick={() => toggleStudentStatus(student.studentId)}
                                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                                    isAbsent
                                      ? 'bg-rose-600 text-white'
                                      : 'bg-emerald-600 text-white'
                                  }`}
                                >
                                  {isAbsent ? 'Absent' : 'Present'}
                                </button>
                              </td>
                              <td className="py-3 px-4">
                                <input
                                  type="text"
                                  placeholder="Optional note"
                                  value={student.remarks}
                                  onChange={(e) => updateRemark(student.studentId, e.target.value)}
                                  className="px-2 py-1 text-xs border border-slate-200 rounded-lg w-full max-w-xs"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Remove Date Attendance */}
              {isMarkedAlready && (
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleDeleteDate(selectedDate)}
                    disabled={deletingDate}
                    className="text-xs text-rose-700 hover:text-rose-900 font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{deletingDate ? 'Removing...' : 'Remove Attendance for this Date'}</span>
                  </button>
                </div>
              )}

              {/* Fixed Bottom CTA: Deep Navy Blue "Submit Attendance" Button */}
              <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-slate-200 z-30">
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
                  <div className="text-xs text-slate-600 font-medium hidden sm:block">
                    <span>{presentCount} Present</span>
                    <span className="mx-1.5">•</span>
                    <span className="text-rose-600 font-bold">{absentCount} Absent</span>
                    <span className="mx-1.5">•</span>
                    <span>Total {totalInView}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setAbsenteeModalOpen(true)}
                    disabled={saving || roster.length === 0}
                    className="w-full sm:w-auto flex-1 sm:flex-initial sm:min-w-[280px] py-3.5 px-6 bg-[#0c3960] hover:bg-[#082a48] text-white font-bold text-base rounded-xl shadow-lg transition active:scale-[0.99] flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                  >
                    <span>Submit Attendance</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        /* ============================================================== */
        /* TAB 2: ATTENDANCE HISTORY & OVERVIEW ROSTER                     */
        /* ============================================================== */
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Days Recorded</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{overviewData?.totalMarkedDates || 0}</p>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overall Attendance Rate</span>
              <p className="text-2xl font-black text-teal-700 mt-1">{overviewData?.overallPercentage || 0}%</p>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">At-Risk Students (&lt;75%)</span>
              <p className="text-2xl font-black text-rose-600 mt-1">
                {overviewData?.studentStats?.filter((s) => s.isLowAttendance).length || 0}
              </p>
            </div>
          </div>

          {/* Past Recorded Dates */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Past Recorded Class Dates</h3>
                <p className="text-xs text-slate-500">
                  Click Edit / View to change student records or remove a date completely.
                </p>
              </div>
            </div>

            {overviewData?.markedDates && overviewData.markedDates.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {overviewData.markedDates.map((d) => (
                  <div key={d} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-slate-100 text-slate-700 rounded-xl">
                        <CalendarIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">
                          {new Date(d).toLocaleDateString('en-IN', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                        <span className="text-xs text-slate-400 font-mono">{d}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDate(d);
                          setActiveTab('MARK');
                        }}
                        className="px-3.5 py-1.5 bg-[#0c3960] hover:bg-[#082a48] text-white rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
                      >
                        Edit / View Attendance
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteDate(d)}
                        className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer"
                        title="Delete this date"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">
                No class attendance dates recorded yet.
              </div>
            )}
          </div>

          {/* Student Wise Attendance Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Student Attendance Roster & Percentages</h3>
                <p className="text-xs text-slate-500">Calculated strictly from held class sessions</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Roll Number</th>
                    <th className="py-3 px-4">Class</th>
                    <th className="py-3 px-4">Classes Held</th>
                    <th className="py-3 px-4">Attended</th>
                    <th className="py-3 px-4">Absent</th>
                    <th className="py-3 px-4">Percentage</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {overviewData?.studentStats?.map((s) => (
                    <tr key={s.studentId} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">{s.name}</td>
                      <td className="py-3 px-4 font-mono font-bold text-xs">{s.rollNumber}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-xs text-slate-600">
                          {formatClassLabel(s.classGrade || '')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{s.totalClasses}</td>
                      <td className="py-3 px-4 font-semibold text-emerald-700">{s.present}</td>
                      <td className="py-3 px-4 font-semibold text-rose-700">{s.absent}</td>
                      <td className="py-3 px-4">
                        {s.percentage !== null ? (
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900">{s.percentage}%</span>
                            <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  s.percentage >= 75 ? 'bg-teal-600' : 'bg-rose-500'
                                }`}
                                style={{ width: `${s.percentage}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">No classes yet</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {s.isLowAttendance ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              <span>At Risk (&lt;75%)</span>
                            </span>
                          ) : s.percentage !== null ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>On Track</span>
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}

                          {s.isLowAttendance && (
                            <a
                              href={`https://wa.me/?text=${encodeURIComponent(
                                `Dear Parent, this is an official update from Pragathi AI. Your ward ${s.name} (Roll: ${s.rollNumber}) has an attendance of ${s.percentage}%. Please ensure regular attendance for upcoming classes.`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center space-x-1 px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg transition shadow-2xs"
                              title="Notify Parent on WhatsApp"
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span>Notify Parent</span>
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. ABSENTEES BOTTOM SHEET / CONFIRMATION MODAL (Screen 4 Match) */}
      {/* ============================================================== */}
      {absenteeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-slideUp">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">
                Absentees
              </h3>
              <div className="flex items-center space-x-3">
                <span className="text-sm font-bold text-slate-900">
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

            {/* Modal Body: List of Absent Students */}
            <div className="p-5 overflow-y-auto space-y-3 flex-1">
              {absentCount === 0 ? (
                <div className="p-6 text-center space-y-2">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-base">
                    All Students Present!
                  </h4>
                  <p className="text-xs text-slate-500">
                    Zero absentees recorded for this session. Click Proceed to confirm attendance.
                  </p>
                </div>
              ) : (
                absenteesList.map((st) => {
                  const waUrl = st.phone
                    ? `https://wa.me/91${st.phone.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(
                        `Dear Parent, regarding ${st.name} (Roll: ${st.rollNumber}), this is to notify that the student was absent for ${formatClassLabel(st.classGrade || '')} on ${formattedDateLong}.`
                      )}`
                    : null;

                  return (
                    <div
                      key={st.studentId}
                      className="p-3.5 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-2xs hover:border-slate-300 transition"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        {/* Avatar Initial in Bold Navy */}
                        <div className="w-10 h-10 rounded-xl bg-slate-100 text-[#0c3960] font-black text-lg flex items-center justify-center shrink-0">
                          {st.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 text-xs sm:text-sm uppercase tracking-wide truncate">
                            {st.name}
                          </h4>
                          <p className="text-xs text-slate-500 font-medium">
                            {st.rollNumber}
                          </p>
                        </div>
                      </div>

                      {/* Direct Parent Contact Icons */}
                      {st.phone && (
                        <div className="flex items-center space-x-1.5 shrink-0">
                          <a
                            href={`tel:${st.phone}`}
                            className="p-2 text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                            title={`Call ${st.phone}`}
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                          {waUrl && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                              title="Send WhatsApp Notice"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Bottom CTA: Deep Navy Blue "Proceed" Button */}
            <div className="p-5 border-t border-slate-100 bg-slate-50/50 space-y-2">
              <button
                type="button"
                onClick={handleSaveAttendance}
                disabled={saving}
                className="w-full py-3.5 px-6 bg-[#0c3960] hover:bg-[#082a48] text-white font-bold text-base rounded-xl shadow-md transition active:scale-[0.99] flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                <span>{saving ? 'Saving Records...' : 'Proceed'}</span>
              </button>

              <button
                type="button"
                onClick={() => setAbsenteeModalOpen(false)}
                className="w-full py-2 text-center text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Keep Editing Roster
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
        onMarkStudent={(studentId, status, remarks) => {
          setSpecificStatus(studentId, status);
          if (remarks) updateRemark(studentId, remarks);
        }}
      />
    </div>
  );
}
