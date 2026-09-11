import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Eye, ShieldCheck, UserCheck, Lock, User, ArrowRight, Sparkles, Activity, MessageSquare, CheckCircle2, ArrowLeft } from 'lucide-react';
import './Login.css';

const Login = () => {
  const [isRightPanelActive, setIsRightPanelActive] = useState(false); // false = Doctor Portal, true = Patient Portal
  
  // Doctor form state
  const [docUsername, setDocUsername] = useState('');
  const [docPassword, setDocPassword] = useState('');
  const [docError, setDocError] = useState('');

  // Patient form state
  const [patUsername, setPatUsername] = useState('');
  const [patPassword, setPatPassword] = useState('');
  const [patError, setPatError] = useState('');

  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleDoctorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDocError('');
    setLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append('username', docUsername.trim());
      formData.append('password', docPassword);

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
      setDocError(err.response?.data?.detail || err.message || 'Invalid doctor username or password.');
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPatError('');
    setLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append('username', patUsername.trim());
      formData.append('password', patPassword);

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
      setPatError(err.response?.data?.detail || err.message || 'Invalid patient username or password.');
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo fill handlers
  const fillDoctorDemo = () => {
    setDocUsername('worker1');
    setDocPassword('password123');
    setDocError('');
  };

  const fillAdminDemo = () => {
    setDocUsername('medvision.admin');
    setDocPassword('admin123');
    setDocError('');
  };

  const fillPatientDemo = () => {
    setPatUsername('patient1');
    setPatPassword('password123');
    setPatError('');
  };

  return (
    <div className="auth-page-root">
      
      {/* Top Navigation */}
      <header className="auth-navbar">
        <div className="nav-brand">
          <div className="nav-logo-box">
            <Eye className="w-5 h-5 text-white" />
          </div>
          <span className="nav-brand-text">MedVision<span>AI</span></span>
        </div>

        <div className="nav-right-actions">
          <span className="system-status-badge">
            <span className="status-dot"></span> AI Screening Server Active
          </span>
        </div>
      </header>

      {/* Main Container with Sliding Panel */}
      <main className="auth-hero-container">
        
        <div className={`auth-sliding-container ${isRightPanelActive ? 'right-panel-active' : ''}`} id="authContainer">
          
          {/* ==================== 1. DOCTOR PORTAL FORM (LEFT SIDE) ==================== */}
          <div className="form-container doctor-portal-container">
            <form onSubmit={handleDoctorSubmit} className="auth-form">
              
              <div className="form-header">
                <div className="portal-tag doctor-tag">
                  <ShieldCheck className="w-4 h-4 text-[#0F766E]" /> DOCTOR & CLINICIAN PORTAL
                </div>
                <h1 className="form-title">Clinician Sign In</h1>
                <p className="form-subtitle">Access retinal fundus diagnostic workspace and Grad-CAM AI heatmaps.</p>
              </div>

              {docError && <div className="error-banner">{docError}</div>}

              <div className="form-fields">
                <div className="input-group">
                  <label>Doctor / Admin Username</label>
                  <div className="input-field-wrap">
                    <User className="input-icon text-[#64748B]" />
                    <input
                      type="text"
                      value={docUsername}
                      onChange={(e) => setDocUsername(e.target.value)}
                      placeholder="e.g. worker1 or medvision.admin"
                      required
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label>Password</label>
                  <div className="input-field-wrap">
                    <Lock className="input-icon text-[#64748B]" />
                    <input
                      type="password"
                      value={docPassword}
                      onChange={(e) => setDocPassword(e.target.value)}
                      placeholder="Enter password"
                      required
                    />
                  </div>
                </div>
              </div>

              <button type="submit" className="submit-btn doctor-submit-btn" disabled={loading}>
                <Sparkles className="w-4 h-4" />
                {loading ? 'Authenticating...' : 'Sign In to Doctor Portal'}
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Quick Demo Credentials */}
              <div className="demo-credentials-box">
                <span className="demo-title">Quick Demo Login:</span>
                <div className="demo-btn-group">
                  <button type="button" onClick={fillDoctorDemo} className="demo-chip">
                    Dr. Worker (`worker1`)
                  </button>
                  <button type="button" onClick={fillAdminDemo} className="demo-chip admin-chip">
                    Admin (`medvision.admin`)
                  </button>
                </div>
              </div>

              <p className="mobile-switch-hint md:hidden">
                Are you a Patient?{' '}
                <button type="button" onClick={() => setIsRightPanelActive(true)} className="mobile-switch-btn">
                  Switch to Patient Portal →
                </button>
              </p>
            </form>
          </div>

          {/* ==================== 2. PATIENT PORTAL FORM (RIGHT SIDE) ==================== */}
          <div className="form-container patient-portal-container">
            <form onSubmit={handlePatientSubmit} className="auth-form">
              
              <div className="form-header">
                <div className="portal-tag patient-tag">
                  <UserCheck className="w-4 h-4 text-[#047857]" /> PATIENT HEALTH PORTAL
                </div>
                <h1 className="form-title">Patient Sign In</h1>
                <p className="form-subtitle">View your DR screening results, download PDF reports, & ask AI assistant.</p>
              </div>

              {patError && <div className="error-banner">{patError}</div>}

              <div className="form-fields">
                <div className="input-group">
                  <label>Patient Username</label>
                  <div className="input-field-wrap">
                    <User className="input-icon text-[#64748B]" />
                    <input
                      type="text"
                      value={patUsername}
                      onChange={(e) => setPatUsername(e.target.value)}
                      placeholder="e.g. patient1"
                      required
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label>Password</label>
                  <div className="input-field-wrap">
                    <Lock className="input-icon text-[#64748B]" />
                    <input
                      type="password"
                      value={patPassword}
                      onChange={(e) => setPatPassword(e.target.value)}
                      placeholder="Enter password"
                      required
                    />
                  </div>
                </div>
              </div>

              <button type="submit" className="submit-btn patient-submit-btn" disabled={loading}>
                <Sparkles className="w-4 h-4" />
                {loading ? 'Authenticating...' : 'Sign In to Patient Portal'}
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Quick Demo Credentials */}
              <div className="demo-credentials-box">
                <span className="demo-title">Quick Demo Login:</span>
                <button type="button" onClick={fillPatientDemo} className="demo-chip patient-chip">
                  Patient (`patient1`)
                </button>
              </div>

              <p className="mobile-switch-hint md:hidden">
                Are you a Doctor?{' '}
                <button type="button" onClick={() => setIsRightPanelActive(false)} className="mobile-switch-btn">
                  Switch to Doctor Portal →
                </button>
              </p>
            </form>
          </div>

          {/* ==================== 3. ORANGE SLIDING OVERLAY CONTAINER ==================== */}
          <div className="overlay-container">
            <div className="overlay">
              
              {/* Left Overlay Panel (Shown when Patient form is active on right) */}
              <div className="overlay-panel overlay-left">
                <div className="overlay-badge">
                  <Activity className="w-4 h-4 text-white" /> Clinician Diagnostic Suite
                </div>
                <h1 className="overlay-title">Doctor Portal</h1>
                <p className="overlay-text">
                  Are you a Healthcare Professional? Sign in to run AI inference on retinal fundus scans, inspect Grad-CAM heatmaps, and publish official patient reports.
                </p>

                {/* Portal Showcase Image Frame */}
                <div className="overlay-image-card">
                  <img src="/assets/doctor_portal_hero.jpg" alt="Doctor Portal Preview" className="overlay-img" />
                  <div className="overlay-img-caption">
                    <Activity className="w-3.5 h-3.5 text-teal-400" />
                    <span>Grad-CAM DR Heatmap Diagnostics</span>
                  </div>
                </div>

                <button 
                  type="button" 
                  className="ghost-toggle-btn" 
                  onClick={() => setIsRightPanelActive(false)}
                >
                  <ArrowLeft className="w-4 h-4" /> Switch to Doctor Portal
                </button>
              </div>

              {/* Right Overlay Panel (Shown when Doctor form is active on left) */}
              <div className="overlay-panel overlay-right">
                <div className="overlay-badge">
                  <MessageSquare className="w-4 h-4 text-white" /> Patient Health Records
                </div>
                <h1 className="overlay-title">Patient Portal</h1>
                <p className="overlay-text">
                  Looking for your screening results? Sign in to view your latest eye test report, download official clinical PDFs, and chat with our RAG diagnostic assistant.
                </p>

                {/* Portal Showcase Image Frame */}
                <div className="overlay-image-card">
                  <img src="/assets/patient_portal_hero.jpg" alt="Patient Portal Preview" className="overlay-img" />
                  <div className="overlay-img-caption">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Grounded Diagnostic PDF & Assistant</span>
                  </div>
                </div>

                <button 
                  type="button" 
                  className="ghost-toggle-btn" 
                  onClick={() => setIsRightPanelActive(true)}
                >
                  Switch to Patient Portal <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          </div>

        </div>

      </main>

    </div>
  );
};

export default Login;
