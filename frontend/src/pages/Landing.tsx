import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Activity, Eye, FileText, Lock, Users, Sun, Moon } from 'lucide-react';

const Landing = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${theme === 'dark' ? 'bg-[#09090b] text-[#fafafa]' : 'bg-[#f8fafc] text-[#0f172a]'}`}>
      {/* Header */}
      <header className={`border-b sticky top-0 z-50 transition-colors duration-300 backdrop-blur-md ${theme === 'dark' ? 'bg-[#141417]/90 border-[#27272a]' : 'bg-white/90 border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${theme === 'dark' ? 'bg-gradient-to-br from-[#27272a] to-[#ec4899]' : 'bg-gradient-to-br from-[#0f172a] to-[#2563eb]'}`}>
              <Eye className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight">MedVision<span className="text-pink-500">AI</span></span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleTheme}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                theme === 'dark' ? 'bg-[#18181b] border-[#3f3f46] text-[#e4e4e7] hover:bg-[#27272a]' : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-700" />}
              <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>
            <Link to="/login" className={`text-xs font-bold transition px-3 py-2 ${theme === 'dark' ? 'text-[#a1a1aa] hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}>
              Sign In
            </Link>
            <Link to="/login" className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-md">
              Start Screening
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className={`flex-1 flex flex-col items-center justify-center text-center px-4 py-20 lg:py-28 transition-colors duration-300 ${
        theme === 'dark' ? 'bg-gradient-to-b from-[#141417] to-[#09090b]' : 'bg-gradient-to-b from-pink-50/40 via-purple-50/20 to-[#f8fafc]'
      }`}>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight max-w-4xl leading-tight">
          AI-Assisted Diabetic Retinopathy <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">Screening</span>
        </h1>
        <p className={`mt-6 text-lg max-w-2xl leading-relaxed ${theme === 'dark' ? 'text-[#a1a1aa]' : 'text-slate-600'}`}>
          Get rapid, explainable screening insights from retinal fundus images and securely access your results online. Screen. Explain. Share. Understand.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <Link to="/login" className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-8 py-3.5 rounded-xl text-base font-bold transition shadow-lg hover:scale-[1.02]">
            Start Screening
          </Link>
          <a href="#how-it-works" className={`border px-8 py-3.5 rounded-xl text-base font-bold transition ${
            theme === 'dark' ? 'bg-[#18181b] border-[#3f3f46] text-[#fafafa] hover:bg-[#27272a]' : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
          }`}>
            How It Works
          </a>
        </div>
      </section>

      {/* Features */}
      <section className={`py-20 border-t transition-colors duration-300 ${theme === 'dark' ? 'bg-[#09090b] border-[#27272a]' : 'bg-white border-slate-200'}`} id="how-it-works">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black">Comprehensive Screening Platform</h2>
            <p className={`mt-4 text-base ${theme === 'dark' ? 'text-[#a1a1aa]' : 'text-slate-600'}`}>Addressing limited specialist access through secure, online AI-assisted preliminary screening.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              theme={theme}
              icon={<Activity className="w-6 h-6 text-pink-500" />}
              title="AI Screening"
              description="EfficientNet-B0 based preliminary analysis of retinal fundus images with integrated image quality validation."
            />
            <FeatureCard 
              theme={theme}
              icon={<Eye className="w-6 h-6 text-purple-500" />}
              title="Explainable AI"
              description="Grad-CAM attention maps highlight regions contributing to the model's prediction for clinical interpretability."
            />
            <FeatureCard 
              theme={theme}
              icon={<ShieldCheck className="w-6 h-6 text-emerald-500" />}
              title="Secure Patient Portal"
              description="Patients securely log in to access their own PDF reports without needing to physically return to the clinic."
            />
            <FeatureCard 
              theme={theme}
              icon={<Users className="w-6 h-6 text-amber-500" />}
              title="Specialist Referral"
              description="Seamless referral workflow allowing qualified eye-care professionals to review high-priority screening results."
            />
            <FeatureCard 
              theme={theme}
              icon={<FileText className="w-6 h-6 text-pink-500" />}
              title="Report-Grounded Assistant"
              description="An integrated RAG chatbot helps patients understand their results using only their authorized report context."
            />
            <FeatureCard 
              theme={theme}
              icon={<Lock className="w-6 h-6 text-indigo-400" />}
              title="Patient Data Isolation"
              description="Strict role-based access control and patient-scoped data retrieval ensures complete privacy."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-12 text-center border-t transition-colors duration-300 ${theme === 'dark' ? 'bg-[#09090b] border-[#27272a] text-[#71717a]' : 'bg-slate-900 text-slate-400'}`}>
        <p className="text-xs">
          MedVisionAI is an AI-assisted screening tool intended to support preliminary assessment.<br/>
          It does not provide a definitive medical diagnosis or replace evaluation by a qualified healthcare professional.
        </p>
      </footer>
    </div>
  );
};

const FeatureCard = ({ theme, icon, title, description }: { theme: 'light' | 'dark', icon: React.ReactNode, title: string, description: string }) => (
  <div className={`rounded-2xl p-8 border transition duration-300 ${
    theme === 'dark' ? 'bg-[#141417] border-[#27272a] hover:border-[#3f3f46]' : 'bg-slate-50 border-slate-200 hover:shadow-lg'
  }`}>
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${
      theme === 'dark' ? 'bg-[#18181b] border border-[#27272a]' : 'bg-white shadow-sm'
    }`}>
      {icon}
    </div>
    <h3 className="text-lg font-extrabold mb-3">{title}</h3>
    <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-[#a1a1aa]' : 'text-slate-600'}`}>{description}</p>
  </div>
);

export default Landing;

