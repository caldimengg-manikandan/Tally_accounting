import React, { useState, useEffect } from 'react';
import { Edit2, ChevronRight, ChevronDown, Plus, MoreVertical, Search } from 'lucide-react';
import { inventoryAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
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

  return (
    <div className="relative bg-white font-sans min-h-screen">
      
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
                    <th className="px-3 text-right text-[10px] font-bold text-slate-500 uppercase tracking-tight w-[130px]">Rate</th>
                    <th className="px-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-tight w-[100px]">Usage Unit</th>
                    <th className="px-3 pr-6 text-center w-16">Edit</th>
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
                      <td className="px-3 text-[13px] text-slate-500">{item.unit || '—'}</td>
                      <td className="px-3 pr-6 text-center">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEdit(item); }}
                          className="p-1.5 rounded-md text-slate-400 hover:text-[#1e61f0] hover:bg-blue-50 transition-all"
                          title="Edit Item"
                        >
                          <Edit2 size={14} />
                        </button>
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
          
          {/* Left Panel: Compact List */}
          <div className="w-[350px] border-r border-slate-100 flex flex-col bg-white shrink-0 shadow-sm z-20">
            <div className="px-6 py-5 flex items-center justify-between border-b border-slate-100 bg-[#fbfcff]/50">
              <div className="flex items-center gap-1 cursor-pointer group" onClick={() => setViewMode('table')}>
                <h2 className="text-[14px] font-black text-slate-800 uppercase tracking-widest">Active Items</h2>
                <ChevronDown size={14} className="text-[#1e61f0]" />
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => navigate('/inventory/new')} className="p-1.5 bg-[#1e61f0] text-white rounded-md hover:scale-105 transition-transform"><Plus size={16} strokeWidth={3} /></button>
                <button className="p-1.5 border border-slate-200 text-slate-400 rounded-md hover:bg-slate-50 transition-all"><MoreVertical size={16} /></button>
              </div>
            </div>

            <div className="p-4 border-b border-slate-50">
              <div className="relative group">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#1e61f0] transition-colors" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter items..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-transparent focus:border-slate-200 outline-none rounded-lg text-[13px] transition-all" 
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {filteredItems.map(item => (
                <div 
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`flex items-center justify-between px-6 py-4 cursor-pointer border-b border-slate-50 transition-all group ${
                    selectedItem?.id === item.id ? 'bg-[#1e61f0]/5 border-l-[3px] border-l-[#1e61f0]' : 'hover:bg-slate-50 border-l-[3px] border-l-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input type="checkbox" className="w-4 h-4 rounded border-slate-300 accent-[#1e61f0]" onClick={(e) => e.stopPropagation()} />
                    <span className={`text-[13px] font-bold ${selectedItem?.id === item.id ? 'text-[#1e61f0]' : 'text-slate-700'}`}>{item.name}</span>
                  </div>
                  <span className="text-[12px] font-black text-slate-800 tracking-tight">{formatCurrency(item.sellingPrice || 0)}</span>
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
