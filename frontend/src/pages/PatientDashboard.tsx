import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { FileText, MessageSquare, Clock, Eye, Sun, Moon, LogOut, CheckCircle2 } from 'lucide-react';

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
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: 'assistant', content: 'Hello! I can help you understand your MedVisionAI screening report. What would you like to know?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

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
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-[#09090b] text-[#fafafa]' : 'bg-[#f8fafc] text-[#0f172a]'}`}>
      
      {/* Header */}
      <header className={`border-b sticky top-0 z-40 transition-colors duration-300 ${theme === 'dark' ? 'bg-[#141417]/90 border-[#27272a]' : 'bg-white/90 border-slate-200'} backdrop-blur-md`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${theme === 'dark' ? 'bg-gradient-to-br from-[#27272a] to-[#ec4899]' : 'bg-gradient-to-br from-[#0f172a] to-[#2563eb]'}`}>
              <Eye className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight">Welcome, {user?.username}</h1>
              <p className={`text-xs ${theme === 'dark' ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>MedVisionAI Patient Health Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                theme === 'dark' ? 'bg-[#18181b] border-[#3f3f46] text-[#e4e4e7] hover:bg-[#27272a]' : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-700" />}
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>

            <button
              onClick={() => setChatOpen(!chatOpen)}
              className="flex items-center space-x-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition shadow-md hover:scale-[1.02]"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Ask MedVisionAI</span>
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

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Latest Result Card */}
        {latestScreening ? (
          <section className={`rounded-2xl border p-8 shadow-sm transition-colors duration-300 ${
            theme === 'dark' ? 'bg-[#141417] border-[#27272a]' : 'bg-white border-slate-200'
          }`}>
            <h2 className="text-xl font-extrabold mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-pink-500" /> Latest Screening Result
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className={`p-6 rounded-xl border text-center ${
                theme === 'dark' ? 'bg-[#18181b] border-[#27272a]' : 'bg-slate-50 border-slate-200'
              }`}>
                <p className={`text-xs font-semibold mb-1 ${theme === 'dark' ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>Status</p>
                <p className={`text-2xl font-black ${latestScreening.prediction === 'DR PRESENT' ? 'text-red-500' : 'text-emerald-500'}`}>
                  {latestScreening.prediction}
                </p>
              </div>
              <div className={`p-6 rounded-xl border text-center ${
                theme === 'dark' ? 'bg-[#18181b] border-[#27272a]' : 'bg-slate-50 border-slate-200'
              }`}>
                <p className={`text-xs font-semibold mb-1 ${theme === 'dark' ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>Model Confidence</p>
                <p className="text-2xl font-black">{(latestScreening.confidence * 100).toFixed(0)}%</p>
              </div>
              <div className={`p-6 rounded-xl border text-center flex flex-col justify-center items-center gap-3 ${
                theme === 'dark' ? 'bg-[#18181b] border-[#27272a]' : 'bg-slate-50 border-slate-200'
              }`}>
                <button onClick={() => handleDownloadReport(latestScreening.id)}
                  className="flex items-center gap-2 text-pink-500 font-bold hover:text-pink-400 transition text-sm">
                  <FileText className="w-4 h-4" /> Download PDF Report
                </button>
                <button onClick={() => setChatOpen(true)}
                  className={`flex items-center gap-2 text-xs transition ${theme === 'dark' ? 'text-[#a1a1aa] hover:text-pink-400' : 'text-slate-500 hover:text-blue-600'}`}>
                  <Eye className="w-3.5 h-3.5" /> Ask about this result
                </button>
              </div>
            </div>

            {latestScreening.prediction === 'DR PRESENT' && (
              <div className="mt-6 bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-rose-400 text-sm">
                ⚠️ Signs of diabetic retinopathy were detected. Please consult a qualified ophthalmologist promptly for a full clinical evaluation.
              </div>
            )}
          </section>
        ) : (
          <div className={`rounded-2xl border p-12 text-center ${
            theme === 'dark' ? 'bg-[#141417] border-[#27272a] text-[#71717a]' : 'bg-white border-slate-200 text-slate-400'
          }`}>
            <Eye className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-bold">No screening results yet</p>
            <p className="text-sm mt-1">Your doctor will upload and publish your results here once your screening is complete.</p>
          </div>
        )}

        {/* History Table */}
        <section>
          <h3 className="text-lg font-extrabold mb-4">Screening History</h3>
          <div className={`rounded-2xl border overflow-hidden ${
            theme === 'dark' ? 'bg-[#141417] border-[#27272a]' : 'bg-white border-slate-200'
          }`}>
            <table className="min-w-full divide-y divide-slate-700/30">
              <thead className={theme === 'dark' ? 'bg-[#18181b]' : 'bg-slate-50'}>
                <tr>
                  {['Date', 'Screening ID', 'Result', 'Confidence', 'Report'].map(h => (
                    <th key={h} className={`px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider ${
                      theme === 'dark' ? 'text-[#a1a1aa]' : 'text-slate-500'
                    }`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/20">
                {screenings.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-sm opacity-50">No results recorded yet.</td></tr>
                )}
                {screenings.map(s => (
                  <tr key={s.id} className={`transition ${theme === 'dark' ? 'hover:bg-[#18181b]' : 'hover:bg-slate-50'}`}>
                    <td className="px-6 py-4 text-sm font-medium">{new Date(s.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm font-mono opacity-80">{s.screening_id}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full ${
                        s.prediction === 'DR PRESENT'
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        <CheckCircle2 className="w-3 h-3 tick-anim-box" />
                        {s.prediction}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold">{(s.confidence * 100).toFixed(0)}%</td>
                    <td className="px-6 py-4">
                      <button onClick={() => handleDownloadReport(s.id)}
                        className="text-pink-500 hover:text-pink-400 text-xs font-bold flex items-center gap-1">
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
        <div className={`fixed bottom-4 right-6 w-96 rounded-2xl flex flex-col h-[560px] z-50 mac-chat-window border ${
          theme === 'dark' ? 'bg-[#141417] border-[#27272a] text-[#fafafa]' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          
          {/* macOS Titlebar Header */}
          <div className={`p-4 rounded-t-2xl flex justify-between items-center border-b ${
            theme === 'dark' ? 'bg-[#18181b] border-[#27272a]' : 'bg-slate-900 text-white border-slate-800'
          }`}>
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500 inline-block cursor-pointer" onClick={() => setChatOpen(false)}></span>
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
              </div>
              <div>
                <h3 className="font-bold text-xs tracking-tight">MedVisionAI Health Assistant</h3>
                <p className="text-[10px] opacity-70">Grounded in official screening reports</p>
              </div>
            </div>
            <button onClick={() => setChatOpen(false)} className="opacity-60 hover:opacity-100 text-lg leading-none">&times;</button>
          </div>

          {/* Messages Feed */}
          <div className={`flex-1 p-4 overflow-y-auto flex flex-col gap-3 ${
            theme === 'dark' ? 'bg-[#09090b]' : 'bg-slate-50'
          }`}>
            {messages.map((msg, i) => (
              <div key={i} className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                msg.role === 'assistant'
                  ? theme === 'dark'
                    ? 'bg-[#18181b] border border-[#27272a] text-[#fafafa] self-start rounded-tl-none'
                    : 'bg-white border border-slate-200 text-slate-800 self-start rounded-tl-none shadow-sm'
                  : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white self-end rounded-tr-none shadow-md'
              }`}>
                {msg.content}
              </div>
            ))}
            {chatLoading && (
              <div className={`self-start rounded-2xl rounded-tl-none px-4 py-3 text-xs opacity-60 border ${
                theme === 'dark' ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-slate-200'
              }`}>
                Thinking…
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendMessage} className={`p-3 border-t flex gap-2 rounded-b-2xl ${
            theme === 'dark' ? 'bg-[#141417] border-[#27272a]' : 'bg-white border-slate-200'
          }`}>
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder="Ask about your test results..."
              className={`flex-1 border rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                theme === 'dark' ? 'bg-[#18181b] border-[#3f3f46] text-[#fafafa]' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
              disabled={chatLoading}
            />
            <button type="submit" disabled={chatLoading || !chatInput.trim()}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:opacity-40 text-white px-4 py-2 rounded-xl text-xs font-bold transition">
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;

