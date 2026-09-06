'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, Calendar } from 'lucide-react';
import { Announcement } from '@/lib/db/types';

export default function InstructorAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetRole, setTargetRole] = useState<'ALL' | 'STUDENT'>('STUDENT');
  const [targetGroup, setTargetGroup] = useState('All');

  const loadData = () => {
    setLoading(true);
    fetch('/api/content/announcements')
      .then((r) => r.json())
      .then((d) => {
        setAnnouncements(d.announcements || []);
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
      const res = await fetch('/api/content/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message, targetRole, targetGroup }),
      });
      if (!res.ok) throw new Error('Failed to post announcement');
      setModalOpen(false);
      setTitle('');
      setMessage('');
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this announcement?')) return;
    await fetch(`/api/content/announcements?id=${id}`, { method: 'DELETE' });
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
            Faculty Announcements
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Broadcast updates, workshop schedules, and project notices to your student cohorts.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-sm w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>New Announcement</span>
        </button>
      </div>

      {announcements.length > 0 ? (
        <div className="space-y-4">
          {announcements.map((anc) => (
            <div
              key={anc.id}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle flex flex-col justify-between"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">{anc.title}</h3>
                <div className="flex items-center space-x-3">
                  <span className="text-xs text-slate-400">
                    {new Date(anc.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => handleDelete(anc.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="py-4 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {anc.message}
              </p>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Audience: {anc.targetRole} ({anc.targetGroup})</span>
                <span className="font-semibold text-teal-700">By {anc.authorName}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center max-w-xl mx-auto border border-dashed border-slate-300 shadow-subtle">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-700 mx-auto flex items-center justify-center mb-4 border border-teal-100">
            <Bell className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Announcements Yet</h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            Click "New Announcement" to publish a notice to your enrolled students.
          </p>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-brand-navy text-white flex items-center justify-between">
              <h3 className="text-base font-bold">Publish Announcement</h3>
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
                  placeholder="e.g. Schedule for Module 2 Interactive Lab"
                  className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Message *</label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write message details..."
                  className="w-full text-sm px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white"
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
                  Broadcast Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
