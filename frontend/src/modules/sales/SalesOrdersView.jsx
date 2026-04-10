import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Filter, Download, Columns, Rows, ChevronLeft, ChevronRight, 
  Settings, X, HelpCircle, Package, User, Calendar, FileText, Trash2, 
  ArrowLeft, Save, Send, Clock, MoreHorizontal, CheckCircle2, AlertCircle, Loader2, Edit2
} from 'lucide-react';
import { salesAPI, ledgerAPI, inventoryAPI } from '../../services/api';
import ConfirmModal from '../../components/ConfirmModal';
import useNotificationStore from '../../store/notificationStore';

// --- Shared Components for the Form ---
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
      className="w-full h-9 border border-gray-300 rounded px-3 text-[13px] text-gray-800 outline-none focus:border-blue-500 bg-white transition-all font-sans appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat"
    >
      <option value="">{placeholder || 'Select...'}</option>
      {options.map(opt => (
        <option key={opt.id || opt} value={opt.id || opt}>{opt.name || opt}</option>
      ))}
    </select>
  </div>
);

const SalesOrdersView = ({ companyId }) => {
  const navigate = useNavigate();
  const [view, setView] = useState('list'); // 'list' or 'form'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const { addNotification } = useNotificationStore();
  
  // Form State
  const [formData, setFormData] = useState({
    id: null,
    customerId: '',
    orderNumber: '',
    referenceNumber: '',
    date: new Date().toISOString().split('T')[0],
    expectedShipmentDate: '',
    group: 'Draft',
    items: [{ id: Date.now(), itemId: '', detail: '', quantity: 1, rate: 0, amount: 0 }],
    subTotal: 0,
    discount: 0,
    tax: 0,
    adjustment: 0,
    totalAmount: 0,
    status: 'Draft'
  });

  const fetchData = async (cid) => {
    const targetCid = cid || companyId;
    if (!targetCid || targetCid === 'null' || targetCid === 'undefined') {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const [oRes, cRes, iRes] = await Promise.all([
        salesAPI.getOrders(targetCid),
        ledgerAPI.getByCompany(targetCid),
        inventoryAPI.getByCompany(targetCid)
      ]);

      const safeOrders = Array.isArray(oRes.data) ? oRes.data : [];
      setOrders(safeOrders);

      const safeLedgers = Array.isArray(cRes.data) ? cRes.data : [];
      setCustomers(safeLedgers.filter(l => {
        const groupName = l.Group?.name;
        if (typeof groupName !== 'string') return false;
        const lowered = groupName.toLowerCase();
        return lowered.includes('debtor') || lowered.includes('customer');
      }));

      setItems(Array.isArray(iRes.data) ? iRes.data : []);
    } catch (err) {
      console.error('Fetch error:', err);
      const errMsg = err.response?.data?.error || err.message || 'Failed to connect to sales server.';
      setStatus({ type: 'error', message: errMsg + ' Please try refreshing.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyId && companyId !== 'null' && companyId !== 'undefined') {
      fetchData(companyId);
    } else {
      // Small delay to wait for App.jsx to resolve company if it's currently null
      const timer = setTimeout(() => {
        if (!companyId) setLoading(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [companyId]);

  // --- Calculations ---
  useEffect(() => {
    const subTotal = formData.items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const total = subTotal - (formData.discount || 0) + (formData.tax || 0) + (parseFloat(formData.adjustment) || 0);
    setFormData(prev => ({ ...prev, subTotal, totalAmount: total }));
  }, [formData.items, formData.discount, formData.tax, formData.adjustment]);

  const handleAddField = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { id: Date.now(), itemId: '', detail: '', quantity: 1, rate: 0, amount: 0 }]
    }));
  };

  const handleRemoveField = (id) => {
    if (formData.items.length === 1) return;
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(i => i.id !== id)
    }));
  };

  const handleItemUpdate = (id, field, value) => {
    setFormData(prev => {
      const newItems = prev.items.map(item => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === 'itemId') {
            const selected = items.find(i => i.id === value);
            if (selected) {
              updated.detail = selected.name;
              updated.rate = selected.sellingPrice || 0;
            }
          }
          if (field === 'quantity' || field === 'rate' || field === 'itemId') {
            updated.amount = (updated.quantity || 0) * (updated.rate || 0);
          }
          return updated;
        }
        return item;
      });
      return { ...prev, items: newItems };
    });
  };

  const resetForm = () => {
    setFormData({
      id: null, customerId: '', orderNumber: `SO-${String(orders.length + 1).padStart(5, '0')}`,
      referenceNumber: '', date: new Date().toISOString().split('T')[0], expectedShipmentDate: '',
      paymentTerms: 'Due on Receipt', deliveryMethod: '', salesperson: '', customerNotes: '',
      termsConditions: '', items: [{ id: Date.now(), itemId: '', detail: '', quantity: 1, rate: 0, amount: 0 }],
      subTotal: 0, discount: 0, tax: 0, adjustment: 0, totalAmount: 0, status: 'Draft'
    });
  };

  const handleSave = async (status = 'Draft') => {
    if (!formData.customerId) {
      setStatus({ type: 'error', message: 'Please select a customer.' });
      return;
    }
    setSaving(true);
    try {
      const sanitizedPayload = { 
        ...formData, 
        companyId, 
        status,
        date: formData.date || null,
        expectedShipmentDate: formData.expectedShipmentDate || null
      };
      if (formData.id) {
        await salesAPI.updateOrder(formData.id, sanitizedPayload);
        addNotification('Sales Order updated successfully', 'success');
      } else {
        await salesAPI.createOrder(sanitizedPayload);
        addNotification('Sales Order created successfully', 'success');
      }
      setTimeout(() => {
        setView('list');
        fetchData();
      }, 1500);
    } catch (err) {
      addNotification(err.response?.data?.error || 'Failed to save order.', 'error');
    }
    setSaving(false);
  };

  const handleDelete = (id) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteOrder = async () => {
    if (!deleteId) return;
    try {
      await salesAPI.deleteOrder(deleteId);
      addNotification('Sales order deleted successfully', 'success');
      fetchData();
    } catch (err) {
      addNotification('Failed to delete sales order', 'error');
    } finally {
      setIsDeleteModalOpen(false);
      setDeleteId(null);
    }
  };

  const openEdit = (order) => {
    setFormData({
      ...order,
      customerId: order.LedgerId,
      items: order.Items?.map(i => ({ ...i, id: i.id })) || [{ id: Date.now(), itemId: '', detail: '', quantity: 1, rate: 0, amount: 0 }]
    });
    setView('form');
  };

  const filteredOrders = Array.isArray(orders) ? orders.filter(o => {
    if (!o) return false;
    const numMatch = o.orderNumber?.toLowerCase()?.includes(searchQuery.toLowerCase());
    const custMatch = o.Customer?.name?.toLowerCase()?.includes(searchQuery.toLowerCase());
    return numMatch || custMatch;
  }) : [];

  // --- Views ---
  const renderListView = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-8">
        <div className="relative w-96 group">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search Sales Orders..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-[13px] font-medium outline-none ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
          />
        </div>
        <div className="flex items-center gap-3">
          <button className="h-10 px-4 flex items-center gap-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-[13px] font-bold hover:bg-gray-50 transition-all shadow-sm">
            <Download size={16} /> Export
          </button>
          <button 
            onClick={() => { resetForm(); setView('form'); }}
            className="h-10 px-6 flex items-center gap-2 bg-blue-600 text-white rounded-lg text-[13px] font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
          >
            <Plus size={18} strokeWidth={3} /> NEW SALES ORDER
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="p-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-8">Order #</th>
              <th className="p-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Date</th>
              <th className="p-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Customer</th>
              <th className="p-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
              <th className="p-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-right pr-8">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredOrders.length === 0 ? (
              <tr><td colSpan="5" className="py-24 text-center text-gray-400 italic font-medium">No sales orders found matching your search.</td></tr>
            ) : (
              filteredOrders.map(order => {
                if (!order) return null;
                return (
                  <tr 
                    key={order.id} 
                    onClick={() => openEdit(order)}
                    className="hover:bg-blue-50/30 transition-colors cursor-pointer group"
                  >
                    <td className="p-5 text-[13px] font-bold text-blue-600 pl-8">{order.orderNumber || 'N/A'}</td>
                    <td className="p-5 text-[13px] text-gray-600 font-medium">
                      {order.date ? new Date(order.date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="p-5 text-[13px] text-gray-900 font-bold">{order.Customer?.name || 'Unknown'}</td>
                    <td className="p-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm
                        ${order.status === 'Draft' ? 'bg-gray-100 text-gray-600' : 
                          order.status === 'Sent' ? 'bg-blue-100 text-blue-600' : 
                          'bg-emerald-100 text-emerald-600'}`}>
                        {order.status || 'Draft'}
                      </span>
                    </td>
                    <td className="p-5 text-right text-[13px] font-black text-gray-900 pr-8">
                      <div className="flex items-center justify-end gap-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all mr-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); openEdit(order); }}
                            className="p-1.5 hover:bg-white rounded border border-transparent hover:border-gray-200 text-gray-400 hover:text-blue-600 transition-all shadow-sm"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              handleDelete(order.id);
                            }}
                            className="p-1.5 hover:bg-white rounded border border-transparent hover:border-gray-200 text-gray-400 hover:text-rose-500 transition-all shadow-sm"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        ₹{(parseFloat(order.totalAmount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
  );

  const renderFormView = () => (
    <div className="animate-in fade-in slide-in-from-right-8 duration-500 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button onClick={() => setView('list')} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-900">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              {formData.id ? 'Edit Sales Order' : 'New Sales Order'}
              <span className="text-blue-600 bg-blue-50 px-3 py-1 rounded-lg text-xs font-bold ring-1 ring-blue-100">
                {formData.orderNumber || 'Draft'}
              </span>
            </h2>
            <p className="text-xs text-gray-400 font-medium mt-0.5">Create and send professional sales orders to your customers.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Settings size={20} className="text-gray-300 cursor-pointer hover:text-gray-600 transition-colors" />
          <div className="h-6 w-[1px] bg-gray-200 mx-2" />
          <button onClick={() => setView('list')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={24} className="text-gray-400" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column: Core Details */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                placeholder="Select or add a customer"
              />
              <FormInput label="Sales Order #" required={true} value={formData.orderNumber} onChange={val => setFormData(p => ({ ...p, orderNumber: val }))} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput label="Reference #" value={formData.referenceNumber} onChange={val => setFormData(p => ({ ...p, referenceNumber: val }))} placeholder="e.g. PO-12345" />
              <FormInput label="Sales Order Date" type="date" required={true} value={formData.date} onChange={val => setFormData(p => ({ ...p, date: val }))} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-dashed border-gray-100">
              <FormInput label="Expected Shipment Date" type="date" value={formData.expectedShipmentDate} onChange={val => setFormData(p => ({ ...p, expectedShipmentDate: val }))} />
              <FormSelect label="Payment Terms" value={formData.paymentTerms} onChange={val => setFormData(p => ({ ...p, paymentTerms: val }))} options={["Due on Receipt", "Net 15", "Net 30", "Net 60"]} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormSelect label="Delivery Method" value={formData.deliveryMethod} onChange={val => setFormData(p => ({ ...p, deliveryMethod: val }))} options={["UPS", "FedEx", "DHL", "Local Courier", "Self Collect"]} />
              <FormSelect 
                label="Salesperson" 
                value={formData.salesperson} 
                onChange={val => {
                  if (val === 'ADD_NEW') {
                    navigate('/customers/new');
                  } else {
                    setFormData(p => ({ ...p, salesperson: val }));
                  }
                }} 
                options={[
                  { id: 'ADD_NEW', name: '+ Add New Salesperson' },
                  "Arshad Ibrahim", "John Doe", "Jane Smith"
                ]} 
              />
            </div>
          </div>

          {/* ITEM TABLE */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center px-8">
              <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Item Table</h3>
              <button className="text-[11px] text-blue-600 font-bold hover:underline flex items-center gap-1">
                <Columns size={12} /> Bulk Actions
              </button>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="py-3 px-8 text-left text-[10px] font-bold text-gray-400 uppercase tracking-tighter w-1/2">Item Details</th>
                  <th className="py-3 px-4 text-center text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Quantity</th>
                  <th className="py-3 px-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Rate</th>
                  <th className="py-3 px-8 text-right text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Amount</th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {formData.items.map((item, idx) => (
                  <tr key={item.id} className="group hover:bg-gray-50/30 transition-colors">
                    <td className="py-4 px-8">
                      <select 
                        value={item.itemId}
                        onChange={e => handleItemUpdate(item.id, 'itemId', e.target.value)}
                        className="w-full text-[13px] font-bold text-gray-800 bg-transparent outline-none border-b border-transparent focus:border-blue-300 pb-1"
                      >
                        <option value="">Type or click to select an Item.</option>
                        {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                      </select>
                      <input 
                        type="text" 
                        placeholder="Add description..." 
                        value={item.detail}
                        onChange={e => handleItemUpdate(item.id, 'detail', e.target.value)}
                        className="w-full text-[11px] text-gray-400 bg-transparent outline-none mt-1"
                      />
                    </td>
                    <td className="py-4 px-4 align-top">
                      <input 
                        type="number" 
                        value={item.quantity}
                        onChange={e => handleItemUpdate(item.id, 'quantity', parseFloat(e.target.value))}
                        className="w-16 mx-auto text-center text-[13px] font-medium py-1 border border-transparent group-hover:border-gray-200 rounded outline-none focus:border-blue-400"
                      />
                    </td>
                    <td className="py-4 px-4 align-top text-right">
                      <input 
                        type="number" 
                        value={item.rate}
                        onChange={e => handleItemUpdate(item.id, 'rate', parseFloat(e.target.value))}
                        className="w-24 text-right text-[13px] font-medium py-1 border border-transparent group-hover:border-gray-200 rounded outline-none focus:border-blue-400"
                      />
                    </td>
                    <td className="py-4 px-8 align-top text-right text-[13px] font-black text-gray-900">
                      ₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-4 align-top">
                      <button 
                        onClick={() => handleRemoveField(item.id)}
                        className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-6 px-8 border-t border-gray-50 flex items-center gap-4">
              <button 
                onClick={handleAddField}
                className="flex items-center gap-1.5 text-blue-600 font-bold text-[13px] hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all"
              >
                <Plus size={16} strokeWidth={3} /> Add New Row
              </button>
              <button className="text-[13px] text-gray-500 font-medium hover:text-gray-800 px-3 py-1.5 hover:bg-gray-100 rounded-lg transition-all">
                Add Items in Bulk
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Totals & Summary */}
        <div className="space-y-8">
          <div className="bg-[#f8fafc] p-8 rounded-2xl border border-blue-100 shadow-sm space-y-6 sticky top-24">
            <div className="space-y-4 border-b border-blue-100 pb-6">
              <div className="flex justify-between text-[13px] text-gray-500 font-medium tracking-tight">
                <span>Sub Total</span>
                <span className="font-bold text-gray-800">₹{formData.subTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-[13px] text-gray-500">
                <span>Discount (%)</span>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    value={formData.discount}
                    onChange={e => setFormData(p => ({ ...p, discount: parseFloat(e.target.value) }))}
                    className="w-16 h-8 text-right px-2 border border-blue-200 rounded bg-white font-bold outline-none focus:border-blue-500" 
                  />
                </div>
              </div>
              <div className="flex justify-between items-center text-[13px] text-gray-500">
                <div className="flex items-center gap-4">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Apply GST</span>
                </div>
                <select 
                  className="h-8 border border-blue-200 rounded px-2 text-[12px] font-bold bg-white text-gray-700 outline-none"
                  onChange={e => {
                    const rate = parseFloat(e.target.value.replace('GST ', '').replace('%', '')) / 100 || 0;
                    setFormData(p => ({ ...p, tax: p.subTotal * rate }));
                  }}
                >
                  <option value="0">Select GST Rate</option>
                  <option>GST 5%</option>
                  <option>GST 12%</option>
                  <option>GST 18%</option>
                  <option>GST 28%</option>
                </select>
              </div>
              <div className="flex justify-between items-center text-[13px] text-gray-500 pt-2">
                <div className="flex items-center gap-1">
                  <span>Adjustment</span> <HelpCircle size={12} className="text-gray-300" />
                </div>
                <input 
                  type="number" 
                  value={formData.adjustment}
                  onChange={e => setFormData(p => ({ ...p, adjustment: e.target.value }))}
                  className="w-24 h-8 text-right px-2 border border-blue-200 rounded bg-white font-bold outline-none focus:border-blue-500" 
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-lg font-black text-gray-900 uppercase tracking-wider">Total ( ₹ )</span>
              <span className="text-2xl font-black text-blue-600">₹{formData.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>

            <div className="pt-6 space-y-4">
              <button 
                onClick={() => handleSave('Draft')}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-blue-200 text-blue-600 font-black text-sm rounded-xl hover:bg-blue-50 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} SAVE AS DRAFT
              </button>
              <button 
                onClick={() => handleSave('Sent')}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white font-black text-sm rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />} SAVE AND SEND
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-6">
          <div>
            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Customer Notes</label>
            <textarea 
              value={formData.customerNotes}
              onChange={e => setFormData(p => ({ ...p, customerNotes: e.target.value }))}
              placeholder="Enter any notes to be displayed in your transaction..."
              className="w-full h-24 border border-gray-200 rounded-xl p-4 text-[13px] outline-none focus:border-blue-500 font-sans"
            />
          </div>
          <div>
            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Terms & Conditions</label>
            <textarea 
              value={formData.termsConditions}
              onChange={e => setFormData(p => ({ ...p, termsConditions: e.target.value }))}
              placeholder="Enter the terms and conditions of your business..."
              className="w-full h-24 border border-gray-200 rounded-xl p-4 text-[13px] outline-none focus:border-blue-500 font-sans"
            />
          </div>
        </div>
        <div>
          <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Attach File(s)</label>
          <div className="border-2 border-dashed border-gray-100 rounded-2xl p-8 flex flex-col items-center justify-center text-center group cursor-pointer hover:bg-gray-50/50 transition-all hover:border-blue-100">
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4 text-blue-600 group-hover:scale-110 transition-transform">
              <Upload size={24} />
            </div>
            <p className="text-[13px] font-bold text-gray-700">Upload File</p>
            <p className="text-[11px] text-gray-400 mt-1">Accepts images, PDFs up to 5MB.</p>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400 font-sans">
      <Loader2 size={40} className="animate-spin text-blue-600 mb-4" />
      <span className="text-sm font-medium tracking-widest uppercase">Initializing Sales Module...</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fcfcfd] p-6 lg:p-10 font-sans text-gray-900">
      {view === 'list' ? renderListView() : renderFormView()}

      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteOrder}
        title="Delete Sales Order"
        message="Are you sure you want to delete this sales order? This action cannot be undone."
      />
    </div>
  );
};

// Helper Icon for Upload (not used in mock but for clarity)
const Upload = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

export default SalesOrdersView;
