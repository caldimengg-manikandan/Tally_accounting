import React, { useState, useEffect } from 'react';
import { 
  Plus, Receipt, RefreshCw, Search, 
  ChevronDown, ArrowDownUp, Filter,
  MoreHorizontal, LayoutGrid, List,
  Settings, CheckSquare, Square, X,
  ArrowRight, Printer, Mail, FileText,
  MoreVertical, AlertCircle, Edit, Trash2,
  ChevronRight, Hash, Calendar, ArrowLeft
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { purchaseAPI, voucherAPI, companyAPI } from '../../services/api';
import useNotificationStore from '../../store/notificationStore';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const getDerivedTotal = (bill) => {
  if (!bill) return 0;
  if (bill.totalAmount) return parseFloat(bill.totalAmount);
  
  // 1. Try parsing from narration JSON
  try {
    if (bill.narration && bill.narration.startsWith('{')) {
      const parsed = JSON.parse(bill.narration);
      if (parsed && parsed.totalAmount) return parseFloat(parsed.totalAmount);
      // Fallback: sum item amounts if totalAmount is missing
      if (parsed && Array.isArray(parsed.items)) {
        const sum = parsed.items.reduce((acc, item) => acc + parseFloat(item.amount || item.total || 0), 0);
        if (sum > 0) return sum;
      }
    }
  } catch (e) {
    console.error("Error parsing narration for total:", e);
  }

  // 2. Try looking for Credit transaction (credit > 0)
  const crTx = bill.Transactions?.find(t => parseFloat(t.credit || 0) > 0);
  if (crTx) return parseFloat(crTx.credit);

  // 3. Fallback: sum of all Debit transactions (debits to expense/purchase ledgers)
  const debitSum = bill.Transactions?.reduce((sum, t) => sum + parseFloat(t.debit || 0), 0);
  if (debitSum > 0) return debitSum;

  return 0;
};

const getDueDate = (bill) => {
  if (!bill) return null;
  if (bill.dueDate) return bill.dueDate;
  try {
    if (bill.narration && bill.narration.startsWith('{')) {
      const parsed = JSON.parse(bill.narration);
      return parsed.dueDate || parsed.deliveryDate || null;
    }
  } catch (e) {
    console.error("Error parsing narration for due date:", e);
  }
  return null;
};

const formatBillingAddress = (addressField) => {
  if (!addressField) return '';
  const trimmed = addressField.trim();
  if (trimmed.startsWith('{')) {
    try {
      const addr = JSON.parse(trimmed);
      const parts = [];
      if (addr.attention) parts.push(addr.attention);
      
      const streetLine = addr.street1 || addr.address1;
      if (streetLine) parts.push(streetLine);
      
      const streetLine2 = addr.street2 || addr.address2;
      if (streetLine2) parts.push(streetLine2);
      
      const cityStateZip = [
        addr.city,
        addr.state,
        addr.pinCode || addr.zipCode || addr.zip || addr.pincode
      ].filter(Boolean).join(', ');
      
      if (cityStateZip) parts.push(cityStateZip);
      if (addr.country) parts.push(addr.country);
      
      return parts.join('\n');
    } catch (e) {
      console.error("Failed to parse address JSON:", e);
      return addressField;
    }
  }
  return addressField;
};

const BillsView = ({ companyId }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('All Bills');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedBills, setSelectedBills] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // UI Layout State
  const [layoutMode, setLayoutMode] = useState('table'); // 'table' or 'split'
  
  // Master-Detail State
  const [selectedBillId, setSelectedBillId] = useState(null);
  const [billDetail, setBillDetail] = useState(null);
  const [companyDetail, setCompanyDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [viewMode, setViewMode] = useState('bill'); // 'bill' or 'journal'
  const [showVoucher, setShowVoucher] = useState(true); // Control Journal visibility

  useEffect(() => {
    if (!companyId) return;
    fetchBills();
    fetchCompanyDetail();
  }, [companyId]);

  const fetchCompanyDetail = async () => {
    try {
      const res = await companyAPI.getById(companyId);
      setCompanyDetail(res.data);
    } catch (err) {
      console.error("Failed to fetch company detail:", err);
    }
  };

  const handleDownloadPDF = () => {
    if (!billDetail) return;
    const doc = new jsPDF();
    
    // Header styling
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59); // Slate 800
    doc.text('BILL', 190, 25, { align: 'right' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.text(`#${billDetail.voucherNumber || '—'}`, 190, 32, { align: 'right' });
    
    // Company details
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42); // Slate 900
    doc.text(companyDetail?.name || 'Company Name', 20, 25);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`${companyDetail?.city || ''}, ${companyDetail?.state || ''}`, 20, 30);
    doc.text(`${companyDetail?.location || 'India'}`, 20, 35);
    if (companyDetail?.email) {
      doc.setTextColor(37, 99, 235); // Blue 600
      doc.text(companyDetail.email, 20, 40);
    }
    
    // Info section (two columns)
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    const rightX = 190;
    const labelX = 125;
    
    // Date & Totals Info
    const billDate = billDetail.date ? new Date(billDetail.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
    const dueDateVal = getDueDate(billDetail);
    const dueDate = dueDateVal ? new Date(dueDateVal).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
    const derivedTotal = getDerivedTotal(billDetail);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Bill Date:', labelX, 55);
    doc.setFont('helvetica', 'normal');
    doc.text(billDate, rightX, 55, { align: 'right' });
    
    doc.setFont('helvetica', 'bold');
    doc.text('Due Date:', labelX, 62);
    doc.setFont('helvetica', 'normal');
    doc.text(dueDate, rightX, 62, { align: 'right' });
    
    doc.setFont('helvetica', 'bold');
    doc.text('Balance Due:', labelX, 69);
    doc.setTextColor(37, 99, 235);
    doc.text(`INR ${derivedTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, rightX, 69, { align: 'right' });
    doc.setTextColor(100, 116, 139);
    
    // Vendor Section (Bill From)
    doc.setFont('helvetica', 'bold');
    doc.text('BILL FROM', 20, 55);
    
    doc.setFontSize(12);
    doc.setTextColor(37, 99, 235);
    doc.text(billDetail?.Ledger?.name || 'Vendor Name', 20, 61);
    
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    
    let currentY = 66;
    if (billDetail?.Ledger?.gstNumber) {
      doc.text(`GSTIN: ${billDetail.Ledger.gstNumber}`, 20, currentY);
      currentY += 5;
    }
    
    const rawAddress = billDetail?.Ledger?.billingAddress || billDetail?.Ledger?.address || '';
    const vendorAddress = formatBillingAddress(rawAddress);
    if (vendorAddress) {
      const splitAddress = doc.splitTextToSize(vendorAddress, 85);
      splitAddress.forEach((line) => {
        doc.text(line, 20, currentY);
        currentY += 4.5;
      });
    }
    
    if (billDetail?.Ledger?.email || billDetail?.Ledger?.phone || billDetail?.Ledger?.mobile) {
      const contactInfo = [
        billDetail?.Ledger?.email ? `Email: ${billDetail.Ledger.email}` : '',
        (billDetail?.Ledger?.phone || billDetail?.Ledger?.mobile) ? `Phone: ${billDetail.Ledger.phone || billDetail.Ledger.mobile}` : ''
      ].filter(Boolean).join(' | ');
      if (contactInfo) {
        doc.text(contactInfo, 20, currentY);
        currentY += 5;
      }
    }
    
    doc.text(`Reference#: ${billDetail?.referenceNumber || '—'}`, 20, currentY);
    
    // Parse Items from narration JSON
    let items = [];
    try {
      if (billDetail?.narration) {
        if (billDetail.narration.startsWith('{')) {
          const parsed = JSON.parse(billDetail.narration);
          items = parsed.items || [];
        } else if (billDetail.narration.includes('||')) {
          const parts = billDetail.narration.split('||');
          const itemData = parts.find(p => p.startsWith('items:'));
          if (itemData) {
            items = JSON.parse(itemData.replace('items:', ''));
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
    
    const tableData = (items && items.length > 0) ? items.map((item, idx) => [
      idx + 1,
      `${item.itemName || item.name || 'Service/Item'}${item.notes ? '\n' + item.notes : ''}`,
      item.quantity || item.qty || '1.00',
      `Rs ${parseFloat(item.rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      `Rs ${parseFloat(item.amount || item.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
    ]) : [
      [
        1,
        `${billDetail?.Ledger?.name || 'Vendor'} Service/Supply`,
        '1.00',
        `Rs ${parseFloat(derivedTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        `Rs ${parseFloat(derivedTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
      ]
    ];
    
    autoTable(doc, {
      startY: Math.max(90, currentY + 8),
      head: [['#', 'Item & Description', 'Qty', 'Rate', 'Amount']],
      body: tableData,
      theme: 'plain',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 4, lineColor: [241, 245, 249], lineWidth: 0.1 },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 100 },
        2: { halign: 'right', cellWidth: 20 },
        3: { halign: 'right', cellWidth: 30 },
        4: { halign: 'right', cellWidth: 30 }
      },
      didDrawCell: (data) => {
        if (data.section === 'body') {
           doc.setDrawColor(241, 245, 249);
           doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
        }
      }
    });
    
    // Totals
    const finalY = doc.lastAutoTable.finalY + 15;
    const totalsX = 130;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('Sub Total', totalsX, finalY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(`Rs ${parseFloat(derivedTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 190, finalY, { align: 'right' });
    
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(totalsX - 5, finalY + 5, 65, 12, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('Total Amount', totalsX, finalY + 13);
    doc.text(`Rs ${parseFloat(derivedTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 190, finalY + 13, { align: 'right' });
    
    // Save/Download PDF
    doc.save(`${billDetail.voucherNumber || 'BILL'}.pdf`);
  };

  // Handle post-save navigation selection
  useEffect(() => {
    if (location.state?.selectedBillId) {
      setSelectedBillId(location.state.selectedBillId);
      setLayoutMode('split');
    }
  }, [location.state]);

  useEffect(() => {
    if (selectedBillId) {
      fetchBillDetail(selectedBillId);
    }
  }, [selectedBillId]);

  const fetchBillDetail = async (id) => {
    try {
      setDetailLoading(true);
      const res = await voucherAPI.getById(id);
      setBillDetail(res.data);
      setBills(prev => prev.map(b => b.id === id ? { ...b, ...res.data } : b));
    } catch (err) {
      console.error("Failed to fetch bill detail:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  const fetchBills = async () => {
    try {
      setLoading(true);
      if (!companyId) {
        console.warn("No companyId available, skipping bill fetch");
        setBills([]);
        return;
      }
      const res = await purchaseAPI.getBills(companyId);
      console.log("Bills API response:", res.data?.length, "bills found");
      setBills(res.data || []);
    } catch (err) {
      console.error("Failed to fetch bills:", err?.response?.status, err?.response?.data?.error || err.message);
      setBills([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredBills = bills.filter(bill => {
      const matchesSearch = 
        bill.voucherNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.Ledger?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (filterType === 'Unpaid Bills') {
          return matchesSearch && parseFloat(bill.balanceDue || bill.totalAmount || 0) > 0;
      }
      return matchesSearch;
  });

  const toggleSelectAll = () => {
    if (selectedBills.length === filteredBills.length) {
      setSelectedBills([]);
    } else {
      setSelectedBills(filteredBills.map(b => b.id));
    }
  };

  const toggleSelectBill = (id) => {
    setSelectedBills(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  if (loading) return (
    <div className="flex-1 flex flex-col items-center justify-center p-20 text-center bg-white h-screen">
      <RefreshCw size={24} className="animate-spin text-[#1e61f0] mb-4" />
      <p className="text-slate-400 text-[13px] font-bold uppercase tracking-[0.2em] animate-pulse">Synchronizing Ledger...</p>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden animate-fade-in">
        
        {/* --- GLOBAL HEADER --- */}
        <div className="flex items-center justify-between px-8 py-4 border-b border-slate-100 bg-white">
            <div className="flex items-center gap-2 group cursor-pointer relative">
                <h1 className="text-[20px] font-bold text-slate-900" onClick={() => setIsFilterOpen(!isFilterOpen)}>
                    {filterType}
                </h1>
                <ChevronDown size={18} className="text-blue-600 mt-1" />
                
                {isFilterOpen && (
                    <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-slate-100 rounded-xl shadow-2xl z-[100] py-2 animate-in fade-in zoom-in-95 duration-200">
                        {['Unpaid Bills', 'All Bills', 'Draft', 'Overdue'].map(type => (
                            <div 
                                key={type}
                                onClick={() => { setFilterType(type); setIsFilterOpen(false); }}
                                className={`px-5 py-2 text-[13px] cursor-pointer transition-colors ${filterType === type ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                                {type}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-50 p-1 rounded-md border border-slate-200 mr-2">
                    <button 
                      onClick={() => setLayoutMode('table')}
                      className={`p-1.5 rounded transition-all ${layoutMode === 'table' ? 'text-blue-600 bg-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <List size={16} />
                    </button>
                    <button 
                      onClick={() => {
                        setLayoutMode('split');
                        if (!selectedBillId && bills.length > 0) setSelectedBillId(bills[0].id);
                      }}
                      className={`p-1.5 rounded transition-all ${layoutMode === 'split' ? 'text-blue-600 bg-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <LayoutGrid size={16} />
                    </button>
                </div>

                <button 
                  onClick={() => navigate('/bills/new')}
                  className="bg-[#1e61f0] hover:bg-[#1a54d1] text-white px-4 py-2 rounded-md font-medium flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <Plus size={18} strokeWidth={2.5} /> New Bill
                </button>
                
                <div className="relative">
                    <button className="p-2 text-slate-500 hover:text-slate-800 border border-slate-200 bg-white rounded-md hover:bg-slate-50 transition-colors shadow-sm">
                        <MoreHorizontal size={18} />
                    </button>
                </div>
            </div>
        </div>

        {/* --- MAIN CONTENT AREA --- */}
        <div className="flex-1 overflow-hidden">
            {layoutMode === 'table' ? (
                /* --- FULL WIDTH TABLE VIEW (Default) --- */
                <div className="flex flex-col h-full bg-white animate-fade-in overflow-hidden">
                    {/* SEARCH/FILTER BAR */}
                    <div className="px-8 py-4 bg-slate-50/50 flex items-center justify-between border-b border-slate-100">
                        <div className="flex items-center gap-4">
                            <div className="relative group w-64">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1e61f0] transition-colors" />
                                <input 
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    placeholder="Search records..."
                                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded text-[13px] font-bold text-slate-700 outline-none focus:border-[#1e61f0] shadow-sm transition-all"
                                />
                            </div>
                            <button 
                                onClick={fetchBills}
                                className="p-2 text-slate-400 hover:text-[#1e61f0] transition-colors"
                                title="Refresh"
                            >
                                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                            </button>
                        </div>

                        <div className="flex items-center gap-3">
                            <button className="flex items-center gap-1.5 text-slate-500 text-[13px] font-medium hover:text-slate-900 transition-colors">
                                <Filter size={14} /> Filter
                            </button>
                            <div className="w-px h-4 bg-slate-200 mx-2" />
                            <button className="h-9 px-4 flex items-center gap-2 bg-white border border-slate-200 text-slate-600 rounded-[4px] text-[11px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
                                <Settings size={14} /> Settings
                            </button>
                        </div>
                    </div>

                    {/* The Table */}
                    <div className="flex-1 overflow-y-auto no-scrollbar p-8">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-4 w-12"><div className="flex items-center justify-center"><input type="checkbox" onChange={toggleSelectAll} checked={filteredBills.length > 0 && selectedBills.length === filteredBills.length} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" /></div></th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Bill#</th>
                                    <th className="px-6 py-4">Reference Number</th>
                                    <th className="px-6 py-4">Vendor Name</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Due Date</th>
                                    <th className="px-6 py-4 text-right">Amount</th>
                                    <th className="px-6 py-4 text-right">Balance Due</th>
                                    <th className="px-6 py-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredBills.length === 0 ? (
                                    <tr>
                                        <td colSpan="10" className="py-20 text-center">
                                           <div className="flex flex-col items-center justify-center gap-3">
                                              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                                                 <Receipt size={24} />
                                              </div>
                                              <p className="text-slate-500 text-[14px]">No bills found.</p>
                                              <button onClick={() => navigate('/bills/new')} className="text-blue-600 text-[13px] font-medium hover:underline">Create a bill</button>
                                           </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredBills.map(bill => (
                                        <tr 
                                            key={bill.id} 
                                            onClick={() => {
                                                setSelectedBillId(bill.id);
                                                setLayoutMode('split');
                                            }}
                                            className="hover:bg-slate-50 cursor-pointer group transition-colors"
                                        >
                                            <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-center">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={selectedBills.includes(bill.id)}
                                                        onChange={() => toggleSelectBill(bill.id)}
                                                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-[13px] text-slate-500 font-medium whitespace-nowrap">
                                                {new Date(bill.date).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-[14px] font-medium text-blue-600 group-hover:underline">
                                                    {bill.voucherNumber}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-[13px] text-slate-500 font-medium">
                                                {(() => {
                                                    try {
                                                        const parsed = JSON.parse(bill.narration);
                                                        return parsed.reference || '-';
                                                    } catch (e) { return '-'; }
                                                })()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-[14px] font-medium text-slate-800 uppercase tracking-tight">
                                                    {bill.Ledger?.name || '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-0.5 rounded uppercase text-[10px] font-bold tracking-widest border
                                                    ${(bill.status || '').toUpperCase() === 'PAID' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                                      (bill.status || '').toUpperCase() === 'DRAFT' ? 'bg-slate-50 text-slate-600 border-slate-100' : 
                                                      (bill.status || '').toUpperCase() === 'PARTIALLY_PAID' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' : 
                                                      'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                                    {(bill.status || 'Open').replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-[13px] text-slate-500 font-medium whitespace-nowrap">
                                                {(() => {
                                                    const dd = getDueDate(bill);
                                                    return dd ? new Date(dd).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '-';
                                                })()}
                                            </td>
                                            <td className="px-6 py-4 text-right text-[14px] font-medium text-slate-900 tabular-nums">
                                                ₹{parseFloat(bill.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-6 py-4 text-right text-[14px] font-medium text-orange-600 tabular-nums">
                                                ₹{parseFloat(bill.balanceDue ?? bill.totalAmount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-center gap-2">
                                                    <button 
                                                        onClick={() => navigate('/bills/edit/' + bill.id)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 rounded shadow-sm transition-all text-[12px] font-medium"
                                                    >
                                                        <Edit size={13} /> Edit
                                                    </button>
                                                    <button 
                                                        className="flex items-center justify-center p-1.5 bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 rounded shadow-sm transition-all"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                /* --- SPLIT PANE VIEW --- */
                <div className="flex h-full overflow-hidden animate-in zoom-in-95 duration-500">
                    {/* LEFT MASTER LIST (Narrow) */}
                    <div className="w-[320px] xl:w-[380px] bg-white border-r border-slate-200 flex flex-col z-20 shadow-[4px_0_15px_rgba(0,0,0,0.02)] no-print">
                        {/* Master List Header/Search */}
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
                        <div className="relative group">
                            <Search size={14} className="absolute left-3 top-2.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            <input 
                                type="text" 
                                placeholder="Find in Bills..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-[12px] focus:border-blue-500 outline-none transition-all shadow-sm"
                            />
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">
                            <span>{filteredBills.length} Bills</span>
                            <button className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                                <ArrowDownUp size={12} />
                                Sort
                            </button>
                        </div>
                        </div>

                        {/* Bill Card List */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {filteredBills.map(bill => (
                                <div 
                                    key={bill.id}
                                    onClick={() => setSelectedBillId(bill.id)}
                                    className={`p-4 border-b border-slate-50 cursor-pointer transition-all relative group overflow-hidden ${selectedBillId === bill.id ? 'bg-blue-50/50 border-l-[3px] border-l-blue-600' : 'hover:bg-slate-50/80 border-l-[3px] border-l-transparent'}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`text-[13px] font-bold ${selectedBillId === bill.id ? 'text-blue-700' : 'text-slate-800'}`}>
                                            {bill.Ledger?.name}
                                        </span>
                                        <span className="text-[13px] font-bold text-slate-900 group-hover:scale-110 transition-transform tabular-nums">
                                            ₹{parseFloat(bill.totalAmount || 0).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[12px] text-slate-400 font-medium">#{bill.voucherNumber}</span>
                                        <span className="text-[11px] text-slate-400 font-bold">{new Date(bill.date).toLocaleDateString('en-IN', { day:'2-digit', month:'short' })}</span>
                                    </div>
                                    <div className="mt-2 flex items-center justify-between">
                                         <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-[0.1em] border
                                             ${(bill.status || '').toUpperCase() === 'PAID' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                               (bill.status || '').toUpperCase() === 'DRAFT' ? 'bg-slate-50 text-slate-600 border-slate-100' : 
                                               (bill.status || '').toUpperCase() === 'PARTIALLY_PAID' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' : 
                                               'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                             {(bill.status || 'Open').replace('_', ' ')}
                                         </span>
                                        <ChevronRight size={14} className={`transition-all duration-300 ${selectedBillId === bill.id ? 'translate-x-0 opacity-100 text-blue-500' : '-translate-x-2 opacity-0 text-slate-200'}`} />
                                    </div>
                                    
                                    {/* Selected Pulse indicator */}
                                    {selectedBillId === bill.id && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full mr-2 shadow-[0_0_8px_rgba(37,99,235,0.4)] animate-pulse" />}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT DETAIL PANE (Fluid) */}
                    <div className="flex-1 bg-white overflow-y-auto custom-scrollbar flex flex-col relative">
                        {selectedBillId ? (
                            detailLoading ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-[40]">
                                    <RefreshCw size={32} className="animate-spin text-blue-600 mb-4" />
                                    <p className="text-[13px] font-bold text-slate-400 uppercase tracking-widest">Loading Bill Details...</p>
                                </div>
                            ) : (
                                <div className="animate-in fade-in duration-500 flex flex-col min-h-full">
                                    
                                    {/* A. Detail Action Bar */}
                                    <div className="sticky top-0 bg-white border-b border-slate-100 p-4 flex items-center justify-between px-8 z-30 shadow-[0_1px_5px_rgba(0,0,0,0.02)] no-print">
                                        <div className="flex items-center gap-4">
                                            <h2 className="text-[18px] font-bold text-slate-800">{billDetail?.voucherNumber}</h2>
                                            <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${parseFloat(billDetail?.balanceDue) > 0 ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                                            {parseFloat(billDetail?.balanceDue) > 0 ? 'Open' : 'Settled'}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            {/* Unified Actions Toolbar to match screenshot */}
                                            <div className="flex items-center bg-slate-50/50 border border-slate-200 rounded-xl p-1 gap-1">
                                                <button 
                                                    onClick={() => billDetail && navigate('/bills/edit/' + billDetail.id)}
                                                    className="flex items-center gap-2 px-3 py-1.5 text-slate-600 hover:text-blue-600 hover:bg-white hover:shadow-sm rounded-lg transition-all text-[12px] font-bold"
                                                >
                                                    <Edit size={14} /> Edit
                                                </button>
                                                <div className="w-px h-4 bg-slate-200 mx-1"></div>
                                                <button 
                                                    onClick={handleDownloadPDF}
                                                    className="flex items-center gap-2 px-3 py-1.5 text-slate-600 hover:text-blue-600 hover:bg-white hover:shadow-sm rounded-lg transition-all text-[12px] font-bold"
                                                >
                                                    <Printer size={14} /> PDF
                                                </button>
                                                <div className="w-px h-4 bg-slate-200 mx-1"></div>
                                                <button 
                                                    onClick={() => billDetail && navigate('/payments-made/new', { state: { 
                                                        vendorId: billDetail.Transactions?.find(t => parseFloat(t.credit || 0) > 0)?.LedgerId || billDetail?.Ledger?.id,
                                                        billDetail: billDetail 
                                                    } })}
                                                    className="flex items-center gap-2 px-3 py-1.5 text-blue-600 hover:bg-white hover:shadow-sm rounded-lg transition-all text-[12px] font-bold"
                                                >
                                                    <Plus size={14} /> Record Payment
                                                </button>
                                                <div className="w-px h-4 bg-slate-200 mx-1"></div>
                                                <button className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors">
                                                    <MoreHorizontal size={14} />
                                                </button>
                                            </div>

                                            <div className="flex items-center gap-3 ml-4 border-l border-slate-200 pl-6">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Journal View</span>
                                                    <button 
                                                        onClick={() => setShowVoucher(!showVoucher)}
                                                        className={`w-10 h-5 rounded-full relative transition-colors ${showVoucher ? 'bg-blue-600' : 'bg-slate-200'}`}
                                                    >
                                                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${showVoucher ? 'left-6' : 'left-1'}`} />
                                                    </button>
                                                </div>
                                                <button 
                                                    onClick={() => setLayoutMode('table')}
                                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                >
                                                    <X size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* B. "What's Next" Banner */}
                                    {(parseFloat(billDetail?.balanceDue) > 0) && (
                                        <div className="mx-8 mt-6 p-5 bg-gradient-to-r from-blue-50 to-white border border-blue-100 rounded-2xl flex items-center justify-between animate-in slide-in-from-top-4 duration-700 no-print">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                                    <AlertCircle size={24} />
                                                </div>
                                                <div>
                                                    <h4 className="text-[14px] font-bold text-slate-800 uppercase tracking-tight">WHAT'S NEXT?</h4>
                                                    <p className="text-[13px] text-slate-600 mt-0.5">This bill is in the <b>open</b> status. You can now record payment for this bill.</p>
                                                </div>
                                            </div>
                                            <button 
                                            onClick={() => billDetail && navigate('/payments-made/new', { state: { 
                                                vendorId: billDetail.Transactions?.find(t => parseFloat(t.credit || 0) > 0)?.LedgerId || billDetail?.Ledger?.id,
                                                billDetail: billDetail 
                                            } })}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-[12px] font-bold transition-all shadow-lg shadow-blue-100 active:scale-95"
                                            >
                                                Record Payment
                                            </button>
                                        </div>
                                    )}

                                    {/* C. NAVIGATION REMOVED - Using Unified Scroll View */}

                                    {/* D. CONTENT AREA */}
                                    {/* D. UNIFIED CONTENT AREA */}
                                    <div className="p-8 flex-1 bg-[#fcfdfe] space-y-12">
                                        {/* --- REAL BILL PREVIEW CARD --- */}
                                        <div className="max-w-4xl mx-auto bg-white border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-2xl overflow-hidden animate-in zoom-in-95 duration-500">

                                            <div className="p-10 relative">
                                                {/* Blue "Open" status ribbon (top-left corner) */}
                                                <div className="absolute top-0 left-0 overflow-hidden w-[90px] h-[90px] pointer-events-none">
                                                    <div
                                                        className="absolute bg-blue-600 text-white text-[10px] font-bold tracking-widest uppercase text-center shadow"
                                                        style={{ width: '120px', top: '22px', left: '-30px', transform: 'rotate(-45deg)', padding: '4px 0' }}
                                                    >
                                                        {(() => {
                                                            try {
                                                                const s = billDetail?.status || (billDetail?.narration && JSON.parse(billDetail.narration)?.status) || 'open';
                                                                return String(s).toUpperCase();
                                                            } catch { return 'OPEN'; }
                                                        })()}
                                                    </div>
                                                </div>

                                                {/* Top Header: Company Left | BILL + Bill# + Balance Due Right */}
                                                <div className="flex justify-between items-start pb-8 mb-8 border-b border-slate-100">
                                                    <div>
                                                        <h3 className="text-[17px] font-bold text-slate-900">{companyDetail?.name || 'Company Name'}</h3>
                                                        {companyDetail?.state && <p className="text-[12px] text-slate-500 mt-0.5">{companyDetail.state}</p>}
                                                        <p className="text-[12px] text-slate-500">{companyDetail?.location || 'India'}</p>
                                                        {companyDetail?.phone && <p className="text-[12px] text-slate-500">{companyDetail.phone}</p>}
                                                        {companyDetail?.email && <p className="text-[12px] text-blue-500 font-medium">{companyDetail.email}</p>}
                                                    </div>
                                                    <div className="text-right">
                                                        <h1 className="text-[38px] font-bold text-slate-800 tracking-widest leading-none">BILL</h1>
                                                        <p className="text-[13px] text-slate-500 mt-1">Bill# {billDetail?.voucherNumber}</p>
                                                        <p className="text-[22px] font-bold text-blue-600 mt-2">
                                                            ₹{getDerivedTotal(billDetail).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">Balance Due</p>
                                                    </div>
                                                </div>

                                                {/* Two-column: Bill From (left) | Order/Date/Terms (right) */}
                                                <div className="flex gap-12 mb-10">
                                                    <div className="flex-1">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Bill From</p>
                                                        {(() => {
                                                            // Vendor ledger is on the CREDIT transaction (vendor payable side)
                                                            const vendorLedger =
                                                                billDetail?.Transactions?.find(t => parseFloat(t.credit || 0) > 0)?.Ledger
                                                                || billDetail?.Ledger  // fallback from list view
                                                                || null;

                                                            const rawAddress = vendorLedger?.billingAddress || vendorLedger?.address || '';
                                                            const formattedAddress = formatBillingAddress(rawAddress);

                                                            return (
                                                                <>
                                                                    <h3 className="text-[15px] font-bold text-blue-600">
                                                                        {vendorLedger?.name || '—'}
                                                                    </h3>
                                                                    {formattedAddress && (
                                                                        <p className="text-[12px] text-slate-500 mt-1.5 font-medium whitespace-pre-line leading-relaxed max-w-[280px]">
                                                                            {formattedAddress}
                                                                        </p>
                                                                    )}
                                                                    {vendorLedger?.gstNumber && (
                                                                        <p className="text-[11px] text-slate-600 font-bold mt-1">GSTIN: {vendorLedger.gstNumber}</p>
                                                                    )}
                                                                    {(vendorLedger?.email || vendorLedger?.phone || vendorLedger?.mobile) && (
                                                                        <div className="text-[12px] text-slate-400 mt-1.5 space-y-0.5">
                                                                            {vendorLedger?.email && <p>{vendorLedger.email}</p>}
                                                                            {(vendorLedger?.phone || vendorLedger?.mobile) && <p>{vendorLedger.phone || vendorLedger.mobile}</p>}
                                                                        </div>
                                                                    )}
                                                                </>
                                                            );
                                                        })()}
                                                    </div>
                                                    <div className="w-[220px] space-y-2">
                                                        {(() => {
                                                            let ref = '', paymentTerms = '';
                                                            try { const p = JSON.parse(billDetail?.narration || '{}'); ref = p.reference || ''; paymentTerms = p.paymentTerms || ''; } catch {}
                                                            return (
                                                                <>
                                                                    {ref && (
                                                                        <div className="flex justify-between text-[12px]">
                                                                            <span className="text-slate-400 font-semibold">Order Number</span>
                                                                            <span className="font-bold text-slate-700">{ref}</span>
                                                                        </div>
                                                                    )}
                                                                    <div className="flex justify-between text-[12px]">
                                                                        <span className="text-slate-400 font-semibold">Bill Date</span>
                                                                        <span className="font-bold text-slate-700">{billDetail?.date ? new Date(billDetail.date).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '---'}</span>
                                                                    </div>
                                                                    <div className="flex justify-between text-[12px]">
                                                                        <span className="text-slate-400 font-semibold">Due Date</span>
                                                                        <span className="font-bold text-slate-700">{getDueDate(billDetail) ? new Date(getDueDate(billDetail)).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '---'}</span>
                                                                    </div>
                                                                    {paymentTerms && (
                                                                        <div className="flex justify-between text-[12px]">
                                                                            <span className="text-slate-400 font-semibold">Terms</span>
                                                                            <span className="font-bold text-slate-700">{paymentTerms}</span>
                                                                        </div>
                                                                    )}
                                                                </>
                                                            );
                                                        })()}
                                                    </div>
                                                </div>


                                                {/* Items Table */}
                                                <table className="w-full mb-8 border-collapse">
                                                    <thead>
                                                        <tr className="bg-slate-800 text-white text-[10px] font-bold uppercase tracking-widest">
                                                            <th className="py-3 px-4 text-left w-10">#</th>
                                                            <th className="py-3 px-4 text-left">Item &amp; Description</th>
                                                            <th className="py-3 px-4 text-right">Qty</th>
                                                            <th className="py-3 px-4 text-right">Rate</th>
                                                            <th className="py-3 px-4 text-right">Amount</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="text-[13px] font-bold text-slate-700">
                                                        {(() => {
                                                            let items = [];
                                                            let parsedNarration = null;
                                                            try {
                                                                if (billDetail?.narration) {
                                                                    // Try parsing as JSON first (New Format)
                                                                    if (billDetail.narration.startsWith('{')) {
                                                                        parsedNarration = JSON.parse(billDetail.narration);
                                                                        items = parsedNarration.items || [];
                                                                    } 
                                                                    // Try legacy split format (|| delimiter)
                                                                    else if (billDetail.narration.includes('||')) {
                                                                        const parts = billDetail.narration.split('||');
                                                                        const itemData = parts.find(p => p.startsWith('items:'));
                                                                        if (itemData) {
                                                                            items = JSON.parse(itemData.replace('items:', ''));
                                                                        }
                                                                    }
                                                                }
                                                            } catch (e) {
                                                                console.error("Narration parse error:", e);
                                                            }

                                                            if (items && items.length > 0) {
                                                                return items.map((item, idx) => (
                                                                    <tr key={idx} className="border-b border-slate-100">
                                                                        <td className="py-4 px-4 text-slate-400">{idx + 1}</td>
                                                                        <td className="py-4 px-4">
                                                                            <span className="text-slate-900 font-bold truncate max-w-[300px] inline-block">{item.itemName || item.name || 'Service/Item'}</span>
                                                                            {item.notes && <p className="text-[11px] text-slate-400 font-medium mt-0.5">{item.notes}</p>}
                                                                        </td>
                                                                        <td className="py-4 px-4 text-right tabular-nums">{item.quantity || item.qty || '1.00'}</td>
                                                                        <td className="py-4 px-4 text-right tabular-nums">₹{parseFloat(item.rate || 0).toLocaleString()}</td>
                                                                        <td className="py-4 px-4 text-right font-bold tabular-nums">₹{parseFloat(item.amount || item.total || 0).toLocaleString()}</td>
                                                                    </tr>
                                                                ));
                                                            }
                                                            
                                                            // Fallback if no structured data
                                                            const derivedTotal = getDerivedTotal(billDetail);

                                                            return (
                                                                <tr className="border-b border-slate-100">
                                                                    <td className="py-4 px-4 text-slate-400">1</td>
                                                                    <td className="py-4 px-4">
                                                                        <span className="text-slate-900 font-bold">{billDetail?.Ledger?.name || 'Vendor'} Service/Supply</span>
                                                                        <p className="text-[11px] text-slate-400 mt-1">{(() => { try { const p = JSON.parse(billDetail?.narration || '{}'); return p.notes || 'No details'; } catch(e) { return billDetail?.narration?.split('||')[0] || 'No details'; } })()}</p>
                                                                    </td>
                                                                    <td className="py-4 px-4 text-right">1.00</td>
                                                                    <td className="py-4 px-4 text-right">₹{parseFloat(derivedTotal).toLocaleString()}</td>
                                                                    <td className="py-4 px-4 text-right font-bold">₹{parseFloat(derivedTotal).toLocaleString()}</td>
                                                                </tr>
                                                            );
                                                        })()}
                                                    </tbody>
                                                </table>

                                                {/* Totals Footer */}
                                                <div className="flex justify-end mb-10">
                                                    <div className="w-[280px] space-y-0">
                                                        {(() => {
                                                            const derivedTotal = getDerivedTotal(billDetail);
                                                            const balanceDue = parseFloat(billDetail?.balanceDue ?? derivedTotal);
                                                            return (
                                                                <>
                                                                    <div className="flex justify-between text-[13px] py-2 border-b border-slate-100">
                                                                        <span className="text-slate-500 font-medium">Sub Total</span>
                                                                        <span className="font-bold text-slate-800 tabular-nums">₹{parseFloat(derivedTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                                                    </div>
                                                                    <div className="flex justify-between text-[13px] py-2 border-b border-slate-100">
                                                                        <span className="text-slate-500 font-medium">Total</span>
                                                                        <span className="font-bold text-slate-800 tabular-nums">₹{parseFloat(derivedTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                                                    </div>
                                                                    <div className="flex justify-between text-[14px] py-3 bg-slate-100 px-4 rounded-lg mt-2 items-center">
                                                                        <span className="font-bold text-slate-700 uppercase text-[11px] tracking-wider">Balance Due</span>
                                                                        <span className="font-bold text-slate-900 tabular-nums text-[16px]">₹{balanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                                                    </div>
                                                                </>
                                                            );
                                                        })()}
                                                    </div>
                                                </div>
                                                
                                                <div className="mt-20 flex justify-between items-end grayscale opacity-50">
                                                    <div>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Authorized Signature</p>
                                                        <div className="mt-4 w-48 h-px bg-slate-200" />
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[9px] text-slate-300 font-medium">Generated on {new Date().toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                                                      {/* --- JOURNAL SECTION (Conditional) --- */}
                                        {showVoucher && (
                                            <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-8 duration-700 bg-white p-8 border border-slate-200 rounded-2xl shadow-sm mt-8">
                                                {/* Tab Header with bottom border */}
                                                <div className="border-b border-slate-200 mb-6 flex gap-6">
                                                    <button className="border-b-2 border-blue-600 pb-2 text-[14px] font-bold text-slate-800">
                                                        Journal
                                                    </button>
                                                </div>
                                                
                                                {/* Base Currency Indicator */}
                                                <div className="flex items-center gap-2 text-slate-500 text-[12px] mb-4">
                                                    <span>Amount is displayed in your base currency</span>
                                                    <span className="bg-[#3e8a3a] text-white font-bold px-1.5 py-0.5 rounded text-[10px] tracking-tight">INR</span>
                                                </div>
                                                
                                                {/* Subtitle */}
                                                <h4 className="text-[14px] font-bold text-slate-800 mb-4">Bill</h4>

                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-left text-[13px] border-collapse">
                                                        <thead>
                                                            <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
                                                                <th className="py-2 text-left text-slate-500">ACCOUNT</th>
                                                                <th className="py-2 text-right text-slate-500 w-32">DEBIT</th>
                                                                <th className="py-2 text-right text-slate-500 w-32">CREDIT</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100">
                                                            {billDetail?.Transactions?.map((tx, idx) => {
                                                                const debitVal = parseFloat(tx.debit || 0);
                                                                const creditVal = parseFloat(tx.credit || 0);
                                                                
                                                                return (
                                                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                                        <td className="py-3 font-medium text-slate-700">
                                                                            {tx.Ledger?.name || 'Unknown Ledger'}
                                                                        </td>
                                                                        <td className="py-3 text-right font-medium text-slate-700 tabular-nums">
                                                                            {debitVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                                        </td>
                                                                        <td className="py-3 text-right font-medium text-slate-700 tabular-nums">
                                                                            {creditVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                        <tfoot>
                                                            {(() => {
                                                                const totalDebits = billDetail?.Transactions?.reduce((s, t) => s + parseFloat(t.debit || 0), 0) || 0;
                                                                const totalCredits = billDetail?.Transactions?.reduce((s, t) => s + parseFloat(t.credit || 0), 0) || 0;
                                                                
                                                                return (
                                                                    <tr className="font-bold border-t border-slate-300 text-slate-800">
                                                                        <td className="py-3 text-left"></td>
                                                                        <td className="py-3 text-right tabular-nums border-b-2 border-slate-400">
                                                                            {totalDebits.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                                        </td>
                                                                        <td className="py-3 text-right tabular-nums border-b-2 border-slate-400">
                                                                            {totalCredits.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })()}
                                                        </tfoot>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    </div>
                            )
                        ) : (
                            /* --- EMPTY STATE (Nothing Selected) --- */
                            <div className="flex-1 flex flex-col items-center justify-center p-20 text-center animate-in zoom-in-95 duration-700 bg-slate-50/20">
                                <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center text-slate-200 mb-8 border border-slate-200 shadow-xl">
                                    <Receipt size={48} />
                                </div>
                                <h3 className="text-[24px] font-bold text-slate-800 tracking-tighter mb-2">Select a bill to view details</h3>
                                <p className="text-slate-400 text-[14px] max-w-sm mx-auto leading-relaxed">
                                    Click on a bill from the left-side list to see its full document visualization and accounting history.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default BillsView;
