import React, { useState, useEffect, useRef } from 'react';
import { 
  X, HelpCircle, Image as ImageIcon, ChevronLeft, ChevronDown, ChevronUp, 
  Trash2, Search, Check, Plus, RefreshCcw, Save, Package, 
  Coins, ShoppingCart, Upload, ArrowRight, Info, AlertCircle, LayoutList, Receipt, AlertTriangle,
  ArrowLeft
} from 'lucide-react';
import { inventoryAPI, purchaseAPI } from '../../services/api';
import { useNavigate, useLocation } from 'react-router-dom';
import CreateAccountModal from '../../components/accounting/CreateAccountModal';

const INITIAL_UNITS = [
  "CMS - cm", "DOZ - dz", "FTS - ft", "GMS - g", "INC - in",
  "KGS - kg", "KME - km", "LBS - lb", "MGS - mg", "MLT - ml",
  "MTR - m", "PCS - pcs"
];

const SALES_ACCOUNTS_STRUCTURE = [
  { category: "Other Current Asset", accounts: ["Advance Tax", "Employee Advance", "Prepaid Expenses", "TDS Receivable"] },
  { category: "Fixed Asset", accounts: ["Furniture and Equipment"] },
  { category: "Other Current Liability", accounts: ["Employee Reimbursements", "Opening Balance Adjustments", "Tax Payable", "TDS Payable", "Unearned Revenue"] },
  { category: "Income", accounts: ["Discount", "General Income", "Interest Income", "Late Fee Income", "Other Charges", "Sales", "Shipping Charge"] }
];

const PURCHASE_ACCOUNTS_STRUCTURE = [
  { category: "Other Current Asset", accounts: ["Advance Tax", "Employee Advance", "Prepaid Expenses", "TDS Receivable"] },
  { category: "Fixed Asset", accounts: ["Furniture and Equipment"] },
  { category: "Other Current Liability", accounts: ["Employee Reimbursements", "Opening Balance Adjustments", "Tax Payable", "TDS Payable", "Unearned Revenue"] },
  { category: "Expense", accounts: [
      "Advertising And Marketing", "Automobile Expense", "Bad Debt", "Bank Fees and Charges", 
      "Consultant Expense", "Contract Assets", "Depreciation And Amortisation", "Depreciation Expense", 
      "IT and Internet Expenses", "Janitorial Expense", "Lodging", "Meals and Entertainment", 
      "Merchandise", "Office Supplies", "Other Expenses", "Postage", "Printing and Stationery", 
      "Purchase Discounts", "Raw Materials And Consumables", "Rent Expense", "Repairs and Maintenance", 
      "Salaries and Employee Wages", "Telephone Expense", "Transportation Expense", "Travel Expense", 
      "Uncategorized"
    ] 
  },
  { category: "Cost Of Goods Sold", accounts: ["Cost of Goods Sold", "Job Costing", "Labor", "Materials", "Subcontractor"] }
];

const ItemEntryView = ({ onSaveSuccess, onCancel }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const editItem = location.state?.editItem || null;
  const isEditMode = !!editItem;

  const [loading, setLoading] = useState(false);
  const unitDropdownRef = useRef(null);
  const salesAccountDropdownRef = useRef(null);
  const purchaseAccountDropdownRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const [newItem, setNewItem] = useState(() => {
    if (editItem) {
      return {
        name: editItem.name || '',
        type: editItem.type || 'Goods',
        unit: editItem.unit && editItem.unit !== 'Select or type to add' ? editItem.unit : '',
        salesInformation: editItem.salesInformation !== undefined ? editItem.salesInformation : true,
        sellingPrice: editItem.sellingPrice || '',
        salesAccount: editItem.salesAccount || 'Sales',
        salesDescription: editItem.salesDescription || '',
        purchaseInformation: editItem.purchaseInformation !== undefined ? editItem.purchaseInformation : true,
        costPrice: editItem.costPrice || '',
        purchaseAccount: editItem.purchaseAccount || 'Cost of Goods Sold',
        purchaseDescription: editItem.purchaseDescription || '',
        preferredVendor: editItem.preferredVendor || '',
        imageUrl: editItem.imageUrl || '',
        reorderLevel: editItem.reorderLevel || '',
        stockGroupId: editItem.stockGroupId || '',
        stockCategoryId: editItem.stockCategoryId || '',
        unitOfMeasureId: editItem.unitOfMeasureId || '',
        godownId: editItem.godownId || '',
        openingStock: editItem.openingStock || ''
      };
    }
    return {
      name: '', type: 'Goods', unit: '',
      salesInformation: true, sellingPrice: '', salesAccount: 'Sales', salesDescription: '',
      purchaseInformation: true, costPrice: '', purchaseAccount: 'Cost of Goods Sold', purchaseDescription: '',
      preferredVendor: '', imageUrl: '',
      reorderLevel: '', stockGroupId: '', stockCategoryId: '', unitOfMeasureId: '', godownId: '', openingStock: ''
    };
  });

  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState('');
  const companyId = localStorage.getItem('companyId');

  // Dropdown States
  const [isUnitOpen, setIsUnitOpen] = useState(false);
  const [unitSearch, setUnitSearch] = useState('');
  const [availableUnits, setAvailableUnits] = useState(INITIAL_UNITS);
  
  const [isSalesAccountOpen, setIsSalesAccountOpen] = useState(false);
  const [salesAccountSearch, setSalesAccountSearch] = useState('');
  const [salesAccounts, setSalesAccounts] = useState(SALES_ACCOUNTS_STRUCTURE);

  const [isPurchaseAccountOpen, setIsPurchaseAccountOpen] = useState(false);
  const [purchaseAccountSearch, setPurchaseAccountSearch] = useState('');
  const [purchaseAccounts, setPurchaseAccounts] = useState(PURCHASE_ACCOUNTS_STRUCTURE);

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [creationSource, setCreationSource] = useState('Purchase'); 
  const [vendors, setVendors] = useState([]);
  const [stockGroups, setStockGroups] = useState([]);
  const [stockCategories, setStockCategories] = useState([]);
  const [uomUnits, setUomUnits] = useState([]);
  const [godowns, setGodowns] = useState([]);

  useEffect(() => {
    if (companyId) {
      purchaseAPI.getVendors(companyId)
        .then(res => setVendors(res.data || []))
        .catch(err => console.error("Error fetching vendors:", err));
      
      inventoryAPI.getStockGroups(companyId)
        .then(res => setStockGroups(res.data || []))
        .catch(err => console.error("Error fetching stock groups:", err));

      inventoryAPI.getStockCategories(companyId)
        .then(res => setStockCategories(res.data || []))
        .catch(err => console.error("Error fetching stock categories:", err));

      inventoryAPI.getUnits(companyId)
        .then(res => setUomUnits(res.data || []))
        .catch(err => console.error("Error fetching units:", err));

      inventoryAPI.getGodowns(companyId)
        .then(res => setGodowns(res.data || []))
        .catch(err => console.error("Error fetching godowns:", err));
    }
  }, [companyId]);

  useEffect(() => {
    if (uomUnits.length > 0) {
      const formatted = uomUnits.map(u => `${u.symbol.toUpperCase()} - ${u.formalName}`);
      setAvailableUnits(formatted);
    } else {
      setAvailableUnits(INITIAL_UNITS);
    }
  }, [uomUnits]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (unitDropdownRef.current && !unitDropdownRef.current.contains(event.target)) setIsUnitOpen(false);
      if (salesAccountDropdownRef.current && !salesAccountDropdownRef.current.contains(event.target)) setIsSalesAccountOpen(false);
      if (purchaseAccountDropdownRef.current && !purchaseAccountDropdownRef.current.contains(event.target)) setIsPurchaseAccountOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSalesToggle = (val) => {
    setNewItem(prev => ({ ...prev, salesInformation: val }));
    if (!val && formError.toLowerCase().includes('sales')) {
      setFormError('');
    }
  };

  const handlePurchaseToggle = (val) => {
    setNewItem(prev => ({ ...prev, purchaseInformation: val }));
    if (!val && formError.toLowerCase().includes('purchase')) {
      setFormError('');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newItem.name.trim()) {
      setFormError('Item Name is required. Please provide a valid name before saving.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (newItem.salesInformation && (!newItem.sellingPrice || parseFloat(newItem.sellingPrice) <= 0)) {
       setFormError('Selling Price is required. Please provide a value in Sales Information.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (newItem.purchaseInformation && (!newItem.costPrice || parseFloat(newItem.costPrice) <= 0)) {
       setFormError('Cost Price is required. Please provide a value in Purchase Information.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!companyId) {
      setFormError('No active company found. Please reload or select a company.');
      return;
    }
    setFormError('');
    setLoading(true);
    try {
      let savedItem;
      if (isEditMode) {
        const res = await inventoryAPI.updateItem(editItem.id, { ...newItem, companyId });
        savedItem = res.data;
      } else {
        const res = await inventoryAPI.createItem({ ...newItem, companyId });
        savedItem = res.data;
      }
      navigate('/inventory', { state: { openItem: savedItem } });
    } catch (err) {
      if (err.response?.status === 401) return;
      alert("Error saving item: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const filteredUnits = availableUnits.filter(u => u.toLowerCase().includes(unitSearch.toLowerCase()));
  const handleUnitSelect = (u) => {
    const symbolPart = u.includes(' - ') ? u.split(' - ')[0].toLowerCase() : u.toLowerCase();
    const foundUom = uomUnits.find(item => item.symbol.toLowerCase() === symbolPart);
    setNewItem({ 
      ...newItem, 
      unit: u,
      unitOfMeasureId: foundUom ? foundUom.id : ''
    });
    setIsUnitOpen(false);
    setUnitSearch('');
  };
  
  const handleSalesAccountSelect = (acc) => {
    setNewItem({ ...newItem, salesAccount: acc });
    setIsSalesAccountOpen(false);
    setSalesAccountSearch('');
  };

  const handlePurchaseAccountSelect = (acc) => {
    setNewItem({ ...newItem, purchaseAccount: acc });
    setIsPurchaseAccountOpen(false);
    setPurchaseAccountSearch('');
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
      if (err.response?.status === 401) return;
      alert("Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  const openNewAccountModal = (source) => {
    setCreationSource(source);
    setIsAccountModalOpen(true);
    setIsSalesAccountOpen(false);
    setIsPurchaseAccountOpen(false);
  };

  const onAccountCreated = (name) => {
    if (creationSource === 'Sales') {
      const updated = [...salesAccounts];
      const group = updated.find(g => g.category === 'Income');
      if (group && !group.accounts.includes(name)) group.accounts.push(name);
      setSalesAccounts(updated);
      setNewItem(prev => ({ ...prev, salesAccount: name }));
    } else {
      const updated = [...purchaseAccounts];
      const group = updated.find(g => g.category === 'Expense');
      if (group && !group.accounts.includes(name)) group.accounts.push(name);
      setPurchaseAccounts(updated);
      setNewItem(prev => ({ ...prev, purchaseAccount: name }));
    }
  };

  const SectionHeader = ({ icon: Icon, title, color }) => (
    <div className="flex items-center gap-2 mb-6">
      <div className={`p-2 rounded-lg ${color} bg-opacity-10`}>
        <Icon size={18} className={color.replace('bg-', 'text-')} />
      </div>
      <h3 className="text-[16px] font-bold text-slate-800 tracking-tight lowercase first-letter:uppercase">{title}</h3>
    </div>
  );

  const Toggle = ({ enabled, onChange }) => (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${enabled ? 'bg-blue-600' : 'bg-slate-200'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );

  return (
    <div className="bg-[#F9FAFB] min-h-screen font-sans pb-24">
      <CreateAccountModal 
        isOpen={isAccountModalOpen} 
        onClose={() => setIsAccountModalOpen(false)} 
        onSuccess={onAccountCreated}
        initialType={creationSource === 'Sales' ? 'Income' : 'Cost Of Goods Sold'}
      />

      {/* ── STICKY HEADER ──────────────────────────── */}
      <header className="px-6 py-3 border-b border-slate-200 flex items-center justify-between bg-white z-[100] sticky top-0 shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              if (onCancel) onCancel();
              else if (location.state?.returnTo) navigate(location.state.returnTo);
              else window.history.length > 2 ? navigate(-1) : navigate('/inventory');
            }} 
            className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 transition-colors" 
            title="Go Back"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="p-1.5 bg-slate-100 rounded text-slate-600">
            <Package size={18} />
          </div>
          <h2 className="text-[17px] font-bold text-slate-800 tracking-tight">{isEditMode ? 'Edit Item' : 'Add New Item'}</h2>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              if (onCancel) onCancel();
              else if (location.state?.returnTo) navigate(location.state.returnTo);
              else window.history.length > 2 ? navigate(-1) : navigate('/inventory');
            }} 
            className="px-6 py-2 text-[13px] font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={handleCreate}
            disabled={loading}
            className="px-8 py-2.5 bg-[#1e61f0] text-white text-[13px] font-bold rounded-xl hover:bg-[#1a54d1] shadow-lg shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <RefreshCcw size={16} className="animate-spin" /> : <Save size={16} />}
            {isEditMode ? 'UPDATE ITEM' : 'SAVE ITEM'}
          </button>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto mt-10 space-y-8 px-6 pb-20">

        {/* ── FORM ERROR BANNER ───────────────────────── */}
        {formError && (
          <div className="bg-rose-50 border-l-4 border-rose-500 p-4 shadow-sm rounded-r-xl animate-fade-in flex items-center gap-3">
             <AlertTriangle size={20} className="text-rose-500 shrink-0" />
             <div>
               <h3 className="text-[13px] font-bold text-rose-800">Validation Error</h3>
               <p className="text-[13px] text-rose-600 mt-0.5">{formError}</p>
             </div>
          </div>
        )}

        {/* ── CARD 1: BASIC INFORMATION ───────────────── */}
        <div className="bg-white rounded-[12px] p-8 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] animate-slide-up">
          <SectionHeader icon={Package} title="Basic Information 🧾" color="bg-blue-600" />
          
          <div className="flex flex-col md:flex-row gap-12">
            <div className="flex-1 space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Name <span className="text-rose-500">*</span></label>
                <div className="relative group">
                   <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors">
                      <LayoutList size={18} />
                   </div>
                     <input 
                       required 
                       value={newItem.name} 
                       onChange={e => {
                         setNewItem({...newItem, name: e.target.value});
                         if (formError) setFormError('');
                       }}
                       placeholder="Item Name"
                       className={`w-full bg-slate-50/50 border rounded-xl pl-12 pr-4 py-3 text-[13px] font-bold text-slate-800 outline-none focus:bg-white transition-all ${
                         formError ? 'border-rose-500 focus:ring-4 focus:ring-rose-500/10' : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5'
                       }`} 
                     />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Type</label>
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button 
                      type="button"
                      onClick={() => setNewItem({...newItem, type: 'Goods'})}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${newItem.type === 'Goods' ? 'bg-white shadow-md text-[#1e61f0]' : 'text-slate-500 hover:text-slate-800'}`}
                    >GOODS</button>
                    <button 
                      type="button"
                      onClick={() => setNewItem({...newItem, type: 'Service'})}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${newItem.type === 'Service' ? 'bg-white shadow-md text-[#1e61f0]' : 'text-slate-500 hover:text-slate-800'}`}
                    >SERVICE</button>
                  </div>
                </div>

                <div className="space-y-2 relative" ref={unitDropdownRef}>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Unit</label>
                  <div 
                    onClick={() => setIsUnitOpen(!isUnitOpen)}
                    className="flex items-center justify-between bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-[13px] font-bold text-slate-700 cursor-pointer hover:border-blue-300 transition-all"
                  >
                    <span className={!newItem.unit ? 'text-slate-400 font-medium' : 'text-slate-900'}>
                      {newItem.unit || 'Select or type to add'}
                    </span>
                    <ChevronDown size={14} className={`text-slate-400 transition-transform ${isUnitOpen ? 'rotate-180' : ''}`} />
                  </div>
                  {isUnitOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 shadow-2xl rounded-2xl z-[150] overflow-hidden animate-slide-up">
                      <div className="p-3 border-b border-slate-50 bg-slate-50/30">
                        <div className="relative">
                          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input 
                            autoFocus 
                            placeholder="Search or add..." 
                            value={unitSearch} 
                            onChange={e => setUnitSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-xs font-bold outline-none bg-white border border-slate-200 rounded-xl"
                          />
                        </div>
                      </div>
                      <div className="max-h-[200px] overflow-y-auto py-1">
                        {filteredUnits.length > 0 ? filteredUnits.map(u => (
                          <div key={u} onClick={() => handleUnitSelect(u)} className={`px-4 py-2.5 text-[13px] font-bold cursor-pointer transition-colors ${newItem.unit === u ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
                            {u}
                          </div>
                        )) : <div className="px-4 py-6 text-center text-slate-400 text-xs italic">No units found...</div>}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* TALLY MASTERS / INVENTORY FIELDS */}
              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Stock Group</label>
                  <select
                    value={newItem.stockGroupId}
                    onChange={e => setNewItem({...newItem, stockGroupId: e.target.value})}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-[13px] font-bold text-slate-800 outline-none appearance-none focus:border-blue-500 transition-all bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C/polyline%3E%3C/svg%3E')] bg-[length:14px] bg-[right_15px_center] bg-no-repeat cursor-pointer"
                  >
                    <option value="">Primary Group</option>
                    {stockGroups.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Stock Category</label>
                  <select
                    value={newItem.stockCategoryId}
                    onChange={e => setNewItem({...newItem, stockCategoryId: e.target.value})}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-[13px] font-bold text-slate-800 outline-none appearance-none focus:border-blue-500 transition-all bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C/polyline%3E%3C/svg%3E')] bg-[length:14px] bg-[right_15px_center] bg-no-repeat cursor-pointer"
                  >
                    <option value="">No Category</option>
                    {stockCategories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6 pt-2">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Godown / Warehouse</label>
                  <select
                    value={newItem.godownId}
                    onChange={e => setNewItem({...newItem, godownId: e.target.value})}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-[13px] font-bold text-slate-800 outline-none appearance-none focus:border-blue-500 transition-all bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C/polyline%3E%3C/svg%3E')] bg-[length:14px] bg-[right_15px_center] bg-no-repeat cursor-pointer"
                  >
                    <option value="">Main Location</option>
                    {godowns.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Reorder Level</label>
                  <input
                    type="number"
                    value={newItem.reorderLevel}
                    onChange={e => setNewItem({...newItem, reorderLevel: e.target.value})}
                    placeholder="0"
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-[13px] font-bold text-slate-800 outline-none focus:border-blue-500 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Opening Stock</label>
                  <input
                    type="number"
                    value={newItem.openingStock}
                    disabled={isEditMode}
                    onChange={e => setNewItem({...newItem, openingStock: e.target.value})}
                    placeholder="0.00"
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-[13px] font-bold text-slate-800 outline-none focus:border-blue-500 transition-all disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            <div className="w-full md:w-[240px] space-y-3">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Item Preview</label>
              <div 
                onClick={() => fileInputRef.current.click()}
                className="w-full aspect-square border-2 border-dashed border-slate-200 rounded-[24px] bg-slate-50/50 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all group overflow-hidden relative"
              >
                 {uploading ? (
                    <div className="flex flex-col items-center gap-3 animate-pulse">
                      <RefreshCcw size={32} className="animate-spin text-blue-500" />
                      <span className="text-[10px] font-bold uppercase text-blue-400">Syncing...</span>
                    </div>
                 ) : newItem.imageUrl ? (
                    <img src={newItem.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Item" />
                 ) : (
                    <div className="flex flex-col items-center text-center px-6">
                       <div className="w-12 h-12 rounded-2xl bg-white shadow-md flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <Upload size={20} className="text-blue-500" />
                       </div>
                       <p className="text-[11px] font-bold text-slate-400 uppercase leading-relaxed tracking-wider">
                          Drop your item image or <span className="text-blue-500 underline">Browse</span>
                       </p>
                    </div>
                 )}
                 <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
              </div>
            </div>
          </div>
        </div>

        {/* ── CARD 2: SALES INFORMATION ───────────────── */}
        <div className={`bg-white rounded-[12px] p-0 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] transition-all border-l-4 ${newItem.salesInformation ? 'border-emerald-500' : 'border-slate-200 opacity-60'}`}>
           <div className="p-8 pb-4 flex justify-between items-center">
              <SectionHeader icon={Coins} title="Sales Information 💰" color="bg-emerald-600" />
              <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                 <span className="text-[12px] font-bold uppercase tracking-widest text-slate-500">Sell this item?</span>
                 <Toggle enabled={newItem.salesInformation} onChange={handleSalesToggle} />
              </div>
           </div>
           
           <div className={`transition-all duration-300 ${newItem.salesInformation ? 'max-h-[1000px] opacity-100 p-8 pt-0' : 'max-h-0 opacity-0 pointer-events-none'}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                 <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Selling Price <span className="text-rose-500">*</span></label>
                    <div className="relative">
                       <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 font-bold text-xs">INR</div>
                       <input 
                         type="number" 
                         value={newItem.sellingPrice}
                         onChange={e => {
                           setNewItem({...newItem, sellingPrice: e.target.value});
                           if (formError) setFormError('');
                         }}
                         className={`w-full bg-emerald-50/20 border rounded-xl pl-12 pr-4 py-3 text-[13px] font-bold text-slate-900 outline-none transition-all ${
                           formError && newItem.salesInformation && (!newItem.sellingPrice || parseFloat(newItem.sellingPrice) <= 0)
                             ? 'border-rose-500 focus:ring-4 focus:ring-rose-500/10'
                             : 'border-emerald-100 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/5'
                         }`}
                       />
                    </div>
                 </div>

                 <div className="space-y-2 relative" ref={salesAccountDropdownRef}>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Income Account <span className="text-rose-500">*</span></label>
                    <div 
                      onClick={() => setIsSalesAccountOpen(!isSalesAccountOpen)}
                      className="flex items-center justify-between bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-[13px] font-bold text-slate-700 cursor-pointer hover:border-emerald-300 transition-all"
                    >
                       <span className="text-slate-900">{newItem.salesAccount}</span>
                       <ChevronDown size={14} className="text-slate-400" />
                    </div>
                    {isSalesAccountOpen && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 shadow-2xl rounded-2xl z-[140] overflow-hidden">
                        <div className="p-3 border-b border-slate-50">
                          <input 
                            autoFocus 
                            placeholder="Search accounts..." 
                            value={salesAccountSearch}
                            onChange={e => setSalesAccountSearch(e.target.value)}
                            className="w-full px-4 py-2 text-xs font-bold outline-none bg-slate-50 rounded-xl"
                          />
                        </div>
                        <div className="max-h-[250px] overflow-y-auto">
                           <div onClick={() => handleSalesAccountSelect('None')} className="px-6 py-2 text-[13px] font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer transition-colors border-b border-slate-100">
                              None
                           </div>
                           {salesAccounts.map(sec => (
                             <div key={sec.category} className="mb-2">
                                <div className="px-4 py-1.5 text-[10px] font-bold text-slate-400 uppercase bg-slate-50/50">{sec.category}</div>
                                {sec.accounts.filter(a => a.toLowerCase().includes(salesAccountSearch.toLowerCase())).map(acc => (
                                  <div key={acc} onClick={() => handleSalesAccountSelect(acc)} className="px-6 py-2 text-[13px] font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer transition-colors">
                                    {acc}
                                  </div>
                                ))}
                             </div>
                           ))}
                        </div>
                        <button 
                          onClick={() => openNewAccountModal('Sales')}
                          className="w-full py-3 bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-widest hover:bg-emerald-100 transition-colors"
                        >+ New Account</button>
                      </div>
                    )}
                 </div>

                 <div className="md:col-span-2 space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Description</label>
                    <textarea 
                      value={newItem.salesDescription}
                      onChange={e => setNewItem({...newItem, salesDescription: e.target.value})}
                      placeholder="Product details for customers..."
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 h-20 resize-none transition-all"
                    />
                 </div>
              </div>
           </div>
        </div>

        {/* ── CARD 3: PURCHASE INFORMATION ───────────────── */}
        <div className={`bg-white rounded-[12px] p-0 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] transition-all border-l-4 ${newItem.purchaseInformation ? 'border-amber-500' : 'border-slate-200 opacity-60'}`}>
           <div className="p-8 pb-4 flex justify-between items-center">
              <SectionHeader icon={ShoppingCart} title="Purchase Information 📦" color="bg-amber-600" />
              <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                 <span className="text-[12px] font-bold uppercase tracking-widest text-slate-500">Buy this item?</span>
                 <Toggle enabled={newItem.purchaseInformation} onChange={handlePurchaseToggle} />
              </div>
           </div>

           <div className={`transition-all duration-300 ${newItem.purchaseInformation ? 'max-h-[1000px] opacity-100 p-8 pt-0' : 'max-h-0 opacity-0 pointer-events-none'}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                 <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Cost Price <span className="text-rose-500">*</span></label>
                    <div className="relative">
                       <div className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-600 font-bold text-xs">INR</div>
                       <input 
                         type="number" 
                         value={newItem.costPrice}
                         onChange={e => {
                           setNewItem({...newItem, costPrice: e.target.value});
                           if (formError) setFormError('');
                         }}
                         className={`w-full bg-amber-50/20 border rounded-xl pl-12 pr-4 py-3 text-[13px] font-bold text-slate-900 outline-none transition-all ${
                           formError && newItem.purchaseInformation && (!newItem.costPrice || parseFloat(newItem.costPrice) <= 0)
                             ? 'border-rose-500 focus:ring-4 focus:ring-rose-500/10'
                             : 'border-amber-100 focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/5'
                         }`}
                       />
                    </div>
                 </div>

                 <div className="space-y-2 relative" ref={purchaseAccountDropdownRef}>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Cost Account <span className="text-rose-500">*</span></label>
                    <div 
                      onClick={() => setIsPurchaseAccountOpen(!isPurchaseAccountOpen)}
                      className="flex items-center justify-between bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-[13px] font-bold text-slate-700 cursor-pointer hover:border-amber-300 transition-all"
                    >
                       <span className="text-slate-900">{newItem.purchaseAccount}</span>
                       <ChevronDown size={14} className="text-slate-400" />
                    </div>
                    {isPurchaseAccountOpen && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 shadow-2xl rounded-2xl z-[130] overflow-hidden">
                        <div className="p-3 border-b border-slate-50">
                          <input 
                            autoFocus 
                            placeholder="Search accounts..." 
                            value={purchaseAccountSearch}
                            onChange={e => setPurchaseAccountSearch(e.target.value)}
                            className="w-full px-4 py-2 text-xs font-bold outline-none bg-slate-50 rounded-xl"
                          />
                        </div>
                        <div className="max-h-[200px] overflow-y-auto">
                           <div onClick={() => handlePurchaseAccountSelect('None')} className="px-6 py-2 text-[13px] font-bold text-slate-700 hover:bg-amber-50 hover:text-amber-700 cursor-pointer transition-colors border-b border-slate-100">
                              None
                           </div>
                           {purchaseAccounts.map(sec => (
                             <div key={sec.category} className="mb-2">
                                <div className="px-4 py-1.5 text-[10px] font-bold text-slate-400 uppercase bg-slate-50/50">{sec.category}</div>
                                {sec.accounts.filter(a => a.toLowerCase().includes(purchaseAccountSearch.toLowerCase())).map(acc => (
                                  <div key={acc} onClick={() => handlePurchaseAccountSelect(acc)} className="px-6 py-2 text-[13px] font-bold text-slate-700 hover:bg-amber-50 hover:text-amber-700 cursor-pointer transition-colors">
                                    {acc}
                                  </div>
                                ))}
                             </div>
                           ))}
                        </div>
                         <button 
                          onClick={() => openNewAccountModal('Purchase')}
                          className="w-full py-3 bg-amber-50 text-amber-700 text-xs font-bold uppercase tracking-widest hover:bg-amber-100 transition-colors"
                        >+ New Account</button>
                      </div>
                    )}
                 </div>

                 <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Preferred Vendor</label>
                    <select 
                      value={newItem.preferredVendor} 
                      onChange={e => setNewItem({...newItem, preferredVendor: e.target.value})}
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-[13px] font-bold text-slate-800 outline-none appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C/polyline%3E%3C/svg%3E')] bg-[length:14px] bg-[right_15px_center] bg-no-repeat focus:border-amber-500 transition-all"
                    >
                       <option value="">Select Vendor</option>
                       {vendors.map(v => (
                         <option key={v.id} value={v.name}>{v.name}</option>
                       ))}
                    </select>
                 </div>

                 <div className="md:col-span-2 space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Purchase Description</label>
                    <textarea 
                      value={newItem.purchaseDescription}
                      onChange={e => setNewItem({...newItem, purchaseDescription: e.target.value})}
                      placeholder="Product details for vendors..."
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 h-20 resize-none transition-all"
                    />
                 </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default ItemEntryView;
