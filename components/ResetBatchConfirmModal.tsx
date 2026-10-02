'use client';

import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert, X, Trash2 } from 'lucide-react';

interface ResetBatchConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetCompleted: () => void;
}

export default function ResetBatchConfirmModal({
  isOpen,
  onClose,
  onResetCompleted,
}: ResetBatchConfirmModalProps) {
  const [confirmInput, setConfirmInput] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmInput.trim() !== 'CONFIRM') {
      setErrorMessage('Please type CONFIRM exactly to proceed.');
      return;
    }

    setIsResetting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/admin/students/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: 'CONFIRM_RESET_ALL_STUDENTS' }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset student batch');
      }

      alert(
        data.message ||
          'All student accounts have been successfully reset. Next roll number is PRG001.'
      );
      onResetCompleted();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error resetting student data.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-rose-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-rose-600 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <ShieldAlert className="w-5 h-5 text-white" />
            <h2 className="text-base sm:text-lg font-bold">Reset Student Batch</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleReset} className="p-6 space-y-5">
          {/* Warning banner */}
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl space-y-2">
            <p className="font-bold text-sm flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>WARNING: Permanent Student Data Deletion</span>
            </p>
            <p className="text-xs leading-relaxed">
              This action will permanently delete <strong>all student profiles, accounts, login credentials, roll numbers, photos, and submissions</strong>.
            </p>
            <p className="text-xs leading-relaxed font-semibold">
              Next new student roll number will be reset to <strong>PRG001</strong>.
            </p>
          </div>

          {/* Preserved items notice */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              Items That Will NOT Be Deleted (Safe):
            </p>
            <ul className="text-xs text-slate-600 list-disc list-inside space-y-0.5">
              <li>Admin accounts &amp; settings</li>
              <li>Instructor accounts &amp; credentials</li>
              <li>Syllabus Modules (1-7), Videos, Notes</li>
              <li>Quizzes &amp; inbuilt assignments</li>
            </ul>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
              {errorMessage}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Type <span className="text-rose-600 font-mono">CONFIRM</span> to confirm reset:
            </label>
            <input
              type="text"
              required
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder="CONFIRM"
              className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/30"
            />
          </div>

          <div className="pt-2 flex items-center justify-end space-x-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={confirmInput.trim() !== 'CONFIRM' || isResetting}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition shadow-xs disabled:opacity-40 flex items-center space-x-1.5 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isResetting ? 'Resetting Batch...' : 'Permanently Reset All Students'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
