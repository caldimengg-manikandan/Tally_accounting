import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowUpRight, ArrowDownRight, Activity, 
  CreditCard, Wallet, Users, LayoutDashboard,
  ChevronRight, Calendar, AlertCircle, TrendingUp,
  FileText, BookOpen, BarChart2, Plus, RefreshCcw,
  ShoppingBag, Landmark, UserCheck
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
         setLiveVouchers(v.value.data.slice(0, 8)); 
      }
    } catch (err) {
      console.error("Dashboard refresh err:", err);
    }
    setRefreshing(false);
  };

  const VOUCHER_TYPE_COLOR = {
    Receipt: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
    Payment: 'bg-rose-50 text-rose-600 border border-rose-100',
    Journal: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
    Contra:  'bg-amber-50 text-amber-600 border border-amber-100',
  };

  const formatDescription = (v) => {
    const val = v.narration;
    const type = v.voucherType;
    if (!val) return type === 'Payment' ? 'Outgoing Payment' : type === 'Receipt' ? 'Incoming Receipt' : 'General Transaction';
    try {
      if (typeof val === 'string' && val.trim().startsWith('{')) {
        const parsed = JSON.parse(val);
        if (type === 'Payment' && parsed.vendor) return `Payment to ${parsed.vendor}`;
        if (type === 'Receipt' && (parsed.customer || parsed.customerName)) return `Receipt from ${parsed.customer || parsed.customerName}`;
        if (parsed.notes) return parsed.notes;
      }
      return val;
    } catch (e) {
      return val;
    }
  };

  return (
    <div className="p-8 lg:p-12 max-w-[1600px] mx-auto space-y-10 animate-fade-in bg-[#f8fafc] min-h-screen font-sans">
      
      {/* ══ HEADER ═══════════════════════════════════════════ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <div className="flex items-center gap-2 mb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600"></span>
              <span className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em]">Operational Overview</span>
           </div>
           <h1 className="text-3xl font-black text-slate-900 tracking-tight">Enterprise Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2.5 bg-white rounded-xl shadow-sm border border-slate-200/60 flex items-center gap-3">
             <Calendar size={16} strokeWidth={1.5} className="text-slate-400"/>
             <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">{new Date().toLocaleDateString('en-IN', { month: 'short', day: '2-digit', year: 'numeric' })}</span>
          </div>
          <button onClick={refresh} disabled={refreshing}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-black hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 disabled:opacity-50">
            <RefreshCcw size={14} strokeWidth={2.5} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Syncing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* ══ METRIC CARDS ══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <MetricCard 
           label="Net Profit" 
           value={fmt(liveStats?.netProfit)} 
           sub={`+12% vs last month`}
           positive={(liveStats?.netProfit || 0) >= 0} 
           icon={<TrendingUp size={20} strokeWidth={1.5} />} 
           color="blue"
         />
         <MetricCard 
           label="Revenue" 
           value={fmt(liveStats?.totalIncome)} 
           sub="All income streams"
           positive={true} 
           icon={<Activity size={20} strokeWidth={1.5} />} 
           color="emerald"
         />
         <MetricCard 
           label="Expenses" 
           value={fmt(liveStats?.totalExpenses)} 
           sub="Operational costs"
           positive={false} 
           icon={<CreditCard size={20} strokeWidth={1.5} />} 
           color="rose"
         />
         <MetricCard 
           label="Bank Balance" 
           value={fmt(liveStats?.cashBalance)} 
           sub="Aggregated funds"
           positive={(liveStats?.cashBalance || 0) >= 0} 
           icon={<Wallet size={20} strokeWidth={1.5} />} 
           color="indigo"
         />
      </div>

      {/* ══ MAIN GRID ════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
         
         {/* RECENT VOUCHERS */}
         <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
            <div className="px-8 py-7 border-b border-slate-100 flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                  <h3 className="font-black text-slate-900 text-lg tracking-tight">Recent Financial Activity</h3>
               </div>
               <button onClick={() => navigate('/vouchers')} className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:tracking-[0.15em] transition-all flex items-center gap-1">
                 View Ledger <ChevronRight size={12}/>
               </button>
            </div>
            
<div className="flex-1">
        {liveVouchers.length === 0 ? (
          <div className="py-32 text-center opacity-30 flex flex-col items-center">
             <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <AlertCircle size={32} strokeWidth={1}/>
             </div>
             <p className="text-[11px] font-black uppercase tracking-[0.2em]">Data Synchronizing...</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
             {liveVouchers.map(v => {
               const amount = (v.Transactions || []).reduce((a, t) => a + (parseFloat(t.debit) || 0), 0);
               return (
                 <div key={v.id} onClick={() => navigate('/vouchers')}
                   className="px-8 py-5 flex items-center justify-between hover:bg-slate-50/50 transition-all group cursor-pointer border-l-2 border-transparent hover:border-blue-500">
                    <div className="flex items-center gap-5">
                       <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-black
                          ${v.voucherType === 'Receipt' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                            v.voucherType === 'Payment' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 
                            v.voucherType === 'Contra' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'}`}>
                          {v.voucherType === 'Receipt' ? <ArrowDownRight size={16} strokeWidth={2}/> : <ArrowUpRight size={16} strokeWidth={2}/>}
                       </div>
                       <div>
                          <div className="font-bold text-slate-900 text-[14px] leading-tight mb-1">{formatDescription(v)}</div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${VOUCHER_TYPE_COLOR[v.voucherType] || 'bg-slate-100 text-slate-600'}`}>
                              {v.voucherType}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 tracking-tight">#{v.voucherNumber} · {fmtDate(v.date)}</span>
                          </div>
                       </div>
                    </div>
                    <div className="text-right">
                       <div className="font-black text-slate-900 text-base">{fmt(amount)}</div>
                       <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Currency (INR)</div>
                    </div>
                 </div>
               );
             })}
          </div>
        )}
      </div>
    </div>

         {/* SIDE HUB */}
         <div className="space-y-8">
            
            {/* QUICK OPS */}
            <div className="bg-white p-7 rounded-2xl border border-slate-200/60 shadow-sm">
               <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-widest mb-6">Quick Operations</h4>
               <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Sales Order', icon: <ShoppingBag size={20} strokeWidth={1.5}/>, path: '/sales-orders', color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Bank Reco', icon: <Landmark size={20} strokeWidth={1.5}/>, path: '/reconciliation', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Add Ledger', icon: <Plus size={20} strokeWidth={1.5}/>, path: '/ledgers', color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Payroll', icon: <UserCheck size={20} strokeWidth={1.5}/>, path: '/payroll', color: 'text-rose-600', bg: 'bg-rose-50' },
                  ].map(a => (
                    <button key={a.label} onClick={() => navigate(a.path)}
                      className="flex flex-col items-center justify-center p-5 rounded-xl border border-slate-100 hover:border-blue-500 hover:bg-blue-50/10 transition-all group scale-100 hover:scale-[1.02]">
                       <div className={`w-12 h-12 ${a.bg} ${a.color} rounded-2xl flex items-center justify-center mb-3 group-hover:shadow-md transition-shadow`}>{a.icon}</div>
                       <span className="text-[11px] font-black text-slate-600 tracking-tight">{a.label}</span>
                    </button>
                  ))}
               </div>
            </div>

            {/* SYSTEM STATUS */}
            <div className="bg-slate-900 rounded-2xl p-8 text-white relative overflow-hidden group shadow-2xl shadow-slate-900/20">
               <div className="absolute -right-10 -bottom-10 opacity-20 transform group-hover:scale-110 transition-transform duration-700">
                  <LayoutDashboard size={120} strokeWidth={1} />
               </div>
               <div className="relative z-10">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6">Accounting Status</p>
                  <div className="space-y-4">
                    <StatRow label="Ledger Entries" value={liveStats?.ledgerCount || 0} />
                    <StatRow label="Voucher Records" value={liveStats?.voucherCount || 0} />
                    <StatRow label="Active Projects" value={liveStats?.projectCount || 0} />
                    <div className="h-[1px] bg-slate-800 my-2"></div>
                    <StatRow label="Net Profit" value={fmt(liveStats?.netProfit)} hl="text-blue-400" />
                    <StatRow label="Liquidity" value={fmt(liveStats?.cashBalance)} hl="text-emerald-400" />
                  </div>
               </div>
            </div>

         </div>
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, sub, positive, icon, color }) => (
  <div className="bg-white p-7 rounded-2xl border border-slate-200/60 shadow-sm relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-500">
     <div className="flex justify-between items-start mb-6">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center
           ${color === 'blue' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 
             color === 'emerald' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
             color === 'rose' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'}`}>
           {icon}
        </div>
        <div className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-widest flex items-center gap-1
           ${positive ? 'text-emerald-600' : 'text-rose-600'}`}>
           {positive ? <ArrowUpRight size={10} strokeWidth={3}/> : <ArrowDownRight size={10} strokeWidth={3}/>}
           {sub}
        </div>
     </div>
     <div>
        <p className="text-[11px] font-black uppercase text-slate-400 tracking-[0.15em] mb-1">{label}</p>
        <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{value}</h3>
     </div>
     <div className="absolute bottom-0 right-0 p-4 opacity-0 group-hover:opacity-10 transition-opacity">
        {icon}
     </div>
  </div>
);

const StatRow = ({ label, value, hl }) => (
  <div className="flex justify-between items-center">
    <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
    <span className={`text-[14px] font-black ${hl || 'text-white'}`}>{value}</span>
  </div>
);

export default DashboardView;
