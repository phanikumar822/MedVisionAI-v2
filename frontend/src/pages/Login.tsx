import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, ShieldCheck, UserCheck, Lock, User, ArrowRight } from 'lucide-react';
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
    <div className="split-auth-container">

      {/* LEFT SIDE: Enterprise Clinical Hero Panel */}
      <div className="auth-hero-panel">
        <div className="hero-ambient-glow"></div>
        <div className="hero-pattern-overlay"></div>

        {/* Brand Header */}
        <div className="hero-brand">
          <div className="hero-brand-logo">
            <Eye className="w-6 h-6 text-white" />
          </div>
          <span className="hero-brand-name">
            MedVision<span>AI</span>
          </span>
        </div>

        {/* Hero Content */}
        <div className="hero-content">
          <div className="hero-badge">
            <ShieldCheck className="w-4 h-4" /> Clinical Diagnostic System v2.0
          </div>
          <h1 className="hero-title">
            Precision AI Screening for <span>Retinal Health</span>
          </h1>
          <p className="hero-description">
            Empowering ophthalmologists & clinical workers with AI-driven Diabetic Retinopathy screening, 
            automated Grad-CAM heatmaps, PDF report generation, and patient portal access.
          </p>

          {/* Clinical Metrics */}
          <div className="hero-metrics">
            <div className="metric-card">
              <div className="metric-value">96.91%</div>
              <div className="metric-label">Model Accuracy</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">99.75%</div>
              <div className="metric-label">ROC-AUC Score</div>
            </div>
          </div>
        </div>

        {/* Hero Footer */}
        <div className="hero-footer">
          <p className="hero-quote">
            "Automated screening and explainable AI heatmaps help clinicians detect high-risk cases early and publish clear diagnostic reports."
          </p>
          <div className="hero-quote-author">
            MedVisionAI Clinical Intelligence Suite
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Clean Professional Form Panel */}
      <div className="auth-form-panel">
        <div className="form-card-box">

          <div className="form-header">
            <h2>Welcome back</h2>
            <p>Select your access portal to sign in to your account</p>
          </div>

          {/* Segmented Control Switcher */}
          <div className="role-segmented-control">
            <div className={`role-segmented-pill ${mode === 'patient' ? 'patient' : ''}`}></div>
            <button
              type="button"
              className={`role-tab-button ${mode === 'doctor' ? 'active' : ''}`}
              onClick={() => { setMode('doctor'); setError(''); }}
            >
              <ShieldCheck className="w-4 h-4" /> Doctor / Admin
            </button>
            <button
              type="button"
              className={`role-tab-button ${mode === 'patient' ? 'active' : ''}`}
              onClick={() => { setMode('patient'); setError(''); }}
            >
              <UserCheck className="w-4 h-4" /> Patient Portal
            </button>
          </div>

          {error && <div className="error-banner-box">{error}</div>}

          {/* Form Container with Smooth Horizontal Slide Transition */}
          <div className="auth-form-wrapper" key={mode}>
            <form onSubmit={handleSubmit} className="clean-form">
              <div className="input-field-group">
                <label>{mode === 'doctor' ? 'Doctor / Admin Username' : 'Patient Username'}</label>
                <div className="input-field-wrapper">
                  <User className="w-5 h-5 input-icon" />
                  <input
                    type="text"
                    className="clean-input"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={mode === 'doctor' ? 'e.g. dr.screening' : 'Enter patient username'}
                    required
                  />
                </div>
              </div>

              <div className="input-field-group">
                <label>Password</label>
                <div className="input-field-wrapper">
                  <Lock className="w-5 h-5 input-icon" />
                  <input
                    type="password"
                    className="clean-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                  />
                </div>
              </div>

              <button type="submit" className="submit-primary-btn" disabled={loading}>
                {loading ? 'Authenticating...' : `Sign In to ${mode === 'doctor' ? 'Doctor Portal' : 'Patient Portal'}`}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="security-hint-note">
              {mode === 'doctor'
                ? '🔒 Admin credentials (`medvision.admin`) grant full system access & CSV data export.'
                : '🔑 Patients use the auto-generated username & password set via email link.'}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};

export default Login;
