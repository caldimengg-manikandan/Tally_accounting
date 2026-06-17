import React from 'react';
import {
  X, User, Calendar, Clock, CheckCircle, AlertCircle,
  Pencil, Trash2, FileText, MapPin, Check
} from 'lucide-react';

const STATUS_COLORS = {
  'Present':       { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300' },
  'Absent':        { bg: 'bg-rose-100',    text: 'text-rose-800',    border: 'border-rose-300'    },
  'Half-Day':      { bg: 'bg-amber-100',   text: 'text-amber-800',   border: 'border-amber-300'   },
  'Leave':         { bg: 'bg-blue-100',    text: 'text-blue-800',    border: 'border-blue-300'    },
  'Sick-Leave':    { bg: 'bg-purple-100',  text: 'text-purple-800',  border: 'border-purple-300'  },
  'Casual-Leave':  { bg: 'bg-sky-100',     text: 'text-sky-800',     border: 'border-sky-300'     },
  'Earned-Leave':  { bg: 'bg-indigo-100',  text: 'text-indigo-800',  border: 'border-indigo-300'  },
  'Comp-Off':      { bg: 'bg-teal-100',    text: 'text-teal-800',    border: 'border-teal-300'    },
  'Holiday':       { bg: 'bg-orange-100',  text: 'text-orange-800',  border: 'border-orange-300'  },
};

const fmt = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
};

const fmtTime = (t) => {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
};

const InfoRow = ({ label, value, className = '' }) => (
  <div className="flex items-start justify-between py-2.5 border-b border-slate-50 last:border-0">
    <span className="text-xs font-semibold text-slate-400 w-36 shrink-0">{label}</span>
    <span className={`text-xs font-bold text-slate-700 text-right ${className}`}>{value || '—'}</span>
  </div>
);

export default function AttendanceDetailsModal({ record, canApprove, onClose, onEdit, onApprove, onDelete }) {
  if (!record) return null;

  const sc = STATUS_COLORS[record.Status] || STATUS_COLORS['Leave'];
  const emp = record.Employee;

  const breakTime = (() => {
    if (record.WorkingHours && record.CheckInTime && record.CheckOutTime) {
      try {
        const [ih, im] = record.CheckInTime.split(':').map(Number);
        const [oh, om] = record.CheckOutTime.split(':').map(Number);
        const totalMins = (oh * 60 + om) - (ih * 60 + im);
        const workMins = parseFloat(record.WorkingHours) * 60;
        const breakMins = Math.max(0, totalMins - workMins);
        if (breakMins > 0) return `${(breakMins / 60).toFixed(1)} hour${breakMins / 60 !== 1 ? 's' : ''}`;
      } catch { return null; }
    }
    return null;
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col animate-fade-in">

        {/* Status Banner */}
        <div className={`px-6 pt-6 pb-4 ${sc.bg} border-b ${sc.border}`}>
          <div className="flex items-start justify-between">
            <div>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-extrabold border ${sc.bg} ${sc.text} ${sc.border} mb-2`}>
                <span className={`w-2 h-2 rounded-full ${sc.bg.replace('bg-', 'bg-').replace('-100', '-500')}`} />
                {record.Status}
              </span>
              <h3 className="text-base font-extrabold text-slate-900">Attendance Details</h3>
            </div>
            <button onClick={onClose} className="w-8 h-8 bg-white/70 hover:bg-white rounded-xl flex items-center justify-center text-slate-500 transition-all">
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

          {/* Employee Card */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-sm shrink-0">
              {(emp?.name || 'U')[0].toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-extrabold text-slate-800">{emp?.name || 'Unknown'}</p>
              <p className="text-[10px] text-slate-400 font-semibold">#{emp?.employeeId} · {emp?.department || 'No Dept'}</p>
              <p className="text-[10px] text-slate-400">{emp?.designation || ''}</p>
            </div>
          </div>

          {/* Attendance Info */}
          <div className="bg-white rounded-xl border border-slate-100 px-4 py-1">
            <InfoRow label="Date" value={fmt(record.AttendanceDate)} />
            <InfoRow label="Status" value={record.Status} className={sc.text} />
            {record.LeaveType && <InfoRow label="Leave Type" value={record.LeaveType} />}
            <InfoRow label="Working Hours" value={record.WorkingHours ? `${record.WorkingHours} hours` : null} />
            {record.CheckInTime && <InfoRow label="Check-In" value={fmtTime(record.CheckInTime)} />}
            {record.CheckOutTime && <InfoRow label="Check-Out" value={fmtTime(record.CheckOutTime)} />}
            {breakTime && <InfoRow label="Break Time" value={breakTime} />}
            {record.Notes && <InfoRow label="Notes" value={record.Notes} />}
          </div>

          {/* Location (if present) */}
          {(record.Latitude || record.Longitude) && (
            <div className="flex items-center gap-2 p-3 bg-sky-50 border border-sky-100 rounded-xl text-xs text-sky-700 font-semibold">
              <MapPin size={13} />
              Geo: {record.Latitude?.toFixed(4)}, {record.Longitude?.toFixed(4)}
            </div>
          )}

          {/* Approval Status */}
          <div className={`p-4 rounded-xl border ${record.IsApproved ? 'bg-emerald-50 border-emerald-200' : 'bg-orange-50 border-orange-200'}`}>
            <div className="flex items-center gap-2 mb-1">
              {record.IsApproved
                ? <CheckCircle size={16} className="text-emerald-600" />
                : <AlertCircle size={16} className="text-orange-500" />
              }
              <span className={`text-xs font-extrabold ${record.IsApproved ? 'text-emerald-700' : 'text-orange-700'}`}>
                {record.IsApproved ? 'Approved' : 'Pending Approval'}
              </span>
            </div>
            {record.IsApproved && record.ApprovedByUser && (
              <p className="text-[11px] text-emerald-600 mt-1">
                By {record.ApprovedByUser.name} · {fmt(record.ApprovedDate)}
              </p>
            )}
          </div>

          {/* Audit */}
          <div className="text-[10px] text-slate-400 space-y-0.5 px-1">
            {record.CreatedByUser && (
              <p>Created by <span className="font-semibold text-slate-500">{record.CreatedByUser.name}</span> · {fmt(record.createdAt)}</p>
            )}
            {record.updatedAt && record.updatedAt !== record.createdAt && (
              <p>Last updated · {fmt(record.updatedAt)}</p>
            )}
          </div>
        </div>

        {/* Action Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-wrap gap-2">
          {!record.IsApproved && (
            <button
              onClick={() => onEdit(record)}
              className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs font-bold text-slate-600 hover:border-amber-400 hover:text-amber-600 transition-all"
            >
              <Pencil size={12} /> Edit
            </button>
          )}
          {canApprove && !record.IsApproved && (
            <button
              onClick={() => onApprove(record.id)}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all"
            >
              <Check size={12} /> Approve
            </button>
          )}
          {!record.IsApproved && (
            <button
              onClick={() => onDelete(record.id)}
              className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs font-bold text-rose-500 hover:border-rose-400 hover:bg-rose-50 transition-all"
            >
              <Trash2 size={12} /> Delete
            </button>
          )}
          <button onClick={onClose} className="ml-auto flex items-center gap-1.5 px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs font-bold text-slate-500 hover:border-slate-300 transition-all">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
