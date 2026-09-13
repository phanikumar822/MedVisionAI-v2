import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Eye, ShieldCheck, UserCheck, Lock, User, ArrowRight, Sparkles, CheckCircle2, Activity, MessageSquare } from 'lucide-react';
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
    <div className="login-root-container">
      
      {/* Background Ambient Glows & Grid Pattern */}
      <div className="bg-glow-orb orb-1"></div>
      <div className="bg-glow-orb orb-2"></div>
      <div className="bg-grid-overlay"></div>

      {/* Main Glassmorphism Portal Shell */}
      <div className="portal-shell">
        
        {/* LEFT COLUMN: AUTH FORM */}
        <div className="form-column">
          
          {/* Brand Header */}
          <div className="brand-header-wrap">
            <div className="brand-icon-box">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <span className="brand-logo-text">
              MedVision<span className="text-teal-400">AI</span>
            </span>
          </div>

          {/* Mode Switcher Pill */}
          <div className="mode-switcher-pill">
            <div className={`mode-glider ${mode === 'patient' ? 'slide-patient' : ''}`}></div>
            <button
              type="button"
              className={`switcher-tab ${mode === 'doctor' ? 'tab-active' : ''}`}
              onClick={() => { setMode('doctor'); setError(''); }}
            >
              <ShieldCheck className="w-4 h-4" /> DOCTOR PORTAL
            </button>
            <button
              type="button"
              className={`switcher-tab ${mode === 'patient' ? 'tab-active' : ''}`}
              onClick={() => { setMode('patient'); setError(''); }}
            >
              <UserCheck className="w-4 h-4" /> PATIENT PORTAL
            </button>
          </div>

          {/* Form Header */}
          <div className="form-title-group" key={`title-${mode}`}>
            <h1 className="main-form-title">
              {mode === 'doctor' ? 'Clinician Sign In' : 'Patient Sign In'}
            </h1>
            <p className="main-form-subtext">
              {mode === 'doctor' 
                ? 'Access AI retinal fundus screening workspace & Grad-CAM heatmap diagnostics.'
                : 'Sign in to view diagnostic findings, download PDF reports, & consult AI assistant.'}
            </p>
          </div>

          {/* Error Banner */}
          {error && <div className="form-error-banner">{error}</div>}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="portal-auth-form" key={`form-${mode}`}>
            
            <div className="input-group-row">
              
              {/* Username Input */}
              <div className="floating-field-wrap">
                <div className="input-icon-left">
                  <User className="w-4 h-4 text-[#94A3B8]" />
                </div>
                <input
                  type="text"
                  className="floating-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder=" "
                  required
                />
                <label className="floating-label">
                  {mode === 'doctor' ? 'Doctor / Admin Username' : 'Patient Username'}
                </label>
              </div>

              {/* Password Input */}
              <div className="floating-field-wrap">
                <div className="input-icon-left">
                  <Lock className="w-4 h-4 text-[#94A3B8]" />
                </div>
                <input
                  type="password"
                  className="floating-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder=" "
                  required
                />
                <label className="floating-label">Password</label>
              </div>

            </div>

            {/* Action Submit Button */}
            <button type="submit" className="portal-submit-btn" disabled={loading}>
              <Sparkles className="w-4 h-4 shrink-0" />
              <span className="submit-btn-label">
                {loading ? 'Authenticating...' : `Sign In to ${mode === 'doctor' ? 'Doctor Portal' : 'Patient Portal'}`}
              </span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
          </form>

          {/* Clinical Feature Checklist */}
          <div className="feature-checklist-box" key={`features-${mode}`}>
            {mode === 'doctor' ? (
              <>
                <div className="checklist-item">
                  <div className="check-badge warm"><CheckCircle2 className="w-3.5 h-3.5" /></div>
                  <span>Retinal image analysis & EfficientNet-B0 inference</span>
                </div>
                <div className="checklist-item">
                  <div className="check-badge warm"><CheckCircle2 className="w-3.5 h-3.5" /></div>
                  <span>Grad-CAM lesion heatmaps & diagnostic logit scale</span>
                </div>
              </>
            ) : (
              <>
                <div className="checklist-item">
                  <div className="check-badge sage"><CheckCircle2 className="w-3.5 h-3.5" /></div>
                  <span>View official screening findings & downloadable PDFs</span>
                </div>
                <div className="checklist-item">
                  <div className="check-badge sage"><CheckCircle2 className="w-3.5 h-3.5" /></div>
                  <span>Ask questions to RAG-grounded report assistant</span>
                </div>
              </>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: PORTAL SHOWCASE CARD */}
        <div className="showcase-column">
          <div className="showcase-card-inner" key={`img-${mode}`}>
            
            <img
              src={mode === 'doctor' ? '/assets/doctor_portal_hero.jpg' : '/assets/patient_portal_hero.jpg'}
              alt={mode === 'doctor' ? 'Doctor Workspace' : 'Patient Portal'}
              className="showcase-img"
            />
            <div className="showcase-img-overlay"></div>

            {/* Floating Info Badge */}
            <div className="floating-showcase-badge">
              <div className="badge-icon-bg">
                {mode === 'doctor' ? <Activity className="w-4 h-4 text-teal-400" /> : <MessageSquare className="w-4 h-4 text-emerald-400" />}
              </div>
              <div className="badge-text-group">
                <span className="badge-title font-extrabold">{mode === 'doctor' ? 'Clinical Workspace' : 'Patient Health Portal'}</span>
                <span className="badge-sub font-semibold">{mode === 'doctor' ? 'Grad-CAM DR Heatmaps' : 'ChromaDB AI Assistant'}</span>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};

export default Login;
