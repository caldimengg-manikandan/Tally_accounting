import React, { useState, useEffect } from 'react';
import { X, ArrowUpRight, ArrowDownLeft, FileText, Calendar, Wallet } from 'lucide-react';
import { ledgerAPI } from '../../services/api';

const LedgerDetailPanel = ({ isOpen, onClose, ledger }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && ledger) {
      setLoading(true);
      ledgerAPI.getTransactions(ledger.id)
        .then(res => setTransactions(res.data))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, ledger]);

  if (!isOpen || !ledger) return null;

  // Running balance logic (starting from opening balance)
  let currentRunning = parseFloat(ledger.openingBalance || 0);
  const history = [...transactions].reverse().map(tx => {
    const debit = parseFloat(tx.debit || 0);
    const credit = parseFloat(tx.credit || 0);
    currentRunning += (debit - credit);
    return { ...tx, runningBalance: currentRunning };
  }).reverse();

  return (
    <>
      <div className="fixed inset-0 z-[600] bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-full max-w-2xl bg-white shadow-2xl z-[700] flex flex-col animate-slide-left">
        
        {/* Header */}
        <div className="p-8 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
          <div className="space-y-1">
             <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-[#0f172a] text-white">Ledger Overview</span>
                <span className="text-xs font-bold text-gray-400">ID: {ledger.id.slice(0,8)}</span>
             </div>
             <h2 className="text-2xl font-bold text-[#0f172a] tracking-tight">{ledger.name}</h2>
             <p className="text-sm font-bold text-gray-400">Part of {ledger.Group?.name} group</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-all text-gray-400 hover:text-black">
             <X size={24} />
          </button>
        </div>

        {/* Action Summary Cards */}
        <div className="p-8 grid grid-cols-3 gap-4">
           <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm">
              <span className="text-[10px] font-bold uppercase text-gray-400 tracking-widest block mb-1">Current Balance</span>
              <span className={`text-lg font-bold ${parseFloat(ledger.currentBalance) < 0 ? 'text-red-500' : 'text-[#0f172a]'}`}>
                 ₹{Math.abs(parseFloat(ledger.currentBalance)).toLocaleString('en-IN')}
                 <span className="text-[10px] ml-1 opacity-40 uppercase">{parseFloat(ledger.currentBalance) >= 0 ? 'Dr' : 'Cr'}</span>
              </span>
           </div>
           <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm">
              <span className="text-[10px] font-bold uppercase text-gray-400 tracking-widest block mb-1">Opening</span>
              <span className="text-lg font-bold text-gray-800">₹{parseFloat(ledger.openingBalance).toLocaleString('en-IN')}</span>
           </div>
           <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm">
              <span className="text-[10px] font-bold uppercase text-gray-400 tracking-widest block mb-1">Entries</span>
              <span className="text-lg font-bold text-gray-800">{transactions.length}</span>
           </div>
        </div>

        {/* Transactions List */}
        <div className="flex-1 overflow-y-auto px-8 pb-8">
           <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Transaction History</h3>
              <div className="h-[1px] flex-1 mx-4 bg-gray-100"></div>
           </div>

           {loading ? (
             <div className="py-20 flex flex-col items-center justify-center gap-4 text-gray-300">
                <div className="w-8 h-8 border-4 border-gray-100 border-t-[#0f172a] rounded-full animate-spin"></div>
                <span className="text-xs font-bold uppercase tracking-widest">Reconstructing Ledger...</span>
             </div>
           ) : history.length === 0 ? (
             <div className="py-20 text-center text-gray-400">
                <Wallet size={48} className="mx-auto mb-4 opacity-10" />
                <p className="text-sm font-bold">No transactions recorded yet.</p>
             </div>
           ) : (
             <div className="space-y-4">
                {history.map((tx, idx) => (
                   <div key={idx} className="group bg-white border border-gray-100 rounded-2xl p-4 hover:border-blue-200 hover:shadow-md transition-all">
                      <div className="flex justify-between items-start mb-2">
                         <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${parseFloat(tx.debit) > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                               {parseFloat(tx.debit) > 0 ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                            </div>
                            <div>
                               <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-[#0f172a]">{tx.Voucher?.voucherNumber}</span>
                                  <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded uppercase">{tx.Voucher?.voucherType}</span>
                               </div>
                               <span className="text-xs font-medium text-gray-400 flex items-center gap-1">
                                  <Calendar size={10} /> {new Date(tx.Voucher?.date).toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'})}
                               </span>
                            </div>
                         </div>
                         <div className="text-right">
                            <span className={`text-sm font-bold ${parseFloat(tx.debit) > 0 ? 'text-emerald-600' : 'text-blue-600'}`}>
                               {parseFloat(tx.debit) > 0 ? '+' : '-'} ₹{Math.max(parseFloat(tx.debit), parseFloat(tx.credit)).toLocaleString('en-IN')}
                            </span>
                            <div className="text-[10px] font-bold text-gray-300 mt-0.5">Balance: ₹{Math.abs(tx.runningBalance).toLocaleString('en-IN')}</div>
                         </div>
                      </div>
                      <p className="text-xs text-gray-500 font-medium pl-11">{tx.Voucher?.narration || 'No narration provided.'}</p>
                   </div>
                ))}
             </div>
           )}
        </div>

        {/* Footer Actions */}
        <div className="p-8 border-t border-gray-100 bg-gray-50/50 flex gap-4">
           <button onClick={onClose} className="flex-1 py-4 bg-white border border-gray-200 rounded-2xl text-xs font-bold uppercase tracking-widest text-gray-600 hover:bg-gray-100 transition-all">Close Panel</button>
           <button className="flex-1 py-4 bg-[#0f172a] text-white rounded-2xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-blue-900/10 hover:bg-blue-900 transition-all">Export Statement</button>
        </div>

      </div>
    </>
  );
};

export default LedgerDetailPanel;
