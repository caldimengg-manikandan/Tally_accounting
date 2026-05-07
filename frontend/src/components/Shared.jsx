import React from 'react';
import { ChevronRight } from 'lucide-react';

export const SidebarItem = ({ icon: Icon, label, active, onClick, badge }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3.5 px-4 py-3 transition-all duration-300 group relative border-l-4 ${
      active 
        ? 'bg-blue-50 border-[#1e3a8a] text-[#1e3a8a]' 
        : 'border-transparent text-ink-500 hover:bg-surface-50 hover:text-ink-900'
    }`}
  >
    <div className={`p-1 transition-colors ${active ? 'text-[#1e3a8a]' : 'group-hover:text-primary-600'}`}>
      <Icon size={18} strokeWidth={active ? 2.5 : 2} />
    </div>
    <span className={`text-[13px] tracking-tight ${active ? 'font-bold' : 'font-semibold'}`}>{label}</span>
    {badge && <span className="ml-auto text-[10px] font-bold bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center">{badge}</span>}
  </button>
);

export const StatCard = ({ title, amount, trend, trendType, icon: CardIcon }) => (
  <div className="group relative bg-white p-6 rounded-3xl border border-gray-100/80 shadow-card hover:shadow-card-hover transition-all duration-500 hover:-translate-y-1 overflow-hidden">
    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary-50 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className="relative z-10">
      <div className="flex justify-between items-start mb-5">
        <div className="w-11 h-11 bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl flex items-center justify-center text-primary-600 shadow-inner-glow">
          {CardIcon ? <CardIcon size={20} /> : <div className="p-1"><ChevronRight size={16} /></div>}
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
          trendType === 'up' ? 'text-emerald-700 bg-emerald-50' : 'text-red-600 bg-red-50'
        }`}>
          {trend}
        </div>
      </div>
      <p className="text-ink-400 text-xs font-bold uppercase tracking-widest mb-1">{title}</p>
      <p className="text-2xl font-bold text-ink-900 tracking-tight">₹{amount}</p>
    </div>
  </div>
);
