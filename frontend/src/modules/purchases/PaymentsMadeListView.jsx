import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Filter, MoreHorizontal, 
  ChevronRight, Wallet, ArrowDownUp,
  Download, Printer, Edit, Trash2, X, AlertCircle, RefreshCw,
  Sliders, ChevronDown, CheckCircle2
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { paymentMadeAPI, voucherAPI, companyAPI } from '../../services/api';
import useNotificationStore from '../../store/notificationStore';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Indian Number to Words Converter
function numberToWords(num) {
    if (num === 0) return 'Zero';
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    let numStr = Math.floor(num).toString();
    if (numStr.length > 9) return numStr;
    let n = ('000000000' + numStr).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return numStr; 
    let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
    return 'Indian Rupee ' + str.trim() + ' Only';
}

const PaymentsMadeListView = ({ companyId }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addNotification } = useNotificationStore();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // UI Layout State
  const [layoutMode, setLayoutMode] = useState('table'); // 'table' or 'split'
  
  // Master-Detail State
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);
  const [paymentDetail, setPaymentDetail] = useState(null);
  const [companyDetail, setCompanyDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (!companyId) return;
    fetchPayments();
    fetchCompanyDetail();
  }, [companyId]);

  const fetchCompanyDetail = async () => {
    try {
      const res = await companyAPI.getById(companyId);
      setCompanyDetail(res.data);
    } catch (err) {}
  };

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await paymentMadeAPI.getPayments(companyId);
      setPayments(res.data || []);
      
      // Auto-select based on location state
      if (location.state?.selectedPaymentId) {
          setSelectedPaymentId(location.state.selectedPaymentId);
          setLayoutMode('split');
      } else {
          setSelectedPaymentId(null);
          setLayoutMode('table');
      }
    } catch (err) {
      console.error("Failed to fetch payments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPaymentId) {
      fetchPaymentDetail(selectedPaymentId);
    }
  }, [selectedPaymentId]);

  const fetchPaymentDetail = async (id) => {
    try {
      setDetailLoading(true);
      const res = await voucherAPI.getById(id);
      setPaymentDetail(res.data);
    } catch (err) {
      console.error("Failed to fetch detail:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!selectedPaymentId) return;
    try {
      await paymentMadeAPI.markAsPaid(selectedPaymentId);
      // Refresh both the list and the detail
      await fetchPayments();
      await fetchPaymentDetail(selectedPaymentId);
    } catch (err) {
      console.error('Mark as Paid failed:', err);
      addNotification('Failed to mark payment as paid: ' + (err.response?.data?.error || err.message), 'error');
    }
  };

  // Derive fields from detail
  const vendorTx = paymentDetail?.Transactions?.find(t => parseFloat(t.debit) > 0);
  const cashBankTx = paymentDetail?.Transactions?.find(t => parseFloat(t.credit) > 0);
  const vendorName = vendorTx?.Ledger?.name || '---';
  const paidThrough = cashBankTx?.Ledger?.name || '---';
  const amountPaid = parseFloat(cashBankTx?.credit || 0);
  
  // Parse Mode from narration
  let paymentMode = 'Cash';
  if (paymentDetail?.narration?.includes('via ')) {
      const modeMatch = paymentDetail.narration.match(/via (.*?)\./);
      if (modeMatch && modeMatch[1]) paymentMode = modeMatch[1];
  }

  // Parse Bill Allocations from Transactions
  const billAllocations = paymentDetail?.Transactions?.filter(t => parseFloat(t.debit) > 0 && t.description?.includes('BILL_REF'))?.map(t => {
      const billNumMatch = t.description.match(/Bill (.*?)\./);
      return {
          billNumber: billNumMatch ? billNumMatch[1] : '---',
          amount: parseFloat(t.debit)
      };
  }) || [];

  const handleDownloadPDF = () => {
    if (!paymentDetail) return;
    const doc = new jsPDF();
    
    // Header styling
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('PAYMENT RECEIPT', 190, 25, { align: 'right' });
    
    // Company details
    doc.setFontSize(12);
    doc.text(companyDetail?.name || 'Company Name', 20, 25);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`${companyDetail?.city || ''}, ${companyDetail?.state || ''}`, 20, 30);
    doc.text(`${companyDetail?.location || 'India'}`, 20, 35);
    
    // Info grid
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    let y = 60;
    
    const fields = [
        ['Payment Date', new Date(paymentDetail.date).toLocaleDateString('en-GB')],
        ['Reference Number', paymentDetail.reference || '---'],
        ['Paid To', vendorName],
        ['Payment Mode', paymentMode],
        ['Paid Through', paidThrough],
        ['Amount Paid in Words', numberToWords(amountPaid)]
    ];
    
    fields.forEach(([label, val]) => {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(label, 20, y);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(val, 80, y);
        doc.setDrawColor(241, 245, 249);
        doc.line(20, y + 2, 190, y + 2);
        y += 10;
    });
    
    // Amount Paid Green Box
    doc.setFillColor(101, 163, 13); // emerald-600
    doc.rect(140, 50, 50, 25, 'F');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text('Amount Paid', 165, 58, { align: 'center' });
    doc.setFontSize(14);
    doc.text(`Rs ${amountPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 165, 68, { align: 'center' });
    
    // Bill allocations
    if (billAllocations.length > 0) {
        y += 10;
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text('Payment for', 20, y);
        y += 5;
        autoTable(doc, {
          startY: y,
          head: [['Bill Number', 'Payment Amount']],
          body: billAllocations.map(b => [b.billNumber, `Rs ${b.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`]),
          theme: 'plain',
          headStyles: { fillColor: [248, 250, 252], textColor: [100, 116, 139], fontStyle: 'bold' }
        });
    }
    
    doc.save(`${paymentDetail.voucherNumber || 'Payment'}.pdf`);
  };

  const filteredPayments = payments.filter(p => 
    p.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.paymentNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.reference?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden animate-fade-in">
        {/* --- GLOBAL HEADER --- */}
        <div className="flex items-center justify-between px-8 py-4 border-b border-slate-100 bg-white">
            <div className="flex items-center gap-2">
                <h1 className="text-[20px] font-bold text-slate-900 flex items-center gap-1 cursor-pointer">
                    All Payments <ChevronDown className="text-blue-600 w-4 h-4 stroke-[3px] mt-0.5" />
                </h1>
            </div>

            <div className="flex items-center gap-2">
                <button 
                  onClick={() => navigate('/payments-made/new')}
                  className="bg-[#1e61f0] hover:bg-[#1a54d1] text-white px-4 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition-all shadow-sm text-[13px]"
                >
                  <Plus size={16} strokeWidth={2.5} /> New
                </button>
                <button className="p-2 text-slate-500 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors shadow-sm ml-1">
                    <MoreHorizontal size={16} />
                </button>
            </div>
        </div>

        {/* --- MAIN CONTENT AREA --- */}
        <div className="flex-1 overflow-hidden">
            {layoutMode === 'table' ? (
                /* --- TABLE VIEW --- */
                <div className="flex flex-col h-full bg-white overflow-hidden">
                    <div className="flex-1 overflow-y-auto no-scrollbar p-8">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-3.5 w-10 text-center"><Sliders size={14} className="text-[#1e61f0] mx-auto" /></th>
                                    <th className="px-2 py-3.5 w-8 text-center"><input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5" /></th>
                                    <th className="px-4 py-3.5 cursor-pointer select-none">
                                        <div className="flex items-center gap-1 font-semibold">
                                            DATE <ArrowDownUp size={12} className="text-slate-400" />
                                        </div>
                                    </th>
                                    <th className="px-4 py-3.5 font-semibold">PAYMENT #</th>
                                    <th className="px-4 py-3.5 font-semibold">REFERENCE#</th>
                                    <th className="px-4 py-3.5 font-semibold">VENDOR NAME</th>
                                    <th className="px-4 py-3.5 font-semibold">BILL#</th>
                                    <th className="px-4 py-3.5 font-semibold">MODE</th>
                                    <th className="px-4 py-3.5 font-semibold">STATUS</th>
                                    <th className="px-4 py-3.5 font-semibold text-right">AMOUNT</th>
                                    <th className="px-4 py-3.5 font-semibold text-right">UNUSED AMOUNT</th>
                                    <th className="px-4 py-3.5 w-10 text-center"><Search size={14} className="text-slate-400 mx-auto" /></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredPayments.length === 0 ? (
                                    <tr>
                                        <td colSpan="12" className="py-20 text-center">
                                           <div className="flex flex-col items-center justify-center gap-3">
                                              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                                                 <Wallet size={24} />
                                              </div>
                                              <p className="text-slate-500 text-[14px]">No payments found.</p>
                                              <button onClick={() => navigate('/payments-made/new')} className="text-blue-600 text-[13px] font-medium hover:underline">Record a payment</button>
                                           </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredPayments.map(payment => {
                                        const mode = payment.narration?.includes('via ') ? payment.narration.match(/via (.*?)\./)?.[1] || 'Cash' : 'Cash';
                                        return (
                                            <tr 
                                                key={payment.id} 
                                                onClick={() => {
                                                    setSelectedPaymentId(payment.id);
                                                    setLayoutMode('split');
                                                }}
                                                className="hover:bg-slate-50 cursor-pointer group transition-colors border-b border-slate-100"
                                            >
                                                <td className="px-4 py-3 w-10 text-center"></td>
                                                <td className="px-2 py-3 w-8 text-center" onClick={(e) => e.stopPropagation()}>
                                                    <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5" />
                                                </td>
                                                <td className="px-4 py-3 text-[13px] text-slate-500 font-medium whitespace-nowrap">
                                                    {new Date(payment.date).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="text-[14px] font-medium text-blue-600 group-hover:underline">
                                                        {payment.paymentNumber}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-[13px] text-slate-500 font-medium">
                                                    {payment.reference || '---'}
                                                </td>
                                                <td className="px-4 py-3 text-[14px] font-medium text-slate-800 uppercase tracking-tight">
                                                    {payment.vendorName || '-'}
                                                </td>
                                                <td className="px-4 py-3 text-[13px] text-blue-600 font-bold whitespace-nowrap">
                                                    {payment.billNo || '---'}
                                                </td>
                                                <td className="px-4 py-3 text-[13px] text-slate-500 font-medium">
                                                    {mode}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-0.5 rounded uppercase text-[10px] font-bold tracking-widest border
                                                        ${payment.status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                                        {payment.status || 'Draft'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right text-[14px] font-bold text-slate-900 tabular-nums">
                                                    ₹{parseFloat(payment.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-4 py-3 text-right text-[14px] font-bold text-slate-500 tabular-nums">
                                                    ₹{parseFloat(payment.unusedAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-4 py-3 w-10 text-center"></td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                /* --- SPLIT PANE VIEW --- */
                <div className="flex h-full overflow-hidden animate-in zoom-in-95 duration-500">
                    {/* LEFT MASTER LIST */}
                    <div className="w-[320px] xl:w-[380px] bg-slate-50/30 border-r border-slate-200 flex flex-col z-20 shadow-[4px_0_15px_rgba(0,0,0,0.02)] no-print">
                        <div className="p-4 border-b border-slate-100 bg-white space-y-3">
                            <div className="relative group">
                                <Search size={14} className="absolute left-3 top-2.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <input 
                                    type="text" 
                                    placeholder="Find in Payments..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px] focus:border-blue-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
                            {loading ? (
                                <div className="p-8 text-center text-slate-400 text-[12px]">Loading payments...</div>
                            ) : filteredPayments.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 text-[12px]">No payments found.</div>
                            ) : (
                                filteredPayments.map(payment => (
                                    <div 
                                        key={payment.id}
                                        onClick={() => setSelectedPaymentId(payment.id)}
                                        className={`p-4 border-b border-slate-50 cursor-pointer transition-all relative group overflow-hidden ${selectedPaymentId === payment.id ? 'bg-blue-50/50 border-l-[3px] border-l-blue-600' : 'hover:bg-slate-50/80 border-l-[3px] border-l-transparent'}`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`text-[13px] font-bold ${selectedPaymentId === payment.id ? 'text-blue-700' : 'text-slate-800'}`}>
                                                {payment.vendorName}
                                            </span>
                                            <span className="text-[13px] font-bold text-slate-900 group-hover:scale-110 transition-transform tabular-nums">
                                                ₹{parseFloat(payment.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-[11px] text-slate-400 font-medium">
                                            <span>{new Date(payment.date).toLocaleDateString('en-GB')} • {payment.narration?.includes('via ') ? payment.narration.match(/via (.*?)\./)?.[1] || 'Cash' : 'Cash'}</span>
                                            <span className="font-bold">#{payment.paymentNumber}</span>
                                        </div>
                                        <div className="mt-2">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-[0.1em] ${
                                                payment.status === 'Paid'
                                                  ? 'text-emerald-600 bg-emerald-50'
                                                  : 'text-slate-500 bg-slate-100'
                                            }`}>
                                                {payment.status || 'Draft'}
                                            </span>
                                        </div>
                                        
                                        {selectedPaymentId === payment.id && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full mr-2 shadow-[0_0_8px_rgba(37,99,235,0.4)] animate-pulse" />}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                {/* RIGHT DETAIL PANE */}
                <div className="flex-1 bg-[#fcfdfe] overflow-y-auto custom-scrollbar flex flex-col relative">
                    {selectedPaymentId ? (
                        detailLoading ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-[40]">
                                <RefreshCw size={24} className="animate-spin text-blue-600 mb-4" />
                            </div>
                        ) : (
                            <div className="animate-in fade-in duration-500 flex flex-col min-h-full">
                                {/* Detail Action Bar */}
                                <div className="sticky top-0 bg-white border-b border-slate-100 p-3 flex items-center gap-2 px-8 z-30 shadow-[0_1px_5px_rgba(0,0,0,0.02)] no-print">
                                    <button 
                                      onClick={() => navigate(`/payments-made/edit/${selectedPaymentId}`)}
                                      className="flex items-center gap-2 px-3 py-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-all text-[12px] font-bold"
                                    >
                                        <Edit size={14} /> Edit
                                    </button>
                                    <div className="w-px h-4 bg-slate-200 mx-1"></div>
                                    <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-3 py-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-all text-[12px] font-bold">
                                        <Printer size={14} /> PDF/Print <ChevronDown size={14} />
                                    </button>
                                    <div className="w-px h-4 bg-slate-200 mx-1"></div>
                                    {(!paymentDetail?.status || paymentDetail.status !== 'Paid') && (
                                      <button onClick={handleMarkAsPaid} className="flex items-center gap-2 px-3 py-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-all text-[12px] font-bold">
                                          <CheckCircle2 size={14} /> Mark as Paid
                                      </button>
                                    )}
                                    <div className="flex-1"></div>
                                    <button 
                                      onClick={() => {
                                          setSelectedPaymentId(null);
                                          setLayoutMode('table');
                                      }}
                                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Banner — only shown when status is Draft */}
                                {(!paymentDetail?.status || paymentDetail.status !== 'Paid') && (
                                <div className="mx-8 mt-6 p-4 bg-white border border-blue-100 rounded-xl flex items-center justify-between shadow-sm no-print">
                                    <div className="flex items-center gap-3">
                                        <AlertCircle size={16} className="text-blue-600" />
                                        <p className="text-[13px] text-slate-700"><b>WHAT'S NEXT?</b> Mark the payment as Paid to confirm that it has been sent.</p>
                                    </div>
                                    <button onClick={handleMarkAsPaid} className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-[12px] font-bold shadow-sm hover:bg-blue-700 transition-colors">
                                        Mark as Paid
                                    </button>
                                </div>
                                )}

                                {/* REAL DOCUMENT PREVIEW */}
                                <div className="p-8 flex-1">
                                    <div className="max-w-[700px] mx-auto bg-white border border-slate-200 shadow-[0_10px_40px_rgba(0,0,0,0.04)] relative">
                                        {/* Status Ribbon */}
                                        <div className="absolute top-0 left-0 w-24 h-24 overflow-hidden z-10">
                                            <div className={`absolute top-[24px] -left-[30px] w-[140px] text-white text-center py-1 text-[10px] font-bold uppercase tracking-widest -rotate-45 shadow-sm ${
                                                paymentDetail?.status === 'Paid' ? 'bg-emerald-500' : 'bg-slate-400'
                                            }`}>
                                                {paymentDetail?.status || 'Draft'}
                                            </div>
                                        </div>

                                        <div className="p-12 pl-14 pr-14">
                                            {/* Header */}
                                            <div className="flex justify-between items-start mb-16">
                                                <div className="space-y-3 max-w-[250px]">
                                                    {companyDetail?.logoUrl ? (
                                                        <img src={companyDetail.logoUrl} alt="Logo" className="h-12 object-contain" />
                                                    ) : (
                                                        <div className="text-[22px] font-bold text-slate-800">{companyDetail?.name || 'Company Name'}</div>
                                                    )}
                                                    <div className="text-[12px] text-slate-500 leading-relaxed font-medium">
                                                        <p>{companyDetail?.city || 'City'}, {companyDetail?.state || 'State'}</p>
                                                        <p>{companyDetail?.location || 'India'}</p>
                                                        {companyDetail?.email && <p>{companyDetail.email}</p>}
                                                    </div>
                                                </div>
                                                <div className="text-right mt-8">
                                                    <h1 className="text-[22px] font-bold text-slate-800 tracking-wider">PAYMENTS MADE</h1>
                                                </div>
                                            </div>

                                            {/* Details Grid & Green Box */}
                                            <div className="flex justify-between items-start mb-12">
                                                <div className="w-[60%]">
                                                    <table className="w-full text-[12px]">
                                                        <tbody>
                                                            <tr className="border-b border-slate-100">
                                                                <td className="py-3 text-slate-500 w-[140px]">Payment#</td>
                                                                <td className="py-3 font-bold text-slate-800">{paymentDetail?.voucherNumber}</td>
                                                            </tr>
                                                            <tr className="border-b border-slate-100">
                                                                <td className="py-3 text-slate-500">Payment Date</td>
                                                                <td className="py-3 font-bold text-slate-800">{paymentDetail?.date ? new Date(paymentDetail.date).toLocaleDateString('en-GB') : '---'}</td>
                                                            </tr>
                                                            <tr className="border-b border-slate-100">
                                                                <td className="py-3 text-slate-500">Reference Number</td>
                                                                <td className="py-3 font-bold text-slate-800">{paymentDetail?.reference || '---'}</td>
                                                            </tr>
                                                            <tr className="border-b border-slate-100">
                                                                <td className="py-3 text-slate-500">Paid To</td>
                                                                <td className="py-3 font-bold text-blue-600">{vendorName}</td>
                                                            </tr>
                                                            <tr className="border-b border-slate-100">
                                                                <td className="py-3 text-slate-500">Payment Mode</td>
                                                                <td className="py-3 font-bold text-slate-800">{paymentMode}</td>
                                                            </tr>
                                                            <tr className="border-b border-slate-100">
                                                                <td className="py-3 text-slate-500">Paid Through</td>
                                                                <td className="py-3 font-bold text-slate-800">{paidThrough}</td>
                                                            </tr>
                                                            <tr className="border-b border-slate-100">
                                                                <td className="py-3 text-slate-500">Amount Paid In Words</td>
                                                                <td className="py-3 font-bold text-slate-800 italic">{numberToWords(amountPaid)}</td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                                <div className="w-[30%]">
                                                    <div className="bg-[#65a30d] text-white p-5 rounded flex flex-col items-center justify-center shadow-sm">
                                                        <span className="text-[12px] font-medium mb-1">Amount Paid</span>
                                                        <span className="text-[20px] font-bold">₹{amountPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Paid To Section */}
                                            <div className="mb-10">
                                                <h4 className="text-[12px] text-slate-500 mb-2">Paid To</h4>
                                                <h3 className="text-[14px] font-bold text-slate-800">{vendorName}</h3>
                                                <div className="text-[12px] text-slate-500 mt-1 leading-relaxed">
                                                    <p>{vendorTx?.Ledger?.city || 'City'}</p>
                                                    <p>{vendorTx?.Ledger?.state || 'State'}</p>
                                                    <p>{vendorTx?.Ledger?.country || 'India'}</p>
                                                </div>
                                            </div>

                                            {/* Payment For Table */}
                                            {billAllocations.length > 0 && (
                                                <div>
                                                    <h4 className="text-[14px] font-bold text-slate-800 mb-4">Payment for</h4>
                                                    <table className="w-full text-left border-collapse text-[12px]">
                                                        <thead className="bg-slate-50 border-y border-slate-200">
                                                            <tr>
                                                                <th className="py-3 px-4 font-bold text-slate-600">Bill Number</th>
                                                                <th className="py-3 px-4 font-bold text-slate-600 text-right">Payment Amount</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {billAllocations.map((b, idx) => (
                                                                <tr key={idx} className="border-b border-slate-100">
                                                                    <td className="py-3 px-4 text-blue-600 font-bold">{b.billNumber}</td>
                                                                    <td className="py-3 px-4 text-right font-bold text-slate-800">₹{b.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <p className="text-slate-400">Select a payment to view details</p>
                        </div>
                    )}
                </div>
            </div>
            )}
        </div>
    </div>
  );
};

export default PaymentsMadeListView;
