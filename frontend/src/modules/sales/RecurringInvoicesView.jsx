import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { recurringInvoiceAPI, ledgerAPI, inventoryAPI, priceListAPI } from '../../services/api';
import { 
  Plus, Calendar, RefreshCw, MoreHorizontal, Edit2, Trash2, 
  Settings, CheckCircle2, AlertCircle, Clock, ArrowRight,
  Package, User, Search, X, ChevronRight, FileText,
  Filter, Download, ArrowLeft, Loader2, Save, Send,
  Trash, Info, HelpCircle, Tag, Paperclip, ChevronDown, Check,
  AlertTriangle, Play, Pause, Square, File
} from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';
import useNotificationStore from '../../store/notificationStore';

// ─────────────────────────────────────────────────────────────────────────────
// RECURRING INVOICE FORM (ZOHO STYLE)
// ─────────────────────────────────────────────────────────────────────────────

const RecurringInvoiceForm = ({ companyId, navigate, editId }) => {
    const { addNotification } = useNotificationStore();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    
    // Core Data
    const [customers, setCustomers] = useState([]);
    const [items, setItems] = useState([]);
    
    // Form State
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
        taxPercent: 18, // Default 18% GST
        customerNotes: 'Thanks for your business.',
        termsConditions: ''
    });

    const [lineItems, setLineItems] = useState([
        { id: Date.now(), itemId: '', name: '', description: '', quantity: 1, rate: 0, amount: 0 }
    ]);

    // Initialize
    useEffect(() => {
        if (!companyId) return;
        setLoading(true);
        Promise.all([
            ledgerAPI.getByCompany(companyId),
            inventoryAPI.getByCompany(companyId)
        ]).then(([ledgersRes, itemsRes]) => {
            const allLedgers = ledgersRes.data || [];
            setCustomers(allLedgers.filter(l => {
                const g = l.Group?.name || '';
                return g.toLowerCase().includes('debtor') || g.toLowerCase().includes('customer');
            }));
            setItems(itemsRes.data || []);
        }).finally(() => setLoading(false));

        if (editId) {
            recurringInvoiceAPI.getByCompany(companyId).then(res => {
                const template = res.data.find(t => t.id === editId);
                if (template) {
                    setFormData({
                        ...template,
                        startDate: new Date(template.startDate).toISOString().split('T')[0],
                        endDate: template.endDate ? new Date(template.endDate).toISOString().split('T')[0] : '',
                        taxPercent: template.taxAmount ? Math.round((template.taxAmount / (template.subTotal - (template.subTotal * template.discount/100))) * 100) : 18
                    });
                    setLineItems(JSON.parse(template.itemsJson || '[]'));
                }
            });
        }
    }, [companyId, editId]);

    // Calculations
    const totals = useMemo(() => {
        const subTotal = lineItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        const discountAmt = subTotal * (parseFloat(formData.discount || 0) / 100);
        const beforeTax = subTotal - discountAmt;
        const taxAmt = beforeTax * (parseFloat(formData.taxPercent || 0) / 100);
        const total = beforeTax + taxAmt + parseFloat(formData.adjustment || 0);
        return { subTotal, discountAmt, taxAmt, total };
    }, [lineItems, formData.discount, formData.taxPercent, formData.adjustment]);

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

    const handleSave = async () => {
        if (!formData.templateName || !formData.customerName || lineItems.every(li => !li.itemId)) {
            addNotification('Please fill in Template Name, Customer and add at least one item.', 'error');
            return;
        }
        
        setSaving(true);
        try {
            // Zoho Style Mapping: Ensure we only send what the backend expects
            // and handle empty date strings which crash PostgreSQL
            const payload = {
                templateName: formData.templateName,
                customerName: formData.customerName,
                frequency: formData.frequency,
                startDate: formData.startDate,
                endDate: formData.endDate === '' ? null : formData.endDate, // Fix: Send null if empty
                status: formData.status,
                autoSend: formData.autoSend,
                invoiceType: formData.invoiceType,
                discount: parseFloat(formData.discount || 0),
                subTotal: totals.subTotal,
                taxAmount: totals.taxAmt,
                totalAmount: totals.total,
                itemsJson: JSON.stringify(lineItems),
                CompanyId: companyId,
                nextGenerationDate: formData.startDate 
            };

            if (editId) {
                await recurringInvoiceAPI.update(editId, payload);
                addNotification('Automation template updated successfully', 'success');
            } else {
                await recurringInvoiceAPI.create(payload);
                addNotification('Automation template created successfully', 'success');
            }
            navigate('/recurring-invoices');
        } catch (err) {
            console.error('Save Error Details:', err.response?.data || err.message);
            addNotification(err.response?.data?.error || 'Failed to save automation template', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-20 text-center font-bold text-slate-400">Loading Automation Interface...</div>;

    return (
        <div className="min-h-screen bg-white text-slate-700 font-sans p-10 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-10">
                <button onClick={() => navigate('/recurring-invoices')} className="text-slate-400 hover:text-slate-600"><ArrowLeft size={24} /></button>
                <h1 className="text-2xl font-semibold text-slate-900">{editId ? 'Edit Recurring Invoice' : 'New Recurring Invoice'}</h1>
            </div>

            <div className="space-y-8">
                {/* Main Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-6 border-b border-slate-100 pb-10">
                    <div className="space-y-6">
                        <div className="flex items-start gap-4">
                            <label className="w-32 text-sm text-rose-500 font-medium pt-2">Customer Name*</label>
                            <div className="flex-1 flex gap-2">
                                <select 
                                    value={formData.customerName} 
                                    onChange={e => {
                                        if (e.target.value === 'NEW_CUSTOMER') {
                                            navigate('/customers/new');
                                        } else {
                                            setFormData({...formData, customerName: e.target.value});
                                        }
                                    }}
                                    className="flex-1 p-2 border border-slate-200 rounded text-sm focus:border-blue-500 outline-none"
                                >
                                    <option value="">Select or add a customer</option>
                                    <option value="NEW_CUSTOMER" className="text-blue-600 font-bold">➕ Add New Customer</option>
                                    {customers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                </select>
                                <button className="p-2 bg-blue-600 text-white rounded"><Search size={16}/></button>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <label className="w-32 text-sm text-rose-500 font-medium">Profile Name*</label>
                            <input 
                                type="text"
                                value={formData.templateName} 
                                onChange={e => setFormData({...formData, templateName: e.target.value})}
                                placeholder="e.g., Monthly Service Retainer"
                                className="flex-1 p-2 border border-slate-200 rounded text-sm outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <label className="w-32 text-sm text-rose-500 font-medium">Repeat Every*</label>
                            <select 
                                value={formData.frequency}
                                onChange={e => setFormData({...formData, frequency: e.target.value})}
                                className="flex-1 p-2 border border-slate-200 rounded text-sm outline-none focus:border-blue-500"
                            >
                                <option>Daily</option>
                                <option>Weekly</option>
                                <option>Monthly</option>
                                <option>Yearly</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-4">
                            <label className="w-32 text-sm text-rose-500 font-medium">Start Date*</label>
                            <input 
                                type="date"
                                value={formData.startDate}
                                onChange={e => setFormData({...formData, startDate: e.target.value})}
                                className="flex-1 p-2 border border-slate-200 rounded text-sm outline-none focus:border-blue-500"
                            />
                        </div>

                        <div className="flex items-center gap-4">
                            <label className="w-32 text-sm text-slate-500">Ends On</label>
                            <div className="flex-1 flex items-center gap-4">
                                <input 
                                    type="date"
                                    value={formData.endDate}
                                    onChange={e => setFormData({...formData, endDate: e.target.value})}
                                    disabled={!formData.endDate && formData.endDate !== ''}
                                    className="flex-1 p-2 border border-slate-200 rounded text-sm outline-none focus:border-blue-500 disabled:bg-slate-50"
                                />
                                <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-500">
                                    <input type="checkbox" checked={!formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.checked ? '' : new Date().toISOString().split('T')[0]})} className="w-4 h-4 rounded border-slate-200" />
                                    Never Expires
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Item Table */}
                <div className="mt-10">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase border-y border-slate-200">
                                <th className="px-4 py-3 text-left">Item Details</th>
                                <th className="px-4 py-3 text-right w-28">Quantity</th>
                                <th className="px-4 py-3 text-right w-36">Rate</th>
                                <th className="px-4 py-3 text-right w-40">Amount</th>
                                <th className="px-4 py-3 w-12"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {lineItems.map(line => (
                                <tr key={line.id} className="border-b border-slate-100 group">
                                    <td className="px-4 py-4">
                                        <div className="relative group">
                                            <select 
                                                value={line.itemId} 
                                                onChange={e => handleItemSelect(line.id, e.target.value)}
                                                className="w-full p-2 border border-transparent hover:border-slate-200 border-dashed rounded text-sm outline-none bg-transparent appearance-none transition-all"
                                            >
                                                <option value="">Type or click to select an item.</option>
                                                {items.map(it => (
                                                    <option key={it.id} value={it.id}>
                                                        {it.name} (Rate: ₹{parseFloat(it.sellingPrice || 0).toLocaleString()})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <textarea 
                                            value={line.description}
                                            onChange={e => handleUpdateLine(line.id, 'description', e.target.value)}
                                            placeholder="Additional description..." 
                                            className="w-full mt-2 h-12 p-2 border border-transparent hover:border-slate-100 rounded text-xs text-slate-500 outline-none resize-none bg-transparent transition-all"
                                        />
                                    </td>
                                    <td className="px-4 py-4 text-right align-top">
                                        <input type="number" value={line.quantity} onChange={e => handleUpdateLine(line.id, 'quantity', e.target.value)} className="w-full p-2 text-right text-sm outline-none bg-transparent border border-transparent focus:border-slate-200 rounded transition-all" />
                                    </td>
                                    <td className="px-4 py-4 text-right align-top">
                                        <input type="number" value={line.rate} onChange={e => handleUpdateLine(line.id, 'rate', e.target.value)} className="w-full p-2 text-right text-sm outline-none bg-transparent border border-transparent focus:border-slate-200 rounded transition-all" />
                                    </td>
                                    <td className="px-4 py-4 text-right align-top">
                                        <div className="p-2 text-sm font-bold text-slate-900">
                                            {(parseFloat(line.amount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-center align-top">
                                        <button onClick={() => setLineItems(prev => prev.filter(p => p.id !== line.id))} className="mt-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><X size={16}/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    <div className="mt-4 flex gap-4">
                        <button onClick={() => setLineItems(prev => [...prev, { id: Date.now(), itemId: '', name: '', description: '', quantity: 1, rate: 0, amount: 0 }])} className="px-4 py-1 border border-slate-200 rounded text-xs font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-1">
                            <Plus size={14} className="text-blue-600" /> Add New Row
                        </button>
                    </div>
                </div>

                {/* Totals & Notes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-20 pt-10">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-500">Customer Notes</label>
                            <textarea value={formData.customerNotes} onChange={e => setFormData({...formData, customerNotes: e.target.value})} className="w-full p-2 border border-slate-200 rounded text-sm outline-none h-24 italic" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-500">Terms & Conditions</label>
                            <textarea value={formData.termsConditions} onChange={e => setFormData({...formData, termsConditions: e.target.value})} className="w-full p-2 border border-slate-200 rounded text-sm outline-none h-24" />
                        </div>
                    </div>

                    <div className="space-y-4 bg-slate-50/50 p-6 rounded-lg self-start">
                        <div className="flex justify-between text-sm">
                            <span>Sub Total</span>
                            <span className="font-medium">{totals.subTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <span>Discount</span>
                                <input type="number" value={formData.discount} onChange={e => setFormData({...formData, discount: e.target.value})} className="w-12 p-1 border border-slate-200 rounded text-xs text-right" />
                                <span>%</span>
                            </div>
                            <span className="font-medium text-slate-500">{totals.discountAmt.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <span>Tax (GST)</span>
                                <select 
                                    value={formData.taxPercent} 
                                    onChange={e => setFormData({...formData, taxPercent: parseFloat(e.target.value)})}
                                    className="ml-2 p-1 border border-slate-200 rounded text-xs outline-none"
                                >
                                    <option value="0">GST (0%)</option>
                                    <option value="5">GST (5%)</option>
                                    <option value="12">GST (12%)</option>
                                    <option value="18">GST (18%)</option>
                                    <option value="28">GST (28%)</option>
                                </select>
                            </div>
                            <span className="font-medium text-slate-500">{totals.taxAmt.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2 border-b border-slate-200 border-dashed">
                                <span>Adjustment</span>
                                <Info size={12} className="text-slate-400" />
                            </div>
                            <input type="number" value={formData.adjustment} onChange={e => setFormData({...formData, adjustment: e.target.value})} className="w-24 p-1 border border-slate-200 rounded text-right text-xs" />
                        </div>

                        <div className="flex justify-between text-lg font-bold text-slate-900 pt-4 border-t border-slate-200">
                            <span>Total ( ₹ ) {formData.frequency && <span className="text-[10px] text-blue-600 font-bold ml-1 uppercase">{formData.frequency} CYCLE</span>}</span>
                            <span>{totals.total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Save Footer */}
                <div className="sticky bottom-0 bg-white border-t border-slate-100 py-6 flex gap-4 mt-20">
                     <div className="flex-1 flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-600 font-medium">
                            <input type="checkbox" checked={formData.autoSend} onChange={e => setFormData({...formData, autoSend: e.target.checked})} className="w-4 h-4 text-blue-600 rounded border-slate-200" />
                            Auto-send invoices to the customer via email
                        </label>
                     </div>
                     <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="px-8 py-2.5 bg-blue-600 text-white rounded font-bold text-sm hover:bg-blue-700 transition-all shadow-sm flex items-center gap-2"
                    >
                        {saving ? <Loader2 className="animate-spin" size={18} /> : (editId ? 'Update Template' : 'Initialize Automation')}
                    </button>
                    <button onClick={() => navigate('/recurring-invoices')} className="px-8 py-2 border border-slate-200 rounded text-sm font-medium hover:bg-slate-50">Cancel</button>
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// RECURRING INVOICE DETAIL VIEW
// ─────────────────────────────────────────────────────────────────────────────
const RecurringInvoiceDetail = ({ id, companyId, navigate }) => {
    const { addNotification } = useNotificationStore();
    const [template, setTemplate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Overview');

    useEffect(() => {
        if (!id || !companyId) return;
        setLoading(true);
        recurringInvoiceAPI.getByCompany(companyId).then(res => {
            const found = res.data.find(t => t.id === id);
            setTemplate(found);
        }).finally(() => setLoading(false));
    }, [id, companyId]);

    if (loading) return <div className="p-32 text-center font-bold text-slate-300 animate-pulse uppercase tracking-[0.3em]">Loading Profile Details...</div>;
    if (!template) return <div className="p-32 text-center text-slate-400">Profile not found.</div>;

    const items = JSON.parse(template.itemsJson || '[]');

    return (
        <div className="p-8 bg-[#f8fafc] min-h-screen font-sans animate-fade-in">
            <header className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/recurring-invoices')} className="p-2 hover:bg-white rounded-xl text-slate-400 transition-all shadow-sm"><ArrowLeft size={20} /></button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{template.templateName}</h1>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{template.customerName}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => navigate(`/recurring-invoices/edit/${template.id}`)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <Edit2 size={16} /> Edit Profile
                    </button>
                    <button className="px-6 py-2.5 bg-[#1e61f0] text-white rounded-xl font-bold text-[13px] hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 uppercase tracking-widest">
                        Create Invoice Now
                    </button>
                </div>
            </header>

            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden min-h-[600px] flex flex-col">
                <div className="px-10 py-6 border-b border-slate-100 flex items-center gap-8">
                    {['Overview', 'Next Invoice', 'Recent Activities'].map(tab => (
                        <button 
                            key={tab} 
                            onClick={() => setActiveTab(tab)}
                            className={`text-[12px] font-black uppercase tracking-widest pb-2 transition-all border-b-2 ${activeTab === tab ? 'text-blue-600 border-blue-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="flex-1 p-10">
                    {activeTab === 'Overview' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
                            <div className="space-y-8">
                                <section>
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Automation Details</h3>
                                    <div className="space-y-4">
                                        {[
                                            { label: 'Profile Status', value: template.status, isStatus: true },
                                            { label: 'Start Date', value: new Date(template.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) },
                                            { label: 'End Date', value: template.endDate ? new Date(template.endDate).toLocaleDateString() : 'Never Expires' },
                                            { label: 'Repeat Cycle', value: template.frequency },
                                            { label: 'Payment Terms', value: 'Due on Receipt' }
                                        ].map(row => (
                                            <div key={row.label} className="flex justify-between items-center text-sm border-b border-slate-50 pb-3">
                                                <span className="text-slate-500 font-medium">{row.label}</span>
                                                <span className={`${row.isStatus ? (row.value === 'Active' ? 'text-emerald-500' : 'text-rose-500') : 'text-slate-900'} font-bold`}>{row.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <section>
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Billing Configuration</h3>
                                    <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                                        <div className="flex items-center gap-3 text-slate-600">
                                            <Info size={16} className="text-blue-500" />
                                            <p className="text-[13px] font-medium leading-relaxed">
                                                Invoices will be generated <span className="font-bold text-slate-900">{template.frequency}</span> starting from {new Date(template.startDate).toLocaleDateString()}. 
                                                Auto-send is {template.autoSend ? 'ENABLED' : 'DISABLED'}.
                                            </p>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            <div className="space-y-8">
                                <section className="bg-blue-600 p-8 rounded-[2rem] text-white shadow-xl shadow-blue-100">
                                    <div className="flex justify-between items-start mb-8">
                                        <div>
                                            <p className="text-[11px] font-bold uppercase tracking-widest opacity-70 mb-1">Total Recurring amount</p>
                                            <h2 className="text-3xl font-black">₹{parseFloat(template.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h2>
                                        </div>
                                        <Tag size={24} className="opacity-40" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm">
                                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">Cycle</p>
                                            <p className="text-sm font-black">{template.frequency}</p>
                                        </div>
                                        <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm">
                                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">Next Run</p>
                                            <p className="text-sm font-black">{new Date(template.nextGenerationDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Item Snapshot</h3>
                                    <div className="space-y-3">
                                        {items.map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-bold text-xs">{item.name?.charAt(0)}</div>
                                                    <div>
                                                        <p className="text-[13px] font-bold text-slate-800">{item.name}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Quantity: {item.quantity}</p>
                                                    </div>
                                                </div>
                                                <span className="text-sm font-bold text-slate-900">₹{parseFloat(item.amount || 0).toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Next Invoice' && (
                        <div className="py-10">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10 text-center">Next Scheduled Invoice Preview</h3>
                            <div className="max-w-2xl mx-auto bg-white shadow-[0_20px_60px_rgba(0,0,0,0.1)] rounded-xl border border-slate-100 overflow-hidden relative">
                                <div className="absolute top-0 right-0 p-8">
                                     <div className="bg-emerald-500 text-white text-[10px] font-black px-4 py-1 rounded-bl-xl uppercase tracking-widest absolute top-0 right-0">ACTIVE</div>
                                </div>
                                <div className="p-12 space-y-12">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Your Company Ltd</h4>
                                            <p className="text-[11px] text-slate-400 font-medium">Tamil Nadu, India</p>
                                        </div>
                                        <h2 className="text-2xl font-black text-slate-800/20 uppercase tracking-tighter">TAX INVOICE</h2>
                                    </div>

                                    <div className="grid grid-cols-2 gap-12 text-[11px]">
                                        <div className="space-y-4">
                                            <div className="flex justify-between border-b border-slate-50 pb-2">
                                                <span className="text-slate-400 font-bold uppercase">#</span>
                                                <span className="text-slate-800 font-black">Will be generated automatically</span>
                                            </div>
                                            <div className="flex justify-between border-b border-slate-50 pb-2">
                                                <span className="text-slate-400 font-bold uppercase">Invoice Date</span>
                                                <span className="text-slate-800 font-black">{new Date(template.nextGenerationDate).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex justify-between border-b border-slate-50 pb-2">
                                                <span className="text-slate-400 font-bold uppercase">Terms</span>
                                                <span className="text-slate-800 font-black">Due on Receipt</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-slate-400 font-bold uppercase">Bill To</p>
                                            <p className="text-blue-600 font-black text-xs">{template.customerName}</p>
                                        </div>
                                    </div>

                                    <table className="w-full text-[11px]">
                                        <thead>
                                            <tr className="bg-slate-50 text-slate-400 font-black uppercase text-[9px] border-y border-slate-100">
                                                <th className="px-4 py-2 text-left"># Item & Description</th>
                                                <th className="px-4 py-2 text-right">Qty</th>
                                                <th className="px-4 py-2 text-right">Rate</th>
                                                <th className="px-4 py-2 text-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.map((it, idx) => (
                                                <tr key={idx} className="border-b border-slate-50">
                                                    <td className="px-4 py-4 font-bold text-slate-800">{idx + 1}. {it.name}</td>
                                                    <td className="px-4 py-4 text-right font-medium text-slate-500">{it.quantity}.00</td>
                                                    <td className="px-4 py-4 text-right font-medium text-slate-500">{parseFloat(it.rate).toLocaleString()}</td>
                                                    <td className="px-4 py-4 text-right font-black text-slate-800">{parseFloat(it.amount).toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    <div className="flex justify-end pt-6">
                                        <div className="w-64 space-y-3">
                                            <div className="flex justify-between text-[11px]">
                                                <span className="text-slate-400 font-bold">Sub Total</span>
                                                <span className="text-slate-800 font-black">{parseFloat(template.totalAmount - (template.taxAmount || 0)).toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between text-lg font-black text-slate-900 pt-3 border-t-2 border-slate-900 border-double">
                                                <span>Total</span>
                                                <span>₹{parseFloat(template.totalAmount).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Recent Activities' && (
                        <div className="max-w-3xl mx-auto py-10">
                            <div className="relative border-l-2 border-blue-100 ml-48 space-y-12">
                                <div className="relative">
                                    <div className="absolute -left-52 top-0 w-48 text-right pr-8">
                                        <p className="text-[12px] font-black text-slate-800 uppercase tracking-tight">{new Date().toLocaleDateString()}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                    </div>
                                    <div className="absolute -left-[11px] top-1.5 w-5 h-5 bg-blue-600 rounded-full border-4 border-white shadow-sm shadow-blue-200"></div>
                                    <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm ml-8 transition-all hover:border-blue-200 hover:shadow-md">
                                        <p className="text-[13px] font-bold text-slate-800">Profile Modernized</p>
                                        <p className="text-[11px] text-slate-400 font-medium mt-1">Automation template updated to full-screen premium layout by <span className="text-blue-600 font-bold uppercase tracking-tighter">{JSON.parse(localStorage.getItem('user') || '{}').email?.split('@')[0] || 'Admin'}</span></p>
                                    </div>
                                </div>
                                <div className="relative opacity-60">
                                    <div className="absolute -left-52 top-0 w-48 text-right pr-8">
                                        <p className="text-[12px] font-bold text-slate-500 uppercase tracking-tight">{new Date(template.createdAt).toLocaleDateString()}</p>
                                        <p className="text-[10px] font-medium text-slate-300 uppercase tracking-widest">10:52 AM</p>
                                    </div>
                                    <div className="absolute -left-[11px] top-1.5 w-5 h-5 bg-slate-200 rounded-full border-4 border-white"></div>
                                    <div className="bg-white border border-slate-50 p-6 rounded-2xl ml-8">
                                        <p className="text-[13px] font-bold text-slate-500">Recurring Invoice created for ₹{parseFloat(template.totalAmount).toLocaleString()}</p>
                                        <p className="text-[11px] text-slate-400 font-medium mt-1">by System Administrator</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// RECURRING INVOICES VIEW (LIST)
// ─────────────────────────────────────────────────────────────────────────────

const RecurringInvoicesView = ({ companyId }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { addNotification } = useNotificationStore();
  
  const isNew = location.pathname.includes('/new');
  const isEdit = location.pathname.includes('/edit');
  const isDetail = location.pathname.includes('/view') || (!isNew && !isEdit && id);

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const fetchTemplates = async () => {
    if (!companyId) return;
    try {
      setLoading(true);
      const res = await recurringInvoiceAPI.getByCompany(companyId);
      setTemplates(res.data || []);
    } catch (err) {
      console.error('Fetch Templates Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [companyId]);

  const handleRunAutomation = async () => {
    try {
      setRunning(true);
      const res = await recurringInvoiceAPI.processDue();
      addNotification(res.data.message || 'Automation run complete', 'success');
      fetchTemplates();
    } catch (err) {
      addNotification('Automation run failed', 'error');
    } finally {
      setRunning(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await recurringInvoiceAPI.delete(deleteId);
      addNotification('Template deleted successfully', 'success');
      if (id === deleteId) navigate('/recurring-invoices');
      fetchTemplates();
    } catch (err) {
      addNotification('Failed to delete template', 'error');
    } finally {
      setIsDeleteModalOpen(false);
      setDeleteId(null);
    }
  };

  const toggleStatus = async (template) => {
     try {
        const newStatus = template.status === 'Active' ? 'Paused' : 'Active';
        await recurringInvoiceAPI.update(template.id, { status: newStatus });
        addNotification(`Automation ${newStatus === 'Active' ? 'Resumed' : 'Paused'}`, 'success');
        fetchTemplates();
     } catch (err) {
        addNotification('Failed to update status', 'error');
     }
  };

  const filtered = templates.filter(t => 
    t.templateName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isNew || isEdit) return <RecurringInvoiceForm companyId={companyId} navigate={navigate} editId={id} />;

  return (
    <div className="flex h-[calc(100vh-64px)] bg-[#f8fafc] overflow-hidden animate-fade-in">
        <ConfirmModal 
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={confirmDelete}
            title="Terminate Automation"
            message="Are you sure you want to delete this recurring template?"
            type="danger"
        />

        {/* --- MASTER LIST (LEFT SIDE) --- */}
        <div className={`flex flex-col border-r border-slate-200 transition-all duration-500 overflow-hidden ${isDetail ? 'w-[400px] bg-white' : 'w-full p-8'}`}>
            <header className={`flex items-center justify-between transition-all duration-300 ${isDetail ? 'p-6 border-b border-slate-100 mb-0' : 'mb-10'}`}>
                <div className="space-y-1">
                    <h1 className={`${isDetail ? 'text-lg' : 'text-[28px]'} font-black text-slate-900 tracking-tighter uppercase transition-all`}>
                        {isDetail ? 'Automation Profiles' : 'Recurring Invoices'}
                    </h1>
                    {!isDetail && <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mt-1">Automated Billing Profiles</p>}
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => navigate('/recurring-invoices/new')}
                        className={`bg-[#1e61f0] text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-100 flex items-center gap-2 hover:bg-blue-700 ${isDetail ? 'p-2' : 'px-8 py-3.5 text-[13px] uppercase tracking-widest'}`}
                    >
                        <Plus size={isDetail ? 20 : 18} strokeWidth={2.5} />
                        {!isDetail && "New Template"}
                    </button>
                    {isDetail && (
                        <button onClick={fetchTemplates} className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:text-blue-600 transition-all">
                             <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                        </button>
                    )}
                </div>
            </header>

            {!isDetail && (
                <div className="flex items-center gap-4 mb-8">
                    <div className="relative group flex-1 max-w-[400px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search automation profiles..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-2xl w-full outline-none focus:border-blue-500 transition-all font-semibold text-[14px] shadow-sm"
                        />
                    </div>
                    <button 
                        onClick={handleRunAutomation}
                        disabled={running}
                        className="px-6 py-3.5 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold text-[13px] hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm uppercase tracking-widest"
                    >
                        {running ? <Loader2 size={18} className="animate-spin text-blue-500" /> : <RefreshCw size={18} className="text-blue-600" />} Cycle
                    </button>
                </div>
            )}

            <div className={`flex-1 overflow-y-auto no-scrollbar bg-white`}>
                <table className="w-full text-left">
                    {!isDetail && (
                        <thead className="sticky top-0 bg-white z-10">
                            <tr className="bg-white text-[11px] font-black text-slate-300 uppercase tracking-widest border-b border-slate-100">
                                <th className="px-10 py-5">Profile & Frequency</th>
                                <th className="px-10 py-5">Customer</th>
                                <th className="px-10 py-5">Last Run</th>
                                <th className="px-10 py-5 text-center">Next Run</th>
                                <th className="px-10 py-5 text-right">Amount</th>
                                <th className="px-10 py-5 text-center">Status</th>
                                <th className="px-10 py-5 text-center">Action</th>
                            </tr>
                        </thead>
                    )}
                    <tbody className="divide-y divide-slate-50">
                        {loading ? (
                            <tr><td colSpan="7" className="py-20 text-center font-black text-slate-300 uppercase tracking-widest italic animate-pulse whitespace-nowrap">Syncing Automation...</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan="7" className="py-20 text-center text-slate-300 font-black uppercase tracking-widest">No automation profiles defined</td></tr>
                        ) : filtered.map(t => (
                            <tr 
                                key={t.id} 
                                onClick={() => navigate(`/recurring-invoices/view/${t.id}`)}
                                className={`transition-all group cursor-pointer ${id === t.id ? 'bg-blue-50/50' : 'hover:bg-blue-50/30'}`}
                            >
                                {isDetail ? (
                                    /* --- COMPACT LIST ITEM (SIDEBAR MODE) --- */
                                    <td className="px-6 py-5">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex flex-col">
                                                <span className={`text-[13px] font-black ${id === t.id ? 'text-blue-600' : 'text-slate-900'} transition-colors`}>{t.templateName}</span>
                                                <span className="text-[10px] font-bold text-slate-400 mt-0.5">{t.customerName}</span>
                                            </div>
                                            <span className="text-[14px] font-black text-slate-800">₹{parseFloat(t.totalAmount || 0).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                            <span className="text-blue-600">{t.frequency}</span>
                                            <span className={t.status === 'Active' ? 'text-emerald-500' : 'text-rose-500'}>{t.status}</span>
                                        </div>
                                    </td>
                                ) : (
                                    /* --- FULL TABLE ROW (TABLE MODE) --- */
                                    <>
                                        <td className="px-10 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-[14px] font-black text-slate-900 leading-none group-hover:text-blue-600 transition-colors uppercase tracking-tight">{t.templateName}</span>
                                                <span className="text-[10px] font-black text-blue-500 mt-1.5 uppercase tracking-widest">{t.frequency}</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center font-black text-[14px] shadow-sm">{t.customerName?.charAt(0)}</div>
                                                <span className="text-[14px] font-black text-slate-900">{t.customerName}</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6 text-[13px] font-bold text-slate-500">
                                            {t.lastGeneratedDate ? new Date(t.lastGeneratedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'PENDING'}
                                        </td>
                                        <td className="px-10 py-6 text-center text-[13px] font-black text-slate-900">
                                            {new Date(t.nextGenerationDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-10 py-6 text-right font-black text-slate-900 text-[15px] tracking-tight">
                                            ₹{parseFloat(t.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-10 py-6 text-center">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border
                                                ${t.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                                                {t.status}
                                            </span>
                                        </td>
                                        <td className="px-10 py-6">
                                            <div className="flex items-center justify-center gap-2 transition-all">
                                                <button onClick={(e) => { e.stopPropagation(); navigate(`/recurring-invoices/edit/${t.id}`); }} className="p-1.5 hover:bg-white rounded text-blue-600 border border-transparent hover:border-blue-100" title="Edit"><Edit2 size={14}/></button>
                                                <button onClick={(e) => { e.stopPropagation(); setDeleteId(t.id); setIsDeleteModalOpen(true); }} className="p-1.5 hover:bg-white rounded text-rose-600 border border-transparent hover:border-rose-100" title="Delete"><Trash2 size={14}/></button>
                                            </div>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {/* --- DETAIL AREA (RIGHT SIDE) --- */}
        {isDetail && (
            <div className="flex-1 overflow-y-auto no-scrollbar bg-white relative">
                <RecurringInvoiceDetail id={id} companyId={companyId} navigate={navigate} />
            </div>
        )}
    </div>
  );
};

export default RecurringInvoicesView;
