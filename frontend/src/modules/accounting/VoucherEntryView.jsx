import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Plus, Trash2, AlertCircle,
  CheckCircle2, FileText, Calendar, Hash, AlignLeft,
  ChevronDown, Loader2, RefreshCw, TrendingUp, TrendingDown,
  Zap
} from 'lucide-react';
import { ledgerAPI, voucherAPI, groupAPI, costCenterAPI, accountingAPI } from '../../services/api';
import CostCenterAllocationModal from './CostCenterAllocationModal';

const VOUCHER_TYPES = ['Journal', 'Payment', 'Receipt', 'Contra', 'Sales', 'Purchase', 'Debit Note', 'Credit Note'];

const VOUCHER_GUIDE = {
  Receipt: {
    emoji: '💰', color: '#065f46', bg: '#ecfdf5', border: '#a7f3d0',
    title: 'Money Coming IN',
    tip: 'Use Receipt when actual cash or bank money flows INTO the business.',
    debit: 'Cash / Bank Account (where money lands)',
    credit: 'Income source or Debtor paying you',
    examples: 'Customer payment · Owner investment · Loan received',
  },
  Payment: {
    emoji: '💸', color: '#881337', bg: '#fff1f2', border: '#fecdd3',
    title: 'Money Going OUT',
    tip: 'Use Payment when actual cash or bank money flows OUT of the business.',
    debit: 'Expense account (what you paid for)',
    credit: 'Cash / Bank Account (where money came from)',
    examples: 'Office rent · Electricity bill · Salary · Vendor payment',
  },
  Journal: {
    emoji: '📋', color: '#1e40af', bg: '#eff6ff', border: '#bfdbfe',
    title: 'No Cash Involved',
    tip: 'Use Journal for adjustments where cash does NOT physically change hands.',
    debit: 'Asset / Expense being recognized',
    credit: 'Liability / Creditor (you owe them)',
    examples: 'Credit purchases · Depreciation · Provision for taxes',
  },
  Contra: {
    emoji: '🔄', color: '#4c1d95', bg: '#f5f3ff', border: '#ddd6fe',
    title: 'Internal Fund Transfer',
    tip: 'Use Contra only when moving money between your own cash/bank accounts.',
    debit: 'Destination (Cash/Bank receiving the money)',
    credit: 'Source (Cash/Bank sending the money)',
    examples: 'ATM withdrawal · Bank-to-cash transfer · Cash deposit into bank',
  },
  'Debit Note': {
    emoji: '📉', color: '#713f12', bg: '#fefce8', border: '#fde68a',
    title: 'Purchase Return / Vendor Deduction',
    tip: 'Use Debit Note when you return goods to a vendor or deduct from their payable.',
    debit: 'Sundry Creditor (reducing what you owe)',
    credit: 'Purchase Returns account',
    examples: 'Returning defective goods to supplier · Claiming discount from vendor',
  },
  'Credit Note': {
    emoji: '📈', color: '#14532d', bg: '#f0fdf4', border: '#bbf7d0',
    title: 'Sales Return / Customer Deduction',
    tip: 'Use Credit Note when a customer returns goods or you issue a discount.',
    debit: 'Sales Returns account',
    credit: 'Sundry Debtor (reducing what they owe)',
    examples: 'Customer returns damaged item · Issuing a price correction to customer',
  },
  Sales: {
    emoji: '🛒', color: '#164e63', bg: '#ecfeff', border: '#a5f3fc',
    title: 'Revenue from Sales',
    tip: 'Record when you sell inventory or provide your main business service.',
    debit: 'Sundry Debtor (if credit sale) or Cash/Bank',
    credit: 'Sales Account (Domestic / Export)',
    examples: 'Invoice raised to customer · Point-of-sale transaction',
  },
  Purchase: {
    emoji: '📦', color: '#7c2d12', bg: '#fff7ed', border: '#fed7aa',
    title: 'Stock / Inventory Purchase',
    tip: 'Use for buying goods you will resell. Do NOT use for buying office equipment (that is a Fixed Asset).',
    debit: 'Purchase Account (Local / Imported)',
    credit: 'Sundry Creditor or Cash/Bank',
    examples: 'Buying stock from wholesaler · Importing raw materials',
  },
};

let _uid = 100;
const newRow = (type = 'Dr', amount = '') => ({ _id: _uid++, ledgerId: '', costCenterId: '', allocations: [], type, amount, note: '' });

export default function VoucherEntryView({ onSaveSuccess, onCancel }) {
  const navigate = useNavigate();
  const { id }   = useParams();
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get('type') || 'Journal';

  const [vType,     setVType]     = useState(initialType);
  const [date,      setDate]      = useState(new Date().toISOString().split('T')[0]);
  const [refNo,     setRefNo]     = useState('');
  const [narration, setNarration] = useState('');
  const [rows,      setRows]      = useState([newRow('Dr'), newRow('Cr')]);
  const [ledgers,   setLedgers]   = useState([]);
  const [costCenters, setCostCenters] = useState([]);
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [postErr,   setPostErr]   = useState('');
  const [activeRowId, setActiveRowId] = useState(null);

  const vNo = useMemo(
    () => `${vType.slice(0,3).toUpperCase()}-${new Date().getFullYear()}-${String(Math.floor(Math.random()*9000)+1000)}`,
    [vType]
  );

  /* ── Load data ─────────────────────────────────────────────── */
  useEffect(() => {
    groupAPI.resolveGroups().then(res => {
      const cid = res.data?.companyId;
      if (cid && cid !== sessionStorage.getItem('companyId')) {
        sessionStorage.setItem('companyId', cid);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const cid = sessionStorage.getItem('companyId');
    if (!cid) return;
    ledgerAPI.getByCompany(cid)
      .then(r => setLedgers(Array.isArray(r.data) ? r.data : []))
      .catch(() => setLedgers([]));
    
    costCenterAPI.getByCompany(cid)
      .then(r => setCostCenters(Array.isArray(r.data) ? r.data : []))
      .catch(() => setCostCenters([]));
  }, []);

  /* ── Totals ────────────────────────────────────────────────── */
  const totalDr = useMemo(() => rows.reduce((s, r) => s + (r.type==='Dr' ? parseFloat(r.amount)||0 : 0), 0), [rows]);
  const totalCr = useMemo(() => rows.reduce((s, r) => s + (r.type==='Cr' ? parseFloat(r.amount)||0 : 0), 0), [rows]);
  const diff       = +(Math.abs(totalDr - totalCr).toFixed(2));
  const isBalanced = diff < 0.01 && totalDr > 0;
  const filledRows = rows.filter(r => r.ledgerId && parseFloat(r.amount) > 0);

  /* ── Remaining type hint ─────────────────────────────────────── */
  const balanceType = totalDr > totalCr ? 'Cr' : 'Dr';

  /* ── Row helpers ──────────────────────────────────────────── */
  const updateRow = useCallback((id, field, val) =>
    setRows(p => p.map(r => {
      if (r._id !== id) return r;
      const updated = { ...r, [field]: val };
      if (field === 'amount') {
        const newAmt = parseFloat(val) || 0;
        if (updated.allocations && updated.allocations.length > 0) {
          updated.allocations = updated.allocations.map(alloc => ({
            ...alloc,
            amount: parseFloat(((parseFloat(alloc.percentage) / 100) * newAmt).toFixed(2))
          }));
        }
      }
      return updated;
    })), []);

  const removeRow = id => {
    if (rows.length <= 2) return;
    setRows(p => p.filter(r => r._id !== id));
  };

  const addRow = () => setRows(p => [...p, newRow(balanceType, diff > 0 ? diff.toFixed(2) : '')]);

  /* ── POST ──────────────────────────────────────────────────── */
  const handlePost = async () => {
    setPostErr('');
    if (!isBalanced) return;
    const cid = sessionStorage.getItem('companyId');
    if (!cid) { setPostErr('Company session expired. Please log out and log in again.'); return; }

    setSaving(true);
    try {
      await voucherAPI.create({
        companyId: cid,
        voucherType: vType,
        date: new Date(date).toISOString(),
        narration: narration || `${vType} Entry`,
        entries: filledRows.map(r => ({
          ledgerId: r.ledgerId,
          costCenterId: r.costCenterId || null,
          allocations: r.allocations || [],
          debit:  r.type === 'Dr' ? parseFloat(r.amount) : 0,
          credit: r.type === 'Cr' ? parseFloat(r.amount) : 0,
        })),
      });
      setSaved(true);
      setTimeout(() => { if (onSaveSuccess) onSaveSuccess(); else navigate('/vouchers'); }, 900);
    } catch (err) {
      setPostErr(err.response?.data?.error || 'Server error — please check the backend.');
    } finally {
      setSaving(false);
    }
  };

  /* ── SMART GST AUTOMATION ────────────────────────────────── */
  const handleSmartGST = async () => {
    const firstRow = rows.find(r => r.ledgerId && parseFloat(r.amount) > 0);
    const cid = sessionStorage.getItem('companyId');
    if (!firstRow || !cid) { alert('Select a ledger and amount first.'); return; }

    try {
      const res = await accountingAPI.calculateGST({
        companyId: cid,
        ledgerId: firstRow.ledgerId,
        amount: parseFloat(firstRow.amount),
        rate: 18 // Standard default
      });

      if (res.data?.taxItems) {
        const newRows = res.data.taxItems.map(item => {
          // Try to find matching CGST/SGST/IGST ledger in the list
          const matchingLedger = ledgers.find(l => l.name.toUpperCase().includes(item.name));
          return {
            _id: _uid++,
            ledgerId: matchingLedger ? matchingLedger.id : '',
            type: firstRow.type === 'Dr' ? 'Dr' : 'Cr', // Same side as main entry
            amount: item.amount.toFixed(2),
            note: `Auto-GST: ${item.name} (${item.rate}%)`
          };
        });
        setRows(p => [...p, ...newRows]);
      }
    } catch (err) {
      console.error("GST Calc failed:", err);
      alert('GST Calculation failed. Ensure CGST/SGST/IGST ledgers exist.');
    }
  };

  const reset = () => { setRows([newRow('Dr'), newRow('Cr')]); setNarration(''); setRefNo(''); setPostErr(''); setSaved(false); };

  /* ─────────────────────────────────────────────────────────── */
  return (
    <div style={{ minHeight:'100vh', background:'#f8fafc' }}>

      {/* ══ HEADER ═══════════════════════════════════════════ */}
      <header style={{ background:'#fff', borderBottom:'1px solid #f1f5f9', height:58, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 32px', position:'sticky', top:0, zIndex:100, boxShadow:'0 1px 0 #f1f5f9' }}>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <button onClick={() => onCancel ? onCancel() : navigate('/vouchers')}
            style={btnGhost}>
            <ArrowLeft size={15} /> Back
          </button>
          <div style={{ width:1, height:20, background:'#e2e8f0' }} />
          <div>
            <div style={{ fontSize:15, fontWeight:900, color:'#0f172a', lineHeight:1 }}>New {vType} Voucher</div>
            <div style={{ fontSize:10, color:'#94a3b8', fontWeight:700, textTransform:'uppercase', letterSpacing:'.1em', marginTop:2 }}>Double-Entry · ISO-20022</div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {totalDr > 0 && (
            <div style={{ ...pill, background: isBalanced? '#d1fae5':'#fef3c7', color: isBalanced?'#065f46':'#92400e', border:`1px solid ${isBalanced?'#a7f3d0':'#fde68a'}` }}>
              {isBalanced ? <CheckCircle2 size={12}/> : <AlertCircle size={12}/>}
              {isBalanced ? 'BALANCED ✓' : `DIFF ₹${diff.toLocaleString('en-IN',{minimumFractionDigits:2})}`}
            </div>
          )}
          <button onClick={reset} style={btnOutline}><RefreshCw size={13}/> Reset</button>
          <button onClick={handleSmartGST} disabled={saving||saved}
            style={{ ...btnOutline, color:'#2563eb', border:'1px solid #bfdbfe', background:'#eff6ff' }}>
            <Zap size={13}/> Smart GST
          </button>
          <button onClick={handlePost} disabled={saving||saved||!isBalanced}
            style={{ ...btnPrimary, background: saved?'#059669': isBalanced?'#1e293b':'#e2e8f0', color: saved||isBalanced?'#fff':'#94a3b8', cursor: isBalanced&&!saving&&!saved?'pointer':'not-allowed', boxShadow: isBalanced&&!saved?'0 4px 14px rgba(30,41,59,.25)':'none' }}>
            {saving?<><Loader2 size={14} style={{animation:'spin 1s linear infinite'}}/> Posting…</>
             :saved?<><CheckCircle2 size={14}/> Posted!</>
                   :<><Save size={14}/> Verify & Post</>}
          </button>
        </div>
      </header>

      <div style={{ maxWidth:1020, margin:'0 auto', padding:'28px 24px', display:'flex', flexDirection:'column', gap:20 }}>

        {postErr && (
          <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:12, padding:'14px 18px', display:'flex', gap:10 }}>
            <AlertCircle size={16} style={{ color:'#dc2626', marginTop:1, flexShrink:0 }}/>
            <div><b style={{ color:'#b91c1c', fontSize:13 }}>Failed to post</b><br/><span style={{ color:'#dc2626', fontSize:12 }}>{postErr}</span></div>
          </div>
        )}

        {/* ── VOUCHER HEADER ──────────────────────────────── */}
        <div style={card}>
          <div style={cardHead}>
            <div style={{ width:32, height:32, borderRadius:9, background:'#1e293b', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <FileText size={15} color="#fff" strokeWidth={2.5}/>
            </div>
            <div>
              <div style={cardTitle}>Voucher Header</div>
              <div style={cardSub}>Transaction Metadata</div>
            </div>
          </div>
          <div style={{ padding:'20px 24px', display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
            <Field label="Voucher Type" required>
              <div style={{ position:'relative' }}>
                <select value={vType} onChange={e=>setVType(e.target.value)} style={inp}>
                  {VOUCHER_TYPES.map(t=><option key={t}>{t}</option>)}
                </select>
                <ChevronDown size={13} style={chevron}/>
              </div>
            </Field>
            <Field label="Voucher No.">
              <div style={{ ...inp, background:'#f8fafc', color:'#2563eb', fontWeight:800, display:'flex', alignItems:'center', gap:6, cursor:'default' }}>
                <Hash size={13} style={{ color:'#94a3b8' }}/>{vNo}
              </div>
            </Field>
            <Field label="Date" required>
              <div style={{ position:'relative' }}>
                <Calendar size={13} style={{ ...chevron, right:'auto', left:10 }}/>
                <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{ ...inp, paddingLeft:30 }}/>
              </div>
            </Field>
            <Field label="Reference / Bill No.">
              <input type="text" value={refNo} onChange={e=>setRefNo(e.target.value)} placeholder="e.g. INV-001" style={inp}/>
            </Field>
          </div>
        </div>

        {/* ── CONTEXTUAL GUIDE BANNER ───────────────────────────────── */}
        {VOUCHER_GUIDE[vType] && (() => {
          const g = VOUCHER_GUIDE[vType];
          return (
            <div style={{
              background: g.bg,
              border: `1.5px solid ${g.border}`,
              borderRadius: 14, padding: '16px 20px',
              display: 'grid', gridTemplateColumns: 'auto 1fr 1fr 1fr',
              gap: 20, alignItems: 'start',
              transition: 'all .2s ease',
            }}>
              {/* Icon + title */}
              <div style={{ display:'flex', alignItems:'center', gap:10, paddingRight:20, borderRight:`1px solid ${g.border}` }}>
                <span style={{ fontSize:22 }}>{g.emoji}</span>
                <div>
                  <div style={{ fontSize:11, fontWeight:900, color:g.color, textTransform:'uppercase', letterSpacing:'.08em' }}>{vType}</div>
                  <div style={{ fontSize:13, fontWeight:800, color:g.color, marginTop:1 }}>{g.title}</div>
                  <div style={{ fontSize:11, color:g.color, opacity:.75, marginTop:2, fontWeight:500 }}>{g.tip}</div>
                </div>
              </div>
              {/* Dr side */}
              <div>
                <div style={{ fontSize:9, fontWeight:900, color:g.color, textTransform:'uppercase', letterSpacing:'.12em', opacity:.65, marginBottom:4 }}>✦ Debit (Dr)</div>
                <div style={{ fontSize:12, fontWeight:700, color:g.color }}>{g.debit}</div>
              </div>
              {/* Cr side */}
              <div>
                <div style={{ fontSize:9, fontWeight:900, color:g.color, textTransform:'uppercase', letterSpacing:'.12em', opacity:.65, marginBottom:4 }}>✦ Credit (Cr)</div>
                <div style={{ fontSize:12, fontWeight:700, color:g.color }}>{g.credit}</div>
              </div>
              {/* Examples */}
              <div>
                <div style={{ fontSize:9, fontWeight:900, color:g.color, textTransform:'uppercase', letterSpacing:'.12em', opacity:.65, marginBottom:4 }}>✦ Examples</div>
                <div style={{ fontSize:11, fontWeight:600, color:g.color, opacity:.85, lineHeight:1.5 }}>{g.examples}</div>
              </div>
            </div>
          );
        })()}

        {/* ── ENTRIES ─────────────────────────────────────── */}
        <div style={card}>
          <div style={{ ...cardHead, justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:32, height:32, borderRadius:9, background:'#0f172a', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <TrendingUp size={15} color="#fff" strokeWidth={2.5}/>
              </div>
              <div>
                <div style={cardTitle}>Accounting Entries</div>
                <div style={cardSub}>Select ledger → choose Dr or Cr → enter amount · Total Dr must = Total Cr to post</div>
              </div>
            </div>
            {isBalanced && <div style={{ ...pill, background:'#d1fae5', color:'#065f46', border:'1px solid #a7f3d0' }}><CheckCircle2 size={13}/> Balanced ✓</div>}
          </div>

          {/* Column headers */}
          <div style={{ padding:'14px 24px 4px', display:'grid', gridTemplateColumns:'36px 1fr 150px 120px 150px 1fr 36px', gap:10 }}>
            {['#','Account / Ledger *','Cost Center','Dr / Cr','Amount (₹)','Line Note',''].map((h,i)=>(
              <div key={i} style={{ fontSize:10, fontWeight:800, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.1em', textAlign: i===4?'right':'left' }}>{h}</div>
            ))}
          </div>

          {/* Rows */}
          <div style={{ padding:'4px 24px 8px' }}>
            {rows.map((row, idx) => (
              <div key={row._id} style={{
                display:'grid', gridTemplateColumns:'36px 1fr 150px 120px 150px 1fr 36px',
                gap:10, alignItems:'center',
                padding:'8px 10px', borderRadius:10, marginBottom:5,
                background: row.type==='Dr' ? '#f0fdf4' : '#fff7ed',
                border: `1.5px solid ${row.type==='Dr'?'#bbf7d0':'#fed7aa'}`,
                transition:'all .15s',
              }}>
                {/* # */}
                <div style={{ width:28, height:28, borderRadius:7, background:'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:'#64748b' }}>{idx+1}</div>

                {/* Ledger select */}
                <div style={{ position:'relative' }}>
                  <select value={row.ledgerId} onChange={e=>updateRow(row._id,'ledgerId',e.target.value)}
                    style={{ ...rowInp, borderColor: row.ledgerId?'#e2e8f0':'#fca5a5', background: row.ledgerId?'#fff':'#fff7f7' }}>
                    <option value="">← Select account</option>
                    {ledgers.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                  <ChevronDown size={11} style={{ ...chevron }}/>
                </div>

                {/* Cost Center Allocation Tagging */}
                <div style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (!row.ledgerId) {
                        alert('Please select an Account/Ledger first.');
                        return;
                      }
                      if (!row.amount || parseFloat(row.amount) <= 0) {
                        alert('Please enter a positive amount first.');
                        return;
                      }
                      setActiveRowId(row._id);
                    }}
                    style={{
                      ...rowInp,
                      fontSize: 11,
                      color: (row.allocations && row.allocations.length > 0) ? '#2563eb' : '#64748b',
                      background: (row.allocations && row.allocations.length > 0) ? '#eff6ff' : '#fff',
                      border: (row.allocations && row.allocations.length > 0) ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      fontWeight: 700
                    }}
                  >
                    {(row.allocations && row.allocations.length > 0) ? (
                      `Tag: ${row.allocations.length} CC`
                    ) : (
                      '🏷️ Tag Centers'
                    )}
                  </button>
                </div>

                {/* Dr / Cr toggle */}
                <div style={{ display:'flex', borderRadius:8, overflow:'hidden', border:'1.5px solid #e2e8f0', height:36 }}>
                  {['Dr','Cr'].map(t=>(
                    <button key={t} onClick={()=>updateRow(row._id,'type',t)} style={{
                      flex:1, border:'none', cursor:'pointer', fontWeight:800, fontSize:12, letterSpacing:'.04em',
                      background: row.type===t ? (t==='Dr'?'#059669':'#dc2626') : '#f8fafc',
                      color: row.type===t ? '#fff' : '#94a3b8',
                      display:'flex', alignItems:'center', justifyContent:'center', gap:3, transition:'all .15s',
                    }}>
                      {t==='Dr'?<TrendingUp size={11}/>:<TrendingDown size={11}/>} {t}
                    </button>
                  ))}
                </div>

                {/* Amount */}
                <div style={{ position:'relative' }}>
                  <span style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', fontSize:12, fontWeight:700, color:'#94a3b8', userSelect:'none' }}>₹</span>
                  <input type="number" min="0" step="0.01" value={row.amount}
                    onChange={e=>updateRow(row._id,'amount',e.target.value)} placeholder="0.00"
                    style={{ ...rowInp, paddingLeft:24, textAlign:'right', fontWeight:800, fontSize:14,
                      color: row.type==='Dr'?'#059669':'#dc2626',
                      borderColor: parseFloat(row.amount)>0 ? (row.type==='Dr'?'#86efac':'#fca5a5') : '#e2e8f0' }} />
                </div>

                {/* Note */}
                <input type="text" value={row.note} onChange={e=>updateRow(row._id,'note',e.target.value)}
                  placeholder="Optional note…" style={{ ...rowInp, color:'#64748b', fontSize:12 }}/>

                {/* Delete */}
                <button onClick={()=>removeRow(row._id)} disabled={rows.length<=2}
                  style={{ width:28, height:28, borderRadius:6, border:'none', background:'transparent', cursor: rows.length<=2?'not-allowed':'pointer', color:'#cbd5e1', display:'flex', alignItems:'center', justifyContent:'center', transition:'color .15s' }}
                  onMouseEnter={e=>{ if(rows.length>2) e.currentTarget.style.cssText += 'background:#fee2e2;color:#dc2626;'; }}
                  onMouseLeave={e=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#cbd5e1'; }}>
                  <Trash2 size={13}/>
                </button>
              </div>
            ))}
          </div>

          {/* ── BALANCE NEEDED BANNER ────────────────────────── */}
          {!isBalanced && totalDr > 0 && (
            <div style={{
              margin:'0 24px 16px',
              background:'linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%)',
              borderRadius:12, padding:'16px 20px',
              display:'flex', alignItems:'center', justifyContent:'space-between', gap:16,
              boxShadow:'0 4px 16px rgba(37,99,235,.25)',
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <Zap size={20} color="#fbbf24" strokeWidth={2.5}/>
                <div>
                  <div style={{ color:'#fff', fontWeight:800, fontSize:14 }}>
                    Add a <span style={{ color:'#fbbf24' }}>
                      {balanceType === 'Cr' ? 'CREDIT' : 'DEBIT'}
                    </span> of <span style={{ color:'#fbbf24' }}>
                      ₹{diff.toLocaleString('en-IN',{minimumFractionDigits:2})}
                    </span> to balance this entry
                  </div>
                  <div style={{ color:'rgba(255,255,255,.7)', fontSize:12, marginTop:2 }}>
                    Current Dr: ₹{totalDr.toFixed(2)} · Current Cr: ₹{totalCr.toFixed(2)} · Difference: ₹{diff.toFixed(2)}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setRows(p => [...p, newRow(balanceType, diff.toFixed(2))])}
                style={{
                  padding:'10px 18px', borderRadius:9, border:'2px solid #fbbf24',
                  background:'#fbbf24', color:'#1e293b', fontWeight:800, fontSize:13,
                  cursor:'pointer', display:'flex', alignItems:'center', gap:7,
                  flexShrink:0, whiteSpace:'nowrap', transition:'all .15s',
                  boxShadow:'0 2px 8px rgba(251,191,36,.4)',
                }}
                onMouseEnter={e=>{ e.currentTarget.style.background='#f59e0b'; }}
                onMouseLeave={e=>{ e.currentTarget.style.background='#fbbf24'; }}
              >
                <Zap size={15}/> Add Balancing {balanceType} Row
              </button>
            </div>
          )}

          {/* Add line button */}
          <div style={{ padding:'0 24px 20px' }}>
            <button onClick={addRow} style={{
              width:'100%', padding:'10px', borderRadius:10, border:'1.5px dashed #bfdbfe',
              background:'#eff6ff', cursor:'pointer', color:'#2563eb', fontSize:12, fontWeight:700,
              display:'flex', alignItems:'center', justifyContent:'center', gap:6, transition:'all .15s',
            }}
            onMouseEnter={e=>{ e.currentTarget.style.background='#dbeafe'; }}
            onMouseLeave={e=>{ e.currentTarget.style.background='#eff6ff'; }}>
              <Plus size={14}/> Add Another Line
            </button>
          </div>

          {/* Totals */}
          <div style={{
            margin:'0 24px 20px', borderRadius:12, padding:'16px 20px',
            border:`2px solid ${isBalanced?'#a7f3d0':'#f1f5f9'}`,
            background: isBalanced?'#f0fdf4':'#f8fafc',
            display:'grid', gridTemplateColumns:'1fr 1fr 1fr auto',
            alignItems:'center', gap:16, transition:'all .3s',
          }}>
            <div>
              <div style={{ fontSize:9, fontWeight:800, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:3 }}>Total Debit</div>
              <div style={{ fontSize:22, fontWeight:900, color:'#059669' }}>₹ {totalDr.toLocaleString('en-IN',{minimumFractionDigits:2})}</div>
            </div>
            <div>
              <div style={{ fontSize:9, fontWeight:800, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:3 }}>Total Credit</div>
              <div style={{ fontSize:22, fontWeight:900, color:'#dc2626' }}>₹ {totalCr.toLocaleString('en-IN',{minimumFractionDigits:2})}</div>
            </div>
            <div>
              <div style={{ fontSize:9, fontWeight:800, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:3 }}>Difference</div>
              <div style={{ fontSize:22, fontWeight:900, color: isBalanced?'#059669':'#f59e0b' }}>
                ₹ {diff.toLocaleString('en-IN',{minimumFractionDigits:2})}
              </div>
            </div>
            <div style={{
              padding:'10px 18px', borderRadius:10, fontWeight:800, fontSize:13,
              background: isBalanced?'#059669': totalDr>0?'#f59e0b':'#94a3b8',
              color:'#fff', whiteSpace:'nowrap',
            }}>
              {isBalanced?'✓ Ready to Post': totalDr>0?'Not Balanced':'Awaiting input'}
            </div>
          </div>
        </div>

        {/* ── NARRATION ───────────────────────────────────── */}
        <div style={{ ...card, padding:'20px 24px' }}>
          <div style={{ fontSize:13, fontWeight:800, color:'#1e293b', marginBottom:10, display:'flex', alignItems:'center', gap:7 }}>
            <AlignLeft size={14} style={{ color:'#94a3b8' }}/> Transaction Narration
          </div>
          <textarea value={narration} onChange={e=>setNarration(e.target.value)} rows={3}
            placeholder="e.g. Being the amount paid to ABC Suppliers against Invoice No. INV-001 dated 25-03-2026 via NEFT…"
            style={{ width:'100%', border:'1px solid #e2e8f0', borderRadius:10, padding:'12px 14px', fontSize:13, color:'#1e293b', resize:'none', outline:'none', fontFamily:'inherit', transition:'border-color .15s' }}
            onFocus={e=>{ e.target.style.borderColor='#2563eb'; }}
            onBlur={e=>{ e.target.style.borderColor='#e2e8f0'; }}/>
          <div style={{ fontSize:10, color:'#94a3b8', marginTop:5, fontWeight:600 }}>{narration.length}/500 characters</div>
        </div>

        {/* ── BOTTOM ACTION BAR ────────────────────────────── */}
        <div style={{ ...card, padding:'18px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:14 }}>
          <div style={{ display:'flex', alignItems:'center', gap:20 }}>
            <Stat label="Total Debit"   value={`₹ ${totalDr.toLocaleString('en-IN',{minimumFractionDigits:2})}`} color="#059669"/>
            <div style={{ width:1, height:40, background:'#f1f5f9' }}/>
            <Stat label="Total Credit" value={`₹ ${totalCr.toLocaleString('en-IN',{minimumFractionDigits:2})}`} color="#dc2626"/>
            <div style={{ width:1, height:40, background:'#f1f5f9' }}/>
            <div style={{ padding:'8px 14px', borderRadius:9, fontWeight:800, fontSize:13,
              background: isBalanced?'#d1fae5': totalDr>0?'#fef3c7':'#f1f5f9',
              color: isBalanced?'#065f46': totalDr>0?'#92400e':'#94a3b8' }}>
              {isBalanced?'✓ Balanced — Click Post':'⚠ Make Dr = Cr to Post'}
            </div>
          </div>
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            <button onClick={()=>{ if(onCancel) onCancel(); else navigate('/vouchers'); }} style={btnOutline}>Cancel</button>
            <button onClick={handlePost} disabled={saving||saved||!isBalanced}
              style={{ ...btnPrimary, background: saved?'#059669': isBalanced?'#1e293b':'#e2e8f0', color: saved||isBalanced?'#fff':'#94a3b8', cursor: isBalanced&&!saving&&!saved?'pointer':'not-allowed', boxShadow: isBalanced&&!saved?'0 6px 20px rgba(30,41,59,.3)':'none', transform: isBalanced?'translateY(0)':'none' }}>
              {saving?<><Loader2 size={15} style={{animation:'spin 1s linear infinite'}}/> Posting…</>
               :saved?<><CheckCircle2 size={15}/> Posted!</>
                     :<><Save size={15}/> Verify & Post Entry</>}
            </button>
          </div>
        </div>

      </div>

      {activeRowId && (() => {
        const activeRow = rows.find(r => r._id === activeRowId);
        if (!activeRow) return null;
        const activeLedger = ledgers.find(l => l.id === activeRow.ledgerId);
        const ledgerName = activeLedger ? activeLedger.name : 'Unknown Account';
        const lineAmt = parseFloat(activeRow.amount) || 0;
        
        return (
          <CostCenterAllocationModal
            isOpen={true}
            onClose={() => setActiveRowId(null)}
            ledgerName={ledgerName}
            lineAmount={lineAmt}
            costCenters={costCenters}
            initialAllocations={activeRow.allocations || []}
            onSave={(allocationsList) => {
              setRows(p => p.map(r => r._id === activeRowId ? { ...r, allocations: allocationsList } : r));
            }}
          />
        );
      })()}
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────────── */
const Field = ({ label, required, children }) => (
  <div>
    <label style={{ display:'block', fontSize:10, fontWeight:800, color:'#64748b', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:6 }}>
      {label}{required && <span style={{ color:'#ef4444' }}> *</span>}
    </label>
    {children}
  </div>
);

const Stat = ({ label, value, color }) => (
  <div>
    <div style={{ fontSize:9, fontWeight:800, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:3 }}>{label}</div>
    <div style={{ fontSize:20, fontWeight:900, color }}>{value}</div>
  </div>
);

/* ── Style tokens ───────────────────────────────────────────────── */
const card    = { background:'#fff', borderRadius:16, border:'1px solid #f1f5f9', boxShadow:'0 1px 6px rgba(0,0,0,.05)', overflow:'hidden' };
const cardHead = { padding:'14px 24px', borderBottom:'1px solid #f8fafc', background:'#fafafa', display:'flex', alignItems:'center', gap:10 };
const cardTitle = { fontSize:13, fontWeight:800, color:'#1e293b' };
const cardSub   = { fontSize:11, color:'#94a3b8', fontWeight:600, marginTop:1 };
const pill      = { padding:'5px 12px', borderRadius:999, fontSize:11, fontWeight:800, display:'flex', alignItems:'center', gap:5 };
const chevron   = { position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', color:'#94a3b8', pointerEvents:'none' };
const inp       = { width:'100%', border:'1px solid #e2e8f0', borderRadius:9, padding:'10px 12px', fontSize:13, fontWeight:700, color:'#1e293b', background:'#fff', outline:'none', fontFamily:'inherit', appearance:'none', transition:'border-color .15s' };
const rowInp    = { width:'100%', border:'1px solid #e2e8f0', borderRadius:8, padding:'8px 10px', fontSize:13, fontWeight:600, color:'#1e293b', background:'#fff', outline:'none', fontFamily:'inherit', appearance:'none', height:36, transition:'border-color .15s' };
const btnGhost  = { display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer', color:'#64748b', fontSize:13, fontWeight:700, padding:'6px 10px', borderRadius:8, fontFamily:'inherit' };
const btnOutline = { display:'flex', alignItems:'center', gap:6, padding:'9px 18px', borderRadius:9, border:'1px solid #e2e8f0', background:'#fff', cursor:'pointer', fontSize:13, fontWeight:700, color:'#64748b', fontFamily:'inherit', transition:'all .15s' };
const btnPrimary = { display:'flex', alignItems:'center', gap:7, padding:'10px 24px', borderRadius:10, border:'none', fontSize:13, fontWeight:800, fontFamily:'inherit', transition:'all .18s', letterSpacing:'-.01em' };
