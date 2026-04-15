import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { deliveryChallanAPI, ledgerAPI, inventoryAPI } from '../../services/api';
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
        termsConditions: 'Standard warranty and delivery terms apply.'
    });

    const [lineItems, setLineItems] = useState([
        { id: Date.now(), itemId: '', name: '', description: '', quantity: 1, rate: 0, amount: 0 }
    ]);

    const CHALLAN_TYPES = ['Supply', 'Job Work', 'Supply on Approval', 'Liquidated Damages', 'Others'];

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
            deliveryChallanAPI.getById(editId).then(res => {
                const dc = res.data;
                if (dc) {
                    setFormData({
                        ...dc,
                        date: new Date(dc.date).toISOString().split('T')[0],
                        customerName: dc.Customer?.name || ''
                    });
                    setLineItems(dc.items.map(it => ({
                        ...it,
                        name: it.Item?.name || ''
                    })));
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

    if (loading) return <div className="p-20 text-center font-bold text-slate-400 animate-pulse uppercase tracking-[0.2em] text-xs">Syncing Challan Interface...</div>;

    return (
        <div className="min-h-screen bg-white text-slate-700 font-sans p-6 max-w-5xl mx-auto shadow-2xl rounded-2xl animate-fade-in border border-slate-100 mt-6 overflow-hidden">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/delivery-challans')} className="text-slate-400 hover:text-slate-600 transition-all p-1 hover:bg-slate-50 rounded-full"><ArrowLeft size={20} /></button>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight">{editId ? 'Edit Delivery Challan' : 'New Delivery Challan'}</h1>
                </div>
                <X size={18} className="text-slate-300 cursor-pointer hover:text-slate-500" onClick={() => navigate('/delivery-challans')} />
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
                                        else {
                                            const cust = customers.find(c => c.id === e.target.value);
                                            setFormData({...formData, customerLedgerId: e.target.value, customerName: cust?.name || ''});
                                        }
                                    }}
                                    className="flex-1 p-2 bg-[#f3f7ff]/50 border border-slate-200 rounded-lg text-[13px] font-semibold outline-none transition-all shadow-sm"
                                >
                                    <option value="">Select or add a customer</option>
                                    <option value="NEW" className="text-blue-600 font-bold">➕ Add New Customer</option>
                                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <button className="p-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-all"><Search size={16}/></button>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <label className="w-32 text-[12px] text-rose-500 font-bold">Challan#*</label>
                            <input type="text" value={formData.challanNumber} onChange={e => setFormData({...formData, challanNumber: e.target.value})} className="flex-1 p-2.5 border border-slate-200 rounded-lg text-[13px] font-black outline-none focus:border-blue-400 transition-all" />
                        </div>
                        <div className="flex items-center gap-4">
                            <label className="w-32 text-[12px] text-slate-500 font-bold">Reference#</label>
                            <input type="text" value={formData.referenceNumber} onChange={e => setFormData({...formData, referenceNumber: e.target.value})} className="flex-1 p-2.5 border border-slate-200 rounded-lg text-[13px] font-semibold outline-none focus:border-blue-400 transition-all" />
                        </div>
                    </div>
                    <div className="pt-4 space-y-4">
                        <div className="flex items-center gap-4">
                            <label className="w-32 text-[12px] text-rose-500 font-bold">Challan Date*</label>
                            <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="flex-1 p-2.5 border border-slate-200 rounded-lg text-[13px] font-semibold outline-none" />
                        </div>
                        <div className="flex items-center gap-4">
                            <label className="w-32 text-[12px] text-slate-500 font-bold">Challan Type</label>
                            <select value={formData.challanType} onChange={e => setFormData({...formData, challanType: e.target.value})} className="flex-1 p-2.5 border border-slate-200 rounded-lg text-[13px] font-semibold outline-none">
                                {CHALLAN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
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
                                        <div className="text-[10px] text-slate-400 pl-2 mt-1 italic">{items.find(i => i.id === line.itemId)?.description || 'Additional description...'}</div>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-20 pt-6">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">Customer Notes</label>
                            <textarea value={formData.customerNotes} onChange={e => setFormData({...formData, customerNotes: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none h-24 focus:bg-white focus:border-blue-500 transition-all resize-none shadow-sm" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">Terms & Conditions</label>
                            <textarea value={formData.termsConditions} onChange={e => setFormData({...formData, termsConditions: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none h-24 focus:bg-white focus:border-blue-500 transition-all resize-none shadow-sm" />
                        </div>
                    </div>
                    <div className="space-y-4 bg-slate-50/50 p-8 rounded-[2rem] self-start border border-slate-100 shadow-xl">
                        <div className="flex justify-between text-xs font-bold text-slate-500"><span>Sub Total</span><span className="text-slate-900">{totals.subTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                        <div className="flex justify-between items-center text-xs font-bold text-slate-500"><span>Discount (%)</span><input type="number" value={formData.discount} onChange={e => setFormData({...formData, discount: e.target.value})} className="w-20 p-2 bg-white border border-slate-200 rounded-lg text-center" /></div>
                        <div className="flex justify-between text-xs font-bold text-slate-500"><span>Tax (IGST 18%)</span><span className="text-slate-900">+ {totals.taxAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                        <div className="flex justify-between text-xl font-black text-slate-900 pt-6 border-t font-sans"><span>Total ( ₹ )</span><span>{totals.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                    </div>
                </div>

                <div className="sticky bottom-0 bg-white border-t border-slate-100 py-3 flex justify-end gap-3 mt-10 z-[100] -mx-6 px-6 shadow-[0_-4px_10px_-5px_rgba(0,0,0,0.05)]">
                    <button onClick={() => navigate('/delivery-challans')} className="px-5 py-2 border border-slate-200 text-slate-500 rounded font-bold text-[13px]">Cancel</button>
                    <button onClick={() => handleSave('Draft')} disabled={saving} className="px-5 py-2 bg-white border border-slate-300 text-slate-700 rounded font-bold text-[13px] hover:bg-slate-50">Save as Draft</button>
                    <button onClick={() => handleSave('Open')} disabled={saving} className="px-5 py-2 bg-[#008ef0] text-white rounded font-bold text-[13px] hover:bg-[#007cd0] shadow-md flex items-center gap-2">
                        {saving ? <Loader2 className="animate-spin" size={16} /> : 'Save and Send'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// DELIVERY CHALLAN DETAIL VIEW (ZOHO STYLE REFINED)
// ─────────────────────────────────────────────────────────────────────────────

const DeliveryChallanDetail = ({ id, navigate, companyId }) => {
    const { addNotification } = useNotificationStore();
    const [challan, setChallan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    useEffect(() => {
        if (!id) return;
        deliveryChallanAPI.getById(id).then(res => { setChallan(res.data); setLoading(false); }).catch(() => setLoading(false));
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

    const handleEmail = () => {
        addNotification(`Connecting to mail server for ${challan.Customer?.name}...`, 'info');
        setTimeout(() => addNotification('Email sent', 'success'), 1500);
    };

    const handleConvertToInvoice = () => {
        // Pass data via state to ProfessionalInvoiceView
        navigate('/sales/new-invoice', { 
            state: { 
                challanData: {
                    customerLedgerId: challan.customerLedgerId,
                    referenceNumber: challan.challanNumber,
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
    if (!challan) return <div className="flex-1 flex items-center justify-center text-slate-300 font-black text-3xl opacity-20 tracking-tighter uppercase">Document Not Found</div>;

    return (
        <div className="flex-1 flex flex-col h-full bg-white animate-fade-in shadow-inner">
            {/* Breadcrumb Header */}
            <div className="bg-[#fcfdfe] border-b border-slate-200 px-6 py-2.5 flex items-center justify-between sticky top-0 z-10 no-print">
                <div className="flex items-center gap-2">
                    <button onClick={() => navigate('/delivery-challans')} className="text-[13px] font-bold text-blue-600 hover:underline flex items-center gap-1.5 uppercase transition-all">
                       <ChevronDown size={14} className="rotate-90"/> All Delivery Challans
                    </button>
                    <span className="text-slate-300">|</span>
                    <span className="text-[13px] font-black text-slate-800">{challan.challanNumber}</span>
                </div>
                <div className="flex items-center gap-4">
                   <button className="p-1.5 text-slate-400 hover:bg-slate-50 rounded-md transition-all hover:text-slate-600"><History size={16}/></button>
                   <button className="p-1.5 text-slate-400 hover:bg-slate-50 rounded-md transition-all hover:text-slate-600"><Share2 size={16}/></button>
                </div>
            </div>

            {/* Zoho Sub-Toolbar */}
            <div className="bg-white border-b border-slate-100 px-6 py-2 flex items-center justify-between shadow-sm no-print">
                <div className="flex items-center gap-1">
                    <button onClick={() => navigate(`/delivery-challans/edit/${challan.id}`)} className="px-3 py-1.5 text-slate-600 hover:bg-slate-50 rounded flex items-center gap-1.5 text-[12px] font-bold border border-transparent hover:border-slate-100 transition-all">
                        <Edit2 size={14}/> Edit
                    </button>
                    <button onClick={handleEmail} className="px-3 py-1.5 text-slate-600 hover:bg-slate-50 rounded flex items-center gap-1.5 text-[12px] font-bold transition-all">
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
                    <button className="p-1.5 text-slate-400 hover:bg-slate-50 rounded transition-all ml-1"><MoreHorizontal size={16}/></button>
                </div>
            </div>

            {/* Document Pane */}
            <div className="flex-1 overflow-y-auto p-4 md:p-12 lg:p-16 bg-[#f8fafc] flex flex-col items-center custom-scrollbar print:p-0 print:bg-white print:overflow-visible transition-all">
                <div className="bg-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-lg min-h-[1050px] w-full max-w-4xl mx-auto p-12 relative overflow-hidden border border-slate-100 mb-20 animate-fade-up print:shadow-none print:border-none print:m-0 print:rounded-none">
                    {/* Status Ribbon */}
                    <div className="absolute top-8 -right-12 w-48 py-1.5 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-[0.2em] transform rotate-45 text-center shadow-lg border-y-2 border-emerald-400 z-10 no-print">
                        {challan.status}
                    </div>

                    <div className="flex justify-between items-start mb-16">
                        <div>
                            <div className="w-12 h-12 bg-slate-900 rounded-xl mb-4 flex items-center justify-center text-white font-black text-xl shadow-lg">M</div>
                            <h2 className="text-[20px] font-black text-slate-900 tracking-tighter uppercase mb-1">{localStorage.getItem('companyName')?.toUpperCase() || 'THE MOON ENTERPRISES'}</h2>
                            <p className="text-[11px] text-slate-500 font-bold leading-relaxed max-w-[240px]">Tamil Nadu, India. <br/>Email: support@moonent.com</p>
                        </div>
                        <div className="text-right">
                            <h1 className="text-[34px] font-black text-slate-800 tracking-tighter uppercase -mb-1 opacity-90">Delivery Challan</h1>
                            <div className="h-1 w-24 bg-slate-900 ml-auto mt-2"></div>
                        </div>
                    </div>

                    {/* Metadata Box */}
                    <div className="flex border border-slate-300 mb-12 overflow-hidden rounded-sm shadow-sm min-h-[100px]">
                        <div className="flex-1 p-8 border-r border-slate-200 bg-slate-50/20 flex flex-col gap-2">
                             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Bill To</h4>
                             <p className="text-[16px] font-black text-[#1e61f0] hover:underline cursor-pointer transition-all">{challan.Customer?.name || 'Customer Not Specified'}</p>
                        </div>
                        <div className="w-[360px] flex">
                            <div className="w-1/2 p-6 border-r border-slate-200 bg-slate-50 flex flex-col justify-center gap-3">
                                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-right">Challan #</span>
                                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-right">Challan Date</span>
                            </div>
                            <div className="w-1/2 p-6 flex flex-col justify-center gap-3">
                                <span className="text-[13px] font-black text-slate-900">: {challan.challanNumber}</span>
                                <span className="text-[13px] font-black text-slate-900">: {new Date(challan.date).toLocaleDateString('en-GB')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="mb-20 print:mb-0">
                        <table className="w-full border-collapse border border-slate-300">
                            <thead>
                                <tr className="bg-slate-900 text-[10px] font-black text-white uppercase tracking-widest border-b border-slate-900 no-print">
                                    <th className="py-4 px-2 border-r border-slate-800 w-12">#</th>
                                    <th className="py-4 px-4 border-r border-slate-800 text-left">Item & Description</th>
                                    <th className="py-4 px-2 border-r border-slate-800 w-24 text-center">Qty</th>
                                    <th className="py-4 px-2 border-r border-slate-800 w-32 text-center">Rate</th>
                                    <th className="py-4 px-2 w-40 text-center">Amount</th>
                                </tr>
                                <tr className="hidden print:table-row bg-white text-[10px] font-black text-slate-900 uppercase tracking-widest border-b-2 border-slate-900">
                                    <th className="py-3 px-2 border-r border-slate-300 w-12">#</th>
                                    <th className="py-3 px-4 border-r border-slate-300 text-left">Item & Description</th>
                                    <th className="py-3 px-2 border-r border-slate-300 w-24 text-center">Qty</th>
                                    <th className="py-3 px-2 border-r border-slate-300 w-32 text-center">Rate</th>
                                    <th className="py-3 px-2 w-40 text-center">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {challan.items?.map((item, idx) => (
                                    <tr key={idx} className="text-[12px] font-medium text-slate-700">
                                        <td className="p-4 border-r border-slate-200 text-center font-bold text-slate-400">{idx + 1}</td>
                                        <td className="p-4 border-r border-slate-200">
                                            <p className="font-black text-slate-900 mb-0.5 text-[13px]">{item.Item?.name}</p>
                                            <p className="text-[10px] text-slate-400 italic line-clamp-1">{item.description}</p>
                                        </td>
                                        <td className="p-4 border-r border-slate-200 text-center font-black">{parseFloat(item.quantity).toFixed(2)}</td>
                                        <td className="p-4 border-r border-slate-200 text-right font-bold text-slate-500">{formatCurrency(item.rate)}</td>
                                        <td className="p-4 text-right font-black text-slate-900">{formatCurrency(item.amount)}</td>
                                    </tr>
                                ))}
                                {/* Fillers */}
                                {[...Array(Math.max(0, 5 - (challan.items?.length || 0)))].map((_, i) => (
                                    <tr key={i} className="h-12">
                                        <td className="border-r border-slate-100"></td>
                                        <td className="border-r border-slate-100"></td>
                                        <td className="border-r border-slate-100"></td>
                                        <td className="border-r border-slate-100"></td>
                                        <td></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Totals Section Refactored for Print Stability */}
                        <div className="flex border-x border-b border-slate-300 rounded-b overflow-hidden break-inside-avoid">
                            <div className="flex-1 p-8 flex flex-col justify-end bg-slate-50/10">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Amount In Words</p>
                                <p className="text-[11px] font-black text-slate-800 uppercase tracking-tighter">Indian Rupee Only</p>
                            </div>
                            <div className="w-[320px] bg-white border-l border-slate-200 pt-2 pb-1">
                                <div className="flex justify-between px-8 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                    <span>Sub Total</span>
                                    <span className="text-slate-900 font-black">{formatCurrency(challan.subTotal)}</span>
                                </div>
                                <div className="flex justify-between px-8 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50">
                                    <span>IGST (18%)</span>
                                    <span className="text-slate-900 font-black">{formatCurrency(challan.taxAmount)}</span>
                                </div>
                                <div className="flex justify-between px-8 py-5 text-[15px] font-black text-slate-900 bg-slate-100/50" style={{ webkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                                    <span className="text-slate-500 uppercase tracking-[0.1em] text-[10px] mt-1">Grand Total</span>
                                    <span className="text-xl tracking-tight">₹{formatCurrency(challan.totalAmount)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-20 items-end mt-24">
                         <div className="space-y-6">
                              <div>
                                 <p className="text-[10px] text-slate-400 font-black mb-1.5 italic uppercase tracking-[0.2em] opacity-50">Customer Notes</p>
                                 <p className="text-[11px] text-slate-500 italic font-medium leading-relaxed">{challan.customerNotes || 'Thanks for your business.'}</p>
                              </div>
                              <div>
                                 <p className="text-[10px] text-slate-400 font-black mb-1.5 italic uppercase tracking-[0.2em] opacity-50">Standard Terms</p>
                                 <p className="text-[11px] text-slate-500 italic font-medium leading-relaxed">Goods once sold will not be taken back. Subject to local jurisdiction.</p>
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

                <div className="text-center pb-20 no-print">
                     <button className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] flex items-center justify-center gap-2 mx-auto hover:text-blue-500 transition-all cursor-pointer">
                        More Information <ChevronDown size={14}/>
                     </button>
                </div>
            </div>

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

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SPLIT-VIEW
// ─────────────────────────────────────────────────────────────────────────────

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

            {/* --- MASTER LIST (SIDEBAR) --- */}
            <div className={`flex-col border-r border-slate-200 bg-white transition-all duration-300 flex no-print ${isDetail ? 'w-[380px]' : 'w-0 opacity-0 overflow-hidden'}`}>
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">All Challans</h3>
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
                                <span className={`text-[13px] font-black ${id === c.id ? 'text-blue-600' : 'text-slate-800'}`}>{c.challanNumber}</span>
                                <span className="text-[13px] font-black text-slate-900">₹{parseFloat(c.totalAmount).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                               <span className="text-[11px] font-bold text-slate-400 truncate max-w-[180px]">{c.Customer?.name}</span>
                               <span className="text-[9px] font-black uppercase text-slate-300 border border-slate-100 px-1.5 py-0.5 rounded tracking-widest">{new Date(c.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- MAIN AREA (TABLE OR DETAIL) --- */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {isDetail ? (
                    <DeliveryChallanDetail id={id} navigate={navigate} companyId={companyId} />
                ) : (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Table Header */}
                        <div className="bg-white px-8 py-7 flex items-center justify-between border-b border-slate-200">
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Delivery Challans</h1>
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Manage product shipments and job work</p>
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
                                <button onClick={() => navigate('/delivery-challans/new')} className="bg-[#1e61f0] hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-black text-[13px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-blue-200">
                                    <Plus size={18} strokeWidth={3} /> New Challan
                                </button>
                                <button onClick={fetchChallans} className="p-3 bg-white border border-slate-200 text-slate-400 rounded-2xl hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm">
                                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                                </button>
                            </div>
                        </div>

                        {/* Table Content */}
                        <div className="flex-1 overflow-auto p-10 bg-slate-50/50">
                            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
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
                                            <tr><td colSpan="6" className="py-32 text-center font-black text-slate-300 uppercase tracking-widest italic animate-pulse">Syncing Challans...</td></tr>
                                        ) : filtered.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="py-32 text-center">
                                                    <div className="flex flex-col items-center opacity-30">
                                                        <Truck size={64} strokeWidth={1} className="text-slate-400 mb-4" />
                                                        <span className="text-sm font-black text-slate-500 uppercase tracking-[0.4em]">No Shipments Recorded</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : filtered.map(c => (
                                            <tr 
                                                key={c.id} 
                                                onClick={() => navigate(`/delivery-challans/view/${c.id}`)}
                                                className={`hover:bg-blue-50/30 cursor-pointer transition-all group`}
                                            >
                                                <td className="px-10 py-6 text-[14px] font-bold text-slate-600">
                                                    {new Date(c.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </td>
                                                <td className="px-10 py-6 text-[14px] font-black text-blue-600">
                                                    {c.challanNumber}
                                                </td>
                                                <td className="px-10 py-6">
                                                    <div className="flex items-center gap-3">
                                                       <div className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 font-bold text-[13px]">{c.Customer?.name?.charAt(0)}</div>
                                                       <div>
                                                           <div className="text-[14px] font-black text-slate-800">{c.Customer?.name}</div>
                                                           {c.referenceNumber && <div className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">{c.referenceNumber}</div>}
                                                       </div>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-6">
                                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] ${
                                                        c.status === 'Open' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-400 border border-slate-100'
                                                    }`}>
                                                        {c.status}
                                                    </span>
                                                </td>
                                                <td className="px-10 py-6 text-[16px] font-black text-slate-900 text-right font-sans">
                                                    ₹{parseFloat(c.totalAmount).toLocaleString()}
                                                </td>
                                                <td className="px-10 py-6">
                                                    <div className="flex items-center justify-center gap-1 transition-all">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); navigate(`/delivery-challans/edit/${c.id}`); }}
                                                            className="p-2.5 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-xl transition-all"
                                                        >
                                                            <Edit2 size={16}/>
                                                        </button>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); setDeleteId(c.id); }}
                                                            className="p-2.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-all"
                                                        >
                                                            <Trash2 size={16}/>
                                                        </button>
                                                    </div>
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
