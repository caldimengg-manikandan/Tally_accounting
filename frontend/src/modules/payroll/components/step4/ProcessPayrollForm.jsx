import React, { useState, useEffect } from 'react';
import { Users, Calendar, AlertCircle, CheckCircle2, ChevronRight, Calculator, Loader2 } from 'lucide-react';
import api from '../../../../services/api';
import SalaryCalculationPreviewTable from './SalaryCalculationPreviewTable';
import ProcessingProgress from './ProcessingProgress';
import CompletionSummary from './CompletionSummary';

export default function ProcessPayrollForm({ companyId, onComplete }) {
  const [step, setStep] = useState(1);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedMonth, setSelectedMonth] = useState('2024-05'); // default yyyy-MM
  const [selectionType, setSelectionType] = useState('ALL'); // ALL, SPECIFIC, DEPT
  const [selectedEmpIds, setSelectedEmpIds] = useState([]);
  
  const [calculations, setCalculations] = useState([]);
  const [calcLoading, setCalcLoading] = useState(false);
  const [processResult, setProcessResult] = useState(null);

  useEffect(() => {
    fetchEmployees();
  }, [companyId]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/payroll/${companyId}/employees-selection?status=ACTIVE`);
      setEmployees(data.employees || []);
      // Auto-select all by default
      setSelectedEmpIds((data.employees || []).map(e => e.id));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredEmployees = () => {
    return employees.filter(e => selectedEmpIds.includes(e.id));
  };

  const getSkippedEmployees = () => {
    if (selectionType === 'ALL') {
      return employees.filter(e => !selectedEmpIds.includes(e.id));
    }
    return [];
  };

  const handleNextToPreview = async () => {
    setCalcLoading(true);
    setStep(2);
    try {
      const selected = getFilteredEmployees();
      const results = [];
      for (const emp of selected) {
        const { data } = await api.post(`/payroll/${companyId}/calculate-single`, {
          employeeId: emp.id
        });
        results.push(data);
      }
      setCalculations(results);
    } catch (err) {
      console.error('Calculation Error:', err);
    } finally {
      setCalcLoading(false);
    }
  };

  const handleProcess = async () => {
    setStep(3);
  };

  const onProcessingComplete = (result) => {
    setProcessResult(result);
    setStep(4);
  };

  if (loading) return <div className="p-12 text-center text-slate-500 font-bold"><Loader2 className="animate-spin mx-auto mb-4" /> Loading employee data...</div>;

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden animate-fade-in">
      {/* Wizard Header */}
      <div className="bg-slate-900 text-white p-6 md:px-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Process Payroll</h2>
          <p className="text-sm text-slate-400 font-medium mt-1">Step {step} of 3: {step===1 ? 'Select Month & Employees' : step===2 ? 'Preview Calculations' : 'Processing'}</p>
        </div>
        <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-slate-500">
          <span className={step >= 1 ? 'text-blue-400' : ''}>1. Select</span>
          <ChevronRight size={14} />
          <span className={step >= 2 ? 'text-blue-400' : ''}>2. Preview</span>
          <ChevronRight size={14} />
          <span className={step >= 3 ? 'text-blue-400' : ''}>3. Complete</span>
        </div>
      </div>

      <div className="p-6 md:p-10">
        {step === 1 && (
          <div className="space-y-8 animate-in slide-in-from-right-4">
            {/* Section 1: Month Selection */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2">Section 1: Select Month & Year</h3>
              <div className="max-w-xs">
                <input 
                  type="month" 
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-blue-400 cursor-pointer"
                />
              </div>
            </div>

            {/* Section 2: Employee Selection */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2">Section 2: Select Employees</h3>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-700">
                  <input type="radio" name="empSelect" checked={selectionType === 'ALL'} onChange={() => {
                    setSelectionType('ALL');
                    setSelectedEmpIds(employees.map(e => e.id));
                  }} className="text-blue-600 focus:ring-blue-500 w-4 h-4" />
                  All Active Employees ({employees.length})
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-700 opacity-50">
                  <input type="radio" disabled name="empSelect" checked={selectionType === 'SPECIFIC'} onChange={() => setSelectionType('SPECIFIC')} className="w-4 h-4" />
                  Select Specific (Coming Soon)
                </label>
              </div>
            </div>

            {/* Section 3: Selected Employees */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
              <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Users size={16} className="text-blue-500" />
                Processing {getFilteredEmployees().length} employees:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getFilteredEmployees().map(e => (
                  <div key={e.id} className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col">
                    <span className="text-xs font-bold text-slate-500">{e.emp_code}</span>
                    <span className="font-bold text-slate-800">{e.name}</span>
                    <span className="text-xs font-medium text-emerald-600 mt-1">Gross: ₹{e.gross_salary_estimated}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 4: Warnings */}
            {getSkippedEmployees().length > 0 && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6">
                <h4 className="text-sm font-bold text-rose-800 mb-4 flex items-center gap-2">
                  <AlertCircle size={16} />
                  These employees will be SKIPPED:
                </h4>
                <ul className="space-y-2">
                  {getSkippedEmployees().map(e => (
                    <li key={e.id} className="text-sm font-medium text-rose-700 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                      {e.name}: {!e.hasSalaryStructure ? 'No salary structure found' : 'Missing bank account'}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Section 5: Buttons */}
            <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
              <button onClick={() => onComplete && onComplete()} className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all text-sm">
                Cancel
              </button>
              <button 
                onClick={handleNextToPreview}
                disabled={getFilteredEmployees().length === 0}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                Next: Preview <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in slide-in-from-right-4">
            {calcLoading ? (
              <div className="py-20 text-center">
                <Calculator className="w-12 h-12 text-blue-500 animate-pulse mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-800">Calculating Salaries...</h3>
                <p className="text-sm text-slate-500 mt-2">Applying tax rules and deductions.</p>
              </div>
            ) : (
              <SalaryCalculationPreviewTable 
                calculations={calculations} 
                month={selectedMonth}
                onBack={() => setStep(1)}
                onConfirm={handleProcess}
                onCancel={() => onComplete && onComplete()}
              />
            )}
          </div>
        )}

        {step === 3 && (
          <ProcessingProgress 
            calculations={calculations} 
            month={selectedMonth} 
            companyId={companyId}
            onComplete={onProcessingComplete}
          />
        )}

        {step === 4 && processResult && (
          <CompletionSummary 
            result={processResult} 
            onClose={() => onComplete && onComplete()} 
          />
        )}
      </div>
    </div>
  );
}
