import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  RefreshCcw, Printer, Mail, Download, AlertCircle, Package, Layers, AlertTriangle, ShieldCheck
} from 'lucide-react';
import { reportsAPI, inventoryAPI } from '../../services/api';

const InventoryReportView = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All'); // 'All', 'In Stock', 'Low Stock', 'Out of Stock'
  const [categories, setCategories] = useState([]);
  const [godowns, setGodowns] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedGodown, setSelectedGodown] = useState('');
  const companyId = sessionStorage.getItem('companyId');

  const fetchReport = async (catId = selectedCategory, gdId = selectedGodown) => {
    if (!companyId) return;
    setLoading(true);
    try {
      const params = {};
      if (catId) params.stockCategoryId = catId;
      if (gdId) params.godownId = gdId;
      const res = await reportsAPI.inventoryReport(companyId, params);
      setItems(res.data.items || []);
      setSummary(res.data.summary || null);
    } catch (err) {
      console.error('Failed to fetch inventory report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
    if (companyId) {
      inventoryAPI.getStockCategories(companyId)
        .then(res => setCategories(res.data || []))
        .catch(e => console.error('Failed to fetch stock categories:', e));
      inventoryAPI.getGodowns(companyId)
        .then(res => setGodowns(res.data || []))
        .catch(e => console.error('Failed to fetch godowns:', e));
    }
  }, [companyId]);

  const handleCategoryChange = (e) => {
    const val = e.target.value;
    setSelectedCategory(val);
    fetchReport(val, selectedGodown);
  };

  const handleGodownChange = (e) => {
    const val = e.target.value;
    setSelectedGodown(val);
    fetchReport(selectedCategory, val);
  };

  const fmt = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const filteredItems = React.useMemo(() => {
    if (filterStatus === 'All') return items;
    return items.filter(item => item.stockStatus === filterStatus);
  }, [items, filterStatus]);

  if (!companyId) {
    return (
      <div className="py-20 flex flex-col items-center gap-4 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200 m-8">
        <AlertCircle size={40} className="text-[#1e61f0]" />
        <div className="text-center">
          <h3 className="text-[16px] font-bold text-slate-900 tracking-tight">No Company Active</h3>
          <p className="text-[12px] font-bold mt-1">Please select a company from the Settings hub to view reports.</p>
        </div>
        <button onClick={() => navigate('/settings/company')} className="mt-4 px-6 py-2.5 bg-slate-900 text-white rounded-lg text-[11px] font-bold uppercase tracking-widest shadow-xl">
          Go to Settings
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] animate-fade-in font-sans overflow-hidden">
      
      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-40 no-print shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <h1 className="text-[18px] font-bold text-slate-900 tracking-tight leading-none">Inventory Valuation Summary</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">Stock Level & Value Auditor</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
           <button onClick={fetchReport} className="p-2 text-slate-400 hover:text-[#1e61f0] transition-colors">
             <RefreshCcw size={18} className={loading ? 'animate-spin' : ''}/>
           </button>
           <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-[12px] font-bold text-slate-600 hover:bg-slate-50 transition-all">
             <Printer size={16}/> Print
           </button>
           <button className="flex items-center gap-2 px-6 py-2 bg-[#1e61f0] text-white rounded-lg text-[12px] font-bold hover:bg-[#1a54d1] transition-all shadow-lg shadow-blue-500/20">
             <Download size={16}/> Export PDF
           </button>
        </div>
      </header>

      {/* ── TOOLBAR ────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-100 px-8 py-3 flex items-center justify-between no-print shrink-0">
         <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
               <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Filter status:</span>
               <select 
                 value={filterStatus}
                 onChange={(e) => setFilterStatus(e.target.value)}
                 className="bg-transparent text-[11px] font-bold text-slate-700 uppercase outline-none cursor-pointer hover:text-[#1e61f0]"
               >
                  <option value="All">All Items</option>
                  <option value="In Stock">In Stock</option>
                  <option value="Low Stock">Low Stock</option>
                  <option value="Out of Stock">Out of Stock</option>
               </select>
            </div>
            
            <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
               <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Category:</span>
               <select 
                 value={selectedCategory}
                 onChange={handleCategoryChange}
                 className="bg-transparent text-[11px] font-bold text-slate-700 uppercase outline-none cursor-pointer hover:text-[#1e61f0]"
               >
                  <option value="">All Categories</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
               </select>
            </div>

            <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
               <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Godown:</span>
               <select 
                 value={selectedGodown}
                 onChange={handleGodownChange}
                 className="bg-transparent text-[11px] font-bold text-slate-700 uppercase outline-none cursor-pointer hover:text-[#1e61f0]"
               >
                  <option value="">All Godowns</option>
                  {godowns.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
               </select>
            </div>
         </div>
         <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Total Inventory Value: </span>
            <span className="text-[12px] font-black text-[#1e61f0]">{fmt(summary?.totalValue)}</span>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-[1400px] mx-auto space-y-8">
          
          {/* ══ VALUATION SUMMARY CARDS ════════════════════════════════ */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
               <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Items</p>
                    <h3 className="text-[16px] font-extrabold mt-1.5 text-slate-900">{summary.totalItems}</h3>
                  </div>
                  <Package size={20} className="text-slate-400 shrink-0" />
               </div>
               <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stock Valuation</p>
                    <h3 className="text-[16px] font-extrabold mt-1.5 text-[#1e61f0]">{fmt(summary.totalValue)}</h3>
                  </div>
                  <Layers size={20} className="text-[#1e61f0] shrink-0" />
               </div>
               <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">In Stock</p>
                    <h3 className="text-[16px] font-extrabold mt-1.5 text-emerald-600">{summary.inStockCount}</h3>
                  </div>
                  <ShieldCheck size={20} className="text-emerald-500 shrink-0" />
               </div>
               <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Low Stock</p>
                    <h3 className="text-[16px] font-extrabold mt-1.5 text-amber-600">{summary.lowStockCount}</h3>
                  </div>
                  <AlertTriangle size={20} className="text-amber-500 shrink-0" />
               </div>
               <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Out of Stock</p>
                    <h3 className="text-[16px] font-extrabold mt-1.5 text-rose-600">{summary.outOfStockCount}</h3>
                  </div>
                  <AlertCircle size={20} className="text-rose-500 shrink-0" />
               </div>
            </div>
          )}

          {/* ══ DETAIL TABLE ═══════════════════════════════════════════ */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
             <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-4">Product</th>
                    <th className="px-4 py-4 text-right font-medium">Purchased</th>
                    <th className="px-4 py-4 text-right font-medium">Sold</th>
                    <th className="px-4 py-4 text-right font-medium">Available</th>
                  </tr>
                </thead>
                <tbody className="text-[12px] text-slate-600">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12">
                        <div className="w-8 h-8 border-4 border-slate-100 border-t-[#1e61f0] rounded-full animate-spin mx-auto" />
                      </td>
                    </tr>
                  ) : filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-12 text-slate-400">No inventory items found matching this filter</td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => (
                      <tr 
                        key={item.id} 
                        className="hover:bg-slate-50/80 transition-all border-b border-slate-50 last:border-0 cursor-pointer"
                        onClick={() => navigate('/inventory')}
                      >
                        <td className="px-8 py-4 font-bold text-slate-900">
                          <div className="flex flex-col">
                            <span>{item.name}</span>
                            <span className="text-[10px] text-slate-400 font-normal">SKU: {item.sku}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right font-medium">{item.purchases} {item.unit}</td>
                        <td className="px-4 py-4 text-right font-medium">{item.sales} {item.unit}</td>
                        <td className="px-4 py-4 text-right font-bold text-slate-700">{item.currentStock} {item.unit}</td>
                      </tr>
                    ))
                  )}
                </tbody>
             </table>
          </div>

        </div>
      </div>
    </div>
  );
};

export default InventoryReportView;
