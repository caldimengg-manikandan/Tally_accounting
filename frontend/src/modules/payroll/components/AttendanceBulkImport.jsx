import React, { useState, useRef } from 'react';
import { X, Upload, Download, FileText, AlertCircle, CheckCircle, Loader2, Info } from 'lucide-react';
import { attendanceAPI } from '../../../services/api';

const TEMPLATE_CSV = `employee_id,date,status,check_in,check_out,leave_type,notes
EMP-001,2026-06-17,Present,09:00,17:00,,Regular attendance
EMP-002,2026-06-17,Absent,,,, 
EMP-003,2026-06-17,Sick-Leave,,,,Medical leave
EMP-001,2026-06-16,Half-Day,09:00,13:00,,Half day
`;

const STATUS_OPTIONS = ['Present', 'Absent', 'Half-Day', 'Sick-Leave', 'Casual-Leave', 'Earned-Leave', 'Comp-Off', 'Holiday', 'Leave'];

function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
  return lines.slice(1).map(line => {
    const vals = line.split(',');
    const obj = {};
    headers.forEach((h, i) => { obj[h] = (vals[i] || '').trim(); });
    return obj;
  }).filter(r => r.employee_id || r.employeeid);
}

export default function AttendanceBulkImport({ companyId, onClose, onSuccess }) {
  const [step, setStep] = useState(1); // 1=upload, 2=preview, 3=done
  const [csvText, setCsvText] = useState('');
  const [parsed, setParsed] = useState([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'attendance_import_template.csv';
    a.click();
  };

  const handleFile = (file) => {
    if (!file || !file.name.endsWith('.csv')) {
      alert('Please upload a .csv file');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      setCsvText(text);
      const rows = parseCSV(text);
      setParsed(rows);
      setStep(2);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const handleImport = async () => {
    if (!parsed.length) return;
    setImporting(true);
    try {
      // Map CSV columns to API format
      const records = parsed.map(r => ({
        employeeId: r.employee_id || r.employeeid || r['emp id'] || r.emp_id,
        date: r.date || r.attendance_date || r.attendancedate,
        status: r.status,
        checkInTime: r.check_in || r.checkin || r.check_in_time,
        checkOutTime: r.check_out || r.checkout || r.check_out_time,
        leaveType: r.leave_type || r.leavetype,
        notes: r.notes || r.remarks
      }));

      const res = await attendanceAPI.bulkImport(records);
      setResult(res.data);
      setStep(3);
      if (res.data.imported > 0) {
        setTimeout(() => onSuccess(res.data.imported), 0);
      }
    } catch (err) {
      setResult({ error: err.response?.data?.error || 'Import failed', imported: 0, failed: parsed.length, errors: [] });
      setStep(3);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-fade-in overflow-hidden">

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Upload size={14} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-800">Bulk Import Attendance</h3>
              <p className="text-[10px] text-slate-400">Upload CSV to import multiple records at once</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all">
            <X size={14} />
          </button>
        </div>

        {/* Steps Indicator */}
        <div className="px-6 pt-4 flex items-center gap-2 shrink-0">
          {['Upload CSV', 'Preview', 'Result'].map((s, i) => (
            <React.Fragment key={s}>
              <div className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${step > i + 1 ? 'text-emerald-600' : step === i + 1 ? 'text-blue-600' : 'text-slate-300'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold border-2 transition-all
                  ${step > i + 1 ? 'bg-emerald-500 border-emerald-500 text-white' : step === i + 1 ? 'border-blue-600 text-blue-600' : 'border-slate-200 text-slate-300'}`}>
                  {step > i + 1 ? '✓' : i + 1}
                </span>
                {s}
              </div>
              {i < 2 && <div className="flex-1 h-px bg-slate-100" />}
            </React.Fragment>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* Step 1: Upload */}
          {step === 1 && (
            <>
              {/* Template Download */}
              <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                <Info size={14} className="text-blue-600 shrink-0" />
                <p className="text-xs text-blue-700 font-medium flex-1">
                  Download the template CSV, fill in attendance data, then upload it.
                </p>
                <button
                  onClick={downloadTemplate}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all whitespace-nowrap"
                >
                  <Download size={12} /> Template
                </button>
              </div>

              {/* Required Columns Info */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                <p className="text-xs font-bold text-slate-600">Required CSV Columns:</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    ['employee_id', 'Employee code (e.g. EMP-001)', true],
                    ['date', 'Date (YYYY-MM-DD)', true],
                    ['status', `One of: ${STATUS_OPTIONS.slice(0, 3).join(', ')}...`, true],
                    ['check_in', 'Time HH:MM (optional)', false],
                    ['check_out', 'Time HH:MM (optional)', false],
                    ['leave_type', 'Leave reason (optional)', false],
                    ['notes', 'Remarks (optional)', false],
                  ].map(([col, desc, req]) => (
                    <div key={col} className="flex items-start gap-1.5">
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md shrink-0 mt-0.5 ${req ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-500'}`}>
                        {col}
                      </span>
                      <span className="text-[10px] text-slate-400 leading-tight">{desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Drop Zone */}
              <div
                className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all
                  ${dragOver ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-slate-50 hover:border-blue-300'}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
              >
                <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => handleFile(e.target.files[0])} />
                <FileText size={32} className="mx-auto mb-3 text-slate-300" />
                <p className="text-sm font-bold text-slate-600">Drop CSV file here or click to browse</p>
                <p className="text-xs text-slate-400 mt-1">Only .csv files are supported</p>
              </div>
            </>
          )}

          {/* Step 2: Preview */}
          {step === 2 && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle size={15} className="text-emerald-500" />
                  <span className="text-sm font-bold text-slate-700">{parsed.length} records ready to import</span>
                </div>
                <button onClick={() => setStep(1)} className="text-xs text-blue-600 font-bold hover:underline">
                  ← Re-upload
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      {['#', 'Emp ID', 'Date', 'Status', 'Check In', 'Check Out', 'Notes'].map(h => (
                        <th key={h} className="px-3 py-2 font-extrabold text-slate-400 text-[10px] uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {parsed.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                        <td className="px-3 py-2 font-mono font-bold text-slate-700">{r.employee_id || r.employeeid}</td>
                        <td className="px-3 py-2 text-slate-600">{r.date}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold
                            ${r.status === 'Present' ? 'bg-emerald-50 text-emerald-700' :
                              r.status === 'Absent' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-400 font-mono">{r.check_in || '—'}</td>
                        <td className="px-3 py-2 text-slate-400 font-mono">{r.check_out || '—'}</td>
                        <td className="px-3 py-2 text-slate-400 truncate max-w-[120px]">{r.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 font-medium flex items-start gap-2">
                <AlertCircle size={13} className="shrink-0 mt-0.5" />
                Records with duplicate (Employee + Date) combinations will be skipped and shown in errors.
              </div>
            </>
          )}

          {/* Step 3: Result */}
          {step === 3 && result && (
            <div className="space-y-4">
              {result.error ? (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-sm text-rose-700 font-bold flex items-center gap-2">
                  <AlertCircle size={16} /> {result.error}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                    <p className="text-3xl font-extrabold text-emerald-700">{result.imported}</p>
                    <p className="text-xs font-bold text-emerald-600 mt-1">Records Imported</p>
                  </div>
                  <div className={`border rounded-xl p-4 text-center ${result.failed > 0 ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'}`}>
                    <p className={`text-3xl font-extrabold ${result.failed > 0 ? 'text-rose-700' : 'text-slate-400'}`}>{result.failed}</p>
                    <p className={`text-xs font-bold mt-1 ${result.failed > 0 ? 'text-rose-600' : 'text-slate-400'}`}>Failed / Skipped</p>
                  </div>
                </div>
              )}

              {result.errors?.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-600 mb-2">Error Details:</p>
                  <div className="bg-rose-50 border border-rose-100 rounded-xl max-h-40 overflow-y-auto">
                    {result.errors.map((e, i) => (
                      <div key={i} className="px-4 py-2 border-b border-rose-100 last:border-0 text-xs">
                        <span className="font-bold text-rose-700">Row {e.row}:</span>{' '}
                        <span className="text-rose-600">{e.error}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex gap-3 shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-500 hover:border-slate-300 transition-all">
            {step === 3 ? 'Close' : 'Cancel'}
          </button>
          {step === 2 && (
            <button
              onClick={handleImport}
              disabled={importing || !parsed.length}
              className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {importing ? <><Loader2 size={14} className="animate-spin" /> Importing...</> : `Import ${parsed.length} Records`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
