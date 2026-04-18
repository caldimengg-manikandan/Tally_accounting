import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Plus, Trash2, Save, Printer, ArrowLeft, 
  Search, Info, Check, Loader2, X, Settings, ChevronDown, File, AlertTriangle
} from 'lucide-react';

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
                    <h3 className="text-[18px] font-black text-slate-900 tracking-tight">Manage Salespersons</h3>
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
                        className="px-4 py-2 bg-[#1e61f0] text-white text-[13px] font-black rounded-lg hover:bg-blue-700 transition-all flex items-center gap-1.5 whitespace-nowrap shadow-md shadow-blue-100"
                    >
                        <Plus size={14}/> New Salesperson
                    </button>
                </div>

                {/* Inline Add Form */}
                {showAddForm && (
                    <div className="mx-6 my-4 p-5 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-[11px] font-black text-red-500 uppercase tracking-widest mb-1.5">Name*</label>
                                <input
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    className="w-full h-9 px-3 border border-slate-300 rounded text-[13px] font-medium outline-none focus:border-blue-500 bg-white transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-black text-red-500 uppercase tracking-widest mb-1.5">Email*</label>
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
                                className="px-5 py-2 bg-[#1e61f0] text-white text-[12px] font-black rounded hover:bg-blue-700 transition-all disabled:opacity-40 shadow-sm"
                            >
                                Save and Select
                            </button>
                            <button
                                onClick={() => { setShowAddForm(false); setNewName(''); setNewEmail(''); }}
                                className="px-5 py-2 bg-white border border-slate-200 text-slate-600 text-[12px] font-black rounded hover:bg-slate-50 transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Table */}
                <div className="px-6">
                    <div className="grid grid-cols-2 py-3 border-b border-slate-100">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Salesperson Name</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</span>
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
  const [loading,   setLoading]   = useState(true);
  
  // Header Info
  const [customerId, setCustomerId] = useState('');
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

  const [isSaving, setIsSaving] = useState(false);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', type: 'info', showCancel: false });

  // ─── Load Data ──────────────────────────────────────────────────
  useEffect(() => {
    if (!companyId) return;
    const loadData = async () => {
      try {
        const [lRes, iRes] = await Promise.all([
          ledgerAPI.getByCompany(companyId),
          inventoryAPI.getByCompany(companyId)
        ]);
        const allLedgers = Array.isArray(lRes.data) ? lRes.data : [];
        const filteredCustomers = allLedgers.filter(l => {
          const gName = l.Group?.name || '';
          return gName.toLowerCase().includes('debtor') || gName.toLowerCase().includes('customer');
        });
        setCustomers(filteredCustomers);
        setItems(Array.isArray(iRes.data) ? iRes.data : []);

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
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [companyId, id, location.state]);

  // ─── Calculation Logic ──────────────────────────────────────────
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
        items: lineItems.map(l => ({ itemId: l.itemId, quantity: l.quantity, rate: l.rate }))
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
    <div className="min-h-screen bg-white text-slate-700 font-sans p-10 max-w-6xl mx-auto">
      <ManageSalespersonsModal
        isOpen={showManageSalespersons}
        onClose={() => setShowManageSalespersons(false)}
        salespersons={salespersons}
        onSave={setSalespersons}
        onSelect={(name) => { setSalesperson(name); }}
      />
      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-slate-600"><ArrowLeft size={24} /></button>
        <h1 className="text-2xl font-semibold text-slate-900">New Invoice</h1>
      </div>

      <div className="space-y-8">
        
        {/* Main Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-6">
          
          {/* Left Column */}
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <label className="w-32 text-sm text-rose-500 font-medium pt-2">Customer Name*</label>
              <div className="flex-1 flex gap-2">
                  <select 
                    value={customerId} 
                    onChange={e => {
                      if (e.target.value === 'NEW_CUSTOMER') {
                        navigate('/customers/new');
                      } else {
                        setCustomerId(e.target.value);
                      }
                    }}
                    className="flex-1 p-2 border border-slate-200 rounded text-sm focus:border-blue-500 outline-none"
                  >
                    <option value="">Select or add a customer</option>
                    <option value="NEW_CUSTOMER" className="text-blue-600 font-bold">➕ Add New Customer</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                 <button className="p-2 bg-blue-600 text-white rounded"><Search size={16}/></button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="w-32 text-sm text-rose-500 font-medium">Invoice#*</label>
              <div className="flex-1 flex items-center gap-2">
                <input type="text" value={invoiceNo} readOnly className="flex-1 p-2 border border-slate-200 rounded text-sm bg-slate-50" />
                <button 
                  onClick={() => setModalConfig({
                      isOpen: true,
                      title: 'Configuration',
                      message: 'Invoice Auto-numbering and prefix settings can be managed in the Settings panel.',
                      type: 'info',
                      showCancel: false,
                      confirmText: 'Close'
                  })}
                  className="text-slate-400 hover:text-blue-600 transition-colors"
                >
                  <Settings size={18}/>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="w-32 text-sm text-slate-500">Order Number</label>
              <input type="text" value={orderNo} onChange={e => setOrderNo(e.target.value)} className="flex-1 p-2 border border-slate-200 rounded text-sm outline-none" />
            </div>

            <div className="flex items-center gap-4">
              <label className="w-32 text-sm text-rose-500 font-medium">Invoice Date*</label>
              <div className="flex-1">
                 <input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className="w-full p-2 border border-slate-200 rounded text-sm outline-none focus:border-blue-500" />
              </div>
            </div>

            <div className="flex items-center gap-4 relative">
              <label className="w-32 text-sm text-slate-500">Terms</label>
              <div className="flex-1 relative group/terms">
                <select 
                  value={terms} 
                  onChange={e => {
                    if (e.target.value === 'CONFIGURE') {
                       // Logic to open terms configuration
                    } else {
                       setTerms(e.target.value);
                    }
                  }} 
                  className="w-full p-2 border border-slate-200 rounded text-sm outline-none appearance-none bg-white pr-8"
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
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 font-black">
                   <ChevronDown size={14} />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="w-32 text-sm text-slate-500">Due Date</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="flex-1 p-2 border border-slate-200 rounded text-sm bg-slate-50" />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <label className="w-32 text-sm text-slate-500">Accounts Receivable</label>
              <select value={arLedger} onChange={e => setArLedger(e.target.value)} className="flex-1 p-2 border border-slate-200 rounded text-sm outline-none">
                 <option>Accounts Receivable</option>
              </select>
            </div>

            <div className="flex items-center gap-4">
              <label className="w-32 text-sm text-slate-500">Salesperson</label>
              <div className="flex-1 relative" ref={salespersonDropdownRef}>
                <button
                  type="button"
                  onClick={() => { setShowSalespersonDropdown(prev => !prev); setSalespersonSearch(''); }}
                  className={`w-full h-9 px-3 pr-9 border rounded text-sm text-left shadow-sm flex items-center justify-between transition-colors
                    ${showSalespersonDropdown ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200 bg-white'}
                    ${salesperson ? 'text-slate-800' : 'text-slate-400 font-medium'}`}
                >
                  <span>{salesperson || 'Select or Add Salesperson'}</span>
                  <ChevronDown size={14} className={`absolute right-3 text-slate-400 transition-transform ${showSalespersonDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showSalespersonDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 shadow-xl rounded-xl z-[200] overflow-hidden animate-fade-in">
                    {/* Search */}
                    <div className="p-2 border-b border-slate-100">
                      <div className="relative">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          autoFocus
                          value={salespersonSearch}
                          onChange={e => setSalespersonSearch(e.target.value)}
                          placeholder="Search"
                          className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-blue-400 transition-all"
                        />
                      </div>
                    </div>

                    {/* List */}
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

                    {/* Manage Link */}
                    <div className="border-t border-slate-100">
                      <button
                        onClick={() => { setShowSalespersonDropdown(false); setShowManageSalespersons(true); }}
                        className="w-full flex items-center gap-2 px-4 py-3 text-sm font-bold text-[#1e61f0] hover:bg-blue-50 transition-colors"
                      >
                        <Plus size={14} /> Manage Salespersons
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Subject */}
        <div className="flex items-start gap-4">
           <label className="w-32 text-sm text-slate-500 pt-2">Subject</label>
           <textarea 
             value={subject} 
             onChange={e => setSubject(e.target.value)} 
             placeholder="Let your customer know what this invoice is for"
             className="flex-1 p-2 border border-slate-200 rounded text-sm outline-none h-16 resize-none"
           />
        </div>

        {/* Item Table */}
        <div className="mt-10">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase border-y border-slate-200">
                <th className="px-4 py-3 text-left">Item Details</th>
                <th className="px-4 py-3 text-right w-28">Quantity</th>
                <th className="px-4 py-3 text-right w-36">Rate</th>
                <th className="px-4 py-3 text-right w-40">Amount</th>
                <th className="px-4 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map(line => (
                <tr key={line.id} className="border-b border-slate-100 group">
                  <td className="px-4 py-4">
                    <div className="relative">
                      <select 
                        value={line.itemId} 
                        onChange={e => {
                          if (e.target.value === 'NEW_ITEM') {
                             navigate('/inventory/new');
                          } else {
                             updateLine(line.id, 'itemId', e.target.value);
                          }
                        }}
                        className="w-full p-2 border border-transparent hover:border-slate-200 border-dashed rounded text-sm outline-none bg-transparent appearance-none transition-all"
                      >
                        <option value="">Type or click to select an item.</option>
                        {items.map(it => (
                          <option key={it.id} value={it.id}>
                            {it.name} (Rate: ₹{parseFloat(it.sellingPrice || 0).toLocaleString()})
                          </option>
                        ))}
                        <option disabled>──────────</option>
                        <option value="NEW_ITEM" className="text-blue-600 font-bold">➕ Add New Item</option>
                      </select>
                      <div className="text-[11px] text-slate-400 pl-2 mt-1">
                        {items.find(i => i.id === line.itemId)?.description || 'Additional description...'}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right align-top">
                    <input type="number" value={line.quantity} onChange={e => updateLine(line.id, 'quantity', e.target.value)} className="w-full p-2 text-right text-sm outline-none bg-transparent border border-transparent focus:border-slate-200 rounded transition-all" />
                  </td>
                  <td className="px-4 py-4 text-right align-top">
                    <input type="number" value={line.rate} onChange={e => updateLine(line.id, 'rate', e.target.value)} className="w-full p-2 text-right text-sm outline-none bg-transparent border border-transparent focus:border-slate-200 rounded transition-all" />
                  </td>
                  <td className="px-4 py-4 text-right align-top">
                    <div className="p-2 text-sm font-bold text-slate-900">
                      {(line.quantity * line.rate).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center align-top">
                    <button onClick={() => removeLine(line.id)} className="mt-2 text-slate-300 hover:text-rose-500 transition-all"><X size={16}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="mt-4 flex gap-4">
            <button onClick={addLine} className="px-4 py-1 border border-slate-200 rounded text-xs font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-1">
              <Plus size={14} className="text-blue-600" /> Add New Row
            </button>
          </div>
        </div>

        {/* Totals & Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-20 pt-10">
           {/* Left: Notes */}
           <div className="space-y-6">
              <div className="space-y-2">
                 <label className="text-sm font-medium text-slate-500">Customer Notes</label>
                 <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full p-2 border border-slate-200 rounded text-sm outline-none h-24 italic" />
                 <p className="text-[10px] text-slate-400 italic">Will be displayed on the invoice</p>
              </div>
           </div>

           {/* Right: Totals */}
           <div className="space-y-4 bg-slate-50/50 p-6 rounded-lg">
              <div className="flex justify-between text-sm">
                <span>Sub Total</span>
                <span className="font-medium">{subTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                   <span>Discount</span>
                   <input type="number" value={discountPercent} onChange={e => setDiscountPercent(e.target.value)} className="w-12 p-1 border border-slate-200 rounded text-xs text-right" />
                   <span>%</span>
                </div>
                <span className="font-medium text-slate-500">{discountAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                   <span>GST</span>
                   <select 
                     value={gstPercent} 
                     onChange={e => setGstPercent(parseFloat(e.target.value))}
                     className="ml-2 p-1 border border-slate-200 rounded text-xs outline-none"
                   >
                      <option value="0">GST (0%)</option>
                      <option value="5">GST (5%)</option>
                      <option value="12">GST (12%)</option>
                      <option value="18">GST (18%)</option>
                      <option value="28">GST (28%)</option>
                   </select>
                </div>
                <span className="font-medium text-slate-500">{gstAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2 border-b border-slate-200 border-dashed">
                   <span>Adjustment</span>
                   <Info size={12} className="text-slate-400" />
                </div>
                <input type="number" value={adjustment} onChange={e => setAdjustment(e.target.value)} className="w-24 p-1 border border-slate-200 rounded text-right text-xs" />
              </div>

              <div className="flex justify-between text-lg font-bold text-slate-900 pt-4 border-t border-slate-200">
                <span>Total ( ₹ )</span>
                <span>{total.toFixed(2)}</span>
              </div>
           </div>
        </div>

        {/* Footer */}
        <div className="pt-10 space-y-4">
           <div className="space-y-1">
             <label className="text-sm font-medium text-slate-500">Terms & Conditions</label>
             <textarea value={termsText} onChange={e => setTermsText(e.target.value)} placeholder="Enter the terms and conditions of your business to be displayed in your transaction" className="w-full p-2 border border-slate-200 rounded text-sm outline-none h-20" />
           </div>
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-white border-t border-slate-100 py-4 flex gap-4">
          {status === 'Confirmed' ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 animate-fade-in shadow-sm">
              <Check size={18} strokeWidth={3} />
              <span className="text-[13px] font-black uppercase tracking-widest">RECORDED</span>
            </div>
          ) : (
            <>
              <button 
                onClick={() => handleSave('Draft')}
                className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] font-black text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
              >
                <File size={16} /> Save as Draft
              </button>
              <button 
                onClick={() => handleSave('Confirmed')}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-black text-[13px] hover:bg-blue-700 transition-all shadow-sm shadow-blue-200"
              >
                Save and Send
              </button>
            </>
          )}
           <button onClick={() => navigate(-1)} className="px-6 py-2 border border-slate-200 rounded text-sm font-medium hover:bg-slate-50">Cancel</button>
        </div>
      </div>
      
      <ConfirmModal 
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        showCancel={modalConfig.showCancel}
        confirmText={modalConfig.confirmText}
      />
    </div>
  );
}
