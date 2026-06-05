import React, { useState, useEffect } from 'react';
import {
  ShoppingCart, Plus, Trash2, RefreshCcw, Filter, Check,
  AlertCircle, ChevronDown, Loader2, X
} from 'lucide-react';
import { purchaseAPI, ledgerAPI } from '../../services/api';

const STATUS_COLORS = {
  Draft: 'bg-slate-100 text-slate-600',
  Sent: 'bg-blue-100 text-blue-700',
  Received: 'bg-emerald-100 text-emerald-700',
  Billed: 'bg-purple-100 text-purple-700',
  Cancelled: 'bg-red-100 text-red-600',
};

const fmt = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function PurchaseOrderView() {
  const companyId = sessionStorage.getItem('companyId');
  const [orders, setOrders] = useState([]);
  const [ledgers, setLedgers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [form, setForm] = useState({
    supplierLedgerId: '', date: new Date().toISOString().split('T')[0],
    orderNumber: `PO-${Date.now()}`, totalAmount: '', notes: '', status: 'Draft'
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await purchaseAPI.getByCompany(companyId);
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch { setOrders([]); }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
    ledgerAPI.getByCompany(companyId).then(r => setLedgers(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, []);

  const handleCreate = async () => {
    if (!form.supplierLedgerId || !form.totalAmount) {
      setError('Supplier and amount are required.'); return;
    }
    setSaving(true); setError('');
    try {
      await purchaseAPI.create({ ...form, companyId });
      setShowModal(false);
      setForm({ supplierLedgerId: '', date: new Date().toISOString().split('T')[0], orderNumber: `PO-${Date.now()}`, totalAmount: '', notes: '', status: 'Draft' });
      fetchOrders();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create order');
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this purchase order?')) return;
    try {
      await purchaseAPI.delete(id);
      fetchOrders();
    } catch {}
  };

  const handleStatusChange = async (id, status) => {
    try {
      await purchaseAPI.update(id, { status });
      fetchOrders();
    } catch {}
  };

  const filtered = filterStatus ? orders.filter(o => o.status === filterStatus) : orders;

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-end border-b border-slate-100 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white">
              <ShoppingCart size={18} />
            </div>
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-[0.2em]">Procurement</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tighter">Purchase Orders</h1>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchOrders} className="p-2.5 border border-slate-100 rounded-xl bg-white hover:bg-slate-50 text-slate-400 shadow-sm">
            <RefreshCcw size={16} />
          </button>
          <button onClick={() => { setShowModal(true); setError(''); }}
            className="bg-orange-500 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-orange-600 transition-all">
            <Plus size={16} /> New Order
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex gap-3 flex-wrap">
        {['', 'Draft', 'Sent', 'Received', 'Billed', 'Cancelled'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all
              ${filterStatus === s ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-100 hover:border-slate-200'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {['Draft', 'Sent', 'Received', 'Billed'].map(s => {
          const count = orders.filter(o => o.status === s).length;
          const total = orders.filter(o => o.status === s).reduce((a, o) => a + parseFloat(o.totalAmount || 0), 0);
          return (
            <div key={s} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{s}</p>
              <p className="text-xl font-bold text-slate-900">{count} orders</p>
              <p className="text-xs font-bold text-slate-400 mt-1">{fmt(total)}</p>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[#fcfdfe] text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 border-b border-slate-50">
            <tr>
              <th className="px-8 py-5">Order No.</th>
              <th className="px-8 py-5">Supplier</th>
              <th className="px-8 py-5">Date</th>
              <th className="px-8 py-5 text-right">Amount</th>
              <th className="px-8 py-5">Status</th>
              <th className="px-8 py-5">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-[13px] font-semibold text-slate-700">
            {loading ? (
              <tr><td colSpan={6} className="py-16 text-center"><div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto" /></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="py-16 text-center text-slate-300 font-bold">No purchase orders found</td></tr>
            ) : filtered.map(order => (
              <tr key={order.id} className="hover:bg-orange-50/20 transition-all">
                <td className="px-8 py-4 font-bold text-orange-600">{order.orderNumber}</td>
                <td className="px-8 py-4">{order.Ledger?.name || '—'}</td>
                <td className="px-8 py-4">{fmtDate(order.date)}</td>
                <td className="px-8 py-4 text-right font-bold">{fmt(order.totalAmount)}</td>
                <td className="px-8 py-4">
                  <select value={order.status}
                    onChange={e => handleStatusChange(order.id, e.target.value)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wide border-0 outline-none cursor-pointer ${STATUS_COLORS[order.status] || ''}`}>
                    {['Draft', 'Sent', 'Received', 'Billed', 'Cancelled'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
                <td className="px-8 py-4">
                  <button onClick={() => handleDelete(order.id)}
                    className="p-2 rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-500 transition-all">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tighter">New Purchase Order</h2>
                <p className="text-xs text-slate-400 font-bold mt-0.5">Fill in supplier & amount to create</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-all"><X size={18} /></button>
            </div>
            <div className="p-8 space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex gap-3 text-sm text-red-600 font-bold">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" /> {error}
                </div>
              )}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Order Number</label>
                <input value={form.orderNumber} onChange={e => setForm(f => ({ ...f, orderNumber: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-orange-400 transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Supplier Ledger *</label>
                <select value={form.supplierLedgerId} onChange={e => setForm(f => ({ ...f, supplierLedgerId: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-orange-400 transition-all appearance-none">
                  <option value="">— Select Supplier —</option>
                  {ledgers.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Date</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-orange-400 transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Total Amount (₹) *</label>
                  <input type="number" value={form.totalAmount} onChange={e => setForm(f => ({ ...f, totalAmount: e.target.value }))}
                    placeholder="0.00"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-orange-400 transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-orange-400 transition-all appearance-none">
                  {['Draft', 'Sent', 'Received', 'Billed', 'Cancelled'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3} placeholder="Optional purchase notes..."
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-orange-400 transition-all resize-none" />
              </div>
            </div>
            <div className="px-8 py-5 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all">Cancel</button>
              <button onClick={handleCreate} disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 transition-all flex items-center gap-2 disabled:opacity-50">
                {saving ? <><Loader2 size={14} className="animate-spin" /> Creating…</> : <><Check size={14} /> Create Order</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
