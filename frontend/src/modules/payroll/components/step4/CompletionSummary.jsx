import React from 'react';
import { CheckCircle2, Download, Eye, RotateCcw, Home } from 'lucide-react';

export default function CompletionSummary({ result, onClose }) {
  const { summary, message } = result;

  const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  const now = new Date();

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="bg-emerald-50 rounded-3xl p-8 border border-emerald-100 flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center text-white mb-6 shadow-xl shadow-emerald-500/30">
          <CheckCircle2 size={40} />
        </div>
        <h2 className="text-3xl font-black text-emerald-900 mb-2">Salary Processing Complete!</h2>
        <p className="text-emerald-700 font-bold mb-6">{message}</p>
        
        <div className="flex flex-wrap justify-center gap-4 text-sm font-bold text-emerald-800">
          <div className="px-4 py-2 bg-white rounded-xl shadow-sm">Status: <span className="text-emerald-600">SUCCESS</span></div>
          <div className="px-4 py-2 bg-white rounded-xl shadow-sm">Date: <span className="text-emerald-600">{now.toLocaleDateString()}</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Financial Summary</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-700">Total Gross Salary</span>
              <span className="font-bold text-slate-900">{formatCurrency(summary.total_gross)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-700">Total Deductions</span>
              <span className="font-bold text-rose-600">{formatCurrency(summary.total_deductions)}</span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-slate-200">
              <span className="font-bold text-slate-900">Total Net Salary</span>
              <span className="text-xl font-black text-blue-700">{formatCurrency(summary.total_net)}</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-sm font-bold text-slate-500">Total Employer Cost</span>
              <span className="font-bold text-slate-700">{formatCurrency(summary.total_employer_cost)}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Salary Slip Details</h3>
          <div className="space-y-4 text-sm font-bold text-slate-700">
            <p>Generated <span className="text-blue-600">{summary.slip_numbers.length}</span> slips.</p>
            <p>Status: <span className="inline-block px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs uppercase tracking-wider ml-1">Draft</span></p>
            <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl">
              <p className="text-blue-800 text-xs leading-relaxed">
                <span className="uppercase tracking-widest text-blue-900 mb-1 block">Next Steps:</span>
                Go to the Distribution tab (Step 5) to review, approve, and email these slips to the employees.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
        <button onClick={onClose} className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-white hover:shadow-md transition-all text-slate-600 hover:text-blue-600">
          <Eye size={24} />
          <span className="text-xs font-bold">View & Approve Slips</span>
        </button>
        <button onClick={() => window.print()} className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-white hover:shadow-md transition-all text-slate-600 hover:text-blue-600">
          <Download size={24} />
          <span className="text-xs font-bold">Download Report</span>
        </button>
        <button onClick={() => window.location.reload()} className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-white hover:shadow-md transition-all text-slate-600 hover:text-blue-600">
          <RotateCcw size={24} />
          <span className="text-xs font-bold">Process Another</span>
        </button>
        <button onClick={onClose} className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-white hover:shadow-md transition-all text-slate-600 hover:text-slate-900">
          <Home size={24} />
          <span className="text-xs font-bold">Back to Dashboard</span>
        </button>
      </div>
    </div>
  );
}
