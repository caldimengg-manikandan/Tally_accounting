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
  const chartData = [
    { name: '12 Apr', billable: 0, unbilled: 0 },
    { name: '13 Apr', billable: 1.5, unbilled: 0.5 },
    { name: '14 Apr', billable: 0, unbilled: 0 },
    { name: '15 Apr', billable: 0, unbilled: 0 },
    { name: '16 Apr', billable: 0, unbilled: 0 },
    { name: '17 Apr', billable: 0, unbilled: 0 },
    { name: '18 Apr', billable: 0, unbilled: 0 },
  ];

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden animate-fade-in">
      {/* Header */}
      <header className="h-16 px-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-20">
        <div className="flex items-center gap-4">
          <ArrowLeft size={18} className="text-slate-400 cursor-pointer" />
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">{project.name}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onEdit} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-500 border border-slate-200 text-[12px] font-bold px-3 transition-colors">Edit</button>
          <button className="bg-blue-600 text-white text-[12px] font-bold px-3 py-1.5 rounded-lg hover:bg-blue-700 shadow-sm transition-all">Log Time</button>
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden ml-1">
             <button className="px-3 py-1.5 text-[12px] font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-1 border-r border-slate-200">New Transaction <ChevronDown size={14}/></button>
             <button className="p-1.5 hover:bg-slate-50 text-slate-500"><MoreHorizontal size={16}/></button>
          </div>
          <button className="p-1.5 hover:bg-slate-50 text-slate-400"><X size={18}/></button>
        </div>
      </header>

      {/* Tabs */}
      <div className="px-6 border-b border-slate-50 flex items-center gap-8 bg-slate-50/20">
        {['Overview', 'Timesheet', 'Purchases', 'Sales', 'Budget Configuration', 'Journals', 'Activity Logs'].map((tab, idx) => (
          <button key={tab} className={`py-2.5 text-[12px] font-bold tracking-tight border-b-2 transition-all ${idx === 0 ? 'text-blue-600 border-blue-600' : 'text-slate-400 border-transparent hover:text-slate-700'}`}>{tab}</button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6 no-scrollbar space-y-8">
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
                     <button className="text-[13px] font-bold text-slate-400 hover:text-slate-600 transition-colors">Profitability Summary</button>
                   </div>
                   <button className="flex items-center gap-1.5 text-[12px] font-bold text-blue-600 bg-blue-50/50 px-2.5 py-1 rounded-lg">This Week <ChevronDown size={14}/></button>
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

        {/* Tables Section */}
        <div className="space-y-10 pt-10 border-t border-slate-50">
           {/* Users */}
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
                  </tbody>
                </table>
              </div>
           </div>

           {/* Tasks */}
           <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                 <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Project Tasks</h3>
                 <button className="text-blue-600 text-[12px] font-black flex items-center gap-1 uppercase tracking-widest hover:text-blue-700">
                   <Plus size={12} strokeWidth={3} /> Add Task
                 </button>
              </div>
              <div className="p-12 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/30">
                 <p className="text-slate-400 font-bold text-[13px]">No project tasks have been added.</p>
              </div>
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
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [allSystemUsers, setAllSystemUsers] = useState([]);
  
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
                          const newU = [...users];
                          newU[i].UserId = e.target.value;
                          setUsers(newU);
                        }} className="w-full px-3 py-2 border border-slate-100 rounded-lg text-[13px] focus:border-blue-500 outline-none">
                          <option value="">Select user</option>
                          {allSystemUsers.map(usu => <option key={usu.id} value={usu.id}>{usu.name}</option>)}
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
      if (res.data.length > 0 && !selectedId && !isNew) {
        setSelectedId(res.data[0].id);
      }
    } catch (err) {
      addNotification('Failed to load projects', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [companyId]);

  const filtered = projects.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.Customer?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const selectedProject = useMemo(() => projects.find(p => p.id === selectedId), [projects, selectedId]);

  if (isNew || isEdit) {
    return <NewProjectForm companyId={companyId} editId={isEdit ? id : null} onCancel={() => navigate('/time-tracking/projects')} onSave={() => { fetchProjects(); navigate('/time-tracking/projects'); }} />;
  }

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden">
      {/* Search & List Sidebar */}
      <div className="w-96 border-r border-slate-100 bg-white flex flex-col shrink-0">
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Projects</h1>
            <button 
              onClick={() => navigate('/time-tracking/projects/new')}
              className="w-9 h-9 bg-blue-600 text-white rounded-lg shadow-md shadow-blue-200 flex items-center justify-center hover:bg-blue-700 transition-all"
            >
              <Plus size={20} strokeWidth={3} />
            </button>
          </div>
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={16} />
            <input 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Find a project..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-lg text-[13px] font-medium text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar space-y-1 px-4">
          {loading ? (
             <div className="py-20 flex flex-col items-center opacity-30">
               <RefreshCw className="animate-spin mb-4" size={24} />
               <p className="text-[10px] font-bold uppercase tracking-widest">Loading Projects...</p>
             </div>
          ) : filtered.length > 0 ? (
            filtered.map(p => (
              <div 
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={`p-4 rounded-xl cursor-pointer transition-all flex flex-col gap-1.5 group border
                  ${selectedId === p.id 
                    ? 'bg-blue-50/40 border-blue-200 shadow-sm' 
                    : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-100'}`}
              >
                <div className="flex justify-between items-start">
                  <h4 className={`text-[14px] font-bold tracking-tight ${selectedId === p.id ? 'text-blue-700' : 'text-slate-800'}`}>{p.name}</h4>
                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest ${p.status === 'Active' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    {p.status}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-slate-400 font-medium truncate max-w-[150px]">{p.Customer?.name || 'No Customer'}</span>
                  <span className="text-[11px] font-bold text-slate-700">₹{parseFloat(p.ratePerHour || 0).toLocaleString()}/hr</span>
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Search size={18} className="text-slate-300" />
              </div>
              <p className="text-slate-400 font-medium text-[13px]">No records found</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {selectedProject ? (
         <ProjectOverview project={selectedProject} onEdit={() => navigate(`/time-tracking/projects/edit/${selectedId}`)} />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-white p-20 text-center border-l border-slate-50">
           <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6 shadow-sm">
             <Briefcase size={32} />
           </div>
           <h2 className="text-2xl font-bold text-slate-800 mb-3 tracking-tight">Project Management</h2>
           <p className="text-slate-400 max-w-sm mx-auto font-medium text-[14px] leading-relaxed mb-8">
             Select a project from the left to view metrics, manage your team, and track billing progress efficiently.
           </p>
           <button 
             onClick={() => navigate('/time-tracking/projects/new')}
             className="px-8 py-3 bg-blue-600 text-white rounded-lg text-[14px] font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center gap-2"
           >
             <Plus size={18} strokeWidth={2.5} /> Create Your First Project
           </button>
        </div>
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
        title="Destroy Project Record?"
        message="This will permanently delete the project and all associated time logs. This action cannot be undone."
      />
    </div>
  );
};

export default ProjectsView;
