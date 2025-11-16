import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Payment } from '../types';
import { Download } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const Reports: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPayments().then(data => {
        setPayments(data.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setLoading(false);
    });
  }, []);

  const exportPDF = () => {
      const doc = new jsPDF();
      doc.text("Transaction Report", 14, 15);
      
      const tableData = payments.map(p => [
          p.date, 
          p.receiptNo, 
          p.studentName, 
          p.studentClass, 
          `$${p.amount}`,
          p.mode,
          `${p.recordedBy.userName} (${p.recordedBy.userId})`
      ]);

      (doc as any).autoTable({
          head: [['Date', 'Receipt', 'Student', 'Class', 'Amount', 'Mode', 'Recorded By']],
          body: tableData,
          startY: 20,
      });
      doc.save('transactions.pdf');
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-800">Payment History</h2>
          <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
              <Download size={18} /> Export PDF
          </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-900">
                  <tr>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Receipt</th>
                      <th className="px-6 py-4">Student</th>
                      <th className="px-6 py-4">Class</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Mode</th>
                      <th className="px-6 py-4">Recorded By</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                  {payments.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50">
                          <td className="px-6 py-3 font-mono text-xs">{p.date}</td>
                          <td className="px-6 py-3 font-medium">{p.receiptNo}</td>
                          <td className="px-6 py-3">
                              <div className="font-medium text-slate-800">{p.studentName}</div>
                              <div className="text-xs text-slate-400">{p.studentId}</div>
                          </td>
                          <td className="px-6 py-3">{p.studentClass}</td>
                          <td className="px-6 py-3 font-bold text-green-600">${p.amount}</td>
                          <td className="px-6 py-3 capitalize">{p.mode}</td>
                          <td className="px-6 py-3 text-xs">
                            <span className="font-medium text-slate-700">{p.recordedBy.userName}</span>
                            <br/>
                            <span className="text-slate-400">ID: {p.recordedBy.userId}</span>
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
      </div>
    </div>
  );
};