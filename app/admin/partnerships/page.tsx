'use client';

import React, { useState, useEffect } from 'react';
import { Building2, Phone, Mail, MapPin, Calendar, Trash2, CheckCircle2, MessageSquare } from 'lucide-react';
import { SchoolPartnership } from '@/lib/db/types';

export default function AdminPartnershipsPage() {
  const [partnerships, setPartnerships] = useState<SchoolPartnership[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPartnerships = () => {
    setLoading(true);
    fetch(`/api/admin/partnerships?_t=${Date.now()}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        setPartnerships(d.partnerships || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadPartnerships();
    const onFocus = () => loadPartnerships();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    setPartnerships((prev) => prev.map((p) => p.id === id ? { ...p, status: status as any } : p));
    await fetch(`/api/admin/partnerships?_t=${Date.now()}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
      cache: 'no-store',
    });
    loadPartnerships();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this partnership record?')) return;
    setPartnerships((prev) => prev.filter((p) => p.id !== id));
    await fetch(`/api/admin/partnerships?id=${id}&_t=${Date.now()}`, { method: 'DELETE', cache: 'no-store' });
    loadPartnerships();
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
          School Partnership Inquiries
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Submissions received through the "Bring PRAGATHI AI to Your School" institutional outreach channel.
        </p>
      </div>

      {partnerships.length > 0 ? (
        <div className="space-y-4">
          {partnerships.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{item.schoolName}</h3>
                    <p className="text-xs text-slate-500">{item.schoolLocation}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <select
                    value={item.status}
                    onChange={(e) => handleUpdateStatus(item.id, e.target.value)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-800"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="CONTACTED">CONTACTED</option>
                    <option value="IN_DISCUSSION">IN DISCUSSION</option>
                    <option value="CONFIRMED">CONFIRMED PARTNER</option>
                  </select>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                    title="Delete record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4 text-xs text-slate-700">
                <div>
                  <span className="text-slate-400 block">Contact Person</span>
                  <strong>{item.contactPerson}</strong> ({item.designation})
                </div>
                <div>
                  <span className="text-slate-400 block">Official Phone</span>
                  <a href={`tel:${item.mobileNumber}`} className="font-semibold text-teal-700 hover:underline">
                    {item.mobileNumber}
                  </a>
                </div>
                <div>
                  <span className="text-slate-400 block">Official Email</span>
                  <a href={`mailto:${item.email}`} className="font-semibold text-teal-700 hover:underline">
                    {item.email}
                  </a>
                </div>
              </div>

              {item.message && (
                <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 border border-slate-200/80">
                  <span className="font-semibold text-slate-900 block mb-1">Message from Institution:</span>
                  <p className="leading-relaxed whitespace-pre-wrap">{item.message}</p>
                </div>
              )}

              <div className="text-[11px] text-slate-400 pt-1">
                Submitted on {new Date(item.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center max-w-xl mx-auto border border-dashed border-slate-300 shadow-subtle">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-700 mx-auto flex items-center justify-center mb-4 border border-indigo-100">
            <Building2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">0 School Inquiries</h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            No institutional partnership requests received yet. Requests from the "Bring PRAGATHI AI to Your School" section will be organized here.
          </p>
        </div>
      )}
    </div>
  );
}
