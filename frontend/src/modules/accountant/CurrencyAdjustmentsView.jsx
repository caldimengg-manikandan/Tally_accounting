import React, { useState } from 'react';
import {
  Plus, X, ChevronDown, ChevronUp, UserCheck
} from 'lucide-react';

const CURRENCIES = [
  { code: 'AED', name: 'UAE Dirham',            rate: '22.714582' },
  { code: 'AUD', name: 'Australian Dollar',      rate: '54.521140' },
  { code: 'BND', name: 'Brunei Dollar',          rate: '61.234102' },
  { code: 'CAD', name: 'Canadian Dollar',        rate: '61.452391' },
  { code: 'CNY', name: 'Yuan Renminbi',          rate: '11.512341' },
  { code: 'EUR', name: 'Euro',                   rate: '89.412450' },
  { code: 'GBP', name: 'Pound Sterling',         rate: '104.234120' },
  { code: 'JPY', name: 'Japanese Yen',           rate: '0.551234' },
  { code: 'SAR', name: 'Saudi Riyal',            rate: '22.213451' },
  { code: 'THB', name: 'Thai Baht',              rate: '2.312451' },
  { code: 'USD', name: 'United States Dollar',   rate: '83.314251' },
  { code: 'ZAR', name: 'South African Rand',     rate: '4.412345' },
];

const FILTER_OPTIONS = ['This Month', 'Last Month', 'This Quarter', 'Last Quarter', 'This Year', 'Last Year', 'All'];

const CurrencyAdjustmentsView = ({ showNew }) => {
  const [showModal, setShowModal]       = useState(showNew || false);
  const [adjustments, setAdjustments]   = useState([]);
  const [filter, setFilter]             = useState('This Month');
  const [filterOpen, setFilterOpen]     = useState(false);
  const [sortDir, setSortDir]           = useState('desc'); // for DATE column

  const [formData, setFormData] = useState({
    currency: '',
    date: '',
    rate: '',
    notes: '',
  });

  const handleCurrencyChange = (val) => {
    setFormData({ ...formData, currency: val, rate: '' });
  };

  const handleContinue = () => {
    if (!formData.currency || !formData.date || !formData.rate) return;
    const newAdj = {
      id: Date.now(),
      date: formData.date,
      currency: formData.currency.split('-')[0].trim(),
      rate: parseFloat(formData.rate).toFixed(6),
      gainLoss: '0.00',
      notes: formData.notes,
    };
    setAdjustments(prev => [newAdj, ...prev]);
    setShowModal(false);
    setFormData({ currency: '', date: '', rate: '', notes: '' });
  };

  const currCode = formData.currency ? formData.currency.split('-')[0].trim() : '';

  return (
    <div className="flex-1 flex flex-col bg-white min-h-screen font-sans relative">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="px-6 py-3.5 border-b border-slate-200 flex justify-between items-center bg-white">
        <h1 className="text-[17px] font-bold text-slate-800 tracking-tight">
          Base Currency Adjustments
        </h1>
        <div className="flex items-center gap-3">
          <button className="text-[12px] text-blue-600 flex items-center gap-1.5 hover:text-blue-700 transition-colors">
            <UserCheck size={14} strokeWidth={1.8} />
            Find Accountants
          </button>
          <button
            onClick={() => { setShowModal(true); }}
            className="px-3 py-1.5 bg-[#408dfb] hover:bg-blue-600 text-white rounded text-[13px] font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus size={15} strokeWidth={2.5} />
            New
          </button>
        </div>
      </div>

      {/* ── Toolbar ────────────────────────────────────────── */}
      <div className="px-6 py-2.5 border-b border-slate-200 bg-white flex items-center">
        <div className="relative">
          <button
            onClick={() => setFilterOpen(o => !o)}
            className="flex items-center gap-1.5 px-2.5 py-1 border border-slate-300 rounded text-[11.5px] text-slate-600 bg-white hover:bg-slate-50 transition-colors"
          >
            <span className="text-slate-500">Filter By:</span>
            <span className="font-semibold text-slate-800">{filter}</span>
            <ChevronDown size={12} className={`text-slate-400 transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
          </button>
          {filterOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded shadow-lg z-50 min-w-[140px] py-1">
              {FILTER_OPTIONS.map(opt => (
                <button
                  key={opt}
                  onClick={() => { setFilter(opt); setFilterOpen(false); }}
                  className={`w-full text-left px-4 py-2 text-[12px] hover:bg-blue-50 hover:text-blue-600 transition-colors ${filter === opt ? 'font-semibold text-blue-600' : 'text-slate-700'}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Table ──────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-white text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              <th className="w-10 px-5 py-3">
                <input type="checkbox" className="w-3.5 h-3.5 border-slate-300 rounded-sm cursor-pointer" />
              </th>
              <th
                className="px-3 py-3 cursor-pointer select-none"
                onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
              >
                <span className="flex items-center gap-1">
                  DATE
                  {sortDir === 'asc'
                    ? <ChevronUp size={11} className="text-slate-400" />
                    : <ChevronDown size={11} className="text-slate-400" />}
                </span>
              </th>
              <th className="px-3 py-3">CURRENCY</th>
              <th className="px-3 py-3">EXCHANGE RATE</th>
              <th className="px-3 py-3">GAIN OR LOSS</th>
              <th className="px-3 py-3">NOTES</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {adjustments.length > 0 ? (
              adjustments.map(adj => (
                <tr key={adj.id} className="hover:bg-slate-50/60 transition-colors text-[12.5px] group">
                  <td className="px-5 py-3">
                    <input type="checkbox" className="w-3.5 h-3.5 border-slate-300 rounded-sm cursor-pointer" />
                  </td>
                  <td className="px-3 py-3 text-slate-600">
                    {new Date(adj.date).toLocaleDateString('en-GB')}
                  </td>
                  <td className="px-3 py-3 font-semibold text-slate-800">{adj.currency}</td>
                  <td className="px-3 py-3 text-slate-600">
                    1 {adj.currency} = {adj.rate} INR
                  </td>
                  <td className={`px-3 py-3 font-semibold ${parseFloat(adj.gainLoss) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {adj.gainLoss}
                  </td>
                  <td className="px-3 py-3 text-slate-500 max-w-[220px] truncate">{adj.notes}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-36 text-center">
                  <p className="text-[13px] text-slate-400">
                    Record a{' '}
                    <button
                      onClick={() => setShowModal(true)}
                      className="text-blue-500 hover:underline"
                    >
                      Base Currency Adjustment
                    </button>
                    {' '}to correct fluctuations in exchange rates
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── New Adjustment Modal ────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-[1000] flex items-start justify-center pt-16">
          <div
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-[1px]"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-white w-full max-w-lg rounded-lg shadow-2xl border border-slate-200 flex flex-col text-left overflow-hidden animate-scale-up">

            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-[15px] font-bold text-slate-800">Base Currency Adjustment</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-rose-500 transition-colors p-1 rounded-full hover:bg-rose-50"
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 space-y-5">

              {/* Currency */}
              <div className="grid grid-cols-12 items-center gap-4">
                <label className="col-span-4 text-[13px] font-medium text-slate-700">
                  Currency<span className="text-rose-500">*</span>
                </label>
                <div className="col-span-8 relative">
                  <select
                    value={formData.currency}
                    onChange={e => handleCurrencyChange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded outline-none focus:border-blue-400 text-[13px] appearance-none bg-white pr-8 text-slate-800"
                  >
                    <option value="">Select a currency</option>
                    {CURRENCIES.map(c => (
                      <option key={c.code} value={`${c.code}- ${c.name}`}>
                        {c.code} - {c.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Date of Adjustment */}
              <div className="grid grid-cols-12 items-center gap-4">
                <label className="col-span-4 text-[13px] font-medium text-slate-700">
                  Date of Adjustment<span className="text-rose-500">*</span>
                </label>
                <div className="col-span-8">
                  <input
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded outline-none focus:border-blue-400 text-[13px] text-slate-800"
                  />
                </div>
              </div>

              {/* Exchange Rate */}
              <div className="grid grid-cols-12 items-center gap-4">
                <label className="col-span-4 text-[13px] font-medium text-slate-700">
                  Exchange Rate<span className="text-rose-500">*</span>
                </label>
                <div className="col-span-8">
                  <div className="flex items-center border border-slate-300 rounded focus-within:border-blue-400 overflow-hidden bg-white">
                    <span className="bg-slate-50 px-3 py-2 text-[12px] text-slate-500 border-r border-slate-200 whitespace-nowrap shrink-0">
                      1 {currCode || '---'} =
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0.000000"
                      value={formData.rate}
                      onChange={e => setFormData({ ...formData, rate: e.target.value })}
                      className="flex-1 px-3 py-2 outline-none text-[13px] font-semibold text-slate-800 bg-white"
                    />
                    <span className="bg-slate-50 px-3 py-2 text-[12px] text-slate-500 border-l border-slate-200 shrink-0">
                      INR
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="grid grid-cols-12 items-start gap-4">
                <label className="col-span-4 text-[13px] font-medium text-slate-700 pt-2">Notes</label>
                <div className="col-span-8">
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Max. 500 characters"
                    className="w-full px-3 py-2 border border-slate-300 rounded outline-none focus:border-blue-400 text-[13px] resize-none text-slate-800 placeholder-slate-400"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/40 flex gap-2">
              <button
                onClick={handleContinue}
                disabled={!formData.currency || !formData.date || !formData.rate}
                className="px-5 py-1.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded font-semibold text-[12.5px] transition-colors"
              >
                Continue
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded font-semibold text-[12.5px] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrencyAdjustmentsView;
