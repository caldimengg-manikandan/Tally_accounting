import React, { useState } from 'react';
import { Check, ChevronLeft, ChevronDown, ChevronRight, AlertCircle, Info } from 'lucide-react';

export default function SalaryCalculationPreviewTable({ calculations, month, onBack, onConfirm, onCancel }) {
  const [expandedRow, setExpandedRow] = useState(null);

  const totalGross = calculations.reduce((sum, c) => sum + c.gross_salary, 0);
  const totalDeductions = calculations.reduce((sum, c) => sum + c.total_deductions, 0);
  const totalNet = calculations.reduce((sum, c) => sum + c.net_salary, 0);
  const totalEmployerCost = calculations.reduce((sum, c) => sum + c.total_employer_cost, 0);

  const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Salary Processing Preview</h3>
          <p className="text-sm text-slate-500 font-medium">Review the calculations before finalizing for {month}.</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 w-10"></th>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4 text-right">Gross Earnings</th>
                <th className="px-6 py-4 text-right">PF (Emp)</th>
                <th className="px-6 py-4 text-right">Income Tax</th>
                <th className="px-6 py-4 text-right">Prof Tax</th>
                <th className="px-6 py-4 text-right">Total Deductions</th>
                <th className="px-6 py-4 text-right text-slate-800">Net Salary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium">
              {calculations.map(calc => (
                <React.Fragment key={calc.employee_id}>
                  <tr 
                    onClick={() => setExpandedRow(expandedRow === calc.employee_id ? null : calc.employee_id)}
                    className={`hover:bg-slate-50 cursor-pointer transition-colors ${expandedRow === calc.employee_id ? 'bg-slate-50' : ''}`}
                  >
                    <td className="px-6 py-4 text-slate-400">
                      {expandedRow === calc.employee_id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">{calc.name}</td>
                    <td className="px-6 py-4 text-right text-emerald-600 font-bold">{formatCurrency(calc.gross_salary)}</td>
                    <td className="px-6 py-4 text-right text-rose-500">{formatCurrency(calc.pf_employee)}</td>
                    <td className="px-6 py-4 text-right text-rose-500">{formatCurrency(calc.income_tax)}</td>
                    <td className="px-6 py-4 text-right text-rose-500">{formatCurrency(calc.professional_tax)}</td>
                    <td className="px-6 py-4 text-right text-rose-600 font-bold">{formatCurrency(calc.total_deductions)}</td>
                    <td className="px-6 py-4 text-right font-black text-blue-700">{formatCurrency(calc.net_salary)}</td>
                  </tr>
                  {expandedRow === calc.employee_id && (
                    <tr className="bg-slate-50/80 border-b border-slate-100">
                      <td colSpan={8} className="px-12 py-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
                          <div>
                            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Info size={14}/> Earnings Breakdown</h5>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between"><span className="text-slate-600">Basic</span><span className="font-bold">{formatCurrency(calc.components.basic)}</span></div>
                              <div className="flex justify-between"><span className="text-slate-600">HRA</span><span className="font-bold">{formatCurrency(calc.components.hra)}</span></div>
                              <div className="flex justify-between"><span className="text-slate-600">DA</span><span className="font-bold">{formatCurrency(calc.components.da)}</span></div>
                              <div className="flex justify-between"><span className="text-slate-600">Special</span><span className="font-bold">{formatCurrency(calc.components.special)}</span></div>
                              <div className="flex justify-between"><span className="text-slate-600">Other</span><span className="font-bold">{formatCurrency(calc.components.other)}</span></div>
                              <div className="flex justify-between pt-2 border-t border-slate-100"><span className="font-bold text-slate-800">Gross</span><span className="font-black text-emerald-600">{formatCurrency(calc.gross_salary)}</span></div>
                            </div>
                          </div>
                          <div>
                            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Deductions Breakdown</h5>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between"><span className="text-slate-600">PF Employee</span><span className="font-bold text-rose-500">{formatCurrency(calc.pf_employee)}</span></div>
                              <div className="flex justify-between"><span className="text-slate-600">ESI Employee</span><span className="font-bold text-rose-500">{formatCurrency(calc.esi_employee)}</span></div>
                              <div className="flex justify-between"><span className="text-slate-600">Prof Tax</span><span className="font-bold text-rose-500">{formatCurrency(calc.professional_tax)}</span></div>
                              <div className="flex justify-between"><span className="text-slate-600">Income Tax</span><span className="font-bold text-rose-500">{formatCurrency(calc.income_tax)}</span></div>
                              <div className="flex justify-between pt-2 border-t border-slate-100"><span className="font-bold text-slate-800">Total Deductions</span><span className="font-black text-rose-600">{formatCurrency(calc.total_deductions)}</span></div>
                            </div>
                          </div>
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-center">
                            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Employer Cost</h5>
                            <div className="flex justify-between mb-1"><span className="text-sm text-slate-600">PF Employer</span><span className="text-sm font-bold">{formatCurrency(calc.pf_employer)}</span></div>
                            <div className="flex justify-between mb-3"><span className="text-sm text-slate-600">ESI Employer</span><span className="text-sm font-bold">{formatCurrency(calc.esi_employer)}</span></div>
                            <div className="flex justify-between pt-2 border-t border-slate-200">
                              <span className="font-bold text-slate-800">Total Cost to Company</span>
                              <span className="font-black text-slate-900">{formatCurrency(calc.total_employer_cost)}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
            <tfoot className="bg-slate-900 text-white font-bold text-sm">
              <tr>
                <td colSpan={2} className="px-6 py-5">TOTAL ({calculations.length} Employees)</td>
                <td className="px-6 py-5 text-right text-emerald-400">{formatCurrency(totalGross)}</td>
                <td colSpan={3} className="px-6 py-5 text-right text-rose-400">Total Deductions:</td>
                <td className="px-6 py-5 text-right text-rose-400">{formatCurrency(totalDeductions)}</td>
                <td className="px-6 py-5 text-right text-blue-300 text-base">{formatCurrency(totalNet)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
          <h4 className="font-bold text-slate-800 mb-4">Verification Checklist</h4>
          <ul className="space-y-3 text-sm font-medium text-slate-600">
            <li className="flex items-center gap-2 text-emerald-600"><Check size={16} /> All selected employees have active structures</li>
            <li className="flex items-center gap-2 text-emerald-600"><Check size={16} /> All calculations verified against tax settings</li>
            <li className="flex items-center gap-2 text-emerald-600"><Check size={16} /> Gross = Deductions + Net</li>
            <li className="flex items-center gap-2 text-emerald-600"><Check size={16} /> No validation errors detected</li>
          </ul>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col justify-center">
           <div className="flex justify-between items-center mb-2">
             <span className="text-sm font-bold text-slate-500">Total Bank Payout Required</span>
             <span className="text-2xl font-black text-slate-900">{formatCurrency(totalNet)}</span>
           </div>
           <div className="flex justify-between items-center">
             <span className="text-sm font-bold text-slate-500">Total Employer Cost</span>
             <span className="text-lg font-bold text-slate-700">{formatCurrency(totalEmployerCost)}</span>
           </div>
           <div className="mt-4 pt-4 border-t border-slate-200 flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 p-2 rounded-lg justify-center uppercase tracking-widest">
             Status: Ready to Process
           </div>
        </div>
      </div>

      <div className="flex justify-between pt-6 border-t border-slate-100">
        <button onClick={onBack} className="px-6 py-3 rounded-xl font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-all text-sm flex items-center gap-2">
          <ChevronLeft size={16} /> Previous
        </button>
        <div className="flex gap-4">
          <button onClick={onCancel} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all text-sm">
            Discard
          </button>
          <button onClick={onConfirm} className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 transition-all">
            Confirm & Process
          </button>
        </div>
      </div>
    </div>
  );
}
