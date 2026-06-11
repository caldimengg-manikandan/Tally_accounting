import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  X, Settings, ChevronDown, AlertCircle, Search, Check, 
  User, Phone, Smartphone, Mail, AlertTriangle, Paperclip, 
  ChevronRight, PanelRightClose, PanelRight, HelpCircle
} from 'lucide-react';
import { purchaseAPI, ledgerAPI, paymentMadeAPI } from '../../services/api';
import useNotificationStore from '../../store/notificationStore';

const PaymentsMadeEntryView = ({ companyId }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addNotification } = useNotificationStore();
  const { id } = useParams();
  const isEditMode = !!id;
  const editAllocationsRef = useRef(null); // stores edit-mode allocations until bills are set
  const initialBillDetail = location.state?.billDetail;
  const queryParams = new URLSearchParams(location.search);
  const initialVendorId = location.state?.vendorId 
    ? String(location.state.vendorId) 
    : (queryParams.get('vendorId') || '');
  const initialVendorName = location.state?.vendorName || queryParams.get('vendorName') || '';
  
  const [activeTab, setActiveTab] = useState('Bill Payment');
  
  // Data
  const [vendors, setVendors] = useState([]);
  const [ledgers, setLedgers] = useState([]);
  const [outstandingBills, setOutstandingBills] = useState([]);

  const [formData, setFormData] = useState({
    vendorId: initialVendorId || '',
    paymentNumber: '',
    paymentMade: initialBillDetail?.balanceDue || '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMode: 'Cash',
    paidThroughId: '',
    reference: initialBillDetail?.referenceNumber || '',
    notes: '',
    tds: '',
    depositToId: ''
  });

  // Table State
  const [allocations, setAllocations] = useState({}); // { billId: amount }

  // UI States
  const [fetchingBills, setFetchingBills] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hideBanner, setHideBanner] = useState(true);
  const [payFullAmount, setPayFullAmount] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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
            paymentMode: p.paymentMode || 'Cash',
            paidThroughId: p.paidThroughId || '',
            paidThroughName: '', // will be resolved via ledger list
            reference: p.reference || '',
            notes: p.notes || '',
            tds: p.tds || '',
            depositToId: p.depositToId || ''
          }));
          if (p.activeTab) {
            setActiveTab(p.activeTab);
          }
          // Store allocations in ref — they'll be applied after bills are fetched
          const allocs = {};
          (p.billAllocations || []).forEach(a => {
            if (a.billId) allocs[a.billId] = a.amount;
          });
          editAllocationsRef.current = allocs;
          setAllocations(allocs);
          // Pre-populate the bills table with the rows returned from the API as a fallback
          if (p.billRows && p.billRows.length > 0) {
            setOutstandingBills(p.billRows);
          }
        })
        .catch(err => {
          console.error('Failed to load payment', err);
          addNotification('Unable to load payment for editing', 'error');
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
        { group: 'Cash', items: [
           { id: 'cash_petty_cash', name: 'Petty Cash' },
           { id: 'cash_undeposited', name: 'Undeposited Funds' },
        ]},
        { group: 'Bank', items: bankAccounts.length > 0 
           ? bankAccounts.map(b => ({ id: b.id, name: b.name }))
           : [{ id: 'bank_placeholder', name: 'No bank accounts found' }]
        },
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

  const depositToOptions = useMemo(() => {
     return ledgers.filter(l => {
        const gName = l.Group?.name || l.groupName || '';
        return [
          'Prepaid Expenses', 
          'Current Assets', 
          'Loans & Advances (Asset)', 
          'Cash-in-Hand',
          'Suspense Account'
        ].includes(gName);
     });
  }, [ledgers]);

  useEffect(() => {
    if (ledgers.length > 0 && !formData.depositToId && !isEditMode) {
      const prepaidLedger = ledgers.find(l => l.name?.toLowerCase().includes('prepaid expense') || l.name?.toLowerCase().includes('advance to supplier'));
      if (prepaidLedger) {
        setFormData(prev => ({ ...prev, depositToId: prepaidLedger.id }));
      }
    }
  }, [ledgers]);

  // Resolve the selected display name
  const getSelectedPaidThroughName = () => {
     if (!formData.paidThroughId) return null;
     const realLedger = ledgers.find(l => l.id === formData.paidThroughId);
     if (realLedger) return realLedger.name;
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
          // If in edit mode and vendor hasn't changed, do nothing
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

  // Compute vendor object for sidebar
  const activeVendor = useMemo(() => {
    return vendors.find(v => String(v.id) === String(formData.vendorId));
  }, [vendors, formData.vendorId]);

  // Parse addresses safely
  const parseAddress = (addr) => {
    if (!addr) return null;
    if (typeof addr === 'object') return addr;
    try {
      return JSON.parse(addr);
    } catch (e) {
      return null;
    }
  };

  const billingAddr = useMemo(() => {
    if (!activeVendor) return null;
    return parseAddress(activeVendor.billingAddress || activeVendor.billingAddressJson);
  }, [activeVendor]);

  // Create ledger on the fly if it's a default static option
  const ensureRealLedger = async (id, name, companyId) => {
    if (id && id.length === 36) return id;
    
    let groupName = 'Current Liabilities';
    if (name === 'Petty Cash' || name === 'Undeposited Funds') groupName = 'Cash-in-Hand';
    else if (name === 'Employee Reimbursements') groupName = 'Current Liabilities';
    else if (name === 'TDS Payable') groupName = 'Duties & Taxes';
    else if (['Capital Stock', 'Distributions', 'Dividends Paid', 'Drawings', 'Investments', 'Opening Balance Offset', "Owner's Equity"].includes(name)) groupName = 'Capital Account';
    else if (name === 'Employee Advance') groupName = 'Loans & Advances (Asset)';
    else if (name === 'TDS Receivable') groupName = 'Current Assets';
    
    try {
      const res = await ledgerAPI.create({
        name,
        groupName,
        companyId,
        openingBalance: 0,
        openingBalanceType: 'Dr'
      });
      setLedgers(prev => [...prev, res.data]);
      return res.data.id;
    } catch (err) {
      console.error("Failed to auto-create ledger:", err);
      throw new Error(`Failed to create account '${name}'. Please try again.`);
    }
  };

  const handleSave = async (status = 'Paid') => {
    const selectedPaidThroughName = getSelectedPaidThroughName();
    if (!formData.vendorId || !formData.paymentMade || !formData.paidThroughId) {
      addNotification("Please ensure Vendor, Payment Made, and Paid Through fields are filled.", "warning");
      return;
    }

    if (activeTab === 'Vendor Advance' && !formData.depositToId) {
      addNotification("Please ensure the Deposit To field is filled.", "warning");
      return;
    }

    setIsSaving(true);
    try {
      const realPaidThroughId = await ensureRealLedger(formData.paidThroughId, selectedPaidThroughName, companyId);
      
      const payload = {
        ...formData,
        paidThroughId: realPaidThroughId,
        amount: parseFloat(formData.paymentMade),
        billAllocations: activeTab === 'Vendor Advance'
          ? []
          : Object.entries(allocations).filter(([_, amt]) => parseFloat(amt) > 0).map(([id, amt]) => ({
              billId: id,
              amount: parseFloat(amt),
              billNumber: outstandingBills.find(b => b.id === id)?.billNumber
            })),
        status,
        companyId,
        activeTab
      };

      let newPaymentId = id;
      if (id) {
        await paymentMadeAPI.update(id, payload);
      } else {
        const res = await paymentMadeAPI.create(payload);
        newPaymentId = res.data?.id;
      }
      
      // Go back to vendors detail page if vendorId query param was present, else list
      const backTo = queryParams.get('backTo');
      if (backTo === 'vendors' && formData.vendorId) {
        navigate(`/vendors/view/${formData.vendorId}`);
      } else {
        navigate('/payments-made', { state: { selectedPaymentId: newPaymentId } });
      }
    } catch (err) {
      console.error("Save failed:", err);
      addNotification("Failed to save payment: " + (err.response?.data?.error || err.message), "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-[#fbfcff] font-sans text-[13px] text-slate-800 overflow-hidden">
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* --- TOP HEADER --- */}
      <div className="flex items-center justify-between border-b border-slate-200 px-8 h-12 shrink-0 bg-white z-10 w-full shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
         {isEditMode ? (
           <div className="flex items-center gap-4 h-full">
             <button onClick={() => window.history.back()} className="text-slate-500 hover:text-slate-700 p-1 rounded hover:bg-slate-100 transition-colors">
               <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
             </button>
             <span className="font-bold text-slate-900 text-[15px]">Edit Bill Payment</span>
           </div>
         ) : (
           <div className="flex items-center gap-6 h-full">
             <button
               className={`h-full border-b-[2px] font-semibold text-[13.5px] px-2 flex items-center transition-all ${activeTab === 'Bill Payment' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-blue-600'}`}
               onClick={() => setActiveTab('Bill Payment')}
             >
                Bill Payment
             </button>
             <button
               className={`h-full border-b-[2px] font-semibold text-[13.5px] px-2 flex items-center transition-all ${activeTab === 'Vendor Advance' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-blue-600'}`}
               onClick={() => setActiveTab('Vendor Advance')}
             >
                Vendor Advance
             </button>
           </div>
         )}
         <button onClick={() => window.history.back()} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-all">
            <X size={18} strokeWidth={2.5} />
         </button>
      </div>

      {/* --- SPLIT LAYOUT BODY --- */}
      <div className="flex flex-1 overflow-hidden">
         {/* LEFT MAIN FORM PANEL */}
         <div className="flex-1 overflow-y-auto no-scrollbar px-8 py-8 pb-32">
            <div className="space-y-6">
               
               {/* Grid Layout Fields */}
               <div className="space-y-4">
                  
                  {/* Vendor Name */}
                  <div className="grid grid-cols-[180px_1fr] items-center gap-4">
                     <label className="text-red-500 font-semibold text-[13px] flex items-center">
                        Vendor Name<span className="ml-0.5">*</span>
                     </label>
                     <div className="max-w-lg relative flex items-center gap-3">
                        <div className="relative flex-1">
                           <select 
                             value={formData.vendorId ? String(formData.vendorId) : ''}
                             onChange={(e) => setFormData({...formData, vendorId: e.target.value})}
                             className="w-full h-8.5 pl-3 pr-8 border border-slate-300 rounded outline-none text-[13px] text-slate-800 bg-white cursor-pointer hover:border-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all appearance-none"
                           >
                             <option value="">Select Vendor</option>
                             {vendors.map(v => <option key={v.id} value={String(v.id)}>{v.name}</option>)}
                              {formData.vendorId && !vendors.some(v => String(v.id) === String(formData.vendorId)) && (
                                 <option value={String(formData.vendorId)}>{initialVendorName || 'Pre-selected Vendor'}</option>
                              )}
                           </select>
                           <ChevronDown size={14} className="absolute right-3 top-2.5 text-slate-400 pointer-events-none stroke-[2.5]" />
                        </div>
                        {formData.vendorId && (
                           <button 
                             onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                             className="h-8.5 bg-slate-800 hover:bg-slate-900 text-white px-3.5 rounded text-[12px] font-bold shrink-0 flex items-center gap-1.5 transition-colors shadow-sm"
                           >
                              {activeVendor?.name}'s... {isSidebarOpen ? <PanelRightClose size={13}/> : <PanelRight size={13}/>}
                           </button>
                        )}
                     </div>
                  </div>

                  {/* Payment # */}
                  <div className="grid grid-cols-[180px_1fr] items-center gap-4">
                     <label className="text-red-500 font-semibold text-[13px]">
                        Payment #<span className="ml-0.5">*</span>
                     </label>
                     <div className="max-w-lg relative">
                        <input 
                          type="text" 
                          value={formData.paymentNumber}
                          onChange={(e) => setFormData({...formData, paymentNumber: e.target.value})}
                          className="w-full h-8.5 pl-3 pr-8 border border-slate-300 rounded outline-none text-[13px] hover:border-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-700"
                        />
                        <Settings size={14} className="absolute right-3 top-2.5 text-slate-400 cursor-pointer hover:text-slate-600 stroke-[2]" />
                     </div>
                  </div>

                  {/* Payment Made */}
                  <div className="grid grid-cols-[180px_1fr] items-center gap-4">
                     <label className="text-red-500 font-semibold text-[13px]">
                        Payment Made<span className="ml-0.5">*</span>
                     </label>
                     <div className="max-w-lg space-y-2">
                        <div className="flex items-center shadow-sm rounded overflow-hidden">
                           <span className="w-12 h-8.5 bg-slate-100 border border-slate-300 border-r-0 flex items-center justify-center font-bold text-slate-500 tracking-tight text-[12px]">
                             INR
                           </span>
                           <input 
                             type="number" 
                             value={formData.paymentMade}
                             onChange={(e) => {
                                setFormData({...formData, paymentMade: e.target.value});
                                if (parseFloat(e.target.value) !== totalAmountDue) setPayFullAmount(false);
                             }}
                             className="w-full h-8.5 px-3 border border-slate-300 rounded-r outline-none text-[13px] font-bold text-slate-800 hover:border-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                           />
                        </div>
                        {!isEditMode && outstandingBills.length > 0 && (
                           <div className="flex items-center gap-2 pt-1 pl-0.5">
                              <input 
                                type="checkbox" 
                                id="payFullAmount"
                                checked={payFullAmount}
                                onChange={handlePayFullAmount}
                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                              <label htmlFor="payFullAmount" className="text-[12.5px] font-semibold text-slate-700 cursor-pointer select-none">
                                 Pay full amount (₹{totalAmountDue.toLocaleString('en-IN', {minimumFractionDigits: 2})})
                              </label>
                           </div>
                        )}
                        {!hideBanner && !isEditMode && (
                          <div className="bg-[#fff9e6] border border-[#fcefc7] rounded-xl text-[12px] text-slate-700 p-3.5 flex items-start justify-between shadow-sm mt-2">
                             <div className="flex gap-2.5 pt-0.5">
                                <span className="text-yellow-600 text-[14px] leading-none">&#9889;</span>
                                <span className="leading-relaxed">Initiate payments for your bills directly from Zoho Books by integrating with one of our partner banks. <button className="text-blue-600 font-bold hover:underline focus:outline-none">Set Up Now</button></span>
                             </div>
                             <button onClick={() => setHideBanner(true)} className="text-slate-400 hover:text-slate-600 p-0.5"><X size={14} /></button>
                          </div>
                        )}
                     </div>
                  </div>

                  {/* TDS (only for Vendor Advance) */}
                  {activeTab === 'Vendor Advance' && (
                     <div className="grid grid-cols-[180px_1fr] items-center gap-4 animate-fade-down">
                        <label className="text-slate-600 font-semibold text-[13px]">TDS</label>
                        <div className="max-w-lg relative">
                           <select 
                             value={formData.tds || ''}
                             onChange={(e) => setFormData({...formData, tds: e.target.value})}
                             className="w-full h-8.5 pl-3 pr-8 border border-slate-300 rounded outline-none text-[13px] text-slate-800 bg-white appearance-none hover:border-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer font-medium"
                           >
                              <option value="">No TDS Tax</option>
                              <option value="TDS - 1%">TDS - 1%</option>
                              <option value="TDS - 2%">TDS - 2%</option>
                              <option value="TDS - 5%">TDS - 5%</option>
                              <option value="TDS - 10%">TDS - 10%</option>
                           </select>
                           <ChevronDown size={14} className="absolute right-3 top-2.5 text-slate-400 pointer-events-none stroke-[2.5]" />
                        </div>
                     </div>
                  )}

                  {/* Payment Date */}
                  <div className="grid grid-cols-[180px_1fr] items-center gap-4">
                     <label className="text-red-500 font-semibold text-[13px]">
                        Payment Date<span className="ml-0.5">*</span>
                     </label>
                     <div className="max-w-lg">
                        <input 
                          type="date" 
                          value={formData.paymentDate}
                          onChange={(e) => setFormData({...formData, paymentDate: e.target.value})}
                          className="w-full h-8.5 px-3 border border-slate-300 rounded outline-none text-[13px] text-slate-700 hover:border-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                        />
                     </div>
                  </div>

                  {/* Payment Mode */}
                  <div className="grid grid-cols-[180px_1fr] items-center gap-4">
                     <label className="text-slate-600 font-semibold text-[13px]">Payment Mode</label>
                     <div className="max-w-lg relative">
                        <select 
                          value={formData.paymentMode}
                          onChange={(e) => setFormData({...formData, paymentMode: e.target.value})}
                          className="w-full h-8.5 pl-3 pr-8 border border-slate-300 rounded outline-none text-[13px] text-slate-800 bg-white appearance-none hover:border-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer font-medium"
                        >
                           <option>Cash</option>
                           <option>Bank Transfer</option>
                           <option>Cheque</option>
                           <option>Credit Card</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-2.5 text-slate-400 pointer-events-none stroke-[2.5]" />
                     </div>
                  </div>

                  {/* Paid Through */}
                  <div className="grid grid-cols-[180px_1fr] items-center gap-4">
                     <label className="text-red-500 font-semibold text-[13px]">
                        Paid Through<span className="ml-0.5">*</span>
                     </label>
                     <div className="max-w-lg relative" ref={paidThroughRef}>
                        <div 
                           className="w-full h-8.5 px-3 border border-slate-300 rounded text-[13px] bg-white cursor-pointer hover:border-slate-400 flex items-center justify-between transition-all"
                           onClick={() => setIsPaidThroughOpen(!isPaidThroughOpen)}
                         >
                            <span className={`font-medium ${formData.paidThroughId ? "text-slate-800" : "text-slate-400"}`}>
                               {getSelectedPaidThroughName() || 'Select Account'}
                            </span>
                            <ChevronDown size={14} className="text-slate-400 stroke-[2]" />
                         </div>
                         
                         {isPaidThroughOpen && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-60 overflow-hidden flex flex-col animate-fade-down">
                               <div className="p-2 border-b border-slate-100 flex items-center gap-2">
                                  <Search size={14} className="text-slate-400" />
                                  <input 
                                    type="text"
                                    placeholder="Search accounts..."
                                    value={paidThroughSearch}
                                    onChange={(e) => setPaidThroughSearch(e.target.value)}
                                    className="flex-1 outline-none text-[13px] bg-transparent"
                                    autoFocus
                                  />
                               </div>
                               <div className="flex-1 overflow-y-auto py-1 no-scrollbar">
                                  {filteredPaidThroughOptions.map(({ group, items }) => (
                                     <div key={group} className="mb-1">
                                        <div className="px-3 py-1 text-[10.5px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/80">{group}</div>
                                        {items.map(acc => (
                                           <div 
                                              key={acc.id}
                                              className="px-3 py-1.5 text-[13px] text-slate-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer flex items-center justify-between font-medium"
                                              onClick={() => {
                                                 if (acc.id === 'bank_placeholder') return;
                                                 setFormData({...formData, paidThroughId: acc.id, paidThroughName: acc.name});
                                                 setIsPaidThroughOpen(false);
                                                 setPaidThroughSearch('');
                                              }}
                                           >
                                              {acc.name}
                                              {formData.paidThroughId === acc.id && <Check size={14} className="text-blue-600 stroke-[2.5]" />}
                                           </div>
                                        ))}
                                     </div>
                                  ))}
                               </div>
                            </div>
                         )}
                     </div>
                  </div>

                  {/* Deposit To (only for Vendor Advance) */}
                  {activeTab === 'Vendor Advance' && (
                     <div className="grid grid-cols-[180px_1fr] items-center gap-4 animate-fade-down">
                        <label className="text-red-500 font-semibold text-[13px] flex items-center">
                           Deposit To<span className="ml-0.5">*</span>
                        </label>
                        <div className="max-w-lg relative">
                           <select 
                             value={formData.depositToId ? String(formData.depositToId) : ''}
                             onChange={(e) => setFormData({...formData, depositToId: e.target.value})}
                             className="w-full h-8.5 pl-3 pr-8 border border-slate-300 rounded outline-none text-[13px] text-slate-800 bg-white appearance-none hover:border-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer font-medium"
                           >
                              <option value="">Select Account</option>
                              {depositToOptions.map(l => (
                                 <option key={l.id} value={String(l.id)}>{l.name}</option>
                              ))}
                           </select>
                           <ChevronDown size={14} className="absolute right-3 top-2.5 text-slate-400 pointer-events-none stroke-[2.5]" />
                        </div>
                     </div>
                  )}

                  {/* Reference# */}
                  <div className="grid grid-cols-[180px_1fr] items-center gap-4">
                     <label className="text-slate-600 font-semibold text-[13px]">Reference#</label>
                     <div className="max-w-lg">
                        <input 
                          type="text" 
                          value={formData.reference}
                          onChange={(e) => setFormData({...formData, reference: e.target.value})}
                          className="w-full h-8.5 px-3 border border-slate-300 rounded outline-none text-[13px] text-slate-700 hover:border-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                        />
                     </div>
                  </div>
               </div>

               {/* UNPAID BILLS TABLE & TOTALS */}
               {activeTab !== 'Vendor Advance' && (
                  <div className="pt-8 border-t border-slate-200/60 w-full">
                     <div className="flex justify-end mb-2 mr-2">
                        <button onClick={() => setAllocations({})} className="text-[12px] font-bold text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-tight">
                           Clear Applied Amount
                        </button>
                     </div>

                     <div className="w-full overflow-hidden border border-slate-200 rounded-xl bg-white shadow-sm">
                        <table className="w-full text-left border-collapse">
                           <thead>
                              <tr className="border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider bg-slate-50">
                                 <th className="py-3 px-5 font-bold w-[120px]">Date</th>
                                 <th className="py-3 px-5 font-bold">Bill</th>
                                 <th className="py-3 px-5 font-bold">PO#</th>
                                 <th className="py-3 px-5 font-bold text-right">Bill Amount</th>
                                 <th className="py-3 px-5 font-bold text-right">Amount Due</th>
                                 <th className="py-3 px-5 font-bold text-center w-[160px]">Payment Made on</th>
                                 <th className="py-3 px-5 font-bold text-right w-[150px]">Payment</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100">
                              {!formData.vendorId ? (
                                 <tr>
                                    <td colSpan={7} className="py-20 text-center text-slate-400 text-[13.5px] font-medium bg-white">
                                       Select a vendor to see their outstanding bills.
                                    </td>
                                 </tr>
                              ) : fetchingBills ? (
                                 <tr>
                                    <td colSpan={7} className="py-20 text-center text-slate-400 text-[13.5px] font-medium bg-white">
                                       <span className="animate-pulse">Loading outstanding bills...</span>
                                    </td>
                                 </tr>
                              ) : outstandingBills.length === 0 ? (
                                 <tr>
                                    <td colSpan={7} className="py-20 text-center text-slate-500 text-[13.5px] font-semibold bg-white uppercase tracking-wider opacity-60">
                                       There are no bills for this vendor.
                                    </td>
                                 </tr>
                              ) : (
                                 outstandingBills.map(bill => (
                                    <tr key={bill.id} className="hover:bg-slate-50/50 transition-colors">
                                       <td className="py-3 px-5 text-[12.5px] text-slate-600 font-medium">
                                          <div>{new Date(bill.date).toLocaleDateString('en-GB')}</div>
                                          {bill.dueDate && (
                                             <div className="text-[10px] text-slate-400 mt-0.5 font-bold">
                                                DUE: {new Date(bill.dueDate).toLocaleDateString('en-GB')}
                                             </div>
                                          )}
                                       </td>
                                       <td className="py-3 px-5 text-[13px] font-bold text-blue-600 hover:underline cursor-pointer">{bill.billNumber}</td>
                                       <td className="py-3 px-5 text-[12.5px] text-slate-500 font-medium">{bill.reference || '---'}</td>
                                       <td className="py-3 px-5 text-[13px] text-right font-medium">₹ {parseFloat(bill.totalAmount || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                                       <td className="py-3 px-5 text-[13px] text-right font-bold text-slate-700">₹ {parseFloat(bill.balanceDue || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                                       <td className="py-2.5 px-5 text-center">
                                          <input 
                                             type="date"
                                             defaultValue={formData.paymentDate}
                                             className="w-full h-8 px-2 border border-slate-200 rounded outline-none text-[12px] text-slate-600 bg-white hover:border-slate-300 focus:border-blue-500 transition-all font-medium"
                                          />
                                       </td>
                                       <td className="py-2.5 px-5 text-right flex flex-col items-end justify-center min-h-[56px]">
                                          <input 
                                             type="number"
                                             value={allocations[bill.id] !== undefined ? allocations[bill.id] : ''}
                                             onChange={(e) => handleAllocationChange(bill.id, e.target.value)}
                                             className="w-full h-8 px-2 text-right border border-slate-300 rounded outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-[13px] bg-white font-bold text-slate-800 transition-all"
                                          />
                                          <button
                                             onClick={() => handleAllocationChange(bill.id, bill.balanceDue)}
                                             className="text-[10.5px] font-bold text-blue-600 hover:text-blue-800 mt-1 uppercase tracking-tight"
                                          >
                                             Pay in Full
                                          </button>
                                       </td>
                                    </tr>
                                 ))
                              )}
                           </tbody>
                        </table>
                     </div>

                     {/* Total below table */}
                     <div className="flex justify-end items-center pr-5 mt-3.5 gap-4">
                        <span className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">Total :</span>
                        <span className="text-[14px] font-extrabold text-slate-900 w-[130px] text-right">
                          ₹ {parseFloat(totalUsed || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}
                        </span>
                     </div>
                  </div>
               )}

               {/* Calculations summary Box & Notes */}
               <div className="grid grid-cols-[1fr_400px] gap-8 pt-8 items-start">
                  
                  {/* Left Side: Notes & Attachments */}
                  <div className="space-y-6">
                     <div className="space-y-1.5">
                        <label className="text-[12.5px] text-slate-500 font-bold uppercase tracking-wider">Notes (Internal use. Not visible to vendor)</label>
                        <textarea 
                           value={formData.notes}
                           onChange={(e) => setFormData({...formData, notes: e.target.value})}
                           className="w-full h-24 p-3 border border-slate-300 rounded-xl outline-none text-[13px] font-medium resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                        />
                     </div>
                     
                     <div className="space-y-2">
                        <label className="text-[12.5px] text-slate-500 font-bold uppercase tracking-wider block">Attachments</label>
                        <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 hover:border-slate-400 rounded-xl bg-white text-slate-700 font-bold text-[12.5px] transition-all hover:bg-slate-50 active:scale-95 shadow-sm">
                           <Paperclip size={15} className="text-slate-500" />
                           Upload File
                        </button>
                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1">Maximum file size: 5MB</p>
                     </div>
                  </div>

                  {/* Right Side: Zoho Styled Totals Card */}
                  <div className="w-[400px] bg-[#fff9f0] border border-[#fbe7cf] rounded-2xl p-6 space-y-4 shadow-sm">
                     <div className="flex justify-between items-center text-[13px] font-semibold text-slate-600">
                        <span>Amount Paid:</span>
                        <span className="font-extrabold text-slate-800">
                          {parseFloat(formData.paymentMade || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}
                        </span>
                     </div>
                     <div className="flex justify-between items-center text-[13px] font-semibold text-slate-600">
                        <span>Amount used for Payments:</span>
                        <span className="font-extrabold text-slate-800">
                          {parseFloat(activeTab === 'Vendor Advance' ? 0 : totalUsed || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}
                        </span>
                     </div>
                     <div className="flex justify-between items-center text-[13px] font-semibold text-slate-600">
                        <span>Amount Refunded:</span>
                        <span className="font-extrabold text-slate-800">0.00</span>
                     </div>
                     
                     {/* Horizontal dash border */}
                     <div className="border-t border-dashed border-[#fbe7cf] pt-3.5 flex justify-between items-center text-[13.5px] font-extrabold text-orange-700">
                        <div className="flex items-center gap-1.5">
                           <AlertTriangle size={15} className="text-orange-600 stroke-[2.5]" /> 
                           Amount in Excess:
                        </div>
                        <span className="text-[14px]">
                           ₹ {parseFloat(activeTab === 'Vendor Advance' ? (formData.paymentMade || 0) : Math.max(0, parseFloat(formData.paymentMade || 0) - totalUsed)).toLocaleString('en-IN', {minimumFractionDigits: 2})}
                        </span>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {/* RIGHT SIDEBAR PANEL */}
         {formData.vendorId && isSidebarOpen && activeVendor && (
           <div className="w-[320px] shrink-0 border-l border-slate-200 bg-white flex flex-col overflow-y-auto no-scrollbar animate-fade-in-right">
              {/* Sidebar Header */}
              <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
                 <div className="flex flex-col">
                    <span className="text-[13.5px] font-black truncate max-w-[220px]" title={activeVendor.name}>
                       {activeVendor.name}
                    </span>
                    <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mt-0.5">Vendor Information</span>
                 </div>
                 <button 
                   onClick={() => setIsSidebarOpen(false)}
                   className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                 >
                    <ChevronRight size={18} strokeWidth={2.5}/>
                 </button>
              </div>

              {/* Sidebar Content */}
              <div className="p-5 space-y-6">
                 {/* Financial Overview Card */}
                 <div className="bg-[#f8fafc] border border-slate-100 rounded-xl p-4.5 space-y-3.5 shadow-sm">
                    <div>
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vendor Balance</span>
                       <p className="text-[18px] font-black text-slate-900 tracking-tight mt-0.5">
                          ₹{parseFloat(activeVendor.currentBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                       </p>
                    </div>
                    <div className="h-px bg-slate-200/80"></div>
                    <div className="flex justify-between items-center text-[12.5px]">
                       <span className="text-slate-500 font-semibold">Unused Credits</span>
                       <span className="text-green-600 font-extrabold">₹0.00</span>
                    </div>
                 </div>

                 {/* Contact Details */}
                 <div className="space-y-3">
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Contact Details</h4>
                    <div className="space-y-2">
                       {activeVendor.email && (
                          <div className="flex items-center gap-2 text-[12.5px] text-slate-700 font-medium">
                             <Mail size={13} className="text-slate-400 shrink-0" />
                             <span className="truncate" title={activeVendor.email}>{activeVendor.email}</span>
                          </div>
                       )}
                       {activeVendor.phone && (
                          <div className="flex items-center gap-2 text-[12.5px] text-slate-700 font-medium">
                             <Phone size={13} className="text-slate-400 shrink-0" />
                             <span>{activeVendor.phone}</span>
                          </div>
                       )}
                       {activeVendor.mobile && (
                          <div className="flex items-center gap-2 text-[12.5px] text-slate-700 font-medium">
                             <Smartphone size={13} className="text-slate-400 shrink-0" />
                             <span>{activeVendor.mobile}</span>
                          </div>
                       )}
                    </div>
                 </div>

                 {/* Billing Address */}
                 <div className="space-y-2">
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Billing Address</h4>
                    {billingAddr ? (
                       <div className="text-[12.5px] text-slate-700 leading-relaxed font-medium">
                          {billingAddr.attention && <p className="font-bold text-slate-800">{billingAddr.attention}</p>}
                          {billingAddr.address1 && <p>{billingAddr.address1}</p>}
                          {billingAddr.address2 && <p>{billingAddr.address2}</p>}
                          <p>{[billingAddr.city, billingAddr.state, billingAddr.country].filter(Boolean).join(', ')}</p>
                          {billingAddr.zip && <p className="text-slate-500 text-[11px]">Zip: {billingAddr.zip}</p>}
                       </div>
                    ) : (
                       <p className="text-[12px] text-slate-400 italic font-medium">No address specified.</p>
                    )}
                 </div>

                 {/* Other Info */}
                 <div className="space-y-2.5 pt-3 border-t border-slate-100">
                    <div className="flex justify-between items-center text-[12.5px]">
                       <span className="text-slate-500 font-semibold">Payment Terms</span>
                       <span className="text-slate-900 font-bold">{activeVendor.paymentTerms || 'Due on Receipt'}</span>
                    </div>
                    <div className="flex justify-between items-center text-[12.5px]">
                       <span className="text-slate-500 font-semibold">Currency</span>
                       <span className="text-slate-900 font-bold">INR - Indian Rupee</span>
                    </div>
                 </div>
              </div>
           </div>
         )}
      </div>

      {/* --- FIXED BOTTOM ACTION BAR --- */}
      <div className="fixed bottom-0 left-[var(--sidebar-width,0px)] right-0 h-16 bg-white border-t border-slate-200 px-8 flex items-center gap-3.5 z-20 shadow-[0_-3px_10px_rgba(0,0,0,0.03)]">
         <button
           onClick={() => handleSave('Draft')}
           disabled={isSaving}
           className="px-5 py-2 border border-slate-300 hover:border-slate-400 text-slate-700 bg-white rounded-lg font-bold text-[13px] shadow-sm transition-all hover:bg-slate-50 active:scale-95 disabled:opacity-50"
         >
           {isSaving ? 'Processing...' : 'Save as Draft'}
         </button>
         <button
           onClick={() => handleSave('Paid')}
           disabled={isSaving}
           className="px-6 py-2 bg-blue-600 border border-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[13px] shadow-lg shadow-blue-100 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
         >
           {isSaving ? 'Processing...' : 'Save as Paid'}
         </button>
         <button
           onClick={() => window.history.back()}
           className="px-5 py-2 border border-slate-300 hover:border-slate-400 text-slate-600 bg-white hover:bg-slate-50 rounded-lg font-bold text-[13px] transition-all active:scale-95"
         >
           Cancel
         </button>
      </div>

    </div>
  );
};

export default PaymentsMadeEntryView;
