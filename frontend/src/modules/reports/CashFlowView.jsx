import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  RefreshCcw, Printer, Mail, Download, AlertCircle, TrendingUp, TrendingDown, Landmark, ChevronRight
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { reportsAPI } from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const CashFlowView = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const companyId = sessionStorage.getItem('companyId');

  const fetchReport = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const res = await reportsAPI.cashFlow(companyId, from, to);
      setData(res.data.cashFlow || []);
      setSummary(res.data.summary || null);
    } catch (err) {
      console.error('Failed to fetch cash flow:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [companyId]);

  const handleApplyFilter = (e) => {
    e.preventDefault();
    fetchReport();
  };

  const fmt = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const handleDownloadPDF = () => {
    if (!data) return;
    const doc = new jsPDF();
    const companyName = sessionStorage.getItem('companyName') || 'CalTally Company';
    
    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('CASH FLOW STATEMENT', 14, 22);
    
    // Sub-header
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Company: ${companyName}`, 14, 28);
    doc.text(`Filter range: ${from || 'Start'} to ${to || 'End'}`, 14, 33);
    doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 14, 38);
    
    // Draw line
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 42, 196, 42);
    
    // Summary Metrics Box
    if (summary) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('Reconciliation Summary', 14, 50);
      
      const summaryData = [
        ['Total Cash Inflow', fmt(summary.totalInflow)],
        ['Total Cash Outflow', fmt(summary.totalOutflow)],
        ['Net Cash Flow Change', fmt(summary.netCashFlow)]
      ];
      
      autoTable(doc, {
        startY: 54,
        head: [['Metric', 'Value']],
        body: summaryData,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: { 0: { fontStyle: 'bold' } }
      });
    }
    
    // Table rows
    const flowRows = data.map(row => [
      row.label,
      row.inflow > 0 ? fmt(row.inflow) : '—',
      row.outflow > 0 ? fmt(row.outflow) : '—',
      fmt(row.net)
    ]);
    
    autoTable(doc, {
      startY: doc.lastAutoTable ? doc.lastAutoTable.finalY + 12 : 54,
      head: [['Period / Month', 'Inflow', 'Outflow', 'Net Flow']],
      body: flowRows,
      theme: 'striped',
      headStyles: { fillColor: [30, 41, 59] },
      styles: { fontSize: 9, cellPadding: 3 }
    });
    
    // Save PDF
    doc.save(`Cash_Flow_${companyName.replace(/\s+/g, '_')}.pdf`);
  };
  const fmtK = (v) => {
    const n = Number(v || 0);
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
    if (n >= 100000)   return `₹${(n / 100000).toFixed(2)}L`;
    if (n >= 1000)     return `₹${(n / 1000).toFixed(1)}K`;
    return `₹${n}`;
  };

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
            <h1 className="text-[18px] font-bold text-slate-900 tracking-tight leading-none">Cash Flow Statement</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">Inflow & Outflow Analyzer</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
           <button onClick={fetchReport} className="p-2 text-slate-400 hover:text-[#1e61f0] transition-colors">
             <RefreshCcw size={18} className={loading ? 'animate-spin' : ''}/>
           </button>
           <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-[12px] font-bold text-slate-600 hover:bg-slate-50 transition-all">
             <Printer size={16}/> Print
           </button>
           <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-6 py-2 bg-[#1e61f0] text-white rounded-lg text-[12px] font-bold hover:bg-[#1a54d1] transition-all shadow-lg shadow-blue-500/20">
             <Download size={16}/> Export PDF
           </button>
        </div>
      </header>

      {/* ── TOOLBAR / FILTERS ───────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-100 px-8 py-3 flex items-center justify-between no-print shrink-0">
         <form onSubmit={handleApplyFilter} className="flex items-center gap-4">
            <div className="flex items-center gap-2">
               <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">From:</span>
               <input 
                 type="date" 
                 value={from} 
                 onChange={(e) => setFrom(e.target.value)} 
                 className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 outline-none"
               />
            </div>
            <div className="flex items-center gap-2">
               <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">To:</span>
               <input 
                 type="date" 
                 value={to} 
                 onChange={(e) => setTo(e.target.value)} 
                 className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 outline-none"
               />
            </div>
            <button type="submit" className="px-4 py-1.5 bg-[#1e61f0] text-white rounded-lg text-[11px] font-bold uppercase tracking-wider hover:bg-[#164ec4] transition-all">
              Apply
            </button>
         </form>
         <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Currency: INR</span>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-[1400px] mx-auto space-y-8">
          
          {/* ══ SUMMARY SECTION ════════════════════════════════════════ */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Total Cash Inflow</p>
                    <h3 className="text-[24px] font-bold text-emerald-600 mt-1">{fmt(summary.totalInflow)}</h3>
                  </div>
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center shrink-0">
                    <TrendingUp size={24} />
                  </div>
               </div>
               <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Total Cash Outflow</p>
                    <h3 className="text-[24px] font-bold text-rose-600 mt-1">{fmt(summary.totalOutflow)}</h3>
                  </div>
                  <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center shrink-0">
                    <TrendingDown size={24} />
                  </div>
               </div>
               <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Net Cash Flow</p>
                    <h3 className={`text-[24px] font-bold mt-1 ${summary.netCashFlow >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {fmt(summary.netCashFlow)}
                    </h3>
                  </div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${summary.netCashFlow >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                    <Landmark size={24} />
                  </div>
               </div>
            </div>
          )}

          {/* ══ CHART ══════════════════════════════════════════════════ */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
             <h3 className="text-[14px] font-bold text-slate-800 mb-6">Cash Flow Trends</h3>
             {loading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-slate-100 border-t-[#1e61f0] rounded-full animate-spin" />
                </div>
             ) : data.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-slate-400 text-[13px]">No data available for the period</div>
             ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={fmtK} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v) => fmt(v)} contentStyle={{ fontSize: 12, borderRadius: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                    <Line type="monotone" dataKey="inflow" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} name="Inflow" />
                    <Line type="monotone" dataKey="outflow" stroke="#ef4444" strokeWidth={3} dot={{ fill: '#ef4444', r: 4 }} name="Outflow" />
                  </LineChart>
                </ResponsiveContainer>
             )}
          </div>

          {/* ══ DETAIL TABLE ═══════════════════════════════════════════ */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
             <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-4">Period / Month</th>
                    <th className="px-6 py-4 text-right">Inflow (₹)</th>
                    <th className="px-6 py-4 text-right">Outflow (₹)</th>
                    <th className="px-8 py-4 text-right">Net Flow (₹)</th>
                  </tr>
                </thead>
                <tbody className="text-[12px] text-slate-600">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8">
                        <div className="w-6 h-6 border-2 border-slate-100 border-t-[#1e61f0] rounded-full animate-spin mx-auto" />
                      </td>
                    </tr>
                  ) : data.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-slate-400">No cash flow transactions found</td>
                    </tr>
                  ) : (
                    data.map((row) => (
                      <tr key={row.key} className="hover:bg-slate-50/80 transition-all border-b border-slate-50 last:border-0">
                        <td className="px-8 py-4 font-bold text-slate-900">{row.label}</td>
                        <td className="px-6 py-4 text-right text-emerald-600 font-semibold">{row.inflow > 0 ? fmt(row.inflow) : '—'}</td>
                        <td className="px-6 py-4 text-right text-rose-600 font-semibold">{row.outflow > 0 ? fmt(row.outflow) : '—'}</td>
                        <td className={`px-8 py-4 text-right font-black ${row.net >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {fmt(row.net)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
             </table>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CashFlowView;
