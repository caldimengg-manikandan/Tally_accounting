import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Plus, Search, Filter, Download, Columns, Rows, ChevronLeft, ChevronRight, ChevronDown,
  Settings, X, HelpCircle, Package, User, Calendar, FileText, Trash2,
  ArrowLeft, Save, Send, Clock, MoreHorizontal, CheckCircle2, AlertCircle, Loader2, Edit2, RefreshCw, ShieldCheck,
  Printer, History, Share2, Bold, Italic, Underline, ArrowUp, ArrowDown, Mail
} from 'lucide-react';
import { salesAPI, ledgerAPI, inventoryAPI, companyAPI, projectAPI, mailAPI } from '../../services/api';
import ConfirmModal from '../../components/ConfirmModal';
import EmailSendModal from '../../components/EmailSendModal';
import useNotificationStore from '../../store/notificationStore';
import { getCurrencyDisplay } from '../../utils/currencies';
import { getUser } from '../../stores/authStore';
import usePermissions from '../../hooks/usePermissions';

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// MANAGE SALESPERSONS MODAL (Internal)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const ManageSalespersonsModal = ({ isOpen, onClose, salespersons, onSave, onSelect }) => {
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');

  if (!isOpen) return null;

  const filtered = salespersons.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.email && s.email.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSaveAndSelect = () => {
    if (!newName.trim()) return;
    const entry = { id: Date.now(), name: newName.trim(), email: newEmail.trim() };
    const updated = [...salespersons, entry];
    localStorage.setItem('tally_salespersons', JSON.stringify(updated));
    onSave(updated);
    onSelect(entry.name);
    setNewName('');
    setNewEmail('');
    setShowAddForm(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-[0_30px_80px_rgba(0,0,0,0.2)] w-full max-w-lg overflow-hidden animate-scale-up">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-[18px] font-bold text-slate-900 tracking-tight">Manage Salespersons</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition-colors"><X size={18} /></button>
        </div>
        <div className="px-6 py-4 flex items-center gap-3 border-b border-slate-100">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search Salesperson"
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-[13px] font-medium outline-none focus:border-blue-500 transition-all"
            />
          </div>
          <button onClick={() => setShowAddForm(true)} className="px-4 py-2 bg-blue-600 text-white text-[13px] font-bold rounded-lg hover:bg-blue-700 transition-all flex items-center gap-1.5 whitespace-nowrap shadow-md shadow-blue-100">
            <Plus size={14} /> New Salesperson
          </button>
        </div>
        {showAddForm && (
          <div className="mx-6 my-4 p-5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-[11px] font-bold text-red-500 uppercase tracking-widest mb-1.5">Name*</label>
                <input value={newName} onChange={e => setNewName(e.target.value)} className="w-full h-9 px-3 border border-slate-300 rounded text-[13px] font-medium outline-none focus:border-blue-500 bg-white transition-all" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Email</label>
                <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="w-full h-9 px-3 border border-slate-300 rounded text-[13px] font-medium outline-none focus:border-blue-500 bg-white transition-all" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleSaveAndSelect} disabled={!newName.trim()} className="px-5 py-2 bg-blue-600 text-white text-[12px] font-bold rounded hover:bg-blue-700 transition-all disabled:opacity-40 shadow-sm">Save and Select</button>
              <button onClick={() => { setShowAddForm(false); setNewName(''); setNewEmail(''); }} className="px-5 py-2 bg-white border border-slate-200 text-slate-600 text-[12px] font-bold rounded hover:bg-slate-50 transition-all">Cancel</button>
            </div>
          </div>
        )}
        <div className="px-6">
          <div className="sticky top-0 bg-white grid grid-cols-2 py-3 border-b border-slate-100 z-10">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Salesperson Name</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</span>
          </div>
          <div className="max-h-56 overflow-y-auto no-scrollbar">
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-[13px] font-medium">No salespersons found.</div>
            ) : (
              filtered.map(s => (
                <div key={s.id} onClick={() => { onSelect(s.name); onClose(); }} className="grid grid-cols-2 py-3 border-b border-slate-50 hover:bg-blue-50 cursor-pointer rounded transition-colors">
                  <span className="text-[13px] font-bold text-blue-600">{s.name}</span>
                  <span className="text-[13px] text-slate-500 font-medium">{s.email || 'â€”'}</span>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="px-6 py-4" />
      </div>
    </div>
  );
};

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// CUSTOMER SEARCH SELECTOR
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const CustomerSearchSelector = ({ value, onChange, customers, placeholder, onNewCustomer }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filtered = (customers || []).filter(c => {
        if (!c) return false;
        return (c.displayName || c.name || '').toLowerCase().includes(search.toLowerCase()) ||
               (c.companyName || '').toLowerCase().includes(search.toLowerCase());
    });

    return (
        <div className="relative w-full" ref={containerRef}>
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full h-12 px-5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer focus-within:bg-white focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-50 transition-all appearance-none shadow-sm"
            >
                <div className="flex-1 overflow-hidden">
                    {value ? (
                        <div className="text-[14px] font-bold text-slate-800 tracking-tight truncate">{value}</div>
                    ) : (
                        <div className="text-[14px] font-bold text-slate-400">{placeholder}</div>
                    )}
                </div>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 shadow-2xl rounded-xl z-[200] overflow-hidden animate-fade-in flex flex-col">
                    <div className="p-3 border-b border-slate-50 bg-slate-50/50">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                autoFocus
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search customers..."
                                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-[13px] outline-none focus:border-blue-500 transition-all font-medium"
                            />
                        </div>
                    </div>
                    <div className="max-h-[250px] overflow-y-auto no-scrollbar py-1">
                        {filtered.length > 0 ? (
                            filtered.map(c => (
                                <div 
                                    key={c.id}
                                    onClick={() => { onChange(c.id); setIsOpen(false); setSearch(''); }}
                                    className="px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors group mx-1 rounded-lg flex items-center gap-3"
                                >
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                        <User size={14} />
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="text-[14px] font-bold text-slate-800 tracking-tight">{c.displayName || c.name}</div>
                                        {c.companyName && c.companyName !== (c.displayName || c.name) && (
                                            <div className="text-[11px] text-slate-400 font-medium">{c.companyName}</div>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-8 text-center flex flex-col items-center justify-center">
                                <User size={20} className="text-slate-300 mb-2" />
                                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">No customers found</p>
                            </div>
                        )}
                    </div>
                    <div className="border-t border-slate-100 p-2 bg-slate-50 shrink-0">
                        <button 
                            onClick={() => { setIsOpen(false); onNewCustomer(); }}
                            className="w-full flex items-center justify-center gap-2 py-2.5 text-[#1e61f0] font-bold text-[13px] hover:bg-blue-600 hover:text-white rounded transition-all uppercase tracking-widest"
                        >
                            <Plus size={16} strokeWidth={3} /> New Customer
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// ITEM SEARCH SELECTOR
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const ItemSearchSelector = ({ value, onChange, items, placeholder, onNewItem }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filtered = (items || []).filter(it => {
        if (!it) return false;
        const n = it.name || '';
        const d = it.salesDescription || '';
        const s = search.toLowerCase();
        const matchesSearch = n.toLowerCase().includes(s) || d.toLowerCase().includes(s);
        const isSalesItem = it.salesInformation !== false && it.salesInformation !== 0 && it.salesInformation !== 'false'; // Default to true if missing
        return matchesSearch && isSalesItem;
    });

    return (
        <div className="relative w-full" ref={containerRef}>
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between cursor-pointer group"
            >
                <div className="flex-1">
                    {value ? (
                        <div className="text-[14px] font-bold text-slate-900 tracking-tight">{value}</div>
                    ) : (
                        <div className="text-[14px] font-medium text-slate-400 italic">{placeholder}</div>
                    )}
                </div>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-[350px] bg-white border border-slate-200 shadow-2xl rounded-xl z-[300] overflow-hidden animate-fade-in flex flex-col">
                    <div className="p-3 border-b border-slate-50 bg-slate-50/50">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                autoFocus
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search items..."
                                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-[13px] outline-none focus:border-blue-500 transition-all font-medium"
                            />
                        </div>
                    </div>
                    <div className="max-h-[250px] overflow-y-auto no-scrollbar py-1">
                        {filtered.length > 0 ? (
                            filtered.map(it => (
                                <div 
                                    key={it.id}
                                    onClick={() => { onChange(it); setIsOpen(false); setSearch(''); }}
                                    className="px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors group mx-1 rounded-lg"
                                >
                                    <div className="flex justify-between items-start mb-0.5">
                                        <div className="text-[14px] font-bold text-slate-800 tracking-tight flex items-center gap-2">
                                            <Package size={14} className="text-blue-500 opacity-50" /> {it.name}
                                        </div>
                                        <div className="text-[13px] font-bold text-slate-900">{getCurrencyDisplay(it.currency)} {parseFloat(it.sellingPrice || 0).toLocaleString()}</div>
                                    </div>
                                    <div className="text-[11px] text-slate-400 font-medium whitespace-nowrap overflow-hidden text-ellipsis italic">
                                        {it.salesDescription || 'No description provided'}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-8 text-center flex flex-col items-center justify-center">
                                <Package size={20} className="text-slate-300 mb-2" />
                                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">No matching items</p>
                            </div>
                        )}
                    </div>
                    <div className="border-t border-slate-100 p-2 bg-slate-50 shrink-0">
                        <button 
                            onClick={() => { setIsOpen(false); onNewItem(); }}
                            className="w-full flex items-center justify-center gap-2 py-2.5 text-[#1e61f0] font-bold text-[13px] hover:bg-blue-600 hover:text-white rounded transition-all uppercase tracking-widest"
                        >
                            <Plus size={16} strokeWidth={3} /> New Item
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const SalesOrdersView = ({ companyId }) => {
    const { canCreate, canEdit, canDelete } = usePermissions();
    const navigate = useNavigate();
    const location = useLocation();
    const [view, setView] = useState(location.pathname === '/sales-orders/new' ? 'form' : 'list'); // 'list', 'form', 'detail'
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [orders, setOrders] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [items, setItems] = useState([]);
    const [projects, setProjects] = useState([]);
    const [currentCompany, setCurrentCompany] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [salespersons, setSalespersons] = useState([]);
    const [isSalespersonModalOpen, setIsSalespersonModalOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', type: 'info', showCancel: false });
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const { addNotification } = useNotificationStore();

    const currentUserEmail = useMemo(() => {
        try {
            const u = getUser();
            return u?.email || '';
        } catch (e) {
            return '';
        }
    }, []);

    const formatDate = (dateStr, options = { day: '2-digit', month: '2-digit', year: 'numeric' }) => {
        if (!dateStr) return '—';
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return '—';
            return d.toLocaleDateString('en-IN', options);
        } catch (e) {
            return '—';
        }
    };

    // List view states moved to top level
    const [isOptionsOpen, setIsOptionsOpen] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

    const [formData, setFormData] = useState({
        id: null,
        customerId: '',
        orderNumber: '',
        referenceNumber: '',
        date: new Date().toISOString().split('T')[0],
        expectedShipmentDate: '',
        paymentTerms: 'Due on Receipt',
        salesperson: '',
        items: [{ id: Date.now(), itemId: '', detail: '', quantity: 0, rate: 0, amount: 0 }],
        subTotal: 0,
        discount: 0,
        taxPercent: 18,
        tax: 0,
        adjustment: 0,
        tcsApplicable: false,
        tcsRate: '',
        tcsAmount: 0,
        totalAmount: 0,
        status: 'Draft',
        customerNotes: '',
        termsConditions: '',
        projectId: ''
    });

    const fetchData = async () => {
        if (!companyId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const [oRes, cRes, iRes, projRes, compRes] = await Promise.all([
                salesAPI.getOrders(companyId),
                ledgerAPI.getByCompany(companyId),
                inventoryAPI.getByCompany(companyId, 'sales'),
                projectAPI.getByCompany(companyId),
                companyAPI.getById(companyId)
            ]);

            setOrders(Array.isArray(oRes.data) ? oRes.data : []);
            setCustomers(Array.isArray(cRes.data) ? cRes.data.filter(l => 
                l.Group?.name?.toLowerCase().includes('debtor') || 
                l.Group?.name?.toLowerCase().includes('customer') ||
                l.groupName?.toLowerCase().includes('debtor') ||
                l.groupName?.toLowerCase().includes('customer')
            ) : []);
            setItems(Array.isArray(iRes.data) ? iRes.data : []);
            setProjects(Array.isArray(projRes.data) ? projRes.data : []);
            setCurrentCompany(compRes.data || null);
        } catch (err) {
            console.error('Fetch error:', err);
            addNotification('Failed to sync sales data.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const saved = localStorage.getItem('tally_salespersons');
        if (saved) setSalespersons(JSON.parse(saved));
    }, [companyId]);

    // Form Calculations
    useEffect(() => {
        const subTotal = formData.items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        const discountAmt = subTotal * (parseFloat(formData.discount || 0) / 100);
        const taxableAmount = subTotal - discountAmt;
        const tax = taxableAmount * (parseFloat(formData.taxPercent || 0) / 100);
        const tcsAmt = formData.tcsApplicable ? (taxableAmount + tax) * (parseFloat(formData.tcsRate || 0) / 100) : 0;
        const total = taxableAmount + tax + (parseFloat(formData.adjustment || 0)) + tcsAmt;
        setFormData(prev => ({ ...prev, subTotal, tax, tcsAmount: tcsAmt, totalAmount: total }));
    }, [formData.items, formData.discount, formData.taxPercent, formData.adjustment, formData.tcsApplicable, formData.tcsRate]);

    const handleItemUpdate = (id, field, value) => {
        setFormData(prev => {
            const newItems = prev.items.map(item => {
                if (item.id === id) {
                    const updated = { ...item, [field]: value };
                    if (field === 'itemId') {
                        const selected = items.find(i => i.id === value);
                        if (selected) {
                            updated.detail = selected.name;
                            updated.rate = selected.sellingPrice || 0;
                            const currentQty = parseFloat(updated.quantity) || 0;
                            updated.quantity = currentQty === 0 ? 1 : currentQty;
                        }
                    }
                    updated.amount = (parseFloat(updated.quantity) || 0) * (parseFloat(updated.rate) || 0);
                    return updated;
                }
                return item;
            });
            return { ...prev, items: newItems };
        });
    };

    const handleAddField = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { id: Date.now(), itemId: '', detail: '', quantity: 1, rate: 0, amount: 0 }]
        }));
    };

    const handleRemoveField = (id) => {
        if (formData.items.length === 1) return;
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter(item => item.id !== id)
        }));
    };

    const handleSave = async (statusValue = 'Draft') => {
        if (!formData.customerId) {
            addNotification('Please select a customer.', 'error');
            return;
        }
        setSaving(true);
        try {
            const payload = { ...formData, companyId, status: statusValue };
            let savedOrder;
            if (formData.id) {
                const res = await salesAPI.updateOrder(formData.id, payload);
                savedOrder = res.data;
                addNotification('Sales Order updated.', 'success');
            } else {
                const res = await salesAPI.createOrder(payload);
                savedOrder = res.data;
                addNotification('Sales Order created.', 'success');
            }
            
            fetchData();
            
            if (statusValue === 'Sent') {
                const customer = customers.find(c => c.id === formData.customerId);
                const detailedOrder = {
                    ...formData,
                    ...savedOrder,
                    id: savedOrder?.id || formData.id,
                    Customer: customer,
                    Items: formData.items,
                    LedgerId: formData.customerId
                };
                setSelectedOrder(detailedOrder);
                setView('detail');
                setTimeout(() => setIsEmailModalOpen(true), 100);
            } else {
                setView('list');
            }
        } catch (err) {
            addNotification('Failed to save sales order.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await salesAPI.deleteOrder(deleteId);
            addNotification('Order deleted.', 'success');
            fetchData();
        } catch (err) {
            addNotification('Failed to delete order.', 'error');
        } finally {
            setIsDeleteModalOpen(false);
            setDeleteId(null);
        }
    };

    const resetForm = async () => {
        // Restore a stashed draft if navigated back from project creation
        const stashed = localStorage.getItem('so_draft_form');
        if (stashed) {
            try {
                const draft = JSON.parse(stashed);
                localStorage.removeItem('so_draft_form');
                setFormData(draft);
                return;
            } catch (e) {
                localStorage.removeItem('so_draft_form');
            }
        }

        let nextNo = `SO-${String(orders.length + 1).padStart(5, '0')}`;
        try {
            const nextRes = await salesAPI.getNextNumber(companyId, 'order');
            if (nextRes.data && nextRes.data.nextNumber) {
                nextNo = nextRes.data.nextNumber;
            }
        } catch (e) { console.error("Next order number load error:", e); }

        setFormData({
            id: null,
            customerId: '',
            orderNumber: nextNo,
            referenceNumber: '',
            date: new Date().toISOString().split('T')[0],
            expectedShipmentDate: '',
            paymentTerms: 'Due on Receipt',
            salesperson: '',
            items: [{ id: Date.now(), itemId: '', detail: '', quantity: 1, rate: 0, amount: 0 }],
            subTotal: 0,
            discount: 0,
            taxPercent: 18,
            tax: 0,
            adjustment: 0,
            tcsApplicable: false,
            tcsRate: '',
            tcsAmount: 0,
            totalAmount: 0,
            status: 'Draft',
            customerNotes: '',
            termsConditions: '',
            projectId: ''
        });
    };

    const openForm = async (order = null) => {
        if (order) {
            setFormData({
                ...order,
                customerId: order.LedgerId,
                items: order.Items?.map(i => ({ 
                    ...i, 
                    id: i.id, 
                    itemId: i.ItemId || i.itemId,
                    quantity: parseFloat(i.quantity) || 0,
                    rate: parseFloat(i.rate) || 0,
                    amount: parseFloat(i.amount) || 0
                })) || [{ id: Date.now(), itemId: '', detail: '', quantity: 1, rate: 0, amount: 0 }],
                subTotal: parseFloat(order.subTotal) || 0,
                discount: parseFloat(order.discount) || 0,
                taxPercent: parseFloat(order.taxPercent) || 0,
                tax: parseFloat(order.tax) || 0,
                adjustment: parseFloat(order.adjustment) || 0,
                tcsApplicable: order.tcsApplicable || false,
                tcsRate: order.tcsRate || '',
                tcsAmount: parseFloat(order.tcsAmount) || 0,
                totalAmount: parseFloat(order.totalAmount) || 0,
            });
        } else {
            await resetForm();
        }
        setView('form');
    };

    useEffect(() => {
        if (location.pathname === '/sales-orders/new') {
            if (view !== 'form') {
                resetForm();
                setView('form');
            }
            setLoading(false);
        } else if (location.pathname === '/sales-orders') {
            setView('list');
        }
    }, [location.pathname]);

    const openDetail = (order) => {
        setSelectedOrder(order);
        setView('detail');
    };

    const filteredOrders = orders.filter(o => 
        o.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.Customer?.displayName || o.Customer?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderListView = () => {
        const handleSort = (key) => {
            let direction = 'asc';
            if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
            setSortConfig({ key, direction });
            setIsOptionsOpen(false);
        };

        const sortedOrders = [...filteredOrders].sort((a, b) => {
            let aValue = a[sortConfig.key] || '';
            let bValue = b[sortConfig.key] || '';
            if (sortConfig.key === 'Customer.name') {
                aValue = (a.Customer?.displayName || a.Customer?.name || '').toLowerCase();
                bValue = (b.Customer?.displayName || b.Customer?.name || '').toLowerCase();
            } else if (sortConfig.key === 'totalAmount') {
               aValue = parseFloat(aValue || 0);
               bValue = parseFloat(bValue || 0);
            } else {
               aValue = String(aValue).toLowerCase();
               bValue = String(bValue).toLowerCase();
            }
            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        const SortOption = ({ label, sortKey }) => {
            const isActive = sortConfig.key === sortKey;
            return (
               <div 
                  onClick={(e) => { e.stopPropagation(); handleSort(sortKey); }}
                  className={`px-4 py-2 cursor-pointer flex justify-between items-center rounded-sm mx-1 mt-1 ${isActive ? 'bg-[#1e61f0] text-white' : 'hover:bg-[#f4f5f7] text-slate-700'}`}
               >
                  {label} 
                  {isActive && (sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
               </div>
            );
        };

        return (
            <div className="flex-1 flex flex-col h-full bg-white animate-fade-in overflow-hidden">
                <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-[#fcfdfe]">
                    <div className="flex items-center gap-2 group cursor-pointer">
                        <h1 className="text-[20px] font-bold text-slate-900 tracking-tight">All Sales Orders</h1>
                        <ChevronDown size={18} className="text-blue-600 mt-1" />
                    </div>
                    <div className="flex items-center gap-3">
                        {canCreate && (
                            <button 
                                onClick={() => navigate('/sales-orders/new')}
                                className="bg-[#1e61f0] hover:bg-[#1a54d1] text-white px-5 py-2.5 rounded-md font-bold text-[12px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm"
                            >
                                <Plus size={18} strokeWidth={2.5} /> New Order
                            </button>
                        )}
                        <div className="relative">
                            <button 
                                onClick={(e) => { e.stopPropagation(); setIsOptionsOpen(!isOptionsOpen); }}
                                className="p-2.5 text-slate-500 hover:text-slate-800 border border-slate-200 bg-white rounded-md hover:bg-slate-50 transition-colors shadow-sm"
                            >
                                <MoreHorizontal size={18} />
                            </button>
                            {isOptionsOpen && (
                                <div className="absolute right-0 top-full mt-2 w-[220px] bg-white rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 z-50 py-1 text-[13px] font-medium text-[#2c3e50] animate-fade-down origin-top-right">
                                    <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50">Sort By</div>
                                    <SortOption label="Order Number" sortKey="orderNumber" />
                                    <SortOption label="Date" sortKey="date" />
                                    <SortOption label="Customer Name" sortKey="Customer.name" />
                                    <SortOption label="Amount" sortKey="totalAmount" />
                                    <div className="mt-2 pt-2 border-t border-slate-50">
                                        <div onClick={() => { setIsOptionsOpen(false); fetchData(); }} className="px-4 py-2 hover:bg-[#f4f5f7] cursor-pointer text-slate-700 flex items-center gap-2 font-medium text-[13px]"><RefreshCw size={14}/> Refresh List</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="px-8 py-4 bg-slate-50/50 flex items-center justify-between border-b border-slate-100">
                    <div className="relative group w-96">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1e61f0] transition-colors" />
                        <input 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search orders by number or customer..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-md text-[13px] font-medium text-slate-700 outline-none focus:border-[#1e61f0] shadow-sm transition-all"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar p-8">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Order Details</th>
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-right">Amount</th>
                                <th className="px-6 py-4 text-center w-28">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="6" className="px-6 py-8"><div className="h-4 bg-slate-50 rounded-md w-full"></div></td>
                                    </tr>
                                ))
                            ) : sortedOrders.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-30">
                                            <Package size={48} strokeWidth={1.5} className="text-slate-400" />
                                            <p className="text-[14px] font-bold uppercase tracking-widest text-slate-500">No order records identified</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                sortedOrders.map(order => (
                                    <tr 
                                        key={order.id} 
                                        onClick={() => openDetail(order)}
                                        className="hover:bg-slate-50/80 transition-all cursor-pointer group border-b border-slate-50"
                                    >
                                        <td className="px-6 py-6 text-[13px] font-medium text-slate-500 tabular-nums whitespace-nowrap">
                                            {formatDate(order.date, { day: '2-digit', month: '2-digit' })}
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="text-[14px] font-bold text-[#1e61f0] group-hover:underline uppercase tracking-tight">{order.orderNumber}</div>
                                            <div className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">Ref: {order.referenceNumber || 'INTERNAL'}</div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="text-[14px] font-medium text-slate-800 uppercase leading-none">{order.Customer?.displayName || order.Customer?.name || 'GENERIC CLIENT'}</div>
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            <span className={`px-2 py-0.5 rounded uppercase text-[10px] font-bold tracking-widest border ${
                                                order.status === 'Draft' ? 'bg-slate-50 text-slate-500 border-slate-100' :
                                                order.status === 'Sent' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                'bg-green-50 text-green-600 border-green-100'
                                            }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-6 text-right font-medium text-slate-900 tabular-nums text-[14px]">
                                            {getCurrencyDisplay(order.Customer?.currency)} {parseFloat(order.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-6" onClick={e => e.stopPropagation()}>
                                            <div className="flex items-center justify-center gap-2">
                                                {canEdit && (
                                                    <button 
                                                        onClick={() => openForm(order)} 
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 rounded shadow-sm transition-all text-[12px] font-medium"
                                                    >
                                                        <Edit2 size={13} /> Edit
                                                    </button>
                                                )}
                                                {canDelete && (
                                                    <button 
                                                        onClick={() => { setDeleteId(order.id); setIsDeleteModalOpen(true); }}
                                                        className="flex items-center justify-center p-1.5 bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 rounded shadow-sm transition-all"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderFormView = () => {
        const customer = customers.find(c => c.id === formData.customerId);
        const currencySymbol = getCurrencyDisplay(customer?.currency) || '₹';

        return (
            <div className="flex flex-col h-full bg-[#f8fafc] relative">
                {/* Form Header */}
                <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shrink-0 sticky top-0 z-20">
                    <div className="flex items-center gap-6">
                        <button 
                            onClick={() => navigate('/sales-orders')}
                            className="p-2 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-900 transition-all"
                        >
                            <ArrowLeft size={22} />
                        </button>
                        <div>
                            <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">
                                {formData.id ? 'Modify Sales Order' : 'Create Sales Order'}
                            </h2>
                            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Sales / Orders</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors"><Settings size={20}/></button>
                        <div className="w-px h-6 bg-slate-200" />
                        <button onClick={() => setView('list')} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                </header>

            <div className="flex-1 bg-white overflow-y-auto no-scrollbar pb-32">
                <div className="max-w-[1200px] mx-auto pt-6 px-10">
                    <div className="space-y-12 animate-fade-in">
                        {/* Section Header */}
                        <div className="flex items-center gap-4 mb-8">
                            <h3 className="text-[14px] font-bold text-slate-800">Primary Details</h3>
                            <div className="h-px bg-slate-100 flex-1"></div>
                        </div>

                        {/* Form Section: Core Details */}
                        <div className="space-y-6">
                            <div className="flex items-center">
                                <label className="w-48 text-[11px] font-bold text-rose-500 uppercase tracking-widest">Customer Selection*</label>
                                <div className="flex-1 max-w-2xl">
                                    <CustomerSearchSelector 
                                        value={(() => {
                                            const c = customers.find(c => c.id === formData.customerId);
                                            return c ? (c.displayName || c.name) : '';
                                        })()}
                                        customers={customers}
                                        placeholder="Search or select ledger..."
                                        onChange={(id) => setFormData(p => ({ ...p, customerId: id }))}
                                        onNewCustomer={() => {
                                            localStorage.setItem('so_draft', JSON.stringify(formData));
                                            window.open('/ledger/new', '_blank');
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center">
                                <label className="w-48 text-[11px] font-bold text-rose-500 uppercase tracking-widest">Sales Order #*</label>
                                <input 
                                    type="text" 
                                    value={formData.orderNumber} 
                                    onChange={e => setFormData(p => ({ ...p, orderNumber: e.target.value }))}
                                    className="flex-1 max-w-2xl h-9 px-3 bg-white border border-slate-200 rounded text-[13px] font-bold text-slate-900 outline-none focus:border-blue-400 transition-all uppercase tracking-widest"
                                />
                            </div>

                            <div className="flex items-center">
                                <label className="w-48 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Reference ID</label>
                                <input 
                                    type="text" 
                                    value={formData.referenceNumber} 
                                    onChange={e => setFormData(p => ({ ...p, referenceNumber: e.target.value }))}
                                    placeholder="e.g. PO-89021"
                                    className="flex-1 max-w-2xl h-9 px-3 bg-white border border-slate-200 rounded text-[13px] font-medium text-slate-700 outline-none focus:border-blue-400 transition-all"
                                />
                            </div>

                            <div className="flex items-center">
                                <label className="w-48 text-[11px] font-bold text-rose-500 uppercase tracking-widest">Order Date*</label>
                                <div className="flex-1 max-w-2xl relative">
                                    <Calendar size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    <input 
                                        type="date" 
                                        value={formData.date} 
                                        onChange={e => setFormData(p => ({ ...p, date: e.target.value }))}
                                        className="w-full h-9 px-3 bg-white border border-slate-200 rounded text-[13px] font-bold text-slate-700 outline-none focus:border-blue-400 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center">
                                <label className="w-48 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Expected Shipment</label>
                                <div className="flex-1 max-w-2xl relative">
                                    <Calendar size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    <input 
                                        type="date" 
                                        value={formData.expectedShipmentDate} 
                                        onChange={e => setFormData(p => ({ ...p, expectedShipmentDate: e.target.value }))}
                                        className="w-full h-9 px-3 bg-white border border-slate-200 rounded text-[13px] font-medium text-slate-700 outline-none focus:border-blue-400 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center">
                                <label className="w-48 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Payment Term</label>
                                <div className="flex-1 max-w-2xl relative group">
                                    <select 
                                        value={formData.paymentTerms} 
                                        onChange={e => setFormData(p => ({ ...p, paymentTerms: e.target.value }))}
                                        className="w-full h-9 px-3 bg-white border border-slate-200 rounded text-[13px] font-bold text-slate-900 outline-none focus:border-blue-400 transition-all appearance-none"
                                    >
                                        <option value="">Due on Receipt</option>
                                        <option value="Net 15">Net 15</option>
                                        <option value="Net 30">Net 30</option>
                                        <option value="Net 45">Net 45</option>
                                        <option value="Net 60">Net 60</option>
                                    </select>
                                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Project */}
                            <div className="flex items-center">
                                <label className="w-48 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Project</label>
                                <div className="flex-1 max-w-2xl relative group">
                                    <select 
                                        value={formData.projectId} 
                                        onChange={e => {
                                            const val = e.target.value;
                                            if (val === '__create_new_project__') {
                                                localStorage.setItem('so_draft_form', JSON.stringify(formData));
                                                navigate('/time-tracking/projects/new', { state: { returnTo: '/sales-orders/new' } });
                                            } else {
                                                setFormData(p => ({ ...p, projectId: val }));
                                            }
                                        }}
                                        className="w-full h-9 px-3 bg-white border border-slate-200 rounded text-[13px] font-bold text-slate-900 outline-none focus:border-blue-400 transition-all appearance-none"
                                    >
                                        <option value="">Select or associate project</option>
                                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        <option value="__create_new_project__">+ Create New Project</option>
                                    </select>
                                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        {/* Item Table Section */}
                        <div className="space-y-4 pt-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[14px] font-bold text-slate-900 uppercase tracking-[0.1em]">Line Items</h3>
                                <button className="text-[11px] font-bold text-slate-400 flex items-center gap-2 hover:bg-slate-50 px-3 py-1.5 rounded-none border border-slate-100 transition-all">
                                    <Settings size={14} /> Global Sync
                                </button>
                            </div>

                            <div className="border border-slate-200 rounded overflow-visible shadow-sm bg-white">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                            <th className="px-6 py-3 text-left">Item Details</th>
                                            <th className="px-6 py-3 text-right w-28">Quantity</th>
                                            <th className="px-6 py-3 text-right w-36">Rate</th>
                                            <th className="px-6 py-3 text-right w-40">Amount</th>
                                            <th className="w-12"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {formData.items.map((line, idx) => (
                                            <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-5">
                                                    <ItemSearchSelector 
                                                        value={line.detail}
                                                        items={items}
                                                        placeholder="Type to select item..."
                                                        onChange={(it) => handleItemUpdate(line.id, 'itemId', it.id)}
                                                        onNewItem={() => {
                                                            localStorage.setItem('so_draft_form', JSON.stringify(formData));
                                                            window.open('/inventory/new', '_blank');
                                                        }}
                                                    />
                                                    <textarea 
                                                        value={line.description}
                                                        onChange={e => handleItemUpdate(line.id, 'description', e.target.value)}
                                                        placeholder="Add item description..." 
                                                        className="w-full mt-2 h-10 bg-transparent text-[11px] text-slate-400 outline-none resize-none border-none focus:ring-0 placeholder:italic font-bold uppercase tracking-tight opacity-60"
                                                    />
                                                </td>
                                                <td className="px-6 py-5 align-top">
                                                    <input 
                                                        type="number" 
                                                        value={line.quantity} 
                                                        onChange={e => handleItemUpdate(line.id, 'quantity', parseFloat(e.target.value))}
                                                        className="w-full text-right bg-transparent border-none outline-none text-[13px] font-bold text-slate-600 focus:bg-white rounded transition-all tabular-nums" 
                                                    />
                                                </td>
                                                <td className="px-6 py-5 align-top font-mono">
                                                    <input 
                                                        type="number" 
                                                        value={line.rate} 
                                                        onChange={e => handleItemUpdate(line.id, 'rate', parseFloat(e.target.value))}
                                                        className="w-full text-right bg-transparent border-none outline-none text-[13px] font-bold text-slate-600 focus:bg-white rounded transition-all tabular-nums" 
                                                    />
                                                </td>
                                                <td className="px-6 py-5 text-right align-top">
                                                <span className="text-[13px] font-bold text-slate-900 tabular-nums">{getCurrencyDisplay(customers.find(c => c.id === formData.customerId)?.currency)} {(parseFloat(line.amount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                </td>
                                                <td className="px-4 py-5 text-center align-top">
                                                    <button onClick={() => handleRemoveField(line.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                                                        <Trash2 size={16}/>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            
                            <button onClick={handleAddField} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-[12px] font-bold rounded hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all uppercase tracking-widest">
                                <Plus size={14} strokeWidth={3}/> Add Row
                            </button>
                        </div>

                        {/* Bottom Section */}
                        <div className="flex justify-between items-start pt-12 border-t border-slate-100 gap-20">
                             <div className="flex-1 max-w-md space-y-8">
                                    <div className="space-y-3">
                                         <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Customer Notes</label>
                                         <textarea 
                                                value={formData.customerNotes} 
                                                onChange={e => setFormData({ ...formData, customerNotes: e.target.value })} 
                                                placeholder="Displayed on the document"
                                                className="w-full h-24 p-4 bg-white border border-slate-200 rounded text-[13px] font-medium text-slate-600 outline-none focus:border-blue-400 transition-all resize-none shadow-sm" 
                                         />
                                    </div>

                                    <div className="space-y-3">
                                         <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Terms & Conditions</label>
                                         <textarea 
                                                value={formData.termsConditions} 
                                                onChange={e => setFormData({ ...formData, termsConditions: e.target.value })} 
                                                placeholder="Business terms..." 
                                                className="w-full h-24 p-4 bg-white border border-slate-200 rounded text-[13px] font-medium text-slate-600 outline-none focus:border-blue-400 transition-all resize-none shadow-sm" 
                                         />
                                    </div>
                             </div>

                             <div className="w-[480px] space-y-4">
                                    <div className="flex justify-between items-start text-[13px]">
                                        <div className="flex flex-col gap-1 whitespace-nowrap">
                                            <span className="text-slate-700">Sub Total</span>
                                            <span className="text-slate-600">Total Quantity : {formData.items ? formData.items.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0) : 0}</span>
                                        </div>
                                        <div className="flex items-center gap-3 pt-0.5">
                                            <div className="w-36" />
                                            <span className="w-32 whitespace-nowrap text-right text-slate-700 font-mono">{currencySymbol} {formData.subTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center text-[13px]">
                                        <span className="text-slate-700">Discount (%)</span>
                                        <div className="flex items-center gap-3">
                                            <div className="w-36 flex justify-end">
                                                <input type="number" value={formData.discount} onChange={e => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })} className="w-24 h-9 px-3 bg-white border border-slate-200 rounded text-right font-bold outline-none focus:border-blue-400 transition-all tabular-nums" />
                                            </div>
                                            <span className="w-32 whitespace-nowrap text-right text-slate-700 font-mono">- {currencySymbol} {(formData.subTotal * (parseFloat(formData.discount || 0) / 100)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center text-[13px]">
                                        <span className="text-slate-700">Tax (GST)</span>
                                        <div className="flex items-center gap-3">
                                            <div className="relative w-36">
                                                <select 
                                                        value={formData.taxPercent} 
                                                        onChange={e => {
                                                        const rate = parseFloat(e.target.value) || 0;
                                                        setFormData(p => ({ ...p, taxPercent: rate }));
                                                    }}
                                                    className="w-full h-9 px-3 bg-white border border-slate-200 rounded text-[12px] font-bold text-slate-700 outline-none focus:border-blue-400 transition-all appearance-none"
                                            >
                                                    <option value="0">Select a Tax (0%)</option>
                                                    <option value="5">GST (5%)</option>
                                                    <option value="12">GST (12%)</option>
                                                    <option value="18">GST (18%)</option>
                                                    <option value="28">GST (28%)</option>
                                            </select>
                                            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                        </div>
                                        <span className="w-32 whitespace-nowrap text-right text-slate-700 font-mono">+ {currencySymbol} {(parseFloat(formData.tax) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    </div>

                                    <div className="flex justify-between items-center text-[13px]">
                                        <span className="text-slate-700">Adjustment</span>
                                        <div className="flex items-center gap-3">
                                            <div className="w-36 flex justify-end">
                                                <input type="number" value={formData.adjustment} onChange={e => setFormData({ ...formData, adjustment: e.target.value })} className="w-24 h-9 px-3 bg-white border border-slate-200 rounded text-right font-bold outline-none focus:border-blue-400 transition-all tabular-nums" />
                                            </div>
                                            <span className="w-32 whitespace-nowrap text-right text-slate-700 font-mono">{parseFloat(formData.adjustment || 0) >= 0 ? '+' : '-'} {currencySymbol} {Math.abs(parseFloat(formData.adjustment || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center text-[13px] py-1">
                                        <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap">
                                            <input 
                                                type="checkbox" 
                                                checked={formData.tcsApplicable} 
                                                onChange={e => setFormData({ ...formData, tcsApplicable: e.target.checked })} 
                                                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                            />
                                            <span className="text-slate-700">Apply TCS</span>
                                        </label>
                                        <div className="flex items-center gap-3">
                                            <div className="w-36 flex justify-end">
                                                {formData.tcsApplicable && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Rate %</span>
                                                        <input 
                                                            type="number"
                                                            value={formData.tcsRate} 
                                                            onChange={e => setFormData({ ...formData, tcsRate: e.target.value })}
                                                            className="w-16 h-9 px-2 bg-white border border-slate-200 rounded text-right font-bold outline-none focus:border-blue-400 transition-all tabular-nums" 
                                                            placeholder="e.g. 1"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                            <span className="w-32 whitespace-nowrap text-right font-bold text-slate-600 font-mono">
                                                {formData.tcsApplicable ? `+ ${currencySymbol} ${(formData.tcsAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="pt-6 mt-6 border-t border-slate-200">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[15px] font-bold text-slate-900 uppercase tracking-widest">Total Amount</span>
                                            <span className="text-[24px] font-bold text-blue-600 font-mono">{getCurrencyDisplay(customers.find(c => c.id === formData.customerId)?.currency)} {(parseFloat(formData.totalAmount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic flex items-center justify-end gap-1"><ShieldCheck size={12}/> Net Payable Amount</p>
                                    </div>
                             </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Form Actions Footer */}
            <footer className="bg-white border-t border-slate-200 px-12 py-4 flex items-center justify-between shrink-0 sticky bottom-0 z-20 shadow-[0_-5px_25px_rgba(0,0,0,0.05)]">
                <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Document Status</span>
                        <span className="text-[13px] font-bold text-blue-600 flex items-center gap-2 uppercase tracking-widest"><Clock size={14}/> {formData.status || 'Draft'}</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => handleSave('Draft')}
                        disabled={saving}
                        className="px-6 py-2.5 bg-white border border-slate-200 text-slate-500 rounded-xl text-[12px] font-bold hover:bg-slate-50 transition-all uppercase tracking-widest"
                    >
                        {saving ? 'Processing...' : 'Save Draft'}
                    </button>
                    <button 
                        onClick={() => handleSave('Sent')}
                        disabled={saving}
                        className="px-8 py-2.5 bg-blue-600 text-white rounded-xl text-[12px] font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2 uppercase tracking-widest active:scale-95"
                    >
                        {saving ? <Loader2 className="animate-spin" size={16} /> : <Send size={16}/>}
                        Initialize Order
                    </button>
                </div>
            </footer>
        </div>
        );
    };

    const renderDetailView = () => {
        const order = selectedOrder;
        if (!order) return null;
        const itemsList = order.Items || [];

        return (
            <div className="flex-1 flex flex-col h-full bg-[#f8fafc] animate-fade-in shadow-inner overflow-hidden">
                <div className="bg-[#fcfdfe] border-b border-slate-200 px-8 py-2.5 flex items-center justify-between sticky top-0 z-10 no-print">
                    <div className="flex items-center gap-2">
                        <button onClick={() => navigate('/sales-orders')} className="text-[13px] font-bold text-blue-600 hover:underline flex items-center gap-1.5 transition-all">
                           <ChevronDown size={14} className="rotate-90"/> All Sales Orders
                        </button>
                        <span className="text-slate-300">|</span>
                        <span className="text-[13px] font-bold text-slate-800 uppercase">{order.orderNumber}</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <button className="p-1.5 text-slate-400 hover:bg-slate-50 rounded-none transition-all hover:text-slate-600"><History size={16}/></button>
                       <button className="p-1.5 text-slate-400 hover:bg-slate-50 rounded-none transition-all hover:text-slate-600"><Share2 size={16}/></button>
                    </div>
                </div>

                <div className="bg-white border-b border-slate-100 px-8 py-2 flex items-center justify-between shadow-sm no-print">
                    <div className="flex items-center gap-1">
                        <button onClick={() => openForm(order)} className="px-3 py-1.5 text-slate-600 hover:bg-slate-50 rounded-none flex items-center gap-1.5 text-[12px] font-bold border border-transparent hover:border-slate-100 transition-all"><Edit2 size={14}/> Modify</button>
                        <button onClick={() => window.print()} className="px-3 py-1.5 text-slate-600 hover:bg-slate-50 rounded-none flex items-center gap-1.5 text-[12px] font-bold transition-all"><Printer size={14}/> PDF / Print</button>
                        <button onClick={() => setIsEmailModalOpen(true)} className="px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-none flex items-center gap-1.5 text-[12px] font-bold border border-transparent hover:border-blue-100 transition-all"><Mail size={14}/> Send Email</button>
                    </div>
                </div>

                 <div className="flex-1 overflow-y-auto p-4 md:p-10 flex flex-col items-center custom-scrollbar print:p-0 print:bg-white transition-all bg-slate-100">

                    {/* PDF PREVIEW PAPER â€” matches Purchase Order style */}
                    <div id="printable-order" className="pdf-preview-paper bg-white w-full max-w-[800px] min-h-[1050px] shadow-lg border border-slate-200/80 p-12 relative overflow-hidden flex flex-col justify-between">

                      {/* Draft ribbon */}
                      {order.status?.toLowerCase() === 'draft' && (
                        <div style={{position:'absolute',top:0,left:0,width:'120px',height:'120px',overflow:'hidden',pointerEvents:'none',zIndex:0}}>
                          <div style={{position:'absolute',top:'20px',left:'-35px',width:'140px',background:'#f1f5f9',color:'#64748b',textAlign:'center',textTransform:'uppercase',fontSize:'9px',fontWeight:800,letterSpacing:'0.15em',padding:'4px 0',transform:'rotate(-45deg)',border:'1px dashed #cbd5e1'}}>Draft</div>
                        </div>
                      )}

                      <div>
                        {/* â”€â”€ Top Header: Company (left) | SALES ORDER (right) â”€â”€ */}
                        <div className="flex justify-between items-start mb-12">
                          <div className="space-y-1 relative z-10">
                            <h3 className="text-[18px] font-extrabold text-slate-900 tracking-tight">{currentCompany?.name || order.Customer?.companyName || 'Company'}</h3>
                            {currentCompany?.street1 && <p className="text-[13px] font-semibold text-slate-500">{currentCompany.street1}</p>}
                            <p className="text-[13px] font-semibold text-slate-500">{currentCompany?.location || 'India'}</p>
                            {currentCompany?.phone && <p className="text-[13px] font-semibold text-slate-500">{currentCompany.phone}</p>}
                            <p className="text-[13px] font-semibold text-slate-500">{currentUserEmail || currentCompany?.email || ''}</p>
                          </div>
                          <div className="text-right">
                            <h1 className="text-[28px] font-bold text-slate-800 uppercase tracking-wider mb-2" style={{fontFamily:'Georgia, serif'}}>SALES ORDER</h1>
                            <p className="text-[15px] font-bold text-slate-500"># {order.orderNumber}</p>
                          </div>
                        </div>

                        {/* â”€â”€ Customer Bill To / Ship To â”€â”€ */}
                        <div className="grid grid-cols-2 gap-8 mb-12">
                          {/* Bill To */}
                          <div className="space-y-2">
                            <h4 className="text-[11px] font-bold text-blue-600 uppercase tracking-widest">Bill To</h4>
                            <div className="text-[13px] text-slate-800 leading-relaxed font-semibold">
                              <p className="font-extrabold text-slate-950 text-[14px]">{order.Customer?.displayName || order.Customer?.name}</p>
                              {(() => {
                                try {
                                  const raw = order.Customer?.billingAddress;
                                  if (!raw) return null;
                                  const p = typeof raw === 'string' ? JSON.parse(raw) : raw;
                                  return (
                                    <>
                                      {p.street1 && <p className="font-semibold text-slate-700">{p.street1}</p>}
                                      {p.street2 && <p className="font-semibold text-slate-700">{p.street2}</p>}
                                      <p className="font-semibold text-slate-700">{[p.city, p.state, p.pinCode].filter(Boolean).join(', ')}</p>
                                      {p.country && <p className="font-semibold text-slate-700">{p.country}</p>}
                                    </>
                                  );
                                } catch(e) { return null; }
                              })()}
                              {order.Customer?.gstNumber && <p className="text-[12px] mt-1">GSTIN: {order.Customer.gstNumber}</p>}
                            </div>
                          </div>

                          {/* Ship To */}
                          <div className="space-y-2">
                            <h4 className="text-[11px] font-bold text-blue-600 uppercase tracking-widest">Ship To</h4>
                            <div className="text-[13px] text-slate-800 leading-relaxed font-semibold">
                              <p className="font-extrabold text-slate-950 text-[14px]">{order.Customer?.displayName || order.Customer?.name}</p>
                              {(() => {
                                try {
                                  const raw = order.Customer?.shippingAddress || order.Customer?.billingAddress;
                                  if (!raw) return null;
                                  const p = typeof raw === 'string' ? JSON.parse(raw) : raw;
                                  return (
                                    <>
                                      {p.street1 && <p className="font-semibold text-slate-700">{p.street1}</p>}
                                      {p.street2 && <p className="font-semibold text-slate-700">{p.street2}</p>}
                                      <p className="font-semibold text-slate-700">{[p.city, p.state, p.pinCode].filter(Boolean).join(', ')}</p>
                                      {p.country && <p className="font-semibold text-slate-700">{p.country}</p>}
                                    </>
                                  );
                                } catch(e) { return null; }
                              })()}
                            </div>
                          </div>
                        </div>

                        {/* â”€â”€ Meta Row: Date / Payment Terms / Reference â”€â”€ */}
                        <div className="flex items-center gap-12 border-t border-b border-slate-100 py-4 mb-10 text-[13px] font-semibold">
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Date</span>
                            <span className="text-slate-700">{formatDate(order.date)}</span>
                          </div>
                          {order.expectedShipmentDate && (
                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Shipment Date</span>
                              <span className="text-slate-700">{formatDate(order.expectedShipmentDate)}</span>
                            </div>
                          )}
                          {order.paymentTerms && (
                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Payment Terms</span>
                              <span className="text-slate-700">{order.paymentTerms}</span>
                            </div>
                          )}
                          {order.referenceNumber && (
                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Reference #</span>
                              <span className="text-slate-700">{order.referenceNumber}</span>
                            </div>
                          )}
                        </div>

                        {/* â”€â”€ Items Table â”€â”€ */}
                        <table className="w-full text-left mb-10">
                          <thead>
                            <tr className="bg-slate-800 text-white text-[11px] font-bold uppercase tracking-wider">
                              <th className="px-4 py-3 rounded-l">#</th>
                              <th className="px-4 py-3">Item &amp; Description</th>
                              <th className="px-4 py-3 text-right">Qty</th>
                              <th className="px-4 py-3 text-right">Rate</th>
                              <th className="px-4 py-3 text-right rounded-r">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-[13px] font-semibold text-slate-700">
                            {itemsList.length > 0 ? (
                              itemsList.map((it, idx) => (
                                <tr key={idx}>
                                  <td className="px-4 py-3.5 text-slate-400">{idx + 1}</td>
                                  <td className="px-4 py-3.5">
                                    <p className="font-extrabold text-slate-800">{it.detail || it.name || it.itemName}</p>
                                    {it.description && <p className="text-[11px] text-slate-400 mt-0.5 font-medium">{it.description}</p>}
                                    {it.hsnCode && <p className="text-[11px] text-slate-400 mt-0.5 font-medium">HSN: {it.hsnCode}</p>}
                                  </td>
                                  <td className="px-4 py-3.5 text-right font-mono">{parseFloat(it.quantity || 0).toFixed(2)}</td>
                                  <td className="px-4 py-3.5 text-right font-mono">{parseFloat(it.rate || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                                  <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900">{parseFloat(it.amount || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="5" className="px-4 py-8 text-center text-slate-400 italic">No items found</td>
                              </tr>
                            )}
                          </tbody>
                        </table>

                        {/* â”€â”€ Totals â”€â”€ */}
                        <div className="flex justify-end mb-16">
                          <div className="w-80 space-y-2 text-[13px] font-bold text-slate-600">
                            <div className="flex justify-between items-center py-1">
                              <span>Sub Total</span>
                              <span className="font-mono text-slate-800">{parseFloat(order.subTotal || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                            </div>
                            {parseFloat(order.discountAmount || 0) > 0 && (
                              <div className="flex justify-between items-center py-1">
                                <span>Discount {order.discount ? `(${order.discount}%)` : ''}</span>
                                <span className="font-mono text-red-500">- {parseFloat(order.discountAmount || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                              </div>
                            )}
                            {parseFloat(order.tax || order.taxAmount || 0) > 0 && (
                              <div className="flex justify-between items-center py-1">
                                <span>GST {order.taxPercent ? `(${order.taxPercent}%)` : ''}</span>
                                <span className="font-mono text-slate-800">+ {parseFloat(order.tax || order.taxAmount || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                              </div>
                            )}
                            {parseFloat(order.adjustment || 0) !== 0 && (
                              <div className="flex justify-between items-center py-1">
                                <span>Adjustment</span>
                                <span className="font-mono text-slate-800">{parseFloat(order.adjustment || 0) > 0 ? '+' : ''}{parseFloat(order.adjustment || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                              </div>
                            )}
                            <div className="flex justify-between items-center border-t border-slate-200 py-3 text-[15px] text-slate-900 font-extrabold">
                              <span>Total</span>
                              <span className="font-mono text-[#1e61f0]">{getCurrencyDisplay(order.Customer?.currency)} {parseFloat(order.totalAmount || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ——— Notes / Terms + Signature ——— */}
                      <div className="mt-8 pt-8 border-t border-slate-100">
                        {(order.customerNotes || order.termsConditions) && (
                          <div className="grid grid-cols-2 gap-6 mb-10 text-[12px]">
                            {order.customerNotes && (
                              <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100/80">
                                <span className="text-[10px] uppercase font-bold block text-slate-400 tracking-widest mb-2 flex items-center gap-1.5">
                                  <FileText size={12} className="text-slate-400"/> Customer Notes
                                </span>
                                <p className="text-slate-600 font-semibold leading-relaxed">{order.customerNotes}</p>
                              </div>
                            )}
                            {order.termsConditions && (
                              <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100/80">
                                <span className="text-[10px] uppercase font-bold block text-slate-400 tracking-widest mb-2 flex items-center gap-1.5">
                                  <ShieldCheck size={12} className="text-slate-400"/> Terms &amp; Conditions
                                </span>
                                <p className="text-slate-600 font-semibold leading-relaxed">{order.termsConditions}</p>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-12 mt-12 text-[13px] font-bold text-slate-400">
                          {/* Receiver's Signature */}
                          <div className="space-y-4">
                            <p className="text-slate-500 text-[11px] uppercase tracking-widest">Receiver's Signature &amp; Stamp</p>
                            <div className="w-56 h-20 border border-dashed border-slate-200 rounded-xl bg-slate-50/20 flex items-center justify-center text-[11px] font-medium text-slate-400 italic">
                              Stamp &amp; Signature Space
                            </div>
                          </div>

                          {/* Authorized Signatory */}
                          <div className="text-right space-y-4 flex flex-col items-end">
                            <p className="text-slate-500 text-[11px] uppercase tracking-widest">For {currentCompany?.name || 'Authorized Signatory'}</p>
                            <div className="w-56 h-20 border border-dashed border-slate-200 rounded-xl bg-slate-50/20 flex items-center justify-center text-[11px] font-medium text-slate-400 italic">
                              Authorized Signature Space
                            </div>
                            <p className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider">{currentCompany?.name || 'Authorized Signatory'}</p>
                          </div>
                        </div>

                        {/* Status footer */}
                        <div className="mt-8 pt-4 border-t border-slate-100 flex justify-between text-[10px] text-slate-400 font-medium">
                          <span>Status: {order.status}</span>
                          <span>Order ID: {order.id?.substring?.(0,16) ?? order.id}</span>
                        </div>
                      </div>
                    </div>
                 </div>
            </div>
        );
    };

    if (loading && view === 'list') return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400 font-bold">
            <Loader2 size={40} className="animate-spin text-slate-900 mb-4" />
            <span className="text-[11px] tracking-[0.4em] uppercase">Initializing Supply Chain...</span>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#fcfcfd] p-0 text-slate-900">
            {view === 'list' && renderListView()}
            {view === 'form' && renderFormView()}
            {view === 'detail' && renderDetailView()}

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="CONFIRM ORDER DELETION"
                message="Are you sure you want to permanently delete this sales order? This action cannot be reversed and all history will be lost."
            />

            {selectedOrder && (
                <EmailSendModal
                    isOpen={isEmailModalOpen}
                    onClose={() => setIsEmailModalOpen(false)}
                    documentType="Sales Order"
                    documentData={{
                        number: selectedOrder.orderNumber,
                        date: formatDate(selectedOrder.date),
                        customerName: selectedOrder.Customer?.displayName || selectedOrder.Customer?.name || '',
                        customerEmail: selectedOrder.Customer?.email || '',
                        Customer: { email: selectedOrder.Customer?.email || '', currency: selectedOrder.Customer?.currency },
                        items: (selectedOrder.Items || []).map(it => ({
                            name: it.detail,
                            quantity: it.quantity,
                            rate: it.rate,
                            amount: it.amount
                        })),
                        subTotal: selectedOrder.subTotal,
                        taxAmount: selectedOrder.tax || selectedOrder.taxAmount,
                        discount: selectedOrder.discount,
                        discountAmount: selectedOrder.discountAmount,
                        adjustment: selectedOrder.adjustment,
                        tcsAmount: selectedOrder.tcsAmount,
                        total: selectedOrder.totalAmount
                    }}
                    apiFunc={(_id, payload) => mailAPI.send({
                        ...payload,
                        companyId,
                        ledgerId: selectedOrder.LedgerId,
                        type: 'Sales Order',
                        documentId: selectedOrder.id
                    })}
                    onSend={() => {
                        addNotification('Email sent successfully!', 'success');
                        setIsEmailModalOpen(false);
                    }}
                />
            )}
        </div>
    );
};


export default SalesOrdersView;
