import React, { useState, useEffect } from 'react';
import { Edit2, ChevronRight, ChevronDown, Plus, MoreVertical, Search, Package, RefreshCcw, Check, Trash2, AlertTriangle } from 'lucide-react';
import { inventoryAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from '../../components/ConfirmModal';
import useNotificationStore from '../../store/notificationStore';
import ItemDetailView from './ItemDetailView';
import ItemEntryView from './ItemEntryView';

const InventoryView = () => {
  const navigate = useNavigate();
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
    setSelectedItem(item);
    setViewMode('split');
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
        <div className="flex flex-col h-screen animate-fade-in">
          {/* Main Header Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
            <div className="flex items-center gap-2 cursor-pointer group">
              <h1 className="text-[18px] font-bold text-slate-800">Active Items</h1>
              <ChevronDown size={14} className="text-[#1e61f0] mt-0.5" />
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/inventory/new')}
                className="bg-[#1e61f0] text-white px-4 py-2 rounded-md font-bold text-[12px] flex items-center gap-1.5 hover:bg-[#1a54d1] shadow-sm transition-all"
              >
                <Plus size={16} strokeWidth={3}/> New
              </button>
              <button className="p-1.5 border border-slate-200 rounded-md text-slate-400 hover:bg-slate-50 transition-all">
                <MoreVertical size={16} />
              </button>
            </div>
          </div>

          {/* Data Table */}
          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1200px]">
              <thead className="bg-[#f8fafc] sticky top-0 z-10">
                <tr className="border-b border-slate-200 h-11">
                    <th className="pl-6 w-10">
                       <input type="checkbox" className="w-3.5 h-3.5 rounded border-slate-300 accent-[#1e61f0]" />
                    </th>
                    <th className="px-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-tight w-[200px]">Name</th>
                    <th className="px-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-tight w-[350px]">Purchase Description</th>
                    <th className="px-3 text-right text-[10px] font-bold text-slate-500 uppercase tracking-tight w-[160px]">Purchase Rate</th>
                    <th className="px-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-tight w-[200px]">Description</th>
                    <th className="px-3 text-right text-[10px] font-bold text-slate-500 uppercase tracking-tight w-[130px]">Sales Rate</th>
                    <th className="px-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-tight w-[100px]">Usage Unit</th>
                    <th className="px-3 pr-6 text-center w-24 tracking-[0.2em] font-black uppercase text-slate-400 text-[9px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan="8" className="py-20 text-center text-slate-300 uppercase tracking-[0.2em] font-black animate-pulse">Loading Records...</td></tr>
                ) : filteredItems.length === 0 ? (
                  <tr><td colSpan="8" className="py-20 text-center text-slate-400 italic">No inventory items found.</td></tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-[#f8fafc] transition-colors group h-11">
                      <td className="pl-6">
                         <input type="checkbox" className="w-3.5 h-3.5 rounded border-slate-300 accent-[#1e61f0]" />
                      </td>
                      <td 
                        onClick={() => handleItemClick(item)}
                        className="px-3 text-[13px] text-[#1e61f0] font-medium cursor-pointer hover:underline"
                      >
                        {item.name}
                      </td>
                      <td className="px-3 text-[13px] text-slate-500 truncate">{item.purchaseDescription || '—'}</td>
                      <td className="px-3 text-[13px] text-slate-700 font-bold text-right">
                        {item.costPrice ? formatCurrency(item.costPrice) : '—'}
                      </td>
                      <td className="px-3 text-[13px] text-slate-500 truncate">{item.salesDescription || '—'}</td>
                      <td className="px-3 text-[13px] text-slate-700 font-bold text-right">
                        {item.sellingPrice ? formatCurrency(item.sellingPrice) : '—'}
                      </td>
                      <td className="px-3 text-[13px] text-slate-500">
                        {(!item.unit || item.unit === 'Select or type to add') ? '—' : item.unit}
                      </td>
                      <td className="px-3 pr-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEdit(item); }}
                            className="p-1.5 rounded-md text-slate-400 hover:text-[#1e61f0] hover:bg-blue-50 transition-all"
                            title="Edit Item"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteItem(item); }}
                            className="p-1.5 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
                            title="Delete Item"
                          >
                            <Trash2 size={14} />
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
              <div className="flex items-center gap-2 cursor-pointer group hover:opacity-80 transition-all" onClick={() => setViewMode('table')}>
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#1e61f0]">
                   <Package size={16} />
                </div>
                <h2 className="text-[13px] font-black text-slate-800 uppercase tracking-widest">Active Items</h2>
                <ChevronDown size={14} className="text-[#1e61f0] mt-0.5" />
              </div>
              <div className="flex items-center gap-2">
                <button 
                   onClick={() => navigate('/inventory/new')} 
                   className="p-2 bg-[#1e61f0] text-white rounded-xl hover:bg-[#1a54d1] shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                >
                   <Plus size={18} strokeWidth={2.5} />
                </button>
                <button className="p-2 border border-slate-200 text-slate-400 rounded-xl hover:bg-slate-50 transition-all hover:text-slate-600">
                   <MoreVertical size={18} />
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

            <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-2 space-y-1">
              {filteredItems.map(item => (
                <div 
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`flex items-center justify-between px-4 py-5 cursor-pointer rounded-2xl transition-all group ${
                    selectedItem?.id === item.id 
                      ? 'bg-blue-50/80 shadow-[0_2px_8px_-4px_rgba(30,97,240,0.3)]' 
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-xl transition-colors ${
                       selectedItem?.id === item.id ? 'bg-[#1e61f0] text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-600'
                    }`}>
                       {item.type === 'Service' ? <RefreshCcw size={14} /> : <Package size={14} />}
                    </div>
                    <div className="flex flex-col">
                       <span className={`text-[13px] font-bold tracking-tight ${selectedItem?.id === item.id ? 'text-[#1e61f0]' : 'text-slate-800'}`}>
                          {item.name}
                       </span>
                       <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">
                          {item.type || 'Goods'}
                       </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                     <span className={`text-[12px] font-black tracking-tight ${selectedItem?.id === item.id ? 'text-slate-900' : 'text-slate-700'}`}>
                        {formatCurrency(item.sellingPrice || 0)}
                     </span>
                     {selectedItem?.id === item.id && (
                        <div className="flex items-center gap-1.5 px-1.5 py-0.5 bg-blue-100 rounded-lg">
                           <Check size={10} className="text-[#1e61f0]" strokeWidth={3} />
                           <span className="text-[9px] font-black text-[#1e61f0] uppercase">Selected</span>
                        </div>
                     )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel: Detail Panel */}
          <div className="flex-1 bg-white relative">
            <ItemDetailView 
              item={selectedItem} 
              onClose={() => { setViewMode('table'); setSelectedItem(null); }}
              onEdit={(item) => handleEdit(item)}
            />
          </div>

        </div>
      )}

    </div>
  );
};

export default InventoryView;
