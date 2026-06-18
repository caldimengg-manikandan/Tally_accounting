import React, { useState, useRef, useEffect } from 'react';
import { Bell, Mail, CheckCheck, Trash2, X, CheckCircle2 } from 'lucide-react';
import useNotificationStore from '../store/notificationStore';

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const { activityLog, markRead, markAllRead, clearActivity } = useNotificationStore();

  const unreadCount = activityLog.filter((a) => !a.read).length;

  // Close panel when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const formatTime = (iso) => {
    try {
      const d = new Date(iso);
      const now = new Date();
      const diff = Math.floor((now - d) / 1000);
      if (diff < 60) return 'just now';
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    } catch { return ''; }
  };

  const getIcon = (type) => {
    if (type === 'email') return <Mail size={14} className="text-blue-500" />;
    return <CheckCircle2 size={14} className="text-emerald-500" />;
  };

  const getModuleColor = (module) => {
    const colors = {
      'Sales Order': 'bg-blue-50 text-blue-700',
      'Invoice': 'bg-violet-50 text-violet-700',
      'Quote': 'bg-amber-50 text-amber-700',
      'Purchase Order': 'bg-orange-50 text-orange-700',
      'default': 'bg-slate-50 text-slate-600',
    };
    return colors[module] || colors['default'];
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-100 transition-colors"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 top-10 w-[360px] bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-slate-100 z-[500] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div>
              <h3 className="text-[13px] font-bold text-slate-900">Notifications</h3>
              {unreadCount > 0 && (
                <p className="text-[11px] text-slate-400">{unreadCount} unread</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  title="Mark all as read"
                  className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <CheckCheck size={13} />
                  Mark all read
                </button>
              )}
              {activityLog.length > 0 && (
                <button
                  onClick={clearActivity}
                  title="Clear all"
                  className="p-1 text-slate-300 hover:text-rose-400 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 text-slate-300 hover:text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {/* Activity List */}
          <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-50">
            {activityLog.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Bell size={28} className="mb-3 opacity-30" />
                <p className="text-[12px] font-bold uppercase tracking-widest">No notifications yet</p>
              </div>
            ) : (
              activityLog.map((entry) => (
                <div
                  key={entry.id}
                  onClick={() => markRead(entry.id)}
                  className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors ${
                    entry.read ? 'bg-white hover:bg-slate-50/50' : 'bg-blue-50/40 hover:bg-blue-50/70'
                  }`}
                >
                  {/* Icon */}
                  <div className={`mt-0.5 w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    entry.read ? 'bg-slate-100' : 'bg-blue-100'
                  }`}>
                    {getIcon(entry.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${getModuleColor(entry.module)}`}>
                        {entry.module || 'System'}
                      </span>
                      {!entry.read && (
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0" />
                      )}
                    </div>
                    <p className="text-[12px] font-semibold text-slate-800 truncate leading-tight">
                      {entry.title}
                    </p>
                    {entry.detail && (
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">{entry.detail}</p>
                    )}
                    <p className="text-[10px] text-slate-400 mt-1">{formatTime(entry.timestamp)}</p>
                  </div>

                  {/* Read indicator */}
                  {entry.read && (
                    <CheckCheck size={12} className="text-slate-300 shrink-0 mt-1" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {activityLog.length > 0 && (
            <div className="px-4 py-2 border-t border-slate-100 text-center">
              <p className="text-[10px] text-slate-400">Click an item to mark as read</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
