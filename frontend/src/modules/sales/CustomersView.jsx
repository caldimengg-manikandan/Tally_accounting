import React, { useState, useEffect } from 'react';
import { 
  Info, Mail, Phone, MapPin, Building, ShieldCheck, 
  AlertCircle, Loader2, Plus, Save, X, Activity, CheckCircle2,
  ChevronRight, ArrowRight, Copy, Trash2, MoreVertical,
  Upload, FileText, Globe, CreditCard, Clock, Download, Search
} from 'lucide-react';
import { ledgerAPI, groupAPI } from '../../services/api';
import { COUNTRY_CODES } from '../../utils/countryCodes';
import { INDIAN_STATES } from '../../utils/indianStates';

const CustomersView = () => {
  // Main Form State
  const [customerType, setCustomerType] = useState('Business');
  const [salutation, setSalutation] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [workPhone, setWorkPhone] = useState('');
  const [mobile, setMobile] = useState('');
  const [language, setLanguage] = useState('English');
  
  // Other Details State
  const [pan, setPan] = useState('');
  const [currency, setCurrency] = useState('INR- Indian Rupee');
  const [receivableAccount, setReceivableAccount] = useState('');
  const [openingBalance, setOpeningBalance] = useState('0');
  const [paymentTerms, setPaymentTerms] = useState('Due on Receipt');
  const [portalEnabled, setPortalEnabled] = useState(false);
  const [documents, setDocuments] = useState([]);

  // Prefill Modal State
  const [isPrefillOpen, setIsPrefillOpen] = useState(false);
  const [gstin, setGstin] = useState('');
  const [isFetching, setIsFetching] = useState(false);

  // Tabs State
  const [activeTab, setActiveTab] = useState('Other Details'); 
  const tabs = ['Other Details', 'Address', 'Contact Persons'];

  // Address State
  const initialAddress = {
    attention: '', country: 'Select', street1: '', street2: '', city: '', state: 'Select or type to add', pinCode: '', phone: '', fax: ''
  };
  const [billingAddress, setBillingAddress] = useState({ ...initialAddress });
  const [shippingAddress, setShippingAddress] = useState({ ...initialAddress });

  // Contact Persons State
  const [contactPersons, setContactPersons] = useState([
    { id: Date.now(), salutation: '', firstName: '', lastName: '', email: '', workPhone: '', mobile: '' }
  ]);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [groupId, setGroupId] = useState(null);
  const companyId = localStorage.getItem('companyId');

  // Currency Modal State
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
  const [customCurrencies, setCustomCurrencies] = useState([]);
  const [newCurrency, setNewCurrency] = useState({
    code: '', symbol: '', name: '', decimalPlaces: '', format: ''
  });

  // Configure Terms Modal State
  const [isConfigureTermsOpen, setIsConfigureTermsOpen] = useState(false);
  const [paymentTermsList, setPaymentTermsList] = useState([
    { name: 'Due end of next month', days: 'N/A', isDefault: true },
    { name: 'Due end of the month', days: 'N/A', isDefault: true },
    { name: 'Due on Receipt', days: '0', isDefault: true },
    { name: 'Net 15', days: '15', isDefault: true },
    { name: 'Net 30', days: '30', isDefault: true },
    { name: 'Net 45', days: '45', isDefault: true },
    { name: 'Net 60', days: '60', isDefault: true },
  ]);
  const [newTermName, setNewTermName] = useState('');
  const [newTermDays, setNewTermDays] = useState('');
  const [isAddingNewTerm, setIsAddingNewTerm] = useState(false);

  const countryOptions = ['Select', ...COUNTRY_CODES.map(c => c.country)];

  const handleCurrencyChange = (e) => {
    if (e.target.value === 'add_new') {
      setIsCurrencyModalOpen(true);
      e.target.value = currency;
    } else {
      setCurrency(e.target.value);
    }
  };

  const handlePaymentTermsChange = (e) => {
    if (e.target.value === 'configure_terms') {
      setIsConfigureTermsOpen(true);
      e.target.value = paymentTerms;
    } else {
      setPaymentTerms(e.target.value);
    }
  };

  const saveConfiguredTerm = () => {
    // If we are in the middle of adding a new term, add it to the list
    if (isAddingNewTerm && newTermName.trim()) {
      const newTerm = { name: newTermName.trim(), days: newTermDays || '0', isDefault: false };
      setPaymentTermsList(prev => [...prev, newTerm]);
      setPaymentTerms(newTerm.name); // Select the new term
      setIsAddingNewTerm(false);
      setNewTermName('');
      setNewTermDays('');
    }
    // Always close the modal when "Save" is clicked
    setIsConfigureTermsOpen(false);
  };

  const saveCustomCurrency = () => {
     if(newCurrency.code && newCurrency.symbol && newCurrency.name) {
       const val = `${newCurrency.code}- ${newCurrency.name}`;
       setCustomCurrencies([...customCurrencies, { value: val }]);
       setCurrency(val);
       setIsCurrencyModalOpen(false);
       setNewCurrency({ code: '', symbol: '', name: '', decimalPlaces: '', format: '' });
     }
  };

  // Exact styles from reference image
  const rowStyle = "flex items-start gap-10 mb-6 max-w-[1000px]";
  const labelColStyle = "w-1/3 flex items-center gap-2 text-[14px] font-normal text-[#2c3e50] mt-2.5";
  const inputColStyle = "w-2/3";
  const inputStyle = "w-full px-3 py-2 bg-white border border-[#d1d5db] rounded-md text-[14px] text-slate-800 outline-none focus:border-[#1e61f0] focus:ring-1 focus:ring-[#1e61f0] transition-all placeholder:text-[#9ca3af]";
  const selectStyle = "w-full px-3 py-2 bg-white border border-[#d1d5db] rounded-md text-[14px] text-slate-800 outline-none focus:border-[#1e61f0] focus:ring-1 focus:ring-[#1e61f0] transition-all appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C/polyline%3E%3C/svg%3E')] bg-[length:14px] bg-[right_10px_center] bg-no-repeat";
  
  const addressInputStyle = "w-full px-3 py-2 bg-white border border-[#d1d5db] rounded-md text-[14px] text-slate-700 focus:border-[#1e61f0] outline-none transition-all placeholder:text-[#9ca3af]";

  useEffect(() => {
    if (!companyId) return;
    groupAPI.getByCompany(companyId).then(res => {
      const debtorGroup = res.data.find(g => g.name.toLowerCase().includes('debtor'));
      if (debtorGroup) setGroupId(debtorGroup.id);
    });
  }, [companyId]);

  // Handlers
  const copyBillingToShipping = () => setShippingAddress({ ...billingAddress });
  const handleAddressChange = (type, field, value) => {
    if (type === 'billing') setBillingAddress(prev => ({ ...prev, [field]: value }));
    else setShippingAddress(prev => ({ ...prev, [field]: value }));
  };
  const addContactPerson = () => setContactPersons([...contactPersons, { id: Date.now(), salutation: '', firstName: '', lastName: '', email: '', workPhone: '', mobile: '' }]);
  const removeContactPerson = (id) => { if (contactPersons.length === 1) return; setContactPersons(contactPersons.filter(c => c.id !== id)); };
  const updateContactPerson = (id, field, value) => { setContactPersons(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c)); };

  const handleFetchGst = async (e) => {
     e.preventDefault();
     if (!gstin) return;
     setIsFetching(true);
     // Simulate GST lookup
     setTimeout(() => {
        setIsFetching(false);
        setIsPrefillOpen(false);
        setCompanyName('GST Resolved Business Name Ltd.');
        setPan(gstin.substring(2, 12).toUpperCase());
        setBillingAddress(prev => ({ ...prev, street1: 'Mapped from GST Portal', city: 'Chennai', state: 'Tamil Nadu' }));
     }, 1500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!groupId) { setError("Accounting configuration required."); return; }
    setLoading(true); setError(''); setSuccess(false);

    const ledgerName = customerType === 'Business' ? companyName : `${salutation} ${firstName} ${lastName}`.trim();

    const data = {
      name: ledgerName,
      customerType, salutation, firstName, lastName, companyName,
      workPhone, mobile, language,
      companyId, groupId,
      openingBalance: parseFloat(openingBalance || 0),
      email, phone: mobile,
      currentBalance: parseFloat(openingBalance || 0),
      billingAddressJson: JSON.stringify(billingAddress),
      shippingAddressJson: JSON.stringify(shippingAddress),
      contactPersonsJson: JSON.stringify(contactPersons),
      pan, currency, receivableAccount, paymentTerms, portalEnabled,
      documentsJson: JSON.stringify(documents),
      address: billingAddress.street1
    };

    try {
      await ledgerAPI.create(data);
      setSuccess(true); window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(err.response?.data?.error || 'Submission failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#fbfcff] min-h-screen py-6 font-sans relative">
      
      {/* ── PREFILL MODAL (EXACT IMAGE FORMAT) ───────────────────────── */}
      {isPrefillOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 bg-black/5 backdrop-blur-[1px] animate-fade-in">
           <div className="bg-white w-[600px] border border-slate-200 shadow-2xl rounded-lg overflow-hidden animate-slide-up">
              <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                 <h2 className="text-[17px] font-normal text-[#1a202c]">Prefill Customer Details From the GST Portal</h2>
                 <button onClick={() => setIsPrefillOpen(false)} className="text-red-400 hover:text-red-600 transition-colors">
                    <X size={20} strokeWidth={2.5}/>
                 </button>
              </div>
              <div className="p-8">
                 <div className="flex flex-col gap-3">
                    <label className="text-[13px] font-medium text-[#d9534f]">GSTIN/UIN*</label>
                    <div className="flex items-center gap-4">
                       <input 
                         type="text" 
                         value={gstin}
                         onChange={e => setGstin(e.target.value.toUpperCase())}
                         placeholder="" 
                         className="flex-1 px-3 py-2 bg-white border border-[#d1d5db] rounded-md text-[14px] outline-none focus:border-[#1e61f0] transition-all"
                       />
                       <button 
                         onClick={handleFetchGst}
                         disabled={isFetching || !gstin}
                         className="px-6 py-2 bg-[#1e61f0] text-white rounded-md text-[13px] font-medium hover:bg-[#1a54d1] transition-all flex items-center gap-2"
                       >
                          {isFetching ? <Loader2 size={16} className="animate-spin"/> : 'Fetch'}
                       </button>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      <div className="max-w-[1240px] mx-auto px-10 bg-white border border-slate-100 shadow-sm rounded-lg py-12 mb-48">
        
        {/* ── HEADER ────────────────────────────────────────────────── */}
        <div className="mb-6 px-1">
           <h1 className="text-[24px] font-normal text-[#1a202c]">New Customer</h1>
        </div>

        {/* ── GST BANNER ───────────────────────────────────────────── */}
        <div className="mb-10 bg-[#eef6ff] border-y border-[#dcf0ff] px-6 py-4 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <Download size={18} className="text-[#1e61f0] shrink-0" strokeWidth={1.5} />
              <p className="text-[14px] text-[#4a5568]">
                 Prefill Customer details from the GST portal using the Customer's GSTIN. 
                 <button 
                   type="button"
                   onClick={() => setIsPrefillOpen(true)}
                   className="text-[#1e61f0] hover:underline ml-1 font-normal"
                 >
                    Prefill &gt;
                 </button>
              </p>
           </div>
        </div>

        {/* ── MESSAGES ─────────────────────────────────────────────── */}
        {error && <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-400 text-red-700 text-sm">{error}</div>}
        {success && <div className="mb-8 p-4 bg-emerald-50 border-l-4 border-emerald-400 text-emerald-700 text-sm">Entity persisted.</div>}

        <form onSubmit={handleSubmit} className="px-1">
           
           {/* Primary Registration Fields */}
           <div className={rowStyle}>
              <div className={labelColStyle}>Customer Type <Info size={14} className="text-[#9ca3af] cursor-pointer"/></div>
              <div className={inputColStyle}>
                 <div className="flex items-center gap-10 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                       <input type="radio" checked={customerType === 'Business'} onChange={() => setCustomerType('Business')} className="w-4 h-4 accent-[#1e61f0]" />
                       <span className="text-[14px] text-[#4a5568]">Business</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                       <input type="radio" checked={customerType === 'Individual'} onChange={() => setCustomerType('Individual')} className="w-4 h-4 accent-[#1e61f0]" />
                       <span className="text-[14px] text-[#4a5568]">Individual</span>
                    </label>
                 </div>
              </div>
           </div>

           <div className={rowStyle}>
              <div className={labelColStyle}>Primary Contact <Info size={14} className="text-[#9ca3af] cursor-pointer"/></div>
              <div className={inputColStyle}>
                 <div className="flex gap-2">
                    <select value={salutation} onChange={e => setSalutation(e.target.value)} className={selectStyle + " w-[220px] font-medium"}>
                       <option value="">Salutation</option>
                       <option value="Mr.">Mr.</option>
                       <option value="Mrs.">Mrs.</option>
                       <option value="Ms.">Ms.</option>
                       <option value="Miss">Miss</option>
                       <option value="Dr.">Dr.</option>
                    </select>
                    <input type="text" placeholder="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} className={inputStyle} />
                    <input type="text" placeholder="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} className={inputStyle} />
                 </div>
              </div>
           </div>

           <div className={rowStyle}><div className={labelColStyle}>Company Name</div><div className={inputColStyle}><input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} className={inputStyle} /></div></div>
           

           <div className={rowStyle}>
              <div className={labelColStyle}>Email Address <Info size={14} className="text-[#9ca3af] cursor-pointer"/></div>
              <div className={inputColStyle}>
                 <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" strokeWidth={1}/>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputStyle + " pl-10"} />
                 </div>
              </div>
           </div>
           
           <div className={rowStyle}>
              <div className={labelColStyle}>Phone <Info size={14} className="text-[#9ca3af] cursor-pointer"/></div>
              <div className={inputColStyle}>
                 <div className="flex gap-4">
                    <div className="flex flex-1 border border-[#d1d5db] rounded-md overflow-hidden focus-within:border-[#1e61f0]">
                       <select className="px-2 py-2 bg-slate-50 border-r border-[#d1d5db] text-[13px] text-slate-500 outline-none w-[90px]">
                          {COUNTRY_CODES.map((c, i) => <option key={`${c.code}-${i}`} value={c.code}>{c.code} {c.country}</option>)}
                       </select>
                       <input type="text" value={workPhone} onChange={e => setWorkPhone(e.target.value)} placeholder="Work Phone" className="flex-1 px-3 py-2 text-[14px] outline-none" />
                    </div>
                    <div className="flex flex-1 border border-[#d1d5db] rounded-md overflow-hidden focus-within:border-[#1e61f0]">
                       <select className="px-2 py-2 bg-slate-50 border-r border-[#d1d5db] text-[13px] text-slate-500 outline-none w-[90px]">
                          {COUNTRY_CODES.map((c, i) => <option key={`${c.code}-${i}`} value={c.code}>{c.code} {c.country}</option>)}
                       </select>
                       <input type="text" value={mobile} onChange={e => setMobile(e.target.value)} placeholder="Mobile" className="flex-1 px-3 py-2 text-[14px] outline-none" />
                    </div>
                 </div>
              </div>
           </div>

           {/* ── TABS NAVIGATION ────────────────────────────────────────── */}
           <div className="mt-12 flex gap-8 border-b border-[#e2e8f0] mb-12">
              {tabs.map(tab => (
                <button
                  key={tab} type="button" onClick={() => setActiveTab(tab)}
                  className={`pb-3 text-[14px] transition-all relative ${activeTab === tab ? 'text-[#1e61f0] font-medium' : 'text-[#4a5568] hover:text-[#1a202c]'}`}
                >
                  {tab} {activeTab === tab && <div className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-[#1e61f0]"></div>}
                </button>
              ))}
           </div>

           {/* ── TAB CONTENT: ADDRESS ───────────────────────────────────── */}
           {activeTab === 'Address' && (
             <div className="grid grid-cols-2 gap-20 animate-fade-in mb-20">
                <div className="space-y-6">
                   <h3 className="text-[18px] font-normal text-[#1a202c] mb-8">Billing Address</h3>
                   <AddressRow label="Attention" value={billingAddress.attention} onChange={v => handleAddressChange('billing', 'attention', v)} />
                   <AddressRow label="Country/Region" type="select" options={countryOptions} value={billingAddress.country} onChange={v => handleAddressChange('billing', 'country', v)} />
                   <div className="flex gap-10">
                      <div className="w-1/3 text-[13px] text-[#4a5568] mt-2">Address</div>
                      <div className="w-2/3 space-y-4">
                         <textarea placeholder="Street 1" value={billingAddress.street1} onChange={e => handleAddressChange('billing', 'street1', e.target.value)} className={addressInputStyle + " h-20 resize-none"} />
                         <textarea placeholder="Street 2" value={billingAddress.street2} onChange={e => handleAddressChange('billing', 'street2', e.target.value)} className={addressInputStyle + " h-20 resize-none"} />
                      </div>
                   </div>
                   <AddressRow label="City" value={billingAddress.city} onChange={v => handleAddressChange('billing', 'city', v)} />
                   <AddressRow label="State" type="select" options={['Select or type to add', ...INDIAN_STATES]} value={billingAddress.state} onChange={v => handleAddressChange('billing', 'state', v)} />
                   <AddressRow label="Pin Code" value={billingAddress.pinCode} onChange={v => handleAddressChange('billing', 'pinCode', v)} />
                   <AddressRow label="Phone" type="phone" value={billingAddress.phone} onChange={v => handleAddressChange('billing', 'phone', v)} />
                </div>

                <div className="space-y-6">
                   <div className="flex items-center justify-between mb-8">
                      <h3 className="text-[18px] font-normal text-[#1a202c]">Shipping Address</h3>
                      <button type="button" onClick={copyBillingToShipping} className="text-[#1e61f0] text-[13px] flex items-center gap-1.5 hover:underline font-normal">
                         <span className="text-[16px]">↓</span> Copy billing address
                      </button>
                   </div>
                   <AddressRow label="Attention" value={shippingAddress.attention} onChange={v => handleAddressChange('shipping', 'attention', v)} />
                   <AddressRow label="Country/Region" type="select" options={countryOptions} value={shippingAddress.country} onChange={v => handleAddressChange('shipping', 'country', v)} />
                   <div className="flex gap-10">
                      <div className="w-1/3 text-[13px] text-[#4a5568] mt-2">Address</div>
                      <div className="w-2/3 space-y-4">
                         <textarea placeholder="Street 1" value={shippingAddress.street1} onChange={e => handleAddressChange('shipping', 'street1', e.target.value)} className={addressInputStyle + " h-20 resize-none"} />
                         <textarea placeholder="Street 2" value={shippingAddress.street2} onChange={e => handleAddressChange('shipping', 'street2', e.target.value)} className={addressInputStyle + " h-20 resize-none"} />
                      </div>
                   </div>
                   <AddressRow label="City" value={shippingAddress.city} onChange={v => handleAddressChange('shipping', 'city', v)} />
                    <AddressRow label="State" type="select" options={['Select or type to add', ...INDIAN_STATES]} value={shippingAddress.state} onChange={v => handleAddressChange('shipping', 'state', v)} />
                   <AddressRow label="Pin Code" value={shippingAddress.pinCode} onChange={v => handleAddressChange('shipping', 'pinCode', v)} />
                   <AddressRow label="Phone" type="phone" value={shippingAddress.phone} onChange={v => handleAddressChange('shipping', 'phone', v)} />
                </div>
             </div>
           )}

           {/* ── TAB CONTENT: OTHER DETAILS ─────────────────────────────── */}
           {activeTab === 'Other Details' && (
             <div className="animate-fade-in space-y-6">
                <div className={rowStyle}><div className={labelColStyle}>PAN <Info size={14} className="text-[#9ca3af] cursor-pointer"/></div><div className={inputColStyle}><input type="text" value={pan} onChange={e => setPan(e.target.value.toUpperCase())} className={inputStyle} /></div></div>
                <div className={rowStyle}><div className={labelColStyle}>Currency</div><div className={inputColStyle}><select value={currency} onChange={handleCurrencyChange} className={selectStyle}><option value="INR- Indian Rupee">INR- Indian Rupee</option><option value="AUD- Australian Dollar">AUD- Australian Dollar</option><option value="BND- Brunei Dollar">BND- Brunei Dollar</option><option value="CAD- Canadian Dollar">CAD- Canadian Dollar</option><option value="CNY- Yuan Renminbi">CNY- Yuan Renminbi</option><option value="EUR- Euro">EUR- Euro</option><option value="GBP- Pound Sterling">GBP- Pound Sterling</option><option value="JPY- Japanese Yen">JPY- Japanese Yen</option><option value="SAR- Saudi Riyal">SAR- Saudi Riyal</option><option value="USD- United States Dollar">USD- United States Dollar</option><option value="ZAR- South African Rand">ZAR- South African Rand</option>{customCurrencies.map(c => <option key={c.value} value={c.value}>{c.value}</option>)}<option disabled>──────────────</option><option value="add_new" className="text-[#1e61f0] font-medium font-bold">+ Add new currency</option></select></div></div>
                <div className={rowStyle}><div className={labelColStyle}>Accounts Receivable <Info size={14} className="text-[#9ca3af] cursor-pointer"/></div><div className={inputColStyle}><select value={receivableAccount} onChange={e => setReceivableAccount(e.target.value)} className={selectStyle}><option>Select an account</option></select></div></div>
                <div className={rowStyle}>
                   <div className={labelColStyle}>Opening Balance</div>
                   <div className={inputColStyle}>
                      <div className="flex border border-[#d1d5db] rounded-md overflow-hidden focus-within:border-[#1e61f0]">
                         <div className="px-3 py-2 bg-slate-50 border-r border-[#d1d5db] text-[13px] text-[#4a5568]">INR</div>
                         <input type="number" value={openingBalance} onChange={e => setOpeningBalance(e.target.value)} className="flex-1 px-3 py-2 text-[14px] outline-none" />
                      </div>
                   </div>
                </div>
                <div className={rowStyle}><div className={labelColStyle}>Payment Terms</div><div className={inputColStyle}><select value={paymentTerms} onChange={handlePaymentTermsChange} className={selectStyle}>{paymentTermsList.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}<option disabled>──────────────</option><option value="configure_terms" className="text-[#1e61f0] font-medium font-bold">⚙ Configure Terms</option></select></div></div>
             </div>
           )}

           {/* ── TAB CONTENT: CONTACT PERSONS ───────────────────────────── */}
           {activeTab === 'Contact Persons' && (
             <div className="animate-fade-in bg-white border border-[#d1d5db] rounded-md overflow-hidden">
                <table className="w-full text-left border-collapse">
                   <thead>
                      <tr className="bg-slate-50 border-b border-[#d1d5db]">
                         <th className="px-4 py-3 text-[12px] font-bold text-[#4a5568] uppercase tracking-wider border-r border-[#d1d5db] w-32">Salutation</th>
                         <th className="px-4 py-3 text-[12px] font-bold text-[#4a5568] uppercase tracking-wider border-r border-[#d1d5db]">First Name</th>
                         <th className="px-4 py-3 text-[12px] font-bold text-[#4a5568] uppercase tracking-wider border-r border-[#d1d5db]">Last Name</th>
                         <th className="px-4 py-3 text-[12px] font-bold text-[#4a5568] uppercase tracking-wider border-r border-[#d1d5db]">Email Address</th>
                         <th className="px-4 py-3 text-[12px] font-bold text-[#4a5568] uppercase tracking-wider border-r border-[#d1d5db]">Work Phone</th>
                         <th className="px-4 py-3 text-[12px] font-bold text-[#4a5568] uppercase tracking-wider border-r border-[#d1d5db]">Mobile</th>
                         <th className="px-4 py-3 w-16"></th>
                      </tr>
                   </thead>
                   <tbody>
                      {contactPersons.map(contact => (
                        <tr key={contact.id} className="border-b border-slate-100">
                           <td className="px-2 py-2 border-r border-slate-100">
                              <select value={contact.salutation} onChange={e => updateContactPerson(contact.id, 'salutation', e.target.value)} className="w-full bg-transparent outline-none text-[13px] px-2 font-medium">
                                 <option value="">Select</option>
                                 <option value="Mr.">Mr.</option>
                                 <option value="Mrs.">Mrs.</option>
                                 <option value="Ms.">Ms.</option>
                                 <option value="Miss">Miss</option>
                                 <option value="Dr.">Dr.</option>
                              </select>
                           </td>
                           <td className="px-2 py-2 border-r border-slate-100"><input type="text" value={contact.firstName} onChange={e => updateContactPerson(contact.id, 'firstName', e.target.value)} className="w-full bg-transparent outline-none text-[13px] px-2" /></td>
                           <td className="px-2 py-2 border-r border-slate-100"><input type="text" value={contact.lastName} onChange={e => updateContactPerson(contact.id, 'lastName', e.target.value)} className="w-full bg-transparent outline-none text-[13px] px-2" /></td>
                           <td className="px-2 py-2 border-r border-slate-100"><input type="email" value={contact.email} onChange={e => updateContactPerson(contact.id, 'email', e.target.value)} className="w-full bg-transparent outline-none text-[13px] px-2" /></td>
                           <td className="px-2 py-2 border-r border-slate-100">
                              <div className="flex border border-[#d1d5db] rounded-md overflow-hidden focus-within:border-[#1e61f0] m-1">
                                 <select className="px-1 py-1 bg-slate-50 border-r border-[#d1d5db] text-[11px] text-slate-500 outline-none w-[60px]">
                                    {COUNTRY_CODES.map((c, i) => <option key={`${c.code}-${i}`} value={c.code}>{c.code} {c.country}</option>)}
                                 </select>
                                 <input type="text" value={contact.workPhone} onChange={e => updateContactPerson(contact.id, 'workPhone', e.target.value)} className="flex-1 px-2 py-1 text-[13px] outline-none min-w-[80px]" />
                              </div>
                           </td>
                           <td className="px-2 py-2 border-r border-slate-100">
                              <div className="flex border border-[#d1d5db] rounded-md overflow-hidden focus-within:border-[#1e61f0] m-1">
                                 <select className="px-1 py-1 bg-slate-50 border-r border-[#d1d5db] text-[11px] text-slate-500 outline-none w-[60px]">
                                    {COUNTRY_CODES.map((c, i) => <option key={`${c.code}-${i}`} value={c.code}>{c.code} {c.country}</option>)}
                                 </select>
                                 <input type="text" value={contact.mobile} onChange={e => updateContactPerson(contact.id, 'mobile', e.target.value)} className="flex-1 px-2 py-1 text-[13px] outline-none min-w-[80px]" />
                              </div>
                           </td>
                           <td className="px-4 py-2 text-center">{contactPersons.length > 1 && <button type="button" onClick={() => removeContactPerson(contact.id)} className="text-slate-300 hover:text-red-500"><X size={18}/></button>}</td>
                        </tr>
                      ))}
                   </tbody>
                </table>
                <div className="p-4 bg-slate-50/50">
                   <button type="button" onClick={addContactPerson} className="px-4 py-2 bg-blue-50 text-[#1e61f0] rounded-md text-[12px] font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-blue-100"><Plus size={16}/> Add Contact Person</button>
                </div>
             </div>
           )}

           {/* Save Action Area */}
           <div className="mt-16 pt-8 border-t border-[#edf2f7] flex gap-4">
              <button type="submit" disabled={loading} className="px-10 py-2.5 bg-[#1e61f0] text-white rounded-md text-[14px] font-medium hover:bg-[#1a54d1] transition-all">
                 {loading ? 'Saving...' : 'Save'}
              </button>
              <button type="button" onClick={() => window.location.reload()} className="px-10 py-2.5 bg-white border border-[#d1d5db] text-[#4a5568] rounded-md text-[14px] font-medium hover:bg-slate-50">
                 Cancel
              </button>
           </div>
        </form>
      </div>

      {/* ── CONFIGURE TERMS MODAL ──────────────────────────── */}
      {isConfigureTermsOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-fade-in">
          <div className="bg-white rounded-lg w-[650px] shadow-2xl overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="flex justify-between items-center px-8 py-5 border-b border-[#edf2f7] bg-white">
              <h2 className="text-[20px] font-medium text-[#2c3e50] tracking-tight">Configure Payment Terms</h2>
              <button type="button" onClick={() => { setIsConfigureTermsOpen(false); setIsAddingNewTerm(false); }} className="text-[#ff6b6b] hover:text-red-600 transition-colors">
                <X size={24} strokeWidth={2.5}/>
              </button>
            </div>

            {/* Body */}
            <div className="px-8 py-8">
              <table className="w-full text-left border-collapse border border-slate-100 rounded-lg overflow-hidden shadow-sm">
                <thead>
                  <tr className="bg-[#fbfcff] border-b border-slate-200">
                    <th className="px-6 py-4 text-[12px] font-bold text-[#9ca3af] uppercase tracking-wider border-r border-slate-100">TERM NAME</th>
                    <th className="px-6 py-4 text-[12px] font-bold text-[#9ca3af] uppercase tracking-wider text-right">NUMBER OF DAYS</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentTermsList.map((term, idx) => (
                    <tr key={idx} className="border-b last:border-b-0 border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-[15px] text-[#4a5568] border-r border-slate-100">{term.name}</td>
                      <td className="px-6 py-4 text-[15px] text-[#4a5568] text-right">{term.days}</td>
                    </tr>
                  ))}
                  {/* Row for adding new term inline */}
                  {isAddingNewTerm && (
                    <tr className="border-b border-slate-100 bg-blue-50/30 animate-pulse-subtle">
                      <td className="px-6 py-2 border-r border-slate-100">
                        <input
                          autoFocus
                          type="text"
                          placeholder="Term Name"
                          value={newTermName}
                          onChange={e => setNewTermName(e.target.value)}
                          className="w-full px-2 py-2 bg-white border border-blue-200 rounded text-[14px] outline-none focus:border-blue-400"
                        />
                      </td>
                      <td className="px-6 py-2 text-right">
                        <input
                          type="text"
                          placeholder="0"
                          value={newTermDays}
                          onChange={e => setNewTermDays(e.target.value)}
                          className="w-24 px-2 py-2 bg-white border border-blue-200 rounded text-[14px] outline-none focus:border-blue-400 text-right"
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <button 
                type="button" 
                onClick={() => setIsAddingNewTerm(true)}
                className="mt-6 flex items-center gap-2 text-[#1e61f0] text-[15px] font-medium hover:text-[#1a54d1] transition-all group"
              >
                <div className="w-5 h-5 rounded-full bg-[#1e61f0] text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Plus size={14} strokeWidth={3}/>
                </div>
                Add New
              </button>
            </div>

            {/* Footer */}
            <div className="px-8 py-6 border-t border-[#edf2f7] flex gap-3">
              <button
                type="button"
                onClick={saveConfiguredTerm}
                className="px-8 py-2.5 bg-[#1e61f0] text-white rounded-md text-[14px] font-medium hover:bg-[#1a54d1] shadow-sm hover:shadow-md transition-all"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => { setIsConfigureTermsOpen(false); setIsAddingNewTerm(false); }}
                className="px-8 py-2.5 bg-white border border-[#d1d5db] text-[#4a5568] rounded-md text-[14px] font-medium hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Currency Modal */}
      {isCurrencyModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-fade-in">
          <div className="bg-white rounded-md w-[450px] shadow-xl overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-[#edf2f7]">
              <h2 className="text-[16px] font-normal text-[#2c3e50]">New Currency</h2>
              <button onClick={() => setIsCurrencyModalOpen(false)} className="text-red-500 hover:text-red-700 font-bold"><X size={18} /></button>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-[13px] text-red-500 mb-1.5">Currency Code*</label>
                <select value={newCurrency.code} onChange={e => setNewCurrency({...newCurrency, code: e.target.value})} className={inputStyle}>
                  <option value="">Select</option>
                  <option value="AED">AED</option>
                  <option value="AFN">AFN</option>
                  <option value="ALL">ALL</option>
                  <option value="AMD">AMD</option>
                  <option value="ANG">ANG</option>
                  <option value="AOA">AOA</option>
                  <option value="ARS">ARS</option>
                  <option value="BHD">BHD</option>
                  <option value="BWP">BWP</option>
                  <option value="CDF">CDF</option>
                  <option value="GHS">GHS</option>
                  <option value="KES">KES</option>
                  <option value="MAD">MAD</option>
                  <option value="NGN">NGN</option>
                  <option value="RWF">RWF</option>
                  <option value="TZS">TZS</option>
                  <option value="UGX">UGX</option>
                </select>
              </div>
              
              <div>
                <label className="block text-[13px] text-red-500 mb-1.5">Currency Symbol*</label>
                <input type="text" value={newCurrency.symbol} onChange={e => setNewCurrency({...newCurrency, symbol: e.target.value})} className={inputStyle} />
              </div>
              
              <div>
                <label className="block text-[13px] text-red-500 mb-1.5">Currency Name*</label>
                <input type="text" value={newCurrency.name} onChange={e => setNewCurrency({...newCurrency, name: e.target.value})} className={inputStyle} />
              </div>
              
              <div>
                <label className="block text-[13px] text-[#4a5568] mb-1.5">Decimal Places</label>
                <select value={newCurrency.decimalPlaces} onChange={e => setNewCurrency({...newCurrency, decimalPlaces: e.target.value})} className={inputStyle}>
                  <option value="">Select</option>
                  <option value="0">0</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                </select>
              </div>
              
              <div>
                <label className="block text-[13px] text-[#4a5568] mb-1.5">Format</label>
                <select value={newCurrency.format} onChange={e => setNewCurrency({...newCurrency, format: e.target.value})} className={inputStyle}>
                  <option value="">Select</option>
                  <option value="1,234,567.89">1,234,567.89</option>
                  <option value="1.234.567,89">1.234.567,89</option>
                  <option value="1 234 567.89">1 234 567.89</option>
                </select>
              </div>
            </div>
            
            <div className="p-4 border-t border-[#edf2f7] flex gap-3">
              <button type="button" onClick={saveCustomCurrency} className="px-4 py-2 bg-[#4285f4] text-white rounded text-[13px] font-medium hover:bg-[#3367d6]">Save and Select</button>
              <button type="button" onClick={() => setIsCurrencyModalOpen(false)} className="px-4 py-2 bg-[#f4f4f5] border border-[#d1d5db] text-[#4a5568] rounded text-[13px] font-medium hover:bg-slate-200">Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

const AddressRow = ({ label, value, onChange, type = 'text', options = [] }) => (
  <div className="flex gap-10 items-start mb-5">
     <div className="w-1/3 text-[13px] text-[#4a5568] mt-2">{label}</div>
     <div className="w-2/3">
        {type === 'select' ? (
          <select value={value} onChange={e => onChange(e.target.value)} className="w-full px-3 py-2 border border-[#d1d5db] rounded-md text-[13px] outline-none focus:border-[#1e61f0] appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C/polyline%3E%3C/svg%3E')] bg-[length:12px] bg-[right_10px_center] bg-no-repeat">
             {options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : type === 'phone' ? (
           <div className="flex border border-[#d1d5db] rounded-md overflow-hidden focus-within:border-[#1e61f0]">
             <select className="px-2 py-2 bg-slate-50 border-r border-[#d1d5db] text-[12px] text-slate-500 outline-none w-[90px]">
                {COUNTRY_CODES.map((c, i) => <option key={`${c.code}-${i}`} value={c.code}>{c.code} {c.country}</option>)}
             </select>
             <input type="text" value={value} onChange={e => onChange(e.target.value)} className="flex-1 px-3 py-2 text-[13px] outline-none" />
           </div>
        ) : (
          <input type="text" value={value} onChange={e => onChange(e.target.value)} className="w-full px-3 py-2 border border-[#d1d5db] rounded-md text-[14px] outline-none focus:border-[#1e61f0]" />
        )}
     </div>
  </div>
);

export default CustomersView;
