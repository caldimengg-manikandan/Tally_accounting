import React, { useState } from 'react';
import { 
  Building2, Mail, Lock, LogIn, ChevronRight, 
  ShieldCheck, ArrowRight, Play, Globe, Zap,
  UserPlus, User, Check
} from 'lucide-react';
import { login, register } from '../../services/api';

const AuthPage = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(false); // Start with signup as per screenshot
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('ADMIN');
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
      setError(err.response?.data?.error || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EAF5FF] flex items-center justify-center font-['Inter',sans-serif] p-6">
      
      <div className="max-w-[1100px] w-full flex flex-col lg:flex-row items-center gap-10 lg:gap-20">
        
        {/* ─── LEFT SIDE: HERO ─────────────────────────────────── */}
        <div className="w-full lg:w-1/2 space-y-8 animate-fade-up">
          <div className="flex items-center gap-2 mb-10">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <Building2 size={24} strokeWidth={2.5}/>
            </div>
            <span className="text-2xl font-bold text-slate-800 tracking-tight">Tally Replica</span>
          </div>

          <h1 className="text-5xl lg:text-6xl font-bold text-[#1F314F] leading-[1.1] tracking-tight">
            {isLogin ? 'Welcome back to' : 'Wave hello to'} <br/>
            <span className="text-blue-600">Tally Replica!</span>
          </h1>

          <p className="text-lg text-slate-600 max-w-md leading-relaxed">
            Tally Replica is your trusted financial partner. Our platform is 
            equipped with powerful features that will take care of your 
            business finances. Welcome to the future of accounting!
          </p>

          <button className="flex items-center gap-3 text-blue-600 font-bold hover:text-blue-700 transition-colors group">
            <div className="w-8 h-8 rounded-full border-2 border-blue-600 flex items-center justify-center group-hover:bg-blue-50 transition-all">
              <Play size={14} fill="currentColor" className="ml-0.5" />
            </div>
            Watch an overview
          </button>
        </div>

        {/* ─── RIGHT SIDE: AUTH CARD ───────────────────────────── */}
        <div className="w-full lg:w-[480px] bg-white rounded-lg border-[1px] border-blue-500/50 shadow-2xl p-8 lg:p-12 relative z-10 animate-fade-in translate-y-0 hover:-translate-y-1 transition-all duration-500">
          
          <header className="mb-8">
            <h2 className="text-2xl font-bold text-[#1F314F] tracking-tight">
              {isLogin ? 'Sign in to your account' : 'Start with your free account today!'}
            </h2>
            <p className="text-xs text-slate-400 mt-2 font-medium italic">
               All fields are mandatory*
            </p>
          </header>

          {error && (
            <div className={`mb-6 p-3 rounded-md text-[11px] font-bold border ${error.includes('successfully') ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-600'}`}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 ml-1">
                   <User size={12} className="text-slate-400"/> Full Name
                </label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 bg-[#F5F8FA] border border-slate-200 rounded-md text-sm outline-none focus:border-blue-400 focus:bg-white transition-all font-medium"
                  required
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 ml-1">
                <Mail size={12} className="text-slate-400"/> Email address
              </label>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-3 bg-[#F5F8FA] border border-slate-200 rounded-md text-sm outline-none focus:border-blue-400 focus:bg-white transition-all font-medium"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 ml-1">
                <Lock size={12} className="text-slate-400"/> Password
              </label>
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-[#F5F8FA] border border-slate-200 rounded-md text-sm outline-none focus:border-blue-400 focus:bg-white transition-all font-medium"
                required
              />
            </div>

            {!isLogin && (
               <div className="flex items-center gap-2 py-2">
                 <div className="w-5 h-5 rounded border border-blue-500 bg-blue-500 flex items-center justify-center text-white shrink-0 cursor-pointer">
                    <Check size={12} strokeWidth={4}/>
                 </div>
                 <p className="text-[11px] text-slate-500 font-medium">
                   I agree to the <span className="text-blue-600 underline cursor-pointer">Terms of Service</span> and <span className="text-blue-600 underline cursor-pointer">Privacy Policy</span>.
                 </p>
               </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 bg-[#F15A29] text-white rounded-md font-bold text-sm tracking-wide shadow-lg shadow-orange-200/50 hover:bg-[#D94F25] transition-all disabled:opacity-50"
            >
              {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create my account')}
            </button>
          </form>

          <div className="mt-8 text-center space-y-4">
             <p className="text-[11px] font-medium text-slate-400 italic font-mono">*No credit card required</p>
             <p className="text-xs font-semibold text-slate-700">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button 
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-blue-600 hover:underline"
                >
                  {isLogin ? 'Sign Up' : 'Log In'}
                </button>
             </p>
          </div>

          <p className="mt-10 text-[9px] text-center text-slate-300 font-bold uppercase tracking-[0.1em]">
            *This offer is applicable only for Tally Replica users
          </p>
        </div>

      </div>

    </div>
  );
};

export default AuthPage;
