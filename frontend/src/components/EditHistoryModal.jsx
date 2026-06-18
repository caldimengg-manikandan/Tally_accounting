import React, { useState, useEffect } from 'react';
import { reportsAPI } from '../services/api';
const EditHistoryModal = ({ isOpen, onClose, entityType, entityId }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && entityType && entityId) {
      fetchLogs();
    }
  }, [isOpen, entityType, entityId]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const companyId = sessionStorage.getItem('companyId');
      const res = await reportsAPI.auditTrailHistory(companyId, entityType, entityId);
      setLogs(res.data?.data || res.data || []);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1e1e1e] border border-gray-700 w-full max-w-4xl max-h-[85vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-700 bg-gradient-to-r from-[#2a2a2a] to-[#1e1e1e]">
          <h2 className="text-xl font-semibold text-gray-100 flex items-center gap-2">
            <span className="material-symbols-outlined text-purple-400">history</span>
            Edit History: {entityType}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors bg-gray-800 hover:bg-gray-700 p-1 rounded-full">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-[#121212]">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500"></div>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <span className="material-symbols-outlined text-5xl mb-3 opacity-50">history_toggle_off</span>
              <p className="text-lg">No edit history found for this record.</p>
            </div>
          ) : (
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-700 before:to-transparent">
              {logs.map((log) => (
                <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  {/* Icon */}
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-700 bg-[#1e1e1e] text-purple-400 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-lg z-10 transition-transform group-hover:scale-110">
                    <span className="material-symbols-outlined text-sm">
                      {log.action.includes('CREATE') ? 'add_circle' : log.action.includes('UPDATE') ? 'edit' : 'delete'}
                    </span>
                  </div>
                  
                  {/* Card */}
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-[#1e1e1e] border border-gray-700 p-5 rounded-xl shadow-lg transition-colors hover:border-gray-500">
                    <div className="flex justify-between items-start mb-3">
                      <div className="text-sm text-gray-400 font-medium">
                        {new Date(log.createdAt).toLocaleString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit', hour12: true
                        })}
                      </div>
                      <div className="text-xs px-2.5 py-1 bg-[#2a2a2a] text-purple-300 rounded border border-purple-900/30 font-medium tracking-wide">
                        {log.User ? log.User.name : 'System'}
                      </div>
                    </div>
                    <div className="font-semibold text-gray-200 mb-4 text-base capitalize">{log.action.replace(/_/g, ' ').toLowerCase()}</div>

                    {/* Diffs */}
                    {log.action.includes('UPDATE') && log.oldData && log.newData && (
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-3 text-sm">
                        <div className="bg-[#2a1a1a] border border-red-900/30 p-3 rounded-lg shadow-inner">
                          <div className="flex items-center gap-1 text-xs text-red-400 font-bold mb-2 uppercase tracking-wider">
                            <span className="material-symbols-outlined text-[14px]">remove</span> Previous
                          </div>
                          <pre className="text-gray-300 whitespace-pre-wrap overflow-x-auto text-[11px] font-mono leading-relaxed">
                            {JSON.stringify(log.oldData, null, 2)}
                          </pre>
                        </div>
                        <div className="bg-[#1a2a1a] border border-green-900/30 p-3 rounded-lg shadow-inner">
                          <div className="flex items-center gap-1 text-xs text-green-400 font-bold mb-2 uppercase tracking-wider">
                            <span className="material-symbols-outlined text-[14px]">add</span> New
                          </div>
                          <pre className="text-gray-300 whitespace-pre-wrap overflow-x-auto text-[11px] font-mono leading-relaxed">
                            {JSON.stringify(log.newData, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                    
                    {!log.action.includes('UPDATE') && log.newData && (
                      <div className="mt-3 bg-[#2a2a2a] border border-gray-700 p-3 rounded-lg shadow-inner text-sm">
                        <div className="text-xs text-gray-400 font-bold mb-2 uppercase tracking-wider">Data Snapshot</div>
                        <pre className="text-gray-300 whitespace-pre-wrap overflow-x-auto text-[11px] font-mono leading-relaxed">
                          {JSON.stringify(log.newData, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditHistoryModal;
