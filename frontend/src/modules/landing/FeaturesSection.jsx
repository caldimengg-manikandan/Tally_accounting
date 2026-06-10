import React from 'react';
import { BookOpen, Receipt, Wallet, ShoppingBag, Users, PieChart, ArrowRight } from 'lucide-react';

export default function FeaturesSection() {
  const features = [
    { icon: BookOpen, title: 'Smart Accounting', description: 'Automated double-entry journals, reconciliation, and ledger management — built for Indian GAAP.', accent: 'from-teal-400 to-cyan-500', glow: 'rgba(20,184,166,0.15)' },
    { icon: Receipt, title: 'Invoicing & GST', description: 'GST-compliant invoices, e-invoicing, recurring billing, and payment tracking in one place.', accent: 'from-indigo-400 to-violet-500', glow: 'rgba(99,102,241,0.15)' },
    { icon: Wallet, title: 'Expense Control', description: 'Categorize spending, manage vendor payables, and track every rupee leaving your business.', accent: 'from-rose-400 to-pink-500', glow: 'rgba(244,63,94,0.15)' },
    { icon: ShoppingBag, title: 'Inventory', description: 'Real-time stock tracking, multi-warehouse support, and automated reorder alerts.', accent: 'from-amber-400 to-orange-500', glow: 'rgba(251,191,36,0.15)' },
    { icon: Users, title: 'Payroll', description: 'Process salaries, track attendance, generate payslips, and stay PF/ESI compliant.', accent: 'from-blue-400 to-sky-500', glow: 'rgba(56,189,248,0.15)' },
    { icon: PieChart, title: 'Reports & Analytics', description: 'P&L, Balance Sheet, Cash Flow, Trial Balance — real-time insights for smarter decisions.', accent: 'from-emerald-400 to-teal-500', glow: 'rgba(52,211,153,0.15)' },
  ];

  return (
    <section id="features" className="py-28 bg-[#060d1a] relative overflow-hidden">
      {/* Subtle grid background */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '80px 80px'
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
          <div>
            <span className="text-teal-400 text-[11px] font-semibold uppercase tracking-widest">Platform Features</span>
            <h2 className="text-3xl md:text-4xl font-semibold text-white mt-3 leading-snug">
              Built for growing<br />
              <span className="text-white/40 font-light">Indian businesses.</span>
            </h2>
          </div>
          <p className="text-white/40 text-sm max-w-xs leading-relaxed">
            Every feature is designed around the real workflow of Indian SMEs — not adapted from foreign software.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, idx) => (
            <div key={idx}
              className="group relative p-7 rounded-2xl border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06] transition-all duration-300 cursor-default overflow-hidden"
              style={{ boxShadow: `inset 0 0 60px ${f.glow}` }}>
              {/* Glow behind icon */}
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.accent} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <f.icon size={20} className="text-white" strokeWidth={1.5} />
              </div>

              <h3 className="text-white font-semibold text-[15px] mb-2">{f.title}</h3>
              <p className="text-white/40 text-[13px] leading-relaxed">{f.description}</p>

              {/* Hover arrow */}
              <div className="flex items-center gap-1 mt-5 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className={`text-[11px] font-semibold bg-gradient-to-r ${f.accent} bg-clip-text text-transparent`}>Learn more</span>
                <ArrowRight size={11} className="text-teal-400" />
              </div>

              {/* Corner glow decoration */}
              <div className={`absolute -bottom-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br ${f.accent} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity`} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
