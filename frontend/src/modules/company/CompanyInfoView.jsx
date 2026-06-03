import React, { useState, useEffect } from 'react';
import { 
  Building2, Save, Upload, CheckCircle2, AlertCircle, Loader2, HelpCircle, 
  Plus, Trash2, X, Maximize2, Landmark, Check, ShieldAlert, Calendar, DollarSign
} from 'lucide-react';
import { companyAPI } from '../../services/api';
import { INDIAN_STATES } from '../../utils/indianStates';
import { CURRENCIES } from '../../utils/currencies';

const validateGSTIN = (gstin) => {
  if (!gstin) return true;
  const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return regex.test(gstin.toUpperCase());
};

const validatePAN = (pan) => {
  if (!pan) return true;
  const regex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return regex.test(pan.toUpperCase());
};

const TabButton = ({ active, label, onClick }) => (
  <button
    onClick={onClick}
    className={`px-6 py-3 text-sm font-bold border-b-2 transition-all uppercase tracking-wider
      ${active 
        ? 'border-blue-600 text-blue-600 bg-blue-50/20' 
        : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'}`}
  >
    {label}
  </button>
);

const InputRow = ({ label, keyName, value, onChange, type = "text", placeholder = "", required = false, help = false, disabled = false, maxLength }) => (
  <div className="flex flex-col gap-1.5 py-3.5 border-b border-slate-100 last:border-0 lg:flex-row lg:items-center">
    <label className="text-[13px] text-slate-600 font-bold lg:w-56 shrink-0 flex items-center gap-1.5">
      {label} {required && <span className="text-red-500 font-bold">*</span>}
      {help && <HelpCircle size={14} className="text-slate-400 cursor-help" />}
    </label>
    <input 
      type={type}
      placeholder={placeholder}
      value={value || ''}
      onChange={(e) => onChange(keyName, e.target.value)}
      disabled={disabled}
      maxLength={maxLength}
      style={keyName === 'gstNumber' || keyName === 'panNumber' ? { textTransform: 'uppercase' } : {}}
      className={`flex-1 max-w-md h-10 border border-slate-200 rounded-lg px-3 text-[13px] text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-slate-300 font-sans ${disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''}`}
    />
  </div>
);

const SelectRow = ({ label, keyName, value, onChange, options, required = false, help = false, disabled = false }) => (
  <div className="flex flex-col gap-1.5 py-3.5 border-b border-slate-100 last:border-0 lg:flex-row lg:items-center">
    <label className="text-[13px] text-slate-600 font-bold lg:w-56 shrink-0 flex items-center gap-1.5">
      {label} {required && <span className="text-red-500 font-bold">*</span>}
      {help && <HelpCircle size={14} className="text-slate-400 cursor-help" />}
    </label>
    <select 
      value={value || ''}
      onChange={(e) => onChange(keyName, e.target.value)}
      disabled={disabled}
      className={`flex-1 max-w-md h-10 border border-slate-200 rounded-lg px-3 text-[13px] text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all bg-white appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat font-sans ${disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''}`}
    >
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);

const CompanyInfoView = ({ firstTime = false, onCompanyCreated }) => {
  const [activeTab, setActiveTab] = useState(firstTime ? 'create' : 'switch'); // 'switch' | 'edit' | 'gst_fy' | 'create'
  const [loading, setLoading]     = useState(false);
  const [fetching, setFetching] = useState(true);
  const [status, setStatus]     = useState(null); // 'success' | 'error' | null
  const [errorMsg, setErrorMsg] = useState('');
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  
  const [companies, setCompanies] = useState([]);
  const [activeCompanyId, setActiveCompanyId] = useState(localStorage.getItem('companyId'));
  
  const [formData, setFormData] = useState({
    name: '',
    industry: 'Computer Software',
    location: 'India',
    street1: '',
    street2: '',
    city: '',
    pincode: '',
    state: 'Tamil Nadu',
    phone: '',
    faxNumber: '',
    website: '',
    baseCurrency: 'INR',
    fiscalYear: 'April - March',
    reportBasis: 'Accrual',
    language: 'English',
    timezone: '(GMT 5:30) India Standard Time (Asia/Calcutta)',
    dateFormat: 'dd/MM/yyyy',
    organizationId: '',
    financialYearStart: new Date().getFullYear() + '-04-01',
    booksBeginningFrom: new Date().getFullYear() + '-04-01',
    logoUrl: '',
    gstNumber: '',
    panNumber: '',
    additionalFields: [],
  });

  const [createData, setCreateData] = useState({
    name: '',
    industry: 'Computer Software',
    location: 'India',
    street1: '',
    street2: '',
    city: '',
    pincode: '',
    state: 'Tamil Nadu',
    phone: '',
    website: '',
    baseCurrency: 'INR',
    fiscalYear: 'April - March',
    reportBasis: 'Accrual',
    financialYearStart: new Date().getFullYear() + '-04-01',
    booksBeginningFrom: new Date().getFullYear() + '-04-01',
    gstNumber: '',
    panNumber: '',
  });

  const fetchCompanies = async () => {
    setFetching(true);
    try {
      const res = await companyAPI.getAll();
      const allCos = res.data || [];
      setCompanies(allCos);
      
      const currentId = localStorage.getItem('companyId') || (allCos[0]?.id);
      if (currentId) {
        setActiveCompanyId(currentId);
        const activeRes = await companyAPI.getById(currentId);
        if (activeRes.data) {
          const d = activeRes.data;
          setFormData(prev => ({
            ...prev,
            ...d,
            financialYearStart: d.financialYearStart ? d.financialYearStart.split('T')[0] : prev.financialYearStart,
            booksBeginningFrom: d.booksBeginningFrom ? d.booksBeginningFrom.split('T')[0] : prev.booksBeginningFrom,
            additionalFields: Array.isArray(d.additionalFields) ? d.additionalFields : [],
          }));
        }
      }
    } catch (err) {
      console.error('Failed to load companies:', err.message);
    }
    setFetching(false);
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleUpdateField = (key, val) => {
    let finalVal = val;
    if (key === 'gstNumber' || key === 'panNumber') {
      finalVal = val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    }
    setFormData(prev => ({ ...prev, [key]: finalVal }));
  };

  const handleCreateField = (key, val) => {
    let finalVal = val;
    if (key === 'gstNumber' || key === 'panNumber') {
      finalVal = val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    }
    setCreateData(prev => ({ ...prev, [key]: finalVal }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 1024 * 1024) {
      setErrorMsg('Logo size should be less than 1MB');
      setStatus('error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, logoUrl: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const addAdditionalField = () => {
    setFormData(prev => ({
      ...prev,
      additionalFields: [...prev.additionalFields, { label: '', value: '' }]
    }));
  };

  const removeAdditionalField = (index) => {
    setFormData(prev => ({
      ...prev,
      additionalFields: prev.additionalFields.filter((_, i) => i !== index)
    }));
  };

  const updateAdditionalField = (index, field, value) => {
    setFormData(prev => {
      const newFields = [...prev.additionalFields];
      newFields[index][field] = value;
      return { ...prev, additionalFields: newFields };
    });
  };

  const handleSaveActive = async () => {
    if (!formData.name.trim()) { 
      setErrorMsg('Organization Name is required.'); 
      setStatus('error'); 
      return; 
    }
    if (formData.gstNumber && !validateGSTIN(formData.gstNumber)) {
      setErrorMsg('Invalid GSTIN format. Expected format: 33AAAAA1111A1Z1');
      setStatus('error');
      return;
    }
    if (formData.panNumber && !validatePAN(formData.panNumber)) {
      setErrorMsg('Invalid PAN format. Expected format: ABCDE1234F');
      setStatus('error');
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      await companyAPI.update(activeCompanyId, formData);
      setStatus('success');
      fetchCompanies();
      setTimeout(() => setStatus(null), 3000);
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMsg(err.response?.data?.error || err.message || 'Failed to save settings.');
    }
    setLoading(false);
  };

  const handleCreateCompany = async () => {
    if (!createData.name.trim()) {
      setErrorMsg('Organization Name is required.');
      setStatus('error');
      return;
    }
    if (createData.gstNumber && !validateGSTIN(createData.gstNumber)) {
      setErrorMsg('Invalid GSTIN format. Expected format: 33AAAAA1111A1Z1');
      setStatus('error');
      return;
    }
    if (createData.panNumber && !validatePAN(createData.panNumber)) {
      setErrorMsg('Invalid PAN format. Expected format: ABCDE1234F');
      setStatus('error');
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      const res = await companyAPI.create(createData);
      if (res.data?.id) {
        localStorage.setItem('companyId', res.data.id);
        localStorage.setItem('companyName', res.data.name);
        setActiveCompanyId(res.data.id);
        setStatus('success');
        
        // Reset creation form
        setCreateData({
          name: '',
          industry: 'Computer Software',
          location: 'India',
          street1: '',
          street2: '',
          city: '',
          pincode: '',
          state: 'Tamil Nadu',
          phone: '',
          website: '',
          baseCurrency: 'INR',
          fiscalYear: 'April - March',
          reportBasis: 'Accrual',
          financialYearStart: new Date().getFullYear() + '-04-01',
          booksBeginningFrom: new Date().getFullYear() + '-04-01',
          gstNumber: '',
          panNumber: '',
        });
        
        // Refresh companies list and activate it
        await fetchCompanies();
        setActiveTab('switch');
        if (onCompanyCreated) {
          onCompanyCreated(res.data.id, res.data.name);
        } else {
          window.location.reload();
        }
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMsg(err.response?.data?.error || err.message || 'Failed to create company.');
    }
    setLoading(false);
  };

  const switchActiveCompany = (id, name) => {
    localStorage.setItem('companyId', id);
    localStorage.setItem('companyName', name);
    setActiveCompanyId(id);
    window.location.reload();
  };

  if (fetching) return (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-50 text-slate-400 font-sans">
      <Loader2 size={32} className="animate-spin text-blue-600 mb-4" />
      <span className="text-sm font-semibold uppercase tracking-wider">Loading Company Hub...</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-32">
      
      {/* IMAGE ENLARGE MODAL */}
      {isImageZoomed && formData.logoUrl && (
        <div 
          className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setIsImageZoomed(false)}
        >
          <div className="bg-white rounded-lg p-2 max-w-4xl max-h-[90vh] shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <img src={formData.logoUrl} alt="Logo Enlarged" className="w-full h-full object-contain rounded" />
            <button 
              className="absolute top-6 right-8 text-white hover:text-red-400 transition-colors"
              onClick={() => setIsImageZoomed(false)}
            >
              <X size={32} />
            </button>
          </div>
        </div>
      )}

      {/* NAVBAR */}
      <nav className="h-16 border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 bg-white z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <Building2 className="text-blue-600" size={24} />
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            Company Info Hub
            {formData.name && !firstTime && (
              <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-100 uppercase tracking-widest">
                Active: {formData.name}
              </span>
            )}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {!firstTime && (
            <button 
              onClick={() => window.location.href = '/dashboard'}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 font-semibold px-4 py-2 border border-slate-200 rounded-lg bg-white shadow-sm hover:bg-slate-50 transition-colors"
            >
              Close Settings <X size={16} className="text-red-400" />
            </button>
          )}
        </div>
      </nav>

      {/* SUCCESS/ERROR TOASTS */}
      {status && (
        <div className={`fixed top-20 right-6 z-[100] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 border animate-in fade-in slide-in-from-top-4 ${
          status === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          {status === 'success' ? <CheckCircle2 size={20} className="text-emerald-600" /> : <AlertCircle size={20} className="text-rose-600" />}
          <span className="text-sm font-bold">{status === 'success' ? 'Changes saved successfully!' : errorMsg}</span>
        </div>
      )}

      {/* TABS CONTAINER */}
      {!firstTime && (
        <div className="bg-white border-b border-slate-200 sticky top-16 z-40 shadow-sm">
          <div className="max-w-6xl mx-auto px-8 flex gap-2">
            <TabButton active={activeTab === 'switch'} label="Switch Company" onClick={() => setActiveTab('switch')} />
            <TabButton active={activeTab === 'create'} label="Create Company" onClick={() => setActiveTab('create')} />
            <TabButton active={activeTab === 'edit'} label="Edit Active Company" onClick={() => setActiveTab('edit')} />
            <TabButton active={activeTab === 'gst_fy'} label="GST & Financial Year" onClick={() => setActiveTab('gst_fy')} />
          </div>
        </div>
      )}

      {/* CONTENT AREA */}
      <div className="max-w-6xl mx-auto px-8 py-10">
        
        {/* TAB 1: SWITCH COMPANY */}
        {activeTab === 'switch' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Select & Switch Workspace</h2>
                <p className="text-xs text-slate-500 mt-1">Click on any company below to activate and switch your context.</p>
              </div>
              <button 
                onClick={() => setActiveTab('create')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-all"
              >
                <Plus size={16} /> Create Company
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {companies.map(c => {
                const isActive = c.id === activeCompanyId;
                return (
                  <div 
                    key={c.id}
                    onClick={() => !isActive && switchActiveCompany(c.id, c.name)}
                    className={`border rounded-2xl p-6 bg-white shadow-sm flex flex-col justify-between transition-all relative overflow-hidden group
                      ${isActive 
                        ? 'border-blue-500 ring-2 ring-blue-500/10 cursor-default' 
                        : 'border-slate-200 hover:border-blue-400 hover:shadow-md cursor-pointer'}`}
                  >
                    {isActive && (
                      <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold uppercase px-3 py-1 rounded-bl-xl flex items-center gap-1 shadow-sm">
                        <Check size={11} strokeWidth={3} /> Active
                      </div>
                    )}

                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shrink-0
                          ${isActive ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-slate-50 border-slate-200 text-slate-400 group-hover:text-blue-500 group-hover:bg-blue-50/50 group-hover:border-blue-100 transition-all'}`}>
                          <Building2 size={24} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors">{c.name}</h3>
                          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">{c.industry || 'General Business'}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 py-3 border-y border-slate-50 text-center">
                        <div>
                          <div className="text-xs text-slate-400 font-bold uppercase">Ledgers</div>
                          <div className="text-lg font-extrabold text-slate-700 mt-0.5">{c.ledgerCount || 0}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-400 font-bold uppercase">Groups</div>
                          <div className="text-lg font-extrabold text-slate-700 mt-0.5">{c.groupCount || 0}</div>
                        </div>
                      </div>

                      <div className="space-y-1 text-xs text-slate-500 font-medium">
                        <div className="flex justify-between">
                          <span>GSTIN:</span>
                          <span className="font-bold text-slate-700">{c.gstNumber || 'Not Configured'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Financial Year:</span>
                          <span className="font-bold text-slate-700">{c.fiscalYear || 'April - March'}</span>
                        </div>
                      </div>
                    </div>

                    {!isActive && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); switchActiveCompany(c.id, c.name); }}
                        className="mt-6 w-full py-2 border border-slate-200 hover:border-blue-600 hover:bg-blue-600 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all text-slate-600"
                      >
                        Activate Workspace
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: CREATE COMPANY */}
        {activeTab === 'create' && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 max-w-4xl mx-auto">
            <div className="border-b border-slate-100 pb-5 mb-6">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Plus size={20} className="text-blue-600" /> Create New Company
              </h2>
              <p className="text-xs text-slate-500 mt-1">Once created, standard ledger groups will be auto-seeded for double-entry transactions.</p>
            </div>

            <div className="space-y-2">
              <InputRow label="Organization Name" keyName="name" value={createData.name} onChange={handleCreateField} required={true} placeholder="e.g. Acme Corp Pvt Ltd" />
              <SelectRow label="Industry" keyName="industry" value={createData.industry} onChange={handleCreateField} options={["Computer Software", "Accounting", "Manufacturing", "Retail", "Services", "Construction", "Distribution"]} />
              <SelectRow label="Organization Location" keyName="location" value={createData.location} onChange={handleCreateField} options={["India", "USA", "UK", "UAE", "Singapore"]} required={true} />
              
              <div className="flex flex-col gap-1.5 py-4 border-b border-slate-100 lg:flex-row lg:items-start">
                <label className="text-[13px] text-slate-600 font-bold lg:w-56 shrink-0 pt-2">Address Details</label>
                <div className="flex-1 max-w-md space-y-3">
                  <input type="text" placeholder="Street Address 1" value={createData.street1} onChange={e => handleCreateField('street1', e.target.value)} className="w-full h-10 border border-slate-200 rounded-lg px-3 text-[13px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 placeholder:text-slate-300" />
                  <input type="text" placeholder="Street Address 2 (Optional)" value={createData.street2} onChange={e => handleCreateField('street2', e.target.value)} className="w-full h-10 border border-slate-200 rounded-lg px-3 text-[13px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 placeholder:text-slate-300" />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder="City" value={createData.city} onChange={e => handleCreateField('city', e.target.value)} className="h-10 border border-slate-200 rounded-lg px-3 text-[13px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 placeholder:text-slate-300" />
                    <input type="text" placeholder="PIN Code" value={createData.pincode} onChange={e => handleCreateField('pincode', e.target.value)} className="h-10 border border-slate-200 rounded-lg px-3 text-[13px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 placeholder:text-slate-300" />
                  </div>
                  <select value={createData.state} onChange={e => handleCreateField('state', e.target.value)} className="w-full h-10 border border-slate-200 bg-white rounded-lg px-3 text-[13px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10">
                    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <InputRow label="GSTIN (GST Number)" keyName="gstNumber" value={createData.gstNumber} onChange={handleCreateField} placeholder="e.g. 33AAAAA1111A1Z1" maxLength={15} />
              <InputRow label="PAN" keyName="panNumber" value={createData.panNumber} onChange={handleCreateField} placeholder="e.g. ABCDE1234F" maxLength={10} />

              <div className="bg-slate-50 rounded-xl p-6 mt-6 border border-slate-100 space-y-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                  <Calendar size={15} className="text-blue-500" /> Financial Settings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Financial Year Starts From</label>
                    <input 
                      type="date" 
                      value={createData.financialYearStart} 
                      onChange={e => handleCreateField('financialYearStart', e.target.value)}
                      className="w-full h-10 border border-slate-200 bg-white rounded-lg px-3 text-[13px] outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Books Beginning From</label>
                    <input 
                      type="date" 
                      value={createData.booksBeginningFrom} 
                      onChange={e => handleCreateField('booksBeginningFrom', e.target.value)}
                      className="w-full h-10 border border-slate-200 bg-white rounded-lg px-3 text-[13px] outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <SelectRow label="Base Currency" keyName="baseCurrency" value={createData.baseCurrency} onChange={handleCreateField} options={CURRENCIES.map(c => c.code)} />
                  <SelectRow label="Report Basis" keyName="reportBasis" value={createData.reportBasis} onChange={handleCreateField} options={["Accrual", "Cash"]} />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-5 border-t border-slate-100">
              <button 
                onClick={() => setActiveTab('switch')}
                className="px-6 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateCompany}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-blue-500/20"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Create Company
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: EDIT ACTIVE COMPANY */}
        {activeTab === 'edit' && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 max-w-4xl mx-auto">
            <div className="border-b border-slate-100 pb-5 mb-6 flex justify-between items-start">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Edit Company Profile</h2>
                <p className="text-xs text-slate-500 mt-1">Configure general contact, address, and localizations for the active company.</p>
              </div>
            </div>

            {/* LOGO SECTION */}
            <div className="flex items-start gap-8 border-b border-slate-100 pb-8 mb-6">
              <div className="relative group shrink-0">
                <input 
                  type="file" 
                  id="logo-upload" 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleLogoUpload}
                />
                <div 
                  className={`w-36 h-36 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center transition-all bg-slate-50 p-1 relative overflow-hidden group/box
                    ${!formData.logoUrl ? 'hover:bg-slate-100 hover:border-blue-300 cursor-pointer' : ''}`}
                >
                  {formData.logoUrl ? (
                    <div className="relative w-full h-full">
                      <img 
                        src={formData.logoUrl} 
                        alt="Logo Preview" 
                        className="w-full h-full object-contain rounded-xl cursor-zoom-in" 
                        onClick={() => setIsImageZoomed(true)}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover/box:bg-black/5 transition-colors pointer-events-none flex items-center justify-center">
                        <Maximize2 className="text-white opacity-0 group-hover/box:opacity-100 transition-opacity" size={20} />
                      </div>
                    </div>
                  ) : (
                    <label htmlFor="logo-upload" className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                      <Upload size={20} className="text-slate-300 group-hover:text-blue-400 mb-2" />
                      <span className="text-[10px] font-bold text-slate-400 text-center px-4 leading-relaxed uppercase tracking-wider">
                        Upload Logo
                      </span>
                    </label>
                  )}
                </div>
                {formData.logoUrl && (
                  <>
                    <button 
                      onClick={() => setFormData(p => ({ ...p, logoUrl: '' }))}
                      className="absolute -top-2 -right-2 bg-white border border-slate-200 rounded-full p-1.5 text-slate-400 hover:text-rose-500 shadow-md z-10"
                    >
                      <Trash2 size={12} />
                    </button>
                  </>
                )}
              </div>
              <div className="flex-1 text-xs text-slate-500 pt-2 leading-relaxed">
                <p className="font-bold text-slate-700">Organization Logo</p>
                <p className="mt-1">Displays on reports, sales invoices, and customer receipts.</p>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mt-3 space-y-0.5 text-[11px] font-medium text-slate-400">
                  <p>• Max File Size: 1MB</p>
                  <p>• Dimensions: Square ratios (e.g. 240x240 px)</p>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <InputRow label="Organization Name" keyName="name" value={formData.name} onChange={handleUpdateField} required={true} />
              <SelectRow label="Industry" keyName="industry" value={formData.industry} onChange={handleUpdateField} options={["Computer Software", "Accounting", "Manufacturing", "Retail", "Services", "Construction", "Distribution"]} />
              <SelectRow label="Organization Location" keyName="location" value={formData.location} onChange={handleUpdateField} options={["India", "USA", "UK", "UAE", "Singapore"]} required={true} />
              
              <div className="flex flex-col gap-1.5 py-4 border-b border-slate-100 lg:flex-row lg:items-start">
                <label className="text-[13px] text-slate-600 font-bold lg:w-56 shrink-0 pt-2">Address Details</label>
                <div className="flex-1 max-w-md space-y-3">
                  <input type="text" placeholder="Street Address 1" value={formData.street1 || ''} onChange={e => handleUpdateField('street1', e.target.value)} className="w-full h-10 border border-slate-200 rounded-lg px-3 text-[13px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 placeholder:text-slate-300" />
                  <input type="text" placeholder="Street Address 2 (Optional)" value={formData.street2 || ''} onChange={e => handleUpdateField('street2', e.target.value)} className="w-full h-10 border border-slate-200 rounded-lg px-3 text-[13px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 placeholder:text-slate-300" />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder="City" value={formData.city || ''} onChange={e => handleUpdateField('city', e.target.value)} className="h-10 border border-slate-200 rounded-lg px-3 text-[13px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 placeholder:text-slate-300" />
                    <input type="text" placeholder="PIN Code" value={formData.pincode || ''} onChange={e => handleUpdateField('pincode', e.target.value)} className="h-10 border border-slate-200 rounded-lg px-3 text-[13px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 placeholder:text-slate-300" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <select value={formData.state || ''} onChange={e => handleUpdateField('state', e.target.value)} className="h-10 border border-slate-200 bg-white rounded-lg px-3 text-[13px] outline-none focus:border-blue-500">
                      {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <input type="text" placeholder="Phone" value={formData.phone || ''} onChange={e => handleUpdateField('phone', e.target.value)} className="h-10 border border-slate-200 rounded-lg px-3 text-[13px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 placeholder:text-slate-300" />
                  </div>
                </div>
              </div>

              <InputRow label="Website URL" keyName="website" value={formData.website} onChange={handleUpdateField} placeholder="www.yourcompany.com" />
              <SelectRow label="Language" keyName="language" value={formData.language} onChange={handleUpdateField} options={["English", "Hindi", "Tamil", "Spanish", "French", "German"]} />
              <SelectRow label="Date Format" keyName="dateFormat" value={formData.dateFormat} onChange={handleUpdateField} options={["dd/MM/yyyy", "MM/dd/yyyy", "yyyy-MM-dd", "dd-MMM-yyyy"]} />
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-5 border-t border-slate-100">
              <button 
                onClick={handleSaveActive}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-blue-500/20"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Changes
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: GST & FY DETAILS */}
        {activeTab === 'gst_fy' && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 max-w-4xl mx-auto">
            <div className="border-b border-slate-100 pb-5 mb-6">
              <h2 className="text-lg font-bold text-slate-800">GST & Financial Year Configurations</h2>
              <p className="text-xs text-slate-500 mt-1">Review state localizations, tax registrations, and accounting calendar settings.</p>
            </div>

            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-4 mb-4">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 mb-4">
                  <Landmark size={16} className="text-blue-500" /> Tax Identification details
                </h3>
                <SelectRow label="Registration State" keyName="state" value={formData.state} onChange={handleUpdateField} options={INDIAN_STATES} />
                <InputRow label="GSTIN (GST Number)" keyName="gstNumber" value={formData.gstNumber} onChange={handleUpdateField} placeholder="e.g. 33AAAAA1111A1Z1" maxLength={15} />
                <InputRow label="PAN Number" keyName="panNumber" value={formData.panNumber} onChange={handleUpdateField} placeholder="e.g. ABCDE1234F" maxLength={10} />
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 mb-4">
                  <Calendar size={16} className="text-blue-500" /> Financial Year configuration
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Financial Year Starts From</label>
                    <input 
                      type="date" 
                      value={formData.financialYearStart} 
                      onChange={e => handleUpdateField('financialYearStart', e.target.value)}
                      className="w-full h-10 border border-slate-200 bg-white rounded-lg px-3 text-[13px] outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Books Beginning From</label>
                    <input 
                      type="date" 
                      value={formData.booksBeginningFrom} 
                      onChange={e => handleUpdateField('booksBeginningFrom', e.target.value)}
                      className="w-full h-10 border border-slate-200 bg-white rounded-lg px-3 text-[13px] outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
                <SelectRow label="Fiscal Year Range" keyName="fiscalYear" value={formData.fiscalYear} onChange={handleUpdateField} options={["April - March", "January - December", "July - June", "October - September"]} />
                <SelectRow label="Base Currency" keyName="baseCurrency" value={formData.baseCurrency} onChange={handleUpdateField} options={CURRENCIES.map(c => c.code)} />
                <SelectRow label="Reporting Basis" keyName="reportBasis" value={formData.reportBasis} onChange={handleUpdateField} options={["Accrual", "Cash"]} />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-5 border-t border-slate-100">
              <button 
                onClick={handleSaveActive}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-blue-500/20"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Configurations
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default CompanyInfoView;
