'use client';

import React, { useState, useEffect } from 'react';
import { GraduationCap, Plus, Trash2, Edit, Key, Power, Search } from 'lucide-react';
import { User } from '@/lib/db/types';

export default function AdminInstructorsPage() {
  const [instructors, setInstructors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [designation, setDesignation] = useState('Senior AI Faculty');

  const [pwModalOpen, setPwModalOpen] = useState(false);
  const [pwTargetUser, setPwTargetUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const loadInstructors = () => {
    setLoading(true);
    fetch('/api/admin/users?role=INSTRUCTOR')
      .then((r) => r.json())
      .then((d) => {
        setInstructors(d.users || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadInstructors();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setName('');
    setEmail('');
    setPassword('Faculty2026!');
    setPhone('');
    setDesignation('AI Curriculum Faculty');
    setModalOpen(true);
  };

  const handleOpenEdit = (inst: User) => {
    setEditingId(inst.id);
    setName(inst.name);
    setEmail(inst.email);
    setPassword('');
    setPhone(inst.phone || '');
    setDesignation(inst.instructorDetails?.designation || 'AI Curriculum Faculty');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
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
            instructorDetails: { designation, assignedModules: [1, 2, 3, 4, 5, 6, 7], assignedGroups: ['All'] },
          }),
        });
        if (!res.ok) throw new Error('Failed to update instructor');
      } else {
        const res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            email,
            password,
            role: 'INSTRUCTOR',
            phone,
            instructorDetails: { designation, assignedModules: [1, 2, 3, 4, 5, 6, 7], assignedGroups: ['All'] },
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to create instructor');
        }
      }

      setModalOpen(false);
      loadInstructors();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleStatus = async (inst: User) => {
    const newStatus = inst.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: inst.id, status: newStatus }),
    });
    loadInstructors();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this instructor account?')) return;
    await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' });
    loadInstructors();
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
      alert(`Password reset for ${pwTargetUser.name}!`);
      setPwModalOpen(false);
      setNewPassword('');
    } catch (err: any) {
      alert('Error resetting password');
    }
  };

  const filtered = instructors.filter(
    (i) =>
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Faculty Instructor Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Author and provision faculty accounts with curriculum authoring permissions.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-sm w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>Add Faculty Instructor</span>
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search instructors by name or email..."
          className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30"
        />
      </div>

      {filtered.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-subtle">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-semibold">
                <tr>
                  <th className="px-6 py-4">Faculty Member</th>
                  <th className="px-6 py-4">Designation</th>
                  <th className="px-6 py-4">Contact Phone</th>
                  <th className="px-6 py-4">Assigned Modules</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((inst) => (
                  <tr key={inst.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{inst.name}</div>
                      <div className="text-xs text-slate-400">{inst.email}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {inst.instructorDetails?.designation || 'Faculty'}
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {inst.phone || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-teal-700 font-semibold">
                      Modules 01 - 07
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(inst)}
                        className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          inst.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <Power className="w-3 h-3" />
                        <span>{inst.status}</span>
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setPwTargetUser(inst);
                          setNewPassword('Faculty2026!');
                          setPwModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-amber-600 transition"
                        title="Reset Password"
                      >
                        <Key className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(inst)}
                        className="p-1.5 text-slate-400 hover:text-teal-600 transition"
                        title="Edit Details"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(inst.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                        title="Delete Instructor"
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
            <GraduationCap className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">0 Instructors Added</h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            Faculty accounts are provisioned exclusively by administrators. Click "Add Faculty Instructor" to create an authorized instructor.
          </p>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-brand-navy text-white flex items-center justify-between">
              <h3 className="text-base font-bold">
                {editingId ? 'Edit Instructor Account' : 'Add New Faculty Instructor'}
              </h3>
              <button onClick={() => setModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Designation</label>
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="e.g. Senior AI Curriculum Specialist"
                  className="w-full text-sm px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3">
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
                  Save Instructor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {pwModalOpen && pwTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Reset Instructor Password</h3>
            <p className="text-xs text-slate-500">
              Set temporary password for <strong>{pwTargetUser.name}</strong>.
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
                  Save Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
