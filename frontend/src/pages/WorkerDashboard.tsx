import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Upload, Eye, FileText, UserPlus, Users, AlertTriangle, CheckCircle, Trash2 } from 'lucide-react';

interface Patient { id: number; name: string; patient_access_id: string; email: string; username: string; }
interface ScreeningResult { id: number; screening_id: string; prediction: string; confidence: number; risk_level: string; recommendation: string; }

const WorkerDashboard = () => {
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

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800">Doctor Portal</h1>
          <div className="flex space-x-2">
            {(['screen', 'patients', 'new-patient'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === t ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {t === 'screen' ? '🔬 Run Screening' : t === 'patients' ? '👥 My Patients' : '➕ New Patient'}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">

        {/* === RUN SCREENING TAB === */}
        {tab === 'screen' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-500" /> New Screening
              </h2>
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Select Patient</label>
                  <select value={selectedPatientId} onChange={e => setSelectedPatientId(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500" required>
                    <option value="">— Select a patient —</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.patient_access_id})</option>
                    ))}
                  </select>
                  {patients.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">No patients yet. <button type="button" onClick={() => setTab('new-patient')} className="underline">Create one first →</button></p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Retinal Fundus Image</label>
                  <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)}
                    className="w-full border border-slate-300 rounded-lg p-2" required />
                </div>
                <button type="submit" disabled={loading || !selectedPatientId}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-6 py-3 rounded-lg font-semibold transition shadow-sm">
                  {loading ? '⏳ Running AI Inference…' : 'Run AI Screening'}
                </button>
              </form>
            </div>

            {result && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-emerald-500" /> Screening Result
                </h2>
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-slate-50 p-4 rounded-xl text-center border">
                    <p className="text-xs text-slate-500 mb-1">Prediction</p>
                    <p className={`text-2xl font-bold ${result.prediction === 'DR PRESENT' ? 'text-red-600' : 'text-emerald-600'}`}>{result.prediction}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl text-center border">
                    <p className="text-xs text-slate-500 mb-1">Confidence</p>
                    <p className="text-2xl font-bold text-slate-800">{(result.confidence * 100).toFixed(1)}%</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl text-center border">
                    <p className="text-xs text-slate-500 mb-1">Risk Level</p>
                    <p className="text-xl font-bold text-slate-700">{result.risk_level}</p>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4 flex items-start gap-2 text-sm text-blue-800">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" /> {result.recommendation}
                </div>
                <div className="flex items-center gap-4">
                  {reportStatus !== 'done' ? (
                    <button onClick={handleGenerateAndPublish} disabled={reportStatus === 'generating'}
                      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-sm">
                      <FileText className="w-4 h-4" />
                      {reportStatus === 'generating' ? 'Generating…' : 'Generate & Publish Report (Email Patient)'}
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                      <CheckCircle className="w-5 h-5" /> Report published! Patient has been notified via email.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* === PATIENTS LIST TAB === */}
        {tab === 'patients' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Users className="w-5 h-5 text-blue-500" /> Registered Patients</h2>
              <button onClick={() => setTab('new-patient')} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
                <UserPlus className="w-4 h-4" /> Add Patient
              </button>
            </div>
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {['Patient ID', 'Name', 'Username', 'Email', 'Actions'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {patients.length === 0 && <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">No patients yet. Create one first.</td></tr>}
                {patients.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => { setSelectedPatientId(String(p.id)); setTab('screen'); }}>
                    <td className="px-6 py-4 text-sm font-mono text-slate-700">{p.patient_access_id}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{p.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{p.username}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{p.email || '—'}</td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeletePatient(p.id, p.name); }}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition"
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
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 max-w-lg mx-auto">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><UserPlus className="w-5 h-5 text-blue-500" /> Register New Patient</h2>

            {createdPatient ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center space-y-3">
                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
                <p className="font-bold text-emerald-800 text-lg">Patient registered successfully!</p>
                <div className="text-sm text-emerald-700 space-y-1 font-mono bg-white rounded-lg p-4 text-left border border-emerald-100">
                  <p><span className="font-semibold">Patient ID:</span> {createdPatient.patient_access_id}</p>
                  <p><span className="font-semibold">Auto-generated username:</span> {createdPatient.username}</p>
                  <p><span className="font-semibold">Email sent to:</span> {createdPatient.email}</p>
                  {createdPatient.set_password_link && (
                    <p className="pt-2 text-xs font-sans text-slate-600 break-all">
                      <span className="font-semibold text-slate-800">Direct Activation Link:</span>{' '}
                      <a href={createdPatient.set_password_link} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                        {createdPatient.set_password_link}
                      </a>
                    </p>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  📧 A welcome email with the patient's username and a <strong>Set Password</strong> link has been sent automatically.
                  The link expires in 48 hours.
                </p>
                <button onClick={() => { setCreatedPatient(null); setTab('screen'); }}
                  className="mt-2 bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium">
                  Run Screening for this Patient
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreatePatient} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">First Name</label>
                    <input value={newPatient.first_name} onChange={e => setNewPatient({ ...newPatient, first_name: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Last Name</label>
                    <input value={newPatient.last_name} onChange={e => setNewPatient({ ...newPatient, last_name: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500" required />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Email <span className="text-red-500">*</span></label>
                  <input type="email" value={newPatient.email} onChange={e => setNewPatient({ ...newPatient, email: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500" required />
                  <p className="text-xs text-slate-400 mt-1">A welcome email with username + set-password link will be sent here automatically.</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Phone (optional)</label>
                  <input type="tel" value={newPatient.phone} onChange={e => setNewPatient({ ...newPatient, phone: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700">
                  🔐 Username will be auto-generated from the patient's name (e.g., <span className="font-mono">jane.smith_a3f2</span>).
                  The patient sets their own password by clicking the link in the welcome email.
                </div>
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold text-sm transition">
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
