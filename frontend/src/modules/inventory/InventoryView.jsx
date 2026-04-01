import React, { useState, useEffect } from 'react';
import { 
  Package, Plus, Search, Filter, 
  RefreshCcw, Download, Activity, TrendingUp,
  AlertCircle, ChevronRight, Box, MoveRight
} from 'lucide-react';
import { inventoryAPI } from '../../services/api';

const InventoryView = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', skuCode: '', currentStock: 0, sellingPrice: 0, costPrice: 0 });
  const companyId = localStorage.getItem('companyId');

  useEffect(() => { fetchData(); }, [companyId]);

  const fetchData = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const res = await inventoryAPI.getByCompany(companyId);
      setItems(res.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await inventoryAPI.createItem({ 
        name: newItem.name, 
        openingStock: newItem.currentStock, 
        sellingPrice: newItem.sellingPrice,
        costPrice: newItem.costPrice,
        companyId 
      });
      setShowCreateModal(false);
      setNewItem({ name: '', skuCode: '', currentStock: 0, sellingPrice: 0, costPrice: 0 });
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-10 animate-fade-in">
      
      {/* ══ HEADER HUB ══════════════════════════════════════════ */}
      <div className="flex justify-between items-end border-b border-slate-100 pb-8">
        <div>
           <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-slate-100 text-slate-900 rounded-xl flex items-center justify-center border border-slate-200"><Box size={18}/></div>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Logistics Infrastructure</span>
           </div>
           <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Inventory Control</h1>
        </div>
        <div className="flex gap-3">
           <button onClick={fetchData} className="p-2.5 border border-slate-100 rounded-xl bg-white hover:bg-slate-50 text-slate-400 shadow-sm"><RefreshCcw size={16}/></button>
           <button 
             onClick={() => setShowCreateModal(true)}
             className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-900/10 flex items-center gap-2"
           >
             <Plus size={16}/> New SKU Master
           </button>
        </div>
      </div>

      {/* ══ METRIC ROW ══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <InventoryMetric label="Stock Valuation" value={`₹${items.reduce((s,i) => s + (parseFloat(i.currentStock || 0) * parseFloat(i.costPrice || 0)), 0).toLocaleString('en-IN')}`} color="blue" />
         <MetricBox label="Unique SKUs" value={items.length} color="slate" />
         <MetricBox label="Low Stock Alerts" value={items.filter(i => parseFloat(i.currentStock || 0) < 10).length} color="red" />
         <MetricBox label="Active Clusters" value="12" color="emerald" />
      </div>

      {/* ══ SKU DATA GRID ════════════════════════════════════════ */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden">
          <div className="h-14 px-10 bg-slate-50/20 border-b border-slate-50 flex items-center justify-between">
             <div className="flex gap-4">
                <div className="relative w-80 group">
                   <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                   <input 
                     type="text" 
                     placeholder="Query SKU Identity..." 
                     className="w-full pl-10 pr-4 py-2 bg-white border border-slate-100 rounded-xl font-bold text-xs uppercase tracking-widest outline-none focus:border-blue-500/30 transition-all shadow-sm"
                   />
                </div>
             </div>
             <div className="flex gap-4">
                <button className="text-slate-300 hover:text-blue-600 transition-all"><RefreshCcw size={14}/></button>
                <Download size={14} className="text-slate-300" />
             </div>
          </div>
          
          <table className="w-full text-left">
            <thead className="bg-[#fcfdfe] text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 border-b border-slate-50">
              <tr>
                <th className="px-10 py-5">SKU Designation</th>
                <th className="px-10 py-5">Accounting Group</th>
                <th className="px-10 py-5 text-right">Available Qty</th>
                <th className="px-10 py-5 text-right">Stock Valuation (₹)</th>
                <th className="px-10 py-5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-[13px] font-bold text-slate-600">
              {items.length === 0 ? (
                <tr>
                   <td colSpan="5" className="py-24 text-center opacity-30 flex flex-col items-center gap-3">
                      <Box size={40}/>
                      <p className="text-xs font-black uppercase tracking-widest">No Inventory Clusters Detected</p>
                   </td>
                </tr>
              ) : (
                items.map((i) => (
                  <tr key={i.id} className="hover:bg-slate-50/50 transition-all group cursor-pointer">
                    <td className="px-10 py-5">
                       <div className="font-black text-slate-900 tracking-tight leading-tight">{i.name}</div>
                       <div className="text-[10px] font-black uppercase text-slate-400 mt-0.5 tracking-tighter">ID: {i.id}</div>
                    </td>
                    <td className="px-10 py-5 text-[11px] font-black uppercase text-slate-400 tracking-wider flex flex-col">
                      <span>Sell: ₹{i.sellingPrice}</span>
                      <span>Cost: ₹{i.costPrice}</span>
                    </td>
                    <td className="px-10 py-5 text-right">
                       <span className={`font-black ${parseFloat(i.currentStock) < 10 ? 'text-orange-500' : 'text-slate-900'}`}>{i.currentStock} Units</span>
                    </td>
                    <td className="px-10 py-5 text-right font-black text-slate-900">
                       ₹{(parseFloat(i.currentStock || 0) * parseFloat(i.costPrice || 0)).toLocaleString('en-IN')}
                    </td>
                    <td className="px-10 py-5 text-center">
                       <span className={`px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest uppercase border
                          ${parseFloat(i.currentStock) > 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                          {parseFloat(i.currentStock) > 0 ? 'In Stock' : 'Depleted'}
                       </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
      </div>

      {/* ══ MODAL ══════════════════════════════════════════════ */}
      {showCreateModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-6">
            <div className="bg-white w-full max-w-xl rounded-3xl p-8 shadow-2xl animate-fade-in">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest">CREATE INVENTORY ITEM</h3>
                  <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-900 transition-colors"><Plus size={24} className="rotate-45"/></button>
               </div>
               <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                     <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Item Name</label>
                     <input required autoFocus value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-slate-400" placeholder="E.g., Laptop, Keyboard, Mouse..." />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                     <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Stock Qty</label>
                        <input type="number" required value={newItem.currentStock} onChange={e => setNewItem({...newItem, currentStock: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none" />
                     </div>
                     <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Cost Price (₹)</label>
                        <input type="number" required value={newItem.costPrice} onChange={e => setNewItem({...newItem, costPrice: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none" />
                     </div>
                     <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Selling Price (₹)</label>
                        <input type="number" required value={newItem.sellingPrice} onChange={e => setNewItem({...newItem, sellingPrice: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none" />
                     </div>
                  </div>
                  <div className="pt-4 flex justify-end">
                     <button type="submit" className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-900/10">SAVE INVENTORY</button>
                  </div>
               </form>
            </div>
         </div>
      )}
    </div>
  );
};

const InventoryMetric = ({ label, value, color }) => (
  <div className="col-span-2 bg-[#0f172a] p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
     <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700"></div>
     <div className="relative z-10 flex justify-between items-center">
        <div>
           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Portfolio Value</p>
           <h3 className="text-3xl font-black tracking-tighter">{value}</h3>
        </div>
        <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-xl"><Package size={22}/></div>
     </div>
  </div>
);

const MetricBox = ({ label, value, color }) => (
  <div className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/10 group hover:-translate-y-1 transition-all duration-300">
     <div className="flex items-center gap-3 mb-4">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shadow-sm
           ${color === 'red' ? 'bg-red-50 text-red-600 border-red-100' : 
             color === 'emerald' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-900 border-slate-100'}`}>
           <TrendingUp size={14}/>
        </div>
        <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em]">{label}</p>
     </div>
     <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{value}</h3>
  </div>
);

export default InventoryView;
