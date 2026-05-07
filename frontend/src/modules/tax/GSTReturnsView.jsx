import React, { useState, useEffect } from 'react';
import { FileText, RefreshCcw, Download, AlertCircle } from 'lucide-react';
import { reportsAPI } from '../../services/api';

const fmt = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

// GST ledger name patterns
const GST_PATTERNS = ['cgst', 'sgst', 'igst', 'gst', 'output tax', 'input tax', 'tax payable'];
const isGstLedger = (name) => GST_PATTERNS.some(p => (name || '').toLowerCase().includes(p));

export default function GSTReturnsView() {
  const companyId = localStorage.getItem('companyId');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const fetchData = async () => {
    setLoading(true); setError('');
    try {
      const res = await reportsAPI.trialBalance(companyId);
      const tb = res.data?.trialBalance || [];
      
      // Separate GST ledgers from non-GST
      const gstLedgers = tb.filter(l => isGstLedger(l.ledgerName));
      const salesLedgers = tb.filter(l => (l.nature === 'Income') && !isGstLedger(l.ledgerName));
      const purchaseLedgers = tb.filter(l => (l.nature === 'Expenses') && !isGstLedger(l.ledgerName));

      const outputCGST = gstLedgers.filter(l => l.ledgerName.toLowerCase().includes('cgst') && l.ledgerName.toLowerCase().includes('output')).reduce((s, l) => s + parseFloat(l.totalCredit || 0), 0);
      const outputSGST = gstLedgers.filter(l => l.ledgerName.toLowerCase().includes('sgst') && l.ledgerName.toLowerCase().includes('output')).reduce((s, l) => s + parseFloat(l.totalCredit || 0), 0);
      const outputIGST = gstLedgers.filter(l => l.ledgerName.toLowerCase().includes('igst') && l.ledgerName.toLowerCase().includes('output')).reduce((s, l) => s + parseFloat(l.totalCredit || 0), 0);
      const inputCGST = gstLedgers.filter(l => l.ledgerName.toLowerCase().includes('cgst') && l.ledgerName.toLowerCase().includes('input')).reduce((s, l) => s + parseFloat(l.totalDebit || 0), 0);
      const inputSGST = gstLedgers.filter(l => l.ledgerName.toLowerCase().includes('sgst') && l.ledgerName.toLowerCase().includes('input')).reduce((s, l) => s + parseFloat(l.totalDebit || 0), 0);
      const inputIGST = gstLedgers.filter(l => l.ledgerName.toLowerCase().includes('igst') && l.ledgerName.toLowerCase().includes('input')).reduce((s, l) => s + parseFloat(l.totalDebit || 0), 0);

      // If no specific output/input tags, split all GST equally
      const totalGSTCredit = gstLedgers.reduce((s, l) => s + parseFloat(l.totalCredit || 0), 0);
      const totalGSTDebit = gstLedgers.reduce((s, l) => s + parseFloat(l.totalDebit || 0), 0);

      const totalSales = salesLedgers.reduce((s, l) => s + parseFloat(l.totalCredit || 0), 0);
      const totalPurchases = purchaseLedgers.reduce((s, l) => s + parseFloat(l.totalDebit || 0), 0);

      setData({
        gstLedgers,
        salesLedgers,
        purchaseLedgers,
        outputTax: { cgst: outputCGST || totalGSTCredit / 2, sgst: outputSGST || totalGSTCredit / 2, igst: outputIGST },
        inputTax: { cgst: inputCGST || totalGSTDebit / 2, sgst: inputSGST || totalGSTDebit / 2, igst: inputIGST },
        totalSales,
        totalPurchases,
        netTaxPayable: (totalGSTCredit) - (totalGSTDebit),
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load GST data');
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const exportCSV = () => {
    if (!data) return;
    const rows = [
      ['GST Returns Summary', period],
      ['', ''],
      ['Section', 'CGST (₹)', 'SGST (₹)', 'IGST (₹)', 'Total (₹)'],
      ['Output Tax (Sales)', data.outputTax.cgst.toFixed(2), data.outputTax.sgst.toFixed(2), data.outputTax.igst.toFixed(2), (data.outputTax.cgst + data.outputTax.sgst + data.outputTax.igst).toFixed(2)],
      ['Input Tax Credit (Purchases)', data.inputTax.cgst.toFixed(2), data.inputTax.sgst.toFixed(2), data.inputTax.igst.toFixed(2), (data.inputTax.cgst + data.inputTax.sgst + data.inputTax.igst).toFixed(2)],
      ['Net Tax Payable', '', '', '', data.netTaxPayable.toFixed(2)],
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `gst-returns-${period}.csv`; a.click();
  };

  const outputTotal = data ? data.outputTax.cgst + data.outputTax.sgst + data.outputTax.igst : 0;
  const inputTotal = data ? data.inputTax.cgst + data.inputTax.sgst + data.inputTax.igst : 0;

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-end border-b border-slate-100 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white">
              <FileText size={18} />
            </div>
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-[0.2em]">GST Compliance</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tighter">GST Returns (GSTR-3B)</h1>
        </div>
        <div className="flex gap-3">
          <input type="month" value={period} onChange={e => setPeriod(e.target.value)}
            className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-emerald-400 transition-all" />
          <button onClick={fetchData} className="p-2.5 border border-slate-100 rounded-xl bg-white hover:bg-slate-50 text-slate-400 shadow-sm">
            <RefreshCcw size={16} />
          </button>
          <button onClick={exportCSV} disabled={!data} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl flex items-center gap-2 disabled:opacity-40">
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex gap-3 text-red-600 font-bold">
          <AlertCircle size={18} /> {error}
        </div>
      ) : (
        <>
          {/* Summary Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-7 rounded-[2rem] bg-blue-50 border border-blue-100 shadow-sm">
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Total Taxable Sales</p>
              <h3 className="text-2xl font-bold text-blue-700 tracking-tighter">{fmt(data.totalSales)}</h3>
            </div>
            <div className="p-7 rounded-[2rem] bg-orange-50 border border-orange-100 shadow-sm">
              <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-1">Total Taxable Purchases</p>
              <h3 className="text-2xl font-bold text-orange-700 tracking-tighter">{fmt(data.totalPurchases)}</h3>
            </div>
            <div className={`p-7 rounded-[2rem] border shadow-sm ${data.netTaxPayable >= 0 ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
              <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${data.netTaxPayable >= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                Net Tax {data.netTaxPayable >= 0 ? 'Payable' : 'Refundable'}
              </p>
              <h3 className={`text-2xl font-bold tracking-tighter ${data.netTaxPayable >= 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                {fmt(Math.abs(data.netTaxPayable))}
              </h3>
            </div>
          </div>

          {/* GST Breakdown Table */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
            <div className="h-14 px-8 bg-slate-50/50 border-b border-slate-100 flex items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">GSTR-3B Summary</span>
            </div>
            <table className="w-full text-left">
              <thead className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 border-b border-slate-50 bg-[#fcfdfe]">
                <tr>
                  <th className="px-8 py-5">Description</th>
                  <th className="px-8 py-5 text-right">CGST (₹)</th>
                  <th className="px-8 py-5 text-right">SGST (₹)</th>
                  <th className="px-8 py-5 text-right">IGST (₹)</th>
                  <th className="px-8 py-5 text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-[13px] font-semibold">
                <tr className="hover:bg-blue-50/20">
                  <td className="px-8 py-5 font-bold text-slate-900">3.1 — Output Tax Liability (Sales)</td>
                  <td className="px-8 py-5 text-right text-blue-600 font-bold">{fmt(data.outputTax.cgst)}</td>
                  <td className="px-8 py-5 text-right text-blue-600 font-bold">{fmt(data.outputTax.sgst)}</td>
                  <td className="px-8 py-5 text-right text-blue-600 font-bold">{fmt(data.outputTax.igst)}</td>
                  <td className="px-8 py-5 text-right font-bold text-slate-900">{fmt(outputTotal)}</td>
                </tr>
                <tr className="hover:bg-emerald-50/20">
                  <td className="px-8 py-5 font-bold text-slate-900">4 — Eligible ITC (Purchases)</td>
                  <td className="px-8 py-5 text-right text-emerald-600 font-bold">{fmt(data.inputTax.cgst)}</td>
                  <td className="px-8 py-5 text-right text-emerald-600 font-bold">{fmt(data.inputTax.sgst)}</td>
                  <td className="px-8 py-5 text-right text-emerald-600 font-bold">{fmt(data.inputTax.igst)}</td>
                  <td className="px-8 py-5 text-right font-bold text-slate-900">{fmt(inputTotal)}</td>
                </tr>
                <tr className="bg-slate-900 text-white">
                  <td className="px-8 py-6 font-bold text-sm uppercase tracking-widest">Net Tax Payable</td>
                  <td className="px-8 py-6 text-right font-bold">{fmt(data.outputTax.cgst - data.inputTax.cgst)}</td>
                  <td className="px-8 py-6 text-right font-bold">{fmt(data.outputTax.sgst - data.inputTax.sgst)}</td>
                  <td className="px-8 py-6 text-right font-bold">{fmt(data.outputTax.igst - data.inputTax.igst)}</td>
                  <td className="px-8 py-6 text-right font-bold text-lg">{fmt(data.netTaxPayable)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* GST Ledgers detail */}
          {data.gstLedgers.length > 0 && (
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
              <div className="h-14 px-8 bg-slate-50/50 border-b border-slate-100 flex items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">GST Ledger Details</span>
              </div>
              <table className="w-full text-left">
                <thead className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 border-b border-slate-50 bg-[#fcfdfe]">
                  <tr>
                    <th className="px-8 py-4">Ledger</th>
                    <th className="px-8 py-4">Group</th>
                    <th className="px-8 py-4 text-right">Debit (₹)</th>
                    <th className="px-8 py-4 text-right">Credit (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-[13px] font-semibold text-slate-700">
                  {data.gstLedgers.map(l => (
                    <tr key={l.ledgerId} className="hover:bg-emerald-50/20">
                      <td className="px-8 py-4 font-bold text-slate-900">{l.ledgerName}</td>
                      <td className="px-8 py-4 text-slate-500">{l.group}</td>
                      <td className="px-8 py-4 text-right text-blue-600 font-bold">{l.totalDebit > 0 ? fmt(l.totalDebit) : '—'}</td>
                      <td className="px-8 py-4 text-right text-red-500 font-bold">{l.totalCredit > 0 ? fmt(l.totalCredit) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {data.gstLedgers.length === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex gap-3 text-amber-700 font-bold text-sm">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              No GST ledgers found. Create ledgers with names like "Output CGST", "Input SGST", "Output IGST" to see GST breakdowns here.
            </div>
          )}
        </>
      )}
    </div>
  );
}
