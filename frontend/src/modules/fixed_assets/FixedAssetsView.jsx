import React, { useState, useEffect } from 'react';
import { 
  Building2, Plus, ArrowUpRight, DollarSign, Calendar, TrendingDown, 
  Trash2, RefreshCw, AlertCircle, FileText, ChevronRight, CheckCircle2, Landmark 
} from 'lucide-react';
import { fixedAssetsAPI, ledgerAPI } from '../../services/api';

const fmt = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

export default function FixedAssetsView() {
  const companyId = localStorage.getItem('companyId');
  const [assets, setAssets] = useState([]);
  const [ledgers, setLedgers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Views: 'list', 'create', 'depreciate', 'dispose'
  const [activeView, setActiveView] = useState('list');
  const [selectedAsset, setSelectedAsset] = useState(null);
  
  // Create Asset Form State
  const [assetForm, setAssetForm] = useState({
    name: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    purchaseValue: '',
    depreciationMethod: 'WDV',
    usefulLife: '10',
    scrapValue: '0',
    assetLedgerId: '',
    depreciationLedgerId: ''
  });

  // Action Form States
  const [depDate, setDepDate] = useState(new Date().toISOString().split('T')[0]);
  const [disposeForm, setDisposeForm] = useState({
    disposalDate: new Date().toISOString().split('T')[0],
    disposalValue: '',
    bankLedgerId: ''
  });

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [resAssets, resLedgers] = await Promise.all([
        fixedAssetsAPI.getByCompany(companyId),
        ledgerAPI.getByCompany(companyId)
      ]);
      setAssets(resAssets.data || []);
      setLedgers(resLedgers.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch fixed assets registry. Ensure postgres models are synced.');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (companyId) {
      fetchData();
    }
  }, [companyId]);

  const handleCreateAsset = async (e) => {
    e.preventDefault();
    if (!assetForm.name.trim() || !assetForm.purchaseValue) return alert('Name and Purchase Value are required');
    try {
      setLoading(true);
      await fixedAssetsAPI.create({
        ...assetForm,
        purchaseValue: parseFloat(assetForm.purchaseValue),
        usefulLife: parseInt(assetForm.usefulLife),
        scrapValue: parseFloat(assetForm.scrapValue),
        companyId
      });
      alert('Asset acquired and logged successfully. Standard GL ledgers auto-resolved.');
      setActiveView('list');
      fetchData();
      // Reset form
      setAssetForm({
        name: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        purchaseValue: '',
        depreciationMethod: 'WDV',
        usefulLife: '10',
        scrapValue: '0',
        assetLedgerId: '',
        depreciationLedgerId: ''
      });
    } catch (err) {
      console.error(err);
      alert('Failed to log asset acquisition.');
    } finally {
      setLoading(false);
    }
  };

  const handleRunDepreciation = async (e) => {
    e.preventDefault();
    if (!selectedAsset) return;
    try {
      setLoading(true);
      await fixedAssetsAPI.depreciate(selectedAsset.id, { date: depDate });
      alert('Depreciation posted successfully! Double-entry Journal Voucher logged in Daybook.');
      setActiveView('list');
      fetchData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Depreciation posting failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisposeAsset = async (e) => {
    e.preventDefault();
    if (!selectedAsset) return;
    if (!disposeForm.bankLedgerId || !disposeForm.disposalValue) {
      return alert('Bank ledger and sale value are required');
    }
    try {
      setLoading(true);
      await fixedAssetsAPI.dispose(selectedAsset.id, {
        disposalDate: disposeForm.disposalDate,
        disposalValue: parseFloat(disposeForm.disposalValue),
        bankLedgerId: disposeForm.bankLedgerId
      });
      alert('Asset disposal posted successfully! Realized capital gain/loss recognized in ledger entries.');
      setActiveView('list');
      fetchData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Asset disposal failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAsset = async (id) => {
    if (!window.confirm('Are you sure you want to remove this asset?')) return;
    try {
      await fixedAssetsAPI.delete(id);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to delete asset');
    }
  };

  const totalAcquisition = assets.reduce((s, a) => s + parseFloat(a.purchaseValue || 0), 0);
  const totalBookValue = assets.reduce((s, a) => s + parseFloat(a.currentBookValue || 0), 0);
  const totalDepreciation = assets.reduce((s, a) => s + parseFloat(a.accumulatedDepreciation || 0), 0);

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8 animate-fade-in">
      {/* HEADER */}
      <div className="flex justify-between items-end border-b border-slate-100 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg">
              <Building2 size={20} />
            </div>
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-[0.2em]">Asset Registers</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Fixed Assets Register</h1>
          <p className="text-slate-400 text-xs mt-1 font-medium">Track capital acquisitions, depreciation schedules, and asset disposals</p>
        </div>
        
        {activeView === 'list' && (
          <button 
            onClick={() => setActiveView('create')}
            className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-slate-900/10 flex items-center gap-1.5 transition-all"
          >
            <Plus size={16} /> Acquire Fixed Asset
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex gap-3 text-red-600 font-semibold">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      ) : (
        <>
          {activeView === 'list' && (
            <div className="space-y-8">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-7 rounded-[2rem] bg-white border border-slate-100 shadow-lg relative overflow-hidden flex flex-col justify-between h-40">
                  <div className="absolute right-4 top-4 text-slate-100"><DollarSign size={48} /></div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Asset Acquisitions</p>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{fmt(totalAcquisition)}</h3>
                  <span className="text-[10px] font-bold text-slate-400">Recorded at cost price value</span>
                </div>

                <div className="p-7 rounded-[2rem] bg-blue-50 border border-blue-100 shadow-sm relative overflow-hidden flex flex-col justify-between h-40">
                  <div className="absolute right-4 top-4 text-blue-200"><TrendingDown size={48} /></div>
                  <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">Accumulated Depreciation</p>
                  <h3 className="text-3xl font-black text-blue-700 tracking-tighter">{fmt(totalDepreciation)}</h3>
                  <span className="text-[10px] font-bold text-blue-400">Total lifetime value reductions</span>
                </div>

                <div className="p-7 rounded-[2rem] bg-emerald-50 border border-emerald-100 shadow-sm relative overflow-hidden flex flex-col justify-between h-40">
                  <div className="absolute right-4 top-4 text-emerald-200"><CheckCircle2 size={48} /></div>
                  <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Net Book Value (WDV)</p>
                  <h3 className="text-3xl font-black text-emerald-700 tracking-tighter">{fmt(totalBookValue)}</h3>
                  <span className="text-[10px] font-bold text-emerald-400">Remaining capital assets worth</span>
                </div>
              </div>

              {/* Asset list */}
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
                <div className="h-16 px-8 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Acquisition Registry</span>
                  <span className="bg-blue-50 text-blue-700 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                    {assets.length} Active Assets
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[1000px]">
                    <thead className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 border-b border-slate-50 bg-[#fcfdfe]">
                      <tr>
                        <th className="px-8 py-5">Asset Name</th>
                        <th className="px-8 py-5">Acquisition Date</th>
                        <th className="px-8 py-5 text-right">Cost Price (₹)</th>
                        <th className="px-8 py-5 text-center">Dep. Method</th>
                        <th className="px-8 py-5 text-center">Life (Years)</th>
                        <th className="px-8 py-5 text-right">Accumulated Dep. (₹)</th>
                        <th className="px-8 py-5 text-right">Book Value (₹)</th>
                        <th className="px-8 py-5 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-[13px] font-semibold text-slate-700">
                      {assets.length > 0 ? (
                        assets.map((asset) => (
                          <tr key={asset.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-8 py-5">
                              <span className="font-extrabold text-slate-900 block">{asset.name}</span>
                              <span className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 block tracking-wider">
                                GL: {asset.AssetLedger?.name || 'Standard Account'}
                              </span>
                            </td>
                            <td className="px-8 py-5 text-slate-500">
                              {new Date(asset.purchaseDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="px-8 py-5 text-right font-bold text-slate-900">{fmt(asset.purchaseValue)}</td>
                            <td className="px-8 py-5 text-center">
                              <span className="bg-blue-50 text-blue-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-md uppercase">
                                {asset.depreciationMethod}
                              </span>
                            </td>
                            <td className="px-8 py-5 text-center text-slate-600 font-bold">{asset.usefulLife}</td>
                            <td className="px-8 py-5 text-right text-rose-600 font-bold">{fmt(asset.accumulatedDepreciation)}</td>
                            <td className="px-8 py-5 text-right text-emerald-600 font-black">{fmt(asset.currentBookValue)}</td>
                            <td className="px-8 py-5 text-center">
                              {parseFloat(asset.currentBookValue) > 0 ? (
                                <div className="flex gap-2.5 justify-center">
                                  <button 
                                    onClick={() => { setSelectedAsset(asset); setActiveView('depreciate'); }}
                                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-xl font-bold text-[11px] uppercase tracking-wide transition-all"
                                  >
                                    Depreciate
                                  </button>
                                  <button 
                                    onClick={() => { setSelectedAsset(asset); setActiveView('dispose'); }}
                                    className="bg-amber-50 hover:bg-amber-100 text-amber-700 px-3 py-1.5 rounded-xl font-bold text-[11px] uppercase tracking-wide transition-all"
                                  >
                                    Dispose
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteAsset(asset.id)}
                                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                                  Disposed/Fully Depreciated
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="text-center py-12 text-slate-400 text-xs font-bold">
                            No fixed assets logged in company database. Click "Acquire Fixed Asset" above.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: ACQUIRE FIXED ASSET FORM */}
          {activeView === 'create' && (
            <div className="max-w-3xl mx-auto bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-2xl animate-fade-in space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-50 pb-5">
                <button onClick={() => setActiveView('list')} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                  <ArrowUpRight size={20} className="rotate-270 text-slate-600" />
                </button>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Log Fixed Asset Acquisition</h2>
              </div>

              <form onSubmit={handleCreateAsset} className="space-y-6 text-slate-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset Name *</label>
                    <input 
                      type="text" 
                      required 
                      value={assetForm.name}
                      onChange={e => setAssetForm({ ...assetForm, name: e.target.value })}
                      placeholder="e.g. Dell Enterprise Server"
                      className="border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500 transition-all bg-white"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Purchase Date *</label>
                    <input 
                      type="date" 
                      required 
                      value={assetForm.purchaseDate}
                      onChange={e => setAssetForm({ ...assetForm, purchaseDate: e.target.value })}
                      className="border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500 transition-all bg-white"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Purchase Value (₹) *</label>
                    <input 
                      type="number" 
                      required 
                      value={assetForm.purchaseValue}
                      onChange={e => setAssetForm({ ...assetForm, purchaseValue: e.target.value })}
                      placeholder="e.g. 150000"
                      className="border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500 transition-all bg-white"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Useful Life (Years)</label>
                    <input 
                      type="number" 
                      value={assetForm.usefulLife}
                      onChange={e => setAssetForm({ ...assetForm, usefulLife: e.target.value })}
                      placeholder="e.g. 10"
                      className="border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500 transition-all bg-white"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scrap Value (₹)</label>
                    <input 
                      type="number" 
                      value={assetForm.scrapValue}
                      onChange={e => setAssetForm({ ...assetForm, scrapValue: e.target.value })}
                      placeholder="e.g. 10000"
                      className="border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500 transition-all bg-white"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Depreciation Method</label>
                    <select 
                      value={assetForm.depreciationMethod}
                      onChange={e => setAssetForm({ ...assetForm, depreciationMethod: e.target.value })}
                      className="border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500 transition-all bg-white"
                    >
                      <option value="WDV">Written Down Value (WDV - Declining Balance)</option>
                      <option value="SLM">Straight Line Method (SLM)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset G/L Account</label>
                    <select 
                      value={assetForm.assetLedgerId}
                      onChange={e => setAssetForm({ ...assetForm, assetLedgerId: e.target.value })}
                      className="border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500 transition-all bg-white"
                    >
                      <option value="">-- Auto-create Dedicated Asset Ledger --</option>
                      {ledgers.filter(l => l.category === 'Asset').map(l => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Depreciation Expense G/L</label>
                    <select 
                      value={assetForm.depreciationLedgerId}
                      onChange={e => setAssetForm({ ...assetForm, depreciationLedgerId: e.target.value })}
                      className="border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500 transition-all bg-white"
                    >
                      <option value="">-- Resolve "Depreciation Expense" Ledger --</option>
                      {ledgers.filter(l => l.category === 'Expense').map(l => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
                  <button 
                    type="button" 
                    onClick={() => setActiveView('list')}
                    className="px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold text-xs uppercase tracking-widest transition-all text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-slate-900/10 transition-all disabled:opacity-50"
                  >
                    {loading ? 'Posting...' : 'Acknowledge Acquisition'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* VIEW: RUN DEPRECIATION */}
          {activeView === 'depreciate' && selectedAsset && (
            <div className="max-w-md mx-auto bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-2xl animate-fade-in space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-50 pb-5">
                <button onClick={() => setActiveView('list')} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                  <ArrowUpRight size={20} className="rotate-270 text-slate-600" />
                </button>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Run Asset Depreciation</h2>
              </div>

              <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-100 flex flex-col gap-1 shadow-sm">
                <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Selected Asset</span>
                <span className="font-extrabold text-slate-800 text-base">{selectedAsset.name}</span>
                <div className="flex justify-between items-center text-xs mt-3 text-slate-500 font-bold border-t border-blue-100/50 pt-2">
                  <span>Current Book Value:</span>
                  <span className="text-slate-900 font-black">{fmt(selectedAsset.currentBookValue)}</span>
                </div>
              </div>

              <form onSubmit={handleRunDepreciation} className="space-y-6 text-slate-700">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Depreciation Filing Date</label>
                  <input 
                    type="date" 
                    required 
                    value={depDate}
                    onChange={e => setDepDate(e.target.value)}
                    className="border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500 transition-all bg-white"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
                  <button 
                    type="button" 
                    onClick={() => setActiveView('list')}
                    className="px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold text-xs uppercase tracking-widest text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-slate-900/10 transition-all disabled:opacity-50"
                  >
                    {loading ? 'Filing...' : 'File Depreciation'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* VIEW: DISPOSE ASSET */}
          {activeView === 'dispose' && selectedAsset && (
            <div className="max-w-md mx-auto bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-2xl animate-fade-in space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-50 pb-5">
                <button onClick={() => setActiveView('list')} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                  <ArrowUpRight size={20} className="rotate-270 text-slate-600" />
                </button>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Retire & Dispose Asset</h2>
              </div>

              <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-100 flex flex-col gap-1 shadow-sm">
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Asset Marked for Disposal</span>
                <span className="font-extrabold text-slate-800 text-base">{selectedAsset.name}</span>
                <div className="flex justify-between items-center text-xs mt-3 text-slate-500 font-bold border-t border-amber-100/50 pt-2">
                  <span>Carrying WDV Value:</span>
                  <span className="text-slate-900 font-black">{fmt(selectedAsset.currentBookValue)}</span>
                </div>
              </div>

              <form onSubmit={handleDisposeAsset} className="space-y-6 text-slate-700">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Disposal Date</label>
                  <input 
                    type="date" 
                    required 
                    value={disposeForm.disposalDate}
                    onChange={e => setDisposeForm({ ...disposeForm, disposalDate: e.target.value })}
                    className="border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500 transition-all bg-white"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Realized Sale Value (₹) *</label>
                  <input 
                    type="number" 
                    required 
                    value={disposeForm.disposalValue}
                    onChange={e => setDisposeForm({ ...disposeForm, disposalValue: e.target.value })}
                    placeholder="e.g. 80000"
                    className="border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500 transition-all bg-white"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cash / Bank Ledger Account *</label>
                  <select 
                    required
                    value={disposeForm.bankLedgerId}
                    onChange={e => setDisposeForm({ ...disposeForm, bankLedgerId: e.target.value })}
                    className="border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500 transition-all bg-white"
                  >
                    <option value="">-- Choose Account to Deposit Proceeds --</option>
                    {ledgers.filter(l => l.category === 'Asset' && (l.groupName.toLowerCase().includes('bank') || l.groupName.toLowerCase().includes('cash'))).map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
                  <button 
                    type="button" 
                    onClick={() => setActiveView('list')}
                    className="px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold text-xs uppercase tracking-widest text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-amber-500/10 transition-all disabled:opacity-50"
                  >
                    {loading ? 'Filing Disposal...' : 'Acknowledge Disposal'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
}
