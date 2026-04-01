import React, { useState, useEffect } from 'react';
import {
  Users, Plus, Check, X, AlertCircle, Loader2, RefreshCcw, DollarSign
} from 'lucide-react';
import { ledgerAPI, voucherAPI } from '../../services/api';

const fmt = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function PayrollView() {
  const companyId = localStorage.getItem('companyId');
  const [ledgers, setLedgers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [payrollHistory, setPayrollHistory] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const now = new Date();
  const [form, setForm] = useState({
    employeeLedgerId: '',
    paymentLedgerId: '',
    amount: '',
    month: MONTHS[now.getMonth()],
    year: now.getFullYear(),
    narration: '',
  });

  useEffect(() => {
    ledgerAPI.getByCompany(companyId).then(r => setLedgers(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    voucherAPI.getByCompany(companyId).then(r => {
      const all = Array.isArray(r.data) ? r.data : [];
      setPayrollHistory(all.filter(v => v.narration?.toLowerCase().includes('salary')));
    }).catch(() => {});
  }, []);

  const handlePost = async () => {
    if (!form.employeeLedgerId || !form.paymentLedgerId || !form.amount) {
      setError('Employee ledger, payment ledger, and amount are required.'); return;
    }
    setSaving(true); setError(''); setSuccess('');
    const narration = form.narration || `Salary for ${form.month} ${form.year}`;
    try {
      await voucherAPI.create({
        companyId,
        voucherType: 'Payment',
        date: new Date().toISOString(),
        narration,
        entries: [
          { ledgerId: form.employeeLedgerId, debit: parseFloat(form.amount), credit: 0 },
          { ledgerId: form.paymentLedgerId, debit: 0, credit: parseFloat(form.amount) },
        ]
      });
      setSuccess(`Salary voucher for ${narration} posted successfully!`);
      setShowModal(false);
      setForm(f => ({ ...f, amount: '', narration: '', employeeLedgerId: '', paymentLedgerId: '' }));
      // Refresh history
      voucherAPI.getByCompany(companyId).then(r => {
        const all = Array.isArray(r.data) ? r.data : [];
        setPayrollHistory(all.filter(v => v.narration?.toLowerCase().includes('salary')));
      }).catch(() => {});
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to post salary voucher');
    }
    setSaving(false);
  };

  const totalPaid = payrollHistory.reduce((s, v) => {
    const debit = (v.Transactions || []).reduce((a, t) => a + parseFloat(t.debit || 0), 0);
    return s + debit;
  }, 0);

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-end border-b border-slate-100 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center text-white">
              <Users size={18} />
            </div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">HR & Payroll</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Payroll Management</h1>
        </div>
        <button onClick={() => { setShowModal(true); setError(''); setSuccess(''); }}
          className="bg-violet-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-violet-700 transition-all">
          <Plus size={16} /> Post Salary
        </button>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex gap-3 text-sm text-emerald-700 font-bold">
          <Check size={16} className="shrink-0 mt-0.5" /> {success}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-violet-50 rounded-[2rem] border border-violet-100 p-7 flex justify-between items-center">
          <div>
            <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest mb-1">Total Payroll Paid</p>
            <h3 className="text-2xl font-black text-violet-700 tracking-tighter">{fmt(totalPaid)}</h3>
          </div>
          <div className="w-12 h-12 bg-violet-600 rounded-xl flex items-center justify-center text-white">
            <DollarSign size={22} />
          </div>
        </div>
        <div className="bg-white rounded-[2rem] border border-slate-100 p-7 flex justify-between items-center shadow-sm">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Payment Vouchers</p>
            <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{payrollHistory.length}</h3>
          </div>
        </div>
        <div className="bg-white rounded-[2rem] border border-slate-100 p-7 flex justify-between items-center shadow-sm">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">This Month</p>
            <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{MONTHS[now.getMonth()]} {now.getFullYear()}</h3>
          </div>
        </div>
      </div>

      {/* History */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
        <div className="h-14 px-8 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment History</span>
        </div>
        <table className="w-full text-left">
          <thead className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 border-b border-slate-50 bg-[#fcfdfe]">
            <tr>
              <th className="px-8 py-4">Voucher No.</th>
              <th className="px-8 py-4">Date</th>
              <th className="px-8 py-4">Narration</th>
              <th className="px-8 py-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-[13px] font-semibold text-slate-700">
            {payrollHistory.length === 0 ? (
              <tr><td colSpan={4} className="py-16 text-center text-slate-300 font-bold">No salary payments found. Use "Post Salary" to add.</td></tr>
            ) : payrollHistory.slice(0, 20).map(v => {
              const amount = (v.Transactions || []).reduce((a, t) => a + parseFloat(t.debit || 0), 0);
              return (
                <tr key={v.id} className="hover:bg-violet-50/20 transition-all">
                  <td className="px-8 py-4 font-black text-violet-600">{v.voucherNumber || '—'}</td>
                  <td className="px-8 py-4">{v.date ? new Date(v.date).toLocaleDateString('en-IN') : '—'}</td>
                  <td className="px-8 py-4 text-slate-500">{v.narration || '—'}</td>
                  <td className="px-8 py-4 text-right font-black">{fmt(amount)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-black text-slate-900">Post Salary Voucher</h2>
                <p className="text-xs text-slate-400 font-bold mt-0.5">Creates a Payment voucher with double-entry</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100"><X size={18} /></button>
            </div>
            <div className="p-8 space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex gap-3 text-sm text-red-600 font-bold">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" /> {error}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Month</label>
                  <select value={form.month} onChange={e => setForm(f => ({ ...f, month: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-violet-400 transition-all appearance-none">
                    {MONTHS.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Year</label>
                  <input type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-violet-400 transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Employee / Salary Expense Ledger *</label>
                <select value={form.employeeLedgerId} onChange={e => setForm(f => ({ ...f, employeeLedgerId: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-violet-400 transition-all appearance-none">
                  <option value="">— Select Ledger (Expense/Employee) —</option>
                  {ledgers.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Paid From (Bank / Cash Ledger) *</label>
                <select value={form.paymentLedgerId} onChange={e => setForm(f => ({ ...f, paymentLedgerId: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-violet-400 transition-all appearance-none">
                  <option value="">— Select Bank/Cash Ledger —</option>
                  {ledgers.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Salary Amount (₹) *</label>
                <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="0.00"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-violet-400 transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Narration (optional)</label>
                <input value={form.narration} onChange={e => setForm(f => ({ ...f, narration: e.target.value }))}
                  placeholder={`Salary for ${form.month} ${form.year}`}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-violet-400 transition-all" />
              </div>
            </div>
            <div className="px-8 py-5 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-black text-slate-500 hover:bg-slate-50 transition-all">Cancel</button>
              <button onClick={handlePost} disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-black hover:bg-violet-700 transition-all flex items-center gap-2 disabled:opacity-50">
                {saving ? <><Loader2 size={14} className="animate-spin" /> Posting…</> : <><Check size={14} /> Post Salary</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
