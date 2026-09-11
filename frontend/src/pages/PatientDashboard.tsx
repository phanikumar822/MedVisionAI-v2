import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { FileText, MessageSquare, Clock, Eye, LogOut, CheckCircle2 } from 'lucide-react';

interface Screening {
  id: number;
  screening_id: string;
  prediction: string;
  confidence: number;
  created_at: string;
}

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}

const PatientDashboard = () => {
  const { user, logout } = useAuth();
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: 'assistant', content: 'Hello! I can help answer questions about your MedVisionAI screening report. What would you like to know?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get('/reports/my-reports')
      .then(res => setScreenings(res.data))
      .catch(err => console.error('Failed to fetch reports', err));
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const latestScreening = screenings[0];

  const handleDownloadReport = async (reportId: number) => {
    try {
      const res = await api.get(`/reports/${reportId}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `MedVisionAI_Report_${reportId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Could not download report.');
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
    <div className="min-h-screen bg-[#F8F9FA] text-[#0F172A]">
      
      {/* Header */}
      <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#0F172A] flex items-center justify-center shadow-sm">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-[#0F172A]">Welcome, {user?.username}</h1>
              <p className="text-xs text-[#64748B] font-medium">MedVisionAI Patient Health Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setChatOpen(!chatOpen)}
              className="flex items-center space-x-2 bg-[#0F766E] hover:bg-[#0D9488] text-white px-4 py-2 rounded-lg text-xs font-bold transition shadow-xs"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Ask Report Assistant</span>
            </button>

            <button
              onClick={logout}
              className="p-2 rounded-lg border border-[#E2E8F0] bg-white text-[#64748B] hover:text-[#0F172A] transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Latest Result Card */}
        {latestScreening ? (
          <section className="rounded-xl border border-[#E2E8F0] bg-white p-8 shadow-xs">
            <h2 className="text-lg font-extrabold mb-6 flex items-center gap-2 text-[#0F172A]">
              <Clock className="w-5 h-5 text-[#0F766E]" /> Latest Screening Result
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-6 rounded-lg border border-[#E2E8F0] bg-[#F8F9FA] text-center">
                <p className="text-xs font-semibold mb-1 text-[#64748B]">Diagnostic Status</p>
                <p className={`text-xl font-black ${latestScreening.prediction === 'DR PRESENT' ? 'text-[#9F1239]' : 'text-[#065F46]'}`}>
                  {latestScreening.prediction}
                </p>
              </div>
              <div className="p-6 rounded-lg border border-[#E2E8F0] bg-[#F8F9FA] text-center">
                <p className="text-xs font-semibold mb-1 text-[#64748B]">Confidence Score</p>
                <p className="text-xl font-black text-[#0F172A]">{(latestScreening.confidence * 100).toFixed(0)}%</p>
              </div>
              <div className="p-6 rounded-lg border border-[#E2E8F0] bg-[#F8F9FA] text-center flex flex-col justify-center items-center gap-3">
                <button onClick={() => handleDownloadReport(latestScreening.id)}
                  className="flex items-center gap-2 text-[#0F766E] font-bold hover:underline transition text-xs">
                  <FileText className="w-4 h-4" /> Download PDF Report
                </button>
                <button onClick={() => setChatOpen(true)}
                  className="flex items-center gap-2 text-xs text-[#64748B] hover:text-[#0F172A] transition">
                  <Eye className="w-3.5 h-3.5" /> Ask Assistant About Report
                </button>
              </div>
            </div>

            {latestScreening.prediction === 'DR PRESENT' && (
              <div className="mt-6 bg-[#FEF2F2] border border-[#FECDD3] rounded-lg p-4 text-[#9F1239] text-xs font-medium">
                ⚠️ Signs of diabetic retinopathy were detected. Please consult an ophthalmologist for a full clinical evaluation.
              </div>
            )}
          </section>
        ) : (
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-12 text-center text-[#64748B]">
            <Eye className="w-12 h-12 mx-auto mb-4 opacity-30 text-[#0F766E]" />
            <p className="text-base font-bold text-[#0F172A]">No screening results yet</p>
            <p className="text-xs mt-1">Your clinician will publish your screening results here once complete.</p>
          </div>
        )}

        {/* History Table */}
        <section>
          <h3 className="text-base font-extrabold mb-4 text-[#0F172A]">Screening History</h3>
          <div className="rounded-xl border border-[#E2E8F0] bg-white overflow-hidden shadow-xs">
            <table className="min-w-full divide-y divide-[#E2E8F0]">
              <thead className="bg-[#F8F9FA]">
                <tr>
                  {['Date', 'Screening ID', 'Result', 'Confidence', 'Report'].map(h => (
                    <th key={h} className="px-6 py-3.5 text-left text-xs font-bold text-[#64748B] uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {screenings.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-[#64748B]">No results recorded yet.</td></tr>
                )}
                {screenings.map(s => (
                  <tr key={s.id} className="hover:bg-[#F8F9FA] transition">
                    <td className="px-6 py-4 text-sm font-medium text-[#0F172A]">{new Date(s.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm font-mono text-[#64748B]">{s.screening_id}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full ${
                        s.prediction === 'DR PRESENT'
                          ? 'bg-[#FEF2F2] text-[#9F1239] border border-[#FECDD3]'
                          : 'bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]'
                      }`}>
                        <CheckCircle2 className="w-3 h-3 tick-anim-box" />
                        {s.prediction}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-[#0F172A]">{s.confidence ? (s.confidence * 100).toFixed(0) : '0'}%</td>
                    <td className="px-6 py-4">
                      <button onClick={() => handleDownloadReport(s.id)}
                        className="text-[#0F766E] hover:underline text-xs font-bold flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" /> Download
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
        <div className="fixed bottom-4 right-6 w-96 rounded-xl flex flex-col h-[560px] z-50 mac-chat-window border border-[#E2E8F0] bg-white text-[#0F172A]">
          
          {/* Header */}
          <div className="p-4 rounded-t-xl flex justify-between items-center border-b border-[#E2E8F0] bg-[#F8F9FA]">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-[#0F766E] text-white flex items-center justify-center font-bold text-xs">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-xs tracking-tight text-[#0F172A]">Report Assistant</h3>
                <p className="text-[10px] text-[#0F766E] font-semibold">🔒 Grounded in Diagnostic Medical Report</p>
              </div>
            </div>
            <button onClick={() => setChatOpen(false)} className="text-[#64748B] hover:text-[#0F172A] text-lg leading-none">&times;</button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 bg-[#F8F9FA]">
            {messages.map((msg, i) => (
              <div key={i} className={`max-w-[85%] p-3 rounded-lg text-xs leading-relaxed whitespace-pre-wrap ${
                msg.role === 'assistant'
                  ? 'bg-white border border-[#E2E8F0] text-[#0F172A] self-start rounded-tl-none shadow-xs'
                  : 'bg-[#0F172A] text-white self-end rounded-tr-none shadow-xs'
              }`}>
                {msg.content}
              </div>
            ))}
            {chatLoading && (
              <div className="self-start rounded-lg rounded-tl-none px-4 py-3 text-xs bg-white border border-[#E2E8F0] text-[#64748B]">
                Analyzing medical record context…
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-[#E2E8F0] flex gap-2 rounded-b-xl bg-white">
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder="Ask about your report findings..."
              className="flex-1 border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs outline-none focus:border-[#0F766E] bg-[#F8F9FA]"
              disabled={chatLoading}
            />
            <button type="submit" disabled={chatLoading || !chatInput.trim()}
              className="bg-[#0F172A] hover:bg-[#1E293B] disabled:opacity-40 text-white px-4 py-2 rounded-lg text-xs font-bold transition">
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;


