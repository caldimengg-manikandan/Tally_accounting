import React, { useState } from 'react';
import { 
  Building2, Mail, Lock, LogIn, ChevronRight, 
  ShieldCheck, ArrowRight, Play, Globe, Zap,
  UserPlus, User, Check
} from 'lucide-react';
import { login, register, googleLogin } from '../../services/api';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { setUser } from '../../stores/authStore';

const AuthPage = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(false); // Start with signup as per screenshot
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('ADMIN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isLogin) {
        const res = await login(email, password);
        setUser(res.data.user);
        if (res.data.companies && res.data.companies.length > 0) {
          sessionStorage.setItem('companyId', res.data.companies[0].id);
        } else {
          sessionStorage.removeItem('companyId');
          sessionStorage.removeItem('companyName');
        }
        onLogin();
      } else {
        await register(name, email, password, role);
        setError('Account created successfully. Please login.');
        setIsLogin(true);
      }
    } catch (err) {
      if (err.response?.data?.issues && Array.isArray(err.response.data.issues)) {
        setError(`Password does not meet requirements: ${err.response.data.issues.join(', ')}`);
      } else {
        setError(err.response?.data?.error || err.message || 'Authentication failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError('');
    try {
      const res = await googleLogin(credentialResponse.credential);
      setUser(res.data.user);
      if (res.data.companies && res.data.companies.length > 0) {
        sessionStorage.setItem('companyId', res.data.companies[0].id);
      } else {
        sessionStorage.removeItem('companyId');
        sessionStorage.removeItem('companyName');
      }
      onLogin();
    } catch (err) {
      setError(err.response?.data?.error || 'Google Authentication failed.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || '18346618646-9hvt5qujf46md3inhb0l72pgt74fu9gh.apps.googleusercontent.com'}>
      <div className="min-h-screen bg-[#EAF5FF] flex items-center justify-center font-['Inter',sans-serif] p-6">
      
      <div className="max-w-[1100px] w-full flex flex-col lg:flex-row items-center gap-10 lg:gap-20">
        
        {/* ─── LEFT SIDE: HERO ─────────────────────────────────── */}
        <div className="w-full lg:w-1/2 space-y-8 animate-fade-up">
          <div className="flex items-center gap-2 mb-10">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <Building2 size={24} strokeWidth={2.5}/>
            </div>
            <span className="text-2xl font-bold text-slate-800 tracking-tight">CalTally</span>
          </div>

          <h1 className="text-5xl lg:text-6xl font-bold text-[#1F314F] leading-[1.1] tracking-tight">
            {isLogin ? 'Welcome back to' : 'Wave hello to'} <br/>
            <span className="text-blue-600">CalTally!</span>
          </h1>

          <p className="text-lg text-slate-600 max-w-md leading-relaxed">
            CalTally is your trusted financial partner. Our platform is 
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
              {!isLogin && (
                <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-md text-[11px] space-y-1.5 animate-fade-in">
                  <p className="font-bold text-slate-700">Password must contain:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-1">
                    <div className={`flex items-center gap-1.5 ${password.length >= 8 ? 'text-green-600 font-semibold' : 'text-slate-400'}`}>
                      {password.length >= 8 ? <Check size={12} className="shrink-0" strokeWidth={3} /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-300 ml-1 mr-1 shrink-0" />}
                      At least 8 characters
                    </div>
                    <div className={`flex items-center gap-1.5 ${/[a-z]/.test(password) ? 'text-green-600 font-semibold' : 'text-slate-400'}`}>
                      {/[a-z]/.test(password) ? <Check size={12} className="shrink-0" strokeWidth={3} /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-300 ml-1 mr-1 shrink-0" />}
                      One lowercase letter
                    </div>
                    <div className={`flex items-center gap-1.5 ${/[A-Z]/.test(password) ? 'text-green-600 font-semibold' : 'text-slate-400'}`}>
                      {/[A-Z]/.test(password) ? <Check size={12} className="shrink-0" strokeWidth={3} /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-300 ml-1 mr-1 shrink-0" />}
                      One uppercase letter
                    </div>
                    <div className={`flex items-center gap-1.5 ${/[0-9]/.test(password) ? 'text-green-600 font-semibold' : 'text-slate-400'}`}>
                      {/[0-9]/.test(password) ? <Check size={12} className="shrink-0" strokeWidth={3} /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-300 ml-1 mr-1 shrink-0" />}
                      One numeric digit
                    </div>
                    <div className={`flex items-center gap-1.5 ${/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'text-green-600 font-semibold' : 'text-slate-400'}`}>
                      {/[!@#$%^&*(),.?":{}|<>]/.test(password) ? <Check size={12} className="shrink-0" strokeWidth={3} /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-300 ml-1 mr-1 shrink-0" />}
                      One special character
                    </div>
                  </div>
                </div>
              )}
            </div>

            {!isLogin && (
               <div className="flex items-center gap-2 py-2">
                 <div className="w-5 h-5 rounded border border-blue-500 bg-blue-500 flex items-center justify-center text-white shrink-0 cursor-pointer">
                    <Check size={12} strokeWidth={4}/>
                 </div>
                 <p className="text-[11px] text-slate-500 font-medium">
                   I agree to the <span onClick={() => setShowTermsModal(true)} className="text-blue-600 underline cursor-pointer hover:text-blue-700">Terms of Service</span> and <span onClick={() => setShowPrivacyModal(true)} className="text-blue-600 underline cursor-pointer hover:text-blue-700">Privacy Policy</span>.
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

          <div className="mt-6 flex items-center justify-between">
            <span className="w-1/5 border-b border-slate-200 lg:w-1/4"></span>
            <span className="text-xs text-center text-slate-500 font-medium uppercase tracking-widest">or</span>
            <span className="w-1/5 border-b border-slate-200 lg:w-1/4"></span>
          </div>

          <div className="mt-6 flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google Login Failed')}
              useOneTap
              theme="outline"
              size="large"
              shape="rectangular"
              width="100%"
            />
          </div>

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
            *This offer is applicable only for CalTally users
          </p>
      </div>

      {/* ─── TERMS OF SERVICE MODAL ───────────────────────── */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl border border-slate-200 relative animate-scale-up">
            <h3 className="text-lg font-bold text-[#1F314F] border-b pb-3 mb-4">Terms of Service</h3>
            <div className="text-xs text-slate-600 space-y-4 max-h-[300px] overflow-y-auto pr-2">
              <p className="font-semibold">1. Acceptance of Terms</p>
              <p>Welcome to CalTally. By creating an account, you agree to be bound by these Terms of Service. If you do not agree, please do not use our services.</p>
              
              <p className="font-semibold">2. Account Registration</p>
              <p>You must provide accurate and complete information when registering. You are solely responsible for maintaining the confidentiality of your credentials (including passwords and multi-factor authentication secrets).</p>
              
              <p className="font-semibold">3. Permitted Use</p>
              <p>CalTally is provided for financial tracking and cloud accounting replication. You agree not to misuse the platform or conduct any unauthorized activities that could disrupt server security.</p>
              
              <p className="font-semibold">4. Limitation of Liability</p>
              <p>The application is provided "as is". CalTally and its developers make no warranties and shall not be held liable for any data loss, financial discrepancy, or server unavailability.</p>
            </div>
            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setShowTermsModal(false)}
                className="px-5 py-2 bg-[#F15A29] hover:bg-[#D94F25] text-white rounded font-bold text-xs shadow-md transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── PRIVACY POLICY MODAL ─────────────────────────── */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl border border-slate-200 relative animate-scale-up">
            <h3 className="text-lg font-bold text-[#1F314F] border-b pb-3 mb-4">Privacy Policy</h3>
            <div className="text-xs text-slate-600 space-y-4 max-h-[300px] overflow-y-auto pr-2">
              <p className="font-semibold">1. Data Collected</p>
              <p>We collect essential registration data including your email, full name, and hashed passwords. When using Google Login, we request access to your basic profile metadata.</p>
              
              <p className="font-semibold">2. Data Security</p>
              <p>Passwords are cryptographically salted and hashed using bcrypt. We use multi-factor authentication (MFA) and strict rate limiters to protect user access from brute-force attempts.</p>
              
              <p className="font-semibold">3. Cookies & Session Storage</p>
              <p>We set secure HttpOnly cookies for session verification and JWT tokens. These are strictly required for security validation and account integrity.</p>
              
              <p className="font-semibold">4. Third-Party Sharing</p>
              <p>We do not sell, distribute, or share user data or transaction histories with any third parties.</p>
            </div>
            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setShowPrivacyModal(false)}
                className="px-5 py-2 bg-[#F15A29] hover:bg-[#D94F25] text-white rounded font-bold text-xs shadow-md transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
    </GoogleOAuthProvider>
  );
};

export default AuthPage;
