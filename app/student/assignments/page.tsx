'use client';

import React, { useState, useEffect } from 'react';
import { ClipboardList, Calendar, ExternalLink, Send, CheckCircle2, Award, Clock } from 'lucide-react';
import { Assignment, StudentAssignmentSubmission } from '@/lib/db/types';

export default function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<StudentAssignmentSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  // Active submission form state
  const [activeAsgId, setActiveAsgId] = useState<string | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submissionUrl, setSubmissionUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/content/assignments?t=' + Date.now()).then((r) => r.json()),
      fetch('/api/student/assignments?t=' + Date.now()).then((r) => r.json()),
    ])
      .then(([aData, sData]) => {
        setAssignments(aData.assignments || []);
        setSubmissions(sData.submissions || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent, assignmentId: string) => {
    e.preventDefault();
    if (!submissionText.trim() && !submissionUrl.trim()) {
      alert('Please provide either solution text/code or a project link.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/student/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId,
          submissionText,
          submissionUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');

      setFeedbackMsg('Assignment submitted and automatically evaluated successfully!');
      setActiveAsgId(null);
      setSubmissionText('');
      setSubmissionUrl('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
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
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-2 text-teal-700 text-xs font-bold uppercase tracking-wider mb-1">
          <ClipboardList className="w-4 h-4" />
          <span>Curriculum Practical Work</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Module Assignments & Practical Projects
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-2xl">
          Complete practical homework, writeups, and AI project exercises. Submissions are automatically evaluated with immediate feedback and grades.
        </p>
      </div>

      {feedbackMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="font-bold">{feedbackMsg}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-slate-600 font-bold">
            ✕
          </button>
        </div>
      )}

      {assignments.length > 0 ? (
        <div className="space-y-6">
          {assignments.map((asg) => {
            const mySubmission = submissions.find((s) => s.assignmentId === asg.id);
            const isFormOpen = activeAsgId === asg.id;

            return (
              <div
                key={asg.id}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:border-slate-300 transition space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-xs font-black text-teal-700 uppercase tracking-wider">
                      Module 0{asg.moduleId} Assignment
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-0.5">{asg.title}</h3>
                  </div>
                  <div className="flex items-center space-x-2 text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100 w-fit">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Due: {new Date(asg.dueDate).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50 p-4 rounded-xl border border-slate-200">
                  {asg.instructions}
                </div>

                {asg.attachmentUrl && (
                  <div>
                    <a
                      href={asg.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1.5 text-xs font-bold text-teal-700 hover:text-teal-900"
                    >
                      <span>Download Assignment Brief / Dataset</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}

                {/* Previous Submission Status */}
                {mySubmission ? (
                  <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-bold text-emerald-900">
                          Submitted on {new Date(mySubmission.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="text-xs font-black px-2.5 py-1 bg-emerald-600 text-white rounded-md">
                        Score: {mySubmission.score} / {mySubmission.maxScore}
                      </span>
                    </div>

                    {mySubmission.feedback && (
                      <p className="text-xs text-emerald-800">
                        <strong>Evaluation Feedback: </strong>
                        {mySubmission.feedback}
                      </p>
                    )}

                    <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">Want to update your submission?</span>
                      <button
                        onClick={() => {
                          setActiveAsgId(asg.id);
                          setSubmissionText(mySubmission.submissionText || '');
                          setSubmissionUrl(mySubmission.submissionUrl || '');
                        }}
                        className="text-xs font-bold text-teal-700 hover:text-teal-900 underline"
                      >
                        Resubmit Work
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {!isFormOpen ? (
                      <button
                        onClick={() => {
                          setActiveAsgId(asg.id);
                          setSubmissionText('');
                          setSubmissionUrl('');
                        }}
                        className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
                      >
                        Submit Assignment Response
                      </button>
                    ) : null}
                  </div>
                )}

                {/* Submission Form */}
                {isFormOpen && (
                  <form
                    onSubmit={(e) => handleSubmit(e, asg.id)}
                    className="p-4 bg-slate-50 border border-slate-300 rounded-xl space-y-4 animate-in fade-in"
                  >
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Submit Your Solution
                    </h4>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Solution Text / Code Explanation / Summary
                      </label>
                      <textarea
                        rows={4}
                        value={submissionText}
                        onChange={(e) => setSubmissionText(e.target.value)}
                        placeholder="Write your assignment solution, analytical findings, or code summary here..."
                        className="w-full text-xs sm:text-sm p-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Project Link (GitHub / Google Drive / Colab / Website URL)
                      </label>
                      <input
                        type="url"
                        value={submissionUrl}
                        onChange={(e) => setSubmissionUrl(e.target.value)}
                        placeholder="https://github.com/..."
                        className="w-full text-xs sm:text-sm px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                      />
                    </div>

                    <div className="flex items-center space-x-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setActiveAsgId(null)}
                        className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex items-center space-x-2 px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{submitting ? 'Submitting...' : 'Submit for Auto-Evaluation'}</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center max-w-xl mx-auto border border-dashed border-slate-300 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-700 mx-auto flex items-center justify-center mb-4 border border-teal-100">
            <ClipboardList className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Active Assignments</h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            There are no pending assignments assigned to your cohort at this time.
          </p>
        </div>
      )}
    </div>
  );
}
