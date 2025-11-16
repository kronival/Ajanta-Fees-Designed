export type UserRole = 'admin' | 'accountant' | 'teacher' | 'parent';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  password?: string; // Only used for mock auth check
}

export interface PendingFee {
  year: string;
  amount: number;
  description?: string; // e.g., "2023-24 Tuition Balance"
}

export interface Student {
  id: string; // Admission Number
  name: string;
  fatherName: string;
  motherName: string;
  dob: string;
  class: string; // Current academic session class
  previousPending: PendingFee[];
  currentYearFee: number;
  paidAmount: number; // Total paid for current year context
}

export interface FeeStructure {
  className: string;
  annualFee: number;
  components: { name: string; amount: number }[];
}

export interface PaymentAllocation {
  year: string;
  amount: number;
}

export interface Payment {
  id: string;
  studentId: string;
  studentName: string;
  studentClass: string;
  date: string;
  amount: number;
  mode: 'Cash' | 'UPI' | 'Cheque' | 'Card';
  allocations: PaymentAllocation[];
  recordedBy: {
    userId: string;
    userName: string;
  };
  receiptNo: string;
}

export interface Stats {
  totalStudents: number;
  totalOutstanding: number;
  collectedToday: number;
  collectedMonth: number;
}