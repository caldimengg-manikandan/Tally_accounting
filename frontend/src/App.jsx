import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';

// ── Components ───────────────────────────────────────────────────
import AuthPage from './modules/auth/AuthPage';
import DashboardView from './modules/dashboard/DashboardView';
import LedgersView from './modules/accounting/LedgersView';
import LedgerStatementView from './modules/accounting/LedgerStatementView';
import VoucherListView from './modules/accounting/VoucherListView';
import VoucherEntryView from './modules/accounting/VoucherEntryView';
import PurchaseOrderView from './modules/accounting/PurchaseOrderView';
import GSTInvoiceView from './modules/tax/GSTInvoiceView';
import GSTReturnsView from './modules/tax/GSTReturnsView';
import CompanyInfoView from './modules/company/CompanyInfoView';
import TrialBalanceView from './modules/reports/TrialBalanceView';
import ProfitLossView from './modules/reports/ProfitLossView';
import BalanceSheetView from './modules/reports/BalanceSheetView';
import DaybookView from './modules/reports/DaybookView';
import AuditReportView from './modules/reports/AuditReportView';
import InventoryView from './modules/inventory/InventoryView';
import BankReconciliationView from './modules/reconciliation/BankReconciliationView';
import CostCenterView from './modules/accounting/CostCenterView';
import CustomersView from './modules/sales/CustomersView';
import SalesOrdersView from './modules/sales/SalesOrdersView';
import PaymentsReceivedView from './modules/sales/PaymentsReceivedView';
import ProfessionalInvoiceView from './modules/sales/ProfessionalInvoiceView';
import PayrollView from './modules/payroll/PayrollView';

// ── APIs ─────────────────────────────────────────────────────────
import { companyAPI, reportsAPI, voucherAPI } from './services/api';

// ── Icons ─────────────────────────────────────────────────────────
import {
  LayoutDashboard, FileText, BookOpen, BarChart2,
  Package, ArrowLeftRight, Settings, Users, ShoppingBag,
  Receipt, Wallet, TrendingUp, Shield, LogOut,
  Bell, ChevronRight, ChevronsLeft, ChevronsRight,
  Building2, Activity, ShoppingCart, UserCheck, FileBarChart2,
  PieChart, Landmark, Target
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════
// NAV STRUCTURE
// ═══════════════════════════════════════════════════════════════════
const NAV = [
  {
    group: 'Overview',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard',        path: '/dashboard' },
    ]
  },
  {
    group: 'Accounting',
    items: [
      { icon: FileText,        label: 'Vouchers',         path: '/vouchers' },
      { icon: BookOpen,        label: 'Ledgers',          path: '/ledgers' },
      { icon: Target,          label: 'Cost Centers',     path: '/cost-centers' },
      { icon: ShoppingCart,    label: 'Purchase Orders',  path: '/purchase-orders' },
    ]
  },
  {
    group: 'Sales',
    items: [
      { icon: Users,           label: 'Customers',        path: '/customers' },
      { icon: Receipt,         label: 'Sales Invoices',   path: '/sales/new-invoice' },
      { icon: ShoppingBag,     label: 'Sales Orders',     path: '/sales-orders' },
      { icon: Wallet,          label: 'Payments',         path: '/payments' },
    ]
  },
  {
    group: 'Operations',
    items: [
      { icon: Package,         label: 'Inventory',        path: '/inventory' },
      { icon: ArrowLeftRight,  label: 'Reconciliation',   path: '/reconciliation' },
      { icon: UserCheck,       label: 'Payroll',          path: '/payroll' },
    ]
  },
  {
    group: 'Tax',
    items: [
      { icon: PieChart,        label: 'GST Returns',      path: '/reports/gst' },
    ]
  },
  {
    group: 'Reports',
    items: [
      { icon: BarChart2,       label: 'Trial Balance',    path: '/reports/trial-balance' },
      { icon: TrendingUp,      label: 'Profit & Loss',    path: '/reports/pl' },
      { icon: Shield,          label: 'Balance Sheet',    path: '/reports/bs' },
      { icon: Activity,        label: 'Day Book',         path: '/reports/daybook' },
    ]
  },
  {
    group: 'Setup',
    items: [
      { icon: Settings,        label: 'Company',          path: '/settings/company' },
      { icon: Shield,          label: 'Audit Trail',      path: '/reports/audit' },
    ]
  },
];

// ═══════════════════════════════════════════════════════════════════
// SIDEBAR ITEM
// ═══════════════════════════════════════════════════════════════════
const NavItem = ({ icon: Icon, label, active, onClick, collapsed }) => (
  <button
    onClick={onClick}
    data-label={label}
    className={`flex items-center gap-3 w-full transition-all duration-300 group relative
      ${active ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/10' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}
      ${collapsed 
        ? 'justify-center h-12 w-12 mx-auto rounded-2xl p-0 nav-tooltip' 
        : 'px-4 py-3 rounded-2xl'}`}
  >
    <Icon size={20} strokeWidth={active ? 2.5 : 2} className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`} />
    {!collapsed && <span className="text-[13px] font-black tracking-tight">{label}</span>}
    {active && !collapsed && <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>}
  </button>
);

// ═══════════════════════════════════════════════════════════════════
// APP SHELL
// ═══════════════════════════════════════════════════════════════════
const AppShell = ({ children, onLogout }) => {
  const navigate   = useNavigate();
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const user = useMemo(() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } }, []);

  const sidebarW = collapsed ? 68 : 230;

  // Breadcrumb
  const crumb = useMemo(() => {
    const parts = pathname.split('/').filter(Boolean);
    return parts.map(p => p.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())).join(' › ') || 'Dashboard';
  }, [pathname]);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f8fafc' }}>

      {/* ─── SIDEBAR ─────────────────────────────────────────── */}
      <aside style={{
        width: sidebarW,
        minWidth: sidebarW,
        background: '#fff',
        borderRight: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width .2s ease-in-out',
        position: 'relative',
        zIndex: 50,
      }}>

        <div className={`flex items-center h-20 border-b border-slate-50 overflow-hidden transition-all duration-300 ${collapsed ? 'justify-center' : 'px-8 gap-3'}`}>
          <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center shrink-0 shadow-lg shadow-slate-900/10 border-2 border-slate-50">
            <Building2 size={22} color="#fff" strokeWidth={2.5} />
          </div>
          {!collapsed && (
            <div className="leading-tight animate-fade-in">
              <div className="text-[14px] font-black text-slate-900 tracking-tighter">TALLY REPLICA</div>
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-0.5 whitespace-nowrap">Commercial Hub</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className={`flex-1 overflow-y-auto py-6 space-y-6 ${collapsed ? 'px-1' : 'px-4'}`}>
          {NAV.filter(section => {
            // RBAC FILTERING LOGIC
            const role = user.role || 'VIEWER';
            if (role === 'VIEWER') return ['Overview', 'Reports'].includes(section.group);
            if (role === 'AUDITOR') return ['Overview', 'Reports', 'Setup'].includes(section.group);
            if (role === 'DATA_ENTRY') return ['Overview', 'Accounting', 'Sales', 'Operations'].includes(section.group);
            return true; // ADMIN, MANAGER, ACCOUNTANT see all
          }).map(section => (
            <div key={section.group} className="space-y-1">
              {!collapsed && (
                <div className="px-3 mb-2 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
                  {section.group}
                </div>
              )}
              {collapsed && <div className="mx-4 h-px bg-slate-50 mb-3 mt-1"></div>}
              <div className="space-y-1">
                {section.items.map(item => {
                  const active = pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path));
                  return (
                    <NavItem
                      key={item.path}
                      icon={item.icon}
                      label={item.label}
                      active={active}
                      onClick={() => navigate(item.path)}
                      collapsed={collapsed}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Collapse toggle */}
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={() => setCollapsed(c => !c)}
            className="w-full flex items-center justify-center gap-2 p-2 rounded-md border border-gray-100 bg-gray-50 text-gray-400 hover:text-gray-900 transition-all text-xs font-bold"
          >
            {collapsed ? <ChevronsRight size={15} /> : <><ChevronsLeft size={15} /><span>Collapse</span></>}
          </button>
        </div>

        {/* User card */}
        <div className="p-4 border-t border-slate-50">
          <button
            onClick={onLogout}
            className={`flex items-center gap-3 w-full p-2.5 rounded-2xl border border-slate-50 hover:border-red-100 hover:bg-red-50 transition-all group ${collapsed ? 'justify-center' : ''}`}
          >
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white text-[11px] font-black shrink-0 shadow-lg shadow-slate-900/10">
               {user.email?.substring(0, 1).toUpperCase() || 'A'}
            </div>
            {!collapsed && (
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-[13px] font-black text-slate-900 truncate tracking-tight">{user.email || 'Administrator'}</div>
                  <div className="text-[9px] font-black text-red-500 uppercase tracking-[0.2em] group-hover:text-red-700">Sign Out</div>
                </div>
            )}
          </button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT ────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Top Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-10 relative z-40 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-100">
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Workspace</span>
               <ChevronRight size={12} className="text-slate-300" />
               <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest">{crumb}</span>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-6">
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest border-r border-gray-100 pr-6 mr-1">
               {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
            <div className="flex items-center gap-2">
               <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-100">
                  <Bell size={16} />
               </div>
               <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white text-[10px] font-bold cursor-pointer">
                  {user.email?.substring(0, 1).toUpperCase() || 'A'}
               </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          <div className="animate-fade-up" style={{ animationDuration: '.35s' }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// AUTHENTICATED APP
// ═══════════════════════════════════════════════════════════════════
function AuthenticatedApp() {
  const navigate   = useNavigate();
  const [stats,    setStats]    = useState(null);
  const [vouchers, setVouchers] = useState([]);
  const companyId = useMemo(() => localStorage.getItem('companyId'), []);

  const handleLogout = useCallback(() => {
    ['token', 'companyId', 'user'].forEach(k => localStorage.removeItem(k));
    window.location.reload();
  }, []);

  useEffect(() => {
    const fetchContext = async () => {
      let currentId = companyId;
      if (!currentId) {
        try {
          const res = await companyAPI.getAll();
          if (res.data && res.data.length > 0) {
            currentId = res.data[0].id;
            localStorage.setItem('companyId', currentId);
            // Refreshing the page to ensure all hooks see the new ID
            window.location.reload();
            return;
          }
        } catch (err) {
          console.error("Failed to auto-resolve company:", err);
        }
      }

      if (!currentId) return;

      Promise.allSettled([
        reportsAPI.dashboard(currentId),
        voucherAPI.getByCompany(currentId),
      ]).then(([s, v]) => {
        if (s.status === 'fulfilled') setStats(s.value.data);
        if (v.status === 'fulfilled') setVouchers(Array.isArray(v.value.data) ? v.value.data.slice(0, 5) : []);
      });
    };

    fetchContext();
  }, [companyId]);

  const shell = (Component, props = {}) => (
    <AppShell onLogout={handleLogout}>
      <Component {...props} />
    </AppShell>
  );

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route path="/dashboard" element={
        <AppShell onLogout={handleLogout}>
          <DashboardView stats={stats} vouchers={vouchers} />
        </AppShell>
      } />

      {/* Accounting */}
      <Route path="/vouchers" element={
        <AppShell onLogout={handleLogout}>
          <VoucherListView 
            onCreateNew={() => navigate('/vouchers/new')} 
            onEdit={(v) => navigate(`/vouchers/edit/${v.id}`)}
            onDelete={async (id) => {
              try {
                await voucherAPI.delete(id);
                window.location.reload();
              } catch (err) { alert('Delete failed'); }
            }}
          />
        </AppShell>
      } />
      <Route path="/vouchers/new" element={
        <VoucherEntryView
          onSaveSuccess={() => navigate('/vouchers')}
          onCancel={() => navigate('/vouchers')}
        />
      } />
      <Route path="/vouchers/edit/:id" element={
        <VoucherEntryView
          onSaveSuccess={() => navigate('/vouchers')}
          onCancel={() => navigate('/vouchers')}
        />
      } />
      <Route path="/ledgers"              element={shell(LedgersView)} />
      <Route path="/ledger-statement/:id" element={shell(LedgerStatementView)} />
      <Route path="/cost-centers"          element={shell(CostCenterView)} />
      <Route path="/purchase-orders"      element={shell(PurchaseOrderView)} />

      {/* Sales */}
      <Route path="/customers"          element={shell(CustomersView)} />
      <Route path="/sales/new-invoice"  element={shell(ProfessionalInvoiceView)} />
      <Route path="/sales-orders"       element={shell(SalesOrdersView)} />
      <Route path="/tax-invoices"       element={shell(GSTInvoiceView)} />
      <Route path="/payments"           element={shell(PaymentsReceivedView)} />

      {/* Operations */}
      <Route path="/inventory"          element={shell(InventoryView)} />
      <Route path="/reconciliation"     element={shell(BankReconciliationView)} />
      <Route path="/payroll"            element={shell(PayrollView)} />

      {/* Tax */}
      <Route path="/reports/gst"           element={shell(GSTReturnsView)} />

      {/* Reports */}
      <Route path="/reports/trial-balance" element={shell(TrialBalanceView)} />
      <Route path="/reports/pl"            element={shell(ProfitLossView)} />
      <Route path="/reports/bs"            element={shell(BalanceSheetView)} />
      <Route path="/reports/daybook"       element={shell(DaybookView)} />
      <Route path="/reports/audit"         element={shell(AuditReportView)} />

      {/* Settings */}
      <Route path="/settings/company"   element={shell(CompanyInfoView, { setActiveTab: () => {} })} />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ROOT
// ═══════════════════════════════════════════════════════════════════
export default function App() {
  const [authed, setAuthed] = useState(!!localStorage.getItem('token'));

  if (!authed) {
    return (
      <AuthPage
        onLogin={() => setAuthed(true)}
        onAuthSuccess={() => setAuthed(true)}
      />
    );
  }
  return <AuthenticatedApp />;
}
