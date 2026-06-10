import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Send, Loader2, 
  Bold, Italic, Underline,
  AlignLeft, AlignCenter, AlignRight,
  List, FileText, ChevronDown, 
  CheckCircle2, Paperclip,
  Image as ImageIcon, Link as LinkIcon,
  HelpCircle, User, Strikethrough, Undo, Redo
} from 'lucide-react';
import { mailAPI } from '../../services/api';

const PurchaseOrderEmailModal = ({ 
  isOpen, 
  onClose, 
  vendor, 
  poData, 
  totals, 
  attachments = [],
  onSent,
  selectedContacts = [],
  companyName = ''
}) => {

  // ── Logged-in user ──────────────────────────────────────────────
  const currentUserEmail = useMemo(() => {
    try { const u = JSON.parse(sessionStorage.getItem('user') || '{}'); return u?.email || ''; }
    catch { return ''; }
  }, []);

  const currentUserName = useMemo(() => {
    try { const u = JSON.parse(sessionStorage.getItem('user') || '{}'); return u?.name || u?.email || 'User'; }
    catch { return 'User'; }
  }, []);

  // ── Build initial recipient chips ───────────────────────────────
  const buildInitialRecipients = () => {
    if (selectedContacts?.length > 0) return selectedContacts.map(c => ({ name: c.name, email: c.email }));
    if (vendor?.email) {
      const name = [vendor.firstName, vendor.lastName].filter(Boolean).join(' ') || vendor.name || 'Contact';
      return [{ name, email: vendor.email }];
    }
    return [];
  };

  const [recipients, setRecipients]     = useState(buildInitialRecipients);
  const [recipientInput, setRecipientInput] = useState('');
  const [ccList, setCcList]             = useState([]);
  const [bccList, setBccList]           = useState([]);
  const [ccInput, setCcInput]           = useState('');
  const [bccInput, setBccInput]         = useState('');
  const [showCc, setShowCc]             = useState(false);
  const [showBcc, setShowBcc]           = useState(false);
  const [attachPDF, setAttachPDF]       = useState(true);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(null);

  const [subject, setSubject] = useState(
    `Purchase Order from ${companyName || 'Our Company'} a Purchase Order # ${poData?.poNumber || 'PENDING'}`
  );

  const initialBody = useMemo(() => {
    const vendorName = vendor?.name || 'Sir/Madam';
    const poNum = poData?.poNumber || 'PENDING';
    const orderDate = poData?.date
      ? new Date(poData.date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : '—';
    const amount = totals?.total
      ? `₹${parseFloat(totals.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}(in INR)`
      : '—';
    return `Dear ${vendorName},

The purchase order (${poNum}) is attached with this email.
An overview of the purchase order is available below.

------------------------------------------------------------------------

Purchase Order # : ${poNum}

------------------------------------------------------------------------

Order Date   : ${orderDate}
Amount       : ${amount}

------------------------------------------------------------------------

Please go through it and confirm the order. We look forward to working with you again.

—`;
  }, [vendor, poData, totals]);

  const [body, setBody] = useState(initialBody);

  // Sync when reopened with fresh data
  useEffect(() => {
    if (isOpen) {
      setRecipients(buildInitialRecipients());
      setSubject(`Purchase Order from ${companyName || 'Our Company'} a Purchase Order # ${poData?.poNumber || 'PENDING'}`);
      setBody(initialBody);
      setError(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, vendor, poData, totals, companyName, selectedContacts]);

  if (!isOpen) return null;

  // ── Chip helpers ────────────────────────────────────────────────
  const addChip = (list, setList, inputVal, setInput) => {
    const email = inputVal.trim();
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Invalid email: ' + email); return; }
    if (!list.some(r => r.email === email)) setList(prev => [...prev, { name: email, email }]);
    setInput('');
  };
  const removeChip = (list, setList, email) => setList(list.filter(r => r.email !== email));
  const handleKeyDown = (e, list, setList, inputVal, setInput) => {
    if ((e.key === 'Enter' || e.key === ',') && inputVal.trim()) { e.preventDefault(); addChip(list, setList, inputVal, setInput); }
    if (e.key === 'Backspace' && !inputVal && list.length > 0) setList(list.slice(0, -1));
  };

  // ── Send ────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (recipients.length === 0) return setError('At least one recipient email is required');
    setLoading(true); setError(null);
    try {
      await mailAPI.send({
        toEmail: recipients.map(r => r.email).join(','),
        subject, body,
        companyId: poData?.companyId,
        ledgerId: vendor?.id,
        type: 'Purchase Order',
        referenceId: poData?.id
      });
      if (onSent) onSent();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send email');
    } finally {
      setLoading(false);
    }
  };

  // ── Email chip tag ───────────────────────────────────────────────
  const EmailChip = ({ name, email, onRemove }) => (
    <span className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-[12px] font-semibold rounded px-2 py-0.5 max-w-[300px]">
      <User size={11} className="text-blue-400 shrink-0" />
      <span className="truncate">{name} &lt;{email}&gt;</span>
      <button type="button" onClick={() => onRemove(email)} className="ml-0.5 text-blue-400 hover:text-red-500 shrink-0">
        <X size={11} strokeWidth={2.5} />
      </button>
    </span>
  );

  // ── Recipient row ────────────────────────────────────────────────
  const RecipientRow = ({ label, list, setList, inputVal, setInput, showCcBcc }) => (
    <div className="flex items-start border-b border-slate-100 min-h-[40px]">
      <div className="w-[90px] shrink-0 px-4 py-2.5 text-[13px] text-slate-500 border-r border-slate-100">
        {label}
      </div>
      <div className="flex-1 px-3 py-2 flex flex-wrap gap-1.5 items-center">
        {list.map(r => (
          <EmailChip key={r.email} name={r.name} email={r.email} onRemove={e => removeChip(list, setList, e)} />
        ))}
        <input
          type="email"
          value={inputVal}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => handleKeyDown(e, list, setList, inputVal, setInput)}
          onBlur={() => addChip(list, setList, inputVal, setInput)}
          className="outline-none text-[13px] text-slate-700 bg-transparent placeholder:text-slate-300 min-w-[120px] flex-1"
          placeholder={list.length === 0 ? 'Add email...' : ''}
        />
      </div>
      {showCcBcc && (
        <div className="flex items-center gap-3 px-4 py-2.5 text-[12px] font-semibold text-blue-600 shrink-0">
          <button type="button" onClick={() => setShowCc(p => !p)} className="hover:underline">Cc</button>
          <button type="button" onClick={() => setShowBcc(p => !p)} className="hover:underline">Bcc</button>
        </div>
      )}
    </div>
  );

  // ── Toolbar button ───────────────────────────────────────────────
  const TBtn = ({ Icon, title }) => (
    <button title={title} className="p-1.5 hover:bg-slate-200 rounded text-slate-600 transition-all">
      <Icon size={14} />
    </button>
  );

  // ════════════════════════════════════════════════════════════════
  //  FULL-PAGE RENDER (no dark overlay, no centered card)
  // ════════════════════════════════════════════════════════════════
  return (
    <div className="fixed inset-0 z-[999] bg-white flex flex-col overflow-hidden">

      {/* ── Page Header ──────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-between px-8 py-4 border-b border-slate-200 bg-white">
        <h1 className="text-[17px] font-bold text-slate-800">
          Email To {vendor?.name || 'Vendor'}
        </h1>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
          title="Close"
        >
          <X size={20} />
        </button>
      </div>

      {/* ── Scrollable body ──────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="max-w-[860px] mx-auto px-8 py-6 space-y-px">

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-[13px] font-medium">
              {error}
            </div>
          )}

          {/* Address block */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">

            {/* From */}
            <div className="flex items-center border-b border-slate-100">
              <div className="w-[90px] shrink-0 px-4 py-3 text-[13px] text-slate-500 border-r border-slate-100 flex items-center gap-1">
                From <HelpCircle size={13} className="text-slate-300 ml-1" />
              </div>
              <div className="flex-1 px-4 py-3 text-[13px] font-medium text-slate-600">
                {currentUserEmail
                  ? `${currentUserName} <${currentUserEmail}>`
                  : <span className="text-slate-400 italic">No email configured</span>
                }
              </div>
            </div>

            {/* Send To */}
            <RecipientRow
              label="Send To"
              list={recipients} setList={setRecipients}
              inputVal={recipientInput} setInput={setRecipientInput}
              showCcBcc={true}
            />

            {showCc && (
              <RecipientRow
                label="Cc"
                list={ccList} setList={setCcList}
                inputVal={ccInput} setInput={setCcInput}
                showCcBcc={false}
              />
            )}

            {showBcc && (
              <RecipientRow
                label="Bcc"
                list={bccList} setList={setBccList}
                inputVal={bccInput} setInput={setBccInput}
                showCcBcc={false}
              />
            )}

            {/* Subject */}
            <div className="flex items-center">
              <div className="w-[90px] shrink-0 px-4 py-3 text-[13px] text-slate-500 border-r border-slate-100">Subject</div>
              <div className="flex-1 px-4 py-1">
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="w-full text-[13px] font-semibold text-slate-800 outline-none bg-transparent py-2"
                  placeholder="Subject..."
                />
              </div>
            </div>
          </div>

          {/* Toolbar + Body */}
          <div className="border border-slate-200 border-t-0 rounded-b-xl overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center gap-0.5 px-3 py-1.5 border-b border-slate-100 bg-slate-50 flex-wrap">
              <TBtn Icon={Bold} title="Bold" />
              <TBtn Icon={Italic} title="Italic" />
              <TBtn Icon={Underline} title="Underline" />
              <TBtn Icon={Strikethrough} title="Strikethrough" />
              <div className="w-px h-5 bg-slate-200 mx-1" />
              <div className="flex items-center gap-1 px-2 py-1 hover:bg-slate-200 rounded cursor-pointer text-[12px] font-medium text-slate-600">
                16px <ChevronDown size={11} className="text-slate-400" />
              </div>
              <div className="flex items-center gap-1 px-2 py-1 hover:bg-slate-200 rounded cursor-pointer text-[12px] font-medium text-slate-600">
                Arial <ChevronDown size={11} className="text-slate-400" />
              </div>
              <div className="w-px h-5 bg-slate-200 mx-1" />
              <TBtn Icon={AlignLeft} title="Align Left" />
              <TBtn Icon={AlignCenter} title="Align Center" />
              <TBtn Icon={AlignRight} title="Align Right" />
              <TBtn Icon={List} title="Bullet List" />
              <div className="w-px h-5 bg-slate-200 mx-1" />
              <TBtn Icon={ImageIcon} title="Insert Image" />
              <TBtn Icon={LinkIcon} title="Insert Link" />
              <div className="flex-1" />
              <TBtn Icon={Undo} title="Undo" />
              <TBtn Icon={Redo} title="Redo" />
            </div>

            {/* Body textarea */}
            <div className="p-6 bg-white">
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                className="w-full min-h-[340px] outline-none text-[13.5px] text-slate-800 font-medium leading-relaxed resize-none"
                placeholder="Compose your message..."
              />
            </div>
          </div>

          {/* PDF Attachment toggle */}
          <div className="pt-3 space-y-3">
            <div className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl">
              <label
                className="flex items-center gap-3 cursor-pointer flex-1"
                onClick={() => setAttachPDF(p => !p)}
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${attachPDF ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                  {attachPDF && <CheckCircle2 size={13} className="text-white" />}
                </div>
                <span className="text-[13px] font-bold text-slate-700">Attach Purchase Order PDF</span>
              </label>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
                <div className="w-6 h-6 rounded bg-red-50 flex items-center justify-center text-red-500">
                  <FileText size={13} />
                </div>
                <span className="text-[12px] font-bold text-slate-700 uppercase tracking-tight">
                  {poData?.poNumber || 'PO-PDF'}
                </span>
              </div>
            </div>

            {attachments.length > 0 && (
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-[12px] font-bold text-blue-600">
                  <Paperclip size={13} /> Attachments
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

      {/* ── Footer (sticky bottom bar) ─────────────────────────── */}
      <div className="shrink-0 border-t border-slate-200 bg-white px-8 py-3 flex items-center gap-3">
        <button
          onClick={handleSend}
          disabled={loading || recipients.length === 0}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-bold rounded-lg shadow shadow-blue-100 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          {loading ? 'Sending...' : 'Send'}
        </button>
        <button
          onClick={onClose}
          className="px-5 py-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 text-[13px] font-bold rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default PurchaseOrderEmailModal;
