import React, { useState, useEffect } from 'react';
import {
  Users, Plus, Check, X, AlertCircle, Loader2, RefreshCcw, DollarSign, Calendar, FileText, Settings, UserCheck
} from 'lucide-react';
import { payrollAPI, ledgerAPI } from '../../services/api';

const fmt = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function PayrollView() {
  const companyId = localStorage.getItem('companyId');
  
  const [activeTab, setActiveTab] = useState('employees'); // 'employees' | 'attendance' | 'structures' | 'process' | 'payslips'
  
  const [employees, setEmployees] = useState([]);
  const [ledgers, setLedgers] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Forms & Modal states
  const [showEmpModal, setShowEmpModal] = useState(false);
  const [showStructModal, setShowStructModal] = useState(false);
  const [showAttModal, setShowAttModal] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  
  const [empForm, setEmpForm] = useState({
    employeeId: '', name: '', department: '', designation: '', bankAccount: '', bankName: '', ifsc: '', pan: '', pfNumber: '', esiNumber: '', email: '', phone: ''
  });
  
  const [structForm, setStructForm] = useState({
    basic: '', hra: '', da: '', incentives: '', pfDeduction: '', esiDeduction: '', profTaxDeduction: ''
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
      const [empRes, ledgRes, slipRes] = await Promise.all([
        payrollAPI.getEmployees(companyId),
        ledgerAPI.getByCompany(companyId),
        payrollAPI.getPayslips(companyId)
      ]);
      
      setEmployees(Array.isArray(empRes.data) ? empRes.data : []);
      setLedgers(Array.isArray(ledgRes.data) ? ledgRes.data : []);
      setPayslips(Array.isArray(slipRes.data) ? slipRes.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [companyId]);

  // Employee creation
  const handleCreateEmployee = async () => {
    if (!empForm.employeeId || !empForm.name) {
      setError('Employee ID and Name are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await payrollAPI.createEmployee({ ...empForm, companyId });
      setSuccess('Employee created successfully!');
      setShowEmpModal(false);
      setEmpForm({ employeeId: '', name: '', department: '', designation: '', bankAccount: '', bankName: '', ifsc: '', pan: '', pfNumber: '', esiNumber: '', email: '', phone: '' });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create employee');
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
        employeeId: selectedEmp.id,
        companyId
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

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-end border-b border-slate-100 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg shadow-slate-900/10">
              <Users size={18} />
            </div>
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-[0.2em]">HR & Payroll</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Payroll Management</h1>
          <p className="text-slate-400 text-xs mt-1 font-medium">Standard Indian Payroll (Basic, HRA, PF, ESI, PT) with dynamic G/L integration</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowEmpModal(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-slate-900/10 flex items-center gap-1.5 transition-all">
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
          { id: 'process', label: 'Process Payroll', icon: DollarSign },
          { id: 'payslips', label: 'Payslips', icon: FileText }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setError(''); setSuccess(''); }}
            className={`flex items-center gap-2 px-6 py-3.5 border-b-2 text-xs font-bold uppercase tracking-wider transition-all
              ${activeTab === tab.id 
                ? 'border-slate-900 text-slate-900 bg-slate-50/30' 
                : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-violet-600" size={32} />
        </div>
      ) : (
        <div className="space-y-6">
          {/* TAB 1: EMPLOYEES */}
          {activeTab === 'employees' && (
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 border-b border-slate-50 bg-[#fcfdfe] px-8">
                  <tr>
                    <th className="px-8 py-4">Emp ID</th>
                    <th className="px-8 py-4">Name</th>
                    <th className="px-8 py-4">Dept / Desg</th>
                    <th className="px-8 py-4">Bank Details</th>
                    <th className="px-8 py-4">PF / ESI</th>
                    <th className="px-8 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-[13px] font-semibold text-slate-700">
                  {employees.length === 0 ? (
                    <tr><td colSpan={6} className="py-16 text-center text-slate-300 font-bold">No employees found.</td></tr>
                  ) : employees.map(emp => (
                    <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-4 text-violet-600 font-bold">#{emp.employeeId}</td>
                      <td className="px-8 py-4 font-bold text-slate-900">{emp.name}</td>
                      <td className="px-8 py-4 text-slate-500">
                        {emp.department || '—'} <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full ml-1 font-bold">{emp.designation || 'Staff'}</span>
                      </td>
                      <td className="px-8 py-4 text-slate-500 text-xs">
                        {emp.bankName ? `${emp.bankName} - A/c ${emp.bankAccount}` : '—'}
                      </td>
                      <td className="px-8 py-4 text-slate-500 text-xs">
                        PF: {emp.pfNumber || '—'} <br/> ESI: {emp.esiNumber || '—'}
                      </td>
                      <td className="px-8 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${emp.active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
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
                        className="px-4 py-2 border border-slate-200 hover:border-violet-600 hover:text-violet-600 rounded-xl text-xs font-bold transition-all"
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
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 border-b border-slate-50 bg-[#fcfdfe] px-8">
                  <tr>
                    <th className="px-8 py-4">Employee</th>
                    <th className="px-8 py-4 text-right">Basic Pay</th>
                    <th className="px-8 py-4 text-right">HRA</th>
                    <th className="px-8 py-4 text-right">DA</th>
                    <th className="px-8 py-4 text-right">Incentives</th>
                    <th className="px-8 py-4 text-right">Deductions (PF/ESI/PT)</th>
                    <th className="px-8 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-[13px] font-semibold text-slate-700">
                  {employees.map(emp => {
                    const struct = emp.SalaryStructure || {};
                    const totalDed = parseFloat(struct.pfDeduction||0) + parseFloat(struct.esiDeduction||0) + parseFloat(struct.profTaxDeduction||0);
                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-4">
                          <p className="font-bold text-slate-800">{emp.name}</p>
                          <p className="text-[10px] text-slate-400">#{emp.employeeId}</p>
                        </td>
                        <td className="px-8 py-4 text-right font-bold text-slate-900">{fmt(struct.basic || 0)}</td>
                        <td className="px-8 py-4 text-right text-slate-500">{fmt(struct.hra || 0)}</td>
                        <td className="px-8 py-4 text-right text-slate-500">{fmt(struct.da || 0)}</td>
                        <td className="px-8 py-4 text-right text-emerald-600 font-bold">{fmt(struct.incentives || 0)}</td>
                        <td className="px-8 py-4 text-right text-rose-500 font-bold">-{fmt(totalDed)}</td>
                        <td className="px-8 py-4 text-center">
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
                            className="bg-slate-100 hover:bg-violet-600 hover:text-white text-slate-600 px-4 py-2 rounded-xl text-xs font-bold transition-all"
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
                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
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
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-violet-400 transition-all appearance-none">
                    {MONTHS.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Year</label>
                  <input type="number" value={processForm.year} onChange={e => setProcessForm({ ...processForm, year: parseInt(e.target.value) })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-violet-400 transition-all" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Paid From (Bank / Cash Ledger)*</label>
                <select value={processForm.paymentLedgerId} onChange={e => setProcessForm({ ...processForm, paymentLedgerId: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-violet-400 transition-all appearance-none">
                  <option value="">— Select Cash/Bank Ledger —</option>
                  {ledgers.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>

              <button 
                onClick={handleProcessPayroll}
                disabled={saving}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {saving ? <><Loader2 size={16} className="animate-spin" /> Processing…</> : 'Process & Post G/L Voucher'}
              </button>
            </div>
          )}

          {/* TAB 5: PAYSLIPS */}
          {activeTab === 'payslips' && (
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 border-b border-slate-50 bg-[#fcfdfe] px-8">
                  <tr>
                    <th className="px-8 py-4">Employee</th>
                    <th className="px-8 py-4">Month/Year</th>
                    <th className="px-8 py-4 text-right">Gross Earnings</th>
                    <th className="px-8 py-4 text-right">Deductions</th>
                    <th className="px-8 py-4 text-right">Net Payable</th>
                    <th className="px-8 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-[13px] font-semibold text-slate-700">
                  {payslips.length === 0 ? (
                    <tr><td colSpan={6} className="py-16 text-center text-slate-300 font-bold">No processed payslips found. Process payroll first.</td></tr>
                  ) : payslips.map(slip => {
                    const gross = parseFloat(slip.basic||0) + parseFloat(slip.hra||0) + parseFloat(slip.da||0) + parseFloat(slip.incentives||0);
                    const ded = parseFloat(slip.pf||0) + parseFloat(slip.esi||0) + parseFloat(slip.profTax||0);
                    return (
                      <tr key={slip.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-4">
                          <p className="font-bold text-slate-800">{slip.Employee?.name}</p>
                          <p className="text-[10px] text-slate-400">#{slip.Employee?.employeeId}</p>
                        </td>
                        <td className="px-8 py-4 text-slate-600 font-bold">{slip.month} {slip.year}</td>
                        <td className="px-8 py-4 text-right text-slate-600">{fmt(gross)}</td>
                        <td className="px-8 py-4 text-right text-rose-500">-{fmt(ded)}</td>
                        <td className="px-8 py-4 text-right font-black text-violet-700">{fmt(slip.netSalary)}</td>
                        <td className="px-8 py-4 text-center">
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
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
        </div>
      )}

      {/* MODAL 1: ADD EMPLOYEE */}
      {showEmpModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Add New Employee</h2>
                <p className="text-xs text-slate-400 font-bold mt-0.5">Define employee parameters and bank details</p>
              </div>
              <button onClick={() => setShowEmpModal(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100"><X size={18} /></button>
            </div>
            <div className="p-8 grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Employee ID*</label>
                <input value={empForm.employeeId} onChange={e => setEmpForm({ ...empForm, employeeId: e.target.value })}
                  placeholder="e.g. EMP-001" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-violet-400" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Full Name*</label>
                <input value={empForm.name} onChange={e => setEmpForm({ ...empForm, name: e.target.value })}
                  placeholder="e.g. Manikandan" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-violet-400" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Department</label>
                <input value={empForm.department} onChange={e => setEmpForm({ ...empForm, department: e.target.value })}
                  placeholder="e.g. Engineering" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-violet-400" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Designation</label>
                <input value={empForm.designation} onChange={e => setEmpForm({ ...empForm, designation: e.target.value })}
                  placeholder="e.g. ERP Architect" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-violet-400" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Bank Name</label>
                <input value={empForm.bankName} onChange={e => setEmpForm({ ...empForm, bankName: e.target.value })}
                  placeholder="e.g. HDFC Bank" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-violet-400" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Account Number</label>
                <input value={empForm.bankAccount} onChange={e => setEmpForm({ ...empForm, bankAccount: e.target.value })}
                  placeholder="e.g. 501002342345" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-violet-400" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">IFSC Code</label>
                <input value={empForm.ifsc} onChange={e => setEmpForm({ ...empForm, ifsc: e.target.value })}
                  placeholder="e.g. HDFC0000123" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-violet-400" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">PAN Number</label>
                <input value={empForm.pan} onChange={e => setEmpForm({ ...empForm, pan: e.target.value })}
                  placeholder="e.g. ABCDE1234F" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-violet-400" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">PF Number</label>
                <input value={empForm.pfNumber} onChange={e => setEmpForm({ ...empForm, pfNumber: e.target.value })}
                  placeholder="e.g. KN/BG/12345/678" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-violet-400" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">ESI Number</label>
                <input value={empForm.esiNumber} onChange={e => setEmpForm({ ...empForm, esiNumber: e.target.value })}
                  placeholder="e.g. 31000123450001234" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-violet-400" />
              </div>
            </div>
            <div className="px-8 py-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button onClick={() => setShowEmpModal(false)} className="px-5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50">Cancel</button>
              <button onClick={handleCreateEmployee} disabled={saving} className="px-6 py-2.5 bg-violet-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-violet-700 transition-all">
                Save Employee
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: SETUP SALARY STRUCTURE */}
      {showStructModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Salary Structure: {selectedEmp?.name}</h2>
                <p className="text-xs text-slate-400 font-bold mt-0.5">Define wage components & deductions</p>
              </div>
              <button onClick={() => setShowStructModal(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100"><X size={18} /></button>
            </div>
            <div className="p-8 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Basic Pay (₹)*</label>
                  <input type="number" value={structForm.basic} onChange={e => setStructForm({ ...structForm, basic: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-violet-400" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">HRA (₹)</label>
                  <input type="number" value={structForm.hra} onChange={e => setStructForm({ ...structForm, hra: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-violet-400" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">DA (₹)</label>
                  <input type="number" value={structForm.da} onChange={e => setStructForm({ ...structForm, da: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-violet-400" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Incentives (₹)</label>
                  <input type="number" value={structForm.incentives} onChange={e => setStructForm({ ...structForm, incentives: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-violet-400" />
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Monthly Deductions</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">PF (₹)</label>
                    <input type="number" value={structForm.pfDeduction} onChange={e => setStructForm({ ...structForm, pfDeduction: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold outline-none focus:border-violet-400" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">ESI (₹)</label>
                    <input type="number" value={structForm.esiDeduction} onChange={e => setStructForm({ ...structForm, esiDeduction: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold outline-none focus:border-violet-400" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Prof Tax (₹)</label>
                    <input type="number" value={structForm.profTaxDeduction} onChange={e => setStructForm({ ...structForm, profTaxDeduction: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold outline-none focus:border-violet-400" />
                  </div>
                </div>
              </div>
            </div>
            <div className="px-8 py-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button onClick={() => setShowStructModal(false)} className="px-5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50">Cancel</button>
              <button onClick={handleSaveStructure} disabled={saving} className="px-6 py-2.5 bg-violet-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-violet-700 transition-all">
                Save Structure
              </button>
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
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-violet-400" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status*</label>
                <div className="flex border border-slate-200 rounded-xl overflow-hidden">
                  {['Present', 'Absent', 'Leave'].map(st => (
                    <button key={st} onClick={() => setAttForm({ ...attForm, status: st })}
                      className={`flex-1 py-3 text-xs font-bold transition-all ${attForm.status === st ? 'bg-violet-600 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
                      {st}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Remarks</label>
                <input value={attForm.remarks} onChange={e => setAttForm({ ...attForm, remarks: e.target.value })}
                  placeholder="e.g. Unpaid sick leave" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-violet-400" />
              </div>
            </div>
            <div className="px-8 py-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button onClick={() => setShowAttModal(false)} className="px-5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50">Cancel</button>
              <button onClick={handleSaveAttendance} disabled={saving} className="px-6 py-2.5 bg-violet-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-violet-700 transition-all">
                Save Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
