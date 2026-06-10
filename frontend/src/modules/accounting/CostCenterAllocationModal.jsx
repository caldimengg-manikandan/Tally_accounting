import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Trash2, AlertCircle, CheckCircle2, ChevronDown } from 'lucide-react';

export default function CostCenterAllocationModal({
  isOpen,
  onClose,
  ledgerName,
  lineAmount,
  costCenters = [],
  initialAllocations = [],
  onSave
}) {
  const [allocations, setAllocations] = useState([]);
  const [error, setError] = useState('');

  // Initialize allocations on open
  useEffect(() => {
    if (isOpen) {
      setError('');
      if (initialAllocations && initialAllocations.length > 0) {
        // Map initial allocations, ensuring values are rounded properly
        setAllocations(
          initialAllocations.map(alloc => {
            const amt = parseFloat(alloc.amount) || 0;
            const pct = parseFloat(alloc.percentage) || (lineAmount > 0 ? (amt / lineAmount) * 100 : 0);
            return {
              _id: Math.random().toString(36).substr(2, 9),
              costCenterId: alloc.costCenterId || '',
              amount: amt.toFixed(2),
              percentage: pct.toFixed(2)
            };
          })
        );
      } else {
        // Start with one clean empty row or prefill with 100%
        setAllocations([
          {
            _id: Math.random().toString(36).substr(2, 9),
            costCenterId: '',
            amount: lineAmount.toFixed(2),
            percentage: '100.00'
          }
        ]);
      }
    }
  }, [isOpen, initialAllocations, lineAmount]);

  // Calculations
  const totalAllocated = useMemo(() => {
    return allocations.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  }, [allocations]);

  const remaining = useMemo(() => {
    return parseFloat((lineAmount - totalAllocated).toFixed(2));
  }, [lineAmount, totalAllocated]);

  const totalPercentage = useMemo(() => {
    return allocations.reduce((sum, item) => sum + (parseFloat(item.percentage) || 0), 0);
  }, [allocations]);

  const isCompleteAndBalanced = useMemo(() => {
    if (allocations.length === 0) return false;
    const hasEmptyCostCenter = allocations.some(a => !a.costCenterId);
    if (hasEmptyCostCenter) return false;
    
    // Check duplicates
    const ccIds = allocations.map(a => a.costCenterId);
    const hasDuplicates = new Set(ccIds).size !== ccIds.length;
    if (hasDuplicates) return false;

    // Check balances
    return Math.abs(remaining) < 0.01;
  }, [allocations, remaining]);

  if (!isOpen) return null;

  // Row operations
  const addRow = () => {
    setAllocations(prev => [
      ...prev,
      {
        _id: Math.random().toString(36).substr(2, 9),
        costCenterId: '',
        amount: remaining > 0 ? remaining.toFixed(2) : '0.00',
        percentage: remaining > 0 && lineAmount > 0 ? ((remaining / lineAmount) * 100).toFixed(2) : '0.00'
      }
    ]);
  };

  const removeRow = (id) => {
    setAllocations(prev => {
      const filtered = prev.filter(item => item._id !== id);
      if (filtered.length === 0) {
        return [{
          _id: Math.random().toString(36).substr(2, 9),
          costCenterId: '',
          amount: '0.00',
          percentage: '0.00'
        }];
      }
      return filtered;
    });
  };

  const updateRow = (id, field, value) => {
    setAllocations(prev =>
      prev.map(item => {
        if (item._id !== id) return item;

        const updated = { ...item, [field]: value };

        if (field === 'amount') {
          const amt = parseFloat(value) || 0;
          if (lineAmount > 0) {
            updated.percentage = ((amt / lineAmount) * 100).toFixed(2);
          } else {
            updated.percentage = '0.00';
          }
        } else if (field === 'percentage') {
          const pct = parseFloat(value) || 0;
          updated.amount = ((pct / 100) * lineAmount).toFixed(2);
        }

        return updated;
      })
    );
  };

  const autofillRemaining = (id) => {
    setAllocations(prev =>
      prev.map(item => {
        if (item._id !== id) return item;
        
        // Find other rows total
        const otherRowsTotal = prev
          .filter(x => x._id !== id)
          .reduce((sum, x) => sum + (parseFloat(x.amount) || 0), 0);
        
        const rem = Math.max(0, lineAmount - otherRowsTotal);
        return {
          ...item,
          amount: rem.toFixed(2),
          percentage: lineAmount > 0 ? ((rem / lineAmount) * 100).toFixed(2) : '0.00'
        };
      })
    );
  };

  const handleSave = () => {
    // Final validations
    const ccIds = allocations.map(a => a.costCenterId);
    if (ccIds.some(id => !id)) {
      setError('Please select a cost center for all allocation rows.');
      return;
    }

    if (new Set(ccIds).size !== ccIds.length) {
      setError('Duplicate cost centers selected. Please combine allocations or choose unique cost centers.');
      return;
    }

    if (Math.abs(remaining) >= 0.01) {
      setError(`Allocations are not balanced. Remaining unallocated: ₹${remaining.toFixed(2)}`);
      return;
    }

    onSave(
      allocations.map(a => ({
        costCenterId: a.costCenterId,
        amount: parseFloat(a.amount) || 0,
        percentage: parseFloat(a.percentage) || 0
      }))
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-6 backdrop-blur-md bg-slate-900/40 animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="px-8 pt-8 pb-5 flex justify-between items-center bg-slate-50 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-black text-slate-800 tracking-tight">Cost Center Split Allocations</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
              Ledger: <span className="text-blue-600 normal-case">{ledgerName || 'General Account'}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-900"
          >
            <X size={20} />
          </button>
        </div>

        {/* Info Strip */}
        <div className="bg-blue-50 border-b border-blue-100 px-8 py-3.5 flex justify-between items-center">
          <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Total Line Amount to Allocate:</span>
          <span className="text-lg font-black text-blue-900">₹ {lineAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>

        {/* Error Container */}
        {error && (
          <div className="mx-8 mt-4 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl flex items-center gap-3 animate-shake">
            <AlertCircle size={18} className="shrink-0" />
            <p className="text-xs font-bold">{error}</p>
          </div>
        )}

        {/* Allocation grid */}
        <div className="p-8 overflow-y-auto flex-1 space-y-4">
          <div className="grid grid-cols-12 gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
            <div className="col-span-6">Cost Center *</div>
            <div className="col-span-3 text-right">Percentage (%)</div>
            <div className="col-span-3 text-right">Allocated Amount (₹)</div>
          </div>

          <div className="space-y-3">
            {allocations.map((row, idx) => (
              <div
                key={row._id}
                className="grid grid-cols-12 gap-3 items-center p-3 rounded-2xl border border-slate-100 hover:border-blue-100 hover:bg-slate-50/30 transition-all"
              >
                {/* Cost center select */}
                <div className="col-span-6 relative">
                  <select
                    value={row.costCenterId}
                    onChange={e => {
                      setError('');
                      updateRow(row._id, 'costCenterId', e.target.value);
                    }}
                    className={`w-full px-4 py-2.5 border rounded-xl text-xs font-bold outline-none appearance-none bg-white transition-all
                      ${row.costCenterId ? 'border-slate-200 focus:border-blue-400 text-slate-800' : 'border-rose-200 text-slate-400 bg-rose-50/10'}`}
                  >
                    <option value="">Select Cost Center...</option>
                    {costCenters
                      .filter(cc => cc.status === 'Active' || cc.status === undefined)
                      .map(cc => (
                        <option key={cc.id} value={cc.id}>
                          {cc.name} {cc.category ? `(${cc.category})` : ''}
                        </option>
                      ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" />
                </div>

                {/* Percentage */}
                <div className="col-span-3 relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="0.00"
                    value={row.percentage}
                    onChange={e => {
                      setError('');
                      updateRow(row._id, 'percentage', e.target.value);
                    }}
                    className="w-full pl-3 pr-7 py-2.5 border border-slate-200 rounded-xl text-right text-xs font-bold text-slate-700 outline-none focus:border-blue-400"
                  />
                  <span className="absolute right-3 top-3 text-[10px] font-bold text-slate-400 select-none">%</span>
                </div>

                {/* Amount */}
                <div className="col-span-3 flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-3 text-[10px] font-bold text-slate-400 select-none">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={row.amount}
                      onChange={e => {
                        setError('');
                        updateRow(row._id, 'amount', e.target.value);
                      }}
                      className="w-full pl-6 pr-3 py-2.5 border border-slate-200 rounded-xl text-right text-xs font-bold text-slate-700 outline-none focus:border-blue-400"
                    />
                  </div>
                  
                  {/* Action actions */}
                  <button
                    type="button"
                    onClick={() => removeRow(row._id)}
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    title="Remove Allocation"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addRow}
            className="w-full mt-2 py-3 border border-dashed border-blue-200 rounded-2xl text-xs font-bold text-blue-600 hover:bg-blue-50/50 flex items-center justify-center gap-2 transition-all"
          >
            <Plus size={14} /> Add Cost Center Allocation Split
          </button>
        </div>

        {/* Integrity Check Footer Panel */}
        <div className="bg-slate-50 border-t border-slate-100 p-6 flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200/60 rounded-2xl p-3 text-center">
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Total Allocated</div>
              <div className="text-sm font-black text-slate-800">
                ₹ {totalAllocated.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="bg-white border border-slate-200/60 rounded-2xl p-3 text-center">
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Total Percentage</div>
              <div className="text-sm font-black text-slate-800">
                {totalPercentage.toFixed(2)} %
              </div>
            </div>
            <div className={`border rounded-2xl p-3 text-center transition-all ${
              Math.abs(remaining) < 0.01 
                ? 'bg-emerald-50/30 border-emerald-200 text-emerald-800' 
                : remaining > 0 
                  ? 'bg-amber-50/30 border-amber-200 text-amber-800' 
                  : 'bg-rose-50/30 border-rose-200 text-rose-800'
            }`}>
              <div className="text-[9px] font-black uppercase tracking-wider mb-1">Unallocated Remaining</div>
              <div className="text-sm font-black flex items-center justify-center gap-1.5">
                {Math.abs(remaining) < 0.01 ? (
                  <><CheckCircle2 size={13} className="text-emerald-600" /> ₹ 0.00</>
                ) : (
                  <>₹ {remaining.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center gap-4 pt-2">
            <div className="flex-1">
              {Math.abs(remaining) >= 0.01 && (
                <p className="text-[11px] text-amber-600 font-bold flex items-center gap-1.5">
                  <AlertCircle size={13} />
                  Allocation total must sum to line amount. Remaining: ₹{remaining.toFixed(2)}
                </p>
              )}
              {Math.abs(remaining) < 0.01 && isCompleteAndBalanced && (
                <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1.5">
                  <CheckCircle2 size={13} />
                  Split verification successful. Ready to save allocations.
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 text-slate-500 hover:text-slate-800 text-[11px] font-bold tracking-widest uppercase hover:bg-slate-100 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!isCompleteAndBalanced}
                className={`px-8 py-2.5 rounded-xl text-[11px] font-bold tracking-widest uppercase shadow-md transition-all ${
                  isCompleteAndBalanced
                    ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-blue-500/10'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                }`}
              >
                Save Allocations
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
