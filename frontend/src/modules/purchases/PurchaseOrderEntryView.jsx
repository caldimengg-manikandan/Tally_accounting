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

  return (
    <div className="bg-white min-h-screen text-[13px] text-slate-800 font-medium pb-24">
       {/* ─── Top Bar ──────────────────────────────────────────────── */}
       <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
             <ShoppingBag size={20} className="text-slate-800" />
             <h1 className="text-[18px] text-slate-800">New Purchase Order</h1>
          </div>
          <button 
            onClick={() => window.history.back()}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
             <X size={20} />
          </button>
       </div>

       <div className="flex">
          {/* ─── Main Form Area ───────────────────────────────────── */}
          <div className="flex-1 px-8 py-6 max-w-[1200px]">
             
             {/* Form Grid */}
             <div className="grid grid-cols-[180px_1fr] gap-y-6 items-start max-w-4xl">
                
                {/* Vendor Name */}
                <label className="text-red-500 pt-2"><span className="text-slate-700">Vendor Name</span>*</label>
                <div className="relative" ref={vendorDropdownRef}>
                   <div className="flex max-w-[400px]">
                      <div className="relative flex-1">
                         <input 
                           type="text"
                           placeholder="Select a Vendor"
                           value={formData.vendorName || vendorSearch}
                           onChange={(e) => {
                              setVendorSearch(e.target.value);
                              setIsVendorDropdownOpen(true);
                           }}
                           onFocus={() => setIsVendorDropdownOpen(true)}
                           className="w-full h-9 px-3 border border-slate-300 rounded-l text-slate-800 focus:border-blue-500 outline-none"
                         />
                         <ChevronDown 
                           size={14} 
                           onClick={(e) => {
                              e.stopPropagation();
                              setIsVendorDropdownOpen(!isVendorDropdownOpen);
                           }}
                           className="absolute right-3 top-2.5 text-slate-400 cursor-pointer" 
                         />
                      </div>
                      <button className="h-9 w-9 bg-blue-600 text-white rounded-r flex items-center justify-center hover:bg-blue-700 transition-colors border-y border-r border-blue-600">
                         <Search size={14} />
                      </button>
                   </div>
                   {isVendorDropdownOpen && (
                      <div className="absolute top-[calc(100%+4px)] left-0 w-[360px] bg-white border border-slate-200 rounded-md shadow-lg z-50 overflow-hidden">
                         <div className="max-h-[200px] overflow-y-auto py-1">
                            {filteredVendors.length > 0 ? (
                               filteredVendors.map(vendor => (
                                  <div 
                                     key={vendor.id}
                                     onClick={() => {
                                        setFormData({ ...formData, vendorId: vendor.id, vendorName: vendor.name });
                                        setVendorSearch('');
                                        setIsVendorDropdownOpen(false);
                                     }}
                                     className="px-4 py-2 hover:bg-blue-50 text-[13px] text-slate-700 cursor-pointer"
                                  >
                                     {vendor.name}
                                  </div>
                               ))
                            ) : (
                               <div className="px-6 py-4 text-center text-slate-500 text-[12px]">No vendors found.</div>
                            )}
                         </div>
                      </div>
                   )}
                </div>

                {/* Delivery Address */}
                <label className="text-red-500 pt-1"><span className="text-slate-700">Delivery Address</span>*</label>
                <div>
                   <div className="flex items-center gap-6 mb-2">
                      {['Organization', 'Customer'].map(type => (
                         <label key={type} className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="radio" 
                              name="deliveryAddressType"
                              checked={formData.deliveryAddress === type}
                              onChange={() => setFormData({ ...formData, deliveryAddress: type })}
                              className="w-3.5 h-3.5 text-blue-600 border-slate-300 focus:ring-blue-500 disabled:opacity-50"
                            />
                            <span className="text-[13px] text-slate-800">{type}</span>
                         </label>
                      ))}
                   </div>
                   <div className="text-[12px] text-slate-600 space-y-1">
                      <p className="font-medium text-slate-800 flex items-center gap-2">Swathi N <Link size={12} className="text-blue-500 cursor-pointer hover:text-blue-700" /></p>
                      <p>Tamil Nadu</p>
                      <p>India ,</p>
                      <button className="text-blue-500 hover:text-blue-700 hover:underline mt-2 inline-block transition-colors">Change destination to deliver</button>
                   </div>
                </div>

                {/* Purchase Order# */}
                <label className="text-red-500 pt-2"><span className="text-slate-700">Purchase Order#</span>*</label>
                <div className="flex max-w-[280px]">
                   <input 
                     type="text"
                     value={formData.poNumber}
                     onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
                     className="flex-1 h-9 px-3 border border-slate-300 rounded-l text-slate-800 focus:border-blue-500 outline-none"
                   />
                   <button className="h-9 w-9 border border-l-0 border-slate-300 bg-slate-50 text-blue-500 rounded-r flex items-center justify-center hover:bg-slate-100">
                      <Settings size={14} />
                   </button>
                </div>

                {/* Reference# */}
                <label className="text-slate-700 pt-2">Reference#</label>
                <input 
                  type="text"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  className="w-full max-w-[280px] h-9 px-3 border border-slate-300 rounded text-slate-800 focus:border-blue-500 outline-none"
                />

                {/* Date */}
                <label className="text-slate-700 pt-2">Date</label>
                <input 
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full max-w-[280px] h-9 px-3 border border-slate-300 rounded text-slate-800 focus:border-blue-500 outline-none"
                />

                {/* Delivery Date & Payment Terms */}
                <label className="text-slate-700 pt-2">Delivery Date</label>
                <div className="flex items-center gap-6 max-w-2xl">
                   <input 
                     type="date"
                     value={formData.deliveryDate}
                     onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                     className="w-[280px] h-9 px-3 border border-slate-300 rounded text-slate-400 focus:border-blue-500 outline-none"
                   />
                   <div className="flex items-center gap-4">
                      <span className="text-slate-700 min-w-[100px]">Payment Terms</span>
                      <div className="relative w-[280px]">
                         <select 
                           value={formData.paymentTerms}
                           onChange={(e) => {
                              if (e.target.value === "Configure Terms") {
                                 setIsTermsModalOpen(true);
                              } else {
                                 setFormData({ ...formData, paymentTerms: e.target.value });
                              }
                           }}
                           className="w-full h-9 px-3 pr-8 border border-slate-300 rounded text-slate-800 focus:border-blue-500 outline-none appearance-none"
                         >
                            <option value="Due on Receipt">Due on Receipt</option>
                            <option value="Net 15">Net 15</option>
                            <option value="Net 30">Net 30</option>
                            <option disabled>──────────</option>
                            <option value="Configure Terms">Configure Terms</option>
                         </select>
                         <ChevronDown size={14} className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
                      </div>
                   </div>
                </div>

                {/* Shipment Preference */}
                <label className="text-slate-700 pt-2">Shipment Preference</label>
                <div className="relative max-w-[280px]">
                   <select 
                     value={formData.shipmentPreference}
                     onChange={(e) => setFormData({ ...formData, shipmentPreference: e.target.value })}
                     className="w-full h-9 px-3 pr-8 border border-slate-300 rounded text-slate-400 focus:border-blue-500 outline-none appearance-none"
                   >
                      <option value="" disabled>Choose the shipment preference</option>
                   </select>
                   <ChevronDown size={14} className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
                </div>
             </div>

             {/* Transaction Level Divider */}
             <div className="mt-10 mb-2 max-w-[1200px]">
                <button className="flex items-center gap-2 text-slate-600 font-medium hover:text-slate-900">
                   <Settings size={14} className="text-slate-400" />
                   At Transaction Level
                   <ChevronDown size={12} className="text-slate-400" />
                </button>
             </div>

             {/* ─── Item Table ───────────────────────────────────────── */}
             <div className="max-w-[1200px] border border-slate-200 rounded-t-md overflow-hidden bg-white">
                {/* Table Header */}
                <div className="flex items-center bg-slate-50/80 border-b border-slate-200 p-2 px-3">
                   <h3 className="font-bold text-slate-800">Item Table</h3>
                   <div className="ml-auto flex items-center gap-1.5 text-blue-600 font-medium cursor-pointer hover:text-blue-800">
                      <CheckCircle2 size={14} /> <span>Bulk Actions</span>
                   </div>
                </div>

                <div className="grid grid-cols-[2.5fr_2fr_1fr_1fr_1fr_40px] items-center border-b border-slate-200 bg-white">
                   <div className="px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest">ITEM DETAILS</div>
                   <div className="px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center">ACCOUNT</div>
                   <div className="px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">QUANTITY</div>
                   <div className="px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right flex items-center justify-end gap-1">
                      RATE <LayoutGrid size={10} className="text-slate-400"/>
                   </div>
                   <div className="px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">AMOUNT</div>
                   <div></div>
                </div>

                {/* Table Rows */}
                <div className="divide-y divide-slate-100">
                   {items.map((item, index) => (
                      <div key={item.id} className="grid grid-cols-[2.5fr_2fr_1fr_1fr_1fr_40px] items-start hover:bg-slate-50/50 group/row relative min-h-[44px]">
                         
                         {/* Grip handle absolute left */}
                         <div className="absolute left-1 top-2 text-slate-300 opacity-0 group-hover/row:opacity-100 cursor-grab">
                            <GripVertical size={14} />
                         </div>

                         {/* Item Details */}
                         <div className="px-6 py-2">
                            <input 
                              type="text"
                              placeholder="Type or click to select an item."
                              value={item.itemName}
                              onChange={(e) => handleItemChange(item.id, 'itemName', e.target.value)}
                              className="w-full bg-transparent text-[13px] border-b border-transparent focus:border-slate-300 focus:bg-white px-1 py-1 outline-none transition-colors"
                            />
                         </div>

                         {/* Account */}
                         <div className="px-3 py-2 border-l border-slate-100 relative" ref={openAccountDropdown === item.id ? accountDropdownRef : null}>
                            <div 
                              onClick={() => setOpenAccountDropdown(openAccountDropdown === item.id ? null : item.id)}
                              className="w-full flex items-center justify-between text-[13px] cursor-pointer hover:bg-white border-b border-transparent hover:border-slate-300 px-1 py-1"
                            >
                               <span className={item.account ? 'text-slate-800 truncate' : 'text-slate-500'}>{item.account || 'Select an account'}</span>
                               <ChevronDown size={14} className="text-slate-400" />
                            </div>
                            
                            {openAccountDropdown === item.id && (
                               <div className="absolute top-[80%] left-0 w-full bg-white border border-slate-200 shadow-xl z-50">
                                  <div className="max-h-[220px] overflow-y-auto py-1 custom-scrollbar">
                                     {accountGroups.map(group => (
                                        <div key={group.category}>
                                           <div className="px-3 py-1 font-bold text-slate-400 bg-slate-50 text-[11px] uppercase tracking-wider">{group.category}</div>
                                           {group.accounts.map(acc => (
                                              <div 
                                                key={acc}
                                                onClick={() => {
                                                   handleItemChange(item.id, 'account', acc);
                                                   setOpenAccountDropdown(null);
                                                }}
                                                className={`px-4 py-1.5 text-[13px] cursor-pointer hover:bg-blue-600 hover:text-white ${item.account === acc ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-700'}`}
                                              >
                                                 {acc}
                                              </div>
                                           ))}
                                        </div>
                                     ))}
                                  </div>
                               </div>
                            )}
                         </div>

                         {/* Quantity */}
                         <div className="px-3 py-2 border-l border-slate-100">
                            <input 
                              type="number"
                              value={item.qty}
                              onChange={(e) => handleItemChange(item.id, 'qty', e.target.value)}
                              className="w-full bg-transparent text-[13px] text-right border-b border-transparent focus:border-slate-300 focus:bg-white px-1 py-1 outline-none"
                            />
                         </div>

                         {/* Rate */}
                         <div className="px-3 py-2 border-l border-slate-100">
                            <input 
                              type="number"
                              value={item.rate}
                              onChange={(e) => handleItemChange(item.id, 'rate', e.target.value)}
                              className="w-full bg-transparent text-[13px] text-right border-b border-transparent focus:border-slate-300 focus:bg-white px-1 py-1 outline-none"
                            />
                         </div>

                         {/* Amount */}
                         <div className="px-3 py-2 border-l border-slate-100 text-right font-medium py-3 text-slate-800">
                            {Number(item.qty * item.rate).toFixed(2)}
                         </div>

                         {/* Delete */}
                         <div className="flex items-center justify-center pt-2.5">
                            <button 
                              onClick={() => removeItem(item.id)}
                              className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover/row:opacity-100"
                            >
                               <X size={16} strokeWidth={2.5} />
                            </button>
                         </div>
                      </div>
                   ))}
                </div>
             </div>

             {/* Add item rows */}
             <div className="max-w-[1200px] border border-t-0 border-slate-200 bg-white p-3 flex gap-4">
                <button onClick={addItem} className="text-[13px] font-medium text-slate-700 border border-slate-300 px-3 py-1 bg-slate-50 hover:bg-slate-100 rounded shadow-sm">
                   Add Row
                </button>
             </div>

             {/* Summary Calculation Area within flow */}
             <div className="max-w-[1200px] mt-6 flex justify-end">
                <div className="w-[450px] bg-slate-50 border border-slate-200 rounded-md p-4">
                   <div className="space-y-3">
                      <div className="flex justify-between text-slate-600">
                         <span>Sub Total</span>
                         <span className="font-medium text-slate-800">{(totals.subtotal).toFixed(2)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between gap-4">
                         <div className="flex items-center gap-2">
                            <span className="text-slate-600">Discount</span>
                            <div className="flex items-center border border-slate-300 rounded bg-white overflow-hidden h-7">
                               <input 
                                 type="number" 
                                 value={formData.discount}
                                 onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                                 className="w-16 px-2 text-right outline-none text-[13px]" 
                               />
                               <div className="px-2 bg-slate-100 border-l border-slate-300 text-slate-500 font-medium select-none">%</div>
                            </div>
                         </div>
                         <span className="font-medium text-red-500">{(totals.discountAmount).toFixed(2)}</span>
                      </div>

                      <div className="flex justify-between items-center text-slate-600 pt-3 border-t border-slate-200 mt-2">
                         <span className="font-bold text-[15px] text-slate-800">Total ( ₹ )</span>
                         <span className="font-bold text-[15px] text-slate-800">{(totals.total).toFixed(2)}</span>
                      </div>
                   </div>
                </div>
             </div>
             
          </div>

          {/* ─── Right Vertical Action Strip ───────────────────────── */}
          <div className="w-12 border-l border-slate-200 bg-slate-50 flex flex-col items-center py-4 space-y-6">
             <div className="relative group/tip cursor-pointer text-slate-500 hover:text-blue-600">
                <HelpCircle size={18} />
             </div>
             <div className="relative group/tip cursor-pointer text-slate-500 hover:text-blue-600">
                <MessageSquare size={18} />
             </div>
             <div className="relative group/tip cursor-pointer text-slate-500 hover:text-blue-600">
                <History size={18} />
             </div>
             <div className="relative group/tip cursor-pointer text-slate-500 hover:text-blue-600">
                <Settings size={18} />
             </div>
          </div>
       </div>

       {/* ─── Bottom Actions ────────────────────────────────────── */}
       <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] flex items-center justify-between px-8 z-50">
          <div className="flex items-center gap-3">
             <button className="px-4 h-8 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded border border-slate-300 transition-colors">
                Save as Draft
             </button>
             <button className="px-4 h-8 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition-colors shadow-sm">
                Save and Send
             </button>
             <button onClick={() => window.history.back()} className="px-4 h-8 bg-white hover:bg-slate-50 text-slate-600 font-medium rounded border border-slate-200 transition-colors">
                Cancel
             </button>
          </div>
          <div className="flex items-center text-slate-600 text-[12px]">
             PDF Template: <span className="font-bold ml-1 text-slate-700">'Standard Template'</span> 
             <button className="ml-2 text-blue-600 hover:text-blue-800 hover:underline">Change</button>
          </div>
       </div>

       {/* Modals */}
       {isTermsModalOpen && (
          <ConfigurePaymentTermsModal 
            onClose={() => setIsTermsModalOpen(false)}
            onSave={(updatedTerms) => {
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
