import React, { useState, useEffect } from 'react';
import { User, Lock, Shield, Eye, EyeOff, Loader2, Save, Terminal, MailCheck, Chrome } from 'lucide-react';
import useNotificationStore from '../../store/notificationStore';
import { usersAPI, authAPI } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const ProfileSettings = () => {
  const { addNotification } = useNotificationStore();
  const [saving, setSaving] = useState(false);
  const [pendingEmailSent, setPendingEmailSent] = useState(false);
  const [sendingEmailChange, setSendingEmailChange] = useState(false);
  const [isOAuthUser, setIsOAuthUser] = useState(false); // true = signed in via Google, no password yet

  // Theme & Language
  const { theme, setTheme } = useTheme();
  const [language, setLanguage] = useState('English');

  // User Profile details
  const [profile, setProfile] = useState({
    name: 'Administrator',
    email: 'admin@tally.com',
    phone: '+91 98765 43210',
    profilePic: ''
  });

  // Password details
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  // Two-Factor Authentication
  const [mfaEnabled, setMfaEnabled] = useState(false);

  useEffect(() => {
    const userStr = sessionStorage.getItem('user');
    if (userStr) {
      try {
        const userObj = JSON.parse(userStr);
        setProfile({
          name: userObj.name || 'Administrator',
          email: userObj.email || 'admin@tally.com',
          phone: userObj.phone || '+91 98765 43210',
          profilePic: userObj.profilePic || ''
        });
      } catch (e) {
        console.error(e);
      }
    }
    // Fetch oauthOnly flag from backend to adjust the password UI
    authAPI.getProfile()
      .then(res => setIsOAuthUser(!!res.data.oauthOnly))
      .catch(() => {}); // fail silently
  }, []);

  const handleProfileChange = (key, val) => {
    setProfile(prev => ({ ...prev, [key]: val }));
  };

  const handlePasswordChange = (key, val) => {
    setPasswordForm(prev => ({ ...prev, [key]: val }));
  };

  const saveProfile = async () => {
    setSaving(true);
    setTimeout(() => {
      addNotification('Personal preferences updated successfully!', 'success');
      const userStr = sessionStorage.getItem('user');
      if (userStr) {
        const userObj = JSON.parse(userStr);
        sessionStorage.setItem('user', JSON.stringify({ ...userObj, name: profile.name, phone: profile.phone }));
      }
      setSaving(false);
    }, 1000);
  };

  const handleEmailChangeRequest = async () => {
    if (!profile.email) {
      addNotification('Please enter a new email address.', 'warning');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profile.email)) {
      addNotification('Please enter a valid email address.', 'error');
      return;
    }
    setSendingEmailChange(true);
    try {
      const res = await usersAPI.requestEmailChange(profile.email);
      addNotification(res.data.message || 'Verification link sent! Check your inbox.', 'success');
      setPendingEmailSent(true);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to send verification email.';
      addNotification(msg, 'error');
    } finally {
      setSendingEmailChange(false);
    }
  };

  const updatePassword = async () => {
    if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
      addNotification('Please fill in the new and confirm password fields.', 'warning');
      return;
    }
    if (!isOAuthUser && !passwordForm.currentPassword) {
      addNotification('Please enter your current password.', 'warning');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      addNotification('New passwords do not match.', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = { newPassword: passwordForm.newPassword };
      if (!isOAuthUser) payload.currentPassword = passwordForm.currentPassword;
      const res = await authAPI.changePassword(payload);
      addNotification(res.data.message || 'Password updated successfully!', 'success');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      if (isOAuthUser) setIsOAuthUser(false); // They now have a real password
    } catch (err) {
      const data = err.response?.data;
      if (data?.requirements) {
        addNotification(`Password requirements not met: ${data.requirements.join(', ')}`, 'error');
      } else {
        addNotification(data?.error || 'Failed to update password.', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleThemeChange = (e) => {
    const nextTheme = e.target.value;
    setTheme(nextTheme);
    addNotification(`Theme switched to ${nextTheme} Mode`, 'info');
  };

  // Shared class helpers
  const card = 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm space-y-6';
  const label = 'block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1';
  const input = 'w-full h-10 border border-slate-200 dark:border-slate-600 rounded-lg px-3 text-[13px] text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-700 outline-none focus:border-blue-500 dark:focus:border-blue-400 placeholder-slate-400 dark:placeholder-slate-500';
  const sectionTitle = 'text-xs font-bold uppercase tracking-widest text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700 pb-3';

  return (
    <div className="w-full box-border">
      <header className="mb-8 border-b border-slate-100 dark:border-slate-700 pb-5">
        <div className="flex items-center gap-2.5">
          <User className="text-blue-600 dark:text-blue-400" size={24} />
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">My Profile &amp; Security</h1>
        </div>
        <p className="text-[12px] text-slate-400 dark:text-slate-500 mt-1">
          Customize your personal details, choose application themes, modify passwords, and monitor active sessions.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-200">
        {/* ── Left Column ─────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Profile Card */}
          <div className={card}>
            <h2 className={sectionTitle}>Profile Customization</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className={label}>Full Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={e => handleProfileChange('name', e.target.value)}
                  className={input}
                />
              </div>

              {/* Email Address */}
              <div>
                <label className={label}>Email Address</label>
                {pendingEmailSent ? (
                  <div className="flex items-center gap-2 h-10 px-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg text-amber-700 dark:text-amber-400 text-[12px] font-semibold">
                    <MailCheck size={14} className="shrink-0" />
                    Verification sent — check your inbox.
                  </div>
                ) : (
                  <div className="flex gap-2 items-center">
                    <input
                      type="email"
                      value={profile.email}
                      onChange={e => handleProfileChange('email', e.target.value)}
                      className={`${input} flex-1`}
                      placeholder="Enter new email address"
                    />
                    <button
                      onClick={handleEmailChangeRequest}
                      disabled={sendingEmailChange}
                      className="h-10 px-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-[11px] font-bold rounded-lg flex items-center gap-1.5 transition-colors shrink-0 whitespace-nowrap disabled:opacity-60"
                    >
                      {sendingEmailChange ? <Loader2 size={13} className="animate-spin" /> : <MailCheck size={13} />}
                      Verify
                    </button>
                  </div>
                )}
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                  A verification link will be sent to the new address before any change takes effect.
                </p>
              </div>

              {/* Contact Phone */}
              <div>
                <label className={label}>Contact Phone</label>
                <input
                  type="text"
                  value={profile.phone}
                  onChange={e => handleProfileChange('phone', e.target.value)}
                  className={input}
                />
              </div>

              {/* Language */}
              <div>
                <label className={label}>Language</label>
                <select
                  value={language}
                  onChange={e => {
                    setLanguage(e.target.value);
                    addNotification(`Preferred language updated to ${e.target.value}`, 'success');
                  }}
                  className={`${input} cursor-pointer`}
                >
                  <option value="English">English</option>
                  <option value="Tamil">Tamil (தமிழ்)</option>
                  <option value="Hindi">Hindi (हिन्दी)</option>
                  <option value="Spanish">Spanish (Español)</option>
                </select>
              </div>
            </div>

            {/* Theme Toggle */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <div>
                <div className="text-[12px] font-bold text-slate-700 dark:text-slate-200">Interface Display Mode</div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Toggle light vs dark theme layouts</div>
              </div>
              <select
                value={theme}
                onChange={handleThemeChange}
                className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-bold uppercase tracking-wider bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer outline-none"
              >
                <option value="light">Light Mode</option>
                <option value="dark">Dark Mode</option>
                <option value="system">System Default</option>
              </select>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-700">
              <button
                onClick={saveProfile}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded-lg flex items-center gap-1.5 shadow-sm"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Details
              </button>
            </div>
          </div>

          {/* Change / Set Password */}
          <div className={`${card.replace('space-y-6', '')} space-y-4`}>
            <h2 className={`${sectionTitle} flex items-center gap-1.5`}>
              <Lock size={16} className="text-blue-500 dark:text-blue-400" />
              {isOAuthUser ? 'Set a Security Password' : 'Change Security Password'}
            </h2>

            {/* OAuth notice banner */}
            {isOAuthUser && (
              <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-xl">
                <Chrome size={18} className="text-blue-500 dark:text-blue-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[12px] font-bold text-blue-700 dark:text-blue-300">You signed in with Google</p>
                  <p className="text-[11px] text-blue-600/80 dark:text-blue-400/80 mt-0.5 leading-relaxed">
                    Your account was created via Google OAuth, so no password was set. You can optionally create one now to also allow email &amp; password login in the future.
                  </p>
                </div>
              </div>
            )}

            <div className={`grid gap-4 ${isOAuthUser ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
              {/* Current password — only for non-OAuth users */}
              {!isOAuthUser && (
                <div>
                  <label className={label}>Current Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={e => handlePasswordChange('currentPassword', e.target.value)}
                      className={`${input} pr-10`}
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}
              <div>
                <label className={label}>New Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={e => handlePasswordChange('newPassword', e.target.value)}
                  className={input}
                  placeholder="Min. 8 chars, upper, number, symbol"
                />
              </div>
              <div>
                <label className={label}>Confirm New Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordForm.confirmPassword}
                  onChange={e => handlePasswordChange('confirmPassword', e.target.value)}
                  className={input}
                />
              </div>
            </div>

            {/* Password requirements hint */}
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
              Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.
            </p>

            <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-700">
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-1"
              >
                {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                {showPassword ? 'Hide' : 'Show'} passwords
              </button>
              <button
                onClick={updatePassword}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded-lg flex items-center gap-1.5 shadow-sm"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {isOAuthUser ? 'Set Password' : 'Update Password'}
              </button>
            </div>
          </div>
        </div>

        {/* ── Right Column ─────────────────────────────────────────── */}
        <div className="space-y-6">

          {/* MFA */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className={`${sectionTitle} flex items-center gap-1.5`}>
              <Shield size={16} className="text-blue-500 dark:text-blue-400" /> Multi-Factor Auth (MFA)
            </h2>
            <p className="text-[12px] text-slate-400 dark:text-slate-500 leading-relaxed">
              Require a verified verification code from your authenticator app (Google Authenticator, Authy) to secure credentials during sign in.
            </p>
            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-150 dark:border-slate-600 rounded-xl">
              <div>
                <span className="text-[12px] font-bold text-slate-700 dark:text-slate-200 block">Two-Factor Auth</span>
                <span className="text-[9px] text-amber-600 dark:text-amber-400 font-extrabold uppercase tracking-wider">Coming Soon</span>
              </div>
              <input
                type="checkbox"
                disabled
                checked={mfaEnabled}
                onChange={() => setMfaEnabled(!mfaEnabled)}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Active Sessions */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className={`${sectionTitle} flex items-center gap-1.5`}>
              <Terminal size={16} className="text-blue-500 dark:text-blue-400" /> Active Login Sessions
            </h2>
            <div className="space-y-3">
              <div className="p-3 border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/30 rounded-xl flex justify-between items-center text-[12px]">
                <div>
                  <div className="font-bold text-slate-700 dark:text-slate-200">Chrome (Windows 10)</div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">IP: 192.168.1.100 (This Session)</div>
                </div>
                <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-400 font-bold text-[9px] rounded-full uppercase tracking-wider">
                  Active
                </span>
              </div>
              <div className="p-3 border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/30 rounded-xl flex justify-between items-center text-[12px]">
                <div>
                  <div className="font-bold text-slate-700 dark:text-slate-200">Safari (iPhone 13)</div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">IP: 103.111.45.10 (3 hours ago)</div>
                </div>
                <button
                  onClick={() => addNotification('Session terminated successfully', 'success')}
                  className="text-rose-600 dark:text-rose-400 hover:underline font-bold text-[10px] uppercase tracking-wider"
                >
                  Revoke
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
