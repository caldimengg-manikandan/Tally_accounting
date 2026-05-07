import React, { useState } from 'react';
import { X, Plus, Trash2, Info } from 'lucide-react';

const ConfigurePaymentTermsModal = ({ onClose, onSave, currentTerms = [] }) => {
  const [terms, setTerms] = useState([
    { name: 'Due end of next month', days: 'N/A', editable: false },
    { name: 'Due end of the month', days: 'N/A', editable: false },
    { name: 'Due on Receipt', days: '0', editable: true },
    { name: 'Net 15', days: '15', editable: true },
    { name: 'Net 30', days: '30', editable: true },
    { name: 'Net 45', days: '45', editable: true },
    { name: 'Net 60', days: '60', editable: true },
  ]);

  const handleDayChange = (index, value) => {
    const updatedTerms = [...terms];
    updatedTerms[index].days = value;
    setTerms(updatedTerms);
  };

  const handleNameChange = (index, value) => {
    const updatedTerms = [...terms];
    updatedTerms[index].name = value;
    setTerms(updatedTerms);
  };

  const addNewTerm = () => {
    setTerms([...terms, { name: 'New Term', days: '0', editable: true }]);
  };

  const removeTerm = (index) => {
    if (terms[index].editable) {
      setTerms(terms.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-300">
      <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-[480px] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-50 bg-white">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Info size={20} />
             </div>
             <div>
                <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">Configure Payment Terms</h2>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 italic">Customize your procurement schedules</p>
             </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
            <X size={18} strokeWidth={3} />
          </button>
        </div>

        <div className="flex-1 p-6 bg-slate-50/20 max-h-[400px] overflow-y-auto custom-scrollbar">
           <div className="bg-white rounded-[20px] border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full border-collapse">
                 <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100 text-left">
                       <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Term Name</th>
                       <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-right">Days</th>
                       <th className="w-10"></th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {terms.map((term, index) => (
                       <tr key={index} className="group hover:bg-slate-50/30 transition-colors">
                          <td className="px-5 py-2.5">
                             {term.editable ? (
                                <input 
                                  type="text"
                                  value={term.name}
                                  onChange={(e) => handleNameChange(index, e.target.value)}
                                  className="w-full bg-transparent text-[14px] font-bold text-slate-700 outline-none focus:text-indigo-600 transition-colors border-b border-transparent focus:border-indigo-100"
                                />
                             ) : (
                                <span className="text-[14px] font-bold text-slate-700">{term.name}</span>
                             )}
                          </td>
                          <td className="px-5 py-2.5 text-right">
                             {term.editable && term.days !== 'N/A' ? (
                                <input 
                                  type="text"
                                  value={term.days}
                                  onChange={(e) => handleDayChange(index, e.target.value)}
                                  className="w-16 bg-transparent text-[14px] font-bold text-slate-900 text-right outline-none focus:text-indigo-600 transition-colors border-b border-transparent focus:border-indigo-100"
                                />
                             ) : (
                                <span className="text-[14px] font-bold text-slate-400 italic uppercase tracking-widest">{term.days}</span>
                             )}
                          </td>
                          <td className="px-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                             {term.editable && (
                                <button 
                                  onClick={() => removeTerm(index)}
                                  className="text-slate-300 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-white active:scale-90"
                                >
                                   <Trash2 size={16} />
                                </button>
                             )}
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
           
           <button 
             onClick={addNewTerm}
             className="mt-4 flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-bold text-[11px] uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all hover:bg-indigo-50 active:scale-95"
           >
              <Plus size={14} strokeWidth={3} />
              Add New Term
           </button>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-50 bg-white flex items-center justify-end gap-3">
           <button 
             onClick={onClose}
             className="px-5 py-2.5 text-slate-400 hover:text-slate-900 text-[12px] font-bold tracking-widest uppercase transition-all"
           >
             Cancel
           </button>
           <button 
             onClick={() => onSave(terms)}
             className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[12px] font-bold rounded-xl shadow-xl shadow-indigo-600/20 active:scale-95 transition-all uppercase tracking-widest"
           >
             Save
           </button>
        </div>
      </div>
    </div>
  );
};

export default ConfigurePaymentTermsModal;
