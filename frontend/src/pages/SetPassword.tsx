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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full p-8 rounded-2xl shadow-lg border border-slate-100">
        <div className="flex justify-center mb-6">
          <Eye className="w-12 h-12 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 text-center mb-1">MedVisionAI Patient Portal</h2>

        {status === 'loading' && (
          <p className="text-center text-slate-500 mt-6">Verifying your link…</p>
        )}

        {status === 'invalid' && (
          <div className="text-center mt-6 space-y-4">
            <XCircle className="w-12 h-12 text-amber-500 mx-auto" />
            <p className="font-semibold text-slate-800 text-lg">Activation Link Already Used or Expired</p>
            <p className="text-sm text-slate-600 leading-relaxed">
              If you have already set your password, your account is activated! Click below to log in with your auto-generated username and password.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition w-full"
            >
              Go to Login
            </button>
          </div>
        )}

        {status === 'valid' && (
          <div className="mt-4">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 text-center">
              <p className="text-xs text-slate-500 mb-1">Your portal username</p>
              <p className="font-mono font-bold text-blue-800 text-lg">{username}</p>
            </div>
            <p className="text-slate-600 text-sm mb-6 text-center">
              Set a strong password to activate your account and access your screening results.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <Lock className="inline w-4 h-4 mr-1" /> New Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Re-enter your password"
                  className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold p-3 rounded-lg transition"
              >
                {submitting ? 'Activating…' : 'Set Password & Activate Account'}
              </button>
            </form>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center mt-6 space-y-4">
            <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto" />
            <p className="font-bold text-slate-800 text-lg">Account Activated!</p>
            <p className="text-sm text-slate-600">
              Your username is <span className="font-mono font-bold text-blue-700">{username}</span>. 
              You can now log in to view your screening results.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="mt-4 bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold text-sm w-full"
            >
              Go to Login
            </button>
          </div>
        )}

        <p className="text-xs text-slate-400 text-center mt-6">
          MedVisionAI is an AI-assisted screening tool and does not replace clinical evaluation.
        </p>
      </div>
    </div>
  );
};

export default SetPassword;
