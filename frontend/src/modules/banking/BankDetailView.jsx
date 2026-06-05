import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Landmark, ArrowLeft, RefreshCw, Upload, MoreHorizontal, 
  Search, Filter, Download, ArrowUpRight, ArrowDownLeft,
  CreditCard, Building2, Globe, Hash, Edit3, X, Check,
  MapPin, Info, Save, Plus, Loader2
} from 'lucide-react';
import { ledgerAPI, voucherAPI } from '../../services/api';
import useNotificationStore from '../../store/notificationStore';

const BankDetailView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addNotification } = useNotificationStore();
  
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('transactions');
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);

  // IFSC Details State
  const [ifscDetails, setIfscDetails] = useState(null);

  // Record Transaction Modal State
  const [ledgers, setLedgers] = useState([]);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [savingTx, setSavingTx] = useState(false);
  const [txForm, setTxForm] = useState({
    type: 'Receipt',
    partyLedgerId: '',
    amount: '',
    mode: 'UPI',
    reference: '',
    date: new Date().toISOString().split('T')[0],
    linkedInvoice: ''
  });
  const companyId = sessionStorage.getItem('companyId');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const accRes = await ledgerAPI.getBalance(id);
      const accData = accRes.data;
      setAccount(accData);
      setEditData(accData);

      // Fetch IFSC details if code exists
      if (accData.ifsc && accData.ifsc.length === 11) {
        fetchIFSCInfo(accData.ifsc);
      }

      const txRes = await ledgerAPI.getTransactions(id);
      setTransactions(txRes.data);

      if (companyId) {
        const ledgersRes = await ledgerAPI.getByCompany(companyId);
        setLedgers(Array.isArray(ledgersRes.data) ? ledgersRes.data : []);
      }
    } catch (err) {
      console.error('Failed to fetch bank details:', err);
      const serverError = err.response?.data?.error || err.message;
      const status = err.response?.status ? `[${err.response.status}] ` : '';
      addNotification(`Failed to load: ${status}${serverError}`, 'error');
    }
    setLoading(false);
  };

  const fetchIFSCInfo = async (code) => {
    try {
      const res = await fetch(`https://ifsc.razorpay.com/${code.toUpperCase()}`);
      if (res.ok) {
        const data = await res.json();
        setIfscDetails(data);
      }
    } catch (err) {
      console.error('IFSC lookup failed');
    }
  };

  const handleUpdate = async () => {
    console.log('[DEBUG] Sending Update Payload:', editData);
    setSaving(true);
    try {
      const response = await ledgerAPI.update(id, editData);
      console.log('[DEBUG] Update Response:', response.data);
      addNotification('Bank details updated successfully', 'success');
      setIsEditing(false);
      fetchData();
    } catch (err) {
      console.error('[DEBUG] Update Failed:', err.response?.data || err.message);
      const errorMsg = err.response?.data?.error || err.message;
      addNotification(`Failed to update: ${errorMsg}`, 'error');
    }
    setSaving(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: account?.currency || 'INR',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const handleSaveTransaction = async (e) => {
    e.preventDefault();
    if (!txForm.partyLedgerId || !txForm.amount) {
      addNotification('Please select a party and specify amount.', 'error');
      return;
    }
    setSavingTx(true);
    try {
      const isReceipt = txForm.type === 'Receipt';
      const referenceNotes = {
        mode: txForm.mode,
        reference: txForm.reference,
        linkedInvoice: txForm.linkedInvoice,
        notes: `Recorded via Banking Hub on ${txForm.date}. Ref: ${txForm.reference}`
      };

      await voucherAPI.create({
        companyId,
        voucherType: txForm.type,
        date: new Date(txForm.date).toISOString(),
        narration: JSON.stringify(referenceNotes),
        entries: isReceipt ? [
          { ledgerId: id, debit: parseFloat(txForm.amount), credit: 0 },
          { ledgerId: txForm.partyLedgerId, debit: 0, credit: parseFloat(txForm.amount) }
        ] : [
          { ledgerId: txForm.partyLedgerId, debit: parseFloat(txForm.amount), credit: 0 },
          { ledgerId: id, debit: 0, credit: parseFloat(txForm.amount) }
        ]
      });

      addNotification('Transaction recorded successfully!', 'success');
      setShowRecordModal(false);
      setTxForm({
        type: 'Receipt',
        partyLedgerId: '',
        amount: '',
        mode: 'UPI',
        reference: '',
        date: new Date().toISOString().split('T')[0],
        linkedInvoice: ''
      });
      fetchData();
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.error || err.message;
      addNotification(`Failed to record transaction: ${errorMsg}`, 'error');
    } finally {
      setSavingTx(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-[#F9FAFB] min-h-screen font-sans">
      {/* ── HEADER ── */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
               <button 
                 onClick={() => navigate('/banking')}
                 className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-all"
               >
                 <ArrowLeft size={20} />
               </button>
               <div>
                 <h1 className="text-xl font-bold text-slate-800 tracking-tight">{account?.name}</h1>
                 <p className="text-[11px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
                   {account?.bankName || 'Bank Account'} 
                   <span className="text-slate-300">•</span>
                   {account?.accountNumber ? (
                     <span className="font-mono">{account.accountNumber}</span>
                   ) : (
                     <span className="text-rose-400">No A/c Number</span>
                   )}
                 </p>
               </div>
            </div>

            <div className="flex items-center gap-3">
               {isEditing ? (
                 <div className="flex items-center gap-2 animate-fade-in">
                    <button 
                      onClick={handleUpdate}
                      disabled={saving}
                      className="px-6 py-2 bg-[#1e61f0] text-white rounded-xl text-[12px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
                    >
                      {saving ? 'Saving...' : <><Save size={14}/> Save Changes</>}
                    </button>
                    <button 
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-[12px] font-bold uppercase tracking-widest hover:bg-slate-200 transition-all"
                    >
                      Cancel
                    </button>
                 </div>
               ) : (
                 <button 
                   onClick={() => setIsEditing(true)}
                   className="px-5 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl text-[12px] font-bold hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
                 >
                    <Edit3 size={14} className="text-blue-500"/> Edit Bank Details
                 </button>
               )}
               
                <button onClick={fetchData} className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-slate-500">
                  <RefreshCw size={18} />
                </button>
                <button 
                  onClick={() => setShowRecordModal(true)}
                  className="px-5 py-2.5 bg-[#1e61f0] text-white rounded-xl text-[12px] font-bold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
                >
                  <Plus size={14} /> Record Transaction
                </button>
                <button className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[12px] font-bold hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-slate-900/10">
                  <Upload size={14} /> Import
                </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-12 gap-8">
          
          {/* ── LEFT: MAIN VIEW ── */}
          <div className="col-span-8 space-y-8">
            
            {/* Balance Overview */}
            <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm relative overflow-hidden">
               <div className="relative z-10">
                 <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Available Balance</p>
                 <h2 className="text-4xl font-bold text-slate-800 tracking-tighter">
                   {formatCurrency(account?.computedBalance)}
                 </h2>
               </div>
               <div className="absolute right-[-20px] bottom-[-20px] opacity-[0.03]">
                  <Landmark size={180} />
               </div>
            </div>

            {/* Transactions Table Layout */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
               <div className="px-6 py-5 border-b border-slate-50 flex justify-between items-center bg-white">
                  <div className="flex gap-6">
                    {['transactions', 'unmatched'].map(tab => (
                      <button 
                         key={tab}
                         onClick={() => setActiveTab(tab)}
                         className={`text-[12px] font-bold uppercase tracking-widest pb-1 transition-all border-b-2 ${activeTab === tab ? 'border-blue-500 text-slate-800' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all"><Search size={16}/></button>
                    <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all"><Filter size={16}/></button>
                  </div>
               </div>

               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                   <thead className="bg-[#FBFCFE] border-b border-slate-50">
                     <tr>
                       <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                       <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description</th>
                       <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</th>
                       <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Amount</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                     {transactions.map((tx) => (
                       <tr key={tx.id} className="hover:bg-slate-50/50 transition-all group">
                         <td className="px-6 py-4">
                           <span className="text-[12px] font-bold text-slate-600">
                             {new Date(tx.Voucher?.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                           </span>
                         </td>
                         <td className="px-6 py-4">
                            <p className="text-[13px] font-bold text-slate-800">{tx.Voucher?.narration || 'No description'}</p>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">{tx.Voucher?.voucherType} #{tx.Voucher?.voucherNumber}</span>
                         </td>
                         <td className="px-6 py-4">
                           <div className={`flex items-center gap-1.5 ${parseFloat(tx.debit) > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {parseFloat(tx.debit) > 0 ? <ArrowDownLeft size={14}/> : <ArrowUpRight size={14}/>}
                              <span className="text-[11px] font-bold uppercase tracking-tight">
                                {parseFloat(tx.debit) > 0 ? 'Debit' : 'Credit'}
                              </span>
                           </div>
                         </td>
                         <td className="px-6 py-4 text-right">
                           <span className={`text-[13px] font-bold ${parseFloat(tx.debit) > 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
                             {formatCurrency(Math.max(parseFloat(tx.debit) || 0, parseFloat(tx.credit) || 0))}
                           </span>
                         </td>
                       </tr>
                     ))}
                     {transactions.length === 0 && (
                       <tr>
                         <td colSpan="4" className="px-6 py-20 text-center">
                            <div className="flex flex-col items-center gap-2 opacity-30">
                               <RefreshCw size={40} />
                               <p className="text-[13px] font-bold">No transactions found</p>
                            </div>
                         </td>
                       </tr>
                     )}
                   </tbody>
                 </table>
               </div>
            </div>
          </div>

          {/* ── RIGHT: INFO SIDEBAR (DYNAMIC) ── */}
          <div className="col-span-4 space-y-6">
             <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6 overflow-hidden transition-all relative">
                {isEditing && (
                  <div className="absolute inset-0 bg-blue-50/30 backdrop-blur-[1px] z-0 pointer-events-none transition-all"></div>
                )}
                
                <div className="flex justify-between items-center border-b border-slate-50 pb-4 relative z-10">
                  <h3 className="text-[13px] font-bold text-slate-800 uppercase tracking-widest">A/c Information</h3>
                  {isEditing && (
                    <span className="text-[10px] font-bold text-blue-600 uppercase flex items-center gap-1 animate-pulse">
                      Editing Mode
                    </span>
                  )}
                </div>
                
                <div className="space-y-6 relative z-10">
                   {/* Bank Name */}
                   <div className="flex items-start gap-4">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0"><Building2 size={16}/></div>
                      <div className="w-full">
                        <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1.5">Bank Name</p>
                        {isEditing ? (
                          <input 
                            type="text"
                            placeholder="e.g. HDFC Bank"
                            value={editData.bankName || ''}
                            onChange={(e) => setEditData({...editData, bankName: e.target.value})}
                            className="w-full text-[13px] font-bold text-slate-800 border-b border-blue-400 focus:border-blue-600 outline-none pb-1 bg-white px-2 py-1 rounded-t-sm"
                          />
                        ) : (
                          <p className="text-[13px] font-bold text-slate-800 leading-tight">{account?.bankName || 'N/A'}</p>
                        )}
                      </div>
                   </div>

                   {/* Account Number */}
                   <div className="flex items-start gap-4">
                      <div className="p-2 bg-slate-50 text-slate-600 rounded-lg shrink-0"><Hash size={16}/></div>
                      <div className="w-full">
                        <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1.5">Account Number</p>
                        {isEditing ? (
                          <input 
                            type="text"
                            placeholder="Enter Acc No."
                            value={editData.accountNumber || ''}
                            onChange={(e) => setEditData({...editData, accountNumber: e.target.value})}
                            className="w-full text-[13px] font-bold text-slate-800 border-b border-blue-400 focus:border-blue-600 outline-none pb-1 bg-white px-2 py-1 rounded-t-sm"
                          />
                        ) : (
                          <p className="text-[13px] font-bold text-slate-800 leading-tight">{account?.accountNumber || 'N/A'}</p>
                        )}
                      </div>
                   </div>

                   {/* IFSC */}
                   <div className="flex items-start gap-4">
                      <div className="p-2 bg-slate-50 text-slate-600 rounded-lg shrink-0"><Globe size={16}/></div>
                      <div className="w-full">
                        <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1.5">IFSC Code</p>
                        {isEditing ? (
                          <input 
                            type="text"
                            placeholder="e.g. HDFC0001234"
                            value={editData.ifsc || ''}
                            onChange={(e) => setEditData({...editData, ifsc: e.target.value.toUpperCase()})}
                            className="w-full text-[13px] font-bold text-slate-800 border-b border-blue-400 focus:border-blue-600 outline-none pb-1 bg-white px-2 py-1 rounded-t-sm"
                          />
                        ) : (
                          <p className="text-[13px] font-bold text-slate-800 leading-tight tracking-widest">{account?.ifsc || 'N/A'}</p>
                        )}
                      </div>
                   </div>

                   {/* Account Code */}
                   <div className="flex items-start gap-4">
                      <div className="p-2 bg-slate-50 text-slate-600 rounded-lg shrink-0"><CreditCard size={16}/></div>
                      <div className="w-full">
                        <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1.5">Account Code</p>
                        {isEditing ? (
                          <input 
                            type="text"
                            placeholder="e.g. 56789"
                            value={editData.accountCode || ''}
                            onChange={(e) => setEditData({...editData, accountCode: e.target.value})}
                            className="w-full text-[13px] font-bold text-slate-800 border-b border-blue-400 focus:border-blue-600 outline-none pb-1 bg-white px-2 py-1 rounded-t-sm"
                          />
                        ) : (
                          <p className="text-[13px] font-bold text-slate-800 leading-tight">{account?.accountCode || 'N/A'}</p>
                        )}
                      </div>
                   </div>
                </div>

                {/* IFSC Extended Info (Razorpay Data) */}
                {ifscDetails && !isEditing && (
                  <div className="pt-6 border-t border-slate-50 animate-fade-in relative z-10">
                    <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                       <div className="flex items-center gap-2 mb-1">
                          <Info size={12} className="text-blue-500"/>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Branch Details</span>
                       </div>
                       <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-slate-500">Branch</span>
                          <span className="text-[11px] font-bold text-slate-800 text-right">{ifscDetails.BRANCH}</span>
                       </div>
                       <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-slate-500">City/State</span>
                          <span className="text-[11px] font-bold text-slate-800 text-right truncate ml-4">{ifscDetails.CITY}, {ifscDetails.STATE}</span>
                       </div>
                    </div>
                  </div>
                )}
             </div>

             <div className="bg-[#1e61f0] rounded-2xl p-6 text-white relative overflow-hidden shadow-xl shadow-blue-500/20 group cursor-pointer">
                <div className="relative z-10">
                   <h4 className="text-[15px] font-bold mb-1">Start Reconciliation</h4>
                   <p className="text-[11px] text-blue-100 font-medium mb-4">Match your Tally records with bank statements in one click.</p>
                   <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest group-hover:gap-4 transition-all">
                      Configure Now <ArrowLeft size={14} className="rotate-180" />
                   </div>
                </div>
                <div className="absolute right-[-10px] top-[-10px] opacity-[0.1] rotate-12">
                   <RefreshCw size={100} />
                </div>
             </div>
          </div>

        </div>
      </div>

      {/* Record Transaction Modal */}
      {showRecordModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Record Transaction</h2>
                <p className="text-xs text-slate-400 font-bold mt-0.5">Post an instant bank payment or receipt voucher</p>
              </div>
              <button 
                onClick={() => setShowRecordModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveTransaction} className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Transaction Type *</label>
                  <select 
                    value={txForm.type}
                    onChange={e => setTxForm({ ...txForm, type: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-400 transition-all bg-white"
                  >
                    <option value="Receipt">Receipt (Cash In)</option>
                    <option value="Payment">Payment (Cash Out)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Date *</label>
                  <input 
                    type="date"
                    required
                    value={txForm.date}
                    onChange={e => setTxForm({ ...txForm, date: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-400 transition-all bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Party Account (Customer / Vendor) *</label>
                <select 
                  value={txForm.partyLedgerId}
                  required
                  onChange={e => setTxForm({ ...txForm, partyLedgerId: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-400 transition-all bg-white"
                >
                  <option value="">— Select Party Ledger —</option>
                  {ledgers.map(l => (
                    <option key={l.id} value={l.id}>{l.name} ({l.Group?.name || 'No Group'})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Amount (₹) *</label>
                  <input 
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={txForm.amount}
                    onChange={e => setTxForm({ ...txForm, amount: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-400 transition-all bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Payment Mode *</label>
                  <select 
                    value={txForm.mode}
                    onChange={e => setTxForm({ ...txForm, mode: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-400 transition-all bg-white"
                  >
                    <option value="UPI">UPI / QR</option>
                    <option value="NEFT">NEFT Transfer</option>
                    <option value="Cheque">Cheque</option>
                    <option value="RTGS">RTGS Transfer</option>
                    <option value="IMPS">IMPS</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Reference # / Cheque #</label>
                  <input 
                    type="text"
                    placeholder="e.g. UTR12345678"
                    value={txForm.reference}
                    onChange={e => setTxForm({ ...txForm, reference: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-400 transition-all bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Linked Invoice / Bill Ref</label>
                  <input 
                    type="text"
                    placeholder="e.g. INV-2026-001"
                    value={txForm.linkedInvoice}
                    onChange={e => setTxForm({ ...txForm, linkedInvoice: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-400 transition-all bg-white"
                  />
                </div>
              </div>

              <div className="px-2 py-5 border-t border-slate-100 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setShowRecordModal(false)} 
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={savingTx}
                  className="px-6 py-2.5 rounded-xl bg-[#1e61f0] text-white text-sm font-bold hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {savingTx ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BankDetailView;
