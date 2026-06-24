import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, ShieldCheck } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('No verification token found in the link. Please request a new verification email.');
      return;
    }

    axios.get(`${API_BASE}/users/verify-email?token=${token}`)
      .then(() => {
        setStatus('success');
        setMessage('Your email address has been updated successfully! Please log in again with your new email address.');
        setTimeout(() => navigate('/login?emailChanged=true'), 4000);
      })
      .catch(err => {
        const msg = err.response?.data?.error || 'This verification link is invalid or has expired. Please request a new one from your Profile & Security settings.';
        setStatus('error');
        setMessage(msg);
      });
  }, []);

  const isDark = document.documentElement.classList.contains('dark') ||
    localStorage.getItem('theme') === 'dark';

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-6 font-sans ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
      {/* Logo Header */}
      <div className="flex items-center gap-2 mb-8">
        <ShieldCheck size={28} className="text-blue-500" />
        <span className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
          CalTally ERP
        </span>
      </div>

      {/* Card */}
      <div className={`w-full max-w-md rounded-2xl shadow-xl p-10 text-center space-y-5 border ${
        isDark
          ? 'bg-slate-800 border-slate-700'
          : 'bg-white border-slate-200'
      }`}>
        {/* Loading State */}
        {status === 'loading' && (
          <>
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-blue-500" />
              </div>
            </div>
            <h1 className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
              Verifying your email…
            </h1>
            <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Please wait while we confirm your new email address with our servers.
            </p>
          </>
        )}

        {/* Success State */}
        {status === 'success' && (
          <>
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 size={36} className="text-emerald-500" />
              </div>
            </div>
            <h1 className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
              Email Updated Successfully!
            </h1>
            <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {message}
            </p>
            <div className={`text-xs px-4 py-2 rounded-lg inline-block ${
              isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-50 text-slate-400'
            }`}>
              Redirecting you to login in a moment…
            </div>
          </>
        )}

        {/* Error State */}
        {status === 'error' && (
          <>
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center">
                <XCircle size={36} className="text-rose-500" />
              </div>
            </div>
            <h1 className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
              Verification Failed
            </h1>
            <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {message}
            </p>
            <button
              onClick={() => navigate('/settings/company')}
              className="mt-2 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors"
            >
              Back to Settings
            </button>
          </>
        )}
      </div>

      {/* Footer note */}
      <p className={`mt-6 text-xs ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
        CalTally ERP · Secure Email Verification
      </p>
    </div>
  );
};

export default VerifyEmailPage;
