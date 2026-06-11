import React, { useState, useEffect } from 'react';
import { 
  FolderGit2, Plus, ArrowLeft, ArrowUpRight, Cpu, Package, Play, 
  Trash2, RefreshCw, AlertCircle, Calendar, ClipboardList, CheckCircle2, DollarSign
} from 'lucide-react';
import { manufacturingAPI, inventoryAPI } from '../../services/api';
import ConfirmModal from '../../components/ConfirmModal';
import useNotificationStore from '../../store/notificationStore';

const fmt = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

export default function ManufacturingView() {
  const { addNotification } = useNotificationStore();
  const companyId = sessionStorage.getItem('companyId');
  const [boms, setBoms] = useState([]);
  const [orders, setOrders] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    message: '',
    onConfirm: null
  });
  
  // Views: 'boms', 'orders', 'create_bom', 'run_production'
  const [activeTab, setActiveTab] = useState('boms');
  
  // Create BOM state
  const [bomForm, setBomForm] = useState({
    name: '',
    finishedGoodItemId: '',
    quantity: '1',
    description: '',
    ingredients: [] // { rawMaterialItemId, quantity, name, unit, costPrice }
  });

  const [selIngredientId, setSelIngredientId] = useState('');
  const [ingQty, setIngQty] = useState('');

  // Production Order state
  const [prodForm, setProdForm] = useState({
    productionOrderNumber: 'PO-' + Date.now().toString().slice(-6),
    BOMId: '',
    quantity: '1',
    date: new Date().toISOString().split('T')[0]
  });

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [resBoms, resOrders, resItems] = await Promise.all([
        manufacturingAPI.getBOMs(companyId),
        manufacturingAPI.getProductionOrders(companyId),
        inventoryAPI.getByCompany(companyId)
      ]);
      setBoms(resBoms.data || []);
      setOrders(resOrders.data || []);
      setItems(resItems.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch manufacturing registries. Verify database modules.');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (companyId) {
      fetchData();
    }
  }, [companyId]);

  const handleCreateBOM = async (e) => {
    e.preventDefault();
    if (!bomForm.name.trim() || !bomForm.finishedGoodItemId) return addNotification('Name and Finished Good are required', 'warning');
    if (bomForm.ingredients.length === 0) return addNotification('Please add at least one ingredient raw material', 'warning');

    try {
      setLoading(true);
      await manufacturingAPI.createBOM({
        name: bomForm.name,
        finishedGoodItemId: bomForm.finishedGoodItemId,
        quantity: parseFloat(bomForm.quantity || 1),
        description: bomForm.description,
        ingredients: bomForm.ingredients.map(ing => ({
          rawMaterialItemId: ing.rawMaterialItemId,
          quantity: parseFloat(ing.quantity)
        })),
        companyId
      });
      addNotification('Bill of Materials registered successfully.', 'success');
      setActiveTab('boms');
      fetchData();
      // Reset
      setBomForm({
        name: '',
        finishedGoodItemId: '',
        quantity: '1',
        description: '',
        ingredients: []
      });
    } catch (err) {
      console.error(err);
      addNotification('Failed to register BOM recipe.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRunProduction = async (e) => {
    e.preventDefault();
    if (!prodForm.BOMId || !prodForm.quantity) return addNotification('BOM Recipe and Quantity are required', 'warning');
    try {
      setLoading(true);
      await manufacturingAPI.createProductionOrder({
        ...prodForm,
        quantity: parseFloat(prodForm.quantity),
        companyId
      });
      addNotification('Manufacturing run completed successfully! Raw stocks decremented, finished stocks incremented, and stock-in-hand double-entry voucher posted.', 'success');
      setActiveTab('orders');
      fetchData();
      // Reset PO number
      setProdForm({
        productionOrderNumber: 'PO-' + Date.now().toString().slice(-6),
        BOMId: '',
        quantity: '1',
        date: new Date().toISOString().split('T')[0]
      });
    } catch (err) {
      console.error(err);
      addNotification(err.response?.data?.error || 'Manufacturing run failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBOM = (id, e) => {
    e.stopPropagation();
    setConfirmModal({
      isOpen: true,
      message: 'Are you sure you want to delete this BOM? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await manufacturingAPI.deleteBOM(id);
          addNotification('BOM deleted successfully.', 'success');
          fetchData();
        } catch (err) {
          console.error(err);
          addNotification('Failed to delete BOM', 'error');
        }
      }
    });
  };

  const addIngredient = () => {
    if (!selIngredientId) return addNotification('Please select an ingredient', 'warning');
    if (!ingQty || parseFloat(ingQty) <= 0) return addNotification('Please enter a valid quantity', 'warning');

    if (bomForm.ingredients.some(ing => ing.rawMaterialItemId === selIngredientId)) {
      return addNotification('Raw Material already exists in this recipe', 'warning');
    }

    const matchedItem = items.find(it => it.id === selIngredientId);
    setBomForm({
      ...bomForm,
      ingredients: [...bomForm.ingredients, {
        rawMaterialItemId: selIngredientId,
        quantity: parseFloat(ingQty),
        name: matchedItem?.name || 'Unknown',
        unit: matchedItem?.unit || 'Units',
        costPrice: parseFloat(matchedItem?.costPrice || 0)
      }]
    });

    setSelIngredientId('');
    setIngQty('');
  };

  const removeIngredient = (rawId) => {
    setBomForm({
      ...bomForm,
      ingredients: bomForm.ingredients.filter(ing => ing.rawMaterialItemId !== rawId)
    });
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8 animate-fade-in">
      {/* HEADER */}
      <div className="flex justify-between items-end border-b border-slate-100 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/15">
              <Cpu size={18} />
            </div>
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-[0.2em]">Operations & Production</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Manufacturing Control Register</h1>
          <p className="text-slate-400 text-xs mt-1 font-medium">Define BOM recipes and run production orders to assemble finished goods</p>
        </div>

        <div className="flex gap-3">
          {activeTab === 'boms' && (
            <button 
              onClick={() => setActiveTab('create_bom')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-600/15 flex items-center gap-1.5 transition-all"
            >
              <Plus size={16} /> Define BOM Recipe
            </button>
          )}
          {activeTab === 'orders' && (
            <button 
              onClick={() => setActiveTab('run_production')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-600/15 flex items-center gap-1.5 transition-all"
            >
              <Play size={14} fill="currentColor" /> Compile Production Run
            </button>
          )}
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => { setActiveTab('boms'); fetchData(); }}
          className={`px-6 py-3 text-sm font-bold tracking-tight border-b-2 transition-all ${activeTab === 'boms' || activeTab === 'create_bom' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-blue-600'}`}
        >
          Bill of Materials (BOM Recipes)
        </button>
        <button
          onClick={() => { setActiveTab('orders'); fetchData(); }}
          className={`px-6 py-3 text-sm font-bold tracking-tight border-b-2 transition-all ${activeTab === 'orders' || activeTab === 'run_production' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-blue-600'}`}
        >
          Production Orders (Run Logs)
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex gap-3 text-red-600 font-semibold items-center">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      ) : (
        <>
          {/* TAB: BOM LIST */}
          {activeTab === 'boms' && (
            <div className="space-y-6">
              {boms.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-xl space-y-6 max-w-3xl mx-auto p-10">
                  <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                    <FolderGit2 size={36} />
                  </div>
                  <h2 className="text-xl font-black text-slate-800 tracking-tight">Define Finished Goods Recipes</h2>
                  <p className="text-slate-500 text-xs leading-relaxed text-center px-10">
                    Map out ingredients, specify finished output ratios, and compute manufacturing costs relative to real-time raw stock values.
                  </p>
                  <button 
                    onClick={() => setActiveTab('create_bom')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg transition-all"
                  >
                    Define First BOM Recipe
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {boms.map(bom => {
                    const totalRecipeCost = bom.ingredients?.reduce((s, ing) => 
                      s + parseFloat(ing.RawMaterial?.costPrice || 0) * parseFloat(ing.quantity), 0
                    );

                    return (
                      <div key={bom.id} className="bg-white rounded-3xl border border-slate-100 shadow-lg p-6 space-y-6 relative overflow-hidden">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-black text-slate-900 tracking-tight">{bom.name}</h3>
                            <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                              Output: {bom.quantity} {bom.FinishedGood?.unit || 'Units'} of "{bom.FinishedGood?.name}"
                            </p>
                          </div>
                          <button 
                            onClick={(e) => handleDeleteBOM(bom.id, e)}
                            className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all"
                            title="Delete BOM"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        {/* Ingredients Table */}
                        <div className="border border-slate-50 rounded-2xl overflow-hidden bg-slate-50/20 p-4">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Required Ingredients Recipe</span>
                          <div className="space-y-2">
                            {bom.ingredients?.map((ing, i) => (
                              <div key={i} className="flex justify-between items-center text-xs font-semibold text-slate-600 border-b border-slate-50 pb-1.5 last:border-0 last:pb-0">
                                <span>{ing.RawMaterial?.name || 'Unknown Item'}</span>
                                <span>{ing.quantity} {ing.RawMaterial?.unit || 'Units'} &bull; {fmt(ing.RawMaterial?.costPrice)}/unit</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Recipe Cost</span>
                            <span className="text-base font-black text-slate-900">{fmt(totalRecipeCost)}</span>
                          </div>
                          <button 
                            onClick={() => {
                              setProdForm({ ...prodForm, BOMId: bom.id });
                              setActiveTab('run_production');
                            }}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
                          >
                            Post Production Order &rarr;
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB: PRODUCTION RUN LOGS */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              {orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-xl space-y-6 max-w-3xl mx-auto p-10">
                  <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center text-emerald-600">
                    <ClipboardList size={36} />
                  </div>
                  <h2 className="text-xl font-black text-slate-800 tracking-tight">Run Finished Goods Assembly</h2>
                  <p className="text-slate-500 text-xs leading-relaxed text-center px-10">
                    Post production run logs to deduct constituent stock quantities and build finished goods items worth.
                  </p>
                  <button 
                    onClick={() => setActiveTab('run_production')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg transition-all"
                  >
                    Post Assembly Order
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
                  <div className="h-16 px-8 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Production Order Register</span>
                    <span className="bg-blue-50 text-blue-700 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                      {orders.length} Completed Runs
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[900px]">
                      <thead className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 border-b border-slate-50 bg-[#fcfdfe]">
                        <tr>
                          <th className="px-8 py-5">Order Number</th>
                          <th className="px-8 py-5">Filing Date</th>
                          <th className="px-8 py-5">Recipe Reference</th>
                          <th className="px-8 py-5">Assembled Good</th>
                          <th className="px-8 py-5 text-right">Assembled Qty</th>
                          <th className="px-8 py-5 text-center">Filing Voucher</th>
                          <th className="px-8 py-5 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 text-[13px] font-semibold text-slate-700">
                        {orders.map((ord) => (
                          <tr key={ord.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-8 py-5 font-black text-slate-900">{ord.productionOrderNumber}</td>
                            <td className="px-8 py-5 text-slate-500">
                              {new Date(ord.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="px-8 py-5 font-bold text-blue-650">{ord.BOM?.name || 'Recipe Reference'}</td>
                            <td className="px-8 py-5 font-extrabold text-slate-900">{ord.FinishedGood?.name}</td>
                            <td className="px-8 py-5 text-right font-black text-slate-800">
                              {ord.quantity} {ord.FinishedGood?.unit || 'Units'}
                            </td>
                            <td className="px-8 py-5 text-center">
                              <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-3 py-1 rounded-md uppercase tracking-wider font-mono">
                                {ord.Voucher?.voucherNumber || 'JV-001'}
                              </span>
                            </td>
                            <td className="px-8 py-5 text-center">
                              <span className="bg-blue-50 text-blue-700 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                                {ord.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW: DEFINE BOM RECIPE */}
          {activeTab === 'create_bom' && (
            <div className="max-w-3xl mx-auto bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-2xl animate-fade-in space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-50 pb-5">
                <button onClick={() => setActiveTab('boms')} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                  <ArrowLeft size={20} className="text-slate-600" />
                </button>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Define Corporate BOM Recipe</h2>
              </div>

              <form onSubmit={handleCreateBOM} className="space-y-6 text-slate-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">BOM Recipe Name *</label>
                    <input 
                      type="text" 
                      required 
                      value={bomForm.name}
                      onChange={e => setBomForm({ ...bomForm, name: e.target.value })}
                      placeholder="e.g. Premium Office Desk Configuration"
                      className="border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500 transition-all bg-white"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recipe Output Yield *</label>
                    <input 
                      type="number" 
                      required 
                      value={bomForm.quantity}
                      onChange={e => setBomForm({ ...bomForm, quantity: e.target.value })}
                      placeholder="1.00"
                      className="border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500 transition-all bg-white"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Finished Goods Yield Item *</label>
                    <select 
                      required
                      value={bomForm.finishedGoodItemId}
                      onChange={e => setBomForm({ ...bomForm, finishedGoodItemId: e.target.value })}
                      className="border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500 transition-all bg-white"
                    >
                      <option value="">-- Choose Assembled Output Item --</option>
                      {items.map(it => (
                        <option key={it.id} value={it.id}>{it.name} ({it.unit})</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</label>
                    <input 
                      type="text" 
                      value={bomForm.description}
                      onChange={e => setBomForm({ ...bomForm, description: e.target.value })}
                      placeholder="Assembly specifications"
                      className="border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500 transition-all bg-white"
                    />
                  </div>
                </div>

                {/* Ingredients lines */}
                <div className="border-t border-slate-50 pt-6 space-y-4">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">Raw Materials Breakdown</span>
                  
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-slate-50 p-5 rounded-2xl border border-slate-100">
                    <div className="md:col-span-6 flex flex-col gap-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ingredient Raw Stock</label>
                      <select 
                        value={selIngredientId}
                        onChange={e => setSelIngredientId(e.target.value)}
                        className="border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all bg-white"
                      >
                        <option value="">-- Choose Raw Material --</option>
                        {items.map(it => (
                          <option key={it.id} value={it.id}>{it.name} ({it.unit}) - Cost: {fmt(it.costPrice)}</option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-4 flex flex-col gap-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Required Unit Qty</label>
                      <input 
                        type="number" 
                        value={ingQty}
                        onChange={e => setIngQty(e.target.value)}
                        placeholder="e.g. 10"
                        className="border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all bg-white"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <button 
                        type="button" 
                        onClick={addIngredient}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-md transition-all flex items-center justify-center gap-1"
                      >
                        <Plus size={14} /> Add Ingredient
                      </button>
                    </div>
                  </div>

                  {/* Selected Ingredients lines list */}
                  <div className="border border-slate-50 rounded-2xl overflow-hidden bg-white">
                    <table className="w-full text-left">
                      <thead className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 border-b border-slate-100 bg-slate-50/50">
                        <tr>
                          <th className="px-6 py-3.5">Raw Material Name</th>
                          <th className="px-6 py-3.5 text-right">Required Quantity</th>
                          <th className="px-6 py-3.5 text-right">Cost Price (₹)</th>
                          <th className="px-6 py-3.5 text-right">Combined cost (₹)</th>
                          <th className="px-6 py-3.5 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 text-[13px] font-bold text-slate-700">
                        {bomForm.ingredients.length > 0 ? (
                          bomForm.ingredients.map((ing, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/40">
                              <td className="px-6 py-3.5">{ing.name}</td>
                              <td className="px-6 py-3.5 text-right">{ing.quantity} {ing.unit}</td>
                              <td className="px-6 py-3.5 text-right">{fmt(ing.costPrice)}</td>
                              <td className="px-6 py-3.5 text-right text-blue-650">{fmt(ing.quantity * ing.costPrice)}</td>
                              <td className="px-6 py-3.5 text-center">
                                <button 
                                  type="button" 
                                  onClick={() => removeIngredient(ing.rawMaterialItemId)}
                                  className="text-slate-400 hover:text-red-500 transition-all p-1"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="text-center py-8 text-slate-400 text-xs">
                              No raw material ingredients added to recipe. Select an ingredient above.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
                  <button 
                    type="button" 
                    onClick={() => setActiveTab('boms')}
                    className="px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold text-xs uppercase tracking-widest text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-blue-600/15 transition-all disabled:opacity-50"
                  >
                    {loading ? 'Registering...' : 'Register BOM Recipe'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* VIEW: RUN ASSEMBLY ORDER */}
          {activeTab === 'run_production' && (
            <div className="max-w-md mx-auto bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-2xl animate-fade-in space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-50 pb-5">
                <button onClick={() => setActiveTab('orders')} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                  <ArrowLeft size={20} className="text-slate-600" />
                </button>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Run Finished Assembly Run</h2>
              </div>

              <form onSubmit={handleRunProduction} className="space-y-6 text-slate-700">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Production Order Number *</label>
                  <input 
                    type="text" 
                    required 
                    value={prodForm.productionOrderNumber}
                    onChange={e => setProdForm({ ...prodForm, productionOrderNumber: e.target.value })}
                    className="border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500 transition-all bg-white font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">BOM Recipe Matrix *</label>
                  <select 
                    required
                    value={prodForm.BOMId}
                    onChange={e => setProdForm({ ...prodForm, BOMId: e.target.value })}
                    className="border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500 transition-all bg-white"
                  >
                    <option value="">-- Choose BOM Formulation --</option>
                    {boms.map(bom => (
                      <option key={bom.id} value={bom.id}>{bom.name} (Output: {bom.quantity} {bom.FinishedGood?.unit})</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Yield Quantity to Assembled *</label>
                  <input 
                    type="number" 
                    required 
                    value={prodForm.quantity}
                    onChange={e => setProdForm({ ...prodForm, quantity: e.target.value })}
                    placeholder="e.g. 10"
                    className="border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500 transition-all bg-white"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filing Assembly Date *</label>
                  <input 
                    type="date" 
                    required 
                    value={prodForm.date}
                    onChange={e => setProdForm({ ...prodForm, date: e.target.value })}
                    className="border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500 transition-all bg-white"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
                  <button 
                    type="button" 
                    onClick={() => setActiveTab('orders')}
                    className="px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold text-xs uppercase tracking-widest text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-blue-600/15 transition-all disabled:opacity-50"
                  >
                    {loading ? 'Assembling...' : 'Compile Assembly Order'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </>
      )}

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, message: '', onConfirm: null })}
        onConfirm={confirmModal.onConfirm}
        title="Confirm Action"
        message={confirmModal.message}
      />
    </div>
  );
}
