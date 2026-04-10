import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { recurringInvoiceAPI, ledgerAPI, inventoryAPI, priceListAPI } from '../../services/api';
import { 
  Plus, Calendar, RefreshCw, MoreHorizontal, Edit2, Trash2, 
  Settings, CheckCircle2, AlertCircle, Clock, ArrowRight,
  Package, User, Search, X, ChevronRight, FileText,
  Filter, Download, ArrowLeft, Loader2, Save, Send,
  Trash, Info, HelpCircle, Tag, Paperclip, ChevronDown, Check,
  AlertTriangle, Play, Pause, Square, File
} from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';
import useNotificationStore from '../../store/notificationStore';

// ─────────────────────────────────────────────────────────────────────────────
// RECURRING INVOICE FORM (ZOHO STYLE)
// ─────────────────────────────────────────────────────────────────────────────

const RecurringInvoiceForm = ({ companyId, navigate, editId }) => {
    const { addNotification } = useNotificationStore();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    
    // Core Data
    const [customers, setCustomers] = useState([]);
    const [items, setItems] = useState([]);
    
    // Form State
    const [formData, setFormData] = useState({
        templateName: '',
        customerName: '',
        frequency: 'Monthly',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        status: 'Active',
        autoSend: false,
        invoiceType: 'TaxInvoice',
        discount: 0,
        adjustment: 0,
        taxPercent: 18, // Default 18% GST
        customerNotes: 'Thanks for your business.',
        termsConditions: ''
    });

    const [lineItems, setLineItems] = useState([
        { id: Date.now(), itemId: '', name: '', description: '', quantity: 1, rate: 0, amount: 0 }
    ]);

    // Initialize
    useEffect(() => {
        if (!companyId) return;
        setLoading(true);
        Promise.all([
            ledgerAPI.getByCompany(companyId),
            inventoryAPI.getByCompany(companyId)
        ]).then(([ledgersRes, itemsRes]) => {
            setCustomers(ledgersRes.data || []);
            setItems(itemsRes.data || []);
        }).finally(() => setLoading(false));

        if (editId) {
            recurringInvoiceAPI.getByCompany(companyId).then(res => {
                const template = res.data.find(t => t.id === editId);
                if (template) {
                    setFormData({
                        ...template,
                        startDate: new Date(template.startDate).toISOString().split('T')[0],
                        endDate: template.endDate ? new Date(template.endDate).toISOString().split('T')[0] : '',
                        taxPercent: template.taxAmount ? Math.round((template.taxAmount / (template.subTotal - (template.subTotal * template.discount/100))) * 100) : 18
                    });
                    setLineItems(JSON.parse(template.itemsJson || '[]'));
                }
            });
        }
    }, [companyId, editId]);

    // Calculations
    const totals = useMemo(() => {
        const subTotal = lineItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        const discountAmt = subTotal * (parseFloat(formData.discount || 0) / 100);
        const beforeTax = subTotal - discountAmt;
        const taxAmt = beforeTax * (parseFloat(formData.taxPercent || 0) / 100);
        const total = beforeTax + taxAmt + parseFloat(formData.adjustment || 0);
        return { subTotal, discountAmt, taxAmt, total };
    }, [lineItems, formData.discount, formData.taxPercent, formData.adjustment]);

    const handleUpdateLine = (id, field, value) => {
        setLineItems(prev => prev.map(item => {
            if (item.id === id) {
                const updated = { ...item, [field]: value };
                if (field === 'quantity' || field === 'rate') {
                    updated.amount = (parseFloat(updated.quantity) || 0) * (parseFloat(updated.rate) || 0);
                }
                return updated;
            }
            return item;
        }));
    };

    const handleItemSelect = (rowId, itId) => {
        const item = items.find(i => i.id === itId);
        if (!item) return;

        setLineItems(prev => prev.map(row => {
            if (row.id === rowId) {
                return {
                    ...row,
                    itemId: item.id,
                    name: item.name,
                    description: item.salesDescription || '',
                    rate: item.sellingPrice || 0,
                    amount: (item.sellingPrice || 0) * (row.quantity || 1)
                };
            }
            return row;
        }));
    };

    const handleSave = async () => {
        if (!formData.templateName || !formData.customerName || lineItems.every(li => !li.itemId)) {
            addNotification('Please fill in Template Name, Customer and add at least one item.', 'error');
            return;
        }
        
        setSaving(true);
        try {
            // Zoho Style Mapping: Ensure we only send what the backend expects
            // and handle empty date strings which crash PostgreSQL
            const payload = {
                templateName: formData.templateName,
                customerName: formData.customerName,
                frequency: formData.frequency,
                startDate: formData.startDate,
                endDate: formData.endDate === '' ? null : formData.endDate, // Fix: Send null if empty
                status: formData.status,
                autoSend: formData.autoSend,
                invoiceType: formData.invoiceType,
                discount: parseFloat(formData.discount || 0),
                subTotal: totals.subTotal,
                taxAmount: totals.taxAmt,
                totalAmount: totals.total,
                itemsJson: JSON.stringify(lineItems),
                CompanyId: companyId,
                nextGenerationDate: formData.startDate 
            };

            if (editId) {
                await recurringInvoiceAPI.update(editId, payload);
                addNotification('Automation template updated successfully', 'success');
            } else {
                await recurringInvoiceAPI.create(payload);
                addNotification('Automation template created successfully', 'success');
            }
            navigate('/recurring-invoices');
        } catch (err) {
            console.error('Save Error Details:', err.response?.data || err.message);
            addNotification(err.response?.data?.error || 'Failed to save automation template', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-20 text-center font-bold text-slate-400">Loading Automation Interface...</div>;

    return (
        <div className="min-h-screen bg-white text-slate-700 font-sans p-10 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-10">
                <button onClick={() => navigate('/recurring-invoices')} className="text-slate-400 hover:text-slate-600"><ArrowLeft size={24} /></button>
                <h1 className="text-2xl font-semibold text-slate-900">{editId ? 'Edit Recurring Invoice' : 'New Recurring Invoice'}</h1>
            </div>

            <div className="space-y-8">
                {/* Main Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-6 border-b border-slate-100 pb-10">
                    <div className="space-y-6">
                        <div className="flex items-start gap-4">
                            <label className="w-32 text-sm text-rose-500 font-medium pt-2">Customer Name*</label>
                            <div className="flex-1 flex gap-2">
                                <select 
                                    value={formData.customerName} 
                                    onChange={e => setFormData({...formData, customerName: e.target.value})}
                                    className="flex-1 p-2 border border-slate-200 rounded text-sm focus:border-blue-500 outline-none"
                                >
                                    <option value="">Select or add a customer</option>
                                    {customers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                </select>
                                <button className="p-2 bg-blue-600 text-white rounded"><Search size={16}/></button>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <label className="w-32 text-sm text-rose-500 font-medium">Profile Name*</label>
                            <input 
                                type="text"
                                value={formData.templateName} 
                                onChange={e => setFormData({...formData, templateName: e.target.value})}
                                placeholder="e.g., Monthly Service Retainer"
                                className="flex-1 p-2 border border-slate-200 rounded text-sm outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <label className="w-32 text-sm text-rose-500 font-medium">Repeat Every*</label>
                            <select 
                                value={formData.frequency}
                                onChange={e => setFormData({...formData, frequency: e.target.value})}
                                className="flex-1 p-2 border border-slate-200 rounded text-sm outline-none focus:border-blue-500"
                            >
                                <option>Daily</option>
                                <option>Weekly</option>
                                <option>Monthly</option>
                                <option>Yearly</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-4">
                            <label className="w-32 text-sm text-rose-500 font-medium">Start Date*</label>
                            <input 
                                type="date"
                                value={formData.startDate}
                                onChange={e => setFormData({...formData, startDate: e.target.value})}
                                className="flex-1 p-2 border border-slate-200 rounded text-sm outline-none focus:border-blue-500"
                            />
                        </div>

                        <div className="flex items-center gap-4">
                            <label className="w-32 text-sm text-slate-500">Ends On</label>
                            <div className="flex-1 flex items-center gap-4">
                                <input 
                                    type="date"
                                    value={formData.endDate}
                                    onChange={e => setFormData({...formData, endDate: e.target.value})}
                                    disabled={!formData.endDate && formData.endDate !== ''}
                                    className="flex-1 p-2 border border-slate-200 rounded text-sm outline-none focus:border-blue-500 disabled:bg-slate-50"
                                />
                                <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-500">
                                    <input type="checkbox" checked={!formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.checked ? '' : new Date().toISOString().split('T')[0]})} className="w-4 h-4 rounded border-slate-200" />
                                    Never Expires
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Item Table */}
                <div className="mt-10">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase border-y border-slate-200">
                                <th className="px-4 py-3 text-left w-1/2">Item Details</th>
                                <th className="px-4 py-3 text-right">Quantity</th>
                                <th className="px-4 py-3 text-right">Rate</th>
                                <th className="px-4 py-3 text-right">Amount</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {lineItems.map(line => (
                                <tr key={line.id} className="border-b border-slate-100 group">
                                    <td className="px-4 py-4">
                                        <div className="relative group">
                                            <select 
                                                value={line.itemId} 
                                                onChange={e => handleItemSelect(line.id, e.target.value)}
                                                className="w-full p-2 border border-transparent hover:border-slate-200 border-dashed rounded text-sm outline-none bg-transparent appearance-none"
                                            >
                                                <option value="">Type or click to select an item.</option>
                                                {items.map(it => (
                                                    <option key={it.id} value={it.id}>
                                                        {it.name} (Rate: ₹{parseFloat(it.sellingPrice || 0).toLocaleString()})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <textarea 
                                            value={line.description}
                                            onChange={e => handleUpdateLine(line.id, 'description', e.target.value)}
                                            placeholder="Additional description..." 
                                            className="w-full mt-2 h-12 p-2 border border-transparent hover:border-slate-100 rounded text-xs text-slate-500 outline-none resize-none bg-transparent"
                                        />
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <input type="number" value={line.quantity} onChange={e => handleUpdateLine(line.id, 'quantity', e.target.value)} className="w-20 p-2 text-right text-sm outline-none bg-transparent border border-transparent focus:border-slate-200 rounded" />
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <input type="number" value={line.rate} onChange={e => handleUpdateLine(line.id, 'rate', e.target.value)} className="w-24 p-2 text-right text-sm outline-none bg-transparent border border-transparent focus:border-slate-200 rounded" />
                                    </td>
                                    <td className="px-4 py-4 text-right text-sm font-medium">{(parseFloat(line.amount) || 0).toFixed(2)}</td>
                                    <td className="px-4 py-4 text-center">
                                        <button onClick={() => setLineItems(prev => prev.filter(p => p.id !== line.id))} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><X size={16}/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    <div className="mt-4 flex gap-4">
                        <button onClick={() => setLineItems(prev => [...prev, { id: Date.now(), itemId: '', name: '', description: '', quantity: 1, rate: 0, amount: 0 }])} className="px-4 py-1 border border-slate-200 rounded text-xs font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-1">
                            <Plus size={14} className="text-blue-600" /> Add New Row
                        </button>
                    </div>
                </div>

                {/* Totals & Notes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-20 pt-10">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-500">Customer Notes</label>
                            <textarea value={formData.customerNotes} onChange={e => setFormData({...formData, customerNotes: e.target.value})} className="w-full p-2 border border-slate-200 rounded text-sm outline-none h-24 italic" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-500">Terms & Conditions</label>
                            <textarea value={formData.termsConditions} onChange={e => setFormData({...formData, termsConditions: e.target.value})} className="w-full p-2 border border-slate-200 rounded text-sm outline-none h-24" />
                        </div>
                    </div>

                    <div className="space-y-4 bg-slate-50/50 p-6 rounded-lg self-start">
                        <div className="flex justify-between text-sm">
                            <span>Sub Total</span>
                            <span className="font-medium">{totals.subTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <span>Discount</span>
                                <input type="number" value={formData.discount} onChange={e => setFormData({...formData, discount: e.target.value})} className="w-12 p-1 border border-slate-200 rounded text-xs text-right" />
                                <span>%</span>
                            </div>
                            <span className="font-medium text-slate-500">{totals.discountAmt.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <span>Tax (GST)</span>
                                <select 
                                    value={formData.taxPercent} 
                                    onChange={e => setFormData({...formData, taxPercent: parseFloat(e.target.value)})}
                                    className="ml-2 p-1 border border-slate-200 rounded text-xs outline-none"
                                >
                                    <option value="0">GST (0%)</option>
                                    <option value="5">GST (5%)</option>
                                    <option value="12">GST (12%)</option>
                                    <option value="18">GST (18%)</option>
                                    <option value="28">GST (28%)</option>
                                </select>
                            </div>
                            <span className="font-medium text-slate-500">{totals.taxAmt.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2 border-b border-slate-200 border-dashed">
                                <span>Adjustment</span>
                                <Info size={12} className="text-slate-400" />
                            </div>
                            <input type="number" value={formData.adjustment} onChange={e => setFormData({...formData, adjustment: e.target.value})} className="w-24 p-1 border border-slate-200 rounded text-right text-xs" />
                        </div>

                        <div className="flex justify-between text-lg font-bold text-slate-900 pt-4 border-t border-slate-200">
                            <span>Total ( ₹ ) {formData.frequency && <span className="text-[10px] text-blue-600 font-bold ml-1 uppercase">{formData.frequency} CYCLE</span>}</span>
                            <span>{totals.total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Save Footer */}
                <div className="sticky bottom-0 bg-white border-t border-slate-100 py-6 flex gap-4 mt-20">
                     <div className="flex-1 flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-600 font-medium">
                            <input type="checkbox" checked={formData.autoSend} onChange={e => setFormData({...formData, autoSend: e.target.checked})} className="w-4 h-4 text-blue-600 rounded border-slate-200" />
                            Auto-send invoices to the customer via email
                        </label>
                     </div>
                     <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="px-8 py-2.5 bg-blue-600 text-white rounded font-bold text-sm hover:bg-blue-700 transition-all shadow-sm flex items-center gap-2"
                    >
                        {saving ? <Loader2 className="animate-spin" size={18} /> : (editId ? 'Update Template' : 'Initialize Automation')}
                    </button>
                    <button onClick={() => navigate('/recurring-invoices')} className="px-8 py-2 border border-slate-200 rounded text-sm font-medium hover:bg-slate-50">Cancel</button>
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// RECURRING INVOICES VIEW (LIST)
// ─────────────────────────────────────────────────────────────────────────────

const RecurringInvoicesView = ({ companyId }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { addNotification } = useNotificationStore();
  
  const isNew = location.pathname.includes('/new');
  const isEdit = location.pathname.includes('/edit');

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const fetchTemplates = async () => {
    if (!companyId) {
        console.warn('RecurringInvoicesView: companyId is missing');
        return;
    }
    console.log('RecurringInvoicesView: Fetching for companyId:', companyId);
    try {
      setLoading(true);
      const res = await recurringInvoiceAPI.getByCompany(companyId);
      console.log('RecurringInvoicesView: Received templates:', res.data);
      setTemplates(res.data || []);
    } catch (err) {
      console.error('Fetch Templates Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [companyId]);

  const handleRunAutomation = async () => {
    try {
      setRunning(true);
      console.log('RecurringInvoicesView: Running manual cycle...');
      const res = await recurringInvoiceAPI.processDue();
      addNotification(res.data.message || 'Automation run complete', 'success');
      fetchTemplates();
    } catch (err) {
      console.error('Run Automation Error:', err);
      addNotification('Automation run failed', 'error');
    } finally {
      setRunning(false);
    }
  };

  const handleDelete = (tid) => {
    setDeleteId(tid);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await recurringInvoiceAPI.delete(deleteId);
      addNotification('Template deleted successfully', 'success');
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
        await recurringInvoiceAPI.update(template.id, { status: newStatus });
        addNotification(`Automation ${newStatus === 'Active' ? 'Resumed' : 'Paused'}`, 'success');
        fetchTemplates();
     } catch (err) {
        addNotification('Failed to update status', 'error');
     }
  };

  if (isNew || isEdit) return <RecurringInvoiceForm companyId={companyId} navigate={navigate} editId={id} />;

  if (loading) return <div className="p-32 text-center font-bold text-slate-400">Loading Automation Profiles...</div>;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <header className="px-8 py-4 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-[100]">
        <div className="flex items-center gap-2 group cursor-pointer" onClick={() => navigate('/recurring-invoices')}>
           <h1 className="text-[20px] font-bold text-slate-900">All Recurring Invoices</h1>
           <ChevronDown size={18} className="text-blue-600 mt-1" />
        </div>
        <div className="flex items-center gap-3">
           <button 
             onClick={handleRunAutomation}
             disabled={running}
             className="px-4 py-2 border border-slate-200 text-slate-600 rounded-md text-[13px] font-medium hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
           >
              {running ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} Run Cycle
           </button>
           <button 
             onClick={() => navigate('/recurring-invoices/new')}
             className="bg-[#1e61f0] hover:bg-[#1a54d1] text-white px-4 py-2 rounded-md font-medium flex items-center gap-1.5 transition-all shadow-sm"
           >
              <Plus size={18} strokeWidth={2.5} /> New
           </button>
        </div>
      </header>

      <div className="p-8">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">Profile Name</th>
              <th className="px-6 py-4">Customer Name</th>
              <th className="px-6 py-4">Frequency</th>
              <th className="px-6 py-4">Last Generated</th>
              <th className="px-6 py-4 text-center">Next Generation</th>
              <th className="px-6 py-4 text-right">Amount</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {templates.length > 0 ? (
              templates.map(t => (
                <tr 
                  key={t.id} 
                  className="hover:bg-slate-50 transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-4 text-[14px] font-medium text-blue-600 group-hover:underline" onClick={() => navigate(`/recurring-invoices/edit/${t.id}`)}>
                    {t.templateName}
                  </td>
                  <td className="px-6 py-4 text-[14px] text-slate-600">{t.customerName}</td>
                  <td className="px-6 py-4 text-[13px] text-slate-500 font-medium whitespace-nowrap">{t.frequency}</td>
                  <td className="px-6 py-4 text-[13px] text-slate-500 font-medium whitespace-nowrap italic">
                    {t.lastGeneratedDate ? new Date(t.lastGeneratedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Never'}
                  </td>
                  <td className="px-6 py-4 text-center text-[13px] text-slate-600 font-medium">
                    {new Date(t.nextGenerationDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-[14px] text-slate-900 font-medium whitespace-nowrap">
                      ₹ {parseFloat(t.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-medium uppercase tracking-widest border ${t.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                       <button 
                        onClick={(e) => { e.stopPropagation(); toggleStatus(t); }} 
                        className={`p-1.5 rounded border transition-all shadow-sm ${t.status === 'Active' ? 'bg-amber-50 text-amber-500 border-amber-200' : 'bg-emerald-50 text-emerald-500 border-emerald-200'}`}
                        title={t.status === 'Active' ? 'Pause' : 'Resume'}
                       >
                         {t.status === 'Active' ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                       </button>
                       <button 
                         onClick={(e) => { e.stopPropagation(); navigate(`/recurring-invoices/edit/${t.id}`); }} 
                         className="p-1.5 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 rounded shadow-sm transition-all"
                         title="Edit Template"
                       >
                         <Edit2 size={14} />
                       </button>
                       <button 
                         onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }} 
                         className="p-1.5 bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 rounded shadow-sm transition-all"
                         title="Delete Template"
                       >
                         <Trash2 size={14} />
                       </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="px-6 py-20 text-center">
                   <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                         <RefreshCw size={24} />
                      </div>
                      <p className="text-slate-500 text-[14px]">No recurring invoices profiles found.</p>
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => navigate('/recurring-invoices/new')}
                          className="text-blue-600 text-[13px] font-medium hover:underline"
                        >
                           Configure your first automation template
                        </button>
                        <span className="text-slate-300">|</span>
                        <button 
                          onClick={fetchTemplates}
                          className="text-slate-400 text-[13px] font-medium hover:text-slate-600 flex items-center gap-1"
                        >
                           <RefreshCw size={12} /> Refresh List
                        </button>
                      </div>
                   </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Terminate Automation Template"
        message="Are you sure you want to delete this recurring invoice template? No more future invoices will be generated for this customer."
      />
    </div>
  );
};

export default RecurringInvoicesView;
