'use client';

import React, { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Edit, Key, Power, Search, AlertCircle, CheckCircle2 } from 'lucide-react';
import { User } from '@/lib/db/types';

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Add / Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [classGrade, setClassGrade] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [parentName, setParentName] = useState('');
  const [location, setLocation] = useState('');
  const [group, setGroup] = useState('Foundation Batch A');

  // Password reset modal
  const [pwModalOpen, setPwModalOpen] = useState(false);
  const [pwTargetUser, setPwTargetUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const loadStudents = () => {
    setLoading(true);
    fetch(`/api/admin/users?role=STUDENT&_t=${Date.now()}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        setStudents(d.users || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadStudents();
    const onFocus = () => loadStudents();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setName('');
    setEmail('');
    setPassword('Pragathi2026!');
    setPhone('');
    setClassGrade('');
    setSchoolName('');
    setParentName('');
    setLocation('');
    setGroup('Foundation Batch A');
    setModalOpen(true);
  };

  const handleOpenEdit = (stu: User) => {
    setEditingId(stu.id);
    setName(stu.name);
    setEmail(stu.email);
    setPassword('');
    setPhone(stu.phone || '');
    setClassGrade(stu.studentDetails?.classGrade || '');
    setSchoolName(stu.studentDetails?.schoolName || '');
    setParentName(stu.studentDetails?.parentName || '');
    setLocation(stu.studentDetails?.location || '');
    setGroup(stu.studentDetails?.group || 'Foundation Batch A');
    setModalOpen(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        const res = await fetch('/api/admin/users', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingId,
            name,
            email,
            phone,
            password: password || undefined,
            studentDetails: { classGrade, schoolName, parentName, location, group },
          }),
        });
        if (!res.ok) throw new Error('Failed to update student');
      } else {
        const res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            email,
            password,
            role: 'STUDENT',
            phone,
            studentDetails: { classGrade, schoolName, parentName, location, group },
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to create student');
        }
      }

      setModalOpen(false);
      loadStudents();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleStatus = async (stu: User) => {
    const newStatus = stu.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setStudents((prev) => prev.map((s) => s.id === stu.id ? { ...s, status: newStatus } : s));
    await fetch(`/api/admin/users?_t=${Date.now()}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: stu.id, status: newStatus }),
      cache: 'no-store',
    });
    loadStudents();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student account?')) return;
    setStudents((prev) => prev.filter((s) => s.id !== id));
    await fetch(`/api/admin/users?id=${id}&_t=${Date.now()}`, { method: 'DELETE', cache: 'no-store' });
    loadStudents();
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwTargetUser) return;

    try {
      await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: pwTargetUser.id, password: newPassword }),
      });
      alert(`Password successfully reset for ${pwTargetUser.name}!`);
      setPwModalOpen(false);
      setNewPassword('');
    } catch (err: any) {
      alert('Error resetting password');
    }
  };

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentDetails?.schoolName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Student Account Administration
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Provision, modify, assign groups, and manage credentials for enrolled students.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-sm w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>Add Student Account</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by student name, email, or school..."
          className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30"
        />
      </div>

      {filtered.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-subtle">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-semibold">
                <tr>
                  <th className="px-6 py-4">Student Details</th>
                  <th className="px-6 py-4">School & Grade</th>
                  <th className="px-6 py-4">Parent & Contact</th>
                  <th className="px-6 py-4">Cohort Group</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((stu) => (
                  <tr key={stu.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{stu.name}</div>
                      <div className="text-xs text-slate-400">{stu.email}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      <div>{stu.studentDetails?.schoolName || 'N/A'}</div>
                      <span className="text-[11px] text-teal-700 font-semibold">
                        Grade {stu.studentDetails?.classGrade || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      <div>{stu.studentDetails?.parentName || 'N/A'}</div>
                      <div className="text-xs text-slate-400">{stu.phone || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-medium">
                        {stu.studentDetails?.group || 'Foundation Batch'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(stu)}
                        className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          stu.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                        title="Click to toggle active status"
                      >
                        <Power className="w-3 h-3" />
                        <span>{stu.status}</span>
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setPwTargetUser(stu);
                          setNewPassword('Pragathi2026!');
                          setPwModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-amber-600 transition"
                        title="Reset Password"
                      >
                        <Key className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(stu)}
                        className="p-1.5 text-slate-400 hover:text-teal-600 transition"
                        title="Edit Details"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(stu.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                        title="Delete Student"
                      >
                        <Trash2 className="w-4 h-4" />
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
          <h3 className="text-xl font-bold text-slate-900 mb-2">0 Student Accounts</h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            No student accounts created yet. You can click "Add Student Account" above or approve incoming registration applications.
          </p>
        </div>
      )}

      {/* Add / Edit Student Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 bg-brand-navy text-white flex items-center justify-between">
              <h3 className="text-base font-bold">
                {editingId ? 'Edit Student Account' : 'Add New Student'}
              </h3>
              <button onClick={() => setModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveStudent} className="p-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Student Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-sm px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-sm px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              {!editingId && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Password *</label>
                  <input
                    type="text"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-sm px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">School Name *</label>
                  <input
                    type="text"
                    required
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    className="w-full text-sm px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Class / Grade *</label>
                  <input
                    type="text"
                    required
                    value={classGrade}
                    onChange={(e) => setClassGrade(e.target.value)}
                    className="w-full text-sm px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Parent / Guardian Name *</label>
                  <input
                    type="text"
                    required
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    className="w-full text-sm px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-sm px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cohort Group</label>
                  <input
                    type="text"
                    value={group}
                    onChange={(e) => setGroup(e.target.value)}
                    className="w-full text-sm px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full text-sm px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl"
                >
                  Save Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {pwModalOpen && pwTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Reset Student Password</h3>
            <p className="text-xs text-slate-500">
              Set a temporary password for <strong>{pwTargetUser.name}</strong> ({pwTargetUser.email}).
            </p>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
                <input
                  type="text"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setPwModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 text-white text-xs font-semibold rounded-xl"
                >
                  Set Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
