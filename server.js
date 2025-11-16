const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

// --- INITIAL DATA (Mock Database) ---
const CLASSES = ['LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

let fees = CLASSES.map(c => ({
  className: c,
  annualFee: c === 'LKG' || c === 'UKG' ? 15000 : c === '10' ? 25000 : 20000,
  components: [
    { name: 'Tuition', amount: 10000 },
    { name: 'Activity', amount: 2000 },
    { name: 'Development', amount: 3000 }
  ]
}));

let users = [
  { id: 'u1', username: 'admin', name: 'Principal Skinner', role: 'admin', password: 'admin' },
  { id: 'u2', username: 'acct', name: 'Angela Martin', role: 'accountant', password: 'acct' },
  { id: 'u3', username: 'teacher', name: 'Edna Krabappel', role: 'teacher', password: 'teach' },
  { id: 'u4', username: 'parent', name: 'Homer Simpson', role: 'parent', password: 'pass' },
];

let students = [
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
    paidAmount: 20000,
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

let payments = [
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

// --- HELPER FUNCTIONS ---
const simulateDelay = async () => {
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // Simulate random server errors (5% chance)
  if (Math.random() < 0.05) {
    throw new Error("Internal Server Error (Simulated)");
  }
};

// --- ROUTES ---

// AUTH
app.post('/login', async (req, res) => {
  try {
    await simulateDelay();
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
      const { password, ...safeUser } = user;
      res.json(safeUser);
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// USERS
app.get('/users', async (req, res) => {
  try {
    await simulateDelay();
    // Return users without passwords
    const safeUsers = users.map(({ password, ...u }) => u);
    res.json(safeUsers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/users', async (req, res) => {
  try {
    await simulateDelay();
    const user = req.body;
    
    if (user.id) {
      // Update
      const index = users.findIndex(u => u.id === user.id);
      if (index !== -1) {
        const existing = users[index];
        users[index] = { ...existing, ...user, password: user.password || existing.password };
        res.json({ message: 'User updated' });
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    } else {
      // Create
      if (users.find(u => u.username === user.username)) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      user.id = 'u_' + Date.now();
      users.push(user);
      res.json({ message: 'User created', id: user.id });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/users/:id', async (req, res) => {
  try {
    await simulateDelay();
    const { id } = req.params;
    users = users.filter(u => u.id !== id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// STUDENTS
app.get('/students', async (req, res) => {
  try {
    await simulateDelay();
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/students', async (req, res) => {
  try {
    await simulateDelay();
    const student = req.body;
    if (students.find(s => s.id === student.id)) {
      return res.status(400).json({ error: 'Admission Number already exists' });
    }
    students.push(student);
    res.json({ message: 'Student added' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/students/:id', async (req, res) => {
  try {
    await simulateDelay();
    const { id } = req.params;
    const student = req.body;
    const index = students.findIndex(s => s.id === id);
    
    if (index !== -1) {
      students[index] = student;
      res.json({ message: 'Student updated' });
    } else {
      res.status(404).json({ error: 'Student not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/students/:id', async (req, res) => {
  try {
    await simulateDelay();
    const { id } = req.params;
    students = students.filter(s => s.id !== id);
    res.json({ message: 'Student deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// FEES
app.get('/fees', async (req, res) => {
  try {
    await simulateDelay();
    res.json(fees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/fees', async (req, res) => {
  try {
    await simulateDelay();
    const config = req.body;
    const index = fees.findIndex(f => f.className === config.className);
    if (index >= 0) {
      fees[index] = config;
      res.json({ message: 'Fee config updated' });
    } else {
      res.status(404).json({ error: 'Class not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PAYMENTS
app.get('/payments', async (req, res) => {
  try {
    await simulateDelay();
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/payments', async (req, res) => {
  try {
    await simulateDelay();
    const { payment, student } = req.body;
    
    // 1. Save Payment
    payments.push(payment);
    
    // 2. Update Student Balance (Overwrite student record with new state)
    const index = students.findIndex(s => s.id === student.id);
    if (index !== -1) {
      students[index] = student;
    }
    
    res.json({ message: 'Payment recorded successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
