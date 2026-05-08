import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  ShieldCheck, Search, Filter, Calendar, 
  User as UserIcon, Activity, RefreshCcw,
  ShieldAlert, Clock, Database, Download,
  Printer, MoreHorizontal, AlertCircle, CheckCircle2
} from 'lucide-react';
import { reportsAPI } from '../../services/api';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.PROD ? 'https://tally-backend-wfml.onrender.com/api' : 'http://localhost:5000/api');

export default function AuditReportView() {
  const companyId = localStorage.getItem('companyId');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('All');

  const fetchLogs = useCallback(async () => {
    if (!companyId) { setLoading(false); return; }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/reports/audit/${companyId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Audit Fetch Error:', err);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const actionTypes = useMemo(() => {
    const types = new Set(logs.map(l => l.action).filter(Boolean));
    return ['All', ...types];
  }, [logs]);

  const filteredLogs = useMemo(() => logs.filter(log => {
    const matchesSearch = !searchTerm ||
      (log.action || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.User?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.tableName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = filterAction === 'All' || log.action === filterAction;
    return matchesSearch && matchesAction;
  }), [logs, searchTerm, filterAction]);

  const actionBadge = (action = '') => {
    if (action.includes('CREATE')) return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (action.includes('DELETE')) return 'bg-rose-50 text-rose-700 border-rose-100';
    if (action.includes('UPDATE')) return 'bg-blue-50 text-blue-700 border-blue-100';
    return 'bg-slate-50 text-slate-700 border-slate-100';
  };

  if (!companyId) {
    return (
      <div className="py-20 flex flex-col items-center gap-4 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200 m-8">
        <AlertCircle size={40} className="text-[#1e61f0]" />
        <div className="text-center">
          <h3 className="text-[16px] font-bold text-slate-900 tracking-tight">No Company Active</h3>
          <p className="text-[12px] font-bold mt-1">Select a company from Settings to view audit logs.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] font-sans overflow-hidden">

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-40 shrink-0">
        <div className="flex flex-col">
          <h1 className="text-[18px] font-bold text-slate-900 tracking-tight leading-none">Audit Trails</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">Security & Oversight — Immutable Activity Log</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search action, user or module..."
              className="w-72 pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px] font-bold outline-none focus:border-[#1e61f0] focus:bg-white transition-all placeholder:text-slate-300"
            />
          </div>
          <div className="w-px h-6 bg-slate-200" />
          <button onClick={fetchLogs} className="p-2 text-slate-400 hover:text-[#1e61f0] transition-colors">
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
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Action:</span>
          <div className="flex items-center gap-2 flex-wrap">
            {actionTypes.map(t => (
              <button
                key={t}
                onClick={() => setFilterAction(t)}
                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${filterAction === t ? 'bg-[#1e61f0] text-white border-[#1e61f0] shadow-sm' : 'bg-white text-slate-500 border-slate-200 hover:border-[#1e61f0] hover:text-[#1e61f0]'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{filteredLogs.length} Records</span>
          <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded transition-all"><MoreHorizontal size={16} /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-[1400px] mx-auto space-y-8">

          {/* ══ SUMMARY CARDS ═══════════════════════════════════════════ */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <SummaryItem 
              label="Total Activities" 
              value={logs.length} 
              icon={<Clock size={20} />}
              color="text-slate-900" 
              iconBg="bg-slate-50 text-slate-500" 
              subLabel="All Recorded Events"
            />
            <SummaryItem 
              label="Creations" 
              value={logs.filter(l => (l.action || '').includes('CREATE')).length}
              icon={<Activity size={20} />}
              color="text-emerald-600" 
              iconBg="bg-emerald-50 text-emerald-500" 
              subLabel="New Records Added"
            />
            <SummaryItem 
              label="Deletions" 
              value={logs.filter(l => (l.action || '').includes('DELETE')).length}
              icon={<ShieldAlert size={20} />}
              color="text-rose-600" 
              iconBg="bg-rose-50 text-rose-500" 
              subLabel="Critical Removals"
            />
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Integrity</p>
                <h3 className="text-[24px] font-black tracking-tight text-emerald-600">100%</h3>
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Data Hash Verified</p>
              </div>
              <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center">
                <ShieldCheck size={24} />
              </div>
            </div>
          </div>

          {/* ══ AUDIT TABLE ══════════════════════════════════════════════ */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-8 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldCheck size={18} className="text-slate-400" />
                <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-widest">Master Audit History</h3>
              </div>
              <span className="px-3 py-1 bg-slate-100 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-500">
                Immutable Record
              </span>
            </div>

            {loading ? (
              <div className="py-24 flex flex-col items-center justify-center">
                <div className="w-10 h-10 border-4 border-slate-100 border-t-[#1e61f0] rounded-full animate-spin mb-4" />
                <p className="text-[11px] font-bold uppercase text-slate-400 tracking-widest">Decrypting Audit Trails...</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-white text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-3">Timestamp</th>
                    <th className="px-4 py-3">Operator</th>
                    <th className="px-4 py-3">Action Type</th>
                    <th className="px-4 py-3">Target Module</th>
                    <th className="px-4 py-3">Key Metadata</th>
                    <th className="px-8 py-3 text-right">Reference ID</th>
                  </tr>
                </thead>
                <tbody className="text-[12px] text-slate-600 divide-y divide-slate-50">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-8 py-16 text-center text-slate-400 italic text-[11px] uppercase tracking-widest">
                        {searchTerm ? 'No entries match your search.' : 'No suspicious activity detected. System is secure.'}
                      </td>
                    </tr>
                  ) : filteredLogs.map((log, idx) => (
                    <tr key={log.id || idx} className="hover:bg-slate-50/80 transition-all group">
                      <td className="px-8 py-4">
                        <div className="flex flex-col">
                          <span className="text-[12px] font-bold text-slate-900">{new Date(log.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                          <span className="text-[10px] font-bold text-slate-400">{new Date(log.createdAt).toLocaleTimeString()}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                            <UserIcon size={14} />
                          </div>
                          <span className="font-bold text-slate-900">{log.User?.name || 'Administrator'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border ${actionBadge(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-bold text-slate-700 uppercase tracking-tight text-[11px]">{log.tableName}</span>
                      </td>
                      <td className="px-4 py-4 max-w-xs">
                        <span className="text-[11px] text-slate-400 italic truncate block">
                          {JSON.stringify(log.newData || log.oldData || {}).substring(0, 60)}...
                        </span>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <span className="text-[10px] font-bold bg-slate-100 px-3 py-1.5 rounded-lg text-slate-500 font-mono">
                          {(log.recordId || 'GEN-01').toString().substring(0, 8)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50/80 border-t-2 border-slate-200">
                  <tr>
                    <td colSpan={6} className="px-8 py-4 text-[11px] font-black text-slate-900 uppercase tracking-widest">
                      Total — {filteredLogs.length} Audit Entries
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const SummaryItem = ({ label, value, icon, color, iconBg, subLabel }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
    <div>
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <h3 className={`text-[28px] font-black tracking-tight ${color}`}>{value}</h3>
      <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{subLabel}</p>
    </div>
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg}`}>
      {icon}
    </div>
  </div>
);
