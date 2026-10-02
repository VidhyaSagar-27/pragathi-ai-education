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
  Download,
  FileSpreadsheet,
  Archive,
  FolderArchive,
  Filter,
  Eye,
  FileText,
  UserPlus,
} from 'lucide-react';
import { User, StudentRegistration } from '@/lib/db/types';
import StudentPhotoModal from '@/components/StudentPhotoModal';
import CommunicationModal from '@/components/CommunicationModal';
import FastRegisterStudentModal from '@/components/FastRegisterStudentModal';
import ResetBatchConfirmModal from '@/components/ResetBatchConfirmModal';
import StudentDetailsModal from '@/components/StudentDetailsModal';
import { useDataSync, broadcastDataChange } from '@/lib/utils/syncEvents';

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<User[]>([]);
  const [registrations, setRegistrations] = useState<StudentRegistration[]>([]);
  const [activeTab, setActiveTab] = useState<'enrolled' | 'pending'>('enrolled');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [manualCommOpen, setManualCommOpen] = useState(false);

  // Modals for Fast Registration, Reset Batch, and View Details
  const [fastRegOpen, setFastRegOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [detailsStudent, setDetailsStudent] = useState<User | null>(null);

  // Table Filters & Export Dropdown
  const [filterSchool, setFilterSchool] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);

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

  useDataSync(loadData, { entity: 'students', pollIntervalMs: 8000 });

  useEffect(() => {
    loadData();
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
    setEmail(stu.email || '');
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

      broadcastDataChange('students', 'save');
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
    broadcastDataChange('students', 'toggle_status');
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student account?')) return;
    setStudents((prev) => prev.filter((s) => s.id !== id));
    await fetch(`/api/admin/users?id=${id}&_t=${Date.now()}`, { method: 'DELETE', cache: 'no-store' });
    broadcastDataChange('students', 'delete');
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
      broadcastDataChange('students', 'approve');
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
    broadcastDataChange('students', 'reject');
    loadData();
  };

  const handleDeleteReg = async (id: string) => {
    if (!confirm('Delete this registration record?')) return;
    setRegistrations((prev) => prev.filter((r) => r.id !== id));
    await fetch(`/api/admin/registrations?id=${id}&_t=${Date.now()}`, { method: 'DELETE', cache: 'no-store' });
    broadcastDataChange('students', 'delete_reg');
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

  const uniqueSchools = Array.from(
    new Set(students.map((s) => s.studentDetails?.schoolName).filter(Boolean))
  ) as string[];
  const uniqueClasses = Array.from(
    new Set(students.map((s) => s.studentDetails?.classGrade).filter(Boolean))
  ) as string[];

  const filtered = students.filter((s) => {
    const rollNo = (s.rollNumber || s.studentDetails?.rollNumber || s.studentDetails?.studentId || '').toLowerCase();
    const stuName = (s.name || '').toLowerCase();
    const phoneNo = (s.phone || s.studentDetails?.parentPhone || '').replace(/\D/g, '');
    const emailStr = (s.email || '').toLowerCase();
    const q = searchQuery.toLowerCase().trim();
    const qDigits = q.replace(/\D/g, '');

    const matchesQuery =
      !q ||
      rollNo.includes(q) ||
      stuName.includes(q) ||
      emailStr.includes(q) ||
      (qDigits.length >= 3 && phoneNo.includes(qDigits));

    if (!matchesQuery) return false;

    if (filterSchool && s.studentDetails?.schoolName !== filterSchool) return false;
    if (filterClass && s.studentDetails?.classGrade !== filterClass) return false;

    return true;
  });

  return (
    <div className="space-y-8">
      {/* Title & Batch Action CTAs */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Student Management & Enrollment
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Register students, manage profiles &amp; photos, export data, and oversee fresh batch enrollment.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Primary Fast Register Button */}
          <button
            onClick={() => setFastRegOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-sm w-fit cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Fast Register Student</span>
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition border border-slate-300 shadow-2xs w-fit cursor-pointer"
            >
              <Download className="w-4 h-4 text-teal-600" />
              <span>Export Data ▾</span>
            </button>

            {exportDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 p-1.5 space-y-1">
                <a
                  href="/api/admin/students/export?format=xlsx"
                  download
                  onClick={() => setExportDropdownOpen(false)}
                  className="flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-900 rounded-xl transition"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Download Excel (.xlsx)</span>
                </a>
                <a
                  href="/api/admin/students/export?format=csv"
                  download
                  onClick={() => setExportDropdownOpen(false)}
                  className="flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-900 rounded-xl transition"
                >
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span>Download CSV (.csv)</span>
                </a>
              </div>
            )}
          </div>

          {/* Download Photos ZIP */}
          <a
            href="/api/admin/students/photos-zip"
            download
            className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition border border-slate-300 shadow-2xs w-fit cursor-pointer"
            title="Download ZIP containing all student photos named PRG001_Name.jpg"
          >
            <Archive className="w-4 h-4 text-teal-600" />
            <span className="hidden sm:inline">Photos ZIP</span>
            <span className="sm:hidden">Photos</span>
          </a>

          {/* Download Data + Photos Bundle ZIP */}
          <a
            href="/api/admin/students/bundle-zip"
            download
            className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition border border-slate-300 shadow-2xs w-fit cursor-pointer"
            title="Download complete ZIP containing students.xlsx and photos/ folder"
          >
            <FolderArchive className="w-4 h-4 text-indigo-600" />
            <span className="hidden sm:inline">Data + Photos ZIP</span>
            <span className="sm:hidden">Bundle</span>
          </a>

          {/* Broadcast & Manual Send */}
          <button
            onClick={() => setManualCommOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition border border-slate-200 shadow-2xs w-fit cursor-pointer"
            title="Type custom student name, mobile, or email to message directly"
          >
            <PenTool className="w-4 h-4 text-teal-600" />
            <span className="hidden sm:inline">Manual Send</span>
          </button>

          <button
            onClick={handleOpenBroadcast}
            className="inline-flex items-center space-x-2 px-3.5 py-2.5 bg-brand-navy hover:bg-slate-900 text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-sm w-fit cursor-pointer"
          >
            <Send className="w-4 h-4 text-teal-400" />
            <span>Broadcast ({students.length})</span>
          </button>

          {/* Reset Student Batch Danger Button */}
          <button
            onClick={() => setResetModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs sm:text-sm font-bold transition shadow-2xs w-fit cursor-pointer"
            title="Permanently reset student registrations and reset roll numbers to PRG001"
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>Reset Batch</span>
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
          {/* Search & Filter Controls */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Roll Number (PRG001...), Student Name, or Phone..."
                  className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                />
              </div>

              {/* School Filter */}
              {uniqueSchools.length > 0 && (
                <div className="w-full md:w-52">
                  <select
                    value={filterSchool}
                    onChange={(e) => setFilterSchool(e.target.value)}
                    className="w-full text-xs sm:text-sm px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                  >
                    <option value="">All Schools ({uniqueSchools.length})</option>
                    {uniqueSchools.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Class Filter */}
              {uniqueClasses.length > 0 && (
                <div className="w-full md:w-36">
                  <select
                    value={filterClass}
                    onChange={(e) => setFilterClass(e.target.value)}
                    className="w-full text-xs sm:text-sm px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                  >
                    <option value="">All Classes</option>
                    {uniqueClasses.map((c) => (
                      <option key={c} value={c}>
                        Grade {c}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {(searchQuery || filterSchool || filterClass) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setFilterSchool('');
                    setFilterClass('');
                  }}
                  className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer shrink-0"
                >
                  Clear Filters
                </button>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
              <span>
                Showing <strong>{filtered.length}</strong> of {students.length} students
              </span>
              <span className="font-mono text-teal-700 font-semibold">
                Sequential Roll Numbering (PRG001+)
              </span>
            </div>
          </div>

          {filtered.length > 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-subtle">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-semibold">
                    <tr>
                      <th className="px-5 py-3.5 text-center">Photo</th>
                      <th className="px-5 py-3.5">Roll No.</th>
                      <th className="px-5 py-3.5">Student Name</th>
                      <th className="px-5 py-3.5">School</th>
                      <th className="px-5 py-3.5">Class</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((stu) => {
                      const rollNo =
                        stu.rollNumber ||
                        stu.studentDetails?.rollNumber ||
                        stu.studentDetails?.studentId ||
                        'PRG';
                      const cleanName = (stu.name || 'student').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
                      const photoUrl = stu.studentDetails?.photoUrl;

                      return (
                        <tr key={stu.id} className="hover:bg-slate-50/80 transition">
                          {/* Photo */}
                          <td className="px-5 py-3.5 text-center">
                            <div
                              onClick={() => handleOpenPhotoModal(stu)}
                              className="relative group w-11 h-11 rounded-2xl overflow-hidden bg-teal-50 border border-teal-200 flex items-center justify-center font-bold text-teal-800 shrink-0 cursor-pointer shadow-xs mx-auto"
                              title="Click to view, capture, or replace photo"
                            >
                              {photoUrl ? (
                                <img
                                  src={photoUrl}
                                  alt={stu.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-base font-bold">{stu.name.charAt(0).toUpperCase()}</span>
                              )}
                              <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                <Camera className="w-4 h-4" />
                              </div>
                            </div>
                          </td>

                          {/* Roll No. */}
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-teal-100 text-teal-900 border border-teal-300 shadow-2xs">
                              {rollNo}
                            </span>
                          </td>

                          {/* Student Name & Contact */}
                          <td className="px-5 py-3.5">
                            <div className="font-bold text-slate-900 flex items-center space-x-2">
                              <span>{stu.name}</span>
                            </div>
                            <div className="text-xs text-slate-500 font-mono mt-0.5">
                              📱 {stu.phone || stu.studentDetails?.parentPhone || 'No Phone'}
                            </div>
                            {stu.studentDetails?.parentName && (
                              <div className="text-[11px] text-slate-400">
                                Parent: {stu.studentDetails.parentName}
                              </div>
                            )}
                          </td>

                          {/* School */}
                          <td className="px-5 py-3.5 text-slate-700">
                            <div className="font-medium text-slate-900 max-w-[200px] truncate" title={stu.studentDetails?.schoolName}>
                              {stu.studentDetails?.schoolName || '—'}
                            </div>
                          </td>

                          {/* Class */}
                          <td className="px-5 py-3.5 text-slate-700 whitespace-nowrap">
                            <span className="font-semibold text-slate-800">
                              Grade {stu.studentDetails?.classGrade || '—'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                            {/* View / Download Student Profile Card */}
                            <button
                              type="button"
                              onClick={() => setDetailsStudent(stu)}
                              className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition cursor-pointer"
                              title="View Student Profile & Download Card"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Download Individual Photo */}
                            {photoUrl && (
                              <a
                                href={photoUrl}
                                download={`${rollNo}_${cleanName}.jpg`}
                                className="p-1.5 text-teal-600 hover:text-teal-800 hover:bg-teal-50 rounded-lg transition cursor-pointer inline-flex items-center"
                                title={`Download photo: ${rollNo}_${cleanName}.jpg`}
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            )}

                            {/* Replace / Upload Photo */}
                            <button
                              type="button"
                              onClick={() => handleOpenPhotoModal(stu)}
                              className="p-1.5 text-teal-600 hover:text-teal-800 hover:bg-teal-50 rounded-lg transition cursor-pointer"
                              title="Replace Student Photo (Camera/Upload)"
                            >
                              <Camera className="w-4 h-4" />
                            </button>

                            {/* Dispatch Communication (WhatsApp/Email) */}
                            <button
                              type="button"
                              onClick={() => handleOpenCommModal(stu)}
                              className="p-1.5 text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition cursor-pointer inline-flex items-center space-x-1 px-2 shadow-2xs"
                              title="Dispatch Login Credentials or Notice via WhatsApp & Email"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span className="text-[11px] font-bold">Dispatch</span>
                            </button>

                            {/* Reset Password */}
                            <button
                              type="button"
                              onClick={() => {
                                setPwTargetUser(stu);
                                setNewPassword(stu.phone || 'Pragathi2026!');
                                setPwModalOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                              title="Reset Password"
                            >
                              <Key className="w-4 h-4" />
                            </button>

                            {/* Edit Student */}
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(stu)}
                              className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition cursor-pointer"
                              title="Edit Details"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            {/* Delete Student */}
                            <button
                              type="button"
                              onClick={() => handleDelete(stu.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Delete Student Account"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
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
              <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed mb-4">
                No students enrolled yet. Click &quot;Fast Register Student&quot; to begin enrolling students with auto-incrementing roll numbers starting from PRG001.
              </p>
              <button
                type="button"
                onClick={() => setFastRegOpen(true)}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center space-x-1.5 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Register First Student</span>
              </button>
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

      {/* Fast Registration Modal */}
      <FastRegisterStudentModal
        isOpen={fastRegOpen}
        onClose={() => setFastRegOpen(false)}
        onStudentCreated={loadData}
      />

      {/* Reset Student Batch Confirmation Modal */}
      <ResetBatchConfirmModal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        onResetCompleted={loadData}
      />

      {/* Student Details & Download Profile Modal */}
      <StudentDetailsModal
        student={detailsStudent}
        onClose={() => setDetailsStudent(null)}
        onOpenPhotoModal={handleOpenPhotoModal}
      />
    </div>
  );
}
