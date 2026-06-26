import React, { useState, useEffect, useMemo } from 'react';
import { salaryAPI } from '../../../../services/api';
import { Plus, Edit2, Check, AlertCircle, Sparkles, Loader2, ArrowLeft } from 'lucide-react';

const STANDARD_COMPONENTS = [
  { code: 'BASIC', name: 'Basic Pay', type: 'Earning', calculationType: 'Percentage', calculationBase: 'CTC', calculationValue: 50, isTaxable: true, displayOrder: 1 },
  { code: 'HRA', name: 'House Rent Allowance', type: 'Earning', calculationType: 'Percentage', calculationBase: 'BASIC', calculationValue: 50, isTaxable: true, displayOrder: 2 },
  { code: 'CONVEYANCE', name: 'Conveyance Allowance', type: 'Earning', calculationType: 'Fixed', calculationValue: 1600, isTaxable: true, displayOrder: 3 },
  { code: 'CEA', name: 'Children Education Allowance', type: 'Earning', calculationType: 'Fixed', calculationValue: 0, isTaxable: true, displayOrder: 4 },
  { code: 'TA', name: 'Transport Allowance', type: 'Earning', calculationType: 'Fixed', calculationValue: 1600, isTaxable: true, displayOrder: 5 },
  { code: 'TRAVELLING', name: 'Travelling Allowance', type: 'Earning', calculationType: 'Fixed', calculationValue: 0, isTaxable: true, displayOrder: 6 },
  { code: 'FIXED', name: 'Fixed Allowance', type: 'Earning', calculationType: 'Fixed', calculationValue: 0, isTaxable: true, displayOrder: 7 },
  { code: 'OVERTIME', name: 'Overtime Allowance', type: 'Earning', componentNature: 'Variable', calculationType: 'Fixed', calculationValue: 0, isTaxable: true, displayOrder: 8 },
  { code: 'GRATUITY', name: 'Gratuity', type: 'Earning', componentNature: 'Variable', calculationType: 'Fixed', calculationValue: 0, isTaxable: true, displayOrder: 9 },
  { code: 'BONUS', name: 'Bonus', type: 'Earning', componentNature: 'Variable', calculationType: 'Fixed', calculationValue: 0, isTaxable: true, displayOrder: 10 },
  { code: 'COMM', name: 'Commission', type: 'Earning', componentNature: 'Variable', calculationType: 'Fixed', calculationValue: 0, isTaxable: true, displayOrder: 11 },
  { code: 'LEAVE_ENCASHMENT', name: 'Leave Encashment', type: 'Earning', componentNature: 'Variable', calculationType: 'Fixed', calculationValue: 0, isTaxable: true, displayOrder: 12 },
  { code: 'NOTICE_PAY', name: 'Notice Pay', type: 'Earning', componentNature: 'Variable', calculationType: 'Fixed', calculationValue: 0, isTaxable: true, displayOrder: 13 },
  { code: 'HOLD_SALARY', name: 'Hold Salary', type: 'Deduction', componentNature: 'Variable', calculationType: 'Fixed', calculationValue: 0, isTaxable: false, displayOrder: 14 }
];

export default function SalaryComponentsTab() {
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  
  // Full page view state
  const [currentView, setCurrentView] = useState('list'); // 'list', 'add', 'edit'
  const [selectedComp, setSelectedComp] = useState(null);

  // Form fields
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'Earning',
    componentNature: 'Fixed',
    calculationType: 'Fixed',
    calculationBase: 'BASIC',
    calculationValue: 0,
    isStatutory: false,
    isTaxable: true,
    displayOrder: 0,
    description: ''
  });

  useEffect(() => {
    if (currentView === 'list') {
      fetchComponents();
    }
  }, [currentView]);

  const fetchComponents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await salaryAPI.getComponents();
      if (res.data && res.data.success) {
        setComponents(res.data.data);
      } else {
        setError('Failed to fetch salary components');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error loading salary components');
    } finally {
      setLoading(false);
    }
  };

  const mergedComponents = useMemo(() => {
    const apiComponentsMap = new Map();
    components.forEach(c => apiComponentsMap.set(c.code.toUpperCase(), c));
    
    const result = [];
    
    // Add standard components first
    STANDARD_COMPONENTS.forEach(std => {
      const dbComp = apiComponentsMap.get(std.code);
      if (dbComp && dbComp.isActive !== false) {
        result.push({ ...dbComp, isStandard: true, isActiveInDB: true });
        apiComponentsMap.delete(std.code);
      } else {
        result.push({ ...std, isStandard: true, isActiveInDB: false, id: `std-${std.code}` });
        if (dbComp) apiComponentsMap.delete(std.code); // Remove inactive from map
      }
    });

    // Add remaining custom components
    Array.from(apiComponentsMap.values()).forEach(c => {
      if (c.isActive !== false) {
        result.push({ ...c, isStandard: false, isActiveInDB: true });
      }
    });

    return result;
  }, [components]);

  const handleToggleComponent = async (comp, isChecked) => {
    setError(null);
    setSuccess(null);
    setTogglingId(comp.id);

    try {
      if (isChecked) {
        // Create it
        const payload = {
          name: comp.name,
          code: comp.code,
          type: comp.type || 'Earning',
          componentNature: comp.componentNature || 'Fixed',
          calculationType: comp.calculationType || 'Fixed',
          calculationBase: comp.calculationBase || (comp.code === 'BASIC' ? 'CTC' : 'BASIC'),
          calculationValue: comp.calculationValue || 0,
          isStatutory: comp.isStatutory || false,
          isTaxable: comp.isTaxable !== false,
          displayOrder: comp.displayOrder || 0
        };
        await salaryAPI.createComponent(payload);
        setSuccess(`${comp.name} activated successfully`);
      } else {
        // Delete it
        if (!comp.isActiveInDB || comp.id.startsWith('std-')) return;
        await salaryAPI.deleteComponent(comp.id);
        setSuccess(`${comp.name} deactivated successfully`);
      }
      await fetchComponents();
    } catch (err) {
      setError(err.response?.data?.error || `Failed to ${isChecked ? 'activate' : 'deactivate'} component. It might be used in a Salary Structure.`);
      setTimeout(() => setError(null), 5000);
    } finally {
      setTogglingId(null);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const handleOpenAdd = () => {
    setSelectedComp(null);
    setFormData({
      name: '',
      code: '',
      type: 'Earning',
      componentNature: 'Fixed',
      calculationType: 'Fixed',
      calculationBase: 'BASIC',
      calculationValue: 0,
      isStatutory: false,
      isTaxable: true,
      displayOrder: components.length + 1,
      description: ''
    });
    setCurrentView('add');
  };

  const handleOpenEdit = (comp) => {
    setSelectedComp(comp);
    setFormData({
      name: comp.name,
      code: comp.code,
      type: comp.type,
      componentNature: comp.componentNature || 'Fixed',
      calculationType: comp.calculationType,
      calculationBase: comp.calculationBase || (comp.code === 'BASIC' ? 'CTC' : 'BASIC'),
      calculationValue: parseFloat(comp.calculationValue) || 0,
      isStatutory: comp.isStatutory,
      isTaxable: comp.isTaxable,
      displayOrder: comp.displayOrder,
      description: comp.description || ''
    });
    setCurrentView('edit');
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Form validation
    if (!formData.name.trim() || !formData.code.trim()) {
      setError('Name and Code are required');
      return;
    }

    try {
      const payload = {
        ...formData,
        calculationValue: parseFloat(formData.calculationValue) || 0
      };

      let res;
      if (currentView === 'add' || (selectedComp && !selectedComp.isActiveInDB)) {
        res = await salaryAPI.createComponent(payload);
      } else {
        res = await salaryAPI.updateComponent(selectedComp.id, payload);
      }

      if (res.data && res.data.success) {
        setSuccess(res.data.message || `Salary component ${currentView === 'add' || !selectedComp?.isActiveInDB ? 'activated' : 'updated'} successfully`);
        setCurrentView('list');
        setTimeout(() => setSuccess(null), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Operation failed');
    }
  };

  // Full Page View for Add/Edit Form
  if (currentView === 'add' || currentView === 'edit') {
    return (
      <div className="animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="px-8 py-6 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
            <button 
              onClick={() => setCurrentView('list')}
              className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors cursor-pointer"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                {currentView === 'add' ? 'Add Salary Component' : (selectedComp && !selectedComp.isActiveInDB ? 'Review & Activate Component' : 'Edit Salary Component')}
              </h2>
              <p className="text-sm text-slate-500 mt-1">Configure settings and calculation rules for this payroll component.</p>
            </div>
          </div>

          {/* Form */}
          <div className="p-8 max-w-3xl">
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 px-5 py-4 rounded-xl flex items-center gap-3 shadow-sm mb-6 animation-fade-in">
                <AlertCircle className="text-rose-600" size={18} />
                <span className="text-sm font-semibold">{error}</span>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 1. Component Name & Code */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-slate-600 mb-1.5">{formData.type === 'Earning' ? 'Earning Name' : 'Deduction Name'} <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 rounded-md border border-slate-300 outline-none focus:border-blue-500 transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1.5">Short Code <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="code"
                    required
                    value={formData.code}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 rounded-md border border-slate-300 outline-none focus:border-blue-500 transition-all uppercase text-sm"
                  />
                </div>
              </div>

              {/* 2. Type & Nature */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-slate-600 mb-1.5">Component Type</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 rounded-md border border-slate-300 outline-none focus:border-blue-500 transition-all bg-white text-sm"
                  >
                    <option value="Earning">Earning (Adds to Gross)</option>
                    <option value="Deduction">Deduction (Subtracts from Gross)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-3">Component Nature</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="componentNature"
                        value="Fixed"
                        checked={formData.componentNature === 'Fixed'}
                        onChange={(e) => setFormData(prev => ({ ...prev, componentNature: e.target.value }))}
                        className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-sm text-slate-800">Fixed</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="componentNature"
                        value="Variable"
                        checked={formData.componentNature === 'Variable'}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          componentNature: e.target.value,
                          calculationType: 'Fixed' // Force flat amount for variable
                        }))}
                        className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-sm text-slate-800">Variable</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* 3. Calculation Type (Only show if Fixed) */}
              {formData.componentNature === 'Fixed' && (
                <div className="pt-2">
                  <label className="block text-sm text-slate-600 mb-3">Calculation Type <span className="text-red-500">*</span></label>
                  <div className="space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="radio"
                        name="calculationType"
                        value="Fixed"
                        checked={formData.calculationType === 'Fixed'}
                        onChange={(e) => setFormData(prev => ({ ...prev, calculationType: e.target.value }))}
                        className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-sm text-slate-800">Flat Amount</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="radio"
                        name="calculationType"
                        value="Percentage"
                        checked={formData.calculationType !== 'Fixed'}
                        onChange={(e) => setFormData(prev => ({ ...prev, calculationType: e.target.value }))}
                        className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-800">Percentage of</span>
                        <select
                          name="calculationBase"
                          value={formData.calculationBase || 'BASIC'}
                          onChange={(e) => setFormData(prev => ({ ...prev, calculationBase: e.target.value }))}
                          className="px-2 py-1 text-sm rounded border border-slate-300 outline-none focus:border-blue-500 max-w-[200px]"
                        >
                          <option value="CTC">Cost to Company (CTC)</option>
                          <option value="BASIC">Basic Pay</option>
                        </select>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* 4. Value */}
              <div className="pt-2 w-1/2 pr-3">
                <label className="block text-sm text-slate-600 mb-1.5">
                  {formData.calculationType === 'Fixed' ? 'Enter Amount' : 'Enter Percentage'} <span className="text-red-500">*</span>
                </label>
                <div className="flex shadow-sm rounded-md">
                  <input
                    type="number"
                    step="0.01"
                    name="calculationValue"
                    required
                    value={formData.calculationValue}
                    onChange={handleInputChange}
                    className="flex-1 min-w-0 block w-full px-3 py-2.5 rounded-none rounded-l-md border border-slate-300 outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm text-slate-800"
                  />
                  <span className="inline-flex items-center px-4 rounded-r-md border border-l-0 border-slate-300 bg-slate-50 text-slate-500 text-sm font-medium">
                    {formData.calculationType === 'Fixed' ? '₹' : '%'}
                  </span>
                </div>
              </div>

              {/* 5. Tax Status */}
              <div className="pt-4 pb-4">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="isTaxable"
                    checked={formData.isTaxable}
                    onChange={handleInputChange}
                    className="rounded text-blue-600 focus:ring-blue-500 border-slate-300 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-sm text-slate-800">This earning is subject to Income Tax</span>
                </label>
              </div>

              {/* Form Actions */}
              <div className="pt-6 mt-6 border-t border-slate-200 flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setCurrentView('list')}
                  className="px-6 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors cursor-pointer text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-600/20 transition-all cursor-pointer text-sm"
                >
                  {currentView === 'add' ? 'Add Component' : (selectedComp && !selectedComp.isActiveInDB ? 'Activate Component' : 'Update Component')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Main List View
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Messages */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-4 rounded-xl flex items-center gap-3 shadow-sm animation-fade-in">
          <Check className="text-emerald-600" size={18} />
          <span className="text-sm font-semibold">{success}</span>
        </div>
      )}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-5 py-4 rounded-xl flex items-center gap-3 shadow-sm animation-fade-in">
          <AlertCircle className="text-rose-600" size={18} />
          <span className="text-sm font-semibold">{error}</span>
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="text-blue-500" size={18} />
            Salary Components Master
          </h2>
          <p className="text-slate-500 text-xs mt-1">Configure earnings, deductions, and statutory component formulas for your payroll.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-600/10 transition-all cursor-pointer self-stretch sm:self-auto justify-center"
        >
          <Plus size={16} /> Add Component
        </button>
      </div>

      {/* Components List */}
      {loading && components.length === 0 ? (
        <div className="flex justify-center items-center h-48 bg-white rounded-2xl border border-slate-200">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                  <th className="px-4 py-3 w-10 text-center"><Check size={14} className="mx-auto" /></th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Earning Type</th>
                  <th className="px-4 py-3">Calculation Type</th>
                  <th className="px-4 py-3">Consider for EPF</th>
                  <th className="px-4 py-3">Consider for ESI</th>
                  <th className="px-4 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600 text-sm font-medium bg-white">
                {mergedComponents.map((comp) => {
                  let epf = 'No';
                  let esi = 'No';
                  let earningType = comp.name;
                  const lowerName = comp.name.toLowerCase();

                  // EPF Logic
                  if (lowerName === 'basic') epf = 'Yes';
                  else if (['conveyance allowance', 'children education allowance', 'transport allowance', 'travelling allowance', 'fixed allowance'].includes(lowerName)) {
                    epf = 'Yes (If PF Wage < 15k)';
                  }

                  // ESI Logic
                  if (['basic', 'house rent allowance', 'children education allowance', 'transport allowance', 'fixed allowance', 'overtime allowance', 'commission'].includes(lowerName)) {
                    esi = 'Yes';
                  }

                  // Earning Type Override
                  if (lowerName === 'hold salary') earningType = 'Hold Salary (Non Taxable)';

                  // Calculation Type Text
                  let calcText = '';
                  const natureStr = comp.componentNature || 'Fixed';
                  
                  if (natureStr === 'Variable') {
                    calcText = `Variable; Flat Amount`;
                  } else {
                    if (comp.calculationType === 'Percentage') {
                      calcText = `Fixed; ${parseFloat(comp.calculationValue)}% of ${comp.calculationBase === 'CTC' ? 'CTC' : 'Basic'}`;
                    } else {
                      calcText = comp.calculationValue && parseFloat(comp.calculationValue) > 0 
                        ? `Fixed; Flat amount of ${parseFloat(comp.calculationValue)}`
                        : `Fixed; Flat Amount`;
                    }
                  }

                  return (
                    <tr key={comp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4 text-center">
                        {togglingId === comp.id ? (
                          <Loader2 size={16} className="animate-spin mx-auto text-blue-500" />
                        ) : (
                          <input 
                            type="checkbox"
                            className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                            checked={comp.isActiveInDB}
                            onChange={(e) => handleToggleComponent(comp, e.target.checked)}
                          />
                        )}
                      </td>
                      <td className="px-4 py-4 font-bold text-blue-600 cursor-pointer hover:underline" onClick={() => handleOpenEdit(comp)}>
                        {comp.name}
                      </td>
                      <td className="px-4 py-4 text-slate-800">{earningType}</td>
                      <td className="px-4 py-4 text-slate-800">{calcText}</td>
                      <td className="px-4 py-4 text-slate-800">{epf}</td>
                      <td className="px-4 py-4 text-slate-800">{esi}</td>
                      <td className="px-4 py-4 text-right">
                        {comp.isActiveInDB && (
                          <div className="flex items-center justify-end">
                            <button
                              onClick={() => handleOpenEdit(comp)}
                              className="w-6 h-6 rounded border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-300 transition-all cursor-pointer bg-white"
                              title="Edit Details"
                            >
                              <Edit2 size={12} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
