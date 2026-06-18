import React, { useState, useEffect } from 'react';
import { salaryAPI } from '../../../../services/api';
import { Plus, Edit2, Trash2, Check, AlertCircle, Info, Layers, ChevronRight } from 'lucide-react';

export default function SalaryStructuresTab() {
  const [structures, setStructures] = useState([]);
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Modal / Form state
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState('add'); // 'add' or 'edit'
  const [selectedStructure, setSelectedStructure] = useState(null);

  // Form fields
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    gradeLevel: '',
    effectiveFrom: '',
    componentsList: [] // list of objects: { SalaryComponentId, checked, overrideCalculationType, overrideCalculationValue, displayOrder }
  });

  useEffect(() => {
    fetchStructuresAndComponents();
  }, []);

  const fetchStructuresAndComponents = async () => {
    setLoading(true);
    setError(null);
    try {
      const [structRes, compRes] = await Promise.all([
        salaryAPI.getStructures(),
        salaryAPI.getComponents()
      ]);

      if (structRes.data && structRes.data.success) {
        setStructures(structRes.data.data);
      }
      if (compRes.data && compRes.data.success) {
        setComponents(compRes.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error loading structures data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setFormMode('add');
    setSelectedStructure(null);
    
    // Initialize components list with unchecked states
    const list = components.map(c => ({
      SalaryComponentId: c.id,
      name: c.name,
      code: c.code,
      type: c.type,
      defaultCalcType: c.calculationType,
      defaultCalcValue: c.calculationValue,
      checked: false,
      overrideCalculationType: '',
      overrideCalculationValue: '',
      displayOrder: c.displayOrder
    }));

    setFormData({
      name: '',
      code: '',
      description: '',
      gradeLevel: '',
      effectiveFrom: new Date().toISOString().split('T')[0],
      componentsList: list
    });

    setShowForm(true);
  };

  const handleOpenEdit = (struct) => {
    setFormMode('edit');
    setSelectedStructure(struct);

    // Map existing components to structure components checklist
    const activeMap = {};
    (struct.components || []).forEach(sc => {
      activeMap[sc.SalaryComponentId] = sc;
    });

    const list = components.map(c => {
      const activeItem = activeMap[c.id];
      return {
        SalaryComponentId: c.id,
        name: c.name,
        code: c.code,
        type: c.type,
        defaultCalcType: c.calculationType,
        defaultCalcValue: c.calculationValue,
        checked: !!activeItem,
        overrideCalculationType: activeItem ? (activeItem.overrideCalculationType || '') : '',
        overrideCalculationValue: activeItem ? (activeItem.overrideCalculationValue !== null ? parseFloat(activeItem.overrideCalculationValue) : '') : '',
        displayOrder: activeItem ? activeItem.displayOrder : c.displayOrder
      };
    });

    setFormData({
      name: struct.name,
      code: struct.code,
      description: struct.description || '',
      gradeLevel: struct.gradeLevel || '',
      effectiveFrom: struct.effectiveFrom,
      componentsList: list
    });

    setShowForm(true);
  };

  const handleCheckboxChange = (index, checked) => {
    setFormData(prev => {
      const newList = [...prev.componentsList];
      newList[index].checked = checked;
      return { ...prev, componentsList: newList };
    });
  };

  const handleComponentOverrideChange = (index, field, value) => {
    setFormData(prev => {
      const newList = [...prev.componentsList];
      newList[index][field] = value;
      return { ...prev, componentsList: newList };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const derivedCode = formData.name.trim().toUpperCase().replace(/\s+/g, '_');

    if (!formData.name.trim() || !formData.effectiveFrom) {
      setError('Name and Effective From date are required');
      return;
    }

    // Filter checked components
    const selectedComps = formData.componentsList
      .filter(c => c.checked)
      .map(c => ({
        SalaryComponentId: c.SalaryComponentId
      }));

    if (selectedComps.length === 0) {
      setError('Please select at least one salary component for this structure');
      return;
    }

    try {
      const payload = {
        name: formData.name,
        code: derivedCode,
        description: formData.description,
        effectiveFrom: formData.effectiveFrom,
        components: selectedComps
      };

      let res;
      if (formMode === 'add') {
        res = await salaryAPI.createStructure(payload);
      } else {
        res = await salaryAPI.updateStructure(selectedStructure.id, payload);
      }

      if (res.data && res.data.success) {
        setSuccess(`Salary structure ${formMode === 'add' ? 'created' : 'updated'} successfully`);
        setShowForm(false);
        fetchStructuresAndComponents();
        setTimeout(() => setSuccess(null), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this salary structure template?')) return;
    setError(null);
    setSuccess(null);
    try {
      const res = await salaryAPI.deleteStructure(id);
      if (res.data && res.data.success) {
        setSuccess('Salary structure deleted successfully');
        fetchStructuresAndComponents();
        setTimeout(() => setSuccess(null), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete structure. It might be assigned to active employees.');
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
      {error && !showForm && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-5 py-4 rounded-xl flex items-center gap-3 shadow-sm animation-fade-in">
          <AlertCircle className="text-rose-600" size={18} />
          <span className="text-sm font-semibold">{error}</span>
        </div>
      )}

      {/* Main List Mode */}
      {!showForm ? (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Layers className="text-blue-500" size={18} />
                Salary Structure Templates
              </h2>
              <p className="text-slate-500 text-xs mt-1">Define standard salary grades, linking various pay heads and applying customized values.</p>
            </div>
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-600/10 transition-all cursor-pointer self-stretch sm:self-auto justify-center"
            >
              <Plus size={16} /> Create Template
            </button>
          </div>

          {/* Cards Grid */}
          {loading ? (
            <div className="flex justify-center items-center h-48 bg-white rounded-2xl border border-slate-200">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : structures.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <Info className="mx-auto text-slate-400 mb-3" size={36} />
              <p className="text-slate-700 font-bold text-sm">No templates configured yet</p>
              <p className="text-slate-500 text-xs mt-1">Create a salary template to easily assign standard grades to employees.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {structures.map(struct => (
                <div key={struct.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-bold text-slate-400 tracking-wider uppercase font-mono">{struct.code}</span>
                        <h3 className="text-base font-bold text-slate-800 mt-0.5">{struct.name}</h3>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs">
                        Grade: {struct.gradeLevel || 'N/A'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mt-2 line-clamp-2">{struct.description || 'No description provided.'}</p>
                    
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Included Pay Heads ({struct.components?.length || 0})</span>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                        {struct.components?.map(sc => (
                          <span key={sc.id} className="inline-flex items-center gap-1 text-[11px] font-semibold bg-slate-50 text-slate-700 px-2 py-1 rounded border border-slate-150">
                            {sc.component?.name || 'Unknown'} 
                            <span className="text-[9px] text-slate-400 font-bold uppercase">({sc.component?.code})</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100 text-xs text-slate-400 font-semibold">
                    <span>Effective: {struct.effectiveFrom}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenEdit(struct)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors cursor-pointer"
                      >
                        <Edit2 size={13} /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(struct.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-colors cursor-pointer"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Form Creation Mode */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 animation-fade-in text-sm font-medium text-slate-700">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-6">
            <h3 className="font-bold text-slate-800 text-base">
              {formMode === 'add' ? 'Create Salary Structure Template' : 'Edit Salary Structure Template'}
            </h3>
            <button
              onClick={() => setShowForm(false)}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 uppercase tracking-wider cursor-pointer"
            >
              Back to List
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 px-5 py-4 rounded-xl flex items-center gap-3">
                <AlertCircle className="text-rose-600 flex-shrink-0" size={18} />
                <span className="text-xs font-semibold">{error}</span>
              </div>
            )}

            {/* General Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Structure/Grade Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Senior Software Engineer Grade"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Effective From *</label>
                <input
                  type="date"
                  required
                  value={formData.effectiveFrom}
                  onChange={(e) => setFormData(prev => ({ ...prev, effectiveFrom: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 transition-all font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description of who matches this pay structure..."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Link Pay Heads & Overrides */}
            <div className="border-t border-slate-100 pt-6">
              <h4 className="font-bold text-slate-800 text-sm mb-4">Link & Configure Pay Heads</h4>
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-wider">
                        <th className="px-6 py-4 w-12 text-center">Include</th>
                        <th className="px-6 py-4">Component</th>
                        <th className="px-6 py-4">Default Rules</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 text-sm font-medium">
                      {formData.componentsList.map((item, index) => (
                        <tr key={item.SalaryComponentId} className={`hover:bg-slate-50/50 transition-colors ${item.checked ? 'bg-blue-50/10' : ''}`}>
                          <td className="px-6 py-4 text-center">
                            <input
                              type="checkbox"
                              checked={item.checked}
                              onChange={(e) => handleCheckboxChange(index, e.target.checked)}
                              className="rounded text-blue-600 focus:ring-blue-500 border-slate-300 w-4 h-4 cursor-pointer"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <span className="font-bold text-slate-800 block">{item.name}</span>
                              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{item.code}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs font-semibold">
                            <span className="text-slate-500 uppercase block">{item.type}</span>
                            <span className="text-slate-400">{item.defaultCalcType}: {item.defaultCalcType === 'Percentage' ? `${item.defaultCalcValue}%` : `₹${item.defaultCalcValue}`}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-600/10 transition-all cursor-pointer"
              >
                {formMode === 'add' ? 'Save Structure' : 'Update Structure'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
