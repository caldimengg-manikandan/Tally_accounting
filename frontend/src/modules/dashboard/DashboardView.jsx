import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown,
  RefreshCcw, ChevronDown, ChevronRight,
  Plus, FileText, Wallet, Shield, Landmark,
  BookOpen, ShoppingBag, CheckCircle,
  Activity, BarChart2, Loader,
  ArrowLeftRight, FileStack, Repeat, Package, Target
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';
import { reportsAPI, voucherAPI } from '../../services/api';
import AIAssistant from '../../components/AIAssistant';

// ── Formatters ────────────────────────────────────────────────────
const fmt = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
const fmtK = (v) => {
  const n = Number(v || 0);
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(2)}L`;
  if (n >= 1000)     return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n}`;
};
const relativeTime = (ts) => {
  if (!ts) return '';
  const ms = Date.now() - new Date(ts).getTime();
  const h = Math.floor(ms / 3600000);
  const d = Math.floor(ms / 86400000);
  if (h < 1) return 'Just now';
  if (h < 24) return `${h}h ago`;
  if (d === 1) return 'Yesterday';
  return `${d}d ago`;
};

// ── Custom Chart Tooltip ──────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-lg px-4 py-3 text-[12px]">
      <p className="font-bold text-slate-700 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-500 capitalize">{p.name}:</span>
          <span className="font-bold text-slate-800">{fmtK(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

// ── Dropdown Menu ─────────────────────────────────────────────────
const DropdownMenu = ({ items, onClose }) => {
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (!ref.current?.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);
  return (
    <div ref={ref} className="absolute right-0 top-full mt-1.5 w-56 bg-white border border-slate-100 rounded-xl shadow-xl z-50 py-1.5 animate-zoom-in">
      {items.map((item) => (
        <button
          key={item.label}
          onClick={() => { item.onClick?.(); onClose(); }}
          className="w-full text-left px-4 py-2.5 text-[12.5px] font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors flex items-center gap-2.5"
        >
          {item.icon && <item.icon size={13} className="text-slate-400" />}
          {item.label}
        </button>
      ))}
    </div>
  );
};

// ── Summary Card ──────────────────────────────────────────────────
const SummaryCard = ({ title, icon: Icon, iconColor, iconBg, children, dropdownItems, canCreate, loading }) => {
  const [ddOpen, setDdOpen] = useState(false);
  return (
    <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-slate-100 p-5 relative hover:shadow-[0_4px_20px_rgba(0,0,0,0.12)] transition-all duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center`}>
            <Icon size={17} className={iconColor} />
          </div>
          <span className="text-[13px] font-bold text-slate-700">{title}</span>
        </div>
        {canCreate && dropdownItems?.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setDdOpen(v => !v)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1A73E8] text-white text-[11px] font-semibold hover:bg-blue-700 transition-colors"
            >
              <Plus size={11} strokeWidth={3} />
              New
              <ChevronDown size={10} className={`transition-transform ${ddOpen ? 'rotate-180' : ''}`} />
            </button>
            {ddOpen && <DropdownMenu items={dropdownItems} onClose={() => setDdOpen(false)} />}
          </div>
        )}
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-16">
          <Loader size={20} className="text-blue-400 animate-spin" />
        </div>
      ) : children}
    </div>
  );
};

// ── Segmented Progress Bar ─────────────────────────────────────────
const SegmentedBar = ({ current, overdue, total }) => {
  const safe = (v) => (isNaN(v) ? 0 : v);
  const t = safe(total) || 1;
  const pctCurrent = Math.min(100, (safe(current) / t) * 100);
  const pctOverdue = Math.min(100 - pctCurrent, (safe(overdue) / t) * 100);
  return (
    <div className="mt-3">
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex gap-0.5">
        <div className="h-full bg-[#1A73E8] rounded-l-full transition-all duration-700" style={{ width: `${pctCurrent}%` }} />
        <div className="h-full bg-orange-400 rounded-r-full transition-all duration-700" style={{ width: `${pctOverdue}%` }} />
      </div>
      <div className="flex items-center gap-4 mt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#1A73E8]" />
          <span className="text-[11px] text-slate-500">Current: <strong className="text-slate-700">{fmt(current)}</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-orange-400" />
          <span className="text-[11px] text-slate-500">Overdue: <strong className="text-orange-600">{fmt(overdue)}</strong></span>
        </div>
      </div>
    </div>
  );
};

// ── Activity icon map ─────────────────────────────────────────────
const ACT_ICONS = {
  invoice:  { Icon: FileText,       bg: 'bg-blue-50',   color: 'text-blue-600'   },
  payment:  { Icon: CheckCircle,    bg: 'bg-emerald-50',color: 'text-emerald-600'},
  bill:     { Icon: ShoppingBag,    bg: 'bg-orange-50', color: 'text-orange-600' },
  gst:      { Icon: Shield,         bg: 'bg-purple-50', color: 'text-purple-600' },
  voucher:  { Icon: BookOpen,       bg: 'bg-blue-50', color: 'text-blue-600' },
};

// ── Top Ranked List ────────────────────────────────────────────────
const TopRankedList = ({ title, items, valueKey, navigate, path, loading }) => (
  <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-slate-100 p-5">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-[13px] font-bold text-slate-800">{title}</h3>
      <button onClick={() => navigate(path)} className="text-[11px] font-semibold text-[#1A73E8] hover:underline flex items-center gap-0.5">
        View All <ChevronRight size={12} />
      </button>
    </div>
    {loading ? (
      <div className="flex items-center justify-center h-24"><Loader size={20} className="text-blue-400 animate-spin" /></div>
    ) : items.length === 0 ? (
      <p className="text-[12px] text-slate-400 text-center py-6">No data yet</p>
    ) : (
      <div className="space-y-3">
        {items.map((item, idx) => (
          <div key={item.name} className="flex items-center gap-3">
            <span className="text-[11px] font-bold text-slate-400 w-4 shrink-0">{idx + 1}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[12px] font-semibold text-slate-700 truncate">{item.name}</span>
                <span className="text-[12px] font-bold text-slate-800 ml-2 shrink-0">{fmtK(item[valueKey])}</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#1A73E8] to-blue-500 rounded-full transition-all duration-700"
                  style={{ width: `${item.pct || 0}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

// ══════════════════════════════════════════════════════════════════
// MAIN DASHBOARD VIEW
// ══════════════════════════════════════════════════════════════════
const DashboardView = ({ companyId: propCompanyId }) => {
  const navigate = useNavigate();
  const companyId = propCompanyId || sessionStorage.getItem('companyId');
  const companyName = sessionStorage.getItem('companyName') || 'Dashboard';
  const user = (() => { try { return JSON.parse(sessionStorage.getItem('user') || '{}'); } catch { return {}; } })();
  const role = (user.role || 'ADMIN').toLowerCase();
  const canCreate = !['viewer'].includes(role);
  const canFileGST = !['viewer', 'data_entry'].includes(role);

  const [data, setData]       = useState(null);
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]     = useState(null);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [activeChart, setActiveChart] = useState('cashflow');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (!companyId) return;
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const [dashRes, vouchRes] = await Promise.allSettled([
        reportsAPI.dashboard(companyId),
        voucherAPI.getByCompany(companyId),
      ]);
      if (dashRes.status === 'fulfilled') setData(dashRes.value.data);
      else setError('Could not load dashboard data.');
      if (vouchRes.status === 'fulfilled' && Array.isArray(vouchRes.value.data)) {
        setVouchers(vouchRes.value.data.slice(0, 8));
      }
    } catch (err) {
      setError('Network error. Please refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [companyId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Derived values from API data ────────────────────────────────
  const receivables    = data?.receivables || { total: 0, current: 0, overdue: 0 };
  const payables       = data?.payables    || { total: 0, current: 0, overdue: 0 };
  const bankAccounts   = data?.bankAccounts  || [];
  const gst            = data?.gst           || { payable: 0, receivable: 0, filingStatus: '—' };
  const cashFlow       = data?.cashFlow       || [];
  const revenueExp     = data?.revenueExpenses|| [];
  const agingData      = data?.receivablesAging || [];
  const topCustomers   = data?.topCustomers   || [];
  const topVendors     = data?.topVendors     || [];
  const topProducts    = data?.topProducts    || [];
  const budgetAchievement = data?.budgetAchievement !== undefined ? data.budgetAchievement : 82.5;
  const recentActivity = data?.recentActivity || [];

  const agingTotal = agingData.reduce((s, b) => s + b.amount, 0) || 1;

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${darkMode ? 'bg-[#1C1C2E]' : 'bg-[#F5F7FA]'}`}>
      <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">

        {/* ══ HEADER ══════════════════════════════════════════════ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#1A73E8] animate-pulse" />
              <span className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-slate-400">Live Financial Overview</span>
            </div>
            <h1 className={`text-2xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {companyName} — Dashboard
            </h1>
            <p className={`text-[12.5px] mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setDarkMode(v => !v)}
              className={`px-3.5 py-2 rounded-lg text-[11px] font-bold transition-all border
                ${darkMode ? 'bg-slate-700 text-slate-200 border-slate-600 hover:bg-slate-600'
                           : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
            >
              {darkMode ? '☀️ Light' : '🌙 Dark'}
            </button>
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 text-white text-[11px] font-bold hover:bg-slate-800 transition-all shadow-sm disabled:opacity-50"
            >
              <RefreshCcw size={13} strokeWidth={2.5} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Syncing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-[13px] text-red-700 font-medium">
            ⚠️ {error}
          </div>
        )}

        {/* ══ KPI STRIP ═══════════════════════════════════════════ */}
        {!loading && data && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { label: 'Net Profit',    value: data.netProfit,      icon: TrendingUp,   color: data.netProfit >= 0 ? 'text-emerald-600' : 'text-red-500', bg: 'bg-emerald-50'  },
              { label: 'Total Revenue', value: data.totalIncome,    icon: Activity,     color: 'text-blue-600',   bg: 'bg-blue-50'    },
              { label: 'Expenses',      value: data.totalExpenses,  icon: TrendingDown, color: 'text-orange-600', bg: 'bg-orange-50'  },
              { label: 'Cash & Bank',   value: data.cashBalance,    icon: Landmark,     color: 'text-blue-600', bg: 'bg-blue-50'  },
              { label: 'Budget Utilized', value: `${budgetAchievement.toFixed(1)}%`, icon: Target, color: 'text-purple-650', bg: 'bg-purple-50', isPercent: true },
            ].map(k => (
              <div key={k.label} className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-slate-100 px-5 py-4 flex items-center gap-3 hover:shadow-md transition-all">
                <div className={`w-10 h-10 rounded-xl ${k.bg} flex items-center justify-center shrink-0`}>
                  <k.icon size={18} className={k.color} />
                </div>
                <div>
                  <p className="text-[10.5px] font-bold text-slate-400 uppercase tracking-widest">{k.label}</p>
                  <p className={`text-[18px] font-bold leading-tight ${k.color}`}>{k.isPercent ? k.value : fmtK(k.value)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══ SUMMARY CARDS ═══════════════════════════════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

          {/* Total Sales */}
          <SummaryCard
            title="Total Sales" icon={TrendingUp}
            iconColor="text-blue-600" iconBg="bg-blue-50"
            canCreate={canCreate} loading={loading}
            dropdownItems={[
              { label: 'New Invoice',            icon: FileText,       onClick: () => navigate('/sales-invoices/new') },
              { label: 'New Sales Order',        icon: ShoppingBag,    onClick: () => navigate('/sales-orders/new') },
              { label: 'New Quotation',          icon: FileText,       onClick: () => navigate('/quotes/new') },
            ]}
          >
            <div>
              <p className="text-[11px] text-slate-400 font-medium mb-1">Confirmed Invoiced Revenue</p>
              <p className="text-2xl font-bold text-slate-900">{fmt(data?.totalSales || 0)}</p>
              <div className="mt-3 text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
                <TrendingUp size={12} className="text-emerald-500" />
                <span>Realtime invoiced ledger total</span>
              </div>
            </div>
          </SummaryCard>

          {/* Total Purchases */}
          <SummaryCard
            title="Total Purchases" icon={ShoppingBag}
            iconColor="text-orange-600" iconBg="bg-orange-50"
            canCreate={canCreate} loading={loading}
            dropdownItems={[
              { label: 'New Bill',            icon: FileStack,    onClick: () => navigate('/bills/new') },
              { label: 'New Purchase Order',  icon: ShoppingBag,  onClick: () => navigate('/purchase-orders/new') },
            ]}
          >
            <div>
              <p className="text-[11px] text-slate-400 font-medium mb-1">Incurred Cost of Purchases</p>
              <p className="text-2xl font-bold text-slate-900">{fmt(data?.totalPurchases || 0)}</p>
              <div className="mt-3 text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
                <TrendingDown size={12} className="text-orange-500" />
                <span>Voucher-based total cost</span>
              </div>
            </div>
          </SummaryCard>

          {/* Receivables */}
          <SummaryCard
            title="Total Receivables" icon={TrendingUp}
            iconColor="text-[#1A73E8]" iconBg="bg-blue-50"
            canCreate={canCreate} loading={loading}
            dropdownItems={[
              { label: 'New Invoice',            icon: FileText,       onClick: () => navigate('/sales-invoices/new') },
              { label: 'New Recurring Invoice',  icon: Repeat,         onClick: () => navigate('/recurring-invoices/new') },
              { label: 'New Customer Payment',   icon: Wallet,         onClick: () => navigate('/payments/new') },
              { label: 'New Credit Note',        icon: ArrowDownRight, onClick: () => navigate('/credit-notes/new') },
              { label: 'New Sales Order',        icon: ShoppingBag,    onClick: () => navigate('/sales-orders/new') },
            ]}
          >
            <div>
              <p className="text-[11px] text-slate-400 font-medium mb-1">Total Unpaid Invoices</p>
              <p className="text-2xl font-bold text-slate-900">{fmt(receivables.total)}</p>
              <SegmentedBar current={receivables.current} overdue={receivables.overdue} total={receivables.total} />
            </div>
          </SummaryCard>

          {/* Payables */}
          <SummaryCard
            title="Total Payables" icon={TrendingDown}
            iconColor="text-orange-600" iconBg="bg-orange-50"
            canCreate={canCreate} loading={loading}
            dropdownItems={[
              { label: 'New Bill',            icon: FileStack,    onClick: () => navigate('/bills/new') },
              { label: 'New Recurring Bill',  icon: Repeat,       onClick: () => navigate('/recurring-bills/new') },
              { label: 'New Vendor Payment',  icon: Wallet,       onClick: () => navigate('/payments-made/new') },
              { label: 'New Purchase Order',  icon: ShoppingBag,  onClick: () => navigate('/purchase-orders/new') },
              { label: 'New Debit Note',      icon: ArrowUpRight, onClick: () => navigate('/vendor-credits/new') },
            ]}
          >
            <div>
              <p className="text-[11px] text-slate-400 font-medium mb-1">Total Unpaid Bills</p>
              <p className="text-2xl font-bold text-slate-900">{fmt(payables.total)}</p>
              <SegmentedBar current={payables.current} overdue={payables.overdue} total={payables.total} />
            </div>
          </SummaryCard>

          {/* Bank Balance */}
          <SummaryCard
            title="Bank Balance" icon={Landmark}
            iconColor="text-emerald-600" iconBg="bg-emerald-50"
            canCreate={canCreate} loading={loading}
            dropdownItems={[
              { label: 'Record Deposit',      icon: ArrowDownRight, onClick: () => navigate('/banking/new') },
              { label: 'Record Withdrawal',   icon: ArrowUpRight,   onClick: () => navigate('/banking/new') },
              { label: 'Bank Transfer',       icon: ArrowLeftRight, onClick: () => navigate('/banking/new') },
              { label: 'Reconcile Statement', icon: RefreshCcw,     onClick: () => navigate('/reconciliation') },
            ]}
          >
            <div>
              <p className="text-[11px] text-slate-400 font-medium mb-1">Total Available Balance</p>
              <p className="text-2xl font-bold text-emerald-700">{fmt(data?.cashBalance || 0)}</p>
              <div className="mt-3 space-y-1.5 max-h-[68px] overflow-y-auto">
                {bankAccounts.length === 0
                  ? <p className="text-[11px] text-slate-400">No bank/cash ledgers found</p>
                  : bankAccounts.map(acc => (
                    <div key={acc.id || acc.name} className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 truncate max-w-[130px]">{acc.name}</span>
                      <span className="text-[11.5px] font-bold text-slate-700">{fmtK(acc.balance)}</span>
                    </div>
                  ))
                }
              </div>
            </div>
          </SummaryCard>

          {/* Inventory Value */}
          <SummaryCard
            title="Inventory Value" icon={Package}
            iconColor="text-blue-600" iconBg="bg-blue-50"
            canCreate={canCreate} loading={loading}
            dropdownItems={[
              { label: 'New Item',            icon: Package,      onClick: () => navigate('/inventory/new') },
              { label: 'Manage Price Lists',  icon: FileText,     onClick: () => navigate('/price-lists') },
            ]}
          >
            <div>
              <p className="text-[11px] text-slate-400 font-medium mb-1">Stock Asset Valuation</p>
              <p className="text-2xl font-bold text-slate-900">{fmt(data?.inventoryValue || 0)}</p>
              <div className="mt-3 text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
                <Landmark size={12} className="text-blue-500" />
                <span>Standard cost asset value</span>
              </div>
            </div>
          </SummaryCard>

          {/* GST Summary */}
          <SummaryCard
            title="GST Summary" icon={Shield}
            iconColor="text-purple-600" iconBg="bg-purple-50"
            canCreate={canFileGST} loading={loading}
            dropdownItems={[
              { label: 'File GSTR-1',          icon: FileText,  onClick: () => navigate('/reports/gst') },
              { label: 'File GSTR-3B',         icon: FileText,  onClick: () => navigate('/reports/gst') },
              { label: 'View ITC',             icon: Activity,  onClick: () => navigate('/reports/gst') },
              { label: 'GST Reconciliation',   icon: RefreshCcw,onClick: () => navigate('/reports/gst') },
            ]}
          >
            <div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <p className="text-[10px] text-slate-400 font-medium">GST Payable</p>
                  <p className="text-[15px] font-bold text-red-600">{fmt(gst.payable)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-medium">ITC/Receivable</p>
                  <p className="text-[15px] font-bold text-emerald-600">{fmt(gst.receivable)}</p>
                </div>
              </div>
              {gst.payable === 0 && gst.receivable === 0 ? (
                <p className="text-[11px] text-slate-400 mt-2">No GST ledgers detected</p>
              ) : (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 border border-blue-100 mt-1">
                  <span className="text-[11px] font-semibold text-blue-700">
                    Net: {fmt(Math.abs(gst.net))} {gst.net > 0 ? 'payable' : 'refundable'}
                  </span>
                </div>
              )}
            </div>
          </SummaryCard>
        </div>

        {/* ══ CHARTS ══════════════════════════════════════════════ */}
        <div className={`rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border overflow-hidden ${darkMode ? 'bg-[#2A2A3E] border-slate-700' : 'bg-white border-slate-100'}`}>
          <div className={`flex items-center gap-0 border-b px-6 pt-5 ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
            {[
              { key: 'cashflow', label: 'Cash Flow' },
              { key: 'revexp',   label: 'Revenue vs Expenses' },
              { key: 'aging',    label: 'Receivables Aging' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveChart(tab.key)}
                className={`px-4 py-2 text-[12px] font-bold border-b-2 transition-all mr-1 -mb-px
                  ${activeChart === tab.key
                    ? 'border-[#1A73E8] text-[#1A73E8]'
                    : `border-transparent ${darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'}`}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader size={28} className="text-blue-400 animate-spin" />
              </div>
            ) : (
              <>
                {/* Cash Flow */}
                {activeChart === 'cashflow' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className={`text-[14px] font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>Cash Flow — Last 12 Months</h3>
                      <span className="text-[11px] text-slate-400 font-medium">Based on voucher entries</span>
                    </div>
                    {cashFlow.every(m => m.inflow === 0 && m.outflow === 0) ? (
                      <div className="flex items-center justify-center h-48 text-slate-400 text-[13px]">No transaction data in the last 12 months</div>
                    ) : (
                      <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={cashFlow} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#3f3f5a' : '#f1f5f9'} />
                          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                          <YAxis tickFormatter={fmtK} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                          <Line type="monotone" dataKey="inflow" stroke="#1A73E8" strokeWidth={2.5} dot={{ fill: '#1A73E8', r: 4 }} name="Inflow" />
                          <Line type="monotone" dataKey="outflow" stroke="#ef4444" strokeWidth={2.5} dot={{ fill: '#ef4444', r: 4 }} name="Outflow" strokeDasharray="5 3" />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                )}

                {/* Revenue vs Expenses */}
                {activeChart === 'revexp' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className={`text-[14px] font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>Revenue vs Expenses</h3>
                      <span className="text-[11px] text-slate-400 font-medium">Last 12 months</span>
                    </div>
                    {revenueExp.every(m => m.revenue === 0 && m.expenses === 0) ? (
                      <div className="flex items-center justify-center h-48 text-slate-400 text-[13px]">No data yet</div>
                    ) : (
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={revenueExp} margin={{ top: 5, right: 20, left: 10, bottom: 5 }} barGap={4}>
                          <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#3f3f5a' : '#f1f5f9'} />
                          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                          <YAxis tickFormatter={fmtK} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                          <Bar dataKey="revenue" fill="#1A73E8" radius={[4, 4, 0, 0]} name="Revenue" maxBarSize={32} />
                          <Bar dataKey="expenses" fill="#f97316" radius={[4, 4, 0, 0]} name="Expenses" maxBarSize={32} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                )}

                {/* Receivables Aging */}
                {activeChart === 'aging' && (
                  <div className="flex flex-col md:flex-row gap-8 items-center">
                    <div className="w-full md:w-[260px] shrink-0">
                      <h3 className={`text-[14px] font-bold mb-4 ${darkMode ? 'text-white' : 'text-slate-800'}`}>Receivables Aging</h3>
                      {agingData.every(b => b.amount === 0) ? (
                        <div className="flex items-center justify-center h-40 text-slate-400 text-[13px]">No outstanding receivables</div>
                      ) : (
                        <ResponsiveContainer width="100%" height={220}>
                          <PieChart>
                            <Pie data={agingData} cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={3} dataKey="amount">
                              {agingData.map((entry) => (
                                <Cell key={entry.bucket} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(v, name, props) => [fmt(v), props.payload.bucket]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                    <div className="flex-1 space-y-3">
                      {agingData.map((bucket) => {
                        const pct = (bucket.amount / agingTotal) * 100;
                        return (
                          <div key={bucket.bucket}>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ background: bucket.color }} />
                                <span className={`text-[12.5px] font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{bucket.bucket}</span>
                              </div>
                              <div className="text-right">
                                <span className={`text-[13px] font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{fmt(bucket.amount)}</span>
                                <span className="text-[11px] text-slate-400 ml-2">{pct.toFixed(1)}%</span>
                              </div>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: bucket.color }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ══ TOP LISTS + ACTIVITY ════════════════════════════════ */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
            <TopRankedList title="Top Customers" items={topCustomers} valueKey="revenue"   navigate={navigate} path="/customers" loading={loading} />
            <TopRankedList title="Top Vendors"   items={topVendors}   valueKey="purchases" navigate={navigate} path="/vendors"   loading={loading} />
            <TopRankedList title="Top Products"  items={topProducts}  valueKey="revenue"   navigate={navigate} path="/inventory" loading={loading} />
          </div>

          {/* Recent Activity */}
          <div className={`rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border p-5 ${darkMode ? 'bg-[#2A2A3E] border-slate-700' : 'bg-white border-slate-100'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-[13px] font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>Recent Activity</h3>
              <button onClick={() => navigate('/vouchers')} className="text-[11px] font-semibold text-[#1A73E8] hover:underline flex items-center gap-0.5">
                View All <ChevronRight size={12} />
              </button>
            </div>
            {loading ? (
              <div className="flex items-center justify-center h-40"><Loader size={20} className="text-blue-400 animate-spin" /></div>
            ) : recentActivity.length === 0 ? (
              <p className="text-[12px] text-slate-400 text-center py-8">No activity yet</p>
            ) : (
              <div className="space-y-1 max-h-[480px] overflow-y-auto pr-1">
                {recentActivity.map((act) => {
                  const { Icon, bg, color } = ACT_ICONS[act.type] || ACT_ICONS.voucher;
                  return (
                    <div key={act.id} className={`flex items-start gap-3 p-2.5 rounded-xl transition-colors cursor-default ${darkMode ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'}`}>
                      <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center shrink-0 mt-0.5`}>
                        <Icon size={14} className={color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-1">
                          <p className={`text-[12px] font-bold truncate ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{act.title}</p>
                          <span className="text-[10px] text-slate-400 shrink-0 whitespace-nowrap">{act.time}</span>
                        </div>
                        {act.entity && <p className={`text-[11px] truncate ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{act.entity}</p>}
                        <p className={`text-[11px] truncate ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{act.desc}</p>
                        {act.amount > 0 && (
                          <span className={`text-[12px] font-bold ${act.type === 'payment' ? 'text-emerald-600' : act.type === 'bill' ? 'text-orange-600' : 'text-[#1A73E8]'}`}>
                            {fmt(act.amount)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ══ QUICK ACTIONS ═══════════════════════════════════════ */}
        {canCreate && (
          <div className={`rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border p-5 ${darkMode ? 'bg-[#2A2A3E] border-slate-700' : 'bg-white border-slate-100'}`}>
            <h3 className={`text-[11px] font-bold uppercase tracking-widest mb-4 ${darkMode ? 'text-slate-400' : 'text-slate-400'}`}>Quick Actions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {[
                { label: 'New Invoice',      icon: FileText,       path: '/sales-invoices/new',       color: 'text-blue-600',   bg: 'bg-blue-50'   },
                { label: 'New Bill',         icon: FileStack,      path: '/bills/new',                color: 'text-orange-600', bg: 'bg-orange-50' },
                { label: 'Receive Payment',  icon: ArrowDownRight, path: '/payments/new',             color: 'text-emerald-600',bg: 'bg-emerald-50'},
                { label: 'Make Payment',     icon: ArrowUpRight,   path: '/payments-made/new',        color: 'text-rose-600',   bg: 'bg-rose-50'   },
                { label: 'Bank Recon',       icon: RefreshCcw,     path: '/reconciliation',           color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'GST Report',       icon: Shield,         path: '/reports/gst',              color: 'text-purple-600', bg: 'bg-purple-50' },
                { label: 'Journal Entry',    icon: BookOpen,       path: '/accountant/journals/new',  color: 'text-amber-600',  bg: 'bg-amber-50'  },
                { label: 'P&L Report',       icon: BarChart2,      path: '/reports/pl',               color: 'text-teal-600',   bg: 'bg-teal-50'   },
              ].map(action => (
                <button
                  key={action.label}
                  onClick={() => navigate(action.path)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200 group hover:-translate-y-1 hover:shadow-md
                    ${darkMode ? 'border-slate-600 hover:border-slate-400 hover:bg-slate-700/60' : 'border-slate-100 hover:border-blue-200 hover:bg-blue-50/30'}`}
                >
                  <div className={`w-10 h-10 ${action.bg} ${action.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <action.icon size={18} strokeWidth={1.8} />
                  </div>
                  <span className={`text-[10.5px] font-bold text-center leading-tight ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ══ RECENT VOUCHERS (from backend) ══════════════════════ */}
        {vouchers.length > 0 && (
          <div className={`rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border overflow-hidden ${darkMode ? 'bg-[#2A2A3E] border-slate-700' : 'bg-white border-slate-100'}`}>
            <div className={`px-6 py-4 border-b flex items-center justify-between ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
              <div className="flex items-center gap-2.5">
                <div className="w-1 h-5 bg-[#1A73E8] rounded-full" />
                <h3 className={`text-[13px] font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>Recent Vouchers</h3>
              </div>
              <button onClick={() => navigate('/vouchers')} className="text-[11px] font-semibold text-[#1A73E8] hover:underline flex items-center gap-0.5">
                View All <ChevronRight size={12} />
              </button>
            </div>
            <div className="divide-y divide-slate-50">
              {vouchers.map(v => {
                const amount = (v.Transactions || []).reduce((a, t) => a + (parseFloat(t.debit) || 0), 0);
                const isReceipt = v.voucherType === 'Receipt';
                let desc = v.voucherType;
                try { const n = JSON.parse(v.narration || '{}'); desc = n.notes || n.vendor || n.customer || v.voucherType; } catch {}
                return (
                  <div
                    key={v.id}
                    onClick={() => navigate('/vouchers')}
                    className={`flex items-center justify-between px-6 py-4 cursor-pointer transition-all border-l-2 border-transparent hover:border-blue-500
                      ${darkMode ? 'hover:bg-slate-700/40' : 'hover:bg-slate-50/50'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isReceipt ? 'bg-emerald-50 text-emerald-600' : v.voucherType === 'Payment' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>
                        {isReceipt ? <ArrowDownRight size={15} /> : <ArrowUpRight size={15} />}
                      </div>
                      <div>
                        <p className={`text-[13px] font-bold ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>{desc}</p>
                        <p className="text-[11px] text-slate-400">#{v.voucherNumber} · {v.date ? new Date(v.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-[14px] font-bold ${isReceipt ? 'text-emerald-600' : 'text-slate-800'}`}>{fmt(amount)}</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">{v.voucherType}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Stats footer */}
        {!loading && data && (
          <div className={`rounded-xl border px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4 ${darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-100'}`}>
            {[
              { label: 'Total Vouchers', value: data.voucherCount },
              { label: 'Chart of Accounts', value: data.ledgerCount },
              { label: 'Active Projects', value: data.projectCount },
              { label: 'Bank Accounts', value: bankAccounts.length },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{s.value}</p>
                <p className={`text-[11px] font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* ══ AI ASSISTANT ════════════════════════════════════════ */}
      <AIAssistant role={role} />
    </div>
  );
};

export default DashboardView;
