import React, { useState, useEffect } from 'react';
import { 
  Plus, Wallet, RefreshCw, FileText, 
  ChevronDown, ArrowDownUp, Filter, MoreHorizontal,
  Play, CheckCircle2, LayoutList, MapPin, RotateCcw,
  User, Receipt, MousePointer2, ArrowRight
} from 'lucide-react';
import { purchaseAPI } from '../../services/api';

const ExpensesView = ({ companyId }) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab ] = useState('All Expenses');

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
    <div className="bg-white min-h-screen flex flex-col">
       {/* Tabbed Header */}
       <div className="flex items-center justify-between px-8 py-2 border-b border-slate-100">
          <div className="flex items-center gap-6 h-full">
             <button 
               onClick={() => setActiveTab('Receipts Inbox')}
               className={`text-[15px] font-medium px-4 py-3 -mb-[9px] transition-all ${activeTab === 'Receipts Inbox' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
             >
                Receipts Inbox
             </button>
             <button 
               onClick={() => setActiveTab('All Expenses')}
               className={`text-[15px] font-medium px-4 py-3 -mb-[9px] flex items-center gap-1.5 transition-all ${activeTab === 'All Expenses' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
             >
                All Expenses <ChevronDown size={14} className={activeTab === 'All Expenses' ? 'text-blue-600' : 'text-slate-400'} />
             </button>
          </div>
          <div className="flex items-center gap-2">
             <button onClick={() => window.location.href = '/expenses/new'} className="bg-[#1e61f0] hover:bg-[#1a54d1] text-white px-4 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-all shadow-sm text-[14px]">
                <Plus size={16} strokeWidth={2.5}/> New
             </button>
             <button className="p-1.5 text-slate-400 hover:text-slate-600 border border-slate-200 rounded-md transition-all">
                <MoreHorizontal size={18} />
             </button>
          </div>
       </div>

       <div className="flex-1 overflow-auto">
          {expenses.length > 0 ? (
             <div className="p-8">
                <table className="w-full text-left">
                   <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200">
                      <tr>
                         <th className="px-6 py-4">Date</th>
                         <th className="px-6 py-4">Expense Account</th>
                         <th className="px-6 py-4">Reference#</th>
                         <th className="px-6 py-4">Vendor Name</th>
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
             <div className="flex-1 flex flex-col items-center bg-[#fdfdff]">
                
                {/* Hero Card */}
                <div className="mt-16 w-full max-w-[800px] flex flex-col items-center text-center px-4">
                   <div className="w-[380px] h-[220px] bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.06)] border border-slate-100 overflow-hidden mb-8 group cursor-pointer relative">
                      <div className="absolute inset-0 bg-slate-50/50 flex flex-col items-center justify-center p-8">
                         <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <Play size={28} className="text-[#1e61f0] fill-[#1e61f0] ml-1" />
                         </div>
                         <div className="mt-4 flex flex-col items-center gap-1">
                            <div className="flex items-center gap-1.5 opacity-60">
                               <Receipt size={16} className="text-blue-600" />
                               <span className="text-[14px] font-bold text-slate-800">Tally Books</span>
                            </div>
                            <p className="text-[13px] text-slate-600 italic">How to record and manage expenses</p>
                         </div>
                      </div>
                   </div>

                   <h2 className="text-[28px] font-black text-slate-900 mb-3 tracking-tight italic">Time To Manage Your Expenses!</h2>
                   <p className="text-slate-500 text-[16px] mb-8 max-w-[500px] leading-relaxed">
                      Create and manage expenses that are part of your organization's operating costs.
                   </p>
                   
                   <button onClick={() => window.location.href = '/expenses/new'} className="bg-[#1e61f0] hover:bg-[#1a54d1] text-white px-10 py-3 rounded-xl font-black text-[15px] transition-all shadow-xl shadow-blue-600/20 active:scale-95 mb-4">
                      RECORD EXPENSE
                   </button>
                   <button className="text-[#1e61f0] text-[14px] font-bold hover:underline">
                      Import Expenses
                   </button>
                </div>

                <div className="w-full border-t border-slate-100 my-20"></div>

                {/* Lifecycle Section */}
                <div className="w-full max-w-[1000px] flex flex-col items-center px-4 mb-24">
                   <h3 className="text-[18px] font-bold text-slate-800 mb-12 italic">Life cycle of an Expense</h3>
                   
                   <div className="flex items-center gap-2 w-full justify-center">
                      <LifecycleStep icon={<Receipt size={18}/>} label="EXPENSE INCURRED" />
                      <div className="w-10 border-t border-dashed border-slate-300"></div>
                      <LifecycleStep icon={<RotateCcw size={18}/>} label="RECORD EXPENSE" />
                      <div className="h-24 w-[1px] border-l border-dashed border-slate-300 mx-4 relative">
                         <div className="absolute top-0 right-0 w-8 border-t border-dashed border-slate-300"></div>
                         <div className="absolute bottom-0 right-0 w-8 border-t border-dashed border-slate-300"></div>
                      </div>
                      <div className="flex flex-col gap-10">
                         <div className="flex items-center gap-2">
                            <LifecycleStep mini label="BILLABLE" active />
                            <ArrowRight size={14} className="text-slate-300" />
                            <LifecycleStep mini label="CONVERT TO INVOICE" active />
                            <ArrowRight size={14} className="text-slate-300" />
                            <LifecycleStep mini label="GET REIMBURSED" active />
                         </div>
                         <div className="flex items-center gap-2">
                            <LifecycleStep mini label="NON-BILLABLE" color="bg-rose-50 text-rose-600 border-rose-100" />
                         </div>
                      </div>
                   </div>
                </div>

                <div className="w-full border-t border-slate-100 mb-20"></div>

                {/* Features List */}
                <div className="w-full max-w-[800px] px-8 mb-32">
                   <h4 className="text-[16px] font-bold text-slate-800 mb-8 italic">In the Expenses module, you can:</h4>
                   <div className="space-y-4">
                      <FeatureItem text="Record a single expense or record expenses in bulk." />
                      <FeatureItem text="Set mileage rates and record expenses based on the distance travelled." />
                      <FeatureItem text="Convert an expense into an invoice to get it reimbursed." />
                   </div>
                </div>

             </div>
          )}
       </div>
    </div>
  );
};

const LifecycleStep = ({ icon, label, mini, active, color }) => (
   <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border shadow-sm transition-all whitespace-nowrap
      ${mini ? 'text-[11px] font-black' : 'text-[13px] font-bold'}
      ${active ? 'bg-blue-50 text-[#1e61f0] border-blue-100 shadow-blue-600/5' : color || 'bg-white text-slate-600 border-slate-200'}
   `}>
      {icon}
      <span>{label}</span>
   </div>
);

const FeatureItem = ({ text }) => (
   <div className="flex items-center gap-3">
      <CheckCircle2 size={18} className="text-[#1e61f0] shrink-0" />
      <p className="text-[15px] text-slate-600 font-medium">{text}</p>
   </div>
);

export default ExpensesView;
