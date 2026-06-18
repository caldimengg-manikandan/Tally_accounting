import React, { useState, useEffect } from 'react';
import useNotificationStore from '../../store/notificationStore';
import { Lock, Unlock, AlertTriangle, Calendar, Save } from 'lucide-react';
import api from '../../services/api';

const PeriodLockSettings = () => {
    const activeCompanyId = sessionStorage.getItem('companyId');
    const { addNotification } = useNotificationStore();
    
    const [lockDate, setLockDate] = useState('');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!activeCompanyId) return;
        fetchLock();
    }, [activeCompanyId]);

    const fetchLock = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/api/accounting/period-lock/${activeCompanyId}`);
            if (res.data.lock) {
                setLockDate(res.data.lock.lockDate);
                setReason(res.data.lock.reason || '');
            } else {
                setLockDate('');
                setReason('');
            }
        } catch (err) {
            addNotification('Failed to fetch period lock status', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!lockDate) {
            addNotification('Please select a lock date', 'warning');
            return;
        }
        setSaving(true);
        try {
            await api.post(`/api/accounting/period-lock/${activeCompanyId}`, {
                lockDate,
                reason
            });
            addNotification('Period locked successfully', 'success');
            fetchLock();
        } catch (err) {
            addNotification(err.response?.data?.error || 'Failed to update period lock', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-slate-500 animate-pulse font-bold uppercase tracking-widest text-[11px]">Loading Lock State...</div>;
    }

    const isLocked = !!lockDate;

    return (
        <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-xl max-w-2xl">
            <div className="flex items-start gap-5 border-b border-slate-100 pb-6 mb-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${isLocked ? 'bg-rose-600 shadow-rose-200' : 'bg-emerald-500 shadow-emerald-200'}`}>
                    {isLocked ? <Lock className="text-white" size={24} /> : <Unlock className="text-white" size={24} />}
                </div>
                <div>
                    <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">Period Locking</h2>
                    <p className="text-[13px] text-slate-500 leading-relaxed mt-1">
                        Prevent any creation, modification, or deletion of financial records (vouchers, invoices) dated on or before a specified date to ensure audit compliance.
                    </p>
                </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-4 mb-8">
                <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
                <div className="text-[13px] text-amber-800 leading-relaxed">
                    <strong>Warning:</strong> Locking a period is a critical action. Once locked, the accounting engine will block all back-dated transactions. This is usually done after filing taxes or closing a financial year.
                </div>
            </div>

            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Lock Books Up To (Inclusive)</label>
                    <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="date"
                            value={lockDate}
                            onChange={(e) => setLockDate(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-[14px] font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Reason for Locking</label>
                    <input 
                        type="text"
                        placeholder="e.g. FY2024 Closed, March Tax Filed..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[14px] font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all placeholder:text-slate-300"
                    />
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-xl font-bold text-[13px] uppercase tracking-widest shadow-xl shadow-slate-200 flex items-center gap-2 transition-all disabled:opacity-50"
                >
                    <Save size={16} />
                    {saving ? 'Saving...' : (isLocked ? 'Update Lock Date' : 'Lock Period')}
                </button>
            </div>
        </div>
    );
};

export default PeriodLockSettings;
