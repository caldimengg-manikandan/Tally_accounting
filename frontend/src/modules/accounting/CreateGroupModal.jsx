import React, { useState, useEffect } from 'react';
import { X, Check, Save, AlertCircle } from 'lucide-react';
import { groupAPI } from '../../services/api';

const CreateGroupModal = ({ isOpen, onClose, groupToEdit }) => {
  const [groups, setGroups] = useState([]);
  const [name, setName] = useState('');
  const [nature, setNature] = useState('Assets');
  const [parentId, setParentId] = useState('');
  const [category, setCategory] = useState('Sub-Group');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const companyId = sessionStorage.getItem('companyId');

  useEffect(() => {
    if (isOpen && companyId) {
      groupAPI.getByCompany(companyId).then(res => {
        setGroups(res.data.filter(g => g.category === 'Primary' || !g.parent_id));
      }).catch(console.error);

      if (groupToEdit) {
        setName(groupToEdit.name);
        setNature(groupToEdit.nature);
        setParentId(groupToEdit.parent_id || '');
        setCategory(groupToEdit.category);
      } else {
        setName('');
        setNature('Assets');
        setParentId('');
        setCategory('Sub-Group');
      }
    }
  }, [isOpen, companyId, groupToEdit]);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setError('Group name is required.');

    setSaving(true);
    setError('');
    try {
      const payload = {
        companyId,
        name: name.trim(),
        nature,
        category,
        parentId: parentId || null
      };

      if (groupToEdit) {
        await groupAPI.update(groupToEdit.id, payload);
      } else {
        await groupAPI.create(payload);
      }
      onClose();
    } catch (err) { setError(err.response?.data?.error || 'Failed to save group.'); }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 backdrop-blur-md bg-[#0f172a]/40 animate-fade-in">
      <div className="bg-white w-full max-w-xl rounded-[2rem] shadow-2xl border border-gray-100 flex flex-col">
        <div className="px-10 pt-10 pb-6 flex justify-between items-center bg-gray-50/50">
            <div>
               <h3 className="text-xl font-bold text-[#0f172a] tracking-tight">{groupToEdit ? 'Update Group' : 'New Management Group'}</h3>
               <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Hierarchical Classification</p>
            </div>
            <button type="button" onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400 hover:text-gray-900">
               <X size={20} />
            </button>
        </div>
        
        <form onSubmit={handleSave} className="p-10 space-y-6">
           {error && (
             <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl flex items-center gap-3">
               <AlertCircle size={18} />
               <p className="text-xs font-bold">{error}</p>
             </div>
           )}

           <div className="space-y-6">
              <div>
                 <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Group Name</label>
                 <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Operating Expenses" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-[#0f172a] outline-none focus:bg-white focus:border-[#1e3a8a] transition-all" />
              </div>

              <div className="grid grid-cols-2 gap-6">
                 <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Financial Nature</label>
                    <select value={nature} onChange={e => setNature(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-[#0f172a] outline-none">
                       {['Assets', 'Liabilities', 'Income', 'Expenses'].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Account Category</label>
                    <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-[#0f172a] outline-none">
                       <option value="Primary">Primary (Root)</option>
                       <option value="Sub-Group">Sub-Group (Member)</option>
                    </select>
                 </div>
              </div>

              {category === 'Sub-Group' && (
                <div>
                   <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Parent Group</label>
                   <select value={parentId} onChange={e => setParentId(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-[#0f172a] outline-none">
                      <option value="">Select Parent...</option>
                      {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                   </select>
                </div>
              )}
           </div>
           
           <div className="pt-6 flex justify-end gap-3 border-t border-gray-100">
              <button type="button" onClick={onClose} className="px-6 py-3 text-[#0f172a] text-[10px] font-bold tracking-widest uppercase hover:bg-gray-100 rounded-xl transition-all">Cancel</button>
              <button type="submit" disabled={saving} className="px-8 py-3 bg-[#0f172a] text-white rounded-xl text-[10px] font-bold tracking-widest uppercase shadow-lg hover:bg-[#1e3a8a] transition-all">
                 {saving ? 'Saving...' : 'Save Group'}
              </button>
           </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;
