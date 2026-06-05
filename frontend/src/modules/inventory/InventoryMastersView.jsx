import React, { useState, useEffect } from 'react';
import { 
  Folder, Layers, Scale, Warehouse, Plus, Edit, Trash2, 
  RefreshCcw, Search, ChevronRight, Info, HelpCircle
} from 'lucide-react';
import { inventoryAPI } from '../../services/api';

const InventoryMastersView = () => {
  const [activeTab, setActiveTab] = useState('groups'); // 'groups' | 'categories' | 'units' | 'godowns'
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Data States
  const [groups, setGroups] = useState([]);
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [godowns, setGodowns] = useState([]);

  // Modal / Drawer States
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  
  // Form States
  const [groupForm, setGroupForm] = useState({ name: '', parent_id: '' });
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  const [unitForm, setUnitForm] = useState({ symbol: '', formalName: '', decimalPlaces: 0 });
  const [godownForm, setGodownForm] = useState({ name: '', address: '' });

  const companyId = sessionStorage.getItem('companyId');

  const fetchData = async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'groups') {
        const res = await inventoryAPI.getStockGroups(companyId);
        setGroups(res.data || []);
      } else if (activeTab === 'categories') {
        const res = await inventoryAPI.getStockCategories(companyId);
        setCategories(res.data || []);
      } else if (activeTab === 'units') {
        const res = await inventoryAPI.getUnits(companyId);
        setUnits(res.data || []);
      } else if (activeTab === 'godowns') {
        const res = await inventoryAPI.getGodowns(companyId);
        setGodowns(res.data || []);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to load master records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, companyId]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setGroupForm({ name: '', parent_id: '' });
    setCategoryForm({ name: '', description: '' });
    setUnitForm({ symbol: '', formalName: '', decimalPlaces: 0 });
    setGodownForm({ name: '', address: '' });
    setShowDrawer(true);
  };

  const handleOpenEdit = (item) => {
    setEditingId(item.id);
    if (activeTab === 'groups') {
      setGroupForm({ name: item.name, parent_id: item.parent_id || '' });
    } else if (activeTab === 'categories') {
      setCategoryForm({ name: item.name, description: item.description || '' });
    } else if (activeTab === 'units') {
      setUnitForm({ symbol: item.symbol, formalName: item.formalName, decimalPlaces: item.decimalPlaces || 0 });
    } else if (activeTab === 'godowns') {
      setGodownForm({ name: item.name, address: item.address || '' });
    }
    setShowDrawer(true);
  };

  const confirmDelete = (id) => {
    setDeleteTargetId(id);
    setDeleteConfirmOpen(true);
  };

  const handleExecuteDelete = async () => {
    if (!deleteTargetId) return;
    try {
      if (activeTab === 'groups') {
        await inventoryAPI.deleteStockGroup(deleteTargetId);
      } else if (activeTab === 'categories') {
        await inventoryAPI.deleteStockCategory(deleteTargetId);
      } else if (activeTab === 'units') {
        await inventoryAPI.deleteUnit(deleteTargetId);
      } else if (activeTab === 'godowns') {
        await inventoryAPI.deleteGodown(deleteTargetId);
      }
      setDeleteConfirmOpen(false);
      setDeleteTargetId(null);
      fetchData();
    } catch (err) {
      alert('Delete failed: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!companyId) return;
    try {
      if (activeTab === 'groups') {
        const payload = { ...groupForm, CompanyId: companyId, companyId };
        if (!payload.parent_id || payload.parent_id === '') payload.parent_id = null;
        
        if (editingId) {
          await inventoryAPI.updateStockGroup(editingId, payload);
        } else {
          await inventoryAPI.createStockGroup(payload);
        }
      } else if (activeTab === 'categories') {
        const payload = { ...categoryForm, CompanyId: companyId, companyId };
        if (editingId) {
          await inventoryAPI.updateStockCategory(editingId, payload);
        } else {
          await inventoryAPI.createStockCategory(payload);
        }
      } else if (activeTab === 'units') {
        const payload = { ...unitForm, CompanyId: companyId, companyId };
        if (editingId) {
          await inventoryAPI.updateUnit(editingId, payload);
        } else {
          await inventoryAPI.createUnit(payload);
        }
      } else if (activeTab === 'godowns') {
        const payload = { ...godownForm, CompanyId: companyId, companyId };
        if (editingId) {
          await inventoryAPI.updateGodown(editingId, payload);
        } else {
          await inventoryAPI.createGodown(payload);
        }
      }
      setShowDrawer(false);
      fetchData();
    } catch (err) {
      alert('Save failed: ' + (err.response?.data?.error || err.message));
    }
  };

  // Filter lists based on search query
  const getFilteredData = () => {
    const q = searchQuery.toLowerCase();
    if (activeTab === 'groups') {
      return groups.filter(g => g.name.toLowerCase().includes(q));
    } else if (activeTab === 'categories') {
      return categories.filter(c => c.name.toLowerCase().includes(q) || (c.description && c.description.toLowerCase().includes(q)));
    } else if (activeTab === 'units') {
      return units.filter(u => u.symbol.toLowerCase().includes(q) || u.formalName.toLowerCase().includes(q));
    } else if (activeTab === 'godowns') {
      return godowns.filter(g => g.name.toLowerCase().includes(q) || (g.address && g.address.toLowerCase().includes(q)));
    }
    return [];
  };

  const filteredData = getFilteredData();

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] bg-slate-50 p-6 font-sans">
      
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            Inventory Masters
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure stock groups, categories, units of measure, and godowns
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={fetchData} 
            className="px-4 py-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 text-slate-600 text-sm font-semibold shadow-sm transition-all flex items-center gap-2"
          >
            <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} /> Sync
          </button>
          <button 
            onClick={handleOpenCreate}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold text-sm shadow-sm hover:bg-blue-700 transition-all flex items-center gap-2"
          >
            <Plus size={16}/> New {activeTab === 'groups' ? 'Stock Group' : activeTab === 'categories' ? 'Stock Category' : activeTab === 'units' ? 'Unit' : 'Godown'}
          </button>
        </div>
      </div>

      {/* ZOHO-STYLE TAB BAR */}
      <div className="flex border-b border-slate-200 mb-6 bg-white rounded-lg p-1.5 shadow-sm">
        <button
          onClick={() => { setActiveTab('groups'); setSearchQuery(''); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-bold transition-all ${activeTab === 'groups' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
        >
          <Folder size={16} />
          Stock Groups
        </button>
        <button
          onClick={() => { setActiveTab('categories'); setSearchQuery(''); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-bold transition-all ${activeTab === 'categories' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
        >
          <Layers size={16} />
          Stock Categories
        </button>
        <button
          onClick={() => { setActiveTab('units'); setSearchQuery(''); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-bold transition-all ${activeTab === 'units' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
        >
          <Scale size={16} />
          Units of Measure
        </button>
        <button
          onClick={() => { setActiveTab('godowns'); setSearchQuery(''); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-bold transition-all ${activeTab === 'godowns' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
        >
          <Warehouse size={16} />
          Godowns / Warehouses
        </button>
      </div>

      {/* DATA GRID */}
      <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
        {/* TOOLBAR */}
        <div className="h-14 px-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4 w-96">
            <div className="relative w-full">
              <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${searchQuery ? 'text-blue-500' : 'text-slate-400'}`} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${activeTab}...`} 
                className="w-full pl-9 pr-3 border border-slate-200 bg-white rounded-lg h-9 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>

        {/* TABLE BODY */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-slate-400">
              <RefreshCcw size={24} className="animate-spin text-blue-500"/>
              <span className="text-sm font-medium uppercase tracking-widest">Loading records...</span>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-slate-400">
              <Info size={32} className="text-slate-300"/>
              <span className="text-sm font-medium">No records found</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                  {activeTab === 'groups' && (
                    <>
                      <th className="py-3 px-6">Group Name</th>
                      <th className="py-3 px-6">Parent Group</th>
                      <th className="py-3 px-6 text-right">Actions</th>
                    </>
                  )}
                  {activeTab === 'categories' && (
                    <>
                      <th className="py-3 px-6">Category Name</th>
                      <th className="py-3 px-6">Description</th>
                      <th className="py-3 px-6 text-right">Actions</th>
                    </>
                  )}
                  {activeTab === 'units' && (
                    <>
                      <th className="py-3 px-6">Symbol</th>
                      <th className="py-3 px-6">Formal Name</th>
                      <th className="py-3 px-6">Decimal Places</th>
                      <th className="py-3 px-6 text-right">Actions</th>
                    </>
                  )}
                  {activeTab === 'godowns' && (
                    <>
                      <th className="py-3 px-6">Godown Name</th>
                      <th className="py-3 px-6">Address</th>
                      <th className="py-3 px-6 text-right">Actions</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/50 text-sm text-slate-700 transition-colors">
                    {activeTab === 'groups' && (
                      <>
                        <td className="py-3 px-6 font-bold text-slate-800">{item.name}</td>
                        <td className="py-3 px-6 text-slate-500">
                          {item.parent_id ? (groups.find(g => g.id === item.parent_id)?.name || 'Sub-Group') : '— Primary —'}
                        </td>
                      </>
                    )}
                    {activeTab === 'categories' && (
                      <>
                        <td className="py-3 px-6 font-bold text-slate-800">{item.name}</td>
                        <td className="py-3 px-6 text-slate-500">{item.description || '— No Description —'}</td>
                      </>
                    )}
                    {activeTab === 'units' && (
                      <>
                        <td className="py-3 px-6 font-bold text-slate-800 uppercase">{item.symbol}</td>
                        <td className="py-3 px-6 font-semibold text-slate-600">{item.formalName}</td>
                        <td className="py-3 px-6 font-medium text-slate-500">{item.decimalPlaces}</td>
                      </>
                    )}
                    {activeTab === 'godowns' && (
                      <>
                        <td className="py-3 px-6 font-bold text-slate-800">{item.name}</td>
                        <td className="py-3 px-6 text-slate-500">{item.address || '— No Address Provided —'}</td>
                      </>
                    )}
                    <td className="py-3 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all"
                          title="Edit"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => confirmDelete(item.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* CREATION / EDITING DRAWER */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowDrawer(false)}></div>
          <div className="relative w-full max-w-[480px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-fade-in">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingId ? 'Edit' : 'Create'} {activeTab === 'groups' ? 'Stock Group' : activeTab === 'categories' ? 'Stock Category' : activeTab === 'units' ? 'Unit' : 'Godown'}
                </h2>
                <p className="text-xs text-slate-500 mt-1">Configure details for active company inventory master</p>
              </div>
              <button onClick={() => setShowDrawer(false)} className="p-2 rounded-lg hover:bg-slate-200 text-slate-500">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              
              {activeTab === 'groups' && (
                <>
                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-widest text-[#64748b] mb-2 px-1">Group Name</label>
                    <input 
                      type="text" 
                      required
                      value={groupForm.name}
                      onChange={e => setGroupForm({ ...groupForm, name: e.target.value })}
                      placeholder="e.g. Raw Materials, Finished Goods..."
                      className="w-full h-12 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl px-4 text-sm font-bold text-[#1e293b] focus:border-[#2563eb] focus:bg-white outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-widest text-[#64748b] mb-2 px-1">Parent Group (Under)</label>
                    <select
                      value={groupForm.parent_id}
                      onChange={e => setGroupForm({ ...groupForm, parent_id: e.target.value })}
                      className="w-full h-12 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl px-4 text-sm font-bold text-[#1e293b] focus:border-[#2563eb] focus:bg-white outline-none transition-all"
                    >
                      <option value="">Primary Group</option>
                      {groups
                        .filter(g => g.id !== editingId)
                        .map(g => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))
                      }
                    </select>
                  </div>
                </>
              )}

              {activeTab === 'categories' && (
                <>
                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-widest text-[#64748b] mb-2 px-1">Category Name</label>
                    <input 
                      type="text" 
                      required
                      value={categoryForm.name}
                      onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      placeholder="e.g. Electronics, Brand A..."
                      className="w-full h-12 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl px-4 text-sm font-bold text-[#1e293b] focus:border-[#2563eb] focus:bg-white outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-widest text-[#64748b] mb-2 px-1">Description</label>
                    <textarea 
                      value={categoryForm.description}
                      onChange={e => setCategoryForm({ ...categoryForm, description: e.target.value })}
                      placeholder="Add brief details..."
                      className="w-full bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl px-4 py-3 text-sm font-bold text-[#1e293b] focus:border-[#2563eb] focus:bg-white outline-none transition-all min-h-[80px]"
                    />
                  </div>
                </>
              )}

              {activeTab === 'units' && (
                <>
                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-widest text-[#64748b] mb-2 px-1">Symbol (e.g. pcs, kg)</label>
                    <input 
                      type="text" 
                      required
                      value={unitForm.symbol}
                      onChange={e => setUnitForm({ ...unitForm, symbol: e.target.value })}
                      placeholder="e.g. pcs"
                      className="w-full h-12 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl px-4 text-sm font-bold text-[#1e293b] focus:border-[#2563eb] focus:bg-white outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-widest text-[#64748b] mb-2 px-1">Formal Name</label>
                    <input 
                      type="text" 
                      required
                      value={unitForm.formalName}
                      onChange={e => setUnitForm({ ...unitForm, formalName: e.target.value })}
                      placeholder="e.g. Pieces"
                      className="w-full h-12 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl px-4 text-sm font-bold text-[#1e293b] focus:border-[#2563eb] focus:bg-white outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-widest text-[#64748b] mb-2 px-1">Decimal Places</label>
                    <input 
                      type="number" 
                      min="0" 
                      max="4"
                      value={unitForm.decimalPlaces}
                      onChange={e => setUnitForm({ ...unitForm, decimalPlaces: parseInt(e.target.value) || 0 })}
                      className="w-full h-12 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl px-4 text-sm font-bold text-[#1e293b] focus:border-[#2563eb] focus:bg-white outline-none transition-all"
                    />
                  </div>
                </>
              )}

              {activeTab === 'godowns' && (
                <>
                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-widest text-[#64748b] mb-2 px-1">Godown / Warehouse Name</label>
                    <input 
                      type="text" 
                      required
                      value={godownForm.name}
                      onChange={e => setGodownForm({ ...godownForm, name: e.target.value })}
                      placeholder="e.g. Central Warehouse, Delhi Shop..."
                      className="w-full h-12 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl px-4 text-sm font-bold text-[#1e293b] focus:border-[#2563eb] focus:bg-white outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-widest text-[#64748b] mb-2 px-1">Address</label>
                    <textarea 
                      value={godownForm.address}
                      onChange={e => setGodownForm({ ...godownForm, address: e.target.value })}
                      placeholder="e.g. 123 Storage Road, Sector 5..."
                      className="w-full bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl px-4 py-3 text-sm font-bold text-[#1e293b] focus:border-[#2563eb] focus:bg-white outline-none transition-all min-h-[80px]"
                    />
                  </div>
                </>
              )}

              <div className="border-t border-slate-100 pt-6 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowDrawer(false)}
                  className="px-5 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold shadow-sm hover:bg-blue-700 transition-colors"
                >
                  {editingId ? 'Update' : 'Save'} Master
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOM CENTRED CONFIRMATION MODAL */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
            onClick={() => setDeleteConfirmOpen(false)}
          ></div>
          <div className="relative w-full max-w-[400px] bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 text-center animate-fade-in space-y-4 animate-scale-up">
            <div className="mx-auto w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
              <Trash2 size={24} />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-950">Delete Master Record</h3>
              <p className="text-sm text-slate-500">
                Are you sure you want to permanently delete this master record? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 justify-center pt-2">
              <button 
                type="button" 
                onClick={() => setDeleteConfirmOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleExecuteDelete}
                className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-semibold shadow-md hover:bg-rose-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default InventoryMastersView;
