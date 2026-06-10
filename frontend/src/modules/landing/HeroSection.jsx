import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, TrendingUp, Shield, Zap, BarChart2, CheckCircle } from 'lucide-react';
import DashboardPreview from './DashboardPreview';

export default function HeroSection() {
  const navigate = useNavigate();

  const metrics = [
    { label: 'Invoices Raised', value: '₹3.2Cr', sub: 'This Quarter', up: true },
    { label: 'GST Compliance', value: '100%', sub: 'Returns Filed', up: true },
    { label: 'Cost Saved', value: '40hrs', sub: 'Per Month', up: true },
  ];

  return (
    <section className="relative min-h-screen bg-[#060d1a] overflow-hidden flex flex-col">
      {/* Background mesh grid */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'linear-gradient(rgba(100,200,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(100,200,255,0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }}
      />

      {/* Glow orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-gradient-to-b from-indigo-600/20 via-teal-600/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[400px] rounded-full bg-gradient-to-tl from-teal-500/10 to-transparent blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 pb-16 flex flex-col items-center">

        {/* Trust pill */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-10">
          <Shield size={12} className="text-teal-400" />
          <span className="text-[11px] text-white/60 font-medium tracking-widest uppercase">GST Compliant · Indian GAAP · Made for Bharat</span>
        </div>

        {/* Headline — asymmetric weight */}
        <h1 className="text-center max-w-4xl">
          <span className="block text-4xl md:text-[64px] font-light text-white/90 leading-[1.1] tracking-tight">
            One platform.
          </span>
          <span className="block text-4xl md:text-[64px] font-bold leading-[1.1] tracking-tight mt-1"
            style={{ background: 'linear-gradient(135deg, #5eead4 0%, #818cf8 50%, #38bdf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Total financial clarity.
          </span>
        </h1>

        <p className="mt-6 text-base md:text-lg text-white/40 max-w-xl text-center leading-relaxed font-light">
          CalTally connects your entire finance stack — invoicing, inventory, payroll, GST, and reporting — into a single intelligent workspace.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 mt-10">
          <button onClick={() => navigate('/login')}
            className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold text-sm text-[#060d1a] transition-all hover:-translate-y-1 hover:shadow-[0_0_40px_rgba(94,234,212,0.4)]"
            style={{ background: 'linear-gradient(135deg, #5eead4, #818cf8)' }}>
            Start Free — No Card Needed <ArrowRight size={16} />
          </button>
          <button onClick={() => navigate('/login')}
            className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold text-sm text-white/70 border border-white/10 hover:border-white/20 hover:text-white hover:bg-white/5 transition-all">
            Explore Platform
          </button>
        </div>

        {/* Live metric pills */}
        <div className="flex flex-wrap justify-center gap-4 mt-12">
          {metrics.map((m, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="w-7 h-7 rounded-lg bg-teal-400/10 flex items-center justify-center">
                <TrendingUp size={12} className="text-teal-400" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{m.value}</p>
                <p className="text-white/40 text-[10px]">{m.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Dashboard Preview */}
        <div className="w-full mt-16 relative">
          {/* Top fade gradient to blend preview in */}
          <div className="absolute -top-10 left-0 right-0 h-20 bg-gradient-to-b from-[#060d1a] to-transparent z-20 pointer-events-none" />

          {/* Frame bar */}
          <div className="w-full rounded-t-2xl bg-[#111827] border border-white/10 border-b-0 px-4 py-3 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
            </div>
            <div className="flex-1 mx-4 h-5 rounded-md bg-white/5 flex items-center justify-center">
              <span className="text-[10px] text-white/30 font-mono">app.caltally.com/dashboard</span>
            </div>
          </div>

          <div className="rounded-b-2xl overflow-hidden border border-white/10 border-t-0 shadow-[0_40px_120px_rgba(0,0,0,0.8)]">
            <DashboardPreview />
          </div>
        </div>
      </div>
    </section>
  );
}
