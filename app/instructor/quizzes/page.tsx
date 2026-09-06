'use client';

import React, { useState, useEffect } from 'react';
import {
  FileQuestion,
  Plus,
  Trash2,
  Edit,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { Quiz } from '@/lib/db/types';

export default function InstructorQuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // New/Edit Quiz form state
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [moduleId, setModuleId] = useState(1);
  const [instructions, setInstructions] = useState('Read each question carefully and select the best answer.');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(15);
  const [passingMarks, setPassingMarks] = useState(2);
  const [isPublished, setIsPublished] = useState(true);

  const [questions, setQuestions] = useState<
    Array<{
      question: string;
      options: string[];
      correctOptionIndex: number;
      marks: number;
      explanation: string;
    }>
  >([
    {
      question: '',
      options: ['', '', '', ''],
      correctOptionIndex: 0,
      marks: 1,
      explanation: '',
    },
  ]);

  const loadQuizzes = () => {
    setLoading(true);
    fetch('/api/content/quizzes')
      .then((r) => r.json())
      .then((data) => {
        setQuizzes(data.quizzes || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadQuizzes();
  }, []);

  const handleOpenAdd = () => {
    setEditingQuizId(null);
    setTitle('');
    setModuleId(1);
    setInstructions('Read each question carefully and select the best answer.');
    setTimeLimitMinutes(15);
    setPassingMarks(1);
    setIsPublished(true);
    setQuestions([
      {
        question: '',
        options: ['', '', '', ''],
        correctOptionIndex: 0,
        marks: 1,
        explanation: '',
      },
    ]);
    setModalOpen(true);
  };

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        question: '',
        options: ['', '', '', ''],
        correctOptionIndex: 0,
        marks: 1,
        explanation: '',
      },
    ]);
  };

  const handleRemoveQuestion = (idx: number) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleQuestionChange = (idx: number, field: string, value: any) => {
    const updated = [...questions];
    (updated[idx] as any)[field] = value;
    setQuestions(updated);
  };

  const handleOptionChange = (qIdx: number, optIdx: number, val: string) => {
    const updated = [...questions];
    updated[qIdx].options[optIdx] = val;
    setQuestions(updated);
  };

  const handleSaveQuiz = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].question.trim()) {
        alert(`Please provide text for Question #${i + 1}`);
        return;
      }
      for (let j = 0; j < questions[i].options.length; j++) {
        if (!questions[i].options[j].trim()) {
          alert(`Please fill in Option ${j + 1} for Question #${i + 1}`);
          return;
        }
      }
    }

    try {
      const payload = {
        title,
        moduleId,
        instructions,
        timeLimitMinutes,
        passingMarks,
        isPublished,
        questions,
      };

      let res;
      if (editingQuizId) {
        res = await fetch('/api/content/quizzes', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingQuizId, ...payload }),
        });
      } else {
        res = await fetch('/api/content/quizzes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) throw new Error('Failed to save quiz');

      setModalOpen(false);
      loadQuizzes();
    } catch (err: any) {
      alert(err.message || 'Error saving quiz');
    }
  };

  const handleDeleteQuiz = async (id: string) => {
    if (!confirm('Are you sure you want to delete this quiz?')) return;
    await fetch(`/api/content/quizzes?id=${id}`, { method: 'DELETE' });
    loadQuizzes();
  };

  const handleTogglePublish = async (quiz: Quiz) => {
    await fetch('/api/content/quizzes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: quiz.id, isPublished: !quiz.isPublished }),
    });
    loadQuizzes();
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
            Quiz & Assessment Builder
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Create real multiple-choice quizzes linked to the 7 syllabus modules.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-sm w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Quiz</span>
        </button>
      </div>

      {quizzes.length > 0 ? (
        <div className="grid sm:grid-cols-2 gap-6">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-teal-50 text-teal-700 border border-teal-100">
                    Module 0{quiz.moduleId}
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      quiz.isPublished
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {quiz.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-2">{quiz.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 mb-4">{quiz.instructions}</p>

                <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  <div className="flex justify-between">
                    <span>Questions:</span>
                    <strong>{quiz.questions.length}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Marks:</span>
                    <strong>{quiz.totalMarks}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Passing Marks:</span>
                    <strong>{quiz.passingMarks}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Time Limit:</span>
                    <strong>{quiz.timeLimitMinutes} minutes</strong>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => handleTogglePublish(quiz)}
                  className="inline-flex items-center space-x-1 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  {quiz.isPublished ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{quiz.isPublished ? 'Unpublish' : 'Publish'}</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleDeleteQuiz(quiz.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Delete Quiz"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center max-w-xl mx-auto border border-dashed border-slate-300 shadow-subtle">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-700 mx-auto flex items-center justify-center mb-4 border border-teal-100">
            <FileQuestion className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Quizzes Created Yet</h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            Click "Create New Quiz" above to author an MCQ assessment for your students.
          </p>
        </div>
      )}

      {/* Create Quiz Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 bg-brand-navy text-white flex items-center justify-between">
              <h3 className="text-lg font-bold">
                {editingQuizId ? 'Edit Quiz' : 'Create New MCQ Quiz'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-300 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveQuiz} className="p-6 overflow-y-auto space-y-6 flex-grow">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quiz Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Module 1: Foundations of Artificial Intelligence"
                    className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Module *</label>
                  <select
                    value={moduleId}
                    onChange={(e) => setModuleId(Number(e.target.value))}
                    className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                      <option key={num} value={num}>
                        Module 0{num}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Instructions</label>
                <input
                  type="text"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Time Limit (mins)</label>
                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={timeLimitMinutes}
                    onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                    className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Passing Marks</label>
                  <input
                    type="number"
                    min={1}
                    value={passingMarks}
                    onChange={(e) => setPassingMarks(Number(e.target.value))}
                    className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={isPublished ? 'true' : 'false'}
                    onChange={(e) => setIsPublished(e.target.value === 'true')}
                    className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="true">Published</option>
                    <option value="false">Draft</option>
                  </select>
                </div>
              </div>

              {/* Questions Section */}
              <div className="space-y-6 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">
                    Questions ({questions.length})
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="inline-flex items-center space-x-1 text-xs font-semibold text-teal-700 hover:text-teal-900"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Question</span>
                  </button>
                </div>

                {questions.map((q, qIdx) => (
                  <div key={qIdx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Question #{qIdx + 1}</span>
                      {questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(qIdx)}
                          className="text-xs text-rose-600 hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      required
                      placeholder={`Enter question text`}
                      value={q.question}
                      onChange={(e) => handleQuestionChange(qIdx, 'question', e.target.value)}
                      className="w-full text-sm px-3.5 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />

                    <div className="space-y-2 pt-2">
                      <label className="block text-[11px] font-semibold text-slate-600">
                        Options & Select Correct Answer:
                      </label>
                      {q.options.map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name={`correct_${qIdx}`}
                            checked={q.correctOptionIndex === optIdx}
                            onChange={() => handleQuestionChange(qIdx, 'correctOptionIndex', optIdx)}
                            title="Mark as correct answer"
                            className="text-teal-600"
                          />
                          <input
                            type="text"
                            required
                            placeholder={`Option ${optIdx + 1}`}
                            value={opt}
                            onChange={(e) => handleOptionChange(qIdx, optIdx, e.target.value)}
                            className="w-full text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Marks</label>
                        <input
                          type="number"
                          min={1}
                          value={q.marks}
                          onChange={(e) => handleQuestionChange(qIdx, 'marks', Number(e.target.value))}
                          className="w-full text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Explanation (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="Why this answer is correct"
                          value={q.explanation}
                          onChange={(e) => handleQuestionChange(qIdx, 'explanation', e.target.value)}
                          className="w-full text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-sm"
                >
                  Save Quiz
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
