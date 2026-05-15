import React, { useState } from 'react';
import { Mail, X, FileText, Send, RefreshCw } from 'lucide-react';
import useNotificationStore from '../store/notificationStore';

const EmailSendModal = ({ isOpen, onClose, documentData, documentType, onSend, apiFunc }) => {
    const addNotification = useNotificationStore(state => state.addNotification);
    const [customerEmail, setCustomerEmail] = useState(documentData.Customer?.email || documentData.customerEmail || "");
    const [ccEmail, setCcEmail] = useState("hariithejj05 <hariithejj05@gmail.com>");
    const [subject, setSubject] = useState(`${documentType} - ${documentData.number} from Caldim`);
    
    // Professional HTML Template
    const initialBody = `
        <div style="font-family: Arial, sans-serif; color: #334155; line-height: 1.6;">
            <div style="background-color: ${documentType === 'Quote' ? '#6366f1' : '#3b82f6'}; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                <h2 style="margin: 0; font-size: 20px; font-style: italic;">${documentType} #${documentData.number}</h2>
            </div>
            <div style="padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
                <p style="font-weight: bold; font-size: 14px;">Dear ${documentData.customerName || 'Customer'},</p>
                <p style="font-size: 14px;">Thank you for your business. Your ${documentType.toLowerCase()} can be viewed, printed and downloaded as PDF from the link below.</p>
                
                <div style="background-color: #fffbeb; border: 1px solid #fde68a; padding: 25px; border-radius: 12px; text-align: center; margin: 30px 0;">
                    <p style="text-transform: uppercase; font-size: 11px; font-weight: 800; color: #92400e; margin: 0; letter-spacing: 0.1em;">${documentType} Amount</p>
                    <p style="font-size: 32px; font-weight: 900; color: #dc2626; margin: 10px 0;">$${parseFloat(documentData.total || 0).toFixed(2)}</p>
                    
                    <table style="width: 100%; max-width: 250px; margin: 20px auto; border-collapse: collapse; text-align: left; font-size: 13px;">
                        <tr>
                            <td style="padding: 4px 0; color: #64748b; font-weight: bold;">${documentType} No</td>
                            <td style="padding: 4px 0; font-weight: 900; text-align: right;">${documentData.number}</td>
                        </tr>
                        <tr>
                            <td style="padding: 4px 0; color: #64748b; font-weight: bold;">Date</td>
                            <td style="padding: 4px 0; font-weight: 900; text-align: right;">${documentData.date || new Date().toLocaleDateString()}</td>
                        </tr>
                        ${documentData.expiryDate || documentData.dueDate ? `
                        <tr>
                            <td style="padding: 4px 0; color: #64748b; font-weight: bold;">Expiry/Due Date</td>
                            <td style="padding: 4px 0; font-weight: 900; text-align: right;">${documentData.expiryDate || documentData.dueDate}</td>
                        </tr>` : ''}
                    </table>
                    
                    <a href="#" style="display: inline-block; background-color: #22c55e; color: white; padding: 12px 40px; border-radius: 6px; text-decoration: none; font-weight: 900; font-size: 13px; text-transform: uppercase; margin-top: 10px;">${documentType === 'Quote' ? 'View Quote' : 'Pay Now'}</a>
                </div>
                
                <p style="margin-top: 30px; font-size: 14px; font-weight: bold;">Regards,</p>
                <p style="font-size: 14px; margin: 0; font-weight: bold;">hariithejj05</p>
                <p style="font-size: 12px; color: #64748b; font-weight: bold;">Caldim</p>
            </div>
        </div>
    `;

    const [body, setBody] = useState(initialBody);
    const [isSending, setIsSending] = useState(false);

    if (!isOpen) return null;

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
                companyId: documentData.CompanyId,
                ledgerId: documentData.customerLedgerId,
                type: documentType,
                documentId: documentData.id
            });
            addNotification('Email sent successfully!', 'success');
            onSend();
            onClose();
        } catch (err) {
            console.error(err);
            addNotification('Failed to send email: ' + (err.response?.data?.error || err.message), 'error');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden animate-scale-up flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-800">Email To {documentData.customerName}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-all">
                        <X size={20}/>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-4">
                    <div className="space-y-0.5 border border-slate-100 rounded-xl overflow-hidden">
                        {/* Fields like From, To, Cc, Subject */}
                        <div className="flex items-center px-4 py-2 bg-white border-b border-slate-50 group hover:bg-slate-50/50 transition-colors">
                            <label className="w-20 text-[11px] font-bold text-slate-400 uppercase tracking-widest">From</label>
                            <input readOnly value="hariithejj05 <hariithejj05@gmail.com>" className="flex-1 bg-transparent border-none outline-none text-[13px] font-medium text-slate-600 cursor-default" />
                        </div>
                        <div className="flex items-center px-4 py-2 bg-white border-b border-slate-50 group hover:bg-slate-50/50 transition-colors">
                            <label className="w-20 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Send To</label>
                            <input value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} className="flex-1 bg-transparent border-none outline-none text-[13px] font-bold text-blue-600" />
                            <button className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Bcc</button>
                        </div>
                        <div className="flex items-center px-4 py-2 bg-white border-b border-slate-50 group hover:bg-slate-50/50 transition-colors">
                            <label className="w-20 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Cc</label>
                            <div className="flex-1 flex flex-wrap gap-2 items-center">
                                <div className="bg-slate-100 px-2 py-1 rounded text-[12px] font-medium text-slate-700 flex items-center gap-1">
                                    {ccEmail} <X size={12} className="cursor-pointer" onClick={() => setCcEmail('')} />
                                </div>
                                <input placeholder="Add more..." className="flex-1 min-w-[100px] bg-transparent border-none outline-none text-[13px] font-medium text-slate-600" />
                            </div>
                        </div>
                        <div className="flex items-center px-4 py-2 bg-white group hover:bg-slate-50/50 transition-colors">
                            <label className="w-20 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Subject</label>
                            <input value={subject} onChange={e => setSubject(e.target.value)} className="flex-1 bg-transparent border-none outline-none text-[13px] font-bold text-slate-800" />
                        </div>
                    </div>

                    {/* Toolbar Mock */}
                    <div className="flex items-center gap-4 px-4 py-2 bg-slate-50 border border-slate-100 rounded-lg overflow-x-auto no-scrollbar">
                        <div className="flex items-center gap-2 border-r border-slate-200 pr-4">
                            <button className="p-1.5 hover:bg-white rounded font-serif font-bold text-slate-600">B</button>
                            <button className="p-1.5 hover:bg-white rounded font-serif italic text-slate-600">I</button>
                            <button className="p-1.5 hover:bg-white rounded underline text-slate-600">U</button>
                        </div>
                        <div className="flex items-center gap-3 text-[12px] font-bold text-slate-500 border-r border-slate-200 pr-4">
                            <span>16px</span>
                            <span>Arial</span>
                        </div>
                        <div className="flex items-center gap-2">
                             <div className="w-4 h-4 bg-black rounded cursor-pointer" />
                             <div className="w-4 h-4 bg-blue-500 rounded cursor-pointer" />
                        </div>
                    </div>

                    {/* Body (Visual Preview) */}
                    <div className="border border-slate-100 rounded-xl overflow-hidden min-h-[400px] flex flex-col bg-white shadow-inner">
                        <div 
                            contentEditable
                            onBlur={(e) => setBody(e.currentTarget.innerHTML)}
                            dangerouslySetInnerHTML={{ __html: initialBody }}
                            className="p-8 outline-none text-[14px] leading-relaxed flex-1"
                        />
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center gap-3 px-4 py-3 bg-slate-50/50 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer">
                            <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600" />
                            <span className="text-[12px] font-bold text-slate-600 uppercase tracking-tight">Attach Customer Statement</span>
                        </div>
                        <div className="flex items-center gap-3 px-4 py-3 bg-slate-50/50 rounded-xl border border-blue-100 bg-blue-50/20">
                            <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-slate-300 text-blue-600" />
                            <div className="flex-1 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-100 text-red-600 rounded">
                                        <FileText size={16}/>
                                    </div>
                                    <span className="text-[12px] font-bold text-slate-800">{documentData.number}.pdf</span>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Attachment Size: 1.2 MB</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
                    <button onClick={onClose} className="px-6 py-2.5 text-slate-500 font-bold text-[13px] hover:text-slate-800 transition-all uppercase tracking-widest">Cancel</button>
                    <button 
                        onClick={handleSend} 
                        disabled={isSending} 
                        className="bg-blue-600 text-white px-8 py-2.5 rounded-lg font-bold text-[13px] hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center gap-2 disabled:opacity-50 uppercase tracking-widest"
                    >
                        {isSending ? <RefreshCw className="animate-spin" size={16}/> : <Send size={16}/>}
                        {isSending ? 'Sending...' : 'Send'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EmailSendModal;
