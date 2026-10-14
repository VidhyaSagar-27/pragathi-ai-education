'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  ArrowLeft,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Receipt,
  Printer,
  X,
  Plus,
  ArrowUpRight,
  TrendingUp,
  Download,
  IndianRupee,
  Calendar,
  Trash2,
  Tag,
  Percent,
  Sparkles,
  Phone,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  LayoutGrid,
  List,
  Bell,
  Users,
  ShieldAlert,
  Send,
} from 'lucide-react';
import QuickNavigationHeader from '@/components/QuickNavigationHeader';

interface StudentFeeItem {
  studentId: string;
  name: string;
  rollNumber: string;
  phone: string;
  schoolName: string;
  classGrade: string;
  photoUrl: string;
  totalFee: number;
  concessionAmount?: number;
  concessionReason?: string;
  netFee: number;
  amountPaid: number;
  amountPending: number;
  status: 'PAID' | 'PARTIALLY_PAID' | 'PENDING' | 'OVERDUE';
  lastPaymentDate: string | null;
  lastPaymentMethod: string | null;
  paymentCount: number;
  feeNotes: string;
}

interface PaymentRecord {
  id: string;
  receiptNumber: string;
  studentId: string;
  studentRollNumber: string;
  studentName: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'OTHER';
  transactionId?: string;
  recordedByName: string;
  notes?: string;
  createdAt: string;
}

export default function AdminFeesPage() {
  const [students, setStudents] = useState<StudentFeeItem[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PARTIALLY_PAID' | 'PENDING'>('ALL');

  // Record Payment Modal State
  const [recordModalOpen, setRecordModalOpen] = useState<boolean>(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentFeeItem | null>(null);
  const [payAmount, setPayAmount] = useState<string>('');
  const [payDate, setPayDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [payMethod, setPayMethod] = useState<'UPI' | 'CASH' | 'BANK_TRANSFER' | 'OTHER'>('UPI');
  const [payTransactionId, setPayTransactionId] = useState<string>('');
  const [payNotes, setPayNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Concession / Discount Modal State
  const [concessionModalOpen, setConcessionModalOpen] = useState<boolean>(false);
  const [concessionStudent, setConcessionStudent] = useState<StudentFeeItem | null>(null);
  const [concessionAmountInput, setConcessionAmountInput] = useState<string>('350');
  const [concessionReasonInput, setConcessionReasonInput] = useState<string>('Merit Scholarship');
  const [isSavingConcession, setIsSavingConcession] = useState<boolean>(false);

  // Receipt Modal State
  const [receiptModalOpen, setReceiptModalOpen] = useState<boolean>(false);
  const [activeReceipt, setActiveReceipt] = useState<any>(null);

  // History Tab / View State
  const [activeTab, setActiveTab] = useState<'ROSTER' | 'TRANSACTIONS'>('ROSTER');
  const [feeViewMode, setFeeViewMode] = useState<'CARDS' | 'TABLE'>('CARDS');
  const [allPayments, setAllPayments] = useState<PaymentRecord[]>([]);
  const [transSearch, setTransSearch] = useState<string>('');
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);

  const loadFeeData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/fees?_t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
        setSummary(data.summary || null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadAllPayments = async () => {
    try {
      const res = await fetch(`/api/admin/fees/payments?_t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setAllPayments(data.payments || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadFeeData();
    loadAllPayments();
  }, []);

  const openRecordModal = (student: StudentFeeItem) => {
    setSelectedStudent(student);
    setPayAmount(student.amountPending > 0 ? String(student.amountPending) : '500');
    setPayDate(new Date().toISOString().split('T')[0]);
    setPayMethod('UPI');
    setPayTransactionId('');
    setPayNotes('');
    setRecordModalOpen(true);
  };

  const openConcessionModal = (student: StudentFeeItem) => {
    setConcessionStudent(student);
    setConcessionAmountInput(student.concessionAmount ? String(student.concessionAmount) : '350');
    setConcessionReasonInput(student.concessionReason || 'Merit Scholarship');
    setConcessionModalOpen(true);
  };

  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    const amt = Number(payAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/fees/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudent.studentId,
          amount: amt,
          paymentDate: payDate,
          paymentMethod: payMethod,
          transactionId: payTransactionId,
          notes: payNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Payment recording failed');

      setRecordModalOpen(false);
      loadFeeData();
      loadAllPayments();

      // Show receipt immediately
      if (data.payment) {
        setActiveReceipt({
          ...data.payment,
          remainingPending: data.studentSummary?.pendingAmount,
          totalFee: data.studentSummary?.totalFee,
          totalPaid: data.studentSummary?.totalPaid,
        });
        setReceiptModalOpen(true);
      }
    } catch (err: any) {
      alert(err.message || 'Error recording payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveConcessionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concessionStudent) return;

    const numConc = Math.max(0, Number(concessionAmountInput) || 0);

    setIsSavingConcession(true);
    try {
      const res = await fetch('/api/admin/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: concessionStudent.studentId,
          concessionAmount: numConc,
          concessionReason: concessionReasonInput.trim() || 'Concession',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update concession');

      setConcessionModalOpen(false);
      loadFeeData();
    } catch (err: any) {
      alert(err.message || 'Error updating concession');
    } finally {
      setIsSavingConcession(false);
    }
  };

  const handleDeletePayment = async (payment: PaymentRecord) => {
    const confirmMsg = `Are you sure you want to delete payment ${payment.id} of ₹${payment.amount.toLocaleString('en-IN')} for ${payment.studentName} (${payment.studentRollNumber})?\n\nThis will reduce the student's total paid amount and recalculate their pending balance.`;
    if (!window.confirm(confirmMsg)) return;

    setDeletingPaymentId(payment.id);
    try {
      const res = await fetch(`/api/admin/fees/payments?id=${payment.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete payment');

      if (receiptModalOpen && activeReceipt?.id === payment.id) {
        setReceiptModalOpen(false);
      }

      alert(`Payment transaction ${payment.id} deleted successfully. Student balance recalculated.`);
      loadFeeData();
      loadAllPayments();
    } catch (err: any) {
      alert(err.message || 'Error deleting payment transaction');
    } finally {
      setDeletingPaymentId(null);
    }
  };

  // Export CSV of student fee information
  const exportFeeReportCSV = () => {
    if (students.length === 0) return;

    const headers = [
      'Roll Number',
      'Student Name',
      'Phone Number',
      'Class / Grade',
      'School Name',
      'Base Fee (INR)',
      'Concession / Discount (INR)',
      'Concession Reason',
      'Net Payable (INR)',
      'Amount Paid (INR)',
      'Pending Balance (INR)',
      'Payment Status',
      'Last Payment Date',
      'Last Payment Method',
      'Total Payments Count',
    ];

    const rows = filteredStudents.map((s) => [
      `"${s.rollNumber}"`,
      `"${s.name.replace(/"/g, '""')}"`,
      `"${s.phone}"`,
      `"${s.classGrade || 'N/A'}"`,
      `"${(s.schoolName || '').replace(/"/g, '""')}"`,
      s.totalFee,
      s.concessionAmount || 0,
      `"${(s.concessionReason || '').replace(/"/g, '""')}"`,
      s.netFee,
      s.amountPaid,
      s.amountPending,
      `"${s.status}"`,
      `"${s.lastPaymentDate || 'N/A'}"`,
      `"${s.lastPaymentMethod || 'N/A'}"`,
      s.paymentCount,
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `PRAGATHI_AI_STUDENT_FEES_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.phone.includes(searchQuery);

      if (!matchesSearch) return false;
      if (statusFilter === 'PAID') return s.status === 'PAID';
      if (statusFilter === 'PARTIALLY_PAID') return s.status === 'PARTIALLY_PAID';
      if (statusFilter === 'PENDING') return s.status === 'PENDING';
      return true;
    });
  }, [students, searchQuery, statusFilter]);

  const defaulterCount = useMemo(() => students.filter((s) => s.status === 'PENDING').length, [students]);
  const partialCount = useMemo(() => students.filter((s) => s.status === 'PARTIALLY_PAID').length, [students]);
  const paidCount = useMemo(() => students.filter((s) => s.status === 'PAID').length, [students]);

  const filteredPayments = useMemo(() => {
    return allPayments.filter((p) => {
      if (!transSearch.trim()) return true;
      const q = transSearch.toLowerCase();
      return (
        p.studentName.toLowerCase().includes(q) ||
        p.studentRollNumber.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        (p.receiptNumber && p.receiptNumber.toLowerCase().includes(q)) ||
        (p.transactionId && p.transactionId.toLowerCase().includes(q)) ||
        p.paymentDate.includes(q)
      );
    });
  }, [allPayments, transSearch]);

  const collectionPercentage =
    summary && summary.totalExpected > 0
      ? Math.round((summary.totalCollected / summary.totalExpected) * 100)
      : 0;

  return (
    <div className="w-full max-w-7xl mx-auto px-2.5 sm:px-4 pb-16 space-y-3">
      {/* 1. ULTRA-SLEEK COMPACT APP BAR */}
      <div className="flex items-center justify-between pt-1 pb-1">
        <div className="flex items-center space-x-2">
          <Link
            href="/admin"
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              Fee Management
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">
              Academic Year 2026-27 • {students.length} Enrolled
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Tab Switcher */}
          <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setActiveTab('ROSTER')}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                activeTab === 'ROSTER' ? 'bg-[#0c3960] text-white shadow-2xs' : 'text-slate-600'
              }`}
            >
              Roster ({students.length})
            </button>
            <button
              onClick={() => setActiveTab('TRANSACTIONS')}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                activeTab === 'TRANSACTIONS' ? 'bg-[#0c3960] text-white shadow-2xs' : 'text-slate-600'
              }`}
            >
              Payments ({allPayments.length})
            </button>
          </div>

          <button
            type="button"
            onClick={exportFeeReportCSV}
            className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5 text-teal-300" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* 2. COMPACT 1-ROW KPI STRIP */}
      <div className="bg-white rounded-2xl p-2.5 sm:p-3 border border-slate-200 shadow-2xs grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="flex items-center space-x-2 px-1">
          <div className="w-2 h-2 rounded-full bg-teal-500 shrink-0"></div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Expected</span>
            <p className="font-black text-slate-900 text-sm">₹{(summary?.totalGrossExpected || summary?.totalExpected || 0).toLocaleString('en-IN')}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 px-1">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></div>
          <div>
            <span className="text-[10px] text-emerald-700 font-bold uppercase">Collected ({collectionPercentage}%)</span>
            <p className="font-black text-emerald-800 text-sm">₹{(summary?.totalCollected || 0).toLocaleString('en-IN')}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 px-1">
          <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></div>
          <div>
            <span className="text-[10px] text-rose-700 font-bold uppercase">Pending</span>
            <p className="font-black text-rose-700 text-sm">₹{(summary?.totalPending || 0).toLocaleString('en-IN')}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 px-1">
          <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></div>
          <div>
            <span className="text-[10px] text-amber-700 font-bold uppercase">Defaulters</span>
            <p className="font-black text-amber-800 text-sm">{defaulterCount} students</p>
          </div>
        </div>
      </div>

      {activeTab === 'ROSTER' ? (
        /* Student Fee Roster Card */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Filter & View Control Header */}
          <div className="p-4 border-b border-slate-200/80 flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-50/70">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search student, roll number, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
              {/* Status Filter Chips with Live Tallies */}
              <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                    statusFilter === 'ALL'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>All</span>
                  <span className="text-[10px] opacity-75 font-mono">({students.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('PENDING')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                    statusFilter === 'PENDING'
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'text-rose-700 hover:bg-rose-50'
                  }`}
                >
                  <AlertCircle className="w-3 h-3" />
                  <span>Defaulters</span>
                  <span className="text-[10px] opacity-90 font-mono">({defaulterCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('PARTIALLY_PAID')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                    statusFilter === 'PARTIALLY_PAID'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'text-amber-800 hover:bg-amber-50'
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  <span>Partial</span>
                  <span className="text-[10px] opacity-90 font-mono">({partialCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('PAID')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                    statusFilter === 'PAID'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-emerald-700 hover:bg-emerald-50'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Paid</span>
                  <span className="text-[10px] opacity-90 font-mono">({paidCount})</span>
                </button>
              </div>

              {/* Dual View Switcher */}
              <div className="flex items-center space-x-1 bg-slate-200/80 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setFeeViewMode('CARDS')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                    feeViewMode === 'CARDS'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Student Fee Cards Grid"
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-teal-600" />
                  <span>Fee Cards</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFeeViewMode('TABLE')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                    feeViewMode === 'TABLE'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Continuous Ledger Table"
                >
                  <List className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Table</span>
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center">
              <div className="inline-block w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-sm font-semibold text-slate-500">Loading student fee records...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-sm">
              No students match your filter criteria.
            </div>
          ) : (
            <>
              {/* 1. STUDENT FEE CARDS VIEW */}
              {feeViewMode === 'CARDS' && (
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5 bg-slate-50/50">
                  {filteredStudents.map((st) => {
                    const percentPaid = st.netFee > 0 ? Math.min(100, Math.round((st.amountPaid / st.netFee) * 100)) : 100;
                    const waReminderUrl = `https://wa.me/91${st.phone.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(
                      `Dear Parent of ${st.name} (Roll: ${st.rollNumber}),\n\nThis is a friendly fee update from Pragathi AI. The pending tuition balance is ₹${st.amountPending.toLocaleString('en-IN')}.\n\nKindly clear the balance at your earliest convenience. Thank you!`
                    )}`;

                    return (
                      <div
                        key={st.studentId}
                        className={`rounded-2xl p-4 transition-all duration-200 border-2 shadow-2xs hover:shadow-md flex flex-col justify-between space-y-3.5 ${
                          st.status === 'PAID'
                            ? 'bg-white border-emerald-500/80 hover:border-emerald-600'
                            : st.status === 'PARTIALLY_PAID'
                            ? 'bg-white border-amber-400 hover:border-amber-500'
                            : 'bg-rose-50/60 border-rose-500 hover:border-rose-600 ring-2 ring-rose-500/10'
                        }`}
                      >
                        {/* Card Header: Roll No + Class + Status Badge */}
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="font-mono text-xs font-black px-2.5 py-1 bg-slate-900 text-white rounded-lg shadow-2xs">
                            {st.rollNumber}
                          </span>
                          <div className="flex items-center space-x-1.5">
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                              Grade {st.classGrade || 'N/A'}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                st.status === 'PAID'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : st.status === 'PARTIALLY_PAID'
                                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                                  : 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse'
                              }`}
                            >
                              {st.status === 'PAID' ? 'Paid' : st.status === 'PARTIALLY_PAID' ? 'Partial' : 'Pending'}
                            </span>
                          </div>
                        </div>

                        {/* Card Center: Student Avatar + Name + School */}
                        <div className="flex items-start space-x-3 pt-1">
                          {st.photoUrl ? (
                            <img
                              src={st.photoUrl}
                              alt={st.name}
                              className={`w-12 h-12 rounded-full object-cover border-2 shadow-xs shrink-0 ${
                                st.status === 'PAID' ? 'border-emerald-500' : st.status === 'PARTIALLY_PAID' ? 'border-amber-400' : 'border-rose-500'
                              }`}
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-800 font-black flex items-center justify-center text-sm shadow-xs shrink-0 border-2 border-teal-300">
                              {st.name.charAt(0)}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <h4 className="font-black text-slate-900 text-sm leading-snug truncate" title={st.name}>
                              {st.name}
                            </h4>
                            {st.schoolName && (
                              <p className="text-[11px] text-slate-500 truncate" title={st.schoolName}>
                                {st.schoolName}
                              </p>
                            )}

                            {/* Direct Contact Buttons */}
                            {st.phone ? (
                              <div className="flex items-center space-x-2 mt-1.5">
                                <a
                                  href={`tel:${st.phone}`}
                                  className="inline-flex items-center space-x-1 px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md text-[11px] font-bold transition shadow-2xs"
                                  title={`Call ${st.phone}`}
                                >
                                  <Phone className="w-3 h-3 text-emerald-600" />
                                  <span>{st.phone}</span>
                                </a>
                                <a
                                  href={waReminderUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md transition shadow-2xs"
                                  title="Send WhatsApp Fee Reminder"
                                >
                                  <MessageSquare className="w-3 h-3" />
                                </a>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400">No contact</span>
                            )}
                          </div>
                        </div>

                        {/* Financial Snapshot Box */}
                        <div className="bg-slate-50/90 border border-slate-200/80 rounded-xl p-3 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 font-medium">Net Fee:</span>
                            <span className="font-bold text-slate-800">₹{st.netFee.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex items-center justify-between text-emerald-700">
                            <span className="font-medium">Paid So Far:</span>
                            <span className="font-black">₹{st.amountPaid.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex items-center justify-between text-rose-700 font-black pt-1 border-t border-slate-200">
                            <span>Pending Balance:</span>
                            <span className="text-sm">₹{st.amountPending.toLocaleString('en-IN')}</span>
                          </div>

                          {/* Collection Progress Bar */}
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                percentPaid >= 100 ? 'bg-emerald-500' : percentPaid > 0 ? 'bg-teal-500' : 'bg-rose-400'
                              }`}
                              style={{ width: `${percentPaid}%` }}
                            ></div>
                          </div>

                          {st.concessionAmount && st.concessionAmount > 0 ? (
                            <div className="flex items-center justify-between text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              <span>Discount:</span>
                              <span className="font-bold">-₹{st.concessionAmount.toLocaleString('en-IN')} ({st.concessionReason || 'Scholarship'})</span>
                            </div>
                          ) : null}
                        </div>

                        {/* Card Actions: Collect Fee, Concession, Receipt */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                          <button
                            type="button"
                            onClick={() => openRecordModal(st)}
                            className="flex-1 py-1.5 px-2 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white rounded-lg text-xs font-black transition flex items-center justify-center space-x-1 shadow-2xs cursor-pointer"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Collect</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openConcessionModal(st)}
                            className="py-1.5 px-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                            title="Apply Concession or Scholarship"
                          >
                            <Tag className="w-3.5 h-3.5 text-amber-700" />
                            <span>Discount</span>
                          </button>
                          {st.amountPaid > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveReceipt({
                                  id: `REC-${st.rollNumber}`,
                                  receiptNumber: `REC-${st.rollNumber}`,
                                  studentId: st.studentId,
                                  studentName: st.name,
                                  studentRollNumber: st.rollNumber,
                                  amount: st.amountPaid,
                                  paymentDate: st.lastPaymentDate || new Date().toISOString().split('T')[0],
                                  paymentMethod: st.lastPaymentMethod || 'UPI',
                                  remainingPending: st.amountPending,
                                  totalFee: st.totalFee,
                                  totalPaid: st.amountPaid,
                                  recordedByName: 'Finance Desk',
                                });
                                setReceiptModalOpen(true);
                              }}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
                              title="View Fee Receipt"
                            >
                              <Receipt className="w-3.5 h-3.5 text-teal-600" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 2. FINANCIAL LEDGER TABLE VIEW */}
              {feeViewMode === 'TABLE' && (
                <div className="overflow-x-auto max-h-[680px] overflow-y-auto border-b border-slate-200">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur-xs border-b border-slate-200 shadow-2xs">
                      <tr className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        <th className="py-3 px-4">Student</th>
                        <th className="py-3 px-4">Roll Number</th>
                        <th className="py-3 px-4">Contact & Chat</th>
                        <th className="py-3 px-4">Base Fee</th>
                        <th className="py-3 px-4">Concession</th>
                        <th className="py-3 px-4">Net Payable</th>
                        <th className="py-3 px-4">Paid</th>
                        <th className="py-3 px-4">Pending</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {filteredStudents.map((st) => (
                        <tr key={st.studentId} className="hover:bg-slate-50/80 transition">
                          {/* Student Info */}
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-3">
                              {st.photoUrl ? (
                                <img
                                  src={st.photoUrl}
                                  alt={st.name}
                                  className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-2xs"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-xs">
                                  {st.name.charAt(0)}
                                </div>
                              )}
                              <div>
                                <p className="font-bold text-slate-900 text-sm leading-tight">{st.name}</p>
                                <span className="text-[11px] text-slate-500 font-medium">
                                  Grade {st.classGrade || 'N/A'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Roll Number Pill */}
                          <td className="py-3 px-4">
                            <span className="font-mono text-xs font-black px-2.5 py-1 bg-slate-100 text-slate-800 rounded-md border border-slate-200">
                              {st.rollNumber}
                            </span>
                          </td>

                          {/* Direct Call & WhatsApp Button */}
                          <td className="py-3 px-4">
                            {st.phone ? (
                              <div className="flex items-center space-x-1.5">
                                <a
                                  href={`tel:${st.phone}`}
                                  className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer group"
                                  title={`Directly dial ${st.phone}`}
                                >
                                  <Phone className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
                                  <span>{st.phone}</span>
                                </a>
                                <a
                                  href={`https://wa.me/91${st.phone.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(
                                    `Dear Parent of ${st.name} (Roll: ${st.rollNumber}), this is an official fee reminder from Pragathi AI. Pending balance is ₹${st.amountPending}. Thank you!`
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition shadow-2xs cursor-pointer"
                                  title={`Send WhatsApp Fee Reminder`}
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs">No phone</span>
                            )}
                          </td>

                          {/* Base Fee */}
                          <td className="py-3 px-4 text-xs font-bold text-slate-700">
                            ₹{st.totalFee.toLocaleString('en-IN')}
                          </td>

                          {/* Concession / Discount */}
                          <td className="py-3 px-4 text-xs">
                            {st.concessionAmount && st.concessionAmount > 0 ? (
                              <button
                                type="button"
                                onClick={() => openConcessionModal(st)}
                                className="group inline-flex items-center space-x-1 text-amber-800 hover:text-amber-900 font-bold bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-md cursor-pointer transition"
                                title="Click to edit concession"
                              >
                                <Tag className="w-3 h-3 text-amber-600" />
                                <span>-₹{st.concessionAmount.toLocaleString('en-IN')}</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => openConcessionModal(st)}
                                className="text-slate-400 hover:text-teal-700 text-[11px] underline cursor-pointer"
                              >
                                + Add
                              </button>
                            )}
                          </td>

                          {/* Net Payable */}
                          <td className="py-3 px-4 text-xs font-black text-slate-900">
                            ₹{st.netFee.toLocaleString('en-IN')}
                          </td>

                          {/* Paid */}
                          <td className="py-3 px-4 text-xs font-bold text-emerald-700">
                            ₹{st.amountPaid.toLocaleString('en-IN')}
                          </td>

                          {/* Pending Balance */}
                          <td className="py-3 px-4 text-xs font-black">
                            <span
                              className={
                                st.amountPending > 0
                                  ? 'text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200'
                                  : 'text-slate-400'
                              }
                            >
                              ₹{st.amountPending.toLocaleString('en-IN')}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                st.status === 'PAID'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : st.status === 'PARTIALLY_PAID'
                                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                                  : 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse'
                              }`}
                            >
                              {st.status === 'PAID'
                                ? 'Paid'
                                : st.status === 'PARTIALLY_PAID'
                                ? 'Partial'
                                : 'Pending'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                type="button"
                                onClick={() => openRecordModal(st)}
                                className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition shadow-2xs flex items-center space-x-1 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Collect</span>
                              </button>

                              {st.amountPaid > 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveReceipt({
                                      id: `REC-${st.rollNumber}`,
                                      receiptNumber: `REC-${st.rollNumber}`,
                                      studentId: st.studentId,
                                      studentName: st.name,
                                      studentRollNumber: st.rollNumber,
                                      amount: st.amountPaid,
                                      paymentDate: st.lastPaymentDate || new Date().toISOString().split('T')[0],
                                      paymentMethod: st.lastPaymentMethod || 'UPI',
                                      remainingPending: st.amountPending,
                                      totalFee: st.totalFee,
                                      totalPaid: st.amountPaid,
                                      recordedByName: 'Finance Desk',
                                    });
                                    setReceiptModalOpen(true);
                                  }}
                                  className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
                                  title="View Receipt"
                                >
                                  <Receipt className="w-3.5 h-3.5 text-teal-600" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Financial Ledger Summary Footer Bar */}
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 font-medium">
                <span>
                  Showing <strong className="text-slate-800">{filteredStudents.length}</strong> of {students.length} students in fee register
                </span>
                <span className="font-bold text-slate-700">
                  Total Outstanding Balance: <strong className="text-rose-700">₹{(summary?.totalPending || 0).toLocaleString('en-IN')}</strong>
                </span>
              </div>
            </>
          )}
        </div>
      ) : (
        /* Transactions History Card */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">All Payment Transactions History</h3>
              <p className="text-xs text-slate-500">Official audit trail with receipt view and transaction deletion</p>
            </div>

            {/* Transactions Search Bar */}
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search receipt, roll, student..."
                value={transSearch}
                onChange={(e) => setTransSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
          </div>

          {filteredPayments.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-sm">
              {transSearch ? 'No transactions match your search.' : 'No payments recorded yet.'}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="sticky top-0 bg-slate-100/95 backdrop-blur-xs border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider z-10">
                      <th className="py-3 px-4">Receipt / ID</th>
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Roll Number</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Method</th>
                      <th className="py-3 px-4">Reference</th>
                      <th className="py-3 px-4">Recorded By</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 font-mono font-bold text-xs text-teal-800">{p.id}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{p.studentName}</td>
                        <td className="py-3 px-4 font-mono font-bold text-xs">{p.studentRollNumber}</td>
                        <td className="py-3 px-4 font-black text-emerald-700">₹{p.amount.toLocaleString('en-IN')}</td>
                        <td className="py-3 px-4 text-xs text-slate-600">{p.paymentDate}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {p.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs font-mono text-slate-500">{p.transactionId || '—'}</td>
                        <td className="py-3 px-4 text-xs text-slate-500">{p.recordedByName}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveReceipt(p);
                                setReceiptModalOpen(true);
                              }}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                            >
                              <Receipt className="w-3.5 h-3.5 text-teal-600" />
                              <span>Receipt</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePayment(p)}
                              disabled={deletingPaymentId === p.id}
                              className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg transition cursor-pointer disabled:opacity-50"
                              title="Delete this payment transaction"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Transactions Summary Footer Bar */}
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 font-medium">
                <span>
                  Showing <strong className="text-slate-800">{filteredPayments.length}</strong> of {allPayments.length} transactions
                </span>
                <span className="font-bold text-slate-700">
                  Total Collected from Records: <strong className="text-emerald-700">₹{filteredPayments.reduce((acc, p) => acc + (p.amount || 0), 0).toLocaleString('en-IN')}</strong>
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Record Payment Modal */}
      {recordModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-scaleIn">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-teal-50 rounded-xl text-teal-700">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Record Student Payment</h3>
                  <p className="text-xs text-slate-500">
                    {selectedStudent.name} • {selectedStudent.rollNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRecordModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Financial Overview Card */}
            <div className="my-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Base Program Fee:</span>
                <span className="font-bold text-slate-800">₹{selectedStudent.totalFee.toLocaleString('en-IN')}</span>
              </div>
              {selectedStudent.concessionAmount && selectedStudent.concessionAmount > 0 && (
                <div className="flex justify-between text-amber-800">
                  <span>Concession / Discount ({selectedStudent.concessionReason || 'Scholarship'}):</span>
                  <span className="font-bold">-₹{selectedStudent.concessionAmount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between font-bold pt-1 border-t border-slate-200">
                <span className="text-slate-700">Net Fee Payable:</span>
                <span className="text-slate-900">₹{selectedStudent.netFee.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Already Paid:</span>
                <span className="font-bold">₹{selectedStudent.amountPaid.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-rose-700 font-bold">
                <span>Remaining Pending:</span>
                <span>₹{selectedStudent.amountPending.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Payment Amount (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full text-base font-bold px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Payment Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Payment Method *
                  </label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as any)}
                    className="w-full text-xs font-bold px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white"
                  >
                    <option value="UPI">UPI / GPay / PhonePe</option>
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Transaction / UTR Reference ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. UPI Ref: 329048123902"
                  value={payTransactionId}
                  onChange={(e) => setPayTransactionId(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Payment Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Installment 1 paid by father"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRecordModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmitting ? 'Recording...' : 'Confirm & Generate Receipt'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Concession / Discount Modal */}
      {concessionModalOpen && concessionStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-scaleIn">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-amber-50 rounded-xl text-amber-800 border border-amber-200">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Fee Concession & Discount</h3>
                  <p className="text-xs text-slate-500">
                    {concessionStudent.name} • {concessionStudent.rollNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setConcessionModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveConcessionSubmit} className="space-y-4 my-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Concession / Discount Amount (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max={concessionStudent.totalFee}
                  value={concessionAmountInput}
                  onChange={(e) => setConcessionAmountInput(e.target.value)}
                  className="w-full text-base font-black px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white text-amber-900"
                />

                {/* Preset Fast Pills */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[11px] text-slate-400 font-bold mr-1">Presets:</span>
                  {['0', '200', '350', '500', String(concessionStudent.totalFee)].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setConcessionAmountInput(p)}
                      className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer"
                    >
                      {p === '0' ? 'No Discount' : p === String(concessionStudent.totalFee) ? '100% Free' : `₹${p}`}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Concession Reason / Category *
                </label>
                <select
                  value={concessionReasonInput}
                  onChange={(e) => setConcessionReasonInput(e.target.value)}
                  className="w-full text-xs font-bold px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white mb-2"
                >
                  <option value="Merit Scholarship">Merit Scholarship (High Performer)</option>
                  <option value="Sibling Discount">Sibling Discount</option>
                  <option value="Early Enrollment Concession">Early Enrollment Concession</option>
                  <option value="Financial Need / Hardship">Financial Need / Economic Hardship</option>
                  <option value="Staff / Faculty Ward">Staff / Faculty Ward</option>
                  <option value="Special Institutional Waiver">Special Institutional Waiver</option>
                  <option value="Other / Custom">Other (Custom Reason)</option>
                </select>

                <input
                  type="text"
                  placeholder="Specific concession details or notes..."
                  value={concessionReasonInput}
                  onChange={(e) => setConcessionReasonInput(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>

              {/* Dynamic Calculation Preview */}
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Base Fee:</span>
                  <span className="font-bold">₹{concessionStudent.totalFee.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-amber-900 font-bold">
                  <span>Concession:</span>
                  <span>-₹{(Number(concessionAmountInput) || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between font-black text-slate-900 pt-1 border-t border-amber-200">
                  <span>New Net Payable:</span>
                  <span>
                    ₹{Math.max(0, concessionStudent.totalFee - (Number(concessionAmountInput) || 0)).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setConcessionModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingConcession}
                  className="px-5 py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSavingConcession ? 'Saving...' : 'Apply Concession'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Printable Receipt Modal */}
      {receiptModalOpen && activeReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-scaleIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 no-print">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Official Payment Receipt</span>
              <button
                onClick={() => setReceiptModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div id="payment-receipt" className="p-6 border-2 border-dashed border-slate-300 rounded-2xl bg-white space-y-5">
              {/* Header */}
              <div className="text-center pb-4 border-b border-slate-200">
                <img
                  src="/images/logo.png"
                  alt="PRAGATHI AI"
                  className="h-14 w-auto mx-auto object-contain mb-1"
                />
                <h2 className="text-xl font-black text-slate-900 tracking-tight">PRAGATHI AI EDUCATION</h2>
                <p className="text-[11px] text-slate-500 uppercase tracking-widest font-bold">
                  Official Fee Payment Receipt
                </p>
              </div>

              {/* Receipt Details Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Receipt Number</span>
                  <p className="font-mono font-bold text-slate-900">{activeReceipt.receiptNumber || activeReceipt.id}</p>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Payment Date</span>
                  <p className="font-bold text-slate-900">{activeReceipt.paymentDate}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Student Name</span>
                  <p className="font-bold text-slate-900 text-sm">{activeReceipt.studentName}</p>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Roll Number</span>
                  <p className="font-mono font-black text-teal-800 text-sm">{activeReceipt.studentRollNumber}</p>
                </div>
              </div>

              {/* Amount Box */}
              <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-teal-800 uppercase">Amount Paid</span>
                  <p className="text-xs text-teal-600 font-medium">{activeReceipt.paymentMethod} Payment</p>
                </div>
                <p className="text-2xl font-black text-teal-900">
                  ₹{Number(activeReceipt.amount).toLocaleString('en-IN')}
                </p>
              </div>

              {/* Transaction ID if any */}
              {activeReceipt.transactionId && (
                <div className="text-xs">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Transaction / UTR Reference</span>
                  <p className="font-mono text-slate-700">{activeReceipt.transactionId}</p>
                </div>
              )}

              {/* Signoff */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                <span>Recorded By: {activeReceipt.recordedByName || 'Administration'}</span>
                <span className="font-bold text-emerald-700">✓ Verified Official</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between mt-6 no-print">
              <button
                type="button"
                onClick={() => handleDeletePayment(activeReceipt)}
                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition flex items-center space-x-1.5 cursor-pointer"
                title="Delete this payment transaction"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-slate-800 transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReceiptModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
