import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { 
  Building2, Landmark, RefreshCcw, Printer, 
  FileSpreadsheet, ShieldCheck, Scale, TrendingUp,
  LayoutGrid, PieChart, Coins
} from 'lucide-react';
import { reportsAPI } from '../../services/api';

const BalanceSheetView = () => {
  const [data, setData] = useState({ assets: [], liabilities: [], totalAssets: 0, totalLiabilities: 0 });
  const [loading, setLoading] = useState(true);
  const companyId = localStorage.getItem('companyId');

  const fetchBS = useCallback(async () => {
    if (!companyId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await reportsAPI.balanceSheet(companyId);
      if (res.data) setData(res.data);
    } catch (err) {
      console.error("Failed to fetch Balance Sheet:", err);
    }
    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    fetchBS();
  }, [fetchBS]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#f8fafc]">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (!companyId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-20 text-slate-400 bg-[#f8fafc]">
        <AlertCircle size={48} className="text-blue-500 mb-4" />
        <h3 className="text-xl font-bold text-slate-900 uppercase">No Company Active</h3>
        <p className="text-sm font-bold mt-2">Please select a company in Settings to view the Balance Sheet.</p>
        <button onClick={() => window.location.href='/settings/company'} className="mt-6 px-8 py-3 bg-slate-900 text-white rounded font-bold text-[10px] uppercase tracking-widest shadow-xl">
           Go to Settings
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] min-h-[calc(100vh-2rem)]">
       
       {/* INDUSTRIAL BALANCE SHEET HEADER */}
       <header className="bg-white border-b border-slate-200 p-6 flex flex-col xl:flex-row justify-between items-center gap-6 sticky top-0 z-40">
          <div>
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#0f172a] rounded flex items-center justify-center text-white shadow-xl">
                   <Scale size={20} />
                </div>
                <div>
                   <h2 className="text-xl font-bold text-[#0f172a] uppercase tracking-tighter">Balance Sheet</h2>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">As on {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                </div>
             </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2">
                <button className="h-10 px-4 bg-white border border-slate-200 text-[#0f172a] rounded font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm">
                   <Printer size={16} /> Print
                </button>
                <button className="h-10 px-4 bg-white border border-slate-200 text-[#0f172a] rounded font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm">
                   <FileSpreadsheet size={16} /> Excel
                </button>
             </div>
          </div>
       </header>

       {/* BALANCE SHEET DUAL COLUMN MATRIX */}
       <main className="p-6 flex-1 flex flex-col gap-8 bg-[#f8fafc] overflow-y-auto">
          
          <div className="grid grid-cols-12 gap-10 flex-1">
             
             {/* LIABILITIES & CAPITAL SECTION */}
             <div className="col-span-12 lg:col-span-6 flex flex-col">
                <div className="h-14 bg-slate-900 text-white px-8 flex items-center justify-between rounded-t-lg">
                   <div className="flex flex-col">
                      <span className="text-[9px] font-bold uppercase opacity-40">Equity & Obligations</span>
                      <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                         <Coins size={14} /> Liabilities & Capital
                      </h3>
                   </div>
                   <span className="text-sm font-bold tracking-tighter">₹ {data.totalLiabilities.toLocaleString('en-IN')}</span>
                </div>
                <div className="bg-white border-x border-b border-slate-200 rounded-b-lg flex-1 overflow-hidden flex flex-col divide-y divide-slate-100 shadow-sm">
                   <div className="p-4 flex items-center justify-between text-[10px] font-bold uppercase text-slate-400 tracking-widest px-8">
                      <span>Particulars</span>
                      <span>Balance (INR)</span>
                   </div>
                   <div className="flex-1 overflow-y-auto">
                      {data.liabilities.map((item, idx) => (
                         <div key={idx} className="p-5 px-8 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                            <div className="flex items-center gap-4">
                               <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-[#0f172a] group-hover:text-white transition-all">
                                  <LayoutGrid size={12} />
                               </div>
                               <span className="text-[13px] font-bold text-slate-700">{item.ledgerName}</span>
                            </div>
                            <span className="text-sm font-bold text-slate-900 tracking-tight">₹ {item.balance.toLocaleString('en-IN')}</span>
                         </div>
                      ))}
                   </div>
                   {/* GRAND TOTAL ROW */}
                   <div className="p-6 px-8 bg-slate-50 flex items-center justify-between border-t border-slate-200">
                      <span className="text-xs font-bold uppercase text-slate-900 tracking-widest">Grand Total Liabilities</span>
                      <span className="text-lg font-bold text-[#0f172a] tracking-tighter">₹ {data.totalLiabilities.toLocaleString('en-IN')}</span>
                   </div>
                </div>
             </div>

             {/* ASSETS SECTION */}
             <div className="col-span-12 lg:col-span-6 flex flex-col">
                <div className="h-14 bg-[#0f172a] text-white px-8 flex items-center justify-between rounded-t-lg">
                   <div className="flex flex-col">
                      <span className="text-[9px] font-bold uppercase opacity-40">Resources & Holdings</span>
                      <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                         <Landmark size={14} /> Assets & Properties
                      </h3>
                   </div>
                   <span className="text-sm font-bold tracking-tighter">₹ {data.totalAssets.toLocaleString('en-IN')}</span>
                </div>
                <div className="bg-white border-x border-b border-slate-200 rounded-b-lg flex-1 overflow-hidden flex flex-col divide-y divide-slate-100 shadow-sm">
                   <div className="p-4 flex items-center justify-between text-[10px] font-bold uppercase text-slate-400 tracking-widest px-8">
                      <span>Particulars</span>
                      <span>Balance (INR)</span>
                   </div>
                   <div className="flex-1 overflow-y-auto">
                      {data.assets.map((item, idx) => (
                         <div key={idx} className="p-5 px-8 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                            <div className="flex items-center gap-4">
                               <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-[#0f172a] group-hover:text-white transition-all">
                                  <PieChart size={12} />
                               </div>
                               <span className="text-[13px] font-bold text-slate-700">{item.ledgerName}</span>
                            </div>
                            <span className="text-sm font-bold text-slate-900 tracking-tight">₹ {item.balance.toLocaleString('en-IN')}</span>
                         </div>
                      ))}
                   </div>
                   {/* GRAND TOTAL ROW */}
                   <div className="p-6 px-8 bg-slate-50 flex items-center justify-between border-t border-slate-200">
                      <span className="text-xs font-bold uppercase text-slate-900 tracking-widest">Grand Total Assets</span>
                      <span className="text-lg font-bold text-[#0f172a] tracking-tighter">₹ {data.totalAssets.toLocaleString('en-IN')}</span>
                   </div>
                </div>
             </div>

          </div>

          {/* BALANCE VERIFICATION TRAY */}
          <div className="bg-white border border-slate-200 p-8 rounded-lg flex items-center justify-between gap-10">
             <div className="flex items-center gap-6">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${Math.abs(data.totalAssets - data.totalLiabilities) < 0.01 ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500 animate-pulse'}`}>
                   <ShieldCheck size={32} />
                </div>
                <div>
                   <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">Sheet Integrity Status</h4>
                   <p className={`text-xl font-bold uppercase tracking-tighter ${Math.abs(data.totalAssets - data.totalLiabilities) < 0.01 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {Math.abs(data.totalAssets - data.totalLiabilities) < 0.01 ? 'Perfect Equation: Books Balanced' : 'System Discrepancy: Ledger Imbalance'}
                   </p>
                </div>
             </div>
             
             <div className="flex items-center gap-8">
                <div className="text-right">
                   <span className="block text-[10px] font-bold uppercase text-slate-300 mb-1">Variance Differential</span>
                   <span className="font-bold text-sm text-slate-900 tracking-tight">₹ {(data.totalAssets - data.totalLiabilities).toLocaleString('en-IN')}</span>
                </div>
                <div className="h-10 w-px bg-slate-200" />
                <div className="text-right">
                   <div className="inline-flex items-center gap-2 bg-[#0f172a] text-white px-4 py-2 rounded text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-all cursor-pointer">
                      <TrendingUp size={14}/> Audit Reports
                   </div>
                </div>
             </div>
          </div>

       </main>
    </div>
  );
};

export default BalanceSheetView;
