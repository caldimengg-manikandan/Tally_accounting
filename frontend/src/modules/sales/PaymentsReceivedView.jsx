import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { 
    Search, 
    Filter, 
    Plus, 
    ChevronDown, 
    Printer, 
    Mail, 
    Trash2, 
    MoreVertical, 
    History, 
    CreditCard, 
    Banknote, 
    ChevronRight,
    FileText,
    ArrowRight,
    MousePointer2,
    Calendar,
    User,
    Hash
} from 'lucide-react';
import { voucherAPI } from '../../services/api';
import useNotificationStore from '../../store/notificationStore';

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENT RECEIPT PREVIEW COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const PaymentReceiptDetail = ({ id, navigate, companyId }) => {
    const [payment, setPayment] = useState(null);
    const [loading, setLoading] = useState(true);
    const { addNotification } = useNotificationStore();

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                setLoading(true);
                const res = await voucherAPI.getById(id);
                setPayment(res.data);
            } catch (err) {
                console.error(err);
                addNotification('Failed to load payment detail', 'error');
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchDetail();
    }, [id]);

    if (loading) return (
        <div className="flex-1 flex flex-col items-center justify-center bg-white">
            <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin mb-4" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Loading Receipt...</p>
        </div>
    );

    if (!payment) return null;

    // Derived Data
    const amount = payment.Transactions.reduce((s, t) => s + parseFloat(t.credit || 0), 0);
    const customer = payment.Transactions.find(t => t.Ledger?.Group?.name?.includes('Sundry Debtors') || t.Ledger?.Group?.name?.includes('Customer'))?.Ledger;
    const bank = payment.Transactions.find(t => t.Ledger?.Group?.name?.includes('Bank') || t.Ledger?.Group?.name?.includes('Cash'))?.Ledger;

    return (
        <div className="flex-1 flex flex-col h-full bg-[#f8fafc] overflow-hidden">
            {/* Toolbar */}
            <div className="bg-white border-b border-slate-100 px-8 py-3 flex items-center justify-between shadow-sm z-10 no-print">
                <div className="flex items-center gap-1.5">
                    <h3 className="text-[13px] font-black text-slate-900 mr-4">Payment Receipt</h3>
                    <div className="h-4 w-px bg-slate-200 mx-2" />
                    <button className="px-3 py-1.5 text-slate-600 hover:bg-slate-50 rounded flex items-center gap-1.5 text-[12px] font-bold transition-all">
                        <Printer size={14}/> PDF/Print <ChevronDown size={14}/>
                    </button>
                    <button className="px-3 py-1.5 text-slate-600 hover:bg-slate-50 rounded flex items-center gap-1.5 text-[12px] font-bold transition-all">
                        <Mail size={14}/> Email
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded transition-all">
                        <Trash2 size={16}/>
                    </button>
                </div>
            </div>

            {/* Receipt Preview */}
            <div className="flex-1 overflow-y-auto p-16 flex flex-col items-center custom-scrollbar print:p-0 print:bg-white transition-all bg-[#f8fafc]">
                <div className="bg-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-lg min-h-[800px] w-full max-w-3xl mx-auto p-16 relative overflow-hidden border border-slate-100 mb-20 animate-fade-up">
                    
                    {/* Status Stamp */}
                    <div className="absolute top-10 right-10 rotate-12 opacity-20 no-print">
                        <div className="border-4 border-emerald-500 text-emerald-500 px-6 py-2 text-2xl font-black uppercase tracking-widest rounded-lg">Success</div>
                    </div>

                    <div className="flex justify-between items-start mb-20">
                        <div>
                            <div className="w-12 h-12 bg-slate-900 rounded-xl mb-4 flex items-center justify-center text-white font-black text-xl shadow-lg">M</div>
                            <h2 className="text-[20px] font-black text-slate-900 tracking-tighter uppercase mb-1">{localStorage.getItem('companyName')?.toUpperCase() || 'THE MOON ENTERPRISES'}</h2>
                            <p className="text-[11px] text-slate-500 font-bold leading-relaxed">Tamil Nadu, India. <br/>Email: support@moonent.com</p>
                        </div>
                        <div className="text-right">
                            <h1 className="text-[34px] font-black text-slate-800 tracking-tighter uppercase -mb-1 opacity-90">Payment Receipt</h1>
                            <div className="h-1 w-24 bg-blue-600 ml-auto mt-2"></div>
                        </div>
                    </div>

                    {/* Receipt Core Information */}
                    <div className="bg-blue-600 rounded-xl p-10 mb-12 text-white flex justify-between items-center shadow-lg shadow-blue-200">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Reference Number</p>
                            <h4 className="text-2xl font-black tracking-tight">{payment.voucherNumber}</h4>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Payment Date</p>
                            <h4 className="text-2xl font-black tracking-tight">{new Date(payment.date).toLocaleDateString('en-GB')}</h4>
                        </div>
                    </div>

                    {/* Transaction Details */}
                    <div className="grid grid-cols-2 gap-16 mb-16">
                        <div className="space-y-6">
                            <div>
                                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 leading-none">Received From</h5>
                                <p className="text-[16px] font-black text-blue-600 hover:underline cursor-pointer transition-all">{customer?.name || 'Customer'}</p>
                            </div>
                            <div>
                                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 leading-none">Payment Mode</h5>
                                <div className="flex items-center gap-2 text-[14px] font-black text-slate-800">
                                    <Banknote size={16} className="text-emerald-500" />
                                    <span>{bank?.name || 'Bank Transfer'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-8 border border-slate-100 flex flex-col justify-center items-center">
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2 opacity-60">Amount Received</p>
                            <h3 className="text-4xl font-black text-slate-900 tracking-tighter">₹{parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
                            <div className="mt-4 px-3 py-1 bg-emerald-100 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-full">Fully Cleared</div>
                        </div>
                    </div>

                    {/* Narration */}
                    <div className="border-t border-slate-100 pt-8 mb-20">
                         <h5 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4 opacity-70 italic">Payment Description / Narration</h5>
                         <p className="text-[13px] text-slate-600 font-medium leading-relaxed italic border-l-4 border-slate-100 pl-6">{payment.narration || 'Payment received against outstanding invoices. We appreciate your prompt payment.'}</p>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-between items-end">
                         <div>
                             <p className="text-[9px] text-slate-400 font-bold max-w-[200px]">This is a computer generated receipt and does not require a physical signature.</p>
                         </div>
                         <div className="text-center">
                             <div className="w-56 ml-auto">
                                <div className="h-10 border-b border-slate-200 border-dashed mb-4"></div>
                                <p className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] opacity-90">Authorized Representative</p>
                                <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest tracking-tight">({localStorage.getItem('companyName') || 'The Moon Enterprises'})</p>
                             </div>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY STATE COMPONENT (ZOHO STYLE)
// ─────────────────────────────────────────────────────────────────────────────

const PaymentsEmptyState = ({ onGoToInvoices }) => {
    return (
        <div className="flex-1 flex flex-col items-center justify-center bg-white p-20 animate-fade-in text-center">
            <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">No payments received, yet</h2>
            <p className="text-[14px] text-slate-500 font-medium mb-10 max-w-sm">Payments will be added once your customers pay for their invoices.</p>
            
            <div className="flex items-center gap-4 mb-20">
                <button 
                  onClick={onGoToInvoices}
                  className="bg-blue-600 text-white px-8 py-3.5 rounded-lg font-black text-[13px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100"
                >
                    Go to Unpaid Invoices
                </button>
                <button className="text-blue-600 px-8 py-3.5 rounded-lg font-black text-[13px] uppercase tracking-widest hover:bg-blue-50 transition-all">
                    Import Payments
                </button>
            </div>

            {/* Flowchart Mockup */}
            <div className="w-full max-w-4xl opacity-80 scale-90 md:scale-100">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] mb-12 italic">Life cycle of a Customer Payment</p>
                <div className="flex flex-col items-center gap-12">
                    {/* Top Row: Workflow */}
                    <div className="flex items-center gap-4">
                        <div className="px-5 py-2.5 bg-slate-50 border border-slate-200 rounded text-[10px] font-black text-slate-400 uppercase tracking-widest">Initial Request</div>
                        <ArrowRight size={16} className="text-slate-200" />
                        <div className="px-5 py-2.5 bg-slate-50 border border-slate-200 rounded text-[10px] font-black text-slate-400 uppercase tracking-widest">Reminder 1</div>
                        <ArrowRight size={16} className="text-slate-200" />
                        <div className="px-5 py-2.5 bg-slate-50 border border-slate-200 rounded text-[10px] font-black text-slate-400 uppercase tracking-widest">Reminder 2</div>
                        <ArrowRight size={16} className="text-slate-200" />
                        <div className="px-5 py-2.5 bg-slate-50 border border-slate-200 rounded text-[10px] font-black text-slate-400 uppercase tracking-widest">Reminder N</div>
                    </div>

                    <div className="h-20 w-px bg-slate-100 relative">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-slate-200" />
                    </div>

                    {/* Bottom Row: Methods */}
                    <div className="flex gap-10">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300"><History size={24}/></div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Auto-Charge</span>
                        </div>
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-300"><CreditCard size={24}/></div>
                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Credit Card</span>
                        </div>
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-300"><Plus size={24}/></div>
                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Bank / Wire</span>
                        </div>
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300"><MousePointer2 size={24}/></div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Manual/Offline</span>
                        </div>
                    </div>
                </div>

                <div className="mt-20 bg-slate-50/50 p-10 rounded-2xl border border-dashed border-slate-200 text-left">
                    <h5 className="text-[13px] font-black text-slate-900 mb-4">In the Payments Received module, you can:</h5>
                    <ul className="space-y-3">
                        <li className="flex items-center gap-3 text-[12px] font-medium text-slate-500">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Automatically charge your customer's card for recurring invoices.
                        </li>
                        <li className="flex items-center gap-3 text-[12px] font-medium text-slate-500">
                             <div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Record payments manually or import statement data.
                        </li>
                        <li className="flex items-center gap-3 text-[12px] font-medium text-slate-500">
                             <div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Send automated payment receipts to your customers.
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

const GlobalRecordPaymentModal = ({ isOpen, onClose, companyId, onRefresh }) => {
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customers, setCustomers] = useState([]);
    const [openInvoices, setOpenInvoices] = useState([]);
    const [amount, setAmount] = useState(0);
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [depositTo, setDepositTo] = useState('');
    const [reference, setReference] = useState('');
    const [bankLedgers, setBankLedgers] = useState([]);
    const [loadingInvoices, setLoadingInvoices] = useState(false);
    const [saving, setSaving] = useState(false);
    const [allocation, setAllocation] = useState({}); // invoiceId: amount
    const { addNotification } = useNotificationStore();

    useEffect(() => {
        if (isOpen) {
            ledgerAPI.getByCompany(companyId).then(res => {
                const groups = res.data;
                const custs = groups.filter(l => l.Group?.name?.includes('Sundry Debtors') || l.groupName?.includes('Sundry Debtors'));
                const banks = groups.filter(l => l.Group?.name?.includes('Bank') || l.Group?.name?.includes('Cash') || l.groupName?.includes('Bank') || l.groupName?.includes('Cash'));
                setCustomers(custs);
                setBankLedgers(banks);
                if (banks.length > 0) setDepositTo(banks[0].id);
            });
        }
    }, [isOpen]);

    const quickAddBank = async () => {
        const name = prompt('Enter Bank/Cash Account Name:');
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

    useEffect(() => {
        if (selectedCustomer) {
            setLoadingInvoices(true);
            salesAPI.getOpenInvoices(selectedCustomer.id)
                .then(res => setOpenInvoices(res.data))
                .finally(() => setLoadingInvoices(false));
        } else {
            setOpenInvoices([]);
        }
    }, [selectedCustomer]);

    const handleAutoAllocation = (totalAmt) => {
        let remaining = parseFloat(totalAmt || 0);
        const newAlloc = {};
        for (const inv of openInvoices) {
            const canPay = Math.min(remaining, parseFloat(inv.balance));
            newAlloc[inv.id] = canPay;
            remaining -= canPay;
        }
        setAllocation(newAlloc);
    };

    const handleSave = async () => {
        if (!selectedCustomer || !depositTo || amount <= 0) {
            addNotification('Please fill all required fields', 'warning');
            return;
        }
        setSaving(true);
        try {
            await salesAPI.recordPayment({
                companyId,
                customerId: selectedCustomer.id,
                paymentDate,
                amount,
                depositToId: depositTo,
                reference,
                invoices: Object.entries(allocation).map(([id, amt]) => ({ id, amountToApply: amt }))
            });
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
            <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-scale-up flex flex-col max-h-[90vh]">
                <header className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Record Payment</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Receive money from customer</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-all text-slate-400"><X size={20}/></button>
                </header>

                <div className="p-8 space-y-8 overflow-y-auto no-scrollbar">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1.5 focus-within:scale-[1.02] transition-transform">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer Name*</label>
                            <select 
                                value={selectedCustomer?.id || ''}
                                onChange={e => setSelectedCustomer(customers.find(c => c.id === e.target.value))}
                                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-600 transition-all appearance-none"
                            >
                                <option value="">Select Customer</option>
                                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount Received (₹)*</label>
                            <input 
                                type="number"
                                value={amount}
                                onChange={e => { setAmount(e.target.value); handleAutoAllocation(e.target.value); }}
                                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl font-black text-blue-600 text-lg outline-none focus:bg-white focus:border-blue-600 transition-all"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Date</label>
                            <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl font-bold transition-all outline-none focus:bg-white"/>
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deposit To*</label>
                                <button onClick={quickAddBank} className="text-[10px] font-black text-blue-600 hover:underline uppercase tracking-widest">+ Quick Add</button>
                            </div>
                            <select value={depositTo} onChange={e => setDepositTo(e.target.value)} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none appearance-none">
                                {bankLedgers.length === 0 ? (
                                    <option value="">No accounts found</option>
                                ) : (
                                    <option value="">Select Account</option>
                                )}
                                {bankLedgers.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                            </select>
                            {bankLedgers.length === 0 && <p className="text-[9px] text-red-500 font-bold mt-1 uppercase">Please create a bank/cash account.</p>}
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-100">
                        <div className="flex justify-between items-center">
                            <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Unpaid Invoices</h4>
                            {selectedCustomer && <span className="text-[10px] font-bold text-slate-400 italic">Auto-allocated based on FIFO</span>}
                        </div>
                        
                        {loadingInvoices ? (
                            <div className="py-10 text-center animate-pulse"><Loader2 className="animate-spin inline-block text-blue-600 opacity-20" size={24}/></div>
                        ) : openInvoices.length === 0 ? (
                            <div className="py-10 text-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-100">
                                <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest">No outstanding invoices</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {openInvoices.map(inv => (
                                    <div key={inv.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 group hover:bg-white hover:border-blue-100 transition-all">
                                        <div className="flex flex-col">
                                            <span className="text-[13px] font-black text-slate-800">{inv.invoiceNumber}</span>
                                            <span className="text-[10px] font-bold text-slate-400">{new Date(inv.date).toLocaleDateString()} | Balance: ₹{parseFloat(inv.balance).toLocaleString()}</span>
                                        </div>
                                        <input 
                                            type="number"
                                            value={allocation[inv.id] || ''}
                                            onChange={e => setAllocation({...allocation, [inv.id]: parseFloat(e.target.value || 0)})}
                                            className="w-32 h-10 px-3 bg-white border border-slate-200 rounded-lg text-right font-black text-slate-700 outline-none focus:border-blue-600 transition-all"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <footer className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-2.5 text-slate-500 font-black text-[11px] uppercase tracking-widest hover:bg-white rounded-xl transition-all">Cancel</button>
                    <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-black shadow-2xl shadow-slate-200 transition-all flex items-center gap-2"
                    >
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Record Payment
                    </button>
                </footer>
            </div>
        </div>
    );
};
import { Loader2, X, Save } from 'lucide-react';
import { ledgerAPI, salesAPI } from '../../services/api';

const PaymentsReceivedView = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const companyId = localStorage.getItem('companyId');
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const { addNotification } = useNotificationStore();

    const fetchPayments = async () => {
        try {
            setLoading(true);
            const res = await voucherAPI.getByCompany(companyId);
            const receipts = res.data.filter(v => v.voucherType === 'Receipt');
            setPayments(receipts);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        if (companyId) fetchPayments();
    }, [companyId]);

    const filtered = useMemo(() => {
        return payments.filter(p => {
            const customer = p.Transactions.find(t => t.Ledger?.Group?.name?.includes('Sundry Debtors') || t.Ledger?.Group?.name?.includes('Customer'))?.Ledger?.name;
            return (
                p.voucherNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (customer && customer.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        });
    }, [payments, searchTerm]);

    return (
        <div className="flex h-screen bg-white font-sans overflow-hidden">
            {/* List Sidebar */}
            <div className={`flex flex-col border-r border-slate-100 transition-all duration-300 no-print ${id ? 'w-[380px]' : 'flex-1'}`}>
                {/* Header Section */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                    <button className="text-[15px] font-black text-slate-800 flex items-center gap-1.5 hover:text-blue-600 transition-all">
                        All Received Payments <ChevronDown size={14} className="mt-0.5 opacity-40" />
                    </button>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setIsPaymentModalOpen(true)}
                            className="p-1.5 bg-[#008ef0] text-white rounded font-bold hover:bg-[#007cd0] transition-all shadow-lg shadow-blue-50"
                        >
                            <Plus size={18}/>
                        </button>
                        <button className="p-1.5 text-slate-400 border border-slate-200 rounded hover:bg-slate-50 transition-all">
                            <MoreVertical size={16}/>
                        </button>
                    </div>
                </div>

                <GlobalRecordPaymentModal 
                    isOpen={isPaymentModalOpen}
                    onClose={() => setIsPaymentModalOpen(false)}
                    companyId={companyId}
                    onRefresh={fetchPayments}
                />

                {/* Search & Filter Section */}
                <div className="px-6 py-2.5 border-b border-slate-50 flex items-center gap-3 shrink-0 bg-slate-50/20">
                    <Search size={14} className="text-slate-300" />
                    <input 
                        type="text" 
                        placeholder="Search payments..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-slate-200 font-medium"
                    />
                    <Filter size={14} className="text-slate-300 cursor-pointer hover:text-slate-400 transtion-all" />
                </div>

                {/* Payments List */}
                <div className="flex-1 overflow-y-auto divide-y divide-slate-50 custom-scrollbar">
                    {loading ? (
                        <div className="p-20 text-center animate-pulse">
                             <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Fetching records...</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="p-20 text-center text-slate-200 italic font-black uppercase tracking-[0.2em] text-[10px] opacity-40">
                            No Records Found
                        </div>
                    ) : (
                        filtered.map(p => {
                            const customerName = p.Transactions.find(t => t.Ledger?.Group?.name?.includes('Sundry Debtors') || t.Ledger?.Group?.name?.includes('Customer'))?.Ledger?.name || 'Customer';
                            const amount = p.Transactions.reduce((s, t) => s + parseFloat(t.credit || 0), 0);
                            const isActive = id === p.id;
                            
                            return (
                                <div 
                                    key={p.id} 
                                    onClick={() => navigate(`/payments-received/${p.id}`)}
                                    className={`px-6 py-5 cursor-pointer transition-all border-l-4 ${isActive ? 'bg-[#f3f7ff] border-blue-600' : 'bg-white border-transparent hover:bg-slate-50'}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`text-[13px] font-black truncate max-w-[200px] ${isActive ? 'text-blue-600' : 'text-slate-800'}`}>
                                            {customerName}
                                        </span>
                                        <span className="text-[13px] font-black text-slate-900 ml-4">
                                            ₹{amount.toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                                            <span className="text-slate-500">{p.voucherNumber}</span>
                                            <span className="text-slate-200">|</span>
                                            <span className="flex items-center gap-1">
                                                <Calendar size={10} /> {new Date(p.date).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest rounded leading-none">
                                            Success
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Content Area */}
            {payments.length === 0 && !loading ? (
                <PaymentsEmptyState onGoToInvoices={() => navigate('/invoices')} />
            ) : id ? (
                <PaymentReceiptDetail id={id} navigate={navigate} companyId={companyId} />
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center bg-[#fcfdfe] text-slate-300 animate-fade-in relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-50/30 rounded-full blur-[100px] pointer-events-none" />
                    <div className="bg-white p-10 rounded-4xl shadow-2xl relative z-10 border border-slate-50 group">
                        <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 border border-slate-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-all duration-500">
                            <FileText size={40} className="text-slate-300 group-hover:text-blue-400 transition-all duration-500" />
                        </div>
                        <p className="uppercase tracking-[0.4em] text-[11px] font-black text-slate-400 opacity-60 text-center">Select payment for receipt</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentsReceivedView;
