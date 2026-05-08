import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Plus, Wallet, RefreshCw, FileText, 
  ChevronDown, ArrowDownUp, Filter, MoreHorizontal,
  Play, CheckCircle2, LayoutList, MapPin, RotateCcw,
  User, Receipt, MousePointer2, ArrowRight, Check,
  ShoppingCart, BarChart3, Globe, Zap, ShieldCheck,
  CreditCard, Edit2, Printer, X, UploadCloud, ChevronRight, Paperclip
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
  const [searchParams] = useSearchParams();

  // Handle initial ID from URL for auto-selection
  useEffect(() => {
    const idParam = searchParams.get('id');
    if (idParam) {
      setSelectedExpenseId(idParam);
    }
  }, [searchParams]);

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
        {/* HEADER: Synchronized with Customers/Quotes */}
        <div className="flex items-center justify-between px-8 py-4 border-b border-slate-100 bg-white">
            <div className="flex items-center gap-2 group cursor-pointer relative">
                <h1 className="text-[20px] font-bold text-slate-900" onClick={() => setActiveTab(activeTab === 'All Expenses' ? 'Receipts Inbox' : 'All Expenses')}>
                    {activeTab}
                </h1>
                <ChevronDown size={18} className="text-blue-600 mt-1" />
            </div>

            <div className="flex items-center gap-2">
                <button 
                  onClick={() => navigate('/expenses/new')}
                  className="bg-[#1e61f0] hover:bg-[#1a54d1] text-white px-4 py-2 rounded-md font-medium flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <Plus size={18} strokeWidth={2.5} /> New Expense
                </button>
                
                <div className="relative">
                    <button className="p-2 text-slate-500 hover:text-slate-800 border border-slate-200 bg-white rounded-md hover:bg-slate-50 transition-colors shadow-sm">
                        <MoreHorizontal size={18} />
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
                     <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] border-b border-slate-200 sticky top-0 z-10">
                        {selectedExpenseId ? (
                           <tr>
                              <th className="px-6 py-3 w-10">
                                 <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                              </th>
                              <th className="px-6 py-3">CATEGORY</th>
                              <th className="px-6 py-3 text-right">AMOUNT</th>
                           </tr>
                        ) : (
                           <tr>
                              <th className="px-6 py-4 w-10">
                                 <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                              </th>
                              <th className="px-6 py-4">DATE</th>
                              <th className="px-6 py-4">EXPENSE ACCOUNT</th>
                              <th className="px-6 py-4">REFERENCE#</th>
                              <th className="px-6 py-4">VENDOR NAME</th>
                              <th className="px-6 py-4">PAID THROUGH</th>
                              <th className="px-6 py-4">CUSTOMER NAME</th>
                              <th className="px-6 py-4">STATUS</th>
                              <th className="px-6 py-4 text-right">AMOUNT</th>
                           </tr>
                        )}
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {expenses.map(exp => (
                          <tr 
                            key={exp.id} 
                            onClick={() => setSelectedExpenseId(exp.id)}
                            className={`transition-colors cursor-pointer group ${selectedExpenseId === exp.id ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}
                          >
                             <td className="px-6 py-4 w-10 align-top">
                                <input type="checkbox" className="w-4 h-4 mt-1 rounded border-slate-300 text-blue-600 focus:ring-blue-500" onClick={e => e.stopPropagation()} />
                             </td>
                             <td className="px-6 py-4">
                                {selectedExpenseId ? (
                                   <div className="flex flex-col gap-1">
                                      <div className="flex justify-between items-start gap-4">
                                         <span className="text-[14px] font-bold text-slate-800 leading-tight">
                                            {exp.Ledger?.name || 'General Expense'}
                                         </span>
                                         <span className="text-[14px] font-bold text-slate-900 whitespace-nowrap">
                                            ₹{parseFloat(exp.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                         </span>
                                      </div>
                                      <div className="flex items-center gap-1.5 text-[12px] font-medium text-slate-400">
                                         {new Date(exp.date).toLocaleDateString('en-IN', {day:'2-digit', month:'2-digit', year:'numeric'})}
                                         {(exp.vendorName && exp.vendorName !== '-') && (
                                            <>
                                               <span className="text-slate-300">•</span>
                                               <span className="text-slate-500">{exp.vendorName}</span>
                                            </>
                                         )}
                                      </div>
                                      {exp.narration && JSON.parse(exp.narration || '{}').receiptUrls?.length > 0 && (
                                         <div className="mt-2 flex justify-end">
                                            <Paperclip size={12} className="text-slate-400 transform rotate-45" />
                                         </div>
                                      )}
                                   </div>
                                ) : (
                                   <span className="text-[14px] text-slate-600 whitespace-nowrap">
                                      {new Date(exp.date).toLocaleDateString('en-IN', {day:'2-digit', month:'2-digit', year:'numeric'})}
                                   </span>
                                )}
                             </td>
                             {!selectedExpenseId && (
                                <td className="px-6 py-4 text-[14px] font-medium text-slate-900 truncate max-w-[200px]">
                                   {exp.Ledger?.name || 'General Expense'}
                                </td>
                             )}
                             {!selectedExpenseId && <td className="px-6 py-4 text-[14px] text-slate-600">{exp.reference || ''}</td>}
                             {!selectedExpenseId && <td className="px-6 py-4 text-[14px] text-slate-600 truncate max-w-[150px]">{exp.vendorName || '-'}</td>}
                             {!selectedExpenseId && <td className="px-6 py-4 text-[14px] text-slate-600">{exp.paidThrough || '-'}</td>}
                             {!selectedExpenseId && <td className="px-6 py-4 text-[14px] text-slate-600 truncate max-w-[150px]">{exp.customerName || '-'}</td>}
                             {!selectedExpenseId && (
                                <td className="px-6 py-4 text-[14px]">
                                   <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-600 text-[11px] font-bold uppercase">Paid</span>
                                </td>
                             )}
                             {!selectedExpenseId && (
                                <td className="px-6 py-4 text-right text-[14px] font-bold text-slate-900 whitespace-nowrap">
                                   ₹ {parseFloat(exp.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </td>
                             )}
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
                        onClose={() => {
                           setSelectedExpenseId(null);
                           navigate('/expenses');
                        }} 
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
                           <h3 className="text-white text-[48px] font-bold tracking-[4px] border-b-4 border-white pb-1 italic leading-none">EXPENSES</h3>
                        </div>
                      </div>

                      <div className="p-8 space-y-8">
                         {/* Definition Box */}
                         <div className="p-6 bg-white border-2 border-slate-100 rounded-xl relative group hover:border-[#c53030]/20 transition-colors">
                            <p className="text-[18px] text-slate-800 leading-relaxed font-serif italic text-center">
                               <span className="font-bold text-[22px] not-italic font-sans mr-2">Expenses</span> 
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
                                  <h4 className="text-[#c53030] font-bold text-[16px] italic uppercase tracking-wider">Types of Expenses</h4>
                               </div>
                               
                               <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-5">
                                  <div className="flex gap-4">
                                     <div className="w-6 h-6 shrink-0 bg-[#c53030] rounded-sm flex items-center justify-center text-white text-[12px] transform rotate-45 mt-1">
                                        <div className="-rotate-45 font-bold">&gt;</div>
                                     </div>
                                     <div>
                                        <h5 className="font-bold text-slate-900 text-[15px]">Cost of Goods sold (COGS) -</h5>
                                        <p className="text-slate-600 text-[14px] mt-1 italic">Expenses directly related to generating sales revenues</p>
                                     </div>
                                  </div>

                                  <div className="flex gap-4">
                                     <div className="w-6 h-6 shrink-0 bg-[#c53030] rounded-sm flex items-center justify-center text-white text-[12px] transform rotate-45 mt-1">
                                        <div className="-rotate-45 font-bold">&gt;</div>
                                     </div>
                                     <div>
                                        <h5 className="font-bold text-slate-900 text-[15px]">Indirect Expenses –</h5>
                                        <p className="text-slate-600 text-[14px] mt-1 italic">These are the operating expenses</p>
                                     </div>
                                  </div>

                                  <div className="flex gap-4">
                                     <div className="w-6 h-6 shrink-0 bg-[#c53030] rounded-sm flex items-center justify-center text-white text-[12px] transform rotate-45 mt-1">
                                        <div className="-rotate-45 font-bold">&gt;</div>
                                     </div>
                                     <div>
                                        <h5 className="font-bold text-slate-900 text-[15px]">Non Operating Expenses -</h5>
                                        <p className="text-slate-600 text-[14px] mt-1 italic">those expenses which are not related to "revenue generation for the core business activity"</p>
                                     </div>
                                  </div>
                               </div>
                            </div>

                            {/* P&L Section */}
                            <div className="space-y-6">
                               <div className="bg-[#fed7d7] rounded-full py-2 px-10 border-2 border-[#f56565] inline-block shadow-sm">
                                  <h4 className="text-[#c53030] font-bold text-[16px] italic uppercase tracking-wider">Expenses in P&L A/C</h4>
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

  const existingReceipts = narration.receiptUrls || (narration.receiptUrl ? [narration.receiptUrl] : []);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    if (existingReceipts.length + files.length > 5) {
      setUploadError(`Max 5 files allowed.`);
      return;
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
      setUploadError('Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const primaryExpenseTransaction = details.Transactions?.find(t => parseFloat(t.debit || 0) > 0);
  const paidThroughTransaction = details.Transactions?.find(t => parseFloat(t.credit || 0) > 0);

  return (
    <div className="flex flex-col h-full bg-white animate-fade-in relative shadow-[-10px_0_20px_-10px_rgba(0,0,0,0.05)] border-l border-slate-200">
      {/* Detail Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100 bg-white">
        <h2 className="text-[17px] font-bold text-slate-800 tracking-tight">Expense Details</h2>
        <div className="flex items-center gap-2">
           <div className="flex items-center bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
             <button className="px-3 py-1.5 text-slate-600 text-[12px] font-bold hover:bg-slate-50 flex items-center gap-1.5 border-r border-slate-100 transition-colors">
               <Edit2 size={13} className="text-slate-400" /> Edit
             </button>
             <button className="px-3 py-1.5 text-slate-600 text-[12px] font-bold hover:bg-slate-50 flex items-center gap-1.5 border-r border-slate-100 transition-colors">
               <RotateCcw size={13} className="text-slate-400" /> Make Recurring
             </button>
             <button className="px-3 py-1.5 text-slate-600 text-[12px] font-bold hover:bg-slate-50 flex items-center gap-1.5 transition-colors">
               <Printer size={13} className="text-slate-400" /> Print
             </button>
           </div>
           <button className="p-1.5 text-slate-400 hover:bg-slate-50 rounded-md transition-colors" onClick={onClose}>
             <X size={18} />
           </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-8">
           <div className="flex justify-between items-start mb-10">
              <div className="space-y-4">
                 <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Expense Amount</label>
                    <div className="flex items-baseline gap-2">
                       <h3 className="text-[32px] font-bold text-[#e53e3e] leading-none tracking-tight">
                         ₹ {parseFloat(details.Transactions?.reduce((sum, t) => sum + parseFloat(t.debit || 0), 0) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                       </h3>
                       <span className="text-[13px] font-bold text-slate-400">on {new Date(details.date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                    </div>
                 </div>

                 <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-widest bg-orange-100 text-orange-600 uppercase border border-orange-200">
                      {narration.isBillable ? "BILLABLE" : "NON-BILLABLE"}
                    </span>
                 </div>

                 <div className="pt-2">
                    <div className="inline-flex items-center bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-bold text-[12px] border border-blue-100 shadow-sm">
                      {primaryExpenseTransaction?.Ledger?.name || "General Expense"}
                    </div>
                 </div>

                 <div className="grid grid-cols-1 gap-6 pt-6">
                    <div>
                       <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest block mb-1">Paid Through</label>
                       <p className="text-[15px] font-bold text-slate-700">{paidThroughTransaction?.Ledger?.name || "Undeposited Funds"}</p>
                    </div>
                    <div>
                       <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest block mb-1">Paid To</label>
                       <p className="text-[15px] font-bold text-blue-600 hover:underline cursor-pointer transition-all">{narration.vendor || "Rapid"}</p>
                    </div>
                 </div>
              </div>

              {/* Receipt Dropzone Area */}
              <div className="w-[240px]">
                 <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center group hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer bg-slate-50/50"
                 >
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white mb-4 shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
                       <UploadCloud size={24} />
                    </div>
                    <p className="text-[13px] font-bold text-slate-700 leading-tight">Drag or Drop your Receipts</p>
                    <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wider">Maximum file size allowed is 10MB</p>
                    
                    <button className="mt-4 flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-600 shadow-sm group-hover:border-blue-200 transition-all">
                       <Plus size={14} className="text-blue-600" />
                       Upload your Files
                    </button>
                 </div>
                 <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleUpload} />
                 {uploading && <p className="text-center text-[11px] font-bold text-blue-500 mt-2">Uploading...</p>}
                 
                 {existingReceipts.length > 0 && (
                    <div className="mt-4 flex justify-center">
                       <button 
                          onClick={() => setShowFilesPopover(true)}
                          className="text-[11px] font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-all border border-blue-100"
                       >
                          View Attachments ({existingReceipts.length})
                       </button>
                    </div>
                 )}
              </div>
           </div>

           {/* Journal Section */}
           <div className="mt-12 pt-8 border-t border-slate-100">
              <div className="flex items-center gap-4 mb-8">
                 <h3 className="text-[16px] font-bold text-slate-800 tracking-tight">Journal</h3>
                 <div className="h-px bg-slate-100 flex-1"></div>
              </div>

              <div className="mb-6 flex items-center gap-2">
                 <span className="text-[11px] font-bold text-slate-500 italic">Amount is displayed in your base currency</span>
                 <span className="bg-green-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tighter">INR</span>
              </div>

              <h4 className="text-[18px] font-bold text-slate-800 mb-6 italic underline decoration-slate-200 underline-offset-8">Expense</h4>
              
              <div className="overflow-hidden rounded-xl border border-slate-100 shadow-sm">
                 <table className="w-full text-left">
                    <thead className="bg-slate-50/50">
                       <tr className="border-b border-slate-100">
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">ACCOUNT</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-right">DEBIT</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-right">CREDIT</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {details.Transactions?.map((t, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                             <td className="px-6 py-5 text-[14px] font-bold text-slate-800">{t.Ledger?.name || "Unknown Account"}</td>
                              <td className="px-6 py-5 text-[14px] font-bold text-slate-900 text-right">
                                 {parseFloat(t.debit || 0) > 0 ? parseFloat(t.debit).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
                              </td>
                              <td className="px-6 py-5 text-[14px] font-bold text-slate-900 text-right">
                                 {parseFloat(t.credit || 0) > 0 ? parseFloat(t.credit).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
                              </td>
                          </tr>
                       ))}
                    </tbody>
                    <tfoot className="bg-slate-50/50 border-t border-slate-100">
                       <tr>
                          <td className="px-6 py-5 text-[14px] font-bold text-slate-900 text-right uppercase tracking-widest border-r border-slate-100 pr-10">Total</td>
                          <td className="px-6 py-5 text-[14px] font-bold text-slate-900 text-right border-r border-slate-100">
                             {parseFloat(details.Transactions?.reduce((sum, t) => sum + parseFloat(t.debit || 0), 0) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-5 text-[14px] font-bold text-slate-900 text-right">
                             {parseFloat(details.Transactions?.reduce((sum, t) => sum + parseFloat(t.credit || 0), 0) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                       </tr>
                    </tfoot>
                 </table>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

