import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Upload, Eye, FileText, UserPlus, Users, AlertTriangle, CheckCircle, Trash2, Download, LogOut, Activity, Sparkles, Sun, Moon } from 'lucide-react';

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
  const { theme, toggleTheme } = useTheme();
  const [tab, setTab] = useState<'screen' | 'patients' | 'new-patient'>('screen');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScreeningResult | null>(null);
  const [reportStatus, setReportStatus] = useState<'idle' | 'generating' | 'done'>('idle');
  const [stats, setStats] = useState<Stats | null>(null);

  const [newPatient, setNewPatient] = useState({ first_name: '', last_name: '', email: '', phone: '' });
  const [createdPatient, setCreatedPatient] = useState<any>(null);
  const [patientSearch, setPatientSearch] = useState('');

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
    p.patient_access_id.toLowerCase().includes(patientSearch.toLowerCase()) ||
    (p.email && p.email.toLowerCase().includes(patientSearch.toLowerCase())) ||
    p.username.toLowerCase().includes(patientSearch.toLowerCase())
  );

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

  return (
    <div className="min-h-screen bg-[#F8F6F0] dark:bg-[#0D0F12] text-[#1A1917] dark:text-[#F3F4F6] transition-colors duration-300">
      
      {/* Header */}
      <header className="bg-white/90 dark:bg-[#16191E]/90 border-b border-[#E6E1D7] dark:border-[#262B34] sticky top-0 z-40 backdrop-blur-md transition-colors duration-300">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1E1E1E] dark:bg-[#C85A32] flex items-center justify-center shadow-sm">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-[#1A1917] dark:text-[#F3F4F6]">Clinical Screening Suite</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex space-x-2">
              {(['screen', 'patients', 'new-patient'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                    tab === t 
                      ? 'bg-[#C85A32] text-white shadow-sm' 
                      : 'bg-[#F0ECDF] dark:bg-[#20242D] text-[#6E6A63] dark:text-[#9CA3AF] hover:bg-[#E6E1D7] dark:hover:bg-[#2C323E] hover:text-[#1A1917] dark:hover:text-[#F3F4F6]'
                  }`}>
                  {t === 'screen' ? '🔬 Run Screening' : t === 'patients' ? '👥 Patient Directory' : '➕ Register Patient'}
                </button>
              ))}
            </div>

            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border border-[#E6E1D7] dark:border-[#262B34] bg-white dark:bg-[#20242D] text-[#1A1917] dark:text-[#F3F4F6] hover:bg-[#F0ECDF] dark:hover:bg-[#2C323E] transition shadow-sm"
              title="Toggle Light/Dark Theme"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-[#6E6A63]" />}
              <span className="hidden sm:inline">{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>

            <button
              onClick={logout}
              className="p-2 rounded-xl border border-[#E6E1D7] dark:border-[#262B34] bg-white dark:bg-[#20242D] text-[#6E6A63] dark:text-[#9CA3AF] hover:text-[#1A1917] dark:hover:text-[#F3F4F6] hover:bg-[#F0ECDF] dark:hover:bg-[#2C323E] transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">

        {/* Top Clinical Stats Summary Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-[#16191E] border border-[#E6E1D7] dark:border-[#262B34] p-4 rounded-2xl shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C85A32]/10 dark:bg-[#C85A32]/20 text-[#C85A32] flex items-center justify-center font-bold">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-[#6E6A63] dark:text-[#9CA3AF]">Screenings Today</p>
              <p className="text-xl font-extrabold text-[#1A1917] dark:text-[#F3F4F6]">{stats?.screenings_today ?? 0}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#16191E] border border-[#E6E1D7] dark:border-[#262B34] p-4 rounded-2xl shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1E1E1E]/5 dark:bg-white/10 text-[#1A1917] dark:text-[#F3F4F6] flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-[#6E6A63] dark:text-[#9CA3AF]">Total Patients</p>
              <p className="text-xl font-extrabold text-[#1A1917] dark:text-[#F3F4F6]">{patients.length}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#16191E] border border-[#E6E1D7] dark:border-[#262B34] p-4 rounded-2xl shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 flex items-center justify-center font-bold">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-[#6E6A63] dark:text-[#9CA3AF]">Total Screenings</p>
              <p className="text-xl font-extrabold text-[#1A1917] dark:text-[#F3F4F6]">{stats?.total_screenings ?? 0}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#16191E] border border-[#E6E1D7] dark:border-[#262B34] p-4 rounded-2xl shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-[#6E6A63] dark:text-[#9CA3AF]">DR Detected Cases</p>
              <p className="text-xl font-extrabold text-rose-600 dark:text-rose-400">{stats?.dr_present_count ?? 0}</p>
            </div>
          </div>
        </div>

        {/* === RUN SCREENING TAB === */}
        {tab === 'screen' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl border border-[#E6E1D7] dark:border-[#262B34] bg-white dark:bg-[#16191E] shadow-sm">
              <h2 className="text-xl font-extrabold mb-4 flex items-center gap-2 text-[#1A1917] dark:text-[#F3F4F6]">
                <Upload className="w-5 h-5 text-[#C85A32]" /> New Retinal Screening
              </h2>
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-[#6E6A63] dark:text-[#9CA3AF]">Select Patient Profile</label>
                  <select value={selectedPatientId} onChange={e => setSelectedPatientId(e.target.value)}
                    className="w-full border border-[#E6E1D7] dark:border-[#262B34] bg-[#F8F6F0] dark:bg-[#0D0F12] text-[#1A1917] dark:text-[#F3F4F6] rounded-xl p-2.5 text-sm outline-none focus:border-[#C85A32]" required>
                    <option value="">— Select a patient profile —</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.patient_access_id})</option>
                    ))}
                  </select>
                  {patients.length === 0 && (
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">No patient profiles registered yet. <button type="button" onClick={() => setTab('new-patient')} className="underline font-semibold">Register patient profile →</button></p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-[#6E6A63] dark:text-[#9CA3AF]">Retinal Fundus Image</label>
                  <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)}
                    className="w-full border border-[#E6E1D7] dark:border-[#262B34] bg-[#F8F6F0] dark:bg-[#0D0F12] text-[#1A1917] dark:text-[#F3F4F6] rounded-xl p-2 text-sm outline-none focus:border-[#C85A32]" required />
                </div>
                <button type="submit" disabled={loading || !selectedPatientId}
                  className="w-full bg-[#C85A32] hover:bg-[#B34E2B] disabled:opacity-40 text-white px-6 py-3 rounded-xl font-bold transition shadow-sm">
                  {loading ? '⏳ Analyzing Retinal Scan & Computing Grad-CAM Gradient…' : 'Run Diagnostic AI Inference'}
                </button>
              </form>
            </div>

            {result && (
              <div className="p-6 rounded-2xl border border-[#E6E1D7] dark:border-[#262B34] bg-white dark:bg-[#16191E] shadow-sm space-y-6">
                <div className="flex justify-between items-center border-b border-[#E6E1D7] dark:border-[#262B34] pb-4">
                  <div>
                    <h2 className="text-xl font-extrabold flex items-center gap-2 text-[#1A1917] dark:text-[#F3F4F6]">
                      <Eye className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> Screening Diagnostic & Gradient Heatmap
                    </h2>
                    <p className="text-xs text-[#6E6A63] dark:text-[#9CA3AF] mt-0.5">Screening Ref: <span className="font-mono font-bold text-[#1A1917] dark:text-[#F3F4F6]">{result.screening_id}</span></p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                    result.prediction === 'DR PRESENT' ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300' : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                  }`}>
                    {result.prediction}
                  </span>
                </div>

                {/* Main Metrics Summary */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl border border-[#E6E1D7] dark:border-[#262B34] bg-[#F8F6F0] dark:bg-[#0D0F12] text-center">
                    <p className="text-xs text-[#6E6A63] dark:text-[#9CA3AF] mb-1">Diagnostic Finding</p>
                    <p className={`text-2xl font-black ${result.prediction === 'DR PRESENT' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}`}>{result.prediction}</p>
                  </div>
                  <div className="p-4 rounded-xl border border-[#E6E1D7] dark:border-[#262B34] bg-[#F8F6F0] dark:bg-[#0D0F12] text-center">
                    <p className="text-xs text-[#6E6A63] dark:text-[#9CA3AF] mb-1">Model Confidence</p>
                    <p className="text-2xl font-black text-[#1A1917] dark:text-[#F3F4F6]">{(result.confidence * 100).toFixed(1)}%</p>
                  </div>
                  <div className="p-4 rounded-xl border border-[#E6E1D7] dark:border-[#262B34] bg-[#F8F6F0] dark:bg-[#0D0F12] text-center">
                    <p className="text-xs text-[#6E6A63] dark:text-[#9CA3AF] mb-1">Assessed Risk Level</p>
                    <p className="text-xl font-bold text-[#1A1917] dark:text-[#F3F4F6]">{result.risk_level}</p>
                  </div>
                </div>

                {/* Probability Distribution Gradient Bar */}
                <div className="p-4 rounded-xl border border-[#E6E1D7] dark:border-[#262B34] bg-[#F8F6F0] dark:bg-[#0D0F12] space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-emerald-700 dark:text-emerald-400">Normal Retina (NO DR): {((result.probability_no_dr ?? (1 - result.confidence)) * 100).toFixed(1)}%</span>
                    <span className="text-rose-600 dark:text-rose-400">Diabetic Retinopathy (DR): {((result.probability_dr ?? result.confidence) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
                    <div 
                      className="bg-emerald-500 h-full transition-all duration-500" 
                      style={{ width: `${((result.probability_no_dr ?? (1 - result.confidence)) * 100)}%` }}
                    />
                    <div 
                      className="bg-rose-500 h-full transition-all duration-500" 
                      style={{ width: `${((result.probability_dr ?? result.confidence) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Retinal Fundus vs Grad-CAM Gradient Visualizer */}
                <div className="border border-[#E6E1D7] dark:border-[#262B34] rounded-xl p-5 bg-[#F8F6F0] dark:bg-[#0D0F12] space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-[#1A1917] dark:text-[#F3F4F6]">Grad-CAM Attention Gradient Overlay</h3>
                      <p className="text-xs text-[#6E6A63] dark:text-[#9CA3AF]">Neural network feature activation map highlighting suspicious retinal lesions</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#6E6A63] dark:text-[#9CA3AF]">
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span> Normal</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block"></span> Moderate</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block"></span> High Focus</span>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 items-center">
                    {result.image_url ? (
                      <div className="space-y-2 text-center">
                        <p className="text-xs font-bold text-[#6E6A63] dark:text-[#9CA3AF]">Original Retinal Scan</p>
                        <div className="overflow-hidden rounded-xl border border-[#E6E1D7] dark:border-[#262B34] bg-black aspect-square max-w-xs mx-auto shadow-sm">
                          <img src={result.image_url} alt="Original Retinal Scan" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    ) : null}

                    {result.heatmap_url ? (
                      <div className="space-y-2 text-center">
                        <p className="text-xs font-bold text-[#C85A32]">Grad-CAM Heatmap Gradient</p>
                        <div className="overflow-hidden rounded-xl border-2 border-[#C85A32]/40 bg-black aspect-square max-w-xs mx-auto shadow-md">
                          <img src={result.heatmap_url} alt="Grad-CAM Heatmap" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 text-center text-xs text-[#6E6A63] dark:text-[#9CA3AF] border border-dashed border-[#E6E1D7] dark:border-[#262B34] rounded-xl">
                        Gradient heatmap overlay generated.
                      </div>
                    )}
                  </div>
                </div>

                {/* AI Written Clinical Context (Grok LLM Model Integration) */}
                {result.ai_context && (
                  <div className="border border-[#C85A32]/30 rounded-xl p-5 bg-[#F8F6F0] dark:bg-[#0D0F12] space-y-2">
                    <div className="flex items-center gap-2 text-[#C85A32]">
                      <Sparkles className="w-4 h-4" />
                      <h3 className="text-xs font-extrabold uppercase tracking-wider">AI Written Context (Grok Clinical Model)</h3>
                    </div>
                    <p className="text-xs text-[#1A1917] dark:text-[#F3F4F6] leading-relaxed font-medium">
                      {result.ai_context}
                    </p>
                  </div>
                )}

                <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl p-4 flex items-start gap-2 text-xs text-rose-800 dark:text-rose-300">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" /> {result.recommendation}
                </div>

                <div className="flex items-center gap-4">
                  {reportStatus !== 'done' ? (
                    <button onClick={handleGenerateAndPublish} disabled={reportStatus === 'generating'}
                      className="flex items-center gap-2 bg-[#1E1E1E] dark:bg-[#C85A32] hover:bg-[#333333] dark:hover:bg-[#B34E2B] disabled:opacity-40 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm">
                      <FileText className="w-4 h-4" />
                      {reportStatus === 'generating' ? 'Generating Report…' : 'Publish Report & Notify Patient'}
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                      <CheckCircle className="w-5 h-5 tick-anim-box text-emerald-600 dark:text-emerald-400" /> Report published and delivered to patient portal & email.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* === PATIENTS LIST TAB === */}
        {tab === 'patients' && (
          <div className="rounded-2xl border border-[#E6E1D7] dark:border-[#262B34] bg-white dark:bg-[#16191E] shadow-sm overflow-hidden">
            <div className="p-6 border-b border-[#E6E1D7] dark:border-[#262B34] flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold flex items-center gap-2 text-[#1A1917] dark:text-[#F3F4F6]"><Users className="w-5 h-5 text-[#C85A32]" /> Patient Directory</h2>
                <p className="text-xs text-[#6E6A63] dark:text-[#9CA3AF] mt-1">Manage clinical patient profiles & export records to Excel (.xlsx)</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  placeholder="Search by name, ID, or email..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  className="px-3.5 py-2 rounded-xl text-xs border border-[#E6E1D7] dark:border-[#262B34] bg-[#F8F6F0] dark:bg-[#0D0F12] text-[#1A1917] dark:text-[#F3F4F6] outline-none focus:border-[#C85A32] w-60"
                />

                <button onClick={handleExportExcel} className="flex items-center gap-2 bg-[#2E7D32] hover:bg-[#256628] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition cursor-pointer">
                  <Download className="w-4 h-4 text-white" /> Export Excel (.xlsx)
                </button>

                <button onClick={() => setTab('new-patient')} className="flex items-center gap-2 bg-[#C85A32] hover:bg-[#B34E2B] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm cursor-pointer">
                  <UserPlus className="w-4 h-4" /> Add Patient
                </button>
              </div>
            </div>

            <table className="min-w-full divide-y divide-[#E6E1D7] dark:divide-[#262B34]">
              <thead className="bg-[#F0ECDF] dark:bg-[#20242D]">
                <tr>
                  {['Patient ID', 'Full Name', 'Username', 'Email', 'Actions'].map(h => (
                    <th key={h} className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-[#6E6A63] dark:text-[#9CA3AF]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E1D7] dark:divide-[#262B34]">
                {filteredPatients.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-[#6E6A63] dark:text-[#9CA3AF] text-sm">No matching patient records found.</td></tr>
                )}
                {filteredPatients.map(p => (
                  <tr key={p.id} className="cursor-pointer transition hover:bg-[#F8F6F0] dark:hover:bg-[#20242D]" onClick={() => { setSelectedPatientId(String(p.id)); setTab('screen'); }}>
                    <td className="px-6 py-4 text-sm font-mono text-[#6E6A63] dark:text-[#9CA3AF]">{p.patient_access_id}</td>
                    <td className="px-6 py-4 text-sm font-extrabold text-[#1A1917] dark:text-[#F3F4F6]">{p.name}</td>
                    <td className="px-6 py-4 text-sm text-[#6E6A63] dark:text-[#9CA3AF]">{p.username}</td>
                    <td className="px-6 py-4 text-sm text-[#6E6A63] dark:text-[#9CA3AF]">{p.email || '—'}</td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeletePatient(p.id, p.name); }}
                        className="text-rose-600 hover:text-rose-800 dark:text-rose-400 p-2 rounded-lg transition"
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
          <div className="p-6 rounded-2xl border border-[#E6E1D7] dark:border-[#262B34] bg-white dark:bg-[#16191E] shadow-sm max-w-lg mx-auto">
            <h2 className="text-xl font-extrabold mb-6 flex items-center gap-2 text-[#1A1917] dark:text-[#F3F4F6]"><UserPlus className="w-5 h-5 text-[#C85A32]" /> Register Patient Profile</h2>

            {createdPatient ? (
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6 text-center space-y-3">
                <CheckCircle className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto tick-anim-box" />
                <p className="font-extrabold text-emerald-800 dark:text-emerald-300 text-lg">Patient account created successfully</p>
                <div className="text-xs space-y-1 font-mono rounded-xl p-4 text-left border bg-white dark:bg-[#0D0F12] border-emerald-200 dark:border-emerald-800 text-[#1A1917] dark:text-[#F3F4F6]">
                  <p><span className="font-semibold text-[#6E6A63] dark:text-[#9CA3AF]">Patient ID:</span> {createdPatient.patient_access_id}</p>
                  <p><span className="font-semibold text-[#6E6A63] dark:text-[#9CA3AF]">Username:</span> {createdPatient.username}</p>
                  <p><span className="font-semibold text-[#6E6A63] dark:text-[#9CA3AF]">Email:</span> {createdPatient.email}</p>
                  {createdPatient.set_password_link && (
                    <p className="pt-2 text-xs font-sans break-all">
                      <span className="font-bold">Activation Link:</span>{' '}
                      <a href={createdPatient.set_password_link} target="_blank" rel="noreferrer" className="text-[#C85A32] underline font-semibold">
                        {createdPatient.set_password_link}
                      </a>
                    </p>
                  )}
                </div>
                <button onClick={() => { setCreatedPatient(null); setTab('screen'); }}
                  className="mt-2 bg-[#C85A32] hover:bg-[#B34E2B] text-white px-6 py-2 rounded-xl text-xs font-bold shadow-sm">
                  Initiate Retinal Screening
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreatePatient} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-[#6E6A63] dark:text-[#9CA3AF]">First Name</label>
                    <input value={newPatient.first_name} onChange={e => setNewPatient({ ...newPatient, first_name: e.target.value })}
                      className="w-full border border-[#E6E1D7] dark:border-[#262B34] bg-[#F8F6F0] dark:bg-[#0D0F12] text-[#1A1917] dark:text-[#F3F4F6] rounded-xl p-2.5 text-xs outline-none focus:border-[#C85A32]" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-[#6E6A63] dark:text-[#9CA3AF]">Last Name</label>
                    <input value={newPatient.last_name} onChange={e => setNewPatient({ ...newPatient, last_name: e.target.value })}
                      className="w-full border border-[#E6E1D7] dark:border-[#262B34] bg-[#F8F6F0] dark:bg-[#0D0F12] text-[#1A1917] dark:text-[#F3F4F6] rounded-xl p-2.5 text-xs outline-none focus:border-[#C85A32]" required />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-[#6E6A63] dark:text-[#9CA3AF]">Email Address <span className="text-rose-600">*</span></label>
                  <input type="email" value={newPatient.email} onChange={e => setNewPatient({ ...newPatient, email: e.target.value })}
                    className="w-full border border-[#E6E1D7] dark:border-[#262B34] bg-[#F8F6F0] dark:bg-[#0D0F12] text-[#1A1917] dark:text-[#F3F4F6] rounded-xl p-2.5 text-xs outline-none focus:border-[#C85A32]" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-[#6E6A63] dark:text-[#9CA3AF]">Phone Number (Optional)</label>
                  <input type="tel" value={newPatient.phone} onChange={e => setNewPatient({ ...newPatient, phone: e.target.value })}
                    className="w-full border border-[#E6E1D7] dark:border-[#262B34] bg-[#F8F6F0] dark:bg-[#0D0F12] text-[#1A1917] dark:text-[#F3F4F6] rounded-xl p-2.5 text-xs outline-none focus:border-[#C85A32]" />
                </div>
                <button type="submit" className="w-full bg-[#C85A32] hover:bg-[#B34E2B] text-white py-3 rounded-xl font-bold text-xs shadow-sm transition">
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



