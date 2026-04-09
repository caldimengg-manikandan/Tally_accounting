import React, { useState, useEffect } from 'react';
import { 
  Plus, Receipt, RefreshCw, FileText, 
  ChevronDown, ArrowDownUp, Filter
} from 'lucide-react';
import { purchaseAPI } from '../../services/api';

const BillsView = ({ companyId }) => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;
    const fetchBills = async () => {
      try {
        setLoading(true);
        const res = await purchaseAPI.getBills(companyId);
        setBills(res.data || []);
      } catch (err) {
        console.error("Failed to fetch bills:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBills();
  }, [companyId]);

  if (loading) return (
    <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
      <RefreshCw size={24} className="animate-spin text-[#1e61f0] mb-4" />
      <p className="text-slate-500 text-[14px]">Loading Bills...</p>
    </div>
  );

  return (
    <div className="bg-white min-h-screen">
       <div className="flex items-center justify-between px-8 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
             <h1 className="text-[20px] font-bold text-slate-900">Bills</h1>
             <ChevronDown size={18} className="text-blue-600 mt-1" />
          </div>
          <div className="flex items-center gap-2">
             <button className="bg-[#1e61f0] hover:bg-[#1a54d1] text-white px-4 py-2 rounded-md font-medium flex items-center gap-1.5 transition-all shadow-sm">
                <Plus size={18} strokeWidth={2.5}/> New Bill
             </button>
          </div>
       </div>

       <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
             <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100/50">
                <p className="text-[11px] font-black text-blue-600 uppercase tracking-widest mb-1">Open Bills</p>
                <h3 className="text-2xl font-black text-slate-900">₹ 0.00</h3>
             </div>
             <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-100/50">
                <p className="text-[11px] font-black text-amber-600 uppercase tracking-widest mb-1">Overdue</p>
                <h3 className="text-2xl font-black text-slate-900">₹ 0.00</h3>
             </div>
             <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100/50">
                <p className="text-[11px] font-black text-emerald-600 uppercase tracking-widest mb-1">Paid (Last 30 Days)</p>
                <h3 className="text-2xl font-black text-slate-900">₹ 0.00</h3>
             </div>
          </div>

          <table className="w-full text-left">
             <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200">
                <tr>
                   <th className="px-6 py-4">Date</th>
                   <th className="px-6 py-4">Bill#</th>
                   <th className="px-6 py-4">Vendor Name</th>
                   <th className="px-6 py-4">Status</th>
                   <th className="px-6 py-4">Due Date</th>
                   <th className="px-6 py-4 text-right">Amount</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
                {bills.length > 0 ? (
                  bills.map(bill => (
                    <tr key={bill.id} className="hover:bg-slate-50 transition-colors cursor-pointer">
                       <td className="px-6 py-4 text-[14px] text-slate-600">{new Date(bill.date).toLocaleDateString()}</td>
                       <td className="px-6 py-4 text-[14px] font-medium text-blue-600">{bill.voucherNumber}</td>
                       <td className="px-6 py-4 text-[14px] text-slate-600">{bill.Ledger?.name || '-'}</td>
                       <td className="px-6 py-4 text-[14px]">
                          <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold uppercase">Pending</span>
                       </td>
                       <td className="px-6 py-4 text-[14px] text-slate-600">-</td>
                       <td className="px-6 py-4 text-right text-[14px] font-medium text-slate-900">₹ {parseFloat(bill.totalAmount || 0).toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                     <td colSpan="6" className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center justify-center gap-3">
                           <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                              <Receipt size={24} />
                           </div>
                           <p className="text-slate-500 text-[14px]">No bills found.</p>
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

export default BillsView;
