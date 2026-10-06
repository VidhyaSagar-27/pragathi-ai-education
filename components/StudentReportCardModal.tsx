'use client';

import React from 'react';
import { X, Printer, Award, CheckCircle2, ShieldCheck, Sparkles, School, Calendar } from 'lucide-react';
import { User } from '@/lib/db/types';

interface StudentReportCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: User | null;
  attendanceStats?: {
    totalClasses: number;
    present: number;
    absent: number;
    percentage: number;
  };
  quizScores?: Array<{
    title: string;
    score: number;
    total: number;
    percentage: number;
  }>;
}

export default function StudentReportCardModal({
  isOpen,
  onClose,
  student,
  attendanceStats = { totalClasses: 12, present: 11, absent: 1, percentage: 92 },
  quizScores = [
    { title: 'Module 1: Foundations of AI', score: 10, total: 10, percentage: 100 },
    { title: 'Module 2: How AI Thinks & Search', score: 9, total: 10, percentage: 90 },
    { title: 'Module 3: Logic & Reasoning', score: 8, total: 10, percentage: 80 },
    { title: 'Module 4: Machine Learning Basics', score: 9, total: 10, percentage: 90 },
  ],
}: StudentReportCardModalProps) {
  if (!isOpen || !student) return null;

  const rollNumber =
    student.rollNumber || student.studentDetails?.rollNumber || student.studentDetails?.studentId || 'PRG001';
  const schoolName = student.studentDetails?.schoolName || 'Sri Rama Krishna Vidyalayam';
  const classGrade = student.studentDetails?.classGrade || 'Grade 9';
  const photoUrl = student.studentDetails?.photoUrl;
  const issueDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-8 print:border-none print:shadow-none print:m-0 print:max-w-none print:rounded-none">
        {/* Modal Toolbar - Hidden during printing */}
        <div className="print:hidden bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-teal-400" />
            <h3 className="text-sm font-black">Official Student Performance Dossier</h3>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Official Printable Report Card Document */}
        <div className="p-8 sm:p-12 space-y-8 bg-white print:p-8">
          {/* Header & Crest */}
          <div className="flex items-center justify-between border-b-2 border-teal-800 pb-6">
            <div className="flex items-center space-x-4">
              <img
                src="/images/logo.png"
                alt="PRAGATHI AI"
                className="h-16 w-auto object-contain"
              />
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  PRAGATHI AI EDUCATION
                </h1>
                <p className="text-xs font-bold text-teal-700 uppercase tracking-wider">
                  Advanced Artificial Intelligence Foundation Program
                </p>
                <p className="text-[11px] text-slate-500">
                  Affiliated Partner: {schoolName}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-50 text-teal-900 border border-teal-300">
                Official Report Card
              </span>
              <p className="text-xs font-mono font-bold text-slate-600 mt-1">Date: {issueDate}</p>
            </div>
          </div>

          {/* Student Profile Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-200">
            {/* Student Photo */}
            <div className="sm:col-span-1 flex flex-col items-center justify-center">
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-white border-2 border-teal-600 shadow-sm flex items-center justify-center font-black text-2xl text-teal-800">
                {photoUrl ? (
                  <img src={photoUrl} alt={student.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{student.name.charAt(0)}</span>
                )}
              </div>
              <span className="mt-2 font-mono text-xs font-black px-2 py-0.5 rounded bg-teal-100 text-teal-900 border border-teal-300">
                {rollNumber}
              </span>
            </div>

            {/* Student Details Grid */}
            <div className="sm:col-span-3 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Student Name</span>
                <strong className="text-slate-900 text-sm">{student.name}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Class / Grade</span>
                <strong className="text-slate-900 text-sm">{classGrade}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Parent / Guardian</span>
                <strong className="text-slate-800">{student.studentDetails?.parentName || 'N/A'}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Contact Number</span>
                <strong className="text-slate-800 font-mono">{student.phone || 'N/A'}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">School Institution</span>
                <span className="text-slate-800">{schoolName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Cohort Group</span>
                <span className="text-slate-800">{student.studentDetails?.group || 'Batch A'}</span>
              </div>
            </div>
          </div>

          {/* Academic & Attendance Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Attendance Performance */}
            <div className="border border-slate-200 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                  <Calendar className="w-4 h-4 text-teal-600" />
                  <span>Classroom Attendance</span>
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                  attendanceStats.percentage >= 75
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {attendanceStats.percentage >= 75 ? 'Regular' : 'Irregular'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="bg-slate-50 p-2 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Classes Held</span>
                  <strong className="text-base font-black text-slate-900">{attendanceStats.totalClasses}</strong>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Attended</span>
                  <strong className="text-base font-black text-emerald-700">{attendanceStats.present}</strong>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Rate %</span>
                  <strong className="text-base font-black text-teal-700">{attendanceStats.percentage}%</strong>
                </div>
              </div>
            </div>

            {/* AI Academic Commendation */}
            <div className="border border-slate-200 rounded-2xl p-5 space-y-3 bg-gradient-to-br from-teal-50/40 to-slate-50">
              <div className="flex items-center space-x-1.5 border-b border-slate-200 pb-2">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  AI Academic Assessment & Remarks
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed italic">
                &ldquo;Demonstrates outstanding intellectual curiosity and consistent engagement in artificial intelligence principles. Shows strong analytical ability in neural network logic, algorithm design, and structured prompt engineering.&rdquo;
              </p>
            </div>
          </div>

          {/* Curriculum Marks Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="bg-slate-100/80 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                Module Evaluation & Assessment Scores
              </span>
              <span className="text-[10px] font-bold text-slate-500">Graded by Pragathi AI Rubric</span>
            </div>
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200">
                  <th className="py-2.5 px-4">Subject / Module</th>
                  <th className="py-2.5 px-4 text-center">Score</th>
                  <th className="py-2.5 px-4 text-center">Maximum</th>
                  <th className="py-2.5 px-4 text-center">Percentage</th>
                  <th className="py-2.5 px-4 text-right">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quizScores.map((q, idx) => (
                  <tr key={idx}>
                    <td className="py-2.5 px-4 font-bold text-slate-800">{q.title}</td>
                    <td className="py-2.5 px-4 text-center font-bold text-teal-800">{q.score}</td>
                    <td className="py-2.5 px-4 text-center text-slate-500">{q.total}</td>
                    <td className="py-2.5 px-4 text-center font-bold">{q.percentage}%</td>
                    <td className="py-2.5 px-4 text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800">
                        Distinction
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Official Signatures & Seal */}
          <div className="pt-8 border-t border-slate-200 grid grid-cols-3 gap-4 text-center text-xs">
            <div>
              <div className="h-10 border-b border-slate-400 mx-6"></div>
              <span className="block mt-1 font-bold text-slate-700">Class Instructor</span>
              <span className="text-[10px] text-slate-400">Pragathi AI Faculty</span>
            </div>
            <div className="flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full border-2 border-dashed border-teal-700 flex items-center justify-center text-[10px] font-black text-teal-800 uppercase">
                SEAL
              </div>
              <span className="text-[10px] text-slate-400 mt-1">Official Seal</span>
            </div>
            <div>
              <div className="h-10 border-b border-slate-400 mx-6"></div>
              <span className="block mt-1 font-bold text-slate-700">Academic Director</span>
              <span className="text-[10px] text-slate-400">Pragathi AI Education</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
