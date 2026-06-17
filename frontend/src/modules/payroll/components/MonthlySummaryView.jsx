import React, { useState, useEffect } from 'react';
import {
  BarChart3, Calendar, ChevronLeft, ChevronRight,
  Download, Loader2, Users, TrendingUp, AlertCircle
} from 'lucide-react';
import { attendanceAPI } from '../../../services/api';

const getCurrentMonth = () => new Date().toISOString().slice(0, 7);

const BAR_MAX_W = 120; // max px for bar

const pctColor = (pct) => {
  if (pct >= 90) return 'bg-emerald-500';
  if (pct >= 75) return 'bg-amber-500';
  return 'bg-rose-500';
};

const pctTextColor = (pct) => {
  if (pct >= 90) return 'text-emerald-600';
  if (pct >= 75) return 'text-amber-600';
  return 'text-rose-600';
};

export default function MonthlySummaryView({ companyId }) {
  const [month, setMonth] = useState(getCurrentMonth());
  const [data, setData] = useState([]);
  const [workingDays, setWorkingDays] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchSummary = async () => {
    if (!companyId) return;
    setLoading(true);
    setError('');
    try {
      const res = await attendanceAPI.getMonthlySummary({ companyId, month });
      setData(res.data.data || []);
      setWorkingDays(res.data.workingDays || 0);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSummary(); }, [companyId, month]);

  const handleExport = async () => {
    try {
      const fromDate = `${month}-01`;
      const [y, m] = month.split('-').map(Number);
      const last = new Date(y, m, 0).getDate();
      const toDate = `${month}-${String(last).padStart(2, '0')}`;
      const res = await attendanceAPI.exportCSV({ companyId, fromDate, toDate });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_summary_${month}.csv`;
      a.click();
    } catch { alert('Export failed'); }
  };

  // Aggregates
  const totalPresent = data.reduce((s, r) => s + r.presentDays, 0);
  const totalAbsent  = data.reduce((s, r) => s + r.absentDays, 0);
  const totalLeave   = data.reduce((s, r) => s + r.sickLeaveDays + r.casualLeaveDays + r.earnedLeaveDays + r.compOffDays, 0);
  const avgPct = data.length ? (data.reduce((s, r) => s + r.attendancePercentage, 0) / data.length).toFixed(1) : 0;

  const prevMonth = () => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m - 2, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };
  const nextMonth = () => {
    const [y, m] = month.split('-').map(Number);
    if (month >= getCurrentMonth()) return;
    const d = new Date(y, m, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-2 border border-slate-200 rounded-xl hover:border-blue-400 text-slate-400 hover:text-blue-600 transition-all">
            <ChevronLeft size={15} />
          </button>
          <input
            type="month"
            value={month}
            max={getCurrentMonth()}
            onChange={e => setMonth(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-400 transition-all"
          />
          <button onClick={nextMonth} disabled={month >= getCurrentMonth()} className="p-2 border border-slate-200 rounded-xl hover:border-blue-400 text-slate-400 hover:text-blue-600 transition-all disabled:opacity-30">
            <ChevronRight size={15} />
          </button>
          <span className="text-xs text-slate-400 font-semibold">{workingDays} working days</span>
        </div>
        <button
          onClick={handleExport}
          className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:border-blue-400 hover:text-blue-600 transition-all flex items-center gap-1.5"
        >
          <Download size={13} /> Export CSV
        </button>
      </div>

      {/* Summary Stats */}
      {data.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Avg Attendance', value: `${avgPct}%`, color: 'blue', icon: TrendingUp },
            { label: 'Total Present',  value: totalPresent, color: 'emerald', icon: Users },
            { label: 'Total Absent',   value: totalAbsent,  color: 'rose',    icon: Users },
            { label: 'On Leave',       value: totalLeave,   color: 'amber',   icon: Calendar },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-${color}-50 flex items-center justify-center`}>
                <Icon size={18} className={`text-${color}-500`} />
              </div>
              <div>
                <p className="text-xl font-extrabold text-slate-800 leading-none">{value}</p>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-sm text-rose-700 font-semibold flex items-center gap-2">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 className="animate-spin mr-2" size={22} /> Loading summary...
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <BarChart3 size={36} className="mb-3 opacity-30" />
            <p className="font-semibold text-sm">No attendance data for this month</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/80 border-b border-slate-100">
                <tr>
                  {['Emp ID', 'Employee', 'Dept', 'Present', 'Absent', 'Half', 'Leaves', 'Comp-Off', 'Attendance %'].map(h => (
                    <th key={h} className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.map(r => (
                  <tr key={r.employeeId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 text-[11px] font-mono font-bold text-slate-400">#{r.employeeCode}</td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-xs font-bold text-slate-800 whitespace-nowrap">{r.employeeName}</p>
                        <p className="text-[10px] text-slate-400">{r.designation || ''}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{r.department || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-extrabold text-emerald-600">{r.presentDays}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-extrabold ${r.absentDays > 0 ? 'text-rose-600' : 'text-slate-400'}`}>{r.absentDays}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-extrabold ${r.halfDays > 0 ? 'text-amber-600' : 'text-slate-400'}`}>{r.halfDays}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-600">
                        {r.sickLeaveDays + r.casualLeaveDays + r.earnedLeaveDays + r.leaveDays || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-600">{r.compOffDays || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${pctColor(r.attendancePercentage)}`}
                            style={{ width: `${Math.min(r.attendancePercentage, 100)}%` }}
                          />
                        </div>
                        <span className={`text-xs font-extrabold whitespace-nowrap ${pctTextColor(r.attendancePercentage)}`}>
                          {r.attendancePercentage}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>

              {/* Footer Row */}
              <tfoot className="bg-slate-50/80 border-t border-slate-200">
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-[10px] font-extrabold uppercase text-slate-500 tracking-widest">
                    Team Total ({data.length} employees)
                  </td>
                  <td className="px-4 py-3 text-xs font-extrabold text-emerald-600">{totalPresent}</td>
                  <td className="px-4 py-3 text-xs font-extrabold text-rose-600">{totalAbsent}</td>
                  <td className="px-4 py-3 text-xs font-extrabold text-amber-600">
                    {data.reduce((s, r) => s + r.halfDays, 0)}
                  </td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-600">{totalLeave}</td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-600">
                    {data.reduce((s, r) => s + r.compOffDays, 0)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-extrabold text-blue-600">{avgPct}% avg</span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
