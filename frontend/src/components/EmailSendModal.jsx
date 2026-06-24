import React, { useState, useEffect, useRef } from 'react';
import { Mail, X, FileText, Send, RefreshCw, CheckCircle, Clock, ArrowLeft, Plus } from 'lucide-react';
import useNotificationStore from '../store/notificationStore';
import { getCurrencyDisplay } from '../utils/currencies';

const EmailSendModal = ({ isOpen, onClose, documentData, documentType, onSend, apiFunc }) => {
    const addNotification = useNotificationStore(state => state.addNotification);
    const addActivity = useNotificationStore(state => state.addActivity);
    const [customerEmail, setCustomerEmail] = useState('');
    const [ccEmails, setCcEmails] = useState(['finance@induspvtltd.in']);
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
        const total = parseFloat(data.total || 0);

        return `
<div style="font-family:'Helvetica Neue',Arial,sans-serif;background:#f8fafc;padding:32px 16px;min-height:100%;">
  <div style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:${accentColor};padding:36px 40px 32px;position:relative;">
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <div>
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:rgba(255,255,255,0.7);letter-spacing:0.12em;text-transform:uppercase;">From Indus Pvt Ltd</p>
          <h1 style="margin:0;font-size:26px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">${type} #${data.number}</h1>
        </div>
        <div style="background:rgba(255,255,255,0.15);border-radius:12px;padding:14px 20px;text-align:right;">
          <p style="margin:0 0 2px;font-size:11px;color:rgba(255,255,255,0.7);font-weight:600;text-transform:uppercase;letter-spacing:0.08em;">${type === 'Quote' ? 'Quote' : 'Invoice'} Date</p>
          <p style="margin:0;font-size:15px;color:#ffffff;font-weight:700;">${data.date || new Date().toLocaleDateString('en-IN')}</p>
          ${data.dueDate || data.expiryDate ? `<p style="margin:4px 0 0;font-size:11px;color:rgba(255,255,255,0.7);">Due: <strong style="color:#ffffff;">${data.dueDate || data.expiryDate}</strong></p>` : ''}
        </div>
      </div>
    </div>

    <!-- Greeting -->
    <div style="padding:32px 40px 20px;">
      <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#1e293b;">Dear ${data.customerName || 'Valued Customer'},</p>
      <p style="margin:0;font-size:14px;color:#64748b;line-height:1.7;">Thank you for choosing us. Please find your ${type.toLowerCase()} details below. You can view, download, and pay from the secure link provided.</p>
    </div>

    <!-- Divider -->
    <div style="margin:0 40px;height:1px;background:#f1f5f9;"></div>

    <!-- Items Table -->
    ${(data.items && data.items.length > 0) ? `
    <div style="padding:24px 40px;">
      <p style="margin:0 0 16px;font-size:11px;font-weight:800;color:#94a3b8;letter-spacing:0.1em;text-transform:uppercase;">Items &amp; Services</p>
      <table style="width:100%;border-collapse:collapse;background:#f8fafc;border-radius:12px;overflow:hidden;">
        <thead>
          <tr style="background:#f1f5f9;">
            <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">Description</th>
            <th style="padding:10px 16px;text-align:center;font-size:11px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">Qty</th>
            <th style="padding:10px 16px;text-align:right;font-size:11px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">Rate</th>
            <th style="padding:10px 16px;text-align:right;font-size:11px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>

      <!-- Totals -->
      <table style="width:100%;margin-top:16px;border-collapse:collapse;">
        ${subtotal !== total ? `
        <tr>
          <td style="padding:6px 0;font-size:13px;color:#64748b;">Subtotal</td>
          <td style="padding:6px 0;font-size:13px;color:#1e293b;text-align:right;">${currencySymbol}${formatAmount(subtotal)}</td>
        </tr>
        ${tax > 0 ? `<tr>
          <td style="padding:6px 0;font-size:13px;color:#64748b;">(+) Tax / GST</td>
          <td style="padding:6px 0;font-size:13px;color:#1e293b;text-align:right;">${currencySymbol}${formatAmount(tax)}</td>
        </tr>` : ''}
        <tr><td colspan="2" style="padding:4px 0;"><div style="height:1px;background:#e2e8f0;"></div></td></tr>
        ` : ''}
        <tr>
          <td style="padding:10px 0 4px;font-size:15px;font-weight:800;color:#1e293b;">Total</td>
          <td style="padding:10px 0 4px;font-size:20px;font-weight:900;color:${accentColor};text-align:right;">${currencySymbol}${formatAmount(total)}</td>
        </tr>
      </table>
    </div>
    ` : `
    <div style="padding:24px 40px;">
      <div style="background:#f8fafc;border-radius:12px;padding:28px;text-align:center;">
        <p style="margin:0 0 4px;font-size:11px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:0.1em;">${type} Amount</p>
        <p style="margin:0;font-size:36px;font-weight:900;color:${accentColor};">${currencySymbol}${formatAmount(total)}</p>
      </div>
    </div>
    `}

    <!-- CTA Button -->
    <div style="padding:8px 40px 36px;text-align:center;">
      <a href="#" style="display:inline-block;background:${accentColor};color:#ffffff;padding:16px 48px;border-radius:10px;text-decoration:none;font-size:14px;font-weight:800;letter-spacing:0.05em;text-transform:uppercase;">
        ${type === 'Quote' ? 'View & Accept Quote' : 'View &amp; Pay Invoice'}
      </a>
    </div>

    <!-- Divider -->
    <div style="margin:0 40px;height:1px;background:#f1f5f9;"></div>

    <!-- Footer -->
    <div style="padding:24px 40px 32px;display:flex;align-items:center;justify-content:space-between;">
      <div>
        <p style="margin:0 0 2px;font-size:13px;font-weight:700;color:#1e293b;">Indus Pvt Ltd</p>
        <p style="margin:0;font-size:12px;color:#94a3b8;">contact@induspvtltd.in</p>
      </div>
      <p style="margin:0;font-size:11px;color:#cbd5e1;text-align:right;">This is an automated email.<br/>Please do not reply directly.</p>
    </div>

  </div>
</div>`;
    };

    useEffect(() => {
        if (isOpen && documentData) {
            const email = documentData.Customer?.email || documentData.customerEmail || '';
            setCustomerEmail(email);
            setCcEmails(['finance@induspvtltd.in']);
            setCcInput('');
            const defaultSub = documentType === 'Quote'
                ? `Quote Estimate ${documentData.number} from Indus Pvt Ltd`
                : `${documentType} - ${documentData.number} from Indus Pvt Ltd`;
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
                        <input readOnly value="Indus Pvt Ltd <contact@induspvtltd.in>" className="flex-1 bg-transparent border-none outline-none text-[13px] text-slate-500 cursor-default" />
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
