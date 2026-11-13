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
  QrCode,
  Share2,
  Copy,
  ExternalLink,
  FileText,
  Check,
} from 'lucide-react';
import QuickNavigationHeader from '@/components/QuickNavigationHeader';

const DEFAULT_UPI_ID = '9618611522@ybl';
const MERCHANT_NAME = 'PRAGATHI AI EDUCATION';

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
  const [selectedGrade, setSelectedGrade] = useState<string>('ALL');

  // Record Payment Modal State
  const [recordModalOpen, setRecordModalOpen] = useState<boolean>(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentFeeItem | null>(null);
  const [collectMode, setCollectMode] = useState<'MANUAL' | 'UPI_QR'>('MANUAL');
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

  // Standalone UPI QR Modal State
  const [upiModalStudent, setUpiModalStudent] = useState<StudentFeeItem | null>(null);
  const [upiCustomAmount, setUpiCustomAmount] = useState<string>('');
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);

  // Student Payment History / Ledger Modal
  const [ledgerStudent, setLedgerStudent] = useState<StudentFeeItem | null>(null);

  // Defaulters Outreach Modal
  const [defaultersModalOpen, setDefaultersModalOpen] = useState<boolean>(false);
  const [copiedDefaulters, setCopiedDefaulters] = useState<boolean>(false);

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

  // Compute dynamic class grade list
  const classList = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      const val = (s.classGrade || '').trim();
      if (val && val !== 'Not Specified' && val !== 'N/A') {
        set.add(val);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [students]);

  const openRecordModal = (student: StudentFeeItem) => {
    setSelectedStudent(student);
    setCollectMode('MANUAL');
    setPayAmount(student.amountPending > 0 ? String(student.amountPending) : '500');
    setPayDate(new Date().toISOString().split('T')[0]);
    setPayMethod('UPI');
    setPayTransactionId('');
    setPayNotes('');
    setRecordModalOpen(true);
  };

  const openUpiModal = (student: StudentFeeItem) => {
    setUpiModalStudent(student);
    setUpiCustomAmount(student.amountPending > 0 ? String(student.amountPending) : '1350');
    setCopiedUpi(false);
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

      // If ledger modal is open, refresh ledger student
      if (ledgerStudent) {
        const updated = students.find((s) => s.studentId === ledgerStudent.studentId);
        if (updated) setLedgerStudent(updated);
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting payment transaction');
    } finally {
      setDeletingPaymentId(null);
    }
  };

  // 1-Click WhatsApp Share Receipt
  const handleShareReceiptWhatsApp = (receipt: any) => {
    if (!receipt) return;
    const student = students.find(
      (s) => s.studentId === receipt.studentId || s.rollNumber === receipt.studentRollNumber
    );
    const phone = student?.phone || '';
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);

    const message = [
      `🧾 *PRAGATHI AI EDUCATION - OFFICIAL FEE RECEIPT*`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `*Receipt No:* ${receipt.receiptNumber || receipt.id}`,
      `*Student Name:* ${receipt.studentName}`,
      `*Roll Number:* ${receipt.studentRollNumber}`,
      `*Date:* ${receipt.paymentDate}`,
      `*Amount Paid:* ₹${Number(receipt.amount).toLocaleString('en-IN')} (${receipt.paymentMethod})`,
      receipt.transactionId ? `*Transaction Ref:* ${receipt.transactionId}` : null,
      `*Remaining Balance:* ₹${Number(receipt.remainingPending ?? student?.amountPending ?? 0).toLocaleString('en-IN')}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `Thank you for your fee payment!`,
      `PRAGATHI AI Education • Phone: +91 9618611522`,
    ]
      .filter(Boolean)
      .join('\n');

    const waUrl = cleanPhone
      ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  // Dynamic UPI URL generator
  const getUpiUrl = (student: StudentFeeItem | null, amount: number) => {
    if (!student) return '';
    const note = `Fee for ${student.name} (${student.rollNumber})`;
    return `upi://pay?pa=${DEFAULT_UPI_ID}&pn=${encodeURIComponent(MERCHANT_NAME)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;
  };

  // Export CSV of student fee roster
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

  // Export CSV of all payment transactions
  const exportTransactionsCSV = () => {
    if (allPayments.length === 0) return;

    const headers = [
      'Receipt Number',
      'Payment ID',
      'Roll Number',
      'Student Name',
      'Amount (INR)',
      'Payment Date',
      'Payment Method',
      'Transaction / UTR ID',
      'Recorded By',
      'Notes',
      'Timestamp',
    ];

    const rows = filteredPayments.map((p) => [
      `"${p.receiptNumber || p.id}"`,
      `"${p.id}"`,
      `"${p.studentRollNumber}"`,
      `"${p.studentName.replace(/"/g, '""')}"`,
      p.amount,
      `"${p.paymentDate}"`,
      `"${p.paymentMethod}"`,
      `"${(p.transactionId || '').replace(/"/g, '""')}"`,
      `"${(p.recordedByName || '').replace(/"/g, '""')}"`,
      `"${(p.notes || '').replace(/"/g, '""')}"`,
      `"${p.createdAt}"`,
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `PRAGATHI_AI_PAYMENT_TRANSACTIONS_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Filter students based on search, status, and class grade
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.phone.includes(searchQuery);

      if (!matchesSearch) return false;

      if (selectedGrade !== 'ALL') {
        const gradeVal = (s.classGrade || '').trim();
        if (gradeVal !== selectedGrade) return false;
      }

      if (statusFilter === 'PAID') return s.status === 'PAID';
      if (statusFilter === 'PARTIALLY_PAID') return s.status === 'PARTIALLY_PAID';
      if (statusFilter === 'PENDING') return s.status === 'PENDING';
      return true;
    });
  }, [students, searchQuery, statusFilter, selectedGrade]);

  const defaulterCount = useMemo(() => students.filter((s) => s.status === 'PENDING').length, [students]);
  const partialCount = useMemo(() => students.filter((s) => s.status === 'PARTIALLY_PAID').length, [students]);
  const paidCount = useMemo(() => students.filter((s) => s.status === 'PAID').length, [students]);

  // Defaulters list for outreach
  const defaultersList = useMemo(() => {
    return students.filter((s) => s.amountPending > 0);
  }, [students]);

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
      {/* 1. APP BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 pb-1">
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
              Fee Management & Payments
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">
              Academic Year 2026-27 • {students.length} Enrolled • UPI: {DEFAULT_UPI_ID}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Defaulters Outreach Button */}
          <button
            type="button"
            onClick={() => setDefaultersModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs"
            title="Send reminders to students with pending fees"
          >
            <Bell className="w-3.5 h-3.5 text-rose-600" />
            <span>Reminders ({defaulterCount + partialCount})</span>
          </button>

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
            onClick={activeTab === 'ROSTER' ? exportFeeReportCSV : exportTransactionsCSV}
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
            <p className="font-black text-slate-900 text-sm">
              ₹{(summary?.totalGrossExpected || summary?.totalExpected || 0).toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 px-1">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></div>
          <div>
            <span className="text-[10px] text-emerald-700 font-bold uppercase">
              Collected ({collectionPercentage}%)
            </span>
            <p className="font-black text-emerald-800 text-sm">
              ₹{(summary?.totalCollected || 0).toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 px-1">
          <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></div>
          <div>
            <span className="text-[10px] text-rose-700 font-bold uppercase">Pending Balance</span>
            <p className="font-black text-rose-700 text-sm">
              ₹{(summary?.totalPending || 0).toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 px-1">
          <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></div>
          <div>
            <span className="text-[10px] text-amber-700 font-bold uppercase">Unpaid / Defaulters</span>
            <p className="font-black text-amber-800 text-sm">
              {defaulterCount + partialCount} students
            </p>
          </div>
        </div>
      </div>

      {activeTab === 'ROSTER' ? (
        /* Student Fee Roster Card */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Filter & View Control Header */}
          <div className="p-3 sm:p-4 border-b border-slate-200/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 bg-slate-50/70">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search name, roll no, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>

              {/* Class / Grade Filter Selector */}
              {classList.length > 0 && (
                <div className="flex items-center space-x-1.5 shrink-0">
                  <span className="text-xs text-slate-500 font-bold hidden lg:inline">Grade:</span>
                  <select
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 cursor-pointer"
                  >
                    <option value="ALL">All Grades ({students.length})</option>
                    {classList.map((c) => {
                      const count = students.filter((s) => s.classGrade === c).length;
                      return (
                        <option key={c} value={c}>
                          Grade {c} ({count})
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 overflow-x-auto scrollbar-none py-0.5 w-full md:w-auto">
              {/* Status Filter Chips with Live Tallies */}
              <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs shrink-0">
                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer shrink-0 ${
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
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer shrink-0 ${
                    statusFilter === 'PENDING'
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'text-rose-700 hover:bg-rose-50'
                  }`}
                >
                  <AlertCircle className="w-3 h-3" />
                  <span>Pending</span>
                  <span className="text-[10px] opacity-90 font-mono">({defaulterCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('PARTIALLY_PAID')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer shrink-0 ${
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
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer shrink-0 ${
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
              <div className="flex items-center space-x-0.5 bg-slate-200/80 p-1 rounded-xl shrink-0">
                <button
                  type="button"
                  onClick={() => setFeeViewMode('CARDS')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
                    feeViewMode === 'CARDS'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Student Fee Cards Grid"
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-teal-600" />
                  <span>Cards</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFeeViewMode('TABLE')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
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
                    const percentPaid =
                      st.netFee > 0 ? Math.min(100, Math.round((st.amountPaid / st.netFee) * 100)) : 100;
                    const waReminderUrl = `https://wa.me/91${st.phone.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(
                      `Dear Parent of ${st.name} (Roll: ${st.rollNumber}),\n\nThis is a friendly fee update from Pragathi AI Education. The pending tuition balance is ₹${st.amountPending.toLocaleString('en-IN')}.\n\nYou may pay directly via UPI to: ${DEFAULT_UPI_ID}.\n\nThank you!`
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
                              {st.status === 'PAID'
                                ? 'Paid'
                                : st.status === 'PARTIALLY_PAID'
                                ? 'Partial'
                                : 'Pending'}
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
                                st.status === 'PAID'
                                  ? 'border-emerald-500'
                                  : st.status === 'PARTIALLY_PAID'
                                  ? 'border-amber-400'
                                  : 'border-rose-500'
                              }`}
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-800 font-black flex items-center justify-center text-sm shadow-xs shrink-0 border-2 border-teal-300">
                              {st.name.charAt(0)}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <h4
                              className="font-black text-slate-900 text-sm leading-snug truncate"
                              title={st.name}
                            >
                              {st.name}
                            </h4>
                            {st.schoolName && (
                              <p className="text-[11px] text-slate-500 truncate" title={st.schoolName}>
                                {st.schoolName}
                              </p>
                            )}

                            {/* Direct Contact Buttons */}
                            {st.phone ? (
                              <div className="flex items-center space-x-1.5 mt-1.5">
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
                            <span className="font-bold text-slate-800">
                              ₹{st.netFee.toLocaleString('en-IN')}
                            </span>
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
                                percentPaid >= 100
                                  ? 'bg-emerald-500'
                                  : percentPaid > 0
                                  ? 'bg-teal-500'
                                  : 'bg-rose-400'
                              }`}
                              style={{ width: `${percentPaid}%` }}
                            ></div>
                          </div>

                          {st.concessionAmount && st.concessionAmount > 0 ? (
                            <div className="flex items-center justify-between text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              <span>Discount:</span>
                              <span className="font-bold">
                                -₹{st.concessionAmount.toLocaleString('en-IN')} (
                                {st.concessionReason || 'Scholarship'})
                              </span>
                            </div>
                          ) : null}
                        </div>

                        {/* Card Actions: Collect Fee, UPI QR, Concession, Ledger */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                          <button
                            type="button"
                            onClick={() => openRecordModal(st)}
                            className="flex-1 py-1.5 px-2 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white rounded-lg text-xs font-black transition flex items-center justify-center space-x-1 shadow-2xs cursor-pointer"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Collect</span>
                          </button>

                          {/* Quick UPI QR Code Button */}
                          {st.amountPending > 0 && (
                            <button
                              type="button"
                              onClick={() => openUpiModal(st)}
                              className="py-1.5 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                              title="Show UPI Payment QR Code"
                            >
                              <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                              <span className="hidden sm:inline">UPI</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => openConcessionModal(st)}
                            className="py-1.5 px-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                            title="Apply Concession or Scholarship"
                          >
                            <Tag className="w-3.5 h-3.5 text-amber-700" />
                            <span className="hidden sm:inline">Discount</span>
                          </button>

                          {/* Student Payment History / Ledger */}
                          <button
                            type="button"
                            onClick={() => setLedgerStudent(st)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
                            title="View Full Payment Ledger & Past Receipts"
                          >
                            <FileText className="w-3.5 h-3.5 text-slate-700" />
                          </button>
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
                        <th className="py-3 px-4">Contact</th>
                        <th className="py-3 px-4">Base Fee</th>
                        <th className="py-3 px-4">Discount</th>
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
                                <p className="font-bold text-slate-900 text-sm leading-tight">
                                  {st.name}
                                </p>
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
                                  className="inline-flex items-center space-x-1 px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md text-xs font-bold transition shadow-2xs cursor-pointer"
                                  title={`Dial ${st.phone}`}
                                >
                                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>{st.phone}</span>
                                </a>
                                <a
                                  href={`https://wa.me/91${st.phone.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(
                                    `Dear Parent of ${st.name} (Roll: ${st.rollNumber}), this is an official fee update from Pragathi AI Education. Pending balance is ₹${st.amountPending}. Thank you!`
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md transition shadow-2xs cursor-pointer"
                                  title="Send WhatsApp Fee Reminder"
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

                              {st.amountPending > 0 && (
                                <button
                                  type="button"
                                  onClick={() => openUpiModal(st)}
                                  className="p-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition cursor-pointer"
                                  title="Show UPI QR Code"
                                >
                                  <QrCode className="w-3.5 h-3.5" />
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => setLedgerStudent(st)}
                                className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
                                title="View Payment History & Ledger"
                              >
                                <FileText className="w-3.5 h-3.5 text-slate-700" />
                              </button>
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
                  Showing <strong className="text-slate-800">{filteredStudents.length}</strong> of{' '}
                  {students.length} students in fee register
                </span>
                <span className="font-bold text-slate-700">
                  Total Outstanding Balance:{' '}
                  <strong className="text-rose-700">
                    ₹{(summary?.totalPending || 0).toLocaleString('en-IN')}
                  </strong>
                </span>
              </div>
            </>
          )}
        </div>
      ) : (
        /* TRANSACTIONS TAB */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-3 sm:p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-50/70">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search receipt, student, roll no, or UTR..."
                value={transSearch}
                onChange={(e) => setTransSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500 font-bold">
                Total Receipts: {filteredPayments.length}
              </span>
              <button
                type="button"
                onClick={exportTransactionsCSV}
                className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-teal-300" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {filteredPayments.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-sm">
              No payment transactions recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[680px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur-xs border-b border-slate-200 shadow-2xs">
                  <tr className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    <th className="py-3 px-4">Receipt #</th>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Roll Number</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">UTR / Transaction ID</th>
                    <th className="py-3 px-4">Recorded By</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-teal-800">
                        {p.receiptNumber || p.id}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{p.studentName}</td>
                      <td className="py-3 px-4 font-mono font-black">{p.studentRollNumber}</td>
                      <td className="py-3 px-4 font-black text-emerald-700">
                        ₹{p.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{p.paymentDate}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200">
                          {p.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {p.transactionId || '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{p.recordedByName}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveReceipt(p);
                              setReceiptModalOpen(true);
                            }}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer"
                            title="View Receipt"
                          >
                            <Receipt className="w-3.5 h-3.5 text-teal-600" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleShareReceiptWhatsApp(p)}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition cursor-pointer"
                            title="Share Receipt on WhatsApp"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePayment(p)}
                            disabled={deletingPaymentId === p.id}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition cursor-pointer disabled:opacity-50"
                            title="Delete Transaction"
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
          )}
        </div>
      )}

      {/* MODAL 1: RECORD PAYMENT MODAL (WITH MANUAL & UPI QR TABS) */}
      {recordModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-scaleIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-teal-50 rounded-xl text-teal-700">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight">
                    Collect Fee Payment
                  </h3>
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

            {/* Financial Status Summary */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs my-4 space-y-1">
              <div className="flex justify-between text-slate-500">
                <span>Net Payable:</span>
                <span className="font-bold text-slate-800">
                  ₹{selectedStudent.netFee.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Paid So Far:</span>
                <span className="font-bold">
                  ₹{selectedStudent.amountPaid.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-rose-700 font-black pt-1 border-t border-slate-200">
                <span>Remaining Pending:</span>
                <span>₹{selectedStudent.amountPending.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Mode Switcher: Form vs Parent UPI QR */}
            <div className="flex bg-slate-100 p-1 rounded-xl mb-4 border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setCollectMode('MANUAL')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center justify-center space-x-1.5 ${
                  collectMode === 'MANUAL'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-teal-600" />
                <span>Enter Payment</span>
              </button>
              <button
                type="button"
                onClick={() => setCollectMode('UPI_QR')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center justify-center space-x-1.5 ${
                  collectMode === 'UPI_QR'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                <span>Show Parent UPI QR</span>
              </button>
            </div>

            {collectMode === 'UPI_QR' ? (
              <div className="space-y-4 text-center">
                <p className="text-xs text-slate-600 font-medium">
                  Ask the parent or student to scan this dynamic QR code using Google Pay, PhonePe, Paytm, or BHIM:
                </p>

                <div className="inline-block p-4 bg-white border-2 border-indigo-300 rounded-3xl shadow-sm">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=4&data=${encodeURIComponent(
                      getUpiUrl(selectedStudent, Number(payAmount) || selectedStudent.amountPending)
                    )}`}
                    alt="UPI Payment QR Code"
                    className="w-48 h-48 mx-auto"
                  />
                  <div className="mt-2 text-xs font-black text-slate-900">
                    Amount: ₹{(Number(payAmount) || selectedStudent.amountPending).toLocaleString('en-IN')}
                  </div>
                  <p className="text-[11px] font-mono text-indigo-800 font-bold">{DEFAULT_UPI_ID}</p>
                </div>

                <div className="flex items-center justify-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      const url = getUpiUrl(
                        selectedStudent,
                        Number(payAmount) || selectedStudent.amountPending
                      );
                      navigator.clipboard.writeText(url);
                      setCopiedUpi(true);
                      setTimeout(() => setCopiedUpi(false), 2000);
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                  >
                    {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedUpi ? 'Copied Link!' : 'Copy UPI Link'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCollectMode('MANUAL');
                    }}
                    className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                  >
                    <span>Proceed to Confirm</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRecordPaymentSubmit} className="space-y-3.5">
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
                      className="w-full text-xs font-bold px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white cursor-pointer"
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
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: STANDALONE UPI QR PAYMENT POPUP */}
      {upiModalStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center animate-scaleIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center space-x-2 text-left">
                <div className="p-2 bg-indigo-50 rounded-xl text-indigo-700">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Scan to Pay via UPI</h3>
                  <p className="text-[11px] text-slate-500">
                    {upiModalStudent.name} ({upiModalStudent.rollNumber})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setUpiModalStudent(null)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=4&data=${encodeURIComponent(
                    getUpiUrl(upiModalStudent, Number(upiCustomAmount) || upiModalStudent.amountPending)
                  )}`}
                  alt="UPI QR Code"
                  className="w-48 h-48 mx-auto rounded-xl"
                />
                <div className="mt-2 text-base font-black text-slate-900">
                  ₹{(Number(upiCustomAmount) || upiModalStudent.amountPending).toLocaleString('en-IN')}
                </div>
                <p className="text-xs font-mono font-bold text-indigo-800">{DEFAULT_UPI_ID}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                  {MERCHANT_NAME}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    const url = getUpiUrl(
                      upiModalStudent,
                      Number(upiCustomAmount) || upiModalStudent.amountPending
                    );
                    navigator.clipboard.writeText(url);
                    setCopiedUpi(true);
                    setTimeout(() => setCopiedUpi(false), 2000);
                  }}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 cursor-pointer"
                >
                  {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUpi ? 'Copied!' : 'Copy UPI Link'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const st = upiModalStudent;
                    setUpiModalStudent(null);
                    openRecordModal(st);
                  }}
                  className="flex-1 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Record Payment</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: STUDENT PAYMENT HISTORY & LEDGER MODAL */}
      {ledgerStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-scaleIn max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                {ledgerStudent.photoUrl ? (
                  <img
                    src={ledgerStudent.photoUrl}
                    alt={ledgerStudent.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-800 font-black flex items-center justify-center text-sm">
                    {ledgerStudent.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="text-base font-black text-slate-900 leading-tight">
                    {ledgerStudent.name} — Student Fee Ledger
                  </h3>
                  <p className="text-xs text-slate-500">
                    Roll: <span className="font-mono font-bold text-slate-800">{ledgerStudent.rollNumber}</span> • Grade {ledgerStudent.classGrade || 'N/A'} • {ledgerStudent.phone || 'No phone'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setLedgerStudent(null)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Financial Status Summary Strip */}
            <div className="grid grid-cols-4 gap-2 my-4 text-xs">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Base Fee</span>
                <p className="font-bold text-slate-800 text-sm mt-0.5">₹{ledgerStudent.totalFee.toLocaleString('en-IN')}</p>
              </div>
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-center">
                <span className="text-[10px] text-amber-700 font-bold uppercase">Discount</span>
                <p className="font-bold text-amber-800 text-sm mt-0.5">-₹{(ledgerStudent.concessionAmount || 0).toLocaleString('en-IN')}</p>
              </div>
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                <span className="text-[10px] text-emerald-700 font-bold uppercase">Total Paid</span>
                <p className="font-bold text-emerald-800 text-sm mt-0.5">₹{ledgerStudent.amountPaid.toLocaleString('en-IN')}</p>
              </div>
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-center">
                <span className="text-[10px] text-rose-700 font-bold uppercase">Pending Balance</span>
                <p className="font-bold text-rose-700 text-sm mt-0.5">₹{ledgerStudent.amountPending.toLocaleString('en-IN')}</p>
              </div>
            </div>

            {/* Past Payment Installments Table */}
            <div className="flex-1 overflow-y-auto space-y-2 border border-slate-200 rounded-2xl overflow-hidden">
              <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Payment History ({allPayments.filter((p) => p.studentId === ledgerStudent.studentId).length} installments)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const st = ledgerStudent;
                    setLedgerStudent(null);
                    openRecordModal(st);
                  }}
                  className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Collect Installment</span>
                </button>
              </div>

              {allPayments.filter((p) => p.studentId === ledgerStudent.studentId).length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No payment transactions recorded yet for this student.
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-600 font-bold">
                    <tr>
                      <th className="py-2 px-3">Receipt #</th>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Amount</th>
                      <th className="py-2 px-3">Method</th>
                      <th className="py-2 px-3">Ref / UTR</th>
                      <th className="py-2 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allPayments
                      .filter((p) => p.studentId === ledgerStudent.studentId)
                      .map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono font-bold text-teal-800">
                            {p.receiptNumber || p.id}
                          </td>
                          <td className="py-2.5 px-3">{p.paymentDate}</td>
                          <td className="py-2.5 px-3 font-black text-emerald-700">
                            ₹{p.amount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 font-bold text-[10px]">
                              {p.paymentMethod}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-500">
                            {p.transactionId || '—'}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end space-x-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveReceipt(p);
                                  setReceiptModalOpen(true);
                                }}
                                className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition cursor-pointer"
                                title="Print Receipt"
                              >
                                <Receipt className="w-3.5 h-3.5 text-teal-600" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleShareReceiptWhatsApp(p)}
                                className="p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded transition cursor-pointer"
                                title="Share on WhatsApp"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeletePayment(p)}
                                className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded transition cursor-pointer"
                                title="Delete Payment"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4">
              <button
                type="button"
                onClick={() => setLedgerStudent(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>
              {ledgerStudent.amountPending > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const st = ledgerStudent;
                    setLedgerStudent(null);
                    openUpiModal(st);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Show UPI QR</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: DEFAULTERS OUTREACH / BULK REMINDERS */}
      {defaultersModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-scaleIn max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-rose-50 rounded-xl text-rose-700 border border-rose-200">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Defaulters Outreach & WhatsApp Reminders
                  </h3>
                  <p className="text-xs text-slate-500">
                    {defaultersList.length} students with outstanding tuition balance
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDefaultersModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between py-2 text-xs">
              <span className="font-bold text-slate-600">
                Total Uncollected Balance:{' '}
                <strong className="text-rose-700 font-black">
                  ₹{defaultersList.reduce((sum, s) => sum + s.amountPending, 0).toLocaleString('en-IN')}
                </strong>
              </span>

              <button
                type="button"
                onClick={() => {
                  const summaryText = defaultersList
                    .map((s) => `${s.rollNumber} - ${s.name} (Grade ${s.classGrade || 'N/A'}): ₹${s.amountPending} pending [Ph: ${s.phone}]`)
                    .join('\n');
                  navigator.clipboard.writeText(summaryText);
                  setCopiedDefaulters(true);
                  setTimeout(() => setCopiedDefaulters(false), 2000);
                }}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs flex items-center space-x-1 cursor-pointer"
              >
                {copiedDefaulters ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedDefaulters ? 'Copied List!' : 'Copy Summary'}</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 border border-slate-200 rounded-2xl overflow-hidden mt-2">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">Roll #</th>
                    <th className="py-2.5 px-3">Student</th>
                    <th className="py-2.5 px-3">Grade</th>
                    <th className="py-2.5 px-3">Pending</th>
                    <th className="py-2.5 px-3 text-right">WhatsApp Reminder</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {defaultersList.map((st) => {
                    const cleanPhone = st.phone.replace(/\D/g, '').slice(-10);
                    const reminderMsg = `Dear Parent of ${st.name} (Roll: ${st.rollNumber}),\n\nThis is a friendly reminder from Pragathi AI Education. The pending tuition fee balance is ₹${st.amountPending.toLocaleString('en-IN')}.\n\nKindly clear via UPI to: ${DEFAULT_UPI_ID}.\n\nThank you!`;
                    const waLink = cleanPhone ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(reminderMsg)}` : null;

                    return (
                      <tr key={st.studentId} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono font-bold text-slate-900">{st.rollNumber}</td>
                        <td className="py-2 px-3 font-bold text-slate-900">{st.name}</td>
                        <td className="py-2 px-3 text-slate-500">Grade {st.classGrade || 'N/A'}</td>
                        <td className="py-2 px-3 font-black text-rose-700">₹{st.amountPending.toLocaleString('en-IN')}</td>
                        <td className="py-2 px-3 text-right">
                          {waLink ? (
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition shadow-2xs cursor-pointer"
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span>Remind</span>
                            </a>
                          ) : (
                            <span className="text-slate-400 text-[11px]">No phone</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 mt-3">
              <button
                type="button"
                onClick={() => setDefaultersModalOpen(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: CONCESSION / DISCOUNT MODAL */}
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
                  className="w-full text-xs font-bold px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white mb-2 cursor-pointer"
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

      {/* MODAL 6: OFFICIAL PRINTABLE RECEIPT WITH WHATSAPP SHARING */}
      {receiptModalOpen && activeReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-scaleIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 no-print">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Official Payment Receipt</span>
              <button
                onClick={() => setReceiptModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div id="payment-receipt" className="p-6 border-2 border-dashed border-slate-300 rounded-2xl bg-white space-y-4">
              {/* Header */}
              <div className="text-center pb-4 border-b border-slate-200">
                <img
                  src="/images/logo.png"
                  alt="PRAGATHI AI"
                  className="h-12 w-auto mx-auto object-contain mb-1"
                />
                <h2 className="text-lg font-black text-slate-900 tracking-tight">PRAGATHI AI EDUCATION</h2>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                  Official Fee Payment Receipt
                </p>
              </div>

              {/* Receipt Details Grid */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
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
              <div className="p-3.5 bg-teal-50/80 border border-teal-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-teal-800 uppercase">Amount Paid</span>
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
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                <span>Recorded By: {activeReceipt.recordedByName || 'Administration'}</span>
                <span className="font-bold text-emerald-700">✓ Verified Official</span>
              </div>
            </div>

            {/* Actions: Delete, Share WhatsApp, Print, Close */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-5 no-print">
              <button
                type="button"
                onClick={() => handleDeletePayment(activeReceipt)}
                className="w-full sm:w-auto px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition flex items-center justify-center space-x-1 cursor-pointer"
                title="Delete this payment transaction"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>

              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => handleShareReceiptWhatsApp(activeReceipt)}
                  className="flex-1 sm:flex-initial px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
                  title="Share Receipt on WhatsApp"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 sm:flex-initial px-3.5 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-slate-800 transition flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReceiptModalOpen(false)}
                  className="px-3.5 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 transition cursor-pointer"
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
