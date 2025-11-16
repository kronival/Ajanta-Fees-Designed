import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { FeeStructure } from '../types';
import { Save } from 'lucide-react';

export const Admin: React.FC = () => {
  const [fees, setFees] = useState<FeeStructure[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getFeesConfig().then(f => {
        setFees(f);
        setLoading(false);
    });
  }, []);

  const handleUpdate = async (index: number, newVal: number) => {
      const updated = [...fees];
      updated[index].annualFee = newVal;
      setFees(updated);
      await api.updateFeeConfig(updated[index]);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-800">Fee Configuration</h2>
        <p className="text-slate-500">Set base annual fees for the current academic year. Changing these values updates the default for new students but does not affect existing student records.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fees.map((fee, idx) => (
                <div key={fee.className} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg text-slate-800">Class {fee.className}</h3>
                        <span className="text-xs font-medium px-2 py-1 bg-slate-100 rounded text-slate-500">Annual</span>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Total Fee Amount</label>
                        <div className="flex gap-2">
                            <input 
                                type="number"
                                className="flex-1 p-2 border rounded"
                                value={fee.annualFee}
                                onChange={(e) => {
                                    const val = Number(e.target.value);
                                    const newFees = [...fees];
                                    newFees[idx].annualFee = val;
                                    setFees(newFees);
                                }}
                            />
                            <button 
                                onClick={() => handleUpdate(idx, fee.annualFee)}
                                className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                title="Save"
                            >
                                <Save size={20} />
                            </button>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-50">
                        <p className="text-xs text-slate-400 mb-2">Components breakdown (read-only)</p>
                        <ul className="space-y-1">
                            {fee.components.map(c => (
                                <li key={c.name} className="flex justify-between text-xs text-slate-600">
                                    <span>{c.name}</span>
                                    <span>${c.amount}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};