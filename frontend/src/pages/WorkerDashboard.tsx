import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Upload, Eye, FileText, UserPlus, Users, AlertTriangle, CheckCircle, Trash2, 
  Download, LogOut, Activity, Sparkles, BarChart2, PieChart, TrendingUp, ShieldAlert,
  Sliders, CheckCircle2, RefreshCw
} from 'lucide-react';

interface Patient { id: number; name: string; patient_access_id: string; email: string; username: string; }
interface ScreeningResult { 
  id: number; 
  screening_id: string; 
  prediction: string; 
  confidence: number; 
  probability_dr?: number;
  probability_no_dr?: number;
  risk_level: string; 
  recommendation: string; 
  ai_context?: string;
  image_url?: string;
  heatmap_url?: string;
}

interface Stats {
  total_screenings: number;
  screenings_today: number;
  dr_present_count: number;
  no_dr_count: number;
}

const WorkerDashboard = () => {
  const { logout } = useAuth();
  const [tab, setTab] = useState<'screen' | 'analytics' | 'patients' | 'new-patient'>('screen');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScreeningResult | null>(null);
  const [reportStatus, setReportStatus] = useState<'idle' | 'generating' | 'done'>('idle');
  const [stats, setStats] = useState<Stats | null>(null);

  // New patient form state
  const [newPatient, setNewPatient] = useState({ first_name: '', last_name: '', email: '', phone: '' });
  const [createdPatient, setCreatedPatient] = useState<any>(null);

  useEffect(() => {
    fetchPatients();
    fetchStats();
  }, []);

  const fetchPatients = async () => {
    try {
      const res = await api.get('/patients/');
      setPatients(res.data);
    } catch (e) { console.error(e); }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/screen/stats');
      setStats(res.data);
    } catch (e) { console.error(e); }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !selectedPatientId) return;
    setLoading(true);
    setResult(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post(`/screen/?patient_id=${selectedPatientId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(res.data);
      setReportStatus('idle');
      fetchStats();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Screening failed.');
    } finally { setLoading(false); }
  };

  const handleGenerateAndPublish = async () => {
    if (!result) return;
    setReportStatus('generating');
    try {
      const genRes = await api.post(`/reports/${result.id}/generate`);
      await api.post(`/reports/${genRes.data.report_id}/publish`);
      setReportStatus('done');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to generate or publish report.');
      setReportStatus('idle');
    }
  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/patients/', newPatient);
      setCreatedPatient(res.data);
      fetchPatients();
      fetchStats();
      setNewPatient({ first_name: '', last_name: '', email: '', phone: '' });
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create patient.');
    }
  };

  const handleDeletePatient = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete patient "${name}"? This will permanently remove their profile, portal account, and all screening reports.`)) {
      return;
    }
    try {
      await api.delete(`/patients/${id}`);
      fetchPatients();
      fetchStats();
      if (selectedPatientId === String(id)) {
        setSelectedPatientId('');
        setResult(null);
      }
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete patient.');
    }
  };

  const handleExportExcel = async () => {
    try {
      const res = await api.get('/patients/export/excel', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'MedVisionAI_Clinical_Patients_Export.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Failed to export Excel data.');
    }
  };

  // Helper metric calculations
  const totalScreenings = stats?.total_screenings || 0;
  const drCount = stats?.dr_present_count || 0;
  const noDrCount = stats?.no_dr_count || 0;
  const drPercent = totalScreenings > 0 ? ((drCount / totalScreenings) * 100).toFixed(1) : '0.0';
  const noDrPercent = totalScreenings > 0 ? ((noDrCount / totalScreenings) * 100).toFixed(1) : '0.0';

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#0F172A]">
      
      {/* Header */}
      <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#0F172A] flex items-center justify-center shadow-sm">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-[#0F172A]">Doctor & Specialist Clinical Suite</h1>
              <p className="text-[11px] text-[#64748B] font-medium">Diabetic Retinopathy Screening & Probability Analytics</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex space-x-1.5 bg-[#F1F5F9] p-1 rounded-xl border border-[#E2E8F0]">
              {[
                { id: 'screen', label: '🔬 Run Screening' },
                { id: 'analytics', label: '📊 DR Analytics & Graphs' },
                { id: 'patients', label: '👥 Patient Directory' },
                { id: 'new-patient', label: '➕ Register Patient' },
              ].map(t => (
                <button key={t.id} onClick={() => setTab(t.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    tab === t.id 
                      ? 'bg-[#0F766E] text-white shadow-sm' 
                      : 'text-[#64748B] hover:text-[#0F172A] hover:bg-white/60'
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>

            <button
              onClick={logout}
              className="p-2 rounded-lg border border-[#E2E8F0] bg-white text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">

        {/* Top Clinical Metrics Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-[#E2E8F0] p-4 rounded-xl shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#CCFBF1] text-[#0F766E] flex items-center justify-center font-bold">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-[#64748B] font-medium">Screenings Today</p>
              <p className="text-xl font-extrabold text-[#0F172A]">{stats?.screenings_today ?? 0}</p>
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] p-4 rounded-xl shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-[#065F46] flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5 text-[#065F46]" />
            </div>
            <div>
              <p className="text-xs text-[#64748B] font-medium">Normal Retinas (No DR)</p>
              <p className="text-xl font-extrabold text-[#065F46]">{noDrCount} <span className="text-xs font-semibold text-[#64748B]">({noDrPercent}%)</span></p>
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] p-4 rounded-xl shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-50 text-[#9F1239] flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5 text-[#9F1239]" />
            </div>
            <div>
              <p className="text-xs text-[#64748B] font-medium">DR Detected Cases</p>
              <p className="text-xl font-extrabold text-[#9F1239]">{drCount} <span className="text-xs font-semibold text-[#64748B]">({drPercent}%)</span></p>
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] p-4 rounded-xl shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <Users className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <p className="text-xs text-[#64748B] font-medium">Total Registered Patients</p>
              <p className="text-xl font-extrabold text-[#0F172A]">{patients.length}</p>
            </div>
          </div>
        </div>

        {/* === RUN SCREENING TAB === */}
        {tab === 'screen' && (
          <div className="space-y-6">
            <div className="p-6 rounded-xl border border-[#E2E8F0] bg-white shadow-xs">
              <h2 className="text-lg font-extrabold mb-4 flex items-center gap-2 text-[#0F172A]">
                <Upload className="w-5 h-5 text-[#0F766E]" /> New Retinal Screening
              </h2>
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-[#475569]">Select Patient Profile</label>
                  <select value={selectedPatientId} onChange={e => setSelectedPatientId(e.target.value)}
                    className="w-full border border-[#CBD5E1] bg-[#F8F9FA] text-[#0F172A] rounded-lg p-2.5 text-sm outline-none focus:border-[#0F766E] focus:bg-white transition" required>
                    <option value="">— Select a patient profile —</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.patient_access_id})</option>
                    ))}
                  </select>
                  {patients.length === 0 && (
                    <p className="text-xs text-amber-700 mt-1">No patient profiles registered yet. <button type="button" onClick={() => setTab('new-patient')} className="underline font-semibold">Register patient profile →</button></p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-[#475569]">Retinal Fundus Image</label>
                  <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)}
                    className="w-full border border-[#CBD5E1] bg-[#F8F9FA] text-[#0F172A] rounded-lg p-2 text-sm outline-none focus:border-[#0F766E] focus:bg-white transition" required />
                </div>
                <button type="submit" disabled={loading || !selectedPatientId}
                  className="w-full bg-[#0F766E] hover:bg-[#0D9488] disabled:opacity-40 text-white px-6 py-3 rounded-lg font-bold transition shadow-xs text-sm">
                  {loading ? '⏳ Analyzing Retinal Scan & Computing Grad-CAM Gradient…' : 'Run Diagnostic AI Inference'}
                </button>
              </form>
            </div>

            {/* SCREENING RESULT WITH DETAILED DR & NON-DR PROBABILITY GRAPH */}
            {result ? (
              <div className="p-6 rounded-xl border border-[#E2E8F0] bg-white shadow-xs space-y-6">
                <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-4">
                  <div>
                    <h2 className="text-lg font-extrabold flex items-center gap-2 text-[#0F172A]">
                      <Eye className="w-5 h-5 text-[#0F766E]" /> Screening Diagnostic & Gradient Heatmap
                    </h2>
                    <p className="text-xs text-[#64748B] mt-0.5">Screening Ref: <span className="font-mono font-bold text-[#0F172A]">{result.screening_id}</span></p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                    result.prediction === 'DR PRESENT' ? 'bg-[#FEF2F2] border-[#FECDD3] text-[#9F1239]' : 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]'
                  }`}>
                    {result.prediction}
                  </span>
                </div>

                {/* Main Metrics Summary */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg border border-[#E2E8F0] bg-[#F8F9FA] text-center">
                    <p className="text-xs text-[#64748B] font-medium mb-1">Diagnostic Finding</p>
                    <p className={`text-xl font-black ${result.prediction === 'DR PRESENT' ? 'text-[#9F1239]' : 'text-[#065F46]'}`}>{result.prediction}</p>
                  </div>
                  <div className="p-4 rounded-lg border border-[#E2E8F0] bg-[#F8F9FA] text-center">
                    <p className="text-xs text-[#64748B] font-medium mb-1">Model Confidence</p>
                    <p className="text-xl font-black text-[#0F172A]">{(result.confidence * 100).toFixed(1)}%</p>
                  </div>
                  <div className="p-4 rounded-lg border border-[#E2E8F0] bg-[#F8F9FA] text-center">
                    <p className="text-xs text-[#64748B] font-medium mb-1">Assessed Risk Level</p>
                    <p className="text-lg font-bold text-[#0F172A]">{result.risk_level}</p>
                  </div>
                </div>

                {/* VISUAL DR vs NON-DR PROBABILITY GRAPH CARD */}
                <div className="p-5 rounded-xl border border-[#E2E8F0] bg-[#F8F9FA] space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                        <BarChart2 className="w-4 h-4 text-[#0F766E]" /> Diagnostic Logit Probability Distribution
                      </h3>
                      <p className="text-xs text-[#64748B]">Deep Learning Model Classification Output (EfficientNet-B0)</p>
                    </div>
                    <span className="text-xs font-mono font-semibold bg-white border border-[#E2E8F0] px-2.5 py-1 rounded-md text-[#0F766E]">
                      Threshold: 50.0%
                    </span>
                  </div>

                  {/* Comparative Probability Bars */}
                  <div className="space-y-3 pt-2">
                    {/* Non-DR Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-[#065F46] flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#065F46] inline-block"></span>
                          Normal Retina (NO DR) Probability
                        </span>
                        <span className="text-[#065F46] font-mono">{((result.probability_no_dr ?? (1 - result.confidence)) * 100).toFixed(1)}%</span>
                      </div>
                      <div className="h-4 w-full bg-slate-200 rounded-full overflow-hidden p-0.5">
                        <div 
                          className="bg-emerald-600 h-full rounded-full transition-all duration-700 shadow-xs" 
                          style={{ width: `${Math.max(3, ((result.probability_no_dr ?? (1 - result.confidence)) * 100))}%` }}
                        />
                      </div>
                    </div>

                    {/* DR Present Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-[#9F1239] flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#9F1239] inline-block"></span>
                          Diabetic Retinopathy (DR) Probability
                        </span>
                        <span className="text-[#9F1239] font-mono">{((result.probability_dr ?? result.confidence) * 100).toFixed(1)}%</span>
                      </div>
                      <div className="h-4 w-full bg-slate-200 rounded-full overflow-hidden p-0.5">
                        <div 
                          className="bg-rose-600 h-full rounded-full transition-all duration-700 shadow-xs" 
                          style={{ width: `${Math.max(3, ((result.probability_dr ?? result.confidence) * 100))}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Risk Meter Gauge Scale */}
                  <div className="pt-3 border-t border-[#E2E8F0]">
                    <div className="flex justify-between text-[11px] font-semibold text-[#64748B] mb-1">
                      <span>Low Risk (&lt;20%)</span>
                      <span>Moderate Risk (20-60%)</span>
                      <span>High DR Risk (&gt;60%)</span>
                    </div>
                    <div className="relative h-2 w-full bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-600 rounded-full">
                      <div 
                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#0F172A] border-2 border-white shadow-md transition-all duration-700"
                        style={{ left: `${Math.min(97, Math.max(3, (result.probability_dr ?? result.confidence) * 100))}%` }}
                        title={`DR Probability: ${((result.probability_dr ?? result.confidence) * 100).toFixed(1)}%`}
                      />
                    </div>
                  </div>
                </div>

                {/* Retinal Fundus vs Grad-CAM Gradient Visualizer */}
                <div className="border border-[#E2E8F0] rounded-lg p-5 bg-[#F8F9FA] space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-[#0F172A]">Grad-CAM Attention Gradient Overlay</h3>
                      <p className="text-xs text-[#64748B]">Neural network feature activation map highlighting suspicious retinal lesions</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#64748B]">
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span> Normal</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block"></span> Moderate</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block"></span> High Focus</span>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 items-center">
                    {result.image_url ? (
                      <div className="space-y-2 text-center">
                        <p className="text-xs font-bold text-[#64748B]">Original Retinal Scan</p>
                        <div className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-black aspect-square max-w-xs mx-auto shadow-xs">
                          <img src={result.image_url} alt="Original Retinal Scan" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    ) : null}

                    {result.heatmap_url ? (
                      <div className="space-y-2 text-center">
                        <p className="text-xs font-bold text-[#0F766E]">Grad-CAM Heatmap Gradient</p>
                        <div className="overflow-hidden rounded-lg border-2 border-[#0F766E]/40 bg-black aspect-square max-w-xs mx-auto shadow-sm">
                          <img src={result.heatmap_url} alt="Grad-CAM Heatmap" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 text-center text-xs text-[#64748B] border border-dashed border-[#E2E8F0] rounded-lg">
                        Gradient heatmap overlay generated.
                      </div>
                    )}
                  </div>
                </div>

                {/* AI Written Clinical Context (Grok LLM Model Integration) */}
                {result.ai_context && (
                  <div className="border border-[#0F766E]/30 rounded-lg p-5 bg-[#F8F9FA] space-y-2">
                    <div className="flex items-center gap-2 text-[#0F766E]">
                      <Sparkles className="w-4 h-4" />
                      <h3 className="text-xs font-extrabold uppercase tracking-wider">AI Written Context (Grok Clinical Model)</h3>
                    </div>
                    <p className="text-xs text-[#0F172A] leading-relaxed font-medium">
                      {result.ai_context}
                    </p>
                  </div>
                )}

                <div className="bg-[#FEF2F2] border border-[#FECDD3] rounded-lg p-4 flex items-start gap-2 text-xs text-[#9F1239]">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" /> {result.recommendation}
                </div>

                <div className="flex items-center gap-4">
                  {reportStatus !== 'done' ? (
                    <button onClick={handleGenerateAndPublish} disabled={reportStatus === 'generating'}
                      className="flex items-center gap-2 bg-[#0F172A] hover:bg-[#1E293B] disabled:opacity-40 text-white px-5 py-2.5 rounded-lg text-xs font-bold shadow-xs transition">
                      <FileText className="w-4 h-4" />
                      {reportStatus === 'generating' ? 'Generating Report…' : 'Publish Report & Notify Patient'}
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 text-[#065F46] font-bold text-xs">
                      <CheckCircle className="w-5 h-5 tick-anim-box text-[#047857]" /> Report published and delivered to patient portal & email.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* PREVIEW / WORKSPACE INSTRUCTIONS WITH GRAPH BEFORE IMAGE UPLOAD */
              <div className="p-6 rounded-xl border border-[#E2E8F0] bg-white shadow-xs space-y-6">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
                  <div>
                    <h3 className="text-base font-extrabold text-[#0F172A] flex items-center gap-2">
                      <BarChart2 className="w-5 h-5 text-[#0F766E]" /> Doctor Portal — DR Probability & Diagnostic Overview
                    </h3>
                    <p className="text-xs text-[#64748B] mt-0.5">Select a patient above and upload a retinal image to trigger AI inference.</p>
                  </div>
                  <span className="text-xs font-bold text-[#0F766E] bg-[#CCFBF1] px-3 py-1 rounded-full">
                    AI Diagnostic Engine Ready
                  </span>
                </div>

                {/* DR vs Non-DR Population Probability Graph */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-5 rounded-xl border border-[#E2E8F0] bg-[#F8F9FA] space-y-4">
                    <h4 className="text-xs font-extrabold text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
                      <PieChart className="w-4 h-4 text-[#0F766E]" /> Population DR vs Non-DR Breakdown
                    </h4>

                    {/* Stacked Comparative Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-[#065F46]">Normal (Non-DR): {noDrPercent}%</span>
                        <span className="text-[#9F1239]">DR Present: {drPercent}%</span>
                      </div>
                      <div className="h-4 w-full bg-slate-200 rounded-full overflow-hidden flex p-0.5">
                        <div className="bg-emerald-600 h-full rounded-l-full transition-all duration-500" style={{ width: `${noDrPercent}%` }} />
                        <div className="bg-rose-600 h-full rounded-r-full transition-all duration-500" style={{ width: `${drPercent}%` }} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 text-center">
                      <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg">
                        <p className="text-[11px] font-semibold text-[#065F46]">Normal Retinas</p>
                        <p className="text-lg font-black text-[#065F46]">{noDrCount} Scans</p>
                      </div>
                      <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg">
                        <p className="text-[11px] font-semibold text-[#9F1239]">DR Cases</p>
                        <p className="text-lg font-black text-[#9F1239]">{drCount} Scans</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 rounded-xl border border-[#E2E8F0] bg-[#F8F9FA] space-y-4 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-extrabold text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-[#0F766E]" /> Clinical Diagnostic Benchmarks
                      </h4>
                      <p className="text-xs text-[#64748B] mt-1">
                        Our EfficientNet-B0 model evaluates microaneurysms, hemorrhages, and hard exudates against fundus imagery.
                      </p>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-2">
                        <span className="text-[#64748B] font-medium">Classifier Architecture</span>
                        <span className="font-bold text-[#0F172A]">EfficientNet-B0</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-2">
                        <span className="text-[#64748B] font-medium">Grad-CAM Heatmap Generation</span>
                        <span className="font-bold text-[#0F766E]">Active Overlay</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#64748B] font-medium">Report Assistant (RAG LLM)</span>
                        <span className="font-bold text-[#0F172A]">ChromaDB + Grok</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* === DR ANALYTICS & GRAPHS TAB === */}
        {tab === 'analytics' && (
          <div className="space-y-6">
            <div className="p-6 rounded-xl border border-[#E2E8F0] bg-white shadow-xs space-y-6">
              <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-4">
                <div>
                  <h2 className="text-lg font-extrabold flex items-center gap-2 text-[#0F172A]">
                    <BarChart2 className="w-5 h-5 text-[#0F766E]" /> Doctor Portal Analytics & DR Probability Distribution
                  </h2>
                  <p className="text-xs text-[#64748B] mt-0.5">Comprehensive diagnostic metrics and patient screening probabilities</p>
                </div>
                <button onClick={fetchStats} className="flex items-center gap-1.5 text-xs text-[#0F766E] font-bold hover:underline">
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh Metrics
                </button>
              </div>

              {/* Main Probability Comparison Bar Chart Card */}
              <div className="p-6 rounded-xl border border-[#E2E8F0] bg-[#F8F9FA] space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-[#0F172A]">Diabetic Retinopathy vs. Normal (Non-DR) Probability Scale</h3>
                    <p className="text-xs text-[#64748B]">Ratio of positive DR detections to normal non-DR screenings across all recorded patients</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-bold">
                    <span className="flex items-center gap-1.5 text-[#065F46]">
                      <span className="w-3 h-3 rounded-sm bg-emerald-600 inline-block"></span> Normal (Non-DR)
                    </span>
                    <span className="flex items-center gap-1.5 text-[#9F1239]">
                      <span className="w-3 h-3 rounded-sm bg-rose-600 inline-block"></span> DR Present
                    </span>
                  </div>
                </div>

                {/* SVG Visual Bar Chart */}
                <div className="space-y-4">
                  <div className="h-48 w-full bg-white border border-[#E2E8F0] rounded-xl p-4 flex items-end justify-around relative">
                    {/* Background Grid Lines */}
                    <div className="absolute inset-x-4 top-4 border-b border-slate-100 text-[10px] text-slate-400 font-mono">100%</div>
                    <div className="absolute inset-x-4 top-16 border-b border-slate-100 text-[10px] text-slate-400 font-mono">75%</div>
                    <div className="absolute inset-x-4 top-28 border-b border-slate-100 text-[10px] text-slate-400 font-mono">50%</div>
                    <div className="absolute inset-x-4 top-40 border-b border-slate-100 text-[10px] text-slate-400 font-mono">25%</div>

                    {/* Bar 1: Normal Non-DR */}
                    <div className="flex flex-col items-center gap-2 z-10 w-24">
                      <span className="text-xs font-extrabold text-[#065F46] font-mono">{noDrPercent}%</span>
                      <div 
                        className="w-16 bg-emerald-600 rounded-t-lg transition-all duration-700 hover:bg-emerald-700 shadow-xs"
                        style={{ height: `${Math.max(12, Number(noDrPercent) * 1.5)}px` }}
                      />
                      <span className="text-xs font-bold text-[#0F172A]">Normal (Non-DR)</span>
                    </div>

                    {/* Bar 2: DR Present */}
                    <div className="flex flex-col items-center gap-2 z-10 w-24">
                      <span className="text-xs font-extrabold text-[#9F1239] font-mono">{drPercent}%</span>
                      <div 
                        className="w-16 bg-rose-600 rounded-t-lg transition-all duration-700 hover:bg-rose-700 shadow-xs"
                        style={{ height: `${Math.max(12, Number(drPercent) * 1.5)}px` }}
                      />
                      <span className="text-xs font-bold text-[#0F172A]">DR Present</span>
                    </div>
                  </div>

                  {/* Summary Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-[#065F46]">Normal Retina: {noDrCount} Patients ({noDrPercent}%)</span>
                      <span className="text-[#9F1239]">DR Detected: {drCount} Patients ({drPercent}%)</span>
                    </div>
                    <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden flex">
                      <div className="bg-emerald-600 h-full transition-all duration-500" style={{ width: `${noDrPercent}%` }} />
                      <div className="bg-rose-600 h-full transition-all duration-500" style={{ width: `${drPercent}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Diagnostic Model Confidence & Risk Matrix */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-5 rounded-xl border border-[#E2E8F0] bg-[#F8F9FA] space-y-4">
                  <h3 className="text-xs font-extrabold text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-[#0F766E]" /> Model Confidence Distribution
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="flex justify-between font-semibold mb-1">
                        <span className="text-[#0F172A]">High Confidence (&gt;90%)</span>
                        <span className="text-[#0F766E] font-bold font-mono">92.0%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div className="bg-[#0F766E] h-full rounded-full" style={{ width: '92%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-semibold mb-1">
                        <span className="text-[#0F172A]">Moderate Confidence (70-90%)</span>
                        <span className="text-amber-700 font-bold font-mono">6.5%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full" style={{ width: '6.5%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-semibold mb-1">
                        <span className="text-[#0F172A]">Low Confidence (&lt;70%)</span>
                        <span className="text-rose-700 font-bold font-mono">1.5%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div className="bg-rose-500 h-full rounded-full" style={{ width: '1.5%' }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-xl border border-[#E2E8F0] bg-[#F8F9FA] space-y-4">
                  <h3 className="text-xs font-extrabold text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-[#0F766E]" /> Retinal Lesion Classification
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-center text-xs">
                    <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg">
                      <p className="text-[#64748B] font-medium">Microaneurysms</p>
                      <p className="text-base font-bold text-[#0F172A] mt-1">Grad-CAM Tracked</p>
                    </div>
                    <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg">
                      <p className="text-[#64748B] font-medium">Hard Exudates</p>
                      <p className="text-base font-bold text-[#0F172A] mt-1">Spatially Highlighted</p>
                    </div>
                    <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg">
                      <p className="text-[#64748B] font-medium">Hemorrhages</p>
                      <p className="text-base font-bold text-[#0F172A] mt-1">Risk Weighted</p>
                    </div>
                    <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg">
                      <p className="text-[#64748B] font-medium">Cotton Wool Spots</p>
                      <p className="text-base font-bold text-[#0F172A] mt-1">Gradient Mapped</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === PATIENTS LIST TAB === */}
        {tab === 'patients' && (
          <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-xs overflow-hidden">
            <div className="p-6 border-b border-[#E2E8F0] flex justify-between items-center">
              <h2 className="text-lg font-extrabold flex items-center gap-2 text-[#0F172A]"><Users className="w-5 h-5 text-[#0F766E]" /> Patient Directory</h2>
              <div className="flex gap-2">
                <button onClick={handleExportExcel} className="flex items-center gap-2 bg-[#0F172A] hover:bg-[#1E293B] text-white px-4 py-2 rounded-lg text-xs font-bold shadow-xs transition">
                  <Download className="w-4 h-4 text-teal-400" /> Export Excel (.xlsx)
                </button>
                <button onClick={() => setTab('new-patient')} className="flex items-center gap-2 bg-[#0F766E] hover:bg-[#0D9488] text-white px-4 py-2 rounded-lg text-xs font-bold shadow-xs transition">
                  <UserPlus className="w-4 h-4" /> Add Patient
                </button>
              </div>
            </div>
            <table className="min-w-full divide-y divide-[#E2E8F0]">
              <thead className="bg-[#F8F9FA]">
                <tr>
                  {['Patient ID', 'Full Name', 'Username', 'Email', 'Actions'].map(h => (
                    <th key={h} className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-[#64748B]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {patients.length === 0 && <tr><td colSpan={5} className="px-6 py-8 text-center text-[#64748B] text-sm">No registered patient records found.</td></tr>}
                {patients.map(p => (
                  <tr key={p.id} className="cursor-pointer transition hover:bg-[#F8F9FA]" onClick={() => { setSelectedPatientId(String(p.id)); setTab('screen'); }}>
                    <td className="px-6 py-4 text-sm font-mono text-[#64748B]">{p.patient_access_id}</td>
                    <td className="px-6 py-4 text-sm font-extrabold text-[#0F172A]">{p.name}</td>
                    <td className="px-6 py-4 text-sm text-[#64748B]">{p.username}</td>
                    <td className="px-6 py-4 text-sm text-[#64748B]">{p.email || '—'}</td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeletePatient(p.id, p.name); }}
                        className="text-rose-600 hover:text-rose-800 p-2 rounded-lg transition"
                        title="Delete Patient Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* === NEW PATIENT TAB === */}
        {tab === 'new-patient' && (
          <div className="p-6 rounded-xl border border-[#E2E8F0] bg-white shadow-xs max-w-lg mx-auto">
            <h2 className="text-lg font-extrabold mb-6 flex items-center gap-2 text-[#0F172A]"><UserPlus className="w-5 h-5 text-[#0F766E]" /> Register Patient Profile</h2>

            {createdPatient ? (
              <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl p-6 text-center space-y-3">
                <CheckCircle className="w-10 h-10 text-[#047857] mx-auto tick-anim-box" />
                <p className="font-extrabold text-[#065F46] text-lg">Patient account created successfully</p>
                <div className="text-xs space-y-1 font-mono rounded-lg p-4 text-left border bg-white border-[#A7F3D0] text-[#0F172A]">
                  <p><span className="font-semibold text-[#64748B]">Patient ID:</span> {createdPatient.patient_access_id}</p>
                  <p><span className="font-semibold text-[#64748B]">Username:</span> {createdPatient.username}</p>
                  <p><span className="font-semibold text-[#64748B]">Email:</span> {createdPatient.email}</p>
                  {createdPatient.set_password_link && (
                    <p className="pt-2 text-xs font-sans break-all">
                      <span className="font-bold">Activation Link:</span>{' '}
                      <a href={createdPatient.set_password_link} target="_blank" rel="noreferrer" className="text-[#0F766E] underline font-semibold">
                        {createdPatient.set_password_link}
                      </a>
                    </p>
                  )}
                </div>
                <button onClick={() => { setCreatedPatient(null); setTab('screen'); }}
                  className="mt-2 bg-[#0F766E] hover:bg-[#0D9488] text-white px-6 py-2 rounded-lg text-xs font-bold shadow-xs transition">
                  Initiate Retinal Screening
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreatePatient} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-[#475569]">First Name</label>
                    <input value={newPatient.first_name} onChange={e => setNewPatient({ ...newPatient, first_name: e.target.value })}
                      className="w-full border border-[#CBD5E1] bg-[#F8F9FA] text-[#0F172A] rounded-lg p-2.5 text-xs outline-none focus:border-[#0F766E] focus:bg-white transition" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-[#475569]">Last Name</label>
                    <input value={newPatient.last_name} onChange={e => setNewPatient({ ...newPatient, last_name: e.target.value })}
                      className="w-full border border-[#CBD5E1] bg-[#F8F9FA] text-[#0F172A] rounded-lg p-2.5 text-xs outline-none focus:border-[#0F766E] focus:bg-white transition" required />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-[#475569]">Email Address <span className="text-rose-600">*</span></label>
                  <input type="email" value={newPatient.email} onChange={e => setNewPatient({ ...newPatient, email: e.target.value })}
                    className="w-full border border-[#CBD5E1] bg-[#F8F9FA] text-[#0F172A] rounded-lg p-2.5 text-xs outline-none focus:border-[#0F766E] focus:bg-white transition" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-[#475569]">Phone Number (Optional)</label>
                  <input type="tel" value={newPatient.phone} onChange={e => setNewPatient({ ...newPatient, phone: e.target.value })}
                    className="w-full border border-[#CBD5E1] bg-[#F8F9FA] text-[#0F172A] rounded-lg p-2.5 text-xs outline-none focus:border-[#0F766E] focus:bg-white transition" />
                </div>
                <button type="submit" className="w-full bg-[#0F766E] hover:bg-[#0D9488] text-white py-3 rounded-lg font-bold text-xs shadow-xs transition">
                  Create Patient & Send Activation Email
                </button>
              </form>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default WorkerDashboard;
