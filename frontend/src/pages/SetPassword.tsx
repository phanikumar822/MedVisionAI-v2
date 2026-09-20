import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { Eye, EyeOff, CheckCircle, XCircle, Lock, User } from 'lucide-react';

const SetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'success'>('loading');
  const [patientName, setPatientName] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) { setStatus('invalid'); return; }
    api.get(`/auth/verify-token/${token}`)
      .then(res => { 
        setUsername(res.data.username || ''); 
        setPatientName(res.data.patient_name || '');
        setPatientEmail(res.data.patient_email || '');
        setStatus('valid'); 
      })
      .catch(() => setStatus('invalid'));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanUsername = username.trim();
    if (!cleanUsername) {
      setError('Please choose a username or ID.');
      return;
    }
    if (cleanUsername.length < 3) {
      setError('Username or ID must be at least 3 characters.');
      return;
    }
    if (password.length < 6) { 
      setError('Password must be at least 6 characters.'); 
      return; 
    }
    if (password !== confirm) { 
      setError('Passwords do not match.'); 
      return; 
    }

    setSubmitting(true);
    try {
      await api.post('/auth/set-password', { 
        token, 
        username: cleanUsername, 
        new_password: password 
      });
      setStatus('success');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#0F172A] flex items-center justify-center p-4">
      
      <div className="max-w-md w-full p-8 rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
        <div className="flex justify-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-[#0F172A] flex items-center justify-center shadow-xs">
            <Eye className="w-6 h-6 text-teal-400" />
          </div>
        </div>
        <h2 className="text-xl font-extrabold text-center mb-1 text-[#0F172A]">Patient Portal Activation</h2>
        <p className="text-xs text-[#64748B] text-center mb-6">
          Set up your personal credentials to access your clinical screening reports.
        </p>

        {status === 'loading' && (
          <p className="text-center text-[#64748B] text-xs py-8">Verifying activation link…</p>
        )}

        {status === 'invalid' && (
          <div className="text-center py-4 space-y-4">
            <XCircle className="w-12 h-12 text-amber-600 mx-auto" />
            <p className="font-bold text-base text-[#0F172A]">Activation Link Expired or Already Used</p>
            <p className="text-xs text-[#64748B] leading-relaxed">
              If you have already set your username and password, your account is active! You can sign in directly.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="mt-2 bg-[#0F766E] hover:bg-[#0D9488] text-white font-bold px-6 py-3 rounded-xl text-xs transition w-full shadow-xs cursor-pointer"
            >
              Go to Portal Login
            </button>
          </div>
        )}

        {status === 'valid' && (
          <div className="mt-2">
            {patientName && (
              <div className="p-3 rounded-xl border border-teal-100 bg-teal-50/50 mb-5 text-center">
                <p className="text-xs text-[#0F766E] font-semibold">Welcome, {patientName}!</p>
                {patientEmail && <p className="text-[11px] text-slate-500 font-mono mt-0.5">{patientEmail}</p>}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Choose Username or ID */}
              <div>
                <label className="block text-xs font-semibold mb-1 text-[#475569]">
                  <User className="inline w-3.5 h-3.5 mr-1 text-[#0F766E]" /> Choose Your Username or ID <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="e.g. phani or phanikumar822"
                  className="w-full border border-[#CBD5E1] bg-[#F8F9FA] text-[#0F172A] font-mono rounded-xl p-2.5 text-xs outline-none focus:border-[#0F766E] focus:bg-white transition"
                  required
                />
                <p className="text-[11px] text-[#64748B] mt-1">
                  You will use this Username or ID (or your email) to log in.
                </p>
              </div>

              {/* Choose Password */}
              <div>
                <label className="block text-xs font-semibold mb-1 text-[#475569]">
                  <Lock className="inline w-3.5 h-3.5 mr-1 text-[#0F766E]" /> Create Password <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full border border-[#CBD5E1] bg-[#F8F9FA] text-[#0F172A] rounded-xl p-2.5 pr-10 text-xs outline-none focus:border-[#0F766E] focus:bg-white transition"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold mb-1 text-[#475569]">
                  Confirm Password <span className="text-rose-600">*</span>
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Re-enter your password"
                  className="w-full border border-[#CBD5E1] bg-[#F8F9FA] text-[#0F172A] rounded-xl p-2.5 text-xs outline-none focus:border-[#0F766E] focus:bg-white transition"
                  required
                />
              </div>

              {error && (
                <p className="text-xs text-[#9F1239] bg-[#FEF2F2] border border-[#FECDD3] rounded-xl p-3">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#0F766E] hover:bg-[#0D9488] disabled:opacity-40 text-white font-bold p-3 rounded-xl text-xs transition shadow-xs cursor-pointer mt-2"
              >
                {submitting ? 'Setting Up Credentials…' : 'Save Credentials & Activate Account'}
              </button>
            </form>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center mt-4 space-y-4">
            <CheckCircle className="w-14 h-14 text-[#047857] mx-auto tick-anim-box" />
            <p className="font-extrabold text-base text-[#0F172A]">Account Activated Successfully!</p>
            <div className="p-4 rounded-xl border border-[#A7F3D0] bg-[#ECFDF5] text-left text-xs font-mono space-y-1">
              <p><span className="font-semibold text-[#065F46]">Your Username / ID:</span> <span className="font-bold text-[#0F766E]">{username}</span></p>
              {patientEmail && <p><span className="font-semibold text-[#065F46]">Registered Email:</span> {patientEmail}</p>}
            </div>
            <p className="text-xs text-[#64748B]">
              You can now sign in to your patient portal using your Username (or Email) and Password.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="mt-2 bg-[#0F766E] hover:bg-[#0D9488] text-white px-8 py-3 rounded-xl font-bold text-xs w-full shadow-xs transition cursor-pointer"
            >
              Sign In to Patient Portal
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SetPassword;


