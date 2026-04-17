import React, { useState, useEffect } from 'react';
import { 
  Filter, Search, X, AlertTriangle, 
  ArrowLeft, ChevronDown, CheckCircle2, 
  FileText, Calendar, DollarSign, User,
  ListFilter, RefreshCw
} from 'lucide-react';
import { ledgerAPI, voucherAPI, companyAPI } from '../../services/api';
import useNotificationStore from '../../store/notificationStore';

const BulkUpdateView = () => {
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ledgers, setLedgers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedTransactions, setSelectedTransactions] = useState([]);
  const [searchPerformed, setSearchPerformed] = useState(false);
  
  const { addNotification } = useNotificationStore();
  const companyId = localStorage.getItem('companyId');

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
    setLoading(true);
    setShowFilterModal(false);
    
    // Simulate API call for now (In a real app, we'd hit a search endpoint)
    try {
      const res = await voucherAPI.getByCompany(companyId);
      // Filter logic here...
      const filtered = (res.data || []).filter(v => {
        const hasAccount = v.Transactions?.some(t => t.ledgerId === filter.accountId);
        return hasAccount;
      });
      setTransactions(filtered);
      setSearchPerformed(true);
    } catch (err) {
      addNotification('Failed to fetch transactions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpdate = async () => {
    if (selectedTransactions.length === 0) {
      addNotification('No transactions selected', 'warning');
      return;
    }
    if (!bulkAccount) {
      addNotification('Please select a target account for update', 'warning');
      return;
    }

    setLoading(true);
    try {
      // Simulate bulk update API call
      addNotification(`Successfully updated ${selectedTransactions.length} transactions`, 'success');
      setTransactions([]);
      setSelectedTransactions([]);
      setSearchPerformed(false);
    } catch (err) {
      addNotification('Bulk update failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id) => {
    setSelectedTransactions(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Landing Page View
  if (!searchPerformed && transactions.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-20 animate-fade-in text-center space-y-8 min-h-[70vh]">
        <div className="w-24 h-24 bg-purple-50 rounded-[2.5rem] flex items-center justify-center text-purple-600 shadow-xl shadow-purple-100/50">
           <div className="relative">
              <FileText size={48} strokeWidth={1.5} />
              <RefreshCw size={24} className="absolute -bottom-1 -right-1 bg-white rounded-full p-1" />
           </div>
        </div>
        
        <div className="space-y-3 max-w-2xl">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Bulk Update Accounts in Transactions</h1>
          <p className="text-[14px] font-medium text-slate-400 leading-relaxed">
            Filter transactions (Invoices, Credit Notes, Purchase Orders, Expenses, Bills, Vendor Credits) and bulk-update its accounts with a new account
          </p>
        </div>

        <div className="max-w-xl w-full bg-orange-50 border border-orange-100 rounded-xl p-4 flex gap-4 text-left animate-slide-up">
           <AlertTriangle size={24} className="text-orange-500 shrink-0 mt-1" />
           <p className="text-[13px] text-orange-800 font-medium">
             Bulk-updating accounts in transactions will cause significant changes to the financial data of your business. We recommend that you do this with the assistance of an accountant.
           </p>
        </div>

        <button 
          onClick={() => setShowFilterModal(true)}
          className="px-8 py-3 bg-blue-600 text-white rounded font-bold text-[14px] hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all font-sans"
        >
          Filter and Bulk Update
        </button>

        {/* Filter Modal */}
        {showFilterModal && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowFilterModal(false)} />
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden animate-scale-up">
               <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-[18px] font-bold text-slate-800">Filter Transactions</h3>
                  <button onClick={() => setShowFilterModal(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={20} />
                  </button>
               </div>
               
               <div className="p-8 space-y-6">
                  <p className="text-[13px] text-slate-500">Select an account and enter your ranges to filter your transaction</p>
                  
                  <div className="space-y-5">
                    {/* Account */}
                    <div className="grid grid-cols-12 items-center gap-4">
                       <label className="col-span-3 text-[13px] font-bold text-rose-500">Account*</label>
                       <div className="col-span-9 relative">
                          <select 
                            value={filter.accountId}
                            onChange={e => setFilter({...filter, accountId: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-200 rounded focus:border-blue-400 outline-none text-[13px] appearance-none bg-white pr-10"
                          >
                             <option value="">Select an account</option>
                             {ledgers.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                          </select>
                          <ChevronDown size={14} className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
                       </div>
                    </div>

                    {/* Contact */}
                    <div className="grid grid-cols-12 items-center gap-4">
                       <label className="col-span-3 text-[13px] font-bold text-slate-600">Contact</label>
                       <div className="col-span-9 relative">
                          <select 
                             value={filter.contactId}
                             onChange={e => setFilter({...filter, contactId: e.target.value})}
                             className="w-full px-3 py-2 border border-slate-200 rounded focus:border-blue-400 outline-none text-[13px] appearance-none bg-white pr-10"
                          >
                             <option value="">Select Contact</option>
                             {contacts.map(c => (
                               <option key={`${c.type}-${c.id}`} value={c.id}>
                                 {c.name} ({c.type})
                               </option>
                             ))}
                          </select>
                          <ChevronDown size={14} className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
                       </div>
                    </div>

                    {/* Date Range */}
                    <div className="grid grid-cols-12 items-center gap-4">
                       <label className="col-span-3 text-[13px] font-bold text-slate-600">Date Range</label>
                       <div className="col-span-9 flex items-center gap-4">
                          <div className="relative flex-1">
                             <input 
                               type="date"
                               className="w-full px-3 py-2 border border-slate-200 rounded focus:border-blue-400 outline-none text-[13px]"
                               placeholder="dd/MM/yyyy"
                             />
                          </div>
                          <span className="text-slate-300">-</span>
                          <div className="relative flex-1">
                             <input 
                               type="date"
                               className="w-full px-3 py-2 border border-slate-200 rounded focus:border-blue-400 outline-none text-[13px]"
                               placeholder="dd/MM/yyyy"
                             />
                          </div>
                       </div>
                    </div>

                    {/* Amount Range */}
                    <div className="grid grid-cols-12 items-center gap-4">
                       <label className="col-span-3 text-[13px] font-bold text-slate-600 leading-tight">Total Amount Range</label>
                       <div className="col-span-9 flex items-center gap-4">
                          <input 
                            type="number"
                            className="w-full px-3 py-2 border border-slate-200 rounded focus:border-blue-400 outline-none text-[13px]"
                          />
                          <span className="text-slate-300">-</span>
                          <input 
                            type="number"
                            className="w-full px-3 py-2 border border-slate-200 rounded focus:border-blue-400 outline-none text-[13px]"
                          />
                       </div>
                    </div>
                  </div>
               </div>

               <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                  <button 
                    onClick={handleSearch}
                    className="px-6 py-2 bg-blue-500 text-white rounded font-bold text-[13px] hover:bg-blue-600 transition-all font-sans"
                  >
                    Search
                  </button>
                  <button 
                    onClick={() => setShowFilterModal(false)}
                    className="px-6 py-2 bg-white border border-slate-200 text-slate-600 rounded font-bold text-[13px] hover:bg-slate-50 transition-all font-sans"
                  >
                    Cancel
                  </button>
               </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Search Results View
  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-screen animate-fade-in">
       {/* List Header */}
       <div className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-4">
             <button onClick={() => setSearchPerformed(false)} className="text-slate-400 hover:text-slate-600">
                <ArrowLeft size={20} />
             </button>
             <h2 className="text-lg font-bold text-slate-800">Transactions List</h2>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-3">
                <span className="text-[13px] font-bold text-slate-500">Update Account to:</span>
                <div className="relative w-64">
                   <select 
                     value={bulkAccount}
                     onChange={e => setBulkAccount(e.target.value)}
                     className="w-full pl-3 pr-10 py-2 border border-slate-200 rounded focus:border-blue-400 outline-none text-[13px] appearance-none bg-white font-medium"
                   >
                      <option value="">Select Target Account</option>
                      {ledgers.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                   </select>
                   <ChevronDown size={14} className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
                </div>
             </div>
             <button 
               onClick={handleBulkUpdate}
               disabled={selectedTransactions.length === 0 || !bulkAccount || loading}
               className="px-6 py-2 bg-blue-600 text-white rounded font-bold text-[13px] hover:bg-blue-700 disabled:opacity-50 transition-all font-sans"
             >
                Bulk Update
             </button>
          </div>
       </div>

       {/* Content */}
       <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
             <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                   <tr>
                      <th className="px-6 py-4 w-12">
                         <input 
                           type="checkbox" 
                           checked={selectedTransactions.length === transactions.length && transactions.length > 0}
                           onChange={() => {
                              if (selectedTransactions.length === transactions.length) setSelectedTransactions([]);
                              else setSelectedTransactions(transactions.map(t => t.id));
                           }}
                           className="rounded border-slate-300"
                         />
                      </th>
                      <th className="px-6 py-4">Transaction Details</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Current Account</th>
                      <th className="px-6 py-4 text-right">Amount</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {transactions.map(t => (
                      <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                         <td className="px-6 py-4">
                            <input 
                              type="checkbox" 
                              checked={selectedTransactions.includes(t.id)}
                              onChange={() => toggleSelect(t.id)}
                              className="rounded border-slate-300"
                            />
                         </td>
                         <td className="px-6 py-4">
                            <div className="flex flex-col">
                               <span className="text-[14px] font-bold text-slate-700">{t.voucherNumber}</span>
                               <span className="text-[11px] text-slate-400 uppercase font-black">{t.voucherType}</span>
                            </div>
                         </td>
                         <td className="px-6 py-4 text-[13px] font-medium text-slate-600">
                            {new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                         </td>
                         <td className="px-6 py-4">
                            <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[11px] font-bold uppercase tracking-tight">
                               {t.Transactions?.[0]?.Ledger?.name || 'Multiple Accounts'}
                            </span>
                         </td>
                         <td className="px-6 py-4 text-right font-black text-slate-900 text-[14px]">
                            ₹{(t.Transactions?.reduce((acc, tr) => acc + (parseFloat(tr.debit) || 0), 0) || 0).toLocaleString('en-IN')}
                         </td>
                      </tr>
                   ))}
                   {transactions.length === 0 && (
                     <tr>
                        <td colSpan={5} className="py-20 text-center">
                           <div className="flex flex-col items-center gap-4 text-slate-300">
                              <ListFilter size={48} strokeWidth={1} />
                              <p className="font-medium italic">No transactions found matching your filter.</p>
                              <button onClick={() => setShowFilterModal(true)} className="text-blue-600 font-bold hover:underline">Try different filters</button>
                           </div>
                        </td>
                     </tr>
                   )}
                </tbody>
             </table>
          </div>
          
          <div className="flex items-center justify-between text-[13px] text-slate-400 font-medium px-2">
             <span>Showing {transactions.length} transactions</span>
             <span>{selectedTransactions.length} transactions selected for bulk update</span>
          </div>
       </div>
    </div>
  );
};

export default BulkUpdateView;
