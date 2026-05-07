import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Search, Paperclip, UploadCloud, 
  ChevronDown, HelpCircle, X, Check, Image as ImageIcon,
  PlusCircle, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { voucherAPI, ledgerAPI, purchaseAPI, inventoryAPI, costCenterAPI, companyAPI, projectAPI } from '../../services/api';
import MileagePreferencesModal from './MileagePreferencesModal';
import VendorModal from './VendorModal';
import CreateAccountModal from './CreateAccountModal';
import CreateCurrencyModal from './CreateCurrencyModal';
import CreateCustomerModal from '../sales/CreateCustomerModal';

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

const ACCOUNT_LIST = [
  { category: "Cost Of Goods Sold", accounts: ["[ tryhgtrjh ] 24325", "Cost of Goods Sold", "Job Costing", "Labor", "Materials", "Subcontractor"] },
  { category: "Expense", accounts: ["Advertising And Marketing", "Automobile Expense", "Bad Debt", "Bank Fees and Charges", "Consultant Expense", "Contract Assets", "Credit Card Charges", "Depreciation And Amortisation", "Depreciation Expense", "IT and Internet Expenses", "Janitorial Expense", "Lodging", "Meals and Entertainment", "Merchandise", "Office Supplies", "Other Expenses", "Postage", "Printing and Stationery", "Purchase Discounts", "Raw Materials And Consumables", "Rent Expense", "Repairs and Maintenance", "Salaries and Employee Wages", "Telephone Expense", "Transportation Expense", "Travel Expense"] },
  { category: "Non Current Liability", accounts: ["Construction Loans", "Mortgages"] },
  { category: "Other Current Liability", accounts: ["Employee Reimbursements", "Tax Payable", "TDS Payable"] },
  { category: "Fixed Asset", accounts: ["Furniture and Equipment"] },
  { category: "Other Current Asset", accounts: ["Advance Tax", "Employee Advance", "Prepaid Expenses", "TDS Receivable"] }
];

const PAID_THROUGH_LIST = [
  { category: "Cash", accounts: ["Cash", "Petty Cash", "Undeposited Funds"] },
  { category: "Other Current Asset", accounts: ["Advance Tax", "Employee Advance", "Prepaid Expenses", "TDS Receivable"] },
  { category: "Fixed Asset", accounts: ["Furniture and Equipment"] },
  { category: "Other Current Liability", accounts: ["Employee Reimbursements", "TDS Payable"] },
  { category: "Non Current Liability", accounts: ["Construction Loans", "Mortgages"] },
  { category: "Equity", accounts: ["Capital Stock", "Distributions", "Dividends Paid", "Drawings", "Investments", "Opening Balance Offset", "Owner's Equity"] }
];

const ExpenseEntryView = ({ companyId }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Record Expense');
  
  // Data
  const [ledgers, setLedgers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [costCenters, setCostCenters] = useState([]);
  const [projects, setProjects] = useState([]);
  
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
    customerId: '',
    projectId: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Upload State
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptUrl, setReceiptUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showMileageModal, setShowMileageModal] = useState(false);
  const [showVendorModal, setShowVendorModal] = useState(false);

  // Bulk Rows State
  const initialBulkRow = () => ({
    id: Date.now() + Math.random(),
    date: new Date().toISOString().split('T')[0],
    expenseAccountId: '',
    paidThroughId: '',
    vendorId: '',
    amount: '',
    currency: 'INR',
    isTaxInclusive: true,
    notes: '',
    customerId: '',
    costCenterId: '',
    projectId: '',
    isBillable: false,
    tags: []
  });

  // UI States for Searchable Dropdowns
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [accountSearchTerm, setAccountSearchTerm] = useState('');
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
  const [currencySearchTerm, setCurrencySearchTerm] = useState('');
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);

  const [isPaidThroughDropdownOpen, setIsPaidThroughDropdownOpen] = useState(false);
  const [paidThroughSearchTerm, setPaidThroughSearchTerm] = useState('');

  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  // Validation and Messaging States
  const [showValidation, setShowValidation] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [bulkRows, setBulkRows] = useState(Array(5).fill(null).map((_, i) => ({
    ...initialBulkRow(),
    id: i + 1
  })));

  useEffect(() => {
    if (!companyId) return;
    
    // Fetch Ledgers, Vendors, Cost Centers, and Projects
    Promise.all([
      ledgerAPI.getByCompany(companyId),
      purchaseAPI.getVendors(companyId),
      costCenterAPI.getByCompany(companyId),
      projectAPI.getByCompany(companyId)
    ]).then(([ledgersRes, vendorsRes, costCentersRes, projectsRes]) => {
      setLedgers(ledgersRes.data || []);
      setVendors(vendorsRes.data || []);
      setCostCenters(costCentersRes.data || []);
      setProjects(projectsRes.data || []);
    }).catch(err => console.error("Failed to fetch initial data:", err));
  }, [companyId]);

  const handleChange = (field, value) => {
    if (field === 'vendorId' && value === 'new-vendor') {
       setShowVendorModal(true);
       return;
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleVendorCreated = (newVendor) => {
    setVendors(prev => [...prev, newVendor]);
    setFormData(prev => ({ ...prev, vendorId: newVendor.id }));
    setShowVendorModal(false);
  };

  const ensureLedgerId = async (idOrSuggestion) => {
    if (typeof idOrSuggestion !== 'string' || !idOrSuggestion.startsWith('suggestion-')) {
       return idOrSuggestion;
    }
    
    // It's a suggestion, need to create it
    const name = idOrSuggestion.replace('suggestion-', '');
    
    // Find the suggestion object to get categorySource
    const allSuggestions = [
      ...ACCOUNT_LIST.flatMap(c => c.accounts.map(n => ({ name: n, cat: c.category }))),
      ...PAID_THROUGH_LIST.flatMap(c => c.accounts.map(n => ({ name: n, cat: c.category })))
    ];
    const sug = allSuggestions.find(s => s.name === name);
    
    const categoryMap = {
      "Cost Of Goods Sold": "Direct Expenses",
      "Expense": "Indirect Expenses",
      "Non Current Liability": "Loans (Liability)",
      "Other Current Liability": "Current Liabilities",
      "Fixed Asset": "Fixed Assets",
      "Other Current Asset": "Current Assets",
      "Cash": "Cash-in-Hand",
      "Equity": "Capital Account"
    };

    try {
      const res = await ledgerAPI.create({
        name: name,
        groupName: categoryMap[sug?.cat] || (PAID_THROUGH_LIST.some(c => c.accounts.includes(name)) ? "Cash-in-Hand" : "Indirect Expenses"),
        openingBalance: 0,
        companyId: companyId
      });
      const newLedger = res.data;
      setLedgers(prev => [...prev, newLedger]);
      return newLedger.id;
    } catch (err) {
      console.error("Auto-creation failed for:", name, err);
      throw new Error(`Failed to create account: ${name}`);
    }
  };

  const handleSave = async (isNew = false) => {
    setLoading(true);
    setError(null);
    setShowValidation(true);
    
    try {
      if (activeTab === 'Bulk Add Expenses') {
        const validRows = bulkRows.filter(r => r.expenseAccountId && r.paidThroughId && parseFloat(r.amount) > 0);
        
        if (validRows.length === 0) {
          throw new Error("Please fill in at least one complete expense row (Account, Paid Through, and Amount).");
        }

        for (const row of validRows) {
          const expenseId = await ensureLedgerId(row.expenseAccountId);
          const paidThroughId = await ensureLedgerId(row.paidThroughId);
          
          const vendorInfo = vendors.find(v => v.id === row.vendorId);
          const customerInfo = ledgers.find(l => l.id === row.customerId);
          const narrationData = {
            notes: '',
            vendor: vendorInfo?.name || '',
            customer: customerInfo?.name || '',
            costCenter: row.costCenterId,
            isBillable: row.isBillable
          };

          const payload = {
            companyId,
            voucherType: 'Payment',
            date: row.date,
            narration: JSON.stringify(narrationData),
            entries: [
              { ledgerId: expenseId, debit: parseFloat(row.amount), credit: 0 },
              { ledgerId: paidThroughId, debit: 0, credit: parseFloat(row.amount) }
            ],
            projectId: row.projectId || null
          };
          await voucherAPI.create(payload);
        }
        navigate('/expenses'); // Return to list for bulk adds
        return;
      } else {
        if (!formData.paidThroughId) {
          throw new Error("Please select a Paid Through account.");
        }

        const paidThroughId = await ensureLedgerId(formData.paidThroughId);
        let entries = [];
        let totalAmount = 0;

        if (isItemized) {
          const validRows = itemizedRows.filter(r => r.expenseAccountId && parseFloat(r.amount) > 0);
          if (validRows.length === 0) {
            throw new Error("Please add at least one valid expense item with an account and amount.");
          }
          
          for (const r of validRows) {
            const amt = parseFloat(r.amount);
            totalAmount += amt;
            const expId = await ensureLedgerId(r.expenseAccountId);
            entries.push({ ledgerId: expId, debit: amt, credit: 0 });
          };
          entries.push({ ledgerId: paidThroughId, debit: 0, credit: totalAmount });
        } else {
          if (!formData.date || !formData.expenseAccountId || !formData.amount) {
            throw new Error("Please fill out all required fields: Date, Expense Account, and Amount.");
          }
          const expenseId = await ensureLedgerId(formData.expenseAccountId);
          totalAmount = parseFloat(formData.amount);
          entries = [
            { ledgerId: expenseId, debit: totalAmount, credit: 0 },
            { ledgerId: paidThroughId, debit: 0, credit: totalAmount }
          ];
        }

        const vendorInfo = vendors.find(v => v.id === formData.vendorId);
        const customerInfo = ledgers.find(l => l.id === formData.customerId);
        const narrationData = {
          notes: formData.notes,
          vendor: vendorInfo?.name || '',
          invoiceNumber: formData.invoiceNumber,
          customer: customerInfo?.name || '',
          receiptUrl: receiptUrl
        };

        const payload = {
          companyId,
          voucherType: 'Payment',
          date: formData.date,
          narration: JSON.stringify(narrationData),
          entries: entries,
          projectId: formData.projectId || null
        };
        const res = await voucherAPI.create(payload);
        const newId = res.data.voucher?.id;

        setSuccessMessage("Expense recorded successfully!");
        setShowValidation(false);
        setTimeout(() => setSuccessMessage(''), 5000);

        if (isNew) {
          // Reset states for "Save and New"
          setFormData(prev => ({
            ...prev,
            date: new Date().toISOString().split('T')[0],
            expenseAccountId: '',
            amount: '',
            invoiceNumber: '',
            notes: '',
            customerId: ''
          }));
          setItemizedRows([{ id: Date.now(), expenseAccountId: '', notes: '', amount: '' }]);
          setBulkRows(Array(5).fill(null).map((_, i) => ({ ...initialBulkRow(), id: i + 1 })));
          window.scrollTo(0, 0);
        } else {
          // Redirect to the newly created expense detail view
          navigate(`/expenses?id=${newId}`);
        }
        return;
      }
    } catch (err) {
      console.error(err);
      const errorMessage = err.response?.data?.error || err.message || "Failed to save expense.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkRowChange = (id, field, value) => {
    if (field === 'vendorId' && value === 'new-vendor') {
       setShowVendorModal(true);
       // We'll update the row once the vendor is created, 
       // but for now, we need to know which row triggered it.
       // For simplicity in bulk mode, we might just open the modal.
       return;
    }
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

  const handleCustomerCreated = (newCustomer) => {
    if (!newCustomer) {
      setShowCustomerModal(false);
      return;
    }
    // Select the new customer name/id
    setLedgers(prev => [...prev, newCustomer]);
    if (newCustomer.id) {
       handleCustomerSelect(newCustomer.id);
    }
    setShowCustomerModal(false);
  };

  // Grouping logic for ledgers with suggestions
  const getGroupedLedgers = (filterFn, hardcodedList = []) => {
     const groups = {};
     
     const whitelistedLedgers = ledgers.filter(filterFn);
     const whitelistedLedgerNames = new Set(whitelistedLedgers.map(l => l.name.toLowerCase()));
     
     // 1. Add real ledgers from DB
     whitelistedLedgers.forEach(l => {
        const groupName = l.Group?.name || 'Other';
        if (!groups[groupName]) groups[groupName] = [];
        groups[groupName].push(l);
     });
     
     // 2. Add hardcoded suggestions if they don't exist in the whitelist yet
     hardcodedList.forEach(categoryObj => {
        const catName = categoryObj.category;
        categoryObj.accounts.forEach(accName => {
           if (!whitelistedLedgerNames.has(accName.toLowerCase())) {
              if (!groups[catName]) groups[catName] = [];
              // Add a "virtual" ledger object
              groups[catName].push({
                 id: `suggestion-${accName}`,
                 name: accName,
                 categorySource: catName, // needed for auto-creation
                 isSuggestion: true
              });
           }
        });
     });
     
     return Object.entries(groups).map(([category, accounts]) => ({ category, accounts }));
  };

  // derived data
  const handleCurrencySelect = (code) => {
    handleChange('currency', code);
    setIsCurrencyDropdownOpen(false);
    setCurrencySearchTerm('');
  };

  const rawExpenseAccounts = ledgers.filter(l => !l.Group?.name?.includes('Bank') && !l.Group?.name?.includes('Cash') && !l.Group?.name?.includes('Debtor') && !l.Group?.name?.includes('Creditor'));
  const rawPaymentAccounts = ledgers.filter(l => l.Group?.name?.includes('Bank') || l.Group?.name?.includes('Cash') || l.Group?.name?.includes('Liability'));
  
  // Combine with hardcoded suggestions for all views
  const expenseAccounts = [
    ...rawExpenseAccounts,
    ...ACCOUNT_LIST.flatMap(c => c.accounts.map(name => ({ 
      id: `suggestion-${name}`, 
      name, 
      isSuggestion: true, 
      categorySource: c.category 
    })))
  ].filter((v, i, a) => a.findIndex(t => t.name.toLowerCase() === v.name.toLowerCase()) === i);

  const paymentAccounts = [
    ...rawPaymentAccounts,
    ...PAID_THROUGH_LIST.flatMap(c => c.accounts.map(name => ({ 
      id: `suggestion-${name}`, 
      name, 
      isSuggestion: true, 
      categorySource: c.category 
    })))
  ].filter((v, i, a) => a.findIndex(t => t.name.toLowerCase() === v.name.toLowerCase()) === i);

  const customerLedgers = ledgers.filter(l => 
    l.Group?.name?.toLowerCase().includes('debtor') || 
    l.groupName?.toLowerCase().includes('debtor') ||
    l.Group?.name?.toLowerCase().includes('customer') ||
    l.groupName?.toLowerCase().includes('customer')
  );

  const itemizedTotal = React.useMemo(() => {
    return itemizedRows.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0);
  }, [itemizedRows]);

  // Grouped and filtered account list for searchable dropdown
  const filteredAccountList = getGroupedLedgers(
    l => !l.Group?.name?.includes('Bank') && !l.Group?.name?.includes('Cash') && !l.Group?.name?.includes('Debtor') && !l.Group?.name?.includes('Creditor') &&
         (l.name.toLowerCase().includes(accountSearchTerm.toLowerCase()) || (l.Group?.name || '').toLowerCase().includes(accountSearchTerm.toLowerCase())),
    ACCOUNT_LIST.map(g => ({
       ...g,
       accounts: g.accounts.filter(a => a.toLowerCase().includes(accountSearchTerm.toLowerCase()))
    }))
  );

  const handleAccountSelect = async (account) => {
    let finalId = account.id;
    
    if (account.isSuggestion) {
      // Auto-create ledger
      try {
        setLoading(true);
        // Map category to standard Tally group
        const categoryMap = {
          "Cost Of Goods Sold": "Direct Expenses",
          "Expense": "Indirect Expenses",
          "Non Current Liability": "Loans (Liability)",
          "Other Current Liability": "Current Liabilities",
          "Fixed Asset": "Fixed Assets",
          "Other Current Asset": "Current Assets"
        };
        
        const res = await ledgerAPI.create({
          name: account.name,
          groupName: categoryMap[account.categorySource] || "Indirect Expenses",
          openingBalance: 0,
          companyId: companyId
        });
        
        const newLedger = res.data;
        setLedgers(prev => [...prev, newLedger]);
        finalId = newLedger.id;
      } catch (err) {
        console.error("Failed to auto-create ledger:", err);
        setError("Failed to create the selected account. Please try again.");
        setLoading(false);
        return;
      } finally {
        setLoading(false);
      }
    }

    handleChange('expenseAccountId', finalId);
    setIsAccountDropdownOpen(false);
    setAccountSearchTerm('');
  };

  const handleNewAccountCreated = (newAccount) => {
    setLedgers(prev => [...prev, newAccount]);
    handleAccountSelect(newAccount.id);
    setIsAccountModalOpen(false);
  };

  const filteredCurrencies = CURRENCIES.filter(c => 
    c.toLowerCase().includes(currencySearchTerm.toLowerCase())
  );

  const handleNewCurrencyCreated = (newCurrency) => {
    // In a real app, we'd add it to a dynamic list.
    // For now, we just select it.
    handleCurrencySelect(newCurrency.code);
    setIsCurrencyModalOpen(false);
  };

  const filteredPaidThroughList = getGroupedLedgers(
    l => (
      l.Group?.name?.includes('Bank') || 
      l.Group?.name?.includes('Cash') || 
      l.Group?.name?.includes('Liability') || 
      l.Group?.name?.includes('Asset') || 
      l.Group?.name?.includes('Equity') || 
      l.Group?.name?.includes('Capital Account') ||
      l.Group?.name?.includes('Current Assets')
    ) && (
      l.name.toLowerCase().includes(paidThroughSearchTerm.toLowerCase()) || 
      (l.Group?.name || '').toLowerCase().includes(paidThroughSearchTerm.toLowerCase())
    ),
    PAID_THROUGH_LIST.map(g => ({
       ...g,
       accounts: g.accounts.filter(a => {
          const search = paidThroughSearchTerm.toLowerCase().replace(/['\s]/g, '');
          const target = a.toLowerCase().replace(/['\s]/g, '');
          return target.includes(search);
       })
    }))
  );

  const handlePaidThroughSelect = async (account) => {
    let finalId = account.id;

    if (account.isSuggestion) {
      try {
        setLoading(true);
        const categoryMap = {
          "Cash": "Cash-in-Hand",
          "Other Current Asset": "Current Assets",
          "Fixed Asset": "Fixed Assets",
          "Other Current Liability": "Current Liabilities",
          "Non Current Liability": "Loans (Liability)",
          "Equity": "Capital Account"
        };

        const res = await ledgerAPI.create({
          name: account.name,
          groupName: categoryMap[account.categorySource] || "Cash-in-Hand",
          openingBalance: 0,
          companyId: companyId
        });

        const newLedger = res.data;
        setLedgers(prev => [...prev, newLedger]);
        finalId = newLedger.id;
      } catch (err) {
        console.error("Failed to auto-create payment account:", err);
        setError("Failed to create the selected payment account.");
        setLoading(false);
        return;
      } finally {
        setLoading(false);
      }
    }

    handleChange('paidThroughId', finalId);
    setIsPaidThroughDropdownOpen(false);
    setPaidThroughSearchTerm('');
  };

  const filteredCustomerList = customerLedgers.filter(c => 
    c.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(customerSearchTerm.toLowerCase()))
  );

  const handleCustomerSelect = (customerId) => {
    handleChange('customerId', customerId);
    setIsCustomerDropdownOpen(false);
    setCustomerSearchTerm('');
  };

  return (
    <div className="bg-white min-h-screen flex flex-col font-sans">
      
      {/* Header Tabs */}
      <div className="border-b border-slate-200 bg-white sticky top-0 z-50 px-6 py-3 flex items-center justify-between shadow-sm">
         <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/expenses')}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="flex gap-6 ml-2">
               {['Record Expense', 'Record Mileage', 'Bulk Add Expenses'].map(tab => (
                  <button
                     key={tab}
                     onClick={() => {
                         setActiveTab(tab);
                         if (tab === 'Record Mileage') setShowMileageModal(true);
                      }}
                     className={`pb-1 text-[15px] font-bold transition-all relative ${
                        activeTab === tab 
                        ? 'text-[#1e61f0]' 
                        : 'text-slate-500 hover:text-blue-700'
                     }`}
                  >
                     {tab}
                     {activeTab === tab && (
                        <div className="absolute -bottom-[13px] left-0 right-0 h-0.5 bg-[#1e61f0] rounded-t-lg"></div>
                     )}
                  </button>
               ))}
            </div>
         </div>
         <button onClick={() => navigate('/expenses')} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-md transition-all">
            <X size={20} />
         </button>
      </div>

      <div className="flex-1 overflow-auto bg-[#f9fafb]">
         <div className="max-w-full w-fit mx-auto p-6">
             {/* Messaging Banners */}
             {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
                   <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                      <AlertCircle size={18} className="text-red-600" />
                   </div>
                   <div className="flex-1">
                      <p className="text-[13px] font-bold text-red-800">Please check your entries</p>
                      <p className="text-[12px] text-red-600 opacity-90">{error}</p>
                   </div>
                   <button onClick={() => setError(null)} className="p-1 hover:bg-red-100 rounded text-red-400"><X size={16} /></button>
                </div>
             )}

             {successMessage && (
                <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
                   <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                      <Check size={18} className="text-emerald-600" />
                   </div>
                   <div className="flex-1 text-[13px] font-bold text-emerald-800">{successMessage}</div>
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
                                    {customerLedgers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                 </select>
                              </td>
                              <td className="p-2 align-top">
                                 <select 
                                    value={row.projectId}
                                    onChange={e => handleBulkRowChange(row.id, 'projectId', e.target.value)}
                                    className="w-[160px] h-9 px-2 text-[13px] border border-slate-200 rounded focus:border-blue-500 outline-none appearance-none"
                                 >
                                    <option value="">Select project</option>
                                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
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
                     {/* Project */}
                     <div className="grid grid-cols-[160px_1fr] items-center gap-4 mt-2">
                        <label className="text-[14px] text-slate-800 font-medium whitespace-nowrap">Project</label>
                        <div className="flex w-[400px]">
                           <div className="relative flex-1">
                              <select 
                                 value={formData.projectId}
                                 onChange={e => handleChange('projectId', e.target.value)}
                                 className="w-full h-9 pl-3 pr-8 text-[14px] border border-slate-200 rounded-md focus:border-[#1e61f0] focus:ring-1 focus:ring-[#1e61f0] outline-none appearance-none bg-white text-slate-700"
                              >
                                 <option value="">Select or associate project</option>
                                 {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                 ))}
                              </select>
                              <ChevronDown size={14} className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
                           </div>
                        </div>
                     </div>
                     {/* Form Section */}
                     {!isItemized ? (
                        <>
                           <div className="grid grid-cols-[160px_1fr] items-center gap-4">
                              <label className="text-[14px] text-red-500 font-medium whitespace-nowrap">Date*</label>
                               <div className="relative w-[280px]">
                                  <input 
                                     type="date" 
                                     value={formData.date}
                                     onChange={e => handleChange('date', e.target.value)}
                                     className={`w-full h-9 px-3 text-[14px] border rounded-md outline-none transition-all ${
                                        showValidation && !formData.date 
                                        ? 'border-red-500 bg-red-50/10' 
                                        : 'border-slate-200 focus:border-[#1e61f0] focus:ring-1 focus:ring-[#1e61f0]'
                                     } text-slate-700 bg-white`} 
                                  />
                                  {showValidation && !formData.date && <p className="text-[10px] text-red-500 mt-1 font-bold italic underline">Date is required</p>}
                               </div>
                           </div>

                            <div className="grid grid-cols-[160px_1fr] items-start gap-4">
                               <label className="text-[14px] text-red-500 font-medium pt-2 whitespace-nowrap">Expense Account*</label>
                               <div>
                                  <div className="flex w-[400px]">
                                     <div className="relative flex-1">
                                        {/* Custom Dropdown Trigger */}
                                         <div 
                                            onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                                            className={`w-full h-9 pl-3 pr-8 flex items-center text-[14px] border rounded-l-md cursor-pointer transition-all bg-white relative ${isAccountDropdownOpen ? 'border-[#1e61f0] ring-1 ring-[#1e61f0]' : 'hover:border-slate-300'} ${showValidation && !formData.expenseAccountId ? 'border-red-500 bg-red-50/10' : 'border-slate-200'} text-slate-700`}
                                         >
                                            {ledgers.find(l => l.id === formData.expenseAccountId)?.name || 
                                             (formData.expenseAccountId && typeof formData.expenseAccountId === 'string' && formData.expenseAccountId.startsWith('suggestion-') ? formData.expenseAccountId.replace('suggestion-', '') : null) || 
                                             <span className="text-slate-400">Select an account</span>}
                                           <ChevronDown size={14} className={`absolute right-3 top-2.5 text-slate-400 transition-transform duration-200 ${isAccountDropdownOpen ? 'rotate-180 text-[#1e61f0]' : ''}`} />
                                        </div>
                                        {showValidation && !formData.expenseAccountId && <p className="text-[10px] text-red-500 mt-1 font-bold italic underline">Please select an expense account</p>}

                                        {/* Custom Dropdown Content */}
                                        {isAccountDropdownOpen && (
                                           <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150 origin-top">
                                              {/* Search Area */}
                                              <div className="p-2 border-b border-slate-50">
                                                 <div className="relative">
                                                    <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                                                    <input 
                                                       autoFocus
                                                       type="text"
                                                       value={accountSearchTerm}
                                                       placeholder="Search accounts..."
                                                       onChange={e => setAccountSearchTerm(e.target.value)}
                                                       className="w-full h-8 pl-9 pr-4 text-[13px] bg-slate-50 border-none rounded focus:ring-1 focus:ring-blue-500/20 outline-none placeholder:text-slate-400"
                                                    />
                                                 </div>
                                              </div>

                                              {/* List Area */}
                                              <div className="max-h-[280px] overflow-y-auto py-1">
                                                 {filteredAccountList.length > 0 ? (
                                                    filteredAccountList.map(group => (
                                                       <div key={group.category}>
                                                          <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">{group.category}</div>
                                                          {group.accounts.map(acc => (
                                                             <div 
                                                                key={acc.id}
                                                                onClick={() => handleAccountSelect(acc)}
                                                                className={`px-4 py-2 text-[13px] cursor-pointer transition-colors flex items-center justify-between
                                                                   ${formData.expenseAccountId === acc.id ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}
                                                                `}
                                                             >
                                                                <span>{acc.name}</span>
                                                                {formData.expenseAccountId === acc.id && <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>}
                                                             </div>
                                                          ))}
                                                       </div>
                                                    ))
                                                 ) : (
                                                    <div className="p-6 text-center">
                                                       <p className="text-[12px] text-slate-400">No matching accounts</p>
                                                    </div>
                                                 )}
                                              </div>

                                              {/* Dropdown Footer Action */}
                                              <div className="border-t border-slate-100 p-1.5 bg-slate-50/30">
                                                 <button 
                                                    onClick={(e) => {
                                                       e.stopPropagation();
                                                       setIsAccountDropdownOpen(false);
                                                       setIsAccountModalOpen(true);
                                                    }}
                                                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] font-bold text-[#1e61f0] hover:bg-[#1e61f0] hover:text-white rounded transition-all group"
                                                 >
                                                    <PlusCircle size={14} className="text-[#1e61f0] group-hover:text-white" />
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
                                     <button className="w-9 h-9 bg-[#1e61f0] text-white flex items-center justify-center shrink-0 rounded-r-md border border-[#1e61f0] hover:bg-blue-700 transition-colors">
                                        <Search size={16} />
                                     </button>
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
                              <label className="text-[13px] text-red-500 font-bold whitespace-nowrap">Amount*</label>
                              <div className="flex w-[400px]">
                                 <div className="relative w-[100px] shrink-0">
                                    {/* Custom Currency Trigger */}
                                    <div 
                                       onClick={() => setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen)}
                                       className={`w-full h-9 pl-3 pr-8 flex items-center text-[13px] border border-slate-200 border-r-0 rounded-l-md cursor-pointer transition-all bg-slate-50 relative font-bold text-slate-600 ${isCurrencyDropdownOpen ? 'border-[#1e61f0] bg-white z-20 ring-1 ring-[#1e61f0]' : 'hover:bg-white'}`}
                                    >
                                       {formData.currency}
                                       <ChevronDown size={14} className={`absolute right-3 top-2.5 text-slate-400 transition-transform duration-200 ${isCurrencyDropdownOpen ? 'rotate-180 text-blue-500' : ''}`} />
                                    </div>

                                    {/* Custom Currency Dropdown */}
                                    {isCurrencyDropdownOpen && (
                                       <div className="absolute top-[calc(100%+4px)] left-0 w-[220px] bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150 origin-top">
                                          <div className="p-2 border-b border-slate-50">
                                             <div className="relative">
                                                <Search size={14} className="absolute left-3 top-2 text-slate-400" />
                                                <input 
                                                   autoFocus
                                                   type="text"
                                                   value={currencySearchTerm}
                                                   placeholder="Search..."
                                                   onChange={e => setCurrencySearchTerm(e.target.value)}
                                                   className="w-full h-8 pl-9 pr-4 text-[13px] bg-slate-50 border-none rounded focus:ring-1 focus:ring-blue-500/20 outline-none placeholder:text-slate-400 font-normal"
                                                />
                                             </div>
                                          </div>

                                          <div className="max-h-[250px] overflow-y-auto py-1 custom-scrollbar">
                                             {filteredCurrencies.length > 0 ? (
                                                filteredCurrencies.map(c => (
                                                   <div 
                                                      key={c}
                                                      onClick={() => handleCurrencySelect(c)}
                                                      className={`px-4 py-2 text-[13px] cursor-pointer transition-colors flex items-center justify-between group
                                                         ${formData.currency === c ? 'bg-blue-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-50'}
                                                      `}
                                                   >
                                                      <span>{c}</span>
                                                      {formData.currency === c && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                                                   </div>
                                                ))
                                             ) : (
                                                <div className="p-6 text-center text-slate-400 text-[12px]">No results</div>
                                             )}
                                          </div>

                                          <div className="border-t border-slate-100 p-1.5 bg-slate-50/30">
                                             <button 
                                                onClick={(e) => {
                                                   e.stopPropagation();
                                                   setIsCurrencyDropdownOpen(false);
                                                   setIsCurrencyModalOpen(true);
                                                }}
                                                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] font-bold text-blue-600 hover:bg-blue-600 hover:text-white rounded transition-all group"
                                             >
                                                <PlusCircle size={14} className="text-blue-600 group-hover:text-white" />
                                                New Currency
                                             </button>
                                          </div>
                                       </div>
                                    )}

                                    {isCurrencyDropdownOpen && (
                                       <div className="fixed inset-0 z-40" onClick={() => setIsCurrencyDropdownOpen(false)}></div>
                                    )}
                                 </div>
                                  <div className="flex-1 relative">
                                     <input 
                                        type="number" 
                                        value={formData.amount}
                                        onChange={e => handleChange('amount', e.target.value)}
                                        className={`w-full h-9 px-3 text-[14px] border rounded-r-md z-10 outline-none transition-all ${
                                           showValidation && !formData.amount 
                                           ? 'border-red-500 bg-red-50/10' 
                                           : 'border-slate-200 focus:border-[#1e61f0] focus:ring-1 focus:ring-[#1e61f0]'
                                        }`} 
                                     />
                                     {showValidation && !formData.amount && <p className="text-[10px] text-red-500 mt-1 font-bold italic underline">Amount is required</p>}
                                  </div>
                               </div>
                            </div>
                            
                            <div className="w-full h-px border-b border-dashed border-slate-200 my-2"></div>
                            
                                                       <div className="grid grid-cols-[160px_1fr] items-center gap-4 mt-2">
                               <label className="text-[14px] text-red-500 font-medium whitespace-nowrap">Paid Through*</label>
                               <div className="flex w-[400px]">
                                  <div className="relative flex-1">
                                     {/* Custom Paid Through Trigger */}
                                     <div 
                                        onClick={() => setIsPaidThroughDropdownOpen(!isPaidThroughDropdownOpen)}
                                        className={`w-full h-9 pl-3 pr-8 flex items-center text-[14px] border rounded-l-md cursor-pointer transition-all bg-white relative ${
                                           isPaidThroughDropdownOpen ? 'border-[#1e61f0] ring-1 ring-[#1e61f0]' : 'hover:border-slate-300'
                                        } ${
                                           showValidation && !formData.paidThroughId ? 'border-red-500 bg-red-50/10' : 'border-slate-200'
                                        } text-slate-700`}
                                     >
                                        {ledgers.find(l => l.id === formData.paidThroughId)?.name || 
                                         (formData.paidThroughId && typeof formData.paidThroughId === 'string' && formData.paidThroughId.startsWith('suggestion-') ? formData.paidThroughId.replace('suggestion-', '') : null) || 
                                         <span className="text-slate-400">Select an account</span>}
                                        <ChevronDown size={14} className={`absolute right-3 top-2.5 text-slate-400 transition-transform duration-200 ${isPaidThroughDropdownOpen ? 'rotate-180 text-[#1e61f0]' : ''}`} />
                                     </div>
                                     {showValidation && !formData.paidThroughId && <p className="text-[10px] text-red-500 mt-1 font-bold italic underline">Please select a payment account</p>}

                                    {/* Custom Dropdown Content */}
                                    {isPaidThroughDropdownOpen && (
                                       <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150 origin-top">
                                          {/* Search Area */}
                                          <div className="p-2 border-b border-slate-50">
                                             <div className="relative">
                                                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                                                <input 
                                                   autoFocus
                                                   type="text"
                                                   value={paidThroughSearchTerm}
                                                   placeholder="Search accounts..."
                                                   onChange={e => setPaidThroughSearchTerm(e.target.value)}
                                                   className="w-full h-8 pl-9 pr-4 text-[13px] bg-slate-50 border-none rounded focus:ring-1 focus:ring-blue-500/20 outline-none placeholder:text-slate-400 font-normal"
                                                />
                                             </div>
                                          </div>

                                          {/* List Area */}
                                          <div className="max-h-[280px] overflow-y-auto py-1 custom-scrollbar">
                                             {filteredPaidThroughList.length > 0 ? (
                                                filteredPaidThroughList.map(group => (
                                                   <div key={group.category}>
                                                      <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">{group.category}</div>
                                                      {group.accounts.map(acc => (
                                                         <div 
                                                            key={acc.id}
                                                            onClick={() => handlePaidThroughSelect(acc)}
                                                            className={"px-4 py-1.5 text-[13px] cursor-pointer transition-colors flex items-center justify-between " + 
                                                               (formData.paidThroughId === acc.id ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50')
                                                            }
                                                         >
                                                            <span>{acc.name}</span>
                                                            {formData.paidThroughId === acc.id && <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>}
                                                         </div>
                                                      ))}
                                                   </div>
                                                ))
                                             ) : (
                                                <div className="p-6 text-center">
                                                   <p className="text-[12px] text-slate-400">No matching accounts</p>
                                                </div>
                                             )}
                                          </div>
                                       </div>
                                    )}
                                    
                                    {/* Outside Click Backdrop */}
                                    {isPaidThroughDropdownOpen && (
                                       <div className="fixed inset-0 z-40" onClick={() => setIsPaidThroughDropdownOpen(false)}></div>
                                    )}
                                 </div>
                                 <button className="w-9 h-9 bg-[#1e61f0] text-white flex items-center justify-center shrink-0 rounded-r-md border border-[#1e61f0] hover:bg-blue-700 transition-colors">
                                    <Search size={16} />
                                 </button>
                              </div>
                           </div>
                        </>
                     ) : (
                        <>
                                     <div className="grid grid-cols-[160px_1fr] items-center gap-4 mt-2">
                                        <label className="text-[14px] text-red-500 font-medium whitespace-nowrap">Paid Through*</label>
                                        <div className="flex w-[400px]">
                                           <div className="relative flex-1">
                                              {/* Custom Paid Through Trigger */}
                                              <div 
                                                 onClick={() => setIsPaidThroughDropdownOpen(!isPaidThroughDropdownOpen)}
                                                 className={`w-full h-9 pl-3 pr-8 flex items-center text-[14px] border rounded-l-md cursor-pointer transition-all bg-white relative ${
                                                    isPaidThroughDropdownOpen ? 'border-[#1e61f0] ring-1 ring-[#1e61f0]' : 'hover:border-slate-300'
                                                 } ${
                                                    showValidation && !formData.paidThroughId ? 'border-red-500 bg-red-50/10' : 'border-slate-200'
                                                 } text-slate-700`}
                                              >
                                                 {ledgers.find(l => l.id === formData.paidThroughId)?.name || 
                                                  (formData.paidThroughId && typeof formData.paidThroughId === 'string' && formData.paidThroughId.startsWith('suggestion-') ? formData.paidThroughId.replace('suggestion-', '') : null) || 
                                                  <span className="text-slate-400">Select an account</span>}
                                                 <ChevronDown size={14} className={`absolute right-3 top-2.5 text-slate-400 transition-transform duration-200 ${isPaidThroughDropdownOpen ? 'rotate-180 text-[#1e61f0]' : ''}`} />
                                              </div>
                                              {showValidation && !formData.paidThroughId && <p className="text-[10px] text-red-500 mt-1 font-bold italic underline">Please select a payment account</p>}

                                              {/* Custom Dropdown Content */}
                                              {isPaidThroughDropdownOpen && (
                                                 <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150 origin-top">
                                                    {/* Search Area */}
                                                    <div className="p-2 border-b border-slate-50">
                                                       <div className="relative">
                                                          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                                                          <input 
                                                             autoFocus
                                                             type="text"
                                                             value={paidThroughSearchTerm}
                                                             placeholder="Search accounts..."
                                                             onChange={e => setPaidThroughSearchTerm(e.target.value)}
                                                             className="w-full h-8 pl-9 pr-4 text-[13px] bg-slate-50 border-none rounded focus:ring-1 focus:ring-blue-500/20 outline-none placeholder:text-slate-400 font-normal"
                                                          />
                                                       </div>
                                                    </div>

                                                    {/* List Area */}
                                                    <div className="max-h-[280px] overflow-y-auto py-1 custom-scrollbar">
                                                       {filteredPaidThroughList.length > 0 ? (
                                                          filteredPaidThroughList.map(group => (
                                                             <div key={group.category}>
                                                                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">{group.category}</div>
                                                                {group.accounts.map(acc => (
                                                                   <div 
                                                                      key={acc.id}
                                                                      onClick={() => handlePaidThroughSelect(acc)}
                                                                      className={"px-4 py-1.5 text-[13px] cursor-pointer transition-colors flex items-center justify-between " + 
                                                                         (formData.paidThroughId === acc.id ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50')
                                                                      }
                                                                   >
                                                                      <span>{acc.name}</span>
                                                                      {formData.paidThroughId === acc.id && <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>}
                                                                   </div>
                                                                ))}
                                                             </div>
                                                          ))
                                                       ) : (
                                                          <div className="p-6 text-center">
                                                             <p className="text-[12px] text-slate-400">No matching accounts</p>
                                                          </div>
                                                       )}
                                                    </div>
                                                 </div>
                                              )}
                                              
                                              {/* Outside Click Backdrop */}
                                              {isPaidThroughDropdownOpen && (
                                                 <div className="fixed inset-0 z-40" onClick={() => setIsPaidThroughDropdownOpen(false)}></div>
                                              )}
                                           </div>
                                 <button className="w-9 h-9 bg-[#1e61f0] text-white flex items-center justify-center shrink-0 rounded-r-md border border-[#1e61f0] hover:bg-blue-700 transition-colors">
                                    <Search size={16} />
                                 </button>
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
                                                   className={`w-full h-9 pl-3 pr-8 text-[13px] border rounded outline-none appearance-none bg-white transition-all ${
                                                      showValidation && !row.expenseAccountId 
                                                      ? 'border-red-500 bg-red-50/10' 
                                                      : 'border-slate-200 focus:border-[#1e61f0] focus:ring-1 focus:ring-[#1e61f0]'
                                                   }`}
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
                                                 className={`w-full h-9 px-3 text-[13px] border rounded text-right outline-none transition-all ${
                                                    showValidation && !row.amount 
                                                    ? 'border-red-500 bg-red-50/10' 
                                                    : 'border-slate-200 focus:border-[#1e61f0] focus:ring-1 focus:ring-[#1e61f0]'
                                                 }`}
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
                                    <span className="text-[13px] font-bold text-slate-800">Expense Total ( ₹ )</span>
                                    <span className="text-[13px] font-bold text-slate-800">{itemizedTotal.toFixed(2)}</span>
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
                                 <option value="new-vendor" className="text-blue-600 font-bold border-t border-slate-100">+ New Vendor</option>
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
                              {/* Custom Customer Trigger */}
                              <div 
                                 onClick={() => setIsCustomerDropdownOpen(!isCustomerDropdownOpen)}
                                 className={`w-full h-9 pl-3 pr-8 flex items-center text-[14px] border border-slate-200 rounded-l-md cursor-pointer transition-all bg-white relative ${isCustomerDropdownOpen ? 'border-[#1e61f0] ring-1 ring-[#1e61f0]' : 'hover:border-slate-300'} text-slate-700 font-bold`}
                              >
                                 {formData.customerId ? (ledgers.find(c => c.id === formData.customerId)?.name || "Select or add a customer") : <span className="text-slate-400 font-normal">Select or add a customer</span>}
                                 <ChevronDown size={14} className={`absolute right-3 top-2.5 text-slate-400 transition-transform duration-200 ${isCustomerDropdownOpen ? 'rotate-180 text-[#1e61f0]' : ''}`} />
                              </div>

                              {/* Custom Dropdown Content */}
                              {isCustomerDropdownOpen && (
                                 <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150 origin-top">
                                    {/* Search Area */}
                                    <div className="p-2 border-b border-slate-50">
                                       <div className="relative">
                                          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                                          <input 
                                             autoFocus
                                             type="text"
                                             value={customerSearchTerm}
                                             placeholder="Search customers..."
                                             onChange={e => setCustomerSearchTerm(e.target.value)}
                                             className="w-full h-8 pl-9 pr-4 text-[13px] bg-slate-50 border-none rounded focus:ring-1 focus:ring-blue-500/20 outline-none placeholder:text-slate-400 font-normal"
                                          />
                                       </div>
                                    </div>

                                    {/* List Area */}
                                    <div className="max-h-[280px] overflow-y-auto py-1 custom-scrollbar">
                                       {filteredCustomerList.length > 0 ? (
                                          filteredCustomerList.map(c => (
                                             <div 
                                                key={c.id}
                                                onClick={() => handleCustomerSelect(c.id)}
                                                className={`px-3 py-2 text-[13px] cursor-pointer transition-colors flex items-center gap-3
                                                   ${formData.customerId === c.id ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}
                                                `}
                                             >
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 ${formData.customerId === c.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                                   {c.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                   <span className="truncate">{c.name}</span>
                                                   {c.email && <span className="text-[10px] opacity-60 truncate">{c.email}</span>}
                                                </div>
                                             </div>
                                          ))
                                       ) : (
                                          <div className="p-6 text-center">
                                             <p className="text-[12px] text-slate-400">No matching customers</p>
                                          </div>
                                       )}
                                    </div>

                                    {/* Footer */}
                                    <div className="border-t border-slate-100 p-1.5 bg-slate-50/30">
                                       <button 
                                          onClick={(e) => {
                                             e.stopPropagation();
                                             setIsCustomerDropdownOpen(false);
                                             setShowCustomerModal(true);
                                          }}
                                          className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] font-bold text-blue-600 hover:bg-blue-600 hover:text-white rounded transition-all group"
                                       >
                                          <PlusCircle size={14} className="text-blue-600 group-hover:text-white" />
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
                           <button className="w-9 h-9 bg-[#1e61f0] text-white flex items-center justify-center shrink-0 rounded-r-md border border-[#1e61f0] hover:bg-blue-700 transition-colors">
                              <Search size={16} />
                           </button>
                        </div>
                     </div>

                     {/* Project */}
                     <div className="grid grid-cols-[160px_1fr] items-center gap-4 mt-2">
                        <label className="text-[14px] text-slate-800 font-medium whitespace-nowrap">Project</label>
                        <div className="flex w-[400px]">
                           <div className="relative flex-1">
                              <select 
                                 value={formData.projectId}
                                 onChange={e => handleChange('projectId', e.target.value)}
                                 className="w-full h-9 pl-3 pr-8 text-[14px] border border-slate-200 rounded-md focus:border-[#1e61f0] focus:ring-1 focus:ring-[#1e61f0] outline-none appearance-none bg-white text-slate-700"
                              >
                                 <option value="">Select or associate project</option>
                                 {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                 ))}
                              </select>
                              <ChevronDown size={14} className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
                           </div>
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
                              <h3 className="text-[13px] font-bold text-slate-800 mb-1">Drag or Drop your Receipts</h3>
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
             className="px-8 py-2 bg-[#1e61f0] text-white text-[13px] font-bold rounded-md shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center gap-2"
          >
             Save <span className="opacity-60 text-[10px] bg-white/20 px-1 py-0.5 rounded ml-1 font-mono tracking-tighter border border-white/10">Alt+S</span>
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

      <VendorModal 
        isOpen={showVendorModal} 
        onClose={() => setShowVendorModal(false)}
        onSaveSuccess={handleVendorCreated} 
      />

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

      {showCustomerModal && (
         <CreateCustomerModal 
            isOpen={showCustomerModal}
            onClose={() => setShowCustomerModal(false)}
            onSuccess={handleCustomerCreated}
         />
      )}
    </div>
  );
};

export default ExpenseEntryView;
