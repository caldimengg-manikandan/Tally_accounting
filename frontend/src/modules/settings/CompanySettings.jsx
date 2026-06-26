import React, { useState, useEffect } from 'react';
import { 
  Building2, Save, Upload, CheckCircle2, AlertCircle, Loader2, 
  Plus, Calendar, ShieldAlert, Check, RefreshCw, Trash2 
} from 'lucide-react';
import { companyAPI, settingsAPI } from '../../services/api';
import { INDIAN_STATES } from '../../utils/indianStates';
import { CURRENCIES } from '../../utils/currencies';
import useNotificationStore from '../../store/notificationStore';

const INDUSTRY_OPTIONS = [
  "General Business", "Trading", "Manufacturing", "Services", "Retail", "Wholesale",
  "Construction & Real Estate", "Transport & Logistics", "Healthcare & Pharmacy",
  "Education & Training", "Hotel & Restaurant", "Agriculture & Farming", "Textile & Garments",
  "Jewellery & Gold", "IT & Software Services", "Printing & Publishing", "Automobile & Auto Parts",
  "Electronics & Electrical", "Food & Beverages", "Professional Services"
];

const CompanySettings = ({ companyId, onCompanyChange }) => {
  const { addNotification } = useNotificationStore();
  const [activeSubTab, setActiveSubTab] = useState('profile'); // 'profile' | 'workspaces' | 'locks'
  
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [closingYear, setClosingYear] = useState(false);

  // Profile Form State
  const [profileData, setProfileData] = useState({
    name: '', gstNumber: '', panNumber: '', address: '', street1: '', street2: '',
    city: '', state: '', pincode: '', phone: '', email: '', website: '',
    industry: 'General Business', baseCurrency: 'INR', fiscalYear: 'April-March',
    reportBasis: 'Accrual', logoUrl: ''
  });

  // Create Company Form State
  const [createData, setCreateData] = useState({
    name: '', gstNumber: '', panNumber: '', address: '', street1: '', street2: '',
    city: '', state: 'Tamil Nadu', pincode: '', phone: '', email: '', website: '',
    industry: 'General Business', baseCurrency: 'INR', fiscalYear: 'April-March',
    reportBasis: 'Accrual'
  });

  // Locks Form State
  const [legacyLock, setLegacyLock] = useState({ lockDate: '', reason: '' });
  const [financialPeriods, setFinancialPeriods] = useState([]);
  const [newPeriod, setNewPeriod] = useState({ periodName: '', startDate: '', endDate: '' });
  const [creatingPeriod, setCreatingPeriod] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, [companyId]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // 1. Get all companies
      const resCompanies = await companyAPI.getAll();
      setCompanies(resCompanies.data || []);

      // 2. Load active company profile
      if (companyId) {
        const resProfile = await companyAPI.getById(companyId);
        if (resProfile.data) {
          setProfileData(resProfile.data);
        }

        // 3. Load lock settings
        try {
          const resLegacy = await settingsAPI.getLegacyPeriodLock();
          if (resLegacy.data) {
            setLegacyLock({
              lockDate: resLegacy.data.lockDate || '',
              reason: resLegacy.data.reason || ''
            });
          } else {
            setLegacyLock({ lockDate: '', reason: '' });
          }
        } catch (e) {
          console.warn("No legacy lock loaded:", e.message);
        }

        try {
          const resPeriods = await settingsAPI.getFinancialPeriods();
          setFinancialPeriods(resPeriods.data || []);
        } catch (e) {
          console.warn("No periods loaded:", e.message);
        }
      }
    } catch (err) {
      console.error(err);
      addNotification('Failed to load company details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (key, val) => {
    setProfileData(prev => ({ ...prev, [key]: val }));
  };

  const handleCreateChange = (key, val) => {
    setCreateData(prev => ({ ...prev, [key]: val }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      handleProfileChange('logoUrl', reader.result);
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = async () => {
    if (!profileData.name.trim()) {
      addNotification('Company Name is strictly required', 'warning');
      return;
    }
    setSaving(true);
    try {
      await companyAPI.update(companyId, profileData);
      addNotification('Company Profile updated successfully', 'success');
      // Update session storage if name changed
      sessionStorage.setItem('companyName', profileData.name);
      onCompanyChange();
      fetchInitialData();
    } catch (err) {
      console.error(err);
      addNotification(err.response?.data?.error || 'Failed to update company profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const createCompany = async () => {
    if (!createData.name.trim()) {
      addNotification('Company Name is required', 'warning');
      return;
    }
    setSaving(true);
    try {
      const res = await companyAPI.create(createData);
      const newCompany = res.data;
      
      // Auto-sync standard ledgers
      addNotification('Company created. Seeding accounting ledgers...', 'info');
      await companyAPI.syncDefaultLedgers(newCompany.id);
      
      addNotification('Company created and fully initialized!', 'success');
      
      // Switch to new company
      sessionStorage.setItem('companyId', newCompany.id);
      sessionStorage.setItem('companyName', newCompany.name);
      onCompanyChange();
      setCreateData({
        name: '', gstNumber: '', panNumber: '', address: '', street1: '', street2: '',
        city: '', state: 'Tamil Nadu', pincode: '', phone: '', email: '', website: '',
        industry: 'General Business', baseCurrency: 'INR', fiscalYear: 'April-March',
        reportBasis: 'Accrual'
      });
      setActiveSubTab('profile');
    } catch (err) {
      console.error(err);
      addNotification(err.response?.data?.error || 'Failed to create company', 'error');
    } finally {
      setSaving(false);
    }
  };

  const switchCompany = (comp) => {
    sessionStorage.setItem('companyId', comp.id);
    sessionStorage.setItem('companyName', comp.name);
    addNotification(`Switched workspace to "${comp.name}"`, 'success');
    onCompanyChange();
    fetchInitialData();
  };

  const saveLegacyLock = async () => {
    try {
      setSaving(true);
      await settingsAPI.setLegacyPeriodLock({
        lockDate: legacyLock.lockDate || null,
        reason: legacyLock.reason
      });
      addNotification('Transaction date lock updated successfully', 'success');
      fetchInitialData();
    } catch (err) {
      console.error(err);
      addNotification(err.response?.data?.error || 'Failed to save period lock', 'error');
    } finally {
      setSaving(false);
    }
  };

  const createPeriod = async () => {
    if (!newPeriod.periodName || !newPeriod.startDate || !newPeriod.endDate) {
      addNotification('Please enter period name, start date, and end date', 'warning');
      return;
    }
    try {
      setCreatingPeriod(true);
      await settingsAPI.createFinancialPeriod(newPeriod);
      addNotification('Financial Period created successfully', 'success');
      setNewPeriod({ periodName: '', startDate: '', endDate: '' });
      fetchInitialData();
    } catch (err) {
      console.error(err);
      addNotification(err.response?.data?.error || 'Failed to create financial period', 'error');
    } finally {
      setCreatingPeriod(false);
    }
  };

  const togglePeriod = async (periodId, currentLockStatus) => {
    try {
      await settingsAPI.togglePeriodLock(periodId, !currentLockStatus);
      addNotification(`Period ${!currentLockStatus ? 'LOCKED' : 'UNLOCKED'} successfully`, 'success');
      fetchInitialData();
    } catch (err) {
      console.error(err);
      addNotification(err.response?.data?.error || 'Failed to toggle period lock', 'error');
    }
  };

  const executeFYClose = async () => {
    if (!window.confirm('WARNING: Closing the financial year is a secure, non-reversible accounting action. This will calculate Net Profit/Loss, carry balances forward, and create opening balances for the next year. Do you want to proceed?')) {
      return;
    }
    try {
      setClosingYear(true);
      const res = await companyAPI.closeFinancialYear(companyId);
      addNotification(res.data.message || 'Financial year closed successfully!', 'success');
      fetchInitialData();
    } catch (err) {
      console.error(err);
      addNotification(err.response?.data?.error || 'Failed to close financial year', 'error');
    } finally {
      setClosingYear(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-slate-400">
        <Loader2 size={32} className="animate-spin text-blue-600 mb-2" />
        <span className="text-xs font-bold uppercase tracking-widest">Loading Company Panel...</span>
      </div>
    );
  }

  return (
    <div className="w-full box-border">
      <header className="mb-8 border-b border-slate-100 dark:border-slate-700 pb-5">
        <div className="flex items-center gap-2.5">
          <Building2 className="text-blue-600" size={24} />
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Company Settings</h1>
        </div>
        <p className="text-[12px] text-slate-400 mt-1">
          Manage your organizational profile details, switch between workspaces, configure period lock limits, and execute fiscal closures.
        </p>
      </header>

      {/* Internal Sub Navigation tabs */}
      <div className="flex border-b border-slate-200 mb-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden p-1 gap-1">
        <button
          onClick={() => setActiveSubTab('profile')}
          className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all
            ${activeSubTab === 'profile' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-100 hover:bg-slate-50'}`}
        >
          Company Profile
        </button>
        <button
          onClick={() => setActiveSubTab('workspaces')}
          className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all
            ${activeSubTab === 'workspaces' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-100 hover:bg-slate-50'}`}
        >
          Workspaces ({companies.length})
        </button>
        <button
          onClick={() => setActiveSubTab('locks')}
          className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all
            ${activeSubTab === 'locks' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-100 hover:bg-slate-50'}`}
        >
          Locking & Closure
        </button>
      </div>

      {/* Tab content viewports */}
      <div className="space-y-6">
        {activeSubTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form card */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm space-y-6">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700 pb-3">
                Organizational Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Company Name *</label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={e => handleProfileChange('name', e.target.value)}
                    className="w-full h-10 border border-slate-200 rounded-lg px-3 text-[13px] text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">GSTIN</label>
                  <input
                    type="text"
                    value={profileData.gstNumber}
                    onChange={e => handleProfileChange('gstNumber', e.target.value)}
                    placeholder="e.g. 33AAAAA1111A1Z1"
                    className="w-full h-10 border border-slate-200 rounded-lg px-3 text-[13px] text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">PAN Number</label>
                  <input
                    type="text"
                    value={profileData.panNumber}
                    onChange={e => handleProfileChange('panNumber', e.target.value)}
                    placeholder="e.g. ABCDE1234F"
                    className="w-full h-10 border border-slate-200 rounded-lg px-3 text-[13px] text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Industry</label>
                  <select
                    value={profileData.industry}
                    onChange={e => handleProfileChange('industry', e.target.value)}
                    className="w-full h-10 border border-slate-200 rounded-lg px-3 text-[13px] text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 bg-white dark:bg-slate-700"
                  >
                    {INDUSTRY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Email</label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={e => handleProfileChange('email', e.target.value)}
                    className="w-full h-10 border border-slate-200 rounded-lg px-3 text-[13px] text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Phone</label>
                  <input
                    type="text"
                    value={profileData.phone}
                    onChange={e => handleProfileChange('phone', e.target.value)}
                    className="w-full h-10 border border-slate-200 rounded-lg px-3 text-[13px] text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Street Address</label>
                  <input
                    type="text"
                    value={profileData.address}
                    onChange={e => handleProfileChange('address', e.target.value)}
                    className="w-full h-10 border border-slate-200 rounded-lg px-3 text-[13px] text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">City</label>
                    <input
                      type="text"
                      value={profileData.city}
                      onChange={e => handleProfileChange('city', e.target.value)}
                      className="w-full h-10 border border-slate-200 rounded-lg px-3 text-[13px] text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">State</label>
                    <select
                      value={profileData.state}
                      onChange={e => handleProfileChange('state', e.target.value)}
                      className="w-full h-10 border border-slate-200 rounded-lg px-3 text-[13px] text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 bg-white dark:bg-slate-700"
                    >
                      <option value="">Select State</option>
                      {INDIAN_STATES.map(st => <option key={st} value={st}>{st}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Pincode</label>
                    <input
                      type="text"
                      value={profileData.pincode}
                      onChange={e => handleProfileChange('pincode', e.target.value)}
                      className="w-full h-10 border border-slate-200 rounded-lg px-3 text-[13px] text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded-lg flex items-center gap-1.5 shadow-md shadow-blue-500/10"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Profile
                </button>
              </div>
            </div>

            {/* Logo Column */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-between text-center min-h-[300px]">
              <div className="space-y-4 w-full">
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700 pb-3">
                  Company Identity
                </h2>
                <div className="w-32 h-32 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden mx-auto relative group">
                  {profileData.logoUrl ? (
                    <img src={profileData.logoUrl} alt="Logo Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="text-slate-300" size={48} />
                  )}
                </div>
                <p className="text-[11px] text-slate-400 max-w-[200px] mx-auto">
                  Upload a high-resolution square PNG or JPG. This logo will display on standard receipts, invoices, and reports.
                </p>
              </div>

              <div className="w-full pt-4 space-y-2">
                <label className="w-full h-10 border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center justify-center text-[12px] font-bold text-slate-600 uppercase tracking-wider cursor-pointer gap-1.5 transition-colors">
                  {profileData.logoUrl ? <RefreshCw size={14} /> : <Upload size={14} />} {profileData.logoUrl ? 'Update Logo' : 'Upload Logo'}
                  <input type="file" onChange={handleLogoUpload} accept="image/*" className="hidden" />
                </label>
                {profileData.logoUrl && (
                  <button
                    onClick={() => handleProfileChange('logoUrl', '')}
                    className="w-full h-10 border border-red-200 bg-red-50 hover:bg-red-100 rounded-lg flex items-center justify-center text-[12px] font-bold text-red-600 uppercase tracking-wider gap-1.5 transition-colors"
                  >
                    <Trash2 size={14} /> Delete Logo
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'workspaces' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-200">
            {/* List Workspaces */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-800 dark:text-slate-100">
                Switch Workspace Company
              </h2>
              <div className="space-y-3">
                {companies.map(comp => {
                  const isActive = comp.id === companyId;
                  return (
                    <div 
                      key={comp.id}
                      className={`p-5 rounded-2xl border flex items-center justify-between transition-all bg-white
                        ${isActive ? 'border-blue-500 shadow-md shadow-blue-500/5' : 'border-slate-200 hover:border-slate-300'}`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{comp.name}</span>
                          {isActive && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-bold text-[9px] rounded-full uppercase tracking-wider">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-3">
                          <span>GST: {comp.gstNumber || 'N/A'}</span>
                          <span>•</span>
                          <span>Groups: {comp.groupCount || 0}</span>
                          <span>•</span>
                          <span>Ledgers: {comp.ledgerCount || 0}</span>
                        </div>
                      </div>
                      {!isActive && (
                        <button
                          onClick={() => switchCompany(comp)}
                          className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider rounded-lg flex items-center gap-1.5 transition-colors"
                        >
                          Switch
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Create Company Redirect */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center space-y-4 min-h-[300px]">
              <Building2 className="text-slate-300" size={48} />
              <div>
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Need a New Workspace?</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[250px] mx-auto">
                  Set up a new company with full details including GSTIN, address, and financial settings.
                </p>
              </div>
              <button
                onClick={() => window.location.href = '/setup-company'}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded-lg flex items-center justify-center gap-1.5 shadow-md transition-colors"
              >
                <Plus size={14} /> Go to Setup Company
              </button>
            </div>
          </div>
        )}

        {activeSubTab === 'locks' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-200">
            {/* Financial Periods Locking */}
            <div className="lg:col-span-2 space-y-6">
              {/* Legacy Period Lock */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700 pb-3 flex items-center gap-1.5">
                  <ShieldAlert size={16} className="text-blue-500" /> Transaction Date Freeze (Legacy Lock)
                </h2>
                <p className="text-[12px] text-slate-400 leading-relaxed">
                  Freeze historical transaction entries. Transactions dated on or before this lock date cannot be created, modified, or deleted.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Lock Limit Date</label>
                    <input
                      type="date"
                      value={legacyLock.lockDate}
                      onChange={e => setLegacyLock(prev => ({ ...prev, lockDate: e.target.value }))}
                      className="w-full h-10 border border-slate-200 rounded-lg px-3 text-[13px] text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Reason for Lock</label>
                    <input
                      type="text"
                      value={legacyLock.reason}
                      onChange={e => setLegacyLock(prev => ({ ...prev, reason: e.target.value }))}
                      placeholder="e.g. Audit complete"
                      className="w-full h-10 border border-slate-200 rounded-lg px-3 text-[13px] text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    onClick={saveLegacyLock}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded-lg flex items-center gap-1.5 shadow-sm"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Lock Date
                  </button>
                </div>
              </div>

              {/* Financial Periods Locking */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700 pb-3 flex items-center gap-1.5">
                  <Calendar size={16} className="text-blue-500" /> Financial Periods Lock
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-700 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="pb-3">Period Name</th>
                        <th className="pb-3">Start Date</th>
                        <th className="pb-3">End Date</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-[13px]">
                      {financialPeriods.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="py-6 text-center text-slate-400 text-xs">
                            No financial periods configured. Define one in the side panel.
                          </td>
                        </tr>
                      ) : (
                        financialPeriods.map(p => (
                          <tr key={p.id} className="text-slate-700 hover:bg-slate-50/50">
                            <td className="py-3.5 font-semibold">{p.periodName}</td>
                            <td className="py-3.5 font-mono">{p.startDate}</td>
                            <td className="py-3.5 font-mono">{p.endDate}</td>
                            <td className="py-3.5">
                              <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider
                                ${p.isLocked 
                                  ? 'bg-rose-100 text-rose-800' 
                                  : 'bg-emerald-100 text-emerald-800'}`}>
                                {p.isLocked ? 'Locked' : 'Open'}
                              </span>
                            </td>
                            <td className="py-3.5 text-right">
                              <button
                                onClick={() => togglePeriod(p.id, p.isLocked)}
                                className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded border transition-colors
                                  ${p.isLocked 
                                    ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50' 
                                    : 'border-rose-200 text-rose-700 hover:bg-rose-50'}`}
                              >
                                {p.isLocked ? 'Unlock' : 'Lock'}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Sidebar details (Define Period & FY Close) */}
            <div className="space-y-6">
              {/* Define New Period */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700 pb-3">
                  Define New Period
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Period Name</label>
                    <input
                      type="text"
                      value={newPeriod.periodName}
                      onChange={e => setNewPeriod(prev => ({ ...prev, periodName: e.target.value }))}
                      placeholder="e.g. FY 2025-26 Q1"
                      className="w-full h-10 border border-slate-200 rounded-lg px-3 text-[13px] text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Start Date</label>
                    <input
                      type="date"
                      value={newPeriod.startDate}
                      onChange={e => setNewPeriod(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full h-10 border border-slate-200 rounded-lg px-3 text-[13px] text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">End Date</label>
                    <input
                      type="date"
                      value={newPeriod.endDate}
                      onChange={e => setNewPeriod(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full h-10 border border-slate-200 rounded-lg px-3 text-[13px] text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500"
                    />
                  </div>
                  <button
                    onClick={createPeriod}
                    disabled={creatingPeriod}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                  >
                    {creatingPeriod ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Create Period
                  </button>
                </div>
              </div>

              {/* Fiscal Year closure */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 space-y-4">
                <h3 className="text-xs font-bold text-amber-800 uppercase tracking-widest flex items-center gap-1.5">
                  <ShieldAlert size={16} className="text-amber-600" /> Year-End Closure
                </h3>
                <p className="text-[12px] text-amber-900/70 leading-relaxed">
                  Executing year-end closure seals the current active financial period, aggregates profit/loss ledger balances, transfers them to Retained Earnings, and carries forward balance sheet opening balances to seed the next year.
                </p>
                <button
                  onClick={executeFYClose}
                  disabled={closingYear}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold uppercase tracking-wider py-3 rounded-lg flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/10 transition-colors"
                >
                  {closingYear ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Close Financial Year
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanySettings;
