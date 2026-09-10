import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, ShieldCheck, UserCheck } from 'lucide-react';
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
      await login(username, password);
      // Determine redirection based on login profile response
      const meRes = await fetch('/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const userData = await meRes.json();
      
      if (userData.role === 'PATIENT') {
        navigate('/patient');
      } else {
        // Doctor or Admin role goes to Doctor/Admin portal
        navigate('/worker');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid username or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="formal-auth-wrapper">
      {/* Subtle ambient light orbs (no childish grid boxes) */}
      <div className="ambient-glow-1"></div>
      <div className="ambient-glow-2"></div>
      <div className="bg-grid-overlay"></div>

      <div className="formal-card">
        {/* Header Logo */}
        <div className="card-header">
          <div className="logo-badge-icon">
            <Activity className="w-6 h-6 text-sky-400" />
          </div>
          <h1 className="brand-name">
            MEDVISION <span className="ai-accent">AI</span>
          </h1>
          <p className="platform-tagline">Diabetic Retinopathy Screening & Diagnostic Platform</p>
        </div>

        {/* Role Toggle Track with Smooth Glider */}
        <div className="role-switch-track">
          <div className={`role-switch-glider ${mode === 'patient' ? 'patient' : ''}`}></div>
          <button
            type="button"
            className={`role-option-btn ${mode === 'doctor' ? 'active' : ''}`}
            onClick={() => { setMode('doctor'); setError(''); }}
          >
            <ShieldCheck className="w-4 h-4" /> Doctor / Admin
          </button>
          <button
            type="button"
            className={`role-option-btn ${mode === 'patient' ? 'active' : ''}`}
            onClick={() => { setMode('patient'); setError(''); }}
          >
            <UserCheck className="w-4 h-4" /> Patient
          </button>
        </div>

        {error && <div className="error-box">{error}</div>}

        {/* Animated Form Container */}
        <div className="form-fade-wrapper" key={mode}>
          <form onSubmit={handleSubmit} className="formal-form">
            <div className="form-group">
              <label>{mode === 'doctor' ? 'Doctor / Admin Username' : 'Patient Username'}</label>
              <input
                type="text"
                className="form-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={mode === 'doctor' ? 'Enter username e.g. dr.screening' : 'Enter your patient username'}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
            </div>

            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? 'Authenticating...' : `Sign In to ${mode === 'doctor' ? 'Clinical Portal' : 'Patient Portal'}`}
            </button>
          </form>

          <p className="hint-note">
            {mode === 'doctor'
              ? '🔒 Authenticated clinical portal. Admin credentials enable full system oversight & CSV exports.'
              : '🔑 Access your screening results, PDF downloads & AI health assistant.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
