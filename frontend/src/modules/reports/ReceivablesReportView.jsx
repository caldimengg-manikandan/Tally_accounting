import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCcw, Printer, AlertCircle, Download } from 'lucide-react';
import { reportsAPI } from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ReceivablesReportView = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const companyId = sessionStorage.getItem('companyId');
  const companyName = sessionStorage.getItem('companyName') || 'Company';

  const fetchReport = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const res = await reportsAPI.receivablesReport(companyId);
      setCustomers(res.data.customers || []);
      setSummary(res.data.summary || null);
    } catch (err) {
      console.error('Failed to fetch receivables:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReport(); }, [companyId]);

  const fmt = (v) => Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
  const now = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  const reportDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const companyName = sessionStorage.getItem('companyName') || 'CalTally Company';
    
    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('RECEIVABLES UNPAID INVOICES', 14, 22);
    
    // Sub-header
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Company: ${companyName}`, 14, 28);
    doc.text(`Report Date: ${reportDate}`, 14, 33);
    doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 14, 38);
    
    // Draw line
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 42, 196, 42);
    
    // Summary table
    const summaryRows = [[
      `₹${fmt(grandAmount)}`,
      `₹${fmt(grandApplied)}`,
      `₹${fmt(grandUnpaid)}`
    ]];
    
    autoTable(doc, {
      startY: 46,
      head: [['Total Invoice Amount', 'Total Applied Amount', 'Total Unpaid Amount']],
      body: summaryRows,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
      styles: { fontSize: 9, cellPadding: 3, halign: 'right' }
    });
    
    // Detail rows
    let tableRows = [];
    customers.forEach(c => {
      // Customer heading row
      tableRows.push([
        { content: `${c.customerName}${c.customerCode ? ' (' + c.customerCode + ')' : ''}`, colSpan: 3, styles: { fontStyle: 'bold', textColor: [30, 97, 240] } },
        '', '', '', '', ''
      ]);
      
      c.invoices.forEach(inv => {
        const invAmount  = parseFloat(inv.totalAmount || inv.balance || 0);
        const invApplied = parseFloat((inv.totalAmount || 0) - (inv.balance || 0));
        const invUnpaid  = parseFloat(inv.balance || 0);
        
        tableRows.push([
          inv.invoiceNumber,
          inv.description || '—',
          fmtDate(inv.date),
          `₹${fmt(invAmount)}`,
          `₹${fmt(invApplied)}`,
          `₹${fmt(invUnpaid)}`
        ]);
      });
    });
    
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 12,
      head: [['Invoice Number', 'Description', 'Date', 'Amount', 'Applied Amount', 'Unpaid Amount']],
      body: tableRows,
      foot: [['Grand Total', '', '', `₹${fmt(grandAmount)}`, `₹${fmt(grandApplied)}`, `₹${fmt(grandUnpaid)}`]],
      theme: 'striped',
      headStyles: { fillColor: [30, 41, 59] },
      footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
      styles: { fontSize: 8.5, cellPadding: 2.5 }
    });
    
    // Save PDF
    doc.save(`Receivables_Report_${companyName.replace(/\s+/g, '_')}.pdf`);
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

  // Grand totals
  const grandAmount    = customers.reduce((s, c) => s + c.invoices.reduce((ss, inv) => ss + parseFloat(inv.totalAmount || inv.balance || 0), 0), 0);
  const grandApplied   = customers.reduce((s, c) => s + c.invoices.reduce((ss, inv) => ss + parseFloat((inv.totalAmount || 0) - (inv.balance || 0)), 0), 0);
  const grandUnpaid    = customers.reduce((s, c) => s + c.invoices.reduce((ss, inv) => ss + parseFloat(inv.balance || 0), 0), 0);

  return (
    <div className="flex flex-col h-full bg-white font-sans overflow-hidden">

      {/* ── TOOLBAR (screen only) ─────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 px-8 py-3 flex items-center justify-between sticky top-0 z-40 no-print shrink-0">
        <div>
          <h1 className="text-[17px] font-bold text-slate-900 tracking-tight leading-none">Unpaid Invoice Report</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">By Customer · Report Date: {reportDate}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchReport} className="p-2 text-slate-400 hover:text-[#1e61f0] transition-colors">
            <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-[12px] font-bold text-slate-600 hover:bg-slate-50 transition-all">
            <Printer size={16}/> Print
          </button>
          <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-6 py-2 bg-[#1e61f0] text-white rounded-lg text-[12px] font-bold hover:bg-[#1a54d1] transition-all shadow-lg shadow-blue-500/20">
            <Download size={16}/> Export PDF
          </button>
        </div>
      </header>

      {/* ── PRINT AREA ────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[960px] mx-auto px-8 py-6">

          {/* Page header */}
          <div className="flex items-start justify-between mb-1">
            <div className="text-[12px] font-semibold text-slate-700">{companyName}</div>
            <div className="text-center flex-1">
              <div className="text-[13px] font-bold text-slate-900">Unpaid Invoice Report - by Customer Number</div>
              <div className="text-[11px] text-slate-600">Report Date: {reportDate}</div>
            </div>
            <div className="text-right text-[11px] text-slate-600">
              <div>Page: 1</div>
              <div>{now}</div>
            </div>
          </div>

          <div className="border-t border-b border-slate-800 mb-3 mt-2" />

          {/* ── TABLE ─────────────────────────────────────────── */}
          {loading ? (
            <div className="py-16 flex justify-center">
              <div className="w-8 h-8 border-4 border-slate-100 border-t-slate-700 rounded-full animate-spin" />
            </div>
          ) : customers.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-[13px]">No outstanding unpaid invoices.</div>
          ) : (
            <table className="w-full border-collapse text-[12px] text-slate-800">
              {/* Column headers */}
              <thead>
                <tr className="border-b border-slate-400">
                  <th className="text-left py-1 pr-3 font-semibold w-[90px]">Invoice<br/>Number</th>
                  <th className="text-left py-1 pr-3 font-semibold w-[30px]">Seq</th>
                  <th className="text-left py-1 pr-3 font-semibold">Description</th>
                  <th className="text-left py-1 pr-3 font-semibold w-[82px]">Date</th>
                  <th className="text-left py-1 pr-3 font-semibold w-[82px]">Due Date</th>
                  <th className="text-right py-1 pr-3 font-semibold w-[80px]">Amount</th>
                  <th className="text-right py-1 pr-3 font-semibold w-[80px]">Applied<br/>Amount</th>
                  <th className="text-right py-1 pr-3 font-semibold w-[80px]">Unpaid<br/>Amount</th>
                  <th className="text-right py-1 font-semibold w-[80px]">GL Account<br/>Number</th>
                </tr>
              </thead>

              <tbody>
                {customers.map((c) => {
                  // Per-customer totals
                  const custAmount  = c.invoices.reduce((s, inv) => s + parseFloat(inv.totalAmount || inv.balance || 0), 0);
                  const custApplied = c.invoices.reduce((s, inv) => s + parseFloat((inv.totalAmount || 0) - (inv.balance || 0)), 0);
                  const custUnpaid  = c.invoices.reduce((s, inv) => s + parseFloat(inv.balance || 0), 0);

                  return (
                    <React.Fragment key={c.customerId}>
                      {/* Customer heading row */}
                      <tr>
                        <td colSpan={9} className="pt-4 pb-1">
                          <span className="font-bold text-[12px] text-slate-900">
                            {c.customerName}{c.customerCode ? ` (${c.customerCode})` : ''}
                          </span>
                        </td>
                      </tr>

                      {/* Invoice rows grouped by invoice number */}
                      {c.invoices.map((inv, invIdx) => {
                        const invAmount  = parseFloat(inv.totalAmount || inv.balance || 0);
                        const invApplied = parseFloat((inv.totalAmount || 0) - (inv.balance || 0));
                        const invUnpaid  = parseFloat(inv.balance || 0);
                        const items = (inv.items && inv.items.length > 0) ? inv.items : [{ seq: 1, description: inv.description || inv.invoiceNumber, glAccount: '' }];

                        return (
                          <React.Fragment key={inv.id || invIdx}>
                            {items.map((item, itemIdx) => (
                              <tr key={itemIdx} className="hover:bg-slate-50">
                                <td className="py-0.5 pr-3 text-blue-700 font-medium cursor-pointer hover:underline"
                                  onClick={() => navigate(`/sales-invoices/${inv.id}`)}>
                                  {itemIdx === 0 ? inv.invoiceNumber : ''}
                                </td>
                                <td className="py-0.5 pr-3 text-center">{item.seq ?? itemIdx + 1}</td>
                                <td className="py-0.5 pr-3">{item.description || inv.description || '—'}</td>
                                <td className="py-0.5 pr-3">{itemIdx === 0 ? fmtDate(inv.date) : ''}</td>
                                <td className="py-0.5 pr-3">{itemIdx === 0 ? fmtDate(inv.dueDate) : ''}</td>
                                <td className="py-0.5 pr-3 text-right">{itemIdx === 0 ? fmt(invAmount) : ''}</td>
                                <td className="py-0.5 pr-3 text-right">{itemIdx === 0 ? fmt(invApplied) : ''}</td>
                                <td className="py-0.5 pr-3 text-right">{itemIdx === 0 ? fmt(invUnpaid) : ''}</td>
                                <td className="py-0.5 text-right text-slate-500">{item.glAccount || ''}</td>
                              </tr>
                            ))}

                            {/* Invoice subtotal row */}
                            <tr className="border-t border-slate-200">
                              <td colSpan={5} className="py-0.5 pr-3 text-[11px] text-slate-600 font-semibold">
                                Total {inv.invoiceNumber}:
                              </td>
                              <td className="py-0.5 pr-3 text-right font-semibold">{fmt(invAmount)}</td>
                              <td className="py-0.5 pr-3 text-right font-semibold">{fmt(invApplied)}</td>
                              <td className="py-0.5 pr-3 text-right font-semibold">{fmt(invUnpaid)}</td>
                              <td />
                            </tr>
                            <tr><td colSpan={9} className="py-1" /></tr>
                          </React.Fragment>
                        );
                      })}

                      {/* Customer total row */}
                      <tr className="border-t border-slate-400 bg-slate-50">
                        <td colSpan={5} className="py-1 pr-3 font-bold text-[12px]">
                          Total {c.customerName}{c.customerCode ? ` (${c.customerCode})` : ''}:
                        </td>
                        <td className="py-1 pr-3 text-right font-bold">{fmt(custAmount)}</td>
                        <td className="py-1 pr-3 text-right font-bold">{fmt(custApplied)}</td>
                        <td className="py-1 pr-3 text-right font-bold">{fmt(custUnpaid)}</td>
                        <td />
                      </tr>
                      <tr><td colSpan={9} className="py-2 border-b border-dashed border-slate-300" /></tr>
                    </React.Fragment>
                  );
                })}

                {/* Grand Total */}
                <tr className="border-t-2 border-slate-800 bg-slate-100">
                  <td colSpan={5} className="py-2 pr-3 font-extrabold text-[12px] uppercase tracking-wide">Grand Total:</td>
                  <td className="py-2 pr-3 text-right font-extrabold">{fmt(grandAmount)}</td>
                  <td className="py-2 pr-3 text-right font-extrabold">{fmt(grandApplied)}</td>
                  <td className="py-2 pr-3 text-right font-extrabold">{fmt(grandUnpaid)}</td>
                  <td />
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
        }
      `}</style>
    </div>
  );
};

export default ReceivablesReportView;
