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
} from 'lucide-react';
import { Quiz, QuizSubmission } from '@/lib/db/types';

export default function StudentQuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [submissions, setSubmissions] = useState<QuizSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Quiz taking state
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState<any | null>(null);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/content/quizzes').then((r) => r.json()),
      fetch('/api/student/submissions').then((r) => r.json()),
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
    setTimeLeftSeconds((quiz.timeLimitMinutes || 15) * 60);
  };

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
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
        throw new Error(data.error || 'Failed to submit quiz');
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
          <div className="bg-white rounded-2xl p-6 sm:p-10 border border-slate-200 shadow-elevated">
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
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                {quizResult.submission.passed ? 'Congratulations!' : 'Quiz Completed'}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Evaluation for {quizResult.submission.quizTitle}
              </p>
            </div>

            {/* Score Banner */}
            <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 mb-8 text-center">
              <div>
                <span className="text-xs text-slate-400 font-medium">Your Score</span>
                <p className="text-xl font-extrabold text-slate-900 mt-1">
                  {quizResult.submission.score} / {quizResult.submission.totalMarks}
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-400 font-medium">Percentage</span>
                <p className="text-xl font-extrabold text-teal-700 mt-1">
                  {quizResult.submission.percentage}%
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-400 font-medium">Status</span>
                <p
                  className={`text-xl font-extrabold mt-1 ${
                    quizResult.submission.passed ? 'text-emerald-600' : 'text-amber-600'
                  }`}
                >
                  {quizResult.submission.passed ? 'Passed' : 'Needs Review'}
                </p>
              </div>
            </div>

            {/* Questions Breakdown */}
            <div className="space-y-6 mb-8">
              <h3 className="text-base font-bold text-slate-900">Answer Review</h3>
              {quizResult.questionResults.map((qr: any, idx: number) => (
                <div
                  key={qr.questionId}
                  className={`p-4 rounded-xl border ${
                    qr.isCorrect
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : 'bg-rose-50/40 border-rose-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-semibold text-slate-900">
                      {idx + 1}. {qr.question}
                    </p>
                    <span className="text-xs font-bold px-2 py-0.5 rounded ml-2 shrink-0">
                      {qr.isCorrect ? (
                        <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                          +{qr.marksEarned} Mark
                        </span>
                      ) : (
                        <span className="text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                          0 / {qr.marksTotal}
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="mt-3 text-xs space-y-1 text-slate-600">
                    <p>
                      <strong className="text-slate-700">Your Answer:</strong>{' '}
                      {qr.selectedOptionIndex !== undefined ? `Option ${qr.selectedOptionIndex + 1}` : 'Not Answered'}
                    </p>
                    <p className="text-emerald-700 font-medium">
                      <strong>Correct Option:</strong> Option {qr.correctOptionIndex + 1}
                    </p>
                    {qr.explanation && (
                      <p className="text-slate-500 pt-1">
                        <strong>Explanation:</strong> {qr.explanation}
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
              className="w-full py-3 bg-brand-navy text-white text-sm font-semibold rounded-xl hover:bg-slate-900 transition"
            >
              Back to Quiz List
            </button>
          </div>
        ) : (
          /* Taking Quiz Questions */
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-elevated">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">
                  Module 0{activeQuiz.moduleId} Quiz
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                  {activeQuiz.title}
                </h2>
              </div>
              <div className="flex items-center space-x-2 bg-amber-50 text-amber-800 px-3.5 py-1.5 rounded-xl border border-amber-200 font-mono text-sm font-bold">
                <Clock className="w-4 h-4" />
                <span>{formatTime(timeLeftSeconds)}</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 mb-6 bg-slate-50 p-3 rounded-lg border border-slate-200">
              {activeQuiz.instructions}
            </p>

            <div className="space-y-8">
              {activeQuiz.questions.map((q, idx) => (
                <div key={q.id} className="space-y-3 pb-6 border-b border-slate-100 last:border-0">
                  <div className="flex items-start justify-between">
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">
                      {idx + 1}. {q.question}
                    </h3>
                    <span className="text-xs text-slate-400 font-semibold shrink-0 ml-2">
                      {q.marks} {q.marks === 1 ? 'mark' : 'marks'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = selectedAnswers[q.id] === optIdx;
                      return (
                        <label
                          key={optIdx}
                          onClick={() => handleSelectOption(q.id, optIdx)}
                          className={`flex items-center space-x-3 p-3 rounded-xl border text-xs sm:text-sm cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-teal-50 border-teal-500 text-teal-950 font-medium ring-1 ring-teal-500'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name={q.id}
                            checked={isSelected}
                            onChange={() => handleSelectOption(q.id, optIdx)}
                            className="text-teal-600 focus:ring-teal-500"
                          />
                          <span>{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
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
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-semibold rounded-xl transition disabled:opacity-50"
              >
                {submitting ? 'Evaluating...' : 'Submit Quiz'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Quiz Listing View
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Quizzes & Challenges
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Complete authorized module checkpoints and algorithmic assessments.
        </p>
      </div>

      {quizzes.length > 0 ? (
        <div className="grid sm:grid-cols-2 gap-6">
          {quizzes.map((quiz) => {
            const previousAttempt = submissions.find((s) => s.quizId === quiz.id);
            return (
              <div
                key={quiz.id}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle hover:shadow-card transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-teal-50 text-teal-700 border border-teal-100">
                      Module 0{quiz.moduleId}
                    </span>
                    <div className="flex items-center space-x-1 text-xs text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{quiz.timeLimitMinutes} mins</span>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {quiz.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                    {quiz.instructions}
                  </p>

                  <div className="flex items-center space-x-4 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg">
                    <span><strong>{quiz.questions.length}</strong> Questions</span>
                    <span>•</span>
                    <span><strong>{quiz.totalMarks}</strong> Total Marks</span>
                    <span>•</span>
                    <span>Pass: {quiz.passingMarks}</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  {previousAttempt ? (
                    <div className="text-xs">
                      <span className="text-slate-400">Last Score: </span>
                      <strong className={previousAttempt.passed ? 'text-emerald-600' : 'text-amber-600'}>
                        {previousAttempt.score}/{previousAttempt.totalMarks} ({previousAttempt.percentage}%)
                      </strong>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">Not attempted yet</span>
                  )}

                  <button
                    onClick={() => handleStartQuiz(quiz)}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 bg-brand-navy hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition"
                  >
                    <span>{previousAttempt ? 'Retake Quiz' : 'Start Quiz'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Professional Empty State */
        <div className="bg-white rounded-2xl p-12 text-center max-w-xl mx-auto border border-dashed border-slate-300 shadow-subtle">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-700 mx-auto flex items-center justify-center mb-4 border border-teal-100">
            <FileQuestion className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            No Quizzes Available
          </h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            New quizzes will be published as learning content is added.
          </p>
        </div>
      )}

    </div>
  );
}
