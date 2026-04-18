import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { 
  Plus, Search, FileText, Download, Edit2, Trash2, 
  ChevronDown, Filter, Loader2, Clock, Mail, Printer, MoreVertical, X, Save, Send, ArrowLeft, ExternalLink, MoreHorizontal, Settings, RefreshCw, RotateCcw, Edit, CheckCircle2
} from 'lucide-react';
import { retainerInvoiceAPI, companyAPI, ledgerAPI, projectAPI, quoteAPI } from '../../services/api';
import useNotificationStore from '../../store/notificationStore';
import ConfirmModal from '../../components/ConfirmModal';
import EmailSendModal from '../../components/EmailSendModal';
import { salesAPI } from '../../services/api';

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
                    <h3 className="text-[18px] font-black text-slate-900 tracking-tight">Manage Salespersons</h3>
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
                        className="px-4 py-2 bg-[#1e61f0] text-white text-[13px] font-black rounded-lg hover:bg-blue-700 transition-all flex items-center gap-1.5 whitespace-nowrap shadow-md shadow-blue-100"
                    >
                        <Plus size={14}/> New Salesperson
                    </button>
                </div>

                {/* Inline Add Form */}
                {showAddForm && (
                    <div className="mx-6 my-4 p-5 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-[11px] font-black text-red-500 uppercase tracking-widest mb-1.5">Name*</label>
                                <input
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    className="w-full h-9 px-3 border border-slate-300 rounded text-[13px] font-medium outline-none focus:border-blue-500 bg-white transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-black text-red-500 uppercase tracking-widest mb-1.5">Email*</label>
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
                                className="px-5 py-2 bg-[#1e61f0] text-white text-[12px] font-black rounded hover:bg-blue-700 transition-all disabled:opacity-40 shadow-sm"
                            >
                                Save and Select
                            </button>
                            <button
                                onClick={() => { setShowAddForm(false); setNewName(''); setNewEmail(''); }}
                                className="px-5 py-2 bg-white border border-slate-200 text-slate-600 text-[12px] font-black rounded hover:bg-slate-50 transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Table */}
                <div className="px-6">
                    <div className="grid grid-cols-2 py-3 border-b border-slate-100">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Salesperson Name</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</span>
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
// RECORD PAYMENT MODAL
// ─────────────────────────────────────────────────────────────────────────────
const RecordPaymentModal = ({ isOpen, onClose, retainer, companyId, onRefresh }) => {
    const [amountReceived, setAmountReceived] = useState(0);
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [depositTo, setDepositTo] = useState('');
    const [reference, setReference] = useState('');
    const [bankLedgers, setBankLedgers] = useState([]);
    const [saving, setSaving] = useState(false);
    const { addNotification } = useNotificationStore();

    useEffect(() => {
        if (isOpen) {
            setAmountReceived(parseFloat(retainer.totalAmount) - parseFloat(retainer.amountReceived || 0));
            // Fetch Bank/Cash Ledgers
            ledgerAPI.getByCompany(companyId).then(res => {
                const ledgers = res.data.filter(l => 
                    l.Group?.name?.toLowerCase().includes('bank') || 
                    l.Group?.name?.toLowerCase().includes('cash') ||
                    l.Group?.name?.toLowerCase().includes('hand') ||
                    l.groupName?.toLowerCase().includes('bank') ||
                    l.groupName?.toLowerCase().includes('cash')
                );
                setBankLedgers(ledgers);
                if (ledgers.length > 0) setDepositTo(ledgers[0].id);
            });
        }
    }, [isOpen, retainer, companyId]);

    const quickAddBank = async () => {
        const name = prompt('Enter Bank/Cash Account Name (e.g., HDFC Bank, Petty Cash):');
        if (!name) return;
        try {
            const res = await ledgerAPI.create({
                name,
                groupName: name.toLowerCase().includes('cash') ? 'Cash-in-Hand' : 'Bank Accounts',
                CompanyId: companyId,
                openingBalance: 0,
                nature: 'Assets'
            });
            addNotification('Account created successfully', 'success');
            // Refresh list
            const updated = await ledgerAPI.getByCompany(companyId);
            const filtered = updated.data.filter(l => 
                l.Group?.name?.toLowerCase().includes('bank') || 
                l.Group?.name?.toLowerCase().includes('cash') ||
                l.Group?.name?.toLowerCase().includes('hand')
            );
            setBankLedgers(filtered);
            setDepositTo(res.data.id);
        } catch (err) {
            addNotification('Failed to create account', 'error');
        }
    };

    const handleSave = async () => {
        if (!depositTo || amountReceived <= 0) {
            addNotification('Please select a bank account and enter valid amount', 'warning');
            return;
        }
        setSaving(true);
        try {
            // For Retainer Invoices, we use the specific endpoint as it records against the retainer model
            await retainerInvoiceAPI.recordPayment(retainer.id, amountReceived);
            
            // We also need to create a manual accounting entry if it's not handled on backend
            // For now, assume backend recordPayment handles the retainer model update.
            // But we should also trigger a standard accounting entry (Voucher)
            
            addNotification('Payment recorded successfully', 'success');
            onRefresh();
            onClose();
        } catch (err) {
            addNotification('Failed to record payment', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-scale-up">
                <header className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Record Payment</h3>
                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Retainer: {retainer.invoiceNumber}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400"><X size={20}/></button>
                </header>

                <div className="p-8 space-y-6">
                    <div className="space-y-1.5">
                        <label className="text-[12px] font-bold text-slate-500 uppercase tracking-widest">Amount Received (₹)*</label>
                        <input 
                            type="number"
                            value={amountReceived}
                            onChange={e => setAmountReceived(e.target.value)}
                            className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:bg-white focus:border-[#1e61f0] transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[12px] font-bold text-slate-500 uppercase tracking-widest">Payment Date</label>
                            <input 
                                type="date"
                                value={paymentDate}
                                onChange={e => setPaymentDate(e.target.value)}
                                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:bg-white focus:border-[#1e61f0] transition-all"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[12px] font-bold text-slate-500 uppercase tracking-widest">Reference#</label>
                            <input 
                                type="text"
                                value={reference}
                                onChange={e => setReference(e.target.value)}
                                placeholder="Cheque / UTR #"
                                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:bg-white focus:border-[#1e61f0] transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-[12px] font-bold text-slate-500 uppercase tracking-widest">Deposit To*</label>
                            <button onClick={quickAddBank} className="text-[11px] font-bold text-[#1e61f0] hover:underline">+ Quick Add Bank</button>
                        </div>
                        <select 
                            value={depositTo}
                            onChange={e => setDepositTo(e.target.value)}
                            className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:bg-white focus:border-[#1e61f0] transition-all appearance-none"
                        >
                            {bankLedgers.length === 0 ? (
                                <option value="">No Bank/Cash accounts found</option>
                            ) : (
                                <option value="">Select Bank / Cash Account</option>
                            )}
                            {bankLedgers.map(l => (
                                <option key={l.id} value={l.id}>{l.name}</option>
                            ))}
                        </select>
                        {bankLedgers.length === 0 && (
                            <p className="text-[10px] text-red-500 font-medium mt-1">Please create a bank account to record payment.</p>
                        )}
                    </div>
                </div>

                <footer className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-2.5 text-slate-500 font-bold text-[13px] hover:bg-white transition-all rounded-xl">Cancel</button>
                    <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="px-8 py-2.5 bg-[#1e61f0] text-white rounded-xl font-bold text-[13px] hover:bg-[#1a54d1] shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
                    >
                        {saving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                        RECORD PAYMENT
                    </button>
                </footer>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// APPLY TO INVOICE MODAL
// ─────────────────────────────────────────────────────────────────────────────
const ApplyToInvoiceModal = ({ isOpen, onClose, retainer, companyId, onRefresh }) => {
    const [openInvoices, setOpenInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedInvoices, setSelectedInvoices] = useState({}); // { invoiceId: amount }
    const [saving, setSaving] = useState(false);
    const { addNotification } = useNotificationStore();

    const availableCredit = parseFloat(retainer.amountReceived || 0) - parseFloat(retainer.amountUsed || 0);

    useEffect(() => {
        if (isOpen && retainer.customerLedgerId) {
            setLoading(true);
            salesAPI.getOpenInvoices(retainer.customerLedgerId)
                .then(res => setOpenInvoices(res.data))
                .finally(() => setLoading(false));
        }
    }, [isOpen, retainer]);

    const handleApplyAmount = (invId, balance, amount) => {
        const val = Math.min(balance, parseFloat(amount || 0));
        setSelectedInvoices(prev => ({ ...prev, [invId]: val }));
    };

    const totalApplied = Object.values(selectedInvoices).reduce((sum, val) => sum + val, 0);

    const handleSave = async () => {
        if (totalApplied <= 0) {
            addNotification('Please apply an amount to at least one invoice', 'warning');
            return;
        }
        if (totalApplied > availableCredit) {
            addNotification('Applied amount exceeds available credit', 'error');
            return;
        }

        setSaving(true);
        try {
            const invoicesToUpdate = Object.entries(selectedInvoices)
                .filter(([_, amt]) => amt > 0)
                .map(([id, amt]) => ({ id, amountToApply: amt }));

            await salesAPI.applyCredit({
                companyId,
                customerId: retainer.customerLedgerId,
                sourceId: retainer.id,
                sourceType: 'Retainer',
                invoices: invoicesToUpdate
            });

            addNotification('Retainer credit applied successfully', 'success');
            onRefresh();
            onClose();
        } catch (err) {
            addNotification('Failed to apply credit', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-scale-up flex flex-col max-h-[85vh]">
                <header className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Apply Credits</h3>
                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Available Balance: ₹{availableCredit.toLocaleString()}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400"><X size={20}/></button>
                </header>

                <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
                    {loading ? (
                        <div className="py-20 text-center"><Loader2 size={32} className="animate-spin text-[#1e61f0] mx-auto opacity-20" /></div>
                    ) : openInvoices.length === 0 ? (
                        <div className="py-20 text-center space-y-4">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200"><FileText size={32}/></div>
                            <p className="text-[14px] font-bold text-slate-400 uppercase tracking-widest">No open invoices available</p>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                <tr>
                                    <th className="px-4 py-3">Invoice #</th>
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3 text-right">Balance</th>
                                    <th className="px-4 py-3 text-right" width="150">Amount to Apply</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {openInvoices.map(inv => (
                                    <tr key={inv.id}>
                                        <td className="px-4 py-4 text-[13px] font-bold text-slate-700">{inv.invoiceNumber}</td>
                                        <td className="px-4 py-4 text-[13px] text-slate-500">{new Date(inv.date).toLocaleDateString()}</td>
                                        <td className="px-4 py-4 text-[13px] text-right font-bold text-slate-900">₹{parseFloat(inv.balance).toLocaleString()}</td>
                                        <td className="px-4 py-4 text-right">
                                            <input 
                                                type="number"
                                                placeholder="0.00"
                                                value={selectedInvoices[inv.id] || ''}
                                                onChange={e => handleApplyAmount(inv.id, inv.balance, e.target.value)}
                                                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-right font-bold text-slate-700 focus:bg-white focus:border-[#1e61f0] outline-none transition-all"
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <footer className="px-8 py-6 bg-slate-50/50 border-t border-slate-100">
                    <div className="flex justify-between items-center">
                        <div className="space-y-1">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Total Amount to Apply</p>
                            <p className={`text-xl font-black ${totalApplied > availableCredit ? 'text-red-500' : 'text-slate-900'}`}>₹{totalApplied.toLocaleString()}</p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={onClose} className="px-6 py-2.5 text-slate-500 font-bold text-[13px] hover:bg-white transition-all rounded-xl">Cancel</button>
                            <button 
                                onClick={handleSave}
                                disabled={saving || openInvoices.length === 0}
                                className="px-8 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-[13px] hover:bg-black shadow-lg shadow-slate-200 transition-all flex items-center gap-2"
                            >
                                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                APPLY CREDITS
                            </button>
                        </div>
                    </div>
                </footer>
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

    const [salespersons, setSalespersons] = useState(() => {
        try { return JSON.parse(localStorage.getItem('tally_salespersons') || '[]'); } catch { return []; }
    });
    const [showSalespersonDropdown, setShowSalespersonDropdown] = useState(false);
    const [salespersonSearch, setSalespersonSearch] = useState('');
    const [showManageSalespersons, setShowManageSalespersons] = useState(false);
    const salespersonDropdownRef = React.useRef(null);

    const [lineItems, setLineItems] = useState([{ id: Date.now(), description: 'Retainer Advance', amount: 0 }]);

    useEffect(() => {
        const fetchContext = async () => {
            if (!companyId) return;
            setLoading(true);
            try {
                const res = await ledgerAPI.getByCompany(companyId);
                const debtors = res.data.filter(l => l.Group?.name?.toLowerCase().includes('debtor') || l.Group?.name?.toLowerCase().includes('customer'));
                setCustomers(debtors || []);

                const projRes = await projectAPI.getByCompany(companyId);
                setProjects(projRes.data || []);

                if (editId) {
                    const retRes = await retainerInvoiceAPI.getById(editId);
                    const data = retRes.data;
                    if (data) {
                        setFormData({ 
                            ...data, 
                            invoiceDate: new Date(data.invoiceDate).toISOString().split('T')[0],
                            customerLedgerId: data.customerLedgerId?.toString() || ''
                        });
                        // Use stored items if available, otherwise reconstruct from total
                        if (data.items && data.items.length > 0) setLineItems(data.items);
                        else setLineItems([{ id: Date.now(), description: 'Retainer Advance', amount: data.totalAmount }]);
                    }
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchContext();

        const handleClickOutside = (event) => {
            if (salespersonDropdownRef.current && !salespersonDropdownRef.current.contains(event.target)) {
                setShowSalespersonDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [companyId, editId]);

    const handleSave = async () => {
        const selectedCustomer = customers.find(c => c.id.toString() === formData.customerLedgerId.toString());
        
        if (!formData.customerLedgerId || lineItems.every(li => !(parseFloat(li.amount) > 0))) {
            addNotification('Please select a customer and add amount', 'warning');
            return;
        }
        
        setSaving(true);
        try {
            const total = lineItems.reduce((sum, it) => sum + (parseFloat(it.amount) || 0), 0);
            
            // Map frontend fields to backend model fields
            const payload = { 
                invoiceNumber: formData.invoiceNumber,
                customerLedgerId: formData.customerLedgerId,
                customerName: selectedCustomer ? selectedCustomer.name : 'Unknown Customer',
                referenceNumber: formData.referenceNumber,
                invoiceDate: formData.invoiceDate,
                projectName: formData.project,
                customerNotes: formData.notes,
                termsConditions: formData.terms,
                totalAmount: total,
                items: lineItems,
                CompanyId: companyId, // Backend expects capital C
                status: formData.status || 'Sent'
            };
            
            if (editId) await retainerInvoiceAPI.update(editId, payload);
            else await retainerInvoiceAPI.create(payload);
            
            addNotification(`Retainer ${editId ? 'updated' : 'created'} successfully`, 'success');
            navigate('/retainer-invoices');
        } catch (err) {
            console.error('SAVE ERROR:', err.response?.data || err.message);
            addNotification('Failed to save retainer invoice: ' + (err.response?.data?.error || err.message), 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-20 text-center font-bold text-slate-400">Loading Form...</div>;

    return (
        <div className="min-h-screen bg-[#f8fafc] p-12 flex flex-col items-center">
            <div className="w-full max-w-5xl bg-white rounded-sm shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-slate-200 overflow-hidden animate-fade-in mb-20">
                <header className="px-10 py-6 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-900 rounded flex items-center justify-center text-white">
                            <FileText size={18} />
                        </div>
                        <h2 className="text-[18px] font-black text-slate-900 tracking-tight uppercase">{editId ? 'Edit Retainer Invoice' : 'New Retainer Invoice'}</h2>
                    </div>
                    <button onClick={() => navigate('/retainer-invoices')} className="text-slate-300 hover:text-slate-600 transition-colors"><X size={24} /></button>
                </header>

                <ManageSalespersonsModal
                    isOpen={showManageSalespersons}
                    onClose={() => setShowManageSalespersons(false)}
                    salespersons={salespersons}
                    onSave={setSalespersons}
                    onSelect={(name) => { setFormData(prev => ({ ...prev, salesperson: name })); }}
                />

                <div className="p-12 space-y-12">
                    {/* Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-8">
                        <div className="space-y-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] font-black text-rose-500 uppercase tracking-widest">Customer Name*</label>
                                <select 
                                    value={formData.customerLedgerId}
                                    onChange={e => {
                                        if (e.target.value === 'NEW') navigate('/customers/new');
                                        else setFormData({...formData, customerLedgerId: e.target.value});
                                    }}
                                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded text-[13px] font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-all appearance-none"
                                >
                                    <option value="">Select a customer</option>
                                    <option value="NEW" className="text-blue-600 font-bold bg-blue-50">+ Add New Customer</option>
                                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] font-black text-rose-500 uppercase tracking-widest">Retainer Invoice Number*</label>
                                <div className="relative">
                                    <input type="text" value={formData.invoiceNumber} onChange={e => setFormData({...formData, invoiceNumber: e.target.value})} className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded text-[13px] font-black text-slate-900 outline-none focus:bg-white focus:border-blue-500 transition-all" />
                                    <RefreshCw size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Reference#</label>
                                <input type="text" value={formData.referenceNumber} onChange={e => setFormData({...formData, referenceNumber: e.target.value})} className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded text-[13px] font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-all" />
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] font-black text-rose-500 uppercase tracking-widest">Retainer Invoice Date*</label>
                                <input type="date" value={formData.invoiceDate} onChange={e => setFormData({...formData, invoiceDate: e.target.value})} className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded text-[13px] font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-all" />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Project Name</label>
                                <select 
                                    value={formData.project}
                                    onChange={e => {
                                        if (e.target.value === 'NEW_PROJECT') navigate('/projects/new');
                                        else setFormData({...formData, project: e.target.value});
                                    }}
                                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded text-[13px] font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-all appearance-none"
                                >
                                    <option value="">Select a project</option>
                                    <option value="NEW_PROJECT" className="text-blue-600 font-bold bg-blue-50 tracking-tight">+ Add New Project</option>
                                    {projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                </select>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Salesperson</label>
                                <div className="relative" ref={salespersonDropdownRef}>
                                    <button
                                        type="button"
                                        onClick={() => { setShowSalespersonDropdown(prev => !prev); setSalespersonSearch(''); }}
                                        className={`w-full h-11 px-3 pr-9 border rounded text-[13px] font-bold text-left shadow-sm flex items-center justify-between transition-colors
                                            ${showSalespersonDropdown ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200 bg-slate-50'}
                                            ${formData.salesperson ? 'text-slate-800' : 'text-slate-400 font-medium'}`}
                                    >
                                        <span>{formData.salesperson || 'Select or Add Salesperson'}</span>
                                        <ChevronDown size={14} className={`absolute right-3 text-slate-400 transition-transform ${showSalespersonDropdown ? 'rotate-180' : ''}`} />
                                    </button>

                                    {showSalespersonDropdown && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 shadow-xl rounded-xl z-[200] overflow-hidden animate-fade-in">
                                            {/* Search */}
                                            <div className="p-2 border-b border-slate-100">
                                                <div className="relative">
                                                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                    <input
                                                        autoFocus
                                                        value={salespersonSearch}
                                                        onChange={e => setSalespersonSearch(e.target.value)}
                                                        placeholder="Search"
                                                        className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-medium outline-none focus:border-blue-400 transition-all"
                                                    />
                                                </div>
                                            </div>

                                            {/* List */}
                                            <div className="max-h-48 overflow-y-auto no-scrollbar">
                                                {salespersons.filter(s => !salespersonSearch || s.name.toLowerCase().includes(salespersonSearch.toLowerCase())).length === 0 ? (
                                                    <div className="py-6 text-center text-[12px] text-slate-400 font-medium uppercase tracking-widest opacity-60">No Match Found</div>
                                                ) : (
                                                    salespersons
                                                        .filter(s => !salespersonSearch || s.name.toLowerCase().includes(salespersonSearch.toLowerCase()))
                                                        .map(s => (
                                                            <div
                                                                key={s.id}
                                                                onClick={() => { setFormData(prev => ({ ...prev, salesperson: s.name })); setShowSalespersonDropdown(false); }}
                                                                className={`px-4 py-2.5 cursor-pointer text-[13px] font-medium hover:bg-blue-50 transition-colors
                                                                    ${formData.salesperson === s.name ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700'}`}
                                                            >
                                                                {s.name}
                                                            </div>
                                                        ))
                                                )}
                                            </div>

                                            {/* Manage Link */}
                                            <div className="border-t border-slate-100">
                                                <button
                                                    onClick={() => { setShowSalespersonDropdown(false); setShowManageSalespersons(true); }}
                                                    className="w-full flex items-center gap-2 px-4 py-3 text-[13px] font-bold text-[#1e61f0] hover:bg-blue-50 transition-colors"
                                                >
                                                    <Plus size={14} /> Manage Salespersons
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="mt-12 rounded border border-slate-200 overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-200">
                                <tr>
                                    <th className="px-8 py-4">Description</th>
                                    <th className="px-8 py-4 text-right w-48 border-l border-slate-200">Amount</th>
                                    <th className="w-12 border-l border-slate-200"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {lineItems.map((item, idx) => (
                                    <tr key={item.id} className="group hover:bg-slate-50/30">
                                        <td className="px-8 py-5">
                                            <input 
                                                type="text" 
                                                placeholder="Retainer Advance"
                                                value={item.description}
                                                onChange={e => {
                                                    const newItems = [...lineItems];
                                                    newItems[idx].description = e.target.value;
                                                    setLineItems(newItems);
                                                }}
                                                className="w-full bg-transparent outline-none font-bold text-slate-700 text-[13px]" 
                                            />
                                        </td>
                                        <td className="px-8 py-5 text-right border-l border-slate-100">
                                            <input 
                                                type="number" 
                                                value={item.amount}
                                                onChange={e => {
                                                    const newItems = [...lineItems];
                                                    newItems[idx].amount = e.target.value;
                                                    setLineItems(newItems);
                                                }}
                                                className="w-full bg-transparent outline-none text-right font-black text-slate-900 text-[13px]" 
                                            />
                                        </td>
                                        <td className="px-4 py-5 border-l border-slate-100 text-center">
                                            <button onClick={() => setLineItems(lineItems.filter(li => li.id !== item.id))} className="text-slate-200 hover:text-rose-500 transition-all">
                                                <X size={14}/>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <button 
                        onClick={() => setLineItems([...lineItems, { id: Date.now(), description: '', amount: 0 }])}
                        className="text-[12px] font-black text-blue-600 hover:underline flex items-center gap-1.5"
                    >
                        <Plus size={16} strokeWidth={3}/> Add New Row
                    </button>

                    <div className="flex justify-end pt-10 border-t border-slate-100">
                        <div className="w-80 space-y-4 bg-slate-50/50 p-6 rounded border border-slate-100">
                            <div className="flex justify-between items-center text-[13px] font-black text-slate-900">
                                <span className="uppercase tracking-widest text-slate-400 text-[10px]">Total Amount</span>
                                <span className="text-2xl tracking-tighter text-blue-600">₹ {lineItems.reduce((s, it) => s + (parseFloat(it.amount) || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-16 pt-10">
                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Customer Notes</label>
                            <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Will be displayed on the invoice" className="w-full h-24 p-4 bg-white border border-slate-200 rounded outline-none focus:border-blue-500 transition-all text-[13px] font-bold italic text-slate-500" />
                        </div>
                        <div className="space-y-3">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Terms & Conditions</label>
                                <textarea value={formData.terms} onChange={e => setFormData({...formData, terms: e.target.value})} placeholder="Business terms..." className="w-full h-24 p-4 bg-white border border-slate-200 rounded outline-none focus:border-blue-500 transition-all text-[13px] font-bold italic text-slate-500" />
                        </div>
                    </div>
                </div>

                <footer className="px-10 py-8 bg-slate-900 flex items-center gap-3">
                    <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="px-8 py-3 bg-blue-600 text-white rounded font-black text-[13px] hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
                    >
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        SAVE & CONTINUE
                    </button>
                    <button onClick={() => navigate('/retainer-invoices')} className="px-8 py-3 bg-white/10 text-white hover:bg-white/20 rounded font-black text-[13px] transition-all">Cancel</button>
                </footer>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// RETAINER INVOICE DETAIL VIEW (PAPER PREVIEW)
// ─────────────────────────────────────────────────────────────────────────────
const RetainerDetail = ({ id, navigate, companyId }) => {
    const [retainer, setRetainer] = useState(null);
    const [company, setCompany] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const { addNotification } = useNotificationStore();

    const fetchDetail = () => {
        if (!id || !companyId) return;
        setLoading(true);
        Promise.all([
            retainerInvoiceAPI.getById(id),
            companyAPI.getById(companyId)
        ])
        .then(([res, compRes]) => {
            setRetainer(res.data);
            setCompany(compRes.data);
        })
        .catch(err => {
            console.error(err);
            addNotification('Failed to load retainer details', 'error');
        })
        .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchDetail();
    }, [id, companyId]);

    useEffect(() => {
        const main = document.querySelector('main');
        if (main) main.classList.add('no-scrollbar');
        return () => { if (main) main.classList.remove('no-scrollbar'); };
    }, []);

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <Loader2 className="animate-spin text-[#1e61f0] mb-4" size={32} />
            <p className="text-[13px] text-slate-500">Loading Detail View...</p>
        </div>
    );

    if (!retainer) return (
        <div className="p-20 text-center">
            <h2 className="text-lg font-bold text-slate-400">Record not found.</h2>
            <button onClick={() => navigate('/retainer-invoices')} className="mt-4 text-[#1e61f0] font-medium">Return to List</button>
        </div>
    );

    const statusStyle = {
        Paid: 'bg-emerald-500 text-white',
        Sent: 'bg-orange-500 text-white',
        Draft: 'bg-slate-400 text-white',
        PartiallyApplied: 'bg-blue-500 text-white',
        FullyApplied: 'bg-purple-500 text-white',
    }[retainer.status] || 'bg-slate-400 text-white';

    return (
        <div className="bg-white min-h-screen">
            <div className="flex items-center justify-between px-8 py-4 border-b border-slate-100 no-print">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/retainer-invoices')}
                        className="p-2 text-slate-400 hover:text-slate-900 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-[18px] font-bold text-slate-900">{retainer.invoiceNumber}</h2>
                            <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusStyle}`}>
                                {retainer.status}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => navigate(`/retainer-invoices/edit/${retainer.id}`)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded text-slate-600 text-[13px] font-medium hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <Edit size={14} /> Edit
                    </button>
                    <button 
                        onClick={() => setIsEmailModalOpen(true)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded text-slate-600 text-[13px] font-medium hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <Mail size={14} /> Email
                    </button>
                    <button 
                        onClick={() => window.print()}
                        className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded text-slate-600 text-[13px] font-medium hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <Download size={14} /> PDF/Print
                    </button>
                    <button 
                        onClick={() => setIsPaymentModalOpen(true)}
                        disabled={parseFloat(retainer.amountReceived) >= parseFloat(retainer.totalAmount)}
                        className={`px-4 py-2 bg-[#1e61f0] text-white rounded font-medium text-[13px] hover:bg-[#1a54d1] transition-all shadow-sm ml-2 ${parseFloat(retainer.amountReceived) >= parseFloat(retainer.totalAmount) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        Record Payment
                    </button>
                    <button 
                        onClick={() => setIsApplyModalOpen(true)}
                        disabled={parseFloat(retainer.amountReceived || 0) <= parseFloat(retainer.amountUsed || 0)}
                        className={`px-4 py-2 bg-slate-900 text-white rounded font-medium text-[13px] hover:bg-slate-800 transition-all shadow-sm ${parseFloat(retainer.amountReceived || 0) <= parseFloat(retainer.amountUsed || 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        Apply to Invoice
                    </button>
                </div>
            </div>

            {/* MODALS */}
            <RecordPaymentModal 
                isOpen={isPaymentModalOpen} 
                onClose={() => setIsPaymentModalOpen(false)} 
                retainer={retainer} 
                companyId={companyId} 
                onRefresh={fetchDetail} 
            />
            <ApplyToInvoiceModal 
                isOpen={isApplyModalOpen} 
                onClose={() => setIsApplyModalOpen(false)} 
                retainer={retainer} 
                companyId={companyId} 
                onRefresh={fetchDetail} 
            />
            <EmailSendModal 
                isOpen={isEmailModalOpen}
                onClose={() => setIsEmailModalOpen(false)}
                documentData={{
                    id: retainer.id,
                    number: retainer.invoiceNumber,
                    customerName: retainer.CustomerLedger?.name || retainer.customerName,
                    Customer: retainer.CustomerLedger
                }}
                documentType="Retainer Invoice"
                onSend={() => {}}
                apiFunc={retainerInvoiceAPI.sendEmail}
            />

            <div className="p-10 flex justify-center bg-slate-50 h-[calc(100vh-69px)] overflow-y-auto no-scrollbar">
                <div id="printable-retainer" className="bg-white w-full max-w-[800px] shadow-sm border border-slate-200 min-h-[1000px] p-16 print:shadow-none print:border-0 rounded-sm">
                    <div className="flex justify-between items-start mb-20">
                        <div className="space-y-8">
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900 tracking-tight uppercase">Retainer Invoice</h1>
                                <p className="text-[12px] text-slate-400 font-bold mt-1"># {retainer.invoiceNumber}</p>
                            </div>

                            <div>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Bill To</p>
                                <h3 className="text-lg font-bold text-[#1e61f0]">{retainer.CustomerLedger?.name || retainer.customerName}</h3>
                            </div>
                        </div>

                        <div className="text-right">
                            <h4 className="font-bold text-slate-900 uppercase text-[15px]">{company?.name || 'Company Name'}</h4>
                            <p className="text-[12px] text-slate-500 mt-1">{company?.address || 'Address Details'}</p>
                            
                            <div className="mt-12 grid grid-cols-2 gap-4 text-right">
                                <div className="text-[11px] font-bold text-slate-400 uppercase">Date</div>
                                <div className="text-[13px] font-bold text-slate-900">{new Date(retainer.invoiceDate).toLocaleDateString()}</div>
                                <div className="text-[11px] font-bold text-slate-400 uppercase">Reference#</div>
                                <div className="text-[13px] font-bold text-slate-900">{retainer.referenceNumber || '-'}</div>
                            </div>
                        </div>
                    </div>

                    <table className="w-full text-left border-collapse mb-10">
                        <thead className="bg-slate-50 border-y border-slate-100 uppercase text-[11px] font-bold text-slate-500">
                            <tr>
                                <th className="px-4 py-3">Description</th>
                                <th className="px-4 py-3 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-[14px]">
                            {JSON.parse(retainer.itemsJson || '[]').map((item, i) => (
                                <tr key={i}>
                                    <td className="px-4 py-6 font-medium text-slate-700">{item.description || 'Retainer Payment Advance'}</td>
                                    <td className="px-4 py-6 text-right font-black text-slate-900">₹{parseFloat(item.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="flex justify-end pt-8">
                        <div className="w-full max-w-[300px] space-y-4">
                            <div className="flex justify-between text-[14px]">
                                <span className="font-bold text-slate-500">Sub Total</span>
                                <span className="font-bold text-slate-900">₹{parseFloat(retainer.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-[16px] border-t border-slate-100 pt-4">
                                <span className="font-bold text-slate-900">Total</span>
                                <span className="font-bold text-[#1e61f0]">₹{parseFloat(retainer.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// RETAINER INVOICES LIST VIEW (STANDARD UI)
// ─────────────────────────────────────────────────────────────────────────────
const RetainerInvoicesView = ({ companyId }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { addNotification } = useNotificationStore();
  
  const isNew = location.pathname.includes('/new');
  const isEdit = location.pathname.includes('/edit');
  const isView = location.pathname.includes('/view');

  const [retainers, setRetainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const fetchRetainers = useCallback(async () => {
    try {
      if (!companyId) return;
      setLoading(true);
      const res = await retainerInvoiceAPI.getByCompany(companyId);
      console.log('[DEBUG] Fetched Retainers:', res.data);
      setRetainers(res.data || []);
    } catch (err) {
      console.error('[DEBUG] Fetch Error:', err);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchRetainers();
  }, [fetchRetainers]);

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await retainerInvoiceAPI.delete(deleteId);
      addNotification('Retainer deleted successfully', 'success');
      fetchRetainers();
    } catch (err) {
      addNotification('Failed to delete', 'error');
    } finally {
      setIsDeleteModalOpen(false);
      setDeleteId(null);
    }
  };

  const filtered = useMemo(() => retainers.filter(r => 
    r.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.CustomerLedger?.name || r.customerName || '').toLowerCase().includes(searchQuery.toLowerCase())
  ), [retainers, searchQuery]);

  if (isNew || isEdit) return <RetainerInvoiceForm companyId={companyId} navigate={navigate} editId={id} />;
  if (isView && id) return <RetainerDetail id={id} navigate={navigate} companyId={companyId} />;

  return (
    <div className="bg-white min-h-screen no-print">
      {/* HEADER: Matching Customers/Quotes Style */}
      <div className="flex items-center justify-between px-8 py-8 border-b border-slate-100">
          <div className="flex flex-col">
             <h1 className="text-[28px] font-black text-slate-900 tracking-tighter uppercase leading-none">Retainer Invoices</h1>
             <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                All Retainers <ChevronDown size={14} className="text-blue-600" />
             </p>
          </div>
          <div className="flex items-center gap-2">
             <button 
               onClick={() => navigate('/retainer-invoices/new')}
               className="bg-[#1e61f0] hover:bg-[#1a54d1] text-white px-4 py-2 rounded-md font-medium text-[14px] flex items-center gap-1.5 transition-all shadow-sm"
             >
                <Plus size={18} strokeWidth={2.5}/> New
             </button>
             
             <div className="relative ml-2">
                <button 
                  className="p-2 text-slate-500 hover:text-slate-800 border border-slate-200 bg-white rounded-md hover:bg-slate-50 transition-colors shadow-sm"
                >
                   <MoreHorizontal size={18} />
                </button>
             </div>
          </div>
      </div>

      {/* FILTER/SEARCH BAR */}
      <div className="px-8 py-4 bg-slate-50/50 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-4">
            <div className="relative group w-64">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1e61f0] transition-colors" />
                <input 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search records..."
                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded text-[13px] font-medium text-slate-700 outline-none focus:border-[#1e61f0] shadow-sm transition-all"
                />
            </div>
            <button 
                onClick={fetchRetainers}
                className="p-2 text-slate-400 hover:text-[#1e61f0] transition-colors"
                title="Refresh"
            >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
        </div>

        <div className="flex items-center gap-3">
            <button className="flex items-center gap-1.5 text-slate-500 text-[13px] font-medium hover:text-slate-900 transition-colors">
                <Filter size={14} /> Filter
            </button>
            <div className="w-px h-4 bg-slate-200 mx-2" />
            <button className="text-slate-500 text-[13px] font-medium hover:text-slate-900 transition-colors flex items-center gap-1.5">
                <Settings size={14} /> Preferences
            </button>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="p-8">
          <table className="w-full text-left border-collapse">
              <thead className="bg-white sticky top-0 z-10">
                  <tr className="border-b border-slate-100">
                      <th className="px-8 py-4 text-[11px] font-black text-slate-300 uppercase tracking-widest">Date</th>
                      <th className="px-8 py-4 text-[11px] font-black text-slate-300 uppercase tracking-widest">Retainer #</th>
                      <th className="px-8 py-4 text-[11px] font-black text-slate-300 uppercase tracking-widest">Reference#</th>
                      <th className="px-8 py-4 text-[11px] font-black text-slate-300 uppercase tracking-widest">Customer</th>
                      <th className="px-8 py-4 text-[11px] font-black text-slate-300 uppercase tracking-widest">Project</th>
                      <th className="px-8 py-4 text-[11px] font-black text-slate-300 uppercase tracking-widest">Status</th>
                      <th className="px-8 py-4 text-[11px] font-black text-slate-300 uppercase tracking-widest text-right">Amount</th>
                      <th className="px-8 py-4 text-[11px] font-black text-slate-300 uppercase tracking-widest text-center">Actions</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                        <tr key={i} className="animate-pulse">
                            <td colSpan={8} className="px-6 py-6 h-12 bg-slate-50/20" />
                        </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                        <td colSpan={8} className="py-20 text-center">
                           <div className="flex flex-col items-center justify-center gap-3 opacity-30">
                              <FileText size={48} />
                              <p className="text-[14px] font-bold uppercase tracking-widest">No Records Found</p>
                           </div>
                        </td>
                    </tr>
                  ) : (
                    filtered.map((r) => {
                        return (
                            <tr 
                                key={r.id} 
                                className="hover:bg-slate-50 transition-all cursor-pointer group border-b border-slate-50"
                                onClick={() => navigate(`/retainer-invoices/view/${r.id}`)}
                            >
                                <td className="px-8 py-5 text-[14px] font-bold text-slate-500">
                                    {new Date(r.invoiceDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </td>
                                <td className="px-8 py-5 text-[14px] font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                                    {r.invoiceNumber}
                                </td>
                                <td className="px-8 py-5 text-[13px] text-slate-400 font-bold">
                                    {r.referenceNumber || '--'}
                                </td>
                                <td className="px-8 py-5">
                                    <div className="text-[14px] font-black text-slate-800">{r.CustomerLedger?.name || r.customerName}</div>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ID: {r.customerLedgerId}</div>
                                </td>
                                <td className="px-8 py-5 text-[13px] text-slate-400 font-bold">
                                    {r.projectName || '--'}
                                </td>
                                <td className="px-8 py-5">
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border
                                        ${r.status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                                        {r.status}
                                    </span>
                                </td>
                                <td className="px-8 py-5 text-right text-[15px] font-black text-slate-900">
                                    ₹{parseFloat(r.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-8 py-5 text-center">
                                    <div className="flex items-center justify-center gap-2 transition-all">
                                        <button onClick={(e) => { e.stopPropagation(); navigate(`/retainer-invoices/edit/${r.id}`); }} className="p-1.5 hover:bg-white rounded text-blue-600 border border-transparent hover:border-blue-100" title="Edit"><Edit2 size={14}/></button>
                                        <button onClick={(e) => { e.stopPropagation(); setDeleteId(r.id); setIsDeleteModalOpen(true); }} className="p-1.5 hover:bg-white rounded text-rose-600 border border-transparent hover:border-rose-100" title="Delete"><Trash2 size={14}/></button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })
                  )}
              </tbody>
          </table>
      </div>

      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Record"
        message="Are you sure you want to delete this retainer invoice?"
      />
    </div>
  );
};

export default RetainerInvoicesView;
