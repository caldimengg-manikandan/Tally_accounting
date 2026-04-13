import React, { useState } from 'react';
import { X, Send, Mail, User, Tag, Loader2 } from 'lucide-react';
import { mailAPI } from '../services/api';

const ComposeMailModal = ({ isOpen, onClose, recipientEmail, recipientName, ledgerId, companyId, onSent }) => {
  const [form, setForm] = useState({
    subject: `Statement from Indus CAI for ${recipientName}`,
    body: `Dear ${recipientName},\n\nPlease find the transaction details associated with your account with Indus CAI.\n\nBest regards,\nIndus CAI Team`
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!form.subject || !form.body) return setError('Subject and Body are required');
    
    setLoading(true);
    setError(null);
    try {
      await mailAPI.send({
        toEmail: recipientEmail,
        subject: form.subject,
        body: form.body,
        ledgerId,
        companyId,
        type: 'General'
      });
      if (onSent) onSent();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-zoom-in flex flex-col max-h-[90vh]">
        {/* Header */}
        <header className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
               <Mail size={20} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Compose Email</h3>
              <p className="text-[12px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">SENDING TO {recipientName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400 hover:text-slate-900"><X size={24}/></button>
        </header>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-[13px] font-bold animate-shake">
               {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Recipient Field (Read Only focus) */}
            <div className="space-y-1.5 p-4 bg-slate-50 rounded-xl border border-slate-100">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><User size={12}/> Recipient</label>
               <div className="text-[14px] font-bold text-slate-700">{recipientName} &lt;{recipientEmail}&gt;</div>
            </div>

            {/* Subject Field */}
            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Tag size={12}/> Subject</label>
               <input 
                 type="text" 
                 value={form.subject} 
                 onChange={e => setForm({...form, subject: e.target.value})}
                 className="w-full p-4 bg-white border-2 border-slate-50 rounded-xl font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm"
                 placeholder="Enter email subject..."
               />
            </div>

            {/* Message Body */}
            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">Message</label>
               <textarea 
                 rows={8}
                 value={form.body} 
                 onChange={e => setForm({...form, body: e.target.value})}
                 className="w-full p-4 bg-white border-2 border-slate-50 rounded-xl font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm resize-none leading-relaxed"
                 placeholder="Compose your message here..."
               />
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="px-8 py-6 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/20">
          <button 
            onClick={onClose} 
            className="px-6 py-3 text-slate-500 text-[13px] font-black hover:text-slate-900 transition-colors uppercase tracking-widest"
          >
            Cancel
          </button>
          <button 
            onClick={handleSend}
            disabled={loading}
            className="px-8 py-3 bg-blue-600 text-white rounded-xl text-[13px] font-black hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all flex items-center gap-2 uppercase tracking-widest disabled:opacity-50"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <><Send size={16}/> Send Messages</>}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ComposeMailModal;
