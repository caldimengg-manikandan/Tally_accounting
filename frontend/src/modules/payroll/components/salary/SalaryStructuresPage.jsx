import React, { useState } from 'react';
import SalaryStructuresTab from './SalaryStructuresTab';
import SalaryAssignmentsTab from './SalaryAssignmentsTab';
import { Layers, UserCheck } from 'lucide-react';

export default function SalaryStructuresPage() {
  const [activeTab, setActiveTab] = useState('structures');

  const tabs = [
    {
      id: 'structures',
      label: 'Salary Structures',
      icon: Layers,
      component: SalaryStructuresTab
    },
    {
      id: 'assignments',
      label: 'Assign to Employees',
      icon: UserCheck,
      component: SalaryAssignmentsTab
    }
  ];

  const ActiveComponent = tabs.find(t => t.id === activeTab)?.component || SalaryStructuresTab;

  return (
    <div className="space-y-6">
      {/* Sub-tabs Navigation */}
      <div className="flex border-b border-slate-200 gap-1.5 p-1 bg-slate-50/50 rounded-xl border w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                isActive
                  ? 'bg-white text-blue-600 shadow-sm border border-slate-200/60'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-blue-500' : 'text-slate-400'} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content Panel */}
      <div className="animation-fade-in">
        <ActiveComponent />
      </div>
    </div>
  );
}
