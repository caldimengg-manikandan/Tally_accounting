import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { X, Settings, ChevronDown, AlertCircle, Search, Check } from 'lucide-react';
import { purchaseAPI, ledgerAPI, paymentMadeAPI } from '../../services/api';



const PaymentsMadeEntryView = ({ companyId }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isEditMode = !!id;
  const editAllocationsRef = useRef(null); // stores edit-mode allocations until bills are set
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
    paymentNumber: '',
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
  const [payFullAmount, setPayFullAmount] = useState(false);

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

  // Load payment if editing
  useEffect(() => {
    if (id) {
      paymentMadeAPI.getPayment(id)
        .then(res => {
          const p = res.data;
          // Set form data, preserving paymentNumber from the payment
          setFormData(prev => ({
            ...prev,
            vendorId: p.vendorId || '',
            paymentNumber: p.paymentNumber || prev.paymentNumber,
            paymentMade: p.paymentMade || '',
            paymentDate: p.paymentDate || new Date().toISOString().split('T')[0],
            paymentMode: p.paymentMode || 'Bank Transfer',
            paidThroughId: p.paidThroughId || '',
            paidThroughName: '', // will be resolved via ledger list
            reference: p.reference || '',
            notes: ''
          }));
          // Store allocations in ref — they'll be applied after bills are fetched
          const allocs = {};
          (p.billAllocations || []).forEach(a => {
            if (a.billId) allocs[a.billId] = a.amount;
          });
          editAllocationsRef.current = allocs;
          setAllocations(allocs);
          // Pre-populate the bills table with the rows returned from the API as a fallback
          // getUnpaidBills will overwrite this with the full list of unpaid bills shortly after
          if (p.billRows && p.billRows.length > 0) {
            setOutstandingBills(p.billRows);
          }
        })
        .catch(err => {
          console.error('Failed to load payment', err);
          alert('Unable to load payment for editing');
        });
    }
  }, [id]);

  // Static Paid Through options matching Zoho Books layout
  const paidThroughOptions = useMemo(() => {
     // Find bank accounts from the fetched ledgers
     const bankAccounts = ledgers.filter(l => {
        const gName = l.Group?.name || l.groupName || '';
        return ['Bank Accounts', 'Bank OD A/c', 'Bank OCC A/c'].includes(gName);
     });

     return [
        { group: 'Bank', items: bankAccounts.length > 0 
           ? bankAccounts.map(b => ({ id: b.id, name: b.name }))
           : [{ id: 'bank_placeholder', name: 'No bank accounts found' }]
        },
        { group: 'Cash', items: [
           { id: 'cash_petty_cash', name: 'Petty Cash' },
           { id: 'cash_undeposited', name: 'Undeposited Funds' },
        ]},
        { group: 'Other Current Liability', items: [
           { id: 'ocl_employee_reimb', name: 'Employee Reimbursements' },
           { id: 'ocl_tds_payable', name: 'TDS Payable' },
        ]},
        { group: 'Equity', items: [
           { id: 'eq_capital_stock', name: 'Capital Stock' },
           { id: 'eq_distributions', name: 'Distributions' },
           { id: 'eq_dividends_paid', name: 'Dividends Paid' },
           { id: 'eq_drawings', name: 'Drawings' },
           { id: 'eq_investments', name: 'Investments' },
           { id: 'eq_opening_balance', name: 'Opening Balance Offset' },
           { id: 'eq_owners_equity', name: "Owner's Equity" },
        ]},
        { group: 'Other Current Asset', items: [
           { id: 'oca_employee_advance', name: 'Employee Advance' },
           { id: 'oca_tds_receivable', name: 'TDS Receivable' },
        ]},
     ];
  }, [ledgers]);

  // Resolve the selected display name (from either real ledger or static option)
  const getSelectedPaidThroughName = () => {
     if (!formData.paidThroughId) return null;
     // Check real ledgers first
     const realLedger = ledgers.find(l => l.id === formData.paidThroughId);
     if (realLedger) return realLedger.name;
     // Check static items
     for (const group of paidThroughOptions) {
        const found = group.items.find(i => i.id === formData.paidThroughId);
        if (found) return found.name;
     }
     return null;
  };

  // Filtered options for search
  const filteredPaidThroughOptions = useMemo(() => {
     if (!paidThroughSearch.trim()) return paidThroughOptions;
     const q = paidThroughSearch.toLowerCase();
     return paidThroughOptions
        .map(g => ({
           ...g,
           items: g.items.filter(i => i.name.toLowerCase().includes(q))
        }))
        .filter(g => g.items.length > 0);
  }, [paidThroughOptions, paidThroughSearch]);

  useEffect(() => {
    if (!companyId) return;
    Promise.all([
      purchaseAPI.getVendors(companyId),
      ledgerAPI.getByCompany(companyId),
      // Only fetch next payment number for new payments
      ...(isEditMode ? [] : [paymentMadeAPI.getNextNumber(companyId)])
    ]).then(([vendorsRes, ledgersRes, nextNumRes]) => {
      setVendors(vendorsRes.data || []);
      setLedgers(ledgersRes.data || []);
      if (!isEditMode && nextNumRes) {
        setFormData(prev => ({ ...prev, paymentNumber: String(nextNumRes.data?.nextNumber || 1) }));
      }
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

  const loadedVendorIdRef = useRef(null);

  // Fetch unpaid bills when vendor changes
  useEffect(() => {
    if (formData.vendorId && activeTab === 'Bill Payment') {
      setFetchingBills(true);
      paymentMadeAPI.getUnpaidBills(formData.vendorId, companyId, isEditMode ? id : null)
        .then(res => {
          const fetchedBills = res.data || [];
          setOutstandingBills(fetchedBills);
          
          // If we are in edit mode and just loaded the payment, restore the original allocations
          if (isEditMode && editAllocationsRef.current) {
             let allocsToApply = { ...editAllocationsRef.current };
             
             // Fallback for legacy payments: if backend found no BILL_REF but there is a payment amount
             if (Object.keys(allocsToApply).length === 0 && parseFloat(formData.paymentMade) > 0) {
                let remaining = parseFloat(formData.paymentMade);
                fetchedBills.forEach(b => {
                   if (remaining > 0) {
                      const amountToApply = Math.min(remaining, b.balanceDue);
                      allocsToApply[b.id] = amountToApply;
                      remaining -= amountToApply;
                   }
                });
             }
             
             setAllocations(allocsToApply);
             editAllocationsRef.current = null; // only apply once
             loadedVendorIdRef.current = formData.vendorId;
          }
          // If in edit mode and vendor hasn't changed, do nothing (prevent clearing on re-renders)
          else if (isEditMode && loadedVendorIdRef.current === formData.vendorId) {
             // Keep existing allocations
          }
          // Otherwise, clear allocations if we're not tied to an initial bill
          else if (!initialBillDetail || initialBillDetail.LedgerId !== formData.vendorId) {
            setAllocations({});
          }
        })
        .finally(() => setFetchingBills(false));
    } else {
      setOutstandingBills([]);
    }
  }, [formData.vendorId, activeTab, companyId, isEditMode, id, formData.paymentMade]);

  const handleAllocationChange = (billId, value) => {
    const amount = value === '' ? '' : parseFloat(value) || 0;
    setAllocations(prev => ({
      ...prev,
      [billId]: amount
    }));
  };

  const totalAmountDue = useMemo(() => {
    return outstandingBills.reduce((sum, b) => sum + parseFloat(b.balanceDue || 0), 0);
  }, [outstandingBills]);

  const handlePayFullAmount = (e) => {
    const checked = e.target.checked;
    setPayFullAmount(checked);
    if (checked) {
       setFormData(prev => ({ ...prev, paymentMade: totalAmountDue }));
       const newAllocations = {};
       outstandingBills.forEach(b => newAllocations[b.id] = parseFloat(b.balanceDue || 0));
       setAllocations(newAllocations);
    } else {
       setFormData(prev => ({ ...prev, paymentMade: '' }));
       setAllocations({});
    }
  };

  const totalUsed = useMemo(() => {
    return Object.values(allocations).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  }, [allocations]);

  // Create ledger on the fly if it's a default static option
  const ensureRealLedger = async (id, name, companyId) => {
    // If it's a valid UUID (36 chars), it's already a real ledger
    if (id && id.length === 36) return id;
    
    // Determine the correct Tally group for the static Zoho account
    let groupName = 'Current Liabilities';
    if (name === 'Petty Cash' || name === 'Undeposited Funds') groupName = 'Cash-in-Hand';
    else if (name === 'Employee Reimbursements') groupName = 'Current Liabilities';
    else if (name === 'TDS Payable') groupName = 'Duties & Taxes';
    else if (['Capital Stock', 'Distributions', 'Dividends Paid', 'Drawings', 'Investments', 'Opening Balance Offset', "Owner's Equity"].includes(name)) groupName = 'Capital Account';
    else if (name === 'Employee Advance') groupName = 'Loans & Advances (Asset)';
    else if (name === 'TDS Receivable') groupName = 'Current Assets';
    
    try {
      // Create it via ledgerAPI
      const res = await ledgerAPI.create({
        name,
        groupName,
        companyId,
        openingBalance: 0,
        openingBalanceType: 'Dr'
      });
      
      // Update our local ledgers list so it shows up next time
      setLedgers(prev => [...prev, res.data]);
      
      return res.data.id;
    } catch (err) {
      console.error("Failed to auto-create ledger:", err);
      throw new Error(`Failed to create account '${name}'. Please try again.`);
    }
  };

  const handleSave = async (status = 'Paid') => {
    if (!formData.vendorId || !formData.paymentMade || !formData.paidThroughId) {
      alert("Please ensure Vendor, Payment Made, and Paid Through fields are filled.");
      return;
    }

    setIsSaving(true);
    try {
      // Ensure Paid Through is a real ledger UUID
      const realPaidThroughId = await ensureRealLedger(formData.paidThroughId, formData.paidThroughName, companyId);
      
      const payload = {
        ...formData,
        paidThroughId: realPaidThroughId,
        amount: parseFloat(formData.paymentMade),
        billAllocations: Object.entries(allocations).filter(([_, amt]) => parseFloat(amt) > 0).map(([id, amt]) => ({
          billId: id,
          amount: parseFloat(amt),
          billNumber: outstandingBills.find(b => b.id === id)?.billNumber
        })),
        status,
        companyId
      };

      let newPaymentId = id;
      if (id) {
        await paymentMadeAPI.update(id, payload);
      } else {
        const res = await paymentMadeAPI.create(payload);
        newPaymentId = res.data?.id;
      }
      
      navigate('/payments-made', { state: { selectedPaymentId: newPaymentId } });
    } catch (err) {
      console.error("Save failed:", err);
      alert("Failed to save payment: " + (err.response?.data?.error || err.message));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white font-inter text-[13px] text-slate-800">
      {/* --- TOP HEADER --- */}
      <div className="flex items-center justify-between border-b border-slate-200 px-8 h-12 sticky top-0 bg-white z-10 w-full shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
         {isEditMode ? (
           <div className="flex items-center gap-4 h-full">
             <button onClick={() => window.history.back()} className="text-slate-500 hover:text-slate-700 p-1 rounded hover:bg-slate-100 transition-colors">
               <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
             </button>
             <span className="font-bold text-slate-800 text-[15px]">Edit Payment</span>
           </div>
         ) : (
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
         )}
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
                  <div className="flex-1 max-w-md relative flex items-center">
                     <div className="relative flex-1">
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
                     {formData.vendorId && (
                        <button className="bg-[#4a5568] text-white px-3 h-9 rounded text-[12px] font-medium ml-4 shrink-0 flex items-center hover:bg-slate-700 transition-colors">
                           {vendors.find(v => v.id === formData.vendorId)?.name}'s Details &gt;
                        </button>
                     )}
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
                  <div className="flex-1 max-w-md space-y-2.5">
                     <div className="flex items-center">
                        <span className="w-10 h-9 bg-slate-100 border border-r-0 border-slate-200 rounded-l flex items-center justify-center font-medium text-slate-500">
                          INR
                        </span>
                        <input 
                          type="number" 
                          value={formData.paymentMade}
                          onChange={(e) => {
                             setFormData({...formData, paymentMade: e.target.value});
                             if (parseFloat(e.target.value) !== totalAmountDue) setPayFullAmount(false);
                          }}
                          className="w-full h-9 px-3 border border-slate-200 rounded-r outline-none text-[13px] hover:border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-colors"
                        />
                     </div>
                     {!isEditMode && outstandingBills.length > 0 && (
                        <div className="flex items-center gap-2 pt-1">
                           <input 
                             type="checkbox" 
                             id="payFullAmount"
                             checked={payFullAmount}
                             onChange={handlePayFullAmount}
                             className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                           />
                           <label htmlFor="payFullAmount" className="text-[13px] text-slate-700 cursor-pointer select-none">
                              Pay full amount (₹{totalAmountDue.toLocaleString('en-IN', {minimumFractionDigits: 2})})
                           </label>
                        </div>
                     )}
                     {!hideBanner && !isEditMode && (
                       <div className="bg-[#fff9e6] border border-[#fcefc7] rounded text-[12px] text-slate-600 p-2.5 flex items-start justify-between shadow-sm mt-2">
                          <div className="flex gap-2.5 pt-0.5">
                             <span className="text-yellow-500 leading-none mt-0.5">&#9889;</span>
                             <span className="leading-relaxed">Initiate payments for your bills directly from Zoho Books by integrating with one of our partner banks. <button className="text-blue-500 font-medium hover:underline focus:outline-none">Set Up Now</button></span>
                          </div>
                          <button onClick={() => setHideBanner(true)} className="text-red-500 hover:text-red-700 p-0.5"><X size={14} /></button>
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
                  <label className="w-[180px] shrink-0 text-red-500 font-medium py-2">Paid Through <span className="ml-1">*</span></label>
                  <div className="flex-1 max-w-md relative" ref={paidThroughRef}>
                     <div 
                        className="w-full h-9 px-3 border border-slate-200 rounded text-[13px] bg-white cursor-pointer hover:border-slate-300 flex items-center justify-between"
                        onClick={() => setIsPaidThroughOpen(!isPaidThroughOpen)}
                      >
                         <span className={formData.paidThroughId ? "text-slate-800" : "text-slate-400"}>
                            {getSelectedPaidThroughName() || 'Select Account'}
                         </span>
                         <ChevronDown size={14} className="text-slate-400" />
                      </div>
                      
                      {isPaidThroughOpen && (
                         <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded shadow-lg z-50 max-h-60 overflow-hidden flex flex-col">
                            <div className="p-2 border-b border-slate-100 flex items-center gap-2">
                               <Search size={14} className="text-slate-400" />
                               <input 
                                 type="text"
                                 placeholder="Search accounts..."
                                 value={paidThroughSearch}
                                 onChange={(e) => setPaidThroughSearch(e.target.value)}
                                 className="flex-1 outline-none text-[13px]"
                                 autoFocus
                               />
                            </div>
                            <div className="flex-1 overflow-y-auto py-1">
                               {filteredPaidThroughOptions.map(({ group, items }) => (
                                  <div key={group} className="mb-1">
                                     <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50">{group}</div>
                                     {items.map(acc => (
                                        <div 
                                           key={acc.id}
                                           className="px-3 py-1.5 text-[13px] text-slate-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer flex items-center justify-between"
                                           onClick={() => {
                                              if (acc.id === 'bank_placeholder') return;
                                              setFormData({...formData, paidThroughId: acc.id, paidThroughName: acc.name});
                                              setIsPaidThroughOpen(false);
                                              setPaidThroughSearch('');
                                           }}
                                        >
                                           {acc.name}
                                           {formData.paidThroughId === acc.id && <Check size={14} className="text-blue-600" />}
                                        </div>
                                     ))}
                                  </div>
                               ))}
                            </div>
                         </div>
                      )}
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
            <div className="mt-16 w-full">
               <div className="flex justify-end mb-2 mr-4">
                  <button onClick={() => setAllocations({})} className="text-[12px] font-medium text-blue-500 hover:text-blue-700 transition-colors">
                     Clear Applied Amount
                  </button>
               </div>

               <div className="w-full">
                  <table className="w-full text-left border-collapse">
                     <thead>
                        <tr className="border-b border-slate-200 text-slate-500 text-[12px]">
                           <th className="py-2.5 px-4 font-normal tracking-wider w-[120px]">Date</th>
                           <th className="py-2.5 px-4 font-normal tracking-wider">Bill#</th>
                           <th className="py-2.5 px-4 font-normal tracking-wider">PO#</th>
                           <th className="py-2.5 px-4 font-normal tracking-wider text-right">Bill Amount</th>
                           <th className="py-2.5 px-4 font-normal tracking-wider text-right">Amount Due</th>
                           <th className="py-2.5 px-4 font-normal tracking-wider text-center w-[160px]">Payment Made on <AlertCircle size={12} className="inline text-slate-400 mb-0.5"/></th>
                           <th className="py-2.5 px-4 font-normal tracking-wider text-right w-[140px]">Payment</th>
                        </tr>
                     </thead>
                     <tbody className="bg-white">
                        {!formData.vendorId ? (
                           <tr>
                              <td colSpan={7} className="py-16 text-center text-slate-400 text-[14px]">
                                 Select a vendor to see their outstanding bills.
                              </td>
                           </tr>
                        ) : fetchingBills ? (
                           <tr>
                              <td colSpan={7} className="py-16 text-center text-slate-400 text-[14px]">
                                 <span className="animate-pulse">Loading bills...</span>
                              </td>
                           </tr>
                        ) : outstandingBills.length === 0 ? (
                           <tr>
                              <td colSpan={7} className="py-16 text-center text-slate-400 text-[14px]">
                                 There are no outstanding bills for this vendor.
                              </td>
                           </tr>
                        ) : (
                           outstandingBills.map(bill => (
                              <tr key={bill.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                 <td className="py-3 px-4 text-[13px]">
                                    <div>{new Date(bill.date).toLocaleDateString('en-GB')}</div>
                                    {bill.dueDate && (
                                       <div className="text-[11px] text-slate-500 mt-0.5">
                                          Due Date: {new Date(bill.dueDate).toLocaleDateString('en-GB')}
                                       </div>
                                    )}
                                 </td>
                                 <td className="py-3 px-4 text-[13px] font-medium text-slate-800">{bill.billNumber}</td>
                                 <td className="py-3 px-4 text-[13px] text-slate-500">{bill.reference || ''}</td>
                                 <td className="py-3 px-4 text-[13px] text-right">{parseFloat(bill.totalAmount || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                                 <td className="py-3 px-4 text-[13px] text-right">{parseFloat(bill.balanceDue || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                                 <td className="py-2 px-4 text-center">
                                    <input 
                                       type="date"
                                       defaultValue={formData.paymentDate}
                                       className="w-full h-8 px-2 border border-slate-200 rounded outline-none text-[12px] text-slate-600 bg-white"
                                    />
                                 </td>
                                 <td className="py-2 px-4 text-right flex flex-col items-end justify-center min-h-[50px]">
                                    <input 
                                       type="number"
                                       value={allocations[bill.id] !== undefined ? allocations[bill.id] : ''}
                                       onChange={(e) => handleAllocationChange(bill.id, e.target.value)}
                                       className="w-full h-8 px-2 text-right border border-slate-300 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-[13px] bg-white transition-shadow"
                                    />
                                    <button
                                       onClick={() => handleAllocationChange(bill.id, bill.balanceDue)}
                                       className="text-[11px] text-blue-500 hover:text-blue-700 mt-1 font-medium"
                                    >
                                       Pay in Full
                                    </button>
                                 </td>
                              </tr>
                           ))
                        )}
                     </tbody>
                  </table>

                  {/* Total below table */}
                  <div className="flex justify-end items-center pr-4 mt-2 gap-4">
                     <span className="text-[13px] font-medium text-slate-600">Total :</span>
                     <span className="text-[13px] font-medium w-[130px] text-right">{parseFloat(totalUsed || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                  </div>
               </div>

               <div className="flex justify-end mt-12">
                  {/* Totals Box */}
                  <div className="w-[420px] bg-[#fff8ef] rounded-lg p-6 space-y-4 shadow-sm border border-slate-100">
                     <div className="flex justify-between items-center text-[13px] font-medium text-slate-600">
                        <span>Amount Paid:</span>
                        <span>{parseFloat(formData.paymentMade || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                     </div>
                     <div className="flex justify-between items-center text-[13px] font-medium text-slate-600">
                        <span>Amount used for Payments:</span>
                        <span>{parseFloat(totalUsed || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                     </div>
                     <div className="flex justify-between items-center text-[13px] font-medium text-slate-600">
                        <span>Amount Refunded:</span>
                        <span>0.00</span>
                     </div>
                     <div className="flex justify-between items-center text-[13px] font-bold text-orange-600 pt-1">
                        <div className="flex items-center gap-1.5"><AlertCircle size={14} className="text-orange-500" /> Amount in Excess:</div>
                        <span>₹ {Math.max(0, parseFloat(formData.paymentMade || 0) - totalUsed).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
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
      <div className="fixed bottom-0 left-[var(--sidebar-width,0px)] right-0 h-16 bg-white border-t border-slate-200 px-8 flex items-center gap-3 z-20 shadow-[0_-2px_6px_rgba(0,0,0,0.02)]">
         <button
           onClick={() => handleSave(isEditMode ? 'Paid' : 'Draft')}
           disabled={isSaving}
           className="px-4 py-1.5 bg-[#0052cc] border border-[#0052cc] rounded text-white font-medium hover:bg-blue-700 transition-colors text-[13px]"
         >
           {isSaving ? 'Saving...' : 'Save'}
         </button>
         {!isEditMode && (
           <button
             onClick={() => handleSave('Paid')}
             disabled={isSaving}
             className="px-4 py-1.5 bg-white border border-slate-300 rounded text-slate-700 font-medium hover:bg-slate-50 transition-colors text-[13px]"
           >
             Save as Paid
           </button>
         )}
         {isEditMode && (
           <button
             onClick={() => handleSave('Paid')}
             disabled={isSaving}
             className="px-4 py-1.5 bg-white border border-slate-300 rounded text-slate-700 font-medium hover:bg-slate-50 transition-colors text-[13px]"
           >
             Save as Paid
           </button>
         )}
         <button
           onClick={() => window.history.back()}
           className="px-4 py-1.5 bg-white border border-slate-300 rounded text-slate-700 font-medium hover:bg-slate-50 transition-colors text-[13px]"
         >
           Cancel
         </button>
      </div>

    </div>
  );
};

export default PaymentsMadeEntryView;
