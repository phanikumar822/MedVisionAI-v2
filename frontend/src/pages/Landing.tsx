import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Activity, Eye, FileText, Lock, Users } from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#23211E]">
      {/* Header */}
      <header className="bg-white border-b border-[#EBE5DD] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-[#1E1E1E] flex items-center justify-center shadow-sm">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight">MedVision<span className="text-[#C85A32]">AI</span></span>
          </div>
          <div className="flex items-center space-x-3">
            <Link to="/login" className="text-xs font-bold transition px-3 py-2 text-[#706B63] hover:text-[#23211E]">
              Sign In
            </Link>
            <Link to="/login" className="bg-[#1E1E1E] hover:bg-[#3D3A36] text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm">
              Start Screening
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 lg:py-28">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight max-w-4xl leading-tight">
          Diabetic Retinopathy <span className="text-[#C85A32]">Screening System</span>
        </h1>
        <p className="mt-6 text-lg max-w-2xl leading-relaxed text-[#706B63]">
          Upload retinal fundus images, view diagnostic Grad-CAM heatmaps, and generate official clinical reports for your patients.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <Link to="/login" className="bg-[#1E1E1E] hover:bg-[#3D3A36] text-white px-8 py-3.5 rounded-xl text-base font-bold transition shadow-md hover:scale-[1.01]">
            Start Screening
          </Link>
          <a href="#how-it-works" className="bg-white border border-[#EBE5DD] text-[#23211E] hover:bg-[#FAF7F2] px-8 py-3.5 rounded-xl text-base font-bold transition">
            How It Works
          </a>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 border-t border-[#EBE5DD] bg-white" id="how-it-works">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black">Clinical Screening Features</h2>
            <p className="mt-4 text-base text-[#706B63]">Built for healthcare workers and patients to simplify eye screening workflows.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Activity className="w-6 h-6 text-[#C85A32]" />}
              title="Retinal Image Analysis"
              description="Preliminary screening of retinal fundus images with instant Diabetic Retinopathy severity grading."
            />
            <FeatureCard 
              icon={<Eye className="w-6 h-6 text-[#C85A32]" />}
              title="Grad-CAM Heatmaps"
              description="Visual attention maps highlight key retinal regions to support clinical verification."
            />
            <FeatureCard 
              icon={<ShieldCheck className="w-6 h-6 text-[#2E7D32]" />}
              title="Patient Health Portal"
              description="Patients securely log in to view their screening results and download official PDF reports."
            />
            <FeatureCard 
              icon={<Users className="w-6 h-6 text-[#D97706]" />}
              title="Patient Record Management"
              description="Clinical workers can register new patients and export patient records in Excel (.xlsx) format."
            />
            <FeatureCard 
              icon={<FileText className="w-6 h-6 text-[#C85A32]" />}
              title="Report-Grounded Assistant"
              description="An integrated chatbot answers patient questions based only on their authorized test report."
            />
            <FeatureCard 
              icon={<Lock className="w-6 h-6 text-[#4A4640]" />}
              title="Secure Account Access"
              description="Strict role-based privacy and single-use password activation links sent via email."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 text-center border-t border-[#EBE5DD] bg-[#FAF7F2] text-[#706B63]">
        <p className="text-xs">
          MedVisionAI is an AI-assisted screening tool intended to support preliminary assessment.<br/>
          It does not provide a definitive medical diagnosis or replace evaluation by a qualified healthcare professional.
        </p>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="rounded-2xl p-8 border border-[#EBE5DD] bg-[#FAF7F2]">
    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 bg-white shadow-sm border border-[#EBE5DD]">
      {icon}
    </div>
    <h3 className="text-lg font-extrabold mb-3 text-[#23211E]">{title}</h3>
    <p className="text-sm leading-relaxed text-[#706B63]">{description}</p>
  </div>
);

export default Landing;


