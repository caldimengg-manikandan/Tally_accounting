import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { 
  Plus, Search, MoreHorizontal, ChevronDown, Activity, 
  Target, Clock, Users, Trash2, Edit2, X, Info, 
  Settings, Check, ArrowLeft, Calendar, DollarSign,
  PieChart, BarChart2, Briefcase, FileText, Filter,
  ExternalLink, Download, RefreshCw
} from 'lucide-react';
import { projectAPI, ledgerAPI, authAPI, companyAPI } from '../../services/api';
import useNotificationStore from '../../store/notificationStore';
import ConfirmModal from '../../components/ConfirmModal';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';

// ──────────────────────────────────────────────────────────────────────────────
// PROJECT OVERVIEW (DASHBOARD)
// ──────────────────────────────────────────────────────────────────────────────
const ProjectOverview = ({ project, onEdit }) => {
  const [activeTab, setActiveTab] = useState('Overview');
  const navigate = useNavigate();

  const chartData = [
    { name: '12 Apr', billable: 0, unbilled: 0 },
    { name: '13 Apr', billable: 1.5, unbilled: 0.5 },
    { name: '14 Apr', billable: 0, unbilled: 0 },
    { name: '15 Apr', billable: 0, unbilled: 0 },
    { name: '16 Apr', billable: 0, unbilled: 0 },
    { name: '17 Apr', billable: 0, unbilled: 0 },
    { name: '18 Apr', billable: 0, unbilled: 0 },
  ];

  const Tabs = ['Overview', 'Timesheet', 'Purchases', 'Sales', 'Budget Configuration', 'Journals', 'Activity Logs'];

  const OverviewContent = () => (
    <div className="flex-1 overflow-y-auto p-6 no-scrollbar space-y-8 animate-fade-in">
      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Left Column: Project Info */}
        <div className="col-span-3 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400"><Briefcase size={20}/></div>
              <h3 className="text-lg font-bold text-slate-800 tracking-tight">{project.name}</h3>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400"><Users size={20}/></div>
              <h3 className="text-[15px] font-bold text-blue-600 tracking-tight cursor-pointer hover:underline">{project.Customer?.name || 'Unassigned'}</h3>
            </div>
          </div>

          <div className="space-y-5 pt-6 border-t border-slate-100">
             <div>
               <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">Billing Method</p>
               <p className="text-[13px] font-bold text-slate-700">{project.billingMethod}</p>
             </div>
             <div>
               <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">Rate Per Hour</p>
               <p className="text-[13px] font-black text-slate-900 leading-none">₹{parseFloat(project.ratePerHour || 0).toFixed(2)}</p>
             </div>
             <div className="pt-2">
               <p className="text-[12px] text-slate-400 font-bold mb-1">Add to dashboard watchlist.</p>
               <button className={`text-[11px] font-black uppercase tracking-widest ${project.addToWatchlist ? 'text-emerald-500' : 'text-blue-600'}`}>
                  {project.addToWatchlist ? 'Enabled' : 'Disabled'}
               </button>
             </div>
          </div>
        </div>

        {/* Right Column: Chart & Stats */}
        <div className="col-span-9 border border-slate-100 rounded-xl overflow-hidden shadow-sm bg-white">
           <div className="p-6">
              <div className="flex items-center justify-between mb-8">
                 <div className="flex gap-4">
                   <button className="text-[13px] font-bold text-blue-600 border-b-2 border-blue-600 pb-1">Project Hours</button>
                   <button className="text-[13px] font-bold text-slate-400 hover:text-slate-700 transition-colors">Profitability Summary</button>
                 </div>
                 <button className="flex items-center gap-1.5 text-[12px] font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg">This Week <ChevronDown size={14}/></button>
              </div>

              <div className="h-[280px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} barGap={0}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                       <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 600, fill: '#94a3b8'}} dy={10} />
                       <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 600, fill: '#94a3b8'}} />
                       <Tooltip cursor={{fill: '#f8fafc'}} />
                       <Bar dataKey="billable" fill="#1e61f0" name="Billable Hours" radius={[2, 2, 0, 0]} barSize={20} />
                       <Bar dataKey="unbilled" fill="#f59e0b" name="Unbilled Hours" radius={[2, 2, 0, 0]} barSize={20} />
                    </BarChart>
                 </ResponsiveContainer>
              </div>
           </div>

           <div className="grid grid-cols-4 border-t border-slate-50 divide-x divide-slate-50">
              {[
                { label: 'Logged Hours', val: '00:00', amt: '₹0.00' },
                { label: 'Billable Hours', val: '00:00', amt: '₹0.00' },
                { label: 'Billed Hours', val: '00:00', amt: '₹0.00' },
                { label: 'Unbilled Hours', val: '00:00', amt: '₹0.00' },
              ].map(s => (
                <div key={s.label} className="p-6 text-center">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.15em] mb-1.5">{s.label}</p>
                  <h4 className="text-lg font-black text-slate-800 leading-none mb-1">{s.val}</h4>
                  <p className="text-[13px] font-bold text-slate-400 leading-none">{s.amt}</p>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* Users & Tasks Section */}
      <div className="space-y-10 pt-10 border-t border-slate-50">
         <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
               <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Users</h3>
               <button className="text-blue-600 text-[12px] font-black flex items-center gap-1 uppercase tracking-widest hover:text-blue-700">
                 <Plus size={12} strokeWidth={3} /> Add User
               </button>
            </div>
            <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="text-left py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</th>
                    <th className="text-left py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Logged Hours</th>
                    <th className="text-left py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Billed Hours</th>
                    <th className="text-left py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Unbilled Hours</th>
                    <th className="text-left py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-[13px]">
                  {project.ProjectUsers?.map(pu => (
                    <tr key={pu.id} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-6">
                         <div className="flex flex-col">
                           <span className="font-bold text-slate-700">{pu.User?.name}</span>
                           <span className="text-[11px] text-slate-400">{pu.User?.email}</span>
                         </div>
                      </td>
                      <td className="py-3.5 px-6 font-bold text-slate-600">00:00</td>
                      <td className="py-3.5 px-6 font-bold text-slate-600">00:00</td>
                      <td className="py-3.5 px-6 font-bold text-slate-600">00:00</td>
                      <td className="py-3.5 px-6"><span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[11px] font-bold uppercase tracking-tighter">Admin</span></td>
                    </tr>
                  ))}
                  {!project.ProjectUsers?.length && (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-400 italic">No users assigned yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
         </div>
      </div>
    </div>
  );

  const TimesheetContent = () => (
    <div className="flex-1 p-6 space-y-6 animate-fade-in no-scrollbar overflow-auto">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
           <span className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">View By:</span>
           <button className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded text-[12px] font-bold text-slate-600">Status: All <ChevronDown size={14}/></button>
           <button className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded text-[12px] font-bold text-slate-600">Period: All <ChevronDown size={14}/></button>
        </div>
      </div>
      <div className="border border-slate-100 rounded-xl overflow-hidden bg-white shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="w-10 px-6 py-3"><input type="checkbox" className="rounded border-slate-300" /></th>
              <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
              <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Task</th>
              <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">User</th>
              <th className="px-6 py-3 text-right text-[11px] font-bold text-slate-400 uppercase tracking-widest">Time</th>
              <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Billing Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={6} className="py-40 text-center">
                 <p className="text-slate-300 font-medium italic">There are no timesheets.</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const FinancialTableList = ({ sections }) => (
    <div className="flex-1 p-6 space-y-10 animate-fade-in no-scrollbar overflow-auto">
       <div className="flex items-center gap-2">
          <button className="text-[12px] font-bold text-blue-600 flex items-center gap-1">Go to transactions <ChevronDown size={14}/></button>
       </div>
       {sections.map(s => (
         <div key={s.title} className="space-y-4">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <ChevronDown size={16} className="text-blue-600" />
                 <h3 className="text-[14px] font-bold text-slate-800">{s.title}</h3>
              </div>
              <button className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase tracking-widest"><Filter size={12}/> Status: All <ChevronDown size={12}/></button>
           </div>
           <div className="border border-slate-100 rounded-xl overflow-hidden bg-white shadow-sm">
             <table className="w-full">
                <thead className="bg-slate-50/30 border-b border-slate-50">
                   <tr>
                      {s.headers.map(h => (
                        <th key={h} className="px-6 py-3 text-left text-[10px] font-black text-slate-300 uppercase tracking-widest">{h}</th>
                      ))}
                   </tr>
                </thead>
                <tbody>
                   <tr>
                      <td colSpan={s.headers.length} className="py-16 text-center text-slate-400 text-[13px] italic">There are no {s.title.toLowerCase()}</td>
                   </tr>
                </tbody>
             </table>
           </div>
         </div>
       ))}
    </div>
  );

  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [budgetAccounts, setBudgetAccounts] = useState({
    income: [], expense: [], asset: [], liability: [], equity: []
  });
  const [selectorConfig, setSelectorConfig] = useState(null); // { type: 'income', title: 'Income Accounts' }

  const ActivityLogsContent = () => (
    <div className="flex-1 p-10 animate-fade-in space-y-8">
       {[
         { date: '13/04/2026 03:49 PM', msg: 'User Swathi N added', by: 'Swathi N' },
         { date: '13/04/2026 03:49 PM', msg: 'Project created', by: 'Swathi N' },
       ].map((l, i) => (
         <div key={i} className="flex gap-6 items-start">
            <div className="text-[12px] font-bold text-slate-400 w-32 pt-1">{l.date}</div>
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shadow-sm">
               <Settings size={14} />
            </div>
            <div className="flex flex-col">
               <span className="text-[14px] font-bold text-slate-700">{l.msg}</span>
               <span className="text-[12px] text-slate-400">by {l.by}</span>
            </div>
         </div>
       ))}
    </div>
  );

  const BudgetForm = () => (
     <div className="flex-1 flex flex-col bg-white animate-fade-in no-scrollbar overflow-auto pb-40">
        <div className="px-8 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
           <h3 className="text-lg font-bold text-slate-800">New Budget</h3>
           <button onClick={() => setShowBudgetForm(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
        </div>
        <div className="p-10 max-w-4xl space-y-12">
           <div className="grid grid-cols-12 gap-y-7 items-center">
              <label className="col-span-3 text-[13px] font-bold text-slate-500">Name*</label>
              <div className="col-span-6">
                 <input className="w-full px-3 py-2 border border-slate-200 rounded focus:border-blue-500 outline-none text-[13px]" defaultValue={project.name + ' Budget'} />
              </div>

              <label className="col-span-3 text-[13px] font-bold text-slate-500">Fiscal Year*</label>
              <div className="col-span-6">
                 <select className="w-full px-3 py-2 border border-slate-200 rounded focus:border-blue-500 outline-none text-[13px] appearance-none bg-white">
                    <option>Apr 2026 - Mar 2027</option>
                 </select>
              </div>

              <label className="col-span-3 text-[13px] font-bold text-slate-500">Budget Period*</label>
              <div className="col-span-6">
                 <select className="w-full px-3 py-2 border border-slate-200 rounded focus:border-blue-500 outline-none text-[13px] appearance-none bg-white">
                    <option>Monthly</option>
                 </select>
              </div>

              <label className="col-span-3 text-[13px] font-bold text-slate-500">Project</label>
              <div className="col-span-6">
                 <div className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded text-[14px] font-bold text-slate-700 flex items-center gap-2">
                    <Briefcase size={14} className="text-emerald-500" /> {project.name}
                 </div>
              </div>
           </div>

           <div className="space-y-8 pt-4">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Income and Expense Accounts</p>
              <div className="space-y-6">
                <AccountRow label="Income Accounts" type="income" count={budgetAccounts.income.length} onAdd={() => setSelectorConfig({ type: 'income', title: 'Income Accounts' })} selected={budgetAccounts.income} />
                <AccountRow label="Expense Accounts" type="expense" count={budgetAccounts.expense.length} onAdd={() => setSelectorConfig({ type: 'expense', title: 'Expense Accounts' })} selected={budgetAccounts.expense} />
              </div>
           </div>

           <div className="space-y-8 pt-4">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Asset, Liability, and Equity Accounts</p>
              <div className="space-y-6">
                <AccountRow label="Asset Accounts" type="asset" count={budgetAccounts.asset.length} onAdd={() => setSelectorConfig({ type: 'asset', title: 'Asset Accounts' })} selected={budgetAccounts.asset} />
                <AccountRow label="Liability Accounts" type="liability" count={budgetAccounts.liability.length} onAdd={() => setSelectorConfig({ type: 'liability', title: 'Liability Accounts' })} selected={budgetAccounts.liability} />
                <AccountRow label="Equity Accounts" type="equity" count={budgetAccounts.equity.length} onAdd={() => setSelectorConfig({ type: 'equity', title: 'Equity Accounts' })} selected={budgetAccounts.equity} />
              </div>
           </div>
        </div>
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 flex gap-3 px-12 z-20">
           <button 
             onClick={() => {
                addNotification('Budget created successfully', 'success');
                setShowBudgetForm(false);
             }}
             className="px-6 py-2 bg-blue-600 text-white rounded font-bold text-[13px] hover:bg-blue-700 shadow-lg shadow-blue-100"
           >
             Create Budget
           </button>
           <button onClick={() => setShowBudgetForm(false)} className="px-6 py-2 border border-slate-200 rounded font-bold text-[13px] text-slate-600 hover:bg-slate-50">Cancel</button>
        </div>

        {selectorConfig && (
          <LedgerSelectorModal 
            config={selectorConfig} 
            onClose={() => setSelectorConfig(null)} 
            onSelected={(ledgers) => {
              setBudgetAccounts(prev => ({ ...prev, [selectorConfig.type]: ledgers }));
              setSelectorConfig(null);
            }}
          />
        )}
     </div>
  );

  const AccountRow = ({ label, onAdd, selected }) => (
    <div className="grid grid-cols-12 items-start gap-4">
      <label className="col-span-3 text-[13px] font-bold text-slate-500 pt-2">{label}</label>
      <div className="col-span-7 flex flex-wrap gap-2 min-h-[40px] p-2 border border-dashed border-slate-200 rounded bg-slate-50/20 items-center">
         {selected.length > 0 ? (
            selected.map(acc => (
              <span key={acc.id} className="bg-blue-50 text-blue-700 text-[11px] font-bold px-2 py-1 rounded-full border border-blue-100 flex items-center gap-1">
                {acc.name} <X size={10} className="cursor-pointer" onClick={(e) => {
                  e.stopPropagation();
                  setBudgetAccounts(prev => ({
                    ...prev,
                    [type]: prev[type].filter(a => a.id !== acc.id)
                  }));
                }}/>
              </span>
            ))
         ) : (
           <span className="text-[12px] text-slate-300 italic px-2">No accounts selected</span>
         )}
      </div>
      <div className="col-span-2">
        <button onClick={onAdd} className="w-full py-2 border border-blue-200 rounded text-[11px] font-black text-blue-600 bg-blue-50/30 uppercase tracking-widest hover:bg-blue-100 transition-colors">Add Accounts</button>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden animate-fade-in relative">
      {/* Header */}
      <header className="h-16 px-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-20">
        <div className="flex items-center gap-4">
          <ArrowLeft onClick={() => navigate('/time-tracking/projects')} size={18} className="text-slate-400 cursor-pointer hover:text-slate-600 transition-colors" />
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">{project.name}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onEdit} className="p-1.5 hover:bg-slate-50 rounded text-slate-500 border border-slate-200 text-[12px] font-bold px-3 transition-colors">Edit</button>
          <button className="bg-blue-600 text-white text-[12px] font-bold px-3 py-1.5 rounded hover:bg-blue-700 shadow-sm transition-all">Log Time</button>
          <div className="flex items-center border border-slate-200 rounded overflow-hidden ml-1">
             <button className="px-3 py-1.5 text-[12px] font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-1 border-r border-slate-200">New Transaction <ChevronDown size={14}/></button>
             <button className="p-1.5 hover:bg-slate-50 text-slate-500"><MoreHorizontal size={16}/></button>
          </div>
          <button onClick={() => navigate('/time-tracking/projects')} className="p-1.5 hover:bg-slate-50 text-slate-400"><X size={18}/></button>
        </div>
      </header>

      {/* Tabs */}
      <div className="px-6 border-b border-slate-100 flex items-center gap-8 bg-white/50 backdrop-blur sticky top-16 z-20">
        {Tabs.map((tab) => (
          <button 
            key={tab} 
            onClick={() => { setActiveTab(tab); setShowBudgetForm(false); }}
            className={`py-3.5 text-[12px] font-bold tracking-tight border-b-2 transition-all ${activeTab === tab ? 'text-blue-600 border-blue-600' : 'text-slate-400 border-transparent hover:text-slate-700'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Overview' && <OverviewContent />}
      {activeTab === 'Timesheet' && <TimesheetContent />}
      {activeTab === 'Purchases' && (
        <FinancialTableList sections={[
          { title: 'Expenses', headers: ['Date', 'Expense Account', 'Reference#', 'Vendor Name', 'Paid Through', 'Customer Name', 'Amount', 'Status'] },
          { title: 'Bills', headers: ['Date', 'Bill#', 'Reference#', 'Vendor Name', 'Project Cost', 'Amount', 'Balance Due', 'Status'] },
          { title: 'Purchase Orders', headers: ['Purchase Order#', 'Reference#', 'Date', 'Vendor Name', 'Delivery Date', 'Project Cost', 'Amount', 'Status'] },
          { title: 'Vendor Credits', headers: ['Date', 'Vendor Credit#', 'Reference#', 'Vendor Name', 'Project Cost', 'Amount', 'Balance Due', 'Status'] }
        ]} />
      )}
      {activeTab === 'Sales' && (
        <FinancialTableList sections={[
          { title: 'Invoices', headers: ['Date', 'Invoice#', 'Reference#', 'Project Fee', 'Amount', 'Balance Due', 'Status'] },
          { title: 'Quotes', headers: ['Date', 'Quote#', 'Reference#', 'Amount', 'Status'] },
          { title: 'Retainer Invoices', headers: ['Date', 'Retainer Invoice Number', 'Reference#', 'Amount', 'Balance Due', 'Status'] },
          { title: 'Sales Orders', headers: ['Date', 'Sales Order#', 'Reference#', 'Amount', 'Status'] }
        ]} />
      )}
      {activeTab === 'Budget Configuration' && (
        showBudgetForm ? <BudgetForm /> : (
          <div className="flex-1 flex flex-col items-center justify-center p-20 animate-fade-in text-center space-y-6">
            <h3 className="text-3xl font-black text-slate-800 tracking-tighter">Budget your business finance. Stay on top of your expenses.</h3>
            <p className="text-[15px] font-medium text-slate-400 max-w-xl">Create budgets for the various activities of your business, compare them with the actuals, and see how your business is performing.</p>
            <button onClick={() => setShowBudgetForm(true)} className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all">CREATE BUDGET</button>
          </div>
        )
      )}
      {activeTab === 'Journals' && (
        <div className="flex-1 flex items-center justify-center text-slate-300 italic font-medium animate-fade-in p-20 text-center">
           There are no journals associated with this project.
        </div>
      )}
      {activeTab === 'Activity Logs' && <ActivityLogsContent />}
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
// NEW USER MODAL
// ──────────────────────────────────────────────────────────────────────────────
const NewUserModal = ({ isOpen, onClose, onSaved }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) return;
    setSaving(true);
    try {
      const res = await authAPI.register(name, email, password, 'DATA_ENTRY');
      onSaved(res.data?.user || { id: Date.now().toString(), name, email });
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to add new user. They may already exist or there is a server error.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scale-up">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-[16px] font-black text-slate-900">Add New User</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"><X size={18}/></button>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
             <label className="text-[12px] font-bold text-slate-500 mb-1 block">Full Name</label>
             <input required value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-lg focus:border-blue-500 outline-none" />
          </div>
          <div>
             <label className="text-[12px] font-bold text-slate-500 mb-1 block">Email Address</label>
             <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-lg focus:border-blue-500 outline-none" />
          </div>
          <div>
             <label className="text-[12px] font-bold text-slate-500 mb-1 block">Temporary Password</label>
             <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-lg focus:border-blue-500 outline-none" />
          </div>
          <div className="pt-2 flex gap-3">
             <button type="submit" disabled={saving} className="flex-1 bg-blue-600 text-white font-bold py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-[13px]">
               {saving ? 'Adding...' : 'Add User'}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
// LEDGER SELECTOR MODAL (Multi-Select)
// ──────────────────────────────────────────────────────────────────────────────
const LedgerSelectorModal = ({ config, onClose, onSelected }) => {
  const [ledgers, setLedgers] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await ledgerAPI.getAll();
        setLedgers(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const filtered = ledgers.filter(l => 
    l.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (l) => {
    if (selected.find(s => s.id === l.id)) {
      setSelected(selected.filter(s => s.id !== l.id));
    } else {
      setSelected([...selected, l]);
    }
  };

  return (
    <div className="fixed inset-0 z-[700] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up flex flex-col max-h-[80vh]">
         <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-[16px] font-black text-slate-800">Select {config.title}</h3>
            <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded text-slate-400 transition-colors"><X size={20}/></button>
         </div>
         
         <div className="p-4 bg-slate-50 border-b border-slate-100">
            <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
               <input 
                  autoFocus
                  placeholder="Search accounts..." 
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-[13px] outline-none focus:border-blue-500 transition-all font-medium"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
               />
            </div>
         </div>

         <div className="flex-1 overflow-y-auto no-scrollbar p-2">
            {loading ? (
              <div className="py-20 text-center text-slate-400 italic font-medium">Loading accounts...</div>
            ) : filtered.length > 0 ? (
               <div className="space-y-1">
                  {filtered.map(l => {
                    const isSelected = selected.find(s => s.id === l.id);
                    return (
                      <div 
                        key={l.id} 
                        onClick={() => toggle(l)}
                        className={`px-4 py-3 rounded-xl cursor-pointer flex items-center justify-between transition-all ${isSelected ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-600'}`}
                      >
                         <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-blue-600 border-blue-600 shadow-md' : 'border-slate-200'}`}>
                               {isSelected && <Check size={12} className="text-white" strokeWidth={4} />}
                            </div>
                            <span className="text-[13px] font-bold">{l.name}</span>
                         </div>
                         <span className="text-[11px] font-black uppercase tracking-widest text-slate-300">{l.Group?.name}</span>
                      </div>
                    );
                  })}
               </div>
            ) : (
               <div className="py-20 text-center text-slate-400 italic">No accounts found matching "{search}"</div>
            )}
         </div>

         <div className="p-4 border-t border-slate-50 bg-slate-50/50 flex items-center justify-between">
            <span className="text-[12px] font-bold text-slate-500">{selected.length} accounts selected</span>
            <div className="flex gap-2">
               <button onClick={onClose} className="px-4 py-2 text-[12px] font-bold text-slate-500 hover:text-slate-700">Cancel</button>
               <button 
                  onClick={() => onSelected(selected)}
                  disabled={selected.length === 0}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-black text-[12px] uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-200"
               >
                 Associate
               </button>
            </div>
         </div>
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
// NEW PROJECT FORM
// ──────────────────────────────────────────────────────────────────────────────
const NewProjectForm = ({ companyId, onCancel, onSave, editId }) => {
  const navigate = useNavigate();
  const addNotification = useNotificationStore(state => state.addNotification);
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [allSystemUsers, setAllSystemUsers] = useState([]);
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [activeUserIdx, setActiveUserIdx] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    projectCode: '',
    description: '',
    customerLedgerId: '',
    billingMethod: 'Hourly Project Rate',
    budgetType: 'None',
    costBudget: 0,
    revenueBudget: 0,
    ratePerHour: 0,
    startDate: '',
    endDate: '',
    addToWatchlist: false
  });

  const [tasks, setTasks] = useState([{ name: '', description: '', billingRate: 0, isBillable: true }]);
  const [users, setUsers] = useState([{ UserId: '', billingRate: 0, role: 'Standard User' }]);

  useEffect(() => {
    Promise.all([
      ledgerAPI.getByCompany(companyId),
      companyAPI.getById(companyId)
    ]).then(([ledgersRes, compRes]) => {
      const allLedgers = Array.isArray(ledgersRes.data) ? ledgersRes.data : [];
      const customerLedgers = allLedgers.filter(l => 
        l.Group?.name?.toLowerCase().includes('debtor') || 
        l.groupName?.toLowerCase().includes('debtor') ||
        l.Group?.name?.toLowerCase().includes('customer') ||
        l.groupName?.toLowerCase().includes('customer')
      );
      setCustomers(customerLedgers);
      
      const companyUsers = compRes.data?.Users || [];
      if (companyUsers.length > 0) {
        setAllSystemUsers(companyUsers);
      } else {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        setAllSystemUsers([currentUser]);
      }
    }).catch(err => {
      console.error(err);
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      setAllSystemUsers([currentUser]);
    });

    if (editId) {
       setLoading(true);
       projectAPI.getById(editId).then(res => {
         const p = res.data;
         setFormData({
           name: p.name || '',
           projectCode: p.projectCode || '',
           description: p.description || '',
           customerLedgerId: p.customerLedgerId || '',
           billingMethod: p.billingMethod || 'Hourly Project Rate',
           budgetType: p.budgetType || 'None',
           costBudget: p.costBudget || 0,
           revenueBudget: p.revenueBudget || 0,
           ratePerHour: p.ratePerHour || 0,
           startDate: p.startDate || '',
           endDate: p.endDate || '',
           addToWatchlist: p.addToWatchlist || false
         });
         if (p.tasks?.length) setTasks(p.tasks);
         if (p.ProjectUsers?.length) setUsers(p.ProjectUsers.map(pu => ({ 
           UserId: pu.UserId, 
           billingRate: pu.billingRate, 
           role: pu.role 
         })));
         setLoading(false);
       });
    }
  }, [companyId, editId]);

  const addTask = () => setTasks([...tasks, { name: '', description: '', billingRate: 0, isBillable: true }]);
  const removeTask = (idx) => setTasks(tasks.filter((_, i) => i !== idx));
  
  const addUser = () => setUsers([...users, { UserId: '', billingRate: 0, role: 'Standard User' }]);
  const removeUser = (idx) => setUsers(users.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name) return addNotification('Project Name is required', 'warning');
    if (!formData.customerLedgerId) return addNotification('Please select a customer', 'warning');
    
    // Filter out empty tasks or check if all tasks have names
    const validTasks = tasks.map(t => ({...t, name: t.name.trim()})).filter(t => t.name !== '');
    if (tasks.length > 0 && validTasks.length !== tasks.length) {
      return addNotification('All tasks must have a name', 'warning');
    }

    // Filter out users with empty IDs
    const validUsers = users.filter(u => u.UserId !== '');

    const cleanPayload = { 
      ...formData, 
      CompanyId: companyId, 
      tasks: validTasks, 
      users: validUsers,
      startDate: formData.startDate || null,
      endDate: formData.endDate || null,
      ratePerHour: parseFloat(formData.ratePerHour) || 0,
      costBudget: parseFloat(formData.costBudget) || 0,
      revenueBudget: parseFloat(formData.revenueBudget) || 0
    };

    setLoading(true);
    try {
      if (editId) {
        await projectAPI.update(editId, cleanPayload);
        addNotification('Project updated successfully', 'success');
      } else {
        await projectAPI.create(cleanPayload);
        addNotification('Project created successfully', 'success');
      }
      onSave();
    } catch (err) {
      console.error(err);
      addNotification(err.response?.data?.error || 'Failed to save project', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden animate-fade-in">
      <header className="h-16 border-b border-slate-100 flex items-center justify-between px-10 shrink-0 bg-slate-50/30">
        <h2 className="text-xl font-black text-slate-900 tracking-tight">{editId ? 'Edit Project' : 'New Project'}</h2>
        <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"><X size={20}/></button>
      </header>

      <div className="flex-1 overflow-y-auto p-12 no-scrollbar">
        <form className="max-w-5xl mx-auto space-y-16 pb-20" onSubmit={handleSubmit}>
          
          {/* Section 1: Basic Info */}
          <div className="space-y-10">
            <h3 className="text-[11px] font-black text-blue-600 uppercase tracking-[0.2em] border-b border-slate-100 pb-4">Basic Information</h3>
            
            <div className="grid grid-cols-12 gap-x-12 gap-y-8">
              <div className="col-span-12 lg:col-span-8 space-y-6">
                <div className="grid grid-cols-12 items-center gap-4">
                  <label className="col-span-3 text-[13px] font-bold text-slate-500">Project Name*</label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="col-span-9 px-4 py-2.5 border border-slate-200 rounded-lg text-[14px] font-medium focus:border-blue-500 outline-none transition-all shadow-sm" />
                </div>
                <div className="grid grid-cols-12 items-center gap-4">
                  <label className="col-span-3 text-[13px] font-bold text-slate-500">Project Code</label>
                  <input value={formData.projectCode} onChange={e => setFormData({...formData, projectCode: e.target.value})} className="col-span-9 px-4 py-2.5 border border-slate-200 rounded-lg text-[14px] font-medium focus:border-blue-500 outline-none transition-all shadow-sm" />
                </div>
                <div className="grid grid-cols-12 items-center gap-4">
                  <label className="col-span-3 text-[13px] font-bold text-slate-500">Customer Name*</label>
                  <div className="col-span-9 flex gap-2">
                    <select 
                      required 
                      value={formData.customerLedgerId} 
                      onChange={e => {
                        if (e.target.value === 'NEW') {
                          navigate('/customers/new');
                        } else {
                          setFormData({...formData, customerLedgerId: e.target.value});
                        }
                      }} 
                      className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-[14px] font-medium focus:border-blue-500 outline-none transition-all appearance-none bg-white"
                    >
                      <option value="">Select customer</option>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      <option value="NEW" className="text-blue-600 font-bold tracking-tight">+ New Customer</option>
                    </select>
                    <button 
                      type="button" 
                      onClick={() => navigate('/customers/new')}
                      title="Add New Customer"
                      className="p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all flex items-center justify-center shrink-0"
                    >
                      <Search size={18}/>
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-12 items-center gap-4">
                  <label className="col-span-3 text-[13px] font-bold text-slate-500">Billing Method*</label>
                  <select value={formData.billingMethod} onChange={e => setFormData({...formData, billingMethod: e.target.value})} className="col-span-9 px-4 py-2.5 border border-slate-200 rounded-lg text-[14px] font-medium focus:border-blue-500 outline-none transition-all appearance-none bg-white">
                    <option value="Hourly Project Rate">Hourly Project Rate</option>
                    <option value="Hourly Staff Rate">Hourly Staff Rate</option>
                    <option value="Hourly Task Rate">Hourly Task Rate</option>
                    <option value="Fixed Cost">Fixed Cost</option>
                  </select>
                </div>
                <div className="grid grid-cols-12 items-start gap-4">
                  <label className="col-span-3 text-[13px] font-bold text-slate-500 mt-3">Description</label>
                  <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows="3" maxLength="2000" className="col-span-9 px-4 py-3 border border-slate-200 rounded-lg text-[14px] font-medium focus:border-blue-500 outline-none transition-all resize-none shadow-sm" placeholder="Max. 2000 characters" />
                </div>
              </div>
            </div>
          </div>

          {/* Budget */}
          <div className="space-y-10">
            <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-4">Budget</h3>
            <div className="grid grid-cols-12 gap-8 items-center">
              <label className="col-span-2 text-[13px] font-bold text-slate-500">Cost Budget</label>
              <div className="col-span-4 relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[12px] font-bold">INR</span>
                <input type="number" value={formData.costBudget} onChange={e => setFormData({...formData, costBudget: parseFloat(e.target.value)})} className="w-full pl-12 pr-4 py-2.5 border border-slate-200 rounded-lg text-[14px] font-bold text-slate-700 focus:border-blue-500 outline-none transition-all" />
              </div>
              <label className="col-span-2 text-[13px] font-bold text-slate-500">Revenue Budget</label>
              <div className="col-span-4 relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[12px] font-bold">INR</span>
                <input type="number" value={formData.revenueBudget} onChange={e => setFormData({...formData, revenueBudget: parseFloat(e.target.value)})} className="w-full pl-12 pr-4 py-2.5 border border-slate-200 rounded-lg text-[14px] font-bold text-slate-700 focus:border-blue-500 outline-none transition-all" />
              </div>
            </div>
            <button type="button" className="text-blue-600 text-[12px] font-bold hover:underline">Add budget for project hours.</button>
          </div>

          {/* Users Table */}
          <div className="space-y-6">
            <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-widest">Users</h3>
            <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="text-left py-3 px-6 text-[11px] font-black text-slate-400">S.NO</th>
                    <th className="text-left py-3 px-6 text-[11px] font-black text-slate-400">USER</th>
                    <th className="text-left py-3 px-6 text-[11px] font-black text-slate-400">EMAIL</th>
                    <th className="w-20"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {users.map((u, i) => (
                    <tr key={i}>
                      <td className="py-4 px-6 text-[13px] font-bold text-slate-400">{i + 1}</td>
                      <td className="py-4 px-6">
                        <select value={u.UserId} onChange={e => {
                          if (e.target.value === 'NEW') {
                            setActiveUserIdx(i);
                            setShowNewUserModal(true);
                            return;
                          }
                          const newU = [...users];
                          newU[i].UserId = e.target.value;
                          setUsers(newU);
                        }} className="w-full px-3 py-2 border border-slate-100 rounded-lg text-[13px] font-medium text-slate-700 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer hover:bg-slate-50">
                          <option value="">Select user</option>
                          {allSystemUsers.map(usu => <option key={usu.id} value={usu.id}>{usu.name}</option>)}
                          <option value="NEW" className="font-bold text-blue-600">➕ Add New User</option>
                        </select>
                      </td>
                      <td className="py-4 px-6 text-[13px] text-slate-500">
                         {allSystemUsers.find(usu => usu.id === u.UserId)?.email || '—'}
                      </td>
                      <td className="py-4 px-6 text-right">
                        {users.length > 1 && <button type="button" onClick={() => removeUser(i)} className="text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-4 bg-slate-50/50 border-t border-slate-100">
                <button type="button" onClick={addUser} className="text-blue-600 text-[12px] font-black flex items-center gap-1.5 uppercase tracking-widest hover:text-blue-700">
                  <Plus size={14} strokeWidth={3} /> Add User
                </button>
              </div>
            </div>
          </div>

          {/* Tasks Table */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-widest">Project Tasks</h3>
              <button type="button" className="text-blue-600 text-[12px] font-bold flex items-center gap-2 hover:underline">
                <Download size={14} /> Import project tasks from existing projects.
              </button>
            </div>
            <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="text-left py-3 px-6 text-[11px] font-black text-slate-400">S.NO</th>
                    <th className="text-left py-3 px-6 text-[11px] font-black text-slate-400">TASK NAME</th>
                    <th className="text-left py-3 px-6 text-[11px] font-black text-slate-400">DESCRIPTION</th>
                    <th className="text-center py-3 px-6 text-[11px] font-black text-slate-400">BILLABLE</th>
                    <th className="w-20"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {tasks.map((t, i) => (
                    <tr key={i}>
                      <td className="py-4 px-6 text-[13px] font-bold text-slate-400">{i + 1}</td>
                      <td className="py-4 px-6">
                        <input value={t.name} onChange={e => {
                          const nt = [...tasks]; nt[i].name = e.target.value; setTasks(nt);
                        }} placeholder="Task Name" className="w-full px-3 py-2 border border-slate-100 rounded-lg text-[13px] focus:border-blue-500 outline-none" />
                      </td>
                      <td className="py-4 px-6">
                        <input value={t.description} onChange={e => {
                          const nt = [...tasks]; nt[i].description = e.target.value; setTasks(nt);
                        }} placeholder="Description" className="w-full px-3 py-2 border border-slate-100 rounded-lg text-[13px] focus:border-blue-500 outline-none" />
                      </td>
                      <td className="py-4 px-6 text-center">
                        <input type="checkbox" checked={t.isBillable} onChange={e => {
                          const nt = [...tasks]; nt[i].isBillable = e.target.checked; setTasks(nt);
                        }} className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500" />
                      </td>
                      <td className="py-4 px-6 text-right">
                        {tasks.length > 1 && <button type="button" onClick={() => removeTask(i)} className="text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-4 bg-slate-50/50 border-t border-slate-100">
                <button type="button" onClick={addTask} className="text-blue-600 text-[12px] font-black flex items-center gap-1.5 uppercase tracking-widest hover:text-blue-700">
                  <Plus size={14} strokeWidth={3} /> Add Project Task
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 py-4 border-t border-slate-100">
             <input type="checkbox" checked={formData.addToWatchlist} onChange={e => setFormData({...formData, addToWatchlist: e.target.checked})} className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500" />
             <label className="text-[13px] font-bold text-slate-700">Add to the watchlist on my dashboard</label>
             <Info size={14} className="text-slate-300 pointer-events-none" />
          </div>

          <div className="flex gap-4 pt-10 border-t border-slate-100">
            <button type="submit" disabled={loading} className="px-10 py-3 bg-blue-600 text-white rounded-lg text-[13px] font-black hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all uppercase tracking-widest flex items-center gap-2">
              {loading && <RefreshCw className="animate-spin" size={16}/>} Save
            </button>
            <button type="button" onClick={onCancel} className="px-10 py-3 bg-white border border-slate-200 text-slate-600 rounded-lg text-[13px] font-black hover:bg-slate-50 transition-all uppercase tracking-widest">Cancel</button>
          </div>
        </form>
      </div>

      <NewUserModal 
        isOpen={showNewUserModal} 
        onClose={() => { setShowNewUserModal(false); setActiveUserIdx(null); }}
        onSaved={(newUser) => {
           setAllSystemUsers(prev => [...prev, newUser]);
           if (activeUserIdx !== null) {
              const newU = [...users];
              newU[activeUserIdx].UserId = newUser.id;
              setUsers(newU);
           }
        }} 
      />
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
// MAIN VIEW ROUTER
// ──────────────────────────────────────────────────────────────────────────────
const ProjectsView = ({ companyId }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isNew = location.pathname.includes('/new');
  const isEdit = location.pathname.includes('/edit');

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(id || null);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  const addNotification = useNotificationStore(state => state.addNotification);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await projectAPI.getByCompany(companyId);
      setProjects(res.data);
    } catch (err) {
      addNotification('Failed to load projects', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [companyId]);

  useEffect(() => {
    setSelectedId(id || null);
  }, [id]);

  const filtered = projects.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.Customer?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const selectedProject = useMemo(() => projects.find(p => p.id === selectedId), [projects, selectedId]);

  const [showNewDropdown, setShowNewDropdown] = useState(false);

  if (isNew || isEdit) {
    const returnTo = location.state?.returnTo || '/time-tracking/projects';
    return <NewProjectForm companyId={companyId} editId={isEdit ? id : null} onCancel={() => navigate(returnTo)} onSave={() => { fetchProjects(); navigate(returnTo); }} />;
  }

  // --- FULL WIDTH TABLE VIEW ---
  const ProjectsTable = () => (
    <div className="flex-1 flex flex-col min-h-screen bg-white animate-fade-in no-scrollbar">
      {/* Header Section */}
      <header className="px-8 py-5 flex items-center justify-between border-b border-slate-100">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2 cursor-pointer hover:bg-slate-50 px-2 py-1 rounded transition-all">
          All Projects <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full text-[12px] font-black ml-1">{projects.length}</span> <ChevronDown size={18} className="text-blue-400 mt-1" />
        </h1>

        <div className="flex items-center gap-2">
          <div className="relative group mr-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
               value={search}
               onChange={e => setSearch(e.target.value)}
               placeholder="Search..."
               className="w-48 pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-[13px] outline-none focus:border-blue-500 transition-all"
            />
          </div>
          
          <button 
             onClick={() => navigate('/time-tracking/projects/new')}
             className="h-8 px-4 bg-blue-600 text-white rounded font-bold text-[13px] hover:bg-blue-700 shadow-sm flex items-center gap-2"
          >
             <Plus size={16} strokeWidth={3} /> New
          </button>
          <button className="h-8 w-8 flex items-center justify-center border border-slate-200 rounded text-slate-400 hover:bg-slate-50 transition-all">
             <MoreHorizontal size={16} />
          </button>
        </div>
      </header>

      {/* Table Section */}
      <div className="flex-1 p-8">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-y border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              <th className="px-6 py-3 text-left">Name</th>
              <th className="px-6 py-4 text-left">Customer Name</th>
              <th className="px-6 py-4 text-left">Billing Method</th>
              <th className="px-6 py-4 text-right">Budget</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-center w-40">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-20 text-center text-slate-400 italic text-[13px]">Loading projects...</td>
              </tr>
            ) : filtered.length > 0 ? (
              filtered.map(p => (
                <tr 
                  key={p.id}
                  className="group hover:bg-blue-50/20 transition-colors cursor-pointer"
                  onClick={() => navigate(`/time-tracking/projects/view/${p.id}`)}
                >
                  <td className="px-6 py-4">
                     <span className="text-[14px] font-medium text-blue-600 hover:underline">{p.name}</span>
                  </td>
                  <td className="px-6 py-4">
                     <span className="text-[14px] text-slate-600">{p.Customer?.name || '---'}</span>
                  </td>
                  <td className="px-6 py-4 text-[13px] text-slate-400">
                     {p.billingMethod}
                  </td>
                  <td className="px-6 py-4 text-right">
                     <span className="text-[14px] text-slate-900 font-medium">₹{parseFloat(p.revenueBudget || 0).toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight ${p.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center" onClick={e => e.stopPropagation()}>
                     <div className="flex items-center justify-center gap-2">
                        <button 
                           onClick={() => navigate(`/time-tracking/projects/edit/${p.id}`)}
                           className="flex items-center gap-1 px-2 py-1 border border-slate-200 rounded text-slate-600 hover:bg-slate-50 transition-all text-[12px] font-bold"
                        >
                           <Edit2 size={12} className="text-slate-400" /> Edit
                        </button>
                        <button 
                           onClick={() => setDeleteId(p.id)}
                           className="p-1.5 border border-slate-200 rounded text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                        >
                           <Trash2 size={14} />
                        </button>
                     </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                 <td colSpan={6} className="py-20 text-center text-slate-400">
                    <p className="text-[13px]">No records found</p>
                 </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-white overflow-hidden no-scrollbar">
      {/* Dynamic Content Display */}
      {selectedProject ? (
         <div className="flex-1 overflow-auto bg-white relative no-scrollbar">
            <button 
               onClick={() => navigate('/time-tracking/projects')}
               className="fixed right-6 top-5 text-slate-300 hover:text-slate-600 transition-all z-[100] p-1.5 hover:bg-slate-100 rounded border border-slate-100 bg-white"
            >
               <X size={18} />
            </button>
            <ProjectOverview 
               project={selectedProject} 
               onEdit={() => navigate(`/time-tracking/projects/edit/${selectedId}`)} 
            />
         </div>
      ) : (
        <ProjectsTable />
      )}

      <ConfirmModal 
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          try {
            await projectAPI.delete(deleteId);
            addNotification('Project deleted successfully', 'success');
            fetchProjects();
            setDeleteId(null);
          } catch {
            addNotification('Failed to delete project', 'error');
          }
        }}
        title="Delete Project"
        message="Are you sure you want to delete this project? This action cannot be undone."
      />
    </div>
  );
};

export default ProjectsView;
