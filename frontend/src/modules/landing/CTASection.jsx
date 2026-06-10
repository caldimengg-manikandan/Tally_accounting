import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function CTASection() {
  const navigate = useNavigate();

  return (
    <section className="relative py-28 bg-[#060d1a] overflow-hidden">
      {/* Radial glow from center */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[700px] h-[300px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.15) 0%, rgba(20,184,166,0.08) 50%, transparent 70%)' }}
        />
      </div>

      {/* Grid lines */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '80px 80px'
        }}
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8">
          <Sparkles size={12} className="text-teal-400" />
          <span className="text-[11px] text-white/50 tracking-widest uppercase font-medium">Free to start · No credit card</span>
        </div>

        <h2 className="text-3xl md:text-5xl font-light text-white leading-tight mb-4">
          Your business finances,<br />
          <span className="font-semibold" style={{ background: 'linear-gradient(135deg, #5eead4, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            finally in control.
          </span>
        </h2>

        <p className="text-white/35 text-base mt-4 mb-10 max-w-md mx-auto leading-relaxed">
          Join thousands of Indian SMEs who've replaced spreadsheets and manual ledgers with CalTally.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button onClick={() => navigate('/login')}
            className="flex items-center gap-2 px-8 py-4 rounded-2xl text-sm font-semibold text-[#060d1a] transition-all hover:-translate-y-1 hover:shadow-[0_0_40px_rgba(94,234,212,0.3)]"
            style={{ background: 'linear-gradient(135deg, #5eead4, #818cf8)' }}>
            Create Free Account <ArrowRight size={15} />
          </button>
          <button onClick={() => navigate('/login')}
            className="px-8 py-4 rounded-2xl text-sm font-medium text-white/50 border border-white/10 hover:border-white/20 hover:text-white/70 transition-all">
            Talk to Sales
          </button>
        </div>
      </div>
    </section>
  );
}
