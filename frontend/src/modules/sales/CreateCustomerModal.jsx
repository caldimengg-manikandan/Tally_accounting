import React from 'react';
import { X, User } from 'lucide-react';
import CustomerForm from './CustomerForm';

const CreateCustomerModal = ({ isOpen, onClose, onSuccess, customerToEdit = null }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose} 
      />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-6xl h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20 flex flex-col">
        {/* Header - Fixed */}
        <header className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#1e61f0] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                 <User size={24} strokeWidth={2.5}/>
              </div>
              <div>
                 <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                    {customerToEdit ? 'Modify Profile' : 'New Customer'}
                 </h2>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Unified CRM Infrastructure</p>
              </div>
           </div>
           <button 
             onClick={onClose} 
             className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 hover:text-slate-900 transition-all shadow-sm"
           >
              <X size={20}/>
           </button>
        </header>

        {/* Form Content - Scrollable */}
        <div className="flex-1 overflow-hidden relative">
          <CustomerForm 
            standalone={false}
            customerToEdit={customerToEdit}
            onSaveSuccess={(data) => {
                if (onSuccess) onSuccess(data);
                onClose();
            }}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
};

export default CreateCustomerModal;
