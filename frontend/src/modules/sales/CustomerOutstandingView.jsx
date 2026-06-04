import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Search, Download, RefreshCcw, X,
  TrendingUp, AlertCircle, CheckCircle2, Clock, ChevronRight
} from 'lucide-react';
import { ledgerAPI, reportsAPI } from '../../services/api';

const fmt = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const getStatus = (outstanding, invoiceTotal, dueDate) => {
  if (outstanding <= 0.01) return 'Paid';
  if (dueDate && new Date(dueDate) < new Date()) return 'Overdue';
  if (outstanding < invoiceTotal - 0.01) return 'Partially Paid';
  return 'Unpaid';
};

const STATUS_STYLE = {
  'Paid':           { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  'Partially Paid': { bg: 'bg-amber-100',   text: 'text-amber-700',   dot: 'bg-amber-500' },
  'Unpaid':         { bg: 'bg-red-100',     text: 'text-red-700',     dot: 'bg-red-500' },
  'Overdue':        { bg: 'bg-rose-100',    text: 'text-rose-800',    dot: 'bg-rose-600' },
};

const CustomerOutstandingView = ({ companyId: propCompanyId }) => {
  const companyId = propCompanyId || localStorage.getItem('companyId');
  const navigate  = useNavigate();

  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchData = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const res = await reportsAPI.receivablesReport(companyId);
      setData(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error('Failed to load receivables:', e);
      setData([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [companyId]);

  const enriched = useMemo(() => data.map(inv => {
    const invoiceTotal = parseFloat(inv.totalAmount || inv.amount || 0);
    const received     = parseFloat(inv.amountPaid || inv.received || 0);
    const outstanding  = Math.max(0, invoiceTotal - received);
    const status       = getStatus(outstanding, invoiceTotal, inv.dueDate);
    return { ...inv, invoiceTotal, received, outstanding, status };
  }), [data]);

  const filtered = useMemo(() => enriched.filter(inv => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      (inv.customerName || inv.Customer?.name || inv.Ledger?.name || '').toLowerCase().includes(q) ||
      (inv.invoiceNumber || inv.number || '').toLowerCase().includes(q);
    const matchStatus = !statusFilter || inv.status === statusFilter;
    return matchSearch && matchStatus;
  }), [enriched, search, statusFilter]);

  const totals = useMemo(() => ({
    total:       filtered.reduce((s, i) => s + i.invoiceTotal, 0),
    received:    filtered.reduce((s, i) => s + i.received, 0),
    outstanding: filtered.reduce((s, i) => s + i.outstanding, 0),
  }), [filtered]);

  const exportCSV = () => {
    const headers = ['Customer', 'Invoice No', 'Invoice Date', 'Due Date', 'Amount', 'Received', 'Outstanding', 'Status'];
    const rows = filtered.map(i => [
      i.customerName || i.Customer?.name || i.Ledger?.name || '',
      i.invoiceNumber || i.number || '',
      fmtDate(i.date),
      fmtDate(i.dueDate),
      i.invoiceTotal.toFixed(2),
      i.received.toFixed(2),
      i.outstanding.toFixed(2),
      i.status,
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'customer_outstanding.csv';
    a.click();
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-fade-in">

      {/* Header */}
      <div className="flex justify-between items-end border-b border-slate-100 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-sky-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-sky-600/20">
              <Users size={18} />
            </div>
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-[0.2em]">Accounts Receivable</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tighter">Customer Outstanding</h1>
          <p className="text-sm text-slate-400 font-medium mt-1">Dynamically calculated from sales invoices and payment receipts</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchData} className="p-2.5 border border-slate-100 rounded-xl bg-white hover:bg-slate-50 text-slate-400 shadow-sm transition-all"><RefreshCcw size={16} /></button>
          <button onClick={exportCSV}  className="p-2.5 border border-slate-100 rounded-xl bg-white hover:bg-slate-50 text-slate-400 shadow-sm transition-all"><Download size={16} /></button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-5">
        {[
          { label: 'Total Invoiced',   value: fmt(totals.total),       color: 'bg-slate-900 text-white',                         icon: TrendingUp },
          { label: 'Total Received',   value: fmt(totals.received),    color: 'bg-emerald-50 text-emerald-700 border border-emerald-100', icon: CheckCircle2 },
          { label: 'Outstanding',      value: fmt(totals.outstanding), color: 'bg-red-50 text-red-700 border border-red-100',     icon: AlertCircle },
          { label: 'Overdue',          value: fmt(filtered.filter(i => i.status === 'Overdue').reduce((s, i) => s + i.outstanding, 0)),
                                              color: 'bg-rose-50 text-rose-700 border border-rose-100',   icon: Clock },
        ].map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={`${card.color} rounded-2xl px-6 py-5 flex flex-col gap-2`}>
              <div className="flex items-center gap-2">
                <Icon size={14} className="opacity-70" />
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">{card.label}</span>
              </div>
              <span className="text-2xl font-black tracking-tight font-mono">{card.value}</span>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search size={14} className="text-slate-300 shrink-0" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search customer or invoice number..."
            className="flex-1 outline-none text-sm font-semibold text-slate-700 placeholder:text-slate-300" />
          {search && <button onClick={() => setSearch('')}><X size={12} className="text-slate-300 hover:text-slate-600" /></button>}
        </div>
        <div className="flex gap-2">
          {['', 'Unpaid', 'Partially Paid', 'Overdue', 'Paid'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider border transition-all
                ${statusFilter === s ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'}`}>
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[#fcfdfe] text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 border-b border-slate-50">
            <tr>
              <th className="px-6 py-5">Customer</th>
              <th className="px-6 py-5">Invoice No.</th>
              <th className="px-6 py-5">Invoice Date</th>
              <th className="px-6 py-5">Due Date</th>
              <th className="px-6 py-5 text-right">Amount (₹)</th>
              <th className="px-6 py-5 text-right">Received (₹)</th>
              <th className="px-6 py-5 text-right">Outstanding (₹)</th>
              <th className="px-6 py-5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-[13px] font-semibold text-slate-700">
            {loading ? (
              <tr><td colSpan={8} className="py-16 text-center">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-sky-600 rounded-full animate-spin mx-auto" />
                <p className="mt-3 text-sm text-slate-400 font-medium">Calculating outstanding amounts...</p>
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="py-16 text-center">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Users size={20} className="text-slate-400" />
                </div>
                <p className="text-slate-400 font-bold">No customer outstanding data</p>
                <p className="text-slate-300 text-xs font-medium mt-1">Create sales invoices to see outstanding amounts here</p>
              </td></tr>
            ) : (
              filtered.map((inv, i) => {
                const s = STATUS_STYLE[inv.status] || STATUS_STYLE['Unpaid'];
                const customerName = inv.customerName || inv.Customer?.name || inv.Ledger?.name || inv.name || '—';
                const isOverdue = inv.status === 'Overdue';
                return (
                  <tr key={inv.id || i} className={`hover:bg-slate-50/50 transition-all ${isOverdue ? 'bg-rose-50/30' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{customerName}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">
                      {inv.invoiceNumber || inv.number || '—'}
                    </td>
                    <td className="px-6 py-4 text-slate-500">{fmtDate(inv.date)}</td>
                    <td className="px-6 py-4">
                      <span className={`text-slate-500 ${isOverdue ? 'text-rose-600 font-bold' : ''}`}>
                        {fmtDate(inv.dueDate)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-slate-900">{fmt(inv.invoiceTotal)}</td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-emerald-600">{fmt(inv.received)}</td>
                    <td className="px-6 py-4 text-right font-mono font-black text-red-600">{fmt(inv.outstanding)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${s.bg} ${s.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                        {inv.status}
                      </span>
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
                  {filtered.length} records
                </td>
                <td className="px-6 py-4 text-right font-mono font-black text-slate-900">{fmt(totals.total)}</td>
                <td className="px-6 py-4 text-right font-mono font-black text-emerald-600">{fmt(totals.received)}</td>
                <td className="px-6 py-4 text-right font-mono font-black text-red-600">{fmt(totals.outstanding)}</td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};

export default CustomerOutstandingView;
