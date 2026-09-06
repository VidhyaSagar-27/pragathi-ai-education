'use client';

import React, { useState, useEffect } from 'react';
import { Mail, Phone, Trash2, CheckCircle2, Circle, Clock } from 'lucide-react';
import { ContactMessage } from '@/lib/db/types';

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMessages = () => {
    setLoading(true);
    fetch('/api/admin/messages')
      .then((r) => r.json())
      .then((d) => {
        setMessages(d.messages || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const handleToggleRead = async (msg: ContactMessage) => {
    await fetch('/api/admin/messages', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: msg.id, isRead: !msg.isRead }),
    });
    loadMessages();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this message?')) return;
    await fetch(`/api/admin/messages?id=${id}`, { method: 'DELETE' });
    loadMessages();
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
          Contact Inquiries & Messages
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Direct inquiries submitted via the public contact section of the PRAGATHI AI website.
        </p>
      </div>

      {messages.length > 0 ? (
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`rounded-2xl p-6 border transition-all ${
                msg.isRead
                  ? 'bg-white border-slate-200 shadow-subtle'
                  : 'bg-teal-50/30 border-teal-300 shadow-card'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleToggleRead(msg)}
                    className="text-slate-400 hover:text-teal-600 transition"
                    title={msg.isRead ? 'Mark as Unread' : 'Mark as Read'}
                  >
                    {msg.isRead ? (
                      <CheckCircle2 className="w-5 h-5 text-teal-600" />
                    ) : (
                      <Circle className="w-5 h-5 text-amber-500 fill-amber-500" />
                    )}
                  </button>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{msg.name}</h3>
                    <p className="text-xs text-slate-500">{msg.subject}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <span className="text-xs text-slate-400 flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(msg.createdAt).toLocaleString()}</span>
                  </span>
                  <button
                    onClick={() => handleDelete(msg.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                    title="Delete message"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="py-4 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {msg.message}
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs">
                <a
                  href={`mailto:${msg.email}`}
                  className="inline-flex items-center space-x-1 text-teal-700 font-semibold hover:underline"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Reply: {msg.email}</span>
                </a>
                {msg.phone && (
                  <a
                    href={`tel:${msg.phone}`}
                    className="inline-flex items-center space-x-1 text-slate-600 hover:underline"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call: {msg.phone}</span>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center max-w-xl mx-auto border border-dashed border-slate-300 shadow-subtle">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-700 mx-auto flex items-center justify-center mb-4 border border-teal-100">
            <Mail className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">0 Contact Messages</h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            All inquiries sent through the public contact form will appear here with instant read/reply capabilities.
          </p>
        </div>
      )}
    </div>
  );
}
