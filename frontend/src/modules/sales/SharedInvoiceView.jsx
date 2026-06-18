import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { paymentAPI } from '../../services/api';
import { 
  CheckCircle2, CreditCard, Loader2, Calendar, FileText, 
  MapPin, AlertTriangle, ShieldCheck, HelpCircle, Receipt
} from 'lucide-react';
import { getCurrencyDisplay } from '../../utils/currencies';

const formatAddress = (address) => {
  if (!address) return '';
  try {
    if (typeof address === 'string' && (address.startsWith('{') || address.startsWith('['))) {
      const parsed = JSON.parse(address);
      if (typeof parsed === 'object') {
        return [
          parsed.attention,
          parsed.street1,
          parsed.street2,
          parsed.city,
          parsed.state,
          parsed.country,
          parsed.pinCode
        ].filter(Boolean).join(', ');
      }
    }
    return address;
  } catch (e) {
    return address;
  }
};

const SharedInvoiceView = () => {
  const { share_token } = useParams();
  const [searchParams] = useSearchParams();
  const isPaymentSuccess = searchParams.get('payment') === 'success';

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (share_token) fetchInvoice();
  }, [share_token]);

  const fetchInvoice = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await paymentAPI.getPublicInvoice(share_token);
      setInvoice(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'This invoice link is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = () => {
    if (!invoice?.paymentLink) return;
    setPaying(true);
    // Securely redirect user to the gateway hosted page
    window.location.href = invoice.paymentLink;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans text-slate-500">
        <Loader2 size={36} className="animate-spin text-blue-600 mb-3" />
        <span className="text-sm font-bold uppercase tracking-widest">Retrieving Secure Invoice...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans p-6 text-center">
        <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center text-rose-500 mb-4 shadow-sm animate-bounce">
          <AlertTriangle size={28} />
        </div>
        <h1 className="text-xl font-bold text-slate-800">Access Denied</h1>
        <p className="text-sm text-slate-500 max-w-md mt-2 leading-relaxed">{error}</p>
      </div>
    );
  }

  const company = invoice.Company || {};
  const customer = invoice.CustomerLedger || {};
  const items = invoice.items || [];
  const currencySymbol = getCurrencyDisplay(customer.currency);
  const outstandingBalance = parseFloat(invoice.balance || invoice.totalAmount || 0);

  return (
    <div className="min-h-screen bg-[#F5F8FA] font-sans pb-24 text-slate-900">
      
      {/* HEADER BAR */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center px-8 sticky top-0 z-40 shadow-sm justify-between">
        <div className="flex items-center gap-2">
          <Receipt className="text-blue-600" size={24} />
          <span className="text-base font-bold text-slate-800 tracking-tight">CalTally Invoice Portal</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold uppercase tracking-wider">
          <ShieldCheck className="text-emerald-500" size={14} /> Secured Checkout
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 flex flex-col lg:flex-row gap-8 items-start">
        
        {/* LEFT PANEL: The Tally-style Invoice document */}
        <div className="flex-1 w-full bg-white border border-slate-300 shadow-xl relative overflow-hidden" style={{ minHeight: '600px' }}>
          
          {/* Status badge in shared view */}
          <div className="absolute top-6 right-6 no-print">
            <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border shadow-inner
              ${invoice.status === 'Paid' 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                : invoice.status === 'Partially Paid'
                  ? 'bg-amber-50 text-amber-700 border-amber-100'
                  : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
              {invoice.status}
            </span>
          </div>

          {/* Tally Invoice Header */}
          <div className="p-8 border-b-2 border-slate-900">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div>
                <h2 className="text-lg font-bold text-slate-900 italic tracking-tight">{company.name}</h2>
                <p className="text-[12px] text-slate-500 mt-1 leading-relaxed whitespace-pre-wrap">{company.address}</p>
                {company.email && <p className="text-[12px] text-slate-400 mt-1">Email: {company.email}</p>}
                {company.gstNumber && <p className="text-[11px] text-slate-400 mt-1">GSTIN/UIN: {company.gstNumber}</p>}
              </div>
              <div className="text-left md:text-right space-y-1">
                <h1 className="text-2xl font-extrabold text-slate-900 uppercase tracking-wider italic mb-2">TAX INVOICE</h1>
                <p className="text-[12px] text-slate-500">Invoice No: <strong className="text-slate-800 font-bold">{invoice.invoiceNumber}</strong></p>
                <p className="text-[12px] text-slate-500">Date: <strong className="text-slate-800 font-bold">{new Date(invoice.date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</strong></p>
                {invoice.dueDate && <p className="text-[12px] text-slate-500">Due Date: <strong className="text-slate-800 font-bold">{new Date(invoice.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</strong></p>}
              </div>
            </div>
          </div>

          {/* Buyer/Consignee Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 border-b border-slate-900 divide-y md:divide-y-0 md:divide-x divide-slate-900">
            <div className="p-6 space-y-1">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 underline">Buyer (Bill To):</h3>
              <p className="font-bold text-slate-900 text-[13px]">{customer.displayName || customer.name}</p>
              <p className="text-[12px] text-slate-500 leading-relaxed whitespace-pre-wrap">{formatAddress(customer.billingAddress || customer.address)}</p>
              {customer.gstNumber && <p className="text-[11px] text-slate-700 mt-1.5">GSTIN/UIN: <span className="font-bold">{customer.gstNumber}</span></p>}
            </div>
            <div className="p-6 space-y-1">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 underline">Consignee (Ship To):</h3>
              <p className="font-bold text-slate-900 text-[13px]">{customer.displayName || customer.name}</p>
              <p className="text-[12px] text-slate-500 leading-relaxed whitespace-pre-wrap">{formatAddress(customer.shippingAddress || customer.address)}</p>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-900">
                <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest w-12 text-center border-r border-slate-200">Sl.</th>
                <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-r border-slate-200">Description of Goods</th>
                <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest w-24 text-center border-r border-slate-200">HSN/SAC</th>
                <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest w-24 text-center border-r border-slate-200">Qty</th>
                <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest w-28 text-right border-r border-slate-200">Rate</th>
                <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest w-28 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 border-b border-slate-900">
              {items.map((it, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="px-6 py-3 text-center text-slate-400 border-r border-slate-200 font-medium">{idx + 1}</td>
                  <td className="px-6 py-3 border-r border-slate-200">
                    <p className="font-bold text-slate-800 text-[13px]">{it.Item?.name || 'Service Line'}</p>
                    {it.description && <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{it.description}</p>}
                  </td>
                  <td className="px-6 py-3 text-center text-slate-500 border-r border-slate-200 font-medium">{it.Item?.hsnCode || '-'}</td>
                  <td className="px-6 py-3 text-center text-slate-700 border-r border-slate-200 font-medium">{parseFloat(it.quantity || 1).toFixed(2)}</td>
                  <td className="px-6 py-3 text-right text-slate-700 border-r border-slate-200 font-mono">{parseFloat(it.rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td className="px-6 py-3 text-right font-bold text-slate-900 font-mono">{parseFloat(it.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="divide-y divide-slate-100 font-medium text-slate-600 bg-slate-50/50">
              <tr>
                <td colSpan="4" className="px-6 py-3 text-right border-r border-slate-200 font-bold">Total Quantity</td>
                <td className="px-6 py-3 border-r border-slate-200"></td>
                <td className="px-6 py-3 text-right font-bold text-slate-900 font-mono">
                  {items.reduce((sum, it) => sum + parseFloat(it.quantity || 0), 0).toFixed(2)}
                </td>
              </tr>
              <tr>
                <td colSpan="5" className="px-6 py-3 text-right border-r border-slate-200">Sub Total</td>
                <td className="px-6 py-3 text-right font-bold text-slate-800 font-mono">
                  {parseFloat(invoice.subTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
              </tr>
              {parseFloat(invoice.gstAmount || 0) > 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-3 text-right border-r border-slate-200">GST (18%)</td>
                  <td className="px-6 py-3 text-right font-bold text-slate-800 font-mono">
                    {parseFloat(invoice.gstAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              )}
              {parseFloat(invoice.adjustment || 0) !== 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-3 text-right border-r border-slate-200">Adjustments</td>
                  <td className="px-6 py-3 text-right font-bold text-slate-800 font-mono">
                    {parseFloat(invoice.adjustment || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              )}
              <tr className="bg-slate-100 font-bold text-slate-900 text-sm">
                <td colSpan="5" className="px-6 py-4 text-right border-r border-slate-300">Grand Total</td>
                <td className="px-6 py-4 text-right font-mono font-extrabold text-blue-600">
                  {currencySymbol} {parseFloat(invoice.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Customer notes & Terms */}
          {(invoice.customerNotes || invoice.termsConditions) && (
            <div className="p-8 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6 text-[12px] text-slate-500">
              {invoice.customerNotes && (
                <div>
                  <h4 className="font-bold text-slate-700 mb-1">Customer Notes:</h4>
                  <p className="whitespace-pre-wrap leading-relaxed">{invoice.customerNotes}</p>
                </div>
              )}
              {invoice.termsConditions && (
                <div>
                  <h4 className="font-bold text-slate-700 mb-1">Terms & Conditions:</h4>
                  <p className="whitespace-pre-wrap leading-relaxed">{invoice.termsConditions}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT PANEL: Checkout details Card */}
        <div className="w-full lg:w-96 space-y-6 shrink-0 sticky top-24">
          
          {/* Main payment box */}
          {isPaymentSuccess ? (
            <div className="bg-white border border-emerald-200 rounded-3xl shadow-xl p-8 text-center space-y-6">
              <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center text-emerald-500 mx-auto shadow-sm animate-pulse">
                <CheckCircle2 size={32} />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-slate-800">Payment Successful!</h2>
                <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                  Thank you! Your payment has been received and automatically credited against invoice <strong>{invoice.invoiceNumber}</strong>.
                </p>
              </div>
              <button 
                onClick={fetchInvoice}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
              >
                Refresh Invoice Status
              </button>
            </div>
          ) : outstandingBalance <= 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl shadow-xl p-8 text-center space-y-6">
              <div className="w-16 h-16 bg-blue-50 border border-blue-100 rounded-full flex items-center justify-center text-blue-500 mx-auto shadow-sm">
                <CheckCircle2 size={32} />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-slate-800">Invoice Fully Paid</h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  No outstanding balance remains for invoice <strong>{invoice.invoiceNumber}</strong>.
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center font-bold font-mono text-slate-500 text-sm">
                Balance Due: {currencySymbol} 0.00
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden shadow-slate-200/50">
              <div className="p-8 space-y-6">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Outstanding Balance</span>
                  <h2 className="text-3xl font-extrabold text-rose-600 font-mono">
                    {currencySymbol} {outstandingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </h2>
                </div>

                <div className="space-y-3 pt-2 text-xs text-slate-500 font-medium">
                  <div className="flex justify-between">
                    <span>Total Amount:</span>
                    <span className="font-bold text-slate-700">{currencySymbol} {parseFloat(invoice.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount Paid:</span>
                    <span className="font-bold text-slate-700">{currencySymbol} {parseFloat(invoice.amountPaid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {invoice.paymentLink ? (
                  <button 
                    onClick={handlePayNow}
                    disabled={paying}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-500 text-white rounded-2xl text-[13px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all active:scale-98"
                  >
                    {paying ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />} Pay Now Online
                  </button>
                ) : (
                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-amber-700 text-xs text-center font-medium leading-relaxed">
                    Online payment link is currently unavailable for this invoice. Please contact the company to enable checkout.
                  </div>
                )}
              </div>

              <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 leading-relaxed flex items-center gap-2.5 font-medium">
                <ShieldCheck size={18} className="text-slate-300" />
                Payments are securely processed directly via PCI-DSS compliant hosted checkouts.
              </div>
            </div>
          )}

          {/* Payment FAQ/Helper */}
          <div className="bg-slate-100/60 rounded-2xl p-6 border border-slate-200/50 space-y-3 text-xs text-slate-500 leading-relaxed font-medium">
            <h4 className="font-bold text-slate-700 flex items-center gap-1"><HelpCircle size={14} /> Need Help?</h4>
            <p>If you encounter issues during payment or need payment support, please contact <strong>{company.name}</strong> directly.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharedInvoiceView;
