import { getUser } from '../../stores/authStore';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  FileText, Plus, Search, Download, RefreshCcw,
  BookOpen, Edit2, Trash2, X, TrendingUp, TrendingDown,
  ArrowUpDown, CreditCard, Receipt, BarChart3, Repeat2,
  FileMinus, FilePlus, ShoppingCart, ShoppingBag, ChevronDown
} from 'lucide-react';
import { voucherAPI } from '../../services/api';
import useNotificationStore from '../../store/notificationStore';

const VOUCHER_TYPES = ['Journal', 'Payment', 'Receipt', 'Contra', 'Debit Note', 'Credit Note', 'Sales', 'Purchase'];

const TYPE_CONFIG = {
  Receipt:      { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0', dot: '#10b981', icon: TrendingUp   },
  Payment:      { bg: '#fff1f2', text: '#881337', border: '#fecdd3', dot: '#f43f5e', icon: TrendingDown  },
  Journal:      { bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe', dot: '#3b82f6', icon: BookOpen      },
  Contra:       { bg: '#f5f3ff', text: '#4c1d95', border: '#ddd6fe', dot: '#8b5cf6', icon: ArrowUpDown   },
  Sales:        { bg: '#ecfeff', text: '#164e63', border: '#a5f3fc', dot: '#06b6d4', icon: ShoppingCart  },
  Purchase:     { bg: '#fff7ed', text: '#7c2d12', border: '#fed7aa', dot: '#f97316', icon: ShoppingBag   },
  'Debit Note': { bg: '#fefce8', text: '#713f12', border: '#fde68a', dot: '#eab308', icon: FileMinus     },
  'Credit Note':{ bg: '#f0fdf4', text: '#14532d', border: '#bbf7d0', dot: '#22c55e', icon: FilePlus      },
};

const fmt = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const VoucherListView = ({
  onCreateNew, onEdit, onView, onDelete,
  defaultType = '', title = "Vouchers",
  subtitle = "Transaction Journal",
  buttonText = "New Voucher",
  hideTabs = false
}) => {
  const [allData, setAllData]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [typeFilter, setTypeFilter] = useState(defaultType);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate]     = useState('');
  const [sortField, setSortField] = useState('date');
  const [sortDir, setSortDir]   = useState('desc');
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, voucherNumber, voucherType }
  const [deleting, setDeleting] = useState(false);

  const companyId = sessionStorage.getItem('companyId');
  const user = useMemo(() => { try { return getUser(); } catch { return {}; } }, []);
  const role = user.role || 'ADMIN';
  const canEdit = !['VIEWER', 'AUDITOR'].includes(role);
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(role);

  const fetchVouchers = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const res = await voucherAPI.getByCompany(companyId);
      setAllData(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); }
    setLoading(false);
  }, [companyId]);

  useEffect(() => { fetchVouchers(); }, [fetchVouchers]);

  const filtered = useMemo(() => {
    let data = allData.filter(v => {
      const q = search.toLowerCase();
      const matchSearch = !search ||
        (v.narration || '').toLowerCase().includes(q) ||
        (v.voucherNumber || '').toLowerCase().includes(q);
      const matchType = !typeFilter || v.voucherType === typeFilter;
      const vDate = v.date ? new Date(v.date) : null;
      const matchFrom = !fromDate || (vDate && vDate >= new Date(fromDate));
      const matchTo   = !toDate   || (vDate && vDate <= new Date(toDate));
      return matchSearch && matchType && matchFrom && matchTo;
    });

    data.sort((a, b) => {
      let av = a[sortField] || '', bv = b[sortField] || '';
      if (sortField === 'amount') {
        av = (a.Transactions || []).reduce((s, t) => s + (parseFloat(t.debit) || 0), 0);
        bv = (b.Transactions || []).reduce((s, t) => s + (parseFloat(t.debit) || 0), 0);
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return data;
  }, [allData, search, typeFilter, fromDate, toDate, sortField, sortDir]);

  const totalAmount = useMemo(() =>
    filtered.reduce((s, v) => s + (v.Transactions || []).reduce((a, t) => a + (parseFloat(t.debit) || 0), 0), 0),
  [filtered]);

  // Summary stats per type (only types with data)
  const typeStats = useMemo(() => {
    const stats = {};
    allData.forEach(v => {
      if (!stats[v.voucherType]) stats[v.voucherType] = { count: 0, amount: 0 };
      const amt = (v.Transactions || []).reduce((a, t) => a + (parseFloat(t.debit) || 0), 0);
      stats[v.voucherType].count++;
      stats[v.voucherType].amount += amt;
    });
    return stats;
  }, [allData]);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (onDelete) {
        await onDelete(deleteTarget.id);
      } else {
        await voucherAPI.delete(deleteTarget.id);
      }
      setAllData(prev => prev.filter(v => v.id !== deleteTarget.id));
      useNotificationStore.getState().addNotification(
        `Voucher ${deleteTarget.voucherNumber || ''} deleted successfully`,
        'success'
      );
    } catch (e) {
      console.error('Delete failed', e);
      useNotificationStore.getState().addNotification(
        e.response?.data?.error || e.message || 'Failed to delete voucher',
        'error'
      );
    }
    setDeleting(false);
    setDeleteTarget(null);
  };

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const exportCSV = () => {
    const rows = [
      ['Voucher No', 'Date', 'Type', 'Status', 'Narration', 'Amount (₹)'],
      ...filtered.map(v => {
        const amt = (v.Transactions || []).reduce((a, t) => a + (parseFloat(t.debit) || 0), 0);
        return [v.voucherNumber, fmtDate(v.date), v.voucherType, v.status || 'Draft', (v.narration || '').replace(/,/g, ';'), amt.toFixed(2)];
      })
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'vouchers.csv';
    a.click();
  };

  const SortIcon = ({ field }) => (
    <span className={`inline-block ml-1 transition-colors ${sortField === field ? 'text-blue-500' : 'text-slate-300'}`}>
      {sortField === field ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:!from-slate-900 dark:!to-slate-950">

      {/* ── DELETE CONFIRMATION MODAL (portal → renders at body level) ── */}
      {deleteTarget && createPortal(
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          background: 'rgba(15, 23, 42, 0.55)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
        }}>
          <div style={{
            background: '#fff', borderRadius: 20,
            padding: '32px 32px 28px',
            width: '100%', maxWidth: 420,
            boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
            display: 'flex', flexDirection: 'column', gap: 0,
          }}>
            {/* Icon */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16,
                background: '#fff1f2', border: '1.5px solid #fecdd3',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Trash2 size={24} color="#e11d48" strokeWidth={2} />
              </div>
            </div>
            {/* Title */}
            <div style={{ textAlign: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>Delete Voucher?</div>
              <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500, marginTop: 6, lineHeight: 1.5 }}>
                You are about to delete voucher
                <span style={{ fontWeight: 800, color: '#1e293b', margin: '0 4px' }}>
                  {deleteTarget.voucherNumber || 'this voucher'}
                </span>
                {deleteTarget.voucherType && (
                  <span style={{ display:'inline-block', padding:'2px 8px', borderRadius:5, fontSize:10, fontWeight:800, textTransform:'uppercase', marginLeft:4,
                    background: TYPE_CONFIG[deleteTarget.voucherType]?.bg || '#f1f5f9',
                    color: TYPE_CONFIG[deleteTarget.voucherType]?.text || '#334155' }}>
                    {deleteTarget.voucherType}
                  </span>
                )}
              </div>
            </div>
            {/* Warning */}
            <div style={{
              background: '#fff7ed', border: '1px solid #fed7aa',
              borderRadius: 10, padding: '12px 14px',
              fontSize: 12, color: '#92400e', fontWeight: 600,
              display: 'flex', gap: 8, alignItems: 'flex-start',
              margin: '16px 0 24px'
            }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>⚠️</span>
              <span>This will permanently reverse all ledger balance changes made by this voucher. This action cannot be undone.</span>
            </div>
            {/* Buttons */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                style={{
                  flex: 1, padding: '11px 0', borderRadius: 12,
                  border: '1.5px solid #e2e8f0', background: '#f8fafc',
                  color: '#475569', fontWeight: 700, fontSize: 13,
                  cursor: 'pointer', fontFamily: 'inherit'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                style={{
                  flex: 1, padding: '11px 0', borderRadius: 12,
                  border: 'none', background: deleting ? '#fda4af' : '#e11d48',
                  color: '#fff', fontWeight: 800, fontSize: 13,
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  boxShadow: '0 2px 8px rgba(225,29,72,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                }}
              >
                {deleting ? (
                  <><span style={{ width:14, height:14, border:'2px solid rgba(255,255,255,0.4)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block', animation:'spin .7s linear infinite' }}/> Deleting…</>
                ) : (
                  <><Trash2 size={14}/> Yes, Delete</>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      <div className="max-w-[1600px] mx-auto px-8 py-8">

        {/* ── PAGE HEADER ───────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: '#2563eb',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(37,99,235,0.25)'
              }}>
                <BookOpen size={18} color="#fff" strokeWidth={2.5} />
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                  {subtitle}
                </div>
              </div>
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', margin: 0 }}>{title}</h1>
            <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500, marginTop: 4 }}>
              {allData.length} vouchers · Total {fmt(allData.reduce((s, v) => s + (v.Transactions || []).reduce((a, t) => a + (parseFloat(t.debit) || 0), 0), 0))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button onClick={fetchVouchers} style={iconBtn} title="Refresh">
              <RefreshCcw size={15} />
            </button>
            <button onClick={exportCSV} style={iconBtn} title="Export CSV">
              <Download size={15} />
            </button>
            {canEdit && (
              <button onClick={onCreateNew} style={primaryBtn}>
                <Plus size={16} strokeWidth={2.5} /> {buttonText}
              </button>
            )}
          </div>
        </div>

        {/* ── SUMMARY CARDS ─────────────────────────────── */}
        {!hideTabs && Object.keys(typeStats).length > 0 && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            {/* Total card */}
            <div
              onClick={() => setTypeFilter('')}
              className={`flex-1 min-w-[140px] cursor-pointer rounded-2xl p-4 transition-all duration-200 ${
                typeFilter === '' 
                  ? 'bg-blue-600 border border-blue-600 shadow-[0_4px_16px_rgba(37,99,235,0.25)]' 
                  : 'bg-white border border-slate-100 dark:!bg-slate-900 dark:!border-slate-800'
              }`}
              style={{ ...summaryCard }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ ...summaryLabel, color: typeFilter === '' ? 'rgba(255,255,255,0.6)' : '#64748b' }}>ALL VOUCHERS</div>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: typeFilter === '' ? 'rgba(255,255,255,0.12)' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BarChart3 size={14} color={typeFilter === '' ? '#fff' : '#475569'} />
                </div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: typeFilter === '' ? '#fff' : '#0f172a', letterSpacing: '-0.02em' }}>{allData.length}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: typeFilter === '' ? 'rgba(255,255,255,0.7)' : '#94a3b8', marginTop: 2 }}>
                {fmt(allData.reduce((s, v) => s + (v.Transactions || []).reduce((a, t) => a + (parseFloat(t.debit) || 0), 0), 0))}
              </div>
            </div>

            {/* Per-type cards */}
            {Object.entries(typeStats).map(([type, stat]) => {
              const cfg = TYPE_CONFIG[type] || { bg: '#f8fafc', text: '#334155', border: '#e2e8f0', dot: '#94a3b8', icon: FileText };
              const Icon = cfg.icon;
              const active = typeFilter === type;
              return (
                <div
                  key={type}
                  onClick={() => setTypeFilter(active ? '' : type)}
                  className={`flex-1 min-w-[140px] cursor-pointer rounded-2xl p-4 transition-all duration-200 ${
                    active 
                      ? 'border-[1.5px]' 
                      : 'bg-white border-[1.5px] border-slate-100 dark:!bg-slate-900 dark:!border-slate-800'
                  }`}
                  style={{
                    ...summaryCard,
                    ...(active ? { background: cfg.bg, borderColor: cfg.border, boxShadow: `0 4px 16px ${cfg.dot}33`, transform: 'translateY(-1px)' } : { boxShadow: summaryCard.boxShadow })
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ ...summaryLabel, color: active ? cfg.text : '#64748b' }}>{type.toUpperCase()}</div>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: active ? `${cfg.dot}22` : '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={14} color={active ? cfg.dot : '#94a3b8'} />
                    </div>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: active ? cfg.text : '#0f172a', letterSpacing: '-0.02em' }}>{stat.count}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: active ? cfg.text : '#94a3b8', marginTop: 2, opacity: active ? 0.8 : 1 }}>
                    {fmt(stat.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── SEARCH & FILTERS BAR ──────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_8px_rgba(0,0,0,0.05)] p-4 mb-4 flex items-center gap-4 flex-wrap dark:!bg-slate-900 dark:!border-slate-800">
          {/* Search */}
          <div style={{ position: 'relative', flex: '1', minWidth: 220 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#c0c9d8' }} />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search narration or voucher number…"
              style={{
                width: '100%', border: '1.5px solid #f1f5f9', borderRadius: 10,
                padding: '9px 12px 9px 36px', fontSize: 13, fontWeight: 500,
                color: '#1e293b', background: '#f8fafc', outline: 'none',
                fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color .15s'
              }}
              onFocus={e => e.target.style.borderColor = '#cbd5e1'}
              onBlur={e => e.target.style.borderColor = '#f1f5f9'}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#c0c9d8', display: 'flex' }}>
                <X size={13} />
              </button>
            )}
          </div>

          {/* Type filter pills (compact, inside bar) */}
          {!hideTabs && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['', ...VOUCHER_TYPES].map(t => {
                const active = typeFilter === t;
                const cfg = t ? TYPE_CONFIG[t] : null;
                return (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    style={{
                      padding: '6px 14px', borderRadius: 8,
                      border: active ? (cfg ? `1.5px solid ${cfg.border}` : '1.5px solid #bfdbfe') : '1.5px solid #f1f5f9',
                      background: active ? (cfg ? cfg.bg : '#eff6ff') : '#fff',
                      color: active ? (cfg ? cfg.text : '#1d4ed8') : '#64748b',
                      fontWeight: active ? 700 : 600,
                      fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em',
                      cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {t || 'All'}
                  </button>
                );
              })}
            </div>
          )}

          {/* Date range */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
              style={dateInput}
            />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#cbd5e1' }}>→</span>
            <input
              type="date" value={toDate} onChange={e => setToDate(e.target.value)}
              style={dateInput}
            />
            {(fromDate || toDate) && (
              <button onClick={() => { setFromDate(''); setToDate(''); }}
                style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px' }}>
                Clear
              </button>
            )}
          </div>

          {/* Results badge */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{
              padding: '7px 16px', borderRadius: 10,
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              color: '#fff', fontSize: 12, fontWeight: 800, letterSpacing: '-0.01em',
              display: 'flex', gap: 10, alignItems: 'center'
            }}>
              <span style={{ opacity: 0.6, fontSize: 10, fontWeight: 700 }}>SHOWING</span>
              <span>{filtered.length}</span>
              <span style={{ opacity: 0.4, fontSize: 10 }}>of {allData.length}</span>
              <span style={{ opacity: 0.4 }}>·</span>
              <span>{fmt(totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* ── DATA TABLE ────────────────────────────────── */}
        <div className="bg-white rounded-[20px] border border-slate-100 shadow-[0_2px_24px_rgba(0,0,0,0.06)] overflow-hidden dark:!bg-slate-900 dark:!border-slate-800">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 dark:!bg-slate-950 dark:!border-slate-800">
                {[
                  { label: 'Voucher No.', field: 'voucherNumber', align: 'left'  },
                  { label: 'Date',        field: 'date',          align: 'left'  },
                  { label: 'Type',        field: 'voucherType',   align: 'left'  },
                  { label: 'Status',      field: 'status',        align: 'center'},
                  { label: 'Narration',   field: 'narration',     align: 'left'  },
                  { label: 'Amount (₹)',  field: 'amount',        align: 'right' },
                  ...(canEdit ? [{ label: 'Actions', field: null, align: 'center' }] : []),
                ].map((col, i) => (
                  <th
                    key={i}
                    onClick={col.field ? () => toggleSort(col.field) : undefined}
                    style={{
                      padding: '13px 20px', textAlign: col.align,
                      fontSize: 10, fontWeight: 800, color: '#94a3b8',
                      textTransform: 'uppercase', letterSpacing: '0.12em',
                      cursor: col.field ? 'pointer' : 'default',
                      userSelect: 'none',
                      transition: 'color .15s',
                    }}
                    onMouseEnter={e => { if (col.field) e.currentTarget.style.color = '#334155'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; }}
                  >
                    {col.label}
                    {col.field && <SortIcon field={col.field} />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={canEdit ? 7 : 6} style={{ padding: '64px 20px', textAlign: 'center' }}>
                    <div style={{ width: 36, height: 36, border: '3px solid #e2e8f0', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
                    <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>Loading vouchers…</div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 7 : 6} style={{ padding: '64px 20px', textAlign: 'center' }}>
                    <div style={{ width: 52, height: 52, background: '#f1f5f9', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                      <BookOpen size={22} color="#c0c9d8" />
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#334155', marginBottom: 6 }}>No vouchers found</div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 20 }}>
                      {search || typeFilter ? 'Try adjusting your filters' : 'Record your first accounting entry to get started'}
                    </div>
                    {canEdit && !search && !typeFilter && (
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <button onClick={onCreateNew} style={primaryBtn}>
                          <Plus size={15} strokeWidth={2.5} /> Create First Voucher
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((v, idx) => {
                  const amount = (v.Transactions || []).reduce((a, t) => a + (parseFloat(t.debit) || 0), 0);
                  const cfg = TYPE_CONFIG[v.voucherType] || { bg: '#f8fafc', text: '#334155', border: '#e2e8f0', dot: '#94a3b8' };
                  return (
                    <tr
                      key={v.id}
                      style={{
                        borderBottom: idx < filtered.length - 1 ? '1px solid #f8fafc' : 'none',
                        transition: 'background .12s',
                        cursor: 'default',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fafbff'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Voucher No */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', letterSpacing: '-0.01em' }}>
                          {v.voucherNumber || '—'}
                        </div>
                      </td>

                      {/* Date */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>
                          {fmtDate(v.date)}
                        </div>
                      </td>

                      {/* Type badge */}
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '4px 10px', borderRadius: 7,
                          background: cfg.bg, color: cfg.text,
                          border: `1px solid ${cfg.border}`,
                          fontSize: 10, fontWeight: 800,
                          textTransform: 'uppercase', letterSpacing: '0.08em',
                          whiteSpace: 'nowrap'
                        }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
                          {v.voucherType || 'Journal'}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 10px', borderRadius: 12,
                          background: v.status === 'Approved' ? '#ecfdf5' : v.status === 'Cancelled' ? '#fef2f2' : '#f1f5f9',
                          color: v.status === 'Approved' ? '#059669' : v.status === 'Cancelled' ? '#ef4444' : '#64748b',
                          fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em'
                        }}>
                          {v.status || 'Draft'}
                        </span>
                      </td>

                      {/* Narration */}
                      <td style={{ padding: '14px 20px', maxWidth: 360 }}>
                        <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {v.narration
                            ? v.narration.length > 70
                              ? v.narration.substring(0, 70) + '…'
                              : v.narration
                            : <span style={{ fontStyle: 'italic', color: '#c0c9d8' }}>No narration</span>}
                        </div>
                      </td>

                      {/* Amount */}
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>
                          {fmt(amount)}
                        </div>
                      </td>

                      {/* Actions */}
                      {canEdit && (
                        <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                            {isAdmin && (!v.status || v.status === 'Draft' || v.status === 'DRAFT') && (
                                <button
                                  onClick={async () => {
                                    try {
                                      await voucherAPI.approve(v.id);
                                      fetchVouchers();
                                      useNotificationStore.getState().addNotification('Voucher Approved', 'success');
                                    } catch(e) {
                                      useNotificationStore.getState().addNotification('Failed to approve', 'error');
                                    }
                                  }}
                                  title="Approve"
                                  style={{...editBtn, background: '#ecfdf5', borderColor: '#a7f3d0', color: '#059669'}}
                                >
                                  <span style={{fontSize: 14, fontWeight: 'bold'}}>✓</span>
                                </button>
                            )}
                            {(!['Approved', 'locked'].includes(v.status) || isAdmin) && (
                              <button
                                onClick={() => onEdit && onEdit(v)}
                                title="Edit"
                                style={editBtn}
                                onMouseEnter={e => { e.currentTarget.style.background = '#fef9c3'; e.currentTarget.style.borderColor = '#fde047'; e.currentTarget.style.color = '#854d0e'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#94a3b8'; }}
                              >
                                <Edit2 size={13} />
                              </button>
                            )}
                            {isAdmin && (
                              <button
                                onClick={() => setDeleteTarget({ id: v.id, voucherNumber: v.voucherNumber, voucherType: v.voucherType })}
                                title="Delete"
                                style={deleteBtn}
                                onMouseEnter={e => { e.currentTarget.style.background = '#fff1f2'; e.currentTarget.style.borderColor = '#fecdd3'; e.currentTarget.style.color = '#e11d48'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#94a3b8'; }}
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Footer */}
          {filtered.length > 0 && (
            <div style={{
              padding: '14px 20px',
              borderTop: '1px solid #f8fafc',
              background: '#fafbfc',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                {filtered.length} of {allData.length} records
                {typeFilter && ` · Filtered by "${typeFilter}"`}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Total</span>
                <span style={{ fontSize: 15, fontWeight: 900, color: '#1e293b' }}>{fmt(totalAmount)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

/* ── Style tokens ───────────────────────────────────────────── */
const summaryCard = {
  borderRadius: 14, padding: '16px 18px', minWidth: 140, flex: '0 0 auto',
  border: '1.5px solid #f1f5f9', boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
  transition: 'all .18s ease', cursor: 'pointer'
};
const summaryLabel = {
  fontSize: 9, fontWeight: 800, textTransform: 'uppercase',
  letterSpacing: '0.14em', color: '#64748b'
};
const primaryBtn = {
  display: 'flex', alignItems: 'center', gap: 7,
  padding: '10px 22px', borderRadius: 12, border: 'none',
  background: '#2563eb',
  color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer',
  fontFamily: 'inherit', boxShadow: '0 2px 10px rgba(37,99,235,0.3)',
  transition: 'all .15s', letterSpacing: '-0.01em', whiteSpace: 'nowrap'
};
const iconBtn = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  width: 38, height: 38, borderRadius: 10, border: '1px solid #e2e8f0',
  background: '#fff', color: '#64748b', cursor: 'pointer',
  boxShadow: '0 1px 4px rgba(0,0,0,0.05)', transition: 'all .15s', fontFamily: 'inherit'
};
const dateInput = {
  border: '1.5px solid #f1f5f9', borderRadius: 10,
  padding: '8px 12px', fontSize: 12, fontWeight: 600,
  color: '#475569', background: '#f8fafc', outline: 'none',
  fontFamily: 'inherit', transition: 'border-color .15s', cursor: 'pointer'
};
const editBtn = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  width: 32, height: 32, borderRadius: 8, border: '1px solid #e2e8f0',
  background: '#f8fafc', color: '#94a3b8', cursor: 'pointer',
  transition: 'all .15s', fontFamily: 'inherit'
};
const deleteBtn = {
  ...editBtn
};

export default VoucherListView;
