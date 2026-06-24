import React, { useState, useEffect } from 'react';
import { X, Save, FileText, Calendar, Box } from 'lucide-react';
import { inventoryAPI } from '../services/api';
import useNotificationStore from '../store/notificationStore';

export default function AdjustStockModal({ isOpen, onClose, item, onSuccess }) {
  const [newQuantity, setNewQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    if (isOpen && item) {
      setNewQuantity(item.currentStock || 0);
      setReason('');
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newQuantity === '' || isNaN(newQuantity)) {
      addNotification('Please enter a valid quantity.', 'error');
      return;
    }
    
    if (parseFloat(newQuantity) === parseFloat(item.currentStock)) {
      addNotification('New quantity is the same as current stock.', 'warning');
      return;
    }

    setLoading(true);
    try {
      await inventoryAPI.adjustStock(item.id, {
        newQuantity: parseFloat(newQuantity),
        reason: reason || 'Physical Stock Count',
        date: date
      });
      addNotification('Stock adjusted successfully.', 'success');
      onSuccess();
      onClose();
    } catch (err) {
      addNotification(err.response?.data?.error || 'Failed to adjust stock', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-md rounded-2xl shadow-xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-[16px] font-bold text-slate-800">Adjust Stock</h2>
          <button onClick={onClose} className="text-slate-400 hover:bg-slate-100 p-2 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
             <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Item Name</p>
                <p className="text-[14px] font-bold text-slate-800">{item.name}</p>
             </div>
             <div className="text-right">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Current Stock</p>
                <p className="text-[16px] font-mono font-bold text-[#1e61f0]">{item.currentStock}</p>
             </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-[12px] font-bold text-slate-700 mb-2">
                 <Box size={14} className="text-slate-400"/> New Physical Quantity
              </label>
              <input 
                type="number" 
                value={newQuantity}
                onChange={e => setNewQuantity(e.target.value)}
                className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-[14px] font-bold outline-none focus:border-blue-500 transition-colors"
                required
              />
            </div>
            
            <div>
              <label className="flex items-center gap-2 text-[12px] font-bold text-slate-700 mb-2">
                 <Calendar size={14} className="text-slate-400"/> Adjustment Date
              </label>
              <input 
                type="date" 
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-[13px] font-medium text-slate-700 outline-none focus:border-blue-500 transition-colors"
                required
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-[12px] font-bold text-slate-700 mb-2">
                 <FileText size={14} className="text-slate-400"/> Reason
              </label>
              <input 
                type="text" 
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="e.g., Damage, Miscount, Expiry"
                className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-[13px] font-medium text-slate-700 outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 mt-6 border-t border-slate-100">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-[13px] font-bold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl text-[13px] font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? 'Saving...' : <><Save size={16}/> Save Adjustment</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
