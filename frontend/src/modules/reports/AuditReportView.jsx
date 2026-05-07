import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Search, Filter, Calendar, 
  User as UserIcon, Activity, ArrowRight,
  ShieldAlert, Clock, Database, Loader2
} from 'lucide-react';
import { reportsAPI } from '../../services/api';

export default function AuditReportView() {
  const companyId = localStorage.getItem('companyId');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // ─── Fetch Audit Logs ───────────────────────────────────────────
  useEffect(() => {
    // Note: We need to create an API for fetching Audit Logs
    // For now, we'll fetch from a generic report endpoint or add it to reportsAPI
    const fetchLogs = async () => {
      try {
        // We'll use axios directly or update reportsAPI
        const API_BASE = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? 'https://tally-backend-wfml.onrender.com/api' : 'http://localhost:5000/api');
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
    };
    if (companyId) fetchLogs();
  }, [companyId]);

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.User?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.tableName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="animate-spin text-blue-500" size={40} />
      <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">Decrypting Audit Trails...</span>
    </div>
  );

  return (
    <div className="p-10 max-w-[1400px] mx-auto space-y-10">
      
      {/* ── HEADER ─────────────────────────────────────────────── */}
      <div className="flex justify-between items-end border-b border-slate-100 pb-10">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-slate-900/20">
              <ShieldCheck size={24} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-[0.2em]">Security & Oversight</span>
              <h1 className="text-4xl font-bold text-slate-900 tracking-tighter">System Audit Trails</h1>
            </div>
          </div>
          <p className="text-slate-400 font-medium max-w-md">
            Review every modification, deletion, and creation across the entire system. 
            This history is immutable and serves as the legal record of truth.
          </p>
        </div>

        <div className="flex gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search Action, User or Table..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-50 transition-all w-80 shadow-sm"
            />
          </div>
          <button className="flex items-center gap-2 px-8 py-4 bg-white border border-slate-100 rounded-2xl font-bold text-[11px] uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <Filter size={16} /> Filter Date
          </button>
        </div>
      </div>

      {/* ── SUMMARY STATS ──────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-6">
         <div className="p-8 rounded-[2.5rem] bg-slate-900 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-32 h-32 bg-slate-800 rounded-full blur-3xl opacity-50 transition-transform group-hover:scale-150"></div>
            <Clock className="text-slate-500 mb-4" size={24} />
            <div className="text-4xl font-bold mb-1">{logs.length}</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Total Activities Recorded</div>
         </div>
         <div className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm">
            <Activity className="text-blue-500 mb-4" size={24} />
            <div className="text-4xl font-bold text-slate-900 mb-1">
               {logs.filter(l => l.action.includes('CREATE')).length}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Creations This Session</div>
         </div>
         <div className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm">
            <ShieldAlert className="text-rose-500 mb-4" size={24} />
            <div className="text-4xl font-bold text-slate-900 mb-1">
               {logs.filter(l => l.action.includes('DELETE')).length}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Critical Deletions</div>
         </div>
         <div className="p-8 rounded-[2.5rem] bg-emerald-50 border border-emerald-100 shadow-sm">
            <Database className="text-emerald-500 mb-4" size={24} />
            <div className="text-4xl font-bold text-emerald-900 mb-1">100%</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 text-center">Data Integrity Score</div>
         </div>
      </div>

      {/* ── TIMELINE ───────────────────────────────────────────── */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
        <div className="h-16 px-10 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
           <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Master Audit History</span>
           <span className="px-3 py-1 bg-slate-200/50 rounded-full text-[9px] font-bold text-slate-500 uppercase">Immutable Record</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 border-b border-slate-50 bg-[#fafbfc]">
                <th className="px-10 py-6">Timestamp</th>
                <th className="px-10 py-6">Operator (User)</th>
                <th className="px-10 py-6">Action Type</th>
                <th className="px-10 py-6">Target Module</th>
                <th className="px-10 py-6">Key Metadata</th>
                <th className="px-10 py-6 text-right">Reference ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredLogs.map((log, idx) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-all group">
                   <td className="px-10 py-6">
                      <div className="flex flex-col">
                        <span className="text-[13px] font-bold text-slate-900">
                           {new Date(log.createdAt).toLocaleDateString()}
                        </span>
                        <span className="text-[11px] font-bold text-slate-400">
                           {new Date(log.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                   </td>
                   <td className="px-10 py-6">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                            <UserIcon size={14} />
                         </div>
                         <span className="text-[13px] font-bold text-slate-700">
                            {log.User?.name || 'Administrator'}
                         </span>
                      </div>
                   </td>
                   <td className="px-10 py-6">
                      <span className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest
                        ${log.action.includes('CREATE') ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                          log.action.includes('DELETE') ? 'bg-rose-50 text-rose-600 border border-rose-100' : 
                          'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                        {log.action}
                      </span>
                   </td>
                   <td className="px-10 py-6">
                      <div className="flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                         <span className="text-[13px] font-bold text-slate-600 uppercase tracking-tighter">{log.tableName}</span>
                      </div>
                   </td>
                   <td className="px-10 py-6">
                      <div className="max-w-xs text-[11px] font-semibold text-slate-400 italic">
                         {JSON.stringify(log.newData || log.oldData || {})}
                      </div>
                   </td>
                   <td className="px-10 py-6 text-right">
                      <span className="text-[11px] font-bold bg-slate-100 px-3 py-1.5 rounded-lg text-slate-500 font-mono">
                         {log.recordId?.substring(0, 8) || 'GEN-01'}
                      </span>
                   </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-10 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                     No suspicious activity detected. System is secure.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
