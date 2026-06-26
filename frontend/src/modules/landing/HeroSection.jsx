import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, TrendingUp, Shield } from 'lucide-react';
import DashboardPreview from './DashboardPreview';

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen bg-gradient-to-b from-slate-50 via-white to-white overflow-hidden flex flex-col">
      {/* Soft background mesh */}
      <div className="absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(20,184,166,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(99,102,241,0.08) 0%, transparent 50%)',
        }}
      />

      {/* Subtle grid */}
      <div className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: 'linear-gradient(rgba(15,23,42,1) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,1) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 pb-16 flex flex-col items-center">

        {/* Trust pill */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 border border-teal-100 mb-10">
          <Shield size={12} className="text-teal-500" />
          <span className="text-[11px] text-teal-700 font-medium tracking-widest uppercase">Double Entry Accounting · Invoicing · Reports</span>
        </div>

        {/* Headline */}
        <h1 className="text-center max-w-4xl">
          <span className="block text-4xl md:text-[64px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600 leading-[1.1] tracking-tight">
            One platform.
          </span>
          <span className="block text-4xl md:text-[64px] font-bold leading-[1.1] tracking-tight mt-1 bg-gradient-to-r from-teal-600 via-indigo-500 to-sky-500 bg-clip-text text-transparent">
            Total financial clarity.
          </span>
        </h1>

        <p className="mt-6 text-base md:text-lg text-slate-500 max-w-xl text-center leading-relaxed font-light">
          CalTally is a double-entry accounting and billing application — managing invoices, items, vouchers, payroll, and reporting.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 mt-10">
          <button onClick={() => navigate('/login')}
            className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold text-sm text-white transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-teal-200"
            style={{ background: 'linear-gradient(135deg, #0d9488, #6366f1)' }}>
            Start Free — No Card Needed <ArrowRight size={16} />
          </button>
          <button onClick={() => navigate('/login')}
            className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold text-sm text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all">
            Explore Platform
          </button>
        </div>



        {/* Dashboard Preview */}
        <div className="w-full mt-16 relative">
          {/* Frame bar */}
          <div className="w-full rounded-t-2xl bg-slate-100 border border-slate-200 border-b-0 px-4 py-3 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
            </div>
            <div className="flex-1 mx-4 h-5 rounded-md bg-white border border-slate-200 flex items-center justify-center">
              <span className="text-[10px] text-slate-400 font-mono">app.caltally.com/dashboard</span>
            </div>
          </div>

          <div className="rounded-b-2xl overflow-hidden border border-slate-200 border-t-0 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <DashboardPreview />
          </div>
        </div>
      </div>
    </section>
  );
}
