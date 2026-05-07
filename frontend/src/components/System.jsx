import React from 'react';
import { X, Search, Command, PlusCircle, BookOpen, Receipt, TrendingUp } from 'lucide-react';

export const CommandPalette = ({ isOpen, onClose, setActiveTab }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[300] flex items-start justify-center pt-24 backdrop-blur-sm bg-ink-900/40 px-6">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-float border border-gray-100 overflow-hidden animate-fade-scale">
        <div className="flex items-center gap-4 p-6 border-b border-gray-100">
           <Search size={24} className="text-gray-400" />
           <input autoFocus placeholder="Search ledger, voucher..." className="flex-1 bg-transparent border-none outline-none text-lg font-medium text-ink-900" />
           <div className="flex items-center gap-1 bg-surface-100 px-2 py-1 rounded text-[10px] font-bold text-ink-400">
              <Command size={10} /> <span>ESC</span>
           </div>
        </div>
        <div className="p-4 max-h-[400px] overflow-y-auto">
           {[
             { label: 'Create Sales Voucher', tab: 'Vouchers', icon: PlusCircle },
             { label: 'View Balance Sheet', tab: 'Balance Sheet', icon: BookOpen },
             { label: 'Generate GST Report', tab: 'GST Invoices', icon: Receipt },
             { label: 'Tally AI Assistant', tab: 'AI Scanner', icon: TrendingUp },
           ].map((item, i) => (
             <div key={i} onClick={() => { setActiveTab(item.tab); onClose(); }} className="flex items-center justify-between p-4 hover:bg-primary-50 rounded-2xl cursor-pointer group transition-all">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-surface-50 rounded-xl flex items-center justify-center text-ink-400 group-hover:bg-primary-100 group-hover:text-primary-600 transition-colors">
                      <item.icon size={20} />
                   </div>
                   <span className="font-bold text-ink-700 group-hover:text-ink-900">{item.label}</span>
                </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};

export const CalculatorModule = ({ isOpen }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed bottom-24 right-8 w-80 bg-white rounded-3xl shadow-float border border-gray-100 z-[150] overflow-hidden animate-slide-up">
      <div className="bg-primary-600 p-4 text-white flex justify-between items-center font-bold text-[10px] uppercase tracking-widest">
        <span>Tally Calculator</span> <span>Ctrl + N</span>
      </div>
      <div className="p-6">
        <div className="bg-surface-50 p-4 rounded-xl text-right mb-4">
          <p className="text-2xl font-bold text-ink-900">₹4,307</p>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {['7','8','9','/','4','5','6','*','1','2','3','-','C','0','=','+'].map(val => (
            <button key={val} className="h-10 flex items-center justify-center font-bold text-ink-700 bg-surface-100 rounded-lg hover:bg-primary-50 hover:text-primary-600 transition-all">{val}</button>
          ))}
        </div>
      </div>
    </div>
  );
};
