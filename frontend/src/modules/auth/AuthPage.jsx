import React, { useState } from 'react';
import { 
  Building2, Mail, Lock, LogIn, ChevronRight, 
  ShieldCheck, ArrowRight, Activity, Globe, Zap,
  UserPlus
} from 'lucide-react';
import { login, register } from '../../services/api';

const AuthPage = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // Only for signup
  const [role, setRole] = useState('ADMIN'); // NEW: RBAC Support
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isLogin) {
        const res = await login(email, password);
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        if (res.data.companies && res.data.companies.length > 0) {
          localStorage.setItem('companyId', res.data.companies[0].id);
        }
        onLogin();
      } else {
        await register(name, email, password, role);
        setError('Account created successfully. Please login.');
        setIsLogin(true);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-[Inter]">
      
      {/* ─── LEFT: BRAND & VITALS ─────────────────────────────── */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 p-20 flex-col justify-between relative overflow-hidden">
         <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-[-10%] right-[-10%] w-[80%] h-[80%] bg-blue-500 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-500 rounded-full blur-[100px]"></div>
         </div>

         <div className="relative z-10 space-y-8">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-2xl">
                  <Building2 size={24} className="text-slate-900" strokeWidth={2.5}/>
               </div>
               <div className="leading-tight text-white">
                  <div className="text-xl font-black tracking-tighter">TALLY REPLICA</div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Enterprise Ledger Hub</div>
               </div>
            </div>

            <div className="space-y-12 pt-20">
               <h1 className="text-5xl font-black text-white tracking-tighter leading-[0.9]">
                  Architect your <br/> 
                  <span className="text-blue-500">commercial future.</span>
               </h1>
               
               <div className="space-y-6">
                  <FeatureItem 
                    icon={<ShieldCheck size={18}/>} 
                    title="Immutable Audit Trails" 
                    desc="Every transaction is cryptographically indexed for total transparency." 
                  />
                  <FeatureItem 
                    icon={<Zap size={18}/>} 
                    title="Real-time Synchronization" 
                    desc="Automated reconciliation across multi-node clusters in milliseconds." 
                  />
                  <FeatureItem 
                    icon={<Globe size={18}/>} 
                    title="Multi-Entity Control" 
                    desc="Manage global operations from a single high-fidelity terminal." 
                  />
               </div>
            </div>
         </div>

         <div className="relative z-10 flex items-center gap-6 text-slate-500">
            <div className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
               <Activity size={14}/> Systems Live
            </div>
            <div className="w-px h-3 bg-slate-800"></div>
            <div className="text-[10px] font-black uppercase tracking-widest">© 2026 TallyReplica v2.5.0</div>
         </div>
      </div>

      {/* ─── RIGHT: AUTH TERMINAL ────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-10 bg-white lg:rounded-l-[3rem] relative z-20 shadow-[-40px_0_80px_-20px_rgba(0,0,0,0.1)]">
         <div className="w-full max-w-md space-y-10 py-10">
            
            <header className="space-y-4">
               <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">
                  {isLogin ? 'Initialize Access' : 'Onboard Node'}
               </h2>
               
               {/* ─── TAB SWITCHER ─────────────────────────────── */}
               <div className="flex p-1.5 bg-slate-100 rounded-2xl w-fit">
                  <button 
                    type="button"
                    onClick={() => setIsLogin(true)}
                    className={`px-8 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all
                      ${isLogin ? 'bg-white text-slate-900 shadow-xl shadow-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    SIGN IN
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsLogin(false)}
                    className={`px-8 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all
                      ${!isLogin ? 'bg-white text-slate-900 shadow-xl shadow-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    SIGN UP
                  </button>
               </div>
            </header>

            {error && (
               <div className={`p-4 rounded-2xl flex items-start gap-3 animate-shake border
                  ${error.includes('successfully') ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5
                     ${error.includes('successfully') ? 'bg-emerald-100' : 'bg-red-100'}`}>
                     <Lock size={12}/>
                  </div>
                  <p className="text-[11px] font-bold leading-tight">{error}</p>
               </div>
            )}

            {/* ══ GOOGLE AUTH TERMINAL ═════════════════════════════════ */}
            {isLogin && (
               <>
                  <button 
                     type="button"
                     onClick={() => window.location.href = 'http://localhost:5000/api/auth/google'}
                     className="w-full flex items-center justify-center gap-3 py-4 border border-slate-100 rounded-2xl bg-white hover:bg-slate-50 transition-all font-black text-[11px] uppercase tracking-[0.2em] text-slate-900 shadow-sm"
                  >
                     <Globe size={16} className="text-blue-500" />
                     Sign In with Cloud Workspace
                  </button>

                  <div className="flex items-center gap-4 py-2">
                     <div className="flex-1 h-px bg-slate-50"></div>
                     <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest text-center">or direct entry</span>
                     <div className="flex-1 h-px bg-slate-50"></div>
                  </div>
               </>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
               <div className="space-y-5">
                  {!isLogin && (
                     <>
                        <div className="space-y-2 animate-fade-down">
                           <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                              <UserPlus size={12}/> Authorized Full Name
                           </label>
                           <input 
                              type="text" 
                              required 
                              value={name}
                              onChange={e => setName(e.target.value)}
                              placeholder="Alexander Hamilton"
                              className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-slate-900 text-sm outline-none focus:border-blue-500/30 focus:bg-white transition-all shadow-sm"
                           />
                        </div>

                        <div className="space-y-2 animate-fade-down">
                           <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                              <ShieldCheck size={12}/> Systematic Role
                           </label>
                           <select 
                              value={role}
                              onChange={e => setRole(e.target.value)}
                              className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-slate-900 text-sm outline-none focus:border-blue-500/30 focus:bg-white transition-all shadow-sm appearance-none"
                           >
                              <option value="ADMIN">ADMIN (Full Access)</option>
                              <option value="MANAGER">MANAGER (High Level)</option>
                              <option value="ACCOUNTANT">ACCOUNTANT (Financials)</option>
                              <option value="AUDITOR">AUDITOR (Read + Audit)</option>
                              <option value="DATA_ENTRY">DATA ENTRY (Vouchers Only)</option>
                              <option value="VIEWER">VIEWER (Read Only)</option>
                           </select>
                        </div>
                     </>
                  )}

                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <Mail size={12}/> Primary Access Identity
                     </label>
                     <input 
                       type="email" 
                       required 
                       value={email}
                       onChange={e => setEmail(e.target.value)}
                       placeholder="identity@enterprise.com"
                       className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-slate-900 text-sm outline-none focus:border-blue-500/30 focus:bg-white transition-all shadow-sm"
                     />
                  </div>

                  <div className="space-y-2">
                     <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                           <Lock size={12}/> Verification Key
                        </label>
                        {isLogin && <button type="button" className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700">Lost Key?</button>}
                     </div>
                     <input 
                       type="password" 
                       required 
                       value={password}
                       onChange={e => setPassword(e.target.value)}
                       placeholder="••••••••"
                       className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-slate-900 text-sm outline-none focus:border-blue-500/30 focus:bg-white transition-all shadow-sm"
                     />
                  </div>
               </div>

               <button 
                 type="submit" 
                 disabled={loading}
                 className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-2xl shadow-slate-900/40 hover:-translate-y-1 transition-all active:translate-y-0 disabled:opacity-50"
               >
                  {loading ? 'VALIDATING...' : (isLogin ? <>INITIALIZE TERMINAL ACCESS <ArrowRight size={16}/></> : <>REGISTER IDENTITY PORTFOLIO <ArrowRight size={16}/></>)}
               </button>
            </form>

            <footer className="pt-10 border-t border-slate-100 text-center animate-fade-in">
               <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">
                  Secure Enterprise Gateway v2.5.0
               </p>
            </footer>
         </div>
      </div>
    </div>
  );
};

const FeatureItem = ({ icon, title, desc }) => (
   <div className="flex items-start gap-4 group">
      <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-blue-500 border border-white/10 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
         {icon}
      </div>
      <div className="space-y-1">
         <h4 className="text-[13px] font-black text-white tracking-tight">{title}</h4>
         <p className="text-xs font-medium text-slate-500 leading-snug">{desc}</p>
      </div>
   </div>
);

export default AuthPage;
