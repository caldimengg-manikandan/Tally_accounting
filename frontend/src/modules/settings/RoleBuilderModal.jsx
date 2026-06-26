import React, { useState } from 'react';
import { Shield, Plus, Loader2, X, Save } from 'lucide-react';
import { rolesAPI } from '../../services/api';

const BASE_PERMISSIONS = [
  { value: 'ADMIN', label: 'Company Administrator', points: ['✔ Unrestricted system access', '✔ Manage billing and users', '✔ Modify company settings', '✔ Complete control'] },
  { value: 'ACCOUNTANT', label: 'Professional Accountant', points: ['✔ Post transactions', '✔ Record manual journals', '✔ View Daybooks', '✖ Change settings'] },
  { value: 'AUDITOR', label: 'Financial Auditor', points: ['✔ View all reports', '✔ Access ledger logs', '✔ Access audit logs', '✖ Modify or delete data'] },
  { value: 'MANAGER', label: 'Manager', points: ['✔ View all modules', '✔ Approve transactions', '✔ Manage inventory', '✖ Delete audit logs'] },
  { value: 'EMPLOYEE', label: 'Standard Employee', points: ['✔ Create basic vouchers', '✔ View assigned items', '✖ Access reports', '✖ Approve transactions'] },
  { value: 'VIEWER', label: 'Read-Only Viewer', points: ['✔ View dashboards', '✔ View item lists', '✖ Create or edit any data'] }
];

const RoleBuilderModal = ({ isOpen, onClose, onSaved }) => {
  const [form, setForm] = useState({ name: '', description: '', baseRole: 'ACCOUNTANT' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const selectedBase = BASE_PERMISSIONS.find(p => p.value === form.baseRole);

  const handleSave = async () => {
    if (!form.name.trim()) return setError('Role Name is required');
    setSaving(true);
    setError(null);
    try {
      await rolesAPI.createRole(form);
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create role');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-lg font-bold flex items-center gap-2"><Shield className="text-blue-500"/> Create Custom Role</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500"><X size={18} /></button>
        </div>
        
        <div className="p-5 space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}
          
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Role Name *</label>
            <input 
              type="text" 
              value={form.name} 
              onChange={e => setForm({...form, name: e.target.value})}
              placeholder="e.g. Senior Financial Advisor"
              className="w-full border p-2 rounded-lg text-sm"
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
            <textarea 
              value={form.description} 
              onChange={e => setForm({...form, description: e.target.value})}
              placeholder="What does this role do?"
              className="w-full border p-2 rounded-lg text-sm h-20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Base Permission Level *</label>
            <select 
              value={form.baseRole} 
              onChange={e => setForm({...form, baseRole: e.target.value})}
              className="w-full border p-2 rounded-lg text-sm bg-white"
            >
              {BASE_PERMISSIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>

          {selectedBase && (
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mt-2">
              <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Permission Preview: {selectedBase.label}</h4>
              <ul className="text-sm space-y-1">
                {selectedBase.points.map((pt, i) => (
                  <li key={i} className={pt.startsWith('✔') ? 'text-green-700' : 'text-slate-500'}>{pt}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3 bg-slate-50">
          <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-lg">Cancel</button>
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg flex items-center gap-2"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Custom Role
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleBuilderModal;
