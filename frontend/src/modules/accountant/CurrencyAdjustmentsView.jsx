import React, { useState } from 'react';
import { 
  Plus, X, Info, ChevronDown, 
  Calendar, DollarSign, ArrowLeftRight,
  TrendingUp, TrendingDown, Clock, Search
} from 'lucide-react';

const CURRENCIES = [
  { code: 'AED', name: 'UAE Dirham', rate: '22.714582' },
  { code: 'AUD', name: 'Australian Dollar', rate: '54.521140' },
  { code: 'BND', name: 'Brunei Dollar', rate: '61.234102' },
  { code: 'CAD', name: 'Canadian Dollar', rate: '61.452391' },
  { code: 'CNY', name: 'Yuan Renminbi', rate: '11.512341' },
  { code: 'EUR', name: 'Euro', rate: '89.412450' },
  { code: 'GBP', name: 'Pound Sterling', rate: '104.234120' },
  { code: 'JPY', name: 'Japanese Yen', rate: '0.551234' },
  { code: 'SAR', name: 'Saudi Riyal', rate: '22.213451' },
  { code: 'THB', name: 'Thai Baht', rate: '2.312451' },
  { code: 'USD', name: 'United States Dollar', rate: '83.314251' },
  { code: 'ZAR', name: 'South African Rand', rate: '4.412345' }
];

const CurrencyAdjustmentsView = () => {
  const [showModal, setShowModal] = useState(false);
  const [adjustments, setAdjustments] = useState([]);
  const [filter, setFilter] = useState('This Month');

  const [formData, setFormData] = useState({
    currency: 'AED- UAE Dirham',
    date: '2026-04-17',
    rate: '22.714582',
    notes: ''
  });

  const handleCurrencyChange = (val) => {
    const code = val.split('-')[0].trim();
    const curr = CURRENCIES.find(c => c.code === code);
    setFormData({
      ...formData,
      currency: val,
      rate: curr ? curr.rate : '1.000000'
    });
  };

  const handleContinue = () => {
    // Add to list and close modal
    const newAdj = {
      id: Date.now(),
      date: formData.date,
      currency: formData.currency.split('-')[0].trim(),
      rate: formData.rate,
      gainLoss: '0.00',
      notes: formData.notes
    };
    setAdjustments([newAdj, ...adjustments]);
    setShowModal(false);
  };

  return (
    <div className="flex-1 flex flex-col bg-white min-h-screen animate-fade-in">
      
      {/* Header */}
      <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-20">
         <div>
            <h1 className="text-[20px] font-bold text-slate-800 tracking-tight">Base Currency Adjustments</h1>
         </div>
         <div className="flex items-center gap-4">
            <button className="text-[12px] font-bold text-blue-600 flex items-center gap-1 hover:underline">
               <Info size={14} /> Find Accountants
            </button>
            <button 
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded font-bold text-[13px] hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all flex items-center gap-2"
            >
               <Plus size={16} strokeWidth={3} /> New
            </button>
         </div>
      </div>

      {/* Toolbar */}
      <div className="px-8 py-4 border-b border-slate-50 bg-[#fcfdfe] flex items-center">
         <div className="relative group">
            <button className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded text-[12px] font-bold text-slate-600 bg-white hover:bg-slate-50 transition-all">
               Filter By: <span className="text-slate-900">{filter}</span>
               <ChevronDown size={14} className="text-slate-400" />
            </button>
         </div>
      </div>

      {/* Table Content */}
      <div className="flex-1">
         <table className="w-full text-left border-collapse">
            <thead>
               <tr className="bg-slate-50/50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <th className="w-12 px-8 py-3">
                     <input type="checkbox" className="rounded border-slate-300" />
                  </th>
                  <th className="px-4 py-3">DATE</th>
                  <th className="px-4 py-3">CURRENCY</th>
                  <th className="px-4 py-3">EXCHANGE RATE</th>
                  <th className="px-4 py-3">GAIN OR LOSS</th>
                  <th className="px-4 py-3">NOTES</th>
               </tr>
            </thead>
            <tbody>
               {adjustments.map(adj => (
                  <tr key={adj.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                     <td className="px-8 py-4"><input type="checkbox" className="rounded border-slate-300" /></td>
                     <td className="px-4 py-4 text-[13px] font-medium text-slate-600">
                        {new Date(adj.date).toLocaleDateString('en-GB')}
                     </td>
                     <td className="px-4 py-4 text-[13px] font-bold text-slate-800">{adj.currency}</td>
                     <td className="px-4 py-4 text-[13px] font-medium text-slate-600">1 {adj.currency} = {adj.rate} INR</td>
                     <td className="px-4 py-4 text-[13px] font-bold text-emerald-600 tracking-tight">₹{adj.gainLoss}</td>
                     <td className="px-4 py-4 text-[13px] text-slate-400 italic max-w-xs truncate">{adj.notes || '—'}</td>
                  </tr>
               ))}
               
               {adjustments.length === 0 && (
                  <tr>
                     <td colSpan={6} className="py-32 text-center">
                        <div className="flex flex-col items-center gap-6 max-w-lg mx-auto">
                           <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                              <ArrowLeftRight size={40} strokeWidth={1} />
                           </div>
                           <p className="text-[14px] font-medium text-slate-400">
                              Record a Base Currency Adjustment to correct fluctuations in exchange rates
                           </p>
                           <button 
                             onClick={() => setShowModal(true)}
                             className="text-blue-600 font-bold hover:underline"
                           >
                             Record first adjustment
                           </button>
                        </div>
                     </td>
                  </tr>
               )}
            </tbody>
         </table>
      </div>

      {/* New Adjustment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm shadow-inner" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden animate-scale-up border border-white/20">
             
             <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                <h3 className="text-[16px] font-bold text-slate-800">Base Currency Adjustment</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={20} />
                </button>
             </div>

             <div className="p-10 space-y-8">
                {/* Currency */}
                <div className="space-y-2">
                   <label className="text-[13px] font-bold text-rose-500 underline decoration-dotted">Currency*</label>
                   <div className="relative">
                      <select 
                        value={formData.currency}
                        onChange={e => handleCurrencyChange(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded focus:border-blue-400 outline-none text-[13px] appearance-none bg-white pr-10 hover:border-slate-300 transition-colors"
                      >
                         {CURRENCIES.map(c => (
                            <option key={c.code} value={`${c.code}- ${c.name}`}>
                               {c.code}- {c.name}
                            </option>
                         ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
                   </div>
                </div>

                {/* Date */}
                <div className="space-y-2">
                   <label className="text-[13px] font-bold text-rose-500 underline decoration-dotted">Date of Adjustment*</label>
                   <div className="relative">
                      <input 
                        type="date"
                        value={formData.date}
                        onChange={e => setFormData({...formData, date: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-200 rounded focus:border-blue-400 outline-none text-[13px] hover:border-slate-300 transition-colors"
                      />
                      <Calendar size={14} className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
                   </div>
                </div>

                {/* Exchange Rate */}
                <div className="space-y-2">
                   <label className="text-[13px] font-bold text-rose-500 underline decoration-dotted">Exchange Rate*</label>
                   <div className="flex items-center overflow-hidden border border-slate-200 rounded hover:border-slate-300 focus-within:border-blue-400 transition-all">
                      <div className="bg-slate-50 px-3 py-2 text-[13px] text-slate-500 font-medium border-right border-slate-100 whitespace-nowrap">
                         1 {formData.currency.split('-')[0].trim()} =
                      </div>
                      <input 
                        type="text"
                        value={formData.rate}
                        onChange={e => setFormData({...formData, rate: e.target.value})}
                        className="flex-1 px-3 py-2 outline-none text-[13px] font-bold text-slate-800"
                        placeholder="25.281254"
                      />
                      <div className="bg-slate-50 px-3 py-2 text-[13px] text-slate-500 font-medium border-left border-slate-100">
                         INR
                      </div>
                   </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                   <label className="text-[13px] font-bold text-rose-500 underline decoration-dotted">Notes*</label>
                   <textarea 
                     rows="3"
                     value={formData.notes}
                     onChange={e => setFormData({...formData, notes: e.target.value})}
                     placeholder="Max. 500 characters"
                     className="w-full px-3 py-2 border border-slate-200 rounded focus:border-blue-400 outline-none text-[13px] resize-none hover:border-slate-300 transition-colors"
                   />
                </div>
             </div>

             <div className="px-10 py-8 bg-slate-50/50 border-t border-slate-100 flex gap-3">
                <button 
                  onClick={handleContinue}
                  className="px-6 py-2 bg-blue-500 text-white rounded font-bold text-[13px] hover:bg-blue-600 transition-all shadow-lg shadow-blue-100/50 font-sans"
                >
                  Continue
                </button>
                <button 
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 bg-white border border-slate-200 text-slate-600 rounded font-bold text-[13px] hover:bg-slate-50 transition-all font-sans"
                >
                  Cancel
                </button>
             </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CurrencyAdjustmentsView;
