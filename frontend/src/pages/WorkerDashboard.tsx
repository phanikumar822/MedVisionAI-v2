import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Upload, Eye, FileText, UserPlus, Users, AlertTriangle, CheckCircle, Trash2, Download, Sun, Moon, LogOut } from 'lucide-react';

interface Patient { id: number; name: string; patient_access_id: string; email: string; username: string; }
interface ScreeningResult { id: number; screening_id: string; prediction: string; confidence: number; risk_level: string; recommendation: string; }

const WorkerDashboard = () => {
  const { logout } = useAuth();
  const [tab, setTab] = useState<'screen' | 'patients' | 'new-patient'>('screen');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScreeningResult | null>(null);
  const [reportStatus, setReportStatus] = useState<'idle' | 'generating' | 'done'>('idle');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  // New patient form state
  const [newPatient, setNewPatient] = useState({ first_name: '', last_name: '', email: '', phone: '' });
  const [createdPatient, setCreatedPatient] = useState<any>(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const res = await api.get('/patients/');
      setPatients(res.data);
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
      if (selectedPatientId === String(id)) {
        setSelectedPatientId('');
        setResult(null);
      }
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete patient.');
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await api.get('/patients/export/csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'MedVisionAI_Patients_Export.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Failed to export CSV data.');
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-[#09090b] text-[#fafafa]' : 'bg-[#f8fafc] text-[#0f172a]'}`}>
      
      {/* Header */}
      <header className={`border-b sticky top-0 z-40 transition-colors duration-300 ${theme === 'dark' ? 'bg-[#141417]/90 border-[#27272a]' : 'bg-white/90 border-slate-200'} backdrop-blur-md`}>
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${theme === 'dark' ? 'bg-gradient-to-br from-[#27272a] to-[#ec4899]' : 'bg-gradient-to-br from-[#0f172a] to-[#2563eb]'}`}>
              <Eye className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight">Doctor & Admin Portal</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex space-x-2">
              {(['screen', 'patients', 'new-patient'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                    tab === t 
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md' 
                      : theme === 'dark' ? 'bg-[#18181b] text-[#a1a1aa] hover:bg-[#27272a]' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}>
                  {t === 'screen' ? '🔬 Run Screening' : t === 'patients' ? '👥 My Patients' : '➕ New Patient'}
                </button>
              ))}
            </div>

            <button
              onClick={toggleTheme}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                theme === 'dark' ? 'bg-[#18181b] border-[#3f3f46] text-[#e4e4e7] hover:bg-[#27272a]' : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-700" />}
              <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>

            <button
              onClick={logout}
              className={`p-2 rounded-xl border transition ${
                theme === 'dark' ? 'bg-[#18181b] border-[#3f3f46] text-[#a1a1aa] hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">

        {/* === RUN SCREENING TAB === */}
        {tab === 'screen' && (
          <div className="space-y-6">
            <div className={`p-6 rounded-2xl border shadow-sm ${theme === 'dark' ? 'bg-[#141417] border-[#27272a]' : 'bg-white border-slate-200'}`}>
              <h2 className="text-xl font-extrabold mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-pink-500" /> New Screening
              </h2>
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${theme === 'dark' ? 'text-[#d4d4d8]' : 'text-slate-700'}`}>Select Patient</label>
                  <select value={selectedPatientId} onChange={e => setSelectedPatientId(e.target.value)}
                    className={`w-full border rounded-xl p-2.5 text-sm outline-none ${
                      theme === 'dark' ? 'bg-[#18181b] border-[#3f3f46] text-[#fafafa]' : 'bg-white border-slate-300 text-slate-900'
                    }`} required>
                    <option value="">— Select a patient —</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.patient_access_id})</option>
                    ))}
                  </select>
                  {patients.length === 0 && (
                    <p className="text-xs text-amber-500 mt-1">No patients yet. <button type="button" onClick={() => setTab('new-patient')} className="underline">Create one first →</button></p>
                  )}
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${theme === 'dark' ? 'text-[#d4d4d8]' : 'text-slate-700'}`}>Retinal Fundus Image</label>
                  <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)}
                    className={`w-full border rounded-xl p-2 text-sm ${
                      theme === 'dark' ? 'bg-[#18181b] border-[#3f3f46] text-[#fafafa]' : 'bg-white border-slate-300 text-slate-900'
                    }`} required />
                </div>
                <button type="submit" disabled={loading || !selectedPatientId}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:opacity-40 text-white px-6 py-3 rounded-xl font-extrabold transition shadow-md">
                  {loading ? '⏳ Running AI Inference…' : 'Run AI Screening'}
                </button>
              </form>
            </div>

            {result && (
              <div className={`p-6 rounded-2xl border shadow-sm ${theme === 'dark' ? 'bg-[#141417] border-[#27272a]' : 'bg-white border-slate-200'}`}>
                <h2 className="text-xl font-extrabold mb-4 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-emerald-500" /> Screening Result
                </h2>
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div className={`p-4 rounded-xl border text-center ${theme === 'dark' ? 'bg-[#18181b] border-[#27272a]' : 'bg-slate-50 border-slate-200'}`}>
                    <p className="text-xs opacity-60 mb-1">Prediction</p>
                    <p className={`text-2xl font-black ${result.prediction === 'DR PRESENT' ? 'text-rose-500' : 'text-emerald-500'}`}>{result.prediction}</p>
                  </div>
                  <div className={`p-4 rounded-xl border text-center ${theme === 'dark' ? 'bg-[#18181b] border-[#27272a]' : 'bg-slate-50 border-slate-200'}`}>
                    <p className="text-xs opacity-60 mb-1">Confidence</p>
                    <p className="text-2xl font-black">{(result.confidence * 100).toFixed(1)}%</p>
                  </div>
                  <div className={`p-4 rounded-xl border text-center ${theme === 'dark' ? 'bg-[#18181b] border-[#27272a]' : 'bg-slate-50 border-slate-200'}`}>
                    <p className="text-xs opacity-60 mb-1">Risk Level</p>
                    <p className="text-xl font-bold">{result.risk_level}</p>
                  </div>
                </div>
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 mb-4 flex items-start gap-2 text-xs text-rose-400">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" /> {result.recommendation}
                </div>
                <div className="flex items-center gap-4">
                  {reportStatus !== 'done' ? (
                    <button onClick={handleGenerateAndPublish} disabled={reportStatus === 'generating'}
                      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md">
                      <FileText className="w-4 h-4" />
                      {reportStatus === 'generating' ? 'Generating…' : 'Generate & Publish Report (Email Patient)'}
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                      <CheckCircle className="w-5 h-5 tick-anim-box" /> Report published! Patient has been notified via email.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* === PATIENTS LIST TAB === */}
        {tab === 'patients' && (
          <div className={`rounded-2xl border shadow-sm overflow-hidden ${theme === 'dark' ? 'bg-[#141417] border-[#27272a]' : 'bg-white border-slate-200'}`}>
            <div className={`p-6 border-b flex justify-between items-center ${theme === 'dark' ? 'border-[#27272a]' : 'border-slate-100'}`}>
              <h2 className="text-xl font-extrabold flex items-center gap-2"><Users className="w-5 h-5 text-pink-500" /> Registered Patients</h2>
              <div className="flex gap-2">
                <button onClick={handleExportCSV} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition">
                  <Download className="w-4 h-4" /> Export Data (CSV)
                </button>
                <button onClick={() => setTab('new-patient')} className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm">
                  <UserPlus className="w-4 h-4" /> Add Patient
                </button>
              </div>
            </div>
            <table className="min-w-full divide-y divide-slate-700/20">
              <thead className={theme === 'dark' ? 'bg-[#18181b]' : 'bg-slate-50'}>
                <tr>
                  {['Patient ID', 'Name', 'Username', 'Email', 'Actions'].map(h => (
                    <th key={h} className={`px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/20">
                {patients.length === 0 && <tr><td colSpan={5} className="px-6 py-8 text-center opacity-50 text-sm">No patients registered yet.</td></tr>}
                {patients.map(p => (
                  <tr key={p.id} className={`cursor-pointer transition ${theme === 'dark' ? 'hover:bg-[#18181b]' : 'hover:bg-slate-50'}`} onClick={() => { setSelectedPatientId(String(p.id)); setTab('screen'); }}>
                    <td className="px-6 py-4 text-sm font-mono opacity-80">{p.patient_access_id}</td>
                    <td className="px-6 py-4 text-sm font-extrabold">{p.name}</td>
                    <td className="px-6 py-4 text-sm opacity-80">{p.username}</td>
                    <td className="px-6 py-4 text-sm opacity-80">{p.email || '—'}</td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeletePatient(p.id, p.name); }}
                        className="text-rose-400 hover:text-rose-500 p-2 rounded-lg transition"
                        title="Delete Patient"
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
          <div className={`p-6 rounded-2xl border shadow-sm max-w-lg mx-auto ${theme === 'dark' ? 'bg-[#141417] border-[#27272a]' : 'bg-white border-slate-200'}`}>
            <h2 className="text-xl font-extrabold mb-6 flex items-center gap-2"><UserPlus className="w-5 h-5 text-pink-500" /> Register New Patient</h2>

            {createdPatient ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 text-center space-y-3">
                <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto tick-anim-box" />
                <p className="font-extrabold text-emerald-400 text-lg">Patient registered successfully!</p>
                <div className={`text-xs space-y-1 font-mono rounded-xl p-4 text-left border ${theme === 'dark' ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-emerald-100'}`}>
                  <p><span className="font-semibold opacity-70">Patient ID:</span> {createdPatient.patient_access_id}</p>
                  <p><span className="font-semibold opacity-70">Username:</span> {createdPatient.username}</p>
                  <p><span className="font-semibold opacity-70">Email sent to:</span> {createdPatient.email}</p>
                  {createdPatient.set_password_link && (
                    <p className="pt-2 text-xs font-sans break-all">
                      <span className="font-bold">Direct Activation Link:</span>{' '}
                      <a href={createdPatient.set_password_link} target="_blank" rel="noreferrer" className="text-pink-500 underline">
                        {createdPatient.set_password_link}
                      </a>
                    </p>
                  )}
                </div>
                <button onClick={() => { setCreatedPatient(null); setTab('screen'); }}
                  className="mt-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-2 rounded-xl text-xs font-bold shadow-md">
                  Run Screening for this Patient
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreatePatient} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1 opacity-80">First Name</label>
                    <input value={newPatient.first_name} onChange={e => setNewPatient({ ...newPatient, first_name: e.target.value })}
                      className={`w-full border rounded-xl p-2.5 text-xs outline-none ${theme === 'dark' ? 'bg-[#18181b] border-[#3f3f46] text-[#fafafa]' : 'bg-slate-50 border-slate-300'}`} required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 opacity-80">Last Name</label>
                    <input value={newPatient.last_name} onChange={e => setNewPatient({ ...newPatient, last_name: e.target.value })}
                      className={`w-full border rounded-xl p-2.5 text-xs outline-none ${theme === 'dark' ? 'bg-[#18181b] border-[#3f3f46] text-[#fafafa]' : 'bg-slate-50 border-slate-300'}`} required />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 opacity-80">Email <span className="text-rose-500">*</span></label>
                  <input type="email" value={newPatient.email} onChange={e => setNewPatient({ ...newPatient, email: e.target.value })}
                    className={`w-full border rounded-xl p-2.5 text-xs outline-none ${theme === 'dark' ? 'bg-[#18181b] border-[#3f3f46] text-[#fafafa]' : 'bg-slate-50 border-slate-300'}`} required />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 opacity-80">Phone (optional)</label>
                  <input type="tel" value={newPatient.phone} onChange={e => setNewPatient({ ...newPatient, phone: e.target.value })}
                    className={`w-full border rounded-xl p-2.5 text-xs outline-none ${theme === 'dark' ? 'bg-[#18181b] border-[#3f3f46] text-[#fafafa]' : 'bg-slate-50 border-slate-300'}`} />
                </div>
                <button type="submit" className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-xl font-bold text-xs shadow-md transition">
                  Create Patient & Send Welcome Email
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

