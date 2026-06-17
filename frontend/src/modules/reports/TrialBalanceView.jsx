import { getUser } from '../../stores/authStore';
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart2, RefreshCcw, Download, ArrowDownRight, ArrowUpRight,
  CheckCircle2, AlertCircle, ChevronRight, FileText, Printer, Mail, MoreHorizontal,
  X, Send
} from 'lucide-react';
import { reportsAPI, mailAPI } from '../../services/api';
import useNotificationStore from '../../store/notificationStore';

const TrialBalanceView = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [basis, setBasis] = useState('Accrual');
  const [viewType, setViewType] = useState('Report'); // 'Report' or 'Ledger Wise'
  const [showMailModal, setShowMailModal] = useState(false);
  const [email, setEmail] = useState('');
  const [sendingMail, setSendingMail] = useState(false);
  const companyId = sessionStorage.getItem('companyId');
  const { addNotification } = useNotificationStore();

  const fetchReport = async () => {
    if (!companyId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await reportsAPI.trialBalance(companyId, basis);
      setData(res.data.trialBalance || []);
      setSummary(res.data.summary || null);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchReport(); }, [companyId, basis]);

  const handleSendMail = async (e) => {
    e.preventDefault();
    if (!email) return;
    setSendingMail(true);
    const user = getUser();
    try {
      await mailAPI.send({
        from: user.email,
        to: email,
        subject: `Trial Balance Report - ${new Date().toLocaleDateString()}`,
        text: `Attached is the Trial Balance report (${viewType}) for ${basis} basis.`,
        companyId
      });
      addNotification('Report sent successfully!', 'success');
      setShowMailModal(false);
    } catch (err) {
      console.error(err);
      addNotification('Failed to send report. Please ensure your email is configured in the system.', 'error');
    }
    setSendingMail(false);
  };

  const fmt = (v) => {
    if (v === 0 || v === '0' || !v) return '—';
    return `₹${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  const grouped = useMemo(() => {
    return data.reduce((acc, row) => {
      const group = row.groupName || 'Ungrouped';
      if (!acc[group]) {
        acc[group] = { 
          ledgers: [], 
          totalTransactionDebits: 0, 
          totalTransactionCredits: 0, 
          totalDebitBalance: 0, 
          totalCreditBalance: 0 
        };
      }
      acc[group].ledgers.push(row);
      acc[group].totalTransactionDebits += (parseFloat(row.transactionDebits) || 0);
      acc[group].totalTransactionCredits += (parseFloat(row.transactionCredits) || 0);
      acc[group].totalDebitBalance += (parseFloat(row.debitBalance) || 0);
      acc[group].totalCreditBalance += (parseFloat(row.creditBalance) || 0);
      return acc;
    }, {});
  }, [data]);

  // Flattened data for Ledger Wise view
  const flattenedLedgers = useMemo(() => {
    return [...data].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [data]);

  const totalTransDebitsSum = useMemo(() => data.reduce((s, r) => s + (parseFloat(r.transactionDebits) || 0), 0), [data]);
  const totalTransCreditsSum = useMemo(() => data.reduce((s, r) => s + (parseFloat(r.transactionCredits) || 0), 0), [data]);

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

  const diff = summary ? Math.abs((summary.totalDebit || 0) - (summary.totalCredit || 0)) : 0;

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] animate-fade-in font-sans overflow-hidden">
      
      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-40 no-print shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <h1 className="text-[18px] font-bold text-slate-900 tracking-tight leading-none">Trial Balance</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">Audit & Reconciliation Report</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-1">
             <button 
               onClick={() => setViewType('Report')}
               className={`px-3 py-1.5 text-[11px] font-bold rounded transition-all ${viewType === 'Report' ? 'bg-white text-[#1e61f0] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
             >
               Report
             </button>
             <button 
               onClick={() => setViewType('Ledger Wise')}
               className={`px-3 py-1.5 text-[11px] font-bold rounded transition-all ${viewType === 'Ledger Wise' ? 'bg-white text-[#1e61f0] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
             >
               Ledger Wise
             </button>
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
         <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
               <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Basis:</span>
               <select 
                 value={basis}
                 onChange={(e) => setBasis(e.target.value)}
                 className="bg-transparent text-[11px] font-bold text-slate-700 uppercase outline-none cursor-pointer hover:text-[#1e61f0]"
               >
                  <option value="Accrual">Accrual</option>
                  <option value="Cash">Cash</option>
               </select>
               <div className="group relative ml-1">
                  <AlertCircle size={14} className="text-slate-300 cursor-help" />
                  <div className="absolute left-0 top-6 w-64 bg-slate-900 text-white p-3 rounded-xl text-[10px] hidden group-hover:block z-50 shadow-2xl leading-relaxed">
                     <p><span className="font-bold text-blue-400">Accrual Basis:</span> Records revenue when earned and expenses when incurred, regardless of when cash changes hands.</p>
                     <p className="mt-2"><span className="font-bold text-emerald-400">Cash Basis:</span> Records revenue and expenses only when cash is actually received or paid.</p>
                  </div>
               </div>
            </div>
            <div className="w-px h-4 bg-slate-200" />
            <div className="flex items-center gap-2">
               <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Currency:</span>
               <span className="text-[11px] font-bold text-slate-700 uppercase tracking-widest">INR - Indian Rupee</span>
            </div>
         </div>
         <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowMailModal(true)}
              className="p-1.5 text-slate-400 hover:text-[#1e61f0] rounded transition-all"
            >
              <Mail size={16}/>
            </button>
            <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded transition-all"><MoreHorizontal size={16}/></button>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">
        <div className="max-w-[1400px] mx-auto space-y-8">
          
          {/* ══ SUMMARY SECTION ════════════════════════════════════════ */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
             <SummaryItem 
               label="Total Debit" 
               value={summary?.totalDebit > 0 ? `₹${Number(summary.totalDebit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'} 
               color="text-slate-900"
               subLabel="Accumulated Debits"
             />
             <SummaryItem 
               label="Total Credit" 
               value={summary?.totalCredit > 0 ? `₹${Number(summary.totalCredit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'} 
               color="text-slate-900"
               subLabel="Accumulated Credits"
             />
             <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                   <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${summary?.isBalanced ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                      {summary?.isBalanced ? <CheckCircle2 size={24}/> : <AlertCircle size={24}/>}
                   </div>
                   <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Status</p>
                      <h3 className={`text-[14px] font-black tracking-tight leading-relaxed ${summary?.isBalanced ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {summary?.isBalanced 
                          ? 'Balanced ✓' 
                          : `Imbalance of ₹${Number(diff).toLocaleString('en-IN', { minimumFractionDigits: 2 })} detected. Likely cause: Opening balances are incomplete. Please add Credit opening balance to Capital Account.`}
                      </h3>
                   </div>
                </div>
             </div>
          </div>

          {/* ══ REPORT TABLE ════════════════════════════════════════════ */}
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-100">
              <div className="w-10 h-10 border-4 border-slate-100 border-t-[#1e61f0] rounded-full animate-spin mb-4" />
              <p className="text-[11px] font-bold uppercase text-slate-400 tracking-widest">Generating Report...</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-4">Account Name</th>
                    <th className="px-6 py-4">Nature</th>
                    <th className="px-6 py-4 text-right">Opening (₹)</th>
                    <th className="px-6 py-4 text-right">Total Dr</th>
                    <th className="px-6 py-4 text-right">Total Cr</th>
                    <th className="px-6 py-4 text-right">Closing Dr</th>
                    <th className="px-8 py-4 text-right">Closing Cr</th>
                  </tr>
                </thead>
                <tbody className="text-[12px] text-slate-600">
                  {viewType === 'Report' ? (
                    // GROUPED VIEW
                    Object.entries(grouped).map(([groupName, groupData]) => (
                      <React.Fragment key={groupName}>
                        {/* Group Header */}
                        <tr className="bg-slate-50/20 border-b border-slate-100">
                          <td className="px-8 py-2.5 text-[11px] font-bold text-[#1e61f0] uppercase tracking-widest" colSpan={3}>
                            {groupName}
                          </td>
                          <td className="px-6 py-2.5 text-right text-[11px] font-bold text-slate-400">{fmt(groupData.totalTransactionDebits)}</td>
                          <td className="px-6 py-2.5 text-right text-[11px] font-bold text-slate-400">{fmt(groupData.totalTransactionCredits)}</td>
                          <td className="px-6 py-2.5 text-right text-[11px] font-bold text-slate-400">{fmt(groupData.totalDebitBalance)}</td>
                          <td className="px-8 py-2.5 text-right text-[11px] font-bold text-slate-400">{fmt(groupData.totalCreditBalance)}</td>
                        </tr>
                        {groupData.ledgers.map(row => (
                          <DataRow key={row.id} row={row} navigate={navigate} fmt={fmt} />
                        ))}
                      </React.Fragment>
                    ))
                  ) : (
                    // LEDGER WISE VIEW (Flat List)
                    flattenedLedgers.map(row => (
                      <DataRow key={row.id} row={row} navigate={navigate} fmt={fmt} />
                    ))
                  )}
                </tbody>
                <tfoot className="bg-slate-50/80 text-slate-900 font-bold border-t-2 border-slate-200">
                  <tr>
                    <td className="px-8 py-5 text-[11px] uppercase tracking-[0.2em] font-black text-slate-500" colSpan={2}>
                      <div className="flex items-center gap-4">
                        <span>Grand Totals</span>
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${summary?.isBalanced ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-rose-50 border-rose-200 text-rose-600'}`}>
                          {summary?.isBalanced ? 'Balanced ✓' : 'Imbalance'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5" />
                    <td className="px-6 py-5 text-right text-[15px] font-black tracking-tight">{fmt(totalTransDebitsSum)}</td>
                    <td className="px-6 py-5 text-right text-[15px] font-black tracking-tight">{fmt(totalTransCreditsSum)}</td>
                    <td className="px-6 py-5 text-right text-[15px] font-black tracking-tight">
                      <div className="flex items-center justify-end gap-1.5">
                        {fmt(summary?.totalDebit)}
                        {summary?.isBalanced && <CheckCircle2 size={14} className="text-emerald-500" />}
                        {!summary?.isBalanced && <AlertCircle size={14} className="text-rose-500" />}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right text-[15px] font-black tracking-tight">
                      <div className="flex items-center justify-end gap-1.5">
                        {fmt(summary?.totalCredit)}
                        {summary?.isBalanced && <CheckCircle2 size={14} className="text-emerald-500" />}
                        {!summary?.isBalanced && <AlertCircle size={14} className="text-rose-500" />}
                      </div>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Troubleshooting helper text */}
          {summary && !summary.isBalanced && (
            <div className="bg-[#f0f4ff] border border-blue-150 rounded-2xl p-5 flex gap-3 text-blue-900 text-xs font-bold leading-relaxed no-print">
              <AlertCircle size={18} className="text-[#1e61f0] shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-[13px] text-blue-950 mb-1">Troubleshooting Tip</p>
                <p>Tip: If you see an imbalance, go to Accountant → Ledgers → Capital Account → set opening balance = total of all Debit opening balances entered</p>
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
                     <h3 className="text-[16px] font-bold text-slate-900">Email Report</h3>
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
                       placeholder="e.g. accountant@company.com"
                       className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] outline-none focus:border-[#1e61f0] focus:ring-4 focus:ring-blue-500/5 transition-all"
                     />
                     <p className="text-[10px] text-slate-400 italic">This will send the current {viewType} ({basis} basis) report as a PDF attachment.</p>
                  </div>
                  <button 
                    disabled={sendingMail}
                    className="w-full py-4 bg-[#1e61f0] text-white rounded-2xl text-[13px] font-bold flex items-center justify-center gap-2 hover:bg-[#1a54d1] transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendingMail ? <RefreshCcw size={18} className="animate-spin"/> : <Send size={18}/>}
                    {sendingMail ? 'Sending Report...' : 'Dispatch Report Now'}
                  </button>
               </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Extracted Row Component for reusability
const DataRow = ({ row, navigate, fmt }) => (
  <tr 
    onClick={() => navigate(`/ledger-statement/${row.id}`)}
    className="hover:bg-slate-50 transition-all cursor-pointer group border-b border-slate-50 last:border-0"
  >
    <td className="px-8 py-4 pl-12 font-bold text-slate-900 flex items-center gap-2">
      <div className="flex flex-col">
        <span>{row.name}</span>
        {row.groupName && <span className="text-[9px] text-slate-400 font-medium uppercase tracking-tighter">{row.groupName}</span>}
      </div>
      <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 text-[#1e61f0] transition-all" />
    </td>
    <td className="px-6 py-4">
      <span className="px-2 py-0.5 bg-slate-50 text-[9px] font-bold uppercase tracking-widest text-slate-400 rounded border border-slate-200">
        {row.nature || '—'}
      </span>
    </td>
    <td className="px-6 py-4 text-right text-slate-500 font-medium">
      {row.openingBalance > 0 ? (
        <>
          {fmt(row.openingBalance)}
          <span className="text-[9px] ml-1 text-slate-300 uppercase">
            {row.openingBalanceType || 'Dr'}
          </span>
        </>
      ) : '—'}
    </td>
    <td className="px-6 py-4 text-right text-slate-500 font-medium">
      {fmt(row.transactionDebits)}
    </td>
    <td className="px-6 py-4 text-right text-slate-500 font-medium">
      {fmt(row.transactionCredits)}
    </td>
    <td className="px-6 py-4 text-right font-bold text-slate-900">
      {fmt(row.debitBalance)}
    </td>
    <td className="px-8 py-4 text-right font-bold text-slate-900">
      {fmt(row.creditBalance)}
    </td>
  </tr>
);

const SummaryItem = ({ label, value, color, subLabel }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-1">
    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
    <h3 className={`text-[24px] font-bold tracking-tight ${color}`}>{value}</h3>
    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{subLabel}</p>
  </div>
);

export default TrialBalanceView;
