import React, { useState, useEffect } from 'react';
import { FileText, Loader2, DollarSign, Users, Briefcase, Printer, Download } from 'lucide-react';
import { payrollAPI } from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const fmt = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

export default function PayrollSummaryReport({ companyId }) {
  const [loading, setLoading] = useState(true);
  const [payslips, setPayslips] = useState([]);

  useEffect(() => {
    fetchData();
  }, [companyId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await payrollAPI.getPayslips(companyId);
      setPayslips(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Group by Month-Year
  const aggregated = payslips.reduce((acc, slip) => {
    const period = `${slip.month} ${slip.year}`;
    if (!acc[period]) {
      acc[period] = {
        period,
        employeeCount: 0,
        gross: 0,
        deductions: 0,
        net: 0,
        pf: 0,
        esi: 0,
        pt: 0
      };
    }
    const gross = parseFloat(slip.basic || 0) + parseFloat(slip.hra || 0) + parseFloat(slip.da || 0) + parseFloat(slip.incentives || 0);
    const pf = parseFloat(slip.pf || 0);
    const esi = parseFloat(slip.esi || 0);
    const pt = parseFloat(slip.profTax || 0);
    const ded = pf + esi + pt;
    
    acc[period].employeeCount += 1;
    acc[period].gross += gross;
    acc[period].pf += pf;
    acc[period].esi += esi;
    acc[period].pt += pt;
    acc[period].deductions += ded;
    acc[period].net += parseFloat(slip.netSalary || 0);

    return acc;
  }, {});

  const rows = Object.values(aggregated).sort((a, b) => new Date(b.period) - new Date(a.period)); // Sort descending

  const totalGross = rows.reduce((s, r) => s + r.gross, 0);
  const totalNet = rows.reduce((s, r) => s + r.net, 0);
  const totalDed = rows.reduce((s, r) => s + r.deductions, 0);

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const companyName = sessionStorage.getItem('companyName') || 'CalTally Company';

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('PAYROLL SUMMARY REPORT', 14, 22);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Company: ${companyName}`, 14, 28);
    doc.text(`Total Periods: ${rows.length}`, 14, 33);
    doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 14, 38);

    doc.setDrawColor(226, 232, 240);
    doc.line(14, 42, 196, 42);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Overall Payroll Summary', 14, 50);

    autoTable(doc, {
      startY: 54,
      head: [['Metric', 'Value']],
      body: [
        ['Total Gross Salary', fmt(totalGross)],
        ['Total Deductions (PF + ESI + PT)', fmt(totalDed)],
        ['Total Net Payout', fmt(totalNet)],
      ],
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: { 0: { fontStyle: 'bold' } }
    });

    const tableRows = rows.map(r => [
      r.period,
      String(r.employeeCount),
      fmt(r.gross),
      fmt(r.pf),
      fmt(r.esi),
      fmt(r.pt),
      fmt(r.deductions),
      fmt(r.net)
    ]);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 12,
      head: [['Pay Period', 'Employees', 'Gross Salary', 'PF', 'ESI', 'PT', 'Total Deductions', 'Net Payable']],
      body: tableRows,
      foot: [['Grand Total', '', fmt(totalGross), '', '', '', fmt(totalDed), fmt(totalNet)]],
      theme: 'striped',
      headStyles: { fillColor: [30, 41, 59] },
      footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
      styles: { fontSize: 8.5, cellPadding: 2.5 }
    });

    doc.save(`Payroll_Summary_${companyName.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto animate-fade-in space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Briefcase className="text-blue-600" size={32} />
            Payroll Summary Report
          </h1>
          <p className="text-sm font-bold text-slate-400">Aggregated monthly payroll expenditures and tax liabilities</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
            <Printer size={18} />
            Print
          </button>
          <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 bg-[#1e61f0] text-white rounded-xl font-bold hover:bg-[#1a54d1] transition-colors shadow-lg shadow-blue-500/20">
            <Download size={18} />
            Export PDF
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/20">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
                <DollarSign size={20} />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Gross Salary</p>
              <p className="text-2xl font-black text-slate-900">{fmt(totalGross)}</p>
            </div>
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/20">
              <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mb-4">
                <FileText size={20} />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Deductions (Taxes)</p>
              <p className="text-2xl font-black text-rose-600">-{fmt(totalDed)}</p>
            </div>
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/20">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                <Users size={20} />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Net Payout</p>
              <p className="text-2xl font-black text-blue-600">{fmt(totalNet)}</p>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 border-b border-slate-50 bg-[#fcfdfe]">
                <tr>
                  <th className="px-8 py-5">Pay Period</th>
                  <th className="px-8 py-5 text-center">Processed Emps</th>
                  <th className="px-8 py-5 text-right">Gross Salary</th>
                  <th className="px-8 py-5 text-right">PF Deduction</th>
                  <th className="px-8 py-5 text-right">ESI Deduction</th>
                  <th className="px-8 py-5 text-right">PT Deduction</th>
                  <th className="px-8 py-5 text-right text-rose-600">Total Deductions</th>
                  <th className="px-8 py-5 text-right text-blue-600">Net Payable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-[13px] font-semibold text-slate-700">
                {rows.length === 0 ? (
                  <tr><td colSpan={8} className="py-16 text-center text-slate-300 font-bold">No processed payroll data available.</td></tr>
                ) : rows.map(r => (
                  <tr key={r.period} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5 font-bold text-slate-900">{r.period}</td>
                    <td className="px-8 py-5 text-center text-slate-500">{r.employeeCount}</td>
                    <td className="px-8 py-5 text-right font-bold text-slate-800">{fmt(r.gross)}</td>
                    <td className="px-8 py-5 text-right text-slate-500">{fmt(r.pf)}</td>
                    <td className="px-8 py-5 text-right text-slate-500">{fmt(r.esi)}</td>
                    <td className="px-8 py-5 text-right text-slate-500">{fmt(r.pt)}</td>
                    <td className="px-8 py-5 text-right font-bold text-rose-500">-{fmt(r.deductions)}</td>
                    <td className="px-8 py-5 text-right font-black text-blue-700">{fmt(r.net)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
