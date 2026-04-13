import React, { useState, useEffect } from 'react';
import { 
  X, Send, Mail, User, Tag, Loader2, 
  Bold, Italic, Underline, List, ListOrdered, 
  Type, AlignLeft, Search, FileText, ChevronDown, 
  CheckCircle2, Paperclip, MoreHorizontal, Image as ImageIcon, Link as LinkIcon,
  HelpCircle
} from 'lucide-react';
import { mailAPI } from '../../services/api';

const PurchaseOrderEmailModal = ({ 
  isOpen, 
  onClose, 
  vendor, 
  poData, 
  totals, 
  attachments = [],
  onSent 
}) => {
  const [form, setForm] = useState({
    from: 'Swathi N <naveenswathi1811@gmail.com>',
    to: vendor?.email || '',
    cc: '',
    bcc: '',
    subject: `Purchase Order from Indus CAI private Ltd (Purchase Order #: ${poData?.poNumber || 'PENDING'})`,
    body: '',
    attachPDF: true
  });

  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (poData && totals) {
      const emailBody = `Dear ${vendor?.name || 'Sir/Madam'},\n\n` +
        `The purchase order (${poData.poNumber}) is attached with this email.\n` +
        `An overview of the purchase order is available below.\n\n` +
        `--------------------------------------------------------------------------------\n\n` +
        `Purchase Order # : ${poData.poNumber}\n\n` +
        `--------------------------------------------------------------------------------\n\n` +
        `Order Date : ${poData.date}\n` +
        `Amount : ₹ ${totals.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}(in INR)\n\n` +
        `--------------------------------------------------------------------------------\n\n` +
        `Please go through it and confirm the order. We look forward to working with you again\n`;
      
      setForm(prev => ({ ...prev, body: emailBody }));
    }
  }, [poData, totals, vendor]);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!form.to) return setError('Recipient email is required');
    
    setLoading(true);
    setError(null);
    try {
      await mailAPI.send({
        toEmail: form.to,
        subject: form.subject,
        body: form.body,
        companyId: poData.companyId,
        ledgerId: vendor?.id,
        type: 'Purchase Order',
        referenceId: poData.id
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
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] animate-in fade-in duration-300" onClick={onClose} />
      
      <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-400 flex flex-col max-h-[95vh]">
        {/* Header */}
        <header className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <h2 className="text-[16px] font-bold text-slate-800">Email To {vendor?.name || 'Vendor'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-md transition-colors text-slate-400">
            <X size={20} />
          </button>
        </header>

        {/* Email Form */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/30">
          <div className="p-6 space-y-px">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-[13px] font-medium animate-in shake duration-300">
                {error}
              </div>
            )}

            {/* Address Fields */}
            <div className="bg-white border border-slate-200 rounded-t-xl">
              {/* From */}
              <div className="grid grid-cols-[100px_1fr] items-center border-b border-slate-100">
                <div className="px-4 py-3 text-[13px] text-slate-500 border-r border-slate-100 flex items-center gap-1.5">
                  From <HelpCircle size={14} className="text-slate-300" />
                </div>
                <div className="px-4 py-3 text-[13px] font-medium text-slate-700">{form.from}</div>
              </div>

              {/* Send To */}
              <div className="grid grid-cols-[100px_1fr_100px] items-center border-b border-slate-100">
                <div className="px-4 py-3 text-[13px] text-slate-500 border-r border-slate-100">Send To</div>
                <div className="px-4 py-1">
                  <input 
                    type="email"
                    value={form.to}
                    onChange={e => setForm({...form, to: e.target.value})}
                    className="w-full text-[13px] font-medium text-slate-700 outline-none bg-transparent"
                    placeholder="Recipient email..."
                  />
                </div>
                <div className="flex items-center gap-3 px-4 text-[12px] font-medium text-blue-600">
                  <button onClick={() => setShowCc(!showCc)} className="hover:underline">Cc</button>
                  <button onClick={() => setShowBcc(!showBcc)} className="hover:underline">Bcc</button>
                </div>
              </div>

              {/* Subject */}
              <div className="grid grid-cols-[100px_1fr] items-center">
                <div className="px-4 py-3 text-[13px] text-slate-500 border-r border-slate-100">Subject</div>
                <div className="px-4 py-1">
                  <input 
                    type="text"
                    value={form.subject}
                    onChange={e => setForm({...form, subject: e.target.value})}
                    className="w-full text-[13px] font-bold text-slate-800 outline-none bg-transparent"
                    placeholder="Subject..."
                  />
                </div>
              </div>
            </div>

            {/* Toolbar & Body */}
            <div className="bg-white border border-slate-200 border-t-0 rounded-b-xl flex flex-col">
              {/* Toolbar */}
              <div className="px-4 py-2 border-b border-slate-100 flex items-center gap-1 bg-slate-50/50">
                <button className="p-1.5 hover:bg-white rounded hover:shadow-sm text-slate-600 transition-all"><Bold size={16}/></button>
                <button className="p-1.5 hover:bg-white rounded hover:shadow-sm text-slate-600 transition-all"><Italic size={16}/></button>
                <button className="p-1.5 hover:bg-white rounded hover:shadow-sm text-slate-600 transition-all"><Underline size={16}/></button>
                <div className="w-px h-6 bg-slate-200 mx-1"></div>
                <div className="flex items-center gap-1.5 px-2 py-1 hover:bg-white rounded hover:shadow-sm cursor-pointer border border-transparent hover:border-slate-200 transition-all">
                  <span className="text-[12px] font-medium text-slate-600">16px</span>
                  <ChevronDown size={12} className="text-slate-400" />
                </div>
                <div className="w-px h-6 bg-slate-200 mx-1"></div>
                <div className="flex items-center gap-1.5 px-2 py-1 hover:bg-white rounded hover:shadow-sm cursor-pointer border border-transparent hover:border-slate-200 transition-all">
                  <span className="text-[12px] font-medium text-slate-600">Arial</span>
                  <ChevronDown size={12} className="text-slate-400" />
                </div>
                <div className="w-px h-6 bg-slate-200 mx-1"></div>
                <button className="p-1.5 hover:bg-white rounded hover:shadow-sm text-slate-600 transition-all"><AlignLeft size={16}/></button>
                <button className="p-1.5 hover:bg-white rounded hover:shadow-sm text-slate-600 transition-all"><List size={16}/></button>
                <div className="w-px h-6 bg-slate-200 mx-1"></div>
                <button className="p-1.5 hover:bg-white rounded hover:shadow-sm text-slate-600 transition-all"><ImageIcon size={16}/></button>
                <button className="p-1.5 hover:bg-white rounded hover:shadow-sm text-slate-600 transition-all"><LinkIcon size={16}/></button>
              </div>

              {/* Textarea Area */}
              <div className="p-6 min-h-[400px]">
                <textarea 
                  value={form.body}
                  onChange={e => setForm({...form, body: e.target.value})}
                  className="w-full h-full min-h-[350px] outline-none text-[14px] text-slate-800 font-medium leading-relaxed resize-none font-sans"
                  placeholder="Composition area..."
                />
              </div>
            </div>

            {/* Attachments Section */}
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3 p-4 bg-white border border-blue-100 rounded-xl shadow-sm">
                <label className="flex items-center gap-3 cursor-pointer group flex-1">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${form.attachPDF ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                    <CheckCircle2 size={14} className={form.attachPDF ? 'text-white' : 'hidden'} />
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={form.attachPDF}
                      onChange={() => setForm({...form, attachPDF: !form.attachPDF})}
                    />
                  </div>
                  <span className="text-[13px] font-bold text-slate-700">Attach Purchase Order PDF</span>
                </label>
                
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
                   <div className="w-6 h-6 rounded bg-red-50 flex items-center justify-center text-red-500">
                      <FileText size={14} />
                   </div>
                   <span className="text-[12px] font-bold text-slate-700 uppercase tracking-tight">{poData?.poNumber || 'PO-PDF'}</span>
                </div>
              </div>

              {attachments.length > 0 && (
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                   <div className="flex items-center gap-2 text-[12px] font-bold text-blue-600">
                      <Paperclip size={14} /> Attachments
                   </div>
                   <div className="flex flex-wrap gap-2">
                      {attachments.map(att => (
                        <div key={att.id} className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-md px-2 py-1 shadow-sm">
                           <FileText size={12} className="text-slate-400" />
                           <span className="text-[11px] font-medium text-slate-600 truncate max-w-[120px]">{att.name}</span>
                        </div>
                      ))}
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-end gap-3">
           <button 
             onClick={onClose}
             className="px-5 py-2 text-slate-500 hover:text-slate-800 text-[13px] font-bold transition-colors"
           >
              Cancel
           </button>
           <button className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[13px] font-bold rounded-lg border border-slate-200 transition-all">
              Save as Draft
           </button>
           <button 
             onClick={handleSend}
             disabled={loading}
             className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-bold rounded-lg shadow-lg shadow-blue-100 transition-all flex items-center gap-2 disabled:opacity-50"
           >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <><Send size={16} /> Send Messages</>}
           </button>
        </footer>
      </div>
    </div>
  );
};

export default PurchaseOrderEmailModal;
