import { Student, Payment, FeeStructure, User } from '../types';
import { DEFAULT_FEES, MOCK_USERS, INITIAL_STUDENTS, INITIAL_PAYMENTS } from '../constants';

// --- MOCK BACKEND UTILS ---

const STORAGE_KEYS = {
  USERS: 'sfm_users',
  STUDENTS: 'sfm_students',
  FEES: 'sfm_fees',
  PAYMENTS: 'sfm_payments'
};

// Initialize Storage with Default Data if empty
const initializeStorage = () => {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(MOCK_USERS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.STUDENTS)) {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.FEES)) {
    localStorage.setItem(STORAGE_KEYS.FEES, JSON.stringify(DEFAULT_FEES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PAYMENTS)) {
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(INITIAL_PAYMENTS));
  }
};

initializeStorage();

const db = {
  get: <T>(key: string): T => JSON.parse(localStorage.getItem(key) || '[]'),
  set: (key: string, data: any) => localStorage.setItem(key, JSON.stringify(data)),
};

const simulateNetwork = async () => {
  // 1. Latency (300ms - 800ms)
  const delay = 300 + Math.random() * 500;
  await new Promise(resolve => setTimeout(resolve, delay));

  // 2. Random Error Simulation (10% chance)
  if (Math.random() < 0.1) {
    const errors = [
      "Network Error: Unable to reach server.",
      "500: Internal Server Error",
      "Connection Timeout",
      "Database Locked: Please try again."
    ];
    const randomError = errors[Math.floor(Math.random() * errors.length)];
    throw new Error(randomError);
  }
};

export const api = {
  // --- USERS ---
  login: async (username: string, pass: string): Promise<User | null> => {
    await simulateNetwork();
    const users = db.get<User[]>(STORAGE_KEYS.USERS);
    const user = users.find(u => u.username === username && u.password === pass);
    
    if (user) {
      // Return user without password
      const { password, ...safeUser } = user;
      return safeUser as User;
    }
    return null;
  },

  getUsers: async (): Promise<User[]> => {
    await simulateNetwork();
    const users = db.get<User[]>(STORAGE_KEYS.USERS);
    return users.map(({ password, ...u }) => u as User);
  },

  saveUser: async (user: User): Promise<void> => {
    await simulateNetwork();
    const users = db.get<User[]>(STORAGE_KEYS.USERS);
    
    if (user.id) {
      // Update
      const index = users.findIndex(u => u.id === user.id);
      if (index === -1) throw new Error("User not found");
      users[index] = { ...users[index], ...user, password: user.password || users[index].password };
    } else {
      // Create
      if (users.find(u => u.username === user.username)) throw new Error("Username already exists");
      user.id = `u-${Date.now()}`;
      users.push(user);
    }
    
    db.set(STORAGE_KEYS.USERS, users);
  },

  deleteUser: async (id: string): Promise<void> => {
    await simulateNetwork();
    let users = db.get<User[]>(STORAGE_KEYS.USERS);
    users = users.filter(u => u.id !== id);
    db.set(STORAGE_KEYS.USERS, users);
  },

  // --- STUDENTS ---
  getStudents: async (): Promise<Student[]> => {
    await simulateNetwork();
    return db.get<Student[]>(STORAGE_KEYS.STUDENTS);
  },

  addStudent: async (student: Student): Promise<void> => {
    await simulateNetwork();
    const students = db.get<Student[]>(STORAGE_KEYS.STUDENTS);
    
    if (students.find(s => s.id === student.id)) {
      throw new Error("Admission Number already exists");
    }
    
    students.push(student);
    db.set(STORAGE_KEYS.STUDENTS, students);
  },

  updateStudent: async (student: Student): Promise<void> => {
    await simulateNetwork();
    const students = db.get<Student[]>(STORAGE_KEYS.STUDENTS);
    const index = students.findIndex(s => s.id === student.id);
    
    if (index === -1) throw new Error("Student not found");
    
    students[index] = student;
    db.set(STORAGE_KEYS.STUDENTS, students);
  },

  deleteStudent: async (id: string): Promise<void> => {
    await simulateNetwork();
    let students = db.get<Student[]>(STORAGE_KEYS.STUDENTS);
    students = students.filter(s => s.id !== id);
    db.set(STORAGE_KEYS.STUDENTS, students);
  },

  // --- FEES ---
  getFeesConfig: async (): Promise<FeeStructure[]> => {
    await simulateNetwork();
    return db.get<FeeStructure[]>(STORAGE_KEYS.FEES);
  },

  updateFeeConfig: async (config: FeeStructure): Promise<void> => {
    await simulateNetwork();
    const fees = db.get<FeeStructure[]>(STORAGE_KEYS.FEES);
    const index = fees.findIndex(f => f.className === config.className);
    
    if (index === -1) throw new Error("Class fee config not found");
    
    fees[index] = config;
    db.set(STORAGE_KEYS.FEES, fees);
  },

  // --- PAYMENTS ---
  getPayments: async (): Promise<Payment[]> => {
    await simulateNetwork();
    return db.get<Payment[]>(STORAGE_KEYS.PAYMENTS);
  },

  recordPayment: async (payment: Payment, updatedStudent: Student): Promise<void> => {
    await simulateNetwork();
    
    // 1. Save Payment
    const payments = db.get<Payment[]>(STORAGE_KEYS.PAYMENTS);
    payments.push(payment);
    db.set(STORAGE_KEYS.PAYMENTS, payments);
    
    // 2. Update Student Balance
    const students = db.get<Student[]>(STORAGE_KEYS.STUDENTS);
    const index = students.findIndex(s => s.id === updatedStudent.id);
    
    if (index === -1) throw new Error("Student not found while recording payment");
    
    students[index] = updatedStudent;
    db.set(STORAGE_KEYS.STUDENTS, students);
  }
};