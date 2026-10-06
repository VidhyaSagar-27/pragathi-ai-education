'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  Save,
  Clock,
  Search,
  UserCheck,
  QrCode,
  Trash2,
  GraduationCap,
  UserPlus,
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
  const [markerInfo, setMarkerInfo] = useState<any>(null);
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [fastScanOpen, setFastScanOpen] = useState<boolean>(false);
  const [addStudentOpen, setAddStudentOpen] = useState<boolean>(false);

  const loadAttendance = async (dateStr: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/attendance?date=${dateStr}&_t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setRoster(data.students || []);
        setIsMarkedAlready(Boolean(data.isMarkedForDate));
        setMarkerInfo(data.markerInfo);
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
    if (!grade || grade === 'Not Specified') return 'Unassigned';
    return grade.toLowerCase().startsWith('class') ? grade : `Class ${grade}`;
  };

  // Filter roster by selected class
  const rosterForClass = useMemo(() => {
    if (selectedClass === 'ALL') return roster;
    return roster.filter((s) => (s.classGrade || '').trim() === selectedClass);
  }, [roster, selectedClass]);

  const toggleStatus = (studentId: string, status: 'PRESENT' | 'ABSENT') => {
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

  const updateRemark = (studentId: string, remarks: string) => {
    setRoster((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, remarks } : s))
    );
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

      setSuccessToast(`Attendance saved successfully for ${selectedDate}!`);
      setIsMarkedAlready(true);
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Error saving attendance');
    } finally {
      setSaving(false);
    }
  };

  // Delete / Remove attendance for date
  const handleDeleteDate = async () => {
    if (!window.confirm(`Are you sure you want to remove attendance records for ${selectedDate}? This will delete attendance for this date.`)) {
      return;
    }

    setDeletingDate(true);
    try {
      const res = await fetch(`/api/admin/attendance?date=${selectedDate}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete attendance');

      setSuccessToast(`Attendance for ${selectedDate} has been removed.`);
      setIsMarkedAlready(false);
      await loadAttendance(selectedDate);
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Error removing date attendance');
    } finally {
      setDeletingDate(false);
    }
  };

  const filteredRoster = useMemo(() => {
    return rosterForClass.filter(
      (s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.phone.includes(searchQuery)
    );
  }, [rosterForClass, searchQuery]);

  const presentCount = rosterForClass.filter((s) => s.status === 'PRESENT' || s.status === 'LATE').length;
  const absentCount = rosterForClass.filter((s) => s.status === 'ABSENT').length;
  const totalInView = rosterForClass.length;
  const percentage = totalInView > 0 ? Math.round((presentCount / totalInView) * 100) : 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2 text-teal-600 font-bold text-xs uppercase tracking-wider">
            <UserCheck className="w-4 h-4" />
            <span>Faculty Attendance Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Class Attendance Marking
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Select class date, filter by class, mark students, or update past records anytime.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setAddStudentOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New Student</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-semibold flex items-center space-x-2 animate-fadeIn shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Date Control Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        {/* Status & Edit/Remove Notice Banner */}
        {isMarkedAlready ? (
          <div className="p-3.5 bg-emerald-50/90 border border-emerald-200 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-emerald-950">
            <div className="flex items-center space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <div>
                <span className="font-bold">Attendance Saved for {selectedDate}</span>
                {markerInfo?.markedByName && (
                  <span className="text-emerald-800 ml-1.5 text-[11px]">
                    (Marked by {markerInfo.markedByName})
                  </span>
                )}
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  You can change student statuses below and click <strong>Update Attendance Changes</strong>.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDeleteDate}
              disabled={deletingDate}
              className="self-start sm:self-auto px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
              title="Delete attendance records for this date"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{deletingDate ? 'Removing...' : 'Remove This Date'}</span>
            </button>
          </div>
        ) : (
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center space-x-2.5 text-slate-700">
            <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              <strong>Unsaved Date ({selectedDate}):</strong> Mark students below and click <strong>Save Attendance</strong>.
            </span>
          </div>
        )}

        {/* Date Selector Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-700 uppercase">Class Date:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

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
            </div>
          </div>

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

        {/* Counters Scoped to Class Filter */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
            <span className="text-[10px] font-bold text-slate-500 uppercase">
              {selectedClass === 'ALL' ? 'Total Students' : `${formatClassLabel(selectedClass)} Count`}
            </span>
            <p className="text-xl font-black text-slate-900 mt-0.5">{totalInView}</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200/60">
            <span className="text-[10px] font-bold text-emerald-700 uppercase">Present</span>
            <p className="text-xl font-black text-emerald-700 mt-0.5">{presentCount}</p>
          </div>
          <div className="p-3 bg-rose-50 rounded-xl border border-rose-200/60">
            <span className="text-[10px] font-bold text-rose-700 uppercase">Absent</span>
            <p className="text-xl font-black text-rose-700 mt-0.5">{absentCount}</p>
          </div>
          <div className="p-3 bg-teal-50 rounded-xl border border-teal-200/60">
            <span className="text-[10px] font-bold text-teal-700 uppercase">Attendance Rate</span>
            <p className="text-xl font-black text-teal-800 mt-0.5">{percentage}%</p>
          </div>
        </div>

        {/* Action Buttons */}
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
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center space-x-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark {selectedClass === 'ALL' ? 'All' : formatClassLabel(selectedClass)} Present</span>
            </button>
            <button
              type="button"
              onClick={() => markClassAll('ABSENT')}
              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition flex items-center space-x-1.5 cursor-pointer"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Mark {selectedClass === 'ALL' ? 'All' : formatClassLabel(selectedClass)} Absent</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || roster.length === 0}
            className="px-5 py-2 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
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

      {/* Roster Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Search Header */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search student, roll number, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>
          <span className="text-xs text-slate-500 font-medium self-end sm:self-auto">
            Showing {filteredRoster.length} of {rosterForClass.length} students
          </span>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm font-semibold text-slate-500">Loading roster...</p>
          </div>
        ) : filteredRoster.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-sm">
            No students found for this class or filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Class</th>
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
                      {/* Roll Number */}
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs font-black px-2.5 py-1 bg-slate-100 text-slate-800 rounded-md border border-slate-200">
                          {student.rollNumber || '—'}
                        </span>
                      </td>

                      {/* Student Info */}
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

                      {/* Class */}
                      <td className="py-3 px-4">
                        <span className="font-bold text-xs px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200">
                          {formatClassLabel(student.classGrade || '')}
                        </span>
                      </td>

                      {/* Present / Absent Toggle Buttons */}
                      <td className="py-3 px-4">
                        <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                          <button
                            type="button"
                            onClick={() => toggleStatus(student.studentId, 'PRESENT')}
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
                            onClick={() => toggleStatus(student.studentId, 'ABSENT')}
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

                      {/* Remarks */}
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          placeholder="e.g. Late, Medical"
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
            onClick={handleSave}
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

      {/* Fast Attendance Scanner Modal */}
      <FastAttendanceScannerModal
        isOpen={fastScanOpen}
        onClose={() => setFastScanOpen(false)}
        dateStr={selectedDate}
        roster={roster}
        onMarkStudent={(studentId, status, remarks) => {
          toggleStatus(studentId, status);
          if (remarks) updateRemark(studentId, remarks);
        }}
      />

      {/* Instructor Fast Add Student Modal */}
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
