import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ledgerAPI } from '../../services/api';
import useNotificationStore from '../../store/notificationStore';
import { ArrowLeft, Landmark, CreditCard, HelpCircle, Upload } from 'lucide-react';

const BankEntryView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addNotification } = useNotificationStore();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const rawCompanyId = sessionStorage.getItem('companyId');
  const userStr = sessionStorage.getItem('user');
  const userData = userStr ? JSON.parse(userStr) : {};
  const companyId = rawCompanyId || userData.activeCompanyId;
  
  const [formData, setFormData] = useState({
    accountType: 'Bank',
    name: '',
    accountCode: '',
    currency: 'INR',
    accountNumber: '',
    bankName: '',
    ifsc: '',
    description: '',
    isPrimary: false
  });

  const [ifscDetails, setIfscDetails] = useState(null);
  const [ifscLoading, setIfscLoading] = useState(false);
  const [ifscError, setIfscError] = useState('');

  useEffect(() => {
    // Reset form when ID changes to prevent leaking data from previous account
    setFormData({
      accountType: 'Bank',
      name: '',
      accountCode: '',
      currency: 'INR',
      accountNumber: '',
      bankName: '',
      ifsc: '',
      description: '',
      isPrimary: false
    });
    setImagePreview(null);
    setIfscDetails(null);
    setIfscError('');

    if (isEdit && id && companyId) {
      fetchLedger();
    }
  }, [id, companyId, isEdit]);

  const fetchLedger = async () => {
    try {
      setLoading(true);
      const res = await ledgerAPI.getBalance(id);
      const ledger = res.data;
      if (ledger) {
        setFormData(prev => ({
          ...prev,
          accountType: ['Bank Accounts', 'Cash-in-hand', 'Bank OCC A/c', 'Bank OD A/c'].includes(ledger.groupName) ? 'Bank' : 'Credit Card',
          name: ledger.name || '',
          accountCode: ledger.accountCode || '',
          currency: ledger.currency || 'INR',
          accountNumber: ledger.accountNumber || '',
          bankName: ledger.bankName || '',
          ifsc: ledger.ifsc || '',
          description: ledger.description || '',
          isPrimary: ledger.isPrimary || false,
          image: ledger.image || ''
        }));
        
        if (ledger.image) setImagePreview(ledger.image);
        if (ledger.ifsc) fetchIFSCData(ledger.ifsc);
      }
    } catch (err) {
      console.error('[FETCH_LEDGER_ERROR]', err);
      addNotification('Failed to fetch account details', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Direct IFSC fetcher that doesn't rely on or modify complex formData directly in a race-condition way
  const fetchIFSCData = async (code) => {
    if (code.length !== 11) return;
    setIfscLoading(true);
    try {
      const res = await fetch(`https://ifsc.razorpay.com/${code.toUpperCase()}`);
      if (res.ok) {
        const data = await res.json();
        setIfscDetails(data);
      }
    } catch (err) {}
    setIfscLoading(false);
  };

  const fetchIFSC = async (code) => {
    if (code.length !== 11) {
      setIfscDetails(null);
      return;
    }
    setIfscLoading(true);
    setIfscError('');
    try {
      const res = await fetch(`https://ifsc.razorpay.com/${code.toUpperCase()}`);
      if (!res.ok) throw new Error('Invalid IFSC Code');
      const data = await res.json();
      setIfscDetails(data);
      if (!formData.bankName) setFormData(prev => ({ ...prev, bankName: data.BANK }));
    } catch (err) {
      setIfscError('Invalid IFSC Code');
      setIfscDetails(null);
    }
    setIfscLoading(false);
  };

  const handleIFSCChange = (val) => {
    const cleaned = val.toUpperCase().substring(0, 11);
    setFormData({ ...formData, ifsc: cleaned });
    if (cleaned.length === 11) {
      fetchIFSC(cleaned);
    } else {
      setIfscDetails(null);
      setIfscError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      addNotification('Account Name is required', 'warning');
      return;
    }
    
    setLoading(true);
    try {
      const payload = {
        ...formData,
        CompanyId: companyId,
        groupName: formData.accountType === 'Credit Card' ? 'Bank OD A/c' : 'Bank Accounts',
        image: imagePreview // Save the image string (base64 or URL)
      };

      if (isEdit) {
        await ledgerAPI.update(id, payload);
        addNotification('Account updated successfully', 'success');
      } else {
        const response = await ledgerAPI.create(payload);
        const newLedgerId = response.data?.id;
        addNotification('Bank account added successfully', 'success');
        if (newLedgerId) return navigate(`/banking/view/${newLedgerId}`);
      }
      navigate('/banking');
    } catch (err) {
      const serverError = err.response?.data?.error || err.message;
      addNotification(serverError, 'error');
    }
    setLoading(false);
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen animate-fade-in">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-5 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/banking')}
              className="w-10 h-10 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
              {isEdit ? 'Edit Account' : 'Add Bank or Credit Card'}
            </h1>
          </div>
          {isEdit && (
            <button 
              onClick={() => navigate(`/banking/view/${id}`)}
              className="px-4 py-2 bg-slate-50 text-blue-600 rounded-lg text-[13px] font-bold hover:bg-blue-50 transition-all border border-blue-100"
            >
              View Transactions
            </button>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-10">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <form onSubmit={handleSubmit} className="divide-y divide-slate-100">
            
            {/* Account Type Selection */}
            <div className="p-8 grid grid-cols-4 gap-6">
              <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider pt-2">Account Type</label>
              <div className="col-span-3 flex gap-6">
                  {['Bank', 'Credit Card'].map(type => (
                    <label key={type} className={`flex-1 p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-4 
                      ${formData.accountType === type ? 'border-blue-500 bg-blue-50/50' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`}>
                      <input 
                        type="radio" 
                        className="hidden" 
                        name="type" 
                        checked={formData.accountType === type}
                        onChange={() => setFormData({...formData, accountType: type})}
                      />
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center 
                        ${formData.accountType === type ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                        {type === 'Bank' ? <Landmark size={20} /> : <CreditCard size={20} />}
                      </div>
                      <div>
                        <div className="text-[14px] font-bold text-slate-800">{type}</div>
                        <div className="text-[11px] text-slate-400">Regular account or OD</div>
                      </div>
                    </label>
                  ))}
              </div>
            </div>

            {/* Basic Info */}
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-4 gap-6 items-center">
                <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">Account Name <span className="text-rose-500">*</span></label>
                <div className="col-span-3">
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Enter account name"
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-slate-800 font-medium"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-6 items-center">
                <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">Account Number</label>
                <div className="col-span-3">
                  <input 
                    type="text" 
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({...formData, accountNumber: e.target.value})}
                    placeholder="Enter account number"
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-6 items-center">
                <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  IFSC Code 
                  <HelpCircle size={14} className="text-slate-300" />
                </label>
                <div className="col-span-3">
                  <div className="relative">
                    <input 
                      type="text" 
                      value={formData.ifsc}
                      onChange={(e) => handleIFSCChange(e.target.value)}
                      placeholder="e.g. SBIN0001234"
                      className={`w-full h-11 px-4 bg-slate-50 border rounded-lg focus:bg-white focus:ring-4 outline-none transition-all text-slate-800 uppercase tracking-widest font-bold
                        ${ifscError ? 'border-rose-300 ring-rose-50' : 'border-slate-200 focus:border-blue-400 ring-blue-50'}`}
                    />
                    {ifscLoading && (
                      <div className="absolute right-3 top-3">
                        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  {ifscError && <p className="mt-1.5 text-[11px] text-rose-500 font-bold">{ifscError}</p>}
                  
                  {ifscDetails && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100 grid grid-cols-2 gap-4 animate-fade-in">
                       <div>
                         <div className="text-[10px] font-bold text-blue-400 uppercase tracking-tighter">Bank Name</div>
                         <div className="text-[12px] font-bold text-blue-900">{ifscDetails.BANK}</div>
                       </div>
                       <div>
                         <div className="text-[10px] font-bold text-blue-400 uppercase tracking-tighter">Branch</div>
                         <div className="text-[12px] font-bold text-blue-900">{ifscDetails.BRANCH}</div>
                       </div>
                       <div className="col-span-2">
                         <div className="text-[10px] font-bold text-blue-400 uppercase tracking-tighter">Address</div>
                         <div className="text-[12px] font-medium text-blue-800">{ifscDetails.ADDRESS}</div>
                       </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-6 items-start">
                <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider pt-3">Description</label>
                <div className="col-span-3">
                  <textarea 
                    rows="4"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Short description for reference..."
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-400 outline-none transition-all text-[14px] text-slate-700 resize-none"
                  />
                </div>
              </div>

              {/* Image Upload / View */}
              <div className="grid grid-cols-4 gap-6 items-start">
                <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider pt-3">Account Image / Logo</label>
                <div className="col-span-3">
                   <div className="flex items-center gap-6">
                      <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
                        {imagePreview ? (
                          <img src={imagePreview} alt="Account" className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center gap-1 text-slate-400">
                             <Upload size={20} />
                             <span className="text-[10px] font-bold">No Image</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-[12px] font-bold text-slate-700 cursor-pointer hover:bg-slate-50 transition-all block text-center">
                           {imagePreview ? 'Change Image' : 'Upload Image'}
                           <input 
                             type="file" 
                             className="hidden" 
                             accept="image/*"
                             onChange={(e) => {
                               const file = e.target.files[0];
                               if (file) {
                                 const reader = new FileReader();
                                 reader.onloadend = () => {
                                   setImagePreview(reader.result);
                                 };
                                 reader.readAsDataURL(file);
                               }
                             }}
                           />
                        </label>
                        {imagePreview && (
                          <button 
                            type="button"
                            onClick={() => setImagePreview(null)}
                            className="w-full px-4 py-2 text-[12px] font-bold text-rose-500 hover:text-rose-600 transition-all"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                   </div>
                   <p className="mt-3 text-[11px] text-slate-400 font-medium">Upload a bank logo or account reference photo. Max size 2MB.</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-8 bg-slate-50/50 flex items-center justify-end gap-3">
              <button 
                type="button"
                onClick={() => navigate('/banking')}
                className="px-6 py-2.5 rounded-lg font-bold text-[13px] text-slate-500 hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={loading}
                className="px-10 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-[13px] hover:bg-blue-700 shadow-lg shadow-blue-600/20 disabled:opacity-50 transition-all"
              >
                {loading ? 'Processing...' : (isEdit ? 'Save Changes' : 'Create Account')}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default BankEntryView;
