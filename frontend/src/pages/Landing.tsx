import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { ShieldCheck, Activity, Eye, FileText, Lock, Users, Sun, Moon } from 'lucide-react';

const Landing = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F6F0] dark:bg-[#0D0F12] text-[#1A1917] dark:text-[#F3F4F6] transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-[#16191E] border-b border-[#E6E1D7] dark:border-[#262B34] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-[#1A1917] dark:bg-[#C85A32] flex items-center justify-center shadow-sm">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-[#1A1917] dark:text-[#F3F4F6]">MedVision<span className="text-[#C85A32] dark:text-[#E06D44]">AI</span></span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-[#E6E1D7] dark:border-[#262B34] bg-white dark:bg-[#16191E] text-[#706B63] dark:text-[#9CA3AF] hover:text-[#1A1917] dark:hover:text-white transition shadow-sm"
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            >
              {theme === 'light' ? <Moon className="w-4 h-4 text-[#C85A32]" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>
            <Link to="/login" className="text-xs font-bold transition px-3 py-2 text-[#706B63] dark:text-[#9CA3AF] hover:text-[#1A1917] dark:hover:text-white">
              Sign In
            </Link>
            <Link to="/login" className="bg-[#1A1917] dark:bg-[#C85A32] hover:bg-[#3D3A36] dark:hover:bg-[#D96B43] text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm">
              Start Screening
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-16 lg:py-24 max-w-6xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#E6E1D7] dark:border-[#262B34] bg-white dark:bg-[#16191E] shadow-sm mb-6 text-xs font-bold text-[#C85A32] dark:text-[#E06D44]">
          <span className="w-2 h-2 rounded-full bg-[#C85A32] animate-pulse"></span>
          Clinical AI Diagnostic Workspace v2.4
        </div>
        
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight max-w-4xl leading-tight text-[#1A1917] dark:text-[#F3F4F6]">
          Precision Screening for <span className="text-[#C85A32] dark:text-[#E06D44]">Diabetic Retinopathy</span>
        </h1>
        <p className="mt-6 text-base md:text-lg max-w-2xl leading-relaxed text-[#706B63] dark:text-[#9CA3AF]">
          Upload retinal fundus images, inspect real-time Grad-CAM heatmaps, export Excel clinical registries, and grant patient report access securely.
        </p>

        {/* Quick Portal Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
          <Link to="/login" className="bg-[#1A1917] dark:bg-[#C85A32] hover:bg-[#3D3A36] dark:hover:bg-[#D96B43] text-white px-8 py-3.5 rounded-xl text-sm font-bold transition shadow-md hover:scale-[1.01] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> Doctor & Admin Access
          </Link>
          <Link to="/login" className="bg-white dark:bg-[#16191E] border border-[#E6E1D7] dark:border-[#262B34] text-[#1A1917] dark:text-[#F3F4F6] hover:bg-[#F8F6F0] dark:hover:bg-[#1F242D] px-8 py-3.5 rounded-xl text-sm font-bold transition flex items-center gap-2">
            <Users className="w-4 h-4 text-[#C85A32]" /> Patient Health Portal
          </Link>
        </div>

        {/* Executive Stats Strip */}
        <div className="mt-14 w-full grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl border border-[#E6E1D7] dark:border-[#262B34] bg-white dark:bg-[#16191E] shadow-sm">
          <div className="p-3 text-center border-r border-[#E6E1D7] dark:border-[#262B34] last:border-r-0">
            <p className="text-2xl font-black text-[#1A1917] dark:text-[#F3F4F6]">98.6%</p>
            <p className="text-xs font-semibold text-[#706B63] dark:text-[#9CA3AF] mt-0.5">AI Sensitivity</p>
          </div>
          <div className="p-3 text-center border-r border-[#E6E1D7] dark:border-[#262B34] last:border-r-0">
            <p className="text-2xl font-black text-[#C85A32] dark:text-[#E06D44]">&lt; 2 Sec</p>
            <p className="text-xs font-semibold text-[#706B63] dark:text-[#9CA3AF] mt-0.5">Grad-CAM Speed</p>
          </div>
          <div className="p-3 text-center border-r border-[#E6E1D7] dark:border-[#262B34] last:border-r-0">
            <p className="text-2xl font-black text-[#2E7D32] dark:text-[#4ADE80]">.XLSX</p>
            <p className="text-xs font-semibold text-[#706B63] dark:text-[#9CA3AF] mt-0.5">Excel Export Ready</p>
          </div>
          <div className="p-3 text-center">
            <p className="text-2xl font-black text-[#1A1917] dark:text-[#F3F4F6]">AES-256</p>
            <p className="text-xs font-semibold text-[#706B63] dark:text-[#9CA3AF] mt-0.5">Encrypted Security</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 border-t border-[#E6E1D7] dark:border-[#262B34] bg-white dark:bg-[#16191E]" id="how-it-works">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-[#1A1917] dark:text-[#F3F4F6]">Clinical Screening Features</h2>
            <p className="mt-4 text-base text-[#706B63] dark:text-[#9CA3AF]">Built for healthcare workers and patients to simplify eye screening workflows.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Activity className="w-6 h-6 text-[#C85A32] dark:text-[#E06D44]" />}
              title="Retinal Image Analysis"
              description="Preliminary screening of retinal fundus images with instant Diabetic Retinopathy severity grading."
            />
            <FeatureCard 
              icon={<Eye className="w-6 h-6 text-[#C85A32] dark:text-[#E06D44]" />}
              title="Grad-CAM Heatmaps"
              description="Visual attention maps highlight key retinal regions to support clinical verification."
            />
            <FeatureCard 
              icon={<ShieldCheck className="w-6 h-6 text-[#2E7D32] dark:text-[#4ADE80]" />}
              title="Patient Health Portal"
              description="Patients securely log in to view their screening results and download official PDF reports."
            />
            <FeatureCard 
              icon={<Users className="w-6 h-6 text-[#D97706] dark:text-[#F59E0B]" />}
              title="Patient Record Management"
              description="Clinical workers can register new patients and export patient records in Excel (.xlsx) format."
            />
            <FeatureCard 
              icon={<FileText className="w-6 h-6 text-[#C85A32] dark:text-[#E06D44]" />}
              title="Report-Grounded Assistant"
              description="An integrated chatbot answers patient questions based only on their authorized test report."
            />
            <FeatureCard 
              icon={<Lock className="w-6 h-6 text-[#4A4640] dark:text-[#9CA3AF]" />}
              title="Secure Account Access"
              description="Strict role-based privacy and single-use password activation links sent via email."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 text-center border-t border-[#E6E1D7] dark:border-[#262B34] bg-[#F8F6F0] dark:bg-[#0D0F12] text-[#706B63] dark:text-[#9CA3AF]">
        <p className="text-xs">
          MedVisionAI is an AI-assisted screening tool intended to support preliminary assessment.<br/>
          It does not provide a definitive medical diagnosis or replace evaluation by a qualified healthcare professional.
        </p>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="rounded-2xl p-8 border border-[#E6E1D7] dark:border-[#262B34] bg-[#F8F6F0] dark:bg-[#0D0F12]">
    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 bg-white dark:bg-[#16191E] shadow-sm border border-[#E6E1D7] dark:border-[#262B34]">
      {icon}
    </div>
    <h3 className="text-lg font-extrabold mb-3 text-[#1A1917] dark:text-[#F3F4F6]">{title}</h3>
    <p className="text-sm leading-relaxed text-[#706B63] dark:text-[#9CA3AF]">{description}</p>
  </div>
);

export default Landing;


