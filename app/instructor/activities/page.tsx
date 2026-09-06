'use client';

import React, { useState, useEffect } from 'react';
import { Layers, Plus, Trash2 } from 'lucide-react';
import { ActivityItem } from '@/lib/db/types';

export default function InstructorActivitiesPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Interactive Learning Activities');
  const [description, setDescription] = useState('');
  const [learningOutcomes, setLearningOutcomes] = useState('');

  const loadData = () => {
    setLoading(true);
    fetch('/api/admin/cms')
      .then((r) => r.json())
      .then((d) => {
        setActivities(d.activities || []);
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
      const res = await fetch('/api/admin/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'activity',
          data: { title, category, description, learningOutcomes, isPublished: true },
        }),
      });
      if (!res.ok) throw new Error('Failed to create activity');
      setModalOpen(false);
      setTitle('');
      setDescription('');
      setLearningOutcomes('');
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this activity?')) return;
    await fetch(`/api/admin/cms?type=activity&id=${id}`, { method: 'DELETE' });
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
            Session Activities Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Publish experiential classroom activities and collaborative challenges.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-sm w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Activity</span>
        </button>
      </div>

      {activities.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities.map((act) => (
            <div
              key={act.id}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-teal-50 text-teal-700 border border-teal-100">
                    {act.category}
                  </span>
                  <button
                    onClick={() => handleDelete(act.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{act.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">{act.description}</p>
              </div>

              {act.learningOutcomes && (
                <div className="pt-3 border-t border-slate-100 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">Outcome:</span> {act.learningOutcomes}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center max-w-xl mx-auto border border-dashed border-slate-300 shadow-subtle">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-700 mx-auto flex items-center justify-center mb-4 border border-teal-100">
            <Layers className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Activities Added Yet</h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            Click "Add New Activity" to define structured classroom exercises.
          </p>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-brand-navy text-white flex items-center justify-between">
              <h3 className="text-base font-bold">Add Session Activity</h3>
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
                  placeholder="e.g. Prompt Engineering Challenge Lab"
                  className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                >
                  <option value="AI Awareness Activities">AI Awareness Activities</option>
                  <option value="Interactive Learning Activities">Interactive Learning Activities</option>
                  <option value="Group Discussions">Group Discussions</option>
                  <option value="AI Tool Exploration">AI Tool Exploration</option>
                  <option value="Problem-Solving Activities">Problem-Solving Activities</option>
                  <option value="Creative AI Activities">Creative AI Activities</option>
                  <option value="Student Projects">Student Projects</option>
                  <option value="Quiz Challenges">Quiz Challenges</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description *</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed guidelines and task breakdown..."
                  className="w-full text-sm px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Expected Learning Outcome</label>
                <input
                  type="text"
                  value={learningOutcomes}
                  onChange={(e) => setLearningOutcomes(e.target.value)}
                  placeholder="e.g. Students will learn how parameters alter image generation..."
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
                  Save Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
