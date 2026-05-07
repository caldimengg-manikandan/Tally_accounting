import React from 'react';
import { Settings, RefreshCw, ArrowLeftRight, Target, Shield, Construction } from 'lucide-react';

const AccountantSubModule = ({ title, icon: Icon, description }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-20 animate-fade-in text-center space-y-8 min-h-[60vh]">
      <div className="w-24 h-24 bg-blue-50 rounded-[2.5rem] flex items-center justify-center text-blue-600 shadow-xl shadow-blue-100/50">
        <Icon size={48} strokeWidth={1.5} />
      </div>
      
      <div className="space-y-3 max-w-lg">
        <div className="flex items-center justify-center gap-3">
           <Construction size={18} className="text-amber-500" />
           <h3 className="text-[11px] font-bold text-amber-500 uppercase tracking-[0.3em]">Module in Development</h3>
        </div>
        <h1 className="text-4xl font-bold text-slate-800 tracking-tighter">{title}</h1>
        <p className="text-[15px] font-medium text-slate-400 leading-relaxed">
          {description || "We're currently building a powerful dashboard for this sub-module. Check back soon for advanced financial management tools."}
        </p>
      </div>

      <div className="flex gap-4 pt-4">
         <button className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold text-[11px] uppercase tracking-widest hover:-translate-y-0.5 transition-all shadow-xl shadow-slate-200">
           Notify Me on Launch
         </button>
         <button disabled className="px-8 py-3 bg-white border border-slate-100 text-slate-300 rounded-xl font-bold text-[11px] uppercase tracking-widest">
           View documentation
         </button>
      </div>

      {/* Decorative Elements */}
      <div className="grid grid-cols-3 gap-8 pt-12 opacity-30">
          {[1,2,3].map(i => (
            <div key={i} className="h-1 bg-slate-100 w-16 rounded-full" />
          ))}
      </div>
    </div>
  );
};

import BudgetsView from './BudgetsView';

export { BudgetsView };
export const TransactionLockingView = () => <AccountantSubModule title="Transaction Locking" icon={Shield} description="Freeze transactions for specific periods to ensure data integrity during audits or financial closures." />;

export default AccountantSubModule;
