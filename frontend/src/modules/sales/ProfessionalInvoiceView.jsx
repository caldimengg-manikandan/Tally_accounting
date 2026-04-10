import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Plus, Trash2, Save, Printer, ArrowLeft, 
  Search, Info, Check, Loader2, X, Settings, ChevronDown, File
} from 'lucide-react';
import { ledgerAPI, inventoryAPI, salesAPI, companyAPI } from '../../services/api';

export default function ProfessionalInvoiceView() {
  const { id } = useParams();
  const navigate = useNavigate();
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

  // ─── Load Data ──────────────────────────────────────────────────
  useEffect(() => {
    if (!companyId) return;
    const loadData = async () => {
      try {
        const [lRes, iRes] = await Promise.all([
          ledgerAPI.getByCompany(companyId),
          inventoryAPI.getByCompany(companyId)
        ]);
        setCustomers(Array.isArray(lRes.data) ? lRes.data : []);
        setItems(Array.isArray(iRes.data) ? iRes.data : []);

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
  }, [companyId, id]);

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
    if (!customerId) return alert('Please select a customer');
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
      alert('Failed to save invoice');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="p-20 text-center font-bold text-slate-400">Loading Invoice Interface...</div>;

  return (
    <div className="min-h-screen bg-white text-slate-700 font-sans p-10 max-w-6xl mx-auto">
      
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
                  onClick={() => alert('Invoice Auto-numbering configuration.')}
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
              <select 
                value={salesperson} 
                onChange={e => {
                  if (e.target.value === 'NEW') {
                    navigate('/customers/new');
                  } else {
                    setSalesperson(e.target.value);
                  }
                }} 
                className="flex-1 p-2 border border-slate-200 rounded text-sm outline-none"
              >
                 <option value="">Select or Add Salesperson</option>
                 <option value="NEW">➕ Add New Salesperson</option>
                 <option value="Internal Team">Internal Team</option>
                 <option value="Direct Sales">Direct Sales</option>
              </select>
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
                <th className="px-4 py-3 text-left w-1/2">Item Details</th>
                <th className="px-4 py-3 text-right">Quantity</th>
                <th className="px-4 py-3 text-right">Rate</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map(line => (
                <tr key={line.id} className="border-b border-slate-100 group">
                  <td className="px-4 py-4">
                    <div className="relative group">
                      <select 
                        value={line.itemId} 
                        onChange={e => {
                          if (e.target.value === 'NEW_ITEM') {
                             navigate('/inventory/new');
                          } else {
                             updateLine(line.id, 'itemId', e.target.value);
                          }
                        }}
                        className="w-full p-2 border border-transparent hover:border-slate-200 border-dashed rounded text-sm outline-none bg-transparent appearance-none"
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
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <input type="number" value={line.quantity} onChange={e => updateLine(line.id, 'quantity', e.target.value)} className="w-20 p-2 text-right text-sm outline-none bg-transparent border border-transparent focus:border-slate-200 rounded" />
                  </td>
                  <td className="px-4 py-4 text-right">
                    <input type="number" value={line.rate} onChange={e => updateLine(line.id, 'rate', e.target.value)} className="w-24 p-2 text-right text-sm outline-none bg-transparent border border-transparent focus:border-slate-200 rounded" />
                  </td>
                  <td className="px-4 py-4 text-right text-sm font-medium">{(line.quantity * line.rate).toFixed(2)}</td>
                  <td className="px-4 py-4 text-center">
                    <button onClick={() => removeLine(line.id)} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><X size={16}/></button>
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
    </div>
  );
}
