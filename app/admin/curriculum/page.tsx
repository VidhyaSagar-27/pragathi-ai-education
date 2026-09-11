'use client';

import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Sparkles,
  Save,
  X,
  ListPlus,
  Check,
  RotateCcw,
} from 'lucide-react';
import { ModuleItem } from '@/lib/db/types';

export default function AdminCurriculumPage() {
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Edit/Add modal state
  const [isEditing, setIsEditing] = useState(false);
  const [editingModule, setEditingModule] = useState<Partial<ModuleItem>>({
    title: '',
    description: '',
    learningOutcome: '',
    iconName: 'BookOpen',
    topics: [],
  });
  const [newTopicInput, setNewTopicInput] = useState('');

  const fetchModules = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/modules?t=' + Date.now());
      if (res.ok) {
        const data = await res.json();
        setModules(data.modules || []);
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Failed to load modules.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  const openAddModal = () => {
    setEditingModule({
      title: '',
      description: '',
      learningOutcome: '',
      iconName: 'BookOpen',
      topics: [],
    });
    setNewTopicInput('');
    setIsEditing(true);
  };

  const openEditModal = (mod: ModuleItem) => {
    setEditingModule({ ...mod, topics: [...mod.topics] });
    setNewTopicInput('');
    setIsEditing(true);
  };

  const handleAddTopic = () => {
    if (!newTopicInput.trim()) return;
    const currentTopics = editingModule.topics || [];
    setEditingModule({
      ...editingModule,
      topics: [...currentTopics, newTopicInput.trim()],
    });
    setNewTopicInput('');
  };

  const handleRemoveTopic = (indexToRemove: number) => {
    const currentTopics = editingModule.topics || [];
    setEditingModule({
      ...editingModule,
      topics: currentTopics.filter((_, idx) => idx !== indexToRemove),
    });
  };

  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingModule.title?.trim()) {
      setFeedback({ type: 'error', message: 'Please enter a module title.' });
      return;
    }

    try {
      setSaving(true);
      const isNew = !editingModule.id;
      const res = await fetch('/api/admin/modules', {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingModule),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save module');

      setFeedback({
        type: 'success',
        message: isNew ? 'New syllabus module added!' : 'Module updated successfully!',
      });
      setIsEditing(false);
      await fetchModules();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Operation failed' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteModule = async (id: number, title: string) => {
    if (!confirm(`Are you sure you want to delete Module "${title}"? This cannot be undone.`)) return;

    try {
      setSaving(true);
      const res = await fetch(`/api/admin/modules?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');

      setFeedback({ type: 'success', message: 'Module removed.' });
      await fetchModules();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete' });
    } finally {
      setSaving(false);
    }
  };

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= modules.length) return;

    const updated = [...modules];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    setModules(updated);

    try {
      await fetch('/api/admin/modules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modules: updated }),
      });
      setFeedback({ type: 'success', message: 'Module order saved.' });
    } catch (err) {
      setFeedback({ type: 'error', message: 'Failed to update order.' });
      await fetchModules();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2 text-teal-700 text-xs font-bold uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4" />
            <span>Curriculum CMS</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Academic Syllabus & Module Manager
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Admin master control for managing PRAGATHI AI educational modules, topics, learning outcomes, and sequence.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-sm transition text-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Module</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600" />
            )}
            <span className="font-semibold">{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Modules List */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 font-medium">Loading syllabus modules...</div>
      ) : modules.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-300">
          <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No modules found</h3>
          <p className="text-sm text-slate-500 mt-1">Get started by creating your first curriculum module.</p>
          <button
            onClick={openAddModal}
            className="mt-4 px-4 py-2 bg-teal-600 text-white text-xs font-bold rounded-xl hover:bg-teal-700"
          >
            Add Module
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {modules.map((mod, idx) => (
            <div
              key={mod.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-slate-300 transition shadow-xs"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-teal-600 uppercase">MOD</span>
                    <span className="text-base font-black text-teal-900 leading-none">{idx + 1}</span>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-black text-slate-900">{mod.title}</h3>
                      <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                        {mod.topics?.length || 0} Topics
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-1">{mod.description}</p>
                    {mod.learningOutcome && (
                      <p className="text-xs text-teal-700 font-medium mt-1">
                        <span className="font-bold">Outcome: </span>
                        {mod.learningOutcome}
                      </p>
                    )}

                    {/* Topics Pill List */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {mod.topics?.map((topic, tIdx) => (
                        <span
                          key={tIdx}
                          className="inline-flex items-center text-[11px] font-medium px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mr-1.5"></span>
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-1 shrink-0 self-end md:self-start bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                  <button
                    onClick={() => handleMoveOrder(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg disabled:opacity-30"
                    title="Move Up"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleMoveOrder(idx, 'down')}
                    disabled={idx === modules.length - 1}
                    className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg disabled:opacity-30"
                    title="Move Down"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <div className="w-px h-4 bg-slate-300 mx-1"></div>
                  <button
                    onClick={() => openEditModal(mod)}
                    className="p-1.5 text-teal-600 hover:text-teal-800 hover:bg-teal-50 rounded-lg"
                    title="Edit Module"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteModule(mod.id, mod.title)}
                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                    title="Delete Module"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit / Add Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-teal-600" />
                <h2 className="text-lg font-black text-slate-900">
                  {editingModule.id ? `Edit Module ${editingModule.number || ''}` : 'Add New Curriculum Module'}
                </h2>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModule} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Module Title *</label>
                <input
                  type="text"
                  value={editingModule.title || ''}
                  onChange={(e) => setEditingModule({ ...editingModule, title: e.target.value })}
                  placeholder="e.g. Natural Language Processing & Generative AI"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Brief Description</label>
                <textarea
                  rows={2}
                  value={editingModule.description || ''}
                  onChange={(e) => setEditingModule({ ...editingModule, description: e.target.value })}
                  placeholder="Overview of this module's scope and educational focus..."
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Learning Outcome</label>
                <input
                  type="text"
                  value={editingModule.learningOutcome || ''}
                  onChange={(e) => setEditingModule({ ...editingModule, learningOutcome: e.target.value })}
                  placeholder="e.g. Students will master prompt engineering, chatbots, and generative media synthesis."
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              {/* Topics Manager */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Topics Covered ({editingModule.topics?.length || 0})
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newTopicInput}
                    onChange={(e) => setNewTopicInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTopic();
                      }
                    }}
                    placeholder="Type topic title and click 'Add Topic'..."
                    className="flex-1 px-3.5 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleAddTopic}
                    className="px-3 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition"
                  >
                    Add Topic
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                  {(!editingModule.topics || editingModule.topics.length === 0) ? (
                    <p className="text-xs text-slate-400 italic p-2 text-center">No topics added yet.</p>
                  ) : (
                    editingModule.topics.map((t, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-200 text-xs"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-teal-600">{idx + 1}.</span>
                          <span className="text-slate-800 font-medium">{t}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveTopic(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center space-x-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save Module'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
