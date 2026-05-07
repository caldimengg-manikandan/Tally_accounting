import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Edit, Trash2, MoreHorizontal, Plus, Search, 
  Settings, Paperclip, Mail, Phone, MapPin, Globe, 
  Info, CreditCard, Clock, Activity, ArrowRight,
  ChevronDown, MessageSquare, History, FileText, Send, HelpCircle,
  Camera, Image as ImageIcon, X, LayoutDashboard, Share2,
  Sparkles, DollarSign, Printer, Download, Filter, Save, Loader2,
  ChevronRight, Calendar, User, Users, Briefcase, Bold, Italic, Underline,
  CheckCircle2, AlertCircle, PlusCircle, Trash
} from 'lucide-react';
import { 
  ledgerAPI, salesAPI, quoteAPI, retainerInvoiceAPI, 
  voucherAPI, reportsAPI, companyAPI, mailAPI 
} from '../../services/api';
import useNotificationStore from '../../store/notificationStore';
import ConfirmModal from '../../components/ConfirmModal';
import ComposeMailModal from '../../components/ComposeMailModal';

const CustomerDetailView = ({ companyId }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [selectedId, setSelectedId] = useState(id);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  const [mails, setMails] = useState([]);
  const [loadingMails, setLoadingMails] = useState(false);
  const [isComposeModalOpen, setIsComposeModalOpen] = useState(false);
  const { addNotification } = useNotificationStore();

  const user = useMemo(() => { 
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } 
  }, []);
  
  // Data for tabs
  const [transactions, setTransactions] = useState({
    invoices: [],
    payments: [],
    quotes: [],
    retainerInvoices: [],
    salesOrders: []
  });
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [statementData, setStatementData] = useState(null);
  const [currentCompany, setCurrentCompany] = useState(null);

  // UI state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEditingPaymentTerms, setIsEditingPaymentTerms] = useState(false);
  const [paymentTerms, setPaymentTerms] = useState('');
  const [isEditingBalance, setIsEditingBalance] = useState(false);
  const [openingBalance, setOpeningBalance] = useState('0');
  const [openSections, setOpenSections] = useState(['Invoices', 'Customer Payments', 'Quotes', 'Retainer Invoices', 'Sales Orders']);

  const [isAddressDrawerOpen, setIsAddressDrawerOpen] = useState(false);
  const [addressType, setAddressType] = useState('billing'); // 'billing' or 'shipping'
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isSideListCollapsed, setIsSideListCollapsed] = useState(false);
  const [quickAddForm, setQuickAddForm] = useState({ name: '', email: '', mobile: '', salutation: 'Mr.' });
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
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  const fileInputRef = useRef(null);
  const settingsRef = useRef(null);
  const commentEditorRef = useRef(null);

  const activeCompanyId = companyId || localStorage.getItem('companyId');

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

  // ─── EFFECTS ───────────────────────────────────────────────────────────────

  // 1. Fetch Company & Customers
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [ledgersRes, companyRes] = await Promise.all([
          ledgerAPI.getByCompany(activeCompanyId),
          companyAPI.getById(activeCompanyId)
        ]);
        
        const allLedgers = ledgersRes.data || [];
        const customerLedgers = allLedgers.filter(l => 
          l.Group?.name?.toLowerCase().includes('debtor') || 
          l.groupName?.toLowerCase().includes('debtor')
        );
        setCustomers(customerLedgers);
        setCurrentCompany(companyRes.data);
      } catch (err) {
        console.error("Failed to fetch data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeCompanyId]);

  useEffect(() => {
    if (id) setSelectedId(id);
  }, [id]);

  // 2. Data Fetching per Tab
  useEffect(() => {
    if (!selectedId || !activeCompanyId) return;

    const fetchTabData = async () => {
      try {
         if (activeTab === 'Transactions') {
           const [ordersRes, quotesRes, retainerRes, vouchersRes] = await Promise.all([
             salesAPI.getOrders(activeCompanyId),
             quoteAPI.getByCompany(activeCompanyId),
             retainerInvoiceAPI.getByCompany(activeCompanyId),
             voucherAPI.getByCompany(activeCompanyId)
           ]);

           setTransactions({
             invoices: (vouchersRes.data || []).filter(v => v.type === 'Sales' && v.Transactions?.some(t => String(t.LedgerId) === String(selectedId))),
             payments: (vouchersRes.data || []).filter(v => v.type === 'Receipt' && v.Transactions?.some(t => String(t.LedgerId) === String(selectedId))),
             quotes: (quotesRes.data || []).filter(q => String(q.LedgerId) === String(selectedId)),
             retainerInvoices: (retainerRes.data || []).filter(r => String(r.LedgerId) === String(selectedId)),
             salesOrders: (ordersRes.data || []).filter(o => String(o.LedgerId) === String(selectedId))
           });
         } else if (activeTab === 'Statement') {
           const fromDate = new Date();
           fromDate.setDate(1); // Start of month
           const res = await reportsAPI.ledgerStatement(selectedId, fromDate.toISOString().split('T')[0], new Date().toISOString().split('T')[0]);
           setStatementData(res.data);
         } else if (activeTab === 'Comments') {
            // Simulated comments fetch
            const stored = localStorage.getItem(`comments_${selectedId}`);
            setComments(stored ? JSON.parse(stored) : []);
         }
      } catch (err) {
        console.error("Tab data fetch failed", err);
      }
    };
    fetchTabData();
  }, [activeTab, selectedId, activeCompanyId]);

  // 3. ACTION HANDLERS
  const handleEditRow = (type, row) => {
    let path = '';
    const id = row.id;
    if (type === 'Invoices') path = `/sales-invoices/edit/${id}`;
    else if (type === 'Quotes') path = `/quotes/edit/${id}`;
    else if (type === 'Retainer Invoices') path = `/retainer-invoices/edit/${id}`;
    else if (type === 'Sales Orders') path = `/sales-orders`; // Generic SO view, may need specific SO edit route
    else if (type === 'Customer Payments') path = `/payments`;

    if (path) navigate(path);
  };

  const handleDeleteRow = async (type, id) => {
    if (!window.confirm(`Are you sure you want to delete this ${type.slice(0, -1).toLowerCase()}?`)) return;
    try {
      if (type === 'Invoices') await salesAPI.delete(id);
      else if (type === 'Quotes') await quoteAPI.delete(id);
      else if (type === 'Retainer Invoices') await retainerInvoiceAPI.delete(id);
      else if (type === 'Sales Orders') await salesAPI.deleteOrder(id);
      else if (type === 'Customer Payments') await voucherAPI.delete(id);
      
      addNotification(`${type.slice(0, -1)} deleted successfully`, 'success');
      // Refresh data
      setActiveTab('');
      setTimeout(() => setActiveTab('Transactions'), 100);
    } catch (err) {
      addNotification(`Failed to delete ${type.slice(0, -1)}`, 'error');
    }
  };

  // ─── HELPERS ──────────────────────────────────────────────────────────────

  const customer = useMemo(() => {
    const found = customers.find(c => String(c.id) === String(selectedId));
    if (found) {
      setPaymentTerms(found.paymentTerms || 'Due on Receipt');
      setOpeningBalance(String(found.openingBalance || 0));
    }
    return found;
  }, [customers, selectedId]);

  const handleUpdateField = async (field, value) => {
    try {
       const data = { ...customer, [field]: value };
       if (field === 'openingBalance') data.currentBalance = parseFloat(value);
       await ledgerAPI.update(customer.id, data);
       if (field === 'paymentTerms') setIsEditingPaymentTerms(false);
       if (field === 'openingBalance') setIsEditingBalance(false);
       setCustomers(prev => prev.map(c => c.id === customer.id ? { ...c, [field]: value } : c));
    } catch (err) {
      addNotification(`Failed to update ${field}`, 'error');
    }
  };

  const openAddressDrawer = (type) => {
    setAddressType(type);
    const existing = type === 'billing' ? customer.billingAddress : customer.shippingAddress;
    if (existing) {
      try {
        setAddressForm(JSON.parse(existing));
      } catch (e) {
        setAddressForm({ attention: '', country: 'India', address1: '', address2: '', city: '', state: '', zip: '', phone: '', fax: '' });
      }
    } else {
      setAddressForm({ 
        attention: '', country: 'India', address1: '', address2: '', city: '', state: '', zip: '', phone: '', 
        fax: '', ...((customer.firstName || customer.name) ? { attention: `${customer.salutation || ''} ${customer.firstName || customer.name}`.trim() } : {})
      });
    }
    setIsAddressDrawerOpen(true);
  };

  const renderAddress = (type) => {
    const addrStr = type === 'billing' ? customer.billingAddress : customer.shippingAddress;
    if (!addrStr || addrStr === '{}') {
      return (
        <p className="text-[12px] text-slate-400 italic leading-relaxed">
          No {type === 'billing' ? 'Billing' : 'Shipping'} Address - <span className="text-blue-600 not-italic font-bold hover:underline cursor-pointer" onClick={() => openAddressDrawer(type)}>New Address</span>
        </p>
      );
    }
    try {
      const addr = JSON.parse(addrStr);
      const isEmpty = !addr.address1 && !addr.city;
      if (isEmpty) {
        return (
          <p className="text-[12px] text-slate-400 italic leading-relaxed">
            No {type === 'billing' ? 'Billing' : 'Shipping'} Address - <span className="text-blue-600 not-italic font-bold hover:underline cursor-pointer" onClick={() => openAddressDrawer(type)}>New Address</span>
          </p>
        );
      }
      return (
        <div className="text-[12.5px] text-slate-500 space-y-0.5 relative group/addr pr-10">
          {addr.attention && <p className="font-bold text-slate-800 tracking-tight">{addr.attention}</p>}
          <p>{addr.address1}</p>
          {addr.address2 && <p>{addr.address2}</p>}
          <p>{addr.city}{addr.state ? `, ${addr.state}` : ''} {addr.zip ? `- ${addr.zip}` : ''}</p>
          {addr.phone && <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-widest">PH: {addr.phone}</p>}
          <button 
            onClick={() => openAddressDrawer(type)} 
            className="absolute top-0 right-0 p-2 text-blue-600 opacity-0 group-hover/addr:opacity-100 transition-opacity hover:bg-blue-50 rounded"
          >
            <Edit size={14}/>
          </button>
        </div>
      );
    } catch (e) {
      return <p className="text-red-400 text-[12px]">Invalid address data</p>;
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      await ledgerAPI.update(customer.id, customer);
      addNotification('Customer profile saved successfully!', 'success');
    } catch (err) {
      addNotification('Failed to save profile changes.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerSelect = (customerId) => {
    setSelectedId(String(customerId));
    navigate(`/customers/view/${customerId}`);
  };

  const handleQuickAdd = async () => {
    if (!quickAddForm.name) return;
    setLoading(true);
    try {
        const payload = {
            ...quickAddForm,
            companyId: activeCompanyId,
            groupName: 'Sundry Debtors',
            openingBalance: 0,
            currentBalance: 0
        };
        const res = await ledgerAPI.create(payload);
        const newCustomer = res.data.ledger || res.data;
        setCustomers(prev => [...prev, newCustomer]);
        setSelectedId(String(newCustomer.id));
        navigate(`/customers/view/${newCustomer.id}`);
        setIsQuickAddOpen(false);
        setQuickAddForm({ name: '', email: '', mobile: '', salutation: 'Mr.' });
    } catch (err) {
        addNotification('Failed to register customer', 'error');
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
    localStorage.setItem(`comments_${selectedId}`, JSON.stringify(updated));
    setNewComment('');
    if (commentEditorRef.current) commentEditorRef.current.innerHTML = '';
  };

  const handleDeleteCustomer = () => {
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await ledgerAPI.delete(customer.id);
      addNotification('Customer deleted successfully', 'success');
      navigate('/customers');
    } catch (err) {
      addNotification('Failed to delete customer', 'error');
    } finally {
      setIsDeleteModalOpen(false);
    }
  };

  const fetchMails = async () => {
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
  };

  useEffect(() => {
    if (activeTab === 'Mails') {
      fetchMails();
    }
  }, [activeTab, selectedId]);

  const toggleSection = (name) => {
    setOpenSections(prev => prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name]);
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

  if (loading && customers.length === 0) {
    return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="flex h-[calc(100vh-80px)] bg-[#fbfcff] overflow-hidden">
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* ─── SIDEBAR ─────────────────────────────────────── */}
      <div className={`${id ? (isSideListCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-[320px]') : 'w-full'} border-r border-slate-200 bg-[#f8fbff] flex flex-col shrink-0 transition-all duration-300 relative`}>
        {!isSideListCollapsed && id && (
          <button 
            onClick={() => setIsSideListCollapsed(true)}
            className="absolute -right-3 top-24 w-6 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-300 transition-all shadow-sm z-[60] cursor-pointer"
          >
            <ChevronLeft size={14} strokeWidth={3} />
          </button>
        )}
        <div className="p-5 border-b border-slate-100 bg-white space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[14px] font-bold text-slate-900 tracking-tight">Active Customers <ChevronDown size={14} className="inline ml-1 text-blue-600"/></h2>
            <div className="flex items-center gap-2">
              <button onClick={() => setIsQuickAddOpen(true)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-600 text-white shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">
                <Plus size={16} strokeWidth={3}/>
              </button>
              <button className="p-1.5 text-slate-400 hover:text-slate-600 border border-slate-100 rounded-lg bg-slate-50/50 transition-colors">
                <MoreHorizontal size={16}/>
              </button>
            </div>
          </div>
          <div className="relative group">
             <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
             <input 
                type="text" 
                placeholder="Search Customers ( / )" 
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-medium outline-none transition-all focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50" 
             />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar py-2">
          {customers.length === 0 ? (
            <div className="p-10 text-center text-[10px] text-slate-300 font-bold uppercase tracking-widest opacity-50 mt-20">EMPTY ARCHIVE</div>
          ) : customers.map(c => (
            <div 
              key={c.id} 
              onClick={() => handleCustomerSelect(c.id)} 
              className={`px-6 py-4 cursor-pointer transition-all border-b border-slate-50 flex flex-col gap-1 relative overflow-hidden
                ${String(c.id) === String(selectedId) ? 'bg-white shadow-xl shadow-slate-100/50 z-10 translate-x-1' : 'hover:bg-white/50'}`}
            >
              {String(c.id) === String(selectedId) && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r-full shadow-[2px_0_10px_rgba(37,99,235,0.3)]"></div>}
              <div className={`text-[13px] font-bold tracking-tight truncate ${String(c.id) === String(selectedId) ? 'text-blue-600' : 'text-slate-700 group-hover:text-blue-600'}`}>
                {c.name}
              </div>
              <div className="text-[12px] font-black text-slate-400 italic tracking-tighter">
                ₹{parseFloat(c.currentBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── MAIN CONTENT ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden shadow-2xl">
        {customer ? (
          <>
            <header className="px-8 py-5 flex items-center justify-between border-b border-slate-50 bg-white">
               <div className="flex items-center gap-4">
                  {isSideListCollapsed && (
                    <button 
                      onClick={() => setIsSideListCollapsed(false)}
                      className="p-2 -ml-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      title="Show Customer List"
                    >
                      <LayoutDashboard size={20} />
                    </button>
                  )}
                  <h1 className="text-[20px] font-bold text-slate-900 tracking-tight">{customer.name}</h1>
               </div>
               <div className="flex items-center gap-3">
                  <button onClick={() => navigate(`/customers/${customer.id}`)} className="px-4 py-1.5 border border-slate-200 rounded text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">Edit</button>
                  <button className="p-2 border border-slate-200 rounded text-slate-400 hover:text-slate-600 transition-colors"><Paperclip size={18}/></button>
                  
                  <div className="bg-[#1e61f0] text-white rounded-lg flex items-center shadow-lg shadow-blue-100 overflow-hidden transition-all hover:bg-blue-700">
                     <button className="px-5 py-2.5 text-[13px] font-bold border-r border-blue-500/30">New Transaction</button>
                     <button className="px-3 py-2.5"><ChevronDown size={16}/></button>
                  </div>

                  <button className="px-4 py-2 border border-slate-200 rounded-lg text-[13px] font-bold text-slate-700 flex items-center gap-2 hover:bg-slate-50 shadow-sm transition-all">
                     More <ChevronDown size={16} className="text-slate-400"/>
                  </button>
                  <div className="w-px h-6 bg-slate-200 mx-1"></div>
                  <button className="p-2 text-slate-300 hover:text-slate-500 transition-colors" onClick={() => navigate(-1)}><X size={24}/></button>
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
                        ref={commentEditorRef}
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
                                   <div 
                                     className="text-[14px] text-slate-600 leading-relaxed rich-text-comment"
                                     dangerouslySetInnerHTML={{ __html: c.text }}
                                   />
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
                <div className="p-10 space-y-6 animate-fade-in">
                   <div className="flex items-center gap-2 text-blue-600 text-[13px] font-bold cursor-pointer hover:underline mb-2">Go to transactions <ChevronDown size={14}/></div>
                   
                   {[
                     { name: 'Invoices', data: transactions.invoices, cols: ['DATE', 'INVOICE NUMBER', 'ORDER NUMBER', 'AMOUNT', 'BALANCE DUE', 'STATUS', 'ACTION'] },
                     { name: 'Customer Payments', data: transactions.payments, cols: ['DATE', 'PAYMENT N...', 'REFERENCE ...', 'PAYMENT M...', 'AMOUNT', 'UNUSED AM...', 'STATUS', 'ACTION'] },
                     { name: 'Quotes', data: transactions.quotes, cols: ['DATE', 'QUOTE NUMBER', 'REFERENCE', 'AMOUNT', 'EXPIRY DATE', 'STATUS', 'ACTION'] },
                     { name: 'Retainer Invoices', data: transactions.retainerInvoices, cols: ['DATE', 'RETAINER NUMBER', 'REFERENCE', 'AMOUNT', 'STATUS', 'ACTION'] },
                     { name: 'Sales Orders', data: transactions.salesOrders, cols: ['DATE', 'ORDER NUMBER', 'REFERENCE', 'AMOUNT', 'STATUS', 'ACTION'] }
                   ].map(sec => (
                     <div key={sec.name} className="border border-slate-100 rounded-xl overflow-hidden shadow-[0_2px_15px_rgb(0,0,0,0.03)] bg-white">
                        <div 
                          className="px-6 py-4 bg-slate-50/50 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
                          onClick={() => toggleSection(sec.name)}
                        >
                           <div className="flex items-center gap-3">
                              <ChevronRight size={16} className={`text-slate-400 transition-transform ${openSections.includes(sec.name) ? 'rotate-90' : ''}`} />
                              <h3 className="text-[15px] font-bold text-slate-800 tracking-tight">{sec.name}</h3>
                           </div>
                           <button 
                             onClick={(e) => {
                               e.stopPropagation();
                               const routes = {
                                 'Invoices': '/sales-invoices/new',
                                 'Customer Payments': '/payments/new',
                                 'Quotes': '/quotes/new',
                                 'Retainer Invoices': '/retainer-invoices/new',
                                 'Sales Orders': '/sales-orders/new'
                               };
                               navigate(routes[sec.name] || '#', { state: { customerId: selectedId } });
                             }}
                             className="flex items-center gap-1.5 text-[12px] font-bold text-blue-600 hover:text-blue-800 bg-white px-2.5 py-1 rounded-full border border-blue-50 shadow-sm"
                           >
                              <Plus size={14} strokeWidth={3}/> NEW
                           </button>
                        </div>
                        {openSections.includes(sec.name) && (
                          <div className="overflow-x-auto">
                             <table className="w-full text-left">
                                <thead>
                                   <tr className="bg-white border-b border-slate-50">
                                      {sec.cols.map(c => <th key={c} className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{c}</th>)}
                                   </tr>
                                </thead>
                                <tbody>
                                   {sec.data.length > 0 ? (
                                     sec.data.map((row, i) => (
                                       <tr key={i} className="hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 text-[13px] text-slate-600">
                                          <td className="px-6 py-4">{row.date || 'N/A'}</td>
                                          <td className="px-6 py-4 font-bold text-blue-600">{row.number || row.orderNumber || row.quoteNumber || '---'}</td>
                                          <td className="px-6 py-4">{row.reference || row.referenceNumber || '---'}</td>
                                          <td className="px-6 py-4 font-bold text-slate-900">₹{parseFloat(row.totalAmount || row.amount || 0).toLocaleString()}</td>
                                          {sec.name === 'Invoices' && <td className="px-6 py-4">₹{row.balanceDue || '0.00'}</td>}
                                          <td className="px-6 py-4">
                                             <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${row.status === 'Sent' ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-400'}`}>
                                                {row.status || 'Draft'}
                                             </span>
                                          </td>
                                          <td className="px-6 py-4">
                                             <div className="flex items-center gap-2">
                                                <button 
                                                  onClick={(e) => { e.stopPropagation(); handleEditRow(sec.name, row); }}
                                                  className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-600 transition-colors"
                                                  title="Edit"
                                                >
                                                  <Edit size={14}/>
                                                </button>
                                                <button 
                                                  onClick={(e) => { e.stopPropagation(); handleDeleteRow(sec.name, row.id); }}
                                                  className="p-1.5 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 transition-colors"
                                                  title="Delete"
                                                >
                                                  <Trash2 size={14}/>
                                                </button>
                                             </div>
                                          </td>
                                       </tr>
                                     ))
                                   ) : (
                                     <tr>
                                        <td colSpan={sec.cols.length} className="px-6 py-20 text-center text-slate-400">
                                           <div className="text-[14px]">There are no {sec.name.toLowerCase()} - <span 
                                                className="text-blue-600 font-bold hover:underline cursor-pointer"
                                                onClick={() => {
                                                  const routes = {
                                                    'Invoices': '/sales-invoices/new',
                                                    'Customer Payments': '/payments/new',
                                                    'Quotes': '/quotes/new',
                                                    'Retainer Invoices': '/retainer-invoices/new',
                                                    'Sales Orders': '/sales-orders/new'
                                                  };
                                                  navigate(routes[sec.name] || '#', { state: { customerId: selectedId } });
                                                }}
                                              > Add New</span>
</div>
                                        </td>
                                     </tr>
                                   )}
                                </tbody>
                             </table>
                          </div>
                        )}
                     </div>
                   ))}
                </div>
              )}

               {activeTab === 'Mails' && (
                <div className="flex flex-col h-full animate-fade-in">
                   {/* Mail Header Bar */}
                   <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-white flex-shrink-0">
                      <div>
                         <h3 className="text-[15px] font-bold text-slate-800 tracking-tight">System Mails</h3>
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

                   {/* Mail List - full remaining height */}
                   <div className="flex-1 overflow-y-auto no-scrollbar">
                      {loadingMails ? (
                         <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-slate-400">
                            <Loader2 className="animate-spin mb-4" size={32} />
                            <p className="text-[13px] font-bold">Retrieving history...</p>
                         </div>
                      ) : mails.length > 0 ? (
                         <div className="divide-y divide-slate-50">
                            {mails.map(m => (
                               <div key={m.id} className="px-8 py-5 hover:bg-slate-50/50 transition-colors group">
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
                                     <div className="text-right flex-shrink-0">
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
                         <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center space-y-4">
                            <Mail size={56} className="text-slate-100" strokeWidth={1}/>
                            <p className="text-[13px] font-bold text-slate-400">No emails sent yet</p>
                            <button 
                               onClick={() => setIsComposeModalOpen(true)}
                               className="text-[13px] font-bold text-blue-600 hover:text-blue-800 underline decoration-blue-100 underline-offset-4"
                            >
                               Send First Communication
                            </button>
                         </div>
                      )}
                   </div>
                </div>
              )}

               {activeTab === 'Statement' && (
                <div className="p-8 bg-[#f8fbff] min-h-full animate-fade-in overflow-y-auto no-scrollbar">
                   <div className="max-w-[850px] mx-auto space-y-8">
                      {/* Controls Bar */}
                      <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-100 no-print">
                         <div className="flex gap-3">
                           <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded text-[13px] font-medium text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors">
                              <Calendar size={14} className="text-slate-400"/> This Month <ChevronDown size={14}/>
                           </div>
                           <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded text-[13px] font-medium text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors">
                              Filter By: All <ChevronDown size={14}/>
                           </div>
                         </div>
                         <div className="flex items-center gap-2">
                            <button className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition-all"><Printer size={18}/></button>
                            <button className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition-all"><FileText size={18}/></button>
                            <button onClick={() => setIsComposeModalOpen(true)} className="px-5 py-2.5 bg-[#1e61f0] text-white rounded-lg text-[13px] font-bold shadow-lg shadow-blue-100 flex items-center gap-2 hover:bg-blue-700 transition-all">
                               <Send size={14}/> Send Email
                            </button>
                         </div>
                      </div>

                      {/* External Statement Title */}
                      <div className="text-center space-y-1 py-4">
                         <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">Customer Statement for {customer.name}</h2>
                         <p className="text-[13px] font-medium text-slate-500">From 01/05/2026 To 31/05/2026</p>
                      </div>

                      {/* THE STATEMENT DOCUMENT */}
                      <div className="bg-white rounded-none shadow-[0_30px_100px_rgba(0,0,0,0.1)] overflow-hidden p-16 border border-slate-100 print:shadow-none print:border-none relative min-h-[1100px]">
                         
                         {/* Document Header - Company Info Right */}
                         <div className="flex justify-end mb-16">
                            <div className="text-right space-y-0.5 font-sans">
                               <p className="font-bold text-[16px] text-slate-900 uppercase tracking-tight">{currentCompany?.name || 'Caldim'}</p>
                               <p className="text-[12px] text-slate-500 font-medium">{currentCompany?.state || 'Tamil Nadu'}</p>
                               <p className="text-[12px] text-slate-500 font-medium">{currentCompany?.country || 'India'}</p>
                               <p className="text-[12px] text-slate-500 font-medium">91-6379222691</p>
                               <p className="text-[12px] text-blue-600 font-medium">{currentCompany?.email || 'harithejj05@gmail.com'}</p>
                            </div>
                         </div>

                         {/* "To" Section - Left */}
                         <div className="mb-20">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">To</p>
                            <p className="text-[#1e61f0] font-bold text-[15px] tracking-tight">{customer.name}</p>
                         </div>

                         {/* Document Center Title */}
                         <div className="text-center space-y-2 mb-20">
                            <h1 className="text-[24px] font-bold text-slate-900 uppercase tracking-[0.1em] border-b-[2px] border-slate-900 inline-block pb-1">Statement of Accounts</h1>
                            <p className="text-[13px] font-bold text-slate-500 tracking-widest uppercase">01/05/2026 To 31/05/2026</p>
                         </div>

                         {/* Account Summary Table - Right Aligned */}
                         <div className="flex justify-end mb-24">
                            <div className="w-80 border border-slate-100 rounded-none overflow-hidden shadow-sm">
                               <div className="bg-slate-50 p-2.5 font-bold text-[11px] text-slate-400 uppercase tracking-widest border-b border-slate-100">Account Summary</div>
                               <div className="flex justify-between px-3 py-2.5 border-b border-slate-50 text-[13px] font-medium text-slate-600">
                                 <span>Opening Balance</span>
                                 <span className="font-bold text-slate-900">₹{parseFloat(statementData?.ledger?.openingBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                               </div>
                               <div className="flex justify-between px-3 py-2.5 border-b border-slate-50 text-[13px] font-medium text-slate-600">
                                 <span>Invoiced Amount</span>
                                 <span className="font-bold text-slate-900">₹{statementData?.entries?.reduce((sum, e) => sum + (e.debit || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                               </div>
                               <div className="flex justify-between px-3 py-2.5 border-b border-slate-50 text-[13px] font-medium text-slate-600">
                                 <span>Amount Received</span>
                                 <span className="font-bold text-slate-900">₹{statementData?.entries?.reduce((sum, e) => sum + (e.credit || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                               </div>
                               <div className="flex justify-between px-3 py-3 bg-slate-50/50 text-[13px]">
                                 <span className="font-bold text-slate-800">Balance Due</span>
                                 <span className="font-black text-slate-900 text-[15px]">₹{parseFloat(statementData?.ledger?.closingBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                               </div>
                            </div>
                         </div>

                         {/* Transaction Table - Full Width */}
                         <table className="w-full text-[12px] font-sans border-collapse mb-10">
                            <thead>
                               <tr className="bg-slate-900 text-white font-bold text-[10px] uppercase tracking-widest">
                                  <th className="px-4 py-3 text-left w-24">Date</th>
                                  <th className="px-4 py-3 text-left">Transactions</th>
                                  <th className="px-4 py-3 text-left">Details</th>
                                  <th className="px-4 py-3 text-right">Amount</th>
                                  <th className="px-4 py-3 text-right">Payments</th>
                                  <th className="px-4 py-3 text-right">Balance</th>
                               </tr>
                            </thead>
                            <tbody className="text-slate-600 border-b border-slate-200">
                               {/* Opening Balance Row */}
                               <tr className="border-b border-slate-100">
                                  <td className="px-4 py-6 font-medium">01/05/2026</td>
                                  <td className="px-4 py-6 font-bold text-slate-900 italic">***Opening Balance***</td>
                                  <td className="px-4 py-6"></td>
                                  <td className="px-4 py-6 text-right font-bold text-slate-900">{parseFloat(statementData?.ledger?.openingBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                  <td className="px-4 py-6 text-right font-medium">0.00</td>
                                  <td className="px-4 py-6 text-right font-black text-slate-900">{parseFloat(statementData?.ledger?.openingBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                               </tr>
                               {/* Entries */}
                               {statementData?.entries?.map((e, idx) => (
                                 <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                   <td className="px-4 py-5 font-medium">{new Date(e.date).toLocaleDateString('en-GB')}</td>
                                   <td className="px-4 py-5">
                                      <p className="font-bold text-slate-800">{e.type}</p>
                                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">#{e.voucherNumber || 'INV-001'}</p>
                                   </td>
                                   <td className="px-4 py-5 max-w-xs truncate text-slate-400 font-medium italic">{e.description || 'Professional Services'}</td>
                                   <td className="px-4 py-5 text-right font-bold text-slate-900">{e.debit ? e.debit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}</td>
                                   <td className="px-4 py-5 text-right font-bold text-emerald-600">{e.credit ? e.credit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}</td>
                                   <td className="px-4 py-5 text-right font-black text-slate-900">₹{e.runningBalance?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                 </tr>
                               ))}
                            </tbody>
                         </table>

                         <div className="flex justify-end pt-4">
                            <div className="flex items-center gap-12 text-[14px]">
                               <span className="font-bold text-slate-500 uppercase tracking-widest">Balance Due</span>
                               <span className="font-black text-slate-900 text-[18px]">₹{parseFloat(statementData?.ledger?.closingBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
              )}


              {activeTab === 'Overview' && (
                <div className="p-8 flex gap-10 animate-fade-in group">
                  {/* Left Column Profile */}
                  <div className="w-[420px] shrink-0 space-y-12">
                    <div className="flex gap-6 relative">
                       <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                       <div className="relative group">
                           <div 
                              onClick={() => customer.image && setIsPreviewOpen(true)}
                              className={`w-24 h-24 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 overflow-hidden transition-all hover:border-blue-400 hover:bg-white relative ${customer.image ? 'cursor-zoom-in' : 'cursor-default'}`}
                           >
                              {customer.image ? (
                                <img src={customer.image} className="w-full h-full object-cover" />
                              ) : (
                                <div className="flex flex-col items-center gap-1 opacity-40">
                                  <Camera size={28} strokeWidth={1.5}/>
                                  <span className="text-[9px] font-bold uppercase tracking-widest">Add Photo</span>
                                </div>
                              )}
                              
                              <div 
                                onClick={(e) => { e.stopPropagation(); fileInputRef.current.click(); }}
                                className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 cursor-pointer"
                              >
                                 <ImageIcon size={18} className="text-white" />
                                 <span className="text-[8px] font-bold text-white uppercase tracking-tighter">Update</span>
                              </div>
                           </div>
                        </div>
                        
                        <div className="space-y-1 pt-1.5 flex-1">
                           <h3 className="text-[17px] font-bold text-slate-900 leading-tight">{customer.salutation} {customer.firstName} {customer.lastName}</h3>
                           <div className="flex items-center gap-2 text-[13px] text-blue-600 font-bold hover:underline cursor-pointer"><Mail size={14}/> <span>{customer.email}</span></div>
                           <div className="flex items-center gap-2 text-[13px] text-slate-500 font-medium"><Phone size={14}/> <span>{customer.mobile || 'No contact'}</span></div>
                           <button className="text-[12px] font-bold text-blue-600 hover:text-blue-800 underline decoration-blue-200 underline-offset-4 mt-2">Invite to Portal</button>
                        </div>

                        <div className="ml-auto absolute top-0 right-0" ref={settingsRef}>
                           <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className={`p-2 rounded-full transition-colors ${isSettingsOpen ? 'bg-slate-100 text-blue-600' : 'hover:bg-slate-100 text-slate-400'}`}><Settings size={20}/></button>
                           
                           {isSettingsOpen && (
                              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-2xl z-50 py-2 animate-fade-down overflow-hidden">
                                 <div className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">Record Actions</div>
                                 <button onClick={() => { setIsSettingsOpen(false); navigate(`/customers/${customer.id}`); }} className="w-full text-left px-4 py-2.5 text-[13px] font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3"><Edit size={16} className="text-blue-500" /> Edit Profile</button>
                                 <button onClick={() => { setIsSettingsOpen(false); handleDeleteCustomer(); }} className="w-full text-left px-4 py-2.5 text-[13px] font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-3"><Trash2 size={16} /> Delete Customer</button>
                              </div>
                           )}
                        </div>
                    </div>

                    <div className="space-y-6">
                       <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-[0.3em] border-b border-slate-50 pb-3 flex justify-between items-center"><span>ADDRESS</span> <ChevronDown size={14}/></h4>
                        <div className="grid grid-cols-2 gap-10 pt-2">
                           <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                 <p className="text-[13px] font-bold text-slate-800 uppercase tracking-tighter">Billing Address</p>
                              </div>
                              {renderAddress('billing')}
                           </div>
                           <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                 <p className="text-[13px] font-bold text-slate-800 uppercase tracking-tighter">Shipping Address</p>
                              </div>
                              {renderAddress('shipping')}
                           </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                       <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-[0.3em] border-b border-slate-50 pb-3 flex justify-between items-center"><span>OTHER DETAILS</span> <ChevronDown size={14}/></h4>
                       <div className="space-y-6 pt-2">
                          <DetailRow label="Customer Type" value={customer.customerType || 'Business'} />
                          <DetailRow label="Default Currency" value={customer.currency || 'INR'} />
                          <DetailRow label="Portal Status" value={<div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500"></div> <span className="text-red-500 font-bold text-[13px]">Disabled</span></div>} />
                          <DetailRow label="Customer Language" value={customer.language || 'English'} />
                       </div>
                    </div>

                    <div className="space-y-6">
                       <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-[0.3em] border-b border-slate-50 pb-3 flex justify-between items-center">
                          <span>CONTACT PERSONS</span>
                          <div className="flex items-center gap-3">
                             <button onClick={() => navigate(`/customers/${customer.id}`)} className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-100 hover:scale-110 transition-transform"><Plus size={14}/></button>
                             <ChevronDown size={14}/>
                          </div>
                       </h4>
                       <div className="py-12 text-center bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100"><p className="text-[13px] text-slate-400 font-medium italic">No contact persons found.</p></div>
                    </div>
                  </div>
                  <div className="flex-1 space-y-12 border-l border-slate-50 pl-10 pb-20">
                     <div className="p-8 bg-blue-600 rounded-2xl text-white relative overflow-hidden shadow-2xl shadow-blue-100 group-banner">
                        <div className="absolute top-[-30px] right-[-30px] w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none group-hover-banner:scale-150 transition-transform duration-1000"></div>
                        <div className="relative z-10 flex items-start justify-between gap-10">
                           <div className="space-y-3">
                              <div className="flex items-center gap-2 text-[14px] font-bold italic tracking-widest text-blue-100 uppercase"><Sparkles size={16} className="fill-blue-200/50" /> WHAT'S NEXT?</div>
                              <p className="text-[16px] text-white/90 font-medium leading-relaxed">Create an <span className="font-bold text-white underline decoration-white/40 underline-offset-4">invoice</span> or a <span className="font-bold text-white underline decoration-white/40 underline-offset-4">quote</span> and send it to your customer.</p>
                           </div>
                           <div className="flex flex-col gap-2 shrink-0">
                              <button onClick={() => navigate('/sales-invoices/new')} className="px-6 py-2 bg-white text-blue-600 rounded-lg text-[13px] font-bold hover:bg-blue-50 transition-all shadow-xl shadow-blue-900/10">New Invoice</button>
                              <button onClick={() => navigate('/quotes/new')} className="px-6 py-2 bg-blue-500/30 text-white border border-white/20 rounded-lg text-[13px] font-bold hover:bg-blue-500/50 transition-all">New Quote</button>
                           </div>
                        </div>
                     </div>

                     <div className="space-y-2 group cursor-pointer max-w-fit" onClick={() => setIsEditingPaymentTerms(true)}>
                        <p className="text-[11px] font-bold text-slate-300 uppercase tracking-[0.3em]">Payment due period</p>
                        {!isEditingPaymentTerms ? <p className="text-[18px] text-slate-900 font-bold tracking-tight flex items-center gap-3">{customer.paymentTerms || 'Due on Receipt'} <Edit size={14} className="text-blue-400 transition-opacity"/></p> : (
                          <div className="flex items-center gap-2 pt-1 animate-fade-in">
                            <input autoFocus type="text" value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} className="px-4 py-2 border-2 border-blue-100 rounded-lg outline-none focus:border-blue-500 shadow-sm font-bold" />
                            <button onClick={() => handleUpdateField('paymentTerms', paymentTerms)} className="p-2.5 bg-blue-600 text-white rounded-lg shadow-lg shadow-blue-100 hover:bg-blue-700"><Save size={18}/></button>
                            <button onClick={() => setIsEditingPaymentTerms(false)} className="p-2.5 bg-slate-100 text-slate-400 rounded-lg hover:bg-slate-200"><X size={18}/></button>
                          </div>
                        )}
                     </div>

                     <div className="space-y-6">
                        <h4 className="text-[20px] font-bold text-slate-900 tracking-tight flex items-center gap-3">Receivables <div className="h-0.5 flex-1 bg-slate-50"></div></h4>
                        <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-2xl shadow-slate-100 bg-white">
                           <table className="w-full text-left">
                              <thead><tr className="bg-slate-50/50 border-b border-slate-100 font-bold text-[11px] text-slate-400 uppercase tracking-[0.2em]"><th className="px-8 py-5">CURRENCY</th><th className="px-8 py-5 text-right">OUTSTANDING</th><th className="px-8 py-5 text-right">CREDITS</th></tr></thead>
                              <tbody><tr><td className="px-8 py-8 font-bold text-slate-700">{customer.currency || 'INR'}</td><td className="px-8 py-8 text-right font-bold text-[24px] text-slate-900">₹{parseFloat(customer.currentBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td><td className="px-8 py-8 text-right text-slate-300 font-mono font-bold">₹0.00</td></tr></tbody>
                           </table>
                        </div>
                        <div className="flex items-center gap-3">
                           {!isEditingBalance ? <button onClick={() => setIsEditingBalance(true)} className="text-[14px] font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-2">Enter Opening Balance <Plus size={16} strokeWidth={3}/></button> : (
                             <div className="flex items-center gap-2 animate-fade-in">
                                <input autoFocus type="number" value={openingBalance} onChange={e => setOpeningBalance(e.target.value)} className="px-4 py-2 border-2 border-blue-100 rounded-lg outline-none w-48 font-bold" />
                                <button onClick={() => handleUpdateField('openingBalance', openingBalance)} className="p-2.5 bg-blue-600 text-white rounded-lg shadow-lg shadow-blue-100 hover:bg-blue-700"><Save size={18}/></button>
                                <button onClick={() => setIsEditingBalance(false)} className="p-2.5 bg-slate-100 text-slate-400 rounded-lg hover:bg-slate-200"><X size={18}/></button>
                             </div>
                           )}
                        </div>
                     </div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
           <div className="flex-1 flex flex-col items-center justify-center p-20 animate-fade-in text-center opacity-40">
              <div className="w-32 h-32 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 mb-8 border border-slate-100 shadow-inner rotate-6"><Users size={64} strokeWidth={1}/></div>
              <h3 className="text-[24px] font-bold text-slate-900 mb-3 tracking-tighter">Select a Customer</h3>
              <p className="text-[15px] text-slate-500 max-w-sm mx-auto font-medium">Click on a name in the list to reveal their hidden details.</p>
           </div>
         )}
      </div>

      {/* ─── ADDRESS DRAWER ───────────────────────────────── */}
      {isAddressDrawerOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setIsAddressDrawerOpen(false)} />
          <div className="relative w-[500px] bg-white h-full shadow-2xl animate-slide-left flex flex-col">
            <header className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/20">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight uppercase italic">{addressType} Address</h3>
                <p className="text-[13px] text-slate-400 font-bold uppercase tracking-widest mt-1">FOR {customer.name}</p>
              </div>
              <button onClick={() => setIsAddressDrawerOpen(false)} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-slate-900 shadow-sm"><X size={24}/></button>
            </header>
            
            <div className="flex-1 overflow-y-auto p-10 space-y-8 no-scrollbar">
               <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Attention</label>
                  <input type="text" value={addressForm.attention} onChange={e => setAddressForm({...addressForm, attention: e.target.value})} className="w-full p-4 bg-slate-50 border-none rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-600 transition-all" />
               </div>

               <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Street Address 1</label>
                  <input type="text" value={addressForm.address1} onChange={e => setAddressForm({...addressForm, address1: e.target.value})} className="w-full p-4 bg-slate-50 border-none rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-600 transition-all" />
               </div>

               <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Street Address 2</label>
                  <input type="text" value={addressForm.address2} onChange={e => setAddressForm({...addressForm, address2: e.target.value})} className="w-full p-4 bg-slate-50 border-none rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-600 transition-all" />
               </div>

               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">City</label>
                    <input type="text" value={addressForm.city} onChange={e => setAddressForm({...addressForm, city: e.target.value})} className="w-full p-4 bg-slate-50 border-none rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-600 transition-all" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">State</label>
                    <input type="text" value={addressForm.state} onChange={e => setAddressForm({...addressForm, state: e.target.value})} className="w-full p-4 bg-slate-50 border-none rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-600 transition-all" />
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Zip Code</label>
                    <input type="text" value={addressForm.zip} onChange={e => setAddressForm({...addressForm, zip: e.target.value})} className="w-full p-4 bg-slate-50 border-none rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-600 transition-all" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Phone</label>
                    <input 
                        type="text" 
                        value={addressForm.phone} 
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setAddressForm({...addressForm, phone: val});
                        }} 
                        maxLength={10}
                        placeholder="10-digit phone number"
                        className="w-full p-4 bg-slate-50 border-none rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-600 transition-all" 
                     />
                  </div>
               </div>
            </div>

            <footer className="p-8 border-t border-slate-100 flex items-center gap-4 bg-slate-50/30">
               <button onClick={() => setIsAddressDrawerOpen(false)} className="px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-[13px] font-bold hover:bg-slate-100 transition-all uppercase tracking-widest">Discard</button>
               <button 
                  onClick={() => {
                    handleUpdateField(addressType === 'billing' ? 'billingAddress' : 'shippingAddress', JSON.stringify(addressForm));
                    setIsAddressDrawerOpen(false);
                  }}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-[13px] font-bold hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all uppercase tracking-widest"
               >
                 Save Address
               </button>
            </footer>
          </div>
        </div>
      )}
      {/* ─── QUICK ADD DRAWER ──────────────────────────────── */}
      {isQuickAddOpen && (
        <div className="fixed inset-0 z-[200] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setIsQuickAddOpen(false)} />
          <div className="relative w-[500px] bg-white h-full shadow-2xl animate-slide-left flex flex-col">
            <header className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/20">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight uppercase italic">Register New Customer</h3>
                <p className="text-[13px] text-slate-400 font-bold uppercase tracking-widest mt-1">QUICK ONBOARDING</p>
              </div>
              <button onClick={() => setIsQuickAddOpen(false)} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-slate-900 shadow-sm"><X size={24}/></button>
            </header>
            
            <div className="flex-1 overflow-y-auto p-10 space-y-8 no-scrollbar">
               <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-1 space-y-3">
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Salutation</label>
                     <select value={quickAddForm.salutation} onChange={e => setQuickAddForm({...quickAddForm, salutation: e.target.value})} className="w-full p-4 bg-slate-50 border-none rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-600 transition-all">
                        <option>Mr.</option><option>Ms.</option><option>Mrs.</option><option>Dr.</option>
                     </select>
                  </div>
                  <div className="col-span-3 space-y-3">
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Primary Name*</label>
                     <input type="text" value={quickAddForm.name} onChange={e => setQuickAddForm({...quickAddForm, name: e.target.value})} className="w-full p-4 bg-slate-50 border-none rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-600 transition-all" placeholder="Enter full name or business name" />
                  </div>
               </div>

               <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Customer Email</label>
                  <div className="relative">
                     <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                     <input type="email" value={quickAddForm.email} onChange={e => setQuickAddForm({...quickAddForm, email: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-600 transition-all" placeholder="example@business.com" />
                  </div>
               </div>

               <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking_widest block">Mobile Number</label>
                  <div className="relative">
                     <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                     <input 
                        type="text" 
                        value={quickAddForm.mobile} 
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setQuickAddForm({...quickAddForm, mobile: val});
                        }} 
                        maxLength={10}
                        placeholder="10-digit mobile number"
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-600 transition-all" 
                     />
                  </div>
               </div>

               <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100/50 flex items-start gap-4">
                  <Info size={18} className="text-blue-500 mt-0.5" />
                  <p className="text-[12px] text-blue-600 font-medium leading-relaxed">You can always update additional information like GSTIN, Billing Address, and Payment Terms later.</p>
               </div>
            </div>

            <footer className="p-8 border-t border-slate-100 flex items-center gap-4 bg-slate-50/30">
               <button onClick={() => setIsQuickAddOpen(false)} className="px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-[13px] font-bold hover:bg-slate-100 transition-all uppercase tracking-widest">Cancel</button>
               <button 
                  onClick={handleQuickAdd}
                  disabled={loading || !quickAddForm.name}
                  className="flex-1 py-4 bg-slate-900 text-white rounded-xl text-[13px] font-bold hover:bg-black shadow-xl shadow-slate-200 transition-all uppercase tracking-widest disabled:opacity-50"
               >
                  {loading ? <Loader2 size={18} className="animate-spin mx-auto" /> : 'REGISTER CUSTOMER'}
               </button>
            </footer>
          </div>
        </div>
      )}
      <ComposeMailModal 
        isOpen={isComposeModalOpen}
        onClose={() => setIsComposeModalOpen(false)}
        recipientEmail={customer?.email}
        recipientName={`${customer?.salutation || ''} ${customer?.firstName || ''} ${customer?.lastName || ''}`.trim()}
        ledgerId={selectedId}
        companyId={companyId}
        onSent={() => {
          fetchMails();
          addNotification({ message: 'Email sent successfully', type: 'success' });
        }}
      />

      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Customer"
        message="Are you sure you want to permanently delete this customer? This action will remove all transaction history and profile details."
      />

      {isPreviewOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-10">
          <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md animate-fade-in" onClick={() => setIsPreviewOpen(false)} />
          <button 
            onClick={() => setIsPreviewOpen(false)}
            className="absolute top-10 right-10 text-white/50 hover:text-white transition-colors"
          >
            <X size={40} strokeWidth={1}/>
          </button>
          <img 
            src={customer.image} 
            className="relative z-10 max-w-full max-h-full rounded-2xl shadow-2xl animate-zoom-in" 
            alt="Customer Preview"
          />
        </div>
      )}
    </div>
  );
};

const DetailRow = ({ label, value }) => (
  <div className="flex justify-between items-start text-[14px] group/row">
    <span className="text-slate-300 font-bold tracking-widest text-[11px] uppercase w-1/3 pt-1">{label}</span>
    <span className="text-slate-800 font-bold w-2/3 text-left leading-tight group-hover/row:text-blue-600 transition-colors">{value}</span>
  </div>
);

export default CustomerDetailView;
