import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import { Eye, CheckCircle, XCircle, Lock, Sun, Moon } from 'lucide-react';

const SetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'success'>('loading');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) { setStatus('invalid'); return; }
    api.get(`/auth/verify-token/${token}`)
      .then(res => { setUsername(res.data.username); setStatus('valid'); })
      .catch(() => setStatus('invalid'));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }

    setSubmitting(true);
    try {
      await api.post('/auth/set-password', { token, new_password: password });
      setStatus('success');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F6F0] dark:bg-[#0D0F12] text-[#1A1917] dark:text-[#F3F4F6] flex flex-col items-center justify-center p-4 relative transition-colors duration-200">
      
      {/* Top right theme toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-2.5 rounded-xl border border-[#E6E1D7] dark:border-[#262B34] bg-white dark:bg-[#16191E] text-[#706B63] dark:text-[#9CA3AF] hover:text-[#1A1917] dark:hover:text-white transition shadow-sm cursor-pointer"
        title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
      >
        {theme === 'light' ? <Moon className="w-4 h-4 text-[#C85A32]" /> : <Sun className="w-4 h-4 text-amber-400" />}
      </button>

      <div className="max-w-md w-full p-8 rounded-2xl border border-[#E6E1D7] dark:border-[#262B34] bg-white dark:bg-[#16191E] shadow-xl">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#1A1917] dark:bg-[#C85A32] flex items-center justify-center shadow-sm">
            <Eye className="w-6 h-6 text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-extrabold text-center mb-1 text-[#1A1917] dark:text-[#F3F4F6]">MedVisionAI Patient Activation</h2>

        {status === 'loading' && (
          <p className="text-center text-[#706B63] dark:text-[#9CA3AF] text-sm mt-6">Verifying your link…</p>
        )}

        {status === 'invalid' && (
          <div className="text-center mt-6 space-y-4">
            <XCircle className="w-12 h-12 text-amber-600 dark:text-amber-500 mx-auto" />
            <p className="font-bold text-lg text-[#1A1917] dark:text-[#F3F4F6]">Activation Link Already Used or Expired</p>
            <p className="text-xs text-[#706B63] dark:text-[#9CA3AF] leading-relaxed">
              If you have already set your password, your account is activated! Click below to log in with your credentials.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="mt-2 bg-[#C85A32] hover:bg-[#D96B43] text-white font-bold px-6 py-3 rounded-xl text-xs transition w-full shadow-sm"
            >
              Go to Portal Login
            </button>
          </div>
        )}

        {status === 'valid' && (
          <div className="mt-4">
            <div className="p-4 rounded-xl border border-[#E6E1D7] dark:border-[#262B34] bg-[#F8F6F0] dark:bg-[#0D0F12] mb-6 text-center">
              <p className="text-xs text-[#706B63] dark:text-[#9CA3AF] mb-1">Your Portal Username</p>
              <p className="font-mono font-extrabold text-[#C85A32] dark:text-[#E06D44] text-lg">{username}</p>
            </div>
            <p className="text-xs text-[#706B63] dark:text-[#9CA3AF] mb-6 text-center">
              Set a strong password to activate your account and view your clinical screening reports.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-[#706B63] dark:text-[#9CA3AF]">
                  <Lock className="inline w-3.5 h-3.5 mr-1 text-[#C85A32] dark:text-[#E06D44]" /> New Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full border border-[#E6E1D7] dark:border-[#262B34] bg-[#F8F6F0] dark:bg-[#0D0F12] text-[#1A1917] dark:text-[#F3F4F6] rounded-xl p-3 text-xs outline-none focus:border-[#C85A32]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-[#706B63] dark:text-[#9CA3AF]">Confirm Password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Re-enter your password"
                  className="w-full border border-[#E6E1D7] dark:border-[#262B34] bg-[#F8F6F0] dark:bg-[#0D0F12] text-[#1A1917] dark:text-[#F3F4F6] rounded-xl p-3 text-xs outline-none focus:border-[#C85A32]"
                  required
                />
              </div>
              {error && <p className="text-xs text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-[#2A1616] border border-rose-200 dark:border-rose-900 rounded-xl p-3">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#C85A32] hover:bg-[#D96B43] disabled:opacity-40 text-white font-bold p-3 rounded-xl text-xs transition shadow-sm"
              >
                {submitting ? 'Activating…' : 'Set Password & Activate Account'}
              </button>
            </form>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center mt-6 space-y-4">
            <CheckCircle className="w-14 h-14 text-emerald-600 dark:text-emerald-500 mx-auto tick-anim-box" />
            <p className="font-extrabold text-lg text-[#1A1917] dark:text-[#F3F4F6]">Account Activated!</p>
            <p className="text-xs text-[#706B63] dark:text-[#9CA3AF]">
              Your username is <span className="font-mono font-bold text-[#C85A32] dark:text-[#E06D44]">{username}</span>. 
              You can now log in to view your screening results.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="mt-4 bg-[#C85A32] hover:bg-[#D96B43] text-white px-8 py-3 rounded-xl font-bold text-xs w-full shadow-sm"
            >
              Go to Portal Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SetPassword;


