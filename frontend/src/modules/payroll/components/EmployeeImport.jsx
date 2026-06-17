import React, { useState } from 'react';
import { X, Upload, CheckCircle2, AlertTriangle, FileSpreadsheet, Loader2 } from 'lucide-react';
import { payrollAPI } from '../../../services/api';

export default function EmployeeImport({ onClose, onImportSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [successCount, setSuccessCount] = useState(0);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.name.endsWith('.csv')) {
      setFile(selectedFile);
      setErrors([]);
      setSuccessCount(0);
    } else {
      alert('Please select a valid CSV file.');
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setErrors([]);
    setSuccessCount(0);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const csvData = e.target.result;
      try {
        const res = await payrollAPI.process({
          // Wait, the API endpoint is payrollAPI.importEmployees which we will define in api.js
          // Let's call payrollAPI.importEmployees(csvData) directly
        });
        // Wait! Let's make sure we define this method in services/api.js first.
        // Let's use direct axios api post or define it. We'll add it to services/api.js.
      } catch (err) {
        // ...
      }
    };

    // Let's implement the FileReader load handler with correct API call
    reader.onload = async (e) => {
      const csvData = e.target.result;
      try {
        // We will call the import API. Let's make sure we use the direct axios instance if needed, 
        // or payrollAPI.importEmployees if we add it. 
        // Let's add the importEmployees and exportEmployees to services/api.js.
        // We will call it:
        const response = await payrollAPI.importEmployees(csvData);
        setSuccessCount(response.data.count);
        onImportSuccess();
      } catch (err) {
        const resErrors = err.response?.data?.errors || [];
        if (resErrors.length > 0) {
          setErrors(resErrors);
        } else {
          setErrors([{ row: 'General', error: err.response?.data?.error || err.message }]);
        }
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const headers = [
      'Employee ID', 'First Name', 'Middle Name', 'Last Name', 'Work Email', 
      'Mobile Number', 'Date of Joining', 'Date of Birth', 'Gender', 
      'Designation', 'Department', 'Employment Type', 'Status', 
      'Bank Name', 'Account Number', 'Account Type', 'IFSC Code', 
      'PAN Number', 'Aadhaar Number'
    ];
    const sampleRow = [
      'EMP-001', 'Rajesh', '', 'Kumar', 'rajesh.k@company.com',
      '9876543210', '2024-05-01', '1990-08-15', 'Male',
      'Senior Software Engineer', 'IT', 'Full Time', 'Active',
      'HDFC Bank', '50100234567890', 'Savings', 'HDFC0001234',
      'ABCDE1234F', '123456789012'
    ];
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), sampleRow.join(',')].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "employee_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="text-blue-600" size={20} />
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">Bulk Import Employees</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-200/50 hover:text-slate-600 transition-colors">
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Instructions */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 text-xs text-slate-500 leading-relaxed space-y-2">
            <p className="font-bold text-slate-700">Please format your CSV file according to the template:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>First Name and Work Email are required fields.</li>
              <li>Work Email, PAN, and Aadhaar numbers must be unique across all employees.</li>
              <li>IFSC Code must be 11 characters (e.g. HDFC0001234).</li>
              <li>Mobile numbers must be 10 digits. Aadhaar must be 12 digits.</li>
            </ul>
            <button 
              onClick={downloadTemplate} 
              className="text-blue-600 font-bold hover:underline block pt-1"
            >
              Download Template CSV
            </button>
          </div>

          {/* Upload Box */}
          <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 bg-slate-50/30 transition-all relative">
            <input 
              type="file" 
              accept=".csv"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              disabled={loading}
            />
            <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Upload size={22} />
            </div>
            {file ? (
              <div className="text-center">
                <p className="text-sm font-bold text-slate-800">{file.name}</p>
                <p className="text-xs text-slate-400 mt-1">{(file.size / 1024).toFixed(2)} KB</p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm font-bold text-slate-700">Drag and drop your CSV file here</p>
                <p className="text-xs text-slate-400 mt-1">or click to browse from files</p>
              </div>
            )}
          </div>

          {/* Progress / Success / Errors */}
          {loading && (
            <div className="flex items-center justify-center gap-2.5 py-4 text-sm font-bold text-slate-600">
              <Loader2 className="animate-spin text-blue-600" size={20} />
              Importing records and validating...
            </div>
          )}

          {successCount > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex gap-3 text-sm text-emerald-800 font-bold">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
              Successfully imported {successCount} employees!
            </div>
          )}

          {errors.length > 0 && (
            <div className="space-y-3">
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex gap-3 text-sm text-rose-800 font-bold">
                <AlertTriangle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                Import failed. Please resolve the following errors:
              </div>
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto divide-y divide-slate-100 text-xs">
                {errors.map((err, idx) => (
                  <div key={idx} className="px-4 py-2.5 flex justify-between bg-slate-50/50">
                    <span className="font-bold text-slate-500">Row {err.row}:</span>
                    <span className="font-semibold text-rose-600">{err.error}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/30">
          <button 
            onClick={onClose} 
            className="px-5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-600 tracking-wider uppercase transition-all bg-white"
          >
            Cancel
          </button>
          <button 
            onClick={handleImport}
            disabled={!file || loading}
            className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold tracking-wider uppercase shadow-md shadow-blue-600/10 transition-all"
          >
            Start Import
          </button>
        </div>

      </div>
    </div>
  );
}
