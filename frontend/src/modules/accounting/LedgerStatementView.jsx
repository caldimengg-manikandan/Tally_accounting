import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Download, RefreshCcw, BookOpen, AlertCircle, Filter
} from 'lucide-react';
import { reportsAPI } from '../../services/api';

const fmt = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function LedgerStatementView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [error, setError] = useState('');

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

  useEffect(() => { fetchData(); }, [id]);

  const exportCSV = () => {
    if (!data) return;
    const rows = [
      ['Date', 'Voucher No', 'Type', 'Narration', 'Debit (₹)', 'Credit (₹)', 'Balance (₹)'],
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
    <div className="p-8 max-w-[1400px] mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-end border-b border-slate-100 pb-8">
        <div>
          <button onClick={() => navigate('/ledgers')} className="flex items-center gap-2 text-slate-400 hover:text-slate-900 text-xs font-bold uppercase tracking-wider mb-3 transition-all">
            <ArrowLeft size={14} /> Back to Ledgers
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
              <BookOpen size={18} />
            </div>
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-[0.2em]">Account Statement</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tighter">
            {data?.ledger?.name || 'Ledger Statement'}
          </h1>
          {data?.ledger?.group && (
            <p className="text-sm text-slate-400 font-bold mt-1">{data.ledger.group} · {data.ledger.nature}</p>
          )}
        </div>
        <div className="flex gap-3">
          <button onClick={fetchData} className="p-2.5 border border-slate-100 rounded-xl bg-white hover:bg-slate-50 text-slate-400 shadow-sm">
            <RefreshCcw size={16} />
          </button>
          <button onClick={exportCSV} disabled={!data} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl flex items-center gap-2 disabled:opacity-40">
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Date Filter */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-wrap gap-4 items-end">
        <Filter size={16} className="text-slate-400 self-center" />
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">From Date</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
            className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-400 transition-all" />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">To Date</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
            className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-400 transition-all" />
        </div>
        <button onClick={fetchData} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-indigo-700 transition-all">
          Apply Filter
        </button>
      </div>

      {/* Summary Cards */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SummaryCard 
            label="Opening Balance" 
            value={fmt(Math.abs(data.ledger.openingBalance))} 
            suffix={data.ledger.openingBalance < 0 ? 'Cr' : 'Dr'}
            color="slate" 
          />
          <SummaryCard 
            label="Closing Balance" 
            value={fmt(Math.abs(data.ledger.closingBalance))} 
            suffix={data.ledger.closingBalance < 0 ? 'Cr' : 'Dr'}
            color={data.ledger.closingBalance < 0 ? 'rose' : 'indigo'} 
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
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
        <div className="h-14 px-8 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Transaction Ledger</span>
          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
            {data?.entries?.length || 0} entries
          </span>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="py-20 flex flex-col items-center gap-3 text-red-400">
            <AlertCircle size={32} />
            <p className="text-sm font-bold">{error}</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-[#fcfdfe] text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 border-b border-slate-50">
              <tr>
                <th className="px-8 py-4">Date</th>
                <th className="px-8 py-4">Voucher No.</th>
                <th className="px-8 py-4">Type</th>
                <th className="px-8 py-4">Narration</th>
                <th className="px-8 py-4 text-right">Debit (₹)</th>
                <th className="px-8 py-4 text-right">Credit (₹)</th>
                <th className="px-8 py-4 text-right">Balance (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-[13px] font-semibold text-slate-600">
              {/* Opening balance row */}
              <tr className="bg-slate-50/50">
                <td className="px-8 py-3" colSpan={4}>
                  <span className="text-[11px] font-bold uppercase text-slate-400 tracking-widest">Opening Balance</span>
                </td>
                <td className="px-8 py-3 text-right" />
                <td className="px-8 py-3 text-right" />
                <td className="px-8 py-3 text-right font-bold text-slate-700">{fmt(data?.ledger?.openingBalance)}</td>
              </tr>
              {data?.entries?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-300 font-bold text-sm">
                    No transactions found for this period.
                  </td>
                </tr>
              ) : (
                data?.entries?.map((e) => (
                  <tr key={e.id} className="hover:bg-indigo-50/20 transition-all">
                    <td className="px-8 py-4">{fmtDate(e.date)}</td>
                    <td className="px-8 py-4 text-indigo-600 font-bold">{e.voucherNumber}</td>
                    <td className="px-8 py-4">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold uppercase tracking-wide">
                        {e.voucherType}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-slate-500 max-w-xs truncate">{e.narration}</td>
                    <td className="px-8 py-4 text-right font-bold text-blue-600">
                      {e.debit > 0 ? fmt(e.debit) : '—'}
                    </td>
                    <td className="px-8 py-4 text-right font-bold text-red-500">
                      {e.credit > 0 ? fmt(e.credit) : '—'}
                    </td>
                    <td className={`px-8 py-4 text-right font-bold ${e.balance >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
                      {fmt(Math.abs(e.balance))}{e.balance < 0 ? ' Cr' : ' Dr'}
                    </td>
                  </tr>
                ))
              )}
              {/* Closing row */}
              {data && data.entries.length > 0 && (
                <tr className="bg-indigo-50/40 border-t-2 border-indigo-100 font-bold">
                  <td className="px-8 py-6" colSpan={4}>
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.2em] mb-1">Fiscal Reconciliation</span>
                       <span className="text-xs font-bold text-slate-900 uppercase tracking-widest">Aggregate Closing Balance</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right" />
                  <td className="px-8 py-6 text-right" />
                  <td className="px-8 py-6 text-right">
                     <div className="flex flex-col items-end gap-1">
                        <span className="text-2xl font-black text-indigo-600 tracking-tighter leading-none">
                           {fmt(Math.abs(data.ledger.closingBalance))}
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
  );
}

const SummaryCard = ({ label, value, suffix, color }) => {
  const colors = {
    indigo: 'bg-indigo-50/40 border-indigo-100 text-indigo-600',
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
