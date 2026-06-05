import React, { useState, useEffect } from 'react';
import { 
  Filter, Search, X, AlertTriangle, 
  ArrowLeft, ChevronDown, CheckCircle2, 
  FileText, Calendar, DollarSign, User,
  ListFilter, RefreshCw
} from 'lucide-react';
import api, { ledgerAPI, voucherAPI, companyAPI } from '../../services/api';
import useNotificationStore from '../../store/notificationStore';

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

const BulkUpdateView = ({ showNew }) => {
  const [showFilterModal, setShowFilterModal] = useState(showNew || false);
  const [loading, setLoading] = useState(false);
  const [ledgers, setLedgers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedTransactions, setSelectedTransactions] = useState([]);
  const [searchPerformed, setSearchPerformed] = useState(false);
  
  const { addNotification } = useNotificationStore();
  const companyId = sessionStorage.getItem('companyId');
  const user = React.useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  }, []);

  const [groupedTransactions, setGroupedTransactions] = useState({});
  const [expandedGroups, setExpandedGroups] = useState(new Set(['Expenses', 'Invoices', 'Journal Entries', 'Other Transactions']));

  const toggleGroup = (group) => {
    const next = new Set(expandedGroups);
    if (next.has(group)) next.delete(group);
    else next.add(group);
    setExpandedGroups(next);
  };

  const [accountQuery, setAccountQuery] = useState('');
  const [isAccountOpen, setIsAccountOpen] = useState(false);

  const [filter, setFilter] = useState({
    accountId: '',
    contactId: '',
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: ''
  });

  const [bulkAccount, setBulkAccount] = useState('');

  useEffect(() => {
    if (showNew) {
      setShowFilterModal(true);
    }
  }, [showNew]);

  useEffect(() => {
    if (companyId) {
      ledgerAPI.getByCompany(companyId).then(res => {
        const allLedgers = res.data || [];
        setLedgers(allLedgers);
        
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

  const handleSearch = async () => {
    if (!filter.accountId) {
      addNotification('Please select an account to filter', 'warning');
      return;
    }

    // Date Range Validation
    if ((filter.startDate && !filter.endDate) || (!filter.startDate && filter.endDate)) {
      addNotification('Please select the correct date range', 'warning');
      return;
    }

    // Amount Range Validation (General)
    if ((filter.minAmount && !filter.maxAmount) || (!filter.minAmount && filter.maxAmount)) {
      addNotification('Please select the correct amount range', 'warning');
      return;
    }

    setLoading(true);
    setShowFilterModal(false);
    
    if (!companyId) {
      addNotification('Company ID not found. Please select a company.', 'error');
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching transactions for company:', companyId);
      const res = await voucherAPI.getByCompany(companyId);
      
      if (!res || !res.data) {
        throw new Error('No response from server');
      }

      const allTransactions = Array.isArray(res.data) ? res.data : [];

      const filtered = allTransactions.filter(v => {
        if (!v || !v.Transactions) return false;
        
        // Account Match (by name since filter uses name)
        const matchesAccount = v.Transactions.some(t => {
          const ledgerName = (t.Ledger?.name || t.ledger?.name || '');
          return ledgerName.toLowerCase() === filter.accountId.toLowerCase();
        });
        
        if (!matchesAccount) return false;

        // Date Match
        if (filter.startDate && filter.endDate) {
          try {
            const vDate = new Date(v.date);
            const sDate = new Date(filter.startDate);
            const eDate = new Date(filter.endDate);
            vDate.setHours(0,0,0,0);
            sDate.setHours(0,0,0,0);
            eDate.setHours(0,0,0,0);
            if (vDate < sDate || vDate > eDate) return false;
          } catch (e) {
            return false;
          }
        }

        // Amount Match
        if (filter.minAmount && filter.maxAmount) {
          const total = v.Transactions.reduce((acc, tr) => acc + (parseFloat(tr.debit) || 0), 0) || 0;
          const min = parseFloat(filter.minAmount);
          const max = parseFloat(filter.maxAmount);
          if (total < min || total > max) return false;
        }

        // Contact Match
        if (filter.contactId) {
          const matchesContact = v.Transactions.some(t => t.contactId === filter.contactId) || v.contactId === filter.contactId;
          if (!matchesContact) return false;
        }

        return true;
      });

      // Grouping logic (e.g. by voucherType)
      const grouped = filtered.reduce((acc, v) => {
        const vType = (v.voucherType || '').toUpperCase();
        const type = vType === 'JOURNAL' ? 'Journal Entries' : 
                     vType === 'EXPENSE' ? 'Expenses' : 
                     vType === 'INVOICE' ? 'Invoices' : 'Other Transactions';
        if (!acc[type]) acc[type] = [];
        acc[type].push(v);
        return acc;
      }, {});

      setTransactions(filtered);
      setGroupedTransactions(grouped);
      setSearchPerformed(true);
    } catch (err) {
      console.error('Search Error:', err);
      let errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Unknown error occurred';
      if (err.message === 'Network Error') {
        errorMsg = `Network Error (Trying to reach: ${api.defaults.baseURL})`;
      }
      addNotification(`Search Failed: ${errorMsg}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [history, setHistory] = useState([
    { 
      date: new Date().toLocaleDateString('en-GB'), 
      description: 'Account Update: Office Supplies to Travel Expense', 
      status: 'Completed', 
      user: user.name || user.username || user.email || 'Administrator'
    }
  ]);
  const [updateAccountQuery, setUpdateAccountQuery] = useState('');
  const [isUpdateAccountOpen, setIsUpdateAccountOpen] = useState(false);

  const handleBulkUpdate = () => {
    if (selectedTransactions.length === 0) {
      addNotification('No transactions selected', 'warning');
      return;
    }
    setShowUpdateModal(true);
    setUpdateAccountQuery('');
  };

  const getTransactionDetails = (v) => {
    let totalAmount = v.Transactions?.reduce((sum, t) => {
        return parseFloat(t.debit || 0) > 0 ? sum + parseFloat(t.debit || 0) : sum;
    }, 0) || 0;
    
    const matchedLine = v.Transactions?.find(t => (t.Ledger?.name || '').toLowerCase() === filter.accountId.toLowerCase());
    const expenseAccount = matchedLine?.Ledger?.name || filter.accountId;
    
    let customerName = '-';
    let vendorName = '-';
    let reference = '';
    try {
        if (v.narration && v.narration.startsWith('{')) {
            const parsed = JSON.parse(v.narration);
            if (parsed.vendor) vendorName = parsed.vendor;
            if (parsed.customer) customerName = parsed.customer;
            if (parsed.invoiceNumber) reference = parsed.invoiceNumber;
            if (parsed.reference) reference = parsed.reference;
        }
    } catch (e) {}

    const paymentTransaction = v.Transactions?.find(t => parseFloat(t.credit || 0) > 0);
    const paidThrough = paymentTransaction?.Ledger?.name || '-';

    return {
        id: matchedLine?.id,
        date: v.date,
        expenseAccount,
        invoiceNumber: reference || '',
        vendorName,
        paidThrough,
        customerName,
        totalAmount,
        status: 'Paid'
    };
  };

  const executeBulkUpdate = async () => {
    if (!bulkAccount) {
      addNotification('Please select a target account for update', 'warning');
      return;
    }
    setLoading(true);
    try {
      const targetAccountName = bulkAccount;
      let targetLedger = ledgers.find(l => l.name === targetAccountName);
      
      if (!targetLedger) {
        // Auto-create missing ledger
        const groupInfo = ACCOUNT_GROUPS.find(g => g.accounts.includes(targetAccountName));
        const groupName = groupInfo ? groupInfo.group : 'General Income';

        try {
          await ledgerAPI.create({
            companyId,
            name: targetAccountName,
            groupName: groupName,
            description: `Auto-generated for Bulk Update`
          });
          
          const refreshRes = await ledgerAPI.getByCompany(companyId);
          const updatedLedgers = refreshRes.data || [];
          setLedgers(updatedLedgers);
          targetLedger = updatedLedgers.find(l => l.name === targetAccountName);
        } catch (createErr) {
          console.error('Failed to auto-create ledger:', createErr);
        }
      }

      if (!targetLedger) {
        addNotification(`Error: Could not find or create Ledger ID for "${targetAccountName}"`, 'error');
        setLoading(false);
        return;
      }

      await voucherAPI.bulkUpdate({
        companyId: companyId,
        transactionIds: selectedTransactions,
        targetLedgerId: targetLedger.id,
        targetAccountName: targetAccountName
      });

      addNotification(`Successfully updated ${selectedTransactions.length} transactions.`, 'success');
      
      const newEntry = {
        date: new Date().toLocaleDateString('en-GB'),
        description: `Account Update: ${filter.accountId} to ${targetAccountName}`,
        status: 'Completed',
        user: user.name || user.username || user.email || 'Administrator'
      };
      setHistory([newEntry, ...history]);

      setShowUpdateModal(false);
      setSearchPerformed(false);
      setTransactions([]);
      setSelectedTransactions([]);
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message;
      addNotification(`Failed to update transactions: ${errorMsg}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (txId) => {
    if (!txId) return;
    setSelectedTransactions(prev => 
      prev.includes(txId) ? prev.filter(item => item !== txId) : [...prev, txId]
    );
  };

  if (!searchPerformed && transactions.length === 0) {
    return (
      <div className="flex-1 flex flex-col bg-white min-h-screen animate-fade-in font-sans">
        <div className="px-8 py-6 flex justify-between items-center bg-white border-b border-slate-100">
           <div>
              <h1 className="text-[20px] font-bold text-slate-800 tracking-tight">Bulk Update Accounts in Transactions</h1>
              <p className="text-[13px] text-slate-500 mt-1 font-medium">You can bulk update the accounts in Invoices, Credit Notes, Purchase Orders, Expenses, Bills and Vendor Credits.</p>
           </div>
           <button 
             onClick={() => setShowFilterModal(true)}
             className="px-6 py-2 bg-blue-500 text-white rounded font-bold text-[13px] hover:bg-blue-600 transition-all shadow-md active:scale-95"
           >
             Filter and Bulk Update
           </button>
        </div>

        <div className="p-8 space-y-8 overflow-auto">
           <div className="bg-orange-50 border border-orange-100 rounded-lg p-4 flex items-start gap-3 shadow-sm">
              <AlertTriangle className="text-orange-500 shrink-0 mt-0.5" size={18} />
              <p className="text-[13px] text-slate-700 leading-relaxed font-medium">
                 Bulk-updating accounts in transactions will cause significant changes to the financial data of your business. 
                 We recommend that you do this with the assistance of an accountant.
              </p>
           </div>

           <div className="space-y-4">
              <h2 className="text-[16px] font-bold text-slate-800 tracking-tight">History</h2>
              <div className="border border-slate-100 rounded-lg overflow-hidden shadow-sm">
                 <table className="w-full text-left">
                    <thead className="bg-slate-50/80 border-b border-slate-100">
                       <tr>
                          <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">Date</th>
                          <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">Description</th>
                          <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">Status</th>
                          <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">User</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {history.length > 0 ? history.map((h, i) => (
                         <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 text-[13px] text-slate-600 font-medium">{h.date}</td>
                            <td className="px-6 py-4 text-[13px] text-slate-800 font-bold">{h.description}</td>
                            <td className="px-6 py-4">
                               <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-bold border border-green-100 uppercase tracking-wider">
                                  {h.status}
                               </span>
                            </td>
                            <td className="px-6 py-4 text-[13px] text-slate-600 font-medium">{h.user}</td>
                         </tr>
                       )) : (
                         <tr>
                            <td colSpan="4" className="px-6 py-16 text-center text-slate-400 italic text-[13px]">
                               No update history available. Start by filtering transactions.
                            </td>
                         </tr>
                       )}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>

        {showFilterModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={() => setShowFilterModal(false)} />
             <div className="relative bg-white w-full max-w-2xl rounded-xl shadow-2xl border border-slate-200 animate-scale-up flex flex-col text-left overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                   <h3 className="text-[18px] font-bold text-slate-800">Filter Transactions for Bulk Update</h3>
                   <button onClick={() => setShowFilterModal(false)} className="text-rose-500 hover:bg-rose-50 p-2 rounded-full transition-all">
                      <X size={22} strokeWidth={2.5} />
                   </button>
                </div>
                
                <div className="p-10 space-y-8">
                   <p className="text-[13px] text-slate-500 leading-relaxed font-medium">Select an account and enter your ranges to filter your transaction</p>
                   
                   <div className="space-y-6">
                       <div className="grid grid-cols-12 items-start gap-4">
                          <label className="col-span-3 text-[13px] font-medium text-slate-700 pt-3">Account<span className="text-rose-500">*</span></label>
                          <div className="col-span-9 relative">
                             <div className="relative">
                                <input 
                                  type="text"
                                  placeholder="Select an account"
                                  value={isAccountOpen ? accountQuery : (filter.accountId || '')}
                                  onFocus={() => { setIsAccountOpen(true); setAccountQuery(''); }}
                                  onChange={e => setAccountQuery(e.target.value)}
                                  className="w-full pl-3 pr-10 py-2.5 border border-slate-300 rounded outline-none focus:border-blue-400 text-[13px] font-bold text-slate-800 shadow-sm"
                                />
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                             </div>
                             {isAccountOpen && (
                                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded shadow-2xl z-[1100] max-h-60 overflow-y-auto p-1 animate-slide-down">
                                     {ACCOUNT_GROUPS.map(g => {
                                        const filteredAccs = g.accounts.filter(a => a.toLowerCase().includes(accountQuery.toLowerCase()));
                                        if (filteredAccs.length === 0) return null;
                                        return (
                                          <div key={g.group}>
                                            <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] bg-slate-50/50">{g.group}</div>
                                            {filteredAccs.map(acc => (
                                              <button 
                                                key={acc} 
                                                onClick={() => { setFilter({...filter, accountId: acc}); setIsAccountOpen(false); }} 
                                                className="w-full text-left px-4 py-2 text-[13px] hover:bg-blue-50 hover:text-blue-600 rounded transition-colors font-medium text-slate-700"
                                              >
                                                {acc}
                                              </button>
                                            ))}
                                          </div>
                                        );
                                     })}
                                </div>
                             )}
                          </div>
                       </div>

                       <div className="grid grid-cols-12 items-center gap-4">
                          <label className="col-span-3 text-[13px] font-medium text-slate-700">Contact</label>
                          <div className="col-span-9 relative">
                             <select value={filter.contactId} onChange={e => setFilter({...filter, contactId: e.target.value})} className="w-full pl-3 pr-10 py-2.5 border border-slate-300 rounded outline-none text-[13px] appearance-none bg-white font-bold text-slate-800 shadow-sm">
                                <option value="">Select Contact</option>
                                {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                             </select>
                             <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                          </div>
                       </div>

                       <div className="grid grid-cols-12 items-center gap-4">
                          <label className="col-span-3 text-[13px] font-medium text-slate-700">Date Range</label>
                          <div className="col-span-9 flex items-center gap-3">
                             <input type="date" value={filter.startDate} onChange={e => setFilter({...filter, startDate: e.target.value})} className="flex-1 px-3 py-2.5 border border-slate-300 rounded text-[13px] font-bold text-slate-800 outline-none focus:border-blue-400 shadow-sm" />
                             <span className="text-slate-400 font-bold">-</span>
                             <input type="date" value={filter.endDate} onChange={e => setFilter({...filter, endDate: e.target.value})} className="flex-1 px-3 py-2.5 border border-slate-300 rounded text-[13px] font-bold text-slate-800 outline-none focus:border-blue-400 shadow-sm" />
                          </div>
                       </div>
                   </div>
                </div>

                <div className="px-10 py-6 border-t border-slate-100 bg-slate-50/30 flex gap-3">
                   <button onClick={handleSearch} className="px-8 py-2 bg-blue-500 text-white rounded font-bold text-[12px] hover:bg-blue-600 transition-all shadow-lg shadow-blue-100 uppercase tracking-widest">Search</button>
                   <button onClick={() => setShowFilterModal(false)} className="px-8 py-2 bg-white border border-slate-200 text-slate-600 rounded font-bold text-[12px] hover:bg-slate-50 transition-all uppercase tracking-widest">Cancel</button>
                </div>
             </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white min-h-screen animate-fade-in font-sans relative">
      <div className="px-8 py-6 flex justify-between items-center bg-white">
         <h1 className="text-[20px] font-bold text-slate-800 tracking-tight">Bulk Update Accounts in Transactions</h1>
      </div>

      <div className="px-8 pb-8 space-y-6 flex-1 overflow-auto">
          <div className="bg-[#f2f9f4] border border-[#e3f2e7] rounded-lg p-6 space-y-4">
             <h2 className="text-[#3a834c] text-[13px] font-bold italic">Filtered based on</h2>
             <ul className="space-y-1.5 ml-1">
                <li className="flex items-center gap-2 text-[13px] text-slate-700">
                   <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                   Account Name: <span className="font-bold ml-1">{filter.accountId}</span>
                </li>
                <li className="flex items-center gap-2 text-[13px] text-slate-700">
                   <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                   Start Date: <span className="font-bold ml-1">{filter.startDate}</span>
                </li>
                <li className="flex items-center gap-2 text-[13px] text-slate-700">
                   <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                   End Date: <span className="font-bold ml-1">{filter.endDate}</span>
                </li>
             </ul>
             <button 
               onClick={() => { setSearchPerformed(false); setTransactions([]); setShowFilterModal(true); }}
               className="text-blue-600 text-[13px] font-bold hover:underline block pt-2 flex items-center gap-1"
             >
               Change Filter Criteria <span className="text-[16px]">→</span>
             </button>
          </div>

          <div className="flex items-center gap-2 text-[13px] font-medium text-slate-600">
             <span>Number of Transactions selected:</span>
             <span className="font-bold text-slate-900">{selectedTransactions.length} (Maximum 50)</span>
          </div>

          <div className="space-y-6 pb-24">
             {Object.entries(groupedTransactions).map(([name, items]) => (
                <div key={name} className="border border-slate-200 rounded-lg overflow-hidden">
                   <div onClick={() => toggleGroup(name)} className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center gap-3 cursor-pointer">
                      <ChevronDown size={14} className={expandedGroups.has(name) ? '' : '-rotate-90'} />
                      <span className="text-[12px] font-bold text-slate-700 uppercase tracking-tight">{name} ({items.length})</span>
                   </div>
                   {expandedGroups.has(name) && (
                      <table className="w-full text-left text-[12px]">
                         <thead className="bg-white border-b border-slate-100 text-[10px] text-slate-400 font-bold uppercase">
                            <tr>
                               <th className="px-4 py-3 w-10">
                                  <input type="checkbox" onChange={(e) => {
                                      const ids = items.map(v => v.Transactions?.find(tx => (tx.Ledger?.name || '').toLowerCase() === filter.accountId.toLowerCase())?.id).filter(Boolean);
                                      if (ids.every(id => selectedTransactions.includes(id))) {
                                         setSelectedTransactions(prev => prev.filter(p => !ids.includes(p)));
                                      } else {
                                         setSelectedTransactions(prev => [...new Set([...prev, ...ids])]);
                                      }
                                   }} />
                               </th>
                               <th className="px-2 py-3">DATE</th>
                               <th className="px-2 py-3">EXPENSE ACCOUNT</th>
                               <th className="px-2 py-3">INVOICE NUMBER</th>
                               <th className="px-2 py-3">VENDOR NAME</th>
                               <th className="px-2 py-3">PAID THROUGH</th>
                               <th className="px-2 py-3">CUSTOMER NAME</th>
                               <th className="px-2 py-3 text-right">AMOUNT</th>
                               <th className="px-2 py-3 text-center">STATUS</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-50">
                            {items.map(t => {
                                const details = getTransactionDetails(t);
                                return (
                                 <tr key={t.id} className="hover:bg-slate-50/50 border-b border-slate-50 last:border-0">
                                    <td className="px-4 py-4"><input type="checkbox" checked={selectedTransactions.includes(details.id)} onChange={() => toggleSelect(details.id)} /></td>
                                    <td className="px-2 py-4 text-[13px] text-slate-600">{new Date(details.date).toLocaleDateString('en-GB')}</td>
                                    <td className="px-2 py-4 text-[13px] text-blue-600 font-bold">{details.expenseAccount}</td>
                                    <td className="px-2 py-4 text-[13px] text-slate-500 font-medium">{details.invoiceNumber}</td>
                                    <td className="px-2 py-4 text-[13px] text-slate-500 font-medium">{details.vendorName}</td>
                                    <td className="px-2 py-4 text-[13px] text-slate-500 font-medium">{details.paidThrough}</td>
                                    <td className="px-2 py-4 text-[13px] text-slate-500 font-medium">{details.customerName}</td>
                                    <td className="px-2 py-4 text-right font-black text-slate-900 text-[14px]">₹{parseFloat(details.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                    <td className="px-2 py-4 text-center">
                                       <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-tight">Paid</span>
                                    </td>
                                 </tr>
                                );
                             })}
                         </tbody>
                      </table>
                   )}
                </div>
             ))}
          </div>
      </div>

      {/* Results Bar */}
      <div className="fixed bottom-0 left-[260px] right-0 bg-white border-t border-slate-200 px-8 py-4 flex items-center justify-between z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
         <div className="flex gap-2">
            <button onClick={handleBulkUpdate} className="px-6 py-1.5 bg-blue-500 text-white rounded font-bold text-[13px]">Update</button>
            <button onClick={() => { setSearchPerformed(false); setTransactions([]); }} className="px-6 py-1.5 bg-white border border-slate-200 rounded font-bold text-[13px]">Cancel</button>
         </div>
         <div className="flex items-center gap-3">
            <span className="text-[13px] font-medium text-slate-500">Update Account to:</span>
            <select value={bulkAccount} onChange={e => setBulkAccount(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded text-[13px] font-bold">
               <option value="">Select Account</option>
               {ACCOUNT_GROUPS.flatMap(g => g.accounts).map(a => <option key={a} value={a}>{a}</option>)}
            </select>
         </div>
      </div>

      {/* Confirmation Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
           {/* Dark Backdrop */}
           <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={() => setShowUpdateModal(false)} />
           
           <div className="relative bg-white w-full max-w-xl rounded-lg shadow-2xl border border-slate-200 animate-scale-up flex flex-col text-left overflow-hidden">
              {/* Header */}
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
                 <h3 className="text-[17px] font-bold text-slate-800">Update Transactions with a New Account</h3>
                 <button onClick={() => setShowUpdateModal(false)} className="text-rose-500 hover:text-rose-600 transition-colors p-1 hover:bg-rose-50 rounded-full">
                    <X size={20} strokeWidth={2.5} />
                 </button>
              </div>

              {/* Body */}
              <div className="p-10 space-y-8">
                 <p className="text-[13px] text-slate-500 leading-relaxed font-medium">
                    Select an account to replace the existing accounts in all the selected transactions.
                 </p>
                 
                 <div className="space-y-6">
                    {/* Existing Account */}
                    <div className="grid grid-cols-12 items-center">
                       <label className="col-span-4 text-[13px] font-medium text-slate-600">Existing Account</label>
                       <div className="col-span-8">
                          <span className="text-[13px] font-bold text-slate-900">{filter.accountId}</span>
                       </div>
                    </div>

                    {/* New Account Searchable Selection */}
                    <div className="grid grid-cols-12 items-center">
                       <label className="col-span-4 text-[13px] font-medium text-slate-700">New Account</label>
                       <div className="col-span-8 relative">
                          <div className="relative">
                             <input 
                               type="text" 
                               placeholder="Search or Select Account"
                               value={isUpdateAccountOpen ? updateAccountQuery : (bulkAccount || '')}
                               onFocus={() => { setIsUpdateAccountOpen(true); setUpdateAccountQuery(''); }}
                               onChange={e => setUpdateAccountQuery(e.target.value)}
                               className="w-full pl-3 pr-10 py-2.5 border border-slate-300 rounded outline-none focus:border-blue-400 text-[13px] font-bold text-slate-800 bg-white shadow-sm"
                             />
                             <ChevronDown size={14} className={`absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none transition-transform ${isUpdateAccountOpen ? 'rotate-180' : ''}`} />
                          </div>

                          {isUpdateAccountOpen && (
                             <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded shadow-xl z-[1200] max-h-64 overflow-y-auto p-1">
                                <div className="sticky top-0 bg-white px-3 py-2 border-b border-slate-100 mb-1">
                                   <div className="relative">
                                      <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                                      <input 
                                        autoFocus
                                        type="text"
                                        placeholder="Type to filter..."
                                        value={updateAccountQuery}
                                        onChange={e => setUpdateAccountQuery(e.target.value)}
                                        className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-[12px] outline-none focus:border-blue-400"
                                      />
                                   </div>
                                </div>
                                {ACCOUNT_GROUPS.map(g => {
                                   const filtered = g.accounts.filter(a => a.toLowerCase().includes(updateAccountQuery.toLowerCase()));
                                   if (filtered.length === 0) return null;
                                   return (
                                     <div key={g.group}>
                                        <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">{g.group}</div>
                                        {filtered.map(acc => (
                                          <button 
                                            key={acc} 
                                            onClick={() => {
                                               setBulkAccount(acc);
                                               setIsUpdateAccountOpen(false);
                                               setUpdateAccountQuery('');
                                            }}
                                            className="w-full text-left px-4 py-2 text-[13px] hover:bg-blue-50 hover:text-blue-600 rounded transition-colors font-medium text-slate-700"
                                          >
                                             {acc}
                                          </button>
                                        ))}
                                     </div>
                                   );
                                })}
                             </div>
                          )}
                       </div>
                    </div>
                 </div>

                 {/* Note Section */}
                 <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-6">
                    <p className="text-[12px] font-bold text-slate-700 mb-3 uppercase tracking-wider flex items-center gap-2">
                       <AlertTriangle size={14} className="text-orange-500" />
                       Please Note:
                    </p>
                    <ul className="space-y-2.5">
                       <li className="text-[12px] text-slate-600 leading-relaxed font-medium flex items-start gap-2">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-300 shrink-0" />
                          Updating the account in all your selected transactions will happen in the background and may take some time. 
                          You can continue using Zoho Books during this period.
                       </li>
                    </ul>
                 </div>
              </div>

              {/* Action Buttons at Bottom Left */}
              <div className="px-10 py-6 border-t border-slate-100 bg-slate-50/30 flex gap-3">
                 <button 
                   onClick={executeBulkUpdate} 
                   disabled={!bulkAccount || loading}
                   className="px-8 py-2 bg-blue-500 text-white rounded font-bold text-[12px] hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest shadow-lg shadow-blue-200"
                 >
                    {loading ? 'Processing...' : 'Replace'}
                 </button>
                 <button 
                   onClick={() => {
                      setShowUpdateModal(false);
                      setIsUpdateAccountOpen(false);
                   }} 
                   className="px-8 py-2 bg-white border border-slate-200 text-slate-600 rounded font-bold text-[12px] hover:bg-slate-50 transition-all uppercase tracking-widest"
                 >
                    Cancel
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default BulkUpdateView;
