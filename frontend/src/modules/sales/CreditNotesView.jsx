import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { creditNoteAPI, ledgerAPI, inventoryAPI, salesAPI, companyAPI, projectAPI } from '../../services/api';
import { 
  Plus, Calendar, Undo2, MoreHorizontal, Edit2, Trash2, 
  Settings, CheckCircle2, AlertCircle, Clock, ArrowRight,
  Package, User, Search, X, ChevronRight, FileText,
  Filter, Download, ArrowLeft, Loader2, Save, Send,
  Trash, Info, HelpCircle, Tag, Paperclip, ChevronDown, Check,
  AlertTriangle, FileEdit, Printer, Mail, MoreVertical,
  RefreshCw, DollarSign, List, History, Share2
} from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';
import useNotificationStore from '../../store/notificationStore';
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
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-[18px] font-bold text-slate-900 tracking-tight">Manage Salespersons</h3>
                    <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition-colors"><X size={18}/></button>
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
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="px-4 py-2 bg-[#1e61f0] text-white text-[13px] font-bold rounded-lg hover:bg-blue-700 transition-all flex items-center gap-1.5 whitespace-nowrap shadow-md shadow-blue-100"
                    >
                        <Plus size={14}/> New Salesperson
                    </button>
                </div>
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

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMER SEARCH SELECTOR
// ─────────────────────────────────────────────────────────────────────────────
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
// CREDIT NOTE FORM (COMPONENT)
// ─────────────────────────────────────────────────────────────────────────────
const CreditNoteForm = ({ companyId, navigate, editId }) => {
    const { addNotification } = useNotificationStore();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [ledgers, setLedgers] = useState([]);
    const [items, setItems] = useState([]);
    const [projects, setProjects] = useState([]);
    
    const customers = useMemo(() => ledgers.filter(l => {
        const g = l.Group?.name || '';
        const gDirect = l.groupName || '';
        return g.toLowerCase().includes('debtor') || g.toLowerCase().includes('customer')
            || gDirect.toLowerCase().includes('debtor') || gDirect.toLowerCase().includes('customer');
    }), [ledgers]);
    const arAccounts = useMemo(() => ledgers.filter(l => {
        const g = l.Group?.name || '';
        const gDirect = l.groupName || '';
        return g.toLowerCase().includes('debtor') || g.toLowerCase().includes('customer')
            || gDirect.toLowerCase().includes('debtor') || gDirect.toLowerCase().includes('customer')
            || l.name === 'Accounts Receivable';
    }), [ledgers]);

    const [formData, setFormData] = useState({
        creditNoteNumber: `CN-000${Math.floor(10 + Math.random() * 90)}`,
        customerLedgerId: '',
        accountsReceivableId: '',
        referenceNumber: '',
        date: new Date().toISOString().split('T')[0],
        salesperson: '',
        subject: '',
        discount: 0,
        adjustment: 0,
        taxAmount: 0,
        customerNotes: 'Will be displayed on the credit note',
        termsConditions: 'Enter terms and conditions here...',
        projectId: ''
    });

    const [lineItems, setLineItems] = useState([
        { id: Date.now(), itemId: '', accountId: '', description: '', quantity: 1, rate: 0, amount: 0 }
    ]);

    useEffect(() => {
        if (!companyId) return;
        setLoading(true);
        Promise.all([
            ledgerAPI.getByCompany(companyId),
            inventoryAPI.getByCompany(companyId),
            projectAPI.getByCompany(companyId)
        ]).then(([ledgersRes, itemsRes, projectsRes]) => {
            const allLedgers = ledgersRes.data || [];
            setLedgers(allLedgers);
            setItems(itemsRes.data || []);
            setProjects(projectsRes.data || []);
            const defaultAR = allLedgers.find(l => l.name === 'Accounts Receivable');
            if (defaultAR) setFormData(prev => ({ ...prev, accountsReceivableId: defaultAR.id }));
        }).finally(() => setLoading(false));

        if (editId) {
            creditNoteAPI.getById(editId).then(res => {
                const cn = res.data;
                if (cn) {
                    setFormData({ ...cn, date: new Date(cn.date).toISOString().split('T')[0] });
                    setLineItems(cn.items.map(it => ({ ...it, name: it.Item?.name || '' })));
                }
            });
        }
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
                if (field === 'quantity' || field === 'rate') updated.amount = (parseFloat(updated.quantity) || 0) * (parseFloat(updated.rate) || 0);
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
                return { ...row, itemId: item.id, name: item.name, description: item.salesDescription || '', rate: item.sellingPrice || 0, amount: (item.sellingPrice || 0) * (row.quantity || 1) };
            }
            return row;
        }));
    };

    const handleSave = async (status = 'Open') => {
        if (!formData.customerLedgerId || !formData.accountsReceivableId) {
            addNotification('Please select both a Customer and an AR Account.', 'error');
            return;
        }
        setSaving(true);
        try {
            const payload = { ...formData, items: lineItems, subTotal: totals.subTotal, taxAmount: totals.taxAmt, totalAmount: totals.total, status, companyId };
            let savedNote;
            if (editId) {
                const res = await creditNoteAPI.update(editId, payload);
                savedNote = res.data;
                addNotification('Credit Note updated', 'success');
            } else {
                const res = await creditNoteAPI.create(payload);
                savedNote = res.data;
                addNotification('Credit Note issued', 'success');
            }
            navigate(`/credit-notes/view/${savedNote?.id || editId}`);
        } catch (err) {
            addNotification('Failed to save Credit Note', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-20 flex flex-col items-center justify-center h-screen"><Loader2 className="animate-spin text-blue-500 mb-4" size={32}/><div className="font-bold text-slate-400 uppercase tracking-widest text-sm">Preparing Interface...</div></div>;

    return (
        <div className="flex flex-col h-full bg-[#f8fafc] relative overflow-hidden">
            {/* Sticky Header */}
            <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shrink-0 sticky top-0 z-20 no-print">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => navigate('/credit-notes')}
                        className="p-2 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-900 transition-all"
                    >
                        <ArrowLeft size={22} />
                    </button>
                    <div>
                        <h2 className="text-[18px] font-bold text-slate-900 tracking-tight flex items-center gap-2 uppercase">
                            {editId ? 'Edit Credit Note' : 'New Credit Note'}
                            <span className="text-[10px] font-bold text-[#1e61f0] bg-blue-50 px-2 py-0.5 rounded uppercase tracking-widest border border-blue-100">{formData.creditNoteNumber}</span>
                        </h2>
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Sales / Credit Notes</div>
                    </div>
                </div>
                <button onClick={() => navigate('/credit-notes')} className="text-slate-300 hover:text-slate-600 transition-colors"><X size={24} /></button>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
                <div className="max-w-[1000px] mx-auto py-10 px-6">
                    <div className="bg-white rounded border border-slate-200 shadow-sm p-12 space-y-12 animate-fade-in relative overflow-hidden">
                  {/* Decorative corner blur */}
                  <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-50 via-purple-50/30 to-transparent rounded-bl-[100%] opacity-70 pointer-events-none -z-10 blur-3xl"></div>

                  <div className="grid grid-cols-2 gap-x-16 gap-y-10 relative z-10">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-red-500 uppercase tracking-widest ml-1 flex items-center gap-2">Customer Selection*</label>
                      <CustomerSearchSelector 
                          customers={customers}
                          value={customers.find(c => c.id === formData.customerLedgerId)?.name || ''}
                          onChange={(id) => setFormData({...formData, customerLedgerId: id})}
                          placeholder="Select a customer..."
                          onNewCustomer={() => window.open('/customers/new', '_blank')}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-red-500 uppercase tracking-widest ml-1 flex items-center gap-2">AR Account*</label>
                      <div className="relative">
                          <select 
                            value={formData.accountsReceivableId} 
                            onChange={e => setFormData({...formData, accountsReceivableId: e.target.value})}
                            className="w-full h-12 px-5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-bold text-slate-800 outline-none appearance-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all shadow-sm"
                          >
                            <option value="">Select AR account...</option>
                            {arAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                          </select>
                          <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-red-500 uppercase tracking-widest ml-1">Credit Note #*</label>
                      <input 
                        type="text" 
                        value={formData.creditNoteNumber} 
                        onChange={e => setFormData({...formData, creditNoteNumber: e.target.value})}
                        className="w-full h-12 px-5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all shadow-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Project</label>
                      <div className="relative">
                        <select 
                          value={formData.projectId} 
                          onChange={e => setFormData({...formData, projectId: e.target.value})}
                          className="w-full h-12 px-5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all shadow-sm appearance-none"
                        >
                          <option value="">Select or associate project</option>
                          {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Reference ID</label>
                      <input 
                        type="text" 
                        value={formData.referenceNumber} 
                        onChange={e => setFormData({...formData, referenceNumber: e.target.value})}
                        placeholder="E.g. Invoice # or RMA #"
                        className="w-full h-12 px-5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all shadow-sm placeholder:text-slate-300 placeholder:font-medium"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-red-500 uppercase tracking-widest ml-1">Credit Date*</label>
                      <input 
                        type="date" 
                        value={formData.date} 
                        onChange={e => setFormData({...formData, date: e.target.value})}
                        className="w-full h-12 px-5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-[14px] font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2"><Package size={16} className="text-blue-500"/> Line Items</h3>
                        <button className="text-[11px] font-bold text-[#1e61f0] flex items-center gap-1.5 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all"><Settings size={14}/> Settings</button>
                    </div>
                    
                    <div className="border border-slate-200/80 rounded-2xl shadow-sm bg-white relative">
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
                          {lineItems.map(line => (
                            <tr key={line.id} className="group hover:bg-slate-50/40 transition-colors">
                              <td className="px-6 py-5">
                                <ItemSearchSelector 
                                    items={items}
                                    value={items.find(it => it.id === line.itemId)?.name || ''}
                                    onChange={(selectedId) => handleItemSelect(line.id, selectedId)}
                                    placeholder="Type or click to select an item."
                                    onNewItem={() => window.open('/inventory/new', '_blank')}
                                />
                                <div className="text-[11px] text-slate-400 pl-4 mt-1.5 italic">
                                    {line.description || 'No additional description'}
                                </div>
                              </td>
                              <td className="px-6 py-5 align-top">
                                <input 
                                  type="number" 
                                  value={line.quantity} 
                                  onChange={e => handleUpdateLine(line.id, 'quantity', e.target.value)}
                                  className="w-full text-right bg-slate-50 border border-slate-100 px-3 py-2 outline-none text-[13px] font-bold text-slate-700 focus:bg-white focus:border-blue-300 rounded-lg transition-all" 
                                />
                              </td>
                              <td className="px-6 py-5 align-top">
                                <input 
                                  type="number" 
                                  value={line.rate} 
                                  onChange={e => handleUpdateLine(line.id, 'rate', e.target.value)}
                                  className="w-full text-right bg-slate-50 border border-slate-100 px-3 py-2 outline-none text-[13px] font-bold text-slate-700 focus:bg-white focus:border-blue-300 rounded-lg transition-all" 
                                />
                              </td>
                              <td className="px-6 py-5 text-right font-mono font-bold text-slate-900 text-[15px] align-top pt-7">
                                {getCurrencyDisplay(customers.find(c => c.id === formData.customerLedgerId)?.currency)} {(parseFloat(line.amount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-4 py-5 text-center align-top pt-7">
                                <button onClick={() => setLineItems(prev => prev.filter(p => p.id !== line.id))} className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-all"><Trash2 size={16}/></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <button onClick={() => setLineItems([...lineItems, { id: Date.now(), itemId: '', accountId: '', description: '', quantity: 1, rate: 0, amount: 0 }])} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-[#1e61f0] text-[12px] font-bold rounded-xl shadow-sm hover:bg-slate-50 hover:border-blue-200 transition-all"><Plus size={14} strokeWidth={3} /> Add New Row</button>
                  </div>

                  <div className="flex justify-end pt-12 border-t border-slate-100/80">
                     <div className="w-80 space-y-4 bg-slate-900 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-[50px] opacity-20 pointer-events-none"></div>
                        <div className="flex justify-between items-center text-[15px] font-bold relative z-10">
                          <span className="text-slate-400 uppercase tracking-widest text-[12px]">Total Credit</span>
                          <span className="text-[28px] font-bold text-white tracking-tighter">{getCurrencyDisplay(customers.find(c => c.id === formData.customerLedgerId)?.currency)} {totals.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                     </div>
                    </div>
                </div>
            </div>
        </div>

            {/* Sticky Footer */}
            <footer className="bg-white border-t border-slate-200 px-8 py-4 flex items-center justify-between shrink-0 sticky bottom-0 z-20 no-print shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                        <Undo2 size={14} className="text-blue-500" />
                        Credit Adjustment Protocol
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => navigate('/credit-notes')}
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
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <><Send size={16}/> Issue Credit</>}
                    </button>
                </div>
            </footer>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// CREDIT NOTE DETAIL VIEW
// ─────────────────────────────────────────────────────────────────────────────
const CreditNoteDetail = ({ id, navigate, companyId }) => {
    const { addNotification } = useNotificationStore();
    const [note, setNote] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        creditNoteAPI.getById(id).then(res => { setNote(res.data); setLoading(false); }).catch(() => setLoading(false));
    }, [id]);

    if (loading) return <div className="p-20 text-center font-bold text-slate-300 animate-pulse uppercase tracking-widest text-[11px]">Syncing Records...</div>;
    if (!note) return <div className="p-20 text-center text-slate-300 font-bold text-2xl opacity-20 uppercase tracking-tighter">Not Found</div>;

    return (
        <div className="flex-1 flex flex-col h-full bg-[#f8fafc] animate-fade-in shadow-inner overflow-hidden">
            <div className="bg-[#fcfdfe] border-b border-slate-200 px-8 py-2.5 flex items-center justify-between sticky top-0 z-10 no-print">
                <div className="flex items-center gap-2">
                    <button onClick={() => navigate('/credit-notes')} className="text-[13px] font-bold text-blue-600 hover:underline flex items-center gap-1.5 transition-all">
                       <ChevronDown size={14} className="rotate-90"/> All Credit Notes
                    </button>
                    <span className="text-slate-300">|</span>
                    <span className="text-[13px] font-bold text-slate-800">{note.creditNoteNumber}</span>
                </div>
                <div className="flex items-center gap-3">
                   <button className="p-1.5 text-slate-400 hover:bg-slate-50 rounded-md transition-all hover:text-slate-600"><History size={16}/></button>
                   <button className="p-1.5 text-slate-400 hover:bg-slate-50 rounded-md transition-all hover:text-slate-600"><Share2 size={16}/></button>
                </div>
            </div>

            <div className="bg-white border-b border-slate-100 px-8 py-2 flex items-center justify-between shadow-sm no-print">
                <div className="flex items-center gap-1">
                    <button onClick={() => navigate(`/credit-notes/edit/${note.id}`)} className="px-3 py-1.5 text-slate-600 hover:bg-slate-50 rounded flex items-center gap-1.5 text-[12px] font-bold border border-transparent hover:border-slate-100 transition-all"><Edit2 size={14}/> Edit</button>
                    <button onClick={() => window.print()} className="px-3 py-1.5 text-slate-600 hover:bg-slate-50 rounded flex items-center gap-1.5 text-[12px] font-bold transition-all"><Printer size={14}/> PDF/Print <ChevronDown size={14}/></button>
                    <span className="w-px h-5 bg-slate-100 mx-2" />
                    <button onClick={async () => { try { await creditNoteAPI.delete(note.id); addNotification('Deleted', 'success'); navigate('/credit-notes'); } catch(e) { addNotification('Error', 'error'); } }} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded transition-all"><Trash2 size={16}/></button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-12 flex flex-col items-center custom-scrollbar print:p-0 print:bg-white transition-all bg-slate-50/50">
                <div className="bg-white shadow-[0_40px_100px_-20px_rgba(0,0,0,0.08)] rounded-none min-h-[842px] w-full max-w-[800px] mx-auto p-8 md:p-20 relative overflow-hidden border border-slate-100 mb-20 group">
                    {/* Professional Watermark */}
                    <div className="absolute -top-10 -right-10 w-96 h-96 bg-blue-50/30 rounded-full blur-[100px] pointer-events-none -z-10"></div>
                    <div className="absolute top-16 right-16 rotate-[12deg] opacity-[0.03] no-print pointer-events-none select-none">
                        <div className="border-[12px] border-slate-900 text-slate-900 px-12 py-6 text-7xl font-bold uppercase tracking-[0.2em] rounded-none">OFFICIAL</div>
                    </div>

                    <div className="flex justify-between items-start mb-16 border-b border-slate-900 pb-12">
                        <div className="flex gap-4 items-start max-w-[65%]">
                            <div className="w-12 h-12 bg-slate-900 flex items-center justify-center text-white font-bold text-xl shrink-0 rounded-none">{localStorage.getItem('companyName')?.charAt(0) || 'M'}</div>
                            <div className="space-y-1 min-w-0">
                                <h2 className="text-[18px] font-bold text-slate-900 tracking-tight uppercase leading-tight">{localStorage.getItem('companyName') || 'THE MOON ENTERPRISES'}</h2>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Returns & Adjustments Department</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <h1 className="text-[18px] font-bold text-slate-900 tracking-[0.2em] uppercase leading-none mb-3">CREDIT NOTE</h1>
                            <div className="space-y-1">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Document #</p>
                                <p className="text-[15px] font-bold text-slate-900 tracking-tight">{note.creditNoteNumber}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-20 mb-16">
                        <div className="space-y-4">
                            <h5 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Bill To</h5>
                            <div className="space-y-1">
                                <p className="text-[15px] font-bold text-slate-900 leading-tight">{note.CustomerLedger?.name || note.customerName}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">A/C: {note.customerLedgerId?.split('-')[0]}</p>
                            </div>
                        </div>
                        <div className="text-right space-y-4">
                            <h5 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Date of Issue</h5>
                            <p className="text-[15px] font-bold text-slate-900 leading-tight">{new Date(note.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                        </div>
                    </div>

                    <div className="relative mb-20">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b-[3px] border-slate-900 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-900">
                                    <th className="py-6 text-left pb-4">Service / Item Details</th>
                                    <th className="py-6 text-right w-24 pb-4">Qty</th>
                                    <th className="py-6 text-right w-32 pb-4">Unit Rate</th>
                                    <th className="py-6 text-right w-40 pb-4">Net Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {note.items?.map((it, idx) => (
                                    <tr key={idx} className="group/row hover:bg-slate-50/50 transition-colors">
                                        <td className="py-8">
                                            <div className="flex items-start gap-4">
                                                <div className="w-10 h-10 bg-slate-50 flex items-center justify-center text-slate-400 group-hover/row:bg-white group-hover/row:text-blue-500 transition-all border border-transparent group-hover/row:border-blue-100 font-bold text-[12px] rounded-none">{idx + 1}</div>
                                                <div>
                                                    <p className="text-[16px] font-bold text-slate-900 tracking-tight mb-1">{it.Item?.name || it.description}</p>
                                                    <p className="text-[12px] text-slate-400 font-bold uppercase tracking-wide leading-relaxed max-w-xs">{it.description || 'General Credit Issuance'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-8 text-right text-[15px] font-bold text-slate-500 tabular-nums">{it.quantity}</td>
                                        <td className="py-8 text-right text-[15px] font-bold text-slate-500 tabular-nums">{getCurrencyDisplay(note.CustomerLedger?.currency)} {parseFloat(it.rate).toLocaleString()}</td>
                                        <td className="py-8 text-right text-[16px] font-bold text-slate-900 tabular-nums">{getCurrencyDisplay(note.CustomerLedger?.currency)} {parseFloat(it.amount).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-end pt-12 border-t-2 border-slate-900">
                        <div className="w-full max-w-md space-y-6">
                            <div className="flex justify-between items-center px-2">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Subtotal</span>
                                <span className="text-[16px] font-bold text-slate-600 tabular-nums">{getCurrencyDisplay(note.CustomerLedger?.currency)} {parseFloat(note.totalAmount).toLocaleString()}</span>
                            </div>
                            <div className="bg-slate-900 text-white p-6 md:p-8 shadow-2xl relative overflow-hidden rounded-none">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-none blur-[60px] opacity-20"></div>
                                <div className="flex justify-between items-center relative z-10">
                                    <span className="text-[11px] font-bold text-blue-300 uppercase tracking-[0.2em]">Final Credit</span>
                                    <span className="text-[24px] md:text-[32px] font-bold text-white tracking-tighter tabular-nums">{getCurrencyDisplay(note.CustomerLedger?.currency)} {parseFloat(note.totalAmount).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-32 flex justify-between items-end opacity-40">
                         <div className="space-y-1">
                             <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Generated By Tally Accounting</p>
                             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Doc-Hash: {note.id?.substring(0, 12)}...</p>
                         </div>
                         <div className="text-right">
                             <div className="w-32 h-0.5 bg-slate-900 mb-2 ml-auto"></div>
                             <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Authorized Signature</p>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN VIEW COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// CREDIT NOTES TABLE VIEW (LANDSCAPE)
// ─────────────────────────────────────────────────────────────────────────────
const CreditNotesTableView = ({ notes, loading, onSelect, navigate, fetchNotes }) => {
    const [searchQuery, setSearchQuery] = useState('');
    
    const filtered = notes.filter(n => 
        n.creditNoteNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (n.CustomerLedger?.name || n.customerName)?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex-1 flex flex-col h-full bg-white animate-fade-in overflow-hidden">
            {/* HEADER */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 bg-white">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 group cursor-pointer">
                        <h1 className="text-[20px] font-bold text-slate-900 tracking-tight">Credit Notes</h1>
                        <ChevronDown size={18} className="text-blue-600 mt-1" />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                   <button 
                      onClick={() => navigate('/credit-notes/new')}
                      className="bg-[#1e61f0] hover:bg-[#1a54d1] text-white px-5 py-2.5 rounded-lg font-bold text-[13px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-blue-200 active:scale-95"
                   >
                      <Plus size={16} strokeWidth={3}/> New Credit Note
                   </button>
                   <button className="p-2.5 text-slate-400 hover:text-slate-800 border border-slate-100 bg-white rounded-lg hover:bg-slate-50 transition-colors">
                      <MoreHorizontal size={20} />
                   </button>
                </div>
            </div>

            {/* SEARCH/FILTER BAR */}
            <div className="px-8 py-4 bg-slate-50/50 flex items-center justify-between border-b border-slate-100">
                <div className="flex items-center gap-4">
                    <div className="relative group w-72">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1e61f0] transition-colors" />
                        <input 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search by number or customer..."
                            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] font-medium text-slate-700 outline-none focus:border-[#1e61f0] focus:ring-4 focus:ring-blue-50 shadow-sm transition-all"
                        />
                    </div>
                    <button 
                        onClick={fetchNotes}
                        className="p-2.5 text-slate-400 hover:text-[#1e61f0] hover:bg-white rounded-lg border border-transparent hover:border-slate-100 transition-all"
                        title="Refresh"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 text-slate-500 text-[13px] font-bold hover:text-slate-900 transition-colors uppercase tracking-widest">
                        <Filter size={14} /> Filter
                    </button>
                    <div className="w-px h-4 bg-slate-200 mx-2" />
                    <button className="h-10 px-5 flex items-center gap-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-[11px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
                        <Download size={14} /> Export
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-8">
                {loading ? (
                    <div className="py-24 text-center space-y-4">
                        <Loader2 size={32} className="animate-spin text-blue-500 mx-auto" />
                        <p className="text-[12px] font-bold text-slate-400 uppercase tracking-[0.2em] animate-pulse">Scanning Records...</p>
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-[0.15em] border-b border-slate-200 sticky top-0 z-10">
                                <th className="px-6 py-4 rounded-tl-xl">Date</th>
                                <th className="px-6 py-4">Credit Note #</th>
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4">Reference</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-right">Amount</th>
                                <th className="px-6 py-4 text-center rounded-tr-xl">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="py-32 text-center">
                                       <div className="flex flex-col items-center justify-center gap-4">
                                          <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200">
                                             <Undo2 size={32} />
                                          </div>
                                          <div className="space-y-1">
                                            <p className="text-slate-900 text-[16px] font-bold">No credit notes found</p>
                                            <p className="text-slate-400 text-[13px] font-medium">Issue credit notes to handle returns or price adjustments.</p>
                                          </div>
                                          <button onClick={() => navigate('/credit-notes/new')} className="text-blue-600 text-[13px] font-bold hover:underline mt-2">Create a credit note</button>
                                       </div>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(n => (
                                    <tr 
                                        key={n.id} 
                                        onClick={() => onSelect(n.id)}
                                        className="hover:bg-blue-50/30 cursor-pointer group transition-all"
                                    >
                                        <td className="px-6 py-5 text-[13px] text-slate-500 font-medium">
                                            {new Date(n.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="text-[14px] font-bold text-blue-600 group-hover:underline transition-colors">
                                                {n.creditNoteNumber}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="text-[14px] font-bold text-slate-900">{n.CustomerLedger?.name || n.customerName}</div>
                                        </td>
                                        <td className="px-6 py-5 text-[13px] text-slate-500 font-medium">
                                            {n.reference || '—'}
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full uppercase text-[9px] font-black tracking-widest">
                                                SUCCESS
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-right whitespace-nowrap">
                                            <span className="text-[15px] text-slate-900 font-black tracking-tight">
                                                {getCurrencyDisplay(n.CustomerLedger?.currency)} {parseFloat(n.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center justify-center gap-2">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); navigate(`/credit-notes/edit/${n.id}`); }} 
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all shadow-sm border border-transparent hover:border-slate-100"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button 
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg transition-all shadow-sm border border-transparent hover:border-slate-100"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// CREDIT NOTES LIST (SIDEBAR)
// ─────────────────────────────────────────────────────────────────────────────
const CreditNotesList = ({ notes, loading, selectedId, onSelect, navigate, fetchNotes }) => {
    const [searchTerm, setSearchTerm] = useState('');
    
    const filtered = notes.filter(n => 
        n.creditNoteNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (n.CustomerLedger?.name || n.customerName)?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full bg-white border-r border-slate-100 w-[400px] shrink-0 no-print animate-fade-in-left">
            <div className="p-6 border-b border-slate-50 space-y-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-[17px] font-bold text-slate-900 tracking-tight">Credit Notes</h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-0.5">Returns Log</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => navigate('/credit-notes/new')}
                            className="p-2 bg-[#1e61f0] text-white rounded-lg shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
                        >
                            <Plus size={18} strokeWidth={3} />
                        </button>
                    </div>
                </div>

                <div className="relative group">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                    <input 
                        type="text"
                        placeholder="Search logs..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar py-2">
                {loading ? (
                    <div className="p-12 text-center animate-pulse">
                        <Loader2 size={24} className="animate-spin text-blue-200 mx-auto mb-2" />
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Hydrating...</span>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center opacity-30 italic text-[12px] font-bold uppercase tracking-widest text-slate-400">Empty Log</div>
                ) : (
                    <div className="space-y-1 px-3">
                        {filtered.map(n => {
                            const isSelected = String(n.id) === String(selectedId);
                            return (
                                <div 
                                    key={n.id}
                                    onClick={() => onSelect(n.id)}
                                    className={`p-5 cursor-pointer rounded-2xl transition-all flex flex-col gap-2 relative overflow-hidden group
                                        ${isSelected ? 'bg-blue-600 text-white shadow-xl shadow-blue-200 -translate-y-0.5' : 'hover:bg-slate-50 text-slate-600'}`}
                                >
                                    <div className="flex justify-between items-start relative z-10">
                                        <div className={`text-[14px] font-bold tracking-tight leading-tight ${isSelected ? 'text-white' : 'text-slate-900 group-hover:text-blue-600'}`}>
                                            {n.CustomerLedger?.name || n.customerName}
                                        </div>
                                        <div className={`text-[15px] font-black italic tracking-tighter ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                                            {getCurrencyDisplay(n.CustomerLedger?.currency)} {parseFloat(n.totalAmount || 0).toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center relative z-10">
                                        <span className={`text-[10px] font-bold uppercase tracking-widest ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                                            {n.creditNoteNumber} | {new Date(n.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                        </span>
                                    </div>
                                    {isSelected && <div className="absolute top-0 right-0 p-3 opacity-20"><Undo2 size={48} strokeWidth={1} /></div>}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN VIEW COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const CreditNotesView = () => {
    const navigate = useNavigate();
    const params = useParams();
    const location = useLocation();
    const companyId = localStorage.getItem('companyId');
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchNotes = async () => {
        try {
            setLoading(true);
            const res = await creditNoteAPI.getByCompany(companyId);
            setNotes(res.data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { if (companyId) fetchNotes(); }, [companyId]);

    const selectedId = params.id;

    if (location.pathname === '/credit-notes/new' || location.pathname.includes('/edit/')) {
        return <CreditNoteForm companyId={companyId} navigate={navigate} editId={selectedId} />;
    }

    // IF NO ID: SHOW LANDSCAPE TABLE VIEW
    if (!selectedId) {
        return (
            <div className="flex h-screen bg-[#f8fafc] overflow-hidden">
                <CreditNotesTableView 
                    notes={notes} 
                    loading={loading} 
                    onSelect={(id) => navigate(`/credit-notes/view/${id}`)}
                    navigate={navigate}
                    fetchNotes={fetchNotes}
                />
            </div>
        );
    }

    // IF ID PRESENT: SHOW SPLIT VIEW
    return (
        <div className="flex h-screen bg-[#f8fafc] overflow-hidden animate-fade-in relative">
            <CreditNotesList 
                notes={notes} 
                loading={loading} 
                selectedId={selectedId} 
                onSelect={(id) => navigate(`/credit-notes/view/${id}`)}
                navigate={navigate}
                fetchNotes={fetchNotes}
            />
            <div className="flex-1 h-full overflow-hidden flex flex-col bg-slate-50">
                <CreditNoteDetail 
                    id={selectedId} 
                    navigate={navigate} 
                    companyId={companyId} 
                    onRefresh={fetchNotes}
                />
            </div>
        </div>
    );
};
export default CreditNotesView;
