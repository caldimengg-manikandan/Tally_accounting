import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Edit, Trash2, MoreHorizontal, Plus, Search, 
  Settings, Paperclip, Mail, Phone, Smartphone, MapPin, Globe, 
  Info, CreditCard, Clock, Activity, ArrowRight,
  ChevronDown, MessageSquare, History, FileText, Send, HelpCircle,
  Camera, Image as ImageIcon, X, LayoutDashboard, Share2,
  Sparkles, DollarSign, Printer, Download, Filter, Save, Loader2, MoreVertical,
  ChevronRight, Calendar, User, Users, Briefcase, Bold, Italic, Underline, Truck, CheckCircle2, AlertCircle, ChevronUp, Eye, Landmark, EyeOff
} from 'lucide-react';
import { 
  ledgerAPI, purchaseAPI, 
  voucherAPI, reportsAPI, companyAPI, mailAPI 
} from '../../services/api';
import useNotificationStore from '../../store/notificationStore';
import ConfirmModal from '../../components/ConfirmModal';
import ComposeMailModal from '../../components/ComposeMailModal';
import VendorOverviewSidebar from './VendorOverviewSidebar';
import { getCurrencyDisplay } from '../../utils/currencies';

const DetailRow = ({ label, value }) => (
  <div className="flex justify-between items-center py-1">
    <span className="text-[12px] font-bold text-slate-400 uppercase tracking-tight">{label}</span>
    <span className="text-[13px] font-bold text-slate-700">{value || '---'}</span>
  </div>
);

const VendorDetailView = ({ companyId }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [allLedgers, setAllLedgers] = useState([]); // Store full list for robust lookup
  const [selectedId, setSelectedId] = useState(id);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  const [mails, setMails] = useState([]);
  const [loadingMails, setLoadingMails] = useState(false);
  const [isComposeModalOpen, setIsComposeModalOpen] = useState(false);
  const { addNotification } = useNotificationStore();

  const user = useMemo(() => { 
    try { return JSON.parse(sessionStorage.getItem('user') || '{}'); } catch { return {}; } 
  }, []);
  
  // Data for tabs
  const [transactions, setTransactions] = useState({
    bills: [],
    payments: [],
    expenses: [],
    orders: [],
    recurringBills: [],
    recurringExpenses: [],
    vendorCredits: [],
    journals: []
  });
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [statementData, setStatementData] = useState(null);
  const [currentCompany, setCurrentCompany] = useState(null);
  const [statementFromDate, setStatementFromDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [statementToDate, setStatementToDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // UI state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNewTxnOpen, setIsNewTxnOpen] = useState(false);
  const [isEditingPaymentTerms, setIsEditingPaymentTerms] = useState(false);
  const [paymentTerms, setPaymentTerms] = useState('');
  const [isEditingBalance, setIsEditingBalance] = useState(false);
  const [openingBalance, setOpeningBalance] = useState('0');
  const [openSections, setOpenSections] = useState(['Bills', 'Bill Payments']);
  const [statusFilters, setStatusFilters] = useState({
    Bills: 'All', 'Bill Payments': 'All', Expenses: 'All', 'Recurring Bills': 'All',
    'Recurring Expenses': 'All', 'Purchase Orders': 'All', 'Vendor Credits': 'All', Journals: 'All'
  });
  const [activeStatusPopover, setActiveStatusPopover] = useState(null);

  const [isAddressDrawerOpen, setIsAddressDrawerOpen] = useState(false);
  const [addressType, setAddressType] = useState('billing'); // 'billing' or 'shipping'
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddForm, setQuickAddForm] = useState({ companyName: '', email: '', mobile: '', salutation: 'Mr.' });
  const [addressForm, setAddressForm] = useState({
    attention: '',
    country: 'India',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
    fax: ''
  });
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [showAccountNum, setShowAccountNum] = useState(false);
  const [bankErrors, setBankErrors] = useState([]);
  const [bankForm, setBankForm] = useState({ 
    accountHolderName: '', 
    bankName: '', 
    accountNumber: '', 
    reAccountNumber: '', 
    ifsc: '',
    branch: '',
    city: '',
    district: '',
    state: '',
    accountType: 'Current'
  });
  const [showFullAccount, setShowFullAccount] = useState(false);
  const [ifscDetails, setIfscDetails] = useState(null);
  const [ifscLoading, setIfscLoading] = useState(false);
  const [ifscError, setIfscError] = useState(false);
  const [isBankActionsOpen, setIsBankActionsOpen] = useState(false);
  const [isBankDeleteConfirmOpen, setIsBankDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    if (bankForm.ifsc && bankForm.ifsc.length === 11) {
      setIfscLoading(true);
      setIfscError(false);
      setIfscDetails(null);
      
      fetch(`https://ifsc.razorpay.com/${bankForm.ifsc.toUpperCase()}`)
        .then(res => {
          if (!res.ok) throw new Error('Invalid IFSC');
          return res.json();
        })
        .then(data => {
          setIfscDetails(data);
          // Auto-populate form fields when IFSC is valid
          setBankForm(prev => ({
            ...prev,
            bankName: data.BANK || prev.bankName,
            branch: data.BRANCH || prev.branch,
            city: data.CITY || prev.city,
            district: data.DISTRICT || prev.district,
            state: data.STATE || prev.state
          }));
        })
        .catch(() => {
          setIfscError(true);
        })
        .finally(() => {
          setIfscLoading(false);
        });
    } else {
      setIfscDetails(null);
      setIfscError(false);
    }
  }, [bankForm.ifsc]);
  
  const fileInputRef = useRef(null);
  const settingsRef = useRef(null);
  const newTxnRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setIsSettingsOpen(false);
      }
      if (newTxnRef.current && !newTxnRef.current.contains(e.target)) {
        setIsNewTxnOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const activeCompanyId = companyId || sessionStorage.getItem('companyId');

  const handleBankFormReset = () => {
    setBankForm({
      accountHolderName: '', 
      bankName: '', 
      accountNumber: '', 
      reAccountNumber: '', 
      ifsc: '',
      branch: '',
      city: '',
      district: '',
      state: '',
      accountType: 'Current'
    });
    setIfscDetails(null);
    setBankErrors([]);
  };

  const handleEditBank = () => {
    try {
      if (vendor.bankDetailsJson) {
        const existingBank = JSON.parse(vendor.bankDetailsJson);
        setBankForm({
          ...existingBank,
          reAccountNumber: '' // Keep empty during edit to force user re-verification
        });
        setIsBankModalOpen(true);
      }
    } catch (e) {
      addNotification('Error loading bank details for edit.', 'error');
    }
    setIsBankActionsOpen(false);
  };

  const handleDeleteBank = async () => {
    try {
      setLoading(true);
      await ledgerAPI.update(vendor.id, { 
        ...vendor,
        bankDetailsJson: null 
      });
      
      addNotification('Bank account details removed.', 'success');
      
      setAllLedgers(prev => prev.map(v => 
        v.id === vendor.id ? { ...v, bankDetailsJson: null } : v
      ));
      
      setIsBankDeleteConfirmOpen(false);
    } catch (err) {
      addNotification('Failed to remove bank details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Click outside to close settings
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 1. Fetch Company & Ledgers
  useEffect(() => {
    console.log("[VendorDetailView] activeCompanyId:", activeCompanyId);
    if (!activeCompanyId || activeCompanyId === 'null' || activeCompanyId === 'undefined') {
      console.warn("[VendorDetailView] No valid activeCompanyId found");
      setLoading(false);
      return;
    }
    const fetchData = async () => {
      try {
        setLoading(true);
        const [ledgersRes, companyRes] = await Promise.all([
          ledgerAPI.getByCompany(activeCompanyId),
          companyAPI.getById(activeCompanyId)
        ]);
        
        const allLedgersData = ledgersRes.data || [];
        console.log("[VendorDetailView] allLedgersData fetched:", allLedgersData);

        // Security check: if the URL ID does not belong to the active company,
        // deny access — never auto-switch company context via URL.
        if (id && !allLedgersData.some(l => String(l.id) === String(id))) {
          addNotification('This record does not belong to your active company. Please switch your workspace first.', 'error');
          navigate('/vendors');
          return;
        }
        setAllLedgers(allLedgersData);
        setCurrentCompany(companyRes.data);
      } catch (err) {
        console.error("[VendorDetailView] Failed to fetch data", err);
        addNotification(err.response?.data?.error || err.message || "Failed to fetch company vendor records", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeCompanyId, id]);

  // 1b. Derive vendors list based on full ledgers and currently selected ID
  const vendors = useMemo(() => {
    return allLedgers.filter(l => 
      l.Group?.name?.toLowerCase().includes('creditor') || 
      l.groupName?.toLowerCase().includes('creditor') ||
      String(l.id) === String(selectedId)
    );
  }, [allLedgers, selectedId]);

  useEffect(() => {
    if (id) setSelectedId(id);
  }, [id]);

  // 2. Data Fetching per Tab
  useEffect(() => {
    if (!selectedId || !activeCompanyId) return;

    const fetchTabData = async () => {
      try {
         if (activeTab === 'Transactions') {
           const [ordersRes, billsRes, expensesRes, vouchersRes] = await Promise.all([
             purchaseAPI.getOrders(activeCompanyId),
             purchaseAPI.getBills(activeCompanyId),
             purchaseAPI.getExpenses(activeCompanyId),
             voucherAPI.getByCompany(activeCompanyId)
           ]);

           setTransactions({
             bills: (billsRes.data || []).filter(b => String(b.LedgerId) === String(selectedId)),
             payments: (vouchersRes.data || []).filter(v => (v.voucherType === 'Payment' || v.type === 'Payment') && v.Transactions?.some(t => String(t.LedgerId) === String(selectedId))),
             expenses: (expensesRes.data || []).filter(e => String(e.Ledger?.id || '') === String(selectedId)),
             orders: (ordersRes.data || []).filter(o => String(o.LedgerId) === String(selectedId)),
             recurringBills: [],
             recurringExpenses: [],
             vendorCredits: [],
             journals: []
           });
         } else if (activeTab === 'Statement') {
           const res = await reportsAPI.ledgerStatement(selectedId, statementFromDate, statementToDate);
           setStatementData(res.data);
         } else if (activeTab === 'Comments') {
            const stored = localStorage.getItem(`vendor_comments_${selectedId}`);
            setComments(stored ? JSON.parse(stored) : []);
         }
      } catch (err) {
        console.error("Tab data fetch failed", err);
      }
    };
    fetchTabData();
  }, [activeTab, selectedId, activeCompanyId, statementFromDate, statementToDate]);

  const vendor = useMemo(() => {
    return allLedgers.find(v => String(v.id) === String(selectedId));
  }, [allLedgers, selectedId]);

  useEffect(() => {
    if (vendor) {
      setPaymentTerms(vendor.paymentTerms || 'Due on Receipt');
      setOpeningBalance(String(vendor.openingBalance || 0));
    }
  }, [vendor]);

  const handleUpdateField = async (field, value) => {
    try {
       const data = { ...vendor, [field]: value };
       if (field === 'openingBalance') data.currentBalance = parseFloat(value);
       await ledgerAPI.update(vendor.id, data);
       if (field === 'paymentTerms') setIsEditingPaymentTerms(false);
       if (field === 'openingBalance') setIsEditingBalance(false);
       setAllLedgers(prev => prev.map(v => v.id === vendor.id ? { ...v, [field]: value } : v));
    } catch (err) {
      addNotification(`Failed to update ${field}`, 'error');
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      await ledgerAPI.update(vendor.id, vendor);
      addNotification('Vendor profile saved successfully!', 'success');
    } catch (err) {
      addNotification('Failed to save profile changes.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVendorSelect = (vendorId) => {
    setSelectedId(String(vendorId));
    navigate(`/vendors/view/${vendorId}`);
  };

  const handleQuickAdd = async () => {
    if (!quickAddForm.companyName) return;
    setLoading(true);
    try {
        const payload = {
            ...quickAddForm,
            name: quickAddForm.companyName,
            companyId: activeCompanyId,
            groupName: 'Sundry Creditors',
            openingBalance: 0,
            currentBalance: 0
        };
        const res = await ledgerAPI.create(payload);
        const newVendor = res.data.ledger || res.data;
        setAllLedgers(prev => [...prev, newVendor]);
        setSelectedId(String(newVendor.id));
        navigate(`/vendors/view/${newVendor.id}`);
        setIsQuickAddOpen(false);
        setQuickAddForm({ companyName: '', email: '', mobile: '', salutation: 'Mr.' });
    } catch (err) {
        addNotification('Failed to register vendor', 'error');
    } finally {
        setLoading(false);
    }
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const authorName = user.name || (user.email ? user.email.split('@')[0].split('.')[0].charAt(0).toUpperCase() + user.email.split('@')[0].split('.')[0].slice(1) : 'Administrator');
    const comment = {
       id: Date.now(),
       text: newComment,
       author: authorName,
       date: new Date().toLocaleString()
    };
    const updated = [...comments, comment];
    setComments(updated);
    localStorage.setItem(`vendor_comments_${selectedId}`, JSON.stringify(updated));
    setNewComment('');
  };

  const handleDeleteVendor = () => {
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await ledgerAPI.delete(vendor.id);
      addNotification('Vendor deleted successfully', 'success');
      navigate('/vendors');
    } catch (err) {
      addNotification('Failed to delete vendor', 'error');
    } finally {
      setIsDeleteModalOpen(false);
    }
  };

  const fetchMails = useCallback(async () => {
    if (!selectedId) return;
    setLoadingMails(true);
    try {
      const response = await mailAPI.getByLedger(selectedId);
      setMails(response.data);
    } catch (err) {
      console.error('Failed to fetch mails:', err);
    } finally {
      setLoadingMails(false);
    }
  }, [selectedId]);

  useEffect(() => {
    if (activeTab === 'Mails') {
      fetchMails();
    }
  }, [activeTab, fetchMails]);

  const toggleSection = (name) => {
    setOpenSections(prev => prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name]);
  };

  const handleStatusChange = (section, status) => {
    setStatusFilters(prev => ({ ...prev, [section]: status }));
    setActiveStatusPopover(null);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const base64 = evt.target.result;
      try {
        await handleUpdateField('image', base64);
      } catch (err) {
        addNotification("Failed to save image", "error");
      }
    };
    reader.readAsDataURL(file);
  };

  const renderVendorTxnCells = (secName, row) => {
    const currencySym = getCurrencyDisplay(vendor?.currency);
    const formattedAmount = `${currencySym} ${parseFloat(row.totalAmount || row.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const statusCell = (status) => (
      <td className="px-6 py-3">
         <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${status === 'Sent' || status === 'Paid' || status === 'Active' || status === 'Confirmed' ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-400'}`}>
            {status || 'Draft'}
         </span>
      </td>
    );

    switch (secName) {
      case 'Bills':
        return (
          <>
            <td className="px-6 py-3">{row.date || 'N/A'}</td>
            <td className="px-6 py-3 font-bold text-blue-600">{row.billNumber || row.number || '---'}</td>
            <td className="px-6 py-3">{row.orderNumber || row.reference || '---'}</td>
            <td className="px-6 py-3">{vendor?.name || '---'}</td>
            <td className="px-6 py-3 font-bold text-slate-900">{formattedAmount}</td>
            <td className="px-6 py-3 font-medium text-slate-700">{currencySym} {parseFloat(row.balanceDue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            {statusCell(row.status)}
          </>
        );
      case 'Bill Payments':
        const vendorTx = row.Transactions?.find(t => String(t.LedgerId) === String(selectedId));
        const paymentAmount = vendorTx ? parseFloat(vendorTx.debit || 0) : 0;
        const cashBankTx = row.Transactions?.find(t => parseFloat(t.credit || 0) > 0);
        const paidThrough = cashBankTx?.Ledger?.name || '---';
        const formattedPaymentAmount = `${currencySym} ${paymentAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        return (
          <>
            <td className="px-6 py-3">{row.date ? new Date(row.date).toLocaleDateString('en-GB') : 'N/A'}</td>
            <td className="px-6 py-3 font-bold text-blue-600">{row.voucherNumber || row.number || '---'}</td>
            <td className="px-6 py-3">{row.reference || row.referenceNumber || '---'}</td>
            <td className="px-6 py-3">{paidThrough}</td>
            <td className="px-6 py-3 font-bold text-slate-900">{formattedPaymentAmount}</td>
            <td className="px-6 py-3 text-slate-500">{currencySym} 0.00</td>
            {statusCell(row.status || 'Paid')}
          </>
        );
      case 'Expenses':
        return (
          <>
            <td className="px-6 py-3">{row.date || 'N/A'}</td>
            <td className="px-6 py-3 font-medium text-slate-700">{row.expenseAccount || row.accountName || '---'}</td>
            <td className="px-6 py-3 font-bold text-blue-600">{row.invoiceNumber || row.number || '---'}</td>
            <td className="px-6 py-3">{vendor?.name || '---'}</td>
            <td className="px-6 py-3">{row.paidThrough || '---'}</td>
            <td className="px-6 py-3">{row.customerName || '---'}</td>
            <td className="px-6 py-3 font-bold text-slate-900">{formattedAmount}</td>
            {statusCell(row.status)}
          </>
        );
      case 'Recurring Bills':
        return (
          <>
            <td className="px-6 py-3 font-bold text-slate-800">{row.profileName || row.name || '---'}</td>
            <td className="px-6 py-3">{row.frequency || '---'}</td>
            <td className="px-6 py-3">{row.lastBillDate || '---'}</td>
            <td className="px-6 py-3">{row.nextBillDate || '---'}</td>
            {statusCell(row.status)}
          </>
        );
      case 'Recurring Expenses':
        return (
          <>
            <td className="px-6 py-3 font-bold text-slate-800">{row.profileName || row.name || '---'}</td>
            <td className="px-6 py-3">{row.expenseAccount || row.accountName || '---'}</td>
            <td className="px-6 py-3">{row.frequency || '---'}</td>
            <td className="px-6 py-3">{row.lastExpenseDate || '---'}</td>
            <td className="px-6 py-3">{row.nextExpenseDate || '---'}</td>
            {statusCell(row.status)}
          </>
        );
      case 'Purchase Orders':
        return (
          <>
            <td className="px-6 py-3 font-bold text-blue-600">{row.purchaseOrderNumber || row.number || '---'}</td>
            <td className="px-6 py-3">{row.referenceNumber || row.reference || '---'}</td>
            <td className="px-6 py-3">{row.date || 'N/A'}</td>
            <td className="px-6 py-3">{row.deliveryDate || row.dueDate || '---'}</td>
            <td className="px-6 py-3 font-bold text-slate-900">{formattedAmount}</td>
            {statusCell(row.status)}
          </>
        );
      case 'Vendor Credits':
        return (
          <>
            <td className="px-6 py-3">{row.date || 'N/A'}</td>
            <td className="px-6 py-3 font-bold text-blue-600">{row.creditNoteNumber || row.number || '---'}</td>
            <td className="px-6 py-3">{row.orderNumber || '---'}</td>
            <td className="px-6 py-3 text-slate-500">{currencySym} {parseFloat(row.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td className="px-6 py-3 font-bold text-slate-900">{formattedAmount}</td>
            {statusCell(row.status)}
          </>
        );
      case 'Journals':
        return (
          <>
            <td className="px-6 py-3">{row.date || 'N/A'}</td>
            <td className="px-6 py-3 font-bold text-blue-600">{row.journalNumber || row.number || '---'}</td>
            <td className="px-6 py-3">{row.referenceNumber || row.reference || '---'}</td>
            <td className="px-6 py-3 font-bold text-slate-900">{currencySym} {parseFloat(row.debit || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td className="px-6 py-3 font-bold text-slate-900">{currencySym} {parseFloat(row.credit || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </>
        );
      default:
        return null;
    }
  };

  if (loading && vendors.length === 0) {
    return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="flex h-[calc(100vh-80px)] bg-[#fbfcff] overflow-hidden">
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* ─── SIDEBAR ─────────────────────────────────────── */}
      <div className={`${id ? 'w-[350px]' : 'w-full'} border-r border-slate-200 bg-white flex flex-col shrink-0 transition-all duration-300`}>
        <div className="p-4 border-b border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            {/* Active Vendors Dropdown */}
            <div className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity">
              <span className="text-[17px] font-bold text-slate-900 tracking-tight">Active Vendors</span>
              <ChevronDown size={15} className="text-blue-600 mt-0.5 stroke-[2.5]" />
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsQuickAddOpen(true)} 
                className="w-8 h-8 rounded-lg bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm shadow-blue-100"
                title="New Vendor"
              >
                <Plus size={16} strokeWidth={3} />
              </button>
              <button 
                className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200/60 text-slate-700 flex items-center justify-center transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95"
                title="Options"
              >
                <MoreHorizontal size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>
          
          {/* Search bar */}
          <div className="relative">
             <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 stroke-[2]" />
             <input 
               type="text" 
               placeholder="Search Vendors" 
               className="w-full pl-9 pr-3 py-1.5 text-[13px] bg-slate-50/50 border border-slate-200/80 rounded outline-none transition-all focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-100" 
             />
          </div>
        </div>
        
        {/* Vendor List */}
        <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
          {vendors.length === 0 ? (
            <div className="p-10 text-center mt-20 space-y-2">
              <div className="text-[12px] text-slate-400 font-semibold uppercase tracking-widest opacity-45">NO VENDORS FOUND</div>
              <div className="text-[10px] font-mono text-slate-300">
                Company: {activeCompanyId || 'none'} | Ledgers: {allLedgers.length}
              </div>
            </div>
          ) : vendors.map(v => (
            <div 
              key={v.id} 
              onClick={() => handleVendorSelect(v.id)} 
              className={`px-5 py-4 cursor-pointer border-b border-slate-100/60 transition-all flex items-start gap-3.5 ${String(v.id) === String(selectedId) ? 'bg-[#f4f7fd]' : 'hover:bg-slate-50/60'}`}
            >
              {/* Checkbox on the left */}
              <div className="pt-0.5" onClick={e => e.stopPropagation()}>
                <input 
                  type="checkbox" 
                  checked={String(v.id) === String(selectedId)}
                  onChange={() => handleVendorSelect(v.id)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </div>

              {/* Text Stack on the right */}
              <div className="flex-1 min-w-0 space-y-0.5">
                <p className={`text-[14px] font-medium truncate ${String(v.id) === String(selectedId) ? 'text-slate-900 font-semibold' : 'text-slate-800'}`}>
                  {v.name}
                </p>
                <p className="text-[13px] font-medium text-slate-500 font-sans tracking-tight">
                  ₹{parseFloat(v.currentBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── MAIN CONTENT ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden shadow-2xl">
        {vendor ? (
          <>
            <header className="px-8 py-5 flex items-center justify-between border-b border-slate-50 bg-[#fbfcff]">
               <div className="flex items-center gap-4">
                  <button type="button" onClick={() => navigate('/vendors')} className="p-1.5 rounded hover:bg-slate-100 cursor-pointer relative z-10" title="Go back to vendors list">
                    <ChevronLeft size={18}/>
                  </button>
                  <h1 className="text-[20px] font-bold text-slate-900 tracking-tight">{vendor.name}</h1>
               </div>
               <div className="flex items-center gap-2.5">
                  <button onClick={handleSaveProfile} disabled={loading} className="px-6 py-2 bg-slate-900 text-white rounded-lg text-[13px] font-bold hover:bg-black shadow-xl shadow-slate-200 transition-all flex items-center gap-2 disabled:opacity-50">
                     {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16}/>}
                     {loading ? 'Saving...' : 'Save Profile'}
                  </button>
                  <div className="w-px h-6 bg-slate-200 mx-1"></div>
                  <button onClick={() => navigate(`/vendors/${vendor.id}`)} className="px-4 py-1.5 border border-slate-200 rounded text-[13px] font-bold text-slate-700 hover:bg-white shadow-sm">Edit</button>
                  <button className="p-2 border border-slate-200 rounded text-slate-400 hover:text-slate-600"><Paperclip size={16}/></button>
                  <div className="relative" ref={newTxnRef}>
                     <div className="bg-blue-600 text-white rounded-md flex items-center shadow-lg shadow-blue-100 overflow-hidden">
                        <button 
                          onClick={() => setIsNewTxnOpen(!isNewTxnOpen)}
                          className="px-5 py-2 text-[13px] font-bold border-r border-blue-500/30 hover:bg-blue-700 transition-colors"
                        >
                           New Transaction
                        </button>
                        <button 
                          onClick={() => setIsNewTxnOpen(!isNewTxnOpen)}
                          className="px-2 py-2 hover:bg-blue-700 transition-colors"
                        >
                           <ChevronDown size={16}/>
                        </button>
                     </div>
                     
                     {isNewTxnOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200/80 rounded-xl shadow-xl shadow-slate-200/50 z-50 p-1.5 animate-fade-down overflow-hidden">
                           <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">
                              Purchases
                           </div>
                           {[
                              { label: 'Bill', path: `/bills/new` },
                              { label: 'Bill Payment', path: `/bill-payments/new` },
                              { label: 'Expense', path: `/expenses/new` },
                              { label: 'Recurring Bill', path: `/recurring-bills/new` },
                              { label: 'Recurring Expense', path: `/recurring-expenses/new` },
                              { label: 'Purchase Order', path: `/purchase-orders/new` },
                              { label: 'Vendor Credit', path: `/vendor-credits/new` },
                              { label: 'Journal', path: `/journals/new` },
                              { label: 'Pay Bill via Check', path: `/pay-bill-check/new` }
                           ].map((item, idx) => (
                              <button 
                                 key={idx}
                                 onClick={() => {
                                    setIsNewTxnOpen(false);
                                    navigate(`${item.path}?vendorId=${vendor.id}&backTo=vendors`, {
                                       state: {
                                          vendorId: vendor.id,
                                          vendorName: vendor.name
                                       }
                                    });
                                 }}
                                 className="w-full text-left px-3 py-2 text-[13px] font-medium text-slate-700 rounded-lg hover:bg-blue-600 hover:text-white transition-all duration-150 flex items-center"
                              >
                                 {item.label}
                              </button>
                           ))}
                        </div>
                     )}
                  </div>
                  <button className="px-4 py-1.5 border border-slate-200 rounded text-[13px] font-bold text-slate-700 flex items-center gap-1.5 hover:bg-white shadow-sm">
                     More <ChevronDown size={14}/>
                  </button>
                  <button type="button" className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors duration-150 cursor-pointer relative z-10" onClick={() => navigate('/vendors')} title="Close and go back"><X size={20}/></button>
               </div>
            </header>

            <div className="px-8 border-b border-slate-100 flex gap-10">
               {['Overview', 'Comments', 'Transactions', 'Mails', 'Statement'].map(tab => (
                 <button key={tab} onClick={() => setActiveTab(tab)} className={`py-4 text-[14px] font-bold tracking-tight relative transition-all ${activeTab === tab ? 'text-blue-600' : 'text-slate-400 hover:text-slate-700'}`}>
                   {tab} {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-blue-600 rounded-t-full"></div>}
                 </button>
               ))}
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar bg-white">
              {activeTab === 'Comments' && (
                <div className="p-10 space-y-8 animate-fade-in max-w-4xl">
                   <div className="border border-slate-200 rounded-lg bg-slate-50/50 overflow-hidden shadow-sm">
                      <div className="p-3 border-b border-slate-200 flex gap-4 text-slate-400">
                         <button 
                           onMouseDown={(e) => { e.preventDefault(); document.execCommand('bold', false, null); }}
                           className="hover:text-slate-900 transition-colors"
                         >
                           <Bold size={16} />
                         </button>
                         <button 
                           onMouseDown={(e) => { e.preventDefault(); document.execCommand('italic', false, null); }}
                           className="hover:text-slate-900 transition-colors"
                         >
                           <Italic size={16} />
                         </button>
                         <button 
                           onMouseDown={(e) => { e.preventDefault(); document.execCommand('underline', false, null); }}
                           className="hover:text-slate-900 transition-colors"
                         >
                           <Underline size={16} />
                         </button>
                      </div>
                      <div 
                        contentEditable
                        onInput={e => setNewComment(e.currentTarget.innerHTML)}
                        onBlur={e => setNewComment(e.currentTarget.innerHTML)}
                        placeholder="Add a comment..." 
                        className="w-full p-4 min-h-[120px] bg-transparent outline-none text-[15px] text-slate-700 font-sans"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.ctrlKey) handleAddComment();
                        }}
                        ref={(el) => {
                          if (el && newComment === '') el.innerHTML = '';
                        }}
                      />
                      <div className="p-3 bg-white border-t border-slate-100">
                        <button onClick={handleAddComment} className="px-4 py-1.5 bg-white border border-slate-200 rounded text-[13px] font-bold text-slate-600 hover:bg-slate-50">Add Comment</button>
                      </div>
                   </div>
                   <div className="space-y-6">
                      <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">ALL COMMENTS</h3>
                      {comments.length > 0 ? (
                        <div className="space-y-6">
                           {comments.map(c => (
                             <div key={c.id} className="flex gap-4 group">
                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold border border-blue-100 uppercase">
                                  {(c.author === 'Antigravity User' || c.author?.includes('@') ? (user.name || (user.email ? user.email.split('@')[0].split('.')[0].charAt(0).toUpperCase() + user.email.split('@')[0].split('.')[0].slice(1) : 'Administrator')) : c.author)[0]}
                                </div>
                                <div className="flex-1 space-y-1">
                                   <div className="flex items-center gap-2">
                                      <span className="text-[13px] font-bold text-slate-800">
                                        {c.author === 'Antigravity User' || c.author?.includes('@') ? (user.name || (user.email ? user.email.split('@')[0].split('.')[0].charAt(0).toUpperCase() + user.email.split('@')[0].split('.')[0].slice(1) : 'Administrator')) : c.author}
                                      </span>
                                      <span className="text-[11px] text-slate-400 font-medium">{c.date}</span>
                                   </div>
                                   <div className="text-[14px] text-slate-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: c.text }} />
                                </div>
                             </div>
                           ))}
                        </div>
                      ) : (
                        <div className="text-center py-20 bg-slate-50/30 rounded-xl border border-dashed border-slate-100">
                           <MessageSquare size={32} className="mx-auto text-slate-200 mb-3" strokeWidth={1}/>
                           <p className="text-[14px] text-slate-400 italic">No comments yet.</p>
                        </div>
                      )}
                   </div>
                </div>
              )}

              {activeTab === 'Transactions' && (
                <div className="p-8 space-y-6 animate-fade-in relative">
                   <div className="flex items-center gap-1.5 text-[14px] text-blue-600 font-bold cursor-pointer hover:underline mb-4">
                      Go to transactions <ChevronDown size={14}/>
                   </div>

                   {[
                     { name: 'Bills', data: transactions.bills, cols: ['DATE', 'BILL#', 'ORDER NUMBER', 'VENDOR NAME', 'AMOUNT', 'BALANCE DUE', 'STATUS'] },
                     { name: 'Bill Payments', data: transactions.payments, cols: ['DATE', 'PAYMENT NUMBER', 'REFERENCE NUMBER', 'PAYMENT MODE', 'AMOUNT PAID', 'UNUSED AMOUNT', 'STATUS'] },
                     { name: 'Expenses', data: transactions.expenses, cols: ['DATE', 'EXPENSE ACCOUNT', 'INVOICE NUMBER', 'VENDOR NAME', 'PAID THROUGH', 'CUSTOMER NAME', 'AMOUNT', 'STATUS'] },
                     { name: 'Recurring Bills', data: transactions.recurringBills, cols: ['PROFILE NAME', 'FREQUENCY', 'LAST BILL DATE', 'NEXT BILL DATE', 'STATUS'] },
                     { name: 'Recurring Expenses', data: transactions.recurringExpenses, cols: ['PROFILE NAME', 'EXPENSE ACCOUNT', 'FREQUENCY', 'LAST EXPENSE DATE', 'NEXT EXPENSE DATE', 'STATUS'] },
                     { name: 'Purchase Orders', data: transactions.orders, cols: ['PURCHASE ORDER#', 'REFERENCE NUMBER', 'DATE', 'DELIVERY DATE', 'AMOUNT', 'STATUS'] },
                     { name: 'Vendor Credits', data: transactions.vendorCredits, cols: ['DATE', 'CREDIT NOTE NUMBER', 'ORDER NUMBER', 'BALANCE', 'AMOUNT', 'STATUS'] },
                     { name: 'Journals', data: transactions.journals, cols: ['DATE', 'JOURNAL NUMBER', 'REFERENCE NUMBER', 'DEBIT', 'CREDIT'] }
                   ].map(sec => {
                      const dataArray = sec.data || [];
                      const filteredData = statusFilters[sec.name] === 'All' 
                        ? dataArray 
                        : dataArray.filter(d => d.status === statusFilters[sec.name]);

                     return (
                       <div key={sec.name} className="border border-slate-100 rounded-lg overflow-hidden shadow-sm bg-white">
                          <div className="px-6 py-3 bg-slate-50/30 flex items-center justify-between cursor-pointer group hover:bg-slate-50 transition-colors" onClick={() => toggleSection(sec.name)}>
                             <div className="flex items-center gap-3">
                                <ChevronRight size={14} className={`text-slate-400 transition-transform ${openSections.includes(sec.name) ? 'rotate-90' : ''}`} />
                                <h3 className="text-[14px] font-bold text-slate-700 tracking-tight">{sec.name}</h3>
                             </div>
                             <div className="flex items-center gap-4" onClick={e => e.stopPropagation()}>
                                <div className="relative">
                                   <div 
                                     onClick={() => setActiveStatusPopover(activeStatusPopover === sec.name ? null : sec.name)}
                                     className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                                   >
                                      <Filter size={12}/> Status: <span className={statusFilters[sec.name] !== 'All' ? 'text-blue-600' : ''}>{statusFilters[sec.name]}</span> <ChevronDown size={11}/>
                                   </div>
                                   
                                   {activeStatusPopover === sec.name && (
                                     <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-2xl z-50 py-1 animate-fade-down overflow-hidden">
                                        {['All', 'Open', 'Overdue', 'Unpaid', 'Partially Paid', 'Paid', 'Void'].map(status => (
                                          <button 
                                            key={status} 
                                            onClick={() => handleStatusChange(sec.name, status)}
                                            className={`w-full text-left px-4 py-2 text-[12px] font-bold transition-colors ${statusFilters[sec.name] === status ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                                          >
                                            {status}
                                          </button>
                                        ))}
                                     </div>
                                   )}
                                </div>
                                <button className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800">
                                   <Plus size={14} strokeWidth={3}/> NEW
                                </button>
                             </div>
                          </div>
                          {openSections.includes(sec.name) && (
                            <div className="overflow-x-auto">
                               <table className="w-full text-left">
                                  <thead>
                                     <tr className="bg-white border-b border-slate-50">
                                        {sec.cols.map(c => <th key={c} className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{c}</th>)}
                                     </tr>
                                  </thead>
                                  <tbody>
                                     {filteredData.length > 0 ? (
                                       filteredData.map((row, i) => (
                                         <tr key={i} className="hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 text-[12px] text-slate-600">
                                            {renderVendorTxnCells(sec.name, row)}
                                         </tr>
                                       ))
                                     ) : (
                                       <tr>
                                          <td colSpan={sec.cols.length} className="px-8 py-10 text-center text-slate-300">
                                             <div className="text-[13px] font-medium italic">
                                               {statusFilters[sec.name] !== 'All' 
                                                 ? `No transactions found with status "${statusFilters[sec.name]}"` 
                                                 : `There are no ${sec.name === 'Bill Payments' ? 'Bills' : sec.name} - Add New`
                                               }
                                             </div>
                                          </td>
                                       </tr>
                                     )}
                                  </tbody>
                               </table>
                            </div>
                          )}
                       </div>
                     );
                   })}
                </div>
              )}

               {activeTab === 'Mails' && (
                <div className="p-10 space-y-6 animate-fade-in max-w-4xl">
                   <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-2xl shadow-slate-100/50 bg-white">
                      <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white/50 backdrop-blur-md">
                         <div>
                            <h3 className="text-[15px] font-bold text-slate-800 uppercase tracking-tight">Communication History</h3>
                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Automated and Direct Emails</p>
                         </div>
                         <div className="flex items-center gap-3">
                            <button 
                               onClick={() => setIsComposeModalOpen(true)}
                               className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-[13px] font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all"
                            >
                               <Mail size={16}/> Compose Email
                            </button>
                         </div>
                      </div>

                      <div className="min-h-[400px]">
                         {loadingMails ? (
                            <div className="flex flex-col items-center justify-center h-[400px] text-slate-400">
                               <Loader2 className="animate-spin mb-4" size={32} />
                               <p className="text-[13px] font-bold">Retrieving history...</p>
                            </div>
                         ) : mails.length > 0 ? (
                            <div className="divide-y divide-slate-50">
                               {mails.map(m => (
                                  <div key={m.id} className="p-6 hover:bg-slate-50/50 transition-colors group">
                                     <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                           <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${m.status === 'Sent' ? 'bg-green-50 text-green-600' : 'bg-rose-50 text-rose-600'}`}>
                                              {m.status === 'Sent' ? <CheckCircle2 size={16}/> : <AlertCircle size={16}/>}
                                           </div>
                                           <div>
                                              <p className="text-[14px] font-bold text-slate-800 tracking-tight">{m.subject}</p>
                                              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                                                 <span>To: {m.toEmail}</span>
                                                 <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                                                 <span>By: {m.Sender?.name || 'System'}</span>
                                              </div>
                                           </div>
                                        </div>
                                        <div className="text-right">
                                           <p className="text-[12px] font-bold text-slate-500">{new Date(m.sentAt).toLocaleDateString()}</p>
                                           <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest mt-1">{new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                     </div>
                                     <p className="text-[13px] text-slate-500 line-clamp-2 leading-relaxed ml-11 italic pl-1 border-l-2 border-slate-100 group-hover:border-blue-200 transition-colors">
                                        {m.body}
                                     </p>
                                  </div>
                               ))}
                            </div>
                         ) : (
                            <div className="p-20 text-center space-y-4">
                               <Mail size={48} className="mx-auto text-slate-100" strokeWidth={1}/>
                               <div className="space-y-1">
                                  <p className="text-[15px] text-slate-400 font-bold tracking-tight italic">No emails sent yet</p>
                                  <p className="text-[13px] text-slate-300 max-w-xs mx-auto font-medium">Capture communications here by sending an email or statement to this vendor.</p>
                               </div>
                               <button 
                                  onClick={() => setIsComposeModalOpen(true)}
                                  className="text-[12px] font-bold text-blue-600 hover:text-blue-800 underline decoration-blue-100 underline-offset-4"
                               >
                                  Send First Communication
                                </button>
                            </div>
                         )}
                      </div>
                   </div>
                </div>
              )}

              {activeTab === 'Statement' && (
                <div className="p-8 bg-slate-50/50 min-h-full animate-fade-in">
                   <div className="max-w-4xl mx-auto space-y-6">
                      <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6">
                         <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-400 uppercase">From</span>
                              <input 
                                type="date" 
                                value={statementFromDate} 
                                onChange={e => setStatementFromDate(e.target.value)}
                                className="border border-slate-200 rounded px-2 py-1 text-[13px] font-semibold text-slate-700 outline-none focus:border-blue-500 font-sans" 
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-400 uppercase">To</span>
                              <input 
                                type="date" 
                                value={statementToDate} 
                                onChange={e => setStatementToDate(e.target.value)}
                                className="border border-slate-200 rounded px-2 py-1 text-[13px] font-semibold text-slate-700 outline-none focus:border-blue-500 font-sans" 
                              />
                            </div>
                         </div>
                         <div className="flex items-center gap-2">
                             <button className="p-2 border border-slate-200 rounded text-slate-500 hover:bg-slate-50 transition-colors"><Printer size={18}/></button>
                             <button className="p-2 border border-slate-200 rounded text-slate-500 hover:bg-slate-50 transition-colors"><FileText size={18}/></button>
                             <button className="px-5 py-2 bg-blue-600 text-white rounded text-[13px] font-bold shadow-lg shadow-blue-100 flex items-center gap-2 hover:bg-blue-700 transition-all" onClick={() => setIsComposeModalOpen(true)}>
                                <Send size={14}/> Send Email
                             </button>
                         </div>
                      </div>

                      {/* Professional Document Style Statement */}
                      <div className="bg-white rounded-lg shadow-2xl overflow-hidden aspect-[1/1.3] p-16 border border-slate-200 font-serif relative">
                         {/* Company Header */}
                         <div className="absolute top-0 right-0 p-8 text-[12px] text-right space-y-1 not-italic font-sans">
                            <p className="font-bold text-[18px] text-slate-900 tracking-tight">{currentCompany?.name || 'Indus CAI private Ltd'}</p>
                            <p className="text-slate-500 font-medium">{currentCompany?.state || 'Tamil Nadu'}, India</p>
                            <p className="text-blue-600 font-bold">{currentCompany?.email || 'office@induscai.com'}</p>
                         </div>

                         {/* Vendor Address */}
                         <div className="mt-2 text-[12px] font-sans">
                            <p className="text-slate-400 mb-1 font-bold uppercase tracking-widest text-[10px]">To</p>
                            <p className="text-blue-600 font-bold text-[15px] italic">{vendor?.name || 'Vendor Name'}</p>
                            <div className="text-slate-500 font-medium mt-1">
                               {vendor?.email}<br/>
                               {vendor?.mobile}
                            </div>
                         </div>

                         {/* Main Title */}
                         <div className="mt-20 text-center space-y-2">
                            <h2 className="text-[28px] font-bold text-slate-900 border-b-4 border-slate-900 inline-block pb-2 px-4 italic uppercase tracking-tighter">Statement of Accounts</h2>
                            <p className="text-[14px] font-bold text-slate-400 font-sans mt-4">
                               {new Date(statementFromDate).toLocaleDateString('en-GB')} To {new Date(statementToDate).toLocaleDateString('en-GB')}
                            </p>
                         </div>

                         {/* Summary Table */}
                         <div className="mt-20 flex justify-end">
                            <div className="w-80 space-y-0 text-[13px] font-sans shadow-xl border border-slate-100 rounded-lg overflow-hidden">
                               <div className="bg-slate-900 p-3 font-bold text-white border-b border-slate-200 uppercase tracking-widest text-[10px]">Account Summary</div>
                               <div className="flex justify-between p-3 border-b border-slate-50">
                                  <span>Opening Balance</span>
                                  <span className="font-bold">₹{parseFloat(statementData?.ledger?.openingBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                               </div>
                               <div className="flex justify-between p-3 border-b border-slate-50">
                                  <span>Billed Amount (Purchase)</span>
                                  <span className="font-bold">₹{statementData?.entries?.reduce((sum, e) => sum + (e.credit || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                               </div>
                               <div className="flex justify-between p-3 border-b border-slate-50">
                                  <span>Amount Paid</span>
                                  <span className="font-bold">₹{statementData?.entries?.reduce((sum, e) => sum + (e.debit || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                               </div>
                               <div className="flex justify-between p-4 border-b border-slate-200 bg-slate-50/50">
                                  <span className="font-bold text-slate-900 uppercase">Balance Due</span>
                                  <span className="font-bold text-[18px] text-blue-600">₹{Math.abs(statementData?.ledger?.closingBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                               </div>
                            </div>
                         </div>

                         {/* Transaction Table */}
                         <table className="w-full mt-24 text-[12px] font-sans border-t-2 border-slate-900">
                            <thead className="bg-slate-50 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                               <tr className="border-b border-slate-100">
                                  <th className="px-4 py-3 text-left">Date</th>
                                  <th className="px-4 py-3 text-left">Transactions</th>
                                  <th className="px-4 py-3 text-left">Reference</th>
                                  <th className="px-4 py-3 text-right">Debit</th>
                                  <th className="px-4 py-3 text-right">Credit</th>
                                  <th className="px-4 py-3 text-right">Balance</th>
                               </tr>
                            </thead>
                            <tbody className="text-slate-600">
                               <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                  <td className="px-4 py-4 italic font-medium">{statementData?.ledger?.openingBalance ? new Date(statementFromDate).toLocaleDateString('en-GB') : '—'}</td>
                                  <td className="px-4 py-4 font-bold text-slate-900 uppercase tracking-tighter italic text-[13px]">*** Opening Balance ***</td>
                                  <td className="px-4 py-4">---</td>
                                  <td className="px-4 py-4 text-right">0.00</td>
                                  <td className="px-4 py-4 text-right">0.00</td>
                                  <td className="px-4 py-4 text-right font-bold text-slate-900">{parseFloat(statementData?.ledger?.openingBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                </tr>
                                {statementData?.entries?.map((e, idx) => (
                                  <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                    <td className="px-4 py-5 font-medium">{new Date(e.date).toLocaleDateString('en-GB')}</td>
                                    <td className="px-4 py-5">
                                       <p className="font-bold text-slate-800">{e.voucherType}</p>
                                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">#{e.voucherNumber}</p>
                                    </td>
                                    <td className="px-4 py-5 max-w-xs truncate text-slate-400 font-medium italic">{e.narration}</td>
                                    <td className="py-6 px-4 text-right text-slate-600 font-bold tabular-nums">₹{parseFloat(e.debit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    <td className="px-4 py-5 text-right font-bold text-emerald-600">₹{parseFloat(e.credit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    <td className="py-6 px-4 text-right text-slate-900 font-black tabular-nums">₹{parseFloat(e.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                  </tr>
                                ))}
                            </tbody>
                            <tfoot>
                               <tr className="font-bold text-slate-900 text-[14px] bg-slate-50/50">
                                  <td colSpan={5} className="px-4 py-6 text-right uppercase tracking-widest text-[11px]">Current Balance Due</td>
                                  <td className="px-4 py-6 text-right text-blue-600 text-[16px]">₹{Math.abs(statementData?.ledger?.closingBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                               </tr>
                            </tfoot>
                         </table>

                         <div className="mt-32 border-t border-slate-100 pt-8 text-[11px] text-slate-400 italic text-center font-sans tracking-wide">
                            Thank you for your business. Please contact us if you have any questions regarding this statement.
                         </div>
                      </div>
                   </div>
                </div>
              )}

              {activeTab === 'Overview' && (
                <div className="p-8 flex gap-10 animate-fade-in group">
                  {/* Left Column Profile */}
                  <div className="w-[420px] shrink-0 space-y-12">
                     <VendorOverviewSidebar 
                       vendor={vendor} 
                       onEditAddress={(type) => {
                         navigate(`/vendors/${vendor.id}`);
                       }}
                       onInvitePortal={() => {
                         addNotification({ message: 'Portal invitation sent successfully!', type: 'success' });
                       }}
                       onAddContact={() => {
                         navigate(`/vendors/${vendor.id}`);
                       }}
                       onSettingsClick={() => {
                         setIsSettingsOpen(!isSettingsOpen);
                       }}
                     />

                     {isSettingsOpen && (
                        <div className="relative">
                           <div className="absolute right-0 top-0 w-48 bg-white border border-slate-200 rounded-lg shadow-2xl z-50 py-2 animate-fade-down overflow-hidden">
                              <button onClick={() => { setIsSettingsOpen(false); navigate(`/vendors/${vendor.id}`); }} className="w-full text-left px-4 py-2.5 text-[13px] font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3"><Edit size={16} className="text-blue-500" /> Edit Profile</button>
                              <button onClick={() => { setIsSettingsOpen(false); handleDeleteVendor(); }} className="w-full text-left px-4 py-2.5 text-[13px] font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-3"><Trash2 size={16} /> Delete Vendor</button>
                           </div>
                        </div>
                     )}

                    <div className="space-y-6">
                       <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                          <h4 className="text-[12px] font-bold text-slate-800 uppercase tracking-[0.05em]">BANK ACCOUNT DETAILS</h4>
                          <div className="flex items-center gap-2 cursor-pointer">
                             <Plus onClick={() => { handleBankFormReset(); setIsBankModalOpen(true); }} size={18} className="bg-blue-600 text-white rounded-full p-0.5 shadow-sm hover:scale-105 transition-transform" strokeWidth={2.5} />
                             <ChevronUp size={14} className="text-blue-600 stroke-[2.5]" />
                          </div>
                       </div>
                       <div className="space-y-6 pt-2">
                          {(() => {
                             let bank = null;
                             try { bank = vendor.bankDetailsJson ? JSON.parse(vendor.bankDetailsJson) : null; } catch(e) {}
                             if (!bank) return <p className="text-center text-slate-400 text-[13px] py-4">No bank account added yet</p>;
                             
                             return (
                               <div className="space-y-5 animate-fade-in pr-2">
                                  {/* Top section: Icon + Masked Account + Gear */}
                                  <div className="flex items-center justify-between">
                                     <div className="flex items-center gap-4">
                                        <div className="w-[42px] h-[42px] bg-[#f0f5ff] rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                                           <Landmark size={20} strokeWidth={2} />
                                        </div>
                                        <div className="flex items-center gap-2">
                                           <span className="text-[15px] font-bold text-slate-900 tracking-tight">
                                              {showFullAccount ? bank.accountNumber : `********** ${bank.accountNumber?.slice(-4)}`}
                                           </span>
                                           <button 
                                              onClick={() => setShowFullAccount(!showFullAccount)}
                                              className="text-[13px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                                           >
                                              {showFullAccount ? 'Hide' : 'View'}
                                           </button>
                                        </div>
                                     </div>
                                     <div className="relative">
                                        <button 
                                           onClick={() => setIsBankActionsOpen(!isBankActionsOpen)}
                                           className="p-1.5 text-slate-300 hover:text-slate-500 hover:bg-slate-50 rounded transition-colors"
                                        >
                                           <Settings size={18} />
                                        </button>
                                        
                                        {isBankActionsOpen && (
                                           <>
                                              <div className="fixed inset-0 z-40" onClick={() => setIsBankActionsOpen(false)}></div>
                                              <div className="absolute right-0 mt-2 w-36 bg-white rounded-xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in duration-200">
                                                 <button 
                                                    onClick={handleEditBank}
                                                    className="w-full flex items-center gap-3 px-4 py-2 text-[13px] font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                                 >
                                                    <Edit size={16} /> Edit
                                                 </button>
                                                 <button 
                                                    onClick={() => { setIsBankDeleteConfirmOpen(true); setIsBankActionsOpen(false); }}
                                                    className="w-full flex items-center gap-3 px-4 py-2 text-[13px] font-bold text-red-600 hover:bg-red-50 transition-colors"
                                                 >
                                                    <Trash2 size={16} /> Delete
                                                 </button>
                                              </div>
                                           </>
                                        )}
                                     </div>
                                  </div>

                                  {/* Bottom Section: Specific 3 fields only */}
                                  <div className="space-y-2.5 pt-1">
                                     <div className="flex items-center text-[13px]">
                                        <span className="w-32 text-slate-400 font-medium">IFSC</span>
                                        <span className="text-slate-900 font-bold">: {bank.ifsc}</span>
                                     </div>
                                     <div className="flex items-center text-[13px]">
                                        <span className="w-32 text-slate-400 font-medium">Account Holder Name</span>
                                        <span className="text-slate-900 font-bold">: {bank.accountHolderName || vendor.name}</span>
                                     </div>
                                     <div className="flex items-center text-[13px]">
                                        <span className="w-32 text-slate-400 font-medium">Account Type</span>
                                        <span className="text-slate-900 font-bold">: {bank.accountType || 'Current'}</span>
                                     </div>
                                  </div>
                               </div>
                             );
                          })()}
                       </div>
                    </div>

                    <div className="space-y-6">
                       <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                          <h4 className="text-[12px] font-bold text-slate-800 uppercase tracking-[0.05em]">RECORD INFO</h4>
                          <ChevronUp size={14} className="text-blue-600 cursor-pointer stroke-[2.5]" />
                       </div>
                       <div className="space-y-6 pt-2">
                          <DetailRow label="Vendor ID" value={vendor.id} />
                          <DetailRow label="Created On" value={new Date(vendor.createdAt).toLocaleDateString('en-GB')} />
                          <DetailRow label="Created By" value={vendor.createdBy || 'Swathi N'} />
                       </div>
                    </div>
                  </div>

                  {/* Right Column Financials */}
                  <div className="flex-1 space-y-8 pl-10 pb-20 font-sans">
                     {/* WHAT'S NEXT Banner */}
                     <div className="p-5 border border-slate-200 rounded-lg flex items-center justify-between bg-white shadow-sm relative overflow-hidden group hover:border-slate-300 transition-all duration-200">
                        <div className="space-y-1">
                           <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#6259ca] uppercase tracking-widest">
                              <Sparkles size={13} className="text-[#6259ca]" />
                              WHAT'S NEXT?
                           </div>
                           <p className="text-[13px] text-slate-600 font-medium">
                              Create a <span className="font-bold text-slate-700">purchase order</span> or <span className="font-bold text-slate-700">record a bill</span> for your vendor purchases.
                           </p>
                        </div>
                        <div className="flex items-center gap-2.5 shrink-0">
                           <button 
                              onClick={() => navigate(`/bills/new?vendorId=${vendor.id}&backTo=vendors`)} 
                              className="px-4 py-1.5 bg-[#2684ff] hover:bg-[#0052cc] text-white font-bold rounded text-[13px] transition-all shadow-sm"
                           >
                              New Bill
                           </button>
                           <button 
                              onClick={() => navigate('/purchase-orders/new')} 
                              className="px-4 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold rounded text-[13px] transition-all shadow-sm"
                           >
                              New Purchase Order
                           </button>
                           <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md transition-colors">
                              <MoreVertical size={16} />
                           </button>
                        </div>
                     </div>

                     {/* Payment Due Period */}
                     <div className="space-y-1 pt-1">
                        <div className="text-[12px] text-slate-400 font-bold uppercase tracking-wider">Payment due period</div>
                        {isEditingPaymentTerms ? (
                           <div className="flex items-center gap-2">
                              <select 
                                 value={paymentTerms} 
                                 onChange={e => handleUpdateField('paymentTerms', e.target.value)}
                                 className="px-2 py-1 text-[13px] border border-slate-300 rounded focus:border-blue-500 outline-none font-sans font-bold"
                              >
                                 {['Due on Receipt', 'Net 15', 'Net 30', 'Net 45', 'Net 60'].map(term => (
                                    <option key={term} value={term}>{term}</option>
                                 ))}
                              </select>
                              <button onClick={() => setIsEditingPaymentTerms(false)} className="text-[11px] font-bold text-slate-400 hover:text-slate-600">Cancel</button>
                           </div>
                        ) : (
                           <div className="flex items-center gap-2 group/term">
                              <span className="text-[14px] text-slate-800 font-bold">{paymentTerms || 'Due on Receipt'}</span>
                              <button 
                                 onClick={() => setIsEditingPaymentTerms(true)}
                                 className="p-1 text-slate-400 hover:text-slate-600 opacity-0 group-hover/term:opacity-100 transition-opacity"
                              >
                                 <Edit size={12} />
                              </button>
                           </div>
                        )}
                     </div>

                     {/* Payables Table Section */}
                     <div className="space-y-4 pt-4">
                        <h3 className="text-[18px] font-bold text-slate-800 tracking-tight">Payables</h3>
                        <div className="w-full border-t border-slate-200">
                           <table className="w-full text-left font-sans">
                              <thead>
                                 <tr className="bg-slate-50/50 border-b border-slate-200">
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-1/3">CURRENCY</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right w-1/3">OUTSTANDING PAYABLES</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right w-1/3">UNUSED CREDITS</th>
                                 </tr>
                              </thead>
                              <tbody>
                                 <tr className="border-b border-slate-100 text-[13px] text-slate-700">
                                    <td className="px-4 py-4 font-medium">{vendor.currency || 'INR'} - Indian Rupee</td>
                                    <td className="px-4 py-4 text-right font-medium text-slate-800">
                                       ₹{parseFloat(vendor.currentBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-4 py-4 text-right font-medium text-slate-800">
                                       ₹{parseFloat(vendor.unusedCredits || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                 </tr>
                              </tbody>
                           </table>
                        </div>

                        {/* Enter Opening Balance */}
                        <div className="pt-1">
                           {isEditingBalance ? (
                              <div className="flex items-center gap-2">
                                 <input 
                                    type="number" 
                                    value={openingBalance} 
                                    onChange={e => setOpeningBalance(e.target.value)}
                                    className="px-2 py-1 text-[13px] border border-slate-300 rounded focus:border-blue-500 outline-none w-32 font-sans font-bold" 
                                 />
                                 <button 
                                    onClick={() => handleUpdateField('openingBalance', openingBalance)}
                                    className="px-3 py-1 bg-blue-600 text-white rounded text-[11px] font-bold hover:bg-blue-700"
                                  >
                                    Save
                                 </button>
                                 <button onClick={() => setIsEditingBalance(false)} className="text-[11px] font-bold text-slate-400 hover:text-slate-600">Cancel</button>
                              </div>
                           ) : (
                              <button 
                                 onClick={() => setIsEditingBalance(true)}
                                 className="text-[13px] font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-all"
                              >
                                 Enter Opening Balance
                              </button>
                           )}
                        </div>
                     </div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
           <div className="flex-1 flex flex-col items-center justify-center p-20 text-center opacity-40">
              <Users size={64} className="text-slate-200 mb-8" />
              <h3 className="text-[24px] font-bold text-slate-900 mb-3 tracking-tighter">Select a Vendor</h3>
              <p className="text-[15px] text-slate-500 max-w-sm mx-auto font-medium">Click on a vendor in the list to reveal their procurement details.</p>
           </div>
         )}
      </div>

      <ComposeMailModal 
        isOpen={isComposeModalOpen}
        onClose={() => setIsComposeModalOpen(false)}
        recipientEmail={vendor?.email}
        recipientName={`${vendor?.salutation || ''} ${vendor?.firstName || ''} ${vendor?.lastName || ''}`.trim()}
        ledgerId={selectedId}
        companyId={currentCompany?.id}
        onSent={() => {
          fetchMails();
          addNotification({ message: 'Email sent successfully', type: 'success' });
        }}
      />

      <ConfirmModal 
         isOpen={isDeleteModalOpen}
         onClose={() => setIsDeleteModalOpen(false)}
         onConfirm={confirmDelete}
         title="Delete Vendor"
         message={`Are you sure you want to delete ${vendor?.name}? This action cannot be undone.`}
      />

      <ConfirmModal 
         isOpen={isBankDeleteConfirmOpen}
         onClose={() => setIsBankDeleteConfirmOpen(false)}
         onConfirm={handleDeleteBank}
         title="Remove Bank Account"
         message="Are you sure you want to remove these bank details? You will need to re-enter them later."
      />

      {/* Bank Account Modal */}
      {isBankModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-[550px] overflow-hidden flex flex-col">
            <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-[#fcfdff]">
              <h2 className="text-[18px] font-normal text-[#2c3e50] tracking-tight">Add Bank Account Details</h2>
              <button onClick={() => { setIsBankModalOpen(false); setBankErrors([]); }} className="text-red-500 hover:bg-red-50 p-1 rounded-sm transition-colors">
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>
            
            <div className="px-8 py-6 space-y-6 overflow-y-auto bg-[#fcfdff] max-h-[70vh]">
              {bankErrors.length > 0 && (
                 <div className="bg-[#fff0f0] border border-[#ffd6d6] rounded-xl p-4 flex items-start gap-3 relative">
                    <ul className="list-disc pl-5 text-[14px] font-medium text-[#2c3e50] space-y-1.5 w-full">
                       {bankErrors.map((err, i) => <li key={i}>{err}</li>)}
                    </ul>
                    <button onClick={() => setBankErrors([])} className="absolute top-4 right-4 text-red-500 hover:bg-red-50 rounded-full p-1"><X size={16} strokeWidth={2.5}/></button>
                 </div>
              )}
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-slate-700">Account Type</label>
                  <select 
                    value={bankForm.accountType} 
                    onChange={e => setBankForm({...bankForm, accountType: e.target.value})}
                    className="w-full h-[42px] px-3 border border-slate-200 rounded-md text-[14px] bg-white text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all"
                  >
                    <option value="Current">Current</option>
                    <option value="Savings">Savings</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-slate-700">Account Holder Name</label>
                  <input type="text" defaultValue={vendor?.name || ''} onChange={e => setBankForm({...bankForm, accountHolderName: e.target.value})} className="w-full h-[42px] px-3 border border-slate-200 rounded-md text-[14px] bg-white text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all" />
                </div>
                
                <div className="p-5 border border-slate-100 rounded-xl bg-white shadow-sm flex items-start gap-5">
                  <div className="w-[60px] h-[60px] bg-[#f2f6ff] rounded-[14px] flex items-center justify-center shrink-0">
                    <Landmark size={30} className="text-[#3b82f6]" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <label className="text-[13px] font-medium text-slate-700">Bank Name</label>
                    <input type="text" value={bankForm.bankName} onChange={e => setBankForm({...bankForm, bankName: e.target.value})} className="w-full h-[42px] px-3 border border-slate-200 rounded-md text-[14px] outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all shadow-sm" />
                  </div>
                </div>

                <div className="space-y-1.5 relative">
                  <label className="text-[13px] font-medium text-[#ef4444]">Account Number*</label>
                  <div className="relative">
                    <input type={showAccountNum ? "text" : "password"} value={bankForm.accountNumber} onChange={e => setBankForm({...bankForm, accountNumber: e.target.value})} className="w-full h-[42px] px-3 pr-10 border border-slate-200 rounded-md text-[14px] outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all font-mono shadow-sm [&::-ms-reveal]:hidden [&::-ms-clear]:hidden" />
                    <button type="button" onClick={() => setShowAccountNum(!showAccountNum)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors">
                      {showAccountNum ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-[#ef4444]">Re-enter Account Number*</label>
                  <input type="text" value={bankForm.reAccountNumber} onChange={e => setBankForm({...bankForm, reAccountNumber: e.target.value})} onPaste={e => e.preventDefault()} onDrop={e => e.preventDefault()} className="w-full h-[42px] px-3 border border-slate-200 rounded-md text-[14px] outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all font-mono shadow-sm" />
                </div>

                <div className="space-y-1.5 pb-2">
                  <label className="text-[13px] font-medium text-[#ef4444]">IFSC*</label>
                  <div className="flex">
                     <div className="w-[50%] relative z-20 pr-3">
                        <input type="text" value={bankForm.ifsc} onChange={e => setBankForm({...bankForm, ifsc: e.target.value.toUpperCase()})} className="w-full h-[42px] px-3 border border-slate-200 rounded-md text-[14px] outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all font-mono uppercase shadow-sm" />
                     </div>
                     <div className="w-[50%] relative z-10 flex items-center">
                        {ifscLoading && (
                          <div className="flex items-center gap-2 pl-4">
                            <Loader2 size={16} className="animate-spin text-blue-500" />
                            <span className="text-[13px] text-slate-500">Fetching...</span>
                          </div>
                        )}
                        {ifscError && (
                          <div className="flex items-center gap-2 pl-4">
                            <AlertCircle size={16} className="text-red-500" />
                            <span className="text-[13px] text-red-500 font-medium">Invalid IFSC</span>
                          </div>
                        )}
                     </div>
                  </div>

                  {/* Auto-filled bank details from IFSC */}
                  {(bankForm.bankName || bankForm.branch) && (
                    <div className="grid grid-cols-2 gap-4 p-5 bg-slate-50/50 rounded-xl border border-slate-100 animate-fade-in">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Bank Name</label>
                        <p className="text-[14px] font-bold text-slate-900">{bankForm.bankName || '---'}</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Branch</label>
                        <p className="text-[14px] font-bold text-slate-900">{bankForm.branch || '---'}</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">City</label>
                        <p className="text-[13px] font-semibold text-slate-700">{bankForm.city || '---'}</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">State</label>
                        <p className="text-[13px] font-semibold text-slate-700">{bankForm.state || '---'}</p>
                      </div>
                      <div className="space-y-1 col-span-2">
                         <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">District</label>
                         <p className="text-[13px] font-semibold text-slate-700">{bankForm.district || '---'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-8 py-5 border-t border-slate-100 bg-white flex items-center justify-start gap-4 rounded-b-xl">
              <button 
                 onClick={async () => {
                    const errors = [];
                    if (!bankForm.ifsc) errors.push("Enter the IFSC.");
                    if (!bankForm.accountNumber) errors.push("Please enter the Account Number.");
                    if (bankForm.accountNumber && bankForm.reAccountNumber && bankForm.accountNumber !== bankForm.reAccountNumber) errors.push("Account Numbers do not match.");
                    
                    if (errors.length > 0) {
                      setBankErrors(errors);
                      return;
                    }

                    // Execution: Actually save the bank details to the cloud database
                    try {
                      setLoading(true);
                      const bankData = JSON.stringify(bankForm);
                      await ledgerAPI.update(vendor.id, { 
                        ...vendor,
                        bankDetailsJson: bankData 
                      });
                      
                      addNotification('Bank account details saved successfully!', 'success');
                      
                      // Refresh the vendor data locally
                      setAllLedgers(prev => prev.map(v => 
                        v.id === vendor.id ? { ...v, bankDetailsJson: bankData } : v
                      ));
                      
                      setIsBankModalOpen(false);
                      setBankErrors([]);
                    } catch (err) {
                      addNotification('Failed to save bank details.', 'error');
                    } finally {
                      setLoading(false);
                    }
                  }} 
                  disabled={loading}
                 className="px-6 py-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-[4px] text-[14px] font-medium shadow-sm transition-colors"
                >
                Save
              </button>
              <button onClick={() => { setIsBankModalOpen(false); setBankErrors([]); }} className="px-5 py-2 border border-slate-200 rounded-[4px] text-[14px] font-medium text-slate-900 bg-[#fcfdff] hover:bg-slate-50 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorDetailView;
