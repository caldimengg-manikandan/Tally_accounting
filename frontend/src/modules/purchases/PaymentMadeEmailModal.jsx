import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  X, Send, Loader2, 
  Bold, Italic, Underline,
  AlignLeft, AlignCenter, AlignRight,
  List, FileText, ChevronDown, 
  CheckCircle2, Paperclip, ExternalLink,
  Image as ImageIcon, Link as LinkIcon,
  HelpCircle, User, Strikethrough, Undo, Redo, PlusCircle
} from 'lucide-react';
import { mailAPI, purchaseAPI } from '../../services/api';

const PaymentMadeEmailModal = ({ 
  isOpen, 
  onClose, 
  vendor, 
  paymentDetail, 
  totals, 
  attachments = [],
  onSent,
  selectedContacts = [],
  companyName = '',
  isFullScreenView = false
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
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [pdfPreviewLoading, setPdfPreviewLoading] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(null);

  const [subject, setSubject] = useState(
    `Payment has been made for your invoice(s)`
  );

  const initialBody = useMemo(() => {
    const vendorName = vendor?.name || 'Sir/Madam';
    const amount = totals?.total
      ? `₹${parseFloat(totals.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
      : '—';
      
    // Extract invoice numbers if available
    let invoiceNo = '—';
    if (paymentDetail?.Transactions) {
      const bills = paymentDetail.Transactions.filter(t => parseFloat(t.debit) > 0 && t.description?.includes('BILL_REF')).map(t => {
        const m = t.description.match(/Bill (.*?)\./);
        return m ? m[1] : '';
      }).filter(Boolean);
      if (bills.length > 0) invoiceNo = bills.join(', ');
    }

    const paymentDate = paymentDetail?.date
      ? new Date(paymentDetail.date).toLocaleDateString('en-GB')
      : '—';

    return `Hi ${vendorName},

We have made the payment for your invoice(s). It's been a pleasure doing business with you. We look forward to working with you again.

------------------------------------------------------------------------

Payment Made
${amount}

------------------------------------------------------------------------

Invoice Number    ${invoiceNo}
Payment Date      ${paymentDate}

Regards,
${currentUserName}

${companyName || 'Our Company'}`;
  }, [vendor, paymentDetail, totals, currentUserName, companyName]);

  const [body, setBody] = useState(initialBody);

  // Sync when reopened with fresh data
  useEffect(() => {
    if (isOpen) {
      setRecipients(buildInitialRecipients());
      setSubject(`Payment has been made for your invoice(s)`);
      setBody(initialBody);
      setError(null);
      // Automatically scroll the main container to the top so the modal is instantly visible
      const mainEl = document.querySelector('main');
      if (mainEl) {
        mainEl.scrollTo({ top: 0, behavior: 'instant' });
      } else {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
      // Just set state variables for UI since PDF generation happens differently for payments
      setPdfPreviewLoading(false);
      setPdfPreviewUrl(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, vendor, paymentDetail, totals, companyName, selectedContacts]);

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
        companyId: paymentDetail?.companyId || paymentDetail?.CompanyId,
        ledgerId: vendor?.id,
        type: 'Payment Made',
        referenceId: paymentDetail?.id,
        documentId: paymentDetail?.id,
        isPdfAttached: attachPDF
      });
      if (onSent) {
        onSent();
      } else {
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send email');
    } finally {
      setLoading(false);
    }
  };

  // ── Email chip tag ───────────────────────────────────────────────
  const EmailChip = ({ name, email, onRemove }) => {
    const initial = name ? name.charAt(0).toUpperCase() : (email ? email.charAt(0).toUpperCase() : 'U');
    return (
      <span className="inline-flex items-center gap-1.5 bg-slate-100 border border-slate-200 text-slate-700 text-[13px] font-medium rounded-md px-1.5 py-1">
        <span className="w-4 h-4 rounded-[4px] bg-slate-200/80 flex items-center justify-center text-[10px] font-bold text-slate-500 shrink-0">
          {initial}
        </span>
        <span className="whitespace-nowrap">{name === email ? name : `${name} <${email}>`}</span>
        <button type="button" onClick={() => onRemove(email)} className="ml-1 text-slate-400 hover:text-slate-600 shrink-0 flex items-center justify-center">
          <X size={13} strokeWidth={2} />
        </button>
      </span>
    );
  };

  // ── Compute available contacts from vendor ────────────────────────
  const availableContacts = useMemo(() => {
    if (!vendor) return [];
    const contacts = [];
    
    const cleanNameStr = (str) => {
      if (!str) return '';
      return str.replace(/^(Mr\.|Ms\.|Mrs\.|Dr\.|Prof\.|Mr|Ms|Mrs)\s+/i, '').trim();
    };

    if (vendor.email) {
      const name = cleanNameStr([vendor.firstName, vendor.lastName].filter(Boolean).join(' ') || vendor.name || 'Primary');
      contacts.push({ id: 'primary-contact', name, email: vendor.email });
    }
    
    try {
       const others = vendor.contactPersonsJson ? JSON.parse(vendor.contactPersonsJson) : [];
       if (Array.isArray(others)) {
          others.forEach((c, idx) => {
             if (c.email) {
                let name = c.name || [c.firstName, c.lastName].filter(Boolean).join(' ') || c.salutation || `Contact ${idx+1}`;
                name = cleanNameStr(name);
                contacts.push({ id: `contact-${idx}`, name, email: c.email });
             }
          });
       }
    } catch(e) {}
    
    return contacts;
  }, [vendor]);

  // ── Recipient row ────────────────────────────────────────────────
  const RecipientRow = ({ label, list, setList, inputVal, setInput, showCcBcc }) => {
    const [isFocused, setIsFocused] = useState(false);
    const containerRef = React.useRef(null);
    const searchInputRef = React.useRef(null);

    // Keep the search text inside the dropdown separate
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (containerRef.current && !containerRef.current.contains(event.target)) {
          setIsFocused(false);
          setSearchQuery('');
          // If they typed a valid email in the row input itself (if we keep it)
          if (inputVal && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inputVal)) {
            addChip(list, setList, inputVal, setInput);
          }
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [inputVal, list, setList, setInput]);

    // Focus the dropdown search input when opened
    useEffect(() => {
      if (isFocused && searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, [isFocused]);

    const activeUserEmail = currentUserEmail;

    // Filter available contacts (vendors) by search and exclude already selected
    const filteredVendorContacts = availableContacts.filter(c => 
      !list.some(r => r.email === c.email) &&
      (c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Record Participants = The sender (exclude if already selected)
    const recordParticipants = activeUserEmail ? [{ id: 'sender', email: activeUserEmail }] : [];
    const filteredRecordParticipants = recordParticipants.filter(c => 
      !list.some(r => r.email === c.email) &&
      c.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className={`flex items-start border-b border-slate-100 min-h-[40px] relative transition-colors ${isFocused ? 'bg-slate-50' : 'bg-transparent'}`} ref={containerRef}>
        <div className="w-[90px] shrink-0 px-4 py-3 text-[13px] text-slate-500 border-r border-slate-100 flex items-center">
          {label}
        </div>
        <div 
          className="flex-1 px-3 py-2 flex flex-wrap gap-1.5 items-center relative cursor-text min-h-[40px]"
          onClick={() => setIsFocused(true)}
        >
          {list.map(r => (
            <EmailChip key={r.email} name={r.name} email={r.email} onRemove={e => removeChip(list, setList, e)} />
          ))}
          {!isFocused && list.length === 0 && (
            <span className="text-[13px] text-slate-400">Add email...</span>
          )}
          {isFocused && (
            <div className="absolute top-full left-0 mt-1 w-full max-w-[450px] bg-white border border-slate-200 rounded-lg shadow-xl z-[1000] py-0 overflow-hidden" onClick={e => e.stopPropagation()}>
              
              {/* Search Bar Inside Dropdown */}
              <div className="p-2 border-b border-slate-100">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                    <svg className="h-3.5 w-3.5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-[13px] text-slate-700 bg-white border border-slate-200 rounded-md outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all placeholder:text-slate-400"
                    placeholder="Search"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (filteredVendorContacts.length > 0) {
                          const c = filteredVendorContacts[0];
                          if (!list.some(r => r.email === c.email)) {
                            setList(prev => [...prev, { name: c.name, email: c.email }]);
                          }
                          setSearchQuery('');
                          setIsFocused(false);
                        } else if (searchQuery && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(searchQuery)) {
                          addChip(list, setList, searchQuery, setSearchQuery);
                          setIsFocused(false);
                        }
                      }
                    }}
                  />
                </div>
              </div>

              <div className="max-h-[250px] overflow-y-auto custom-scrollbar py-1">
                {filteredRecordParticipants.length > 0 && (
                  <div className="mb-1">
                    <div className="px-4 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">RECORD PARTICIPANTS</div>
                    {filteredRecordParticipants.map(c => (
                      <div 
                        key={c.id} 
                        className="px-4 py-2 hover:bg-blue-600 hover:text-white cursor-pointer text-[13px] text-slate-700 transition-colors flex items-center group"
                        onClick={() => {
                          if (!list.some(r => r.email === c.email)) {
                            setList(prev => [...prev, { name: c.name, email: c.email }]);
                          }
                          setSearchQuery('');
                          setIsFocused(false);
                        }}
                      >
                        <span className="font-medium group-hover:text-white">&lt;{c.email}&gt;</span>
                      </div>
                    ))}
                  </div>
                )}
                {filteredVendorContacts.length > 0 && (
                  <div className="mb-1">
                    <div className="px-4 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">CONTACT PERSONS</div>
                    {filteredVendorContacts.map(c => (
                      <div 
                        key={c.id} 
                        className="px-4 py-2 hover:bg-blue-50 hover:text-blue-700 cursor-pointer text-[13px] text-slate-600 transition-colors flex items-center group"
                        onClick={() => {
                          if (!list.some(r => r.email === c.email)) {
                            setList(prev => [...prev, { name: c.name, email: c.email }]);
                          }
                          setSearchQuery('');
                          setIsFocused(false);
                        }}
                      >
                        <span className="font-medium mr-1 text-slate-700 group-hover:text-blue-800">{c.name}</span> &lt;{c.email}&gt;
                      </div>
                    ))}
                  </div>
                )}
                {filteredRecordParticipants.length === 0 && filteredVendorContacts.length === 0 && searchQuery && (
                  <div className="px-4 py-3 text-[13px] text-slate-500">Press Enter to add "{searchQuery}"</div>
                )}
                {filteredRecordParticipants.length === 0 && filteredVendorContacts.length === 0 && !searchQuery && (
                  <div className="px-4 py-3 text-[13px] text-slate-400 italic">No contacts available</div>
                )}
              </div>
              <div className="border-t border-slate-100 mt-1 pt-1.5 px-2">
                <button 
                  type="button"
                  className="flex items-center gap-1.5 text-[13px] text-blue-600 hover:text-blue-800 hover:bg-blue-50 font-medium px-3 py-1.5 rounded-md w-full transition-colors"
                >
                  <PlusCircle size={14} /> Add Contact Person
                </button>
              </div>
            </div>
          )}
        </div>
        {showCcBcc && (
          <div className="flex items-center gap-3 px-4 py-3 text-[12px] font-semibold text-blue-600 shrink-0">
            <button type="button" onClick={() => setShowCc(p => !p)} className="hover:underline">Cc</button>
            <button type="button" onClick={() => setShowBcc(p => !p)} className="hover:underline">Bcc</button>
          </div>
        )}
      </div>
    );
  };

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
    <div 
      className={isFullScreenView 
        ? "w-full h-full bg-white flex flex-col" 
        : "absolute inset-0 z-[9999] bg-white flex flex-col"} 
      style={{minHeight: 0}}
    >

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
        <div className="max-w-[1200px] px-8 py-6 space-y-px">

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-[13px] font-medium">
              {error}
            </div>
          )}

          {/* Address block */}
          <div className="border border-slate-200 rounded-xl">

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
                className="w-full min-h-[220px] max-h-[340px] outline-none text-[13.5px] text-slate-800 font-medium leading-relaxed resize-y"
                placeholder="Compose your message..."
              />
            </div>
          </div>

          {/* PDF Attachment toggle */}
          <div className="pt-3 space-y-3">
            <div className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl">
              <label
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => setAttachPDF(p => !p)}
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${attachPDF ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                  {attachPDF && <CheckCircle2 size={13} className="text-white" />}
                </div>
                <span className="text-[13px] font-bold text-slate-700">Attach Purchase Order PDF</span>
              </label>

              {attachPDF && (
                <button
                  type="button"
                  title={pdfPreviewUrl ? 'Click to preview the PDF that will be sent' : 'Generating PDF preview...'}
                  onClick={() => { if (pdfPreviewUrl) window.open(pdfPreviewUrl, '_blank'); }}
                  className={`ml-2 flex items-center gap-2 rounded-lg px-3 py-1.5 border transition-all group ${
                    pdfPreviewUrl
                      ? 'bg-red-50 border-red-200 hover:bg-red-100 hover:border-red-400 cursor-pointer'
                      : 'bg-slate-50 border-slate-200 cursor-default opacity-70'
                  }`}
                >
                  <div className="w-6 h-6 rounded bg-red-100 flex items-center justify-center text-red-500 shrink-0">
                    {pdfPreviewLoading
                      ? <Loader2 size={12} className="animate-spin text-slate-400" />
                      : <FileText size={13} />
                    }
                  </div>
                  <span className="text-[12px] font-bold text-slate-700 uppercase tracking-tight">
                    {paymentDetail?.voucherNumber || paymentDetail?.paymentNumber || 'Payment-3'}
                  </span>
                  {pdfPreviewUrl && (
                    <ExternalLink size={11} className="text-slate-400 group-hover:text-red-500 transition-colors" />
                  )}
                </button>
              )}
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

export default PaymentMadeEmailModal;
