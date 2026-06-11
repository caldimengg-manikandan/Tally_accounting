import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useNotificationStore from '../../store/notificationStore';
import { 
  Plus, Trash2, ShoppingBag, PlusCircle, 
  ChevronDown, Search, Filter, MoreHorizontal,
  Clock, CheckCircle2, XCircle, Send,
  User, MapPin, Calendar, CreditCard, Truck,
  FileText, Tag, Link, Info, ArrowLeft,
  Save, Send as SendIcon, UploadCloud, GripVertical, Paperclip,
  Image as ImageIcon, LayoutGrid, X, Settings, HelpCircle, MessageSquare, History, Package
} from 'lucide-react';
import { purchaseAPI, inventoryAPI, companyAPI, projectAPI } from '../../services/api';
import ConfigurePaymentTermsModal from './ConfigurePaymentTermsModal';
import CreateAccountModal from './CreateAccountModal';
import VendorForm from './VendorForm';
import PurchaseDeliveryAddressModal from './PurchaseDeliveryAddressModal';
import CreateItemModal from '../inventory/CreateItemModal';
import PurchaseOrderEmailModal from './PurchaseOrderEmailModal';
import { COUNTRY_CODES } from '../../utils/countryCodes';

const PurchaseOrderEntryView = ({ companyId }) => {
  const { addNotification } = useNotificationStore();
  const { id } = useParams();
  const navigate = useNavigate();
  // ── Form State ──────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    vendorName: '',
    vendorId: '',
    deliveryAddress: 'Organization',
    deliveryAddressText: '',
    poNumber: '',
    reference: '',
    date: new Date().toISOString().split('T')[0],
    deliveryDate: '',
    paymentTerms: 'Due on Receipt',
    shipmentPreference: '',
    deliveryAddressData: {
      attention: '',
      street1: '',
      street2: '',
      city: '',
      state: '',
      zip: '',
      country: '',
      phone: ''
    },
    notes: '',
    terms: '',
    discount: 0,
    adjustment: 0,
    taxRate: 0,
    tdsRate: 0,
    tdsName: '',
    tags: [],
    projectId: ''
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
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isEditingDeliveryAddress, setIsEditingDeliveryAddress] = useState(false);
  const [selectedEmailContacts, setSelectedEmailContacts] = useState([]);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [activeRowForItemModal, setActiveRowForItemModal] = useState(null);
  
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
  const [isTDSDropdownOpen, setIsTDSDropdownOpen] = useState(false);
  const [tdsSearchTerm, setTdsSearchTerm] = useState('');
  const tdsDropdownRef = useRef(null);
  const [projects, setProjects] = useState([]);
  const [currentCompany, setCurrentCompany] = useState(null);

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
  
  // ── Context Data ────────────────────────────────────────────────
  useEffect(() => {
    if (companyId) {
      purchaseAPI.getVendors(companyId).then(res => setVendors(res.data || []));
      inventoryAPI.getByCompany(companyId, 'purchase').then(res => {
        console.log('Inventory Items Loaded:', res.data?.length);
        setInventoryItems(res.data || []);
      });
      projectAPI.getByCompany(companyId).then(res => setProjects(res.data || []));
      
      companyAPI.getById(companyId).then(res => {
        const co = res.data;
        setCurrentCompany(co);
        if (co && !id) {
          setFormData(prev => ({
            ...prev,
            deliveryAddressData: {
              attention: co.name || '',
              street1: co.street1 || '',
              street2: co.street2 || '',
              city: co.city || '',
              state: co.state || '',
              zip: co.pincode || '',
              country: co.location || 'India',
              phone: co.phone || ''
            }
          }));
        }
      }).catch(err => console.error('Failed to fetch company details:', err));

      if (!id) {
        purchaseAPI.getNextOrderNumber(companyId).then(res => {
          if (res.data?.nextNumber) {
            setFormData(prev => ({ ...prev, poNumber: res.data.nextNumber }));
          }
        }).catch(err => console.error('Failed to get next PO number:', err));
      }
    }
  }, [companyId, id]);

  // Load existing purchase order for editing
  useEffect(() => {
    if (companyId && id) {
      Promise.all([
        purchaseAPI.getOrders(companyId),
        companyAPI.getById(companyId)
      ]).then(([ordersRes, companyRes]) => {
        const order = (ordersRes.data || []).find(o => String(o.id) === String(id));
        if (order) {
          const co = companyRes.data;
          let deliveryAddressData = {
            attention: '', street1: '', street2: '', city: '', state: '', zip: '', country: '', phone: ''
          };
          try {
            if (order.deliveryAddressDataJson) {
              deliveryAddressData = JSON.parse(order.deliveryAddressDataJson);
            }
          } catch (e) {}

          const isEmptyAddress = !deliveryAddressData.street1 && !deliveryAddressData.city && !deliveryAddressData.attention;
          if (order.deliveryAddress === 'Organization' && isEmptyAddress && co) {
            deliveryAddressData = {
              attention: co.name || '',
              street1: co.street1 || '',
              street2: co.street2 || '',
              city: co.city || '',
              state: co.state || '',
              zip: co.pincode || '',
              country: co.location || 'India',
              phone: co.phone || ''
            };
          }

          let orderItems = [{ id: Date.now(), itemName: '', account: '', qty: 1, rate: 0, amount: 0 }];
          try {
            if (order.itemsJson) {
              orderItems = JSON.parse(order.itemsJson);
            }
          } catch (e) {}

          setFormData({
            vendorName: order.Ledger?.name || '',
            vendorId: order.LedgerId || '',
            deliveryAddress: order.deliveryAddress || 'Organization',
            deliveryAddressText: order.deliveryAddressText || '',
            poNumber: order.orderNumber || '',
            reference: order.reference || '',
            date: order.date || '',
            deliveryDate: order.deliveryDate || '',
            paymentTerms: order.paymentTerms || 'Due on Receipt',
            shipmentPreference: order.shipmentPreference || '',
            deliveryAddressData,
            notes: order.notes || '',
            terms: order.terms || '',
            discount: parseFloat(order.discount || 0),
            adjustment: parseFloat(order.adjustment || 0),
            taxRate: parseFloat(order.taxRate || 0),
            tdsRate: parseFloat(order.tdsRate || 0),
            tdsName: order.tdsName || '',
            tags: [],
            projectId: order.ProjectId || ''
          });

          setItems(orderItems);
        }
      }).catch(err => console.error('Failed to fetch order for edit:', err));
    }
  }, [companyId, id]);

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

  // ── Outside Click Logic ─────────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (vendorDropdownRef.current && !vendorDropdownRef.current.contains(event.target)) {
        setIsVendorDropdownOpen(false);
      }
      if (tdsDropdownRef.current && !tdsDropdownRef.current.contains(event.target)) {
        setIsTDSDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Item Dropdown Outside Click ─────────────────────────────────
  useEffect(() => {
    const handleItemClickOutside = (event) => {
      if (itemDropdownRef.current && !itemDropdownRef.current.contains(event.target)) {
        setOpenItemDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleItemClickOutside);
    return () => document.removeEventListener('mousedown', handleItemClickOutside);
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

  // ── Terms Dropdown Outside Click ────────────────────────────────
  useEffect(() => {
    const handleTermsClickOutside = (event) => {
      if (termsDropdownRef.current && !termsDropdownRef.current.contains(event.target)) {
        setIsTermsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleTermsClickOutside);
    return () => document.removeEventListener('mousedown', handleTermsClickOutside);
  }, []);

  // ── Calculations ────────────────────────────────────────────────
  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + (item.qty * item.rate), 0);
    const discountAmount = (subtotal * (formData.discount / 100));
    const taxableAmount = subtotal - discountAmount;
    
    // GST Calculation
    const taxAmount = (taxableAmount * (formData.taxRate / 100));
    
    // TDS Calculation
    const tdsAmount = (taxableAmount * (formData.tdsRate / 100));
    
    const total = taxableAmount + taxAmount - tdsAmount + parseFloat(formData.adjustment || 0);

    return {
      subtotal,
      discountAmount,
      taxableAmount,
      taxAmount,
      tdsAmount,
      total
    };
  }, [items, formData.discount, formData.taxRate, formData.tdsRate, formData.adjustment]);

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

  const selectedVendor = formData.vendorId ? vendors.find(v => v.id === formData.vendorId) : null;
  
  let vendorBillingObj = {};
  let vendorShippingObj = {};
  if (selectedVendor) {
     try { 
        if (selectedVendor.billingAddressJson) vendorBillingObj = JSON.parse(selectedVendor.billingAddressJson); 
        else if (selectedVendor.billingAddress && selectedVendor.billingAddress.startsWith('{')) vendorBillingObj = JSON.parse(selectedVendor.billingAddress);
     } catch (e) {}
     try { 
        if (selectedVendor.shippingAddressJson) vendorShippingObj = JSON.parse(selectedVendor.shippingAddressJson); 
        else if (selectedVendor.shippingAddress && selectedVendor.shippingAddress.startsWith('{')) vendorShippingObj = JSON.parse(selectedVendor.shippingAddress);
     } catch (e) {}
  }

  const emailContacts = useMemo(() => {
    if (!selectedVendor) return [];
    const contacts = [];
    
    const cleanNameStr = (str) => {
      if (!str) return '';
      return str.replace(/^(Mr\.|Ms\.|Mrs\.|Dr\.|Prof\.|Mr|Ms|Mrs)\s+/i, '').trim();
    };

    if (selectedVendor.email) {
      const name = cleanNameStr([selectedVendor.firstName, selectedVendor.lastName].filter(Boolean).join(' ') || selectedVendor.name || 'Primary');
      contacts.push({ id: 'primary', name, email: selectedVendor.email });
    }
    
    try {
       const others = selectedVendor.contactPersonsJson ? JSON.parse(selectedVendor.contactPersonsJson) : [];
       if (Array.isArray(others)) {
          others.forEach((c, idx) => {
             if (c.email) {
                let name = c.name || [c.firstName, c.lastName].filter(Boolean).join(' ') || c.salutation || `Contact ${idx+1}`;
                name = cleanNameStr(name);
                contacts.push({ id: `contact-${idx}`, name, email: c.email });
             }
          });
       }
    } catch(e) {}
    
    return contacts;
  }, [selectedVendor]);

  const handleSelectAllEmails = () => {
     if (selectedEmailContacts.length === emailContacts.length) {
        setSelectedEmailContacts([]);
     } else {
        setSelectedEmailContacts(emailContacts.map(c => c.id));
     }
  };

  const toggleEmailContact = (id) => {
     setSelectedEmailContacts(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

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
      addNotification('Please select a vendor', 'warning');
      return;
    }
    if (items.some(item => !item.itemName || item.qty <= 0)) {
      addNotification('Please ensure all items have a name and quantity', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        orderNumber: formData.poNumber,
        date: formData.date,
        totalAmount: totals.total,
        status: sendEmail ? 'Sent' : 'Draft',
        notes: formData.notes,
        supplierLedgerId: formData.vendorId,
        companyId,
        projectId: formData.projectId || null,
        reference: formData.reference,
        deliveryDate: formData.deliveryDate || null,
        paymentTerms: formData.paymentTerms,
        shipmentPreference: formData.shipmentPreference,
        deliveryAddress: formData.deliveryAddress,
        deliveryAddressText: formData.deliveryAddressText,
        deliveryAddressDataJson: JSON.stringify(formData.deliveryAddressData),
        itemsJson: JSON.stringify(items),
        discount: parseFloat(formData.discount || 0),
        adjustment: parseFloat(formData.adjustment || 0),
        taxRate: parseFloat(formData.taxRate || 0),
        subtotal: parseFloat(totals.subtotal || 0),
        discountAmount: parseFloat(totals.discountAmount || 0),
        taxAmount: parseFloat(totals.taxAmount || 0),
        terms: formData.terms,
        tdsRate: parseFloat(formData.tdsRate || 0),
        tdsAmount: parseFloat(totals.tdsAmount || 0),
        tdsName: formData.tdsName
      };

      let res;
      if (id) {
        res = await purchaseAPI.updateOrder(id, payload);
      } else {
        res = await purchaseAPI.createOrder(payload);
      }
      const savedData = res.data;
      
      setSavedPO(savedData);
      
      if (sendEmail) {
        setIsEmailModalOpen(true);
      } else {
        addNotification('Purchase Order saved successfully', 'success');
        navigate(`/purchase-orders/view/${savedData.id || id}`);
      }
    } catch (err) {
      console.error('Error saving PO:', err);
      addNotification('Failed to save Purchase Order. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white min-h-screen text-[13px] text-slate-800 font-medium pb-24">
       {/* ─── Top Bar ──────────────────────────────────────────────── */}
       <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
             <ShoppingBag size={20} className="text-slate-800" />
             <h1 className="text-[18px] text-slate-800">{id ? 'Edit Purchase Order' : 'New Purchase Order'}</h1>
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
                 <div className="relative flex items-center" ref={vendorDropdownRef}>
                    <div className="flex w-full max-w-[400px]">
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
                    {selectedVendor && (
                       <div className="flex items-center gap-1.5 px-3 h-9 border border-slate-200 rounded text-[13px] text-slate-700 bg-white ml-3 shrink-0 shadow-sm">
                          <div className="flex items-center justify-center w-3.5 h-3.5 rounded-full border border-emerald-500">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                          </div>
                          <span className="font-medium">{selectedVendor.currency || 'INR'}</span>
                       </div>
                    )}
                    {isVendorDropdownOpen && (
                      <div className="absolute top-[calc(100%+4px)] left-0 w-[360px] bg-white border border-slate-200 rounded-md shadow-lg z-50 flex flex-col">
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

                {/* Vendor Address Details */}
                {selectedVendor && (
                   <>
                      <div className="col-start-1"></div>
                      <div className="flex gap-12 text-[13px] text-slate-800 -mt-2 mb-2">
                         {/* Billing Address */}
                         <div className="flex-1 max-w-[250px]">
                            <div className="text-[11px] font-semibold text-slate-500 mb-1 flex items-center gap-1 uppercase tracking-wider">
                               BILLING ADDRESS <Link size={10} className="text-slate-400" />
                            </div>
                            <div className="text-slate-700 leading-relaxed">
                               {vendorBillingObj.address1 || vendorBillingObj.street1 ? (
                                  <>
                                     {vendorBillingObj.attention && <div>{vendorBillingObj.attention}</div>}
                                     <div>{vendorBillingObj.address1 || vendorBillingObj.street1}{(vendorBillingObj.address2 || vendorBillingObj.street2) && `, ${vendorBillingObj.address2 || vendorBillingObj.street2}`}</div>
                                     <div>{vendorBillingObj.city}</div>
                                     <div>{vendorBillingObj.state} {vendorBillingObj.pinCode || vendorBillingObj.zipCode}</div>
                                     <div>{vendorBillingObj.country}</div>
                                     {(vendorBillingObj.phone || selectedVendor.mobile || selectedVendor.workPhone || selectedVendor.phone) && <div>Phone: {vendorBillingObj.phone || selectedVendor.mobile || selectedVendor.workPhone || selectedVendor.phone}</div>}
                                  </>
                               ) : (
                                  (!selectedVendor.billingAddress || String(selectedVendor.billingAddress).startsWith('{')) 
                                     ? (selectedVendor.address && !String(selectedVendor.address).startsWith('{') ? selectedVendor.address : <span className="text-slate-400 italic">No billing address provided</span>)
                                     : selectedVendor.billingAddress
                               )}
                            </div>
                         </div>

                         {/* Shipping Address */}
                         <div className="flex-1 max-w-[250px]">
                            <div className="text-[11px] font-semibold text-slate-500 mb-1 flex items-center gap-1 uppercase tracking-wider">
                               SHIPPING ADDRESS <Link size={10} className="text-slate-400" />
                            </div>
                            <div className="text-slate-700 leading-relaxed">
                               {vendorShippingObj.address1 || vendorShippingObj.street1 ? (
                                  <>
                                     {vendorShippingObj.attention && <div>{vendorShippingObj.attention}</div>}
                                     <div>{vendorShippingObj.address1 || vendorShippingObj.street1}{(vendorShippingObj.address2 || vendorShippingObj.street2) && `, ${vendorShippingObj.address2 || vendorShippingObj.street2}`}</div>
                                     <div>{vendorShippingObj.city}</div>
                                     <div>{vendorShippingObj.state} {vendorShippingObj.pinCode || vendorShippingObj.zipCode}</div>
                                     <div>{vendorShippingObj.country}</div>
                                     {(vendorShippingObj.phone || selectedVendor.mobile || selectedVendor.workPhone || selectedVendor.phone) && <div>Phone: {vendorShippingObj.phone || selectedVendor.mobile || selectedVendor.workPhone || selectedVendor.phone}</div>}
                                  </>
                               ) : (
                                  (!selectedVendor.shippingAddress || String(selectedVendor.shippingAddress).startsWith('{')) 
                                     ? <span className="text-slate-400 italic">No shipping address provided</span>
                                     : selectedVendor.shippingAddress
                               )}
                            </div>
                         </div>
                      </div>
                   </>
                )}

                {/* Delivery Address */}
                <label className="text-red-500 pt-1"><span className="text-slate-700">Delivery Address</span>*</label>
                <div>
                   <div className="flex items-center gap-6 mb-3">
                      {['Organization', 'Customer'].map(type => (
                         <label key={type} className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="radio" 
                              name="deliveryAddressType"
                              checked={formData.deliveryAddress === type}
                              onChange={() => {
                                 const nextType = type;
                                 setFormData(prev => {
                                   let nextAddr = prev.deliveryAddressData;
                                   if (nextType === 'Organization' && currentCompany) {
                                     nextAddr = {
                                       attention: currentCompany.name || '',
                                       street1: currentCompany.street1 || '',
                                       street2: currentCompany.street2 || '',
                                       city: currentCompany.city || '',
                                       state: currentCompany.state || '',
                                       zip: currentCompany.pincode || '',
                                       country: currentCompany.location || 'India',
                                       phone: currentCompany.phone || ''
                                     };
                                   } else if (nextType === 'Customer') {
                                     nextAddr = {
                                       attention: '',
                                       street1: '',
                                       street2: '',
                                       city: '',
                                       state: '',
                                       zip: '',
                                       country: '',
                                       phone: ''
                                     };
                                   }
                                   return {
                                     ...prev,
                                     deliveryAddress: nextType,
                                     deliveryAddressData: nextAddr
                                   };
                                 });
                               }}
                              className="w-3.5 h-3.5 text-blue-600 border-slate-300 focus:ring-blue-500 disabled:opacity-50"
                            />
                            <span className="text-[13px] text-slate-800">{type}</span>
                         </label>
                      ))}
                   </div>
                   {isEditingDeliveryAddress ? (
                       <div className="bg-white border border-slate-200 rounded p-4 max-w-[500px]">
                          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                             <div className="col-span-2">
                                <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1 block">Attention</label>
                                <input 
                                  type="text" 
                                  value={formData.deliveryAddressData.attention}
                                  onChange={(e) => setFormData({ ...formData, deliveryAddressData: { ...formData.deliveryAddressData, attention: e.target.value } })}
                                  className="w-full px-2 py-1.5 border border-slate-300 rounded text-[13px] text-slate-800 focus:outline-none focus:border-blue-500 bg-slate-50 focus:bg-white"
                                />
                             </div>
                             <div className="col-span-2">
                                <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1 block">Street 1</label>
                                <input 
                                  type="text" 
                                  value={formData.deliveryAddressData.street1}
                                  onChange={(e) => setFormData({ ...formData, deliveryAddressData: { ...formData.deliveryAddressData, street1: e.target.value } })}
                                  className="w-full px-2 py-1.5 border border-slate-300 rounded text-[13px] text-slate-800 focus:outline-none focus:border-blue-500 bg-slate-50 focus:bg-white"
                                />
                             </div>
                             <div className="col-span-2">
                                <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1 block">Street 2</label>
                                <input 
                                  type="text" 
                                  value={formData.deliveryAddressData.street2}
                                  onChange={(e) => setFormData({ ...formData, deliveryAddressData: { ...formData.deliveryAddressData, street2: e.target.value } })}
                                  className="w-full px-2 py-1.5 border border-slate-300 rounded text-[13px] text-slate-800 focus:outline-none focus:border-blue-500 bg-slate-50 focus:bg-white"
                                />
                             </div>
                             <div>
                                <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1 block">City</label>
                                <input 
                                  type="text" 
                                  value={formData.deliveryAddressData.city}
                                  onChange={(e) => setFormData({ ...formData, deliveryAddressData: { ...formData.deliveryAddressData, city: e.target.value } })}
                                  className="w-full px-2 py-1.5 border border-slate-300 rounded text-[13px] text-slate-800 focus:outline-none focus:border-blue-500 bg-slate-50 focus:bg-white"
                                />
                             </div>
                             <div>
                                <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1 block">State/Province</label>
                                <input 
                                  type="text" 
                                  value={formData.deliveryAddressData.state}
                                  onChange={(e) => setFormData({ ...formData, deliveryAddressData: { ...formData.deliveryAddressData, state: e.target.value } })}
                                  className="w-full px-2 py-1.5 border border-slate-300 rounded text-[13px] text-slate-800 focus:outline-none focus:border-blue-500 bg-slate-50 focus:bg-white"
                                />
                             </div>
                             <div>
                                <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1 block">ZIP</label>
                                <input 
                                  type="text" 
                                  value={formData.deliveryAddressData.zip}
                                  onChange={(e) => setFormData({ ...formData, deliveryAddressData: { ...formData.deliveryAddressData, zip: e.target.value } })}
                                  className="w-full px-2 py-1.5 border border-slate-300 rounded text-[13px] text-slate-800 focus:outline-none focus:border-blue-500 bg-slate-50 focus:bg-white"
                                />
                             </div>
                             <div>
                                <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1 block">Country</label>
                                <select 
                                  value={formData.deliveryAddressData.country}
                                  onChange={(e) => setFormData({ ...formData, deliveryAddressData: { ...formData.deliveryAddressData, country: e.target.value } })}
                                  className="w-full px-2 py-1.5 border border-slate-300 rounded text-[13px] text-slate-800 focus:outline-none focus:border-blue-500 bg-slate-50 focus:bg-white"
                                >
                                   <option value="" className="text-slate-400">Select country</option>
                                   {COUNTRY_CODES.map((c, i) => (
                                      <option key={i} value={c.country}>{c.country}</option>
                                   ))}
                                </select>
                             </div>
                             <div className="col-span-2">
                                <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1 block">Phone</label>
                                <input 
                                  type="text" 
                                  value={formData.deliveryAddressData.phone}
                                  onChange={(e) => setFormData({ ...formData, deliveryAddressData: { ...formData.deliveryAddressData, phone: e.target.value } })}
                                  className="w-full px-2 py-1.5 border border-slate-300 rounded text-[13px] text-slate-800 focus:outline-none focus:border-blue-500 bg-slate-50 focus:bg-white"
                                />
                             </div>
                             <div className="col-span-2 flex justify-end mt-2">
                                <button type="button" onClick={() => setIsEditingDeliveryAddress(false)} className="px-4 py-1.5 bg-blue-600 text-white rounded text-[12px] font-bold hover:bg-blue-700">Save Address</button>
                             </div>
                          </div>
                       </div>
                    ) : (
                       <div className="max-w-[400px]">
                          <input 
                             type="text" 
                             value={formData.deliveryAddressData.attention}
                             onChange={(e) => setFormData({ ...formData, deliveryAddressData: { ...formData.deliveryAddressData, attention: e.target.value } })}
                             className="w-full max-w-[280px] h-8 px-3 border border-blue-400 rounded-[4px] text-[13px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 mb-3 shadow-sm"
                          />
                          <div className="text-[13px] text-slate-600 leading-relaxed mb-4">
                             {formData.deliveryAddressData.street1 && <div>{formData.deliveryAddressData.street1}</div>}
                             {formData.deliveryAddressData.street2 && <div>{formData.deliveryAddressData.street2}</div>}
                             {(formData.deliveryAddressData.city || formData.deliveryAddressData.state || formData.deliveryAddressData.zip) && (
                                <div>
                                   {formData.deliveryAddressData.city}{formData.deliveryAddressData.city && (formData.deliveryAddressData.state || formData.deliveryAddressData.zip) ? ', ' : ''}
                                   {formData.deliveryAddressData.state} {formData.deliveryAddressData.zip}
                                </div>
                             )}
                             {formData.deliveryAddressData.country && <div>{formData.deliveryAddressData.country}{formData.deliveryAddressData.country && formData.deliveryAddressData.phone ? ' ,' : ''}</div>}
                             {formData.deliveryAddressData.phone && <div>{formData.deliveryAddressData.phone}</div>}
                          </div>
                          <button 
                             type="button" 
                             onClick={() => setIsEditingDeliveryAddress(true)} 
                             className="text-[13px] text-blue-500 hover:text-blue-700 cursor-pointer"
                          >
                             Change destination to deliver
                          </button>
                       </div>
                    )}
                 </div>

                {/* Purchase Order# */}
                <label className="text-red-500 pt-2"><span className="text-slate-700">Purchase Order#</span>*</label>
                <input 
                  type="text"
                  value={formData.poNumber}
                  onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
                  className="w-full max-w-[280px] h-9 px-3 border border-slate-300 rounded text-slate-800 focus:border-blue-500 outline-none"
                />

                {/* Reference# */}
                <label className="text-slate-700 pt-2">Reference#</label>
                <input 
                  type="text"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  className="w-full max-w-[280px] h-9 px-3 border border-slate-300 rounded text-slate-800 focus:border-blue-500 outline-none"
                />
 
                 {/* Project */}
                 <label className="text-slate-700 pt-2">Project</label>
                 <div className="relative max-w-[280px]">
                    <select 
                      value={formData.projectId}
                      onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                      className="w-full h-9 px-3 pr-8 border border-slate-300 rounded text-slate-800 focus:border-blue-500 outline-none appearance-none bg-white"
                    >
                       <option value="">Select project</option>
                       {projects.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                       ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
                 </div>

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
                      <div className="relative w-[280px]" ref={termsDropdownRef}>
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
                            <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded lg shadow-lg z-50 overflow-hidden">
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
                                     {inventoryItems.filter(inv => {
                                        const matchesSearch = inv.name.toLowerCase().includes((item.itemName || '').toLowerCase());
                                        const isPurchaseItem = inv.purchaseInformation !== false && inv.purchaseInformation !== 0 && inv.purchaseInformation !== 'false'; // Default to true if missing
                                        return matchesSearch && isPurchaseItem;
                                     }).map(invItem => (
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
                            <span className="text-slate-600 text-[13px] font-bold">GST</span>
                            <div className="flex-1 min-w-[160px]">
                               <select 
                                 value={formData.taxRate}
                                 onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) })}
                                 className="w-full h-8 px-2 text-[12px] border border-slate-300 rounded focus:border-blue-500 outline-none bg-white transition-all appearance-none cursor-pointer pr-6 text-slate-700"
                                 style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.4rem center', backgroundSize: '1em' }}
                               >
                                  <option value="0">Select a Tax</option>
                                  <option value="5">GST @ 5%</option>
                                  <option value="12">GST @ 12%</option>
                                  <option value="18">GST @ 18%</option>
                                  <option value="28">GST @ 28%</option>
                               </select>
                            </div>
                         </div>
                         <div className="font-medium text-slate-800 text-[13px]">
                            {totals.taxAmount.toFixed(2)}
                         </div>
                      </div>

                      {/* Standardized TDS Dropdown */}
                      <div className="py-3 border-b border-slate-200/50 flex items-center justify-between gap-4">
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
                                     <div className="max-h-[220px] overflow-y-auto py-1 custom-scrollbar text-left">
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

             {/* ─── Attachments Section ────────────────────────────────── */}
             <div className="mt-12 pb-10 border-t border-slate-100 pt-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex flex-col gap-4">
                   <h3 className="text-[14px] font-semibold text-slate-700">Attach File(s) to Purchase Order</h3>
                   
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

             {/* ─── Email Communications ───────────────────────────────── */}
             <div className="mt-8 pb-4 border-t border-slate-100 pt-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex items-center gap-3 mb-4">
                   <h3 className="text-[14px] font-semibold text-slate-700">Email Communications</h3>
                   {emailContacts.length > 0 && (
                      selectedEmailContacts.length === emailContacts.length ? (
                        <button
                          type="button"
                          onClick={() => setSelectedEmailContacts([])}
                          className="flex items-center gap-1 text-[12px] text-red-500 hover:text-red-700 font-semibold border border-red-200 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded transition-colors"
                        >
                          <X size={12} strokeWidth={2.5} />
                          Clear Selection
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSelectAllEmails}
                          className="text-[12px] text-blue-500 hover:text-blue-700 hover:underline"
                        >
                          Select All
                        </button>
                      )
                    )}
                </div>
                
                <div className="flex flex-wrap gap-4 items-center">
                   <button type="button" className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded text-[13px] font-medium text-slate-700 hover:bg-slate-50">
                      <PlusCircle size={14} className="text-blue-500" />
                      Add New
                   </button>
                   
                   {emailContacts.map(contact => (
                      <label key={contact.id} className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded cursor-pointer hover:bg-slate-50 transition-colors shadow-sm">
                         <input 
                           type="checkbox" 
                           checked={selectedEmailContacts.includes(contact.id)}
                           onChange={() => toggleEmailContact(contact.id)}
                           className="w-3.5 h-3.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                         />
                         <span className="text-[12px] text-slate-700 flex items-center gap-1.5 font-medium">
                            <User size={12} className="text-slate-400" />
                            {contact.name} &lt;{contact.email}&gt;
                         </span>
                      </label>
                   ))}
                   {emailContacts.length === 0 && (
                      <span className="text-[12px] text-slate-400 italic">No contacts available for this vendor</span>
                   )}
                </div>
                <div className="mt-6 pt-4 text-[12px] text-slate-500 border-t border-slate-50">
                   Additional Fields: Start adding custom fields for your purchase orders by going to Settings ➔ Purchases ➔ Purchase Orders.
                </div>
             </div>
          </div>
       </div>

       {/* ─── Bottom Actions ────────────────────────────────────── */}
       <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] flex items-center justify-between px-8 z-50">
          <div className="flex items-center gap-3">
             <button 
               onClick={() => handleSaveOrder(false)}
               disabled={isSaving}
               className="px-4 h-9 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 text-[13px] shadow-sm"
             >
                {isSaving ? 'Saving...' : 'Save'}
             </button>
             <button 
               onClick={() => handleSaveOrder(true)}
               disabled={isSaving}
               className="px-4 h-9 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-lg border border-slate-200 transition-colors disabled:opacity-50 text-[13px] shadow-sm"
             >
                Save and Send
             </button>
             <button 
               onClick={() => window.history.back()} 
               className="px-4 h-9 bg-white hover:bg-slate-50 text-slate-600 font-bold rounded-lg border border-slate-200 transition-colors text-[13px]"
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
              window.history.back();
            }}
            vendor={vendors.find(v => v.id === formData.vendorId)}
            poData={{...formData, id: savedPO?.id, poNumber: formData.poNumber, companyId}}
            totals={totals}
            attachments={attachments}
            selectedContacts={emailContacts.filter(c => selectedEmailContacts.includes(c.id))}
            companyName={currentCompany?.name || ''}
            onSent={() => {
              addNotification('Email sent successfully', 'success');
              window.history.back();
            }}
          />
        )}
    </div>
  );
};

export default PurchaseOrderEntryView;
