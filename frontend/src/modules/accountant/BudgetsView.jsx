import React, { useState } from 'react';
import { 
  Plus, X, ChevronDown, 
  Info, Target, Layout,
  Settings, Check, Search
} from 'lucide-react';

const BudgetsView = ({ showNew }) => {
  const [isCreating, setIsCreating] = useState(showNew || false);
  const [isFiscalDropdownOpen, setIsFiscalDropdownOpen] = useState(false);
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    fiscalYear: 'Apr 2026 - Mar 2027',
    period: 'Monthly'
  });

  if (!isCreating) {
    return (
      <div className="flex-1 flex flex-col bg-white min-h-screen animate-fade-in">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
           <h1 className="text-[18px] font-bold text-slate-800">Budgets</h1>
           <button 
             onClick={() => setIsCreating(true)}
             className="px-3 py-1.5 bg-blue-500 text-white rounded font-medium text-[13px] hover:bg-blue-600 transition-all flex items-center gap-1.5"
           >
              <Plus size={16} /> New
           </button>
        </div>

        {/* Empty State */}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
           <div className="max-w-2xl text-center space-y-6">
              <h2 className="text-[22px] font-medium text-slate-800">
                 Budget your business finance. Stay on top of your expenses.
              </h2>
              <p className="text-[13px] text-slate-500 leading-relaxed px-12">
                 Create budgets for the various activities of your business, compare them with the actuals, and see how your business is performing.
              </p>
              <button 
                onClick={() => setIsCreating(true)}
                className="px-8 py-2.5 bg-blue-500 text-white rounded font-bold text-[13px] hover:bg-blue-600 transition-all uppercase tracking-wide"
              >
                Create Budget
              </button>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white min-h-screen flex flex-col animate-fade-in">
      {/* Header */}
      <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
        <h1 className="text-[18px] font-bold text-slate-800">New Budget</h1>
        <button 
          onClick={() => setIsCreating(false)}
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl px-8 py-10 space-y-12">
          
          <div className="space-y-8">
            {/* Name */}
            <div className="grid grid-cols-12 items-center gap-4">
              <div className="col-span-2">
                <label className="text-[13px] font-medium text-rose-500 underline decoration-dotted">Name*</label>
              </div>
              <div className="col-span-6">
                <input 
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-blue-400 rounded outline-none text-[13px] shadow-[0_0_0_2px_rgba(59,130,246,0.1)] transition-all"
                  autoFocus
                />
              </div>
            </div>

            {/* Fiscal Year */}
            <div className="grid grid-cols-12 items-center gap-4">
              <div className="col-span-2">
                <label className="text-[13px] font-medium text-rose-500 underline decoration-dotted">Fiscal Year*</label>
              </div>
              <div className="col-span-3">
                <div className="relative">
                  <div 
                    onClick={() => setIsFiscalDropdownOpen(!isFiscalDropdownOpen)}
                    className={`w-full px-3 py-2 border rounded text-[13px] cursor-pointer flex items-center justify-between transition-all bg-white
                      ${isFiscalDropdownOpen ? 'border-blue-400 ring-2 ring-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <span className="text-slate-700">{formData.fiscalYear}</span>
                    <ChevronDown size={14} className={`text-slate-400 transition-transform ${isFiscalDropdownOpen ? 'rotate-180 text-blue-500' : ''}`} />
                  </div>

                  {isFiscalDropdownOpen && (
                    <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded shadow-xl z-50 animate-fade-in py-2">
                       <div className="px-3 pb-2 border-b border-slate-50">
                          <div className="relative">
                             <Search size={12} className="absolute left-2.5 top-2.5 text-slate-400" />
                             <input 
                               type="text"
                               placeholder="Search"
                               className="w-full pl-8 pr-3 py-1.5 border border-blue-400 rounded text-[12px] outline-none"
                               autoFocus
                             />
                          </div>
                       </div>
                       <div className="max-h-60 overflow-auto py-1">
                          {[
                            'Apr 2024 - Mar 2025',
                            'Apr 2025 - Mar 2026',
                            'Apr 2026 - Mar 2027',
                            'Apr 2027 - Mar 2028',
                            'Apr 2028 - Mar 2029'
                          ].map(year => (
                            <div 
                              key={year}
                              onClick={() => {
                                setFormData({...formData, fiscalYear: year});
                                setIsFiscalDropdownOpen(false);
                              }}
                              className={`px-3 py-2 text-[12px] cursor-pointer flex items-center justify-between transition-colors
                                ${formData.fiscalYear === year 
                                  ? 'bg-[#408dfb] text-white font-medium' 
                                  : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                               {year}
                               {formData.fiscalYear === year && <Check size={14} />}
                            </div>
                          ))}
                       </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Budget Period */}
            <div className="grid grid-cols-12 items-center gap-4">
              <div className="col-span-2">
                <label className="text-[13px] font-medium text-rose-500 underline decoration-dotted">Budget Period*</label>
              </div>
              <div className="col-span-3">
                <div className="relative">
                   <div 
                    onClick={() => setIsPeriodDropdownOpen(!isPeriodDropdownOpen)}
                    className={`w-full px-3 py-2 border rounded text-[13px] cursor-pointer flex items-center justify-between transition-all bg-white
                      ${isPeriodDropdownOpen ? 'border-blue-400 ring-2 ring-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <span className="text-slate-700">{formData.period}</span>
                    <ChevronDown size={14} className={`text-slate-400 transition-transform ${isPeriodDropdownOpen ? 'rotate-180 text-blue-500' : ''}`} />
                  </div>

                  {isPeriodDropdownOpen && (
                    <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded shadow-xl z-50 animate-fade-in py-2">
                       <div className="px-3 pb-2 border-b border-slate-50">
                          <div className="relative">
                             <Search size={12} className="absolute left-2.5 top-2.5 text-slate-400" />
                             <input 
                               type="text"
                               placeholder="Search"
                               className="w-full pl-8 pr-3 py-1.5 border border-blue-400 rounded text-[12px] outline-none"
                               autoFocus
                             />
                          </div>
                       </div>
                       <div className="max-h-60 overflow-auto py-1">
                          {[
                            'Monthly',
                            'Quarterly',
                            'Half-yearly',
                            'Yearly'
                          ].map(period => (
                            <div 
                              key={period}
                              onClick={() => {
                                setFormData({...formData, period: period});
                                setIsPeriodDropdownOpen(false);
                              }}
                              className={`px-3 py-2 text-[12px] cursor-pointer flex items-center justify-between transition-colors
                                ${formData.period === period 
                                  ? 'bg-[#408dfb] text-white font-medium' 
                                  : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                               {period}
                               {formData.period === period && <Check size={14} />}
                            </div>
                          ))}
                       </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Accounts Sections */}
          <div className="space-y-8">
             <div className="space-y-4">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">P/L Accounts</p>
                
                {/* Income Accounts */}
                <div className="grid grid-cols-12 items-start gap-4">
                   <div className="col-span-2 py-2">
                      <span className="text-[13px] text-slate-600">Income Accounts</span>
                   </div>
                   <div className="col-span-6">
                      <button className="w-full p-6 border-2 border-dashed border-slate-100 rounded-lg flex items-center justify-center text-blue-600 text-[13px] font-medium hover:bg-slate-50 transition-colors group">
                         <span className="group-hover:underline">Add Accounts</span>
                      </button>
                   </div>
                </div>

                {/* Expense Accounts */}
                <div className="grid grid-cols-12 items-start gap-4">
                   <div className="col-span-2 py-2">
                      <span className="text-[13px] text-slate-600">Expense Accounts</span>
                   </div>
                   <div className="col-span-6">
                      <button className="w-full p-6 border-2 border-dashed border-slate-100 rounded-lg flex items-center justify-center text-blue-600 text-[13px] font-medium hover:bg-slate-50 transition-colors group">
                         <span className="group-hover:underline">Add Accounts</span>
                      </button>
                   </div>
                </div>
             </div>

             <button className="flex items-center gap-2 text-blue-600 text-[13px] font-medium hover:underline group">
                <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center text-white">
                   <Plus size={12} strokeWidth={4} />
                </div>
                Include Asset, Liability, and Equity Accounts in Budget
             </button>
          </div>

        </div>
      </div>

      {/* Footer */}
      <div className="px-8 py-5 border-t border-slate-100 bg-white flex items-center gap-3">
         <button className="px-6 py-2 bg-blue-600 text-white rounded font-bold text-[13px] hover:bg-blue-700 transition-all shadow-md">
            Save
         </button>
         <button 
           onClick={() => setIsCreating(false)}
           className="px-6 py-2 bg-white border border-slate-200 text-slate-700 rounded font-bold text-[13px] hover:bg-slate-50 transition-all"
         >
            Cancel
         </button>
      </div>
    </div>
  );
};

export default BudgetsView;
