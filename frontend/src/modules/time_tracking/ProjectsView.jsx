import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { 
  Plus, Search, MoreHorizontal, ChevronDown, Activity, 
  Target, Clock, Users, Trash2, Edit2, X, Info, 
  Settings, Check, ArrowLeft, Calendar, DollarSign,
  PieChart, BarChart2, Briefcase, FileText, Filter,
  ExternalLink, Download, RefreshCw
} from 'lucide-react';
import { projectAPI, ledgerAPI, authAPI, companyAPI, timesheetAPI } from '../../services/api';
import useNotificationStore from '../../store/notificationStore';
import ConfirmModal from '../../components/ConfirmModal';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';

// ──────────────────────────────────────────────────────────────────────────────
// PROJECT USER SELECTOR MODAL
// ──────────────────────────────────────────────────────────────────────────────
const ProjectUserSelectorModal = ({ isOpen, onClose, currentMemberIds, onSelect }) => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      authAPI.getAllUsers()
        .then(res => setUsers(res.data))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = users.filter(u => 
    !currentMemberIds.has(u.id) && 
    (u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-[0_30px_80px_rgba(0,0,0,0.2)] w-full max-w-lg overflow-hidden animate-scale-up">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h3 className="text-[16px] font-bold text-slate-900 tracking-tight">Add Team Members</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors"><X size={18}/></button>
        </div>
        <div className="p-4 border-b border-slate-100">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search users by name or email..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-[13px] font-medium outline-none focus:border-blue-500 transition-all bg-slate-50 focus:bg-white"
            />
          </div>
        </div>
        <div className="max-h-72 overflow-y-auto no-scrollbar p-2">
          {loading ? (
             <div className="py-8 text-center text-slate-400 font-medium italic animate-pulse">Loading users...</div>
          ) : filtered.length === 0 ? (
             <div className="py-8 text-center text-slate-400 font-medium italic">No available users found.</div>
          ) : (
             filtered.map(u => (
               <div 
                 key={u.id}
                 onClick={() => onSelect([u])}
                 className="p-3 hover:bg-blue-50 rounded-xl cursor-pointer flex items-center gap-3 transition-colors group mx-2 my-1"
               >
                 <div className="w-10 h-10 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center font-bold text-[14px] group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                   {u.name?.[0]}
                 </div>
                 <div className="flex flex-col">
                   <span className="text-[14px] font-bold text-slate-800 tracking-tight group-hover:text-blue-700">{u.name}</span>
                   <span className="text-[12px] font-medium text-slate-500">{u.email}</span>
                 </div>
                 <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                   <span className="px-3 py-1 bg-white border border-blue-200 text-blue-600 rounded-lg text-[11px] font-bold uppercase tracking-widest shadow-sm">Select</span>
                 </div>
               </div>
             ))
          )}
        </div>
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
// LEDGER SELECTOR MODAL (FOR BUDGETING)
// ──────────────────────────────────────────────────────────────────────────────
const LedgerSelectorModal = ({ isOpen, onClose, onSelect, companyId, type = 'all' }) => {
  const [ledgers, setLedgers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && companyId) {
      setLoading(true);
      ledgerAPI.getByCompany(companyId)
        .then(res => {
            let data = res.data || [];
            if (type === 'income') {
                data = data.filter(l => l.Group?.name?.toLowerCase().includes('income') || l.Group?.name?.toLowerCase().includes('sales'));
            } else if (type === 'expense') {
                data = data.filter(l => l.Group?.name?.toLowerCase().includes('expense') || l.Group?.name?.toLowerCase().includes('purchase') || l.Group?.name?.toLowerCase().includes('direct'));
            }
            setLedgers(data);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, companyId, type]);

  if (!isOpen) return null;

  const filtered = ledgers.filter(l => l.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-up border border-slate-100">
        <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">Select {type} Account</h3>
            <p className="text-[11px] font-bold text-slate-400 tracking-widest uppercase">Choose a ledger for your budget</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl text-slate-400 transition-all"><X size={20}/></button>
        </div>
        <div className="p-6 border-b border-slate-50">
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={`Search ${type} accounts...`}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-bold outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner"
            />
          </div>
        </div>
        <div className="max-h-80 overflow-y-auto no-scrollbar p-4 space-y-1">
          {loading ? (
             <div className="py-12 text-center text-slate-400 font-bold italic animate-pulse uppercase tracking-widest">Fetching Ledgers...</div>
          ) : filtered.length === 0 ? (
             <div className="py-12 text-center flex flex-col items-center gap-4 text-slate-300">
                <Search size={40} strokeWidth={1}/>
                <p className="font-bold uppercase tracking-widest text-[11px]">No accounts found</p>
             </div>
          ) : (
             filtered.map(l => (
               <div 
                 key={l.id}
                 onClick={() => onSelect(l)}
                 className="p-4 hover:bg-blue-50 rounded-2xl cursor-pointer flex items-center justify-between transition-all group border border-transparent hover:border-blue-100"
               >
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-blue-500 group-hover:border-blue-200 transition-all shadow-sm">
                       <FileText size={18}/>
                    </div>
                    <div>
                       <span className="block text-[14px] font-black text-slate-800 tracking-tight group-hover:text-blue-700">{l.name}</span>
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{l.Group?.name || 'General Ledger'}</span>
                    </div>
                 </div>
                 <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Plus size={18} className="text-blue-600"/>
                 </div>
               </div>
             ))
          )}
        </div>
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
// LOG TIME MODAL
// ──────────────────────────────────────────────────────────────────────────────
const LogTimeModal = ({ isOpen, onClose, onLog, project, companyId }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    hours: '',
    description: '',
    UserId: '',
    ProjectTaskId: '',
    isBillable: true
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.UserId || !formData.hours) return;
    setLoading(true);
    try {
      await timesheetAPI.log({ ...formData, ProjectId: project.id, CompanyId: companyId });
      onLog();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[900] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-scale-up border border-slate-100">
        <form onSubmit={handleSubmit}>
          <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">Log Time Entry</h3>
              <p className="text-[11px] font-bold text-slate-400 tracking-widest uppercase">Record hours worked on {project.name}</p>
            </div>
            <button type="button" onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl text-slate-400 transition-all"><X size={20}/></button>
          </div>
          
          <div className="p-8 space-y-8">
            <div className="grid grid-cols-2 gap-6">
               <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Date <span className="text-rose-500">*</span></label>
                  <input 
                    type="date"
                    required
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    className="w-full px-5 py-3 border border-slate-200 rounded-xl text-[14px] font-bold outline-none focus:border-blue-500 transition-all bg-slate-50 focus:bg-white shadow-inner"
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Hours <span className="text-rose-500">*</span></label>
                  <input 
                    type="number"
                    step="0.01"
                    required
                    placeholder="E.g. 1.5"
                    value={formData.hours}
                    onChange={e => setFormData({...formData, hours: e.target.value})}
                    className="w-full px-5 py-3 border border-slate-200 rounded-xl text-[14px] font-bold outline-none focus:border-blue-500 transition-all bg-slate-50 focus:bg-white shadow-inner"
                  />
               </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
               <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Team Member <span className="text-rose-500">*</span></label>
                  <select 
                    required
                    value={formData.UserId}
                    onChange={e => setFormData({...formData, UserId: e.target.value})}
                    className="w-full px-5 py-3 border border-slate-200 rounded-xl text-[14px] font-bold outline-none focus:border-blue-500 transition-all bg-slate-50 focus:bg-white shadow-sm"
                  >
                    <option value="">Select User</option>
                    {project.ProjectUsers?.map(pu => (
                      <option key={pu.UserId} value={pu.UserId}>{pu.User?.name}</option>
                    ))}
                  </select>
               </div>
               <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Project Task</label>
                  <select 
                    value={formData.ProjectTaskId}
                    onChange={e => setFormData({...formData, ProjectTaskId: e.target.value})}
                    className="w-full px-5 py-3 border border-slate-200 rounded-xl text-[14px] font-bold outline-none focus:border-blue-500 transition-all bg-slate-50 focus:bg-white shadow-sm"
                  >
                    <option value="">Select Task (Optional)</option>
                    {project.tasks?.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
               </div>
            </div>

            <div className="space-y-2">
               <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Description</label>
               <textarea 
                 rows={3}
                 placeholder="Briefly describe the work done..."
                 value={formData.description}
                 onChange={e => setFormData({...formData, description: e.target.value})}
                 className="w-full px-5 py-3 border border-slate-200 rounded-xl text-[14px] font-bold outline-none focus:border-blue-500 transition-all bg-slate-50 focus:bg-white shadow-inner resize-none"
               />
            </div>

            <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
               <input 
                 type="checkbox" 
                 id="isBillable"
                 checked={formData.isBillable}
                 onChange={e => setFormData({...formData, isBillable: e.target.checked})}
                 className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
               />
               <label htmlFor="isBillable" className="text-[12px] font-black text-slate-600 uppercase tracking-widest">Mark as Billable</label>
            </div>
          </div>

          <div className="p-8 border-t border-slate-50 bg-slate-50/30 flex gap-4">
             <button 
               type="submit" 
               disabled={loading}
               className="flex-1 py-4 bg-blue-600 text-white font-black rounded-xl text-[13px] uppercase tracking-widest shadow-2xl shadow-blue-100 hover:bg-blue-700 hover:-translate-y-0.5 transition-all disabled:opacity-50"
             >
               {loading ? 'Logging Entry...' : 'Save Time Entry'}
             </button>
             <button 
               type="button" 
               onClick={onClose}
               className="px-8 py-4 bg-white border border-slate-200 text-slate-500 font-black rounded-xl text-[13px] uppercase tracking-widest hover:bg-slate-50 transition-all"
             >
               Cancel
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
// PROJECT OVERVIEW (DASHBOARD)
// ──────────────────────────────────────────────────────────────────────────────
const ProjectOverview = ({ project, onEdit, onRefresh }) => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [activeAnalytics, setActiveAnalytics] = useState('Hours'); // Hours or Profitability
  const navigate = useNavigate();
  const addNotification = useNotificationStore(state => state.addNotification);
  const [purchases, setPurchases] = useState({ bills: [], expenses: [], orders: [], credits: [], timesheets: [] });
  const [sales, setSales] = useState({ invoices: [] });
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [showLogTimeModal, setShowLogTimeModal] = useState(false);
  const [budgetAccounts, setBudgetAccounts] = useState({ income: [], expense: [] });
  const [selectorConfig, setSelectorConfig] = useState(null);

  useEffect(() => {
    fetchPurchases();
    fetchSales();
    fetchActivity();
  }, [project.id]);

  useEffect(() => {
    if (activeTab === 'Purchases') fetchPurchases();
    if (activeTab === 'Sales') fetchSales();
    if (activeTab === 'Activity Logs') fetchActivity();
  }, [activeTab, project.id]);

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const res = await projectAPI.getPurchases(project.id);
      setPurchases(res.data);
    } catch (err) {
      console.error(err);
      addNotification('Failed to fetch project purchases', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await projectAPI.getSales(project.id);
      setSales(res.data);
    } catch (err) {
      console.error(err);
      addNotification('Failed to fetch project sales', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchActivity = async () => {
    setLoading(true);
    try {
      const res = await projectAPI.getActivity(project.id);
      setActivity(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelection = async (selectedData) => {
    if (selectorConfig.type === 'project_users') {
       try {
         const newUsers = selectedData.map(u => ({ UserId: u.id, billingRate: 0, role: 'Standard User' }));
         const existingUsers = (project.ProjectUsers || []).map(pu => ({ UserId: pu.UserId, billingRate: pu.billingRate, role: pu.role }));
         const userMap = new Map();
         [...existingUsers, ...newUsers].forEach(u => userMap.set(u.UserId, u));
         
         await projectAPI.update(project.id, { users: Array.from(userMap.values()) });
         addNotification('Users associated with project', 'success');
         if (onRefresh) onRefresh();
       } catch (err) {
         addNotification('Failed to add users', 'error');
       }
    } else if (selectorConfig.type === 'budget_account') {
       const { accountType } = selectorConfig;
       const ledger = selectedData;
       if (!budgetAccounts[accountType].find(a => a.id === ledger.id)) {
          setBudgetAccounts(prev => ({
             ...prev,
             [accountType]: [...prev[accountType], { ...ledger, amount: 0 }]
          }));
       }
    }
    setSelectorConfig(null);
  };

  const financials = useMemo(() => {
    const totalRevenue = sales.invoices?.reduce((sum, inv) => sum + parseFloat(inv.totalAmount || 0), 0) || 0;
    
    const billsCost = purchases.bills?.reduce((sum, bill) => {
        const vendorTx = bill.Transactions?.find(t => parseFloat(t.credit || 0) > 0);
        return sum + parseFloat(vendorTx?.credit || 0);
    }, 0) || 0;

    const expensesCost = purchases.expenses?.reduce((sum, exp) => sum + parseFloat(exp.totalAmount || 0), 0) || 0;
    const creditsAmount = purchases.credits?.reduce((sum, cr) => sum + parseFloat(cr.totalAmount || 0), 0) || 0;
    const ordersAmount = purchases.orders?.reduce((sum, ord) => sum + parseFloat(ord.totalAmount || 0), 0) || 0;
    const laborCost = purchases.timesheets?.reduce((sum, ts) => sum + (parseFloat(ts.hours || 0) * parseFloat(ts.billingRate || 0)), 0) || 0;

    const totalCost = billsCost + expensesCost + laborCost - creditsAmount;
    const profit = totalRevenue - totalCost;

    return { totalRevenue, totalCost, profit, billsCost, expensesCost, creditsAmount, ordersAmount, laborCost };
  }, [sales, purchases]);

  const chartData = [
    { name: '12 Apr', billable: 0, unbilled: 0 },
    { name: '13 Apr', billable: 1.5, unbilled: 0.5 },
    { name: '14 Apr', billable: 2.1, unbilled: 0.8 },
    { name: '15 Apr', billable: 3.2, unbilled: 1.2 },
    { name: '16 Apr', billable: 1.8, unbilled: 0.4 },
    { name: '17 Apr', billable: 2.5, unbilled: 0.9 },
    { name: '18 Apr', billable: 0.5, unbilled: 0.2 },
  ];

  const Tabs = ['Overview', 'Timesheet', 'Purchases', 'Sales', 'Budget Configuration', 'Journals', 'Activity Logs'];

  const OverviewTab = () => (
    <div className="flex-1 overflow-y-auto p-6 no-scrollbar space-y-10 animate-fade-in pb-20">
      <div className="grid grid-cols-12 gap-8 items-start">
        {/* Project Info Block */}
         <div className="col-span-12 lg:col-span-4 space-y-6">
            <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm flex flex-col gap-6 h-full">
               <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shadow-inner shrink-0"><Briefcase size={24} strokeWidth={2.5}/></div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Project Name</p>
                      <h3 className="text-xl font-black text-slate-800 tracking-tight leading-none truncate">{project.name}</h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 group cursor-pointer">
                    <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-all shrink-0"><Users size={24}/></div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Customer Name</p>
                      <h3 className="text-lg font-bold text-blue-600 tracking-tight leading-none truncate">{project.Customer?.name || 'Unassigned'}</h3>
                    </div>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-y-6 pt-6 mt-auto border-t border-slate-50">
                  <div className="space-y-1">
                     <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">Project Code</p>
                     <p className="text-[15px] font-black text-slate-700">{project.projectCode || '---'}</p>
                  </div>
                  <div className="space-y-1">
                     <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">Billing Method</p>
                     <p className="text-[13px] font-bold text-slate-600">{project.billingMethod}</p>
                  </div>
                  <div className="space-y-1">
                     <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">Rate Per Hour</p>
                     <p className="text-[15px] font-black text-slate-900 leading-none">₹{parseFloat(project.ratePerHour || 0).toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                     <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">Status</p>
                     <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded text-[10px] font-bold uppercase tracking-widest">{project.status}</span>
                  </div>
               </div>

               <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                  <div>
                    <p className="text-[12px] font-bold text-slate-500 mb-0.5">Dashboard Watchlist</p>
                    <p className="text-[10px] text-slate-400 font-medium leading-tight">Pin this project for quick monitoring.</p>
                  </div>
                  <button 
                    onClick={() => projectAPI.update(project.id, { addToWatchlist: !project.addToWatchlist }).then(onRefresh)}
                    className={`text-[10px] font-black uppercase tracking-[0.15em] px-3 py-1 rounded-full border transition-all ${project.addToWatchlist ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-200'}`}
                  >
                    {project.addToWatchlist ? 'Enabled' : 'Disabled'}
                  </button>
               </div>
            </div>
         </div>

        {/* Analytics Block */}
        <div className="col-span-12 lg:col-span-8 bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm flex flex-col">
           <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <div className="flex gap-8">
                  <button 
                    onClick={() => setActiveAnalytics('Hours')}
                    className={`text-[14px] font-black border-b-[3px] pb-2 tracking-tight transition-all ${activeAnalytics === 'Hours' ? 'text-blue-600 border-blue-600' : 'text-slate-400 border-transparent'}`}
                  >
                    PROJECT HOURS
                  </button>
                  <button 
                    onClick={() => setActiveAnalytics('Profitability')}
                    className={`text-[14px] font-black border-b-[3px] pb-2 tracking-tight transition-all ${activeAnalytics === 'Profitability' ? 'text-blue-600 border-blue-600' : 'text-slate-400 border-transparent'}`}
                  >
                    PROFITABILITY SUMMARY
                  </button>
               </div>
              <div className="flex items-center gap-3">
                 <button className="flex items-center gap-2 text-[11px] font-black text-slate-500 bg-slate-50 px-4 py-2 rounded-lg border border-slate-100 uppercase tracking-widest transition-all hover:bg-white hover:shadow-sm">This Week <ChevronDown size={14}/></button>
              </div>
           </div>

           <div className="p-8 flex-1">
               {activeAnalytics === 'Hours' ? (
                  <div className="h-[300px]">
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} barGap={0}>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                           <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 700, fill: '#94a3b8'}} dy={15} />
                           <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 700, fill: '#94a3b8'}} />
                           <Tooltip 
                             cursor={{fill: '#f8fafc'}} 
                             contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                           />
                           <Bar dataKey="billable" fill="#1e61f0" name="Billable" radius={[4, 4, 0, 0]} barSize={25} />
                           <Bar dataKey="unbilled" fill="#f59e0b" name="Unbilled" radius={[4, 4, 0, 0]} barSize={25} />
                        </BarChart>
                     </ResponsiveContainer>
                  </div>
               ) : (
                  <div className="h-[300px] flex flex-col justify-center space-y-8 px-12">
                     <div className="grid grid-cols-2 gap-12">
                        <div className="space-y-2">
                           <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Total Revenue</p>
                           <h2 className="text-4xl font-black text-slate-900 leading-none tracking-tight">₹{financials.totalRevenue.toLocaleString()}</h2>
                        </div>
                        <div className="space-y-2 text-right">
                           <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Total Cost</p>
                           <h2 className="text-4xl font-black text-rose-500 leading-none tracking-tight">₹{financials.totalCost.toLocaleString()}</h2>
                        </div>
                     </div>
                     
                     <div className="bg-slate-50/50 rounded-3xl p-8 border border-slate-100 flex items-center justify-between">
                        <div>
                           <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Project Profit</p>
                           <h3 className={`text-2xl font-black tracking-tight ${financials.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                             ₹{financials.profit.toLocaleString()}
                           </h3>
                        </div>
                        <div className="text-right">
                           <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Profit Margin</p>
                           <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                             {financials.totalRevenue > 0 ? ((financials.profit / financials.totalRevenue) * 100).toFixed(1) : '0'}%
                           </h3>
                        </div>
                     </div>
                  </div>
               )}
            </div>

            <div className="grid grid-cols-4 border-t border-slate-50 divide-x divide-slate-50 bg-slate-50/20">
               {activeAnalytics === 'Hours' ? [
                 { label: 'Logged Hours', val: '00:00', amt: '₹0.00', color: 'text-slate-800' },
                 { label: 'Billable Hours', val: '00:00', amt: '₹0.00', color: 'text-blue-600' },
                 { label: 'Billed Hours', val: '00:00', amt: '₹0.00', color: 'text-emerald-600' },
                 { label: 'Unbilled Hours', val: '00:00', amt: '₹0.00', color: 'text-amber-600' },
               ].map(s => (
                 <div key={s.label} className="p-8 text-center transition-all hover:bg-white">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">{s.label}</p>
                   <h4 className={`text-2xl font-black ${s.color} leading-none mb-1.5`}>{s.val}</h4>
                   <p className="text-[13px] font-bold text-slate-400 leading-none">{s.amt}</p>
                 </div>
               )) : [
                 { label: 'Bills Cost', val: `₹${financials.billsCost.toLocaleString()}`, color: 'text-slate-800' },
                 { label: 'Expenses', val: `₹${financials.expensesCost.toLocaleString()}`, color: 'text-blue-600' },
                 { label: 'Labor Cost', val: `₹${financials.laborCost.toLocaleString()}`, color: 'text-rose-600' },
                 { label: 'Returns/Credits', val: `₹${financials.creditsAmount.toLocaleString()}`, color: 'text-amber-600' },
                 { label: 'PO Commitments', val: `₹${financials.ordersAmount.toLocaleString()}`, color: 'text-emerald-600' },
               ].map(s => (
                 <div key={s.label} className="p-8 text-center transition-all hover:bg-white">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">{s.label}</p>
                   <h4 className={`text-xl font-black ${s.color} leading-none mb-1.5`}>{s.val}</h4>
                 </div>
               ))}
            </div>
        </div>
      </div>

      {/* Users & Tasks Lists */}
      <div className="grid grid-cols-1 gap-10">
         {/* Users Section */}
         <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
               <div className="flex items-center gap-2">
                 <Users size={18} className="text-blue-600" />
                 <h3 className="text-[14px] font-black text-slate-800 uppercase tracking-widest">Team Members</h3>
               </div>
               <button 
                 onClick={() => setSelectorConfig({ 
                   type: 'project_users', 
                   title: 'Users to Project',
                   currentMemberIds: new Set((project.ProjectUsers || []).map(pu => pu.UserId))
                 })}
                 className="px-4 py-2 bg-white border border-blue-200 text-blue-600 text-[11px] font-black rounded-lg flex items-center gap-2 uppercase tracking-widest hover:bg-blue-50 transition-all shadow-sm"
               >
                 <Plus size={14} strokeWidth={3} /> Add User
               </button>
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr>
                    <th className="text-left py-4 px-8 text-[11px] font-black text-slate-400 uppercase tracking-widest">Name & Role</th>
                    <th className="text-left py-4 px-8 text-[11px] font-black text-slate-400 uppercase tracking-widest">Logged Hours</th>
                    <th className="text-left py-4 px-8 text-[11px] font-black text-slate-400 uppercase tracking-widest">Billed Hours</th>
                    <th className="text-left py-4 px-8 text-[11px] font-black text-slate-400 uppercase tracking-widest">Unbilled Hours</th>
                    <th className="text-right py-4 px-8 text-[11px] font-black text-slate-400 uppercase tracking-widest w-20">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-[13px]">
                  {project.ProjectUsers?.map(pu => (
                    <tr key={pu.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="py-4 px-8">
                         <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 font-bold text-[13px] uppercase">{pu.User?.name?.[0]}</div>
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-800 text-[14px] leading-tight mb-0.5">{pu.User?.name}</span>
                              <div className="flex items-center gap-2">
                                 <span className="text-[11px] text-slate-400 font-medium">{pu.User?.email}</span>
                                 <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                                 <span className="text-[10px] font-black text-blue-500 uppercase tracking-tighter">{pu.role || 'Admin'}</span>
                              </div>
                            </div>
                         </div>
                      </td>
                      <td className="py-4 px-8 font-black text-slate-700">00:00</td>
                      <td className="py-4 px-8 font-black text-slate-700">00:00</td>
                      <td className="py-4 px-8 font-black text-slate-700">00:00</td>
                      <td className="py-4 px-8 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                         <button className="p-1.5 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded transition-colors"><Trash2 size={16}/></button>
                      </td>
                    </tr>
                  ))}
                  {!project.ProjectUsers?.length && (
                    <tr>
                      <td colSpan={5} className="py-16 text-center text-slate-300 italic font-medium tracking-tight">No team members assigned yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
         </div>

         {/* Tasks Section */}
         <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
               <div className="flex items-center gap-2">
                 <Check size={18} className="text-amber-600" />
                 <h3 className="text-[14px] font-black text-slate-800 uppercase tracking-widest">Project Tasks</h3>
               </div>
               <button 
                 onClick={() => setShowTaskModal(true)}
                 className="px-4 py-2 bg-white border border-amber-200 text-amber-600 text-[11px] font-black rounded-lg flex items-center gap-2 uppercase tracking-widest hover:bg-amber-50 transition-all shadow-sm"
               >
                 <Plus size={14} strokeWidth={3} /> New Task
               </button>
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr>
                    <th className="text-left py-4 px-8 text-[11px] font-black text-slate-400 uppercase tracking-widest">Task Name</th>
                    <th className="text-left py-4 px-8 text-[11px] font-black text-slate-400 uppercase tracking-widest">Rate</th>
                    <th className="text-left py-4 px-8 text-[11px] font-black text-slate-400 uppercase tracking-widest">Billable</th>
                    <th className="text-left py-4 px-8 text-[11px] font-black text-slate-400 uppercase tracking-widest">Logged</th>
                    <th className="text-right py-4 px-8 text-[11px] font-black text-slate-400 uppercase tracking-widest w-20">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-[13px]">
                  {project.tasks?.map(task => (
                    <tr key={task.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="py-4 px-8">
                         <div className="flex flex-col">
                            <span className="font-bold text-slate-800 text-[14px] leading-tight mb-0.5">{task.name}</span>
                            <span className="text-[11px] text-slate-400 font-medium line-clamp-1">{task.description || 'No description provided.'}</span>
                         </div>
                      </td>
                      <td className="py-4 px-8 font-black text-slate-700">₹{parseFloat(task.billingRate || 0).toLocaleString()}</td>
                      <td className="py-4 px-8">
                         <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${task.isBillable ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
                            {task.isBillable ? 'Yes' : 'No'}
                         </span>
                      </td>
                      <td className="py-4 px-8 font-black text-slate-700">00:00</td>
                      <td className="py-4 px-8 text-right opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end gap-1">
                         <button className="p-1.5 hover:bg-blue-50 text-slate-300 hover:text-blue-600 rounded transition-colors"><Edit2 size={16}/></button>
                         <button className="p-1.5 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded transition-colors"><Trash2 size={16}/></button>
                      </td>
                    </tr>
                  ))}
                  {!project.tasks?.length && (
                    <tr>
                      <td colSpan={5} className="py-16 text-center text-slate-300 italic font-medium tracking-tight">No tasks defined for this project.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
         </div>
      </div>
      
      {selectorConfig && selectorConfig.type === 'project_users' && (
        <ProjectUserSelectorModal 
           isOpen={true}
           onClose={() => setSelectorConfig(null)}
           currentMemberIds={selectorConfig.currentMemberIds}
           onSelect={handleSelection}
        />
      )}

      {selectorConfig && selectorConfig.type === 'budget_account' && (
        <LedgerSelectorModal 
           isOpen={true}
           onClose={() => setSelectorConfig(null)}
           onSelect={handleSelection}
           companyId={project.CompanyId}
           type={selectorConfig.accountType}
        />
      )}
    </div>
  );

  const PurchasesTab = () => (
    <div className="flex-1 overflow-y-auto p-8 no-scrollbar space-y-10 animate-fade-in pb-20">
       <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><Download size={20}/></div>
             <h2 className="text-lg font-black text-slate-800 tracking-tight uppercase">Purchases & Expenses</h2>
          </div>
          <div className="flex gap-2">
             <button className="px-4 py-2 bg-blue-600 text-white text-[11px] font-black rounded-lg uppercase tracking-widest shadow-lg shadow-blue-100 flex items-center gap-2"><Plus size={14} strokeWidth={3}/> Record Expense</button>
             <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-[11px] font-black rounded-lg uppercase tracking-widest hover:bg-slate-50 shadow-sm transition-all flex items-center gap-2"><Plus size={14} strokeWidth={3}/> New Bill</button>
          </div>
       </div>

       {loading ? (
         <div className="py-32 text-center text-slate-400 font-bold animate-pulse uppercase tracking-[0.2em]">Retrieving Purchases...</div>
       ) : (
         <div className="space-y-12">
            {/* Expenses List */}
            <div className="space-y-4">
               <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-2">Expenses <span className="w-6 h-6 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center text-[10px]">{purchases.expenses?.length || 0}</span></h3>
               <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full">
                    <thead className="bg-slate-50/50 border-b border-slate-100">
                      <tr>
                        <th className="text-left py-4 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Date</th>
                        <th className="text-left py-4 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Expense Account</th>
                        <th className="text-left py-4 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Vendor</th>
                        <th className="text-left py-4 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Paid Through</th>
                        <th className="text-right py-4 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {purchases.expenses?.map(exp => (
                        <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer">
                           <td className="py-4 px-8 text-[13px] font-bold text-slate-500">{new Date(exp.date).toLocaleDateString()}</td>
                           <td className="py-4 px-8 text-[14px] font-bold text-slate-800">{exp.Ledger?.name}</td>
                           <td className="py-4 px-8 text-[14px] font-medium text-slate-600">{exp.vendorName || '---'}</td>
                           <td className="py-4 px-8 text-[13px] font-bold text-blue-500 uppercase tracking-tight">{exp.paidThrough}</td>
                           <td className="py-4 px-8 text-right font-black text-slate-900">₹{parseFloat(exp.totalAmount).toLocaleString()}</td>
                        </tr>
                      ))}
                      {!purchases.expenses?.length && (
                        <tr><td colSpan={5} className="py-16 text-center text-slate-300 italic font-medium">No expenses linked to this project.</td></tr>
                      )}
                    </tbody>
                  </table>
               </div>
            </div>

            {/* Bills List */}
            <div className="space-y-4">
               <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-2">Bills <span className="w-6 h-6 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center text-[10px]">{purchases.bills?.length || 0}</span></h3>
               <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full">
                    <thead className="bg-slate-50/50 border-b border-slate-100">
                      <tr>
                        <th className="text-left py-4 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Bill Number</th>
                        <th className="text-left py-4 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Date</th>
                        <th className="text-left py-4 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Vendor Name</th>
                        <th className="text-left py-4 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Status</th>
                        <th className="text-right py-4 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {purchases.bills?.map(bill => {
                         const vendorTx = bill.Transactions?.find(t => parseFloat(t.credit || 0) > 0);
                         return (
                           <tr key={bill.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer">
                              <td className="py-4 px-8 text-[14px] font-black text-blue-600">{bill.voucherNumber}</td>
                              <td className="py-4 px-8 text-[13px] font-bold text-slate-500">{new Date(bill.date).toLocaleDateString()}</td>
                              <td className="py-4 px-8 text-[14px] font-bold text-slate-800">{vendorTx?.Ledger?.name || '---'}</td>
                              <td className="py-4 px-8">
                                 <span className="px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 rounded text-[10px] font-black uppercase tracking-widest">OPEN</span>
                              </td>
                              <td className="py-4 px-8 text-right font-black text-slate-900">₹{parseFloat(vendorTx?.credit || 0).toLocaleString()}</td>
                           </tr>
                         );
                      })}
                      {!purchases.bills?.length && (
                        <tr><td colSpan={5} className="py-16 text-center text-slate-300 italic font-medium">No bills linked to this project.</td></tr>
                      )}
                    </tbody>
                  </table>
               </div>
            </div>
         </div>
       )}
    </div>
  );

  const SalesTab = () => (
    <div className="flex-1 overflow-y-auto p-8 no-scrollbar space-y-10 animate-fade-in pb-20">
       <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><ExternalLink size={20}/></div>
             <h2 className="text-lg font-black text-slate-800 tracking-tight uppercase">Sales & Revenue</h2>
          </div>
          <div className="flex gap-2">
             <button className="px-4 py-2 bg-blue-600 text-white text-[11px] font-black rounded-lg uppercase tracking-widest shadow-lg shadow-blue-100 flex items-center gap-2"><Plus size={14} strokeWidth={3}/> Create Invoice</button>
          </div>
       </div>

       {loading ? (
         <div className="py-32 text-center text-slate-400 font-bold animate-pulse uppercase tracking-[0.2em]">Analyzing Sales Data...</div>
       ) : (
         <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="text-left py-4 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Invoice #</th>
                  <th className="text-left py-4 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Date</th>
                  <th className="text-left py-4 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Customer</th>
                  <th className="text-left py-4 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Status</th>
                  <th className="text-right py-4 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Balance</th>
                  <th className="text-right py-4 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {sales.invoices?.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer group">
                     <td className="py-4 px-8 text-[14px] font-black text-blue-600 group-hover:underline">{inv.invoiceNumber}</td>
                     <td className="py-4 px-8 text-[13px] font-bold text-slate-500">{new Date(inv.date).toLocaleDateString()}</td>
                     <td className="py-4 px-8 text-[14px] font-bold text-slate-800">{inv.CustomerLedger?.name || '---'}</td>
                     <td className="py-4 px-8">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                           {inv.status}
                        </span>
                     </td>
                     <td className="py-4 px-8 text-right font-bold text-slate-400">₹{parseFloat(inv.balance).toLocaleString()}</td>
                     <td className="py-4 px-8 text-right font-black text-slate-900">₹{parseFloat(inv.totalAmount).toLocaleString()}</td>
                  </tr>
                ))}
                {!sales.invoices?.length && (
                  <tr><td colSpan={6} className="py-24 text-center text-slate-300 italic font-medium">No sales invoices found for this project.</td></tr>
                )}
              </tbody>
            </table>
         </div>
       )}
    </div>
  );

  const ActivityTab = () => (
    <div className="flex-1 overflow-y-auto p-12 no-scrollbar animate-fade-in pb-20">
       <div className="max-w-3xl mx-auto space-y-12">
          <div className="flex items-center justify-between border-b border-slate-100 pb-8">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-xl"><Clock size={24}/></div>
                <div>
                   <h2 className="text-xl font-black text-slate-800 tracking-tight leading-none mb-1">ACTIVITY LOGS</h2>
                   <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">History of actions on this project</p>
                </div>
             </div>
             <button onClick={fetchActivity} className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><RefreshCw size={20}/></button>
          </div>

          <div className="relative pl-12 space-y-12 before:content-[''] before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
             {activity.map((log, i) => (
                <div key={log.id} className="relative group animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                   <div className="absolute -left-[45px] top-0 w-8 h-8 bg-white border-4 border-slate-100 rounded-full z-10 group-hover:border-blue-500 transition-all shadow-sm flex items-center justify-center">
                      <div className="w-2 h-2 bg-slate-400 rounded-full group-hover:bg-blue-500 transition-all"></div>
                   </div>
                   <div className="bg-white border border-slate-50 p-6 rounded-2xl shadow-sm group-hover:shadow-md transition-all hover:border-slate-100">
                      <div className="flex items-center justify-between mb-2">
                         <span className="text-[14px] font-black text-slate-800 tracking-tight">{log.action}</span>
                         <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded uppercase tracking-widest">{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-[13px] font-medium text-slate-500 mb-4">Action performed by <span className="font-bold text-slate-700">{log.User?.name || 'System User'}</span></p>
                      
                      {log.newData && (
                        <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100/50">
                           <pre className="text-[11px] font-bold text-slate-400 overflow-x-auto no-scrollbar">
                              {JSON.stringify(log.newData, null, 2)}
                           </pre>
                        </div>
                      )}
                   </div>
                </div>
             ))}
             {!activity.length && !loading && (
               <div className="py-20 text-center text-slate-300 italic font-medium">No activity recorded for this project yet.</div>
             )}
          </div>
       </div>
    </div>
  );

  const BudgetTab = () => (
    <div className="flex-1 flex flex-col animate-fade-in">
       {!showBudgetForm ? (
         <div className="flex-1 flex flex-col items-center justify-center p-20 space-y-8">
            <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 border-2 border-dashed border-slate-200"><Target size={48}/></div>
            <div className="text-center max-w-lg space-y-4">
               <h2 className="text-3xl font-black text-slate-800 tracking-tight">Budget your business finance.</h2>
               <p className="text-[15px] font-medium text-slate-400 leading-relaxed">Create budgets for the various activities of your business, compare them with the actuals, and see how your business is performing.</p>
            </div>
            <button 
              onClick={() => setShowBudgetForm(true)}
              className="px-8 py-3.5 bg-blue-600 text-white font-black rounded-xl shadow-2xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 transition-all uppercase tracking-[0.15em] text-[13px]"
            >
               Create Budget
            </button>
         </div>
       ) : (
         <div className="flex-1 p-12 overflow-y-auto no-scrollbar bg-[#fcfdfe]">
            <div className="max-w-5xl mx-auto space-y-12">
               <div className="flex items-center justify-between border-b border-slate-100 pb-8">
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">New Budget</h2>
                  <button onClick={() => setShowBudgetForm(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all"><X size={24}/></button>
               </div>
               
               <div className="grid grid-cols-12 gap-12">
                  <div className="col-span-12 space-y-10 bg-white border border-slate-100 p-10 rounded-3xl shadow-sm">
                     <div className="grid grid-cols-12 items-center gap-6">
                        <label className="col-span-3 text-[12px] font-black text-slate-400 uppercase tracking-widest">Name <span className="text-rose-500">*</span></label>
                        <input className="col-span-9 px-6 py-3 border border-slate-200 rounded-xl text-[14px] font-bold focus:border-blue-500 outline-none transition-all shadow-inner" placeholder="E.g. FY 2026 Q1 Project Budget" />
                     </div>
                     <div className="grid grid-cols-12 items-center gap-6">
                        <label className="col-span-3 text-[12px] font-black text-slate-400 uppercase tracking-widest">Fiscal Year <span className="text-rose-500">*</span></label>
                        <select className="col-span-9 px-6 py-3 border border-slate-200 rounded-xl text-[14px] font-bold focus:border-blue-500 outline-none transition-all appearance-none bg-white">
                           <option>Apr 2026 - Mar 2027</option>
                           <option>Jan 2026 - Dec 2026</option>
                        </select>
                     </div>
                     <div className="grid grid-cols-12 items-center gap-6">
                        <label className="col-span-3 text-[12px] font-black text-slate-400 uppercase tracking-widest">Budget Period <span className="text-rose-500">*</span></label>
                        <select className="col-span-9 px-6 py-3 border border-slate-200 rounded-xl text-[14px] font-bold focus:border-blue-500 outline-none transition-all appearance-none bg-white">
                           <option>Monthly</option>
                           <option>Quarterly</option>
                           <option>Yearly</option>
                        </select>
                     </div>
                     <div className="grid grid-cols-12 items-center gap-6">
                        <label className="col-span-3 text-[12px] font-black text-slate-400 uppercase tracking-widest">Project</label>
                        <div className="col-span-9 px-6 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-black text-slate-600 flex items-center gap-2">
                           <Briefcase size={16}/> {project.name}
                        </div>
                     </div>
                  </div>

                  <div className="col-span-12 bg-white border border-slate-100 p-10 rounded-3xl shadow-sm space-y-12">
                     <div className="space-y-6">
                        <h4 className="text-[13px] font-black text-slate-800 uppercase tracking-widest border-b border-slate-50 pb-4">Income Accounts</h4>
                        <button className="w-full py-12 border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 font-bold hover:bg-slate-50 transition-all flex flex-col items-center gap-2 group">
                           <div className="w-10 h-10 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-500 transition-all"><Plus size={20}/></div>
                           Add Income Accounts
                        </button>
                     </div>
                     <div className="space-y-6">
                        <h4 className="text-[13px] font-black text-slate-800 uppercase tracking-widest border-b border-slate-50 pb-4">Expense Accounts</h4>
                        <button className="w-full py-12 border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 font-bold hover:bg-slate-50 transition-all flex flex-col items-center gap-2 group">
                           <div className="w-10 h-10 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-500 transition-all"><Plus size={20}/></div>
                           Add Expense Accounts
                        </button>
                     </div>
                  </div>
               </div>

               <div className="flex gap-4 pt-10">
                  <button className="px-10 py-4 bg-blue-600 text-white font-black rounded-xl text-[13px] uppercase tracking-widest shadow-2xl shadow-blue-100 hover:bg-blue-700 transition-all">Create Budget</button>
                  <button onClick={() => setShowBudgetForm(false)} className="px-10 py-4 bg-white border border-slate-200 text-slate-600 font-black rounded-xl text-[13px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">Cancel</button>
               </div>
            </div>
         </div>
       )}
    </div>
  );

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden animate-fade-in relative no-scrollbar">
      <header className="h-20 px-10 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-30">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/time-tracking/projects')} 
            className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 transition-all shadow-inner border border-white"
          >
            <ArrowLeft size={20} strokeWidth={2.5}/>
          </button>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">{project.name}</h2>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              Project Dashboard <span className="w-1 h-1 bg-slate-200 rounded-full"></span> {project.projectCode || 'NO CODE'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onEdit} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 text-[11px] font-black rounded-xl uppercase tracking-widest hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">Edit Project</button>
          <button 
            onClick={() => setShowLogTimeModal(true)}
            className="px-6 py-2.5 bg-blue-600 text-white text-[11px] font-black rounded-xl uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all border border-blue-500"
          >
             Log Time
          </button>
          <div className="w-px h-8 bg-slate-100 mx-2"></div>
          <button className="p-2.5 bg-slate-50 text-slate-400 hover:text-slate-800 rounded-xl transition-all"><MoreHorizontal size={20}/></button>
        </div>
      </header>

      <div className="px-10 border-b border-slate-100 flex items-center gap-10 bg-white/50 backdrop-blur sticky top-20 z-30">
        {Tabs.map((tab) => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)}
            className={`py-5 text-[12px] font-black tracking-widest uppercase border-b-[3px] transition-all ${activeTab === tab ? 'text-blue-600 border-blue-600' : 'text-slate-400 border-transparent hover:text-slate-700 hover:border-slate-200'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto no-scrollbar bg-[#f8fafc]/30">
        {activeTab === 'Overview' && <OverviewTab />}
        {activeTab === 'Timesheet' && (
          <div className="flex-1 overflow-y-auto p-12 no-scrollbar space-y-10 animate-fade-in pb-20">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner"><Clock size={24}/></div>
                   <div>
                      <h2 className="text-xl font-black text-slate-800 tracking-tight leading-none mb-1">TIMESHEETS</h2>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Logged hours for {project.name}</p>
                   </div>
                </div>
                <button 
                  onClick={() => setShowLogTimeModal(true)}
                  className="px-6 py-3 bg-blue-600 text-white text-[12px] font-black rounded-xl uppercase tracking-widest shadow-xl shadow-blue-100 flex items-center gap-2 hover:bg-blue-700 transition-all border border-blue-500"
                >
                   <Plus size={16} strokeWidth={3}/> Log Time
                </button>
             </div>

             <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                <table className="w-full">
                   <thead className="bg-slate-50/50 border-b border-slate-100">
                      <tr>
                         <th className="text-left py-5 px-8 text-[11px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                         <th className="text-left py-5 px-8 text-[11px] font-black text-slate-400 uppercase tracking-widest">User</th>
                         <th className="text-left py-5 px-8 text-[11px] font-black text-slate-400 uppercase tracking-widest">Task</th>
                         <th className="text-left py-5 px-8 text-[11px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                         <th className="text-center py-5 px-8 text-[11px] font-black text-slate-400 uppercase tracking-widest">Hours</th>
                         <th className="text-right py-5 px-8 text-[11px] font-black text-slate-400 uppercase tracking-widest">Cost (Est)</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {purchases.timesheets?.map(ts => (
                         <tr key={ts.id} className="hover:bg-slate-50/30 transition-all group">
                            <td className="py-5 px-8 text-[14px] font-bold text-slate-500">{new Date(ts.date).toLocaleDateString()}</td>
                            <td className="py-5 px-8">
                               <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-[10px] font-black">{ts.User?.name?.[0]}</div>
                                  <span className="text-[14px] font-bold text-slate-800 tracking-tight">{ts.User?.name}</span>
                               </div>
                            </td>
                            <td className="py-5 px-8 text-[14px] font-bold text-slate-600">{ts.ProjectTask?.name || 'General'}</td>
                            <td className="py-5 px-8 text-[13px] font-medium text-slate-400 italic line-clamp-1">{ts.description || 'No description'}</td>
                            <td className="py-5 px-8 text-center text-[15px] font-black text-blue-600">{ts.hours}</td>
                            <td className="py-5 px-8 text-right text-[15px] font-black text-slate-900">₹{(parseFloat(ts.hours) * parseFloat(ts.billingRate || 0)).toLocaleString()}</td>
                         </tr>
                      ))}
                      {!purchases.timesheets?.length && (
                         <tr><td colSpan={6} className="py-32 text-center text-slate-300 italic font-medium tracking-tight">No time entries recorded for this project.</td></tr>
                      )}
                   </tbody>
                </table>
             </div>
          </div>
        )}
        {activeTab === 'Purchases' && <PurchasesTab />}
        {activeTab === 'Sales' && <SalesTab />}
        {activeTab === 'Budget Configuration' && <BudgetTab />}
        {activeTab === 'Journals' && <div className="p-20 text-center text-slate-300 italic font-bold text-xl tracking-tight animate-pulse uppercase">Journal Postings Coming Soon</div>}
        {activeTab === 'Activity Logs' && <ActivityTab />}
      </div>

      {selectorConfig && (
        <LedgerSelectorModal 
          config={selectorConfig} 
          onClose={() => setSelectorConfig(null)} 
          onSelected={handleSelection} 
        />
      )}

      {/* Task Modal Integration */}
      <ConfirmModal 
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        title="Add New Task"
        message="Enter task details below (This is a simplified modal for now)"
        onConfirm={() => setShowTaskModal(false)}
      />

      <LogTimeModal 
        isOpen={showLogTimeModal}
        onClose={() => setShowLogTimeModal(false)}
        onLog={fetchPurchases}
        project={project}
        companyId={project.CompanyId}
      />
    </div>
  );
};
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
      alert('Failed to add new user.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[800] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scale-up">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-[16px] font-bold text-slate-900">Add New User</h3>
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
        const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');
        setAllSystemUsers([currentUser]);
      }
    }).catch(err => {
      console.error(err);
      const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');
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
    <div className="flex flex-col min-h-screen bg-[#f8f9fa]">
      {/* Header */}
      <header className="px-6 py-3 border-b border-slate-200 flex items-center justify-between bg-white z-50 sticky top-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={onCancel} 
            className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 transition-colors" 
            title="Go Back"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="p-1.5 bg-slate-100 rounded text-slate-600">
            <Briefcase size={18} />
          </div>
          <h2 className="text-[17px] font-bold text-slate-800 tracking-tight">{editId ? 'Edit Project' : 'New Project'}</h2>
        </div>
        <button onClick={onCancel} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 transition-colors"><X size={20}/></button>
      </header>

      <div className="flex-1 overflow-y-auto p-8 max-w-[1200px] w-full mx-auto no-scrollbar">
        <div className="bg-white rounded-lg border border-slate-200 p-10 space-y-10 shadow-sm animate-fade-in">
          <form className="space-y-16" onSubmit={handleSubmit}>
          
          {/* Section 1: Basic Info */}
          <div className="space-y-10">
            <h3 className="text-[11px] font-bold text-blue-600 uppercase tracking-[0.2em] border-b border-slate-100 pb-4">Basic Information</h3>
            
            <div className="grid grid-cols-12 gap-x-12 gap-y-8">
              <div className="col-span-12 lg:col-span-8 space-y-6">
                <div className="grid grid-cols-12 items-center gap-4">
                  <label className="col-span-3 text-[11px] font-bold text-rose-500 uppercase tracking-widest">Project Name*</label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="col-span-9 px-4 py-2.5 border border-slate-200 rounded-lg text-[14px] font-medium focus:border-blue-500 outline-none transition-all shadow-sm" />
                </div>
                <div className="grid grid-cols-12 items-center gap-4">
                  <label className="col-span-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Project Code</label>
                  <input value={formData.projectCode} onChange={e => setFormData({...formData, projectCode: e.target.value})} className="col-span-9 px-4 py-2.5 border border-slate-200 rounded-lg text-[14px] font-medium focus:border-blue-500 outline-none transition-all shadow-sm" />
                </div>
                <div className="grid grid-cols-12 items-center gap-4">
                  <label className="col-span-3 text-[11px] font-bold text-rose-500 uppercase tracking-widest">Customer Name*</label>
                  <div className="col-span-9 flex gap-2">
                    <select 
                      required 
                      value={formData.customerLedgerId} 
                      onChange={e => {
                        if (e.target.value === 'NEW') {
                          navigate('/customers/new', { state: { returnTo: location.pathname } });
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
                        onClick={() => navigate('/customers/new', { state: { returnTo: location.pathname } })}
                      title="Add New Customer"
                      className="p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all flex items-center justify-center shrink-0"
                    >
                      <Search size={18}/>
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-12 items-center gap-4">
                  <label className="col-span-3 text-[11px] font-bold text-rose-500 uppercase tracking-widest">Billing Method*</label>
                  <select value={formData.billingMethod} onChange={e => setFormData({...formData, billingMethod: e.target.value})} className="col-span-9 px-4 py-2.5 border border-slate-200 rounded-lg text-[14px] font-medium focus:border-blue-500 outline-none transition-all appearance-none bg-white">
                    <option value="Hourly Project Rate">Hourly Project Rate</option>
                    <option value="Hourly Staff Rate">Hourly Staff Rate</option>
                    <option value="Hourly Task Rate">Hourly Task Rate</option>
                    <option value="Fixed Cost">Fixed Cost</option>
                  </select>
                </div>
                <div className="grid grid-cols-12 items-start gap-4">
                  <label className="col-span-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-3">Description</label>
                  <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows="3" maxLength="2000" className="col-span-9 px-4 py-3 border border-slate-200 rounded-lg text-[14px] font-medium focus:border-blue-500 outline-none transition-all resize-none shadow-sm" placeholder="Max. 2000 characters" />
                </div>
              </div>
            </div>
          </div>

          {/* Budget */}
          <div className="space-y-10">
            <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-4">Budget</h3>
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
            <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-widest">Users</h3>
            <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="text-left py-3 px-6 text-[11px] font-bold text-slate-400">S.NO</th>
                    <th className="text-left py-3 px-6 text-[11px] font-bold text-slate-400">USER</th>
                    <th className="text-left py-3 px-6 text-[11px] font-bold text-slate-400">EMAIL</th>
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
                <button type="button" onClick={addUser} className="text-blue-600 text-[12px] font-bold flex items-center gap-1.5 uppercase tracking-widest hover:text-blue-700">
                  <Plus size={14} strokeWidth={3} /> Add User
                </button>
              </div>
            </div>
          </div>

          {/* Tasks Table */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-widest">Project Tasks</h3>
              <button type="button" className="text-blue-600 text-[12px] font-bold flex items-center gap-2 hover:underline">
                <Download size={14} /> Import project tasks from existing projects.
              </button>
            </div>
            <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="text-left py-3 px-6 text-[11px] font-bold text-slate-400">S.NO</th>
                    <th className="text-left py-3 px-6 text-[11px] font-bold text-slate-400">TASK NAME</th>
                    <th className="text-left py-3 px-6 text-[11px] font-bold text-slate-400">DESCRIPTION</th>
                    <th className="text-center py-3 px-6 text-[11px] font-bold text-slate-400">BILLABLE</th>
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
                <button type="button" onClick={addTask} className="text-blue-600 text-[12px] font-bold flex items-center gap-1.5 uppercase tracking-widest hover:text-blue-700">
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
            <button type="submit" disabled={loading} className="px-10 py-3 bg-blue-600 text-white rounded-lg text-[13px] font-bold hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all uppercase tracking-widest flex items-center gap-2">
              {loading && <RefreshCw className="animate-spin" size={16}/>} Save
            </button>
            <button type="button" onClick={onCancel} className="px-10 py-3 bg-white border border-slate-200 text-slate-600 rounded-lg text-[13px] font-bold hover:bg-slate-50 transition-all uppercase tracking-widest">Cancel</button>
          </div>
        </form>
      </div>
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
    if (!companyId || companyId === 'null' || companyId === 'undefined') {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const res = await projectAPI.getByCompany(companyId);
      setProjects(res.data);
    } catch (err) {
      console.error('Projects load error:', err);
      const errMsg = err.response?.data?.error || err.message || 'Failed to load projects';
      addNotification(errMsg, 'error');
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
    <div className="flex-1 flex flex-col h-full bg-white animate-fade-in overflow-hidden">
      {/* HEADER: Synchronized with Customers/Quotes */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2 group cursor-pointer">
              <h1 className="text-[20px] font-bold text-slate-900">All Projects</h1>
              <ChevronDown size={18} className="text-blue-600 mt-1" />
          </div>
          <div className="flex items-center gap-2">
             <button 
               onClick={() => navigate('/time-tracking/projects/new')}
               className="bg-[#1e61f0] hover:bg-[#1a54d1] text-white px-4 py-2 rounded-md font-medium flex items-center gap-1.5 transition-all shadow-sm"
             >
                <Plus size={18} strokeWidth={2.5}/> New Project
             </button>
             <div className="relative">
                <button 
                  className="p-2 text-slate-500 hover:text-slate-800 border border-slate-200 bg-white rounded-md hover:bg-slate-50 transition-colors shadow-sm"
                >
                   <MoreHorizontal size={18} />
                </button>
             </div>
          </div>
      </div>

      {/* SEARCH/FILTER BAR */}
      <div className="px-8 py-4 bg-slate-50/50 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-4">
            <div className="relative group w-64">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1e61f0] transition-colors" />
                <input 
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search records..."
                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded text-[13px] font-medium text-slate-700 outline-none focus:border-[#1e61f0] shadow-sm transition-all"
                />
            </div>
            <button 
                onClick={fetchProjects}
                className="p-2 text-slate-400 hover:text-[#1e61f0] transition-colors"
                title="Refresh"
            >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
        </div>

        <div className="flex items-center gap-3">
            <button className="flex items-center gap-1.5 text-slate-500 text-[13px] font-medium hover:text-slate-900 transition-colors">
                <Filter size={14} /> Filter
            </button>
            <div className="w-px h-4 bg-slate-200 mx-2" />
            <button className="h-9 px-4 flex items-center gap-2 bg-white border border-slate-200 text-slate-600 rounded-[4px] text-[11px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
                <Download size={14} /> Export
            </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="flex-1 p-8 overflow-y-auto no-scrollbar">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Customer Name</th>
              <th className="px-6 py-4">Billing Method</th>
              <th className="px-6 py-4 text-right">Budget</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
                <tr><td colSpan="6" className="py-24 text-center font-bold text-slate-400 animate-pulse uppercase tracking-widest">Syncing...</td></tr>
            ) : filtered.length === 0 ? (
                <tr>
                    <td colSpan="6" className="py-20 text-center">
                       <div className="flex flex-col items-center justify-center gap-3">
                          <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                             <Briefcase size={24} />
                          </div>
                          <p className="text-slate-500 text-[14px]">No projects found.</p>
                          <button onClick={() => navigate('/time-tracking/projects/new')} className="text-blue-600 text-[13px] font-medium hover:underline">Create a project</button>
                       </div>
                    </td>
                </tr>
            ) : (
              filtered.map(p => (
                <tr 
                  key={p.id}
                  className="hover:bg-slate-50 transition-colors cursor-pointer group"
                  onClick={() => navigate(`/time-tracking/projects/view/${p.id}`)}
                >
                  <td className="px-6 py-4">
                     <div className="text-[14px] font-medium text-blue-600 group-hover:underline">{p.name}</div>
                     {p.projectCode && <div className="text-[11px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">Code: {p.projectCode}</div>}
                  </td>
                  <td className="px-6 py-4 text-[14px] font-medium text-slate-800">
                     {p.Customer?.name || '---'}
                  </td>
                  <td className="px-6 py-4 text-[13px] text-slate-500 font-medium">
                     {p.billingMethod}
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                     <span className="text-[14px] text-slate-900 font-medium">₹ {(parseFloat(p.revenueBudget || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-0.5 rounded uppercase text-[10px] font-bold tracking-widest border
                        ${p.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                     <div className="flex items-center justify-center gap-2">
                        <button 
                           onClick={() => navigate(`/time-tracking/projects/edit/${p.id}`)}
                           className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 rounded shadow-sm transition-all text-[12px] font-medium"
                        >
                           <Edit2 size={13} /> Edit
                        </button>
                        <button 
                           onClick={() => setDeleteId(p.id)}
                           className="flex items-center justify-center p-1.5 bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 rounded shadow-sm transition-all"
                           title="Delete Project"
                        >
                           <Trash2 size={16} />
                        </button>
                     </div>
                  </td>
                </tr>
              ))
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
               onRefresh={fetchProjects}
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
