import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, Filter, Loader2, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { reportsAPI } from '../../services/api';
import useNotificationStore from '../../store/notificationStore';

const AuditLogSettings = ({ companyId }) => {
  const { addNotification } = useNotificationStore();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedLogId, setExpandedLogId] = useState(null);

  // Filter params
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [companyId]);

  const fetchLogs = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const res = await reportsAPI.auditTrail(companyId, from || undefined, to || undefined);
      setLogs(res.data?.logs || []);
    } catch (err) {
      console.error(err);
      addNotification('Failed to retrieve audit log trail', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredLogs = logs.filter(log => {
    const text = (log.action + ' ' + (log.User?.name || '') + ' ' + (log.tableName || '')).toLowerCase();
    return text.includes(searchTerm.toLowerCase());
  });

  const toggleExpand = (id) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  return (
    <div className="w-full box-border">
      <header className="mb-8 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="text-blue-600" size={24} />
          <h1 className="text-xl font-bold text-slate-800">Administrative Audit Trail</h1>
        </div>
        <p className="text-[12px] text-slate-400 mt-1">
          Review legal record history, period locks, user updates, and critical system setting modifications.
        </p>
      </header>

      {/* Filter and search block */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Search by action, user or table..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full h-10 pl-9 pr-3 border border-slate-200 rounded-lg text-[13px] text-slate-800 outline-none focus:border-blue-500 font-sans"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 border border-slate-200 rounded-lg px-2.5 h-10 bg-white">
            <Calendar size={14} className="text-slate-400" />
            <input
              type="date"
              value={from}
              onChange={e => setFrom(e.target.value)}
              className="text-[12px] text-slate-700 outline-none"
            />
            <span className="text-[11px] text-slate-400 px-1 font-bold">to</span>
            <input
              type="date"
              value={to}
              onChange={e => setTo(e.target.value)}
              className="text-[12px] text-slate-700 outline-none"
            />
          </div>

          <button
            onClick={fetchLogs}
            className="h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[12px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Filter size={14} /> Filter Trail
          </button>
        </div>
      </div>

      {/* Audit Log list */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 size={32} className="animate-spin text-blue-600 mb-2" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Refreshing logs...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                  <th className="p-4 w-10"></th>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Action Event</th>
                  <th className="p-4">Record Scope</th>
                  <th className="p-4">Triggered By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[13px]">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-slate-400 text-xs">
                      No matching audit records found.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map(log => {
                    const isExpanded = expandedLogId === log.id;
                    return (
                      <React.Fragment key={log.id}>
                        <tr 
                          onClick={() => toggleExpand(log.id)}
                          className="text-slate-700 hover:bg-slate-50/30 cursor-pointer transition-colors"
                        >
                          <td className="p-4 text-center">
                            {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                          </td>
                          <td className="p-4 font-mono text-[12px] whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 font-bold text-[9px] rounded uppercase tracking-wider">
                              {log.action}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="font-semibold text-slate-800">{log.tableName}</span>
                            <span className="text-[10px] text-slate-400 block font-mono mt-0.5">{log.recordId}</span>
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-slate-700">{log.User?.name || 'System Daemon'}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{log.User?.email || ''}</div>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr>
                            <td colSpan="5" className="p-4 bg-slate-50/60 border-t border-slate-100">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Historical State (Old Data)</span>
                                  <pre className="p-3 bg-slate-900 text-slate-200 text-[11px] font-mono rounded-lg overflow-x-auto max-h-60 select-all leading-normal">
                                    {log.oldData ? JSON.stringify(log.oldData, null, 2) : 'null'}
                                  </pre>
                                </div>
                                <div className="space-y-1.5">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Modified State (New Data)</span>
                                  <pre className="p-3 bg-slate-900 text-slate-200 text-[11px] font-mono rounded-lg overflow-x-auto max-h-60 select-all leading-normal">
                                    {log.newData ? JSON.stringify(log.newData, null, 2) : 'null'}
                                  </pre>
                                </div>
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
        )}
      </div>
    </div>
  );
};

export default AuditLogSettings;
