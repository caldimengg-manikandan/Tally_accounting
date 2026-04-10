import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, Trash2, ShoppingBag, PlusCircle, 
  ChevronDown, Search, Filter, MoreHorizontal,
  Clock, CheckCircle2, XCircle, Send,
  User, MapPin, Calendar, CreditCard, Truck,
  FileText, Tag, Link, Info, ArrowLeft,
  Save, Send as SendIcon, UploadCloud, GripVertical, Paperclip,
  Image as ImageIcon, LayoutGrid
} from 'lucide-react';
import { purchaseAPI, inventoryAPI, companyAPI } from '../../services/api';
import ConfigurePaymentTermsModal from './ConfigurePaymentTermsModal';
import CreateAccountModal from './CreateAccountModal';

const PurchaseOrderEntryView = ({ companyId }) => {
  // ── Form State ──────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    vendorName: '',
    vendorId: '',
    deliveryAddress: 'Organization',
    deliveryAddressText: 'No. 42, Innovation Hub,\nBangalore, Karnataka, 560001\nIndia',
    poNumber: 'PO-' + Math.floor(10000 + Math.random() * 90000),
    reference: '',
    date: new Date().toISOString().split('T')[0],
    deliveryDate: '',
    paymentTerms: 'Due on Receipt',
    shipmentPreference: '',
    notes: '',
    terms: '',
    discount: 0,
    adjustment: 0,
    taxType: 'GST',
    taxRate: 0,
    tags: []
  });

  const [items, setItems] = useState([
    { id: Date.now(), itemName: '', account: '', qty: 1, rate: 0, amount: 0 }
  ]);

  // ── Search & Dropdown State ─────────────────────────────────────
  const [vendors, setVendors] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [isVendorDropdownOpen, setIsVendorDropdownOpen] = useState(false);
  const [vendorSearch, setVendorSearch] = useState('');
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [activeRowForAccount, setActiveRowForAccount] = useState(null);
  const [accountGroups, setAccountGroups] = useState([
    { category: 'Other Current Asset', accounts: ['Advance Tax', 'Employee Advance', 'Prepaid Expenses', 'TDS Receivable'] },
    { category: 'Other Current Liability', accounts: ['Opening Balance Adjustments', 'Tax Payable', 'TDS Payable', 'Unearned Revenue'] },
    { category: 'Equity', accounts: ['Capital Stock', 'Distributions', 'Dividends Paid', 'Drawings', 'Investments', 'Opening Balance Offset', "Owner's Equity"] },
    { category: 'Expense', accounts: ['Bad Debt', 'Bank Fees and Charges', 'Consultant Expense', 'Contract Assets', 'Credit Card Charges', 'Depreciation And Amortisation', 'Depreciation Expense', 'IT and Internet Expense', 'Janitorial Expense', 'Lodging', 'Meals and Entertainment', 'Merchandise', 'Office Supplies', 'Other Expenses', 'Postage', 'Printing and Stationery', 'Purchase Discounts', 'Raw Materials And Consumables', 'Rent Expense', 'Repairs and Maintenance', 'Salaries and Employee Wages', 'Telephone Expense', 'Transportation Expense', 'Travel Expense', 'Uncategorized'] },
    { category: 'Cost Of Goods Sold', accounts: ['[ tryhgtrjh ] 24325', 'Cost of Goods Sold', 'Job Costing', 'Labor', 'Materials', 'Subcontractor'] },
    { category: 'Other Asset', accounts: ['Stock', 'Inventory Asset'] },
  ]);
  const [openAccountDropdown, setOpenAccountDropdown] = useState(null);
  const accountDropdownRef = useRef(null);
  const vendorDropdownRef = useRef(null);
  const fileInputRef = useRef(null);
  const attachmentRef = useRef(null);
  const [attachments, setAttachments] = useState([]);
  const [isAttachmentListOpen, setIsAttachmentListOpen] = useState(false);
  
  // ── Context Data ────────────────────────────────────────────────
  useEffect(() => {
    if (companyId) {
      purchaseAPI.getVendors(companyId).then(res => setVendors(res.data || []));
      inventoryAPI.getByCompany(companyId).then(res => setInventoryItems(res.data || []));
    }
  }, [companyId]);

  // ── Outside Click Logic ─────────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (vendorDropdownRef.current && !vendorDropdownRef.current.contains(event.target)) {
        setIsVendorDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Account Dropdown Outside Click ──────────────────────────────
  useEffect(() => {
    const handleAccountClickOutside = (event) => {
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(event.target)) {
        setOpenAccountDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleAccountClickOutside);
    return () => document.removeEventListener('mousedown', handleAccountClickOutside);
  }, []);

  // ── Attachment Dropdown Outside Click ───────────────────────────
  useEffect(() => {
    const handleAttachmentClickOutside = (event) => {
      if (attachmentRef.current && !attachmentRef.current.contains(event.target)) {
        setIsAttachmentListOpen(false);
      }
    };
    document.addEventListener('mousedown', handleAttachmentClickOutside);
    return () => document.removeEventListener('mousedown', handleAttachmentClickOutside);
  }, []);

  // ── Calculations ────────────────────────────────────────────────
  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + (item.qty * item.rate), 0);
    const discountAmount = (subtotal * (formData.discount / 100));
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = (taxableAmount * (formData.taxRate / 100));
    const total = taxableAmount + taxAmount + parseFloat(formData.adjustment || 0);

    return {
      subtotal,
      discountAmount,
      taxAmount,
      total
    };
  }, [items, formData.discount, formData.taxRate, formData.adjustment]);

  // ── Handlers ────────────────────────────────────────────────────
  const handleItemChange = (id, field, value) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value, amount: field === 'qty' ? value * item.rate : field === 'rate' ? value * item.qty : item.amount } : item
    ));
  };

  const addItem = () => {
    setItems([...items, { id: Date.now(), itemName: '', account: '', qty: 1, rate: 0, amount: 0 }]);
  };

  const removeItem = (id) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const filteredVendors = vendors.filter(v => 
    v.name?.toLowerCase().includes(vendorSearch.toLowerCase())
  );

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const newAttachments = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
      size: (file.size / 1024).toFixed(1) + ' KB',
      type: file.type
    }));
    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const removeAttachment = (id) => {
    setAttachments(prev => {
      const filtered = prev.filter(att => att.id !== id);
      if (filtered.length === 0) setIsAttachmentListOpen(false);
      return filtered;
    });
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen pb-32">
       {/* ─── Top Navigation ────────────────────────────────────────── */}
       <div className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-40">
          <div className="max-w-[1600px] mx-auto flex items-center justify-between">
             <div className="flex items-center gap-4">
                <button 
                  onClick={() => window.history.back()}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all"
                >
                   <ArrowLeft size={20} />
                </button>
                <div>
                   <h1 className="text-[18px] font-black text-slate-900 tracking-tight">New Purchase Order</h1>
                   <div className="flex items-center gap-2 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Drafting Mode • Auto-saved</span>
                   </div>
                </div>
             </div>
             <div className="flex items-center gap-3">
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl font-black text-[13px] flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20 active:scale-95">
                   <SendIcon size={14} strokeWidth={3} />
                   Save & Send
                </button>
             </div>
          </div>
       </div>

       <div className="max-w-[1600px] mx-auto px-8 py-2">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 items-start">
             
             {/* ─── Left Column (Form) ─────────────────────────────────── */}
             <div className="space-y-3">
                
                {/* 1. Vendor & Delivery Address */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden group">
                   <div className="p-3 px-6 border-b border-slate-50 bg-slate-50/30">
                      <div className="flex items-center gap-2">
                         <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <User size={16} />
                         </div>
                         <h2 className="text-[13px] font-black text-slate-900 uppercase tracking-tight">Vendor & Delivery</h2>
                      </div>
                   </div>
                   
                   <div className="p-4 space-y-4">
                      {/* Vendor Selection */}
                      <div className="grid grid-cols-1 gap-4">
                         <div className="relative" ref={vendorDropdownRef}>
                            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1.5 ml-1">Vendor Name <span className="text-red-500">*</span></label>
                            <div className="relative">
                               <input 
                                 type="text"
                                 placeholder="Search or select a vendor"
                                 value={formData.vendorName || vendorSearch}
                                 onChange={(e) => {
                                    setVendorSearch(e.target.value);
                                    setIsVendorDropdownOpen(true);
                                 }}
                                 onFocus={() => setIsVendorDropdownOpen(true)}
                                 className="w-full h-10 pl-10 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold text-slate-900 focus:bg-white focus:border-indigo-600 transition-all outline-none"
                               />
                               <Search size={16} className="absolute left-3.5 top-3 text-slate-300" />
                               <ChevronDown 
                                 size={16} 
                                 onClick={(e) => {
                                    e.stopPropagation();
                                    setIsVendorDropdownOpen(!isVendorDropdownOpen);
                                 }}
                                 className={`absolute right-3.5 top-3 text-slate-300 cursor-pointer transition-transform duration-300 ${isVendorDropdownOpen ? 'rotate-180 text-indigo-600' : ''}`} 
                               />
                            </div>

                            {isVendorDropdownOpen && (
                               <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 origin-top">
                                  <div className="max-h-[200px] overflow-y-auto py-1 custom-scrollbar">
                                     {filteredVendors.length > 0 ? (
                                        filteredVendors.map(vendor => (
                                           <div 
                                              key={vendor.id}
                                              onClick={() => {
                                                 setFormData({ ...formData, vendorId: vendor.id, vendorName: vendor.name });
                                                 setVendorSearch('');
                                                 setIsVendorDropdownOpen(false);
                                              }}
                                              className="px-4 py-2 hover:bg-slate-50 cursor-pointer flex items-center gap-3 transition-colors"
                                           >
                                              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                                                 <User size={14} />
                                              </div>
                                              <div>
                                                 <div className="text-[12px] font-black text-slate-700">{vendor.name}</div>
                                              </div>
                                           </div>
                                        ))
                                     ) : (
                                        <div className="px-6 py-4 text-center">
                                           <div className="text-[12px] font-bold text-slate-500">No vendors found.</div>
                                        </div>
                                     )}
                                  </div>
                               </div>
                            )}

                            <div className="flex items-center gap-4 mt-3">
                               <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-100">
                                  {['Organization', 'Customer'].map(type => (
                                     <button 
                                       key={type}
                                       type="button"
                                       onClick={() => setFormData({ ...formData, deliveryAddress: type })}
                                       className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${formData.deliveryAddress === type ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-600'}`}
                                     >
                                        {type}
                                     </button>
                                  ))}
                               </div>
                            </div>
                         </div>

                         {/* Delivery Address Textarea */}
                         <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                             <div className="flex items-center gap-2 mb-2">
                                <MapPin size={14} className="text-slate-400" />
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Delivery Address</span>
                             </div>
                             <textarea 
                               value={formData.deliveryAddressText}
                               onChange={(e) => setFormData({ ...formData, deliveryAddressText: e.target.value })}
                               className="w-full p-3 bg-white border border-slate-200 rounded-xl text-[12px] font-medium text-slate-900 focus:border-indigo-600 transition-all outline-none resize-none"
                               rows={2}
                             ></textarea>
                         </div>
                      </div>
                   </div>
                </div>

                {/* 2. Order Details */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden group">
                   <div className="p-3 px-6 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                         <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <FileText size={16} />
                         </div>
                         <h2 className="text-[13px] font-black text-slate-900 uppercase tracking-tight">Order Details</h2>
                      </div>
                   </div>
                   
                   <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                         <div>
                            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1.5 ml-1">PO No <span className="text-red-500">*</span></label>
                            <input 
                              type="text"
                              value={formData.poNumber}
                              onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
                              className="w-full h-10 px-4 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-black text-slate-900 focus:bg-white focus:border-indigo-600 transition-all outline-none"
                            />
                         </div>
                         <div>
                            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1.5 ml-1">Reference#</label>
                            <input 
                              type="text"
                              placeholder="Optional"
                              value={formData.reference}
                              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                              className="w-full h-10 px-4 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold text-slate-900 focus:bg-white focus:border-indigo-600 transition-all outline-none"
                            />
                         </div>
                         <div>
                            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1.5 ml-1">Order Date</label>
                            <div className="relative">
                               <input 
                                 type="date"
                                 value={formData.date}
                                 onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                 className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold text-slate-900 focus:bg-white focus:border-indigo-600 transition-all outline-none"
                               />
                               <Calendar size={16} className="absolute left-3.5 top-3 text-slate-300" />
                            </div>
                         </div>
                         <div>
                            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1.5 ml-1">Delivery Date</label>
                            <div className="relative">
                               <input 
                                 type="date"
                                 value={formData.deliveryDate}
                                 onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                                 className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold text-slate-900 focus:bg-white focus:border-indigo-600 transition-all outline-none"
                               />
                               <Calendar size={16} className="absolute left-3.5 top-3 text-slate-300" />
                            </div>
                         </div>
                         <div className="md:col-span-2">
                            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1.5 ml-1">Payment Terms</label>
                            <div className="relative">
                               <select 
                                 value={formData.paymentTerms}
                                 onChange={(e) => {
                                    if (e.target.value === "Configure Terms") {
                                       setIsTermsModalOpen(true);
                                    } else {
                                       setFormData({ ...formData, paymentTerms: e.target.value });
                                    }
                                 }}
                                 className="w-full h-10 pl-10 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold text-slate-900 focus:bg-white focus:border-indigo-600 transition-all outline-none appearance-none"
                               >
                               {['Due end of next month', 'Due end of the month', 'Due on Receipt', 'Net 15', 'Net 30', 'Net 45', 'Net 60'].map(term => (
                                  <option key={term} value={term}>{term}</option>
                               ))}
                               <option disabled>──────────</option>
                               <option value="Configure Terms">⚙️ Configure Terms</option>
                            </select>
                            <CreditCard size={16} className="absolute left-3.5 top-3 text-slate-300" />
                            <ChevronDown size={16} className="absolute right-3.5 top-3 text-slate-300 pointer-events-none" />
                            </div>
                         </div>
                    </div>
                 </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm group overflow-visible">
                   <div className="p-3 px-6 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                         <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <ShoppingBag size={16} />
                         </div>
                         <h2 className="text-[13px] font-black text-slate-900 uppercase tracking-tight">Item Table</h2>
                      </div>
                   </div>
                   
                   <div className="bg-slate-50/50 border-b border-slate-100 py-2.5 px-3">
                      <div className="flex items-center gap-3">
                         <div className="w-[18px]"></div> {/* Spacer for grip */}
                         <div className="flex-1 grid grid-cols-[2fr_1.5fr_0.8fr_1fr_1.2fr] items-center">
                            <div className="px-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Item Details</div>
                            <div className="px-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-l border-slate-200">Account</div>
                            <div className="px-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-l border-slate-200 text-center">Quantity</div>
                            <div className="px-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-l border-slate-200 flex items-center justify-end gap-1.5">
                               <span>Rate</span> 
                               <LayoutGrid size={12} className="text-slate-400" />
                            </div>
                            <div className="px-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-l border-slate-200 text-right">Amount</div>
                         </div>
                         <div className="w-10"></div> {/* Spacer for delete */}
                      </div>
                   </div>

                   <div className="p-3 space-y-2 bg-white min-h-[200px]">
                      {items.map((item, index) => (
                         <div key={item.id} className="bg-white hover:bg-slate-50/50 rounded-xl border border-slate-100 flex items-center gap-3 group/row transition-all py-1">
                            <div className="cursor-grab text-slate-200 hover:text-slate-400 transition-colors pl-2">
                               <GripVertical size={18} />
                            </div>
                            
                            <div className="flex-1 grid grid-cols-[2fr_1.5fr_0.8fr_1fr_1.2fr] items-stretch">
                               {/* Item Details */}
                               <div className="px-2">
                                  <input 
                                    type="text"
                                    placeholder="Select or type item"
                                    value={item.itemName}
                                    onChange={(e) => handleItemChange(item.id, 'itemName', e.target.value)}
                                    className="w-full h-9 px-3 bg-transparent border-0 text-[12px] font-bold text-slate-900 focus:bg-white focus:ring-1 focus:ring-indigo-400 rounded-lg transition-all outline-none"
                                  />
                               </div>

                               {/* Account */}
                               <div className="relative px-2 border-l border-slate-100" ref={openAccountDropdown === item.id ? accountDropdownRef : null}>
                                  <div 
                                    onClick={() => setOpenAccountDropdown(openAccountDropdown === item.id ? null : item.id)}
                                    className={`w-full h-9 px-3 flex items-center justify-between text-[12px] font-bold transition-all rounded-lg border border-transparent hover:border-slate-200 hover:bg-slate-50/50 ${openAccountDropdown === item.id ? 'bg-white ring-1 ring-indigo-400 border-indigo-400 text-slate-900 shadow-sm' : 'text-slate-900'}`}
                                  >
                                     <span className={item.account ? 'text-slate-900 truncate' : 'text-slate-400'}>{item.account || 'Choose account'}</span>
                                     <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${openAccountDropdown === item.id ? 'rotate-180' : ''}`} />
                                  </div>
                                  
                                  {openAccountDropdown === item.id && (
                                     <div className="absolute top-full left-2 right-2 mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-[100] overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-200" style={{minWidth: '240px'}}>
                                        <div className="max-h-[280px] overflow-y-auto py-1 custom-scrollbar">
                                           {accountGroups.map(group => (
                                              <div key={group.category}>
                                                 <div className="px-4 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-50/80 sticky top-0">{group.category}</div>
                                                 {group.accounts.map(acc => (
                                                    <div 
                                                      key={acc}
                                                      onClick={() => {
                                                         handleItemChange(item.id, 'account', acc);
                                                         setOpenAccountDropdown(null);
                                                      }}
                                                      className={`px-6 py-2 text-[13px] font-medium cursor-pointer transition-colors ${item.account === acc ? 'bg-indigo-500 text-white font-bold' : 'text-slate-700 hover:bg-slate-50'}`}
                                                    >
                                                       {acc}
                                                    </div>
                                                 ))}
                                              </div>
                                           ))}
                                        </div>
                                        <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-2.5 sticky bottom-0">
                                           <button 
                                             type="button"
                                             onClick={() => {
                                                setActiveRowForAccount(item.id);
                                                setIsAccountModalOpen(true);
                                                setOpenAccountDropdown(null);
                                             }}
                                             className="flex items-center gap-2 text-[13px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors w-full"
                                           >
                                              <PlusCircle size={16} />
                                              <span>New Account</span>
                                           </button>
                                        </div>
                                     </div>
                                  )}
                               </div>

                               {/* Quantity */}
                               <div className="px-2 border-l border-slate-100 flex items-center">
                                  <input 
                                    type="number"
                                    value={item.qty}
                                    onChange={(e) => handleItemChange(item.id, 'qty', e.target.value)}
                                    className="w-full h-9 bg-transparent border-0 text-[12px] font-black text-slate-900 text-center focus:bg-white focus:ring-1 focus:ring-indigo-400 rounded-lg transition-all outline-none"
                                  />
                               </div>

                               {/* Rate */}
                               <div className="px-2 border-l border-slate-100 flex items-center">
                                  <input 
                                    type="number"
                                    value={item.rate}
                                    onChange={(e) => handleItemChange(item.id, 'rate', e.target.value)}
                                    className="w-full h-9 bg-transparent border-0 text-[12px] font-black text-slate-900 text-right focus:bg-white focus:ring-1 focus:ring-indigo-400 rounded-lg transition-all outline-none"
                                  />
                               </div>

                               {/* Amount */}
                               <div className="px-3 border-l border-slate-100 flex items-center justify-end">
                                  <div className="text-[13px] font-black text-slate-900">
                                     ₹ {(item.qty * item.rate).toLocaleString()}
                                  </div>
                               </div>
                            </div>

                            <button 
                              onClick={() => removeItem(item.id)}
                              className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-200 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover/row:opacity-100"
                            >
                               <Trash2 size={18} />
                            </button>
                         </div>
                      ))}

                      {/* Add Item Button - Below Items */}
                      {items.length > 0 && (
                         <button 
                           onClick={addItem}
                           className="w-full py-2 bg-white border border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 rounded-xl transition-all flex items-center justify-center gap-2 text-[12px] font-black text-indigo-600"
                         >
                            <PlusCircle size={14} />
                            <span>ADD NEW ITEM</span>
                         </button>
                      )}

                      {items.length === 0 && (
                         <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[32px] border border-dashed border-slate-200 animate-in fade-in zoom-in duration-500">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                               <ShoppingBag size={32} />
                            </div>
                            <p className="text-slate-400 font-bold text-[14px]">Add items to your purchase order</p>
                            <button 
                               onClick={addItem}
                               className="mt-4 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-[13px] hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
                            >
                               + Add First Item
                            </button>
                         </div>
                      )}
                   </div>
                </div>

                {/* 4. Upload Files */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-visible">
                    <div className="p-4 py-5">
                       <h2 className="text-[12px] font-bold text-slate-500 mb-3 ml-0.5">Attach File(s) to Purchase Order</h2>
                       
                       <input 
                         type="file" 
                         ref={fileInputRef} 
                         onChange={handleFileChange} 
                         className="hidden" 
                         multiple 
                       />

                       <div className="flex items-center gap-2 relative" ref={attachmentRef}>
                          <div className="flex items-center">
                             <button 
                               type="button"
                               onClick={() => fileInputRef.current?.click()}
                               className="flex items-center gap-2 px-4 h-9 bg-white border border-dashed border-slate-300 rounded-lg hover:border-indigo-400 hover:bg-indigo-50/10 transition-all text-[12px] font-black text-slate-600 group"
                             >
                                <UploadCloud size={14} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                                <span>Upload File</span>
                             </button>
                          </div>

                          <button 
                            type="button"
                            onClick={() => setIsAttachmentListOpen(!isAttachmentListOpen)}
                            className={`flex items-center gap-1.5 px-3 h-9 rounded-lg transition-all ${attachments.length > 0 ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-100 text-slate-400 pointer-events-none'}`}
                          >
                             <Paperclip size={14} strokeWidth={3} />
                             <span className="text-[13px] font-black">{attachments.length}</span>
                          </button>

                          {isAttachmentListOpen && attachments.length > 0 && (
                             <div className="absolute top-[calc(100%+8px)] left-0 w-[400px] bg-white border border-slate-200 rounded-xl shadow-2xl z-[100] animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
                                <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-1">
                                   {attachments.map(att => (
                                      <div key={att.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg group/item transition-colors">
                                         <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-sm">
                                               {att.type.startsWith('image/') ? <ImageIcon size={20} /> : <FileText size={20} />}
                                            </div>
                                            <div>
                                               <div className="text-[12px] font-black text-slate-900 truncate max-w-[200px]">{att.name}</div>
                                               <div className="text-[10px] font-bold text-slate-400">File Size: {att.size}</div>
                                            </div>
                                         </div>
                                         <button 
                                           onClick={(e) => {
                                              e.stopPropagation();
                                              removeAttachment(att.id);
                                           }}
                                           className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover/item:opacity-100"
                                         >
                                            <Trash2 size={16} />
                                         </button>
                                      </div>
                                   ))}
                                </div>
                             </div>
                          )}
                       </div>

                       <div className="mt-4 space-y-2">
                          <label className="flex items-center gap-2 cursor-pointer group">
                             <input type="checkbox" className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                             <span className="text-[11px] font-bold text-slate-600 group-hover:text-slate-900 transition-colors">Display attachments in vendor portal and emails</span>
                          </label>
                          <p className="text-[10px] font-bold text-slate-500 italic mt-1.5 ml-0.5">Max 5 files, 10MB each</p>
                       </div>
                    </div>
                </div>

             </div>

             {/* ─── Right Column (Sticky Summary) ────────────────────── */}
             <div className="lg:sticky lg:top-24 space-y-3">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-xl shadow-indigo-900/5 overflow-hidden relative">
                   <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-600"></div>
                   
                   <div className="p-4">
                      <div className="flex items-center gap-2 mb-4">
                         <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <CreditCard size={18} />
                         </div>
                         <h2 className="text-[14px] font-black text-slate-900 uppercase tracking-tight">Summary</h2>
                      </div>

                      <div className="space-y-2.5">
                         <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Subtotal</span>
                            <span className="font-black text-slate-900 text-[13px]">₹ {totals.subtotal.toLocaleString()}</span>
                         </div>

                         <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                               <span className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Disc</span>
                               <input 
                                 type="number"
                                 value={formData.discount}
                                 onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                                 className="w-12 h-7 px-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[11px] font-black text-slate-900 text-center outline-none"
                               />
                               <span className="text-[10px] font-black text-slate-400">%</span>
                            </div>
                            <span className="font-black text-red-500 text-[13px]">- ₹ {totals.discountAmount.toLocaleString()}</span>
                         </div>

                         <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                               <select 
                                 value={formData.taxType}
                                 onChange={(e) => setFormData({ ...formData, taxType: e.target.value })}
                                 className="h-7 px-1 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-black text-slate-900 uppercase outline-none"
                               >
                                  <option value="GST">GST</option>
                                  <option value="TDS">TDS</option>
                                  <option value="TCS">TCS</option>
                               </select>
                               <input 
                                 type="number"
                                 value={formData.taxRate}
                                 onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                                 className="w-12 h-7 px-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[11px] font-black text-slate-900 text-center outline-none"
                               />
                               <span className="text-[10px] font-black text-slate-400">%</span>
                            </div>
                            <span className="font-black text-slate-900 text-[13px]">+ ₹ {totals.taxAmount.toLocaleString()}</span>
                         </div>

                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                               <span className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Adjustment</span>
                               <input 
                                 type="number"
                                 value={formData.adjustment}
                                 onChange={(e) => setFormData({ ...formData, adjustment: e.target.value })}
                                 className="w-16 h-7 px-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[11px] font-black text-slate-900 text-right outline-none"
                               />
                            </div>
                            <span className="font-black text-slate-900 text-[13px]">₹ {parseFloat(formData.adjustment || 0).toLocaleString()}</span>
                         </div>

                         <div className="pt-4 mt-4 border-t border-slate-50">
                            <div className="flex items-center justify-between">
                               <span className="font-black text-indigo-600 uppercase tracking-widest text-[11px]">Total</span>
                               <span className="text-[20px] font-black text-slate-900 tracking-tighter">₹ {totals.total.toLocaleString()}</span>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="flex items-center justify-center gap-2 py-3 px-6 bg-indigo-50/50 rounded-xl border border-indigo-100">
                   <Clock size={14} className="text-indigo-600" />
                   <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Auto-saving...</span>
                </div>
             </div>

          </div>
       </div>

       {/* ─── Sticky Bottom Action Bar ──────────────────────────────── */}
       <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-100 px-8 py-3 z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
          <div className="max-w-[1600px] mx-auto flex items-center justify-between">
             <div className="flex items-center gap-4">
                <button 
                  onClick={() => window.history.back()}
                  className="px-4 py-2 rounded-lg text-[12px] font-black text-slate-500 hover:text-slate-900 transition-all flex items-center gap-2"
                >
                   CANCEL
                </button>
                <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Progress saved</span>
                </div>
             </div>
             <div className="flex items-center gap-3">
                <button className="px-5 py-2.5 rounded-xl text-[13px] font-black text-indigo-600 border-2 border-indigo-50 hover:border-indigo-600 transition-all active:scale-95">
                   SAVE DRAFT
                </button>
                <button className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[13px] font-black flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 group">
                   <SendIcon size={16} />
                   SAVE & SEND
                </button>
             </div>
          </div>
       </div>

       {isTermsModalOpen && (
          <ConfigurePaymentTermsModal 
            onClose={() => setIsTermsModalOpen(false)}
            onSave={(updatedTerms) => {
               // Logic to persist terms could go here
               console.log("Updated terms:", updatedTerms);
               setIsTermsModalOpen(false);
            }}
          />
       )}
       {isAccountModalOpen && (
          <CreateAccountModal 
            onClose={() => setIsAccountModalOpen(false)}
            onSave={(newAcc) => {
               // Add the new account to the matching category group, or create a new group
               setAccountGroups(prev => {
                  const groupIndex = prev.findIndex(g => g.category === newAcc.category);
                  if (groupIndex >= 0) {
                     const updated = [...prev];
                     updated[groupIndex] = {
                        ...updated[groupIndex],
                        accounts: [...updated[groupIndex].accounts, newAcc.name]
                     };
                     return updated;
                  } else {
                     return [...prev, { category: newAcc.category, accounts: [newAcc.name] }];
                  }
               });
               if (activeRowForAccount) {
                  handleItemChange(activeRowForAccount, 'account', newAcc.name);
               }
               setIsAccountModalOpen(false);
            }}
          />
       )}
    </div>
  );
};

export default PurchaseOrderEntryView;
