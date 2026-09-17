'use client';

import React, { useState, useEffect } from 'react';
import { Users, School, Mail, Phone, MapPin, Camera, Sparkles } from 'lucide-react';
import { User } from '@/lib/db/types';
import StudentPhotoModal from '@/components/StudentPhotoModal';

export default function InstructorStudentsPage() {
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Student Photo Modal State
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [selectedStudentForPhoto, setSelectedStudentForPhoto] = useState<User | null>(null);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Enrolled Students Roster
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Active students registered for the Pragathi AI Foundation Program. Instructors can view student profiles and capture/upload profile photos.
        </p>
      </div>

      {students.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-subtle">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-semibold">
                <tr>
                  <th className="px-6 py-4">Student & Photo</th>
                  <th className="px-6 py-4">School & Grade</th>
                  <th className="px-6 py-4">Parent / Guardian</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Cohort Group</th>
                  <th className="px-6 py-4 text-right">Photo Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((stu) => (
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
                      {stu.phone || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-semibold">
                        {stu.studentDetails?.group || 'Foundation Batch'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenPhotoModal(stu)}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-teal-200 bg-teal-50/80 hover:bg-teal-100 text-teal-800 text-xs font-bold transition shadow-2xs"
                      >
                        <Camera className="w-3.5 h-3.5 text-teal-600" />
                        <span>{stu.studentDetails?.photoUrl ? 'Update Photo' : 'Add Photo'}</span>
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
          <h3 className="text-xl font-bold text-slate-900 mb-2">0 Enrolled Students</h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            No students are currently enrolled in your cohort. Students will appear here as their applications are approved by the administrator.
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
    </div>
  );
}
