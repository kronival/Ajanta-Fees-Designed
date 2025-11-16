import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Student, FeeStructure } from '../types';
import { CLASSES, ACADEMIC_YEAR } from '../constants';
import { Search, Plus, Filter, Edit2, Trash2, X, Save, AlertTriangle } from 'lucide-react';
import { useAuth } from '../components/AuthContext';

interface StudentsProps {
  onNavigate: (page: string, studentId?: string) => void;
}

export const Students: React.FC<StudentsProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [feesConfig, setFeesConfig] = useState<FeeStructure[]>([]);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Delete Confirmation State
  const [deleteConfirm, setDeleteConfirm] = useState<{isOpen: boolean, studentId: string | null}>({
      isOpen: false,
      studentId: null
  });

  // Form State
  const initialForm: Partial<Student> = {
    id: '', name: '', fatherName: '', motherName: '', dob: '', class: 'LKG', 
    previousPending: [], currentYearFee: 0, paidAmount: 0
  };
  const [formData, setFormData] = useState<Partial<Student>>(initialForm);
  const [prevPendingInput, setPrevPendingInput] = useState({ year: '', amount: 0 });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let res = students;
    if (classFilter) res = res.filter(s => s.class === classFilter);
    if (search) {
      const lower = search.toLowerCase();
      res = res.filter(s => 
        s.name.toLowerCase().includes(lower) || 
        s.id.toLowerCase().includes(lower) ||
        s.fatherName.toLowerCase().includes(lower)
      );
    }
    setFilteredStudents(res);
  }, [search, classFilter, students]);

  const loadData = async () => {
    const [sList, fList] = await Promise.all([api.getStudents(), api.getFeesConfig()]);
    setStudents(sList);
    setFeesConfig(fList);
  };

  const handleClassChange = (cls: string) => {
    const fee = feesConfig.find(f => f.className === cls);
    setFormData(prev => ({
      ...prev,
      class: cls,
      currentYearFee: fee ? fee.annualFee : 0
    }));
  };

  const handleSave = async () => {
    if (!formData.id || !formData.name || !formData.class) return alert("Required fields missing");
    
    const studentPayload: Student = {
        ...formData as Student,
        previousPending: formData.previousPending || []
    };

    try {
      if (editingId) {
        await api.updateStudent(studentPayload);
      } else {
        await api.addStudent(studentPayload);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const promptDelete = (id: string) => {
      setDeleteConfirm({ isOpen: true, studentId: id });
  };

  const confirmDelete = async () => {
      if (deleteConfirm.studentId) {
        await api.deleteStudent(deleteConfirm.studentId);
        loadData();
        setDeleteConfirm({ isOpen: false, studentId: null });
      }
  };

  const openEdit = (s: Student) => {
    setEditingId(s.id);
    setFormData(JSON.parse(JSON.stringify(s))); // Deep copy
    setIsModalOpen(true);
  };

  const openNew = () => {
    setEditingId(null);
    const defaultFee = feesConfig.find(f => f.className === 'LKG')?.annualFee || 0;
    setFormData({ ...initialForm, currentYearFee: defaultFee });
    setIsModalOpen(true);
  };

  const addPendingRow = () => {
    if (!prevPendingInput.year || prevPendingInput.amount <= 0) return;
    setFormData(prev => ({
      ...prev,
      previousPending: [...(prev.previousPending || []), { ...prevPendingInput }]
    }));
    setPrevPendingInput({ year: '', amount: 0 });
  };

  const removePendingRow = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      previousPending: prev.previousPending?.filter((_, i) => i !== idx)
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Students</h2>
        {user?.role === 'admin' && (
          <button onClick={openNew} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
            <Plus size={18} /> Add Student
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by name, ID, or father's name..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="text-slate-400" size={18} />
          <select 
            className="border border-slate-200 rounded-lg px-3 py-2 outline-none"
            value={classFilter}
            onChange={e => setClassFilter(e.target.value)}
          >
            <option value="">All Classes</option>
            {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 font-medium text-slate-900">
              <tr>
                <th className="px-6 py-4">Adm No</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Class</th>
                <th className="px-6 py-4">Outstanding</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map(s => {
                const totalDue = (s.currentYearFee - s.paidAmount) + s.previousPending.reduce((a,b) => a+b.amount, 0);
                return (
                  <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium">{s.id}</td>
                    <td className="px-6 py-4">
                      <div 
                        onClick={() => onNavigate('payments', s.id)}
                        className="font-medium text-blue-600 cursor-pointer hover:underline text-base"
                      >
                        {s.name}
                      </div>
                      <div className="text-xs text-slate-400">F: {s.fatherName}</div>
                    </td>
                    <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-slate-100 rounded text-xs font-medium">{s.class}</span>
                    </td>
                    <td className="px-6 py-4 text-red-600 font-medium">
                      ${totalDue.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      {totalDue === 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Due
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {user?.role !== 'parent' && (
                        <button onClick={() => openEdit(s)} className="text-blue-600 hover:text-blue-800">
                          <Edit2 size={16} />
                        </button>
                      )}
                       {user?.role === 'admin' && (
                        <button onClick={() => promptDelete(s.id)} className="text-red-600 hover:text-red-800">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">No students found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm.isOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
              <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 mx-auto mb-4">
                      <AlertTriangle size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-center text-slate-900 mb-2">Delete Student Record?</h3>
                  <p className="text-center text-slate-500 text-sm mb-6">
                      Are you sure you want to delete this student? This action cannot be undone and all fee history will be lost.
                  </p>
                  <div className="flex gap-3">
                      <button 
                        onClick={() => setDeleteConfirm({isOpen: false, studentId: null})}
                        className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors"
                      >
                          Cancel
                      </button>
                      <button 
                        onClick={confirmDelete}
                        className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
                      >
                          Delete
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Edit/Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">
                {editingId ? 'Edit Student' : 'Add New Student'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Admission No *</label>
                  <input 
                    disabled={!!editingId}
                    className="w-full p-2 border rounded bg-slate-50"
                    value={formData.id}
                    onChange={e => setFormData({...formData, id: e.target.value})}
                  />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
                   <input type="date" className="w-full p-2 border rounded" 
                    value={formData.dob}
                    onChange={e => setFormData({...formData, dob: e.target.value})}
                   />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Student Name *</label>
                  <input className="w-full p-2 border rounded" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Class (Current)</label>
                   <select className="w-full p-2 border rounded"
                    value={formData.class}
                    onChange={e => handleClassChange(e.target.value)}
                   >
                     {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                   </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Father's Name</label>
                  <input className="w-full p-2 border rounded" 
                    value={formData.fatherName}
                    onChange={e => setFormData({...formData, fatherName: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mother's Name</label>
                  <input className="w-full p-2 border rounded" 
                    value={formData.motherName}
                    onChange={e => setFormData({...formData, motherName: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                 <label className="block text-sm font-bold text-slate-800 mb-2">
                    Current Year Fee ({ACADEMIC_YEAR})
                 </label>
                 <input 
                   type="number"
                   className="w-full md:w-1/2 p-2 border rounded"
                   value={formData.currentYearFee}
                   onChange={e => setFormData({...formData, currentYearFee: Number(e.target.value)})}
                 />
                 <p className="text-xs text-slate-500 mt-1">
                    Automatically fetched from fee config. Can be overridden for scholarships.
                 </p>
              </div>

              <div className="pt-4 border-t border-slate-100">
                 <label className="block text-sm font-bold text-slate-800 mb-2">Previous Year Dues</label>
                 <div className="space-y-2 mb-2">
                   {formData.previousPending?.map((p, idx) => (
                     <div key={idx} className="flex items-center gap-2 bg-red-50 p-2 rounded">
                       <span className="flex-1 text-sm font-medium">{p.year}</span>
                       <span className="font-bold text-red-700">${p.amount}</span>
                       <button onClick={() => removePendingRow(idx)} className="text-red-400 hover:text-red-600">
                         <X size={14} />
                       </button>
                     </div>
                   ))}
                 </div>
                 <div className="flex gap-2">
                    <input 
                      placeholder="Year (e.g. 2023-24)"
                      className="flex-1 p-2 border rounded text-sm"
                      value={prevPendingInput.year}
                      onChange={e => setPrevPendingInput({...prevPendingInput, year: e.target.value})}
                    />
                    <input 
                      type="number"
                      placeholder="Amount"
                      className="w-32 p-2 border rounded text-sm"
                      value={prevPendingInput.amount || ''}
                      onChange={e => setPrevPendingInput({...prevPendingInput, amount: Number(e.target.value)})}
                    />
                    <button 
                        type="button"
                        onClick={addPendingRow}
                        className="bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded text-sm font-medium"
                    >
                        Add
                    </button>
                 </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2">
                <Save size={18} /> Save Student
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};