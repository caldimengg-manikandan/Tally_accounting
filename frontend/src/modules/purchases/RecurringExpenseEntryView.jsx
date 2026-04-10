import React, { useState, useEffect } from 'react';
import { 
  X, ChevronDown, Calendar, Repeat, 
  CreditCard, Search, User, Tag, 
  Info, AlertCircle, Save, ArrowLeft,
  PlusCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ledgerAPI, purchaseAPI } from '../../services/api';
import CreateAccountModal from './CreateAccountModal';
import CreateCurrencyModal from './CreateCurrencyModal';

const CURRENCIES = [
  'AED', 'AUD', 'BND', 'CAD', 'CNY', 'EUR', 'GBP', 'INR', 'JPY', 'SAR', 'USD', 'ZAR'
];

const RecurringExpenseEntryView = ({ companyId }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialDataLoading, setInitialDataLoading] = useState(true);
  
  // Dropdown Data
  const [ledgers, setLedgers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [customers, setCustomers] = useState([]);

  // UI State
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountSearchTerm, setAccountSearchTerm] = useState('');

  const [isVendorDropdownOpen, setIsVendorDropdownOpen] = useState(false);
  const [vendorSearchTerm, setVendorSearchTerm] = useState('');

  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');

  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
  const [currencySearchTerm, setCurrencySearchTerm] = useState('');

  const [isPaidThroughDropdownOpen, setIsPaidThroughDropdownOpen] = useState(false);
  const [paidThroughSearchTerm, setPaidThroughSearchTerm] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    profileName: '',
    repeatEvery: 'Month',
    startDate: new Date().toISOString().split('T')[0],
    endsOn: '',
    neverExpires: true,
    expenseAccountId: '',
    currency: 'INR',
    amount: '',
    paidThroughId: '',
    vendorId: '',
    notes: '',
    customerId: '',
    tags: []
  });

  useEffect(() => {
    if (!companyId) return;
    
    setInitialDataLoading(true);
    Promise.all([
      ledgerAPI.getByCompany(companyId),
      purchaseAPI.getVendors(companyId),
    ]).then(([ledgersRes, vendorsRes]) => {
      const allLedgers = ledgersRes.data || [];
      setLedgers(allLedgers);
      setVendors(vendorsRes.data || []);
      
      // Filter customers from debtors
      setCustomers(allLedgers.filter(l => l.Group?.name?.includes('Debtor')));
    })
    .catch(err => console.error("Failed to fetch form data:", err))
    .finally(() => setInitialDataLoading(false));
  }, [companyId]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    // Validation
    if (!formData.profileName || !formData.expenseAccountId || !formData.amount || !formData.paidThroughId) {
      alert("Please fill in all required fields marked with *");
      return;
    }

    setLoading(true);
    try {
      // Logic for saving recurring expense would go here
      // For now, we simulate a success and go back
      console.log("Saving Recurring Expense:", formData);
      setTimeout(() => {
        navigate('/expenses');
      }, 500);
    } catch (err) {
      console.error(err);
      alert("Failed to save recurring expense");
    } finally {
      setLoading(false);
    }
  };

  const ACCOUNT_LIST = [
    { category: "Cost Of Goods Sold", accounts: ["[ tryhgtrjh ] 24325", "Cost of Goods Sold", "Job Costing", "Labor", "Materials", "Subcontractor"] },
    { category: "Expense", accounts: ["Advertising And Marketing", "Automobile Expense", "Bad Debt", "Bank Fees and Charges", "Consultant Expense", "Contract Assets", "Credit Card Charges", "Depreciation And Amortisation", "Depreciation Expense", "IT and Internet Expenses", "Janitorial Expense", "Lodging", "Meals and Entertainment", "Merchandise", "Office Supplies", "Other Expenses", "Postage", "Printing and Stationery", "Purchase Discounts", "Raw Materials And Consumables", "Rent Expense", "Repairs and Maintenance", "Salaries and Employee Wages", "Telephone Expense", "Transportation Expense", "Travel Expense"] },
    { category: "Non Current Liability", accounts: ["Construction Loans", "Mortgages"] },
    { category: "Other Current Liability", accounts: ["Employee Reimbursements", "Tax Payable", "TDS Payable"] },
    { category: "Fixed Asset", accounts: ["Furniture and Equipment"] },
    { category: "Other Current Asset", accounts: ["Advance Tax", "Employee Advance", "Prepaid Expenses", "TDS Receivable"] }
  ];

  const paymentAccounts = ledgers.filter(l => l.Group?.name?.includes('Bank') || l.Group?.name?.includes('Cash'));

  const filteredAccountList = ACCOUNT_LIST.map(group => ({
    ...group,
    accounts: group.accounts.filter(acc => 
      acc.toLowerCase().includes(accountSearchTerm.toLowerCase()) || 
      group.category.toLowerCase().includes(accountSearchTerm.toLowerCase())
    )
  })).filter(group => group.accounts.length > 0);

  const handleAccountSelect = (value) => {
    handleChange('expenseAccountId', value);
    setIsAccountDropdownOpen(false);
    setAccountSearchTerm('');
  };

  const filteredVendors = vendors.filter(v => 
    v.name.toLowerCase().includes(vendorSearchTerm.toLowerCase())
  );

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(customerSearchTerm.toLowerCase())
  );

  const handleVendorSelect = (v) => {
    handleChange('vendorId', v.id);
    setIsVendorDropdownOpen(false);
    setVendorSearchTerm('');
  };

  const handleCustomerSelect = (c) => {
    handleChange('customerId', c.id);
    setIsCustomerDropdownOpen(false);
    setCustomerSearchTerm('');
  };

  const filteredCurrencies = CURRENCIES.filter(c => 
    c.toLowerCase().includes(currencySearchTerm.toLowerCase())
  );

  const handleCurrencySelect = (c) => {
    handleChange('currency', c);
    setIsCurrencyDropdownOpen(false);
    setCurrencySearchTerm('');
  };

  const handleNewCurrencyCreated = (newCurrency) => {
    // In a real app, we'd add it to the available currency list via API
    // For now, we just select it
    handleCurrencySelect(newCurrency.code);
    setIsCurrencyModalOpen(false);
  };

  const PAYMENT_ACCOUNT_LIST = [
    { category: "Cash", accounts: ["Cash", "Petty Cash", "Undeposited Funds"] },
    { category: "Other Current Asset", accounts: ["Other Current Asset", "Advance Tax", "Employee Advance", "Prepaid Expenses", "TDS Receivable"] },
    { category: "Fixed Asset", accounts: ["Fixed Asset", "Furniture and Equipment"] },
    { category: "Other Current Liability", accounts: ["Other Current Liability", "Employee Reimbursements", "TDS Payable"] },
    { category: "Non Current Liability", accounts: ["Non Current Liability", "Construction Loans", "Mortgages"] },
    { category: "Equity", accounts: ["Equity", "Capital Stock", "Distributions", "Dividends Paid", "Drawings", "Investments", "Opening Balance Offset", "Owner's Equity"] }
  ];

  const filteredPaymentAccounts = PAYMENT_ACCOUNT_LIST.map(group => ({
    ...group,
    accounts: group.accounts.filter(acc => 
      acc.toLowerCase().includes(paidThroughSearchTerm.toLowerCase()) || 
      group.category.toLowerCase().includes(paidThroughSearchTerm.toLowerCase())
    )
  })).filter(group => group.accounts.length > 0);

  const handlePaidThroughSelect = (value) => {
    handleChange('paidThroughId', value);
    setIsPaidThroughDropdownOpen(false);
    setPaidThroughSearchTerm('');
  };

  const handleNewAccountCreated = (newAccount) => {
    // In a real app, we'd add it to the ledger list. 
    // Here we'll just add it to a temporary group in UI for demo
    // and select it.
    handleAccountSelect(newAccount.name);
    setIsAccountModalOpen(false);
  };

  if (initialDataLoading) {
     return (
        <div className="flex-1 flex items-center justify-center bg-white h-screen">
           <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
     );
  }

  return (
    <div className="bg-[#f8fafc] min-h-screen flex flex-col font-sans">
      
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 px-8 h-16 flex items-center justify-between sticky top-0 z-20">
         <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
               <Repeat size={18} strokeWidth={2.5}/>
            </div>
            <h1 className="text-[18px] font-bold text-slate-800 tracking-tight">New Recurring Expense</h1>
         </div>
         <button onClick={() => navigate('/expenses')} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-all">
            <X size={20} />
         </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-32">
         <div className="max-w-[900px] mx-auto py-10 px-6">
            
            {/* 1. Basic Details Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 mb-8">
               <div className="bg-blue-600/5 px-6 py-3 border-b border-slate-100 flex items-center gap-2 rounded-t-2xl">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <h3 className="text-[12px] font-black text-blue-700 uppercase tracking-widest">Basic Details</h3>
               </div>
               <div className="p-8 space-y-6">
                  
                  {/* Profile Name */}
                  <div className="grid grid-cols-[200px_1fr] items-center gap-8">
                     <label className="text-[14px] font-bold text-slate-700">Profile Name<span className="text-red-500 ml-1">*</span></label>
                     <input 
                        type="text"
                        value={formData.profileName}
                        onChange={e => handleChange('profileName', e.target.value)}
                        className="w-full h-11 px-4 text-[14px] border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                        placeholder="e.g. Monthly Office Rent"
                     />
                  </div>

                  {/* Repeat Every */}
                  <div className="grid grid-cols-[200px_1fr] items-center gap-8">
                     <label className="text-[14px] font-bold text-slate-700">Repeat Every<span className="text-red-500 ml-1">*</span></label>
                     <div className="relative">
                        <select 
                           value={formData.repeatEvery}
                           onChange={e => handleChange('repeatEvery', e.target.value)}
                           className="w-full h-11 pl-4 pr-10 text-[14px] border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all appearance-none bg-white"
                        >
                           <option value="Week">Week</option>
                           <option value="2 Weeks">2 Weeks</option>
                           <option value="Month">Month</option>
                           <option value="2 Months">2 Months</option>
                           <option value="3 Months">3 Months</option>
                           <option value="6 Months">6 Months</option>
                           <option value="Year">Year</option>
                           <option value="2 Years">2 Years</option>
                           <option value="3 Years">3 Years</option>
                           <option value="Custom">Custom</option>
                        </select>
                        <ChevronDown size={16} className="absolute right-4 top-3.5 text-slate-400 pointer-events-none" />
                     </div>
                  </div>

                  {/* Start Date */}
                  <div className="grid grid-cols-[200px_1fr] items-start gap-8">
                     <label className="text-[14px] font-bold text-slate-700 pt-3">Start Date<span className="text-red-500 ml-1">*</span></label>
                     <div className="space-y-2">
                        <div className="relative">
                           <input 
                              type="date"
                              value={formData.startDate}
                              onChange={e => handleChange('startDate', e.target.value)}
                              className="w-full h-11 pl-12 pr-4 text-[14px] border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                           />
                           <Calendar size={18} className="absolute left-4 top-3.5 text-slate-400" />
                        </div>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1.5 px-1">
                           <Info size={12} /> The next expense will be created on {formData.startDate}
                        </p>
                     </div>
                  </div>

                  {/* Ends On */}
                  <div className="grid grid-cols-[200px_1fr] items-start gap-8 pt-2">
                     <label className="text-[14px] font-bold text-slate-700 pt-3">Ends On</label>
                     <div className="space-y-4">
                        <div className="relative">
                           <input 
                              type="date"
                              disabled={formData.neverExpires}
                              value={formData.endsOn}
                              onChange={e => handleChange('endsOn', e.target.value)}
                              className={`w-full h-11 pl-12 pr-4 text-[14px] border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all ${formData.neverExpires ? 'bg-slate-50 opacity-50 cursor-not-allowed' : ''}`}
                           />
                           <Calendar size={18} className="absolute left-4 top-3.5 text-slate-400" />
                        </div>
                        <label className="flex items-center gap-3 cursor-pointer group w-fit">
                           <div 
                              onClick={() => handleChange('neverExpires', !formData.neverExpires)}
                              className={`w-11 h-6 rounded-full p-1 transition-all duration-300 ${formData.neverExpires ? 'bg-emerald-500' : 'bg-slate-200'}`}
                           >
                              <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${formData.neverExpires ? 'translate-x-5' : 'translate-x-0'}`}></div>
                           </div>
                           <span className="text-[13px] font-bold text-slate-600 group-hover:text-slate-900 transition-colors">Never Expires</span>
                        </label>
                     </div>
                  </div>

               </div>
            </div>

            {/* 2. Expense Details Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 mb-8">
               <div className="bg-emerald-600/5 px-6 py-3 border-b border-slate-100 flex items-center gap-2 rounded-t-2xl">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <h3 className="text-[12px] font-black text-emerald-700 uppercase tracking-widest">Expense Details</h3>
               </div>
               <div className="p-8 space-y-6">
                  
                  {/* Expense Account */}
                  <div className="grid grid-cols-[200px_1fr] items-center gap-8">
                     <label className="text-[14px] font-bold text-slate-700">Expense Account<span className="text-red-500 ml-1">*</span></label>
                     <div className="relative">
                        {/* Custom Dropdown Trigger */}
                        <div 
                           onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                           className={`w-full h-11 pl-4 pr-10 flex items-center text-[14px] border border-slate-200 rounded-xl cursor-pointer transition-all bg-white relative ${isAccountDropdownOpen ? 'border-blue-500 ring-4 ring-blue-500/10' : 'hover:border-slate-300'}`}
                        >
                           {formData.expenseAccountId || <span className="text-slate-400">Select an account</span>}
                           <div className="absolute right-4 top-3.5 flex items-center gap-1">
                              <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isAccountDropdownOpen ? 'rotate-180 text-blue-500' : ''}`} />
                           </div>
                        </div>

                        {/* Custom Dropdown Content */}
                        {isAccountDropdownOpen && (
                           <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 origin-top">
                              {/* Search Area */}
                              <div className="p-3 border-b border-slate-50">
                                 <div className="relative">
                                    <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                                    <input 
                                       autoFocus
                                       type="text"
                                       value={accountSearchTerm}
                                       placeholder="Search accounts..."
                                       onChange={e => setAccountSearchTerm(e.target.value)}
                                       className="w-full h-9 pl-9 pr-4 text-[13px] bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none placeholder:text-slate-400"
                                    />
                                 </div>
                              </div>

                              {/* List Area */}
                              <div className="max-h-[300px] overflow-y-auto py-2 custom-scrollbar">
                                 {filteredAccountList.length > 0 ? (
                                    filteredAccountList.map(group => (
                                       <div key={group.category} className="mb-2">
                                          <div className="px-4 py-2 text-[11px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">{group.category}</div>
                                          {group.accounts.map(acc => (
                                             <div 
                                                key={acc}
                                                onClick={() => handleAccountSelect(acc)}
                                                className={`px-6 py-2.5 text-[14px] cursor-pointer transition-colors flex items-center justify-between group
                                                   ${formData.expenseAccountId === acc ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}
                                                `}
                                             >
                                                <span>{acc}</span>
                                                {formData.expenseAccountId === acc && <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>}
                                             </div>
                                          ))}
                                       </div>
                                    ))
                                 ) : (
                                    <div className="p-8 text-center">
                                       <p className="text-[13px] text-slate-400">No accounts found matching "{accountSearchTerm}"</p>
                                    </div>
                                 )}
                              </div>

                              {/* Dropdown Footer Action */}
                              <div className="border-t border-slate-100 p-2 bg-slate-50/30">
                                 <button 
                                    onClick={() => {
                                       setIsAccountDropdownOpen(false);
                                       setIsAccountModalOpen(true);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-[13px] font-bold text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-all group"
                                 >
                                    <PlusCircle size={16} className="text-blue-600 group-hover:text-white" />
                                    New Account
                                 </button>
                              </div>
                           </div>
                        )}
                        
                        {/* Outside Click Backdrop */}
                        {isAccountDropdownOpen && (
                           <div 
                              className="fixed inset-0 z-40" 
                              onClick={() => setIsAccountDropdownOpen(false)}
                           ></div>
                        )}
                     </div>
                  </div>

                  {/* Amount */}
                  <div className="grid grid-cols-[200px_1fr] items-center gap-8">
                     <label className="text-[14px] font-bold text-slate-700">Amount<span className="text-red-500 ml-1">*</span></label>
                     <div className="flex">
                        <div className="relative w-[110px] shrink-0">
                           {/* Custom Currency Trigger */}
                           <div 
                              onClick={() => setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen)}
                              className={`w-full h-11 pl-4 pr-8 flex items-center text-[13px] border border-slate-200 border-r-0 rounded-l-xl cursor-pointer transition-all bg-slate-50 relative font-bold text-slate-600 ${isCurrencyDropdownOpen ? 'border-blue-500 bg-white z-10' : 'hover:bg-white'}`}
                           >
                              {formData.currency}
                              <ChevronDown size={12} className={`absolute right-3 top-4 text-slate-400 transition-transform duration-200 ${isCurrencyDropdownOpen ? 'rotate-180 text-blue-500' : ''}`} />
                           </div>

                           {/* Custom Currency Dropdown */}
                           {isCurrencyDropdownOpen && (
                              <div className="absolute top-[calc(100%+8px)] left-0 w-[200px] bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 origin-top">
                                 {/* Search Area */}
                                 <div className="p-3 border-b border-slate-50">
                                    <div className="relative">
                                       <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                                       <input 
                                          autoFocus
                                          type="text"
                                          value={currencySearchTerm}
                                          placeholder="Search..."
                                          onChange={e => setCurrencySearchTerm(e.target.value)}
                                          className="w-full h-9 pl-9 pr-4 text-[13px] bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none placeholder:text-slate-400 font-normal"
                                       />
                                    </div>
                                 </div>

                                 {/* List Area */}
                                 <div className="max-h-[250px] overflow-y-auto py-2 custom-scrollbar">
                                    {filteredCurrencies.length > 0 ? (
                                       filteredCurrencies.map(c => (
                                          <div 
                                             key={c}
                                             onClick={() => handleCurrencySelect(c)}
                                             className={`px-6 py-2.5 text-[14px] cursor-pointer transition-colors flex items-center justify-between group
                                                ${formData.currency === c ? 'bg-blue-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-50'}
                                             `}
                                          >
                                             <span>{c}</span>
                                             {formData.currency === c && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                                          </div>
                                       ))
                                    ) : (
                                       <div className="p-8 text-center text-slate-400 text-[13px]">No results</div>
                                    )}
                                 </div>

                                 {/* Footer Action */}
                                 <div className="border-t border-slate-100 p-2 bg-slate-50/30">
                                    <button 
                                       onClick={() => {
                                          setIsCurrencyDropdownOpen(false);
                                          setIsCurrencyModalOpen(true);
                                       }}
                                       className="w-full flex items-center gap-2 px-3 py-2 text-[13px] font-bold text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-all group"
                                    >
                                       <PlusCircle size={16} className="text-blue-600 group-hover:text-white" />
                                       New Currency
                                    </button>
                                 </div>
                              </div>
                           )}

                           {/* Outside Click Backdrop */}
                           {isCurrencyDropdownOpen && (
                              <div className="fixed inset-0 z-40" onClick={() => setIsCurrencyDropdownOpen(false)}></div>
                           )}
                        </div>
                        <input 
                           type="number"
                           value={formData.amount}
                           onChange={e => handleChange('amount', e.target.value)}
                           className="w-full h-11 px-4 text-[14px] font-bold border border-slate-200 rounded-r-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                           placeholder="0.00"
                        />
                     </div>
                  </div>


                  {/* Paid Through */}
                  <div className="grid grid-cols-[200px_1fr] items-center gap-8">
                     <label className="text-[14px] font-bold text-slate-700">Paid Through<span className="text-red-500 ml-1">*</span></label>
                     <div className="relative">
                        {/* Custom Paid Through Trigger */}
                        <div 
                           onClick={() => setIsPaidThroughDropdownOpen(!isPaidThroughDropdownOpen)}
                           className={`w-full h-11 pl-4 pr-10 flex items-center text-[14px] border border-slate-200 rounded-xl cursor-pointer transition-all bg-white relative ${isPaidThroughDropdownOpen ? 'border-blue-500 ring-4 ring-blue-500/10' : 'hover:border-slate-300'}`}
                        >
                           <CreditCard size={18} className="absolute left-4 top-3 text-slate-400" />
                           <div className="pl-8">
                              {formData.paidThroughId || <span className="text-slate-400">Select an account</span>}
                           </div>
                           <div className="absolute right-4 top-3.5 flex items-center gap-1">
                              <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isPaidThroughDropdownOpen ? 'rotate-180 text-blue-500' : ''}`} />
                           </div>
                        </div>

                        {/* Custom Paid Through Dropdown */}
                        {isPaidThroughDropdownOpen && (
                           <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 origin-top">
                              {/* Search Area */}
                              <div className="p-3 border-b border-slate-50">
                                 <div className="relative">
                                    <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                                    <input 
                                       autoFocus
                                       type="text"
                                       value={paidThroughSearchTerm}
                                       placeholder="Search accounts..."
                                       onChange={e => setPaidThroughSearchTerm(e.target.value)}
                                       className="w-full h-9 pl-9 pr-4 text-[13px] bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none placeholder:text-slate-400"
                                    />
                                 </div>
                              </div>

                              {/* List Area */}
                              <div className="max-h-[300px] overflow-y-auto py-2 custom-scrollbar">
                                 {filteredPaymentAccounts.length > 0 ? (
                                    filteredPaymentAccounts.map(group => (
                                       <div key={group.category} className="mb-2">
                                          <div className="px-6 py-2 text-[11px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">{group.category}</div>
                                          {group.accounts.map(acc => (
                                             <div 
                                                key={acc}
                                                onClick={() => handlePaidThroughSelect(acc)}
                                                className={`px-6 py-2.5 text-[14px] cursor-pointer transition-colors flex items-center justify-between group
                                                   ${formData.paidThroughId === acc ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}
                                                `}
                                             >
                                                <span>{acc}</span>
                                                {formData.paidThroughId === acc && <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>}
                                             </div>
                                          ))}
                                       </div>
                                    ))
                                 ) : (
                                    <div className="p-8 text-center text-slate-400 text-[13px]">No accounts found matching "{paidThroughSearchTerm}"</div>
                                 )}
                              </div>

                           </div>
                        )}
                        
                        {/* Outside Click Backdrop */}
                        {isPaidThroughDropdownOpen && (
                           <div className="fixed inset-0 z-40" onClick={() => setIsPaidThroughDropdownOpen(false)}></div>
                        )}
                     </div>
                  </div>

               </div>
            </div>

            {/* 3. Vendor & Notes Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 mb-8">
               <div className="bg-amber-600/5 px-6 py-3 border-b border-slate-100 flex items-center gap-2 rounded-t-2xl">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                  <h3 className="text-[12px] font-black text-amber-700 uppercase tracking-widest">Vendor & Notes</h3>
               </div>
               <div className="p-8 space-y-6">
                  
                  {/* Vendor */}
                  <div className="grid grid-cols-[200px_1fr] items-center gap-8">
                     <label className="text-[14px] font-bold text-slate-700">Vendor</label>
                     <div className="relative">
                        {/* Custom Dropdown Trigger */}
                        <div 
                           onClick={() => setIsVendorDropdownOpen(!isVendorDropdownOpen)}
                           className={`w-full h-11 pl-12 pr-10 flex items-center text-[14px] border border-slate-200 rounded-xl cursor-pointer transition-all bg-white relative ${isVendorDropdownOpen ? 'border-blue-500 ring-4 ring-blue-500/10' : 'hover:border-slate-300'}`}
                        >
                           <Search size={18} className="absolute left-4 top-3.5 text-slate-400" />
                           {vendors.find(v => v.id === formData.vendorId)?.name || <span className="text-slate-400">Select or search vendor</span>}
                           <div className="absolute right-4 top-3.5 flex items-center gap-1">
                              <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isVendorDropdownOpen ? 'rotate-180 text-blue-500' : ''}`} />
                           </div>
                        </div>

                        {/* Custom Dropdown Content */}
                        {isVendorDropdownOpen && (
                           <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 origin-top">
                              {/* Search Area */}
                              <div className="p-3 border-b border-slate-50">
                                 <div className="relative">
                                    <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                                    <input 
                                       autoFocus
                                       type="text"
                                       value={vendorSearchTerm}
                                       placeholder="Search vendors..."
                                       onChange={e => setVendorSearchTerm(e.target.value)}
                                       className="w-full h-9 pl-9 pr-4 text-[13px] bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none placeholder:text-slate-400"
                                    />
                                 </div>
                              </div>

                              {/* List Area */}
                              <div className="max-h-[250px] overflow-y-auto py-2 custom-scrollbar">
                                 {filteredVendors.length > 0 ? (
                                    filteredVendors.map(v => (
                                       <div 
                                          key={v.id}
                                          onClick={() => handleVendorSelect(v)}
                                          className={`px-6 py-2.5 text-[14px] cursor-pointer transition-colors flex items-center justify-between group
                                             ${formData.vendorId === v.id ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}
                                          `}
                                       >
                                          <span>{v.name}</span>
                                          {formData.vendorId === v.id && <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>}
                                       </div>
                                    ))
                                 ) : (
                                    <div className="p-8 text-center">
                                       <p className="text-[13px] text-slate-400">No vendors found matching "{vendorSearchTerm}"</p>
                                    </div>
                                 )}
                              </div>

                              {/* Dropdown Footer Action */}
                              <div className="border-t border-slate-100 p-2 bg-slate-50/30">
                                 <button className="w-full flex items-center gap-2 px-3 py-2 text-[13px] font-bold text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-all group">
                                    <PlusCircle size={16} className="text-blue-600 group-hover:text-white" />
                                    New Vendor
                                 </button>
                              </div>
                           </div>
                        )}
                        
                        {/* Outside Click Backdrop */}
                        {isVendorDropdownOpen && (
                           <div className="fixed inset-0 z-40" onClick={() => setIsVendorDropdownOpen(false)}></div>
                        )}
                     </div>
                  </div>

                  {/* Notes */}
                  <div className="grid grid-cols-[200px_1fr] items-start gap-8">
                     <label className="text-[14px] font-bold text-slate-700 pt-3">Notes</label>
                     <div className="space-y-2">
                        <textarea 
                           value={formData.notes}
                           onChange={e => handleChange('notes', e.target.value)}
                           className="w-full h-28 p-4 text-[14px] border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all resize-none"
                           placeholder="Type any additional remarks..."
                           maxLength={500}
                        />
                        <p className="text-[11px] text-slate-400 text-right">{500 - (formData.notes?.length || 0)} characters remaining</p>
                     </div>
                  </div>

               </div>
            </div>

            {/* 4. Customer & Tags Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 mb-8">
               <div className="bg-purple-600/5 px-6 py-3 border-b border-slate-100 flex items-center gap-2 rounded-t-2xl">
                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  <h3 className="text-[12px] font-black text-purple-700 uppercase tracking-widest">Customer & Tags</h3>
               </div>
               <div className="p-8 space-y-6">
                  
                  {/* Customer */}
                  <div className="grid grid-cols-[200px_1fr] items-center gap-8">
                     <label className="text-[14px] font-bold text-slate-700">Customer Name</label>
                     <div className="relative">
                        {/* Custom Dropdown Trigger */}
                        <div 
                           onClick={() => setIsCustomerDropdownOpen(!isCustomerDropdownOpen)}
                           className={`w-full h-11 pl-12 pr-10 flex items-center text-[14px] border border-slate-200 rounded-xl cursor-pointer transition-all bg-white relative ${isCustomerDropdownOpen ? 'border-blue-500 ring-4 ring-blue-500/10' : 'hover:border-slate-300'}`}
                        >
                           <User size={18} className="absolute left-4 top-3.5 text-slate-400" />
                           {customers.find(c => c.id === formData.customerId)?.name || <span className="text-slate-400">Select or search customer</span>}
                           <div className="absolute right-4 top-3.5 flex items-center gap-1">
                              <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isCustomerDropdownOpen ? 'rotate-180 text-blue-500' : ''}`} />
                           </div>
                        </div>

                        {/* Custom Dropdown Content */}
                        {isCustomerDropdownOpen && (
                           <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 origin-top">
                              {/* Search Area */}
                              <div className="p-3 border-b border-slate-50">
                                 <div className="relative">
                                    <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                                    <input 
                                       autoFocus
                                       type="text"
                                       value={customerSearchTerm}
                                       placeholder="Search customers..."
                                       onChange={e => setCustomerSearchTerm(e.target.value)}
                                       className="w-full h-9 pl-9 pr-4 text-[13px] bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none placeholder:text-slate-400"
                                    />
                                 </div>
                              </div>

                              {/* List Area */}
                              <div className="max-h-[250px] overflow-y-auto py-2 custom-scrollbar">
                                 {filteredCustomers.length > 0 ? (
                                    filteredCustomers.map(c => (
                                       <div 
                                          key={c.id}
                                          onClick={() => handleCustomerSelect(c)}
                                          className={`px-6 py-2.5 text-[14px] cursor-pointer transition-colors flex items-center justify-between group
                                             ${formData.customerId === c.id ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}
                                          `}
                                       >
                                          <span>{c.name}</span>
                                          {formData.customerId === c.id && <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>}
                                       </div>
                                    ))
                                 ) : (
                                    <div className="p-8 text-center">
                                       <p className="text-[13px] text-slate-400">No customers found matching "{customerSearchTerm}"</p>
                                    </div>
                                 )}
                              </div>

                              {/* Dropdown Footer Action */}
                              <div className="border-t border-slate-100 p-2 bg-slate-50/30">
                                 <button className="w-full flex items-center gap-2 px-3 py-2 text-[13px] font-bold text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-all group">
                                    <PlusCircle size={16} className="text-blue-600 group-hover:text-white" />
                                    New Customer
                                 </button>
                              </div>
                           </div>
                        )}
                        
                        {/* Outside Click Backdrop */}
                        {isCustomerDropdownOpen && (
                           <div className="fixed inset-0 z-40" onClick={() => setIsCustomerDropdownOpen(false)}></div>
                        )}
                     </div>
                  </div>

                  {/* Tags */}
                  <div className="grid grid-cols-[200px_1fr] items-start gap-8">
                     <label className="text-[14px] font-bold text-slate-700 pt-3">Reporting Tags</label>
                     <div className="flex flex-wrap gap-2 pt-1">
                        <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-blue-600 hover:text-white border border-slate-200 rounded-full text-[13px] font-bold text-slate-600 transition-all group">
                           <Tag size={12} className="group-hover:text-white" />
                           Associate Tags
                        </button>
                     </div>
                  </div>

               </div>
            </div>

         </div>
      </div>

      {/* Sticky Footer */}
      <div className="bg-white border-t border-slate-200 px-8 py-5 h-20 flex items-center gap-4 fixed bottom-0 left-[var(--sidebar-width)] right-0 z-20 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
         <button 
            onClick={handleSave}
            disabled={loading}
            className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[14px] font-black rounded-xl shadow-lg shadow-blue-600/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
         >
            {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <Save size={18}/>}
            SAVE
         </button>
         <button 
            onClick={() => navigate('/expenses')}
            disabled={loading}
            className="px-8 py-2.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 text-[14px] font-black rounded-xl active:scale-95 transition-all disabled:opacity-50"
         >
            CANCEL
         </button>
      </div>
      {/* Modals */}
      {isAccountModalOpen && (
         <CreateAccountModal 
            onClose={() => setIsAccountModalOpen(false)}
            onSave={handleNewAccountCreated}
            accounts={ACCOUNT_LIST}
         />
      )}
      {isCurrencyModalOpen && (
         <CreateCurrencyModal 
            onClose={() => setIsCurrencyModalOpen(false)}
            onSave={handleNewCurrencyCreated}
         />
      )}

    </div>
  );
};

export default RecurringExpenseEntryView;
