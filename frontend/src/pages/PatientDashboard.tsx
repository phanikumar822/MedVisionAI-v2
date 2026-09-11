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
    <div className="min-h-screen bg-[#FAF7F2] text-[#23211E]">
      
      {/* Header */}
      <header className="bg-white border-b border-[#EBE5DD] sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1E1E1E] flex items-center justify-center shadow-sm">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight">Welcome, {user?.username}</h1>
              <p className="text-xs text-[#706B63]">MedVisionAI Patient Health Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setChatOpen(!chatOpen)}
              className="flex items-center space-x-2 bg-[#1E1E1E] hover:bg-[#3D3A36] text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm hover:scale-[1.01]"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Ask Health Assistant</span>
            </button>

            <button
              onClick={logout}
              className="p-2 rounded-xl border border-[#EBE5DD] bg-white text-[#706B63] hover:text-[#23211E] transition"
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
          <section className="rounded-2xl border border-[#EBE5DD] bg-white p-8 shadow-sm">
            <h2 className="text-xl font-extrabold mb-6 flex items-center gap-2 text-[#23211E]">
              <Clock className="w-5 h-5 text-[#C85A32]" /> Latest Screening Result
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-6 rounded-xl border border-[#EBE5DD] bg-[#FAF7F2] text-center">
                <p className="text-xs font-semibold mb-1 text-[#706B63]">Status</p>
                <p className={`text-2xl font-black ${latestScreening.prediction === 'DR PRESENT' ? 'text-[#C85A32]' : 'text-[#2E7D32]'}`}>
                  {latestScreening.prediction}
                </p>
              </div>
              <div className="p-6 rounded-xl border border-[#EBE5DD] bg-[#FAF7F2] text-center">
                <p className="text-xs font-semibold mb-1 text-[#706B63]">Confidence</p>
                <p className="text-2xl font-black text-[#23211E]">{(latestScreening.confidence * 100).toFixed(0)}%</p>
              </div>
              <div className="p-6 rounded-xl border border-[#EBE5DD] bg-[#FAF7F2] text-center flex flex-col justify-center items-center gap-3">
                <button onClick={() => handleDownloadReport(latestScreening.id)}
                  className="flex items-center gap-2 text-[#C85A32] font-bold hover:underline transition text-sm">
                  <FileText className="w-4 h-4" /> Download PDF Report
                </button>
                <button onClick={() => setChatOpen(true)}
                  className="flex items-center gap-2 text-xs text-[#706B63] hover:text-[#23211E] transition">
                  <Eye className="w-3.5 h-3.5" /> Ask about this result
                </button>
              </div>
            </div>

            {latestScreening.prediction === 'DR PRESENT' && (
              <div className="mt-6 bg-[#FDF4EE] border border-[#FCDAC6] rounded-xl p-4 text-[#C85A32] text-sm font-medium">
                ⚠️ Signs of diabetic retinopathy were detected. Please consult an ophthalmologist for a full clinical evaluation.
              </div>
            )}
          </section>
        ) : (
          <div className="rounded-2xl border border-[#EBE5DD] bg-white p-12 text-center text-[#706B63]">
            <Eye className="w-12 h-12 mx-auto mb-4 opacity-30 text-[#C85A32]" />
            <p className="text-lg font-bold text-[#23211E]">No screening results yet</p>
            <p className="text-sm mt-1">Your doctor will publish your screening results here once complete.</p>
          </div>
        )}

        {/* History Table */}
        <section>
          <h3 className="text-lg font-extrabold mb-4 text-[#23211E]">Screening History</h3>
          <div className="rounded-2xl border border-[#EBE5DD] bg-white overflow-hidden">
            <table className="min-w-full divide-y divide-[#EBE5DD]">
              <thead className="bg-[#FAF7F2]">
                <tr>
                  {['Date', 'Screening ID', 'Result', 'Confidence', 'Report'].map(h => (
                    <th key={h} className="px-6 py-3.5 text-left text-xs font-bold text-[#706B63] uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBE5DD]">
                {screenings.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-[#706B63]">No results recorded yet.</td></tr>
                )}
                {screenings.map(s => (
                  <tr key={s.id} className="hover:bg-[#FAF7F2] transition">
                    <td className="px-6 py-4 text-sm font-medium">{new Date(s.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm font-mono text-[#706B63]">{s.screening_id}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full ${
                        s.prediction === 'DR PRESENT'
                          ? 'bg-[#FDF4EE] text-[#C85A32] border border-[#FCDAC6]'
                          : 'bg-[#F0F7F1] text-[#2E7D32] border border-[#C8E6C9]'
                      }`}>
                        <CheckCircle2 className="w-3 h-3 tick-anim-box" />
                        {s.prediction}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold">{s.confidence ? (s.confidence * 100).toFixed(0) : '0'}%</td>
                    <td className="px-6 py-4">
                      <button onClick={() => handleDownloadReport(s.id)}
                        className="text-[#C85A32] hover:underline text-xs font-bold flex items-center gap-1">
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

      {/* RAG Chatbot Drawer with macOS App Launch Drop Expansion Effect */}
      {chatOpen && (
        <div className="fixed bottom-4 right-6 w-96 rounded-2xl flex flex-col h-[560px] z-50 mac-chat-window border border-[#EBE5DD] bg-white text-[#23211E]">
          
          {/* macOS Titlebar Header */}
          <div className="p-4 rounded-t-2xl flex justify-between items-center border-b border-[#EBE5DD] bg-[#FAF7F2]">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500 inline-block cursor-pointer" onClick={() => setChatOpen(false)}></span>
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
              </div>
              <div>
                <h3 className="font-bold text-xs tracking-tight">MedVisionAI Health Assistant</h3>
                <p className="text-[10px] text-[#706B63]">Answers based on official test reports</p>
              </div>
            </div>
            <button onClick={() => setChatOpen(false)} className="text-[#706B63] hover:text-[#23211E] text-lg leading-none">&times;</button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 bg-[#FAF7F2]">
            {messages.map((msg, i) => (
              <div key={i} className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                msg.role === 'assistant'
                  ? 'bg-white border border-[#EBE5DD] text-[#23211E] self-start rounded-tl-none shadow-sm'
                  : 'bg-[#1E1E1E] text-white self-end rounded-tr-none shadow-md'
              }`}>
                {msg.content}
              </div>
            ))}
            {chatLoading && (
              <div className="self-start rounded-2xl rounded-tl-none px-4 py-3 text-xs bg-white border border-[#EBE5DD] text-[#706B63]">
                Thinking…
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-[#EBE5DD] flex gap-2 rounded-b-2xl bg-white">
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder="Ask about your report details..."
              className="flex-1 border border-[#DBD5C9] rounded-xl px-4 py-2 text-xs outline-none focus:border-[#1E1E1E] bg-[#FAF7F2]"
              disabled={chatLoading}
            />
            <button type="submit" disabled={chatLoading || !chatInput.trim()}
              className="bg-[#1E1E1E] hover:bg-[#3D3A36] disabled:opacity-40 text-white px-4 py-2 rounded-xl text-xs font-bold transition">
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;


