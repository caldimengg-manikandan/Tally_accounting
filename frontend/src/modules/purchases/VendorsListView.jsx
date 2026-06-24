import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, MoreHorizontal, ChevronDown, User, RefreshCw, RotateCcw,
  ArrowDownUp, Download, Upload as UploadIcon, Settings, 
  ChevronRight, ArrowUp, ArrowDown, Edit, Trash2, ShoppingBag, Search
} from 'lucide-react';
import { purchaseAPI, ledgerAPI } from '../../services/api';
import useNotificationStore from '../../store/notificationStore';
import ConfirmModal from '../../components/ConfirmModal';
import { getCurrencyDisplay } from '../../utils/currencies';

const VendorsListView = ({ companyId }) => {
  const navigate = useNavigate();
  const { addNotification } = useNotificationStore();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [activeSubMenu, setActiveSubMenu] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [deleteId, setDeleteId] = useState(null);
  const [deleteName, setDeleteName] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', type: 'info', showCancel: false });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
    setIsOptionsOpen(false);
  };

  const filteredVendors = vendors.filter(v => 
    (v.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.companyName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.workPhone || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedVendors = [...filteredVendors].sort((a, b) => {
    let aValue = a[sortConfig.key] || '';
    let bValue = b[sortConfig.key] || '';
    if (sortConfig.key === 'currentBalance' || sortConfig.key === 'unusedCredits') {
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

  const fetchVendors = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      console.log("Fetching vendors for company:", companyId);
      const res = await ledgerAPI.getByCompany(companyId);
      
      // Filter for Sundry Creditors (Vendors) only
      const allLedgers = Array.isArray(res.data) ? res.data : [];
      console.log("Total ledgers fetched:", allLedgers.length);
      
      const vendorLedgers = allLedgers.filter(l => {
        const groupName = l.Group?.name?.toLowerCase() || l.groupName?.toLowerCase() || "";
        return groupName.includes('creditor') || groupName.includes('vendor');
      });
      
      console.log("Filtered vendors:", vendorLedgers.length);
      setVendors(vendorLedgers);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch vendors:", err);
      setError("Unable to load vendors. There might be a database synchronization issue. Please check the backend server.");
      addNotification(err.response?.data?.error || err.message || "Failed to fetch vendors list", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [companyId]);

  const handleDelete = (id, name, e) => {
    e.stopPropagation();
    setDeleteId(id);
    setDeleteName(name);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await ledgerAPI.delete(deleteId);
      addNotification("Vendor deleted successfully!", "success");
      setVendors(vendors.filter(v => v.id !== deleteId));
    } catch (err) {
      setModalConfig({
        isOpen: true,
        title: 'Delete Failed',
        message: err.response?.data?.error || "Failed to delete vendor. Please ensure there are no active transactions linked to this vendor.",
        type: 'danger',
        showCancel: false,
        confirmText: 'Continue'
      });
      addNotification(err.response?.data?.error || "Failed to delete vendor", "error");
    } finally {
      setIsDeleteModalOpen(false);
      setDeleteId(null);
      setDeleteName('');
    }
  };

  if (loading) return (
    <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
      <RefreshCw size={24} className="animate-spin text-[#1e61f0] mb-4" />
      <p className="text-slate-500 text-[14px]">Loading Vendors...</p>
    </div>
  );

  return (
    <div className="bg-white min-h-[calc(100vh-80px)]">
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
                              <SortOption label="Unused Credits" sortKey="unusedCredits" />
                           </div>
                        )}
                     </div>

                     <div 
                        onClick={() => fetchVendors()}
                        className="px-4 py-2.5 hover:bg-[#1e61f0] hover:text-white group cursor-pointer flex items-center gap-3 transition-colors border-t border-slate-100 mt-1 pt-3"
                     >
                        <RefreshCw size={16} className="text-[#1e61f0] group-hover:text-white"/>
                        <span>Refresh List</span>
                     </div>
                  </div>
                )}
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
                 onClick={fetchVendors}
                 className="p-2 text-slate-400 hover:text-[#1e61f0] transition-colors"
                 title="Refresh"
             >
                 <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
             </button>
         </div>

         <div className="flex items-center gap-3">
             <button onClick={fetchVendors} className="h-9 px-4 flex items-center gap-2 bg-white border border-slate-200 text-slate-600 rounded-[4px] text-[11px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
                 <RefreshCw size={14} /> Sync
             </button>
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
                   <th className="px-6 py-4">GSTIN</th>
                   <th className="px-6 py-4 text-right">Payables</th>
                   <th className="px-6 py-4 text-right">Unused Credits (BCY)</th>

                </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
                 {sortedVendors.length > 0 ? (
                   sortedVendors.map(v => (
                     <tr 
                       key={v.id} 
                       onClick={() => navigate(`/vendors/view/${v.id}`)}
                       className="hover:bg-slate-50 transition-colors cursor-pointer group"
                     >
                        <td className="px-6 py-4 text-[14px] font-medium text-blue-600 group-hover:underline">{v.name}</td>
                        <td className="px-6 py-4 text-[14px] text-slate-600">{v.companyName || '-'}</td>
                        <td className="px-6 py-4 text-[14px] text-slate-600">{v.email || '-'}</td>
                        <td className="px-6 py-4 text-[14px] text-slate-600">{v.phone || v.workPhone || v.mobile || '-'}</td>
                        <td className="px-6 py-4 text-[14px] text-slate-600">
                           {v.gstNumber ? (
                             <span title={v.gstNumber} className="cursor-help border-b border-dotted border-slate-400 font-mono">
                               {v.gstNumber.slice(0, 6)}***
                             </span>
                           ) : '-'}
                        </td>
                        <td className="px-6 py-4 text-right">
                           <span className="text-[14px] text-slate-900 font-medium whitespace-nowrap">
                              {getCurrencyDisplay(v.currency)} {Math.abs(parseFloat(v.currentBalance || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <span className="text-[14px] text-slate-900 font-medium whitespace-nowrap">
                              {getCurrencyDisplay(v.currency)} {(parseFloat(v.unusedCredits || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                           </span>
                        </td>

                     </tr>
                   ))
                 ) : (
                   <tr>
                     <td colSpan="7" className="px-6 py-40 text-center bg-white">
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
                           <p className="text-slate-500 text-[16px] mb-6 leading-relaxed max-w-[440px]">
                              Centralize your vendor ecosystem, optimize your supply chain, and maintain crystal-clear payables—all from a single, intuitive interface.
                           </p>
                           <div className="text-[11px] font-mono text-slate-300 mb-8">
                              Company: {companyId || 'none'} | Vendors: {vendors.length}
                           </div>
                           <div className="flex items-center gap-5">
                              <button 
                                onClick={() => navigate('/vendors/new')}
                                className="bg-[#1e61f0] hover:bg-[#1a54d1] text-white px-8 py-3 rounded-xl font-bold text-[15px] flex items-center gap-2.5 transition-all shadow-xl shadow-blue-600/20 hover:shadow-blue-600/30 active:scale-[0.98]"
                              >
                                 <Plus size={20} strokeWidth={3}/> Onboard New Vendor
                              </button>
                           </div>
                        </div>
                     </td>
                   </tr>
                 )}
              </tbody>
          </table>
       </div>

       <ConfirmModal 
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={confirmDelete}
          title="Delete Vendor"
          message={`Are you sure you want to delete ${deleteName}? All transaction history and balance data for this vendor will be permanently removed.`}
       />

       <ConfirmModal 
           isOpen={modalConfig.isOpen}
           onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
           title={modalConfig.title}
           message={modalConfig.message}
           type={modalConfig.type}
           showCancel={modalConfig.showCancel}
           confirmText={modalConfig.confirmText}
       />
    </div>
  );
};

export default VendorsListView;
