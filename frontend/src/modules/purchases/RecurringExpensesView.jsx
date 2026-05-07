import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Repeat, RefreshCw, Search, 
  ChevronRight, Calendar, ArrowRight,
  MoreHorizontal, Play, Pause, Trash2, 
  ChevronDown, X, Info, CreditCard, User, Tag
} from 'lucide-react';
import { recurringExpenseAPI } from '../../services/api';
import useNotificationStore from '../../store/notificationStore';
import ConfirmModal from '../../components/ConfirmModal';

const RecurringExpensesView = ({ companyId }) => {
  const navigate = useNavigate();
  const { addNotification } = useNotificationStore();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (companyId) fetchTemplates();
  }, [companyId]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await recurringExpenseAPI.getByCompany(companyId);
      setTemplates(res.data || []);
      if (res.data?.length > 0 && !selectedTemplate) {
          // Keep selection if it exists, otherwise don't auto-select to match "All Expenses" feel
      }
    } catch (err) {
      console.error(err);
      addNotification('Failed to fetch recurring expenses', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRunAutomation = async () => {
    try {
      setRunning(true);
      const res = await recurringExpenseAPI.processDue();
      addNotification(res.data.message || 'Automation run complete', 'success');
      fetchTemplates();
    } catch (err) {
      addNotification('Automation run failed', 'error');
    } finally {
      setRunning(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await recurringExpenseAPI.delete(deleteId);
      addNotification('Template deleted successfully', 'success');
      if (selectedTemplate?.id === deleteId) setSelectedTemplate(null);
      fetchTemplates();
    } catch (err) {
      addNotification('Failed to delete template', 'error');
    } finally {
      setIsDeleteModalOpen(false);
      setDeleteId(null);
    }
  };

  const toggleStatus = async (template) => {
    try {
       const newStatus = template.status === 'Active' ? 'Paused' : 'Active';
       await recurringExpenseAPI.update(template.id, { status: newStatus });
       addNotification(`Automation ${newStatus === 'Active' ? 'Resumed' : 'Paused'}`, 'success');
       fetchTemplates();
       if (selectedTemplate?.id === template.id) {
           setSelectedTemplate(prev => ({ ...prev, status: newStatus }));
       }
    } catch (err) {
       addNotification('Failed to update status', 'error');
    }
  };

  const filtered = templates.filter(t => 
    t.profileName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.ExpenseAccount?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && templates.length === 0) return (
    <div className="flex-1 flex flex-col items-center justify-center p-20 text-center bg-white h-screen">
      <RefreshCw size={24} className="animate-spin text-blue-600 mb-4" />
      <p className="text-slate-500 text-[14px] font-bold uppercase tracking-[0.2em]">Loading Automation Profiles...</p>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-80px)] bg-white overflow-hidden animate-fade-in relative">
        <ConfirmModal 
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={confirmDelete}
            title="Terminate Automation"
            message="Are you sure you want to delete this recurring expense profile?"
            type="danger"
        />

        {/* --- MASTER LIST --- */}
        <div className={`flex flex-col border-r border-slate-100 transition-all duration-300 ${selectedTemplate ? 'w-[400px]' : 'w-full'}`}>
            <header className="px-8 py-6 flex items-center justify-between border-b border-slate-50 bg-white sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <Repeat size={20} className="text-blue-600" />
                    <h1 className="text-[18px] font-bold text-slate-800 tracking-tight">Recurring Expenses</h1>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => navigate('/recurring-expenses/new')}
                        className="bg-[#1e61f0] hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-[12px] font-bold flex items-center gap-1.5 transition-all shadow-md shadow-blue-100"
                    >
                        <Plus size={16} strokeWidth={3} /> NEW
                    </button>
                </div>
            </header>

            <div className="p-4 bg-slate-50/50 border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search profiles..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[13px] focus:border-blue-500 outline-none transition-all shadow-sm"
                        />
                    </div>
                    <button 
                        onClick={handleRunAutomation}
                        disabled={running}
                        title="Run Check for Due Expenses"
                        className="p-2.5 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm active:scale-95"
                    >
                        <RefreshCw size={16} className={running ? 'animate-spin text-blue-600' : ''} />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {filtered.map(template => (
                    <div 
                        key={template.id}
                        onClick={() => setSelectedTemplate(template)}
                        className={`px-6 py-5 border-b border-slate-50 cursor-pointer transition-all hover:bg-slate-50/80 group ${selectedTemplate?.id === template.id ? 'bg-blue-50/40 border-r-4 border-r-blue-600' : ''}`}
                    >
                        <div className="flex justify-between items-start mb-1">
                            <h3 className={`text-[14px] font-bold tracking-tight ${selectedTemplate?.id === template.id ? 'text-blue-700' : 'text-slate-800'}`}>
                                {template.profileName}
                            </h3>
                            <span className="text-[14px] font-bold text-slate-900">₹{parseFloat(template.amount).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                <span>{template.frequency}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                <span>Next: {new Date(template.nextGenerationDate).toLocaleDateString('en-IN', {day:'2-digit', month:'short'})}</span>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${template.status === 'Active' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                {template.status}
                            </span>
                        </div>
                    </div>
                ))}

                {filtered.length === 0 && (
                    <div className="p-20 text-center">
                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                            <Repeat size={24} />
                        </div>
                        <p className="text-slate-400 text-[13px] font-medium">No recurring profiles found</p>
                    </div>
                )}
            </div>
        </div>

        {/* --- DETAIL PANE --- */}
        {selectedTemplate ? (
            <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden animate-fade-in-right">
                <header className="px-10 py-6 bg-white border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-[20px] font-bold text-slate-800 tracking-tight">{selectedTemplate.profileName}</h2>
                        <div className="flex items-center gap-2 mt-1">
                             <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase ${selectedTemplate.status === 'Active' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                {selectedTemplate.status}
                             </span>
                             <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Created on {new Date(selectedTemplate.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                         <button 
                            onClick={() => toggleStatus(selectedTemplate)}
                            className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                            title={selectedTemplate.status === 'Active' ? 'Pause Automation' : 'Resume Automation'}
                         >
                            {selectedTemplate.status === 'Active' ? <Pause size={18} /> : <Play size={18} className="text-emerald-500" />}
                         </button>
                         <button 
                             className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                             onClick={() => navigate(`/recurring-expenses/edit/${selectedTemplate.id}`)}
                         >
                            <Trash2 size={18} className="text-slate-400" />
                         </button>
                         <button 
                            className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                            onClick={() => { setDeleteId(selectedTemplate.id); setIsDeleteModalOpen(true); }}
                         >
                            <Trash2 size={18} className="text-red-400" />
                         </button>
                         <button onClick={() => setSelectedTemplate(null)} className="p-2 text-slate-400 hover:bg-white rounded-full transition-all ml-2">
                             <X size={20} />
                         </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Summary Card */}
                        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 flex flex-col justify-between">
                            <div>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Automation Cycle</p>
                                <div className="flex items-end gap-3 mb-8">
                                    <h3 className="text-[40px] font-bold text-slate-900 leading-none">₹{parseFloat(selectedTemplate.amount).toLocaleString()}</h3>
                                    <span className="text-[14px] font-bold text-blue-600 mb-1 uppercase tracking-wider">{selectedTemplate.frequency}</span>
                                </div>
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                                            <Calendar size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Next Run Date</p>
                                            <p className="text-[14px] font-bold text-slate-800 italic">{new Date(selectedTemplate.nextGenerationDate).toLocaleDateString('en-IN', {day:'2-digit', month:'long', year:'numeric'})}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                            <Repeat size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Last Generated</p>
                                            <p className="text-[14px] font-bold text-slate-800 italic">{selectedTemplate.lastGeneratedDate ? new Date(selectedTemplate.lastGeneratedDate).toLocaleDateString() : 'Never generated yet'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Account Details Card */}
                        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                             <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-6">Ledger Mappings</p>
                             <div className="space-y-6">
                                <section>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                                        <label className="text-[11px] font-bold text-slate-800 uppercase tracking-widest">Expense Account</label>
                                    </div>
                                    <p className="text-[15px] font-bold text-slate-700 pl-3.5 border-l border-slate-100">{selectedTemplate.ExpenseAccount?.name || 'N/A'}</p>
                                </section>
                                <section>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                        <label className="text-[11px] font-bold text-slate-800 uppercase tracking-widest">Paid Through</label>
                                    </div>
                                    <p className="text-[15px] font-bold text-slate-700 pl-3.5 border-l border-slate-100">{selectedTemplate.PaidThrough?.name || 'N/A'}</p>
                                </section>
                                <section>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                                        <label className="text-[11px] font-bold text-slate-800 uppercase tracking-widest">Currency</label>
                                    </div>
                                    <p className="text-[15px] font-bold text-slate-700 pl-3.5 border-l border-slate-100">{selectedTemplate.currency}</p>
                                </section>
                             </div>
                        </div>

                        {/* Additional Info */}
                        <div className="lg:col-span-2 bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                                <div>
                                    <label className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                                        <User size={12} /> Vendor
                                    </label>
                                    <p className="text-[14px] font-bold text-slate-800">{selectedTemplate.Vendor?.name || '---'}</p>
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                                        <Tag size={12} /> Billable Customer
                                    </label>
                                    <p className="text-[14px] font-bold text-slate-800">{selectedTemplate.Customer?.name || 'Not billable'}</p>
                                </div>
                            </div>
                            <div className="mt-8 pt-8 border-t border-slate-50">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Internal Notes</label>
                                <p className="text-slate-600 text-[14px] italic leading-relaxed">
                                    {selectedTemplate.notes ? `"${selectedTemplate.notes}"` : 'No notes provided.'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 text-center p-12 rounded-[2.5rem] bg-blue-600/5 border border-dashed border-blue-200">
                         <Info size={24} className="text-blue-500 mx-auto mb-4" />
                         <h4 className="text-[16px] font-bold text-slate-800 mb-2">Automation Preview</h4>
                         <p className="text-[13px] text-slate-500 max-w-md mx-auto italic">
                            This profile will automatically generate a <span className="font-bold text-blue-600">Payment Voucher</span> worth <span className="font-bold text-slate-900">₹{parseFloat(selectedTemplate.amount || 0).toLocaleString()}</span> every <span className="font-bold text-slate-900">{selectedTemplate.frequency}</span> using the defined ledgers.
                         </p>
                    </div>
                </div>
            </div>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-10 bg-slate-50">
                <div className="bg-white p-12 rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center text-center max-w-lg">
                    <div className="w-24 h-24 bg-blue-50 rounded-[2rem] flex items-center justify-center text-blue-600 mb-8 animate-pulse">
                        <Repeat size={40} />
                    </div>
                    <h3 className="text-[24px] font-bold text-slate-800 tracking-tight mb-4 uppercase italic">Automation Hub</h3>
                    <p className="text-slate-500 text-[15px] leading-relaxed mb-8">
                        Select a recurring expense profile from the sidebar to view its automation details, or initialize a new automated workflow.
                    </p>
                    <button 
                         onClick={() => navigate('/recurring-expenses/new')}
                         className="px-10 py-4 bg-[#1e61f0] hover:bg-blue-700 text-white rounded-2xl font-bold text-[14px] tracking-widest shadow-xl shadow-blue-100 transition-all active:scale-95"
                    >
                        INITIALIZE AUTOMATION
                    </button>
                    <div className="mt-10 flex items-center gap-6">
                        <div className="flex flex-col items-center">
                            <span className="text-[18px] font-bold text-slate-800">{templates.length}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Active Profiles</span>
                        </div>
                        <div className="w-px h-8 bg-slate-100"></div>
                        <div className="flex flex-col items-center">
                            <span className="text-[18px] font-bold text-slate-800">{templates.filter(t => t.status === 'Paused').length}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Paused</span>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default RecurringExpensesView;
