import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  MoreHorizontal, 
  Search, 
  CreditCard, 
  TrendingUp, 
  RefreshCw,
  ChevronRight,
  ChevronDown,
  Upload,
  ArrowLeft,
  Filter,
  MoreVertical,
  Edit,
  FileText,
  XCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { ledgerAPI, reconciliationAPI, voucherAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import BankEntryView from './BankEntryView';

const BankingView = () => {
  const navigate = useNavigate();
  const [bankAccounts, setBankAccounts] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [unreconciledCount, setUnreconciledCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDropdown, setActiveDropdown] = useState(null);
  const companyId = localStorage.getItem('companyId');

  useEffect(() => {
    fetchData();
  }, [companyId]);

  const fetchData = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      // 1. Fetch Bank Accounts (Ledgers)
      const res = await ledgerAPI.getByCompany(companyId);
      const accounts = res.data.filter(ledger => 
        ['Bank Accounts', 'Cash-in-hand', 'Bank OCC A/c', 'Bank OD A/c'].includes(ledger.groupName)
      );
      setBankAccounts(accounts);

      // 2. Fetch Unreconciled count
      const unmatchedRes = await reconciliationAPI.getUnmatched(companyId);
      setUnreconciledCount(unmatchedRes.data.length);

      // 3. Fetch Recent Global Activity (Vouchers)
      const voucherRes = await voucherAPI.getByCompany(companyId);
      const bankVoucherTypes = ['Payment', 'Receipt', 'Contra'];
      
      // Filter vouchers that involve any of our bank accounts
      const bankLedgerIds = accounts.map(a => a.id);
      const activity = (voucherRes.data || [])
        .filter(v => bankVoucherTypes.includes(v.voucherType))
        .map(v => {
           // Find the transaction line for the bank account to get the amount
           // Find all transactions that involve a bank account for this voucher
           const bankTransactions = v.Transactions?.filter(t => bankLedgerIds.includes(t.LedgerId)) || [];
           
           // Use the first bank transaction found to determine amount and account
           const bankTx = bankTransactions[0];
           const amount = bankTx ? (Math.max(parseFloat(bankTx.debit) || 0, parseFloat(bankTx.credit) || 0)) : 0;
           
           // Smart Description Parsing
           let cleanDescription = v.narration;
           try {
              if (v.narration && v.narration.startsWith('{')) {
                 const data = JSON.parse(v.narration);
                 cleanDescription = data.vendor || data.customer || data.notes;
              }
           } catch (e) {}

           // Final Fallback if narration is empty or garbage
           if (!cleanDescription || cleanDescription === '{}') {
              cleanDescription = `${v.voucherType} #${v.voucherNumber || v.id.toString().substring(0,4)}`;
           }

           return {
             id: v.id,
             date: v.date,
             description: cleanDescription,
             type: v.voucherType === 'Receipt' ? 'Inward' : 'Outward',
             amount: amount,
             accountName: bankTx?.Ledger?.name || 'Bank Account'
           };
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10); // Show last 10
      
      setRecentActivity(activity);

    } catch (err) {
      console.error('Failed to fetch banking data:', err);
    }
    setLoading(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const totalBalance = bankAccounts.reduce((sum, acc) => sum + (acc.currentBalance || 0), 0);
  const monthlyInflow = recentActivity
    .filter(a => a.type === 'Inward')
    .reduce((sum, a) => sum + a.amount, 0);

  return (
    <div className="bg-[#F9FAFB] min-h-screen font-sans relative">
      {/* ── HEADER ── */}
      <div className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-30">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <h1 className="text-[20px] font-bold text-slate-800 tracking-tight">Banking Overview</h1>
            <ChevronRight size={18} className="text-slate-300 mt-1" />
          </div>
          
          <div className="flex items-center gap-3">
             <span className="text-[12px] text-blue-600 font-medium hover:underline cursor-pointer">Auto-upload bank statements from email</span>
             <button className="px-4 py-1.5 bg-white border border-slate-300 rounded text-slate-700 text-[13px] font-medium hover:bg-slate-50 transition-all">
                Import Statement
             </button>
             <button 
               onClick={() => navigate('/banking/new')}
               className="px-4 py-1.5 bg-[#1e61f0] text-white rounded text-[13px] font-medium hover:bg-[#1a54d1] transition-all shadow-sm"
             >
               Add Bank or Credit Card
             </button>
             <button className="px-4 py-1.5 bg-white border border-slate-300 rounded text-slate-700 text-[13px] font-medium hover:bg-slate-50 transition-all">
                Manage Transaction Rules
             </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-6 space-y-6 animate-fade-in">
        
        {/* ── CHART SECTION ── */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden p-6">
           <div className="h-[300px] w-full">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart
                 data={[
                   { name: '19 Mar', cash: 0, bank: 0 },
                   { name: '21 Mar', cash: 0, bank: 0 },
                   { name: '23 Mar', cash: 0, bank: 0 },
                   { name: '25 Mar', cash: 0, bank: 0 },
                   { name: '27 Mar', cash: 1500, bank: 2000 },
                   { name: '29 Mar', cash: 1200, bank: 5000 },
                   { name: '31 Mar', cash: 3000, bank: 8000 },
                   { name: '01 Apr', cash: 4000, bank: 12000 },
                   { name: '03 Apr', cash: 4500, bank: 15000 },
                   { name: '05 Apr', cash: 5000, bank: 18000 },
                   { name: '07 Apr', cash: 4800, bank: 22000 },
                   { name: '09 Apr', cash: 6000, bank: 25000 },
                   { name: '11 Apr', cash: 7500, bank: 28000 },
                   { name: '13 Apr', cash: 8000, bank: 26000 },
                   { name: '15 Apr', cash: 9000, bank: 24000 },
                   { name: '17 Apr', cash: totalBalance * 0.3, bank: totalBalance * 0.7 },
                 ]}
                 margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
               >
                 <defs>
                   <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#818cf8" stopOpacity={0.1}/>
                     <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                   </linearGradient>
                   <linearGradient id="colorBank" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                     <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                 <XAxis 
                   dataKey="name" 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{ fontSize: 10, fill: '#94a3b8' }} 
                   dy={10}
                 />
                 <YAxis 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{ fontSize: 10, fill: '#94a3b8' }}
                   tickFormatter={(value) => `₹${value > 1000 ? (value/1000) + 'k' : value}`}
                 />
                 <Tooltip 
                   contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                 />
                 <Legend verticalAlign="bottom" height={36}/>
                 <Area 
                   name="Cash In Hand"
                   type="monotone" 
                   dataKey="cash" 
                   stroke="#818cf8" 
                   strokeWidth={2}
                   fillOpacity={1} 
                   fill="url(#colorCash)" 
                 />
                 <Area 
                   name="Bank Balance"
                   type="monotone" 
                   dataKey="bank" 
                   stroke="#10b981" 
                   strokeWidth={2}
                   fillOpacity={1} 
                   fill="url(#colorBank)" 
                 />
               </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* ── ACTIVE ACCOUNTS SECTION ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer group">
              <h3 className="text-[17px] font-bold text-slate-800">Active Accounts</h3>
              <ChevronDown size={14} className="text-slate-400 mt-1 transition-transform group-hover:translate-y-0.5" />
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded text-[13px] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all w-64"
              />
            </div>
          </div>

          <div className="bg-white rounded border border-slate-200 shadow-sm pb-16">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-2.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[35%]">Account Details</th>
                  <th className="px-6 py-2.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Uncategorized</th>
                  <th className="px-6 py-2.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Pending Checks</th>
                  <th className="px-6 py-2.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Amount in Bank</th>
                  <th className="px-6 py-2.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Amount in Zoho Books</th>
                  <th className="px-6 py-2.5 w-10 text-right pr-6">
                     <Filter size={14} className="text-slate-400 inline cursor-pointer" />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400 text-sm animate-pulse">
                      Loading your accounts...
                    </td>
                  </tr>
                ) : bankAccounts.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400 text-sm">
                      No active accounts found.
                    </td>
                  </tr>
                ) : (
                  bankAccounts.map(account => (
                    <tr 
                      key={account.id} 
                      className="hover:bg-blue-50/30 cursor-default transition-colors group border-b border-slate-50 last:border-0"
                    >
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                           <div className="w-9 h-9 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-center text-slate-500">
                              {['Bank Accounts', 'Bank OCC A/c', 'Bank OD A/c'].includes(account.groupName) ? <Building2 size={18} strokeWidth={1.5} /> : <Wallet size={18} strokeWidth={1.5} />}
                           </div>
                           <div>
                              <div 
                                onClick={() => navigate(`/banking/view/${account.id}`)}
                                className="text-[13px] font-medium text-[#408DFB] hover:underline cursor-pointer"
                              >
                                {account.name}
                              </div>
                              <div className="text-[11px] text-slate-400 font-medium">
                                {account.accountNumber ? `xxxx${account.accountNumber.slice(-4)}` : (account.bankName || 'Direct Ledger')}
                              </div>
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-right text-[13px] text-slate-600">
                        {unreconciledCount > 0 && account.groupName !== 'Cash-in-hand' ? (
                          <span className="bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full text-[11px] font-bold">
                            {unreconciledCount}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-6 py-3.5 text-right text-[13px] text-slate-600">—</td>
                      <td className="px-6 py-3.5 text-right text-[13px] font-medium text-slate-700">
                        {formatCurrency(account.currentBalance)}
                      </td>
                      <td className="px-6 py-3.5 text-right text-[13px] font-medium text-slate-900 pr-10">
                        {formatCurrency(account.currentBalance)}
                      </td>
                      <td className="px-6 py-3.5 text-right relative pr-6">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdown(activeDropdown === account.id ? null : account.id);
                          }}
                          className={`w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center transition-all bg-white shadow-sm hover:border-slate-300
                            ${activeDropdown === account.id ? 'text-blue-600 border-blue-200' : 'text-slate-400'}`}
                        >
                           <ChevronDown size={14} className={`transition-transform duration-300 ${activeDropdown === account.id ? 'rotate-180' : ''}`} />
                        </button>

                        {activeDropdown === account.id && (
                          <div className={`absolute right-6 w-48 bg-white rounded-md shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-slate-100 z-[100] py-1 animate-fade-in-down
                            ${bankAccounts.indexOf(account) >= bankAccounts.length - 2 && bankAccounts.length > 2 ? 'bottom-full mb-1' : 'top-10'}`}>
                            {[
                              { label: 'Edit Account', icon: <Edit size={14} />, onClick: () => navigate(`/banking/edit/${account.id}`) },
                              { label: 'View Transactions', icon: <FileText size={14} />, onClick: () => navigate(`/banking/view/${account.id}`) },
                              { label: 'Import Statement', icon: <Upload size={14} /> },
                              { label: 'Mark as Inactive', icon: <XCircle size={14} />, divider: true }
                            ].map((opt, idx) => (
                              <React.Fragment key={idx}>
                                {opt.divider && <div className="h-[1px] bg-slate-100 my-1" />}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveDropdown(null);
                                    opt.onClick && opt.onClick();
                                  }}
                                  className="w-full px-4 py-2 text-left text-[13px] font-medium flex items-center gap-3 transition-colors hover:bg-blue-600 hover:text-white text-slate-600 group/opt"
                                >
                                  <span className="opacity-50 group-hover/opt:opacity-100">{opt.icon}</span>
                                  {opt.label}
                                </button>
                              </React.Fragment>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Closing dropdown when clicking outside */}
        {activeDropdown && (
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setActiveDropdown(null)}
          />
        )}

        {/* ── GLOBAL ACTIVITY FEED ── */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden mt-8">
           <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-[13px] font-bold text-slate-700 uppercase tracking-widest">Recent Activity</h3>
              <button className="text-[11px] font-bold text-blue-600 uppercase tracking-widest hover:underline">View All</button>
           </div>
           <div className="divide-y divide-slate-100">
              {recentActivity.length === 0 ? (
                 <p className="p-10 text-center text-slate-400 text-sm italic">No recent transactions.</p>
              ) : (
                recentActivity.map(item => (
                  <div key={item.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded flex items-center justify-center ${item.type === 'Outward' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                          {item.type === 'Outward' ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                        </div>
                        <div>
                          <h4 className="text-[13px] font-medium text-slate-800">
                              {item.description}
                          </h4>
                          <p className="text-[11px] text-slate-400">
                            {new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} • {item.accountName}
                          </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className={`text-[14px] font-bold ${item.type === 'Outward' ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {item.type === 'Outward' ? '-' : '+'} {formatCurrency(item.amount)}
                        </p>
                    </div>
                  </div>
                ))
              )}
           </div>
        </div>

      </div>
    </div>
  );
};

export default BankingView;
