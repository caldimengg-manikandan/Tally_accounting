import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';

// ── Components ───────────────────────────────────────────────────
import Notification from './components/Notification';
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
import ItemEntryView from './modules/inventory/ItemEntryView';
import PriceListView from './modules/inventory/PriceListView';
import PriceListEntryView from './modules/inventory/PriceListEntryView';
import BankReconciliationView from './modules/reconciliation/BankReconciliationView';
import CostCenterView from './modules/accounting/CostCenterView';
import CustomersView from './modules/sales/CustomersView';
import CustomersListView from './modules/sales/CustomersListView';
import CustomerDetailView from './modules/sales/CustomerDetailView';
import SalesOrdersView from './modules/sales/SalesOrdersView';
import PaymentsReceivedView from './modules/sales/PaymentsReceivedView';
import ProfessionalInvoiceView from './modules/sales/ProfessionalInvoiceView';
import SalesInvoicesView from './modules/sales/SalesInvoicesView';
import QuotesView from './modules/sales/QuotesView';
import RetainerInvoicesView from './modules/sales/RetainerInvoicesView';
import RecurringInvoicesView from './modules/sales/RecurringInvoicesView';
import DeliveryChallansView from './modules/sales/DeliveryChallansView';
import CreditNotesView from './modules/sales/CreditNotesView';
import PayrollView from './modules/payroll/PayrollView';
import VendorsListView from './modules/purchases/VendorsListView';
import VendorsView from './modules/purchases/VendorsView';
import VendorDetailView from './modules/purchases/VendorDetailView';
import BillsView from './modules/purchases/BillsView';
import ExpensesView from './modules/purchases/ExpensesView';
import PurchaseOrdersView from './modules/purchases/PurchaseOrdersView';
import ExpenseEntryView from './modules/purchases/ExpenseEntryView';
import RecurringExpenseEntryView from './modules/purchases/RecurringExpenseEntryView';
import PurchaseOrderEntryView from './modules/purchases/PurchaseOrderEntryView';
import { RecurringExpensesView, RecurringBillsView, PaymentsMadeView, VendorCreditsView } from './modules/purchases/PurchasePlaceholders';

// ── APIs ─────────────────────────────────────────────────────────
import { companyAPI, reportsAPI, voucherAPI } from './services/api';

// ── Icons ─────────────────────────────────────────────────────────
import {
  LayoutDashboard, FileText, BookOpen, BarChart2,
  Package, ArrowLeftRight, Settings, Users, ShoppingBag,
  Receipt, Wallet, TrendingUp, Shield, LogOut,
  Bell, ChevronRight, ChevronDown, ChevronsLeft, ChevronsRight,
  Building2, Activity, ShoppingCart, UserCheck, FileBarChart2,
  PieChart, Landmark, Target, Undo2, Truck, Repeat, ClipboardList, FileStack, Plus
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════
// NAV STRUCTURE
// ═══════════════════════════════════════════════════════════════════
const NAV = [
  {
    group: 'Home',
    icon: LayoutDashboard,
    items: [
      { label: 'Dashboard',        path: '/dashboard' },
    ]
  },
  {
    group: 'Items',
    icon: ShoppingBag,
    items: [
      { label: 'Items',        path: '/inventory', showPlus: true, plusPath: '/inventory/new' },
      { label: 'Price Lists',  path: '/price-lists', showPlus: true, plusPath: '/price-lists/new' },
    ]
  },
  {
    group: 'Sales',
    icon: ShoppingCart,
    items: [
      { icon: Users,           label: 'Customers',        path: '/customers', showPlus: true, plusPath: '/customers/new' },
      { icon: ClipboardList,   label: 'Quotes',           path: '/quotes', showPlus: true, plusPath: '/quotes/new' },
      { icon: FileStack,       label: 'Retainer Invoices', path: '/retainer-invoices', showPlus: true, plusPath: '/retainer-invoices/new' },
      { icon: ShoppingBag,     label: 'Sales Orders',     path: '/sales-orders', showPlus: true, plusPath: '/sales-orders/new' },
      { icon: Receipt, label: 'Invoices', path: '/sales-invoices', showPlus: true, plusPath: '/sales/new-invoice' },
      { icon: Repeat,          label: 'Recurring Invoices', path: '/recurring-invoices', showPlus: true, plusPath: '/recurring-invoices/new' },
      { icon: Truck,           label: 'Delivery Challans', path: '/delivery-challans', showPlus: true, plusPath: '/delivery-challans/new' },
      { icon: Wallet,          label: 'Payments Received', path: '/payments', showPlus: true, plusPath: '/payments/new' },
      { icon: Undo2,           label: 'Credit Notes',      path: '/credit-notes', showPlus: true, plusPath: '/credit-notes/new' },
    ]
  },
  {
    group: 'Purchases',
    icon: ShoppingBag,
    items: [
      { label: 'Vendors',            path: '/vendors', showPlus: true, plusPath: '/vendors/new' },
      { label: 'Expenses',           path: '/expenses', showPlus: true, plusPath: '/expenses/new' },
      { label: 'Recurring Expenses', path: '/recurring-expenses', showPlus: true, plusPath: '/recurring-expenses/new' },
      { label: 'Purchase Orders',    path: '/purchase-orders', showPlus: true, plusPath: '/purchase-orders/new' },
      { label: 'Bills',              path: '/bills', showPlus: true, plusPath: '/bills/new' },
      { label: 'Recurring Bills',    path: '/recurring-bills', showPlus: true, plusPath: '/recurring-bills/new' },
      { label: 'Payments Made',      path: '/payments-made', showPlus: true, plusPath: '/payments-made/new' },
      { label: 'Vendor Credits',     path: '/vendor-credits', showPlus: true, plusPath: '/vendor-credits/new' },
    ]
  },
  {
    group: 'Banking',
    icon: Landmark,
    items: [
      { label: 'Banking',          path: '/reconciliation' },
    ]
  },
  {
    group: 'Accountant',
    icon: BookOpen,
    items: [
      { label: 'Vouchers',         path: '/vouchers' },
      { label: 'Ledgers',          path: '/ledgers' },
      { label: 'Cost Centers',     path: '/cost-centers' },
    ]
  },
  {
    group: 'Reports',
    icon: BarChart2,
    items: [
      { label: 'Trial Balance',    path: '/reports/trial-balance' },
      { label: 'Profit & Loss',    path: '/reports/pl' },
      { label: 'Balance Sheet',    path: '/reports/bs' },
      { label: 'Day Book',         path: '/reports/daybook' },
      { label: 'GST Returns',      path: '/reports/gst' },
    ]
  },
  {
    group: 'APPS',
    icon: UserCheck,
    items: [
      { label: 'Payroll',          path: '/payroll' },
    ]
  },
  {
    group: 'Setup',
    icon: Settings,
    items: [
      { label: 'Company',          path: '/settings/company' },
      { label: 'Audit Trail',      path: '/reports/audit' },
    ]
  },
];

// ═══════════════════════════════════════════════════════════════════
// SIDEBAR GROUP
// ═══════════════════════════════════════════════════════════════════
const NavGroup = ({ group, icon: Icon, items, collapsed, pathname, navigate }) => {
  const [expanded, setExpanded] = useState(pathname.startsWith('/customers') || pathname.startsWith('/quotes') || pathname.startsWith('/sales') || pathname.startsWith('/retainer') || pathname.startsWith('/recurring') || pathname.startsWith('/delivery') || pathname.startsWith('/payments') || pathname.startsWith('/credit') || pathname.startsWith('/inventory') || pathname.startsWith('/price-lists') || pathname.startsWith('/vendors') || pathname.startsWith('/expenses') || pathname.startsWith('/bills') || pathname.startsWith('/purchase-orders') || pathname.startsWith('/payments-made') || pathname.startsWith('/vendor-credits'));

  const isActive = items.some(item => pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path)));

  if (collapsed) {
    return (
      <div className="space-y-1">
        <div className="mx-4 h-px bg-slate-50 mb-3 mt-1"></div>
        {items.map(item => (
          <NavItem
            key={item.path}
            icon={item.icon}
            label={item.label}
            active={pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path))}
            onClick={() => navigate(item.path)}
            collapsed={collapsed}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <button
        onClick={() => setExpanded(!expanded)}
        className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl transition-all duration-300 group
          ${isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
      >
        <div className="flex items-center gap-3 flex-1">
          <div className="transition-transform duration-300 group-hover:scale-110">
            {expanded ? <ChevronDown size={18}/> : <ChevronRight size={18}/>}
          </div>
          {Icon && <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />}
          <span className="text-[13px] font-black tracking-tight">{group}</span>
        </div>
      </button>

      {expanded && (
        <div className="ml-9 space-y-1 mt-1 animate-fade-down">
          {items.map(item => {
            const active = pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path));
            return (
              <div key={item.path} className="group/item flex items-center justify-between px-4 py-2 rounded-xl transition-all duration-200 hover:bg-slate-50">
                <button
                  onClick={() => navigate(item.path)}
                  className={`flex-1 text-left text-[12px] font-medium tracking-tight
                    ${active ? 'text-blue-600 font-bold' : 'text-slate-400 group-hover/item:text-slate-900'}`}
                >
                  {item.label}
                </button>
                {(item.addPath || item.plusPath || item.showPlus) && (
                   <button 
                     onClick={(e) => { e.stopPropagation(); navigate(item.addPath || item.plusPath); }}
                     className="hidden group-hover/item:flex items-center justify-center w-5 h-5 rounded-md bg-blue-500 text-white shrink-0 shadow-sm transition-all hover:bg-blue-600"
                   >
                     <Plus size={12} strokeWidth={3} />
                   </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// SIDEBAR ITEM
// ═══════════════════════════════════════════════════════════════════
const NavItem = ({ icon: Icon, label, active, onClick, onPlusClick, collapsed, showPlus }) => (
  <button
    onClick={onClick}
    data-label={label}
    className={`flex items-center gap-3 w-full transition-all duration-300 group relative
      ${active ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}
      ${collapsed 
        ? 'justify-center h-12 w-12 mx-auto rounded-2xl p-0 nav-tooltip' 
        : 'px-4 py-3 rounded-2xl'}`}
  >
    {Icon && <Icon size={20} strokeWidth={active ? 2.5 : 2} className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`} />}
    {!collapsed && <span className={`text-[13px] font-black tracking-tight ${active ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}>{label}</span>}
    {active && !collapsed && !showPlus && <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white/50 animate-pulse"></div>}
    {showPlus && !collapsed && (
      <div 
        onClick={(e) => { e.stopPropagation(); onPlusClick && onPlusClick(); }}
        className="ml-auto opacity-0 group-hover:opacity-100 transition-all p-1 hover:bg-white/20 rounded-md"
      >
        <Plus size={14} strokeWidth={3} className={active ? 'text-white' : 'group-hover:text-[#1e61f0]'} />
      </div>
    )}
  </button>
);



// ═══════════════════════════════════════════════════════════════════
// APP SHELL
// ═══════════════════════════════════════════════════════════════════
const AppShell = ({ children, onLogout, companies = [], currentCompanyId, onCompanyChange }) => {
  const navigate   = useNavigate();
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const user = useMemo(() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } }, []);

  const sidebarW = collapsed ? 68 : 230;

  // Breadcrumb
  const breadcrumbs = useMemo(() => {
    const parts = pathname.split('/').filter(Boolean);
    const crumbs = [];
    let currentPath = '';

    parts.forEach((p, idx) => {
      currentPath += `/${p}`;
      let label = p.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      if (p.length > 20 || /^[0-9a-fA-F-]{24,36}$/.test(p)) label = 'Details';
      
      crumbs.push({ label, path: currentPath, isLast: idx === parts.length - 1 });
    });

    return crumbs.length > 0 ? crumbs : [{ label: 'Dashboard', path: '/dashboard', isLast: true }];
  }, [pathname]);

  return (
    <div 
      style={{ 
        display: 'flex', 
        height: '100vh', 
        overflow: 'hidden', 
        background: '#f8fafc',
        '--sidebar-width': `${sidebarW}px`
      }}
    >

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
        <nav className={`flex-1 py-6 space-y-6 ${collapsed ? 'px-1 overflow-y-visible' : 'px-4 overflow-y-auto'}`}>
          {NAV.filter(section => {
            // RBAC FILTERING LOGIC
            const role = user.role || 'VIEWER';
            if (role === 'VIEWER') return ['Home', 'Reports'].includes(section.group);
            if (role === 'AUDITOR') return ['Home', 'Reports', 'Setup'].includes(section.group);
            if (role === 'DATA_ENTRY') return ['Home', 'Items', 'Banking', 'Sales', 'Purchases', 'Accountant', 'Payroll'].includes(section.group);
            return true; // ADMIN, MANAGER, ACCOUNTANT see all
          }).map(section => {
            if (section.group !== 'Home' && !collapsed) {
              return (
                <NavGroup
                  key={section.group}
                  group={section.group}
                  icon={section.icon}
                  items={section.items}
                  collapsed={collapsed}
                  pathname={pathname}
                  navigate={navigate}
                />
              );
            }

            return (
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
                        onPlusClick={item.plusPath ? () => navigate(item.plusPath) : null}
                        collapsed={collapsed}
                        showPlus={item.showPlus}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
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
               <select 
                 className="bg-transparent text-[11px] font-black text-slate-900 uppercase tracking-widest outline-none cursor-pointer"
                 value={currentCompanyId}
                 onChange={(e) => {
                   const selected = companies.find(c => c.id === e.target.value);
                   if (selected) onCompanyChange(selected.id, selected.name);
                 }}
               >
                 {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
               </select>
                {breadcrumbs.map((crumb, i) => (
                  <React.Fragment key={crumb.path}>
                    {i > 0 && <ChevronRight size={12} className="text-slate-300" />}
                    <span 
                      onClick={() => navigate(crumb.path)}
                      className={`text-[11px] font-black uppercase tracking-widest cursor-pointer transition-colors ${crumb.isLast ? 'text-[#1e61f0]' : 'text-slate-400 hover:text-slate-900'}`}
                    >
                      {crumb.label}
                    </span>
                  </React.Fragment>
                ))}
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
  const [companies, setCompanies] = useState([]);
  const [companyId, setCompanyId] = useState(localStorage.getItem('companyId'));

  const handleLogout = useCallback(() => {
    ['token', 'companyId', 'companyName', 'user'].forEach(k => localStorage.removeItem(k));
    window.location.reload();
  }, []);

  const handleCompanyChange = (id, name) => {
     localStorage.setItem('companyId', id);
     localStorage.setItem('companyName', name);
     setCompanyId(id);
     window.location.reload();
  };

  useEffect(() => {
    const fetchContext = async () => {
      try {
        const res = await companyAPI.getAll();
        const allCos = res.data || [];
        setCompanies(allCos);
        
        let currentId = companyId;
        
        // Validation: If currentId is set but not in the list, clear it to trigger default
        if (currentId && allCos.length > 0) {
          const exists = allCos.some(c => c.id === currentId);
          if (!exists) {
            console.warn("Current companyId not found in user companies. Resetting...");
            currentId = null;
          }
        }

        if (!currentId && allCos.length > 0) {
          currentId = allCos[0].id;
          localStorage.setItem('companyId', currentId);
          localStorage.setItem('companyName', allCos[0].name);
          setCompanyId(currentId);
          window.location.reload();
          return;
        }

        if (currentId) {
          const activeCo = allCos.find(c => c.id === currentId);
          if (activeCo) localStorage.setItem('companyName', activeCo.name);
          
          Promise.allSettled([
            reportsAPI.dashboard(currentId),
            voucherAPI.getByCompany(currentId),
          ]).then(([s, v]) => {
            if (s.status === 'fulfilled') setStats(s.value.data);
            if (v.status === 'fulfilled') setVouchers(Array.isArray(v.value.data) ? v.value.data.slice(0, 5) : []);
          });
        }
      } catch (err) {
        console.error("Failed to fetch context:", err);
      }
    };

    fetchContext();
  }, [companyId]);

  const shell = (Component, props = {}) => (
    <AppShell onLogout={handleLogout} companies={companies} currentCompanyId={companyId}>
      <Component companyId={companyId} {...props} />
    </AppShell>
  );

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route path="/dashboard" element={
        <AppShell onLogout={handleLogout}>
          <DashboardView companyId={companyId} stats={stats} vouchers={vouchers} />
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
      <Route path="/vouchers/new" element={shell(VoucherEntryView, {
        onSaveSuccess: () => navigate('/vouchers'),
        onCancel: () => navigate('/vouchers')
      })} />
      <Route path="/vouchers/edit/:id" element={shell(VoucherEntryView, {
        onSaveSuccess: () => navigate('/vouchers'),
        onCancel: () => navigate('/vouchers')
      })} />
      <Route path="/ledgers"              element={shell(LedgersView)} />
      <Route path="/ledger-statement/:id" element={shell(LedgerStatementView)} />
      <Route path="/cost-centers"          element={shell(CostCenterView)} />
      
      {/* Purchases */}
      <Route path="/vendors"             element={shell(VendorsListView)} />
      <Route path="/vendors/new"         element={shell(VendorsView)} />
      <Route path="/vendors/view/:id"    element={shell(VendorDetailView)} />
      <Route path="/vendors/:id"         element={shell(VendorsView)} />
      <Route path="/expenses"            element={shell(ExpensesView)} />
      <Route path="/expenses/new"        element={shell(ExpenseEntryView)} />
      <Route path="/recurring-expenses"  element={shell(ExpensesView, { initialTab: 'Recurring Expenses' })} />
      <Route path="/recurring-expenses/new" element={shell(RecurringExpenseEntryView)} />
      <Route path="/bills"               element={shell(BillsView)} />
      <Route path="/recurring-bills"     element={shell(RecurringBillsView)} />
      <Route path="/purchase-orders"     element={shell(PurchaseOrdersView)} />
      <Route path="/purchase-orders/new" element={shell(PurchaseOrderEntryView)} />
      <Route path="/payments-made"       element={shell(PaymentsMadeView)} />
      <Route path="/vendor-credits"      element={shell(VendorCreditsView)} />

      {/* Sales */}
      <Route path="/customers"          element={shell(CustomersListView)} />
      <Route path="/customers/new"      element={shell(CustomersView)} />
      <Route path="/customers/view/:id" element={shell(CustomerDetailView)} />
      <Route path="/customers/:id"      element={shell(CustomersView)} />
      <Route path="/quotes"             element={shell(QuotesView)} />
      <Route path="/quotes/new"         element={shell(QuotesView)} />
      <Route path="/quotes/edit/:id"    element={shell(QuotesView)} />
      <Route path="/quotes/view/:id"    element={shell(QuotesView)} />
      <Route path="/retainer-invoices"  element={shell(RetainerInvoicesView)} />
      <Route path="/retainer-invoices/new" element={shell(RetainerInvoicesView)} />
      <Route path="/retainer-invoices/view/:id" element={shell(RetainerInvoicesView)} />
      <Route path="/retainer-invoices/edit/:id" element={shell(RetainerInvoicesView)} />
      <Route path="/sales-orders"       element={shell(SalesOrdersView)} />
            <Route path="/sales-orders/new"   element={shell(SalesOrdersView)} />
      <Route path="/sales-invoices"     element={shell(SalesInvoicesView)} />
      <Route path="/sales/new-invoice"  element={shell(ProfessionalInvoiceView)} />
      <Route path="/sales/edit-invoice/:id" element={shell(ProfessionalInvoiceView)} />
      <Route path="/recurring-invoices" element={shell(RecurringInvoicesView)} />
      <Route path="/recurring-invoices/new" element={shell(RecurringInvoicesView)} />
      <Route path="/recurring-invoices/edit/:id" element={shell(RecurringInvoicesView)} />
      <Route path="/delivery-challans"  element={shell(DeliveryChallansView)} />
      <Route path="/delivery-challans/new" element={shell(DeliveryChallansView)} />
      <Route path="/payments"           element={shell(PaymentsReceivedView)} />
      <Route path="/payments/new"       element={shell(PaymentsReceivedView)} />
      <Route path="/credit-notes"       element={shell(CreditNotesView)} />
      <Route path="/credit-notes/new"   element={shell(CreditNotesView)} />
      <Route path="/tax-invoices"       element={shell(GSTInvoiceView)} />

      {/* Operations */}
      <Route path="/inventory"          element={shell(InventoryView)} />
      <Route path="/inventory/new"      element={shell(ItemEntryView, {
        onSaveSuccess: () => navigate('/inventory'),
        onCancel: () => navigate('/inventory')
      })} />
      <Route path="/price-lists"        element={shell(PriceListView)} />
      <Route path="/price-lists/new"    element={shell(PriceListEntryView)} />
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
  return (
    <>
      <Notification />
      <AuthenticatedApp />
    </>
  );
}
