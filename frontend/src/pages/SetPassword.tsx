import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { Eye, CheckCircle, XCircle, Lock, Sun, Moon } from 'lucide-react';

const SetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'success'>('loading');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

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
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${
      theme === 'dark' ? 'bg-[#09090b] text-[#fafafa]' : 'bg-[#f8fafc] text-[#0f172a]'
    }`}>
      
      {/* Absolute Header Theme Toggle */}
      <div className="absolute top-4 right-6">
        <button
          onClick={toggleTheme}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
            theme === 'dark' ? 'bg-[#18181b] border-[#3f3f46] text-[#e4e4e7] hover:bg-[#27272a]' : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
          }`}
        >
          {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-700" />}
          <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>
      </div>

      <div className={`max-w-md w-full p-8 rounded-2xl border shadow-xl transition-colors duration-300 ${
        theme === 'dark' ? 'bg-[#141417] border-[#27272a]' : 'bg-white border-slate-200'
      }`}>
        <div className="flex justify-center mb-6">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${theme === 'dark' ? 'bg-gradient-to-br from-[#27272a] to-[#ec4899]' : 'bg-gradient-to-br from-[#0f172a] to-[#2563eb]'}`}>
            <Eye className="w-6 h-6 text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-extrabold text-center mb-1">MedVisionAI Patient Activation</h2>

        {status === 'loading' && (
          <p className="text-center opacity-60 text-sm mt-6">Verifying your link…</p>
        )}

        {status === 'invalid' && (
          <div className="text-center mt-6 space-y-4">
            <XCircle className="w-12 h-12 text-amber-500 mx-auto" />
            <p className="font-bold text-lg">Activation Link Already Used or Expired</p>
            <p className="text-xs opacity-75 leading-relaxed">
              If you have already set your password, your account is activated! Click below to log in with your auto-generated username and password.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="mt-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold px-6 py-3 rounded-xl text-xs transition w-full shadow-md"
            >
              Go to Login
            </button>
          </div>
        )}

        {status === 'valid' && (
          <div className="mt-4">
            <div className={`p-4 rounded-xl border mb-6 text-center ${
              theme === 'dark' ? 'bg-[#18181b] border-[#27272a]' : 'bg-slate-50 border-slate-200'
            }`}>
              <p className="text-xs opacity-60 mb-1">Your portal username</p>
              <p className="font-mono font-extrabold text-pink-500 text-lg">{username}</p>
            </div>
            <p className="text-xs opacity-75 mb-6 text-center">
              Set a strong password to activate your account and access your screening results.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1 opacity-80">
                  <Lock className="inline w-3.5 h-3.5 mr-1" /> New Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className={`w-full border rounded-xl p-3 text-xs outline-none ${
                    theme === 'dark' ? 'bg-[#18181b] border-[#3f3f46] text-[#fafafa]' : 'bg-slate-50 border-slate-300'
                  }`}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 opacity-80">Confirm Password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Re-enter your password"
                  className={`w-full border rounded-xl p-3 text-xs outline-none ${
                    theme === 'dark' ? 'bg-[#18181b] border-[#3f3f46] text-[#fafafa]' : 'bg-slate-50 border-slate-300'
                  }`}
                  required
                />
              </div>
              {error && <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-xl p-3">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:opacity-40 text-white font-bold p-3 rounded-xl text-xs transition shadow-md"
              >
                {submitting ? 'Activating…' : 'Set Password & Activate Account'}
              </button>
            </form>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center mt-6 space-y-4">
            <CheckCircle className="w-14 h-14 text-emerald-400 mx-auto tick-anim-box" />
            <p className="font-extrabold text-lg">Account Activated!</p>
            <p className="text-xs opacity-75">
              Your username is <span className="font-mono font-bold text-pink-500">{username}</span>. 
              You can now log in to view your screening results.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="mt-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-3 rounded-xl font-bold text-xs w-full shadow-md"
            >
              Go to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SetPassword;

