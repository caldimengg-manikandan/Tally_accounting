import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react';
import useNotificationStore from '../store/notificationStore';

const Notification = () => {
  const { notifications, removeNotification } = useNotificationStore();

  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {notifications.map((n) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className="pointer-events-auto"
          >
            <div className={`
              min-w-[320px] max-w-[450px] bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] 
              border border-slate-100 p-4 relative overflow-hidden flex items-start gap-4
            `}>
              {/* Type Indicator Bar */}
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                n.type === 'success' ? 'bg-emerald-500' : 
                n.type === 'error' ? 'bg-rose-500' : 'bg-blue-500'
              }`} />

              {/* Icon Container */}
              <div className={`shrink-0 p-2 rounded-xl ${
                n.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 
                n.type === 'error' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'
              }`}>
                {n.type === 'success' && <CheckCircle2 size={20} />}
                {n.type === 'error' && <AlertCircle size={20} />}
                {n.type === 'info' && <Info size={20} />}
              </div>

              {/* Content */}
              <div className="flex-1 pt-0.5">
                <h4 className="text-[14px] font-black text-slate-800 uppercase tracking-tight">
                  {n.type === 'success' ? 'Action Successful' : 
                   n.type === 'error' ? 'Something went wrong' : 'System Message'}
                </h4>
                <p className="text-[13px] text-slate-500 font-medium mt-0.5 leading-relaxed">
                  {n.message}
                </p>
              </div>

              {/* Close Button */}
              <button 
                onClick={() => removeNotification(n.id)}
                className="shrink-0 p-1 text-slate-300 hover:text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default Notification;
