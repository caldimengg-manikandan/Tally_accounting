import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, MoreHorizontal, ChevronDown, User, Check, 
  FileUp, Sparkles, Link as LinkIcon, Globe, ArrowDownToLine,
  ArrowDownUp, Download, Upload as UploadIcon, Settings, RefreshCw, RotateCcw,
  ChevronRight, ArrowUp, ArrowDown, Edit, Trash2
} from 'lucide-react';
import { ledgerAPI, groupAPI } from '../../services/api';
import ConfirmModal from '../../components/ConfirmModal';
import { getCurrencyDisplay } from '../../utils/currencies';

const CustomersListView = ({ companyId }) => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const sortedCustomers = [...customers].sort((a, b) => {
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

  // Close dropdown when clicking outside
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
    
    const fetchCustomers = async () => {
      try {
        console.log("Fetching customers for company:", companyId);
        const res = await ledgerAPI.getByCompany(companyId);
        
        // Filter for Sundry Debtors (Customers) only
        const allLedgers = Array.isArray(res.data) ? res.data : [];
        console.log("Total ledgers fetched:", allLedgers.length);
        
        const customerLedgers = allLedgers.filter(l => {
          const groupName = l.Group?.name?.toLowerCase() || l.groupName?.toLowerCase() || "";
          return groupName.includes('debtor') || groupName.includes('customer');
        });
        
        console.log("Filtered customers:", customerLedgers.length);
        setCustomers(customerLedgers);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch customers:", err);
        setError("Unable to load customers. There might be a database synchronization issue. Please check the backend server.");
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
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
      setCustomers(customers.filter(c => c.id !== deleteId));
    } catch (err) {
      setModalConfig({
        isOpen: true,
        title: 'Delete Failed',
        message: err.response?.data?.error || "Failed to delete customer. Please ensure there are no active transactions linked to this customer.",
        type: 'danger',
        showCancel: false,
        confirmText: 'Continue'
      });
    } finally {
      setIsDeleteModalOpen(false);
      setDeleteId(null);
      setDeleteName('');
    }
  };

  // Removed auto-redirect to creation form to allow viewing empty state
  useEffect(() => {
    // console.log("List state:", { loading, count: customers.length });
  }, [loading, customers]);

  if (loading) return (
    <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
      <RefreshCw size={24} className="animate-spin text-[#1e61f0] mb-4" />
      <p className="text-slate-500 text-[14px]">Loading Customers...</p>
    </div>
  );

  // UI always renders now, with empty state handled inside the table body

  // Placeholder for the actual list if customers exist
  return (
    <div className="bg-white min-h-screen">
       <div className="flex items-center justify-between px-8 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2 group cursor-pointer">
             <h1 className="text-[20px] font-bold text-slate-900">All Customers</h1>
             <ChevronDown size={18} className="text-blue-600 mt-1" />
          </div>
          <div className="flex items-center gap-2">
             <button 
               onClick={() => navigate('/customers/new')}
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
                     {/* SORT BY */}
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
                        
                        {/* Submenu: Sort By */}
                        {activeSubMenu === 'sort' && (
                           <div className="absolute top-0 right-[calc(100%+4px)] w-[200px] bg-white rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 py-1 animate-fade-in text-[13px]">
                              <SortOption label="Name" sortKey="name" />
                              <SortOption label="Company Name" sortKey="companyName" />
                              <SortOption label="Receivables (BCY)" sortKey="currentBalance" />
                              <SortOption label="Created Time" sortKey="createdAt" />
                              <SortOption label="Last Modified Time" sortKey="updatedAt" />
                           </div>
                        )}
                     </div>

                     {/* IMPORT */}
                     <div 
                        className={`relative px-4 py-2.5 cursor-pointer flex items-center justify-between transition-colors ${activeSubMenu === 'import' ? 'bg-[#1e61f0] text-white' : 'hover:bg-[#f4f5f7]'}`}
                        onMouseEnter={() => setActiveSubMenu('import')}
                        onMouseLeave={() => setActiveSubMenu(null)}
                     >
                        <div className="flex items-center gap-3">
                           <Download size={16} className={activeSubMenu === 'import' ? 'text-white' : 'text-[#1e61f0]'}/>
                           <span>Import</span>
                        </div>
                        <ChevronRight size={14} className={activeSubMenu === 'import' ? 'text-white' : 'text-[#1e61f0]'} />

                        {/* Submenu: Import */}
                        {activeSubMenu === 'import' && (
                           <div className="absolute top-0 right-[calc(100%+4px)] w-[180px] bg-white rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 py-1 animate-fade-in">
                              <div className="px-4 py-2 bg-[#1e61f0] text-white cursor-pointer rounded-sm mx-1 text-[13px]">
                                 Import Customers
                              </div>
                           </div>
                        )}
                     </div>

                     {/* EXPORT */}
                     <div 
                        className={`relative px-4 py-2.5 cursor-pointer flex items-center justify-between transition-colors border-b border-slate-100 pb-3 mb-1 ${activeSubMenu === 'export' ? 'bg-[#1e61f0] text-white' : 'hover:bg-[#f4f5f7]'}`}
                        onMouseEnter={() => setActiveSubMenu('export')}
                        onMouseLeave={() => setActiveSubMenu(null)}
                     >
                        <div className="flex items-center gap-3">
                           <UploadIcon size={16} className={activeSubMenu === 'export' ? 'text-white' : 'text-[#1e61f0]'}/>
                           <span>Export</span>
                        </div>
                        <ChevronRight size={14} className={activeSubMenu === 'export' ? 'text-white' : 'text-[#1e61f0]'} />
                     </div>

                     {/* Preferences */}
                     <div className="px-4 py-2.5 hover:bg-[#1e61f0] hover:text-white group cursor-pointer flex items-center gap-3 transition-colors">
                        <Settings size={16} className="text-[#1e61f0] group-hover:text-white"/>
                        <span>Preferences</span>
                     </div>

                     {/* Refresh List */}
                     <div className="px-4 py-2.5 hover:bg-[#1e61f0] hover:text-white group cursor-pointer flex items-center gap-3 transition-colors border-t border-slate-100 mt-1 pt-3">
                        <RefreshCw size={16} className="text-[#1e61f0] group-hover:text-white"/>
                        <span>Refresh List</span>
                     </div>

                     {/* Reset Column Width */}
                     <div className="px-4 py-2.5 hover:bg-[#1e61f0] hover:text-white group cursor-pointer flex items-center gap-3 transition-colors">
                        <RotateCcw size={16} className="text-[#1e61f0] group-hover:text-white"/>
                        <span>Reset Column Width</span>
                     </div>
                  </div>
                )}
             </div>
          </div>
        <ConfirmModal 
           isOpen={isDeleteModalOpen}
           onClose={() => setIsDeleteModalOpen(false)}
           onConfirm={confirmDelete}
           title="Delete Customer"
           message={`Are you sure you want to delete ${deleteName}? All transaction history and balance data for this customer will be permanently removed.`}
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

       <div className="p-8">
          {/* Detailed list implementation would go here */}
          <table className="w-full text-left">
             <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200">
                <tr>
                   <th className="px-6 py-4">Name</th>
                   <th className="px-6 py-4">Company Name</th>
                   <th className="px-6 py-4">Email</th>
                   <th className="px-6 py-4">Work Phone</th>
                   <th className="px-6 py-4 text-right">Receivables</th>
                   <th className="px-6 py-4 text-center">Actions</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
                 {sortedCustomers.length > 0 ? (
                   sortedCustomers.map(c => (
                     <tr 
                       key={c.id} 
                       onClick={() => navigate(`/customers/view/${c.id}`)}
                       className="hover:bg-slate-50 transition-colors cursor-pointer group"
                     >
                        <td className="px-6 py-4 text-[14px] font-medium text-blue-600 group-hover:underline">{c.name}</td>
                        <td className="px-6 py-4 text-[14px] text-slate-600">{c.companyName || '-'}</td>
                        <td className="px-6 py-4 text-[14px] text-slate-600">{c.email || '-'}</td>
                        <td className="px-6 py-4 text-[14px] text-slate-600">{c.workPhone || '-'}</td>
                        <td className="px-6 py-4 text-right">
                           <span className="text-[14px] text-slate-900 font-medium whitespace-nowrap">
                               {getCurrencyDisplay(c.currency)} {c.currentBalance?.toLocaleString() || '0.00'}
                           </span>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex items-center justify-center gap-2">
                              <button 
                                onClick={(e) => { e.stopPropagation(); navigate(`/customers/${c.id}`); }} 
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 rounded shadow-sm transition-all text-[12px] font-medium"
                              >
                                 <Edit size={14} /> Edit
                              </button>
                              <button 
                                onClick={(e) => handleDelete(c.id, c.name, e)} 
                                className="flex items-center justify-center p-1.5 bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 rounded shadow-sm transition-all"
                                title="Delete Customer"
                              >
                                 <Trash2 size={16} />
                              </button>
                           </div>
                        </td>
                     </tr>
                   ))
                 ) : (
                   <tr>
                     <td colSpan="6" className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center justify-center gap-3">
                           <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                              <User size={24} />
                           </div>
                           <p className={`${error ? 'text-red-500 font-medium' : 'text-slate-500'} text-[14px]`}>{error || "No customers found."}</p>
                           <button 
                             onClick={() => navigate('/customers/new')}
                             className="text-blue-600 text-[13px] font-medium hover:underline"
                           >
                              Add your first customer
                           </button>
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

export default CustomersListView;
