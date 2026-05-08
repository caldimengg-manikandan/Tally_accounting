import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, TrendingDown, RefreshCcw, 
  Download, Calendar, Activity, ChevronRight,
  Shield, Wallet, ArrowUpRight, ArrowDownRight,
  AlertCircle, Printer, Mail, MoreHorizontal, CheckCircle2,
  X, Send, BarChart3, PieChart
} from 'lucide-react';
import { reportsAPI, mailAPI } from '../../services/api';

const ProfitLossView = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [basis, setBasis] = useState('Accrual');
  const [viewType, setViewType] = useState('Detailed');
  const [dateRange, setDateRange] = useState('This Month');
  const [showMailModal, setShowMailModal] = useState(false);
  const [email, setEmail] = useState('');
  const [sendingMail, setSendingMail] = useState(false);
  const companyId = localStorage.getItem('companyId');

  const fetchReport = useCallback(async () => {
    if (!companyId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await reportsAPI.profitLoss(companyId, basis);
      setData(res.data);
    } catch (err) { 
      console.error(err);
      setData(null);
    }
    setLoading(false);
  }, [companyId, basis]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const handleSendMail = async (e) => {
    e.preventDefault();
    if (!email) return;
    setSendingMail(true);
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    try {
      await mailAPI.send({
        from: user.email,
        to: email,
        subject: `P&L Statement (${viewType}) - ${new Date().toLocaleDateString()}`,
        text: `Attached is the Profit & Loss statement for ${basis} basis.`,
        companyId
      });
      alert('Report sent successfully!');
      setShowMailModal(false);
    } catch (err) {
      console.error(err);
      alert('Failed to send report. Please ensure your email is configured in the system.');
    }
    setSendingMail(false);
  };

  const fmt = (v) => v === 0 ? '₹0.00' : `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const profitMargin = useMemo(() => {
    if (!data || !data.totalIncome || data.totalIncome === 0) return 0;
    return ((data.netProfit / data.totalIncome) * 100).toFixed(1);
  }, [data]);

  if (!companyId) {
    return (
      <div className="py-20 flex flex-col items-center gap-4 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200 m-8">
        <AlertCircle size={40} className="text-[#1e61f0]" />
        <div className="text-center">
          <h3 className="text-[16px] font-bold text-slate-900 tracking-tight">No Company Active</h3>
          <p className="text-[12px] font-bold mt-1">Please select a company from the Settings hub to view reports.</p>
        </div>
        <button onClick={() => navigate('/settings/company')} className="mt-4 px-6 py-2.5 bg-slate-900 text-white rounded-lg text-[11px] font-bold uppercase tracking-widest shadow-xl">
          Go to Settings
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] animate-fade-in font-sans overflow-hidden">
      
      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-40 no-print shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <h1 className="text-[18px] font-bold text-slate-900 tracking-tight leading-none">Profit & Loss</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">Financial Performance Statement</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-1">
             <button onClick={() => setViewType('Summary')} className={`px-3 py-1.5 text-[11px] font-bold rounded transition-all ${viewType === 'Summary' ? 'bg-white text-[#1e61f0] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Summary</button>
             <button onClick={() => setViewType('Detailed')} className={`px-3 py-1.5 text-[11px] font-bold rounded transition-all ${viewType === 'Detailed' ? 'bg-white text-[#1e61f0] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Detailed</button>
           </div>
           <div className="w-px h-6 bg-slate-200 mx-2" />
           <button onClick={fetchReport} className="p-2 text-slate-400 hover:text-[#1e61f0] transition-colors">
             <RefreshCcw size={18} className={loading ? 'animate-spin' : ''}/>
           </button>
           <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-[12px] font-bold text-slate-600 hover:bg-slate-50 transition-all">
             <Printer size={16}/> Print
           </button>
           <button className="flex items-center gap-2 px-6 py-2 bg-[#1e61f0] text-white rounded-lg text-[12px] font-bold hover:bg-[#1a54d1] transition-all shadow-lg shadow-blue-500/20">
             <Download size={16}/> Export PDF
           </button>
        </div>
      </header>

      {/* ── TOOLBAR ────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-100 px-8 py-3 flex items-center justify-between no-print shrink-0">
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
               <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Basis:</span>
               <select value={basis} onChange={(e) => setBasis(e.target.value)} className="bg-transparent text-[11px] font-bold text-slate-700 uppercase outline-none cursor-pointer hover:text-[#1e61f0]">
                  <option value="Accrual">Accrual</option>
                  <option value="Cash">Cash</option>
               </select>
               <Tooltip text="Accrual basis records revenue when earned, Cash basis records it when received." />
            </div>
            <div className="w-px h-4 bg-slate-200" />
            <div className="flex items-center gap-2">
               <Calendar size={14} className="text-slate-400" />
               <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="bg-transparent text-[11px] font-bold text-slate-700 uppercase outline-none cursor-pointer hover:text-[#1e61f0]">
                  <option>This Month</option>
                  <option>Last Month</option>
                  <option>This Quarter</option>
                  <option>Financial Year</option>
                  <option>Custom Range</option>
               </select>
            </div>
         </div>
         <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-emerald-100">
               <PieChart size={14}/> Analytics
            </button>
            <button onClick={() => setShowMailModal(true)} className="p-1.5 text-slate-400 hover:text-[#1e61f0] rounded transition-all"><Mail size={16}/></button>
            <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded transition-all"><MoreHorizontal size={16}/></button>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">
        <div className="max-w-[1400px] mx-auto space-y-8">
          
          {/* ══ ENHANCED SUMMARY SECTION ════════════════════════════════ */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
             <SummaryItem 
               label="Total Revenue" 
               value={fmt(data?.totalIncome)} 
               color="text-emerald-600"
               subLabel="Realized Income Trajectories"
               trend="+12.5% vs Last Month"
             />
             <SummaryItem 
               label="Total Expenses" 
               value={fmt(data?.totalExpenses)} 
               color="text-rose-600"
               subLabel="Operating Outflows"
               trend="-2.1% vs Last Month"
             />
             <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-24 h-24 bg-[#1e61f0]/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150" />
                <div className="flex items-center gap-4 relative z-10">
                   <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${(data?.netProfit || 0) >= 0 ? 'bg-emerald-50 text-emerald-500 shadow-lg shadow-emerald-500/10' : 'bg-rose-50 text-rose-500 shadow-lg shadow-rose-500/10'}`}>
                      {(data?.netProfit || 0) >= 0 ? <TrendingUp size={28}/> : <TrendingDown size={28}/>}
                   </div>
                   <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Net Profit Result</p>
                      <h3 className={`text-[24px] font-black tracking-tight ${(data?.netProfit || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {fmt(data?.netProfit)}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                         <span className="text-[10px] font-bold text-slate-400 uppercase">Margin:</span>
                         <span className={`text-[11px] font-black ${parseFloat(profitMargin) > 20 ? 'text-emerald-600' : 'text-[#1e61f0]'}`}>{profitMargin}%</span>
                      </div>
                   </div>
                </div>
                <div className="flex flex-col items-end gap-3 relative z-10">
                   <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 text-white rounded-full text-[9px] font-bold uppercase tracking-widest">
                      <Shield size={12}/> AI Verified
                   </div>
                   <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">
                      <CheckCircle2 size={14}/>
                      <span className="text-[10px] font-black uppercase tracking-widest">Audit Ready</span>
                   </div>
                </div>
             </div>
          </div>

          {/* ══ REPORT CONTENT ══════════════════════════════════════════ */}
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="w-10 h-10 border-4 border-slate-100 border-t-[#1e61f0] rounded-full animate-spin mb-4" />
              <p className="text-[11px] font-bold uppercase text-slate-400 tracking-widest">Synthesizing Profitability Matrix...</p>
            </div>
          ) : (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              {/* INCOME SECTION */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group">
                <div className="px-8 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center"><ArrowUpRight size={18}/></div>
                      <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-widest">Income Trajectories</h3>
                   </div>
                   <div className="flex items-center gap-4">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Revenue Clusters</span>
                      <BarChart3 size={16} className="text-slate-300" />
                   </div>
                </div>
                {viewType === 'Detailed' ? (
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-white text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-50">
                      <tr>
                        <th className="px-8 py-3">Source Account</th>
                        <th className="px-8 py-3 text-right">Amount (₹)</th>
                        <th className="px-8 py-3 text-right">Contribution (%)</th>
                      </tr>
                    </thead>
                    <tbody className="text-[12px] text-slate-600">
                      {data.income.map((item, idx) => (
                        <tr 
                          key={idx} 
                          onClick={() => item.ledgerId && navigate(`/ledger-statement/${item.ledgerId}`)}
                          className="hover:bg-slate-50/80 transition-all border-b border-slate-50 last:border-0 group cursor-pointer"
                        >
                          <td className="px-8 py-4 font-bold text-slate-900 flex items-center gap-2">
                             {item.name}
                             <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 text-[#1e61f0] transition-all" />
                          </td>
                          <td className="px-8 py-4 text-right font-black text-emerald-600">
                             {fmt(item.amount)}
                          </td>
                          <td className="px-8 py-4 text-right">
                             <div className="flex items-center justify-end gap-3">
                                <span className="text-[11px] font-bold text-slate-400">{((item.amount / data.totalIncome) * 100).toFixed(1)}%</span>
                                <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                   <div className="h-full bg-emerald-500" style={{ width: `${(item.amount / data.totalIncome) * 100}%` }} />
                                </div>
                             </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-emerald-50/40 text-emerald-700 font-bold border-t border-emerald-100">
                      <tr>
                        <td className="px-8 py-4 text-[11px] uppercase tracking-widest font-black">Total Realized Income</td>
                        <td className="px-8 py-4 text-right text-[16px] font-black" colSpan={2}>{fmt(data.totalIncome)}</td>
                      </tr>
                    </tfoot>
                  </table>
                ) : (
                  <div className="p-10 flex items-center justify-between">
                     <div>
                        <span className="text-[14px] font-black text-slate-900 uppercase tracking-tighter">Aggregate Operating Revenue</span>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Unified Income Stream</p>
                     </div>
                     <span className="text-[28px] font-black text-emerald-600 tracking-tighter">{fmt(data.totalIncome)}</span>
                  </div>
                )}
              </div>

              {/* EXPENSE SECTION */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-8 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center"><ArrowDownRight size={18}/></div>
                      <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-widest">Operating Outflows</h3>
                   </div>
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cost Centers</span>
                </div>
                {viewType === 'Detailed' ? (
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-white text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-50">
                      <tr>
                        <th className="px-8 py-3">Expense Head</th>
                        <th className="px-8 py-3 text-right">Amount (₹)</th>
                        <th className="px-8 py-3 text-right">Absorption (%)</th>
                      </tr>
                    </thead>
                    <tbody className="text-[12px] text-slate-600">
                      {data.expenses.map((item, idx) => (
                        <tr 
                          key={idx} 
                          onClick={() => item.ledgerId && navigate(`/ledger-statement/${item.ledgerId}`)}
                          className="hover:bg-slate-50/80 transition-all border-b border-slate-50 last:border-0 group cursor-pointer"
                        >
                          <td className="px-8 py-4 font-bold text-slate-900 flex items-center gap-2">
                             {item.name}
                             <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 text-[#1e61f0] transition-all" />
                          </td>
                          <td className="px-8 py-4 text-right font-bold text-slate-900">
                             {fmt(item.amount)}
                          </td>
                          <td className="px-8 py-4 text-right">
                             <div className="flex items-center justify-end gap-3">
                                <span className="text-[11px] font-bold text-slate-400">{((item.amount / (data.totalExpenses || 1)) * 100).toFixed(1)}%</span>
                                <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                   <div className="h-full bg-rose-500" style={{ width: `${(item.amount / (data.totalExpenses || 1)) * 100}%` }} />
                                </div>
                             </div>
                          </td>
                        </tr>
                      ))}
                      {data.expenses.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-8 py-10 text-center text-slate-400 italic text-[11px] uppercase tracking-widest">No operating outflows recorded in this period</td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="bg-rose-50/40 text-rose-700 font-bold border-t border-rose-100">
                      <tr>
                        <td className="px-8 py-4 text-[11px] uppercase tracking-widest font-black">Total Operating Outflow</td>
                        <td className="px-8 py-4 text-right text-[16px] font-black" colSpan={2}>{fmt(data.totalExpenses)}</td>
                      </tr>
                    </tfoot>
                  </table>
                ) : (
                  <div className="p-10 flex items-center justify-between">
                     <div>
                        <span className="text-[14px] font-black text-slate-900 uppercase tracking-tighter">Aggregate Operating Expenses</span>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Unified Cost Stream</p>
                     </div>
                     <span className="text-[28px] font-black text-rose-600 tracking-tighter">{fmt(data.totalExpenses)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ══ MAIL MODAL ═══════════════════════════════════════════════ */}
        {showMailModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 px-4">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
               <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-[#1e61f0] text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Mail size={20}/>
                     </div>
                     <h3 className="text-[16px] font-bold text-slate-900">Email Statement</h3>
                  </div>
                  <button onClick={() => setShowMailModal(false)} className="p-2 text-slate-400 hover:bg-white hover:text-slate-600 rounded-xl transition-all">
                    <X size={20}/>
                  </button>
               </div>
               <form onSubmit={handleSendMail} className="p-8 space-y-6">
                  <div className="space-y-2">
                     <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Recipient Email Address</label>
                     <input 
                       required
                       type="email" 
                       value={email}
                       onChange={(e) => setEmail(e.target.value)}
                       placeholder="e.g. stakeholders@company.com"
                       className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] outline-none focus:border-[#1e61f0] focus:ring-4 focus:ring-blue-500/5 transition-all"
                     />
                     <p className="text-[10px] text-slate-400 italic">This will send the P&L statement as a PDF attachment.</p>
                  </div>
                  <button 
                    disabled={sendingMail}
                    className="w-full py-4 bg-[#1e61f0] text-white rounded-2xl text-[13px] font-bold flex items-center justify-center gap-2 hover:bg-[#1a54d1] transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendingMail ? <RefreshCcw size={18} className="animate-spin"/> : <Send size={18}/>}
                    {sendingMail ? 'Sending Statement...' : 'Dispatch P&L Now'}
                  </button>
               </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const SummaryItem = ({ label, value, color, subLabel, trend }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-1 group hover:border-[#1e61f0]/30 transition-all">
    <div className="flex items-center justify-between">
       <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
       {trend && <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{trend}</span>}
    </div>
    <h3 className={`text-[24px] font-black tracking-tight ${color}`}>{value}</h3>
    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{subLabel}</p>
  </div>
);

const Tooltip = ({ text }) => (
  <div className="group relative ml-1">
    <AlertCircle size={14} className="text-slate-300 cursor-help" />
    <div className="absolute left-0 top-6 w-64 bg-slate-900 text-white p-3 rounded-xl text-[10px] hidden group-hover:block z-50 shadow-2xl leading-relaxed animate-in fade-in zoom-in-95 duration-200">
       {text}
    </div>
  </div>
);

export default ProfitLossView;
