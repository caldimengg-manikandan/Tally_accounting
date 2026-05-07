import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Plus, Trash2, Save, Printer, ArrowLeft, 
  Search, Info, Check, Loader2, X, Settings, ChevronDown, File, AlertTriangle,
  ShieldCheck, FileText, Edit2, Package, Mail, Phone, ChevronRight, Send
} from 'lucide-react';
import { useRef } from 'react';

// ─────────────────────────────────────────────────
// ITEM SEARCH SELECTOR (FOR TABLE CELLS)
// ─────────────────────────────────────────────────
const ItemSearchSelector = ({ value, onChange, items, placeholder }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filtered = (items || []).filter(it => {
        if (!it) return false;
        const n = it.name || '';
        const d = it.salesDescription || '';
        const s = search.toLowerCase();
        return n.toLowerCase().includes(s) || d.toLowerCase().includes(s);
    });

    return (
        <div className="relative w-full" ref={containerRef}>
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between cursor-pointer group"
            >
                <div className="flex-1">
                    {value ? (
                        <div className="text-[14px] font-bold text-slate-900 tracking-tight">{value}</div>
                    ) : (
                        <div className="text-[14px] font-medium text-slate-300 italic">{placeholder}</div>
                    )}
                </div>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-[400px] bg-white border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-xl z-[100] overflow-hidden animate-fade-in">
                    <div className="p-3 border-b border-slate-50 bg-slate-50/50">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                autoFocus
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search items or descriptions..."
                                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-[13px] outline-none focus:border-blue-500 transition-all font-medium"
                            />
                        </div>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto no-scrollbar py-1 flex flex-col">
                        {filtered.length > 0 ? (
                            <div className="flex-1">
                                {filtered.map(it => (
                                    <div 
                                        key={it.id}
                                        onClick={() => {
                                            onChange(it);
                                            setIsOpen(false);
                                            setSearch('');
                                        }}
                                        className="px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors group mx-1 rounded-lg"
                                    >
                                        <div className="flex justify-between items-start mb-0.5">
                                            <div className="text-[14px] font-bold text-slate-800 tracking-tight flex items-center gap-2">
                                                <Package size={14} className="text-blue-500 opacity-50" />
                                                {it.name}
                                            </div>
                                            <div className="text-[13px] font-bold text-slate-900">₹{parseFloat(it.sellingPrice || 0).toLocaleString()}</div>
                                        </div>
                                        <div className="text-[11px] text-slate-400 font-medium whitespace-nowrap overflow-hidden text-ellipsis italic">
                                            {it.salesDescription || 'No description provided'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-12 text-center flex flex-col items-center justify-center border-b border-slate-50">
                                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                                    <Package size={20} className="text-slate-300" />
                                </div>
                                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">No matching items</p>
                            </div>
                        )}
                        <div 
                            onClick={() => {
                                localStorage.setItem('invoice_draft', JSON.stringify({
                                   // draft state will be handled in the main component's handleAdd
                                }));
                                navigate('/inventory/new', { state: { returnTo: location.pathname } });
                            }}
                            className="px-4 py-3 bg-blue-50/50 hover:bg-blue-600 hover:text-white transition-all text-blue-600 font-bold text-[11px] uppercase tracking-widest flex items-center gap-2 cursor-pointer"
                        >
                            <Plus size={14} /> Add New Item
                        </div>
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
import ConfirmModal from '../../components/ConfirmModal';
import { ledgerAPI, inventoryAPI, salesAPI, companyAPI } from '../../services/api';

export default function ProfessionalInvoiceView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const companyId = localStorage.getItem('companyId');

  // ─── State ────────────────────────────────────────────────────────
  const [customers, setCustomers] = useState([]);
  const [items,     setItems]     = useState([]);
  const [projects,  setProjects]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  
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

  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const projectDropdownRef = React.useRef(null);
  const [projectSearch, setProjectSearch] = useState('');

  // Line Items
  const [lineItems, setLineItems] = useState([
    { id: Date.now(), itemId: '', description: '', quantity: 1, rate: 0, amount: 0 }
  ]);

  // Totals & Adjustments
  const [discountPercent, setDiscountPercent] = useState(0);
  const [adjustment,      setAdjustment]      = useState(0);
  const [taxType,         setTaxType]         = useState('GST');
  const [gstPercent,      setGstPercent]      = useState(18); // Default 18% GST
  const [taxId,           setTaxId]           = useState('');

  const [notes,      setNotes]      = useState('Thanks for your business.');
  const [termsText,  setTermsText]  = useState('');

  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const customerDropdownRef = React.useRef(null);

  const [isSaving, setIsSaving] = useState(false);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', type: 'info', showCancel: false });

  // ─── Load Data ──────────────────────────────────────────────────
  useEffect(() => {
    if (!companyId) return;
    const loadData = async () => {
      try {
        const [lRes, iRes, pRes] = await Promise.all([
          ledgerAPI.getByCompany(companyId),
          inventoryAPI.getByCompany(companyId),
          projectAPI.getByCompany(companyId)
        ]);
        const allLedgers = Array.isArray(lRes.data) ? lRes.data : [];
        const filteredCustomers = allLedgers.filter(l => {
          const gName = l.Group?.name || '';
          return gName.toLowerCase().includes('debtor') || gName.toLowerCase().includes('customer');
        });
        setCustomers(filteredCustomers);
        setItems(Array.isArray(iRes.data) ? iRes.data : []);
        setProjects(Array.isArray(pRes.data) ? pRes.data : []);

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
                quantity: parseFloat(it.quantity || 1),
                rate: parseFloat(it.rate || 0),
                amount: parseFloat(it.quantity || 1) * parseFloat(it.rate || 0)
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
            const draft = localStorage.getItem('invoice_draft');
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
                localStorage.removeItem('invoice_draft');
            }
        } catch(e) {}
    }
  }, [id]);

  // ─── Calculation Logic ──────────────────────────────────────────
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()));
  }, [customers, customerSearch]);

  const subTotal = useMemo(() => {
    return lineItems.reduce((acc, line) => acc + (parseFloat(line.quantity) * parseFloat(line.rate)), 0);
  }, [lineItems]);

  const discountAmount = useMemo(() => (subTotal * (discountPercent / 100)), [subTotal, discountPercent]);
  const gstAmount      = useMemo(() => ((subTotal - discountAmount) * (gstPercent / 100)), [subTotal, discountAmount, gstPercent]);
  const total = useMemo(() => subTotal - discountAmount + gstAmount + parseFloat(adjustment || 0), [subTotal, discountAmount, gstAmount, adjustment]);

  // ─── Handlers ───────────────────────────────────────────────────
  const addLine = () => setLineItems([...lineItems, { id: Date.now(), itemId: '', description: '', quantity: 1, rate: 0, amount: 0 }]);
  const removeLine = (id) => lineItems.length > 1 && setLineItems(lineItems.filter(l => l.id !== id));
  
  const updateLine = (id, field, value) => {
    setLineItems(prev => prev.map(l => {
      if (l.id !== id) return l;
      const updated = { ...l, [field]: value };
      if (field === 'itemId') {
        const selected = items.find(i => i.id === value);
        if (selected) {
           updated.rate = selected.sellingPrice || 0;
           updated.description = selected.description || '';
        }
      }
      updated.amount = updated.quantity * updated.rate;
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
    setIsSaving(true);
    try {
      const payload = {
        companyId, customerLedgerId: customerId, invoiceNumber: invoiceNo,
        date: invoiceDate, dueDate, orderNumber: orderNo, terms, salesperson, subject,
        subTotal, discountAmount, gstAmount, adjustment, totalAmount: total,
        customerNotes: notes, termsConditions: termsText,
        status, // 'Draft' or 'Confirmed'
        items: lineItems.map(l => ({ itemId: l.itemId, quantity: l.quantity, rate: l.rate })),
        projectId: projectId || null
      };
      
      if (id) {
         await salesAPI.updateInvoice(id, payload);
      } else {
         await salesAPI.createInvoice(payload);
      }
      navigate('/vouchers');
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

  if (loading) return <div className="p-20 text-center font-bold text-slate-400">Loading Invoice Interface...</div>;

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] relative overflow-hidden">
      {/* Sticky Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shrink-0 sticky top-0 z-20 no-print">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => window.history.length > 2 ? navigate(-1) : navigate('/sales-invoices')}
            className="p-2 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-900 transition-all"
          >
            <ArrowLeft size={22} />
          </button>
          <div>
            <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">{id ? 'Edit Invoice' : 'Create Invoice'}</h2>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Sales / Invoices</div>
          </div>
        </div>
        <button onClick={() => navigate('/sales-invoices')} className="text-slate-300 hover:text-slate-600 transition-colors"><X size={24} /></button>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="max-w-[1000px] mx-auto py-10 px-6">
          <div className="bg-white rounded border border-slate-200 shadow-sm p-12 space-y-12 animate-fade-in">
          
          {/* Top Section: Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-8">
            <div className="space-y-6">
              {/* Customer Name */}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-red-500 uppercase tracking-widest">Customer Name*</label>
                <div className="relative" ref={customerDropdownRef}>
                  <div className="flex shadow-sm">
                    <input 
                      type="text"
                      value={customerSearch}
                      onChange={(e) => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true); }}
                      onFocus={() => setShowCustomerDropdown(true)}
                      placeholder="Select or add a customer"
                      className="flex-1 h-11 px-4 bg-slate-50 border border-slate-200 rounded-l text-[13px] font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-all"
                    />
                    <button className="px-4 bg-[#1e61f0] text-white rounded-r flex items-center justify-center">
                      <Search size={16} />
                    </button>
                  </div>

                  {showCustomerDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 shadow-xl rounded z-50 overflow-hidden">
                      <div className="flex flex-col">
                        <div className="max-h-60 overflow-y-auto no-scrollbar">
                          {filteredCustomers.length === 0 ? (
                            <div className="p-4 text-center">
                              <p className="text-[12px] text-slate-400 mb-2">No customers found</p>
                            </div>
                          ) : (
                            <div className="py-1">
                              {filteredCustomers.map(c => (
                                <div 
                                  key={c.id}
                                  onClick={() => { 
                                    setCustomerId(c.id); 
                                    setCustomerSearch(c.name); 
                                    setShowCustomerDropdown(false); 
                                  }}
                                  className={`px-4 py-2 hover:bg-blue-50 cursor-pointer text-[14px] font-medium border-b border-slate-50 last:border-0 ${customerId === c.id ? 'bg-blue-50 text-blue-700' : 'text-slate-700'}`}
                                >
                                  {c.name}
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
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer hover:text-blue-500"
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
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Order Number</label>
                <input type="text" value={orderNo} onChange={e => setOrderNo(e.target.value)} className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded text-[13px] font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-all shadow-sm" />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-red-500 uppercase tracking-widest">Invoice Date*</label>
                <input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded text-[13px] font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-all shadow-sm" />
              </div>

              {/* Project Link */}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Project</label>
                <div className="relative" ref={projectDropdownRef}>
                  <button
                    type="button"
                    onClick={() => { setShowProjectDropdown(prev => !prev); setProjectSearch(''); }}
                    className={`w-full h-11 px-4 pr-9 border rounded text-[13px] font-bold text-left shadow-sm flex items-center justify-between transition-colors
                      ${showProjectDropdown ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200 bg-slate-50'}
                      ${projectId ? 'text-slate-800' : 'text-slate-400 font-medium'}`}
                  >
                    <span>{projects.find(p => p.id === projectId)?.name || 'Associate Project'}</span>
                    <ChevronDown size={14} className={`absolute right-3 text-slate-400 transition-transform ${showProjectDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showProjectDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 shadow-xl rounded-xl z-[200] overflow-hidden animate-fade-in">
                      <div className="p-2 border-b border-slate-100">
                        <div className="relative">
                          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
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
                          className={`px-4 py-2.5 cursor-pointer text-xs font-bold uppercase tracking-widest hover:bg-slate-50 border-b border-slate-50 ${!projectId ? 'text-blue-600' : 'text-slate-400'}`}
                        >
                          No Project
                        </div>
                        {projects.filter(p => !projectSearch || p.name.toLowerCase().includes(projectSearch.toLowerCase())).length === 0 ? (
                          <div className="py-6 text-center text-xs text-slate-400 font-medium uppercase tracking-widest opacity-60">No Match Found</div>
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
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Due Date</label>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded text-[13px] font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-all shadow-sm" />
              </div>

              {/* Terms */}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Terms</label>
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
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                     <ChevronDown size={16} />
                  </div>
                </div>
              </div>

              {/* Salesperson */}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Salesperson</label>
                <div className="relative" ref={salespersonDropdownRef}>
                  <button
                    type="button"
                    onClick={() => { setShowSalespersonDropdown(prev => !prev); setSalespersonSearch(''); }}
                    className={`w-full h-11 px-4 pr-9 border rounded text-[13px] font-bold text-left shadow-sm flex items-center justify-between transition-colors
                      ${showSalespersonDropdown ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200 bg-slate-50'}
                      ${salesperson ? 'text-slate-800' : 'text-slate-400 font-medium'}`}
                  >
                    <span>{salesperson || 'Select or Add Salesperson'}</span>
                    <ChevronDown size={14} className={`absolute right-3 text-slate-400 transition-transform ${showSalespersonDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showSalespersonDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 shadow-xl rounded-xl z-[200] overflow-hidden animate-fade-in">
                      <div className="p-2 border-b border-slate-100">
                        <div className="relative">
                          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
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
                          <div className="py-6 text-center text-xs text-slate-400 font-medium uppercase tracking-widest opacity-60">No Match Found</div>
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
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">Subject <Info size={14} className="text-slate-400" /></label>
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
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-bold text-slate-900 uppercase tracking-tight">Item Table</h3>
            <button className="text-[11px] font-bold text-[#1e61f0] flex items-center gap-2 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all">
              <Settings size={14} /> Bulk Actions
            </button>
          </div>

          <div className="border border-slate-200 rounded overflow-hidden shadow-sm bg-white">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-400 font-bold uppercase tracking-[0.1em]">
                  <th className="px-6 py-4 text-left font-bold">Item Details</th>
                  <th className="px-6 py-4 text-right w-28 font-bold">Quantity</th>
                  <th className="px-6 py-4 text-right w-36 font-bold">Rate</th>
                  <th className="px-6 py-4 text-right w-40 font-bold">Amount</th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lineItems.map(line => (
                  <tr key={line.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-5">
                      <ItemSearchSelector 
                        items={items}
                        value={items.find(it => it.id === line.itemId)?.name || ''}
                        onChange={(selected) => {
                          updateLine(line.id, 'itemId', selected.id);
                          updateLine(line.id, 'rate', selected.sellingPrice || 0);
                        }}
                        placeholder="Type or click to select an item."
                      />
                      <div className="text-[11px] text-slate-400 pl-4 mt-1 italic">
                        {items.find(i => i.id === line.itemId)?.description || 'No additional description'}
                      </div>
                    </td>
                    <td className="px-6 py-5 align-top">
                      <input type="number" value={line.quantity} onChange={e => updateLine(line.id, 'quantity', e.target.value)} className="w-full text-right bg-transparent border-none outline-none text-[13px] font-bold text-slate-600 focus:bg-white rounded transition-all" />
                    </td>
                    <td className="px-6 py-5 align-top font-mono">
                      <input type="number" value={line.rate} onChange={e => updateLine(line.id, 'rate', e.target.value)} className="w-full text-right bg-transparent border-none outline-none text-[13px] font-bold text-slate-600 focus:bg-white rounded transition-all" />
                    </td>
                    <td className="px-6 py-5 text-right align-top font-mono">
                      <span className="text-[13px] font-bold text-slate-900">{parseFloat(line.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </td>
                    <td className="px-4 py-5 text-center align-top">
                      <button onClick={() => removeLine(line.id)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <button onClick={addLine} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-[#1e61f0] text-[12px] font-bold rounded shadow-sm hover:bg-slate-50 transition-all">
            <Plus size={14} strokeWidth={3}/> Add New Row
          </button>
        </div>

        {/* Bottom Section */}
        <div className="flex justify-between items-start pt-12 border-t border-slate-100 gap-20">
           <div className="flex-1 max-w-md space-y-8">
              <div className="space-y-3">
                 <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Customer Notes</label>
                 <textarea 
                    value={notes} 
                    onChange={e => setNotes(e.target.value)} 
                    placeholder="Will be displayed on the invoice"
                    className="w-full h-24 p-4 bg-slate-50 border border-slate-200 rounded text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:border-blue-500 transition-all resize-none shadow-sm" 
                 />
              </div>

              <div className="space-y-3">
                 <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Terms & Conditions</label>
                 <textarea 
                   value={termsText} 
                   onChange={e => setTermsText(e.target.value)} 
                   placeholder="Business terms..." 
                   className="w-full h-24 bg-slate-50 border border-slate-200 rounded text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:border-blue-500 transition-all resize-none shadow-sm" 
                 />
              </div>
           </div>

           <div className="w-80 space-y-4">
              <div className="flex justify-between text-[13px]">
                <span className="font-bold text-slate-500 uppercase tracking-widest">Sub Total</span>
                <span className="font-bold text-slate-900 font-mono">₹{subTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>

              <div className="flex justify-between items-center text-[13px]">
                <label className="text-slate-500 font-bold uppercase tracking-widest">Discount (%)</label>
                <div className="flex items-center gap-4">
                   <input type="number" value={discountPercent} onChange={e => setDiscountPercent(e.target.value)} className="w-16 h-8 px-2 bg-slate-50 border border-slate-200 rounded text-right font-bold outline-none" />
                </div>
              </div>

              <div className="flex justify-between items-center text-[13px]">
                <label className="text-slate-500 font-bold uppercase tracking-widest">Tax / GST (%)</label>
                <select 
                  value={gstPercent} 
                  onChange={e => setGstPercent(parseFloat(e.target.value))}
                  className="w-24 h-8 px-2 bg-slate-50 border border-slate-200 rounded text-[12px] font-bold text-slate-700 outline-none"
                >
                   <option value="0">0%</option>
                   <option value="5">5%</option>
                   <option value="12">12%</option>
                   <option value="18">18%</option>
                   <option value="28">28%</option>
                </select>
              </div>

              <div className="flex justify-between items-center text-[13px]">
                <span className="text-slate-500 font-bold uppercase tracking-widest">Adjustment</span>
                <input type="number" value={adjustment} onChange={e => setAdjustment(e.target.value)} className="w-24 h-8 px-2 bg-slate-50 border border-slate-200 rounded text-right font-bold outline-none" />
              </div>

              <div className="pt-6 border-t border-slate-200 flex justify-between items-center bg-slate-50 -mx-8 px-8 py-4 mt-6">
                <span className="text-[14px] font-bold text-slate-500 uppercase tracking-widest">Total Amount</span>
                <span className="text-[24px] font-bold text-[#1e61f0] tracking-tighter font-mono">₹{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

        {/* Sticky Footer */}
        <footer className="bg-white border-t border-slate-200 px-8 py-4 flex items-center justify-between shrink-0 sticky bottom-0 z-20 no-print shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
          <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  <ShieldCheck size={14} className="text-blue-500" />
                  Encrypted & Secure Record Storage
              </div>
          </div>
          <div className="flex items-center gap-3">
              <button 
                  onClick={() => navigate('/sales-invoices')}
                  className="px-6 py-2 text-slate-500 text-[13px] font-bold hover:text-slate-900 transition-all uppercase tracking-widest"
              >
                  Discard
              </button>
              <button 
                  onClick={() => handleSave('Draft')}
                  disabled={isSaving}
                  className="px-6 py-2 bg-slate-100 text-slate-600 rounded text-[13px] font-bold hover:bg-slate-200 transition-all uppercase tracking-widest"
              >
                  {isSaving ? '...' : 'Save as Draft'}
              </button>
              <button 
                  onClick={() => handleSave('Confirmed')}
                  disabled={isSaving}
                  className="px-8 py-2.5 bg-[#1e61f0] text-white rounded font-bold text-[13px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
              >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <><Send size={16}/> Save and Send</>}
              </button>
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
      </div>
    );
  }
