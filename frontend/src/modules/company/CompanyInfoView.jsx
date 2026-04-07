import React, { useState, useEffect } from 'react';
import { 
  Building2, Save, ArrowLeft, Calendar, 
  Phone, Mail, Hash, RefreshCcw, CheckCircle2, AlertCircle, Loader2
} from 'lucide-react';
import { companyAPI } from '../../services/api';
import { INDIAN_STATES } from '../../utils/indianStates';

const CompanyInfoView = () => {
  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(true);
  const [status, setStatus]     = useState(null); // 'success' | 'error' | null
  const [errorMsg, setErrorMsg] = useState('');
  const [existingId, setExistingId] = useState(null); // if a company already exists
  
  const [formData, setFormData] = useState({
    name: 'Indus Enterprises Private Limited',
    address: 'Sector 12, HSR Layout, Bengaluru, KA - 560102',
    phone: '+91 80 4422 9900',
    email: 'admin@indus-ent.com',
    gstNumber: '29AAAAA0000A1Z5',
    financialYearStart: '2025-04-01',
    financialYearEnd: '2026-03-31'
  });

  // On mount, check if a company already exists
  useEffect(() => {
    const savedId = localStorage.getItem('companyId');
    const loadCompany = async () => {
      setFetching(true);
      try {
        // Try loading from saved companyId first
        if (savedId) {
          try {
            const res = await companyAPI.getById(savedId);
            if (res.data?.id) {
              setExistingId(res.data.id);
              setFormData(f => ({
                ...f,
                name: res.data.name || f.name,
                address: res.data.address || f.address,
                gstNumber: res.data.gstNumber || f.gstNumber,
                financialYearStart: res.data.financialYearStart
                  ? res.data.financialYearStart.split('T')[0]
                  : f.financialYearStart,
                financialYearEnd: res.data.booksBeginningFrom
                  ? res.data.booksBeginningFrom.split('T')[0]
                  : f.financialYearEnd,
              }));
              setFetching(false);
              return;
            }
          } catch {}
        }
        // Fallback: list all companies
        const all = await companyAPI.getAll();
        if (all.data?.length > 0) {
          const c = all.data[0];
          setExistingId(c.id);
          localStorage.setItem('companyId', c.id);
          setFormData(f => ({
            ...f,
            name: c.name || f.name,
            address: c.address || f.address,
            gstNumber: c.gstNumber || f.gstNumber,
            financialYearStart: c.financialYearStart
              ? c.financialYearStart.split('T')[0]
              : f.financialYearStart,
            financialYearEnd: c.booksBeginningFrom
              ? c.booksBeginningFrom.split('T')[0]
              : f.financialYearEnd,
          }));
        }
      } catch (err) {
        console.error('Failed to load company:', err.message);
      }
      setFetching(false);
    };
    loadCompany();
  }, []);

  const handleSave = async () => {
    if (!formData.name.trim()) { setErrorMsg('Company name is required.'); setStatus('error'); return; }
    setLoading(true);
    setStatus(null);
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      const payload = {
        name: formData.name,
        address: formData.address,
        gstNumber: formData.gstNumber,
        financialYearStart: formData.financialYearStart || '2025-04-01',
        booksBeginningFrom: formData.financialYearEnd || '2026-03-31',
        userId: user?.id
      };

      let res;
      if (existingId) {
        try {
          // Update existing company
          res = await companyAPI.update(existingId, payload);
          setStatus('success');
        } catch (err) {
          // If update fails because the ID no longer exists (404), fall back to create
          if (err.response?.status === 404) {
            console.warn('Existing company ID not found in database. Falling back to creation.');
            res = await companyAPI.create(payload);
            if (res.data?.id) {
              localStorage.setItem('companyId', res.data.id);
              setExistingId(res.data.id);
              setStatus('success');
            }
          } else {
            throw err;
          }
        }
      } else {
        // Create new company
        res = await companyAPI.create(payload);
        if (res.data?.id) {
          localStorage.setItem('companyId', res.data.id);
          setExistingId(res.data.id);
          setStatus('success');
          setTimeout(() => window.location.href = '/ledgers', 1800);
        } else {
          throw new Error('Invalid response from server');
        }
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMsg(
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Network error — make sure the backend server is running on port 5000.'
      );
    }
    setLoading(false);
  };

  const field = (label, key, type = 'text', icon = null, multiline = false) => (
    <div>
      <label className="block text-[9px] font-black uppercase text-slate-400 tracking-widest mb-2">{label}</label>
      {multiline ? (
        <textarea
          className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded text-sm font-bold text-slate-800 focus:bg-white focus:border-slate-900 outline-none transition-all min-h-[90px]"
          value={formData[key] || ''}
          onChange={e => setFormData({ ...formData, [key]: e.target.value })}
        />
      ) : (
        <div className="relative">
          {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300">{icon}</span>}
          <input
            type={type}
            className={`w-full bg-slate-50 border border-slate-200 ${icon ? 'pl-9' : 'px-4'} pr-4 py-3 rounded text-sm font-bold text-slate-800 focus:bg-white focus:border-slate-900 outline-none transition-all`}
            value={formData[key] || ''}
            onChange={e => setFormData({ ...formData, [key]: e.target.value })}
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full h-full bg-[#f8fafc] flex flex-col font-sans text-slate-900 overflow-hidden min-h-[calc(100vh-2rem)]">

      {/* HEADER */}
      <header className="h-16 border-b border-slate-200 px-8 flex items-center justify-between bg-white shrink-0 z-40">
        <div className="flex items-center gap-6">
          <button onClick={() => window.location.href='/dashboard'} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-black transition-all">
            <ArrowLeft size={18} /> <span className="text-[10px] uppercase tracking-widest">Dashboard</span>
          </button>
          <div className="h-4 w-px bg-slate-200" />
          <h1 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">Company Setup</h1>
          {existingId && (
            <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest rounded border border-emerald-100">
              ✓ Saved
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          {status === 'success' && (
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">
                {existingId ? 'Company Updated!' : 'Company Created!'}
              </span>
            </div>
          )}
          {status === 'error' && (
            <div className="flex items-center gap-2 text-rose-600 max-w-sm">
              <AlertCircle size={16} className="shrink-0" />
              <span className="text-[10px] font-black leading-tight">{errorMsg}</span>
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={loading || fetching}
            className="h-10 px-8 bg-slate-900 text-white rounded font-black text-[10px] uppercase tracking-widest hover:bg-slate-700 transition-all flex items-center gap-2 shadow-lg disabled:opacity-50"
          >
            {loading ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Save size={14} /> Save Company</>}
          </button>
        </div>
      </header>

      {/* MAIN */}
      <main className="flex-1 overflow-y-auto p-10 bg-[#f8fafc]">
        {fetching ? (
          <div className="flex items-center justify-center h-40 gap-3 text-slate-400">
            <Loader2 size={24} className="animate-spin text-slate-900" />
            <span className="text-sm font-bold uppercase tracking-widest">Loading company data…</span>
          </div>
        ) : (
          <div className="max-w-[1100px] mx-auto grid grid-cols-12 gap-8">

            {/* LEFT */}
            <div className="col-span-12 lg:col-span-8 space-y-8">

              {/* Business Identity */}
              <section className="bg-white border border-slate-200 p-8 rounded-xl shadow-sm">
                <div className="flex items-center gap-3 mb-7 border-b border-slate-100 pb-5">
                  <Building2 size={18} className="text-slate-900" />
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Business Identity</h3>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2">{field('Legal Company Name *', 'name')}</div>
                  <div className="col-span-2">{field('Mailing Address', 'address', 'text', null, true)}</div>
                  <div>{field('Phone / Contact', 'phone', 'text', <Phone size={14}/>)}</div>
                  <div>{field('Corporate Email', 'email', 'email', <Mail size={14}/>)}</div>
                </div>
              </section>

              {/* Tax & Statutory */}
              <section className="bg-white border border-slate-200 p-8 rounded-xl shadow-sm">
                <div className="flex items-center gap-3 mb-7 border-b border-slate-100 pb-5">
                  <Hash size={18} className="text-slate-900" />
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Tax & Statutory Data</h3>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>{field('GSTIN / Tax ID', 'gstNumber')}</div>
                  <div>
                    <label className="block text-[9px] font-black uppercase text-slate-400 tracking-widest mb-2">PAN Number</label>
                    <input type="text" defaultValue="ABCDE1234F"
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded text-sm font-bold text-slate-800 focus:bg-white focus:border-slate-900 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase text-slate-400 tracking-widest mb-2">State</label>
                    <select 
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded text-sm font-bold text-slate-800 focus:bg-white focus:border-slate-900 outline-none appearance-none"
                      value={formData.state || ''}
                      onChange={e => setFormData({ ...formData, state: e.target.value })}
                    >
                      <option value="">Select State</option>
                      {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase text-slate-400 tracking-widest mb-2">Company Type</label>
                    <select className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded text-sm font-bold text-slate-800 focus:bg-white focus:border-slate-900 outline-none appearance-none">
                      <option>Proprietorship</option>
                      <option>Partnership</option>
                      <option>Private Limited</option>
                      <option>Public Limited</option>
                      <option>LLP</option>
                      <option>NGO / Trust</option>
                    </select>
                  </div>
                </div>
              </section>
            </div>

            {/* RIGHT: Fiscal */}
            <div className="col-span-12 lg:col-span-4">
              <section className="bg-slate-900 text-white p-8 rounded-xl shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 -rotate-45 translate-x-12 -translate-y-12" />
                <div className="flex items-center gap-3 mb-7 border-b border-white/10 pb-5">
                  <Calendar size={18} className="opacity-40" />
                  <h3 className="text-xs font-black uppercase tracking-widest opacity-60">Fiscal Settings</h3>
                </div>
                <div className="space-y-6 relative z-10">
                  <div>
                    <label className="block text-[9px] font-black uppercase text-white/30 tracking-widest mb-2">Financial Year Starts From</label>
                    <input type="date" value={formData.financialYearStart}
                      onChange={e => {
                        const start = new Date(e.target.value);
                        const end = new Date(start);
                        end.setFullYear(start.getFullYear() + 1);
                        end.setDate(start.getDate() - 1);
                        setFormData({ 
                          ...formData, 
                          financialYearStart: e.target.value,
                          financialYearEnd: end.toISOString().split('T')[0]
                        });
                      }}
                      className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded text-sm font-bold text-white outline-none focus:bg-white/10 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase text-white/30 tracking-widest mb-2">Financial Year End</label>
                    <input type="date" value={formData.financialYearEnd}
                      onChange={e => setFormData({ ...formData, financialYearEnd: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded text-sm font-bold text-white outline-none focus:bg-white/10 transition-all" />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <div className="p-3 bg-white/5 rounded border border-white/10 flex-1 text-center">
                      <span className="block text-[8px] font-black opacity-20 uppercase mb-1">Currency</span>
                      <span className="font-black text-sm">INR (₹)</span>
                    </div>
                    <div className="p-3 bg-white/5 rounded border border-white/10 flex-1 text-center">
                      <span className="block text-[8px] font-black opacity-20 uppercase mb-1">Decimals</span>
                      <span className="font-black text-sm">2</span>
                    </div>
                  </div>
                  <div className="pt-2 text-[10px] text-white/30 font-bold leading-relaxed">
                    ℹ India standard: Financial year runs April 1 → March 31
                  </div>
                </div>
              </section>
            </div>

          </div>
        )}
      </main>
    </div>
  );
};

export default CompanyInfoView;
