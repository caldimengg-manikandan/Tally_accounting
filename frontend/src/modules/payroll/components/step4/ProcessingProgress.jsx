import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import api from '../../../../services/api';

export default function ProcessingProgress({ calculations, month, companyId, onComplete }) {
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState([]);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let timer = setInterval(() => {
      setElapsed(prev => prev + 0.1);
    }, 100);

    const processBatch = async () => {
      try {
        const { data } = await api.post(`/salary-slips/${companyId}/process-month`, {
          salary_month: `${month}-01`,
          employees: calculations.map(c => c.employee_id),
          calculations
        });
        
        clearInterval(timer);
        setProgress(100);
        setLogs(prev => [...prev, { type: 'success', text: `Successfully processed all ${calculations.length} employees.` }]);
        
        setTimeout(() => {
          onComplete(data);
        }, 1000);
      } catch (err) {
        clearInterval(timer);
        setLogs(prev => [...prev, { type: 'error', text: err.response?.data?.error || 'Failed to process batch.' }]);
      }
    };

    // Simulate individual processing logs for UI fidelity
    let i = 0;
    const simInterval = setInterval(() => {
      if (i < calculations.length) {
        const c = calculations[i];
        setLogs(prev => [...prev, { type: 'success', text: `✓ ${c.name}: Calculation complete. Gross: ₹${c.gross_salary} → Net: ₹${c.net_salary}` }]);
        setProgress(Math.round(((i + 1) / calculations.length) * 90)); // up to 90%
        i++;
      } else {
        clearInterval(simInterval);
        processBatch();
      }
    }, 500);

    return () => {
      clearInterval(timer);
      clearInterval(simInterval);
    };
  }, []);

  return (
    <div className="max-w-2xl mx-auto py-12">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-black text-slate-900">Processing Salary for {month}</h3>
        <p className="text-sm text-slate-500 font-medium mt-2">Please do not close this window.</p>
      </div>

      <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold text-slate-700">Processing: {calculations.length} employees</span>
            <span className="text-sm font-black text-blue-600">{progress}%</span>
          </div>
          <div className="h-4 bg-slate-200 rounded-full overflow-hidden relative">
            <div 
              className="absolute top-0 left-0 h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            >
              <div className="w-full h-full bg-white/20 animate-[shimmer_1s_infinite]"></div>
            </div>
          </div>
          <div className="flex justify-between mt-2 text-xs font-bold text-slate-400">
            <span>Elapsed: {elapsed.toFixed(1)}s</span>
            {progress < 100 && <span className="flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Processing...</span>}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 h-64 overflow-y-auto p-4 space-y-3 font-mono text-xs shadow-inner">
          {logs.map((log, index) => (
            <div key={index} className={`flex items-start gap-2 ${log.type === 'error' ? 'text-rose-600' : 'text-slate-600'}`}>
              {log.type === 'error' ? <XCircle size={14} className="shrink-0 mt-0.5" /> : <CheckCircle2 size={14} className="shrink-0 mt-0.5 text-emerald-500" />}
              <span className="font-medium">{log.text}</span>
            </div>
          ))}
          {progress < 100 && (
            <div className="flex items-start gap-2 text-slate-400 animate-pulse">
              <Loader2 size={14} className="shrink-0 mt-0.5 animate-spin" />
              <span>Calculating deductions...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
