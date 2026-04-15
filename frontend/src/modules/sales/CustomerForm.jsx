import React, { useState, useEffect, useMemo } from 'react';
import { 
  Info, Mail, Phone, MapPin, Building, ShieldCheck, 
  AlertCircle, Loader2, Plus, Save, X, Activity, CheckCircle2,
  ChevronRight, ChevronDown, ArrowRight, ArrowLeft, Copy, Trash2, MoreVertical,
  Upload, FileText, Globe, CreditCard, Clock, Download, Search, User
} from 'lucide-react';
import { ledgerAPI, groupAPI } from '../../services/api';
import { COUNTRY_CODES } from '../../utils/countryCodes';
import { INDIAN_STATES } from '../../utils/indianStates';
import useNotificationStore from '../../store/notificationStore';
import { CURRENCIES } from '../../utils/currencies';

const CustomerForm = ({ onSaveSuccess, onCancel, customerToEdit = null, standalone = true }) => {
  const [loading, setLoading] = useState(false);
  const companyId = localStorage.getItem('companyId');
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
  const [currency, setCurrency] = useState('INR- Indian Rupee');
  const [paymentTerms, setPaymentTerms] = useState('Due on Receipt');
  
  // Addresses
  const initialAddress = { attention: '', country: 'India', street1: '', street2: '', city: '', state: '', pinCode: '', phone: '' };
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

  // Auto-select first display name option when options change
  useEffect(() => {
    if (displayNameOptions.length > 0) {
      setDisplayName(prev => {
        // If current value is not in options, reset to first option
        if (!prev || !displayNameOptions.includes(prev)) {
          return displayNameOptions[0];
        }
        return prev;
      });
    } else {
      setDisplayName('');
    }
  }, [displayNameOptions]);

  useEffect(() => {
    if (customerToEdit) {
       setCompanyName(customerToEdit.name || ''); // Defaulting name to company/display name
       setSalutation(customerToEdit.salutation || '');
       setFirstName(customerToEdit.firstName || '');
       setLastName(customerToEdit.lastName || '');
       setCustomerType(customerToEdit.customerType || 'Business');
       setEmail(customerToEdit.email || '');
       setWorkPhone(customerToEdit.phone || '');
       setMobile(customerToEdit.mobile || '');
       setWebsite(customerToEdit.website || '');
       setPan(customerToEdit.pan || '');
       setCurrency(customerToEdit.currency || 'INR- Indian Rupee');
       setPaymentTerms(customerToEdit.paymentTerms || 'Due on Receipt');
       
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

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    let ledgerName = displayName || (customerType === 'Business' ? companyName : `${salutation} ${firstName} ${lastName}`.trim());
    
    if (!ledgerName) {
      addNotification('Display Name is required.', 'error');
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
            <header className="px-8 py-3 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-50">
                <div className="flex items-center gap-3">
                    <button onClick={onCancel} className="p-2 hover:bg-slate-50 rounded-full text-slate-400">
                        <ArrowLeft size={18} />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="bg-slate-100 p-1.5 rounded">
                            <User size={16} className="text-slate-600" />
                        </div>
                        <h2 className="text-[17px] font-bold text-slate-800">{customerToEdit ? 'Edit Customer' : 'New Customer'}</h2>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={onCancel} className="px-4 py-1.5 text-slate-600 text-[13px] font-medium hover:bg-slate-50 rounded border border-slate-200">Cancel</button>
                    <button onClick={handleSave} disabled={loading} className="px-6 py-1.5 bg-blue-600 text-white text-[13px] font-bold rounded hover:bg-blue-700 shadow-sm transition-all">
                        {loading ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </header>
        )}

        <div className={`flex-1 overflow-y-auto ${standalone ? 'px-12 py-10 pb-32 max-w-6xl mx-auto w-full' : 'px-8 py-6 pb-24 w-full custom-scrollbar'}`}>
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
                                            className="w-full h-9 px-2 border border-slate-200 rounded text-[13px] outline-none bg-white font-medium"
                                        >
                                            <option value="">Salutation</option>
                                            <option>Mr.</option><option>Mrs.</option><option>Ms.</option><option>Dr.</option>
                                        </select>
                                    </div>
                                    <div className="col-span-5">
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
                                        <label className="w-48 text-[13px] font-medium text-slate-500 shrink-0">Company Name</label>
                                        <input 
                                            value={companyName} onChange={e => setCompanyName(e.target.value)}
                                            className="flex-1 h-9 px-3 border border-slate-200 rounded text-[13px] outline-none focus:border-blue-400 font-medium" 
                                        />
                                    </div>
                                    <div className="flex items-center">
                                        <label className="w-48 text-[13px] font-medium text-slate-500 shrink-0">Display Name*</label>
                                        <div className="flex-1 relative">
                                            <select 
                                                value={displayName} 
                                                onChange={e => setDisplayName(e.target.value)}
                                                className="w-full h-9 px-3 border border-slate-200 rounded text-[13px] outline-none bg-white focus:border-blue-400 appearance-none font-bold text-blue-600"
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
                            <label className="w-48 text-[13px] font-medium text-slate-500">Customer Email</label>
                            <input 
                                type="email" value={email} onChange={e => setEmail(e.target.value)}
                                className="flex-1 max-w-lg h-9 px-3 border border-slate-200 rounded text-[13px] outline-none focus:border-blue-400 font-medium" 
                            />
                        </div>

                        {/* Phone */}
                        <div className="flex items-center">
                            <label className="w-48 text-[13px] font-medium text-slate-500">Customer Phone</label>
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
                            <label className="w-48 text-[13px] font-medium text-slate-500">Website</label>
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
                            <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Billing Address</h4>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-medium text-slate-400">Attention</label>
                                    <input value={billingAddress.attention} onChange={e => setBillingAddress({...billingAddress, attention: e.target.value})} className="w-full h-9 px-3 border border-slate-100 rounded text-[13px] outline-none focus:border-blue-300 font-medium" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-medium text-slate-400">Country/Region</label>
                                    <select value={billingAddress.country} onChange={e => setBillingAddress({...billingAddress, country: e.target.value})} className="w-full h-9 px-3 border border-slate-100 rounded text-[13px] outline-none bg-white font-medium">
                                        <option value="">Select Country</option>
                                        {COUNTRY_CODES.map(c => <option key={c.country} value={c.country}>{c.flag} {c.country}</option>)}
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
                                    <select value={billingAddress.state} onChange={e => setBillingAddress({...billingAddress, state: e.target.value})} className="w-full h-9 px-3 border border-slate-100 rounded text-[13px] bg-white font-medium">
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
                                    <input value={shippingAddress.attention} onChange={e => setShippingAddress({...shippingAddress, attention: e.target.value})} className="w-full h-9 px-3 border border-slate-100 rounded text-[13px] outline-none focus:border-blue-300 font-medium" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-medium text-slate-400">Country/Region</label>
                                    <select value={shippingAddress.country} onChange={e => setShippingAddress({...shippingAddress, country: e.target.value})} className="w-full h-9 px-3 border border-slate-100 rounded text-[13px] outline-none bg-white font-medium">
                                        <option value="">Select Country</option>
                                        {COUNTRY_CODES.map(c => <option key={c.country} value={c.country}>{c.flag} {c.country}</option>)}
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
                                    <select value={shippingAddress.state} onChange={e => setShippingAddress({...shippingAddress, state: e.target.value})} className="w-full h-9 px-3 border border-slate-100 rounded text-[13px] bg-white font-medium">
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
                            <select value={currency} onChange={e => setCurrency(e.target.value)} className="flex-1 max-w-lg h-9 px-3 border border-slate-200 rounded text-[13px] outline-none bg-white font-medium">
                                {CURRENCIES.map(c => <option key={c.code} value={c.display}>{c.display}</option>)}
                            </select>
                        </div>

                        <div className="flex items-center">
                            <label className="w-48 text-[13px] font-medium text-slate-500">Payment Terms</label>
                            <select value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} className="flex-1 max-w-lg h-9 px-3 border border-slate-200 rounded text-[13px] outline-none bg-white font-medium">
                                <option value="Due on Receipt">Due on Receipt</option>
                                <option value="Net 15">Net 15</option>
                                <option value="Net 30">Net 30</option>
                                <option value="Net 45">Net 45</option>
                            </select>
                        </div>

                        <div className="flex items-center">
                            <label className="w-48 text-[13px] font-medium text-red-500">PAN Number</label>
                            <input 
                                value={pan} onChange={e => setPan(e.target.value)}
                                className="flex-1 max-w-lg h-9 px-3 border border-slate-200 rounded text-[13px] outline-none focus:border-blue-400 capitalize font-bold text-slate-700" 
                                placeholder="ABCDE1234F"
                            />
                        </div>
                    </div>
                </section>
            </div>
        </div>

        {/* Action Bar */}
        <div className={`${standalone ? 'fixed bottom-0' : 'sticky bottom-0'} left-0 right-0 bg-white border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] z-[60]`}>
            <div className={`max-w-6xl mx-auto ${standalone ? 'px-12 py-4' : 'px-8 py-3'} flex justify-between items-center`}>
                 <div className="flex items-center gap-2 text-slate-400 text-[11px] font-medium uppercase tracking-wider">
                    <ShieldCheck size={14} className="text-blue-500" /> Encrypted & Secure Record Storage
                 </div>
                 <div className="flex items-center gap-3">
                    <button onClick={onCancel} className="px-6 py-2 text-slate-500 text-[13px] font-bold hover:bg-slate-50 rounded">Discard</button>
                    <button 
                        onClick={handleSave} 
                        disabled={loading}
                        className="px-10 py-2 bg-[#1e61f0] text-white rounded font-black text-[14px] hover:bg-blue-700 shadow-xl shadow-blue-500/10 transition-all uppercase tracking-widest disabled:opacity-50"
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
