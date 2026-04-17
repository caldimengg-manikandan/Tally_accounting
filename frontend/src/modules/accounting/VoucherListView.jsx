import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  FileText, Plus, Search, Filter, 
  Download, RefreshCcw,
  BookOpen, Eye, Edit2, Trash2, X
} from 'lucide-react';
import { voucherAPI } from '../../services/api';

const TYPE_COLORS = {
  Receipt: 'bg-emerald-100 text-emerald-700',
  Payment: 'bg-red-100 text-red-700',
  Journal: 'bg-blue-100 text-blue-700',
  Contra:  'bg-purple-100 text-purple-700',
};

const fmt = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const VoucherListView = ({ onCreateNew, onEdit, onView, onDelete, defaultType = '' }) => {
  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState(defaultType);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const companyId = localStorage.getItem('companyId');
  const user = useMemo(() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } }, []);
  const role = user.role || 'ADMIN';
  const canEdit = !['VIEWER', 'AUDITOR'].includes(role);
  const canCreate = !['VIEWER', 'AUDITOR', 'DATA_ENTRY'].includes(role) || role === 'DATA_ENTRY'; // Data entry can create but maybe not delete?


  const fetchVouchers = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const res = await voucherAPI.getByCompany(companyId);
      setAllData(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); }
    setLoading(false);
  }, [companyId]);

  useEffect(() => { fetchVouchers(); }, [fetchVouchers]);

  const filtered = useMemo(() => {
    return allData.filter(v => {
      const q = search.toLowerCase();
      const matchSearch = !search ||
        (v.narration || '').toLowerCase().includes(q) ||
        (v.voucherNumber || '').toLowerCase().includes(q);
      const matchType = !typeFilter || v.voucherType === typeFilter;
      const vDate = v.date ? new Date(v.date) : null;
      const matchFrom = !fromDate || (vDate && vDate >= new Date(fromDate));
      const matchTo   = !toDate   || (vDate && vDate <= new Date(toDate));
      return matchSearch && matchType && matchFrom && matchTo;
    });
  }, [allData, search, typeFilter, fromDate, toDate]);

  const totalAmount = useMemo(() =>
    filtered.reduce((s, v) => s + (v.Transactions || []).reduce((a, t) => a + (parseFloat(t.debit) || 0), 0), 0),
  [filtered]);

  const exportCSV = () => {
    const rows = [
      ['Voucher No', 'Date', 'Type', 'Narration', 'Amount (₹)'],
      ...filtered.map(v => {
        const amt = (v.Transactions || []).reduce((a, t) => a + (parseFloat(t.debit) || 0), 0);
        return [v.voucherNumber, fmtDate(v.date), v.voucherType, v.narration, amt.toFixed(2)];
      })
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'vouchers.csv'; a.click();
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex justify-between items-end border-b border-slate-100 pb-8">
        <div>
           <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white"><BookOpen size={18}/></div>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Transaction Journal</span>
           </div>
           <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Vouchers</h1>
        </div>
         <div className="flex gap-3">
            <button onClick={fetchVouchers} className="p-2.5 border border-slate-100 rounded-xl bg-white hover:bg-slate-50 text-slate-400 shadow-sm"><RefreshCcw size={16}/></button>
            <button onClick={exportCSV}     className="p-2.5 border border-slate-100 rounded-xl bg-white hover:bg-slate-50 text-slate-400 shadow-sm"><Download size={16}/></button>
            {canEdit && (
               <button onClick={onCreateNew}
                  className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2 hover:-translate-y-0.5 transition-all">
                  <Plus size={16}/> New Voucher
               </button>
            )}
         </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search size={14} className="text-slate-300 shrink-0" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search narration or voucher number..."
            className="flex-1 outline-none text-sm font-bold text-slate-700 placeholder:text-slate-300" />
          {search && <button onClick={() => setSearch('')}><X size={12} className="text-slate-300 hover:text-slate-600" /></button>}
        </div>

        {/* Type Filter */}
        <div className="flex gap-2">
          {['', 'Journal', 'Payment', 'Receipt', 'Contra'].map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider border transition-all
                ${typeFilter === t ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'}`}>
              {t || 'All'}
            </button>
          ))}
        </div>

        {/* Date range */}
        <div className="flex items-center gap-2">
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-600 outline-none focus:border-slate-400" />
          <span className="text-slate-300 text-xs font-bold">to</span>
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-600 outline-none focus:border-slate-400" />
          {(fromDate || toDate) && (
            <button onClick={() => { setFromDate(''); setToDate(''); }}
              className="text-[11px] font-black text-slate-400 hover:text-slate-700">Clear</button>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="flex gap-5 flex-wrap">
        {['Receipt', 'Payment', 'Journal', 'Contra'].map(t => {
          const count = filtered.filter(v => v.voucherType === t).length;
          const amt = filtered.filter(v => v.voucherType === t)
            .reduce((s, v) => s + (v.Transactions || []).reduce((a, t) => a + (parseFloat(t.debit) || 0), 0), 0);
          return (
            <div key={t} className={`px-4 py-3 rounded-2xl flex items-center gap-3 ${TYPE_COLORS[t] || 'bg-slate-100 text-slate-600'} bg-opacity-60`}>
              <span className="text-[11px] font-black uppercase tracking-wider">{t}</span>
              <span className="font-black">{count}</span>
              <span className="text-[11px] font-bold opacity-70">{fmt(amt)}</span>
            </div>
          );
        })}
        <div className="ml-auto px-4 py-3 rounded-2xl bg-slate-900 text-white flex items-center gap-3">
          <span className="text-[11px] font-black uppercase tracking-wider">Total</span>
          <span className="font-black">{filtered.length}</span>
          <span className="text-[11px] font-bold opacity-70">{fmt(totalAmount)}</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[#fcfdfe] text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 border-b border-slate-50">
            <tr>
              <th className="px-8 py-5">Voucher No.</th>
              <th className="px-8 py-5">Date</th>
              <th className="px-8 py-5">Type</th>
               <th className="px-8 py-5">Narration</th>
              <th className="px-8 py-5 text-right">Amount (₹)</th>
              {canEdit && <th className="px-8 py-5 text-center">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-[13px] font-semibold text-slate-700">
            {loading ? (
              <tr><td colSpan={6} className="py-16 text-center">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto" />
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="py-16 text-center">
                <p className="text-slate-300 font-bold mb-4">No vouchers found</p>
                <button onClick={onCreateNew} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black">
                  + Create First Voucher
                </button>
              </td></tr>
            ) : (
              filtered.map(v => {
                const amount = (v.Transactions || []).reduce((a, t) => a + (parseFloat(t.debit) || 0), 0);
                return (
                  <tr key={v.id} className="hover:bg-slate-50/40 transition-all">
                    <td className="px-8 py-4 font-black text-slate-900">{v.voucherNumber || '—'}</td>
                    <td className="px-8 py-4 text-slate-500">{fmtDate(v.date)}</td>
                    <td className="px-8 py-4">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${TYPE_COLORS[v.voucherType] || 'bg-slate-100 text-slate-600'}`}>
                        {v.voucherType || 'Journal'}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-slate-500 max-w-xs truncate">{v.narration || <span className="italic text-slate-300">No narration</span>}</td>
                     <td className="px-8 py-4 text-right font-black text-slate-900">{fmt(amount)}</td>
                    {canEdit && (
                      <td className="px-8 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => onEdit(v)} title="Edit"
                            className="w-8 h-8 rounded-lg border border-slate-100 flex items-center justify-center text-amber-500 hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all">
                            <Edit2 size={13}/>
                          </button>
                          <button onClick={() => { if(window.confirm('Delete this voucher?')) onDelete(v.id); }} title="Delete"
                            className="w-8 h-8 rounded-lg border border-slate-100 flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all">
                            <Trash2 size={13}/>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        {filtered.length > 0 && (
          <div className="px-8 py-4 border-t border-slate-50 bg-slate-50/30 flex justify-between items-center">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{filtered.length} of {allData.length} records</span>
            <span className="text-sm font-black text-slate-900">Total: {fmt(totalAmount)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoucherListView;
