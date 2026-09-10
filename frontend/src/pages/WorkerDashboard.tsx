import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Upload, Eye, FileText, UserPlus, Users, AlertTriangle, CheckCircle, Trash2, Download, LogOut } from 'lucide-react';

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
    <div className="min-h-screen bg-[#FAF7F2] text-[#23211E]">
      
      {/* Header */}
      <header className="bg-white border-b border-[#EBE5DD] sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1E1E1E] flex items-center justify-center shadow-sm">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-[#23211E]">Clinical Screening Suite</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex space-x-2">
              {(['screen', 'patients', 'new-patient'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                    tab === t 
                      ? 'bg-[#C85A32] text-white shadow-sm' 
                      : 'bg-[#F5F0E8] text-[#706B63] hover:bg-[#EBE5DD] hover:text-[#23211E]'
                  }`}>
                  {t === 'screen' ? '🔬 Run Screening' : t === 'patients' ? '👥 Patient Directory' : '➕ Register Patient'}
                </button>
              ))}
            </div>

            <button
              onClick={logout}
              className="p-2 rounded-xl border border-[#EBE5DD] bg-white text-[#706B63] hover:text-[#23211E] hover:bg-[#F5F0E8] transition"
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
            <div className="p-6 rounded-2xl border border-[#EBE5DD] bg-white shadow-sm">
              <h2 className="text-xl font-extrabold mb-4 flex items-center gap-2 text-[#23211E]">
                <Upload className="w-5 h-5 text-[#C85A32]" /> New Retinal Screening
              </h2>
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-[#706B63]">Select Patient Profile</label>
                  <select value={selectedPatientId} onChange={e => setSelectedPatientId(e.target.value)}
                    className="w-full border border-[#EBE5DD] bg-[#FAF7F2] text-[#23211E] rounded-xl p-2.5 text-sm outline-none focus:border-[#C85A32]" required>
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
                  <label className="block text-xs font-semibold mb-1 text-[#706B63]">Retinal Fundus Image</label>
                  <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)}
                    className="w-full border border-[#EBE5DD] bg-[#FAF7F2] text-[#23211E] rounded-xl p-2 text-sm outline-none focus:border-[#C85A32]" required />
                </div>
                <button type="submit" disabled={loading || !selectedPatientId}
                  className="w-full bg-[#C85A32] hover:bg-[#B34E2B] disabled:opacity-40 text-white px-6 py-3 rounded-xl font-bold transition shadow-sm">
                  {loading ? '⏳ Analyzing Retinal Scan…' : 'Run Diagnostic AI Inference'}
                </button>
              </form>
            </div>

            {result && (
              <div className="p-6 rounded-2xl border border-[#EBE5DD] bg-white shadow-sm">
                <h2 className="text-xl font-extrabold mb-4 flex items-center gap-2 text-[#23211E]">
                  <Eye className="w-5 h-5 text-emerald-600" /> Screening Diagnostic Summary
                </h2>
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div className="p-4 rounded-xl border border-[#EBE5DD] bg-[#FAF7F2] text-center">
                    <p className="text-xs text-[#706B63] mb-1">Diagnostic Finding</p>
                    <p className={`text-2xl font-black ${result.prediction === 'DR PRESENT' ? 'text-rose-600' : 'text-emerald-700'}`}>{result.prediction}</p>
                  </div>
                  <div className="p-4 rounded-xl border border-[#EBE5DD] bg-[#FAF7F2] text-center">
                    <p className="text-xs text-[#706B63] mb-1">Confidence Score</p>
                    <p className="text-2xl font-black text-[#23211E]">{(result.confidence * 100).toFixed(1)}%</p>
                  </div>
                  <div className="p-4 rounded-xl border border-[#EBE5DD] bg-[#FAF7F2] text-center">
                    <p className="text-xs text-[#706B63] mb-1">Assessed Risk Level</p>
                    <p className="text-xl font-bold text-[#23211E]">{result.risk_level}</p>
                  </div>
                </div>
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-4 flex items-start gap-2 text-xs text-rose-800">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" /> {result.recommendation}
                </div>
                <div className="flex items-center gap-4">
                  {reportStatus !== 'done' ? (
                    <button onClick={handleGenerateAndPublish} disabled={reportStatus === 'generating'}
                      className="flex items-center gap-2 bg-[#1E1E1E] hover:bg-[#333333] disabled:opacity-40 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm">
                      <FileText className="w-4 h-4" />
                      {reportStatus === 'generating' ? 'Generating Report…' : 'Publish Report & Notify Patient'}
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
                      <CheckCircle className="w-5 h-5 tick-anim-box text-emerald-600" /> Report published and delivered to patient portal & email.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* === PATIENTS LIST TAB === */}
        {tab === 'patients' && (
          <div className="rounded-2xl border border-[#EBE5DD] bg-white shadow-sm overflow-hidden">
            <div className="p-6 border-b border-[#EBE5DD] flex justify-between items-center">
              <h2 className="text-xl font-extrabold flex items-center gap-2 text-[#23211E]"><Users className="w-5 h-5 text-[#C85A32]" /> Patient Directory</h2>
              <div className="flex gap-2">
                <button onClick={handleExportCSV} className="flex items-center gap-2 bg-[#1E1E1E] hover:bg-[#333333] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition">
                  <Download className="w-4 h-4" /> Export CSV
                </button>
                <button onClick={() => setTab('new-patient')} className="flex items-center gap-2 bg-[#C85A32] hover:bg-[#B34E2B] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm">
                  <UserPlus className="w-4 h-4" /> Add Patient
                </button>
              </div>
            </div>
            <table className="min-w-full divide-y divide-[#EBE5DD]">
              <thead className="bg-[#F5F0E8]">
                <tr>
                  {['Patient ID', 'Full Name', 'Username', 'Email', 'Actions'].map(h => (
                    <th key={h} className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-[#706B63]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBE5DD]">
                {patients.length === 0 && <tr><td colSpan={5} className="px-6 py-8 text-center text-[#706B63] text-sm">No registered patient records found.</td></tr>}
                {patients.map(p => (
                  <tr key={p.id} className="cursor-pointer transition hover:bg-[#FAF7F2]" onClick={() => { setSelectedPatientId(String(p.id)); setTab('screen'); }}>
                    <td className="px-6 py-4 text-sm font-mono text-[#706B63]">{p.patient_access_id}</td>
                    <td className="px-6 py-4 text-sm font-extrabold text-[#23211E]">{p.name}</td>
                    <td className="px-6 py-4 text-sm text-[#706B63]">{p.username}</td>
                    <td className="px-6 py-4 text-sm text-[#706B63]">{p.email || '—'}</td>
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
          <div className="p-6 rounded-2xl border border-[#EBE5DD] bg-white shadow-sm max-w-lg mx-auto">
            <h2 className="text-xl font-extrabold mb-6 flex items-center gap-2 text-[#23211E]"><UserPlus className="w-5 h-5 text-[#C85A32]" /> Register Patient Profile</h2>

            {createdPatient ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3">
                <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto tick-anim-box" />
                <p className="font-extrabold text-emerald-800 text-lg">Patient account created successfully</p>
                <div className="text-xs space-y-1 font-mono rounded-xl p-4 text-left border bg-white border-emerald-200 text-[#23211E]">
                  <p><span className="font-semibold text-[#706B63]">Patient ID:</span> {createdPatient.patient_access_id}</p>
                  <p><span className="font-semibold text-[#706B63]">Username:</span> {createdPatient.username}</p>
                  <p><span className="font-semibold text-[#706B63]">Email:</span> {createdPatient.email}</p>
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
                    <label className="block text-xs font-semibold mb-1 text-[#706B63]">First Name</label>
                    <input value={newPatient.first_name} onChange={e => setNewPatient({ ...newPatient, first_name: e.target.value })}
                      className="w-full border border-[#EBE5DD] bg-[#FAF7F2] text-[#23211E] rounded-xl p-2.5 text-xs outline-none focus:border-[#C85A32]" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-[#706B63]">Last Name</label>
                    <input value={newPatient.last_name} onChange={e => setNewPatient({ ...newPatient, last_name: e.target.value })}
                      className="w-full border border-[#EBE5DD] bg-[#FAF7F2] text-[#23211E] rounded-xl p-2.5 text-xs outline-none focus:border-[#C85A32]" required />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-[#706B63]">Email Address <span className="text-rose-600">*</span></label>
                  <input type="email" value={newPatient.email} onChange={e => setNewPatient({ ...newPatient, email: e.target.value })}
                    className="w-full border border-[#EBE5DD] bg-[#FAF7F2] text-[#23211E] rounded-xl p-2.5 text-xs outline-none focus:border-[#C85A32]" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-[#706B63]">Phone Number (Optional)</label>
                  <input type="tel" value={newPatient.phone} onChange={e => setNewPatient({ ...newPatient, phone: e.target.value })}
                    className="w-full border border-[#EBE5DD] bg-[#FAF7F2] text-[#23211E] rounded-xl p-2.5 text-xs outline-none focus:border-[#C85A32]" />
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

