'use client';

import React, { useState, useEffect } from 'react';
import {
  Send,
  Phone,
  Mail,
  Key,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  User as UserIcon,
  Sparkles,
} from 'lucide-react';

export type CommunicationMode = 'INDIVIDUAL' | 'BROADCAST' | 'MANUAL';
export type CommunicationTargetRole = 'STUDENT' | 'INSTRUCTOR';
export type CommunicationAction = 'CUSTOM_MESSAGE' | 'SEND_CREDENTIALS' | 'RESET_PASSWORD';

export interface CommunicationTargetUser {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  studentId?: string;
  role?: 'STUDENT' | 'INSTRUCTOR';
}

interface CommunicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  mode: CommunicationMode;
  targetRole?: CommunicationTargetRole;
  targetUser?: CommunicationTargetUser | null;
  broadcastCount?: number;
  currentUserRole?: 'ADMIN' | 'INSTRUCTOR';
  initialAction?: CommunicationAction;
  initialChannels?: { wa?: boolean; email?: boolean };
}

export default function CommunicationModal({
  isOpen,
  onClose,
  onSuccess,
  mode,
  targetRole = 'STUDENT',
  targetUser,
  broadcastCount = 0,
  currentUserRole = 'ADMIN',
  initialAction,
  initialChannels,
}: CommunicationModalProps) {
  // Channels
  const [channelWa, setChannelWa] = useState(true);
  const [channelEmail, setChannelEmail] = useState(true);

  // Action
  const [actionType, setActionType] = useState<CommunicationAction>(
    initialAction || (mode === 'BROADCAST' ? 'CUSTOM_MESSAGE' : 'CUSTOM_MESSAGE')
  );

  // Custom Message Fields
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  // Password Field
  const [newPassword, setNewPassword] = useState('');

  // Manual Recipient Fields
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualRole, setManualRole] = useState<CommunicationTargetRole>(targetRole);

  // Status State
  const [sending, setSending] = useState(false);
  const [successResult, setSuccessResult] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deliveryReport, setDeliveryReport] = useState<{
    whatsapp?: { dispatched: boolean; messageId?: string; error?: string };
    email?: { dispatched: boolean; messageId?: string; error?: string };
    deliveredCount?: { whatsapp: number; email: number };
  } | null>(null);

  // Initialize/reset form whenever modal opens or target changes
  useEffect(() => {
    if (isOpen) {
      setSending(false);
      setSuccessResult(null);
      setErrorMessage(null);
      setDeliveryReport(null);
      setChannelWa(initialChannels?.wa !== undefined ? initialChannels.wa : true);
      setChannelEmail(initialChannels?.email !== undefined ? initialChannels.email : true);

      const defaultAction: CommunicationAction =
        mode === 'BROADCAST' ? 'CUSTOM_MESSAGE' : initialAction || 'CUSTOM_MESSAGE';
      setActionType(defaultAction);

      const defaultSubject =
        mode === 'BROADCAST'
          ? targetRole === 'INSTRUCTOR'
            ? 'Important Notice for Faculty'
            : 'Important Announcement from PRAGATHI AI'
          : targetRole === 'INSTRUCTOR'
          ? 'Notice from Pragathi AI Administration'
          : currentUserRole === 'INSTRUCTOR'
          ? 'Update regarding your AI Foundation Course'
          : 'Official Notice from PRAGATHI AI';

      setSubject(defaultSubject);
      setMessage('');
      setNewPassword(targetRole === 'INSTRUCTOR' ? 'Faculty2026!' : 'Pragathi2026!');

      if (mode === 'MANUAL') {
        setManualName('');
        setManualPhone('');
        setManualEmail('');
        setManualRole(targetRole);
      }
    }
  }, [isOpen, mode, targetRole, targetUser, currentUserRole, initialAction, initialChannels]);

  if (!isOpen) return null;

  const resolvedRole = mode === 'MANUAL' ? manualRole : targetRole;
  const targetLabel = resolvedRole === 'INSTRUCTOR' ? 'Faculty Instructor' : 'Student';

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    const channels: ('WHATSAPP' | 'EMAIL')[] = [];
    if (channelWa) channels.push('WHATSAPP');
    if (channelEmail) channels.push('EMAIL');

    if (channels.length === 0) {
      setErrorMessage('Please select at least one delivery channel (WhatsApp or Email).');
      return;
    }

    if (mode === 'MANUAL') {
      if (!manualPhone.trim() && !manualEmail.trim()) {
        setErrorMessage('Please enter at least a mobile number or email address for the recipient.');
        return;
      }
    }

    if (actionType === 'CUSTOM_MESSAGE' && !message.trim()) {
      setErrorMessage('Please enter the message content before dispatching.');
      return;
    }

    setSending(true);
    setSuccessResult(null);
    setErrorMessage(null);
    setDeliveryReport(null);

    try {
      const endpoint =
        currentUserRole === 'INSTRUCTOR'
          ? '/api/instructor/communications/send'
          : '/api/admin/communications/send';

      const payload: any = {
        recipientScope: mode,
        targetRole: resolvedRole,
        actionType,
        channels,
        customSubject: actionType === 'CUSTOM_MESSAGE' ? subject : undefined,
        customMessage: actionType === 'CUSTOM_MESSAGE' ? message : undefined,
        newPassword:
          actionType === 'RESET_PASSWORD' || actionType === 'SEND_CREDENTIALS' ? newPassword : undefined,
      };

      if (mode === 'INDIVIDUAL' && targetUser) {
        payload.userId = targetUser.id;
        payload.studentUserId = targetUser.id;
        payload.recipientName = targetUser.name;
        payload.recipientPhone = targetUser.phone;
        payload.recipientEmail = targetUser.email;
      } else if (mode === 'MANUAL') {
        payload.recipientName = manualName.trim() || undefined;
        payload.recipientPhone = manualPhone.trim() || undefined;
        payload.recipientEmail = manualEmail.trim() || undefined;
        payload.role = manualRole;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch communication');
      }

      setSuccessResult(data.message || 'Dispatched successfully!');

      if (mode === 'BROADCAST') {
        setDeliveryReport({
          deliveredCount: data.delivered,
        });
      } else {
        setDeliveryReport({
          whatsapp: data.delivery?.whatsapp,
          email: data.delivery?.email,
        });
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred while sending message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-slate-200 p-6 space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider block">
              {mode === 'BROADCAST'
                ? 'Mass Dispatch'
                : mode === 'MANUAL'
                ? 'Ad-Hoc Manual Dispatch'
                : 'Direct Communication'}
            </span>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5 flex items-center space-x-2">
              <Send className="w-4 h-4 text-teal-600" />
              <span>
                {mode === 'BROADCAST'
                  ? `Broadcast Notice to All ${resolvedRole === 'INSTRUCTOR' ? 'Faculty' : 'Students'}`
                  : mode === 'MANUAL'
                  ? 'Send Message to Manual Recipient'
                  : `Dispatch to ${targetUser?.name || targetLabel}`}
              </span>
            </h3>
            {mode === 'INDIVIDUAL' && targetUser && (
              <p className="text-xs text-slate-500 mt-0.5">
                {targetUser.email && <span>{targetUser.email}</span>}
                {targetUser.email && targetUser.phone && <span> • </span>}
                {targetUser.phone && <span>{targetUser.phone}</span>}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer transition rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success View */}
        {successResult ? (
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-xl space-y-3 bg-emerald-50 border border-emerald-200 text-emerald-900">
              <div className="font-bold text-sm flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Message Dispatched Successfully</span>
              </div>
              <p className="text-xs leading-relaxed text-emerald-800">{successResult}</p>

              {deliveryReport?.deliveredCount && (
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-200/80 text-xs">
                  {channelEmail && (
                    <div className="p-2.5 bg-white/90 rounded-xl border border-teal-200">
                      <span className="text-slate-500 block text-[11px] font-medium">Email Delivered:</span>
                      <span className="font-bold text-teal-900 text-sm">
                        {deliveryReport.deliveredCount.email} / {broadcastCount}
                      </span>
                    </div>
                  )}
                  {channelWa && (
                    <div className="p-2.5 bg-white/90 rounded-xl border border-emerald-200">
                      <span className="text-slate-500 block text-[11px] font-medium">WhatsApp Delivered:</span>
                      <span className="font-bold text-emerald-900 text-sm">
                        {deliveryReport.deliveredCount.whatsapp} / {broadcastCount}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {deliveryReport?.whatsapp && (
                <div className="text-[11px] pt-1 border-t border-emerald-200/60 flex items-center justify-between text-emerald-800">
                  <span className="flex items-center space-x-1">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp Delivery:</span>
                  </span>
                  <span className="font-mono font-semibold">
                    {deliveryReport.whatsapp.dispatched
                      ? `Delivered (ID: ${deliveryReport.whatsapp.messageId})`
                      : `Failed: ${deliveryReport.whatsapp.error || 'Blocked'}`}
                  </span>
                </div>
              )}

              {deliveryReport?.email && (
                <div className="text-[11px] pt-1 flex items-center justify-between text-emerald-800">
                  <span className="flex items-center space-x-1">
                    <Mail className="w-3.5 h-3.5 text-teal-600" />
                    <span>Email Delivery:</span>
                  </span>
                  <span className="font-mono font-semibold">
                    {deliveryReport.email.dispatched
                      ? `Sent (ID: ${deliveryReport.email.messageId})`
                      : `Failed: ${deliveryReport.email.error || 'Error'}`}
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setSuccessResult(null);
                  setMessage('');
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Send Another
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSend} className="space-y-4">
            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Broadcast Badge / Recipient Scope Banner */}
            {mode === 'BROADCAST' && (
              <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl text-xs flex items-center justify-between">
                <div>
                  <span className="text-teal-900 font-bold block">Target Audience:</span>
                  <span className="text-teal-700 text-[11px]">
                    All Enrolled {resolvedRole === 'INSTRUCTOR' ? 'Faculty Members' : 'Students'} ({broadcastCount} active)
                  </span>
                </div>
                <span className="px-2.5 py-1 bg-teal-600 text-white font-bold rounded-lg text-[10px] uppercase">
                  Broadcast All
                </span>
              </div>
            )}

            {/* Manual Recipient Inputs */}
            {mode === 'MANUAL' && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-teal-600" />
                    <span>Recipient Information</span>
                  </span>
                  {currentUserRole === 'ADMIN' && (
                    <div className="flex items-center space-x-1 bg-white border border-slate-200 rounded-lg p-0.5 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setManualRole('STUDENT')}
                        className={`px-2 py-0.5 rounded-md font-semibold transition ${
                          manualRole === 'STUDENT' ? 'bg-teal-600 text-white shadow-2xs' : 'text-slate-600'
                        }`}
                      >
                        Student
                      </button>
                      <button
                        type="button"
                        onClick={() => setManualRole('INSTRUCTOR')}
                        className={`px-2 py-0.5 rounded-md font-semibold transition ${
                          manualRole === 'INSTRUCTOR' ? 'bg-teal-600 text-white shadow-2xs' : 'text-slate-600'
                        }`}
                      >
                        Instructor
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Recipient Name</label>
                    <input
                      type="text"
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      placeholder={manualRole === 'INSTRUCTOR' ? 'Faculty Name' : 'Student Name'}
                      className="w-full text-xs px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      WhatsApp Mobile <span className="text-emerald-600 font-bold">*</span>
                    </label>
                    <input
                      type="tel"
                      value={manualPhone}
                      onChange={(e) => setManualPhone(e.target.value)}
                      placeholder="e.g. 9618611522"
                      className="w-full text-xs px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Email Address <span className="text-teal-600 font-bold">*</span>
                    </label>
                    <input
                      type="email"
                      value={manualEmail}
                      onChange={(e) => setManualEmail(e.target.value)}
                      placeholder="e.g. user@gmail.com"
                      className="w-full text-xs px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-slate-400">
                  Enter WhatsApp number (10-digits or with country code) and/or email address.
                </p>
              </div>
            )}

            {/* Channels Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Delivery Channels <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label
                  className={`flex items-center space-x-2.5 p-2.5 rounded-xl border cursor-pointer transition text-xs font-semibold ${
                    channelWa
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={channelWa}
                    onChange={(e) => setChannelWa(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded-sm focus:ring-emerald-500"
                  />
                  <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="block font-bold">WhatsApp</span>
                    <span className="text-[10px] text-slate-500 block">UltraMsg Gateway (Connected)</span>
                  </div>
                </label>

                <label
                  className={`flex items-center space-x-2.5 p-2.5 rounded-xl border cursor-pointer transition text-xs font-semibold ${
                    channelEmail
                      ? 'bg-teal-50 border-teal-300 text-teal-950 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={channelEmail}
                    onChange={(e) => setChannelEmail(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded-sm focus:ring-teal-500"
                  />
                  <Mail className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <div>
                    <span className="block font-bold">Email</span>
                    <span className="text-[10px] text-slate-500 block">Official Gmail API</span>
                  </div>
                </label>
              </div>
              {!channelWa && !channelEmail && (
                <span className="text-[11px] text-rose-600 mt-1 block">
                  ⚠️ Please select at least one channel (WhatsApp or Email).
                </span>
              )}
            </div>

            {/* Action Type Selector (Individual / Manual only) */}
            {mode !== 'BROADCAST' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select Dispatch Action *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setActionType('CUSTOM_MESSAGE')}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition cursor-pointer text-center flex flex-col items-center justify-center space-y-1 ${
                      actionType === 'CUSTOM_MESSAGE'
                        ? 'bg-brand-navy text-white border-brand-navy shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Custom Notice</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActionType('SEND_CREDENTIALS')}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition cursor-pointer text-center flex flex-col items-center justify-center space-y-1 ${
                      actionType === 'SEND_CREDENTIALS'
                        ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Credentials</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActionType('RESET_PASSWORD')}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition cursor-pointer text-center flex flex-col items-center justify-center space-y-1 ${
                      actionType === 'RESET_PASSWORD'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>Reset Password</span>
                  </button>
                </div>
              </div>
            )}

            {/* Password Reset Field */}
            {actionType === 'RESET_PASSWORD' && (
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  New Password to Dispatch *
                </label>
                <input
                  type="text"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={resolvedRole === 'INSTRUCTOR' ? 'Faculty2026!' : 'Pragathi2026!'}
                  className="w-full text-xs sm:text-sm px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
                <span className="text-[11px] text-slate-400 block">
                  Password will be updated in the system and sent to the recipient with portal login instructions.
                </span>
              </div>
            )}

            {/* Send Credentials Info */}
            {actionType === 'SEND_CREDENTIALS' && (
              <div className="p-3 bg-teal-50/60 border border-teal-200 rounded-xl text-xs text-teal-900 space-y-1">
                <div className="font-bold flex items-center space-x-1.5 text-teal-800">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  <span>Credentials Dispatch Notice</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Sends official welcome credentials, login username, temporary password, and direct portal link
                  addressed directly to <strong>{mode === 'MANUAL' ? (manualName || 'the recipient') : (targetUser?.name || targetLabel)}</strong>.
                </p>
              </div>
            )}

            {/* Custom Message Fields */}
            {actionType === 'CUSTOM_MESSAGE' && (
              <div className="space-y-3">
                {/* Quick Presets */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Quick Templates
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {resolvedRole === 'INSTRUCTOR' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setSubject('Pragathi AI — Faculty Meeting & Sync');
                            setMessage('Please join our upcoming faculty curriculum sync on Google Meet to review student module progress and upcoming labs.');
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium transition cursor-pointer"
                        >
                          📅 Faculty Sync
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSubject('Pragathi AI — Curriculum Updates & Lab Guidelines');
                            setMessage('New hands-on prompt engineering and vision AI modules have been published. Please review the updated lesson guides in your instructor portal.');
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium transition cursor-pointer"
                        >
                          📚 Curriculum Update
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSubject('Pragathi AI — Student Submissions Grading Reminder');
                            setMessage('Kindly review and submit grading scores for the recent module projects and student photo rosters on the instructor dashboard.');
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium transition cursor-pointer"
                        >
                          🔔 Grading Notice
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setSubject('Module Exam & Quiz Schedule Announcement');
                            setMessage('Please note that your upcoming Module Quiz is scheduled this week. Log in to your Pragathi AI portal to review study materials and complete the quiz.');
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium transition cursor-pointer"
                        >
                          📝 Quiz / Exam
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSubject('Important Class Schedule Update');
                            setMessage('Please review your updated live class timing on your student dashboard under the Curriculum section. Ensure you join on time.');
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium transition cursor-pointer"
                        >
                          ⏰ Class Timing
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSubject('Assignment & Project Submission Reminder');
                            setMessage('Your AI foundation project is due shortly. Please check the project rubric on your dashboard and submit your work on time.');
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium transition cursor-pointer"
                        >
                          💻 Project Reminder
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSubject('Holiday Notice — Pragathi AI Education');
                            setMessage('Classes will remain suspended on the upcoming holiday. Regular sessions will resume as scheduled the following day.');
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium transition cursor-pointer"
                        >
                          🏖️ Holiday Notice
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Subject / Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Important Class Schedule Update"
                    className="w-full text-xs sm:text-sm px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Message Body *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write the message text. Students will be addressed directly as 'Hello [Student Name]'."
                    className="w-full text-xs sm:text-sm p-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Messages are automatically formatted and greeted directly to the recipient.
                  </span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 flex justify-end space-x-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sending || (!channelWa && !channelEmail)}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {sending
                    ? 'Dispatching...'
                    : mode === 'BROADCAST'
                    ? `Broadcast to All (${broadcastCount})`
                    : channelWa && channelEmail
                    ? 'Dispatch via WhatsApp & Email'
                    : channelWa
                    ? 'Dispatch via WhatsApp'
                    : channelEmail
                    ? 'Dispatch via Email'
                    : 'Select a Channel'}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
