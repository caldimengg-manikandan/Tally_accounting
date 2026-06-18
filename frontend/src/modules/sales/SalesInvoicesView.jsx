import { getUser } from '../../stores/authStore';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { salesAPI, ledgerAPI, companyAPI, mailAPI, paymentAPI } from '../../services/api';
import { 
  Plus, Search, Edit2, Trash2, 
  ChevronDown, MoreHorizontal, FileText,
  Check, AlertCircle, File, Mail, Printer,
  Share2, History, X, ChevronRight, Download,
  Send, Loader2, ArrowLeft, DollarSign, Clock,
  Tag, Info, Paperclip, Sparkles, CreditCard
} from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';
import useNotificationStore from '../../store/notificationStore';
import { getCurrencyDisplay } from '../../utils/currencies';

const formatAddress = (address) => {
    if (!address) return '';
    try {
        // Check if it's a JSON string
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
// INVOICE LIST (SIDEBAR STYLE)
// ─────────────────────────────────────────────────────────────────────────────

const InvoicesList = ({ invoices, loading, selectedId, onSelect, navigate, onRefresh }) => {
    const [searchTerm, setSearchTerm] = useState('');
    
    const filtered = invoices.filter(inv => 
        inv.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.CustomerLedger?.displayName || inv.CustomerLedger?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full bg-white border-r border-slate-200 w-[380px] shrink-0 no-print">
            {/* List Header */}
            <div className="p-4 border-b border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <button className="text-[16px] font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-tight">
                            Unpaid Invoices <ChevronDown size={16} className="text-slate-400" />
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => navigate('/sales-invoices/new')}
                            className="p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all shadow-md shadow-blue-200"
                        >
                            <Plus size={18} />
                        </button>
                        <button className="p-1.5 hover:bg-slate-50 rounded-md text-slate-400 border border-transparent hover:border-slate-100">
                            <MoreHorizontal size={18} />
                        </button>
                    </div>
                </div>

                <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                        type="text"
                        placeholder="Search in Invoices..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-lg text-[13px] font-medium outline-none focus:bg-white focus:border-blue-500 transition-all"
                    />
                </div>
            </div>

            {/* Invoices List Content */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="p-10 text-center space-y-3 opacity-40">
                        <Loader2 size={24} className="animate-spin mx-auto text-blue-600" />
                        <p className="text-[11px] font-bold uppercase tracking-widest">Hydrating Records...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-20 text-center opacity-30 italic text-[13px]">No matching invoices</div>
                ) : (
                    <div className="divide-y divide-slate-50">
                        {filtered.map(inv => {
                            const isSelected = String(inv.id) === String(selectedId);
                            return (
                                <div 
                                    key={inv.id}
                                    onClick={() => onSelect(inv.id)}
                                    className={`p-4 cursor-pointer transition-all border-l-4 flex flex-col gap-1.5
                                        ${isSelected ? 'bg-blue-50 border-l-blue-600' : 'hover:bg-slate-50 border-l-transparent'}`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className={`text-[13px] font-bold tracking-tight ${isSelected ? 'text-blue-700' : 'text-slate-900'}`}>
                                            {inv.CustomerLedger?.displayName || inv.CustomerLedger?.name}
                                        </div>
                                        <div className="text-[14px] font-bold text-slate-900 tracking-tight">
                                            {getCurrencyDisplay(inv.CustomerLedger?.currency)} {parseFloat(inv.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                        <span>{inv.invoiceNumber} | {new Date(inv.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                                        {(() => {
                                            const badge = getStatusBadge(inv);
                                            return (
                                                <span className={`text-[9px] uppercase tracking-tighter ${badge.class}`}>
                                                    {badge.label}
                                                </span>
                                            );
                                        })()}
                                    </div>
                                    {inv.dueDate && (
                                        <div className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">
                                            DUE TODAY
                                        </div>
                                    )}
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
// EMAIL COMPOSER VIEW
// ─────────────────────────────────────────────────────────────────────────────

const InvoiceEmailView = ({ invoice, company, onCancel, onSent }) => {
    const user = getUser();
    const senderName = user.email ? user.email.split('@')[0] : 'Indus CAI Administrator';
    const companyName = company?.name || 'Indus CAI private Ltd';
    const { addNotification } = useNotificationStore();

    const [to, setTo] = useState(invoice.CustomerLedger?.email || '');
    const [subject, setSubject] = useState(`Invoice - ${invoice.invoiceNumber} from ${companyName}`);
    const initialBody = `
        <div style="font-family: Arial, sans-serif; color: #334155; line-height: 1.6;">
            <div style="background-color: #3b82f6; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                <h2 style="margin: 0; font-size: 20px; font-style: italic;">Invoice #${invoice.invoiceNumber}</h2>
            </div>
            <div style="padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
                <p style="font-weight: bold; font-size: 14px;">Dear ${invoice.CustomerLedger?.displayName || invoice.CustomerLedger?.name || 'Customer'},</p>
                <p style="font-size: 14px;">Thank you for your business. Your invoice can be viewed, printed and downloaded as PDF from the link below. You can also choose to pay it online.</p>
                
                <div style="background-color: #fffbeb; border: 1px solid #fde68a; padding: 25px; border-radius: 12px; text-align: center; margin: 30px 0;">
                    <p style="text-transform: uppercase; font-size: 11px; font-weight: 800; color: #92400e; margin: 0; letter-spacing: 0.1em;">Invoice Amount</p>
                    <p style="font-size: 32px; font-weight: 900; color: #dc2626; margin: 10px 0;">${getCurrencyDisplay(invoice.CustomerLedger?.currency)} ${parseFloat(invoice.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                    
                    <table style="width: 100%; max-width: 250px; margin: 20px auto; border-collapse: collapse; text-align: left; font-size: 13px;">
                        <tr>
                            <td style="padding: 4px 0; color: #64748b; font-weight: bold;">Invoice No</td>
                            <td style="padding: 4px 0; font-weight: 900; text-align: right;">${invoice.invoiceNumber}</td>
                        </tr>
                        <tr>
                            <td style="padding: 4px 0; color: #64748b; font-weight: bold;">Invoice Date</td>
                            <td style="padding: 4px 0; font-weight: 900; text-align: right;">${new Date(invoice.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                        </tr>
                        <tr>
                            <td style="padding: 4px 0; color: #64748b; font-weight: bold;">Due Date</td>
                            <td style="padding: 4px 0; font-weight: 900; text-align: right;">${new Date(invoice.dueDate || invoice.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                        </tr>
                    </table>
                    
                    <a href="#" style="display: inline-block; background-color: #22c55e; color: white; padding: 12px 40px; border-radius: 6px; text-decoration: none; font-weight: 900; font-size: 13px; text-transform: uppercase; margin-top: 10px;">Pay Now</a>
                </div>
                
                <p style="margin-top: 30px; font-size: 14px; font-weight: bold;">Regards,</p>
                <p style="font-size: 14px; margin: 0; font-weight: bold;">${senderName}</p>
                <p style="font-size: 12px; color: #64748b; font-weight: bold;">${companyName}</p>
            </div>
        </div>
    `;

    const [body, setBody] = useState(initialBody);
    const [isSending, setIsSending] = useState(false);

    const handleSend = async () => {
        if (!to) return addNotification('Recipient email is missing', 'warning');
        setIsSending(true);
        try {
            await mailAPI.send({
                toEmail: to,
                subject,
                body,
                companyId: invoice.CompanyId,
                ledgerId: invoice.customerLedgerId,
                documentId: invoice.id,
                type: 'Invoice'
            });
            if (onSent) onSent();
        } catch (err) {
            console.error(err);
            addNotification('Failed to send email', 'error');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex-1 bg-[#f8fafc] flex flex-col h-full animate-fade-in no-print">
            <header className="px-10 py-6 bg-white border-b border-slate-200 flex items-center justify-between">
                <div>
                   <h2 className="text-2xl font-bold text-slate-900 italic tracking-tight">Email To {invoice.CustomerLedger?.displayName || invoice.CustomerLedger?.name}</h2>
                </div>
                <button onClick={onCancel} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400">
                    <X size={24} />
                </button>
            </header>

            <div className="flex-1 overflow-y-auto p-10 flex gap-10">
                {/* Editor Panel */}
                <div className="w-[600px] shrink-0 space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
                        <div className="p-6 space-y-4">
                            <div className="flex items-center gap-4">
                                <label className="w-20 text-[11px] font-bold text-slate-400 uppercase tracking-widest">From</label>
                                <div className="flex-1 p-2 bg-slate-50 border border-slate-100 rounded text-[13px] font-bold text-slate-500 italic">
                                    Organization &lt;calbuy160@gmail.com&gt;
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <label className="w-20 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Send To</label>
                                <input 
                                    type="email" 
                                    value={to}
                                    onChange={e => setTo(e.target.value)}
                                    placeholder="Enter customer email address..."
                                    className="flex-1 p-2.5 border border-slate-200 rounded-lg text-[13px] font-bold text-slate-800 outline-none focus:border-blue-500 transition-all"
                                />
                            </div>
                            <div className="flex items-center gap-4">
                                <label className="w-20 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Subject</label>
                                <input 
                                    type="text" 
                                    value={subject}
                                    onChange={e => setSubject(e.target.value)}
                                    className="flex-1 p-2.5 border border-slate-200 rounded-lg text-[13px] font-bold text-slate-800 outline-none focus:border-blue-500 transition-all italic"
                                />
                            </div>
                        </div>
                        
                         {/* Body Editor Box */}
                        <div className="border-t border-slate-100 p-6 space-y-4 min-h-[400px]">
                             <div 
                                contentEditable
                                onBlur={(e) => setBody(e.currentTarget.innerHTML)}
                                dangerouslySetInnerHTML={{ __html: initialBody }}
                                className="w-full h-[400px] outline-none text-[15px] font-medium text-slate-700 leading-relaxed overflow-y-auto no-scrollbar"
                             />
                             
                             <div className="pt-4 border-t border-slate-100 bg-slate-50 -mx-6 -mb-6 p-6">
                                 <div className="flex flex-wrap items-center gap-3">
                                    <div className="bg-white border border-slate-200 rounded-lg p-2 pr-4 flex items-center gap-3 shadow-sm group hover:border-blue-200 transition-all">
                                        <div className="w-8 h-10 bg-rose-50 rounded flex items-center justify-center text-rose-500 font-bold text-[8px] uppercase tracking-widest shadow-inner">
                                            PDF
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="text-[11px] font-bold text-slate-700 tracking-tight">Invoice_{invoice.invoiceNumber}.pdf</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Automatic Attachment</p>
                                        </div>
                                    </div>
                                    <div className="w-px h-10 bg-slate-200 mx-2" />
                                    <button className="text-[12px] font-bold text-blue-600 hover:underline uppercase tracking-widest flex items-center gap-2">
                                       <Plus size={14} /> Add More
                                    </button>
                                 </div>
                             </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button 
                            onClick={handleSend}
                            disabled={isSending}
                            className="px-10 py-3 bg-blue-600 text-white rounded-xl text-[14px] font-bold hover:bg-blue-700 shadow-2xl shadow-blue-600/30 transition-all flex items-center gap-2 uppercase tracking-widest"
                        >
                            {isSending ? <Loader2 size={18} className="animate-spin" /> : <><Send size={18}/> Send Message</>}
                        </button>
                        <button onClick={onCancel} className="text-[13px] font-bold text-slate-400 hover:text-slate-900 tracking-widest uppercase">Cancel</button>
                    </div>
                </div>

                {/* Live Preview Panel (Reflecting user's text request) */}
                <div className="flex-1 space-y-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Template Preview</p>
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-12 space-y-12 min-h-[700px]">
                        {/* Header Box */}
                        <div className="bg-blue-600 text-white p-8 rounded-2xl text-center shadow-xl shadow-blue-100">
                             <h4 className="text-[18px] font-bold uppercase tracking-widest opacity-80">Invoice #{invoice.invoiceNumber}</h4>
                        </div>

                        {/* Content */}
                        <div className="space-y-10 text-center">
                            <p className="text-[16px] text-slate-600 font-medium">Dear {invoice.CustomerLedger?.displayName || invoice.CustomerLedger?.name},</p>
                            <p className="text-[16px] text-slate-500 leading-relaxed max-w-md mx-auto">
                                Thank you for your business. Your invoice can be viewed, printed and downloaded as PDF from the link below. You can also choose to pay it online.
                            </p>
                            
                            {/* Requested Template Block */}
                            <div className="bg-[#fffcf0] border border-amber-100 py-10 px-6 space-y-6">
                                <div>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-2">Invoice Amount</p>
                                    <h1 className="text-4xl font-bold text-slate-900 italic tracking-tight">{getCurrencyDisplay(invoice.CustomerLedger?.currency)} {parseFloat(invoice.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h1>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-y-3 max-w-[280px] mx-auto pt-6 border-t border-amber-200/50">
                                    <div className="text-left text-[12px] font-bold text-slate-400">Invoice No</div>
                                    <div className="text-right text-[12px] font-bold text-slate-900">{invoice.invoiceNumber}</div>
                                    
                                    <div className="text-left text-[12px] font-bold text-slate-400">Invoice Date</div>
                                    <div className="text-right text-[12px] font-bold text-slate-900">{new Date(invoice.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
                                    
                                    <div className="text-left text-[12px] font-bold text-slate-400">Due Date</div>
                                    <div className="text-right text-[12px] font-bold text-slate-900">{new Date(invoice.dueDate || invoice.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
                                </div>

                                <div className="pt-8">
                                    <button className="px-10 py-4 bg-emerald-600 text-white rounded-xl text-[14px] font-bold hover:bg-emerald-700 shadow-2xl shadow-emerald-100 transition-all uppercase tracking-widest">
                                        PAY NOW
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Regards */}
                        <div className="pt-10 border-t border-slate-100">
                             <p className="text-slate-400 text-[13px] italic">Regards,</p>
                             <p className="text-slate-900 font-bold text-[15px] italic tracking-tight">{senderName}</p>
                             <p className="text-slate-500 font-bold text-[13px] uppercase tracking-widest">{companyName}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// INVOICE DETAIL VIEW (ZOHO STYLE)
// ─────────────────────────────────────────────────────────────────────────────

const InvoiceDetail = ({ id, company, navigate, onRefresh }) => {
    const { addNotification } = useNotificationStore();
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentView, setCurrentView] = useState('detail'); // 'detail' or 'email'
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [generatingLink, setGeneratingLink] = useState(false);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        salesAPI.getById(id)
            .then(res => setInvoice(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [id]);

    const handleGenerateLink = async () => {
        setGeneratingLink(true);
        try {
            const res = await paymentAPI.generateLink(id);
            addNotification('Payment link generated successfully!', 'success');
            // Refresh invoice data
            const refreshed = await salesAPI.getById(id);
            setInvoice(refreshed.data);
            onRefresh();
        } catch (err) {
            console.error(err);
            addNotification(err.response?.data?.error || 'Failed to generate payment link', 'error');
        } finally {
            setGeneratingLink(false);
        }
    };

    const handleDelete = async () => {
        try {
            await salesAPI.deleteInvoice(id);
            addNotification('Invoice deleted successfully', 'success');
            onRefresh();
            navigate('/sales-invoices');
        } catch (err) {
            addNotification('Failed to delete invoice', 'error');
        }
    };

    const handleMarkAsSent = async () => {
        try {
            await salesAPI.updateInvoice(id, { status: 'Sent' });
            addNotification('Invoice marked as sent', 'success');
            onRefresh();
            salesAPI.getById(id).then(res => setInvoice(res.data));
        } catch (err) {
            addNotification('Failed to update status', 'error');
        }
    };

    if (loading) return <div className="flex-1 flex items-center justify-center text-slate-300 font-bold animate-pulse">HYDRATING DOCUMENT...</div>;
    if (!invoice) return <div className="flex-1 flex items-center justify-center text-slate-200 text-4xl font-bold uppercase italic tracking-tight opacity-20">Document Not Found</div>;

    if (currentView === 'email') return <InvoiceEmailView invoice={invoice} company={company} onCancel={() => setCurrentView('detail')} onSent={async () => { 
        await salesAPI.updateInvoice(id, { status: 'Sent' });
        addNotification('Email queued for delivery', 'success'); 
        onRefresh();
        setCurrentView('detail'); 
        salesAPI.getById(id).then(res => setInvoice(res.data));
    }} />;

    const items = invoice.items || [];

    return (
        <div className="flex-1 flex flex-col h-full bg-white animate-fade-in">
            {/* Split View Sub-Header */}
            <div className="px-6 py-3 bg-[#fcfdfe] border-b border-slate-200 flex items-center justify-between no-print sticky top-0 z-20">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/sales-invoices')} className="text-blue-600 font-bold text-[13px] hover:underline flex items-center gap-1.5">
                       <ArrowLeft size={16} /> All Invoices
                    </button>
                    <span className="text-slate-300">|</span>
                    <span className="text-[13px] font-bold text-slate-800">{invoice.invoiceNumber}</span>
                </div>
                <div className="flex items-center gap-3">
                    <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors"><Edit2 size={16}/></button>
                    <button onClick={() => setCurrentView('email')} className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Mail size={16}/></button>
                    <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors"><Printer size={16}/></button>
                    <span className="w-px h-6 bg-slate-200 mx-1" />
                    <button onClick={() => setIsDeleteModalOpen(true)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 size={16}/></button>
                </div>
            </div>

            {/* Sub-Toolbar (Zoho Style) */}
            <div className="px-6 py-2.5 bg-white border-b border-slate-100 flex items-center gap-3 no-print">
                 <button onClick={() => navigate(`/sales-invoices/edit/${invoice.id}`)} className="px-3 py-1.5 border border-slate-200 rounded text-[12px] font-bold text-slate-600 hover:bg-slate-50 transition-all uppercase tracking-widest shadow-sm">Edit</button>
                 <button onClick={() => setCurrentView('email')} className="px-3 py-1.5 border border-slate-200 rounded text-[12px] font-bold text-slate-600 hover:bg-slate-50 transition-all uppercase tracking-widest shadow-sm flex items-center gap-2"><Send size={14}/> Send Email</button>
                 <button className="px-3 py-1.5 border border-slate-200 rounded text-[12px] font-bold text-slate-600 hover:bg-slate-50 transition-all uppercase tracking-widest shadow-sm">PDF/Print <ChevronDown size={14}/></button>
                 <button className="px-3 py-1.5 border border-slate-200 rounded text-[12px] font-bold text-slate-600 hover:bg-slate-50 transition-all uppercase tracking-widest shadow-sm flex items-center gap-2"><DollarSign size={14}/> Record Payment</button>
                 {parseFloat(invoice.balance || invoice.totalAmount) > 0 && invoice.status !== 'Draft' && (
                     <button 
                         onClick={handleGenerateLink}
                         disabled={generatingLink}
                         className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-500 text-white rounded text-[12px] font-bold transition-all uppercase tracking-widest shadow-sm flex items-center gap-2"
                     >
                         {generatingLink ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14}/>} Generate Payment Link
                     </button>
                 )}
            </div>

            {/* What's Next Banner */}
            {(invoice.status === 'Confirmed' || invoice.status === 'Draft' || !invoice.status) && (
                <div className="mx-8 mt-6 mb-0 p-4 bg-[#f0f7ff] border border-blue-100 rounded-xl flex items-center justify-between no-print animate-fade-in shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                            <Sparkles size={16} />
                        </div>
                        <p className="text-[14px] font-medium text-slate-700">
                            <span className="font-bold text-slate-900 uppercase">What's next?</span> Send this Invoice to your customer or mark it as Sent.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setCurrentView('email')}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-[13px] font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-200"
                        >
                            Send Invoice
                        </button>
                        <button 
                            onClick={handleMarkAsSent}
                            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-[13px] font-bold hover:bg-slate-50 transition-all shadow-sm"
                        >
                            Mark As Sent
                        </button>
                    </div>
                </div>
            )}

            {/* Document Scrolling Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-10 flex flex-col items-center custom-scrollbar print:p-0 print:bg-white transition-all bg-slate-100">
                 {/* Main Scrollable Invoice Document */}
                 <div id="printable-invoice" className="bg-white w-full max-w-[820px] mx-auto mb-20 border border-slate-300 shadow-xl relative" style={{fontFamily: 'Arial, sans-serif', fontSize: '12px'}} >
                    
                    {/* Status Ribbon (no-print) */}
                    {(() => {
                        const badge = getStatusBadge(invoice);
                        const ribbonColor = badge.label.includes('OVERDUE') ? 'bg-rose-600' : 
                                            badge.label === 'PAID' ? 'bg-blue-600' :
                                            badge.label === 'SENT' ? 'bg-emerald-600' : 'bg-slate-400';
                        return (
                            <div className={`absolute top-8 -right-12 w-48 py-2 text-[10px] font-bold uppercase tracking-[0.2em] transform rotate-45 text-center shadow-lg text-white no-print ${ribbonColor}`}>
                                {badge.label}
                            </div>
                        );
                    })()}

                    {/* ─── TALLY-STYLE HEADER ─── */}
                    <table style={{width:'100%', borderCollapse:'collapse', borderBottom:'2px solid #000'}} >
                        <tbody>
                            <tr>
                                <td style={{padding:'10px 14px', verticalAlign:'top', width:'50%', borderRight:'1px solid #000'}} >
                                    <div style={{fontWeight:'bold', fontSize:'15px'}} >{company?.name || 'N/A'}</div>
                                    <div style={{fontSize:'11px', color:'#333', marginTop:'2px'}} >
                                        {company?.state || 'Tamil Nadu'}, India
                                    </div>
                                    {company?.email && <div style={{fontSize:'11px', color:'#555', marginTop:'2px'}} >Email: {company.email}</div>}
                                </td>
                                <td style={{padding:'10px 14px', verticalAlign:'top', width:'50%', textAlign:'center'}} >
                                    <div style={{fontWeight:'bold', fontSize:'16px', letterSpacing:'1px', marginBottom:'4px'}} >TAX INVOICE</div>
                                    <div style={{fontSize:'11px', color:'#555'}} >Invoice No: <strong>{invoice.invoiceNumber}</strong></div>
                                    <div style={{fontSize:'11px', color:'#555'}} >Date: <strong>{new Date(invoice.date).toLocaleDateString('en-IN', {day:'2-digit', month:'2-digit', year:'numeric'})}</strong></div>
                                    {invoice.orderNumber && <div style={{fontSize:'11px', color:'#555'}} >Order No: <strong>{invoice.orderNumber}</strong></div>}
                                    {invoice.dueDate && <div style={{fontSize:'11px', color:'#555'}} >Due Date: <strong>{new Date(invoice.dueDate).toLocaleDateString('en-IN', {day:'2-digit', month:'2-digit', year:'numeric'})}</strong></div>}
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    {/* ─── BUYER / CONSIGNEE SECTION ─── */}
                    <table style={{width:'100%', borderCollapse:'collapse', borderBottom:'1px solid #000'}} >
                        <tbody>
                            <tr>
                                <td style={{padding:'8px 14px', verticalAlign:'top', width:'50%', borderRight:'1px solid #000'}} >
                                    <div style={{fontWeight:'bold', fontSize:'11px', textDecoration:'underline', marginBottom:'4px'}} >Buyer (Bill To):</div>
                                    <div style={{fontWeight:'bold'}} >{invoice.CustomerLedger?.displayName || invoice.CustomerLedger?.name}</div>
                                    <div style={{fontSize:'11px', color:'#333'}} >
                                        {formatAddress(invoice.CustomerLedger?.billingAddress || invoice.CustomerLedger?.address) || 'No billing address provided.'}
                                    </div>
                                    {invoice.CustomerLedger?.gstNumber && <div style={{fontSize:'11px', marginTop:'3px'}} >GSTIN/UIN: {invoice.CustomerLedger.gstNumber}</div>}
                                    {invoice.CustomerLedger?.state && <div style={{fontSize:'11px'}} >State: {invoice.CustomerLedger.state}</div>}
                                </td>
                                <td style={{padding:'8px 14px', verticalAlign:'top', width:'50%'}} >
                                    <div style={{fontWeight:'bold', fontSize:'11px', textDecoration:'underline', marginBottom:'4px'}} >Consignee (Ship To):</div>
                                    <div style={{fontWeight:'bold'}} >{invoice.CustomerLedger?.displayName || invoice.CustomerLedger?.name}</div>
                                    <div style={{fontSize:'11px', color:'#333'}} >
                                        {formatAddress(invoice.CustomerLedger?.shippingAddress || invoice.CustomerLedger?.address) || 'No shipping address provided.'}
                                    </div>
                                    {invoice.CustomerLedger?.gstNumber && <div style={{fontSize:'11px', marginTop:'3px'}} >GSTIN/UIN: {invoice.CustomerLedger.gstNumber}</div>}
                                    {invoice.CustomerLedger?.state && <div style={{fontSize:'11px'}} >State: {invoice.CustomerLedger.state}</div>}
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    {/* ─── LINE ITEMS TABLE ─── */}
                    <table style={{width:'100%', borderCollapse:'collapse'}} >
                        <thead>
                            <tr style={{background:'#f0f0f0'}} >
                                <th style={{border:'1px solid #000', padding:'6px 8px', textAlign:'center', width:'40px'}} >Sl. No.</th>
                                <th style={{border:'1px solid #000', padding:'6px 8px', textAlign:'left'}} >Description of Goods</th>
                                <th style={{border:'1px solid #000', padding:'6px 8px', textAlign:'center', width:'90px'}} >HSN/SAC</th>
                                <th style={{border:'1px solid #000', padding:'6px 8px', textAlign:'center', width:'80px'}} >Quantity</th>
                                <th style={{border:'1px solid #000', padding:'6px 8px', textAlign:'right', width:'90px'}} >Rate</th>
                                <th style={{border:'1px solid #000', padding:'6px 8px', textAlign:'center', width:'50px'}} >per</th>
                                <th style={{border:'1px solid #000', padding:'6px 8px', textAlign:'right', width:'100px'}} >Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.length === 0 && (
                                <tr><td colSpan="7" style={{border:'1px solid #000', padding:'20px', textAlign:'center', color:'#999'}} >No items</td></tr>
                            )}
                            {items.map((it, idx) => (
                                <tr key={idx} >
                                    <td style={{border:'1px solid #000', padding:'6px 8px', textAlign:'center', verticalAlign:'top'}} >{idx + 1}</td>
                                    <td style={{border:'1px solid #000', padding:'6px 8px', verticalAlign:'top'}} >
                                        <div style={{fontWeight:'bold'}} >{it.Item?.name || 'Service Item'}</div>
                                        {it.description && <div style={{fontSize:'11px', color:'#555', marginTop:'2px'}} >{it.description}</div>}
                                    </td>
                                    <td style={{border:'1px solid #000', padding:'6px 8px', textAlign:'center', verticalAlign:'top'}} >{it.Item?.hsnCode || ''}</td>
                                    <td style={{border:'1px solid #000', padding:'6px 8px', textAlign:'center', verticalAlign:'top'}} >{parseFloat(it.quantity || 1).toFixed(2)}</td>
                                    <td style={{border:'1px solid #000', padding:'6px 8px', textAlign:'right', verticalAlign:'top'}} >{parseFloat(it.rate || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                                    <td style={{border:'1px solid #000', padding:'6px 8px', textAlign:'center', verticalAlign:'top'}} >{it.Item?.unit || 'Nos'}</td>
                                    <td style={{border:'1px solid #000', padding:'6px 8px', textAlign:'right', verticalAlign:'top', fontWeight:'bold'}} >{parseFloat(it.amount || (it.quantity * it.rate)).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            {/* Sub Total row */}
                            <tr style={{background:'#f9f9f9'}} >
                                <td colSpan="3" style={{border:'1px solid #000', padding:'6px 8px', fontWeight:'bold', textAlign:'right'}} >Total</td>
                                <td style={{border:'1px solid #000', padding:'6px 8px', textAlign:'center', fontWeight:'bold'}} >
                                    {items.reduce((s, it) => s + parseFloat(it.quantity || 0), 0).toFixed(2)}
                                </td>
                                <td style={{border:'1px solid #000', padding:'6px 8px'}} ></td>
                                <td style={{border:'1px solid #000', padding:'6px 8px'}} ></td>
                                <td style={{border:'1px solid #000', padding:'6px 8px', textAlign:'right', fontWeight:'bold'}} >
                                    {parseFloat(invoice.subTotal || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}
                                </td>
                            </tr>
                            {/* GST row */}
                            {parseFloat(invoice.gstAmount || 0) > 0 && (
                                <tr>
                                    <td colSpan="6" style={{border:'1px solid #000', padding:'6px 8px', textAlign:'right'}} >
                                        GST (18%)
                                    </td>
                                    <td style={{border:'1px solid #000', padding:'6px 8px', textAlign:'right', fontWeight:'bold'}} >
                                        {parseFloat(invoice.gstAmount || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}
                                    </td>
                                </tr>
                            )}
                            {/* Grand Total row */}
                            <tr style={{background:'#e8e8e8'}} >
                                <td colSpan="6" style={{border:'2px solid #000', padding:'8px', textAlign:'right', fontWeight:'bold', fontSize:'13px'}} >Grand Total</td>
                                <td style={{border:'2px solid #000', padding:'8px', textAlign:'right', fontWeight:'bold', fontSize:'13px'}} >
                                    {getCurrencyDisplay(invoice.CustomerLedger?.currency)}{' '}
                                    {parseFloat(invoice.totalAmount || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}
                                </td>
                            </tr>
                        </tfoot>
                    </table>

                    {/* ─── NOTES & TERMS ─── */}
                    {(invoice.customerNotes || invoice.termsConditions) && (
                        <table style={{width:'100%', borderCollapse:'collapse', borderTop:'1px solid #000', marginTop:'0'}} >
                            <tbody>
                                <tr>
                                    {invoice.customerNotes && (
                                        <td style={{padding:'8px 14px', verticalAlign:'top', width:'50%', borderRight: invoice.termsConditions ? '1px solid #000' : 'none'}} >
                                            <div style={{fontWeight:'bold', fontSize:'11px', marginBottom:'3px'}} >Customer Notes:</div>
                                            <div style={{fontSize:'11px', color:'#333', whiteSpace:'pre-wrap'}} >{invoice.customerNotes}</div>
                                        </td>
                                    )}
                                    {invoice.termsConditions && (
                                        <td style={{padding:'8px 14px', verticalAlign:'top', width:'50%'}} >
                                            <div style={{fontWeight:'bold', fontSize:'11px', marginBottom:'3px'}} >Terms & Conditions:</div>
                                            <div style={{fontSize:'11px', color:'#333', whiteSpace:'pre-wrap'}} >{invoice.termsConditions}</div>
                                        </td>
                                    )}
                                </tr>
                            </tbody>
                        </table>
                    )}

                    {/* ─── SIGNATURE BLOCK ─── */}
                    <table style={{width:'100%', borderCollapse:'collapse', borderTop:'1px solid #000', marginTop:'0'}} >
                        <tbody>
                            <tr>
                                <td style={{padding:'16px 14px 28px', verticalAlign:'bottom', width:'50%', borderRight:'1px solid #000'}} >
                                    <div style={{fontSize:'11px', color:'#555', marginBottom:'4px'}} >Receiver's Signature & Stamp</div>
                                    <div style={{borderTop:'1px solid #000', width:'70%', marginTop:'32px'}} ></div>
                                </td>
                                <td style={{padding:'16px 14px 28px', verticalAlign:'bottom', width:'50%', textAlign:'right'}} >
                                    <div style={{fontSize:'11px', color:'#555', marginBottom:'4px'}} >For Authorized Signatory</div>
                                    <div style={{borderTop:'1px solid #000', width:'60%', marginTop:'32px', marginLeft:'auto'}} ></div>
                                    <div style={{fontSize:'11px', marginTop:'4px', textAlign:'right', fontWeight:'bold'}} >{invoice.salesperson || company?.name || 'Authorized Signatory'}</div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                 </div>

                 {/* Online Payments & Settlement Panel (no-print) */}
                 <div className="w-full max-w-[820px] mx-auto bg-white border border-slate-200 rounded-2xl shadow-md p-6 space-y-6 no-print mt-8">
                     <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                         <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                             <CreditCard className="text-blue-600" size={18} /> Online Payments & Portal Link
                         </h3>
                         <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                             ${invoice.status === 'Paid' 
                                 ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                                 : invoice.status === 'Partially Paid' 
                                     ? 'bg-amber-50 text-amber-700 border border-amber-100' 
                                     : 'bg-slate-50 text-slate-500 border border-slate-150'}`}>
                             {invoice.status || 'Pending Checkout'}
                         </span>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         {/* Secure Portal Link Sharing */}
                         <div className="space-y-3">
                             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                 Secure Client Portal Link
                             </label>
                             <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                                 Share this secure, unauthenticated checkout link with the client. It expires in 30 days.
                             </p>
                             {invoice.shareToken ? (
                                 <div className="flex gap-2">
                                     <input 
                                         type="text" 
                                         readOnly 
                                         value={`${window.location.origin}/shared/invoice/${invoice.shareToken}`}
                                         className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-600 outline-none select-all"
                                     />
                                     <button 
                                         onClick={() => {
                                             navigator.clipboard.writeText(`${window.location.origin}/shared/invoice/${invoice.shareToken}`);
                                             addNotification('Copied client checkout link to clipboard!', 'success');
                                         }}
                                         className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 rounded-lg text-xs font-bold transition-all"
                                     >
                                         Copy Link
                                     </button>
                                 </div>
                             ) : (
                                 <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-800 text-[11px] font-medium leading-relaxed">
                                     No secure public link generated yet. Click "Generate Payment Link" in the toolbar to create one.
                                 </div>
                             )}
                         </div>

                         {/* Active Gateway Link & Reconciliation details */}
                         <div className="space-y-3">
                             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                 Gateway Redirect Link
                             </label>
                             <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                                 Direct checkout page on Razorpay payment gateway.
                             </p>
                             {invoice.paymentLink ? (
                                 <div className="flex gap-2">
                                     <input 
                                         type="text" 
                                         readOnly 
                                         value={invoice.paymentLink}
                                         className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-600 outline-none select-all"
                                     />
                                     <a 
                                         href={invoice.paymentLink} 
                                         target="_blank" 
                                         rel="noopener noreferrer"
                                         className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold text-center transition-all flex items-center justify-center"
                                     >
                                         Open Link
                                     </a>
                                 </div>
                             ) : (
                                 <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 text-[11px] text-center font-medium leading-relaxed">
                                     Payment gateway link has not been generated for this invoice.
                                 </div>
                             )}
                         </div>
                     </div>

                     {/* Installment History list */}
                     <div className="pt-4 border-t border-slate-100 space-y-3">
                         <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                             Installment & Payment History
                         </label>
                         {invoice.payments && invoice.payments.length > 0 ? (
                             <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100">
                                 {invoice.payments.map((p, idx) => (
                                     <div key={p.id || idx} className="px-4 py-3 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors">
                                         <div className="flex items-center gap-3">
                                             <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-[10px] uppercase tracking-wider shadow-inner">
                                                 Rec
                                             </div>
                                             <div>
                                                 <div className="font-bold text-slate-800">
                                                     Payment Received via {p.paymentMode || 'Gateway'}
                                                 </div>
                                                 <div className="text-[10px] text-slate-400 font-medium">
                                                     {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'} 
                                                     {p.reference && ` • Ref: ${p.reference}`}
                                                 </div>
                                             </div>
                                         </div>
                                         <div className="text-right">
                                             <p className="font-extrabold text-emerald-600 font-mono">
                                                 + {getCurrencyDisplay(invoice.CustomerLedger?.currency)} {parseFloat(p.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                             </p>
                                         </div>
                                     </div>
                                 ))}
                             </div>
                         ) : (
                             <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 text-xs text-center font-medium leading-relaxed">
                                 No payment captures or installments recorded yet.
                             </div>
                         )}
                     </div>
                 </div>

                 <div className="mt-8 mb-20 text-[11px] font-bold text-slate-300 uppercase tracking-[0.3em] flex items-center gap-3 no-print opacity-50">
                     Document ID: {invoice.id} <ChevronDown size={14} />
                 </div>
            </div>

            <ConfirmModal 
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Delete Invoice"
                message="Are you sure you want to permanently delete this invoice? This action cannot be undone."
                type="danger"
            />
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// FULL TABLE VIEW (INITIAL STATE)
// ─────────────────────────────────────────────────────────────────────────────

const InvoicesTableView = ({ invoices, loading, onSelect, navigate, fetchInvoices, filterType }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [idToDelete, setIdToDelete] = useState(null);
    const { addNotification } = useNotificationStore();

    const handleDelete = async () => {
        if (!idToDelete) return;
        try {
            await salesAPI.deleteInvoice(idToDelete);
            addNotification('Invoice deleted successfully', 'success');
            fetchInvoices();
        } catch (err) {
            addNotification('Failed to delete invoice', 'error');
        } finally {
            setIsDeleteModalOpen(false);
            setIdToDelete(null);
        }
    };
    
    const filtered = invoices.filter(inv => {
        const matchesSearch = inv.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (inv.CustomerLedger?.displayName || inv.CustomerLedger?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
        
        if (filterType === 'unpaid') {
            return matchesSearch && parseFloat(inv.balance || inv.totalAmount) > 0;
        }
        return matchesSearch;
    });

    return (
        <div className="flex-1 flex flex-col h-full bg-white animate-fade-in overflow-hidden">
            {/* HEADER: Synchronized with Customers/Quotes */}
            <div className="flex items-center justify-between px-8 py-4 border-b border-slate-100">
                <div className="flex items-center gap-4">
                    {filterType === 'unpaid' && (
                        <button 
                            onClick={() => navigate(-1)}
                            className="p-2 -ml-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all"
                            title="Back"
                        >
                            <ArrowLeft size={20} />
                        </button>
                    )}
                    <div className="flex items-center gap-2 group cursor-pointer">
                        <h1 className="text-[20px] font-bold text-slate-900">
                            {filterType === 'unpaid' ? 'Unpaid Invoices' : 'All Invoices'}
                        </h1>
                        <ChevronDown size={18} className="text-blue-600 mt-1" />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                   <button 
                      onClick={() => navigate('/sales-invoices/new')}
                      className="bg-[#1e61f0] hover:bg-[#1a54d1] text-white px-4 py-2 rounded-md font-medium flex items-center gap-1.5 transition-all shadow-sm"
                   >
                      <Plus size={18} strokeWidth={2.5}/> New Invoice
                   </button>
                   <div className="relative">
                      <button className="p-2 text-slate-500 hover:text-slate-800 border border-slate-200 bg-white rounded-md hover:bg-slate-50 transition-colors shadow-sm">
                         <MoreHorizontal size={18} />
                      </button>
                   </div>
                </div>
            </div>

            {/* SEARCH/FILTER BAR */}
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
                        onClick={fetchInvoices}
                        className="p-2 text-slate-400 hover:text-[#1e61f0] transition-colors"
                        title="Refresh"
                    >
                        <History size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-1.5 text-slate-500 text-[13px] font-medium hover:text-slate-900 transition-colors">
                        <Tag size={14} /> Filter
                    </button>
                    <div className="w-px h-4 bg-slate-200 mx-2" />
                    <button className="h-9 px-4 flex items-center gap-2 bg-white border border-slate-200 text-slate-600 rounded-[4px] text-[11px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
                        <Download size={14} /> Export
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
                {loading ? (
                    <div className="py-24 text-center font-bold text-slate-400 animate-pulse uppercase tracking-widest">Syncing...</div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Invoice #</th>
                                <th className="px-6 py-4">Order Number</th>
                                <th className="px-6 py-4">Customer Name</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-center">Due Date</th>
                                <th className="px-6 py-4 text-right">Amount</th>
                                <th className="px-6 py-4 text-right">Balance Due</th>
                                <th className="px-6 py-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="11" className="py-20 text-center">
                                       <div className="flex flex-col items-center justify-center gap-3">
                                          <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                                             <FileText size={24} />
                                          </div>
                                          <p className="text-slate-500 text-[14px]">No invoices found.</p>
                                          <button onClick={() => navigate('/sales-invoices/new')} className="text-blue-600 text-[13px] font-medium hover:underline">Create an invoice</button>
                                       </div>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(inv => (
                                    <tr 
                                        key={inv.id} 
                                        onClick={() => onSelect(inv.id)}
                                        className="hover:bg-slate-50 cursor-pointer group transition-colors"
                                    >
                                        <td className="px-6 py-4 text-[13px] text-slate-500 font-medium whitespace-nowrap">
                                            {new Date(inv.date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-[14px] font-medium text-blue-600 group-hover:underline">
                                                {inv.invoiceNumber}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-[13px] text-slate-500 font-medium whitespace-nowrap">
                                            {inv.orderNumber || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-[14px] font-medium text-slate-800">{inv.CustomerLedger?.displayName || inv.CustomerLedger?.name}</div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {(() => {
                                                const badge = getStatusBadge(inv);
                                                return (
                                                    <span className={`uppercase text-[11px] font-bold tracking-tight ${badge.class}`}>
                                                        {badge.label}
                                                    </span>
                                                );
                                            })()}
                                        </td>
                                        <td className="px-6 py-4 text-[13px] text-slate-500 font-medium text-center whitespace-nowrap">
                                            {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right whitespace-nowrap">
                                            <span className="text-[14px] text-slate-900 font-medium">
                                                {getCurrencyDisplay(inv.CustomerLedger?.currency)} {parseFloat(inv.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right whitespace-nowrap">
                                            <span className={`text-[14px] font-bold text-slate-900`}>
                                                {getCurrencyDisplay(inv.CustomerLedger?.currency)} {parseFloat(inv.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); navigate(`/sales-invoices/edit/${inv.id}`); }} 
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 rounded shadow-sm transition-all text-[12px] font-medium"
                                                >
                                                    <Edit2 size={13} /> Edit
                                                </button>
                                                <button 
                                                    onClick={(e) => { 
                                                        e.stopPropagation(); 
                                                        setIdToDelete(inv.id);
                                                        setIsDeleteModalOpen(true);
                                                    }}
                                                    className="flex items-center justify-center p-1.5 bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 rounded shadow-sm transition-all"
                                                    title="Delete Invoice"
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
            <ConfirmModal 
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Delete Invoice"
                message="Are you sure you want to permanently delete this invoice? This action cannot be undone."
                type="danger"
            />
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SALES INVOICES VIEW (DYNAMIC TRANSITION)
// ─────────────────────────────────────────────────────────────────────────────

const getStatusBadge = (inv) => {
    if (inv.status === 'Sent' || inv.status === 'Partially Paid') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = new Date(inv.dueDate || inv.date);
        due.setHours(0, 0, 0, 0);
        
        if (today > due) {
            const diffTime = today - due;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return { 
                label: `OVERDUE BY ${diffDays} DAY${diffDays > 1 ? 'S' : ''}`, 
                class: 'text-rose-500 font-bold' 
            };
        }
        return { label: inv.status.toUpperCase(), class: 'text-emerald-600 font-bold' };
    }

    if (inv.status === 'Paid') {
        return { label: 'PAID', class: 'text-blue-600 font-bold' };
    }

    return { label: (inv.status || 'Draft').toUpperCase(), class: 'text-slate-400 font-bold' };
};

const SalesInvoicesView = ({ companyId }) => {
    const navigate = useNavigate();
    const params = useParams();
    const location = useLocation();
    const [invoices, setInvoices] = useState([]);
    const [company, setCompany] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState(null);

    const filterType = location.state?.filter;

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const [iRes, cRes] = await Promise.all([
                salesAPI.getInvoicesByCompany(companyId),
                companyAPI.getById(companyId)
            ]);
            setInvoices(iRes.data || []);
            setCompany(cRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (companyId) fetchInvoices();
    }, [companyId]);

    // Update selectedId from URL
    const currentId = params.id;
    useEffect(() => {
        setSelectedId(currentId || null);
    }, [currentId]);

    const handleSelect = (id) => {
        navigate(`/sales-invoices/${id}`);
    };

    const handleCloseSplit = () => {
        navigate('/sales-invoices');
    };

    // If NO ID is present, show FULL TABLE
    if (!selectedId) {
        return (
            <div className="flex h-screen bg-[#f8fafc] overflow-hidden">
                <InvoicesTableView 
                    invoices={invoices} 
                    loading={loading} 
                    onSelect={handleSelect}
                    navigate={navigate}
                    fetchInvoices={fetchInvoices}
                    filterType={filterType}
                />
            </div>
        );
    }

    // If ID IS present, show SPLIT VIEW
    return (
        <div className="flex h-screen bg-[#f8fafc] overflow-hidden animate-fade-in relative">
            {/* List Sidebar */}
            <InvoicesList 
                invoices={invoices} 
                loading={loading} 
                selectedId={selectedId} 
                onSelect={handleSelect}
                navigate={navigate}
                onRefresh={fetchInvoices}
            />

            {/* Detail Area with Close Button overlay (optional since header has "All Invoices") */}
            <InvoiceDetail 
                id={selectedId} 
                company={company}
                navigate={navigate}
                onRefresh={fetchInvoices}
            />
            
            {/* Global Close to return to Full View */}
            <button 
                onClick={handleCloseSplit}
                className="absolute top-4 right-4 z-[100] p-2 bg-white rounded-full shadow-2xl border border-slate-100 text-slate-400 hover:text-slate-900 transition-all hover:scale-110 no-print"
                title="Return to Full Table"
            >
                <X size={20} />
            </button>
        </div>
    );
};

export default SalesInvoicesView;
