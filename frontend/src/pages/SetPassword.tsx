import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { Eye, CheckCircle, XCircle, Lock } from 'lucide-react';

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
    <div className="min-h-screen bg-[#F8F9FA] text-[#0F172A] flex items-center justify-center p-4">
      
      <div className="max-w-md w-full p-8 rounded-xl border border-[#E2E8F0] bg-white shadow-xs">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-[#0F172A] flex items-center justify-center shadow-xs">
            <Eye className="w-6 h-6 text-white" />
          </div>
        </div>
        <h2 className="text-xl font-extrabold text-center mb-1 text-[#0F172A]">MedVisionAI Patient Activation</h2>

        {status === 'loading' && (
          <p className="text-center text-[#64748B] text-xs mt-6">Verifying activation link…</p>
        )}

        {status === 'invalid' && (
          <div className="text-center mt-6 space-y-4">
            <XCircle className="w-12 h-12 text-amber-600 mx-auto" />
            <p className="font-bold text-base text-[#0F172A]">Activation Link Already Used or Expired</p>
            <p className="text-xs text-[#64748B] leading-relaxed">
              If you have already set your password, your account is activated! Click below to log in with your credentials.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="mt-2 bg-[#0F766E] hover:bg-[#0D9488] text-white font-bold px-6 py-3 rounded-lg text-xs transition w-full shadow-xs"
            >
              Go to Portal Login
            </button>
          </div>
        )}

        {status === 'valid' && (
          <div className="mt-4">
            <div className="p-4 rounded-lg border border-[#E2E8F0] bg-[#F8F9FA] mb-6 text-center">
              <p className="text-xs text-[#64748B] mb-1">Your Portal Username</p>
              <p className="font-mono font-extrabold text-[#0F766E] text-base">{username}</p>
            </div>
            <p className="text-xs text-[#64748B] mb-6 text-center">
              Set a strong password to activate your account and view your clinical screening reports.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-[#475569]">
                  <Lock className="inline w-3.5 h-3.5 mr-1 text-[#0F766E]" /> New Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full border border-[#CBD5E1] bg-[#F8F9FA] text-[#0F172A] rounded-lg p-2.5 text-xs outline-none focus:border-[#0F766E] focus:bg-white transition"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-[#475569]">Confirm Password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Re-enter your password"
                  className="w-full border border-[#CBD5E1] bg-[#F8F9FA] text-[#0F172A] rounded-lg p-2.5 text-xs outline-none focus:border-[#0F766E] focus:bg-white transition"
                  required
                />
              </div>
              {error && <p className="text-xs text-[#9F1239] bg-[#FEF2F2] border border-[#FECDD3] rounded-lg p-3">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#0F766E] hover:bg-[#0D9488] disabled:opacity-40 text-white font-bold p-3 rounded-lg text-xs transition shadow-xs"
              >
                {submitting ? 'Activating…' : 'Set Password & Activate Account'}
              </button>
            </form>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center mt-6 space-y-4">
            <CheckCircle className="w-14 h-14 text-[#047857] mx-auto tick-anim-box" />
            <p className="font-extrabold text-base text-[#0F172A]">Account Activated!</p>
            <p className="text-xs text-[#64748B]">
              Your username is <span className="font-mono font-bold text-[#0F766E]">{username}</span>. 
              You can now log in to view your screening results.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="mt-4 bg-[#0F766E] hover:bg-[#0D9488] text-white px-8 py-3 rounded-lg font-bold text-xs w-full shadow-xs transition"
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


