import React, { useState, useEffect } from 'react';
import { salaryAPI, payrollAPI } from '../../../../services/api';
import { Plus, Trash2, Check, AlertCircle, Info, UserCheck, Calendar, Calculator, Eye } from 'lucide-react';

export default function SalaryAssignmentsTab() {
  const [assignments, setAssignments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form modal state
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
    salaryStructureId: '',
    ctcAmount: '',
    basicAmount: '',
    effectiveFrom: new Date().toISOString().split('T')[0],
    remarks: ''
  });

  // Preview breakdown state
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);

  // Detail view state
  const [viewDetails, setViewDetails] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Fetch preview when input variables change
  useEffect(() => {
    if (formData.ctcAmount && (formData.salaryStructureId || structures.length > 0)) {
      calculateLivePreview();
    } else {
      setPreviewData(null);
    }
  }, [formData.ctcAmount, formData.basicAmount, formData.salaryStructureId]);

  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [assignRes, empRes, structRes] = await Promise.all([
        salaryAPI.getAssignments(),
        payrollAPI.getEmployeesFiltered({ includeArchived: 'false', limit: 1000 }),
        salaryAPI.getStructures()
      ]);

      if (assignRes.data && assignRes.data.success) {
        setAssignments(assignRes.data.data);
      }
      if (empRes.data && empRes.data.success) {
        setEmployees(empRes.data.data || []);
      }
      if (structRes.data && structRes.data.success) {
        setStructures(structRes.data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error loading assignment details');
    } finally {
      setLoading(false);
    }
  };

  const calculateLivePreview = async () => {
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const payload = {
        ctcAmount: parseFloat(formData.ctcAmount),
        salaryStructureId: formData.salaryStructureId || null,
        basicAmount: formData.basicAmount ? parseFloat(formData.basicAmount) : null
      };
      
      const res = await salaryAPI.calculatePreview(payload);
      if (res.data && res.data.success) {
        setPreviewData(res.data.data);
      }
    } catch (err) {
      setPreviewError('Failed to compute live breakdown preview');
      setPreviewData(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleOpenAssign = () => {
    setFormData({
      employeeId: '',
      salaryStructureId: structures[0]?.id || '',
      ctcAmount: '',
      basicAmount: '',
      effectiveFrom: new Date().toISOString().split('T')[0],
      remarks: ''
    });
    setPreviewData(null);
    setError(null);
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.employeeId || !formData.salaryStructureId || !formData.ctcAmount || !formData.effectiveFrom) {
      setError('Employee, Structure, CTC Amount, and Effective From are required fields');
      return;
    }

    try {
      const payload = {
        employeeId: formData.employeeId,
        salaryStructureId: formData.salaryStructureId,
        ctcAmount: parseFloat(formData.ctcAmount),
        basicAmount: formData.basicAmount ? parseFloat(formData.basicAmount) : null,
        effectiveFrom: formData.effectiveFrom,
        remarks: formData.remarks
      };

      const res = await salaryAPI.assignSalary(payload);
      if (res.data && res.data.success) {
        setSuccess('Salary structure assigned successfully to employee');
        setShowModal(false);
        fetchInitialData();
        setTimeout(() => setSuccess(null), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to assign salary structure');
    }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this salary assignment?')) return;
    setError(null);
    setSuccess(null);
    try {
      const res = await salaryAPI.deleteAssignment(id);
      if (res.data && res.data.success) {
        setSuccess('Salary assignment deactivated successfully');
        fetchInitialData();
        setTimeout(() => setSuccess(null), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to deactivate assignment');
    }
  };

  const handleViewBreakdown = async (employeeId) => {
    setLoading(true);
    try {
      const res = await salaryAPI.getEmployeeAssignment(employeeId);
      if (res.data && res.data.success) {
        setViewDetails(res.data.data);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Could not load salary breakdown details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-sm font-medium text-slate-700">
      {/* Messages */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-4 rounded-xl flex items-center gap-3 shadow-sm animation-fade-in">
          <Check className="text-emerald-600" size={18} />
          <span className="text-sm font-semibold">{success}</span>
        </div>
      )}
      {error && !showModal && !viewDetails && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-5 py-4 rounded-xl flex items-center gap-3 shadow-sm animation-fade-in">
          <AlertCircle className="text-rose-600" size={18} />
          <span className="text-sm font-semibold">{error}</span>
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <UserCheck className="text-blue-500" size={18} />
            Employee Salary Assignments
          </h2>
          <p className="text-slate-500 text-xs mt-1">Assign salary templates, set annual CTC, and manage historical salary rates for employees.</p>
        </div>
        <button
          onClick={handleOpenAssign}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-600/10 transition-all cursor-pointer self-stretch sm:self-auto justify-center"
        >
          <Plus size={16} /> Assign Salary
        </button>
      </div>

      {/* Main Table List */}
      {loading && !viewDetails ? (
        <div className="flex justify-center items-center h-48 bg-white rounded-2xl border border-slate-200">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : assignments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
          <Info className="mx-auto text-slate-400 mb-3" size={36} />
          <p className="text-slate-700 font-bold text-sm">No assignments active yet</p>
          <p className="text-slate-500 text-xs mt-1">Click "Assign Salary" to structure pay for employees.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-wider">
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Structure / Grade</th>
                  <th className="px-6 py-4">Annual CTC</th>
                  <th className="px-6 py-4">Monthly CTC</th>
                  <th className="px-6 py-4">Effective From</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 text-sm font-medium">
                {assignments.map((assign) => (
                  <tr key={assign.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <span className="font-bold text-slate-800 block">{assign.Employee?.name}</span>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{assign.Employee?.employeeId}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <span className="font-bold text-slate-800 block">{assign.structure?.name || 'N/A'}</span>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{assign.structure?.code || ''}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">
                      ₹{parseFloat(assign.ctcAmount).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      ₹{parseFloat((assign.ctcAmount / 12).toFixed(2)).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-semibold text-xs">
                      {assign.effectiveFrom}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewBreakdown(assign.EmployeeId)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-650 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition-colors cursor-pointer"
                        >
                          <Eye size={14} /> View Details
                        </button>
                        <button
                          onClick={() => handleDeactivate(assign.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                          title="Deactivate Assignment"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Salary Breakdown Details Modal */}
      {viewDetails && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-base">
                Salary Structure Breakdown Details
              </h3>
              <button 
                onClick={() => setViewDetails(null)}
                className="text-slate-400 hover:text-slate-600 font-medium text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Top Overview Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50/45 p-4 rounded-xl border border-blue-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Annual CTC</span>
                  <span className="block text-base font-extrabold text-blue-700 mt-1">
                    ₹{parseFloat(viewDetails.annualCtc).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="bg-emerald-50/45 p-4 rounded-xl border border-emerald-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gross Monthly</span>
                  <span className="block text-base font-extrabold text-emerald-700 mt-1">
                    ₹{parseFloat(viewDetails.grossEarnings).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="bg-indigo-50/45 p-4 rounded-xl border border-indigo-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Net Take-Home</span>
                  <span className="block text-base font-extrabold text-indigo-700 mt-1">
                    ₹{parseFloat(viewDetails.netPay).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Info Details */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-250 flex flex-wrap gap-x-8 gap-y-2 text-xs">
                <div>
                  <span className="text-slate-400 font-bold uppercase block">Template Grade</span>
                  <span className="text-slate-800 font-extrabold">{viewDetails.structureName} ({viewDetails.structureCode})</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase block">Effective Start Date</span>
                  <span className="text-slate-800 font-extrabold">{viewDetails.effectiveFrom}</span>
                </div>
                {viewDetails.basicAmountOverride && (
                  <div>
                    <span className="text-slate-400 font-bold uppercase block">Basic Override</span>
                    <span className="text-slate-800 font-extrabold">₹{parseFloat(viewDetails.basicAmountOverride).toLocaleString('en-IN')}/yr</span>
                  </div>
                )}
              </div>

              {/* Components Breakdown Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="px-4 py-3">Pay Component</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Calculation Basis</th>
                      <th className="px-4 py-3 text-right">Monthly Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {viewDetails.components?.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50/30">
                        <td className="px-4 py-3">
                          <span className="font-bold text-slate-800 block">{c.name}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">{c.code}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            c.type === 'Earning' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}>
                            {c.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 font-bold">
                          {c.calculationType} {c.calculationBase && `(${c.calculationBase} @ ${parseFloat(c.calculationValue)}%)`}
                        </td>
                        <td className={`px-4 py-3 text-right font-extrabold ${c.type === 'Earning' ? 'text-slate-800' : 'text-rose-650'}`}>
                          {c.type === 'Earning' ? '+' : '-'} ₹{parseFloat(c.monthlyAmount).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                    
                    <tr className="bg-slate-50 font-bold border-t border-slate-200">
                      <td colSpan="3" className="px-4 py-3 text-right text-slate-500 uppercase tracking-wider">Total Deductions</td>
                      <td className="px-4 py-3 text-right text-rose-700 font-extrabold">
                        - ₹{parseFloat(viewDetails.totalDeductions).toLocaleString('en-IN')}
                      </td>
                    </tr>
                    
                    <tr className="bg-blue-50/20 font-bold">
                      <td colSpan="3" className="px-4 py-3 text-right text-slate-700 uppercase tracking-wider text-sm">Net Pay (Take-Home)</td>
                      <td className="px-4 py-3 text-right text-blue-700 font-extrabold text-sm">
                        ₹{parseFloat(viewDetails.netPay).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setViewDetails(null)}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider shadow-md cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-base">
                Assign Salary Structure to Employee
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 font-medium text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Modal Body with 2 Columns (Form left, Live breakdown right) */}
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
              {/* Form Input Columns */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 border-r border-slate-100 text-slate-700">
                {error && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl flex items-center gap-2">
                    <AlertCircle className="text-rose-600 flex-shrink-0" size={16} />
                    <span className="text-xs font-semibold">{error}</span>
                  </div>
                )}

                {/* Employee Select */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Select Employee *</label>
                  <select
                    name="employeeId"
                    required
                    value={formData.employeeId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-blue-500 transition-all bg-white"
                  >
                    <option value="">-- Select Employee --</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.employeeId} - {emp.designation})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Structure Select */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Salary Template Structure *</label>
                  <select
                    name="salaryStructureId"
                    required
                    value={formData.salaryStructureId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-blue-500 transition-all bg-white"
                  >
                    <option value="">-- Select Structure --</option>
                    {structures.map(struct => (
                      <option key={struct.id} value={struct.id}>
                        {struct.name} (Grade: {struct.gradeLevel || 'N/A'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Grid: CTC and Basic Override */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Annual CTC Amount *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-450 font-bold text-xs">₹</span>
                      <input
                        type="number"
                        name="ctcAmount"
                        required
                        value={formData.ctcAmount}
                        onChange={handleInputChange}
                        placeholder="e.g. 600000"
                        className="w-full pl-6 pr-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-blue-500 transition-all font-bold text-slate-800"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Annual Basic Override</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-450 font-bold text-xs">₹</span>
                      <input
                        type="number"
                        name="basicAmount"
                        value={formData.basicAmount}
                        onChange={handleInputChange}
                        placeholder="e.g. 300000"
                        className="w-full pl-6 pr-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-blue-500 transition-all font-bold text-slate-800"
                      />
                    </div>
                  </div>
                </div>

                {/* Grid: Date & Remarks */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Effective From *</label>
                    <input
                      type="date"
                      name="effectiveFrom"
                      required
                      value={formData.effectiveFrom}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-blue-500 transition-all font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Remarks / Notes</label>
                    <input
                      type="text"
                      name="remarks"
                      value={formData.remarks}
                      onChange={handleInputChange}
                      placeholder="e.g. Annual Appraisal Hike"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-600/10 transition-all cursor-pointer"
                  >
                    Save Assignment
                  </button>
                </div>
              </form>

              {/* Live Preview Calculation Column */}
              <div className="w-full md:w-80 bg-slate-50 p-6 overflow-y-auto flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2 mb-4">
                    <Calculator className="text-blue-500" size={15} />
                    Salary Breakdown Preview
                  </h4>

                  {previewLoading && (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="text-[10px] font-bold uppercase">Calculating...</span>
                    </div>
                  )}

                  {previewError && (
                    <div className="text-center py-6 text-rose-500">
                      <AlertCircle className="mx-auto mb-1" size={24} />
                      <span className="text-xs font-bold block">{previewError}</span>
                    </div>
                  )}

                  {!previewLoading && !previewError && !previewData && (
                    <div className="text-center py-12 text-slate-450 border border-dashed border-slate-300 rounded-xl bg-white p-4">
                      <Calculator className="mx-auto mb-2 text-slate-350" size={32} />
                      <span className="text-xs font-bold block">No preview available</span>
                      <span className="text-[10px] mt-1 block leading-normal text-slate-400">Enter a target CTC amount and select a template to review the monthly gross and take-home.</span>
                    </div>
                  )}

                  {!previewLoading && !previewError && previewData && (
                    <div className="space-y-4">
                      {/* Summary Badges */}
                      <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2.5 shadow-sm">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-bold uppercase">Monthly CTC</span>
                          <span className="font-mono font-bold text-slate-750">
                            ₹{parseFloat(previewData.monthlyCtc).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-bold uppercase">Gross Monthly</span>
                          <span className="font-mono font-extrabold text-slate-800">
                            ₹{parseFloat(previewData.grossEarnings).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-bold uppercase">Deductions</span>
                          <span className="font-mono font-bold text-rose-600">
                            - ₹{parseFloat(previewData.totalDeductions).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="border-t border-slate-100 pt-2.5 flex justify-between items-center text-xs">
                          <span className="text-indigo-600 font-extrabold uppercase">Net Take-Home</span>
                          <span className="font-mono font-extrabold text-indigo-750 text-sm">
                            ₹{parseFloat(previewData.netPay).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      {/* Small Components List */}
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {previewData.components?.map(c => (
                          <div key={c.code} className="flex justify-between items-center text-[11px] bg-white border border-slate-150 p-2 rounded">
                            <div>
                              <span className="font-bold text-slate-850 block">{c.name}</span>
                              <span className="text-[9px] text-slate-400 font-bold uppercase">{c.code}</span>
                            </div>
                            <span className={`font-mono font-extrabold ${c.type === 'Earning' ? 'text-slate-700' : 'text-rose-600'}`}>
                              {c.type === 'Earning' ? '+' : '-'}₹{parseFloat(c.monthlyAmount).toLocaleString('en-IN')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer notes */}
                <div className="text-[10px] text-slate-400 mt-4 leading-normal flex items-start gap-1 bg-blue-50/30 p-2.5 rounded-lg border border-blue-100/30">
                  <Info className="flex-shrink-0 text-blue-500" size={12} />
                  <span>Statutory caps (PF cap ₹1,800, ESI limits &lt;= ₹21k, PT slabs) are simulated in real time.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
