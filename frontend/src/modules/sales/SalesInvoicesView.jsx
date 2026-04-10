import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { salesAPI } from '../../services/api';
import { 
  Plus, Search, Edit2, Trash2, 
  ChevronDown, MoreHorizontal, FileText,
  Check, AlertCircle, File
} from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';
import useNotificationStore from '../../store/notificationStore';

const SalesInvoicesView = ({ companyId }) => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const { addNotification } = useNotificationStore();
  
  useEffect(() => {
    if (companyId) fetchInvoices();
  }, [companyId]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await salesAPI.getInvoicesByCompany(companyId);
      setInvoices(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteInvoice = async () => {
    if (!deleteId) return;
    try {
      await salesAPI.deleteInvoice(deleteId);
      addNotification('Invoice deleted successfully', 'success');
      fetchInvoices();
    } catch (err) {
      addNotification('Failed to delete invoice', 'error');
    } finally {
      setIsDeleteModalOpen(false);
      setDeleteId(null);
    }
  };

  const statusMap = {
    Confirmed: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', icon: <Check size={12}/> },
    Draft: { bg: 'bg-slate-100', text: 'text-slate-500', border: 'border-slate-200', icon: <File size={12}/> },
    Sent: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', icon: <FileText size={12}/> },
  };

  if (loading) return <div className="p-20 text-center font-black animate-pulse text-slate-400">LOADING INVOICES...</div>;

  return (
    <div className="flex flex-col min-h-screen bg-[#fcfdfe] animate-fade-in">
      
      {/* Header Bar */}
      <div className="flex items-center justify-between px-10 py-6">
        <div className="flex items-center gap-2">
           <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[14px] font-black text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
              All Invoices <ChevronDown size={16} className="text-slate-400" />
           </button>
        </div>
        <div className="flex items-center gap-3">
           <button 
             onClick={() => navigate('/sales/new-invoice')}
             className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-[13px] font-black hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20"
           >
              <Plus size={18} /> New
           </button>
           <button className="p-2.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-slate-600">
              <MoreHorizontal size={18} />
           </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="px-10">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden min-h-[60vh]">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice#</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer Name</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {invoices.length === 0 ? (
                <tr>
                   <td colSpan={6} className="p-20 text-center">
                      <p className="text-slate-300 font-black uppercase text-xs tracking-widest">No invoice records found</p>
                   </td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const style = statusMap[inv.status] || statusMap.Draft;
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-6 text-[13px] font-medium text-slate-500">
                        {new Date(inv.date).toLocaleDateString('en-GB')}
                      </td>
                      <td className="px-8 py-6 text-[13px] font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                        {inv.invoiceNumber}
                      </td>
                      <td className="px-8 py-6 text-[13px] font-bold text-slate-600 uppercase">
                        {inv.CustomerLedger?.name || 'Unknown'}
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border flex items-center gap-1.5 w-fit ${style.bg} ${style.text} ${style.border}`}>
                          {style.icon}
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-[14px] font-black text-slate-900 text-right">
                        ₹ {parseFloat(inv.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); navigate(`/sales/edit-invoice/${inv.id}`); }} 
                            className="p-2 bg-white border border-slate-100 rounded-lg text-slate-400 hover:text-blue-600 transition-all shadow-sm"
                            title={inv.status === 'Draft' ? 'Resume Draft' : 'Edit Invoice'}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={(e) => { 
                               e.stopPropagation(); 
                               handleDelete(inv.id); 
                            }} 
                            className="p-2 bg-white border border-slate-100 rounded-lg text-slate-400 hover:text-rose-600 transition-all shadow-sm"
                            title="Delete Invoice"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteInvoice}
        title="Delete Sales Invoice"
        message="Are you sure you want to delete this invoice? This action cannot be undone."
      />
    </div>
  );
};

export default SalesInvoicesView;
