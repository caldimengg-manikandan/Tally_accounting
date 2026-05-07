const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Confirm", 
  cancelText = "Cancel", 
  type = "danger",
  showCancel = true
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch(type) {
      case 'danger': return <AlertTriangle size={24} className="text-rose-500" />;
      case 'warning': return <AlertTriangle size={24} className="text-amber-500" />;
      case 'success': return <Check size={24} className="text-emerald-500" />;
      default: return <Info size={24} className="text-blue-500" />;
    }
  };

  const getColors = () => {
    switch(type) {
      case 'danger': return 'bg-rose-50 text-rose-500';
      case 'warning': return 'bg-amber-50 text-amber-500';
      case 'success': return 'bg-emerald-50 text-emerald-500';
      default: return 'bg-blue-50 text-blue-500';
    }
  };

  const getButtonClass = () => {
    switch(type) {
      case 'danger': return 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20';
      case 'warning': return 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20';
      case 'success': return 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20';
      default: return 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/20';
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      ></div>

      {/* Modal Container */}
      <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl shadow-slate-900/40 animate-in zoom-in-95 fade-in duration-300 overflow-hidden border border-slate-100 p-2">
        <div className="bg-white rounded-[2rem] overflow-hidden">
            {/* Header */}
            <div className="px-8 pt-10 pb-6 flex items-center justify-between">
            <div className={`w-14 h-14 rounded-3xl flex items-center justify-center ${getColors()}`}>
                {getIcon()}
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                <X size={24} />
            </button>
            </div>

            {/* Content */}
            <div className="px-10 pb-10 text-center">
            <h3 className="text-[20px] font-bold text-slate-900 mb-3 tracking-tight uppercase">{title || 'Attention Required'}</h3>
            <p className="text-[14px] text-slate-500 leading-relaxed">
                {message || 'Are you sure you want to proceed with this action?'}
            </p>
            </div>

            {/* Footer */}
            <div className="px-8 py-8 bg-slate-50/50 flex items-center gap-4">
            {showCancel && (
                <button 
                onClick={onClose}
                className="flex-1 px-6 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[12px] font-bold hover:bg-slate-50 transition-all uppercase tracking-widest shadow-sm"
                >
                {cancelText}
                </button>
            )}
            <button 
                onClick={() => {
                    if (onConfirm) onConfirm();
                    onClose();
                }}
                className={`flex-1 px-6 py-4 text-white rounded-2xl text-[12px] font-bold transition-all shadow-xl uppercase tracking-widest ${getButtonClass()}`}
            >
                {confirmText}
            </button>
            </div>
        </div>
      </div>
    </div>
  );
};

import { AlertTriangle, Info, Check, X } from 'lucide-react';
export default ConfirmModal;
