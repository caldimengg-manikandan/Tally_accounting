import React, { useState, useEffect } from 'react';
import {
  X, Save, AlertCircle, ChevronDown, Loader2,
  Tag, DollarSign, Layers, Info, CheckCircle2
} from 'lucide-react';
import { groupAPI, ledgerAPI } from '../../services/api';

// ─── Nature color mapping ───────────────────────────────────────
const NATURE_COLORS = {
  Assets:      'bg-blue-50 text-blue-700 border-blue-200',
  Liabilities: 'bg-rose-50 text-rose-700 border-rose-200',
  Income:      'bg-emerald-50 text-emerald-700 border-emerald-200',
  Expenses:    'bg-amber-50 text-amber-700 border-amber-200',
};

// ─── Group nature icons ─────────────────────────────────────────
const NATURE_DOT = {
  Assets:      'bg-blue-500',
  Liabilities: 'bg-rose-500',
  Income:      'bg-emerald-500',
  Expenses:    'bg-amber-500',
};

export default function CreateLedgerModal({ isOpen, onClose, onSuccess, ledgerToEdit }) {
  const [groups, setGroups]               = useState([]);
  const [groupsByNature, setGroupsByNature] = useState({});
  const [name, setName]                   = useState('');
  const [groupId, setGroupId]             = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [openingBalance, setOpeningBalance] = useState('');
  const [balanceType, setBalanceType]     = useState('Dr'); // Dr or Cr
  const [gstApplicable, setGstApplicable] = useState('Not Applicable');
  const [description, setDescription]    = useState('');
  const [saving, setSaving]              = useState(false);
  const [seeding, setSeeding]            = useState(false);
  const [error, setError]                = useState('');
  const [saved, setSaved]                = useState(false);

  const companyId = sessionStorage.getItem('companyId');

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    setSaved(false);

    // Use resolveGroups — auto-heals wrong companyId, auto-seeds if empty
    groupAPI.resolveGroups()
      .then(res => {
        const { companyId: resolvedId, groups: data } = res.data;
        // Fix localStorage if stale
        if (resolvedId && resolvedId !== sessionStorage.getItem('companyId')) {
          sessionStorage.setItem('companyId', resolvedId);
        }

        const arr = Array.isArray(data) ? data : [];
        setGroups(arr);
        const byNature = {};
        arr.forEach(g => {
          const n = g.nature || 'Other';
          if (!byNature[n]) byNature[n] = [];
          byNature[n].push(g);
        });
        setGroupsByNature(byNature);
      })
      .catch(() => setError('Could not load account groups. Please check your backend is running.'));

    // Pre-fill for edit mode
    if (ledgerToEdit) {
      setName(ledgerToEdit.name || '');
      setGroupId(ledgerToEdit.GroupId || '');
      setOpeningBalance(ledgerToEdit.openingBalance || '');
    } else {
      setName(''); setGroupId(''); setOpeningBalance('');
      setDescription(''); setGstApplicable('Not Applicable'); setBalanceType('Dr');
    }
  }, [isOpen, ledgerToEdit]);


  // Find selected group details when groupId changes
  useEffect(() => {
    if (groupId) {
      setSelectedGroup(groups.find(g => g.id === groupId) || null);
    } else {
      setSelectedGroup(null);
    }
  }, [groupId, groups]);

  // ── Auto-seed standard groups ─────────────────────────────────
  const handleSeedGroups = async () => {
    if (!companyId || seeding) return;
    setSeeding(true);
    try {
      const res = await groupAPI.seedStandard(companyId);
      const data = res.data?.groups || [];
      setGroups(data);
      const byNature = {};
      data.forEach(g => {
        const n = g.nature || 'Other';
        if (!byNature[n]) byNature[n] = [];
        byNature[n].push(g);
      });
      setGroupsByNature(byNature);
      setError('');
    } catch (err) {
      if (err.response?.status === 400) {
        // Already seeded — just refetch
        try {
          const r2 = await groupAPI.getByCompany(companyId);
          const data = Array.isArray(r2.data) ? r2.data : [];
          setGroups(data);
          const byNature = {};
          data.forEach(g => {
            const n = g.nature || 'Other';
            if (!byNature[n]) byNature[n] = [];
            byNature[n].push(g);
          });
          setGroupsByNature(byNature);
        } catch {}
      } else {
        setError('Failed to seed standard groups.');
      }
    } finally {
      setSeeding(false);
    }
  };

  // ── Save ───────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setError('Ledger name is required.');
    if (!groupId)     return setError('Please select a parent group.');
    setSaving(true);
    setError('');
    try {
      const currentCompanyId = sessionStorage.getItem('companyId');
      const payload = {
        companyId: currentCompanyId,
        groupId,
        name: name.trim(),
        openingBalance: parseFloat(openingBalance) || 0,
      };
      if (ledgerToEdit) {
        await ledgerAPI.update(ledgerToEdit.id, payload);
      } else {
        await ledgerAPI.create(payload);
      }
      setSaved(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 800);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save ledger.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const natureOrder = ['Assets', 'Liabilities', 'Income', 'Expenses'];

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 backdrop-blur-sm bg-slate-900/50">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">

        {/* ── Modal Header ─────────────────────────────────── */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center">
              <Layers size={18} className="text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                {ledgerToEdit ? 'Edit Ledger Account' : 'Create New Ledger Account'}
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                LEDGERS · Double-Entry Compliant
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-all">
            <X size={18} />
          </button>
        </div>

        {/* ── Form Body ─────────────────────────────────────── */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto">
          <div className="p-8 space-y-6">

            {/* Error Banner */}
            {error && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm font-bold text-red-700">{error}</p>
              </div>
            )}

            {/* Empty groups warning + seed button */}
            {groups.length === 0 && !seeding && (
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <Info size={16} className="text-amber-600 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-amber-800">No account groups found.</p>
                  <p className="text-xs text-amber-600 mt-0.5">Tally's 28 standard groups need to be initialized for your company.</p>
                </div>
                <button type="button" onClick={handleSeedGroups}
                  className="shrink-0 text-xs font-bold px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-all">
                  Initialize Groups
                </button>
              </div>
            )}

            {seeding && (
              <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                <Loader2 size={16} className="text-blue-500 animate-spin" />
                <p className="text-sm font-bold text-blue-700">Setting up standard account groups...</p>
              </div>
            )}

            {/* ── Row 1: Ledger Name ────────────────────────── */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                Ledger Account Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Tag size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. HDFC Bank Current Account, TDS Payable, Office Rent"
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:font-normal placeholder:text-slate-300"
                  autoFocus
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5 font-medium">Use a descriptive name that will appear in all financial reports.</p>
            </div>

            {/* ── Row 2: Parent Group ───────────────────────── */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                Under Group (Parent) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Layers size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={groupId}
                  onChange={e => setGroupId(e.target.value)}
                  className="w-full appearance-none pl-10 pr-10 py-3 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">-- Select Account Group --</option>
                  {natureOrder.map(nature => {
                    const grpList = groupsByNature[nature];
                    if (!grpList || grpList.length === 0) return null;
                    return (
                      <optgroup key={nature} label={`── ${nature.toUpperCase()} ──`}>
                        {grpList
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map(g => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                          ))
                        }
                      </optgroup>
                    );
                  })}
                </select>
                <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              {/* Selected group badge */}
              {selectedGroup && (
                <div className={`mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold ${NATURE_COLORS[selectedGroup.nature] || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                  <span className={`w-2 h-2 rounded-full ${NATURE_DOT[selectedGroup.nature] || 'bg-slate-400'}`} />
                  {selectedGroup.nature} → {selectedGroup.name}
                </div>
              )}
            </div>

            {/* ── Row 3: Opening Balance ────────────────────── */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Opening Balance (₹)
                </label>
                <div className="relative">
                  <DollarSign size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={openingBalance}
                    onChange={e => setOpeningBalance(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:font-normal placeholder:text-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Balance Type
                </label>
                <div className="flex gap-3 h-[46px]">
                  {['Dr', 'Cr'].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setBalanceType(t)}
                      className={`flex-1 rounded-xl text-sm font-bold tracking-widest border-2 transition-all ${
                        balanceType === t
                          ? t === 'Dr' ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-red-600 border-red-600 text-white'
                          : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400'
                      }`}
                    >
                      {t === 'Dr' ? 'Debit (Dr)' : 'Credit (Cr)'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Row 4: GST Applicability ─────────────────── */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                GST / Tax Applicability
              </label>
              <div className="relative">
                <select
                  value={gstApplicable}
                  onChange={e => setGstApplicable(e.target.value)}
                  className="w-full appearance-none px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <option>Not Applicable</option>
                  <option>Registered (GSTIN Required)</option>
                  <option>Unregistered / Composition</option>
                  <option>Consumer (End User)</option>
                </select>
                <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* ── Info Strip ───────────────────────────────── */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-start gap-3">
              <Info size={14} className="text-slate-400 mt-0.5 shrink-0" />
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                All ledger accounts follow the <strong>Double-Entry Accounting Standard (ISO-20022)</strong>. 
                Every debit must have a matching credit. The <strong>parent group</strong> determines 
                where this ledger appears in your Trial Balance and financial statements.
              </p>
            </div>

          </div>
        </form>

        {/* ── Footer Actions ──────────────────────────────────── */}
        <div className="border-t border-slate-100 px-8 py-5 bg-slate-50/50 flex items-center justify-between gap-4">
          <button type="button" onClick={onClose}
            className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-100 transition-all">
            Cancel
          </button>

          <button
            type="submit"
            onClick={handleSave}
            disabled={saving || saved || seeding}
            className={`flex items-center gap-2 px-8 py-2.5 rounded-xl font-bold text-sm tracking-wide shadow-lg transition-all ${
              saved ? 'bg-emerald-600 text-white' :
              'bg-slate-900 hover:bg-blue-700 text-white shadow-slate-900/20 hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100'
            }`}
          >
            {saving ? <><Loader2 size={15} className="animate-spin" /> Saving...</> :
             saved  ? <><CheckCircle2 size={15} /> Saved!</> :
                      <><Save size={15} /> {ledgerToEdit ? 'Update Ledger' : 'Create Ledger Account'}</>}
          </button>
        </div>
      </div>
    </div>
  );
}
