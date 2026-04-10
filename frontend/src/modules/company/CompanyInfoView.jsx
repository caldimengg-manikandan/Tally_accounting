import React, { useState, useEffect } from 'react';
import { 
  Building2, Save, ArrowLeft, Upload, 
  CheckCircle2, AlertCircle, Loader2, HelpCircle, 
  Globe, Mail, Phone, ExternalLink, Plus, Trash2, X, Maximize2
} from 'lucide-react';
import { companyAPI } from '../../services/api';
import { INDIAN_STATES } from '../../utils/indianStates';
import { CURRENCIES } from '../../utils/currencies';

const InputRow = ({ label, keyName, value, onChange, type = "text", placeholder = "", required = false, help = false }) => (
  <div className="flex flex-col gap-1.5 py-3 border-b border-gray-50 last:border-0 lg:flex-row lg:items-center">
    <label className="text-[13px] text-gray-600 font-medium lg:w-48 shrink-0 flex items-center gap-1">
      {label} {required && <span className="text-red-500 font-bold">*</span>}
      {help && <HelpCircle size={14} className="text-gray-400 cursor-help" />}
    </label>
    <input 
      type={type}
      placeholder={placeholder}
      value={value || ''}
      onChange={(e) => onChange(keyName, e.target.value)}
      className="flex-1 max-w-md h-9 border border-gray-300 rounded px-3 text-[13px] text-gray-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all placeholder:text-gray-300 font-sans"
    />
  </div>
);

const SelectRow = ({ label, keyName, value, onChange, options, required = false, help = false }) => (
  <div className="flex flex-col gap-1.5 py-3 border-b border-gray-50 last:border-0 lg:flex-row lg:items-center">
    <label className="text-[13px] text-gray-600 font-medium lg:w-48 shrink-0 flex items-center gap-1">
      {label} {required && <span className="text-red-500 font-bold">*</span>}
      {help && <HelpCircle size={14} className="text-gray-400 cursor-help" />}
    </label>
    <select 
      value={value || ''}
      onChange={(e) => onChange(keyName, e.target.value)}
      className="flex-1 max-w-md h-9 border border-gray-300 rounded px-3 text-[13px] text-gray-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat font-sans"
    >
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);

const CompanyInfoView = () => {
  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(true);
  const [status, setStatus]     = useState(null); // 'success' | 'error' | null
  const [errorMsg, setErrorMsg] = useState('');
  const [existingId, setExistingId] = useState(null);
  const [isImageZoomed, setIsImageZoomed] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    industry: '',
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
    additionalFields: [],
  });

  useEffect(() => {
    const savedId = localStorage.getItem('companyId');
    const loadCompany = async () => {
      setFetching(true);
      try {
        if (savedId) {
          const res = await companyAPI.getById(savedId);
          if (res.data?.id) {
            setExistingId(res.data.id);
            const d = res.data;
            setFormData(prev => ({
              ...prev,
              ...d,
              financialYearStart: d.financialYearStart ? d.financialYearStart.split('T')[0] : prev.financialYearStart,
              booksBeginningFrom: d.booksBeginningFrom ? d.booksBeginningFrom.split('T')[0] : prev.booksBeginningFrom,
              additionalFields: Array.isArray(d.additionalFields) ? d.additionalFields : [],
            }));
            setFetching(false);
            return;
          }
        }
        const all = await companyAPI.getAll();
        if (all.data?.length > 0) {
          const c = all.data[0];
          setExistingId(c.id);
          localStorage.setItem('companyId', c.id);
          setFormData(prev => ({
            ...prev,
            ...c,
            financialYearStart: c.financialYearStart ? c.financialYearStart.split('T')[0] : prev.financialYearStart,
            booksBeginningFrom: c.booksBeginningFrom ? c.booksBeginningFrom.split('T')[0] : prev.booksBeginningFrom,
            additionalFields: Array.isArray(c.additionalFields) ? c.additionalFields : [],
          }));
        }
      } catch (err) {
        console.error('Failed to load company:', err.message);
      }
      setFetching(false);
    };
    loadCompany();
  }, []);

  const handleUpdateField = (key, val) => {
    setFormData(prev => ({ ...prev, [key]: val }));
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

  const handleSave = async () => {
    if (!formData.name.trim()) { 
      setErrorMsg('Organization Name is required.'); 
      setStatus('error'); 
      return; 
    }
    setLoading(true);
    setStatus(null);
    try {
      const payload = { ...formData };
      let res;
      if (existingId) {
        res = await companyAPI.update(existingId, payload);
        setStatus('success');
      } else {
        res = await companyAPI.create(payload);
        if (res.data?.id) {
          localStorage.setItem('companyId', res.data.id);
          setExistingId(res.data.id);
          setStatus('success');
        }
      }
      setTimeout(() => setStatus(null), 3000);
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMsg(err.response?.data?.error || err.message || 'Failed to save settings.');
    }
    setLoading(false);
  };

  if (fetching) return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50 text-gray-400 font-sans">
      <Loader2 size={32} className="animate-spin text-blue-600 mb-4" />
      <span className="text-sm font-medium">Loading Organization Profile...</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 pb-32">
      
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
      <nav className="h-14 border-b border-gray-200 px-6 flex items-center justify-between sticky top-0 bg-white z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold flex items-center gap-2">
            Organization Profile 
            {formData.organizationId && (
              <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-[11px] font-medium border border-gray-200">
                ID: {formData.organizationId}
              </span>
            )}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.location.href = '/dashboard'}
            className="flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-800 font-medium px-3 py-1.5 rounded transition-colors"
          >
            Close Settings <X size={16} className="text-red-400" />
          </button>
        </div>
      </nav>

      {/* SUCCESS/ERROR TOASTS */}
      {status && (
        <div className={`fixed top-16 right-6 z-[100] px-6 py-3 rounded shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 ${
          status === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
        }`}>
          {status === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span className="text-sm font-medium">{status === 'success' ? 'Settings saved successfully!' : errorMsg}</span>
        </div>
      )}

      {/* CONTENT AREA */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        
        {/* LOGO SECTION */}
        <section className="mb-10">
          <h2 className="text-[15px] font-medium text-gray-400 mb-4 uppercase tracking-wider">Organization Logo</h2>
          <div className="flex items-start gap-8 border-b border-gray-100 pb-10">
            <div className="relative group shrink-0">
              <input 
                type="file" 
                id="logo-upload" 
                className="hidden" 
                accept="image/*"
                onChange={handleLogoUpload}
              />
              <div 
                className={`w-40 h-40 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center transition-all bg-gray-50 p-1 relative overflow-hidden group/box
                  ${!formData.logoUrl ? 'hover:bg-gray-100 hover:border-blue-300 cursor-pointer' : ''}`}
              >
                {formData.logoUrl ? (
                  <div className="relative w-full h-full">
                    <img 
                      src={formData.logoUrl} 
                      alt="Logo Preview" 
                      className="w-full h-full object-contain rounded cursor-zoom-in" 
                      onClick={() => setIsImageZoomed(true)}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover/box:bg-black/5 transition-colors pointer-events-none flex items-center justify-center">
                      <Maximize2 className="text-white opacity-0 group-hover/box:opacity-100 transition-opacity" size={24} />
                    </div>
                  </div>
                ) : (
                  <label htmlFor="logo-upload" className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                    <Upload size={24} className="text-gray-300 group-hover:text-blue-400 mb-2" />
                    <span className="text-[11px] font-medium text-gray-400 text-center px-4 leading-relaxed">
                      Upload Your Organization Logo
                      <div className="mt-2 text-[10px] font-normal text-gray-300 leading-tight">
                        Preferred: 240x240 pixels<br/>Max: 1MB
                      </div>
                    </span>
                  </label>
                )}
              </div>
              {formData.logoUrl && (
                <>
                  <button 
                    onClick={() => setFormData(p => ({ ...p, logoUrl: '' }))}
                    className="absolute -top-2 -right-2 bg-white border border-gray-200 rounded-full p-1 text-gray-400 hover:text-rose-500 shadow-sm z-10"
                  >
                    <Trash2 size={12} />
                  </button>
                  <label htmlFor="logo-upload" className="mt-2 flex items-center justify-center text-[11px] text-blue-600 font-bold hover:underline cursor-pointer">
                    Change Logo
                  </label>
                </>
              )}
            </div>
            
            {/* INSTRUCTIONS */}
            {!formData.logoUrl && (
              <div className="flex-1 text-[12px] text-gray-500 space-y-1.5 pt-2 leading-relaxed animate-in fade-in duration-500">
                <p className="font-medium text-gray-700">This logo will be displayed in transaction PDFs and email notifications.</p>
                <div className="bg-gray-50/50 p-4 rounded border border-gray-100 mt-4 space-y-1">
                  <p>• Preferred Image Dimensions: 240 x 240 pixels @ 72 DPI</p>
                  <p>• Supported Files: jpg, jpeg, png, gif, bmp</p>
                  <p>• Maximum File Size: 1MB</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* PROFILE FIELDS */}
        <div className="space-y-1">
          
          <InputRow label="Organization Name" keyName="name" value={formData.name} onChange={handleUpdateField} required={true} />
          <SelectRow label="Industry" keyName="industry" value={formData.industry} onChange={handleUpdateField} help={true} options={["Computer Software", "Accounting", "Manufacturing", "Retail", "Services", "Construction", "Distribution"]} />
          <SelectRow label="Organization Location" keyName="location" value={formData.location} onChange={handleUpdateField} options={["India", "USA", "UK", "UAE", "Singapore"]} required={true} />

          {/* ADDRESS BLOCK */}
          <div className="flex flex-col gap-1.5 py-4 border-b border-gray-50 lg:flex-row lg:items-start">
            <label className="text-[13px] text-gray-600 font-medium lg:w-48 shrink-0 flex items-center gap-1 py-1">
              Organization Address <HelpCircle size={14} className="text-gray-400 cursor-help" />
            </label>
            <div className="flex-1 max-w-md space-y-3 font-sans">
              <input type="text" placeholder="Street 1" value={formData.street1 || ''} onChange={e => handleUpdateField('street1', e.target.value)} className="w-full h-9 border border-gray-300 rounded px-3 text-[13px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 placeholder:text-gray-300" />
              <input type="text" placeholder="Street 2" value={formData.street2 || ''} onChange={e => handleUpdateField('street2', e.target.value)} className="w-full h-9 border border-gray-300 rounded px-3 text-[13px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 placeholder:text-gray-300" />
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="City" value={formData.city || ''} onChange={e => handleUpdateField('city', e.target.value)} className="h-9 border border-gray-300 rounded px-3 text-[13px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 placeholder:text-gray-300" />
                <input type="text" placeholder="Pin Code" value={formData.pincode || ''} onChange={e => handleUpdateField('pincode', e.target.value)} className="h-9 border border-gray-300 rounded px-3 text-[13px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 placeholder:text-gray-300" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select value={formData.state || ''} onChange={e => handleUpdateField('state', e.target.value)} className="h-9 border border-gray-300 rounded px-3 text-[13px] outline-none focus:border-blue-500 bg-white">
                  {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <input type="text" placeholder="Phone" value={formData.phone || ''} onChange={e => handleUpdateField('phone', e.target.value)} className="h-9 border border-gray-300 rounded px-3 text-[13px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 placeholder:text-gray-300" />
              </div>
              <input type="text" placeholder="Fax Number" value={formData.faxNumber || ''} onChange={e => handleUpdateField('faxNumber', e.target.value)} className="w-full h-9 border border-gray-300 rounded px-3 text-[13px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 placeholder:text-gray-300" />
              <button className="text-[12px] text-blue-600 font-medium hover:underline flex items-center gap-1">
                Organization Address Format {' >'}
              </button>
            </div>
          </div>

          <InputRow label="Website URL" keyName="website" value={formData.website} onChange={handleUpdateField} placeholder="www.yourcompany.com" />

          {/* FINANCIAL SETTINGS */}
          <div className="pt-12 mb-6 border-b border-gray-100 pb-3 text-gray-400 font-bold text-[14px] uppercase tracking-widest">Regional Settings</div>
          
          <SelectRow label="Base Currency" keyName="baseCurrency" value={formData.baseCurrency} onChange={handleUpdateField} help={true} options={CURRENCIES.map(c => c.code)} />
          <SelectRow label="Fiscal Year" keyName="fiscalYear" value={formData.fiscalYear} onChange={handleUpdateField} options={["April - March", "January - December", "July - June", "October - September"]} />
          
          <div className="flex flex-col gap-1.5 py-4 border-b border-gray-50 lg:flex-row lg:items-center">
            <label className="text-[13px] text-gray-600 font-medium lg:w-48 shrink-0">Report Basis</label>
            <div className="flex items-center gap-8">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <input 
                  type="radio" 
                  name="reportBasis" 
                  checked={formData.reportBasis === 'Accrual'} 
                  onChange={() => handleUpdateField('reportBasis', 'Accrual')}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 transition-all font-sans"
                />
                <span className="text-[13px] text-gray-700 font-medium">Accrual <span className="text-gray-400 font-normal text-[11px] ml-1.5">• You owe tax as of invoice date</span></span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <input 
                  type="radio" 
                  name="reportBasis" 
                  checked={formData.reportBasis === 'Cash'} 
                  onChange={() => handleUpdateField('reportBasis', 'Cash')}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 transition-all font-sans"
                />
                <span className="text-[13px] text-gray-700 font-medium">Cash <span className="text-gray-400 font-normal text-[11px] ml-1.5">• You owe tax upon payment receipt</span></span>
              </label>
            </div>
          </div>

          <SelectRow label="Organization Language" keyName="language" value={formData.language} onChange={handleUpdateField} help={true} options={["English", "Hindi", "Tamil", "Spanish", "French", "German"]} />
          <SelectRow label="Time Zone" keyName="timezone" value={formData.timezone} onChange={handleUpdateField} options={["(GMT 5:30) India Standard Time (Asia/Calcutta)", "(UTC 00:00) Dublin, London", "(UTC -05:00) Eastern Time (US & Canada)", "(UTC +04:00) Abu Dhabi, Muscat"]} />
          
          <div className="flex flex-col gap-1.5 py-4 border-b border-gray-50 lg:flex-row lg:items-center">
            <label className="text-[13px] text-gray-600 font-medium lg:w-48 shrink-0">Date Format</label>
            <div className="flex items-center gap-3">
              <select 
                value={formData.dateFormat || 'dd/MM/yyyy'}
                onChange={e => handleUpdateField('dateFormat', e.target.value)}
                className="h-9 border border-gray-300 rounded px-3 text-[13px] text-gray-800 outline-none focus:border-blue-500 min-w-[120px] bg-white transition-all font-sans"
              >
                <option value="dd/MM/yyyy">dd/MM/yyyy</option>
                <option value="MM/dd/yyyy">MM/dd/yyyy</option>
                <option value="yyyy-MM-dd">yyyy-MM-dd</option>
                <option value="dd-MMM-yyyy">dd-MMM-yyyy</option>
              </select>
            </div>
          </div>

          {/* ADDITIONAL FIELDS */}
          <div className="pt-12 mb-6 border-b border-gray-100 pb-3 text-gray-400 font-bold text-[14px] uppercase tracking-widest">Additional Fields</div>
          <div className="max-w-2xl border border-gray-200 rounded overflow-hidden shadow-sm bg-white">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-2.5 px-4 text-[11px] uppercase tracking-wider text-gray-500 font-bold border-r border-gray-200 w-[45%]">Label Name</th>
                  <th className="text-left py-2.5 px-4 text-[11px] uppercase tracking-wider text-gray-500 font-bold">Value</th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {formData.additionalFields.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="py-8 text-center text-gray-400 text-[13px] italic">No additional fields added yet.</td>
                  </tr>
                ) : (
                  formData.additionalFields.map((field, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="py-2 px-3 border-r border-gray-100">
                        <input 
                          type="text" 
                          placeholder="Label (e.g. GSTIN)" 
                          value={field.label}
                          onChange={(e) => updateAdditionalField(idx, 'label', e.target.value)}
                          className="w-full h-8 bg-transparent text-[13px] outline-none focus:bg-white px-2 rounded"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input 
                          type="text" 
                          placeholder="Value" 
                          value={field.value}
                          onChange={(e) => updateAdditionalField(idx, 'value', e.target.value)}
                          className="w-full h-8 bg-transparent text-[13px] outline-none focus:bg-white px-2 rounded"
                        />
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button 
                          onClick={() => removeAdditionalField(idx)}
                          className="text-gray-300 hover:text-red-500 transition-colors p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <button 
            onClick={addAdditionalField}
            className="mt-4 flex items-center gap-1.5 text-blue-600 font-bold text-[13px] hover:text-blue-700 transition-all hover:bg-blue-50 px-3 py-2 rounded-md -ml-3"
          >
            <Plus size={16} /> New Field
          </button>
        </div>
      </div>

      {/* FOOTER BAR */}
      <footer className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 px-10 flex items-center gap-5 shadow-[0_-10px_25px_rgba(0,0,0,0.05)] z-50">
        <button 
          onClick={handleSave}
          disabled={loading}
          className="bg-blue-600 text-white px-8 py-2.5 rounded font-bold text-[13px] hover:bg-blue-700 flex items-center gap-2.5 shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save
        </button>
        <button 
          onClick={() => window.location.href = '/dashboard'}
          className="bg-white border border-gray-300 text-gray-700 px-8 py-2.5 rounded font-bold text-[13px] hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm active:scale-95"
        >
          Cancel
        </button>
      </footer>
    </div>
  );
};

export default CompanyInfoView;
