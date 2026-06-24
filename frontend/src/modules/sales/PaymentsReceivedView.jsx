import React, { useState, useEffect, useMemo, useRef } from 'react';
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
    Hash,
    ArrowLeft,
    CheckCircle2,
    Settings,
    X,
    Save,
    Loader2,
    RefreshCw,
    AlertCircle,
    Info,
    Share2,
    FileEdit,
    ShieldCheck,
    MoreHorizontal
} from 'lucide-react';
import { voucherAPI, ledgerAPI, salesAPI, mailAPI } from '../../services/api';
import useNotificationStore from '../../store/notificationStore';
import { getCurrencyDisplay } from '../../utils/currencies';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENT RECEIPT PREVIEW COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const PaymentReceiptDetail = ({ id, navigate, companyId }) => {
    const [payment, setPayment] = useState(null);
    const [loading, setLoading] = useState(true);
    const { addNotification } = useNotificationStore();

    // Email Modal state
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [emailTo, setEmailTo] = useState('');
    const [emailSubject, setEmailSubject] = useState('');
    const [emailBody, setEmailBody] = useState('');
    const [isSendingEmail, setIsSendingEmail] = useState(false);

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

    useEffect(() => {
        if (payment) {
            const customer = payment.Transactions.find(t => {
                const groupName = (t.Ledger?.Group?.name || t.Ledger?.group?.name || '').toLowerCase();
                return groupName.includes('debtors') || 
                       groupName.includes('customer') || 
                       (parseFloat(t.credit || 0) > 0 && !groupName.includes('bank') && !groupName.includes('cash'));
            })?.Ledger;
            setEmailTo(customer?.email || '');
            setEmailSubject(`Payment Receipt - ${payment.voucherNumber} from ${sessionStorage.getItem('companyName') || 'CalTally'}`);
            
            const amount = payment.Transactions.reduce((s, t) => s + parseFloat(t.credit || 0), 0);
            const bank = payment.Transactions.find(t => {
                const groupName = (t.Ledger?.Group?.name || t.Ledger?.group?.name || '').toLowerCase();
                return groupName.includes('bank') || 
                       groupName.includes('cash') || 
                       (parseFloat(t.debit || 0) > 0 && !groupName.includes('debtors') && !groupName.includes('customer'));
            })?.Ledger;
            
            const cleanCompany = (sessionStorage.getItem('companyName') || 'CalTally');
            const currency = getCurrencyDisplay(customer?.currency) || '₹';
            const formattedAmount = parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 });
            const pDate = new Date(payment.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
            
            setEmailBody(
`Dear ${customer?.displayName || customer?.name || 'Customer'},

We have received your payment of ${currency} ${formattedAmount} on ${pDate}.

Receipt Details:
- Receipt Number: ${payment.voucherNumber}
- Settlement Account: ${bank?.name || 'Bank Transfer'}
- Remarks: ${payment.narration || 'Payment received successfully.'}

Thank you for your business.

Regards,
${cleanCompany}`
            );
        }
    }, [payment]);

    const handleSendEmail = async () => {
        if (!emailTo) {
            addNotification('Please enter a recipient email address.', 'warning');
            return;
        }
        setIsSendingEmail(true);
        try {
            const customer = payment.Transactions.find(t => {
                const groupName = (t.Ledger?.Group?.name || t.Ledger?.group?.name || '').toLowerCase();
                return groupName.includes('debtors') || 
                       groupName.includes('customer') || 
                       (parseFloat(t.credit || 0) > 0 && !groupName.includes('bank') && !groupName.includes('cash'));
            })?.Ledger;
            await mailAPI.send({
                toEmail: emailTo,
                subject: emailSubject,
                body: emailBody,
                companyId: payment.CompanyId || sessionStorage.getItem('companyId'),
                ledgerId: customer?.id,
                documentId: payment.id,
                type: 'Receipt'
            });
            addNotification('Email sent successfully!', 'success');
            setIsEmailModalOpen(false);
        } catch (err) {
            console.error(err);
            addNotification(err.response?.data?.error || 'Failed to send email. Please verify settings.', 'error');
        } finally {
            setIsSendingEmail(false);
        }
    };

    if (loading) return (
      <div className="flex-1 flex flex-col items-center justify-center h-[60vh] text-slate-400 font-sans">
        <Loader2 size={40} className="animate-spin text-[#1e61f0] mb-4 opacity-20" />
        <span className="text-[11px] font-bold tracking-widest uppercase opacity-40">Syncing Records...</span>
      </div>
    );

    if (!payment) return (
      <div className="flex-1 flex items-center justify-center text-slate-300 font-bold text-3xl opacity-20 tracking-tighter uppercase">Document Not Found</div>
    );

    // Derived Data
    const amount = payment.Transactions.reduce((s, t) => s + parseFloat(t.credit || 0), 0);
    const customer = payment.Transactions.find(t => {
        const groupName = (t.Ledger?.Group?.name || t.Ledger?.group?.name || '').toLowerCase();
        return groupName.includes('debtors') || 
               groupName.includes('customer') || 
               (parseFloat(t.credit || 0) > 0 && !groupName.includes('bank') && !groupName.includes('cash'));
    })?.Ledger;
    const bank = payment.Transactions.find(t => {
        const groupName = (t.Ledger?.Group?.name || t.Ledger?.group?.name || '').toLowerCase();
        return groupName.includes('bank') || 
               groupName.includes('cash') || 
               (parseFloat(t.debit || 0) > 0 && !groupName.includes('debtors') && !groupName.includes('customer'));
    })?.Ledger;

    const signatureText = (() => {
        const raw = sessionStorage.getItem('companyName') || 'THE MOON ENTERPRISES';
        const clean = raw.toUpperCase().startsWith('THE ') ? raw.slice(4) : raw;
        const word = clean.split(' ')[0] || 'Manager';
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })();

    return (
        <div className="flex-1 flex flex-col h-full bg-[#f8fafc] animate-fade-in shadow-inner overflow-hidden">
            {/* Breadcrumb Header */}
            <div className="bg-[#fcfdfe] border-b border-slate-200 px-8 py-2.5 flex items-center justify-between sticky top-0 z-10 no-print">
                <div className="flex items-center gap-2">
                    <button onClick={() => navigate('/payments')} className="text-[13px] font-bold text-blue-600 hover:underline flex items-center gap-1.5 uppercase transition-all">
                       <ChevronDown size={14} className="rotate-90"/> All Payments
                    </button>
                    <span className="text-slate-300">|</span>
                    <span className="text-[13px] font-bold text-slate-800">{payment.voucherNumber}</span>
                </div>
                <div className="flex items-center gap-4">
                   <button className="p-1.5 text-slate-400 hover:bg-slate-50 rounded-md transition-all hover:text-slate-600"><History size={16}/></button>
                   <button className="p-1.5 text-slate-400 hover:bg-slate-50 rounded-md transition-all hover:text-slate-600"><Share2 size={16}/></button>
                </div>
            </div>

            {/* Sub-Toolbar */}
            <div className="bg-white border-b border-slate-100 px-8 py-2 flex items-center justify-between shadow-sm no-print">
                <div className="flex items-center gap-1">
                    <button 
                        onClick={() => window.print()}
                        className="px-4 py-1.5 bg-slate-50 text-slate-700 rounded flex items-center gap-1.5 text-[12px] font-bold transition-all border border-slate-200 hover:bg-white hover:border-blue-400"
                    >
                        <Printer size={14}/> PDF/Print
                    </button>
                    <button 
                        onClick={() => setIsEmailModalOpen(true)}
                        className="px-3 py-1.5 text-slate-600 hover:bg-slate-50 rounded flex items-center gap-1.5 text-[12px] font-bold transition-all"
                    >
                        <Mail size={14}/> Email
                    </button>
                    <span className="w-px h-5 bg-slate-100 mx-2" />
                    <button className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded transition-all ml-2"><Trash2 size={16}/></button>
                    <button className="p-1.5 text-slate-400 hover:bg-slate-50 rounded transition-all ml-1"><MoreHorizontal size={16}/></button>
                </div>
            </div>

            {/* Receipt Preview */}
            <div className="flex-1 overflow-y-auto p-12 flex flex-col items-center custom-scrollbar print:p-0 print:bg-white transition-all">
                <div className="bg-white shadow-[0_50px_100px_-20px_rgba(15,23,42,0.06),0_30px_60px_-30px_rgba(15,23,42,0.1)] rounded-[2.5rem] min-h-[842px] w-full max-w-[800px] mx-auto p-6 relative border border-slate-100 mb-20 animate-fade-in print:shadow-none print:border-none print:m-0">
                    
                    {/* Inner Border Frame */}
                    <div className="border border-slate-100 rounded-[2rem] p-16 bg-white h-full relative overflow-hidden flex flex-col justify-between">
                        
                        {/* Decorative Top Security Line */}
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-sky-500 to-blue-600 opacity-80" />

                        {/* Status Stamp */}
                        <div className="absolute top-20 right-20 rotate-[15deg] opacity-[0.06] no-print pointer-events-none">
                            <div className="border-[8px] border-emerald-500 text-emerald-500 px-10 py-4 text-5xl font-bold uppercase tracking-widest rounded-3xl">PAID</div>
                        </div>

                        {/* Header Section */}
                        <div className="flex justify-between items-start mb-16">
                            <div className="space-y-4">
                                <div className="w-16 h-16 rounded-[1.25rem] bg-gradient-to-tr from-blue-600 to-blue-700 border-2 border-blue-500 shadow-[0_10px_25px_-5px_rgba(30,97,240,0.3)] flex items-center justify-center text-white font-extrabold text-2xl">
                                    {sessionStorage.getItem('companyName')?.charAt(0) || 'M'}
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-[20px] font-black text-slate-800 tracking-tight uppercase leading-none">{sessionStorage.getItem('companyName') || 'THE MOON ENTERPRISES'}</h2>
                                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Global Trading Solutions</p>
                                </div>
                            </div>
                            <div className="text-right space-y-3">
                                <h1 className="text-[36px] font-black text-slate-900 tracking-tighter uppercase leading-none opacity-5">RECEIPT</h1>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Receipt Number</p>
                                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-1.5 inline-flex items-center gap-2 text-[12px] font-extrabold font-mono text-slate-700 shadow-sm">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        {payment.voucherNumber}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Receipt Core Information Banner */}
                        <div className="bg-gradient-to-r from-blue-600 via-[#1e61f0] to-blue-700 text-white rounded-[2rem] py-12 px-12 mb-12 shadow-[0_20px_45px_-10px_rgba(30,97,240,0.25)] border border-blue-500 relative overflow-hidden flex items-center justify-between">
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />
                            <div className="relative z-10 space-y-2">
                                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-blue-100">Total Amount Received</p>
                                <h4 className="text-[36px] font-black tracking-tighter text-white leading-none">
                                    {getCurrencyDisplay(customer?.currency)} {parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </h4>
                            </div>
                            <div className="relative z-10 text-right space-y-2">
                                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-blue-100">Payment Date</p>
                                <h4 className="text-[16px] font-bold font-mono text-slate-100 tracking-tight">
                                    {new Date(payment.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                </h4>
                            </div>
                        </div>

                        {/* Transaction Details Grid */}
                        <div className="grid grid-cols-2 gap-6 mb-12">
                            <div className="flex flex-col gap-4">
                                {/* Received From Card */}
                                <div className="bg-blue-50/10 border border-blue-100 rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:bg-blue-50/20 transition-all">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 shadow-inner">
                                        <User size={18} />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[9px] font-bold text-blue-600/70 uppercase tracking-widest leading-none">Received From</p>
                                        <p className="text-[15px] font-extrabold text-[#1e61f0] leading-tight">{customer?.name || 'Customer'}</p>
                                        <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">Premium Partner Account</p>
                                    </div>
                                </div>
                                
                                {/* Settlement Account Card */}
                                <div className="bg-blue-50/10 border border-blue-100 rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:bg-blue-50/20 transition-all">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 shadow-inner">
                                        <Banknote size={18} />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[9px] font-bold text-blue-600/70 uppercase tracking-widest leading-none">Settlement Account</p>
                                        <p className="text-[15px] font-extrabold text-slate-800 leading-tight">{bank?.name || 'Bank Transfer'}</p>
                                        <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">Verified Payment</p>
                                    </div>
                                </div>
                            </div>

                            {/* Transaction Status Card */}
                            <div className="bg-blue-50/10 border border-blue-100 rounded-2xl p-5 flex flex-col justify-center items-center text-center space-y-3.5 shadow-sm h-full">
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md text-emerald-500 border border-slate-100 animate-pulse">
                                    <CheckCircle2 size={24} />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-[14px] font-extrabold text-blue-800 tracking-tight uppercase leading-none">Transaction Cleared</h3>
                                    <p className="text-[11px] text-blue-600/80 font-medium max-w-[160px] leading-relaxed mx-auto">Payment successfully applied to invoice balance</p>
                                </div>
                            </div>
                        </div>

                        {/* Narration Block */}
                        <div className="border-t border-slate-100 pt-10 mb-12">
                             <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Settlement Remarks</h5>
                             <div className="bg-slate-50/30 border border-slate-200/60 rounded-2xl p-5 italic text-[14px] text-slate-600 font-bold leading-relaxed shadow-sm">
                                 "{payment.narration || 'This payment has been successfully received and credited to your account. We appreciate your continued business partnership.'}"
                             </div>
                        </div>

                        {/* Footer & Signature Section */}
                        <div className="flex justify-between items-end border-t border-slate-100 pt-10">
                             <div className="space-y-2">
                                 <div className="flex items-center gap-2 text-slate-400">
                                     <ShieldCheck size={16} className="text-emerald-500" />
                                     <span className="text-[10px] font-extrabold uppercase tracking-widest">Digital Audit Logged</span>
                                 </div>
                                 <p className="text-[10px] text-slate-400 font-bold max-w-[240px] leading-relaxed">This is an electronically generated receipt issued under the authority of {sessionStorage.getItem('companyName')}.</p>
                             </div>
                             
                             <div className="flex items-center gap-8 text-right">
                                 {/* Circular stamp seal */}
                                 <div className="w-16 h-16 rounded-full border-2 border-indigo-400/40 flex items-center justify-center relative rotate-[-12deg] select-none pointer-events-none no-print">
                                     <div className="w-14 h-14 rounded-full border border-dashed border-indigo-400/40 flex flex-col items-center justify-center text-[7px] font-black uppercase text-indigo-400/60 tracking-wider">
                                         <span>SECURED</span>
                                         <span className="text-[6px] font-medium font-mono">VERIFIED</span>
                                         <span>CALTALLY</span>
                                     </div>
                                 </div>
                                 
                                 <div className="w-64 text-center">
                                    <div className="h-14 border-b border-slate-300 border-dashed mb-3 relative">
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 font-serif text-[24px] tracking-wide text-indigo-600/85 italic font-bold select-none rotate-[-4deg]">
                                            {signatureText}
                                        </div>
                                    </div>
                                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Authorized Signature</p>
                                 </div>
                             </div>
                        </div>

                        {/* Decorative Barcode */}
                        <div className="flex flex-col items-center justify-center mt-10 opacity-35 select-none no-print">
                            <div className="flex gap-[2px] h-8 items-end mb-1">
                                <div className="w-[2px] h-full bg-slate-900" />
                                <div className="w-[1px] h-full bg-slate-900" />
                                <div className="w-[4px] h-full bg-slate-900" />
                                <div className="w-[1px] h-full bg-slate-900" />
                                <div className="w-[2px] h-full bg-slate-900" />
                                <div className="w-[3px] h-full bg-slate-900" />
                                <div className="w-[1px] h-full bg-slate-900" />
                                <div className="w-[4px] h-full bg-slate-900" />
                                <div className="w-[2px] h-full bg-slate-900" />
                                <div className="w-[1px] h-full bg-slate-900" />
                                <div className="w-[3px] h-full bg-slate-900" />
                                <div className="w-[2px] h-full bg-slate-900" />
                            </div>
                            <span className="text-[9px] font-mono font-bold tracking-[0.3em] text-slate-500 uppercase">{payment.voucherNumber}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Email Modal */}
            <AnimatePresence>
                {isEmailModalOpen && (
                    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm no-print">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_30px_70px_rgba(15,23,42,0.15)] w-full max-w-[550px] overflow-hidden flex flex-col font-sans"
                        >
                            {/* Modal Header */}
                            <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <div>
                                    <h3 className="text-[16px] font-black text-slate-900 tracking-tight">Send Receipt via Email</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Receipt: {payment.voucherNumber}</p>
                                </div>
                                <button 
                                    onClick={() => setIsEmailModalOpen(false)}
                                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all active:scale-95"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-8 space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">From Address</label>
                                    <input 
                                        type="text" 
                                        readOnly 
                                        value="calbuy160@gmail.com" 
                                        className="w-full h-11 px-4 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-bold text-slate-400 outline-none cursor-not-allowed select-none font-mono"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Recipient Email</label>
                                    <input 
                                        type="email" 
                                        value={emailTo}
                                        onChange={(e) => setEmailTo(e.target.value)}
                                        placeholder="customer@example.com" 
                                        className="w-full h-11 px-4 bg-slate-50/70 border border-slate-200 hover:border-slate-300 rounded-xl text-[13px] font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-mono"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Subject</label>
                                    <input 
                                        type="text" 
                                        value={emailSubject}
                                        onChange={(e) => setEmailSubject(e.target.value)}
                                        className="w-full h-11 px-4 bg-slate-50/70 border border-slate-200 hover:border-slate-300 rounded-xl text-[13px] font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Message Body</label>
                                    <textarea 
                                        rows={6}
                                        value={emailBody}
                                        onChange={(e) => setEmailBody(e.target.value)}
                                        className="w-full p-4 bg-slate-50/70 border border-slate-200 hover:border-slate-300 rounded-xl text-[13px] font-medium text-slate-700 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all resize-none leading-relaxed"
                                    />
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                    PDF Receipt will be attached
                                </div>
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={() => setIsEmailModalOpen(false)}
                                        className="px-4 py-2 border border-slate-200 hover:border-slate-300 text-slate-500 font-bold text-[12px] rounded-xl transition-all active:scale-95 uppercase tracking-wider"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={handleSendEmail}
                                        disabled={isSendingEmail}
                                        className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-[12px] rounded-xl transition-all shadow-md shadow-blue-500/10 active:scale-95 uppercase tracking-wider flex items-center gap-2"
                                    >
                                        {isSendingEmail ? (
                                            <>
                                                <Loader2 size={14} className="animate-spin" /> Sending...
                                            </>
                                        ) : (
                                            'Send Email'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENT ENTRY FORM (STANDALONE CARD STYLE)
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMER SEARCH SELECTOR (WITH NEW CUSTOMER ACTION)
// ─────────────────────────────────────────────────────────────────────────────
const CustomerSearchSelector = ({ value, onChange, customers, placeholder, onNewCustomer, onRefreshCustomers }) => {
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
        if (!c) return false;
        return (c.displayName || c.name || '').toLowerCase().includes(search.toLowerCase()) ||
               (c.companyName || '').toLowerCase().includes(search.toLowerCase());
    });

    return (
        <div className="relative w-full" ref={containerRef}>
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full h-12 px-4 bg-slate-50/70 border border-slate-200/80 hover:border-slate-300 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-white transition-all appearance-none shadow-sm focus-within:bg-white focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10"
            >
                <div className="flex-1 overflow-hidden flex items-center gap-2.5">
                    <User size={16} className="text-slate-400 shrink-0" />
                    {value ? (
                        <div className="text-[14px] font-bold text-slate-800 tracking-tight truncate">{value}</div>
                    ) : (
                        <div className="text-[14px] font-bold text-slate-400">{placeholder}</div>
                    )}
                </div>
                <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-600' : ''}`} />
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200/80 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.12)] rounded-2xl z-[200] overflow-hidden flex flex-col"
                    >
                        <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                            <div className="relative flex-1">
                                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input 
                                    autoFocus
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Search customers..."
                                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[13px] outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-slate-700"
                                />
                            </div>
                            {onRefreshCustomers && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onRefreshCustomers(); }}
                                    className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 text-slate-500 hover:text-blue-600 shadow-sm transition-all active:scale-95"
                                    title="Refresh List"
                                >
                                    <RefreshCw size={14} />
                                </button>
                            )}
                        </div>
                        <div className="max-h-[250px] overflow-y-auto no-scrollbar py-1.5">
                            {filtered.length > 0 ? (
                                filtered.map(c => (
                                    <div 
                                        key={c.id}
                                        onClick={() => { onChange(c); setIsOpen(false); setSearch(''); }}
                                        className="px-4 py-3 hover:bg-blue-50/50 cursor-pointer transition-all duration-200 group mx-1.5 my-0.5 rounded-xl flex items-center gap-3"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                            <User size={14} />
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="text-[14px] font-bold text-slate-800 tracking-tight">{c.displayName || c.name}</div>
                                            {c.companyName && c.companyName !== (c.displayName || c.name) && (
                                                <div className="text-[11px] text-slate-400 font-medium">{c.companyName}</div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-8 text-center flex flex-col items-center justify-center">
                                    <User size={20} className="text-slate-300 mb-2" />
                                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">No customers found</p>
                                </div>
                            )}
                        </div>
                        <div className="border-t border-slate-100 p-2.5 bg-slate-50 shrink-0">
                            <button 
                                onClick={() => { setIsOpen(false); onNewCustomer(); }}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-[13px] rounded-xl transition-all shadow-md shadow-blue-500/10 active:scale-98 uppercase tracking-wider"
                            >
                                <Plus size={16} strokeWidth={3} /> New Customer
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const listContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const invoiceItemVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 24 } 
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENT ENTRY FORM (STANDALONE CARD STYLE)
// ─────────────────────────────────────────────────────────────────────────────
const PaymentEntryForm = ({ companyId, navigate, onRefresh }) => {
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customers, setCustomers] = useState([]);
    const [openInvoices, setOpenInvoices] = useState([]);
    const [amount, setAmount] = useState(0);
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [depositTo, setDepositTo] = useState('');
    const [reference, setReference] = useState('');
    const [paymentMode, setPaymentMode] = useState('Bank Transfer');
    const [bankLedgers, setBankLedgers] = useState([]);
    const [loadingInvoices, setLoadingInvoices] = useState(false);
    const [saving, setSaving] = useState(false);
    const [allocation, setAllocation] = useState({}); // invoiceId: amount
    const { addNotification } = useNotificationStore();

    const fetchCustomersAndLedgers = async (isManual = false) => {
        try {
            const res = await ledgerAPI.getByCompany(companyId);
            const groups = res.data;
            const custs = groups.filter(l => l.Group?.name?.includes('Sundry Debtors') || l.groupName?.includes('Sundry Debtors'));
            const banks = groups.filter(l => l.Group?.name?.includes('Bank') || l.Group?.name?.includes('Cash') || l.groupName?.includes('Bank') || l.groupName?.includes('Cash'));
            setCustomers(custs);
            setBankLedgers(banks);
            if (banks.length > 0 && !depositTo) {
                setDepositTo(banks[0].id);
            }
            if (isManual) {
                addNotification('Ledger lists refreshed', 'success');
            }
        } catch (err) {
            console.error(err);
            if (isManual) addNotification('Failed to update lists', 'error');
        }
    };

    useEffect(() => {
        if (companyId) {
            fetchCustomersAndLedgers(false);
        }
    }, [companyId]);

    // Restore draft if any
    useEffect(() => {
        const draftStr = localStorage.getItem('payment_draft');
        if (draftStr && customers.length > 0) {
            try {
                const draft = JSON.parse(draftStr);
                if (draft.amount) setAmount(draft.amount);
                if (draft.paymentDate) setPaymentDate(draft.paymentDate);
                if (draft.depositTo) setDepositTo(draft.depositTo);
                if (draft.reference) setReference(draft.reference);
                if (draft.paymentMode) setPaymentMode(draft.paymentMode);
                if (draft.customerId) {
                    const cust = customers.find(c => c.id === draft.customerId);
                    if (cust) {
                        setSelectedCustomer(cust);
                    }
                }
                localStorage.removeItem('payment_draft');
            } catch (e) {
                console.error('Failed to parse payment draft', e);
            }
        }
    }, [customers]);

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

    const handleApplyFull = (inv) => {
        const currentBalance = parseFloat(inv.balance || 0);
        setAllocation(prev => {
            const newAlloc = { ...prev, [inv.id]: currentBalance };
            const newTotalAllocated = Object.values(newAlloc).reduce((sum, val) => sum + parseFloat(val || 0), 0);
            if (newTotalAllocated > parseFloat(amount || 0)) {
                setAmount(newTotalAllocated);
            }
            return newAlloc;
        });
    };

    const handleClearAllocation = (invId) => {
        setAllocation(prev => ({ ...prev, [invId]: 0 }));
    };

    const handleSave = async () => {
        if (!selectedCustomer || !depositTo || amount <= 0) {
            addNotification('Please fill all required fields', 'warning');
            return;
        }
        setSaving(true);
        try {
            const res = await salesAPI.recordPayment({
                companyId,
                customerId: selectedCustomer.id,
                paymentDate,
                amount,
                depositToId: depositTo,
                reference,
                paymentMode,
                invoices: Object.entries(allocation).map(([id, amt]) => ({ id, amountToApply: amt }))
            });
            addNotification('Payment recorded successfully', 'success');
            if (onRefresh) onRefresh();
            const newId = res?.data?.id || res?.data?.voucherId || null;
            navigate('/payments', { state: { selectedId: newId } });
        } catch (err) {
            addNotification('Failed to record payment', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleNewCustomer = () => {
        localStorage.setItem('payment_draft', JSON.stringify({
            customerId: selectedCustomer?.id || '',
            amount,
            paymentDate,
            depositTo,
            reference,
            paymentMode
        }));
        window.open('/ledger/new', '_blank');
    };

    return (
        <div className="flex flex-col h-full bg-[#f8fafc] relative font-sans">
            {/* Form Header */}
            <header className="sticky top-0 bg-white border-b border-slate-100 px-12 py-4 flex items-center justify-between z-20 shadow-[0_2px_15px_rgba(0,0,0,0.015)] shrink-0">
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => navigate('/payments')}
                  className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-xl text-slate-400 hover:text-[#1e61f0] transition-all shadow-sm active:scale-95"
                >
                  <ArrowLeft size={18} />
                </button>
                <div>
                  <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">Record Payment</h2>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Customer Funds Settlement</p>
                </div>
              </div>
              <div className="flex items-center gap-4.5">
                <button className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-xl text-slate-400 hover:text-slate-600 transition-all shadow-sm active:scale-95"><Settings size={18}/></button>
                <div className="w-px h-6 bg-slate-200" />
                <button 
                  onClick={() => navigate('/payments')} 
                  className="p-2.5 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 border border-slate-200/60 hover:border-rose-100 rounded-xl text-slate-400 transition-all shadow-sm active:scale-95"
                >
                  <X size={18} />
                </button>
              </div>
            </header>

            <div className="flex-1 bg-[#f8fafc] overflow-y-auto no-scrollbar">
              <div className="max-w-[1000px] mx-auto py-10 px-6">
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_30px_70px_rgba(30,41,59,0.04)] p-10 md:p-12 space-y-10 relative overflow-hidden animate-fade-in">
                  
                  {/* Decorative Background Glows */}
                  <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-50/30 rounded-full blur-[100px] pointer-events-none -z-10" />
                  <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-50/20 rounded-full blur-[120px] pointer-events-none -z-10" />

                  {/* Form Section: Primary Data */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Customer Selection <span className="text-red-500 font-extrabold">*</span></label>
                      <CustomerSearchSelector 
                        value={selectedCustomer ? (selectedCustomer.displayName || selectedCustomer.name) : ''}
                        onChange={setSelectedCustomer}
                        customers={customers}
                        placeholder="Search or select customer..."
                        onNewCustomer={handleNewCustomer}
                        onRefreshCustomers={() => fetchCustomersAndLedgers(true)}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Amount Received ({getCurrencyDisplay(selectedCustomer?.currency)}) <span className="text-red-500 font-extrabold">*</span></label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-[14px]">
                          {getCurrencyDisplay(selectedCustomer?.currency)}
                        </span>
                        <input 
                          type="number"
                          value={amount}
                          onChange={e => { setAmount(e.target.value); handleAutoAllocation(e.target.value); }}
                          className="w-full h-12 pl-12 pr-4 bg-slate-50/70 border border-slate-200/80 hover:border-slate-300 rounded-2xl text-[16px] font-bold text-[#1e61f0] outline-none hover:bg-white focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Payment Date <span className="text-red-500 font-extrabold">*</span></label>
                      <div className="relative">
                        <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input 
                          type="date" 
                          value={paymentDate} 
                          onChange={e => setPaymentDate(e.target.value)}
                          className="w-full h-12 pl-12 pr-4 bg-slate-50/70 border border-slate-200/80 hover:border-slate-300 rounded-2xl text-[14px] font-bold text-slate-700 outline-none hover:bg-white focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Deposit To <span className="text-red-500 font-extrabold">*</span></label>
                      <div className="relative">
                        <Banknote size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <select 
                          value={depositTo} 
                          onChange={e => setDepositTo(e.target.value)}
                          className="w-full h-12 pl-12 pr-10 bg-slate-50/70 border border-slate-200/80 hover:border-slate-300 rounded-2xl text-[14px] font-bold text-slate-700 outline-none hover:bg-white focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none shadow-sm cursor-pointer"
                        >
                          <option value="">Select Account</option>
                          {bankLedgers.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </select>
                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Payment Mode <span className="text-red-500 font-extrabold">*</span></label>
                      <div className="relative">
                        <CreditCard size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <select 
                          value={paymentMode} 
                          onChange={e => setPaymentMode(e.target.value)}
                          className="w-full h-12 pl-12 pr-10 bg-slate-50/70 border border-slate-200/80 hover:border-slate-300 rounded-2xl text-[14px] font-bold text-slate-700 outline-none hover:bg-white focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none shadow-sm cursor-pointer"
                        >
                          <option value="Bank Transfer">Bank Transfer</option>
                          <option value="Cash">Cash</option>
                          <option value="Cheque">Cheque</option>
                          <option value="Credit Card">Credit Card</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Reference / Transaction ID</label>
                      <div className="relative">
                        <Hash size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input 
                          type="text" 
                          value={reference} 
                          onChange={e => setReference(e.target.value)}
                          placeholder="e.g. CHQ-9921 or TXN-8821"
                          className="w-full h-12 pl-12 pr-4 bg-slate-50/70 border border-slate-200/80 hover:border-slate-300 rounded-2xl text-[14px] font-bold text-slate-700 outline-none hover:bg-white focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Allocation Section */}
                  <div className="space-y-6 pt-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <h3 className="text-[14px] font-bold text-slate-900 uppercase tracking-tight">Invoice Allocation</h3>
                      {selectedCustomer && openInvoices.length > 0 && <span className="text-[10px] font-extrabold text-[#1e61f0] bg-blue-50/80 px-3 py-1 rounded-full uppercase tracking-wider border border-blue-100 animate-pulse">Auto-Allocated (FIFO)</span>}
                    </div>

                    {loadingInvoices ? (
                      <div className="py-16 text-center space-y-4">
                        <Loader2 size={36} className="animate-spin text-blue-500 mx-auto opacity-70" />
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Scanning Outstanding Bills...</p>
                      </div>
                    ) : openInvoices.length === 0 ? (
                      <div className="py-16 text-center bg-gradient-to-br from-slate-50 to-slate-100/40 rounded-[2rem] border border-dashed border-slate-200/80 p-8 flex flex-col items-center justify-center">
                        <div className="w-14 h-14 bg-blue-50/80 rounded-2xl flex items-center justify-center text-[#1e61f0] mb-4 border border-blue-100 shadow-sm">
                            <Info size={26} />
                        </div>
                        <p className="text-[14px] font-bold text-slate-800">No Outstanding Invoices</p>
                        <p className="text-[12px] text-slate-400 font-medium mt-1 max-w-[280px]">There are no unpaid invoices linked to this customer account at this time.</p>
                      </div>
                    ) : (
                      <motion.div 
                        variants={listContainerVariants}
                        initial="hidden"
                        animate="show"
                        className="grid grid-cols-1 gap-4"
                      >
                        {openInvoices.map(inv => {
                          const isAllocated = parseFloat(allocation[inv.id] || 0) > 0;
                          const balance = parseFloat(inv.balance || 0);
                          const allocated = parseFloat(allocation[inv.id] || 0);
                          const isFullyAllocated = allocated >= balance;
                          const pct = Math.min(100, Math.max(0, (allocated / balance) * 100));
                          const isOverdue = new Date(inv.dueDate || inv.date) < new Date();

                          return (
                            <motion.div 
                              variants={invoiceItemVariants}
                              key={inv.id} 
                              className={`flex flex-col p-5 rounded-2xl border transition-all duration-300 hover:shadow-[0_18px_30px_-5px_rgba(15,23,42,0.04)] ${
                                isAllocated 
                                  ? 'bg-gradient-to-br from-blue-50/30 to-indigo-50/10 border-blue-200/80 shadow-[0_10px_25px_-5px_rgba(30,41,59,0.03)]' 
                                  : 'bg-slate-50/40 border-slate-200/60 hover:bg-white hover:border-blue-300'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-4">
                                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border transition-all duration-300 shadow-sm ${
                                        isAllocated ? 'bg-blue-100 text-blue-600 border-blue-200' : 'bg-slate-100 text-slate-400 border-slate-200'
                                      }`}>
                                          <FileText size={18} />
                                      </div>
                                      <div>
                                          <div className="flex items-center gap-2">
                                              <h4 className="text-[14px] font-bold text-slate-800 tracking-tight">{inv.invoiceNumber}</h4>
                                              {isOverdue && !isFullyAllocated ? (
                                                  <span className="px-2 py-0.5 bg-rose-50 text-rose-500 border border-rose-100/50 rounded-full text-[9px] font-bold uppercase tracking-wider">Overdue</span>
                                              ) : !isFullyAllocated ? (
                                                  <span className="px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-100/50 rounded-full text-[9px] font-bold uppercase tracking-wider">Outstanding</span>
                                              ) : (
                                                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100/50 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                                                      <CheckCircle2 size={10} /> Fully Allocated
                                                  </span>
                                              )}
                                          </div>
                                          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                                              <span>Issued: {new Date(inv.date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                                              <span>•</span>
                                              <span className="text-slate-500 font-extrabold">Balance: {getCurrencyDisplay(selectedCustomer?.currency)} {balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                          </div>
                                      </div>
                                  </div>
                                  <div className="relative">
                                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[13px]">{getCurrencyDisplay(selectedCustomer?.currency)}</span>
                                      <input 
                                          type="number"
                                          value={allocation[inv.id] || ''}
                                          onChange={e => setAllocation({...allocation, [inv.id]: parseFloat(e.target.value || 0)})}
                                          className="w-40 h-11 pl-8 pr-4 bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl text-right font-extrabold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                                      />
                                  </div>
                              </div>

                              <div className="mt-4 pt-3 border-t border-slate-100/80 flex items-center justify-between gap-4">
                                  <div className="flex-1 flex items-center gap-3">
                                      <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden relative shadow-inner">
                                          <div 
                                              className={`h-full transition-all duration-500 ease-out rounded-full ${pct === 100 ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`} 
                                              style={{ width: `${pct}%` }} 
                                          />
                                      </div>
                                      <span className="text-[11px] font-bold text-slate-400 min-w-[32px] text-right">{Math.round(pct)}%</span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                      {!isFullyAllocated && (
                                          <button 
                                              type="button"
                                              onClick={() => handleApplyFull(inv)}
                                              className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all border border-blue-100/50 hover:border-blue-200"
                                          >
                                              Apply Full
                                          </button>
                                      )}
                                      {isAllocated && (
                                          <button 
                                              type="button"
                                              onClick={() => handleClearAllocation(inv.id)}
                                              className="px-3 py-1 bg-slate-50 hover:bg-slate-100 text-slate-500 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all border border-slate-200/50 hover:border-slate-300"
                                          >
                                              Clear
                                          </button>
                                      )}
                                  </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </motion.div>
                    )}
                  </div>

                  {/* Summary Section */}
                  <div className="flex justify-end pt-12 border-t border-slate-100">
                     {(() => {
                        const totalAllocated = Object.values(allocation).reduce((s, v) => s + (parseFloat(v) || 0), 0);
                        const excessFund = parseFloat(amount || 0) - totalAllocated;
                        const currency = getCurrencyDisplay(selectedCustomer?.currency);
                        
                        return (
                          <div className="w-full md:w-96 space-y-5 bg-[#fcfdfe] p-8 rounded-3xl border border-slate-200/85 shadow-[0_20px_50px_-10px_rgba(15,23,42,0.06)] relative overflow-hidden text-slate-800">
                            {/* Top border glow gradient */}
                            <div className={`absolute top-0 left-0 right-0 h-1.5 transition-all duration-500 ${
                              amount <= 0
                                ? 'bg-slate-300'
                                : excessFund === 0
                                ? 'bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-500'
                                : 'bg-gradient-to-r from-blue-500 via-sky-500 to-blue-600'
                            }`} />
                            
                            <div className="flex justify-between items-center pb-3 border-b border-dashed border-slate-200/85">
                              <span className="font-bold text-[11px] uppercase tracking-wider text-slate-400">Settlement Status</span>
                              {amount <= 0 ? (
                                <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider rounded-full">Empty Draft</span>
                              ) : excessFund === 0 ? (
                                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100/50 text-[10px] font-bold uppercase tracking-wider rounded-full flex items-center gap-1 shadow-sm">
                                  <CheckCircle2 size={10} /> Fully Allocated
                                </span>
                              ) : (
                                <span className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-100/50 text-[10px] font-bold uppercase tracking-wider rounded-full flex items-center gap-1 shadow-sm">
                                  <Info size={10} /> Surplus Fund
                                </span>
                              )}
                            </div>

                            <div className="space-y-3.5">
                              <div className="flex justify-between items-center text-[13px]">
                                <span className="font-bold uppercase tracking-wider text-slate-400">Total Received</span>
                                <span className="font-bold font-mono text-slate-800">{currency} {parseFloat(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                              </div>
                              <div className="flex justify-between items-center text-[13px]">
                                <span className="font-bold uppercase tracking-wider text-slate-400">Allocated to Bills</span>
                                <span className="text-slate-700 font-bold font-mono">- {currency} {totalAllocated.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                              </div>
                            </div>

                            <div className="pt-5 border-t border-slate-200/80 flex justify-between items-center mt-4">
                              <div className="flex flex-col">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Excess Fund</span>
                                <p className="text-[10px] text-slate-400 font-medium">To be kept as advance</p>
                              </div>
                              <motion.span 
                                animate={excessFund > 0 ? { scale: [1, 1.04, 1] } : {}}
                                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                                className={`text-[24px] font-black tracking-tight font-mono transition-colors duration-300 ${
                                  excessFund > 0 ? 'text-blue-600' : 'text-slate-800'
                                }`}
                              >
                                {currency} {excessFund.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </motion.span>
                            </div>
                          </div>
                        );
                     })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Action Bar */}
            <div className="sticky bottom-0 bg-white border-t border-slate-100 px-12 py-4 flex items-center justify-between z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] shrink-0">
                <div className="flex items-center gap-2 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                    <ShieldCheck size={15} className="text-emerald-500" />
                    Transaction Secured via Bank Encryption
                </div>
                <div className="flex items-center gap-4">
                    <button 
                        type="button"
                        onClick={() => navigate('/payments')}
                        className="px-6 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-[13px] font-bold rounded-2xl transition-all cursor-pointer active:scale-95"
                    >
                        Discard
                    </button>
                    <button 
                        type="button"
                        onClick={handleSave} 
                        disabled={saving}
                        className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-bold text-[13px] uppercase tracking-wider shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        {saving ? 'Processing...' : 'Record Payment'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY STATE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const PaymentsEmptyState = ({ onGoToInvoices, onRecordPayment }) => {
    return (
        <div className="flex-1 flex flex-col items-center justify-center bg-white p-20 animate-fade-in text-center">
            <h2 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">No payments received, yet</h2>
            <p className="text-[14px] text-slate-500 font-medium mb-10 max-w-sm">Payments will be added once your customers pay for their invoices.</p>
            
            <div className="flex flex-col items-center gap-6 mb-20">
                <div className="flex items-center gap-4">
                    <button 
                      onClick={onRecordPayment}
                      className="bg-[#1e61f0] text-white px-8 py-3.5 rounded-xl font-bold text-[13px] uppercase tracking-widest hover:bg-[#1a54d1] transition-all shadow-xl shadow-blue-100 flex items-center gap-2"
                    >
                        <Plus size={18} /> Record Payment
                    </button>
                    <button 
                      onClick={onGoToInvoices}
                      className="bg-white border border-slate-200 text-slate-600 px-8 py-3.5 rounded-xl font-bold text-[13px] uppercase tracking-widest hover:bg-slate-50 transition-all"
                    >
                        Go to Unpaid Invoices
                    </button>
                </div>
            </div>

            <div className="w-full max-w-4xl opacity-80 scale-90 md:scale-100">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-12 italic opacity-40">Payment Settlement Lifecycle</p>
                <div className="flex flex-col items-center gap-12">
                    <div className="flex items-center gap-4">
                        <div className="px-5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-400 uppercase tracking-widest">Invoicing</div>
                        <ArrowRight size={16} className="text-slate-200" />
                        <div className="px-5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reminders</div>
                        <ArrowRight size={16} className="text-slate-200" />
                        <div className="px-5 py-2.5 bg-[#1e61f0] text-white rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-blue-200">Collection</div>
                        <ArrowRight size={16} className="text-slate-200" />
                        <div className="px-5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reconciliation</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN VIEW COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const PaymentsReceivedView = () => {
    const navigate = useNavigate();
    const { id: routeId } = useParams();
    const [selectedRecordId, setSelectedRecordId] = useState(null);
    const location = useLocation();
    const companyId = sessionStorage.getItem('companyId');
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { addNotification } = useNotificationStore();

    const fetchPayments = async (autoSelectId = null) => {
        try {
            setLoading(true);
            const res = await voucherAPI.getByCompany(companyId);
            const receipts = res.data.filter(v => v.voucherType === 'Receipt');
            setPayments(receipts);
            // Auto-select: prefer a specific id passed in, otherwise select the first record
            if (autoSelectId) {
                setSelectedRecordId(autoSelectId);
            } else if (receipts.length > 0 && !selectedRecordId) {
                setSelectedRecordId(receipts[0].id);
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        if (companyId) {
            const autoId = location.state?.selectedId || null;
            fetchPayments(autoId);
        }
    }, [companyId]);

    const filtered = useMemo(() => {
        return payments.filter(p => {
            const customer = p.Transactions.find(t => {
                const groupName = (t.Ledger?.Group?.name || t.Ledger?.group?.name || '').toLowerCase();
                return groupName.includes('debtors') || 
                       groupName.includes('customer') || 
                       (parseFloat(t.credit || 0) > 0 && !groupName.includes('bank') && !groupName.includes('cash'));
            })?.Ledger?.name;
            return (
                p.voucherNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (customer && customer.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        });
    }, [payments, searchTerm]);

    // Handle NEW route
    if (location.pathname === '/payments/new') {
        return <PaymentEntryForm companyId={companyId} navigate={navigate} onRefresh={fetchPayments} />;
    }

    return (
        <div className="flex h-screen bg-white font-sans overflow-hidden">
            {/* List Sidebar */}
            {payments.length > 0 && (
                <div className={`flex flex-col border-r border-slate-100 transition-all duration-300 no-print ${selectedRecordId ? 'w-[380px]' : 'w-[420px]'}`}>
                {/* Header Section */}
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                    <div>
                        <h2 className="text-[16px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
                            Payments Received
                            <ChevronDown size={14} className="opacity-40" />
                        </h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Fund Settlement Log</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => navigate('/payments/new')}
                            className="p-2 bg-[#1e61f0] text-white rounded-lg font-bold hover:bg-[#1a54d1] transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                        >
                            <Plus size={18}/>
                        </button>
                    </div>
                </div>

                {/* Search & Filter Section */}
                <div className="px-6 py-3 border-b border-slate-50 flex items-center gap-3 shrink-0 bg-slate-50/30">
                    <Search size={14} className="text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Search settlements..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-slate-300 font-bold text-slate-700"
                    />
                    <div className="w-px h-4 bg-slate-200" />
                    <Filter size={14} className="text-slate-400 cursor-pointer hover:text-[#1e61f0] transition-all" />
                </div>

                {/* Payments List */}
                <div className="flex-1 overflow-y-auto divide-y divide-slate-50 custom-scrollbar">
                    {loading ? (
                        <div className="p-20 text-center space-y-4">
                             <Loader2 size={24} className="animate-spin text-blue-100 mx-auto" />
                             <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Scanning Ledger...</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="p-20 text-center text-slate-200 italic font-bold uppercase tracking-widest text-[10px] opacity-40">
                            No Matches Found
                        </div>
                    ) : (
                        filtered.map(p => {
                            const customerLdgr = p.Transactions.find(t => {
                                const groupName = (t.Ledger?.Group?.name || t.Ledger?.group?.name || '').toLowerCase();
                                return groupName.includes('debtors') || 
                                       groupName.includes('customer') || 
                                       (parseFloat(t.credit || 0) > 0 && !groupName.includes('bank') && !groupName.includes('cash'));
                            })?.Ledger;
                            const customerName = customerLdgr?.name || 'Customer';
                            const amount = p.Transactions.reduce((s, t) => s + parseFloat(t.credit || 0), 0);
                            const isActive = selectedRecordId === p.id;
                            
                            return (
                                <div 
                                    key={p.id} 
                                    onClick={() => setSelectedRecordId(p.id)}
                                    className={`px-8 py-6 cursor-pointer transition-all border-l-4 ${isActive ? 'bg-blue-50/50 border-blue-600' : 'bg-white border-transparent hover:bg-slate-50/50'}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="space-y-0.5">
                                            <span className={`text-[14px] font-bold truncate max-w-[180px] block ${isActive ? 'text-[#1e61f0]' : 'text-slate-900'}`}>
                                                {customerName}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                                                {p.voucherNumber}
                                            </span>
                                        </div>
                                        <span className="text-[14px] font-bold text-slate-900 font-mono">
                                            {getCurrencyDisplay(customerLdgr?.currency)} {amount.toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            <Calendar size={11} className="text-slate-300" /> 
                                            {new Date(p.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}
                                        </div>
                                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 text-[9px] font-bold uppercase tracking-widest rounded leading-none border border-emerald-200">
                                            Success
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
            )}

            {/* Content Area */}
            {payments.length === 0 && !loading ? (
                <PaymentsEmptyState 
                    onGoToInvoices={() => navigate('/sales-invoices', { state: { filter: 'unpaid' } })} 
                    onRecordPayment={() => navigate('/payments/new')}
                />
            ) : selectedRecordId ? (
                <PaymentReceiptDetail id={selectedRecordId} navigate={() => setSelectedRecordId(null)} companyId={companyId} />
            ) : (
               <div className="flex-1 flex flex-col items-center justify-center bg-slate-50/30 text-center p-20">
                    <div className="w-24 h-24 bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 flex items-center justify-center text-slate-200 mb-8 border border-slate-100">
                        <CreditCard size={40} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-[20px] font-bold text-slate-900 tracking-tighter uppercase mb-2">Payment Vault</h3>
                    <p className="text-[12px] text-slate-400 font-bold uppercase tracking-widest max-w-[240px]">Select a settlement record from the list to view detailed receipt</p>
               </div>
            )}
        </div>
    );
};

export default PaymentsReceivedView;
