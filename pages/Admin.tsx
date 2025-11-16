import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { FeeStructure, User, UserRole } from '../types';
import { Save, Plus, Trash2, Edit2, Shield, User as UserIcon, Key, X } from 'lucide-react';
import { useAuth } from '../components/AuthContext';

export const Admin: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'fees' | 'users'>('fees');
  
  // Fees State
  const [fees, setFees] = useState<FeeStructure[]>([]);
  const [loadingFees, setLoadingFees] = useState(true);

  // Users State
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // User Form State
  const initialUserForm = { name: '', username: '', password: '', role: 'teacher' as UserRole };
  const [userForm, setUserForm] = useState(initialUserForm);

  useEffect(() => {
    loadFees();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') loadUsers();
  }, [activeTab]);

  const loadFees = async () => {
    setLoadingFees(true);
    const f = await api.getFeesConfig();
    setFees(f);
    setLoadingFees(false);
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    const u = await api.getUsers();
    setUsers(u);
    setLoadingUsers(false);
  };

  const handleFeeUpdate = async (index: number, newVal: number) => {
      const updated = [...fees];
      updated[index].annualFee = newVal;
      setFees(updated);
      await api.updateFeeConfig(updated[index]);
  };

  const openUserModal = (u?: User) => {
      if (u) {
          setEditingUser(u);
          setUserForm({ name: u.name, username: u.username, role: u.role, password: '' });
      } else {
          setEditingUser(null);
          setUserForm(initialUserForm);
      }
      setIsUserModalOpen(true);
  };

  const handleSaveUser = async () => {
      if (!userForm.name || !userForm.username) return alert("Name and Username are required");
      if (!editingUser && !userForm.password) return alert("Password is required for new users");

      try {
          await api.saveUser({
              id: editingUser?.id || '',
              name: userForm.name,
              username: userForm.username,
              role: userForm.role,
              password: userForm.password
          });
          setIsUserModalOpen(false);
          loadUsers();
      } catch (e: any) {
          alert(e.message);
      }
  };

  const handleDeleteUser = async (id: string) => {
      if (window.confirm("Are you sure you want to delete this user?")) {
          await api.deleteUser(id);
          loadUsers();
      }
  };

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-800">Administration</h2>
            
            {/* Tabs */}
            <div className="flex bg-white rounded-lg p-1 shadow-sm border border-slate-200">
                <button 
                    onClick={() => setActiveTab('fees')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === 'fees' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                >
                    Fee Configuration
                </button>
                <button 
                    onClick={() => setActiveTab('users')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === 'users' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                >
                    User Management
                </button>
            </div>
        </div>

        {activeTab === 'fees' && (
            <div className="animate-in fade-in slide-in-from-bottom-2">
                <p className="text-slate-500 mb-6">Set base annual fees for the current academic year. Updates affect new admissions defaults.</p>
                {loadingFees ? (
                    <div>Loading...</div>
                ) : (
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
                                            onClick={() => handleFeeUpdate(idx, fee.annualFee)}
                                            className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                            title="Save"
                                        >
                                            <Save size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        {activeTab === 'users' && (
            <div className="animate-in fade-in slide-in-from-bottom-2">
                <div className="flex justify-between items-center mb-6">
                    <p className="text-slate-500">Manage system access and roles.</p>
                    <button 
                        onClick={() => openUserModal()}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 font-medium"
                    >
                        <Plus size={18} /> Add User
                    </button>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
                            <tr>
                                <th className="px-6 py-4 font-medium">Name</th>
                                <th className="px-6 py-4 font-medium">Username</th>
                                <th className="px-6 py-4 font-medium">Role</th>
                                <th className="px-6 py-4 text-right font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {users.map(u => (
                                <tr key={u.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-slate-900">{u.name}</td>
                                    <td className="px-6 py-4 text-slate-600">{u.username}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                            ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 
                                              u.role === 'accountant' ? 'bg-blue-100 text-blue-700' : 
                                              'bg-slate-100 text-slate-700'}`}>
                                            {u.role === 'admin' && <Shield size={12} />}
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <button 
                                            onClick={() => openUserModal(u)}
                                            className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-md transition-colors" 
                                            title="Edit User"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        {u.id !== currentUser?.id && (
                                            <button 
                                                onClick={() => handleDeleteUser(u.id)}
                                                className="text-red-600 hover:bg-red-50 p-1.5 rounded-md transition-colors"
                                                title="Delete User"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* User Modal */}
        {isUserModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            {editingUser ? <Edit2 size={18} /> : <Plus size={18} />}
                            {editingUser ? 'Edit User' : 'Add New User'}
                        </h3>
                        <button onClick={() => setIsUserModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                            <div className="relative">
                                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input 
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="e.g. John Doe"
                                    value={userForm.name}
                                    onChange={e => setUserForm({...userForm, name: e.target.value})}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                            <input 
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50"
                                placeholder="login_id"
                                value={userForm.username}
                                disabled={!!editingUser}
                                onChange={e => setUserForm({...userForm, username: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                {editingUser ? 'New Password (Optional)' : 'Password'}
                            </label>
                            <div className="relative">
                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input 
                                    type="password"
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder={editingUser ? "Leave blank to keep current" : "Secret123"}
                                    value={userForm.password}
                                    onChange={e => setUserForm({...userForm, password: e.target.value})}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                            <select 
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                value={userForm.role}
                                onChange={e => setUserForm({...userForm, role: e.target.value as UserRole})}
                            >
                                <option value="admin">Admin</option>
                                <option value="accountant">Accountant</option>
                                <option value="teacher">Teacher</option>
                                <option value="parent">Parent</option>
                            </select>
                        </div>
                    </div>
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                        <button 
                            onClick={() => setIsUserModalOpen(false)} 
                            className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSaveUser} 
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2 transition-colors"
                        >
                            <Save size={18} /> Save User
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};