import React, { useState, useEffect } from 'react';
import {
  X, Calendar, Clock, User, Building2, CheckCircle, AlertCircle,
  Search, ChevronDown, Loader2
} from 'lucide-react';
import { attendanceAPI } from '../../../services/api';

const STATUS_OPTIONS = [
  'Present', 'Absent', 'Half-Day',
  'Sick-Leave', 'Casual-Leave', 'Earned-Leave', 'Comp-Off', 'Holiday', 'Leave'
];

const LEAVE_STATUSES = ['Sick-Leave', 'Casual-Leave', 'Earned-Leave', 'Comp-Off', 'Holiday', 'Leave', 'Half-Day'];
const TIME_STATUSES = ['Present', 'Half-Day'];

const STATUS_STYLES = {
  Present: 'border-emerald-300 bg-emerald-50 text-emerald-700',
  Absent: 'border-rose-300 bg-rose-50 text-rose-700',
  'Half-Day': 'border-amber-300 bg-amber-50 text-amber-700',
  'Sick-Leave': 'border-purple-300 bg-purple-50 text-purple-700',
  'Casual-Leave': 'border-sky-300 bg-sky-50 text-sky-700',
  'Earned-Leave': 'border-indigo-300 bg-indigo-50 text-indigo-700',
  'Comp-Off': 'border-teal-300 bg-teal-50 text-teal-700',
  Holiday: 'border-orange-300 bg-orange-50 text-orange-700',
  Leave: 'border-blue-300 bg-blue-50 text-blue-700',
};

const calcHours = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return '';
  try {
    const [ih, im] = checkIn.split(':').map(Number);
    const [oh, om] = checkOut.split(':').map(Number);
    const mins = (oh * 60 + om) - (ih * 60 + im);
    if (mins <= 0) return '';
    return (mins / 60).toFixed(2);
  } catch { return ''; }
};

export default function MarkAttendanceForm({ companyId, employees = [], editRecord, onClose, onSave }) {
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    employeeId: '',
    attendanceDate: today,
    status: 'Present',
    leaveType: '',
    checkInTime: '09:00',
    checkOutTime: '17:00',
    workingHours: '8',
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState('');
  const [empSearch, setEmpSearch] = useState('');
  const [showEmpDropdown, setShowEmpDropdown] = useState(false);

  // Populate edit mode
  useEffect(() => {
    if (editRecord) {
      setForm({
        employeeId: editRecord.EmployeeId || '',
        attendanceDate: editRecord.AttendanceDate || today,
        status: editRecord.Status || 'Present',
        leaveType: editRecord.LeaveType || '',
        checkInTime: editRecord.CheckInTime || '09:00',
        checkOutTime: editRecord.CheckOutTime || '17:00',
        workingHours: editRecord.WorkingHours?.toString() || '',
        notes: editRecord.Notes || ''
      });
      const emp = employees.find(e => e.id === editRecord.EmployeeId);
      if (emp) setEmpSearch(`${emp.employeeId} – ${emp.name}`);
    }
  }, [editRecord]);

  // Auto-calculate working hours when times change
  useEffect(() => {
    if (TIME_STATUSES.includes(form.status)) {
      const hrs = calcHours(form.checkInTime, form.checkOutTime);
      if (hrs) setForm(f => ({ ...f, workingHours: hrs }));
    }
  }, [form.checkInTime, form.checkOutTime, form.status]);

  const selectedEmp = employees.find(e => e.id === form.employeeId);
  const filteredEmps = employees.filter(e => {
    const q = empSearch.toLowerCase();
    return !q || e.name?.toLowerCase().includes(q) || e.employeeId?.toLowerCase().includes(q) || e.department?.toLowerCase().includes(q);
  });

  const showTimeFields = TIME_STATUSES.includes(form.status);
  const showLeaveType = LEAVE_STATUSES.includes(form.status);

  const validate = () => {
    const err = {};
    if (!form.employeeId) err.employeeId = 'Please select an employee';
    if (!form.attendanceDate) err.attendanceDate = 'Date is required';
    if (form.attendanceDate > today) err.attendanceDate = 'Date cannot be in the future';
    if (!form.status) err.status = 'Status is required';
    if (showTimeFields && form.checkInTime && form.checkOutTime) {
      const hrs = calcHours(form.checkInTime, form.checkOutTime);
      if (hrs === '') err.checkOutTime = 'Check-out must be after check-in';
    }
    return err;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    setErrors(err);
    if (Object.keys(err).length) return;

    setSaving(true);
    setApiError('');

    try {
      const payload = {
        companyId,
        employeeId: form.employeeId,
        attendanceDate: form.attendanceDate,
        status: form.status,
        leaveType: showLeaveType ? form.leaveType || null : null,
        checkInTime: showTimeFields ? form.checkInTime || null : null,
        checkOutTime: showTimeFields ? form.checkOutTime || null : null,
        workingHours: form.workingHours ? parseFloat(form.workingHours) : null,
        notes: form.notes || null
      };

      if (editRecord) {
        await attendanceAPI.update(editRecord.id, payload);
      } else {
        await attendanceAPI.create(payload);
      }
      onSave();
    } catch (err) {
      setApiError(err.response?.data?.error || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      {/* Slide-out Panel */}
      <div className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-slide-in-right overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-base font-extrabold text-white">
              {editRecord ? 'Edit Attendance' : 'Mark Attendance'}
            </h3>
            <p className="text-blue-100 text-xs mt-0.5">Fill all required fields</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center text-white transition-all">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {apiError && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-sm text-rose-700 font-semibold flex items-center gap-2">
              <AlertCircle size={14} /> {apiError}
            </div>
          )}

          {/* Employee Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Employee <span className="text-rose-500">*</span>
            </label>
            {editRecord ? (
              <div className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700">
                {selectedEmp?.name || 'Unknown Employee'}
                <span className="text-slate-400 font-normal ml-2 text-xs">#{selectedEmp?.employeeId}</span>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search employee..."
                    value={empSearch}
                    onChange={e => { setEmpSearch(e.target.value); setShowEmpDropdown(true); }}
                    onFocus={() => setShowEmpDropdown(true)}
                    className={`w-full pl-9 pr-4 py-2.5 border ${errors.employeeId ? 'border-rose-400' : 'border-slate-200'} rounded-xl text-sm focus:outline-none focus:border-blue-400 transition-all`}
                  />
                </div>
                {showEmpDropdown && filteredEmps.length > 0 && (
                  <div className="absolute z-10 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                    {filteredEmps.map(e => (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => {
                          setForm(f => ({ ...f, employeeId: e.id }));
                          setEmpSearch(`${e.employeeId} – ${e.name}`);
                          setShowEmpDropdown(false);
                          setErrors(prev => ({ ...prev, employeeId: '' }));
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-all"
                      >
                        <div className="text-xs font-bold text-slate-800">{e.name}</div>
                        <div className="text-[10px] text-slate-400">#{e.employeeId} · {e.department || 'No dept'}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {errors.employeeId && <p className="text-rose-500 text-[11px] mt-1">{errors.employeeId}</p>}
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Attendance Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              max={today}
              value={form.attendanceDate}
              onChange={e => setForm(f => ({ ...f, attendanceDate: e.target.value }))}
              disabled={!!editRecord}
              className={`w-full px-4 py-2.5 border ${errors.attendanceDate ? 'border-rose-400' : 'border-slate-200'} rounded-xl text-sm focus:outline-none focus:border-blue-400 transition-all ${editRecord ? 'bg-slate-50' : ''}`}
            />
            {errors.attendanceDate && <p className="text-rose-500 text-[11px] mt-1">{errors.attendanceDate}</p>}
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Status <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {STATUS_OPTIONS.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, status: s, workingHours: s === 'Half-Day' ? '4' : s === 'Present' ? '8' : '' }))}
                  className={`py-2 px-2 rounded-xl border text-[11px] font-bold transition-all text-center
                    ${form.status === s ? STATUS_STYLES[s] || 'border-blue-400 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Leave Type - show for leave-type statuses */}
          {showLeaveType && form.status !== 'Present' && form.status !== 'Absent' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Leave / Remarks</label>
              <input
                type="text"
                placeholder={`e.g. Medical visit, Personal work`}
                value={form.leaveType}
                onChange={e => setForm(f => ({ ...f, leaveType: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 transition-all"
              />
            </div>
          )}

          {/* Time fields - only for Present / Half-Day */}
          {showTimeFields && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Check-In Time</label>
                  <input
                    type="time"
                    value={form.checkInTime}
                    onChange={e => setForm(f => ({ ...f, checkInTime: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Check-Out Time</label>
                  <input
                    type="time"
                    value={form.checkOutTime}
                    onChange={e => setForm(f => ({ ...f, checkOutTime: e.target.value }))}
                    className={`w-full px-4 py-2.5 border ${errors.checkOutTime ? 'border-rose-400' : 'border-slate-200'} rounded-xl text-sm focus:outline-none focus:border-blue-400 transition-all`}
                  />
                  {errors.checkOutTime && <p className="text-rose-500 text-[11px] mt-1">{errors.checkOutTime}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Working Hours</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    max="24"
                    value={form.workingHours}
                    onChange={e => setForm(f => ({ ...f, workingHours: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 transition-all pr-12 bg-slate-50"
                    placeholder="Auto-calculated"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold">hrs</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Auto-calculated from check-in/out times</p>
              </div>
            </>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Notes (Optional)</label>
            <textarea
              rows={3}
              placeholder="Any remarks or comments..."
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 transition-all resize-none"
            />
          </div>

          {/* Preview Card */}
          {form.employeeId && form.attendanceDate && form.status && (
            <div className={`p-4 rounded-xl border-2 ${STATUS_STYLES[form.status] || 'border-slate-200 bg-slate-50 text-slate-700'}`}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2 opacity-60">Preview</p>
              <p className="font-bold text-sm">{selectedEmp?.name}</p>
              <p className="text-[11px] opacity-70 mt-0.5">
                {form.attendanceDate} · {form.status}
                {form.workingHours ? ` · ${form.workingHours}h` : ''}
              </p>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3 shrink-0 bg-slate-50/50">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-500 hover:border-slate-300 transition-all">
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : (editRecord ? 'Update Attendance' : 'Save Attendance')}
          </button>
        </div>
      </div>
    </div>
  );
}
