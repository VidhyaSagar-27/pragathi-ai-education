'use client';

import React, { useState, useEffect } from 'react';
import { ClipboardList, Plus, Trash2, ExternalLink, FileText } from 'lucide-react';
import { StudyMaterial } from '@/lib/db/types';

export default function InstructorMaterialsPage() {
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form
  const [title, setTitle] = useState('');
  const [moduleId, setModuleId] = useState(1);
  const [type, setType] = useState<'NOTE' | 'PDF' | 'DOCUMENT'>('PDF');
  const [description, setDescription] = useState('');
  const [fileUrl, setFileUrl] = useState('');

  const loadData = () => {
    setLoading(true);
    fetch('/api/content/materials')
      .then((r) => r.json())
      .then((d) => {
        setMaterials(d.materials || []);
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
      const res = await fetch('/api/content/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          moduleId,
          type,
          description,
          fileUrl,
          fileName: title,
        }),
      });
      if (!res.ok) throw new Error('Failed to create material');
      setModalOpen(false);
      setTitle('');
      setDescription('');
      setFileUrl('');
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this study material?')) return;
    await fetch(`/api/content/materials?id=${id}`, { method: 'DELETE' });
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
            Study Material Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Upload and assign PDF notes, lesson summaries, and study resources.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-sm w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>Add Study Material</span>
        </button>
      </div>

      {materials.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {materials.map((mat) => (
            <div
              key={mat.id}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-teal-50 text-teal-700 border border-teal-100">
                    Module 0{mat.moduleId}
                  </span>
                  <span className="text-xs text-slate-400">{mat.type}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{mat.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-3 mb-4">{mat.description}</p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                {mat.fileUrl ? (
                  <a
                    href={mat.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 text-xs font-semibold text-teal-700 hover:text-teal-900"
                  >
                    <span>View Resource</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <span className="text-xs text-slate-400">Classroom note</span>
                )}
                <button
                  onClick={() => handleDelete(mat.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 transition"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center max-w-xl mx-auto border border-dashed border-slate-300 shadow-subtle">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-700 mx-auto flex items-center justify-center mb-4 border border-teal-100">
            <ClipboardList className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Study Materials Added</h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            Click "Add Study Material" to share PDFs or reference notes with your enrolled students.
          </p>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-brand-navy text-white flex items-center justify-between">
              <h3 className="text-base font-bold">Add New Study Material</h3>
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
                  placeholder="e.g. Module 1 AI Terminology Reference Guide"
                  className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Resource Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="PDF">PDF File</option>
                    <option value="NOTE">Lesson Notes</option>
                    <option value="DOCUMENT">Document</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">File URL / Cloud Link</label>
                <input
                  type="url"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  placeholder="https://drive.google.com/... or https://..."
                  className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Short Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summary of what this document covers..."
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
                  Save Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
