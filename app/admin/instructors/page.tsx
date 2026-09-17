'use client';

import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Plus,
  Trash2,
  Edit,
  Key,
  Power,
  Search,
  Send,
  Phone,
  Mail,
  PenTool,
  ShieldCheck,
  MessageSquare,
} from 'lucide-react';
import { User } from '@/lib/db/types';
import CommunicationModal, {
  CommunicationMode,
  CommunicationAction,
} from '@/components/CommunicationModal';

export default function AdminInstructorsPage() {
  const [instructors, setInstructors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Add / Edit Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [designation, setDesignation] = useState('Senior AI Faculty');
  const [dispatchWaOnCreate, setDispatchWaOnCreate] = useState(true);
  const [dispatchEmailOnCreate, setDispatchEmailOnCreate] = useState(true);

  // Communications Modal State
  const [commModalOpen, setCommModalOpen] = useState(false);
  const [commMode, setCommMode] = useState<CommunicationMode>('INDIVIDUAL');
  const [commTargetUser, setCommTargetUser] = useState<User | null>(null);
  const [commInitialAction, setCommInitialAction] = useState<CommunicationAction>('CUSTOM_MESSAGE');
  const [commInitialChannels, setCommInitialChannels] = useState<{ wa?: boolean; email?: boolean }>({
    wa: true,
    email: true,
  });

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
    setDispatchWaOnCreate(true);
    setDispatchEmailOnCreate(true);
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

  // Open Communication Modal with specific action and channels
  const handleOpenComm = (
    inst: User,
    action: CommunicationAction = 'CUSTOM_MESSAGE',
    channels: { wa?: boolean; email?: boolean } = { wa: true, email: true }
  ) => {
    setCommTargetUser(inst);
    setCommMode('INDIVIDUAL');
    setCommInitialAction(action);
    setCommInitialChannels(channels);
    setCommModalOpen(true);
  };

  const handleOpenBroadcast = () => {
    setCommTargetUser(null);
    setCommMode('BROADCAST');
    setCommInitialAction('CUSTOM_MESSAGE');
    setCommInitialChannels({ wa: true, email: true });
    setCommModalOpen(true);
  };

  const handleOpenManual = () => {
    setCommTargetUser(null);
    setCommMode('MANUAL');
    setCommInitialAction('CUSTOM_MESSAGE');
    setCommInitialChannels({ wa: true, email: true });
    setCommModalOpen(true);
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
        const createdData = await res.json();
        if (!res.ok) {
          throw new Error(createdData.error || 'Failed to create instructor');
        }

        // Auto-dispatch credentials via WhatsApp & Email upon creation if enabled
        const channels: ('WHATSAPP' | 'EMAIL')[] = [];
        if (dispatchWaOnCreate && phone) channels.push('WHATSAPP');
        if (dispatchEmailOnCreate && email) channels.push('EMAIL');

        if (channels.length > 0) {
          await fetch('/api/admin/communications/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recipientScope: 'INDIVIDUAL',
              actionType: 'SEND_CREDENTIALS',
              userId: createdData.user?.id,
              recipientName: name,
              recipientPhone: phone,
              recipientEmail: email,
              targetRole: 'INSTRUCTOR',
              role: 'INSTRUCTOR',
              newPassword: password,
              channels,
            }),
          }).catch((err) => console.warn('Auto credential dispatch failed:', err));
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

  const filtered = instructors.filter(
    (i) =>
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (i.phone && i.phone.includes(searchQuery))
  );

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Faculty Instructor Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Author and provision faculty accounts with automated WhatsApp & Email credentials and notice dispatch.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Manual Send */}
          <button
            type="button"
            onClick={handleOpenManual}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition border border-slate-200 shadow-2xs cursor-pointer"
            title="Type custom name, WhatsApp number, or email to message directly"
          >
            <PenTool className="w-4 h-4 text-teal-600" />
            <span>Manual Send</span>
          </button>

          {/* Broadcast to all faculty */}
          <button
            type="button"
            onClick={handleOpenBroadcast}
            disabled={instructors.length === 0}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 bg-brand-navy hover:bg-slate-900 text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-2xs cursor-pointer disabled:opacity-50"
            title="Send mass announcement to all faculty members"
          >
            <Send className="w-4 h-4 text-teal-400" />
            <span>Broadcast Faculty ({instructors.length})</span>
          </button>

          {/* Add Instructor */}
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Faculty Instructor</span>
          </button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search instructors by name, email, or phone..."
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
                  <th className="px-6 py-4 text-right">Email & WhatsApp Actions</th>
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
                    <td className="px-6 py-4 text-slate-700 font-mono">
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
                    <td className="px-6 py-4 text-right space-x-1 whitespace-nowrap">
                      {/* WhatsApp Quick Send Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenComm(inst, 'CUSTOM_MESSAGE', { wa: true, email: false })}
                        className="p-1.5 text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition cursor-pointer inline-flex items-center space-x-1 px-2 shadow-2xs"
                        title="Send WhatsApp Message"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-[11px] font-bold">WhatsApp</span>
                      </button>

                      {/* Email Quick Send Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenComm(inst, 'CUSTOM_MESSAGE', { wa: false, email: true })}
                        className="p-1.5 text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition cursor-pointer inline-flex items-center space-x-1 px-2 shadow-2xs"
                        title="Send Email"
                      >
                        <Mail className="w-3.5 h-3.5 text-teal-600" />
                        <span className="text-[11px] font-bold">Email</span>
                      </button>

                      {/* Full Dispatch Credentials / Notice Modal */}
                      <button
                        type="button"
                        onClick={() => handleOpenComm(inst, 'SEND_CREDENTIALS', { wa: true, email: true })}
                        className="p-1.5 text-brand-navy hover:bg-slate-100 border border-slate-200 rounded-lg transition cursor-pointer inline-flex items-center space-x-1 px-2 shadow-2xs"
                        title="Send Login Credentials via WhatsApp & Email"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                        <span className="text-[11px] font-bold">Credentials</span>
                      </button>

                      {/* Reset Password Button with WhatsApp & Email Dispatch */}
                      <button
                        type="button"
                        onClick={() => handleOpenComm(inst, 'RESET_PASSWORD', { wa: true, email: true })}
                        className="p-1.5 text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition cursor-pointer inline-flex items-center space-x-1 px-2 shadow-2xs"
                        title="Reset Password & Dispatch via WhatsApp and Email"
                      >
                        <Key className="w-3.5 h-3.5 text-amber-600" />
                        <span className="text-[11px] font-bold">Reset PW</span>
                      </button>

                      {/* Edit Details */}
                      <button
                        onClick={() => handleOpenEdit(inst)}
                        className="p-1.5 text-slate-400 hover:text-teal-600 transition cursor-pointer"
                        title="Edit Details"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      {/* Delete Instructor */}
                      <button
                        onClick={() => handleDelete(inst.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition cursor-pointer"
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
            Faculty accounts are provisioned exclusively by administrators. Click "Add Faculty Instructor" to create an authorized instructor with automated WhatsApp and Email dispatch.
          </p>
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-brand-navy text-white flex items-center justify-between">
              <h3 className="text-base font-bold">
                {editingId ? 'Edit Instructor Account' : 'Add New Faculty Instructor'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-300 hover:text-white font-bold">✕</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Ramesh Rao"
                  className="w-full text-sm px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. ramesh@pragathiai.faculty"
                  className="w-full text-sm px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500"
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
                    placeholder="Faculty2026!"
                    className="w-full text-sm px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:ring-2 focus:ring-teal-500"
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
                  className="w-full text-sm px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp / Contact Phone *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9618611522"
                  className="w-full text-sm px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Automatic Dispatch Options on Account Creation */}
              {!editingId && (
                <div className="p-3.5 bg-teal-50/70 border border-teal-200 rounded-xl space-y-2">
                  <span className="text-xs font-bold text-teal-950 flex items-center space-x-1.5">
                    <Send className="w-3.5 h-3.5 text-teal-600" />
                    <span>Send Login Credentials to Instructor</span>
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <label className="flex items-center space-x-2 cursor-pointer p-1.5 bg-white rounded-lg border border-teal-100">
                      <input
                        type="checkbox"
                        checked={dispatchWaOnCreate}
                        onChange={(e) => setDispatchWaOnCreate(e.target.checked)}
                        className="rounded text-teal-600"
                      />
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="font-semibold text-slate-800">via WhatsApp</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer p-1.5 bg-white rounded-lg border border-teal-100">
                      <input
                        type="checkbox"
                        checked={dispatchEmailOnCreate}
                        onChange={(e) => setDispatchEmailOnCreate(e.target.checked)}
                        className="rounded text-teal-600"
                      />
                      <Mail className="w-3.5 h-3.5 text-teal-600" />
                      <span className="font-semibold text-slate-800">via Email</span>
                    </label>
                  </div>
                  <p className="text-[10px] text-teal-700">
                    Will automatically dispatch credentials, temporary password, and faculty portal link upon saving.
                  </p>
                </div>
              )}

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl transition shadow-xs cursor-pointer"
                >
                  Save & Provision Instructor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Unified Communications Modal for Instructors (WhatsApp & Email Dispatch) */}
      <CommunicationModal
        isOpen={commModalOpen}
        onClose={() => {
          setCommModalOpen(false);
          setCommTargetUser(null);
        }}
        onSuccess={loadInstructors}
        mode={commMode}
        targetRole="INSTRUCTOR"
        initialAction={commInitialAction}
        initialChannels={commInitialChannels}
        targetUser={
          commTargetUser
            ? {
                id: commTargetUser.id,
                name: commTargetUser.name,
                email: commTargetUser.email,
                phone: commTargetUser.phone,
                role: 'INSTRUCTOR',
              }
            : null
        }
        broadcastCount={instructors.length}
        currentUserRole="ADMIN"
      />
    </div>
  );
}
