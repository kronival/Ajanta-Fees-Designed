import { Student, Payment, FeeStructure, User } from '../types';
import { INITIAL_STUDENTS, DEFAULT_FEES, INITIAL_PAYMENTS, MOCK_USERS, ACADEMIC_YEAR } from '../constants';

// --- CONFIGURATION ---
const USE_MOCK_DATA = true; // Set to FALSE to use Google Apps Script
const GOOGLE_SCRIPT_URL = "YOUR_DEPLOYED_WEB_APP_URL_HERE"; 
// ---------------------

// LocalStorage Keys
const LS_STUDENTS = 'sfm_students';
const LS_FEES = 'sfm_fees';
const LS_PAYMENTS = 'sfm_payments';

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  // --- USERS ---
  login: async (username: string, pass: string): Promise<User | null> => {
    await delay(500);
    const user = MOCK_USERS.find(u => u.username === username && u.password === pass);
    if (user) {
        const { password, ...safeUser } = user;
        return safeUser;
    }
    return null;
  },

  // --- STUDENTS ---
  getStudents: async (): Promise<Student[]> => {
    await delay(300);
    if (USE_MOCK_DATA) {
      const stored = localStorage.getItem(LS_STUDENTS);
      if (!stored) {
        localStorage.setItem(LS_STUDENTS, JSON.stringify(INITIAL_STUDENTS));
        return INITIAL_STUDENTS;
      }
      return JSON.parse(stored);
    } else {
      const res = await fetch(`${GOOGLE_SCRIPT_URL}?action=getStudents`);
      return await res.json();
    }
  },

  addStudent: async (student: Student): Promise<void> => {
    await delay(300);
    if (USE_MOCK_DATA) {
      const students = await api.getStudents();
      if (students.find(s => s.id === student.id)) throw new Error("Admission Number already exists");
      students.push(student);
      localStorage.setItem(LS_STUDENTS, JSON.stringify(students));
    } else {
       await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'addStudent', data: student })
      });
    }
  },

  updateStudent: async (student: Student): Promise<void> => {
    await delay(300);
    if (USE_MOCK_DATA) {
      const students = await api.getStudents();
      const index = students.findIndex(s => s.id === student.id);
      if (index !== -1) {
        students[index] = student;
        localStorage.setItem(LS_STUDENTS, JSON.stringify(students));
      }
    } else {
       await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'updateStudent', data: student })
      });
    }
  },

  deleteStudent: async (id: string): Promise<void> => {
    await delay(300);
    if (USE_MOCK_DATA) {
        const students = await api.getStudents();
        const filtered = students.filter(s => s.id !== id);
        localStorage.setItem(LS_STUDENTS, JSON.stringify(filtered));
    } else {
        await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'deleteStudent', data: { id } })
        });
    }
  },

  // --- FEES CONFIG ---
  getFeesConfig: async (): Promise<FeeStructure[]> => {
    await delay(200);
    if (USE_MOCK_DATA) {
      const stored = localStorage.getItem(LS_FEES);
      if (!stored) {
        localStorage.setItem(LS_FEES, JSON.stringify(DEFAULT_FEES));
        return DEFAULT_FEES;
      }
      return JSON.parse(stored);
    } else {
        const res = await fetch(`${GOOGLE_SCRIPT_URL}?action=getFees`);
        return await res.json();
    }
  },

  updateFeeConfig: async (config: FeeStructure): Promise<void> => {
     if (USE_MOCK_DATA) {
        const fees = await api.getFeesConfig();
        const idx = fees.findIndex(f => f.className === config.className);
        if (idx >= 0) fees[idx] = config;
        localStorage.setItem(LS_FEES, JSON.stringify(fees));
     }
  },

  // --- PAYMENTS ---
  getPayments: async (): Promise<Payment[]> => {
    await delay(300);
    if (USE_MOCK_DATA) {
      const stored = localStorage.getItem(LS_PAYMENTS);
      if (!stored) {
        localStorage.setItem(LS_PAYMENTS, JSON.stringify(INITIAL_PAYMENTS));
        return INITIAL_PAYMENTS;
      }
      return JSON.parse(stored);
    } else {
        const res = await fetch(`${GOOGLE_SCRIPT_URL}?action=getPayments`);
        return await res.json();
    }
  },

  recordPayment: async (payment: Payment, updatedStudent: Student): Promise<void> => {
    await delay(500);
    if (USE_MOCK_DATA) {
      // 1. Save Payment
      const payments = await api.getPayments();
      payments.push(payment);
      localStorage.setItem(LS_PAYMENTS, JSON.stringify(payments));

      // 2. Update Student Balance
      await api.updateStudent(updatedStudent);
    } else {
        // For real API, we send both or handle transaction on server
        await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ 
                action: 'recordPayment', 
                data: { payment, student: updatedStudent } 
            })
        });
    }
  }
};