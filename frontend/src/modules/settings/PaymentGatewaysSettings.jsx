import React, { useState, useEffect } from 'react';
import { 
  CreditCard, Save, Loader2, Play, CheckCircle2, AlertTriangle, 
  ToggleLeft, ToggleRight, ShieldAlert, Key, Eye, EyeOff
} from 'lucide-react';
import { paymentAPI } from '../../services/api';
import useNotificationStore from '../../store/notificationStore';

const PaymentGatewaysSettings = ({ companyId }) => {
  const { addNotification } = useNotificationStore();
  const [gateways, setGateways] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null); // { success: boolean, message: string }
  const [showSecret, setShowSecret] = useState(false);

  const [formData, setFormData] = useState({
    provider: 'Razorpay',
    displayName: 'Razorpay Test Mode',
    keyId: '',
    keySecret: '',
    webhookSecret: '',
    isTestMode: true,
    isActive: false
  });

  useEffect(() => {
    if (companyId) fetchGateways();
  }, [companyId]);

  const fetchGateways = async () => {
    setLoading(true);
    try {
      const res = await paymentAPI.getGateways();
      setGateways(res.data || []);
      
      // If there's an existing gateway, populate form
      if (res.data && res.data.length > 0) {
        const gw = res.data[0];
        setFormData({
          provider: gw.provider,
          displayName: gw.displayName,
          keyId: gw.keyId,
          keySecret: gw.hasSecret ? '*************' : '',
          webhookSecret: gw.hasWebhookSecret ? '*************' : '',
          isTestMode: gw.isTestMode,
          isActive: gw.isActive
        });
      }
    } catch (err) {
      console.error(err);
      addNotification('Failed to load gateways configuration', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, val) => {
    setFormData(prev => ({ ...prev, [key]: val }));
  };

  const handleTestConnection = async () => {
    if (!formData.keyId || !formData.keySecret) {
      addNotification('Key ID and Key Secret are required to test connection', 'warning');
      return;
    }

    setTesting(true);
    setTestResult(null);
    try {
      const res = await paymentAPI.testConnection({
        provider: formData.provider,
        keyId: formData.keyId,
        keySecret: formData.keySecret === '*************' && gateways[0] ? '' : formData.keySecret
      });
      setTestResult(res.data);
      if (res.data.success) {
        addNotification('Connection test passed!', 'success');
      } else {
        addNotification('Connection test failed', 'error');
      }
    } catch (err) {
      setTestResult({ success: false, message: err.message || 'Failed to complete connection test.' });
      addNotification('Connection test failed', 'error');
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!formData.displayName.trim() || !formData.keyId.trim()) {
      addNotification('Display name and Key ID are required', 'warning');
      return;
    }
    
    // Prevent saving default masked string as the secret
    const payloadSecret = formData.keySecret === '*************' ? '' : formData.keySecret;
    const payloadWebhook = formData.webhookSecret === '*************' ? '' : formData.webhookSecret;

    if (!payloadSecret && (!gateways[0] || !gateways[0].hasSecret)) {
      addNotification('Key Secret is required for new configurations', 'warning');
      return;
    }

    setSaving(true);
    try {
      await paymentAPI.saveGateway({
        provider: formData.provider,
        displayName: formData.displayName,
        keyId: formData.keyId,
        keySecret: payloadSecret || undefined, // undefined prevents overwriting if empty
        webhookSecret: payloadWebhook || undefined,
        isTestMode: formData.isTestMode,
        isActive: formData.isActive
      });
      addNotification('Gateway configuration saved successfully', 'success');
      fetchGateways();
    } catch (err) {
      console.error(err);
      addNotification(err.response?.data?.error || 'Failed to save configuration', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-slate-400">
        <Loader2 size={32} className="animate-spin text-blue-600 mb-2" />
        <span className="text-xs font-bold uppercase tracking-widest">Loading Gateway Settings...</span>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto w-full box-border font-sans">
      <header className="mb-8 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-2.5">
          <CreditCard className="text-blue-600" size={24} />
          <h1 className="text-xl font-bold text-slate-800">Online Payment Gateways</h1>
        </div>
        <p className="text-[12px] text-slate-400 mt-1">Configure credentials for your payment gateways. CalTally routes customer checkouts via these providers.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Settings Form Column */}
        <div className="md:col-span-2 space-y-6 bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest border-b border-slate-50 pb-2">
            Configure Provider
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Gateway Provider</label>
              <select 
                value={formData.provider}
                onChange={e => handleChange('provider', e.target.value)}
                className="w-full h-10 border border-slate-200 rounded-lg px-3 text-[13px] text-slate-800 outline-none focus:border-blue-500 bg-white"
              >
                <option value="Razorpay">Razorpay</option>
                <option value="Cashfree" disabled>Cashfree (Coming Soon)</option>
                <option value="PayU" disabled>PayU (Coming Soon)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Display Name (Visible to Clients)</label>
              <input 
                type="text"
                value={formData.displayName}
                onChange={e => handleChange('displayName', e.target.value)}
                placeholder="e.g. Credit Card / UPI / NetBanking via Razorpay"
                className="w-full h-10 border border-slate-200 rounded-lg px-3 text-[13px] text-slate-800 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Key ID</label>
              <input 
                type="text"
                value={formData.keyId}
                onChange={e => handleChange('keyId', e.target.value)}
                placeholder="rzp_test_..."
                className="w-full h-10 border border-slate-200 rounded-lg px-3 text-[13px] text-slate-800 outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Key Secret</label>
              <div className="relative">
                <input 
                  type={showSecret ? "text" : "password"}
                  value={formData.keySecret}
                  onChange={e => handleChange('keySecret', e.target.value)}
                  placeholder="Enter key secret"
                  className="w-full h-10 border border-slate-200 rounded-lg pl-3 pr-10 text-[13px] text-slate-800 outline-none focus:border-blue-500 font-mono"
                />
                <button 
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Webhook Secret</label>
              <input 
                type="password"
                value={formData.webhookSecret}
                onChange={e => handleChange('webhookSecret', e.target.value)}
                placeholder="Enter webhook secret verification token"
                className="w-full h-10 border border-slate-200 rounded-lg px-3 text-[13px] text-slate-800 outline-none focus:border-blue-500 font-mono"
              />
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-2 gap-6 pt-2">
              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                <div>
                  <div className="text-[12px] font-bold text-slate-700">Test Mode</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Use gateway sandbox</div>
                </div>
                <button 
                  onClick={() => handleChange('isTestMode', !formData.isTestMode)}
                  className="text-blue-600 hover:scale-105 transition-transform"
                >
                  {formData.isTestMode ? <ToggleRight size={38} /> : <ToggleLeft size={38} className="text-slate-400" />}
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                <div>
                  <div className="text-[12px] font-bold text-slate-700">Active Status</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Route checkouts online</div>
                </div>
                <button 
                  onClick={() => handleChange('isActive', !formData.isActive)}
                  className="text-blue-600 hover:scale-105 transition-transform"
                >
                  {formData.isActive ? <ToggleRight size={38} /> : <ToggleLeft size={38} className="text-slate-400" />}
                </button>
              </div>
            </div>
          </div>

          {/* Test results banner */}
          {testResult && (
            <div className={`p-4 rounded-xl border flex items-start gap-3 mt-4 text-[13px]
              ${testResult.success 
                ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                : 'bg-rose-50 border-rose-100 text-rose-800'}`}>
              {testResult.success ? <CheckCircle2 size={18} className="text-emerald-500 mt-0.5 shrink-0" /> : <AlertTriangle size={18} className="text-rose-500 mt-0.5 shrink-0" />}
              <div>
                <p className="font-bold">{testResult.success ? 'Test Succeeded' : 'Test Failed'}</p>
                <p className="text-[12px] mt-0.5 leading-relaxed">{testResult.message}</p>
              </div>
            </div>
          )}

          {/* Save / Test Connection Actions */}
          <div className="flex justify-end gap-3 pt-5 border-t border-slate-100 mt-6">
            <button 
              onClick={handleTestConnection}
              disabled={testing || saving}
              className="px-5 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-[12px] font-bold uppercase tracking-wider flex items-center gap-1.5"
            >
              {testing ? <Loader2 size={14} className="animate-spin text-blue-600" /> : <Play size={14} />} Test Connection
            </button>
            <button 
              onClick={handleSave}
              disabled={saving || testing}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg text-[12px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-blue-500/20"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Gateway
            </button>
          </div>
        </div>

        {/* Info Sidebar Column */}
        <div className="space-y-6">
          <div className="bg-amber-50/50 border border-amber-200/50 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-amber-800 uppercase tracking-widest flex items-center gap-1.5">
              <ShieldAlert size={16} className="text-amber-600" /> Security Notice
            </h3>
            <p className="text-[12px] text-amber-900/80 leading-relaxed font-medium">
              We encrypt your credentials using AES-256-GCM. We never expose secrets to the browser or store card details within CalTally.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-1.5 font-sans">
              <Key size={16} className="text-blue-500" /> Webhook Setup
            </h3>
            <p className="text-[12px] text-slate-500 leading-relaxed">
              To trigger automatic invoice reconciliation, set your Razorpay Webhook endpoint to:
            </p>
            <div className="p-2.5 bg-slate-900 text-slate-100 rounded-lg text-[11px] font-mono select-all overflow-x-auto">
              {`${window.location.origin}/api/payment/webhook/razorpay`}
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Subscribe to event: <code>payment.captured</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentGatewaysSettings;
