import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Plus, Search, Edit, FileText, X, Printer,
  Download, ChevronDown, Activity, MoreHorizontal,
  Trash2, RefreshCcw, Bookmark, Maximize2, ChevronLeft, ChevronRight, Settings
} from 'lucide-react';
import { voucherAPI, ledgerAPI } from '../../services/api';
import useNotificationStore from '../../store/notificationStore';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const fmt = (v) =>
  Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

const StatusBadge = ({ status }) => {
  const isPublished = !status || status === 'published' || status === 'Posted' || status === 'Published';
  return (
    <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${
      isPublished ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-white'
    }`}>
      {isPublished ? 'Published' : 'Draft'}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────
// DETAIL PANE
// ─────────────────────────────────────────────────────────────
const JournalDetailPane = ({ journal, ledgers, onEdit, onDelete, onClose, detailView, setDetailView }) => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [showPrintDropdown, setShowPrintDropdown] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  const entries = useMemo(() => {
    if (!journal) return [];
    return journal.Transactions || journal.entries || [];
  }, [journal]);

  const totalDebit = useMemo(
    () => entries.reduce((s, e) => s + (parseFloat(e.debit) || 0), 0),
    [entries]
  );
  const totalCredit = useMemo(
    () => entries.reduce((s, e) => s + (parseFloat(e.credit) || 0), 0),
    [entries]
  );

  const getLedgerName = useCallback(
    (id) => {
      if (!id) return '—';
      const l = ledgers.find((l) => String(l.id) === String(id));
      return l ? l.name : String(id);
    },
    [ledgers]
  );

  const generateJournalPDF = (journal, entries, totalDebit, totalCredit, ledgers) => {
    const doc = new jsPDF();
    const journalNo = journal.voucherNumber || journal.journalNumber || '—';
    const journalSeqNo = journalNo !== '—'
      ? String(parseInt(journalNo.split('-').pop(), 10) || journalNo)
      : '—';
    const refNo = journal.reference || journal.referenceNumber || journal.Reference || '—';
    const notes = journal.narration || journal.notes || '';

    // Header
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('JOURNAL', 190, 25, { align: 'right' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`#${journalSeqNo}`, 190, 32, { align: 'right' });
    
    // Info section
    doc.setFontSize(10);
    const rightX = 190;
    const labelX = 125;
    
    doc.text('Date:', labelX, 50);
    doc.text(fmtDate(journal.date), rightX, 50, { align: 'right' });
    
    doc.text('Amount:', labelX, 57);
    doc.text(`INR ${fmt(totalDebit)}`, rightX, 57, { align: 'right' });
    
    doc.text('Reference Number:', labelX, 64);
    doc.text(refNo, rightX, 64, { align: 'right' });
    
    if (notes) {
      doc.setFont('helvetica', 'bold');
      doc.text('Notes', 20, 50);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const splitNotes = doc.splitTextToSize(notes, 80);
      doc.text(splitNotes, 20, 55);
    }
    
    // Table
    const tableData = entries.map(e => [
      { 
        content: `${getLedgerName(e.LedgerId || e.ledgerId)}${e.description ? '\n' + e.description : ''}`,
        styles: { minCellHeight: 12 }
      },
      e.contactName || '',
      parseFloat(e.debit) > 0 ? fmt(e.debit) : '',
      parseFloat(e.credit) > 0 ? fmt(e.credit) : ''
    ]);
    
    autoTable(doc, {
      startY: 80,
      head: [['Account', 'Contact', 'Debits', 'Credits']],
      body: tableData,
      theme: 'plain',
      headStyles: { fillColor: [51, 51, 51], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3, lineColor: [226, 232, 240], lineWidth: 0.1 },
      columnStyles: {
        0: { cellWidth: 80 },
        2: { halign: 'right', cellWidth: 30 },
        3: { halign: 'right', cellWidth: 30 }
      },
      didDrawCell: (data) => {
        if (data.section === 'body') {
           doc.setDrawColor(226, 232, 240);
           doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
        }
      }
    });
    
    // Totals
    const finalY = doc.lastAutoTable.finalY + 10;
    const totalsX = 130;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Sub Total', totalsX, finalY);
    doc.setFont('helvetica', 'normal');
    doc.text(fmt(totalDebit), 170, finalY, { align: 'right' });
    doc.text(fmt(totalCredit), 195, finalY, { align: 'right' });
    
    doc.setFillColor(243, 244, 246); // slate-100 (light grey)
    doc.rect(totalsX - 10, finalY + 5, 75, 15, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('Total', totalsX, finalY + 15);
    doc.text(`${fmt(totalDebit)}`, 170, finalY + 15, { align: 'right' });
    doc.text(`${fmt(totalCredit)}`, 195, finalY + 15, { align: 'right' });
    
    return doc;
  };

  const handleDownloadPDF = () => {
    const doc = generateJournalPDF(journal, entries, totalDebit, totalCredit, ledgers);
    const journalNo = journal.voucherNumber || journal.journalNumber || '—';
    const journalSeqNo = journalNo !== '—'
      ? String(parseInt(journalNo.split('-').pop(), 10) || journalNo)
      : '—';
    doc.save(`Journal_${journalSeqNo}.pdf`);
  };

  const handlePrintPreview = () => {
    const doc = generateJournalPDF(journal, entries, totalDebit, totalCredit, ledgers);
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
    setShowPrintPreview(true);
    setShowPrintDropdown(false);
  };

  if (!journal) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#fafbfd] text-slate-300 gap-3">
        <FileText size={44} strokeWidth={1} />
        <p className="text-[11px] font-black uppercase tracking-[0.2em]">Select a journal to view</p>
      </div>
    );
  }

  // Full voucher number for heading (e.g. "JOU-2026-0001")
  const journalNo = journal.voucherNumber || journal.journalNumber || '—';
  // Sequence number for the Journal# info field (e.g. "1" from "JOU-2026-0001")
  const journalSeqNo = journalNo !== '—'
    ? String(parseInt(journalNo.split('-').pop(), 10) || journalNo)
    : '—';
  const refNo        = journal.reference || journal.referenceNumber || journal.Reference || '—';
  const txType       = journal.voucherType || 'Journal';
  const reportingM   = journal.reportingMethod || 'Accrual and Cash';
  const currency     = (journal.currency || 'INR').split(' ')[0];
  const notes        = journal.narration || journal.notes || '';

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white border-l border-slate-200">

      {/* ── Top bar with sequence number + icon buttons ── */}
      <div className="flex items-center justify-between px-6 py-2.5 border-b border-slate-100 bg-white shrink-0">
        <span className="text-[16px] font-black text-blue-600 tracking-tight">{journalSeqNo}</span>
        <div className="flex items-center gap-1.5">
          <button className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 text-slate-400 hover:bg-slate-50 transition-all">
            <Bookmark size={13} />
          </button>
          <button className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 text-slate-400 hover:bg-slate-50 transition-all">
            <Maximize2 size={13} />
          </button>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* ── Action bar: Edit / PDF-Print / … ── */}
      <div className="flex items-center gap-2 px-6 py-2 border-b border-slate-100 bg-white shrink-0">
        <button onClick={onEdit} className="flex items-center gap-1.5 px-3 py-1 rounded text-[12px] font-bold text-slate-600 hover:bg-slate-100 transition-all">
          <Edit size={12} /> Edit
        </button>
        
        <div className="relative">
          <button 
            onClick={() => setShowPrintDropdown(!showPrintDropdown)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-[12px] font-bold transition-all ${
              showPrintDropdown ? 'bg-slate-100 text-blue-600' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Printer size={12} /> PDF/Print <ChevronDown size={11} className={`transition-transform ${showPrintDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showPrintDropdown && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setShowPrintDropdown(false)} />
              <div className="absolute top-full left-0 mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-xl z-30 py-1.5 animate-in fade-in slide-in-from-top-1">
                <button 
                  onClick={() => { handleDownloadPDF(); setShowPrintDropdown(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-[13px] font-bold text-slate-700 hover:bg-blue-600 hover:text-white transition-colors"
                >
                  <FileText size={15} /> PDF
                </button>
                <button 
                  onClick={handlePrintPreview}
                  className="w-full flex items-center gap-3 px-4 py-2 text-[13px] font-bold text-slate-700 hover:bg-blue-600 hover:text-white transition-colors"
                >
                  <Printer size={15} /> Print
                </button>
              </div>
            </>
          )}
        </div>

        <button className="flex items-center gap-1 px-2 py-1 rounded text-[12px] font-bold text-slate-500 hover:bg-slate-100 transition-all">
          <MoreHorizontal size={14} />
        </button>
        <button onClick={() => onDelete(journal.id)} className="ml-auto p-1.5 text-red-400 hover:bg-red-50 rounded transition-all" title="Delete">
          <Trash2 size={14} />
        </button>
      </div>

      {/* ── Scrollable Body ── */}
      <div className="flex-1 overflow-y-auto overflow-x-auto">

        {/* Tabs row */}
        <div className="px-8 flex items-center gap-8 border-b border-slate-100">
          {['Overview', 'Activity Logs'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 text-[13px] font-bold tracking-tight relative transition-all ${
                activeTab === tab ? 'text-blue-600' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 w-full h-[2.5px] bg-blue-600 rounded-t-full" />
              )}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2 mb-1">
            <button
              onClick={() => setDetailView('Details')}
              className={`px-3 py-1 text-[11px] font-black rounded transition-all ${
                detailView === 'Details'
                  ? 'bg-blue-600 text-white border border-blue-600'
                  : 'text-slate-500 border border-slate-200 hover:bg-slate-50'
              }`}
            >Details</button>
            <button
              onClick={() => setDetailView('PDF')}
              className={`px-3 py-1 text-[11px] font-black rounded transition-all ${
                detailView === 'PDF'
                  ? 'bg-blue-600 text-white border border-blue-600'
                  : 'text-slate-500 border border-slate-200 hover:bg-slate-50'
              }`}
            >PDF</button>
          </div>
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'Overview' && detailView === 'Details' && (
          <div className="px-8 py-7 space-y-8 min-w-[640px]">

            {/* Sequence number + Published badge (inside overview) */}
            <div className="flex items-center gap-3">
              <span className="text-[16px] font-black text-slate-900">{journalSeqNo}</span>
              <StatusBadge status={journal.status} />
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-x-20 gap-y-3">
              {[
                { label: 'Journal#',          value: journalSeqNo, blue: true  },
                { label: 'Reference Number',  value: refNo,        blue: false },
                { label: 'Journal Date',      value: fmtDate(journal.date), blue: false },
                { label: 'Transaction Type',  value: txType,       blue: true  },
                { label: 'Currency',          value: currency,     blue: false },
                { label: 'Reporting Method',  value: reportingM,   blue: false },
              ].map(({ label, value, blue }) => (
                <div key={label} className="flex items-start gap-4">
                  <span className="w-36 text-[12px] font-medium text-blue-500 shrink-0">{label}</span>
                  <span className={`text-[13px] font-medium ${blue ? 'text-blue-600' : 'text-slate-700'}`}>{value}</span>
                </div>
              ))}
              {notes && (
                <div className="col-span-2 flex items-start gap-4">
                  <span className="w-36 text-[12px] font-medium text-blue-500 shrink-0">Notes</span>
                  <span className="text-[13px] font-medium text-slate-600 italic">{notes}</span>
                </div>
              )}
            </div>

            {/* Journal Details table */}
            <div>
              <h3 className="text-[14px] font-black text-slate-800 mb-3">Journal Details</h3>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/70 border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest w-[45%]">Item</th>
                      <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact (INR)</th>
                      <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Debit</th>
                      <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Credit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {entries.length > 0 ? entries.map((entry, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-5 py-3">
                          <p className="text-[13px] font-bold text-slate-800">
                            {getLedgerName(entry.LedgerId || entry.ledgerId)}
                          </p>
                          {entry.description && (
                            <p className="text-[11px] text-blue-500 font-medium mt-0.5 italic">{entry.description}</p>
                          )}
                        </td>
                        <td className="px-5 py-3 text-[13px] text-slate-500">
                          {entry.contactName || '—'}
                        </td>
                        <td className="px-5 py-3 text-right">
                          {parseFloat(entry.debit) > 0 && (
                            <span className="text-[13px] font-bold text-slate-900">{fmt(entry.debit)}</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right">
                          {parseFloat(entry.credit) > 0 && (
                            <span className="text-[13px] font-bold text-blue-600">{fmt(entry.credit)}</span>
                          )}
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={4} className="px-5 py-8 text-center text-slate-300 text-[13px] italic">
                          No journal entries recorded.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="border-t-2 border-slate-200 bg-slate-50/40">
                    <tr>
                      <td colSpan={2} className="px-5 py-2.5 text-[11px] font-black text-slate-500 text-right uppercase tracking-wider">
                        Sub Total
                      </td>
                      <td className="px-5 py-2.5 text-[13px] font-black text-slate-700 text-right">{fmt(totalDebit)}</td>
                      <td className="px-5 py-2.5 text-[13px] font-black text-slate-700 text-right">{fmt(totalCredit)}</td>
                    </tr>
                    <tr>
                      <td colSpan={2} className="px-5 py-2.5 text-[13px] font-black text-slate-800 text-right">
                        Total Amount
                      </td>
                      <td className="px-5 py-2.5 text-[14px] font-black text-slate-900 text-right">{fmt(totalDebit)}</td>
                      <td className="px-5 py-2.5 text-[14px] font-black text-slate-900 text-right">{fmt(totalCredit)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Scroll arrows at bottom */}
            <div className="flex justify-between pt-2">
              <button className="w-6 h-6 flex items-center justify-center rounded border border-slate-200 text-slate-400 hover:bg-slate-50"><ChevronLeft size={12}/></button>
              <button className="w-6 h-6 flex items-center justify-center rounded border border-slate-200 text-slate-400 hover:bg-slate-50"><ChevronRight size={12}/></button>
            </div>
          </div>
        )}

        {/* PDF VIEW */}
        {activeTab === 'Overview' && detailView === 'PDF' && (
          <div className="flex-1 bg-slate-100 p-8 overflow-y-auto">
            {/* PDF Document */}
            <div className="bg-white shadow-lg rounded-sm max-w-[700px] mx-auto relative" style={{ minHeight: 500 }}>

              {/* Published Ribbon */}
              <div className="absolute top-0 left-0 w-20 h-20 overflow-hidden">
                <div
                  className="absolute top-5 -left-6 w-32 text-center text-white text-[9px] font-black uppercase tracking-widest py-1"
                  style={{ background: '#059669', transform: 'rotate(-45deg)', boxShadow: '0 2px 4px rgba(0,0,0,0.15)' }}
                >
                  Published
                </div>
              </div>



              {/* Journal Header */}
              <div className="text-center pt-4 pb-6">
                <h2 className="text-[28px] font-black text-slate-900 tracking-tight">JOURNAL</h2>
                <p className="text-[13px] text-slate-500 font-medium mt-1">#{journalSeqNo}</p>
              </div>

              {/* Info rows */}
              <div className="px-10 pb-6 space-y-2">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-[12px] font-bold text-slate-700">Notes</p>
                    <p className="text-[12px] text-slate-500 italic mt-0.5">{notes || '—'}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="flex items-center justify-end gap-4">
                      <span className="text-[12px] text-slate-500">Date:</span>
                      <span className="text-[12px] font-medium text-slate-800 w-28 text-right">{fmtDate(journal.date)}</span>
                    </div>
                    <div className="flex items-center justify-end gap-4">
                      <span className="text-[12px] text-slate-500">Amount:</span>
                      <span className="text-[12px] font-bold text-slate-800 w-28 text-right">₹{fmt(totalDebit)}</span>
                    </div>
                    <div className="flex items-center justify-end gap-4">
                      <span className="text-[12px] text-slate-500">Reference Number:</span>
                      <span className="text-[12px] font-medium text-slate-800 w-28 text-right">{refNo}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Entries Table */}
              <div className="px-10 pb-8">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-700 text-white">
                      <th className="px-4 py-2.5 text-left text-[11px] font-bold">Account</th>
                      <th className="px-4 py-2.5 text-left text-[11px] font-bold">Contact</th>
                      <th className="px-4 py-2.5 text-right text-[11px] font-bold">Debits</th>
                      <th className="px-4 py-2.5 text-right text-[11px] font-bold">Credits</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry, idx) => (
                      <React.Fragment key={idx}>
                        <tr className="border-b border-slate-100">
                          <td className="px-4 py-2.5">
                            <span className="text-[12px] font-bold text-slate-800">
                              {getLedgerName(entry.LedgerId || entry.ledgerId)}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-[12px] text-slate-500">
                            {entry.contactName || ''}
                          </td>
                          <td className="px-4 py-2.5 text-right text-[12px] font-medium text-slate-800">
                            {parseFloat(entry.debit) > 0 ? fmt(entry.debit) : ''}
                          </td>
                          <td className="px-4 py-2.5 text-right text-[12px] font-medium text-slate-800">
                            {parseFloat(entry.credit) > 0 ? fmt(entry.credit) : ''}
                          </td>
                        </tr>
                        {entry.description && (
                          <tr className="border-b border-slate-50">
                            <td colSpan={4} className="px-4 py-1 text-[11px] text-slate-400 italic">
                              {entry.description}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>

                {/* Sub Total */}
                <div className="border-t border-slate-200 mt-2">
                  <div className="flex justify-end py-2 gap-6 pr-4">
                    <span className="text-[11px] font-bold text-slate-500">Sub Total</span>
                    <span className="text-[12px] font-bold text-slate-700 w-24 text-right">{fmt(totalDebit)}</span>
                    <span className="text-[12px] font-bold text-slate-700 w-24 text-right">{fmt(totalCredit)}</span>
                  </div>
                </div>

                {/* Total */}
                <div className="bg-amber-50 border border-amber-200 rounded mt-1">
                  <div className="flex justify-end py-2.5 gap-6 pr-4">
                    <span className="text-[12px] font-black text-amber-700">Total</span>
                    <span className="text-[13px] font-black text-slate-900 w-24 text-right">₹{fmt(totalDebit)}</span>
                    <span className="text-[13px] font-black text-slate-900 w-24 text-right">₹{fmt(totalCredit)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Scroll arrows */}
            <div className="flex justify-between pt-4 max-w-[700px] mx-auto">
              <button className="w-6 h-6 flex items-center justify-center rounded border border-slate-200 text-slate-400 hover:bg-white bg-white"><ChevronLeft size={12}/></button>
              <button className="w-6 h-6 flex items-center justify-center rounded border border-slate-200 text-slate-400 hover:bg-white bg-white"><ChevronRight size={12}/></button>
            </div>

            {/* Footer note */}
            <p className="text-center text-[11px] text-blue-500 mt-6 font-medium">
              To view additional manual journal information not displayed in the PDF,{' '}
              <button onClick={() => setDetailView('Details')} className="underline hover:text-blue-700 font-bold">
                switch to the Manual Journal Details View
              </button>.
            </p>
          </div>
        )}

        {/* ACTIVITY LOGS TAB */}
        {activeTab === 'Activity Logs' && (
          <div className="px-8 py-12 flex flex-col items-center justify-center text-slate-300 gap-3">
            <Activity size={36} strokeWidth={1} />
            <p className="text-[12px] font-black uppercase tracking-widest">No activity recorded yet</p>
          </div>
        )}
      </div>

      {/* ── Print Preview Modal ── */}
      {showPrintPreview && (
        <div className="fixed inset-0 z-[9999] flex flex-col bg-slate-900/60 backdrop-blur-sm transition-all duration-300">
          {/* Modal Header */}
          <div className="bg-[#f8fafc] border-b border-slate-200 px-8 py-3.5 flex items-center justify-between shrink-0 shadow-md">
            <div className="flex items-center gap-3">
              <h2 className="text-[16px] font-medium text-slate-800 tracking-tight">Preview</h2>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  const iframe = document.getElementById('print-iframe');
                  if (iframe) {
                    iframe.contentWindow.focus();
                    iframe.contentWindow.print();
                  }
                }}
                className="px-6 py-1.5 bg-[#3b82f6] text-white rounded text-[13px] font-bold hover:bg-blue-700 transition-all active:scale-95 shadow-sm"
              >
                Print
              </button>
              <button 
                onClick={() => {
                  URL.revokeObjectURL(previewUrl);
                  setShowPrintPreview(false);
                  setPreviewUrl('');
                }}
                className="px-6 py-1.5 bg-white border border-slate-200 text-slate-700 rounded text-[13px] font-bold hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
          {/* Modal Body */}
          <div className="flex-1 p-6 md:p-12 flex justify-center overflow-hidden bg-slate-100/50">
             <div className="w-full max-w-[1000px] h-full bg-white shadow-2xl rounded-lg overflow-hidden border border-slate-200">
               <iframe 
                 id="print-iframe"
                 src={previewUrl} 
                 className="w-full h-full border-none"
                 title="Print Preview"
               />
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// MAIN SPLIT VIEW
// ─────────────────────────────────────────────────────────────
const ManualJournalsListView = ({ companyId: propCompanyId }) => {
  const { id } = useParams();
  const navigate  = useNavigate();
  const { addNotification } = useNotificationStore();
  const companyId = propCompanyId || localStorage.getItem('companyId');

  const [journals,    setJournals]    = useState([]);
  const [ledgers,     setLedgers]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [error,       setError]       = useState(null);
  const [selectedId,  setSelectedId]  = useState(id || null);
  const [detailView,  setDetailView]  = useState('Details');
  const user = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  }, []);

  // ── Fetch all journals + ledgers ──────────────────────────
  const fetchData = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const [vRes, lRes] = await Promise.all([
        voucherAPI.getByCompany(companyId),
        ledgerAPI.getByCompany(companyId),
      ]);
      const rawData = vRes.data;
      const all = Array.isArray(rawData) ? rawData : (rawData?.vouchers || rawData?.data || []);
      setJournals(all.filter((v) => v.voucherType?.toLowerCase() === 'journal'));
      setLedgers(lRes.data || []);
      setError(null);
    } catch (err) {
      console.error('Failed to load journals:', err);
      setError(err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to load data from server.');
    }
    setLoading(false);
  }, [companyId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Keep selectedId in sync with URL param
  useEffect(() => {
    if (id) setSelectedId(id);
  }, [id]);

  // Filtered list
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return journals.filter(
      (j) =>
        !q ||
        (j.voucherNumber || '').toLowerCase().includes(q) ||
        (j.narration     || '').toLowerCase().includes(q)
    );
  }, [journals, search]);

  // ── Selected journal object ──────────────────────────────
  const selectedJournal = useMemo(
    () => journals.find((j) => String(j.id) === String(selectedId)) || null,
    [journals, selectedId]
  );

  const handleSelect = (j, view = 'Details') => {
    setSelectedId(String(j.id));
    setDetailView(view);
    // Update URL silently without triggering a React Router remount
    window.history.replaceState(null, '', `/accountant/journals/${j.id}`);
  };

  const handleClose = () => {
    setSelectedId(null);
    window.history.replaceState(null, '', '/accountant/journals');
  };

  const handleDelete = async (jid) => {
    if (!window.confirm('Delete this journal entry?')) return;
    try {
      await voucherAPI.delete(jid);
      addNotification('Journal deleted.', 'success');
      setJournals((prev) => prev.filter((j) => j.id !== jid));
      handleClose();
    } catch {
      addNotification('Failed to delete journal.', 'error');
    }
  };

  const totalAmt = (j) =>
    (j.Transactions || j.entries || []).reduce((s, t) => s + (parseFloat(t.debit) || 0), 0);

  // Sidebar width: narrower when a journal is selected
  const sidebarW = selectedId ? 280 : undefined;

  // ── FULL TABLE VIEW (FRONT PAGE) ──────────────────────────
  if (!selectedId) {
    return (
      <div className="flex-1 flex flex-col bg-white h-full overflow-hidden">
        {/* Header bar matching Image 2 */}
        <div className="flex items-center justify-between px-8 py-4 border-b border-slate-100 shrink-0 bg-white">
          <div className="flex items-center gap-2 cursor-pointer group">
            <h1 className="text-[18px] font-black text-slate-800 flex items-center gap-2">
              All Manual Journals <ChevronDown size={16} className="text-blue-500 group-hover:translate-y-0.5 transition-transform"/>
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="text-[12px] font-bold text-blue-600 hover:underline flex items-center gap-1.5">
              <span className="text-blue-400">⚡</span> Find Accountants
            </button>
            <div className="flex items-center">
              <button 
                onClick={() => navigate('/accountant/journals/new')}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-l text-[13px] font-black hover:bg-blue-700 transition-all shadow-sm active:scale-95"
              >
                <Plus size={16} strokeWidth={3}/> New
              </button>
              <button className="h-[37px] px-2 bg-blue-600 text-white border-l border-blue-500 rounded-r hover:bg-blue-700 transition-all flex items-center justify-center">
                <ChevronDown size={14}/>
              </button>
            </div>
            <button className="p-2 border border-slate-200 rounded text-slate-400 hover:bg-slate-50 transition-all">
              <MoreHorizontal size={18}/>
            </button>
          </div>
        </div>

        {/* Toolbar row (Period, Search, etc) */}
        <div className="px-8 py-3 flex items-center justify-between border-b border-slate-50 bg-[#fafbfd]">
          <div className="flex items-center gap-2">
             <span className="text-[11px] font-bold text-blue-500">Period:</span>
             <button className="flex items-center gap-0.5 text-[11px] font-black text-slate-700 hover:text-blue-600">
               All <ChevronDown size={10} className="ml-1 text-slate-400"/>
             </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"/>
              <input 
                type="text" 
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded text-[12px] focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 w-48 transition-all"
              />
            </div>
            <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-all">
              <Settings size={14}/>
            </button>
          </div>
        </div>

        {/* Main Table */}
        <div className="flex-1 overflow-auto bg-white">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="border-b border-slate-200">
                <th className="pl-8 pr-4 py-3 w-12"><div className="w-4 h-4 border border-slate-300 rounded-sm"/></th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">DATE</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">JOURNAL#</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">REFERENCE NUMBER</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">STATUS</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap text-center">NOTES</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap text-right">AMOUNT</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">CREATED BY</th>
                <th className="px-8 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">REPORTING METHOD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-20 text-center">
                    <div className="inline-block w-6 h-6 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"/>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-300">
                      <FileText size={48} strokeWidth={1}/>
                      <p className="text-[12px] font-black uppercase tracking-widest">No manual journals found</p>
                      <button onClick={() => navigate('/accountant/journals/new')} className="text-blue-600 font-bold text-[12px] hover:underline">+ Create New Journal</button>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((j) => {
                  const amt = totalAmt(j);
                  const seqNo = j.voucherNumber
                    ? String(parseInt(j.voucherNumber.split('-').pop(), 10) || j.voucherNumber)
                    : '—';
                  const isPublished = !j.status || j.status === 'published' || j.status === 'Posted' || j.status === 'Published';
                  return (
                    <tr 
                      key={j.id} 
                      onClick={() => handleSelect(j)}
                      className="group hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <td className="pl-8 pr-4 py-4"><div className="w-4 h-4 border border-slate-300 rounded-sm group-hover:border-blue-400"/></td>
                      <td className="px-4 py-4 text-[12px] font-bold text-slate-700">{fmtDate(j.date)}</td>
                      <td className="px-4 py-4 text-[12px] font-bold text-blue-600">{seqNo}</td>
                      <td className="px-4 py-4 text-[12px] font-medium text-slate-600">{j.reference || j.referenceNumber || '—'}</td>
                      <td className="px-4 py-4">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${isPublished ? 'text-emerald-500' : 'text-amber-500'}`}>
                          {isPublished ? 'PUBLISHED' : 'DRAFT'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        {(j.notes || j.narration) && (
                          <div className="flex justify-center">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelect(j, 'PDF');
                              }}
                              className="p-1 hover:bg-slate-100 rounded transition-colors"
                            >
                              <FileText size={14} className="text-slate-400 group-hover:text-blue-500" title={j.notes || j.narration}/>
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-[12px] font-black text-slate-900 text-right">₹{fmt(amt)}</td>
                      <td className="px-4 py-4 text-[12px] font-medium text-slate-500">{j.User?.name || j.createdBy || user.name || user.username || user.email || 'Administrator'}</td>
                      <td className="px-8 py-4 text-[12px] font-medium text-slate-600">{j.reportingMethod || 'Accrual and Cash'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer info matching image layout */}
        <div className="px-8 py-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-bold shrink-0">
          <div>Total: {filtered.length} Journals</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-white">
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* ══ LEFT SIDEBAR ══════════════════════════════════════ */}
      <div
        style={{ width: sidebarW, minWidth: sidebarW }}
        className="flex flex-col border-r border-slate-200 bg-white transition-all duration-300 shrink-0"
      >
        {/* Sidebar Header */}
        <div className="px-5 py-5 border-b border-slate-100 space-y-5 shrink-0">
          {/* Title row */}
          <div className="flex items-center justify-between gap-1">
            <button onClick={handleClose} className="flex items-center gap-1.5 text-[13px] font-black text-slate-800 truncate hover:text-blue-600 transition-colors">
              <ChevronLeft size={16} className="text-blue-500"/> All Manual Jour...
            </button>
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                onClick={() => navigate('/accountant/journals/new')}
                className="w-8 h-8 flex items-center justify-center rounded bg-blue-600 text-white hover:bg-blue-700 transition-all"
              >
                <Plus size={16} strokeWidth={3}/>
              </button>
            </div>
          </div>
        </div>

        {/* Journal list */}
        <div className="flex-1 overflow-y-auto no-scrollbar pt-2">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-5 h-5 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"/>
            </div>
          ) : (
            filtered.map((j) => {
              const isActive = String(j.id) === String(selectedId);
              const amt = totalAmt(j);
              const seqNo = j.voucherNumber
                ? String(parseInt(j.voucherNumber.split('-').pop(), 10) || j.voucherNumber)
                : '—';
              const isPublished = !j.status || j.status === 'published' || j.status === 'Posted' || j.status === 'Published';
              return (
                <div
                  key={j.id}
                  onClick={() => handleSelect(j)}
                  className={`px-5 py-5 cursor-pointer border-b border-slate-50 transition-all ${
                    isActive ? 'bg-slate-100/80 border-l-4 border-l-blue-600' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className={`text-[12px] font-bold ${isActive ? 'text-slate-900' : 'text-slate-700'}`}>
                      {fmtDate(j.date)}
                    </span>
                    <span className="text-[12px] font-bold text-slate-900 tracking-tight">
                      ₹{fmt(amt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className={`text-[12px] font-medium ${isActive ? 'text-blue-600' : 'text-slate-500'}`}>
                      {seqNo}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${
                      isPublished ? 'text-blue-600' : 'text-amber-500'
                    }`}>
                      {isPublished ? 'PUBLISHED' : 'DRAFT'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ══ DETAIL PANE ════════════════════════════════════════ */}
      <JournalDetailPane
        journal={selectedJournal}
        ledgers={ledgers}
        onEdit={() => navigate(`/accountant/journals/edit/${selectedId}`)}
        onDelete={handleDelete}
        onClose={handleClose}
        detailView={detailView}
        setDetailView={setDetailView}
      />
    </div>
  );
};

export default ManualJournalsListView;
