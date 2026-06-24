import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function CTASection() {
  const navigate = useNavigate();

  return (
    <section className="relative py-28 bg-gradient-to-br from-slate-50 to-white overflow-hidden">
      {/* Soft glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[700px] h-[300px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.07) 0%, rgba(20,184,166,0.04) 50%, transparent 70%)' }}
        />
      </div>

      {/* Subtle grid */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(15,23,42,1) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,1) 1px, transparent 1px)',
          backgroundSize: '80px 80px'
        }}
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-100 mb-8">
          <Sparkles size={12} className="text-teal-500" />
          <span className="text-[11px] text-teal-700 tracking-widest uppercase font-medium">Free to start · No credit card</span>
        </div>

        <h2 className="text-3xl md:text-5xl font-light text-slate-800 leading-tight mb-4">
          Your business finances,<br />
          <span className="font-semibold bg-gradient-to-r from-teal-600 via-indigo-500 to-sky-500 bg-clip-text text-transparent">
            finally in control.
          </span>
        </h2>

        <p className="text-slate-400 text-base mt-4 mb-10 max-w-md mx-auto leading-relaxed">
          Join growing businesses who've replaced spreadsheets and manual ledgers with CalTally.
        </p>

        <div className="flex justify-center">
          <button onClick={() => navigate('/login')}
            className="flex items-center gap-2 px-8 py-4 rounded-2xl text-sm font-semibold text-white transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-teal-200"
            style={{ background: 'linear-gradient(135deg, #0d9488, #6366f1)' }}>
            Create Free Account <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </section>
  );
}
