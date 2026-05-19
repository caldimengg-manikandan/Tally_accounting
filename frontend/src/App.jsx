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
import BankingView from './modules/banking/BankingView';
import BankEntryView from './modules/banking/BankEntryView';
import BankDetailView from './modules/banking/BankDetailView';
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
import RecurringInvoicesView from './modules/sales/RecurringInvoicesView';
import DeliveryChallansView from './modules/sales/DeliveryChallansView';
import CreditNotesView from './modules/sales/CreditNotesView';
import PayrollView from './modules/payroll/PayrollView';
import ProjectsView from './modules/time_tracking/ProjectsView';
import VendorsListView from './modules/purchases/VendorsListView';
import VendorsView from './modules/purchases/VendorsView';
import VendorDetailView from './modules/purchases/VendorDetailView';
import BillsView from './modules/purchases/BillsView';
import ExpensesView from './modules/purchases/ExpensesView';
import RecurringExpensesView from './modules/purchases/RecurringExpensesView';
import PurchaseOrdersView from './modules/purchases/PurchaseOrdersView';
import ExpenseEntryView from './modules/purchases/ExpenseEntryView';
import RecurringExpenseEntryView from './modules/purchases/RecurringExpenseEntryView';
import PurchaseOrderEntryView from './modules/purchases/PurchaseOrderEntryView';
import BillEntryView from './modules/purchases/BillEntryView';
import RecurringBillEntryView from './modules/purchases/RecurringBillEntryView';
import RecurringBillsView from './modules/purchases/RecurringBillsView';
import PaymentsMadeListView from './modules/purchases/PaymentsMadeListView';
import PaymentsMadeEntryView from './modules/purchases/PaymentsMadeEntryView';
import VendorCreditsView from './modules/purchases/VendorCreditsView';
import { BudgetsView, TransactionLockingView } from './modules/accountant/AccountantSubModules';
import BulkUpdateView from './modules/accountant/BulkUpdateView';
import CurrencyAdjustmentsView from './modules/accountant/CurrencyAdjustmentsView';
import ManualJournalEntryView from './modules/accountant/ManualJournalEntryView';
import ManualJournalsListView from './modules/accountant/ManualJournalsListView';

// ── APIs ─────────────────────────────────────────────────────────
import { companyAPI, reportsAPI, voucherAPI } from './services/api';

// ── Icons ─────────────────────────────────────────────────────────
import {
  LayoutDashboard, FileText, BookOpen, BarChart2,
  Package, ArrowLeftRight, Settings, Users, ShoppingBag,
  Receipt, Wallet, TrendingUp, Shield, LogOut,
  Bell, ChevronRight, ChevronDown, ChevronsLeft, ChevronsRight,
  Building2, Activity, ShoppingCart, UserCheck, FileBarChart2,
  PieChart, Landmark, Target, Clock, Undo2, Truck, Repeat, ClipboardList, FileStack, Plus,
  RefreshCw, PanelLeftClose, PanelLeftOpen
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
    group: 'Items',
    icon: Package,
    items: [
      { label: 'Items',        path: '/inventory', icon: Package, showPlus: true, plusPath: '/inventory/new' },
      { label: 'Price Lists',  path: '/price-lists', icon: ClipboardList, showPlus: true, plusPath: '/price-lists/new' },
    ]
  },
  {
    group: 'Sales',
    icon: ShoppingCart,
    items: [
      { icon: Users,           label: 'Customers',        path: '/customers', showPlus: true, plusPath: '/customers/new' },
      { icon: FileText,        label: 'Quotes',           path: '/quotes', showPlus: true, plusPath: '/quotes/new' },
      { icon: ShoppingBag,     label: 'Sales Orders',     path: '/sales-orders', showPlus: true, plusPath: '/sales-orders/new' },
      { icon: Receipt,         label: 'Invoices',         path: '/sales-invoices', showPlus: true, plusPath: '/sales-invoices/new' },
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
      { label: 'Vendors',            path: '/vendors', icon: Users, showPlus: true, plusPath: '/vendors/new' },
      { label: 'Expenses',           path: '/expenses', icon: Receipt, showPlus: true, plusPath: '/expenses/new' },
      { label: 'Recurring Expenses', path: '/recurring-expenses', icon: Repeat, showPlus: true, plusPath: '/recurring-expenses/new' },
      { label: 'Purchase Orders',    path: '/purchase-orders', icon: ShoppingBag, showPlus: true, plusPath: '/purchase-orders/new' },
      { label: 'Bills',              path: '/bills', icon: FileStack, showPlus: true, plusPath: '/bills/new' },
      { label: 'Recurring Bills',    path: '/recurring-bills', icon: Repeat, showPlus: true, plusPath: '/recurring-bills/new' },
      { label: 'Payments Made',      path: '/payments-made', icon: Wallet, showPlus: true, plusPath: '/payments-made/new' },
      { label: 'Vendor Credits',     path: '/vendor-credits', icon: Undo2, showPlus: true, plusPath: '/vendor-credits/new' },
    ]
  },
  {
    group: 'Time Tracking',
    icon: Activity,
    items: [
      { label: 'Projects', path: '/time-tracking/projects', icon: Target, showPlus: true, plusPath: '/time-tracking/projects/new' },
      { label: 'Timesheet', path: '/time-tracking/timesheet', icon: Clock, showPlus: true, plusPath: '/time-tracking/timesheet/new' },
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
    group: 'Accountant',
    icon: UserCheck,
    items: [
      { label: 'Manual Journals',   path: '/accountant/journals', icon: BookOpen, showPlus: true, plusPath: '/accountant/journals/new' },
      { label: 'Bulk Update',       path: '/accountant/bulk-update', icon: RefreshCw, showPlus: true, plusPath: '/accountant/bulk-update/new' },
      { label: 'Currency Adjustments', path: '/accountant/currency-adjustments', icon: ArrowLeftRight, showPlus: true, plusPath: '/accountant/currency-adjustments/new' },
      { label: 'Chart of Accounts', path: '/ledgers', icon: ClipboardList, showPlus: true, plusPath: '/ledgers/new' },
      { label: 'Budgets',           path: '/accountant/budgets', icon: Target, showPlus: true, plusPath: '/accountant/budgets/new' },
      { label: 'Transaction Locking', path: '/accountant/locking', icon: Shield, showPlus: true, plusPath: '/accountant/locking/new' },
      { label: 'Cost Centers',      path: '/cost-centers', icon: Target, showPlus: true, plusPath: '/cost-centers/new' },
    ]
  },
  {
    group: 'Reports',
    icon: BarChart2,
    items: [
      { label: 'Trial Balance',    path: '/reports/trial-balance', icon: BarChart2 },
      { label: 'Profit & Loss',    path: '/reports/pl', icon: PieChart },
      { label: 'Balance Sheet',    path: '/reports/bs', icon: FileBarChart2 },
      { label: 'Day Book',         path: '/reports/daybook', icon: ClipboardList },
      { label: 'GST Returns',      path: '/reports/gst', icon: Shield },
    ]
  },
  {
    group: 'Documents',
    icon: FileStack,
    items: [
      { label: 'Documents', path: '/documents', icon: FileStack },
    ]
  },
  {
    group: 'Settings',
    icon: Settings,
    items: [
      { label: 'Payroll',          path: '/payroll', icon: UserCheck },
      { label: 'Company Settings', path: '/settings/company', icon: Building2 },
      { label: 'Audit Trail',      path: '/reports/audit', icon: Shield },
    ]
  },
];

// ═══════════════════════════════════════════════════════════════════
// SIDEBAR GROUP
// ═══════════════════════════════════════════════════════════════════
const NavGroup = ({ group, icon: Icon, items, collapsed, pathname, navigate }) => {
  const [expanded, setExpanded] = useState(
    pathname.includes(group.toLowerCase().replace(' ', '-')) ||
    items.some(it => pathname === it.path || pathname.startsWith(it.path))
  );

  const isActive = items.some(item => pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path)));

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
                const active = pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path));
                return (
                  <div 
                    key={item.path} 
                    className={`group/sub flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer
                      ${active ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900'}`}
                    onClick={() => { navigate(item.path); setIsHovered(false); }}
                  >
                    <span className={`text-[13px] font-bold tracking-tight ${active ? 'text-blue-600' : ''}`}>
                      {item.label}
                    </span>
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
  if (group === 'Home' || items.length === 0) {
    return items.map(item => (
      <NavItem
        key={item.path}
        icon={item.icon}
        label={item.label}
        active={pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path))}
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
            const active = pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path));
            return (
              <div 
                key={item.path} 
                className={`group/item flex items-center justify-between px-4 py-1.5 rounded-l-full transition-all duration-200 
                  ${active ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600' : 'hover:bg-slate-50 text-slate-800 hover:text-slate-900'}`}
              >
                <button
                  onClick={() => navigate(item.path)}
                  title={item.label}
                  className={`flex-1 text-left text-[12px] font-medium tracking-tight
                    ${active ? 'text-blue-600 font-bold' : 'text-slate-800 group-hover/item:text-slate-900'}`}
                >
                  {item.label}
                </button>
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
           ${active ? 'bg-blue-600 text-white shadow-inner' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`
        : `items-center gap-3 w-full px-6 py-2.5
           ${active ? 'bg-blue-50/50 text-blue-600 border-l-4 border-blue-600' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}`}
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
const AppShell = ({ children, onLogout, companies = [], currentCompanyId, onCompanyChange }) => {
  const navigate   = useNavigate();
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const user = useMemo(() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } }, []);

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
      <aside className="no-print" style={{
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
            <div className="flex flex-col items-start leading-[1.1] animate-fade-in">
              <div className="text-[15px] font-black text-slate-900 tracking-tight uppercase">Tally Replica</div>
              <div className="text-[10px] font-bold text-blue-600/70 uppercase tracking-[0.15em] mt-1 whitespace-nowrap">Cloud Accounting Suite</div>
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
            if (role === 'DATA_ENTRY') return ['Home', 'Items', 'Banking', 'Sales', 'Purchases', 'Accountant', 'Payroll'].includes(section.group);
            return true; // ADMIN, MANAGER, ACCOUNTANT see all
          }).map(section => (
            <NavGroup
              key={section.group}
              group={section.group}
              icon={section.icon}
              items={section.items}
              collapsed={collapsed}
              pathname={pathname}
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
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-10 relative z-40 shrink-0 no-print">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-100">
               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Workspace</span>
               <ChevronRight size={12} className="text-slate-300" />
               <select 
                 className="bg-transparent text-[11px] font-bold text-slate-900 uppercase tracking-widest outline-none cursor-pointer"
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
                      className={`text-[11px] font-bold uppercase tracking-widest cursor-pointer transition-colors ${crumb.isLast ? 'text-[#1e61f0]' : 'text-slate-400 hover:text-slate-900'}`}
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
      <Route path="/accountant/journals" element={
        <AppShell onLogout={handleLogout} companies={companies} currentCompanyId={companyId} onCompanyChange={handleCompanyChange}>
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
        <AppShell onLogout={handleLogout} companies={companies} currentCompanyId={companyId} onCompanyChange={handleCompanyChange}>
          <ManualJournalsListView companyId={companyId} />
        </AppShell>
      } />
      <Route path="/ledgers"              element={shell(LedgersView)} />
      <Route path="/ledgers/new"          element={shell(LedgersView, { showNew: true })} />
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
      <Route path="/purchase-orders/new" element={shell(PurchaseOrderEntryView)} />
      <Route path="/payments-made"       element={shell(PaymentsMadeListView)} />
      <Route path="/payments-made/new"   element={shell(PaymentsMadeEntryView)} />
      <Route path="/payments-made/edit/:id" element={shell(PaymentsMadeEntryView)} />
      <Route path="/vendor-credits"      element={shell(VendorCreditsView)} />
      <Route path="/vendor-credits/new"  element={shell(VendorCreditsView)} />
      <Route path="/vendor-credits/edit/:id" element={shell(VendorCreditsView)} />
      <Route path="/vendor-credits/view/:id" element={shell(VendorCreditsView)} />

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
      <Route path="/credit-notes"       element={shell(CreditNotesView)} />
      <Route path="/credit-notes/new"   element={shell(CreditNotesView)} />
      <Route path="/credit-notes/edit/:id" element={shell(CreditNotesView)} />
      <Route path="/credit-notes/view/:id" element={shell(CreditNotesView)} />
      <Route path="/tax-invoices"       element={shell(GSTInvoiceView)} />

      {/* Time Tracking */}
      <Route path="/time-tracking/projects"      element={shell(ProjectsView)} />
      <Route path="/time-tracking/projects/new"  element={shell(ProjectsView)} />
      <Route path="/time-tracking/projects/edit/:id" element={shell(ProjectsView)} />
      <Route path="/time-tracking/projects/view/:id" element={shell(ProjectsView)} />

      {/* Operations */}
      <Route path="/inventory"          element={shell(InventoryView)} />
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
