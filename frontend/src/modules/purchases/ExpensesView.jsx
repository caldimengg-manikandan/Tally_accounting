import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Wallet, RefreshCw, FileText, 
  ChevronDown, ArrowDownUp, Filter, MoreHorizontal,
  Play, CheckCircle2, LayoutList, MapPin, RotateCcw,
  User, Receipt, MousePointer2, ArrowRight, Check,
  ShoppingCart, BarChart3, Globe, Zap, ShieldCheck,
  CreditCard, Edit2, Printer, X
} from 'lucide-react';
import { purchaseAPI, voucherAPI, inventoryAPI } from '../../services/api';
import MileagePreferencesModal from './MileagePreferencesModal';

const ExpensesView = ({ companyId, initialTab = 'All Expenses' }) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab ] = useState(initialTab);
  const [showMileageModal, setShowMileageModal] = useState(false);
  const [selectedExpenseId, setSelectedExpenseId] = useState(null);
  const [expenseDetails, setExpenseDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!selectedExpenseId) {
      setExpenseDetails(null);
      return;
    }
    const fetchDetails = async () => {
      setLoadingDetails(true);
      try {
        const res = await voucherAPI.getById(selectedExpenseId);
        setExpenseDetails(res.data);
      } catch (e) {
        console.error("Failed to load details", e);
      } finally {
        setLoadingDetails(false);
      }
    };
    fetchDetails();
  }, [selectedExpenseId]);

  // Sync activeTab with initialTab prop when navigating via sidebar
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (!companyId) return;
    const fetchExpenses = async () => {
      try {
        setLoading(true);
        const res = await purchaseAPI.getExpenses(companyId);
        setExpenses(res.data || []);
      } catch (err) {
        console.error("Failed to fetch expenses:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchExpenses();
  }, [companyId]);

  if (loading) return (
    <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
      <RefreshCw size={24} className="animate-spin text-[#1e61f0] mb-4" />
      <p className="text-slate-500 text-[14px]">Loading Expenses...</p>
    </div>
  );

  return (
    <>
    <div className="bg-white min-h-screen flex flex-col">
       {/* Tabbed Header */}
        <div className="flex items-center justify-between px-8 py-0 border-b border-slate-200 bg-white">
           <div className="flex items-center h-14">
              <button 
                onClick={() => setActiveTab('Receipts Inbox')}
                className={`text-[13px] font-semibold px-4 h-full transition-all border-b-2 ${activeTab === 'Receipts Inbox' ? 'text-blue-600 border-blue-600' : 'text-slate-600 border-transparent hover:text-slate-900'}`}
              >
                 Receipts Inbox
              </button>
              <button 
                onClick={() => setActiveTab('All Expenses')}
                className={`text-[13px] font-semibold px-4 h-full flex items-center gap-1.5 transition-all border-b-2 ${activeTab === 'All Expenses' ? 'text-blue-600 border-blue-600' : 'text-slate-600 border-transparent hover:text-slate-900'}`}
              >
                 All Expenses <ChevronDown size={14} className="mt-0.5" />
              </button>
           </div>
           <div className="flex items-center gap-2">

               <div className="flex items-center">
                  <button 
                     onClick={() => {
                        window.location.href = '/expenses/new';
                     }} 
                     className="bg-[#1e61f0] hover:bg-[#1a54d1] text-white px-3 py-1.5 rounded text-[13px] font-bold flex items-center gap-1.5 transition-all shadow-sm"
                  >
                     <Plus size={16} strokeWidth={3}/> New
                  </button>
               </div>
            </div>
        </div>

        <div className="flex-1 overflow-auto">
          {expenses.length > 0 ? (
              <div className="flex bg-white h-[calc(100vh-140px)] relative overflow-hidden text-left border-t border-slate-100">
                {/* LIST PANE */}
                <div className={`transition-all duration-300 ease-in-out border-r border-slate-200 overflow-y-auto ${selectedExpenseId ? 'w-[380px] shrink-0' : 'w-full'}`}>
                  <table className="w-full text-left">
                     <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                        <tr>
                           <th className="px-6 py-4">Date</th>
                           <th className="px-6 py-4">Expense Account</th>
                           {!selectedExpenseId && <th className="px-6 py-4">Reference#</th>}
                           {!selectedExpenseId && <th className="px-6 py-4">Vendor Name</th>}
                           {!selectedExpenseId && <th className="px-6 py-4">Paid Through</th>}
                           {!selectedExpenseId && <th className="px-6 py-4">Customer Name</th>}
                           {!selectedExpenseId && <th className="px-6 py-4">Status</th>}
                           <th className="px-6 py-4 text-right">Amount</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {expenses.map(exp => (
                          <tr 
                            key={exp.id} 
                            onClick={(e) => {
                                // If they clicked the Ledger explicitly, let it navigate instead of splitting
                                if (e.target.tagName.toLowerCase() !== 'span') {
                                    setSelectedExpenseId(exp.id);
                                }
                            }}
                            className={`transition-colors cursor-pointer group ${selectedExpenseId === exp.id ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}
                          >
                             <td className="px-6 py-4 text-[14px] text-slate-600 whitespace-nowrap">{new Date(exp.date).toLocaleDateString('en-IN', {day:'2-digit', month:'2-digit', year:'numeric'})}</td>
                             <td className="px-6 py-4 text-[14px] font-medium text-slate-900 truncate max-w-[200px]">
                                {exp.Ledger ? (
                                   <span 
                                      className="text-[#1e61f0] hover:underline cursor-pointer"
                                      onClick={() => navigate(`/ledger-statement/${exp.Ledger.id}`)}
                                   >
                                      {exp.Ledger.name}
                                   </span>
                                ) : (
                                   'General Expense'
                                )}
                             </td>
                             {!selectedExpenseId && <td className="px-6 py-4 text-[14px] text-slate-600">{exp.voucherNumber}</td>}
                             {!selectedExpenseId && <td className="px-6 py-4 text-[14px] text-slate-600 truncate max-w-[150px]">{exp.vendorName || '-'}</td>}
                             {!selectedExpenseId && <td className="px-6 py-4 text-[14px] text-slate-600">{exp.paidThrough || '-'}</td>}
                             {!selectedExpenseId && <td className="px-6 py-4 text-[14px] text-slate-600 truncate max-w-[150px]">{exp.customerName || '-'}</td>}
                             {!selectedExpenseId && (
                               <td className="px-6 py-4 text-[14px]">
                                  <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-600 text-[11px] font-bold uppercase">Paid</span>
                               </td>
                             )}
                             <td className="px-6 py-4 text-right text-[14px] font-bold text-slate-900 whitespace-nowrap">₹ {parseFloat(exp.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          </tr>
                        ))}
                     </tbody>
                  </table>
                </div>
                
                {/* DETAIL PANE */}
                {selectedExpenseId && (
                  <div className="flex-1 overflow-hidden">
                     <ExpenseDetailPane 
                        details={expenseDetails} 
                        loading={loadingDetails} 
                        onClose={() => setSelectedExpenseId(null)} 
                        onUploadSuccess={async () => {
                          try {
                            const res = await voucherAPI.getById(selectedExpenseId);
                            setExpenseDetails(res.data);
                          } catch(e) { console.error(e); }
                        }}
                     />
                  </div>
                )}
              </div>
          ) : (
             <div className="flex-1 flex flex-col items-center bg-white overflow-y-auto w-full">
                <div className="w-full max-w-[1000px] mt-12 mb-16 px-8">
                   <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xl shadow-slate-200/50">
                      {/* Red Title Box */}
                      <div className="p-1 items-center justify-center flex">
                        <div className="w-full bg-[#c53030] rounded-xl py-6 flex flex-col items-center justify-center border-4 border-[#e53e3e]/20 shadow-inner">
                           <h3 className="text-white text-[48px] font-black tracking-[4px] border-b-4 border-white pb-1 italic leading-none">EXPENSES</h3>
                        </div>
                      </div>

                      <div className="p-8 space-y-8">
                         {/* Definition Box */}
                         <div className="p-6 bg-white border-2 border-slate-100 rounded-xl relative group hover:border-[#c53030]/20 transition-colors">
                            <p className="text-[18px] text-slate-800 leading-relaxed font-serif italic text-center">
                               <span className="font-black text-[22px] not-italic font-sans mr-2">Expenses</span> 
                               can be defined as "Any cost that a company bears in an attempt to maximize its revenues, and thereby its profits".
                            </p>
                            <div className="absolute -top-3 -left-3 w-6 h-6 border-l-2 border-t-2 border-slate-200"></div>
                            <div className="absolute -bottom-3 -right-3 w-6 h-6 border-r-2 border-b-2 border-slate-200"></div>
                         </div>

                         {/* Two Column Section */}
                         <div className="grid grid-cols-2 gap-8 pt-4">
                            {/* Types of Expenses */}
                            <div className="space-y-6">
                               <div className="bg-[#fed7d7] rounded-full py-2 px-10 border-2 border-[#f56565] inline-block shadow-sm">
                                  <h4 className="text-[#c53030] font-black text-[16px] italic uppercase tracking-wider">Types of Expenses</h4>
                               </div>
                               
                               <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-5">
                                  <div className="flex gap-4">
                                     <div className="w-6 h-6 shrink-0 bg-[#c53030] rounded-sm flex items-center justify-center text-white text-[12px] transform rotate-45 mt-1">
                                        <div className="-rotate-45 font-black">&gt;</div>
                                     </div>
                                     <div>
                                        <h5 className="font-black text-slate-900 text-[15px]">Cost of Goods sold (COGS) -</h5>
                                        <p className="text-slate-600 text-[14px] mt-1 italic">Expenses directly related to generating sales revenues</p>
                                     </div>
                                  </div>

                                  <div className="flex gap-4">
                                     <div className="w-6 h-6 shrink-0 bg-[#c53030] rounded-sm flex items-center justify-center text-white text-[12px] transform rotate-45 mt-1">
                                        <div className="-rotate-45 font-black">&gt;</div>
                                     </div>
                                     <div>
                                        <h5 className="font-black text-slate-900 text-[15px]">Indirect Expenses –</h5>
                                        <p className="text-slate-600 text-[14px] mt-1 italic">These are the operating expenses</p>
                                     </div>
                                  </div>

                                  <div className="flex gap-4">
                                     <div className="w-6 h-6 shrink-0 bg-[#c53030] rounded-sm flex items-center justify-center text-white text-[12px] transform rotate-45 mt-1">
                                        <div className="-rotate-45 font-black">&gt;</div>
                                     </div>
                                     <div>
                                        <h5 className="font-black text-slate-900 text-[15px]">Non Operating Expenses -</h5>
                                        <p className="text-slate-600 text-[14px] mt-1 italic">those expenses which are not related to "revenue generation for the core business activity"</p>
                                     </div>
                                  </div>
                               </div>
                            </div>

                            {/* P&L Section */}
                            <div className="space-y-6">
                               <div className="bg-[#fed7d7] rounded-full py-2 px-10 border-2 border-[#f56565] inline-block shadow-sm">
                                  <h4 className="text-[#c53030] font-black text-[16px] italic uppercase tracking-wider">Expenses in P&L A/C</h4>
                               </div>

                               <div className="bg-white p-6 rounded-2xl border-2 border-[#fed7d7] grid grid-cols-2 gap-x-12 gap-y-3">
                                  {[
                                     "Salaries", "Bad Debt Loss",
                                     "Raw Material", "Interest",
                                     "Electricity Bills", "Tax Expenses",
                                     "Depreciation", "Other Misc Exp.",
                                     "Advertisement", "",
                                     "Insurance", "",
                                     "Fuel Expenses", "",
                                     "License Cost", ""
                                  ].map((item, i) => item ? (
                                     <div key={i} className="flex items-center gap-3 group">
                                        <div className="shrink-0 text-[#c53030] font-bold text-[18px] transition-transform group-hover:translate-x-1">➤</div>
                                        <span className="text-slate-700 text-[14px] font-medium italic">{item}</span>
                                     </div>
                                  ) : <div key={i}></div>)}
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Footer Action Buttons moved to bottom */}
                <div className="flex flex-col items-center text-center pb-32">
                   <button onClick={() => window.location.href = '/expenses/new'} className="bg-[#1e61f0] hover:bg-[#1a54d1] text-white px-10 py-3 rounded text-[14px] font-bold transition-all shadow-lg active:scale-95 mb-4 uppercase tracking-wide">
                      Create Your First Expense
                   </button>
                   <button className="text-[#1e61f0] text-[14px] font-bold hover:underline">
                      Import Expenses
                   </button>
                </div>
             </div>
          )}
       </div>
    </div>
    
    {showMileageModal && (
        <MileagePreferencesModal onClose={() => setShowMileageModal(false)} />
    )}
    </>
  );
};

export default ExpensesView;


const ExpenseDetailPane = ({ details, loading, onClose, onUploadSuccess }) => {
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState('');
  const [showFilesPopover, setShowFilesPopover] = React.useState(false);
  const fileInputRef = React.useRef(null);

  if (loading || !details) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-20">
        <RefreshCw size={24} className="animate-spin text-blue-600 mb-4" />
        <p className="text-slate-500 text-[13px]">Loading details...</p>
      </div>
    );
  }

  let narration = {};
  if (details.narration) {
    try { narration = JSON.parse(details.narration); } catch (e) {}
  }

  // Build array of existing receipts (backwards compatible with single receiptUrl)
  const existingReceipts = narration.receiptUrls || (narration.receiptUrl ? [narration.receiptUrl] : []);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    const totalAfter = existingReceipts.length + files.length;
    if (totalAfter > 5) {
      setUploadError(`Max 5 files allowed. You have ${existingReceipts.length}, trying to add ${files.length}.`);
      return;
    }
    
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        setUploadError(`"${file.name}" exceeds 10MB limit.`);
        return;
      }
    }

    setUploading(true);
    setUploadError('');
    try {
      const newUrls = [];
      for (const file of files) {
        const form = new FormData();
        form.append('image', file);
        const res = await inventoryAPI.uploadImage(form);
        newUrls.push(res.data.imageUrl);
      }
      const allReceipts = [...existingReceipts, ...newUrls];
      const updatedNarration = JSON.stringify({ ...narration, receiptUrls: allReceipts, receiptUrl: allReceipts[0] });
      await voucherAPI.updateNarration(details.id, updatedNarration);
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      console.error('Upload error:', err.response?.data || err.message);
      const errMsg = err.response?.data?.error || 'Upload failed. Please try again.';
      setUploadError(errMsg);
    } finally {
      setUploading(false);
      // Reset input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveReceipt = async (index) => {
    const updated = existingReceipts.filter((_, i) => i !== index);
    const updatedNarration = JSON.stringify({ ...narration, receiptUrls: updated, receiptUrl: updated[0] || '' });
    try {
      await voucherAPI.updateNarration(details.id, updatedNarration);
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      console.error('Remove error:', err);
    }
  };

  const primaryExpenseTransaction = details.Transactions?.find(t => t.type === 'Dr');

  return (
    <div className="flex flex-col h-full bg-slate-50 animate-fade-in relative shadow-[-10px_0_20px_-10px_rgba(0,0,0,0.05)] border-l border-slate-200">
      <div className="flex items-center justify-between px-8 py-4 border-b border-slate-200 bg-white sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <h2 className="text-[20px] font-black tracking-tight text-slate-800">Expense Details</h2>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded text-[12px] font-bold hover:bg-slate-50 flex items-center gap-1.5 transition-colors shadow-sm">
            <Edit2 size={14} /> Edit
          </button>
          <button className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded text-[12px] font-bold hover:bg-slate-50 flex items-center gap-1.5 transition-colors shadow-sm">
            <Printer size={14} /> Print
          </button>
          <button className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded hover:bg-slate-50 flex items-center justify-center transition-colors shadow-sm ml-2" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
           
          {/* Top Section Split */}
          <div className="grid grid-cols-2">
            
            {/* Left Info Pane */}
            <div className="p-8 border-r border-slate-100 flex flex-col justify-between">
              <div>
                <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-1">Expense Amount</p>
                <div className="flex items-end gap-3 mb-2">
                  <h3 className="text-[32px] font-black text-red-500 leading-none">
                    ₹ {parseFloat(details.Transactions?.filter(t => t.type === 'Cr').reduce((sum, t) => sum + parseFloat(t.amount || 0), 0) || 0).toLocaleString()}
                  </h3>
                  <span className="text-[13px] font-bold text-slate-400 mb-1">on {new Date(details.date).toLocaleDateString('en-IN')}</span>
                </div>
                
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded">
                  {narration.isBillable ? "BILLABLE" : "NON-BILLABLE"}
                </span>

                <div className="mt-8">
                  <div className="inline-block bg-[#e0f2fe] text-[#0284c7] px-3 py-1.5 rounded-md font-bold text-[12px] mb-8 shadow-sm">
                    {primaryExpenseTransaction?.Ledger?.name || "General Expense"}
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Paid Through</label>
                    <p className="text-[14px] font-medium text-slate-800 mt-1">
                      {details.Transactions?.find(t => t.type === 'Cr')?.Ledger?.name || "Advance Tax"}
                    </p>
                  </div>
                  {(narration.customer || narration.vendor) && (
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{narration.customer ? 'Customer' : 'Vendor'}</label>
                      <p className="text-[14px] font-medium text-blue-600 hover:underline cursor-pointer mt-1">
                        {narration.customer || narration.vendor}
                      </p>
                    </div>
                  )}
                  {narration.notes && (
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Notes</label>
                      <p className="text-[13px] text-slate-600 mt-1 italic leading-relaxed">"{narration.notes}"</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

              {/* Right Receipt Pane - Compact Attach Files */}
            <div className="p-8 bg-slate-50 flex flex-col justify-start relative">
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <p className="text-[13px] font-bold text-slate-500 mb-4">Attach File(s) to Expense</p>

                <div className="flex items-center gap-3 mb-3">
                  {uploading ? (
                    <div className="flex items-center gap-2 text-blue-600">
                      <RefreshCw size={14} className="animate-spin" />
                      <span className="text-[12px] font-bold">Uploading...</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-[12px] font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
                      disabled={existingReceipts.length >= 5}
                    >
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                      Upload File
                    </button>
                  )}

                  {existingReceipts.length > 0 && (
                    <button
                      onClick={() => setShowFilesPopover(!showFilesPopover)}
                      className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-full text-[11px] font-bold shadow-sm transition-colors cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                      {existingReceipts.length}
                    </button>
                  )}
                </div>

                <label className="flex items-center gap-2 text-[12px] text-slate-500 cursor-pointer select-none">
                  <input type="checkbox" className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  Display attachments in vendor portal and emails
                </label>
                <p className="text-[10px] text-blue-500 font-medium mt-2 italic">Max 5 files, 10MB each</p>
                {uploadError && <p className="text-[11px] text-red-500 font-medium mt-2">{uploadError}</p>}
              </div>

              {/* Files Popover - shown when blue badge is clicked */}
              {showFilesPopover && existingReceipts.length > 0 && (
                <div className="absolute top-[160px] left-4 right-4 z-20 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden animate-fade-in">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50">
                    <p className="text-[12px] font-bold text-slate-700">Attached Files ({existingReceipts.length})</p>
                    <button onClick={() => setShowFilesPopover(false)} className="text-slate-400 hover:text-slate-600">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="p-4 space-y-3 max-h-[350px] overflow-y-auto">
                    {existingReceipts.map((url, idx) => (
                      <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-200 bg-white">
                        <img src={url} alt={`Receipt ${idx + 1}`} className="w-full h-auto object-cover" />
                        <button
                          onClick={() => handleRemoveReceipt(idx)}
                          className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600"
                          title="Remove"
                        >
                          <X size={12} strokeWidth={3} />
                        </button>
                        <div className="p-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[11px] font-medium text-slate-500">Receipt {idx + 1}</span>
                          <a href={url} target="_blank" rel="noopener noreferrer" className="text-[11px] font-bold text-blue-600 hover:underline">Open</a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Hidden file input - multiple allowed */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                multiple
                onChange={handleUpload}
              />
            </div>
          </div>
          
          {/* Journal Section */}
          <div className="border-t border-slate-200 p-8">
            <div className="flex items-center gap-4 mb-6">
               <h3 className="text-[15px] font-black text-slate-800 tracking-tight">Journal</h3>
               <div className="h-px bg-slate-100 flex-1"></div>
            </div>
            
            <table className="w-full text-left">
              <thead className="border-b border-slate-200">
                <tr>
                  <th className="pb-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">Account</th>
                  <th className="pb-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none text-right">Debit</th>
                  <th className="pb-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none text-right">Credit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 border-b border-slate-200">
                {details.Transactions?.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 text-[14px] font-medium text-slate-900">{t.Ledger?.name || "Unknown"}</td>
                    <td className="py-4 text-[14px] font-bold text-slate-900 text-right">
                       {t.type === 'Dr' ? parseFloat(t.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
                    </td>
                    <td className="py-4 text-[14px] font-bold text-slate-900 text-right">
                       {t.type === 'Cr' ? parseFloat(t.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50/50">
                <tr>
                  <td className="py-4 text-[14px] font-black text-slate-800 text-right uppercase tracking-widest pr-4 border-r border-slate-200">Total</td>
                  <td className="py-4 text-[14px] font-black text-slate-900 text-right border-r border-slate-200 pr-4">
                    {parseFloat(details.Transactions?.filter(t => t.type === 'Dr').reduce((sum, t) => sum + parseFloat(t.amount || 0), 0) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-4 text-[14px] font-black text-slate-900 text-right">
                    {parseFloat(details.Transactions?.filter(t => t.type === 'Cr').reduce((sum, t) => sum + parseFloat(t.amount || 0), 0) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

