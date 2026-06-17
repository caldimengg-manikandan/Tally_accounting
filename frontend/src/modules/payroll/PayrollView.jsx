import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Users, Plus, Check, X, AlertCircle, Loader2, RefreshCcw, DollarSign, Calendar, FileText, Settings, UserCheck, Info, Pencil, Sliders, Banknote, TrendingUp, TrendingDown
} from 'lucide-react';
import { payrollAPI, ledgerAPI } from '../../services/api';
import CreatableSelect from '../../components/CreatableSelect';

// Subcomponents
import EmployeeList from './components/EmployeeList';
import EmployeeForm from './components/EmployeeForm';
import EmployeeDetails from './components/EmployeeDetails';
import EmployeeImport from './components/EmployeeImport';
import AttendanceLogsPage from './components/AttendanceLogsPage';
import SalaryStructuresPage from './components/salary/SalaryStructuresPage';
import PayrollSettingsForm from './components/PayrollSettingsForm';
import ProcessPayrollForm from './components/step4/ProcessPayrollForm';
import EmployeeDetailsDrawer from '../../components/payroll/EmployeeDetailsDrawer';

const fmt = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function PayrollView({ companyId, showNewEmployeeForm }) {
  const [activeTab, setActiveTab] = useState('employees'); // 'employees' | 'attendance' | 'structures' | 'process' | 'payslips' | 'settings'
  
  const [payrollSettings, setPayrollSettings] = useState({ pfEmployeeRate: 12.00, esiEmployeeRate: 0.75, ptMonthlyAmount: 200.00 });
  
  // Employees list data states
  const [employees, setEmployees] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [empPage, setEmpPage] = useState(1);
  const [empLimit, setEmpLimit] = useState(10);
  const [empPages, setEmpPages] = useState(1);
  const [empSearch, setEmpSearch] = useState('');
  const [empFilters, setEmpFilters] = useState({
    status: '',
    department: '',
    employmentType: '',
    includeArchived: 'false',
    sortBy: 'createdAt',
    sortDir: 'DESC'
  });

  // Flow states
  const [selectedEmpForForm, setSelectedEmpForForm] = useState(null);
  const [showEmpFormView, setShowEmpFormView] = useState(false);
  const [selectedEmpForDetail, setSelectedEmpForDetail] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showImportDrawer, setShowImportDrawer] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [ledgers, setLedgers] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Forms & Modal states
  const [showHRA, setShowHRA] = useState(false);
  const [showStructModal, setShowStructModal] = useState(false);
  const [showAttModal, setShowAttModal] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null); // Used specifically for attendance/structures
  
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

  // Parse User Role for permission checks
  const user = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  }, []);
  const userRole = user.role || 'VIEWER';

  // Toggle form view if triggered via routing parameter
  useEffect(() => {
    if (showNewEmployeeForm) {
      setSelectedEmpForForm(null);
      setShowEmpFormView(true);
    }
  }, [showNewEmployeeForm]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [allEmpRes, ledgRes, attRes, payRes, setRes] = await Promise.all([
        payrollAPI.getEmployees(companyId, { limit: 1000 }),
        ledgerAPI.getByCompany(companyId),
        payrollAPI.getAttendance(companyId),
        payrollAPI.getPayslips(companyId),
        payrollAPI.getSettings(companyId)
      ]);
      setAllEmployees(Array.isArray(allEmpRes.data.employees) ? allEmpRes.data.employees : []);
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

  const fetchEmployees = async () => {
    try {
      const res = await payrollAPI.getEmployees(companyId, {
        page: empPage,
        limit: empLimit,
        search: empSearch,
        ...empFilters
      });
      setEmployees(Array.isArray(res.data.employees) ? res.data.employees : []);
      setTotalEmployees(res.data.total || 0);
      setEmpPages(res.data.pages || 1);
    } catch (err) {
      console.error(err);
      setError('Fetch Employees Error: ' + (err.response?.data?.error || err.message));
    }
  };

  useEffect(() => {
    if (companyId) {
      fetchData();
    }
  }, [companyId]);

  useEffect(() => {
    if (companyId) {
      fetchEmployees();
    }
  }, [companyId, empPage, empLimit, empSearch, empFilters]);

  // Soft Delete (Archive)
  const handleArchiveEmployee = async (id) => {
    try {
      await payrollAPI.deleteEmployee(id);
      setSuccess('Employee archived (deactivated) successfully!');
      fetchEmployees();
      // Refetch allEmployees
      const res = await payrollAPI.getEmployees(companyId, { limit: 1000 });
      setAllEmployees(Array.isArray(res.data.employees) ? res.data.employees : []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to archive employee');
    }
  };

  // Reactivate Soft Deleted
  const handleReactivateEmployee = async (id) => {
    try {
      await payrollAPI.reactivateEmployee(id);
      setSuccess('Employee reactivated successfully!');
      fetchEmployees();
      // Refetch allEmployees
      const res = await payrollAPI.getEmployees(companyId, { limit: 1000 });
      setAllEmployees(Array.isArray(res.data.employees) ? res.data.employees : []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reactivate employee');
    }
  };

  // Export CSV
  const handleExportCSV = async () => {
    try {
      const response = await payrollAPI.exportEmployees();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `employees_list_${companyId}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setSuccess('Employee list exported to CSV successfully!');
    } catch (err) {
      setError('Failed to export CSV: ' + (err.response?.data?.error || err.message));
    }
  };

  // Download PDF
  const handleDownloadPDF = async (id) => {
    try {
      const response = await payrollAPI.exportEmployeePDF(id);
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `employee_profile_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setSuccess('PDF profile sheet downloaded successfully!');
    } catch (err) {
      setError('Failed to download PDF profile: ' + (err.response?.data?.error || err.message));
    }
  };

  // Salary Structure save
  const handleSaveStructure = async () => {
    setSaving(true);
    setError('');
    try {
      await payrollAPI.saveSalaryStructure({
        ...structForm,
        employeeId: selectedEmp?.id,
        companyId,
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

  // Render employee onboarding multi-page form inline
  if (showEmpFormView) {
    return (
      <div className="p-8 max-w-[1400px] mx-auto animate-fade-in">
        <EmployeeForm
          employee={selectedEmpForForm}
          companyId={companyId}
          onClose={() => setShowEmpFormView(false)}
          onSave={() => {
            setShowEmpFormView(false);
            setSuccess(selectedEmpForForm ? 'Employee updated successfully!' : 'Employee created successfully!');
            fetchEmployees();
            payrollAPI.getEmployees(companyId, { limit: 1000 }).then(res => {
              setAllEmployees(Array.isArray(res.data.employees) ? res.data.employees : []);
            });
          }}
        />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1400px] mx-auto animate-fade-in">
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
        </div>

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex gap-3 text-sm text-emerald-700 font-bold">
            <Check size={16} className="shrink-0 mt-0.5" /> {success}
          </div>
        )}

        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex gap-3 text-sm text-rose-700 font-bold">
            <AlertCircle size={16} className="shrink-0 mt-0.5" /> {error}
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
            {/* TAB 1: EMPLOYEES LIST */}
            {activeTab === 'employees' && (
              <EmployeeList
                employees={employees}
                total={totalEmployees}
                page={empPage}
                limit={empLimit}
                pages={empPages}
                onPageChange={setEmpPage}
                onLimitChange={setEmpLimit}
                onSearchChange={setEmpSearch}
                onFilterChange={setEmpFilters}
                onViewEmployee={(emp) => {
                  setSelectedEmployee(emp);
                }}
                onEditEmployee={(emp) => {
                  setSelectedEmpForForm(emp);
                  setShowEmpFormView(true);
                }}
                onArchiveEmployee={handleArchiveEmployee}
                onReactivateEmployee={handleReactivateEmployee}
                onOpenImport={() => setShowImportDrawer(true)}
                onOpenAdd={() => {
                  setSelectedEmpForForm(null);
                  setShowEmpFormView(true);
                }}
                onExportCSV={handleExportCSV}
              />
            )}

            {/* TAB 2: ATTENDANCE - Full Attendance Logs Module */}
            {activeTab === 'attendance' && (
              <AttendanceLogsPage
                companyId={companyId}
                employees={allEmployees}
              />
            )}

            {/* TAB 3: SALARY STRUCTURES (Dynamic) */}
            {activeTab === 'structures' && (
              <SalaryStructuresPage />
            )}

            {/* TAB 4: PROCESS PAYROLL */}
            {activeTab === 'process' && (
              <ProcessPayrollForm 
                companyId={companyId} 
                onComplete={() => {
                  fetchData();
                  setActiveTab('payslips');
                }} 
              />
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
              <PayrollSettingsForm 
                companyId={companyId} 
                initialSettings={payrollSettings} 
                onSaveSuccess={(data) => {
                  setPayrollSettings(data);
                  setSuccess('Payroll settings synchronized successfully.');
                }} 
              />
            )}
          </div>
        )}
      </div>

      {/* Slide-over/Modal: Employee Detail View */}
      {showDetailModal && selectedEmpForDetail && (
        <EmployeeDetails
          employee={selectedEmpForDetail}
          userRole={userRole}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedEmpForDetail(null);
          }}
          onEdit={(emp) => {
            setShowDetailModal(false);
            setSelectedEmpForDetail(null);
            setSelectedEmpForForm(emp);
            setShowEmpFormView(true);
          }}
          onDownloadPDF={handleDownloadPDF}
        />
      )}

      {/* Drawer: CSV Bulk Import */}
      {showImportDrawer && (
        <EmployeeImport
          onClose={() => setShowImportDrawer(false)}
          onImportSuccess={() => {
            setShowImportDrawer(false);
            setSuccess('Employees imported successfully!');
            fetchEmployees();
            payrollAPI.getEmployees(companyId, { limit: 1000 }).then(res => {
              setAllEmployees(Array.isArray(res.data.employees) ? res.data.employees : []);
            });
          }}
        />
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
>>>>>>> origin/main
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
        </div>,
        document.body
      )}

      {/* MODAL 3: LOG ATTENDANCE */}
      {showAttModal && createPortal(
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
        </div>,
        document.body
      )}

      {/* Slide-Out Profile Drawer */}
      <EmployeeDetailsDrawer
        isOpen={!!selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
        employeeData={selectedEmployee}
      />
    </div>
  );
}
