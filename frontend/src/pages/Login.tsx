import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Eye, ShieldCheck, UserCheck, Lock, User, ArrowRight, Sparkles } from 'lucide-react';
import './Login.css';

const Login = () => {
  const [mode, setMode] = useState<'doctor' | 'patient'>('doctor');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append('username', username.trim());
      formData.append('password', password);

      const res = await api.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      const token = res.data.access_token;
      await login(token);

      const meRes = await api.get('/auth/me');
      const userData = meRes.data;

      if (userData.role === 'PATIENT') {
        navigate('/patient');
      } else {
        navigate('/worker');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Invalid username or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animated-auth-root">
      
      {/* Interactive Grid Background */}
      <section className="grid-section">
        {Array.from({ length: 90 }).map((_, i) => (
          <span key={i}></span>
        ))}

        {/* Central Animated Signin Card */}
        <div className="signin">
          <div className="content">
            
            {/* Header Brand */}
            <div className="brand-header">
              <div className="brand-logo-box">
                <Eye className="w-5 h-5 text-white" />
              </div>
              <h1 className="brand-title">MedVision<span>AI</span></h1>
            </div>

            {/* Portal Switcher Tabs */}
            <div className="portal-switcher">
              <button
                type="button"
                className={`switch-tab ${mode === 'doctor' ? 'active-tab' : ''}`}
                onClick={() => { setMode('doctor'); setError(''); }}
              >
                <ShieldCheck className="w-4 h-4" /> Doctor Portal
              </button>
              <button
                type="button"
                className={`switch-tab ${mode === 'patient' ? 'active-tab' : ''}`}
                onClick={() => { setMode('patient'); setError(''); }}
              >
                <UserCheck className="w-4 h-4" /> Patient Portal
              </button>
            </div>

            {/* Title */}
            <h2 key={`title-${mode}`} className="form-heading">
              {mode === 'doctor' ? 'Clinician Sign In' : 'Patient Sign In'}
            </h2>

            {/* Form */}
            <form onSubmit={handleSubmit} className="form" key={`form-${mode}`}>
              
              {error && <div className="error-msg">{error}</div>}

              {/* Username Input Box */}
              <div className="inputBox">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
                <i>
                  <User className="inline-icon" /> {mode === 'doctor' ? 'Doctor Username' : 'Patient Username'}
                </i>
              </div>

              {/* Password Input Box */}
              <div className="inputBox">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <i>
                  <Lock className="inline-icon" /> Password
                </i>
              </div>

              {/* Action Submit Button */}
              <div className="inputBox submitBox">
                <button type="submit" className="login-submit-btn" disabled={loading}>
                  <Sparkles className="w-4 h-4" />
                  <span>{loading ? 'AUTHENTICATING...' : `SIGN IN TO ${mode === 'doctor' ? 'DOCTOR' : 'PATIENT'} PORTAL`}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>

            <p className="portal-hint">
              {mode === 'doctor'
                ? 'Access DR screening diagnostics, Grad-CAM overlays & report publishing.'
                : 'View your screening results, download PDF reports & consult AI assistant.'}
            </p>

          </div>
        </div>
      </section>

    </div>
  );
};

export default Login;
