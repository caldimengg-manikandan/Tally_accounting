import React, { useState, useEffect } from 'react';
import { Sliders, CheckCircle, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { companyAPI } from '../../services/api';

const FEATURE_LIST = [
  { id: 'sales', label: 'Sales & Invoices', tier: 'Basic', desc: 'Create tax invoices, estimates, and track payments received.' },
  { id: 'purchases', label: 'Purchases & Bills', tier: 'Basic', desc: 'Manage vendor bills, expenses, and payments made.' },
  { id: 'accounting', label: 'Double-Entry Ledger Engine', tier: 'Basic', desc: 'Post general journal vouchers and maintain group charts.' },
  { id: 'reports', label: 'Financial Statements', tier: 'Basic', desc: 'View profit & loss, balance sheets, and tax ledger audits.' },
  { id: 'currency', label: 'Multi-Currency System', tier: 'Pro', desc: 'Transact in international currencies with live exchange rates.' },
  { id: 'cost_center', label: 'Cost Center Allocations', tier: 'Pro', desc: 'Track department-level revenue and project cost splits.' },
  { id: 'payroll', label: 'Automated Payroll & Slips', tier: 'Pro', desc: 'Manage employee attendances, salaries, and print payslips.' },
  { id: 'bom', label: 'BOM & Manufacturing Vouchers', tier: 'Enterprise', desc: 'Define recipe bills of materials and post assembly stocks.' },
  { id: 'godown', label: 'Multi-Godown Tracking', tier: 'Enterprise', desc: 'Manage inventory stocks across multiple warehouse locations.' },
  { id: 'api', label: 'Developer API Integration', tier: 'Enterprise', desc: 'Sync transactional data with external logistics and CRMs.' },
];

const FeatureSettings = ({ companyId, onNavigateToUpgrade }) => {
  const [currentTier, setCurrentTier] = useState('Basic');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompanyTier();
  }, [companyId]);

  const fetchCompanyTier = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const res = await companyAPI.getById(companyId);
      const planName = res.data?.SubscriptionPlan?.name || '';
      if (planName.toLowerCase().includes('enterprise')) {
        setCurrentTier('Enterprise');
      } else if (planName.toLowerCase().includes('pro')) {
        setCurrentTier('Pro');
      } else {
        setCurrentTier('Basic');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const isFeatureUnlocked = (tier) => {
    if (currentTier === 'Enterprise') return true;
    if (currentTier === 'Pro' && tier !== 'Enterprise') return true;
    return tier === 'Basic';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-slate-400">
        <Loader2 size={32} className="animate-spin text-blue-600 mb-2" />
        <span className="text-xs font-bold uppercase tracking-widest">Loading active features...</span>
      </div>
    );
  }

  return (
    <div className="w-full box-border">
      <header className="mb-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5">
        <div className="flex items-center gap-2.5">
          <Sliders className="text-blue-600" size={24} />
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Feature Access Control</h1>
        </div>
        <p className="text-[12px] text-slate-400 mt-1">
          Review which accounting, inventory, and integration modules are active in your current subscription tier.
        </p>
      </header>

      {/* Grid of features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {FEATURE_LIST.map(feat => {
          const unlocked = isFeatureUnlocked(feat.tier);
          return (
            <div 
              key={feat.id}
              className={`p-5 rounded-xl border transition-all flex flex-col justify-between min-h-[140px] bg-white dark:bg-slate-700
                ${unlocked 
                  ? 'border-slate-200 dark:border-slate-600 hover:border-slate-300' 
                  : 'border-slate-200 dark:border-slate-600/60 opacity-75'}`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-bold text-slate-800 dark:text-slate-100">{feat.label}</span>
                  {unlocked ? (
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-[9px] rounded-full uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle size={10} /> Unlocked
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 dark:text-slate-400 font-bold text-[9px] rounded-full uppercase tracking-wider flex items-center gap-1">
                      <Lock size={10} /> Locks at {feat.tier}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{feat.desc}</p>
              </div>

              {!unlocked && (
                <div className="pt-4 flex justify-end">
                  <button
                    onClick={onNavigateToUpgrade}
                    className="inline-flex items-center gap-1 text-[10px] font-extrabold text-blue-600 hover:text-blue-800 uppercase tracking-widest"
                  >
                    Unlock Feature <ArrowRight size={12} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FeatureSettings;
