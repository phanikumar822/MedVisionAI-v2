import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { FileText, MessageSquare, Clock, Eye, LogOut, CheckCircle2, ShieldCheck, Stethoscope } from 'lucide-react';

interface VerifiedReport {
  id: number;
  screening_id: string;
  disease_id: string;
  disease_name: string;
  modality: string;
  eye: string;
  prediction: string;
  severity_grade?: string;
  confidence: number;
  risk_level: string;
  doctor_findings?: string;
  doctor_notes?: string;
  verified_at?: string;
  created_at: string;
  status: string;
}

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}

const PatientDashboard = () => {
  const { user, logout } = useAuth();
  const [reports, setReports] = useState<VerifiedReport[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: 'assistant', content: 'Hello! I am your MedVisionAI clinical report assistant. I can answer questions about your doctor-verified ophthalmic report findings and care plan.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Strictly fetches verified reports only from backend
    api.get('/reports/my-reports')
      .then(res => setReports(res.data))
      .catch(err => console.error('Failed to fetch verified reports', err));
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const latestReport = reports[0];

  const handleDownloadReport = async (reportId: number) => {
    try {
      const res = await api.get(`/reports/${reportId}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `MedVisionAI_Verified_Report_${reportId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Could not download verified report. Please check with your clinic.');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    const newMessages: ChatMsg[] = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setChatLoading(true);

    const history = newMessages.slice(1, -1).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [m.content]
    }));

    try {
      const res = await api.post('/chat/', { message: userMsg, history });
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.answer }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'I could not connect to the assistant right now. Please try again.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-sm font-bold">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-slate-900">Patient Health Portal</h1>
              <p className="text-xs text-slate-500 font-medium">Verified Ophthalmology Reports for {user?.username}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setChatOpen(!chatOpen)}
              className="flex items-center space-x-1.5 bg-teal-700 hover:bg-teal-800 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition shadow-sm"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Ask Report Assistant</span>
            </button>

            <button
              onClick={logout}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-900 transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Verification Guarantee Banner */}
        <div className="bg-teal-50/70 border border-teal-200 rounded-xl p-4 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-teal-700 shrink-0" />
          <p className="text-xs text-teal-900 leading-relaxed">
            <strong>Clinical Safety Guarantee:</strong> Reports displayed in your portal have undergone formal clinical verification by an authorized ophthalmologist. Unverified AI screening outputs are never delivered directly to patients.
          </p>
        </div>

        {/* Latest Verified Report Card */}
        {latestReport ? (
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold flex items-center gap-2 text-slate-900">
                <Clock className="w-4 h-4 text-teal-600" /> Latest Verified Ophthalmology Examination
              </h2>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" /> Formally Verified by Ophthalmologist
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 text-center">
                <p className="text-[11px] font-semibold text-slate-500 uppercase mb-1">Target Examination</p>
                <p className="text-sm font-bold text-slate-900">{latestReport.disease_name}</p>
                <p className="text-[11px] text-slate-500 mt-1">{latestReport.eye} Eye ({latestReport.modality})</p>
              </div>

              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 text-center">
                <p className="text-[11px] font-semibold text-slate-500 uppercase mb-1">Clinical Diagnostic Result</p>
                <p className={`text-sm font-black ${latestReport.prediction.includes('NO') || latestReport.prediction.includes('CLEAR') || latestReport.prediction.includes('NORMAL') ? 'text-emerald-700' : 'text-red-700'}`}>
                  {latestReport.prediction}
                </p>
                {latestReport.severity_grade && (
                  <p className="text-[11px] text-slate-600 mt-1 truncate">{latestReport.severity_grade}</p>
                )}
              </div>

              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 text-center flex flex-col justify-center items-center gap-2">
                <button
                  onClick={() => handleDownloadReport(latestReport.id)}
                  className="flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-900 bg-white border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-md transition shadow-2xs w-full justify-center"
                >
                  <FileText className="w-4 h-4 text-teal-600" /> Download Verified PDF Report
                </button>
                <button
                  onClick={() => setChatOpen(true)}
                  className="text-[11px] text-slate-500 hover:text-slate-800 transition"
                >
                  Ask questions about this report
                </button>
              </div>
            </div>

            {/* Doctor Notes Box */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 space-y-2 text-xs text-slate-700">
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <Stethoscope className="w-4 h-4 text-teal-600" />
                Ophthalmologist Clinical Findings & Care Plan
              </div>
              <p className="leading-relaxed">
                <strong>Doctor's Observations:</strong> {latestReport.doctor_findings || 'Evaluation concordant with clinical standards.'}
              </p>
              <p className="leading-relaxed">
                <strong>Recommended Plan:</strong> {latestReport.doctor_notes || 'Follow standard routine periodic screening schedule.'}
              </p>
              {latestReport.verified_at && (
                <p className="text-[10px] text-slate-400 pt-1">
                  Verified timestamp: {new Date(latestReport.verified_at).toLocaleString()}
                </p>
              )}
            </div>
          </section>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
            <Eye className="w-10 h-10 mx-auto mb-3 opacity-30 text-teal-600" />
            <p className="text-sm font-bold text-slate-900">No verified reports available</p>
            <p className="text-xs mt-1 text-slate-400">
              Your screening case is currently being reviewed by your doctor. Verified reports will appear here as soon as they are signed off.
            </p>
          </div>
        )}

        {/* Verified Reports History Table */}
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">All Verified Examination Reports</h3>
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {['Date', 'Case Ref', 'Examination', 'Result', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {reports.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                      No verified records on file.
                    </td>
                  </tr>
                )}
                {reports.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-3 font-medium text-slate-800">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="px-5 py-3 font-mono text-slate-500">{r.screening_id}</td>
                    <td className="px-5 py-3 text-slate-700">
                      <span className="font-semibold block">{r.disease_name}</span>
                      <span className="text-[10px] text-slate-400">{r.eye} | {r.modality}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                        <CheckCircle2 className="w-3 h-3" />
                        {r.prediction}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => handleDownloadReport(r.id)}
                        className="text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" /> PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* RAG Assistant Drawer Window */}
      {chatOpen && (
        <div className="fixed bottom-4 right-6 w-96 rounded-xl flex flex-col h-[520px] z-50 border border-slate-300 bg-white text-slate-900 shadow-xl">
          <div className="p-3.5 rounded-t-xl flex justify-between items-center border-b border-slate-200 bg-slate-50">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-teal-600 text-white flex items-center justify-center font-bold text-xs">
                <MessageSquare className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-slate-900">Clinical Report Assistant</h3>
                <p className="text-[10px] text-teal-700 font-medium">Grounded in Authorized Clinical Records</p>
              </div>
            </div>
            <button onClick={() => setChatOpen(false)} className="text-slate-400 hover:text-slate-700 text-lg leading-none">&times;</button>
          </div>

          <div className="flex-1 p-3.5 overflow-y-auto flex flex-col gap-2.5 bg-slate-50 text-xs">
            {messages.map((msg, i) => (
              <div key={i} className={`max-w-[85%] p-2.5 rounded-lg leading-relaxed whitespace-pre-wrap ${
                msg.role === 'assistant'
                  ? 'bg-white border border-slate-200 text-slate-800 self-start'
                  : 'bg-slate-900 text-white self-end'
              }`}>
                {msg.content}
              </div>
            ))}
            {chatLoading && (
              <div className="self-start rounded-lg px-3 py-2 text-xs bg-white border border-slate-200 text-slate-500">
                Reviewing verified report context…
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-2.5 border-t border-slate-200 flex gap-2 rounded-b-xl bg-white">
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder="Ask about your report findings..."
              className="flex-1 border border-slate-300 rounded-md px-2.5 py-1.5 text-xs outline-none focus:border-teal-600 bg-slate-50"
              disabled={chatLoading}
            />
            <button
              type="submit"
              disabled={chatLoading || !chatInput.trim()}
              className="bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white px-3 py-1.5 rounded-md text-xs font-bold transition"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;
