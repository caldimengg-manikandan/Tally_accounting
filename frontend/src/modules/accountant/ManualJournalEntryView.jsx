import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, X, Plus, Info, Upload, ChevronDown, 
  HelpCircle, Settings, Save, FileText, Calendar,
  MoreHorizontal, Trash2, CheckCircle2, AlertCircle,
  Clock, Link as LinkIcon
} from 'lucide-react';
import { ledgerAPI, voucherAPI, accountingAPI, companyAPI } from '../../services/api';
import useNotificationStore from '../../store/notificationStore';

const REPORTING_METHODS = ['Accrual and Cash', 'Accrual Only', 'Cash Only'];
const CURRENCIES = ['INR - Indian Rupee', 'USD - United States Dollar', 'EUR - Euro'];

let _uid = 1000;
const newJournalRow = () => ({
  _id: _uid++,
  ledgerId: '',
  description: '',
  contactId: '',
  debit: 0,
  credit: 0,
  projectId: '',
  tags: []
});

const ManualJournalEntryView = ({ onSaveSuccess, onCancel }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const { addNotification } = useNotificationStore();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [reverseJournalDate, setReverseJournalDate] = useState('');
  const [publishReverseOnly, setPublishReverseOnly] = useState(false);
  const [journalNumber, setJournalNumber] = useState('1');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [reportingMethod, setReportingMethod] = useState('Accrual and Cash');
  const [currency, setCurrency] = useState('INR - Indian Rupee');
  
  const [rows, setRows] = useState([newJournalRow(), newJournalRow()]);
  const [ledgers, setLedgers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [saving, setSaving] = useState(false);
  
  const companyId = localStorage.getItem('companyId');

  // Load ledgers
  useEffect(() => {
    if (companyId) {
      ledgerAPI.getByCompany(companyId).then(res => {
        const allLedgers = res.data || [];
        setLedgers(allLedgers);
        
        // Filter for potential contacts (Sundry Debtors, Sundry Creditors)
        const parties = allLedgers.filter(l => 
          l.Group?.name?.includes('Debtors') || 
          l.Group?.name?.includes('Creditors') ||
          l.Group?.name?.includes('Customer') ||
          l.Group?.name?.includes('Vendor')
        ).map(l => ({ id: l.id, name: l.name, type: 'Party' }));
        
        setContacts(prev => {
          const nonParties = prev.filter(c => c.type !== 'Party');
          return [...nonParties, ...parties];
        });
      });

      companyAPI.getCompanyUsers().then(res => {
        const users = res.data?.users || [];
        const salespersons = users.map(u => ({ id: u.id, name: u.name, type: 'Salesperson' }));
        setContacts(prev => {
          const nonSalespersons = prev.filter(c => c.type !== 'Salesperson');
          return [...nonSalespersons, ...salespersons];
        });
      }).catch(() => {});
    }
  }, [companyId]);

  // Totals
  const totalDebit = useMemo(() => rows.reduce((acc, row) => acc + (parseFloat(row.debit) || 0), 0), [rows]);
  const totalCredit = useMemo(() => rows.reduce((acc, row) => acc + (parseFloat(row.credit) || 0), 0), [rows]);
  const difference = useMemo(() => Math.abs(totalDebit - totalCredit), [totalDebit, totalCredit]);
  const isBalanced = useMemo(() => difference < 0.01 && totalDebit > 0, [difference, totalDebit]);

  const updateRow = useCallback((rowId, field, val) => {
    setRows(prev => prev.map(r => r._id === rowId ? { ...r, [field]: val } : r));
  }, []);

  const removeRow = (rowId) => {
    if (rows.length > 2) {
      setRows(prev => prev.filter(r => r._id !== rowId));
    }
  };

  const addRow = () => setRows(prev => [...prev, newJournalRow()]);

  const handleSave = async (publish = true) => {
    if (!isBalanced) {
      addNotification('Journal must be balanced (Debits = Credits) before saving.', 'warning');
      return;
    }
    
    setSaving(true);
    try {
      const payload = {
        companyId,
        voucherType: 'Journal',
        date: new Date(date).toISOString(),
        narration: notes || 'Manual Journal Entry',
        voucherNumber: `MJ-${journalNumber}`,
        referenceNumber,
        reportingMethod,
        currency,
        entries: rows.filter(r => r.ledgerId && (r.debit > 0 || r.credit > 0)).map(r => ({
          ledgerId: r.ledgerId,
          debit: parseFloat(r.debit) || 0,
          credit: parseFloat(r.credit) || 0,
          description: r.description
        }))
      };

      await voucherAPI.create(payload);
      addNotification(`Journal ${publish ? 'published' : 'saved as draft'} successfully`, 'success');
      if (onSaveSuccess) onSaveSuccess();
      else navigate('/accountant/journals');
    } catch (err) {
      addNotification(err.response?.data?.error || 'Failed to save journal', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen font-sans animate-fade-in pb-40">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-4">
           <button onClick={() => navigate('/accountant/journals')} className="text-slate-400 hover:text-slate-600 transition-colors">
              <ArrowLeft size={20} />
           </button>
           <h1 className="text-xl font-bold text-slate-800">New Journal</h1>
        </div>
        <div className="flex items-center gap-4">
           <button className="text-[12px] font-bold text-blue-600 hover:underline">Choose Template</button>
           <button onClick={() => navigate('/accountant/journals')} className="text-slate-400 hover:text-slate-600">
              <X size={20} />
           </button>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto p-12 space-y-12">
        {/* Form Grid */}
        <div className="grid grid-cols-12 gap-x-12 gap-y-8">
           
           {/* Left Col: Main Info */}
           <div className="col-span-12 lg:col-span-7 space-y-6">
              
              {/* Date */}
              <div className="grid grid-cols-12 items-center gap-4">
                 <label className="col-span-3 text-[13px] font-bold text-slate-500">Date*</label>
                 <div className="col-span-7">
                    <div className="relative">
                       <input 
                         type="date" 
                         value={date} 
                         onChange={e => setDate(e.target.value)}
                         className="w-full px-3 py-2 border border-slate-200 rounded focus:border-blue-400 outline-none text-[13px] bg-white transition-all"
                       />
                       <Calendar size={14} className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
                    </div>
                 </div>
              </div>

              {/* Reverse Journal */}
              <div className="grid grid-cols-12 items-start gap-4">
                 <label className="col-span-3 text-[13px] font-bold text-slate-500 pt-2">Reverse Journal Date</label>
                 <div className="col-span-7 space-y-3">
                    <div className="relative">
                       <input 
                         type="date" 
                         value={reverseJournalDate} 
                         onChange={e => setReverseJournalDate(e.target.value)}
                         className="w-full px-3 py-2 border border-slate-200 rounded focus:border-blue-400 outline-none text-[13px] bg-white transition-all"
                         placeholder="dd/MM/yyyy"
                       />
                       <Calendar size={14} className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer group">
                       <input 
                         type="checkbox" 
                         checked={publishReverseOnly} 
                         onChange={e => setPublishReverseOnly(e.target.checked)}
                         className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                       />
                       <span className="text-[12px] text-slate-600 group-hover:text-slate-800 transition-colors">Publish reverse journal only on the reverse journal date</span>
                       <HelpCircle size={14} className="text-slate-300" />
                    </label>
                 </div>
              </div>

              {/* Journal Number */}
              <div className="grid grid-cols-12 items-center gap-4">
                 <label className="col-span-3 text-[13px] font-bold text-rose-500 underline decoration-dotted">Journal#*</label>
                 <div className="col-span-7">
                    <div className="relative">
                       <input 
                         type="text" 
                         value={journalNumber} 
                         onChange={e => setJournalNumber(e.target.value)}
                         className="w-full px-3 py-2 border border-slate-200 rounded focus:border-blue-400 outline-none text-[13px] bg-white transition-all font-bold text-slate-700"
                       />
                       <Settings size={14} className="absolute right-3 top-2.5 text-blue-500 cursor-pointer" />
                    </div>
                 </div>
              </div>

              {/* Reference */}
              <div className="grid grid-cols-12 items-center gap-4">
                 <label className="col-span-3 text-[13px] font-bold text-slate-500">Reference#</label>
                 <div className="col-span-7">
                    <input 
                      type="text" 
                      value={referenceNumber}
                      onChange={e => setReferenceNumber(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded focus:border-blue-400 outline-none text-[13px] bg-white transition-all"
                    />
                 </div>
              </div>

              {/* Notes */}
              <div className="grid grid-cols-12 items-start gap-4">
                 <label className="col-span-3 text-[13px] font-bold text-rose-500 underline decoration-dotted">Notes*</label>
                 <div className="col-span-9">
                    <textarea 
                      rows="3" 
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Max. 500 characters"
                      className="w-full px-3 py-2 border border-slate-200 rounded focus:border-blue-400 outline-none text-[13px] bg-white transition-all resize-none"
                    />
                 </div>
              </div>

           </div>

           {/* Right Col: Secondary Info */}
           <div className="col-span-12 lg:col-span-5 space-y-6 lg:pl-12">
              
              {/* Reporting Method */}
              <div className="space-y-3 pt-2">
                 <div className="flex items-center gap-1">
                    <label className="text-[13px] font-bold text-slate-500">Reporting Method</label>
                    <HelpCircle size={14} className="text-slate-300 cursor-help" />
                 </div>
                 <div className="flex items-center gap-6">
                    {REPORTING_METHODS.map(method => (
                       <label key={method} className="flex items-center gap-2 cursor-pointer group">
                          <input 
                            type="radio" 
                            name="reportingMethod"
                            checked={reportingMethod === method}
                            onChange={() => setReportingMethod(method)}
                            className="w-4 h-4 border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-[13px] text-slate-600 group-hover:text-slate-900 transition-colors uppercase tracking-tight">{method}</span>
                       </label>
                    ))}
                 </div>
              </div>

              {/* Currency */}
              <div className="space-y-2">
                 <label className="text-[13px] font-bold text-slate-500">Currency</label>
                 <div className="relative">
                    <select 
                      value={currency} 
                      onChange={e => setCurrency(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded focus:border-blue-400 outline-none text-[13px] bg-white transition-all appearance-none pr-10 font-medium"
                    >
                       {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
                 </div>
              </div>

           </div>

        </div>

        {/* Line Items Table */}
        <div className="mt-16 bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
           <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                   <th className="w-10 px-4 py-3"></th>
                   <th className="text-left px-4 py-3 min-w-[250px]">Account</th>
                   <th className="text-left px-4 py-3 min-w-[200px]">Description</th>
                   <th className="text-left px-4 py-3 min-w-[200px]">Contact (INR)</th>
                   <th className="text-right px-4 py-3 w-[150px]">Debits</th>
                   <th className="text-right px-4 py-3 w-[150px]">Credits</th>
                   <th className="w-12 px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row, idx) => (
                  <tr key={row._id} className="group hover:bg-slate-50/30 transition-colors">
                    <td className="px-4 py-4 align-top">
                       <div className="flex flex-col gap-1.5 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal size={14} className="text-slate-300 cursor-grab" />
                       </div>
                    </td>
                    <td className="px-4 py-4 align-top">
                       <div className="space-y-4">
                          <div className="relative">
                             <select 
                               value={row.ledgerId} 
                               onChange={e => updateRow(row._id, 'ledgerId', e.target.value)}
                               className="w-full p-2 border border-slate-200 rounded text-[13px] outline-none focus:border-blue-400 appearance-none bg-white font-medium"
                             >
                                <option value="">Select an account</option>
                                {ledgers.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                             </select>
                             <ChevronDown size={14} className="absolute right-2 top-2.5 text-slate-300 pointer-events-none" />
                          </div>
                          
                          <div className="flex items-center gap-6 mt-2">
                             <button className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-blue-600 transition-colors">
                                <Plus size={12} strokeWidth={3} /> Select a project
                                <ChevronDown size={10} />
                             </button>
                             <button className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-blue-600 transition-colors">
                                <FileText size={12} /> Reporting Tags
                                <ChevronDown size={10} />
                             </button>
                          </div>
                       </div>
                    </td>
                    <td className="px-4 py-4 align-top">
                       <textarea 
                         rows="2"
                         value={row.description}
                         onChange={e => updateRow(row._id, 'description', e.target.value)}
                         className="w-full p-2 border border-slate-200 rounded text-[13px] outline-none focus:border-blue-400 resize-none"
                         placeholder="Description"
                       />
                    </td>
                    <td className="px-4 py-4 align-top">
                       <div className="relative">
                          <select 
                            value={row.contactId}
                            onChange={e => updateRow(row._id, 'contactId', e.target.value)}
                            className="w-full p-2 border border-slate-200 rounded text-[13px] outline-none focus:border-blue-400 appearance-none bg-white"
                          >
                             <option value="">Select Contact</option>
                             {contacts.map(c => (
                               <option key={`${c.type}-${c.id}`} value={c.id}>
                                 {c.name} ({c.type})
                               </option>
                             ))}
                          </select>
                          <ChevronDown size={14} className="absolute right-2 top-2.5 text-slate-300 pointer-events-none" />
                       </div>
                    </td>
                    <td className="px-4 py-4 align-top">
                       <input 
                         type="number" 
                         value={row.debit || ''}
                         onChange={e => updateRow(row._id, 'debit', e.target.value)}
                         className="w-full p-2 border border-slate-200 rounded text-[13px] outline-none focus:border-blue-400 text-right font-bold"
                         placeholder="0.00"
                       />
                    </td>
                    <td className="px-4 py-4 align-top">
                       <input 
                         type="number" 
                         value={row.credit || ''}
                         onChange={e => updateRow(row._id, 'credit', e.target.value)}
                         className="w-full p-2 border border-slate-200 rounded text-[13px] outline-none focus:border-blue-400 text-right font-bold"
                         placeholder="0.00"
                       />
                    </td>
                    <td className="px-4 py-4 align-top text-center">
                       <button onClick={() => removeRow(row._id)} className="text-slate-300 hover:text-rose-500 transition-colors mt-2">
                          <X size={18} />
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
           </table>
           
           <div className="p-4 bg-slate-50/50 border-t border-slate-100">
              <button 
                onClick={addRow}
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded text-[12px] font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
              >
                 <Plus size={14} strokeWidth={3} className="text-blue-600" /> Add New Row
              </button>
           </div>
        </div>

        {/* Totals Section */}
        <div className="flex justify-end pt-8">
           <div className="w-[450px] bg-slate-50/50 rounded-xl p-8 space-y-6">
              <div className="flex justify-between items-center text-[13px] font-medium text-slate-500">
                 <span>Sub Total</span>
                 <div className="flex gap-12">
                   <span>{totalDebit.toFixed(2)}</span>
                   <span>{totalCredit.toFixed(2)}</span>
                 </div>
              </div>
              
              <div className="flex justify-between items-center h-12 border-y border-slate-100 px-2 -mx-2">
                 <span className="text-[14px] font-black text-slate-800 tracking-tight">Total (₹)</span>
                 <div className="flex gap-12 font-black text-slate-900">
                    <span>{totalDebit.toFixed(2)}</span>
                    <span>{totalCredit.toFixed(2)}</span>
                 </div>
              </div>

              {difference > 0 && (
                <div className="flex justify-between items-center text-[13px] font-bold text-rose-500 px-2 -mx-2 animate-fade-in">
                   <span>Difference</span>
                   <span>{difference.toFixed(2)}</span>
                </div>
              )}
           </div>
        </div>

        {/* Attachments */}
        <div className="pt-12 space-y-4">
           <h3 className="text-[14px] font-bold text-slate-700">Attachments</h3>
           <div className="flex items-start gap-4">
              <div className="relative group">
                 <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded text-[12px] font-bold text-slate-600 bg-white group-hover:bg-slate-50 transition-all">
                    <Upload size={14} className="text-slate-400" /> Upload File
                    <ChevronDown size={14} className="text-slate-400" />
                 </button>
              </div>
              <p className="text-[11px] text-slate-400 font-medium pt-2">You can upload a maximum of 5 files, 10MB each</p>
           </div>
        </div>

      </div>

      {/* Fixed Footer Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-6 z-[100] shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
         <div className="max-w-[1400px] mx-auto px-12 flex items-center justify-between">
            <div className="flex items-center gap-4">
               {isBalanced ? (
                 <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full text-[12px] font-bold">
                    <CheckCircle2 size={14} /> Balances are correct
                 </div>
               ) : (
                 <div className="flex items-center gap-2 text-rose-600 bg-rose-50 px-3 py-1.5 rounded-full text-[12px] font-bold">
                    <AlertCircle size={14} /> Debits and Credits must balance
                 </div>
               )}
            </div>
            
            <div className="flex items-center gap-4">
               <button 
                 onClick={() => handleSave(false)}
                 disabled={saving || !isBalanced}
                 className="px-6 py-2.5 bg-slate-900 text-white rounded font-bold text-[13px] hover:bg-slate-800 transition-all disabled:opacity-50"
               >
                  Save as Draft
               </button>
               <button 
                 onClick={() => handleSave(true)}
                 disabled={saving || !isBalanced}
                 className="px-8 py-2.5 bg-blue-600 text-white rounded font-bold text-[13px] hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all disabled:opacity-50"
               >
                  {saving ? 'Processing...' : 'Save and Publish'}
               </button>
               <button 
                 onClick={() => navigate('/accountant/journals')}
                 className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded font-bold text-[13px] hover:bg-slate-50 transition-all"
               >
                  Cancel
               </button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default ManualJournalEntryView;
