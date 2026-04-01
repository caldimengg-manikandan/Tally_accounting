import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, PlusCircle, Search, Filter, MoreVertical, FileText, CheckCircle2, History } from 'lucide-react';
import { voucherAPI } from '../../services/api';

const PaymentsReceivedView = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const companyId = localStorage.getItem('companyId');
    const navigate = useNavigate();

    const fetchPayments = async () => {
        try {
            const res = await voucherAPI.getByCompany(companyId);
            // Receipt = Payment Received
            const receipts = res.data.filter(v => v.voucherType === 'Receipt');
            setPayments(receipts);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    useEffect(() => {
        if (companyId) fetchPayments();
    }, [companyId]);

    return (
        <div className="space-y-6 animate-fade-up">
            <div className="flex justify-between items-center mb-8">
                <div className="flex gap-4">
                    <div className="relative w-64">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-300" />
                        <input type="text" placeholder="Search payments..." className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm font-semibold outline-none focus:border-primary-400 shadow-sm transition-all"/>
                    </div>
                </div>
                <button 
                  onClick={() => navigate('/vouchers')}
                  className="bg-primary-600 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-glow flex items-center gap-2 hover:bg-primary-700 transition"
                >
                    <PlusCircle size={18}/> Open Vouchers Engine
                </button>
            </div>

            <div className="bg-white rounded-4xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-surface-50 text-[10px] font-black uppercase text-ink-400 tracking-widest">
                        <tr>
                            <th className="p-6">Payment Date</th>
                            <th className="p-6">Voucher #</th>
                            <th className="p-6">Customer Name</th>
                            <th className="p-6">Reference</th>
                            <th className="p-6 text-right">Amount Received</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {payments.length === 0 ? (
                            <tr><td colSpan="5" className="py-20 text-center font-bold text-ink-200 italic">No payments received yet. Your cash flow starts here.</td></tr>
                        ) : (
                            payments.map(p => (
                                <tr key={p.id} className="hover:bg-surface-50 transition-colors group cursor-pointer">
                                    <td className="p-6 text-xs font-bold text-ink-500">{new Date(p.date).toLocaleDateString()}</td>
                                    <td className="p-6 font-black text-primary-600">{p.voucherNumber}</td>
                                    <td className="p-6 font-bold text-ink-900">{p.Transactions[0]?.Ledger?.name || 'Customer'}</td>
                                    <td className="p-6 text-xs font-semibold text-ink-400 italic">{p.narration || 'Cash Payment'}</td>
                                    <td className="p-6 text-right font-black text-emerald-600">₹{p.Transactions.reduce((s,t) => s + parseFloat(t.credit || 0), 0).toLocaleString('en-IN')}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
               <div className="bg-emerald-500 text-white p-10 rounded-4xl shadow-glow overflow-hidden relative">
                   <div className="absolute -right-8 -bottom-8 opacity-20"><History size={160}/></div>
                   <div className="relative z-10">
                       <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">Total Collections (This Month)</p>
                       <h3 className="text-4xl font-black">₹{payments.reduce((s,p) => s + p.Transactions.reduce((st,t) => st + parseFloat(t.credit || 0), 0), 0).toLocaleString('en-IN')}</h3>
                   </div>
               </div>
               
               <div className="bg-white border border-gray-100 p-8 rounded-4xl shadow-sm flex flex-col justify-center">
                  <div className="flex justify-between items-center mb-4">
                    <p className="font-black text-ink-900">Collections Speed</p>
                    <span className="text-emerald-500 font-bold text-sm">+15% improvement</span>
                  </div>
                  <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full w-[80%]" />
                  </div>
                  <p className="text-xs text-ink-400 font-medium mt-4">80% of your invoices are settled within 10 days.</p>
               </div>
            </div>
        </div>
    );
};

export default PaymentsReceivedView;
