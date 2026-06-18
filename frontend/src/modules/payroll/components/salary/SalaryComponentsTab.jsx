import React, { useState, useEffect } from 'react';
import { salaryAPI } from '../../../../services/api';
import { Plus, Edit2, Trash2, Check, AlertCircle, Info, Sparkles } from 'lucide-react';

export default function SalaryComponentsTab() {
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Form modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedComp, setSelectedComp] = useState(null);

  // Form fields
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'Earning',
    calculationType: 'Percentage',
    calculationBase: 'CTC',
    calculationValue: '',
    isStatutory: false,
    isTaxable: true,
    displayOrder: 0,
    description: ''
  });

  useEffect(() => {
    fetchComponents();
  }, []);

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

  const handleOpenAdd = () => {
    setModalMode('add');
    setSelectedComp(null);
    setFormData({
      name: '',
      code: '',
      type: 'Earning',
      calculationType: 'Percentage',
      calculationBase: 'CTC',
      calculationValue: '',
      isStatutory: false,
      isTaxable: true,
      displayOrder: components.length + 1,
      description: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (comp) => {
    setModalMode('edit');
    setSelectedComp(comp);
    setFormData({
      name: comp.name,
      code: comp.code,
      type: comp.type,
      calculationType: comp.calculationType,
      calculationBase: comp.calculationBase || 'CTC',
      calculationValue: parseFloat(comp.calculationValue),
      isStatutory: comp.isStatutory,
      isTaxable: comp.isTaxable,
      displayOrder: comp.displayOrder,
      description: comp.description || ''
    });
    setShowModal(true);
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
      if (modalMode === 'add') {
        res = await salaryAPI.createComponent(payload);
      } else {
        res = await salaryAPI.updateComponent(selectedComp.id, payload);
      }

      if (res.data && res.data.success) {
        setSuccess(res.data.message || `Salary component ${modalMode === 'add' ? 'created' : 'updated'} successfully`);
        setShowModal(false);
        fetchComponents();
        setTimeout(() => setSuccess(null), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this salary component?')) return;
    setError(null);
    setSuccess(null);
    try {
      const res = await salaryAPI.deleteComponent(id);
      if (res.data && res.data.success) {
        setSuccess('Salary component deleted successfully');
        fetchComponents();
        setTimeout(() => setSuccess(null), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete component. It might be used by active salary structures.');
      setTimeout(() => setError(null), 5000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Messages */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-4 rounded-xl flex items-center gap-3 shadow-sm animation-fade-in">
          <Check className="text-emerald-600" size={18} />
          <span className="text-sm font-semibold">{success}</span>
        </div>
      )}
      {error && !showModal && (
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
      {loading ? (
        <div className="flex justify-center items-center h-48 bg-white rounded-2xl border border-slate-200">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : components.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
          <Info className="mx-auto text-slate-400 mb-3" size={36} />
          <p className="text-slate-700 font-bold text-sm">No components configured yet</p>
          <p className="text-slate-500 text-xs mt-1">Click "Add Component" to start configuring payroll components.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-slate-200 text-black font-bold text-[11px] uppercase tracking-wider">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Earning Type</th>
                  <th className="px-4 py-3">Calculation Type</th>
                  <th className="px-4 py-3">Consider for EPF</th>
                  <th className="px-4 py-3">Consider for ESI</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600 text-sm font-medium bg-white">
                {components.map((comp) => {
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
                  if (comp.calculationType === 'Percentage') {
                    calcText = `Fixed; ${parseFloat(comp.calculationValue)}% of ${comp.calculationBase === 'CTC' ? 'CTC' : 'Basic'}`;
                  } else if (comp.calculationType === 'Fixed') {
                    calcText = comp.calculationValue && parseFloat(comp.calculationValue) > 0 
                      ? `Fixed; Flat amount of ${parseFloat(comp.calculationValue)}`
                      : `Fixed; Flat Amount`;
                  } else {
                    calcText = `Variable; Flat Amount`;
                  }

                  return (
                    <tr key={comp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4 text-blue-500 cursor-pointer hover:underline font-medium" onClick={() => handleOpenEdit(comp)}>
                        {comp.name}
                      </td>
                      <td className="px-4 py-4">{earningType}</td>
                      <td className="px-4 py-4">{calcText}</td>
                      <td className="px-4 py-4">{epf}</td>
                      <td className="px-4 py-4">{esi}</td>
                      <td className="px-4 py-4">
                        <span className={`font-semibold ${comp.isActive !== false ? 'text-emerald-500' : 'text-slate-400'}`}>
                          {comp.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end">
                          <button
                            onClick={() => handleOpenEdit(comp)}
                            className="w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center text-slate-300 hover:text-blue-500 hover:border-blue-200 transition-all cursor-pointer bg-white"
                            title="Edit"
                          >
                            <span className="leading-none pb-2 text-sm">...</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal - Professional Full Layout */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col animation-fade-in overflow-hidden">
          {/* Top Header Bar */}
          <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm z-10">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
              >
                &lt;
              </button>
              <div>
                <h2 className="text-xl font-semibold text-slate-800">
                  {modalMode === 'add' ? 'Add Earning' : 'Edit Earning'}
                </h2>
              </div>
            </div>
            <button 
              onClick={() => setShowModal(false)}
              className="text-slate-500 hover:text-slate-700 text-sm font-medium flex items-center gap-2"
            >
              Close Settings &times;
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto bg-white">
            <div className="max-w-6xl mx-auto p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {error && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl flex items-center gap-2">
                    <AlertCircle className="text-rose-600 flex-shrink-0" size={16} />
                    <span className="text-sm font-medium">{error}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                  
                  {/* Left Column */}
                  <div className="space-y-6">
                    {/* Earning Type */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Earning Type <span className="text-red-500">*</span></label>
                      <div className="flex gap-4 items-start">
                        <input
                          type="text"
                          disabled
                          value={formData.type === 'Earning' ? formData.name || 'Basic' : formData.type}
                          className="w-1/2 px-3 py-2 rounded border border-slate-200 bg-slate-50 text-slate-500 text-sm focus:outline-none"
                        />
                        <div className="w-1/2 bg-blue-50/50 text-blue-800 text-xs px-3 py-2 rounded flex items-start gap-2">
                          <Info size={14} className="mt-0.5 flex-shrink-0" />
                          <span>Fixed amount paid at the end of every month.</span>
                        </div>
                      </div>
                    </div>

                    {/* Earning Name */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Earning Name <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full max-w-md px-3 py-2 rounded border border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-sm shadow-sm"
                      />
                    </div>

                    {/* Name in Payslip */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Name in Payslip <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        name="code"
                        required
                        value={formData.code}
                        onChange={handleInputChange}
                        className="w-full max-w-md px-3 py-2 rounded border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-sm shadow-sm"
                      />
                    </div>

                    {/* Calculation Type */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-3">Calculation Type <span className="text-red-500">*</span></label>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="calculationType"
                            value="Fixed"
                            checked={formData.calculationType === 'Fixed'}
                            onChange={handleInputChange}
                            className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                          />
                          <span className="text-sm text-slate-700">Flat Amount</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="calculationType"
                            value="Percentage"
                            checked={formData.calculationType === 'Percentage'}
                            onChange={handleInputChange}
                            className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                          />
                          <span className="text-sm text-slate-700">Percentage of CTC</span>
                        </label>
                      </div>
                    </div>

                    {/* Amount / Percentage Input */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {formData.calculationType === 'Percentage' ? 'Enter Percentage' : 'Enter Amount'}
                      </label>
                      <div className="flex items-center max-w-[200px]">
                        {formData.calculationType === 'Fixed' && (
                          <span className="px-3 py-2 border border-r-0 border-slate-200 bg-slate-50 text-slate-500 rounded-l text-sm">₹</span>
                        )}
                        <input
                          type="number"
                          step="0.01"
                          name="calculationValue"
                          required
                          value={formData.calculationValue}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 border border-slate-200 focus:border-blue-400 outline-none text-sm shadow-sm ${formData.calculationType === 'Fixed' ? 'rounded-r border-l-0' : 'rounded-l border-r-0'}`}
                        />
                        {formData.calculationType === 'Percentage' && (
                          <span className="px-3 py-2 border border-l-0 border-slate-200 bg-slate-50 text-slate-500 rounded-r text-sm">%</span>
                        )}
                      </div>
                    </div>

                    {/* Active Checkbox */}
                    <div className="pt-2">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          name="isActive"
                          checked={true} // Hardcoded active toggle for UI mockup
                          onChange={() => {}}
                          className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-slate-700">Mark this as Active</span>
                      </label>
                    </div>
                  </div>

                  {/* Right Column: Other Configurations */}
                  <div>
                    <h3 className="text-base font-medium text-slate-800 mb-6">Other Configurations</h3>
                    <div className="space-y-6">
                      
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input type="checkbox" defaultChecked className="mt-1 w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500" />
                        <div>
                          <span className="text-sm text-slate-700 block">Make this earning a part of the employee's salary structure</span>
                        </div>
                      </label>

                      <label className="flex items-start gap-3 cursor-pointer">
                        <input 
                          type="checkbox" 
                          name="isTaxable"
                          checked={formData.isTaxable}
                          onChange={handleInputChange}
                          className="mt-1 w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500" 
                        />
                        <div>
                          <span className="text-sm text-slate-700 font-medium block mb-1">This is a taxable earning</span>
                          <span className="text-xs text-slate-500 block">The income tax amount will be divided equally and deducted every month across the financial year.</span>
                        </div>
                      </label>

                      <label className="flex items-start gap-3 cursor-pointer">
                        <input type="checkbox" defaultChecked className="mt-1 w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500" />
                        <div>
                          <span className="text-sm text-slate-700 font-medium block mb-1">Calculate on pro-rata basis</span>
                          <span className="text-xs text-slate-500 block">Pay will be adjusted based on employee working days.</span>
                        </div>
                      </label>

                      <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500" />
                          <span className="text-sm text-slate-700 font-medium">Consider for EPF Contribution</span>
                        </label>
                        <div className="pl-7 space-y-2">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input type="radio" name="epfRule" value="Always" className="w-4 h-4 text-slate-300 border-slate-300 focus:ring-blue-500" disabled />
                            <span className="text-sm text-slate-400">Always</span>
                          </label>
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input type="radio" name="epfRule" value="Conditional" defaultChecked className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500" />
                            <span className="text-sm text-slate-700 flex items-center gap-1">
                              Only when PF Wage is less than ₹ 15,000
                              <Info size={14} className="text-slate-400" />
                            </span>
                          </label>
                        </div>
                      </div>

                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500" />
                        <span className="text-sm text-slate-700 font-medium">Consider for ESI Contribution</span>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500" />
                        <span className="text-sm text-slate-700 font-medium">Show this component in payslip</span>
                      </label>

                    </div>
                  </div>
                </div>

                {/* Warning Note */}
                <div className="mt-12 bg-amber-50/50 border border-amber-100 p-4 rounded text-sm text-slate-700">
                  <span className="font-semibold text-amber-800">Note:</span> As you've already associated this component with one or more employees, you can only edit the Name and Amount/Percentage. The changes made to Amount/Percentage will apply only to new employees.
                </div>

                {/* Footer Buttons */}
                <div className="pt-6 pb-12 flex gap-4">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded shadow-sm transition-colors"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded shadow-sm transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
