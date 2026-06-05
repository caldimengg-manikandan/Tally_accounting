import React, { useState, useEffect } from 'react';
import { 
  Plus, X, ChevronDown, 
  Info, Target, Layout,
  Settings, Check, Search, Trash2, ArrowLeft, TrendingUp, AlertCircle, BarChart3, HelpCircle, RefreshCcw
} from 'lucide-react';
import { budgetAPI, ledgerAPI, groupAPI } from '../../services/api';

const fmt = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

export default function BudgetsView({ showNew }) {
  const companyId = sessionStorage.getItem('companyId');
  const [budgets, setBudgets] = useState([]);
  const [ledgers, setLedgers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [activeView, setActiveView] = useState('list'); // 'list', 'create', 'variance'
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [varianceData, setVarianceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    fiscalYear: '2026-2027',
    period: 'Monthly',
    items: [] // { ledgerId, groupId, name, type, targetAmount }
  });

  const [itemType, setItemType] = useState('Ledger'); // 'Ledger' or 'Group'
  const [selectedLedgerId, setSelectedLedgerId] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [targetAmount, setTargetAmount] = useState('');

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const res = await budgetAPI.getByCompany(companyId);
      setBudgets(res.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch budgets');
    }
    setLoading(false);
  };

  const fetchLedgers = async () => {
    try {
      const res = await ledgerAPI.getByCompany(companyId);
      setLedgers(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await groupAPI.getByCompany(companyId);
      setGroups(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (companyId) {
      fetchBudgets();
      fetchLedgers();
      fetchGroups();
    }
  }, [companyId]);

  const handleCreateBudget = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return alert('Budget name is required');
    if (formData.items.length === 0) return alert('Please add at least one budget item');

    try {
      setLoading(true);
      await budgetAPI.create({
        name: formData.name,
        fiscalYear: formData.fiscalYear,
        period: formData.period,
        items: formData.items.map(it => ({
          ledgerId: it.ledgerId || null,
          groupId: it.groupId || null,
          targetAmount: it.targetAmount
        })),
        companyId
      });
      alert('Budget created successfully');
      setFormData({
        name: '',
        fiscalYear: '2026-2027',
        period: 'Monthly',
        items: []
      });
      setActiveView('list');
      fetchBudgets();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to create budget');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBudget = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this budget?')) return;
    try {
      await budgetAPI.delete(id);
      fetchBudgets();
    } catch (err) {
      console.error(err);
      alert('Failed to delete budget');
    }
  };

  const handleViewVariance = async (budget) => {
    setLoading(true);
    setSelectedBudget(budget);
    setActiveView('variance');
    try {
      const res = await budgetAPI.getVariance(budget.id);
      setVarianceData(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load budget variance calculations.');
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    if (itemType === 'Ledger' && !selectedLedgerId) return alert('Please select a ledger');
    if (itemType === 'Group' && !selectedGroupId) return alert('Please select a group');
    if (!targetAmount || parseFloat(targetAmount) <= 0) return alert('Please enter a valid target amount');

    // Check duplicate
    const isDuplicate = itemType === 'Ledger' 
      ? formData.items.some(item => item.ledgerId === selectedLedgerId)
      : formData.items.some(item => item.groupId === selectedGroupId);

    if (isDuplicate) {
      return alert(`${itemType} is already added to this budget`);
    }

    if (itemType === 'Ledger') {
      const ledger = ledgers.find(l => l.id === selectedLedgerId);
      setFormData({
        ...formData,
        items: [...formData.items, {
          ledgerId: selectedLedgerId,
          groupId: null,
          name: ledger?.name || 'Unknown Ledger',
          type: 'Ledger',
          targetAmount: parseFloat(targetAmount)
        }]
      });
      setSelectedLedgerId('');
    } else {
      const group = groups.find(g => g.id === selectedGroupId);
      setFormData({
        ...formData,
        items: [...formData.items, {
          ledgerId: null,
          groupId: selectedGroupId,
          name: group?.name || 'Unknown Group',
          type: 'Group',
          targetAmount: parseFloat(targetAmount)
        }]
      });
      setSelectedGroupId('');
    }

    setTargetAmount('');
  };

  const removeItem = (itemToRemove) => {
    setFormData({
      ...formData,
      items: formData.items.filter(item => 
        item.ledgerId !== itemToRemove.ledgerId || item.groupId !== itemToRemove.groupId
      )
    });
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8 animate-fade-in font-sans">
      {/* View: List */}
      {activeView === 'list' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl flex items-center justify-center shadow-sm">
                  <Target size={18} />
                </div>
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-[0.2em]">Management Tools</span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Budget Control Registers</h1>
              <p className="text-slate-400 text-xs mt-1 font-medium">Establish spending limits and track variance against actual transactions</p>
            </div>
            <button 
              onClick={() => setActiveView('create')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-600/15 flex items-center gap-1.5 transition-all"
            >
              <Plus size={16} /> Create Budget
            </button>
          </div>

          {loading ? (
            <div className="py-20 flex justify-center">
              <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
          ) : budgets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-slate-100 shadow-xl space-y-6 max-w-3xl mx-auto p-10">
              <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <Target size={36} />
              </div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Stay on top of your financial metrics</h2>
              <p className="text-slate-500 text-xs leading-relaxed text-center px-10">
                Establish corporate budgeting structures, define spending limits for distinct accounts or groups, and view automated variance dashboards mapping real-time double-entry ledgers.
              </p>
              <button 
                onClick={() => setActiveView('create')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg transition-all"
              >
                Configure Your First Budget
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {budgets.map(b => (
                <div 
                  key={b.id} 
                  onClick={() => handleViewVariance(b)}
                  className="bg-white rounded-3xl p-6 border border-slate-100 shadow-lg hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between h-56 relative overflow-hidden"
                >
                  <div className="absolute right-4 top-4 text-slate-100 select-none group-hover:text-blue-50/50 transition-colors">
                    <Target size={72} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800 tracking-tight group-hover:text-blue-600 transition-colors">{b.name}</h3>
                    <div className="flex gap-2.5 mt-2">
                      <span className="bg-slate-50 text-slate-500 text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider">
                        FY: {b.fiscalYear}
                      </span>
                      <span className="bg-blue-50 text-blue-700 text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider">
                        {b.period}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-50">
                    <span className="text-[11px] font-bold text-blue-600 group-hover:underline flex items-center gap-1">
                      Variance Analysis &rarr;
                    </span>
                    <button 
                      onClick={(e) => handleDeleteBudget(b.id, e)}
                      className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all"
                      title="Delete Budget"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* View: Create */}
      {activeView === 'create' && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setActiveView('list')}
              className="p-2 bg-blue-600 text-white rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Create Accounting Budget</h1>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl max-w-4xl mx-auto">
            <form onSubmit={handleCreateBudget} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Budget Name *</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. FY26 Indirect Expenses Budget"
                    className="border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 transition-all bg-white"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fiscal Year *</label>
                  <select 
                    value={formData.fiscalYear}
                    onChange={e => setFormData({ ...formData, fiscalYear: e.target.value })}
                    className="border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 transition-all bg-white"
                  >
                    <option value="2025-2026">2025 - 2026 (Apr - Mar)</option>
                    <option value="2026-2027">2026 - 2027 (Apr - Mar)</option>
                    <option value="2027-2028">2027 - 2028 (Apr - Mar)</option>
                    <option value="2028-2029">2028 - 2029 (Apr - Mar)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filing Period *</label>
                  <select 
                    value={formData.period}
                    onChange={e => setFormData({ ...formData, period: e.target.value })}
                    className="border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 transition-all bg-white"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Half-yearly">Half-yearly</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                </div>
              </div>

              {/* Items / Selection */}
              <div className="border-t border-slate-100 pt-6 space-y-4">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Budget Account Allocations</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <div className="md:col-span-2 flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Budget Type</label>
                    <select 
                      value={itemType}
                      onChange={e => setItemType(e.target.value)}
                      className="border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all bg-white"
                    >
                      <option value="Ledger">Ledger Account</option>
                      <option value="Group">Account Group</option>
                    </select>
                  </div>

                  <div className="md:col-span-6 flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Select {itemType}
                    </label>
                    {itemType === 'Ledger' ? (
                      <select 
                        value={selectedLedgerId}
                        onChange={e => setSelectedLedgerId(e.target.value)}
                        className="border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all bg-white"
                      >
                        <option value="">-- Choose Account --</option>
                        {ledgers.map(l => (
                          <option key={l.id} value={l.id}>{l.name} ({l.groupName})</option>
                        ))}
                      </select>
                    ) : (
                      <select 
                        value={selectedGroupId}
                        onChange={e => setSelectedGroupId(e.target.value)}
                        className="border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all bg-white"
                      >
                        <option value="">-- Choose Group --</option>
                        {groups.map(g => (
                          <option key={g.id} value={g.id}>{g.name} ({g.nature})</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="md:col-span-2 flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Cap (₹)</label>
                    <input 
                      type="number" 
                      value={targetAmount}
                      onChange={e => setTargetAmount(e.target.value)}
                      placeholder="e.g. 1000"
                      className="border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all bg-white"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <button 
                      type="button" 
                      onClick={addItem}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-md transition-all flex items-center justify-center gap-1"
                    >
                      <Plus size={14} /> Add
                    </button>
                  </div>
                </div>

                {/* Selected items table */}
                <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white">
                  <table className="w-full text-left border-collapse">
                    <thead className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 border-b border-slate-100 bg-slate-50/50">
                      <tr>
                        <th className="px-6 py-3.5">Budget Item Name</th>
                        <th className="px-6 py-3.5">Type</th>
                        <th className="px-6 py-3.5 text-right">Target Budget (₹)</th>
                        <th className="px-6 py-3.5 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-[12px] font-bold text-slate-700">
                      {formData.items.length > 0 ? (
                        formData.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/40">
                            <td className="px-6 py-3.5">{item.name}</td>
                            <td className="px-6 py-3.5">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${item.type === 'Group' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                                {item.type}
                              </span>
                            </td>
                            <td className="px-6 py-3.5 text-right">{fmt(item.targetAmount)}</td>
                            <td className="px-6 py-3.5 text-center">
                              <button 
                                type="button" 
                                onClick={() => removeItem(item)}
                                className="text-slate-400 hover:text-red-500 transition-all p-1"
                              >
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="text-center py-8 text-slate-400 text-xs italic">
                            No accounts or groups budgeted. Choose configurations above to add.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setActiveView('list')}
                  className="px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 font-bold text-xs uppercase tracking-widest transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-blue-600/10 transition-all disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Establish Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View: Variance Report */}
      {activeView === 'variance' && (
        <div className="space-y-6">
          <div className="flex items-center gap-4 justify-between border-b border-slate-100 pb-6">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setActiveView('list')}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{selectedBudget?.name}</h1>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Variance Report &bull; {selectedBudget?.fiscalYear} &bull; {selectedBudget?.period}
                </p>
              </div>
            </div>
            <button 
              onClick={() => handleViewVariance(selectedBudget)}
              className="p-2.5 border border-slate-100 rounded-xl bg-white hover:bg-slate-50 text-slate-400 shadow-sm"
              title="Recalibrate Variance"
            >
              <RefreshCcw size={16} />
            </button>
          </div>

          {loading ? (
            <div className="py-20 flex justify-center">
              <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
          ) : varianceData ? (
            <div className="space-y-8">
              {/* Consolidated Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Budget Cap</p>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                    {fmt(varianceData.items?.reduce((s, i) => s + i.targetAmount, 0))}
                  </h3>
                </div>
                <div className="p-6 rounded-[2rem] bg-blue-50 border border-blue-100 shadow-sm">
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Actual Utilized Amount</p>
                  <h3 className="text-2xl font-black text-blue-700 tracking-tight">
                    {fmt(varianceData.items?.reduce((s, i) => s + i.actualAmount, 0))}
                  </h3>
                </div>
                <div className="p-6 rounded-[2rem] bg-emerald-50 border border-emerald-100 shadow-sm">
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Overall Variance Balance</p>
                  <h3 className="text-2xl font-black text-emerald-700 tracking-tight">
                    {fmt(varianceData.items?.reduce((s, i) => s + i.variance, 0))}
                  </h3>
                </div>
              </div>

              {/* Progress bars analysis */}
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl p-8 space-y-6">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <BarChart3 size={16} className="text-blue-600" /> Account Utilization Analysis
                </h3>

                <div className="space-y-6">
                  {varianceData.items?.map((item, idx) => {
                    const pct = Math.min(100, item.pctAchieved || 0);
                    // Determine colors based on utilization percentage
                    let colorClass = 'bg-blue-500';
                    if (pct > 90) {
                      colorClass = 'bg-red-500';
                    } else if (pct > 75) {
                      colorClass = 'bg-amber-500';
                    } else {
                      colorClass = 'bg-emerald-500';
                    }

                    return (
                      <div key={idx} className="space-y-2">
                        <div className="flex justify-between items-end text-xs">
                          <div>
                            <span className="font-extrabold text-slate-800">{item.name}</span>
                            <span className="px-2 py-0.5 bg-slate-100 text-[8px] font-bold uppercase rounded text-slate-500 ml-2">
                              {item.type}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold ml-2">
                              Target: {fmt(item.targetAmount)}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-extrabold text-slate-700">{fmt(item.actualAmount)}</span>
                            <span className={`ml-2 font-black ${pct > 100 ? 'text-red-600 font-bold' : 'text-slate-500'}`}>
                              ({pct.toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                        {/* Progress Bar Container */}
                        <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Variance details table */}
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 border-b border-slate-100 bg-[#fcfdfe]">
                    <tr>
                      <th className="px-8 py-4">Budget Item Name</th>
                      <th className="px-8 py-4">Type</th>
                      <th className="px-8 py-4 text-right">Budget Amount (₹)</th>
                      <th className="px-8 py-4 text-right">Actual Spent (₹)</th>
                      <th className="px-8 py-4 text-right">Variance Balance (₹)</th>
                      <th className="px-8 py-4 text-center">Used (%)</th>
                      <th className="px-8 py-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-[12px] font-bold text-slate-700">
                    {varianceData.items?.length > 0 ? (
                      varianceData.items.map((item, idx) => {
                        const isOver = item.actualAmount > item.targetAmount;
                        return (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="px-8 py-4 font-bold text-slate-900">{item.name}</td>
                            <td className="px-8 py-4">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${item.type === 'Group' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                                {item.type}
                              </span>
                            </td>
                            <td className="px-8 py-4 text-right font-bold">{fmt(item.targetAmount)}</td>
                            <td className="px-8 py-4 text-right text-blue-600 font-bold">{fmt(item.actualAmount)}</td>
                            <td className={`px-8 py-4 text-right font-bold ${item.variance < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                              {fmt(item.variance)}
                            </td>
                            <td className="px-8 py-4 text-center">
                              <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wide
                                ${item.pctAchieved > 100 ? 'bg-red-50 text-red-700' : 
                                  item.pctAchieved > 80 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                {item.pctAchieved.toFixed(1)}%
                              </span>
                            </td>
                            <td className="px-8 py-4 text-center">
                              <span className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-widest border
                                ${isOver ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}>
                                {isOver ? 'Over Budget' : 'Under Budget'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="text-center py-10 text-slate-400 font-bold italic">
                          No variance items mapped.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex gap-3 text-red-600 font-bold text-sm">
              <AlertCircle size={18} className="shrink-0" />
              Failed to load budget calculations. Ensure transactions exist or budgeting endpoints are fully synced.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
