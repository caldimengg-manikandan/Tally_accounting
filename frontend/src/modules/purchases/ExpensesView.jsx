import React, { useState, useEffect } from 'react';
import { 
  Plus, Wallet, RefreshCw, FileText, 
  ChevronDown, ArrowDownUp, Filter, MoreHorizontal,
  Play, CheckCircle2, LayoutList, MapPin, RotateCcw,
  User, Receipt, MousePointer2, ArrowRight, Check,
  ShoppingCart, BarChart3, RotateCw, Globe, Zap, ShieldCheck,
  CreditCard
} from 'lucide-react';
import { purchaseAPI } from '../../services/api';
import MileagePreferencesModal from './MileagePreferencesModal';

const ExpensesView = ({ companyId, initialTab = 'All Expenses' }) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab ] = useState(initialTab);
  const [showMileageModal, setShowMileageModal] = useState(false);

  // Sync activeTab with initialTab prop when navigating via sidebar
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (!companyId) return;
    const fetchExpenses = async () => {
      try {
        setLoading(true);
        const res = await purchaseAPI.getExpenses(companyId);
        setExpenses(res.data || []);
      } catch (err) {
        console.error("Failed to fetch expenses:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchExpenses();
  }, [companyId]);

  if (loading) return (
    <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
      <RefreshCw size={24} className="animate-spin text-[#1e61f0] mb-4" />
      <p className="text-slate-500 text-[14px]">Loading Expenses...</p>
    </div>
  );

  return (
    <>
    <div className="bg-white min-h-screen flex flex-col">
       {/* Tabbed Header */}
        <div className="flex items-center justify-between px-8 py-0 border-b border-slate-200 bg-white">
           <div className="flex items-center h-14">
              <button 
                onClick={() => setActiveTab('Receipts Inbox')}
                className={`text-[13px] font-semibold px-4 h-full transition-all border-b-2 ${activeTab === 'Receipts Inbox' ? 'text-blue-600 border-blue-600' : 'text-slate-600 border-transparent hover:text-slate-900'}`}
              >
                 Receipts Inbox
              </button>
              <button 
                onClick={() => setActiveTab('All Expenses')}
                className={`text-[13px] font-semibold px-4 h-full flex items-center gap-1.5 transition-all border-b-2 ${activeTab === 'All Expenses' ? 'text-blue-600 border-blue-600' : 'text-slate-600 border-transparent hover:text-slate-900'}`}
              >
                 All Expenses <ChevronDown size={14} className="mt-0.5" />
              </button>
              <button 
                onClick={() => setActiveTab('Recurring Expenses')}
                className={`text-[13px] font-semibold px-4 h-full transition-all border-b-2 ${activeTab === 'Recurring Expenses' ? 'text-blue-600 border-blue-600' : 'text-slate-600 border-transparent hover:text-slate-900'}`}
              >
                 Recurring Expenses
              </button>
           </div>
           <div className="flex items-center gap-2">

               <div className="flex items-center">
                  <button 
                     onClick={() => {
                        if (activeTab === 'Recurring Expenses') {
                           window.location.href = '/recurring-expenses/new';
                        } else {
                           window.location.href = '/expenses/new';
                        }
                     }} 
                     className="bg-[#1e61f0] hover:bg-[#1a54d1] text-white px-3 py-1.5 rounded text-[13px] font-bold flex items-center gap-1.5 transition-all shadow-sm"
                  >
                     <Plus size={16} strokeWidth={3}/> New
                  </button>
               </div>
            </div>
        </div>

       <div className="flex-1 overflow-auto">
          {activeTab === 'Recurring Expenses' ? (
             <div className="flex-1 flex flex-col items-center bg-white overflow-y-auto w-full">
                {/* Recurring Expenses Hero */}
                <div className="mt-16 w-full max-w-[800px] flex flex-col items-center text-center px-4">
                   <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-[#1e61f0] mb-6 shadow-sm border border-blue-100 italic">
                      <RotateCw size={32} />
                   </div>
                   <h2 className="text-[28px] font-bold text-slate-900 mb-3 italic tracking-tight">Set and Forget: Master Your Recurring Expenses</h2>
                   <p className="text-slate-500 text-[15px] mb-8 max-w-[600px] leading-relaxed">
                      Automate your regular business costs. From office rent to software subscriptions, 
                      stay ahead with automated recording and tracking.
                   </p>
                   
                   <button 
                     onClick={() => window.location.href = '/recurring-expenses/new'}
                     className="bg-[#1e61f0] hover:bg-[#1a54d1] text-white px-10 py-3 rounded text-[14px] font-bold transition-all shadow-lg active:scale-95 mb-16 uppercase tracking-wide"
                   >
                      Create Recurring Expense
                   </button>
                </div>

                {/* Interactive Lifecycle Section */}
                <div className="w-full max-w-[1100px] px-8 mb-24">
                   <div className="bg-slate-50 rounded-3xl p-12 border border-slate-200 shadow-inner relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                      
                      <div className="relative z-10 flex flex-col items-center">
                         <h3 className="text-[14px] font-black text-slate-400 uppercase tracking-[4px] mb-12 italic">Recurring Lifecycle</h3>
                         
                         <div className="flex items-center justify-between w-full relative">
                            {/* Connector Line */}
                            <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -translate-y-1/2 -z-10">
                               <div className="h-full bg-blue-500 w-full rounded-full opacity-30 shadow-[0_0_15px_rgba(30,97,240,0.5)]"></div>
                            </div>

                            <TimelineStep icon={<ShoppingCart size={20}/>} label="Spend" desc="Regular cost occurs" active />
                            <TimelineStep icon={<Plus size={20}/>} label="Record" desc="System auto-creates" active />
                            <TimelineStep icon={<Check size={20}/>} label="Approve" desc="Quick review" active />
                            <TimelineStep icon={<CreditCard size={20}/>} label="Pay" desc="Payment processed" active />
                            <TimelineStep icon={<BarChart3 size={20}/>} label="Track" desc="Usage monitored" active />
                            <TimelineStep icon={<RotateCw size={20}/>} label="Repeat" desc="Cycle starts over" active isLast />
                         </div>
                      </div>
                   </div>
                </div>

                {/* Benefits Section */}
                <div className="w-full max-w-[1000px] px-8 mb-32 grid grid-cols-3 gap-8">
                   <BenefitCard 
                      icon={<Zap size={24} className="text-amber-500" />} 
                      title="Total Automation" 
                      desc="Say goodbye to manual entry for utilities, rent, and monthly fees." 
                   />
                   <BenefitCard 
                      icon={<ShieldCheck size={24} className="text-emerald-500" />} 
                      title="100% Accuracy" 
                      desc="Consistent accounting entries every month with zero human error." 
                   />
                   <BenefitCard 
                      icon={<Globe size={24} className="text-blue-500" />} 
                      title="Smart Insights" 
                      desc="Project your future cash flow with accurate recurring cost data." 
                   />
                </div>
             </div>
          ) : expenses.length > 0 ? (
             <div className="p-8">
                <table className="w-full text-left">
                   <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200">
                      <tr>
                         <th className="px-6 py-4">Date</th>
                         <th className="px-6 py-4">Expense Account</th>
                         <th className="px-6 py-4">Reference#</th>
                         <th className="px-6 py-4">Vendor Name</th>
                         <th className="px-6 py-4">Paid Through</th>
                         <th className="px-6 py-4">Customer Name</th>
                         <th className="px-6 py-4">Status</th>
                         <th className="px-6 py-4 text-right">Amount</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      {expenses.map(exp => (
                        <tr key={exp.id} className="hover:bg-slate-50 transition-colors cursor-pointer group">
                           <td className="px-6 py-4 text-[14px] text-slate-600">{new Date(exp.date).toLocaleDateString()}</td>
                           <td className="px-6 py-4 text-[14px] font-medium text-slate-900">{exp.Ledger?.name || 'General Expense'}</td>
                           <td className="px-6 py-4 text-[14px] text-slate-600">{exp.voucherNumber}</td>
                           <td className="px-6 py-4 text-[14px] text-slate-600">{exp.vendorName || '-'}</td>
                           <td className="px-6 py-4 text-[14px] text-slate-600">{exp.paidThrough || '-'}</td>
                           <td className="px-6 py-4 text-[14px] text-slate-600">{exp.customerName || '-'}</td>
                           <td className="px-6 py-4 text-[14px]">
                              <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-600 text-[11px] font-bold uppercase">Paid</span>
                           </td>
                           <td className="px-6 py-4 text-right text-[14px] font-medium text-slate-900">₹ {parseFloat(exp.totalAmount || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          ) : (
             <div className="flex-1 flex flex-col items-center bg-white overflow-y-auto w-full">
                <div className="w-full max-w-[1000px] mt-12 mb-16 px-8">
                   <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xl shadow-slate-200/50">
                      {/* Red Title Box */}
                      <div className="p-1 items-center justify-center flex">
                        <div className="w-full bg-[#c53030] rounded-xl py-6 flex flex-col items-center justify-center border-4 border-[#e53e3e]/20 shadow-inner">
                           <h3 className="text-white text-[48px] font-black tracking-[4px] border-b-4 border-white pb-1 italic leading-none">EXPENSES</h3>
                        </div>
                      </div>

                      <div className="p-8 space-y-8">
                         {/* Definition Box */}
                         <div className="p-6 bg-white border-2 border-slate-100 rounded-xl relative group hover:border-[#c53030]/20 transition-colors">
                            <p className="text-[18px] text-slate-800 leading-relaxed font-serif italic text-center">
                               <span className="font-black text-[22px] not-italic font-sans mr-2">Expenses</span> 
                               can be defined as "Any cost that a company bears in an attempt to maximize its revenues, and thereby its profits".
                            </p>
                            <div className="absolute -top-3 -left-3 w-6 h-6 border-l-2 border-t-2 border-slate-200"></div>
                            <div className="absolute -bottom-3 -right-3 w-6 h-6 border-r-2 border-b-2 border-slate-200"></div>
                         </div>

                         {/* Two Column Section */}
                         <div className="grid grid-cols-2 gap-8 pt-4">
                            {/* Types of Expenses */}
                            <div className="space-y-6">
                               <div className="bg-[#fed7d7] rounded-full py-2 px-10 border-2 border-[#f56565] inline-block shadow-sm">
                                  <h4 className="text-[#c53030] font-black text-[16px] italic uppercase tracking-wider">Types of Expenses</h4>
                               </div>
                               
                               <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-5">
                                  <div className="flex gap-4">
                                     <div className="w-6 h-6 shrink-0 bg-[#c53030] rounded-sm flex items-center justify-center text-white text-[12px] transform rotate-45 mt-1">
                                        <div className="-rotate-45 font-black">&gt;</div>
                                     </div>
                                     <div>
                                        <h5 className="font-black text-slate-900 text-[15px]">Cost of Goods sold (COGS) -</h5>
                                        <p className="text-slate-600 text-[14px] mt-1 italic">Expenses directly related to generating sales revenues</p>
                                     </div>
                                  </div>

                                  <div className="flex gap-4">
                                     <div className="w-6 h-6 shrink-0 bg-[#c53030] rounded-sm flex items-center justify-center text-white text-[12px] transform rotate-45 mt-1">
                                        <div className="-rotate-45 font-black">&gt;</div>
                                     </div>
                                     <div>
                                        <h5 className="font-black text-slate-900 text-[15px]">Indirect Expenses –</h5>
                                        <p className="text-slate-600 text-[14px] mt-1 italic">These are the operating expenses</p>
                                     </div>
                                  </div>

                                  <div className="flex gap-4">
                                     <div className="w-6 h-6 shrink-0 bg-[#c53030] rounded-sm flex items-center justify-center text-white text-[12px] transform rotate-45 mt-1">
                                        <div className="-rotate-45 font-black">&gt;</div>
                                     </div>
                                     <div>
                                        <h5 className="font-black text-slate-900 text-[15px]">Non Operating Expenses -</h5>
                                        <p className="text-slate-600 text-[14px] mt-1 italic">those expenses which are not related to "revenue generation for the core business activity"</p>
                                     </div>
                                  </div>
                               </div>
                            </div>

                            {/* P&L Section */}
                            <div className="space-y-6">
                               <div className="bg-[#fed7d7] rounded-full py-2 px-10 border-2 border-[#f56565] inline-block shadow-sm">
                                  <h4 className="text-[#c53030] font-black text-[16px] italic uppercase tracking-wider">Expenses in P&L A/C</h4>
                               </div>

                               <div className="bg-white p-6 rounded-2xl border-2 border-[#fed7d7] grid grid-cols-2 gap-x-12 gap-y-3">
                                  {[
                                     "Salaries", "Bad Debt Loss",
                                     "Raw Material", "Interest",
                                     "Electricity Bills", "Tax Expenses",
                                     "Depreciation", "Other Misc Exp.",
                                     "Advertisement", "",
                                     "Insurance", "",
                                     "Fuel Expenses", "",
                                     "License Cost", ""
                                  ].map((item, i) => item ? (
                                     <div key={i} className="flex items-center gap-3 group">
                                        <div className="shrink-0 text-[#c53030] font-bold text-[18px] transition-transform group-hover:translate-x-1">➤</div>
                                        <span className="text-slate-700 text-[14px] font-medium italic">{item}</span>
                                     </div>
                                  ) : <div key={i}></div>)}
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Footer Action Buttons moved to bottom */}
                <div className="flex flex-col items-center text-center pb-32">
                   <button onClick={() => window.location.href = '/expenses/new'} className="bg-[#1e61f0] hover:bg-[#1a54d1] text-white px-10 py-3 rounded text-[14px] font-bold transition-all shadow-lg active:scale-95 mb-4 uppercase tracking-wide">
                      Create Your First Expense
                   </button>
                   <button className="text-[#1e61f0] text-[14px] font-bold hover:underline">
                      Import Expenses
                   </button>
                </div>
             </div>
          )}
       </div>
    </div>
    
    {showMileageModal && (
        <MileagePreferencesModal onClose={() => setShowMileageModal(false)} />
    )}
    </>
  );
};

const LifecycleStep = ({ icon, label, mini, active, color }) => (
   <div className={`flex items-center gap-2 px-3 py-1.5 rounded border shadow-sm transition-all whitespace-nowrap
      ${mini ? 'text-[10px] font-bold' : 'text-[12px] font-bold'}
      ${active ? 'bg-blue-600 text-white border-blue-600' : color || 'bg-white text-slate-600 border-slate-300'}
   `}>
      {icon}
      <span>{label}</span>
   </div>
);

const TimelineStep = ({ icon, label, desc, active, isLast }) => (
   <div className="flex flex-col items-center gap-4 relative group">
      <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all duration-500 shadow-md transform group-hover:scale-110
         ${active ? 'bg-white border-blue-500 text-blue-600 shadow-blue-500/10' : 'bg-slate-50 border-slate-200 text-slate-400'}
      `}>
         {icon}
      </div>
      <div className="text-center">
         <h4 className={`text-[13px] font-black uppercase italic ${active ? 'text-slate-900' : 'text-slate-400'}`}>{label}</h4>
         <p className="text-[11px] text-slate-400 mt-0.5">{desc}</p>
      </div>
      {!isLast && (
         <div className="absolute top-7 -right-4 translate-x-1/2 text-blue-500/30 font-bold text-[18px]">→</div>
      )}
   </div>
);

const BenefitCard = ({ icon, title, desc }) => (
   <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
      <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-white transition-colors duration-500">
         {icon}
      </div>
      <h4 className="text-[15px] font-bold text-slate-900 mb-2 italic">{title}</h4>
      <p className="text-[13px] text-slate-500 leading-relaxed">{desc}</p>
   </div>
);

export default ExpensesView;
