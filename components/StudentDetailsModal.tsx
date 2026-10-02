'use client';

import React from 'react';
import { X, Download, User, School, Phone, Mail, Calendar, FileText, Camera } from 'lucide-react';
import { User as UserType } from '@/lib/db/types';

interface StudentDetailsModalProps {
  student: UserType | null;
  onClose: () => void;
  onOpenPhotoModal?: (student: UserType) => void;
}

export default function StudentDetailsModal({
  student,
  onClose,
  onOpenPhotoModal,
}: StudentDetailsModalProps) {
  if (!student) return null;

  const rollNumber =
    student.rollNumber ||
    student.studentDetails?.rollNumber ||
    student.studentDetails?.studentId ||
    'PRG';
  const cleanName = (student.name || 'student').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  const photoUrl = student.studentDetails?.photoUrl;

  const handleDownloadPhoto = () => {
    if (!photoUrl) {
      alert('This student does not have a photo uploaded.');
      return;
    }
    const a = document.createElement('a');
    a.href = photoUrl;
    a.download = `${rollNumber}_${cleanName}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadDetails = () => {
    // Safe text file without passwords or hashes
    const textContent = `=========================================
PRAGATHI AI - OFFICIAL STUDENT PROFILE
=========================================

Roll Number / Login ID : ${rollNumber}
Student Full Name      : ${student.name}
School Name            : ${student.studentDetails?.schoolName || 'N/A'}
Class / Grade          : Grade ${student.studentDetails?.classGrade || 'N/A'}
Section                : Sec ${student.studentDetails?.section || 'A'}
Parent / Guardian Name : ${student.studentDetails?.parentName || 'N/A'}
Contact Phone Number   : ${student.phone || student.studentDetails?.parentPhone || 'N/A'}
Email Address          : ${student.email || 'None (Optional)'}
Cohort Group           : ${student.studentDetails?.group || 'Foundation Batch'}
Enrollment Status      : ${student.status || 'ACTIVE'}
Registration Date      : ${student.createdAt ? new Date(student.createdAt).toLocaleDateString() : 'N/A'}

=========================================
Pragathi AI Learning Platform
=========================================
`;

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${rollNumber}_${cleanName}_Details.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-teal-50/40">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Student Profile</h2>
            <span className="text-xs font-mono font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded border border-teal-200">
              {rollNumber}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition border border-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Photo & Identity */}
          <div className="flex items-center space-x-4">
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-teal-50 border-2 border-teal-500 flex items-center justify-center font-black text-2xl text-teal-700 shrink-0 shadow-inner">
              {photoUrl ? (
                <img src={photoUrl} alt={student.name} className="w-full h-full object-cover" />
              ) : (
                student.name.charAt(0).toUpperCase()
              )}
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900">{student.name}</h3>
              <p className="text-xs text-slate-500 font-medium">
                {student.studentDetails?.schoolName || 'School N/A'}
              </p>
              <div className="mt-1 flex items-center space-x-2">
                <span className="text-xs font-semibold text-teal-700">
                  Grade {student.studentDetails?.classGrade || 'N/A'}
                  {student.studentDetails?.section ? ` • Sec ${student.studentDetails.section}` : ''}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    student.status === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {student.status}
                </span>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs text-slate-700">
            <div className="flex justify-between py-1 border-b border-slate-200/80">
              <span className="text-slate-400">Roll Number:</span>
              <span className="font-mono font-bold text-teal-800">{rollNumber}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/80">
              <span className="text-slate-400">Parent / Guardian:</span>
              <span className="font-semibold text-slate-900">
                {student.studentDetails?.parentName || '—'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/80">
              <span className="text-slate-400">Registered Phone:</span>
              <span className="font-mono font-bold text-slate-900">{student.phone || '—'}</span>
            </div>
            {student.email && (
              <div className="flex justify-between py-1 border-b border-slate-200/80">
                <span className="text-slate-400">Email:</span>
                <span className="font-mono text-slate-800">{student.email}</span>
              </div>
            )}
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Enrolled On:</span>
              <span>
                {student.createdAt ? new Date(student.createdAt).toLocaleDateString() : '—'}
              </span>
            </div>
          </div>

          {/* Export Actions for Individual Student */}
          <div className="space-y-2 pt-1">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleDownloadPhoto}
                disabled={!photoUrl}
                className="py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition disabled:opacity-40 cursor-pointer shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-teal-600" />
                <span>Download Photo</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadDetails}
                className="py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition cursor-pointer shadow-2xs"
              >
                <FileText className="w-3.5 h-3.5 text-teal-600" />
                <span>Download Card</span>
              </button>
            </div>

            {onOpenPhotoModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPhotoModal(student);
                }}
                className="w-full py-2 bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Replace Student Photo (Camera/Library)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
