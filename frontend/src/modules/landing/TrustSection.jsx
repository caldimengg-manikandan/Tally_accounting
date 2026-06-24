import React from 'react';
import { Building2, ShieldCheck, RefreshCw, BarChart3, Package, FileCheck2 } from 'lucide-react';

export default function TrustSection() {
  const badges = [
    { icon: Building2, label: 'Multi-Company' },
    { icon: FileCheck2, label: 'GST Ready' },
    { icon: ShieldCheck, label: 'Audit Logs' },
    { icon: RefreshCw, label: 'Bank Reconciliation' },
    { icon: BarChart3, label: 'Reporting' },
    { icon: Package, label: 'Inventory' },
  ];

  return (
    <section className="bg-slate-50 border-y border-slate-100 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap justify-center gap-3">
          {badges.map((badge, idx) => (
            <div key={idx} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 hover:border-teal-300 hover:bg-teal-50 transition-all group shadow-sm">
              <badge.icon size={14} className="text-teal-400 group-hover:text-teal-600 transition-colors" strokeWidth={1.5} />
              <span className="text-[12px] text-slate-500 group-hover:text-teal-700 font-medium transition-colors">{badge.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
