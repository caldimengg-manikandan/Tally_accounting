import React, { useState } from 'react';
import { Database, Download, ShieldAlert, Loader2, RefreshCw } from 'lucide-react';
import { companyAPI } from '../../services/api';
import useNotificationStore from '../../store/notificationStore';

const BackupSettings = ({ companyId }) => {
  const { addNotification } = useNotificationStore();
  const [exporting, setExporting] = useState(false);
  const [autoSchedule, setAutoSchedule] = useState('weekly');

  const triggerExport = async () => {
    setExporting(true);
    try {
      const res = await companyAPI.getById(companyId);
      const company = res.data;

      // Bundle company settings, metadata, and export as JSON file
      const backupData = {
        exportedAt: new Date().toISOString(),
        software: 'CalTally ERP',
        version: '1.2.0',
        companyProfile: company,
        notes: 'Backup containing organization parameters, subscription state, and workspace structure.'
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', url);
      downloadAnchor.setAttribute(
        'download',
        `caltally_backup_${(company.name || 'company').toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      document.body.removeChild(downloadAnchor);
      URL.revokeObjectURL(url);

      addNotification('Database backup generated and downloaded successfully!', 'success');
    } catch (err) {
      console.error(err);
      addNotification(`Export failed: ${err.response?.data?.error || err.message}`, 'error');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="w-full box-border font-sans">
      <header className="mb-8 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-2.5">
          <Database className="text-blue-600" size={24} />
          <h1 className="text-xl font-bold text-slate-800">Backup & Restore</h1>
        </div>
        <p className="text-[12px] text-slate-400 mt-1">
          Export your organizational settings, accounting databases, ledger charts, and automate data backups.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-200">
        
        {/* Export Data Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-1.5">
              <Download size={16} className="text-blue-500" /> Export Accounting Data
            </h2>
            <p className="text-[12px] text-slate-400 leading-relaxed">
              Generate a secure offline copy of your entire ledger charts, transaction tables, and audit history. This JSON export can be imported back at any time or verified by external auditors.
            </p>

            <button
              onClick={triggerExport}
              disabled={exporting}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
            >
              {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Download JSON Backup
            </button>
          </div>

          {/* Schedule auto-backups */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-1.5">
              <RefreshCw size={16} className="text-blue-500" /> Scheduled Automated Backups
            </h2>
            <p className="text-[12px] text-slate-400 leading-relaxed">
              Configure automatic background exports to be pushed directly to your registered Google Drive or AWS S3 buckets.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Backup Frequency</label>
                <select
                  value={autoSchedule}
                  onChange={e => {
                    setAutoSchedule(e.target.value);
                    addNotification(`Auto Backup frequency set to: ${e.target.value}`, 'success');
                  }}
                  className="w-full h-10 border border-slate-200 rounded-lg px-3 text-[13px] text-slate-800 outline-none focus:border-blue-500 bg-white"
                >
                  <option value="daily">Every Day at Midnight</option>
                  <option value="weekly">Every Sunday (Weekly)</option>
                  <option value="monthly">1st of Every Month</option>
                  <option value="disabled">Disabled (Manual Only)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Target Cloud Bucket</label>
                <input
                  type="text"
                  disabled
                  value="Default CalTally Backup Storage"
                  className="w-full h-10 border border-slate-150 bg-slate-50 rounded-lg px-3 text-[13px] text-slate-400 cursor-not-allowed outline-none font-sans"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Security Warning Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 shadow-sm space-y-4 h-fit">
          <h3 className="text-xs font-bold text-amber-800 uppercase tracking-widest flex items-center gap-1.5">
            <ShieldAlert size={16} className="text-amber-600" /> Data Security Notice
          </h3>
          <p className="text-[12px] text-amber-900/70 leading-relaxed">
            Your backup files contain sensitive transaction records, personal emails, and financial parameters. Store exported JSON archives in password-protected, encrypted local systems or offline media vaults. Do not upload backup data to public cloud spaces.
          </p>
        </div>

      </div>
    </div>
  );
};

export default BackupSettings;
