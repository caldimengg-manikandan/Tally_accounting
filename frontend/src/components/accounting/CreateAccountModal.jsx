import React, { useState, useEffect } from 'react';
import { X, HelpCircle, ChevronDown } from 'lucide-react';
import { groupAPI, ledgerAPI } from '../../services/api';

const CreateAccountModal = ({ isOpen, onClose, onSuccess, initialType = 'Cost Of Goods Sold' }) => {
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    groupId: '',
    description: '',
    subAccount: false,
    parentGroupId: '',
    accountCode: ''
  });

  const companyId = localStorage.getItem('companyId');

  useEffect(() => {
    if (isOpen) {
      fetchGroups();
    }
  }, [isOpen]);

  const fetchGroups = async () => {
    try {
      const res = await groupAPI.getByCompany(companyId);
      const fetchedGroups = res.data || [];
      setGroups(fetchedGroups);
      
      // Attempt to pre-select a group matching the initialType
      const match = fetchedGroups.find(g => g.name.toLowerCase() === initialType.toLowerCase());
      if (match) {
        setFormData(prev => ({ ...prev, groupId: match.id }));
      }
    } catch (err) {
      console.error("Error fetching groups:", err);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!formData.name || !formData.groupId) {
      alert("Please enter the Account Name and select an Account Type.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        groupId: formData.groupId,
        description: formData.description || '',
        CompanyId: companyId
      };
      
      const res = await ledgerAPI.create(payload);
      // Notify parent of success with the new account name
      onSuccess(formData.name);
      onClose();
      // Reset form
      setFormData({ name: '', groupId: '', description: '', subAccount: false, parentGroupId: '', accountCode: '' });
    } catch (err) {
      alert("Error creating account: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in shadow-2xl">
        <div className="bg-white w-full max-w-[760px] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden animate-slide-up flex flex-col border border-slate-200">
            {/* Header */}
            <div className="flex justify-between items-center px-8 py-4 border-b border-slate-100">
                <h2 className="text-[18px] font-bold text-slate-800 tracking-tight">Create Account</h2>
                <button onClick={onClose} className="p-1 hover:bg-red-50 rounded-lg transition-all text-slate-400 hover:text-red-500">
                    <X size={20} />
                </button>
            </div>

            {/* Content Body */}
            <div className="flex flex-1 p-8 gap-10 bg-white">
                {/* Form Section */}
                <form id="create-account-form" onSubmit={handleSubmit} className="flex-1 space-y-5">
                    {/* Account Type */}
                    <div className="flex gap-6 items-center">
                        <label className="w-28 text-[12.5px] font-bold text-red-500">Account Type*</label>
                        <div className="flex-1 relative">
                            <select 
                              required
                              value={formData.groupId}
                              onChange={(e) => setFormData({...formData, groupId: e.target.value})}
                              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-[13.5px] outline-none focus:border-blue-500 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C/polyline%3E%3C/svg%3E')] bg-[length:14px] bg-[right_12px_center] bg-no-repeat shadow-sm transition-all bg-white"
                            >
                                <option value="">Select Account Type</option>
                                {groups.map(g => (
                                    <option key={g.id} value={g.id}>{g.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Account Name */}
                    <div className="flex gap-6 items-center">
                        <label className="w-28 text-[12.5px] font-bold text-red-500">Account Name*</label>
                        <input 
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="flex-1 border border-slate-200 rounded-lg px-3 py-2.5 text-[13.5px] outline-none focus:border-blue-500 shadow-sm transition-all"
                        />
                    </div>

                    {/* Sub-account Checkbox */}
                    <div className="flex gap-6 items-start">
                        <div className="w-28"></div>
                        <div className="flex-1">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input 
                                  type="checkbox" 
                                  checked={formData.subAccount}
                                  onChange={(e) => setFormData({...formData, subAccount: e.target.checked})}
                                  className="w-4 h-4 accent-blue-600 rounded cursor-pointer" 
                                />
                                <span className="text-[13px] text-slate-600 group-hover:text-slate-900 transition-colors">Make this a sub-account</span>
                                <HelpCircle size={14} className="text-slate-400 group-hover:text-slate-600 transition-colors"/>
                            </label>
                        </div>
                    </div>

                    {/* Account Code */}
                    <div className="flex gap-6 items-center">
                        <label className="w-28 text-[12.5px] font-bold text-slate-500 border-b border-dashed border-slate-300 pb-0.5">Account Code</label>
                        <input 
                          value={formData.accountCode}
                          onChange={(e) => setFormData({...formData, accountCode: e.target.value})}
                          className="w-40 border border-slate-200 rounded-lg px-3 py-2.5 text-[13.5px] outline-none focus:border-blue-500 shadow-sm transition-all"
                        />
                    </div>

                    {/* Description */}
                    <div className="flex gap-6 items-start">
                        <label className="w-28 text-[12.5px] font-bold text-slate-500">Description</label>
                        <textarea 
                          value={formData.description}
                          onChange={(e) => setFormData({...formData, description: e.target.value})}
                          placeholder="Max. 500 characters"
                          className="flex-1 border border-slate-200 rounded-lg px-3 py-2 h-20 text-[13.5px] outline-none focus:border-blue-500 shadow-sm resize-none transition-all placeholder:text-slate-400"
                        />
                    </div>
                </form>

                {/* Info Card Section (Right Panel) */}
                <div className="w-[280px] shrink-0">
                    <div className="relative bg-[#1c212d] text-white p-6 rounded-xl shadow-2xl border border-slate-700 animate-fade-in-right">
                        {/* Bubble tail */}
                        <div className="absolute -left-1.5 top-8 w-3 h-3 bg-[#1c212d] rotate-45 border-l border-b border-slate-700"></div>
                        
                        <h3 className="text-[14px] font-bold mb-3 tracking-tight">Expense</h3>
                        
                        <p className="text-[12px] text-slate-400 leading-relaxed mb-4">
                            This indicates the direct costs attributable to the production of the goods sold by a company such as:
                        </p>
                        
                        <ul className="text-[12px] text-slate-400 space-y-2 list-disc pl-5 font-medium">
                            <li>Material and Labor costs</li>
                            <li>Cost of obtaining raw materials</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="px-8 py-5 bg-slate-50/80 border-t border-slate-100 flex gap-3">
                <button 
                  type="submit"
                  form="create-account-form"
                  disabled={loading}
                  className="px-6 py-2 bg-[#1e61f0] text-white rounded-lg text-[13px] font-bold hover:bg-[#1a54d1] shadow-xl shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50"
                >
                    {loading ? 'Processing...' : 'Save and Select'}
                </button>
                <button 
                  onClick={onClose}
                  className="px-6 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-[13px] font-bold hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
                >
                    Cancel
                </button>
            </div>
        </div>
    </div>
  );
};

export default CreateAccountModal;
