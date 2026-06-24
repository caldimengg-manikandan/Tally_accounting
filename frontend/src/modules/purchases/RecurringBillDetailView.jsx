import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronDown, Edit2, MoreHorizontal, X, Plus,
  RefreshCw, CheckCircle, ChevronRight, FileText,
  Calendar, Clock, Repeat, AlertCircle
} from 'lucide-react';
import { recurringBillAPI, purchaseAPI } from '../../services/api';
import useNotificationStore from '../../store/notificationStore';

const RecurringBillDetailView = ({ companyId }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addNotification } = useNotificationStore();

  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [allBills, setAllBills] = useState([]);
  const [selectedBillId, setSelectedBillId] = useState(id);
  const [childBills, setChildBills] = useState([]);
  const [childLoading, setChildLoading] = useState(false);

  useEffect(() => {
    if (companyId) fetchAll();
  }, [companyId]);

  useEffect(() => {
    if (id) fetchBill(id);
  }, [id]);

  const fetchAll = async () => {
    try {
      const res = await recurringBillAPI.getByCompany(companyId);
      setAllBills(res.data || []);
    } catch (e) {}
  };

  const fetchChildBills = async (billId, currentBill) => {
    if (!companyId) return;
    setChildLoading(true);
    try {
      const res = await purchaseAPI.getBills(companyId);
      const all = res.data || [];
      const filtered = all.filter(v => {
        try {
          if (v.narration && v.narration.startsWith('{')) {
            const parsed = JSON.parse(v.narration);
            if (parsed && String(parsed.templateId) === String(billId)) {
              return true;
            }
          }
        } catch (e) {}
        if (v.voucherNumber && currentBill) {
          return v.voucherNumber.startsWith(`${currentBill.profileName}(`);
        }
        return false;
      });
      setChildBills(filtered);
    } catch (e) {
      console.error("Failed to fetch child bills:", e);
    } finally {
      setChildLoading(false);
    }
  };

  const fetchBill = async (billId) => {
    setLoading(true);
    try {
      const res = await recurringBillAPI.getByCompany(companyId);
      const found = (res.data || []).find(b => String(b.id) === String(billId));
      if (found) {
        setBill(found);
        await fetchChildBills(billId, found);
      }
    } catch (e) {
      addNotification('Failed to load bill', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChildBillClick = async (voucherNum, specificId = null) => {
    if (specificId) {
      navigate('/bills', { state: { selectedBillId: specificId } });
      return;
    }
    try {
      let foundBill = childBills.find(b => b.voucherNumber === voucherNum);
      if (!foundBill && companyId) {
        const res = await purchaseAPI.getBills(companyId);
        foundBill = (res.data || []).find(b => b.voucherNumber === voucherNum);
      }
      if (foundBill) {
        navigate('/bills', { state: { selectedBillId: foundBill.id } });
      } else {
        navigate('/bills');
      }
    } catch (e) {
      console.error("Navigation error:", e);
      navigate('/bills');
    }
  };

  const handleSelectBill = (b) => {
    setSelectedBillId(b.id);
    setBill(b);
    navigate(`/recurring-bills/${b.id}`);
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-';
  const formatAmount = (a) => `₹${parseFloat(a || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-white">
      <RefreshCw size={22} className="animate-spin text-blue-600" />
    </div>
  );

  if (!bill) return (
    <div className="flex items-center justify-center h-screen bg-white text-slate-500">
      Recurring bill not found.
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-80px)] bg-white overflow-hidden text-[13px]">

      {/* ─── LEFT SIDEBAR LIST ────────────────────────────── */}
      <div className="w-[220px] border-r border-slate-100 flex flex-col overflow-hidden bg-white shrink-0">
        {/* Dropdown Header */}
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <button className="flex items-center gap-1 text-blue-600 font-semibold text-[13px]">
            All Recurring Bills
            <ChevronDown size={13} />
          </button>
        </div>

        {/* Bill List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {allBills.map(b => (
            <div
              key={b.id}
              onClick={() => handleSelectBill(b)}
              className={`px-4 py-3 cursor-pointer transition-colors hover:bg-slate-50 ${String(b.id) === String(selectedBillId) ? 'bg-blue-50 border-l-2 border-blue-600' : ''}`}
            >
              <div className={`text-[13px] font-semibold truncate ${String(b.id) === String(selectedBillId) ? 'text-blue-700' : 'text-slate-800'}`}>
                {b.Vendor?.name || b.vendorName || 'Unknown Vendor'}
              </div>
              <div className="text-[11px] text-slate-500 truncate">{b.profileName}</div>
              <div className="text-[12px] font-bold text-slate-800 mt-0.5">
                {formatAmount(b.totalAmount)}
              </div>
              <div className="flex items-center gap-1 mt-1">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${b.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {b.status}
                </span>
                {b.nextGenerationDate && (
                  <span className="text-[10px] text-slate-400">Next on {formatDate(b.nextGenerationDate)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── MAIN CONTENT ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top Bar */}
        <div className="h-12 bg-white border-b border-slate-100 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-2 text-[13px] font-bold text-slate-800">
            {bill.Vendor?.name || bill.vendorName || 'Vendor'}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/recurring-bills/new`)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-semibold rounded transition-colors"
            >
              <Plus size={13} /> Create Bill
            </button>
            <button className="p-1.5 text-slate-400 hover:text-slate-600 border border-slate-200 rounded">
              <Edit2 size={14} />
            </button>
            <button className="p-1.5 text-slate-400 hover:text-slate-600 border border-slate-200 rounded">
              <MoreHorizontal size={14} />
            </button>
            <button
              onClick={() => navigate('/recurring-bills')}
              className="p-1.5 text-slate-400 hover:text-red-500 border border-slate-200 rounded"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Vendor Summary Row */}
        <div className="bg-white border-b border-slate-100 px-6 py-3 flex items-center gap-6">
          <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-[14px] font-bold text-slate-600 shrink-0">
            {(bill.Vendor?.name || bill.vendorName || 'V').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="text-[14px] font-bold text-slate-800">{bill.Vendor?.name || bill.vendorName || 'Unknown Vendor'}</div>
          </div>

          {/* Summary Cards */}
          <div className="flex items-center divide-x divide-slate-200 border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-6 py-2 text-center min-w-[150px]">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Bill Amount</div>
              <div className="text-[16px] font-bold text-slate-900">{formatAmount(bill.totalAmount)}</div>
            </div>
            <div className="px-6 py-2 text-center min-w-[150px]">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Next Bill Date</div>
              <div className="text-[15px] font-bold text-slate-900">{formatDate(bill.nextGenerationDate)}</div>
            </div>
            <div className="px-6 py-2 text-center min-w-[150px]">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Recurring Period</div>
              <div className="text-[15px] font-bold text-blue-600">{bill.repeatEvery || '-'}</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-slate-100 px-6 flex gap-6">
          {['overview', 'nextBill', 'recentActivities'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 text-[13px] font-semibold border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-600 text-slate-800'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab === 'overview' ? 'Overview' : tab === 'nextBill' ? 'Next Bill' : 'Recent Activities'}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50/30">

          {/* ── OVERVIEW TAB ── */}
          {activeTab === 'overview' && (
            <div className="flex gap-6 p-6">
              {/* Left Details */}
              <div className="w-[280px] shrink-0">
                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 font-bold text-[12px] text-slate-600 uppercase tracking-wider">
                    DETAILS
                  </div>
                  <div className="p-4 space-y-3 text-[13px]">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Profile Status</span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                        bill.status === 'Active' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {bill.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Start Date</span>
                      <span className="font-semibold text-slate-800">{formatDate(bill.startDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">End Date</span>
                      <span className="font-semibold text-slate-800">
                        {bill.neverExpires ? 'Never Expires' : formatDate(bill.endDate)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Payment Terms</span>
                      <span className="font-semibold text-blue-600">{bill.paymentTerms || 'Due on Receipt'}</span>
                    </div>
                    {bill.discount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Discount</span>
                        <span className="font-semibold text-slate-800">{bill.discount}%</span>
                      </div>
                    )}
                    {bill.tdsName && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">TDS</span>
                        <span className="font-semibold text-slate-800">{bill.tdsName} ({bill.tdsRate}%)</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Child Bills */}
              <div className="flex-1 pl-4">
                {/* Child Bills Header */}
                <div className="flex items-center justify-between mb-4">
                  <button className="flex items-center gap-1 text-blue-600 font-bold text-[13px] hover:text-blue-800">
                    All Child Bills <ChevronDown size={14} strokeWidth={2.5} />
                  </button>
                </div>

                <div className="border-t border-slate-200">
                  {childBills.length > 0 ? (
                    childBills.map((cb) => (
                      <div key={cb.id} className="flex justify-between items-start py-5 border-b border-slate-200 group hover:bg-slate-50/50 transition-colors">
                        <div>
                          <div className="text-[13px] font-bold text-slate-800 mb-1">{cb.Ledger?.name || bill.Vendor?.name || bill.vendorName || 'Unknown Vendor'}</div>
                          <div className="text-[12px] text-slate-500">
                             <span 
                               className="text-blue-600 font-medium hover:underline cursor-pointer"
                               onClick={() => handleChildBillClick(cb.voucherNumber, cb.id)}
                             >
                               {cb.voucherNumber}
                             </span>
                             <span className="mx-2 text-slate-300">|</span>
                             <span>{formatDate(cb.date)}</span>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1.5">
                          <div className="text-[14px] font-bold text-slate-800">{formatAmount(cb.totalAmount)}</div>
                          <div className={`text-[10px] font-bold uppercase tracking-widest ${cb.status === 'PAID' ? 'text-emerald-500' : 'text-blue-500'}`}>{cb.status || 'OPEN'}</div>
                          {cb.status !== 'PAID' && (
                            <button 
                              onClick={() => navigate('/payments-made/new', { state: { vendorId: bill.vendorId, billId: cb.id, amount: cb.balanceDue } })}
                              className="mt-0.5 px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-[11px] font-bold rounded shadow-sm transition-all active:scale-95"
                            >
                               Record Payment
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    bill.lastGeneratedDate || (bill.childBills && bill.childBills.length > 0) || true ? (
                      <div className="flex justify-between items-start py-5 border-b border-slate-200 group hover:bg-slate-50/50 transition-colors">
                        <div>
                          <div className="text-[13px] font-bold text-slate-800 mb-1">{bill.Vendor?.name || bill.vendorName || 'Unknown Vendor'}</div>
                          <div className="text-[12px] text-slate-500">
                             <span 
                               className="text-blue-600 font-medium hover:underline cursor-pointer"
                               onClick={() => {
                                 const dateStr = new Date(bill.lastGeneratedDate || bill.startDate || new Date()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                                 const vName = `${bill.profileName}(${dateStr})`;
                                 handleChildBillClick(vName);
                               }}
                             >
                               {bill.profileName}({new Date(bill.lastGeneratedDate || bill.startDate || new Date()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })})
                             </span>
                             <span className="mx-2 text-slate-300">|</span>
                             <span>{formatDate(bill.lastGeneratedDate || bill.startDate || new Date())}</span>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1.5">
                          <div className="text-[14px] font-bold text-slate-800">{formatAmount(bill.totalAmount)}</div>
                          <div className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">OPEN</div>
                          <button 
                            onClick={() => {
                              const dateStr = new Date(bill.lastGeneratedDate || bill.startDate || new Date()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                              const vName = `${bill.profileName}(${dateStr})`;
                              handleChildBillClick(vName);
                            }}
                            className="mt-0.5 px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-[11px] font-bold rounded shadow-sm transition-all active:scale-95"
                          >
                             Record Payment
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="py-12 text-center text-slate-400">
                        <Repeat size={32} className="mx-auto mb-3 text-slate-200" />
                        <p className="font-medium">Recurring Bills for this</p>
                        <p>profile will begin from {formatDate(bill.nextGenerationDate)}</p>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          )}
          {activeTab === 'nextBill' && (
            <div className="p-6">
              <div className="bg-white border border-slate-200 rounded-lg p-8 max-w-lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Calendar size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 text-[15px]">Next Bill Generation</div>
                    <div className="text-slate-500 text-[12px]">Automatic bill will be created on this date</div>
                  </div>
                </div>
                <div className="space-y-4 text-[13px]">
                  <div className="flex justify-between py-3 border-b border-slate-100">
                    <span className="text-slate-500">Next Bill Date</span>
                    <span className="font-bold text-blue-600">{formatDate(bill.nextGenerationDate)}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-slate-100">
                    <span className="text-slate-500">Frequency</span>
                    <span className="font-bold text-slate-800">{bill.repeatEvery}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-slate-100">
                    <span className="text-slate-500">Bill Amount</span>
                    <span className="font-bold text-slate-800">{formatAmount(bill.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between py-3">
                    <span className="text-slate-500">Vendor</span>
                    <span className="font-bold text-slate-800">{bill.Vendor?.name || bill.vendorName || '-'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── RECENT ACTIVITIES TAB ── */}
          {activeTab === 'recentActivities' && (
            <div className="p-6">
              <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
                <Clock size={32} className="mx-auto mb-3 text-slate-200" />
                <p className="text-slate-500 font-medium">No recent activities</p>
                <p className="text-slate-400 text-[12px] mt-1">Actions taken on this recurring bill will appear here</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default RecurringBillDetailView;
