import React from 'react';
import { ArrowUpRight, ArrowDownRight, TrendingUp, DollarSign, Activity } from 'lucide-react';

export default function ProductShowcase() {
  return (
    <section id="solutions" className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Text Content */}
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[11px] font-bold tracking-wide uppercase mb-6">
              <Activity size={14} /> Real-time Insights
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-6">
              Complete visibility into your financial health
            </h2>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              Don't wait until the end of the month to know where your business stands. CalTally provides real-time dashboards and aging reports so you can make informed decisions instantly.
            </p>
            
            <ul className="space-y-4">
              {[
                'Track revenue and expense trends over time',
                'Identify overdue receivables to improve cash flow',
                'Manage payables and vendor relationships',
                'Monitor bank balances across multiple accounts'
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="mt-1 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                  </div>
                  <span className="text-slate-700 font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Dashboard Showcase Visual */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-100 to-purple-50 rounded-[3rem] transform rotate-3 scale-105 -z-10"></div>
            <div className="bg-white p-6 rounded-2xl shadow-2xl border border-slate-100">
              {/* Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <div className="text-sm font-bold text-slate-800">Financial Overview</div>
                <div className="flex gap-2">
                  <span className="px-2 py-1 rounded bg-slate-100 text-[10px] font-semibold text-slate-600">This Month</span>
                </div>
              </div>
              
              {/* Top Metrics */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-[11px] font-semibold text-slate-500 mb-1 flex items-center justify-between">
                    Revenue <ArrowUpRight size={14} className="text-emerald-500" />
                  </div>
                  <div className="text-2xl font-black text-slate-900">$84,000</div>
                  <div className="text-[10px] text-emerald-600 mt-1 font-medium">+14.2% from last month</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-[11px] font-semibold text-slate-500 mb-1 flex items-center justify-between">
                    Expenses <ArrowDownRight size={14} className="text-rose-500" />
                  </div>
                  <div className="text-2xl font-black text-slate-900">$32,000</div>
                  <div className="text-[10px] text-rose-600 mt-1 font-medium">+2.4% from last month</div>
                </div>
              </div>

              {/* Chart Area */}
              <div className="mb-6">
                <div className="text-[11px] font-semibold text-slate-500 mb-4">Revenue vs Expenses</div>
                <div className="h-40 flex items-end justify-between gap-2 px-2">
                  {[
                    { r: 40, e: 20 }, { r: 50, e: 30 }, { r: 60, e: 25 }, 
                    { r: 80, e: 40 }, { r: 70, e: 35 }, { r: 90, e: 45 }, { r: 100, e: 50 }
                  ].map((data, i) => (
                    <div key={i} className="flex flex-col justify-end w-full h-full gap-1 group">
                      <div className="w-full bg-blue-500 rounded-sm transition-all" style={{ height: `${data.r}%` }}></div>
                      <div className="w-full bg-rose-400 rounded-sm transition-all" style={{ height: `${data.e}%` }}></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Transactions List */}
              <div>
                <div className="text-[11px] font-semibold text-slate-500 mb-3">Recent Transactions</div>
                <div className="space-y-3">
                  {[
                    { name: 'Acme Corp', type: 'Invoice Paid', amount: '+$4,500', color: 'text-emerald-600' },
                    { name: 'AWS Cloud', type: 'Expense', amount: '-$1,240', color: 'text-slate-900' },
                    { name: 'Stripe Payout', type: 'Transfer', amount: '+$12,400', color: 'text-emerald-600' },
                  ].map((tx, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                          <DollarSign size={14} className="text-slate-600" />
                        </div>
                        <div>
                          <div className="text-[13px] font-bold text-slate-900">{tx.name}</div>
                          <div className="text-[10px] text-slate-500">{tx.type}</div>
                        </div>
                      </div>
                      <div className={`text-[13px] font-bold ${tx.color}`}>{tx.amount}</div>
                    </div>
                  ))}
                </div>
              </div>
              
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
