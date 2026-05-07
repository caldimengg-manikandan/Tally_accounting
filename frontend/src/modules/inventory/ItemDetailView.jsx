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
      <div className="flex text-[10px] font-bold text-slate-400 uppercase tracking-widest px-8 py-4 border-b border-slate-100 bg-slate-50/30">
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
                    <span className="text-[13px] text-slate-900 font-bold tracking-tight">
                      {log?.User?.name || 'System'}
                    </span>
                  </div>
                </div>
                
                {/* Status Indicator */}
                <div className="ml-auto flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                   <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-tighter">Success</span>
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
          <label className="absolute -top-2.5 left-4 px-2 bg-white text-[10px] font-bold text-slate-400 uppercase tracking-widest z-10 transition-colors group-focus-within:text-blue-600">
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
          <label className="absolute -top-2.5 left-4 px-2 bg-white text-[10px] font-bold text-slate-400 uppercase tracking-widest z-10 transition-colors group-focus-within:text-blue-600">
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
          <div className="w-[15%] text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</div>
          <div className="w-[20%] text-[10px] font-bold text-slate-400 uppercase tracking-widest">Transaction #</div>
          <div className="flex-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Reference</div>
          <div className="w-[15%] text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Status</div>
          <div className="w-[15%] text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Amount</div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center py-20 gap-6">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-10 animate-pulse rounded-full" />
            <div className="relative w-24 h-24 rounded-[40px] bg-gradient-to-br from-white to-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 shadow-xl">
               <List size={48} strokeWidth={1} />
            </div>
          </div>
          <div className="text-center max-w-[280px]">
             <h4 className="text-slate-900 font-bold text-lg tracking-tight mb-2">No {transactionType} Found</h4>
             <p className="text-slate-400 text-[13px] leading-relaxed font-medium">
               There are no {transactionType.toLowerCase()} associated with this item for the current status.
             </p>
          </div>
          <button className="mt-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold text-[11px] uppercase tracking-[0.15em] rounded-2xl hover:bg-slate-50 transition-all shadow-sm active:scale-95">
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
           <span className="text-[12px] font-bold uppercase tracking-widest italic">Select an item to view details</span>
        </div>
     </div>
  );

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(amount || 0);

  const tabs = ['Overview', 'Transactions', 'History'];

  const SimpleDetailRow = ({ label, value, isLink = false }) => (
     <div className="grid grid-cols-[180px_1fr] py-2 text-[13px]">
        <span className="text-slate-400 font-medium">{label}</span>
        <span className={`font-medium ${isLink ? 'text-[#1e61f0] cursor-pointer hover:underline' : 'text-slate-700'}`}>
           {value || '—'}
        </span>
     </div>
  );

  const getItemTypeLabel = () => {
    if (item.salesInformation && item.purchaseInformation) return 'Sales and Purchase Item';
    if (item.salesInformation) return 'Sales Item';
    if (item.purchaseInformation) return 'Purchase Item';
    return item.type === 'Service' ? 'Service' : 'Inventory Part';
  };

  return (
    <div className="h-full flex flex-col bg-[#F9FAFB] animate-fade-in overflow-hidden">
      
      {/* ── HEADER ─────────────────────────────────────── */}
      <div className="bg-white px-8 py-4 flex items-center justify-between border-b border-slate-150">
        <h1 className="text-[20px] font-bold text-slate-900">{item.name}</h1>
        
        <div className="flex items-center gap-2">
           <button
             onClick={() => onEdit(item)}
             className="p-2 border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-md transition-all shadow-sm"
             title="Edit Item"
           >
             <Edit2 size={16} />
           </button>
           <button
             onClick={onClose}
             className="p-2 border border-slate-200 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-all shadow-sm ml-2"
           >
             <X size={18} />
           </button>
        </div>
      </div>

      {/* ── TABS ───────────────────────────────────────── */}
      <div className="bg-white px-8 border-b border-slate-100 flex gap-8 z-20">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-[12px] font-bold uppercase tracking-widest h-14 relative transition-all ${
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
          <div className="max-w-4xl space-y-12 animate-fade-in py-5">
            <div className="space-y-1">
               <SimpleDetailRow label="Item Type" value={getItemTypeLabel()} />
               <SimpleDetailRow label="Unit" value={item.unit || 'Nos'} />
               <SimpleDetailRow label="Created Source" value="User" />
            </div>

            {/* SALES INFORMATION */}
            {item.salesInformation && (
              <div className="space-y-4 pt-4">
                 <h3 className="text-[16px] font-bold text-slate-800">Sales Information</h3>
                 <div className="space-y-1">
                    <SimpleDetailRow label="Selling Price" value={formatCurrency(item.sellingPrice)} />
                    <SimpleDetailRow label="Income Account" value={item.salesAccount || 'Sales'} />
                    {item.salesDescription && (
                      <SimpleDetailRow label="Sales Description" value={item.salesDescription} />
                    )}
                 </div>
              </div>
            )}

            {/* PURCHASE INFORMATION */}
            {item.purchaseInformation && (
              <div className={`space-y-4 pt-4 ${item.salesInformation ? 'border-t border-slate-100' : ''}`}>
                 <h3 className="text-[16px] font-bold text-slate-800">Purchase Information</h3>
                 <div className="space-y-1">
                    <SimpleDetailRow label="Cost Price" value={formatCurrency(item.costPrice)} />
                    <SimpleDetailRow label="Purchase Account" value={item.purchaseAccount || 'Cost of Goods Sold'} />
                    {item.preferredVendor && (
                      <SimpleDetailRow label="Preferred Vendor" value={item.preferredVendor} isLink={true} />
                    )}
                    {item.purchaseDescription && (
                      <SimpleDetailRow label="Purchase Description" value={item.purchaseDescription} />
                    )}
                 </div>
              </div>
            )}

            {/* REPORTING TAGS */}
            <div className={`space-y-4 pt-4 ${(item.salesInformation || item.purchaseInformation) ? 'border-t border-slate-100' : ''}`}>
               <h3 className="text-[16px] font-bold text-slate-800">Reporting Tags</h3>
               <p className="text-[13px] text-slate-500">No reporting tag has been associated with this item.</p>
            </div>

            {/* ASSOCIATED PRICE LISTS */}
            <div className="pt-2">
               <button className="text-[13px] font-bold text-[#1e61f0] hover:underline flex items-center gap-1">
                  Associated Price Lists
                  <ChevronRight size={14} className="mt-0.5" />
               </button>
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
