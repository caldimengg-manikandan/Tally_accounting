import React, { useState, useEffect } from 'react';
import { FileText, RefreshCcw, Download, AlertCircle, Calendar, ArrowRightLeft, TrendingUp, DollarSign } from 'lucide-react';
import { gstAPI } from '../../services/api';

const fmt = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

export default function GSTReturnsView() {
  const companyId = sessionStorage.getItem('companyId');
  const [activeTab, setActiveTab] = useState('gstr3b'); // 'gstr3b', 'gstr1', 'gstr2a'
  const [gstr3bData, setGstr3bData] = useState(null);
  const [gstr1Data, setGstr1Data] = useState(null);
  const [gstr2aData, setGstr2aData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [res3b, res1, res2a] = await Promise.all([
        gstAPI.getGSTR3B(companyId),
        gstAPI.getGSTR1(companyId),
        gstAPI.getGSTR2A(companyId)
      ]);
      setGstr3bData(res3b.data);
      setGstr1Data(res1.data);
      setGstr2aData(res2a.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to load Indian GST compliance data. Ensure tax/gst routes are operational.');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (companyId) {
      fetchData();
    }
  }, [companyId]);

  const exportCSV = () => {
    let rows = [];
    let filename = `gst-report-${period}.csv`;

    if (activeTab === 'gstr3b' && gstr3bData) {
      filename = `gstr3b-${period}.csv`;
      rows = [
        ['GSTR-3B Monthly Consolidated Summary', period],
        [],
        ['Description', 'CGST (₹)', 'SGST (₹)', 'IGST (₹)', 'Total (₹)'],
        ['3.1 Outward Tax Liability (Sales)', gstr3bData.outputTax?.cgst, gstr3bData.outputTax?.sgst, gstr3bData.outputTax?.igst, gstr3bData.outputTax?.total],
        ['4 Eligible ITC (Purchases)', gstr3bData.inputTaxCredit?.cgst, gstr3bData.inputTaxCredit?.sgst, gstr3bData.inputTaxCredit?.igst, gstr3bData.inputTaxCredit?.total],
        ['Net Tax Payable', '', '', '', gstr3bData.netPayable]
      ];
    } else if (activeTab === 'gstr1' && gstr1Data) {
      filename = `gstr1-${period}.csv`;
      rows = [
        ['GSTR-1 Outward Supplies (B2B Invoices)', period],
        [],
        ['Invoice #', 'Date', 'Customer Name', 'Customer GSTIN', 'Place of Supply', 'Taxable Value (₹)', 'CGST (₹)', 'SGST (₹)', 'IGST (₹)', 'Total Value (₹)'],
        ...(gstr1Data.b2bInvoices || []).map(inv => [
          inv.invoiceNumber,
          new Date(inv.date).toLocaleDateString('en-IN'),
          inv.customerName,
          inv.customerGSTIN,
          inv.state,
          inv.taxableValue,
          inv.cgst,
          inv.sgst,
          inv.igst,
          inv.totalAmount
        ]),
        [],
        ['Totals', '', '', '', '', gstr1Data.totals?.taxableValue, gstr1Data.totals?.cgst, gstr1Data.totals?.sgst, gstr1Data.totals?.igst, gstr1Data.totals?.totalAmount]
      ];
    } else if (activeTab === 'gstr2a' && gstr2aData) {
      filename = `gstr2a-${period}.csv`;
      rows = [
        ['GSTR-2A Auto-Drafted Inward Supplies (Purchase ITC Lookup)', period],
        [],
        ['Bill #', 'Date', 'Vendor Name', 'Vendor GSTIN', 'Place of Supply', 'Taxable Value (₹)', 'CGST (₹)', 'SGST (₹)', 'IGST (₹)', 'Total Value (₹)'],
        ...(gstr2aData.b2bPurchases || []).map(p => [
          p.billNumber,
          new Date(p.date).toLocaleDateString('en-IN'),
          p.vendorName,
          p.vendorGSTIN,
          p.state,
          p.taxableValue,
          p.cgst,
          p.sgst,
          p.igst,
          p.totalAmount
        ]),
        [],
        ['Totals', '', '', '', '', gstr2aData.totals?.taxableValue, gstr2aData.totals?.cgst, gstr2aData.totals?.sgst, gstr2aData.totals?.igst, gstr2aData.totals?.totalAmount]
      ];
    }

    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.map(val => `"${val}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-end border-b border-slate-100 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#1e61f0] rounded-xl flex items-center justify-center text-white shadow-md shadow-[#1e61f0]/20">
              <FileText size={18} />
            </div>
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-[0.2em]">GST Compliance Center</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tighter">GST Returns Filing Panel</h1>
        </div>
        <div className="flex gap-3">
          <input 
            type="month" 
            value={period} 
            onChange={e => setPeriod(e.target.value)}
            className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-[#1e61f0] transition-all bg-white" 
          />
          <button 
            onClick={fetchData} 
            className="p-2.5 border border-slate-100 rounded-xl bg-white hover:bg-slate-50 text-slate-400 shadow-sm transition-all"
            title="Refresh Tax Data"
          >
            <RefreshCcw size={16} />
          </button>
          <button 
            onClick={exportCSV} 
            disabled={loading || error} 
            className="bg-[#1e61f0] hover:bg-[#1a54d1] text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-[#1e61f0]/10 flex items-center gap-2 disabled:opacity-40 transition-all"
          >
            <Download size={16} /> Export GSTR CSV
          </button>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('gstr3b')}
          className={`px-6 py-3 text-sm font-bold tracking-tight border-b-2 transition-all ${activeTab === 'gstr3b' ? 'border-[#1e61f0] text-[#1e61f0]' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
        >
          GSTR-3B (Consolidated Summary)
        </button>
        <button
          onClick={() => setActiveTab('gstr1')}
          className={`px-6 py-3 text-sm font-bold tracking-tight border-b-2 transition-all ${activeTab === 'gstr1' ? 'border-[#1e61f0] text-[#1e61f0]' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
        >
          GSTR-1 (Outward Supplies)
        </button>
        <button
          onClick={() => setActiveTab('gstr2a')}
          className={`px-6 py-3 text-sm font-bold tracking-tight border-b-2 transition-all ${activeTab === 'gstr2a' ? 'border-[#1e61f0] text-[#1e61f0]' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
        >
          GSTR-2A (Inward Supplies - ITC)
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-[#1e61f0] rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex gap-3 text-red-600 font-semibold items-center">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      ) : (
        <>
          {/* TAB 1: GSTR-3B */}
          {activeTab === 'gstr3b' && gstr3bData && (
            <div className="space-y-6">
              {/* Summary Widgets */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-7 rounded-[2rem] bg-blue-50 border border-blue-100 shadow-sm relative overflow-hidden">
                  <div className="absolute right-4 top-4 text-blue-200"><TrendingUp size={48} /></div>
                  <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">Total Output Liability</p>
                  <h3 className="text-3xl font-black text-blue-700 tracking-tighter">{fmt(gstr3bData.outputTax?.total)}</h3>
                  <div className="flex gap-3 mt-3 text-[11px] font-bold text-blue-600/80">
                    <span>CGST: {fmt(gstr3bData.outputTax?.cgst)}</span>
                    <span>SGST: {fmt(gstr3bData.outputTax?.sgst)}</span>
                    <span>IGST: {fmt(gstr3bData.outputTax?.igst)}</span>
                  </div>
                </div>

                <div className="p-7 rounded-[2rem] bg-amber-50 border border-amber-100 shadow-sm relative overflow-hidden">
                  <div className="absolute right-4 top-4 text-amber-200"><ArrowRightLeft size={48} /></div>
                  <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1">Eligible Input Tax Credit (ITC)</p>
                  <h3 className="text-3xl font-black text-amber-700 tracking-tighter">{fmt(gstr3bData.inputTaxCredit?.total)}</h3>
                  <div className="flex gap-3 mt-3 text-[11px] font-bold text-amber-600/80">
                    <span>CGST: {fmt(gstr3bData.inputTaxCredit?.cgst)}</span>
                    <span>SGST: {fmt(gstr3bData.inputTaxCredit?.sgst)}</span>
                    <span>IGST: {fmt(gstr3bData.inputTaxCredit?.igst)}</span>
                  </div>
                </div>

                <div className={`p-7 rounded-[2rem] border shadow-sm relative overflow-hidden ${gstr3bData.netPayable > 0 ? 'bg-red-50 border-red-100' : 'bg-blue-50 border-blue-100'}`}>
                  <div className="absolute right-4 top-4 opacity-15"><DollarSign size={48} /></div>
                  <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${gstr3bData.netPayable > 0 ? 'text-red-500' : 'text-[#1e61f0]'}`}>
                    Net GST Payable
                  </p>
                  <h3 className={`text-3xl font-black tracking-tighter ${gstr3bData.netPayable > 0 ? 'text-red-700' : 'text-[#1a54d1]'}`}>
                    {fmt(gstr3bData.netPayable)}
                  </h3>
                  <p className="text-[11px] font-medium text-slate-500 mt-3">Calculated as (Output Liability - Eligible ITC)</p>
                </div>
              </div>

              {/* Detail Table */}
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
                <div className="h-16 px-8 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Consolidated GSTR-3B Statement</span>
                </div>
                <table className="w-full text-left">
                  <thead className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 border-b border-slate-50 bg-[#fcfdfe]">
                    <tr>
                      <th className="px-8 py-5">Filing Section</th>
                      <th className="px-8 py-5 text-right">CGST (₹)</th>
                      <th className="px-8 py-5 text-right">SGST (₹)</th>
                      <th className="px-8 py-5 text-right">IGST (₹)</th>
                      <th className="px-8 py-5 text-right">Total Tax (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-[13px] font-semibold">
                    <tr className="hover:bg-blue-50/20">
                      <td className="px-8 py-5 font-bold text-slate-900">3.1 — Details of Outward Supplies (Sales)</td>
                      <td className="px-8 py-5 text-right text-blue-600 font-bold">{fmt(gstr3bData.outputTax?.cgst)}</td>
                      <td className="px-8 py-5 text-right text-blue-600 font-bold">{fmt(gstr3bData.outputTax?.sgst)}</td>
                      <td className="px-8 py-5 text-right text-blue-600 font-bold">{fmt(gstr3bData.outputTax?.igst)}</td>
                      <td className="px-8 py-5 text-right font-bold text-slate-900">{fmt(gstr3bData.outputTax?.total)}</td>
                    </tr>
                    <tr className="hover:bg-blue-50/20">
                      <td className="px-8 py-5 font-bold text-slate-900">4 — Eligible Input Tax Credit (Purchases)</td>
                      <td className="px-8 py-5 text-right text-[#1e61f0] font-bold">{fmt(gstr3bData.inputTaxCredit?.cgst)}</td>
                      <td className="px-8 py-5 text-right text-[#1e61f0] font-bold">{fmt(gstr3bData.inputTaxCredit?.sgst)}</td>
                      <td className="px-8 py-5 text-right text-[#1e61f0] font-bold">{fmt(gstr3bData.inputTaxCredit?.igst)}</td>
                      <td className="px-8 py-5 text-right font-bold text-slate-900">{fmt(gstr3bData.inputTaxCredit?.total)}</td>
                    </tr>
                    <tr className="bg-slate-950 text-white font-bold">
                      <td className="px-8 py-6 uppercase tracking-wider text-xs">Net GST Payable (Electronic Cash Ledger)</td>
                      <td className="px-8 py-6 text-right">{fmt(Math.max(0, gstr3bData.outputTax?.cgst - gstr3bData.inputTaxCredit?.cgst))}</td>
                      <td className="px-8 py-6 text-right">{fmt(Math.max(0, gstr3bData.outputTax?.sgst - gstr3bData.inputTaxCredit?.sgst))}</td>
                      <td className="px-8 py-6 text-right">{fmt(Math.max(0, gstr3bData.outputTax?.igst - gstr3bData.inputTaxCredit?.igst))}</td>
                      <td className="px-8 py-6 text-right text-lg text-[#1e61f0]">{fmt(gstr3bData.netPayable)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: GSTR-1 */}
          {activeTab === 'gstr1' && gstr1Data && (
            <div className="space-y-6">
              {/* Totals Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Taxable Value</p>
                  <h4 className="text-xl font-bold text-slate-900 mt-1">{fmt(gstr1Data.totals?.taxableValue)}</h4>
                </div>
                <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total CGST</p>
                  <h4 className="text-xl font-bold text-blue-600 mt-1">{fmt(gstr1Data.totals?.cgst)}</h4>
                </div>
                <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total SGST</p>
                  <h4 className="text-xl font-bold text-blue-600 mt-1">{fmt(gstr1Data.totals?.sgst)}</h4>
                </div>
                <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total IGST</p>
                  <h4 className="text-xl font-bold text-purple-600 mt-1">{fmt(gstr1Data.totals?.igst)}</h4>
                </div>
              </div>

              {/* Rate-wise Summary */}
              {gstr1Data.rateSummary && gstr1Data.rateSummary.length > 0 && (
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
                  <div className="h-16 px-8 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Outward Supplies Rate-wise Summary</span>
                  </div>
                  <table className="w-full text-left">
                    <thead className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 border-b border-slate-50 bg-[#fcfdfe]">
                      <tr>
                        <th className="px-8 py-5">GST Rate</th>
                        <th className="px-8 py-5 text-right">Taxable Value (₹)</th>
                        <th className="px-8 py-5 text-right">CGST (₹)</th>
                        <th className="px-8 py-5 text-right">SGST (₹)</th>
                        <th className="px-8 py-5 text-right">IGST (₹)</th>
                        <th className="px-8 py-5 text-right">Total Tax (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-[13px] font-semibold text-slate-700">
                      {gstr1Data.rateSummary.map((s, idx) => (
                        <tr key={idx} className="hover:bg-blue-50/5">
                          <td className="px-8 py-5 font-bold text-slate-900">{s.rate}%</td>
                          <td className="px-8 py-5 text-right">{fmt(s.taxableValue)}</td>
                          <td className="px-8 py-5 text-right text-slate-500">{s.cgst > 0 ? fmt(s.cgst) : '—'}</td>
                          <td className="px-8 py-5 text-right text-slate-500">{s.sgst > 0 ? fmt(s.sgst) : '—'}</td>
                          <td className="px-8 py-5 text-right text-slate-500">{s.igst > 0 ? fmt(s.igst) : '—'}</td>
                          <td className="px-8 py-5 text-right font-black text-[#1e61f0]">{fmt(s.totalTax)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Invoices List */}
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
                <div className="h-16 px-8 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">GSTR-1 Outward Supplies B2B</span>
                  <span className="bg-blue-50 text-[#1e61f0] text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                    {gstr1Data.b2bInvoices?.length || 0} Invoices Listed
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[900px]">
                    <thead className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 border-b border-slate-50 bg-[#fcfdfe]">
                      <tr>
                        <th className="px-6 py-4">Invoice #</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Customer Name</th>
                        <th className="px-6 py-4">GSTIN</th>
                        <th className="px-6 py-4">Place of Supply</th>
                        <th className="px-6 py-4 text-right">Taxable Value (₹)</th>
                        <th className="px-6 py-4 text-right">CGST (₹)</th>
                        <th className="px-6 py-4 text-right">SGST (₹)</th>
                        <th className="px-6 py-4 text-right">IGST (₹)</th>
                        <th className="px-6 py-4 text-right">Total Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-[13px] font-semibold text-slate-700">
                      {gstr1Data.b2bInvoices?.length > 0 ? (
                        gstr1Data.b2bInvoices.map((inv, idx) => (
                          <tr key={idx} className="hover:bg-blue-50/10">
                            <td className="px-6 py-4 font-bold text-slate-900">{inv.invoiceNumber}</td>
                            <td className="px-6 py-4 text-slate-500">{new Date(inv.date).toLocaleDateString('en-IN')}</td>
                            <td className="px-6 py-4 font-bold text-slate-800">{inv.customerName}</td>
                            <td className="px-6 py-4 text-slate-600 font-mono">{inv.customerGSTIN}</td>
                            <td className="px-6 py-4 text-slate-500">{inv.state}</td>
                            <td className="px-6 py-4 text-right font-bold text-slate-900">{fmt(inv.taxableValue)}</td>
                            <td className="px-6 py-4 text-right text-blue-600">{inv.cgst > 0 ? fmt(inv.cgst) : '—'}</td>
                            <td className="px-6 py-4 text-right text-blue-600">{inv.sgst > 0 ? fmt(inv.sgst) : '—'}</td>
                            <td className="px-6 py-4 text-right text-purple-600">{inv.igst > 0 ? fmt(inv.igst) : '—'}</td>
                            <td className="px-6 py-4 text-right font-black text-slate-900">{fmt(inv.totalAmount)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={10} className="text-center py-10 text-slate-400 font-bold">
                            No Sales invoices found with customer GST numbers.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: GSTR-2A */}
          {activeTab === 'gstr2a' && gstr2aData && (
            <div className="space-y-6">
              {/* Totals Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Input Taxable</p>
                  <h4 className="text-xl font-bold text-slate-900 mt-1">{fmt(gstr2aData.totals?.taxableValue)}</h4>
                </div>
                <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total CGST Credit</p>
                  <h4 className="text-xl font-bold text-[#1e61f0] mt-1">{fmt(gstr2aData.totals?.cgst)}</h4>
                </div>
                <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total SGST Credit</p>
                  <h4 className="text-xl font-bold text-[#1e61f0] mt-1">{fmt(gstr2aData.totals?.sgst)}</h4>
                </div>
                <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total IGST Credit</p>
                  <h4 className="text-xl font-bold text-purple-600 mt-1">{fmt(gstr2aData.totals?.igst)}</h4>
                </div>
              </div>

              {/* Purchases List */}
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
                <div className="h-16 px-8 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">GSTR-2A Inward Supplies B2B (ITC Match)</span>
                  <span className="bg-amber-50 text-amber-700 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                    {gstr2aData.b2bPurchases?.length || 0} Bills Matched
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[900px]">
                    <thead className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 border-b border-slate-50 bg-[#fcfdfe]">
                      <tr>
                        <th className="px-6 py-4">Bill #</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Vendor Name</th>
                        <th className="px-6 py-4">GSTIN</th>
                        <th className="px-6 py-4">Place of Supply</th>
                        <th className="px-6 py-4 text-right">Taxable Value (₹)</th>
                        <th className="px-6 py-4 text-right">CGST (₹)</th>
                        <th className="px-6 py-4 text-right">SGST (₹)</th>
                        <th className="px-6 py-4 text-right">IGST (₹)</th>
                        <th className="px-6 py-4 text-right">Total Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-[13px] font-semibold text-slate-700">
                      {gstr2aData.b2bPurchases?.length > 0 ? (
                        gstr2aData.b2bPurchases.map((p, idx) => (
                          <tr key={idx} className="hover:bg-blue-50/10">
                            <td className="px-6 py-4 font-bold text-slate-900">{p.billNumber}</td>
                            <td className="px-6 py-4 text-slate-500">{new Date(p.date).toLocaleDateString('en-IN')}</td>
                            <td className="px-6 py-4 font-bold text-slate-800">{p.vendorName}</td>
                            <td className="px-6 py-4 text-slate-600 font-mono">{p.vendorGSTIN}</td>
                            <td className="px-6 py-4 text-slate-500">{p.state}</td>
                            <td className="px-6 py-4 text-right font-bold text-slate-900">{fmt(p.taxableValue)}</td>
                            <td className="px-6 py-4 text-right text-[#1e61f0]">{p.cgst > 0 ? fmt(p.cgst) : '—'}</td>
                            <td className="px-6 py-4 text-right text-[#1e61f0]">{p.sgst > 0 ? fmt(p.sgst) : '—'}</td>
                            <td className="px-6 py-4 text-right text-purple-600">{p.igst > 0 ? fmt(p.igst) : '—'}</td>
                            <td className="px-6 py-4 text-right font-black text-slate-900">{fmt(p.totalAmount)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={10} className="text-center py-10 text-slate-400 font-bold">
                            No Purchase bills found with vendor GST numbers.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
