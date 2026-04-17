import React from 'react';
import { ChevronDown, Plus, MoreHorizontal, Database, Trash2, Edit2, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { priceListAPI } from '../../services/api';
import ConfirmModal from '../../components/ConfirmModal';
import useNotificationStore from '../../store/notificationStore';

const PriceListView = () => {
  const navigate = useNavigate();
  const [pricelists, setPricelists] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [filterType, setFilterType] = React.useState('All');
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const { addNotification } = useNotificationStore();

  React.useEffect(() => {
    const fetchPriceLists = async () => {
      try {
        const companyId = localStorage.getItem('companyId');
        if (companyId) {
          const res = await priceListAPI.getByCompany(companyId);
          setPricelists(res.data || []);
        }
      } catch (err) {
        console.error('Fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPriceLists();
  }, []);

  const handleDelete = (id) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await priceListAPI.delete(deleteId);
      setPricelists(prev => prev.filter(p => p.id !== deleteId));
      addNotification('Price list deleted successfully', 'success');
    } catch (err) {
      addNotification('Failed to delete price list', 'error');
    } finally {
      setIsDeleteModalOpen(false);
      setDeleteId(null);
    }
  };

  const filteredLists = pricelists.filter(list => {
    if (filterType === 'All') return true;
    return list.transactionType === filterType;
  });

  return (
    <div className="flex flex-col h-screen bg-white font-sans animate-fade-in" onClick={() => setIsFilterOpen(false)}>
      {/* Header Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 relative z-20">
        <div className="relative">
          <div 
            onClick={(e) => { e.stopPropagation(); setIsFilterOpen(!isFilterOpen); }}
            className={`flex items-center gap-2 cursor-pointer group px-2 py-1 -ml-2 rounded-md transition-colors ${isFilterOpen ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}
          >
            <h1 className="text-[18px] font-bold text-slate-900 tracking-tight">{filterType === 'All' ? 'All Price Lists' : `${filterType} Price Lists`}</h1>
            <ChevronDown size={18} className={`text-[#1e61f0] mt-0.5 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} strokeWidth={3} />
          </div>

          {isFilterOpen && (
            <div className="absolute top-[calc(100%+8px)] left-0 w-[180px] bg-white border border-slate-100 rounded-lg shadow-xl py-1.5 animate-fade-in-fast">
              {['All', 'Sales', 'Purchase'].map(type => (
                <div 
                  key={type}
                  onClick={() => { setFilterType(type); setIsFilterOpen(false); }}
                  className={`px-4 py-2.5 text-[13px] font-medium cursor-pointer transition-colors ${filterType === type ? 'text-[#1e61f0] bg-blue-50/50' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  {type === 'Purchase' ? 'Purchases' : type}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <button className="text-[12px] font-medium text-[#1e61f0] hover:underline transition-all">
            Default Price List for Retail Transactions
          </button>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigate('/price-lists/new')}
              className="bg-[#1e61f0] text-white px-4 py-1.5 rounded-md font-bold text-[12px] flex items-center gap-1.5 hover:bg-[#1a54d1] shadow-sm transition-all"
            >
              <Plus size={16} strokeWidth={3}/> New
            </button>
            
            <button className="p-1.5 border border-slate-200 rounded-md text-slate-400 hover:bg-slate-50 transition-all">
              <MoreHorizontal size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-[#f8fafc]/30">
        {loading ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-sm">Loading price lists...</div>
        ) : pricelists.length > 0 ? (
          <div className="p-6">
            <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#fcfdff] border-b border-slate-100">
                    <th className="px-6 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Name and description</th>
                    <th className="px-6 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Currency</th>
                    <th className="px-6 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Details</th>
                    <th className="px-6 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Pricing Scheme</th>
                    <th className="px-6 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap flex items-center justify-between">
                      <span>Round Off Preference</span>
                      <Search size={12} className="text-slate-400 cursor-pointer hover:text-[#1e61f0] transition-colors" />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredLists.map(plist => (
                    <tr key={plist.id} className="hover:bg-slate-50/40 transition-colors group">
                      <td className="px-6 py-3.5">
                        <div 
                          className="text-[13px] font-bold text-[#1e61f0] hover:underline cursor-pointer"
                          onClick={() => navigate(`/price-lists/edit/${plist.id}`)}
                        >
                          {plist.name}
                        </div>
                        {plist.description && (
                          <div className="text-[11px] text-slate-500 mt-0.5">{plist.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-[13px] text-slate-700 font-medium">
                        {plist.priceListType === 'Individual Items' && plist.currency ? plist.currency.split('-')[0].trim() : '-'}
                      </td>
                      <td className="px-6 py-3.5 text-[13px] text-slate-700 font-medium">
                        {plist.priceListType === 'All Items' ? `${plist.percentage}% ${plist.markupType}` : '-'}
                      </td>
                      <td className="px-6 py-3.5 text-[13px] text-slate-700 font-medium">
                        {plist.priceListType === 'Individual Items' && plist.pricingScheme ? plist.pricingScheme : '-'}
                      </td>
                      <td className="px-6 py-3.5 text-[13px] text-slate-700 font-medium relative">
                        {plist.priceListType === 'All Items' && plist.roundOffTo ? plist.roundOffTo : '-'}
                        {/* Hover Actions */}
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm pl-4">
                          <button 
                            onClick={() => navigate(`/price-lists/edit/${plist.id}`)}
                            className="p-1.5 text-slate-400 hover:text-[#1e61f0] hover:bg-blue-50 rounded transition-all"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(plist.id); }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center">
            <div className="max-w-xl animate-fade-up">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-500 shadow-sm">
                <Database size={32} />
              </div>
              <h2 className="text-[28px] font-medium text-slate-800 mb-3">
                Customize Your Item Pricing with Flexibility
              </h2>
              <p className="text-[14px] text-slate-500 mb-10 leading-relaxed uppercase tracking-tight font-medium">
                Create and manage multiple pricelists tailored to different customer segments.
              </p>
              
              <button 
                onClick={() => navigate('/price-lists/new')}
                className="bg-[#1e61f0] text-white px-8 py-3 rounded-md font-black text-[12px] uppercase tracking-[0.15em] hover:bg-[#1a54d1] shadow-lg shadow-blue-500/20 transition-all hover:scale-105 active:scale-95"
              >
                CREATE PRICE LIST
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Price List"
        message="Are you sure you want to delete this price list? This action cannot be undone and may affect items using this scheme."
      />
    </div>
  );
};

export default PriceListView;
