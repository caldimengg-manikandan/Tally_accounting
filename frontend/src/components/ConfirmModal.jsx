import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Delete", cancelText = "Cancel", type = "danger" }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      ></div>

      {/* Modal Container */}
      <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl shadow-slate-900/20 animate-in zoom-in-95 fade-in duration-300 overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="px-8 pt-8 pb-4 flex items-center justify-between">
           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${type === 'danger' ? 'bg-rose-50 text-rose-500' : 'bg-blue-50 text-blue-500'}`}>
              <AlertTriangle size={24} />
           </div>
           <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
              <X size={20} />
           </button>
        </div>

        {/* Content */}
        <div className="px-8 pb-8">
           <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">{title || 'Confirm Action'}</h3>
           <p className="text-[14px] text-slate-500 font-medium leading-relaxed">
              {message || 'Are you sure you want to proceed with this action? This cannot be undone.'}
           </p>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-slate-50/50 flex items-center gap-3 border-t border-slate-100">
           <button 
             onClick={onClose}
             className="flex-1 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[13px] font-bold hover:bg-slate-50 transition-all uppercase tracking-widest"
           >
              {cancelText}
           </button>
           <button 
             onClick={() => {
                onConfirm();
                onClose();
             }}
             className={`flex-1 px-6 py-3 text-white rounded-2xl text-[13px] font-black transition-all shadow-lg uppercase tracking-widest
               ${type === 'danger' ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20' : 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/20'}`}
           >
              {confirmText}
           </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
