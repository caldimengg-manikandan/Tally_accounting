import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Plus, Trash2, Save, Printer, ArrowLeft, 
  Search, Info, Check, Loader2, X, Settings, ChevronDown, ChevronUp, HelpCircle, MoreHorizontal, File, AlertTriangle,
  ShieldCheck, FileText, Edit2, Package, Mail, Phone, ChevronRight, Send,
  Scan, History, RefreshCcw
} from 'lucide-react';
import { useRef } from 'react';
import { ledgerAPI, inventoryAPI, salesAPI, companyAPI, projectAPI, mailAPI } from '../../services/api';
import { getCurrencyDisplay } from '../../utils/currencies';
import ConfirmModal from '../../components/ConfirmModal';
import EmailSendModal from '../../components/EmailSendModal';

// ─────────────────────────────────────────────────
// ACCOUNT OPTIONS DEFINITION
// ─────────────────────────────────────────────────
const ACCOUNT_OPTIONS = {
  "Other Current Asset": [
    "Advance Tax", "Employee Advance", "Prepaid Expenses", "TDS Receivable"
  ],
  "Fixed Asset": [
    "Furniture and Equipment"
  ],
  "Other Current Liability": [
    "Employee Reimbursements", "Opening Balance Adjustments", "TDS Payable", "Unearned Revenue"
  ],
  "Non Current Liability": [
    "Construction Loans", "Mortgages"
  ],
  "Equity": [
    "Capital Stock", "Distributions", "Dividends Paid", "Drawings", "Investments", "Opening Balance Offset", "Owner's Equity"
  ],
  "Income": [
    "Discount", "General Income", "Interest Income", "Late Fee Income", "Other Charges", "Sales", "Shipping Charge"
  ],
  "Expense": [    
    "Advertising And Marketing", "Automobile Expense", "Bad Debt", "Bank Fees and Charges", "Consultant Expense", "Contract Assets", "Credit Card Charges", "Depreciation And Amortisation", "Depreciation Expense", "IT and Internet Expenses", "Janitorial Expense", "Lodging", "Meals and Entertainment", "Merchandise", "Office Supplies", "Other Expenses", "Postage", "Printing and Stationery", "Purchase Discounts", "Raw Materials And Consumables", "Rent Expense", "Repairs and Maintenance", "Salaries and Employee Wages", "Telephone Expense", "Transportation Expense", "Travel Expense", "Uncategorized"
  ],
  "Cost Of Goods Sold": [
    "Cost of Goods Sold", "Job Costing", "Labor", "Materials", "Subcontractor"
  ]
};

// ─────────────────────────────────────────────────
// ITEM SEARCH SELECTOR (FOR TABLE CELLS)
// ─────────────────────────────────────────────────
// ─────────────────────────────────────────────────
const ItemSearchSelector = ({ value, onChange, items: propItems, placeholder, onNewItem, currencySymbol = '₹', usageType = 'sales' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [localItems, setLocalItems] = useState([]);
    const [fetching, setFetching] = useState(false);
    const companyId = sessionStorage.getItem('companyId');
    const dropdownRef = useRef(null);

    // Combine and Sort items: prioritize prop items, then local items
    const allItems = useMemo(() => {
        const source = (propItems && propItems.length > 0) ? propItems : localItems;
        return [...source].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }, [propItems, localItems]);
    
    const filteredItems = allItems.filter(it => {
        const matchesSearch = (it.name || '').toLowerCase().includes(search.toLowerCase()) || 
                             (it.salesDescription || '').toLowerCase().includes(search.toLowerCase());
        const isSalesItem = it.salesInformation !== false && it.salesInformation !== 0 && it.salesInformation !== 'false'; // Default to true if missing
        return matchesSearch && isSalesItem;
    });

    const fetchItems = async () => {
        if (!companyId) return;
        setFetching(true);
        try {
            const res = await inventoryAPI.getByCompany(companyId, usageType);
            const data = Array.isArray(res.data) ? res.data : [];
            setLocalItems(data);
        } catch (err) {
            console.error("Fetch error:", err);
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        if (isOpen && (!propItems || propItems.length === 0)) {
            fetchItems();
        }
    }, [isOpen, propItems]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full h-11 px-4 bg-white border border-slate-200 rounded-lg text-[13px] font-medium text-slate-700 flex items-center justify-between cursor-pointer shadow-sm hover:border-blue-400 transition-all group"
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    <Package size={14} className="text-slate-400 shrink-0" />
                    <span className={`truncate ${!value ? 'text-slate-400 italic' : 'text-slate-900 font-bold'}`}>
                        {value || placeholder}
                    </span>
                </div>
                <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 shadow-2xl rounded-xl z-[500] flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-1 min-w-[400px]">
                    <div className="p-2 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                autoFocus
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search items..."
                                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-[12px] font-bold outline-none focus:border-blue-500 transition-all"
                            />
                        </div>
                        <button 
                            onClick={(e) => { e.stopPropagation(); fetchItems(); }}
                            title="Sync Items"
                            className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 text-slate-400 hover:text-blue-600 transition-all"
                        >
                            <RefreshCcw size={14} className={fetching ? 'animate-spin' : ''} />
                        </button>
                    </div>
                    
                    <div className="max-h-[320px] overflow-y-auto py-1 no-scrollbar">
                        {filteredItems.length > 0 ? (
                            filteredItems.map((it, idx) => (
                                <div 
                                    key={it.id || idx} 
                                    onClick={() => {
                                        onChange(it);
                                        setIsOpen(false);
                                        setSearch('');
                                    }}
                                    className="px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors group border-b border-slate-50 last:border-0"
                                >
                                    <div className="flex items-center justify-between mb-0.5">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${it.type === 'Service' ? 'bg-purple-400' : 'bg-blue-400'}`} title={it.type} />
                                            <div className="text-[14px] font-bold text-slate-800 group-hover:text-blue-700 transition-colors">{it.name || 'Unnamed Item'}</div>
                                        </div>
                                        <div className="text-[13px] font-black text-slate-900 tabular-nums">
                                            {currencySymbol} {parseFloat(it.sellingPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="text-[11px] text-slate-400 font-medium truncate italic max-w-[250px]">
                                            {it.salesDescription || 'No description'}
                                        </div>
                                        {it.unit && (
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter bg-slate-100 px-1.5 rounded">
                                                {it.unit}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="px-4 py-12 text-center flex flex-col items-center gap-2">
                                <Package size={24} className="text-slate-200" />
                                <span className="text-slate-400 text-[12px] font-bold uppercase tracking-widest italic">
                                    {fetching ? 'Syncing items...' : 'No items found'}
                                </span>
                            </div>
                        )}
                    </div>
                    
                    <div className="border-t border-slate-100 p-2 bg-slate-50">
                        <button 
                            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-[12px] font-bold text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-200 hover:border-blue-600 rounded-lg transition-all"
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                if (onNewItem) onNewItem();
                            }}
                        >
                            <Plus size={16} strokeWidth={3} /> ADD NEW ITEM
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─────────────────────────────────────────────────
// MANAGE SALESPERSONS MODAL
// ─────────────────────────────────────────────────
const ManageSalespersonsModal = ({ isOpen, onClose, salespersons, onSave, onSelect }) => {
    const [search, setSearch] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');

    if (!isOpen) return null;

    const filtered = salespersons.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.email && s.email.toLowerCase().includes(search.toLowerCase()))
    );

    const handleSaveAndSelect = () => {
        if (!newName.trim()) return;
        const entry = { id: Date.now(), name: newName.trim(), email: newEmail.trim() };
        const updated = [...salespersons, entry];
        localStorage.setItem('tally_salespersons', JSON.stringify(updated));
        onSave(updated);
        onSelect(entry.name);
        setNewName('');
        setNewEmail('');
        setShowAddForm(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-[0_30px_80px_rgba(0,0,0,0.2)] w-full max-w-lg overflow-hidden animate-scale-up">
                {/* Modal Header */}
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-[18px] font-bold text-slate-900 tracking-tight">Manage Salespersons</h3>
                    <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition-colors"><X size={18}/></button>
                </div>

                {/* Search + New Button */}
                <div className="px-6 py-4 flex items-center gap-3 border-b border-slate-100">
                    <div className="relative flex-1">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            autoFocus
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search Salesperson"
                            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-[13px] font-medium outline-none focus:border-blue-500 transition-all"
                        />
                    </div>
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="px-4 py-2 bg-[#1e61f0] text-white text-[13px] font-bold rounded-lg hover:bg-blue-700 transition-all flex items-center gap-1.5 whitespace-nowrap shadow-md shadow-blue-100"
                    >
                        <Plus size={14}/> New Salesperson
                    </button>
                </div>

                {/* Inline Add Form */}
                {showAddForm && (
                    <div className="mx-6 my-4 p-5 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-[11px] font-bold text-red-500 uppercase tracking-widest mb-1.5">Name*</label>
                                <input
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    className="w-full h-9 px-3 border border-slate-300 rounded text-[13px] font-medium outline-none focus:border-blue-500 bg-white transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-red-500 uppercase tracking-widest mb-1.5">Email*</label>
                                <input
                                    type="email"
                                    value={newEmail}
                                    onChange={e => setNewEmail(e.target.value)}
                                    className="w-full h-9 px-3 border border-slate-300 rounded text-[13px] font-medium outline-none focus:border-blue-500 bg-white transition-all"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleSaveAndSelect}
                                disabled={!newName.trim()}
                                className="px-5 py-2 bg-[#1e61f0] text-white text-[12px] font-bold rounded hover:bg-blue-700 transition-all disabled:opacity-40 shadow-sm"
                            >
                                Save and Select
                            </button>
                            <button
                                onClick={() => { setShowAddForm(false); setNewName(''); setNewEmail(''); }}
                                className="px-5 py-2 bg-white border border-slate-200 text-slate-600 text-[12px] font-bold rounded hover:bg-slate-50 transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Table */}
                <div className="px-6">
                    <div className="grid grid-cols-2 py-3 border-b border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Salesperson Name</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</span>
                    </div>
                    <div className="max-h-56 overflow-y-auto no-scrollbar">
                        {filtered.length === 0 ? (
                            <div className="py-12 text-center text-slate-400 text-[13px] font-medium italic">No salespersons found.</div>
                        ) : (
                            filtered.map(s => (
                                <div
                                    key={s.id}
                                    onClick={() => { onSelect(s.name); onClose(); }}
                                    className="grid grid-cols-2 py-3 border-b border-slate-50 hover:bg-blue-50 cursor-pointer rounded transition-colors"
                                >
                                    <span className="text-[13px] font-bold text-[#1e61f0]">{s.name}</span>
                                    <span className="text-[13px] text-slate-500 font-medium">{s.email || '—'}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="px-6 py-4" />
            </div>
        </div>
    );
};

export default function ProfessionalInvoiceView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const companyId = sessionStorage.getItem('companyId');

  // ─── State ────────────────────────────────────────────────────────
  const [customers, setCustomers] = useState([]);
  const [items,     setItems]     = useState([]);
  const [projects,  setProjects]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [currencySymbol, setCurrencySymbol] = useState('₹');
  
  // Header Info
  const [customerId, setCustomerId] = useState('');
  const [projectId,  setProjectId]  = useState('');
  const [invoiceNo,  setInvoiceNo]  = useState('INV-000001');
  const [orderNo,    setOrderNo]    = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate,     setDueDate]     = useState(new Date().toISOString().split('T')[0]);
  const [terms,       setTerms]       = useState('Due on Receipt');
  const [arLedger,    setArLedger]    = useState('Accounts Receivable');
  const [salesperson, setSalesperson] = useState('');
  const [salespersons, setSalespersons] = useState(() => {
    try { return JSON.parse(localStorage.getItem('tally_salespersons') || '[]'); } catch { return []; }
  });
  const [showSalespersonDropdown, setShowSalespersonDropdown] = useState(false);
  const [salespersonSearch, setSalespersonSearch] = useState('');
  const [showManageSalespersons, setShowManageSalespersons] = useState(false);
  const salespersonDropdownRef = React.useRef(null);
  const [subject,     setSubject]     = useState('');
  const [currencyCode, setCurrencyCode] = useState('INR');
  const [tdsType, setTdsType] = useState('TDS');
  const [exchangeRate, setExchangeRate] = useState(1.00);
  const [showExchangeRatePopover, setShowExchangeRatePopover] = useState(false);
  const [tempExchangeRate, setTempExchangeRate] = useState(1.00);
  const [recalculatePrices, setRecalculatePrices] = useState(true);
  const exchangeRateRef = React.useRef(null);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const projectDropdownRef = React.useRef(null);
  const [projectSearch, setProjectSearch] = useState('');

  // Handle Currency Change & Exchange Rate (Real-time API) - Now explicitly called instead of useEffect
  const fetchLiveExchangeRate = async (code) => {
    const cleanCode = (code || 'INR').split(/[ -]/)[0].trim();
    if (cleanCode === 'INR') {
      setExchangeRate(1.00);
      setTempExchangeRate(1.00);
      return;
    }
    
    try {
      const res = await fetch(`https://open.er-api.com/v6/latest/INR`);
      const data = await res.json();
      
      if (data && data.rates) {
        const rateToInr = data.rates[cleanCode];
        if (rateToInr) {
           const actualRate = parseFloat((1 / rateToInr).toFixed(2));
           setExchangeRate(actualRate);
           setTempExchangeRate(actualRate);
        }
      }
    } catch (err) {
      console.error('Failed to fetch real-time exchange rate', err);
    }
  };

  // Line Items
  const [lineItems, setLineItems] = useState([
    { id: Date.now(), itemId: '', description: '', quantity: 0, rate: 0, discount: 0, discountType: '%', amount: 0 }
  ]);

  // Totals & Adjustments
  const [discountPercent, setDiscountPercent] = useState(0);
  const [adjustment,      setAdjustment]      = useState(0);
  const [taxType,         setTaxType]         = useState('GST');
  const [gstPercent,      setGstPercent]      = useState(0); // Default 0% - applied only when a tax is selected
  const [taxId,           setTaxId]           = useState('');

  const [notes,      setNotes]      = useState('Thanks for your business.');
  const [termsText,  setTermsText]  = useState('');

  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const customerDropdownRef = React.useRef(null);

  const [isSaving, setIsSaving] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [savedInvoiceData, setSavedInvoiceData] = useState(null);
  
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', type: 'info', showCancel: false });

  // ─── Load Data ──────────────────────────────────────────────────
  useEffect(() => {
    if (!companyId) return;
    const loadData = async () => {
      setLoading(true);
      try {
        let allLedgers = [];
        // Fetch Ledgers (Customers)
        try {
          const lRes = await ledgerAPI.getByCompany(companyId);
          allLedgers = Array.isArray(lRes.data) ? lRes.data : [];
          const filteredCustomers = allLedgers.filter(l => {
            const gName = (l.Group?.name || '').toLowerCase();
            const gNameDirect = (l.groupName || '').toLowerCase();
            const lName = (l.name || '').toLowerCase();
            
            return gName.includes('debtor') || gName.includes('customer')
                || gNameDirect.includes('debtor') || gNameDirect.includes('customer')
                || lName.includes('customer') || l.accountType === 'Asset'; // Broadened filter
          });
          setCustomers(filteredCustomers);
          if (filteredCustomers.length === 0 && allLedgers.length > 0) {
            console.warn("Customers filtered out! Total ledgers:", allLedgers.length);
          }
        } catch (e) { 
          console.error("Ledger load error:", e);
          setCustomers([]); // Ensure state is cleared on error
        }

        // Fetch Inventory Items (Crucial for the dropdown)
        try {
          const iRes = await inventoryAPI.getByCompany(companyId, 'sales');
          const fetchedItems = Array.isArray(iRes.data) ? iRes.data : [];
          setItems(fetchedItems);
        } catch (e) { console.error("Inventory load error:", e); }

        // Fetch Projects
        try {
          const pRes = await projectAPI.getByCompany(companyId);
          setProjects(Array.isArray(pRes.data) ? pRes.data : []);
        } catch (e) { console.error("Project load error:", e); }

        // Fetch Next Invoice Number (if creating new)
        if (!id) {
          try {
            const nextRes = await salesAPI.getNextNumber(companyId, 'invoice');
            if (nextRes.data && nextRes.data.nextNumber) {
              setInvoiceNo(nextRes.data.nextNumber);
            }
          } catch (e) { console.error("Next invoice number load error:", e); }
        }

        // HANDLE CONVERSION FROM CHALLAN, QUOTE, OR ORDER
        if (!id && location.state) {
          const { challanData, quoteData, orderData } = location.state;
          const source = challanData || quoteData || orderData;

          if (source) {
            setCustomerId(source.customerLedgerId || source.LedgerId || source.customerId);
            setOrderNo(source.referenceNumber || source.orderNumber || source.quoteNumber || '');
            
            // Map Line Items (Logic varies slightly by source)
            const rawItems = source.items || (typeof source.itemsJson === 'string' ? JSON.parse(source.itemsJson) : source.itemsJson) || [];
            if (rawItems.length > 0) {
              setLineItems(rawItems.map(it => ({
                id: Math.random(),
                itemId: it.itemId,
                description: it.description || it.itemDetails || it.detail || '',
                quantity: parseFloat(it.quantity || 0),
                rate: parseFloat(it.rate || 0),
                amount: parseFloat(it.quantity || 0) * parseFloat(it.rate || 0)
              })));
            }

            // Map Totals
            if (source.discountPercent) setDiscountPercent(source.discountPercent);
            if (source.adjustment) setAdjustment(source.adjustment);
            if (source.subject) setSubject(source.subject);
            if (source.customerNotes) setNotes(source.customerNotes);
          } else if (location.state.customerId) {
            setCustomerId(location.state.customerId);
          }
        }

        // LOAD EXISTING DRAFT IF ID EXISTS
        if (id) {
           const invRes = await salesAPI.getById(id);
           const inv = invRes.data;
           if (inv) {
              setCustomerId(inv.customerLedgerId);
              const cust = allLedgers.find(c => c.id === inv.customerLedgerId);
              if (cust) {
                setCurrencySymbol(getCurrencyDisplay(cust.currency));
                setCurrencyCode(cust.currency || 'INR');
                setCustomerSearch(cust.displayName || cust.name);
              }
              setInvoiceNo(inv.invoiceNumber);
              setOrderNo(inv.orderNumber || '');
              setInvoiceDate(new Date(inv.date).toISOString().split('T')[0]);
              setDueDate(new Date(inv.dueDate || inv.date).toISOString().split('T')[0]);
              setTerms(inv.terms || 'Due on Receipt');
              setSalesperson(inv.salesperson || '');
              setSubject(inv.subject || '');
              setAdjustment(inv.adjustment || 0);
              setDiscountPercent(inv.discountPercent || 0);
              setNotes(inv.customerNotes || '');
              if (inv.exchangeRate) {
                 setExchangeRate(parseFloat(inv.exchangeRate));
                 setTempExchangeRate(parseFloat(inv.exchangeRate));
              }
              
              if (inv.items && inv.items.length > 0) {
                 setLineItems(inv.items.map(item => ({
                    id: Math.random(),
                    itemId: item.itemId,
                    description: item.description || '',
                    quantity: item.quantity,
                    rate: item.rate,
                    amount: item.quantity * item.rate
                 })));
              }
           }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();

    // Close salesperson dropdown on click outside
    const handleClickOutside = (event) => {
      if (salespersonDropdownRef.current && !salespersonDropdownRef.current.contains(event.target)) {
        setShowSalespersonDropdown(false);
      }
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target)) {
        setShowCustomerDropdown(false);
      }
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(event.target)) {
        setShowProjectDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [companyId, id, location.state]);

  // Restore draft state
  useEffect(() => {
    if (!id) {
        try {
            const draft = localStorage.getItem('invoice_draft_new');
            if (draft) {
                const parsed = JSON.parse(draft);
                if (parsed.customerId) setCustomerId(parsed.customerId);
                if (parsed.invoiceNo) setInvoiceNo(parsed.invoiceNo);
                if (parsed.orderNo) setOrderNo(parsed.orderNo);
                if (parsed.invoiceDate) setInvoiceDate(parsed.invoiceDate);
                if (parsed.dueDate) setDueDate(parsed.dueDate);
                if (parsed.terms) setTerms(parsed.terms);
                if (parsed.salesperson) setSalesperson(parsed.salesperson);
                if (parsed.subject) setSubject(parsed.subject);
                if (parsed.lineItems) setLineItems(parsed.lineItems);
                if (parsed.discountPercent) setDiscountPercent(parsed.discountPercent);
                if (parsed.adjustment) setAdjustment(parsed.adjustment);
                if (parsed.gstPercent) setGstPercent(parsed.gstPercent);
                if (parsed.notes) setNotes(parsed.notes);
                if (parsed.termsText) setTermsText(parsed.termsText);
                if (parsed.currencyCode) setCurrencyCode(parsed.currencyCode);
                if (parsed.currencySymbol) setCurrencySymbol(parsed.currencySymbol);
                if (parsed.exchangeRate) {
                    setExchangeRate(parsed.exchangeRate);
                    setTempExchangeRate(parsed.exchangeRate);
                }
                // Do not remove it here. It will be removed upon successful save.
            }
        } catch(e) {}
    }
  }, [id]);

  // Auto-save draft
  useEffect(() => {
    if (!id && !loading) {
      const draft = {
        customerId, invoiceNo, orderNo, invoiceDate, dueDate, terms,
        salesperson, subject, lineItems, discountPercent, adjustment,
        gstPercent, notes, termsText, currencyCode, currencySymbol, exchangeRate
      };
      localStorage.setItem('invoice_draft_new', JSON.stringify(draft));
    }
  }, [id, loading, customerId, invoiceNo, orderNo, invoiceDate, dueDate, terms, salesperson, subject, lineItems, discountPercent, adjustment, gstPercent, notes, termsText, currencyCode, currencySymbol, exchangeRate]);

  // ─── Calculation Logic ──────────────────────────────────────────
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      (c.displayName || c.name || '').toLowerCase().includes(customerSearch.toLowerCase()) ||
      (c.companyName || '').toLowerCase().includes(customerSearch.toLowerCase())
    );
  }, [customers, customerSearch]);

  const subTotal = useMemo(() => {
    return lineItems.reduce((acc, line) => {
      const qty = parseFloat(line.quantity) || 0;
      const rate = parseFloat(line.rate) || 0;
      const discount = parseFloat(line.discount) || 0;
      const lineBase = qty * rate;
      const disc = line.discountType === '%' ? (lineBase * (discount / 100)) : discount;
      return acc + (lineBase - disc);
    }, 0);
  }, [lineItems]);

  const discountAmount = useMemo(() => (subTotal * (discountPercent / 100)), [subTotal, discountPercent]);
  const gstAmount      = useMemo(() => ((subTotal - discountAmount) * (gstPercent / 100)), [subTotal, discountAmount, gstPercent]);
  const total = useMemo(() => subTotal - discountAmount + gstAmount + parseFloat(adjustment || 0), [subTotal, discountAmount, gstAmount, adjustment]);

  const totalQuantity = useMemo(() => lineItems.reduce((acc, line) => acc + parseFloat(line.quantity || 0), 0), [lineItems]);

  // ─── Handlers ───────────────────────────────────────────────────
  const addLine = () => setLineItems([...lineItems, { id: Date.now(), itemId: '', description: '', quantity: 1, rate: 0, discount: 0, discountType: '%', amount: 0 }]);
  const removeLine = (id) => lineItems.length > 1 && setLineItems(lineItems.filter(l => l.id !== id));
  
  const updateLine = (id, field, value) => {
    setLineItems(prev => prev.map(l => {
      if (l.id !== id) return l;
      const updated = { ...l, [field]: value };
      if (field === 'itemId') {
        const selected = (items || []).find(i => i.id === value);
        if (selected) {
           const basePrice = parseFloat(selected.sellingPrice || 0);
           // Apply Conversion Formula: Foreign Rate = Base Price / Exchange Rate
           if (currencyCode !== 'INR' && exchangeRate > 0) {
              updated.rate = parseFloat((basePrice / exchangeRate).toFixed(2));
           } else {
              updated.rate = basePrice;
           }
           // Default quantity to 1 if not already set, to reflect rate in amount immediately
           if (parseFloat(updated.quantity || 0) === 0) {
              updated.quantity = 1;
           }
           updated.description = selected.salesDescription || selected.name || '';
        }
      }
      
      const qty = parseFloat(updated.quantity || 0);
      const rate = parseFloat(updated.rate || 0);
      const discount = parseFloat(updated.discount || 0);
      
      updated.amount = qty * rate;
      const disc = updated.discountType === '%' ? (updated.amount * (discount / 100)) : discount;
      updated.amount = updated.amount - disc;
      return updated;
    }));
  };

  const handleSave = async (status = 'Confirmed') => {
    if (!customerId) {
        setModalConfig({
            isOpen: true,
            title: 'Customer Missing',
            message: 'Please select a customer before saving the invoice.',
            type: 'warning',
            showCancel: false,
            confirmText: 'Got it'
        });
        return;
    }
    
    const validItems = lineItems.filter(l => l.itemId);
    if (validItems.length === 0 || total <= 0) {
        setModalConfig({
            isOpen: true,
            title: 'Invalid Invoice',
            message: 'Please add at least one valid item with a rate greater than 0 before saving.',
            type: 'warning',
            showCancel: false,
            confirmText: 'Got it'
        });
        return;
    }

    setIsSaving(true);
    try {
      const payload = {
        companyId, customerLedgerId: customerId, invoiceNumber: invoiceNo,
        date: invoiceDate, dueDate, orderNumber: orderNo, terms, salesperson, subject,
        subTotal, discountAmount, gstAmount, adjustment, totalAmount: total,
        customerNotes: notes, termsConditions: termsText,
        status, // 'Draft' or 'Confirmed'
        currencyCode,
        exchangeRate,
        items: lineItems.filter(l => l.itemId).map(l => ({ 
          itemId: l.itemId, 
          quantity: l.quantity, 
          rate: l.rate,
          discount: l.discount,
          discountType: l.discountType
        })),
        projectId: projectId || null
      };
      
      if (id) {
         await salesAPI.updateInvoice(id, payload);
         if (status === 'Confirmed') {
             const customer = customers.find(c => String(c.id) === String(customerId));
             setSavedInvoiceData({
                 ...payload,
                 id: id,
                 CompanyId: companyId,
                 number: invoiceNo,
                 total: total,
                 date: invoiceDate,
                 dueDate: dueDate,
                 Customer: { email: customer?.email },
                 customerName: customer?.displayName || customer?.name
             });
             setShowEmailModal(true);
         } else {
             navigate(`/sales-invoices/${id}`);
         }
      } else {
         const res = await salesAPI.createInvoice(payload);
         localStorage.removeItem('invoice_draft_new');
         const newId = res.data?.id;
         if (newId) {
             if (status === 'Confirmed') {
                 const customer = customers.find(c => String(c.id) === String(customerId));
                 setSavedInvoiceData({
                     ...payload,
                     id: newId,
                     CompanyId: companyId,
                     number: invoiceNo,
                     total: total,
                     date: invoiceDate,
                     dueDate: dueDate,
                     Customer: { email: customer?.email },
                     customerName: customer?.displayName || customer?.name
                 });
                 setShowEmailModal(true);
             } else {
                 navigate(`/sales-invoices/${newId}`);
             }
         } else {
            navigate('/sales-invoices');
         }
      }
    } catch (err) {
      setModalConfig({
          isOpen: true,
          title: 'Save Failed',
          message: err.response?.data?.error || 'Failed to save invoice. Please check your connection and try again.',
          type: 'danger',
          showCancel: false,
          confirmText: 'Retry'
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="p-20 text-center font-bold text-slate-600">Loading Invoice Interface...</div>;

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] relative overflow-hidden">
      {/* Sticky Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shrink-0 sticky top-0 z-20 no-print">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => window.history.length > 2 ? navigate(-1) : navigate('/sales-invoices')}
            className="p-2 hover:bg-slate-100 rounded text-slate-600 hover:text-slate-900 transition-all"
          >
            <ArrowLeft size={22} />
          </button>
          <div>
            <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">{id ? 'Edit Invoice' : 'Create Invoice'}</h2>
            <div className="text-[11px] font-bold text-slate-600 uppercase tracking-widest mt-0.5">Sales / Invoices</div>
          </div>
        </div>
        <button onClick={() => navigate('/sales-invoices')} className="text-slate-500 hover:text-slate-600 transition-colors"><X size={24} /></button>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="max-w-[1000px] mx-auto py-10 px-6">
          <div className="bg-white rounded border border-slate-200 shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-12 space-y-12 animate-fade-in">
          
          {/* Top Section: Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-8">
            <div className="space-y-6">
              {/* Customer Name */}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-red-500 uppercase tracking-widest">Customer Name*</label>
                <div className="relative" ref={customerDropdownRef}>
                    <div className="flex shadow-sm gap-2">
                      <div className="relative flex-1">
                        <input 
                          type="text"
                          value={customerSearch}
                          onChange={(e) => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true); }}
                          onFocus={() => setShowCustomerDropdown(true)}
                          placeholder="Select or add a customer"
                          className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded text-[13px] font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-all"
                        />
                        <button className="absolute right-0 top-0 h-full px-4 bg-[#1e61f0] text-white rounded-r flex items-center justify-center">
                          <Search size={16} />
                        </button>
                      </div>
                      {customerId && (
                        <div className="h-11 px-3 border border-slate-200 rounded bg-white flex items-center gap-2 text-[13px] font-bold text-slate-600">
                          <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                            <Check size={12} strokeWidth={4} />
                          </div>
                          {currencyCode}
                        </div>
                      )}
                    </div>

                    {/* Address Links - Image 2 */}
                    {customerId && (
                      <div className="flex gap-12 mt-4 ml-1">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Billing Address</p>
                          <button className="text-[13px] font-bold text-blue-600 hover:underline">New Address</button>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Shipping Address</p>
                          <button className="text-[13px] font-bold text-blue-600 hover:underline">New Address</button>
                        </div>
                      </div>
                    )}

                  {showCustomerDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 shadow-xl rounded z-50 overflow-hidden">
                      <div className="flex flex-col">
                        <div className="max-h-60 overflow-y-auto no-scrollbar">
                          {filteredCustomers.length === 0 ? (
                            <div className="p-4 text-center">
                              <p className="text-[12px] text-slate-600 mb-2">No customers found</p>
                            </div>
                          ) : (
                            <div className="py-1">
                              {filteredCustomers.map(c => (
                                <div 
                                  key={c.id}
                                  onClick={() => { 
                                    setCustomerId(c.id); 
                                    setCustomerSearch(c.displayName || c.name); 
                                    setCurrencySymbol(getCurrencyDisplay(c.currency));
                                    setCurrencyCode(c.currency || 'INR');
                                    fetchLiveExchangeRate(c.currency); // Trigger re-fetch for new selection
                                    setShowCustomerDropdown(false); 
                                  }}
                                  className={`px-4 py-2 hover:bg-blue-50 cursor-pointer text-[14px] font-medium border-b border-slate-50 last:border-0 ${customerId === c.id ? 'bg-blue-50 text-blue-700' : 'text-slate-700'}`}
                                >
                                  <div className="flex flex-col">
                                    <span className="font-bold">{c.displayName || c.name}</span>
                                    {c.companyName && c.companyName !== (c.displayName || c.name) && (
                                      <span className="text-[11px] text-slate-600 font-medium">{c.companyName}</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="border-t border-slate-100 p-2 bg-slate-50 shrink-0">
                          <button 
                            onClick={() => {
                              localStorage.setItem('invoice_draft', JSON.stringify({
                                customerId, invoiceNo, orderNo, invoiceDate, dueDate, terms, salesperson, subject, lineItems, discountPercent, adjustment, taxType, gstPercent, notes, termsText
                              }));
                              navigate('/customers/new', { state: { returnTo: location.pathname } });
                            }}
                            className="w-full flex items-center justify-center gap-2 py-2.5 text-[#1e61f0] font-bold text-[12px] hover:bg-blue-600 hover:text-white rounded transition-all uppercase tracking-widest"
                          >
                            <Plus size={14} strokeWidth={3} /> New Customer
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Invoice# */}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-red-500 uppercase tracking-widest">Invoice#*</label>
                <div className="relative">
                  <input type="text" value={invoiceNo} readOnly className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded text-[13px] font-bold text-slate-900 outline-none shadow-sm" />
                  <div 
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 cursor-pointer hover:text-blue-500"
                    onClick={() => setModalConfig({
                        isOpen: true,
                        title: 'Configuration',
                        message: 'Invoice Auto-numbering and prefix settings can be managed in the Settings panel.',
                        type: 'info',
                        showCancel: false,
                        confirmText: 'Close'
                    })}
                  >
                    <Settings size={14}/>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">Order Number</label>
                <input type="text" value={orderNo} onChange={e => setOrderNo(e.target.value)} className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded text-[13px] font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-all shadow-sm" />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-red-500 uppercase tracking-widest">Invoice Date*</label>
                <input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded text-[13px] font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-all shadow-sm" />
              </div>

              {/* Project Link */}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">Project</label>
                <div className="relative" ref={projectDropdownRef}>
                  <button
                    type="button"
                    onClick={() => { setShowProjectDropdown(prev => !prev); setProjectSearch(''); }}
                    className={`w-full h-11 px-4 pr-9 border rounded text-[13px] font-bold text-left shadow-sm flex items-center justify-between transition-colors
                      ${showProjectDropdown ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200 bg-slate-50'}
                      ${projectId ? 'text-slate-800' : 'text-slate-600 font-medium'}`}
                  >
                    <span>{projects.find(p => p.id === projectId)?.name || 'Associate Project'}</span>
                    <ChevronDown size={14} className={`absolute right-3 text-slate-600 transition-transform ${showProjectDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showProjectDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 shadow-xl rounded-xl z-[200] overflow-hidden animate-fade-in">
                      <div className="p-2 border-b border-slate-100">
                        <div className="relative">
                          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                          <input
                            autoFocus
                            value={projectSearch}
                            onChange={e => setProjectSearch(e.target.value)}
                            placeholder="Search projects..."
                            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-medium outline-none focus:border-blue-400 transition-all"
                          />
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto no-scrollbar">
                        <div 
                          onClick={() => { setProjectId(''); setShowProjectDropdown(false); }}
                          className={`px-4 py-2.5 cursor-pointer text-xs font-bold uppercase tracking-widest hover:bg-slate-50 border-b border-slate-50 ${!projectId ? 'text-blue-600' : 'text-slate-600'}`}
                        >
                          No Project
                        </div>
                        {projects.filter(p => !projectSearch || p.name.toLowerCase().includes(projectSearch.toLowerCase())).length === 0 ? (
                          <div className="py-6 text-center text-xs text-slate-600 font-medium uppercase tracking-widest opacity-60">No Match Found</div>
                        ) : (
                          projects
                            .filter(p => !projectSearch || p.name.toLowerCase().includes(projectSearch.toLowerCase()))
                            .map(p => (
                              <div
                                key={p.id}
                                onClick={() => { setProjectId(p.id); setShowProjectDropdown(false); }}
                                className={`px-4 py-2.5 cursor-pointer text-sm font-medium hover:bg-blue-50 transition-colors
                                  ${projectId === p.id ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700'}`}
                              >
                                {p.name}
                              </div>
                            ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">Due Date</label>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded text-[13px] font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-all shadow-sm" />
              </div>

              {/* Terms */}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">Terms</label>
                <div className="relative">
                  <select 
                    value={terms} 
                    onChange={e => {
                      if (e.target.value === 'CONFIGURE') {
                         // Logic to open terms configuration
                      } else {
                         setTerms(e.target.value);
                      }
                    }} 
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded text-[13px] font-bold text-slate-700 outline-none appearance-none focus:bg-white focus:border-blue-500 transition-all pr-9 shadow-sm"
                  >
                     <option>Due on Receipt</option>
                     <option>Net 15</option>
                     <option>Net 30</option>
                     <option>Net 45</option>
                     <option>Net 60</option>
                     <option>Due end of the month</option>
                     <option>Due end of next month</option>
                     <option disabled>──────────</option>
                     <option value="CONFIGURE">⚙️ Configure Terms</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600">
                     <ChevronDown size={16} />
                  </div>
                </div>
              </div>

              {/* Salesperson */}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">Salesperson</label>
                <div className="relative" ref={salespersonDropdownRef}>
                  <button
                    type="button"
                    onClick={() => { setShowSalespersonDropdown(prev => !prev); setSalespersonSearch(''); }}
                    className={`w-full h-11 px-4 pr-9 border rounded text-[13px] font-bold text-left shadow-sm flex items-center justify-between transition-colors
                      ${showSalespersonDropdown ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200 bg-slate-50'}
                      ${salesperson ? 'text-slate-800' : 'text-slate-600 font-medium'}`}
                  >
                    <span>{salesperson || 'Select or Add Salesperson'}</span>
                    <ChevronDown size={14} className={`absolute right-3 text-slate-600 transition-transform ${showSalespersonDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showSalespersonDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 shadow-xl rounded-xl z-[200] overflow-hidden animate-fade-in">
                      <div className="p-2 border-b border-slate-100">
                        <div className="relative">
                          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                          <input
                            autoFocus
                            value={salespersonSearch}
                            onChange={e => setSalespersonSearch(e.target.value)}
                            placeholder="Search"
                            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-medium outline-none focus:border-blue-400 transition-all"
                          />
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto no-scrollbar">
                        {salespersons.filter(s => !salespersonSearch || s.name.toLowerCase().includes(salespersonSearch.toLowerCase())).length === 0 ? (
                          <div className="py-6 text-center text-xs text-slate-600 font-medium uppercase tracking-widest opacity-60">No Match Found</div>
                        ) : (
                          salespersons
                            .filter(s => !salespersonSearch || s.name.toLowerCase().includes(salespersonSearch.toLowerCase()))
                            .map(s => (
                              <div
                                key={s.id}
                                onClick={() => { setSalesperson(s.name); setShowSalespersonDropdown(false); }}
                                className={`px-4 py-2.5 cursor-pointer text-sm font-medium hover:bg-blue-50 transition-colors
                                  ${salesperson === s.name ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700'}`}
                              >
                                {s.name}
                              </div>
                            ))
                        )}
                      </div>
                      <div className="border-t border-slate-100">
                        <button
                          onClick={() => { setShowSalespersonDropdown(false); setShowManageSalespersons(true); }}
                          className="w-full flex items-center gap-2 px-4 py-3 text-[13px] font-bold text-[#1e61f0] hover:bg-blue-50 transition-colors"
                        >
                          <Plus size={14} /> Manage Salespersons
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Subject */}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">Subject <Info size={14} className="text-slate-600" /></label>
                <input 
                  type="text"
                  value={subject} 
                  onChange={e => setSubject(e.target.value)} 
                  placeholder="Let your customer know what this invoice is for"
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded text-[13px] font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-all shadow-sm"
                />
              </div>
            </div>
          </div>

         {/* Item Table Section */}
         <div className="space-y-4">
          {/* Exchange Rate Note - Image 3 */}
          {currencyCode !== 'INR' && (
            <div className="flex justify-end pr-2">
              <div className="text-[11px] font-bold text-slate-600 flex items-center gap-1 relative">
                (As on {invoiceDate}) 1 {currencyCode} = {exchangeRate} INR 
                <button 
                  onClick={() => { setTempExchangeRate(exchangeRate); setShowExchangeRatePopover(!showExchangeRatePopover); }}
                  className="hover:bg-blue-50 p-1 rounded transition-colors"
                >
                  <Edit2 size={12} className="text-blue-500 cursor-pointer" />
                </button>

                {/* EDIT EXCHANGE RATE POPOVER */}
                {showExchangeRatePopover && (
                  <div 
                    className="absolute top-full right-0 mt-2 w-72 bg-white rounded-lg border border-slate-200 shadow-xl z-[100] overflow-hidden animate-in fade-in zoom-in duration-200"
                    style={{ filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.1))' }}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-slate-50/50 border-b border-slate-100">
                       <span className="text-[13px] font-bold text-slate-700">Edit Exchange Rate</span>
                       <button onClick={() => setShowExchangeRatePopover(false)} className="text-red-500 hover:bg-red-50 p-1 rounded transition-colors">
                          <X size={16} />
                       </button>
                    </div>

                    {/* Body */}
                    <div className="p-5 space-y-4">
                       <div className="space-y-2">
                          <label className="text-[12px] font-bold text-red-500">Exchange Rate (in INR)*</label>
                          <input 
                             type="number"
                             value={tempExchangeRate}
                             onChange={(e) => setTempExchangeRate(parseFloat(e.target.value))}
                             className="w-full px-3 py-2 border border-slate-200 rounded text-[13px] font-medium text-slate-700 outline-none focus:border-blue-500 transition-all"
                          />
                       </div>

                       <label className="flex items-center gap-2 cursor-pointer group">
                          <input 
                             type="checkbox"
                             checked={recalculatePrices}
                             onChange={(e) => setRecalculatePrices(e.target.checked)}
                             className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-[12px] text-slate-600 font-medium group-hover:text-slate-900 transition-colors">Re-calculate item prices based on this rate</span>
                       </label>

                       <button 
                          onClick={() => {
                             const oldRate = exchangeRate;
                             const newRate = tempExchangeRate;
                             setExchangeRate(newRate);
                             
                             if (recalculatePrices && oldRate > 0 && newRate > 0) {
                                setLineItems(prev => prev.map(line => {
                                   const basePrice = (parseFloat(line.rate) * oldRate);
                                   const convertedRate = parseFloat((basePrice / newRate).toFixed(2));
                                   const amount = parseFloat(line.quantity || 0) * convertedRate;
                                   const disc = line.discountType === '%' ? (amount * (line.discount / 100)) : parseFloat(line.discount);
                                   return { ...line, rate: convertedRate, amount: amount - disc };
                                }));
                             }
                             setShowExchangeRatePopover(false);
                          }}
                          className="px-6 py-2 bg-[#1e61f0] text-white text-[12px] font-bold rounded shadow-sm hover:bg-blue-600 transition-all"
                       >
                          Save
                       </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-bold text-slate-800 tracking-tight">Item Table</h3>
            <div className="flex items-center gap-6">
              <button className="flex items-center gap-2 text-[#1e61f0] text-[12px] font-bold hover:underline">
                <Scan size={16} /> Scan Item
              </button>
              <button className="flex items-center gap-2 text-[#1e61f0] text-[12px] font-bold hover:underline">
                <ShieldCheck size={16} /> Bulk Actions
              </button>
            </div>
          </div>

          <div className="bg-white rounded border border-slate-200 overflow-visible">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest border-r border-slate-100">Item Details</th>
                  <th className="w-32 px-4 py-3 text-right text-[10px] font-bold text-slate-500 uppercase tracking-widest border-r border-slate-100">Quantity</th>
                  <th className="w-40 px-4 py-3 text-right text-[10px] font-bold text-slate-500 uppercase tracking-widest border-r border-slate-100">
                    <div className="flex items-center justify-end gap-1">
                      Rate <Settings size={12} className="text-slate-400" />
                    </div>
                  </th>
                  <th className="w-32 px-4 py-3 text-right text-[10px] font-bold text-slate-500 uppercase tracking-widest border-r border-slate-100">Discount</th>
                  <th className="w-40 px-4 py-3 text-right text-[10px] font-bold text-slate-500 uppercase tracking-widest">Amount</th>
                </tr>
              </thead>
              <tbody className="overflow-visible">
                {(lineItems || []).map((line) => {
                  const selectedItem = (items || []).find(it => it.id === line.itemId);
                  const accountName = line.salesAccountOverride || selectedItem?.salesAccount || 'Select an account';
                  const discountAccountName = line.discountAccountOverride || 'Discount';
                  return (
                  <React.Fragment key={line.id}>
                    <tr className="group hover:bg-slate-50/30 transition-colors relative z-[1] hover:z-[50]">
                      <td className="px-4 py-4 min-w-[320px] overflow-visible border-r border-slate-100 align-top">
                        <div className="relative">
                          <ItemSearchSelector 
                            items={items}
                            currencySymbol={currencySymbol}
                            value={selectedItem?.name || ''}
                            onChange={(selected) => {
                              if (selected) {
                                  updateLine(line.id, 'itemId', selected.id);
                              }
                            }}
                            placeholder="Type or click to select an item."
                            onNewItem={() => navigate('/inventory/new', { state: { returnTo: location.pathname } })}
                          />
                          {line.description && (
                             <textarea 
                               value={line.description}
                               onChange={(e) => updateLine(line.id, 'description', e.target.value)}
                               placeholder="Add a description..."
                               className="w-full mt-2 p-2 text-[11px] font-medium text-slate-500 bg-transparent border-none focus:bg-slate-50 rounded outline-none resize-none no-scrollbar"
                               rows={1}
                             />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 border-r border-slate-100 align-top">
                        <input 
                          type="number" 
                          value={line.quantity} 
                          onChange={e => updateLine(line.id, 'quantity', e.target.value)} 
                          className="w-full text-right bg-transparent border-none outline-none text-[13px] font-medium text-slate-700" 
                        />
                      </td>
                      <td className="px-4 py-4 border-r border-slate-100 align-top">
                        <input 
                          type="number" 
                          value={line.rate} 
                          onChange={e => updateLine(line.id, 'rate', e.target.value)} 
                          className="w-full text-right bg-white border border-slate-200 rounded px-2 py-1 text-[13px] font-medium text-slate-700 focus:border-blue-500 outline-none transition-all" 
                        />
                      </td>
                      <td className="px-4 py-4 border-r border-slate-100 align-top">
                        <div className="flex items-center justify-end gap-1 bg-slate-50/50 rounded px-2 py-1 border border-slate-100">
                          <input 
                            type="number" 
                            value={line.discount} 
                            onChange={e => updateLine(line.id, 'discount', e.target.value)} 
                            className="w-10 text-right bg-transparent border-none outline-none text-[13px] font-medium text-slate-700" 
                          />
                          <select 
                            value={line.discountType} 
                            onChange={e => updateLine(line.id, 'discountType', e.target.value)}
                            className="bg-transparent border-none outline-none text-[11px] font-bold text-slate-500"
                          >
                            <option value="%">%</option>
                            <option value="val">-</option>
                          </select>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right align-top relative">
                        <span className="text-[14px] font-bold text-slate-900">
                          {getCurrencyDisplay(currencyCode)} {parseFloat(line.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>

                        {/* Floating Actions OUTSIDE the table */}
                        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 flex items-center gap-2">
                           <button onClick={() => removeLine(line.id)} className="w-6 h-6 rounded-full border border-slate-200 bg-white flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors shadow-sm">
                              <X size={14}/>
                           </button>
                        </div>
                      </td>
                    </tr>
                    {/* Bottom Helper Bar for each row */}
                    <tr className="border-b border-slate-100 bg-slate-50/10">
                      <td colSpan="5" className="px-4 py-2">
                        <div className="flex items-center gap-4">
                           <div className="relative flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-[#1e61f0] transition-colors cursor-pointer group">
                              <Package size={14} className="text-orange-500" /> {accountName} <ChevronDown size={12} />
                              <select 
                                value={accountName !== 'Select an account' ? accountName : ''} 
                                onChange={(e) => updateLine(line.id, 'salesAccountOverride', e.target.value)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              >
                                <option value="" disabled>Select an account</option>
                                {Object.entries(ACCOUNT_OPTIONS).map(([groupName, options]) => (
                                  <optgroup key={groupName} label={groupName}>
                                    {options.map(opt => (
                                      <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                  </optgroup>
                                ))}
                              </select>
                           </div>
                           <div className="relative flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-[#1e61f0] transition-colors border-l border-slate-200 pl-4 cursor-pointer group">
                              <RefreshCcw size={14} /> {discountAccountName} <ChevronDown size={12} />
                              <select 
                                value={discountAccountName !== 'Discount' ? discountAccountName : ''} 
                                onChange={(e) => updateLine(line.id, 'discountAccountOverride', e.target.value)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              >
                                <option value="" disabled>Select Discount Account</option>
                                {Object.entries(ACCOUNT_OPTIONS).map(([groupName, options]) => (
                                  <optgroup key={groupName} label={groupName}>
                                    {options.map(opt => (
                                      <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                  </optgroup>
                                ))}
                              </select>
                           </div>
                           <button className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-[#1e61f0] transition-colors border-l border-slate-200 pl-4">
                              <FileText size={14} /> Select a project <ChevronDown size={12} />
                           </button>
                           <button className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-[#1e61f0] transition-colors border-l border-slate-200 pl-4">
                              <ShieldCheck size={14} /> Reporting Tags
                           </button>
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                )})}
              </tbody>
            </table>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
               <button onClick={addLine} className="px-4 py-2 text-[#1e61f0] text-[12px] font-bold hover:bg-slate-50 border-r border-slate-200 flex items-center gap-2">
                 <Plus size={14} strokeWidth={3}/> Add New Row
               </button>
               <button className="px-2 py-2 hover:bg-slate-50 text-slate-500">
                 <ChevronDown size={14} />
               </button>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 text-[#1e61f0] text-[12px] font-bold hover:underline transition-all">
              <Plus size={14} strokeWidth={3}/> Add Items in Bulk
            </button>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="flex justify-between items-start pt-12 border-t border-slate-100 gap-20">
           <div className="flex-1 max-w-md space-y-8">
              <div className="space-y-3">
                 <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">Customer Notes</label>
                 <textarea 
                    value={notes} 
                    onChange={e => setNotes(e.target.value)} 
                    placeholder="Will be displayed on the invoice"
                    className="w-full h-24 p-4 bg-slate-50 border border-slate-200 rounded text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:border-blue-500 transition-all resize-none shadow-sm" 
                 />
              </div>

              <div className="space-y-3">
                 <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">Terms & Conditions</label>
                 <textarea 
                   value={termsText} 
                   onChange={e => setTermsText(e.target.value)} 
                   placeholder="Business terms..." 
                   className="w-full h-24 bg-slate-50 border border-slate-200 rounded text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:border-blue-500 transition-all resize-none shadow-sm" 
                 />
              </div>
           </div>

           <div className="w-80 space-y-4">
               <div className="flex justify-between items-center text-[13px]">
                 <span className="font-bold text-slate-900">Sub Total</span>
                 <span className="font-bold text-slate-900 font-mono">{subTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
               </div>
 
               <div className="flex justify-between items-center text-[13px] py-2">
                 <span className="font-bold text-slate-700">GST</span>
                 <div className="flex items-center gap-2">
                    <select
                      value={gstPercent === 0 ? '' : String(gstPercent)}
                      onChange={e => setGstPercent(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                      className="h-9 px-3 bg-white border border-slate-200 rounded-lg text-[13px] font-medium text-slate-500 outline-none min-w-[140px] focus:border-blue-500 transition-all cursor-pointer"
                    >
                      <option value="">Select a Tax</option>
                      <option value="5">GST @ 5%</option>
                      <option value="12">GST @ 12%</option>
                      <option value="18">GST @ 18%</option>
                      <option value="28">GST @ 28%</option>
                    </select>
                    <span className="text-slate-600 font-bold min-w-[60px] text-right">
                      {gstPercent > 0 ? `+ ${gstAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '0.00'}
                    </span>
                 </div>
               </div>
 
               <div className="flex justify-between items-center text-[13px] py-2">
                 <div className="flex items-center gap-4">
                   <label className="flex items-center gap-2 cursor-pointer">
                     <input type="radio" checked={tdsType === 'TDS'} onChange={() => setTdsType('TDS')} className="accent-blue-600 w-4 h-4" />
                     <span className="text-[13px] font-bold text-slate-700">TDS</span>
                   </label>
                   <label className="flex items-center gap-2 cursor-pointer">
                     <input type="radio" checked={tdsType === 'TCS'} onChange={() => setTdsType('TCS')} className="accent-blue-600 w-4 h-4" />
                     <span className="text-[13px] font-bold text-slate-700">TCS</span>
                   </label>
                 </div>
                 <div className="flex items-center gap-2">
                    <select className="h-9 px-3 bg-white border border-slate-200 rounded-lg text-[13px] font-medium text-slate-500 outline-none min-w-[140px] focus:border-blue-500 transition-all cursor-pointer">
                      <option value="">Select a Tax</option>
                      <option value="1">TDS @ 1%</option>
                      <option value="2">TDS @ 2%</option>
                      <option value="5">TDS @ 5%</option>
                      <option value="10">TDS @ 10%</option>
                    </select>
                    <span className="text-slate-600 font-bold">- 0.00</span>
                 </div>
               </div>
 
               <div className="flex justify-between items-center text-[13px]">
                 <div className="flex items-center gap-2">
                   <div className="px-3 py-1.5 border border-dashed border-slate-300 rounded text-slate-600 text-[12px] font-bold">Adjustment</div>
                   <input type="number" value={adjustment} onChange={e => setAdjustment(e.target.value)} className="w-24 h-9 px-3 bg-white border border-slate-200 rounded-lg text-right font-bold outline-none" />
                   <Info size={14} className="text-slate-500" />
                 </div>
                 <span className="font-bold text-slate-900 font-mono">0.00</span>
               </div>
 
               <div className="pt-6 border-t border-slate-200 flex justify-between items-center mt-6">
                 <span className="text-[16px] font-bold text-slate-900">Total ( {currencyCode} )</span>
                 <span className="text-[18px] font-bold text-slate-900 tracking-tight font-mono">{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>

        {/* Sticky Footer */}
        <footer className="bg-white border-t border-slate-200 px-8 py-4 flex items-center justify-between shrink-0 sticky bottom-0 z-20 no-print shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
          <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded text-[11px] font-bold text-slate-600 uppercase tracking-widest">
                  <ShieldCheck size={14} className="text-blue-500" />
                  Encrypted & Secure Record Storage
              </div>
          </div>
           <div className="flex items-center gap-3">
               <button 
                   onClick={() => handleSave('Draft')}
                   disabled={isSaving}
                   className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded text-[13px] font-medium hover:bg-slate-50 transition-all shadow-sm"
               >
                   {isSaving ? '...' : 'Save as Draft'}
               </button>
               <div className="flex shadow-sm">
                <button 
                    onClick={() => handleSave('Confirmed')}
                    disabled={isSaving}
                    className="px-6 py-2 bg-blue-600 text-white rounded-l font-bold text-[13px] hover:bg-blue-700 transition-all flex items-center gap-2"
                >
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : 'Save and Send'}
                </button>
                <button className="px-2 bg-blue-600 text-white rounded-r border-l border-blue-500/50 hover:bg-blue-700">
                  <ChevronDown size={16} />
                </button>
               </div>
               <button 
                   onClick={() => navigate('/sales-invoices')}
                   className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded text-[13px] font-medium hover:bg-slate-50 transition-all shadow-sm"
               >
                   Cancel
               </button>
           </div>

           <div className="flex items-center gap-6">
              <button className="flex items-center gap-2 text-blue-600 text-[13px] font-bold hover:underline">
                <RefreshCcw size={16} /> Make Recurring
              </button>
              <div className="text-right">
                <div className="text-[13px] font-bold text-slate-900">Total Amount: {currencyCode} {total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                <div className="text-[11px] font-medium text-slate-600 uppercase tracking-widest">Total Quantity: {totalQuantity}</div>
              </div>
           </div>
        </footer>

        {/* Modals */}
        <ManageSalespersonsModal
          isOpen={showManageSalespersons}
          onClose={() => setShowManageSalespersons(false)}
          salespersons={salespersons}
          onSave={setSalespersons}
          onSelect={(name) => { setSalesperson(name); }}
           />

        <ConfirmModal
          isOpen={modalConfig.isOpen}
          onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
          onConfirm={() => setModalConfig({ ...modalConfig, isOpen: false })}
          title={modalConfig.title}
          message={modalConfig.message}
          type={modalConfig.type}
          showCancel={modalConfig.showCancel}
          confirmText={modalConfig.confirmText || 'OK'}
        />

        <EmailSendModal
          isOpen={showEmailModal}
          onClose={() => {
              setShowEmailModal(false);
              if (savedInvoiceData?.id) navigate(`/sales-invoices/${savedInvoiceData.id}`);
          }}
          documentData={savedInvoiceData || {}}
          documentType="Invoice"
          onSend={() => {
              setShowEmailModal(false);
              if (savedInvoiceData?.id) navigate(`/sales-invoices/${savedInvoiceData.id}`);
          }}
          apiFunc={(docId, payload) => mailAPI.send(payload)}
        />
      </div>
    );
  }
