import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Search, Paperclip, UploadCloud, 
  ChevronDown, HelpCircle, X, Check, Image as ImageIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { voucherAPI, ledgerAPI, purchaseAPI, inventoryAPI, costCenterAPI } from '../../services/api';
import MileagePreferencesModal from './MileagePreferencesModal';

const CURRENCIES = [
  'AED', 'AFN', 'ALL', 'AMD', 'ANG', 'AOA', 'ARS', 'AUD', 'AWG', 'AZN', 
  'BAM', 'BBD', 'BDT', 'BGN', 'BHD', 'BIF', 'BMD', 'BND', 'BOB', 'BRL', 
  'BSD', 'BTN', 'BWP', 'BYN', 'BZD', 'CAD', 'CDF', 'CHF', 'CLP', 'CNY', 
  'COP', 'CRC', 'CUP', 'CVE', 'CZK', 'DJF', 'DKK', 'DOP', 'DZD', 'EGP', 
  'ERN', 'ETB', 'EUR', 'FJD', 'FKP', 'GBP', 'GEL', 'GHS', 'GIP', 'GMD', 
  'GNF', 'GTQ', 'GYD', 'HKD', 'HNL', 'HRK', 'HTG', 'HUF', 'IDR', 'ILS', 
  'INR', 'IQD', 'IRR', 'ISK', 'JMD', 'JOD', 'JPY', 'KES', 'KGS', 'KHR', 
  'KMF', 'KPW', 'KRW', 'KWD', 'KYD', 'KZT', 'LAK', 'LBP', 'LKR', 'LRD', 
  'LSL', 'LYD', 'MAD', 'MDL', 'MGA', 'MKD', 'MMK', 'MNT', 'MOP', 'MRU', 
  'MUR', 'MVR', 'MWK', 'MXN', 'MYR', 'MZN', 'NAD', 'NGN', 'NIO', 'NOK', 
  'NPR', 'NZD', 'OMR', 'PAB', 'PEN', 'PGK', 'PHP', 'PKR', 'PLN', 'PYG', 
  'QAR', 'RON', 'RSD', 'RUB', 'RWF', 'SAR', 'SBD', 'SCR', 'SDG', 'SEK', 
  'SGD', 'SHP', 'SLL', 'SOS', 'SRD', 'SSP', 'STN', 'SYP', 'SZL', 'THB', 
  'TJS', 'TMT', 'TND', 'TOP', 'TRY', 'TTD', 'TWD', 'TZS', 'UAH', 'UGX', 
  'USD', 'UYU', 'UZS', 'VES', 'VND', 'VUV', 'WST', 'XAF', 'XCD', 'XOF', 
  'XPF', 'YER', 'ZAR', 'ZMW', 'ZWL'
];

const ExpenseEntryView = ({ companyId }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Record Expense');
  
  // Data
  const [ledgers, setLedgers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [costCenters, setCostCenters] = useState([]);
  
  // Itemize State
  const [isItemized, setIsItemized] = useState(false);
  const [itemizedRows, setItemizedRows] = useState([
     { id: 1, expenseAccountId: '', notes: '', amount: '' }
  ]);
  
  // Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    expenseAccountId: '', // for single mode
    amount: '',           // for single mode
    currency: 'INR',
    paidThroughId: '',
    vendorId: '',
    invoiceNumber: '',
    notes: '',            // general notes
    customerId: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Upload State
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptUrl, setReceiptUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showMileageModal, setShowMileageModal] = useState(false);

  // Bulk Rows State
  const initialBulkRow = () => ({
    id: Date.now() + Math.random(),
    date: new Date().toISOString().split('T')[0],
    expenseAccountId: '',
    amount: '',
    currency: 'INR',
    paidThroughId: '',
    vendorId: '',
    customerId: '',
    costCenterId: '',
    isBillable: false,
    tags: []
  });

  const [bulkRows, setBulkRows] = useState(Array(5).fill(null).map((_, i) => ({
    ...initialBulkRow(),
    id: i + 1
  })));

  useEffect(() => {
    if (!companyId) return;
    
    // Fetch Ledgers, Vendors, and Cost Centers
    Promise.all([
      ledgerAPI.getByCompany(companyId),
      purchaseAPI.getVendors(companyId),
      costCenterAPI.getByCompany(companyId)
    ]).then(([ledgersRes, vendorsRes, costCentersRes]) => {
      setLedgers(ledgersRes.data || []);
      setVendors(vendorsRes.data || []);
      setCostCenters(costCentersRes.data || []);
    }).catch(err => console.error("Failed to fetch initial data:", err));
  }, [companyId]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (isNew = false) => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'Bulk Add Expenses') {
        const validRows = bulkRows.filter(r => r.expenseAccountId && r.paidThroughId && parseFloat(r.amount) > 0);
        
        if (validRows.length === 0) {
          throw new Error("Please fill in at least one complete expense row (Account, Paid Through, and Amount).");
        }

        for (const row of validRows) {
          const vendorInfo = vendors.find(v => v.id === row.vendorId);
          const narrationData = {
            notes: '',
            vendor: vendorInfo?.name || '',
            customer: row.customerId,
            costCenter: row.costCenterId,
            isBillable: row.isBillable
          };

          const payload = {
            companyId,
            voucherType: 'Payment',
            date: row.date,
            narration: JSON.stringify(narrationData),
            entries: [
              { ledgerId: row.expenseAccountId, debit: parseFloat(row.amount), credit: 0 },
              { ledgerId: row.paidThroughId, debit: 0, credit: parseFloat(row.amount) }
            ]
          };
          await voucherAPI.create(payload);
        }
      } else {
        // ... (existing single/itemize save logic moved below)
        if (!formData.paidThroughId) {
          throw new Error("Please select a Paid Through account.");
        }

        let entries = [];
        let totalAmount = 0;

        if (isItemized) {
          const validRows = itemizedRows.filter(r => r.expenseAccountId && parseFloat(r.amount) > 0);
          if (validRows.length === 0) {
            throw new Error("Please add at least one valid expense item with an account and amount.");
          }
          validRows.forEach(r => {
            const amt = parseFloat(r.amount);
            totalAmount += amt;
            entries.push({ ledgerId: r.expenseAccountId, debit: amt, credit: 0 });
          });
          entries.push({ ledgerId: formData.paidThroughId, debit: 0, credit: totalAmount });
        } else {
          if (!formData.expenseAccountId || !formData.amount) {
            throw new Error("Please fill out required fields: Expense Account and Amount.");
          }
          totalAmount = parseFloat(formData.amount);
          entries = [
            { ledgerId: formData.expenseAccountId, debit: totalAmount, credit: 0 },
            { ledgerId: formData.paidThroughId, debit: 0, credit: totalAmount }
          ];
        }

        const vendorInfo = vendors.find(v => v.id === formData.vendorId);
        const narrationData = {
          notes: formData.notes,
          vendor: vendorInfo?.name || '',
          invoiceNumber: formData.invoiceNumber,
          customer: formData.customerId,
          receiptUrl: receiptUrl
        };

        const payload = {
          companyId,
          voucherType: 'Payment',
          date: formData.date,
          narration: JSON.stringify(narrationData),
          entries: entries
        };
        await voucherAPI.create(payload);
      }

      if (isNew) {
        // Reset states
        setFormData(prev => ({
          ...prev,
          date: new Date().toISOString().split('T')[0],
          expenseAccountId: '',
          amount: '',
          invoiceNumber: '',
          notes: ''
        }));
        setItemizedRows([{ id: Date.now(), expenseAccountId: '', notes: '', amount: '' }]);
        setBulkRows(Array(5).fill(null).map((_, i) => ({ ...initialBulkRow(), id: i + 1 })));
        window.scrollTo(0, 0);
      } else {
        navigate('/expenses');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to save expense.");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkRowChange = (id, field, value) => {
    setBulkRows(bulkRows.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleAddBulkRow = () => {
    setBulkRows([...bulkRows, { ...initialBulkRow(), id: Date.now() }]);
  };

  const handleAddRow = () => {
     setItemizedRows([...itemizedRows, { id: Date.now(), expenseAccountId: '', notes: '', amount: '' }]);
  };

  const handleRowChange = (id, field, value) => {
     setItemizedRows(itemizedRows.map(r => r.id === id ? { ...r, [field]: value } : r));
  };
  
  const handleRemoveRow = (id) => {
     if (itemizedRows.length > 1) {
        setItemizedRows(itemizedRows.filter(r => r.id !== id));
     }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("Maximum file size allowed is 10MB");
      return;
    }

    setReceiptFile(file);
    setUploading(true);

    try {
      const form = new FormData();
      form.append('image', file);
      
      const res = await inventoryAPI.uploadImage(form);
      setReceiptUrl(res.data.imageUrl);
    } catch (err) {
      console.error(err);
      alert("Failed to upload receipt.");
      setReceiptFile(null);
    } finally {
      setUploading(false);
    }
  };

  // derived data
  const expenseAccounts = ledgers.filter(l => !l.Group?.name?.includes('Bank') && !l.Group?.name?.includes('Cash'));
  const paymentAccounts = ledgers.filter(l => l.Group?.name?.includes('Bank') || l.Group?.name?.includes('Cash'));
  const customers = ledgers.filter(l => l.Group?.name?.includes('Debtor'));

  const itemizedTotal = itemizedRows.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);

  return (
    <div className="bg-white min-h-screen flex flex-col font-sans">
      
      {/* Header Tabs */}
      <div className="border-b border-slate-200 bg-white sticky top-0 z-10 px-6 pt-3 flex items-center justify-between">
         <div className="flex gap-6">
            {['Record Expense', 'Record Mileage', 'Bulk Add Expenses'].map(tab => (
               <button
                  key={tab}
                  onClick={() => {
                      setActiveTab(tab);
                      if (tab === 'Record Mileage') setShowMileageModal(true);
                   }}
                  className={`pb-3 text-[14px] font-medium transition-all relative ${
                     activeTab === tab 
                     ? 'text-[#1e61f0]' 
                     : 'text-slate-500 hover:text-blue-700'
                  }`}
               >
                  {tab}
                  {activeTab === tab && (
                     <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1e61f0] rounded-t-lg"></div>
                  )}
               </button>
            ))}
         </div>
         <button onClick={() => navigate('/expenses')} className="mb-2 p-1.5 text-slate-400 hover:bg-slate-100 rounded-md transition-all">
            <X size={20} />
         </button>
      </div>

      <div className="flex-1 overflow-auto bg-[#f9fafb]">
         <div className="max-w-full w-fit mx-auto p-6">
            {error && (
               <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-[14px] border border-red-100 flex items-center gap-2">
                  <span className="font-bold flex-shrink-0">Error:</span> {error}
               </div>
            )}

            {activeTab === 'Bulk Add Expenses' ? (
               <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-w-[1240px]">
                  <table className="w-full text-left border-collapse">
                     <thead className="bg-[#fcfdfe] text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                        <tr>
                           <th className="px-3 py-4 text-red-500">Date*</th>
                           <th className="px-3 py-4 text-red-500">Expense Account*</th>
                           <th className="px-3 py-4 text-red-500">Amount*</th>
                           <th className="px-3 py-4 text-red-500">Paid Through*</th>
                           <th className="px-3 py-4">Vendor</th>
                           <th className="px-3 py-4">Customer Name</th>
                           <th className="px-3 py-4">Projects</th>
                           <th className="px-3 py-4">Billable</th>
                           <th className="px-3 py-4">Reporting Tags</th>
                           <th className="px-3 py-4 w-10"></th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {bulkRows.map(row => (
                           <tr key={row.id} className="hover:bg-slate-50/50 transition-colors group">
                              <td className="p-2 align-top">
                                 <input 
                                    type="date" 
                                    value={row.date}
                                    onChange={e => handleBulkRowChange(row.id, 'date', e.target.value)}
                                    className="w-full h-9 px-2 text-[13px] border border-slate-200 rounded focus:border-blue-500 outline-none" 
                                 />
                              </td>
                              <td className="p-2 align-top">
                                 <select 
                                    value={row.expenseAccountId}
                                    onChange={e => handleBulkRowChange(row.id, 'expenseAccountId', e.target.value)}
                                    className="w-[180px] h-9 px-2 text-[13px] border border-slate-200 rounded focus:border-blue-500 outline-none appearance-none whitespace-nowrap overflow-hidden text-ellipsis"
                                 >
                                    <option value="">Select an account</option>
                                    {expenseAccounts.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                 </select>
                              </td>
                              <td className="p-2 align-top">
                                 <div className="flex w-[160px]">
                                    <div className="relative bg-slate-50 border border-slate-200 border-r-0 rounded-l w-[80px] shrink-0">
                                       <select 
                                          value={row.currency}
                                          onChange={e => handleBulkRowChange(row.id, 'currency', e.target.value)}
                                          className="w-full h-9 pl-2 pr-6 text-[12px] bg-transparent outline-none appearance-none font-bold text-slate-500"
                                       >
                                          {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                                       </select>
                                       <ChevronDown size={10} className="absolute right-1 top-3 text-slate-400 pointer-events-none" />
                                    </div>
                                    <input 
                                       type="number" 
                                       value={row.amount}
                                       placeholder="0.00"
                                       onChange={e => handleBulkRowChange(row.id, 'amount', e.target.value)}
                                       className="w-full h-9 px-2 text-[13px] border border-slate-200 rounded-r focus:border-blue-500 outline-none text-right" 
                                    />
                                 </div>
                              </td>
                              <td className="p-2 align-top">
                                 <select 
                                    value={row.paidThroughId}
                                    onChange={e => handleBulkRowChange(row.id, 'paidThroughId', e.target.value)}
                                    className="w-[180px] h-9 px-2 text-[13px] border border-slate-200 rounded focus:border-blue-500 outline-none appearance-none"
                                 >
                                    <option value="">Select an account</option>
                                    {paymentAccounts.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                 </select>
                              </td>
                              <td className="p-2 align-top">
                                 <select 
                                    value={row.vendorId}
                                    onChange={e => handleBulkRowChange(row.id, 'vendorId', e.target.value)}
                                    className="w-[160px] h-9 px-2 text-[13px] border border-slate-200 rounded focus:border-blue-500 outline-none appearance-none"
                                 >
                                    <option value=""></option>
                                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                 </select>
                              </td>
                              <td className="p-2 align-top">
                                 <select 
                                    value={row.customerId}
                                    onChange={e => handleBulkRowChange(row.id, 'customerId', e.target.value)}
                                    className="w-[180px] h-9 px-2 text-[13px] border border-slate-200 rounded focus:border-blue-500 outline-none appearance-none"
                                 >
                                    <option value=""></option>
                                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                 </select>
                              </td>
                              <td className="p-2 align-top">
                                 <select 
                                    value={row.costCenterId}
                                    onChange={e => handleBulkRowChange(row.id, 'costCenterId', e.target.value)}
                                    className="w-[160px] h-9 px-2 text-[13px] border border-slate-200 rounded focus:border-blue-500 outline-none appearance-none"
                                 >
                                    <option value=""></option>
                                    {costCenters.map(cc => <option key={cc.id} value={cc.id}>{cc.name}</option>)}
                                 </select>
                              </td>
                              <td className="p-2 align-top text-center">
                                 <input 
                                    type="checkbox" 
                                    checked={row.isBillable}
                                    onChange={e => handleBulkRowChange(row.id, 'isBillable', e.target.checked)}
                                    className="mt-2.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                                 />
                              </td>
                              <td className="p-2 align-top">
                                 <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-[12px] text-slate-600 font-medium hover:bg-slate-100 transition-colors whitespace-nowrap mt-1">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-60"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
                                    Associate Tags
                                 </button>
                              </td>
                              <td className="p-2 align-top text-center">
                                 <button onClick={() => setBulkRows(bulkRows.filter(r => r.id !== row.id))} className="mt-2.5 text-slate-300 hover:text-red-500 transition-colors">
                                    <X size={16} />
                                 </button>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
                  <div className="p-4 bg-white border-t border-slate-100">
                     <button onClick={handleAddBulkRow} className="flex items-center gap-1.5 text-blue-600 font-bold text-[14px] hover:underline">
                        <span className="text-[18px]">+</span> Add More Expenses
                     </button>
                  </div>
               </div>
            ) : (
               <div className="max-w-[1100px] mx-auto grid grid-cols-[1fr_350px] gap-12">
                  {/* ... regular form code ... */}
                  <div className="space-y-6">
                     {/* Form Section */}
                     {!isItemized ? (
                        <>
                           <div className="grid grid-cols-[160px_1fr] items-center gap-4">
                              <label className="text-[14px] text-red-500 font-medium whitespace-nowrap">Date*</label>
                              <input 
                                 type="date" 
                                 value={formData.date}
                                 onChange={e => handleChange('date', e.target.value)}
                                 className="w-[280px] h-9 px-3 text-[14px] border border-slate-200 rounded-md focus:border-[#1e61f0] focus:ring-1 focus:ring-[#1e61f0] outline-none text-slate-700 bg-white" 
                              />
                           </div>

                           <div className="grid grid-cols-[160px_1fr] items-start gap-4">
                              <label className="text-[14px] text-red-500 font-medium pt-2 whitespace-nowrap">Expense Account*</label>
                              <div>
                                 <div className="relative w-[400px]">
                                    <select 
                                       value={formData.expenseAccountId}
                                       onChange={e => handleChange('expenseAccountId', e.target.value)}
                                       className="w-full h-9 pl-3 pr-8 text-[14px] border border-slate-200 rounded-md focus:border-[#1e61f0] focus:ring-1 focus:ring-[#1e61f0] outline-none appearance-none bg-white text-slate-700"
                                    >
                                       <option value="">Select an account</option>
                                       {expenseAccounts.map(l => (
                                          <option key={l.id} value={l.id}>{l.name}</option>
                                       ))}
                                    </select>
                                    <ChevronDown size={14} className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
                                 </div>
                                 <button 
                                    onClick={() => setIsItemized(true)}
                                    className="flex items-center gap-1.5 text-[#1e61f0] text-[13px] font-medium mt-2 hover:underline decoration-[#1e61f0]/30 transition-all font-sans"
                                 >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-80"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                                    Itemize
                                 </button>
                              </div>
                           </div>

                           <div className="grid grid-cols-[160px_1fr] items-center gap-4">
                              <label className="text-[14px] text-red-500 font-medium whitespace-nowrap">Amount*</label>
                              <div className="flex w-[400px]">
                                 <div className="relative w-[80px] shrink-0 border border-r-0 border-slate-200 rounded-l-md bg-slate-50">
                                    <select 
                                       value={formData.currency}
                                       onChange={e => handleChange('currency', e.target.value)}
                                       className="w-full h-9 pl-3 pr-6 text-[14px] bg-transparent outline-none appearance-none font-medium text-slate-700"
                                    >
                                       {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    <ChevronDown size={14} className="absolute right-2 top-2.5 text-slate-400 pointer-events-none" />
                                 </div>
                                 <input 
                                    type="number" 
                                    value={formData.amount}
                                    onChange={e => handleChange('amount', e.target.value)}
                                    className="w-full h-9 px-3 text-[14px] border border-slate-200 rounded-r-md focus:border-[#1e61f0] focus:ring-1 focus:ring-[#1e61f0] z-10 outline-none" 
                                 />
                              </div>
                           </div>
                           
                           <div className="w-full h-px border-b border-dashed border-slate-200 my-2"></div>
                           
                           <div className="grid grid-cols-[160px_1fr] items-center gap-4 mt-2">
                              <label className="text-[14px] text-red-500 font-medium whitespace-nowrap">Paid Through*</label>
                              <div className="relative w-[400px]">
                                 <select 
                                    value={formData.paidThroughId}
                                    onChange={e => handleChange('paidThroughId', e.target.value)}
                                    className="w-full h-9 pl-3 pr-8 text-[14px] border border-slate-200 rounded-md focus:border-[#1e61f0] focus:ring-1 focus:ring-[#1e61f0] outline-none appearance-none bg-white text-slate-700"
                                 >
                                    <option value="">Select an account</option>
                                    {paymentAccounts.map(l => (
                                       <option key={l.id} value={l.id}>{l.name}</option>
                                    ))}
                                 </select>
                                 <ChevronDown size={14} className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
                              </div>
                           </div>
                        </>
                     ) : (
                        <>
                           <div className="grid grid-cols-[160px_1fr] items-center gap-4 mt-2">
                              <label className="text-[14px] text-red-500 font-medium whitespace-nowrap">Paid Through*</label>
                              <div className="relative w-[400px]">
                                 <select 
                                    value={formData.paidThroughId}
                                    onChange={e => handleChange('paidThroughId', e.target.value)}
                                    className="w-full h-9 pl-3 pr-8 text-[14px] border border-slate-200 rounded-md focus:border-[#1e61f0] focus:ring-1 focus:ring-[#1e61f0] outline-none appearance-none bg-white text-slate-700"
                                 >
                                    <option value="">Select an account</option>
                                    {paymentAccounts.map(l => (
                                       <option key={l.id} value={l.id}>{l.name}</option>
                                    ))}
                                 </select>
                                 <ChevronDown size={14} className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
                              </div>
                           </div>

                           <div className="grid grid-cols-[160px_1fr] items-center gap-4 mt-2">
                              <label className="text-[14px] text-slate-800 font-medium whitespace-nowrap">Currency</label>
                              <div className="relative w-[400px] border border-slate-200 rounded-md bg-white">
                                 <select 
                                    value={formData.currency}
                                    onChange={e => handleChange('currency', e.target.value)}
                                    className="w-full h-9 pl-3 pr-6 text-[14px] bg-transparent outline-none appearance-none text-slate-700"
                                 >
                                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                                 </select>
                                 <ChevronDown size={14} className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
                              </div>
                           </div>

                           <div className="mt-8 mb-4">
                              <button 
                                 onClick={() => setIsItemized(false)}
                                 className="flex items-center text-[#1e61f0] font-medium text-[13px] hover:underline"
                              >
                                 &lt; Back to single expense view
                              </button>
                           </div>

                           {/* Itemized Table */}
                           <div className="border border-slate-100 rounded-lg overflow-hidden bg-white mb-6">
                              <table className="w-full text-left border-collapse">
                                 <thead className="bg-[#f9fafb] border-b border-slate-100 text-[11px] font-bold text-red-500 uppercase">
                                    <tr>
                                       <th className="px-4 py-3 font-semibold pb-2">EXPENSE ACCOUNT</th>
                                       <th className="px-4 py-3 font-semibold pb-2">NOTES</th>
                                       <th className="px-4 py-3 font-semibold text-right pb-2">AMOUNT</th>
                                       <th className="px-3 py-3 w-10 text-center pb-2">⋮</th>
                                    </tr>
                                 </thead>
                                 <tbody className="divide-y divide-slate-100 align-top">
                                    {itemizedRows.map((row) => (
                                       <tr key={row.id} className="group hover:bg-slate-50/50">
                                          <td className="p-3">
                                             <div className="relative w-full">
                                                <select 
                                                   value={row.expenseAccountId}
                                                   onChange={e => handleRowChange(row.id, 'expenseAccountId', e.target.value)}
                                                   className="w-full h-9 pl-3 pr-8 text-[13px] border border-slate-200 rounded focus:border-[#1e61f0] focus:ring-1 focus:ring-[#1e61f0] outline-none appearance-none bg-white"
                                                >
                                                   <option value="">Select an account</option>
                                                   {expenseAccounts.map(l => (
                                                      <option key={l.id} value={l.id}>{l.name}</option>
                                                   ))}
                                                </select>
                                                <ChevronDown size={14} className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
                                             </div>
                                          </td>
                                          <td className="p-3">
                                             <textarea 
                                                placeholder="Max. 500 characters"
                                                value={row.notes}
                                                onChange={e => handleRowChange(row.id, 'notes', e.target.value)}
                                                className="w-full h-9 p-2 text-[13px] border border-slate-200 rounded focus:border-[#1e61f0] focus:ring-1 focus:ring-[#1e61f0] outline-none resize-none hide-scrollbar placeholder-slate-400"
                                             />
                                          </td>
                                          <td className="p-3">
                                             <input 
                                                type="number" 
                                                placeholder="0.00"
                                                value={row.amount}
                                                onChange={e => handleRowChange(row.id, 'amount', e.target.value)}
                                                className="w-full h-9 px-3 text-[13px] border border-slate-200 rounded text-right focus:border-[#1e61f0] focus:ring-1 focus:ring-[#1e61f0] outline-none"
                                             />
                                          </td>
                                          <td className="p-3 text-center">
                                             <button 
                                                onClick={() => handleRemoveRow(row.id)}
                                                disabled={itemizedRows.length === 1}
                                                className="mt-1.5 text-slate-300 hover:text-red-500 disabled:opacity-50 transition-colors"
                                             >
                                                <X size={16} />
                                             </button>
                                          </td>
                                       </tr>
                                    ))}
                                 </tbody>
                              </table>
                              
                              <div className="bg-[#fafbfb] border-t border-slate-100 p-3 flex items-center justify-between">
                                 <button 
                                    onClick={handleAddRow}
                                    className="flex items-center gap-1.5 text-[#1e61f0] text-[13px] font-medium px-3 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                                 >
                                    <div className="w-4 h-4 bg-[#1e61f0] text-white rounded-full flex items-center justify-center font-bold pb-0.5 text-[12px]">+</div>
                                    Add New Row
                                 </button>
                                 <div className="flex items-center gap-8 pr-12">
                                    <span className="text-[14px] font-bold text-slate-800">Expense Total ( ₹ )</span>
                                    <span className="text-[14px] font-bold text-slate-800">{itemizedTotal.toFixed(2)}</span>
                                 </div>
                              </div>
                           </div>
                        </>
                     )}

                     {/* Vendor */}
                     <div className="grid grid-cols-[160px_1fr] items-center gap-4 mt-2">
                        <label className="text-[14px] text-slate-800 font-medium whitespace-nowrap">Vendor</label>
                        <div className="flex w-[400px]">
                           <div className="relative flex-1">
                              <select 
                                 value={formData.vendorId}
                                 onChange={e => handleChange('vendorId', e.target.value)}
                                 className="w-full h-9 pl-3 pr-8 text-[14px] border border-slate-200 rounded-l-md focus:border-[#1e61f0] focus:ring-1 focus:ring-[#1e61f0] outline-none appearance-none bg-white text-slate-700"
                              >
                                 <option value=""></option>
                                 {vendors.map(v => (
                                    <option key={v.id} value={v.id}>{v.name}</option>
                                 ))}
                              </select>
                              <ChevronDown size={14} className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
                           </div>
                           <button className="w-9 h-9 bg-[#1e61f0] text-white flex items-center justify-center shrink-0 rounded-r-md border border-[#1e61f0] hover:bg-blue-700 transition-colors">
                              <Search size={16} />
                           </button>
                        </div>
                     </div>

                     {/* Invoice# */}
                     <div className="grid grid-cols-[160px_1fr] items-center gap-4 mt-2">
                        <label className="text-[14px] text-slate-800 font-medium whitespace-nowrap">Invoice#</label>
                        <input 
                           type="text" 
                           value={formData.invoiceNumber}
                           onChange={e => handleChange('invoiceNumber', e.target.value)}
                           className="w-[400px] h-9 px-3 text-[14px] border border-slate-200 rounded-md focus:border-[#1e61f0] focus:ring-1 focus:ring-[#1e61f0] outline-none" 
                        />
                     </div>

                     {/* Notes */}
                     <div className="grid grid-cols-[160px_1fr] items-start gap-4 mt-2">
                        <label className="text-[14px] text-slate-800 font-medium pt-2 whitespace-nowrap">Notes</label>
                        <textarea 
                           placeholder="Max. 500 characters"
                           value={formData.notes}
                           onChange={e => handleChange('notes', e.target.value)}
                           maxLength={500}
                           className="w-[400px] h-24 p-3 text-[14px] border border-slate-200 rounded-md focus:border-[#1e61f0] focus:ring-1 focus:ring-[#1e61f0] outline-none resize-none placeholder:text-slate-400" 
                        />
                     </div>

                     {/* Customer Name */}
                     <div className="grid grid-cols-[160px_1fr] items-center gap-4 mt-2">
                        <label className="text-[14px] text-slate-800 font-medium whitespace-nowrap">Customer Name</label>
                        <div className="flex w-[400px]">
                           <div className="relative flex-1">
                              <select 
                                 value={formData.customerId}
                                 onChange={e => handleChange('customerId', e.target.value)}
                                 className="w-full h-9 pl-3 pr-8 text-[14px] border border-slate-200 rounded-l-md focus:border-[#1e61f0] focus:ring-1 focus:ring-[#1e61f0] outline-none appearance-none bg-white text-slate-700"
                              >
                                 <option value="">Select or add a customer</option>
                                 {customers.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                 ))}
                              </select>
                              <ChevronDown size={14} className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
                           </div>
                           <button className="w-9 h-9 bg-[#1e61f0] text-white flex items-center justify-center shrink-0 rounded-r-md border border-[#1e61f0] hover:bg-blue-700 transition-colors">
                              <Search size={16} />
                           </button>
                        </div>
                     </div>

                     <div className="w-full h-px border-b border-slate-100 my-8"></div>
                  </div>

                  {/* Receipt Upload Section */}
                  <div className="flex flex-col pt-10 px-4">
                     <div className="w-[300px] flex-1 min-h-[300px] max-h-[350px] border border-dashed border-slate-300 rounded-xl bg-white shadow-[0_5px_15px_rgba(0,0,0,0.02)] flex flex-col items-center justify-center p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer group relative overflow-hidden"
                          onClick={() => document.getElementById('receipt-upload').click()}
                     >
                        <input 
                          type="file" 
                          id="receipt-upload" 
                          className="hidden" 
                          onChange={handleFileUpload}
                        />
                        
                        {receiptUrl ? (
                           <div className="flex flex-col items-center w-full">
                              <div className="w-full h-32 bg-slate-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden border border-slate-200">
                                 {receiptFile?.type?.includes('image') ? (
                                    <img src={receiptUrl} alt="Receipt" className="object-cover w-full h-full" />
                                 ) : (
                                    <Paperclip size={32} className="text-slate-400" />
                                 )}
                              </div>
                              <p className="text-[12px] font-medium text-slate-800 break-all px-2 line-clamp-2" title={receiptFile?.name}>{receiptFile?.name || "Receipt uploaded"}</p>
                              <p className="text-[11px] text-emerald-600 font-bold mt-2 flex items-center gap-1">
                                 <Check size={12} strokeWidth={3} /> Uploaded Successfully
                              </p>
                              <button 
                                 onClick={(e) => { e.stopPropagation(); setReceiptFile(null); setReceiptUrl(''); }}
                                 className="mt-4 text-[12px] text-red-500 hover:text-red-700 font-medium"
                              >
                                 Remove Receipt
                              </button>
                           </div>
                        ) : uploading ? (
                           <div className="flex flex-col items-center">
                              <div className="w-10 h-10 border-4 border-blue-200 border-t-[#1e61f0] rounded-full animate-spin mb-4"></div>
                              <p className="text-[13px] font-semibold text-slate-600">Uploading...</p>
                           </div>
                        ) : (
                           <>
                              <div className="w-14 h-14 bg-[#1a2b4b] rounded-2xl flex items-center justify-center shadow-lg mb-5 group-hover:scale-110 transition-transform relative overflow-hidden">
                                  <ImageIcon size={22} color="#fff" className="relative z-10" />
                                  <div className="absolute inset-x-0 bottom-0 h-4 bg-[#1e61f0] opacity-80 mix-blend-screen overflow-hidden">
                                     <div className="absolute top-0 w-[200%] h-[200%] -left-[50%] rounded-[40%] animate-spin-slow bg-white/20"></div>
                                  </div>
                              </div>
                              <h3 className="text-[14px] font-bold text-slate-800 mb-1">Drag or Drop your Receipts</h3>
                              <p className="text-[11px] text-slate-400 mb-6 font-medium">Maximum file size allowed is 10MB</p>
                              
                              <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 group-hover:bg-slate-200 text-slate-700 text-[12px] font-bold rounded shadow-sm border border-slate-200 transition-all">
                                 <UploadCloud size={14} />
                                 Upload your Files
                              </div>
                           </>
                        )}
                     </div>
                  </div>
               </div>
            )}
         </div>
      </div>

      {/* Footer Actions */}
      <div className="border-t border-slate-200 bg-white px-8 py-4 flex items-center gap-3 mt-auto shadow-[0_-5px_15px_rgba(0,0,0,0.02)]">
         <button 
            disabled={loading}
            onClick={() => handleSave(false)}
            className="px-5 py-2 bg-[#1e61f0] hover:bg-[#1a54d1] text-white text-[13px] font-bold rounded-md shadow-sm border border-transparent disabled:opacity-50 flex items-center gap-2"
         >
            Save <span className="opacity-70 text-[10px] bg-white/20 px-1 py-0.5 rounded ml-1 font-mono tracking-tighter">Alt+S</span>
         </button>
         <button 
            disabled={loading}
            onClick={() => handleSave(true)}
            className="px-5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-[13px] font-bold rounded-md shadow-sm disabled:opacity-50 flex items-center gap-2"
         >
            Save and New <span className="opacity-60 text-[10px] bg-slate-100 px-1 py-0.5 rounded ml-1 font-mono tracking-tighter border border-slate-200">Alt+N</span>
         </button>
         <button 
            disabled={loading}
            onClick={() => navigate('/expenses')}
            className="px-5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-[13px] font-bold rounded-md shadow-sm disabled:opacity-50"
         >
            Cancel
         </button>
      </div>

      {showMileageModal && (
        <MileagePreferencesModal onClose={() => setShowMileageModal(false)} />
      )}

    </div>
  );
};

export default ExpenseEntryView;
