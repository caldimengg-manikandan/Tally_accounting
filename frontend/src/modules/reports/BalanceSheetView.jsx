import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, Landmark, RefreshCcw, Printer, 
  FileSpreadsheet, ShieldCheck, Scale, TrendingUp,
  LayoutGrid, PieChart, Coins, Download, Mail,
  MoreHorizontal, ChevronRight, AlertCircle, CheckCircle2,
  X, Send
} from 'lucide-react';
import { reportsAPI, mailAPI } from '../../services/api';

const BalanceSheetView = () => {
  const navigate = useNavigate();
  const [data, setData] = useState({ assets: [], liabilities: [], totalAssets: 0, totalLiabilities: 0 });
  const [loading, setLoading] = useState(true);
  const [basis, setBasis] = useState('Accrual');
  const [showMailModal, setShowMailModal] = useState(false);
  const [email, setEmail] = useState('');
  const [sendingMail, setSendingMail] = useState(false);
  const companyId = sessionStorage.getItem('companyId');

  const fetchBS = useCallback(async () => {
    if (!companyId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await reportsAPI.balanceSheet(companyId);
      if (res.data) setData(res.data);
    } catch (err) {
      console.error("Failed to fetch Balance Sheet:", err);
    }
    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    fetchBS();
  }, [fetchBS]);

  const handleSendMail = async (e) => {
    e.preventDefault();
    if (!email) return;
    setSendingMail(true);
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    try {
      await mailAPI.send({
        from: user.email,
        to: email,
        subject: `Balance Sheet Statement - ${new Date().toLocaleDateString()}`,
        text: `Attached is the Balance Sheet for ${basis} basis.`,
        companyId
      });
      alert('Report sent successfully!');
      setShowMailModal(false);
    } catch (err) {
      console.error(err);
      alert('Failed to send report.');
    }
    setSendingMail(false);
  };

  const fmt = (v) => v === 0 ? '₹0.00' : `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

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
            <h1 className="text-[18px] font-bold text-slate-900 tracking-tight leading-none">Balance Sheet</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">Statement of Financial Position</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-1">
             <button className="px-3 py-1.5 text-[11px] font-bold bg-white text-[#1e61f0] shadow-sm rounded transition-all">Equity & Liabilities</button>
             <button className="px-3 py-1.5 text-[11px] font-bold text-slate-400 hover:text-slate-600 rounded transition-all">Assets</button>
           </div>
           <div className="w-px h-6 bg-slate-200 mx-2" />
           <button onClick={fetchBS} className="p-2 text-slate-400 hover:text-[#1e61f0] transition-colors">
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
         <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
               <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Basis:</span>
               <select value={basis} onChange={(e) => setBasis(e.target.value)} className="bg-transparent text-[11px] font-bold text-slate-700 uppercase outline-none cursor-pointer hover:text-[#1e61f0]">
                  <option value="Accrual">Accrual</option>
                  <option value="Cash">Cash</option>
               </select>
               <Tooltip text="Statement as on current date reflecting all asset and liability balances." />
            </div>
            <div className="w-px h-4 bg-slate-200" />
            <div className="flex items-center gap-2">
               <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Date:</span>
               <span className="text-[11px] font-bold text-slate-700 uppercase tracking-widest">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            </div>
         </div>
         <div className="flex items-center gap-2">
            <button onClick={() => setShowMailModal(true)} className="p-1.5 text-slate-400 hover:text-[#1e61f0] rounded transition-all"><Mail size={16}/></button>
            <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded transition-all"><MoreHorizontal size={16}/></button>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">
        <div className="max-w-[1400px] mx-auto space-y-8">
          
          {/* ══ SUMMARY SECTION ════════════════════════════════════════ */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
             <SummaryItem 
               label="Total Assets" 
               value={fmt(data.totalAssets)} 
               color="text-emerald-600"
               subLabel="Holdings & Resources"
             />
             <SummaryItem 
               label="Total Liabilities" 
               value={fmt(data.totalLiabilities)} 
               color="text-[#1e61f0]"
               subLabel="Obligations & Capital"
             />
             <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm relative overflow-hidden group">
                <div className="flex items-center gap-4 relative z-10">
                   <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${Math.abs(data.totalAssets - data.totalLiabilities) < 0.01 ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500 animate-pulse'}`}>
                      <ShieldCheck size={24}/>
                   </div>
                   <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Equation Status</p>
                      <h3 className={`text-[16px] font-black tracking-tight ${Math.abs(data.totalAssets - data.totalLiabilities) < 0.01 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {Math.abs(data.totalAssets - data.totalLiabilities) < 0.01 ? 'Books Balanced' : 'Balance Sheet does not balance'}
                      </h3>
                   </div>
                </div>
                <div className="flex flex-col items-end gap-1 relative z-10">
                   <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100">Integrity Hash</span>
                   <div className="flex items-center gap-2 text-[#1e61f0]">
                      <CheckCircle2 size={16}/>
                      <span className="text-[11px] font-black uppercase tracking-widest">Verified</span>
                   </div>
                </div>
             </div>
          </div>

          {Math.abs(data.totalAssets - data.totalLiabilities) >= 0.01 && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 flex gap-3 text-rose-800 text-xs font-bold leading-relaxed no-print">
              <AlertCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-[13px] text-rose-900 mb-1">Balance Sheet does not balance</p>
                <p>The total Assets (₹{Number(data.totalAssets || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}) do not match the total Liabilities & Capital (₹{Number(data.totalLiabilities || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}).</p>
                <p className="mt-1 font-normal text-rose-700">This is usually caused by incomplete opening balances. Please go to Accountant → Ledgers → Capital Account and enter a Credit opening balance equal to the Trial Balance imbalance.</p>
              </div>
            </div>
          )}

          {/* ══ DUAL COLUMN CONTENT ═════════════════════════════════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* LIABILITIES SECTION */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
               <div className="px-8 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <Coins size={18} className="text-[#1e61f0]" />
                     <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-widest">Equity & Liabilities</h3>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Obligations</span>
               </div>
               <table className="w-full text-left border-collapse">
                  <thead className="bg-white text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-50">
                    <tr>
                      <th className="px-8 py-3">Account Head</th>
                      <th className="px-8 py-3 text-right">Balance (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="text-[12px] text-slate-600">
                    {data.liabilities.map((item, idx) => (
                      <tr 
                        key={idx} 
                        onClick={() => item.ledgerId && navigate(`/ledger-statement/${item.ledgerId}`)}
                        className="hover:bg-slate-50/80 transition-all border-b border-slate-50 last:border-0 group cursor-pointer"
                      >
                        <td className="px-8 py-4 font-bold text-slate-900 flex items-center gap-2">
                           {item.ledgerName}
                           <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 text-[#1e61f0] transition-all" />
                        </td>
                        <td className="px-8 py-4 text-right font-black text-slate-900">
                           {fmt(item.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50/80 text-slate-900 font-bold border-t border-slate-200">
                    <tr>
                      <td className="px-8 py-4 text-[11px] uppercase tracking-widest font-black">Total Liabilities</td>
                      <td className="px-8 py-4 text-right text-[15px] font-black">{fmt(data.totalLiabilities)}</td>
                    </tr>
                  </tfoot>
               </table>
            </div>

            {/* ASSETS SECTION */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
               <div className="px-8 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <Landmark size={18} className="text-emerald-500" />
                     <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-widest">Assets & Holdings</h3>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Resources</span>
               </div>
               <table className="w-full text-left border-collapse">
                  <thead className="bg-white text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-50">
                    <tr>
                      <th className="px-8 py-3">Account Head</th>
                      <th className="px-8 py-3 text-right">Balance (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="text-[12px] text-slate-600">
                    {data.assets.map((item, idx) => (
                      <tr 
                        key={idx} 
                        onClick={() => item.ledgerId && navigate(`/ledger-statement/${item.ledgerId}`)}
                        className="hover:bg-slate-50/80 transition-all border-b border-slate-50 last:border-0 group cursor-pointer"
                      >
                        <td className="px-8 py-4 font-bold text-slate-900 flex items-center gap-2">
                           {item.ledgerName}
                           <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 text-[#1e61f0] transition-all" />
                        </td>
                        <td className="px-8 py-4 text-right font-black text-emerald-600">
                           {fmt(item.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-emerald-50/30 text-emerald-700 font-bold border-t border-emerald-100">
                    <tr>
                      <td className="px-8 py-4 text-[11px] uppercase tracking-widest font-black">Total Assets</td>
                      <td className="px-8 py-4 text-right text-[15px] font-black">{fmt(data.totalAssets)}</td>
                    </tr>
                  </tfoot>
               </table>
            </div>

          </div>
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
                     <p className="text-[10px] text-slate-400 italic">This will send the Balance Sheet as a PDF attachment.</p>
                  </div>
                  <button 
                    disabled={sendingMail}
                    className="w-full py-4 bg-[#1e61f0] text-white rounded-2xl text-[13px] font-bold flex items-center justify-center gap-2 hover:bg-[#1a54d1] transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendingMail ? <RefreshCcw size={18} className="animate-spin"/> : <Send size={18}/>}
                    {sendingMail ? 'Sending Statement...' : 'Dispatch Statement Now'}
                  </button>
               </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const SummaryItem = ({ label, value, color, subLabel }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-1">
    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
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

export default BalanceSheetView;
