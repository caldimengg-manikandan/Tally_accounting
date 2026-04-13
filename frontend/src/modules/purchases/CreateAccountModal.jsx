import React, { useState } from 'react';
import { X, Info, HelpCircle } from 'lucide-react';

const CreateAccountModal = ({ onClose, onSave, accounts }) => {
  const [formData, setFormData] = useState({
    accountType: 'Fixed Asset',
    accountName: '',
    accountCode: '',
    description: ''
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = () => {
    if (!formData.accountName) {
      alert("Account Name is required");
      return;
    }
    // Simulate API call and return the new account object
    const newAccount = {
      id: Date.now().toString(),
      name: formData.accountName,
      category: formData.accountType
    };
    onSave(newAccount);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[550px] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
          <h2 className="text-[18px] font-bold text-slate-800">Create Account</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-1 min-h-[400px]">
          {/* Form Side */}
          <div className="flex-1 p-8 space-y-8 overflow-y-auto">
            
            {/* Account Type */}
            <div className="grid grid-cols-[160px_1fr] items-center gap-6">
              <label className="text-[14px] font-medium text-red-500">Account Type*</label>
              <select 
                name="accountType"
                value={formData.accountType}
                onChange={handleChange}
                className="w-full h-11 px-4 text-[14px] border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all appearance-none bg-white font-medium"
              >
                <optgroup label="Asset" className="font-bold text-slate-900">
                  <option value="Asset">Asset</option>
                  <option value="Other Asset">Other Asset</option>
                  <option value="Other Current Asset">Other Current Asset</option>
                  <option value="Fixed Asset">Fixed Asset</option>
                  <option value="Intangible Asset">Intangible Asset</option>
                  <option value="Non Current Asset">Non Current Asset</option>
                </optgroup>

                <optgroup label="Liability" className="font-bold text-slate-900">
                  <option value="Liability">Liability</option>
                  <option value="Other Current Liability">Other Current Liability</option>
                  <option value="Non Current Liability">Non Current Liability</option>
                  <option value="Other Liability">Other Liability</option>
                </optgroup>

                <optgroup label="Expense" className="font-bold text-slate-900">
                  <option value="Expense">Expense</option>
                  <option value="Cost Of Goods Sold">Cost Of Goods Sold</option>
                  <option value="Other Expense">Other Expense</option>
                </optgroup>
              </select>
            </div>

            {/* Account Name */}
            <div className="grid grid-cols-[160px_1fr] items-center gap-6">
              <label className="text-[14px] font-medium text-red-500">Account Name*</label>
              <input 
                type="text"
                name="accountName"
                value={formData.accountName}
                onChange={handleChange}
                className="w-full h-11 px-4 text-[14px] border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
              />
            </div>

            {/* Account Code */}
            <div className="grid grid-cols-[160px_1fr] items-center gap-6">
              <label className="text-[14px] font-medium text-slate-600 w-fit">Account Code</label>
              <input 
                type="text"
                name="accountCode"
                value={formData.accountCode}
                onChange={handleChange}
                className="w-[200px] h-11 px-4 text-[14px] border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
              />
            </div>

            {/* Description */}
            <div className="grid grid-cols-[160px_1fr] items-start gap-6 pt-2">
              <label className="text-[14px] font-medium text-slate-600 pt-3">Description</label>
              <textarea 
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full h-28 p-4 text-[14px] border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all resize-none"
                placeholder="Max. 500 characters"
              />
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-white flex items-center gap-3">
          <button 
            onClick={handleSave}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[14px] font-bold rounded-lg shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
          >
            Save and Select
          </button>
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-[14px] font-bold rounded-lg active:scale-95 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateAccountModal;
