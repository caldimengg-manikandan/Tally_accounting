import React, { useState, useEffect, useMemo } from 'react';
import {
  ClipboardList, Search, Download, RefreshCcw,
  ChevronUp, ChevronDown, X, BookOpen
} from 'lucide-react';
import { voucherAPI } from '../../services/api';

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmt = (v) =>
  `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

const TYPE_BADGE = {
  Payment: 'bg-red-100 text-red-700',
  Receipt: 'bg-emerald-100 text-emerald-700',
  Journal: 'bg-blue-100 text-blue-700',
  Contra:  'bg-purple-100 text-purple-700',
  Sales:   'bg-sky-100 text-sky-700',
  Purchase:'bg-orange-100 text-orange-700',
  'Debit Note': 'bg-amber-100 text-amber-700',
  'Credit Note': 'bg-teal-100 text-teal-700',
};

const JournalEntriesView = ({ companyId: propCompanyId }) => {
  const companyId = propCompanyId || localStorage.getItem('companyId');
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sortField, setSortField]   = useState('createdAt');
  const [sortDir, setSortDir]       = useState('desc');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate]     = useState('');

  const fetchData = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const res = await voucherAPI.getTransactions(companyId);
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [companyId]);

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const allTypes = useMemo(() =>
    [...new Set(rows.map(r => r.Voucher?.voucherType).filter(Boolean))], [rows]);

  const filtered = useMemo(() => {
    let data = rows.filter(r => {
      const q = search.toLowerCase();
      const matchSearch = !search ||
        (r.Ledger?.name || '').toLowerCase().includes(q) ||
        (r.Voucher?.narration || '').toLowerCase().includes(q) ||
        (r.Voucher?.voucherNumber || '').toLowerCase().includes(q);
      const matchType = !typeFilter || r.Voucher?.voucherType === typeFilter;
      const vDate = r.Voucher?.date ? new Date(r.Voucher.date) : null;
      const matchFrom = !fromDate || (vDate && vDate >= new Date(fromDate));
      const matchTo   = !toDate   || (vDate && vDate <= new Date(toDate));
      return matchSearch && matchType && matchFrom && matchTo;
    });

    data.sort((a, b) => {
      let av, bv;
      if (sortField === 'date')   { av = a.Voucher?.date || ''; bv = b.Voucher?.date || ''; }
      else if (sortField === 'debit')  { av = parseFloat(a.debit || 0); bv = parseFloat(b.debit || 0); }
      else if (sortField === 'credit') { av = parseFloat(a.credit || 0); bv = parseFloat(b.credit || 0); }
      else { av = a.createdAt || ''; bv = b.createdAt || ''; }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return data;
  }, [rows, search, typeFilter, sortField, sortDir, fromDate, toDate]);

  const totalDebit  = useMemo(() => filtered.reduce((s, r) => s + parseFloat(r.debit || 0), 0), [filtered]);
  const totalCredit = useMemo(() => filtered.reduce((s, r) => s + parseFloat(r.credit || 0), 0), [filtered]);

  const exportCSV = () => {
    const headers = ['Voucher No', 'Date', 'Type', 'Ledger', 'Debit (₹)', 'Credit (₹)', 'Narration'];
    const csvRows = filtered.map(r => [
      r.Voucher?.voucherNumber || '',
      fmtDate(r.Voucher?.date),
      r.Voucher?.voucherType || '',
      r.Ledger?.name || '',
      parseFloat(r.debit || 0).toFixed(2),
      parseFloat(r.credit || 0).toFixed(2),
      (r.Voucher?.narration || '').replace(/,/g, ';'),
    ]);
    const csv = [headers, ...csvRows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'journal_entries.csv'; a.click();
  };

  const SortIcon = ({ field }) => (
    sortField === field
      ? (sortDir === 'asc' ? <ChevronUp size={12} className="inline ml-1 text-indigo-600" /> : <ChevronDown size={12} className="inline ml-1 text-indigo-600" />)
      : <ChevronDown size={12} className="inline ml-1 text-slate-300" />
  );

  return (
    <div className="p-8 max-w-[1700px] mx-auto space-y-8 animate-fade-in">

      {/* Header */}
      <div className="flex justify-between items-end border-b border-slate-100 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
              <ClipboardList size={18} />
            </div>
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-[0.2em]">Accounting Ledger</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tighter">Journal Entries</h1>
          <p className="text-sm text-slate-400 font-medium mt-1">All individual double-entry transaction lines across all vouchers</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchData} className="p-2.5 border border-slate-100 rounded-xl bg-white hover:bg-slate-50 text-slate-400 shadow-sm transition-all">
            <RefreshCcw size={16} />
          </button>
          <button onClick={exportCSV} className="p-2.5 border border-slate-100 rounded-xl bg-white hover:bg-slate-50 text-slate-400 shadow-sm transition-all">
            <Download size={16} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search size={14} className="text-slate-300 shrink-0" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search ledger, narration or voucher number..."
            className="flex-1 outline-none text-sm font-semibold text-slate-700 placeholder:text-slate-300" />
          {search && <button onClick={() => setSearch('')}><X size={12} className="text-slate-300 hover:text-slate-600" /></button>}
        </div>

        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setTypeFilter('')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider border transition-all ${!typeFilter ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'}`}>
            All
          </button>
          {allTypes.map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider border transition-all ${typeFilter === t ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'}`}>
              {t}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-600 outline-none focus:border-slate-400" />
          <span className="text-slate-300 text-xs font-bold">to</span>
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-600 outline-none focus:border-slate-400" />
          {(fromDate || toDate) && (
            <button onClick={() => { setFromDate(''); setToDate(''); }}
              className="text-[11px] font-bold text-slate-400 hover:text-slate-700">Clear</button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-5">
        {[
          { label: 'Total Entries', value: filtered.length, color: 'bg-slate-900 text-white', mono: false },
          { label: 'Total Debits',  value: fmt(totalDebit),  color: 'bg-red-50 text-red-700 border border-red-100', mono: true },
          { label: 'Total Credits', value: fmt(totalCredit), color: 'bg-emerald-50 text-emerald-700 border border-emerald-100', mono: true },
        ].map(card => (
          <div key={card.label} className={`${card.color} rounded-2xl px-6 py-5 flex flex-col gap-1`}>
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">{card.label}</span>
            <span className={`text-2xl font-black tracking-tight ${card.mono ? 'font-mono' : ''}`}>{card.value}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[#fcfdfe] text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 border-b border-slate-50">
            <tr>
              <th className="px-6 py-5">Voucher No.</th>
              <th className="px-6 py-5 cursor-pointer select-none" onClick={() => toggleSort('date')}>
                Date <SortIcon field="date" />
              </th>
              <th className="px-6 py-5">Type</th>
              <th className="px-6 py-5">Ledger Account</th>
              <th className="px-6 py-5 text-right cursor-pointer select-none" onClick={() => toggleSort('debit')}>
                Debit (₹) <SortIcon field="debit" />
              </th>
              <th className="px-6 py-5 text-right cursor-pointer select-none" onClick={() => toggleSort('credit')}>
                Credit (₹) <SortIcon field="credit" />
              </th>
              <th className="px-6 py-5 max-w-xs">Narration</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-[13px] font-semibold text-slate-700">
            {loading ? (
              <tr><td colSpan={7} className="py-16 text-center">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
                <p className="mt-3 text-sm text-slate-400 font-medium">Loading journal entries...</p>
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="py-16 text-center">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <BookOpen size={20} className="text-slate-400" />
                </div>
                <p className="text-slate-400 font-bold">No journal entries found</p>
                <p className="text-slate-300 text-xs font-medium mt-1">Create vouchers to see journal entries here</p>
              </td></tr>
            ) : (
              filtered.map((r, i) => {
                const debit  = parseFloat(r.debit  || 0);
                const credit = parseFloat(r.credit || 0);
                return (
                  <tr key={r.id || i} className="hover:bg-slate-50/50 transition-all">
                    <td className="px-6 py-4 font-bold text-slate-900 font-mono text-xs">
                      {r.Voucher?.voucherNumber || '—'}
                    </td>
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                      {fmtDate(r.Voucher?.date)}
                    </td>
                    <td className="px-6 py-4">
                      {r.Voucher?.voucherType && (
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${TYPE_BADGE[r.Voucher.voucherType] || 'bg-slate-100 text-slate-600'}`}>
                          {r.Voucher.voucherType}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{r.Ledger?.name || '—'}</div>
                      {r.Ledger?.code && <div className="text-[10px] text-slate-400 font-mono mt-0.5">{r.Ledger.code}</div>}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold">
                      {debit > 0 ? (
                        <span className="text-red-600">{fmt(debit)}</span>
                      ) : (
                        <span className="text-slate-200">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold">
                      {credit > 0 ? (
                        <span className="text-emerald-600">{fmt(credit)}</span>
                      ) : (
                        <span className="text-slate-200">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500 max-w-xs truncate text-xs">
                      {r.Voucher?.narration || <span className="italic text-slate-300">No narration</span>}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          {filtered.length > 0 && (
            <tfoot className="bg-slate-50/80 border-t-2 border-slate-100">
              <tr>
                <td colSpan={4} className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  Showing {filtered.length} of {rows.length} entries
                </td>
                <td className="px-6 py-4 text-right font-mono font-black text-red-600">
                  {fmt(totalDebit)}
                </td>
                <td className="px-6 py-4 text-right font-mono font-black text-emerald-600">
                  {fmt(totalCredit)}
                </td>
                <td className="px-6 py-4">
                  <span className={`text-[11px] font-bold px-2 py-1 rounded-lg ${Math.abs(totalDebit - totalCredit) < 0.01 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {Math.abs(totalDebit - totalCredit) < 0.01 ? '✓ Balanced' : '⚠ Unbalanced'}
                  </span>
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};

export default JournalEntriesView;
