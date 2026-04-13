const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend/src/modules/purchases/ExpensesView.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add voucherAPI import
content = content.replace(
  "import { purchaseAPI } from '../../services/api';",
  "import { purchaseAPI, voucherAPI } from '../../services/api';"
);

// 2. Add lucide icons required
content = content.replace(
  "LayoutList, MapPin, RotateCcw,",
  "LayoutList, MapPin, RotateCcw, Edit2, Printer, X,"
);

// 3. Add ExpenseDetailPane component
const detailPaneComponent = `
const ExpenseDetailPane = ({ details, loading, onClose }) => {
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

  const primaryExpenseTransaction = details.Transactions?.find(t => t.type === 'Dr');

  return (
    <div className="flex flex-col h-full bg-slate-50 animate-fade-in">
      <div className="flex items-center justify-between px-8 py-5 border-b border-slate-200 bg-white sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <h2 className="text-[20px] font-black tracking-tight text-slate-800">Expense Details</h2>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded text-[12px] font-bold hover:bg-slate-50 flex items-center gap-1.5 transition-colors shadow-sm">
            <Edit2 size={14} /> Edit
          </button>
          <button className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded text-[12px] font-bold hover:bg-slate-50 flex items-center gap-1.5 transition-colors shadow-sm">
            <RotateCw size={14} /> Make Recurring
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

            {/* Right Receipt Pane */}
            <div className="p-8 bg-slate-50 flex items-center justify-center">
              {narration.receiptUrl ? (
                 <div className="w-full max-w-[280px] rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white">
                   <img src={narration.receiptUrl} alt="Receipt" className="w-full h-auto object-cover" />
                 </div>
              ) : (
                <div className="w-[320px] bg-white border border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-center">
                  <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-slate-800/20">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h4 className="text-[14px] font-black text-slate-800 mb-1">Drag or Drop your Receipts</h4>
                  <p className="text-[11px] text-slate-400 font-medium mb-6">Maximum file size allowed is 10MB</p>
                  <button className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded text-[13px] font-bold transition-colors flex items-center gap-2">
                    <Plus size={16} /> Upload your Files
                  </button>
                </div>
              )}
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
`;

// Inject ExpenseDetailPane above export default
content = content.replace(
  "export default ExpensesView;",
  detailPaneComponent + "\nexport default ExpensesView;"
);

// 4. Update the state inside ExpensesView
content = content.replace(
  "const [showMileageModal, setShowMileageModal] = useState(false);",
  \`const [showMileageModal, setShowMileageModal] = useState(false);
  const [selectedExpenseId, setSelectedExpenseId] = useState(null);
  const [expenseDetails, setExpenseDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

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
        console.error(e);
      } finally {
        setLoadingDetails(false);
      }
    }
    fetchDetails();
  }, [selectedExpenseId]);\`
);

// 5. Enhance the table UI to be split view aware
const existingTableStart = '<table className="w-full text-left">';
const existingTableEnd = '</table>';

// Extract the table structure exactly
const tableBlockRegex = /<table className="w-full text-left">([\\s\\S]*?)<\\/tbody>\\s*<\\/table>/;
const match = content.match(tableBlockRegex);

if (match) {
  const replacementTableJSX = \`
              <div className="flex bg-white h-[calc(100vh-140px)] relative overflow-hidden text-left">
                {/* LIST PANE */}
                <div className={\`transition-all duration-300 ease-in-out border-r border-slate-200 overflow-y-auto \${selectedExpenseId ? 'w-[380px] shrink-0' : 'w-full'}\`}>
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
                            onClick={() => setSelectedExpenseId(exp.id)}
                            className={\`transition-colors cursor-pointer group \${selectedExpenseId === exp.id ? 'bg-blue-50/50' : 'hover:bg-slate-50'}\`}
                          >
                             <td className="px-6 py-4 text-[14px] text-slate-600 whitespace-nowrap">{new Date(exp.date).toLocaleDateString('en-IN', {day:'2-digit', month:'2-digit', year:'numeric'})}</td>
                             <td className="px-6 py-4 text-[14px] font-medium text-slate-900 truncate max-w-[200px]">
                                {exp.Ledger?.name || 'General Expense'}
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
                     />
                  </div>
                )}
              </div>
  \`;
  
  // Actually replace the table in the content
  content = content.replace(match[0], replacementTableJSX);
  // Remove the <div className="p-8"> wrap around the table so the flex layout consumes the height
  content = content.replace(
    \`          ) : expenses.length > 0 ? (\\n             <div className="p-8">\\n              <div className="flex bg-white\`,
    \`          ) : expenses.length > 0 ? (\\n              <div className="flex bg-white\`
  );
  content = content.replace(
    \`              </div>\\n              </div>\\n           ) : (\\n              <div className="flex-1 flex flex-col items-center\`,
    \`              </div>\\n           ) : (\\n              <div className="flex-1 flex flex-col items-center\`
  );
}

fs.writeFileSync(filePath, content);
console.log('Successfully injected split view');
