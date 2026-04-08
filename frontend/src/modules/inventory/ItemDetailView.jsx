import React, { useState, useEffect, useCallback } from 'react';
import { inventoryAPI } from '../../services/api';
import {
  X, Edit2, ChevronRight, Calendar
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

// ─── Helper: format action label ──────────────────────────────────
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
    <div className="w-full">
      {/* Table Header */}
      <div className="flex text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-6 py-2.5 border-b border-slate-100 bg-slate-50/60">
        <div className="w-48">Date</div>
        <div className="flex-1">Details</div>
      </div>

      {/* Rows */}
      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Calendar size={40} strokeWidth={1.5} className="text-slate-300" />
          <p className="text-slate-400 text-[13px]">No history found for this item.</p>
        </div>
      ) : (
        logs.map((log, idx) => (
          <div
            key={log?.id || idx}
            className="flex px-6 py-3.5 border-b border-slate-50 items-center hover:bg-slate-50/70 transition-colors"
          >
            <div className="w-48 text-[12.5px] text-slate-500 font-medium">
              {formatDate(log?.createdAt)}
            </div>
            <div className="flex-1 text-[13px]">
              <span className="text-slate-800 font-semibold">
                {formatAction(log?.action)}
              </span>
              <span className="text-slate-400 italic ml-2">
                — {log?.User?.name || 'System User'}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

// ─── Sub-component: Transactions Tab ──────────────────────────────
const TransactionsTab = () => {
  const [transactionType, setTransactionType] = useState('Quotes');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e) => {
      const filterEl = document.getElementById('filter-dd');
      const statusEl = document.getElementById('status-dd');
      if (filterEl && !filterEl.contains(e.target)) setShowFilterDropdown(false);
      if (statusEl && !statusEl.contains(e.target)) setShowStatusDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const transactionTypes = [
    'Quotes', 'Sales Orders', 'Invoices', 'Delivery Challans',
    'Credit Notes', 'Recurring Invoices', 'Purchase Orders', 'Bills', 'Vendor Credits',
  ];
  const statuses = ['All', 'Draft', 'Sent', 'Client Viewed', 'Accepted', 'Invoiced', 'Declined', 'Expired'];

  return (
    <div className="flex flex-col h-full">
      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        {/* Filter By */}
        <div className="relative" id="filter-dd">
          <button
            onClick={() => { setShowFilterDropdown(v => !v); setShowStatusDropdown(false); }}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded text-[12px] text-slate-500 bg-slate-50 hover:bg-slate-100 transition-all shadow-sm"
          >
            Filter By: <span className="text-slate-800 font-medium">{transactionType}</span>
            <ChevronDown size={13} className="text-slate-600" />
          </button>
          {showFilterDropdown && (
            <div className="absolute top-full left-0 mt-1 w-[200px] bg-white border border-slate-200 rounded-md shadow-xl z-50 overflow-hidden">
              {transactionTypes.map(t => (
                <button
                  key={t}
                  onClick={() => { setTransactionType(t); setShowFilterDropdown(false); }}
                  className={`w-full text-left px-4 py-2.5 text-[12px] font-medium transition-colors ${
                    transactionType === t ? 'bg-blue-500 text-white' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >{t}</button>
              ))}
            </div>
          )}
        </div>

        {/* Status */}
        <div className="relative" id="status-dd">
          <button
            onClick={() => { setShowStatusDropdown(v => !v); setShowFilterDropdown(false); }}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded text-[12px] text-slate-500 bg-slate-50 hover:bg-slate-100 transition-all shadow-sm"
          >
            Status: <span className="text-slate-800 font-medium">{statusFilter}</span>
            <ChevronDown size={13} className="text-slate-600" />
          </button>
          {showStatusDropdown && (
            <div className="absolute top-full left-0 mt-1 w-[160px] bg-white border border-slate-200 rounded-md shadow-xl z-50 overflow-hidden">
              {statuses.map(s => (
                <button
                  key={s}
                  onClick={() => { setStatusFilter(s); setShowStatusDropdown(false); }}
                  className={`w-full text-left px-4 py-2.5 text-[12px] font-medium transition-colors ${
                    statusFilter === s ? 'bg-blue-500 text-white' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >{s}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Empty State */}
      <div className="flex-1 flex items-center justify-center">
        <p className="text-slate-400 text-[13px]">There are no {transactionType.toLowerCase()}</p>
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────
const ItemDetailView = ({ item, onClose, onEdit }) => {
  const [activeTab, setActiveTab] = useState('Overview');

  if (!item) return null;

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(amount || 0);

  const tabs = ['Overview', 'Transactions', 'History'];

  return (
    <div className="h-full flex flex-col bg-white border-l border-slate-100 shadow-xl">
      {/* ── HEADER ─────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <h2 className="text-[18px] text-slate-800">{item.name}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(item)}
            className="p-1.5 border border-slate-200 text-slate-500 hover:text-[#1e61f0] hover:bg-blue-50 rounded-md transition-all"
            title="Edit"
          >
            <Edit2 size={14} />
          </button>

          <button
            onClick={onClose}
            className="p-1.5 border border-slate-200 text-slate-500 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-all"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* ── TABS ───────────────────────────────────────── */}
      <div className="px-6 border-b border-slate-200 flex gap-6 h-[46px] bg-white sticky top-0 z-10">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-[13px] relative transition-all ${
              activeTab === tab ? 'text-[#1e61f0] font-medium' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#1e61f0]" />
            )}
          </button>
        ))}
      </div>

      {/* ── CONTENT ────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto bg-white">

        {/* Overview */}
        {activeTab === 'Overview' && (
          <div className="p-6 max-w-3xl space-y-10">
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center gap-16 text-[13px]">
                <label className="w-40 text-slate-400">Item Type</label>
                <span className="text-slate-800">{item.type === 'Service' ? 'Service' : 'Sales and Purchase Items'}</span>
              </div>
              <div className="flex items-center gap-16 text-[13px]">
                <label className="w-40 text-slate-400">Unit</label>
                <span className="text-slate-800">{item.unit || 'Nos'}</span>
              </div>
              <div className="flex items-center gap-16 text-[13px]">
                <label className="w-40 text-slate-400">Created Source</label>
                <span className="text-slate-800">User</span>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[14px] font-semibold text-slate-800">Purchase Information</h3>
              <div className="space-y-3 pl-1">
                <div className="flex items-center gap-16 text-[13px]">
                  <label className="w-40 text-slate-400">Cost Price</label>
                  <span className="text-slate-800 font-medium">{formatCurrency(item.costPrice)}</span>
                </div>
                <div className="flex items-center gap-16 text-[13px]">
                  <label className="w-40 text-slate-400">Purchase Account</label>
                  <span className="text-slate-800">{item.purchaseAccount || 'Cost of Goods Sold'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[14px] font-semibold text-slate-800">Sales Information</h3>
              <div className="space-y-3 pl-1">
                <div className="flex items-center gap-16 text-[13px]">
                  <label className="w-40 text-slate-400">Selling Price</label>
                  <span className="text-slate-800 font-medium">{formatCurrency(item.sellingPrice)}</span>
                </div>
                <div className="flex items-center gap-16 text-[13px]">
                  <label className="w-40 text-slate-400">Sales Account</label>
                  <span className="text-slate-800">{item.salesAccount || 'Sales'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[14px] font-semibold text-slate-800">Reporting Tags</h3>
              <p className="text-[13px] text-slate-400">No reporting tag has been associated with this item.</p>
            </div>

            <div>
              <button className="flex items-center gap-2 text-[#1e61f0] text-[13px] hover:text-blue-700 transition-all group">
                Associated Price Lists
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        )}

        {/* Transactions */}
        {activeTab === 'Transactions' && (
          <div className="p-6 h-full">
            <ErrorBoundary>
              <TransactionsTab />
            </ErrorBoundary>
          </div>
        )}

        {/* History */}
        {activeTab === 'History' && (
          <ErrorBoundary>
            <HistoryTab itemId={item.id} />
          </ErrorBoundary>
        )}

      </div>
    </div>
  );
};

export default ItemDetailView;
