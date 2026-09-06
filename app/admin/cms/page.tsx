'use client';

import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Image as ImageIcon,
  Trophy,
  MessageSquareQuote,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  Video,
  ExternalLink,
} from 'lucide-react';
import { GalleryItem, AchievementItem, TestimonialItem, WebsiteSettings } from '@/lib/db/types';

export default function AdminCMSPage() {
  const [activeTab, setActiveTab] = useState<'CONTENT' | 'GALLERY' | 'ACHIEVEMENTS' | 'TESTIMONIALS'>('CONTENT');
  const [loading, setLoading] = useState(true);

  // Content Settings
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // CMS Collections
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [achievements, setAchievements] = useState<AchievementItem[]>([]);
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);

  // Gallery Add modal
  const [galModalOpen, setGalModalOpen] = useState(false);
  const [galTitle, setGalTitle] = useState('');
  const [galCategory, setGalCategory] = useState('Classroom');
  const [galMediaType, setGalMediaType] = useState<'IMAGE' | 'VIDEO'>('IMAGE');
  const [galUrl, setGalUrl] = useState('');
  const [galCaption, setGalCaption] = useState('');

  // Achievement Add modal
  const [achModalOpen, setAchModalOpen] = useState(false);
  const [achTitle, setAchTitle] = useState('');
  const [achCategory, setAchCategory] = useState('Student Recognition');
  const [achDescription, setAchDescription] = useState('');
  const [achDate, setAchDate] = useState('');

  // Testimonial Add modal
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testAuthorName, setTestAuthorName] = useState('');
  const [testAuthorRole, setTestAuthorRole] = useState('Parent');
  const [testSchoolOrOrg, setTestSchoolOrOrg] = useState('');
  const [testContent, setTestContent] = useState('');

  const loadAll = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/admin/settings').then((r) => r.json()),
      fetch('/api/admin/cms').then((r) => r.json()),
    ])
      .then(([sData, cData]) => {
        setSettings(sData.settings);
        setGallery(cData.gallery || []);
        setAchievements(cData.achievements || []);
        setTestimonials(cData.testimonials || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSavingSettings(true);
    setSettingsSuccess(false);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!res.ok) throw new Error('Failed to update website content');
      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  // Gallery handlers
  const handleAddGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/admin/cms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'gallery',
        data: {
          title: galTitle,
          category: galCategory,
          mediaType: galMediaType,
          url: galUrl,
          caption: galCaption,
          isPublished: true,
        },
      }),
    });
    setGalModalOpen(false);
    setGalTitle('');
    setGalUrl('');
    setGalCaption('');
    loadAll();
  };

  const handleDeleteGallery = async (id: string) => {
    if (!confirm('Delete this gallery media?')) return;
    await fetch(`/api/admin/cms?type=gallery&id=${id}`, { method: 'DELETE' });
    loadAll();
  };

  // Achievement handlers
  const handleAddAchievement = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/admin/cms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'achievement',
        data: {
          title: achTitle,
          category: achCategory,
          description: achDescription,
          date: achDate || new Date().toISOString().split('T')[0],
          isPublished: true,
        },
      }),
    });
    setAchModalOpen(false);
    setAchTitle('');
    setAchDescription('');
    loadAll();
  };

  const handleDeleteAchievement = async (id: string) => {
    if (!confirm('Delete this achievement milestone?')) return;
    await fetch(`/api/admin/cms?type=achievement&id=${id}`, { method: 'DELETE' });
    loadAll();
  };

  // Testimonial handlers
  const handleAddTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/admin/cms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'testimonial',
        data: {
          authorName: testAuthorName,
          authorRole: testAuthorRole,
          schoolOrOrg: testSchoolOrOrg,
          content: testContent,
          isPublished: true,
        },
      }),
    });
    setTestModalOpen(false);
    setTestAuthorName('');
    setTestContent('');
    loadAll();
  };

  const handleDeleteTestimonial = async (id: string) => {
    if (!confirm('Delete testimonial?')) return;
    await fetch(`/api/admin/cms?type=testimonial&id=${id}`, { method: 'DELETE' });
    loadAll();
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
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Website CMS & Content Control
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage public website text, Hero headlines, Mission & Vision statements, verified Gallery photos, and Milestones.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl bg-white p-1 border border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('CONTENT')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition ${
            activeTab === 'CONTENT'
              ? 'bg-brand-navy text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Hero & About Content</span>
        </button>

        <button
          onClick={() => setActiveTab('GALLERY')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition ${
            activeTab === 'GALLERY'
              ? 'bg-brand-navy text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Gallery Media ({gallery.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ACHIEVEMENTS')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition ${
            activeTab === 'ACHIEVEMENTS'
              ? 'bg-brand-navy text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Achievements ({achievements.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('TESTIMONIALS')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition ${
            activeTab === 'TESTIMONIALS'
              ? 'bg-brand-navy text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <MessageSquareQuote className="w-4 h-4" />
          <span>Genuine Testimonials ({testimonials.length})</span>
        </button>
      </div>

      {/* TAB 1: Hero & About Content */}
      {activeTab === 'CONTENT' && settings && (
        <form onSubmit={handleSaveSettings} className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-subtle space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">
              Live Website Text & Messaging
            </h2>
            <button
              type="submit"
              disabled={savingSettings}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>{savingSettings ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>

          {settingsSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Website content updated successfully! It is now live on the public site.</span>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Hero Section
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Main Heading</label>
                <input
                  type="text"
                  value={settings.heroHeading}
                  onChange={(e) => setSettings({ ...settings, heroHeading: e.target.value })}
                  className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Main Tagline</label>
                <input
                  type="text"
                  value={settings.heroTagline}
                  onChange={(e) => setSettings({ ...settings, heroTagline: e.target.value })}
                  className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Hero Supporting Description</label>
              <textarea
                rows={3}
                value={settings.heroDescription}
                onChange={(e) => setSettings({ ...settings, heroDescription: e.target.value })}
                className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              About, Mission & Vision Statements
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">About PRAGATHI AI Overview</label>
              <textarea
                rows={3}
                value={settings.aboutOverview}
                onChange={(e) => setSettings({ ...settings, aboutOverview: e.target.value })}
                className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Our Mission Statement</label>
                <textarea
                  rows={3}
                  value={settings.missionStatement}
                  onChange={(e) => setSettings({ ...settings, missionStatement: e.target.value })}
                  className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Our Vision Statement</label>
                <textarea
                  rows={3}
                  value={settings.visionStatement}
                  onChange={(e) => setSettings({ ...settings, visionStatement: e.target.value })}
                  className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: Gallery */}
      {activeTab === 'GALLERY' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-500">
              Upload photographs of real classroom activities, events, and student demonstrations.
            </p>
            <button
              onClick={() => setGalModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Media Item</span>
            </button>
          </div>

          {gallery.length > 0 ? (
            <div className="grid sm:grid-cols-3 gap-6">
              {gallery.map((item) => (
                <div key={item.id} className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-subtle flex flex-col justify-between">
                  <div className="aspect-video bg-slate-100 relative">
                    <img src={item.url} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-teal-700 uppercase">{item.category}</span>
                      <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                    </div>
                    <button onClick={() => handleDeleteGallery(item.id)} className="text-slate-400 hover:text-rose-600 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center max-w-xl mx-auto border border-dashed border-slate-300 shadow-subtle">
              <ImageIcon className="w-8 h-8 text-teal-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900 mb-1">0 Gallery Items</h3>
              <p className="text-xs text-slate-500">The public website is safely presenting the professional empty state: "PRAGATHI AI Moments Coming Soon". Click "Add Media Item" to publish real photos.</p>
            </div>
          )}

          {/* Add Gallery Modal */}
          {galModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
                <div className="flex justify-between items-center border-b pb-3">
                  <h3 className="text-base font-bold">Add Gallery Item</h3>
                  <button onClick={() => setGalModalOpen(false)}>✕</button>
                </div>
                <form onSubmit={handleAddGallery} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Title *</label>
                    <input
                      type="text"
                      required
                      value={galTitle}
                      onChange={(e) => setGalTitle(e.target.value)}
                      className="w-full text-sm px-3 py-2 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Category</label>
                    <select
                      value={galCategory}
                      onChange={(e) => setGalCategory(e.target.value)}
                      className="w-full text-sm px-3 py-2 border rounded-xl"
                    >
                      <option value="Classroom">Classroom</option>
                      <option value="Student Activities">Student Activities</option>
                      <option value="Events">Events</option>
                      <option value="Sessions">Sessions</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Image URL *</label>
                    <input
                      type="url"
                      required
                      value={galUrl}
                      onChange={(e) => setGalUrl(e.target.value)}
                      placeholder="https://... or /images/..."
                      className="w-full text-sm px-3 py-2 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Caption</label>
                    <input
                      type="text"
                      value={galCaption}
                      onChange={(e) => setGalCaption(e.target.value)}
                      className="w-full text-sm px-3 py-2 border rounded-xl"
                    />
                  </div>
                  <div className="flex justify-end space-x-2 pt-2">
                    <button type="button" onClick={() => setGalModalOpen(false)} className="px-3 py-1.5 text-xs">
                      Cancel
                    </button>
                    <button type="submit" className="px-4 py-1.5 bg-teal-600 text-white rounded-xl text-xs font-semibold">
                      Save Media
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Achievements */}
      {activeTab === 'ACHIEVEMENTS' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-500">
              Only genuine milestones, competition awards, and school partnerships.
            </p>
            <button
              onClick={() => setAchModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Achievement</span>
            </button>
          </div>

          {achievements.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-6">
              {achievements.map((item) => (
                <div key={item.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">{item.category}</span>
                      <button onClick={() => handleDeleteAchievement(item.id)} className="text-slate-400 hover:text-rose-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <h4 className="text-base font-bold text-slate-900">{item.title}</h4>
                    <p className="text-xs text-slate-600 mt-2">{item.description}</p>
                  </div>
                  <div className="text-[11px] text-slate-400 pt-3 border-t mt-4">{item.date}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center max-w-xl mx-auto border border-dashed border-slate-300 shadow-subtle">
              <Trophy className="w-8 h-8 text-amber-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900 mb-1">0 Achievements</h3>
              <p className="text-xs text-slate-500">Displaying official empty state: "PRAGATHI AI Achievements Coming Soon". Add real milestone entries when verified.</p>
            </div>
          )}

          {achModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
                <div className="flex justify-between items-center border-b pb-3">
                  <h3 className="text-base font-bold">Add Achievement Milestone</h3>
                  <button onClick={() => setAchModalOpen(false)}>✕</button>
                </div>
                <form onSubmit={handleAddAchievement} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Title *</label>
                    <input
                      type="text"
                      required
                      value={achTitle}
                      onChange={(e) => setAchTitle(e.target.value)}
                      className="w-full text-sm px-3 py-2 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Category</label>
                    <select
                      value={achCategory}
                      onChange={(e) => setAchCategory(e.target.value)}
                      className="w-full text-sm px-3 py-2 border rounded-xl"
                    >
                      <option value="Student Recognition">Student Recognition</option>
                      <option value="Competition Winner">Competition Winner</option>
                      <option value="School Partner">School Partner</option>
                      <option value="Program Milestone">Program Milestone</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Description *</label>
                    <textarea
                      rows={3}
                      required
                      value={achDescription}
                      onChange={(e) => setAchDescription(e.target.value)}
                      className="w-full text-sm px-3 py-2 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Date</label>
                    <input
                      type="date"
                      value={achDate}
                      onChange={(e) => setAchDate(e.target.value)}
                      className="w-full text-sm px-3 py-2 border rounded-xl"
                    />
                  </div>
                  <div className="flex justify-end space-x-2 pt-2">
                    <button type="button" onClick={() => setAchModalOpen(false)} className="px-3 py-1.5 text-xs">
                      Cancel
                    </button>
                    <button type="submit" className="px-4 py-1.5 bg-teal-600 text-white rounded-xl text-xs font-semibold">
                      Save Milestone
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Testimonials */}
      {activeTab === 'TESTIMONIALS' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-500">
              Only publish authentic endorsements from verified parents, school partners, or students.
            </p>
            <button
              onClick={() => setTestModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Testimonial</span>
            </button>
          </div>

          {testimonials.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-6">
              {testimonials.map((t) => (
                <div key={t.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{t.authorName}</h4>
                        <span className="text-xs text-teal-700 font-medium">{t.authorRole} • {t.schoolOrOrg}</span>
                      </div>
                      <button onClick={() => handleDeleteTestimonial(t.id)} className="text-slate-400 hover:text-rose-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 italic">"{t.content}"</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center max-w-xl mx-auto border border-dashed border-slate-300 shadow-subtle">
              <MessageSquareQuote className="w-8 h-8 text-teal-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900 mb-1">0 Testimonials</h3>
              <p className="text-xs text-slate-500">In strict adherence to the zero-fake-data policy, fake testimonials are not generated. Only real testimonials added here will appear.</p>
            </div>
          )}

          {testModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
                <div className="flex justify-between items-center border-b pb-3">
                  <h3 className="text-base font-bold">Add Verified Testimonial</h3>
                  <button onClick={() => setTestModalOpen(false)}>✕</button>
                </div>
                <form onSubmit={handleAddTestimonial} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Author Name *</label>
                    <input
                      type="text"
                      required
                      value={testAuthorName}
                      onChange={(e) => setTestAuthorName(e.target.value)}
                      className="w-full text-sm px-3 py-2 border rounded-xl"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1">Role</label>
                      <select
                        value={testAuthorRole}
                        onChange={(e) => setTestAuthorRole(e.target.value)}
                        className="w-full text-sm px-3 py-2 border rounded-xl"
                      >
                        <option value="Parent">Parent</option>
                        <option value="School Principal">School Principal</option>
                        <option value="Teacher">Teacher</option>
                        <option value="Student">Student</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">School / Org</label>
                      <input
                        type="text"
                        value={testSchoolOrOrg}
                        onChange={(e) => setTestSchoolOrOrg(e.target.value)}
                        className="w-full text-sm px-3 py-2 border rounded-xl"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Quote / Content *</label>
                    <textarea
                      rows={3}
                      required
                      value={testContent}
                      onChange={(e) => setTestContent(e.target.value)}
                      className="w-full text-sm px-3 py-2 border rounded-xl"
                    />
                  </div>
                  <div className="flex justify-end space-x-2 pt-2">
                    <button type="button" onClick={() => setTestModalOpen(false)} className="px-3 py-1.5 text-xs">
                      Cancel
                    </button>
                    <button type="submit" className="px-4 py-1.5 bg-teal-600 text-white rounded-xl text-xs font-semibold">
                      Save Testimonial
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
