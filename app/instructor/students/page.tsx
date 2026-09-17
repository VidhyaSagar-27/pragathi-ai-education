'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  School,
  Mail,
  Phone,
  MapPin,
  Camera,
  Sparkles,
  Send,
  PenTool,
  Search,
} from 'lucide-react';
import { User } from '@/lib/db/types';
import StudentPhotoModal from '@/components/StudentPhotoModal';
import CommunicationModal, { CommunicationMode } from '@/components/CommunicationModal';

export default function InstructorStudentsPage() {
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Student Photo Modal State
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [selectedStudentForPhoto, setSelectedStudentForPhoto] = useState<User | null>(null);

  // Communications Modal State
  const [commModalOpen, setCommModalOpen] = useState(false);
  const [commMode, setCommMode] = useState<CommunicationMode>('INDIVIDUAL');
  const [commTargetStudent, setCommTargetStudent] = useState<User | null>(null);

  const fetchStudents = () => {
    fetch('/api/admin/users?role=STUDENT')
      .then((r) => (r.ok ? r.json() : { users: [] }))
      .then((data) => {
        setStudents(data.users || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleOpenPhotoModal = (stu: User) => {
    setSelectedStudentForPhoto(stu);
    setPhotoModalOpen(true);
  };

  const handlePhotoSaved = (newPhotoUrl: string | null) => {
    if (!selectedStudentForPhoto) return;
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === selectedStudentForPhoto.id) {
          return {
            ...s,
            studentDetails: {
              ...s.studentDetails!,
              photoUrl: newPhotoUrl || undefined,
            },
          };
        }
        return s;
      })
    );
  };

  const handleOpenComm = (stu: User) => {
    setCommTargetStudent(stu);
    setCommMode('INDIVIDUAL');
    setCommModalOpen(true);
  };

  const handleOpenBroadcast = () => {
    setCommTargetStudent(null);
    setCommMode('BROADCAST');
    setCommModalOpen(true);
  };

  const handleOpenManual = () => {
    setCommTargetStudent(null);
    setCommMode('MANUAL');
    setCommModalOpen(true);
  };

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.phone && s.phone.includes(searchQuery)) ||
      (s.studentDetails?.schoolName && s.studentDetails.schoolName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.studentDetails?.parentName && s.studentDetails.parentName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Enrolled Students Roster
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Active students in your cohort. Send individual or broadcast notices via WhatsApp & Email directly to students.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Manual Send */}
          <button
            type="button"
            onClick={handleOpenManual}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition border border-slate-200 shadow-2xs cursor-pointer"
            title="Type custom student name, WhatsApp number, or email to message"
          >
            <PenTool className="w-4 h-4 text-teal-600" />
            <span>Manual Send</span>
          </button>

          {/* Broadcast to Students */}
          <button
            type="button"
            onClick={handleOpenBroadcast}
            disabled={students.length === 0}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-sm cursor-pointer disabled:opacity-50"
            title="Broadcast announcement to all enrolled students"
          >
            <Send className="w-4 h-4" />
            <span>Broadcast Students ({students.length})</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search students by name, email, school, or phone..."
          className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30"
        />
      </div>

      {filtered.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-subtle">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-semibold">
                <tr>
                  <th className="px-6 py-4">Student & Photo</th>
                  <th className="px-6 py-4">School & Grade</th>
                  <th className="px-6 py-4">Parent / Guardian</th>
                  <th className="px-6 py-4">Contact Phone</th>
                  <th className="px-6 py-4">Cohort Group</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((stu) => (
                  <tr key={stu.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div
                          onClick={() => handleOpenPhotoModal(stu)}
                          className="relative group w-11 h-11 rounded-2xl overflow-hidden bg-teal-50 border border-teal-200 flex items-center justify-center font-bold text-teal-800 shrink-0 cursor-pointer shadow-xs"
                          title="Click to change or capture photo"
                        >
                          {stu.studentDetails?.photoUrl ? (
                            <img
                              src={stu.studentDetails.photoUrl}
                              alt={stu.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-base">{stu.name.charAt(0).toUpperCase()}</span>
                          )}

                          <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Camera className="w-4 h-4" />
                          </div>
                        </div>

                        <div>
                          <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                            <span>{stu.name}</span>
                          </div>
                          <div className="text-xs text-slate-400">{stu.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      <div>{stu.studentDetails?.schoolName || 'Enrolled School'}</div>
                      <span className="inline-block text-[11px] text-teal-700 font-semibold">
                        Grade {stu.studentDetails?.classGrade || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {stu.studentDetails?.parentName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {stu.phone || stu.studentDetails?.parentPhone || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-semibold">
                        {stu.studentDetails?.group || 'Foundation Batch'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {/* Send Message Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenComm(stu)}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-teal-200 bg-teal-50/80 hover:bg-teal-100 text-teal-800 text-xs font-bold transition shadow-2xs cursor-pointer"
                        title="Send WhatsApp & Email message to student"
                      >
                        <Send className="w-3.5 h-3.5 text-teal-600" />
                        <span>Message</span>
                      </button>

                      {/* Photo Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenPhotoModal(stu)}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-2xs cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5 text-slate-500" />
                        <span>{stu.studentDetails?.photoUrl ? 'Photo' : '+ Photo'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center max-w-xl mx-auto border border-dashed border-slate-300 shadow-subtle">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-700 mx-auto flex items-center justify-center mb-4 border border-teal-100">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            {searchQuery ? 'No Matching Students' : '0 Enrolled Students'}
          </h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            {searchQuery
              ? `No student profiles matched "${searchQuery}".`
              : 'No students are currently enrolled in your cohort. Students will appear here as their applications are approved by the administrator.'}
          </p>
        </div>
      )}

      {/* Student Photo Modal (Camera + Library) */}
      <StudentPhotoModal
        isOpen={photoModalOpen}
        onClose={() => setPhotoModalOpen(false)}
        student={
          selectedStudentForPhoto
            ? {
                id: selectedStudentForPhoto.id,
                name: selectedStudentForPhoto.name,
                email: selectedStudentForPhoto.email,
                photoUrl: selectedStudentForPhoto.studentDetails?.photoUrl,
              }
            : null
        }
        onPhotoSaved={handlePhotoSaved}
      />

      {/* Communications Modal (Message Student, Broadcast Cohort, Manual Recipient) */}
      <CommunicationModal
        isOpen={commModalOpen}
        onClose={() => {
          setCommModalOpen(false);
          setCommTargetStudent(null);
        }}
        onSuccess={fetchStudents}
        mode={commMode}
        targetRole="STUDENT"
        targetUser={
          commTargetStudent
            ? {
                id: commTargetStudent.id,
                name: commTargetStudent.name,
                email: commTargetStudent.email,
                phone: commTargetStudent.phone || commTargetStudent.studentDetails?.parentPhone,
                studentId: commTargetStudent.studentDetails?.studentId,
                role: 'STUDENT',
              }
            : null
        }
        broadcastCount={students.length}
        currentUserRole="INSTRUCTOR"
      />
    </div>
  );
}
