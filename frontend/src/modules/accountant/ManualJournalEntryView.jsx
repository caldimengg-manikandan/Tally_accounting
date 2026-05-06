import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, X, Plus, Info, Upload, ChevronDown, 
  HelpCircle, Settings, Save, FileText, Calendar,
  MoreHorizontal, Trash2, CheckCircle2, AlertCircle,
  Clock, Link as LinkIcon, Search, Check
} from 'lucide-react';
import { ledgerAPI, voucherAPI, accountingAPI, companyAPI } from '../../services/api';
import useNotificationStore from '../../store/notificationStore';

const REPORTING_METHODS = ['Accrual and Cash', 'Accrual Only', 'Cash Only'];
const CURRENCIES = [
  'AED - UAE Dirham',
  'AUD - Australian Dollar',
  'BND - Brunei Dollar',
  'CAD - Canadian Dollar',
  'CNY - Yuan Renminbi',
  'EUR - Euro',
  'GBP - Pound Sterling',
  'INR - Indian Rupee',
  'JPY - Japanese Yen',
  'SAR - Saudi Riyal',
  'USD - United States Dollar',
  'ZAR - South African Rand'
];

const ACCOUNT_GROUPS = [
  { group: 'Other Current Asset', accounts: ['Advance Tax', 'Employee Advance', 'Prepaid Expenses', 'TDS Receivable'] },
  { group: 'Other Current Liability', accounts: ['Employee Reimbursements', 'Opening Balance Adjustments', 'Tax Payable', 'TDS Payable', 'Unearned Revenue'] },
  { group: 'Non Current Liability', accounts: ['Construction Loans', 'Mortgages'] },
  { group: 'Other Liability', accounts: ['Dimension Adjustments'] },
  { group: 'Equity', accounts: ['Capital Stock', 'Distributions', 'Dividends Paid', 'Drawings', 'Investments', 'Opening Balance Offset', "Owner's Equity"] },
  { group: 'Income', accounts: ['Discount', 'General Income', 'Interest Income', 'Late Fee Income', 'Other Charges', 'Sales', 'Shipping Charge'] },
  { group: 'Expense', accounts: ['Advertising And Marketing', 'Automobile Expense', 'Bad Debt', 'Bank Fees and Charges', 'Consultant Expense', 'Contract Assets', 'Credit Card Charges', 'Depreciation And Amortisation', 'Depreciation Expense', 'IT and Internet Expenses', 'Janitorial Expense', 'Lodging', 'Meals and Entertainment', 'Merchandise', 'Office Supplies', 'Other Expenses', 'Postage', 'Printing and Stationery', 'Purchase Discounts', 'Raw Materials And Consumables', 'Rent Expense', 'Repairs and Maintenance', 'Salaries and Employee Wages', 'Telephone Expense', 'Transportation Expense', 'Travel Expense', 'Uncategorized'] },
  { group: 'Cost Of Goods Sold', accounts: ['Cost of Goods Sold', 'Job Costing', 'Labor', 'Materials', 'Subcontractor'] },
  { group: 'Other Expense', accounts: ['Exchange Gain or Loss'] }
];

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
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
  const [currencySearchQuery, setCurrencySearchQuery] = useState('');
  
  const [isJournalSettingsOpen, setIsJournalSettingsOpen] = useState(false);
  const [journalPrefix, setJournalPrefix] = useState('');
  const [journalNextNumber, setJournalNextNumber] = useState('1');
  const [journalRestartNumbering, setJournalRestartNumbering] = useState(false);
  const [journalNumberingType, setJournalNumberingType] = useState('auto');
  const [isPrefixDropdownOpen, setIsPrefixDropdownOpen] = useState(false);
  
  const [rows, setRows] = useState([newJournalRow(), newJournalRow()]);
  const [activeTooltipIdx, setActiveTooltipIdx] = useState(null);
  
  const [ledgers, setLedgers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [attachments, setAttachments] = useState([]);
  
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

  const handleFileChange = (e) => {
    if (e.target.files) {
       const newFiles = Array.from(e.target.files);
       if (attachments.length + newFiles.length > 5) {
         addNotification('Maximum 5 files allowed.', 'error');
         return;
       }
       const oversized = newFiles.some(f => f.size > 10 * 1024 * 1024);
       if (oversized) {
         addNotification('Each file must be less than 10MB.', 'error');
         return;
       }
       setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  const removeAttachment = (index) => {
     setAttachments(prev => prev.filter((_, i) => i !== index));
  };

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
    <>
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
        <div className="max-w-4xl space-y-6">
           
           {/* Date */}
           <div className="grid grid-cols-12 items-center gap-4">
              <label className="col-span-3 text-[13px] font-bold text-slate-600">Date<span className="text-red-500">*</span></label>
              <div className="col-span-5">
                 <div className="relative">
                    <input 
                      type="date" 
                      value={date} 
                      onChange={e => setDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded focus:border-blue-400 outline-none text-[13px] bg-white transition-all"
                    />
                 </div>
              </div>
           </div>

           {/* Reverse Journal */}
           <div className="grid grid-cols-12 items-start gap-4">
              <label className="col-span-3 text-[13px] font-bold text-slate-600 pt-2">Reverse Journal Date</label>
              <div className="col-span-5 space-y-3">
                 <div className="relative">
                    <input 
                      type="date" 
                      value={reverseJournalDate} 
                      onChange={e => setReverseJournalDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded focus:border-blue-400 outline-none text-[13px] bg-white transition-all"
                      placeholder="dd/MM/yyyy"
                    />
                 </div>
                 <label className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={publishReverseOnly} 
                      onChange={e => setPublishReverseOnly(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-[12px] text-slate-600 group-hover:text-slate-800 transition-colors">Publish reverse journal only on the reverse journal date</span>
                    <HelpCircle size={14} className="text-slate-400" />
                 </label>
              </div>
           </div>

           {/* Journal Number */}
           <div className="grid grid-cols-12 items-center gap-4">
              <label className="col-span-3 text-[13px] font-bold text-slate-600">Journal#<span className="text-red-500">*</span></label>
              <div className="col-span-5">
                 <div className="relative">
                    <input 
                      type="text" 
                      value={journalNumber} 
                      readOnly
                      className="w-full px-3 py-2 border border-slate-200 rounded outline-none text-[13px] bg-slate-50 transition-all font-bold text-slate-500 cursor-not-allowed"
                    />
                    <button 
                      onClick={() => setIsJournalSettingsOpen(true)}
                      className="absolute right-3 top-2.5 text-blue-500 hover:text-blue-700 transition-colors"
                    >
                      <Settings size={14} />
                    </button>
                 </div>
              </div>
           </div>

           {/* Reference */}
           <div className="grid grid-cols-12 items-center gap-4">
              <label className="col-span-3 text-[13px] font-bold text-slate-600">Reference#</label>
              <div className="col-span-5">
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
              <label className="col-span-3 text-[13px] font-bold text-slate-600 pt-2">Notes<span className="text-red-500">*</span></label>
              <div className="col-span-6">
                 <textarea 
                   rows="3" 
                   value={notes}
                   onChange={e => setNotes(e.target.value)}
                   placeholder="Max. 500 characters"
                   className="w-full px-3 py-2 border border-slate-200 rounded focus:border-blue-400 outline-none text-[13px] bg-white transition-all resize-none"
                 />
              </div>
           </div>

           {/* Reporting Method */}
           <div className="grid grid-cols-12 items-center gap-4">
              <div className="col-span-3 flex items-center gap-1">
                 <label className="text-[13px] font-bold text-slate-600">Reporting Method</label>
                 <HelpCircle size={14} className="text-slate-400 cursor-help" />
              </div>
              <div className="col-span-9 flex items-center gap-6">
                 {REPORTING_METHODS.map(method => (
                    <label key={method} className="flex items-center gap-2 cursor-pointer group">
                       <input 
                         type="radio" 
                         name="reportingMethod"
                         checked={reportingMethod === method}
                         onChange={() => setReportingMethod(method)}
                         className="w-4 h-4 border-slate-300 text-blue-600 focus:ring-blue-500"
                       />
                       <span className="text-[13px] text-slate-600 group-hover:text-slate-900 transition-colors">{method}</span>
                    </label>
                 ))}
              </div>
           </div>

           {/* Currency */}
           <div className="grid grid-cols-12 items-center gap-4">
              <label className="col-span-3 text-[13px] font-bold text-slate-600">Currency</label>
              <div className="col-span-5 relative">
                 <div 
                   onClick={() => { setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen); setCurrencySearchQuery(''); }}
                   className="w-full px-3 py-2 border border-slate-200 rounded flex items-center justify-between cursor-pointer bg-white hover:border-slate-300 transition-all"
                 >
                    <span className="text-[13px] text-slate-700">{currency}</span>
                    <ChevronDown size={14} className="text-slate-400" />
                 </div>

                 {isCurrencyDropdownOpen && (
                   <>
                     <div 
                       className="fixed inset-0 z-40" 
                       onClick={() => setIsCurrencyDropdownOpen(false)} 
                     />
                     <div className="absolute top-full left-0 mt-1 w-full bg-white border border-blue-400 rounded shadow-xl z-50 overflow-hidden flex flex-col">
                        <div className="p-2 border-b border-slate-100 bg-white">
                           <div className="relative">
                              <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                              <input 
                                type="text"
                                autoFocus
                                value={currencySearchQuery}
                                onChange={(e) => setCurrencySearchQuery(e.target.value)}
                                placeholder="Search"
                                className="w-full pl-8 pr-3 py-2 border border-blue-400 rounded text-[13px] outline-none text-slate-700"
                              />
                           </div>
                        </div>
                        <div className="max-h-56 overflow-y-auto py-1">
                           {CURRENCIES.filter(c => c.toLowerCase().includes(currencySearchQuery.toLowerCase())).map(c => (
                             <div 
                               key={c}
                               onClick={() => { setCurrency(c); setIsCurrencyDropdownOpen(false); }}
                               className={`px-4 py-2.5 text-[13px] cursor-pointer flex items-center justify-between
                                 ${currency === c ? 'bg-blue-500 text-white font-medium' : 'text-slate-700 hover:bg-slate-50'}`}
                             >
                               <span>{c}</span>
                               {currency === c && <Check size={14} className="text-white" />}
                             </div>
                           ))}
                           {CURRENCIES.filter(c => c.toLowerCase().includes(currencySearchQuery.toLowerCase())).length === 0 && (
                             <div className="px-3 py-4 text-center text-slate-400 text-[13px]">
                               No currencies found
                             </div>
                           )}
                        </div>
                     </div>
                   </>
                 )}
              </div>
           </div>

        </div>

        {/* Line Items Table */}
        <div className="mt-16 bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
           <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
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
                       <div className="space-y-4">
                          <div className="relative">
                             <select 
                               value={row.ledgerId} 
                               onChange={e => updateRow(row._id, 'ledgerId', e.target.value)}
                               className="w-full px-3 py-2 border border-slate-200 rounded text-[13px] outline-none focus:border-blue-400 appearance-none bg-white font-medium h-[38px]"
                             >
                                <option value="">Select an account</option>
                                {ACCOUNT_GROUPS.map(g => (
                                  <optgroup key={g.group} label={g.group}>
                                    {g.accounts.map(acc => (
                                      <option key={acc} value={acc}>{acc}</option>
                                    ))}
                                  </optgroup>
                                ))}
                             </select>
                             <ChevronDown size={14} className="absolute right-2 top-3 text-slate-300 pointer-events-none" />
                          </div>
                          
                          {activeTooltipIdx !== idx && (
                            <div className="flex items-center gap-6 mt-2 animate-fade-in">
                               <button className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-blue-600 transition-colors">
                                  <Plus size={12} strokeWidth={3} /> Select a project
                                  <ChevronDown size={10} />
                               </button>
                               <div className="relative flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-blue-600 transition-colors group">
                                  <FileText size={12} />
                                  <select 
                                    value={row.tags?.[0] || ''}
                                    onChange={e => updateRow(row._id, 'tags', e.target.value ? [e.target.value] : [])}
                                    className="bg-transparent outline-none cursor-pointer appearance-none pr-3 text-slate-400 group-hover:text-blue-600 font-bold"
                                  >
                                    <option value="">Reporting Tags</option>
                                    {ACCOUNT_GROUPS.map(g => (
                                      <optgroup key={g.group} label={g.group}>
                                        {g.accounts.map(acc => (
                                          <option key={acc} value={acc}>{acc}</option>
                                        ))}
                                      </optgroup>
                                    ))}
                                  </select>
                                  <ChevronDown size={10} className="absolute right-0 pointer-events-none" />
                               </div>
                            </div>
                          )}
                       </div>
                    </td>
                    <td className="px-4 py-4 align-top">
                       <input 
                         type="text"
                         value={row.description}
                         onChange={e => updateRow(row._id, 'description', e.target.value)}
                         className="w-full px-3 py-2 border border-slate-200 rounded text-[13px] outline-none focus:border-blue-400 h-[38px]"
                         placeholder="Description"
                       />
                    </td>
                    <td className="px-4 py-4 align-top">
                       <div className="relative">
                          <select 
                            value={row.contactId}
                            onChange={e => updateRow(row._id, 'contactId', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded text-[13px] outline-none focus:border-blue-400 appearance-none bg-white h-[38px]"
                          >
                             <option value="">Select Contact</option>
                             {contacts.map(c => (
                               <option key={`${c.type}-${c.id}`} value={c.id}>
                                 {c.name} ({c.type})
                                 </option>
                             ))}
                          </select>
                          <ChevronDown size={14} className="absolute right-2 top-3 text-slate-300 pointer-events-none" />
                       </div>
                    </td>
                    <td className="px-4 py-4 align-top">
                       <input 
                         type="number" 
                         value={row.debit || ''}
                         onChange={e => updateRow(row._id, 'debit', e.target.value)}
                         className="w-full px-3 py-2 border border-slate-200 rounded text-[13px] outline-none focus:border-blue-400 text-right font-bold h-[38px]"
                         placeholder="0.00"
                       />
                    </td>
                    <td className="px-4 py-4 align-top">
                       <input 
                         type="number" 
                         value={row.credit || ''}
                         onChange={e => updateRow(row._id, 'credit', e.target.value)}
                         className="w-full px-3 py-2 border border-slate-200 rounded text-[13px] outline-none focus:border-blue-400 text-right font-bold h-[38px]"
                         placeholder="0.00"
                       />
                    </td>
                    <td className="px-4 py-4 align-top">
                       <div className="flex items-center gap-2 mt-2 relative">
                          <button 
                            onClick={() => setActiveTooltipIdx(activeTooltipIdx === idx ? null : idx)}
                            className={`w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center transition-colors
                              ${activeTooltipIdx === idx ? 'bg-blue-50 border-blue-200 text-blue-600' : 'text-slate-400 hover:bg-slate-50'}`}
                          >
                             <MoreHorizontal size={14} />
                          </button>
                          
                          {activeTooltipIdx === idx && (
                            <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 z-[100] animate-fade-in">
                              <div className="bg-slate-800 text-white text-[11px] py-2 px-3 rounded shadow-xl whitespace-nowrap relative">
                                Click to add additional information for this entry.
                                {/* Triangle Arrow */}
                                <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-800 rotate-45" />
                              </div>
                            </div>
                          )}

                          <button onClick={() => removeRow(row._id)} className="w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-slate-50 transition-colors">
                             <X size={14} />
                          </button>
                       </div>
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
           <div className="w-[500px] bg-[#FAFAFA] rounded-xl p-8 space-y-5">
              
              {/* Sub Total */}
              <div className="flex items-center text-[13px] text-slate-800">
                 <div className="flex-1">Sub Total</div>
                 <div className="w-[120px] text-right">{totalDebit.toFixed(2)}</div>
                 <div className="w-[120px] text-right">{totalCredit.toFixed(2)}</div>
              </div>
              
              {/* Total */}
              <div className="flex items-center text-[15px] font-bold text-slate-900 mt-2">
                 <div className="flex-1">Total (₹)</div>
                 <div className="w-[120px] text-right">{totalDebit.toFixed(2)}</div>
                 <div className="w-[120px] text-right">{totalCredit.toFixed(2)}</div>
              </div>

              {/* Difference */}
              <div className="flex items-center text-[13px] text-rose-500 animate-fade-in mt-1">
                 <div className="flex-1">Difference</div>
                 <div className="w-[120px] text-right">
                    {totalCredit > totalDebit ? difference.toFixed(2) : ''}
                 </div>
                 <div className="w-[120px] text-right">
                    {totalDebit >= totalCredit ? difference.toFixed(2) : ''}
                 </div>
              </div>

           </div>
        </div>

        {/* Attachments */}
        <div className="pt-12 space-y-4">
           <h3 className="text-[14px] font-bold text-slate-700">Attachments</h3>
           <div className="flex items-start gap-4">
              <div className="relative group">
                 <input 
                   type="file" 
                   multiple 
                   id="file-upload" 
                   className="hidden" 
                   onChange={handleFileChange} 
                   accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                 />
                 <label htmlFor="file-upload" className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded text-[12px] font-bold text-slate-600 bg-white group-hover:bg-slate-50 transition-all cursor-pointer">
                    <Upload size={14} className="text-slate-400" /> Upload File
                    <ChevronDown size={14} className="text-slate-400" />
                 </label>
              </div>
              <p className="text-[11px] text-slate-400 font-medium pt-2">You can upload a maximum of 5 files, 10MB each</p>
           </div>
           
           {attachments.length > 0 && (
             <div className="flex flex-col gap-2 mt-4 max-w-md">
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded text-[12px] text-slate-700 animate-fade-in">
                     <div className="flex items-center gap-3 overflow-hidden">
                        <FileText size={14} className="text-blue-500 shrink-0" />
                        <span className="truncate font-medium">{file.name}</span>
                        <span className="text-slate-400 shrink-0">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                     </div>
                     <button onClick={() => removeAttachment(index)} className="text-slate-400 hover:text-rose-500 p-1 transition-colors">
                        <X size={14} />
                     </button>
                  </div>
                ))}
             </div>
           )}
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
                 onClick={() => handleSave(true)}
                 disabled={saving || !isBalanced}
                 className="px-6 py-2 bg-blue-600 text-white rounded font-bold text-[13px] hover:bg-blue-700 transition-all disabled:opacity-50"
               >
                  {saving ? 'Processing...' : 'Save and Publish'}
               </button>
               <button 
                 onClick={() => handleSave(false)}
                 disabled={saving || !isBalanced}
                 className="px-6 py-2 bg-white border border-slate-200 text-slate-700 rounded font-bold text-[13px] hover:bg-slate-50 transition-all disabled:opacity-50"
               >
                  Save as Draft
               </button>
               <button 
                 onClick={() => navigate('/accountant/journals')}
                 className="px-6 py-2 bg-white border border-slate-200 text-slate-700 rounded font-bold text-[13px] hover:bg-slate-50 transition-all"
               >
                  Cancel
               </button>
            </div>
         </div>
      </div>
      </div>
      
      {isJournalSettingsOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] animate-fade-in" 
            onClick={() => setIsJournalSettingsOpen(false)}
          ></div>
          
          <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-[650px] animate-slide-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 rounded-t-lg bg-white">
              <h2 className="text-[16px] font-bold text-slate-800">Configure Journal Number Preferences</h2>
              <button 
                onClick={() => setIsJournalSettingsOpen(false)}
                className="text-slate-400 hover:text-rose-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8 space-y-8">
              <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                  <LinkIcon size={18} className="text-slate-500" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-[13px] text-slate-600 leading-relaxed">
                    Configure multiple transaction number series to auto-generate transaction numbers with unique prefixes according to your business needs.
                  </p>
                </div>
                <button className="text-[13px] font-bold text-blue-600 hover:underline flex items-center gap-1">
                  Configure <span className="text-[15px]">&rarr;</span>
                </button>
              </div>
              
              <div className="space-y-6">
                <p className="text-[14px] text-slate-700">
                  Auto-generating journal numbers can save your time. Would you like to change your current setting?
                </p>
                
                <div className="space-y-6">
                  <div className="space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer group w-fit">
                      <input 
                        type="radio" 
                        name="numberingType"
                        checked={journalNumberingType === 'auto'}
                        onChange={() => setJournalNumberingType('auto')}
                        className="w-4 h-4 border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-[14px] font-bold text-slate-700 group-hover:text-blue-600 transition-colors">
                        Auto-generate journal numbers
                      </span>
                      <Info size={14} className="text-slate-400" />
                    </label>
                    
                    {journalNumberingType === 'auto' && (
                      <>
                        <div className="ml-7 grid grid-cols-2 gap-6 animate-fade-in">
                          <div className="space-y-2">
                            <label className="text-[13px] text-slate-500">Prefix</label>
                            <div className="relative">
                              <input 
                                type="text"
                                value={journalPrefix}
                                onChange={(e) => setJournalPrefix(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded focus:border-blue-400 outline-none text-[13px] pr-8"
                              />
                              <button 
                                onClick={() => setIsPrefixDropdownOpen(!isPrefixDropdownOpen)}
                                className="absolute right-2.5 top-2.5 text-blue-500 hover:text-blue-700 transition-colors z-[230]"
                              >
                                <Plus size={14} strokeWidth={3} />
                              </button>
                              
                              {isPrefixDropdownOpen && (
                                <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-xl z-[220] py-2 animate-zoom-in min-w-[180px]">
                                  <div className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">
                                    Placeholder
                                  </div>
                                  {[
                                    'Fiscal Year Start',
                                    'Fiscal Year End',
                                    'Transaction Year',
                                    'Transaction Date',
                                    'Transaction Month'
                                  ].map((option) => (
                                    <div 
                                      key={option}
                                      onClick={() => {
                                        setJournalPrefix(prev => prev + `{${option.replace(/\s+/g, '')}}`);
                                        setIsPrefixDropdownOpen(false);
                                      }}
                                      className="px-4 py-2.5 text-[13px] text-slate-700 hover:bg-blue-600 hover:text-white cursor-pointer transition-colors"
                                    >
                                      {option}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[13px] text-slate-500">Journal Number</label>
                            <input 
                              type="text"
                              value={journalNextNumber}
                              onChange={(e) => setJournalNextNumber(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-200 rounded focus:border-blue-400 outline-none text-[13px]"
                            />
                          </div>
                        </div>
                        
                        <div className="ml-7 mt-4">
                          <label className="flex items-center gap-2 cursor-pointer group w-fit">
                            <input 
                              type="checkbox"
                              checked={journalRestartNumbering}
                              onChange={(e) => setJournalRestartNumbering(e.target.checked)}
                              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-[13px] text-slate-600 group-hover:text-slate-900 transition-colors">
                              Restart numbering for journals at the start of each fiscal year.
                            </span>
                          </label>
                        </div>
                      </>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer group w-fit">
                      <input 
                        type="radio" 
                        name="numberingType"
                        checked={journalNumberingType === 'manual'}
                        onChange={() => setJournalNumberingType('manual')}
                        className="w-4 h-4 border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-[14px] font-bold text-slate-700 group-hover:text-blue-600 transition-colors">
                        Add journal number manually for this journal
                      </span>
                    </label>

                    {journalNumberingType === 'manual' && (
                      <div className="ml-7 grid grid-cols-12 gap-4 animate-fade-in pr-12">
                        <div className="col-span-3 space-y-1.5">
                          <label className="text-[13px] text-slate-500 font-medium">Prefix</label>
                          <input 
                            type="text"
                            value={journalPrefix}
                            onChange={(e) => setJournalPrefix(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded focus:border-blue-400 outline-none text-[13px] transition-all"
                          />
                        </div>
                        <div className="col-span-9 space-y-1.5">
                          <label className="text-[13px] text-slate-500 font-medium">Journal Number</label>
                          <input 
                            type="text"
                            value={journalNextNumber}
                            onChange={(e) => setJournalNextNumber(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded focus:border-blue-400 outline-none text-[13px] transition-all"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-5 bg-slate-50/50 border-t border-slate-100 flex items-center gap-3 rounded-b-lg">
              <button 
                onClick={() => {
                  setJournalNumber(`1${journalPrefix}${journalNextNumber}`);
                  setIsJournalSettingsOpen(false);
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded font-bold text-[13px] hover:bg-blue-700 transition-all shadow-sm"
              >
                Save
              </button>
              <button 
                onClick={() => setIsJournalSettingsOpen(false)}
                className="px-6 py-2 bg-white border border-slate-200 text-slate-700 rounded font-bold text-[13px] hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ManualJournalEntryView;
