import { Student, Payment, FeeStructure, User } from '../types';
import { INITIAL_STUDENTS, DEFAULT_FEES, INITIAL_PAYMENTS, MOCK_USERS, ACADEMIC_YEAR } from '../constants';

// --- CONFIGURATION ---
const USE_MOCK_DATA = true; // Set to FALSE to use Google Apps Script
const GOOGLE_SCRIPT_URL = "YOUR_DEPLOYED_WEB_APP_URL_HERE"; 
const SIMULATE_ERRORS = true; // Toggle simulated backend errors
const ERROR_RATE = 0.15; // 15% chance of failure
// ---------------------

// LocalStorage Keys
const LS_STUDENTS = 'sfm_students';
const LS_FEES = 'sfm_fees';
const LS_PAYMENTS = 'sfm_payments';
const LS_USERS = 'sfm_users';

// Helper to simulate network delay and errors
const simulateNetwork = async (ms: number) => {
  await new Promise(resolve => setTimeout(resolve, ms));
  if (SIMULATE_ERRORS && Math.random() < ERROR_RATE) {
    throw new Error("Network Error: Failed to connect to server (Simulated)");
  }
};

const getLocalUsers = (): User[] => {
  const stored = localStorage.getItem(LS_USERS);
  if (stored) return JSON.parse(stored);
  localStorage.setItem(LS_USERS, JSON.stringify(MOCK_USERS));
  return MOCK_USERS;
};

export const api = {
  // --- USERS ---
  login: async (username: string, pass: string): Promise<User | null> => {
    await simulateNetwork(500);
    const users = getLocalUsers();
    const user = users.find(u => u.username === username && u.password === pass);
    if (user) {
        const { password, ...safeUser } = user;
        return safeUser;
    }
    return null;
  },

  getUsers: async (): Promise<User[]> => {
    await simulateNetwork(300);
    return getLocalUsers();
  },

  saveUser: async (user: User): Promise<void> => {
    await simulateNetwork(300);
    const users = getLocalUsers();
    
    if (user.id) {
        // Update
        const index = users.findIndex(u => u.id === user.id);
        if (index !== -1) {
            // If password is provided, update it, else keep old
            const existing = users[index];
            users[index] = { ...existing, ...user, password: user.password || existing.password };
        }
    } else {
        // Create
        if (users.find(u => u.username === user.username)) {
            throw new Error("Username already exists");
        }
        user.id = 'u_' + Date.now();
        users.push(user);
    }
    localStorage.setItem(LS_USERS, JSON.stringify(users));
  },

  deleteUser: async (id: string): Promise<void> => {
      await simulateNetwork(300);
      const users = getLocalUsers();
      const filtered = users.filter(u => u.id !== id);
      if (filtered.length === users.length) return; // No change
      localStorage.setItem(LS_USERS, JSON.stringify(filtered));
  },

  // --- STUDENTS ---
  getStudents: async (): Promise<Student[]> => {
    await simulateNetwork(300);
    if (USE_MOCK_DATA) {
      const stored = localStorage.getItem(LS_STUDENTS);
      if (!stored) {
        localStorage.setItem(LS_STUDENTS, JSON.stringify(INITIAL_STUDENTS));
        return INITIAL_STUDENTS;
      }
      return JSON.parse(stored);
    } else {
      const res = await fetch(`${GOOGLE_SCRIPT_URL}?action=getStudents`);
      if (!res.ok) throw new Error(`Server error: ${res.statusText}`);
      return await res.json();
    }
  },

  addStudent: async (student: Student): Promise<void> => {
    await simulateNetwork(300);
    if (USE_MOCK_DATA) {
      const students = await api.getStudents();
      if (students.find(s => s.id === student.id)) throw new Error("Admission Number already exists");
      students.push(student);
      localStorage.setItem(LS_STUDENTS, JSON.stringify(students));
    } else {
       const res = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'addStudent', data: student })
      });
      if (!res.ok) throw new Error("Failed to add student");
    }
  },

  updateStudent: async (student: Student): Promise<void> => {
    await simulateNetwork(300);
    if (USE_MOCK_DATA) {
      const students = await api.getStudents();
      const index = students.findIndex(s => s.id === student.id);
      if (index !== -1) {
        students[index] = student;
        localStorage.setItem(LS_STUDENTS, JSON.stringify(students));
      }
    } else {
       const res = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'updateStudent', data: student })
      });
      if (!res.ok) throw new Error("Failed to update student");
    }
  },

  deleteStudent: async (id: string): Promise<void> => {
    await simulateNetwork(300);
    if (USE_MOCK_DATA) {
        const students = await api.getStudents();
        const filtered = students.filter(s => s.id !== id);
        localStorage.setItem(LS_STUDENTS, JSON.stringify(filtered));
    } else {
        const res = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'deleteStudent', data: { id } })
        });
        if (!res.ok) throw new Error("Failed to delete student");
    }
  },

  // --- FEES CONFIG ---
  getFeesConfig: async (): Promise<FeeStructure[]> => {
    await simulateNetwork(200);
    if (USE_MOCK_DATA) {
      const stored = localStorage.getItem(LS_FEES);
      if (!stored) {
        localStorage.setItem(LS_FEES, JSON.stringify(DEFAULT_FEES));
        return DEFAULT_FEES;
      }
      return JSON.parse(stored);
    } else {
        const res = await fetch(`${GOOGLE_SCRIPT_URL}?action=getFees`);
        if (!res.ok) throw new Error("Failed to fetch fees");
        return await res.json();
    }
  },

  updateFeeConfig: async (config: FeeStructure): Promise<void> => {
     await simulateNetwork(200);
     if (USE_MOCK_DATA) {
        const fees = await api.getFeesConfig();
        const idx = fees.findIndex(f => f.className === config.className);
        if (idx >= 0) fees[idx] = config;
        localStorage.setItem(LS_FEES, JSON.stringify(fees));
     }
  },

  // --- PAYMENTS ---
  getPayments: async (): Promise<Payment[]> => {
    await simulateNetwork(300);
    if (USE_MOCK_DATA) {
      const stored = localStorage.getItem(LS_PAYMENTS);
      if (!stored) {
        localStorage.setItem(LS_PAYMENTS, JSON.stringify(INITIAL_PAYMENTS));
        return INITIAL_PAYMENTS;
      }
      return JSON.parse(stored);
    } else {
        const res = await fetch(`${GOOGLE_SCRIPT_URL}?action=getPayments`);
        if (!res.ok) throw new Error("Failed to fetch payments");
        return await res.json();
    }
  },

  recordPayment: async (payment: Payment, updatedStudent: Student): Promise<void> => {
    await simulateNetwork(500);
    if (USE_MOCK_DATA) {
      // 1. Save Payment
      const payments = await api.getPayments();
      payments.push(payment);
      localStorage.setItem(LS_PAYMENTS, JSON.stringify(payments));

      // 2. Update Student Balance
      await api.updateStudent(updatedStudent);
    } else {
        // For real API, we send both or handle transaction on server
        const res = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ 
                action: 'recordPayment', 
                data: { payment, student: updatedStudent } 
            })
        });
        if (!res.ok) throw new Error("Failed to record payment");
    }
  }
};