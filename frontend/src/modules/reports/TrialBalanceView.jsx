import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart2, RefreshCcw, Download, ArrowDownRight, ArrowUpRight,
  CheckCircle2, AlertCircle, ChevronRight
} from 'lucide-react';
import { reportsAPI } from '../../services/api';

const TrialBalanceView = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const companyId = localStorage.getItem('companyId');

  const fetchReport = async () => {
    if (!companyId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await reportsAPI.trialBalance(companyId);
      setData(res.data.trialBalance || []);
      setSummary(res.data.summary || null);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchReport(); }, [companyId]);

  const fmt = (v) => v === 0 ? '₹0.00' : `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  // Group ledgers by group name
  const grouped = useMemo(() => {
    return data.reduce((acc, row) => {
      const group = row.group || 'Ungrouped';
      if (!acc[group]) acc[group] = { ledgers: [], totalDebit: 0, totalCredit: 0 };
      acc[group].ledgers.push(row);
      acc[group].totalDebit += (parseFloat(row.totalDebit) || 0);
      acc[group].totalCredit += (parseFloat(row.totalCredit) || 0);
      return acc;
    }, {});
  }, [data]);

  if (!companyId) {
    return (
      <div className="py-20 flex flex-col items-center gap-4 text-slate-400 bg-white rounded-[2.5rem] border border-dashed border-slate-200 m-8">
        <AlertCircle size={40} className="text-blue-500" />
        <div className="text-center">
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">No Company Active</h3>
          <p className="text-sm font-bold mt-1">Please select a company from the Settings hub to view reports.</p>
        </div>
        <button onClick={() => navigate('/settings/company')} className="mt-4 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-slate-900/10">
          Go to Settings
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-fade-in font-[Inter]">
      
      {/* ══ HEADER HUB ══════════════════════════════════════════ */}
      <div className="flex justify-between items-end border-b border-slate-100 pb-8">
        <div>
           <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center border border-slate-800 shadow-xl shadow-slate-200/40"><BarChart2 size={18}/></div>
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-[0.2em]">Audit Report · Trial Balance</span>
           </div>
           <h1 className="text-3xl font-bold text-slate-900 tracking-tighter">Account Reconciliation</h1>
        </div>
        <div className="flex gap-3">
           <button onClick={fetchReport} className="p-2.5 border border-slate-100 rounded-xl bg-white hover:bg-slate-50 text-slate-400 shadow-sm"><RefreshCcw size={16}/></button>
           <button className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-slate-900/10 flex items-center gap-2">
             <Download size={16}/> Export Report
           </button>
        </div>
      </div>

      {/* ══ SUMMARY CARDS ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
         <SummaryCard label="Total Debit" value={fmt(summary?.totalDebit)} icon={<ArrowDownRight className="text-emerald-500"/>} />
         <SummaryCard label="Total Credit" value={fmt(summary?.totalCredit)} icon={<ArrowUpRight className="text-blue-500"/>} />
         <div className={`p-6 rounded-[1.5rem] border-2 flex items-center justify-between transition-all
            ${summary?.isBalanced ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'}`}>
            <div className="flex items-center gap-4">
               {summary?.isBalanced ? <CheckCircle2 size={24}/> : <AlertCircle size={24}/>}
               <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest opacity-60">Engine Status</div>
                  <div className="text-sm font-bold uppercase tracking-tighter">{summary?.isBalanced ? 'Books Balanced' : 'Imbalance Detected'}</div>
               </div>
            </div>
         </div>
      </div>

      {/* ══ REPORT TABLE ════════════════════════════════════════════ */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
        </div>
      ) : data.length === 0 ? (
        <div className="py-20 text-center text-slate-400 bg-white rounded-[2.5rem] border border-slate-100 italic">No transactions found for cluster audit.</div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/10 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#fcfdfe] text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 border-b border-slate-50">
              <tr>
                <th className="px-10 py-5">Account / Group</th>
                <th className="px-10 py-5">Nature</th>
                <th className="px-10 py-5 text-right">Opening (₹)</th>
                <th className="px-10 py-5 text-right">Debit (₹)</th>
                <th className="px-10 py-5 text-right">Credit (₹)</th>
                <th className="px-10 py-5 text-right">Closing (₹)</th>
              </tr>
            </thead>
            <tbody className="text-[13px] font-semibold text-slate-600">
              {Object.entries(grouped).map(([groupName, groupData]) => (
                <React.Fragment key={groupName}>
                  {/* Group separator row */}
                  <tr className="bg-slate-50/60 border-b border-slate-100/50">
                    <td className="px-10 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest" colSpan={3}>
                      {groupName}
                    </td>
                    <td className="px-10 py-2.5 text-right text-[10px] font-bold text-blue-400/80">{fmt(groupData.totalDebit)}</td>
                    <td className="px-10 py-2.5 text-right text-[10px] font-bold text-red-400/80">{fmt(groupData.totalCredit)}</td>
                    <td className="px-10 py-2.5" />
                  </tr>
                  {groupData.ledgers.map(row => (
                    <tr 
                      key={row.ledgerId} 
                      onClick={() => navigate(`/ledger-statement/${row.ledgerId}`)}
                      className="hover:bg-slate-50 transition-all cursor-pointer group border-b border-slate-50 last:border-0"
                    >
                      <td className="px-10 py-4 pl-14 font-bold text-slate-900 flex items-center gap-2">
                        {row.ledgerName}
                        <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 text-blue-500 transition-all" />
                      </td>
                      <td className="px-10 py-4">
                        <span className="px-2 py-1 bg-slate-100 text-[9px] font-bold uppercase tracking-wide text-slate-400 rounded-md border border-slate-200">
                          {row.nature || '—'}
                        </span>
                      </td>
                      <td className="px-10 py-4 text-right text-slate-500">
                        {fmt(row.openingBalance)}
                      </td>
                      <td className="px-10 py-4 text-right font-bold text-slate-900 border-x border-slate-50/50">
                        {row.totalDebit > 0 ? fmt(row.totalDebit) : '—'}
                      </td>
                      <td className="px-10 py-4 text-right font-bold text-slate-900">
                        {row.totalCredit > 0 ? fmt(row.totalCredit) : '—'}
                      </td>
                      <td className={`px-10 py-4 text-right font-bold ${(row.closingBalance || 0) >= 0 ? 'text-slate-900 font-bold' : 'text-rose-600'}`}>
                        {fmt(Math.abs(row.closingBalance || 0))}
                        <span className="text-[9px] ml-1 font-bold text-slate-400 uppercase tracking-widest">
                          {(row.closingBalance || 0) >= 0 ? 'Dr' : 'Cr'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
              {/* Grand Totals row */}
              <tr className="bg-slate-900 text-white font-bold">
                <td className="px-10 py-7 text-sm uppercase tracking-widest" colSpan={3}>Audit Grand Totals</td>
                <td className="px-10 py-7 text-right text-xl tracking-tighter">
                   {fmt(summary?.totalDebit)}
                </td>
                <td className="px-10 py-7 text-right text-xl tracking-tighter">
                   {fmt(summary?.totalCredit)}
                </td>
                <td className="px-10 py-7 text-right text-[10px] uppercase tracking-widest text-slate-400">
                  {summary?.isBalanced ? '✓ Integrated' : '⚠ Discrepancy'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const SummaryCard = ({ label, value, icon }) => (
  <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm flex items-center justify-between">
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <h3 className="text-xl font-bold text-slate-900 tracking-tighter">{value}</h3>
    </div>
    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
      {icon}
    </div>
  </div>
);

export default TrialBalanceView;
