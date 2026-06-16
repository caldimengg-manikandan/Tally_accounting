import React, { useState, useEffect } from 'react';
import {
  Users, Plus, Check, X, AlertCircle, Loader2, RefreshCcw, DollarSign, Calendar, FileText, Settings, UserCheck, Info, Pencil, Sliders, Banknote, TrendingUp, TrendingDown
} from 'lucide-react';
import { payrollAPI, ledgerAPI } from '../../services/api';
import CreatableSelect from '../../components/CreatableSelect';

const fmt = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function PayrollView({ companyId, showNewEmployeeForm }) {
  
  const [activeTab, setActiveTab] = useState('employees'); // 'employees' | 'attendance' | 'structures' | 'process' | 'payslips' | 'settings'
  
  const [payrollSettings, setPayrollSettings] = useState({ pfEmployeeRate: 12.00, esiEmployeeRate: 0.75, ptMonthlyAmount: 200.00 });
  
  const [employees, setEmployees] = useState([]);
  const [ledgers, setLedgers] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Forms & Modal states
  const [showEmpModal, setShowEmpModal] = useState(showNewEmployeeForm || false);
  const [showHRA, setShowHRA] = useState(false);
  
  useEffect(() => {
    setShowEmpModal(!!showNewEmployeeForm);
  }, [showNewEmployeeForm]);
  const [showStructModal, setShowStructModal] = useState(false);
  const [showAttModal, setShowAttModal] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  
  const [empForm, setEmpForm] = useState({
    firstName: '', lastName: '', employeeId: '', dateOfJoining: '', email: '', phone: '',
    isDirector: false, gender: '', workLocation: '', designation: '', department: '', portalAccess: false,
    bankAccount: '', bankName: '', ifsc: '', pan: '', pfNumber: '', esiNumber: ''
  });
  
  const [designations, setDesignations] = useState(['System Engineer', 'Project Manager', 'HR Manager', 'Sales Executive']);
  const [departments, setDepartments] = useState(['Engineering', 'Human Resources', 'Sales', 'Marketing']);
  const [showNewDesigModal, setShowNewDesigModal] = useState(false);
  const [showNewDeptModal, setShowNewDeptModal] = useState(false);
  const [newOptionValue, setNewOptionValue] = useState('');
  const [formStep, setFormStep] = useState(1);
  const [salaryStep, setSalaryStep] = useState(1);
  const [showEarningDropdown, setShowEarningDropdown] = useState(false);
  
  const [structForm, setStructForm] = useState({
    annualCTC: '', basic: '', hra: '', da: '', incentives: '', pfDeduction: '', esiDeduction: '', profTaxDeduction: ''
  });
  
  const [attForm, setAttForm] = useState({
    date: new Date().toISOString().split('T')[0], status: 'Present', remarks: ''
  });
  
  const [processForm, setProcessForm] = useState({
    month: MONTHS[new Date().getMonth()],
    year: new Date().getFullYear(),
    paymentLedgerId: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empRes, ledgRes, attRes, payRes, setRes] = await Promise.all([
        payrollAPI.getEmployees(companyId),
        ledgerAPI.getByCompany(companyId),
        payrollAPI.getAttendance(companyId),
        payrollAPI.getPayslips(companyId),
        payrollAPI.getSettings(companyId)
      ]);
      setEmployees(Array.isArray(empRes.data) ? empRes.data : []);
      setLedgers(Array.isArray(ledgRes.data) ? ledgRes.data : []);
      setAttendanceLogs(Array.isArray(attRes.data) ? attRes.data : []);
      setPayslips(Array.isArray(payRes.data) ? payRes.data : []);
      if (setRes.data) setPayrollSettings(setRes.data);
    } catch (err) {
      console.error(err);
      setError('Fetch Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [companyId]);

  const closeEmpModal = () => {
    setShowEmpModal(false);
    setTimeout(() => {
      setFormStep(1);
      setEmpForm({ 
        firstName: '', middleName: '', lastName: '', employeeId: '', dateOfJoining: '', email: '', phone: '',
        isDirector: false, gender: '', workLocation: '', designation: '', department: '', portalAccess: false,
        bankAccount: '', bankName: '', ifsc: '', pan: '', pfNumber: '', esiNumber: '' 
      });
    }, 300);
  };

  // Employee creation & editing
  const handleEditEmployee = (emp) => {
    const parts = emp.name ? emp.name.split(' ') : [];
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ');
    setEmpForm({
      ...emp,
      id: emp.id,
      firstName,
      middleName: '',
      lastName,
    });
    setSalaryStep(1);
    setShowEmpModal(true);
  };

  const handleCreateEmployee = async () => {
    if (!empForm.employeeId || !empForm.firstName) {
      setError('Employee ID and First Name are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const name = `${empForm.firstName} ${empForm.middleName ? empForm.middleName + ' ' : ''}${empForm.lastName || ''}`.trim();
      
      const payload = {
        employeeId: empForm.employeeId,
        name,
        firstName: empForm.firstName,
        middleName: empForm.middleName,
        lastName: empForm.lastName,
        dateOfJoining: empForm.dateOfJoining,
        email: empForm.email,
        phone: empForm.phone,
        isDirector: empForm.isDirector,
        gender: empForm.gender,
        workLocation: empForm.workLocation,
        designation: empForm.designation,
        department: empForm.department,
        portalAccess: empForm.portalAccess,
        bankAccount: empForm.bankAccount,
        bankName: empForm.bankName,
        ifsc: empForm.ifsc,
        pan: empForm.pan,
        pfNumber: empForm.pfNumber,
        esiNumber: empForm.esiNumber,
        companyId
      };
      
      if (empForm.id) {
        await payrollAPI.updateEmployee(empForm.id, payload);
        setSuccess('Employee updated successfully!');
      } else {
        await payrollAPI.createEmployee(payload);
        setSuccess('Employee created successfully!');
      }
      
      setShowEmpModal(false);
      setEmpForm({
        firstName: '', lastName: '', employeeId: '', dateOfJoining: '', email: '', phone: '',
        isDirector: false, gender: '', workLocation: '', designation: '', department: '', portalAccess: false,
        bankAccount: '', bankName: '', ifsc: '', pan: '', pfNumber: '', esiNumber: ''
      });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save employee');
    } finally {
      setSaving(false);
    }
  };

  // Salary Structure save
  const handleSaveStructure = async () => {
    setSaving(true);
    setError('');
    try {
      await payrollAPI.saveSalaryStructure({
        ...structForm,
        employeeId: selectedEmp?.id || empForm.id,
        companyId,
        monthlyBasic,
        monthlyFixedAllowance,
        annualBasic,
        annualFixedAllowance,
        hraMonthly,
        hraAnnual
      });
      setSuccess('Salary structure saved successfully!');
      setShowStructModal(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save salary structure');
    } finally {
      setSaving(false);
    }
  };

  const handleAutoCalculate = () => {
    const ctc = parseFloat(structForm.annualCTC);
    if (!ctc || isNaN(ctc)) return;
    
    const monthlyGross = Math.round(ctc / 12);
    const basic = Math.round(monthlyGross * 0.50);
    const hra = Math.round(basic * 0.50);
    const pf = Math.min(Math.round(basic * 0.12), 1800);
    const pt = 200;
    const esi = 0; 
    const incentives = monthlyGross - basic - hra;
    
    setStructForm({
      ...structForm,
      basic: basic.toString(),
      hra: hra.toString(),
      da: '0',
      incentives: incentives.toString(),
      pfDeduction: pf.toString(),
      esiDeduction: esi.toString(),
      profTaxDeduction: pt.toString()
    });
  };

  // Attendance save
  const handleSaveAttendance = async () => {
    setSaving(true);
    setError('');
    try {
      await payrollAPI.saveAttendance({
        ...attForm,
        employeeId: selectedEmp.id,
        companyId
      });
      setSuccess('Attendance logged successfully!');
      setShowAttModal(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to log attendance');
    } finally {
      setSaving(false);
    }
  };

  // Process Payroll
  const handleSaveSettings = async () => {
    setSaving(true);
    setError('');
    try {
      await payrollAPI.saveSettings(companyId, payrollSettings);
      setSuccess('Payroll settings saved successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleProcessPayroll = async () => {
    if (!processForm.paymentLedgerId) {
      setError('Please select a cash/bank payment ledger.');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await payrollAPI.process({
        ...processForm,
        companyId,
        date: new Date().toISOString()
      });
      setSuccess(`Payroll for ${processForm.month} ${processForm.year} processed and posted to ledger!`);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to process payroll');
    } finally {
      setSaving(false);
    }
  };
  const ctc = Number(structForm.annualCTC) || 0;
  const monthlyCTC = Math.floor(ctc / 12);
  const basicMonthly = Math.round(monthlyCTC * 0.50);
  const hraMonthly = showHRA ? Math.round(basicMonthly * 0.50) : 0;
  const fixedAllowanceMonthly = monthlyCTC > 0 ? (monthlyCTC - basicMonthly - hraMonthly) : 0;
  
  const basicAnnual = basicMonthly * 12;
  const hraAnnual = hraMonthly * 12;
  const fixedAllowanceAnnual = fixedAllowanceMonthly * 12;
  
  const totalAnnual = basicAnnual + hraAnnual + fixedAllowanceAnnual;

  return (
    <div className="p-8 max-w-[1400px] mx-auto animate-fade-in">
      
      {!showEmpModal && (
        <div className="space-y-8">
          {/* Header */}
          <div className="flex justify-between items-end border-b border-slate-100 pb-8">
            <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/10">
              <Users size={18} />
            </div>
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-[0.2em]">Payroll</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Payroll Management</h1>
          <p className="text-slate-400 text-xs mt-1 font-medium">Standard Indian Payroll (Basic, HRA, PF, ESI, PT) with dynamic G/L integration</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowEmpModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-600/10 flex items-center gap-1.5 transition-all">
            <Plus size={16} /> Add Employee
          </button>
        </div>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex gap-3 text-sm text-emerald-700 font-bold">
          <Check size={16} className="shrink-0 mt-0.5" /> {success}
        </div>
      )}

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-100">
        {[
          { id: 'employees', label: 'Employees', icon: Users },
          { id: 'attendance', label: 'Attendance logs', icon: Calendar },
          { id: 'structures', label: 'Salary Structures', icon: Settings },
          { id: 'settings', label: 'Taxes & Settings', icon: Sliders },
          { id: 'process', label: 'Process Payroll', icon: DollarSign },
          { id: 'payslips', label: 'Payslips', icon: FileText }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setError(''); setSuccess(''); }}
            className={`flex items-center gap-2 px-6 py-3.5 border-b-2 text-xs font-bold uppercase tracking-wider transition-all
              ${activeTab === tab.id 
                ? 'border-blue-600 text-blue-600 bg-slate-50/30' 
                : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
      ) : (
        <div className="space-y-6">
          {/* TAB 1: EMPLOYEES */}
          {activeTab === 'employees' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200 bg-slate-50/50">
                  <tr>
                    <th className="px-6 py-4">Emp ID</th>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Dept / Desg</th>
                    <th className="px-6 py-4">Bank Details</th>
                    <th className="px-6 py-4">PF / ESI</th>
                    <th className="px-6 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                  {employees.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-24 text-center">
                        <p className="text-slate-400 font-bold mb-4">No employees have been added to the system yet.</p>
                        <button 
                          onClick={() => setShowEmpModal(true)}
                          className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
                        >
                          + Add Your First Employee
                        </button>
                      </td>
                    </tr>
                  ) : employees.map(emp => (
                    <tr key={emp.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => handleEditEmployee(emp)}>
                      <td className="px-6 py-4 text-blue-600 font-bold">#{emp.employeeId}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                            {emp.name ? emp.name.charAt(0).toUpperCase() : '?'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{emp.name}</p>
                            <p className="text-xs text-slate-500 font-normal">{emp.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {emp.department || '—'} <span className="text-[10px] bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full ml-1 font-bold">{emp.designation || 'Staff'}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        {emp.bankName ? `${emp.bankName} - A/c ${emp.bankAccount}` : '—'}
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        PF: {emp.pfNumber || '—'} <br/> ESI: {emp.esiNumber || '—'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${emp.active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                          {emp.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: ATTENDANCE */}
          {activeTab === 'attendance' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-100 p-8 shadow-xl space-y-4">
                <h3 className="text-lg font-bold text-slate-800">Select Employee to Log Attendance</h3>
                <div className="divide-y divide-slate-100">
                  {employees.map(emp => (
                    <div key={emp.id} className="flex justify-between items-center py-3">
                      <div>
                        <p className="font-bold text-slate-800">{emp.name}</p>
                        <p className="text-[10px] text-slate-400">#{emp.employeeId} · {emp.designation || 'Staff'}</p>
                      </div>
                      <button 
                        onClick={() => { setSelectedEmp(emp); setShowAttModal(true); }}
                        className="px-4 py-2 border border-slate-200 hover:border-blue-600 hover:text-blue-600 rounded-xl text-xs font-bold transition-all"
                      >
                        Log Status
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-slate-50 rounded-[2rem] border border-slate-200/60 p-6 space-y-4">
                <h4 className="font-bold text-slate-800 text-[14px]">Deduction Rule</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Salary is computed on a pro-rata basis. Any days logged as **"Absent"** will automatically deduct basic wages proportionally for that pay period:
                  <br/><br/>
                  <code className="bg-white p-2 rounded block font-mono text-[11px] text-rose-600 border border-slate-100">
                    Deduction = (Basic / Days in Month) * Absent Days
                  </code>
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: SALARY STRUCTURES */}
          {activeTab === 'structures' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200 bg-slate-50/50">
                  <tr>
                    <th className="px-6 py-4">Employee</th>
                    <th className="px-6 py-4 text-right">Basic Pay</th>
                    <th className="px-6 py-4 text-right">HRA</th>
                    <th className="px-6 py-4 text-right">DA</th>
                    <th className="px-6 py-4 text-right">Incentives</th>
                    <th className="px-6 py-4 text-right">Deductions (PF/ESI/PT)</th>
                    <th className="px-6 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                  {employees.map(emp => {
                    const struct = emp.SalaryStructure || {};
                    const totalDed = parseFloat(struct.pfDeduction||0) + parseFloat(struct.esiDeduction||0) + parseFloat(struct.profTaxDeduction||0);
                    return (
                      <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900">{emp.name}</p>
                          <p className="text-xs text-slate-500">#{emp.employeeId}</p>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-slate-900">{fmt(struct.basic || 0)}</td>
                        <td className="px-6 py-4 text-right text-slate-500">{fmt(struct.hra || 0)}</td>
                        <td className="px-6 py-4 text-right text-slate-500">{fmt(struct.da || 0)}</td>
                        <td className="px-6 py-4 text-right text-emerald-600 font-bold">{fmt(struct.incentives || 0)}</td>
                        <td className="px-6 py-4 text-right text-rose-500 font-bold">-{fmt(totalDed)}</td>
                        <td className="px-6 py-4 text-center">
                          <button 
                            onClick={() => {
                              setSelectedEmp(emp);
                              setStructForm({
                                basic: struct.basic || '',
                                hra: struct.hra || '',
                                da: struct.da || '',
                                incentives: struct.incentives || '',
                                pfDeduction: struct.pfDeduction || '',
                                esiDeduction: struct.esiDeduction || '',
                                profTaxDeduction: struct.profTaxDeduction || ''
                              });
                              setShowStructModal(true);
                            }}
                            className="bg-white hover:bg-slate-50 text-slate-600 px-4 py-2 rounded-xl text-xs font-bold transition-all border border-slate-200 shadow-sm"
                          >
                            Setup Structure
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 4: PROCESS PAYROLL */}
          {activeTab === 'process' && (
            <div className="max-w-2xl bg-white rounded-[2rem] border border-slate-100 p-8 shadow-xl space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                  <DollarSign size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Run Monthly Payroll</h3>
                  <p className="text-xs text-slate-400 font-bold">Aggregates salary components, subtracts absents, and posts double-entry</p>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex gap-3 text-sm text-red-600 font-bold">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" /> {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Month</label>
                  <select value={processForm.month} onChange={e => setProcessForm({ ...processForm, month: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-400 transition-all appearance-none">
                    {MONTHS.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Year</label>
                  <input type="number" value={processForm.year} onChange={e => setProcessForm({ ...processForm, year: parseInt(e.target.value) })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-400 transition-all" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Paid From (Bank / Cash Ledger)*</label>
                <select value={processForm.paymentLedgerId} onChange={e => setProcessForm({ ...processForm, paymentLedgerId: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-400 transition-all appearance-none">
                  <option value="">— Select Cash/Bank Ledger —</option>
                  {ledgers.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>

              <button 
                onClick={handleProcessPayroll}
                disabled={saving}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {saving ? <><Loader2 size={16} className="animate-spin" /> Processing…</> : 'Process & Post G/L Voucher'}
              </button>
            </div>
          )}

          {/* TAB 5: PAYSLIPS */}
          {activeTab === 'payslips' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200 bg-slate-50/50">
                  <tr>
                    <th className="px-6 py-4">Employee</th>
                    <th className="px-6 py-4">Month/Year</th>
                    <th className="px-6 py-4 text-right">Gross Earnings</th>
                    <th className="px-6 py-4 text-right">Deductions</th>
                    <th className="px-6 py-4 text-right">Net Payable</th>
                    <th className="px-6 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                  {payslips.length === 0 ? (
                    <tr><td colSpan={6} className="py-16 text-center text-slate-500 font-medium">No processed payslips found. Process payroll first.</td></tr>
                  ) : payslips.map(slip => {
                    const gross = parseFloat(slip.basic||0) + parseFloat(slip.hra||0) + parseFloat(slip.da||0) + parseFloat(slip.incentives||0);
                    const ded = parseFloat(slip.pf||0) + parseFloat(slip.esi||0) + parseFloat(slip.profTax||0);
                    return (
                      <tr key={slip.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900">{slip.Employee?.name}</p>
                          <p className="text-xs text-slate-500">#{slip.Employee?.employeeId}</p>
                        </td>
                        <td className="px-6 py-4 text-slate-700 font-medium">{slip.month} {slip.year}</td>
                        <td className="px-6 py-4 text-right text-slate-600">{fmt(gross)}</td>
                        <td className="px-6 py-4 text-right text-rose-500 font-medium">-{fmt(ded)}</td>
                        <td className="px-6 py-4 text-right font-bold text-blue-700">{fmt(slip.netSalary)}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-200 uppercase tracking-wider">
                            {slip.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 6: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="max-w-3xl bg-white rounded-[2rem] border border-slate-100 p-8 shadow-xl space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center">
                  <Sliders size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Payroll Settings & Taxes</h3>
                  <p className="text-xs text-slate-400 font-bold">Configure PF, ESI, and Professional Tax statutory rules</p>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex gap-3 text-sm text-red-600 font-bold">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" /> {error}
                </div>
              )}
              {success && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex gap-3 text-sm text-emerald-600 font-bold">
                  <Check size={16} className="shrink-0 mt-0.5" /> {success}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">PF Employee Contribution (%)</label>
                  <input type="number" step="0.01" value={payrollSettings.pfEmployeeRate} onChange={e => setPayrollSettings({ ...payrollSettings, pfEmployeeRate: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-400 transition-all" />
                  <p className="text-[10px] text-slate-400 mt-2 font-semibold">Standard is 12% of Basic Pay</p>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">ESI Employee Contribution (%)</label>
                  <input type="number" step="0.01" value={payrollSettings.esiEmployeeRate} onChange={e => setPayrollSettings({ ...payrollSettings, esiEmployeeRate: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-400 transition-all" />
                  <p className="text-[10px] text-slate-400 mt-2 font-semibold">Standard is 0.75% of Gross Pay</p>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Professional Tax (Fixed Amount)</label>
                  <input type="number" step="1" value={payrollSettings.ptMonthlyAmount} onChange={e => setPayrollSettings({ ...payrollSettings, ptMonthlyAmount: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-400 transition-all" />
                  <p className="text-[10px] text-slate-400 mt-2 font-semibold">e.g. ₹200/month</p>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                <button 
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="bg-slate-900 hover:bg-black text-white px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {saving ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : 'Save Settings'}
                </button>
              </div>
            </div>
          )}

        </div>
      )}
      
      </div>
      )}

      {/* FULL PAGE: ADD EMPLOYEE */}
      {showEmpModal && (
        <div className="flex flex-col w-full min-h-[80vh] animate-fade-in pb-20 mt-4">
          <div className="flex justify-between items-center mb-10 relative">
            <h2 className="text-3xl font-semibold text-slate-800 flex-1 text-center">
              {empForm.id ? `${empForm.firstName}'s Profile` : 'Add Employee'}
            </h2>
            <button onClick={closeEmpModal} className="p-2 rounded-xl text-slate-500 hover:bg-slate-200 transition-all absolute right-0"><X size={28} /></button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 flex items-center gap-2 max-w-5xl mx-auto w-full">
              <AlertCircle size={18} className="shrink-0" /> 
              <span className="font-medium text-sm">{error}</span>
            </div>
          )}
          
          {/* No Stepper */}
          
            <div className="overflow-y-visible grow mt-6">
                <div className="space-y-8 max-w-5xl mx-auto">
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <label className="block text-base font-medium text-slate-700 mb-2">Employee Name<span className="text-red-500">*</span></label>
                      <div className="grid grid-cols-3 gap-5">
                        <input value={empForm.firstName} onChange={e => setEmpForm({ ...empForm, firstName: e.target.value })}
                          placeholder="First Name" className="w-full border border-slate-300 rounded-xl px-5 py-3 text-base outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white" />
                        <input value={empForm.middleName || ''} onChange={e => setEmpForm({ ...empForm, middleName: e.target.value })}
                          placeholder="Middle Name" className="w-full border border-slate-300 rounded-xl px-5 py-3 text-base outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white" />
                        <input value={empForm.lastName} onChange={e => setEmpForm({ ...empForm, lastName: e.target.value })}
                          placeholder="Last Name" className="w-full border border-slate-300 rounded-xl px-5 py-3 text-base outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <label className="block text-base font-medium text-slate-700 mb-2">Employee ID<span className="text-red-500">*</span></label>
                      <input value={empForm.employeeId} onChange={e => setEmpForm({ ...empForm, employeeId: e.target.value })}
                        className="w-full border border-slate-300 rounded-xl px-5 py-3 text-base outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white" />
                    </div>
                    <div>
                      <label className="block text-base font-medium text-slate-700 mb-2">Date of Joining<span className="text-red-500">*</span></label>
                      <input type="date" value={empForm.dateOfJoining} onChange={e => setEmpForm({ ...empForm, dateOfJoining: e.target.value })}
                        className="w-full border border-slate-300 rounded-xl px-5 py-3 text-base outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <label className="block text-base font-medium text-slate-700 mb-2">Work Email<span className="text-red-500">*</span></label>
                      <input type="email" value={empForm.email} onChange={e => setEmpForm({ ...empForm, email: e.target.value })}
                        className="w-full border border-slate-300 rounded-xl px-5 py-3 text-base outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white" />
                    </div>
                    <div>
                      <label className="block text-base font-medium text-slate-700 mb-2">Mobile Number<span className="text-red-500">*</span></label>
                      <input value={empForm.phone} onChange={e => setEmpForm({ ...empForm, phone: e.target.value })}
                        className="w-full border border-slate-300 rounded-xl px-5 py-3 text-base outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white" />
                    </div>
                  </div>

                  <div className="bg-blue-50/50 rounded-xl p-5 flex gap-4 text-base text-blue-800 border border-blue-100">
                    <Info size={22} className="shrink-0 text-blue-500 mt-0.5" />
                    <p>You cannot change this Email address later on, as this will be used to send payslips and also for employees to sign in to their portal, where they can view/download their payslips.</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <input type="checkbox" id="isDirector" checked={empForm.isDirector} onChange={e => setEmpForm({ ...empForm, isDirector: e.target.checked })}
                      className="w-5 h-5 text-blue-600 rounded border-gray-400 focus:ring-blue-500" />
                    <label htmlFor="isDirector" className="text-base text-slate-800 flex items-center gap-2 cursor-pointer">
                      Employee is a <span className="font-semibold">Director/person with substantial interest</span> in the company.
                      <Info size={16} className="text-slate-400" />
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <label className="block text-base font-medium text-slate-700 mb-2">Gender<span className="text-red-500">*</span></label>
                      <select value={empForm.gender} onChange={e => setEmpForm({ ...empForm, gender: e.target.value })}
                        className="w-full border border-slate-300 rounded-xl px-5 py-3 text-base outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 appearance-none bg-white">
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div></div>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="[&_label]:text-base [&_label]:mb-2 [&_input]:text-base [&_span]:text-base">
                      <CreatableSelect
                        label="Designation"
                        required={true}
                        value={empForm.designation}
                        onChange={(val) => setEmpForm({ ...empForm, designation: val })}
                        options={designations}
                        onAddNew={() => setShowNewDesigModal(true)}
                        addNewText="New Designation"
                      />
                    </div>
                    <div className="[&_label]:text-base [&_label]:mb-2 [&_input]:text-base [&_span]:text-base">
                      <CreatableSelect
                        label="Department"
                        required={true}
                        value={empForm.department}
                        onChange={(val) => setEmpForm({ ...empForm, department: val })}
                        options={departments}
                        onAddNew={() => setShowNewDeptModal(true)}
                        addNewText="New Department"
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <div className="flex items-start gap-3">
                      <input type="checkbox" id="portalAccess" checked={empForm.portalAccess} onChange={e => setEmpForm({ ...empForm, portalAccess: e.target.checked })}
                        className="w-5 h-5 text-blue-600 rounded border-gray-400 focus:ring-blue-500 mt-1" />
                      <div>
                        <label htmlFor="portalAccess" className="text-base font-medium text-slate-900 cursor-pointer">
                          Enable Portal Access <a href="#" className="text-blue-500 font-normal hover:underline ml-2">Preview mail</a>
                        </label>
                        <p className="text-base text-slate-500 mt-2">
                          The employee will be able to view payslips, submit their IT declaration and create reimbursement claims through the employee portal.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="max-w-5xl mx-auto flex justify-between items-center mt-16 pt-8 border-t border-slate-200">
                  <div className="flex gap-4">
                    <button onClick={handleCreateEmployee} disabled={saving} className="px-8 py-3 bg-blue-600 text-white rounded-xl text-base font-medium hover:bg-blue-700 shadow-sm transition-all flex items-center gap-3">
                      {saving && <Loader2 size={20} className="animate-spin" />}
                      {empForm.id ? 'Update Employee' : 'Save Employee'}
                    </button>
                    <button onClick={closeEmpModal} className="px-8 py-3 rounded-xl border border-slate-300 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 transition-all">Cancel</button>
                  </div>
                  <span className="text-sm font-medium text-red-500">* Indicates mandatory fields</span>
                </div>
            </div>
          </div>
      )}

      {/* NEW DESIGNATION MODAL */}
      {showNewDesigModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-medium text-slate-800">New Designation</h2>
              <button onClick={() => { setShowNewDesigModal(false); setNewOptionValue(''); }} className="text-blue-500 hover:text-blue-700"><X size={20} /></button>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Designation Name <span className="text-red-500">*</span></label>
              <input 
                autoFocus
                value={newOptionValue} 
                onChange={e => setNewOptionValue(e.target.value)}
                className="w-full border border-blue-400 ring-2 ring-blue-100 rounded-lg px-4 py-2.5 text-sm outline-none" 
              />
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center bg-white">
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    if (newOptionValue.trim()) {
                      setDesignations(prev => [...prev, newOptionValue.trim()]);
                      setEmpForm(prev => ({ ...prev, designation: newOptionValue.trim() }));
                      setShowNewDesigModal(false);
                      setNewOptionValue('');
                    }
                  }} 
                  className="px-5 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600"
                >
                  Save
                </button>
                <button onClick={() => { setShowNewDesigModal(false); setNewOptionValue(''); }} className="px-5 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
              </div>
              <span className="text-xs text-red-500">* indicates mandatory fields</span>
            </div>
          </div>
        </div>
      )}

      {/* NEW DEPARTMENT MODAL */}
      {showNewDeptModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-medium text-slate-800">New Department</h2>
              <button onClick={() => { setShowNewDeptModal(false); setNewOptionValue(''); }} className="text-blue-500 hover:text-blue-700"><X size={20} /></button>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Department Name <span className="text-red-500">*</span></label>
              <input 
                autoFocus
                value={newOptionValue} 
                onChange={e => setNewOptionValue(e.target.value)}
                className="w-full border border-blue-400 ring-2 ring-blue-100 rounded-lg px-4 py-2.5 text-sm outline-none" 
              />
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center bg-white">
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    if (newOptionValue.trim()) {
                      setDepartments(prev => [...prev, newOptionValue.trim()]);
                      setEmpForm(prev => ({ ...prev, department: newOptionValue.trim() }));
                      setShowNewDeptModal(false);
                      setNewOptionValue('');
                    }
                  }} 
                  className="px-5 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600"
                >
                  Save
                </button>
                <button onClick={() => { setShowNewDeptModal(false); setNewOptionValue(''); }} className="px-5 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
              </div>
              <span className="text-xs text-red-500">* indicates mandatory fields</span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: SETUP SALARY STRUCTURE */}
      {showStructModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200/60 ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-inner">
                  <Banknote size={24} strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800 tracking-tight">Salary Structure</h2>
                  <p className="text-sm font-medium text-slate-500 mt-0.5">{selectedEmp?.name} <span className="mx-2 text-slate-300">•</span> #{selectedEmp?.employeeId}</p>
                </div>
              </div>
              <button onClick={() => setShowStructModal(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-200/50 hover:text-slate-600 transition-colors"><X size={20} strokeWidth={2.5} /></button>
            </div>
            
            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
              {/* Auto-Calculate Section */}
              <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100 flex items-end gap-4">
                <div className="flex-1">
                  <label className="block text-[11px] font-bold text-blue-600 uppercase tracking-wider mb-2">Annual CTC (₹)</label>
                  <input type="number" value={structForm.annualCTC} onChange={e => setStructForm({ ...structForm, annualCTC: e.target.value })}
                    className="w-full bg-white border border-blue-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all placeholder-slate-300" placeholder="e.g. 600000" />
                </div>
                <button onClick={handleAutoCalculate} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm tracking-wide hover:bg-blue-700 transition-all active:scale-95 shrink-0 flex items-center gap-2 h-[46px]">
                  <Sliders size={16} />
                  Auto-Calculate
                </button>
              </div>

              {/* Earnings Section */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-6 w-6 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-sm">
                    <TrendingUp size={14} strokeWidth={3} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Monthly Earnings</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-5 p-5 rounded-2xl bg-slate-50/80 border border-slate-100">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Basic Pay (₹) <span className="text-rose-500">*</span></label>
                    <input type="number" value={structForm.basic} onChange={e => setStructForm({ ...structForm, basic: e.target.value })}
                      className="w-full bg-white border border-slate-200/80 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition-all placeholder-slate-300" placeholder="0.00" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">HRA (₹)</label>
                    <input type="number" value={structForm.hra} onChange={e => setStructForm({ ...structForm, hra: e.target.value })}
                      className="w-full bg-white border border-slate-200/80 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition-all placeholder-slate-300" placeholder="0.00" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">DA (₹)</label>
                    <input type="number" value={structForm.da} onChange={e => setStructForm({ ...structForm, da: e.target.value })}
                      className="w-full bg-white border border-slate-200/80 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition-all placeholder-slate-300" placeholder="0.00" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Fixed Incentives (₹)</label>
                    <input type="number" value={structForm.incentives} onChange={e => setStructForm({ ...structForm, incentives: e.target.value })}
                      className="w-full bg-white border border-slate-200/80 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition-all placeholder-slate-300" placeholder="0.00" />
                  </div>
                </div>
              </div>

              {/* Deductions Section */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-6 w-6 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shadow-sm">
                    <TrendingDown size={14} strokeWidth={3} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Standard Deductions</h3>
                </div>
                
                <div className="grid grid-cols-3 gap-5 p-5 rounded-2xl bg-rose-50/30 border border-rose-100/50">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">PF (₹)</label>
                    <input type="number" value={structForm.pfDeduction} onChange={e => setStructForm({ ...structForm, pfDeduction: e.target.value })}
                      className="w-full bg-white border border-slate-200/80 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100 transition-all placeholder-slate-300" placeholder="0.00" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">ESI (₹)</label>
                    <input type="number" value={structForm.esiDeduction} onChange={e => setStructForm({ ...structForm, esiDeduction: e.target.value })}
                      className="w-full bg-white border border-slate-200/80 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100 transition-all placeholder-slate-300" placeholder="0.00" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Prof Tax (₹)</label>
                    <input type="number" value={structForm.profTaxDeduction} onChange={e => setStructForm({ ...structForm, profTaxDeduction: e.target.value })}
                      className="w-full bg-white border border-slate-200/80 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100 transition-all placeholder-slate-300" placeholder="0.00" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-8 py-5 border-t border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="text-xs font-medium text-slate-500">
                Gross Pay: <span className="text-emerald-600 font-bold ml-1 text-base tracking-tight">₹{(Number(structForm.basic || 0) + Number(structForm.hra || 0) + Number(structForm.da || 0) + Number(structForm.incentives || 0)).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowStructModal(false)} className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
                <button onClick={handleSaveStructure} disabled={saving} className="px-7 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm tracking-wide hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 transition-all active:scale-95 disabled:opacity-70 flex items-center gap-2">
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  Save Structure
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: LOG ATTENDANCE */}
      {showAttModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Log Attendance: {selectedEmp?.name}</h2>
                <p className="text-xs text-slate-400 font-bold mt-0.5">Logs absent/leave records for salary deduction</p>
              </div>
              <button onClick={() => setShowAttModal(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100"><X size={18} /></button>
            </div>
            <div className="p-8 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Date*</label>
                <input type="date" value={attForm.date} onChange={e => setAttForm({ ...attForm, date: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status*</label>
                <div className="flex border border-slate-200 rounded-xl overflow-hidden">
                  {['Present', 'Absent', 'Leave'].map(st => (
                    <button key={st} onClick={() => setAttForm({ ...attForm, status: st })}
                      className={`flex-1 py-3 text-xs font-bold transition-all ${attForm.status === st ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
                      {st}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Remarks</label>
                <input value={attForm.remarks} onChange={e => setAttForm({ ...attForm, remarks: e.target.value })}
                  placeholder="e.g. Unpaid sick leave" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-blue-400" />
              </div>
            </div>
            <div className="px-8 py-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button onClick={() => setShowAttModal(false)} className="px-5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50">Cancel</button>
              <button onClick={handleSaveAttendance} disabled={saving} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-700 transition-all">
                Save Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
