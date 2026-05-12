import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { deliveryChallanAPI, ledgerAPI, inventoryAPI, companyAPI, projectAPI } from '../../services/api';
import { 
  Plus, Calendar, Truck, MoreHorizontal, Edit2, Trash2, 
  Settings, CheckCircle2, AlertCircle, Clock, ArrowRight,
  Package, User, Search, X, ChevronRight, FileText,
  Filter, Download, ArrowLeft, Loader2, Save, Send,
  Trash, Info, HelpCircle, Tag, Paperclip, ChevronDown, Check,
  AlertTriangle, FileEdit, Printer, Mail, Share2, MoreVertical,
  Maximize2, ExternalLink, RefreshCw, History, List
} from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';
import useNotificationStore from '../../store/notificationStore';
import EmailSendModal from '../../components/EmailSendModal';
import { getCurrencyDisplay } from '../../utils/currencies';

// ─────────────────────────────────────────────────
// MANAGE SALESPERSONS MODAL
// ─────────────────────────────────────────────────
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
                {/* Modal Header */}
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-[18px] font-bold text-slate-900 tracking-tight">Manage Salespersons</h3>
                    <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition-colors"><X size={18}/></button>
                </div>

                {/* Search + New Button */}
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
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="px-4 py-2 bg-[#1e61f0] text-white text-[13px] font-bold rounded-lg hover:bg-blue-700 transition-all flex items-center gap-1.5 whitespace-nowrap shadow-md shadow-blue-100"
                    >
                        <Plus size={14}/> New Salesperson
                    </button>
                </div>

                {/* Inline Add Form */}
                {showAddForm && (
                    <div className="mx-6 my-4 p-5 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-[11px] font-bold text-red-500 uppercase tracking-widest mb-1.5">Name*</label>
                                <input
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    className="w-full h-9 px-3 border border-slate-300 rounded text-[13px] font-medium outline-none focus:border-blue-500 bg-white transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-red-500 uppercase tracking-widest mb-1.5">Email*</label>
                                <input
                                    type="email"
                                    value={newEmail}
                                    onChange={e => setNewEmail(e.target.value)}
                                    className="w-full h-9 px-3 border border-slate-300 rounded text-[13px] font-medium outline-none focus:border-blue-500 bg-white transition-all"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleSaveAndSelect}
                                disabled={!newName.trim()}
                                className="px-5 py-2 bg-[#1e61f0] text-white text-[12px] font-bold rounded hover:bg-blue-700 transition-all disabled:opacity-40 shadow-sm"
                            >
                                Save and Select
                            </button>
                            <button
                                onClick={() => { setShowAddForm(false); setNewName(''); setNewEmail(''); }}
                                className="px-5 py-2 bg-white border border-slate-200 text-slate-600 text-[12px] font-bold rounded hover:bg-slate-50 transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Table */}
                <div className="px-6">
                    <div className="grid grid-cols-2 py-3 border-b border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Salesperson Name</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</span>
                    </div>
                    <div className="max-h-56 overflow-y-auto no-scrollbar">
                        {filtered.length === 0 ? (
                            <div className="py-12 text-center text-slate-400 text-[13px] font-medium italic">No salespersons found.</div>
                        ) : (
                            filtered.map(s => (
                                <div
                                    key={s.id}
                                    onClick={() => { onSelect(s.name); onClose(); }}
                                    className="grid grid-cols-2 py-3 border-b border-slate-50 hover:bg-blue-50 cursor-pointer rounded transition-colors"
                                >
                                    <span className="text-[13px] font-bold text-[#1e61f0]">{s.name}</span>
                                    <span className="text-[13px] text-slate-500 font-medium">{s.email || '—'}</span>
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

// ─────────────────────────────────────────────────
// CUSTOMER SEARCH SELECTOR
// ─────────────────────────────────────────────────
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
        if (!c || !c.name) return false;
        return c.name.toLowerCase().includes(search.toLowerCase());
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
                                    <div className="text-[14px] font-bold text-slate-800 tracking-tight">{c.name}</div>
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

// ─────────────────────────────────────────────────────────────────────────────
// ITEM SEARCH SELECTOR
// ─────────────────────────────────────────────────────────────────────────────
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
        return n.toLowerCase().includes(s) || d.toLowerCase().includes(s);
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
                                    onClick={() => { onChange(it.id); setIsOpen(false); setSearch(''); }}
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

// ─────────────────────────────────────────────────────────────────────────────
// DELIVERY CHALLAN FORM
// ─────────────────────────────────────────────────────────────────────────────

const DeliveryChallanForm = ({ companyId, navigate, editId }) => {
    const { addNotification } = useNotificationStore();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    
    // Core Data
    const [customers, setCustomers] = useState([]);
    const [items, setItems] = useState([]);
    const [projects, setProjects] = useState([]);
    
    // Form State
    const [formData, setFormData] = useState({
        challanNumber: `DC-${Math.floor(1000 + Math.random() * 9000)}`,
        customerLedgerId: '',
        customerName: '',
        referenceNumber: '',
        date: new Date().toISOString().split('T')[0],
        challanType: 'Supply',
        salesperson: '',
        subject: '',
        discount: 0,
        adjustment: 0,
        taxAmount: 0,
        customerNotes: 'Goods are being delivered for supply on approval.',
        termsConditions: 'Standard warranty and delivery terms apply.',
        projectId: ''
    });

    const [lineItems, setLineItems] = useState([
        { id: Date.now(), itemId: '', name: '', description: '', quantity: 1, rate: 0, amount: 0 }
    ]);

    const [salespersons, setSalespersons] = useState(() => {
        try { return JSON.parse(localStorage.getItem('tally_salespersons') || '[]'); } catch { return []; }
    });
    const [showSalespersonDropdown, setShowSalespersonDropdown] = useState(false);
    const [salespersonSearch, setSalespersonSearch] = useState('');
    const [showManageSalespersons, setShowManageSalespersons] = useState(false);
    const salespersonDropdownRef = React.useRef(null);

    const CHALLAN_TYPES = ['Supply', 'Job Work', 'Supply on Approval', 'Liquidated Damages', 'Others'];

    useEffect(() => {
        if (!companyId) return;
        setLoading(true);
        const fetchData = async () => {
            try {
                const [cRes, iRes, projRes] = await Promise.all([
                    ledgerAPI.getByCompany(companyId),
                    inventoryAPI.getByCompany(companyId),
                    projectAPI.getByCompany(companyId)
                ]);
                setCustomers(Array.isArray(cRes.data) ? cRes.data : []);
                setItems(Array.isArray(iRes.data) ? iRes.data : []);
                setProjects(Array.isArray(projRes.data) ? projRes.data : []);
            } catch (err) {
                addNotification('Failed to load form data', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchData();

        if (editId) {
            deliveryChallanAPI.getById(editId).then(res => {
                const dc = res.data;
                if (dc) {
                    setFormData({
                        ...dc,
                        date: new Date(dc.date).toISOString().split('T')[0],
                        customerName: dc.Customer?.name || '',
                        projectId: dc.ProjectId || ''
                    });
                    setLineItems(dc.items.map(it => ({
                        ...it,
                        name: it.Item?.name || ''
                    })));
                }
            });
        }

        const handleClickOutside = (event) => {
            if (salespersonDropdownRef.current && !salespersonDropdownRef.current.contains(event.target)) {
                setShowSalespersonDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [companyId, editId]);

    const totals = useMemo(() => {
        const subTotal = lineItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        const discountAmt = (subTotal * parseFloat(formData.discount || 0)) / 100;
        const taxAmt = (subTotal - discountAmt) * 0.18;
        const total = subTotal - discountAmt + taxAmt + parseFloat(formData.adjustment || 0);
        return { subTotal, discountAmt, taxAmt, total };
    }, [lineItems, formData.discount, formData.adjustment]);

    const handleUpdateLine = (id, field, value) => {
        setLineItems(prev => prev.map(item => {
            if (item.id === id) {
                const updated = { ...item, [field]: value };
                if (field === 'quantity' || field === 'rate') {
                    updated.amount = (parseFloat(updated.quantity) || 0) * (parseFloat(updated.rate) || 0);
                }
                return updated;
            }
            return item;
        }));
    };

    const handleItemSelect = (rowId, itId) => {
        const item = items.find(i => i.id === itId);
        if (!item) return;
        setLineItems(prev => prev.map(row => {
            if (row.id === rowId) {
                return {
                    ...row,
                    itemId: item.id,
                    name: item.name,
                    description: item.salesDescription || '',
                    rate: item.sellingPrice || 0,
                    amount: (item.sellingPrice || 0) * (row.quantity || 1)
                };
            }
            return row;
        }));
    };

    const handleSave = async (status = 'Open') => {
        if (!formData.customerLedgerId || lineItems.every(li => !li.itemId)) {
            addNotification('Please select a Customer and add at least one item.', 'error');
            return;
        }
        setSaving(true);
        try {
            const payload = {
                ...formData,
                items: lineItems,
                subTotal: totals.subTotal,
                taxAmount: totals.taxAmt,
                totalAmount: totals.total,
                status,
                companyId
            };
            let savedDc;
            if (editId) {
                const res = await deliveryChallanAPI.update(editId, payload);
                savedDc = res.data;
                addNotification('Delivery Challan updated', 'success');
            } else {
                const res = await deliveryChallanAPI.create(payload);
                savedDc = res.data;
                addNotification('Delivery Challan created', 'success');
            }
            navigate(`/delivery-challans/view/${savedDc?.id || editId}`);
        } catch (err) {
            console.error(err);
            addNotification('Failed to save Delivery Challan', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400 font-sans">
        <Loader2 size={40} className="animate-spin text-[#1e61f0] mb-4 opacity-20" />
        <span className="text-[11px] font-bold tracking-widest uppercase opacity-40">Loading Context...</span>
      </div>
    );

    return (
        <div className="flex flex-col h-full bg-[#f8fafc] relative overflow-hidden">
            <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shrink-0 sticky top-0 z-20 no-print">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => navigate('/delivery-challans')}
                        className="p-2 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-900 transition-all"
                    >
                        <ArrowLeft size={22} />
                    </button>
                    <div>
                        <h2 className="text-[18px] font-black text-slate-900 tracking-tight flex items-center gap-2 uppercase">
                            {editId ? 'Edit Delivery Challan' : 'Create Delivery Challan'}
                            <span className="text-[10px] font-bold text-[#1e61f0] bg-blue-50 px-2 py-0.5 rounded uppercase tracking-[0.2em] border border-blue-100">
                                {formData.challanNumber}
                            </span>
                        </h2>
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Sales / Delivery Challans</div>
                    </div>
                </div>
                <button onClick={() => navigate('/delivery-challans')} className="text-slate-300 hover:text-slate-600 transition-colors"><X size={24} /></button>
            </header>

            <div className="flex-1 overflow-y-auto no-scrollbar">
                <div className="max-w-[1000px] mx-auto py-10 px-6">
                    <div className="bg-white rounded border border-slate-200 shadow-sm p-12 space-y-12 animate-fade-in">
                  
                  <div className="grid grid-cols-2 gap-x-12 gap-y-8">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-red-500 uppercase tracking-widest ml-1 flex items-center gap-2">Customer Selection*</label>
                      <CustomerSearchSelector 
                        value={formData.customerName}
                        onChange={(cid) => {
                          const cust = customers.find(c => c.id === cid);
                          setFormData({...formData, customerLedgerId: cid, customerName: cust?.name || ''});
                        }}
                        customers={customers}
                        placeholder="Select a ledger..."
                        onNewCustomer={() => navigate('/customers/new')}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-red-500 uppercase tracking-widest ml-1 flex items-center gap-2">Challan #*</label>
                      <input 
                        type="text" 
                        value={formData.challanNumber} 
                        onChange={e => setFormData({...formData, challanNumber: e.target.value})}
                        className="w-full h-12 px-5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all shadow-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">Reference ID</label>
                      <input 
                        type="text" 
                        value={formData.referenceNumber} 
                        onChange={e => setFormData({...formData, referenceNumber: e.target.value})}
                        placeholder="e.g. PO-8829"
                        className="w-full h-12 px-5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all shadow-sm placeholder:text-slate-300 placeholder:font-medium"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-red-500 uppercase tracking-widest ml-1 flex items-center gap-2">Challan Date*</label>
                      <div className="relative">
                        <input 
                          type="date" 
                          value={formData.date} 
                          onChange={e => setFormData({...formData, date: e.target.value})}
                          className="w-full h-12 px-5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all shadow-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">Challan Type</label>
                      <div className="relative group">
                        <select 
                          value={formData.challanType} 
                          onChange={e => setFormData({...formData, challanType: e.target.value})}
                          className="w-full h-12 px-5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-bold text-slate-800 outline-none appearance-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all shadow-sm"
                        >
                          {CHALLAN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">Project</label>
                      <div className="relative group">
                        <select 
                          value={formData.projectId} 
                          onChange={e => setFormData({...formData, projectId: e.target.value})}
                          className="w-full h-12 px-5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-bold text-slate-800 outline-none appearance-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all shadow-sm"
                        >
                          <option value="">Select or associate project</option>
                          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">Salesperson</label>
                      <div className="relative" ref={salespersonDropdownRef}>
                          <button
                              type="button"
                              onClick={() => { setShowSalespersonDropdown(!showSalespersonDropdown); setSalespersonSearch(''); }}
                              className={`w-full h-12 px-5 border rounded-xl text-[14px] font-bold text-left flex items-center justify-between transition-all
                                  ${showSalespersonDropdown ? 'border-blue-500 bg-white ring-4 ring-blue-50' : 'border-slate-200 bg-slate-50 text-slate-700'}`}
                          >
                              <span className={formData.salesperson ? 'text-slate-900' : 'text-slate-400'}>
                                  {formData.salesperson || 'Assign Salesperson'}
                              </span>
                              <ChevronDown size={16} className={`text-slate-400 transition-transform ${showSalespersonDropdown ? 'rotate-180' : ''}`} />
                          </button>

                          {showSalespersonDropdown && (
                              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 shadow-2xl rounded-xl z-[200] overflow-hidden animate-fade-in">
                                  <div className="p-3 border-b border-slate-100 bg-slate-50/50">
                                      <div className="relative">
                                          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                          <input
                                              autoFocus
                                              value={salespersonSearch}
                                              onChange={e => setSalespersonSearch(e.target.value)}
                                              placeholder="Search..."
                                              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-[13px] font-medium outline-none focus:border-blue-500 transition-all"
                                          />
                                      </div>
                                  </div>
                                  <div className="max-h-48 overflow-y-auto no-scrollbar">
                                      {salespersons.filter(s => !salespersonSearch || s.name.toLowerCase().includes(salespersonSearch.toLowerCase())).map(s => (
                                          <div
                                              key={s.id}
                                              onClick={() => { setFormData({ ...formData, salesperson: s.name }); setShowSalespersonDropdown(false); }}
                                              className="px-4 py-3 hover:bg-blue-50 cursor-pointer text-[13px] font-bold text-slate-700 flex items-center justify-between transition-colors border-b border-slate-50 last:border-0"
                                          >
                                              {s.name}
                                              {formData.salesperson === s.name && <CheckCircle2 size={14} className="text-blue-500" />}
                                          </div>
                                      ))}
                                  </div>
                                  <button
                                      type="button"
                                      onClick={() => { setShowSalespersonDropdown(false); setShowManageSalespersons(true); }}
                                      className="w-full p-4 text-[12px] font-bold text-blue-600 bg-slate-50 hover:bg-blue-50 flex items-center justify-center gap-2 transition-all uppercase tracking-widest border-t border-slate-100"
                                  >
                                      <Settings size={14} /> Manage Salespersons
                                  </button>
                              </div>
                          )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[14px] font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2"><Package size={16} className="text-blue-500"/> Delivery Line Items</h3>
                      <button className="text-[11px] font-bold text-[#1e61f0] flex items-center gap-2 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all">
                        <RefreshCw size={14} /> Reset Table
                      </button>
                    </div>

                    <div className="border border-slate-200 rounded overflow-hidden shadow-sm bg-white">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em]">
                            <th className="px-6 py-4 text-left font-bold">Item Details</th>
                            <th className="px-6 py-4 text-right w-28 font-bold">Quantity</th>
                            <th className="px-6 py-4 text-right w-36 font-bold">Rate</th>
                            <th className="px-6 py-4 text-right w-40 font-bold">Amount</th>
                            <th className="w-12"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {lineItems.map((line, idx) => (
                            <tr key={line.id} className="group hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-5">
                                <ItemSearchSelector 
                                  value={line.name}
                                  onChange={(itId) => handleItemSelect(line.id, itId)}
                                  items={items}
                                  placeholder="Select an item..."
                                  onNewItem={() => navigate('/inventory/new')}
                                />
                                <textarea 
                                  value={line.description}
                                  onChange={e => handleUpdateLine(line.id, 'description', e.target.value)}
                                  placeholder="Add delivery instructions or details..." 
                                  className="w-full mt-2 h-10 bg-transparent text-[11px] text-slate-400 outline-none resize-none border-none focus:ring-0 placeholder:italic font-medium"
                                />
                              </td>
                              <td className="px-6 py-5 align-top">
                                <input 
                                  type="number" 
                                  value={line.quantity} 
                                  onChange={e => handleUpdateLine(line.id, 'quantity', e.target.value)}
                                  className="w-full text-right bg-transparent border-none outline-none text-[13px] font-bold text-slate-600 focus:bg-white rounded transition-all" 
                                />
                              </td>
                              <td className="px-6 py-5 align-top font-mono">
                                <input 
                                  type="number" 
                                  value={line.rate} 
                                  onChange={e => handleUpdateLine(line.id, 'rate', e.target.value)}
                                  className="w-full text-right bg-transparent border-none outline-none text-[13px] font-bold text-slate-600 focus:bg-white rounded transition-all" 
                                />
                              </td>
                              <td className="px-6 py-5 text-right align-top font-mono">
                                  <span className="text-[13px] font-bold text-slate-900">{getCurrencyDisplay(customers.find(c => c.id === formData.customerLedgerId)?.currency)} {(parseFloat(line.amount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                              </td>
                              <td className="px-4 py-5 text-center align-top">
                                <button onClick={() => setLineItems(prev => prev.length > 1 ? prev.filter(p => p.id !== line.id) : prev)} className="text-slate-300 hover:text-red-500 transition-colors">
                                  <Trash2 size={16}/>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    <button 
                        onClick={() => setLineItems([...lineItems, { id: Date.now(), itemId: '', name: '', description: '', quantity: 1, rate: 0, amount: 0 }])}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-[#1e61f0] text-[12px] font-bold rounded shadow-sm hover:bg-slate-50 transition-all"
                    >
                      <Plus size={14} strokeWidth={3}/> Add Row
                    </button>
                  </div>

                  <div className="flex justify-between items-start pt-12 border-t border-slate-100 gap-20">
                     <div className="flex-1 max-w-md space-y-8">
                        <div className="space-y-3">
                           <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Customer Notes</label>
                           <textarea 
                              value={formData.customerNotes} 
                              onChange={e => setFormData({...formData, customerNotes: e.target.value})} 
                              className="w-full h-24 p-4 bg-slate-50 border border-slate-200 rounded text-[13px] font-bold text-slate-600 outline-none focus:bg-white focus:border-blue-500 transition-all resize-none shadow-sm" 
                           />
                        </div>

                        <div className="space-y-3">
                           <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Terms & Conditions</label>
                           <textarea 
                              value={formData.termsConditions} 
                              onChange={e => setFormData({...formData, termsConditions: e.target.value})} 
                              className="w-full h-24 p-4 bg-slate-50 border border-slate-200 rounded text-[13px] font-bold text-slate-600 outline-none focus:bg-white focus:border-blue-500 transition-all resize-none shadow-sm" 
                           />
                        </div>
                     </div>

                     <div className="w-80 space-y-4">
                        <div className="flex justify-between text-[13px]">
                          <span className="font-bold text-slate-500 uppercase tracking-widest">Sub Total</span>
                           <span className="font-bold text-slate-900 font-mono">{getCurrencyDisplay(customers.find(c => c.id === formData.customerLedgerId)?.currency)} {totals.subTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>

                        <div className="flex justify-between items-center text-[13px]">
                          <label className="text-slate-500 font-bold uppercase tracking-widest">Discount (%)</label>
                          <div className="flex items-center gap-4">
                             <input type="number" value={formData.discount} onChange={e => setFormData({...formData, discount: e.target.value})} className="w-16 h-8 px-2 bg-slate-50 border border-slate-200 rounded text-right font-bold outline-none" />
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-[13px]">
                          <span className="text-slate-500 font-bold uppercase tracking-widest">Tax (GST 18%)</span>
                           <span className="text-slate-900 font-bold font-mono">{getCurrencyDisplay(customers.find(c => c.id === formData.customerLedgerId)?.currency)} {totals.taxAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>

                        <div className="flex justify-between items-center text-[13px]">
                          <span className="text-slate-500 font-bold uppercase tracking-widest">Adjustment</span>
                          <input type="number" value={formData.adjustment} onChange={e => setFormData({...formData, adjustment: e.target.value})} className="w-24 h-8 px-2 bg-slate-50 border border-slate-200 rounded text-right font-bold outline-none" />
                        </div>

                        <div className="pt-6 border-t border-slate-200 flex justify-between items-center bg-slate-50 -mx-8 px-8 py-4 mt-6">
                          <span className="text-[14px] font-bold text-slate-500 uppercase tracking-widest">Challan Total</span>
                           <span className="text-[24px] font-bold text-[#1e61f0] tracking-tighter font-mono">{getCurrencyDisplay(customers.find(c => c.id === formData.customerLedgerId)?.currency)} {totals.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                     </div>
                  </div>
                </div>
              </div>
            </div>

            <footer className="bg-white border-t border-slate-200 px-8 py-4 flex items-center justify-between shrink-0 sticky bottom-0 z-20 no-print shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                        <Truck size={14} className="text-blue-500" />
                        Goods Dispatch Interface
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => navigate('/delivery-challans')}
                        className="px-6 py-2 text-slate-500 text-[13px] font-bold hover:text-slate-900 transition-all uppercase tracking-widest"
                    >
                        Discard
                    </button>
                    <button 
                        onClick={() => handleSave('Draft')}
                        disabled={saving}
                        className="px-6 py-2 bg-slate-100 text-slate-600 rounded text-[13px] font-bold hover:bg-slate-200 transition-all uppercase tracking-widest"
                    >
                        {saving ? '...' : 'Save as Draft'}
                    </button>
                    <button 
                        onClick={() => handleSave('Open')}
                        disabled={saving}
                        className="px-8 py-2.5 bg-[#1e61f0] text-white rounded font-bold text-[13px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
                    >
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <><Send size={16}/> Save and Send</>}
                    </button>
                </div>
            </footer>
            
            <ManageSalespersonsModal 
                isOpen={showManageSalespersons}
                onClose={() => setShowManageSalespersons(false)}
                salespersons={salespersons}
                onSave={setSalespersons}
                onSelect={(name) => setFormData({ ...formData, salesperson: name })}
            />
        </div>
    );
};

const DeliveryChallanDetail = ({ id, navigate, companyId }) => {
    const { addNotification } = useNotificationStore();
    const [challan, setChallan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        deliveryChallanAPI.getById(id).then(res => { 
            setChallan(res.data); 
            setLoading(false); 
        }).catch(() => setLoading(false));
    }, [id]);

    const formatCurrency = (val) => parseFloat(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const handleDelete = async () => {
        try {
            await deliveryChallanAPI.delete(id);
            addNotification('Delivery Challan deleted', 'success');
            navigate('/delivery-challans');
        } catch (err) {
            addNotification('Failed to delete challan', 'error');
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleConvertToInvoice = () => {
        navigate('/sales-invoices/new', { 
            state: { 
                challanData: {
                    customerLedgerId: challan.customerLedgerId,
                    referenceNumber: challan.challanNumber,
                    projectId: challan.ProjectId,
                    items: challan.items.map(it => ({
                        itemId: it.itemId,
                        description: it.description,
                        quantity: it.quantity,
                        rate: it.rate
                    }))
                } 
            } 
        });
    };

    if (loading) return <div className="flex-1 flex items-center justify-center text-slate-400 font-bold animate-pulse uppercase tracking-[0.2em] text-xs">Syncing Records...</div>;
    if (!challan) return <div className="flex-1 flex items-center justify-center text-slate-300 font-bold text-3xl opacity-20 tracking-tighter uppercase">Document Not Found</div>;

    return (
        <div className="flex-1 flex flex-col h-full bg-white animate-fade-in shadow-inner overflow-hidden">
            <div className="bg-[#fcfdfe] border-b border-slate-200 px-6 py-2.5 flex items-center justify-between sticky top-0 z-10 no-print">
                <div className="flex items-center gap-2">
                    <button onClick={() => navigate('/delivery-challans')} className="text-[13px] font-bold text-blue-600 hover:underline flex items-center gap-1.5 uppercase transition-all">
                       <ChevronDown size={14} className="rotate-90"/> All Delivery Challans
                    </button>
                    <span className="text-slate-300">|</span>
                    <span className="text-[13px] font-bold text-slate-800">{challan.challanNumber}</span>
                </div>
                <div className="flex items-center gap-4">
                   <button className="p-1.5 text-slate-400 hover:bg-slate-50 rounded-md transition-all hover:text-slate-600"><History size={16}/></button>
                   <button className="p-1.5 text-slate-400 hover:bg-slate-50 rounded-md transition-all hover:text-slate-600"><Share2 size={16}/></button>
                </div>
            </div>

            <div className="bg-white border-b border-slate-100 px-6 py-2 flex items-center justify-between shadow-sm no-print">
                <div className="flex items-center gap-1">
                    <button onClick={() => navigate(`/delivery-challans/edit/${challan.id}`)} className="px-3 py-1.5 text-slate-600 hover:bg-slate-50 rounded flex items-center gap-1.5 text-[12px] font-bold border border-transparent hover:border-slate-100 transition-all">
                        <Edit2 size={14}/> Edit
                    </button>
                    <button onClick={() => setIsEmailModalOpen(true)} className="px-3 py-1.5 text-slate-600 hover:bg-slate-50 rounded flex items-center gap-1.5 text-[12px] font-bold transition-all">
                        <Mail size={14}/> Email
                    </button>
                    <button onClick={handlePrint} className="px-4 py-1.5 bg-slate-50 text-slate-700 rounded flex items-center gap-1.5 text-[12px] font-bold transition-all border border-slate-200 hover:bg-white hover:border-blue-400">
                        <Printer size={14}/> PDF/Print <ChevronDown size={14}/>
                    </button>
                    <span className="w-px h-5 bg-slate-100 mx-2" />
                    <button onClick={handleConvertToInvoice} className="px-4 py-1.5 bg-[#008ef0] text-white rounded font-bold text-[12px] flex items-center gap-1.5 hover:bg-[#007cd0] transition-all shadow-md">
                        Convert to Invoice
                    </button>
                    <button onClick={() => setShowDeleteModal(true)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded transition-all ml-2"><Trash2 size={16}/></button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-12 lg:p-16 bg-[#f8fafc] flex flex-col items-center no-scrollbar print:p-0 print:bg-white print:overflow-visible transition-all">
                <div className="bg-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-lg min-h-[1050px] w-full max-w-4xl mx-auto p-12 relative overflow-hidden border border-slate-100 mb-20 animate-fade-up print:shadow-none print:border-none print:m-0 print:rounded-none">
                    <div className="absolute top-8 -right-12 w-48 py-1.5 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-[0.2em] transform rotate-45 text-center shadow-lg border-y-2 border-emerald-400 z-10 no-print">
                        {challan.status}
                    </div>

                    <div className="flex justify-between items-start mb-16">
                        <div>
                            <div className="w-12 h-12 bg-slate-900 rounded-xl mb-4 flex items-center justify-center text-white font-bold text-xl shadow-lg">M</div>
                            <h2 className="text-[20px] font-bold text-slate-900 tracking-tighter uppercase mb-1">{localStorage.getItem('companyName')?.toUpperCase() || 'THE MOON ENTERPRISES'}</h2>
                            <p className="text-[11px] text-slate-500 font-bold leading-relaxed max-w-[240px]">Tamil Nadu, India.</p>
                        </div>
                        <div className="text-right">
                            <h1 className="text-[34px] font-bold text-slate-800 tracking-tighter uppercase -mb-1 opacity-90">Delivery Challan</h1>
                            <div className="h-1 w-24 bg-slate-900 ml-auto mt-2"></div>
                        </div>
                    </div>

                    <div className="flex border border-slate-300 mb-12 overflow-hidden rounded-sm shadow-sm min-h-[100px]">
                        <div className="flex-1 p-8 border-r border-slate-200 bg-slate-50/20 flex flex-col gap-2">
                             <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Bill To</h4>
                             <p className="text-[16px] font-bold text-[#1e61f0] hover:underline cursor-pointer transition-all">{challan.Customer?.name || 'Customer Not Specified'}</p>
                             {challan.Project && (
                               <div className="mt-2 flex items-center gap-2">
                                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded">Project</span>
                                 <span className="text-[12px] font-bold text-slate-700">{challan.Project.name}</span>
                               </div>
                             )}
                        </div>
                        <div className="w-[360px] flex">
                            <div className="w-1/2 p-6 border-r border-slate-200 bg-slate-50 flex flex-col justify-center gap-3">
                                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-right">Challan #</span>
                                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-right">Challan Date</span>
                            </div>
                            <div className="w-1/2 p-6 flex flex-col justify-center gap-3">
                                <span className="text-[13px] font-bold text-slate-900">: {challan.challanNumber}</span>
                                <span className="text-[13px] font-bold text-slate-900">: {new Date(challan.date).toLocaleDateString('en-GB')}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mb-20 print:mb-0">
                        <table className="w-full border-collapse border border-slate-300">
                            <thead>
                                <tr className="bg-slate-900 text-[10px] font-bold text-white uppercase tracking-widest border-b border-slate-900 no-print">
                                    <th className="py-4 px-2 border-r border-slate-800 w-12">#</th>
                                    <th className="py-4 px-4 border-r border-slate-800 text-left">Item & Description</th>
                                    <th className="py-4 px-2 border-r border-slate-800 w-24 text-center">Qty</th>
                                    <th className="py-4 px-2 border-r border-slate-800 w-32 text-center">Rate</th>
                                    <th className="py-4 px-2 w-40 text-center">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {challan.items?.map((item, idx) => (
                                    <tr key={idx} className="text-[12px] font-medium text-slate-700">
                                        <td className="p-4 border-r border-slate-200 text-center font-bold text-slate-400">{idx + 1}</td>
                                        <td className="p-4 border-r border-slate-200">
                                            <p className="font-bold text-slate-900 mb-0.5 text-[13px]">{item.Item?.name}</p>
                                            <p className="text-[10px] text-slate-400 italic line-clamp-1">{item.description}</p>
                                        </td>
                                        <td className="p-4 border-r border-slate-200 text-center font-bold">{parseFloat(item.quantity).toFixed(2)}</td>
                                        <td className="p-4 border-r border-slate-200 text-right font-bold text-slate-500">{formatCurrency(item.rate)}</td>
                                        <td className="p-4 text-right font-bold text-slate-900">{formatCurrency(item.amount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="flex border-x border-b border-slate-300 rounded-b overflow-hidden break-inside-avoid">
                            <div className="flex-1 p-8 flex flex-col justify-end bg-slate-50/10">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Total Amount In Words</p>
                                <p className="text-[11px] font-bold text-slate-800 uppercase tracking-tighter">Indian Rupee Only</p>
                            </div>
                            <div className="w-[320px] bg-white border-l border-slate-200 pt-2 pb-1">
                                <div className="flex justify-between px-8 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                    <span>Sub Total</span>
                                    <span className="text-slate-900 font-bold">{formatCurrency(challan.subTotal)}</span>
                                </div>
                                <div className="flex justify-between px-8 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50">
                                    <span>IGST (18%)</span>
                                    <span className="text-slate-900 font-bold">{formatCurrency(challan.taxAmount)}</span>
                                </div>
                                <div className="flex justify-between px-8 py-5 text-[15px] font-bold text-slate-900 bg-slate-100/50">
                                    <span className="text-slate-500 uppercase tracking-[0.1em] text-[10px] mt-1">Grand Total</span>
                                     <span className="text-xl tracking-tight">{getCurrencyDisplay(challan.Customer?.currency)} {formatCurrency(challan.totalAmount)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-20 items-end mt-24">
                         <div className="space-y-6">
                              <div>
                                 <p className="text-[10px] text-slate-400 font-bold mb-1.5 italic uppercase tracking-[0.2em] opacity-50">Customer Notes</p>
                                 <p className="text-[11px] text-slate-500 italic font-medium leading-relaxed">{challan.customerNotes || 'Thanks for your business.'}</p>
                              </div>
                         </div>
                         <div className="text-center">
                             <div className="w-64 ml-auto">
                                <div className="h-10 border-b border-slate-200 border-dashed mb-4"></div>
                                <p className="text-[10px] font-bold text-slate-900 uppercase tracking-[0.3em] opacity-90">Authorized Signature</p>
                             </div>
                         </div>
                    </div>
                </div>
            </div>

            <EmailSendModal 
                isOpen={isEmailModalOpen}
                onClose={() => setIsEmailModalOpen(false)}
                documentData={{
                    id: challan.id,
                    number: challan.challanNumber,
                    customerName: challan.Customer?.name || 'Customer',
                    Customer: challan.Customer
                }}
                documentType="Delivery Challan"
                onSend={() => {}}
                apiFunc={deliveryChallanAPI.sendEmail}
            />

            <ConfirmModal 
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Delete Delivery Challan"
                message="Are you sure you want to delete this challan? This action cannot be undone."
                confirmText="Delete"
                type="danger"
            />
        </div>
    );
};

const DeliveryChallansView = ({ companyId }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams();
    const { addNotification } = useNotificationStore();

    const [challans, setChallans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteId, setDeleteId] = useState(null);

    const isNew = location.pathname.includes('/new');
    const isEdit = location.pathname.includes('/edit');
    const isView = location.pathname.includes('/view');
    const isDetail = isView && id;

    const fetchChallans = async () => {
        if (!companyId) return;
        try { 
            setLoading(true); 
            const res = await deliveryChallanAPI.getByCompany(companyId); 
            setChallans(res.data || []); 
        } catch (err) { 
            console.error(err); 
        } finally { 
            setLoading(false); 
        }
    };

    useEffect(() => { fetchChallans(); }, [companyId, location.key]);

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await deliveryChallanAPI.delete(deleteId);
            addNotification('Delivery Challan deleted', 'success');
            setDeleteId(null);
            if (id === deleteId) navigate('/delivery-challans');
            fetchChallans();
        } catch (err) {
            addNotification('Failed to delete challan', 'error');
        }
    };

    const filtered = useMemo(() => challans.filter(c => 
        c.challanNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.Customer?.name.toLowerCase().includes(searchTerm.toLowerCase())
    ), [challans, searchTerm]);

    if (isNew || isEdit) return <DeliveryChallanForm companyId={companyId} navigate={navigate} editId={id} />;

    return (
        <div className="flex h-[calc(100vh-80px)] bg-[#f8fafc] overflow-hidden">
            <ConfirmModal 
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="Delete Delivery Challan"
                message="Are you sure you want to delete this challan? This action cannot be undone."
                type="danger"
            />

            <div className={`flex-col border-r border-slate-200 bg-white transition-all duration-300 flex no-print ${isDetail ? 'w-[380px]' : 'w-0 opacity-0 overflow-hidden'}`}>
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                    <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">All Challans</h3>
                    <div className="flex items-center gap-2">
                        <button onClick={() => navigate('/delivery-challans/new')} className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-all">
                            <Plus size={16} />
                        </button>
                        <button onClick={fetchChallans} className="p-1.5 text-slate-400 hover:text-blue-600 transition-all">
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>
                <div className="p-4 border-b border-slate-50">
                    <div className="relative group">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Quick find..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[12px] font-semibold outline-none focus:bg-white focus:border-blue-500 transition-all"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto no-scrollbar py-2">
                    {filtered.map(c => (
                        <div 
                            key={c.id}
                            onClick={() => navigate(`/delivery-challans/view/${c.id}`)}
                            className={`px-6 py-4 cursor-pointer transition-all border-l-4 ${id === c.id ? 'bg-blue-50 border-blue-600' : 'hover:bg-slate-50 border-transparent'}`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className={`text-[13px] font-semibold ${id === c.id ? 'text-blue-600' : 'text-slate-800'}`}>{c.challanNumber}</span>
                                 <span className="text-[13px] font-semibold text-slate-900">{getCurrencyDisplay(c.Customer?.currency)} {parseFloat(c.totalAmount).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                               <span className="text-[11px] font-bold text-slate-400 truncate max-w-[180px]">{c.Customer?.name}</span>
                               <span className="text-[9px] font-bold uppercase text-slate-300 border border-slate-100 px-1.5 py-0.5 rounded tracking-widest">{new Date(c.date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit' })}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
                {isDetail ? (
                    <DeliveryChallanDetail id={id} navigate={navigate} companyId={companyId} />
                ) : (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="bg-white px-8 py-7 flex items-center justify-between border-b border-slate-200">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Delivery Challans</h1>
                                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-widest mt-1">Manage product shipments and job work</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                                    <Search size={18} className="text-slate-300" />
                                    <input 
                                        type="text" 
                                        placeholder="Search by number or customer..." 
                                        value={searchTerm} 
                                        onChange={e => setSearchTerm(e.target.value)} 
                                        className="bg-transparent border-none outline-none ml-3 text-[14px] w-72 font-semibold"
                                    />
                                </div>
                                <button onClick={() => navigate('/delivery-challans/new')} className="bg-[#1e61f0] hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold text-[13px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-blue-200">
                                    <Plus size={18} strokeWidth={2} /> New Challan
                                </button>
                                <button onClick={fetchChallans} className="p-3 bg-white border border-slate-200 text-slate-400 rounded-2xl hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm">
                                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto p-10 bg-slate-50/50">
                            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50/50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                                            <th className="px-10 py-6">Date</th>
                                            <th className="px-10 py-6">Challan #</th>
                                            <th className="px-10 py-6">Customer</th>
                                            <th className="px-10 py-6">Status</th>
                                            <th className="px-10 py-6 text-right">Amount</th>
                                            <th className="px-10 py-6 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {loading ? (
                                            <tr><td colSpan="6" className="py-32 text-center font-bold text-slate-300 uppercase tracking-widest italic animate-pulse">Syncing Challans...</td></tr>
                                        ) : filtered.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="py-32 text-center">
                                                    <div className="flex flex-col items-center opacity-30">
                                                        <Truck size={64} strokeWidth={1} className="text-slate-400 mb-4" />
                                                        <span className="text-sm font-bold text-slate-500 uppercase tracking-[0.4em]">No Shipments Recorded</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : filtered.map(c => (
                                            <tr 
                                                key={c.id} 
                                                onClick={() => navigate(`/delivery-challans/view/${c.id}`)}
                                                className={`hover:bg-blue-50/30 cursor-pointer transition-all group`}
                                            >
                                                <td className="px-10 py-6 text-[14px] font-medium text-slate-600">
                                                    {new Date(c.date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                </td>
                                                <td className="px-10 py-6 text-[14px] font-medium text-blue-600">
                                                    {c.challanNumber}
                                                </td>
                                                <td className="px-10 py-6">
                                                    <div className="text-[14px] font-bold text-slate-800">{c.Customer?.name}</div>
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{c.Project?.name || 'No Project'}</div>
                                                </td>
                                                <td className="px-10 py-6">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                                        c.status === 'Draft' ? 'bg-slate-50 text-slate-400 border-slate-100' : 
                                                        c.status === 'Open' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                                                        'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                    }`}>
                                                        {c.status}
                                                    </span>
                                                </td>
                                                <td className="px-10 py-6 text-right text-[15px] font-black text-slate-900">
                                                     {getCurrencyDisplay(c.Customer?.currency)} {parseFloat(c.totalAmount).toLocaleString()}
                                                </td>
                                                <td className="px-10 py-6 text-center">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); setDeleteId(c.id); }}
                                                        className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DeliveryChallansView;
