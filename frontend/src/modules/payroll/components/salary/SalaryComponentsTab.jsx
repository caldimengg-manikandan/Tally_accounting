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

      {/* Add/Edit Modal - Simplified Layout */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-base">
                {modalMode === 'add' ? 'Add Salary Component' : 'Edit Salary Component'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 font-medium text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5 flex-1 text-sm text-slate-700">
              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl flex items-center gap-2">
                  <AlertCircle className="text-rose-600 flex-shrink-0" size={16} />
                  <span className="text-xs font-semibold">{error}</span>
                </div>
              )}

              {/* 1. Component Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Component Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Basic Salary"
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 outline-none focus:border-blue-500 transition-all shadow-sm"
                />
              </div>

              {/* 2. Calculation Type */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Calculation Type</label>
                <select
                  name="calculationType"
                  value={formData.calculationType === 'Fixed' ? 'Fixed' : 'Percentage'}
                  onChange={(e) => setFormData(prev => ({ ...prev, calculationType: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 outline-none focus:border-blue-500 transition-all bg-white shadow-sm"
                >
                  <option value="Percentage">Percentage (%)</option>
                  <option value="Fixed">Flat Amount (₹)</option>
                </select>
              </div>

              {/* 3. Value */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Value</label>
                <input
                  type="number"
                  step="0.01"
                  name="calculationValue"
                  required
                  value={formData.calculationValue}
                  onChange={handleInputChange}
                  placeholder="Enter amount or percentage"
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 outline-none focus:border-blue-500 transition-all font-semibold text-slate-800 shadow-sm"
                />
              </div>

              {/* 4. Tax Status */}
              <div className="pt-2 pb-4">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="isTaxable"
                    checked={formData.isTaxable}
                    onChange={handleInputChange}
                    className="rounded text-blue-600 focus:ring-blue-500 border-slate-300 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-slate-800">This earning is subject to Income Tax</span>
                </label>
              </div>

              {/* Footer Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-sm transition-all cursor-pointer shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-600/20 transition-all cursor-pointer uppercase tracking-wider"
                >
                  Update Component
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
