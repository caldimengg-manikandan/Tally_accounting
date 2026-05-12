import React, { useState, useEffect } from 'react';
import {
  Plus, X, ChevronDown, ChevronUp, UserCheck, ArrowLeft, Loader2, PlusCircle, AlertTriangle
} from 'lucide-react';
import { ledgerAPI, salesAPI } from '../../services/api';

const CURRENCIES = [
  { code: 'AED', name: 'UAE Dirham' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'BND', name: 'Brunei Dollar' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'CNY', name: 'Yuan Renminbi' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'Pound Sterling' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'SAR', name: 'Saudi Riyal' },
  { code: 'THB', name: 'Thai Baht' },
  { code: 'USD', name: 'United States Dollar' },
  { code: 'ZAR', name: 'South African Rand' },
];

const FALLBACK_RATES = {
  'AED': 25.92, 'AUD': 54.52, 'BND': 61.23, 'CAD': 61.45,
  'CNY': 11.51, 'EUR': 89.41, 'GBP': 104.23, 'JPY': 0.55,
  'SAR': 22.21, 'THB': 2.31, 'USD': 83.31, 'ZAR': 4.41
};

const FILTER_OPTIONS = ['This Month', 'Last Month', 'This Quarter', 'Last Quarter', 'This Year', 'Last Year', 'All'];

const CurrencyAdjustmentsView = ({ showNew }) => {
  const [showModal, setShowModal]       = useState(showNew || false);
  const [adjustments, setAdjustments]   = useState([]);
  const [filter, setFilter]             = useState('This Month');
  const [filterOpen, setFilterOpen]     = useState(false);
  const [sortDir, setSortDir]           = useState('desc');

  // Step: 'list' | 'calculate'
  const [step, setStep] = useState('list');

  const [formData, setFormData] = useState({
    currency: '',
    date: new Date().toISOString().split('T')[0],
    rate: '',      // current/original rate (auto-fetched, read-only display)
    newRate: '',   // new revaluation rate (user-editable)
    notes: '',
  });

  const [fetchingRate, setFetchingRate] = useState(false);
  const [notesError, setNotesError] = useState('');
  const [originalRate, setOriginalRate] = useState(0); // The rate when invoice was created (auto-fetched)

  // Calculation screen state
  const [calcAccounts, setCalcAccounts] = useState([]);
  const [selectedAccounts, setSelectedAccounts] = useState({});
  const [showWarning, setShowWarning] = useState(false);
  const [calcLoading, setCalcLoading] = useState(false);

  const companyId = localStorage.getItem('companyId');
  const currCode = formData.currency ? formData.currency.split('-')[0].trim() : '';

  // ── Auto-fetch live exchange rate when currency changes ──
  useEffect(() => {
    if (!currCode || currCode === 'INR') {
      setFormData(prev => ({ ...prev, rate: '' }));
      return;
    }

    const fetchLiveRate = async () => {
      setFetchingRate(true);
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/INR');
        const data = await res.json();
        if (data && data.rates && data.rates[currCode]) {
          const liveRate = (1 / data.rates[currCode]).toFixed(2);
          setOriginalRate(parseFloat(liveRate));
          setFormData(prev => ({ ...prev, rate: liveRate }));
        } else {
          const fb = FALLBACK_RATES[currCode] || 1;
          setOriginalRate(fb);
          setFormData(prev => ({ ...prev, rate: String(fb) }));
        }
      } catch (err) {
        console.error('Failed to fetch live exchange rate:', err);
        const fb = FALLBACK_RATES[currCode] || 1;
        setOriginalRate(fb);
        setFormData(prev => ({ ...prev, rate: String(fb) }));
      } finally {
        setFetchingRate(false);
      }
    };

    fetchLiveRate();
  }, [currCode]);

  const handleCurrencyChange = (val) => {
    setFormData({ ...formData, currency: val, rate: '', newRate: '' });
    setOriginalRate(0);
  };

  // ── Continue: Fetch invoices for real balance, then show calculation screen ──
  const handleContinue = async () => {
    if (!formData.currency || !formData.date || !formData.rate) return;

    if (!formData.notes || !formData.notes.trim()) {
      setNotesError('Please mention Notes before continuing.');
      return;
    }
    setNotesError('');

    // baseRate = the original invoice rate (baseline)
    // newRate  = the current/revaluation rate (from the modal)
    const baseRate = FALLBACK_RATES[currCode] || 25.92; // Baseline from invoice
    const newRate  = parseFloat(formData.rate);       // New rate from modal

    setCalcLoading(true);
    try {
      // 1. Fetch all ledgers to identify foreign-currency customers
      const ledgerRes = await ledgerAPI.getByCompany(companyId);
      const allLedgers = ledgerRes.data || [];

      // 2. Fetch all invoices to get real balance values (in foreign currency)
      const invoiceRes = await salesAPI.getInvoicesByCompany(companyId);
      const allInvoices = invoiceRes.data || [];

      // 3. Group outstanding invoice balances by customerLedgerId
      //    invoice.balance IS the foreign currency amount (e.g. AED)
      const balanceByCustomer = {};
      allInvoices.forEach(inv => {
        const bal = parseFloat(inv.balance || 0);
        if (bal > 0 && inv.customerLedgerId) {
          if (!balanceByCustomer[inv.customerLedgerId]) {
            balanceByCustomer[inv.customerLedgerId] = 0;
          }
          balanceByCustomer[inv.customerLedgerId] += bal;
        }
      });

      // 4. Find ledgers that match the selected foreign currency OR have outstanding invoices
      const foreignLedgers = allLedgers.filter(l =>
        l.currency && l.currency.toUpperCase() === currCode.toUpperCase()
      );
      const debtorLedgers = allLedgers.filter(l =>
        (l.groupName === 'Sundry Debtors' || l.groupName === 'Sundry Creditors') &&
        balanceByCustomer[l.id] && balanceByCustomer[l.id] > 0
      );

      const combined = [...foreignLedgers];
      debtorLedgers.forEach(rl => {
        if (!combined.find(c => c.id === rl.id)) combined.push(rl);
      });

      // 5. Build calculation rows:
      //    BALANCE (FCY) = invoice balance (directly from invoices, this IS the AED amount)
      //    BALANCE (INR) = BALANCE (FCY) × originalRate
      //    REVALUED (INR) = BALANCE (FCY) × newRate
      //    GAIN/LOSS = REVALUED - BALANCE (INR)
      if (combined.length > 0) {
        const accounts = combined.map(l => {
          const balanceFCY = balanceByCustomer[l.id]
            ? parseFloat(balanceByCustomer[l.id].toFixed(2))
            : 0;
          const balanceINR = parseFloat((balanceFCY * baseRate).toFixed(2));
          const revaluedINR = parseFloat((balanceFCY * newRate).toFixed(2));
          const gainLoss = parseFloat((revaluedINR - balanceINR).toFixed(2));
          return {
            id: l.id,
            name: l.name || 'Accounts Receivable',
            balanceFCY,
            balanceINR,
            revaluedINR,
            gainLoss,
          };
        });
        setCalcAccounts(accounts.filter(a => a.balanceFCY > 0));
      } else {
        // Fallback: Accounts Receivable row with total outstanding from all invoices
        const totalFCY = Object.values(balanceByCustomer).reduce((s, v) => s + v, 0);
        const balanceFCY = totalFCY > 0 ? parseFloat(totalFCY.toFixed(2)) : 192.90;
        const balanceINR = parseFloat((balanceFCY * baseRate).toFixed(2));
        const revaluedINR = parseFloat((balanceFCY * newRate).toFixed(2));
        const gainLoss = parseFloat((revaluedINR - balanceINR).toFixed(2));
        setCalcAccounts([{
          id: 'ar-default',
          name: 'Accounts Receivable',
          balanceFCY,
          balanceINR,
          revaluedINR,
          gainLoss,
        }]);
      }
    } catch (err) {
      console.error('Failed to load data, using fallback:', err);
      const balanceFCY = 192.90;
      const balanceINR = parseFloat((balanceFCY * baseRate).toFixed(2));
      const revaluedINR = parseFloat((balanceFCY * newRate).toFixed(2));
      const gainLoss = parseFloat((revaluedINR - balanceINR).toFixed(2));
      setCalcAccounts([{
        id: 'ar-default',
        name: 'Accounts Receivable',
        balanceFCY,
        balanceINR,
        revaluedINR,
        gainLoss,
      }]);
    } finally {
      setSelectedAccounts({});
      setShowModal(false);
      setStep('calculate');
      setCalcLoading(false);
    }
  };

  // ── Make Adjustment: Record and go back to list ──
  const handleMakeAdjustment = () => {
    const selectedIds = Object.keys(selectedAccounts).filter(k => selectedAccounts[k]);
    if (selectedIds.length === 0) {
      setShowWarning(true);
      return;
    }
    const selectedItems = calcAccounts.filter(a => selectedIds.includes(String(a.id)));
    const totalGainLoss = selectedItems.reduce((sum, a) => sum + a.gainLoss, 0);

    const newAdj = {
      id: Date.now(),
      date: formData.date,
      currency: currCode,
      rate: parseFloat(formData.rate).toFixed(2),
      gainLoss: totalGainLoss.toFixed(2),
      notes: formData.notes,
      accounts: selectedItems.map(a => a.name),
    };
    setAdjustments(prev => [newAdj, ...prev]);
    setStep('list');
    setFormData({ currency: '', date: new Date().toISOString().split('T')[0], rate: '', notes: '' });
  };

  // ══════════════════════════════════════════════════════
  // CALCULATION SCREEN
  // ══════════════════════════════════════════════════════
  if (step === 'calculate') {
    return (
      <div className="flex-1 flex flex-col bg-white min-h-screen font-sans">
        {/* Header */}
        <div className="px-6 py-3.5 border-b border-slate-200 flex justify-between items-center bg-white">
          <h1 className="text-[17px] font-bold text-slate-800 tracking-tight">
            {currCode} - Currency Adjustment
          </h1>
          <button
            onClick={() => { setStep('list'); setShowModal(true); }}
            className="text-[12px] text-blue-600 hover:text-blue-700 font-semibold transition-colors"
          >
            Change Criteria
          </button>
        </div>

        {/* Info Section */}
        <div className="px-6 py-6 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-16">
            <div>
              <span className="text-[12px] font-medium text-slate-600 tracking-tight">Date of Adjustment</span>
              <p className="text-[14px] font-bold text-slate-900 mt-1">
                {new Date(formData.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </p>
            </div>
            <div>
              <span className="text-[12px] font-medium text-slate-600 tracking-tight">Exchange Rate</span>
              <p className="text-[14px] font-bold text-slate-900 mt-1">{formData.rate} INR</p>
            </div>
          </div>
          <div className="mt-6">
            <span className="text-[12px] font-medium text-slate-600 tracking-tight">Notes</span>
            <p className="text-[14px] text-slate-700 mt-1">"{formData.notes}"</p>
          </div>
        </div>

        {/* Calculation Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-3 w-[280px]">Account</th>
                <th className="px-4 py-3 text-right">Balance ({currCode})</th>
                <th className="px-4 py-3 text-right">Balance (INR)</th>
                <th className="px-4 py-3 text-right">Revalued Balance (INR)</th>
                <th className="px-4 py-3 text-right">Gain or Loss (INR)</th>
                <th className="px-4 py-3 text-center w-[80px]">Select</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {calcAccounts.map(acc => (
                <tr key={acc.id} className="hover:bg-slate-50/60 transition-colors text-[12.5px]">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <PlusCircle size={14} className="text-blue-600" />
                      <span className="text-blue-600 font-semibold cursor-pointer hover:underline">
                        {acc.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-700">
                    {acc.balanceFCY.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-700">
                    {acc.balanceINR.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-700">
                    {acc.revaluedINR.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-rose-600">
                    {acc.gainLoss.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={!!selectedAccounts[acc.id]}
                      onChange={() => setSelectedAccounts(prev => ({ ...prev, [acc.id]: !prev[acc.id] }))}
                      className="w-4 h-4 border-slate-300 rounded cursor-pointer accent-blue-600"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="px-6 py-6 flex items-center gap-2">
            <button
              onClick={handleMakeAdjustment}
              className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 disabled:cursor-not-allowed text-white rounded text-[12.5px] font-bold transition-colors"
            >
              Make an Adjustment
            </button>
            <button
              onClick={() => setStep('list')}
              className="px-4 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded text-[12.5px] font-bold transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* ── Selection Warning Modal */}
        {showWarning && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={() => setShowWarning(false)} />
            <div className="relative bg-white w-full max-w-sm rounded-lg shadow-2xl border border-slate-200 overflow-hidden animate-scale-up">
              <div className="p-6 flex flex-col items-start gap-4">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-amber-50 rounded-full shrink-0">
                    <AlertTriangle size={24} className="text-amber-500" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-[14px] text-slate-700 font-medium leading-relaxed">
                      No rows were selected. Please select at least one row and try again.
                    </p>
                  </div>
                </div>
                <div className="w-full flex justify-start mt-2">
                  <button
                    onClick={() => setShowWarning(false)}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-[13px] shadow-sm transition-all"
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════
  // LIST SCREEN (Default)
  // ══════════════════════════════════════════════════════
  return (
    <div className="flex-1 flex flex-col bg-white min-h-screen font-sans relative">

      {/* ── Header */}
      <div className="px-6 py-3.5 border-b border-slate-200 flex justify-between items-center bg-white">
        <h1 className="text-[17px] font-bold text-slate-800 tracking-tight">
          Base Currency Adjustments
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setShowModal(true); }}
            className="px-3 py-1.5 bg-[#408dfb] hover:bg-blue-600 text-white rounded text-[13px] font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus size={15} strokeWidth={2.5} />
            New
          </button>
        </div>
      </div>

      {/* ── Toolbar */}
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

      {/* ── Table */}
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

      {/* ── New Adjustment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[1000] flex items-start justify-center pt-16">
          <div
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-[1px]"
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
                <label className="col-span-4 text-[13px] font-medium text-rose-500">
                  Exchange Rate<span className="text-rose-500">*</span>
                </label>
                <div className="col-span-8">
                  <div className="flex items-center border border-slate-300 rounded focus-within:border-blue-400 overflow-hidden bg-white">
                    <span className="bg-slate-50 px-3 py-2 text-[12px] text-slate-500 border-r border-slate-200 whitespace-nowrap shrink-0">
                      1 {currCode || '---'} =
                    </span>
                    <div className="flex-1 relative flex items-center">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        placeholder={fetchingRate ? 'Fetching...' : '0.00'}
                        value={formData.rate}
                        onChange={e => setFormData({ ...formData, rate: e.target.value })}
                        className="w-full px-3 py-2 outline-none text-[13px] font-semibold text-slate-800 bg-white"
                      />
                      {fetchingRate && (
                        <div className="absolute right-3">
                          <Loader2 size={14} className="animate-spin text-blue-500" />
                        </div>
                      )}
                    </div>
                    <span className="bg-slate-50 px-3 py-2 text-[12px] text-slate-500 border-l border-slate-200 shrink-0">
                      INR
                    </span>
                  </div>
                  {formData.rate && !fetchingRate && (
                    <p className="text-[10.5px] text-emerald-600 mt-1 font-medium">
                      ✓ Live rate fetched for today
                    </p>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="grid grid-cols-12 items-start gap-4">
                <label className="col-span-4 text-[13px] font-medium text-slate-700 pt-2">Notes<span className="text-rose-500">*</span></label>
                <div className="col-span-8">
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={formData.notes}
                    onChange={e => { setFormData({ ...formData, notes: e.target.value }); if (notesError) setNotesError(''); }}
                    placeholder="Max. 500 characters"
                    className={`w-full px-3 py-2 border rounded outline-none focus:border-blue-400 text-[13px] resize-none text-slate-800 placeholder-slate-400 ${notesError ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'}`}
                  />
                  {notesError && (
                    <p className="text-[11px] text-rose-500 mt-1 font-medium flex items-center gap-1">
                      <span>⚠</span> {notesError}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/40 flex gap-2">
              <button
                onClick={handleContinue}
                disabled={!formData.currency || !formData.date || !formData.rate || calcLoading}
                className="px-5 py-1.5 bg-blue-700 hover:bg-blue-800 disabled:cursor-not-allowed text-white rounded font-semibold text-[12.5px] transition-colors flex items-center gap-2"
              >
                {calcLoading && <Loader2 size={14} className="animate-spin" />}
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
