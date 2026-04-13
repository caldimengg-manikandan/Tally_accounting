import React from 'react';
import { X } from 'lucide-react';
import VendorForm from './VendorForm';

const VendorModal = ({ isOpen, onClose, onSaveSuccess }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col relative animate-in fade-in zoom-in duration-200">
        <header className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 text-blue-600 font-bold text-[10px]">V</div>
             </div>
             <h2 className="text-lg font-bold text-slate-800">New Vendor</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors"
          >
            <X size={20} />
          </button>
        </header>
        
        <div className="flex-1 overflow-hidden relative">
          <VendorForm 
             standalone={false} 
             onSaveSuccess={onSaveSuccess} 
             onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
};

export default VendorModal;
