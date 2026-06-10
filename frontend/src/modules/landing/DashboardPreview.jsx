import React from 'react';
import { Building2, LayoutDashboard, FileText, Users, ShoppingBag, Receipt, PieChart, Wallet, ChevronDown, Bell } from 'lucide-react';

export default function DashboardPreview() {
  return (
    <div className="relative w-full max-w-5xl mx-auto mt-12 mb-8 z-10 transition-transform duration-500 hover:-translate-y-2">
      {/* Dashboard container */}
      <div className="bg-white rounded-xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden border border-slate-200/50 flex flex-col h-[500px] md:h-[600px] w-full">
        
        {/* Browser Mockup Top Bar */}
        <div className="h-10 bg-slate-900 flex items-center px-4 gap-2 shrink-0">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <div className="mx-auto bg-slate-800 rounded-md h-6 w-1/3 flex items-center px-3">
            <span className="text-[10px] text-slate-400 font-mono">app.caltally.com/dashboard</span>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="flex flex-1 overflow-hidden bg-slate-50">
          {/* Sidebar */}
          <div className="w-48 bg-white border-r border-slate-100 hidden md:flex flex-col">
            <div className="h-14 border-b border-slate-50 flex items-center px-4 gap-2">
              <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center">
                <Building2 size={12} color="#fff" />
              </div>
              <span className="text-[12px] font-bold text-slate-900">CalTally</span>
            </div>
            <div className="flex-1 py-4 px-3 space-y-1">
              {[
                { icon: LayoutDashboard, label: 'Dashboard', active: true },
                { icon: Users, label: 'Customers' },
                { icon: ShoppingBag, label: 'Items' },
                { icon: FileText, label: 'Invoices' },
                { icon: Receipt, label: 'Expenses' },
                { icon: PieChart, label: 'Reports' },
                { icon: Wallet, label: 'Banking' },
              ].map((item, idx) => (
                <div key={idx} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-medium cursor-default ${
                  item.active ? 'bg-blue-50 text-blue-600' : 'text-slate-500'
                }`}>
                  <item.icon size={14} className={item.active ? 'text-blue-600' : 'text-slate-400'} />
                  {item.label}
                </div>
              ))}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Top Header */}
            <div className="h-14 bg-white border-b border-slate-100 flex items-center justify-between px-6 shrink-0">
              <div className="text-[13px] font-bold text-slate-800">Business Dashboard</div>
              <div className="flex items-center gap-4">
                <Bell size={14} className="text-slate-400" />
                <div className="w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center text-white text-[9px] font-bold">A</div>
              </div>
            </div>

            {/* Dashboard Body */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Receivables', value: '₹3,42,250', color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Total Payables', value: '₹1,12,400', color: 'text-rose-600', bg: 'bg-rose-50' },
                  { label: 'Cash Flow (MTD)', value: '₹2,29,850', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { label: 'GST Input Tax', value: '₹45,210', color: 'text-amber-600', bg: 'bg-amber-50' },
                ].map((card, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between h-24">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{card.label}</div>
                    <div className={`text-lg font-black ${card.color}`}>{card.value}</div>
                  </div>
                ))}
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Cash Flow Chart Mockup */}
                <div className="col-span-2 bg-white p-5 rounded-xl border border-slate-100 shadow-sm h-64 flex flex-col">
                  <div className="text-[12px] font-bold text-slate-800 mb-4 flex justify-between">
                    <span>Cash Flow Trend</span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">Last 6 Months <ChevronDown size={12}/></span>
                  </div>
                  <div className="flex-1 flex items-end justify-between gap-2 px-2 pb-2">
                    {[40, 65, 45, 80, 55, 90, 75, 100, 85, 110, 95, 120].map((h, i) => (
                      <div key={i} className="w-full bg-blue-100 rounded-t-sm relative group">
                        <div className="absolute bottom-0 w-full bg-blue-500 rounded-t-sm transition-all" style={{ height: `${h}%` }}></div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-[8px] text-slate-400 font-medium px-2 mt-2">
                    <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
                  </div>
                </div>

                {/* Expense Breakdown Mockup */}
                <div className="col-span-1 bg-white p-5 rounded-xl border border-slate-100 shadow-sm h-64 flex flex-col">
                  <div className="text-[12px] font-bold text-slate-800 mb-4">Expense Breakdown</div>
                  <div className="flex-1 flex items-center justify-center relative">
                    <div className="w-32 h-32 rounded-full border-[12px] border-slate-50 relative">
                      {/* Fake Donut Chart Segments using SVG */}
                      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full -rotate-90">
                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="#3b82f6" strokeWidth="20" strokeDasharray="180 251" />
                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="#eab308" strokeWidth="20" strokeDasharray="50 251" strokeDashoffset="-180" />
                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="#ef4444" strokeWidth="20" strokeDasharray="21 251" strokeDashoffset="-230" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-[10px] text-slate-400 font-medium">Total</span>
                        <span className="text-[13px] font-black text-slate-800">₹1.12L</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500"></div><span className="text-slate-600">Operations</span></div>
                      <span className="font-bold">72%</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-yellow-500"></div><span className="text-slate-600">Marketing</span></div>
                      <span className="font-bold">20%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
