import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { 
    Plus, Calendar, RefreshCw, MoreHorizontal, Edit2, Trash2, 
    Settings, CheckCircle2, AlertCircle, Clock, ArrowRight,
    Package, User, Search, X, ChevronRight, FileText,
    Filter, Download, ArrowLeft, Loader2, Save, Send,
    Trash, Info, HelpCircle, Tag, Paperclip, ChevronDown, Check,
    AlertTriangle, FileEdit, Printer, Mail, MoreVertical,
    History, Share2, DollarSign
} from 'lucide-react';
import { retainerInvoiceAPI, ledgerAPI, salesAPI, projectAPI } from '../../services/api';
import useNotificationStore from '../../store/notificationStore';
import ConfirmModal from '../../components/ConfirmModal';
import { getCurrencyDisplay } from '../../utils/currencies';

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
                        className="px-4 py-2 bg-[#1e61f0] text-white text-[13px] font-bold rounded-lg hover:bg-blue-700 transition-all flex items-center gap-1.5 whitespace-nowrap"
                    >
                        <Plus size={14}/> New Salesperson
                    </button>
                </div>
                {showAddForm && (
                    <div className="mx-6 my-4 p-5 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-[11px] font-bold text-red-500 uppercase tracking-widest mb-1.5">Name*</label>
                                <input value={newName} onChange={e => setNewName(e.target.value)} className="w-full h-9 px-3 border border-slate-300 rounded text-[13px] font-medium outline-none focus:border-blue-500 bg-white" />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-red-500 uppercase tracking-widest mb-1.5">Email*</label>
                                <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="w-full h-9 px-3 border border-slate-300 rounded text-[13px] font-medium outline-none focus:border-blue-500 bg-white" />
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={handleSaveAndSelect} disabled={!newName.trim()} className="px-5 py-2 bg-[#1e61f0] text-white text-[12px] font-bold rounded hover:bg-blue-700">Save and Select</button>
                            <button onClick={() => { setShowAddForm(false); setNewName(''); setNewEmail(''); }} className="px-5 py-2 bg-white border border-slate-200 text-slate-600 text-[12px] font-bold rounded">Cancel</button>
                        </div>
                    </div>
                )}
                <div className="max-h-56 overflow-y-auto px-6">
                    {filtered.map(s => (
                        <div key={s.id} onClick={() => { onSelect(s.name); onClose(); }} className="grid grid-cols-2 py-3 border-b border-slate-50 hover:bg-blue-50 cursor-pointer rounded transition-colors">
                            <span className="text-[13px] font-bold text-[#1e61f0]">{s.name}</span>
                            <span className="text-[13px] text-slate-500 font-medium">{s.email || '—'}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// RETAINER INVOICE FORM (COMPONENT)
// ─────────────────────────────────────────────────────────────────────────────
const RetainerInvoiceForm = ({ companyId, navigate, editId }) => {
    const { addNotification } = useNotificationStore();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [salespersons, setSalespersons] = useState(() => {
        try { return JSON.parse(localStorage.getItem('tally_salespersons') || '[]'); } catch { return []; }
    });
    
    const [formData, setFormData] = useState({
        invoiceNumber: `RET-${Math.floor(10000 + Math.random() * 90000)}`,
        customerLedgerId: '',
        referenceNumber: '',
        invoiceDate: new Date().toISOString().split('T')[0],
        project: '',
        salesperson: '',
        notes: '',
        terms: '',
        totalAmount: 0,
        status: 'Sent'
    });

    const [lineItems, setLineItems] = useState([{ id: Date.now(), description: 'Retainer Advance', amount: 0 }]);

    useEffect(() => {
        const fetchContext = async () => {
            if (!companyId) return;
            setLoading(true);
            try {
                const res = await ledgerAPI.getByCompany(companyId);
                const debtors = res.data.filter(l => l.Group?.name?.toLowerCase().includes('debtor') || l.Group?.name?.toLowerCase().includes('customer') || l.groupName?.toLowerCase().includes('debtor') || l.groupName?.toLowerCase().includes('customer'));
                setCustomers(debtors || []);
                const projRes = await projectAPI.getByCompany(companyId);
                setProjects(projRes.data || []);

                if (editId) {
                    const retRes = await retainerInvoiceAPI.getById(editId);
                    const data = retRes.data;
                    if (data) {
                        setFormData({ ...data, invoiceDate: new Date(data.invoiceDate).toISOString().split('T')[0] });
                        if (data.items) setLineItems(data.items);
                    }
                }
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetchContext();
    }, [companyId, editId]);

    const handleSave = async () => {
        if (!formData.customerLedgerId) { addNotification('Please select a customer', 'warning'); return; }
        setSaving(true);
        try {
            const total = lineItems.reduce((sum, it) => sum + (parseFloat(it.amount) || 0), 0);
            const payload = { ...formData, totalAmount: total, items: lineItems, CompanyId: companyId };
            if (editId) await retainerInvoiceAPI.update(editId, payload);
            else await retainerInvoiceAPI.create(payload);
            addNotification('Retainer saved', 'success');
            navigate('/retainer-invoices');
        } catch (err) { addNotification('Failed to save', 'error'); }
        finally { setSaving(false); }
    };

    if (loading) return <div className="p-20 text-center font-bold text-slate-400">Loading Retainer Interface...</div>;

    return (
        <div className="flex flex-col h-full bg-[#f8fafc] relative">
            <header className="sticky top-0 bg-white border-b border-slate-100 px-12 py-4 flex items-center justify-between z-20 shadow-sm shrink-0">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate('/retainer-invoices')} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-[#1e61f0] transition-all"><ArrowLeft size={22} /></button>
                    <div>
                        <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">{editId ? 'Edit Retainer' : 'New Retainer'}</h2>
                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Advance Payment Management</p>
                    </div>
                </div>
                <button onClick={() => navigate('/retainer-invoices')} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><X size={24} /></button>
            </header>

            <div className="flex-1 bg-[#f8fafc] overflow-y-auto no-scrollbar">
                <div className="max-w-[1000px] mx-auto py-10 px-6">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-12 space-y-12 animate-fade-in">
                        <div className="grid grid-cols-2 gap-x-12 gap-y-8">
                            <div className="space-y-2.5">
                                <label className="text-[11px] font-bold text-red-500 uppercase tracking-widest ml-1">Customer Selection*</label>
                                <select value={formData.customerLedgerId} onChange={e => setFormData({...formData, customerLedgerId: e.target.value})} className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-all">
                                    <option value="">Select a customer...</option>
                                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2.5">
                                <label className="text-[11px] font-bold text-red-500 uppercase tracking-widest ml-1">Retainer Number*</label>
                                <input type="text" value={formData.invoiceNumber} onChange={e => setFormData({...formData, invoiceNumber: e.target.value})} className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-all" />
                            </div>
                            <div className="space-y-2.5">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Reference ID</label>
                                <input type="text" value={formData.referenceNumber} onChange={e => setFormData({...formData, referenceNumber: e.target.value})} className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-all" />
                            </div>
                            <div className="space-y-2.5">
                                <label className="text-[11px] font-bold text-red-500 uppercase tracking-widest ml-1">Retainer Date*</label>
                                <input type="date" value={formData.invoiceDate} onChange={e => setFormData({...formData, invoiceDate: e.target.value})} className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-all" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-[14px] font-bold text-slate-900 uppercase tracking-tight">Line Items</h3>
                            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                                <table className="w-full border-collapse">
                                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                        <tr><th className="px-6 py-4 text-left">Description</th><th className="px-6 py-4 text-right w-40">Amount</th><th className="w-12"></th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {lineItems.map(it => (
                                            <tr key={it.id}>
                                                <td className="px-6 py-5"><input value={it.description} onChange={e => setLineItems(prev => prev.map(p => p.id === it.id ? {...p, description: e.target.value} : p))} className="w-full bg-transparent border-none outline-none text-[14px] font-bold text-slate-700" /></td>
                                                <td className="px-6 py-5 align-top flex items-center justify-end gap-2 text-slate-700 font-bold text-[14px]">
                                                    <span>{getCurrencyDisplay(customers.find(c => String(c.id) === String(formData.customerLedgerId))?.currency)}</span>
                                                    <input type="number" value={it.amount} onChange={e => setLineItems(prev => prev.map(p => p.id === it.id ? {...p, amount: e.target.value} : p))} className="w-24 text-right bg-transparent border-none outline-none font-bold text-slate-700" />
                                                </td>
                                                <td className="px-4 py-5"><button onClick={() => setLineItems(prev => prev.filter(p => p.id !== it.id))} className="text-slate-300 hover:text-red-500"><Trash2 size={16}/></button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <button onClick={() => setLineItems([...lineItems, { id: Date.now(), description: '', amount: 0 }])} className="flex items-center gap-2 px-4 py-2 text-[#1e61f0] text-[12px] font-bold hover:bg-blue-50 rounded transition-all"><Plus size={14} /> Add Line</button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-slate-100 px-12 py-4 flex items-center justify-between z-20 shadow-md shrink-0">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Advance payment will be credited to customer account</div>
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/retainer-invoices')} className="px-6 py-2.5 text-slate-500 text-[13px] font-bold hover:bg-slate-100 rounded">Discard</button>
                    <button onClick={handleSave} disabled={saving} className="px-10 py-2.5 bg-slate-900 text-white rounded font-bold text-[13px] hover:bg-black shadow-xl flex items-center gap-2">
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        {saving ? 'Saving...' : (editId ? 'Update Retainer' : 'Save Retainer')}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// RETAINER INVOICE DETAIL VIEW
// ─────────────────────────────────────────────────────────────────────────────
const RetainerInvoiceDetail = ({ id, navigate, companyId }) => {
    const [note, setNote] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        retainerInvoiceAPI.getById(id).then(res => { setNote(res.data); setLoading(false); }).catch(() => setLoading(false));
    }, [id]);

    if (loading) return <div className="p-20 text-center font-bold text-slate-300 animate-pulse uppercase tracking-widest">Syncing Records...</div>;
    if (!note) return <div className="p-20 text-center text-slate-300 font-bold text-2xl opacity-20 uppercase">Not Found</div>;

    return (
        <div className="flex-1 flex flex-col h-full bg-[#f8fafc] animate-fade-in shadow-inner overflow-hidden">
            <div className="bg-[#fcfdfe] border-b border-slate-200 px-8 py-2.5 flex items-center justify-between no-print">
                <div className="flex items-center gap-2">
                    <button onClick={() => navigate('/retainer-invoices')} className="text-[13px] font-bold text-blue-600 hover:underline">All Retainers</button>
                    <span className="text-slate-300">|</span>
                    <span className="text-[13px] font-bold text-slate-800">{note.invoiceNumber}</span>
                </div>
                <div className="flex items-center gap-3">
                   <button onClick={() => navigate(`/retainer-invoices/edit/${note.id}`)} className="px-3 py-1.5 text-slate-600 hover:bg-slate-50 rounded flex items-center gap-1.5 text-[12px] font-bold border border-transparent hover:border-slate-100 transition-all"><Edit2 size={14}/> Edit</button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                <div className="bg-white shadow-2xl rounded-2xl min-h-[600px] w-full max-w-[800px] mx-auto p-20 border border-slate-100">
                    <div className="flex justify-between items-start mb-24">
                        <div className="space-y-4">
                            <h2 className="text-[22px] font-bold text-slate-900 tracking-tighter uppercase">{sessionStorage.getItem('companyName')}</h2>
                            <p className="text-[12px] text-slate-400 font-bold uppercase tracking-widest">Retainer Invoice</p>
                        </div>
                        <div className="text-right">
                            <h1 className="text-[42px] font-bold text-slate-900 tracking-tighter uppercase leading-none opacity-10">ADVANCE</h1>
                            <p className="text-[18px] font-bold text-slate-900 tracking-tight mt-4">{note.invoiceNumber}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-20 mb-20">
                        <div className="space-y-3">
                            <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Customer</h5>
                            <p className="text-[18px] font-bold text-[#1e61f0]">{note.CustomerLedger?.name || note.customerName}</p>
                        </div>
                        <div className="text-right space-y-3">
                            <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Date Issued</h5>
                            <p className="text-[18px] font-bold text-slate-900">{new Date(note.invoiceDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                        </div>
                    </div>
                    <table className="w-full mb-12">
                        <thead><tr className="border-b-2 border-slate-900 text-[10px] font-bold uppercase tracking-widest">
                            <th className="py-4 text-left">Description</th><th className="py-4 text-right">Amount</th>
                        </tr></thead>
                        <tbody className="divide-y divide-slate-100">
                            {note.items?.map((it, idx) => (
                                <tr key={idx}>
                                    <td className="py-6"><p className="text-[14px] font-bold text-slate-800">{it.description}</p></td>
                                    <td className="py-6 text-right text-[14px] font-bold text-slate-900">{getCurrencyDisplay(note.CustomerLedger?.currency)} {parseFloat(it.amount).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="flex justify-end"><div className="w-64 border-t-2 border-slate-900 pt-6 flex justify-between items-center text-[18px] font-bold uppercase tracking-tighter"><span>Total</span><span>{getCurrencyDisplay(note.CustomerLedger?.currency)} {parseFloat(note.totalAmount).toLocaleString()}</span></div></div>
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN VIEW COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const RetainerInvoicesView = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();
    const companyId = sessionStorage.getItem('companyId');
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchNotes = async () => {
        try {
            setLoading(true);
            const res = await retainerInvoiceAPI.getByCompany(companyId);
            setNotes(res.data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { if (companyId) fetchNotes(); }, [companyId]);

    if (location.pathname === '/retainer-invoices/new' || location.pathname.includes('/edit/')) {
        return <RetainerInvoiceForm companyId={companyId} navigate={navigate} editId={id} />;
    }

    return (
        <div className="flex h-screen bg-white font-sans overflow-hidden">
            <div className={`flex flex-col border-r border-slate-100 transition-all duration-300 no-print ${id ? 'w-[380px]' : 'w-[420px]'}`}>
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                    <div><h2 className="text-[16px] font-bold text-slate-900 tracking-tight">Retainers</h2><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Advance Payments</p></div>
                    <button onClick={() => navigate('/retainer-invoices/new')} className="p-2 bg-[#1e61f0] text-white rounded-lg shadow-lg active:scale-95 transition-all"><Plus size={18}/></button>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-slate-50 custom-scrollbar">
                    {loading ? <div className="p-20 text-center animate-pulse"><Loader2 size={24} className="animate-spin text-blue-100 mx-auto" /></div> : notes.length === 0 ? <div className="p-20 text-center text-slate-200 italic font-bold uppercase tracking-widest text-[10px] opacity-40">No Records Found</div> : notes.map(n => (
                        <div key={n.id} onClick={() => navigate(`/retainer-invoices/view/${n.id}`)} className={`px-8 py-6 cursor-pointer transition-all border-l-4 ${id === n.id ? 'bg-blue-50 border-blue-600' : 'bg-white border-transparent hover:bg-slate-50'}`}>
                            <div className="flex justify-between items-start mb-2"><span className="text-[14px] font-bold text-slate-900">{n.CustomerLedger?.name || n.customerName}</span><span className="text-[14px] font-bold text-slate-900 font-mono">{getCurrencyDisplay(n.CustomerLedger?.currency)} {parseFloat(n.totalAmount).toLocaleString()}</span></div>
                            <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{n.invoiceNumber} | {new Date(n.invoiceDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span></div>
                        </div>
                    ))}
                </div>
            </div>
            {id ? <RetainerInvoiceDetail id={id} navigate={navigate} companyId={companyId} /> : <div className="flex-1 flex flex-col items-center justify-center bg-slate-50/30 text-center p-20"><div className="w-24 h-24 bg-white rounded-[2rem] shadow-xl flex items-center justify-center text-slate-200 mb-8 border border-slate-100"><DollarSign size={40} strokeWidth={1.5} /></div><h3 className="text-[20px] font-bold text-slate-900 tracking-tighter uppercase mb-2">Advance Hub</h3><p className="text-[12px] text-slate-400 font-bold uppercase tracking-widest max-w-[240px]">Select a document to view details</p></div>}
        </div>
    );
};

export default RetainerInvoicesView;
