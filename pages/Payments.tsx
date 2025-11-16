import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Student, Payment, PaymentAllocation } from '../types';
import { ACADEMIC_YEAR, CLASSES } from '../constants';
import { useAuth } from '../components/AuthContext';

interface PaymentsProps {
  initialStudentId?: string | null;
}

export const Payments: React.FC<PaymentsProps> = ({ initialStudentId }) => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [allPayments, setAllPayments] = useState<Payment[]>([]);
  
  // View State
  const [viewMode, setViewMode] = useState<'search' | 'profile' | 'payment'>('search');
  
  // Selection State
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  // New Search/Selection State
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');

  // Payment Form State
  const [amount, setAmount] = useState<string>('');
  const [mode, setMode] = useState<Payment['mode']>('Cash');
  const [allocations, setAllocations] = useState<Record<string, number>>({});
  const [isAutoAllocate, setIsAutoAllocate] = useState(true);
  
  // UI State
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<Payment | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (initialStudentId && students.length > 0) {
      const s = students.find(st => st.id === initialStudentId);
      if (s) {
        setSelectedStudentId(s.id);
        setSelectedClass(s.class);
        setSelectedStudent(s);
        setViewMode('profile');
      }
    }
  }, [initialStudentId, students]);

  const loadData = async () => {
    const [sData, pData] = await Promise.all([api.getStudents(), api.getPayments()]);
    setStudents(sData);
    setAllPayments(pData);
  };

  const filteredStudentsForDropdown = students
    .filter(s => !selectedClass || s.class === selectedClass)
    .sort((a, b) => a.name.localeCompare(b.name));

  // --- Data Helpers ---
  const getDues = (s: Student) => {
    const prev = s.previousPending.map(p => ({ year: p.year, amount: p.amount }));
    const curr = { year: ACADEMIC_YEAR, amount: s.currentYearFee - s.paidAmount };
    return [...prev, curr].filter(d => d.amount > 0);
  };

  const dues = selectedStudent ? getDues(selectedStudent) : [];
  const totalPrevDues = selectedStudent ? selectedStudent.previousPending.reduce((sum, p) => sum + p.amount, 0) : 0;
  const currentYearDue = selectedStudent ? selectedStudent.currentYearFee - selectedStudent.paidAmount : 0;
  const totalOutstanding = totalPrevDues + currentYearDue;

  // Student History
  const studentHistory = selectedStudent 
    ? allPayments.filter(p => p.studentId === selectedStudent.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  const handleBack = () => {
    if (viewMode === 'payment') {
      setViewMode('profile');
    } else if (viewMode === 'profile') {
      setSelectedStudent(null);
      setSelectedStudentId(''); // Clear selection when going back to search
      setViewMode('search');
    }
  };

  // --- Payment Logic ---
  useEffect(() => {
    if (isAutoAllocate && selectedStudent && viewMode === 'payment') {
      const amt = Number(amount);
      if (amt > 0) {
        let remaining = amt;
        const newAlloc: Record<string, number> = {};
        dues.forEach(d => {
          if (remaining <= 0) return;
          const pay = Math.min(remaining, d.amount);
          newAlloc[d.year] = pay;
          remaining -= pay;
        });
        setAllocations(newAlloc);
      } else {
        setAllocations({});
      }
    }
  }, [amount, isAutoAllocate, selectedStudent, viewMode]);

  const handlePayment = async () => {
    if (!selectedStudent || Number(amount) <= 0) return;
    
    const allocatedSum = Object.values(allocations).reduce((a: number, b: number) => a + b, 0);
    if (!isAutoAllocate && allocatedSum !== Number(amount)) {
      alert(`Allocation (${allocatedSum}) must match Amount (${amount})`);
      return;
    }

    const finalAllocations: PaymentAllocation[] = Object.entries(allocations).map(([year, amt]) => ({ 
      year, amount: Number(amt) 
    }));

    // Update Logic
    const updatedStudent = { ...selectedStudent };
    updatedStudent.previousPending = updatedStudent.previousPending.map(p => {
      const alloc = finalAllocations.find(a => a.year === p.year);
      return alloc ? { ...p, amount: p.amount - alloc.amount } : p;
    });

    const currAlloc = finalAllocations.find(a => a.year === ACADEMIC_YEAR);
    if (currAlloc) updatedStudent.paidAmount += currAlloc.amount;

    const payment: Payment = {
      id: `PAY-${Date.now()}`,
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      studentClass: selectedStudent.class,
      date: new Date().toISOString().split('T')[0],
      amount: Number(amount),
      mode: mode,
      allocations: finalAllocations,
      recordedBy: { userId: user!.id, userName: user!.name },
      receiptNo: `REC-${Math.floor(1000 + Math.random() * 9000)}`
    };

    try {
      await api.recordPayment(payment, updatedStudent);
      setLastReceipt(payment);
      setShowSuccess(true);
      await loadData(); 
      setSelectedStudent(updatedStudent);
      setAmount('');
      setAllocations({});
      // Don't change view mode, let success modal handle next step
    } catch (e) {
      alert("Failed to record payment");
    }
  };

  // --- RENDERERS ---

  if (viewMode === 'search' || !selectedStudent) {
    return (
      <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark group/design-root overflow-x-hidden font-display">
        {/* Top App Bar */}
        <div className="flex items-center justify-between bg-white dark:bg-background-dark p-4 shadow-sm">
          <div className="flex size-12 shrink-0 items-center justify-start text-zinc-900 dark:text-zinc-50">
            <span className="material-symbols-outlined text-2xl opacity-50">arrow_back</span>
          </div>
          <h1 className="flex-1 text-lg font-bold text-zinc-900 dark:text-zinc-50 text-center">Student Fee Payment</h1>
          <div className="flex size-12 items-center justify-end">
            <button className="h-12 min-w-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-transparent p-0 text-zinc-900 dark:text-zinc-50">
              <span className="material-symbols-outlined text-2xl">support_agent</span>
            </button>
          </div>
        </div>

        <main className="flex-1 flex flex-col p-4">
          {/* Body Text */}
          <p className="text-zinc-700 dark:text-zinc-300 text-base font-normal leading-normal pb-4 pt-1">
            Please select a class and then find the student to proceed with the fee payment.
          </p>

          {/* Form Fields */}
          <div className="space-y-6">
            {/* Select Class Dropdown */}
            <label className="flex flex-col w-full">
              <p className="text-zinc-900 dark:text-zinc-50 text-base font-medium leading-normal pb-2">Select Class</p>
              <select 
                className="form-select flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-zinc-900 dark:text-zinc-200 focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:border-primary dark:focus:border-primary h-14 placeholder:text-zinc-500 p-[15px] text-base font-normal leading-normal appearance-none"
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setSelectedStudentId('');
                }}
              >
                <option disabled value="">Choose a class (e.g., 5th)</option>
                {CLASSES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>

            {/* Find Student Dropdown */}
            <label className="flex flex-col w-full">
              <p className="text-zinc-400 dark:text-zinc-500 text-base font-medium leading-normal pb-2">Find Student</p>
              <select 
                className={`form-select flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700 h-14 p-[15px] text-base font-normal leading-normal appearance-none ${
                  selectedClass 
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-200 focus:border-primary dark:focus:border-primary focus:ring-2 focus:ring-primary/50' 
                    : 'bg-zinc-100 dark:bg-zinc-800/50 text-zinc-400 dark:text-zinc-500 cursor-not-allowed'
                }`}
                disabled={!selectedClass}
                value={selectedStudentId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedStudentId(val);
                  if (val) {
                    const s = students.find(st => st.id === val);
                    if (s) {
                      setSelectedStudent(s);
                      setViewMode('profile');
                    }
                  }
                }}
              >
                <option value="">Search by Name or Admission No.</option>
                {filteredStudentsForDropdown.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
                ))}
              </select>
            </label>
          </div>
        </main>
        
        {/* Footer Removed */}
      </div>
    );
  }

  if (viewMode === 'profile' && selectedStudent) {
    return (
      <div className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden antialiased font-display pb-20">
        {/* Top App Bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between bg-background-light dark:bg-background-dark p-4 shadow-sm">
          <button onClick={handleBack} className="text-text-main dark:text-white flex size-12 shrink-0 -ml-3 items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h2 className="text-text-main dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">Student Profile</h2>
          <div className="w-9 h-9"></div> 
        </div>

        <div className="p-4 space-y-6">
          {/* Profile Header */}
          <div className="flex p-6 @container bg-white dark:bg-gray-900 rounded-xl shadow-sm">
            <div className="flex w-full flex-col gap-4 @[520px]:flex-row @[520px]:justify-between @[520px]:items-center">
              <div className="flex items-center gap-4">
                <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-20 w-20 shrink-0 bg-primary/10 text-primary flex items-center justify-center text-3xl font-bold">
                  {selectedStudent.name.charAt(0)}
                </div>
                <div className="flex flex-col justify-center">
                  <p className="text-text-main dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em]">{selectedStudent.name}</p>
                  <p className="text-text-secondary dark:text-gray-400 text-base font-normal leading-normal">Class {selectedStudent.class}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Personal Details Card */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm">
            <h3 className="text-text-main dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] px-6 pb-2 pt-5">Personal Details</h3>
            <div className="p-6 pt-4 grid grid-cols-1">
              <div className="flex items-center gap-4 border-t border-t-border-color dark:border-t-gray-800 py-4">
                <span className="material-symbols-outlined text-primary">person</span>
                <p className="text-text-secondary dark:text-gray-400 text-sm font-normal leading-normal w-1/3">Father's Name</p>
                <p className="text-text-main dark:text-white text-sm font-semibold leading-normal text-right flex-1">{selectedStudent.fatherName}</p>
              </div>
              <div className="flex items-center gap-4 border-t border-t-border-color dark:border-t-gray-800 py-4">
                <span className="material-symbols-outlined text-primary">person</span>
                <p className="text-text-secondary dark:text-gray-400 text-sm font-normal leading-normal w-1/3">Mother's Name</p>
                <p className="text-text-main dark:text-white text-sm font-semibold leading-normal text-right flex-1">{selectedStudent.motherName}</p>
              </div>
              <div className="flex items-center gap-4 border-t border-t-border-color dark:border-t-gray-800 py-4">
                <span className="material-symbols-outlined text-primary">cake</span>
                <p className="text-text-secondary dark:text-gray-400 text-sm font-normal leading-normal w-1/3">Date of Birth</p>
                <p className="text-text-main dark:text-white text-sm font-semibold leading-normal text-right flex-1">
                    {new Date(selectedStudent.dob).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <div className="flex items-center gap-4 border-t border-t-border-color dark:border-t-gray-800 py-4">
                <span className="material-symbols-outlined text-primary">badge</span>
                <p className="text-text-secondary dark:text-gray-400 text-sm font-normal leading-normal w-1/3">Admission No.</p>
                <p className="text-text-main dark:text-white text-sm font-semibold leading-normal text-right flex-1">{selectedStudent.id}</p>
              </div>
            </div>
          </div>

          {/* Fee Status Card */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6">
            <h3 className="text-text-main dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] pb-4">Fee Status</h3>
            <div className={`border-l-4 p-4 rounded-lg flex justify-between items-center ${
                totalOutstanding > 0 
                    ? 'bg-status-red/10 border-status-red' 
                    : 'bg-status-green/10 border-status-green'
            }`}>
              <div>
                <p className={`text-sm font-semibold uppercase tracking-wider ${totalOutstanding > 0 ? 'text-status-red' : 'text-status-green'}`}>
                    {totalOutstanding > 0 ? 'Fees Due' : 'All Clear'}
                </p>
                <p className="text-text-main dark:text-white text-2xl font-bold mt-1">₹ {totalOutstanding.toLocaleString()}</p>
                <p className="text-text-secondary dark:text-gray-400 text-sm mt-1">
                    {totalOutstanding > 0 ? 'Due immediately' : 'No pending dues'}
                </p>
              </div>
              <div className={`text-white rounded-full flex items-center justify-center size-12 ${totalOutstanding > 0 ? 'bg-status-red' : 'bg-status-green'}`}>
                <span className="material-symbols-outlined text-3xl">
                    {totalOutstanding > 0 ? 'priority_high' : 'check'}
                </span>
              </div>
            </div>
          </div>

          {/* Payment History Section */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm">
            <h3 className="text-text-main dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] px-6 pb-2 pt-5">Payment History</h3>
            <div className="p-6 pt-4 space-y-4">
                {studentHistory.map(payment => (
                    <div key={payment.id} className="flex items-center justify-between border-t border-t-border-color dark:border-t-gray-800 py-4">
                        <div className="flex items-center gap-4">
                            <div className="bg-status-green/10 text-status-green rounded-full p-2">
                                <span className="material-symbols-outlined">check_circle</span>
                            </div>
                            <div>
                                <p className="text-text-main dark:text-white font-semibold">₹ {payment.amount.toLocaleString()}</p>
                                <p className="text-text-secondary dark:text-gray-400 text-sm">{payment.date}</p>
                            </div>
                        </div>
                        <p className="text-sm text-text-secondary dark:text-gray-400">Receipt: #{payment.receiptNo}</p>
                    </div>
                ))}
                {studentHistory.length === 0 && (
                    <div className="text-center text-text-secondary py-4">No payment history found.</div>
                )}
            </div>
          </div>
        </div>

        {/* Conditional Action Button */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-900 p-4 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] dark:shadow-[0_-2px_10px_rgba(0,0,0,0.2)] md:static md:shadow-none md:bg-transparent">
          <button 
            onClick={() => setViewMode('payment')}
            className="w-full bg-primary text-white font-bold py-3 px-4 rounded-lg text-lg flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
          >
            <span className="material-symbols-outlined">credit_card</span>
            Pay Fees
          </button>
        </div>
      </div>
    );
  }

  // --- VIEW: PAYMENT FORM ---
  return (
    <div className="relative flex flex-col w-full bg-background-light dark:bg-background-dark group/design-root overflow-x-hidden min-h-[calc(100vh-2rem)] rounded-xl overflow-hidden shadow-sm border border-border-color font-display">
      {/* Top App Bar */}
      <header className="sticky top-0 z-10 flex items-center bg-white dark:bg-background-dark/80 dark:backdrop-blur-sm p-4 pb-2 justify-between border-b border-border-color">
        <button onClick={handleBack} className="flex size-12 shrink-0 items-center justify-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
          <span className="material-symbols-outlined text-text-main dark:text-white">arrow_back</span>
        </button>
        <h2 className="text-text-main dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">Enter Payment</h2>
        <div className="w-12"></div>
      </header>

      <main className="flex-1 pb-28 bg-white dark:bg-background-dark">
        {/* Stats */}
        <div className="flex flex-wrap gap-4 p-4 bg-white dark:bg-background-dark">
          <div className="flex w-full flex-col gap-2 rounded-xl p-4 border border-primary/50 bg-primary/10 dark:border-primary/50 dark:bg-primary/20">
            <p className="text-primary dark:text-blue-300 text-base font-medium leading-normal">Total Outstanding</p>
            <p className="text-primary dark:text-blue-300 tracking-light text-3xl font-bold leading-tight">₹{totalOutstanding.toLocaleString()}</p>
          </div>
        </div>

        {/* Payment Entry Form Section */}
        <div className="mt-2 bg-white dark:bg-background-dark">
          <h3 className="text-text-main dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">New Payment Details</h3>
          
          {/* Amount Input */}
          <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
            <label className="flex flex-col min-w-40 flex-1">
              <p className="text-text-main dark:text-gray-300 text-base font-medium leading-normal pb-2">Amount</p>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-text-secondary dark:text-gray-400 text-base">₹</span>
                <input 
                  autoFocus
                  className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-main dark:text-white focus:outline-0 focus:ring-0 border border-border-color dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-primary h-14 placeholder:text-text-secondary pl-8 p-[15px] text-base font-normal leading-normal transition-colors" 
                  placeholder="Enter Amount to Pay" 
                  type="number" 
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                />
              </div>
            </label>
          </div>

          {/* Payment Mode */}
          <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
            <label className="flex flex-col min-w-40 flex-1">
              <p className="text-text-main dark:text-gray-300 text-base font-medium leading-normal pb-2">Payment Mode</p>
              <select 
                className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-main dark:text-white focus:outline-0 focus:ring-0 border border-border-color dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-primary h-14 placeholder:text-text-secondary p-[15px] text-base font-normal leading-normal transition-colors"
                value={mode}
                onChange={e => setMode(e.target.value as any)}
              >
                <option>Cash</option>
                <option>UPI</option>
                <option>Card</option>
                <option>Cheque</option>
              </select>
            </label>
          </div>

          {/* Allocation Section */}
          <div className="px-4 py-3">
            <div className="flex justify-between items-center py-2">
              <p className="text-text-main dark:text-gray-300 text-base font-medium leading-normal">Allocate Payment</p>
              <div className="flex items-center gap-2">
                <span className="text-text-secondary dark:text-gray-400 text-sm">Auto-Apply</span>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input 
                    checked={isAutoAllocate} 
                    onChange={e => setIsAutoAllocate(e.target.checked)}
                    className="peer sr-only" 
                    type="checkbox" 
                  />
                  <div className="peer h-6 w-11 rounded-full bg-gray-200 dark:bg-gray-700 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 dark:after:border-gray-600 after:bg-white after:transition-all peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                </label>
              </div>
            </div>
            
            <div className="mt-4 space-y-4">
              {dues.map(d => (
                <div key={d.year} className="flex items-center gap-3">
                  <input 
                    checked={allocations[d.year] > 0} 
                    disabled={true}
                    className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary disabled:opacity-50" 
                    type="checkbox"
                  />
                  <label className="flex-1 text-text-main dark:text-gray-300">
                    {d.year} {d.year === ACADEMIC_YEAR ? '(Current)' : '(Previous)'}
                  </label>
                  <input 
                    className="w-28 rounded-lg border-border-color dark:border-gray-700 bg-background-light dark:bg-gray-700 text-right text-text-secondary dark:text-gray-300 p-2" 
                    disabled={isAutoAllocate} 
                    type="number" 
                    value={allocations[d.year] || 0}
                    onChange={e => setAllocations({...allocations, [d.year]: Number(e.target.value)})}
                  />
                </div>
              ))}
              {dues.length === 0 && <p className="text-sm text-green-600">No pending dues to allocate.</p>}
            </div>
          </div>
        </div>
      </main>

      {/* Sticky Footer CTA */}
      <footer className="fixed bottom-0 left-0 right-0 z-10 bg-white dark:bg-background-dark p-4 border-t border-border-color dark:border-gray-800 md:absolute md:w-full">
        <button 
            onClick={handlePayment}
            disabled={Number(amount) <= 0 || (!isAutoAllocate && Object.values(allocations).reduce((a: number, b: number) => a + b, 0) !== Number(amount))}
            className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-14 bg-primary text-white gap-2 text-base font-bold leading-normal tracking-[0.015em] px-6 disabled:bg-gray-300 disabled:cursor-not-allowed dark:disabled:bg-gray-700 transition-colors hover:bg-primary-dark"
        >
          Generate Receipt
        </button>
      </footer>

      {/* Success Toast/Modal */}
      {showSuccess && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm text-center shadow-2xl">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="material-symbols-outlined text-3xl">check_circle</span>
                  </div>
                  <h3 className="text-xl font-bold text-text-main dark:text-white mb-2">Payment Successful</h3>
                  <p className="text-text-secondary mb-6">Receipt #{lastReceipt?.receiptNo} generated successfully.</p>
                  <button onClick={() => { setShowSuccess(false); setViewMode('profile'); }} className="w-full py-3 bg-primary text-white rounded-lg font-bold">
                      Back to Profile
                  </button>
              </div>
          </div>
      )}
    </div>
  );
};