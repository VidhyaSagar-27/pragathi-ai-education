'use client';

import React, { useState, useEffect } from 'react';
import { Users, School, Mail, Phone, MapPin } from 'lucide-react';
import { User } from '@/lib/db/types';

export default function InstructorStudentsPage() {
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/users?role=STUDENT')
      .then((r) => (r.ok ? r.json() : { users: [] }))
      .then((data) => {
        setStudents(data.users || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

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
          Active students registered for the Pragathi AI Foundation Program.
        </p>
      </div>

      {students.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-subtle">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-semibold">
                <tr>
                  <th className="px-6 py-4">Student Name</th>
                  <th className="px-6 py-4">School & Grade</th>
                  <th className="px-6 py-4">Parent / Guardian</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Cohort Group</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((stu) => (
                  <tr key={stu.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{stu.name}</div>
                      <div className="text-xs text-slate-400">{stu.email}</div>
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
    </div>
  );
}
