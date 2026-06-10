import React from 'react';
import { CheckCircle2, TrendingUp, ShieldCheck } from 'lucide-react';

export default function WhySection() {
  const reasons = [
    {
      icon: CheckCircle2,
      title: 'Accurate Accounting',
      description: 'Built on strict double-entry accounting principles to ensure your books are always balanced and audit-ready.',
    },
    {
      icon: TrendingUp,
      title: 'Business Insights',
      description: 'Go beyond basic bookkeeping with real-time dashboards and financial reports that drive growth.',
    },
    {
      icon: ShieldCheck,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security with role-based access control, comprehensive audit logs, and secure cloud infrastructure.',
    },
  ];

  return (
    <section id="about" className="py-24 bg-slate-50 border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-4">
            Why choose CalTally?
          </h2>
          <p className="text-lg text-slate-600">
            We built CalTally to be the most reliable, secure, and user-friendly accounting platform for growing businesses.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {reasons.map((reason, idx) => (
            <div key={idx} className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-6">
                <reason.icon size={32} strokeWidth={2} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{reason.title}</h3>
              <p className="text-slate-600 leading-relaxed">{reason.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
