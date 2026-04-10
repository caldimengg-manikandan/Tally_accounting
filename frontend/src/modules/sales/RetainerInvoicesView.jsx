import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { retainerInvoiceAPI, ledgerAPI } from '../../services/api';
import { 
  Plus, Search, Edit2, Trash2, 
  ChevronDown, MoreHorizontal, Filter, Download,
  ArrowRight, CheckCircle2, Clock, AlertCircle,
  X, Save, Send, ArrowLeft, Loader2, User, Calendar, FileText, AlertTriangle 
} from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';
import useNotificationStore from '../../store/notificationStore';

// --- Shared Form Components ---
const FormInput = ({ label, value, onChange, placeholder, type = "text", required = false }) => (
  <div className="flex flex-col gap-1.5 py-2">
    <label className="text-[12px] text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input 
      type={type}
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full h-9 border border-gray-300 rounded px-3 text-[13px] text-gray-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all font-sans"
    />
  </div>
);

const FormSelect = ({ label, value, onChange, options, placeholder, required = false }) => (
  <div className="flex flex-col gap-1.5 py-2">
    <label className="text-[12px] text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <select 
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      className="w-full h-9 border border-gray-300 rounded px-3 text-[13px] text-gray-800 outline-none focus:border-blue-500 bg-white transition-all font-sans"
    >
      <option value="">{placeholder || 'Select...'}</option>
      {options.map(opt => (
        <option key={opt.id || opt} value={opt.id || opt}>{opt.name || opt}</option>
      ))}
    </select>
  </div>
);

const RetainerInvoiceForm = ({ companyId, navigate, editId }) => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [formData, setFormData] = useState({
        customerId: '',
        invoiceNumber: '',
        referenceNumber: '',
        invoiceDate: new Date().toISOString().split('T')[0],
        totalAmount: 0,
        customerNotes: 'Thanks for your business.',
        termsConditions: '',
        status: 'Draft'
    });

    useEffect(() => {
        if (!companyId) return;
        setLoading(true);
        ledgerAPI.getByCompany(companyId)
            .then(res => {
                const safeLedgers = Array.isArray(res.data) ? res.data : [];
                setCustomers(safeLedgers.filter(l => {
                    const groupName = l.Group?.name || '';
                    return groupName.toLowerCase().includes('debtor') || groupName.toLowerCase().includes('customer');
                }));
            })
            .catch(console.error)
            .finally(() => setLoading(false));

        if (editId) {
            retainerInvoiceAPI.getById(editId)
                .then(res => {
                    const q = res.data;
                    setFormData({
                        ...q,
                        customerId: q.LedgerId || q.customerLedgerId,
                        invoiceDate: new Date(q.invoiceDate).toISOString().split('T')[0]
                    });
                })
                .catch(console.error);
        }
    }, [companyId, editId]);

    const handleSave = async (status = 'Draft') => {
        if (!formData.customerId || !formData.totalAmount) {
            alert('Please fill in Customer and Amount');
            return;
        }
        setSaving(true);
        try {
            const payload = { ...formData, companyId, status };
            if (editId) {
                await retainerInvoiceAPI.update(editId, payload);
            } else {
                await retainerInvoiceAPI.create(payload);
            }
            navigate('/retainer-invoices');
        } catch (err) {
            console.error(err);
            alert('Failed to save retainer invoice');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-20 text-center font-black animate-pulse text-slate-400">LOADING DATA...</div>;

    return (
        <div className="animate-in fade-in slide-in-from-right-8 duration-500 max-w-5xl mx-auto p-10">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/retainer-invoices')} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-900">
                        <ArrowLeft size={20} />
                    </button>
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">
                        {editId ? 'Edit Retainer Invoice' : 'New Retainer Invoice'}
                    </h2>
                </div>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <FormSelect 
                        label="Customer Name" 
                        required={true}
                        value={formData.customerId} 
                        onChange={val => {
                            if (val === 'ADD_NEW') {
                                navigate('/customers/new');
                            } else {
                                setFormData(p => ({ ...p, customerId: val }));
                            }
                        }}
                        options={[
                            { id: 'ADD_NEW', name: '+ Add New Customer' },
                            ...customers
                        ]}
                    />
                    <FormInput 
                        label="Retainer Invoice #" 
                        required={true} 
                        value={formData.invoiceNumber} 
                        onChange={val => setFormData(p => ({ ...p, invoiceNumber: val }))} 
                        placeholder="RET-00001"
                    />
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <FormInput label="Reference #" value={formData.referenceNumber} onChange={val => setFormData(p => ({ ...p, referenceNumber: val }))} />
                    <FormInput label="Retainer Date" type="date" required={true} value={formData.invoiceDate} onChange={val => setFormData(p => ({ ...p, invoiceDate: val }))} />
                </div>

                <div className="pt-6 border-t border-gray-50 mt-6">
                    <div className="max-w-xs">
                        <FormInput 
                            label="Amount to Retain (₹)" 
                            type="number" 
                            required={true}
                            value={formData.totalAmount} 
                            onChange={val => setFormData(p => ({ ...p, totalAmount: parseFloat(val) }))} 
                        />
                    </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-gray-50">
                    <div>
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Customer Notes</label>
                        <textarea 
                            value={formData.customerNotes} 
                            onChange={e => setFormData(p => ({ ...p, customerNotes: e.target.value }))}
                            className="w-full h-24 border border-gray-200 rounded-lg p-4 text-[13px] outline-none focus:border-blue-500 shadow-inner"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-8">
                    <button onClick={() => navigate('/retainer-invoices')} className="px-8 py-2.5 text-gray-400 font-bold text-[13px] hover:text-gray-900 uppercase">Cancel</button>
                    <button 
                        onClick={() => handleSave('Draft')} 
                        disabled={saving}
                        className="px-8 py-2.5 bg-white border border-blue-200 text-blue-600 rounded-lg text-[13px] font-black hover:bg-blue-50 transition-all uppercase"
                    >
                        Save as Draft
                    </button>
                    <button 
                        onClick={() => handleSave('Sent')} 
                        disabled={saving}
                        className="px-10 py-2.5 bg-blue-600 text-white rounded-lg text-[13px] font-black hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all uppercase"
                    >
                        {saving ? <Loader2 className="animate-spin" size={18} /> : 'Save and Send'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const RetainerInvoicesView = ({ companyId }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { addNotification } = useNotificationStore();
  const isNew = location.pathname.includes('/new');
  const isEdit = location.pathname.includes('/edit');

  const [retainers, setRetainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  useEffect(() => {
    if (companyId) fetchRetainers();
  }, [companyId]);

  const fetchRetainers = async () => {
    try {
      setLoading(true);
      const res = await retainerInvoiceAPI.getByCompany(companyId);
      setRetainers(res.data || []);
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

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await retainerInvoiceAPI.delete(deleteId);
      addNotification('Retainer invoice deleted successfully', 'success');
      fetchRetainers();
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to delete';
      addNotification(errorMsg, 'error');
    } finally {
      setIsDeleteModalOpen(false);
      setDeleteId(null);
    }
  };

  const statusMap = {
    Paid: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
    Draft: { bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-100' },
    Sent: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100' },
    PartiallyApplied: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
    FullyApplied: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
  };

  if (isNew || isEdit) return <RetainerInvoiceForm companyId={companyId} navigate={navigate} editId={id} />;

  if (loading) return <div className="p-20 text-center font-black animate-pulse text-slate-400 uppercase tracking-widest">Loading...</div>;

  return (
    <div className="flex flex-col min-h-screen bg-[#fcfdfe] animate-fade-in shadow-inner">
      <div className="flex items-center justify-between px-10 py-8 bg-white border-b border-slate-50/50">
        <div className="flex items-center gap-3">
           <h1 className="text-2xl font-black text-slate-900 tracking-tight">Retainer Invoices</h1>
           <div className="px-3 py-1 bg-slate-100 text-slate-500 rounded text-[10px] font-black uppercase tracking-widest">{retainers.length} Records</div>
        </div>
        <div className="flex items-center gap-3">
           <button 
             onClick={() => navigate('/retainer-invoices/new')}
             className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-[13px] font-black hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20 uppercase tracking-widest"
           >
              <Plus size={18} strokeWidth={3} /> New Retainer
           </button>
        </div>
      </div>

      <div className="px-10 py-10">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden min-h-[60vh]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50">
              <tr className="border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-10">Date</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Retainer#</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Customer Name</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Amount</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center pr-10">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {retainers.length === 0 ? (
                <tr>
                   <td colSpan={6} className="p-32 text-center">
                      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FileText size={40} className="text-slate-200" />
                      </div>
                      <p className="text-slate-400 font-bold uppercase text-[11px] tracking-[0.3em]">No retainer records found</p>
                   </td>
                </tr>
              ) : (
                retainers.map((r) => {
                  const style = statusMap[r.status] || statusMap.Draft;
                  return (
                    <tr key={r.id} className="hover:bg-blue-50/20 transition-all group cursor-pointer" onClick={() => navigate(`/retainer-invoices/view/${r.id}`)}>
                      <td className="px-8 py-6 text-[13px] font-bold text-slate-400 pl-10">
                        {new Date(r.invoiceDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-8 py-6 text-[14px] font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                        {r.invoiceNumber}
                      </td>
                      <td className="px-8 py-6 text-[13px] font-black text-slate-600 uppercase tracking-tight">
                        {r.CustomerLedger?.name || r.customerName}
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${style.bg} ${style.text} ${style.border}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-[15px] font-black text-slate-900 text-right">
                        ₹ {parseFloat(r.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-8 py-6 text-center pr-10">
                        <div className="flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={(e) => { e.stopPropagation(); navigate(`/retainer-invoices/edit/${r.id}`); }} className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-blue-600 transition-all shadow-sm">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleDelete(r.id); }} className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-rose-600 transition-all shadow-sm">
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
        onConfirm={confirmDelete}
        title="Delete Retainer Invoice"
        message="Are you sure you want to delete this retainer invoice? This action will permanently remove the record from your database."
      />
    </div>
  );
};

export default RetainerInvoicesView;
