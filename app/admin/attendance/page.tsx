'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  Save,
  RotateCcw,
  UserCheck,
  AlertTriangle,
  History,
  QrCode,
  MessageSquare,
  Trash2,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import FastAttendanceScannerModal from '@/components/FastAttendanceScannerModal';

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
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [overviewData, setOverviewData] = useState<AttendanceOverviewData | null>(null);
  const [fastScanOpen, setFastScanOpen] = useState<boolean>(false);

  // Load attendance for the selected date
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

  // Load overview / history
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
    if (!grade || grade === 'Not Specified') return 'Unassigned';
    return grade.toLowerCase().startsWith('class') ? grade : `Class ${grade}`;
  };

  // Filter roster by selected class
  const rosterForClass = useMemo(() => {
    if (selectedClass === 'ALL') return roster;
    return roster.filter((s) => (s.classGrade || '').trim() === selectedClass);
  }, [roster, selectedClass]);

  // Bulk actions (scoped to active class)
  const markClassAll = (status: 'PRESENT' | 'ABSENT') => {
    if (selectedClass === 'ALL') {
      setRoster((prev) => prev.map((s) => ({ ...s, status })));
    } else {
      setRoster((prev) =>
        prev.map((s) => ((s.classGrade || '').trim() === selectedClass ? { ...s, status } : s))
      );
    }
  };

  const toggleStudent = (studentId: string, status: 'PRESENT' | 'ABSENT') => {
    setRoster((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, status } : s))
    );
  };

  const updateRemark = (studentId: string, remarks: string) => {
    setRoster((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, remarks } : s))
    );
  };

  // Save / Update attendance
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
      if (!res.ok) throw new Error(data.error || 'Failed to save');

      setSuccessToast(`Attendance saved successfully for ${selectedDate}!`);
      setIsMarkedAlready(true);
      loadOverview();
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Error saving attendance');
    } finally {
      setSaving(false);
    }
  };

  // Delete / Remove entire date attendance
  const handleDeleteDate = async (targetDate: string = selectedDate) => {
    const confirmMsg = `Are you sure you want to completely remove attendance for ${targetDate}? All attendance records for this date will be deleted.`;
    if (!window.confirm(confirmMsg)) return;

    setDeletingDate(true);
    try {
      const res = await fetch(`/api/admin/attendance?date=${targetDate}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete attendance');

      setSuccessToast(`Attendance records for ${targetDate} have been removed.`);
      if (targetDate === selectedDate) {
        setIsMarkedAlready(false);
        await loadDateAttendance(selectedDate);
      }
      await loadOverview();
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Error removing date attendance');
    } finally {
      setDeletingDate(false);
    }
  };

  // Filtered Roster for table display
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
  const totalInView = rosterForClass.length;
  const percentage = totalInView > 0 ? Math.round((presentCount / totalInView) * 100) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2 text-teal-600 font-bold text-xs uppercase tracking-wider">
            <UserCheck className="w-4 h-4" />
            <span>Academic Attendance Control</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Student Attendance System
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Select any class date, filter by class, mark or edit attendance, or remove records anytime.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200/80 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('MARK')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'MARK'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5 text-teal-600" />
            <span>Mark Attendance</span>
          </button>
          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'HISTORY'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5 text-brand-purple" />
            <span>Reports & Past Dates</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-semibold flex items-center space-x-2 animate-fadeIn shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {activeTab === 'MARK' ? (
        <>
          {/* Calendar & Date Status Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            {/* Status & Edit/Remove Notice Banner */}
            {isMarkedAlready ? (
              <div className="p-3.5 bg-emerald-50/90 border border-emerald-200 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-emerald-950">
                <div className="flex items-center space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <div>
                    <span className="font-bold">Attendance Saved for {selectedDate}</span>
                    {markerInfo?.markedByName && (
                      <span className="text-emerald-800 ml-1.5 text-[11px]">
                        (Recorded by {markerInfo.markedByName})
                      </span>
                    )}
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      You can change any student between Present and Absent below and click <strong>Update Attendance Changes</strong>.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteDate(selectedDate)}
                  disabled={deletingDate}
                  className="self-start sm:self-auto px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
                  title="Wipe and remove all attendance records for this selected date"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{deletingDate ? 'Removing...' : 'Remove This Date'}</span>
                </button>
              </div>
            ) : (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center space-x-2.5 text-slate-700">
                <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>
                  <strong>Unsaved Class Date ({selectedDate}):</strong> Mark student attendance below and click <strong>Save Attendance</strong>. You can choose any past or future date from the calendar.
                </span>
              </div>
            )}

            {/* Date Selector Row */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Select Class Date:
                  </span>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 shadow-2xs"
                  />
                </div>

                {/* Quick Date Shortcuts */}
                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedDate(getTodayStr())}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      selectedDate === getTodayStr()
                        ? 'bg-teal-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDate(getYesterdayStr())}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      selectedDate === getYesterdayStr()
                        ? 'bg-teal-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Yesterday
                  </button>
                  {overviewData?.markedDates?.slice(0, 3).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setSelectedDate(d)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        selectedDate === d
                          ? 'bg-teal-600 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center space-x-2">
                {isMarkedAlready ? (
                  <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-100/70 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Saved & Editable</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-amber-100/70 border border-amber-300 text-amber-800 text-xs font-bold rounded-full">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Not Yet Recorded</span>
                  </span>
                )}
              </div>
            </div>

            {/* CLASS CLASSIFICATION TABS */}
            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center space-x-2 mb-2">
                <GraduationCap className="w-4 h-4 text-teal-600" />
                <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  Class Classification Filter:
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedClass('ALL')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                    selectedClass === 'ALL'
                      ? 'bg-teal-700 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>All Classes</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedClass === 'ALL' ? 'bg-teal-800 text-white' : 'bg-slate-200 text-slate-700'}`}>
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
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                        selectedClass === cls
                          ? 'bg-teal-700 text-white shadow-2xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>{formatClassLabel(cls)}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedClass === cls ? 'bg-teal-800 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        {countInClass}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Attendance Counters Scoped to Active Class Filter */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
                <span className="text-[11px] font-bold text-slate-500 uppercase">
                  {selectedClass === 'ALL' ? 'Total Students' : `${formatClassLabel(selectedClass)} Count`}
                </span>
                <p className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">{totalInView}</p>
              </div>
              <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200/60">
                <span className="text-[11px] font-bold text-emerald-700 uppercase">Present</span>
                <p className="text-xl sm:text-2xl font-black text-emerald-700 mt-0.5">{presentCount}</p>
              </div>
              <div className="p-3.5 bg-rose-50/70 rounded-xl border border-rose-200/60">
                <span className="text-[11px] font-bold text-rose-700 uppercase">Absent</span>
                <p className="text-xl sm:text-2xl font-black text-rose-700 mt-0.5">{absentCount}</p>
              </div>
              <div className="p-3.5 bg-teal-50/70 rounded-xl border border-teal-200/60">
                <span className="text-[11px] font-bold text-teal-700 uppercase">Attendance Rate</span>
                <p className="text-xl sm:text-2xl font-black text-teal-800 mt-0.5">{percentage}%</p>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFastScanOpen(true)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl shadow-2xs transition flex items-center space-x-1.5 cursor-pointer"
                  title="Fast QR & Barcode Attendance Terminal"
                >
                  <QrCode className="w-3.5 h-3.5 text-teal-400" />
                  <span>Fast Scanner</span>
                </button>
                <button
                  type="button"
                  onClick={() => markClassAll('PRESENT')}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-2xs transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    Mark {selectedClass === 'ALL' ? 'All' : formatClassLabel(selectedClass)} Present
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => markClassAll('ABSENT')}
                  className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>
                    Mark {selectedClass === 'ALL' ? 'All' : formatClassLabel(selectedClass)} Absent
                  </span>
                </button>
              </div>

              {/* Save Attendance CTA */}
              <button
                type="button"
                onClick={handleSaveAttendance}
                disabled={saving || roster.length === 0}
                className="px-5 py-2 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>
                  {saving
                    ? 'Saving Records...'
                    : isMarkedAlready
                    ? 'Update Attendance Changes'
                    : 'Save Attendance'}
                </span>
              </button>
            </div>
          </div>

          {/* Student Roster Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            {/* Filter & Search Header */}
            <div className="p-4 border-b border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search student, roll number, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>

              <div className="flex items-center space-x-1.5 self-end sm:self-auto">
                <span className="text-xs text-slate-500 font-medium">Status:</span>
                {(['ALL', 'PRESENT', 'ABSENT'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      statusFilter === st
                        ? 'bg-slate-900 text-white'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {st === 'ALL' ? 'All' : st === 'PRESENT' ? 'Present' : 'Absent'}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="py-20 text-center">
                <div className="inline-block w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-sm font-semibold text-slate-500">Loading student attendance roster...</p>
              </div>
            ) : filteredRoster.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-sm">
                No students match your filter criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      <th className="py-3 px-4">Roll Number</th>
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Class & School</th>
                      <th className="py-3 px-4">Attendance Status</th>
                      <th className="py-3 px-4">Remarks (Optional)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredRoster.map((student) => {
                      const isPresent = student.status === 'PRESENT' || student.status === 'LATE';
                      return (
                        <tr
                          key={student.studentId}
                          className={`hover:bg-slate-50/80 transition ${
                            !isPresent ? 'bg-rose-50/20' : ''
                          }`}
                        >
                          {/* Roll Number Pill */}
                          <td className="py-3 px-4">
                            <span className="font-mono text-xs font-black px-2.5 py-1 bg-slate-100 text-slate-800 rounded-md border border-slate-200">
                              {student.rollNumber || '—'}
                            </span>
                          </td>

                          {/* Student Info with Avatar */}
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-3">
                              {student.photoUrl ? (
                                <img
                                  src={student.photoUrl}
                                  alt={student.name}
                                  className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-2xs"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-xs">
                                  {student.name.charAt(0)}
                                </div>
                              )}
                              <div>
                                <p className="font-bold text-slate-900 text-sm leading-tight">{student.name}</p>
                                <p className="text-[11px] text-slate-500 font-medium">{student.phone}</p>
                              </div>
                            </div>
                          </td>

                          {/* Class & School */}
                          <td className="py-3 px-4">
                            <div className="text-xs">
                              <span className="font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200">
                                {formatClassLabel(student.classGrade || '')}
                              </span>
                              {student.schoolName && (
                                <p className="text-[11px] text-slate-500 mt-1 truncate max-w-xs">
                                  {student.schoolName}
                                </p>
                              )}
                            </div>
                          </td>

                          {/* Present / Absent Toggle Buttons */}
                          <td className="py-3 px-4">
                            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                              <button
                                type="button"
                                onClick={() => toggleStudent(student.studentId, 'PRESENT')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                                  isPresent
                                    ? 'bg-emerald-600 text-white shadow-2xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Present</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleStudent(student.studentId, 'ABSENT')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                                  !isPresent
                                    ? 'bg-rose-600 text-white shadow-2xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Absent</span>
                              </button>
                            </div>
                          </td>

                          {/* Remarks Input */}
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              placeholder="e.g. Late 10m, Fever, Leave"
                              value={student.remarks}
                              onChange={(e) => updateRemark(student.studentId, e.target.value)}
                              className="w-full max-w-xs px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-800"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Bottom Footer Action */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                Showing {filteredRoster.length} of {rosterForClass.length} students in{' '}
                {selectedClass === 'ALL' ? 'All Classes' : formatClassLabel(selectedClass)}
              </span>
              <button
                type="button"
                onClick={handleSaveAttendance}
                disabled={saving || roster.length === 0}
                className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>
                  {saving
                    ? 'Saving...'
                    : isMarkedAlready
                    ? 'Update Attendance Changes'
                    : 'Save Attendance'}
                </span>
              </button>
            </div>
          </div>
        </>
      ) : (
        /* History & Dates Management Tab */
        <div className="space-y-6">
          {/* Summary Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase">Total Class Sessions Held</span>
              <p className="text-3xl font-black text-slate-900 mt-1">
                {overviewData?.totalMarkedDates || 0}
              </p>
              <span className="text-[11px] text-slate-400">Unique dates with marked attendance</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-teal-700 uppercase">Overall Attendance Rate</span>
              <p className="text-3xl font-black text-teal-700 mt-1">
                {overviewData?.overallPercentage !== null ? `${overviewData?.overallPercentage}%` : 'N/A'}
              </p>
              <span className="text-[11px] text-slate-400">Across all marked classes</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-rose-700 uppercase">Low Attendance Alert (&lt;75%)</span>
              <p className="text-3xl font-black text-rose-700 mt-1">
                {overviewData?.studentStats?.filter((s) => s.isLowAttendance).length || 0}
              </p>
              <span className="text-[11px] text-slate-400">Students below 75% threshold</span>
            </div>
          </div>

          {/* Past Recorded Dates Management Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Past Recorded Class Dates</h3>
                <p className="text-xs text-slate-500">
                  Click &apos;Edit / View&apos; to change student records, or &apos;Delete&apos; to remove a date completely
                </p>
              </div>
            </div>

            {overviewData?.markedDates && overviewData.markedDates.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {overviewData.markedDates.map((d) => (
                  <div key={d} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-teal-50 text-teal-700 rounded-xl">
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
                        className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
                      >
                        Edit / View Attendance
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteDate(d)}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer"
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
                No class attendance dates have been recorded yet.
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
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
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

      {/* Fast Attendance Scanner Modal */}
      <FastAttendanceScannerModal
        isOpen={fastScanOpen}
        onClose={() => setFastScanOpen(false)}
        dateStr={selectedDate}
        roster={roster}
        onMarkStudent={(studentId, status, remarks) => {
          toggleStudent(studentId, status);
          if (remarks) updateRemark(studentId, remarks);
        }}
      />
    </div>
  );
}
