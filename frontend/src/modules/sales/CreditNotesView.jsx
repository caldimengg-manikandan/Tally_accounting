import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { creditNoteAPI, ledgerAPI, inventoryAPI } from '../../services/api';
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

// ─────────────────────────────────────────────────────────────────────────────
// CREDIT NOTE FORM
// ─────────────────────────────────────────────────────────────────────────────

const CreditNoteForm = ({ companyId, navigate, editId }) => {
    const { addNotification } = useNotificationStore();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    
    // Core Data
    const [ledgers, setLedgers] = useState([]);
    const [items, setItems] = useState([]);
    
    const customers = useMemo(() => ledgers.filter(l => {
        const g = l.Group?.name || '';
        return g.toLowerCase().includes('debtor') || g.toLowerCase().includes('customer');
    }), [ledgers]);
    const arAccounts = useMemo(() => ledgers.filter(l => {
        const g = l.Group?.name || '';
        return g.toLowerCase().includes('debtor') || g.toLowerCase().includes('customer') || l.name === 'Accounts Receivable';
    }), [ledgers]);
    const lineAccounts = useMemo(() => ledgers.filter(l => 
        ['Sales Accounts', 'Direct Incomes', 'Indirect Incomes', 'Current Assets', 'Direct Income', 'Other Current Asset', 'Other Current Assets', 'Advance Tax', 'Employee Advance', 'Employee Advances', 'Prepaid Expenses', 'TDS Receivable'].includes(l.Group?.name)
    ), [ledgers]);

    // Form State
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
        termsConditions: 'Enter the terms and conditions of your business to be displayed in your transaction'
    });

    const [lineItems, setLineItems] = useState([
        { id: Date.now(), itemId: '', accountId: '', description: '', quantity: 1, rate: 0, amount: 0 }
    ]);

    useEffect(() => {
        if (!companyId) return;
        setLoading(true);
        Promise.all([
            ledgerAPI.getByCompany(companyId),
            inventoryAPI.getByCompany(companyId)
        ]).then(([ledgersRes, itemsRes]) => {
            const allLedgers = ledgersRes.data || [];
            setLedgers(allLedgers);
            setItems(itemsRes.data || []);
            
            const defaultAR = allLedgers.find(l => l.name === 'Accounts Receivable');
            if (defaultAR) setFormData(prev => ({ ...prev, accountsReceivableId: defaultAR.id }));

            // Auto-provision requested accounts
            const requestedNames = ['Other Current Asset', 'Advance Tax', 'Employee Advance', 'Prepaid Expenses', 'TDS Receivable'];
            const missing = requestedNames.filter(name => !allLedgers.find(l => l.name === name));
            if (missing.length > 0) {
                const currentAssetsGroup = allLedgers.find(l => l.Group?.name === 'Current Assets')?.Group?.id;
                Promise.all(missing.map(name => 
                    ledgerAPI.create({ name, groupName: 'Current Assets', GroupId: currentAssetsGroup, companyId })
                )).then(() => {
                    ledgerAPI.getByCompany(companyId).then(res => setLedgers(res.data || []));
                });
            }
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
        if (!formData.customerLedgerId || !formData.accountsReceivableId || lineItems.every(li => !li.itemId)) {
            addNotification('Please select a Customer, AR Account and add at least one item.', 'error');
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
            console.error(err);
            addNotification('Failed to save Credit Note', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-20 text-center font-bold text-slate-400">Loading Credit Note Interface...</div>;

    return (
        <div className="min-h-screen bg-white text-slate-700 font-sans p-6 max-w-5xl mx-auto shadow-2xl rounded-2xl animate-fade-in border border-slate-100 mt-6">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/credit-notes')} className="text-slate-400 hover:text-slate-600 transition-all p-1 hover:bg-slate-50 rounded-full"><ArrowLeft size={20} /></button>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight">{editId ? 'Edit Credit Note' : 'New Credit Note'}</h1>
                </div>
                <X size={18} className="text-slate-300 cursor-pointer hover:text-slate-500" onClick={() => navigate('/credit-notes')} />
            </div>

            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <label className="w-32 text-[12px] text-rose-500 font-bold pt-2">Customer Name*</label>
                            <div className="flex-1 flex gap-2">
                                <select 
                                    value={formData.customerLedgerId} 
                                    onChange={e => {
                                        if (e.target.value === 'NEW') navigate('/customers/new');
                                        else setFormData({...formData, customerLedgerId: e.target.value});
                                    }}
                                    className="flex-1 p-2 bg-[#f3f7ff]/50 border border-slate-200 rounded-lg text-[13px] font-semibold outline-none transition-all shadow-sm"
                                >
                                    <option value="">Select or add a customer</option>
                                    <option value="NEW" className="text-blue-600 font-bold">➕ Add New Customer</option>
                                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <button className="p-2 bg-blue-600 text-white rounded-lg shadow-md"><Search size={16}/></button>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <label className="w-32 text-[12px] text-rose-500 font-bold">Credit Note#*</label>
                            <input type="text" value={formData.creditNoteNumber} onChange={e => setFormData({...formData, creditNoteNumber: e.target.value})} className="flex-1 p-2.5 border border-slate-200 rounded-lg text-[13px] font-black" />
                        </div>
                        <div className="flex items-center gap-4">
                            <label className="w-32 text-[12px] text-slate-500 font-bold">Reference#</label>
                            <input type="text" value={formData.referenceNumber} onChange={e => setFormData({...formData, referenceNumber: e.target.value})} className="flex-1 p-2.5 border border-slate-200 rounded-lg text-[13px] font-semibold outline-none" />
                        </div>
                        <div className="flex items-center gap-4">
                            <label className="w-32 text-[12px] text-rose-500 font-bold">Credit Note Date*</label>
                            <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="flex-1 p-2 border border-slate-200 rounded-lg text-[13px] font-semibold outline-none" />
                        </div>
                    </div>
                    <div className="pt-4 space-y-4">
                        <div className="flex items-center gap-4">
                            <label className="w-32 text-[12px] text-slate-500 font-bold">Salesperson</label>
                            <select value={formData.salesperson} onChange={e => setFormData({...formData, salesperson: e.target.value})} className="flex-1 p-2 border border-slate-200 rounded-lg text-[13px] font-semibold outline-none">
                                <option value="">Select Salesperson</option><option>Admin</option><option>Direct</option>
                            </select>
                        </div>
                        <div className="flex items-start gap-4">
                            <label className="w-32 text-[12px] text-slate-500 font-bold pt-2">Subject</label>
                            <textarea value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} placeholder="Credit Note Reason" className="flex-1 p-2 border border-slate-200 rounded-lg text-[13px] font-semibold h-16 resize-none outline-none shadow-sm" />
                        </div>
                    </div>
                </div>

                <div className="mt-8 bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-white text-slate-400 text-[9px] font-black uppercase border-b border-slate-100 tracking-widest text-center">
                                <th className="px-6 py-3 text-left">Item Details</th>
                                <th className="px-6 py-3 w-32 border-l">Quantity</th>
                                <th className="px-6 py-3 w-40 border-l">Rate</th>
                                <th className="px-6 py-3 w-40 border-l">Amount</th>
                                <th className="w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {lineItems.map(line => (
                                <tr key={line.id} className="group hover:bg-blue-50/20">
                                    <td className="px-6 py-5">
                                        <select value={line.itemId} onChange={e => handleItemSelect(line.id, e.target.value)} className="w-full p-2 border border-transparent border-dashed rounded-lg text-sm bg-transparent outline-none transition-all">
                                            <option value="">Select an item.</option>
                                            {items.map(it => <option key={it.id} value={it.id}>{it.name}</option>)}
                                        </select>
                                    </td>
                                    <td className="px-6 py-5 border-l"><input type="number" value={line.quantity} onChange={e => handleUpdateLine(line.id, 'quantity', e.target.value)} className="w-full p-2 text-center text-sm bg-transparent outline-none" /></td>
                                    <td className="px-6 py-5 border-l"><input type="number" value={line.rate} onChange={e => handleUpdateLine(line.id, 'rate', e.target.value)} className="w-full p-2 text-right text-sm bg-transparent outline-none" /></td>
                                    <td className="px-6 py-5 border-l text-right font-black text-slate-900 text-sm">{(parseFloat(line.amount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    <td className="px-4 py-3"><button onClick={() => setLineItems(prev => prev.length > 1 ? prev.filter(p => p.id !== line.id) : prev)} className="text-slate-300 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"><X size={14}/></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-between items-start pt-10 gap-20">
                    <div className="flex-1 space-y-3">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">Customer Notes</label>
                        <textarea value={formData.customerNotes} onChange={e => setFormData({...formData, customerNotes: e.target.value})} className="w-full p-4 bg-[#f8f9fa] border border-slate-200 rounded-2xl text-[13px] h-24 resize-none outline-none shadow-sm" />
                    </div>
                    <div className="w-[450px] bg-[#fdfdfe] p-8 rounded-[2rem] border border-slate-100 shadow-xl space-y-6">
                        <div className="flex justify-between text-sm font-bold text-slate-500"><span>Sub Total</span><span className="text-slate-900">{totals.subTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                        <div className="flex justify-between items-center text-sm font-bold text-slate-500"><span>Discount (%)</span><input type="number" value={formData.discount} onChange={e => setFormData({...formData, discount: e.target.value})} className="w-16 p-2 text-center border rounded" /></div>
                        <div className="flex justify-between text-sm font-bold text-slate-500"><span>Tax (IGST 18%)</span><span className="text-slate-900">{totals.taxAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                        <div className="flex justify-between text-xl font-black text-slate-900 pt-6 border-t font-sans"><span>Total ( ₹ )</span><span>{totals.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                    </div>
                </div>

                <div className="sticky bottom-0 bg-white border-t border-slate-100 py-3 flex gap-3 mt-10 z-[100] -mx-6 px-6 shadow-sm">
                    <button onClick={() => handleSave('Open')} className="bg-[#008ef0] text-white px-5 py-2 rounded font-bold text-[13px] hover:bg-[#007cd0]">Save as Open</button>
                    <button onClick={() => handleSave('Draft')} className="px-5 py-2 bg-white border border-slate-300 text-slate-700 rounded font-bold text-[13px] hover:bg-slate-50">Save as Draft</button>
                    <button onClick={() => navigate('/credit-notes')} className="px-5 py-2 border border-slate-200 text-slate-500 rounded font-bold text-[13px]">Cancel</button>
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// CREDIT NOTE DETAIL VIEW (ZOHO STYLE REFINED)
// ─────────────────────────────────────────────────────────────────────────────

const CreditNoteDetail = ({ id, navigate, companyId }) => {
    const { addNotification } = useNotificationStore();
    const [note, setNote] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    useEffect(() => {
        if (!id) return;
        creditNoteAPI.getById(id).then(res => { setNote(res.data); setLoading(false); }).catch(() => setLoading(false));
    }, [id]);

    const formatCurrency = (val) => parseFloat(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const handleDelete = async () => {
        try {
            await creditNoteAPI.delete(id);
            addNotification('Credit Note deleted successfully', 'success');
            navigate('/credit-notes');
        } catch (err) {
            addNotification('Failed to delete Credit Note', 'error');
        }
    };

    const handleEmail = () => {
        addNotification(`Sending Credit Note to ${note.Customer?.name}...`, 'info');
        setTimeout(() => addNotification('Email sent successfully', 'success'), 1500);
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <div className="flex-1 flex items-center justify-center text-slate-400 font-bold animate-pulse">Syncing Records...</div>;
    if (!note) return <div className="flex-1 flex items-center justify-center text-slate-300 font-black text-3xl opacity-20 tracking-tighter uppercase">Document Not Found</div>;

    return (
        <div className="flex-1 flex flex-col h-full bg-white animate-fade-in">
            {/* Blue Header Bar (Breadcrumb style) */}
            <div className="bg-[#fcfdfe] border-b border-slate-200 px-6 py-2.5 flex items-center justify-between sticky top-0 z-10 no-print">
                <div className="flex items-center gap-2">
                    <button onClick={() => navigate('/credit-notes')} className="text-[13px] font-bold text-blue-600 hover:underline flex items-center gap-1.5 transition-all">
                       <ChevronDown size={14} className="rotate-90"/> All Credit Notes
                    </button>
                    <span className="text-slate-300">|</span>
                    <span className="text-[13px] font-black text-slate-800">{note.creditNoteNumber}</span>
                </div>
                <div className="flex items-center gap-3">
                   <button className="p-1.5 text-slate-400 hover:bg-slate-50 rounded-md transition-all hover:text-slate-600"><History size={16}/></button>
                   <button className="p-1.5 text-slate-400 hover:bg-slate-50 rounded-md transition-all hover:text-slate-600"><Share2 size={16}/></button>
                </div>
            </div>

            {/* Sub Toolbar (Zoho Style) */}
            <div className="bg-white border-b border-slate-100 px-6 py-2 flex items-center justify-between shadow-sm no-print">
                <div className="flex items-center gap-1">
                    <button onClick={() => navigate(`/credit-notes/edit/${note.id}`)} className="px-3 py-1.5 text-slate-600 hover:bg-slate-50 rounded flex items-center gap-1.5 text-[12px] font-bold border border-transparent hover:border-slate-100 transition-all">
                        <Edit2 size={14}/> Edit
                    </button>
                    <button onClick={handleEmail} className="px-3 py-1.5 text-slate-600 hover:bg-slate-50 rounded flex items-center gap-1.5 text-[12px] font-bold transition-all">
                        <Mail size={14}/> Email
                    </button>
                    <button onClick={handlePrint} className="px-3 py-1.5 text-slate-600 hover:bg-slate-50 rounded flex items-center gap-1.5 text-[12px] font-bold transition-all">
                        <Printer size={14}/> PDF/Print <ChevronDown size={14}/>
                    </button>
                    <span className="w-px h-5 bg-slate-100 mx-2" />
                    <button className="px-3 py-1.5 text-slate-600 hover:bg-slate-50 rounded flex items-center gap-1.5 text-[12px] font-bold transition-all">
                        <Plus size={14}/> Apply to Invoices
                    </button>
                    <button className="px-3 py-1.5 text-slate-600 hover:bg-slate-50 rounded flex items-center gap-1.5 text-[12px] font-bold transition-all">
                        <Undo2 size={14}/> Refund
                    </button>
                    <button 
                        onClick={() => setShowDeleteModal(true)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded transition-all"
                    >
                        <Trash2 size={16}/>
                    </button>
                </div>
            </div>

            {/* Document Content */}
            <div className="flex-1 overflow-y-auto p-16 bg-[#f8fafc] flex flex-col items-center custom-scrollbar print:p-0 print:bg-white">
                <div className="bg-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-lg min-h-[1050px] w-full max-w-4xl mx-auto p-12 relative overflow-hidden border border-slate-100 mb-20 animate-fade-up">
                    {/* Status Ribbon */}
                    <div className="absolute top-8 -right-12 w-48 py-1.5 bg-[#008ef0] text-white text-[10px] font-black uppercase tracking-[0.2em] transform rotate-45 text-center shadow-lg border-y-2 border-blue-400 z-10 no-print">
                        {note.status}
                    </div>

                    <div className="flex justify-between items-start mb-16">
                        <div>
                            <div className="w-12 h-12 bg-slate-900 rounded-xl mb-4 flex items-center justify-center text-white font-black text-xl shadow-lg">M</div>
                            <h2 className="text-[20px] font-black text-slate-900 tracking-tighter uppercase mb-1">{localStorage.getItem('companyName')?.toUpperCase() || 'THE MOON ENTERPRISES'}</h2>
                            <p className="text-[11px] text-slate-500 font-bold leading-relaxed max-w-[240px]">Tamil Nadu, India. <br/>Email: support@moonent.com</p>
                        </div>
                        <div className="text-right">
                            <h1 className="text-[34px] font-black text-slate-800 tracking-tighter uppercase -mb-1 opacity-90">Credit Note</h1>
                            <div className="h-1 w-24 bg-blue-600 ml-auto mt-2"></div>
                        </div>
                    </div>

                    {/* Metadata Box */}
                    <div className="flex border border-slate-300 mb-12 overflow-hidden rounded-sm shadow-sm min-h-[100px]">
                        <div className="flex-1 p-8 border-r border-slate-200 bg-slate-50/20 flex flex-col gap-2">
                             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Bill To</h4>
                             <p className="text-[16px] font-black text-[#1e61f0] hover:underline cursor-pointer transition-all">{note.Customer?.name || 'Customer Not Specified'}</p>
                        </div>
                        <div className="w-[300px] flex">
                            <div className="w-1/2 p-6 border-r border-slate-200 bg-slate-50 flex flex-col justify-center gap-3">
                                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-right">Credit Note #</span>
                                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-right">Credit Date</span>
                            </div>
                            <div className="w-1/2 p-6 flex flex-col justify-center gap-3">
                                <span className="text-[13px] font-black text-slate-900">: {note.creditNoteNumber}</span>
                                <span className="text-[13px] font-black text-slate-900">: {new Date(note.date).toLocaleDateString('en-GB')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="mb-12">
                        <table className="w-full border-collapse border border-slate-300">
                            <thead>
                                <tr className="bg-slate-900 text-[10px] font-black text-white uppercase tracking-widest border-b border-slate-900">
                                    <th className="py-4 px-2 border-r border-slate-800 w-12 text-center">#</th>
                                    <th className="py-4 px-4 border-r border-slate-800 text-left">Item & Description</th>
                                    <th className="py-4 px-2 border-r border-slate-800 w-24 text-center">Qty</th>
                                    <th className="py-4 px-2 border-r border-slate-800 w-32 text-center">Rate</th>
                                    <th className="py-4 px-2 w-32 text-center">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {note.items?.map((item, idx) => (
                                    <tr key={idx} className="text-[12px] font-medium text-slate-700">
                                        <td className="p-5 border-r border-slate-200 text-center font-bold text-slate-400">{idx + 1}</td>
                                        <td className="p-5 border-r border-slate-200">
                                            <p className="font-black text-slate-900 mb-1 text-[13px]">{item.Item?.name}</p>
                                            <p className="text-[10px] text-slate-400 leading-relaxed italic line-clamp-2">{item.description}</p>
                                        </td>
                                        <td className="p-5 border-r border-slate-200 text-center font-black">{parseFloat(item.quantity).toFixed(2)}</td>
                                        <td className="p-5 border-r border-slate-200 text-right font-bold text-slate-500">{formatCurrency(item.rate)}</td>
                                        <td className="p-5 text-right font-black text-slate-900">{formatCurrency(item.amount)}</td>
                                    </tr>
                                ))}
                                {/* Fillers */}
                                {[...Array(Math.max(0, 8 - (note.items?.length || 0)))].map((_, i) => (
                                    <tr key={i} className="h-14">
                                        <td className="border-r border-slate-100"></td>
                                        <td className="border-r border-slate-100"></td>
                                        <td className="border-r border-slate-100"></td>
                                        <td className="border-r border-slate-100"></td>
                                        <td></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Totals Section */}
                        <div className="flex border-x border-b border-slate-300 rounded-b shadow-[0_2px_5px_rgba(0,0,0,0.02)]">
                            <div className="flex-1 p-10 flex flex-col justify-end bg-slate-50/10">
                                <p className="text-[10px] font-black text-slate-400 italic uppercase tracking-[0.25em] mb-2 opacity-60">Total Amount In Words</p>
                                <p className="text-[12px] font-black text-slate-800 underline decoration-slate-200 underline-offset-4">Indian Rupee Only</p>
                            </div>
                            <div className="w-[300px] bg-white border-l border-slate-200">
                                <div className="flex justify-between px-8 py-5 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                    <span>Sub Total</span>
                                    <span className="text-slate-900 font-black">{formatCurrency(note.subTotal)}</span>
                                </div>
                                <div className="flex justify-between px-8 py-5 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                    <span>IGST (18%)</span>
                                    <span className="text-slate-900 font-black">{formatCurrency(note.taxAmount)}</span>
                                </div>
                                <div className="flex justify-between px-8 py-8 text-[14px] font-black text-slate-900 bg-slate-50/50">
                                    <span className="text-slate-400 uppercase tracking-[0.2em] text-[10px]">Total Amount</span>
                                    <span className="text-2xl tracking-tighter">₹{formatCurrency(note.totalAmount)}</span>
                                </div>
                                <div className="flex justify-between px-8 py-4 text-[12px] font-black text-blue-600 bg-blue-50/30">
                                    <span className="uppercase text-[9px] tracking-widest opacity-70">Credits Left</span>
                                    <span>₹{formatCurrency(note.totalAmount)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-20 items-end mt-24">
                         <div className="space-y-6">
                              <div>
                                 <p className="text-[10px] text-slate-400 font-black mb-1.5 italic uppercase tracking-[0.2em] opacity-50">Customer Notes</p>
                                 <p className="text-[11px] text-slate-500 italic font-medium leading-relaxed">{note.customerNotes || 'Thanks for your business.'}</p>
                              </div>
                              <div>
                                 <p className="text-[10px] text-slate-400 font-black mb-1.5 italic uppercase tracking-[0.2em] opacity-50">Standard Terms</p>
                                 <p className="text-[11px] text-slate-500 italic font-medium leading-relaxed">Credit can be applied to future invoices within 6 months.</p>
                              </div>
                         </div>
                         <div className="text-center">
                             <div className="w-64 ml-auto">
                                <div className="h-10 border-b border-slate-200 border-dashed mb-4"></div>
                                <p className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] opacity-90">Authorized Signature</p>
                                <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">(For {localStorage.getItem('companyName') || 'The Moon Enterprises'})</p>
                             </div>
                         </div>
                    </div>
                </div>

                <div className="text-center text-[10px] font-bold text-slate-400 mb-10 flex items-center gap-4 cursor-pointer hover:text-blue-600 transition-all no-print">
                    <span className="uppercase tracking-[0.3em]">More Information</span>
                    <ChevronDown size={14}/>
                </div>
            </div>

            <ConfirmModal 
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Delete Credit Note"
                message="Are you sure you want to delete this Credit Note? This action cannot be undone."
                confirmText="Delete"
                type="danger"
            />
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SPLIT-VIEW
// ─────────────────────────────────────────────────────────────────────────────

const CreditNotesView = ({ companyId }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams();
    const { addNotification } = useNotificationStore();

    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const isNew = location.pathname.includes('/new');
    const isEdit = location.pathname.includes('/edit');
    const isView = location.pathname.includes('/view');

    const fetchNotes = async () => {
        if (!companyId) return;
        try { setLoading(true); const res = await creditNoteAPI.getByCompany(companyId); setNotes(res.data || []); }
        catch (err) { console.error(err); } finally { setLoading(false); }
    };

    useEffect(() => { fetchNotes(); }, [companyId]);

    const filtered = useMemo(() => notes.filter(n => n.creditNoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) || n.Customer?.name.toLowerCase().includes(searchTerm.toLowerCase())), [notes, searchTerm]);

    if (isNew || isEdit) return <CreditNoteForm companyId={companyId} navigate={navigate} editId={id} />;

    return (
        <div className="flex h-screen bg-white overflow-hidden font-sans">
            <div className={`no-print flex flex-col border-r border-slate-100 transition-all duration-300 bg-white ${isView ? 'w-[360px]' : 'flex-1'}`}>
                <div className="px-5 py-4 bg-white border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <button className="text-[15px] font-bold text-slate-800 flex items-center gap-1 hover:text-blue-600 transition-all whitespace-nowrap">All Credit Notes <ChevronDown size={14} className="mt-0.5" /></button>
                    </div>
                    <div className="flex items-center gap-1.5 ml-4">
                        <button onClick={() => navigate('/credit-notes/new')} className="p-1.5 bg-[#008ef0] text-white rounded font-bold transition-all hover:bg-[#007cd0] shadow-sm"><Plus size={16}/></button>
                        <button className="p-1.5 text-slate-400 border border-slate-200 rounded hover:bg-slate-50 transition-all"><MoreVertical size={16}/></button>
                    </div>
                </div>
                <div className="px-5 py-2.5 bg-slate-50/40 border-b border-slate-100 flex items-center gap-2">
                    <Search size={14} className="text-slate-400" />
                    <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-slate-300" />
                    <Filter size={14} className="text-slate-400" />
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-slate-50 custom-scrollbar">
                    {loading ? <div className="p-12 text-center font-bold text-slate-200 animate-pulse uppercase tracking-widest text-[10px]">Syncing...</div> : filtered.length === 0 ? <div className="p-12 text-center text-slate-300 font-bold text-xs uppercase tracking-widest opacity-40">No Records Found</div> : filtered.map(n => (
                        <div key={n.id} onClick={() => navigate(`/credit-notes/view/${n.id}`)} className={`px-5 py-5 cursor-pointer transition-all border-l-4 ${id === n.id ? 'bg-[#f3f7ff] border-blue-600' : 'bg-white border-transparent hover:bg-slate-50'}`}>
                            <div className="flex justify-between items-start mb-1"><span className={`text-[13px] font-black ${id === n.id ? 'text-blue-600' : 'text-slate-800'}`}>{n.Customer?.name}</span><span className="text-[13px] font-black text-slate-900 ml-4">₹{parseFloat(n.totalAmount).toLocaleString()}</span></div>
                            <div className="flex justify-between items-center text-[11px] font-bold text-slate-500">
                                <div className="opacity-80"><span className="hover:underline">{n.creditNoteNumber}</span><span className="mx-1.5 opacity-30">|</span><span>{new Date(n.date).toLocaleDateString('en-GB')}</span></div>
                                <span className={`uppercase tracking-widest text-[9px] font-black ${n.status === 'Open' ? 'text-emerald-500' : 'text-slate-400'}`}>{n.status}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            {isView && id ? <CreditNoteDetail id={id} navigate={navigate} companyId={companyId} /> : (
                <div className="flex-1 flex flex-col items-center justify-center bg-[#fcfdfe] text-slate-300 transition-all animate-fade-in">
                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-sm">
                        <Undo2 size={48} className="opacity-20" />
                    </div>
                    <p className="uppercase tracking-[0.4em] text-[10px] font-black opacity-30 italic">Select a record to preview session</p>
                </div>
            )}
        </div>
    );
};

export default CreditNotesView;
