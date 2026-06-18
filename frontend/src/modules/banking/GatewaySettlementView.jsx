import React, { useState, useEffect } from 'react';
import { 
  Building2, ArrowLeft, RefreshCw, CheckCircle2, AlertTriangle, 
  Search, ShieldCheck, DollarSign, Calendar, CreditCard, ChevronRight,
  Calculator, CheckSquare, Square
} from 'lucide-react';
import { paymentAPI, ledgerAPI } from '../../services/api';
import useNotificationStore from '../../store/notificationStore';
import { useNavigate } from 'react-router-dom';

const GatewaySettlementView = ({ companyId }) => {
  const navigate = useNavigate();
  const { addNotification } = useNotificationStore();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedTxIds, setSelectedTxIds] = useState([]);
  
  // Form State
  const [bankLedgerId, setBankLedgerId] = useState('');
  const [gatewayFee, setGatewayFee] = useState('0');
  const [gatewayFeeGst, setGatewayFeeGst] = useState('0');
  const [reference, setReference] = useState('');
  const [settlementDate, setSettlementDate] = useState(new Date().toISOString().split('T')[0]);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (companyId) {
      fetchData();
    }
  }, [companyId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Bank Accounts for destination drop-down
      const ledgerRes = await ledgerAPI.getByCompany(companyId);
      const banks = (ledgerRes.data || []).filter(l => 
        ['Bank Accounts', 'Bank OCC A/c', 'Bank OD A/c'].includes(l.groupName)
      );
      setBankAccounts(banks);
      if (banks.length > 0) {
        setBankLedgerId(banks[0].id);
      }

      // Fetch Unsettled Transactions
      const txRes = await paymentAPI.getUnsettledTransactions();
      setTransactions(txRes.data || []);
      // Select all by default to make it easier
      setSelectedTxIds((txRes.data || []).map(t => t.id));
    } catch (err) {
      console.error(err);
      addNotification('Failed to load settlement data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSelectAll = () => {
    if (selectedTxIds.length === filteredTransactions.length) {
      setSelectedTxIds([]);
    } else {
      setSelectedTxIds(filteredTransactions.map(t => t.id));
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedTxIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Calculations
  const filteredTransactions = transactions.filter(t => 
    t.gatewayTransactionId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.SalesInvoice?.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const grossAmount = transactions
    .filter(t => selectedTxIds.includes(t.id))
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const parsedFee = parseFloat(gatewayFee) || 0;
  const parsedGst = parseFloat(gatewayFeeGst) || 0;
  const netAmount = Math.max(0, grossAmount - parsedFee - parsedGst);

  // Auto-fill standard fees (usually 2% fee and 18% GST on the fee)
  const handleAutoCalculateFees = () => {
    const estimatedFee = parseFloat((grossAmount * 0.02).toFixed(2));
    const estimatedGst = parseFloat((estimatedFee * 0.18).toFixed(2));
    setGatewayFee(estimatedFee.toString());
    setGatewayFeeGst(estimatedGst.toString());
    addNotification('Estimated standard charges applied (2% Fee + 18% GST on fee)', 'info');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!bankLedgerId) {
      addNotification('Please select a destination bank account.', 'warning');
      return;
    }
    if (selectedTxIds.length === 0) {
      addNotification('Please select at least one transaction to settle.', 'warning');
      return;
    }
    if (!reference.trim()) {
      addNotification('Please enter a Settlement Reference or UTR.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      await paymentAPI.recordSettlement({
        bankLedgerId,
        settlementAmount: netAmount,
        gatewayFee: parsedFee,
        gatewayFeeGst: parsedGst,
        transactionIds: selectedTxIds,
        reference: reference.trim(),
        date: settlementDate
      });
      addNotification('Settlement recorded and journal entry posted successfully.', 'success');
      navigate('/banking');
    } catch (err) {
      console.error(err);
      addNotification(err.response?.data?.error || 'Failed to post settlement.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
        <RefreshCw size={32} className="animate-spin text-blue-600 mb-2" />
        <span className="text-xs font-bold uppercase tracking-widest">Hydrating Transactions...</span>
      </div>
    );
  }

  return (
    <div className="bg-[#F9FAFB] min-h-screen font-sans">
      {/* ── HEADER ── */}
      <div className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-30 shadow-sm">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/banking')}
              className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <h1 className="text-[20px] font-bold text-slate-800 tracking-tight">Gateway Settlement & Reconciliation</h1>
            <ChevronRight size={18} className="text-slate-300 mt-1" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: List of Unsettled Transactions */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest">
                    Unsettled Webhook Payments
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Select the online transactions received in this settlement batch.</p>
                </div>
                <div className="relative w-full md:w-64">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search tx or invoice..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-blue-500 transition-all w-full"
                  />
                </div>
              </div>

              {filteredTransactions.length === 0 ? (
                <div className="p-12 text-center text-slate-400 italic text-sm">
                  No unsettled payments found.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="px-6 py-3 text-center w-12">
                          <button 
                            onClick={handleToggleSelectAll}
                            className="text-blue-600 hover:scale-105 transition-transform"
                          >
                            {selectedTxIds.length === filteredTransactions.length ? (
                              <CheckSquare size={16} />
                            ) : (
                              <Square size={16} className="text-slate-300" />
                            )}
                          </button>
                        </th>
                        <th className="px-6 py-3">Paid Date</th>
                        <th className="px-6 py-3">Invoice</th>
                        <th className="px-6 py-3">Gateway TX ID</th>
                        <th className="px-6 py-3 text-right">Gross Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredTransactions.map(t => {
                        const isSelected = selectedTxIds.includes(t.id);
                        return (
                          <tr 
                            key={t.id}
                            className={`hover:bg-slate-50/50 transition-colors ${isSelected ? 'bg-blue-50/20' : ''}`}
                          >
                            <td className="px-6 py-3.5 text-center">
                              <button 
                                onClick={() => handleToggleSelect(t.id)}
                                className="text-blue-600 hover:scale-105 transition-transform"
                              >
                                {isSelected ? (
                                  <CheckSquare size={16} />
                                ) : (
                                  <Square size={16} className="text-slate-300" />
                                )}
                              </button>
                            </td>
                            <td className="px-6 py-3.5 text-slate-600 font-medium whitespace-nowrap">
                              {t.paidAt ? new Date(t.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                            </td>
                            <td className="px-6 py-3.5 font-bold text-slate-800">
                              {t.SalesInvoice?.invoiceNumber || 'N/A'}
                            </td>
                            <td className="px-6 py-3.5 font-mono text-slate-500">
                              {t.gatewayTransactionId || 'N/A'}
                            </td>
                            <td className="px-6 py-3.5 text-right font-bold text-slate-900 font-mono">
                              {formatCurrency(t.amount)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Reconcile and Post Form */}
          <div className="space-y-6">
            <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl shadow-lg p-6 space-y-6">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-3">
                Post Settlement
              </h2>

              <div className="space-y-4">
                {/* Bank Account Selection */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Deposit to Bank Account
                  </label>
                  <select
                    value={bankLedgerId}
                    onChange={e => setBankLedgerId(e.target.value)}
                    className="w-full h-10 border border-slate-200 rounded-lg px-3 text-xs text-slate-800 outline-none focus:border-blue-500 bg-white"
                  >
                    {bankAccounts.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name} (Bal: {formatCurrency(b.currentBalance)})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Settlement Date */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Settlement Date
                  </label>
                  <div className="relative">
                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="date" 
                      value={settlementDate}
                      onChange={e => setSettlementDate(e.target.value)}
                      className="w-full h-10 pl-9 pr-3 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Reference/UTR */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    UTR / Settlement Ref #
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. UTR1293849102"
                    value={reference}
                    onChange={e => setReference(e.target.value)}
                    className="w-full h-10 border border-slate-200 rounded-lg px-3 text-xs text-slate-800 outline-none focus:border-blue-500 font-mono"
                    required
                  />
                </div>

                <hr className="border-slate-100 my-4" />

                {/* Amount details card */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">Gross Amount Selected:</span>
                    <span className="font-bold text-slate-900 font-mono">{formatCurrency(grossAmount)}</span>
                  </div>

                  {/* Gateway Fee Input */}
                  <div className="flex items-center justify-between gap-4">
                    <label className="text-xs text-slate-500 font-medium whitespace-nowrap">
                      Gateway Fee (Excl. Tax):
                    </label>
                    <div className="relative w-32 shrink-0">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">₹</span>
                      <input 
                        type="number"
                        step="0.01"
                        min="0"
                        value={gatewayFee}
                        onChange={e => setGatewayFee(e.target.value)}
                        className="w-full h-8 pl-6 pr-2 border border-slate-200 rounded-md text-xs text-slate-800 outline-none focus:border-blue-500 text-right font-mono"
                      />
                    </div>
                  </div>

                  {/* Gateway Fee GST Input */}
                  <div className="flex items-center justify-between gap-4">
                    <label className="text-xs text-slate-500 font-medium whitespace-nowrap">
                      GST on Gateway Fee:
                    </label>
                    <div className="relative w-32 shrink-0">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">₹</span>
                      <input 
                        type="number"
                        step="0.01"
                        min="0"
                        value={gatewayFeeGst}
                        onChange={e => setGatewayFeeGst(e.target.value)}
                        className="w-full h-8 pl-6 pr-2 border border-slate-200 rounded-md text-xs text-slate-800 outline-none focus:border-blue-500 text-right font-mono"
                      />
                    </div>
                  </div>

                  {/* Calculate fees helper */}
                  {grossAmount > 0 && (
                    <button 
                      type="button"
                      onClick={handleAutoCalculateFees}
                      className="w-full py-1.5 border border-dashed border-blue-200 bg-blue-50/20 hover:bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all mt-2"
                    >
                      <Calculator size={12} /> Auto-estimate Fees
                    </button>
                  )}
                </div>

                {/* Net amount display */}
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest">
                    Net Deposit to Bank
                  </span>
                  <h3 className="text-2xl font-black text-emerald-600 font-mono mt-1">
                    {formatCurrency(netAmount)}
                  </h3>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || selectedTxIds.length === 0}
                className="w-full py-3 bg-[#1e61f0] hover:bg-[#1a54d1] disabled:bg-slate-300 text-white rounded-xl text-[12px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 transition-all active:scale-98"
              >
                {submitting ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <DollarSign size={14} />
                )}
                Post Journal & Reconcile
              </button>
            </form>

            <div className="bg-slate-100/60 rounded-2xl p-5 border border-slate-200/50 space-y-3 text-xs text-slate-500 leading-relaxed">
              <h4 className="font-bold text-slate-700 flex items-center gap-1">
                <ShieldCheck size={14} className="text-emerald-500" /> Accounting Impact
              </h4>
              <p>
                Posting this reconciliation will automatically record a <strong>Journal Voucher</strong> with the following entries:
              </p>
              <ul className="list-disc pl-4 space-y-1.5 font-medium text-[11px]">
                <li><strong className="text-emerald-600">Debit</strong> selected Bank account with the <strong className="font-semibold">Net Deposit Amount</strong>.</li>
                <li><strong className="text-emerald-600">Debit</strong> 'Payment Gateway Charges' ledger with <strong className="font-semibold">Fees + GST</strong>.</li>
                <li><strong className="text-rose-600">Credit</strong> 'Payment Gateway Clearing Account' with <strong className="font-semibold">Gross Amount</strong>.</li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default GatewaySettlementView;
