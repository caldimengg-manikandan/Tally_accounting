  import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { 
  Search, Filter, Plus, FileText, Download, 
  MoreVertical, RefreshCcw, Calendar, 
  CheckCircle2, Clock, Printer, FileSpreadsheet
} from 'lucide-react';
import { reportsAPI } from '../../services/api';

const DaybookView = () => {
  const [rowData, setRowData] = useState([]);
  const [loading, setLoading] = useState(true);
  const companyId = localStorage.getItem('companyId');

  const fetchDaybook = useCallback(async () => {
    if (!companyId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await reportsAPI.daybook(companyId);
      // Processing transactions to get totals per voucher
      if (Array.isArray(res.data)) {
        const processed = res.data.map(v => ({
          ...v,
          totalDebit: (v.Transactions || []).reduce((acc, t) => acc + (parseFloat(t.debit) || 0), 0),
          totalCredit: (v.Transactions || []).reduce((acc, t) => acc + (parseFloat(t.credit) || 0), 0)
        }));
        setRowData(processed);
      }
    } catch (err) {
      console.error("Failed to fetch daybook:", err);
    }
    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    fetchDaybook();
  }, [fetchDaybook]);

  const columnDefs = useMemo(() => [
    { 
        headerName: 'DATE', 
        field: 'date', 
        width: 140,
        valueFormatter: p => new Date(p.value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        cellClass: 'font-bold text-slate-700'
    },
    { 
        headerName: 'VOUCHER TYPE', 
        field: 'voucherType', 
        width: 160,
        cellRenderer: p => (
            <span className="px-2 py-0.5 rounded bg-slate-100 text-[#0f172a] text-[10px] font-bold uppercase tracking-widest border border-slate-200">
                {p.value}
            </span>
        )
    },
    { 
        headerName: 'REF NO.', 
        field: 'voucherNumber', 
        width: 120,
        cellRenderer: p => <span className="font-mono font-bold text-slate-400">#{p.value}</span>
    },
    { 
        headerName: 'PARTICULARS / NARRATION', 
        field: 'narration', 
        flex: 1,
        cellClass: 'text-slate-500 italic font-medium truncate'
    },
    { 
        headerName: 'DEBIT (₹)', 
        field: 'totalDebit', 
        width: 180,
        type: 'numericColumn',
        cellClass: 'font-bold text-emerald-600',
        valueFormatter: p => p.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })
    },
    { 
        headerName: 'CREDIT (₹)', 
        field: 'totalCredit', 
        width: 180,
        type: 'numericColumn',
        cellClass: 'font-bold text-blue-600',
        valueFormatter: p => p.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })
    },
    {
        headerName: 'ACTIONS',
        width: 80,
        pinned: 'right',
        cellRenderer: () => (
            <button className="w-full flex items-center justify-center text-slate-400 hover:text-[#0f172a] transition-all">
                <MoreVertical size={18} />
            </button>
        )
    }
  ], []);

  const totalDebits = useMemo(() => rowData.reduce((acc, v) => acc + v.totalDebit, 0), [rowData]);
  const totalCredits = useMemo(() => rowData.reduce((acc, v) => acc + v.totalCredit, 0), [rowData]);

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] min-h-[calc(100vh-2rem)]">
       {/* INDUSTRIAL HEADER */}
       <div className="bg-white border-b border-slate-200 p-6 flex flex-col xl:flex-row justify-between items-center gap-6 sticky top-0 z-40">
          <div>
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#0f172a] rounded flex items-center justify-center text-white shadow-lg">
                   <FileText size={20} />
                </div>
                <div>
                   <h2 className="text-xl font-bold text-[#0f172a] uppercase tracking-tighter">Daybook</h2>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Transactional Chronology & Journal Log</p>
                </div>
             </div>
          </div>
          
          <div className="flex items-center gap-4 w-full xl:w-auto">
             <div className="relative flex-1 xl:w-80">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Search daybook..." className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded text-xs font-bold outline-none focus:border-[#0f172a] focus:bg-white transition-all" />
             </div>
             <div className="flex items-center gap-2">
                <button className="h-10 px-4 bg-white border border-slate-200 text-[#0f172a] rounded font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all">
                   <Printer size={16} /> Print
                </button>
                <button className="h-10 px-4 bg-white border border-slate-200 text-[#0f172a] rounded font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all">
                   <FileSpreadsheet size={16} /> Excel
                </button>
             </div>
          </div>
       </div>

       {/* TABLE AREA */}
       <div className="p-6 flex-1 flex flex-col">
          <div className="bg-white border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1 divide-y divide-slate-100">
             
             {/* Filter Bar */}
             <div className="h-12 px-6 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-6">
                   <div className="flex items-center gap-4">
                      <button className="flex items-center gap-2 text-[10px] font-bold uppercase text-slate-500 hover:text-[#0f172a] transition-colors"><Filter size={14}/> Filters</button>
                      <div className="h-4 w-px bg-slate-200" />
                   </div>
                   <div className="flex items-center gap-6">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Total Entries: <span className="text-slate-900">{rowData.length}</span></span>
                      <span className="text-[10px] font-bold uppercase text-slate-400">Period: <span className="text-slate-900">Current Session</span></span>
                   </div>
                </div>
                <div className="flex items-center gap-3">
                   <button onClick={fetchDaybook} className="p-2 text-slate-400 hover:text-blue-500 transition-all" title="Refresh"><RefreshCcw size={16}/></button>
                </div>
             </div>

             {/* AG-Grid Professional Layout */}
             <div className="ag-theme-quartz bg-white" style={{ height: '600px', width: '100%' }}>
                <AgGridReact
                   rowData={rowData}
                   columnDefs={columnDefs}
                   defaultColDef={{ 
                     resizable: true, 
                     sortable: true, 
                     filter: true,
                     flex: 1
                   }}
                   rowHeight={54}
                   headerHeight={50}
                   pagination={true}
                   paginationPageSize={20}
                   animateRows={true}
                />
             </div>
          </div>
       </div>

       {/* DAYBOOK SUMMARY FOOTER */}
       <footer className="px-6 pb-6 mt-auto">
          <div className="bg-[#0f172a] text-white p-6 rounded-lg flex flex-wrap items-center justify-between gap-8 shadow-xl">
             <div className="flex items-center gap-10">
                <div className="flex flex-col">
                   <span className="text-[10px] font-bold uppercase opacity-40 tracking-widest">Total Debit Volume</span>
                   <span className="text-2xl font-bold tracking-tighter">₹ {totalDebits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div className="flex flex-col">
                   <span className="text-[10px] font-bold uppercase opacity-40 tracking-widest">Total Credit Volume</span>
                   <span className="text-2xl font-bold tracking-tighter">₹ {totalCredits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
             </div>
             
             <div className="flex items-center gap-6">
                <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded flex items-center gap-3">
                   <CheckCircle2 size={16} className="text-emerald-500" />
                   <div className="flex flex-col">
                      <span className="text-[9px] font-bold uppercase opacity-60">Status</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Books Reconciled</span>
                   </div>
                </div>
                <div className="bg-white/5 border border-white/10 px-4 py-2 rounded flex items-center gap-3">
                   <Clock size={16} className="text-blue-400" />
                   <div className="flex flex-col">
                      <span className="text-[9px] font-bold uppercase opacity-60">Last Sync</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest">Just now</span>
                   </div>
                </div>
             </div>
          </div>
       </footer>
    </div>
  );
};

export default DaybookView;
