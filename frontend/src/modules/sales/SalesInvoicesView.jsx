import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { salesAPI, ledgerAPI, companyAPI, mailAPI } from '../../services/api';
import { 
  Plus, Search, Edit2, Trash2, 
  ChevronDown, MoreHorizontal, FileText,
  Check, AlertCircle, File, Mail, Printer,
  Share2, History, X, ChevronRight, Download,
  Send, Loader2, ArrowLeft, DollarSign, Clock,
  Tag, Info, Paperclip
} from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';
import useNotificationStore from '../../store/notificationStore';

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
        inv.CustomerLedger?.name?.toLowerCase().includes(searchTerm.toLowerCase())
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
            <div className="flex-1 overflow-y-auto no-scrollbar">
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
                                            {inv.CustomerLedger?.name}
                                        </div>
                                        <div className="text-[14px] font-bold text-slate-900 tracking-tight">
                                            ₹{parseFloat(inv.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                        <span>{inv.invoiceNumber} | {new Date(inv.date).toLocaleDateString('en-GB')}</span>
                                        <span className={`px-2 py-0.5 rounded text-[8px] border ${inv.status === 'Sent' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                                            {inv.status?.toUpperCase()}
                                        </span>
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
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const senderName = user.email ? user.email.split('@')[0] : 'Indus CAI Administrator';
    const companyName = company?.name || 'Indus CAI private Ltd';

    const [to, setTo] = useState(invoice.CustomerLedger?.email || '');
    const [subject, setSubject] = useState(`Invoice - ${invoice.invoiceNumber} from ${companyName}`);
    const [body, setBody] = useState(`Dear ${invoice.CustomerLedger?.name || 'Customer'},\n\nThank you for your business. Your invoice can be viewed, printed and downloaded as PDF from the link below. You can also choose to pay it online.\n\nBest Regards,\n${senderName}\n${companyName}`);
    const [isSending, setIsSending] = useState(false);

    const handleSend = async () => {
        if (!to) return alert('Recipient email is missing');
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
            alert('Failed to send email');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex-1 bg-[#f8fafc] flex flex-col h-full animate-fade-in no-print">
            <header className="px-10 py-6 bg-white border-b border-slate-200 flex items-center justify-between">
                <div>
                   <h2 className="text-2xl font-bold text-slate-900 italic tracking-tight">Email To {invoice.CustomerLedger?.name}</h2>
                </div>
                <button onClick={onCancel} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400">
                    <X size={24} />
                </button>
            </header>

            <div className="flex-1 overflow-y-auto no-scrollbar p-10 flex gap-10">
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
                                <div className="flex-1 flex gap-2">
                                   <div className="flex-1 p-2 border border-slate-200 rounded-lg text-[13px] font-bold text-slate-700 bg-white flex items-center gap-2">
                                      <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-500 text-[11px]">{invoice.CustomerLedger?.name?.[0]}</span>
                                      {invoice.CustomerLedger?.name} &lt;{to}&gt;
                                   </div>
                                </div>
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
                             <textarea 
                                value={body}
                                onChange={e => setBody(e.target.value)}
                                className="w-full h-[300px] outline-none text-[15px] font-medium text-slate-700 leading-relaxed resize-none bg-transparent"
                                placeholder="Write your message here..."
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
                            <p className="text-[16px] text-slate-600 font-medium">Dear {invoice.CustomerLedger?.name},</p>
                            <p className="text-[16px] text-slate-500 leading-relaxed max-w-md mx-auto">
                                Thank you for your business. Your invoice can be viewed, printed and downloaded as PDF from the link below. You can also choose to pay it online.
                            </p>
                            
                            {/* Requested Template Block */}
                            <div className="bg-[#fffcf0] border border-amber-100 py-10 px-6 space-y-6">
                                <div>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-2">Invoice Amount</p>
                                    <h1 className="text-4xl font-bold text-slate-900 italic tracking-tight">₹ {parseFloat(invoice.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h1>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-y-3 max-w-[280px] mx-auto pt-6 border-t border-amber-200/50">
                                    <div className="text-left text-[12px] font-bold text-slate-400">Invoice No</div>
                                    <div className="text-right text-[12px] font-bold text-slate-900">{invoice.invoiceNumber}</div>
                                    
                                    <div className="text-left text-[12px] font-bold text-slate-400">Invoice Date</div>
                                    <div className="text-right text-[12px] font-bold text-slate-900">{new Date(invoice.date).toLocaleDateString('en-GB')}</div>
                                    
                                    <div className="text-left text-[12px] font-bold text-slate-400">Due Date</div>
                                    <div className="text-right text-[12px] font-bold text-slate-900">{new Date(invoice.dueDate || invoice.date).toLocaleDateString('en-GB')}</div>
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

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        salesAPI.getById(id)
            .then(res => setInvoice(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [id]);

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

    if (loading) return <div className="flex-1 flex items-center justify-center text-slate-300 font-bold animate-pulse">HYDRATING DOCUMENT...</div>;
    if (!invoice) return <div className="flex-1 flex items-center justify-center text-slate-200 text-4xl font-bold uppercase italic tracking-tight opacity-20">Document Not Found</div>;

    if (currentView === 'email') return <InvoiceEmailView invoice={invoice} company={company} onCancel={() => setCurrentView('detail')} onSent={() => { addNotification('Email queued for delivery', 'success'); setCurrentView('detail'); }} />;

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
            </div>

            {/* Document Scrolling Area */}
            <div className="flex-1 overflow-y-auto bg-slate-50 p-16 flex flex-col items-center no-scrollbar print:p-0 print:bg-white custom-document-container">
                 {/* Main Scrollable Invoice Document */}
                 <div className="bg-white shadow-[0_25px_60px_rgba(0,0,0,0.1)] rounded-md w-full max-w-4xl p-16 relative border border-slate-100 min-h-[1050px] animate-fade-up">
                    
                    {/* Status Ribbon */}
                    <div className={`absolute top-8 -right-12 w-48 py-2 text-[10px] font-bold uppercase tracking-[0.2em] transform rotate-45 text-center shadow-lg text-white no-print
                        ${invoice.status === 'Confirmed' || invoice.status === 'Sent' ? 'bg-emerald-600' : 'bg-slate-400'}`}>
                        {invoice.status?.toUpperCase() || 'DRAFT'}
                    </div>

                    {/* Header */}
                    <div className="flex justify-between items-start mb-16">
                        <div className="space-y-4">
                            <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-xl">
                                {company?.name?.[0]?.toUpperCase() || 'C'}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 tracking-tight uppercase">{company?.name || 'Indus CAI private Ltd'}</h3>
                                <p className="text-[12px] text-slate-400 font-bold uppercase tracking-widest mt-1">Tamil Nadu, India</p>
                                <p className="text-[12px] text-blue-600 font-bold lowercase tracking-wide mt-0.5">{company?.email || 'support@induscai.com'}</p>
                            </div>
                        </div>
                        <div className="text-right pt-6">
                            <h1 className="text-5xl font-bold text-slate-900 tracking-tight uppercase opacity-90 italic">TAX INVOICE</h1>
                            <div className="h-1.5 w-32 bg-blue-600 ml-auto mt-4 rounded-full"></div>
                        </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-12 gap-10 mb-16 border-y border-slate-100 py-10">
                        <div className="col-span-7 space-y-6">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Bill To</p>
                                <h4 className="text-[18px] font-bold text-blue-600 leading-tight">
                                    {invoice.CustomerLedger?.name || 'Customer Name'}
                                </h4>
                                <div className="text-[12px] text-slate-500 font-medium leading-relaxed max-w-[320px] whitespace-pre-wrap">
                                    {formatAddress(invoice.CustomerLedger?.billingAddress || invoice.CustomerLedger?.address) || 'No billing address provided.'}
                                </div>
                            </div>
                        </div>
                        <div className="col-span-5 flex flex-col items-end gap-3 text-right">
                            <div className="grid grid-cols-2 gap-x-8 gap-y-3 w-fit">
                                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-widest pt-1">Invoice Number</span>
                                <span className="text-[14px] font-bold text-slate-900">: {invoice.invoiceNumber}</span>
                                
                                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-widest pt-1">Invoice Date</span>
                                <span className="text-[14px] font-bold text-slate-900">: {new Date(invoice.date).toLocaleDateString('en-GB')}</span>
                                
                                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-widest pt-1">Terms</span>
                                <span className="text-[14px] font-bold text-slate-900">: {invoice.terms || 'Due on Receipt'}</span>
                                
                                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-widest pt-1">Due Date</span>
                                <span className="text-[14px] font-bold text-slate-900">: {new Date(invoice.dueDate || invoice.date).toLocaleDateString('en-GB')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="mb-10 overflow-hidden border border-slate-200 rounded-sm">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-slate-900 text-[10px] font-bold text-white uppercase tracking-widest">
                                    <th className="py-4 px-4 w-12 text-center">#</th>
                                    <th className="py-4 px-4 text-left">Item & Description</th>
                                    <th className="py-4 px-4 w-24 text-center">Qty</th>
                                    <th className="py-4 px-4 w-32 text-right">Rate</th>
                                    <th className="py-4 px-4 w-32 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {items.map((it, idx) => (
                                    <tr key={idx} className="text-[12px] font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                                        <td className="p-4 text-center font-bold text-slate-400 border-r border-slate-50">{idx + 1}</td>
                                        <td className="p-4 border-r border-slate-50">
                                            <p className="font-bold text-slate-900 text-[13px]">{it.Item?.name || 'Service Component'}</p>
                                            <p className="text-[11px] text-slate-400 mt-0.5">{it.description}</p>
                                        </td>
                                        <td className="p-4 text-center font-bold border-r border-slate-50">{parseFloat(it.quantity).toFixed(2)}</td>
                                        <td className="p-4 text-right font-bold text-slate-500 border-r border-slate-50">{parseFloat(it.rate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                        <td className="p-4 text-right font-bold text-slate-900">{parseFloat(it.amount || (it.quantity * it.rate)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                ))}
                                {/* Fillers */}
                                {[...Array(Math.max(0, 3 - items.length))].map((_, i) => (
                                    <tr key={i} className="h-10">
                                        <td colSpan={5}></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Summary and Finals Grid */}
                    <div className="flex justify-between gap-16">
                        {/* Info Block */}
                        <div className="flex-1 space-y-10 pt-4">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-px w-6 bg-slate-200" />
                                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">Notes</span>
                                </div>
                                <p className="text-[12px] text-slate-500 italic max-w-sm pl-9">{invoice.customerNotes || 'Thanks for your business.'}</p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-px w-6 bg-slate-200" />
                                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">Terms & Conditions</span>
                                </div>
                                <p className="text-[11px] text-slate-400 italic leading-relaxed pl-9">{invoice.termsConditions || 'Standard business terms apply. Please pay within the due date.'}</p>
                            </div>
                        </div>

                        {/* Totals Block */}
                        <div className="w-[340px] bg-slate-50/50 border border-slate-100 rounded-[2rem] overflow-hidden shadow-2xl relative">
                            <div className="p-8 space-y-4">
                                <div className="flex justify-between items-center text-[12px] font-bold text-slate-400 uppercase tracking-widest">
                                    <span>Sub Total</span>
                                    <span className="text-slate-900 font-bold">₹{parseFloat(invoice.subTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between items-center text-[12px] font-bold text-slate-400 uppercase tracking-widest">
                                    <span>GST (18%)</span>
                                    <span className="text-slate-900 font-bold">₹{parseFloat(invoice.gstAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                                
                                <div className="pt-8 mt-4 border-t border-slate-200 flex flex-col items-end">
                                    <div className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em] mb-1">Grand Total</div>
                                    <div className="text-4xl font-bold text-slate-900 italic tracking-tight">
                                        ₹{parseFloat(invoice.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </div>
                                    <div className="text-[9px] font-bold text-blue-500 uppercase tracking-widest mt-1">INR (₹) / Total Payable</div>
                                </div>
                                
                                <div className="pt-6">
                                    <div className="bg-white/80 p-5 rounded-2xl border border-blue-50 flex justify-between items-center">
                                         <div className="space-y-0.5">
                                            <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Balance Due</p>
                                            <p className="text-[14px] font-bold text-blue-600 italic tracking-tight">AVAILABLE</p>
                                         </div>
                                         <span className="text-[20px] font-bold text-blue-600 italic">₹{parseFloat(invoice.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Area */}
                    <div className="mt-20 pt-10 border-t border-slate-50 flex justify-between items-end">
                         <div className="space-y-3">
                             <p className="text-[11px] font-bold text-slate-900 italic uppercase">Scan to Pay</p>
                             <div className="w-24 h-24 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center text-[8px] font-bold text-slate-300 p-2 text-center uppercase">
                                UPI QR<br/>SECURE GATEWAY
                             </div>
                         </div>
                         <div className="text-right">
                             <div className="w-56 ml-auto h-1 border-b border-slate-200 border-dashed mb-6"></div>
                             <p className="text-[12px] font-bold text-slate-900 uppercase tracking-widest">{company?.name || 'Authorized Signatory'}</p>
                             <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">Authorized Signatory</p>
                         </div>
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
    
    const filtered = invoices.filter(inv => {
        const matchesSearch = inv.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            inv.CustomerLedger?.name?.toLowerCase().includes(searchQuery.toLowerCase());
        
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

            <div className="flex-1 overflow-y-auto no-scrollbar p-8">
                {loading ? (
                    <div className="py-24 text-center font-bold text-slate-400 animate-pulse uppercase tracking-widest">Syncing...</div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Invoice #</th>
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-right">Amount</th>
                                <th className="px-6 py-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-20 text-center">
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
                                            {new Date(inv.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-[14px] font-medium text-blue-600 group-hover:underline">
                                                {inv.invoiceNumber}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-[14px] font-medium text-slate-800">{inv.CustomerLedger?.name}</div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-0.5 rounded uppercase text-[10px] font-bold tracking-widest border
                                                ${inv.status === 'Sent' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                                                {inv.status || 'Draft'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right whitespace-nowrap">
                                            <span className="text-[14px] text-slate-900 font-medium">
                                                ₹{parseFloat(inv.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SALES INVOICES VIEW (DYNAMIC TRANSITION)
// ─────────────────────────────────────────────────────────────────────────────

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
