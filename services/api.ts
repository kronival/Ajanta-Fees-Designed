import { Student, Payment, FeeStructure, User } from '../types';

const API_URL = 'http://localhost:3001';

const headers = {
  'Content-Type': 'application/json',
};

const handleResponse = async (res: Response) => {
  if (!res.ok) {
    // Try to parse JSON error from server, fallback to text or status
    try {
      const data = await res.json();
      throw new Error(data.error || res.statusText);
    } catch (e: any) {
      // If json parse fails (e.g. unexpected html error), use text
      if (e.message && e.message !== 'Unexpected end of JSON input') throw e;
      const text = await res.text();
      throw new Error(text || `HTTP Error ${res.status}`);
    }
  }
  return res.json();
};

export const api = {
  // --- USERS ---
  login: async (username: string, pass: string): Promise<User | null> => {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ username, password: pass })
    });
    
    if (res.status === 401) return null; // Invalid credentials
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || 'Login failed');
    }
    
    return res.json();
  },

  getUsers: async (): Promise<User[]> => {
    const res = await fetch(`${API_URL}/users`);
    return handleResponse(res);
  },

  saveUser: async (user: User): Promise<void> => {
    const res = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers,
      body: JSON.stringify(user)
    });
    await handleResponse(res);
  },

  deleteUser: async (id: string): Promise<void> => {
    const res = await fetch(`${API_URL}/users/${id}`, {
      method: 'DELETE'
    });
    await handleResponse(res);
  },

  // --- STUDENTS ---
  getStudents: async (): Promise<Student[]> => {
    const res = await fetch(`${API_URL}/students`);
    return handleResponse(res);
  },

  addStudent: async (student: Student): Promise<void> => {
    const res = await fetch(`${API_URL}/students`, {
      method: 'POST',
      headers,
      body: JSON.stringify(student)
    });
    await handleResponse(res);
  },

  updateStudent: async (student: Student): Promise<void> => {
    const res = await fetch(`${API_URL}/students/${student.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(student)
    });
    await handleResponse(res);
  },

  deleteStudent: async (id: string): Promise<void> => {
    const res = await fetch(`${API_URL}/students/${id}`, {
      method: 'DELETE'
    });
    await handleResponse(res);
  },

  // --- FEES ---
  getFeesConfig: async (): Promise<FeeStructure[]> => {
    const res = await fetch(`${API_URL}/fees`);
    return handleResponse(res);
  },

  updateFeeConfig: async (config: FeeStructure): Promise<void> => {
    const res = await fetch(`${API_URL}/fees`, {
      method: 'POST',
      headers,
      body: JSON.stringify(config)
    });
    await handleResponse(res);
  },

  // --- PAYMENTS ---
  getPayments: async (): Promise<Payment[]> => {
    const res = await fetch(`${API_URL}/payments`);
    return handleResponse(res);
  },

  recordPayment: async (payment: Payment, updatedStudent: Student): Promise<void> => {
    const res = await fetch(`${API_URL}/payments`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ payment, student: updatedStudent })
    });
    await handleResponse(res);
  }
};
