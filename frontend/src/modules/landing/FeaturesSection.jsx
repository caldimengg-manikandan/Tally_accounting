import React from 'react';
import { BookOpen, Receipt, Wallet, ShoppingBag, Users, PieChart, ArrowRight } from 'lucide-react';

export default function FeaturesSection() {
  const features = [
    { icon: BookOpen, title: 'Smart Accounting', description: 'Automated double-entry journals, reconciliation, and ledger management — built for Indian GAAP.', accent: 'from-teal-500 to-cyan-500', bg: 'bg-teal-50', iconColor: 'text-teal-600' },
    { icon: Receipt, title: 'Invoicing & GST', description: 'GST-compliant invoices, e-invoicing, recurring billing, and payment tracking in one place.', accent: 'from-indigo-500 to-violet-500', bg: 'bg-indigo-50', iconColor: 'text-indigo-600' },
    { icon: Wallet, title: 'Expense Control', description: 'Categorize spending, manage vendor payables, and track every rupee leaving your business.', accent: 'from-rose-500 to-pink-500', bg: 'bg-rose-50', iconColor: 'text-rose-600' },
    { icon: ShoppingBag, title: 'Inventory', description: 'Real-time stock tracking, multi-warehouse support, and automated reorder alerts.', accent: 'from-amber-500 to-orange-500', bg: 'bg-amber-50', iconColor: 'text-amber-600' },
    { icon: Users, title: 'Payroll', description: 'Process salaries, track attendance, generate payslips, and stay PF/ESI compliant.', accent: 'from-blue-500 to-sky-500', bg: 'bg-blue-50', iconColor: 'text-blue-600' },
    { icon: PieChart, title: 'Reports & Analytics', description: 'P&L, Balance Sheet, Cash Flow, Trial Balance — real-time insights for smarter decisions.', accent: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
  ];

  return (
    <section id="features" className="py-28 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
          <div>
            <span className="text-teal-600 text-[11px] font-semibold uppercase tracking-widest">Platform Features</span>
            <h2 className="text-3xl md:text-4xl font-semibold text-slate-800 mt-3 leading-snug">
              Built for growing<br />
              <span className="text-slate-400 font-light">Indian businesses.</span>
            </h2>
          </div>
          <p className="text-slate-400 text-sm max-w-xs leading-relaxed">
            Every feature is designed around the real workflow of Indian SMEs — not adapted from foreign software.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, idx) => (
            <div key={idx}
              className="group relative p-7 rounded-2xl border border-slate-100 bg-white hover:border-slate-200 hover:shadow-md transition-all duration-300 cursor-default overflow-hidden">
              <div className={`w-11 h-11 rounded-xl ${f.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <f.icon size={20} className={f.iconColor} strokeWidth={1.5} />
              </div>

              <h3 className="text-slate-800 font-semibold text-[15px] mb-2">{f.title}</h3>
              <p className="text-slate-400 text-[13px] leading-relaxed">{f.description}</p>

              {/* Hover arrow */}
              <div className="flex items-center gap-1 mt-5 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className={`text-[11px] font-semibold bg-gradient-to-r ${f.accent} bg-clip-text text-transparent`}>Learn more</span>
                <ArrowRight size={11} className="text-teal-500" />
              </div>

              {/* Subtle corner accent */}
              <div className={`absolute -bottom-6 -right-6 w-20 h-20 rounded-full bg-gradient-to-br ${f.accent} opacity-5 group-hover:opacity-10 transition-opacity blur-xl`} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
