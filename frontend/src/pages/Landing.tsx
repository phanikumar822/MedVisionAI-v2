import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Activity, Eye, FileText, Lock, Users } from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Eye className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-slate-900 tracking-tight">MedVisionAI</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition">
              Sign In
            </Link>
            <Link to="/login" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm">
              Start Screening
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 lg:py-32 bg-gradient-to-b from-blue-50 to-slate-50">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl leading-tight">
          AI-Assisted Diabetic Retinopathy <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Screening</span>
        </h1>
        <p className="mt-6 text-xl text-slate-600 max-w-2xl">
          Get rapid, explainable screening insights from retinal fundus images and securely access your results online. Screen. Explain. Share. Understand.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <Link to="/login" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-medium transition shadow-md">
            Start Screening
          </Link>
          <a href="#how-it-works" className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-8 py-3 rounded-lg text-lg font-medium transition shadow-sm">
            How It Works
          </a>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white" id="how-it-works">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">Comprehensive Screening Platform</h2>
            <p className="mt-4 text-lg text-slate-600">Addressing limited specialist access through secure, online AI-assisted preliminary screening.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Activity className="w-8 h-8 text-blue-500" />}
              title="AI Screening"
              description="EfficientNet-B0 based preliminary analysis of retinal fundus images with integrated image quality validation."
            />
            <FeatureCard 
              icon={<Eye className="w-8 h-8 text-indigo-500" />}
              title="Explainable AI"
              description="Grad-CAM attention maps highlight regions contributing to the model's prediction for clinical interpretability."
            />
            <FeatureCard 
              icon={<ShieldCheck className="w-8 h-8 text-emerald-500" />}
              title="Secure Patient Portal"
              description="Patients securely log in to access their own PDF reports without needing to physically return to the clinic."
            />
            <FeatureCard 
              icon={<Users className="w-8 h-8 text-amber-500" />}
              title="Specialist Referral"
              description="Seamless referral workflow allowing qualified eye-care professionals to review high-priority screening results."
            />
            <FeatureCard 
              icon={<FileText className="w-8 h-8 text-purple-500" />}
              title="Report-Grounded Assistant"
              description="An integrated RAG chatbot helps patients understand their results using only their authorized report context."
            />
            <FeatureCard 
              icon={<Lock className="w-8 h-8 text-slate-500" />}
              title="Patient Data Isolation"
              description="Strict role-based access control and patient-scoped data retrieval ensures complete privacy."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 text-center">
        <p className="text-sm">
          MedVisionAI is an AI-assisted screening tool intended to support preliminary assessment.<br/>
          It does not provide a definitive medical diagnosis or replace evaluation by a qualified healthcare professional.
        </p>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:shadow-lg transition duration-300">
    <div className="bg-white w-14 h-14 rounded-xl flex items-center justify-center shadow-sm mb-6">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
    <p className="text-slate-600 leading-relaxed">{description}</p>
  </div>
);

export default Landing;
