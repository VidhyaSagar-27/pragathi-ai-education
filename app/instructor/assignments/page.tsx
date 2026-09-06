'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Trash2, Calendar, Users } from 'lucide-react';
import { Assignment } from '@/lib/db/types';

export default function InstructorAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [moduleId, setModuleId] = useState(1);
  const [instructions, setInstructions] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [targetGroup, setTargetGroup] = useState('All Students');
  const [attachmentUrl, setAttachmentUrl] = useState('');

  const loadData = () => {
    setLoading(true);
    fetch('/api/content/assignments')
      .then((r) => r.json())
      .then((d) => {
        setAssignments(d.assignments || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/content/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          moduleId,
          instructions,
          dueDate,
          targetGroup,
          attachmentUrl: attachmentUrl || undefined,
        }),
      });
      if (!res.ok) throw new Error('Failed to create assignment');
      setModalOpen(false);
      setTitle('');
      setInstructions('');
      setDueDate('');
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this assignment?')) return;
    await fetch(`/api/content/assignments?id=${id}`, { method: 'DELETE' });
    loadData();
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Assignment Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Design problem briefs, assign deadlines, and distribute exercise files to student groups.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-sm w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>Create Assignment</span>
        </button>
      </div>

      {assignments.length > 0 ? (
        <div className="space-y-4">
          {assignments.map((asg) => (
            <div
              key={asg.id}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle flex flex-col justify-between"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">
                    Module 0{asg.moduleId}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5">{asg.title}</h3>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1.5 text-xs text-rose-700 bg-rose-50 px-3 py-1 rounded-lg border border-rose-100">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Due: {new Date(asg.dueDate).toLocaleDateString()}</span>
                  </div>
                  <button
                    onClick={() => handleDelete(asg.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="py-4 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {asg.instructions}
              </p>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Cohort: <strong>{asg.targetGroup}</strong></span>
                <span>Created by {asg.creatorName}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center max-w-xl mx-auto border border-dashed border-slate-300 shadow-subtle">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-700 mx-auto flex items-center justify-center mb-4 border border-teal-100">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Assignments Created Yet</h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            Click "Create Assignment" to assign a practical task or problem brief to your students.
          </p>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-brand-navy text-white flex items-center justify-between">
              <h3 className="text-base font-bold">Create New Assignment</h3>
              <button onClick={() => setModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Breadth-First vs Depth-First Search Implementation"
                  className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Module *</label>
                  <select
                    value={moduleId}
                    onChange={(e) => setModuleId(Number(e.target.value))}
                    className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                      <option key={num} value={num}>Module 0{num}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Submission Deadline *</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Cohort / Group</label>
                <input
                  type="text"
                  value={targetGroup}
                  onChange={(e) => setTargetGroup(e.target.value)}
                  placeholder="All Students / Foundation Batch A"
                  className="w-full text-sm px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Instructions & Problem Statement *</label>
                <textarea
                  rows={4}
                  required
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Step 1: Download starter files...\nStep 2: Complete the algorithm..."
                  className="w-full text-sm px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Attachment URL (Optional)</label>
                <input
                  type="url"
                  value={attachmentUrl}
                  onChange={(e) => setAttachmentUrl(e.target.value)}
                  placeholder="https://drive.google.com/... or starter repository"
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
                  Publish Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
