import React, { useState, useEffect, useRef } from 'react';
import { Mail, X, FileText, Send, RefreshCw, CheckCircle, Clock, ArrowLeft, Plus } from 'lucide-react';
import useNotificationStore from '../store/notificationStore';
import { getCurrencyDisplay } from '../utils/currencies';
import { getUser } from '../stores/authStore';

const EmailSendModal = ({ isOpen, onClose, documentData, documentType, onSend, apiFunc }) => {
    const addNotification = useNotificationStore(state => state.addNotification);
    const addActivity = useNotificationStore(state => state.addActivity);
    
    // Get current user details
    const currentUser = (() => { try { return getUser() || {}; } catch { return {}; } })();
    const userName = currentUser.name || 'User';
    const userEmail = currentUser.email || 'contact@company.com';

    const [customerEmail, setCustomerEmail] = useState('');
    const [ccEmails, setCcEmails] = useState([]);
    const [ccInput, setCcInput] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [sentPreview, setSentPreview] = useState(null);
    const ccInputRef = useRef(null);



    // Build professional HTML email body
    const buildEmailBody = (data, type) => {
        const currencyCode = data.currencyCode || data.Customer?.currency || data.currency || 'INR';
        const currencySymbol = getCurrencyDisplay(currencyCode);
        const formatAmount = (amt) => {
            const locale = (currencyCode === 'INR' || currencyCode?.startsWith('INR')) ? 'en-IN' : 'en-US';
            return parseFloat(amt || 0).toLocaleString(locale, { minimumFractionDigits: 2 });
        };
        const accentColor = type === 'Quote' ? '#4f46e5' : '#1d4ed8';
        const itemRows = (data.items && data.items.length > 0)
            ? data.items.map(item => `
                <tr>
                  <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;color:#1e293b;font-size:13px;">${item.name || item.itemDetails || item.description || '—'}</td>
                  <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;color:#475569;font-size:13px;text-align:center;">${item.quantity || 1}</td>
                  <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;color:#475569;font-size:13px;text-align:right;">${currencySymbol}${formatAmount(item.rate)}</td>
                  <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;color:#1e293b;font-size:13px;font-weight:700;text-align:right;">${currencySymbol}${formatAmount(item.amount)}</td>
                </tr>`).join('')
            : `<tr><td colspan="4" style="padding:20px;text-align:center;color:#94a3b8;font-size:13px;">No items listed</td></tr>`;

        const subtotal = parseFloat(data.subTotal || 0) || (data.items || []).reduce((s, i) => s + parseFloat(i.amount || 0), 0);
        const tax = parseFloat(data.taxAmount || data.tax || 0);
        const discountPercent = parseFloat(data.discount || 0);
        const discountAmount = data.discountAmount !== undefined ? parseFloat(data.discountAmount) : (subtotal * discountPercent / 100);
        const adjustment = parseFloat(data.adjustment || 0);
        const tcsAmount = parseFloat(data.tcsAmount || 0);
        const total = parseFloat(data.totalAmount || data.total || 0);

        const dateStr = data.date || new Date().toLocaleDateString('en-IN');
        const companyName = currentUser.companyName || currentUser.Company?.name || currentUser.company?.name || '';
        
        return `
<div style="font-family: Arial, sans-serif; font-size: 13px; color: #333333; line-height: 1.6; white-space: pre-wrap;">Dear ${data.customerName || 'Customer'},

The ${type.toLowerCase()} (${data.number}) is attached with this email.
An overview of the ${type.toLowerCase()} is available below.

------------------------------------------------------

${type} # : ${data.number}

------------------------------------------------------

Order Date : ${dateStr}
Amount : ${currencySymbol}${formatAmount(total)}(in ${currencyCode})

------------------------------------------------------

Please go through it and confirm the order. We look forward to working with you again.

Regards,

${userName}
${companyName}</div>
`;
    };

    useEffect(() => {
        if (isOpen && documentData) {
            const email = documentData.Customer?.email || documentData.customerEmail || '';
            setCustomerEmail(email);
            setCcEmails([]);
            setCcInput('');
            const defaultSub = documentType === 'Quote'
                ? `Quote Estimate ${documentData.number} from ${userName}`
                : `${documentType} - ${documentData.number} from ${userName}`;
            setSubject(defaultSub);
            setBody(buildEmailBody(documentData, documentType));
            setSentPreview(null);
        }
    }, [isOpen, documentData, documentType]);

    if (!isOpen) return null;

    // CC tag input handlers
    const addCcTag = (val) => {
        const email = val.trim().replace(/,+$/, '');
        if (email && /\S+@\S+\.\S+/.test(email) && !ccEmails.includes(email)) {
            setCcEmails(prev => [...prev, email]);
        }
        setCcInput('');
    };

    const handleCcKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addCcTag(ccInput);
        } else if (e.key === 'Backspace' && ccInput === '' && ccEmails.length > 0) {
            setCcEmails(prev => prev.slice(0, -1));
        }
    };

    const removeCcTag = (email) => setCcEmails(prev => prev.filter(e => e !== email));

    const handleSend = async () => {
        if (!customerEmail) {
            addNotification('Recipient email is required', 'error');
            return;
        }
        setIsSending(true);
        try {
            await apiFunc(documentData.id, {
                subject,
                body,
                toEmail: customerEmail,
                ccEmails: ccEmails.join(','),
                companyId: documentData.CompanyId || documentData.companyId,
                ledgerId: documentData.customerLedgerId || documentData.ledgerId || documentData.customerId,
                type: documentType,
                documentId: documentData.id
            });
            addNotification(`Email sent successfully to ${customerEmail}!`, 'success');
            // Log to activity bell
            addActivity({
                type: 'email',
                module: documentType,
                title: `Email sent to ${customerEmail}`,
                detail: `${documentType} #${documentData.number} — ${documentData.customerName || ''}`,
            });
            // Close the modal immediately — no need to stay on the sent preview screen
            onClose?.();
            onSend?.();
        } catch (err) {
            console.error(err);
            addNotification('Failed to send email: ' + (err.response?.data?.error || err.message), 'error');
        } finally {
            setIsSending(false);
        }
    };

    // ─── SENT PREVIEW VIEW ───
    if (sentPreview) {
        return (
            <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
                <style>{`
                    body { overflow: hidden !important; }
                    html { overflow: hidden !important; }
                    main { overflow: hidden !important; }
                `}</style>
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
                <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[90vh]" style={{ animation: 'fadeSlideUp 0.3s ease-out' }}>
                    <div className="bg-gradient-to-r from-emerald-500 to-green-600 px-8 py-5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                <CheckCircle size={26} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-[18px] font-bold text-white tracking-tight">Email Dispatched Successfully</h2>
                                <p className="text-emerald-100 text-[12px] font-medium mt-0.5">
                                    {documentType} #{sentPreview.documentNumber} → {sentPreview.customerName}
                                </p>
                            </div>
                        </div>
                        <button onClick={() => { onSend(); onClose(); }} className="p-2 hover:bg-white/20 rounded-full text-white/80 hover:text-white transition-all">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="px-8 py-5 bg-slate-50 border-b border-slate-100">
                        <div className="grid grid-cols-1 gap-3">
                            <div className="flex items-start gap-3">
                                <span className="w-20 text-[11px] font-bold text-slate-400 uppercase tracking-widest pt-0.5 shrink-0">To</span>
                                <span className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1 rounded-full text-[12px] font-bold flex items-center gap-1.5">
                                    <Mail size={12} /> {sentPreview.to}
                                </span>
                            </div>
                            {sentPreview.cc && sentPreview.cc.length > 0 && (
                                <div className="flex items-start gap-3">
                                    <span className="w-20 text-[11px] font-bold text-slate-400 uppercase tracking-widest pt-0.5 shrink-0">Cc</span>
                                    <div className="flex flex-wrap gap-2">
                                        {sentPreview.cc.map(e => (
                                            <span key={e} className="bg-slate-100 border border-slate-200 text-slate-600 px-3 py-1 rounded-full text-[12px] font-medium">{e}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="flex items-start gap-3">
                                <span className="w-20 text-[11px] font-bold text-slate-400 uppercase tracking-widest pt-0.5 shrink-0">Subject</span>
                                <span className="text-[13px] font-bold text-slate-800">{sentPreview.subject}</span>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="w-20 text-[11px] font-bold text-slate-400 uppercase tracking-widest pt-0.5 shrink-0">Sent At</span>
                                <div className="flex items-center gap-2">
                                    <Clock size={13} className="text-slate-400" />
                                    <span className="text-[12px] text-slate-500">{sentPreview.sentAt}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto no-scrollbar">
                        <div className="px-8 py-4">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Delivered Content</p>
                            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                                <div dangerouslySetInnerHTML={{ __html: sentPreview.body }} className="p-4 text-[14px] leading-relaxed" />
                            </div>
                        </div>
                    </div>
                    <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-emerald-600">
                            <CheckCircle size={18} />
                            <span className="text-[12px] font-bold uppercase tracking-widest">Delivery Confirmed</span>
                        </div>
                        <button
                            onClick={() => { onSend(); onClose(); }}
                            className="bg-slate-800 text-white px-8 py-2.5 rounded-lg font-bold text-[13px] hover:bg-slate-900 shadow-lg transition-all flex items-center gap-2 uppercase tracking-widest"
                        >
                            <ArrowLeft size={16} /> Back to {documentType}s
                        </button>
                    </div>
                </div>
                <style>{`@keyframes fadeSlideUp { from { opacity:0;transform:translateY(30px) scale(0.97); } to { opacity:1;transform:translateY(0) scale(1); } }`}</style>
            </div>
        );
    }

    // ─── COMPOSE VIEW ───
    return (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
            <style>{`
                body { overflow: hidden !important; }
                html { overflow: hidden !important; }
                main { overflow: hidden !important; }
            `}</style>
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[90vh]">

                {/* Header */}
                <div className="px-7 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                            <Mail size={18} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-[16px] font-bold text-slate-900 leading-tight">Email To {documentData.customerName}</h2>
                            <p className="text-[11px] text-slate-400 font-medium">{documentType} #{documentData.number}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-all">
                        <X size={20} />
                    </button>
                </div>

                {/* Fields — static, no scroll */}
                <div className="border-b border-slate-100 divide-y divide-slate-50 shrink-0">
                    {/* From */}
                    <div className="flex items-center px-7 py-3 hover:bg-slate-50/50 transition-colors">
                        <label className="w-16 text-[11px] font-bold text-slate-400 uppercase tracking-widest shrink-0">From</label>
                        <input readOnly value={`${userName} <${userEmail}>`} className="flex-1 bg-transparent border-none outline-none text-[13px] text-slate-500 cursor-default" />
                    </div>

                    {/* Send To */}
                    <div className="flex items-center px-7 py-3 hover:bg-slate-50/50 transition-colors">
                        <label className="w-16 text-[11px] font-bold text-slate-400 uppercase tracking-widest shrink-0">To</label>
                        <input
                            value={customerEmail}
                            onChange={e => setCustomerEmail(e.target.value)}
                            className="flex-1 bg-transparent border-none outline-none text-[13px] font-bold text-blue-600"
                            placeholder="Recipient email..."
                        />
                    </div>

                    {/* CC — working tag input */}
                    <div
                        className="flex items-start px-7 py-3 hover:bg-slate-50/50 transition-colors cursor-text"
                        onClick={() => ccInputRef.current?.focus()}
                    >
                        <label className="w-16 text-[11px] font-bold text-slate-400 uppercase tracking-widest shrink-0 mt-1.5">Cc</label>
                        <div className="flex-1 flex flex-wrap gap-1.5 items-center min-h-[28px]">
                            {ccEmails.map(email => (
                                <div key={email} className="flex items-center gap-1 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full text-[12px] font-medium text-slate-700">
                                    {email}
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); removeCcTag(email); }}
                                        className="ml-0.5 text-slate-400 hover:text-red-500 transition-colors"
                                    >
                                        <X size={11} />
                                    </button>
                                </div>
                            ))}
                            <input
                                ref={ccInputRef}
                                value={ccInput}
                                onChange={e => setCcInput(e.target.value)}
                                onKeyDown={handleCcKeyDown}
                                onBlur={() => { if (ccInput.trim()) addCcTag(ccInput); }}
                                placeholder={ccEmails.length === 0 ? 'Add CC recipients...' : 'Add more...'}
                                className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-[13px] text-slate-600 placeholder:text-slate-300"
                            />
                        </div>
                        {ccInput && (
                            <button
                                type="button"
                                onClick={() => addCcTag(ccInput)}
                                className="ml-2 flex items-center gap-1 text-[11px] font-bold text-blue-500 hover:text-blue-700 transition-colors mt-1"
                            >
                                <Plus size={12} /> Add
                            </button>
                        )}
                    </div>

                    {/* Subject */}
                    <div className="flex items-center px-7 py-3 hover:bg-slate-50/50 transition-colors">
                        <label className="w-16 text-[11px] font-bold text-slate-400 uppercase tracking-widest shrink-0">Subject</label>
                        <input
                            value={subject}
                            onChange={e => setSubject(e.target.value)}
                            className="flex-1 bg-transparent border-none outline-none text-[13px] font-bold text-slate-800"
                        />
                    </div>
                </div>

                {/* Email Preview — ONLY this section scrolls */}
                <div className="flex-1 overflow-hidden flex flex-col px-5 pt-4 pb-2 min-h-0">
                    <div className="flex items-center gap-2 mb-3 shrink-0">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Email Preview</span>
                        <div className="flex-1 h-px bg-slate-100" />
                    </div>
                    <div className="flex-1 border border-slate-200 rounded-xl overflow-y-auto shadow-sm bg-[#f8fafc] min-h-0">
                        <div
                            contentEditable
                            onBlur={(e) => setBody(e.currentTarget.innerHTML)}
                            dangerouslySetInnerHTML={{ __html: body }}
                            className="outline-none text-[14px] leading-relaxed"
                            style={{ minHeight: '100%' }}
                        />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2 text-center shrink-0">Click inside to edit · Scroll to see full email</p>
                </div>

                {/* Attachment — static, no scroll */}
                <div className="px-5 py-3 shrink-0 border-t border-slate-100">
                    <div className="flex items-center gap-3 px-4 py-3 bg-blue-50/60 border border-blue-100 rounded-xl">
                        <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                            <FileText size={16} />
                        </div>
                        <div className="flex-1">
                            <p className="text-[12px] font-bold text-slate-800">{documentData.number}.pdf</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Auto-attached · ~1.2 MB</p>
                        </div>
                        <div className="w-4 h-4 rounded-sm bg-blue-600 flex items-center justify-center">
                            <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="px-7 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                    <p className="text-[11px] text-slate-400">
                        Sending to: <span className="font-bold text-slate-600">{customerEmail || '—'}</span>
                        {ccEmails.length > 0 && <> + <span className="font-bold text-slate-600">{ccEmails.length} cc</span></>}
                    </p>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold text-[12px] rounded-lg hover:bg-slate-100 transition-all uppercase tracking-widest"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSend}
                            disabled={isSending}
                            className="bg-blue-600 text-white px-7 py-2.5 rounded-lg font-bold text-[12px] hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center gap-2 disabled:opacity-50 uppercase tracking-widest"
                        >
                            {isSending ? <RefreshCw className="animate-spin" size={15} /> : <Send size={15} />}
                            {isSending ? 'Sending...' : 'Send Mail'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmailSendModal;
