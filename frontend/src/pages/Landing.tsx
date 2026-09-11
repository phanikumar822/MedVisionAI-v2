import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  ShieldCheck, Activity, Eye, FileText, Lock, Users, ArrowRight, 
  CheckCircle2, UserCheck, Sparkles 
} from 'lucide-react';
import './Landing.css';

const COLS = 20;
const ROWS = 12;

const Landing = () => {
  const [hoveredPos, setHoveredPos] = useState<{ r: number; c: number } | null>(null);
  const [mode, setMode] = useState<'doctor' | 'patient'>('doctor');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLoginSubmit = async (e: React.FormEvent) => {
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
      setError(err.response?.data?.detail || err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="medical-landing-wrapper min-h-screen flex flex-col bg-[#0A0E27] text-white">
      
      {/* Navigation Header */}
      <header className="bg-[#0F172A]/90 border-b border-[#1E293B] sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-md bg-[#0F766E] flex items-center justify-center shadow-md">
              <Eye className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              MedVision<span className="text-[#2DD4BF]">AI</span>
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <Link to="/login" className="text-xs font-semibold text-[#94A3B8] hover:text-white transition">
              Clinical Sign In
            </Link>
            <Link to="/login" className="bg-[#0F766E] hover:bg-[#0D9488] text-white px-4 py-2 rounded-md text-xs font-semibold transition shadow-sm flex items-center gap-1.5">
              <span>Open Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Interactive Hero Section with Animated Grid & Medical '+' Red Boxes Hover */}
      <section className="medical-auth-section">
        
        {/* Animated Background Grid (Interactive '+' shape in red color on hover) */}
        <div className="medical-grid-container" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
          {Array.from({ length: ROWS * COLS }).map((_, idx) => {
            const r = Math.floor(idx / COLS);
            const c = idx % COLS;

            const isCenter = hoveredPos?.r === r && hoveredPos?.c === c;
            const isArm = hoveredPos && (
              (Math.abs(hoveredPos.r - r) === 1 && hoveredPos.c === c) ||
              (hoveredPos.r === r && Math.abs(hoveredPos.c - c) === 1)
            );
            const isRedCross = isCenter || isArm;

            return (
              <span
                key={idx}
                className={`medical-grid-box ${isRedCross ? 'is-red-cross' : ''} ${isCenter ? 'is-red-center' : ''}`}
                onMouseEnter={() => setHoveredPos({ r, c })}
                onMouseLeave={() => setHoveredPos(null)}
              />
            );
          })}
        </div>

        {/* Hero Split Content */}
        <div className="medical-hero-layout">
          
          {/* Left Column: Clinical Product Messaging */}
          <div className="medical-hero-info space-y-6">
            <div className="medical-hero-badge">
              <CheckCircle2 className="w-4 h-4 text-[#2DD4BF]" />
              <span>EfficientNet-B0 Retinal Intelligence</span>
            </div>

            <h1 className="medical-hero-title">
              AI-assisted retinal screening, <span>designed for real-world care.</span>
            </h1>

            <p className="medical-hero-subtext">
              Upload retinal fundus scans, review diagnostic Grad-CAM heatmaps, and issue official clinical screening reports for patients in a secure, role-based workspace.
            </p>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-950/40 border border-red-800/50 text-xs font-mono text-red-300">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              Hover anywhere on the background to reveal red medical cross [+] grid sensors.
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <a href="#clinical-workspace" className="bg-[#0F766E] hover:bg-[#0D9488] text-white px-6 py-3 rounded-lg text-xs font-semibold transition shadow-md text-center">
                Explore Capabilities
              </a>
              <a href="#screening-preview" className="bg-[#1E293B] border border-[#334155] text-white hover:bg-[#334155] px-6 py-3 rounded-lg text-xs font-semibold transition text-center">
                View Sample Scan
              </a>
            </div>
          </div>

          {/* Right Column: Auth Sign In Card (From auth-page design) */}
          <div className="medical-signin-card">
            <div className="content">
              <h2>Clinical Portal</h2>
              
              {/* Doctor vs Patient Mode Switcher */}
              <div className="signin-mode-toggle">
                <button
                  type="button"
                  className={`signin-mode-btn ${mode === 'doctor' ? 'active' : ''}`}
                  onClick={() => { setMode('doctor'); setError(''); }}
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> Doctor Portal
                </button>
                <button
                  type="button"
                  className={`signin-mode-btn ${mode === 'patient' ? 'active' : ''}`}
                  onClick={() => { setMode('patient'); setError(''); }}
                >
                  <UserCheck className="w-3.5 h-3.5" /> Patient Portal
                </button>
              </div>

              {error && (
                <div className="p-2.5 rounded-lg bg-red-900/50 border border-red-500 text-red-200 text-xs">
                  {error}
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="form">
                <div className="inputBox">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                  <i>{mode === 'doctor' ? 'Clinician Username' : 'Patient Username'}</i>
                </div>

                <div className="inputBox">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <i>Password</i>
                </div>

                <div className="links">
                  <Link to="/login">Switch Full View</Link>
                  <Link to="/login">Forgot Password</Link>
                </div>

                <div className="inputBox">
                  <button type="submit" className="submit-btn" disabled={loading}>
                    <Sparkles className="w-4 h-4" />
                    <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

        </div>
      </section>

      {/* PACS Dark Retinal Viewer Showcase */}
      <section className="py-16 bg-[#090D16] border-t border-[#1E293B]" id="screening-preview">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <span className="text-xs font-bold uppercase tracking-widest text-[#2DD4BF]">Live Diagnostic Software Preview</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">Real Retinal Fundus & Grad-CAM Analysis</h2>
          </div>

          <div className="max-w-4xl mx-auto bg-[#0F172A] border border-[#1E293B] rounded-xl shadow-2xl overflow-hidden text-left">
            {/* PACS Dark Header Toolbar */}
            <div className="bg-[#1E293B] border-b border-[#334155] px-4 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span>
                <span className="text-xs font-mono text-[#94A3B8] ml-2">SCREENING RECORD: MV-93320C4B</span>
              </div>
              <span className="px-3 py-1 rounded text-xs font-extrabold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
                NO DR DETECTED
              </span>
            </div>

            {/* Medical Imaging Viewer Content */}
            <div className="p-6 space-y-6 bg-[#090D16]">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2 text-center">
                  <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider block">Original Retinal Scan</span>
                  <div className="aspect-square bg-[#050811] rounded-lg overflow-hidden border border-[#1E293B] p-2 flex items-center justify-center relative shadow-inner">
                    <img 
                      src="/assets/hero_fundus.png" 
                      alt="Original Retinal Scan" 
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute bottom-2 left-2 bg-black/80 border border-slate-800 text-[10px] text-[#94A3B8] px-2 py-0.5 rounded font-mono">
                      ORIGINAL SCAN
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-center">
                  <span className="text-xs font-bold text-[#2DD4BF] uppercase tracking-wider block">AI Attention (Grad-CAM)</span>
                  <div className="aspect-square bg-[#050811] rounded-lg overflow-hidden border border-[#0F766E]/50 p-2 flex items-center justify-center relative shadow-inner">
                    <img 
                      src="/assets/hero_heatmap_overlay.png" 
                      alt="Grad-CAM Attention Heatmap" 
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute bottom-2 left-2 bg-black/80 border border-teal-900 text-[10px] text-[#2DD4BF] px-2 py-0.5 rounded font-mono flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#2DD4BF]"></span>
                      HEATMAP (40% OVERLAY)
                    </div>
                  </div>
                </div>
              </div>

              {/* Metrics Summary Strip */}
              <div className="grid grid-cols-3 gap-3 bg-[#1E293B]/70 p-4 rounded-lg border border-[#334155] text-center text-xs">
                <div>
                  <div className="text-[11px] uppercase font-semibold text-[#94A3B8]">Confidence</div>
                  <div className="font-extrabold text-white text-base mt-0.5">99.2%</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase font-semibold text-[#94A3B8]">Risk Level</div>
                  <div className="font-extrabold text-[#34D399] text-base mt-0.5">LOW</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase font-semibold text-[#94A3B8]">DR Probability</div>
                  <div className="font-extrabold text-white text-base mt-0.5">0.8%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section className="py-16 bg-[#0F172A] border-t border-[#1E293B]" id="clinical-workspace">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-left mb-12 max-w-xl">
            <h2 className="text-2xl font-bold tracking-tight text-white">Clinical Workspace Capabilities</h2>
            <p className="mt-2 text-sm text-[#94A3B8]">Structured tooling for healthcare workers, ophthalmology specialists, and patients.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <CapabilityCard 
              icon={<Activity className="w-5 h-5 text-[#2DD4BF]" />}
              title="Automated DR Grading"
              description="Deep learning evaluation of uploaded retinal fundus images with confidence scoring."
            />
            <CapabilityCard 
              icon={<Eye className="w-5 h-5 text-[#2DD4BF]" />}
              title="Grad-CAM Visual Verification"
              description="Pixel-level visual attention heatmaps highlighting region focus for clinician validation."
            />
            <CapabilityCard 
              icon={<ShieldCheck className="w-5 h-5 text-[#34D399]" />}
              title="Patient Health Portal"
              description="Patient portal access for viewing screening summaries and downloading official PDF reports."
            />
            <CapabilityCard 
              icon={<Users className="w-5 h-5 text-[#F59E0B]" />}
              title="Clinical Directory & Excel Export"
              description="Register patient profiles and export screening outputs in structured Excel (.xlsx) workbooks."
            />
            <CapabilityCard 
              icon={<FileText className="w-5 h-5 text-[#2DD4BF]" />}
              title="Report-Grounded Assistant"
              description="RAG-assisted chatbot providing report-grounded answers to patient questions."
            />
            <CapabilityCard 
              icon={<Lock className="w-5 h-5 text-[#94A3B8]" />}
              title="Role-Based Security & Cookies"
              description="HTTP-only session security and strict role-based access control (RBAC) governance."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center border-t border-[#1E293B] bg-[#0A0E27] text-[#64748B]">
        <div className="max-w-7xl mx-auto px-4 text-xs space-y-1">
          <p className="font-semibold text-white">MedVisionAI Clinical Screening System</p>
          <p>
            This system is an AI-assisted screening tool intended for preliminary assessment support.<br/>
            Final clinical diagnosis must be performed by an authorized healthcare professional.
          </p>
        </div>
      </footer>
    </div>
  );
};

const CapabilityCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="rounded-lg p-6 border border-[#1E293B] bg-[#1a2346]/60 text-left hover:border-[#0F766E] transition shadow-xs">
    <div className="w-9 h-9 rounded-md bg-[#0F172A] border border-[#334155] flex items-center justify-center mb-4">
      {icon}
    </div>
    <h3 className="text-sm font-bold text-white mb-2">{title}</h3>
    <p className="text-xs leading-relaxed text-[#94A3B8]">{description}</p>
  </div>
);

export default Landing;
