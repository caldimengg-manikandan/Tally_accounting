import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { 
  Plus, Trash2, ShoppingBag, PlusCircle, 
  ChevronDown, Search, Filter, MoreHorizontal,
  Clock, CheckCircle2, XCircle, Send,
  User, MapPin, Calendar, CreditCard, Truck,
  FileText, Tag, Link, Info, ArrowLeft, ArrowRight,
  Save, Send as SendIcon, UploadCloud, GripVertical, Paperclip,
  Image as ImageIcon, LayoutGrid, X, Settings, HelpCircle, MessageSquare, History, Package
} from 'lucide-react';
import { purchaseAPI, inventoryAPI, companyAPI, projectAPI, voucherAPI } from '../../services/api';
import ConfigurePaymentTermsModal from './ConfigurePaymentTermsModal';
import CreateAccountModal from './CreateAccountModal';
import VendorForm from './VendorForm';
import PurchaseDeliveryAddressModal from './PurchaseDeliveryAddressModal';
import CreateItemModal from '../inventory/CreateItemModal';
import PurchaseOrderEmailModal from './PurchaseOrderEmailModal';
import { COUNTRY_CODES } from '../../utils/countryCodes';
import { getGstinStateName } from '../../utils/gstinUtils';

const BillEntryView = ({ companyId }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { search } = useLocation();
  const queryParams = useMemo(() => new URLSearchParams(search), [search]);
  const queryVendorId = queryParams.get('vendorId');
  // ── Form State ──────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    vendorName: '',
    vendorId: '',
    deliveryAddress: 'Organization',
    deliveryAddressText: 'No. 42, Innovation Hub,\nBangalore, Karnataka, 560001\nIndia',
    billNumber: '',
    reference: '',
    date: new Date().toISOString().split('T')[0],
    deliveryDate: '',
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
  const [projects, setProjects] = useState([]);
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
  const [currentCompany, setCurrentCompany] = useState(null);
  
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

  const [poDeliveryDate, setPoDeliveryDate] = useState('');
  const [isDataLoaded, setIsDataLoaded] = useState(!id);
  const hasCalculatedRef = useRef(false);

  const calculateDueDate = (billDateStr, paymentTerm) => {
    if (!billDateStr) return '';
    const date = new Date(billDateStr);
    if (isNaN(date.getTime())) return '';
    
    if (paymentTerm === 'Due on Receipt') {
      return billDateStr;
    } else if (paymentTerm === 'Net 15') {
      date.setDate(date.getDate() + 15);
    } else if (paymentTerm === 'Net 30') {
      date.setDate(date.getDate() + 30);
    } else if (paymentTerm === 'Net 45') {
      date.setDate(date.getDate() + 45);
    } else if (paymentTerm === 'Net 60') {
      date.setDate(date.getDate() + 60);
    } else if (paymentTerm === 'Due end of the month') {
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      return endOfMonth.toISOString().split('T')[0];
    } else if (paymentTerm === 'Due end of next month') {
      const endOfNextMonth = new Date(date.getFullYear(), date.getMonth() + 2, 0);
      return endOfNextMonth.toISOString().split('T')[0];
    } else {
      const match = paymentTerm && paymentTerm.match(/\d+/);
      if (match) {
        const days = parseInt(match[0], 10);
        date.setDate(date.getDate() + days);
      } else {
        return billDateStr;
      }
    }
    return date.toISOString().split('T')[0];
  };

  useEffect(() => {
    if (!isDataLoaded) return;

    if (id && !hasCalculatedRef.current) {
      hasCalculatedRef.current = true;
      return;
    }

    if (formData.date && formData.paymentTerms) {
      const computed = calculateDueDate(formData.date, formData.paymentTerms);
      setFormData(prev => ({
        ...prev,
        deliveryDate: computed
      }));
    }
  }, [formData.date, formData.paymentTerms, isDataLoaded, id]);

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

  const getVendorBillingAddress = (vendor) => {
    if (!vendor) return null;
    try {
      if (vendor.billingAddressJson) return JSON.parse(vendor.billingAddressJson);
      if (vendor.billingAddress) {
        if (vendor.billingAddress.trim().startsWith('{')) {
          return JSON.parse(vendor.billingAddress);
        } else {
          return { street1: vendor.billingAddress };
        }
      }
      return null;
    } catch { 
      return vendor.billingAddress ? { street1: vendor.billingAddress } : null;
    }
  };
  
  // ── Context Data ────────────────────────────────────────────────
  useEffect(() => {
    if (companyId) {
      purchaseAPI.getVendors(companyId).then(res => {
        console.log("Vendors loaded:", res.data?.length);
        setVendors(res.data || []);
      }).catch(err => console.error("Failed to fetch vendors:", err?.response?.status, err?.response?.data?.error || err.message));
      projectAPI.getByCompany(companyId).then(res => setProjects(res.data || []));
      inventoryAPI.getByCompany(companyId, 'purchase').then(res => {
        setInventoryItems(res.data || []);
      });
      companyAPI.getById(companyId).then(res => {
        setCurrentCompany(res.data);
      });
    }
  }, [companyId]);

  useEffect(() => {
    if (queryVendorId && vendors.length > 0) {
      const match = vendors.find(v => String(v.id) === String(queryVendorId));
      if (match) {
        setFormData(prev => ({
          ...prev,
          vendorId: match.id,
          vendorName: match.name,
          paymentTerms: match.paymentTerms || 'Due on Receipt'
        }));
        setSelectedVendor(match);
      }
    }
  }, [queryVendorId, vendors]);

  // Load Purchase Order details if converting from a PO
  useEffect(() => {
    const poId = queryParams.get('poId');
    if (poId && companyId && vendors.length > 0) {
      purchaseAPI.getOrders(companyId).then(res => {
        const po = (res.data || []).find(o => String(o.id) === String(poId));
        if (po) {
          const vendor = vendors.find(v => String(v.id) === String(po.LedgerId));
          setSelectedVendor(vendor || null);
          
          let poItems = [];
          try {
            poItems = po.itemsJson ? JSON.parse(po.itemsJson) : [];
          } catch (e) {
            console.error('Failed to parse PO itemsJson:', e);
          }

          setPoDeliveryDate(po.deliveryDate || '');

          setFormData(prev => ({
            ...prev,
            vendorId: po.LedgerId || '',
            vendorName: vendor?.name || '',
            reference: po.orderNumber || '', // PO Number links to Bill's reference (Order Number)
            projectId: po.ProjectId || '',
            notes: po.notes || '',
            discount: parseFloat(po.discount || 0),
            adjustment: parseFloat(po.adjustment || 0),
            taxRate: parseFloat(po.taxRate || 0),
            tdsRate: parseFloat(po.tdsRate || 0),
            tdsName: po.tdsName || '',
            paymentTerms: vendor?.paymentTerms || 'Due on Receipt'
          }));

          if (poItems.length > 0) {
            setItems(poItems.map((item, idx) => ({
              id: Date.now() + idx,
              itemName: item.itemName || '',
              account: item.account || 'Cost of Goods Sold',
              qty: parseFloat(item.qty || 1),
              rate: parseFloat(item.rate || 0),
              amount: parseFloat(item.amount || 0),
              hsnCode: item.hsnCode || '',
              gstRate: item.gstRate !== undefined ? item.gstRate : 18
            })));
          }
        }
      }).catch(err => {
        console.error('Failed to fetch PO details:', err);
      });
    }
  }, [companyId, queryParams, vendors]);

  useEffect(() => {
    if (id && companyId) {
      voucherAPI.getById(id).then(res => {
        const voucher = res.data;
        if (voucher) {
          let notes = '';
          let itemsList = [];
          let reference = '';
          let taxRate = 0;
          let tdsRate = 0;
          let tdsName = '';
          let discount = 0;
          let adjustment = 0;
          let dueDate = '';
          let paymentTerms = 'Due on Receipt';
          try {
            if (voucher.narration) {
              const parsed = JSON.parse(voucher.narration);
              notes = parsed.notes || '';
              itemsList = parsed.items || [];
              reference = parsed.reference || '';
              taxRate = parsed.taxRate || 0;
              tdsRate = parsed.tdsRate || 0;
              tdsName = parsed.tdsName || '';
              discount = parsed.discount || 0;
              adjustment = parsed.adjustment || 0;
              dueDate = parsed.dueDate || parsed.deliveryDate || '';
              paymentTerms = parsed.paymentTerms || 'Due on Receipt';
            }
          } catch (e) {
            console.error('Failed to parse narration JSON:', e);
          }

          // Find vendor credit transaction (Credit to vendor ledger)
          const crTx = voucher.Transactions?.find(t => parseFloat(t.credit || 0) > 0);

          // Dynamic Fallback Derivation for older bills that do not have rates in narration
          if (!taxRate || !tdsRate || !discount || !adjustment) {
            const purchaseAmount = voucher.Transactions?.reduce((sum, t) => {
              const isGst = t.Ledger?.name?.toUpperCase().includes('GST');
              const isTds = t.Ledger?.name?.toUpperCase().includes('TDS');
              const isAdj = t.Ledger?.name?.toUpperCase().includes('ROUNDING') || t.Ledger?.name?.toUpperCase().includes('ADJUSTMENT');
              if (parseFloat(t.debit || 0) > 0 && !isGst && !isTds && !isAdj) {
                return sum + parseFloat(t.debit);
              }
              return sum;
            }, 0) || 0;

            if (purchaseAmount > 0) {
              if (!taxRate) {
                const gstTx = voucher.Transactions?.find(t => t.Ledger?.name?.toUpperCase().includes('GST'));
                if (gstTx) {
                  const gstVal = parseFloat(gstTx.debit || gstTx.credit || 0);
                  taxRate = Math.round((gstVal / purchaseAmount) * 100);
                }
              }
              if (!tdsRate) {
                const tdsTx = voucher.Transactions?.find(t => t.Ledger?.name?.toUpperCase().includes('TDS'));
                if (tdsTx) {
                  const tdsVal = parseFloat(tdsTx.debit || tdsTx.credit || 0);
                  tdsRate = Math.round((tdsVal / purchaseAmount) * 100);
                  tdsName = tdsTx.Ledger?.name || '';
                }
              }
              if (!discount) {
                const discountTx = voucher.Transactions?.find(t => t.Ledger?.name?.toUpperCase().includes('DISCOUNT'));
                if (discountTx) {
                  const discVal = parseFloat(discountTx.debit || discountTx.credit || 0);
                  discount = Math.round((discVal / (purchaseAmount + discVal)) * 100);
                }
              }
            }

            if (!adjustment) {
              const adjTx = voucher.Transactions?.find(t => t.Ledger?.name?.toUpperCase().includes('ROUNDING') || t.Ledger?.name?.toUpperCase().includes('ADJUSTMENT'));
              if (adjTx) {
                const debitVal = parseFloat(adjTx.debit || 0);
                const creditVal = parseFloat(adjTx.credit || 0);
                adjustment = debitVal > 0 ? debitVal : -creditVal;
              }
            }
          }
          
          setFormData(prev => ({
            ...prev,
            billNumber: voucher.voucherNumber || prev.billNumber,
            date: voucher.date ? voucher.date.split('T')[0] : prev.date,
            reference: reference || prev.reference,
            notes: notes || prev.notes,
            projectId: voucher.projectId || prev.projectId,
            vendorId: crTx ? crTx.LedgerId : prev.vendorId,
            vendorName: crTx && crTx.Ledger ? crTx.Ledger.name : prev.vendorName,
            taxRate: parseFloat(taxRate),
            tdsRate: parseFloat(tdsRate),
            tdsName: tdsName,
            discount: parseFloat(discount),
            adjustment: parseFloat(adjustment),
            deliveryDate: dueDate ? dueDate.split('T')[0] : prev.deliveryDate,
            paymentTerms: paymentTerms || prev.paymentTerms
          }));

          if (itemsList && itemsList.length > 0) {
            setItems(itemsList.map((item, idx) => ({
              id: item.id || Date.now() + idx,
              itemName: item.itemName || '',
              account: item.account || '',
              qty: item.qty || 1,
              rate: item.rate || 0,
              amount: item.amount || 0,
              hsnCode: item.hsnCode || '',
              gstRate: item.gstRate !== undefined ? item.gstRate : 18
            })));
          }
          setIsDataLoaded(true);
        }
      }).catch(err => {
        console.error('Error fetching bill details:', err);
        setIsDataLoaded(true);
      });
    }
  }, [id, companyId]);

  useEffect(() => {
    if (vendors.length > 0 && formData.vendorId) {
      const match = vendors.find(v => v.id === formData.vendorId);
      if (match) {
        setSelectedVendor(match);
      }
    }
  }, [vendors, formData.vendorId]);

  const handleItemSelect = (rowId, invItem) => {
    setItems(items.map(it => {
      if (it.id === rowId) {
        return {
          ...it,
          itemName: invItem.name,
          rate: invItem.costPrice || invItem.sellingPrice || 0,
          account: invItem.purchaseAccount || it.account || 'Cost of Goods Sold',
          amount: (invItem.costPrice || invItem.sellingPrice || 0) * it.qty,
          hsnCode: invItem.hsnCode || '',
          gstRate: invItem.gstRate !== undefined ? invItem.gstRate : 18
        };
      }
      return it;
    }));
    if (invItem.gstRate !== undefined) {
      setFormData(prev => ({
        ...prev,
        taxRate: parseFloat(invItem.gstRate)
      }));
    }
    setOpenItemDropdown(null);
  };

  const handleItemCreatedSuccess = (newItem) => {
    setInventoryItems(prev => [...prev, newItem]);
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
      if (itemDropdownRef.current && !itemDropdownRef.current.contains(event.target)) {
        setOpenItemDropdown(null);
      }
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(event.target)) {
        setOpenAccountDropdown(null);
      }
      if (attachmentRef.current && !attachmentRef.current.contains(event.target)) {
        setIsAttachmentListOpen(false);
      }
      if (termsDropdownRef.current && !termsDropdownRef.current.contains(event.target)) {
        setIsTermsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Calculations ────────────────────────────────────────────────
  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + (item.qty * item.rate), 0);
    const discountAmount = (subtotal * (formData.discount / 100));
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = (taxableAmount * (formData.taxRate / 100));
    const tdsAmount = (taxableAmount * (formData.tdsRate / 100));
    const total = taxableAmount + taxAmount - tdsAmount + parseFloat(formData.adjustment || 0);

    return { subtotal, discountAmount, taxableAmount, taxAmount, tdsAmount, total };
  }, [items, formData.discount, formData.taxRate, formData.tdsRate, formData.adjustment]);

  const gstDetails = useMemo(() => {
    if (!formData.taxRate) return null;

    const vendorGstin = selectedVendor?.gstNumber;
    const companyGstin = currentCompany?.gstNumber;

    const getGstinStateCode = (gstin) => (gstin && gstin.length >= 2 ? gstin.substring(0, 2) : null);
    const vendorStateCode = getGstinStateCode(vendorGstin);
    const companyStateCode = getGstinStateCode(companyGstin);

    let isSameState = false;
    let isUnregistered = !vendorGstin;

    if (vendorStateCode && companyStateCode) {
      isSameState = vendorStateCode === companyStateCode;
    } else {
      const vendorState = selectedVendor?.state || (getVendorBillingAddress(selectedVendor)?.state) || '';
      const companyState = currentCompany?.state || '';
      if (vendorState && companyState) {
        isSameState = vendorState.toLowerCase().trim() === companyState.toLowerCase().trim();
      } else {
        isSameState = true;
      }
    }

    const halfRate = (formData.taxRate / 2).toFixed(1);
    const halfTaxAmount = (totals.taxAmount / 2).toFixed(2);

    return {
      isSameState,
      isUnregistered,
      halfRate,
      halfTaxAmount,
      vendorStateCode,
      companyStateCode
    };
  }, [formData.taxRate, selectedVendor, currentCompany, totals.taxAmount]);

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

  const handleSaveOrder = async (statusOrSendEmail = 'draft') => {
    if (!formData.vendorId) {
      alert('Please select a vendor');
      return;
    }
    if (!formData.billNumber || !formData.billNumber.trim()) {
      alert('Please enter a Bill number');
      return;
    }
    if (items.some(item => !item.itemName || item.qty <= 0)) {
      alert('Please ensure all items have a name and quantity');
      return;
    }

    // Determine the save status
    let billStatus = 'Draft';
    if (statusOrSendEmail === true || statusOrSendEmail === 'open') {
      billStatus = 'Open';
    } else if (statusOrSendEmail === 'sent') {
      billStatus = 'Sent';
    }

    setIsSaving(true);
    try {
      const payload = {
        billNumber: formData.billNumber,
        reference: formData.reference,
        date: formData.date,
        totalAmount: totals.total,
        taxAmount: totals.taxAmount,
        tdsAmount: totals.tdsAmount,
        discountAmount: totals.discountAmount,
        adjustment: parseFloat(formData.adjustment || 0),
        taxRate: formData.taxRate,
        tdsRate: formData.tdsRate,
        tdsName: formData.tdsName,
        discount: formData.discount,
        status: billStatus,
        notes: formData.notes,
        supplierLedgerId: formData.vendorId,
        companyId,
        items,
        projectId: formData.projectId || null,
        dueDate: formData.deliveryDate || '',
        paymentTerms: formData.paymentTerms || 'Due on Receipt',
        poId: queryParams.get('poId') || null
      };

      const res = id 
        ? await purchaseAPI.updateBill(id, payload)
        : await purchaseAPI.createBill(payload);
      const savedData = res.data;
      setSavedPO(savedData);
      
      const targetId = savedData?.id || savedData?.voucher?.id;
      navigate('/bills', { state: { selectedBillId: targetId } });
    } catch (err) {
      console.error('Error saving Bill:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to save Bill. Please try again.';
      alert('Error: ' + errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    const backTo = queryParams.get('backTo');
    const vendorId = queryParams.get('vendorId');
    if (backTo === 'vendors' && vendorId) {
      navigate(`/vendors/view/${vendorId}`);
    } else {
      navigate('/bills');
    }
  };

  return (
    <div className="bg-white min-h-screen text-[13px] text-slate-800 font-medium pb-24">
       {/* Top Bar */}
       <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
             <ShoppingBag size={20} className="text-slate-800" />
             <h1 className="text-[18px] text-slate-800">{id ? 'Edit Bill' : 'New Bill'}</h1>
          </div>
          <div className="flex items-center gap-3">
             {selectedVendor && (
                <button
                  onClick={() => setIsVendorDetailsOpen(!isVendorDetailsOpen)}
                  className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white text-[13px] font-medium rounded hover:bg-blue-700 transition-colors shadow-sm"
                >
                   {selectedVendor.name}'s Details
                   <ArrowRight size={14} />
                </button>
             )}
             <button onClick={handleCancel} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
             </button>
          </div>
       </div>

       <div className="flex relative">
          <div className="flex-1 px-8 py-6 max-w-[1200px]">
             {/* Form Grid */}
             <div className="grid grid-cols-[180px_1fr] gap-y-6 items-start max-w-4xl">
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
                              className="w-full h-9 px-3 pr-8 border border-slate-300 rounded-l text-slate-800 focus:border-blue-500 outline-none"
                            />
                            <ChevronDown size={14} className="absolute right-3 top-2.5 text-slate-400 cursor-pointer" />
                         </div>
                         <button className="h-9 w-9 bg-blue-600 text-white rounded-r flex items-center justify-center hover:bg-blue-700 transition-colors border-y border-r border-blue-600">
                            <Search size={14} />
                         </button>
                      </div>
                      {selectedVendor && (
                          <div className="flex items-center justify-center border border-emerald-500 text-emerald-600 bg-emerald-50 px-2.5 h-7 rounded text-[11px] font-bold tracking-wider uppercase animate-fade-in">
                             {selectedVendor.currency || 'INR'}
                          </div>
                       )}
                   </div>

                   {selectedVendor && (() => {
                      const addr = getVendorBillingAddress(selectedVendor);
                      return (
                         <div className="mt-2 max-w-[400px]">
                            <div className="text-[11px] font-bold text-blue-600 uppercase tracking-wider mb-0.5">BILLING ADDRESS</div>
                            {addr && (addr.street1 || addr.address1 || addr.city) ? (
                               <div className="text-[12px] text-slate-600 leading-relaxed">
                                  {addr.attention && <div>{addr.attention}</div>}
                                  {(addr.street1 || addr.address1) && <div>{addr.street1 || addr.address1}</div>}
                                  {(addr.street2 || addr.address2) && <div>{addr.street2 || addr.address2}</div>}
                                  {(addr.city || addr.state || addr.pinCode || addr.zipCode || addr.zip) && (
                                     <div>{[addr.city, addr.state, addr.pinCode || addr.zipCode || addr.zip].filter(Boolean).join(', ')}</div>
                                  )}
                                  {addr.country && <div>{addr.country}</div>}
                               </div>
                            ) : (
                               <button className="text-[12px] text-blue-500 hover:text-blue-700 hover:underline font-medium">New Address</button>
                            )}
                         </div>
                      );
                   })()}

                   {isVendorDropdownOpen && (
                      <div className="absolute top-[calc(100%+4px)] left-0 w-[360px] bg-white border border-slate-200 rounded-md shadow-lg z-50 flex flex-col">
                         <div className="max-h-[200px] overflow-y-auto py-1 custom-scrollbar">
                            {filteredVendors.map(vendor => (
                               <div key={vendor.id} onClick={() => {
                                  setFormData({ 
                                     ...formData, 
                                     vendorId: vendor.id, 
                                     vendorName: vendor.name,
                                     paymentTerms: vendor.paymentTerms || 'Due on Receipt'
                                  });
                                  setSelectedVendor(vendor);
                                  setVendorSearch('');
                                  setIsVendorDropdownOpen(false);
                               }} className="px-4 py-2 hover:bg-blue-50 text-[13px] text-slate-700 cursor-pointer">
                                  {vendor.name}
                               </div>
                            ))}
                         </div>
                         <div className="border-t border-slate-200">
                            <button onClick={() => setIsVendorModalOpen(true)} className="w-full px-4 py-2 flex items-center gap-2 text-[13px] font-medium text-blue-500 hover:bg-slate-50 transition-colors">
                               <PlusCircle size={16} /> <span>New Vendor</span>
                            </button>
                         </div>
                      </div>
                   )}
                </div>

                <label className="text-red-500 pt-2"><span className="text-slate-700">Bill#</span>*</label>
                <input type="text" value={formData.billNumber} onChange={(e) => setFormData({ ...formData, billNumber: e.target.value })} className="w-full max-w-[400px] h-9 px-3 border border-slate-300 rounded text-slate-800 focus:border-blue-500 outline-none" />

                <label className="text-slate-700 pt-2">Order Number</label>
                <input type="text" value={formData.reference} onChange={(e) => setFormData({ ...formData, reference: e.target.value })} className="w-full max-w-[400px] h-9 px-3 border border-slate-300 rounded text-slate-800 focus:border-blue-500 outline-none" />

                <label className="text-slate-700 pt-2">Project</label>
                <div className="relative w-full max-w-[400px]">
                   <select 
                     value={formData.projectId} 
                     onChange={(e) => setFormData({ ...formData, projectId: e.target.value })} 
                     className="w-full h-9 px-3 border border-slate-300 rounded text-slate-800 focus:border-blue-500 outline-none bg-white appearance-none pr-8"
                   >
                      <option value="">Select or associate project</option>
                      {projects.map(p => (
                         <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                   </select>
                   <ChevronDown size={14} className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
                </div>

                <label className="text-red-500 pt-2"><span className="text-slate-700">Bill Date</span>*</label>
                <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full max-w-[400px] h-9 px-3 border border-slate-300 rounded text-slate-800 focus:border-blue-500 outline-none" />

                <label className="text-slate-700 pt-2">Due Date</label>
                <div className="flex items-center gap-6 max-w-2xl">
                   <input type="date" value={formData.deliveryDate} onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })} className="w-[280px] h-9 px-3 border border-slate-300 rounded text-slate-800 focus:border-blue-500 outline-none" />
                   <div className="flex items-center gap-4">
                      <span className="text-slate-700 font-medium whitespace-nowrap px-4">Payment Terms</span>
                      <div className="relative w-[180px]" ref={termsDropdownRef}>
                         <button onClick={() => { setIsTermsDropdownOpen(!isTermsDropdownOpen); setTermsSearchTerm(''); }} className={`w-full h-9 px-3 flex items-center justify-between border rounded text-left outline-none ${isTermsDropdownOpen ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-300 text-slate-800'}`}>
                            <span className="text-[13px]">{formData.paymentTerms || 'Select terms...'}</span>
                            <ChevronDown size={14} className={`text-blue-500 transition-transform ${isTermsDropdownOpen ? 'rotate-180' : ''}`} />
                         </button>
                         {isTermsDropdownOpen && (
                            <div className="absolute top-full left-0 mt-1 w-[280px] bg-white border border-slate-200 rounded lg shadow-lg z-50 overflow-hidden">
                               <div className="p-2 border-b border-slate-100">
                                  <div className="relative">
                                     <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                                     <input type="text" value={termsSearchTerm} onChange={(e) => setTermsSearchTerm(e.target.value)} placeholder="Search" className="w-full pl-8 pr-3 py-1.5 border border-slate-300 text-slate-800 rounded focus:outline-none focus:border-blue-500 text-[13px]" autoFocus />
                                  </div>
                               </div>
                               <div className="max-h-48 overflow-y-auto py-1 custom-scrollbar">
                                  {filteredTerms.map((term, index) => (
                                     <button key={index} onClick={() => { setFormData({ ...formData, paymentTerms: term }); setIsTermsDropdownOpen(false); }} className={`w-full text-left px-3 py-2 text-[13px] flex flex-row items-center justify-between hover:bg-slate-50 transition-colors ${formData.paymentTerms === term ? 'bg-blue-50 text-slate-800' : 'text-slate-700'}`}>
                                        {term} {formData.paymentTerms === term && <CheckCircle2 size={14} className="text-blue-500" />}
                                     </button>
                                  ))}
                               </div>
                            </div>
                         )}
                      </div>
                   </div>
                </div>
             </div>

             <div className="mt-10 mb-2 max-w-[1200px]">
                <button className="flex items-center gap-2 text-slate-600 font-medium hover:text-slate-900">
                   <Settings size={14} className="text-slate-400" /> At Transaction Level <ChevronDown size={12} className="text-slate-400" />
                </button>
             </div>

             {/* Item Table */}
             <div className="max-w-[1200px] border border-slate-200 rounded-t-md bg-white relative z-10">
                <div className="flex items-center bg-slate-50/80 border-b border-slate-200 p-2 px-3">
                   <h3 className="font-bold text-slate-800">Item Table</h3>
                </div>
                <div className="grid grid-cols-[2.5fr_2fr_1fr_1fr_1fr_40px] items-center border-b border-slate-200 bg-white">
                   <div className="px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest">ITEM DETAILS</div>
                   <div className="px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center">ACCOUNT</div>
                   <div className="px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">QUANTITY</div>
                   <div className="px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right flex items-center justify-end gap-1">RATE <LayoutGrid size={10} className="text-slate-400"/></div>
                   <div className="px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">AMOUNT</div>
                   <div></div>
                </div>
                <div className="divide-y divide-slate-100">
                   {items.map((item, index) => (
                      <div key={item.id} className="grid grid-cols-[2.5fr_2fr_1fr_1fr_1fr_40px] items-start hover:bg-slate-50/50 group/row relative min-h-[44px]">
                         <div className="absolute left-1 top-4 text-slate-300 opacity-0 group-hover/row:opacity-100 cursor-grab"><GripVertical size={14} /></div>
                         <div className="px-6 py-2 relative" ref={openItemDropdown === item.id ? itemDropdownRef : null}>
                            <textarea placeholder="Type or click to select an item." value={item.itemName} onClick={() => setOpenItemDropdown(openItemDropdown === item.id ? null : item.id)} onChange={(e) => { handleItemChange(item.id, 'itemName', e.target.value); setOpenItemDropdown(item.id); }} className={`w-full bg-transparent text-[13px] text-slate-800 resize-none h-[50px] px-2 py-1.5 outline-none border border-transparent rounded ${openItemDropdown === item.id ? 'border-blue-500 ring-1 ring-blue-500 bg-white' : 'hover:border-slate-300'}`} />
                            {(item.hsnCode || item.gstRate !== undefined) && (
                               <div className="flex gap-3 mt-0.5 px-2 text-[11px] font-medium text-slate-400">
                                  {item.hsnCode && <span>HSN/SAC: <strong className="text-slate-600">{item.hsnCode}</strong></span>}
                                  {item.gstRate !== undefined && <span>GST: <strong className="text-slate-600">{item.gstRate}%</strong></span>}
                               </div>
                            )}
                            {openItemDropdown === item.id && (
                               <div className="absolute top-full left-1 w-[400px] bg-white border border-slate-200 shadow-xl z-50 rounded overflow-hidden flex flex-col">
                                  <div className="max-h-[250px] overflow-y-auto custom-scrollbar flex-1">
                                     {inventoryItems.filter(inv => {
                                        const matchesSearch = inv.name.toLowerCase().includes((item.itemName || '').toLowerCase());
                                        const isPurchaseItem = inv.purchaseInformation !== false && inv.purchaseInformation !== 0 && inv.purchaseInformation !== 'false';
                                        return matchesSearch && isPurchaseItem;
                                     }).map(invItem => (
                                        <div key={invItem.id || invItem._id} onClick={() => handleItemSelect(item.id, invItem)} className={`px-4 py-2 text-[13px] cursor-pointer border-b border-slate-100 last:border-0 ${item.itemName === invItem.name ? 'bg-blue-500 text-white' : 'hover:bg-slate-50'}`}>
                                           <div className="font-medium">{invItem.name}</div>
                                           <div className={`text-[12px] ${item.itemName === invItem.name ? 'text-blue-100' : 'text-slate-500'}`}>Rate: ₹{(invItem.costPrice || 0).toLocaleString()}</div>
                                        </div>
                                     ))}
                                  </div>
                                  <div onClick={() => { setActiveRowForItemModal(item.id); setIsItemModalOpen(true); setOpenItemDropdown(null); }} className="px-4 py-3 bg-white border-t border-slate-100 flex items-center gap-2 text-[13px] font-medium text-blue-600 hover:bg-slate-50 cursor-pointer shrink-0">
                                     <PlusCircle size={14} /> Add New Item
                                  </div>
                               </div>
                            )}
                         </div>
                         <div className="px-3 py-2 border-l border-slate-100 relative" ref={openAccountDropdown === item.id ? accountDropdownRef : null}>
                            <div onClick={() => setOpenAccountDropdown(openAccountDropdown === item.id ? null : item.id)} className="w-full flex items-center justify-between text-[13px] cursor-pointer hover:bg-white border-b border-transparent hover:border-slate-300 px-1 py-1">
                               <span className={item.account ? 'text-slate-800 truncate' : 'text-slate-500'}>{item.account || 'Select an account'}</span>
                               <ChevronDown size={14} className="text-slate-400" />
                            </div>
                            {openAccountDropdown === item.id && (
                                <div className="absolute top-[80%] left-0 w-full min-w-[200px] bg-white border border-slate-200 shadow-xl z-50 rounded-md overflow-hidden flex flex-col font-normal">
                                   <div className="p-2 border-b border-slate-100 bg-slate-50/50">
                                      <div className="relative"><Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" /><input autoFocus placeholder="Search accounts..." value={accountSearchTerm} onChange={(e) => setAccountSearchTerm(e.target.value)} className="w-full pl-7 pr-2 py-1 text-[12px] outline-none border border-slate-200 rounded" /></div>
                                   </div>
                                   <div className="max-h-[220px] overflow-y-auto py-1 custom-scrollbar">
                                      {accountGroups.map(group => (
                                         <div key={group.category}>
                                            <div className="px-3 py-1 font-bold text-slate-400 bg-slate-50 text-[11px] uppercase">{group.category}</div>
                                            {group.accounts.filter(acc => acc.toLowerCase().includes(accountSearchTerm.toLowerCase())).map(acc => (
                                               <div key={acc} onClick={() => { handleItemChange(item.id, 'account', acc); setOpenAccountDropdown(null); setAccountSearchTerm(''); }} className={`px-4 py-1.5 text-[13px] cursor-pointer hover:bg-blue-600 hover:text-white ${item.account === acc ? 'bg-blue-50 text-blue-600' : ''}`}>{acc}</div>
                                            ))}
                                         </div>
                                      ))}
                                   </div>
                                </div>
                             )}
                         </div>
                         <div className="px-3 py-2 border-l border-slate-100"><input type="number" value={item.qty} onChange={(e) => handleItemChange(item.id, 'qty', e.target.value)} className="w-full bg-transparent text-[13px] text-right focus:bg-white px-1 py-1 outline-none border-b border-transparent focus:border-slate-300" /></div>
                         <div className="px-3 py-2 border-l border-slate-100"><input type="number" value={item.rate} onChange={(e) => handleItemChange(item.id, 'rate', e.target.value)} className="w-full bg-transparent text-[13px] text-right focus:bg-white px-1 py-1 outline-none border-b border-transparent focus:border-slate-300" /></div>
                         <div className="px-3 py-2 border-l border-slate-100 text-right font-medium py-3 text-slate-800">{Number(item.qty * item.rate).toFixed(2)}</div>
                         <div className="flex items-center justify-center pt-2.5">
                            <button onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover/row:opacity-100"><Trash2 size={16} /></button>
                         </div>
                      </div>
                   ))}
                </div>
             </div>

             <div className="max-w-[1200px] border border-t-0 border-slate-200 bg-white p-3 flex gap-4">
                <button onClick={addItem} className="text-[13px] font-medium text-slate-700 border border-slate-300 px-3 py-1 bg-slate-50 hover:bg-slate-100 rounded shadow-sm">Add Row</button>
             </div>

             {/* Summary Calculation Area */}
             <div className="max-w-[1200px] mt-6 flex justify-end">
                <div className="w-[450px] bg-slate-50 border border-slate-200 rounded-md p-4 space-y-4">
                    <div className="flex justify-between items-start text-slate-700">
                       <div className="flex flex-col">
                          <span className="text-[13px] font-bold text-slate-800">Sub Total</span>
                          <span className="text-[11px] font-bold text-blue-600 mt-0.5">Total Quantity : {items.reduce((sum, item) => sum + (parseFloat(item.qty) || 0), 0)}</span>
                       </div>
                       <span className="font-bold text-blue-600 text-[15px]">{(totals.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                   <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                         <span className="text-slate-600 text-[13px]">Discount</span>
                         <div className="flex items-center border border-slate-300 rounded bg-white overflow-hidden h-7 focus-within:border-blue-500 transition-all">
                            <input type="number" value={formData.discount} onChange={(e) => setFormData({ ...formData, discount: e.target.value })} className="w-16 px-2 text-right outline-none text-[13px]" />
                            <div className="px-2 bg-slate-100 border-l border-slate-300 text-slate-500 font-medium text-[11px] select-none">%</div>
                         </div>
                      </div>
                      <span className="font-medium text-red-500">{(totals.discountAmount).toFixed(2)}</span>
                   </div>
                   <div className="py-3 border-y border-slate-200/50 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                         <span className="text-slate-600 text-[13px] font-bold">GST</span>
                         <div className="flex-1 min-w-[160px]">
                            <select value={formData.taxRate} onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) })} className="w-full h-8 px-2 text-[12px] border border-slate-300 rounded focus:border-blue-500 outline-none bg-white appearance-none cursor-pointer pr-6 text-slate-700 font-medium" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.4rem center', backgroundSize: '1em' }}>
                               <option value="0">Select a Tax</option><option value="5">GST @ 5%</option><option value="12">GST @ 12%</option><option value="18">GST @ 18%</option><option value="28">GST @ 28%</option>
                            </select>
                         </div>
                      </div>
                      <div className="font-medium text-slate-800 text-[13px]">{totals.taxAmount.toFixed(2)}</div>
                   </div>

                   {gstDetails && (
                     <div className="pl-6 pb-2 text-[12px] space-y-1 text-slate-500 border-b border-slate-200/30 animate-fade-in">
                       {gstDetails.isUnregistered ? (
                         <div className="text-[11px] text-amber-600 font-bold bg-amber-50 px-2.5 py-1 rounded border border-amber-200 inline-block">
                           ⚠️ Unregistered Vendor (No ITC claim available)
                         </div>
                       ) : gstDetails.isSameState ? (
                         <div className="space-y-1">
                           <div className="flex justify-between pr-4">
                             <span>CGST @ {gstDetails.halfRate}%</span>
                             <span className="font-semibold text-slate-700">₹{gstDetails.halfTaxAmount}</span>
                           </div>
                           <div className="flex justify-between pr-4">
                             <span>SGST @ {gstDetails.halfRate}%</span>
                             <span className="font-semibold text-slate-700">₹{(totals.taxAmount - parseFloat(gstDetails.halfTaxAmount)).toFixed(2)}</span>
                           </div>
                         </div>
                       ) : (
                         <div className="flex justify-between pr-4">
                           <span>IGST @ {formData.taxRate}%</span>
                           <span className="font-semibold text-slate-700">₹{totals.taxAmount.toFixed(2)}</span>
                         </div>
                       )}
                     </div>
                   )}

                   {/* Standardized TDS Dropdown */}
                   <div className="py-3 border-b border-slate-200/50 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                         <span className="text-slate-600 text-[13px] font-bold">TDS</span>
                         <div className="relative min-w-[220px]" ref={tdsDropdownRef}>
                            <div onClick={() => { setIsTDSDropdownOpen(!isTDSDropdownOpen); setTdsSearchTerm(''); }} className={`w-full h-9 px-3 flex items-center justify-between border rounded bg-white cursor-pointer group transition-all ${isTDSDropdownOpen ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-300 hover:border-slate-400'}`}>
                               <span className={`text-[13px] truncate ${formData.tdsName ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>
                                  {formData.tdsName ? `${formData.tdsName} [${formData.tdsRate}%]` : 'Select a Tax'}
                               </span>
                               <ChevronDown size={14} className={`text-slate-400 transition-transform ${isTDSDropdownOpen ? 'rotate-180 text-blue-500' : ''}`} />
                            </div>
                            {isTDSDropdownOpen && (
                               <div className="absolute bottom-full left-0 mb-1 w-[320px] bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                                  <div className="p-2 border-b border-slate-100">
                                     <div className="relative"><Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" /><input autoFocus type="text" value={tdsSearchTerm} onChange={(e) => setTdsSearchTerm(e.target.value)} placeholder="Search" className="w-full pl-8 pr-3 py-1.5 text-[12px] outline-none border border-slate-200 rounded focus:border-blue-500" /></div>
                                  </div>
                                  <div className="max-h-[220px] overflow-y-auto py-1 custom-scrollbar text-left">
                                     <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Taxes</div>
                                     {filteredTdsOptions.map((opt, idx) => (
                                        <div key={idx} onClick={() => { setFormData({ ...formData, tdsRate: opt.rate, tdsName: opt.name }); setIsTDSDropdownOpen(false); }} className={`px-3 py-2 text-[13px] cursor-pointer flex items-center justify-between transition-colors ${formData.tdsName === opt.name ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-50'}`}>
                                           <span>{opt.name} [{opt.rate}%]</span>
                                           {formData.tdsName === opt.name && <CheckCircle2 size={14} className="text-white fill-white" />}
                                        </div>
                                     ))}
                                  </div>
                                  <div className="border-t border-slate-100 p-2 bg-slate-50/50"><button className="w-full py-1.5 flex items-center justify-start gap-2 text-blue-600 hover:text-blue-800 text-[12px] font-medium transition-colors"><Settings size={14} /> Manage TDS</button></div>
                               </div>
                            )}
                         </div>
                      </div>
                      <div className="font-medium text-slate-500 text-[13px]">-{totals.tdsAmount.toFixed(2)}</div>
                   </div>

                   <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2"><div className="px-2 py-1 border border-dashed border-slate-300 rounded text-slate-500 text-[11px] bg-white">Adjustment</div><input type="number" value={formData.adjustment} onChange={(e) => setFormData({ ...formData, adjustment: e.target.value })} className="w-24 h-8 px-2 border border-slate-300 rounded outline-none text-[13px] text-right focus:border-blue-500 transition-all font-medium text-slate-700" /></div>
                      <span className="font-medium text-slate-800">{(parseFloat(formData.adjustment || 0)).toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between items-center text-slate-800 pt-3 border-t-2 border-slate-200 mt-2">
                      <span className="font-bold text-[16px]">Total ( ₹ )</span><span className="font-bold text-[18px]">{(totals.total).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                   </div>
                </div>
             </div>

             <div className="mt-12 pb-10 border-t border-slate-100 pt-8">
                <div className="flex flex-col gap-4">
                   <h3 className="text-[14px] font-semibold text-slate-700">Attach File(s) to Bill</h3>
                   <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                         <div className="flex items-center border-2 border-dashed border-slate-200 rounded-lg p-0.5 hover:border-blue-300 hover:bg-blue-50/20 transition-all cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
                            <div className="flex items-center h-8 px-4 gap-2 text-slate-600 group-hover:text-blue-600 font-medium text-[13px]"><UploadCloud size={16} /><span>Upload File</span></div>
                            <div className="w-px h-5 bg-slate-200 mx-1"></div><div className="px-3 text-slate-400 group-hover:text-blue-500"><ChevronDown size={14} /></div>
                         </div>
                         <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileChange} />
                      </div>
                   </div>
                   {attachments.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-3">
                         {attachments.map(file => (
                            <div key={file.id} className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm hover:shadow-md transition-shadow group">
                               <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center text-blue-500"><FileText size={16} /></div>
                               <div className="flex flex-col min-w-[120px]"><span className="text-[12px] font-medium text-slate-700 truncate max-w-[200px]">{file.name}</span><span className="text-[10px] text-slate-400">{file.size}</span></div>
                               <button onClick={() => removeAttachment(file.id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"><X size={14} /></button>
                            </div>
                         ))}
                      </div>
                   )}
                </div>
             </div>
          </div>
       </div>

       <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 flex items-center justify-between px-8 z-50">
          <div className="flex items-center gap-3">
             {id ? (
               // Edit mode: Save + Cancel
               <>
                 <button
                   onClick={() => handleSaveOrder('open')}
                   disabled={isSaving}
                   className="px-5 h-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded transition-colors shadow-sm disabled:opacity-50"
                 >
                   {isSaving ? 'Saving...' : 'Save'}
                 </button>
                 <button onClick={handleCancel} className="px-5 h-8 bg-white hover:bg-slate-50 text-slate-600 font-semibold rounded border border-slate-300 transition-colors">Cancel</button>
               </>
             ) : (
               // Create mode: Save as Draft + Save as Open + Cancel
               <>
                 <button
                   onClick={() => handleSaveOrder('draft')}
                   disabled={isSaving}
                   className="px-5 h-8 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded border border-slate-300 transition-colors shadow-sm disabled:opacity-50"
                 >
                   {isSaving ? 'Saving...' : 'Save as Draft'}
                 </button>
                 <button
                   onClick={() => handleSaveOrder('open')}
                   disabled={isSaving}
                   className="px-5 h-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded transition-colors shadow-sm disabled:opacity-50"
                 >
                   {isSaving ? 'Saving...' : 'Save as Open'}
                 </button>
                 <button onClick={handleCancel} className="px-5 h-8 bg-white hover:bg-slate-50 text-slate-600 font-semibold rounded border border-slate-300 transition-colors">Cancel</button>
               </>
             )}
          </div>
       </div>

       {isVendorModalOpen && <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[100] p-6 animate-in fade-in"><div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl h-[90vh] overflow-hidden flex flex-col slide-in-from-bottom-4 animate-in duration-300"><div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50"><h2 className="text-[16px] font-bold text-slate-800 flex items-center gap-2"><User size={18} className="text-blue-600" /> Create New Vendor</h2><button onClick={() => setIsVendorModalOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors"><X size={16} /></button></div><div className="flex-1 overflow-y-auto custom-scrollbar bg-[#f8fafc]"><VendorForm standalone={false} onCancel={() => setIsVendorModalOpen(false)} onSaveSuccess={(newVendor) => { if (companyId) { purchaseAPI.getVendors(companyId).then(res => { setVendors(res.data || []); if (newVendor && newVendor.id) { setFormData(prev => ({ ...prev, vendorId: newVendor.id, vendorName: newVendor.name })); } }); } setIsVendorModalOpen(false); }} /></div></div></div>}
       {isItemModalOpen && <CreateItemModal isOpen={isItemModalOpen} onClose={() => setIsItemModalOpen(false)} onSuccess={handleItemCreatedSuccess} companyId={companyId} />}
    </div>
  );
};

export default BillEntryView;
