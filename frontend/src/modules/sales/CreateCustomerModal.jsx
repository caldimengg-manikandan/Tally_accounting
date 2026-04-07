import React, { useState, useEffect } from 'react';
import { 
  X, User, Mail, Phone, MapPin, 
  CreditCard, ShieldCheck, Plus, CheckCircle2,
  AlertCircle, Building, Loader2, Save
} from 'lucide-react';
import { ledgerAPI, groupAPI } from '../../services/api';

const CreateCustomerModal = ({ isOpen, onClose, onSuccess, customerToEdit = null }) => {
  const [customerType, setCustomerType] = useState('Business');
  const [salutation, setSalutation] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [workPhone, setWorkPhone] = useState('');
  const [mobile, setMobile] = useState('');
  const [language, setLanguage] = useState('English');
  const [openingBalance, setOpeningBalance] = useState('0');
  const [gstNumber, setGstNumber] = useState('');
  const [address, setAddress] = useState('');
  const [creditLimit, setCreditLimit] = useState('0');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [groupId, setGroupId] = useState(null);
  const companyId = localStorage.getItem('companyId');

  // Pre-fill if editing
  useEffect(() => {
    if (customerToEdit) {
      setCustomerType(customerToEdit.customerType || 'Business');
      setSalutation(customerToEdit.salutation || '');
      setFirstName(customerToEdit.firstName || '');
      setLastName(customerToEdit.lastName || '');
      setCompanyName(customerToEdit.companyName || '');
      setEmail(customerToEdit.email || '');
      setWorkPhone(customerToEdit.workPhone || '');
      setMobile(customerToEdit.mobile || '');
      setLanguage(customerToEdit.language || 'English');
      setOpeningBalance(customerToEdit.openingBalance?.toString() || '0');
      setGstNumber(customerToEdit.gstNumber || '');
      setAddress(customerToEdit.address || '');
      setCreditLimit(customerToEdit.creditLimit?.toString() || '0');
      setGroupId(customerToEdit.GroupId);
    } else {
      setCustomerType('Business'); setSalutation(''); setFirstName(''); setLastName(''); setCompanyName('');
      setEmail(''); setWorkPhone(''); setMobile(''); setLanguage('English');
      setOpeningBalance('0'); setGstNumber(''); setAddress(''); setCreditLimit('0');
    }
  }, [customerToEdit, isOpen]);

  // Find 'Sundry Debtors' group automatically if not editing
  useEffect(() => {
    if (!isOpen || !companyId || customerToEdit) return;
    groupAPI.getByCompany(companyId).then(res => {
      const debtorGroup = res.data.find(g => g.name.toLowerCase().includes('debtor'));
      if (debtorGroup) setGroupId(debtorGroup.id);
    });
  }, [isOpen, customerToEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!groupId) { setError("Accounting group was not found."); return; }
    
    setLoading(true);
    setError('');

    // Generate 'name' (Ledger Primary Name) based on Company or Individual Name
    const ledgerName = customerType === 'Business' ? companyName : `${salutation} ${firstName} ${lastName}`.trim();

    const data = {
      name: ledgerName,
      customerType, salutation, firstName, lastName, companyName,
      workPhone, mobile, language,
      companyId, groupId,
      openingBalance: parseFloat(openingBalance || 0),
      gstNumber, email, phone: mobile, address, 
      creditLimit: parseFloat(creditLimit || 0)
    };

    try {
      if (customerToEdit) {
        await ledgerAPI.update(customerToEdit.id, data);
      } else {
        await ledgerAPI.create({ ...data, currentBalance: data.openingBalance });
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Operation failed.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      
      <div className="relative w-full max-w-3xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-scale-up border border-white/20">
        {/* Header */}
        <div className="px-10 py-8 bg-[#f8fafc] border-b border-slate-100 flex items-center justify-between">
           <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                 {customerToEdit ? <Edit2 size={26} strokeWidth={2.5}/> : <User size={26} strokeWidth={2.5}/>}
              </div>
              <div>
                 <h2 className="text-2xl font-black text-slate-900 tracking-tighter">
                    {customerToEdit ? 'Modify Profile' : 'New Customer'}
                 </h2>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Unified CRM Infrastructure</p>
              </div>
           </div>
           <button onClick={onClose} className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-slate-900 transition-all shadow-sm">
              <X size={20}/>
           </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 max-h-[75vh] overflow-y-auto custom-scrollbar">
           {error && (
              <div className="mb-8 p-5 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-4 text-red-600 animate-shake">
                 <AlertCircle size={20} className="shrink-0 mt-0.5"/>
                 <span className="text-sm font-bold leading-relaxed">{error}</span>
              </div>
           )}

           <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-8">
                 {/* Customer Type */}
                 <section>
                    <label className={labelStyle}>Customer Type</label>
                    <div className="flex items-center gap-8 mt-4">
                       <label className="flex items-center gap-3 cursor-pointer group">
                          <input type="radio" checked={customerType === 'Business'} onChange={() => setCustomerType('Business')} className="w-5 h-5 accent-blue-600 cursor-pointer" />
                          <span className={`text-sm font-bold ${customerType === 'Business' ? 'text-slate-900' : 'text-slate-400'}`}>Business</span>
                       </label>
                       <label className="flex items-center gap-3 cursor-pointer group">
                          <input type="radio" checked={customerType === 'Individual'} onChange={() => setCustomerType('Individual')} className="w-5 h-5 accent-blue-600 cursor-pointer" />
                          <span className={`text-sm font-bold ${customerType === 'Individual' ? 'text-slate-900' : 'text-slate-400'}`}>Individual</span>
                       </label>
                    </div>
                 </section>

                 {/* Primary Contact */}
                 <section>
                    <label className={labelStyle}>Primary Contact</label>
                    <div className="grid grid-cols-4 gap-3 mt-2">
                       <select value={salutation} onChange={e => setSalutation(e.target.value)} className={inputStyle + " col-span-1 px-2 text-xs"}>
                          <option value="">Salut.</option>
                          <option value="Mr.">Mr.</option>
                          <option value="Mrs.">Mrs.</option>
                          <option value="Ms.">Ms.</option>
                          <option value="Miss">Miss</option>
                          <option value="Dr.">Dr.</option>
                       </select>
                       <input type="text" placeholder="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} className={inputStyle + " col-span-1.5 pl-4"} />
                       <input type="text" placeholder="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} className={inputStyle + " col-span-1.5 pl-4"} />
                    </div>
                 </section>

                 {/* Company Name */}
                 <section>
                    <label className={labelStyle}>Company Name</label>
                    <div className="relative mt-2">
                       <Building size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"/>
                       <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Acme Corporation Ltd." className={inputStyle} />
                    </div>
                 </section>

                 {/* Email */}
                 <section>
                    <label className={labelStyle}>Email Address</label>
                    <div className="relative mt-2">
                       <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"/>
                       <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="contact@company.com" className={inputStyle} />
                    </div>
                 </section>

                 {/* Phone Numbers */}
                 <div className="grid grid-cols-2 gap-4">
                    <section>
                       <label className={labelStyle}>Work Phone</label>
                       <div className="flex gap-2 mt-2">
                          <select className="bg-slate-50 border border-slate-100 rounded-xl px-2 text-[10px] font-bold text-slate-500 outline-none w-16 focus:border-blue-500">
                             <option>+91</option>
                          </select>
                          <input type="text" value={workPhone} onChange={e => setWorkPhone(e.target.value)} placeholder="XXXX-XXXXXX" className={inputStyle + " pl-4"} />
                       </div>
                    </section>
                    <section>
                       <label className={labelStyle}>Mobile</label>
                       <div className="flex gap-2 mt-2">
                          <select className="bg-slate-50 border border-slate-100 rounded-xl px-2 text-[10px] font-bold text-slate-500 outline-none w-16 focus:border-blue-500">
                             <option>+91</option>
                          </select>
                          <input type="text" value={mobile} onChange={e => setMobile(e.target.value)} placeholder="9876543210" className={inputStyle + " pl-4"} />
                       </div>
                    </section>
                 </div>
              </div>

              <div className="space-y-8">
                 {/* Language */}
                 <section>
                    <label className={labelStyle}>Customer Language</label>
                    <select value={language} onChange={e => setLanguage(e.target.value)} className={inputStyle + " pl-4 mt-2"}>
                       <option value="English">English</option>
                       <option value="Tamil">Tamil</option>
                    </select>
                 </section>

                 <section>
                    <label className={labelStyle}>GSTIN / Tax ID</label>
                    <div className="relative mt-2">
                       <ShieldCheck size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"/>
                       <input type="text" value={gstNumber} onChange={e => setGstNumber(e.target.value)} placeholder="27ABCDE1234F1Z5" className={inputStyle} />
                    </div>
                 </section>

                 <section>
                    <label className={labelStyle}>Billing Address</label>
                    <div className="relative mt-2">
                       <MapPin size={16} className="absolute left-4 top-4 text-slate-300"/>
                       <textarea value={address} onChange={e => setAddress(e.target.value)} rows={3} placeholder="Full address details..." className={inputStyle + " pl-11 pt-3 resize-none"} />
                    </div>
                 </section>

                 <div className="grid grid-cols-2 gap-4">
                    <section>
                       <label className={labelStyle}>Opening Bal (₹)</label>
                       <input type="number" value={openingBalance} onChange={e => setOpeningBalance(e.target.value)} className={inputStyle + " pl-4"} />
                    </section>
                    <section>
                       <label className={labelStyle}>Credit Limit (₹)</label>
                       <input type="number" value={creditLimit} onChange={e => setCreditLimit(e.target.value)} className={inputStyle + " pl-4"} />
                    </section>
                 </div>
              </div>
           </div>

           <div className="flex items-center justify-between pt-10 mt-10 border-t border-slate-100">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 font-black text-[10px]">SYNC</div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Persisting to <br/><span className="text-slate-900">Debtors Warehouse</span></p>
              </div>
              <div className="flex gap-4">
                 <button type="button" onClick={onClose} className="px-8 py-4 rounded-2xl border border-slate-100 font-black text-slate-400 text-[11px] uppercase tracking-widest hover:bg-slate-50 transition-all">Cancel</button>
                 <button type="submit" disabled={loading} className="px-12 py-4 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-3 shadow-xl shadow-slate-900/10 transition-all hover:scale-[1.02] active:scale-[0.98]">
                    {loading ? <Loader2 size={18} className="animate-spin" /> : (customerToEdit ? <><Save size={18}/> Update Member</> : <><Plus size={18}/> Commit Entity</>)}
                 </button>
              </div>
           </div>
        </form>
      </div>
    </div>
  );
};

const Edit2 = ({ size, color, strokeWidth }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
);

const labelStyle = "block text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 mb-2";
const inputStyle = "w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-all";

export default CreateCustomerModal;
