import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar, Plus, Download, Upload, Search, Filter,
  ChevronLeft, ChevronRight, Eye, Pencil, Trash2,
  CheckCircle, Clock, XCircle, AlertCircle, Loader2,
  RefreshCcw, Users, TrendingUp, Check, BarChart3
} from 'lucide-react';
import { attendanceAPI } from '../../../services/api';
import MarkAttendanceForm from './MarkAttendanceForm';
import AttendanceDetailsModal from './AttendanceDetailsModal';
import MonthlySummaryView from './MonthlySummaryView';
import AttendanceBulkImport from './AttendanceBulkImport';

const STATUS_COLORS = {
  'Present':       { bg: 'bg-emerald-50',  text: 'text-emerald-700',  border: 'border-emerald-200',  dot: 'bg-emerald-500'  },
  'Absent':        { bg: 'bg-rose-50',     text: 'text-rose-700',     border: 'border-rose-200',     dot: 'bg-rose-500'     },
  'Half-Day':      { bg: 'bg-amber-50',    text: 'text-amber-700',    border: 'border-amber-200',    dot: 'bg-amber-500'    },
  'Leave':         { bg: 'bg-blue-50',     text: 'text-blue-700',     border: 'border-blue-200',     dot: 'bg-blue-500'     },
  'Sick-Leave':    { bg: 'bg-purple-50',   text: 'text-purple-700',   border: 'border-purple-200',   dot: 'bg-purple-500'   },
  'Casual-Leave':  { bg: 'bg-sky-50',      text: 'text-sky-700',      border: 'border-sky-200',      dot: 'bg-sky-500'      },
  'Earned-Leave':  { bg: 'bg-indigo-50',   text: 'text-indigo-700',   border: 'border-indigo-200',   dot: 'bg-indigo-500'   },
  'Comp-Off':      { bg: 'bg-teal-50',     text: 'text-teal-700',     border: 'border-teal-200',     dot: 'bg-teal-500'     },
  'Holiday':       { bg: 'bg-orange-50',   text: 'text-orange-700',   border: 'border-orange-200',   dot: 'bg-orange-500'   },
};

const STATUS_OPTIONS = ['', 'Present', 'Absent', 'Half-Day', 'Sick-Leave', 'Casual-Leave', 'Earned-Leave', 'Comp-Off', 'Holiday', 'Leave'];

const fmt = (d) => {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getCurrentMonth = () => new Date().toISOString().slice(0, 7);

const StatusBadge = ({ status }) => {
  const c = STATUS_COLORS[status] || { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', dot: 'bg-slate-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {status}
    </span>
  );
};

export default function AttendanceLogsPage({ companyId, employees: allEmployees = [] }) {
  const [view, setView] = useState('logs'); // 'logs' | 'summary'
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState(getCurrentMonth());
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [pendingApproval, setPendingApproval] = useState(false);

  // Modals
  const [showForm, setShowForm] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [detailRecord, setDetailRecord] = useState(null);
  const [showImport, setShowImport] = useState(false);

  // Extract unique departments from employees
  const departments = [...new Set((allEmployees || []).map(e => e.department).filter(Boolean))];

  const fetchRecords = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError('');
    try {
      const fromDate = monthFilter ? `${monthFilter}-01` : undefined;
      const toDate = monthFilter ? (() => {
        const [y, m] = monthFilter.split('-').map(Number);
        const last = new Date(y, m, 0).getDate();
        return `${monthFilter}-${String(last).padStart(2, '0')}`;
      })() : undefined;

      const res = await attendanceAPI.getAll({
        companyId,
        page,
        limit,
        search: search || undefined,
        status: statusFilter || undefined,
        fromDate,
        toDate,
        department: departmentFilter || undefined,
        pendingApproval: pendingApproval ? 'true' : undefined
      });
      setRecords(res.data.data || []);
      setTotal(res.data.pagination?.total || 0);
      setPages(res.data.pagination?.pages || 1);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  }, [companyId, page, limit, search, statusFilter, monthFilter, departmentFilter, pendingApproval]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  // Auto-clear messages
  useEffect(() => {
    if (success) { const t = setTimeout(() => setSuccess(''), 3500); return () => clearTimeout(t); }
  }, [success]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this attendance record?')) return;
    try {
      await attendanceAPI.remove(id);
      setSuccess('Record deleted successfully');
      fetchRecords();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete record');
    }
  };

  const handleApprove = async (id) => {
    try {
      await attendanceAPI.approve(id, { isApproved: true });
      setSuccess('Attendance approved');
      fetchRecords();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to approve');
    }
  };

  const handleExportCSV = async () => {
    try {
      const fromDate = monthFilter ? `${monthFilter}-01` : undefined;
      const toDate = monthFilter ? (() => {
        const [y, m] = monthFilter.split('-').map(Number);
        const last = new Date(y, m, 0).getDate();
        return `${monthFilter}-${String(last).padStart(2, '0')}`;
      })() : undefined;
      const res = await attendanceAPI.exportCSV({ companyId, fromDate, toDate, status: statusFilter || undefined });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_${monthFilter || 'export'}.csv`;
      a.click();
      setSuccess('CSV exported successfully');
    } catch {
      setError('Export failed');
    }
  };

  const user = (() => { try { return JSON.parse(sessionStorage.getItem('user') || '{}'); } catch { return {}; } })();
  const canApprove = ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(user.role);

  // Statistics for current page view
  const presentCount = records.filter(r => r.Status === 'Present').length;
  const absentCount  = records.filter(r => r.Status === 'Absent').length;
  const leaveCount   = records.filter(r => ['Sick-Leave','Casual-Leave','Earned-Leave','Comp-Off','Leave','Holiday'].includes(r.Status)).length;
  const pendingCount = records.filter(r => !r.IsApproved).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Calendar size={15} className="text-white" />
            </div>
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Payroll</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Attendance Logs</h2>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">Track, manage & approve employee attendance records</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Toggle */}
          <div className="flex bg-slate-100 rounded-xl p-1">
            <button
              onClick={() => setView('logs')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5
                ${view === 'logs' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Calendar size={12} /> Logs
            </button>
            <button
              onClick={() => setView('summary')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5
                ${view === 'summary' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <BarChart3 size={12} /> Monthly Summary
            </button>
          </div>
          {view === 'logs' && (
            <>
              <button
                onClick={handleExportCSV}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:border-blue-400 hover:text-blue-600 transition-all flex items-center gap-1.5"
              >
                <Download size={13} /> Export CSV
              </button>
              <button
                onClick={() => setShowImport(true)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:border-indigo-400 hover:text-indigo-600 transition-all flex items-center gap-1.5"
              >
                <Upload size={13} /> Bulk Import
              </button>
              <button
                onClick={() => { setEditRecord(null); setShowForm(true); }}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 transition-all flex items-center gap-1.5"
              >
                <Plus size={13} /> Mark Attendance
              </button>
            </>
          )}
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 text-sm text-emerald-700 font-semibold">
          <Check size={15} /> {success}
        </div>
      )}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center gap-2 text-sm text-rose-700 font-semibold">
          <AlertCircle size={15} /> {error}
          <button onClick={() => setError('')} className="ml-auto text-rose-400 hover:text-rose-600"><XCircle size={14} /></button>
        </div>
      )}

      {/* Monthly Summary View */}
      {view === 'summary' && (
        <MonthlySummaryView companyId={companyId} />
      )}

      {/* Logs View */}
      {view === 'logs' && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Present',  value: total > 0 ? presentCount : '—', icon: CheckCircle, color: 'emerald' },
              { label: 'Absent',   value: total > 0 ? absentCount  : '—', icon: XCircle,     color: 'rose'    },
              { label: 'On Leave', value: total > 0 ? leaveCount   : '—', icon: Clock,       color: 'amber'   },
              { label: 'Pending Approval', value: pendingCount, icon: AlertCircle, color: 'orange' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-${color}-50 flex items-center justify-center shrink-0`}>
                  <Icon size={18} className={`text-${color}-500`} />
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-slate-800 leading-none">{value}</p>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <div className="flex flex-wrap gap-3">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, ID..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>

              {/* Month Picker */}
              <input
                type="month"
                value={monthFilter}
                onChange={e => { setMonthFilter(e.target.value); setPage(1); }}
                className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 transition-all"
              />

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 transition-all bg-white"
              >
                <option value="">All Status</option>
                {STATUS_OPTIONS.filter(Boolean).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              {/* Department Filter */}
              {departments.length > 0 && (
                <select
                  value={departmentFilter}
                  onChange={e => { setDepartmentFilter(e.target.value); setPage(1); }}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 transition-all bg-white"
                >
                  <option value="">All Departments</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              )}

              {/* Pending Approval Toggle */}
              <label className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-xl cursor-pointer hover:border-orange-300 transition-all">
                <input
                  type="checkbox"
                  checked={pendingApproval}
                  onChange={e => { setPendingApproval(e.target.checked); setPage(1); }}
                  className="accent-orange-500 w-3.5 h-3.5"
                />
                <span className="text-xs font-semibold text-slate-600">Pending Approval</span>
              </label>

              {/* Refresh */}
              <button
                onClick={fetchRecords}
                className="p-2 border border-slate-200 rounded-xl hover:border-blue-400 text-slate-400 hover:text-blue-600 transition-all"
                title="Refresh"
              >
                <RefreshCcw size={14} />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-20 text-slate-400">
                <Loader2 className="animate-spin mr-2" size={24} /> Loading records...
              </div>
            ) : records.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Calendar size={40} className="mb-3 opacity-30" />
                <p className="font-semibold text-sm">No attendance records found</p>
                <p className="text-xs mt-1">Try adjusting filters or mark new attendance</p>
                <button
                  onClick={() => { setEditRecord(null); setShowForm(true); }}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <Plus size={13} /> Mark First Attendance
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/80 border-b border-slate-100">
                    <tr>
                      {['Emp ID', 'Employee', 'Department', 'Date', 'Status', 'Hrs', 'In / Out', 'Approval', 'Actions'].map(h => (
                        <th key={h} className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {records.map(r => (
                      <tr
                        key={r.id}
                        className={`transition-colors hover:bg-slate-50/50
                          ${r.Status === 'Absent' ? 'bg-rose-50/20' : ''}
                          ${r.Status === 'Half-Day' ? 'bg-amber-50/20' : ''}
                          ${!r.IsApproved ? 'border-l-2 border-orange-300' : ''}
                        `}
                      >
                        <td className="px-4 py-3">
                          <span className="text-[11px] font-mono font-bold text-slate-500">#{r.Employee?.employeeId}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                              {(r.Employee?.name || 'U')[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800 whitespace-nowrap">{r.Employee?.name || '—'}</p>
                              <p className="text-[10px] text-slate-400">{r.Employee?.designation || ''}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">{r.Employee?.department || '—'}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">{fmt(r.AttendanceDate)}</span>
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={r.Status} /></td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-mono text-slate-600">
                            {r.WorkingHours ? `${r.WorkingHours}h` : '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[11px] text-slate-500 font-mono">
                            {r.CheckInTime ? `${r.CheckInTime} – ${r.CheckOutTime || '?'}` : '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {r.IsApproved ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                              <CheckCircle size={10} /> Approved
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-lg">
                              <Clock size={10} /> Pending
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setDetailRecord(r)}
                              className="p-1.5 hover:bg-blue-50 hover:text-blue-600 text-slate-400 rounded-lg transition-all"
                              title="View details"
                            >
                              <Eye size={13} />
                            </button>
                            {!r.IsApproved && (
                              <button
                                onClick={() => { setEditRecord(r); setShowForm(true); }}
                                className="p-1.5 hover:bg-amber-50 hover:text-amber-600 text-slate-400 rounded-lg transition-all"
                                title="Edit"
                              >
                                <Pencil size={13} />
                              </button>
                            )}
                            {canApprove && !r.IsApproved && (
                              <button
                                onClick={() => handleApprove(r.id)}
                                className="p-1.5 hover:bg-emerald-50 hover:text-emerald-600 text-slate-400 rounded-lg transition-all"
                                title="Approve"
                              >
                                <Check size={13} />
                              </button>
                            )}
                            {!r.IsApproved && (
                              <button
                                onClick={() => handleDelete(r.id)}
                                className="p-1.5 hover:bg-rose-50 hover:text-rose-600 text-slate-400 rounded-lg transition-all"
                                title="Delete"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {!loading && records.length > 0 && (
              <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 font-medium">
                    {total} records · Page {page} of {pages}
                  </span>
                  <select
                    value={limit}
                    onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}
                    className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white focus:outline-none"
                  >
                    {[10, 25, 50].map(n => <option key={n} value={n}>{n} per page</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-300 disabled:opacity-30 transition-all"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
                    const pg = i + 1;
                    return (
                      <button
                        key={pg}
                        onClick={() => setPage(pg)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-all
                          ${pg === page ? 'bg-blue-600 text-white' : 'border border-slate-200 text-slate-500 hover:border-blue-300'}`}
                      >
                        {pg}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage(p => Math.min(pages, p + 1))}
                    disabled={page === pages}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-300 disabled:opacity-30 transition-all"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Mark Attendance Form Modal */}
      {showForm && (
        <MarkAttendanceForm
          companyId={companyId}
          employees={allEmployees}
          editRecord={editRecord}
          onClose={() => { setShowForm(false); setEditRecord(null); }}
          onSave={() => {
            setShowForm(false);
            setEditRecord(null);
            setSuccess(editRecord ? 'Attendance updated!' : 'Attendance marked successfully!');
            fetchRecords();
          }}
        />
      )}

      {/* Details Modal */}
      {detailRecord && (
        <AttendanceDetailsModal
          record={detailRecord}
          canApprove={canApprove}
          onClose={() => setDetailRecord(null)}
          onEdit={(r) => { setDetailRecord(null); setEditRecord(r); setShowForm(true); }}
          onApprove={async (id) => { await handleApprove(id); setDetailRecord(null); }}
          onDelete={async (id) => { await handleDelete(id); setDetailRecord(null); }}
        />
      )}

      {/* Bulk Import */}
      {showImport && (
        <AttendanceBulkImport
          companyId={companyId}
          onClose={() => setShowImport(false)}
          onSuccess={(count) => {
            setShowImport(false);
            setSuccess(`Successfully imported ${count} attendance records!`);
            fetchRecords();
          }}
        />
      )}
    </div>
  );
}
