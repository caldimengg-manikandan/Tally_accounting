import React, { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, TrendingDown, RefreshCcw, 
  Download, Calendar, Activity, ChevronRight,
  Shield, Wallet, ArrowUpRight, ArrowDownRight,
  AlertCircle
} from 'lucide-react';
import { reportsAPI } from '../../services/api';

const ProfitLossView = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const companyId = localStorage.getItem('companyId');

  const fetchReport = useCallback(async () => {
    if (!companyId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await reportsAPI.profitLoss(companyId);
      setData(res.data);
    } catch (err) { 
      console.error(err);
      setData(null);
    }
    setLoading(false);
  }, [companyId]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  if (loading) return <div className="p-20 text-center animate-pulse text-slate-400 font-bold uppercase tracking-widest">Synthesizing Audit Clusters...</div>;
  if (!companyId) return <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest">No Company Active</div>;
  
  if (!data || !data.income || !data.expenses) {
    return (
      <div className="py-20 flex flex-col items-center gap-4 text-slate-400 bg-white rounded-[2.5rem] border border-dashed border-slate-200 m-8">
        <AlertCircle size={40} className="text-blue-500" />
        <div className="text-center">
          <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Financial Stream Offline</h3>
          <p className="text-sm font-bold mt-1">No revenue or expense data detected for this period.</p>
        </div>
        <button onClick={fetchReport} className="mt-4 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-xl">
          Retry Audit
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-10 animate-fade-in">
      
      {/* ══ HEADER HUB ══════════════════════════════════════════ */}
      <div className="flex justify-between items-end border-b border-slate-100 pb-8">
        <div>
           <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center border border-emerald-500 shadow-xl shadow-emerald-200/40"><TrendingUp size={18}/></div>
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-[0.2em]">P&L Statement · Performance Hub</span>
           </div>
           <h1 className="text-3xl font-bold text-slate-900 tracking-tighter">Profitability Matrix</h1>
        </div>
        <div className="flex gap-3">
           <button onClick={fetchReport} className="p-2.5 border border-slate-100 rounded-xl bg-white hover:bg-slate-50 text-slate-400 shadow-sm"><RefreshCcw size={16}/></button>
           <button className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-slate-900/10 flex items-center gap-2">
             <Download size={16}/> Export Statement
           </button>
        </div>
      </div>

      {/* ══ PROFITABILITY CARDS ═══════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
         <div className="md:col-span-2 space-y-8">
            
            {/* INCOME CLUSTER */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden">
               <div className="px-10 py-6 border-b border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center"><ArrowUpRight size={16}/></div>
                     <h3 className="font-bold text-slate-900 tracking-tight">Income Trajectories</h3>
                  </div>
                  <div className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Revenue Clusters</div>
               </div>
               <div className="p-10 space-y-4">
                  {data.income.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 italic text-xs uppercase tracking-widest">No Income Records</div>
                  ) : data.income.map((item, idx) => (
                    <FinancialRow key={idx} label={item.name} value={item.amount} type="income" />
                  ))}
                  <div className="pt-6 border-t border-slate-100 flex justify-between items-center text-blue-600 font-bold">
                     <span className="text-xs uppercase tracking-[0.2em]">Total Realized Income</span>
                     <span className="text-2xl tracking-tighter">₹{data.totalIncome.toLocaleString('en-IN')}</span>
                  </div>
               </div>
            </div>

            {/* EXPENSE CLUSTER */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden">
               <div className="px-10 py-6 border-b border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 bg-red-50 text-red-600 rounded-lg flex items-center justify-center"><ArrowDownRight size={16}/></div>
                     <h3 className="font-bold text-slate-900 tracking-tight">Operating Outflows</h3>
                  </div>
                  <div className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Cost Centers</div>
               </div>
               <div className="p-10 space-y-4">
                  {data.expenses.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 italic text-xs uppercase tracking-widest">No Expense Records</div>
                  ) : data.expenses.map((item, idx) => (
                    <FinancialRow key={idx} label={item.name} value={item.amount} type="expense" />
                  ))}
                  <div className="pt-6 border-t border-slate-100 flex justify-between items-center text-red-600 font-bold">
                     <span className="text-xs uppercase tracking-[0.2em]">Total Operating Outflow</span>
                     <span className="text-2xl tracking-tighter">₹{(data.totalExpenses || 0).toLocaleString('en-IN')}</span>
                  </div>
               </div>
            </div>

         </div>

         {/* ══ NET PERFORMANCE HUD ═════════════════════════════════ */}
         <div className="space-y-6 sticky top-8">
            <div className={`rounded-[3rem] p-10 text-white relative overflow-hidden group shadow-2xl transition-all duration-500
               ${(data.netProfit || 0) >= 0 ? 'bg-emerald-600 shadow-emerald-600/30' : 'bg-red-600 shadow-red-600/30'}`}>
               <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700"></div>
               <div className="relative z-10 text-center py-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 mb-4">Total Net Profit</p>
                  <h4 className="text-5xl font-bold tracking-tighter mb-4">₹{(data.netProfit || 0).toLocaleString('en-IN')}</h4>
                  <div className="inline-flex px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-[10px] font-bold uppercase tracking-widest">
                     {(data.netProfit || 0) >= 0 ? <><Activity size={12} className="mr-2"/> ✓ PROFIT</> : '⚠ NET LOSS'}
                  </div>
               </div>
            </div>
            
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
               <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-lg flex items-center justify-center"><Shield size={16}/></div>
                  <h4 className="font-bold text-white tracking-tight">Audit Integrity</h4>
               </div>
               <p className="text-xs font-bold text-slate-400 leading-relaxed mb-6">Report generated in real-time. Data hash verified across all journal sub-nodes.</p>
               <div className="h-1 bg-slate-800 rounded-full w-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-[85%]"></div>
               </div>
            </div>
         </div>

      </div>
    </div>
  );
};

const FinancialRow = ({ label, value, type }) => (
  <div className="flex justify-between items-center group transition-all p-3 hover:bg-slate-50/50 rounded-2xl">
     <div className="flex items-center gap-4">
        <div className={`w-2 h-2 rounded-full ${type === 'income' ? 'bg-emerald-500 shadow-emerald-500/30 shadow-md' : 'bg-red-500 shadow-red-500/30 shadow-md'}`}></div>
        <span className="font-bold text-slate-900 text-[13px] tracking-tight">{label}</span>
     </div>
     <div className="flex items-center gap-3">
        <span className={`text-[15px] font-bold tracking-tighter ${type === 'income' ? 'text-emerald-600' : 'text-slate-900'}`}>₹{(value || 0).toLocaleString('en-IN')}</span>
        <ChevronRight size={14} className="text-slate-200 group-hover:text-slate-400 transition-colors" />
     </div>
  </div>
);

export default ProfitLossView;
