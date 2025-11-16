import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../services/api';
import { Payment, Student } from '../types';
import { CLASSES } from '../constants';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

type ReportType = 'outstanding' | 'collection' | 'ledger' | 'daily';

export const Reports: React.FC = () => {
  // Data State
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // UI State
  const [activeReport, setActiveReport] = useState<ReportType>('collection');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0].slice(0, 7) + '-01');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState('All Classes');
  const [selectedStaff, setSelectedStaff] = useState('All Staff');
  const [selectedStudentId, setSelectedStudentId] = useState('');

  // Report Result State
  const [generated, setGenerated] = useState(false);
  const [displayData, setDisplayData] = useState<{
    summary: { label: string; value: string; icon: string };
    subtitle: string;
    headers: string[];
    rows: any[][];
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [p, s] = await Promise.all([api.getPayments(), api.getStudents()]);
      setPayments(p);
      setStudents(s);
      setLoading(false);
    };
    fetchData();
  }, []);

  // Extract unique staff names from payments
  const staffList = useMemo(() => {
    const staff = new Set(payments.map(p => p.recordedBy.userName));
    return Array.from(staff).sort();
  }, [payments]);

  // Handler for Report Type Selection
  const handleReportTypeChange = (type: ReportType) => {
    setActiveReport(type);
    setGenerated(false);
    setDisplayData(null);
    
    // Reset/Preset filters based on type
    const today = new Date().toISOString().split('T')[0];
    if (type === 'daily') {
      setStartDate(today);
      setEndDate(today);
    } else if (type === 'collection') {
      setStartDate(today.slice(0, 7) + '-01');
      setEndDate(today);
    }
  };

  const generateReport = () => {
    let summary = { label: '', value: '', icon: '' };
    let subtitle = '';
    let headers: string[] = [];
    let rows: any[][] = [];

    if (activeReport === 'outstanding') {
      // OUTSTANDING FEES REPORT
      let filteredStudents = students;
      if (selectedClass !== 'All Classes') {
        filteredStudents = filteredStudents.filter(s => s.class === selectedClass);
      }

      const reportItems = filteredStudents
        .map(s => {
          const due = (s.currentYearFee - s.paidAmount) + s.previousPending.reduce((a, b) => a + b.amount, 0);
          return { ...s, due };
        })
        .filter(s => s.due > 0)
        .sort((a, b) => b.due - a.due);

      const totalDue = reportItems.reduce((sum, s) => sum + s.due, 0);

      summary = { 
        label: 'Total Outstanding', 
        value: `₹${totalDue.toLocaleString()}`, 
        icon: 'report' 
      };
      subtitle = `As of ${new Date().toLocaleDateString()} • ${selectedClass}`;
      headers = ['Adm No', 'Name', 'Class', 'Father Name', 'Amount Due'];
      rows = reportItems.map(s => [s.id, s.name, s.class, s.fatherName, `₹${s.due}`]);

    } else if (activeReport === 'collection' || activeReport === 'daily') {
      // COLLECTION & DAILY REPORT
      let filteredPayments = payments.filter(p => {
        const pDate = p.date; // YYYY-MM-DD
        return pDate >= startDate && pDate <= endDate;
      });

      if (selectedClass !== 'All Classes') {
        filteredPayments = filteredPayments.filter(p => p.studentClass === selectedClass);
      }

      if (selectedStaff !== 'All Staff') {
        filteredPayments = filteredPayments.filter(p => p.recordedBy.userName === selectedStaff);
      }

      const totalCollection = filteredPayments.reduce((sum, p) => sum + p.amount, 0);

      summary = { 
        label: 'Total Collection', 
        value: `₹${totalCollection.toLocaleString()}`, 
        icon: 'payments' 
      };
      subtitle = `Period: ${startDate} to ${endDate}${selectedStaff !== 'All Staff' ? ` • Staff: ${selectedStaff}` : ''}`;
      headers = ['Date', 'Receipt', 'Student', 'Class', 'Mode', 'Recorded By', 'Amount'];
      rows = filteredPayments
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map(p => [p.date, p.receiptNo, p.studentName, p.studentClass, p.mode, p.recordedBy.userName, `₹${p.amount}`]);
    
    } else if (activeReport === 'ledger') {
      // STUDENT LEDGER
      let filteredPayments = payments;
      
      // If student is selected, show specific history
      if (selectedStudentId) {
        filteredPayments = filteredPayments.filter(p => p.studentId === selectedStudentId);
        const student = students.find(s => s.id === selectedStudentId);
        
        if (selectedStaff !== 'All Staff') {
            filteredPayments = filteredPayments.filter(p => p.recordedBy.userName === selectedStaff);
        }

        const totalPaid = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
        
        summary = {
          label: 'Total Paid by Student',
          value: `₹${totalPaid.toLocaleString()}`,
          icon: 'person_search'
        };
        subtitle = student ? `${student.name} (Class ${student.class})` : 'Selected Student';
      } else {
        // General transaction ledger if no specific student
         if (selectedClass !== 'All Classes') {
            filteredPayments = filteredPayments.filter(p => p.studentClass === selectedClass);
         }
         filteredPayments = filteredPayments.filter(p => p.date >= startDate && p.date <= endDate);
         
         if (selectedStaff !== 'All Staff') {
            filteredPayments = filteredPayments.filter(p => p.recordedBy.userName === selectedStaff);
         }
         
         const total = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
         summary = { label: 'Ledger Total', value: `₹${total.toLocaleString()}`, icon: 'list_alt' };
         subtitle = `Transactions from ${startDate} to ${endDate}`;
      }

      headers = ['Date', 'Receipt', 'Student', 'Type', 'Recorded By', 'Amount'];
      rows = filteredPayments
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map(p => [p.date, p.receiptNo, p.studentName, p.mode, p.recordedBy.userName, `₹${p.amount}`]);
    }

    setDisplayData({ summary, subtitle, headers, rows });
    setGenerated(true);
  };

  const exportPDF = () => {
    if (!displayData) return;
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.text(activeReport.toUpperCase().replace('_', ' ') + " REPORT", 14, 20);
    
    // Subtitle
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(displayData.subtitle, 14, 30);
    
    // Summary
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`${displayData.summary.label}: ${displayData.summary.value}`, 14, 40);

    // Table
    (doc as any).autoTable({
        head: [displayData.headers],
        body: displayData.rows,
        startY: 50,
        theme: 'grid',
        headStyles: { fillColor: [19, 127, 236] } // Primary Color
    });
    
    doc.save(`${activeReport}_report.pdf`);
  };

  if (loading) return (
    <div className="flex h-full items-center justify-center">
      <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
    </div>
  );

  return (
    <div className="flex flex-col flex-1 max-w-6xl mx-auto w-full">
      {/* Main Content */}
      <main className="flex-1">
        {/* Headline Text */}
        <h2 className="text-text-main dark:text-white tracking-light text-[28px] font-bold leading-tight px-4 text-left pb-3 pt-5">
          Select a Report
        </h2>

        {/* Report Type Grid */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(158px,1fr))] gap-4 p-4">
          {/* Outstanding Fees */}
          <div 
            onClick={() => handleReportTypeChange('outstanding')}
            className={`flex flex-1 gap-3 rounded-xl border p-4 flex-col cursor-pointer transition-all duration-200 ${
              activeReport === 'outstanding' 
                ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                : 'border-border-color dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary/50'
            }`}
          >
            <div className="text-primary text-3xl">
              <span className="material-symbols-outlined">report</span>
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-text-main dark:text-white text-base font-bold leading-tight">Outstanding Fees</h3>
              <p className="text-text-secondary dark:text-gray-400 text-sm font-normal leading-normal">View pending fees by class</p>
            </div>
          </div>

          {/* Collection Summary */}
          <div 
            onClick={() => handleReportTypeChange('collection')}
            className={`flex flex-1 gap-3 rounded-xl border p-4 flex-col cursor-pointer transition-all duration-200 ${
              activeReport === 'collection' 
                ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                : 'border-border-color dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary/50'
            }`}
          >
            <div className="text-primary text-3xl">
              <span className="material-symbols-outlined">request_quote</span>
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-text-main dark:text-white text-base font-bold leading-tight">Collection Summary</h3>
              <p className="text-text-secondary dark:text-gray-400 text-sm font-normal leading-normal">Total fees collected in a date range</p>
            </div>
          </div>

          {/* Student Ledger */}
          <div 
            onClick={() => handleReportTypeChange('ledger')}
            className={`flex flex-1 gap-3 rounded-xl border p-4 flex-col cursor-pointer transition-all duration-200 ${
              activeReport === 'ledger' 
                ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                : 'border-border-color dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary/50'
            }`}
          >
            <div className="text-primary text-3xl">
              <span className="material-symbols-outlined">person_search</span>
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-text-main dark:text-white text-base font-bold leading-tight">Student Ledger</h3>
              <p className="text-text-secondary dark:text-gray-400 text-sm font-normal leading-normal">Transaction history for a student</p>
            </div>
          </div>

          {/* Daily Payments */}
          <div 
             onClick={() => handleReportTypeChange('daily')}
             className={`flex flex-1 gap-3 rounded-xl border p-4 flex-col cursor-pointer transition-all duration-200 ${
               activeReport === 'daily' 
                 ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                 : 'border-border-color dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary/50'
             }`}
          >
            <div className="text-primary text-3xl">
              <span className="material-symbols-outlined">today</span>
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-text-main dark:text-white text-base font-bold leading-tight">Daily Payments</h3>
              <p className="text-text-secondary dark:text-gray-400 text-sm font-normal leading-normal">All payments on a specific date</p>
            </div>
          </div>
        </div>

        {/* Filter and Generate Report Section */}
        <div className="px-4 py-4 mt-4 border-t border-border-color dark:border-gray-700">
          <h3 className="text-text-main dark:text-white text-xl font-bold leading-tight pb-4">Generate Report</h3>
          <div className="space-y-4">
            
            {/* Date Filters - Hidden for Outstanding Fees */}
            {activeReport !== 'outstanding' && (
              <div>
                <label className="block text-sm font-medium text-text-secondary dark:text-gray-400 pb-1.5">
                   {activeReport === 'daily' ? 'Select Date' : 'Select Date Range'}
                </label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => {
                        setStartDate(e.target.value);
                        if (activeReport === 'daily') setEndDate(e.target.value);
                    }}
                    className="block w-full rounded-lg border-border-color dark:border-gray-600 bg-white dark:bg-gray-800 text-sm dark:text-white focus:border-primary focus:ring-primary p-2.5 border"
                  />
                  {activeReport !== 'daily' && (
                    <>
                        <span className="text-text-secondary dark:text-gray-500 hidden sm:inline">-</span>
                        <span className="text-text-secondary dark:text-gray-500 sm:hidden text-xs text-center w-full">to</span>
                        <input 
                            type="date" 
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="block w-full rounded-lg border-border-color dark:border-gray-600 bg-white dark:bg-gray-800 text-sm dark:text-white focus:border-primary focus:ring-primary p-2.5 border"
                        />
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Class Filter */}
            <div>
              <label className="block text-sm font-medium text-text-secondary dark:text-gray-400 pb-1.5" htmlFor="class-filter">Filter by Class</label>
              <select 
                id="class-filter"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="block w-full rounded-lg border-border-color dark:border-gray-600 bg-white dark:bg-gray-800 text-sm dark:text-white focus:border-primary focus:ring-primary p-2.5 border"
              >
                <option>All Classes</option>
                {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            
            {/* Staff/Recorder Filter - Only relevant for payment-based reports */}
            {activeReport !== 'outstanding' && (
              <div>
                <label className="block text-sm font-medium text-text-secondary dark:text-gray-400 pb-1.5">Filter by Staff</label>
                <select 
                    value={selectedStaff}
                    onChange={(e) => setSelectedStaff(e.target.value)}
                    className="block w-full rounded-lg border-border-color dark:border-gray-600 bg-white dark:bg-gray-800 text-sm dark:text-white focus:border-primary focus:ring-primary p-2.5 border"
                >
                    <option>All Staff</option>
                    {staffList.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}

            {/* Student Filter (Only for Ledger) */}
            {activeReport === 'ledger' && (
              <div>
                  <label className="block text-sm font-medium text-text-secondary dark:text-gray-400 pb-1.5">Select Student (Optional)</label>
                  <select
                    value={selectedStudentId}
                    onChange={e => setSelectedStudentId(e.target.value)}
                    className="block w-full rounded-lg border-border-color dark:border-gray-600 bg-white dark:bg-gray-800 text-sm dark:text-white focus:border-primary focus:ring-primary p-2.5 border"
                  >
                      <option value="">-- All Students --</option>
                      {students.map(s => (
                          <option key={s.id} value={s.id}>{s.name} ({s.class})</option>
                      ))}
                  </select>
              </div>
            )}

            <button 
              onClick={generateReport}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 px-4 text-center font-bold text-white transition-colors hover:bg-primary-dark shadow-sm"
            >
              <span className="material-symbols-outlined">summarize</span>
              Generate Report
            </button>
          </div>
        </div>

        {/* Report View */}
        {generated && displayData && (
          <div className="px-4 py-4 mt-4 border-t border-border-color dark:border-gray-700 animate-in slide-in-from-bottom-2 fade-in duration-300">
            {/* Report Header */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-text-main dark:text-white text-xl font-bold leading-tight capitalize">
                {activeReport.replace('_', ' ')} Report
              </h3>
              <div className="flex items-center gap-2">
                <button 
                    onClick={() => window.print()}
                    className="flex items-center justify-center size-9 rounded-lg border border-border-color dark:border-gray-600 bg-white dark:bg-gray-800 text-text-secondary dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">print</span>
                </button>
                <button 
                    onClick={exportPDF}
                    className="flex items-center justify-center size-9 rounded-lg border border-border-color dark:border-gray-600 bg-white dark:bg-gray-800 text-text-secondary dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">download</span>
                </button>
              </div>
            </div>

            {/* Summary Card */}
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between mb-6">
              <div>
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">{displayData.summary.label}</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-300">{displayData.summary.value}</p>
              </div>
              <span className="material-symbols-outlined text-3xl text-emerald-600 dark:text-emerald-400">
                {displayData.summary.icon}
              </span>
            </div>
            <p className="text-xs text-text-secondary dark:text-gray-500 -mt-4 mb-4">{displayData.subtitle}</p>

            {/* Table View */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-border-color dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-border-color dark:border-gray-700">
                    <tr>
                      {displayData.headers.map((h, i) => (
                        <th key={i} className="px-6 py-4 font-semibold text-text-main dark:text-white whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-color dark:divide-gray-700">
                    {displayData.rows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        {row.map((cell: any, cIdx: number) => (
                          <td key={cIdx} className="px-6 py-3 text-text-secondary dark:text-gray-300 whitespace-nowrap">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {displayData.rows.length === 0 && (
                        <tr>
                            <td colSpan={displayData.headers.length} className="px-6 py-8 text-center text-text-secondary dark:text-gray-500">
                                No records found for the selected criteria.
                            </td>
                        </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};