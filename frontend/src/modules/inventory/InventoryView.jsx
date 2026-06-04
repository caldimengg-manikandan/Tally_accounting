import React, { useState, useEffect } from 'react';
import { Edit2, ChevronRight, ChevronDown, Plus, MoreVertical, Search, Package, RefreshCcw, Check, Trash2, AlertTriangle } from 'lucide-react';
import { inventoryAPI } from '../../services/api';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import ConfirmModal from '../../components/ConfirmModal';
import useNotificationStore from '../../store/notificationStore';
import ItemDetailView from './ItemDetailView';
import ItemEntryView from './ItemEntryView';

const InventoryView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'split'
  const [showNewModal, setShowNewModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteName, setDeleteName] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const { addNotification } = useNotificationStore();
  
  const companyId = localStorage.getItem('companyId');

  useEffect(() => { 
    fetchData(); 
  }, [companyId]);

  useEffect(() => { 
    fetchData(); 
  }, [companyId]);

  const itemIdParam = searchParams.get('id');

  useEffect(() => {
    if (location.state?.openItem) {
      setSearchParams({ id: location.state.openItem.id }, { replace: true });
      navigate(location.pathname, { replace: true, state: {} });
      return;
    }
    
    if (itemIdParam && items.length > 0) {
      const item = items.find(i => i.id === itemIdParam);
      if (item) {
        setSelectedItem(item);
        setViewMode('split');
      } else {
        setSelectedItem(null);
        setViewMode('table');
      }
    } else if (!itemIdParam) {
      setSelectedItem(null);
      setViewMode('table');
    }
  }, [itemIdParam, items, location.state, navigate, location.pathname, setSearchParams]);

  const fetchData = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const res = await inventoryAPI.getByCompany(companyId);
      setItems(res.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const handleItemClick = (item) => {
    setSearchParams({ id: item.id });
  };

  const handleEdit = (item) => {
    navigate('/inventory/new', { state: { editItem: item } });
  };

  const handleDeleteItem = (item) => {
    setDeleteId(item.id);
    setDeleteName(item.name);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await inventoryAPI.deleteItem(deleteId);
      addNotification('Item deleted successfully', 'success');
      fetchData();
      if (selectedItem?.id === deleteId) {
        setSelectedItem(null);
        setViewMode('table');
      }
    } catch (err) {
      addNotification(err.response?.data?.error || 'Failed to delete item', 'error');
    } finally {
      setIsDeleteModalOpen(false);
      setDeleteId(null);
      setDeleteName('');
    }
  };

  return (
    <div className="relative bg-[#F9FAFB] font-sans min-h-screen">
      
      {/* ConfirmModal replaces the inline modal */}
      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Item"
        message={`Are you sure you want to delete "${deleteName}"? This action cannot be undone.`}
      />
      
      {/* ── VIEW MODE: TABLE (IMAGE 2) ───────────────────────────── */}
      {viewMode === 'table' && (
        <div className="flex-1 flex flex-col h-full bg-white animate-fade-in overflow-hidden">
          {/* HEADER: Synchronized with Customers/Quotes */}
          <div className="flex items-center justify-between px-8 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2 group cursor-pointer">
                  <h1 className="text-[20px] font-bold text-slate-900">All Items</h1>
                  <ChevronDown size={18} className="text-blue-600 mt-1" />
              </div>
              <div className="flex items-center gap-2">
                 <button 
                   onClick={() => navigate('/inventory/new')}
                   className="bg-[#1e61f0] hover:bg-[#1a54d1] text-white px-4 py-2 rounded-md font-medium flex items-center gap-1.5 transition-all shadow-sm"
                 >
                    <Plus size={18} strokeWidth={2.5}/> New Item
                 </button>
                 <div className="relative">
                    <button className="p-2 text-slate-500 hover:text-slate-800 border border-slate-200 bg-white rounded-md hover:bg-slate-50 transition-colors shadow-sm">
                       <MoreVertical size={18} />
                    </button>
                 </div>
              </div>
          </div>

          {/* SEARCH/FILTER BAR */}
          <div className="px-8 py-4 bg-slate-50/50 flex items-center justify-between border-b border-slate-100">
            <div className="flex items-center gap-4">
                <div className="relative group w-64">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1e61f0] transition-colors" />
                    <input 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search records..."
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded text-[13px] font-bold text-slate-700 outline-none focus:border-[#1e61f0] shadow-sm transition-all"
                    />
                </div>
                <button 
                    onClick={fetchData}
                    className="p-2 text-slate-400 hover:text-[#1e61f0] transition-colors"
                    title="Refresh"
                >
                    <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            <div className="flex items-center gap-3">
                <button className="flex items-center gap-1.5 text-slate-500 text-[13px] font-medium hover:text-slate-900 transition-colors">
                    <AlertTriangle size={14} /> Filter
                </button>
                <div className="w-px h-4 bg-slate-200 mx-2" />
                <button className="h-9 px-4 flex items-center gap-2 bg-white border border-slate-200 text-slate-600 rounded-[4px] text-[11px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
                    <RefreshCcw size={14} /> Sync
                </button>
            </div>
          </div>

          {/* Data Table */}
          <div className="flex-1 overflow-y-auto no-scrollbar p-8">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 sticky top-0 z-10">
                <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Purchase Rate</th>
                    <th className="px-6 py-4">Sales Rate</th>
                    <th className="px-6 py-4">Usage Unit</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                    <tr><td colSpan="5" className="py-24 text-center font-bold text-slate-400 animate-pulse uppercase tracking-widest">Syncing...</td></tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                      <td colSpan="5" className="py-20 text-center">
                         <div className="flex flex-col items-center justify-center gap-3">
                            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                               <Package size={24} />
                            </div>
                            <p className="text-slate-500 text-[14px]">No items found.</p>
                            <button onClick={() => navigate('/inventory/new')} className="text-blue-600 text-[13px] font-medium hover:underline">Create an item</button>
                         </div>
                      </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors cursor-pointer group" onClick={() => handleItemClick(item)}>
                      <td className="px-6 py-4">
                        <div className="text-[14px] font-medium text-blue-600 group-hover:underline">{item.name}</div>
                        {item.type && <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">{item.type}</div>}
                      </td>
                      <td className="px-6 py-4 text-[14px] text-slate-700 font-medium">
                        {item.costPrice ? formatCurrency(item.costPrice) : '—'}
                      </td>
                      <td className="px-6 py-4 text-[14px] text-slate-700 font-medium">
                        {item.sellingPrice ? formatCurrency(item.sellingPrice) : '—'}
                      </td>
                      <td className="px-6 py-4 text-[13px] text-slate-500 font-medium">
                        {(!item.unit || item.unit === 'Select or type to add') ? '—' : item.unit}
                      </td>
                      <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 rounded shadow-sm transition-all text-[12px] font-medium"
                          >
                            <Edit2 size={13} /> Edit
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item)}
                            className="flex items-center justify-center p-1.5 bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 rounded shadow-sm transition-all"
                            title="Delete Item"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── VIEW MODE: SPLIT (IMAGE 1) ────────────────────────────── */}
      {viewMode === 'split' && (
        <div className="flex h-screen overflow-hidden animate-fade-in">
          
          {/* Left Panel: High-Fidelity Sidebar */}
          <div className="w-[380px] border-r border-slate-100 flex flex-col bg-white shrink-0 shadow-sm z-20">
            <div className="px-6 py-5 flex items-center justify-between border-b border-slate-50 bg-[#fbfcff]">
              <div className="flex items-center gap-2 cursor-pointer group hover:opacity-80 transition-all" onClick={() => setSearchParams({})}>
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#1e61f0]">
                   <Package size={16} />
                </div>
                <h2 className="text-[13px] font-bold text-slate-800 uppercase tracking-widest">Active Items</h2>
                <ChevronDown size={14} className="text-[#1e61f0] mt-0.5" />
              </div>
              <div className="flex items-center gap-2">
                <button 
                   onClick={() => navigate('/inventory/new')} 
                   className="p-2 bg-[#1e61f0] text-white rounded-xl hover:bg-[#1a54d1] shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                >
                   <Plus size={18} strokeWidth={2.5} />
                </button>

              </div>
            </div>

            <div className="p-5 border-b border-slate-50 bg-white">
              <div className="relative group">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#1e61f0] transition-colors" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Seach across items..."
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50/50 border border-slate-100 focus:border-blue-200 focus:bg-white outline-none rounded-xl text-[13px] font-medium text-slate-700 transition-all shadow-inner placeholder:text-slate-400" 
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {filteredItems.map(item => (
                <div 
                  key={item.id}
                  onClick={() => setSearchParams({ id: item.id })}
                  className={`flex items-center justify-between px-6 py-4 cursor-pointer border-b border-slate-50 transition-all ${
                    selectedItem?.id === item.id 
                      ? 'bg-blue-50/40' 
                      : 'hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <input 
                       type="checkbox" 
                       className="w-3.5 h-3.5 rounded border-slate-300 accent-[#1e61f0] shrink-0" 
                       onClick={(e) => e.stopPropagation()} 
                    />
                    <div className="flex flex-col min-w-0">
                       <span className={`text-[13px] font-medium truncate ${selectedItem?.id === item.id ? 'text-[#1e61f0]' : 'text-slate-700'}`}>
                          {item.name}
                       </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 shrink-0">
                     <span className="text-[12px] font-bold text-slate-900">
                        {formatCurrency(item.sellingPrice || 0)}
                     </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel: Detail Panel */}
          <div className="flex-1 bg-white relative">
            <ItemDetailView 
              item={selectedItem} 
              onClose={() => setSearchParams({})}
              onEdit={(item) => handleEdit(item)}
            />
          </div>

        </div>
      )}

    </div>
  );
};

export default InventoryView;
