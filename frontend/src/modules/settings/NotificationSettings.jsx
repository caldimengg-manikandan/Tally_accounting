import React, { useState, useEffect } from 'react';
import { Bell, Mail, MessageSquare, Save, Loader2 } from 'lucide-react';
import useNotificationStore from '../../store/notificationStore';
import { authAPI } from '../../services/api';

const NotificationSettings = () => {
  const { addNotification } = useNotificationStore();
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState({
    emailInvoices: true,
    emailReports: false,
    emailUsers: true,
    smsInvoices: false,
    smsCritical: true,
    appAlerts: true,
    appInventory: true
  });

  const toggleSetting = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authAPI.getNotificationPreferences()
      .then(res => {
        if (res.data) setSettings(res.data);
      })
      .catch(err => {
        console.error('Failed to fetch notification preferences', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await authAPI.saveNotificationPreferences(settings);
      addNotification('Notification preferences saved successfully!', 'success');
    } catch (err) {
      console.error('Failed to save notification preferences', err);
      addNotification('Failed to save notification preferences.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full box-border">
      <header className="mb-8 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-2.5">
          <Bell className="text-blue-600" size={24} />
          <h1 className="text-xl font-bold text-slate-800">Notification Settings</h1>
        </div>
        <p className="text-[12px] text-slate-400 mt-1">
          Configure how you receive transaction updates, critical system alerts, low-stock warnings, and report digests.
        </p>
      </header>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-8 animate-in fade-in duration-200 relative min-h-[300px]">
        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
            <Loader2 className="animate-spin text-blue-500" size={32} />
          </div>
        )}
        
        {/* Email Settings */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <Mail size={16} className="text-blue-500" /> Email Notifications
          </h3>
          <div className="divide-y divide-slate-100">
            <div className="flex items-center justify-between py-3">
              <div>
                <span className="text-[13px] font-bold text-slate-700 block">Customer Invoices</span>
                <span className="text-[10px] text-slate-400">Email client invoice copies upon finalizing vouchers</span>
              </div>
              <input
                type="checkbox"
                checked={settings.emailInvoices}
                onChange={() => toggleSetting('emailInvoices')}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
              />
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <span className="text-[13px] font-bold text-slate-700 block">Weekly Accounting Digests</span>
                <span className="text-[10px] text-slate-400">Get a weekly summary of sales, expenses, and gross margins</span>
              </div>
              <input
                type="checkbox"
                checked={settings.emailReports}
                onChange={() => toggleSetting('emailReports')}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
              />
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <span className="text-[13px] font-bold text-slate-700 block">User Access Activity</span>
                <span className="text-[10px] text-slate-400">Notify admin when new user accounts join or roles change</span>
              </div>
              <input
                type="checkbox"
                checked={settings.emailUsers}
                onChange={() => toggleSetting('emailUsers')}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* SMS Settings */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <MessageSquare size={16} className="text-blue-500" /> SMS & Mobile Alerts
          </h3>
          <div className="divide-y divide-slate-100">
            <div className="flex items-center justify-between py-3">
              <div>
                <span className="text-[13px] font-bold text-slate-700 block">Client Transaction OTPs</span>
                <span className="text-[10px] text-slate-400">Send OTPs to clients during billing checkpoints</span>
              </div>
              <input
                type="checkbox"
                checked={settings.smsInvoices}
                onChange={() => toggleSetting('smsInvoices')}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
              />
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <span className="text-[13px] font-bold text-slate-700 block">Critical System Lockout Alerts</span>
                <span className="text-[10px] text-slate-400">Alert admin instantly on failed logins or period lock overrides</span>
              </div>
              <input
                type="checkbox"
                checked={settings.smsCritical}
                onChange={() => toggleSetting('smsCritical')}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* In-App Settings */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <Bell size={16} className="text-blue-500" /> In-App Notification Banners
          </h3>
          <div className="divide-y divide-slate-100">
            <div className="flex items-center justify-between py-3">
              <div>
                <span className="text-[13px] font-bold text-slate-700 block">Desktop Notification Sounds</span>
                <span className="text-[10px] text-slate-400">Play alert sound on receiving payment notifications</span>
              </div>
              <input
                type="checkbox"
                checked={settings.appAlerts}
                onChange={() => toggleSetting('appAlerts')}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
              />
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <span className="text-[13px] font-bold text-slate-700 block">Low Inventory Stock Warnings</span>
                <span className="text-[10px] text-slate-400">Display warning banner when items fall below reorder thresholds</span>
              </div>
              <input
                type="checkbox"
                checked={settings.appInventory}
                onChange={() => toggleSetting('appInventory')}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded-lg flex items-center gap-1.5 shadow-sm"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Notifications
          </button>
        </div>

      </div>
    </div>
  );
};

export default NotificationSettings;
