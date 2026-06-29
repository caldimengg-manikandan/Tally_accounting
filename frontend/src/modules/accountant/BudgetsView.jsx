import React, { useState, useEffect } from 'react';
import { 
  Plus, X, ChevronDown, 
  Info, Target, Layout,
  Settings, Check, Search, Trash2, ArrowLeft, TrendingUp, AlertCircle, BarChart3, HelpCircle, RefreshCcw
} from 'lucide-react';
import { budgetAPI, ledgerAPI, groupAPI } from '../../services/api';
import ConfirmModal from '../../components/ConfirmModal';
import useNotificationStore from '../../store/notificationStore';

const fmt = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

export default function BudgetsView({ showNew }) {
  const { addNotification } = useNotificationStore();
  const companyId = sessionStorage.getItem('companyId');
  const [budgets, setBudgets] = useState([]);
  const [ledgers, setLedgers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [activeView, setActiveView] = useState('list'); // 'list', 'create', 'variance'
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [varianceData, setVarianceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    message: '',
    onConfirm: null
  });

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
    if (!formData.name.trim()) return addNotification('Budget name is required', 'warning');
    if (formData.items.length === 0) return addNotification('Please add at least one budget item', 'warning');

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
      addNotification('Budget created successfully', 'success');
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
      addNotification(err.response?.data?.error || 'Failed to create budget', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBudget = (id, e) => {
    e.stopPropagation();
    setConfirmModal({
      isOpen: true,
      message: 'Are you sure you want to delete this budget? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await budgetAPI.delete(id);
          addNotification('Budget deleted successfully.', 'success');
          fetchBudgets();
        } catch (err) {
          console.error(err);
          addNotification('Failed to delete budget', 'error');
        }
      }
    });
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
    if (itemType === 'Ledger' && !selectedLedgerId) return addNotification('Please select a ledger', 'warning');
    if (itemType === 'Group' && !selectedGroupId) return addNotification('Please select a group', 'warning');
    if (!targetAmount || parseFloat(targetAmount) <= 0) return addNotification('Please enter a valid target amount', 'warning');

    // Check duplicate
    const isDuplicate = itemType === 'Ledger' 
      ? formData.items.some(item => item.ledgerId === selectedLedgerId)
      : formData.items.some(item => item.groupId === selectedGroupId);

    if (isDuplicate) {
      return addNotification(`${itemType} is already added to this budget`, 'warning');
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
    <div className="p-8 max-w-[1400px] mx-auto space-y-8 animate-fade-in font-sans text-slate-800">
      {/* View: List */}
      {activeView === 'list' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100/80 pb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Target size={20} />
                </div>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Management Tools</span>
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Budget Control Registers</h1>
              <p className="text-slate-500 text-xs mt-1 font-medium">Establish spending limits and track variance against actual transactions</p>
            </div>
            <button 
              onClick={() => setActiveView('create')}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 flex items-center gap-2 transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              <Plus size={16} /> Create Budget
            </button>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-slate-400 text-xs font-semibold">Synchronizing registers...</p>
            </div>
          ) : budgets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 bg-gradient-to-b from-white to-slate-50/50 rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-100/50 space-y-6 max-w-3xl mx-auto p-10 text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-50 to-indigo-50 border border-blue-100/30 flex items-center justify-center text-blue-600 shadow-inner">
                <Target size={40} className="animate-pulse" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Stay on top of your financial metrics</h2>
                <p className="text-slate-500 text-xs leading-relaxed max-w-lg mx-auto">
                  Establish corporate budgeting structures, define spending limits for distinct accounts or groups, and view automated variance dashboards mapping real-time double-entry ledgers.
                </p>
              </div>
              <button 
                onClick={() => setActiveView('create')}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-blue-500/25 transition-all hover:-translate-y-0.5"
              >
                Configure Your First Budget
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {budgets.map(b => {
                const totalTarget = b.items?.reduce((sum, item) => sum + Number(item.targetAmount || 0), 0) || 0;
                return (
                  <div 
                    key={b.id} 
                    onClick={() => handleViewVariance(b)}
                    className="bg-white rounded-[2rem] p-7 border border-slate-100 shadow-md hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer group flex flex-col justify-between h-64 relative overflow-hidden bg-gradient-to-br from-white to-slate-50/30"
                  >
                    <div className="absolute right-4 top-4 text-slate-550 select-none group-hover:text-blue-50/30 group-hover:rotate-12 transition-all duration-500">
                      <Target size={90} />
                    </div>
                    
                    <div className="space-y-4 relative z-10">
                      <div className="flex gap-2">
                        <span className="bg-slate-100/80 text-slate-600 text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">
                          FY: {b.fiscalYear}
                        </span>
                        <span className="bg-blue-50 text-blue-700 text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">
                          {b.period}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight group-hover:text-blue-600 transition-colors leading-snug">
                          {b.name}
                        </h3>
                        <p className="text-slate-400 text-[11px] font-bold mt-1.5 flex items-center gap-1">
                          <Check size={12} className="text-emerald-500" /> {b.items?.length || 0} Accounts Allocated
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 border-t border-slate-100/80 pt-4 relative z-10">
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Total Limit</p>
                          <p className="text-lg font-black text-slate-700 group-hover:text-slate-900 transition-colors mt-0.5">
                            {fmt(totalTarget)}
                          </p>
                        </div>
                        <span className="text-[11px] font-extrabold text-blue-600 group-hover:underline flex items-center gap-1">
                          Variance Report &rarr;
                        </span>
                      </div>
                      
                      <div className="flex justify-end">
                        <button 
                          onClick={(e) => handleDeleteBudget(b.id, e)}
                          className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50/50 transition-all"
                          title="Delete Budget"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* View: Create */}
      {activeView === 'create' && (
        <div className="space-y-6">
          <div className="flex items-center gap-4 border-b border-slate-100/80 pb-6">
            <button 
              onClick={() => setActiveView('list')}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl transition-all hover:scale-105 active:scale-95"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Create Accounting Budget</h1>
              <p className="text-slate-500 text-[13px] mt-0.5 font-medium">Define target spending caps for your ledgers and account groups</p>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100/80 shadow-2xl shadow-slate-100/40 max-w-4xl mx-auto">
            <form onSubmit={handleCreateBudget} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Budget Name *</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. FY26 Indirect Expenses"
                    className="border border-slate-200 rounded-xl px-4 py-3.5 text-[13px] font-semibold text-slate-700 outline-none hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all bg-slate-50/30 focus:bg-white"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Fiscal Year *</label>
                  <select 
                    value={formData.fiscalYear}
                    onChange={e => setFormData({ ...formData, fiscalYear: e.target.value })}
                    className="border border-slate-200 rounded-xl px-4 py-3.5 text-[13px] font-semibold text-slate-700 outline-none hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all bg-slate-50/30 focus:bg-white"
                  >
                    <option value="2025-2026">2025 - 2026 (Apr - Mar)</option>
                    <option value="2026-2027">2026 - 2027 (Apr - Mar)</option>
                    <option value="2027-2028">2027 - 2028 (Apr - Mar)</option>
                    <option value="2028-2029">2028 - 2029 (Apr - Mar)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Filing Period *</label>
                  <select 
                    value={formData.period}
                    onChange={e => setFormData({ ...formData, period: e.target.value })}
                    className="border border-slate-200 rounded-xl px-4 py-3.5 text-[13px] font-semibold text-slate-700 outline-none hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all bg-slate-50/30 focus:bg-white"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Half-yearly">Half-yearly</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                </div>
              </div>

              {/* Items / Selection */}
              <div className="border-t border-slate-100/85 pt-6 space-y-5">
                <h3 className="text-[15px] font-black text-slate-800 uppercase tracking-wider">Budget Account Allocations</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-blue-50/30 border border-blue-100/30 p-6 rounded-[1.5rem] shadow-sm">
                  <div className="md:col-span-3 flex flex-col gap-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Budget Type</label>
                    <select 
                      value={itemType}
                      onChange={e => setItemType(e.target.value)}
                      className="border border-slate-200 rounded-xl px-3 py-3 text-[13px] font-bold text-slate-700 outline-none hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all bg-white"
                    >
                      <option value="Ledger">Ledger Account</option>
                      <option value="Group">Account Group</option>
                    </select>
                  </div>

                  <div className="md:col-span-5 flex flex-col gap-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                      Select {itemType}
                    </label>
                    {itemType === 'Ledger' ? (
                      <select 
                        value={selectedLedgerId}
                        onChange={e => setSelectedLedgerId(e.target.value)}
                        className="border border-slate-200 rounded-xl px-3 py-3 text-[13px] font-bold text-slate-700 outline-none hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all bg-white"
                      >
                        <option value="">-- Choose Account --</option>
                        {ledgers.map(l => (
                          <option key={l.id} value={l.id}>{l.name} ({l.Group?.name || l.groupName || 'No Group'})</option>
                        ))}
                      </select>
                    ) : (
                      <select 
                        value={selectedGroupId}
                        onChange={e => setSelectedGroupId(e.target.value)}
                        className="border border-slate-200 rounded-xl px-3 py-3 text-[13px] font-bold text-slate-700 outline-none hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all bg-white"
                      >
                        <option value="">-- Choose Group --</option>
                        {groups.map(g => (
                          <option key={g.id} value={g.id}>{g.name} ({g.nature})</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="md:col-span-2 flex flex-col gap-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Target Cap (₹)</label>
                    <input 
                      type="number" 
                      value={targetAmount}
                      onChange={e => setTargetAmount(e.target.value)}
                      placeholder="e.g. 1000"
                      className="border border-slate-200 rounded-xl px-3 py-3 text-[13px] font-bold text-slate-700 outline-none hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all bg-white"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <button 
                      type="button" 
                      onClick={addItem}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 rounded-xl font-bold text-[13px] uppercase tracking-widest shadow-md transition-all flex items-center justify-center gap-1.5 hover:scale-[1.02]"
                    >
                      <Plus size={15} /> Add Item
                    </button>
                  </div>
                </div>

                {/* Selected items table */}
                <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-md">
                  <table className="w-full text-left border-collapse">
                    <thead className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 border-b border-slate-100 bg-slate-50/50">
                      <tr>
                        <th className="px-6 py-4">Budget Item Name</th>
                        <th className="px-6 py-4">Type</th>
                        <th className="px-6 py-4 text-right">Target Budget Limit</th>
                        <th className="px-6 py-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-[13px] font-semibold text-slate-700">
                      {formData.items.length > 0 ? (
                        formData.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-800">{item.name}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase ${item.type === 'Group' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                                {item.type}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right font-black text-slate-900">{fmt(item.targetAmount)}</td>
                            <td className="px-6 py-4 text-center">
                              <button 
                                type="button" 
                                onClick={() => removeItem(item)}
                                className="text-slate-400 hover:text-red-500 transition-all p-1.5 hover:bg-red-50 rounded-lg"
                              >
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="text-center py-12 text-slate-400 text-[13px] italic font-medium">
                            No allocations defined. Choose a Ledger or Group above to add them to this budget.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-5 border-t border-slate-100/85">
                <button 
                  type="button" 
                  onClick={() => setActiveView('list')}
                  className="px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 font-bold text-[13px] uppercase tracking-widest transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-[13px] uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all disabled:opacity-50 hover:scale-[1.01]"
                >
                  {loading ? 'Establishing...' : 'Establish Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View: Variance Report */}
      {activeView === 'variance' && (
        <div className="space-y-6">
          <div className="flex items-center gap-4 justify-between border-b border-slate-100/80 pb-6">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setActiveView('list')}
                className="p-2.5 hover:bg-slate-100 border border-slate-100 rounded-xl transition-all text-slate-600"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{selectedBudget?.name}</h1>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-2">
                  <span>Variance Analysis</span> &bull; <span>{selectedBudget?.fiscalYear}</span> &bull; <span className="text-blue-600 font-bold">{selectedBudget?.period}</span>
                </p>
              </div>
            </div>
            <button 
              onClick={() => handleViewVariance(selectedBudget)}
              className="p-3 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-400 shadow-sm transition-all hover:scale-105 active:scale-95"
              title="Recalibrate Variance"
            >
              <RefreshCcw size={15} />
            </button>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-slate-400 text-xs font-semibold">Recalibrating ledger splits...</p>
            </div>
          ) : varianceData ? (
            <div className="space-y-8">
              {/* Consolidated Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-7 rounded-[2rem] bg-white border border-slate-100 shadow-lg shadow-slate-100/40 relative overflow-hidden">
                  <div className="absolute right-4 top-4 text-slate-100">
                    <Target size={40} />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Budget Cap</p>
                  <h3 className="text-3xl font-black text-slate-800 tracking-tight">
                    {fmt(varianceData.items?.reduce((s, i) => s + i.targetAmount, 0))}
                  </h3>
                </div>
                
                <div className="p-7 rounded-[2rem] bg-white border border-blue-100/50 shadow-lg shadow-blue-500/5 relative overflow-hidden">
                  <div className="absolute right-4 top-4 text-blue-100">
                    <TrendingUp size={40} />
                  </div>
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Actual Utilized Amount</p>
                  <h3 className="text-3xl font-black text-blue-700 tracking-tight">
                    {fmt(varianceData.items?.reduce((s, i) => s + i.actualAmount, 0))}
                  </h3>
                </div>

                {(() => {
                  const totalVariance = varianceData.items?.reduce((s, i) => s + i.variance, 0) || 0;
                  const isOverspent = totalVariance < 0;
                  return (
                    <div className={`p-7 rounded-[2rem] border shadow-lg transition-all duration-300 relative overflow-hidden ${isOverspent ? 'bg-rose-50/40 border-rose-100 text-rose-700 shadow-rose-500/5' : 'bg-emerald-50/40 border-emerald-100 text-emerald-700 shadow-emerald-500/5'}`}>
                      <div className="absolute right-4 top-4 opacity-50">
                        {isOverspent ? <AlertCircle size={40} /> : <Check size={40} />}
                      </div>
                      <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isOverspent ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {isOverspent ? 'Total Overspent Balance' : 'Total Remaining Balance'}
                      </p>
                      <h3 className={`text-3xl font-black tracking-tight ${isOverspent ? 'text-rose-700' : 'text-emerald-700'}`}>
                        {fmt(Math.abs(totalVariance))} {isOverspent ? 'Over' : 'Under'}
                      </h3>
                    </div>
                  );
                })()}
              </div>

              {/* Progress bars analysis */}
              <div className="bg-white rounded-[2rem] border border-slate-100/80 shadow-xl shadow-slate-100/40 p-8 space-y-5">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <BarChart3 size={15} className="text-blue-600" />
                  <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-widest">Account Utilization Analysis</h3>
                </div>

                <div className="space-y-5">
                  {varianceData.items?.map((item, idx) => {
                    const rawPct = item.pctAchieved || 0;
                    const pct = Math.min(100, rawPct);
                    const isOver = item.actualAmount > item.targetAmount;

                    let barColor = 'bg-gradient-to-r from-emerald-400 to-teal-500';
                    let badgeCls = 'text-emerald-700 bg-emerald-50 border-emerald-200';
                    if (rawPct > 100) {
                      barColor = 'bg-gradient-to-r from-red-500 to-rose-500';
                      badgeCls = 'text-red-600 bg-red-50 border-red-200';
                    } else if (rawPct > 80) {
                      barColor = 'bg-gradient-to-r from-amber-400 to-orange-500';
                      badgeCls = 'text-amber-700 bg-amber-50 border-amber-200';
                    }

                    return (
                      <div key={idx} className="rounded-2xl border border-slate-100 bg-slate-50/40 px-5 py-4 space-y-3 hover:bg-white transition-colors">
                        {/* Row 1: Name + amounts */}
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-800">{item.name}</span>
                            <span className={`text-[9px] font-semibold uppercase px-2 py-0.5 rounded border ${item.type === 'Group' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                              {item.type}
                            </span>
                          </div>
                          <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg border ${badgeCls}`}>
                            {rawPct.toFixed(1)}% utilized
                          </span>
                        </div>

                        {/* Row 2: Progress bar */}
                        <div className="w-full h-2 rounded-full bg-slate-200/60 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>

                        {/* Row 3: Limit vs Spent */}
                        <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                          <span>Target: <span className="text-slate-600 font-semibold">{fmt(item.targetAmount)}</span></span>
                          <span className={isOver ? 'text-red-500 font-semibold' : 'text-slate-500'}>
                            Spent: <span className="font-semibold">{fmt(item.actualAmount)}</span>
                            {isOver && <span className="ml-1 text-[10px] font-semibold text-red-500">· Over by {fmt(Math.abs(item.variance))}</span>}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Variance details table */}
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-100/40 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400 border-b border-slate-100 bg-gradient-to-r from-blue-50/40 to-indigo-50/20">
                    <tr>
                      <th className="px-8 py-5">Budget Item Name</th>
                      <th className="px-8 py-5">Type</th>
                      <th className="px-8 py-5 text-right">Target Limit</th>
                      <th className="px-8 py-5 text-right">Actual Spent</th>
                      <th className="px-8 py-5 text-right">Variance Balance</th>
                      <th className="px-8 py-5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[12.5px] text-slate-700">
                    {varianceData.items?.length > 0 ? (
                      varianceData.items.map((item, idx) => {
                        const isOver = item.actualAmount > item.targetAmount;
                        return (
                          <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                            <td className="px-8 py-5 font-semibold text-slate-900">{item.name}</td>
                            <td className="px-8 py-5">
                              <span className={`px-2.5 py-1 rounded-md text-[9px] font-semibold uppercase ${item.type === 'Group' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                                {item.type}
                              </span>
                            </td>
                            <td className="px-8 py-5 text-right font-semibold text-slate-800">{fmt(item.targetAmount)}</td>
                            <td className="px-8 py-5 text-right text-blue-600 font-semibold">{fmt(item.actualAmount)}</td>
                            <td className={`px-8 py-5 text-right font-semibold ${item.variance < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                              {item.variance < 0 ? `-${fmt(Math.abs(item.variance))}` : fmt(item.variance)}
                            </td>
                            <td className="px-8 py-5 text-center">
                              <span className={`px-3 py-1.5 rounded-full text-[9px] font-semibold uppercase tracking-wider border
                                ${isOver ? 'bg-red-50 border-red-100 text-red-600' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}>
                                {isOver ? 'Over Budget' : 'Within Limit'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center py-14 text-slate-400 font-medium italic">
                          No allocation items defined for this report.
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

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, message: '', onConfirm: null })}
        onConfirm={confirmModal.onConfirm}
        title="Confirm Action"
        message={confirmModal.message}
      />
    </div>
  );
}
