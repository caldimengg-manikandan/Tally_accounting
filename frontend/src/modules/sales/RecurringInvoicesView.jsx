import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { recurringInvoiceAPI, ledgerAPI, inventoryAPI, priceListAPI } from '../../services/api';
import { 
  Plus, Calendar, RefreshCw, MoreHorizontal, Edit2, Trash2, 
  Settings, CheckCircle2, AlertCircle, Clock, ArrowRight,
  Package, User, Search, X, ChevronRight, FileText,
  Filter, Download, ArrowLeft, Loader2, Save, Send,
  Trash, Info, HelpCircle, Tag, Paperclip, ChevronDown, Check,
  AlertTriangle, Play, Pause, Square, File, Zap, ShieldCheck, Phone, Repeat
} from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';
import useNotificationStore from '../../store/notificationStore';
import { getCurrencyDisplay } from '../../utils/currencies';

const formatAddress = (address) => {
  if (!address) return '';
  try {
    if (typeof address === 'string' && (address.startsWith('{') || address.startsWith('['))) {
      const parsed = JSON.parse(address);
      if (typeof parsed === 'object') {
        return [
          parsed.attention,
          parsed.street1,
          parsed.street2,
          parsed.city,
          parsed.state,
          parsed.country,
          parsed.pinCode
        ].filter(Boolean).join(', ');
      }
    }
    return address;
  } catch (e) {
    return address;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ITEM SEARCH SELECTOR (FOR TABLE CELLS)
// ─────────────────────────────────────────────────────────────────────────────
const ItemSearchSelector = ({ value, onChange, items, placeholder }) => {
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
                        <div className="text-[14px] font-medium text-slate-300 italic">{placeholder}</div>
                    )}
                </div>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-[400px] bg-white border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-xl z-[100] overflow-hidden animate-fade-in">
                    <div className="p-3 border-b border-slate-50 bg-slate-50/50">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                autoFocus
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search items or descriptions..."
                                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-[13px] outline-none focus:border-blue-500 transition-all font-medium"
                            />
                        </div>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto no-scrollbar py-1 flex flex-col">
                        {filtered.length > 0 ? (
                            <div className="flex-1">
                                {filtered.map(it => (
                                    <div 
                                        key={it.id}
                                        onClick={() => {
                                            onChange(it);
                                            setIsOpen(false);
                                            setSearch('');
                                        }}
                                        className="px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors group mx-1 rounded-lg"
                                    >
                                        <div className="flex justify-between items-start mb-0.5">
                                            <div className="text-[14px] font-bold text-slate-800 tracking-tight flex items-center gap-2">
                                                <Package size={14} className="text-blue-500 opacity-50" />
                                                {it.name}
                                            </div>
                                            <div className="text-[13px] font-bold text-slate-900">{getCurrencyDisplay(it.currency)} {parseFloat(it.sellingPrice || 0).toLocaleString()}</div>
                                        </div>
                                        <div className="text-[11px] text-slate-400 font-medium whitespace-nowrap overflow-hidden text-ellipsis italic">
                                            {it.salesDescription || 'No description provided'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-12 text-center flex flex-col items-center justify-center">
                                <Package size={20} className="text-slate-200 mb-2" />
                                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">No matching items</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// MANAGE SALESPERSONS MODAL
// ─────────────────────────────────────────────────────────────────────────────
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

                <div className="px-6 py-2">
                    <div className="max-h-56 overflow-y-auto no-scrollbar">
                        {filtered.length === 0 ? (
                            <div className="py-12 text-center text-slate-400 text-[13px] font-medium italic">No salespersons found.</div>
                        ) : (
                            filtered.map(s => (
                                <div
                                    key={s.id}
                                    onClick={() => { onSelect(s.name); onClose(); }}
                                    className="flex justify-between items-center py-3 border-b border-slate-50 hover:bg-blue-50 cursor-pointer rounded transition-colors px-2"
                                >
                                    <span className="text-[13px] font-bold text-slate-900">{s.name}</span>
                                    <span className="text-[11px] text-slate-400 font-bold uppercase tracking-tight">{s.email || '—'}</span>
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
// RECURRING INVOICE FORM (COMPONENT)
// ─────────────────────────────────────────────────────────────────────────────
const RecurringInvoiceForm = ({ companyId, navigate, editId }) => {
    const { addNotification } = useNotificationStore();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [items, setItems] = useState([]);
    
    const [formData, setFormData] = useState({
        templateName: '',
        customerName: '',
        frequency: 'Monthly',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        status: 'Active',
        autoSend: false,
        invoiceType: 'TaxInvoice',
        discount: 0,
        adjustment: 0,
        taxPercent: 0, 
        salesperson: '',
        subject: '',
        customerNotes: 'Thanks for your business.',
        termsConditions: '',
        repeatEvery: 1
    });

    const [lineItems, setLineItems] = useState([
        { id: Date.now(), itemId: '', name: '', description: '', quantity: 1, rate: 0, amount: 0 }
    ]);

    const [errors, setErrors] = useState({});
    const [salespersons, setSalespersons] = useState(() => {
        try { return JSON.parse(localStorage.getItem('tally_salespersons') || '[]'); } catch { return []; }
    });
    const [showSalespersonDropdown, setShowSalespersonDropdown] = useState(false);
    const [salespersonSearch, setSalespersonSearch] = useState('');
    const [showManageSalespersons, setShowManageSalespersons] = useState(false);
    const salespersonDropdownRef = useRef(null);

    const [customerSearch, setCustomerSearch] = useState('');
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const customerDropdownRef = useRef(null);

    useEffect(() => {
        const fetchContext = async () => {
            if (!companyId) return;
            setLoading(true);
            try {
                const [ledRes, itRes] = await Promise.all([
                    ledgerAPI.getByCompany(companyId),
                    inventoryAPI.getByCompany(companyId, 'sales')
                ]);
                const allLedgers = ledRes.data || [];
                const debtors = allLedgers.filter(l => {
                    const g = l.Group?.name || '';
                    const gDirect = l.groupName || '';
                    return g.toLowerCase().includes('debtor') || g.toLowerCase().includes('customer')
                        || gDirect.toLowerCase().includes('debtor') || gDirect.toLowerCase().includes('customer');
                });
                setCustomers(debtors);
                setItems(itRes.data || []);

                if (editId) {
                    const res = await recurringInvoiceAPI.getById(editId);
                    const template = res.data;
                    if (template) {
                        setFormData({
                            ...template,
                            startDate: new Date(template.startDate).toISOString().split('T')[0],
                            endDate: template.endDate ? new Date(template.endDate).toISOString().split('T')[0] : '',
                            taxPercent: template.taxAmount ? Math.round((template.taxAmount / (template.subTotal - (template.subTotal * template.discount/100))) * 100) : 18
                        });
                        setCustomerSearch(template.customerName);
                        if (template.items && template.items.length > 0) {
                            setLineItems(template.items.map(it => ({ ...it, id: Math.random(), name: it.Item?.name || '' })));
                        }
                    }
                }
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetchContext();

        const handleClickOutside = (event) => {
            if (salespersonDropdownRef.current && !salespersonDropdownRef.current.contains(event.target)) setShowSalespersonDropdown(false);
            if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target)) setShowCustomerDropdown(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [companyId, editId]);

    const totals = useMemo(() => {
        const subTotal = lineItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        const discountAmt = (subTotal * parseFloat(formData.discount || 0)) / 100;
        const taxAmt = (subTotal - discountAmt) * (parseFloat(formData.taxPercent || 0) / 100);
        const total = subTotal - discountAmt + taxAmt + parseFloat(formData.adjustment || 0);
        return { subTotal, discountAmt, taxAmt, total };
    }, [lineItems, formData.discount, formData.taxPercent, formData.adjustment]);

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

    const handleItemSelect = (rowId, item) => {
        setLineItems(prev => prev.map(row => {
            if (row.id === rowId) {
                const currentQty = parseFloat(row.quantity) || 0;
                const newQty = currentQty === 0 ? 1 : currentQty;
                return { 
                    ...row, 
                    itemId: item.id, 
                    name: item.name, 
                    description: item.salesDescription || '', 
                    rate: item.sellingPrice || 0, 
                    quantity: newQty,
                    amount: (item.sellingPrice || 0) * newQty 
                };
            }
            return row;
        }));
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.customerName) newErrors.customerName = true;
        if (!formData.templateName) newErrors.templateName = true;
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) { addNotification('Please fill all required fields', 'warning'); return; }
        setSaving(true);
        try {
            // Sanitize dates to YYYY-MM-DD for PostgreSQL compatibility
            const sanitizeDate = (dateStr) => {
                if (!dateStr) return null;
                // If already YYYY-MM-DD, pass through
                if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
                // If DD/MM/YYYY, convert
                if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
                    const [day, month, year] = dateStr.split('/');
                    return `${year}-${month}-${day}`;
                }
                // Fallback: try to parse with Date constructor
                const parsed = new Date(dateStr);
                return isNaN(parsed.getTime()) ? dateStr : parsed.toISOString().split('T')[0];
            };

            const payload = {
                ...formData,
                startDate: sanitizeDate(formData.startDate),
                endDate: sanitizeDate(formData.endDate),
                items: lineItems,
                subTotal: totals.subTotal,
                taxAmount: totals.taxAmt,
                totalAmount: totals.total,
                CompanyId: companyId
            };
            if (editId) await recurringInvoiceAPI.update(editId, payload);
            else await recurringInvoiceAPI.create(payload);
            addNotification(`Automation ${editId ? 'updated' : 'initialized'} successfully`, 'success');
            navigate('/recurring-invoices');
        } catch (err) {
            addNotification('Failed to save automation: ' + (err.response?.data?.error || err.message), 'error');
        } finally { setSaving(false); }
    };

    if (loading) return <div className="p-20 text-center font-bold text-slate-400 animate-pulse">Loading Automation Context...</div>;

    const filteredCustomers = customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()));

    return (
        <div className="flex flex-col h-full bg-[#f8fafc] relative overflow-hidden">
            {/* Sticky Header */}
            <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shrink-0 sticky top-0 z-20 no-print">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => window.history.length > 2 ? navigate(-1) : navigate('/recurring-invoices')}
                        className="p-2 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-900 transition-all"
                    >
                        <ArrowLeft size={22} />
                    </button>
                    <div>
                        <h2 className="text-[18px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
                            {editId ? 'Edit Subscription' : 'New Subscription'}
                            <span className="text-[10px] font-bold text-[#1e61f0] bg-blue-50 px-2 py-0.5 rounded uppercase tracking-widest border border-blue-100">Smart Draft</span>
                        </h2>
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Sales / Recurring Invoices</div>
                    </div>
                </div>
                <button onClick={() => navigate('/recurring-invoices')} className="text-slate-300 hover:text-slate-600 transition-colors"><X size={24} /></button>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-[1000px] mx-auto py-10 px-6">
                    <div className="bg-white rounded border border-slate-200 shadow-sm p-12 space-y-12 animate-fade-in">
                    <ManageSalespersonsModal
                        isOpen={showManageSalespersons}
                        onClose={() => setShowManageSalespersons(false)}
                        salespersons={salespersons}
                        onSave={setSalespersons}
                        onSelect={(name) => { setFormData(prev => ({ ...prev, salesperson: name })); setSalespersonSearch(name); }}
                    />

                    {/* Top Section: Standard Invoice Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-8">
                        <div className="space-y-6">
                            {/* Customer Selection */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] font-bold text-red-500 uppercase tracking-widest">Customer Name*</label>
                                <div className="relative" ref={customerDropdownRef}>
                                    <div className="flex shadow-sm">
                                        <input 
                                            type="text"
                                            value={customerSearch}
                                            onChange={(e) => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true); }}
                                            onFocus={() => setShowCustomerDropdown(true)}
                                            placeholder="Select or add a customer"
                                            className={`flex-1 h-11 px-4 bg-slate-50 border ${errors.customerName ? 'border-red-500' : 'border-slate-200'} rounded-l text-[13px] font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-all`}
                                        />
                                        <button className="px-4 bg-[#1e61f0] text-white rounded-r flex items-center justify-center"><Search size={16} /></button>
                                    </div>

                                    {showCustomerDropdown && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 shadow-xl rounded z-50 overflow-hidden flex flex-col">
                                            <div className="max-h-60 overflow-y-auto no-scrollbar">
                                                {filteredCustomers.length === 0 ? (
                                                    <div className="p-4 text-center">
                                                        <p className="text-[12px] text-slate-400 mb-2">No customers found</p>
                                                    </div>
                                                ) : (
                                                    <div className="py-1">
                                                        {filteredCustomers.map(c => (
                                                            <div 
                                                                key={c.id}
                                                                onClick={() => { setFormData(prev => ({ ...prev, customerName: c.name })); setCustomerSearch(c.name); setShowCustomerDropdown(false); setErrors(prev => ({...prev, customerName: false})); }}
                                                                className={`px-4 py-2 hover:bg-blue-50 cursor-pointer text-[14px] font-medium border-b border-slate-50 last:border-0 ${formData.customerName === c.name ? 'bg-blue-50 text-blue-700' : 'text-slate-700'}`}
                                                            >
                                                                {c.name}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="border-t border-slate-100 p-2 bg-slate-50 shrink-0">
                                                <button 
                                                    onClick={() => navigate('/customers/new')}
                                                    className="w-full flex items-center justify-center gap-2 py-2.5 text-[#1e61f0] font-bold text-[12px] hover:bg-blue-600 hover:text-white rounded transition-all uppercase tracking-widest"
                                                >
                                                    <Plus size={14} strokeWidth={3} /> New Customer
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Profile Identifier */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] font-bold text-red-500 uppercase tracking-widest">Profile Identifier*</label>
                                <input 
                                    type="text"
                                    value={formData.templateName} 
                                    onChange={e => { const val = e.target.value; setFormData(prev => ({...prev, templateName: val})); setErrors(prev => ({...prev, templateName: false})); }}
                                    placeholder={formData.customerName ? `e.g., Subscription - ${formData.customerName}` : "e.g., Monthly Maintenance"}
                                    className={`w-full h-11 px-4 bg-slate-50 border ${errors.templateName ? 'border-red-500' : 'border-slate-200'} rounded text-[13px] font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-all shadow-sm`}
                                />
                            </div>

                            {/* Frequency */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Billing Frequency</label>
                                <select 
                                    value={formData.frequency} 
                                    onChange={e => { const val = e.target.value; setFormData(prev => ({...prev, frequency: val})); }}
                                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded text-[13px] font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-all appearance-none shadow-sm"
                                >
                                    <option value="Weekly">Every Week</option>
                                    <option value="Monthly">Every Month</option>
                                    <option value="Quarterly">Every Quarter</option>
                                    <option value="Half-yearly">Every 6 Months</option>
                                    <option value="Yearly">Every Year</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Cycle Activation */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] font-bold text-red-500 uppercase tracking-widest">Cycle Activation*</label>
                                <div className="relative">
                                    <input 
                                        type="date" 
                                        value={formData.startDate} 
                                        onChange={e => { const val = e.target.value; setFormData(prev => ({...prev, startDate: val})); }}
                                        className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded text-[13px] font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-all shadow-sm"
                                    />
                                </div>
                            </div>

                            {/* Salesperson */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Salesperson</label>
                                <div className="relative" ref={salespersonDropdownRef}>
                                    <button
                                        type="button"
                                        onClick={() => { setShowSalespersonDropdown(!showSalespersonDropdown); setSalespersonSearch(''); }}
                                        className={`w-full h-11 px-4 border rounded text-[13px] font-bold text-left flex items-center justify-between transition-all shadow-sm
                                            ${showSalespersonDropdown ? 'border-blue-500 bg-white ring-4 ring-blue-50' : 'border-slate-200 bg-slate-50 text-slate-700'}`}
                                    >
                                        <span className={formData.salesperson ? 'text-slate-900' : 'text-slate-400'}>
                                            {formData.salesperson || 'Select or Add Salesperson'}
                                        </span>
                                        <ChevronDown size={14} className={`text-slate-400 transition-transform ${showSalespersonDropdown ? 'rotate-180' : ''}`} />
                                    </button>
                                    {showSalespersonDropdown && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 shadow-xl rounded z-[120] overflow-hidden">
                                            <div className="p-2 border-b border-slate-50 bg-slate-50/50">
                                                <div className="relative">
                                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                    <input 
                                                        autoFocus
                                                        value={salespersonSearch}
                                                        onChange={e => setSalespersonSearch(e.target.value)}
                                                        placeholder="Search..."
                                                        className="w-full pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded text-[12px] outline-none focus:border-blue-500"
                                                    />
                                                </div>
                                            </div>
                                            <div className="max-h-48 overflow-y-auto no-scrollbar">
                                                {salespersons.filter(s => s.name.toLowerCase().includes(salespersonSearch.toLowerCase())).map(s => (
                                                    <div key={s.id} onClick={() => { setFormData(prev => ({...prev, salesperson: s.name})); setShowSalespersonDropdown(false); }} className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-[13px] font-bold text-slate-700 border-b border-slate-50 last:border-0">{s.name}</div>
                                                ))}
                                            </div>
                                            <button onClick={() => setShowManageSalespersons(true)} className="w-full py-3 bg-slate-50 hover:bg-blue-50 text-blue-600 font-bold text-[11px] uppercase tracking-widest border-t border-slate-100">+ Manage Staff</button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Subject */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Subject</label>
                                <input 
                                    type="text" 
                                    value={formData.subject}
                                    onChange={e => { const val = e.target.value; setFormData(prev => ({...prev, subject: val})); }}
                                    placeholder="What is this automation for?"
                                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded text-[13px] font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-all shadow-sm" 
                                />
                            </div>
                        </div>
                    </div>

                    {/* Item Table Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[14px] font-bold text-slate-900 uppercase tracking-tight">Item Table</h3>
                            <button className="text-[11px] font-bold text-[#1e61f0] flex items-center gap-2 hover:bg-blue-50 px-3 py-1.5 rounded transition-all uppercase tracking-widest">
                                <RefreshCw size={14} /> Bulk Actions
                            </button>
                        </div>

                        <div className="border border-slate-200 rounded-sm overflow-visible shadow-sm bg-white">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-400 font-bold uppercase tracking-[0.1em]">
                                        <th className="px-6 py-4 text-left font-bold">Item Details</th>
                                        <th className="px-6 py-4 text-right w-28 font-bold">Quantity</th>
                                        <th className="px-6 py-4 text-right w-36 font-bold">Rate</th>
                                        <th className="px-6 py-4 text-right w-40 font-bold">Amount</th>
                                        <th className="w-12"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {lineItems.map(line => (
                                        <tr key={line.id} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-5">
                                                <ItemSearchSelector 
                                                    value={line.name} 
                                                    onChange={(item) => handleItemSelect(line.id, item)}
                                                    items={items}
                                                    placeholder="Type or click to select an item."
                                                />
                                                <textarea 
                                                    value={line.description}
                                                    onChange={e => handleUpdateLine(line.id, 'description', e.target.value)}
                                                    placeholder="No additional description" 
                                                    className="w-full mt-2 h-10 bg-transparent text-[11px] text-slate-400 outline-none resize-none border-none focus:ring-0 placeholder:italic font-medium no-scrollbar"
                                                />
                                            </td>
                                            <td className="px-6 py-5 align-top">
                                                <input type="number" value={line.quantity} onChange={e => handleUpdateLine(line.id, 'quantity', e.target.value)} className="w-full text-right bg-transparent border-none outline-none text-[13px] font-bold text-slate-600" />
                                            </td>
                                            <td className="px-6 py-5 align-top font-mono text-right">
                                                <input type="number" value={line.rate} onChange={e => handleUpdateLine(line.id, 'rate', e.target.value)} className="w-full text-right bg-transparent border-none outline-none text-[13px] font-bold text-slate-600" />
                                            </td>
                                            <td className="px-6 py-5 text-right align-top font-mono">
                                                <span className="text-[13px] font-bold text-slate-900">{getCurrencyDisplay(customers.find(c => c.name === formData.customerName)?.currency)} {(parseFloat(line.amount) || 0).toFixed(2)}</span>
                                            </td>
                                            <td className="px-4 py-5 text-center align-top">
                                                <button onClick={() => setLineItems(prev => prev.length > 1 ? prev.filter(p => p.id !== line.id) : prev)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <button onClick={() => setLineItems([...lineItems, { id: Date.now(), itemId: '', name: '', description: '', quantity: 1, rate: 0, amount: 0 }])} className="flex items-center gap-2 px-4 py-2 text-[#1e61f0] text-[12px] font-bold rounded hover:bg-blue-50 transition-all uppercase tracking-widest">+ Add New Row</button>
                    </div>

                    {/* Bottom Section */}
                    <div className="flex justify-between items-start pt-12 border-t border-slate-100 gap-20">
                        <div className="flex-1 max-w-md space-y-8">
                            <div className="space-y-3">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Customer Notes</label>
                                <textarea value={formData.customerNotes} onChange={e => { const val = e.target.value; setFormData(prev => ({...prev, customerNotes: val})); }} className="w-full h-24 p-4 bg-slate-50 border border-slate-200 rounded text-[13px] font-bold text-slate-600 outline-none focus:bg-white focus:border-blue-500 transition-all resize-none shadow-sm" />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Terms & Conditions</label>
                                <textarea value={formData.termsConditions} onChange={e => { const val = e.target.value; setFormData(prev => ({...prev, termsConditions: val})); }} className="w-full h-24 p-4 bg-slate-50 border border-slate-200 rounded text-[13px] font-bold text-slate-600 outline-none focus:bg-white focus:border-blue-500 transition-all resize-none shadow-sm" />
                            </div>
                        </div>
                        <div className="w-96 space-y-4">
                            <div className="flex justify-between items-center text-[13px] font-bold text-slate-500 uppercase tracking-widest">
                                <span>Sub Total</span>
                                <div className="flex items-center gap-3">
                                    <div className="w-20" />
                                    <span className="w-24 text-right tabular-nums text-slate-900 font-mono">{totals.subTotal.toFixed(2)}</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-[13px] font-bold text-slate-500 uppercase tracking-widest">
                                <span>Discount (%)</span>
                                <div className="flex items-center gap-3">
                                    <input type="number" value={formData.discount} onChange={e => { const val = e.target.value; setFormData(prev => ({...prev, discount: val})); }} className="w-20 h-8 px-2 bg-slate-50 border border-slate-200 rounded text-right font-bold outline-none focus:border-blue-400 focus:bg-white transition-all" />
                                    <span className="w-24 text-right tabular-nums text-slate-600 font-mono">- {totals.discountAmt.toFixed(2)}</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-[13px] font-bold text-slate-500 uppercase tracking-widest">
                                <span>Tax (GST %)</span>
                                <div className="flex items-center gap-3">
                                    <input type="number" value={formData.taxPercent} onChange={e => { const val = e.target.value; setFormData(prev => ({...prev, taxPercent: val})); }} className="w-20 h-8 px-2 bg-slate-50 border border-slate-200 rounded text-right font-bold outline-none focus:border-blue-400 focus:bg-white transition-all" />
                                    <span className="w-24 text-right tabular-nums text-slate-600 font-mono">+ {totals.taxAmt.toFixed(2)}</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-[13px] font-bold text-slate-500 uppercase tracking-widest">
                                <span>Adjustment</span>
                                <div className="flex items-center gap-3">
                                    <input type="number" value={formData.adjustment} onChange={e => { const val = e.target.value; setFormData(prev => ({...prev, adjustment: val})); }} className="w-20 h-8 px-2 bg-slate-50 border border-slate-200 rounded text-right font-bold outline-none focus:border-blue-400 focus:bg-white transition-all" />
                                    <span className="w-24 text-right tabular-nums text-slate-600 font-mono">{parseFloat(formData.adjustment || 0) >= 0 ? '+' : ''}{parseFloat(formData.adjustment || 0).toFixed(2)}</span>
                                </div>
                            </div>
                            <div className="pt-6 border-t border-slate-200 flex justify-between items-center bg-slate-50 -mx-8 px-8 py-4 mt-6 rounded-lg">
                                <span className="text-[14px] font-bold text-slate-500 uppercase tracking-widest">Total Amount</span>
                                <span className="text-[24px] font-bold text-[#1e61f0] tracking-tighter font-mono">{getCurrencyDisplay(customers.find(c => c.name === formData.customerName)?.currency)} {totals.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
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
                            <Zap size={14} className="text-blue-500" />
                            Automated Dispatch Active
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => navigate('/recurring-invoices')}
                            className="px-6 py-2 text-slate-500 text-[13px] font-bold hover:text-slate-900 transition-all uppercase tracking-widest"
                        >
                            Discard
                        </button>
                        <button 
                            onClick={() => handleSave()}
                            disabled={saving}
                            className="px-8 py-2.5 bg-[#1e61f0] text-white rounded font-bold text-[13px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
                        >
                            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            {saving ? 'Processing...' : (editId ? 'Update Subscription' : 'Initialize Subscription')}
                        </button>
                    </div>
            </footer>
        </div>
    );
};

class DetailErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="p-20 text-center flex flex-col items-center justify-center">
                    <div className="text-red-500 mb-4"><AlertTriangle size={48} /></div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Rendering Error</h2>
                    <p className="text-slate-500 font-mono text-sm max-w-lg bg-slate-100 p-4 rounded">{this.state.error?.message}</p>
                </div>
            );
        }
        return this.props.children;
    }
}

const RecurringInvoiceDetailContent = ({ id, navigate, companyId, onRefresh }) => {
    const { addNotification } = useNotificationStore();
    const [template, setTemplate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Overview');
    const [customerLedger, setCustomerLedger] = useState(null);
    const [childInvoices, setChildInvoices] = useState([]);
    const [unpaidTotal, setUnpaidTotal] = useState(0);
    const [activityLogs, setActivityLogs] = useState([]);
    const [showMoreDropdown, setShowMoreDropdown] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const moreRef = useRef(null);

    const fetchTemplateData = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const res = await recurringInvoiceAPI.getById(id);
            const tpl = res.data;
            setTemplate(tpl);
            try {
                const childRes = await recurringInvoiceAPI.getChildInvoices(id, companyId);
                setChildInvoices(childRes.data.invoices || []);
                setUnpaidTotal(childRes.data.unpaidTotal || 0);
            } catch (e) { console.warn('Could not fetch child invoices', e); }
            if (tpl?.customerName && companyId) {
                try {
                    const { ledgerAPI } = await import('../../services/api');
                    const ledRes = await ledgerAPI.getByCompany(companyId);
                    const ledger = (ledRes.data || []).find(l => l.name === tpl.customerName);
                    setCustomerLedger(ledger || null);
                } catch (e) { console.warn('Could not fetch customer ledger', e); }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTemplateData(); }, [id]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (moreRef.current && !moreRef.current.contains(e.target)) setShowMoreDropdown(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (activeTab !== 'Recent Activities' || !id) return;
        recurringInvoiceAPI.getHistory(id)
            .then(res => setActivityLogs(res.data || []))
            .catch(e => console.warn('Could not fetch history', e));
    }, [activeTab, id]);

    const handleCreateInvoice = async () => {
        if (actionLoading) return;
        setActionLoading(true);
        try {
            await recurringInvoiceAPI.createManualInvoice(id, { CompanyId: companyId });
            addNotification('Invoice created successfully as Draft', 'success');
            await fetchTemplateData();
        } catch (err) {
            addNotification('Failed to create invoice: ' + (err.response?.data?.error || err.message), 'error');
        } finally { setActionLoading(false); }
    };

    const handleStatusChange = async (newStatus) => {
        setShowMoreDropdown(false);
        if (actionLoading) return;
        setActionLoading(true);
        try {
            await recurringInvoiceAPI.update(id, { status: newStatus, CompanyId: companyId });
            addNotification(`Subscription ${newStatus === 'Active' ? 'resumed' : 'paused'}`, 'success');
            await fetchTemplateData();
            if (onRefresh) onRefresh();
        } catch (err) {
            addNotification('Failed to update status: ' + (err.response?.data?.error || err.message), 'error');
        } finally { setActionLoading(false); }
    };

    const handleDelete = async () => {
        setShowMoreDropdown(false);
        if (!window.confirm('Are you sure you want to delete this recurring subscription? This cannot be undone.')) return;
        setActionLoading(true);
        try {
            await recurringInvoiceAPI.delete(id);
            addNotification('Subscription deleted', 'success');
            navigate('/recurring-invoices');
            if (onRefresh) onRefresh();
        } catch (err) {
            addNotification('Failed to delete: ' + (err.response?.data?.error || err.message), 'error');
        } finally { setActionLoading(false); }
    };

    if (loading) return <div className="p-20 text-center font-bold text-slate-300 animate-pulse uppercase tracking-widest">Syncing Automation...</div>;
    if (!template) return <div className="p-20 text-center text-slate-300 font-bold text-2xl opacity-20 uppercase">Not Found</div>;

    const safeDate = template.nextGenerationDate ? new Date(template.nextGenerationDate).toLocaleDateString('en-GB') : '—';
    const startDate = template.startDate ? new Date(template.startDate).toLocaleDateString('en-GB') : '—';
    const endDate = template.endDate ? new Date(template.endDate).toLocaleDateString('en-GB') : 'Never Expires';
    const safeTotal = parseFloat(template.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });
    
    // Status Badge Color Logic
    const status = template.status || 'Active';
    const isExpired = status === 'Expired';
    const statusBg = isExpired ? 'bg-red-500' : 'bg-[#22c55e]';

    return (
        <div className="flex-1 flex flex-col h-full bg-white animate-fade-in shadow-inner overflow-hidden font-sans">
            {/* Header */}
            <div className="bg-[#fcfdfe] px-6 pt-5 pb-0 flex flex-col no-print border-b border-slate-200">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-[20px] font-medium text-slate-800 tracking-tight">{template.templateName || 'Unnamed Profile'}</h2>
                    <div className="flex items-center gap-2">
                        <button onClick={() => navigate(`/recurring-invoices/edit/${template.id}`)} className="p-1.5 border border-slate-300 rounded hover:bg-slate-50 transition-colors text-slate-600"><Edit2 size={15}/></button>
                        <button
                            onClick={handleCreateInvoice}
                            disabled={actionLoading}
                            className="px-3 py-1.5 border border-slate-300 rounded hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700 transition-colors text-slate-800 text-[13px] font-medium flex items-center gap-1.5 disabled:opacity-50"
                        >
                            {actionLoading ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />}
                            Create Invoice
                        </button>
                        <div className="relative" ref={moreRef}>
                            <button
                                onClick={() => setShowMoreDropdown(v => !v)}
                                className="px-3 py-1.5 border border-slate-300 rounded hover:bg-slate-50 transition-colors text-slate-800 text-[13px] font-medium flex items-center gap-1"
                            >
                                More <ChevronDown size={14}/>
                            </button>
                            {showMoreDropdown && (
                                <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-[200] w-48 overflow-hidden">
                                    {template.status === 'Active' ? (
                                        <button
                                            onClick={() => handleStatusChange('Paused')}
                                            className="w-full px-4 py-2.5 text-left text-[13px] font-medium text-slate-700 hover:bg-amber-50 hover:text-amber-700 flex items-center gap-2 transition-colors"
                                        >
                                            <Pause size={14}/> Pause Subscription
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleStatusChange('Active')}
                                            className="w-full px-4 py-2.5 text-left text-[13px] font-medium text-slate-700 hover:bg-green-50 hover:text-green-700 flex items-center gap-2 transition-colors"
                                        >
                                            <Play size={14}/> Resume Subscription
                                        </button>
                                    )}
                                    <div className="border-t border-slate-100" />
                                    <button
                                        onClick={handleDelete}
                                        className="w-full px-4 py-2.5 text-left text-[13px] font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                                    >
                                        <Trash2 size={14}/> Delete Subscription
                                    </button>
                                </div>
                            )}
                        </div>
                        <button onClick={() => navigate('/recurring-invoices')} className="ml-2 p-1 text-slate-400 hover:text-slate-800 transition-colors"><X size={20}/></button>
                    </div>
                </div>
                
                {/* Tabs */}
                <div className="flex items-center gap-6 text-[13px] font-medium text-slate-600">
                    {['Overview', 'Next Invoice', 'Recent Activities'].map(tab => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-3 border-b-2 transition-colors ${activeTab === tab ? 'border-blue-600 text-slate-900 font-semibold' : 'border-transparent hover:text-slate-800'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Document Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
                {activeTab === 'Overview' && (
                    <div className="flex h-full">
                        {/* Left Column - Details */}
                        <div className="w-[45%] border-r border-slate-200 p-6 flex flex-col gap-8">
                            
                            {/* Customer Card */}
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-slate-200 rounded-md flex items-center justify-center text-white shrink-0">
                                    <User size={28} className="text-white drop-shadow-sm" />
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[14px] font-medium text-blue-600 cursor-pointer hover:underline">{template.customerName || 'Unknown Customer'}</span>
                                    <span className="text-[12px] text-slate-500 font-medium">{customerLedger?.email || 'No email on file'}</span>
                                    <span className="text-[12px] text-slate-500 font-medium flex items-center gap-1 mt-0.5"><Phone size={10}/> {customerLedger?.workPhone || customerLedger?.mobile || 'No phone on file'}</span>
                                </div>
                            </div>

                            {/* DETAILS Section */}
                            <div>
                                <h3 className="text-[12px] font-semibold text-slate-500 tracking-wider mb-4 uppercase">Details</h3>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-[160px_1fr] items-center text-[13px]">
                                        <span className="text-slate-500">Profile Status:</span>
                                        <span className={`px-2 py-0.5 ${statusBg} text-white text-[10px] font-bold uppercase tracking-widest rounded-sm w-max`}>{status}</span>
                                    </div>
                                    <div className="grid grid-cols-[160px_1fr] items-center text-[13px]">
                                        <span className="text-slate-500">Start Date:</span>
                                        <span className="text-slate-800 font-medium">{startDate}</span>
                                    </div>
                                    <div className="grid grid-cols-[160px_1fr] items-center text-[13px]">
                                        <span className="text-slate-500">End Date:</span>
                                        <span className="text-slate-800 font-medium">{endDate}</span>
                                    </div>
                                    <div className="grid grid-cols-[160px_1fr] items-center text-[13px]">
                                        <span className="text-slate-500">Payment Terms:</span>
                                        <span className="text-slate-800 font-medium">{template.terms || 'Due on Receipt'}</span>
                                    </div>
                                    <div className="grid grid-cols-[160px_1fr] items-center text-[13px]">
                                        <span className="text-slate-500">Manually Created Invoices:</span>
                                        <span className="text-slate-800 font-medium">{childInvoices.filter(inv => inv.invoiceNumber?.includes('-MAN-')).length}</span>
                                    </div>
                                </div>
                                
                                <div className="mt-5 bg-slate-50 border border-slate-100 rounded-lg p-3 flex items-start gap-2">
                                    <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
                                    <p className="text-[12px] text-slate-700 leading-relaxed font-medium">
                                        Recurring Invoice preference has been set to <span className="font-bold">"Create Invoices as Drafts"</span>
                                    </p>
                                </div>
                            </div>

                            {/* ADDRESS Section */}
                            <div>
                                <h3 className="text-[12px] font-semibold text-slate-500 tracking-wider mb-4 uppercase">Address</h3>
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="text-[13px] text-slate-800 font-medium mb-1">Billing Address</h4>
                                        <p className="text-[13px] text-slate-500 leading-tight whitespace-pre-line">{formatAddress(customerLedger?.billingAddress || customerLedger?.address) || 'No address provided.'}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-[13px] text-slate-800 font-medium mb-1">Shipping Address</h4>
                                        <p className="text-[13px] text-slate-500 leading-tight whitespace-pre-line">{formatAddress(customerLedger?.shippingAddress) || 'No address provided.'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* CUSTOMER NOTES Section */}
                            <div>
                                <h3 className="text-[12px] font-semibold text-slate-500 tracking-wider mb-3 uppercase">Customer Notes</h3>
                                <p className="text-[13px] text-slate-800 font-medium">{template.notes || 'Thanks for your business.'}</p>
                            </div>
                        </div>

                        {/* Right Column - Stats & Child Invoices */}
                        <div className="w-[55%] p-6 bg-white flex flex-col">
                            {/* Top Stats Bar */}
                            <div className="grid grid-cols-3 border-b border-slate-200 pb-6 mb-6">
                                <div className="text-center border-r border-slate-100 px-2">
                                    <p className="text-[12px] text-slate-500 mb-1 font-medium">Invoice Amount</p>
                                    <p className="text-[14px] font-medium text-slate-900">{getCurrencyDisplay(template.Customer?.currency)} {safeTotal}</p>
                                </div>
                                <div className="text-center border-r border-slate-100 px-2">
                                    <p className="text-[12px] text-slate-500 mb-1 font-medium">Next Invoice Date</p>
                                    <p className="text-[14px] font-medium text-blue-600 cursor-pointer hover:underline">{safeDate}</p>
                                </div>
                                <div className="text-center px-2">
                                    <p className="text-[12px] text-slate-500 mb-1 font-medium">Recurring Period</p>
                                    <p className="text-[14px] font-medium text-slate-900">{template.frequency || 'Monthly'}</p>
                                </div>
                            </div>

                            {/* Child Invoices List */}
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-4">
                                    <button className="flex items-center gap-1 text-[15px] font-medium text-slate-800 hover:text-blue-600 transition-colors">
                                        All Child Invoices <ChevronDown size={16} className="text-blue-600" />
                                    </button>
                                    <span className="text-[13px] text-slate-500 font-medium">Unpaid Invoices : <span className="text-slate-900 font-semibold">{getCurrencyDisplay(customerLedger?.currency)} {parseFloat(unpaidTotal).toLocaleString(undefined, {minimumFractionDigits: 2})}</span></span>
                                </div>

                                <div className="space-y-2 mt-4">
                                    {childInvoices.length === 0 ? (
                                        <div className="py-8 text-center text-slate-400 text-[13px] font-medium italic">
                                            No invoices generated yet. Click "Create Invoice" to generate one.
                                        </div>
                                    ) : (
                                        childInvoices.map(inv => (
                                            <div key={inv.id} className="p-4 border-b border-slate-100 flex justify-between items-center group hover:bg-slate-50 transition-colors">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[13px] font-medium text-slate-800">{template.customerName}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[13px] text-blue-600 hover:underline cursor-pointer font-medium" onClick={() => navigate(`/invoices/${inv.id}`)}>{inv.invoiceNumber}</span>
                                                        <span className="text-[13px] text-slate-500">{inv.date ? new Date(inv.date).toLocaleDateString('en-GB') : '—'}</span>
                                                    </div>
                                                    <span className="text-[11px] text-slate-500 flex items-center gap-1 italic"><Clock size={10}/> {inv.invoiceNumber?.includes('-MAN-') ? 'Manually Created' : 'Auto-Generated'}</span>
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className="text-[13px] font-medium text-slate-900">{getCurrencyDisplay(customerLedger?.currency)} {parseFloat(inv.totalAmount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                                                    <span className={`text-[10px] font-semibold tracking-widest uppercase ${inv.status === 'Paid' ? 'text-emerald-600' : inv.status === 'Draft' ? 'text-slate-500' : inv.status === 'Confirmed' ? 'text-blue-600' : 'text-amber-600'}`}>{inv.status}</span>
                                                    {inv.status !== 'Paid' && (
                                                        <button onClick={() => navigate(`/invoices/${inv.id}`)} className="px-3 py-1 bg-blue-500 text-white text-[12px] font-medium rounded hover:bg-blue-600 transition-colors mt-1 shadow-sm">
                                                            Record Payment
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {activeTab === 'Next Invoice' && (
                    <div className="p-8 space-y-6">
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 flex items-start gap-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                                <Calendar size={18} className="text-blue-600" />
                            </div>
                            <div>
                                <p className="text-[13px] font-bold text-slate-800 mb-1">Next Invoice Scheduled</p>
                                <p className="text-[24px] font-black text-blue-600 tracking-tight">{safeDate}</p>
                                <p className="text-[12px] text-slate-500 mt-1 font-medium">Repeats {template.frequency} — {template.status === 'Active' ? 'Auto-generation is active' : `Status: ${template.status}`}</p>
                            </div>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-xl p-6">
                            <h3 className="text-[13px] font-bold text-slate-700 uppercase tracking-widest mb-4">Preview of Next Invoice</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between text-[13px]">
                                    <span className="text-slate-500">Customer</span>
                                    <span className="font-medium text-slate-800">{template.customerName}</span>
                                </div>
                                <div className="flex justify-between text-[13px]">
                                    <span className="text-slate-500">Invoice Date</span>
                                    <span className="font-medium text-slate-800">{safeDate}</span>
                                </div>
                                <div className="flex justify-between text-[13px]">
                                    <span className="text-slate-500">Frequency</span>
                                    <span className="font-medium text-slate-800">{template.frequency}</span>
                                </div>
                                <div className="border-t border-slate-100 my-3" />
                                <div className="flex justify-between text-[14px] font-bold">
                                    <span className="text-slate-700">Total Amount</span>
                                    <span className="text-[#1e61f0]">{getCurrencyDisplay(customerLedger?.currency)} {safeTotal}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'Recent Activities' && (
                    <div className="p-8">
                        {activityLogs.length === 0 ? (
                            <div className="py-16 text-center text-slate-400 text-[13px] font-medium italic">
                                No activity recorded yet.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {activityLogs.map((log, idx) => (
                                    <div key={log.id || idx} className="flex gap-4 items-start">
                                        <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 shrink-0" />
                                        <div className="flex-1 border-b border-slate-50 pb-3">
                                            <div className="flex justify-between items-start">
                                                <p className="text-[13px] font-bold text-slate-800">{log.action?.replace(/_/g, ' ')}</p>
                                                <span className="text-[11px] text-slate-400 font-medium">{new Date(log.createdAt).toLocaleString('en-GB')}</span>
                                            </div>
                                            {log.User && (
                                                <p className="text-[11px] text-slate-500 mt-0.5">by {log.User.name || log.User.email}</p>
                                            )}
                                            {log.newData?.message && (
                                                <p className="text-[12px] text-slate-500 mt-1 italic">{typeof log.newData === 'string' ? JSON.parse(log.newData)?.message : log.newData?.message}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const RecurringInvoiceDetail = (props) => (
    <DetailErrorBoundary>
        <RecurringInvoiceDetailContent {...props} />
    </DetailErrorBoundary>
);

// ─────────────────────────────────────────────────────────────────────────────
// RECURRING INVOICES TABLE VIEW (LANDSCAPE)
// ─────────────────────────────────────────────────────────────────────────────
const RecurringInvoicesTableView = ({ templates, loading, onSelect, navigate, fetchTemplates }) => {
    const { addNotification } = useNotificationStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [showFilter, setShowFilter] = useState(false);
    const filterRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (filterRef.current && !filterRef.current.contains(e.target)) setShowFilter(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filtered = templates.filter(t => {
        const matchesSearch = t.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.templateName?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleExportCSV = () => {
        const headers = ['Profile Name', 'Customer', 'Frequency', 'Status', 'Next Invoice', 'Amount'];
        const rows = filtered.map(t => [
            t.templateName || '',
            t.customerName || '',
            t.frequency || '',
            t.status || '',
            t.nextGenerationDate ? new Date(t.nextGenerationDate).toLocaleDateString('en-GB') : '—',
            parseFloat(t.totalAmount || 0).toFixed(2)
        ]);
        const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `recurring_invoices_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-white animate-fade-in overflow-hidden">
            {/* HEADER */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 bg-white">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 group cursor-pointer">
                        <h1 className="text-[20px] font-bold text-slate-900 tracking-tight">Recurring Invoices</h1>
                        <ChevronDown size={18} className="text-blue-600 mt-1" />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                   <button 
                      onClick={() => navigate('/recurring-invoices/new')}
                      className="bg-[#1e61f0] hover:bg-[#1a54d1] text-white px-5 py-2.5 rounded-lg font-bold text-[13px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-blue-200 active:scale-95"
                   >
                      <Plus size={16} strokeWidth={3}/> New Profile
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
                            placeholder="Search by profile or customer..."
                            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] font-medium text-slate-700 outline-none focus:border-[#1e61f0] focus:ring-4 focus:ring-blue-50 shadow-sm transition-all"
                        />
                    </div>
                    <button 
                        onClick={fetchTemplates}
                        className="p-2.5 text-slate-400 hover:text-[#1e61f0] hover:bg-white rounded-lg border border-transparent hover:border-slate-100 transition-all"
                        title="Refresh"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative" ref={filterRef}>
                        <button
                            onClick={() => setShowFilter(v => !v)}
                            className={`flex items-center gap-2 text-[13px] font-bold transition-colors uppercase tracking-widest ${statusFilter !== 'All' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'}`}
                        >
                            <Filter size={14} /> Filter {statusFilter !== 'All' ? `(${statusFilter})` : ''}
                        </button>
                        {showFilter && (
                            <div className="absolute right-0 top-full mt-2 bg-white border border-slate-200 rounded-lg shadow-xl z-50 w-44 overflow-hidden">
                                {['All', 'Active', 'Paused', 'Expired'].map(s => (
                                    <button
                                        key={s}
                                        onClick={() => { setStatusFilter(s); setShowFilter(false); }}
                                        className={`w-full px-4 py-2.5 text-left text-[13px] font-medium transition-colors ${statusFilter === s ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-50'}`}
                                    >{s}</button>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="w-px h-4 bg-slate-200 mx-2" />
                    <button
                        onClick={handleExportCSV}
                        className="h-10 px-5 flex items-center gap-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-[11px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <Download size={14} /> Export CSV
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-8">
                {loading ? (
                    <div className="py-24 text-center space-y-4">
                        <Loader2 size={32} className="animate-spin text-blue-500 mx-auto" />
                        <p className="text-[12px] font-bold text-slate-400 uppercase tracking-[0.2em] animate-pulse">Syncing Automations...</p>
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-[0.15em] border-b border-slate-200 sticky top-0 z-10">
                                <th className="px-6 py-4 rounded-tl-xl">Profile Name</th>
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4">Frequency</th>
                                <th className="px-6 py-4">Last Invoice</th>
                                <th className="px-6 py-4">Next Invoice</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-right">Amount</th>
                                <th className="px-6 py-4 text-center rounded-tr-xl">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="py-32 text-center">
                                       <div className="flex flex-col items-center justify-center gap-4">
                                          <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200">
                                             <RefreshCw size={32} />
                                          </div>
                                          <div className="space-y-1">
                                            <p className="text-slate-900 text-[16px] font-bold">No recurring invoices found</p>
                                            <p className="text-slate-400 text-[13px] font-medium">Create a profile to automate your billing cycle.</p>
                                          </div>
                                          <button onClick={() => navigate('/recurring-invoices/new')} className="text-blue-600 text-[13px] font-bold hover:underline mt-2">Create an automation profile</button>
                                       </div>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(t => (
                                    <tr 
                                        key={t.id} 
                                        onClick={() => onSelect(t.id)}
                                        className="hover:bg-blue-50/30 cursor-pointer group transition-all"
                                    >
                                        <td className="px-6 py-5">
                                            <div className="text-[14px] font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                                {t.templateName}
                                            </div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">ID: {t.id}</div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="text-[14px] font-medium text-slate-800">{t.customerName}</div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                <Repeat size={14} className="text-slate-400" />
                                                <span className="text-[13px] font-bold text-slate-600">{t.frequency}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-[13px] text-slate-500 font-medium">
                                            {t.lastGenerationDate ? new Date(t.lastGenerationDate).toLocaleDateString('en-GB') : '—'}
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-[13px] text-blue-600 font-bold">{t.nextGenerationDate ? new Date(t.nextGenerationDate).toLocaleDateString('en-GB') : '—'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className={`px-2.5 py-1 rounded-full uppercase text-[9px] font-black tracking-widest border
                                                ${t.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                                                {t.status || 'Active'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-right whitespace-nowrap">
                                            <span className="text-[15px] text-slate-900 font-black tracking-tight">
                                                {getCurrencyDisplay(t.Customer?.currency)} {parseFloat(t.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center justify-center gap-2">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); navigate(`/recurring-invoices/edit/${t.id}`); }} 
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all shadow-sm border border-transparent hover:border-slate-100"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (!window.confirm('Delete this recurring subscription?')) return;
                                                        recurringInvoiceAPI.delete(t.id)
                                                            .then(() => { addNotification('Subscription deleted', 'success'); fetchTemplates(); })
                                                            .catch(err => addNotification('Delete failed: ' + (err.response?.data?.error || err.message), 'error'));
                                                    }}
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
// RECURRING INVOICES LIST (SIDEBAR)
// ─────────────────────────────────────────────────────────────────────────────
const RecurringInvoicesList = ({ templates, loading, selectedId, onSelect, navigate, fetchTemplates }) => {
    const [searchTerm, setSearchTerm] = useState('');
    
    const filtered = templates.filter(t => 
        t.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.templateName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full bg-white border-r border-slate-100 w-[400px] shrink-0 no-print animate-fade-in-left">
            <div className="p-6 border-b border-slate-50 space-y-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-[17px] font-bold text-slate-900 tracking-tight">Recurring</h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-0.5">Automations</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => navigate('/recurring-invoices/new')}
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
                        placeholder="Search profiles..."
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
                    <div className="p-12 text-center opacity-30 italic text-[12px] font-bold uppercase tracking-widest text-slate-400">Empty Hub</div>
                ) : (
                    <div className="space-y-1 px-3">
                        {filtered.map(t => {
                            const isSelected = String(t.id) === String(selectedId);
                            return (
                                <div 
                                    key={t.id}
                                    onClick={() => onSelect(t.id)}
                                    className={`p-5 cursor-pointer rounded-2xl transition-all flex flex-col gap-2 relative overflow-hidden group
                                        ${isSelected ? 'bg-blue-600 text-white shadow-xl shadow-blue-200 -translate-y-0.5' : 'hover:bg-slate-50 text-slate-600'}`}
                                >
                                    <div className="flex justify-between items-start relative z-10">
                                        <div className={`text-[14px] font-bold tracking-tight leading-tight ${isSelected ? 'text-white' : 'text-slate-900 group-hover:text-blue-600'}`}>
                                            {t.customerName}
                                        </div>
                                        <div className={`text-[15px] font-black italic tracking-tighter ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                                            {getCurrencyDisplay(t.Customer?.currency)} {parseFloat(t.totalAmount || 0).toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center relative z-10">
                                        <span className={`text-[10px] font-bold uppercase tracking-widest ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                                            {t.templateName} | {t.frequency}
                                        </span>
                                    </div>
                                    {isSelected && <div className="absolute top-0 right-0 p-3 opacity-20"><RefreshCw size={48} strokeWidth={1} /></div>}
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
const RecurringInvoicesView = () => {
    const navigate = useNavigate();
    const params = useParams();
    const location = useLocation();
    const companyId = sessionStorage.getItem('companyId');
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const res = await recurringInvoiceAPI.getByCompany(companyId);
            setTemplates(res.data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { if (companyId) fetchTemplates(); }, [companyId, location.pathname]);

    const selectedId = params.id;

    if (location.pathname === '/recurring-invoices/new' || location.pathname.includes('/edit/')) {
        return <RecurringInvoiceForm companyId={companyId} navigate={navigate} editId={selectedId} />;
    }

    // IF NO ID: SHOW LANDSCAPE TABLE VIEW
    if (!selectedId) {
        return (
            <div className="flex h-screen bg-[#f8fafc] overflow-hidden">
                <RecurringInvoicesTableView 
                    templates={templates} 
                    loading={loading} 
                    onSelect={(id) => navigate(`/recurring-invoices/view/${id}`)}
                    navigate={navigate}
                    fetchTemplates={fetchTemplates}
                />
            </div>
        );
    }

    // IF ID PRESENT: SHOW SPLIT VIEW
    return (
        <div className="flex h-screen bg-[#f8fafc] overflow-hidden animate-fade-in relative">
            <RecurringInvoicesList 
                templates={templates} 
                loading={loading} 
                selectedId={selectedId} 
                onSelect={(id) => navigate(`/recurring-invoices/view/${id}`)}
                navigate={navigate}
                fetchTemplates={fetchTemplates}
            />
            <div className="flex-1 h-full overflow-hidden flex flex-col bg-slate-50">
                <RecurringInvoiceDetail 
                    id={selectedId} 
                    navigate={navigate} 
                    companyId={companyId} 
                    onRefresh={fetchTemplates}
                />
            </div>
        </div>
    );
};

export default RecurringInvoicesView;
