'use client';

import React, { useState, useEffect } from 'react';
import {
  FileQuestion,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  AlertCircle,
  Sparkles,
  BookOpen,
  Award,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { Quiz, ExamQuestionType } from '@/lib/db/types';

interface QuestionDraft {
  type: ExamQuestionType;
  question: string;
  options: string[];
  correctOptionIndex: number;
  acceptableAnswers: string;
  theoryKeywords: string;
  modelAnswer: string;
  marks: number;
  explanation: string;
}

export default function InstructorQuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // New/Edit Quiz form state
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [moduleId, setModuleId] = useState(1);
  const [mode, setMode] = useState<'MCQ' | 'FILL_IN_BLANK' | 'THEORY' | 'ASSIGNMENT' | 'MIXED'>('MIXED');
  const [instructions, setInstructions] = useState('Read each question carefully and answer all questions.');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(20);
  const [passingMarks, setPassingMarks] = useState(5);
  const [isPublished, setIsPublished] = useState(true);
  const [autoDeclareResults, setAutoDeclareResults] = useState(true);

  const [questions, setQuestions] = useState<QuestionDraft[]>([
    {
      type: 'MCQ',
      question: '',
      options: ['', '', '', ''],
      correctOptionIndex: 0,
      acceptableAnswers: '',
      theoryKeywords: '',
      modelAnswer: '',
      marks: 1,
      explanation: '',
    },
  ]);

  const loadQuizzes = () => {
    setLoading(true);
    fetch('/api/content/quizzes?t=' + Date.now())
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
    setMode('MIXED');
    setInstructions('Answer all questions with attention to accuracy and clarity.');
    setTimeLimitMinutes(20);
    setPassingMarks(3);
    setIsPublished(true);
    setAutoDeclareResults(true);
    setQuestions([
      {
        type: 'MCQ',
        question: '',
        options: ['', '', '', ''],
        correctOptionIndex: 0,
        acceptableAnswers: '',
        theoryKeywords: '',
        modelAnswer: '',
        marks: 1,
        explanation: '',
      },
    ]);
    setModalOpen(true);
  };

  const handleOpenEdit = (quiz: Quiz) => {
    setEditingQuizId(quiz.id);
    setTitle(quiz.title);
    setModuleId(quiz.moduleId);
    setMode(quiz.mode || 'MIXED');
    setInstructions(quiz.instructions);
    setTimeLimitMinutes(quiz.timeLimitMinutes);
    setPassingMarks(quiz.passingMarks);
    setIsPublished(quiz.isPublished);
    setAutoDeclareResults(quiz.autoDeclareResults !== false);

    setQuestions(
      quiz.questions.map((q) => ({
        type: q.type || 'MCQ',
        question: q.question,
        options: q.options && q.options.length ? q.options : ['', '', '', ''],
        correctOptionIndex: q.correctOptionIndex || 0,
        acceptableAnswers: q.acceptableAnswers ? q.acceptableAnswers.join(', ') : '',
        theoryKeywords: q.theoryKeywords ? q.theoryKeywords.join(', ') : '',
        modelAnswer: q.modelAnswer || '',
        marks: q.marks || 1,
        explanation: q.explanation || '',
      }))
    );
    setModalOpen(true);
  };

  const handleAddQuestion = (defaultType: ExamQuestionType = 'MCQ') => {
    setQuestions([
      ...questions,
      {
        type: defaultType,
        question: '',
        options: ['', '', '', ''],
        correctOptionIndex: 0,
        acceptableAnswers: '',
        theoryKeywords: '',
        modelAnswer: '',
        marks: defaultType === 'THEORY' ? 5 : 1,
        explanation: '',
      },
    ]);
  };

  const handleRemoveQuestion = (idx: number) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleQuestionChange = (idx: number, field: keyof QuestionDraft, value: any) => {
    const updated = [...questions];
    updated[idx] = { ...updated[idx], [field]: value };
    setQuestions(updated);
  };

  const handleOptionChange = (qIdx: number, optIdx: number, val: string) => {
    const updated = [...questions];
    const newOptions = [...updated[qIdx].options];
    newOptions[optIdx] = val;
    updated[qIdx] = { ...updated[qIdx], options: newOptions };
    setQuestions(updated);
  };

  const handleSaveQuiz = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        alert(`Please provide question text for Question #${i + 1}`);
        return;
      }
      if (q.type === 'MCQ') {
        const filled = q.options.filter((o) => o.trim());
        if (filled.length < 2) {
          alert(`Question #${i + 1} (MCQ) requires at least 2 options.`);
          return;
        }
      } else if (q.type === 'FILL_IN_BLANK') {
        if (!q.acceptableAnswers.trim()) {
          alert(`Question #${i + 1} (Fill in Blank) requires at least one acceptable answer.`);
          return;
        }
      }
    }

    try {
      const payload = {
        title,
        moduleId,
        mode,
        instructions,
        timeLimitMinutes,
        passingMarks,
        isPublished,
        autoDeclareResults,
        questions: questions.map((q) => ({
          type: q.type,
          question: q.question,
          options: q.options.filter((o) => o.trim()),
          correctOptionIndex: q.correctOptionIndex,
          acceptableAnswers: q.acceptableAnswers.split(',').map((s) => s.trim()).filter(Boolean),
          theoryKeywords: q.theoryKeywords.split(',').map((s) => s.trim()).filter(Boolean),
          modelAnswer: q.modelAnswer,
          marks: Number(q.marks) || 1,
          explanation: q.explanation,
        })),
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

      if (!res.ok) throw new Error('Failed to save assessment');

      setModalOpen(false);
      loadQuizzes();
    } catch (err: any) {
      alert(err.message || 'Error saving assessment');
    }
  };

  const handleDeleteQuiz = async (id: string) => {
    if (!confirm('Are you sure you want to delete this assessment?')) return;
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2 text-teal-700 text-xs font-bold uppercase tracking-wider mb-1">
            <Award className="w-4 h-4" />
            <span>Faculty Assessment Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Multi-Mode Exam & Evaluation Builder
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Create MCQs, Fill-in-the-Blanks, Theory essays, and Assignment tasks with automatic rubric evaluation and instant scorecard declaration.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Assessment</span>
        </button>
      </div>

      {/* Quizzes List */}
      {quizzes.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-black px-2.5 py-1 rounded-md bg-teal-50 text-teal-700 border border-teal-200">
                      Module 0{quiz.moduleId}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                      {quiz.mode || 'MIXED'}
                    </span>
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      quiz.isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {quiz.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-1.5">{quiz.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 mb-4">{quiz.instructions}</p>

                <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="flex justify-between">
                    <span>Questions:</span>
                    <strong>{quiz.questions?.length || 0} questions</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Marks:</span>
                    <strong className="text-teal-700">{quiz.totalMarks} marks</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Passing Marks:</span>
                    <strong>{quiz.passingMarks} marks</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Time Limit:</span>
                    <strong>{quiz.timeLimitMinutes} minutes</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Results:</span>
                    <strong className="text-emerald-700">Instant Auto-Declared</strong>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => handleTogglePublish(quiz)}
                  className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  {quiz.isPublished ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{quiz.isPublished ? 'Unpublish' : 'Publish'}</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleOpenEdit(quiz)}
                    className="px-2.5 py-1.5 text-xs font-bold text-teal-700 hover:bg-teal-50 rounded-lg transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteQuiz(quiz.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Delete Assessment"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center max-w-xl mx-auto border border-dashed border-slate-300 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-700 mx-auto flex items-center justify-center mb-4 border border-teal-100">
            <FileQuestion className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Assessments Created Yet</h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            Click "Create Assessment" above to author exams across MCQs, Fill-in-the-Blanks, Theory, and Assignments.
          </p>
        </div>
      )}

      {/* Modal for Creating / Editing Multi-Mode Quizzes */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black tracking-tight">
                  {editingQuizId ? 'Edit Exam Assessment' : 'Author Multi-Mode Exam Assessment'}
                </h3>
                <p className="text-xs text-slate-400">
                  Configure question modes, auto-grading keywords, and instant results declaration.
                </p>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white font-bold p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveQuiz} className="p-6 overflow-y-auto space-y-6 flex-grow">
              {/* Meta Config */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Assessment Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Module 4: Machine Learning & Neural Computation Exam"
                    className="w-full text-sm px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Module *</label>
                  <select
                    value={moduleId}
                    onChange={(e) => setModuleId(Number(e.target.value))}
                    className="w-full text-sm px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
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
                <label className="block text-xs font-bold text-slate-700 mb-1">Exam Instructions</label>
                <input
                  type="text"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Time Limit (mins)</label>
                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={timeLimitMinutes}
                    onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                    className="w-full text-sm px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Passing Marks</label>
                  <input
                    type="number"
                    min={1}
                    value={passingMarks}
                    onChange={(e) => setPassingMarks(Number(e.target.value))}
                    className="w-full text-sm px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Assessment Mode</label>
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value as any)}
                    className="w-full text-sm px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white"
                  >
                    <option value="MIXED">Mixed (MCQ + Theory + Blanks)</option>
                    <option value="MCQ">Multiple Choice Only</option>
                    <option value="FILL_IN_BLANK">Fill in Blanks Only</option>
                    <option value="THEORY">Theory / Essay Only</option>
                    <option value="ASSIGNMENT">Assignment Task Only</option>
                  </select>
                </div>

                <div className="flex items-center pt-5 space-x-2">
                  <label className="flex items-center space-x-2 cursor-pointer text-xs font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={autoDeclareResults}
                      onChange={(e) => setAutoDeclareResults(e.target.checked)}
                      className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                    />
                    <span>Instant Results</span>
                  </label>
                </div>
              </div>

              {/* Questions Section */}
              <div className="space-y-6 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    Questions & Rubrics ({questions.length})
                  </h4>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleAddQuestion('MCQ')}
                      className="text-xs font-bold px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition"
                    >
                      + Add MCQ
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddQuestion('FILL_IN_BLANK')}
                      className="text-xs font-bold px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition"
                    >
                      + Add Blank
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddQuestion('THEORY')}
                      className="text-xs font-bold px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition"
                    >
                      + Add Theory
                    </button>
                  </div>
                </div>

                {questions.map((q, qIdx) => (
                  <div
                    key={qIdx}
                    className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 relative"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                          {qIdx + 1}
                        </span>
                        <select
                          value={q.type}
                          onChange={(e) => handleQuestionChange(qIdx, 'type', e.target.value)}
                          className="text-xs font-bold px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-teal-700"
                        >
                          <option value="MCQ">Multiple Choice (MCQ)</option>
                          <option value="FILL_IN_BLANK">Fill in the Blank</option>
                          <option value="THEORY">Theory / Conceptual</option>
                          <option value="ASSIGNMENT">Assignment Task</option>
                        </select>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          <label className="text-[11px] font-bold text-slate-500">Marks:</label>
                          <input
                            type="number"
                            min={1}
                            max={50}
                            value={q.marks}
                            onChange={(e) => handleQuestionChange(qIdx, 'marks', Number(e.target.value))}
                            className="w-14 text-xs font-bold p-1 bg-white border border-slate-300 rounded-md text-center"
                          />
                        </div>
                        {questions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveQuestion(qIdx)}
                            className="text-slate-400 hover:text-rose-600 p-1"
                            title="Remove Question"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <input
                        type="text"
                        required
                        value={q.question}
                        onChange={(e) => handleQuestionChange(qIdx, 'question', e.target.value)}
                        placeholder="Enter the question prompt here..."
                        className="w-full text-sm font-medium px-3.5 py-2 bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    {/* Mode Specific Inputs */}
                    {q.type === 'MCQ' && (
                      <div className="space-y-2 pt-1">
                        <p className="text-[11px] font-bold text-slate-500 uppercase">Options (Select radio for correct option):</p>
                        <div className="grid sm:grid-cols-2 gap-2">
                          {q.options.map((opt, optIdx) => (
                            <div
                              key={optIdx}
                              className={`flex items-center space-x-2 p-2 bg-white border rounded-xl ${
                                q.correctOptionIndex === optIdx ? 'border-teal-500 ring-1 ring-teal-500' : 'border-slate-300'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`correct_${qIdx}`}
                                checked={q.correctOptionIndex === optIdx}
                                onChange={() => handleQuestionChange(qIdx, 'correctOptionIndex', optIdx)}
                                className="text-teal-600 focus:ring-teal-500"
                              />
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => handleOptionChange(qIdx, optIdx, e.target.value)}
                                placeholder={`Option ${optIdx + 1}`}
                                className="w-full text-xs bg-transparent focus:outline-hidden"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {q.type === 'FILL_IN_BLANK' && (
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">
                          Acceptable Answer(s) (comma-separated for variants) *
                        </label>
                        <input
                          type="text"
                          value={q.acceptableAnswers}
                          onChange={(e) => handleQuestionChange(qIdx, 'acceptableAnswers', e.target.value)}
                          placeholder="e.g. Artificial Intelligence, AI, artificial intelligence"
                          className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-hidden"
                        />
                        <p className="text-[10px] text-slate-400">Case-insensitive automatic match will award full marks.</p>
                      </div>
                    )}

                    {q.type === 'THEORY' && (
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs font-bold text-slate-700">
                            Auto-Evaluation Keywords (comma-separated for semantic rubric scoring)
                          </label>
                          <input
                            type="text"
                            value={q.theoryKeywords}
                            onChange={(e) => handleQuestionChange(qIdx, 'theoryKeywords', e.target.value)}
                            placeholder="e.g. neural network, layers, backpropagation, activation function, gradient descent"
                            className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-hidden"
                          />
                          <p className="text-[10px] text-teal-700 mt-0.5">
                            Our automatic grading algorithm will match student explanations against these key concepts to calculate proportional marks.
                          </p>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700">Model Answer / Reference Rubric</label>
                          <textarea
                            rows={2}
                            value={q.modelAnswer}
                            onChange={(e) => handleQuestionChange(qIdx, 'modelAnswer', e.target.value)}
                            placeholder="Ideal reference answer provided to student on scorecard..."
                            className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-hidden"
                          />
                        </div>
                      </div>
                    )}

                    {q.type === 'ASSIGNMENT' && (
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-700">Task Criteria / Submission Format</label>
                        <textarea
                          rows={2}
                          value={q.modelAnswer}
                          onChange={(e) => handleQuestionChange(qIdx, 'modelAnswer', e.target.value)}
                          placeholder="Provide the task instructions, required code or writeup parameters, and evaluation criteria..."
                          className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-hidden"
                        />
                      </div>
                    )}

                    <div>
                      <input
                        type="text"
                        value={q.explanation}
                        onChange={(e) => handleQuestionChange(qIdx, 'explanation', e.target.value)}
                        placeholder="Feedback explanation shown to student upon completion..."
                        className="w-full text-xs px-3 py-1.5 bg-white/70 border border-slate-200 rounded-lg text-slate-600 focus:bg-white focus:outline-hidden"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
                >
                  {editingQuizId ? 'Update Assessment' : 'Save & Publish Assessment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
