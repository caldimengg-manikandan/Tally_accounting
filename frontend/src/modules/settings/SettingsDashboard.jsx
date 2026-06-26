import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, CreditCard, ToggleLeft, User, Bell, 
  HelpCircle, ShieldCheck, Database, Sliders, Menu, X 
} from 'lucide-react';
import CompanySettings from './CompanySettings';
import UserManagement from './UserManagement';
import SubscriptionSettings from './SubscriptionSettings';
import FeatureSettings from './FeatureSettings';
import ProfileSettings from './ProfileSettings';
import NotificationSettings from './NotificationSettings';
import PaymentGatewaysSettings from './PaymentGatewaysSettings';
import SupportCenter from './SupportCenter';
import AuditLogSettings from './AuditLogSettings';
import BackupSettings from './BackupSettings';

import { getUser } from '../../stores/authStore';

const SettingsDashboard = () => {
  const [activeTab, setActiveTab] = useState('company');
  const [companyId, setCompanyId] = useState(sessionStorage.getItem('companyId') || '');
  const [companyName, setCompanyName] = useState(sessionStorage.getItem('companyName') || '');
  const [userRole, setUserRole] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Read active user details from memory store
    const activeUser = getUser();
    if (activeUser && activeUser.role) {
      setUserRole(activeUser.role);
    } else {
      // Fallback to sessionStorage
      const userStr = sessionStorage.getItem('user');
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          setUserRole(userObj.role || 'VIEWER');
        } catch (e) {
          console.error(e);
        }
      }
    }

    // Polling or handling storage changes
    const handleStorageChange = () => {
      setCompanyId(sessionStorage.getItem('companyId') || '');
      setCompanyName(sessionStorage.getItem('companyName') || '');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const menuItems = [
    { id: 'company', label: 'Company Profile', icon: Building2, roles: ['ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT', 'MANAGER', 'AUDITOR', 'VIEWER', 'EMPLOYEE'] },
    { id: 'users', label: 'Users & Roles', icon: Users, roles: ['ADMIN', 'SUPER_ADMIN'] },
    { id: 'subscription', label: 'Subscription & Billing', icon: CreditCard, roles: ['ADMIN', 'SUPER_ADMIN'] },
    { id: 'features', label: 'Feature Access', icon: Sliders, roles: ['ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT', 'MANAGER'] },
    { id: 'profile', label: 'My Profile & Security', icon: User, roles: ['ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT', 'MANAGER', 'AUDITOR', 'VIEWER', 'EMPLOYEE'] },
    { id: 'gateways', label: 'Payment Gateways', icon: CreditCard, roles: ['ADMIN', 'SUPER_ADMIN'] },
  ];

  // Filter items by user role
  const visibleMenuItems = menuItems.filter(item => {
    if (!item.roles) return true;
    const normalizedUserRole = (userRole || 'VIEWER').toUpperCase();
    return item.roles.map(r => r.toUpperCase()).includes(normalizedUserRole);
  });

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'company':
        return <CompanySettings companyId={companyId} onCompanyChange={() => {
          setCompanyId(sessionStorage.getItem('companyId') || '');
          setCompanyName(sessionStorage.getItem('companyName') || '');
        }} />;
      case 'users':
        return <UserManagement companyId={companyId} />;
      case 'subscription':
        return <SubscriptionSettings companyId={companyId} />;
      case 'features':
        return <FeatureSettings companyId={companyId} onNavigateToUpgrade={() => setActiveTab('subscription')} />;
      case 'profile':
        return <ProfileSettings />;
      case 'notifications':
        return <NotificationSettings companyId={companyId} />;
      case 'gateways':
        return <PaymentGatewaysSettings companyId={companyId} />;
      case 'support':
        return <SupportCenter companyId={companyId} />;
      case 'audit':
        return <AuditLogSettings companyId={companyId} />;
      case 'backup':
        return <BackupSettings companyId={companyId} />;
      default:
        return <CompanySettings companyId={companyId} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans">
      {/* Left Sidebar Pane - Desktop */}
      <aside className="hidden md:flex md:flex-col md:w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shrink-0 print:hidden">
        <div className="h-16 flex items-center px-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Workspace Settings</span>
            <span className="text-sm font-extrabold text-slate-800 dark:text-white truncate max-w-[200px]" title={companyName}>
              {companyName || 'No Company Active'}
            </span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {visibleMenuItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200
                  ${isActive 
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-sm shadow-blue-500/5' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'}`}
              >
                <Icon size={18} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Sidebar Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-slate-900/40 backdrop-blur-sm">
          <div className="w-64 bg-white dark:bg-slate-900 h-full flex flex-col p-4 shadow-xl animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Menu</span>
              <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
              {visibleMenuItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all
                      ${isActive 
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'}`}
                  >
                    <Icon size={18} />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col bg-white dark:bg-slate-950 overflow-hidden relative">
        <header className="md:hidden h-16 flex items-center px-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 -ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Menu size={20} />
          </button>
          <div className="ml-3 font-bold text-slate-800 dark:text-white text-sm">
            {menuItems.find(m => m.id === activeTab)?.label}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 pb-20">
          <div className="max-w-6xl mx-auto min-h-full">
            {renderActiveComponent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SettingsDashboard;
