import React, { useState, useEffect } from 'react';
import { 
  Building2, Plus, ArrowUpRight, DollarSign, Calendar, TrendingDown, 
  Trash2, RefreshCw, AlertCircle, FileText, ChevronRight, CheckCircle2, Landmark, ChevronDown,
  X, ArrowLeft, Calculator, Search
} from 'lucide-react';
import { fixedAssetsAPI, ledgerAPI } from '../../services/api';
import useNotificationStore from '../../store/notificationStore';

const fmt = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

export default function FixedAssetsView() {
  const { addNotification } = useNotificationStore();
  const companyId = sessionStorage.getItem('companyId');
  const [assets, setAssets] = useState([]);
  const [ledgers, setLedgers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Views: 'list', 'create', 'depreciate', 'dispose'
  const [activeView, setActiveView] = useState('list');
  const [selectedAsset, setSelectedAsset] = useState(null);
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');

  // Create Asset Form State
  const [assetForm, setAssetForm] = useState({
    name: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    purchaseValue: '',
    depreciationMethod: 'WDV',
    usefulLife: '10',
    scrapValue: '0',
    depreciationRate: '10',
    assetLedgerId: '',
    depreciationLedgerId: ''
  });

  // Action Form States
  const [depDate, setDepDate] = useState(new Date().toISOString().split('T')[0]);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    message: '',
    onConfirm: null
  });
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
    if (!assetForm.name.trim() || !assetForm.purchaseValue) return addNotification('Name and Purchase Value are required', 'warning');
    try {
      setLoading(true);
      await fixedAssetsAPI.create({
        ...assetForm,
        purchaseValue: parseFloat(assetForm.purchaseValue),
        usefulLife: parseInt(assetForm.usefulLife),
        usefulLifeYears: parseInt(assetForm.usefulLife),
        scrapValue: parseFloat(assetForm.scrapValue),
        depreciationRate: parseFloat(assetForm.depreciationRate || 10),
        companyId
      });
      addNotification('Asset acquired and logged successfully. Standard GL ledgers auto-resolved.', 'success');
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
        depreciationRate: '10',
        assetLedgerId: '',
        depreciationLedgerId: ''
      });
    } catch (err) {
      console.error(err);
      addNotification('Failed to log asset acquisition.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditAsset = async (e) => {
    e.preventDefault();
    if (!selectedAsset) return;
    if (!assetForm.name.trim() || !assetForm.purchaseValue) return addNotification('Name and Purchase Value are required', 'warning');
    try {
      setLoading(true);
      await fixedAssetsAPI.update(selectedAsset.id, {
        ...assetForm,
        purchaseValue: parseFloat(assetForm.purchaseValue),
        usefulLife: parseInt(assetForm.usefulLife),
        usefulLifeYears: parseInt(assetForm.usefulLife),
        scrapValue: parseFloat(assetForm.scrapValue),
        depreciationRate: parseFloat(assetForm.depreciationRate || 10),
        companyId
      });
      addNotification('Asset details updated successfully.', 'success');
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
        depreciationRate: '10',
        assetLedgerId: '',
        depreciationLedgerId: ''
      });
    } catch (err) {
      console.error(err);
      addNotification('Failed to update asset details.', 'error');
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
      addNotification('Depreciation posted successfully! Double-entry Journal Voucher logged in Daybook.', 'success');
      setActiveView('list');
      fetchData();
    } catch (err) {
      console.error(err);
      addNotification(err.response?.data?.error || 'Depreciation posting failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRunBatchDepreciation = () => {
    setConfirmModal({
      isOpen: true,
      message: 'Are you sure you want to run batch depreciation for all active assets? This will generate double-entry Journal Vouchers.',
      onConfirm: async () => {
        try {
          setLoading(true);
          const res = await fixedAssetsAPI.depreciateBatch(companyId, { date: new Date().toISOString().split('T')[0] });
          addNotification(`Batch depreciation posted successfully! Processed ${res.data.count} assets.`, 'success');
          fetchData();
        } catch (err) {
          console.error(err);
          addNotification(err.response?.data?.error || 'Batch depreciation posting failed.', 'error');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleDisposeAsset = async (e) => {
    e.preventDefault();
    if (!selectedAsset) return;
    if (!disposeForm.bankLedgerId || !disposeForm.disposalValue) {
      return addNotification('Bank ledger and sale value are required', 'warning');
    }
    try {
      setLoading(true);
      await fixedAssetsAPI.dispose(selectedAsset.id, {
        disposalDate: disposeForm.disposalDate,
        disposalValue: parseFloat(disposeForm.disposalValue),
        bankLedgerId: disposeForm.bankLedgerId
      });
      addNotification('Asset disposal posted successfully! Realized capital gain/loss recognized in ledger entries.', 'success');
      setActiveView('list');
      fetchData();
    } catch (err) {
      console.error(err);
      addNotification(err.response?.data?.error || 'Asset disposal failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadDemoData = async () => {
    setLoading(true);
    try {
      const demoAssets = [
        {
          name: 'Office Headquarters Building',
          purchaseDate: '2024-04-01',
          purchaseValue: 4500000,
          depreciationMethod: 'SLM',
          usefulLife: 30,
          scrapValue: 500000,
          depreciationRate: 3,
          companyId
        },
        {
          name: 'MacBook Pro Fleet (Development Team)',
          purchaseDate: '2025-06-15',
          purchaseValue: 680000,
          depreciationMethod: 'WDV',
          usefulLife: 5,
          scrapValue: 50000,
          depreciationRate: 40,
          companyId
        },
        {
          name: 'Delivery Logistics Truck',
          purchaseDate: '2025-01-10',
          purchaseValue: 1200000,
          depreciationMethod: 'WDV',
          usefulLife: 8,
          scrapValue: 150000,
          depreciationRate: 15,
          companyId
        }
      ];

      for (const payload of demoAssets) {
        await fixedAssetsAPI.create(payload);
      }

      addNotification('Demo Fixed Assets acquired and registered successfully!', 'success');
      fetchData();
    } catch (err) {
      console.error(err);
      addNotification('Failed to load demo fixed assets.', 'error');
    }
    setLoading(false);
  };

  const handleDeleteAsset = (id) => {
    setConfirmModal({
      isOpen: true,
      message: 'Are you sure you want to delete this asset record?',
      onConfirm: async () => {
        try {
          setLoading(true);
          await fixedAssetsAPI.delete(id);
          addNotification('Asset deleted successfully.', 'success');
          fetchData();
        } catch (err) {
          console.error(err);
          addNotification(err.response?.data?.error || 'Failed to delete asset.', 'error');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const totalAcquisition = assets.reduce((s, a) => s + parseFloat(a.purchaseValue || 0), 0);
  const totalBookValue = assets.reduce((s, a) => s + parseFloat(a.currentBookValue || 0), 0);
  const totalDepreciation = assets.reduce((s, a) => s + parseFloat(a.accumulatedDepreciation || 0), 0);

  const filteredAssets = assets.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (a.AssetLedger?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = methodFilter === 'ALL' || a.depreciationMethod === methodFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8 animate-fade-in font-sans text-slate-800">
      {/* HEADER */}
      <div className="flex justify-between items-end border-b border-blue-100/60 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/25">
              <Building2 size={20} />
            </div>
            <span className="text-[10px] font-black uppercase text-blue-500 tracking-[0.2em]">Asset Registers</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Fixed Assets Register</h1>
          <p className="text-slate-500 text-xs mt-1 font-medium">Track capital acquisitions, depreciation schedules, and asset disposals</p>
        </div>
        
        {activeView === 'list' && (
          <div className="flex gap-3">
            <button 
              onClick={handleRunBatchDepreciation}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-amber-500/20 flex items-center gap-1.5 transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              <Calculator size={16} /> Run Batch Depreciation
            </button>
            <button 
              onClick={() => setActiveView('create')}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 flex items-center gap-1.5 transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              <Plus size={16} /> Acquire Fixed Asset
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-slate-400 text-xs font-semibold">Recalibrating asset calculations...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 flex gap-3 text-rose-600 font-bold text-sm">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      ) : (
        <>
          {activeView === 'list' && (
            <div className="space-y-8">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-[2rem] bg-white border border-blue-100/60 shadow-md relative overflow-hidden flex flex-col justify-between h-40 bg-gradient-to-br from-blue-50/30 to-indigo-50/20">
                  <div className="absolute right-4 top-4 text-blue-200 select-none">
                    <Building2 size={44} className="opacity-40" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Total Asset Acquisitions</p>
                    <h3 className="text-3xl font-black text-blue-700 tracking-tighter">{fmt(totalAcquisition)}</h3>
                  </div>
                  <div className="space-y-1 mt-2">
                    <div className="w-full h-1.5 rounded-full bg-blue-100 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-400 to-indigo-600 rounded-full" style={{ width: '100%' }} />
                    </div>
                    <span className="text-[9px] font-bold text-blue-400 block">Recorded cost basis values</span>
                  </div>
                </div>

                <div className="p-6 rounded-[2rem] bg-white border border-rose-100 shadow-md relative overflow-hidden flex flex-col justify-between h-40 bg-gradient-to-br from-white to-rose-50/10">
                  <div className="absolute right-4 top-4 text-rose-200 select-none">
                    <TrendingDown size={44} className="opacity-40" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Accumulated Depreciation</p>
                    <h3 className="text-3xl font-black text-rose-600 tracking-tighter">{fmt(totalDepreciation)}</h3>
                  </div>
                  <div className="space-y-1 mt-2">
                    <div className="w-full h-1.5 rounded-full bg-rose-50 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-rose-400 to-red-550 rounded-full" 
                        style={{ width: `${totalAcquisition > 0 ? Math.min(100, (totalDepreciation / totalAcquisition) * 100) : 0}%` }}
                      />
                    </div>
                    <span className="text-[9px] font-bold text-rose-400 block">
                      {totalAcquisition > 0 ? ((totalDepreciation / totalAcquisition) * 100).toFixed(1) : 0}% of acquisitions depreciated
                    </span>
                  </div>
                </div>

                <div className="p-6 rounded-[2rem] bg-white border border-emerald-100 shadow-md relative overflow-hidden flex flex-col justify-between h-40 bg-gradient-to-br from-white to-emerald-50/10">
                  <div className="absolute right-4 top-4 text-emerald-200 select-none">
                    <DollarSign size={44} className="opacity-40" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Net Book Value (WDV)</p>
                    <h3 className="text-3xl font-black text-emerald-600 tracking-tighter">{fmt(totalBookValue)}</h3>
                  </div>
                  <div className="space-y-1 mt-2">
                    <div className="w-full h-1.5 rounded-full bg-emerald-50 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-400 to-teal-550 rounded-full" 
                        style={{ width: `${totalAcquisition > 0 ? Math.min(100, (totalBookValue / totalAcquisition) * 100) : 0}%` }}
                      />
                    </div>
                    <span className="text-[9px] font-bold text-emerald-500 block">
                      {totalAcquisition > 0 ? ((totalBookValue / totalAcquisition) * 100).toFixed(1) : 0}% remaining carrying value
                    </span>
                  </div>
                </div>
              </div>

              {/* Asset list */}
              <div className="bg-white rounded-[2rem] border border-blue-100/50 shadow-xl overflow-hidden">
                <div className="p-6 border-b border-blue-100/40 bg-gradient-to-r from-blue-50/40 to-indigo-50/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Asset Registry Ledger</h3>
                    <p className="text-blue-400/80 text-xs mt-0.5 font-medium">Manage and run operations on registered assets</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* Search Bar */}
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Search assets..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-755 outline-none hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all bg-white w-48 sm:w-64"
                      />
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <Search size={14} />
                      </div>
                    </div>

                    {/* Filter Dropdown */}
                    <div className="relative">
                      <select 
                        value={methodFilter}
                        onChange={e => setMethodFilter(e.target.value)}
                        className="pl-3 pr-8 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none hover:border-slate-300 focus:border-blue-500 transition-all bg-white appearance-none cursor-pointer"
                      >
                        <option value="ALL">All Methods</option>
                        <option value="WDV">WDV</option>
                        <option value="SLM">SLM</option>
                      </select>
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                        <ChevronDown size={14} />
                      </div>
                    </div>

                    <span className="bg-blue-50 text-blue-700 text-[10px] font-black px-3 py-1.5 rounded-lg border border-blue-100/30 uppercase tracking-wider shrink-0">
                      {filteredAssets.length} of {assets.length} Active
                    </span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[1000px] border-collapse">
                    <thead className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-500 border-b border-blue-100/50 bg-gradient-to-r from-blue-50/50 to-indigo-50/30">
                      <tr>
                        <th className="px-6 py-4">Asset Name</th>
                        <th className="px-6 py-4">Acquisition Date</th>
                        <th className="px-6 py-4 text-right">Cost Price (₹)</th>
                        <th className="px-6 py-4 text-center">Dep. Method</th>
                        <th className="px-6 py-4 text-center">Useful Life</th>
                        <th className="px-6 py-4 text-right">Accumulated Dep. (₹)</th>
                        <th className="px-6 py-4 text-right">Book Value (₹)</th>
                        <th className="px-6 py-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-[12.5px] font-semibold text-slate-700">
                      {filteredAssets.length > 0 ? (
                        filteredAssets.map((asset) => (
                          <tr key={asset.id} className="hover:bg-slate-50/40 transition-colors border-b border-slate-50">
                            <td className="px-6 py-3.5">
                              <span className="font-bold text-slate-900 block text-[13px]">{asset.name}</span>
                              <span className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 block tracking-wider">
                                GL: {asset.AssetLedger?.name || 'Standard Account'}
                              </span>
                            </td>
                            <td className="px-6 py-3.5 text-slate-500 text-xs font-semibold">
                              {new Date(asset.purchaseDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="px-6 py-3.5 text-right font-mono text-xs font-bold text-slate-900">{fmt(asset.purchaseValue)}</td>
                            <td className="px-6 py-3.5 text-center">
                              <span className="bg-blue-50 text-blue-700 text-[9px] font-black px-2.5 py-1 rounded-md border border-blue-100/40 uppercase">
                                {asset.depreciationMethod === 'WDV' ? `${asset.depreciationMethod} (${parseFloat(asset.depreciationRate || 10)}%)` : asset.depreciationMethod}
                              </span>
                            </td>
                            <td className="px-6 py-3.5 text-center text-slate-600 font-bold text-xs">{asset.usefulLife} Years</td>
                            <td className="px-6 py-3.5 text-right text-rose-505 font-mono text-xs font-bold">{fmt(asset.accumulatedDepreciation)}</td>
                            <td className="px-6 py-3.5 text-right text-emerald-600 font-mono text-xs font-black">{fmt(asset.currentBookValue)}</td>
                            <td className="px-6 py-3.5 text-center">
                              {parseFloat(asset.currentBookValue) > 0 ? (
                                <div className="flex gap-2 justify-center">
                                  <button 
                                    onClick={() => { setSelectedAsset(asset); setActiveView('depreciate'); }}
                                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-100/30 px-2.5 py-1 rounded-lg font-bold text-[10px] uppercase tracking-wide transition-all hover:scale-[1.02]"
                                  >
                                    Depreciate
                                  </button>
                                  <button 
                                    onClick={() => { setSelectedAsset(asset); setActiveView('dispose'); }}
                                    className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-100/30 px-2.5 py-1 rounded-lg font-bold text-[10px] uppercase tracking-wide transition-all hover:scale-[1.02]"
                                  >
                                    Dispose
                                  </button>
                                  <button 
                                    onClick={() => { 
                                      setSelectedAsset(asset); 
                                      setAssetForm({
                                        name: asset.name,
                                        purchaseDate: asset.purchaseDate ? asset.purchaseDate.split('T')[0] : '',
                                        purchaseValue: asset.purchaseValue,
                                        usefulLife: asset.usefulLife || 10,
                                        scrapValue: asset.scrapValue || 0,
                                        depreciationMethod: asset.depreciationMethod || 'WDV',
                                        depreciationRate: asset.depreciationRate !== undefined ? asset.depreciationRate : 10,
                                        assetLedgerId: asset.assetLedgerId || '',
                                        depreciationLedgerId: asset.depreciationLedgerId || '',
                                        accumulatedDepreciationLedgerId: asset.accumulatedDepreciationLedgerId || ''
                                      });
                                      setActiveView('edit'); 
                                    }}
                                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100/30 px-2.5 py-1 rounded-lg font-bold text-[10px] uppercase tracking-wide transition-all hover:scale-[1.02]"
                                  >
                                    Edit
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteAsset(asset.id)}
                                    className="p-1 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all hover:scale-[1.02]"
                                    title="Delete Asset"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest bg-slate-50 px-2.5 py-1 rounded border border-slate-100">
                                  Disposed / Fully Dep.
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="text-center py-20">
                            <div className="max-w-2xl mx-auto flex flex-col items-center py-12 px-6 border border-slate-100 rounded-[2.5rem] bg-gradient-to-b from-white to-slate-50/50 shadow-inner text-center">
                              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 text-slate-500 shadow-xl border border-slate-100">
                                <Building2 size={36} className="text-slate-650 animate-pulse"/>
                              </div>
                              <h3 className="text-2xl font-black text-slate-805 mb-3 tracking-tight">No Matching Fixed Assets</h3>
                              <p className="text-slate-550 font-semibold text-xs mb-8 leading-relaxed max-w-md mx-auto">
                                We couldn't find any registered assets matching your search query or filter settings. Create one or try adjusting your query.
                              </p>
                              <button 
                                onClick={() => { setSearchTerm(''); setMethodFilter('ALL'); }}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-blue-500/25 transition-all hover:-translate-y-0.5 flex items-center gap-2"
                              >
                                Clear Search Filters
                              </button>
                            </div>
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
            <div className="space-y-6">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                <button 
                  onClick={() => setActiveView('list')}
                  className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl transition-all hover:scale-105 active:scale-95"
                >
                  <ArrowLeft size={18} />
                </button>
                <div>
                  <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Acquire Corporate Fixed Asset</h1>
                  <p className="text-slate-500 text-xs mt-0.5 font-medium">Log acquisitions, resolve G/L accounts, and determine depreciation methods</p>
                </div>
              </div>

              <div className="max-w-4xl mx-auto bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-2xl shadow-slate-100/40">
                <form onSubmit={handleCreateAsset} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset Name *</label>
                      <input 
                        type="text" 
                        required 
                        value={assetForm.name}
                        onChange={e => setAssetForm({ ...assetForm, name: e.target.value })}
                        placeholder="e.g. Dell Enterprise Server"
                        className="border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-700 outline-none hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all bg-slate-50/30 focus:bg-white"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Purchase Date *</label>
                      <input 
                        type="date" 
                        required 
                        value={assetForm.purchaseDate}
                        onChange={e => setAssetForm({ ...assetForm, purchaseDate: e.target.value })}
                        className="border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-700 outline-none hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all bg-slate-50/30 focus:bg-white"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Purchase Value (₹) *</label>
                      <input 
                        type="number" 
                        required 
                        value={assetForm.purchaseValue}
                        onChange={e => setAssetForm({ ...assetForm, purchaseValue: e.target.value })}
                        placeholder="e.g. 150000"
                        className="border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-700 outline-none hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all bg-slate-50/30 focus:bg-white"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Useful Life (Years)</label>
                      <input 
                        type="number" 
                        value={assetForm.usefulLife}
                        onChange={e => setAssetForm({ ...assetForm, usefulLife: e.target.value })}
                        placeholder="e.g. 10"
                        className="border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-700 outline-none hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all bg-slate-50/30 focus:bg-white"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scrap Value (₹)</label>
                      <input 
                        type="number" 
                        value={assetForm.scrapValue}
                        onChange={e => setAssetForm({ ...assetForm, scrapValue: e.target.value })}
                        placeholder="e.g. 10000"
                        className="border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-700 outline-none hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all bg-slate-50/30 focus:bg-white"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Depreciation Method</label>
                      <div className="relative">
                        <select 
                          value={assetForm.depreciationMethod}
                          onChange={e => setAssetForm({ ...assetForm, depreciationMethod: e.target.value })}
                          className="w-full border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-700 outline-none hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all bg-slate-50/30 focus:bg-white appearance-none pr-10 cursor-pointer"
                        >
                          <option value="WDV">Written Down Value (WDV - Declining Balance)</option>
                          <option value="SLM">Straight Line Method (SLM)</option>
                        </select>
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                          <ChevronDown size={16} />
                        </div>
                      </div>
                    </div>

                    {assetForm.depreciationMethod === 'WDV' && (
                      <div className="flex flex-col gap-2 animate-fade-in">
                        <label className="text-[10px] font-black text-[#1e61f0] uppercase tracking-widest">Depreciation Rate (% per year) *</label>
                        <input 
                          type="number" 
                          required
                          value={assetForm.depreciationRate}
                          onChange={e => setAssetForm({ ...assetForm, depreciationRate: e.target.value })}
                          placeholder="e.g. 15"
                          className="border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold text-[#1e61f0] outline-none hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all bg-blue-50/10 focus:bg-white"
                        />
                      </div>
                    )}

                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset G/L Account</label>
                      <div className="relative">
                        <select 
                          value={assetForm.assetLedgerId}
                          onChange={e => setAssetForm({ ...assetForm, assetLedgerId: e.target.value })}
                          className="w-full border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-700 outline-none hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all bg-slate-50/30 focus:bg-white appearance-none pr-10 cursor-pointer"
                        >
                          <option value="">-- Auto-create Dedicated Asset Ledger --</option>
                          {ledgers.filter(l => l.Group?.nature?.toLowerCase().startsWith('asset')).map(l => (
                            <option key={l.id} value={l.id}>{l.name}</option>
                          ))}
                        </select>
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                          <ChevronDown size={16} />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Depreciation Expense G/L</label>
                      <div className="relative">
                        <select 
                          value={assetForm.depreciationLedgerId}
                          onChange={e => setAssetForm({ ...assetForm, depreciationLedgerId: e.target.value })}
                          className="w-full border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-700 outline-none hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all bg-slate-50/30 focus:bg-white appearance-none pr-10 cursor-pointer"
                        >
                          <option value="">-- Resolve "Depreciation Expense" Ledger --</option>
                          {ledgers.filter(l => l.Group?.nature?.toLowerCase().startsWith('expense')).map(l => (
                            <option key={l.id} value={l.id}>{l.name}</option>
                          ))}
                        </select>
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                          <ChevronDown size={16} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-5 border-t border-slate-100">
                    <button 
                      type="button" 
                      onClick={() => setActiveView('list')}
                      className="px-6 py-3.5 bg-white border border-slate-200 rounded-xl font-bold text-xs uppercase tracking-widest transition-all text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={loading}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all disabled:opacity-50 hover:scale-[1.01]"
                    >
                      {loading ? 'Posting...' : 'Acknowledge Acquisition'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* VIEW: RUN DEPRECIATION */}
          {activeView === 'depreciate' && selectedAsset && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                <button 
                  onClick={() => setActiveView('list')}
                  className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl transition-all hover:scale-105 active:scale-95"
                >
                  <ArrowLeft size={18} />
                </button>
                <div>
                  <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Run Asset Depreciation</h1>
                  <p className="text-slate-500 text-xs mt-0.5 font-medium">Verify calculations and post double-entry depreciation journals</p>
                </div>
              </div>

              <div className="max-w-2xl mx-auto bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-2xl shadow-slate-100/40 space-y-8">
                {(() => {
                  const bookValue = parseFloat(selectedAsset.currentBookValue || 0);
                  const life = parseInt(selectedAsset.usefulLife || 10);
                  const purchaseValue = parseFloat(selectedAsset.purchaseValue || 0);
                  const rate = parseFloat(selectedAsset.depreciationRate || 10);
                  const method = selectedAsset.depreciationMethod;

                  const annualDep = method === 'SLM' ? (purchaseValue / life) : (bookValue * rate / 100);
                  const monthlyDep = annualDep / 12;

                  const forecast = [];
                  let currentVal = bookValue;
                  const scrapValue = parseFloat(selectedAsset.scrapValue || 0);
                  for (let i = 1; i <= 5; i++) {
                     let depAmount = method === 'SLM' ? (purchaseValue / life) : (currentVal * rate / 100);
                     if (currentVal <= scrapValue) break;
                     if (currentVal - depAmount < scrapValue) {
                         depAmount = currentVal - scrapValue;
                     }
                     currentVal -= depAmount;
                     forecast.push({ year: i, depAmount, endValue: currentVal });
                     if (currentVal <= scrapValue) break;
                  }

                  return (
                    <div className="space-y-6">
                      <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/30 border border-blue-100 rounded-3xl p-6 flex flex-col gap-4 shadow-sm">
                        <div className="flex items-center gap-3 border-b border-blue-100 pb-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25">
                            <Calculator size={18} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Selected Asset Register</p>
                            <span className="text-slate-900 font-extrabold text-lg">{selectedAsset.name}</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold text-slate-600 mt-2">
                          <div className="flex justify-between items-center p-3.5 bg-white rounded-2xl border border-slate-50 shadow-sm">
                            <span>Carrying WDV Value</span>
                            <span className="text-slate-900 font-black text-sm">{fmt(bookValue)}</span>
                          </div>
                          <div className="flex justify-between items-center p-3.5 bg-white rounded-2xl border border-slate-50 shadow-sm">
                            <span>Calculation Method</span>
                            <span className="bg-blue-50 border border-blue-100 text-blue-700 text-[10px] font-black px-2.5 py-1 rounded-md uppercase">
                              {method === 'WDV' ? `WDV (${rate}%)` : 'SLM'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-3.5 bg-white rounded-2xl border border-slate-50 shadow-sm">
                            <span>Annual Depreciation</span>
                            <span className="text-emerald-700 font-black text-sm">{fmt(annualDep)}</span>
                          </div>
                          <div className="flex justify-between items-center p-3.5 bg-white rounded-2xl border border-slate-50 shadow-sm">
                            <span>Monthly Depreciation</span>
                            <span className="text-emerald-700 font-black text-sm">{fmt(monthlyDep)}</span>
                          </div>
                        </div>
                      </div>

                      {forecast.length > 0 && (
                        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                           <h4 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2"><TrendingDown size={16} className="text-blue-500" /> 5-Year Depreciation Forecast</h4>
                           <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs">
                                 <thead>
                                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                                       <th className="pb-3 pl-2">Year</th>
                                       <th className="pb-3 text-right">Predicted Depreciation</th>
                                       <th className="pb-3 text-right pr-2">Ending Book Value</th>
                                    </tr>
                                 </thead>
                                 <tbody className="divide-y divide-slate-50">
                                    {forecast.map((f) => (
                                       <tr key={f.year} className="hover:bg-slate-50/50 transition-colors">
                                          <td className="py-3 pl-2 font-bold text-slate-600">Year {f.year}</td>
                                          <td className="py-3 text-right font-bold text-red-500">-{fmt(f.depAmount)}</td>
                                          <td className="py-3 text-right pr-2 font-black text-slate-800">{fmt(f.endValue)}</td>
                                       </tr>
                                    ))}
                                 </tbody>
                              </table>
                           </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                <form onSubmit={handleRunDepreciation} className="space-y-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Depreciation Filing Date</label>
                    <input 
                      type="date" 
                      required 
                      value={depDate}
                      onChange={e => setDepDate(e.target.value)}
                      className="border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-700 outline-none hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all bg-slate-50/30 focus:bg-white"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-5 border-t border-slate-100">
                    <button 
                      type="button" 
                      onClick={() => setActiveView('list')}
                      className="px-6 py-3.5 bg-white border border-slate-200 rounded-xl font-bold text-xs uppercase tracking-widest text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={loading}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all disabled:opacity-50 hover:scale-[1.01]"
                    >
                      {loading ? 'Filing...' : 'File Depreciation'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* VIEW: DISPOSE ASSET */}
          {activeView === 'dispose' && selectedAsset && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                <button 
                  onClick={() => setActiveView('list')}
                  className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl transition-all hover:scale-105 active:scale-95"
                >
                  <ArrowLeft size={18} />
                </button>
                <div>
                  <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Retire & Dispose Asset</h1>
                  <p className="text-slate-500 text-xs mt-0.5 font-medium">Record sale value, choose deposit bank ledger, and recognize capital gain/loss</p>
                </div>
              </div>

              <div className="max-w-2xl mx-auto bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-2xl shadow-slate-100/40 space-y-8">
                <div className="bg-gradient-to-br from-blue-50/60 to-indigo-50/40 border border-blue-100 rounded-3xl p-6 flex flex-col gap-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25">
                      <Landmark size={18} />
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Asset Marked for Disposal</span>
                      <h3 className="font-extrabold text-slate-900 text-lg leading-tight">{selectedAsset.name}</h3>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs mt-2 text-slate-600 font-bold border-t border-blue-100/50 pt-3">
                    <span>Current Carrying WDV Value</span>
                    <span className="text-slate-900 font-black text-sm bg-white border border-blue-100 rounded-lg px-3 py-1.5 shadow-sm">
                      {fmt(selectedAsset.currentBookValue)}
                    </span>
                  </div>
                </div>

                <form onSubmit={handleDisposeAsset} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Disposal Date</label>
                      <input 
                        type="date" 
                        required 
                        value={disposeForm.disposalDate}
                        onChange={e => setDisposeForm({ ...disposeForm, disposalDate: e.target.value })}
                        className="border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-700 outline-none hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all bg-slate-50/30 focus:bg-white"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Realized Sale Value (₹) *</label>
                      <input 
                        type="number" 
                        required 
                        value={disposeForm.disposalValue}
                        onChange={e => setDisposeForm({ ...disposeForm, disposalValue: e.target.value })}
                        placeholder="e.g. 80000"
                        className="border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-700 outline-none hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all bg-slate-50/30 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cash / Bank Ledger Account *</label>
                    <div className="relative">
                      <select 
                        required
                        value={disposeForm.bankLedgerId}
                        onChange={e => setDisposeForm({ ...disposeForm, bankLedgerId: e.target.value })}
                        className="w-full border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-700 outline-none hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all bg-slate-50/30 focus:bg-white appearance-none pr-10 cursor-pointer"
                      >
                        <option value="">-- Choose Account to Deposit Proceeds --</option>
                        {ledgers.filter(l => {
                          const isAsset = l.Group?.nature?.toLowerCase().startsWith('asset');
                          const groupName = (l.groupName || l.Group?.name || '').toLowerCase();
                          const ledgerName = (l.name || '').toLowerCase();
                          return isAsset && (
                            groupName.includes('bank') || 
                            groupName.includes('cash') || 
                            ledgerName.includes('bank') || 
                            ledgerName.includes('cash')
                          );
                        }).map(l => (
                          <option key={l.id} value={l.id}>{l.name}</option>
                        ))}
                      </select>
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                        <ChevronDown size={16} />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-5 border-t border-slate-100">
                    <button 
                      type="button" 
                      onClick={() => setActiveView('list')}
                      className="px-6 py-3.5 bg-white border border-slate-200 rounded-xl font-bold text-xs uppercase tracking-widest text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={loading}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all disabled:opacity-50 hover:scale-[1.01]"
                    >
                      {loading ? 'Filing Disposal...' : 'Acknowledge Disposal'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* VIEW: EDIT FIXED ASSET FORM */}
          {activeView === 'edit' && selectedAsset && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                <button 
                  onClick={() => setActiveView('list')}
                  className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl transition-all hover:scale-105 active:scale-95"
                >
                  <ArrowLeft size={18} />
                </button>
                <div>
                  <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Edit Corporate Fixed Asset</h1>
                  <p className="text-slate-500 text-xs mt-0.5 font-medium">Update details, adjust useful life, scrap value, and depreciation method</p>
                </div>
              </div>

              <div className="max-w-4xl mx-auto bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-2xl shadow-slate-100/40">
                <form onSubmit={handleEditAsset} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset Name *</label>
                      <input 
                        type="text" 
                        required 
                        value={assetForm.name}
                        onChange={e => setAssetForm({ ...assetForm, name: e.target.value })}
                        placeholder="e.g. Dell Enterprise Server"
                        className="border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-700 outline-none hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all bg-slate-50/30 focus:bg-white"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Purchase Date *</label>
                      <input 
                        type="date" 
                        required 
                        value={assetForm.purchaseDate}
                        onChange={e => setAssetForm({ ...assetForm, purchaseDate: e.target.value })}
                        className="border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-700 outline-none hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all bg-slate-50/30 focus:bg-white"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Purchase Value (₹) *</label>
                      <input 
                        type="number" 
                        required 
                        value={assetForm.purchaseValue}
                        onChange={e => setAssetForm({ ...assetForm, purchaseValue: e.target.value })}
                        placeholder="e.g. 150000"
                        className="border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-700 outline-none hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all bg-slate-50/30 focus:bg-white"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Useful Life (Years)</label>
                      <input 
                        type="number" 
                        value={assetForm.usefulLife}
                        onChange={e => setAssetForm({ ...assetForm, usefulLife: e.target.value })}
                        placeholder="e.g. 10"
                        className="border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-700 outline-none hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all bg-slate-50/30 focus:bg-white"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scrap Value (₹)</label>
                      <input 
                        type="number" 
                        value={assetForm.scrapValue}
                        onChange={e => setAssetForm({ ...assetForm, scrapValue: e.target.value })}
                        placeholder="e.g. 10000"
                        className="border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-700 outline-none hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all bg-slate-50/30 focus:bg-white"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Depreciation Method</label>
                      <div className="relative">
                        <select 
                          value={assetForm.depreciationMethod}
                          onChange={e => setAssetForm({ ...assetForm, depreciationMethod: e.target.value })}
                          className="w-full border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-700 outline-none hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all bg-slate-50/30 focus:bg-white appearance-none pr-10 cursor-pointer"
                        >
                          <option value="WDV">Written Down Value (WDV - Declining Balance)</option>
                          <option value="SLM">Straight Line Method (SLM)</option>
                        </select>
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                          <ChevronDown size={16} />
                        </div>
                      </div>
                    </div>

                    {assetForm.depreciationMethod === 'WDV' && (
                      <div className="flex flex-col gap-2 animate-fade-in">
                        <label className="text-[10px] font-black text-[#1e61f0] uppercase tracking-widest">Depreciation Rate (% per year) *</label>
                        <input 
                          type="number" 
                          required
                          value={assetForm.depreciationRate}
                          onChange={e => setAssetForm({ ...assetForm, depreciationRate: e.target.value })}
                          placeholder="e.g. 15"
                          className="border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold text-[#1e61f0] outline-none hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all bg-blue-50/10 focus:bg-white"
                        />
                      </div>
                    )}

                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset G/L Account</label>
                      <div className="relative">
                        <select 
                          value={assetForm.assetLedgerId}
                          onChange={e => setAssetForm({ ...assetForm, assetLedgerId: e.target.value })}
                          className="w-full border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-700 outline-none hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all bg-slate-50/30 focus:bg-white appearance-none pr-10 cursor-pointer"
                        >
                          <option value="">-- Auto-create Dedicated Asset Ledger --</option>
                          {ledgers.filter(l => l.Group?.nature?.toLowerCase().startsWith('asset')).map(l => (
                            <option key={l.id} value={l.id}>{l.name}</option>
                          ))}
                        </select>
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                          <ChevronDown size={16} />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Depreciation Expense G/L</label>
                      <div className="relative">
                        <select 
                          value={assetForm.depreciationLedgerId}
                          onChange={e => setAssetForm({ ...assetForm, depreciationLedgerId: e.target.value })}
                          className="w-full border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-700 outline-none hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all bg-slate-50/30 focus:bg-white appearance-none pr-10 cursor-pointer"
                        >
                          <option value="">-- Resolve "Depreciation Expense" Ledger --</option>
                          {ledgers.filter(l => l.Group?.nature?.toLowerCase().startsWith('expense')).map(l => (
                            <option key={l.id} value={l.id}>{l.name}</option>
                          ))}
                        </select>
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                          <ChevronDown size={16} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-5 border-t border-slate-100">
                    <button 
                      type="button" 
                      onClick={() => setActiveView('list')}
                      className="px-6 py-3.5 bg-white border border-slate-200 rounded-xl font-bold text-xs uppercase tracking-widest transition-all text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={loading}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all disabled:opacity-50 hover:scale-[1.01]"
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}

      {/* Custom Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full mx-4 shadow-2xl border border-slate-100/80 transform scale-100 transition-all duration-300 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center space-y-5">
              {/* Warning Icon Container */}
              <div className="w-14 h-14 bg-amber-50 text-amber-655 text-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/10">
                <AlertCircle size={24} />
              </div>
              
              {/* Header */}
              <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Confirm Action</h3>
              
              {/* Description */}
              <p className="text-slate-500 text-xs font-semibold leading-relaxed px-2">
                {confirmModal.message}
              </p>
              
              {/* Button Action Bar */}
              <div className="flex w-full gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setConfirmModal({ isOpen: false, message: '', onConfirm: null })}
                  className="flex-1 px-5 py-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-700 rounded-xl font-bold text-xs uppercase tracking-widest transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirmModal.onConfirm) confirmModal.onConfirm();
                    setConfirmModal({ isOpen: false, message: '', onConfirm: null });
                  }}
                  className="flex-1 px-5 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] hover:-translate-y-0.5 active:translate-y-0"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
