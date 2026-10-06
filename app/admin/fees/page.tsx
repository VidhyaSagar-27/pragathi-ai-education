'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  CreditCard,
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
} from 'lucide-react';

interface StudentFeeItem {
  studentId: string;
  name: string;
  rollNumber: string;
  phone: string;
  schoolName: string;
  classGrade: string;
  photoUrl: string;
  totalFee: number;
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

  // Receipt Modal State
  const [receiptModalOpen, setReceiptModalOpen] = useState<boolean>(false);
  const [activeReceipt, setActiveReceipt] = useState<any>(null);

  // History Tab / View State
  const [activeTab, setActiveTab] = useState<'ROSTER' | 'TRANSACTIONS'>('ROSTER');
  const [allPayments, setAllPayments] = useState<PaymentRecord[]>([]);

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

  const collectionPercentage =
    summary && summary.totalExpected > 0
      ? Math.round((summary.totalCollected / summary.totalExpected) * 100)
      : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2 text-teal-600 font-bold text-xs uppercase tracking-wider">
            <CreditCard className="w-4 h-4" />
            <span>Financial Operations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Student Fees & Payment Management
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Auto-calculated fee tracking, multi-channel payment entries, and instant official receipts
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200/80 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('ROSTER')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'ROSTER'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Student Fee Roster
          </button>
          <button
            onClick={() => setActiveTab('TRANSACTIONS')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'TRANSACTIONS'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Payment Transactions ({allPayments.length})
          </button>
        </div>
      </div>

      {/* Aggregate Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Enrolled</span>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            {summary?.totalStudents || 0}
          </p>
          <span className="text-[11px] text-slate-400 font-medium">Students</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Expected Fees</span>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            ₹{(summary?.totalExpected || 0).toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-slate-400 font-medium">Standard ₹1,350/student</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-white to-emerald-50/30 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Total Collected</span>
          <p className="text-2xl sm:text-3xl font-black text-emerald-700 mt-1">
            ₹{(summary?.totalCollected || 0).toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-emerald-600 font-bold">
            {collectionPercentage}% Collection Rate
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rose-200/70 bg-gradient-to-br from-white to-rose-50/30 shadow-xs">
          <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Pending Balance</span>
          <p className="text-2xl sm:text-3xl font-black text-rose-700 mt-1">
            ₹{(summary?.totalPending || 0).toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-rose-600 font-semibold">
            {summary?.pendingCount || 0} students pending
          </span>
        </div>
      </div>

      {activeTab === 'ROSTER' ? (
        /* Roster Table Card */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Search & Filter Toolbar */}
          <div className="p-4 border-b border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search student or roll number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              />
            </div>

            <div className="flex items-center space-x-1.5 self-end sm:self-auto">
              <span className="text-xs text-slate-500 font-medium">Filter:</span>
              {(['ALL', 'PAID', 'PARTIALLY_PAID', 'PENDING'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    statusFilter === st
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {st === 'ALL'
                    ? 'All'
                    : st === 'PAID'
                    ? 'Paid'
                    : st === 'PARTIALLY_PAID'
                    ? 'Partial'
                    : 'Pending'}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center">
              <div className="inline-block w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-sm font-semibold text-slate-500">Loading fee records...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-sm">
              No students found matching your filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Roll Number</th>
                    <th className="py-3 px-4">Total Fee</th>
                    <th className="py-3 px-4">Paid</th>
                    <th className="py-3 px-4">Pending</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Last Payment</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredStudents.map((st) => (
                    <tr key={st.studentId} className="hover:bg-slate-50/80 transition">
                      {/* Student Info */}
                      <td className="py-3.5 px-4">
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
                            <p className="font-bold text-slate-900 leading-tight">{st.name}</p>
                            <p className="text-[11px] text-slate-500">{st.phone || 'No phone'}</p>
                          </div>
                        </div>
                      </td>

                      {/* Roll Number */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-xs font-black px-2.5 py-1 bg-slate-100 text-slate-800 rounded-md border border-slate-200">
                          {st.rollNumber}
                        </span>
                      </td>

                      {/* Total Fee */}
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        ₹{st.totalFee.toLocaleString('en-IN')}
                      </td>

                      {/* Paid */}
                      <td className="py-3.5 px-4 font-bold text-emerald-700">
                        ₹{st.amountPaid.toLocaleString('en-IN')}
                      </td>

                      {/* Pending */}
                      <td className="py-3.5 px-4 font-bold text-rose-700">
                        ₹{st.amountPending.toLocaleString('en-IN')}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4">
                        {st.status === 'PAID' ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>PAID</span>
                          </span>
                        ) : st.status === 'PARTIALLY_PAID' ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>PARTIAL</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <AlertCircle className="w-3 h-3 text-rose-600" />
                            <span>PENDING</span>
                          </span>
                        )}
                      </td>

                      {/* Last Payment Date */}
                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        {st.lastPaymentDate ? (
                          <div>
                            <span className="font-medium text-slate-700">
                              {new Date(st.lastPaymentDate).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                            {st.lastPaymentMethod && (
                              <p className="text-[10px] text-slate-400 uppercase font-bold">
                                {st.lastPaymentMethod}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">None</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => openRecordModal(st)}
                          className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shadow-2xs transition flex items-center space-x-1 ml-auto"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Record Payment</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Transactions History Card */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">All Payment Transactions History</h3>
              <p className="text-xs text-slate-500">Official audit trail with unique receipts</p>
            </div>
            <span className="text-xs font-bold text-slate-500">{allPayments.length} Total Payments</span>
          </div>

          {allPayments.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-sm">
              No payments recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Receipt / ID</th>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Roll Number</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">Reference</th>
                    <th className="py-3 px-4">Recorded By</th>
                    <th className="py-3 px-4 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {allPayments.map((p) => (
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
                        <button
                          type="button"
                          onClick={() => {
                            setActiveReceipt(p);
                            setReceiptModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center space-x-1 ml-auto"
                        >
                          <Receipt className="w-3.5 h-3.5 text-teal-600" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                  <h3 className="text-lg font-black text-slate-900">Record Fee Payment</h3>
                  <p className="text-xs text-slate-500">Official fee collection entry</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRecordModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="mt-5 space-y-4">
              {/* Student Info Card */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs font-black text-teal-800 bg-teal-100/60 px-2 py-0.5 rounded">
                    {selectedStudent.rollNumber}
                  </span>
                  <p className="font-bold text-slate-900 text-sm mt-1">{selectedStudent.name}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Current Pending</span>
                  <p className="text-base font-black text-rose-700">
                    ₹{selectedStudent.amountPending.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              {/* Amount to pay */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Payment Amount (₹) *
                </label>
                <div className="relative">
                  <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm font-bold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                    placeholder="Enter amount in ₹"
                  />
                </div>
              </div>

              {/* Date & Method Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Payment Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Method *
                  </label>
                  <select
                    value={payMethod}
                    onChange={(e: any) => setPayMethod(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  >
                    <option value="UPI">UPI / GPay / PhonePe</option>
                    <option value="CASH">Cash in Hand</option>
                    <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              {/* Transaction ID */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Transaction / UTR Reference (Optional)
                </label>
                <input
                  type="text"
                  value={payTransactionId}
                  onChange={(e) => setPayTransactionId(e.target.value)}
                  placeholder="e.g. UPI Ref 342129849204"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Payment Notes (Optional)
                </label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="e.g. Paid in full for Foundation Batch"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>

              {/* Live Preview Bar */}
              <div className="p-3 bg-emerald-50/60 border border-emerald-200/70 rounded-xl text-xs flex items-center justify-between text-emerald-900 font-semibold">
                <span>New Balance:</span>
                <span>
                  Pending: ₹
                  {Math.max(
                    0,
                    selectedStudent.amountPending - (Number(payAmount) || 0)
                  ).toLocaleString('en-IN')}
                </span>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRecordModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-xs transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Recording...' : 'Confirm & Generate Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Printable Receipt Modal */}
      {receiptModalOpen && activeReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-8 shadow-2xl border border-slate-200 animate-scaleIn">
            <div className="flex justify-end no-print mb-2">
              <button
                type="button"
                onClick={() => setReceiptModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Receipt Paper */}
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
              <span className="text-xs text-slate-400">Save or print for records</span>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-slate-800 transition flex items-center space-x-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReceiptModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 transition"
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
