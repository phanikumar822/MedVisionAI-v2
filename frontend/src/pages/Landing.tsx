import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Activity, Eye, FileText, Lock, Users, ArrowRight, CheckCircle2 } from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] text-[#0F172A]">
      
      {/* Navigation Header */}
      <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-md bg-[#0F172A] flex items-center justify-center shadow-sm">
              <Eye className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-[#0F172A]">
              MedVision<span className="text-[#0F766E]">AI</span>
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <Link to="/login" className="text-xs font-semibold text-[#475569] hover:text-[#0F172A] transition">
              Clinical Sign In
            </Link>
            <Link to="/login" className="bg-[#0F766E] hover:bg-[#0D9488] text-white px-4 py-2 rounded-md text-xs font-semibold transition shadow-sm flex items-center gap-1.5">
              <span>Open Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 grid lg:grid-cols-12 gap-12 items-center">
        
        {/* Left Column: Messaging */}
        <div className="lg:col-span-6 space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#F0FDFA] border border-[#CCFBF1] text-xs font-semibold text-[#0F766E]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#0F766E]" />
            <span>EfficientNet-B0 Retinal Intelligence</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0F172A] leading-tight">
            AI-assisted retinal screening, <span className="text-[#0F766E]">designed for real-world care.</span>
          </h1>

          <p className="text-sm sm:text-base text-[#475569] leading-relaxed max-w-xl">
            Upload retinal fundus scans, review diagnostic Grad-CAM heatmaps, and issue official clinical screening reports for patients in a secure, role-based workspace.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Link to="/login" className="bg-[#0F766E] hover:bg-[#0D9488] text-white px-6 py-3 rounded-md text-xs font-semibold transition shadow-sm text-center">
              Launch Clinical Portal
            </Link>
            <a href="#clinical-workspace" className="bg-white border border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8F9FA] px-6 py-3 rounded-md text-xs font-semibold transition text-center">
              Capabilities Overview
            </a>
          </div>

          <div className="pt-4 flex items-center gap-6 text-xs text-[#64748B] border-t border-[#E2E8F0]">
            <div><span className="font-bold text-[#0F172A]">Grad-CAM</span> Heatmap Verification</div>
            <div><span className="font-bold text-[#0F172A]">Grok AI</span> Clinical Context</div>
            <div><span className="font-bold text-[#0F172A]">PDF / XLSX</span> Exports</div>
          </div>
        </div>

        {/* Right Column: Real Software UI Preview Mockup */}
        <div className="lg:col-span-6">
          <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-sm overflow-hidden text-left">
            {/* Mock Header */}
            <div className="bg-[#F8F9FA] border-b border-[#E2E8F0] px-4 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span>
                <span className="text-xs font-mono text-[#64748B] ml-2">Screening ID: MV-0F1B84F1</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
                NO DR DETECTED
              </span>
            </div>

            {/* Mock Workspace Content */}
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 text-center">
                  <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">Original Fundus</span>
                  <div className="aspect-square bg-slate-950 rounded-md overflow-hidden flex items-center justify-center border border-[#E2E8F0]">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-700 via-orange-600 to-amber-500 opacity-90 border border-amber-300 flex items-center justify-center">
                      <div className="w-4 h-4 rounded-full bg-amber-200 blur-xs"></div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 text-center">
                  <span className="text-[11px] font-semibold text-[#0F766E] uppercase tracking-wider">Grad-CAM Heatmap</span>
                  <div className="aspect-square bg-slate-950 rounded-md overflow-hidden flex items-center justify-center border border-[#0F766E]/30 relative">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-700 via-emerald-600 to-amber-500 opacity-90 border border-emerald-300 flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full bg-red-500 opacity-60 blur-xs"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Metrics Row */}
              <div className="grid grid-cols-3 gap-2 bg-[#F8F9FA] p-3 rounded-md border border-[#E2E8F0] text-center text-xs">
                <div>
                  <div className="text-[11px] text-[#64748B]">Confidence</div>
                  <div className="font-bold text-[#0F172A]">94.2%</div>
                </div>
                <div>
                  <div className="text-[11px] text-[#64748B]">Risk Level</div>
                  <div className="font-bold text-[#059669]">LOW</div>
                </div>
                <div>
                  <div className="text-[11px] text-[#64748B]">DR Probability</div>
                  <div className="font-bold text-[#0F172A]">5.8%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section className="py-16 border-t border-[#E2E8F0] bg-white" id="clinical-workspace">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-left mb-12 max-w-xl">
            <h2 className="text-2xl font-bold tracking-tight text-[#0F172A]">Clinical Workspace Capabilities</h2>
            <p className="mt-2 text-sm text-[#475569]">Structured tooling for healthcare workers, ophthalmology specialists, and patients.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <CapabilityCard 
              icon={<Activity className="w-5 h-5 text-[#0F766E]" />}
              title="Automated DR Grading"
              description="Deep learning evaluation of uploaded retinal fundus images with confidence scoring."
            />
            <CapabilityCard 
              icon={<Eye className="w-5 h-5 text-[#0F766E]" />}
              title="Grad-CAM Visual Verification"
              description="Pixel-level visual attention heatmaps highlighting region focus for clinician validation."
            />
            <CapabilityCard 
              icon={<ShieldCheck className="w-5 h-5 text-[#059669]" />}
              title="Patient Health Portal"
              description="Patient portal access for viewing screening summaries and downloading official PDF reports."
            />
            <CapabilityCard 
              icon={<Users className="w-5 h-5 text-[#D97706]" />}
              title="Clinical Directory & Excel Export"
              description="Register patient profiles and export screening outputs in structured Excel (.xlsx) workbooks."
            />
            <CapabilityCard 
              icon={<FileText className="w-5 h-5 text-[#0F766E]" />}
              title="Report-Grounded Assistant"
              description="RAG-assisted chatbot providing report-grounded answers to patient questions."
            />
            <CapabilityCard 
              icon={<Lock className="w-5 h-5 text-[#475569]" />}
              title="Role-Based Security & Cookies"
              description="HTTP-only session security and strict role-based access control (RBAC) governance."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center border-t border-[#E2E8F0] bg-[#F8F9FA] text-[#64748B]">
        <div className="max-w-7xl mx-auto px-4 text-xs space-y-1">
          <p className="font-semibold text-[#0F172A]">MedVisionAI Clinical Screening System</p>
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
  <div className="rounded-lg p-6 border border-[#E2E8F0] bg-[#F8F9FA] text-left hover:border-[#CBD5E1] transition">
    <div className="w-9 h-9 rounded-md bg-white border border-[#E2E8F0] flex items-center justify-center mb-4 shadow-2xs">
      {icon}
    </div>
    <h3 className="text-sm font-bold text-[#0F172A] mb-2">{title}</h3>
    <p className="text-xs leading-relaxed text-[#475569]">{description}</p>
  </div>
);

export default Landing;



