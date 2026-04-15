import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { creditNoteAPI, ledgerAPI, inventoryAPI, salesAPI } from '../../services/api';
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
        if (!formData.customerLedgerId || !formData.accountsReceivableId) {
            addNotification('Please select both a Customer and an AR Account.', 'error');
            return;
        }
        if (lineItems.every(li => !li.itemId)) {
            addNotification('Please add at least one item to the credit note.', 'error');
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
                            <label className="w-32 text-[12px] text-rose-500 font-bold tracking-tight">Account*</label>
                            <select 
                                value={formData.accountsReceivableId} 
                                onChange={e => setFormData({...formData, accountsReceivableId: e.target.value})}
                                className="flex-1 p-2 bg-[#f3f7ff]/50 border border-slate-200 rounded-lg text-[13px] font-semibold outline-none transition-all shadow-sm"
                            >
                                <option value="">Select AR Account</option>
                                {arAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                        </div>
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
                                    <td className="px-4 py-3"><button onClick={() => setLineItems(prev => prev.length > 1 ? prev.filter(p => p.id !== line.id) : prev)} className="text-slate-300 hover:text-rose-500 transition-all"><X size={14}/></button></td>
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
    
    // Application state
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [openInvoices, setOpenInvoices] = useState([]);

    useEffect(() => {
        if (!id) return;
        creditNoteAPI.getById(id).then(res => { setNote(res.data); setLoading(false); }).catch(() => setLoading(false));
    }, [id]);

    const formatCurrency = (val) => parseFloat(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const handleApplyToInvoices = async () => {
        if (!note?.customerLedgerId) return;
        try {
            const res = await salesAPI.getOpenInvoices(note.customerLedgerId);
            setOpenInvoices(res.data || []);
            setShowApplyModal(true);
        } catch (err) {
            addNotification('Failed to fetch open invoices', 'error');
        }
    };

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

            {/* Apply Credits Modal */}
            {showApplyModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[1000] flex items-center justify-center p-4 animate-fade-in shadow-2xl">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-in border border-slate-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="text-[15px] font-bold text-slate-800">Apply Credits to Invoices</h3>
                            <button onClick={() => setShowApplyModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={18}/></button>
                        </div>
                        <div className="p-10">
                            {openInvoices.length === 0 ? (
                                <div className="space-y-6">
                                    <p className="text-[14px] text-slate-600 leading-relaxed py-4 border-b border-slate-50">
                                        There are no invoices in the open status for this customer. Hence, credits cannot be applied.
                                    </p>
                                    <div className="flex justify-start pt-2">
                                        <button 
                                            onClick={() => setShowApplyModal(false)}
                                            className="px-6 py-2 bg-[#008ef0] text-white rounded font-bold text-[13px] hover:bg-[#007cd0] shadow-md transition-all active:scale-95"
                                        >
                                            OK
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-4">Select Invoices to Apply Credit</p>
                                    <table className="w-full text-left border-collapse border border-slate-100 rounded-lg overflow-hidden">
                                        <thead className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200">
                                            <tr>
                                                <th className="px-4 py-3">Invoice #</th>
                                                <th className="px-4 py-3">Date</th>
                                                <th className="px-4 py-3 text-right">Balance</th>
                                                <th className="px-4 py-3 text-right">Amount to Apply</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 italic text-slate-400 text-[11px]">
                                            <tr><td colSpan="4" className="p-8 text-center">Implementation of credit allocation pending selected invoice logic.</td></tr>
                                        </tbody>
                                    </table>
                                    <div className="flex justify-end gap-3 pt-6">
                                        <button onClick={() => setShowApplyModal(false)} className="px-5 py-2 border border-slate-200 text-slate-500 rounded font-bold text-[12px]">Cancel</button>
                                        <button className="px-5 py-2 bg-[#008ef0] text-white rounded font-bold text-[12px] opacity-50 cursor-not-allowed">Save Application</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

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
                    <button 
                        onClick={handleApplyToInvoices}
                        className="px-3 py-1.5 text-slate-600 hover:bg-slate-50 rounded flex items-center gap-1.5 text-[12px] font-bold transition-all"
                    >
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
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
    const [modalConfig, setModalConfig] = useState({ isOpen: false, id: null, name: '' });

    const isNew = location.pathname.includes('/new');
    const isEdit = location.pathname.includes('/edit');
    const isView = location.pathname.includes('/view');
    const isDetail = isView && id;

    const fetchNotes = async () => {
        if (!companyId) return;
        try { 
            setLoading(true); 
            const res = await creditNoteAPI.getByCompany(companyId); 
            setNotes(res.data || []); 
        } catch (err) { 
            console.error(err); 
        } finally { 
            setLoading(false); 
        }
    };

    useEffect(() => { fetchNotes(); }, [companyId, location.key]);

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const sortedNotes = useMemo(() => {
        let sortable = [...notes];
        if (sortConfig.key) {
            sortable.sort((a, b) => {
                let aVal = a[sortConfig.key];
                let bVal = b[sortConfig.key];
                if (sortConfig.key === 'customerName') { aVal = a.Customer?.name || ''; bVal = b.Customer?.name || ''; }
                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortable;
    }, [notes, sortConfig]);

    const filtered = useMemo(() => sortedNotes.filter(n => 
        n.creditNoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (n.Customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    ), [sortedNotes, searchTerm]);

    const handleDelete = async () => {
        try {
            await creditNoteAPI.delete(modalConfig.id);
            addNotification('Credit Note deleted successfully', 'success');
            setNotes(notes.filter(n => n.id !== modalConfig.id));
            setModalConfig({ isOpen: false, id: null, name: '' });
            if (id === modalConfig.id) navigate('/credit-notes');
            fetchNotes();
        } catch (err) {
            addNotification('Failed to delete credit note', 'error');
        }
    };

    if (isNew || isEdit) return <CreditNoteForm companyId={companyId} navigate={navigate} editId={id} />;

    return (
        <div className="flex h-[calc(100vh-80px)] bg-[#f8fafc] overflow-hidden animate-fade-in">
             <ConfirmModal 
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({ isOpen: false, id: null, name: '' })}
                onConfirm={handleDelete}
                title="Delete Credit Note"
                message={`Are you sure you want to delete ${modalConfig.name}? This action will permanently remove the record and cannot be undone.`}
                type="danger"
                confirmText="Permanently Delete"
            />

            {/* --- MASTER LIST (SIDEBAR) --- */}
            <div className={`flex-col border-r border-slate-200 bg-white transition-all duration-300 flex no-print ${isDetail ? 'w-[380px]' : 'w-0 opacity-0 overflow-hidden'}`}>
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">All Credit Notes</h3>
                    <div className="flex items-center gap-2">
                        <button onClick={() => navigate('/credit-notes/new')} className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-all">
                            <Plus size={16} />
                        </button>
                        <button onClick={fetchNotes} className="p-1.5 text-slate-400 hover:text-blue-600 transition-all">
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
                    {filtered.map(n => (
                        <div 
                            key={n.id}
                            onClick={() => navigate(`/credit-notes/view/${n.id}`)}
                            className={`px-6 py-4 cursor-pointer transition-all border-l-4 ${id === n.id ? 'bg-blue-50 border-blue-600' : 'hover:bg-slate-50 border-transparent'}`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className={`text-[13px] font-black ${id === n.id ? 'text-blue-600' : 'text-slate-800'}`}>{n.creditNoteNumber}</span>
                                <span className="text-[13px] font-black text-slate-900">₹{parseFloat(n.totalAmount || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                               <span className="text-[11px] font-bold text-slate-400 truncate max-w-[180px]">{n.Customer?.name}</span>
                               <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded tracking-widest ${n.status === 'Open' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>{n.status}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- MAIN AREA (TABLE OR DETAIL) --- */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {isDetail ? (
                    <CreditNoteDetail id={id} navigate={navigate} companyId={companyId} />
                ) : (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Table Header */}
                        <div className="bg-white p-8 flex items-center justify-between border-b border-slate-100">
                            <div>
                                <h1 className="text-[28px] font-black text-slate-900 tracking-tighter uppercase">Credit Notes</h1>
                                <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mt-1">Sales Returns & Adjustments</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={() => navigate('/credit-notes/new')} className="px-6 py-2.5 bg-blue-600 text-white rounded-[4px] font-black text-[13px] hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all flex items-center gap-2 uppercase tracking-widest">
                                    <Plus size={18} /> Issue Credit Note
                                </button>
                                <button onClick={fetchNotes} className="p-2.5 border border-slate-200 rounded text-slate-400 hover:bg-slate-50 transition-colors">
                                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                                </button>
                            </div>
                        </div>

                        {/* Search & Bar */}
                        <div className="px-8 py-5 border-b border-slate-50 bg-slate-50/20">
                            <div className="relative w-96 group">
                                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                <input 
                                    type="text" 
                                    placeholder="Search by number or customer..." 
                                    value={searchTerm} 
                                    onChange={e => setSearchTerm(e.target.value)} 
                                    className="w-full pl-12 pr-4 py-2 border border-slate-200 rounded-[4px] text-[13px] font-bold outline-none focus:border-blue-500 transition-all bg-white shadow-sm"
                                />
                            </div>
                        </div>

                        {/* Table Content */}
                        <div className="flex-1 overflow-auto bg-white">
                            <table className="w-full text-left">
                                <thead className="sticky top-0 bg-white z-10">
                                    <tr className="border-b border-slate-100 text-[11px] font-black text-slate-300 uppercase tracking-widest">
                                        <th className="px-10 py-5">Date</th>
                                        <th className="px-10 py-5">Credit Note #</th>
                                        <th className="px-10 py-5 cursor-pointer hover:text-blue-600" onClick={() => handleSort('customerName')}>Customer</th>
                                        <th className="px-10 py-5">Status</th>
                                        <th className="px-10 py-5 text-right">Amount</th>
                                        <th className="px-10 py-5 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {loading ? (
                                        <tr><td colSpan="6" className="py-24 text-center font-black text-slate-300 uppercase tracking-widest italic animate-pulse">Syncing Credit Data...</td></tr>
                                    ) : filtered.length === 0 ? (
                                        <tr><td colSpan="6" className="py-24 text-center text-slate-300 font-black uppercase tracking-widest italic">No credit notes found</td></tr>
                                    ) : filtered.map(n => (
                                        <tr 
                                            key={n.id} 
                                            onClick={() => navigate(`/credit-notes/view/${n.id}`)}
                                            className="hover:bg-blue-50/30 transition-colors cursor-pointer group"
                                        >
                                            <td className="px-10 py-6 text-[14px] font-bold text-slate-500">
                                                {new Date(n.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="px-10 py-6 text-[14px] font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase">{n.creditNoteNumber}</td>
                                            <td className="px-10 py-6 text-[14px] font-black text-slate-800">{n.Customer?.name}</td>
                                            <td className="px-10 py-6">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                                    n.status === 'Open' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-100'
                                                }`}>
                                                    {n.status}
                                                </span>
                                            </td>
                                            <td className="px-10 py-6 text-right font-black text-slate-900 text-[15px] tracking-tight whitespace-nowrap">
                                                ₹{parseFloat(n.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-10 py-6">
                                                <div className="flex items-center justify-center gap-2 transition-all">
                                                    <button onClick={(e) => { e.stopPropagation(); navigate(`/credit-notes/edit/${n.id}`); }} className="p-1.5 hover:bg-white rounded text-blue-600 border border-transparent hover:border-blue-100" title="Edit"><Edit2 size={14}/></button>
                                                    <button onClick={(e) => { e.stopPropagation(); setModalConfig({ isOpen: true, id: n.id, name: n.creditNoteNumber }); }} className="p-1.5 hover:bg-white rounded text-rose-600 border border-transparent hover:border-rose-100" title="Delete"><Trash2 size={14}/></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreditNotesView;
