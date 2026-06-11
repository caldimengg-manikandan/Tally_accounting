import React from 'react';

export default function Footer() {
  const links = {
    Product: ['Features', 'Pricing', 'Integrations', 'Updates'],
    Company: ['About', 'Careers', 'Contact', 'Partners'],
    Resources: ['Documentation', 'Help Center', 'Blog', 'Webinars'],
    Legal: ['Privacy Policy', 'Terms of Service', 'Security', 'Compliance']
  };

  return (
    <footer className="bg-slate-50 text-slate-400 border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-400 to-indigo-500 flex items-center justify-center shadow-md">
                <span className="text-white font-black text-xs">CT</span>
              </div>
              <span className="text-slate-700 font-semibold text-sm">Cal<span className="text-teal-500">Tally</span></span>
            </div>
            <p className="text-[12px] text-slate-400 leading-relaxed">
              Intelligent cloud accounting for growing Indian businesses.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <h4 className="text-[11px] font-semibold text-slate-500 mb-4 uppercase tracking-widest">{category}</h4>
              <ul className="space-y-2.5">
                {items.map(item => (
                  <li key={item}>
                    <a href="#" className="text-[12px] text-slate-400 hover:text-slate-700 transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-slate-400">© 2026 CalTally Technologies Pvt. Ltd. All rights reserved.</p>
          <div className="flex items-center gap-5">
            {['Twitter', 'LinkedIn', 'GitHub'].map(s => (
              <a key={s} href="#" className="text-[11px] text-slate-400 hover:text-slate-700 transition-colors">{s}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
