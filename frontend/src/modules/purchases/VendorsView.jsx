import React, { useState, useEffect } from 'react';
import { 
  Plus, Save, X, ArrowLeft, Building, Mail, Phone,
  Globe, CreditCard, Clock, Info, ShieldCheck,
  ChevronDown, MapPin, Edit, Trash2, Loader2
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { ledgerAPI, groupAPI } from '../../services/api';
import { COUNTRY_CODES } from '../../utils/countryCodes';
import { INDIAN_STATES } from '../../utils/indianStates';

const VendorsView = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const companyId = localStorage.getItem('companyId');

  // Form State
  const [vendorType, setVendorType] = useState('Business');
  const [salutation, setSalutation] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [workPhone, setWorkPhone] = useState('');
  const [mobile, setMobile] = useState('');
  const [currency, setCurrency] = useState('INR- Indian Rupee');
  const [paymentTerms, setPaymentTerms] = useState('Due on Receipt');
  
  const [billingAddress, setBillingAddress] = useState({
    attention: '', country: 'India', street1: '', street2: '', city: '', state: 'Tamil Nadu', pinCode: '', phone: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [groupId, setGroupId] = useState(null);

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

    if (isEditMode) {
      ledgerAPI.getByCompany(companyId).then(res => {
        const found = res.data.find(v => v.id === id);
        if (found) {
          setVendorType(found.customerType || 'Business');
          setSalutation(found.salutation || '');
          setFirstName(found.firstName || '');
          setLastName(found.lastName || '');
          setCompanyName(found.companyName || '');
          setEmail(found.email || '');
          setWorkPhone(found.workPhone || '');
          setMobile(found.mobile || '');
          setCurrency(found.currency || 'INR- Indian Rupee');
          setPaymentTerms(found.paymentTerms || 'Due on Receipt');
          if (found.billingAddressJson) {
             try { setBillingAddress(JSON.parse(found.billingAddressJson)); } catch(e){}
          }
        }
      });
    }
  }, [companyId, id, isEditMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');

    let ledgerName = vendorType === 'Business' ? companyName : `${salutation} ${firstName} ${lastName}`.trim();
    if (!ledgerName) {
       setError("Please provide a name or contact.");
       setLoading(false);
       return;
    }

    const data = {
      name: ledgerName,
      customerType: vendorType, salutation, firstName, lastName, companyName,
      email, workPhone, mobile, currency, paymentTerms,
      companyId: companyId,
      CompanyId: companyId,
      groupId,
      groupName: 'Sundry Creditors',
      billingAddressJson: JSON.stringify(billingAddress),
      address: billingAddress.street1
    };

    try {
      if (isEditMode) await ledgerAPI.update(id, data);
      else await ledgerAPI.create(data);
      navigate('/vendors');
    } catch (err) {
      setError(err.response?.data?.error || 'Submission failed.');
    } finally {
      setLoading(false);
    }
  };

  const rowStyle = "flex items-start gap-10 mb-6";
  const labelStyle = "w-1/3 text-[14px] font-medium text-slate-600 mt-2";
  const inputStyle = "w-full border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-blue-500 transition-all";

  return (
    <div className="bg-[#f8fafc] min-h-screen p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/vendors')} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
              <ArrowLeft size={20} className="text-slate-400" />
            </button>
            <h1 className="text-xl font-bold text-slate-900">{isEditMode ? 'Edit Vendor' : 'New Vendor'}</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/vendors')} className="px-6 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50 rounded-xl transition-all">Cancel</button>
            <button onClick={handleSubmit} disabled={loading} className="px-8 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Vendor
            </button>
          </div>
        </div>

        <form className="p-10 space-y-8">
          {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">{error}</div>}

          <section>
            <h2 className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-6">Basic Information</h2>
            
            <div className={rowStyle}>
              <div className={labelStyle}>Vendor Type</div>
              <div className="flex gap-6 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={vendorType === 'Business'} onChange={() => setVendorType('Business')} className="accent-blue-600" />
                  <span className="text-sm text-slate-700 font-medium">Business</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={vendorType === 'Individual'} onChange={() => setVendorType('Individual')} className="accent-blue-600" />
                  <span className="text-sm text-slate-700 font-medium">Individual</span>
                </label>
              </div>
            </div>

            <div className={rowStyle}>
              <div className={labelStyle}>Primary Contact</div>
              <div className="flex-1 flex gap-3">
                <select value={salutation} onChange={e => setSalutation(e.target.value)} className={inputStyle + " w-32"}>
                  <option value="">Mr.</option><option value="Mrs.">Mrs.</option><option value="Ms.">Ms.</option>
                </select>
                <input type="text" placeholder="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} className={inputStyle} />
                <input type="text" placeholder="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} className={inputStyle} />
              </div>
            </div>

            <div className={rowStyle}>
              <div className={labelStyle}>Company Name</div>
              <div className="flex-1"><input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} className={inputStyle} /></div>
            </div>

            <div className={rowStyle}>
              <div className={labelStyle}>Vendor Email</div>
              <div className="flex-1"><input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputStyle} /></div>
            </div>
          </section>

          <section className="pt-8 border-t border-slate-50">
            <h2 className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-6">Address & Location</h2>
            <div className={rowStyle}>
              <div className={labelStyle}>Country</div>
              <div className="flex-1">
                <select value={billingAddress.country} onChange={e => setBillingAddress({...billingAddress, country: e.target.value})} className={inputStyle}>
                  {COUNTRY_CODES.map(c => <option key={c.country} value={c.country}>{c.country}</option>)}
                </select>
              </div>
            </div>
            <div className={rowStyle}>
              <div className={labelStyle}>Street Address</div>
              <div className="flex-1 space-y-3">
                <textarea value={billingAddress.street1} onChange={e => setBillingAddress({...billingAddress, street1: e.target.value})} placeholder="Street 1" className={inputStyle + " h-20"} />
                <textarea value={billingAddress.street2} onChange={e => setBillingAddress({...billingAddress, street2: e.target.value})} placeholder="Street 2" className={inputStyle + " h-20"} />
              </div>
            </div>
            <div className="flex gap-4">
                <div className="flex-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">City</label>
                    <input type="text" value={billingAddress.city} onChange={e => setBillingAddress({...billingAddress, city: e.target.value})} className={inputStyle} />
                </div>
                <div className="flex-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">State</label>
                    <select value={billingAddress.state} onChange={e => setBillingAddress({...billingAddress, state: e.target.value})} className={inputStyle}>
                        {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div className="flex-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Pin Code</label>
                    <input type="text" value={billingAddress.pinCode} onChange={e => setBillingAddress({...billingAddress, pinCode: e.target.value})} className={inputStyle} />
                </div>
            </div>
          </section>

          <section className="pt-8 border-t border-slate-50">
            <h2 className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-6">Financial Settings</h2>
            <div className={rowStyle}>
              <div className={labelStyle}>Currency</div>
              <div className="flex-1">
                <select value={currency} onChange={e => setCurrency(e.target.value)} className={inputStyle}>
                    <option>INR- Indian Rupee</option>
                    <option>USD- US Dollar</option>
                </select>
              </div>
            </div>
            <div className={rowStyle}>
              <div className={labelStyle}>Payment Terms</div>
              <div className="flex-1">
                <select value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} className={inputStyle}>
                    <option>Due on Receipt</option>
                    <option>Net 15</option>
                    <option>Net 30</option>
                    <option>Net 45</option>
                </select>
              </div>
            </div>
          </section>
        </form>
      </div>
    </div>
  );
};

export default VendorsView;
