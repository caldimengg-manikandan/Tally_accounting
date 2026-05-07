import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { vendorCreditAPI, ledgerAPI, inventoryAPI, purchaseAPI, companyAPI, projectAPI } from '../../services/api';
import { 
  Plus, Calendar, Undo2, MoreHorizontal, Edit2, Trash2, 
  Settings, CheckCircle2, AlertCircle, Clock, ArrowRight,
  Package, User, Search, X, ChevronRight, FileText,
  Filter, Download, ArrowLeft, Loader2, Save, Send,
  Trash, Info, HelpCircle, Tag, Paperclip, ChevronDown, Check,
  AlertTriangle, FileEdit, Printer, Mail, MoreVertical,
  RefreshCw, DollarSign, List, History, Share2, PlusCircle, GripVertical
} from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';
import useNotificationStore from '../../store/notificationStore';

// ─────────────────────────────────────────────────────────────────────────────
// VENDOR CREDIT FORM (Redesigned with Premium Card Layout)
// ─────────────────────────────────────────────────────────────────────────────

const VendorCreditForm = ({ companyId, navigate, editId }) => {
    const { addNotification } = useNotificationStore();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    
    // Core Data
    const [ledgers, setLedgers] = useState([]);
    const [inventoryItems, setInventoryItems] = useState([]);
    
    const vendors = useMemo(() => ledgers.filter(l => {
        const g = l.Group?.name || '';
        return g.toLowerCase().includes('creditor') || g.toLowerCase().includes('vendor');
    }), [ledgers]);

    const apAccounts = useMemo(() => ledgers.filter(l => {
        const g = l.Group?.name || '';
        return g.toLowerCase().includes('creditor') || g.toLowerCase().includes('vendor') || l.name === 'Accounts Payable';
    }), [ledgers]);

    const lineAccounts = useMemo(() => ledgers.filter(l => 
        ['Purchase Accounts', 'Direct Expenses', 'Indirect Expenses', 'Direct Expense', 'Current Liabilities', 'Other Current Liability', 'Other Current Liabilities', 'Duties & Taxes'].includes(l.Group?.name)
    ), [ledgers]);

    // Form State
    const [formData, setFormData] = useState({
        vendorCreditNumber: `VC-000${Math.floor(10 + Math.random() * 90)}`,
        vendorLedgerId: '',
        accountsPayableId: '',
        referenceNumber: '',
        date: new Date().toISOString().split('T')[0],
        subject: '',
        discount: 0,
        adjustment: 0,
        taxRate: 0, // GST Rate Select
        tdsRate: 0,
        tdsName: '',
        vendorNotes: 'Will be displayed on the vendor credit',
        termsConditions: 'Purchase return terms and conditions',
        projectId: ''
    });

    const [lineItems, setLineItems] = useState([
        { id: Date.now(), itemId: '', accountId: '', description: '', quantity: 1, rate: 0, amount: 0 }
    ]);

    // Search & Dropdown State
    const [isTDSDropdownOpen, setIsTDSDropdownOpen] = useState(false);
    const [tdsSearchTerm, setTdsSearchTerm] = useState('');
    const tdsDropdownRef = useRef(null);
    const [openItemDropdown, setOpenItemDropdown] = useState(null);
    const itemDropdownRef = useRef(null);
    const [projects, setProjects] = useState([]);

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
            setInventoryItems(itemsRes.data || []);
            setProjects(projectsRes.data || []);
            
            const defaultAP = allLedgers.find(l => l.name === 'Accounts Payable');
            if (defaultAP) setFormData(prev => ({ ...prev, accountsPayableId: defaultAP.id }));
        }).finally(() => setLoading(false));

        if (editId) {
            vendorCreditAPI.getById(editId).then(res => {
                const vc = res.data;
                if (vc) {
                    setFormData({ 
                        ...vc, 
                        date: new Date(vc.date).toISOString().split('T')[0],
                        taxRate: vc.taxRate || 0,
                        tdsRate: vc.tdsRate || 0,
                        tdsName: vc.tdsName || ''
                    });
                    setLineItems(vc.items.map(it => ({ ...it, name: it.Item?.name || '' })));
                }
            });
        }
    }, [companyId, editId]);

    const totals = useMemo(() => {
        const subTotal = lineItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        const discountAmt = (subTotal * parseFloat(formData.discount || 0)) / 100;
        const taxableAmount = subTotal - discountAmt;
        const taxAmt = taxableAmount * (parseFloat(formData.taxRate || 0) / 100);
        const total = taxableAmount + taxAmt + parseFloat(formData.adjustment || 0);
        
        return { subTotal, discountAmt, taxableAmount, taxAmt, total };
    }, [lineItems, formData.discount, formData.taxRate, formData.adjustment]);

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

    const handleItemSelect = (rowId, invItem) => {
        setLineItems(prev => prev.map(row => {
            if (row.id === rowId) {
                return { 
                    ...row, 
                    itemId: invItem.id, 
                    name: invItem.name, 
                    description: invItem.purchaseDescription || '', 
                    rate: invItem.costPrice || 0, 
                    amount: (invItem.costPrice || 0) * (row.quantity || 1) 
                };
            }
            return row;
        }));
        setOpenItemDropdown(null);
    };

    const handleSave = async (status = 'Open') => {
        if (!formData.vendorLedgerId || !formData.accountsPayableId) {
            addNotification('Please select both a Vendor and an AP Account.', 'error');
            return;
        }
        setSaving(true);
        try {
            const payload = { 
                ...formData, 
                items: lineItems, 
                subTotal: totals.subTotal, 
                taxAmount: totals.taxAmt, 
                tdsAmount: totals.tdsAmt,
                totalAmount: totals.total, 
                status, 
                companyId,
                projectId: formData.projectId || null
            };
            let savedNote;
            if (editId) {
                const res = await vendorCreditAPI.update(editId, payload);
                savedNote = res.data;
                addNotification('Vendor Credit updated', 'success');
            } else {
                const res = await vendorCreditAPI.create(payload);
                savedNote = res.data;
                addNotification('Vendor Credit recorded', 'success');
            }
            navigate(`/vendor-credits/view/${savedNote?.id || editId}`);
        } catch (err) {
            console.error(err);
            addNotification('Failed to save Vendor Credit', 'error');
        } finally {
            setSaving(false);
        }
    };

    // Outside click logic for dropdowns
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (tdsDropdownRef.current && !tdsDropdownRef.current.contains(event.target)) {
                setIsTDSDropdownOpen(false);
            }
            if (itemDropdownRef.current && !itemDropdownRef.current.contains(event.target)) {
                setOpenItemDropdown(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (loading) return <div className="p-20 text-center font-bold text-slate-400">Loading Vendor Credit Interface...</div>;

    return (
        <div className="flex flex-col min-h-screen bg-[#f8fafc] font-sans text-slate-700">
            {/* HEADER */}
            <div className="flex items-center justify-between px-8 h-16 border-b border-slate-200 sticky top-0 bg-white z-10 w-full shadow-sm">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/vendor-credits')} className="text-slate-400 hover:text-slate-600 transition-all p-1.5 hover:bg-slate-100 rounded-full"><ArrowLeft size={18} /></button>
                    <h1 className="text-[17px] font-bold text-slate-800 tracking-tight">{editId ? 'Edit Vendor Credit' : 'New Vendor Credit'}</h1>
                </div>
                <button onClick={() => navigate('/vendor-credits')} className="text-slate-400 hover:text-slate-600 p-1.5 rounded hover:bg-slate-100 transition-colors">
                    <X size={20} />
                </button>
            </div>

            {/* FORM CONTENT (Centered Card Layout) */}
            <div className="flex-1 overflow-y-auto pb-28 py-8 px-4">
                <div className="max-w-[1000px] mx-auto bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="p-10 space-y-10">
                        {/* Upper Section: Vendor & AP */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6 items-start">
                            <div className="space-y-5">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-bold uppercase tracking-widest text-rose-500">Vendor Name*</label>
                                    <div className="relative group">
                                        <select 
                                            value={formData.vendorLedgerId} 
                                            onChange={e => setFormData({...formData, vendorLedgerId: e.target.value})}
                                            className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold outline-none focus:bg-white focus:border-blue-500 transition-all shadow-sm appearance-none"
                                        >
                                            <option value="">Select or add a vendor</option>
                                            {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none text-slate-400">
                                            <ChevronDown size={14} />
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold uppercase tracking-widest text-rose-500">Vendor Credit#*</label>
                                        <input type="text" value={formData.vendorCreditNumber} onChange={e => setFormData({...formData, vendorCreditNumber: e.target.value})} className="w-full h-11 px-4 border border-slate-200 rounded-xl text-[13px] font-bold focus:border-blue-500 outline-none transition-all shadow-sm" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Reference#</label>
                                        <input type="text" value={formData.referenceNumber} onChange={e => setFormData({...formData, referenceNumber: e.target.value})} className="w-full h-11 px-4 border border-slate-200 rounded-xl text-[13px] font-bold focus:border-blue-500 outline-none transition-all shadow-sm" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold uppercase tracking-widest text-rose-500">Vendor Credit Date*</label>
                                    <div className="relative">
                                        <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full h-11 px-4 pl-10 border border-slate-200 rounded-xl text-[13px] font-bold outline-none focus:border-blue-500 transition-all shadow-sm" />
                                        <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Project</label>
                                    <div className="relative group">
                                        <select 
                                            value={formData.projectId} 
                                            onChange={e => setFormData({...formData, projectId: e.target.value})}
                                            className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold outline-none focus:bg-white focus:border-blue-500 transition-all shadow-sm appearance-none"
                                        >
                                            <option value="">Select project</option>
                                            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                            <ChevronDown size={14} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-5">
                                <div className="flex flex-col gap-1.5 text-right md:text-left">
                                    <label className="text-[11px] font-bold uppercase tracking-widest text-rose-500">Account*</label>
                                    <div className="relative group">
                                        <select 
                                            value={formData.accountsPayableId} 
                                            onChange={e => setFormData({...formData, accountsPayableId: e.target.value})}
                                            className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold outline-none focus:bg-white focus:border-blue-500 transition-all shadow-sm appearance-none"
                                        >
                                            <option value="">Select AP Account</option>
                                            {apAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                            <ChevronDown size={14} />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Subject</label>
                                    <textarea value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} placeholder="Credit Reason" className="w-full h-[100px] p-4 border border-slate-200 rounded-xl text-[13px] font-bold resize-none outline-none focus:border-blue-500 transition-all shadow-sm" />
                                </div>
                            </div>
                        </div>

                        {/* Item Table (Clean Design) */}
                        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                            <table className="w-full text-[12px]">
                                <thead>
                                    <tr className="bg-slate-50/50 text-slate-400 font-bold uppercase border-b border-slate-100 tracking-[0.15em]">
                                        <th className="px-6 py-4 text-left font-bold">Item Details</th>
                                        <th className="px-6 py-4 w-28 text-center border-l font-bold">Quantity</th>
                                        <th className="px-6 py-4 w-36 text-center border-l font-bold">Rate</th>
                                        <th className="px-6 py-4 w-36 text-right border-l font-bold">Amount</th>
                                        <th className="w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {lineItems.map(line => (
                                        <tr key={line.id} className="group hover:bg-slate-50/30 transition-all">
                                            <td className="px-6 py-4 space-y-2">
                                                <div className="relative" ref={openItemDropdown === line.id ? itemDropdownRef : null}>
                                                    <input 
                                                        type="text" 
                                                        value={line.name || ''} 
                                                        placeholder="Select an item."
                                                        onClick={() => setOpenItemDropdown(openItemDropdown === line.id ? null : line.id)}
                                                        className="w-full h-9 bg-transparent border-b border-transparent group-hover:border-slate-200 focus:border-blue-500 outline-none transition-all font-bold text-slate-800"
                                                        readOnly 
                                                    />
                                                    {openItemDropdown === line.id && (
                                                       <div className="absolute top-full left-0 w-[300px] bg-white border border-slate-200 shadow-2xl z-50 rounded-lg overflow-hidden animate-in zoom-in-95 duration-200">
                                                          <div className="max-h-[200px] overflow-y-auto py-1">
                                                             {inventoryItems.map(invItem => (
                                                                <div key={invItem.id} onClick={() => handleItemSelect(line.id, invItem)} className="px-4 py-2 hover:bg-blue-600 hover:text-white cursor-pointer flex flex-col">
                                                                   <span className="font-bold">{invItem.name}</span>
                                                                   <span className="text-[10px] opacity-80">Cost: ₹{invItem.costPrice}</span>
                                                                </div>
                                                             ))}
                                                          </div>
                                                       </div>
                                                    )}
                                                </div>
                                                <input 
                                                    type="text" 
                                                    value={line.description} 
                                                    onChange={e => handleUpdateLine(line.id, 'description', e.target.value)}
                                                    placeholder="Add description..."
                                                    className="w-full text-[11px] text-slate-400 bg-transparent outline-none italic"
                                                />
                                            </td>
                                            <td className="px-6 py-4 border-l">
                                                <input type="number" value={line.quantity} onChange={e => handleUpdateLine(line.id, 'quantity', e.target.value)} className="w-full text-center bg-transparent outline-none font-bold" />
                                            </td>
                                            <td className="px-6 py-4 border-l">
                                                <input type="number" value={line.rate} onChange={e => handleUpdateLine(line.id, 'rate', e.target.value)} className="w-full text-center bg-transparent outline-none font-bold" />
                                            </td>
                                            <td className="px-6 py-4 border-l text-right font-bold text-slate-900">
                                                {(parseFloat(line.amount) || 0).toFixed(2)}
                                            </td>
                                            <td className="px-3 text-center">
                                                <button onClick={() => setLineItems(prev => prev.length > 1 ? prev.filter(p => p.id !== line.id) : prev)} className="text-slate-200 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100">
                                                    <X size={14}/>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="p-3 bg-slate-50/30 border-t border-slate-100">
                                <button 
                                    onClick={() => setLineItems([...lineItems, { id: Date.now(), itemId: '', accountId: '', description: '', quantity: 1, rate: 0, amount: 0 }])}
                                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 transition-all transition-all uppercase tracking-widest pl-3 py-1"
                                >
                                    <Plus size={14}/> Add New Row
                                </button>
                            </div>
                        </div>

                        {/* Totals Section (Premium Card Style) */}
                        <div className="flex justify-end items-start gap-12">
                            <div className="w-[420px] bg-slate-50/50 p-8 rounded-3xl border border-slate-100 space-y-5 animate-in slide-in-from-right-4 duration-500">
                                <div className="flex justify-between text-[13px] font-bold text-slate-500">
                                    <span>Sub Total</span>
                                    <span className="text-slate-900 font-bold">{totals.subTotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-[13px] font-bold text-slate-500">
                                    <span>Discount (%)</span>
                                    <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden h-8 shadow-sm">
                                        <input type="number" value={formData.discount} onChange={e => setFormData({...formData, discount: e.target.value})} className="w-12 text-center text-slate-900 outline-none h-full bg-transparent p-0" />
                                        <span className="px-2 text-[10px] text-slate-400 border-l border-slate-100">%</span>
                                    </div>
                                </div>
                                
                                {/* Standardized Searchable GST Selection */}
                                <div className="flex justify-between items-center py-3 border-y border-slate-200/50">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[13px] font-bold text-slate-700">GST</span>
                                        <div className="relative min-w-[280px]" ref={tdsDropdownRef}>
                                            <div 
                                                onClick={() => { setIsTDSDropdownOpen(!isTDSDropdownOpen); setTdsSearchTerm(''); }}
                                                className={`w-full h-9 px-3 flex items-center justify-between border rounded-xl bg-white cursor-pointer group transition-all shadow-sm ${isTDSDropdownOpen ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-200 hover:border-slate-300'}`}
                                            >
                                                <span className={`text-[12px] truncate font-bold ${formData.taxRate > 0 || formData.tdsName ? 'text-slate-700' : 'text-slate-400'}`}>
                                                    {formData.tdsName ? `${formData.tdsName} [${formData.taxRate}%]` : 'Select a Tax'}
                                                </span>
                                                <ChevronDown size={14} className={`text-slate-400 transition-transform ${isTDSDropdownOpen ? 'rotate-180 text-blue-500' : ''}`} />
                                            </div>
                                            {isTDSDropdownOpen && (
                                                <div className="absolute bottom-full left-0 mb-2 w-[340px] bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                    <div className="p-3 border-b border-slate-100">
                                                        <div className="relative">
                                                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                                                            <input autoFocus type="text" value={tdsSearchTerm} onChange={(e) => setTdsSearchTerm(e.target.value)} placeholder="Search taxes..." className="w-full pl-9 pr-3 py-2 text-[12px] font-bold border border-slate-100 rounded-xl focus:border-blue-500 outline-none bg-slate-50/50" />
                                                        </div>
                                                    </div>
                                                    <div className="max-h-[220px] overflow-y-auto py-2 custom-scrollbar text-left">
                                                        <div className="px-4 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Taxes</div>
                                                        {filteredTdsOptions.map((opt, idx) => (
                                                            <div key={idx} onClick={() => { setFormData({ ...formData, taxRate: opt.rate, tdsName: opt.name }); setIsTDSDropdownOpen(false); }} className={`px-4 py-2 text-[13px] cursor-pointer flex items-center justify-between transition-colors ${formData.tdsName === opt.name ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-50'}`}>
                                                                <span className="font-bold">{opt.name} [{opt.rate}%]</span>
                                                                {formData.tdsName === opt.name && <CheckCircle2 size={14} className="text-white fill-white" />}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="p-3 bg-slate-50 border-t border-slate-100">
                                                        <button className="flex items-center gap-2 text-[11px] font-bold text-indigo-600 uppercase tracking-widest hover:text-indigo-800 transition-colors">
                                                            <Settings size={14} /> Manage TDS
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-[13px] font-bold text-slate-900">{totals.taxAmt.toFixed(2)}</span>
                                </div>

                                <div className="flex justify-between items-center text-[13px] font-bold text-slate-500 pt-2 pb-2">
                                    <span>Adjustment</span>
                                    <input type="number" value={formData.adjustment} onChange={e => setFormData({...formData, adjustment: e.target.value})} className="w-24 h-8 px-3 border border-slate-200 rounded-lg text-right font-bold text-slate-900 focus:border-blue-500 outline-none shadow-sm" />
                                </div>

                                <div className="flex justify-between items-center text-slate-900 pt-6 border-t font-bold tracking-tight">
                                    <span className="text-[11px] font-bold uppercase text-slate-400 tracking-[0.2em]">Total ( ₹ )</span>
                                    <span className="text-3xl tracking-tighter">₹{totals.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* BOTTOM ACTION BAR */}
            <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 px-8 flex items-center gap-3 z-20 shadow-[0_-2px_6px_rgba(0,0,0,0.02)]">
                <button 
                  onClick={() => handleSave('Open')} 
                  disabled={saving}
                  className="px-8 h-10 bg-indigo-600 text-white rounded-xl font-bold text-[13px] hover:bg-indigo-700 shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save as Open'}
                </button>
                <button 
                  onClick={() => handleSave('Draft')} 
                  disabled={saving}
                  className="px-6 h-10 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-[13px] hover:bg-slate-50 shadow-sm transition-all active:scale-95 disabled:opacity-50"
                >
                  Save as Draft
                </button>
                <button 
                  onClick={() => navigate('/vendor-credits')} 
                  className="px-5 py-2 text-slate-400 font-bold hover:text-slate-600 transition-colors text-[13px]"
                >
                  Cancel
                </button>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// VENDOR CREDIT DETAIL VIEW
// ─────────────────────────────────────────────────────────────────────────────

const VendorCreditDetail = ({ id, navigate, companyId }) => {
    const { addNotification } = useNotificationStore();
    const [note, setNote] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    
    useEffect(() => {
        if (!id) return;
        vendorCreditAPI.getById(id).then(res => { setNote(res.data); setLoading(false); }).catch(() => setLoading(false));
    }, [id]);

    const formatCurrency = (val) => parseFloat(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });

    const handleDelete = async () => {
        try {
            await vendorCreditAPI.delete(id);
            addNotification('Vendor Credit deleted successfully', 'success');
            navigate('/vendor-credits');
        } catch (err) {
            addNotification('Failed to delete Vendor Credit', 'error');
        }
    };

    if (loading) return <div className="flex-1 flex items-center justify-center text-slate-400 font-bold animate-pulse">Syncing Records...</div>;
    if (!note) return <div className="flex-1 flex items-center justify-center text-slate-300 font-bold text-3xl opacity-20 tracking-tighter uppercase">Document Not Found</div>;

    return (
        <div className="flex-1 flex flex-col h-full bg-slate-50 animate-fade-in">
            {/* Header Bar */}
            <div className="bg-white border-b border-slate-200 px-6 py-2.5 flex items-center justify-between sticky top-0 z-10 no-print shadow-sm">
                <div className="flex items-center gap-2">
                    <button onClick={() => navigate('/vendor-credits')} className="text-[13px] font-bold text-indigo-600 hover:underline flex items-center gap-1.5 transition-all">
                       <ChevronDown size={14} className="rotate-90"/> All Vendor Credits
                    </button>
                    <span className="text-slate-300">|</span>
                    <span className="text-[13px] font-bold text-slate-800 tracking-tight">{note.vendorCreditNumber}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => navigate(`/vendor-credits/edit/${note.id}`)} className="h-8 px-4 bg-indigo-600 text-white rounded-lg flex items-center gap-1.5 text-[12px] font-bold hover:bg-indigo-700 shadow-sm transition-all">
                        <Edit2 size={13}/> Edit
                    </button>
                    <button onClick={() => window.print()} className="h-8 px-4 bg-white border border-slate-200 text-slate-600 rounded-lg flex items-center gap-1.5 text-[12px] font-bold hover:bg-slate-50 shadow-sm transition-all">
                        <Printer size={13}/> Print
                    </button>
                    <button onClick={() => setShowDeleteModal(true)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"><Trash2 size={16}/></button>
                </div>
            </div>

            {/* Document Content (Centered Premium Layout) */}
            <div className="flex-1 overflow-y-auto p-12 flex flex-col items-center custom-scrollbar print:p-0 print:bg-white">
                <div className="bg-white shadow-2xl rounded-[2.5rem] w-full max-w-4xl mx-auto p-16 relative border border-slate-100 mb-20">
                    <div className="flex justify-between items-start mb-20">
                        <div>
                            <div className="w-16 h-16 bg-gradient-to-br from-slate-800 to-indigo-950 rounded-2xl mb-6 flex items-center justify-center text-white font-bold text-[32px] shadow-xl">V</div>
                            <h2 className="text-[24px] font-bold text-slate-900 tracking-tighter uppercase mb-2">{localStorage.getItem('companyName')?.toUpperCase() || 'COMPANY'}</h2>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">Voucher: {note.vendorCreditNumber}</p>
                        </div>
                        <div className="text-right">
                            <h1 className="text-[42px] font-bold text-slate-900 tracking-tighter uppercase -mb-2 opacity-95">Vendor Credit</h1>
                            <div className="h-1.5 w-32 bg-indigo-600 ml-auto mt-4 rounded-full"></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 border border-slate-200 mb-16 overflow-hidden rounded-3xl shadow-sm">
                        <div className="p-10 border-r border-slate-200 bg-slate-50/20 flex flex-col gap-3">
                             <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-0.5">Vendor Details</h4>
                             <div>
                                <p className="text-[20px] font-bold text-indigo-700 tracking-tighter mb-1">{note.Vendor?.name || 'Vendor Not Specified'}</p>
                                <p className="text-[13px] text-slate-500 font-medium">Ref: {note.referenceNumber || 'N/A'}</p>
                             </div>
                        </div>
                        <div className="p-10 flex flex-col justify-center gap-4 bg-slate-50/50">
                             <div className="flex justify-between items-center text-[13px] font-bold"><span className="text-slate-400 uppercase tracking-widest text-[10px]">Credit Number</span><span className="text-slate-900">: {note.vendorCreditNumber}</span></div>
                             <div className="flex justify-between items-center text-[13px] font-bold"><span className="text-slate-400 uppercase tracking-widest text-[10px]">Issue Date</span><span className="text-slate-900">: {new Date(note.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</span></div>
                             <div className="flex justify-between items-center text-[13px] font-bold"><span className="text-slate-400 uppercase tracking-widest text-[10px]">Status</span><span className="text-[10px] font-bold uppercase bg-indigo-600 text-white px-3 py-1 rounded-full">{note.status}</span></div>
                        </div>
                    </div>

                    <table className="w-full border-collapse border border-slate-200 mb-16 rounded-2xl overflow-hidden shadow-sm">
                        <thead>
                            <tr className="bg-slate-900 text-[11px] font-bold text-white uppercase tracking-[0.2em]">
                                <th className="py-5 px-6 border-r border-slate-700 w-16 text-center">#</th>
                                <th className="py-5 px-8 text-left">Description</th>
                                <th className="py-5 px-6 border-l border-slate-700 w-32 text-center">Qty / Rate</th>
                                <th className="py-5 px-8 border-l border-slate-700 w-44 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {note.items?.map((item, idx) => (
                                <tr key={idx} className="text-[14px] font-bold text-slate-800">
                                    <td className="p-8 border-r border-slate-200 text-center text-slate-400 font-bold">{idx + 1}</td>
                                    <td className="p-8">
                                        <p className="font-bold text-slate-950 text-base mb-1">{item.Item?.name || 'Itemized Credit'}</p>
                                        <p className="text-[12px] text-slate-400 italic font-medium">{item.description}</p>
                                    </td>
                                    <td className="p-8 border-l border-slate-200 text-center">
                                        <div className="text-slate-950">{parseFloat(item.quantity).toFixed(2)}</div>
                                        <div className="text-[11px] text-slate-400 font-bold mt-1">@ ₹{formatCurrency(item.rate)}</div>
                                    </td>
                                    <td className="p-8 border-l border-slate-200 text-right font-bold text-slate-950 text-lg">₹{formatCurrency(item.amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="flex justify-end pt-10">
                        <div className="w-[380px] bg-slate-50/50 p-10 rounded-[3rem] border border-slate-200 shadow-xl space-y-6">
                            <div className="flex justify-between text-[13px] font-bold text-slate-400 uppercase tracking-widest">
                                <span>Sub Total</span>
                                <span className="text-slate-950 font-bold tracking-tight">₹{formatCurrency(note.subTotal)}</span>
                            </div>
                            <div className="flex justify-between text-[13px] font-bold text-slate-400 uppercase tracking-widest">
                                <span>Tax Amount ({note.tdsName})</span>
                                <span className="text-slate-950 font-bold tracking-tight">₹{formatCurrency(note.taxAmount)}</span>
                            </div>
                            <div className="flex justify-between items-center text-[20px] font-bold text-slate-950 pt-8 border-t-2 border-slate-200">
                                <span className="text-slate-400 uppercase tracking-[0.2em] text-[10px]">Net Credits</span>
                                <span className="text-[32px] tracking-tighter leading-none">₹{formatCurrency(note.totalAmount)}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-24 pt-16 border-t border-slate-100 flex justify-between items-end">
                        <div className="space-y-4">
                            <div className="w-40 h-px bg-slate-300"></div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Authorized Signature</p>
                        </div>
                        <p className="text-[11px] font-bold text-slate-300 tracking-tight italic">Document generated for financial record purposes.</p>
                    </div>
                </div>
            </div>

            <ConfirmModal 
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Delete Vendor Credit"
                message="Are you sure you want to delete this Vendor Credit?"
                confirmText="Delete"
                type="danger"
            />
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SPLIT-VIEW
// ─────────────────────────────────────────────────────────────────────────────

const VendorCreditsView = ({ companyId }) => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { addNotification } = useNotificationStore();

    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [modalConfig, setModalConfig] = useState({ isOpen: false, id: null, name: '' });

    const isNew = window.location.pathname.includes('/new');
    const isEdit = window.location.pathname.includes('/edit');
    const isView = window.location.pathname.includes('/view');
    const isDetail = isView && id;

    const fetchNotes = async () => {
        if (!companyId) return;
        try { 
            setLoading(true); 
            const res = await vendorCreditAPI.getByCompany(companyId); 
            setNotes(res.data || []); 
        } catch (err) { 
            console.error(err); 
        } finally { 
            setLoading(false); 
        }
    };

    useEffect(() => { fetchNotes(); }, [companyId, window.location.pathname]);

    const filtered = useMemo(() => notes.filter(n => 
        n.vendorCreditNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (n.Vendor?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    ), [notes, searchTerm]);

    const handleDelete = async () => {
        try {
            await vendorCreditAPI.delete(modalConfig.id);
            addNotification('Vendor Credit deleted successfully', 'success');
            setNotes(notes.filter(n => n.id !== modalConfig.id));
            setModalConfig({ isOpen: false, id: null, name: '' });
            if (id === modalConfig.id) navigate('/vendor-credits');
        } catch (err) {
            addNotification('Failed to delete vendor credit', 'error');
        }
    };

    if (isNew || isEdit) return <VendorCreditForm companyId={companyId} navigate={navigate} editId={id} />;

    return (
        <div className="flex h-[calc(100vh-80px)] bg-[#f8fafc] overflow-hidden animate-fade-in">
             <ConfirmModal 
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({ isOpen: false, id: null, name: '' })}
                onConfirm={handleDelete}
                title="Delete Vendor Credit"
                message={`Are you sure you want to delete ${modalConfig.name}?`}
                type="danger"
                confirmText="Delete"
            />

            {/* Side List (Master) */}
            <div className={`flex-col border-r border-slate-200 bg-white transition-all duration-300 flex no-print ${isDetail ? 'w-[380px]' : 'w-0 opacity-0 overflow-hidden'}`}>
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white shadow-sm">
                    <h3 className="text-[12px] font-bold text-slate-800 uppercase tracking-widest">Vendor Credits</h3>
                    <button onClick={() => navigate('/vendor-credits/new')} className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-md transition-all active:scale-95">
                        <Plus size={16} />
                    </button>
                </div>
                <div className="p-4 border-b border-slate-50">
                    <div className="relative group">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                        <input 
                            type="text" 
                            placeholder="Quick search..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[12px] font-bold outline-none focus:bg-white focus:border-indigo-500 transition-all"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar py-2">
                    {filtered.map(n => (
                        <div 
                            key={n.id}
                            onClick={() => navigate(`/vendor-credits/view/${n.id}`)}
                            className={`px-6 py-5 cursor-pointer transition-all border-l-4 ${id === n.id ? 'bg-indigo-50/50 border-indigo-600' : 'hover:bg-slate-50 border-transparent'}`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className={`text-[13px] font-bold ${id === n.id ? 'text-indigo-600' : 'text-slate-900'}`}>{n.vendorCreditNumber}</span>
                                <span className="text-[13px] font-bold text-slate-900">₹{parseFloat(n.totalAmount || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                               <span className="text-[11px] font-bold text-slate-400 truncate max-w-[180px]">{n.Vendor?.name}</span>
                               <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full tracking-widest ${n.status === 'Open' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>{n.status}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {isDetail ? (
                    <VendorCreditDetail id={id} navigate={navigate} companyId={companyId} />
                ) : (
                    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
                        <div className="bg-white p-10 flex items-center justify-between border-b border-slate-200 shadow-sm">
                            <div>
                                <h1 className="text-[32px] font-bold text-slate-950 tracking-tighter uppercase leading-none">Vendor Credits</h1>
                                <p className="text-[12px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-3">Purchase returns & supplier adjustments</p>
                            </div>
                            <button onClick={() => navigate('/vendor-credits/new')} className="px-8 h-12 bg-indigo-600 text-white rounded-2xl font-bold text-[13px] hover:bg-indigo-700 shadow-xl transition-all flex items-center gap-3 uppercase tracking-widest active:scale-95">
                                <PlusCircle size={20} /> New Record
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-auto p-10">
                            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                                <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/10 flex items-center justify-between">
                                    <div className="relative w-96">
                                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                        <input 
                                            type="text" 
                                            placeholder="Search by vendor or credit#..." 
                                            value={searchTerm} 
                                            onChange={e => setSearchTerm(e.target.value)} 
                                            className="w-full pl-12 pr-4 py-2.5 border border-slate-200 rounded-2xl text-[13px] font-bold outline-none focus:border-indigo-500 shadow-sm transition-all"
                                        />
                                    </div>
                                    <button className="p-2.5 text-slate-400 hover:text-indigo-600 transition-colors"><Filter size={18}/></button>
                                </div>
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-slate-50 text-[11px] font-bold text-slate-300 uppercase tracking-[0.2em] bg-slate-50/20">
                                            <th className="px-10 py-5">Issue Date</th>
                                            <th className="px-10 py-5">Credit Number</th>
                                            <th className="px-10 py-5">Vendor Name</th>
                                            <th className="px-10 py-5">Status</th>
                                            <th className="px-10 py-5 text-right">Net Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {loading ? (
                                            <tr><td colSpan="5" className="py-24 text-center text-slate-300 animate-pulse font-bold">Synchronizing Credits Database...</td></tr>
                                        ) : filtered.length === 0 ? (
                                            <tr><td colSpan="5" className="py-24 text-center text-slate-300 flex flex-col items-center gap-4">
                                                <Undo2 size={40} className="opacity-10"/>
                                                <span className="font-bold text-xl opacity-20 uppercase tracking-tighter">No transactions recorded</span>
                                            </td></tr>
                                        ) : filtered.map(n => (
                                            <tr 
                                                key={n.id} 
                                                onClick={() => navigate(`/vendor-credits/view/${n.id}`)}
                                                className="hover:bg-indigo-50/20 transition-all cursor-pointer group"
                                            >
                                                <td className="px-10 py-7 text-[14px] font-bold text-slate-500">{new Date(n.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                                <td className="px-10 py-7 text-[15px] font-bold text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{n.vendorCreditNumber}</td>
                                                <td className="px-10 py-7">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[11px] font-bold text-slate-500">{(n.Vendor?.name || 'V').charAt(0)}</div>
                                                        <span className="text-[14px] font-bold text-slate-700">{n.Vendor?.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-7">
                                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${n.status === 'Open' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>{n.status}</span>
                                                </td>
                                                <td className="px-10 py-7 text-right font-bold text-slate-950 text-lg tracking-tighter">₹{parseFloat(n.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
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

export default VendorCreditsView;
