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
    <div className="bg-white min-h-screen flex flex-col">
       {/* High-Fidelity Header */}
       <div className="flex items-center justify-between px-8 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
             <h1 className="text-[24px] font-black text-slate-900 tracking-tight">Purchase Orders</h1>
             <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2"></div>
          </div>
          <div className="flex items-center gap-3">
             <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
                <Search size={20} />
             </button>
             <button 
                onClick={() => window.location.href = '/purchase-orders/new'}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-2xl font-black text-[14px] flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 group"
             >
                <Plus size={18} strokeWidth={3} className="group-hover:rotate-90 transition-transform" />
                New Order
             </button>
          </div>
       </div>

       <div className="flex-1 flex flex-col overflow-hidden">
          {/* Status Tabs */}
          <div className="px-8 flex items-center gap-6 border-b border-slate-100 bg-slate-50/30">
             {['All', 'Draft', 'Sent', 'Received', 'Cancelled'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`text-[13px] font-black px-1 py-4 transition-all relative
                    ${filterStatus === status ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600 font-bold'}`}
                >
                   {status}
                   {filterStatus === status && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full animate-in slide-in-from-left duration-300"></div>
                   )}
                </button>
             ))}
          </div>

          <div className="flex-1 overflow-auto">
             {filteredOrders.length > 0 ? (
                <div className="p-8 animate-in fade-in duration-500">
                   <table className="w-full text-left">
                      <thead className="bg-slate-50/50 text-[11px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">
                         <tr>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Order#</th>
                            <th className="px-6 py-4 border-l border-slate-100/50">Vendor Name</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Amount</th>
                            <th className="px-6 py-4 text-center">Actions</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                         {filteredOrders.map(order => (
                            <tr key={order.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer group">
                               <td className="px-6 py-4 text-[14px] text-slate-600 font-medium">{new Date(order.date).toLocaleDateString()}</td>
                               <td className="px-6 py-4 text-[14px] font-black text-indigo-600">{order.orderNumber}</td>
                               <td className="px-6 py-4 text-[14px] text-slate-900 font-bold border-l border-slate-100/50">{order.Ledger?.name || '-'}</td>
                               <td className="px-6 py-4 text-[14px]">
                                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(order.status).replace('bg-', 'bg-opacity-10 border-')}`}>
                                     {order.status}
                                  </span>
                               </td>
                               <td className="px-6 py-4 text-right text-[14px] font-black text-slate-900 tracking-tight whitespace-nowrap">₹ {parseFloat(order.totalAmount || 0).toLocaleString()}</td>
                               <td className="px-6 py-4">
                                  <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-1 group-hover:translate-x-0">
                                     <button className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                                        <Edit size={16} />
                                     </button>
                                     <button className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                                        <Trash2 size={16} />
                                     </button>
                                  </div>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             ) : (
                <div className="flex-1 flex flex-col items-center justify-center bg-white min-h-[600px]">
                   {/* High-Fidelity Procurement Hero */}
                   <div className="w-full max-w-[800px] flex flex-col items-center text-center px-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
                      <div className="w-24 h-24 bg-indigo-50 rounded-[32px] flex items-center justify-center text-indigo-600 mb-10 shadow-sm border border-indigo-100 rotate-3 hover:rotate-0 transition-transform duration-500">
                         <ShoppingBag size={48} strokeWidth={1.5} />
                      </div>
                      
                      <h2 className="text-[36px] font-black text-slate-900 mb-4 tracking-tight leading-tight">
                         Streamline Your Procurement: <br/>
                         <span className="text-indigo-600">Master Your Purchase Orders</span>
                      </h2>
                      
                      <p className="text-slate-500 text-[17px] mb-12 max-w-[620px] leading-relaxed font-bold opacity-80">
                         Take full control of your supply chain. From draft requests to confirmed deliveries, 
                         track every order with precision and maintain seamless relationships with your vendors.
                      </p>

                      {/* Visual Lifecycle Steps */}
                      <div className="grid grid-cols-3 gap-0 w-full max-w-[600px] mb-12 relative p-10 bg-slate-50/50 rounded-[40px] border border-slate-100">
                         {/* Connecting Line */}
                         <div className="absolute top-[70px] left-[100px] right-[100px] h-0.5 border-t-2 border-dashed border-slate-200"></div>

                         {/* Step 1 */}
                         <div className="flex flex-col items-center gap-4 relative z-10 group">
                            <div className="w-14 h-14 rounded-2xl bg-white border-2 border-slate-100 flex items-center justify-center text-slate-300 group-hover:text-amber-500 group-hover:border-amber-100 transition-all shadow-sm">
                               <Clock size={24} />
                            </div>
                            <div className="text-center">
                               <div className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-1">Create Draft</div>
                               <div className="text-[10px] font-bold text-slate-400">Plan your needs</div>
                            </div>
                         </div>

                         {/* Step 2 */}
                         <div className="flex flex-col items-center gap-4 relative z-10 group">
                            <div className="w-14 h-14 rounded-2xl bg-white border-2 border-slate-100 flex items-center justify-center text-slate-300 group-hover:text-indigo-500 group-hover:border-indigo-100 transition-all shadow-sm">
                               <Send size={24} />
                            </div>
                            <div className="text-center">
                               <div className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-1">Send to Vendor</div>
                               <div className="text-[10px] font-bold text-slate-400">Negotiate terms</div>
                            </div>
                         </div>

                         {/* Step 3 */}
                         <div className="flex flex-col items-center gap-4 relative z-10 group">
                            <div className="w-14 h-14 rounded-2xl bg-white border-2 border-slate-100 flex items-center justify-center text-slate-300 group-hover:text-emerald-500 group-hover:border-emerald-100 transition-all shadow-sm">
                               <CheckCircle2 size={24} />
                            </div>
                            <div className="text-center">
                               <div className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-1">Receive Goods</div>
                               <div className="text-[10px] font-bold text-slate-400">Update inventory</div>
                            </div>
                         </div>
                      </div>

                      <div className="flex items-center gap-4">
                         <button 
                            onClick={() => window.location.href = '/purchase-orders/new'}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 rounded-[24px] font-black text-[16px] flex items-center gap-3 transition-all shadow-xl shadow-indigo-600/30 active:scale-95 group"
                         >
                            <Plus size={20} strokeWidth={3} className="group-hover:rotate-90 transition-transform" />
                            Create Your First Order
                         </button>
                      </div>
                   </div>
                </div>
             )}
          </div>
       </div>
    </div>
  );
};

export default PurchaseOrdersView;
