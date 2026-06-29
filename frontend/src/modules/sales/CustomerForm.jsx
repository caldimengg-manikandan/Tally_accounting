import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Info, Mail, Phone, MapPin, Building, ShieldCheck, 
  AlertCircle, Loader2, Plus, Save, X, Activity, CheckCircle2,
  ChevronRight, ChevronDown, ArrowRight, ArrowLeft, Copy, Trash2, MoreVertical,
  Upload, FileText, Globe, CreditCard, Clock, Download, Search, User, Edit2, Check
} from 'lucide-react';
import { ledgerAPI, groupAPI } from '../../services/api';
import { COUNTRY_CODES } from '../../utils/countryCodes';
import { INDIAN_STATES } from '../../utils/indianStates';
import useNotificationStore from '../../store/notificationStore';
import { CURRENCIES } from '../../utils/currencies';

const CustomerForm = ({ onSaveSuccess, onCancel, customerToEdit = null, standalone = true, companyId: propCompanyId }) => {
  const [loading, setLoading] = useState(false);
  const companyId = propCompanyId || sessionStorage.getItem('companyId');
  const addNotification = useNotificationStore(state => state.addNotification);

  // Basic Info
  const [customerType, setCustomerType] = useState('Business');
  const [salutation, setSalutation] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [workPhone, setWorkPhone] = useState('');
  const [mobile, setMobile] = useState('');
  const [website, setWebsite] = useState('');
  const [displayName, setDisplayName] = useState('');

  // Tax & Terms
  const [pan, setPan] = useState('');
  const [tcsApplicable, setTcsApplicable] = useState(false);
  const [tcsRate, setTcsRate] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [gstError, setGstError] = useState('');
  const [currency, setCurrency] = useState('INR- Indian Rupee');
  const [paymentTerms, setPaymentTerms] = useState('Due on Receipt');
  const [receivableAccount, setReceivableAccount] = useState('Accounts Receivable');
  const [openingBalance, setOpeningBalance] = useState('');
  const [portalEnabled, setPortalEnabled] = useState(false);
  const [exchangeRate, setExchangeRate] = useState('1.00');
  const [tempExchangeRate, setTempExchangeRate] = useState('1.00');
  const [isRateEditable, setIsRateEditable] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [showDisplayNameDropdown, setShowDisplayNameDropdown] = useState(false);
  
  // Addresses
  const initialAddress = { attention: '', country: '', street1: '', street2: '', city: '', state: '', pinCode: '', phone: '' };
  const [billingAddress, setBillingAddress] = useState({ ...initialAddress });
  const [shippingAddress, setShippingAddress] = useState({ ...initialAddress });

  // Generate Display Name Options
  const displayNameOptions = useMemo(() => {
    const options = new Set();
    const fullName = `${firstName} ${lastName}`.trim();
    const lastFirst = lastName && firstName ? `${lastName}, ${firstName}` : '';
    const withSalutation = salutation && salutation !== 'Salutation' && fullName ? `${salutation} ${fullName}` : '';
    
    if (withSalutation) options.add(withSalutation);
    if (fullName) options.add(fullName);
    if (lastFirst) options.add(lastFirst);
    if (companyName) options.add(companyName);
    if (firstName) options.add(firstName);
    
    return Array.from(options).filter(opt => opt.length > 0);
  }, [salutation, firstName, lastName, companyName]);

  // Display name options are shown in dropdown only — no auto-fill

  const [isBillingStateOpen, setIsBillingStateOpen] = useState(false);
  const [billingStateSearch, setBillingStateSearch] = useState('');
  const billingStateRef = useRef(null);

  const [isShippingStateOpen, setIsShippingStateOpen] = useState(false);
  const [shippingStateSearch, setShippingStateSearch] = useState('');
  const shippingStateRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (billingStateRef.current && !billingStateRef.current.contains(event.target)) {
        setIsBillingStateOpen(false);
      }
      if (shippingStateRef.current && !shippingStateRef.current.contains(event.target)) {
        setIsShippingStateOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (customerToEdit) {
       setCompanyName(customerToEdit.name || ''); // Defaulting name to company/display name
       setSalutation(customerToEdit.salutation || '');
       setFirstName(customerToEdit.firstName || '');
       setLastName(customerToEdit.lastName || '');
       setCustomerType(customerToEdit.customerType || 'Business');
       setEmail(customerToEdit.email || '');
       setWorkPhone(customerToEdit.workPhone || customerToEdit.phone || '');
       setMobile(customerToEdit.mobile || '');
       setWebsite(customerToEdit.website || '');
       setPan(customerToEdit.pan || '');
       setTcsApplicable(customerToEdit.tcsApplicable || false);
       setTcsRate(customerToEdit.tcsRate || '');
       setGstNumber(customerToEdit.gstNumber || '');
       setCurrency(customerToEdit.currency || 'INR- Indian Rupee');
       setPaymentTerms(customerToEdit.paymentTerms || 'Due on Receipt');
       setCompanyName(customerToEdit.companyName || '');
       setReceivableAccount(customerToEdit.receivableAccount || 'Accounts Receivable');
       setOpeningBalance(customerToEdit.openingBalance?.toString() || '0.00');
       setPortalEnabled(customerToEdit.portalEnabled || false);
       
       if (customerToEdit.billingAddressJson) setBillingAddress(JSON.parse(customerToEdit.billingAddressJson));
       else if (customerToEdit.billingAddress) {
           try { setBillingAddress(JSON.parse(customerToEdit.billingAddress)); } catch(e) { /* ignore */ }
       }
       
       if (customerToEdit.shippingAddressJson) setShippingAddress(JSON.parse(customerToEdit.shippingAddressJson));
       else if (customerToEdit.shippingAddress) {
           try { setShippingAddress(JSON.parse(customerToEdit.shippingAddress)); } catch(e) { /* ignore */ }
       }
       
       setDisplayName(customerToEdit.name || '');
     }
  }, [customerToEdit]);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await ledgerAPI.getByCompany(companyId);
        if (res.data) setAccounts(res.data);
      } catch (err) {
        console.error('Failed to fetch accounts', err);
      }
    };
    fetchAccounts();
  }, [companyId]);

  // Handle Currency Change & Exchange Rate (Real-time API)
  useEffect(() => {
    if (!currency || currency.startsWith('INR')) {
      setExchangeRate('1.00');
      return;
    }
    
    const fetchLatestRate = async () => {
      try {
        const code = (currency || 'INR').split(/[ -]/)[0].trim();
        // Fetching latest rates from a public API with INR as base
        const res = await fetch(`https://open.er-api.com/v6/latest/INR`);
        const data = await res.json();
        
        if (data && data.rates) {
          // The API gives rates as 1 INR = X ForeignCurrency
          // We need 1 ForeignCurrency = X INR
          const rateToInr = data.rates[code];
          if (rateToInr) {
             const actualRate = (1 / rateToInr).toFixed(6);
             setExchangeRate(actualRate);
          }
        }
      } catch (err) {
        console.error('Failed to fetch real-time exchange rate', err);
        // Relying purely on live online data as per requirement.
      }
    };

    fetchLatestRate();
  }, [currency]); // Only triggers when currency selection changes

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!companyId || companyId === 'null' || companyId === 'undefined') {
      addNotification('No active company selected. Please select a company first.', 'error');
      return;
    }
    let ledgerName = displayName || (customerType === 'Business' ? companyName : `${salutation} ${firstName} ${lastName}`.trim());
    
    if (!ledgerName) {
      addNotification('Display Name is required.', 'error');
      return;
    }

    if (gstError) {
      addNotification('Please fix the GSTIN error before saving.', 'error');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: ledgerName,
        salutation,
        firstName,
        lastName,
        customerType,
        companyName,
        email,
        workPhone,
        mobile,
        website,
        pan,
        tcsApplicable,
        tcsRate,
        gstNumber: gstNumber.trim(),
        companyId,
        groupName: 'Sundry Debtors',
        billingAddress: JSON.stringify(billingAddress),
        shippingAddress: JSON.stringify(shippingAddress),
        currency,
        paymentTerms,
        receivableAccount,
        openingBalance: parseFloat(openingBalance) || 0,
        portalEnabled,
        displayName
      };

      let res;
      if (customerToEdit) {
        res = await ledgerAPI.update(customerToEdit.id, payload);
      } else {
        res = await ledgerAPI.create(payload);
      }
      
      if (onSaveSuccess) onSaveSuccess(res.data);
    } catch (err) {
      addNotification('Failed to save customer', 'error');
    } finally {
      setLoading(false);
    }
  };

  const copyBillingToShipping = () => setShippingAddress({ ...billingAddress });

  return (
    <div className={`flex flex-col ${standalone ? 'min-h-screen bg-white' : 'h-full bg-white overflow-hidden'}`}>
        {standalone && (
            <header className="px-6 py-3 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-50 shadow-sm">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={onCancel} 
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 transition-colors"
                        title="Go Back"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="bg-slate-100 p-1.5 rounded">
                            <User size={16} className="text-slate-600" />
                        </div>
                        <h2 className="text-[17px] font-bold text-slate-800 tracking-tight">{customerToEdit ? 'Edit Customer' : 'New Customer'}</h2>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={onCancel} className="px-6 py-2 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all">
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave} 
                        disabled={loading} 
                        className="px-8 py-2.5 bg-[#1e61f0] text-white text-sm font-bold rounded-xl hover:bg-[#1a54d1] shadow-lg shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        {customerToEdit ? 'UPDATE CUSTOMER' : 'SAVE CUSTOMER'}
                    </button>
                </div>
            </header>
        )}

        <div className={`flex-1 overflow-y-auto no-scrollbar ${standalone ? 'bg-[#f8fafc]' : 'bg-white custom-scrollbar'}`}>
            <div className={`${standalone ? 'max-w-[1000px] mx-auto py-10 px-6' : 'px-8 py-6 w-full'}`}>
                <div className={`${standalone ? 'bg-white rounded-xl border border-slate-200 shadow-xl shadow-slate-200/50 p-12 space-y-12 animate-fade-in' : 'space-y-10'}`}>
                {/* Section 1: Basic Info */}
                <section className="space-y-6">
                    <div className="flex items-center gap-4 mb-8">
                        <h3 className="text-[14px] font-bold text-slate-800">Primary Details</h3>
                        <div className="h-px bg-slate-100 flex-1"></div>
                    </div>

                    <div className="space-y-6">
                        {/* Customer Type */}
                        <div className="flex items-center">
                            <label className="w-48 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Customer Type</label>
                            <div className="flex gap-4">
                                {['Business', 'Individual'].map(t => (
                                    <label key={t} className="flex items-center gap-2 cursor-pointer group">
                                        <input 
                                            type="radio" 
                                            checked={customerType === t} 
                                            onChange={() => setCustomerType(t)}
                                            className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                                        />
                                        <span className={`text-[13px] ${customerType === t ? 'text-slate-900 font-bold' : 'text-slate-500'}`}>{t}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Primary Name */}
                        <div className="flex items-start">
                            <label className="w-48 text-[11px] font-bold text-rose-500 uppercase tracking-widest mt-2">Primary Contact*</label>
                            <div className="flex-1 max-w-2xl space-y-4">
                                <div className="grid grid-cols-12 gap-3 pb-4">
                                    <div className="col-span-3">
                                        <select 
                                            value={salutation} 
                                            onChange={e => setSalutation(e.target.value)}
                                            className="w-full h-9 px-2 border border-slate-200 rounded text-[13px] outline-none bg-white font-medium"
                                        >
                                            <option value="">Salutation</option>
                                            <option>Mr.</option><option>Mrs.</option><option>Ms.</option><option>Dr.</option>
                                        </select>
                                    </div>
                                    <div className="col-span-4">
                                        <input 
                                            placeholder="First Name" 
                                            value={firstName} onChange={e => setFirstName(e.target.value)}
                                            className="w-full h-9 px-3 border border-slate-200 rounded text-[13px] outline-none focus:border-blue-400 font-medium" 
                                        />
                                    </div>
                                    <div className="col-span-5">
                                        <input 
                                            placeholder="Last Name" 
                                            value={lastName} onChange={e => setLastName(e.target.value)}
                                            className="w-full h-9 px-3 border border-slate-200 rounded text-[13px] outline-none focus:border-blue-400 font-medium" 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center">
                                        <label className="w-48 text-[11px] font-bold text-slate-500 uppercase tracking-widest shrink-0">Company Name</label>
                                        <input 
                                            value={companyName} onChange={e => setCompanyName(e.target.value)}
                                            className="flex-1 h-9 px-3 border border-slate-200 rounded text-[13px] outline-none focus:border-blue-400 font-medium" 
                                        />
                                    </div>
                                    <div className="flex items-center">
                                        <label className="w-48 text-[11px] font-bold text-rose-500 uppercase tracking-widest shrink-0">Display Name*</label>
                                        <div className="flex-1 relative">
                                            <div className="flex items-center h-9 border border-slate-200 rounded overflow-hidden focus-within:border-blue-400 bg-white">
                                                <input 
                                                    value={displayName} 
                                                    onChange={e => setDisplayName(e.target.value)}
                                                    onFocus={() => setShowDisplayNameDropdown(true)}
                                                    placeholder="Type or select a Display Name"
                                                    className="flex-1 h-full px-3 text-[13px] outline-none bg-transparent font-bold text-blue-600"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowDisplayNameDropdown(prev => !prev)}
                                                    className="px-2 h-full flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                                                >
                                                    <ChevronDown size={14} className={`transition-transform ${showDisplayNameDropdown ? 'rotate-180' : ''}`} />
                                                </button>
                                                <div className="pr-2 flex items-center text-slate-300">
                                                    <Info size={14} />
                                                </div>
                                            </div>
                                            {showDisplayNameDropdown && displayNameOptions.length > 0 && (
                                                <>
                                                    <div className="fixed inset-0 z-[70]" onClick={() => setShowDisplayNameDropdown(false)} />
                                                    <ul className="absolute left-0 right-0 top-[calc(100%+4px)] bg-white border border-slate-200 rounded-lg shadow-xl z-[80] max-h-48 overflow-y-auto py-1">
                                                        {displayNameOptions.map(opt => (
                                                            <li 
                                                                key={opt}
                                                                onClick={() => { setDisplayName(opt); setShowDisplayNameDropdown(false); }}
                                                                className={`px-4 py-2 text-[13px] cursor-pointer transition-colors ${
                                                                    displayName === opt 
                                                                        ? 'bg-blue-50 text-blue-700 font-bold' 
                                                                        : 'text-slate-700 hover:bg-slate-50 font-medium'
                                                                }`}
                                                            >
                                                                {opt}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Email */}
                        <div className="flex items-center">
                            <label className="w-48 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Customer Email</label>
                            <input 
                                type="email" value={email} onChange={e => setEmail(e.target.value)}
                                className="flex-1 max-w-lg h-9 px-3 border border-slate-200 rounded text-[13px] outline-none focus:border-blue-400 font-medium" 
                            />
                        </div>

                        {/* Phone */}
                        <div className="flex items-center">
                            <label className="w-48 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Customer Phone</label>
                            <div className="flex flex-1 max-w-lg gap-4">
                                <input 
                                    placeholder="Work Phone"
                                    value={workPhone} 
                                    onChange={e => setWorkPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                    maxLength={10}
                                    className="flex-1 h-9 px-3 border border-slate-200 rounded text-[13px] outline-none focus:border-blue-400 font-medium" 
                                />
                                <input 
                                    placeholder="Mobile"
                                    value={mobile} 
                                    onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                    maxLength={10}
                                    className="flex-1 h-9 px-3 border border-slate-200 rounded text-[13px] outline-none focus:border-blue-400 font-medium" 
                                />
                            </div>
                        </div>

                        {/* Website */}
                        <div className="flex items-center">
                            <label className="w-48 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Website</label>
                            <input 
                                type="text" value={website} onChange={e => setWebsite(e.target.value)}
                                className="flex-1 max-w-lg h-9 px-3 border border-slate-200 rounded text-[13px] outline-none focus:border-blue-400 font-medium text-blue-600" 
                            />
                        </div>
                    </div>
                </section>

                {/* Section 2: Addresses */}
                <section className="space-y-6 pt-10 border-t border-slate-50">
                    <div className="flex items-center gap-4 mb-8">
                        <h3 className="text-[14px] font-bold text-slate-800">Address Details</h3>
                        <div className="h-px bg-slate-100 flex-1"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-20">
                        {/* Billing */}
                        <div className="space-y-6">
                            <h4 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Billing Address</h4>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-medium text-slate-400">Country/Region</label>
                                    <select value={billingAddress.country} onChange={e => setBillingAddress({...billingAddress, country: e.target.value})} className="w-full h-9 px-3 border border-slate-100 rounded text-[13px] outline-none bg-white font-medium">
                                        <option value="">Select Country</option>
                                        {COUNTRY_CODES.map(c => <option key={c.country} value={c.country}>{c.country}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-medium text-slate-400">Street Address</label>
                                    <textarea value={billingAddress.street1} onChange={e => setBillingAddress({...billingAddress, street1: e.target.value})} className="w-full h-16 p-3 border border-slate-100 rounded text-[13px] outline-none focus:border-blue-300 resize-none font-medium" placeholder="Street 1" />
                                    <textarea value={billingAddress.street2} onChange={e => setBillingAddress({...billingAddress, street2: e.target.value})} className="w-full h-16 p-3 border border-slate-100 rounded text-[13px] outline-none focus:border-blue-300 resize-none font-medium mt-2" placeholder="Street 2" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-medium text-slate-400">City</label>
                                        <input value={billingAddress.city} onChange={e => setBillingAddress({...billingAddress, city: e.target.value})} className="w-full h-9 px-3 border border-slate-100 rounded text-[13px] font-medium" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-medium text-slate-400">Zip Code</label>
                                        <input value={billingAddress.pinCode} onChange={e => setBillingAddress({...billingAddress, pinCode: e.target.value})} className="w-full h-9 px-3 border border-slate-100 rounded text-[13px] font-medium" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-medium text-slate-400">State</label>
                                <div className="space-y-1" ref={billingStateRef}>
                                    <div className="relative">
                                        <button 
                                           type="button"
                                           onClick={() => {
                                              setIsBillingStateOpen(!isBillingStateOpen);
                                              setBillingStateSearch('');
                                           }}
                                           className={`w-full h-9 px-3 flex items-center justify-between border rounded text-left outline-none bg-white font-medium ${isBillingStateOpen ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-100 text-slate-800'}`}
                                        >
                                           <span className="text-[13px] text-slate-700">{billingAddress.state || 'Select State'}</span>
                                           <div className="flex items-center gap-1.5">
                                              {billingAddress.state && (
                                                 <X 
                                                   size={14} 
                                                   className="text-red-400 hover:text-red-600 transition-colors" 
                                                   onClick={(e) => {
                                                      e.stopPropagation();
                                                      setBillingAddress({...billingAddress, state: ''});
                                                   }}
                                                 />
                                              )}
                                              <ChevronDown size={14} className={`text-blue-500 transition-transform ${isBillingStateOpen ? 'rotate-180' : ''}`} />
                                           </div>
                                        </button>
                                        {isBillingStateOpen && (
                                           <div className="absolute bottom-full left-0 mb-1 w-full bg-white border border-slate-200 rounded shadow-lg z-50 overflow-hidden">
                                              <div className="p-2 border-b border-slate-100">
                                                 <div className="relative">
                                                    <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                                                    <input 
                                                       type="text"
                                                       placeholder="Search state..."
                                                       value={billingStateSearch}
                                                       onChange={e => setBillingStateSearch(e.target.value)}
                                                       className="w-full h-9 pl-8 pr-3 bg-slate-50 border border-slate-200 rounded text-[13px] outline-none focus:border-blue-400"
                                                       onClick={e => e.stopPropagation()}
                                                    />
                                                 </div>
                                              </div>
                                              <div className="max-h-48 overflow-y-auto py-1">
                                                 {INDIAN_STATES.filter(s => s.toLowerCase().includes(billingStateSearch.toLowerCase())).map(s => (
                                                    <div 
                                                       key={s} 
                                                       onClick={() => {
                                                          setBillingAddress({...billingAddress, state: s});
                                                          setIsBillingStateOpen(false);
                                                       }}
                                                       className={`px-3 py-2 text-[13px] cursor-pointer hover:bg-blue-50 ${billingAddress.state === s ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700 font-medium'}`}
                                                    >
                                                       {s}
                                                    </div>
                                                 ))}
                                              </div>
                                           </div>
                                        )}
                                    </div>
                                </div>
                                </div>
                            </div>
                        </div>

                        {/* Shipping */}
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h4 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Shipping Address</h4>
                                <button type="button" onClick={copyBillingToShipping} className="text-[11px] font-bold text-blue-600 hover:underline uppercase tracking-widest flex items-center gap-1">
                                    <Copy size={12}/> Copy Billing
                                </button>
                            </div>
                            <div className="space-y-4 opacity-90">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-medium text-slate-400">Country/Region</label>
                                    <select value={shippingAddress.country} onChange={e => setShippingAddress({...shippingAddress, country: e.target.value})} className="w-full h-9 px-3 border border-slate-100 rounded text-[13px] outline-none bg-white font-medium">
                                        <option value="">Select Country</option>
                                        {COUNTRY_CODES.map(c => <option key={c.country} value={c.country}>{c.country}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-medium text-slate-400">Street Address</label>
                                    <textarea value={shippingAddress.street1} onChange={e => setShippingAddress({...shippingAddress, street1: e.target.value})} className="w-full h-16 p-3 border border-slate-100 rounded text-[13px] outline-none focus:border-blue-300 resize-none font-medium" placeholder="Street 1" />
                                    <textarea value={shippingAddress.street2} onChange={e => setShippingAddress({...shippingAddress, street2: e.target.value})} className="w-full h-16 p-3 border border-slate-100 rounded text-[13px] outline-none focus:border-blue-300 resize-none font-medium mt-2" placeholder="Street 2" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-medium text-slate-400">City</label>
                                        <input value={shippingAddress.city} onChange={e => setShippingAddress({...shippingAddress, city: e.target.value})} className="w-full h-9 px-3 border border-slate-100 rounded text-[13px] font-medium" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-medium text-slate-400">Zip Code</label>
                                        <input value={shippingAddress.pinCode} onChange={e => setShippingAddress({...shippingAddress, pinCode: e.target.value})} className="w-full h-9 px-3 border border-slate-100 rounded text-[13px] font-medium" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-medium text-slate-400">State</label>
                                <div className="space-y-1" ref={shippingStateRef}>
                                    <div className="relative">
                                        <button 
                                           type="button"
                                           onClick={() => {
                                              setIsShippingStateOpen(!isShippingStateOpen);
                                              setShippingStateSearch('');
                                           }}
                                           className={`w-full h-9 px-3 flex items-center justify-between border rounded text-left outline-none bg-white font-medium ${isShippingStateOpen ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-100 text-slate-800'}`}
                                        >
                                           <span className="text-[13px] text-slate-700">{shippingAddress.state || 'Select State'}</span>
                                           <div className="flex items-center gap-1.5">
                                              {shippingAddress.state && (
                                                 <X 
                                                   size={14} 
                                                   className="text-red-400 hover:text-red-600 transition-colors" 
                                                   onClick={(e) => {
                                                      e.stopPropagation();
                                                      setShippingAddress({...shippingAddress, state: ''});
                                                   }}
                                                 />
                                              )}
                                              <ChevronDown size={14} className={`text-blue-500 transition-transform ${isShippingStateOpen ? 'rotate-180' : ''}`} />
                                           </div>
                                        </button>
                                        {isShippingStateOpen && (
                                           <div className="absolute bottom-full left-0 mb-1 w-full bg-white border border-slate-200 rounded shadow-lg z-50 overflow-hidden">
                                              <div className="p-2 border-b border-slate-100">
                                                 <div className="relative">
                                                    <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                                                    <input 
                                                       type="text"
                                                       placeholder="Search state..."
                                                       value={shippingStateSearch}
                                                       onChange={e => setShippingStateSearch(e.target.value)}
                                                       className="w-full h-9 pl-8 pr-3 bg-slate-50 border border-slate-200 rounded text-[13px] outline-none focus:border-blue-400"
                                                       onClick={e => e.stopPropagation()}
                                                    />
                                                 </div>
                                              </div>
                                              <div className="max-h-48 overflow-y-auto py-1">
                                                 {INDIAN_STATES.filter(s => s.toLowerCase().includes(shippingStateSearch.toLowerCase())).map(s => (
                                                    <div 
                                                       key={s} 
                                                       onClick={() => {
                                                          setShippingAddress({...shippingAddress, state: s});
                                                          setIsShippingStateOpen(false);
                                                       }}
                                                       className={`px-3 py-2 text-[13px] cursor-pointer hover:bg-blue-50 ${shippingAddress.state === s ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700 font-medium'}`}
                                                    >
                                                       {s}
                                                    </div>
                                                 ))}
                                              </div>
                                           </div>
                                        )}
                                    </div>
                                </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 3: Financials */}
                <section className="space-y-6 pt-10 border-t border-slate-50">
                    <div className="flex items-center gap-4 mb-8">
                        <h3 className="text-[14px] font-bold text-slate-800">Other Details</h3>
                        <div className="h-px bg-slate-100 flex-1"></div>
                    </div>

                    <div className="space-y-6 max-w-2xl">
                        {/* GSTIN */}
                        <div className="flex items-start mt-4">
                            <div className="w-48 flex items-center gap-1.5 mt-2.5">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">GSTIN</label>
                            </div>
                            <div className="flex-1">
                                <input 
                                    value={gstNumber} 
                                    onChange={e => {
                                      const val = e.target.value.toUpperCase();
                                      setGstNumber(val);
                                      if (val.trim() === '') {
                                        setGstError('');
                                        return;
                                      }
                                      if (val.length !== 15) {
                                        setGstError('GSTIN must be exactly 15 characters.');
                                        return;
                                      }
                                      const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/;
                                      if (!gstRegex.test(val)) {
                                        setGstError('Invalid GSTIN format. Expected format: 22AAAAA0000A1Z5');
                                        return;
                                      }
                                      const stateCode = parseInt(val.substring(0, 2), 10);
                                      if (stateCode < 1 || stateCode > 38) {
                                        setGstError('Invalid State Code (first 2 digits must be 01-38).');
                                        return;
                                      }
                                      setGstError('');
                                    }}
                                    className={`w-full h-9 px-3 border ${gstError ? 'border-red-400 focus:border-red-500 bg-red-50/30' : 'border-slate-200 focus:border-blue-400'} rounded text-[13px] outline-none capitalize font-medium text-slate-700`} 
                                    placeholder="22AAAAA0000A1Z5"
                                    maxLength={15}
                                />
                                {gstError && (
                                  <p className="text-red-500 text-[11px] font-medium mt-1.5 flex items-center gap-1">
                                    <AlertCircle size={12} /> {gstError}
                                  </p>
                                )}
                            </div>
                        </div>

                        {/* PAN */}
                        <div className="flex items-center">
                            <div className="w-48 flex items-center gap-1.5">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">PAN</label>
                                <Info size={12} className="text-slate-300" />
                            </div>
                            <input 
                                value={pan} onChange={e => setPan(e.target.value)}
                                className="flex-1 h-9 px-3 border border-slate-200 rounded text-[13px] outline-none focus:border-blue-400 capitalize font-medium text-slate-700" 
                                placeholder="ABCDE1234F"
                            />
                        </div>

                        {/* TCS */}
                        <div className="flex items-center">
                            <div className="w-48 flex items-center gap-1.5">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">TCS Applicable</label>
                            </div>
                            <div className="flex-1 flex items-center gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={tcsApplicable} 
                                        onChange={e => setTcsApplicable(e.target.checked)} 
                                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                    />
                                    <span className="text-[13px] font-medium text-slate-700">Enable TCS for this customer</span>
                                </label>
                                {tcsApplicable && (
                                    <div className="flex items-center gap-2 animate-slide-down ml-4">
                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">TCS Rate (%)</label>
                                        <input 
                                            type="number"
                                            value={tcsRate} 
                                            onChange={e => setTcsRate(e.target.value)}
                                            className="w-24 h-9 px-3 border border-slate-200 rounded text-[13px] outline-none focus:border-blue-400 font-medium text-slate-700" 
                                            placeholder="e.g. 1"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>


                        {/* Currency */}
                        <div className="flex items-center">
                            <label className="w-48 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Currency</label>
                            <div className="flex-1 relative">
                                <select 
                                    value={currency} 
                                    onChange={e => setCurrency(e.target.value)} 
                                    className="w-full h-9 px-3 border border-slate-200 rounded text-[13px] outline-none bg-white font-medium appearance-none"
                                >
                                    {CURRENCIES.map(c => <option key={c.code} value={c.display}>{c.display}</option>)}
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
                            </div>
                        </div>



                        {/* Exchange Rate - only shown for non-INR currencies */}
                        {(currency && !currency.startsWith('INR')) && (
                            <div className="flex items-center animate-slide-down">
                                <label className="w-48 text-[11px] font-bold text-blue-600 uppercase tracking-widest">Exchange Rate</label>
                                <div className={`flex-1 flex items-center h-9 border rounded overflow-hidden transition-all ${isRateEditable ? 'border-blue-400 bg-white' : 'border-blue-200 bg-blue-50/30'}`}>
                                    <span className="px-3 py-2 text-[11px] font-bold text-blue-400 border-r border-blue-100 whitespace-nowrap">
                                        1 {currency ? currency.split(/[ -]/)[0].trim() : 'INR'} =
                                    </span>
                                    <input 
                                        type="text"
                                        readOnly={!isRateEditable}
                                        value={isRateEditable ? tempExchangeRate : exchangeRate}
                                        onChange={e => setTempExchangeRate(e.target.value)}
                                        className={`flex-1 px-3 py-2 outline-none text-[13px] font-bold ${isRateEditable ? 'text-slate-800' : 'text-blue-700'} bg-transparent`} 
                                    />
                                    <div className="flex items-center h-full border-l border-blue-100 divide-x divide-blue-100">
                                       {!isRateEditable ? (
                                           <button 
                                             type="button"
                                             onClick={() => {
                                               setTempExchangeRate(exchangeRate);
                                               setIsRateEditable(true);
                                             }}
                                             className="px-3 py-2 hover:bg-blue-100/50 text-blue-400 transition-colors"
                                             title="Edit Rate"
                                           >
                                              <Edit2 size={14} />
                                           </button>
                                       ) : (
                                           <>
                                              <button 
                                                type="button"
                                                onClick={() => {
                                                   setExchangeRate(tempExchangeRate);
                                                   setIsRateEditable(false);
                                                }}
                                                className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                                                title="Update Rate"
                                              >
                                                 <Check size={14} />
                                              </button>
                                              <button 
                                                type="button"
                                                onClick={() => setIsRateEditable(false)}
                                                className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-400 transition-colors"
                                                title="Cancel"
                                              >
                                                 <X size={14} />
                                              </button>
                                           </>
                                       )}
                                    </div>
                                    <span className="px-3 py-2 text-[11px] font-bold text-blue-400 border-l border-blue-100">INR</span>
                                </div>
                            </div>
                        )}

                        {/* Payment Terms */}
                        <div className="flex items-center">
                            <label className="w-48 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Payment Terms</label>
                            <div className="flex-1 relative">
                                <select 
                                    value={paymentTerms} 
                                    onChange={e => setPaymentTerms(e.target.value)} 
                                    className="w-full h-9 px-3 border border-slate-200 rounded text-[13px] outline-none bg-white font-medium appearance-none"
                                >
                                    <option value="Due on Receipt">Due on Receipt</option>
                                    <option value="Net 15">Net 15</option>
                                    <option value="Net 30">Net 30</option>
                                    <option value="Net 45">Net 45</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
                            </div>
                        </div>


                    </div>
                </section>
            </div>
        </div>
    </div>

    {/* Action Bar */}
    <div className="sticky bottom-0 bg-white border-t border-slate-100 shadow-[0_-5px_25px_rgba(0,0,0,0.05)] z-[60]">
        <div className={`max-w-[1000px] mx-auto ${standalone ? 'px-6 py-4' : 'px-8 py-3'} flex justify-between items-center`}>
             <div></div>
             <div className="flex items-center gap-3">
                <button onClick={onCancel} className="px-6 py-2 text-slate-500 text-[13px] font-bold hover:bg-slate-50 rounded">Discard</button>
                <button 
                    onClick={handleSave} 
                    disabled={loading}
                    className="px-10 py-2 bg-[#1e61f0] text-white rounded font-bold text-[14px] hover:bg-blue-700 shadow-xl shadow-blue-500/10 transition-all uppercase tracking-widest disabled:opacity-50"
                >
                    {loading ? 'Processing...' : 'Save Customer Profile'}
                </button>
             </div>
        </div>
    </div>
</div>
);
};

export default CustomerForm;
