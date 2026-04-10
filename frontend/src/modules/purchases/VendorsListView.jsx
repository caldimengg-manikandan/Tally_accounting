import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, MoreHorizontal, ChevronDown, User, RefreshCw, 
  ArrowDownUp, Download, Upload as UploadIcon, Settings, RotateCcw,
  ChevronRight, ArrowUp, ArrowDown, Edit, Trash2, ShoppingBag
} from 'lucide-react';
import { purchaseAPI, ledgerAPI } from '../../services/api';

const VendorsListView = ({ companyId }) => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [activeSubMenu, setActiveSubMenu] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
    setIsOptionsOpen(false);
  };

  const sortedVendors = [...vendors].sort((a, b) => {
    let aValue = a[sortConfig.key] || '';
    let bValue = b[sortConfig.key] || '';
    if (sortConfig.key === 'currentBalance') {
       aValue = parseFloat(aValue || 0);
       bValue = parseFloat(bValue || 0);
    } else {
       aValue = String(aValue).toLowerCase();
       bValue = String(bValue).toLowerCase();
    }
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const SortOption = ({ label, sortKey }) => {
     const isActive = sortConfig.key === sortKey;
     return (
        <div 
           onClick={(e) => { e.stopPropagation(); handleSort(sortKey); }}
           className={`px-4 py-2 cursor-pointer flex justify-between items-center rounded-sm mx-1 mt-1 ${isActive ? 'bg-[#1e61f0] text-white' : 'hover:bg-[#f4f5f7] text-slate-700'}`}
        >
           {label} 
           {isActive && (sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
        </div>
     );
  };

  useEffect(() => {
    const handleClickOutside = () => {
      setIsOptionsOpen(false);
      setActiveSubMenu(null);
    };
    if (isOptionsOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOptionsOpen]);

  useEffect(() => {
    if (!companyId) return;
    
    const fetchVendors = async () => {
      try {
        setLoading(true);
        const res = await purchaseAPI.getVendors(companyId);
        setVendors(res.data || []);
      } catch (err) {
        console.error("Failed to fetch vendors:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchVendors();
  }, [companyId]);

  const handleDelete = async (id, name, e) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete vendor ${name}?`)) return;
    try {
      await ledgerAPI.delete(id);
      setVendors(vendors.filter(v => v.id !== id));
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete vendor");
    }
  };

  if (loading) return (
    <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
      <RefreshCw size={24} className="animate-spin text-[#1e61f0] mb-4" />
      <p className="text-slate-500 text-[14px]">Loading Vendors...</p>
    </div>
  );

  return (
    <div className="bg-white min-h-screen">
       <div className="flex items-center justify-between px-8 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2 group cursor-pointer">
             <h1 className="text-[20px] font-bold text-slate-900">All Vendors</h1>
             <ChevronDown size={18} className="text-blue-600 mt-1" />
          </div>
          <div className="flex items-center gap-2">
             <button 
               onClick={() => navigate('/vendors/new')}
               className="bg-[#1e61f0] hover:bg-[#1a54d1] text-white px-4 py-2 rounded-md font-medium flex items-center gap-1.5 transition-all shadow-sm"
             >
                <Plus size={18} strokeWidth={2.5}/> New
             </button>
             
             <div className="relative">
                <button 
                   onClick={(e) => { e.stopPropagation(); setIsOptionsOpen(!isOptionsOpen); }}
                   className="p-2 text-slate-500 hover:text-slate-800 border border-slate-200 bg-white rounded-md hover:bg-slate-50 transition-colors shadow-sm"
                >
                   <MoreHorizontal size={18} />
                </button>
                
                {isOptionsOpen && (
                  <div 
                    onClick={(e) => e.stopPropagation()} 
                    className="absolute right-0 top-full mt-2 w-[220px] bg-white rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 z-50 py-1 text-[13px] font-medium text-[#2c3e50] animate-fade-down origin-top-right"
                  >
                     <div 
                        className={`relative px-4 py-2.5 cursor-pointer flex items-center justify-between transition-colors ${activeSubMenu === 'sort' ? 'bg-[#f4f5f7]' : 'hover:bg-[#f4f5f7]'}`}
                        onMouseEnter={() => setActiveSubMenu('sort')}
                        onMouseLeave={() => setActiveSubMenu(null)}
                     >
                        <div className="flex items-center gap-3">
                           <ArrowDownUp size={16} className="text-[#1e61f0]"/>
                           <span>Sort by</span>
                        </div>
                        <ChevronRight size={14} className="text-[#1e61f0]" />
                        
                        {activeSubMenu === 'sort' && (
                           <div className="absolute top-0 right-[calc(100%+4px)] w-[200px] bg-white rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 py-1 animate-fade-in text-[13px]">
                              <SortOption label="Name" sortKey="name" />
                              <SortOption label="Company Name" sortKey="companyName" />
                              <SortOption label="Payables" sortKey="currentBalance" />
                           </div>
                        )}
                     </div>

                     <div className="px-4 py-2.5 hover:bg-[#1e61f0] hover:text-white group cursor-pointer flex items-center gap-3 transition-colors border-t border-slate-100 mt-1 pt-3">
                        <RefreshCw size={16} className="text-[#1e61f0] group-hover:text-white"/>
                        <span>Refresh List</span>
                     </div>
                  </div>
                )}
             </div>
          </div>
       </div>

       <div className="p-8">
          <table className="w-full text-left">
             <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200">
                <tr>
                   <th className="px-6 py-4">Vendor Name</th>
                   <th className="px-6 py-4">Company</th>
                   <th className="px-6 py-4">Email</th>
                   <th className="px-6 py-4">Work Phone</th>
                   <th className="px-6 py-4 text-right">Payables</th>
                   <th className="px-6 py-4 text-center">Actions</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
                 {sortedVendors.length > 0 ? (
                   sortedVendors.map(v => (
                     <tr 
                       key={v.id} 
                       onClick={() => navigate(`/vendors/${v.id}`)}
                       className="hover:bg-slate-50 transition-colors cursor-pointer group"
                     >
                        <td className="px-6 py-4 text-[14px] font-medium text-blue-600 group-hover:underline">{v.name}</td>
                        <td className="px-6 py-4 text-[14px] text-slate-600">{v.companyName || '-'}</td>
                        <td className="px-6 py-4 text-[14px] text-slate-600">{v.email || '-'}</td>
                        <td className="px-6 py-4 text-[14px] text-slate-600">{v.workPhone || '-'}</td>
                        <td className="px-6 py-4 text-right">
                           <span className="text-[14px] text-slate-900 font-medium whitespace-nowrap">
                              ₹ {v.currentBalance?.toLocaleString() || '0.00'}
                           </span>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex items-center justify-center gap-2">
                              <button 
                                onClick={(e) => { e.stopPropagation(); navigate(`/vendors/${v.id}`); }} 
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 rounded shadow-sm transition-all text-[12px] font-medium"
                              >
                                 <Edit size={14} /> Edit
                              </button>
                              <button 
                                onClick={(e) => handleDelete(v.id, v.name, e)} 
                                className="flex items-center justify-center p-1.5 bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 rounded shadow-sm transition-all"
                              >
                                 <Trash2 size={16} />
                              </button>
                           </div>
                        </td>
                     </tr>
                   ))
                 ) : (
                   <tr>
                     <td colSpan="6" className="px-6 py-40 text-center bg-white">
                        <div className="flex flex-col items-center justify-center max-w-[600px] mx-auto animate-fade-in">
                           <div className="relative mb-10 group">
                             <div className="w-28 h-28 bg-blue-50/50 rounded-[2.5rem] flex items-center justify-center text-[#1e61f0] border border-blue-100 shadow-sm transition-transform duration-500 group-hover:scale-105 group-hover:rotate-3">
                               <ShoppingBag size={56} strokeWidth={1.2} />
                             </div>
                             <div className="absolute -bottom-1 -right-1 w-11 h-11 bg-[#1e61f0] rounded-2xl flex items-center justify-center border-4 border-white shadow-lg transition-all duration-300 group-hover:translate-x-1 group-hover:translate-y-1">
                               <Plus size={22} className="text-white" strokeWidth={3} />
                             </div>
                           </div>
                           <h2 className="text-[26px] font-bold text-slate-900 mb-3 tracking-tight">Your Procurement Engine Starts Here</h2>
                           <p className="text-slate-500 text-[16px] mb-10 leading-relaxed max-w-[440px]">
                              Centralize your vendor ecosystem, optimize your supply chain, and maintain crystal-clear payables—all from a single, intuitive interface.
                           </p>
                           <div className="flex items-center gap-5">
                              <button 
                                onClick={() => navigate('/vendors/new')}
                                className="bg-[#1e61f0] hover:bg-[#1a54d1] text-white px-8 py-3 rounded-xl font-bold text-[15px] flex items-center gap-2.5 transition-all shadow-xl shadow-blue-600/20 hover:shadow-blue-600/30 active:scale-[0.98]"
                              >
                                 <Plus size={20} strokeWidth={3}/> Onboard New Vendor
                              </button>
                              <button 
                                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-8 py-3 rounded-xl font-bold text-[15px] flex items-center gap-2.5 transition-all shadow-sm active:scale-[0.98]"
                              >
                                 <UploadIcon size={20} strokeWidth={2.5} className="text-slate-400" /> Bulk Import
                              </button>
                           </div>
                           
                           <div className="mt-16 flex items-center gap-8 py-6 px-10 bg-slate-50/50 rounded-2xl border border-slate-100/50 shadow-inner">
                              <div className="text-left">
                                 <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">Total Payables</p>
                                 <p className="text-xl font-black text-slate-900 italic">₹ 0.00</p>
                              </div>
                              <div className="w-[1px] h-10 bg-slate-200"></div>
                              <div className="text-left">
                                 <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">Active Vendors</p>
                                 <p className="text-xl font-black text-slate-900 italic">0</p>
                              </div>
                           </div>
                        </div>
                     </td>
                   </tr>
                 )}
              </tbody>
          </table>
       </div>
    </div>
  );
};

export default VendorsListView;
