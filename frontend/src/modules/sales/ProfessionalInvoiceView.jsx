import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Trash2, Save, Printer, ArrowLeft, 
  Search, Package, Users, Calculator, Info,
  CheckCircle2, Loader2, AlertCircle, TrendingUp
} from 'lucide-react';
import { ledgerAPI, inventoryAPI, salesAPI, companyAPI, retainerInvoiceAPI } from '../../services/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ProfessionalInvoiceView() {
  const navigate = useNavigate();
  const companyId = localStorage.getItem('companyId');

  // ─── State ────────────────────────────────────────────────────────
  const [customers, setCustomers] = useState([]);
  const [items,     setItems]     = useState([]);
  const [company,   setCompany]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  
  // Header Info
  const [customerId, setCustomerId] = useState('');
  const [date,       setDate]       = useState(new Date().toISOString().split('T')[0]);
  const [invoiceNo,  setInvoiceNo]  = useState(`INV-${Date.now().toString().slice(-6)}`);
  const [narration,  setNarration]  = useState('');

  // Line Items
  const [lineItems, setLineItems] = useState([
    { id: Date.now(), itemId: '', quantity: 1, rate: 0, gstRate: 18, amount: 0 }
  ]);

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'success', 'error'

  // Retainer Selection
  const [availableRetainers, setAvailableRetainers] = useState([]);
  const [appliedRetainerId,  setAppliedRetainerId]  = useState('');
  const [retainerAmountToApply, setRetainerAmountToApply] = useState(0);

  // ─── Load Data ──────────────────────────────────────────────────
  useEffect(() => {
    if (!companyId) return;
    Promise.all([
      ledgerAPI.getByCompany(companyId),
      inventoryAPI.getByCompany(companyId),
      companyAPI.getById(companyId)
    ]).then(([lRes, iRes, cRes]) => {
      // Filter only Sundry Debtors for Customers
      const allLedgers = Array.isArray(lRes.data) ? lRes.data : [];
      setCustomers(allLedgers); 
      setItems(Array.isArray(iRes.data) ? iRes.data : []);
      setCompany(cRes.data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [companyId]);

  // Fetch available retainers when customer changes
  useEffect(() => {
     if (customerId) {
        retainerInvoiceAPI.getByCompany(companyId)
          .then(res => {
             // Filter by customerName and status (Paid or PartiallyApplied)
             const customer = customers.find(c => c.id === customerId);
             const list = (res.data || []).filter(r => 
                r.customerName === customer?.name && 
                ['Paid', 'PartiallyApplied'].includes(r.status)
             );
             setAvailableRetainers(list);
          })
          .catch(console.error);
     } else {
        setAvailableRetainers([]);
        setAppliedRetainerId('');
     }
  }, [customerId, customers, companyId]);

  // ─── Calculation Logic ──────────────────────────────────────────
  const totals = useMemo(() => {
    let taxable = 0;
    let tax = 0;
    lineItems.forEach(line => {
      const lineTaxable = parseFloat(line.quantity) * parseFloat(line.rate);
      const lineTax = lineTaxable * (parseFloat(line.gstRate) / 100);
      taxable += lineTaxable;
      tax += lineTax;
    });
    return { taxable, tax, total: taxable + tax };
  }, [lineItems]);

  // ─── Handlers ───────────────────────────────────────────────────
  const addLine = () => setLineItems([...lineItems, { id: Date.now(), itemId: '', quantity: 1, rate: 0, gstRate: 18, amount: 0 }]);
  
  const removeLine = (id) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter(l => l.id !== id));
  };

  const updateLine = (id, field, value) => {
    setLineItems(prev => prev.map(l => {
      if (l.id !== id) return l;
      const updated = { ...l, [field]: value };
      
      // Auto-fill rate if item is selected
      if (field === 'itemId' && value) {
        const selected = items.find(i => i.id === value);
        if (selected) {
          updated.rate = selected.sellingPrice || 0;
          updated.gstRate = selected.gstRate || 18;
        }
      }
      return updated;
    }));
  };

  const handlePostInvoice = async () => {
    if (!customerId || lineItems.some(l => !l.itemId)) {
      alert('Please select a customer and all items.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        companyId,
        customerLedgerId: customerId,
        date,
        narration: narration || `Sales Invoice #${invoiceNo}`,
        items: lineItems.map(l => ({
          itemId: l.itemId,
          quantity: l.quantity,
          rate: l.rate,
          gstRate: l.gstRate
        }))
      };

      const response = await salesAPI.createInvoice(payload);
      const createdInvoice = response.data.voucher || response.data; // Depending on what recordTaxInvoice returns

      // APPLY RETAINER IF SELECTED
      if (appliedRetainerId && retainerAmountToApply > 0) {
          await retainerInvoiceAPI.applyToInvoice(appliedRetainerId, {
              invoiceId: createdInvoice.id,
              amountToAdjust: parseFloat(retainerAmountToApply),
              CompanyId: companyId
          });
      }

      setSaveStatus('success');
      setTimeout(() => navigate('/vouchers'), 2000);
    } catch (err) {
      console.error('Frontend Posting Error:', err);
      const msg = err.response?.data?.error || err.message || 'Unknown Error';
      alert(`Posting Failed: ${msg}`);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const generatePDF = () => {
    const customer = customers.find(c => c.id === customerId);
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24); doc.setFont('helvetica', 'bold');
    doc.text('TAX INVOICE', 140, 25);
    
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text('GENERATED VIA TALLY REPLICA', 14, 25);
    
    // Billing Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12); doc.setFont('helvetica', 'bold');
    doc.text('Bill From:', 14, 48);
    doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    doc.text(company?.name || 'Tally Replica', 140, 48, { align: 'right' });
    doc.text(company?.gstNumber ? `GSTIN: ${company.gstNumber}` : '', 140, 52, { align: 'right' });
    
    doc.text('Bill To:', 14, 55);
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text(customer?.name || 'Walk-in Customer', 14, 62);
    doc.text('GSTIN: Unregistered', 14, 67);
    
    doc.text(`Invoice No: ${invoiceNo}`, 140, 62);
    doc.text(`Date: ${date}`, 140, 67);

    // Table
    const tableBody = lineItems.map(l => {
      const item = items.find(i => i.id === l.itemId);
      const taxable = l.quantity * l.rate;
      return [item?.name || 'Unknown', l.quantity, `Rs. ${l.rate}`, `${l.gstRate}%`, `Rs. ${taxable.toFixed(2)}` ];
    });

    autoTable(doc, {
      startY: 80,
      head: [['Description', 'Qty', 'Rate', 'GST %', 'Total (Excl. Tax)']],
      body: tableBody,
      headStyles: { fillColor: [15, 23, 42] },
      foot: [
        ['', '', '', 'Taxable Value', `Rs. ${totals.taxable.toFixed(2)}`],
        ['', '', '', 'Total GST (18%)', `Rs. ${totals.tax.toFixed(2)}`],
        ['', '', '', 'GRAND TOTAL', `Rs. ${totals.total.toFixed(2)}`]
      ],
      footStyles: { fillColor: [248, 250, 252], textColor: [0, 0, 0], fontStyle: 'bold' }
    });

    doc.save(`Invoice_${invoiceNo}.pdf`);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="animate-spin text-slate-400" size={40} />
      <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading Billing Intelligence...</span>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-8 font-sans text-slate-900">
      
      {/* ── HEADER ACTION BAR ─────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-3 bg-white rounded-2xl border border-slate-100 hover:bg-slate-50 transition-all shadow-sm">
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          
          {company?.logoUrl && (
            <img src={company.logoUrl} alt="Logo" className="w-12 h-12 rounded-xl object-contain border border-slate-100 p-1 bg-white" />
          )}

          <div>
            <h1 className="text-3xl font-black tracking-tighter">{company?.name || 'Boutique Tax Invoice'}</h1>
            <p className="text-slate-400 font-bold text-[11px] uppercase tracking-[0.2em] mt-1">Integrated Sales & Inventory Hub</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={generatePDF} className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
            <Printer size={16} /> Preview PDF
          </button>
          <button 
            onClick={handlePostInvoice}
            disabled={isSaving}
            className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest text-white shadow-xl transition-all
              ${saveStatus === 'success' ? 'bg-emerald-600 shadow-emerald-500/20' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-900/20'}`}
          >
             {isSaving ? <Loader2 size={16} className="animate-spin" /> : saveStatus === 'success' ? <CheckCircle2 size={16} /> : <Save size={16} />}
             {saveStatus === 'success' ? 'Invoice Posted!' : 'Post & Update Stock'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        
        {/* ── LEFT: FORM ────────────────────────────────────────── */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          
          {/* Metadata Card */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Users size={12} /> Party A/c Name (Sundry Debtor)
                </label>
                <select 
                  value={customerId} 
                  onChange={e => setCustomerId(e.target.value)}
                  className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 focus:ring-2 focus:ring-slate-900 transition-all"
                >
                  <option value="">Select a Customer...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    Date
                  </label>
                  <input 
                    type="date" 
                    value={date} 
                    onChange={e => setDate(e.target.value)}
                    className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    Invoice No.
                  </label>
                  <input 
                    type="text" 
                    value={invoiceNo} 
                    readOnly
                    className="w-full p-4 bg-slate-100 border-none rounded-2xl font-black text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Line Items Card */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="bg-slate-50/50 px-8 py-4 border-b border-slate-100 flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <Package size={14} /> Particulars & Inventory Logic
              </span>
              <button onClick={addLine} className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-widest hover:text-blue-800 transition-all">
                <Plus size={14} /> Add Line Item
              </button>
            </div>
            
            <div className="divide-y divide-slate-50">
              {lineItems.map((line, idx) => (
                <div key={line.id} className="p-8 grid grid-cols-12 gap-6 items-end group hover:bg-slate-50/30 transition-all">
                  <div className="col-span-5 space-y-2">
                     <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Name of Item</label>
                     <select 
                      value={line.itemId}
                      onChange={e => updateLine(line.id, 'itemId', e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl font-bold text-sm focus:ring-2 focus:ring-slate-900"
                     >
                       <option value="">Select Item...</option>
                       {items.map(i => <option key={i.id} value={i.id}>{i.name} (Stock: {i.currentStock})</option>)}
                     </select>
                  </div>
                  <div className="col-span-2 space-y-2">
                     <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Qty</label>
                     <input 
                      type="number" 
                      value={line.quantity}
                      onChange={e => updateLine(line.id, 'quantity', e.target.value)}
                      className={`w-full px-4 py-3 bg-white border rounded-xl font-bold text-sm transition-colors
                        ${items.find(i => i.id === line.itemId)?.currentStock < line.quantity 
                          ? 'border-rose-300 bg-rose-50 text-rose-700' 
                          : 'border-slate-100 text-slate-700'}`}
                     />
                     {items.find(i => i.id === line.itemId)?.currentStock < line.quantity && (
                       <p className="text-[8px] font-black text-rose-500 uppercase tracking-widest absolute mt-1 animate-pulse">Insufficient Stock!</p>
                     )}
                  </div>
                  <div className="col-span-3 space-y-2">
                     <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Rate (₹)</label>
                     <input 
                      type="number" 
                      value={line.rate}
                      onChange={e => updateLine(line.id, 'rate', e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl font-bold text-sm"
                     />
                  </div>
                  <div className="col-span-2 flex justify-end pb-3">
                    <button onClick={() => removeLine(line.id)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-8 bg-slate-50/50 border-t border-slate-100">
               <textarea 
                value={narration}
                onChange={e => setNarration(e.target.value)}
                placeholder="Enter specialized narration / bank details / terms & conditions..."
                className="w-full p-4 bg-white border border-slate-100 rounded-2xl text-xs font-medium placeholder:text-slate-300 focus:ring-0 focus:border-slate-200 min-h-[100px]"
               />
            </div>
          </div>
        </div>

        {/* ── RIGHT: SUMMARY ────────────────────────────────────── */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          
          {/* Totals Summary */}
          <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-slate-900/30 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-slate-800 rounded-full blur-3xl -mr-32 -mt-32 transition-transform duration-1000 group-hover:scale-125"></div>
            
            <div className="relative z-10">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8 border-b border-slate-800 pb-4">Audit Summary</h4>
              
              <div className="space-y-6">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-slate-400">Taxable Value</span>
                  <span className="font-black tracking-tight">₹ {totals.taxable.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                   <div className="flex flex-col">
                      <span className="font-bold text-slate-400">Estimated GST</span>
                      <span className="text-[9px] font-black text-slate-500">CGST (9%) + SGST (9%)</span>
                   </div>
                   <span className="font-black text-blue-400 tracking-tight">+ ₹ {totals.tax.toLocaleString('en-IN')}</span>
                </div>

                {availableRetainers.length > 0 && (
                   <div className="pt-4 border-t border-slate-800 space-y-4">
                      <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Adjust Retainers (Advance Paid)</p>
                      <select 
                        value={appliedRetainerId}
                        onChange={e => {
                           setAppliedRetainerId(e.target.value);
                           const ret = availableRetainers.find(al => al.id === e.target.value);
                           if (ret) setRetainerAmountToApply(parseFloat(ret.amountReceived) - parseFloat(ret.amountUsed));
                        }}
                        className="w-full bg-slate-800 border-none text-xs text-white rounded-lg p-3 outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                         <option value="">Select Retainer to Apply...</option>
                         {availableRetainers.map(r => (
                            <option key={r.id} value={r.id}>
                               {r.invoiceNumber} (Bal: ₹{(parseFloat(r.amountReceived) - parseFloat(r.amountUsed)).toLocaleString()})
                            </option>
                         ))}
                      </select>
                      {appliedRetainerId && (
                         <div className="flex justify-between items-center bg-emerald-900/40 p-3 rounded-lg border border-emerald-800/50 animate-fade-in">
                            <span className="text-[11px] font-bold text-emerald-100">Apply Amount</span>
                            <div className="flex items-center gap-2">
                               <span className="text-emerald-500 text-[10px]">- ₹</span>
                               <input 
                                 type="number" 
                                 value={retainerAmountToApply}
                                 onChange={e => setRetainerAmountToApply(e.target.value)}
                                 className="w-24 bg-transparent border-b border-emerald-500 text-right text-xs text-white font-black outline-none"
                               />
                            </div>
                         </div>
                      )}
                   </div>
                )}
                
                <div className="pt-6 border-t border-slate-800 mt-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 text-center">Final Balance Due</span>
                    <span className="text-5xl font-black tracking-tighter text-center">₹{(totals.total - (appliedRetainerId ? parseFloat(retainerAmountToApply || 0) : 0)).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Insights */}
          <div className="bg-emerald-50 rounded-3xl p-8 border border-emerald-100 space-y-4">
             <div className="flex items-start gap-4">
               <div className="p-3 bg-emerald-500 rounded-2xl text-white shadow-lg shadow-emerald-500/20">
                 <Calculator size={18} />
               </div>
               <div>
                 <h5 className="font-black text-emerald-900 text-sm">Real-time Stock Auditing</h5>
                 <p className="text-[11px] font-bold text-emerald-700/70 mt-1 leading-relaxed">
                   The system will automatically credit your Sales account and debit your Customer’s ledger upon posting. 
                 </p>
               </div>
             </div>
             <div className="pt-4 border-t border-emerald-100 flex items-center gap-2">
                <Info size={14} className="text-emerald-500" />
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest underline decoration-2 underline-offset-4 cursor-pointer hover:text-emerald-800">Review Tax Equations</span>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
