import { getUser } from '../../stores/authStore';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Search, Filter, FileText, Download, 
  MoreHorizontal, RefreshCcw, Calendar, 
  CheckCircle2, Clock, Printer, ChevronRight,
  AlertCircle, Mail, X, Send, ArrowUpDown
} from 'lucide-react';
import { reportsAPI, mailAPI } from '../../services/api';
import useNotificationStore from '../../store/notificationStore';

const DaybookView = () => {
  const [rowData, setRowData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [showMailModal, setShowMailModal] = useState(false);
  const [email, setEmail] = useState('');
  const [sendingMail, setSendingMail] = useState(false);
  const companyId = sessionStorage.getItem('companyId');
  const { addNotification } = useNotificationStore();

  const fetchDaybook = useCallback(async () => {
    if (!companyId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await reportsAPI.daybook(companyId);
      if (Array.isArray(res.data)) {
        const processed = res.data.map(v => ({
          ...v,
          totalDebit: (v.Transactions || []).reduce((acc, t) => acc + (parseFloat(t.debit) || 0), 0),
          totalCredit: (v.Transactions || []).reduce((acc, t) => acc + (parseFloat(t.credit) || 0), 0),
        }));
        setRowData(processed);
      }
    } catch (err) {
      console.error("Failed to fetch daybook:", err);
    }
    setLoading(false);
  }, [companyId]);

  useEffect(() => { fetchDaybook(); }, [fetchDaybook]);

  const handleSendMail = async (e) => {
    e.preventDefault();
    setSendingMail(true);
    const user = getUser();
    try {
      await mailAPI.send({
        from: user.email,
        to: email,
        subject: `Daybook Report - ${new Date().toLocaleDateString()}`,
        text: `Attached is the Daybook report.`,
        companyId
      });
      addNotification('Report sent successfully!', 'success');
      setShowMailModal(false);
    } catch (err) {
      addNotification('Failed to send report.', 'error');
    }
    setSendingMail(false);
  };

  const fmt = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  // Unique voucher types for filter
  const voucherTypes = useMemo(() => {
    const types = new Set(rowData.map(r => r.voucherType).filter(Boolean));
    return ['All', ...types];
  }, [rowData]);

  const filtered = useMemo(() => {
    return rowData.filter(row => {
      const matchesSearch = !search || 
        (row.narration || '').toLowerCase().includes(search.toLowerCase()) ||
        (row.voucherNumber || '').toString().toLowerCase().includes(search.toLowerCase()) ||
        (row.voucherType || '').toLowerCase().includes(search.toLowerCase());
      const matchesType = filterType === 'All' || row.voucherType === filterType;
      return matchesSearch && matchesType;
    });
  }, [rowData, search, filterType]);

  const totalDebits = useMemo(() => filtered.reduce((acc, v) => acc + v.totalDebit, 0), [filtered]);
  const totalCredits = useMemo(() => filtered.reduce((acc, v) => acc + v.totalCredit, 0), [filtered]);

  const voucherTypeBadge = (type) => {
    const map = {
      'Journal': 'bg-purple-50 text-purple-700 border-purple-100',
      'Sales': 'bg-emerald-50 text-emerald-700 border-emerald-100',
      'Purchase': 'bg-blue-50 text-blue-700 border-blue-100',
      'Payment': 'bg-rose-50 text-rose-700 border-rose-100',
      'Receipt': 'bg-amber-50 text-amber-700 border-amber-100',
    };
    return map[type] || 'bg-slate-50 text-slate-700 border-slate-100';
  };

  if (!companyId) {
    return (
      <div className="py-20 flex flex-col items-center gap-4 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200 m-8">
        <AlertCircle size={40} className="text-[#1e61f0]" />
        <div className="text-center">
          <h3 className="text-[16px] font-bold text-slate-900 tracking-tight">No Company Active</h3>
          <p className="text-[12px] font-bold mt-1">Please select a company from Settings to view the Daybook.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] font-sans overflow-hidden">

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-40 shrink-0">
        <div className="flex flex-col">
          <h1 className="text-[18px] font-bold text-slate-900 tracking-tight leading-none">Daybook</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">Transactional Chronology & Journal Log</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search vouchers..."
              className="w-64 pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px] font-bold outline-none focus:border-[#1e61f0] focus:bg-white transition-all placeholder:text-slate-300"
            />
          </div>
          <div className="w-px h-6 bg-slate-200" />
          <button onClick={fetchDaybook} className="p-2 text-slate-400 hover:text-[#1e61f0] transition-colors">
            <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-[12px] font-bold text-slate-600 hover:bg-slate-50 transition-all">
            <Printer size={16} /> Print
          </button>
          <button className="flex items-center gap-2 px-6 py-2 bg-[#1e61f0] text-white rounded-lg text-[12px] font-bold hover:bg-[#1a54d1] transition-all shadow-lg shadow-blue-500/20">
            <Download size={16} /> Export PDF
          </button>
        </div>
      </header>

      {/* ── TOOLBAR ────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-100 px-8 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Filter By:</span>
          <div className="flex items-center gap-2">
            {voucherTypes.map(t => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${filterType === t ? 'bg-[#1e61f0] text-white border-[#1e61f0] shadow-sm' : 'bg-white text-slate-500 border-slate-200 hover:border-[#1e61f0] hover:text-[#1e61f0]'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{filtered.length} Entries</span>
          <button onClick={() => setShowMailModal(true)} className="p-1.5 text-slate-400 hover:text-[#1e61f0] rounded transition-all"><Mail size={16} /></button>
          <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded transition-all"><MoreHorizontal size={16} /></button>
        </div>
      </div>

      {/* ── SUMMARY CARDS ──────────────────────────────────────────── */}
      <div className="px-8 pt-6 shrink-0">
        <div className="max-w-[1400px] mx-auto grid grid-cols-3 gap-6">
          <SummaryItem label="Total Debit Volume" value={fmt(totalDebits)} color="text-emerald-600" subLabel="Aggregate Debit Activity" />
          <SummaryItem label="Total Credit Volume" value={fmt(totalCredits)} color="text-[#1e61f0]" subLabel="Aggregate Credit Activity" />
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Reconciliation</p>
              <h3 className={`text-[18px] font-black tracking-tight mt-1 ${Math.abs(totalDebits - totalCredits) < 0.01 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {Math.abs(totalDebits - totalCredits) < 0.01 ? 'Books Balanced' : 'Imbalance Detected'}
              </h3>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${Math.abs(totalDebits - totalCredits) < 0.01 ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500 animate-pulse'}`}>
              <CheckCircle2 size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* ── TABLE ──────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar relative">
        <div className="max-w-[1400px] mx-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-8 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-slate-400" />
                <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-widest">Journal Ledger</h3>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <Clock size={14} />
                <span>Last sync: Just now</span>
              </div>
            </div>

            {loading ? (
              <div className="py-24 flex flex-col items-center justify-center">
                <div className="w-10 h-10 border-4 border-slate-100 border-t-[#1e61f0] rounded-full animate-spin mb-4" />
                <p className="text-[11px] font-bold uppercase text-slate-400 tracking-widest">Loading Daybook...</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-white text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 sticky top-0">
                  <tr>
                    <th className="px-8 py-3 w-36">Date</th>
                    <th className="px-4 py-3 w-40">Voucher Type</th>
                    <th className="px-4 py-3 w-32">Ref No.</th>
                    <th className="px-4 py-3">Particulars / Narration</th>
                    <th className="px-8 py-3 text-right w-40">Debit (₹)</th>
                    <th className="px-8 py-3 text-right w-40">Credit (₹)</th>
                  </tr>
                </thead>
                <tbody className="text-[12px] text-slate-600 divide-y divide-slate-50">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-8 py-16 text-center text-slate-400 italic text-[11px] uppercase tracking-widest">
                        {search ? 'No entries match your search.' : 'No daybook entries recorded.'}
                      </td>
                    </tr>
                  ) : filtered.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-all group cursor-pointer">
                      <td className="px-8 py-4 font-bold text-slate-900 whitespace-nowrap text-[11px]">
                        {new Date(row.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border ${voucherTypeBadge(row.voucherType)}`}>
                          {row.voucherType}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-mono font-bold text-slate-400 text-[11px]">
                        #{row.voucherNumber}
                      </td>
                      <td className="px-4 py-4 text-slate-500 italic truncate max-w-xs">
                        {row.narration || '—'}
                      </td>
                      <td className="px-8 py-4 text-right font-black text-emerald-600 whitespace-nowrap">
                        {row.totalDebit > 0 ? fmt(row.totalDebit) : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-8 py-4 text-right font-black text-[#1e61f0] whitespace-nowrap">
                        {row.totalCredit > 0 ? fmt(row.totalCredit) : <span className="text-slate-300">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50/80 border-t-2 border-slate-200 font-bold">
                  <tr>
                    <td colSpan={4} className="px-8 py-4 text-[11px] font-black text-slate-900 uppercase tracking-widest">
                      Grand Total — {filtered.length} Entries
                    </td>
                    <td className="px-8 py-4 text-right text-[15px] font-black text-emerald-600">{fmt(totalDebits)}</td>
                    <td className="px-8 py-4 text-right text-[15px] font-black text-[#1e61f0]">{fmt(totalCredits)}</td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </div>

        {/* ══ MAIL MODAL ══════════════════════════════════════════════ */}
        {showMailModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
              <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#1e61f0] text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <Mail size={20} />
                  </div>
                  <h3 className="text-[16px] font-bold text-slate-900">Email Daybook</h3>
                </div>
                <button onClick={() => setShowMailModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl transition-all">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSendMail} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Recipient Email</label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. auditor@company.com"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] outline-none focus:border-[#1e61f0] focus:ring-4 focus:ring-blue-500/5 transition-all"
                  />
                </div>
                <button
                  disabled={sendingMail}
                  className="w-full py-4 bg-[#1e61f0] text-white rounded-2xl text-[13px] font-bold flex items-center justify-center gap-2 hover:bg-[#1a54d1] transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50"
                >
                  {sendingMail ? <RefreshCcw size={18} className="animate-spin" /> : <Send size={18} />}
                  {sendingMail ? 'Sending...' : 'Dispatch Daybook Now'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const SummaryItem = ({ label, value, color, subLabel }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-1">
    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
    <h3 className={`text-[24px] font-black tracking-tight ${color}`}>{value}</h3>
    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{subLabel}</p>
  </div>
);

export default DaybookView;
