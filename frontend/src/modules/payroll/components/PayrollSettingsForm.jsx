import React, { useState, useEffect } from 'react';
import { 
  Building2, Percent, Calculator, Briefcase, FileText, Calendar, Wallet, Check, AlertCircle, Loader2, Info, RefreshCcw, Sparkles
} from 'lucide-react';
import api from '../../../services/api'; // using global api instance
import SalaryComponentsTab from './salary/SalaryComponentsTab';

export default function PayrollSettingsForm({ companyId, initialSettings, onSaveSuccess }) {
  const [activeSection, setActiveSection] = useState('components');
  
  const [formData, setFormData] = useState({
    pfApplicable: true,
    pfEmployeeRate: 12.00,
    pfEmployerRate: 12.00,
    pfCap: 1800,
    pfRegistrationNumber: '',
    esiApplicable: false,
    esiEmployeeRate: 0.75,
    esiEmployerRate: 3.25,
    esiRegistrationNumber: '',
    ptMonthlyAmount: 200.00,
    standardDeduction: 50000.00,
    incomeTaxSlabs: [
      { min: 0, max: 250000, rate: 0 },
      { min: 250000, max: 500000, rate: 5 },
      { min: 500000, max: 1000000, rate: 20 },
      { min: 1000000, max: null, rate: 30 }
    ],
    tanNumber: '',
    payrollFrequency: 'Monthly',
    allowanceExemptions: {
      hraExemption: true,
      ltaExemption: false
    }
  });

  const [testCalc, setTestCalc] = useState({ basic: 50000, gross: 80000 });
  const [calcResult, setCalcResult] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (initialSettings && Object.keys(initialSettings).length > 0) {
      setFormData(prev => ({ ...prev, ...initialSettings }));
    }
  }, [initialSettings]);

  const handleTestCalculation = async () => {
    try {
      setLoading(true);
      const { data } = await api.post('/payroll/settings/test-calculation', {
        basic: testCalc.basic,
        gross: testCalc.gross,
        settings: formData
      });
      setCalcResult(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Test calculation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const { data } = await api.put(`/payroll/${companyId}/settings`, formData);
      setSuccess('Payroll settings updated successfully!');
      if (onSaveSuccess) onSaveSuccess(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const sections = [
    { id: 'components', label: 'Custom Allowances', icon: Sparkles },
    { id: 'pf', label: 'Provident Fund (PF)', icon: Briefcase },
    { id: 'esi', label: 'Employee State Insurance (ESI)', icon: Building2 },
    { id: 'pt', label: 'Professional Tax (PT)', icon: Wallet },
    { id: 'it', label: 'Income Tax Slabs', icon: Percent },
    { id: 'company', label: 'Company Info', icon: FileText },
    { id: 'frequency', label: 'Payroll Frequency', icon: Calendar },
    { id: 'exemptions', label: 'Allowance Exemptions', icon: Calculator }
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-fade-in">
      {/* Left Column: Form Sections */}
      <div className="flex-1 space-y-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex gap-2 overflow-x-auto">
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap
                ${activeSection === s.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
            >
              <s.icon size={16} />
              {s.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 min-h-[400px]">
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-sm font-bold text-rose-700">
              <AlertCircle size={18} className="shrink-0" /> {error}
            </div>
          )}
          
          {success && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-sm font-bold text-emerald-700">
              <Check size={18} className="shrink-0" /> {success}
            </div>
          )}

          {/* Section: Custom Components (Allowances) */}
          {activeSection === 'components' && (
            <div className="animate-in slide-in-from-right-4 duration-300">
              <SalaryComponentsTab />
            </div>
          )}

          {/* Section: PF */}
          {activeSection === 'pf' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Provident Fund Settings</h3>
                  <p className="text-sm text-slate-500 font-medium">Configure EPF deduction rates for your employees.</p>
                </div>
                <label className="flex items-center cursor-pointer gap-3">
                  <span className="text-sm font-bold text-slate-600 uppercase tracking-wide">Enable PF</span>
                  <div className="relative">
                    <input type="checkbox" className="sr-only" checked={formData.pfApplicable} onChange={e => setFormData({...formData, pfApplicable: e.target.checked})} />
                    <div className={`block w-14 h-8 rounded-full transition-colors ${formData.pfApplicable ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${formData.pfApplicable ? 'transform translate-x-6' : ''}`}></div>
                  </div>
                </label>
              </div>

              {formData.pfApplicable && (
                <div className="space-y-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm text-slate-700 mb-2">EPF Number</label>
                      <input 
                        type="text" 
                        placeholder="AA/AAA/0000000/XXX" 
                        value={formData.pfRegistrationNumber} 
                        onChange={e => setFormData({...formData, pfRegistrationNumber: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-all" 
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-sm text-slate-700 mb-2">
                        Deduction Cycle <Info size={14} className="text-slate-400" />
                      </label>
                      <input 
                        type="text" 
                        value={formData.payrollFrequency} 
                        disabled
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-600 outline-none cursor-not-allowed" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-200">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Employee Contribution (%)</label>
                      <input type="number" step="0.01" value={formData.pfEmployeeRate} onChange={e => setFormData({...formData, pfEmployeeRate: parseFloat(e.target.value)})}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-blue-500 transition-all" />
                      <p className="text-xs text-slate-400 mt-2 font-medium">Standard is 12.00%</p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Employer Contribution (%)</label>
                      <input type="number" step="0.01" value={formData.pfEmployerRate} onChange={e => setFormData({...formData, pfEmployerRate: parseFloat(e.target.value)})}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-blue-500 transition-all" />
                      <p className="text-xs text-slate-400 mt-2 font-medium">Standard is 12.00%</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">PF Wage Calculation Rule</label>
                    <select
                      value={parseFloat(formData.pfCap) === 1800 ? 'capped' : 'uncapped'}
                      onChange={(e) => setFormData({ ...formData, pfCap: e.target.value === 'capped' ? 1800 : 9999999 })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all shadow-sm"
                    >
                      <option value="capped">Restrict PF Wage to ₹15,000 (Max ₹1,800/month)</option>
                      <option value="uncapped">Calculate exactly 12% on Actual Basic Wage (Uncapped)</option>
                    </select>
                    <p className="text-xs text-slate-500 mt-2">
                      <span className="font-bold text-slate-700">Capped (Default):</span> Recommended. The maximum PF deducted will be exactly ₹1,800. <br/>
                      <span className="font-bold text-slate-700">Uncapped:</span> Voluntary PF. Deducts exactly 12% of the employee's full Basic Salary, regardless of how high it is.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section: ESI */}
          {activeSection === 'esi' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">ESI Settings</h3>
                  <p className="text-sm text-slate-500 font-medium">Employee State Insurance deduction rates.</p>
                </div>
                <label className="flex items-center cursor-pointer gap-3">
                  <span className="text-sm font-bold text-slate-600 uppercase tracking-wide">Enable ESI</span>
                  <div className="relative">
                    <input type="checkbox" className="sr-only" checked={formData.esiApplicable} onChange={e => setFormData({...formData, esiApplicable: e.target.checked})} />
                    <div className={`block w-14 h-8 rounded-full transition-colors ${formData.esiApplicable ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${formData.esiApplicable ? 'transform translate-x-6' : ''}`}></div>
                  </div>
                </label>
              </div>

              {formData.esiApplicable ? (
                <div className="grid grid-cols-2 gap-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Employee Contribution (%)</label>
                    <input type="number" step="0.01" value={formData.esiEmployeeRate} onChange={e => setFormData({...formData, esiEmployeeRate: parseFloat(e.target.value)})}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-blue-400" />
                    <p className="text-xs text-slate-400 mt-2 font-medium">Standard is 0.75%</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Employer Contribution (%)</label>
                    <input type="number" step="0.01" value={formData.esiEmployerRate} onChange={e => setFormData({...formData, esiEmployerRate: parseFloat(e.target.value)})}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-blue-400" />
                    <p className="text-xs text-slate-400 mt-2 font-medium">Standard is 3.25%</p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl text-blue-700 text-sm font-bold flex gap-2 items-center">
                  <Info size={16} /> ESI is disabled. Typically not applicable for pure IT services unless gross is below standard limit.
                </div>
              )}
            </div>
          )}

          {/* Section: PT */}
          {activeSection === 'pt' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Professional Tax (PT)</h3>
                <p className="text-sm text-slate-500 font-medium">State-wise professional tax deductions.</p>
              </div>

              <div className="max-w-md bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Monthly Deduction (₹)</label>
                <input type="number" step="1" value={formData.ptMonthlyAmount} onChange={e => setFormData({...formData, ptMonthlyAmount: parseFloat(e.target.value)})}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-blue-400" />
                <p className="text-xs text-slate-400 mt-2 font-medium">E.g., ₹200 for Tamil Nadu</p>
              </div>
            </div>
          )}

          {/* Section: Income Tax */}
          {activeSection === 'it' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Income Tax Slabs</h3>
                <p className="text-sm text-slate-500 font-medium">Configure annual tax slabs. Monthly tax is deduced automatically.</p>
              </div>

              <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Standard Deduction (₹)</label>
                <input type="number" step="1" value={formData.standardDeduction} onChange={e => setFormData({...formData, standardDeduction: parseFloat(e.target.value)})}
                  className="max-w-md w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-blue-400 mb-6" />

                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-4 text-xs font-bold text-slate-400 uppercase tracking-wider px-2">
                    <div>Min Income (₹)</div>
                    <div>Max Income (₹)</div>
                    <div>Tax Rate (%)</div>
                  </div>
                  {formData.incomeTaxSlabs.map((slab, i) => (
                    <div key={i} className="grid grid-cols-3 gap-4">
                      <input type="number" value={slab.min} onChange={(e) => {
                        const newSlabs = [...formData.incomeTaxSlabs];
                        newSlabs[i].min = parseFloat(e.target.value) || 0;
                        setFormData({...formData, incomeTaxSlabs: newSlabs});
                      }} className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none" />
                      
                      <input type="number" value={slab.max || ''} placeholder="Infinity" onChange={(e) => {
                        const newSlabs = [...formData.incomeTaxSlabs];
                        newSlabs[i].max = e.target.value ? parseFloat(e.target.value) : null;
                        setFormData({...formData, incomeTaxSlabs: newSlabs});
                      }} className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none" />
                      
                      <input type="number" value={slab.rate} onChange={(e) => {
                        const newSlabs = [...formData.incomeTaxSlabs];
                        newSlabs[i].rate = parseFloat(e.target.value) || 0;
                        setFormData({...formData, incomeTaxSlabs: newSlabs});
                      }} className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Additional Sections can be filled similarly */}
          {(activeSection === 'company' || activeSection === 'frequency' || activeSection === 'exemptions') && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="p-8 text-center text-slate-500 font-medium bg-slate-50 rounded-2xl border border-slate-100">
                <p>Additional configuration options for {activeSection} can be customized here.</p>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end gap-4">
            <button 
              onClick={() => {
                setFormData({...initialSettings});
                setSuccess('Reset to defaults successfully.');
              }}
              className="px-6 py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-all text-sm"
            >
              Reset Changes
            </button>
            <button 
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-all text-sm flex items-center gap-2 shadow-xl shadow-slate-900/10"
            >
              {saving && <Loader2 size={16} className="animate-spin" />} Save Configuration
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Test Calculation Tool */}
      <div className="w-full lg:w-96 shrink-0 space-y-6">
        <div className="bg-gradient-to-b from-blue-900 to-slate-900 rounded-3xl p-6 shadow-xl text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 text-white/5">
            <Calculator size={120} />
          </div>
          <h3 className="text-lg font-bold mb-1 relative z-10">Test Calculation</h3>
          <p className="text-xs text-blue-200 font-medium mb-6 relative z-10">Verify tax rules instantly</p>
          
          <div className="space-y-4 relative z-10">
            <div>
              <label className="block text-[10px] font-bold text-blue-300 uppercase tracking-widest mb-1.5">Monthly Basic (₹)</label>
              <input type="number" value={testCalc.basic} onChange={e => setTestCalc({...testCalc, basic: parseFloat(e.target.value)})}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm font-bold text-white outline-none focus:border-blue-400 placeholder-white/30" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-blue-300 uppercase tracking-widest mb-1.5">Monthly Gross (₹)</label>
              <input type="number" value={testCalc.gross} onChange={e => setTestCalc({...testCalc, gross: parseFloat(e.target.value)})}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm font-bold text-white outline-none focus:border-blue-400 placeholder-white/30" />
            </div>
            <button 
              onClick={handleTestCalculation}
              disabled={loading}
              className="w-full mt-2 py-3 bg-blue-500 hover:bg-blue-400 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={14} />} Run Test
            </button>
          </div>

          {calcResult && (
            <div className="mt-6 pt-6 border-t border-white/10 space-y-3 relative z-10 animate-fade-in text-sm font-medium">
              <div className="flex justify-between items-center text-blue-100">
                <span>PF Employee</span>
                <span className="font-bold text-white">₹{calcResult.pfEmployee}</span>
              </div>
              <div className="flex justify-between items-center text-blue-100">
                <span>PF Employer</span>
                <span className="font-bold text-white">₹{calcResult.pfEmployer}</span>
              </div>
              <div className="flex justify-between items-center text-blue-100">
                <span>ESI</span>
                <span className="font-bold text-white">₹{calcResult.esi}</span>
              </div>
              <div className="flex justify-between items-center text-blue-100">
                <span>Prof. Tax</span>
                <span className="font-bold text-white">₹{calcResult.pt}</span>
              </div>
              <div className="flex justify-between items-center text-blue-100">
                <span>Income Tax</span>
                <span className="font-bold text-white">₹{calcResult.incomeTax}</span>
              </div>
              <div className="flex justify-between items-center pt-3 mt-3 border-t border-white/10 text-emerald-300">
                <span>Total Deductions</span>
                <span className="font-bold">₹{calcResult.totalDeductions}</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-white/10">
                <span className="font-bold uppercase tracking-wider text-xs">Net Salary</span>
                <span className="text-lg font-bold text-white">₹{calcResult.netSalary}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
