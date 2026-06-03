import React, { useState, useEffect, useRef } from 'react';
import { 
  X, HelpCircle, Package, Coins, ShoppingCart, 
  Upload, RefreshCcw, Save, AlertTriangle, 
  ChevronDown, Search, LayoutList
} from 'lucide-react';
import { inventoryAPI } from '../../services/api';

const INITIAL_UNITS = [
  "CMS - cm", "DOZ - dz", "FTS - ft", "GMS - g", "INC - in",
  "KGS - kg", "KME - km", "LBS - lb", "MGS - mg", "MLT - ml",
  "MTR - m", "PCS - pcs"
];

const SALES_ACCOUNTS_STRUCTURE = [
  { category: "Income", accounts: ["Sales", "General Income", "Other Income", "Interest Income", "Discount", "Shipping Charge"] },
  { category: "Other Current Liability", accounts: ["Unearned Revenue", "Tax Payable", "TDS Payable"] }
];

const PURCHASE_ACCOUNTS_STRUCTURE = [
  { category: "Expense", accounts: [
      "Purchase Discounts", "Raw Materials And Consumables", "Office Supplies", 
      "Advertising And Marketing", "Automobile Expense", "Bad Debt", 
      "Bank Fees and Charges", "Consultant Expense", "IT and Internet Expenses", 
      "Salaries and Employee Wages", "Transportation Expense", "Travel Expense", 
      "Uncategorized"
    ] 
  },
  { category: "Cost Of Goods Sold", accounts: ["Cost of Goods Sold", "Job Costing", "Labor", "Materials", "Subcontractor"] }
];

const CreateItemModal = ({ isOpen, onClose, onSuccess, companyId }) => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState('');
  
  const [newItem, setNewItem] = useState({
    name: '', type: 'Goods', unit: '',
    salesInformation: true, sellingPrice: '', salesAccount: 'Sales', salesDescription: '',
    purchaseInformation: true, costPrice: '', purchaseAccount: 'Cost of Goods Sold', purchaseDescription: '',
    preferredVendor: '', imageUrl: '',
    hsnCode: '', gstRate: 18, itemCode: ''
  });

  const [isUnitOpen, setIsUnitOpen] = useState(false);
  const [unitSearch, setUnitSearch] = useState('');
  const [isSalesAccountOpen, setIsSalesAccountOpen] = useState(false);
  const [salesAccountSearch, setSalesAccountSearch] = useState('');
  const [isPurchaseAccountOpen, setIsPurchaseAccountOpen] = useState(false);
  const [purchaseAccountSearch, setPurchaseAccountSearch] = useState('');

  const unitDropdownRef = useRef(null);
  const salesAccountDropdownRef = useRef(null);
  const purchaseAccountDropdownRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (unitDropdownRef.current && !unitDropdownRef.current.contains(event.target)) setIsUnitOpen(false);
      if (salesAccountDropdownRef.current && !salesAccountDropdownRef.current.contains(event.target)) setIsSalesAccountOpen(false);
      if (purchaseAccountDropdownRef.current && !purchaseAccountDropdownRef.current.contains(event.target)) setIsPurchaseAccountOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!newItem.name.trim()) {
      setFormError('Item Name is required.');
      return;
    }
    if (newItem.purchaseInformation && (!newItem.costPrice || parseFloat(newItem.costPrice) < 0)) {
      setFormError('Valid Cost Price is required.');
      return;
    }
    
    setLoading(true);
    try {
      const res = await inventoryAPI.createItem({ ...newItem, companyId });
      onSuccess(res.data);
    } catch (err) {
      setFormError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await inventoryAPI.uploadImage(formData);
      setNewItem({ ...newItem, imageUrl: res.data.imageUrl });
    } catch (err) {
      alert("Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  const SectionHeader = ({ icon: Icon, title, color }) => (
    <div className="flex items-center gap-2 mb-4">
      <div className={`p-1.5 rounded-lg ${color} bg-opacity-10`}>
        <Icon size={16} className={color.replace('bg-', 'text-')} />
      </div>
      <h3 className="text-[14px] font-bold text-slate-700 tracking-tight">{title}</h3>
    </div>
  );

  const Toggle = ({ enabled, onChange }) => (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${enabled ? 'bg-blue-600' : 'bg-slate-200'}`}
    >
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-4.5' : 'translate-x-1'}`} />
    </button>
  );

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[1001] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[850px] max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-white/20">
        
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-10 transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200 border-2 border-white">
              <Package size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">Create New Item</h2>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Inventory Management</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all active:scale-90">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-slate-50/30">
          
          {formError && (
            <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl animate-shake flex items-center gap-3">
               <AlertTriangle size={18} className="text-rose-500 shrink-0" />
               <p className="text-[13px] font-bold text-rose-700">{formError}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-8">
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Item Name *</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors">
                    <LayoutList size={18} />
                  </div>
                  <input 
                    autoFocus
                    value={newItem.name} 
                    onChange={e => setNewItem({...newItem, name: e.target.value})}
                    placeholder="Enter item name..."
                    className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all shadow-sm"
                  />
                </div>
              </div>

              {/* Item Code, HSN Code, GST Rate */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">
                    Item Code / SKU <span className="text-slate-400 font-normal normal-case">(Optional)</span>
                  </label>
                  <input
                    value={newItem.itemCode || ''}
                    onChange={e => setNewItem({...newItem, itemCode: e.target.value})}
                    placeholder="Ex: ELEC-001"
                    className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-blue-500 transition-all shadow-sm"
                  />
                  <p className="text-[10px] text-slate-400 font-normal ml-1 mt-1 leading-normal">
                    Leave empty if not needed.<br />Used for easy product identification.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">HSN / SAC Code</label>
                    <div className="group relative cursor-pointer">
                      <HelpCircle size={12} className="text-slate-400 hover:text-slate-600" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 hidden group-hover:block bg-slate-800 text-white text-[10px] font-medium p-2 rounded shadow-lg z-[200] leading-normal text-center normal-case">
                        8 digit HSN code for goods, 6 digit SAC code for services
                      </div>
                    </div>
                  </div>
                  <input
                    value={newItem.hsnCode || ''}
                    onChange={e => setNewItem({...newItem, hsnCode: e.target.value})}
                    placeholder="Ex: 85340000"
                    className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-blue-500 transition-all shadow-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">GST Rate</label>
                  <select
                    value={newItem.gstRate !== undefined ? newItem.gstRate : 18}
                    onChange={e => setNewItem({...newItem, gstRate: parseFloat(e.target.value)})}
                    className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 outline-none appearance-none focus:border-blue-500 transition-all bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C/polyline%3E%3C/svg%3E')] bg-[length:14px] bg-[right_15px_center] bg-no-repeat cursor-pointer shadow-sm"
                  >
                    <option value="0">0%</option>
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                    <option value="28">28%</option>
                  </select>
                  <div className="mt-1 space-y-0.5 text-[10px] text-slate-500">
                    <p>Same state: CGST {(newItem.gstRate || 0) / 2}% + SGST {(newItem.gstRate || 0) / 2}%</p>
                    <p>Diff state: IGST {newItem.gstRate || 0}%</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Type</label>
                  <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                    <button 
                      onClick={() => setNewItem({...newItem, type: 'Goods'})}
                      className={`flex-1 py-2 rounded-xl text-[11px] font-bold tracking-widest transition-all ${newItem.type === 'Goods' ? 'bg-white shadow-md text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
                    >GOODS</button>
                    <button 
                      onClick={() => setNewItem({...newItem, type: 'Service'})}
                      className={`flex-1 py-2 rounded-xl text-[11px] font-bold tracking-widest transition-all ${newItem.type === 'Service' ? 'bg-white shadow-md text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
                    >SERVICE</button>
                  </div>
                </div>

                <div className="space-y-2 relative" ref={unitDropdownRef}>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Unit</label>
                  <div 
                    onClick={() => setIsUnitOpen(!isUnitOpen)}
                    className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 cursor-pointer hover:border-blue-500 transition-all shadow-sm"
                  >
                    <span className={!newItem.unit ? 'text-slate-400' : 'text-slate-900'}>{newItem.unit || 'Select Unit'}</span>
                    <ChevronDown size={14} className={`text-slate-400 transition-transform ${isUnitOpen ? 'rotate-180' : ''}`} />
                  </div>
                  {isUnitOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 shadow-2xl rounded-2xl z-[150] overflow-hidden animate-in slide-in-from-top-2">
                      <div className="p-3 border-b border-slate-100 bg-slate-50/50">
                        <div className="relative">
                          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input 
                            placeholder="Search unit..." 
                            value={unitSearch} 
                            onChange={e => setUnitSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-xs font-bold ring-0 outline-none bg-white border border-slate-200 rounded-xl"
                          />
                        </div>
                      </div>
                      <div className="max-h-[160px] overflow-y-auto">
                        {INITIAL_UNITS.filter(u => u.toLowerCase().includes(unitSearch.toLowerCase())).map(u => (
                          <div key={u} onClick={() => { setNewItem({...newItem, unit: u}); setIsUnitOpen(false); }} className="px-4 py-2.5 text-[12px] font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 cursor-pointer transition-colors border-b border-slate-50 last:border-0">
                            {u}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Image Preview */}
            <div className="flex flex-col items-center">
               <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 self-start ml-1">Thumbnail</label>
               <div 
                 onClick={() => fileInputRef.current.click()}
                 className="w-full aspect-square bg-white border-2 border-dashed border-slate-200 rounded-[32px] flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all group relative overflow-hidden shadow-sm"
               >
                 {uploading ? <RefreshCcw size={24} className="animate-spin text-blue-500" /> : 
                  newItem.imageUrl ? <img src={newItem.imageUrl} className="w-full h-full object-cover" alt="Item" /> : (
                    <>
                      <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors mb-2 border border-slate-100">
                        <Upload size={18} />
                      </div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Upload</span>
                    </>
                  )}
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
            {/* Sales Info */}
            <div className={`p-6 rounded-3xl border transition-all duration-300 shadow-sm ${newItem.salesInformation ? 'bg-white border-emerald-100 ring-4 ring-emerald-50' : 'bg-slate-50/50 border-slate-200 opacity-60'}`}>
              <div className="flex justify-between items-center mb-6">
                <SectionHeader icon={Coins} title="Sales Information" color="bg-emerald-600" />
                <Toggle enabled={newItem.salesInformation} onChange={(val) => setNewItem({...newItem, salesInformation: val})} />
              </div>
              
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Selling Price (INR)</label>
                  <input 
                    type="number" 
                    value={newItem.sellingPrice} 
                    onChange={e => setNewItem({...newItem, sellingPrice: e.target.value})}
                    placeholder="0.00"
                    disabled={!newItem.salesInformation}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>
                <div className="space-y-1.5 relative" ref={salesAccountDropdownRef}>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Income Account</label>
                  <div 
                    onClick={() => newItem.salesInformation && setIsSalesAccountOpen(!isSalesAccountOpen)}
                    className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 cursor-pointer transition-all"
                  >
                     <span className="truncate">{newItem.salesAccount}</span>
                     <ChevronDown size={14} className="text-slate-400" />
                  </div>
                  {isSalesAccountOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 shadow-2xl rounded-2xl z-[140] overflow-hidden">
                      <div className="max-h-[200px] overflow-y-auto">
                        {SALES_ACCOUNTS_STRUCTURE.map(sec => (
                          <div key={sec.category} className="mb-2">
                             <div className="px-4 py-1.5 text-[9px] font-bold text-slate-400 uppercase bg-slate-50/50 border-y border-slate-100 tracking-wider">{sec.category}</div>
                             {sec.accounts.map(acc => (
                               <div key={acc} onClick={() => {setNewItem({...newItem, salesAccount: acc}); setIsSalesAccountOpen(false);}} className="px-5 py-2 text-[12px] font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer transition-colors border-b border-slate-50 last:border-0">{acc}</div>
                             ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Purchase Info */}
            <div className={`p-6 rounded-3xl border transition-all duration-300 shadow-sm ${newItem.purchaseInformation ? 'bg-white border-amber-100 ring-4 ring-amber-50' : 'bg-slate-50/50 border-slate-200 opacity-60'}`}>
              <div className="flex justify-between items-center mb-6">
                <SectionHeader icon={ShoppingCart} title="Purchase Information" color="bg-amber-600" />
                <Toggle enabled={newItem.purchaseInformation} onChange={(val) => setNewItem({...newItem, purchaseInformation: val})} />
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cost Price (INR)</label>
                  <input 
                    type="number" 
                    value={newItem.costPrice} 
                    onChange={e => setNewItem({...newItem, costPrice: e.target.value})}
                    placeholder="0.00"
                    disabled={!newItem.purchaseInformation}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-amber-500 focus:bg-white transition-all"
                  />
                </div>
                <div className="space-y-1.5 relative" ref={purchaseAccountDropdownRef}>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cost Account</label>
                  <div 
                    onClick={() => newItem.purchaseInformation && setIsPurchaseAccountOpen(!isPurchaseAccountOpen)}
                    className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 cursor-pointer transition-all"
                  >
                     <span className="truncate">{newItem.purchaseAccount}</span>
                     <ChevronDown size={14} className="text-slate-400" />
                  </div>
                   {isPurchaseAccountOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 shadow-2xl rounded-2xl z-[130] overflow-hidden">
                      <div className="max-h-[200px] overflow-y-auto">
                        {PURCHASE_ACCOUNTS_STRUCTURE.map(sec => (
                          <div key={sec.category} className="mb-2">
                             <div className="px-4 py-1.5 text-[9px] font-bold text-slate-400 uppercase bg-slate-50/50 border-y border-slate-100 tracking-wider">{sec.category}</div>
                             {sec.accounts.map(acc => (
                               <div key={acc} onClick={() => {setNewItem({...newItem, purchaseAccount: acc}); setIsPurchaseAccountOpen(false);}} className="px-5 py-2 text-[12px] font-bold text-slate-700 hover:bg-amber-50 hover:text-amber-700 cursor-pointer transition-colors border-b border-slate-50 last:border-0">{acc}</div>
                             ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-slate-100 bg-white flex items-center justify-between">
          <button 
            onClick={onClose} 
            className="px-6 py-3 text-sm font-bold text-slate-400 uppercase tracking-wider hover:text-slate-700 transition-all border border-transparent hover:border-slate-200 rounded-2xl"
          >
            Go Back
          </button>
          <div className="flex items-center gap-3">
             <button 
               onClick={handleSave}
               disabled={loading}
               className="px-10 py-3.5 bg-blue-600 text-white text-xs font-bold uppercase tracking-[0.2em] rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-600/20 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
             >
               {loading ? <RefreshCcw size={14} className="animate-spin" /> : <Save size={14} />}
               Save and Select
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateItemModal;
