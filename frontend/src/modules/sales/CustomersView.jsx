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
             setEmail(c.email || '');
             setWorkPhone(c.phone || '');
             setMobile(c.mobile || '');
             // Map other fields as needed
          }
       }).finally(() => setLoading(false));
    }
  }, [id, isEditMode]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!companyName) return alert('Company Name is required.');
    setLoading(true);
    try {
      const payload = {
        name: companyName,
        email,
        phone: workPhone,
        mobile,
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
      alert('Failed to save customer');
    } finally {
      setLoading(false);
    }
  };

  const copyBillingToShipping = () => setShippingAddress({ ...billingAddress });

  return (
    <div className="flex flex-col min-h-full">
       {/* Sticky Header */}
       <header className="sticky top-0 bg-white border-b border-slate-200 px-10 py-5 flex items-center justify-between z-40 shadow-sm shrink-0">
          <div className="flex items-center gap-4">
             <button onClick={() => navigate('/customers')} className="p-2 hover:bg-slate-50 rounded text-slate-400 font-bold transition-all flex items-center gap-1">
                <ArrowLeft size={20}/>
             </button>
             <h2 className="text-[20px] font-black italic text-slate-900 uppercase tracking-tighter">
                {isEditMode ? 'Edit Customer Profile' : 'Register New Customer'}
             </h2>
          </div>
          <div className="flex items-center gap-4">
             <button onClick={() => navigate('/customers')} className="text-slate-500 font-bold text-[13px] hover:text-slate-800 uppercase tracking-widest">Cancel</button>
             <button 
                onClick={handleSave} 
                disabled={loading}
                className="bg-[#1e61f0] text-white px-8 py-2.5 rounded font-black text-[13px] hover:bg-blue-700 shadow-lg shadow-blue-100 uppercase tracking-[0.2em] transition-all disabled:opacity-50"
             >
                {loading ? 'Processing...' : 'Save Customer'}
             </button>
          </div>
       </header>

        <div className="flex-1 py-10 px-12 max-w-[1240px] w-full mx-auto animate-fade-up">
          <form className="space-y-8" onSubmit={handleSave}>
             
             {/* Section 1: Primary Info */}
             <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-10">
                <div className="flex items-center gap-3 mb-10 border-b border-slate-50 pb-6">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-black">01</div>
                    <h3 className="text-[16px] font-black text-slate-800 uppercase tracking-widest">Primary Details</h3>
                </div>

                <div className="grid grid-cols-12 gap-8 mb-10">
                   <div className="col-span-4">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Customer Type</label>
                      <div className="flex gap-4 p-1 bg-slate-50 rounded-lg">
                         {['Business', 'Individual'].map(t => (
                            <button 
                                key={t} type="button" 
                                onClick={() => setCustomerType(t)}
                                className={`flex-1 py-1.5 rounded-md text-[13px] font-bold transition-all ${customerType === t ? 'bg-white shadow text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                               {t}
                            </button>
                         ))}
                      </div>
                   </div>
                   <div className="col-span-8">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Display Name / Company Name*</label>
                      <div className="relative group">
                         <Building size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600" />
                         <input 
                            type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} 
                            className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded text-[14px] font-bold outline-none focus:border-blue-600 focus:bg-white transition-all shadow-inner"
                            placeholder="e.g. Acme Corporation"
                         />
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-10">
                   <div>
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Email Address</label>
                      <div className="relative">
                         <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                         <input 
                            type="email" value={email} onChange={e => setEmail(e.target.value)} 
                            className="w-full pl-12 pr-4 py-2.5 border border-slate-100 rounded text-[14px] font-bold outline-none focus:border-blue-600 transition-all"
                            placeholder="contact@company.com"
                         />
                      </div>
                   </div>
                   <div>
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Website</label>
                      <div className="relative">
                         <Globe size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                         <input 
                            type="text" value={website} onChange={e => setWebsite(e.target.value)} 
                            className="w-full pl-12 pr-4 py-2.5 border border-slate-100 rounded text-[14px] font-bold outline-none focus:border-blue-600 transition-all"
                            placeholder="www.company.com"
                         />
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                   <div>
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Official Phone</label>
                      <div className="relative">
                         <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                         <input 
                            type="text" value={workPhone} onChange={e => setWorkPhone(e.target.value)} 
                            className="w-full pl-12 pr-4 py-2.5 border border-slate-100 rounded text-[14px] font-bold outline-none focus:border-blue-600 transition-all"
                            placeholder="+91 XXXXX XXXXX"
                         />
                      </div>
                   </div>
                   <div>
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Mobile Phone</label>
                      <div className="relative">
                         <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                         <input 
                            type="text" value={mobile} onChange={e => setMobile(e.target.value)} 
                            className="w-full pl-12 pr-4 py-2.5 border border-slate-100 rounded text-[14px] font-bold outline-none focus:border-blue-600 transition-all"
                            placeholder="+91 XXXXX XXXXX"
                         />
                      </div>
                   </div>
                </div>
             </div>

             {/* Section 2: Addresses */}
             <div className="grid grid-cols-2 gap-8">
                {/* Billing */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8">
                   <div className="flex items-center justify-between mb-8 border-b border-slate-50 pb-4">
                      <h3 className="text-[14px] font-black text-slate-700 uppercase tracking-widest">Billing Address</h3>
                      <MapPin size={18} className="text-blue-500"/>
                   </div>
                   <div className="space-y-6">
                      <textarea 
                        className="w-full border border-slate-100 rounded py-2.5 px-3 text-[13px] font-bold outline-none focus:border-blue-600 transition-all resize-none" 
                        placeholder="Street Address Line 1" rows="2"
                        value={billingAddress.street1} onChange={e => setBillingAddress({...billingAddress, street1: e.target.value})}
                      />
                      <div className="grid grid-cols-2 gap-4">
                         <input 
                            className="w-full border border-slate-100 rounded py-2 px-3 text-[13px] font-bold outline-none focus:border-blue-600 transition-all" placeholder="City" 
                            value={billingAddress.city} onChange={e => setBillingAddress({...billingAddress, city: e.target.value})}
                         />
                         <input 
                            className="w-full border border-slate-100 rounded py-2 px-3 text-[13px] font-bold outline-none focus:border-blue-600 transition-all" placeholder="Pin Code" 
                            value={billingAddress.pinCode} onChange={e => setBillingAddress({...billingAddress, pinCode: e.target.value})}
                         />
                      </div>
                      <select 
                         className="w-full border border-slate-100 rounded py-2 px-3 text-[13px] font-bold outline-none focus:border-blue-600 bg-white"
                         value={billingAddress.state} onChange={e => setBillingAddress({...billingAddress, state: e.target.value})}
                      >
                         <option value="">Select State</option>
                         {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                   </div>
                </div>

                {/* Shipping */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8">
                   <div className="flex items-center justify-between mb-8 border-b border-slate-50 pb-4">
                      <h3 className="text-[14px] font-black text-slate-700 uppercase tracking-widest">Shipping Address</h3>
                      <button type="button" onClick={copyBillingToShipping} className="text-[11px] font-black text-blue-600 hover:underline uppercase tracking-widest">Copy Billing</button>
                   </div>
                   <div className="space-y-6">
                      <textarea 
                        className="w-full border border-slate-100 rounded py-2.5 px-3 text-[13px] font-bold outline-none focus:border-blue-600 transition-all resize-none" 
                        placeholder="Street Address Line 1" rows="2"
                        value={shippingAddress.street1} onChange={e => setShippingAddress({...shippingAddress, street1: e.target.value})}
                      />
                      <div className="grid grid-cols-2 gap-4">
                         <input 
                            className="w-full border border-slate-100 rounded py-2 px-3 text-[13px] font-bold outline-none focus:border-blue-600 transition-all" placeholder="City" 
                            value={shippingAddress.city} onChange={e => setShippingAddress({...shippingAddress, city: e.target.value})}
                         />
                         <input 
                            className="w-full border border-slate-100 rounded py-2 px-3 text-[13px] font-bold outline-none focus:border-blue-600 transition-all" placeholder="Pin Code" 
                            value={shippingAddress.pinCode} onChange={e => setShippingAddress({...shippingAddress, pinCode: e.target.value})}
                         />
                      </div>
                      <select 
                         className="w-full border border-slate-100 rounded py-2 px-3 text-[13px] font-bold outline-none focus:border-blue-600 bg-white"
                         value={shippingAddress.state} onChange={e => setShippingAddress({...shippingAddress, state: e.target.value})}
                      >
                         <option value="">Select State</option>
                         {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                   </div>
                </div>
             </div>

             {/* Section 3: Financials */}
             <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-10">
                <div className="flex items-center gap-3 mb-10 border-b border-slate-50 pb-6">
                    <div className="w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center font-black italic">!</div>
                    <h3 className="text-[16px] font-black text-slate-800 uppercase tracking-widest">Business Configuration</h3>
                </div>

                <div className="grid grid-cols-3 gap-8">
                   <div>
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Currency</label>
                      <select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full border border-slate-100 rounded py-2.5 px-3 text-[14px] font-bold outline-none focus:border-blue-600 bg-slate-50">
                         <option value="INR- Indian Rupee">INR - Indian Rupee</option>
                         <option value="USD- US Dollar">USD - US Dollar</option>
                      </select>
                   </div>
                   <div>
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 block">PAN Number</label>
                      <input value={pan} onChange={e => setPan(e.target.value)} className="w-full border border-slate-100 rounded py-2.5 px-3 text-[14px] font-bold outline-none focus:border-blue-600" placeholder="XXXXX0000X" />
                   </div>
                   <div>
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Payment Terms</label>
                      <select value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} className="w-full border border-slate-100 rounded py-2.5 px-3 text-[14px] font-bold outline-none focus:border-blue-600 bg-slate-50">
                         <option value="Due on Receipt">Due on Receipt</option>
                         <option value="Net 15">Net 15</option>
                         <option value="Net 30">Net 30</option>
                         <option value="Net 45">Net 45</option>
                      </select>
                   </div>
                </div>
             </div>
           </form>
        </div>

        {/* Fixed Footer with Save Action */}
        <footer className="fixed bottom-0 right-0 left-0 bg-white border-t border-slate-200 px-12 py-4 flex justify-between items-center z-50">
           <div className="flex items-center gap-2 text-slate-400 text-[12px] font-bold">
              <AlertCircle size={14} className="text-orange-400" /> All required fields marked with * must be filled to save.
           </div>
           <div className="flex items-center gap-4">
              <button 
                 type="button"
                 onClick={() => navigate('/customers')} 
                 className="px-6 py-2.5 text-slate-500 font-bold text-[13px] hover:text-slate-800 uppercase tracking-widest"
              >
                 Discard
              </button>
              <button 
                 onClick={handleSave} 
                 disabled={loading}
                 className="bg-[#1e61f0] text-white px-10 py-3 rounded-lg font-black text-[14px] hover:bg-blue-700 shadow-2xl shadow-blue-100 uppercase tracking-[0.2em] transition-all disabled:opacity-50 flex items-center gap-2"
              >
                 {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                 {loading ? 'Processing...' : 'Save Customer Record'}
              </button>
           </div>
        </footer>
    </div>
  );
};

export default CustomersView;
