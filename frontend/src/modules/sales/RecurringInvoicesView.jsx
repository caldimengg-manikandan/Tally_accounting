import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { recurringInvoiceAPI, ledgerAPI, inventoryAPI } from '../../services/api';
import { 
  Plus, Calendar, RefreshCw, MoreHorizontal, Edit2, Trash2, 
  Settings, CheckCircle2, AlertCircle, Clock, ArrowRight,
  Package, User, Search, X, ChevronRight
} from 'lucide-react';

const RecurringInvoicesView = ({ companyId }) => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Form State
  const [customerName, setCustomerName] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [frequency, setFrequency] = useState('Monthly');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [autoSend, setAutoSend] = useState(false);

  useEffect(() => {
    if (companyId) fetchTemplates();
  }, [companyId]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await recurringInvoiceAPI.getByCompany(companyId);
      setTemplates(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await recurringInvoiceAPI.create({
        CompanyId: companyId,
        templateName,
        customerName,
        frequency,
        startDate,
        totalAmount,
        autoSend,
        nextGenerationDate: startDate
      });
      setIsFormOpen(false);
      fetchTemplates();
    } catch (err) {
      alert('Failed to create template');
    }
  };

  const handleProcess = async () => {
     try {
       const res = await recurringInvoiceAPI.processDue();
       alert(res.data.message);
       fetchTemplates();
     } catch (err) {
       alert('Processing failed');
     }
  };

  if (loading) return <div className="p-20 text-center font-black animate-pulse uppercase tracking-widest text-slate-400">Syncing Automation Engine...</div>;

  return (
    <div className="flex flex-col min-h-screen bg-[#fcfdfe]">
      {/* Header */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 px-10 py-6 flex items-center justify-between z-[100]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-purple-50 text-purple-600 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest">Automation Module</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Recurring Invoices</h2>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleProcess}
            className="px-6 py-3 border border-slate-200 text-slate-600 rounded-xl text-[13px] font-black hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
          >
            <RefreshCw size={18} /> RUN AUTOMATION
          </button>
          <button 
            onClick={() => setIsFormOpen(true)}
            className="px-8 py-3 bg-purple-600 text-white rounded-xl text-[13px] font-black hover:bg-purple-700 shadow-lg shadow-purple-600/20 transition-all flex items-center gap-2"
          >
            <Plus size={18} /> CREATE TEMPLATE
          </button>
        </div>
      </header>

      <div className="p-10 space-y-6">
        {templates.length === 0 ? (
          <div className="bg-white rounded-3xl border-2 border-dashed border-slate-100 p-20 text-center">
             <div className="w-20 h-20 bg-purple-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-purple-600">
               <Calendar size={40} />
             </div>
             <h3 className="text-xl font-black text-slate-900 mb-2">No Recurring Invoices found</h3>
             <p className="text-slate-500 font-medium mb-8">Set up automatic billing once and let the system handle the rest.</p>
             <button onClick={() => setIsFormOpen(true)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[13px] hover:bg-black transition-all">GET STARTED</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {templates.map(t => (
               <div key={t.id} className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4">
                    <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${t.status === 'Active' ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-400'}`}>
                      {t.status}
                    </span>
                 </div>
                 <div className="mb-6">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.frequency}</p>
                    <h4 className="text-lg font-black text-slate-900 leading-tight mb-2">{t.templateName}</h4>
                    <p className="text-[13px] text-slate-500 font-medium flex items-center gap-2">
                       <User size={14}/> {t.customerName}
                    </p>
                 </div>
                 <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-slate-50 rounded-2xl p-4">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">TOTAL AMOUNT</p>
                       <p className="text-lg font-black text-slate-900">₹{parseFloat(t.totalAmount).toLocaleString()}</p>
                    </div>
                    <div className="bg-purple-50/50 rounded-2xl p-4">
                       <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1">NEXT DATE</p>
                       <p className="text-lg font-black text-purple-600">{new Date(t.nextGenerationDate).toLocaleDateString()}</p>
                    </div>
                 </div>
                 <div className="flex items-center justify-between border-t border-slate-50 pt-6">
                    <div className="flex items-center gap-2 text-[12px] font-bold text-slate-400">
                       <Clock size={14}/> {t.autoSend ? 'Auto-Sending Enabled' : 'Manual Review'}
                    </div>
                    <button className="p-2 hover:bg-slate-50 rounded-lg transition-colors"><MoreHorizontal size={20}/></button>
                 </div>
               </div>
             ))}
          </div>
        )}
      </div>

      {/* Simplified Create Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setIsFormOpen(false)} />
          <div className="relative bg-white rounded-[40px] shadow-[0_40px_100px_rgba(0,0,0,0.3)] w-full max-w-xl overflow-hidden animate-scale-up">
             <div className="p-10 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                <div>
                   <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-1">Recurring Template</h3>
                   <p className="text-slate-500 text-[14px] font-medium italic">Configure your automated billing schedule.</p>
                </div>
                <button onClick={() => setIsFormOpen(false)} className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center hover:bg-white transition-all"><X/></button>
             </div>
             
             <div className="p-10 space-y-8">
                <div className="space-y-6">
                    <div>
                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Template Profile Name</label>
                        <input 
                            value={templateName} 
                            onChange={e => setTemplateName(e.target.value)} 
                            placeholder="e.g., Monthly Maintenance Fee" 
                            className="w-full px-6 py-4 bg-slate-50 border border-transparent rounded-2xl text-[15px] font-bold text-slate-900 outline-none focus:bg-white focus:border-purple-500 transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Customer Profile</label>
                        <input 
                            value={customerName} 
                            onChange={e => setCustomerName(e.target.value)} 
                            placeholder="Type customer name..." 
                            className="w-full px-6 py-4 bg-slate-50 border border-transparent rounded-2xl text-[15px] font-bold text-slate-900 outline-none focus:bg-white focus:border-purple-500 transition-all"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Frequency</label>
                            <select 
                                value={frequency}
                                onChange={e => setFrequency(e.target.value)}
                                className="w-full px-6 py-4 bg-slate-50 border border-transparent rounded-2xl text-[15px] font-bold text-slate-900 outline-none focus:bg-white focus:border-purple-500 transition-all appearance-none"
                            >
                                <option>Daily</option>
                                <option>Weekly</option>
                                <option>Monthly</option>
                                <option>Yearly</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Start Date</label>
                            <input 
                                type="date" 
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                className="w-full px-6 py-4 bg-slate-50 border border-transparent rounded-2xl text-[15px] font-bold text-slate-900 outline-none focus:bg-white focus:border-purple-500 transition-all"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Amount per Cycle (₹)</label>
                        <input 
                            type="number" 
                            value={totalAmount} 
                            onChange={e => setTotalAmount(e.target.value)} 
                            placeholder="0.00" 
                            className="w-full px-6 py-4 bg-slate-50 border border-transparent rounded-2xl text-[15px] font-bold text-slate-900 outline-none focus:bg-white focus:border-purple-500 transition-all"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3 p-6 bg-purple-50/50 rounded-3xl border border-purple-100/50">
                    <input 
                        type="checkbox" 
                        id="autosend" 
                        checked={autoSend}
                        onChange={e => setAutoSend(e.target.checked)}
                        className="w-5 h-5 rounded-lg border-purple-200 text-purple-600 focus:ring-purple-500"
                    />
                    <label htmlFor="autosend" className="text-[13px] font-black text-purple-900 uppercase tracking-wide cursor-pointer">Auto-send invoice via email upon generation</label>
                </div>

                <button 
                  onClick={handleCreate}
                  className="w-full py-5 bg-purple-600 text-white rounded-3xl font-black text-[15px] shadow-2xl shadow-purple-600/30 hover:bg-purple-700 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                >
                   SAVE AUTOMATION TEMPLATE <ArrowRight size={20} />
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecurringInvoicesView;
