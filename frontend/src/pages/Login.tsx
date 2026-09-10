import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, ShieldCheck, UserCheck, Lock, User, ArrowRight, CheckCircle2, Sparkles, Activity, MessageSquare } from 'lucide-react';
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
      const meRes = await fetch('/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const userData = await meRes.json();
      
      if (userData.role === 'PATIENT') {
        navigate('/patient');
      } else {
        navigate('/worker');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid username or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dribbble-theme-container">
      
      {/* Top Navbar */}
      <header className="dribbble-navbar">
        <div className="nav-brand">
          <div className="nav-logo-box">
            <Eye className="w-5 h-5 text-white" />
          </div>
          <span className="nav-brand-text">MedVision<span>AI</span></span>
        </div>

        <nav className="nav-links">
          <button type="button" className="nav-link-btn active">Explore</button>
          <button type="button" className={`nav-link-btn ${mode === 'doctor' ? 'highlight' : ''}`} onClick={() => setMode('doctor')}>Doctor Portal</button>
          <button type="button" className={`nav-link-btn ${mode === 'patient' ? 'highlight' : ''}`} onClick={() => setMode('patient')}>Patient Portal</button>
          <button type="button" className="nav-link-btn">Clinical Suite</button>
        </nav>

        <div className="nav-right-actions">
          <span className="system-status-badge">
            <span className="status-dot"></span> System Active v2.0
          </span>
        </div>
      </header>

      {/* Top Notice Banner */}
      <div className="dribbble-top-banner">
        <span className="banner-tag">🎉 ACTIVE SUITE</span>
        <span className="banner-text">Clinical Retinal AI Screening v2.0 with Grad-CAM Heatmaps & RAG Assistant</span>
        <span className="banner-action">Explore Features</span>
      </div>

      {/* Main Content Area */}
      <main className="dribbble-hero-section">
        
        {/* LEFT COLUMN: Content & Form */}
        <div className="hero-left-column">
          
          {/* Pill Switcher Toggle (Doctor vs Patient) */}
          <div className="portal-pill-toggle">
            <div className={`pill-glider ${mode === 'patient' ? 'slide-right' : ''}`}></div>
            <button
              type="button"
              className={`pill-tab ${mode === 'doctor' ? 'active' : ''}`}
              onClick={() => { setMode('doctor'); setError(''); }}
            >
              <ShieldCheck className="w-4 h-4" /> DOCTOR PORTAL
            </button>
            <button
              type="button"
              className={`pill-tab ${mode === 'patient' ? 'active' : ''}`}
              onClick={() => { setMode('patient'); setError(''); }}
            >
              <UserCheck className="w-4 h-4" /> PATIENT PORTAL
            </button>
          </div>

          {/* Dynamic Main Heading */}
          <div className="hero-heading-container" key={mode}>
            {mode === 'doctor' ? (
              <h1 className="dribbble-hero-title">
                Empowering clinicians with <span>AI Retinal Intelligence</span>
              </h1>
            ) : (
              <h1 className="dribbble-hero-title">
                Access your reports & <span>AI Health Assistant</span>
              </h1>
            )}
            <p className="hero-subtext">
              {mode === 'doctor' 
                ? 'Deep learning diagnostic suite for Diabetic Retinopathy grading, instant Grad-CAM heatmap generation, and automated patient notifications.'
                : 'Review your retinal scan diagnostic reports, download official clinical PDFs, and ask questions to your 24/7 AI Health Assistant.'}
            </p>
          </div>

          {/* Feature Checklist */}
          <div className="hero-feature-checklist" key={`list-${mode}`}>
            {mode === 'doctor' ? (
              <>
                <div className="feature-check-item">
                  <div className="check-icon-box pink">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span>Instant Diabetic Retinopathy classification & lesion detection</span>
                </div>
                <div className="feature-check-item">
                  <div className="check-icon-box pink">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span>Explainable Grad-CAM heatmaps for high-risk verification</span>
                </div>
                <div className="feature-check-item">
                  <div className="check-icon-box pink">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span>Export PDF clinical reports & Admin CSV data export</span>
                </div>
              </>
            ) : (
              <>
                <div className="feature-check-item">
                  <div className="check-icon-box blue">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span>View official diagnostic reports & retina check summaries</span>
                </div>
                <div className="feature-check-item">
                  <div className="check-icon-box blue">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span>Consult 24/7 AI Medical Assistant backed by clinical RAG</span>
                </div>
                <div className="feature-check-item">
                  <div className="check-icon-box blue">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span>Secure account access via SMTP email notification link</span>
                </div>
              </>
            )}
          </div>

          {/* Inline Integrated Login Form */}
          <div className="dribbble-form-card" key={`form-${mode}`}>
            {error && <div className="error-banner-box">{error}</div>}

            <form onSubmit={handleSubmit} className="dribbble-login-form">
              <div className="form-row-group">
                <div className="form-field">
                  <label>{mode === 'doctor' ? 'Doctor / Admin Username' : 'Patient Username'}</label>
                  <div className="field-input-box">
                    <User className="w-4 h-4 field-icon" />
                    <input
                      type="text"
                      className="field-input"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder={mode === 'doctor' ? 'e.g. dr.screening or medvision.admin' : 'Enter patient username'}
                      required
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label>Password</label>
                  <div className="field-input-box">
                    <Lock className="w-4 h-4 field-icon" />
                    <input
                      type="password"
                      className="field-input"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-action-row">
                <button type="submit" className="dribbble-submit-btn" disabled={loading}>
                  <Sparkles className="w-4 h-4" />
                  {loading ? 'Authenticating...' : `Sign In to ${mode === 'doctor' ? 'Doctor Portal' : 'Patient Portal'}`}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>

            <div className="dribbble-hint">
              {mode === 'doctor'
                ? '🔒 Admin credentials (`medvision.admin`) grant full system access & CSV data export.'
                : '🔑 Patients sign in with credentials received via official email link.'}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Dynamic Portal Image Showcase */}
        <div className="hero-right-column">
          <div className="hero-image-frame-card">
            
            {/* Display relevant image based on selected portal */}
            <div className="image-wrapper" key={`img-${mode}`}>
              <img
                src={mode === 'doctor' ? '/assets/doctor_portal_hero.jpg' : '/assets/patient_portal_hero.jpg'}
                alt={mode === 'doctor' ? 'Doctor Clinical AI Interface' : 'Patient Diagnostic Portal Interface'}
                className="portal-showcase-img"
              />

              {/* Floating Overlay Badge */}
              <div className="floating-portal-badge">
                <div className="badge-icon-wrap">
                  {mode === 'doctor' ? <Activity className="w-4 h-4 text-blue-500" /> : <MessageSquare className="w-4 h-4 text-emerald-500" />}
                </div>
                <div className="badge-content-text">
                  <span className="badge-title">{mode === 'doctor' ? 'Clinical AI Workspace' : 'Patient Portal App'}</span>
                  <span className="badge-subtitle">{mode === 'doctor' ? 'Grad-CAM DR Diagnostics' : 'RAG Health Chatbot'}</span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </main>

    </div>
  );
};

export default Login;

