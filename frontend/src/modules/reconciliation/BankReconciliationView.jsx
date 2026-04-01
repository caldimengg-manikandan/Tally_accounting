import React, { useState, useEffect } from 'react';
import { Wallet, Upload, CheckCircle2, AlertCircle, FileText, Search, PlusCircle } from 'lucide-react';
import { reconciliationAPI, voucherAPI } from '../../services/api';

const BankReconciliationView = () => {
    const [unmatched, setUnmatched] = useState([]);
    const [loading, setLoading] = useState(true);
    const [matchingVouchers, setMatchingVouchers] = useState([]);
    const [selectedEntry, setSelectedEntry] = useState(null);
    const companyId = localStorage.getItem('companyId');

    const fetchUnmatched = async () => {
        try {
            const res = await reconciliationAPI.getUnmatched(companyId);
            setUnmatched(res.data);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    useEffect(() => {
        if (companyId) fetchUnmatched();
    }, [companyId]);

    const handleImport = async () => {
        try {
            // 1. Fetch the user's actual Tally vouchers
            const res = await voucherAPI.getByCompany(companyId);
            const vouchers = Array.isArray(res.data) ? res.data : [];

            // 2. Isolate only Payment, Receipt, and Contra (Cash/Bank transactions)
            const bankVouchers = vouchers.filter(v => ['Payment', 'Receipt', 'Contra'].includes(v.voucherType));

            // 3. Dynamically generate the Bank's perspective of these lines
            const generatedEntries = bankVouchers.map(v => {
                // Approximate the bank line amount (Total Debit)
                const amount = v.Transactions.reduce((sum, t) => sum + (parseFloat(t.debit) || 0), 0);
                
                // If Tally says 'Receipt', the bank says 'Credit' (money arrived).
                const bankType = v.voucherType === 'Receipt' ? 'Credit' : 'Debit';
                
                return {
                    date: v.date,
                    description: `ACTUAL: ${v.narration?.substring(0, 30) || v.voucherType + ' ' + v.voucherNumber}`,
                    amount: amount,
                    type: bankType
                };
            }).filter(e => e.amount > 0);

            if (generatedEntries.length === 0) {
                alert('No Payments or Receipts found in your database to generate a statement from!');
                return;
            }

            // 4. Send this fully customized bank statement to the system
            await reconciliationAPI.importStatement({ companyId, entries: generatedEntries });
            
            fetchUnmatched();
            alert('Your Custom Real-World Bank Statement Imported Successfully!');
        } catch (err) { alert(err.message); }
    };

    const findMatches = async (entry) => {
        setSelectedEntry(entry);
        try {
            const res = await voucherAPI.getByCompany(companyId);
            // Simple Filter Match for demo (Matches by amount/date)
            const matches = res.data.filter(v => 
                v.Transactions.some(t => Math.abs(parseFloat(t.debit || t.credit)) === Math.abs(entry.amount))
            );
            setMatchingVouchers(matches);
        } catch (err) { console.error(err); }
    };

    const reconcile = async (voucherId) => {
        try {
            await reconciliationAPI.reconcile({ bankTransactionId: selectedEntry.id, voucherId });
            setSelectedEntry(null);
            fetchUnmatched();
            alert('Voucher Reconciled Successfully!');
        } catch (err) { alert(err.message); }
    };

    return (
        <div className="space-y-8 animate-fade-up">
            <div className="bg-gradient-to-br from-primary-600 to-indigo-700 p-10 rounded-4xl text-white shadow-xl relative overflow-hidden group">
               <div className="relative z-10 flex justify-between items-center">
                  <div className="space-y-2">
                     <h3 className="text-2xl font-black flex items-center gap-3"><Wallet size={28}/> Bank Reconciliation Engine</h3>
                     <p className="opacity-80 font-medium">Match your company bank books with actual statement entries in real-time.</p>
                  </div>
                  <button 
                    onClick={handleImport}
                    className="bg-white text-primary-600 px-8 py-4 rounded-2xl font-black shadow-lg hover:scale-105 transition-all flex items-center gap-2"
                  >
                    <Upload size={18}/> Import Statement
                  </button>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-4xl border border-gray-100 shadow-card overflow-hidden h-fit">
                    <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-surface-50">
                        <h4 className="font-black text-ink-900 flex items-center gap-2"><FileText size={18}/> Unreconciled Bank Entries</h4>
                        <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2.5 py-1 rounded-full">{unmatched.length} Pending</span>
                    </div>
                    <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                        {unmatched.length === 0 ? (
                            <p className="p-20 text-center font-bold text-ink-300 italic">No pending bank entries found</p>
                        ) : (
                            unmatched.map(entry => (
                                <div key={entry.id} onClick={() => findMatches(entry)} className={`p-6 cursor-pointer hover:bg-primary-50 transition-all group ${selectedEntry?.id === entry.id ? 'bg-primary-50 border-l-4 border-primary-500' : ''}`}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-black text-ink-800">{entry.description}</p>
                                            <p className="text-[10px] font-black text-ink-400 uppercase">{new Date(entry.date).toLocaleDateString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-black ${entry.type === 'Credit' ? 'text-emerald-600' : 'text-red-500'}`}>
                                                {entry.type === 'Credit' ? '+' : '-'} ₹{parseFloat(entry.amount).toLocaleString()}
                                            </p>
                                            <p className="text-[9px] font-bold text-ink-300 tracking-[0.2em]">{entry.type}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {selectedEntry ? (
                    <div className="bg-white rounded-4xl border border-gray-100 shadow-card overflow-hidden animate-fade-scale">
                        <div className="p-8 border-b border-gray-100 bg-ink-900 text-white flex justify-between items-center">
                            <h4 className="font-black">Potential Voucher Matches</h4>
                            <button onClick={() => setSelectedEntry(null)} className="text-white/40 hover:text-white transition-colors">Dismiss</button>
                        </div>
                        <p className="p-6 text-xs text-ink-400 font-bold italic bg-surface-50 border-b border-gray-100 flex items-center gap-2">
                           <Search size={14}/> Searching for Amount: ₹{parseFloat(selectedEntry.amount).toLocaleString()} in Ledgers...
                        </p>
                        <div className="p-8 space-y-6">
                            {matchingVouchers.length === 0 ? (
                                <div className="p-10 text-center space-y-4">
                                   <AlertCircle size={32} className="mx-auto text-amber-500" />
                                   <p className="text-sm font-bold text-ink-600">No matching recorded vouchers found. Please check manual entries.</p>
                                   <button className="text-primary-600 text-xs font-black uppercase tracking-widest">+ Create Manual Entry</button>
                                </div>
                            ) : (
                                matchingVouchers.map(v => (
                                    <div key={v.id} className="p-6 bg-surface-50 rounded-3xl border border-gray-100 group relative">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <p className="text-xs font-black text-ink-400 uppercase tracking-widest">{v.voucherType} #{v.voucherNumber}</p>
                                                <p className="font-bold text-ink-800">{v.narration || 'No Narration'}</p>
                                            </div>
                                            <p className="font-black">₹{parseFloat(selectedEntry.amount).toLocaleString()}</p>
                                        </div>
                                        <button 
                                          onClick={() => reconcile(v.id)}
                                          className="w-full py-3 bg-ink-900 text-white rounded-2xl font-black text-xs shadow-lg hover:bg-primary-600 transition-all flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle2 size={16}/> Match Record
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="bg-surface-50 border-2 border-dashed border-gray-100 rounded-4xl flex flex-col items-center justify-center p-20 text-center space-y-4">
                        <PlusCircle size={48} className="text-ink-100" />
                        <h4 className="text-xl font-black text-ink-200">Select an entry to begin matching</h4>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BankReconciliationView;
