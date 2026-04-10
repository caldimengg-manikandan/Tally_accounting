import React, { useState, useEffect } from 'react';
import { 
  Info, Mail, Phone, MapPin, Building, ShieldCheck, 
  AlertCircle, Loader2, Plus, Save, X, Activity, CheckCircle2,
  ChevronRight, ChevronDown, ArrowRight, ArrowLeft, Copy, Trash2, MoreVertical,
  Upload, FileText, Globe, CreditCard, Clock, Download, Search, User
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { ledgerAPI, groupAPI } from '../../services/api';
import { COUNTRY_CODES } from '../../utils/countryCodes';
import { INDIAN_STATES } from '../../utils/indianStates';
import useNotificationStore from '../../store/notificationStore';

import { CURRENCIES } from '../../utils/currencies';

const CustomersView = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  
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

  // Tax & Terms
  const [pan, setPan] = useState('');
  const [currency, setCurrency] = useState('INR- Indian Rupee');
  const [paymentTerms, setPaymentTerms] = useState('Due on Receipt');
  
  // Addresses
  const initialAddress = { attention: '', country: 'India', street1: '', street2: '', city: '', state: '', pinCode: '', phone: '' };
  const [billingAddress, setBillingAddress] = useState({ ...initialAddress });
  const [shippingAddress, setShippingAddress] = useState({ ...initialAddress });

  const [loading, setLoading] = useState(false);
  const companyId = localStorage.getItem('companyId');

  useEffect(() => {
    if (isEditMode && id) {
       setLoading(true);
       ledgerAPI.getByCompany(companyId).then(res => {
          const c = res.data.find(l => String(l.id) === String(id));
          if (c) {
             setCompanyName(c.name || '');
             setSalutation(c.salutation || '');
             setFirstName(c.firstName || '');
             setLastName(c.lastName || '');
             setCustomerType(c.customerType || 'Business');
             setEmail(c.email || '');
             setWorkPhone(c.phone || '');
             setMobile(c.mobile || '');
             setWebsite(c.website || '');
             setPan(c.pan || '');
             setCurrency(c.currency || 'INR- Indian Rupee');
             setPaymentTerms(c.paymentTerms || 'Due on Receipt');
             if (c.billingAddressJson) setBillingAddress(JSON.parse(c.billingAddressJson));
             else if (c.billingAddress) setBillingAddress(JSON.parse(c.billingAddress));
             if (c.shippingAddressJson) setShippingAddress(JSON.parse(c.shippingAddressJson));
             else if (c.shippingAddress) setShippingAddress(JSON.parse(c.shippingAddress));
          }
       }).finally(() => setLoading(false));
    }
  }, [id, isEditMode]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!companyName) {
      addNotification('Company Name is required.', 'error');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name: companyName,
        salutation,
        firstName,
        lastName,
        customerType,
        email,
        phone: workPhone,
        mobile,
        website,
        pan,
        companyId,
        groupName: 'Sundry Debtors',
        billingAddress: JSON.stringify(billingAddress),
        shippingAddress: JSON.stringify(shippingAddress),
        currency,
        paymentTerms
      };

      if (isEditMode) {
        await ledgerAPI.update(id, payload);
      } else {
        await ledgerAPI.create(payload);
      }
      navigate('/customers');
    } catch (err) {
      addNotification('Failed to save customer', 'error');
    } finally {
      setLoading(false);
    }
  };

  const copyBillingToShipping = () => setShippingAddress({ ...billingAddress });

  return (
    <div className="flex flex-col min-h-screen bg-white">
        <header className="px-8 py-3 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-50">
            <div className="flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-50 rounded-full text-slate-400">
                    <ArrowLeft size={18} />
                </button>
                <div className="flex items-center gap-2">
                    <div className="bg-slate-100 p-1.5 rounded">
                        <User size={16} className="text-slate-600" />
                    </div>
                    <h2 className="text-[17px] font-bold text-slate-800">{isEditMode ? 'Edit Customer' : 'New Customer'}</h2>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={() => navigate(-1)} className="px-4 py-1.5 text-slate-600 text-[13px] font-medium hover:bg-slate-50 rounded border border-slate-200">Cancel</button>
                <button onClick={handleSave} disabled={loading} className="px-6 py-1.5 bg-blue-600 text-white text-[13px] font-bold rounded hover:bg-blue-700 shadow-sm transition-all">
                    {loading ? 'Saving...' : 'Save'}
                </button>
            </div>
        </header>

        <div className="flex-1 overflow-y-auto px-12 py-10 max-w-6xl mx-auto w-full pb-32">
            <div className="space-y-10">
                {/* Section 1: Basic Info */}
                <section className="space-y-6">
                    <div className="flex items-center gap-4 mb-8">
                        <h3 className="text-[14px] font-bold text-slate-800">Primary Details</h3>
                        <div className="h-px bg-slate-100 flex-1"></div>
                    </div>

                    <div className="space-y-6">
                        {/* Customer Type */}
                        <div className="flex items-center">
                            <label className="w-48 text-[13px] font-medium text-slate-500">Customer Type</label>
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
                            <label className="w-48 text-[13px] font-medium text-red-500 mt-2">Primary Contact*</label>
                            <div className="flex-1 max-w-2xl space-y-4">
                                <div className="grid grid-cols-12 gap-3 pb-4">
                                    <div className="col-span-2">
                                        <select 
                                            value={salutation} 
                                            onChange={e => setSalutation(e.target.value)}
                                            className="w-full h-9 px-2 border border-slate-200 rounded text-[13px] outline-none bg-white"
                                        >
                                            <option>Salutation</option>
                                            <option>Mr.</option><option>Mrs.</option><option>Ms.</option><option>Dr.</option>
                                        </select>
                                    </div>
                                    <div className="col-span-5">
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
                                            <input 
                                                value={companyName} readOnly
                                                className="w-full h-9 px-3 border border-slate-200 rounded text-[13px] bg-slate-50 cursor-not-allowed outline-none" 
                                            />
                                            <Info size={14} className="absolute right-3 top-2.5 text-slate-300 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Email */}
                        <div className="flex items-center">
                            <label className="w-48 text-[13px] font-medium text-slate-500">Customer Email</label>
                            <input 
                                type="email" value={email} onChange={e => setEmail(e.target.value)}
                                className="flex-1 max-w-lg h-9 px-3 border border-slate-200 rounded text-[13px] outline-none focus:border-blue-400" 
                            />
                        </div>

                        {/* Phone */}
                        <div className="flex items-center">
                            <label className="w-48 text-[13px] font-medium text-slate-500">Customer Phone</label>
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
                            <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Billing Address</h4>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-medium text-slate-400">Attention</label>
                                    <input value={billingAddress.attention} onChange={e => setBillingAddress({...billingAddress, attention: e.target.value})} className="w-full h-9 px-3 border border-slate-100 rounded text-[13px] outline-none focus:border-blue-300" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-medium text-slate-400">Country/Region</label>
                                    <select value={billingAddress.country} onChange={e => setBillingAddress({...billingAddress, country: e.target.value})} className="w-full h-9 px-3 border border-slate-100 rounded text-[13px] outline-none bg-white">
                                        <option value="">Select Country</option>
                                        {COUNTRY_CODES.map(c => <option key={c.country} value={c.country}>{c.flag} {c.country}</option>)}
                                    </select>
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
                                <div className="space-y-1">
                                    <label className="text-[11px] font-medium text-slate-400">State</label>
                                    <select value={billingAddress.state} onChange={e => setBillingAddress({...billingAddress, state: e.target.value})} className="w-full h-9 px-3 border border-slate-100 rounded text-[13px] bg-white">
                                        <option value="">Select State</option>
                                        {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Shipping */}
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Shipping Address</h4>
                                <button type="button" onClick={copyBillingToShipping} className="text-[11px] font-black text-blue-600 hover:underline uppercase tracking-widest flex items-center gap-1">
                                    <Copy size={12}/> Copy Billing
                                </button>
                            </div>
                            <div className="space-y-4 opacity-90">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-medium text-slate-400">Attention</label>
                                    <input value={shippingAddress.attention} onChange={e => setShippingAddress({...shippingAddress, attention: e.target.value})} className="w-full h-9 px-3 border border-slate-100 rounded text-[13px] outline-none focus:border-blue-300" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-medium text-slate-400">Country/Region</label>
                                    <select value={shippingAddress.country} onChange={e => setShippingAddress({...shippingAddress, country: e.target.value})} className="w-full h-9 px-3 border border-slate-100 rounded text-[13px] outline-none bg-white">
                                        <option value="">Select Country</option>
                                        {COUNTRY_CODES.map(c => <option key={c.country} value={c.country}>{c.flag} {c.country}</option>)}
                                    </select>
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
                                <div className="space-y-1">
                                    <label className="text-[11px] font-medium text-slate-400">State</label>
                                    <select value={shippingAddress.state} onChange={e => setShippingAddress({...shippingAddress, state: e.target.value})} className="w-full h-9 px-3 border border-slate-100 rounded text-[13px] bg-white">
                                        <option value="">Select State</option>
                                        {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
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
                                value={pan} onChange={e => setPan(e.target.value)}
                                className="flex-1 max-w-lg h-9 px-3 border border-slate-200 rounded text-[13px] outline-none focus:border-blue-400 capitalize" 
                                placeholder="ABCDE1234F"
                            />
                        </div>
                    </div>
                </section>
            </div>
        </div>

        {/* Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] z-[60]">
            <div className="max-w-6xl mx-auto px-12 py-4 flex justify-between items-center">
                 <div className="flex items-center gap-2 text-slate-400 text-[11px] font-medium uppercase tracking-wider">
                    <ShieldCheck size={14} className="text-blue-500" /> Encrypted & Secure Record Storage
                 </div>
                 <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="px-6 py-2 text-slate-500 text-[13px] font-bold hover:bg-slate-50 rounded">Discard</button>
                    <button 
                        onClick={handleSave} 
                        disabled={loading}
                        className="px-10 py-2 bg-blue-600 text-white rounded font-black text-[14px] hover:bg-blue-700 shadow-xl shadow-blue-500/10 transition-all uppercase tracking-widest disabled:opacity-50"
                    >
                        {loading ? 'Processing...' : 'Save Customer Profile'}
                    </button>
                 </div>
            </div>
        </div>
    </div>
  );
};

export default CustomersView;
