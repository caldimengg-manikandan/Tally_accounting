import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  X, Settings, ChevronDown, AlertCircle, Search, Check
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { purchaseAPI, ledgerAPI, paymentMadeAPI } from '../../services/api';

const PaymentsMadeEntryView = ({ companyId }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const initialBillDetail = location.state?.billDetail;
  const initialVendorId = location.state?.vendorId;
  
  const [activeTab, setActiveTab] = useState('Bill Payment');
  
  // Data
  const [vendors, setVendors] = useState([]);
  const [ledgers, setLedgers] = useState([]);
  const [outstandingBills, setOutstandingBills] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    vendorId: initialVendorId || '',
    paymentNumber: `PAY-${Date.now().toString().slice(-6)}`,
    paymentMade: initialBillDetail?.balanceDue || '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMode: 'Bank Transfer',
    paidThroughId: '',
    reference: initialBillDetail?.referenceNumber || '',
    notes: ''
  });

  // Table State
  const [allocations, setAllocations] = useState({}); // { billId: amount }

  // UI States
  const [fetchingBills, setFetchingBills] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hideBanner, setHideBanner] = useState(false);

  // Custom Dropdown States
  const [isPaidThroughOpen, setIsPaidThroughOpen] = useState(false);
  const [paidThroughSearch, setPaidThroughSearch] = useState('');
  const paidThroughRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (paidThroughRef.current && !paidThroughRef.current.contains(event.target)) {
        setIsPaidThroughOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getAccountGroup = (groupName) => {
     if (['Cash-in-Hand', 'Bank Accounts'].includes(groupName)) return 'Cash';
     if (['Current Liabilities', 'Duties & Taxes', 'Sundry Creditors'].includes(groupName)) return 'Other Current Liability';
     if (['Capital Account', 'Reserves & Surplus'].includes(groupName)) return 'Equity';
     if (['Current Assets', 'Loans & Advances (Asset)', 'Sundry Debtors'].includes(groupName)) return 'Other Current Asset';
     return groupName || 'Other';
  };

  const filteredPaidThroughLedgers = useMemo(() => {
     return ledgers.filter(l => l.name.toLowerCase().includes(paidThroughSearch.toLowerCase()));
  }, [ledgers, paidThroughSearch]);

  const groupedLedgers = useMemo(() => {
     const groups = {};
     filteredPaidThroughLedgers.forEach(l => {
        const g = getAccountGroup(l.GroupName);
        if (!groups[g]) groups[g] = [];
        groups[g].push(l);
     });
     return groups;
  }, [filteredPaidThroughLedgers]);

  useEffect(() => {
    if (!companyId) return;
    
    // Fetch Vendors, Accounts
    Promise.all([
      purchaseAPI.getVendors(companyId),
      ledgerAPI.getByCompany(companyId)
    ]).then(([vendorsRes, ledgersRes]) => {
      setVendors(vendorsRes.data || []);
      setLedgers(ledgersRes.data || []);
    }).catch(err => console.error("Data fetch error:", err));
  }, [companyId]);

  // Pre-allocate if initialBillDetail exists
  useEffect(() => {
    if (initialBillDetail) {
      setAllocations({
        [initialBillDetail.id]: parseFloat(initialBillDetail.balanceDue || 0)
      });
      setFormData(prev => ({ ...prev, vendorId: initialBillDetail.LedgerId || initialBillDetail.supplierLedgerId || '' }));
    }
  }, [initialBillDetail]);

  // Fetch unpaid bills when vendor changes
  useEffect(() => {
    if (formData.vendorId && activeTab === 'Bill Payment') {
      setFetchingBills(true);
      paymentMadeAPI.getUnpaidBills(formData.vendorId, companyId)
        .then(res => {
          setOutstandingBills(res.data || []);
          // Only reset allocations if we aren't passing in a specific bill currently matching this vendor
          if (!initialBillDetail || initialBillDetail.LedgerId !== formData.vendorId) {
             setAllocations({});
          }
        })
        .finally(() => setFetchingBills(false));
    } else {
      setOutstandingBills([]);
    }
  }, [formData.vendorId, activeTab, companyId]);

  const handleAllocationChange = (billId, value) => {
    const amount = value === '' ? '' : parseFloat(value) || 0;
    setAllocations(prev => ({
      ...prev,
      [billId]: amount
    }));
  };

  const totalUsed = useMemo(() => {
    return Object.values(allocations).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  }, [allocations]);

  const handleSave = async (status = 'Paid') => {
    if (!formData.vendorId || !formData.paymentMade) {
      alert("Please ensure Vendor and Payment Made fields are filled.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.paymentMade),
        billAllocations: Object.entries(allocations).filter(([_, amt]) => parseFloat(amt) > 0).map(([id, amt]) => ({
          billId: id,
          amount: parseFloat(amt),
          billNumber: outstandingBills.find(b => b.id === id)?.billNumber
        })),
        status,
        companyId
      };

      await paymentMadeAPI.create(payload);
      navigate('/payments-made');
    } catch (err) {
      console.error("Save failed:", err);
      alert("Failed to save payment: " + (err.response?.data?.error || err.message));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white font-inter text-[13px] text-slate-800">
      {/* --- TOP TABS & CLOSE --- */}
      <div className="flex items-center justify-between border-b border-slate-200 px-8 h-12 sticky top-0 bg-white z-10 w-full shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
         <div className="flex items-center gap-8 h-full">
            <button 
              className={`h-full border-b-[3px] font-bold px-2 flex items-center transition-all ${activeTab === 'Bill Payment' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-600 hover:text-blue-600'}`}
              onClick={() => setActiveTab('Bill Payment')}
            >
               Bill Payment
            </button>
            <button 
              className={`h-full border-b-[3px] font-bold px-2 flex items-center transition-all ${activeTab === 'Vendor Advance' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-600 hover:text-blue-600'}`}
              onClick={() => setActiveTab('Vendor Advance')}
            >
               Vendor Advance
            </button>
         </div>
         <button onClick={() => window.history.back()} className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 transition-colors">
            <X size={20} />
         </button>
      </div>

      {/* --- FORM CONTENT --- */}
      <div className="flex-1 overflow-y-auto pb-28 pt-8">
         <div className="max-w-[1200px] mx-auto px-8">
            
            {/* Horizontal Form Fields */}
            <div className="space-y-5 max-w-2xl">
               <div className="flex items-start">
                  <label className="w-[180px] shrink-0 text-red-500 font-medium py-2">Vendor Name<span className="ml-1">*</span></label>
                  <div className="flex-1 max-w-md relative">
                     <select 
                       value={formData.vendorId}
                       onChange={(e) => setFormData({...formData, vendorId: e.target.value})}
                       className="w-full h-9 px-3 border border-blue-400 rounded outline-none text-[13px] bg-white cursor-pointer hover:border-blue-500 focus:ring-2 focus:ring-blue-100 appearance-none"
                     >
                       <option value="">Select Vendor</option>
                       {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                     </select>
                     <ChevronDown size={14} className="absolute right-3 top-2.5 text-blue-500 pointer-events-none" />
                  </div>
               </div>

               <div className="flex items-start">
                  <label className="w-[180px] shrink-0 text-red-500 font-medium py-2 flex items-center gap-1">
                     Payment #<span className="ml-1">*</span>
                  </label>
                  <div className="flex-1 max-w-md relative">
                     <input 
                       type="text" 
                       value={formData.paymentNumber}
                       onChange={(e) => setFormData({...formData, paymentNumber: e.target.value})}
                       className="w-full h-9 px-3 border border-slate-200 rounded outline-none text-[13px] hover:border-slate-300 focus:border-blue-400"
                     />
                     <Settings size={14} className="absolute right-3 top-2.5 text-blue-400 cursor-pointer hover:text-blue-600" />
                  </div>
               </div>

               <div className="flex items-start">
                  <label className="w-[180px] shrink-0 text-red-500 font-medium py-2">Payment Made<span className="ml-1">*</span></label>
                  <div className="flex-1 max-w-md space-y-3">
                     <div className="flex items-center">
                        <span className="w-10 h-9 bg-slate-100 border border-r-0 border-slate-200 rounded-l flex items-center justify-center font-medium text-slate-500">
                          INR
                        </span>
                        <input 
                          type="number" 
                          value={formData.paymentMade}
                          onChange={(e) => setFormData({...formData, paymentMade: e.target.value})}
                          className="w-full h-9 px-3 border border-slate-200 rounded-r outline-none text-[13px] hover:border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-colors"
                        />
                     </div>
                     {!hideBanner && (
                       <div className="bg-[#fff9e6] border border-[#fcefc7] rounded text-[12px] text-slate-600 p-2.5 flex items-start justify-between shadow-sm">
                          <div className="flex gap-2.5 pt-0.5">
                             <span className="text-yellow-500 leading-none mt-0.5">&#9889;</span>
                             <span className="leading-relaxed">Initiate payments for your bills directly from Tally Pro by integrating with one of our partner banks. <button className="text-blue-500 font-medium hover:underline focus:outline-none">Set Up Now</button></span>
                          </div>
                          <button onClick={() => setHideBanner(true)} className="text-slate-400 hover:text-slate-600 p-0.5"><X size={14} /></button>
                       </div>
                     )}
                  </div>
               </div>

               <div className="flex items-start">
                  <label className="w-[180px] shrink-0 text-red-500 font-medium py-2">Payment Date<span className="ml-1">*</span></label>
                  <div className="flex-1 max-w-md">
                     <input 
                       type="date" 
                       value={formData.paymentDate}
                       onChange={(e) => setFormData({...formData, paymentDate: e.target.value})}
                       className="w-full h-9 px-3 border border-slate-200 rounded outline-none text-[13px] hover:border-slate-300 focus:border-blue-400"
                     />
                  </div>
               </div>

               <div className="flex items-start">
                  <label className="w-[180px] shrink-0 text-slate-700 font-medium py-2">Payment Mode</label>
                  <div className="flex-1 max-w-md relative">
                     <select 
                       value={formData.paymentMode}
                       onChange={(e) => setFormData({...formData, paymentMode: e.target.value})}
                       className="w-full h-9 px-3 border border-slate-200 rounded outline-none text-[13px] bg-white appearance-none hover:border-slate-300 focus:border-blue-400"
                     >
                        <option>Bank Transfer</option>
                        <option>Cash</option>
                        <option>Cheque</option>
                        <option>Credit Card</option>
                     </select>
                     <ChevronDown size={14} className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
                  </div>
               </div>



               <div className="flex items-start">
                  <label className="w-[180px] shrink-0 text-slate-700 font-medium py-2">Reference#</label>
                  <div className="flex-1 max-w-md">
                     <input 
                       type="text" 
                       value={formData.reference}
                       onChange={(e) => setFormData({...formData, reference: e.target.value})}
                       className="w-full h-9 px-3 border border-slate-200 rounded outline-none text-[13px] hover:border-slate-300 focus:border-blue-400"
                     />
                  </div>
               </div>
            </div>

            {/* UNPAID BILLS TABLE & TOTALS */}
            <div className="mt-16 w-full max-w-[1000px]">
               <div className="rounded border border-slate-200 overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                     <thead>
                        <tr className="bg-[#f8f9fa] border-b border-slate-200 text-slate-600 text-[12px] uppercase">
                           <th className="py-2.5 px-4 font-bold tracking-wider">Date</th>
                           <th className="py-2.5 px-4 font-bold tracking-wider">Bill#</th>
                           <th className="py-2.5 px-4 font-bold tracking-wider">PO#</th>
                           <th className="py-2.5 px-4 font-bold tracking-wider text-right">Bill Amount</th>
                           <th className="py-2.5 px-4 font-bold tracking-wider text-right">Amount Due</th>
                           <th className="py-2.5 px-4 font-bold tracking-wider text-right w-[160px]">Payment</th>
                        </tr>
                     </thead>
                     <tbody className="bg-white">
                        {!formData.vendorId || outstandingBills.length === 0 ? (
                           <tr>
                              <td colSpan={6} className="py-16 text-center text-slate-400 text-[14px]">
                                 {fetchingBills ? 'Finding bills...' : 'There are no bills for this vendor.'}
                              </td>
                           </tr>
                        ) : (
                           outstandingBills.map(bill => (
                              <tr key={bill.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                 <td className="py-3 px-4 text-[13px]">{new Date(bill.date).toLocaleDateString('en-GB')}</td>
                                 <td className="py-3 px-4 text-[13px] font-medium text-blue-600 cursor-pointer hover:underline">{bill.billNumber}</td>
                                 <td className="py-3 px-4 text-[13px]">{bill.reference || ''}</td>
                                 <td className="py-3 px-4 text-[13px] text-right">{parseFloat(bill.totalAmount || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                                 <td className="py-3 px-4 text-[13px] text-right text-slate-600">{parseFloat(bill.balanceDue || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                                 <td className="py-2 px-4 text-right">
                                    <input 
                                       type="number"
                                       value={allocations[bill.id] !== undefined ? allocations[bill.id] : ''}
                                       onChange={(e) => handleAllocationChange(bill.id, e.target.value)}
                                       className="w-full h-8 px-2 text-right border border-slate-300 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-[13px] bg-white transition-shadow"
                                    />
                                 </td>
                              </tr>
                           ))
                        )}
                     </tbody>
                  </table>
               </div>

               <div className="flex justify-between mt-8">
                  {/* Additional Options */}
                  <div className="flex flex-col gap-4">
                     <button className="text-[13px] font-medium text-blue-500 hover:text-blue-700 self-start transition-colors">
                        Clear Applied Amount
                     </button>
                  </div>

                  {/* Totals Box */}
                  <div className="w-[380px] bg-slate-50 border border-slate-200 rounded-lg p-5 space-y-3.5 shadow-sm">
                     <div className="flex justify-between items-center text-[13px] text-slate-600 font-medium">
                        <span>Total :</span>
                        <span>{parseFloat(totalUsed || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                     </div>
                     <div className="flex justify-between items-center text-[13px] font-bold text-slate-800 pt-3 border-t border-slate-200/60">
                        <span>Amount Paid :</span>
                        <span>{parseFloat(formData.paymentMade || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                     </div>
                     <div className="flex justify-between items-center text-[13px] text-slate-600 font-medium">
                        <span>Amount used for Payments :</span>
                        <span>{parseFloat(totalUsed || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                     </div>
                     <div className="flex justify-between items-center text-[13px] text-slate-600 font-medium">
                        <span>Amount Refunded :</span>
                        <span>0.00</span>
                     </div>
                     <div className="flex justify-between items-center text-[13px] text-orange-600 font-medium pt-3 border-t border-slate-200/60">
                        <div className="flex items-center gap-1.5 font-bold"><AlertCircle size={14}/> Amount in Excess :</div>
                        <span className="font-bold">{Math.max(0, parseFloat(formData.paymentMade || 0) - totalUsed).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                     </div>
                  </div>
               </div>

               {/* Notes Input Area */}
               <div className="mt-8 max-w-[600px] space-y-2">
                  <label className="text-[12px] text-slate-500 font-medium">Notes (Internal use. Not visible to vendor)</label>
                  <textarea 
                     value={formData.notes}
                     onChange={(e) => setFormData({...formData, notes: e.target.value})}
                     className="w-full h-24 p-3 border border-slate-200 rounded outline-none text-[13px] resize-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-colors bg-white shadow-inner"
                  />
               </div>
            </div>
         </div>
      </div>

      {/* --- BOTTOM ACTION BAR --- */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-[#f8f9fa] border-t border-slate-200 px-8 flex items-center gap-3 z-20 shadow-[0_-2px_6px_rgba(0,0,0,0.02)]">
         <button 
           onClick={() => handleSave('Draft')}
           disabled={isSaving}
           className="px-4 py-1.5 bg-white border border-slate-300 rounded text-slate-700 font-bold hover:bg-slate-50 shadow-sm transition-colors text-[13px]"
         >
           Save as Draft
         </button>
         <button 
           onClick={() => handleSave('Paid')}
           disabled={isSaving}
           className="px-4 py-1.5 bg-blue-600 border border-blue-600 rounded text-white font-bold hover:bg-blue-700 shadow-sm transition-colors text-[13px]"
         >
           {isSaving ? 'Saving...' : 'Save as Paid'}
         </button>
         <button 
           onClick={() => window.history.back()}
           className="px-4 py-1.5 text-slate-600 font-medium hover:text-slate-800 transition-colors text-[13px]"
         >
           Cancel
         </button>
      </div>

    </div>
  );
};

export default PaymentsMadeEntryView;
