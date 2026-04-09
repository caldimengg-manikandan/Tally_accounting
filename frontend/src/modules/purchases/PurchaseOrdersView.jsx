import React, { useState, useEffect } from 'react';
import { 
  Plus, ShoppingBag, RefreshCw, Trash2, Edit, 
  ChevronDown, Search, Filter, MoreHorizontal,
  Clock, CheckCircle2, XCircle, Send
} from 'lucide-react';
import { purchaseAPI, ledgerAPI } from '../../services/api';

const PurchaseOrdersView = ({ companyId }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await purchaseAPI.getOrders(companyId);
      setOrders(res.data || []);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) fetchOrders();
  }, [companyId]);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Draft': return 'bg-slate-100 text-slate-600';
      case 'Sent': return 'bg-blue-100 text-blue-600';
      case 'Received': return 'bg-emerald-100 text-emerald-600';
      case 'Cancelled': return 'bg-red-100 text-red-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const filteredOrders = filterStatus === 'All' 
    ? orders 
    : orders.filter(o => o.status === filterStatus);

  if (loading) return (
    <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
      <RefreshCw size={24} className="animate-spin text-[#1e61f0] mb-4" />
      <p className="text-slate-500 text-[14px]">Loading Purchase Orders...</p>
    </div>
  );

  return (
    <div className="bg-white min-h-screen">
       <div className="flex items-center justify-between px-8 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
             <h1 className="text-[20px] font-bold text-slate-900">Purchase Orders</h1>
             <ChevronDown size={18} className="text-blue-600 mt-1" />
          </div>
          <div className="flex items-center gap-2">
             <button className="bg-[#1e61f0] hover:bg-[#1a54d1] text-white px-4 py-2 rounded-md font-medium flex items-center gap-1.5 transition-all shadow-sm">
                <Plus size={18} strokeWidth={2.5}/> New Order
             </button>
          </div>
       </div>

       <div className="p-8">
          <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-4">
             {['All', 'Draft', 'Sent', 'Received', 'Cancelled'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`text-[13px] font-medium px-1 pb-4 -mb-[17px] transition-all
                    ${filterStatus === status ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
                >
                   {status}
                </button>
             ))}
          </div>

          <table className="w-full text-left">
             <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200">
                <tr>
                   <th className="px-6 py-4">Date</th>
                   <th className="px-6 py-4">Order#</th>
                   <th className="px-6 py-4">Vendor Name</th>
                   <th className="px-6 py-4">Status</th>
                   <th className="px-6 py-4 text-right">Amount</th>
                   <th className="px-6 py-4 text-center">Actions</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
                {filteredOrders.length > 0 ? (
                  filteredOrders.map(order => (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors cursor-pointer group">
                       <td className="px-6 py-4 text-[14px] text-slate-600">{new Date(order.date).toLocaleDateString()}</td>
                       <td className="px-6 py-4 text-[14px] font-medium text-blue-600">{order.orderNumber}</td>
                       <td className="px-6 py-4 text-[14px] text-slate-900">{order.Ledger?.name || '-'}</td>
                       <td className="px-6 py-4 text-[14px]">
                          <span className={`px-2 py-1 rounded-full text-[11px] font-black uppercase tracking-tight ${getStatusStyle(order.status)}`}>
                             {order.status}
                          </span>
                       </td>
                       <td className="px-6 py-4 text-right text-[14px] font-black text-slate-900">₹ {parseFloat(order.totalAmount || 0).toLocaleString()}</td>
                       <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                             <button className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors">
                                <Edit size={16} />
                             </button>
                             <button className="p-1.5 text-slate-400 hover:text-red-500 transition-colors">
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
                              <ShoppingBag size={24} />
                           </div>
                           <p className="text-slate-500 text-[14px]">No purchase orders found.</p>
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

export default PurchaseOrdersView;
