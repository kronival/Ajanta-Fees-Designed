import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../services/api';
import { Student, Payment } from '../types';
import { useAuth } from '../components/AuthContext';

interface DashboardProps {
  onNavigate: (page: string, studentId?: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All Dues');

  useEffect(() => {
    const loadData = async () => {
      const [sData, pData] = await Promise.all([api.getStudents(), api.getPayments()]);
      setStudents(sData);
      setPayments(pData);
      setLoading(false);
    };
    loadData();
  }, []);

  // --- Calculations ---
  const totalOutstanding = useMemo(() => {
    return students.reduce((sum, s) => {
      const prev = s.previousPending.reduce((p, c) => p + c.amount, 0);
      const currentDue = s.currentYearFee - s.paidAmount;
      return sum + prev + currentDue;
    }, 0);
  }, [students]);

  const collectedToday = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return payments
      .filter(p => p.date === today)
      .reduce((sum, p) => sum + p.amount, 0);
  }, [payments]);

  const defaulters = useMemo(() => {
    return students
      .map(s => {
        const totalDue = (s.currentYearFee - s.paidAmount) + s.previousPending.reduce((a,b) => a+b.amount, 0);
        
        // Determine earliest due date logic (simulated)
        let dueDateStr = 'Now';
        if (s.previousPending.length > 0) {
          dueDateStr = 'Overdue';
        }

        return { ...s, totalDue, dueDateStr };
      })
      .filter(s => s.totalDue > 0)
      .sort((a, b) => b.totalDue - a.totalDue);
  }, [students]);

  const filteredList = useMemo(() => {
    let list = defaulters;
    
    // Search Filter
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s => 
        s.name.toLowerCase().includes(q) || 
        s.id.toLowerCase().includes(q) ||
        s.class.toLowerCase().includes(q)
      );
    }

    // Chip Filter
    if (activeFilter === 'Overdue') {
      list = list.filter(s => s.previousPending.length > 0);
    } else if (activeFilter.startsWith('Class')) {
      const cls = activeFilter.replace('Class ', '').replace(/[A-Z]/g, ''); // "Class 5A" -> "5"
      list = list.filter(s => s.class === cls);
    }

    return list;
  }, [defaulters, search, activeFilter]);

  if (loading) return <div className="flex h-screen items-center justify-center"><span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span></div>;

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark group/design-root overflow-x-hidden font-display">
      {/* TopAppBar */}
      <div className="sticky top-0 z-10 flex items-center justify-between bg-white dark:bg-background-dark p-4 pb-2 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-gray-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1">St. Xavier's School</h2>
        <div className="flex size-10 shrink-0 items-center justify-end">
          <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 bg-primary/20 text-primary flex items-center justify-center font-bold text-lg">
            {user?.name?.charAt(0)}
          </div>
        </div>
      </div>

      <main className="flex-1 pb-24">
        {/* Stats */}
        <div className="flex flex-wrap gap-4 p-4">
          <div className="flex min-w-[158px] flex-1 flex-col gap-2 rounded-xl bg-white dark:bg-slate-800 p-4 border border-gray-200 dark:border-slate-700">
            <p className="text-gray-600 dark:text-gray-300 text-sm font-medium leading-normal">Total Outstanding</p>
            <p className="text-gray-900 dark:text-white tracking-light text-2xl font-bold leading-tight">₹{totalOutstanding.toLocaleString()}</p>
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-green-500 text-base">arrow_upward</span>
              <p className="text-green-500 text-sm font-medium leading-normal">+2.5%</p>
            </div>
          </div>
          <div className="flex min-w-[158px] flex-1 flex-col gap-2 rounded-xl bg-white dark:bg-slate-800 p-4 border border-gray-200 dark:border-slate-700">
            <p className="text-gray-600 dark:text-gray-300 text-sm font-medium leading-normal">Collection Today</p>
            <p className="text-gray-900 dark:text-white tracking-light text-2xl font-bold leading-tight">₹{collectedToday.toLocaleString()}</p>
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-red-500 text-base">arrow_downward</span>
              <p className="text-red-500 text-sm font-medium leading-normal">-1.2%</p>
            </div>
          </div>
        </div>

        {/* SearchBar */}
        <div className="px-4 py-2">
          <label className="flex flex-col min-w-40 h-12 w-full">
            <div className="flex w-full flex-1 items-stretch rounded-lg h-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
              <div className="text-gray-500 dark:text-gray-400 flex items-center justify-center pl-4">
                <span className="material-symbols-outlined text-2xl">search</span>
              </div>
              <input 
                className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 dark:text-white focus:outline-0 focus:ring-0 border-none bg-transparent h-full placeholder:text-gray-500 dark:placeholder:text-gray-400 px-4 pl-2 text-base font-normal leading-normal" 
                placeholder="Search by name or ID" 
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </label>
        </div>

        {/* Chips */}
        <div className="flex gap-3 p-4 pt-2 overflow-x-auto scrollbar-hide">
          {['All Dues', 'Overdue', 'Class 5', 'Class 10'].map(chip => {
            const isActive = activeFilter === chip;
            return (
              <button 
                key={chip}
                onClick={() => setActiveFilter(chip)}
                className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-lg pl-4 pr-4 transition-colors ${
                  isActive 
                    ? 'bg-primary/20 dark:bg-primary/30 text-primary dark:text-blue-300' 
                    : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-200'
                }`}
              >
                <p className="text-sm font-medium leading-normal whitespace-nowrap">{chip}</p>
              </button>
            );
          })}
        </div>

        {/* SectionHeader */}
        <h2 className="text-gray-900 dark:text-white text-xl font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-3">Students with Dues</h2>

        {/* Student Dues List */}
        <div className="flex flex-col gap-3 px-4">
          {filteredList.map(student => (
            <div key={student.id} className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl bg-white dark:bg-slate-800 p-4 border border-gray-200 dark:border-slate-700 shadow-sm">
              <div className="flex-1">
                <p className="text-base font-semibold text-gray-900 dark:text-white">{student.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Class {student.class} • {student.id}</p>
                <p className="text-sm text-red-600 dark:text-red-400 mt-1 font-medium">Status: {student.dueDateStr}</p>
              </div>
              
              <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-gray-700">
                <p className="text-lg font-bold text-red-600 dark:text-red-400">₹{student.totalDue.toLocaleString()}</p>
                <button 
                  onClick={() => onNavigate('payments', student.id)}
                  className="sm:mt-2 flex h-8 items-center justify-center gap-x-2 rounded-lg bg-primary/20 dark:bg-primary/30 px-3 text-sm font-medium text-primary dark:text-blue-300 hover:bg-primary/30 transition-colors"
                >
                  <span className="material-symbols-outlined text-base">credit_card</span>
                  <span>Pay Fees</span>
                </button>
              </div>
            </div>
          ))}
          {filteredList.length === 0 && (
            <div className="text-center py-10 text-gray-500">
              No students found with current criteria.
            </div>
          )}
        </div>
      </main>

      {/* Bottom Navigation Bar - Visible only on mobile/small screens where sidebar is hidden */}
      <div className="fixed bottom-0 left-0 right-0 z-10 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 md:hidden shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="flex h-16 justify-around">
          <button className="flex flex-1 flex-col items-center justify-center gap-1 text-primary">
            <span className="material-symbols-outlined">dashboard</span>
            <span className="text-xs font-medium">Dashboard</span>
          </button>
          <button 
            onClick={() => onNavigate('students')}
            className="flex flex-1 flex-col items-center justify-center gap-1 text-gray-500 dark:text-gray-400 hover:text-primary"
          >
            <span className="material-symbols-outlined">group</span>
            <span className="text-xs font-medium">Students</span>
          </button>
          <button 
            onClick={() => onNavigate('payments')}
            className="flex flex-1 flex-col items-center justify-center gap-1 text-gray-500 dark:text-gray-400 hover:text-primary"
          >
            <span className="material-symbols-outlined">receipt_long</span>
            <span className="text-xs font-medium">Fees</span>
          </button>
          <button 
            onClick={() => onNavigate('reports')}
            className="flex flex-1 flex-col items-center justify-center gap-1 text-gray-500 dark:text-gray-400 hover:text-primary"
          >
            <span className="material-symbols-outlined">analytics</span>
            <span className="text-xs font-medium">Reports</span>
          </button>
        </div>
      </div>
    </div>
  );
};