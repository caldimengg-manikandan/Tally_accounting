import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ChevronLeft, ChevronRight, Download, RefreshCw, BookOpen, AlertCircle, Filter, Search, LayoutDashboard, X
} from 'lucide-react';
import { reportsAPI, ledgerAPI } from '../../services/api';
import { getCurrencyDisplay } from '../../utils/currencies';

const fmt = (v, currency) => {
  const sym = getCurrencyDisplay(currency || 'INR');
  return `${sym} ${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function LedgerStatementView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [error, setError] = useState('');

  // Sidebar List State
  const [ledgers, setLedgers] = useState([]);
  const [loadingLedgers, setLoadingLedgers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSideListCollapsed, setIsSideListCollapsed] = useState(false);

  const companyId = sessionStorage.getItem('companyId');

  // Fetch all ledgers to show in the sidebar
  const fetchAllLedgers = async () => {
    if (!companyId) return;
    setLoadingLedgers(true);
    try {
      const res = await ledgerAPI.getByCompany(companyId);
      setLedgers(res.data || []);
    } catch (err) {
      console.error('Failed to fetch ledgers list:', err);
    }
    setLoadingLedgers(false);
  };

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const res = await reportsAPI.ledgerStatement(id, from || undefined, to || undefined);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load statement');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAllLedgers();
  }, [companyId]);

  useEffect(() => {
    fetchData();
  }, [id]);

  const filteredLedgers = useMemo(() => {
    return ledgers.filter(l => 
      (l.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.groupName || l.Group?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [ledgers, searchQuery]);

  const exportCSV = () => {
    if (!data) return;
    const rows = [
      ['Date', 'Voucher No', 'Type', 'Narration', 'Debit', 'Credit', 'Balance'],
      ...data.entries.map(e => [
        fmtDate(e.date), e.voucherNumber, e.voucherType, e.narration,
        e.debit || 0, e.credit || 0, e.balance || 0
      ])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.ledger?.name || 'ledger'}-statement.csv`;
    a.click();
  };

  return (
    <div className="flex h-[calc(100vh-80px)] bg-[#fbfcff] overflow-hidden">
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* ─── SIDEBAR ─────────────────────────────────────── */}
      <div className={`${isSideListCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-[320px]'} border-r border-slate-200 bg-white flex flex-col shrink-0 transition-all duration-300 relative`}>
        {!isSideListCollapsed && (
          <button 
            onClick={() => setIsSideListCollapsed(true)}
            className="absolute -right-3 top-24 w-6 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-300 transition-all shadow-sm z-[60] cursor-pointer"
          >
            <ChevronLeft size={14} strokeWidth={3} />
          </button>
        )}
        <div className="p-4 border-b border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            {/* Active Ledgers */}
            <div className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity">
              <span className="text-[17px] font-bold text-slate-900 tracking-tight">Active Ledgers</span>
            </div>
          </div>
          
          {/* Search bar */}
          <div className="relative">
             <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 stroke-[2]" />
             <input 
               type="text" 
               placeholder="Search Ledgers" 
               value={searchQuery}
               onChange={e => setSearchQuery(e.target.value)}
               className="w-full pl-9 pr-3 py-1.5 text-[13px] bg-slate-50/50 border border-slate-200/80 rounded outline-none transition-all focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-100" 
             />
          </div>
        </div>
        
        {/* Ledgers List */}
        <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
          {loadingLedgers ? (
            <div className="py-20 text-center text-slate-400 text-xs font-bold uppercase tracking-widest animate-pulse">Loading list...</div>
          ) : filteredLedgers.length === 0 ? (
            <div className="p-10 text-center text-[12px] text-slate-400 font-semibold uppercase tracking-widest opacity-45 mt-20">NO LEDGERS FOUND</div>
          ) : filteredLedgers.map(l => (
            <div 
              key={l.id} 
              onClick={() => navigate(`/ledger-statement/${l.id}`)} 
              className={`px-5 py-4 cursor-pointer border-b border-slate-100/60 transition-all flex items-start gap-3.5 ${String(l.id) === String(id) ? 'bg-[#f4f7fd]' : 'hover:bg-slate-50/60'}`}
            >
              {/* Checkbox / Icon on the left */}
              <div className="pt-0.5" onClick={e => e.stopPropagation()}>
                <input 
                  type="checkbox" 
                  checked={String(l.id) === String(id)}
                  onChange={() => navigate(`/ledger-statement/${l.id}`)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </div>

              {/* Text Stack on the right */}
              <div className="flex-1 min-w-0 space-y-0.5">
                <p className={`text-[14px] font-medium truncate ${String(l.id) === String(id) ? 'text-slate-900 font-semibold' : 'text-slate-800'}`}>
                  {l.name}
                </p>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  {l.groupName || l.Group?.name || 'Group'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── MAIN CONTENT ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden shadow-2xl">
        <header className="px-8 py-5 flex items-center justify-between border-b border-slate-50 bg-[#fbfcff]">
           <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/ledgers')} 
                className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                title="Back to Ledgers"
              >
                <ChevronLeft size={18}/>
              </button>
              {isSideListCollapsed && (
                <button 
                  onClick={() => setIsSideListCollapsed(false)}
                  className="p-2 -ml-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                  title="Show Ledgers List"
                >
                  <LayoutDashboard size={20} />
                </button>
              )}
              <h1 className="text-[20px] font-bold text-slate-900 tracking-tight">{data?.ledger?.name || 'Ledger Statement'}</h1>
              {data?.ledger?.group && (
                <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest">
                  {data.ledger.group} · {data.ledger.nature}
                </span>
              )}
           </div>
           <div className="flex items-center gap-2.5">
              <button onClick={fetchData} className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 shadow-sm transition-all" title="Refresh">
                 <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </button>
              <button onClick={exportCSV} disabled={!data} className="bg-[#1e61f0] hover:bg-[#1a54d1] text-white px-6 py-2 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-500/10 flex items-center gap-2 transition-all disabled:opacity-40">
                 <Download size={16} /> Export CSV
              </button>
              <div className="w-px h-6 bg-slate-200 mx-1"></div>
              <button className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors duration-150" onClick={() => navigate('/ledgers')}><X size={20}/></button>
           </div>
        </header>

        {/* Content Panel */}
        <div className="flex-1 overflow-y-auto no-scrollbar bg-[#f8fbff] p-8 space-y-8">
          <div className="max-w-[1200px] mx-auto space-y-8">
            {/* Date Filter */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-wrap gap-4 items-end animate-fade-in no-print">
              <Filter size={16} className="text-slate-400 self-center" />
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">From Date</label>
                <input type="date" value={from} onChange={e => setFrom(e.target.value)}
                  className="border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all font-sans" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">To Date</label>
                <input type="date" value={to} onChange={e => setTo(e.target.value)}
                  className="border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all font-sans" />
              </div>
              <button onClick={fetchData} className="px-6 py-2.5 bg-[#1e61f0] hover:bg-[#1a54d1] text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md">
                Apply Filter
              </button>
            </div>

            {/* Summary Cards */}
            {data && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
                <SummaryCard 
                  label="Opening Balance" 
                  value={fmt(Math.abs(data.ledger.openingBalance), data.ledger.currency)} 
                  suffix={data.ledger.openingBalance < 0 ? 'Cr' : 'Dr'}
                  color="slate" 
                />
                <SummaryCard 
                  label="Closing Balance" 
                  value={fmt(Math.abs(data.ledger.closingBalance), data.ledger.currency)} 
                  suffix={data.ledger.closingBalance < 0 ? 'Cr' : 'Dr'}
                  color={data.ledger.closingBalance < 0 ? 'rose' : 'blue'} 
                />
                <SummaryCard 
                  label="Total Ledger Entries" 
                  value={data.entries.length} 
                  suffix="Vouchers"
                  color="emerald" 
                />
              </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden animate-fade-in">
              <div className="h-14 px-8 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Transaction Ledger</span>
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                  {data?.entries?.length || 0} entries
                </span>
              </div>

              {loading ? (
                <div className="py-20 flex justify-center">
                  <RefreshCw className="animate-spin text-[#1e61f0]" size={28} />
                </div>
              ) : error ? (
                <div className="py-20 flex flex-col items-center gap-3 text-red-400">
                  <AlertCircle size={32} />
                  <p className="text-sm font-bold">{error}</p>
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead className="bg-[#fcfdfe] text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 border-b border-slate-50 border-l-[6px] border-l-transparent">
                    <tr>
                      <th className="px-8 py-4">Date</th>
                      <th className="px-8 py-4">Voucher No.</th>
                      <th className="px-8 py-4">Type</th>
                      <th className="px-8 py-4">Narration</th>
                      <th className="px-8 py-4 text-right">Debit</th>
                      <th className="px-8 py-4 text-right">Credit</th>
                      <th className="px-8 py-4 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-[13px] font-semibold text-slate-600">
                    {/* Opening balance row */}
                    <tr className="bg-slate-50/50 border-l-[6px] border-l-slate-300">
                      <td className="px-8 py-3" colSpan={4}>
                        <span className="text-[11px] font-bold uppercase text-slate-400 tracking-widest">Opening Balance</span>
                      </td>
                      <td className="px-8 py-3 text-right" />
                      <td className="px-8 py-3 text-right" />
                      <td className="px-8 py-3 text-right font-bold text-slate-700">{fmt(data?.ledger?.openingBalance, data?.ledger?.currency)}</td>
                    </tr>
                    {data?.entries?.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-16 text-center text-slate-300 font-bold text-sm">
                          No transactions found for this period.
                        </td>
                      </tr>
                    ) : (
                      data?.entries?.map((e) => (
                        <tr key={e.id} className="hover:bg-slate-50/50 transition-all border-l-[6px] border-l-transparent">
                          <td className="px-8 py-4">{fmtDate(e.date)}</td>
                          <td className="px-8 py-4 text-blue-600 font-bold">{e.voucherNumber}</td>
                          <td className="px-8 py-4">
                            <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold uppercase tracking-wide">
                              {e.voucherType}
                            </span>
                          </td>
                          <td className="px-8 py-4 text-slate-500 max-w-xs truncate font-medium">{e.narration}</td>
                          <td className="px-8 py-4 text-right font-bold text-blue-600">
                            {e.debit > 0 ? fmt(e.debit, data?.ledger?.currency) : '—'}
                          </td>
                          <td className="px-8 py-4 text-right font-bold text-red-500">
                            {e.credit > 0 ? fmt(e.credit, data?.ledger?.currency) : '—'}
                          </td>
                          <td className={`px-8 py-4 text-right font-bold ${e.balance >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
                            {fmt(Math.abs(e.balance), data?.ledger?.currency)}{e.balance < 0 ? ' Cr' : ' Dr'}
                          </td>
                        </tr>
                      ))
                    )}
                    {/* Closing row */}
                    {data && data.entries.length > 0 && (
                      <tr className="bg-slate-50/50 border-t border-slate-200 font-bold border-l-[6px] border-l-blue-500">
                        <td className="px-8 py-6" colSpan={4}>
                          <div className="flex flex-col">
                             <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">Fiscal Reconciliation</span>
                             <span className="text-xs font-bold text-slate-950 uppercase tracking-widest">Aggregate Closing Balance</span>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right" />
                        <td className="px-8 py-6 text-right" />
                        <td className="px-8 py-6 text-right">
                           <div className="flex flex-col items-end gap-1">
                              <span className="text-2xl font-black text-blue-600 tracking-tighter leading-none">
                                 {fmt(Math.abs(data.ledger.closingBalance), data.ledger.currency)}
                              </span>
                              <div className="flex items-center gap-2">
                                 <span className={`text-[9px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded border ${data.ledger.closingBalance < 0 ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                    {data.ledger.closingBalance < 0 ? 'Credit Balance' : 'Debit Balance'}
                                 </span>
                              </div>
                           </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const SummaryCard = ({ label, value, suffix, color }) => {
  const colors = {
    blue: 'bg-blue-50/40 border-blue-100 text-blue-600',
    rose: 'bg-rose-50/40 border-rose-100 text-rose-600',
    slate: 'bg-slate-50/40 border-slate-100 text-slate-600',
    emerald: 'bg-emerald-50/40 border-emerald-100 text-emerald-600',
  };

  return (
    <div className={`p-6 rounded-2xl border shadow-sm flex justify-between items-center transition-all hover:shadow-md ${colors[color] || colors.slate}`}>
      <div>
        <p className="text-[10px] font-black uppercase opacity-60 tracking-[0.1em] mb-1">{label}</p>
        <div className="flex items-baseline gap-2">
           <h3 className="text-2xl font-black tracking-tighter leading-none">
             {value}
           </h3>
           {suffix && <span className="text-[10px] font-black uppercase opacity-50">{suffix}</span>}
        </div>
      </div>
    </div>
  );
};
