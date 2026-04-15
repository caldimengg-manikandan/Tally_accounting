import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, Trash2, ShoppingBag, PlusCircle, 
  ChevronDown, Search, Filter, MoreHorizontal,
  Clock, CheckCircle2, XCircle, Send,
  User, MapPin, Calendar, CreditCard, Truck,
  FileText, Tag, Link, Info, ArrowLeft, ArrowRight,
  Save, Send as SendIcon, UploadCloud, GripVertical, Paperclip,
  Image as ImageIcon, LayoutGrid, X, Settings, HelpCircle, MessageSquare, History, Package
} from 'lucide-react';
import { purchaseAPI, inventoryAPI, companyAPI, recurringBillAPI } from '../../services/api';
import ConfigurePaymentTermsModal from './ConfigurePaymentTermsModal';
import CreateAccountModal from './CreateAccountModal';
import VendorForm from './VendorForm';
import PurchaseDeliveryAddressModal from './PurchaseDeliveryAddressModal';
import CreateItemModal from '../inventory/CreateItemModal';
import PurchaseOrderEmailModal from './PurchaseOrderEmailModal';
import { COUNTRY_CODES } from '../../utils/countryCodes';

const RecurringBillEntryView = ({ companyId }) => {
  // â”€â”€ Form State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [formData, setFormData] = useState({
    vendorName: '',
    vendorId: '',
    profileName: '',
    repeatEvery: 'Week',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    neverExpires: true,
    deliveryAddress: 'Organization',
    paymentTerms: 'Due on Receipt',
    shipmentPreference: '',
    deliveryAddressData: {
      attention: '',
      street1: 'No. 42, Innovation Hub,',
      street2: '',
      city: 'Bangalore',
      state: 'Karnataka',
      zip: '560001',
      country: 'India',
      phone: ''
    },
    notes: '',
    terms: '',
    discount: 0,
    adjustment: 0,
    tdsRate: 0,
    tdsName: '',
    tags: []
  });

  const [items, setItems] = useState([
    { id: Date.now(), itemName: '', account: '', qty: 1, rate: 0, amount: 0 }
  ]);

  // â”€â”€ Search & Dropdown State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [vendors, setVendors] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [isVendorDropdownOpen, setIsVendorDropdownOpen] = useState(false);
  const [vendorSearch, setVendorSearch] = useState('');
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [activeRowForItemModal, setActiveRowForItemModal] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [isVendorDetailsOpen, setIsVendorDetailsOpen] = useState(false);
  
  // Custom Payment Terms Dropdown State
  const [isTermsDropdownOpen, setIsTermsDropdownOpen] = useState(false);
  const [termsSearchTerm, setTermsSearchTerm] = useState('');
  const paymentTermsOptions = [
    'Due end of next month',
    'Due end of the month',
    'Due on Receipt',
    'Net 15',
    'Net 30',
    'Net 45',
    'Net 60'
  ];
  const filteredTerms = paymentTermsOptions.filter(t => t.toLowerCase().includes(termsSearchTerm.toLowerCase()));

  const [activeRowForAccount, setActiveRowForAccount] = useState(null);
  const [accountGroups, setAccountGroups] = useState([
    { category: 'Other Current Asset', accounts: ['Advance Tax', 'Employee Advance', 'Prepaid Expenses', 'TDS Receivable'] },
    { category: 'Other Current Liability', accounts: ['Opening Balance Adjustments', 'Tax Payable', 'TDS Payable', 'Unearned Revenue'] },
    { category: 'Equity', accounts: ['Capital Stock', 'Distributions', 'Dividends Paid', 'Drawings', 'Investments', 'Opening Balance Offset', "Owner's Equity"] },
    { category: 'Expense', accounts: ['Bad Debt', 'Bank Fees and Charges', 'Consultant Expense', 'Contract Assets', 'Credit Card Charges', 'Depreciation And Amortisation', 'Depreciation Expense', 'IT and Internet Expense', 'Janitorial Expense', 'Lodging', 'Meals and Entertainment', 'Merchandise', 'Office Supplies', 'Other Expenses', 'Postage', 'Printing and Stationery', 'Purchase Discounts', 'Raw Materials And Consumables', 'Rent Expense', 'Repairs and Maintenance', 'Salaries and Employee Wages', 'Telephone Expense', 'Transportation Expense', 'Travel Expense', 'Uncategorized'] },
    { category: 'Cost Of Goods Sold', accounts: ['[ tryhgtrjh ] 24325', 'Cost of Goods Sold', 'Job Costing', 'Labor', 'Materials', 'Subcontractor'] },
    { category: 'Other Asset', accounts: ['Stock', 'Inventory Asset'] },
  ]);
  const [openItemDropdown, setOpenItemDropdown] = useState(null);
  const itemDropdownRef = useRef(null);
  const [openAccountDropdown, setOpenAccountDropdown] = useState(null);
  const accountDropdownRef = useRef(null);
  const vendorDropdownRef = useRef(null);
  const fileInputRef = useRef(null);
  const attachmentRef = useRef(null);
  const termsDropdownRef = useRef(null);
  const [attachments, setAttachments] = useState([]);
  const [isAttachmentListOpen, setIsAttachmentListOpen] = useState(false);
  const [accountSearchTerm, setAccountSearchTerm] = useState('');
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [savedPO, setSavedPO] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [vendorPanelTab, setVendorPanelTab] = useState('details');
  const [isAddressExpanded, setIsAddressExpanded] = useState(false);
  const [isContactPersonsExpanded, setIsContactPersonsExpanded] = useState(false);
  const [isTDSDropdownOpen, setIsTDSDropdownOpen] = useState(false);
  const [tdsSearchTerm, setTdsSearchTerm] = useState('');
  const tdsDropdownRef = useRef(null);

  const tdsOptions = [
    { name: 'Commission or Brokerage', rate: 2 },
    { name: 'Dividend', rate: 10 },
    { name: 'Other Interest than securities', rate: 10 },
    { name: 'Payment of contractors for Others', rate: 2 },
    { name: 'Payment of contractors HUF/Indiv', rate: 1 },
    { name: 'Technical Fees (2%)', rate: 2 },
  ];

  const filteredTdsOptions = tdsOptions.filter(opt => 
    opt.name.toLowerCase().includes(tdsSearchTerm.toLowerCase())
  );

  // Helper to parse vendor's billing address
  const getVendorBillingAddress = (vendor) => {
    if (!vendor) return null;
    try {
      const addr = vendor.billingAddressJson ? JSON.parse(vendor.billingAddressJson) 
                 : vendor.billingAddress ? JSON.parse(vendor.billingAddress) 
                 : null;
      return addr;
    } catch { return null; }
  };
  
  // â”€â”€ Context Data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (companyId) {
      purchaseAPI.getVendors(companyId).then(res => setVendors(res.data || []));
      inventoryAPI.getByCompany(companyId).then(res => {
        console.log('Inventory Items Loaded:', res.data?.length);
        setInventoryItems(res.data || []);
      });
    }
  }, [companyId]);

  const handleItemSelect = (rowId, invItem) => {
    setItems(items.map(it => {
      if (it.id === rowId) {
        return {
          ...it,
          itemName: invItem.name,
          rate: invItem.costPrice || invItem.sellingPrice || 0,
          account: invItem.purchaseAccount || it.account || 'Cost of Goods Sold',
          amount: (invItem.costPrice || invItem.sellingPrice || 0) * it.qty
        };
      }
      return it;
    }));
    setOpenItemDropdown(null);
  };

  const handleItemCreatedSuccess = (newItem) => {
    // Update local inventory list
    setInventoryItems(prev => [...prev, newItem]);
    
    // Auto-select the item for the active row
    if (activeRowForItemModal) {
      handleItemSelect(activeRowForItemModal, newItem);
    }
    
    setIsItemModalOpen(false);
    setActiveRowForItemModal(null);
  };

  // â”€â”€ Outside Click Logic â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (vendorDropdownRef.current && !vendorDropdownRef.current.contains(event.target)) {
        setIsVendorDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // â”€â”€ Item Dropdown Outside Click â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    const handleItemClickOutside = (event) => {
      if (itemDropdownRef.current && !itemDropdownRef.current.contains(event.target)) {
        setOpenItemDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleItemClickOutside);
    return () => document.removeEventListener('mousedown', handleItemClickOutside);
  }, []);

  // â”€â”€ Account Dropdown Outside Click â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    const handleAccountClickOutside = (event) => {
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(event.target)) {
        setOpenAccountDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleAccountClickOutside);
    return () => document.removeEventListener('mousedown', handleAccountClickOutside);
  }, []);

  // â”€â”€ Attachment Dropdown Outside Click â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    const handleAttachmentClickOutside = (event) => {
      if (attachmentRef.current && !attachmentRef.current.contains(event.target)) {
        setIsAttachmentListOpen(false);
      }
    };
    document.addEventListener('mousedown', handleAttachmentClickOutside);
    return () => document.removeEventListener('mousedown', handleAttachmentClickOutside);
  }, []);

  // â”€â”€ Terms Dropdown Outside Click â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    const handleTermsClickOutside = (event) => {
      if (termsDropdownRef.current && !termsDropdownRef.current.contains(event.target)) {
        setIsTermsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleTermsClickOutside);
    return () => document.removeEventListener('mousedown', handleTermsClickOutside);
  }, []);

  // â”€â”€ TDS Dropdown Outside Click â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    const handleTdsClickOutside = (event) => {
      if (tdsDropdownRef.current && !tdsDropdownRef.current.contains(event.target)) {
        setIsTDSDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleTdsClickOutside);
    return () => document.removeEventListener('mousedown', handleTdsClickOutside);
  }, []);

  // â”€â”€ Calculations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + (item.qty * item.rate), 0);
    const discountAmount = (subtotal * (formData.discount / 100));
    const taxableAmount = subtotal - discountAmount;
    
    // TDS Calculation (Deduction)
    const tdsAmount = (taxableAmount * (formData.tdsRate / 100));
    const total = taxableAmount - tdsAmount + parseFloat(formData.adjustment || 0);

    return {
      subtotal,
      discountAmount,
      taxableAmount,
      tdsAmount,
      total
    };
  }, [items, formData.discount, formData.tdsRate, formData.adjustment]);

  // â”€â”€ Handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  const handleSaveOrder = async (sendEmail = false) => {
    if (!formData.vendorId) {
      alert('Please select a vendor');
      return;
    }
    if (items.some(item => !item.itemName || item.qty <= 0)) {
      alert('Please ensure all items have a name and quantity');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        profileName: formData.profileName,
        repeatEvery: formData.repeatEvery,
        startDate: formData.startDate,
        endDate: formData.neverExpires ? null : formData.endDate,
        neverExpires: formData.neverExpires,
        vendorId: formData.vendorId,
        billNumber: formData.billNumber,
        date: formData.date,
        totalAmount: totals.total,
        discount: formData.discount,
        taxRate: formData.taxRate, // Keeping generic taxRate if needed, but primary is TDS
        tdsRate: formData.tdsRate,
        tdsName: formData.tdsName,
        adjustment: formData.adjustment,
        status: 'Active',
        notes: formData.notes,
        CompanyId: companyId,
        items
      };

      const res = await recurringBillAPI.create(payload);
      const savedData = res.data;
      
      setSavedPO(savedData);
      
      if (sendEmail) {
        setIsEmailModalOpen(true);
      } else {
        alert('Bill saved successfully');
        window.history.back();
      }
    } catch (err) {
      console.error('Error saving Bill:', err);
      alert('Failed to save Bill. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white min-h-screen text-[13px] text-slate-800 font-medium pb-24">
       {/* ———————————————————————————————————————————————————————————————————————————————— */}
       <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
             <ShoppingBag size={20} className="text-slate-800" />
             <h1 className="text-[18px] text-slate-800">New Recurring Bill</h1>
          </div>
          <div className="flex items-center gap-3">
             <button 
               onClick={() => window.history.back()}
               className="text-slate-400 hover:text-slate-600 transition-colors"
             >
                <X size={20} />
             </button>
          </div>
       </div>

       <div className="flex relative">
          {/* ———————————————————————————————————————————————————————————————————————————————— */}
          <div className="flex-1 px-8 py-6 max-w-[1200px]">
             
             {/* Form Grid */}
             <div className="grid grid-cols-[180px_1fr] gap-y-6 items-start max-w-4xl">
                
                {/* Vendor Name */}
                <label className="text-red-500 pt-2"><span className="text-slate-700">Vendor Name</span>*</label>
                <div className="relative" ref={vendorDropdownRef}>
                   <div className="flex items-center gap-3">
                      <div className="flex max-w-[400px] flex-1">
                         <div className="relative flex-1">
                            <input 
                              type="text"
                              placeholder="Select a Vendor"
                              value={formData.vendorName || vendorSearch}
                              onChange={(e) => {
                                 setVendorSearch(e.target.value);
                                 setFormData(prev => ({ ...prev, vendorName: '', vendorId: '' }));
                                 setSelectedVendor(null);
                                 setIsVendorDropdownOpen(true);
                              }}
                              onFocus={() => setIsVendorDropdownOpen(true)}
                              className="w-full h-9 px-3 pr-16 border border-slate-300 rounded-l text-slate-800 focus:border-blue-500 outline-none"
                            />
                            {formData.vendorName && (
                               <button
                                 onClick={() => {
                                    setFormData(prev => ({ ...prev, vendorName: '', vendorId: '' }));
                                    setSelectedVendor(null);
                                    setIsVendorDetailsOpen(false);
                                 }}
                                 className="absolute right-8 top-2 text-slate-400 hover:text-slate-600"
                               >
                                  <X size={14} />
                               </button>
                            )}
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
                      {/* INR Currency Indicator */}
                      {formData.vendorName && (
                         <div className="flex items-center gap-1.5 text-[13px] text-slate-600">
                            <div className="w-3 h-3 rounded-full border-2 border-green-500 bg-green-500"></div>
                            <span className="font-medium">INR</span>
                         </div>
                      )}
                   </div>

                   {/* Billing Address shown when vendor selected */}
                   {selectedVendor && (() => {
                      const addr = getVendorBillingAddress(selectedVendor);
                      return (
                         <div className="mt-2 max-w-[400px]">
                            <div className="text-[11px] font-bold text-blue-600 uppercase tracking-wider mb-0.5">BILLING ADDRESS</div>
                            {addr && (addr.street1 || addr.city) ? (
                               <div className="text-[12px] text-slate-600 leading-relaxed">
                                  {addr.attention && <div>{addr.attention}</div>}
                                  {addr.street1 && <div>{addr.street1}</div>}
                                  {addr.street2 && <div>{addr.street2}</div>}
                                  {(addr.city || addr.state || addr.pinCode) && (
                                     <div>{[addr.city, addr.state, addr.pinCode].filter(Boolean).join(', ')}</div>
                                  )}
                                  {addr.country && <div>{addr.country}</div>}
                               </div>
                            ) : (
                               <button 
                                 className="text-[12px] text-blue-500 hover:text-blue-700 hover:underline font-medium"
                                 onClick={() => setIsAddressModalOpen(true)}
                               >
                                  New Address
                               </button>
                            )}
                         </div>
                      );
                   })()}

                   {isVendorDropdownOpen && (
                      <div className="absolute top-[calc(100%+4px)] left-0 w-[360px] bg-white border border-slate-200 rounded-md shadow-lg z-50 flex flex-col">
                         <div className="max-h-[200px] overflow-y-auto py-1 custom-scrollbar">
                            {filteredVendors.length > 0 ? (
                               filteredVendors.map(vendor => (
                                  <div 
                                     key={vendor.id}
                                     onClick={() => {
                                        setFormData({ ...formData, vendorId: vendor.id, vendorName: vendor.name });
                                        setSelectedVendor(vendor);
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
                         <div className="border-t border-slate-200">
                            <button 
                              type="button"
                              onClick={() => {
                                 setIsVendorModalOpen(true);
                                 setIsVendorDropdownOpen(false);
                              }}
                              className="w-full px-4 py-2 flex items-center gap-2 text-[13px] font-medium text-blue-500 hover:bg-slate-50 transition-colors"
                            >
                               <PlusCircle size={16} className="text-blue-500 fill-blue-500 text-white" />
                               <span>New Vendor</span>
                            </button>
                         </div>
                      </div>
                   )}
                </div>

                {/* Profile Name */}
                <label className="text-red-500 pt-2"><span className="text-slate-700">Profile Name</span>*</label>
                <input 
                  type="text"
                  value={formData.profileName}
                  onChange={(e) => setFormData({ ...formData, profileName: e.target.value })}
                  className="w-full max-w-[400px] h-9 px-3 border border-slate-300 rounded text-slate-800 focus:border-blue-500 outline-none"
                />

                {/* Repeat Every */}
                <label className="text-red-500 pt-2"><span className="text-slate-700">Repeat Every</span>*</label>
                <div className="relative max-w-[400px]">
                   <select 
                     value={formData.repeatEvery}
                     onChange={(e) => setFormData({ ...formData, repeatEvery: e.target.value })}
                     className="w-full h-9 px-3 pr-8 border border-slate-300 rounded text-slate-800 focus:border-blue-500 outline-none appearance-none"
                   >
                      <option value="Week">Week</option>
                      <option value="2 Weeks">2 Weeks</option>
                      <option value="Month">Month</option>
                      <option value="2 Months">2 Months</option>
                      <option value="3 Months">3 Months</option>
                      <option value="6 Months">6 Months</option>
                      <option value="Year">Year</option>
                      <option value="2 Years">2 Years</option>
                      <option value="3 Years">3 Years</option>
                      <option value="Custom">Custom</option>
                   </select>
                   <ChevronDown size={14} className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
                </div>

                {/* Start On and Ends On */}
                <label className="text-slate-700 pt-2">Start On</label>
                <div className="flex items-center gap-4 max-w-[600px]">
                   <input 
                     type="date"
                     value={formData.startDate}
                     onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                     className="w-[180px] h-9 px-3 border border-slate-300 rounded text-slate-800 focus:border-blue-500 outline-none"
                   />
                   
                   <span className="text-slate-700 text-[13px] ml-2 font-medium">Ends On</span>
                   <div className="flex items-center gap-3">
                      <input 
                        id="ends-on-picker"
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        disabled={formData.neverExpires}
                        className="w-[140px] h-9 px-3 border border-slate-300 rounded text-slate-800 focus:border-blue-500 outline-none disabled:bg-slate-50 disabled:text-slate-400 placeholder:text-slate-400"
                        placeholder="dd/MM/yyyy"
                      />
                      <label className="flex items-center gap-2 cursor-pointer group">
                         <div className={`w-[14px] h-[14px] rounded border flex items-center justify-center transition-colors ${formData.neverExpires ? 'bg-blue-600 border-blue-600' : 'border-slate-300 group-hover:border-blue-400'}`}>
                            {formData.neverExpires && <CheckCircle2 size={10} className="text-white fill-white" />}
                         </div>
                         <input 
                           type="checkbox" 
                           className="hidden"
                           checked={formData.neverExpires}
                           onChange={(e) => {
                               const checked = e.target.checked;
                               setFormData({ ...formData, neverExpires: checked, endDate: checked ? '' : formData.endDate });
                               if (!checked) {
                                   setTimeout(() => {
                                       try {
                                           document.getElementById('ends-on-picker')?.showPicker();
                                       } catch (e) {
                                           document.getElementById('ends-on-picker')?.focus();
                                       }
                                   }, 50);
                               }
                           }}
                         />
                         <span className="text-[13px] text-slate-700 font-medium">Never Expires</span>
                      </label>
                   </div>
                </div>

                {/* Accounts Payable & Payment Terms */}
                <label className="text-slate-700 flex items-center gap-1 pt-2">
                   Accounts Payable <HelpCircle size={14} className="text-slate-400" />
                </label>
                <div className="flex items-center gap-6 max-w-2xl">
                   <div className="relative w-[280px]">
                      <select 
                        value={formData.accountsPayable || 'Accounts Payable'}
                        onChange={(e) => setFormData({ ...formData, accountsPayable: e.target.value })}
                        className="w-full h-9 px-3 pr-8 border border-slate-300 rounded text-slate-800 focus:border-blue-500 outline-none appearance-none"
                      >
                         <option value="Accounts Payable">Accounts Payable</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
                   </div>
                   
                   <div className="flex items-center gap-4">
                      <span className="text-slate-700 font-medium whitespace-nowrap px-2">Payment Terms</span>
                      <div className="relative w-[180px]" ref={termsDropdownRef}>
                         <button 
                            type="button"
                            onClick={() => {
                               setIsTermsDropdownOpen(!isTermsDropdownOpen);
                               setTermsSearchTerm('');
                            }}
                            className={`w-full h-9 px-3 flex items-center justify-between border rounded text-left outline-none ${isTermsDropdownOpen ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-300 text-slate-800'}`}
                         >
                            <span className="text-[13px]">{formData.paymentTerms || 'Select terms...'}</span>
                            <ChevronDown size={14} className={`text-blue-500 transition-transform ${isTermsDropdownOpen ? 'rotate-180' : ''}`} />
                         </button>
                         
                         {isTermsDropdownOpen && (
                            <div className="absolute top-full left-0 mt-1 w-[280px] bg-white border border-slate-200 rounded lg shadow-lg z-50 overflow-hidden">
                               <div className="p-2 border-b border-slate-100">
                                  <div className="relative">
                                     <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                                     <input 
                                        type="text"
                                        value={termsSearchTerm}
                                        onChange={(e) => setTermsSearchTerm(e.target.value)}
                                        placeholder="Search"
                                        className="w-full pl-8 pr-3 py-1.5 border border-slate-300 text-slate-800 rounded focus:outline-none focus:border-blue-500 text-[13px]"
                                        autoFocus
                                     />
                                  </div>
                               </div>
                               <div className="max-h-48 overflow-y-auto py-1 custom-scrollbar">
                                  {filteredTerms.map((term, index) => (
                                     <button
                                        key={index}
                                        type="button"
                                        onClick={() => {
                                           setFormData({ ...formData, paymentTerms: term });
                                           setIsTermsDropdownOpen(false);
                                        }}
                                        className={`w-full text-left px-3 py-2 text-[13px] flex flex-row items-center justify-between hover:bg-slate-50 transition-colors ${formData.paymentTerms === term ? 'bg-blue-50 text-slate-800' : 'text-slate-700'}`}
                                     >
                                        {term}
                                        {formData.paymentTerms === term && <CheckCircle2 size={14} className="text-blue-500" />}
                                     </button>
                                  ))}
                                  {filteredTerms.length === 0 && (
                                     <div className="text-[13px] text-slate-500 p-3 text-center">No terms found</div>
                                  )}
                               </div>
                            </div>
                         )}
                      </div>
                   </div>
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

             {/* ———————————————————————————————————————————————————————————————————————————————— */}
             <div className="max-w-[1200px] border border-slate-200 rounded-t-md bg-white relative z-10">
                {/* Table Header */}
                <div className="flex items-center bg-slate-50/80 border-b border-slate-200 p-2 px-3">
                   <h3 className="font-bold text-slate-800">Item Table</h3>
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
                         <div className="px-6 py-2 relative border-l border-transparent" ref={openItemDropdown === item.id ? itemDropdownRef : null}>
                            <textarea 
                              placeholder="Type or click to select an item."
                              value={item.itemName}
                              onClick={() => setOpenItemDropdown(openItemDropdown === item.id ? null : item.id)}
                              onChange={(e) => {
                                 handleItemChange(item.id, 'itemName', e.target.value);
                                 setOpenItemDropdown(item.id);
                              }}
                              className={`w-full bg-transparent text-[13px] text-slate-800 resize-none h-[50px] px-2 py-1.5 outline-none transition-colors rounded ${openItemDropdown === item.id ? 'border border-blue-500 ring-1 ring-blue-500 bg-white' : 'border border-transparent hover:border-slate-300'}`}
                            />
                            
                            {openItemDropdown === item.id && (
                               <div className="absolute top-full left-1 w-[400px] bg-white border border-slate-200 shadow-xl z-50 rounded overflow-hidden flex flex-col">
                                  <div className="max-h-[250px] overflow-y-auto custom-scrollbar flex-1">
                                     {inventoryItems.filter(inv => inv.name.toLowerCase().includes((item.itemName || '').toLowerCase())).map(invItem => (
                                        <div 
                                          key={invItem.id || invItem._id || invItem.name}
                                          onClick={() => handleItemSelect(item.id, invItem)}
                                          className={`px-4 py-2 text-[13px] cursor-pointer flex flex-col justify-center border-b border-slate-100 last:border-0 ${item.itemName === invItem.name ? 'bg-blue-500 text-white' : 'text-slate-700 hover:bg-slate-50'}`}
                                        >
                                           <div className={`font-medium ${item.itemName === invItem.name ? 'text-white' : 'text-slate-700'}`}>{invItem.name}</div>
                                           <div className={`text-[12px] mt-0.5 ${item.itemName === invItem.name ? 'text-blue-100' : 'text-slate-500'}`}>
                                              Purchase Rate: ₹{(invItem.costPrice || invItem.sellingPrice || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}
                                           </div>
                                        </div>
                                     ))}
                                     {inventoryItems.filter(inv => inv.name.toLowerCase().includes((item.itemName || '').toLowerCase())).length === 0 && (
                                        <div className="px-6 py-4 flex flex-col items-center justify-center text-center">
                                           <Package size={24} className="text-slate-300 mb-2" />
                                           <span className="text-[13px] text-slate-600 font-medium">No matching items found</span>
                                           <span className="text-[11px] text-slate-400 mt-1">Try a different search term</span>
                                        </div>
                                     )}
                                  </div>
                                  <div 
                                    className="px-4 py-3 bg-white border-t border-slate-100 flex items-center gap-2 text-[13px] font-medium text-blue-600 hover:bg-slate-50 cursor-pointer transition-colors shrink-0"
                                    onClick={() => {
                                       setActiveRowForItemModal(item.id);
                                       setIsItemModalOpen(true);
                                       setOpenItemDropdown(null);
                                    }}
                                  >
                                     <PlusCircle size={14} className="fill-blue-600 text-white" /> Add New Item
                                  </div>
                               </div>
                            )}
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
                                <div className="absolute top-[80%] left-0 w-full min-w-[200px] bg-white border border-slate-200 shadow-xl z-50 rounded-md overflow-hidden flex flex-col">
                                   <div className="p-2 border-b border-slate-100 bg-slate-50/50">
                                      <div className="relative">
                                         <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                                         <input 
                                           autoFocus
                                           placeholder="Search accounts..."
                                           value={accountSearchTerm}
                                           onChange={(e) => setAccountSearchTerm(e.target.value)}
                                           className="w-full pl-7 pr-2 py-1 text-[12px] outline-none border border-slate-200 rounded bg-white"
                                         />
                                      </div>
                                   </div>
                                   <div className="max-h-[220px] overflow-y-auto py-1 custom-scrollbar">
                                      {accountGroups.map(group => {
                                         const filteredAccounts = group.accounts.filter(a => a.toLowerCase().includes(accountSearchTerm.toLowerCase()));
                                         if (filteredAccounts.length === 0) return null;
                                         return (
                                            <div key={group.category}>
                                               <div className="px-3 py-1 font-bold text-slate-400 bg-slate-50 text-[11px] uppercase tracking-wider">{group.category}</div>
                                               {filteredAccounts.map(acc => (
                                                  <div 
                                                    key={acc}
                                                    onClick={() => {
                                                       handleItemChange(item.id, 'account', acc);
                                                       setOpenAccountDropdown(null);
                                                       setAccountSearchTerm('');
                                                    }}
                                                    className={`px-4 py-1.5 text-[13px] cursor-pointer hover:bg-blue-600 hover:text-white ${item.account === acc ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-700'}`}
                                                  >
                                                     {acc}
                                                  </div>
                                               ))}
                                            </div>
                                         );
                                      })}
                                   </div>
                                   <div 
                                     onClick={() => {
                                        setActiveRowForAccount(item.id);
                                        setIsAccountModalOpen(true);
                                        setOpenAccountDropdown(null);
                                     }}
                                     className="px-4 py-2 border-t border-slate-100 flex items-center gap-2 text-[12px] font-medium text-blue-600 hover:bg-slate-50 cursor-pointer transition-colors"
                                   >
                                      <Plus size={14} className="bg-blue-600 text-white rounded-full p-0.5" /> New Account
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
                <div className="w-[450px] bg-slate-50 border border-slate-200 rounded-md p-4 animate-in fade-in duration-500">
                   <div className="space-y-4">
                      {/* Sub Total */}
                      <div className="flex justify-between text-slate-600">
                         <span className="text-[13px]">Sub Total</span>
                         <span className="font-medium text-slate-800">{(totals.subtotal).toFixed(2)}</span>
                      </div>
                      
                      {/* Discount Row */}
                      <div className="flex items-center justify-between gap-4">
                         <div className="flex items-center gap-2">
                            <span className="text-slate-600 text-[13px]">Discount</span>
                            <div className="flex items-center border border-slate-300 rounded bg-white overflow-hidden h-7 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
                               <input 
                                 type="number" 
                                 value={formData.discount}
                                 onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                                 className="w-16 px-2 text-right outline-none text-[13px]" 
                               />
                               <div className="px-2 bg-slate-100 border-l border-slate-300 text-slate-500 font-medium select-none text-[11px]">%</div>
                            </div>
                         </div>
                         <span className="font-medium text-red-500">{(totals.discountAmount).toFixed(2)}</span>
                      </div>

                      {/* GST Selection & Rate Row */}
                      <div className="py-3 border-y border-slate-200/50 flex items-center justify-between gap-4">
                         <div className="flex items-center gap-2">
                            <span className="text-slate-600 text-[13px] font-bold">TDS</span>
                            <div className="relative min-w-[220px]" ref={tdsDropdownRef}>
                               <div 
                                 onClick={() => {
                                   setIsTDSDropdownOpen(!isTDSDropdownOpen);
                                   setTdsSearchTerm('');
                                 }}
                                 className={`w-full h-9 px-3 flex items-center justify-between border rounded bg-white cursor-pointer group transition-all ${isTDSDropdownOpen ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-300 hover:border-slate-400'}`}
                               >
                                  <span className={`text-[13px] truncate ${formData.tdsName ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>
                                     {formData.tdsName ? `${formData.tdsName} [${formData.tdsRate}%]` : 'Select a Tax'}
                                  </span>
                                  <ChevronDown size={14} className={`text-slate-400 transition-transform ${isTDSDropdownOpen ? 'rotate-180 text-blue-500' : ''}`} />
                               </div>

                               {isTDSDropdownOpen && (
                                  <div className="absolute bottom-full left-0 mb-1 w-[320px] bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                                     <div className="p-2 border-b border-slate-100">
                                        <div className="relative">
                                           <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                                           <input 
                                             autoFocus
                                             type="text"
                                             value={tdsSearchTerm}
                                             onChange={(e) => setTdsSearchTerm(e.target.value)}
                                             placeholder="Search"
                                             className="w-full pl-8 pr-3 py-1.5 text-[12px] outline-none border border-slate-200 rounded focus:border-blue-500"
                                           />
                                        </div>
                                     </div>
                                     <div className="max-h-[220px] overflow-y-auto py-1 custom-scrollbar">
                                        <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Taxes</div>
                                        {filteredTdsOptions.map((opt, idx) => (
                                           <div 
                                             key={idx}
                                             onClick={() => {
                                               setFormData({ ...formData, tdsRate: opt.rate, tdsName: opt.name });
                                               setIsTDSDropdownOpen(false);
                                             }}
                                             className={`px-3 py-2 text-[13px] cursor-pointer flex items-center justify-between transition-colors ${formData.tdsName === opt.name ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-50'}`}
                                           >
                                              <span>{opt.name} [{opt.rate}%]</span>
                                              {formData.tdsName === opt.name && <CheckCircle2 size={14} className="text-white fill-white" />}
                                           </div>
                                        ))}
                                        {filteredTdsOptions.length === 0 && (
                                           <div className="px-4 py-3 text-center text-slate-400 text-[12px]">No taxes found</div>
                                        )}
                                     </div>
                                     <div className="border-t border-slate-100 p-2 bg-slate-50/50">
                                        <button className="w-full py-1.5 flex items-center justify-start gap-2 text-blue-600 hover:text-blue-800 text-[12px] font-medium transition-colors">
                                           <Settings size={14} /> Manage TDS
                                        </button>
                                     </div>
                                  </div>
                               )}
                            </div>
                         </div>
                         <div className="font-medium text-slate-500 text-[13px]">
                            -{totals.tdsAmount.toFixed(2)}
                         </div>
                      </div>

                      {/* Adjustment Row */}
                      <div className="flex items-center justify-between gap-4">
                         <div className="flex items-center gap-2">
                            <div className="px-2 py-1 border border-dashed border-slate-300 rounded text-slate-500 text-[11px] bg-white">Adjustment</div>
                            <input 
                              type="number" 
                              value={formData.adjustment}
                              onChange={(e) => setFormData({ ...formData, adjustment: e.target.value })}
                              className="w-24 h-8 px-2 border border-slate-300 rounded outline-none text-[13px] text-right focus:border-blue-500 transition-all font-medium text-slate-700" 
                            />
                         </div>
                         <span className="font-medium text-slate-800">{(parseFloat(formData.adjustment || 0)).toFixed(2)}</span>
                      </div>

                      {/* Total Grand Row */}
                      <div className="flex justify-between items-center text-slate-800 pt-3 border-t-2 border-slate-200 mt-2">
                         <span className="font-bold text-[16px]">Total ( ₹ )</span>
                         <span className="font-bold text-[18px]">{(totals.total).toFixed(2)}</span>
                      </div>
                   </div>
                </div>
             </div>

              <div className="mt-12 pb-10 border-t border-slate-100 pt-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex flex-col gap-4">
                   <h3 className="text-[14px] font-semibold text-slate-700">Attach File(s) to Bill</h3>
                   
                   <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                         <div 
                           className="flex items-center border-2 border-dashed border-slate-200 rounded-lg p-0.5 hover:border-blue-300 hover:bg-blue-50/20 transition-all cursor-pointer group"
                           onClick={() => fileInputRef.current?.click()}
                         >
                            <div className="flex items-center h-8 px-4 gap-2 text-slate-600 group-hover:text-blue-600 font-medium text-[13px]">
                               <UploadCloud size={16} />
                               <span>Upload File</span>
                            </div>
                            <div className="w-px h-5 bg-slate-200 mx-1"></div>
                            <div className="px-3 text-slate-400 group-hover:text-blue-500">
                               <ChevronDown size={14} />
                            </div>
                         </div>
                         <input 
                           type="file" 
                           ref={fileInputRef} 
                           className="hidden" 
                           multiple 
                           onChange={handleFileChange} 
                         />
                      </div>
                      <p className="text-[11px] text-slate-400">You can upload a maximum of 10 files, 10MB each</p>
                   </div>

                   {/* Attachment List Preview */}
                   {attachments.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-3">
                         {attachments.map(file => (
                            <div key={file.id} className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm hover:shadow-md transition-shadow group animate-in zoom-in-95">
                               <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center text-blue-500">
                                  <FileText size={16} />
                               </div>
                               <div className="flex flex-col min-w-[120px]">
                                  <span className="text-[12px] font-medium text-slate-700 truncate max-w-[200px]">{file.name}</span>
                                  <span className="text-[10px] text-slate-400">{file.size}</span>
                               </div>
                               <button 
                                 onClick={() => removeAttachment(file.id)}
                                 className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                               >
                                  <X size={14} />
                               </button>
                            </div>
                         ))}
                      </div>
                   )}
                </div>
             </div>
          </div>

           {/* Vendor Details Slide-out Panel - Redesigned */}
           {isVendorDetailsOpen && selectedVendor && (() => {
              const addr = getVendorBillingAddress(selectedVendor);
              const vendorInitial = (selectedVendor.name || '?').charAt(0).toUpperCase();
              
              
              
              return (
                 <div className="w-[420px] border-l border-slate-200 bg-[#f5f5f5] overflow-y-auto h-[calc(100vh-65px)] sticky top-[65px] shrink-0 animate-in slide-in-from-right-4 duration-300 flex flex-col">

                    {/* Panel Header */}
                    <div className="bg-white px-5 pt-5 pb-0 border-b border-slate-200">
                       <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                             <div className="w-12 h-12 rounded-lg bg-slate-200 flex items-center justify-center text-[18px] font-bold text-slate-600 shrink-0">
                                {vendorInitial}
                             </div>
                             <div>
                                <div className="text-[11px] text-slate-400 font-medium mb-0.5">Vendor</div>
                                <div className="flex items-center gap-2">
                                   <h3 className="text-[17px] font-bold text-slate-800">{selectedVendor.name}</h3>
                                   <Link size={13} className="text-blue-500 cursor-pointer hover:text-blue-700" />
                                </div>
                             </div>
                          </div>
                          <button onClick={() => setIsVendorDetailsOpen(false)} className="text-red-400 hover:text-red-600 transition-colors mt-1">
                             <X size={18} />
                          </button>
                       </div>

                       {/* File/Note icons */}
                       <div className="flex flex-col gap-1 mb-3 text-slate-400">
                          <div className="flex items-center gap-2 text-[12px]"><FileText size={13} /> -</div>
                          <div className="flex items-center gap-2 text-[12px]"><Send size={13} /> -</div>
                       </div>

                       {/* Tabs */}
                       <div className="flex gap-6 text-[13px] font-medium">
                          <button
                            onClick={() => setVendorPanelTab('details')}
                            className={`pb-2.5 border-b-2 transition-colors ${vendorPanelTab === 'details' ? 'border-blue-600 text-slate-800' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                          >
                             Details
                          </button>
                          <button
                            onClick={() => setVendorPanelTab('activity')}
                            className={`pb-2.5 border-b-2 transition-colors ${vendorPanelTab === 'activity' ? 'border-blue-600 text-slate-800' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                          >
                             Activity Log
                          </button>
                       </div>
                    </div>

                    {/* Panel Body */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                       {vendorPanelTab === 'details' && (
                          <>
                             {/* Financials Row */}
                             <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white rounded-lg border border-slate-200 p-4 text-center">
                                   <div className="flex justify-center mb-2">
                                      <div className="w-8 h-8 bg-orange-50 rounded-full flex items-center justify-center">
                                         <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><line x1="12" y1="9" x2="12" y2="13" stroke="#f97316" strokeWidth="2" strokeLinecap="round"/><line x1="12" y1="17" x2="12.01" y2="17" stroke="#f97316" strokeWidth="2" strokeLinecap="round"/></svg>
                                      </div>
                                   </div>
                                   <div className="text-[11px] text-slate-400 mb-1">Outstanding Payables</div>
                                   <div className="text-[16px] font-bold text-slate-800">₹{(parseFloat(selectedVendor.currentBalance) || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
                                </div>
                                <div className="bg-white rounded-lg border border-slate-200 p-4 text-center">
                                   <div className="flex justify-center mb-2">
                                      <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center">
                                         <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#22c55e" strokeWidth="2"/><path d="M12 6v6l4 2" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"/></svg>
                                      </div>
                                   </div>
                                   <div className="text-[11px] text-slate-400 mb-1">Unused Credits</div>
                                   <div className="text-[16px] font-bold text-slate-800">₹0.00</div>
                                </div>
                             </div>

                             {/* Contact Details */}
                             <div className="bg-white rounded-lg border border-slate-200 p-4">
                                <h4 className="text-[14px] font-bold text-slate-800 mb-4">Contact Details</h4>
                                <div className="space-y-3 text-[13px]">
                                   <div className="flex justify-between">
                                      <span className="text-blue-500">Currency</span>
                                      <span className="text-[#c47c2b] font-medium">{(selectedVendor.currency || 'INR- Indian Rupee').split('-')[0].trim()}</span>
                                   </div>
                                   <div className="flex justify-between">
                                      <span className="text-blue-500">Payment Terms</span>
                                      <span className="text-[#c47c2b] font-medium">{selectedVendor.paymentTerms || 'Due on Receipt'}</span>
                                   </div>
                                   <div className="flex justify-between">
                                      <span className="text-blue-500">Portal Status</span>
                                      <span className="text-slate-500">Disabled</span>
                                   </div>
                                   <div className="flex justify-between items-center">
                                      <span className="text-blue-500 flex items-center gap-1">Vendor Language <Info size={12} className="text-slate-400" /></span>
                                      <span className="text-[#c47c2b] font-medium">English</span>
                                   </div>
                                   {selectedVendor.email && (
                                      <div className="flex justify-between"><span className="text-blue-500">Email</span><span className="text-slate-700">{selectedVendor.email}</span></div>
                                   )}
                                   {(selectedVendor.phone || selectedVendor.mobile) && (
                                      <div className="flex justify-between"><span className="text-blue-500">Phone</span><span className="text-slate-700">{selectedVendor.phone || selectedVendor.mobile}</span></div>
                                   )}
                                   {selectedVendor.pan && (
                                      <div className="flex justify-between"><span className="text-blue-500">PAN</span><span className="text-slate-700 uppercase">{selectedVendor.pan}</span></div>
                                   )}
                                </div>
                             </div>

                             {/* Contact Persons collapsible */}
                             <div className="bg-white rounded-lg border border-slate-200">
                                <button
                                  onClick={() => setIsContactPersonsExpanded(!isContactPersonsExpanded)}
                                  className="w-full flex items-center justify-between px-4 py-3.5 text-[13px] font-bold text-slate-800 hover:bg-slate-50 transition-colors rounded-lg"
                                >
                                   <span className="flex items-center gap-2">
                                      Contact Persons
                                      <span className="bg-slate-200 text-slate-600 text-[11px] font-bold rounded-full w-5 h-5 flex items-center justify-center">0</span>
                                   </span>
                                   <ChevronDown size={14} className={`text-slate-400 transition-transform ${isContactPersonsExpanded ? 'rotate-180' : ''}`} />
                                </button>
                                {isContactPersonsExpanded && (
                                   <div className="px-4 pb-4 text-[12px] text-slate-400 italic">No contact persons on file.</div>
                                )}
                             </div>

                             {/* Address collapsible */}
                             <div className="bg-white rounded-lg border border-slate-200">
                                <button
                                  onClick={() => setIsAddressExpanded(!isAddressExpanded)}
                                  className="w-full flex items-center justify-between px-4 py-3.5 text-[13px] font-bold text-slate-800 hover:bg-slate-50 transition-colors rounded-lg"
                                >
                                   Address
                                   <ChevronDown size={14} className={`text-slate-400 transition-transform ${isAddressExpanded ? 'rotate-180' : ''}`} />
                                </button>
                                {isAddressExpanded && addr && (addr.street1 || addr.city) && (
                                   <div className="px-4 pb-4 text-[13px] text-slate-600 leading-relaxed space-y-0.5">
                                      {addr.attention && <div className="font-medium text-slate-700">{addr.attention}</div>}
                                      {addr.street1 && <div>{addr.street1}</div>}
                                      {addr.street2 && <div>{addr.street2}</div>}
                                      {(addr.city || addr.state || addr.pinCode) && <div>{[addr.city, addr.state, addr.pinCode].filter(Boolean).join(', ')}</div>}
                                      {addr.country && <div>{addr.country}</div>}
                                   </div>
                                )}
                                {isAddressExpanded && (!addr || (!addr.street1 && !addr.city)) && (
                                   <div className="px-4 pb-4 text-[12px] text-slate-400 italic">No address on file.</div>
                                )}
                             </div>
                          </>
                       )}

                       {vendorPanelTab === 'activity' && (
                          <div className="bg-white rounded-lg border border-slate-200 p-6 text-center">
                             <History size={28} className="text-slate-300 mx-auto mb-2" />
                             <div className="text-[13px] text-slate-500 font-medium">No activity yet</div>
                             <div className="text-[12px] text-slate-400 mt-1">Actions taken on this vendor will appear here</div>
                          </div>
                       )}
                    </div>
                 </div>
              );
           })()}
       </div>

       {/* â”€â”€â”€ Bottom Actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
       <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] flex items-center justify-between px-8 z-50">
          <div className="flex items-center gap-3">
             <button 
               onClick={() => handleSaveOrder(false)}
               disabled={isSaving}
               className="px-4 h-8 bg-[#408dfb] hover:bg-[#327ad9] text-white text-[13px] font-medium rounded transition-colors disabled:opacity-50 shadow-sm"
             >
                {isSaving ? 'Saving...' : 'Save'}
             </button>
             <button 
               onClick={() => window.history.back()} 
               className="px-3 h-8 bg-[#f5f5f5] hover:bg-[#ebebeb] text-slate-800 text-[13px] font-medium rounded border border-slate-200 transition-colors"
             >
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

       {isVendorModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-6 animate-in fade-in">
             <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl h-[90vh] overflow-hidden flex flex-col slide-in-from-bottom-4 animate-in duration-300">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                   <h2 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
                       <User size={18} className="text-blue-600" />
                       Create New Vendor
                   </h2>
                   <button 
                     onClick={() => setIsVendorModalOpen(false)}
                     className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors"
                   >
                      <X size={16} />
                   </button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#f8fafc]">
                   <VendorForm 
                     standalone={false} 
                     onCancel={() => setIsVendorModalOpen(false)}
                     onSaveSuccess={(newVendor) => {
                        if (companyId) {
                           purchaseAPI.getVendors(companyId).then(res => {
                              setVendors(res.data || []);
                              if (newVendor && newVendor.id) {
                                 setFormData(prev => ({ ...prev, vendorId: newVendor.id, vendorName: newVendor.name || newVendor.displayName }));
                              }
                           });
                        }
                        setIsVendorModalOpen(false);
                     }}
                   />
                </div>
             </div>
          </div>
       )}

        {isItemModalOpen && (
          <CreateItemModal 
            isOpen={isItemModalOpen}
            onClose={() => setIsItemModalOpen(false)}
            onSuccess={handleItemCreatedSuccess}
            companyId={companyId}
          />
        )}

        {isEmailModalOpen && (
          <PurchaseOrderEmailModal 
            isOpen={isEmailModalOpen}
            onClose={() => {
              setIsEmailModalOpen(false);
              window.history.back(); // Navigate back after closing the email modal if it was a save flow
            }}
            vendor={vendors.find(v => v.id === formData.vendorId)}
            poData={{...formData, id: savedPO?.id, companyId}}
            totals={totals}
            attachments={attachments}
            onSent={() => {
              alert('Email sent successfully');
              window.history.back();
            }}
          />
        )}
    </div>
  );
};

export default RecurringBillEntryView;
