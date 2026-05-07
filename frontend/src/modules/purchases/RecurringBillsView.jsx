import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Repeat, RefreshCw, Search, 
  ChevronRight, Calendar, ArrowRight,
  MoreHorizontal, Play, Pause, Trash2, 
  ChevronDown, X, Info, CreditCard, User, Tag, ShoppingBag, Clock
} from 'lucide-react';
import { recurringBillAPI } from '../../services/api';
import useNotificationStore from '../../store/notificationStore';
import ConfirmModal from '../../components/ConfirmModal';

const RecurringBillsView = ({ companyId }) => {
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
      const res = await recurringBillAPI.getByCompany(companyId);
      setTemplates(res.data || []);
    } catch (err) {
      console.error(err);
      addNotification('Failed to fetch recurring bills', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRunAutomation = async () => {
    try {
      setRunning(true);
      const res = await recurringBillAPI.processDue();
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
      await recurringBillAPI.delete(deleteId);
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
       await recurringBillAPI.update(template.id, { status: newStatus });
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
    t.Vendor?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && templates.length === 0) return (
    <div className="flex-1 flex flex-col items-center justify-center p-20 text-center bg-white h-screen">
      <RefreshCw size={24} className="animate-spin text-blue-600 mb-4" />
      <p className="text-slate-500 text-[14px] font-bold uppercase tracking-[0.2em]">Loading Bill Profiles...</p>
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-white overflow-hidden animate-fade-in relative">
        <ConfirmModal 
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={confirmDelete}
            title="Terminate Recurring Bill"
            message="Are you sure you want to delete this recurring bill profile?"
            type="danger"
        />

        {/* --- MASTER LIST --- */}

        {/* --- Header Area --- */}
        <header className="px-8 py-4 flex items-center justify-between border-b border-slate-100 bg-white sticky top-0 z-20">
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 cursor-pointer group">
                  <h1 className="text-[16px] font-bold text-slate-800 tracking-tight">All Recurring Bills</h1>
                  <ChevronDown size={14} className="text-blue-600 group-hover:translate-y-0.5 transition-transform" />
                </div>
            </div>
            
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => navigate('/recurring-bills/new')}
                    className="bg-[#1e61f0] hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-[13px] font-bold flex items-center gap-2 transition-all shadow-sm active:scale-95"
                >
                    <Plus size={18} /> New
                </button>
                <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg transition-colors border border-slate-200">
                  <MoreHorizontal size={18} />
                </button>
            </div>
        </header>

        {/* --- Table Area --- */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Table Toolbar */}
          <div className="px-8 py-3 flex items-center justify-between border-b border-slate-50">
             <div className="flex items-center gap-4">
                <button className="text-slate-400 hover:text-blue-600 transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 21v-7"/><path d="M4 10V3"/><path d="M12 21v-9"/><path d="M12 8V3"/><path d="M20 21v-5"/><path d="M20 12V3"/><path d="M1 14h6"/><path d="M9 8h6"/><path d="M17 16h6"/></svg>
                </button>
                <div className="flex items-center gap-2">
                   <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                </div>
             </div>
             
             <div className="flex items-center gap-2">
                <div className="relative">
                   <Search size={14} className="absolute right-3 top-2.5 text-slate-400" />
                   <input 
                      type="text" 
                      placeholder="Search..." 
                      className="w-48 pl-4 pr-10 py-2 border-transparent focus:border-slate-200 focus:bg-slate-50 text-[13px] outline-none transition-all"
                   />
                </div>
             </div>
          </div>

          {/* Main Table */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
             <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white z-10">
                   <tr className="border-b border-slate-100">
                      <th className="pl-8 py-3 w-12"></th>
                      <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Vendor Name</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Profile Name</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Frequency</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Last Bill Date</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Next Bill Date</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                      <th className="pr-8 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">Amount</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {filtered.map(template => (
                      <tr key={template.id} className="group hover:bg-slate-50/50 transition-colors">
                         <td className="pl-8 py-4">
                            <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                         </td>
                         <td className="px-4 py-4 text-[13px] text-slate-700 whitespace-nowrap">
                            {template.Vendor?.name || 'N/A'}
                         </td>
                         <td className="px-4 py-4">
                            <button 
                               onClick={() => setSelectedTemplate(template)}
                               className="text-blue-600 hover:text-blue-800 text-[13px] font-medium transition-colors"
                            >
                               {template.profileName}
                            </button>
                         </td>
                         <td className="px-4 py-4 text-[13px] text-slate-600">
                            {template.repeatEvery}
                         </td>
                         <td className="px-4 py-4 text-[13px] text-slate-600">
                            {template.lastGeneratedDate ? new Date(template.lastGeneratedDate).toLocaleDateString('en-GB') : '-'}
                         </td>
                         <td className="px-4 py-4 text-[13px] text-slate-600">
                            {template.nextGenerationDate ? new Date(template.nextGenerationDate).toLocaleDateString('en-GB') : '-'}
                         </td>
                         <td className="px-4 py-4">
                            <span className={`text-[11px] font-bold uppercase tracking-wider ${template.status === 'Active' ? 'text-emerald-500' : 'text-slate-400'}`}>
                               {template.status}
                            </span>
                         </td>
                         <td className="pr-8 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                               <span className="text-[14px] font-bold text-slate-800">
                                  ₹{parseFloat(template.totalAmount || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}
                               </span>
                               <button 
                                 className="p-1 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-blue-600"
                                 onClick={(e) => {
                                    e.stopPropagation();
                                    // Could show a mini-menu here
                                 }}
                               >
                                  <ChevronRight size={14} />
                               </button>
                            </div>
                         </td>
                      </tr>
                   ))}
                   
                   {filtered.length === 0 && (
                      <tr>
                         <td colSpan="8" className="py-20 text-center">
                            <div className="flex flex-col items-center">
                               <Repeat size={40} className="text-slate-200 mb-4" />
                               <p className="text-slate-400 text-[14px]">No recurring bills found</p>
                               <button 
                                  onClick={() => navigate('/recurring-bills/new')}
                                  className="mt-4 text-blue-600 hover:underline text-[13px] font-bold"
                               >
                                  Create your first profile
                               </button>
                            </div>
                         </td>
                      </tr>
                   )}
                </tbody>
             </table>
          </div>
        </div>

        {/* Floating Action for selected profile (optional detail view) */}
        {selectedTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-end animate-in fade-in duration-300">
            <div 
              className="absolute inset-0 bg-slate-900/20 backdrop-blur-[2px]" 
              onClick={() => setSelectedTemplate(null)}
            ></div>
            <div className="relative w-full max-w-2xl h-full bg-white shadow-2xl flex flex-col slide-in-from-right-full animate-in duration-300">
                <header className="px-10 py-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                    <div>
                        <h2 className="text-[20px] font-bold text-slate-800 tracking-tight">{selectedTemplate.profileName}</h2>
                        <div className="flex items-center gap-2 mt-1">
                             <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase ${selectedTemplate.status === 'Active' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                {selectedTemplate.status}
                             </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => toggleStatus(selectedTemplate)}
                            className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
                        >
                            {selectedTemplate.status === 'Active' ? <Pause size={18} /> : <Play size={18} className="text-emerald-500" />}
                        </button>
                        <button 
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            onClick={() => { setDeleteId(selectedTemplate.id); setIsDeleteModalOpen(true); }}
                        >
                            <Trash2 size={18} />
                        </button>
                        <div className="w-px h-6 bg-slate-200 mx-2"></div>
                        <button onClick={() => setSelectedTemplate(null)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg transition-all">
                             <X size={20} />
                        </button>
                    </div>
                </header>
                
                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-slate-50/30">
                    <div className="space-y-8">
                        {/* Highlights */}
                        <div className="grid grid-cols-2 gap-4">
                           <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                              <div className="text-[11px] text-slate-400 font-bold uppercase mb-2">Total Amount</div>
                              <div className="text-[24px] font-bold text-slate-900">₹{parseFloat(selectedTemplate.totalAmount).toLocaleString()}</div>
                           </div>
                           <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                              <div className="text-[11px] text-slate-400 font-bold uppercase mb-2">Frequency</div>
                              <div className="text-[24px] font-bold text-blue-600 tracking-tight uppercase">{selectedTemplate.repeatEvery}</div>
                           </div>
                        </div>

                        {/* Schedule */}
                        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                           <h3 className="text-[14px] font-bold text-slate-800 mb-6">Execution Schedule</h3>
                           <div className="space-y-4">
                              <div className="flex items-center justify-between py-3 border-b border-slate-50">
                                 <span className="text-slate-400 text-[13px]">Start Date</span>
                                 <span className="text-slate-800 font-bold">{new Date(selectedTemplate.startDate).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center justify-between py-3 border-b border-slate-50">
                                 <span className="text-slate-400 text-[13px]">Last Run</span>
                                 <span className="text-slate-800 font-bold">{selectedTemplate.lastGeneratedDate ? new Date(selectedTemplate.lastGeneratedDate).toLocaleDateString() : 'Never'}</span>
                              </div>
                              <div className="flex items-center justify-between py-3">
                                 <span className="text-slate-400 text-[13px]">Next Run</span>
                                 <span className="text-blue-600 font-bold">{new Date(selectedTemplate.nextGenerationDate).toLocaleDateString()}</span>
                              </div>
                           </div>
                        </div>

                        {/* Items */}
                        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                           <h3 className="text-[14px] font-bold text-slate-800 mb-6 font-bold uppercase tracking-wider text-[11px] text-slate-400">Line Items</h3>
                           <div className="space-y-4">
                              {selectedTemplate.items?.map((item, idx) => (
                                 <div key={idx} className="flex justify-between items-start py-4 group">
                                    <div>
                                       <div className="font-bold text-slate-800 text-[14px]">{item.itemName}</div>
                                       <div className="text-[11px] text-slate-400 mt-0.5">{item.account}</div>
                                    </div>
                                    <div className="text-right">
                                       <div className="font-bold text-slate-900">₹{parseFloat(item.amount).toLocaleString()}</div>
                                       <div className="text-[11px] text-slate-400 mt-0.5">Qty {item.qty} × ₹{parseFloat(item.rate).toLocaleString()}</div>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default RecurringBillsView;
