import { Student, FeeStructure, User, Payment } from './types';

export const ACADEMIC_YEAR = '2025-26';

export const CLASSES = ['LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

export const DEFAULT_FEES: FeeStructure[] = CLASSES.map(c => ({
  className: c,
  annualFee: c === 'LKG' || c === 'UKG' ? 15000 : c === '10' ? 25000 : 20000,
  components: [
    { name: 'Tuition', amount: 10000 },
    { name: 'Activity', amount: 2000 },
    { name: 'Development', amount: 3000 }
  ]
}));

export const MOCK_USERS: User[] = [
  { id: 'u1', username: 'admin', name: 'Principal Skinner', role: 'admin', password: 'admin' },
  { id: 'u2', username: 'acct', name: 'Angela Martin', role: 'accountant', password: 'acct' },
  { id: 'u3', username: 'teacher', name: 'Edna Krabappel', role: 'teacher', password: 'teach' },
  { id: 'u4', username: 'parent', name: 'Homer Simpson', role: 'parent', password: 'pass' },
];

export const INITIAL_STUDENTS: Student[] = [
  {
    id: 'ADM001',
    name: 'Bart Simpson',
    fatherName: 'Homer Simpson',
    motherName: 'Marge Simpson',
    dob: '2015-04-01',
    class: '4',
    previousPending: [
      { year: '2023-24', amount: 2000 },
      { year: '2024-25', amount: 0 }
    ],
    currentYearFee: 20000,
    paidAmount: 5000,
  },
  {
    id: 'ADM002',
    name: 'Lisa Simpson',
    fatherName: 'Homer Simpson',
    motherName: 'Marge Simpson',
    dob: '2017-05-12',
    class: '2',
    previousPending: [],
    currentYearFee: 20000,
    paidAmount: 20000, // Fully paid
  },
  {
    id: 'ADM003',
    name: 'Milhouse Van Houten',
    fatherName: 'Kirk',
    motherName: 'Luann',
    dob: '2015-06-01',
    class: '4',
    previousPending: [
       { year: '2024-25', amount: 5000 }
    ],
    currentYearFee: 20000,
    paidAmount: 0,
  }
];

export const INITIAL_PAYMENTS: Payment[] = [
  {
    id: 'PAY-1001',
    studentId: 'ADM001',
    studentName: 'Bart Simpson',
    studentClass: '4',
    date: new Date().toISOString().split('T')[0],
    amount: 5000,
    mode: 'Cash',
    allocations: [{ year: '2025-26', amount: 5000 }],
    recordedBy: { userId: 'u2', userName: 'Angela Martin' },
    receiptNo: 'REC-001'
  }
];