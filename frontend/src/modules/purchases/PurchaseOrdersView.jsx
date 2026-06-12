import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Plus, Trash2, ShoppingBag, Edit, ChevronDown, Search, Filter, MoreHorizontal,
  Clock, CheckCircle2, XCircle, Send, Paperclip, Mail, Printer, Download,
  Eye, LayoutGrid, X, FileText, ChevronRight, Settings, Loader2, Sparkles, AlertCircle,
  Link, ArrowDownUp, RefreshCw, Send as SendIcon
} from 'lucide-react';
import { purchaseAPI, companyAPI } from '../../services/api';
import PurchaseOrderEmailModal from './PurchaseOrderEmailModal';
import ConfirmModal from '../../components/ConfirmModal';
import useNotificationStore from '../../store/notificationStore';

const PurchaseOrdersView = ({ companyId }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [toastMessage, setToastMessage] = useState(location.state?.successMessage || null);

  useEffect(() => {
    if (toastMessage) {
      window.history.replaceState({}, document.title);
      const timer = setTimeout(() => setToastMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const { addNotification } = useNotificationStore();

  const currentUserEmail = useMemo(() => {
    try {
      const u = JSON.parse(sessionStorage.getItem('user') || '{}');
      return u?.email || '';
    } catch (e) {
      return '';
    }
  }, []);

  // State Management
  const [orders, setOrders] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [currentCompany, setCurrentCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals & Action State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [showPDFView, setShowPDFView] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  // Fetching Data
  const fetchData = async () => {
    if (!companyId) return;
    try {
      setLoading(true);
      const results = await Promise.allSettled([
        purchaseAPI.getOrders(companyId),
        purchaseAPI.getVendors(companyId),
        companyAPI.getById(companyId)
      ]);

      if (results[0].status === 'fulfilled') {
        setOrders(results[0].value.data || []);
      } else {
        console.error("Failed to load purchase orders:", results[0].reason);
        setOrders([]);
      }

      if (results[1].status === 'fulfilled') {
        setVendors(results[1].value.data || []);
      } else {
        console.error("Failed to load vendors:", results[1].reason);
        setVendors([]);
      }

      if (results[2].status === 'fulfilled') {
        setCurrentCompany(results[2].value.data || null);
      } else {
        console.error("Failed to load company details:", results[2].reason);
        setCurrentCompany(null);
      }
    } catch (err) {
      console.error("Failed to load purchase orders data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [companyId]);

  // Selected Order derivation
  const selectedOrder = useMemo(() => {
    if (!id) return null;
    return orders.find(o => String(o.id) === String(id)) || null;
  }, [orders, id]);

  // Selected Vendor derivation
  const selectedVendor = useMemo(() => {
    if (!selectedOrder || !vendors.length) return null;
    return vendors.find(v => String(v.id) === String(selectedOrder.LedgerId)) || null;
  }, [selectedOrder, vendors]);

  // Address Parsing
  const vendorBillingAddress = useMemo(() => {
    if (!selectedVendor) return null;
    try {
      if (selectedVendor.billingAddressJson) {
        return JSON.parse(selectedVendor.billingAddressJson);
      }
      if (selectedVendor.billingAddress && selectedVendor.billingAddress.startsWith('{')) {
        return JSON.parse(selectedVendor.billingAddress);
      }
    } catch (e) {}
    return selectedVendor.billingAddress ? { street1: selectedVendor.billingAddress } : null;
  }, [selectedVendor]);

  // Deliver To Address Parsing
  const deliveryAddressData = useMemo(() => {
    if (!selectedOrder) return null;
    let parsed = null;
    try {
      if (selectedOrder.deliveryAddressDataJson) {
        parsed = JSON.parse(selectedOrder.deliveryAddressDataJson);
      }
    } catch (e) {}

    // Check if parsed address is empty
    const isEmpty = !parsed || (!parsed.street1 && !parsed.city && !parsed.attention);

    if ((selectedOrder.deliveryAddress === 'Organization' || !selectedOrder.deliveryAddress) && isEmpty && currentCompany) {
      return {
        attention: currentCompany.name || '',
        street1: currentCompany.street1 || '',
        street2: currentCompany.street2 || '',
        city: currentCompany.city || '',
        state: currentCompany.state || '',
        zip: currentCompany.pincode || '',
        country: currentCompany.location || 'India',
        phone: currentCompany.phone || ''
      };
    }
    return parsed;
  }, [selectedOrder, currentCompany]);

  // Order Items parsing
  const orderItems = useMemo(() => {
    if (!selectedOrder) return [];
    try {
      if (selectedOrder.itemsJson) {
        return JSON.parse(selectedOrder.itemsJson);
      }
    } catch (e) {}
    return [];
  }, [selectedOrder]);

  // Filter & Search Logic
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesStatus = filterStatus === 'All' || String(order.status).toLowerCase() === String(filterStatus).toLowerCase();
      const orderNo = (order.orderNumber || '').toLowerCase();
      const vendorName = (order.Ledger?.name || '').toLowerCase();
      const notes = (order.notes || '').toLowerCase();
      const query = searchQuery.toLowerCase();
      const matchesSearch = orderNo.includes(query) || vendorName.includes(query) || notes.includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [orders, filterStatus, searchQuery]);

  // Quick Action: Mark as Issued
  const handleMarkAsIssued = async () => {
    if (!selectedOrder) return;
    setActionLoading(true);
    try {
      await purchaseAPI.updateOrder(selectedOrder.id, { status: 'issued' });
      // Update local state
      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, status: 'issued' } : o));
    } catch (err) {
      addNotification("Failed to mark order as Issued", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Quick Action: Delete
  const triggerDelete = (id) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await purchaseAPI.deleteOrder(deleteId);
      setOrders(prev => prev.filter(o => o.id !== deleteId));
      if (String(deleteId) === String(id)) {
        navigate('/purchase-orders');
      }
      setIsDeleteModalOpen(false);
      setDeleteId(null);
    } catch (err) {
      addNotification("Failed to delete purchase order", "error");
    }
  };

  // Utility to determine badge style
  const getStatusStyle = (status) => {
    const s = String(status || '').toLowerCase();
    switch (s) {
      case 'draft': return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'issued': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'partially_received': return 'bg-orange-50 text-orange-600 border-orange-100';
      case 'received': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'cancelled': return 'bg-red-50 text-red-600 border-red-100';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getBilledStatusStyle = (status) => {
    const s = String(status || '').toLowerCase();
    switch (s) {
      case 'yet_to_be_billed': return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'partially_billed': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'billed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getBilledStatusLabel = (status) => {
    const s = String(status || '').toLowerCase();
    switch (s) {
      case 'yet_to_be_billed': return 'YET TO BE BILLED';
      case 'partially_billed': return 'PARTIALLY BILLED';
      case 'billed': return 'BILLED';
      default: return String(status || '').replace(/_/g, ' ').toUpperCase() || 'YET TO BE BILLED';
    }
  };

  // Format Date in standard Indian format
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB');
    } catch (e) {
      return dateStr;
    }
  };

  if (loading) return (
    <div className="flex-1 flex flex-col items-center justify-center p-20 text-center min-h-[500px]">
      <RefreshCw size={24} className="animate-spin text-[#1e61f0] mb-4" />
      <p className="text-slate-500 text-[14px]">Loading Purchase Orders...</p>
    </div>
  );

  return (
    <div className="bg-slate-50/50 min-h-[calc(100vh-80px)] flex flex-col relative overflow-hidden">
      
      {/* SUCCESS TOAST BANNER */}
      {toastMessage && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 mt-4 z-[999] bg-slate-900 text-white px-6 py-2.5 rounded-full shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 no-print">
          <div className="bg-emerald-500 rounded-full p-0.5">
            <CheckCircle2 size={16} className="text-white" />
          </div>
          <span className="text-[13px] font-medium tracking-wide">{toastMessage}</span>
        </div>
      )}
      {/* Dynamic Printing Style overrides */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .pdf-preview-paper, .pdf-preview-paper * {
            visibility: visible !important;
          }
          .pdf-preview-paper {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            border: none !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 20px !important;
          }
          .ribbon {
            display: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
        .ribbon-wrapper {
          position: absolute;
          top: 0;
          left: 0;
          width: 120px;
          height: 120px;
          overflow: hidden;
          pointer-events: none;
          z-index: 0;
        }
        .ribbon {
          position: absolute;
          top: 20px;
          left: -35px;
          width: 140px;
          background: #f1f5f9;
          color: #64748b;
          text-align: center;
          text-transform: uppercase;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.15em;
          padding: 4px 0;
          transform: rotate(-45deg);
          border: 1px dashed #cbd5e1;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }
      `}</style>

      {/* Split-Screen Wrapper */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT COLUMN: PO LISTING (Conditionally rendered when id is present) */}
        {id && (
          <div className="no-print border-r border-slate-200 bg-white flex flex-col shrink-0 w-[360px]">
            
            {/* List Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-1.5 cursor-pointer hover:opacity-85">
                <span className="text-[17px] font-bold text-slate-900 tracking-tight">All Purchase Orders</span>
                <ChevronDown size={16} className="text-blue-600 mt-0.5 stroke-[2.5]" />
              </div>
              
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => navigate('/purchase-orders/new')}
                  className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-md shadow-blue-200"
                  title="New Order"
                >
                  <Plus size={16} strokeWidth={3} />
                </button>
                <button 
                  className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-slate-100"
                >
                  <MoreHorizontal size={16} />
                </button>
              </div>
            </div>

            {/* Search bar */}
            <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/30 relative">
              <Search size={14} className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search Purchase Orders"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded text-[13px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
              />
            </div>

            {/* List Items */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100/60">
              {filteredOrders.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-[13px] font-medium">
                  No purchase orders found.
                </div>
              ) : (
                filteredOrders.map(order => (
                  <div 
                    key={order.id} 
                    onClick={() => navigate(`/purchase-orders/view/${order.id}`)}
                    className={`px-5 py-4 cursor-pointer hover:bg-slate-50/50 flex items-start gap-3 transition-colors ${String(order.id) === String(id) ? 'bg-blue-50/40' : ''}`}
                  >
                    <input 
                      type="checkbox" 
                      checked={String(order.id) === String(id)}
                      onChange={() => navigate(`/purchase-orders/view/${order.id}`)}
                      className="mt-1.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-0.5">
                        <p className="text-[13.5px] font-bold text-slate-800 truncate">{order.Ledger?.name || 'Unknown Vendor'}</p>
                        <p className="text-[13.5px] font-bold text-slate-800 shrink-0">₹ {parseFloat(order.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                      </div>
                      
                      <div className="flex justify-between items-center text-[12px] text-slate-500 font-medium">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-blue-600">{order.orderNumber}</span>
                          <span>|</span>
                          <span>{formatDate(order.date)}</span>
                        </div>
                        
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${getStatusStyle(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* RIGHT COLUMN: DETAIL SPLIT PANE */}
        {selectedOrder ? (
          <div className="flex-1 flex flex-col bg-white overflow-hidden shadow-xl">
            
            {/* Header: Title and Close buttons */}
            <header className="no-print px-8 py-4 bg-white border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-[17px] font-bold text-slate-800">{selectedOrder.orderNumber}</h2>
                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${getStatusStyle(selectedOrder.status)}`}>
                  {selectedOrder.status}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded"
                  title="Attachment"
                >
                  <Paperclip size={16} />
                </button>
                <div className="flex bg-slate-50 border border-slate-200 rounded p-0.5">
                  <button className="p-1.5 text-slate-700 bg-white rounded shadow-sm"><FileText size={14} /></button>
                  <button className="p-1.5 text-slate-400"><LayoutGrid size={14} /></button>
                </div>
                <button 
                  onClick={() => navigate('/purchase-orders')}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded"
                  title="Close Pane"
                >
                  <X size={18} />
                </button>
              </div>
            </header>

            {/* Toolbar: Actions */}
            <div className="no-print px-8 py-3 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                
                {/* Edit */}
                <button 
                  onClick={() => navigate(`/purchase-orders/edit/${selectedOrder.id}`)}
                  className="px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded text-[13px] font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Edit size={14} className="text-slate-500" />
                  <span>Edit</span>
                </button>

                {/* Send Email */}
                <button 
                  onClick={() => navigate(`/purchase-orders/${selectedOrder.id}/email`)}
                  className="px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded text-[13px] font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Mail size={14} className="text-slate-500" />
                  <span>Send Email</span>
                </button>

                {/* PDF/Print */}
                <button 
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded text-[13px] font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Printer size={14} className="text-slate-500" />
                  <span>PDF/Print</span>
                </button>

                {/* Mark as Issued */}
                 {selectedOrder.status?.toLowerCase() === 'draft' && (
                   <button 
                     onClick={handleMarkAsIssued}
                     disabled={actionLoading}
                     className="px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded text-[13px] font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                   >
                     {actionLoading ? <Loader2 size={14} className="animate-spin text-slate-500" /> : <CheckCircle2 size={14} className="text-emerald-500" />}
                     <span>Mark as Issued</span>
                   </button>
                 )}

                 {/* Convert to Bill */}
                 {selectedOrder.status?.toLowerCase() === 'issued' && selectedOrder.billed_status?.toLowerCase() !== 'billed' && (
                   <button 
                     onClick={() => navigate(`/bills/new?poId=${selectedOrder.id}`)}
                     className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[13px] font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                   >
                     <Link size={14} className="text-white" />
                     <span>Convert to Bill</span>
                   </button>
                 )}
                
                {/* Delete */}
                <button 
                  onClick={() => triggerDelete(selectedOrder.id)}
                  className="p-1.5 border border-slate-200 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded transition-all bg-white shadow-sm"
                  title="Delete Order"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Scrollable Document Area */}
            <div className="flex-1 overflow-y-auto p-8 bg-slate-100/50 flex flex-col items-center">
              
              {/* WHAT'S NEXT Banner */}
              {selectedOrder.status?.toLowerCase() === 'draft' && (
                <div className="no-print w-full max-w-[800px] mb-6 bg-[#f4f7fe] border border-blue-150 rounded-xl p-5 flex items-center justify-between animate-in fade-in duration-300 shadow-sm">
                  <div className="flex items-center gap-3">
                    <Sparkles size={20} className="text-blue-500" />
                    <div>
                      <span className="text-[11px] font-bold text-blue-500 uppercase tracking-wider block">WHAT'S NEXT?</span>
                      <span className="text-[13px] font-bold text-slate-800">Send this purchase order to your vendor or mark it as issued.</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => navigate(`/purchase-orders/${selectedOrder.id}/email`)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-[12px] transition-all"
                    >
                      Send Purchase Order
                    </button>
                    <button 
                      onClick={handleMarkAsIssued}
                      className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold text-[12px] transition-all"
                    >
                      Mark as Issued
                    </button>
                  </div>
                </div>
              )}

              {/* Show PDF View toggle */}
              <div className="w-full max-w-[800px] flex justify-end items-center gap-2 mb-3 no-print">
                <span className="text-[12px] font-bold text-slate-500">Show PDF View</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={showPDFView} 
                    onChange={e => setShowPDFView(e.target.checked)} 
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* PDF PREVIEW PAPER (High fidelity rendered document) */}
              <div className={`pdf-preview-paper bg-white w-full max-w-[800px] min-h-[1050px] shadow-lg border border-slate-200/80 p-12 relative overflow-hidden flex flex-col justify-between ${showPDFView ? '' : 'hidden'}`}>
                
                {/* Diagonal Ribbon for Draft POs */}
                {selectedOrder.status?.toLowerCase() === 'draft' && (
                  <div className="ribbon-wrapper">
                    <div className="ribbon">Draft</div>
                  </div>
                )}
                
                <div>
                  {/* Top Header Block */}
                  <div className="flex justify-between items-start mb-12">
                    
                    {/* Left: Company Details */}
                    <div className={`space-y-1 relative z-10 transition-all ${selectedOrder.status === 'Draft' ? 'pl-8' : ''}`}>
                      <h3 className="text-[18px] font-extrabold text-slate-900 tracking-tight">{currentCompany?.name || 'Steel Center'}</h3>
                      <p className="text-[13px] font-semibold text-slate-500">{currentCompany?.street1 || 'Tamil Nadu'}</p>
                      <p className="text-[13px] font-semibold text-slate-500">{currentCompany?.location || 'India'}</p>
                      {currentCompany?.phone && <p className="text-[13px] font-semibold text-slate-500">{currentCompany.phone}</p>}
                      <p className="text-[13px] font-semibold text-slate-500">{currentUserEmail || currentCompany?.website || 'company@example.com'}</p>
                    </div>

                    {/* Right: PO Label */}
                    <div className="text-right">
                      <h1 className="text-[28px] font-bold text-slate-800 uppercase tracking-wider mb-2 font-serif">PURCHASE ORDER</h1>
                      <p className="text-[15px] font-bold text-slate-500"># {selectedOrder.orderNumber}</p>
                    </div>
                  </div>

                  {/* Address Grid */}
                  <div className="grid grid-cols-2 gap-8 mb-12">
                    
                    {/* Vendor Address */}
                    <div className="space-y-2">
                      <h4 className="text-[11px] font-bold text-blue-600 uppercase tracking-widest">Vendor Address</h4>
                      <div className="text-[13px] text-slate-800 leading-relaxed font-semibold">
                        <p className="font-extrabold text-slate-950 text-[14px]">{selectedOrder.Ledger?.name}</p>
                        {vendorBillingAddress ? (
                          <>
                            {vendorBillingAddress.attention && <p className="font-medium">{vendorBillingAddress.attention}</p>}
                            <p className="font-semibold text-slate-700">{vendorBillingAddress.street1 || vendorBillingAddress.address1 || ''}</p>
                            {(vendorBillingAddress.street2 || vendorBillingAddress.address2) && <p className="font-semibold text-slate-700">{vendorBillingAddress.street2 || vendorBillingAddress.address2}</p>}
                            <p className="font-semibold text-slate-700">
                              {[vendorBillingAddress.city, vendorBillingAddress.state, vendorBillingAddress.pinCode || vendorBillingAddress.zipCode || vendorBillingAddress.zip || vendorBillingAddress.pincode].filter(Boolean).join(', ')}
                            </p>
                            <p className="font-semibold text-slate-700">{vendorBillingAddress.country || 'India'}</p>
                          </>
                        ) : (
                          <p className="text-slate-400 italic font-medium">No address provided</p>
                        )}
                        {(selectedVendor?.mobile || selectedVendor?.workPhone) && (
                          <p className="text-[12px] text-slate-500 mt-1 font-mono">Ph: {selectedVendor.mobile || selectedVendor.workPhone}</p>
                        )}
                      </div>
                    </div>

                    {/* Deliver To Address */}
                    <div className="space-y-2">
                      <h4 className="text-[11px] font-bold text-blue-600 uppercase tracking-widest">Deliver To</h4>
                      <div className="text-[13px] text-slate-800 leading-relaxed font-semibold">
                        {deliveryAddressData ? (
                          <>
                            {deliveryAddressData.attention && <p className="font-extrabold text-slate-950 text-[14px]">{deliveryAddressData.attention}</p>}
                            <p className="font-semibold text-slate-700">{deliveryAddressData.street1}</p>
                            {deliveryAddressData.street2 && <p className="font-semibold text-slate-700">{deliveryAddressData.street2}</p>}
                            <p className="font-semibold text-slate-700">
                              {[deliveryAddressData.city, deliveryAddressData.state, deliveryAddressData.zip].filter(Boolean).join(', ')}
                            </p>
                            <p className="font-semibold text-slate-700">{deliveryAddressData.country || 'India'}</p>
                            {deliveryAddressData.phone && (
                              <p className="text-[12px] text-slate-500 mt-1 font-mono">Ph: {deliveryAddressData.phone}</p>
                            )}
                          </>
                        ) : (
                          <p className="text-slate-500 font-semibold">{selectedOrder.deliveryAddressText || 'Organization'}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* PO Meta Rows */}
                  <div className="flex items-center gap-12 border-t border-b border-slate-100 py-4 mb-10 text-[13px] font-semibold">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Date</span>
                      <span className="text-slate-700">{formatDate(selectedOrder.date)}</span>
                    </div>
                    {selectedOrder.deliveryDate && (
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Delivery Date</span>
                        <span className="text-slate-700">{formatDate(selectedOrder.deliveryDate)}</span>
                      </div>
                    )}
                    {selectedOrder.paymentTerms && (
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Payment Terms</span>
                        <span className="text-slate-700">{selectedOrder.paymentTerms}</span>
                      </div>
                    )}
                    {selectedOrder.reference && (
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Reference#</span>
                        <span className="text-slate-700">{selectedOrder.reference}</span>
                      </div>
                    )}
                  </div>

                  {/* Items Table */}
                  <table className="w-full text-left mb-10">
                    <thead>
                      <tr className="bg-slate-800 text-white text-[11px] font-bold uppercase tracking-wider">
                        <th className="px-4 py-3 rounded-l">#</th>
                        <th className="px-4 py-3">Item & Description</th>
                        <th className="px-4 py-3 text-right">Qty</th>
                        <th className="px-4 py-3 text-right">Rate</th>
                        <th className="px-4 py-3 text-right rounded-r">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[13px] font-semibold text-slate-700">
                      {orderItems.length > 0 ? (
                        orderItems.map((item, index) => (
                          <tr key={item.id || index}>
                            <td className="px-4 py-3.5 text-slate-400">{index + 1}</td>
                            <td className="px-4 py-3.5">
                              <p className="font-extrabold text-slate-800">{item.itemName}</p>
                              {item.account && <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Account: {item.account}</p>}
                            </td>
                            <td className="px-4 py-3.5 text-right font-mono">{parseFloat(item.qty || 0).toFixed(2)}</td>
                            <td className="px-4 py-3.5 text-right font-mono">{parseFloat(item.rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900">{parseFloat(item.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="px-4 py-8 text-center text-slate-400 italic">No items found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {/* Totals Summary block */}
                  <div className="flex justify-end mb-16">
                    <div className="w-80 space-y-2 text-[13px] font-bold text-slate-600">
                      <div className="flex justify-between items-center py-1">
                        <span>Sub Total</span>
                        <span className="font-mono text-slate-800">{parseFloat(selectedOrder.subtotal || selectedOrder.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      
                      {parseFloat(selectedOrder.discount || 0) > 0 && (
                        <div className="flex justify-between items-center py-1">
                          <span>Discount ({selectedOrder.discount}%)</span>
                          <span className="font-mono text-red-500">- {parseFloat(selectedOrder.discountAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}

                      {parseFloat(selectedOrder.taxRate || 0) > 0 && (
                        <div className="flex justify-between items-center py-1">
                          <span>Tax ({selectedOrder.taxRate}%)</span>
                          <span className="font-mono text-slate-800">+ {parseFloat(selectedOrder.taxAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}

                      {parseFloat(selectedOrder.tdsRate || 0) > 0 && (
                        <div className="flex justify-between items-center py-1">
                          <span className="text-[11px] uppercase tracking-tight text-slate-400">TDS ({selectedOrder.tdsName || 'TDS'} - {selectedOrder.tdsRate}%)</span>
                          <span className="font-mono text-red-500">- {parseFloat(selectedOrder.tdsAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}

                      {parseFloat(selectedOrder.adjustment || 0) !== 0 && (
                        <div className="flex justify-between items-center py-1">
                          <span>Adjustment</span>
                          <span className="font-mono text-slate-800">{parseFloat(selectedOrder.adjustment || 0) > 0 ? '+' : ''}{parseFloat(selectedOrder.adjustment || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center border-t border-slate-200 py-3 text-[15px] text-slate-900 font-extrabold">
                        <span>Total</span>
                        <span className="font-mono text-[#1e61f0]">₹ {parseFloat(selectedOrder.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Signature */}
                <div className="flex justify-between items-end text-[13px] font-bold text-slate-400">
                  <div className="space-y-1">
                    {selectedOrder.notes && (
                      <>
                        <span className="text-[10px] uppercase font-bold block text-slate-400 tracking-wider">Notes</span>
                        <p className="text-slate-600 font-medium max-w-[400px] leading-relaxed">{selectedOrder.notes}</p>
                      </>
                    )}
                  </div>
                  <div className="text-right space-y-6">
                    <p className="text-slate-700">Authorized Signature</p>
                    <div className="w-48 h-px bg-slate-300 ml-auto"></div>
                  </div>
                </div>
              </div>

              {/* --- ALTERNATIVE APP VIEW --- */}
              {!showPDFView && (
                <div className="w-full max-w-[800px] bg-white shadow-sm border border-slate-200 p-10 animate-in fade-in zoom-in-95 duration-300 rounded-lg">
                  <div className="grid grid-cols-2 gap-12 mb-10">
                    {/* Left Column */}
                    <div>
                      <h2 className="text-[18px] font-extrabold text-slate-800 tracking-tight mb-1">PURCHASE ORDER</h2>
                      <p className="text-[13px] font-medium text-slate-700 mb-8">Purchase Order# <span className="font-bold">{selectedOrder.orderNumber}</span></p>

                      {/* Status Pipeline */}
                      <div className="mb-8 flex">
                        <div className="w-24 text-[10px] font-bold text-slate-500 uppercase tracking-widest space-y-6 pt-1">
                           <p>Status</p>
                        </div>
                        <div className="flex-1 relative">
                          <div className="absolute left-[3px] top-2 bottom-3 w-[2px] bg-amber-400 z-0 rounded-full"></div>
                          
                          <div className="relative z-10 space-y-5">
                             {/* Order Status */}
                             <div className="flex items-center gap-4">
                               <div className="w-2 h-2 bg-amber-500 rounded-full ring-4 ring-white shadow-sm"></div>
                               <div className="flex justify-between w-full text-[12px] font-bold">
                                 <span className="text-slate-800">Order</span>
                                 <span className="bg-blue-600 text-white px-2 py-0.5 rounded-[4px] text-[10px] uppercase tracking-wider">{selectedOrder.status}</span>
                               </div>
                             </div>
                             
                             {/* Receive Status */}
                             <div className="flex items-center gap-4 opacity-50">
                               <div className="w-2 h-2 bg-slate-300 rounded-full ring-4 ring-white shadow-sm"></div>
                               <div className="flex justify-between w-full text-[12px] font-bold">
                                 <span className="text-slate-700">Receive</span>
                                 <span className="text-slate-500">Yet To Be Received</span>
                               </div>
                             </div>

                             {/* Bill Status */}
                             <div className="flex items-center gap-4 opacity-50">
                               <div className="w-2 h-2 bg-slate-300 rounded-full ring-4 ring-white shadow-sm"></div>
                               <div className="flex justify-between w-full text-[12px] font-bold">
                                 <span className="text-slate-700">Bill</span>
                                 <span className="text-slate-500">Yet To Be Billed</span>
                               </div>
                             </div>
                          </div>
                        </div>
                      </div>

                      {/* Meta Information */}
                      <div className="space-y-4">
                        <div className="flex justify-between text-[11px] font-bold">
                          <span className="text-slate-400 uppercase tracking-widest w-32">Order Date</span>
                          <span className="text-slate-700 flex-1">{new Date(selectedOrder.date).toLocaleDateString('en-GB')}</span>
                        </div>
                        <div className="flex justify-between text-[11px] font-bold">
                          <span className="text-slate-400 uppercase tracking-widest w-32">Delivery Date</span>
                          <span className="text-slate-700 flex-1">{selectedOrder.deliveryDate ? new Date(selectedOrder.deliveryDate).toLocaleDateString('en-GB') : '-'}</span>
                        </div>
                        <div className="flex justify-between text-[11px] font-bold">
                          <span className="text-slate-400 uppercase tracking-widest w-32">Payment Terms</span>
                          <span className="text-slate-700 flex-1">{selectedOrder.paymentTerms || '-'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-8 mt-[72px]">
                      {/* Vendor Address */}
                      <div>
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Vendor Address</h4>
                        <div className="text-[12px] text-slate-700 leading-relaxed font-semibold">
                          <p className="text-blue-500 font-bold hover:underline cursor-pointer mb-1">{selectedOrder.Ledger?.name}</p>
                          {vendorBillingAddress ? (
                            <>
                              {vendorBillingAddress.attention && <p>{vendorBillingAddress.attention}</p>}
                              <p>{vendorBillingAddress.street1 || vendorBillingAddress.address1 || ''}</p>
                              {vendorBillingAddress.street2 && <p>{vendorBillingAddress.street2}</p>}
                              <p>{[vendorBillingAddress.city, vendorBillingAddress.state].filter(Boolean).join(', ')}</p>
                              <p>{[vendorBillingAddress.country, vendorBillingAddress.zip || vendorBillingAddress.pinCode].filter(Boolean).join(' - ')}</p>
                              {vendorBillingAddress.phone && <p>{vendorBillingAddress.phone}</p>}
                            </>
                          ) : (
                            <p className="text-slate-400 italic">No billing address</p>
                          )}
                        </div>
                      </div>

                      {/* Delivery Address */}
                      <div>
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Delivery Address</h4>
                        <div className="text-[12px] text-slate-700 leading-relaxed font-semibold">
                          {deliveryAddressData ? (
                            <>
                              <p className="font-extrabold text-slate-900 mb-1">{deliveryAddressData.attention}</p>
                              <p>{deliveryAddressData.street1}</p>
                              {deliveryAddressData.street2 && <p>{deliveryAddressData.street2}</p>}
                              <p>{[deliveryAddressData.city, deliveryAddressData.state].filter(Boolean).join(',')}</p>
                              <p>{deliveryAddressData.country}</p>
                              {deliveryAddressData.phone && <p>{deliveryAddressData.phone}</p>}
                            </>
                          ) : (
                            <p className="text-slate-400 italic">No delivery address</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Items Table */}
                  <table className="w-full text-left mb-6">
                    <thead>
                      <tr className="border-b border-slate-100 bg-[#fbfcfd]">
                        <th className="py-3 px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[40%]">Items & Description</th>
                        <th className="py-3 px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Ordered</th>
                        <th className="py-3 px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
                        <th className="py-3 px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Rate</th>
                        <th className="py-3 px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="text-[12px] text-slate-800 font-semibold">
                      {orderItems.map((item, idx) => (
                        <tr key={idx} className="border-b border-slate-50">
                          <td className="py-4 px-2">
                            <p className="text-blue-500 font-bold hover:underline cursor-pointer">{item.itemName || item.name}</p>
                          </td>
                          <td className="py-4 px-2 text-center">{item.qty}</td>
                          <td className="py-4 px-2 text-center text-slate-600">
                            <span className="font-extrabold text-slate-900">0</span> Billed
                          </td>
                          <td className="py-4 px-2 text-right">₹{parseFloat(item.rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="py-4 px-2 text-right">{parseFloat(item.amount || (parseFloat(item.qty || 0) * parseFloat(item.rate || 0))).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Summary Block */}
                  <div className="flex justify-end pt-4 border-t border-slate-100">
                    <div className="w-[350px]">
                      {/* Sub Total */}
                      <div className="flex justify-between items-start text-[13px] font-extrabold text-slate-900 mb-4">
                        <div className="flex flex-col gap-1">
                          <span>Sub Total</span>
                          <span className="text-[11px] font-semibold text-slate-500">Total Quantity : {orderItems.reduce((sum, i) => sum + Number(i.qty || 0), 0)}</span>
                        </div>
                        <span>₹{parseFloat(selectedOrder.subtotal || orderItems.reduce((sum, item) => sum + (parseFloat(item.qty || 0) * parseFloat(item.rate || 0)), 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>

                      {/* Discount */}
                      {parseFloat(selectedOrder.discountAmount || 0) > 0 ? (
                        <div className="flex justify-between text-[13px] font-bold text-slate-500 mb-3 pb-3 border-b border-slate-100">
                          <span>Discount</span>
                          <span>₹{parseFloat(selectedOrder.discountAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                      ) : (
                        <div className="flex justify-between text-[13px] font-bold text-slate-500 mb-3 pb-3 border-b border-slate-100">
                          <span>Discount</span>
                          <span>₹0.00</span>
                        </div>
                      )}

                      {/* GST */}
                      {parseFloat(selectedOrder.taxAmount || 0) > 0 && (
                        <div className="flex justify-between text-[13px] font-bold text-slate-500 mb-2">
                          <span>GST</span>
                          <span>₹{parseFloat(selectedOrder.taxAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}

                      {/* TDS */}
                      {parseFloat(selectedOrder.tdsAmount || 0) > 0 && (
                        <div className="flex justify-between text-[13px] font-bold text-slate-500 mb-2">
                          <span>TDS</span>
                          <span>-₹{parseFloat(selectedOrder.tdsAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}

                      {/* Adjustment */}
                      {parseFloat(selectedOrder.adjustment || 0) !== 0 && (
                        <div className="flex justify-between text-[13px] font-bold text-slate-500 mb-2">
                          <span>Adjustment</span>
                          <span>{parseFloat(selectedOrder.adjustment) > 0 ? '+' : ''}{parseFloat(selectedOrder.adjustment).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}

                      {/* Grand Total */}
                      <div className="flex justify-between items-center text-[15px] font-extrabold text-slate-900 pt-3">
                        <span>Total</span>
                        <span>₹{parseFloat(selectedOrder.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Template Link */}
              <div className="no-print mt-6 text-[12px] font-bold text-slate-400 flex items-center gap-1.5 justify-center">
                <span>PDF Template</span>
                <span>|</span>
                <button className="text-blue-500 hover:underline">Standard Template Change</button>
              </div>
            </div>
            
            {/* Email Modal */}
            <PurchaseOrderEmailModal 
              isOpen={isEmailModalOpen}
              onClose={() => setIsEmailModalOpen(false)}
              vendor={selectedVendor}
              poData={{
                id: selectedOrder.id,
                poNumber: selectedOrder.orderNumber,
                date: selectedOrder.date,
                companyId: selectedOrder.CompanyId
              }}
              totals={{
                total: parseFloat(selectedOrder.totalAmount || 0)
              }}
              companyName={currentCompany?.name || ''}
              onSent={() => {
                addNotification("Purchase order email sent successfully!", "success");
                if (selectedOrder.status === 'Draft') {
                  setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, status: 'Sent' } : o));
                }
                setIsEmailModalOpen(false);
              }}
            />
          </div>
        ) : (
          
          /* FULL VIEW LISTING TABLE: (When no order is selected) */
          <div className="flex-1 flex flex-col bg-white overflow-hidden shadow-sm">
            {/* Table Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
              <div className="flex items-center gap-1.5 cursor-pointer">
                <span className="text-[18px] font-bold text-slate-800 tracking-tight">All Purchase Orders</span>
                <ChevronDown size={14} className="text-blue-600 mt-0.5 stroke-[2.5]" />
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => navigate('/purchase-orders/new')}
                  className="bg-[#1e61f0] hover:bg-blue-700 text-white px-4 py-1.5 rounded text-[13px] font-bold flex items-center gap-1 transition-all shadow-sm active:scale-95"
                >
                  <Plus size={14} strokeWidth={2.5} />
                  <span>New</span>
                </button>
                <button 
                  className="h-8 w-8 border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 rounded flex items-center justify-center"
                >
                  <MoreHorizontal size={16} />
                </button>
              </div>
            </div>

            {/* Table Content */}
            <div className="flex-1 overflow-auto">
              {filteredOrders.length > 0 ? (
                <div className="animate-in fade-in duration-300">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[#f8fafc] text-[10px] font-extrabold text-slate-500 uppercase tracking-widest border-b border-slate-200">
                      <tr>
                        <th className="w-12 px-4 py-3 border-r border-slate-200/60 text-center">
                          <input type="checkbox" className="rounded border-slate-300 text-blue-600 cursor-pointer" />
                        </th>
                        <th className="px-4 py-3 border-r border-slate-200/60">Date</th>
                        <th className="px-4 py-3 border-r border-slate-200/60">Purchase Order#</th>
                        <th className="px-4 py-3 border-r border-slate-200/60">Reference#</th>
                        <th className="px-4 py-3 border-r border-slate-200/60">Vendor Name</th>
                        <th className="px-4 py-3 border-r border-slate-200/60">Status</th>
                        <th className="px-4 py-3 border-r border-slate-200/60">Billed Status</th>
                        <th className="px-4 py-3 border-r border-slate-200/60 text-right">Amount</th>
                        <th className="px-4 py-3">
                          <div className="flex justify-between items-center">
                            <span>Delivery Date</span>
                            <Search size={12} className="text-slate-400 cursor-pointer hover:text-slate-600 mr-1" />
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[13px] font-semibold text-slate-700">
                      {filteredOrders.map(order => (
                        <tr 
                          key={order.id} 
                          onClick={() => navigate(`/purchase-orders/view/${order.id}`)}
                          className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                        >
                          <td className="px-4 py-3 border-r border-slate-100/60 text-center" onClick={e => e.stopPropagation()}>
                            <input type="checkbox" className="rounded border-slate-300 text-blue-600 cursor-pointer" />
                          </td>
                          <td className="px-4 py-3 border-r border-slate-100/60 text-slate-600">{formatDate(order.date)}</td>
                          <td className="px-4 py-3 border-r border-slate-100/60 text-blue-600 font-bold hover:underline">{order.orderNumber}</td>
                          <td className="px-4 py-3 border-r border-slate-100/60 text-slate-500">{order.reference || '—'}</td>
                          <td className="px-4 py-3 border-r border-slate-100/60 text-slate-800">{order.Ledger?.name || '—'}</td>
                           <td className="px-4 py-3 border-r border-slate-100/60">
                             <span className={`px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider border ${getStatusStyle(order.status)}`}>
                               {order.status}
                             </span>
                           </td>
                           <td className="px-4 py-3 border-r border-slate-100/60">
                             <span className={`px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider border ${getBilledStatusStyle(order.billed_status)}`}>
                               {getBilledStatusLabel(order.billed_status)}
                             </span>
                           </td>
                           <td className="px-4 py-3 border-r border-slate-100/60 text-right font-bold text-slate-900">₹ {parseFloat(order.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="px-4 py-3 text-slate-600 relative group">
                            <span>{formatDate(order.deliveryDate)}</span>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-white border border-slate-200 px-1 py-0.5 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                              <button 
                                onClick={() => navigate(`/purchase-orders/edit/${order.id}`)}
                                className="p-1 hover:text-blue-600 rounded text-slate-400"
                              >
                                <Edit size={13} />
                              </button>
                              <button 
                                onClick={() => triggerDelete(order.id)}
                                className="p-1 hover:text-red-500 rounded text-slate-400"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* procuring empty hero */
                <div className="flex-1 flex flex-col items-center justify-center bg-white min-h-[600px] p-8">
                  <div className="w-full max-w-[800px] flex flex-col items-center text-center px-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="w-24 h-24 bg-blue-50 rounded-[32px] flex items-center justify-center text-blue-600 mb-10 shadow-sm border border-blue-100 rotate-3 hover:rotate-0 transition-transform duration-500">
                      <ShoppingBag size={48} strokeWidth={1.5} />
                    </div>
                    
                    <h2 className="text-[36px] font-bold text-slate-900 mb-4 tracking-tight leading-tight">
                      Streamline Your Procurement: <br/>
                      <span className="text-blue-600">Master Your Purchase Orders</span>
                    </h2>
                    
                    <p className="text-slate-500 text-[17px] mb-12 max-w-[620px] leading-relaxed font-bold opacity-80">
                      Take full control of your supply chain. From draft requests to confirmed deliveries, 
                      track every order with precision and maintain seamless relationships with your vendors.
                    </p>

                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => navigate('/purchase-orders/new')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-[24px] font-bold text-[16px] flex items-center gap-3 transition-all shadow-xl shadow-blue-600/30 active:scale-95 group"
                      >
                        <Plus size={20} strokeWidth={3} className="group-hover:rotate-90 transition-transform" />
                        Create Your First Order
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>



      {/* Delete Confirmation Modal */}
      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Purchase Order"
        message="Are you sure you want to delete this purchase order? This action is permanent and cannot be undone."
      />
    </div>
  );
};

export default PurchaseOrdersView;
