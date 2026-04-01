import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download, Columns, Rows, ChevronLeft, ChevronRight } from 'lucide-react';
import { salesAPI, ledgerAPI } from '../../services/api';

const SalesOrdersView = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [newOrder, setNewOrder] = useState({ id: null, orderNumber: '', customerId: '', totalAmount: '', notes: '', status: 'Draft' });
    const companyId = localStorage.getItem('companyId');

    const [customers, setCustomers] = useState([]);

    const fetchOrders = async () => {
        try {
            const res = await salesAPI.getOrders(companyId);
            setOrders(res.data);
            
            const lRes = await ledgerAPI.getByCompany(companyId);
            const debtors = lRes.data.filter(l => 
                l.Group?.name.toLowerCase().includes('debtor') || 
                l.Group?.name.toLowerCase().includes('customer')
            );
            setCustomers(debtors);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    useEffect(() => {
        if (companyId) fetchOrders();
    }, [companyId]);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await salesAPI.updateOrder(newOrder.id, { ...newOrder, companyId });
            } else {
                await salesAPI.createOrder({ ...newOrder, companyId });
            }
            setShowCreateModal(false);
            fetchOrders();
        } catch (err) { alert(err.message); }
    };

    const openCreateModal = () => {
        setIsEditing(false);
        setNewOrder({ id: null, orderNumber: '', customerId: '', totalAmount: '', notes: '', status: 'Draft' });
        setShowCreateModal(true);
    };

    const openEditModal = (order) => {
        setIsEditing(true);
        setNewOrder({
            id: order.id,
            orderNumber: order.orderNumber,
            customerId: order.LedgerId || '',
            totalAmount: order.totalAmount,
            notes: order.notes || '',
            status: order.status || 'Draft'
        });
        setShowCreateModal(true);
    };

    return (
        <div className="bg-white rounded-[1.5rem] border border-gray-200 shadow-sm overflow-hidden animate-fade-up">
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="relative w-80">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="text" placeholder="Search by ID, Customer..." className="w-full pl-11 pr-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:border-blue-500 transition-all"/>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="w-9 h-9 flex items-center justify-center bg-[#1e3a8a] text-white rounded-lg shadow hover:bg-blue-900 transition-colors">
                            <Download size={16} />
                        </button>
                        <button 
                          onClick={openCreateModal}
                          className="bg-[#1e3a8a] text-white px-5 py-2 rounded-lg font-black text-xs shadow hover:bg-blue-900 flex items-center gap-2 transition-colors uppercase tracking-widest"
                        >
                            <Plus size={16} strokeWidth={3}/> CREATE NEW ORDER
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3 mb-6">
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-xs font-bold text-[#1e3a8a] hover:bg-gray-50 transition-colors">
                        <Columns size={14}/> Freeze Columns
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-xs font-bold text-[#1e3a8a] hover:bg-gray-50 transition-colors">
                        <Rows size={14}/> Freeze Rows
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead className="bg-[#1e3a8a] text-[10px] font-bold uppercase text-white tracking-widest">
                        <tr>
                            <th className="p-5 w-16 text-center">S.NO</th>
                            <th className="p-5">
                                <div className="flex justify-between items-center">
                                    <span>ORDER NO</span>
                                    <Filter size={12} className="opacity-70 cursor-pointer"/>
                                </div>
                            </th>
                            <th className="p-5">
                                <div className="flex justify-between items-center">
                                    <span>DATE</span>
                                    <Filter size={12} className="opacity-70 cursor-pointer"/>
                                </div>
                            </th>
                            <th className="p-5">
                                <div className="flex justify-between items-center">
                                    <span>CUSTOMER</span>
                                    <Filter size={12} className="opacity-70 cursor-pointer"/>
                                </div>
                            </th>
                            <th className="p-5">
                                <div className="flex justify-between items-center">
                                    <span>STATUS</span>
                                    <Filter size={12} className="opacity-70 cursor-pointer"/>
                                </div>
                            </th>
                            <th className="p-5 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <span>TOTAL AMOUNT</span>
                                    <Filter size={12} className="opacity-70 cursor-pointer"/>
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {orders.length === 0 ? (
                            <tr><td colSpan="6" className="py-20 text-center font-bold text-gray-400 italic">No records found.</td></tr>
                        ) : (
                            orders.map((order, i) => (
                                <tr key={order.id} onClick={() => openEditModal(order)} className="hover:bg-gray-50 transition-colors cursor-pointer">
                                    <td className="p-5 text-xs font-bold text-gray-600 text-center">{i + 1}</td>
                                    <td className="p-5 text-xs font-bold text-gray-900">{order.orderNumber}</td>
                                    <td className="p-5 text-xs font-semibold text-gray-600">{new Date(order.date).toLocaleDateString()}</td>
                                    <td className="p-5 text-xs font-semibold text-gray-600">{order.Ledger?.name || 'Unknown'}</td>
                                    <td className="p-5">
                                        <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider ${
                                            order.status === 'Draft' ? 'bg-gray-100 text-gray-600' : 
                                            order.status === 'Sent' ? 'bg-blue-50 text-blue-600' : 
                                            order.status === 'Accepted' ? 'bg-green-50 text-green-600' : 
                                            'bg-red-50 text-red-600'
                                        }`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="p-5 text-right text-xs font-black text-gray-900">₹{parseFloat(order.totalAmount).toLocaleString('en-IN')}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-500">
                    Showing <span className="text-gray-900">1</span> to <span className="text-gray-900">{orders.length}</span> of <span className="text-gray-900">{orders.length}</span> records
                </span>
                <div className="flex items-center gap-2 text-xs font-bold">
                    <button className="flex items-center gap-1 text-gray-400 hover:text-gray-600 px-3 py-1.5 transition-colors uppercase tracking-widest text-[10px]">
                        <ChevronLeft size={14}/> PREVIOUS
                    </button>
                    <button className="w-8 h-8 rounded-full bg-[#1e3a8a] text-white flex items-center justify-center">1</button>
                    <button className="flex items-center gap-1 text-gray-400 hover:text-gray-600 px-3 py-1.5 transition-colors uppercase tracking-widest text-[10px]">
                        NEXT <ChevronRight size={14}/>
                    </button>
                </div>
            </div>

            {showCreateModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#0f172a]/40 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-xl rounded-2xl shadow-float p-8 animate-fade-scale border border-gray-100">
                        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                            <h3 className="text-lg font-black text-[#1e3a8a] uppercase tracking-widest">{isEditing ? 'Edit Order' : 'Create Order'}</h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600"><Plus size={24} className="rotate-45"/></button>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Order #</label>
                                    <input required value={newOrder.orderNumber} onChange={e => setNewOrder({...newOrder, orderNumber: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-xs font-bold outline-none focus:border-blue-500" placeholder="SO-001" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Status</label>
                                    <select value={newOrder.status} onChange={e => setNewOrder({...newOrder, status: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-xs font-bold outline-none focus:border-blue-500">
                                        <option>Draft</option><option>Sent</option><option>Accepted</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Customer</label>
                                <select value={newOrder.customerId} onChange={e => setNewOrder({...newOrder, customerId: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-xs font-bold outline-none focus:border-blue-500">
                                    <option value="">Select Customer (Optional)</option>
                                    {customers.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Total Amount (₹)</label>
                                <input type="number" required value={newOrder.totalAmount} onChange={e => setNewOrder({...newOrder, totalAmount: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-xs font-bold outline-none focus:border-blue-500" placeholder="0.00" />
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="px-5 py-2.5 text-gray-500 text-xs font-bold tracking-widest uppercase">Cancel</button>
                                <button type="submit" className="px-5 py-2.5 bg-[#1e3a8a] text-white rounded-lg text-xs font-black tracking-widest uppercase shadow">Save Order</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalesOrdersView;
