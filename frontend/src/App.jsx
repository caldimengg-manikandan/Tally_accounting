import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';

// ── Components ───────────────────────────────────────────────────
import Notification from './components/Notification';
import AuthPage from './modules/auth/AuthPage';
import LandingPage from './modules/landing/LandingPage';
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
import InventoryMastersView from './modules/inventory/InventoryMastersView';
import PriceListView from './modules/inventory/PriceListView';
import PriceListEntryView from './modules/inventory/PriceListEntryView';
import BankingView from './modules/banking/BankingView';
import BankEntryView from './modules/banking/BankEntryView';
import BankDetailView from './modules/banking/BankDetailView';
import BankReconciliationView from './modules/reconciliation/BankReconciliationView';
import CostCenterView from './modules/accounting/CostCenterView';
import CustomersView from './modules/sales/CustomersView';
import CustomersListView from './modules/sales/CustomersListView';
import CustomerDetailView from './modules/sales/CustomerDetailView';
import CustomerOutstandingView from './modules/sales/CustomerOutstandingView';
import SalesOrdersView from './modules/sales/SalesOrdersView';
import PaymentsReceivedView from './modules/sales/PaymentsReceivedView';
import ProfessionalInvoiceView from './modules/sales/ProfessionalInvoiceView';
import SalesInvoicesView from './modules/sales/SalesInvoicesView';
import QuotesView from './modules/sales/QuotesView';
import RecurringInvoicesView from './modules/sales/RecurringInvoicesView';
import DeliveryChallansView from './modules/sales/DeliveryChallansView';
import PayrollView from './modules/payroll/PayrollView';
import CashFlowView from './modules/reports/CashFlowView';
import ReceivablesReportView from './modules/reports/ReceivablesReportView';
import PayablesReportView from './modules/reports/PayablesReportView';
import InventoryReportView from './modules/reports/InventoryReportView';
import PayrollSummaryReportView from './modules/reports/PayrollSummaryReportView';
import AIAssistantView from './modules/dashboard/AIAssistantView';
import VendorsListView from './modules/purchases/VendorsListView';
import VendorsView from './modules/purchases/VendorsView';
import VendorDetailView from './modules/purchases/VendorDetailView';
import VendorOutstandingView from './modules/purchases/VendorOutstandingView';
import BillsView from './modules/purchases/BillsView';
import ExpensesView from './modules/purchases/ExpensesView';
import RecurringExpensesView from './modules/purchases/RecurringExpensesView';
import PurchaseOrdersView from './modules/purchases/PurchaseOrdersView';
import ExpenseEntryView from './modules/purchases/ExpenseEntryView';
import RecurringExpenseEntryView from './modules/purchases/RecurringExpenseEntryView';
import PurchaseOrderEntryView from './modules/purchases/PurchaseOrderEntryView';
import PurchaseOrderEmailView from './modules/purchases/PurchaseOrderEmailView';
import BillEntryView from './modules/purchases/BillEntryView';
import RecurringBillEntryView from './modules/purchases/RecurringBillEntryView';
import RecurringBillsView from './modules/purchases/RecurringBillsView';
import PaymentsMadeListView from './modules/purchases/PaymentsMadeListView';
import PaymentsMadeEntryView from './modules/purchases/PaymentsMadeEntryView';
import BudgetsView from './modules/accountant/BudgetsView';
import { TransactionLockingView } from './modules/accountant/AccountantSubModules';
import ChartOfAccountsView from './modules/accounting/ChartOfAccountsView';
import JournalEntriesView from './modules/accounting/JournalEntriesView';
import FixedAssetsView from './modules/fixed_assets/FixedAssetsView';
import ProjectsView from './modules/time_tracking/ProjectsView';

import BulkUpdateView from './modules/accountant/BulkUpdateView';
import CurrencyAdjustmentsView from './modules/accountant/CurrencyAdjustmentsView';
import ManualJournalEntryView from './modules/accountant/ManualJournalEntryView';
import ManualJournalsListView from './modules/accountant/ManualJournalsListView';

// ── APIs ─────────────────────────────────────────────────────────
import { companyAPI, reportsAPI, voucherAPI } from './services/api';

// ── Icons ─────────────────────────────────────────────────────────
import {
  LayoutDashboard, FileText, BookOpen, BarChart2, Folder,
  Package, ArrowLeftRight, Settings, Users, ShoppingBag,
  Receipt, Wallet, TrendingUp, Shield, LogOut,
  Bell, ChevronRight, ChevronDown, ChevronsLeft, ChevronsRight,
  Building2, Activity, ShoppingCart, UserCheck, FileBarChart2,
  PieChart, Landmark, Target, Clock, Undo2, Truck, Repeat, ClipboardList, FileStack, Plus,
  RefreshCw, PanelLeftClose, PanelLeftOpen, MessageSquare, Sliders
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════
// NAV STRUCTURE
// ═══════════════════════════════════════════════════════════════════
const NAV = [
  {
    group: 'Home',
    icon: LayoutDashboard,
    items: [
      { label: 'Dashboard',        path: '/dashboard', icon: LayoutDashboard },
    ]
  },
  {
    group: 'Setup',
    icon: Settings,
    items: [
      { label: 'Company Settings', path: '/settings/company', icon: Building2 }
    ]
  },
  {
    group: 'Items',
    icon: Package,
    items: [
      { label: 'Items',             path: '/inventory', icon: Package, showPlus: true, plusPath: '/inventory/new' },
    ]
  },
  {
    group: 'Sales',
    icon: ShoppingCart,
    items: [
      { icon: Users,           label: 'Customers',           path: '/customers', showPlus: true, plusPath: '/customers/new' },
      { icon: FileText,        label: 'Quotations',          path: '/quotes', showPlus: true, plusPath: '/quotes/new' },
      { icon: ShoppingBag,     label: 'Sales Orders',        path: '/sales-orders', showPlus: true, plusPath: '/sales-orders/new' },
      { icon: Receipt,         label: 'Invoices',            path: '/sales-invoices', showPlus: true, plusPath: '/sales-invoices/new' },
      { icon: Repeat,          label: 'Recurring Invoices',  path: '/recurring-invoices', showPlus: true, plusPath: '/recurring-invoices/new' },
      { icon: Wallet,          label: 'Customer Payments',   path: '/payments', showPlus: true, plusPath: '/payments/new' },
    ]
  },
  {
    group: 'Purchases',
    icon: ShoppingBag,
    items: [
      { label: 'Vendors',            path: '/vendors', icon: Users, showPlus: true, plusPath: '/vendors/new' },
      { label: 'Purchase Orders',    path: '/purchase-orders', icon: ShoppingBag, showPlus: true, plusPath: '/purchase-orders/new' },
      { label: 'Bills',              path: '/bills', icon: FileStack, showPlus: true, plusPath: '/bills/new' },
      { label: 'Recurring Bills',    path: '/recurring-bills', icon: Repeat, showPlus: true, plusPath: '/recurring-bills/new' },
      { label: 'Vendor Payments',    path: '/payments-made', icon: Wallet, showPlus: true, plusPath: '/payments-made/new' },
    ]
  },
  {
    group: 'Banking',
    icon: Landmark,
    items: [
      { label: 'Banking Overview', path: '/banking', icon: Landmark, showPlus: true, plusPath: '/banking/new' },
      { label: 'Reconciliation',   path: '/reconciliation', icon: RefreshCw },
    ]
  },
  {
    group: 'Accounting',
    icon: BookOpen,
    items: [
      { label: 'Chart of Accounts', path: '/ledgers/chart-of-accounts', icon: BookOpen },
      { label: 'Ledgers',           path: '/ledgers', icon: Folder },
      { label: 'Vouchers',          path: '/vouchers', icon: FileText, showPlus: true, plusPath: '/vouchers/new' },
    ]
  },
  {
    group: 'Accountant Tools',
    icon: Settings,
    items: [
      { label: 'Cost Centers',      path: '/cost-centers', icon: Folder },
      { label: 'Budgets',           path: '/accountant/budgets', icon: Target },
      { label: 'Fixed Assets',      path: '/fixed-assets', icon: Building2 }
    ]
  },
  {
    group: 'Payroll',
    icon: Users,
    items: [
      { label: 'Payroll',           path: '/payroll', icon: Users }
    ]
  },
  {
    group: 'Reports',
    icon: BarChart2,
    items: [
      { label: 'Profit & Loss',      path: '/reports/pl', icon: PieChart },
      { label: 'Balance Sheet',      path: '/reports/bs', icon: FileBarChart2 },
      { label: 'Trial Balance',      path: '/reports/trial-balance', icon: BarChart2 },
      { label: 'Cash Flow',          path: '/reports/cash-flow', icon: TrendingUp },
      { label: 'Inventory Report',   path: '/reports/inventory-report', icon: Package },
    ]
  },
  {
    group: 'AI Assistant',
    icon: MessageSquare,
    items: [
      { label: 'AI Assistant',     path: '/ai-assistant', icon: MessageSquare }
    ]
  }
];

// Helper to compute active paths, accounting for nested routing and context highlights
// Collect all nav item paths so we can detect conflicts
const ALL_NAV_PATHS = NAV.flatMap(s => s.items.map(i => i.path));

const isPathActive = (itemPath, pathname, location) => {
  const queryParams = new URLSearchParams(location?.search || '');
  const backTo = location?.state?.backTo || queryParams.get('backTo') || '';

  if (itemPath === '/vendors' && (pathname.startsWith('/vendors') || (pathname.startsWith('/bill-payments') && backTo === 'vendors'))) {
    return true;
  }
  if (itemPath === '/payments-made' && (pathname.startsWith('/payments-made') || (pathname.startsWith('/bill-payments') && backTo !== 'vendors'))) {
    return true;
  }

  // Exact match always wins
  if (pathname === itemPath) return true;

  // Skip dashboard — it should never be a prefix match
  if (itemPath === '/dashboard') return false;

  // Check if pathname starts with itemPath + '/'
  if (!pathname.startsWith(itemPath + '/')) return false;

  // Prevent false positives: if a MORE specific nav item also starts with itemPath,
  // only highlight the most specific one that actually matches the current pathname.
  const moreSpecificMatch = ALL_NAV_PATHS.some(
    otherPath => otherPath !== itemPath &&
                 otherPath.startsWith(itemPath + '/') &&
                 (pathname === otherPath || pathname.startsWith(otherPath + '/'))
  );

  return !moreSpecificMatch;
};

// ═══════════════════════════════════════════════════════════════════
// SIDEBAR GROUP
// ═══════════════════════════════════════════════════════════════════
const NavGroup = ({ group, icon: Icon, items, collapsed, pathname, location, navigate }) => {
  const [expanded, setExpanded] = useState(
    pathname.includes(group.toLowerCase().replace(' ', '-')) ||
    items.some(it => isPathActive(it.path, pathname, location))
  );

  const isActive = items.some(item => isPathActive(item.path, pathname, location));

  useEffect(() => {
    if (isActive) {
      setExpanded(true);
    }
  }, [isActive]);

  const [isHovered, setIsHovered] = useState(false);

  if (collapsed) {
    return (
      <div 
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <NavItem
          icon={Icon}
          label={group}
          active={isActive}
          onClick={() => navigate(items[0]?.path || '/')}
          collapsed={collapsed}
          hasChildren={items.length > 0}
        />

        {/* HOVER FLYOUT MENU */}
        {isHovered && items.length > 0 && (
          <div 
            className="absolute left-[84px] top-0 w-[240px] bg-white rounded-r-2xl shadow-[10px_0_30px_rgba(0,0,0,0.12)] border-y border-r border-slate-100 py-6 px-4 z-[100] animate-fade-in-right"
            style={{ minHeight: '100%' }}
          >
            <div className="text-[11px] font-bold text-blue-600 uppercase tracking-[0.2em] mb-4 pl-2">
              {group}
            </div>
            <div className="space-y-1">
              {items.map(item => {
                const active = isPathActive(item.path, pathname, location);
                const SubIcon = item.icon;
                return (
                  <div 
                    key={item.path} 
                    className={`group/sub flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer
                      ${active ? 'bg-blue-50/70 text-blue-600' : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900'}`}
                    onClick={() => { navigate(item.path); setIsHovered(false); }}
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      {SubIcon && <SubIcon size={14} className={`shrink-0 ${active ? 'text-blue-600' : 'text-slate-400 group-hover/sub:text-slate-700'}`} />}
                      <span className={`text-[13px] font-bold tracking-tight truncate ${active ? 'text-blue-600' : ''}`}>
                        {item.label}
                      </span>
                    </div>
                    {item.showPlus && (
                       <button 
                         onClick={(e) => { e.stopPropagation(); navigate(item.plusPath); setIsHovered(false); }}
                         className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-600 shrink-0 shadow-sm transition-all hover:bg-blue-600 hover:text-white"
                       >
                         <Plus size={14} strokeWidth={3} />
                       </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // EXPANDED VIEW
  if (items.length <= 1) {
    return items.map(item => (
      <NavItem
        key={item.path}
        icon={item.icon}
        label={item.label}
        active={isPathActive(item.path, pathname, location)}
        onClick={() => navigate(item.path)}
        collapsed={collapsed}
      />
    ));
  }

  return (
    <div className="space-y-0.5">
      {!collapsed && (
        <button
          onClick={() => setExpanded(!expanded)}
          title={`${group} Group`}
          className={`flex items-center gap-3 w-full px-4 py-2.5 transition-all duration-300 group
            ${isActive ? 'text-slate-900 font-bold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
        >
          <div className="flex items-center gap-2.5 flex-1">
            <div className={`transition-transform duration-300 ${expanded ? 'rotate-0' : '-rotate-90'}`}>
              <ChevronDown size={14} className="text-slate-400" />
            </div>
            <span className={`text-[11px] font-bold text-slate-800 uppercase tracking-[0.2em]`}>{group}</span>
          </div>
        </button>
      )}

      {expanded && (
        <div className="ml-8 space-y-0.5 mt-0.5">
          {items.map(item => {
            const active = isPathActive(item.path, pathname, location);
            const SubIcon = item.icon;
            return (
              <div 
                key={item.path} 
                className={`group/item flex items-center justify-between px-4 py-1.5 rounded-l-full transition-all duration-200 
                  ${active ? 'bg-blue-50/70 text-blue-600 border-r-4 border-blue-600 font-bold' : 'hover:bg-slate-50/60 text-slate-800 hover:text-slate-900'}`}
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0" onClick={() => navigate(item.path)}>
                  {SubIcon && <SubIcon size={14} className={`shrink-0 ${active ? 'text-blue-600' : 'text-slate-400 group-hover/item:text-slate-700'}`} />}
                  <button
                    title={item.label}
                    className={`text-left text-[12px] font-medium tracking-tight truncate
                      ${active ? 'text-blue-600 font-bold' : 'text-slate-800 group-hover/item:text-slate-900'}`}
                  >
                    {item.label}
                  </button>
                </div>
                {(item.showPlus) && (
                   <button 
                     onClick={(e) => { e.stopPropagation(); navigate(item.plusPath); }}
                     title={`Add New ${item.label}`}
                     className={`items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white shrink-0 shadow-sm transition-all hover:bg-blue-700 ${active ? 'flex' : 'hidden group-hover/item:flex'}`}
                   >
                     <Plus size={14} strokeWidth={3} />
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
const NavItem = ({ icon: Icon, label, active, onClick, onPlusClick, collapsed, showPlus, hasChildren }) => (
  <button
    onClick={onClick}
    data-label={label}
    title={collapsed ? label : ''}
    className={`flex transition-all duration-200 group relative
      ${collapsed 
        ? `flex-col items-center justify-center h-[72px] w-full gap-1.5 border-b border-slate-50/50
           ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/10' : 'text-slate-500 hover:bg-slate-50/60 hover:text-slate-900'}`
        : `items-center gap-3 w-full px-6 py-2.5
           ${active ? 'bg-blue-50/70 text-blue-600 border-l-4 border-blue-600 font-bold shadow-sm shadow-blue-500/5' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50/60'}`}`}
  >
    {Icon && <Icon size={collapsed ? 22 : 18} strokeWidth={active ? 2.5 : 2} className={`transition-transform duration-300 ${active ? (collapsed ? 'text-white' : 'text-blue-600') : 'text-slate-400 group-hover:text-slate-900'}`} />}
    
    {collapsed ? (
      <>
        <span className={`text-[10px] font-bold leading-none text-center truncate w-full px-1 uppercase tracking-tighter ${active ? 'text-white' : 'text-slate-800'}`}>
          {label.length > 8 ? label.substring(0, 7) + '..' : label}
        </span>
        {hasChildren && (
          <div className="absolute bottom-1 right-1 w-0 h-0 border-l-[6px] border-l-transparent border-b-[6px] border-b-slate-300"></div>
        )}
      </>
    ) : (
      <span className={`text-[13px] font-bold tracking-tight ${active ? 'text-blue-600' : 'text-slate-900 group-hover:text-slate-900'}`}>{label}</span>
    )}

    {showPlus && !collapsed && (
      <button 
        onClick={(e) => { e.stopPropagation(); onPlusClick && onPlusClick(); }}
        title={`Add New ${label}`}
        className="ml-auto opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white shadow-sm hover:bg-blue-700"
      >
        <Plus size={14} strokeWidth={3} />
      </button>
    )}
  </button>
);



// ═══════════════════════════════════════════════════════════════════
// APP SHELL
// ═══════════════════════════════════════════════════════════════════
const AppShell = ({ children, onLogout, companies = [], currentCompanyId, onCompanyChange, stats }) => {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { pathname } = location;
  const [collapsed, setCollapsed] = useState(false);
  const user = useMemo(() => { try { return JSON.parse(sessionStorage.getItem('user') || '{}'); } catch { return {}; } }, []);

  const sidebarW = collapsed ? 84 : 230;

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
      <aside className="no-print bg-white/85 backdrop-blur-md border-r border-slate-100" style={{
        width: sidebarW,
        minWidth: sidebarW,
        display: 'flex',
        flexDirection: 'column',
        transition: 'width .2s ease-in-out',
        position: 'relative',
        zIndex: 60,
      }}>

        <div className={`flex items-center h-20 border-b border-slate-50 overflow-hidden transition-all duration-300 ${collapsed ? 'justify-center' : 'px-8 gap-3'}`}>
          <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center shrink-0 shadow-lg shadow-slate-900/10 border-2 border-slate-50">
            <Building2 size={22} color="#fff" strokeWidth={2.5} />
          </div>
          {!collapsed && (
            <div className="flex flex-col items-start leading-[1.1] animate-fade-in">
              <div className="text-[15px] font-black text-slate-900 tracking-tight uppercase">CalTally</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className={`flex-1 space-y-0 ${collapsed ? 'px-0 overflow-y-visible py-0' : 'px-0 overflow-y-auto py-6'}`}>
          {NAV.filter(section => {
            // RBAC FILTERING LOGIC
            const role = user.role || 'VIEWER';
            if (role === 'VIEWER') return ['Home', 'Reports'].includes(section.group);
            if (role === 'AUDITOR') return ['Home', 'Reports', 'Setup'].includes(section.group);
            if (role === 'DATA_ENTRY') return ['Home', 'Items', 'Banking', 'Sales', 'Purchases', 'Accounting', 'Operations', 'Payroll'].includes(section.group);
            if (role === 'EMPLOYEE') return ['Home', 'Items', 'Sales', 'Purchases', 'Banking', 'Accounting', 'Reports'].includes(section.group);
            return true; // ADMIN, SUPER_ADMIN, ACCOUNTANT, MANAGER see all
          }).map(section => (
            <NavGroup
              key={section.group}
              group={section.group}
              icon={section.icon}
              items={section.items}
              collapsed={collapsed}
              pathname={pathname}
              location={location}
              navigate={navigate}
            />
          ))}
        </nav>

        {/* Collapse toggle - Floating Transparent version */}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          className={`absolute -right-3 bottom-24 w-6 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-300 transition-all shadow-sm z-[60] cursor-pointer
            ${collapsed ? 'rotate-180' : ''}`}
        >
          <PanelLeftClose size={14} strokeWidth={3} />
        </button>

        {/* User card */}
        <div className="p-4 border-t border-slate-50">
          <button
            onClick={onLogout}
            className={`flex items-center gap-3 w-full p-2.5 rounded-2xl border border-slate-50 hover:border-red-100 hover:bg-red-50 transition-all group ${collapsed ? 'justify-center' : ''}`}
          >
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white text-[11px] font-bold shrink-0 shadow-lg shadow-slate-900/10">
               {user.email?.substring(0, 1).toUpperCase() || 'A'}
            </div>
            {!collapsed && (
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-[13px] font-bold text-slate-900 truncate tracking-tight">{user.email || 'Administrator'}</div>
                  <div className="text-[9px] font-bold text-red-500 uppercase tracking-[0.2em] group-hover:text-red-700">Sign Out</div>
                </div>
            )}
          </button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT ────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Top Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-10 relative z-[60] shrink-0 no-print">
          <div className="flex items-center gap-4">
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
        <main className="bg-[#f8fafc]" style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
          <div className="animate-in fade-in duration-500">
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
  const [companyId, setCompanyId] = useState(sessionStorage.getItem('companyId'));

  const handleLogout = useCallback(() => {
    ['token', 'companyId', 'companyName', 'user'].forEach(k => sessionStorage.removeItem(k));
    window.location.reload();
  }, []);

  const handleCompanyChange = (id, name) => {
     sessionStorage.setItem('companyId', id);
     sessionStorage.setItem('companyName', name);
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
          sessionStorage.setItem('companyId', currentId);
          sessionStorage.setItem('companyName', allCos[0].name);
          setCompanyId(currentId);
          window.location.reload();
          return;
        }

        if (allCos.length === 0) {
          navigate('/setup-company');
          return;
        }

        if (currentId) {
          const activeCo = allCos.find(c => c.id === currentId);
          if (activeCo) sessionStorage.setItem('companyName', activeCo.name);
          
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
    <AppShell onLogout={handleLogout} companies={companies} currentCompanyId={companyId} onCompanyChange={handleCompanyChange} stats={stats}>
      <Component companyId={companyId} {...props} />
    </AppShell>
  );

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route path="/setup-company" element={
        <CompanyInfoView firstTime={true} onCompanyCreated={(id, name) => {
          sessionStorage.setItem('companyId', id);
          sessionStorage.setItem('companyName', name);
          setCompanyId(id);
          navigate('/dashboard');
          window.location.reload();
        }} />
      } />

      <Route path="/dashboard" element={
        <AppShell onLogout={handleLogout} companies={companies} currentCompanyId={companyId} onCompanyChange={handleCompanyChange} stats={stats}>
          <DashboardView companyId={companyId} stats={stats} vouchers={vouchers} />
        </AppShell>
      } />

      {/* Accounting */}
      <Route path="/vouchers" element={
        <AppShell onLogout={handleLogout} companies={companies} currentCompanyId={companyId} onCompanyChange={handleCompanyChange} stats={stats}>
          <VoucherListView 
            onCreateNew={() => navigate('/vouchers/new')} 
            onEdit={(v) => navigate(`/vouchers/edit/${v.id}`)}
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
      {/* Typed voucher list pages */}
      <Route path="/vouchers/payment"    element={shell(VoucherListView, { defaultType: 'Payment',   title: 'Payment Vouchers',   subtitle: 'Money Out', buttonText: 'New Payment', hideTabs: true, onCreateNew: () => navigate('/vouchers/new?type=Payment'), onEdit: (v) => navigate(`/vouchers/edit/${v.id}`) })} />
      <Route path="/vouchers/receipt"    element={shell(VoucherListView, { defaultType: 'Receipt',   title: 'Receipt Vouchers',   subtitle: 'Money In',  buttonText: 'New Receipt', hideTabs: true, onCreateNew: () => navigate('/vouchers/new?type=Receipt'), onEdit: (v) => navigate(`/vouchers/edit/${v.id}`) })} />
      <Route path="/vouchers/journal"    element={shell(VoucherListView, { defaultType: 'Journal',   title: 'Journal Vouchers',   subtitle: 'Adjustments', buttonText: 'New Journal', hideTabs: true, onCreateNew: () => navigate('/vouchers/new?type=Journal'), onEdit: (v) => navigate(`/vouchers/edit/${v.id}`) })} />
      <Route path="/vouchers/contra"     element={shell(VoucherListView, { defaultType: 'Contra',    title: 'Contra Vouchers',    subtitle: 'Fund Transfers', buttonText: 'New Contra', hideTabs: true, onCreateNew: () => navigate('/vouchers/new?type=Contra'), onEdit: (v) => navigate(`/vouchers/edit/${v.id}`) })} />
      <Route path="/vouchers/debit-note"  element={shell(VoucherListView, { defaultType: 'Debit Note', title: 'Debit Notes',       subtitle: 'Vendor Returns', buttonText: 'New Debit Note', hideTabs: true, onCreateNew: () => navigate('/vouchers/new?type=Debit Note'), onEdit: (v) => navigate(`/vouchers/edit/${v.id}`) })} />
      <Route path="/vouchers/credit-note" element={shell(VoucherListView, { defaultType: 'Credit Note', title: 'Credit Notes (Acct)', subtitle: 'Customer Returns', buttonText: 'New Credit Note', hideTabs: true, onCreateNew: () => navigate('/vouchers/new?type=Credit Note'), onEdit: (v) => navigate(`/vouchers/edit/${v.id}`) })} />
      <Route path="/journal-entries"     element={shell(JournalEntriesView)} />
      <Route path="/accountant/journals" element={
        <AppShell onLogout={handleLogout} companies={companies} currentCompanyId={companyId} onCompanyChange={handleCompanyChange} stats={stats}>
          <ManualJournalsListView companyId={companyId} />
        </AppShell>
      } />
      {/* IMPORTANT: /new and /edit/:id must come BEFORE /:id so React Router doesn't treat "new" as a journal ID */}
      <Route path="/accountant/journals/new" element={shell(ManualJournalEntryView, {
        onSaveSuccess: (savedId) => navigate(savedId ? `/accountant/journals/${savedId}` : '/accountant/journals'),
        onCancel: () => navigate('/accountant/journals')
      })} />
      <Route path="/accountant/journals/edit/:id" element={shell(ManualJournalEntryView, {
        onSaveSuccess: (savedId) => navigate(savedId ? `/accountant/journals/${savedId}` : '/accountant/journals'),
        onCancel: () => navigate('/accountant/journals')
      })} />
      <Route path="/accountant/journals/:id" element={
        <AppShell onLogout={handleLogout} companies={companies} currentCompanyId={companyId} onCompanyChange={handleCompanyChange} stats={stats}>
          <ManualJournalsListView companyId={companyId} />
        </AppShell>
      } />
      <Route path="/ledgers"              element={shell(LedgersView)} />
      <Route path="/ledgers/new"          element={shell(LedgersView, { showNew: true })} />
      <Route path="/ledgers/chart-of-accounts" element={shell(ChartOfAccountsView)} />
      <Route path="/ledger-statement/:id" element={shell(LedgerStatementView)} />
      <Route path="/cost-centers"          element={shell(CostCenterView)} />
      <Route path="/cost-centers/new"      element={shell(CostCenterView, { showNew: true })} />
      
      {/* Accountant Expanded */}
      <Route path="/accountant/bulk-update"          element={shell(BulkUpdateView)} />
      <Route path="/accountant/bulk-update/new"      element={shell(BulkUpdateView, { showNew: true })} />
      <Route path="/accountant/currency-adjustments" element={shell(CurrencyAdjustmentsView)} />
      <Route path="/accountant/currency-adjustments/new" element={shell(CurrencyAdjustmentsView, { showNew: true })} />
      <Route path="/accountant/budgets"             element={shell(BudgetsView)} />
      <Route path="/accountant/budgets/new"         element={shell(BudgetsView, { showNew: true })} />
      <Route path="/accountant/locking"             element={shell(TransactionLockingView)} />
      <Route path="/accountant/locking/new"         element={shell(TransactionLockingView, { showNew: true })} />
      
      {/* Purchases */}
      <Route path="/vendors"             element={shell(VendorsListView)} />
      <Route path="/vendors/new"         element={shell(VendorsView)} />
      <Route path="/vendors/view/:id"    element={shell(VendorDetailView)} />
      <Route path="/vendors/:id"         element={shell(VendorsView)} />
      <Route path="/expenses"            element={shell(ExpensesView)} />
      <Route path="/expenses/new"        element={shell(ExpenseEntryView)} />
      <Route path="/recurring-expenses" element={shell(RecurringExpensesView)} />
      <Route path="/recurring-expenses/new" element={shell(RecurringExpenseEntryView)} />
      <Route path="/recurring-expenses/edit/:id" element={shell(RecurringExpenseEntryView)} />
      <Route path="/bills"               element={shell(BillsView)} />
      <Route path="/bills/new"           element={shell(BillEntryView)} />
      <Route path="/bills/edit/:id"      element={shell(BillEntryView)} />
      <Route path="/recurring-bills"     element={shell(RecurringBillsView)} />
      <Route path="/recurring-bills/new" element={shell(RecurringBillEntryView)} />
      <Route path="/purchase-orders"     element={shell(PurchaseOrdersView)} />
      <Route path="/purchase-orders/view/:id" element={shell(PurchaseOrdersView)} />
      <Route path="/purchase-orders/:id/email" element={shell(PurchaseOrderEmailView)} />
      <Route path="/purchase-orders/new" element={shell(PurchaseOrderEntryView)} />
      <Route path="/purchase-orders/edit/:id" element={shell(PurchaseOrderEntryView)} />
      <Route path="/payments-made"       element={shell(PaymentsMadeListView)} />
      <Route path="/payments-made/new"   element={shell(PaymentsMadeEntryView)} />
      <Route path="/bill-payments/new"   element={shell(PaymentsMadeEntryView)} />
      <Route path="/payments-made/edit/:id" element={shell(PaymentsMadeEntryView)} />

      {/* Sales */}
      <Route path="/customers"          element={shell(CustomersListView)} />
      <Route path="/customers/new"      element={shell(CustomersView)} />
      <Route path="/customers/view/:id" element={shell(CustomerDetailView)} />
      <Route path="/customers/:id"      element={shell(CustomersView)} />
      <Route path="/quotes"             element={shell(QuotesView)} />
      <Route path="/quotes/new"         element={shell(QuotesView)} />
      <Route path="/quotes/edit/:id"    element={shell(QuotesView)} />
      <Route path="/quotes/view/:id"    element={shell(QuotesView)} />
      <Route path="/sales-orders"       element={shell(SalesOrdersView)} />
            <Route path="/sales-orders/new"   element={shell(SalesOrdersView)} />
      <Route path="/sales-invoices"     element={shell(SalesInvoicesView)} />
      <Route path="/sales-invoices/:id" element={shell(SalesInvoicesView)} />
      <Route path="/sales-invoices/new"  element={shell(ProfessionalInvoiceView)} />
      <Route path="/sales-invoices/edit/:id" element={shell(ProfessionalInvoiceView)} />
      <Route path="/recurring-invoices" element={shell(RecurringInvoicesView)} />
      <Route path="/recurring-invoices/new" element={shell(RecurringInvoicesView)} />
      <Route path="/recurring-invoices/view/:id" element={shell(RecurringInvoicesView)} />
      <Route path="/recurring-invoices/edit/:id" element={shell(RecurringInvoicesView)} />
      <Route path="/delivery-challans"  element={shell(DeliveryChallansView)} />
      <Route path="/delivery-challans/new" element={shell(DeliveryChallansView)} />
      <Route path="/delivery-challans/edit/:id" element={shell(DeliveryChallansView)} />
      <Route path="/delivery-challans/view/:id" element={shell(DeliveryChallansView)} />
      <Route path="/payments"           element={shell(PaymentsReceivedView)} />
      <Route path="/payments/new"       element={shell(PaymentsReceivedView)} />
      <Route path="/tax-invoices"       element={shell(GSTInvoiceView)} />

      {/* Time Tracking */}
      <Route path="/time-tracking/projects"          element={shell(ProjectsView)} />
      <Route path="/time-tracking/projects/new"      element={shell(ProjectsView)} />
      
      {/* Payroll / Employees */}
      <Route path="/payroll" element={shell(PayrollView)} />
      <Route path="/employees" element={shell(PayrollView, { showNewEmployeeForm: true })} />
      <Route path="/time-tracking/projects/edit/:id" element={shell(ProjectsView)} />
      <Route path="/time-tracking/projects/view/:id" element={shell(ProjectsView)} />

      {/* Operations */}
      <Route path="/inventory"          element={shell(InventoryView)} />
      <Route path="/inventory/masters"  element={shell(InventoryMastersView)} />
      <Route path="/inventory/new"      element={shell(ItemEntryView, {
        onSaveSuccess: () => navigate('/inventory'),
        onCancel: () => navigate('/inventory')
      })} />
      <Route path="/price-lists"        element={shell(PriceListView)} />
      <Route path="/price-lists/new"    element={shell(PriceListEntryView)} />
      <Route path="/price-lists/edit/:id" element={shell(PriceListEntryView)} />
      <Route path="/banking"            element={shell(BankingView)} />
      <Route path="/banking/new"        element={shell(BankEntryView)} />
      <Route path="/banking/edit/:id"   element={shell(BankEntryView)} />
      <Route path="/banking/view/:id"   element={shell(BankDetailView)} />
      <Route path="/reconciliation"     element={shell(BankReconciliationView)} />
      <Route path="/payroll"            element={shell(PayrollView)} />
      <Route path="/fixed-assets"       element={shell(FixedAssetsView)} />
      {/* Tax */}
      <Route path="/reports/gst"           element={shell(GSTReturnsView)} />

      <Route path="/reports/trial-balance" element={shell(TrialBalanceView)} />
      <Route path="/reports/pl"            element={shell(ProfitLossView)} />
      <Route path="/reports/bs"            element={shell(BalanceSheetView)} />
      <Route path="/reports/daybook"       element={shell(DaybookView)} />
      <Route path="/reports/audit"         element={shell(AuditReportView)} />
      <Route path="/reports/cash-flow"     element={shell(CashFlowView)} />
      <Route path="/reports/receivables-report"    element={shell(ReceivablesReportView)} />
      <Route path="/reports/payables-report"       element={shell(PayablesReportView)} />
      <Route path="/reports/inventory-report"      element={shell(InventoryReportView)} />
      <Route path="/reports/payroll-summary"       element={shell(PayrollSummaryReportView)} />
      <Route path="/reports/customer-outstanding"  element={shell(CustomerOutstandingView)} />
      <Route path="/reports/vendor-outstanding"    element={shell(VendorOutstandingView)} />

      {/* AI Assistant */}
      <Route path="/ai-assistant"          element={shell(AIAssistantView)} />

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
  const [authed, setAuthed] = useState(!!sessionStorage.getItem('token'));

  if (!authed) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={
          <AuthPage
            onLogin={() => setAuthed(true)}
            onAuthSuccess={() => setAuthed(true)}
          />
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }
  return (
    <>
      <Notification />
      <AuthenticatedApp />
    </>
  );
}
