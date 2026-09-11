'use client';

import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Download,
  Printer,
  Search,
  Filter,
  Users,
  Award,
  CheckCircle2,
  XCircle,
  FileText,
  ChevronDown,
  ChevronUp,
  School,
  Calendar,
} from 'lucide-react';

interface StudentReportItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  schoolName: string;
  classGrade: string;
  group: string;
  location: string;
  photoUrl: string;
  status: string;
  joinedAt: string;
  totalQuizzesAttempted: number;
  passedQuizzes: number;
  averagePercentage: number;
  totalScoreEarned: number;
  totalMaxMarks: number;
  quizzes: Array<{
    id: string;
    quizTitle: string;
    moduleId: number;
    score: number;
    totalMarks: number;
    percentage: number;
    passed: boolean;
    submittedAt: string;
  }>;
  assignments: Array<{
    id: string;
    assignmentTitle: string;
    moduleId: number;
    score?: number;
    maxScore?: number;
    submittedAt: string;
  }>;
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<StudentReportItem[]>([]);
  const [summary, setSummary] = useState<any>({
    totalStudents: 0,
    totalExamsAttempted: 0,
    cohortPassRate: 0,
    totalAssignmentsSubmitted: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/reports?t=' + Date.now());
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
        setSummary(data.summary || {});
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleExportCSV = () => {
    if (reports.length === 0) {
      alert('No student logs to export.');
      return;
    }

    const headers = [
      'Student ID',
      'Name',
      'Email',
      'Phone',
      'School',
      'Grade',
      'Cohort Group',
      'Location',
      'Account Status',
      'Total Exams Attempted',
      'Exams Passed',
      'Average Score %',
      'Total Score Earned',
      'Total Max Marks',
      'Assignments Submitted',
      'Enrolled Date',
    ];

    const rows = reports.map((r) => [
      `"${r.id}"`,
      `"${r.name}"`,
      `"${r.email}"`,
      `"${r.phone}"`,
      `"${r.schoolName}"`,
      `"${r.classGrade}"`,
      `"${r.group}"`,
      `"${r.location}"`,
      `"${r.status}"`,
      r.totalQuizzesAttempted,
      r.passedQuizzes,
      `${r.averagePercentage}%`,
      r.totalScoreEarned,
      r.totalMaxMarks,
      r.assignments.length,
      `"${new Date(r.joinedAt).toLocaleDateString()}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pragathi_ai_student_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredReports = reports.filter((r) => {
    const q = searchQuery.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      r.schoolName.toLowerCase().includes(q) ||
      r.phone.toLowerCase().includes(q) ||
      r.group.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2 text-teal-700 text-xs font-bold uppercase tracking-wider mb-1">
            <Trophy className="w-4 h-4" />
            <span>Academic Records & Analytics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Student Performance & Log Report
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
            Detailed log reports of all enrolled students, assessments taken, scorecard history, assignments completed, and cohort metrics.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 self-start sm:self-auto">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-xl shadow-xs transition"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Enrolled Students</span>
            <Users className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{summary.totalStudents}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Total Exam Attempts</span>
            <Award className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{summary.totalExamsAttempted}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Cohort Pass Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2">{summary.cohortPassRate}%</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Assignments Submitted</span>
            <FileText className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{summary.totalAssignmentsSubmitted}</p>
        </div>
      </div>

      {/* Search Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search student log reports by name, email, school, cohort, or phone..."
          className="w-full text-xs sm:text-sm bg-transparent focus:outline-hidden text-slate-800"
        />
      </div>

      {/* Reports Table */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 font-medium">Generating student logs...</div>
      ) : filteredReports.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-300">
          <p className="text-sm text-slate-500">No student records match your query.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">School & Cohort</th>
                  <th className="py-3.5 px-4 text-center">Exams Taken</th>
                  <th className="py-3.5 px-4 text-center">Pass / Fail</th>
                  <th className="py-3.5 px-4 text-center">Average Score</th>
                  <th className="py-3.5 px-4 text-center">Assignments</th>
                  <th className="py-3.5 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReports.map((r) => {
                  const isExpanded = expandedStudentId === r.id;
                  return (
                    <React.Fragment key={r.id}>
                      <tr className="hover:bg-slate-50 transition">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-xl overflow-hidden bg-teal-50 border border-teal-200 flex items-center justify-center font-bold text-teal-700 shrink-0">
                              {r.photoUrl ? (
                                <img src={r.photoUrl} alt={r.name} className="w-full h-full object-cover" />
                              ) : (
                                r.name.charAt(0)
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{r.name}</p>
                              <p className="text-[11px] text-slate-400">{r.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-700">
                          <p className="font-semibold">{r.schoolName}</p>
                          <p className="text-[11px] text-teal-700">
                            Grade {r.classGrade} • {r.group}
                          </p>
                        </td>

                        <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                          {r.totalQuizzesAttempted}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span className="font-bold text-emerald-700">{r.passedQuizzes} passed</span>
                          <span className="text-slate-400 text-[11px]"> / {r.totalQuizzesAttempted - r.passedQuizzes} failed</span>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-block px-2.5 py-1 rounded-lg font-black text-teal-800 bg-teal-50 border border-teal-200">
                            {r.averagePercentage}%
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center font-semibold text-slate-700">
                          {r.assignments.length} completed
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setExpandedStudentId(isExpanded ? null : r.id)}
                            className="inline-flex items-center space-x-1 text-xs font-bold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg transition"
                          >
                            <span>{isExpanded ? 'Hide Logs' : 'View Logs'}</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Activity Details */}
                      {isExpanded && (
                        <tr className="bg-slate-50/70">
                          <td colSpan={7} className="p-4 sm:p-6">
                            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 shadow-inner">
                              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                                Detailed Assessment Logs for {r.name}
                              </h4>

                              {r.quizzes.length === 0 ? (
                                <p className="text-xs text-slate-500 italic">No exams attempted yet.</p>
                              ) : (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                                      <tr>
                                        <th className="p-2">Exam Title</th>
                                        <th className="p-2">Module</th>
                                        <th className="p-2">Score Awarded</th>
                                        <th className="p-2">Percentage</th>
                                        <th className="p-2">Status</th>
                                        <th className="p-2">Timestamp</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {r.quizzes.map((q) => (
                                        <tr key={q.id}>
                                          <td className="p-2 font-bold text-slate-900">{q.quizTitle}</td>
                                          <td className="p-2 text-teal-700 font-medium">Module 0{q.moduleId}</td>
                                          <td className="p-2 font-bold">{q.score} / {q.totalMarks}</td>
                                          <td className="p-2 font-black text-teal-700">{q.percentage}%</td>
                                          <td className="p-2">
                                            <span
                                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                q.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                              }`}
                                            >
                                              {q.passed ? 'PASSED' : 'NEEDS IMPROVEMENT'}
                                            </span>
                                          </td>
                                          <td className="p-2 text-slate-500">{new Date(q.submittedAt).toLocaleString()}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
