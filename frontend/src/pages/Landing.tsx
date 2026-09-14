import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Activity, Eye, FileText, Lock, Users, ArrowRight, CheckCircle2 } from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#0B111E] text-slate-100 selection:bg-teal-500/30 selection:text-teal-200 font-sans">
      
      {/* Hero Wrapper with Photorealistic Clinic Background & Ambient Lighting */}
      <div className="relative min-h-[88vh] lg:min-h-[94vh] flex flex-col bg-[url('/assets/clinic_hero_bg.jpg')] bg-cover bg-center bg-no-repeat overflow-hidden">
        {/* Soft Clinical Vignette Overlay for Crisp Typography & Glass Contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/65 via-slate-900/40 to-[#0B111E] pointer-events-none" />
        <div className="absolute inset-0 bg-radial-[circle_at_50%_30%] from-transparent via-slate-950/20 to-slate-950/70 pointer-events-none" />

        {/* Floating Glassmorphic Navigation Bar */}
        <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-2 relative z-30">
          <div className="backdrop-blur-xl bg-slate-900/50 border border-white/20 rounded-2xl px-5 sm:px-7 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.35)] flex items-center justify-between">
            {/* Logo / Brand */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-teal-400/20 border border-teal-300/40 flex items-center justify-center shadow-[0_0_16px_rgba(45,212,191,0.35)]">
                <Eye className="w-4 h-4 text-teal-300" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white">
                MedVision<span className="text-teal-400">AI</span>
              </span>
            </div>

            {/* Nav Actions */}
            <div className="flex items-center space-x-3 sm:space-x-5">
              <Link 
                to="/login" 
                className="text-xs sm:text-sm font-medium text-slate-200 hover:text-white transition px-2 py-1"
              >
                Clinical Sign In
              </Link>
              <Link 
                to="/login" 
                className="backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/25 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition shadow-sm flex items-center gap-1.5 group"
              >
                <span>Open Workspace</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform text-teal-300" />
              </Link>
            </div>
          </div>
        </header>

        {/* Floating Hero Panels */}
        <section className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 grid lg:grid-cols-12 gap-8 items-center relative z-20">
          
          {/* Left Panel: Glassmorphic Clinical Briefing */}
          <div className="lg:col-span-6">
            <div className="backdrop-blur-2xl bg-slate-900/50 border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.45)] rounded-3xl p-7 sm:p-9 space-y-6 text-left relative overflow-hidden">
              {/* Subtle ambient cyan glow inside card */}
              <div className="absolute -top-20 -left-20 w-44 h-44 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

              {/* Status Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/15 border border-teal-400/30 text-xs font-medium text-teal-300 backdrop-blur-md">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-300" />
                <span>EfficientNet-B0 Retinal Intelligence</span>
              </div>

              {/* Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.18]">
                AI-assisted retinal screening, <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-teal-200 to-emerald-300">designed for real-world care.</span>
              </h1>

              {/* Clinical Description */}
              <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-normal drop-shadow-xs">
                Upload retinal fundus scans, review diagnostic Grad-CAM heatmaps, and issue official clinical screening reports for patients in a secure, role-based workspace.
              </p>

              {/* Call-to-Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <Link 
                  to="/login" 
                  className="bg-gradient-to-r from-teal-400 via-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 font-bold px-7 py-3 rounded-full text-xs sm:text-sm tracking-wide shadow-[0_0_24px_rgba(45,212,191,0.35)] transition transform hover:-translate-y-0.5 text-center flex items-center justify-center"
                >
                  Launch Clinical Portal
                </Link>
                <a 
                  href="#clinical-workspace" 
                  className="backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/25 text-white font-semibold px-6 py-3 rounded-full text-xs sm:text-sm transition text-center flex items-center justify-center"
                >
                  Capabilities Overview
                </a>
              </div>

              {/* Feature Highlights Footer */}
              <div className="pt-4 flex items-center flex-wrap gap-2.5 sm:gap-4 text-xs text-slate-300 border-t border-white/15">
                <div><span className="font-semibold text-white">Grad-CAM</span> Heatmap Verification</div>
                <span className="text-teal-400/60">•</span>
                <div><span className="font-semibold text-white">Grok AI</span> Clinical Context</div>
                <span className="text-teal-400/60">•</span>
                <div><span className="font-semibold text-white">PDF / XLSX</span> Exports</div>
              </div>
            </div>
          </div>

          {/* Right Panel: Retinal Diagnostics HUD */}
          <div className="lg:col-span-6">
            <div className="space-y-3.5">
              {/* Top HUD Status Bar */}
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse"></span>
                  <span className="text-[11px] font-mono text-slate-300 tracking-wider">SYSTEM STATUS: OPTIMAL</span>
                </div>
                <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-teal-500/20 text-teal-300 border border-teal-400/40 backdrop-blur-md shadow-[0_0_12px_rgba(45,212,191,0.2)]">
                  SCREENING SUCCESSFUL • NO DR DETECTED
                </span>
              </div>

              {/* Dual Imaging Viewer Glass Cards (Authentic Medical Retinal Scans) */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {/* Original Fundus Card */}
                <div className="backdrop-blur-2xl bg-slate-900/50 border border-white/20 rounded-2xl p-3 sm:p-4 shadow-[0_12px_35px_rgba(0,0,0,0.35)] space-y-2 text-center transition hover:border-white/35">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Original Fundus</span>
                    <span className="text-[9px] font-mono text-slate-400">MACULA-CENTERED</span>
                  </div>
                  <div className="aspect-square bg-slate-950/80 rounded-xl overflow-hidden border border-white/10 p-2 flex items-center justify-center relative shadow-inner">
                    <img 
                      src="/assets/hero_fundus.png" 
                      alt="Original Retinal Scan" 
                      className="w-full h-full object-contain filter contrast-105"
                    />
                    <div className="absolute bottom-2 left-2 bg-black/80 border border-white/15 backdrop-blur-md text-[9px] text-slate-300 px-2 py-0.5 rounded-md font-mono">
                      ORIGINAL SCAN
                    </div>
                  </div>
                </div>

                {/* Grad-CAM Attention Card */}
                <div className="backdrop-blur-2xl bg-slate-900/50 border border-teal-400/35 rounded-2xl p-3 sm:p-4 shadow-[0_12px_35px_rgba(0,0,0,0.35),0_0_25px_rgba(45,212,191,0.12)] space-y-2 text-center transition hover:border-teal-400/60">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-bold text-teal-300 uppercase tracking-wider">AI Attention (Grad-CAM)</span>
                    <span className="text-[9px] font-mono text-teal-400/80">EFFICIENTNET-B0</span>
                  </div>
                  <div className="aspect-square bg-slate-950/80 rounded-xl overflow-hidden border border-teal-500/30 p-2 flex items-center justify-center relative shadow-inner">
                    <img 
                      src="/assets/hero_heatmap_overlay.png" 
                      alt="Grad-CAM Attention Heatmap" 
                      className="w-full h-full object-contain filter brightness-105"
                    />
                    <div className="absolute bottom-2 left-2 bg-slate-950/85 border border-teal-400/40 backdrop-blur-md text-[9px] text-teal-300 px-2 py-0.5 rounded-md font-mono flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shadow-[0_0_6px_rgba(45,212,191,0.8)]"></span>
                      HEATMAP (40% OVERLAY)
                    </div>
                  </div>
                </div>
              </div>

              {/* Metrics Summary Strip */}
              <div className="backdrop-blur-2xl bg-slate-900/50 border border-white/20 rounded-2xl p-3.5 sm:p-4 shadow-[0_12px_35px_rgba(0,0,0,0.35)] grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Confidence</div>
                  <div className="font-extrabold text-white text-base sm:text-lg">99.2%</div>
                </div>
                <div className="border-x border-white/10">
                  <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Risk Level</div>
                  <div className="font-extrabold text-emerald-400 text-base sm:text-lg drop-shadow-[0_0_10px_rgba(52,211,153,0.4)]">LOW</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">DR Probability</div>
                  <div className="font-extrabold text-white text-base sm:text-lg">0.8%</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Features Grid Section */}
      <section className="py-20 border-t border-slate-800/80 bg-[#0F172A] relative z-20" id="clinical-workspace">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-left mb-12 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-400/20 text-xs font-semibold text-teal-300 mb-3">
              <span>Platform Capabilities</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Clinical Workspace Capabilities</h2>
            <p className="mt-2 text-sm text-slate-400">Structured tooling for healthcare workers, ophthalmology specialists, and patients.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <CapabilityCard 
              icon={<Activity className="w-5 h-5 text-teal-400" />}
              title="Automated DR Grading"
              description="Deep learning evaluation of uploaded retinal fundus images with confidence scoring."
            />
            <CapabilityCard 
              icon={<Eye className="w-5 h-5 text-teal-400" />}
              title="Grad-CAM Visual Verification"
              description="Pixel-level visual attention heatmaps highlighting region focus for clinician validation."
            />
            <CapabilityCard 
              icon={<ShieldCheck className="w-5 h-5 text-emerald-400" />}
              title="Patient Health Portal"
              description="Patient portal access for viewing screening summaries and downloading official PDF reports."
            />
            <CapabilityCard 
              icon={<Users className="w-5 h-5 text-amber-400" />}
              title="Clinical Directory & Excel Export"
              description="Register patient profiles and export screening outputs in structured Excel (.xlsx) workbooks."
            />
            <CapabilityCard 
              icon={<FileText className="w-5 h-5 text-teal-400" />}
              title="Report-Grounded Assistant"
              description="RAG-assisted chatbot providing report-grounded answers to patient questions."
            />
            <CapabilityCard 
              icon={<Lock className="w-5 h-5 text-slate-400" />}
              title="Role-Based Security & Cookies"
              description="HTTP-only session security and strict role-based access control (RBAC) governance."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center border-t border-slate-800/80 bg-[#090D16] text-slate-400 relative z-20">
        <div className="max-w-7xl mx-auto px-4 text-xs space-y-1">
          <p className="font-semibold text-slate-200">MedVisionAI Clinical Screening System</p>
          <p className="text-slate-400">
            This system is an AI-assisted screening tool intended for preliminary assessment support.<br/>
            Final clinical diagnosis must be performed by an authorized healthcare professional.
          </p>
        </div>
      </footer>
    </div>
  );
};

const CapabilityCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="rounded-2xl p-6 border border-slate-800/90 bg-slate-900/60 hover:bg-slate-900/90 hover:border-slate-700/80 text-left transition shadow-sm group">
    <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mb-4 group-hover:border-teal-500/30 transition shadow-inner">
      {icon}
    </div>
    <h3 className="text-sm font-bold text-white mb-2">{title}</h3>
    <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
  </div>
);

export default Landing;
