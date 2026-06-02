import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  RefreshCcw, Printer, Mail, Download, AlertCircle, ChevronDown, ChevronRight, Users, Clock
} from 'lucide-react';
import { reportsAPI } from '../../services/api';

const PayablesReportView = () => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedVendor, setExpandedVendor] = useState(null);
  const companyId = localStorage.getItem('companyId');

  const fetchReport = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const res = await reportsAPI.payablesReport(companyId);
      setVendors(res.data.vendors || []);
      setSummary(res.data.summary || null);
    } catch (err) {
      console.error('Failed to fetch payables:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [companyId]);

  const toggleVendor = (id) => {
    setExpandedVendor(expandedVendor === id ? null : id);
  };

  const fmt = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  // Generate vendor aging buckets totals dynamically
  const agingSummary = React.useMemo(() => {
    const buckets = { 'Current': 0, '1-30 Days': 0, '31-60 Days': 0, '61-90 Days': 0, '90+ Days': 0 };
    vendors.forEach(v => {
      if (v.aging) {
        Object.entries(v.aging).forEach(([k, val]) => {
          buckets[k] = (buckets[k] || 0) + val;
        });
      }
    });
    return buckets;
  }, [vendors]);

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
            <h1 className="text-[18px] font-bold text-slate-900 tracking-tight leading-none">Payables Aging Report</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">Outstanding Vendor Bill Tracker</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
           <button onClick={fetchReport} className="p-2 text-slate-400 hover:text-[#1e61f0] transition-colors">
             <RefreshCcw size={18} className={loading ? 'animate-spin' : ''}/>
           </button>
           <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-[12px] font-bold text-slate-600 hover:bg-slate-50 transition-all">
             <Printer size={16}/> Print
           </button>
           <button className="flex items-center gap-2 px-6 py-2 bg-[#1e61f0] text-white rounded-lg text-[12px] font-bold hover:bg-[#1a54d1] transition-all shadow-lg shadow-blue-500/20">
             <Download size={16}/> Export PDF
           </button>
        </div>
      </header>

      {/* ── TOOLBAR ────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-100 px-8 py-3 flex items-center justify-between no-print shrink-0">
         <div className="flex items-center gap-2 text-slate-500 text-[11px] font-bold">
            <Users size={14} className="text-slate-400" />
            <span>Outstanding for {vendors.length} Vendors</span>
         </div>
         <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Grand Total Unpaid Bills: </span>
            <span className="text-[12px] font-black text-rose-600">{fmt(summary?.grandTotal)}</span>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-[1400px] mx-auto space-y-8">
          
          {/* ══ AGING SUMMARY CARDS ════════════════════════════════════ */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Current',     value: agingSummary['Current'],   color: 'text-emerald-600', bg: 'bg-emerald-50/50' },
              { label: '1 - 30 Days', value: agingSummary['1-30 Days'], color: 'text-amber-600',   bg: 'bg-amber-50/50'   },
              { label: '31 - 60 Days',value: agingSummary['31-60 Days'],color: 'text-orange-600',  bg: 'bg-orange-50/50'  },
              { label: '61 - 90 Days',value: agingSummary['61-90 Days'],color: 'text-rose-600',    bg: 'bg-rose-50/50'    },
              { label: '90+ Days',    value: agingSummary['90+ Days'],  color: 'text-red-700',     bg: 'bg-red-50/50'     },
            ].map((bucket) => (
              <div key={bucket.label} className={`p-4 rounded-xl border border-slate-100 shadow-sm ${bucket.bg}`}>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{bucket.label}</p>
                <h3 className={`text-[16px] font-extrabold mt-1.5 ${bucket.color}`}>{fmt(bucket.value)}</h3>
              </div>
            ))}
          </div>

          {/* ══ VENDOR DETAILS LIST ════════════════════════════════════ */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
             <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-4 w-10"></th>
                    <th className="px-6 py-4">Vendor Name</th>
                    <th className="px-4 py-4 text-right">Current (₹)</th>
                    <th className="px-4 py-4 text-right">Overdue (₹)</th>
                    <th className="px-8 py-4 text-right">Total Payable (₹)</th>
                  </tr>
                </thead>
                <tbody className="text-[12px] text-slate-600">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12">
                        <div className="w-8 h-8 border-4 border-slate-100 border-t-[#1e61f0] rounded-full animate-spin mx-auto" />
                      </td>
                    </tr>
                  ) : vendors.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-slate-400">No outstanding payables</td>
                    </tr>
                  ) : (
                    vendors.map((v) => {
                      const isExpanded = expandedVendor === v.vendorId;
                      const overdueTotal = (v.aging['1-30 Days'] || 0) + (v.aging['31-60 Days'] || 0) + (v.aging['61-90 Days'] || 0) + (v.aging['90+ Days'] || 0);
                      return (
                        <React.Fragment key={v.vendorId}>
                          <tr 
                            onClick={() => toggleVendor(v.vendorId)}
                            className={`hover:bg-slate-50/80 transition-all cursor-pointer border-b border-slate-50 last:border-0 ${isExpanded ? 'bg-slate-50/40' : ''}`}
                          >
                            <td className="px-8 py-4.5 text-center">
                              {isExpanded ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
                            </td>
                            <td className="px-6 py-4.5 font-bold text-slate-900">
                              <div className="flex flex-col">
                                <span>{v.vendorName}</span>
                                <span className="text-[10px] text-slate-400 font-normal">{v.bills.length} unpaid bill(s)</span>
                              </div>
                            </td>
                            <td className="px-4 py-4.5 text-right font-medium text-slate-600">{fmt(v.aging['Current'])}</td>
                            <td className="px-4 py-4.5 text-right font-bold text-rose-600">{fmt(overdueTotal)}</td>
                            <td className="px-8 py-4.5 text-right font-black text-slate-900">{fmt(v.total)}</td>
                          </tr>

                          {/* Collapse details */}
                          {isExpanded && (
                            <tr className="bg-slate-50/20 border-b border-slate-50">
                              <td colSpan={5} className="px-12 py-4">
                                <div className="border border-slate-100 rounded-xl overflow-hidden bg-white shadow-inner max-w-4xl">
                                  <table className="w-full text-left text-[11.5px]">
                                    <thead className="bg-slate-50 text-[9px] font-bold uppercase text-slate-400 border-b border-slate-100">
                                      <tr>
                                        <th className="px-6 py-2.5">Bill #</th>
                                        <th className="px-4 py-2.5">Date</th>
                                        <th className="px-4 py-2.5">Due Date</th>
                                        <th className="px-4 py-2.5 text-right">Age (Days)</th>
                                        <th className="px-4 py-2.5">Notes</th>
                                        <th className="px-6 py-2.5 text-right">Amount Due (₹)</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 text-slate-600">
                                      {v.bills.map((bill) => (
                                        <tr key={bill.id} className="hover:bg-slate-50/50">
                                          <td className="px-6 py-2.5 font-bold text-[#1e61f0] hover:underline" onClick={() => navigate(`/bills`)}>
                                            {bill.billNumber}
                                          </td>
                                          <td className="px-4 py-2.5">{bill.date ? new Date(bill.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                                          <td className="px-4 py-2.5">{bill.dueDate ? new Date(bill.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                                          <td className="px-4 py-2.5 text-right font-bold text-slate-500">{bill.daysOverdue > 0 ? `${bill.daysOverdue} days` : 'Current'}</td>
                                          <td className="px-4 py-2.5 truncate max-w-[200px]" title={bill.narration}>{bill.narration || '—'}</td>
                                          <td className="px-6 py-2.5 text-right font-bold text-slate-900">{fmt(bill.balance)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
             </table>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PayablesReportView;
