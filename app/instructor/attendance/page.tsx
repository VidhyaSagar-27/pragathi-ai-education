'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Save,
  Clock,
  Search,
  UserCheck,
  ChevronRight,
  QrCode,
} from 'lucide-react';
import FastAttendanceScannerModal from '@/components/FastAttendanceScannerModal';

interface StudentRosterItem {
  studentId: string;
  name: string;
  rollNumber: string;
  phone: string;
  photoUrl: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  remarks: string;
  isRecorded: boolean;
}

export default function InstructorAttendancePage() {
  const getTodayStr = () => new Date().toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [roster, setRoster] = useState<StudentRosterItem[]>([]);
  const [isMarkedAlready, setIsMarkedAlready] = useState<boolean>(false);
  const [markerInfo, setMarkerInfo] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [fastScanOpen, setFastScanOpen] = useState<boolean>(false);

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

  const toggleStatus = (studentId: string, status: 'PRESENT' | 'ABSENT') => {
    setRoster((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, status } : s))
    );
  };

  const markAll = (status: 'PRESENT' | 'ABSENT') => {
    setRoster((prev) => prev.map((s) => ({ ...s, status })));
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

  const filteredRoster = useMemo(() => {
    return roster.filter(
      (s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [roster, searchQuery]);

  const presentCount = roster.filter((s) => s.status === 'PRESENT' || s.status === 'LATE').length;
  const absentCount = roster.filter((s) => s.status === 'ABSENT').length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center space-x-2 text-teal-600 font-bold text-xs uppercase tracking-wider">
          <UserCheck className="w-4 h-4" />
          <span>Faculty Portal</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
          Mark Class Attendance
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Select class date from calendar, mark students, and record remarks
        </p>
      </div>

      {/* Date Control Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-700 uppercase">Class Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          <div className="flex items-center space-x-2">
            {isMarkedAlready ? (
              <span className="inline-flex items-center space-x-1 px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Recorded {markerInfo?.markedByName ? `(${markerInfo.markedByName})` : ''}</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1 px-3 py-1 bg-amber-50 text-amber-800 text-xs font-bold rounded-full border border-amber-200">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Not Yet Saved</span>
              </span>
            )}
          </div>
        </div>

        {/* Counters & Quick Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-600">
              Total: <span className="text-slate-900">{roster.length}</span>
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-bold text-emerald-700">
              Present: <span>{presentCount}</span>
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-bold text-rose-700">
              Absent: <span>{absentCount}</span>
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setFastScanOpen(true)}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-lg shadow-2xs transition flex items-center space-x-1.5 cursor-pointer"
              title="Fast QR & Barcode Attendance Terminal"
            >
              <QrCode className="w-3.5 h-3.5 text-teal-400" />
              <span>Fast Scanner</span>
            </button>
            <button
              type="button"
              onClick={() => markAll('PRESENT')}
              className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-2xs hover:bg-emerald-700 transition"
            >
              Mark All Present
            </button>
            <button
              type="button"
              onClick={() => markAll('ABSENT')}
              className="px-3 py-1.5 bg-slate-200 text-slate-800 text-xs font-bold rounded-lg hover:bg-slate-300 transition"
            >
              Mark All Absent
            </button>
          </div>
        </div>
      </div>

      {successToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Student List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search student or roll number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-500 font-semibold text-sm">
            Loading enrolled students...
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredRoster.map((s) => {
              const isPresent = s.status === 'PRESENT' || s.status === 'LATE';
              return (
                <div
                  key={s.studentId}
                  className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition ${
                    !isPresent ? 'bg-rose-50/20' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {s.photoUrl ? (
                      <img
                        src={s.photoUrl}
                        alt={s.name}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-xs">
                        {s.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                          {s.rollNumber}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm">{s.name}</h4>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{s.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 self-end sm:self-auto">
                    <input
                      type="text"
                      placeholder="Remarks (optional)"
                      value={s.remarks}
                      onChange={(e) => updateRemark(s.studentId, e.target.value)}
                      className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg w-36 text-slate-700"
                    />

                    <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                      <button
                        type="button"
                        onClick={() => toggleStatus(s.studentId, 'PRESENT')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                          isPresent
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Present
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleStatus(s.studentId, 'ABSENT')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                          !isPresent
                            ? 'bg-rose-600 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Absent
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            {filteredRoster.length} students listed
          </span>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || roster.length === 0}
            className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1.5"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Attendance'}</span>
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
    </div>
  );
}
