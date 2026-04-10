import React, { useState, useEffect, useCallback } from 'react';
import { inventoryAPI } from '../../services/api';
import {
  X, Edit2, ChevronRight, Calendar, Package, Coins, ShoppingCart, 
  Trash2, ArrowUpRight, Box, User, Info, Tag, Layers, ArrowDownLeft,
  CheckCircle2, Clock, List, RefreshCcw, ChevronDown
} from 'lucide-react';

// ─── Error Boundary ────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-10 gap-3">
          <p className="text-slate-500 text-[13px]">Something went wrong loading this tab.</p>
          <button
            className="text-[#1e61f0] text-[12px] hover:underline"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Helper: format date ───────────────────────────────────────────
const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleString('en-GB', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    }).replace(',', '');
  } catch {
    return 'N/A';
  }
};

const formatAction = (action) => {
  if (!action) return 'action';
  return action.toLowerCase().replace(/_/g, ' ');
};

// ─── Sub-component: History Tab ────────────────────────────────────
const HistoryTab = ({ itemId }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadHistory = useCallback(async () => {
    if (!itemId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await inventoryAPI.getItemHistory(itemId);
      const data = Array.isArray(res?.data) ? res.data : [];
      setLogs(data);
    } catch (err) {
      console.error('History fetch error:', err);
      setError('Could not load history. Please try again.');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [itemId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e61f0]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-3">
        <p className="text-red-400 text-[13px]">{error}</p>
        <button
          onClick={loadHistory}
          className="text-[#1e61f0] text-[12px] hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="w-full animate-fade-in">
      <div className="flex text-[10px] font-black text-slate-400 uppercase tracking-widest px-8 py-4 border-b border-slate-100 bg-slate-50/30">
        <div className="w-48">Timestamp</div>
        <div className="flex-1">Activity Log</div>
      </div>

      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300">
             <Clock size={24} />
          </div>
          <p className="text-slate-400 text-[13px] font-medium tracking-tight">No activity logs found for this item.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-50">
          {logs.map((log, idx) => (
            <div
              key={log?.id || idx}
              className="flex px-8 py-5 items-center hover:bg-slate-50/80 transition-all group border-b border-slate-50 last:border-0"
            >
              <div className="w-48 text-[12px] text-slate-400 font-bold tracking-tight flex items-center gap-2">
                <Calendar size={12} className="opacity-40" />
                {formatDate(log?.createdAt)}
              </div>
              <div className="flex-1 flex items-center gap-4">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] text-slate-900 font-black tracking-tight">
                      {log?.User?.name || 'System'}
                    </span>
                  </div>
                </div>
                
                {/* Status Indicator */}
                <div className="ml-auto flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                   <span className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter">Success</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Sub-component: Transactions Tab ──────────────────────────────
const TransactionsTab = () => {
  const [transactionType, setTransactionType] = useState('Quotes');
  const [status, setStatus] = useState('All');
  
  const transactionTypes = [
    'Quotes', 'Sales Orders', 'Invoices', 'Delivery Challans',
    'Credit Notes', 'Recurring Invoices', 'Purchase Orders', 'Bills', 'Vendor Credits',
  ];

  const statuses = ['All', 'Draft', 'Sent', 'Accepted', 'Declined', 'Invoiced'];

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* Premium Filter Bar */}
      <div className="flex items-center gap-4 mb-8">
        <div className="relative group">
          <label className="absolute -top-2.5 left-4 px-2 bg-white text-[10px] font-black text-slate-400 uppercase tracking-widest z-10 transition-colors group-focus-within:text-blue-600">
            Filter By
          </label>
          <div className="relative">
            <select
              value={transactionType}
              onChange={(e) => setTransactionType(e.target.value)}
              className="appearance-none bg-white border border-slate-200 text-slate-700 font-bold text-[13px] rounded-2xl pl-5 pr-12 py-3.5 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all cursor-pointer min-w-[200px] shadow-sm hover:border-slate-300"
            >
              {transactionTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-blue-500 transition-colors" />
          </div>
        </div>

        <div className="relative group">
          <label className="absolute -top-2.5 left-4 px-2 bg-white text-[10px] font-black text-slate-400 uppercase tracking-widest z-10 transition-colors group-focus-within:text-blue-600">
            Status
          </label>
          <div className="relative">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="appearance-none bg-white border border-slate-200 text-slate-700 font-bold text-[13px] rounded-2xl pl-5 pr-12 py-3.5 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all cursor-pointer min-w-[140px] shadow-sm hover:border-slate-300"
            >
              {statuses.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-blue-500 transition-colors" />
          </div>
        </div>
      </div>

      {/* Empty State / Table Placeholder */}
      <div className="flex-1 bg-white rounded-[32px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden flex flex-col">
        <div className="flex bg-slate-50/50 px-8 py-4 border-b border-slate-100">
          <div className="w-[15%] text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</div>
          <div className="w-[20%] text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction #</div>
          <div className="flex-1 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Reference</div>
          <div className="w-[15%] text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</div>
          <div className="w-[15%] text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center py-20 gap-6">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-10 animate-pulse rounded-full" />
            <div className="relative w-24 h-24 rounded-[40px] bg-gradient-to-br from-white to-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 shadow-xl">
               <List size={48} strokeWidth={1} />
            </div>
          </div>
          <div className="text-center max-w-[280px]">
             <h4 className="text-slate-900 font-black text-lg tracking-tight mb-2">No {transactionType} Found</h4>
             <p className="text-slate-400 text-[13px] leading-relaxed font-medium">
               There are no {transactionType.toLowerCase()} associated with this item for the current status.
             </p>
          </div>
          <button className="mt-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 font-black text-[11px] uppercase tracking-[0.15em] rounded-2xl hover:bg-slate-50 transition-all shadow-sm active:scale-95">
             Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────
const ItemDetailView = ({ item, onClose, onEdit }) => {
  const [activeTab, setActiveTab] = useState('Overview');

  if (!item) return (
     <div className="h-full flex items-center justify-center bg-slate-50/30">
        <div className="flex flex-col items-center gap-4 text-slate-300">
           <Box size={48} strokeWidth={1} className="animate-pulse" />
           <span className="text-[12px] font-black uppercase tracking-widest italic">Select an item to view details</span>
        </div>
     </div>
  );

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(amount || 0);

  const tabs = ['Overview', 'Transactions', 'History'];

  const DetailRow = ({ icon: Icon, label, value, color = "text-slate-500" }) => (
     <div className="flex flex-col gap-1.5 p-4 rounded-2xl hover:bg-slate-50 transition-colors group">
        <div className="flex items-center gap-2">
           <div className={`p-1.5 rounded-lg opacity-40 group-hover:opacity-100 transition-opacity bg-slate-100 ${color}`}>
              <Icon size={14} />
           </div>
           <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
        </div>
        <span className="text-[13px] font-bold text-slate-800 ml-9 lowercase first-letter:uppercase">{value}</span>
     </div>
  );

  return (
    <div className="h-full flex flex-col bg-[#F9FAFB] animate-fade-in overflow-hidden">
      
      {/* ── HEADER ─────────────────────────────────────── */}
      <div className="bg-white px-8 py-6 border-b border-slate-100 shadow-sm z-30">
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">
           <span>Items</span>
           <ChevronRight size={10} strokeWidth={4} />
           <span className="text-blue-600 italic">Product Detail</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
             <div className="w-14 h-14 rounded-3xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
                {item.type === 'Service' ? <RefreshCcw size={24} strokeWidth={2.5} /> : <Package size={24} strokeWidth={2.5} />}
             </div>
             <div>
                <h1 className="text-[26px] font-black text-slate-900 tracking-tight leading-tight italic">{item.name}</h1>
                <div className="flex items-center gap-4 mt-1">
                   <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 rounded-lg">
                      <Layers size={10} className="text-slate-400" />
                      <span className="text-[10px] font-black text-slate-500 uppercase">{item.type || 'Goods'}</span>
                   </div>
                   {item.salesInformation && (
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-100 rounded-lg">
                         <CheckCircle2 size={10} className="text-emerald-600" />
                         <span className="text-[10px] font-black text-emerald-600 uppercase">Sales Enabled</span>
                      </div>
                   )}
                </div>
             </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onEdit(item)}
              className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-black text-[11px] uppercase tracking-widest rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-2 shadow-sm"
            >
              <Edit2 size={14} className="text-blue-600" />
              Edit Item
            </button>

            <button
              onClick={onClose}
              className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-100 hover:bg-rose-50 rounded-xl transition-all shadow-sm"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* ── TABS ───────────────────────────────────────── */}
      <div className="bg-white px-8 border-b border-slate-100 flex gap-8 z-20">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-[12px] font-black uppercase tracking-widest h-14 relative transition-all ${
              activeTab === tab ? 'text-[#1e61f0]' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#1e61f0] rounded-t-full animate-underline" />
            )}
          </button>
        ))}
      </div>

      {/* ── CONTENT ────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">

        {/* Overview Tab Content */}
        {activeTab === 'Overview' && (
          <div className="max-w-5xl space-y-8 animate-slide-up">
            
            {/* CARD 1: BASIC INFORMATION */}
            <div className="bg-white rounded-[24px] p-8 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] ring-1 ring-slate-100 border-t-4 border-blue-600">
               <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                     <Package size={18} />
                  </div>
                  <h3 className="text-[16px] font-bold text-slate-900 tracking-tight lowercase first-letter:uppercase">Basic Information 🧾</h3>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <DetailRow icon={Tag} label="Item Name" value={item.name} color="text-indigo-600" />
                  <DetailRow icon={Layers} label="Item Type" value={item.type || 'Goods'} color="text-blue-500" />
                  <DetailRow icon={Box} label="Usage Unit" value={item.unit || 'Nos'} color="text-emerald-500" />
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {/* CARD 2: SALES INFORMATION */}
               <div className="bg-white rounded-[24px] p-8 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] ring-1 ring-slate-100 border-t-4 border-emerald-500 self-start">
                  <div className="flex items-center justify-between mb-8">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                           <Coins size={18} />
                        </div>
                        <h3 className="text-[16px] font-bold text-slate-900 tracking-tight lowercase first-letter:uppercase">Sales Details 💰</h3>
                     </div>
                     <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full uppercase tracking-tighter">Active</span>
                  </div>
                  <div className="space-y-4">
                     <div className="flex items-baseline justify-between p-4 bg-emerald-50/30 rounded-2xl ring-1 ring-emerald-50">
                        <span className="text-[12px] font-black text-emerald-700 uppercase tracking-widest opacity-70">Selling Price</span>
                        <span className="text-[20px] font-black text-slate-900 tracking-tight">{formatCurrency(item.sellingPrice)}</span>
                     </div>
                     <div className="pt-4 border-t border-slate-50">
                        <DetailRow icon={ArrowUpRight} label="Income Account" value={item.salesAccount || 'Sales'} color="text-emerald-500" />
                      </div>
                  </div>
               </div>

               {/* CARD 3: PURCHASE INFORMATION */}
               <div className="bg-white rounded-[24px] p-8 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] ring-1 ring-slate-100 border-t-4 border-amber-500 self-start">
                  <div className="flex items-center justify-between mb-8">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                           <ShoppingCart size={18} />
                        </div>
                        <h3 className="text-[16px] font-bold text-slate-900 tracking-tight lowercase first-letter:uppercase">Purchase Details 📦</h3>
                     </div>
                     <span className="text-[10px] font-black bg-amber-100 text-amber-700 px-3 py-1 rounded-full uppercase tracking-tighter">Active</span>
                  </div>
                  <div className="space-y-4">
                     <div className="flex items-baseline justify-between p-4 bg-amber-50/30 rounded-2xl ring-1 ring-amber-50">
                        <span className="text-[12px] font-black text-amber-700 uppercase tracking-widest opacity-70">Cost Price</span>
                        <span className="text-[20px] font-black text-slate-900 tracking-tight">{formatCurrency(item.costPrice)}</span>
                     </div>
                     <div className="pt-4 border-t border-slate-50">
                        <DetailRow icon={ArrowDownLeft} label="Expense Account" value={item.purchaseAccount || 'Cost of Goods Sold'} color="text-amber-500" />
                      </div>
                  </div>
               </div>
            </div>

          </div>
        )}

        {/* Transactions Tab Content */}
        {activeTab === 'Transactions' && (
          <div className="p-0 h-full max-w-6xl mx-auto">
            <ErrorBoundary>
              <TransactionsTab />
            </ErrorBoundary>
          </div>
        )}

        {/* History Tab Content */}
        {activeTab === 'History' && (
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden ring-1 ring-slate-100 max-w-6xl mx-auto">
            <ErrorBoundary>
              <HistoryTab itemId={item.id} />
            </ErrorBoundary>
          </div>
        )}

      </div>
    </div>
  );
};

export default ItemDetailView;
