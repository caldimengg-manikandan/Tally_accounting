import React, { useState, useEffect, useRef } from 'react';
import { 
  X, HelpCircle, Image as ImageIcon, ChevronLeft, ChevronDown, ChevronUp, Trash2, Search, Check, Plus, RefreshCcw
} from 'lucide-react';
import { inventoryAPI } from '../../services/api';
import { useNavigate, useLocation } from 'react-router-dom';
import CreateAccountModal from '../../components/accounting/CreateAccountModal';

const INITIAL_UNITS = [
  "CMS - cm", "DOZ - dz", "FTS - ft", "GMS - g", "INC - in",
  "KGS - kg", "KME - km", "LBS - lb", "MGS - mg", "MLT - ml",
  "MTR - m", "PCS - pcs"
];

const SALES_ACCOUNTS_STRUCTURE = [
  { category: "Other Current Asset", accounts: ["Advance Tax", "Employee Advance", "Prepaid Expenses", "TDS Receivable"] },
  { category: "Fixed Asset", accounts: ["Furniture and Equipment"] },
  { category: "Other Current Liability", accounts: ["Employee Reimbursements", "Opening Balance Adjustments", "Tax Payable", "TDS Payable", "Unearned Revenue"] },
  { category: "Income", accounts: ["Discount", "General Income", "Interest Income", "Late Fee Income", "Other Charges", "Sales", "Shipping Charge"] }
];

const PURCHASE_ACCOUNTS_STRUCTURE = [
  { category: "Other Current Asset", accounts: ["Advance Tax", "Employee Advance", "Prepaid Expenses", "TDS Receivable"] },
  { category: "Fixed Asset", accounts: ["Furniture and Equipment"] },
  { category: "Other Current Liability", accounts: ["Employee Reimbursements", "Opening Balance Adjustments", "Tax Payable", "TDS Payable", "Unearned Revenue"] },
  { category: "Expense", accounts: [
      "Advertising And Marketing", "Automobile Expense", "Bad Debt", "Bank Fees and Charges", 
      "Consultant Expense", "Contract Assets", "Depreciation And Amortisation", "Depreciation Expense", 
      "IT and Internet Expenses", "Janitorial Expense", "Lodging", "Meals and Entertainment", 
      "Merchandise", "Office Supplies", "Other Expenses", "Postage", "Printing and Stationery", 
      "Purchase Discounts", "Raw Materials And Consumables", "Rent Expense", "Repairs and Maintenance", 
      "Salaries and Employee Wages", "Telephone Expense", "Transportation Expense", "Travel Expense", 
      "Uncategorized"
    ] 
  },
  { category: "Cost Of Goods Sold", accounts: ["Cost of Goods Sold", "Job Costing", "Labor", "Materials", "Subcontractor"] }
];

const ItemEntryView = ({ onSaveSuccess, onCancel }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const editItem = location.state?.editItem || null;
  const isEditMode = !!editItem;

  const [loading, setLoading] = useState(false);
  const unitDropdownRef = useRef(null);
  const salesAccountDropdownRef = useRef(null);
  const purchaseAccountDropdownRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const [newItem, setNewItem] = useState(() => {
    if (editItem) {
      return {
        name: editItem.name || '',
        type: editItem.type || 'Goods',
        unit: editItem.unit || 'Select or type to add',
        salesInformation: true,
        sellingPrice: editItem.sellingPrice || '',
        salesAccount: editItem.salesAccount || 'Sales',
        salesDescription: editItem.salesDescription || '',
        purchaseInformation: true,
        costPrice: editItem.costPrice || '',
        purchaseAccount: editItem.purchaseAccount || 'Cost of Goods Sold',
        purchaseDescription: editItem.purchaseDescription || '',
        preferredVendor: editItem.preferredVendor || '',
        imageUrl: editItem.imageUrl || ''
      };
    }
    return {
      name: '',
      type: 'Goods',
      unit: 'Select or type to add',
      salesInformation: true,
      sellingPrice: '',
      salesAccount: 'Sales',
      salesDescription: '',
      purchaseInformation: true,
      costPrice: '',
      purchaseAccount: 'Cost of Goods Sold',
      purchaseDescription: '',
      preferredVendor: '',
      imageUrl: ''
    };
  });

  const [uploading, setUploading] = useState(false);

  const companyId = localStorage.getItem('companyId');

  // Dropdown States
  const [isUnitOpen, setIsUnitOpen] = useState(false);
  const [unitSearch, setUnitSearch] = useState('');
  const [availableUnits, setAvailableUnits] = useState(INITIAL_UNITS);
  
  const [isSalesAccountOpen, setIsSalesAccountOpen] = useState(false);
  const [salesAccountSearch, setSalesAccountSearch] = useState('');
  const [salesAccounts, setSalesAccounts] = useState(SALES_ACCOUNTS_STRUCTURE);

  const [isPurchaseAccountOpen, setIsPurchaseAccountOpen] = useState(false);
  const [purchaseAccountSearch, setPurchaseAccountSearch] = useState('');
  const [purchaseAccounts, setPurchaseAccounts] = useState(PURCHASE_ACCOUNTS_STRUCTURE);

  const [showTypeTooltip, setShowTypeTooltip] = useState(false);
  const [showUnitTooltip, setShowUnitTooltip] = useState(false);

  // Modal State
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [creationSource, setCreationSource] = useState('Purchase'); // 'Sales' or 'Purchase'

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (unitDropdownRef.current && !unitDropdownRef.current.contains(event.target)) setIsUnitOpen(false);
      if (salesAccountDropdownRef.current && !salesAccountDropdownRef.current.contains(event.target)) setIsSalesAccountOpen(false);
      if (purchaseAccountDropdownRef.current && !purchaseAccountDropdownRef.current.contains(event.target)) setIsPurchaseAccountOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditMode) {
        await inventoryAPI.updateItem(editItem.id, { ...newItem, companyId });
      } else {
        await inventoryAPI.createItem({ ...newItem, companyId });
      }
      navigate('/inventory');
    } catch (err) {
      console.error("Full Error Object:", err);
      const msg = err.response?.data?.error || err.response?.data?.message || err.message;
      alert("Error saving item: " + msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Unit Logic ──────────────────────────────────────────
  const filteredUnits = availableUnits.filter(u => u.toLowerCase().includes(unitSearch.toLowerCase()));
  const handleUnitSelect = (u) => { setNewItem({ ...newItem, unit: u }); setIsUnitOpen(false); setUnitSearch(''); };
  const handleAddNewUnit = (e) => {
    if (e.key === 'Enter' && unitSearch.trim()) {
      const newU = unitSearch.trim();
      if (!availableUnits.includes(newU)) setAvailableUnits([newU, ...availableUnits]);
      handleUnitSelect(newU);
    }
  };
  const removeUnit = (e, u) => { e.stopPropagation(); setAvailableUnits(availableUnits.filter(unit => unit !== u)); };

  // ── Sales Account Logic ──────────────────────────────────
  const filteredSalesAccounts = salesAccounts.map(group => ({
    ...group,
    accounts: group.accounts.filter(acc => acc.toLowerCase().includes(salesAccountSearch.toLowerCase()))
  })).filter(group => group.accounts.length > 0);

  const handleSalesAccountSelect = (acc) => {
    setNewItem({ ...newItem, salesAccount: acc });
    setIsSalesAccountOpen(false);
    setSalesAccountSearch('');
  };

  // ── Purchase Account Logic ──────────────────────────────────
  const filteredPurchaseAccounts = purchaseAccounts.map(group => ({
    ...group,
    accounts: group.accounts.filter(acc => acc.toLowerCase().includes(purchaseAccountSearch.toLowerCase()))
  })).filter(group => group.accounts.length > 0);

  const handlePurchaseAccountSelect = (acc) => {
    setNewItem({ ...newItem, purchaseAccount: acc });
    setIsPurchaseAccountOpen(false);
    setPurchaseAccountSearch('');
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await inventoryAPI.uploadImage(formData);
      setNewItem({ ...newItem, imageUrl: res.data.imageUrl });
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // ── Create Account Integration ─────────────────────────────
  const openNewAccountModal = (source) => {
    setCreationSource(source);
    setIsAccountModalOpen(true);
    setIsSalesAccountOpen(false);
    setIsPurchaseAccountOpen(false);
  };

  const onAccountCreated = (name) => {
    if (creationSource === 'Sales') {
      // Add to 'Income' category locally for immediate selection
      const updated = [...salesAccounts];
      const incomeGroup = updated.find(g => g.category === 'Income');
      if (incomeGroup && !incomeGroup.accounts.includes(name)) incomeGroup.accounts.push(name);
      setSalesAccounts(updated);
      setNewItem(prev => ({ ...prev, salesAccount: name }));
    } else {
      // Add to 'Expense' or 'Cost Of Goods Sold' locally
      const updated = [...purchaseAccounts];
      const expenseGroup = updated.find(g => g.category === 'Expense');
      if (expenseGroup && !expenseGroup.accounts.includes(name)) expenseGroup.accounts.push(name);
      setPurchaseAccounts(updated);
      setNewItem(prev => ({ ...prev, purchaseAccount: name }));
    }
  };

  return (
    <div className="bg-white min-h-screen font-sans animate-fade-in" onClick={() => { setShowTypeTooltip(false); setShowUnitTooltip(false); }}>
      
      {/* ── CREATE ACCOUNT MODAL ─────────────────────────── */}
      <CreateAccountModal 
        isOpen={isAccountModalOpen} 
        onClose={() => setIsAccountModalOpen(false)} 
        onSuccess={onAccountCreated}
        initialType={creationSource === 'Sales' ? 'Income' : 'Cost Of Goods Sold'}
      />

      {/* ── HEADER ────────────────────────────────────────── */}
      <div className="flex justify-between items-center px-8 py-4 border-b border-slate-100 bg-[#fbfcff]">
         <h2 className="text-[20px] font-medium text-slate-800">New Item</h2>
         <button onClick={onCancel} className="p-2 hover:bg-red-50 rounded-full transition-all text-slate-400 hover:text-red-500">
            <X size={22} />
         </button>
      </div>
      
      <form onSubmit={handleCreate} className="max-w-[1300px] mx-auto p-8 space-y-8 pb-24">
        
        {/* Blue Info Banner */}
        <div className="bg-[#eef6ff] border border-[#dcf0ff] rounded-md px-6 py-3 flex items-start gap-3">
           <div className="bg-[#1e61f0] w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] shrink-0 mt-0.5 font-bold">i</div>
           <div className="text-[13px] text-slate-600 leading-snug">
              <span className="font-bold text-slate-800">Do you want to keep track of this item?</span> Enable <span className="text-[#1e61f0] cursor-pointer hover:underline font-medium">Inventory</span> to view its stock based on the sales and purchase transactions you record for it. Go to <span className="italic">Settings &gt; Preferences &gt; Items</span> and enable Inventory.
           </div>
        </div>

        {/* Primary Settings */}
        <div className="flex gap-16 items-start">
           <div className="flex-1 space-y-6">
              <div className="flex items-center gap-6">
                 <label className="w-24 text-[13px] text-[#ff3333] font-medium">Name*</label>
                 <input required autoFocus value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="flex-1 border border-slate-200 rounded-md px-3 py-2 text-[14px] outline-none focus:border-[#1e61f0] transition-all" />
              </div>
              
              <div className="flex items-center gap-6 text-[13px]">
                 <label className="w-24 text-slate-500 font-medium flex items-center gap-1.5 relative">
                    Type 
                    <button type="button" onClick={(e) => { e.stopPropagation(); setShowTypeTooltip(!showTypeTooltip); setShowUnitTooltip(false); }} className="hover:text-slate-800 transition-colors">
                       <HelpCircle size={14} className="text-slate-600"/>
                    </button>
                    {showTypeTooltip && (
                      <div className="absolute left-20 top-1/2 -translate-y-1/2 ml-4 z-50 animate-fade-in">
                         <div className="relative bg-[#1a202c] text-white text-[12px] px-4 py-2 rounded-lg w-[280px] leading-relaxed shadow-2xl border border-slate-700 font-normal">
                            <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-[#1a202c] rotate-45 border-l border-b border-slate-700"></div>
                            Select if this item is a physical good or a service.
                         </div>
                      </div>
                    )}
                 </label>
                 <div className="flex items-center gap-8">
                    <label className="flex items-center gap-2 cursor-pointer group">
                       <input type="radio" name="type" checked={newItem.type === 'Goods'} onChange={() => setNewItem({...newItem, type: 'Goods'})} className="w-4 h-4 accent-[#1e61f0]" />
                       <span className="text-[14px] text-slate-600 group-hover:text-slate-900 transition-colors">Goods</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                       <input type="radio" name="type" checked={newItem.type === 'Service'} onChange={() => setNewItem({...newItem, type: 'Service'})} className="w-4 h-4 accent-[#1e61f0]" />
                       <span className="text-[14px] text-slate-600 group-hover:text-slate-900 transition-colors">Service</span>
                    </label>
                 </div>
              </div>

              <div className="flex items-center gap-6 text-[13px]">
                 <label className="w-24 text-slate-500 font-medium flex items-center gap-1.5 relative">
                    Unit 
                    <button type="button" onClick={(e) => { e.stopPropagation(); setShowUnitTooltip(!showUnitTooltip); setShowTypeTooltip(false); }} className="hover:text-slate-800 transition-colors">
                       <HelpCircle size={14} className="text-slate-600"/>
                    </button>
                    {showUnitTooltip && (
                      <div className="absolute left-20 top-1/2 -translate-y-1/2 ml-4 z-50 animate-fade-in">
                         <div className="relative bg-[#1a202c] text-white text-[12px] px-4 py-2 rounded-lg w-[280px] leading-relaxed shadow-2xl border border-slate-700 font-normal">
                            <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-[#1a202c] rotate-45 border-l border-b border-slate-700"></div>
                            The item will be measured in terms of this unit (e.g.: kg, dozen)
                         </div>
                      </div>
                    )}
                 </label>
                 <div className="flex-1 relative" ref={unitDropdownRef}>
                    <div onClick={() => setIsUnitOpen(!isUnitOpen)} className={`flex items-center justify-between border ${isUnitOpen ? 'border-[#1e61f0] ring-1 ring-[#1e61f0]' : 'border-slate-200'} rounded-md px-3 py-2 text-[14px] cursor-pointer bg-white transition-all`} >
                       <span className={newItem.unit === 'Select or type to add' ? 'text-slate-400' : 'text-slate-700'}>{newItem.unit}</span>
                       {isUnitOpen ? <ChevronUp size={16} className="text-[#1e61f0]"/> : <ChevronDown size={16} className="text-slate-400"/>}
                    </div>
                    {isUnitOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 shadow-2xl rounded-lg z-[60] overflow-hidden animate-slide-up">
                         <div className="p-1.5 border-b border-slate-50"><div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input autoFocus placeholder="Select or type to add" value={unitSearch} onChange={(e) => setUnitSearch(e.target.value)} onKeyDown={handleAddNewUnit} className="w-full pl-9 pr-4 py-1.5 text-[13px] outline-none bg-slate-50/50 rounded-md focus:bg-white transition-all"/></div></div>
                         <div className="max-h-[220px] overflow-y-auto py-1 custom-scrollbar">
                            {filteredUnits.length > 0 ? filteredUnits.map((u) => (
                                <div key={u} onClick={() => handleUnitSelect(u)} className={`flex items-center justify-between px-4 py-2 text-[13px] cursor-pointer group ${newItem.unit === u ? 'bg-[#1e61f0] text-white' : 'text-slate-600 hover:bg-slate-50'}`} >
                                   <span>{u}</span><button onClick={(e) => removeUnit(e, u)} className={`${newItem.unit === u ? 'text-white/80 hover:text-white' : 'text-slate-300 hover:text-red-500'} opacity-0 group-hover:opacity-100 transition-all`}><Trash2 size={13} /></button>
                                </div>
                              )) : <div className="px-4 py-6 text-center text-slate-400 text-[12px]">Press Enter to add "{unitSearch}"</div>}
                         </div>
                      </div>
                    )}
                 </div>
              </div>
           </div>

           <div className="w-[160px] flex flex-col items-center">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleFileChange}
              />
              <div 
                onClick={() => fileInputRef.current.click()}
                className="w-[160px] h-[160px] border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-400 bg-slate-50/50 hover:bg-slate-50 transition-all cursor-pointer group shadow-sm overflow-hidden"
              >
                 {uploading ? (
                   <div className="flex flex-col items-center gap-2 animate-pulse">
                      <RefreshCcw size={24} className="animate-spin text-[#1e61f0]" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Uploading...</span>
                   </div>
                 ) : newItem.imageUrl ? (
                   <div className="relative w-full h-full group">
                      <img src={newItem.imageUrl} className="w-full h-full object-cover" alt="Item" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-[2px]">
                         <span className="text-white text-[10px] font-black uppercase tracking-widest border border-white/40 px-3 py-1.5 rounded-full">Change Image</span>
                      </div>
                   </div>
                 ) : (
                   <>
                      <div className="p-3 bg-white rounded-full shadow-sm group-hover:scale-105 transition-transform">
                         <ImageIcon size={24} strokeWidth={1.5} className="text-[#1e61f0] opacity-50" />
                      </div>
                      <div className="text-[11px] text-center px-4 leading-tight font-medium text-slate-400 group-hover:text-[#1e61f0] transition-colors">Drag image(s) here or <br /><span className="text-[#1e61f0] font-bold">Browse images</span></div>
                   </>
                 )}
              </div>
              {newItem.imageUrl && (
                <button 
                  type="button" 
                  onClick={(e) => { e.stopPropagation(); setNewItem({...newItem, imageUrl: ''}); }}
                  className="mt-2 text-rose-500 text-[11px] font-bold hover:underline uppercase tracking-widest"
                >
                  Remove
                </button>
              )}
           </div>
        </div>

        {/* ─ Sales Information ─ */}
        <div className="pt-6 border-t border-slate-100">
           <div className="flex items-center gap-3 group cursor-pointer mb-6">
              <input type="checkbox" checked={newItem.salesInformation} onChange={(e) => setNewItem({...newItem, salesInformation: e.target.checked})} className="w-4 h-4 accent-[#1e61f0] rounded transition-all" />
              <span className="text-[14px] font-bold text-slate-800 group-hover:text-[#1e61f0]">Sales Information</span>
           </div>
           
           {newItem.salesInformation && (
              <div className="grid grid-cols-2 gap-x-16 gap-y-6">
                 <div className="space-y-6">
                    <div className="flex items-center gap-6 text-[13px]">
                       <label className="w-24 text-[#ff3333] font-medium border-b border-dashed border-slate-200 pb-0.5">Selling Price*</label>
                       <div className="flex-1 flex border border-slate-200 rounded-md overflow-hidden focus-within:border-[#1e61f0] transition-all">
                          <div className="px-3 py-2 bg-slate-50 border-r border-slate-100 text-[12px] text-slate-400 font-bold">INR</div>
                          <input type="number" required value={newItem.sellingPrice} onChange={e => setNewItem({...newItem, sellingPrice: e.target.value})} className="flex-1 px-3 py-2 outline-none font-medium text-slate-700" />
                       </div>
                    </div>
                    <div className="flex items-start gap-6 text-[13px]">
                       <label className="w-24 text-slate-500 font-medium mt-2">Description</label>
                       <textarea value={newItem.salesDescription} onChange={e => setNewItem({...newItem, salesDescription: e.target.value})} className="flex-1 border border-slate-200 rounded-md px-3 py-2 h-16 outline-none focus:border-[#1e61f0] text-[#444] text-[13px] resize-none" />
                    </div>
                 </div>
                 
                 <div className="space-y-6">
                    <div className="flex items-center gap-6 text-[13px]">
                       <label className="w-24 text-[#ff3333] font-medium border-b border-dashed border-slate-200 pb-0.5">Account*</label>
                       <div className="flex-1 relative" ref={salesAccountDropdownRef}>
                          <div onClick={() => setIsSalesAccountOpen(!isSalesAccountOpen)} className={`flex items-center justify-between border ${isSalesAccountOpen ? 'border-[#1e61f0] ring-1 ring-[#1e61f0]' : 'border-slate-200'} rounded-md px-3 py-2 text-[14px] cursor-pointer bg-white transition-all`} >
                             <span className="text-slate-700">{newItem.salesAccount}</span>
                             {isSalesAccountOpen ? <ChevronUp size={16} className="text-[#1e61f0]"/> : <ChevronDown size={14} className="text-slate-400"/>}
                          </div>
                          {isSalesAccountOpen && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 shadow-2xl rounded-lg z-[60] overflow-hidden">
                               <div className="p-1.5 border-b border-slate-50"><div className="relative"><Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input autoFocus placeholder="Search accounts" value={salesAccountSearch} onChange={(e) => setSalesAccountSearch(e.target.value)} className="w-full pl-8 pr-4 py-1.5 text-[12px] outline-none bg-slate-50/50 rounded-md" /></div></div>
                               <div className="max-h-[250px] overflow-y-auto py-1 custom-scrollbar">
                                  {filteredSalesAccounts.map((group) => (
                                    <div key={group.category}>
                                       <div className="px-3 py-1.5 text-[10px] font-bold text-slate-700 uppercase tracking-widest bg-slate-50/50">{group.category}</div>
                                       {group.accounts.map(acc => (
                                          <div key={acc} onClick={() => handleSalesAccountSelect(acc)} className={`flex items-center justify-between px-6 py-2 text-[13px] cursor-pointer ${newItem.salesAccount === acc ? 'bg-[#1e61f0] text-white' : 'text-slate-600 hover:bg-slate-50'}`} >
                                             <span>{acc}</span>{newItem.salesAccount === acc && <Check size={12} className="text-white"/>}
                                          </div>
                                       ))}
                                    </div>
                                  ))}
                               </div>
                            </div>
                          )}
                       </div>
                    </div>
                 </div>
              </div>
           )}
        </div>

        {/* ─ Purchase Information ─ */}
        <div className="pt-6 border-t border-slate-100">
           <div className="flex items-center gap-3 group cursor-pointer mb-6">
              <input type="checkbox" checked={newItem.purchaseInformation} onChange={(e) => setNewItem({...newItem, purchaseInformation: e.target.checked})} className="w-4 h-4 accent-[#1e61f0] rounded transition-all" />
              <span className="text-[14px] font-bold text-slate-800 group-hover:text-[#1e61f0]">Purchase Information</span>
           </div>
           
           {newItem.purchaseInformation && (
              <div className="grid grid-cols-2 gap-x-16 gap-y-6">
                 <div className="space-y-6">
                    <div className="flex items-center gap-6 text-[13px]">
                       <label className="w-24 text-[#ff3333] font-medium border-b border-dashed border-slate-200 pb-0.5">Cost Price*</label>
                       <div className="flex-1 flex border border-slate-200 rounded-md overflow-hidden focus-within:border-[#1e61f0] transition-all">
                          <div className="px-3 py-2 bg-slate-50 border-r border-slate-100 text-[12px] text-slate-400 font-bold">INR</div>
                          <input type="number" required value={newItem.costPrice} onChange={e => setNewItem({...newItem, costPrice: e.target.value})} className="flex-1 px-3 py-2 outline-none font-medium text-slate-700" />
                       </div>
                    </div>
                    <div className="flex items-start gap-6 text-[13px]">
                       <label className="w-24 text-slate-500 font-medium mt-2">Description</label>
                       <textarea value={newItem.purchaseDescription} onChange={e => setNewItem({...newItem, purchaseDescription: e.target.value})} className="flex-1 border border-slate-200 rounded-md px-3 py-2 h-16 outline-none focus:border-[#1e61f0] text-[#444] text-[13px] resize-none" />
                    </div>
                 </div>
                 
                 <div className="space-y-6">
                    <div className="flex items-center gap-6 text-[13px]">
                       <label className="w-24 text-[#ff3333] font-medium border-b border-dashed border-slate-200 pb-0.5">Account*</label>
                       <div className="flex-1 relative" ref={purchaseAccountDropdownRef}>
                          <div onClick={() => setIsPurchaseAccountOpen(!isPurchaseAccountOpen)} className={`flex items-center justify-between border ${isPurchaseAccountOpen ? 'border-[#1e61f0] ring-1 ring-[#1e61f0]' : 'border-slate-200'} rounded-md px-3 py-2 text-[14px] cursor-pointer bg-white transition-all`} >
                             <span className="text-slate-700">{newItem.purchaseAccount}</span>
                             {isPurchaseAccountOpen ? <ChevronUp size={16} className="text-[#1e61f0]"/> : <ChevronDown size={14} className="text-slate-400"/>}
                          </div>
                          {isPurchaseAccountOpen && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 shadow-2xl rounded-lg z-[60] overflow-hidden">
                               <div className="p-1.5 border-b border-slate-50"><div className="relative"><Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input autoFocus placeholder="Search accounts" value={purchaseAccountSearch} onChange={(e) => setPurchaseAccountSearch(e.target.value)} className="w-full pl-8 pr-4 py-1.5 text-[12px] outline-none bg-slate-50/50 rounded-md" /></div></div>
                               <div className="max-h-[250px] overflow-y-auto py-1 custom-scrollbar">
                                  {filteredPurchaseAccounts.map((group) => (
                                    <div key={group.category}>
                                       <div className="px-3 py-1.5 text-[10px] font-bold text-slate-700 uppercase tracking-widest bg-slate-50/50">{group.category}</div>
                                       {group.accounts.map(acc => (
                                          <div key={acc} onClick={() => handlePurchaseAccountSelect(acc)} className={`flex items-center justify-between px-6 py-2 text-[13px] cursor-pointer ${newItem.purchaseAccount === acc ? 'bg-[#1e61f0] text-white' : 'text-slate-600 hover:bg-slate-50'}`} >
                                             <span>{acc}</span>{newItem.purchaseAccount === acc && <Check size={12} className="text-white"/>}
                                          </div>
                                       ))}
                                    </div>
                                  ))}
                               </div>
                               <div className="p-2 border-t border-slate-100 bg-white sticky bottom-0">
                                  <button onClick={() => openNewAccountModal('Purchase')} type="button" className="flex items-center gap-1.5 text-[#1e61f0] font-medium text-[12px] hover:text-[#1a54d1]">
                                     <Plus size={16} className="bg-blue-50 rounded-full p-0.5" />New Account
                                  </button>
                               </div>
                            </div>
                          )}
                       </div>
                    </div>
                    <div className="flex items-center gap-6 text-[13px]">
                       <label className="w-24 text-slate-500 font-medium">Vendor</label>
                       <select value={newItem.preferredVendor} onChange={e => setNewItem({...newItem, preferredVendor: e.target.value})} className="flex-1 border border-slate-200 rounded-md px-3 py-2 text-slate-400 outline-none focus:border-[#1e61f0] appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C/polyline%3E%3C/svg%3E')] bg-[length:14px] bg-[right_10px_center] bg-no-repeat transition-all focus:text-slate-900 focus:border-[#1e61f0]">
                          <option>Select Vendor</option>
                       </select>
                    </div>
                 </div>
              </div>
           )}
        </div>

        <div className="flex gap-2 pt-8">
           <button type="submit" disabled={loading} className="px-5 py-2 bg-[#1e61f0] text-white rounded-md text-[13px] font-bold hover:bg-[#1a54d1] transition-all disabled:opacity-50">
              {loading ? 'Saving...' : 'Save'}
           </button>
           <button type="button" onClick={onCancel} className="px-5 py-2 bg-slate-100 border border-slate-200 text-slate-600 rounded-md text-[13px] font-bold hover:bg-slate-200 transition-all">
              Cancel
           </button>
        </div>
      </form>
    </div>
  );
};

export default ItemEntryView;
