import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Filter, MoreHorizontal, 
  ChevronRight, Wallet, ArrowUpRight, Clock,
  CheckCircle2, Download, Printer, Mail
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { paymentMadeAPI } from '../../services/api';

const PaymentsMadeListView = ({ companyId }) => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (companyId) {
      fetchPayments();
    }
  }, [companyId]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await paymentMadeAPI.getPayments(companyId);
      setPayments(res.data || []);
    } catch (err) {
      console.error("Failed to fetch payments:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter(p => 
    p.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.paymentNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.reference?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-screen bg-white animate-in fade-in duration-500">
      {/* HEADER */}
      <header className="px-8 py-6 flex items-center justify-between border-b border-slate-50 sticky top-0 bg-white/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Wallet size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-[18px] font-black text-slate-900 tracking-tight">Payments Made</h1>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Track and manage vendor settlements</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={16} />
            <input 
              type="text"
              placeholder="Search payments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 h-10 w-64 bg-slate-50 border-none rounded-xl text-[13px] font-medium outline-none focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>
          <button className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-all">
             <Filter size={18} />
          </button>
          <button 
            onClick={() => navigate('/payments-made/new')}
            className="flex items-center gap-2 px-5 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/20 transition-all"
          >
            <Plus size={18} strokeWidth={3} />
            <span className="text-[13px] font-black uppercase tracking-wider">New Payment</span>
          </button>
        </div>
      </header>

      {/* STATS STRIP */}
      <div className="px-8 py-4 bg-slate-50/50 flex items-center gap-8 border-b border-slate-50">
         <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Total Settled:</span>
            <span className="text-[13px] font-black text-slate-900">₹{payments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}</span>
         </div>
         <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Payments Count:</span>
            <span className="text-[13px] font-black text-slate-900">{payments.length}</span>
         </div>
      </div>

      {/* TABLE */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="sticky top-0 bg-white/90 backdrop-blur-md z-10 border-b border-slate-100 px-8">
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] w-12 text-center">
                <input type="checkbox" className="rounded-md border-slate-300 text-blue-600" />
              </th>
              <th className="px-5 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Date</th>
              <th className="px-5 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Payment#</th>
              <th className="px-5 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Vendor Name</th>
              <th className="px-5 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Reference</th>
              <th className="px-5 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Amount</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center w-20">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array(5).fill(0).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan="7" className="px-8 py-6 border-b border-slate-50">
                    <div className="h-6 bg-slate-50 rounded-lg w-full"></div>
                  </td>
                </tr>
              ))
            ) : filteredPayments.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-8 py-32 text-center">
                   <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                         <Wallet size={32} />
                      </div>
                      <div>
                         <p className="text-[14px] font-bold text-slate-900">No payments found</p>
                         <p className="text-[12px] text-slate-400">Record a new payment to get started</p>
                      </div>
                      <button 
                        onClick={() => navigate('/payments-made/new')}
                        className="mt-2 text-[12px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700"
                      >
                        + Create Your First Payment
                      </button>
                   </div>
                </td>
              </tr>
            ) : (
              filteredPayments.map((p) => (
                <tr key={p.id} className="group hover:bg-slate-50/50 transition-all border-b border-slate-50">
                  <td className="px-8 py-5 text-center">
                    <input type="checkbox" className="rounded-md border-slate-200" />
                  </td>
                  <td className="px-5 py-5">
                    <div className="text-[13px] font-bold text-slate-900">{new Date(p.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Confirmed</div>
                  </td>
                  <td className="px-5 py-5 text-[13px] font-black text-blue-600 tracking-tight">{p.paymentNumber}</td>
                  <td className="px-5 py-5">
                    <div className="text-[13px] font-bold text-slate-900">{p.vendorName}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Vendor</div>
                  </td>
                  <td className="px-5 py-5 text-[13px] text-slate-500 font-medium italic">
                    {p.reference || p.narration?.substring(0, 30) || '--'}
                  </td>
                  <td className="px-5 py-5 text-right">
                    <div className="text-[14px] font-black text-slate-900">₹{p.amount.toLocaleString()}</div>
                    <div className="flex items-center justify-end gap-1 text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1">
                       <CheckCircle2 size={10} />
                       Settled
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                       <button className="p-2 rounded-lg hover:bg-white hover:shadow-sm text-slate-400 hover:text-blue-600 transition-all">
                          <Download size={16} />
                       </button>
                       <button className="p-2 rounded-lg hover:bg-white hover:shadow-sm text-slate-400 hover:text-slate-900 transition-all">
                          <MoreHorizontal size={16} />
                       </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PaymentsMadeListView;
