import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Info, Mail, Phone, MapPin, Building, ShieldCheck, 
  AlertCircle, Loader2, Plus, Save, X, Activity, CheckCircle2,
  ChevronRight, ChevronDown, ArrowRight, ArrowLeft, Copy, Trash2, MoreVertical,
  Upload, FileText, Globe, CreditCard, Clock, Download, Search, User, Truck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ledgerAPI, groupAPI } from '../../services/api';
import { COUNTRY_CODES } from '../../utils/countryCodes';
import { INDIAN_STATES } from '../../utils/indianStates';
import useNotificationStore from '../../store/notificationStore';
import { CURRENCIES } from '../../utils/currencies';
import { STATE_CODE_TO_NAME } from '../../utils/gstinUtils';

const VendorForm = ({ editId, standalone = true, onSaveSuccess, onCancel, companyId: propCompanyId }) => {
  const navigate = useNavigate();
  const isEditMode = Boolean(editId);

  const handleCancelOrBack = () => {
    if (isEditMode && editId) {
      navigate(-1);
    } else {
      navigate('/vendors');
    }
  };
  
  // Basic Info
  const [vendorType, setVendorType] = useState('Business');
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
  const [currency, setCurrency] = useState('INR- Indian Rupee');
  const [paymentTerms, setPaymentTerms] = useState('Due on Receipt');
  const [gstNumber, setGstNumber] = useState('');
  const [gstError, setGstError] = useState('');
  
  // Addresses (optional — not required to save)
  const initialAddress = { attention: '', country: '', street1: '', street2: '', city: '', state: '', pinCode: '', phone: '' };
  const [billingAddress, setBillingAddress] = useState({ ...initialAddress });
  const [shippingAddress, setShippingAddress] = useState({ ...initialAddress });

  const [isBillingCountryOpen, setIsBillingCountryOpen] = useState(false);
  const [billingCountrySearch, setBillingCountrySearch] = useState('');
  const billingCountryRef = useRef(null);

  const [isShippingCountryOpen, setIsShippingCountryOpen] = useState(false);
  const [shippingCountrySearch, setShippingCountrySearch] = useState('');
  const shippingCountryRef = useRef(null);

  const [isBillingStateOpen, setIsBillingStateOpen] = useState(false);
  const [billingStateSearch, setBillingStateSearch] = useState('');
  const billingStateRef = useRef(null);

  const [isShippingStateOpen, setIsShippingStateOpen] = useState(false);
  const [shippingStateSearch, setShippingStateSearch] = useState('');
  const shippingStateRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (billingCountryRef.current && !billingCountryRef.current.contains(event.target)) {
        setIsBillingCountryOpen(false);
      }
      if (shippingCountryRef.current && !shippingCountryRef.current.contains(event.target)) {
        setIsShippingCountryOpen(false);
      }
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

  const [loading, setLoading] = useState(false);

  const handleGstChange = (val) => {
    const cleanedVal = val.replace(/\s+/g, '').toUpperCase();
    setGstNumber(cleanedVal);

    if (!cleanedVal) {
      setGstError('');
      return;
    }

    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

    if (cleanedVal.length !== 15) {
      setGstError('GSTIN must be exactly 15 characters');
    } else if (!gstRegex.test(cleanedVal)) {
      setGstError('Invalid GSTIN format');
    } else {
      setGstError('');
    }

    if (cleanedVal.length >= 2) {
      const stateCode = cleanedVal.substring(0, 2);
      const stateName = STATE_CODE_TO_NAME[stateCode];
      if (stateName) {
        setBillingAddress(prev => ({ ...prev, state: stateName, country: prev.country || 'India' }));
      }
    }

    if (cleanedVal.length >= 12) {
      const extractedPan = cleanedVal.substring(2, 12);
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (panRegex.test(extractedPan)) {
        setPan(extractedPan);
      }
    }
  };
  const [groupId, setGroupId] = useState(null);
  const companyId = propCompanyId || sessionStorage.getItem('companyId');
  const addNotification = useNotificationStore(state => state.addNotification);

  // Generate Display Name Options
  const displayNameOptions = useMemo(() => {
    const options = new Set();
    const fullWithSalutation = `${salutation === 'Salutation' ? '' : salutation} ${firstName} ${lastName}`.trim();
    const fullWithoutSalutation = `${firstName} ${lastName}`.trim();
    
    if (fullWithSalutation) options.add(fullWithSalutation);
    if (fullWithoutSalutation) options.add(fullWithoutSalutation);
    if (companyName) options.add(companyName);
    if (firstName) options.add(firstName);
    
    return Array.from(options).filter(opt => opt.length > 0);
  }, [salutation, firstName, lastName, companyName]);

  // Auto-sync removed as per user request to allow manual selection

  useEffect(() => {
    if (!companyId) return;
    
    const resolveGroups = async () => {
       try {
          let res = await groupAPI.getByCompany(companyId);
          if (!res.data || res.data.length === 0) {
             await groupAPI.seedStandard(companyId);
             res = await groupAPI.getByCompany(companyId);
          }
          const creditorGroup = res.data.find(g => g.name.toLowerCase().includes('creditor'));
          if (creditorGroup) setGroupId(creditorGroup.id);
       } catch(e) {
          console.error("Group resolution failed:", e);
       }
    };
    resolveGroups();

    if (isEditMode && editId) {
       setLoading(true);
       ledgerAPI.getByCompany(companyId).then(res => {
          const c = res.data.find(l => String(l.id) === String(editId));
          if (c) {
             setCompanyName(c.companyName || '');
             setSalutation(c.salutation || '');
             setFirstName(c.firstName || '');
             setLastName(c.lastName || '');
             setVendorType(c.customerType || 'Business');
             setEmail(c.email || '');
             setWorkPhone(c.phone || c.workPhone || '');
             setMobile(c.mobile || '');
             setWebsite(c.website || '');
             setPan(c.pan || '');
             setCurrency(c.currency || 'INR- Indian Rupee');
             setPaymentTerms(c.paymentTerms || 'Due on Receipt');
             if (c.gstNumber) {
                 const cleanedGst = c.gstNumber.replace(/\s+/g, '').toUpperCase();
                 setGstNumber(cleanedGst);
                 // Trigger validation on load
                 const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
                 if (cleanedGst.length !== 15) {
                    setGstError('GSTIN must be exactly 15 characters');
                 } else if (!gstRegex.test(cleanedGst)) {
                    setGstError('Invalid GSTIN format');
                 } else {
                    setGstError('');
                 }
              } else {
                 setGstNumber('');
                 setGstError('');
              }
             
             if (c.billingAddressJson) setBillingAddress(JSON.parse(c.billingAddressJson));
             else if (c.billingAddress) setBillingAddress(JSON.parse(c.billingAddress));
             
             if (c.shippingAddressJson) setShippingAddress(JSON.parse(c.shippingAddressJson));
             else if (c.shippingAddress) setShippingAddress(JSON.parse(c.shippingAddress));
             setDisplayName(c.name || '');
          }
       }).catch(err => {
          console.error("Error fetching vendor:", err);
       }).finally(() => setLoading(false));
    }
  }, [editId, isEditMode, companyId]);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!companyId || companyId === 'null' || companyId === 'undefined') {
      addNotification('No active company selected. Please select a company first.', 'error');
      return;
    }
    let ledgerName = displayName || (vendorType === 'Business' ? companyName : `${salutation} ${firstName} ${lastName}`.trim());
    
    if (!ledgerName) {
      if (vendorType === 'Business' && !companyName) {
         addNotification('Company Name is required.', 'error');
         return;
      }
      if (vendorType === 'Individual' && (!firstName || !lastName)) {
         addNotification('First and Last Name are required.', 'error');
         return;
      }
    }

    if (gstNumber) {
      const cleanedGst = gstNumber.replace(/\s+/g, '').toUpperCase();
      if (cleanedGst.length !== 15) {
        addNotification('GSTIN must be exactly 15 characters', 'error');
        return;
      }
      const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstRegex.test(cleanedGst)) {
        addNotification('Invalid GSTIN format', 'error');
        return;
      }
    }

    if (gstError) {
      addNotification(gstError, 'error');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: ledgerName,
        salutation,
        firstName,
        lastName,
        customerType: vendorType,
        email,
        phone: workPhone,
        mobile,
        website,
        pan,
        gstNumber: gstNumber || null,
        companyId,
        CompanyId: companyId,
        groupId,
        groupName: 'Sundry Creditors',
        billingAddress: JSON.stringify(billingAddress),
        shippingAddress: JSON.stringify(shippingAddress),
        billingAddressJson: JSON.stringify(billingAddress),
        currency,
        paymentTerms,
        companyName: vendorType === 'Business' ? companyName : ''
      };

      let result;
      if (isEditMode) {
        result = await ledgerAPI.update(editId, payload);
      } else {
        result = await ledgerAPI.create(payload);
      }
      
      addNotification(`Vendor ${isEditMode ? 'updated' : 'created'} successfully!`, 'success');
      
      if (onSaveSuccess) {
        onSaveSuccess(result.data);
      } else if (standalone) {
        navigate(`/vendors/view/${result.data.id}`, { replace: true });
      }
    } catch (err) {
      console.error(err.response?.data);
      addNotification(err.response?.data?.error || err.message || 'Failed to save vendor', 'error');
    } finally {
      setLoading(false);
    }
  };

  const copyBillingToShipping = () => setShippingAddress({ ...billingAddress });

  const renderContent = () => (
    <div className="space-y-10">
        {/* Section 1: Basic Info */}
        <section className="space-y-6">
            <div className="flex items-center gap-4 mb-8">
                <h3 className="text-[14px] font-bold text-slate-800">Primary Details</h3>
                <div className="h-px bg-slate-100 flex-1"></div>
            </div>

            <div className="space-y-6">
                {/* Vendor Type */}
                <div className="flex items-center">
                    <label className="w-48 text-[13px] font-medium text-slate-500">Vendor Type</label>
                    <div className="flex gap-4">
                        {['Business', 'Individual'].map(t => (
                            <label key={t} className="flex items-center gap-2 cursor-pointer group">
                                <input 
                                    type="radio" 
                                    checked={vendorType === t} 
                                    onChange={() => setVendorType(t)}
                                    className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                                />
                                <span className={`text-[13px] ${vendorType === t ? 'text-slate-900 font-bold' : 'text-slate-500'}`}>{t}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Primary Name */}
                <div className="flex items-start">
                    <label className="w-48 text-[13px] font-medium text-red-500 mt-2">Primary Contact*</label>
                    <div className="flex-1 max-w-2xl space-y-4">
                        <div className="grid grid-cols-12 gap-3 pb-4">
                            <div className="col-span-3">
                                <select 
                                    value={salutation} 
                                    onChange={e => setSalutation(e.target.value)}
                                    className="w-full h-9 px-2 border border-slate-200 rounded text-[13px] outline-none bg-white"
                                >
                                    <option>Salutation</option>
                                    <option>Mr.</option><option>Mrs.</option><option>Ms.</option><option>Dr.</option>
                                </select>
                            </div>
                            <div className="col-span-4">
                                <input 
                                    placeholder="First Name" 
                                    value={firstName} onChange={e => setFirstName(e.target.value)}
                                    className="w-full h-9 px-3 border border-slate-200 rounded text-[13px] outline-none focus:border-blue-400" 
                                />
                            </div>
                            <div className="col-span-5">
                                <input 
                                    placeholder="Last Name" 
                                    value={lastName} onChange={e => setLastName(e.target.value)}
                                    className="w-full h-9 px-3 border border-slate-200 rounded text-[13px] outline-none focus:border-blue-400" 
                                />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center">
                                <label className="w-48 text-[13px] font-medium text-slate-500 shrink-0">Company Name</label>
                                <input 
                                    value={companyName} onChange={e => setCompanyName(e.target.value)}
                                    className="flex-1 h-9 px-3 border border-slate-200 rounded text-[13px] outline-none focus:border-blue-400" 
                                />
                            </div>
                            <div className="flex items-center">
                                <label className="w-48 text-[13px] font-medium text-slate-500 shrink-0">Display Name*</label>
                                <div className="flex-1 relative">
                                    <select 
                                        value={displayName} 
                                        onChange={e => setDisplayName(e.target.value)}
                                        className="w-full h-9 px-3 border border-slate-200 rounded text-[13px] outline-none bg-white focus:border-blue-400 appearance-none"
                                    >
                                        <option value="">Select a Display Name</option>
                                        {displayNameOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                    <div className="absolute right-3 top-2.5 text-slate-300 pointer-events-none flex items-center gap-1">
                                       <ChevronDown size={14} />
                                       <Info size={14} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Email */}
                <div className="flex items-center">
                    <label className="w-48 text-[13px] font-medium text-slate-500">Vendor Email</label>
                    <input 
                        type="email" value={email} onChange={e => setEmail(e.target.value)}
                        className="flex-1 max-w-lg h-9 px-3 border border-slate-200 rounded text-[13px] outline-none focus:border-blue-400" 
                    />
                </div>

                {/* Phone */}
                <div className="flex items-center">
                    <label className="w-48 text-[13px] font-medium text-slate-500">Vendor Phone</label>
                    <div className="flex flex-1 max-w-lg gap-4">
                        <input 
                            placeholder="Work Phone"
                            value={workPhone} onChange={e => setWorkPhone(e.target.value)}
                            className="flex-1 h-9 px-3 border border-slate-200 rounded text-[13px] outline-none focus:border-blue-400" 
                        />
                        <input 
                            placeholder="Mobile"
                            value={mobile} onChange={e => setMobile(e.target.value)}
                            className="flex-1 h-9 px-3 border border-slate-200 rounded text-[13px] outline-none focus:border-blue-400" 
                        />
                    </div>
                </div>

                {/* Website */}
                <div className="flex items-center">
                    <label className="w-48 text-[13px] font-medium text-slate-500">Website</label>
                    <input 
                        type="text" value={website} onChange={e => setWebsite(e.target.value)}
                        className="flex-1 max-w-lg h-9 px-3 border border-slate-200 rounded text-[13px] outline-none focus:border-blue-400" 
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

            <div className="grid grid-cols-2 gap-20">
                {/* Billing */}
                <div className="space-y-6">
                    <h4 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Billing Address</h4>
                    <div className="space-y-4">

                        <div className="space-y-1" ref={billingCountryRef}>
                            <label className="text-[11px] font-medium text-slate-400">Country/Region</label>
                            <div className="relative">
                                <button 
                                   type="button"
                                   onClick={() => {
                                      setIsBillingCountryOpen(!isBillingCountryOpen);
                                      setBillingCountrySearch('');
                                   }}
                                   className={`w-full h-9 px-3 flex items-center justify-between border rounded text-left outline-none bg-white ${isBillingCountryOpen ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-100 text-slate-800'}`}
                                >
                                   <span className="text-[13px] text-slate-700">{billingAddress.country || 'Select Country'}</span>
                                   <div className="flex items-center gap-1.5">
                                      {billingAddress.country && (
                                         <X 
                                           size={14} 
                                           className="text-red-400 hover:text-red-600 transition-colors" 
                                           onClick={(e) => {
                                              e.stopPropagation();
                                              setBillingAddress({...billingAddress, country: ''});
                                           }}
                                         />
                                      )}
                                      <ChevronDown size={14} className={`text-blue-500 transition-transform ${isBillingCountryOpen ? 'rotate-180' : ''}`} />
                                   </div>
                                </button>
                                {isBillingCountryOpen && (
                                   <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded shadow-lg z-50 overflow-hidden">
                                      <div className="p-2 border-b border-slate-100">
                                         <div className="relative">
                                            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                                            <input 
                                               type="text"
                                               value={billingCountrySearch}
                                               onChange={(e) => setBillingCountrySearch(e.target.value)}
                                               placeholder="Search"
                                               className="w-full pl-8 pr-3 py-1.5 border border-slate-300 text-slate-800 rounded focus:outline-none focus:border-blue-500 text-[13px]"
                                               autoFocus
                                            />
                                         </div>
                                      </div>
                                      <div className="max-h-48 overflow-y-auto py-1 custom-scrollbar">
                                         {COUNTRY_CODES.filter(c => c.country.toLowerCase().includes(billingCountrySearch.toLowerCase())).map((c) => (
                                            <button
                                               key={c.country}
                                               type="button"
                                               onClick={() => {
                                                  setBillingAddress({...billingAddress, country: c.country});
                                                  setIsBillingCountryOpen(false);
                                               }}
                                               className={`w-full text-left px-3 py-2 text-[13px] hover:bg-slate-50 transition-colors ${billingAddress.country === c.country ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-700'}`}
                                            >
                                               {c.country}
                                            </button>
                                         ))}
                                         {COUNTRY_CODES.filter(c => c.country.toLowerCase().includes(billingCountrySearch.toLowerCase())).length === 0 && (
                                            <div className="text-[13px] text-slate-500 p-3 text-center">No countries found</div>
                                         )}
                                      </div>
                                   </div>
                                )}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[11px] font-medium text-slate-400">Street Address</label>
                            <textarea value={billingAddress.street1} onChange={e => setBillingAddress({...billingAddress, street1: e.target.value})} className="w-full h-16 p-3 border border-slate-100 rounded text-[13px] outline-none focus:border-blue-300 resize-none" placeholder="Street 1" />
                            <textarea value={billingAddress.street2} onChange={e => setBillingAddress({...billingAddress, street2: e.target.value})} className="w-full h-16 p-3 border border-slate-100 rounded text-[13px] outline-none focus:border-blue-300 resize-none" placeholder="Street 2" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[11px] font-medium text-slate-400">City</label>
                                <input value={billingAddress.city} onChange={e => setBillingAddress({...billingAddress, city: e.target.value})} className="w-full h-9 px-3 border border-slate-100 rounded text-[13px]" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[11px] font-medium text-slate-400">Zip Code</label>
                                <input value={billingAddress.pinCode} onChange={e => setBillingAddress({...billingAddress, pinCode: e.target.value})} className="w-full h-9 px-3 border border-slate-100 rounded text-[13px]" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
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
                                           className={`w-full h-9 px-3 flex items-center justify-between border rounded text-left outline-none bg-white ${isBillingStateOpen ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-100 text-slate-800'}`}
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
                                                       className={`px-3 py-2 text-[13px] cursor-pointer hover:bg-blue-50 ${billingAddress.state === s ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700'}`}
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
                            <div className="space-y-1">
                                <label className="text-[11px] font-medium text-slate-400">Phone</label>
                                <input value={billingAddress.phone} onChange={e => setBillingAddress({...billingAddress, phone: e.target.value})} className="w-full h-9 px-3 border border-slate-100 rounded text-[13px] outline-none focus:border-blue-300" placeholder="Phone Number" />
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

                        <div className="space-y-1" ref={shippingCountryRef}>
                            <label className="text-[11px] font-medium text-slate-400">Country/Region</label>
                            <div className="relative">
                                <button 
                                   type="button"
                                   onClick={() => {
                                      setIsShippingCountryOpen(!isShippingCountryOpen);
                                      setShippingCountrySearch('');
                                   }}
                                   className={`w-full h-9 px-3 flex items-center justify-between border rounded text-left outline-none bg-white ${isShippingCountryOpen ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-100 text-slate-800'}`}
                                >
                                   <span className="text-[13px] text-slate-700">{shippingAddress.country || 'Select Country'}</span>
                                   <div className="flex items-center gap-1.5">
                                      {shippingAddress.country && (
                                         <X 
                                           size={14} 
                                           className="text-red-400 hover:text-red-600 transition-colors" 
                                           onClick={(e) => {
                                              e.stopPropagation();
                                              setShippingAddress({...shippingAddress, country: ''});
                                           }}
                                         />
                                      )}
                                      <ChevronDown size={14} className={`text-blue-500 transition-transform ${isShippingCountryOpen ? 'rotate-180' : ''}`} />
                                   </div>
                                </button>
                                {isShippingCountryOpen && (
                                   <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded shadow-lg z-50 overflow-hidden">
                                      <div className="p-2 border-b border-slate-100">
                                         <div className="relative">
                                            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                                            <input 
                                               type="text"
                                               value={shippingCountrySearch}
                                               onChange={(e) => setShippingCountrySearch(e.target.value)}
                                               placeholder="Search"
                                               className="w-full pl-8 pr-3 py-1.5 border border-slate-300 text-slate-800 rounded focus:outline-none focus:border-blue-500 text-[13px]"
                                               autoFocus
                                            />
                                         </div>
                                      </div>
                                      <div className="max-h-48 overflow-y-auto py-1 custom-scrollbar">
                                         {COUNTRY_CODES.filter(c => c.country.toLowerCase().includes(shippingCountrySearch.toLowerCase())).map((c) => (
                                            <button
                                               key={c.country}
                                               type="button"
                                               onClick={() => {
                                                  setShippingAddress({...shippingAddress, country: c.country});
                                                  setIsShippingCountryOpen(false);
                                               }}
                                               className={`w-full text-left px-3 py-2 text-[13px] hover:bg-slate-50 transition-colors ${shippingAddress.country === c.country ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-700'}`}
                                            >
                                               {c.country}
                                            </button>
                                         ))}
                                         {COUNTRY_CODES.filter(c => c.country.toLowerCase().includes(shippingCountrySearch.toLowerCase())).length === 0 && (
                                            <div className="text-[13px] text-slate-500 p-3 text-center">No countries found</div>
                                         )}
                                      </div>
                                   </div>
                                )}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[11px] font-medium text-slate-400">Street Address</label>
                            <textarea value={shippingAddress.street1} onChange={e => setShippingAddress({...shippingAddress, street1: e.target.value})} className="w-full h-16 p-3 border border-slate-100 rounded text-[13px] outline-none focus:border-blue-300 resize-none" placeholder="Street 1" />
                            <textarea value={shippingAddress.street2} onChange={e => setShippingAddress({...shippingAddress, street2: e.target.value})} className="w-full h-16 p-3 border border-slate-100 rounded text-[13px] outline-none focus:border-blue-300 resize-none" placeholder="Street 2" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[11px] font-medium text-slate-400">City</label>
                                <input value={shippingAddress.city} onChange={e => setShippingAddress({...shippingAddress, city: e.target.value})} className="w-full h-9 px-3 border border-slate-100 rounded text-[13px]" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[11px] font-medium text-slate-400">Zip Code</label>
                                <input value={shippingAddress.pinCode} onChange={e => setShippingAddress({...shippingAddress, pinCode: e.target.value})} className="w-full h-9 px-3 border border-slate-100 rounded text-[13px]" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
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
                                           className={`w-full h-9 px-3 flex items-center justify-between border rounded text-left outline-none bg-white ${isShippingStateOpen ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-100 text-slate-800'}`}
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
                                                       className={`px-3 py-2 text-[13px] cursor-pointer hover:bg-blue-50 ${shippingAddress.state === s ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700'}`}
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
                            <div className="space-y-1">
                                <label className="text-[11px] font-medium text-slate-400">Phone</label>
                                <input value={shippingAddress.phone} onChange={e => setShippingAddress({...shippingAddress, phone: e.target.value})} className="w-full h-9 px-3 border border-slate-100 rounded text-[13px] outline-none focus:border-blue-300" placeholder="Phone Number" />
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

            <div className="space-y-6">
                <div className="flex items-center">
                    <label className="w-48 text-[13px] font-medium text-slate-500">Currency</label>
                    <select value={currency} onChange={e => setCurrency(e.target.value)} className="flex-1 max-w-lg h-9 px-3 border border-slate-200 rounded text-[13px] outline-none bg-white font-sans">
                        {CURRENCIES.map(c => <option key={c.code} value={c.display}>{c.display}</option>)}
                    </select>
                </div>

                <div className="flex items-center">
                    <label className="w-48 text-[13px] font-medium text-slate-500">Payment Terms</label>
                    <select value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} className="flex-1 max-w-lg h-9 px-3 border border-slate-200 rounded text-[13px] outline-none bg-white">
                        <option value="Due on Receipt">Due on Receipt</option>
                        <option value="Net 15">Net 15</option>
                        <option value="Net 30">Net 30</option>
                        <option value="Net 45">Net 45</option>
                    </select>
                </div>

                <div className="flex items-center">
                    <label className="w-48 text-[13px] font-medium text-slate-500 text-red-500">PAN Number</label>
                    <input 
                        value={pan} onChange={e => setPan(e.target.value.toUpperCase())}
                        className="flex-1 max-w-lg h-9 px-3 border border-slate-200 rounded text-[13px] outline-none focus:border-blue-400 capitalize" 
                        placeholder="ABCDE1234F"
                    />
                </div>

                <div className="flex items-start">
                    <label className="w-48 text-[13px] font-medium text-slate-500 mt-2">GSTIN Number</label>
                    <div className="flex-1 max-w-lg space-y-1">
                        <div className="relative flex items-center">
                            <input 
                                value={gstNumber} 
                                onChange={e => handleGstChange(e.target.value)}
                                className={`w-full h-9 px-3 pr-10 border rounded text-[13px] outline-none font-mono focus:ring-1 focus:ring-opacity-50 ${
                                  gstNumber 
                                    ? gstError 
                                      ? 'border-red-400 focus:border-red-500 focus:ring-red-100 bg-red-50/10' 
                                      : 'border-green-400 focus:border-green-500 focus:ring-green-100 bg-green-50/10' 
                                    : 'border-slate-200 focus:border-blue-400 focus:ring-blue-100'
                                }`} 
                                placeholder="Ex: 33AABCR5678B1Z5"
                            />
                            {gstNumber && (
                              <div className="absolute right-3 top-2.5">
                                {gstError ? (
                                  <AlertCircle size={16} className="text-red-500" />
                                ) : (
                                  <CheckCircle2 size={16} className="text-green-500" />
                                )}
                              </div>
                            )}
                        </div>
                        {gstNumber && gstError && (
                          <p className="text-[11px] font-medium text-red-500 flex items-center gap-1">
                            <AlertCircle size={12} /> {gstError}
                          </p>
                        )}
                        {gstNumber && !gstError && (
                          <p className="text-[11px] font-medium text-green-600 flex items-center gap-1">
                            <CheckCircle2 size={12} /> Valid GSTIN Format
                          </p>
                        )}
                    </div>
                </div>
            </div>
        </section>
    </div>
  );

  if (!standalone) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto p-8 mb-20">
          {renderContent()}
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-6 flex justify-end gap-3 rounded-b-lg">
           <button type="button" onClick={handleCancelOrBack} className="px-6 py-2 text-slate-500 text-[13px] font-bold hover:bg-slate-50 rounded">Cancel</button>
           <button 
              onClick={handleSave} 
              disabled={loading}
              className="px-10 py-2 bg-blue-600 text-white rounded font-bold text-[14px] hover:bg-blue-700 disabled:opacity-50"
           >
              {loading ? 'Saving...' : 'Save Vendor'}
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
        <header className="px-8 py-3 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-50">
            <div className="flex items-center gap-3">
                <button type="button" onClick={handleCancelOrBack} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 cursor-pointer">
                    <ArrowLeft size={18} />
                </button>
                <div className="flex items-center gap-2">
                    <div className="bg-slate-100 p-1.5 rounded">
                        <Truck size={16} className="text-slate-600" />
                    </div>
                    <h2 className="text-[17px] font-bold text-slate-800">{isEditMode ? 'Edit Vendor' : 'New Vendor'}</h2>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button type="button" onClick={handleCancelOrBack} className="px-4 py-1.5 text-slate-600 text-[13px] font-medium hover:bg-slate-50 rounded border border-slate-200 cursor-pointer">Cancel</button>
                <button type="button" onClick={handleSave} disabled={loading} className="px-6 py-1.5 bg-blue-600 text-white text-[13px] font-bold rounded hover:bg-blue-700 shadow-sm transition-all cursor-pointer">
                    {loading ? 'Saving...' : 'Save'}
                </button>
            </div>
        </header>

        <div className="flex-1 overflow-y-auto px-12 py-10 max-w-6xl mx-auto w-full pb-32">
            {renderContent()}
        </div>

        {/* Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] z-[60]">
            <div className="max-w-6xl mx-auto px-12 py-4 flex justify-between items-center">
                 <div></div>
                 <div className="flex items-center gap-3">
                    <button type="button" onClick={handleCancelOrBack} className="px-6 py-2 text-slate-500 text-[13px] font-bold hover:bg-slate-50 rounded cursor-pointer">Discard</button>
                    <button 
                        type="button"
                        onClick={handleSave} 
                        disabled={loading}
                        className="px-10 py-2 bg-blue-600 text-white rounded font-bold text-[14px] hover:bg-blue-700 shadow-xl shadow-blue-500/10 transition-all uppercase tracking-widest disabled:opacity-50"
                    >
                        {loading ? 'Processing...' : 'Save Vendor Profile'}
                    </button>
                 </div>
            </div>
        </div>
    </div>
  );
};

export default VendorForm;
