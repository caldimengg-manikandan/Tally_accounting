import React, { useState } from 'react';
import { Mail, X, FileText, Send, RefreshCw } from 'lucide-react';
import useNotificationStore from '../store/notificationStore';

const EmailSendModal = ({ isOpen, onClose, documentData, documentType, onSend, apiFunc }) => {
    const addNotification = useNotificationStore(state => state.addNotification);
    const [customerEmail, setCustomerEmail] = useState(documentData.Customer?.email || documentData.customerEmail || "");
    const [subject, setSubject] = useState(`${documentType} from Indus CAI private Ltd (${documentData.number})`);
    const [body, setBody] = useState(`Dear Customer,\n\nThanks for your business.\n\nThe ${documentType.toLowerCase()} ${documentData.number} is attached with this email.\n\nRegards,\nAdministrator\nIndus CAI private Ltd`);
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
                toEmail: customerEmail
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
            <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-scale-up">
                <div className="p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-black italic text-slate-900 uppercase tracking-tighter">Compose Message</h2>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">{documentType} to {documentData.customerName}</p>
                        </div>
                        <button onClick={onClose} className="p-3 hover:bg-slate-50 rounded-full text-slate-300 hover:text-slate-900 transition-all">
                            <X size={24}/>
                        </button>
                    </div>

                    <div className="space-y-6">
                        <div className="grid grid-cols-12 items-center gap-4">
                            <label className="col-span-2 text-[11px] font-black text-slate-300 uppercase tracking-widest">Recipient</label>
                            <div className="col-span-10 relative">
                                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                <input 
                                    type="text" 
                                    value={customerEmail} 
                                    onChange={e => setCustomerEmail(e.target.value)}
                                    placeholder="customer@example.com"
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-lg text-[14px] font-bold text-slate-700 outline-none italic focus:border-blue-400 focus:bg-white transition-all" 
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-12 items-center gap-4 border-t border-slate-50 pt-6">
                            <label className="col-span-2 text-[11px] font-black text-slate-300 uppercase tracking-widest">Subject</label>
                            <input 
                                type="text" 
                                value={subject} 
                                onChange={e => setSubject(e.target.value)} 
                                className="col-span-10 px-4 py-3 bg-white border border-slate-100 rounded-lg text-[14px] font-bold text-slate-900 outline-none focus:border-blue-500 focus:shadow-lg focus:shadow-blue-50 transition-all italic" 
                            />
                        </div>

                        <div className="border-t border-slate-50 pt-6">
                            <label className="block text-[11px] font-black text-slate-300 uppercase tracking-widest mb-4">Message Body</label>
                            <textarea 
                                value={body} 
                                onChange={e => setBody(e.target.value)} 
                                rows="8" 
                                className="w-full px-6 py-6 bg-slate-50/30 border border-slate-100 rounded-xl text-[14px] font-medium text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all italic leading-relaxed" 
                            />
                        </div>

                        <div className="bg-blue-50/50 p-4 rounded-lg flex items-center justify-between border border-blue-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded">
                                    <FileText size={18}/>
                                </div>
                                <div>
                                    <p className="text-[12px] font-black text-slate-900 uppercase tracking-tight">{documentData.number}.pdf</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Auto-generated attachment</p>
                                </div>
                            </div>
                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Ready to attach</span>
                        </div>

                        <div className="flex justify-end items-center gap-4 pt-4">
                            <button onClick={onClose} className="px-6 py-2.5 text-slate-400 font-bold text-[13px] hover:text-slate-900 uppercase tracking-widest transition-all">Discard</button>
                            <button 
                                onClick={handleSend} 
                                disabled={isSending} 
                                className="bg-[#1e61f0] text-white px-10 py-3 rounded-lg font-black text-[14px] hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all uppercase tracking-widest flex items-center gap-2 disabled:opacity-50"
                            >
                                {isSending ? <RefreshCw className="animate-spin" size={18}/> : <Send size={18}/>}
                                {isSending ? 'Transmitting...' : 'Send Email'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmailSendModal;
