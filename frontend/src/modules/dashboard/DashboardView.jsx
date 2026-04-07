import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowUpRight, ArrowDownRight, Activity, 
  CreditCard, Wallet, Users, LayoutDashboard,
  ChevronRight, Calendar, AlertCircle, TrendingUp,
  FileText, BookOpen, BarChart2, Plus, RefreshCcw
} from 'lucide-react';
import { reportsAPI, voucherAPI } from '../../services/api';

const fmt = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—';

const DashboardView = ({ stats, vouchers: initialVouchers }) => {
  const navigate = useNavigate();
  const companyId = localStorage.getItem('companyId');
  const [liveStats, setLiveStats] = useState(stats);
  const [liveVouchers, setLiveVouchers] = useState(initialVouchers || []);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { if (stats) setLiveStats(stats); }, [stats]);
  useEffect(() => { if (initialVouchers) setLiveVouchers(initialVouchers); }, [initialVouchers]);

  const refresh = async () => {
    const freshId = localStorage.getItem('companyId');
    if (!freshId) return;
    setRefreshing(true);
    try {
      const [s, v] = await Promise.allSettled([
        reportsAPI.dashboard(freshId),
        voucherAPI.getByCompany(freshId),
      ]);
      if (s.status === 'fulfilled') setLiveStats(s.value.data);
      if (v.status === 'fulfilled' && Array.isArray(v.value.data)) {
         setLiveVouchers(v.value.data.slice(0, 6)); 
      }
    } catch (err) {
      console.error("Dashboard refresh err:", err);
    }
    setRefreshing(false);
  };

  const VOUCHER_TYPE_COLOR = {
    Receipt: 'bg-emerald-100 text-emerald-700',
    Payment: 'bg-red-100 text-red-700',
    Journal: 'bg-blue-100 text-blue-700',
    Contra:  'bg-purple-100 text-purple-700',
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-fade-in">
      
      {/* ══ HEADER ═══════════════════════════════════════════ */}
      <div className="flex justify-between items-end">
        <div>
           <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Operational Status: Live</span>
           </div>
           <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Enterprise Overview</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-1 px-4 bg-white rounded-full border border-slate-100 shadow-sm flex items-center gap-3">
             <Calendar size={14} className="text-slate-400"/>
             <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span>
          </div>
          <button onClick={refresh} disabled={refreshing}
            className="p-2 rounded-full bg-white border border-slate-100 shadow-sm text-slate-400 hover:text-slate-900 transition-all disabled:opacity-50">
            <RefreshCcw size={14} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ══ METRIC GRID ══════════════════════════════════════════ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
         <MetricCard 
           label="Net Profit" 
           value={fmt(liveStats?.netProfit)} 
           sub={`Income: ${fmt(liveStats?.totalIncome)}`}
           positive={(liveStats?.netProfit || 0) >= 0} 
           icon={<TrendingUp size={20}/>} 
           color="blue"
         />
         <MetricCard 
           label="Total Revenue" 
           value={fmt(liveStats?.totalIncome)} 
           sub="All income ledgers"
           positive={true} 
           icon={<Activity size={20}/>} 
           color="emerald"
         />
         <MetricCard 
           label="Total Expenses" 
           value={fmt(liveStats?.totalExpenses)} 
           sub="All expense ledgers"
           positive={false} 
           icon={<CreditCard size={20}/>} 
           color="red"
         />
         <MetricCard 
           label="Cash & Bank Balance" 
           value={fmt(liveStats?.cashBalance)} 
           sub="Cash + Bank ledgers"
           positive={(liveStats?.cashBalance || 0) >= 0} 
           icon={<Wallet size={20}/>} 
           color="slate"
         />
      </div>

      {/* ══ QUICK ACTIONS ════════════════════════════════════════ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'New Voucher', sub: 'Record a transaction', icon: <FileText size={18}/>, path: '/vouchers/new', color: 'bg-slate-900 text-white' },
          { label: 'New Ledger', sub: 'Add an account', icon: <BookOpen size={18}/>, path: '/ledgers', color: 'bg-blue-600 text-white' },
          { label: 'Trial Balance', sub: 'View summary', icon: <BarChart2 size={18}/>, path: '/reports/trial-balance', color: 'bg-indigo-600 text-white' },
          { label: 'GST Returns', sub: 'Tax compliance', icon: <LayoutDashboard size={18}/>, path: '/reports/gst', color: 'bg-emerald-600 text-white' },
        ].map(a => (
          <button key={a.path} onClick={() => navigate(a.path)}
            className={`${a.color} p-5 rounded-2xl shadow-lg flex items-center gap-4 hover:opacity-90 hover:-translate-y-0.5 transition-all text-left`}>
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">{a.icon}</div>
            <div>
              <div className="font-black text-[13px] leading-tight">{a.label}</div>
              <div className="text-[10px] opacity-70 font-bold mt-0.5">{a.sub}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
         
         {/* ══ RECENT VOUCHERS ══════════════════════════════════════ */}
         <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-100 shadow-lg overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white"><Activity size={18}/></div>
                  <h3 className="font-black text-slate-900 text-lg tracking-tight">Recent Vouchers</h3>
               </div>
               <button onClick={() => navigate('/vouchers')} className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 flex items-center gap-1">
                 View All <ChevronRight size={12}/>
               </button>
            </div>
            
            <div className="divide-y divide-slate-50">
               {liveVouchers.length === 0 ? (
                 <div className="py-20 text-center opacity-30">
                    <AlertCircle size={32} className="mx-auto mb-3"/>
                    <p className="text-sm font-bold uppercase tracking-wider">No vouchers yet</p>
                    <button onClick={() => navigate('/vouchers/new')} className="mt-4 px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-black opacity-100 hover:opacity-90">
                      + Create First Voucher
                    </button>
                 </div>
               ) : (
                 liveVouchers.map(v => {
                   const amount = (v.Transactions || []).reduce((a, t) => a + (parseFloat(t.debit) || 0), 0);
                   return (
                     <div key={v.id} onClick={() => navigate('/vouchers')}
                       className="px-8 py-5 flex items-center justify-between hover:bg-slate-50/50 transition-all group cursor-pointer">
                        <div className="flex items-center gap-5">
                           <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border-2 border-white shadow-sm text-[10px] font-black
                              ${v.voucherType === 'Receipt' ? 'bg-emerald-50 text-emerald-600' : 
                                v.voucherType === 'Payment' ? 'bg-red-50 text-red-600' : 
                                v.voucherType === 'Contra' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                              {v.voucherType === 'Receipt' ? <ArrowDownRight size={18}/> : <ArrowUpRight size={18}/>}
                           </div>
                           <div>
                              <div className="font-black text-slate-900 text-[14px]">{v.narration || 'Journal Transaction'}</div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${VOUCHER_TYPE_COLOR[v.voucherType] || 'bg-slate-100 text-slate-600'}`}>
                                  {v.voucherType}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400">{v.voucherNumber} · {fmtDate(v.date)}</span>
                              </div>
                           </div>
                        </div>
                        <div className="text-right">
                           <div className="font-black text-slate-900 text-[15px]">{fmt(amount)}</div>
                           <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Amount</div>
                        </div>
                     </div>
                   );
                 })
               )}
            </div>
         </div>

         {/* ══ SYSTEM STATS ════════════════════════════════════════ */}
         <div className="space-y-5">
            <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden group shadow-2xl shadow-slate-900/30">
               <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700"></div>
               <div className="relative z-10">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">System Overview</p>
                  <div className="space-y-4">
                    <StatRow label="Total Ledgers" value={liveStats?.ledgerCount || 0} />
                    <StatRow label="Total Vouchers" value={liveStats?.voucherCount || 0} />
                    <StatRow label="Net Profit" value={fmt(liveStats?.netProfit)} />
                    <StatRow label="Cash Balance" value={fmt(liveStats?.cashBalance)} />
                  </div>
               </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-100 p-7 shadow-lg">
               <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center"><AlertCircle size={16}/></div>
                  <h4 className="font-black text-slate-900 tracking-tight">Quick Links</h4>
               </div>
               <div className="space-y-2">
                 {[
                   { label: 'Purchase Orders', path: '/purchase-orders' },
                   { label: 'Payroll', path: '/payroll' },
                   { label: 'Bank Reconciliation', path: '/reconciliation' },
                   { label: 'Balance Sheet', path: '/reports/bs' },
                   { label: 'Profit & Loss', path: '/reports/pl' },
                 ].map(l => (
                   <button key={l.path} onClick={() => navigate(l.path)}
                     className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-50 transition-all flex items-center justify-between group">
                     <span className="text-[13px] font-bold text-slate-700">{l.label}</span>
                     <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
                   </button>
                 ))}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, sub, positive, icon, color }) => (
  <div className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-xl group hover:-translate-y-1 transition-all duration-300">
     <div className="flex justify-between items-start mb-5">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 border-white shadow-lg
           ${color === 'blue' ? 'bg-blue-600 text-white shadow-blue-200' : 
             color === 'emerald' ? 'bg-emerald-600 text-white shadow-emerald-200' : 
             color === 'red' ? 'bg-red-500 text-white shadow-red-200' : 'bg-slate-900 text-white shadow-slate-200'}`}>
           {icon}
        </div>
        <div className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1
           ${positive ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
           {positive ? <ArrowUpRight size={10}/> : <ArrowDownRight size={10}/>}
           {positive ? 'Positive' : 'Negative'}
        </div>
     </div>
     <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">{label}</p>
     <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{value}</h3>
     {sub && <p className="text-[11px] text-slate-400 font-bold mt-1">{sub}</p>}
  </div>
);

const StatRow = ({ label, value }) => (
  <div className="flex justify-between items-center">
    <span className="text-xs font-bold text-slate-400">{label}</span>
    <span className="text-sm font-black text-white">{value}</span>
  </div>
);

export default DashboardView;
