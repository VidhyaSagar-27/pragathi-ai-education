'use client';

import React, { useState, useEffect } from 'react';
import {
  FileQuestion,
  Clock,
  Award,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Printer,
  Check,
  HelpCircle,
  FileText,
  AlignLeft,
} from 'lucide-react';
import { Quiz, QuizSubmission } from '@/lib/db/types';

export default function StudentQuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [submissions, setSubmissions] = useState<QuizSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Quiz taking state
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, any>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState<any | null>(null);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/content/quizzes?t=' + Date.now()).then((r) => r.json()),
      fetch('/api/student/submissions?t=' + Date.now()).then((r) => r.json()),
    ])
      .then(([qData, sData]) => {
        setQuizzes(qData.quizzes || []);
        setSubmissions(sData.submissions || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  // Timer countdown hook
  useEffect(() => {
    if (!activeQuiz || timeLeftSeconds <= 0) return;

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeQuiz, timeLeftSeconds]);

  const handleStartQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setSelectedAnswers({});
    setQuizResult(null);
    setTimeLeftSeconds((quiz.timeLimitMinutes || 20) * 60);
  };

  const handleSetAnswer = (questionId: string, answer: any) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;
    setSubmitting(true);

    try {
      const res = await fetch('/api/student/quiz-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId: activeQuiz.id,
          answers: selectedAnswers,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit exam');
      }

      setQuizResult(data);
      loadData();
    } catch (error: any) {
      alert(error.message || 'Submission error');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  // Active Quiz View
  if (activeQuiz) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {quizResult ? (
          /* Result View */
          <div className="bg-white rounded-2xl p-6 sm:p-10 border border-slate-200 shadow-xl">
            <div className="text-center mb-8">
              <div
                className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4 ${
                  quizResult.submission.passed
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                    : 'bg-amber-50 text-amber-600 border border-amber-200'
                }`}
              >
                {quizResult.submission.passed ? (
                  <Award className="w-8 h-8" />
                ) : (
                  <RotateCcw className="w-8 h-8" />
                )}
              </div>
              <span className="inline-block text-[11px] font-bold px-3 py-1 bg-teal-50 text-teal-700 rounded-full mb-2">
                Instant Automatic Evaluation
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                {quizResult.submission.passed ? 'Assessment Passed Successfully!' : 'Assessment Completed'}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Official Scorecard for {quizResult.submission.quizTitle}
              </p>
            </div>

            {/* Score Banner */}
            <div className="grid grid-cols-3 gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200 mb-8 text-center">
              <div>
                <span className="text-xs text-slate-400 font-bold uppercase">Your Score</span>
                <p className="text-2xl font-black text-slate-900 mt-1">
                  {quizResult.submission.score} / {quizResult.submission.totalMarks}
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-400 font-bold uppercase">Percentage</span>
                <p className="text-2xl font-black text-teal-700 mt-1">
                  {quizResult.submission.percentage}%
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-400 font-bold uppercase">Status</span>
                <p
                  className={`text-2xl font-black mt-1 ${
                    quizResult.submission.passed ? 'text-emerald-600' : 'text-amber-600'
                  }`}
                >
                  {quizResult.submission.passed ? 'PASSED' : 'NEEDS REVIEW'}
                </p>
              </div>
            </div>

            {/* Detailed Question Review */}
            <div className="space-y-6 mb-8">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">Evaluation Breakdown & Rubric Feedback</h3>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Scorecard</span>
                </button>
              </div>

              {quizResult.questionResults?.map((qr: any, idx: number) => (
                <div
                  key={qr.questionId || idx}
                  className={`p-4 rounded-xl border ${
                    qr.isCorrect
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : qr.marksAwarded > 0
                        ? 'bg-amber-50/40 border-amber-200'
                        : 'bg-rose-50/40 border-rose-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                          {qr.type || 'QUESTION'}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-slate-900">
                        {idx + 1}. {qr.question}
                      </p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-md shrink-0 ml-3">
                      {qr.isCorrect ? (
                        <span className="text-emerald-800 bg-emerald-100 px-2 py-1 rounded">
                          +{qr.marksAwarded} / {qr.maxMarks || qr.marksTotal}
                        </span>
                      ) : (
                        <span className="text-rose-800 bg-rose-100 px-2 py-1 rounded">
                          {qr.marksAwarded || 0} / {qr.maxMarks || qr.marksTotal}
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="mt-3 text-xs space-y-1.5 text-slate-700 bg-white/70 p-3 rounded-lg border border-slate-200/80">
                    <p>
                      <strong>Your Answer: </strong>
                      <span className="text-slate-900">
                        {qr.studentAnswer !== undefined && qr.studentAnswer !== ''
                          ? String(qr.studentAnswer)
                          : 'Not Answered'}
                      </span>
                    </p>

                    {qr.feedback && (
                      <p className="text-teal-800">
                        <strong>Feedback: </strong>
                        {qr.feedback}
                      </p>
                    )}

                    {qr.modelAnswer && (
                      <p className="text-slate-600">
                        <strong>Model Reference: </strong>
                        {qr.modelAnswer}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                setActiveQuiz(null);
                setQuizResult(null);
              }}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition"
            >
              Back to Assessment Center
            </button>
          </div>
        ) : (
          /* Taking Quiz Questions */
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-black text-teal-700 uppercase tracking-wider">
                    Module 0{activeQuiz.moduleId} Assessment
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase">
                    {activeQuiz.mode || 'MIXED'}
                  </span>
                </div>
                <h2 className="text-xl font-black text-slate-900 mt-0.5">
                  {activeQuiz.title}
                </h2>
              </div>
              <div className="flex items-center space-x-2 bg-amber-50 text-amber-800 px-3.5 py-1.5 rounded-xl border border-amber-200 font-mono text-sm font-bold">
                <Clock className="w-4 h-4" />
                <span>{formatTime(timeLeftSeconds)}</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-6 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              {activeQuiz.instructions}
            </p>

            <div className="space-y-8">
              {activeQuiz.questions.map((q, idx) => {
                const qType = q.type || 'MCQ';
                return (
                  <div key={q.id} className="space-y-3 pb-6 border-b border-slate-100 last:border-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600 mr-2">
                          {qType}
                        </span>
                        <h3 className="inline text-sm font-bold text-slate-900 leading-snug">
                          {idx + 1}. {q.question}
                        </h3>
                      </div>
                      <span className="text-xs text-slate-400 font-bold shrink-0 ml-2">
                        {q.marks} {q.marks === 1 ? 'mark' : 'marks'}
                      </span>
                    </div>

                    {/* Question Mode Input Rendering */}
                    {qType === 'MCQ' && (
                      <div className="space-y-2 pt-1">
                        {q.options?.map((opt, optIdx) => {
                          const isSelected = selectedAnswers[q.id] === optIdx;
                          return (
                            <label
                              key={optIdx}
                              onClick={() => handleSetAnswer(q.id, optIdx)}
                              className={`flex items-center space-x-3 p-3 rounded-xl border text-xs sm:text-sm cursor-pointer transition-colors ${
                                isSelected
                                  ? 'bg-teal-50 border-teal-500 text-teal-950 font-bold ring-1 ring-teal-500'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <input
                                type="radio"
                                name={q.id}
                                checked={isSelected}
                                onChange={() => handleSetAnswer(q.id, optIdx)}
                                className="text-teal-600 focus:ring-teal-500"
                              />
                              <span>{opt}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {qType === 'FILL_IN_BLANK' && (
                      <div className="pt-1">
                        <input
                          type="text"
                          value={selectedAnswers[q.id] || ''}
                          onChange={(e) => handleSetAnswer(q.id, e.target.value)}
                          placeholder="Type your answer here..."
                          className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                        />
                      </div>
                    )}

                    {qType === 'THEORY' && (
                      <div className="pt-1 space-y-1">
                        <textarea
                          rows={4}
                          value={selectedAnswers[q.id] || ''}
                          onChange={(e) => handleSetAnswer(q.id, e.target.value)}
                          placeholder="Write your explanation thoroughly. Include relevant principles, algorithms, and examples for full evaluation marks..."
                          className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                        />
                        <p className="text-[10px] text-slate-400 text-right">
                          Word count: {(selectedAnswers[q.id] || '').split(/\s+/).filter(Boolean).length}
                        </p>
                      </div>
                    )}

                    {qType === 'ASSIGNMENT' && (
                      <div className="pt-1 space-y-1">
                        <textarea
                          rows={4}
                          value={selectedAnswers[q.id] || ''}
                          onChange={(e) => handleSetAnswer(q.id, e.target.value)}
                          placeholder="Provide your solution text, GitHub project link, or Google Colab notebook URL..."
                          className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-8 pt-4 flex items-center justify-between border-t border-slate-100">
              <button
                onClick={() => setActiveQuiz(null)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Cancel Attempt
              </button>
              <button
                onClick={handleSubmitQuiz}
                disabled={submitting}
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold rounded-xl transition shadow-sm disabled:opacity-50"
              >
                {submitting ? 'Evaluating with AI...' : 'Submit & Declare Results'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-2 text-teal-700 text-xs font-bold uppercase tracking-wider mb-1">
          <Award className="w-4 h-4" />
          <span>Examinations & Assessments</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Module Assessments & Quizzes
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-2xl">
          Test your mastery across all 7 PRAGATHI AI modules with multi-mode assessments including MCQs, Fill-in-the-Blanks, and Theory essays. Results and detailed feedback are evaluated and declared instantly.
        </p>
      </div>

      {/* Available Quizzes */}
      <div className="space-y-4">
        <h2 className="text-lg font-black text-slate-900">Available Assessments</h2>
        {quizzes.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-dashed border-slate-300">
            <FileQuestion className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-600">No active assessments available right now.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => {
              const previousAttempt = submissions.find((s) => s.quizId === quiz.id);
              return (
                <div
                  key={quiz.id}
                  className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-black px-2.5 py-1 rounded-md bg-teal-50 text-teal-700 border border-teal-200">
                        Module 0{quiz.moduleId}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                        {quiz.mode || 'MIXED'}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 mb-1">{quiz.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-4">{quiz.instructions}</p>

                    <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div className="flex justify-between">
                        <span>Questions:</span>
                        <strong>{quiz.questions?.length || 0}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Marks:</span>
                        <strong>{quiz.totalMarks}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Time Limit:</span>
                        <strong>{quiz.timeLimitMinutes} mins</strong>
                      </div>
                      {previousAttempt && (
                        <div className="flex justify-between pt-1 border-t border-slate-200 text-emerald-700 font-bold">
                          <span>Latest Score:</span>
                          <span>
                            {previousAttempt.score}/{previousAttempt.totalMarks} ({previousAttempt.percentage}%)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleStartQuiz(quiz)}
                    className="mt-5 w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center justify-center space-x-2"
                  >
                    <span>{previousAttempt ? 'Retake Assessment' : 'Start Assessment'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Submissions History */}
      {submissions.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-lg font-black text-slate-900">Your Exam History & Performance</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Exam Title</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Percentage</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {submissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">{sub.quizTitle}</td>
                    <td className="py-3 px-4 font-semibold">
                      {sub.score} / {sub.totalMarks}
                    </td>
                    <td className="py-3 px-4 font-semibold text-teal-700">{sub.percentage}%</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded font-bold ${
                          sub.passed
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {sub.passed ? 'PASSED' : 'NEEDS IMPROVEMENT'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(sub.submittedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
