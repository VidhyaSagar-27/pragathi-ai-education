'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Trash2,
  Edit,
  Key,
  Power,
  Search,
  AlertCircle,
  CheckCircle2,
  UserCheck,
  Check,
  X,
  Mail,
  Phone,
  School,
  MapPin,
  Calendar,
  Sparkles,
  MessageSquare,
  Camera,
  Send,
  AlertTriangle,
  PenTool,
} from 'lucide-react';
import { User, StudentRegistration } from '@/lib/db/types';
import StudentPhotoModal from '@/components/StudentPhotoModal';
import CommunicationModal from '@/components/CommunicationModal';

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<User[]>([]);
  const [registrations, setRegistrations] = useState<StudentRegistration[]>([]);
  const [activeTab, setActiveTab] = useState<'enrolled' | 'pending'>('enrolled');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [manualCommOpen, setManualCommOpen] = useState(false);

  // Student Photo Modal State
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [activePhotoStudent, setActivePhotoStudent] = useState<User | null>(null);

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
  const [photoUrl, setPhotoUrl] = useState('');

  // Password reset modal
  const [pwModalOpen, setPwModalOpen] = useState(false);
  const [pwTargetUser, setPwTargetUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // Registration Approval Modal
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [activeReg, setActiveReg] = useState<StudentRegistration | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState('Pragathi2026!');
  const [customEmail, setCustomEmail] = useState('');
  const [approvedResult, setApprovedResult] = useState<any | null>(null);

  // Anytime Communications Dispatch Modal State
  const [commModalOpen, setCommModalOpen] = useState(false);
  const [commTargetStudent, setCommTargetStudent] = useState<User | null>(null);
  const [commActionType, setCommActionType] = useState<
    'SEND_CREDENTIALS' | 'RESET_PASSWORD' | 'CUSTOM_MESSAGE'
  >('SEND_CREDENTIALS');
  const [commNewPassword, setCommNewPassword] = useState('Pragathi2026!');
  const [commCustomSubject, setCommCustomSubject] = useState('');
  const [commCustomMessage, setCommCustomMessage] = useState('');
  const [commChannelWa, setCommChannelWa] = useState(true);
  const [commChannelEmail, setCommChannelEmail] = useState(true);
  const [commSending, setCommSending] = useState(false);
  const [commSuccess, setCommSuccess] = useState<string | null>(null);
  const [commError, setCommError] = useState<string | null>(null);
  const [commDelivery, setCommDelivery] = useState<any>(null);

  // Broadcast Modal State (Dispatch to all at once)
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [broadcastSubject, setBroadcastSubject] = useState('Important Announcement from PRAGATHI AI');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastChannelWa, setBroadcastChannelWa] = useState(true);
  const [broadcastChannelEmail, setBroadcastChannelEmail] = useState(true);
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState<string | null>(null);
  const [broadcastError, setBroadcastError] = useState<string | null>(null);
  const [broadcastDelivery, setBroadcastDelivery] = useState<any>(null);

  const handleOpenCommModal = (stu: User) => {
    setCommTargetStudent(stu);
    setCommActionType('SEND_CREDENTIALS');
    setCommNewPassword('Pragathi2026!');
    setCommCustomSubject('');
    setCommCustomMessage('');
    setCommChannelWa(true);
    setCommChannelEmail(true);
    setCommSuccess(null);
    setCommError(null);
    setCommDelivery(null);
    setCommModalOpen(true);
  };

  const handleSendComm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commTargetStudent) return;
    const channels: ('WHATSAPP' | 'EMAIL')[] = [];
    if (commChannelWa) channels.push('WHATSAPP');
    if (commChannelEmail) channels.push('EMAIL');
    if (channels.length === 0) {
      setCommError('Please select at least one delivery channel (WhatsApp or Email).');
      return;
    }

    setCommSending(true);
    setCommSuccess(null);
    setCommError(null);

    try {
      const res = await fetch('/api/admin/communications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientScope: 'INDIVIDUAL',
          studentId: commTargetStudent.studentDetails?.studentId,
          userId: commTargetStudent.id,
          actionType: commActionType,
          channels,
          newPassword: commActionType === 'RESET_PASSWORD' ? commNewPassword : undefined,
          customSubject: commActionType === 'CUSTOM_MESSAGE' ? commCustomSubject : undefined,
          customMessage: commActionType === 'CUSTOM_MESSAGE' ? commCustomMessage : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to dispatch communication');

      setCommSuccess(data.message || `Dispatched successfully via ${channels.join(' & ')}!`);
      setCommDelivery(data.delivery || null);
      loadData();
    } catch (err: any) {
      setCommError(err.message || 'Error dispatching communication');
    } finally {
      setCommSending(false);
    }
  };

  const handleOpenBroadcast = () => {
    setBroadcastSubject('Important Announcement from PRAGATHI AI');
    setBroadcastMessage('');
    setBroadcastChannelWa(true);
    setBroadcastChannelEmail(true);
    setBroadcastSuccess(null);
    setBroadcastError(null);
    setBroadcastDelivery(null);
    setBroadcastModalOpen(true);
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    const channels: ('WHATSAPP' | 'EMAIL')[] = [];
    if (broadcastChannelWa) channels.push('WHATSAPP');
    if (broadcastChannelEmail) channels.push('EMAIL');
    if (channels.length === 0) {
      setBroadcastError('Please select at least one delivery channel (WhatsApp or Email).');
      return;
    }
    if (!broadcastMessage.trim()) {
      setBroadcastError('Please enter an announcement body to broadcast.');
      return;
    }

    setBroadcastSending(true);
    setBroadcastSuccess(null);
    setBroadcastError(null);

    try {
      const res = await fetch('/api/admin/communications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientScope: 'BROADCAST',
          actionType: 'CUSTOM_MESSAGE',
          channels,
          customSubject: broadcastSubject,
          customMessage: broadcastMessage,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to dispatch broadcast');

      setBroadcastSuccess(data.message || `Broadcast completed to all students!`);
      setBroadcastDelivery(data.delivered || null);
      loadData();
    } catch (err: any) {
      setBroadcastError(err.message || 'Error dispatching broadcast');
    } finally {
      setBroadcastSending(false);
    }
  };

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch(`/api/admin/users?role=STUDENT&_t=${Date.now()}`, { cache: 'no-store' }).then((r) => r.json()),
      fetch(`/api/admin/registrations?_t=${Date.now()}`, { cache: 'no-store' }).then((r) => r.json()),
    ])
      .then(([userData, regData]) => {
        const studentList = userData.users || [];
        const regList = regData.registrations || [];
        setStudents(studentList);
        setRegistrations(regList);

        // If there are pending applications and no enrolled students, default to pending tab
        if (studentList.length === 0 && regList.some((r: any) => r.status === 'PENDING')) {
          setActiveTab('pending');
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
    const onFocus = () => loadData();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const handleOpenPhotoModal = (stu: User) => {
    setActivePhotoStudent(stu);
    setPhotoModalOpen(true);
  };

  const handlePhotoSaved = (newUrl: string | null) => {
    if (!activePhotoStudent) return;
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === activePhotoStudent.id) {
          const baseDetails = s.studentDetails || {
            classGrade: '10',
            schoolName: '',
            parentName: '',
            location: '',
            group: 'Foundation Batch A',
          };
          return {
            ...s,
            studentDetails: {
              ...baseDetails,
              photoUrl: newUrl || undefined,
            },
          };
        }
        return s;
      })
    );
    if (editingId === activePhotoStudent.id) {
      setPhotoUrl(newUrl || '');
    }
  };

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
    setPhotoUrl('');
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
    setPhotoUrl(stu.studentDetails?.photoUrl || '');
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
            studentDetails: { classGrade, schoolName, parentName, location, group, photoUrl },
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
            studentDetails: { classGrade, schoolName, parentName, location, group, photoUrl },
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to create student');
        }
      }

      setModalOpen(false);
      loadData();
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
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student account?')) return;
    setStudents((prev) => prev.filter((s) => s.id !== id));
    await fetch(`/api/admin/users?id=${id}&_t=${Date.now()}`, { method: 'DELETE', cache: 'no-store' });
    loadData();
  };

  // Pending Registration Moderation Handlers
  const handleOpenApprove = (reg: StudentRegistration) => {
    setActiveReg(reg);
    const suggestedEmail = reg.email || `${reg.studentName.toLowerCase().replace(/[^a-z0-9]/g, '')}@pragathiai.student`;
    setCustomEmail(suggestedEmail);
    setGeneratedPassword('Pragathi2026!');
    setApprovedResult(null);
    setApproveModalOpen(true);
  };

  const handleConfirmApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReg) return;

    try {
      const res = await fetch('/api/admin/registrations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeReg.id,
          action: 'APPROVE',
          initialPassword: generatedPassword,
          customEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to approve registration');

      setApprovedResult(data.createdStudent);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRejectReg = async (id: string) => {
    if (!confirm('Reject this student application?')) return;
    setRegistrations((prev) => prev.map((r) => r.id === id ? { ...r, status: 'REJECTED' } : r));
    await fetch(`/api/admin/registrations?_t=${Date.now()}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'REJECT' }),
      cache: 'no-store',
    });
    loadData();
  };

  const handleDeleteReg = async (id: string) => {
    if (!confirm('Delete this registration record?')) return;
    setRegistrations((prev) => prev.filter((r) => r.id !== id));
    await fetch(`/api/admin/registrations?id=${id}&_t=${Date.now()}`, { method: 'DELETE', cache: 'no-store' });
    loadData();
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

  const pendingRegistrations = registrations.filter((r) => r.status === 'PENDING');

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentDetails?.schoolName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Title & Add Student CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Student Management & Enrollment
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review incoming student registration applications, provision accounts, and manage enrolled students.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setManualCommOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition border border-slate-200 shadow-2xs w-fit cursor-pointer"
            title="Type custom student name, mobile, or email to message directly"
          >
            <PenTool className="w-4 h-4 text-teal-600" />
            <span>Manual Send</span>
          </button>
          <button
            onClick={handleOpenBroadcast}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-brand-navy hover:bg-slate-900 text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-sm w-fit cursor-pointer"
          >
            <Send className="w-4 h-4 text-teal-400" />
            <span>Broadcast to All ({students.length})</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-sm w-fit cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Student Account</span>
          </button>
        </div>
      </div>

      {/* Pending Applications Alert Banner */}
      {pendingRegistrations.length > 0 && (
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start sm:items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 font-bold">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-950 flex items-center space-x-2">
                <span>{pendingRegistrations.length} New Student Registration Application{pendingRegistrations.length > 1 ? 's' : ''} Awaiting Review</span>
                <span className="px-2 py-0.5 bg-amber-200 text-amber-900 rounded-full text-[10px] font-black uppercase tracking-wider">Action Required</span>
              </p>
              <p className="text-xs text-amber-800 mt-0.5">
                Students registered through the public website. Review their details and approve to provision student portal access.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('pending')}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition shrink-0 flex items-center space-x-1.5 cursor-pointer"
          >
            <span>Review Applications ({pendingRegistrations.length})</span>
            <Check className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Tabs: Enrolled Students vs Pending Applications */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('enrolled')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
            activeTab === 'enrolled'
              ? 'bg-brand-navy text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Enrolled Students ({students.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pending')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
            activeTab === 'pending'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Pending Applications</span>
          {pendingRegistrations.length > 0 && (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'pending'
                  ? 'bg-white text-amber-700'
                  : 'bg-amber-100 text-amber-800 animate-pulse'
              }`}
            >
              {pendingRegistrations.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab Content: 1. PENDING APPLICATIONS */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Submitted Student Enrollment Applications ({registrations.length})
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              {pendingRegistrations.length} pending • {registrations.filter((r) => r.status === 'APPROVED').length} approved
            </span>
          </div>

          {registrations.length > 0 ? (
            <div className="space-y-3">
              {registrations.map((reg) => (
                <div
                  key={reg.id}
                  className={`bg-white rounded-2xl p-5 border shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-5 transition ${
                    reg.status === 'PENDING'
                      ? 'border-amber-300 ring-1 ring-amber-200 bg-amber-50/10'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 font-black flex items-center justify-center text-sm">
                        {reg.studentName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">{reg.studentName}</h3>
                        <p className="text-xs text-slate-500 font-medium">
                          {reg.schoolName} • Grade {reg.classGrade}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                          reg.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : reg.status === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800 font-black'
                        }`}
                      >
                        {reg.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-600 pt-1">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Parent / Guardian</span>
                        <strong className="text-slate-800">{reg.parentName}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Mobile Phone</span>
                        <strong className="text-slate-800 font-mono">{reg.mobileNumber}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Location</span>
                        <span className="text-slate-700">{reg.location}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Submitted Date</span>
                        <span className="text-slate-700">{new Date(reg.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {reg.email && (
                      <div className="text-xs text-slate-500">
                        Provided Email: <span className="text-teal-700 font-mono font-medium">{reg.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                    {reg.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleOpenApprove(reg)}
                          className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          <span>Approve & Accept</span>
                        </button>
                        <button
                          onClick={() => handleRejectReg(reg.id)}
                          className="inline-flex items-center space-x-1 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                          <span>Reject</span>
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => handleDeleteReg(reg.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                      title="Delete Application Record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center max-w-xl mx-auto border border-dashed border-slate-300 shadow-subtle">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-700 mx-auto flex items-center justify-center mb-4 border border-amber-100">
                <UserCheck className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">0 Registration Applications</h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                No student applications awaiting review. When students register on the website, their applications will appear here to accept.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab Content: 2. ENROLLED STUDENTS */}
      {activeTab === 'enrolled' && (
        <div className="space-y-4">
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
                      <th className="px-6 py-4">Student & Photo</th>
                      <th className="px-6 py-4">School & Grade</th>
                      <th className="px-6 py-4">Parent & Contact</th>
                      <th className="px-6 py-4">Cohort Group</th>
                      <th className="px-6 py-4 text-center">Photo</th>
                      <th className="px-6 py-4">Status</th>
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
                              <div className="font-bold text-slate-900 flex items-center space-x-2">
                                <span>{stu.name}</span>
                                {stu.studentDetails?.studentId && (
                                  <span className="font-mono text-[10px] font-black px-1.5 py-0.5 rounded bg-teal-100 text-teal-900 border border-teal-200">
                                    {stu.studentDetails.studentId}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-400">{stu.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-700">
                          <div>{stu.studentDetails?.schoolName || 'N/A'}</div>
                          <span className="text-[11px] text-teal-700 font-semibold">
                            Grade {stu.studentDetails?.classGrade || 'N/A'}
                            {stu.studentDetails?.section ? ` • Sec ${stu.studentDetails.section}` : ''}
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
                        <td className="px-6 py-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleOpenPhotoModal(stu)}
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-teal-200 bg-teal-50/80 hover:bg-teal-100 text-teal-800 text-xs font-bold transition shadow-2xs cursor-pointer"
                            title="Capture or upload student photo from camera or library"
                          >
                            <Camera className="w-3.5 h-3.5 text-teal-600" />
                            <span>{stu.studentDetails?.photoUrl ? 'Update Photo' : 'Add Photo'}</span>
                          </button>
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
                        <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                          <button
                            onClick={() => handleOpenCommModal(stu)}
                            className="p-1.5 text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition cursor-pointer inline-flex items-center space-x-1 px-2.5 shadow-2xs"
                            title="Send Credentials, Reset Password, or Dispatch Message via WhatsApp & Email"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span className="text-[11px] font-bold">Dispatch</span>
                          </button>
                          <button
                            onClick={() => {
                              setPwTargetUser(stu);
                              setNewPassword('Pragathi2026!');
                              setPwModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-amber-600 transition cursor-pointer"
                            title="Reset Password"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(stu)}
                            className="p-1.5 text-slate-400 hover:text-teal-600 transition cursor-pointer"
                            title="Edit Details"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(stu.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 transition cursor-pointer"
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
                No student accounts created yet. You can click &quot;Add Student Account&quot; above or approve incoming registration applications.
              </p>
            </div>
          )}
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Student Photo</label>
                <div className="flex items-center space-x-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-white border border-slate-300 flex items-center justify-center shrink-0 shadow-2xs">
                    {photoUrl ? (
                      <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (editingId) {
                            const currentStu = students.find((s) => s.id === editingId);
                            if (currentStu) handleOpenPhotoModal(currentStu);
                          } else {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.onchange = (ev: any) => {
                              const file = ev.target?.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (e) => {
                                  if (e.target?.result) {
                                    setPhotoUrl(String(e.target.result));
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            };
                            input.click();
                          }
                        }}
                        className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold inline-flex items-center space-x-1.5 transition cursor-pointer shadow-xs"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>{photoUrl ? 'Change Photo (Camera/Library)' : 'Capture / Upload Photo'}</span>
                      </button>
                      {photoUrl && (
                        <button
                          type="button"
                          onClick={() => setPhotoUrl('')}
                          className="px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Both Admin and Instructor can capture student photos using live camera or select from file library.
                    </p>
                  </div>
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

      {/* Approval Modal */}
      {approveModalOpen && activeReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                  Student Account Provisioning
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Accept Student: {activeReg.studentName}
                </h3>
              </div>
              <button
                onClick={() => setApproveModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1"
              >
                ✕
              </button>
            </div>

            {approvedResult ? (
              <div className="space-y-4 py-2">
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl space-y-2">
                  <p className="font-bold text-sm flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Account Successfully Provisioned!</span>
                  </p>
                  <p className="text-xs">
                    Login Email: <code className="bg-white px-1.5 py-0.5 rounded font-mono text-emerald-950 font-bold select-all">{approvedResult.email}</code>
                  </p>
                  <p className="text-xs">
                    Password: <code className="bg-white px-1.5 py-0.5 rounded font-mono text-emerald-950 font-bold select-all">{approvedResult.temporaryPassword}</code>
                  </p>
                  <p className="text-[11px] text-emerald-700 mt-1">
                    Student has been added to Enrolled Students and approval notification dispatched.
                  </p>
                </div>

                {/* 1-Click WhatsApp Direct Dispatch */}
                {activeReg && (
                  <a
                    href={`https://wa.me/91${activeReg.mobileNumber.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(
                      `*PRAGATHI AI EDUCATION - ADMISSION APPROVED*\n\nDear ${activeReg.studentName},\nCongratulations! Your application has been approved by the administration.\n\nHere are your official login credentials:\nStudent Name: ${activeReg.studentName}\nLogin Email: ${approvedResult.email}\nPassword: ${approvedResult.temporaryPassword}\n\n👉 Direct 1-Click Access to Student Portal:\nhttps://pragathi-ai-education.vercel.app/register?tab=status&q=${activeReg.mobileNumber.replace(/\D/g, '').slice(-10)}\n\n👉 Portal Login:\nhttps://pragathi-ai-education.vercel.app/login?email=${encodeURIComponent(approvedResult.email)}&role=STUDENT\n\nPlease access your student dashboard and begin your learning journey!`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center space-x-2 shadow-xs cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Send Credentials via WhatsApp to Student</span>
                  </a>
                )}

                <button
                  onClick={() => {
                    setApproveModalOpen(false);
                    setActiveTab('enrolled');
                  }}
                  className="w-full py-2.5 bg-brand-navy hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  View in Enrolled Students
                </button>
              </div>
            ) : (
              <form onSubmit={handleConfirmApprove} className="space-y-4">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Accepting this application automatically provisions an active student portal account for <strong>{activeReg.studentName}</strong>:
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Student Login Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    className="w-full text-sm px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Initial Temporary Password *
                  </label>
                  <input
                    type="text"
                    required
                    value={generatedPassword}
                    onChange={(e) => setGeneratedPassword(e.target.value)}
                    className="w-full text-sm px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">Default: Pragathi2026! (Student can update upon sign-in)</span>
                </div>

                <div className="pt-3 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setApproveModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve & Provision Account</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Anytime Communications & Credential Dispatch Modal */}
      {commModalOpen && commTargetStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider block">
                  Automated Dispatch & Helpdesk
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Dispatch to {commTargetStudent.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCommModalOpen(false);
                  setCommTargetStudent(null);
                }}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {commSuccess ? (
              <div className="space-y-4 py-2">
                <div className={`p-4 rounded-xl space-y-3 ${
                  commDelivery?.whatsapp?.dispatched === false && commChannelWa
                    ? 'bg-amber-50 border border-amber-200 text-amber-900'
                    : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                }`}>
                  <div className="font-bold text-sm flex items-center space-x-1.5">
                    {commDelivery?.whatsapp?.dispatched === false && commChannelWa ? (
                      <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    )}
                    <span>{commDelivery?.whatsapp?.dispatched === false && commChannelWa ? 'Delivery Report with Notice' : 'Communication Dispatched Successfully!'}</span>
                  </div>
                  <p className="text-xs leading-relaxed">{commSuccess}</p>

                  {/* Channel Breakdown */}
                  {commDelivery && (
                    <div className="space-y-2 pt-2 border-t border-slate-200/60 text-xs">
                      {commChannelEmail && (
                        <div className="flex items-center justify-between">
                          <span className="flex items-center space-x-1 font-medium text-slate-700">
                            <Mail className="w-3.5 h-3.5 text-teal-600" />
                            <span>Email ({commTargetStudent.email}):</span>
                          </span>
                          {commDelivery.email?.dispatched ? (
                            <span className="font-semibold text-emerald-700 flex items-center">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Sent (Gmail API)
                            </span>
                          ) : (
                            <span className="font-semibold text-rose-600 flex items-center">
                              <AlertCircle className="w-3.5 h-3.5 mr-1" /> Failed ({commDelivery.email?.error || 'Error'})
                            </span>
                          )}
                        </div>
                      )}

                      {commChannelWa && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center space-x-1 font-medium text-slate-700">
                              <Phone className="w-3.5 h-3.5 text-emerald-600" />
                              <span>WhatsApp (+91 {commTargetStudent.phone?.replace(/\D/g, '').slice(-10)}):</span>
                            </span>
                            {commDelivery.whatsapp?.dispatched ? (
                              <span className="font-semibold text-emerald-700 flex items-center">
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Delivered (Meta API)
                              </span>
                            ) : (
                              <span className="font-semibold text-amber-700 flex items-center">
                                <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-600" /> Blocked / Not Delivered
                              </span>
                            )}
                          </div>
                          {commDelivery.whatsapp?.error && (
                            <div className="p-2.5 bg-amber-100/70 border border-amber-300 rounded-lg text-[11px] text-amber-900 mt-1">
                              <p className="font-semibold">⚠️ WhatsApp Gateway Feedback:</p>
                              <p className="mt-0.5">{commDelivery.whatsapp.error}</p>
                              {commDelivery.whatsapp.error.includes('allowed') && (
                                <p className="mt-1 text-[10px] text-amber-800">
                                  💡 <strong>Meta Sandbox Restriction:</strong> In Meta developer test mode, recipient numbers must be added to your <em>Allowed Recipient Phone Numbers</em> list in Meta Developer Console before Meta will permit delivery.
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCommModalOpen(false);
                    setCommTargetStudent(null);
                  }}
                  className="w-full py-2.5 bg-brand-navy hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendComm} className="space-y-4">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Student ID:</span>
                    <strong className="font-mono text-teal-800 font-bold">
                      {commTargetStudent.studentDetails?.studentId || commTargetStudent.id}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Login Email:</span>
                    <strong className="font-mono text-slate-800">{commTargetStudent.email}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">WhatsApp Mobile:</span>
                    <strong className="font-mono text-slate-800">
                      +91 {commTargetStudent.phone?.replace(/\D/g, '').slice(-10) || 'N/A'}
                    </strong>
                  </div>
                </div>

                {commError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{commError}</span>
                  </div>
                )}

                {/* Delivery Channel Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Select Delivery Channel(s) *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <label
                      className={`flex items-center space-x-2.5 p-2.5 rounded-xl border cursor-pointer transition text-xs font-semibold ${
                        commChannelWa
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-2xs'
                          : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={commChannelWa}
                        onChange={(e) => setCommChannelWa(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 rounded-sm focus:ring-emerald-500"
                      />
                      <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <div className="truncate">
                        <span className="block font-bold">WhatsApp</span>
                        <span className="text-[10px] text-slate-500 block truncate">
                          +91 {commTargetStudent.phone?.replace(/\D/g, '').slice(-10) || 'Mobile'}
                        </span>
                      </div>
                    </label>

                    <label
                      className={`flex items-center space-x-2.5 p-2.5 rounded-xl border cursor-pointer transition text-xs font-semibold ${
                        commChannelEmail
                          ? 'bg-teal-50 border-teal-300 text-teal-950 shadow-2xs'
                          : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={commChannelEmail}
                        onChange={(e) => setCommChannelEmail(e.target.checked)}
                        className="w-4 h-4 text-teal-600 rounded-sm focus:ring-teal-500"
                      />
                      <Mail className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <div className="truncate">
                        <span className="block font-bold">Email</span>
                        <span className="text-[10px] text-slate-500 block truncate">
                          {commTargetStudent.email}
                        </span>
                      </div>
                    </label>
                  </div>
                  {!commChannelWa && !commChannelEmail && (
                    <span className="text-[11px] text-rose-600 mt-1 block">
                      ⚠️ Please check at least one channel (WhatsApp or Email).
                    </span>
                  )}
                </div>

                {/* Action selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Select Dispatch Action *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setCommActionType('SEND_CREDENTIALS')}
                      className={`p-2 rounded-xl text-xs font-bold border transition cursor-pointer text-center ${
                        commActionType === 'SEND_CREDENTIALS'
                          ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Send Login Credentials
                    </button>
                    <button
                      type="button"
                      onClick={() => setCommActionType('RESET_PASSWORD')}
                      className={`p-2 rounded-xl text-xs font-bold border transition cursor-pointer text-center ${
                        commActionType === 'RESET_PASSWORD'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Reset Password
                    </button>
                    <button
                      type="button"
                      onClick={() => setCommActionType('CUSTOM_MESSAGE')}
                      className={`p-2 rounded-xl text-xs font-bold border transition cursor-pointer text-center ${
                        commActionType === 'CUSTOM_MESSAGE'
                          ? 'bg-brand-navy text-white border-brand-navy shadow-2xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Custom Notice
                    </button>
                  </div>
                </div>

                {/* Conditional Fields based on action */}
                {commActionType === 'RESET_PASSWORD' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      New Password to Set & Dispatch *
                    </label>
                    <input
                      type="text"
                      required
                      value={commNewPassword}
                      onChange={(e) => setCommNewPassword(e.target.value)}
                      placeholder="e.g. Pragathi2026!"
                      className="w-full text-xs sm:text-sm px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:ring-2 focus:ring-teal-500"
                    />
                    <span className="text-[11px] text-slate-400 mt-0.5 block">
                      This will overwrite the password and send new login instructions immediately.
                    </span>
                  </div>
                )}

                {commActionType === 'CUSTOM_MESSAGE' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Notice Subject / Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={commCustomSubject}
                        onChange={(e) => setCommCustomSubject(e.target.value)}
                        placeholder="e.g. Important Class Schedule Update"
                        className="w-full text-xs sm:text-sm px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Notice Body / Message *
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={commCustomMessage}
                        onChange={(e) => setCommCustomMessage(e.target.value)}
                        placeholder="Enter notice text to send..."
                        className="w-full text-xs sm:text-sm p-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                )}

                {commActionType === 'SEND_CREDENTIALS' && (
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Will trigger an automated dispatch sending this student's login ID, registered email, and direct 1-click access links.
                  </p>
                )}

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCommModalOpen(false);
                      setCommTargetStudent(null);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={commSending || (!commChannelWa && !commChannelEmail)}
                    className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>
                      {commSending
                        ? 'Dispatching...'
                        : commChannelWa && commChannelEmail
                        ? 'Dispatch via WhatsApp & Email'
                        : commChannelWa
                        ? 'Dispatch via WhatsApp Only'
                        : commChannelEmail
                        ? 'Dispatch via Email Only'
                        : 'Select a Channel'}
                    </span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Broadcast Modal (Dispatch to All Enrolled Students) */}
      {broadcastModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider block">
                  Broadcast Command Center
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5 flex items-center space-x-2">
                  <Send className="w-4 h-4 text-teal-600" />
                  <span>Broadcast Notice to All Students</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setBroadcastModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {broadcastSuccess ? (
              <div className="space-y-4 py-2">
                <div className={`p-4 rounded-xl space-y-3 ${
                  broadcastDelivery && broadcastDelivery.whatsapp === 0 && broadcastChannelWa
                    ? 'bg-amber-50 border border-amber-200 text-amber-900'
                    : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                }`}>
                  <div className="font-bold text-sm flex items-center space-x-1.5">
                    {broadcastDelivery && broadcastDelivery.whatsapp === 0 && broadcastChannelWa ? (
                      <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    )}
                    <span>Broadcast Report</span>
                  </div>
                  <p className="text-xs leading-relaxed">{broadcastSuccess}</p>

                  {broadcastDelivery && (
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-xs">
                      {broadcastChannelEmail && (
                        <div className="p-2.5 bg-white/90 rounded-xl border border-teal-200">
                          <span className="text-slate-500 block text-[11px] font-medium">Email Deliveries:</span>
                          <span className="font-bold text-teal-900 text-sm">{broadcastDelivery.email} / {students.length} Sent</span>
                        </div>
                      )}
                      {broadcastChannelWa && (
                        <div className="p-2.5 bg-white/90 rounded-xl border border-amber-200">
                          <span className="text-slate-500 block text-[11px] font-medium">WhatsApp Deliveries:</span>
                          <span className="font-bold text-amber-900 text-sm">{broadcastDelivery.whatsapp} / {students.length} Delivered</span>
                          {broadcastDelivery.whatsapp === 0 && (
                            <p className="text-[10px] text-amber-800 mt-1">
                              * Blocked by Meta Test Sandbox: numbers must be in Meta Developer console allowed list.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setBroadcastModalOpen(false)}
                  className="w-full py-2.5 bg-brand-navy hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendBroadcast} className="space-y-4">
                <div className="p-3 bg-teal-50/60 border border-teal-200 rounded-xl text-xs flex items-center justify-between">
                  <div>
                    <span className="text-teal-900 font-bold block">Target Audience:</span>
                    <span className="text-teal-700 text-[11px]">
                      All Enrolled Students ({students.length} students currently registered)
                    </span>
                  </div>
                  <span className="px-2.5 py-1 bg-teal-600 text-white font-bold rounded-lg text-[10px] uppercase">
                    Mass Dispatch
                  </span>
                </div>

                {broadcastError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{broadcastError}</span>
                  </div>
                )}

                {/* Delivery Channel Toggles */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Select Broadcast Channel(s) *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <label
                      className={`flex items-center space-x-2.5 p-2.5 rounded-xl border cursor-pointer transition text-xs font-semibold ${
                        broadcastChannelWa
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-2xs'
                          : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={broadcastChannelWa}
                        onChange={(e) => setBroadcastChannelWa(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 rounded-sm focus:ring-emerald-500"
                      />
                      <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <div>
                        <span className="block font-bold">WhatsApp</span>
                        <span className="text-[10px] text-slate-500 block">
                          Official Meta Cloud API
                        </span>
                      </div>
                    </label>

                    <label
                      className={`flex items-center space-x-2.5 p-2.5 rounded-xl border cursor-pointer transition text-xs font-semibold ${
                        broadcastChannelEmail
                          ? 'bg-teal-50 border-teal-300 text-teal-950 shadow-2xs'
                          : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={broadcastChannelEmail}
                        onChange={(e) => setBroadcastChannelEmail(e.target.checked)}
                        className="w-4 h-4 text-teal-600 rounded-sm focus:ring-teal-500"
                      />
                      <Mail className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <div>
                        <span className="block font-bold">Email</span>
                        <span className="text-[10px] text-slate-500 block">
                          Official Gmail API
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Quick Presets */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quick Announcement Templates
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setBroadcastSubject('Module Exam & Quiz Schedule Announcement');
                        setBroadcastMessage('Dear Students,\n\nPlease note that your upcoming Module Quiz is scheduled this week. Log in to your Pragathi AI portal to review your study materials and complete the quiz on time.');
                      }}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium transition cursor-pointer"
                    >
                      📝 Quiz / Exam Notice
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBroadcastSubject('Important Class Schedule Update');
                        setBroadcastMessage('Dear Students,\n\nPlease review the updated live class timing on your student dashboard under the Curriculum section. Ensure you join on time.');
                      }}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium transition cursor-pointer"
                    >
                      ⏰ Class Schedule
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBroadcastSubject('Holiday & Session Rescheduling Notice');
                        setBroadcastMessage('Dear Students,\n\nPlease note that classes will remain suspended on the upcoming holiday. Classes will resume as per regular schedule the following day.');
                      }}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium transition cursor-pointer"
                    >
                      🏖️ Holiday Notice
                    </button>
                  </div>
                </div>

                {/* Subject & Message inputs */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Notice Subject / Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={broadcastSubject}
                    onChange={(e) => setBroadcastSubject(e.target.value)}
                    placeholder="e.g. Important Announcement from PRAGATHI AI"
                    className="w-full text-xs sm:text-sm px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Notice Body / Message *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    placeholder="Write the announcement to broadcast to all students..."
                    className="w-full text-xs sm:text-sm p-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setBroadcastModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={broadcastSending || (!broadcastChannelWa && !broadcastChannelEmail)}
                    className="px-5 py-2 bg-brand-navy hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5 text-teal-400" />
                    <span>
                      {broadcastSending
                        ? `Broadcasting to ${students.length} students...`
                        : broadcastChannelWa && broadcastChannelEmail
                        ? `Broadcast to All via WhatsApp & Email`
                        : broadcastChannelWa
                        ? `Broadcast via WhatsApp Only`
                        : broadcastChannelEmail
                        ? `Broadcast via Email Only`
                        : 'Select Channel'}
                    </span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Student Photo Camera & Library Modal */}
      <StudentPhotoModal
        isOpen={photoModalOpen}
        onClose={() => {
          setPhotoModalOpen(false);
          setActivePhotoStudent(null);
        }}
        student={
          activePhotoStudent
            ? {
                id: activePhotoStudent.id,
                name: activePhotoStudent.name,
                email: activePhotoStudent.email,
                photoUrl: activePhotoStudent.studentDetails?.photoUrl,
              }
            : null
        }
        onPhotoSaved={handlePhotoSaved}
      />

      {/* Manual Ad-Hoc Communication Modal */}
      <CommunicationModal
        isOpen={manualCommOpen}
        onClose={() => setManualCommOpen(false)}
        onSuccess={loadData}
        mode="MANUAL"
        targetRole="STUDENT"
        currentUserRole="ADMIN"
      />
    </div>
  );
}
