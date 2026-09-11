import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import { FileText, MessageSquare, Clock, Eye, LogOut, CheckCircle2, Sun, Moon } from 'lucide-react';

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
  const { theme, toggleTheme } = useTheme();
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
    <div className="min-h-screen flex bg-[#F8F6F0] dark:bg-[#0D0F12] text-[#1A1917] dark:text-[#F3F4F6] transition-colors duration-200">
      
      {/* LEFT SIDEBAR NAVIGATION */}
      <aside className="w-64 border-r border-[#E6E1D7] dark:border-[#262B34] bg-white dark:bg-[#16191E] hidden md:flex flex-col justify-between shrink-0 h-screen sticky top-0 z-30 p-4">
        <div className="space-y-6">
          
          {/* Sidebar Brand Header */}
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-9 h-9 rounded-xl bg-[#1A1917] dark:bg-[#C85A32] flex items-center justify-center shadow-sm">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-[#1A1917] dark:text-[#F3F4F6]">MedVision<span className="text-[#C85A32] dark:text-[#E06D44]">AI</span></h1>
              <p className="text-[11px] text-[#706B63] dark:text-[#9CA3AF]">Patient Portal</p>
            </div>
          </div>

          {/* Sidebar Navigation Links */}
          <nav className="space-y-1">
            <button
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-[#1A1917] dark:bg-[#C85A32] text-white shadow-sm cursor-pointer"
            >
              <Clock className="w-4 h-4" />
              <span>Screening Reports</span>
            </button>
            <button
              onClick={() => setChatOpen(true)}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#706B63] dark:text-[#9CA3AF] hover:bg-[#F8F6F0] dark:hover:bg-[#20242D] hover:text-[#1A1917] dark:hover:text-white transition cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Ask Health Assistant</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer User Profile Card */}
        <div className="pt-4 border-t border-[#E6E1D7] dark:border-[#262B34] space-y-3">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#F8F6F0] dark:bg-[#20242D] border border-[#E6E1D7] dark:border-[#262B34] flex items-center justify-center font-bold text-xs text-[#C85A32]">
                PT
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-[#1A1917] dark:text-[#F3F4F6] truncate">{user?.username}</p>
                <p className="text-[10px] text-[#706B63] dark:text-[#9CA3AF] truncate">Verified Patient</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg border border-[#E6E1D7] dark:border-[#262B34] text-[#706B63] dark:text-[#9CA3AF] hover:text-[#1A1917] dark:hover:text-white transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* RIGHT MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header Bar */}
        <header className="bg-white/90 dark:bg-[#16191E]/90 border-b border-[#E6E1D7] dark:border-[#262B34] sticky top-0 z-20 backdrop-blur-md px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#706B63] dark:text-[#9CA3AF]">MedVisionAI</span>
            <span className="text-xs text-[#706B63] dark:text-[#9CA3AF]">/</span>
            <span className="text-xs font-extrabold text-[#1A1917] dark:text-[#F3F4F6]">Patient Health Dashboard</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setChatOpen(!chatOpen)}
              className="flex items-center space-x-2 bg-[#1A1917] dark:bg-[#C85A32] hover:bg-[#3D3A36] dark:hover:bg-[#D96B43] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Ask Health Assistant</span>
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-[#E6E1D7] dark:border-[#262B34] bg-white dark:bg-[#16191E] text-[#706B63] dark:text-[#9CA3AF] hover:text-[#1A1917] dark:hover:text-white transition shadow-sm cursor-pointer"
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            >
              {theme === 'light' ? <Moon className="w-4 h-4 text-[#C85A32]" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>
          </div>
        </header>

        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* Latest Result Card */}
        {latestScreening ? (
          <section className="rounded-2xl border border-[#E6E1D7] dark:border-[#262B34] bg-white dark:bg-[#16191E] p-8 shadow-sm">
            <h2 className="text-xl font-extrabold mb-6 flex items-center gap-2 text-[#1A1917] dark:text-[#F3F4F6]">
              <Clock className="w-5 h-5 text-[#C85A32] dark:text-[#E06D44]" /> Latest Screening Result
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-6 rounded-xl border border-[#E6E1D7] dark:border-[#262B34] bg-[#F8F6F0] dark:bg-[#0D0F12] text-center">
                <p className="text-xs font-semibold mb-1 text-[#706B63] dark:text-[#9CA3AF]">Status</p>
                <p className={`text-2xl font-black ${latestScreening.prediction === 'DR PRESENT' ? 'text-[#C85A32] dark:text-[#E06D44]' : 'text-[#2E7D32] dark:text-[#4ADE80]'}`}>
                  {latestScreening.prediction}
                </p>
              </div>
              <div className="p-6 rounded-xl border border-[#E6E1D7] dark:border-[#262B34] bg-[#F8F6F0] dark:bg-[#0D0F12] text-center">
                <p className="text-xs font-semibold mb-1 text-[#706B63] dark:text-[#9CA3AF]">Confidence</p>
                <p className="text-2xl font-black text-[#1A1917] dark:text-[#F3F4F6]">{(latestScreening.confidence * 100).toFixed(0)}%</p>
              </div>
              <div className="p-6 rounded-xl border border-[#E6E1D7] dark:border-[#262B34] bg-[#F8F6F0] dark:bg-[#0D0F12] text-center flex flex-col justify-center items-center gap-3">
                <button onClick={() => handleDownloadReport(latestScreening.id)}
                  className="flex items-center gap-2 text-[#C85A32] dark:text-[#E06D44] font-bold hover:underline transition text-sm">
                  <FileText className="w-4 h-4" /> Download PDF Report
                </button>
                <button onClick={() => setChatOpen(true)}
                  className="flex items-center gap-2 text-xs text-[#706B63] dark:text-[#9CA3AF] hover:text-[#1A1917] dark:hover:text-white transition">
                  <Eye className="w-3.5 h-3.5" /> Ask about this result
                </button>
              </div>
            </div>

            {latestScreening.prediction === 'DR PRESENT' && (
              <div className="mt-6 bg-[#FDF4EE] dark:bg-[#2A1B16] border border-[#FCDAC6] dark:border-[#5C2B1E] rounded-xl p-4 text-[#C85A32] dark:text-[#E06D44] text-sm font-medium">
                ⚠️ Signs of diabetic retinopathy were detected. Please consult an ophthalmologist for a full clinical evaluation.
              </div>
            )}
          </section>
        ) : (
          <div className="rounded-2xl border border-[#E6E1D7] dark:border-[#262B34] bg-white dark:bg-[#16191E] p-12 text-center text-[#706B63] dark:text-[#9CA3AF]">
            <Eye className="w-12 h-12 mx-auto mb-4 opacity-30 text-[#C85A32] dark:text-[#E06D44]" />
            <p className="text-lg font-bold text-[#1A1917] dark:text-[#F3F4F6]">No screening results yet</p>
            <p className="text-sm mt-1">Your doctor will publish your screening results here once complete.</p>
          </div>
        )}

        {/* History Table */}
        <section>
          <h3 className="text-lg font-extrabold mb-4 text-[#1A1917] dark:text-[#F3F4F6]">Screening History</h3>
          <div className="rounded-2xl border border-[#E6E1D7] dark:border-[#262B34] bg-white dark:bg-[#16191E] overflow-hidden">
            <table className="min-w-full divide-y divide-[#E6E1D7] dark:divide-[#262B34]">
              <thead className="bg-[#F8F6F0] dark:bg-[#0D0F12]">
                <tr>
                  {['Date', 'Screening ID', 'Result', 'Confidence', 'Report'].map(h => (
                    <th key={h} className="px-6 py-3.5 text-left text-xs font-bold text-[#706B63] dark:text-[#9CA3AF] uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E1D7] dark:divide-[#262B34]">
                {screenings.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-[#706B63] dark:text-[#9CA3AF]">No results recorded yet.</td></tr>
                )}
                {screenings.map(s => (
                  <tr key={s.id} className="hover:bg-[#F8F6F0] dark:hover:bg-[#1F242D] transition">
                    <td className="px-6 py-4 text-sm font-medium text-[#1A1917] dark:text-[#F3F4F6]">{new Date(s.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm font-mono text-[#706B63] dark:text-[#9CA3AF]">{s.screening_id}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full ${
                        s.prediction === 'DR PRESENT'
                          ? 'bg-[#FDF4EE] dark:bg-[#2A1B16] text-[#C85A32] dark:text-[#E06D44] border border-[#FCDAC6] dark:border-[#5C2B1E]'
                          : 'bg-[#F0F7F1] dark:bg-[#122818] text-[#2E7D32] dark:text-[#4ADE80] border border-[#C8E6C9] dark:border-[#1C4D25]'
                      }`}>
                        <CheckCircle2 className="w-3 h-3 tick-anim-box" />
                        {s.prediction}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-[#1A1917] dark:text-[#F3F4F6]">{s.confidence ? (s.confidence * 100).toFixed(0) : '0'}%</td>
                    <td className="px-6 py-4">
                      <button onClick={() => handleDownloadReport(s.id)}
                        className="text-[#C85A32] dark:text-[#E06D44] hover:underline text-xs font-bold flex items-center gap-1">
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
        <div className="fixed bottom-4 right-6 w-96 rounded-2xl flex flex-col h-[560px] z-50 mac-chat-window border border-[#E6E1D7] dark:border-[#262B34] bg-white dark:bg-[#16191E] text-[#1A1917] dark:text-[#F3F4F6] shadow-2xl">
          
          {/* macOS Titlebar Header */}
          <div className="p-4 rounded-t-2xl flex justify-between items-center border-b border-[#E6E1D7] dark:border-[#262B34] bg-[#F8F6F0] dark:bg-[#0D0F12]">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500 inline-block cursor-pointer hover:opacity-80 transition" onClick={() => setChatOpen(false)}></span>
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
              </div>
              <div>
                <h3 className="font-bold text-xs tracking-tight text-[#1A1917] dark:text-[#F3F4F6]">MedVisionAI Health Assistant</h3>
                <p className="text-[10px] text-[#706B63] dark:text-[#9CA3AF]">Answers based on official test reports</p>
              </div>
            </div>
            <button onClick={() => setChatOpen(false)} className="text-[#706B63] dark:text-[#9CA3AF] hover:text-[#1A1917] dark:hover:text-white text-lg leading-none">&times;</button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 bg-[#F8F6F0] dark:bg-[#0D0F12]">
            {messages.map((msg, i) => (
              <div key={i} className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                msg.role === 'assistant'
                  ? 'bg-white dark:bg-[#16191E] border border-[#E6E1D7] dark:border-[#262B34] text-[#1A1917] dark:text-[#F3F4F6] self-start rounded-tl-none shadow-sm'
                  : 'bg-[#1A1917] dark:bg-[#C85A32] text-white self-end rounded-tr-none shadow-md'
              }`}>
                {msg.content}
              </div>
            ))}
            {chatLoading && (
              <div className="self-start rounded-2xl rounded-tl-none px-4 py-3 text-xs bg-white dark:bg-[#16191E] border border-[#E6E1D7] dark:border-[#262B34] text-[#706B63] dark:text-[#9CA3AF]">
                Thinking…
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Prompt Suggestions */}
          <div className="px-3 py-2 bg-white dark:bg-[#16191E] border-t border-[#E6E1D7] dark:border-[#262B34] flex gap-1.5 overflow-x-auto">
            {["What is Diabetic Retinopathy?", "What are my recommended next steps?", "How to read confidence?"].map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setChatInput(chip)}
                className="whitespace-nowrap text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-[#F8F6F0] dark:bg-[#0D0F12] border border-[#E6E1D7] dark:border-[#262B34] text-[#C85A32] dark:text-[#E06D44] hover:bg-[#E6E1D7] dark:hover:bg-[#20242D] transition cursor-pointer"
              >
                💡 {chip}
              </button>
            ))}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-[#E6E1D7] dark:border-[#262B34] flex gap-2 rounded-b-2xl bg-white dark:bg-[#16191E]">
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder="Ask about your report details..."
              className="flex-1 border border-[#E6E1D7] dark:border-[#262B34] rounded-xl px-4 py-2 text-xs outline-none focus:border-[#C85A32] bg-[#F8F6F0] dark:bg-[#0D0F12] text-[#1A1917] dark:text-[#F3F4F6]"
              disabled={chatLoading}
            />
            <button type="submit" disabled={chatLoading || !chatInput.trim()}
              className="bg-[#1A1917] dark:bg-[#C85A32] hover:bg-[#3D3A36] dark:hover:bg-[#D96B43] disabled:opacity-40 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer">
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  </div>
);
};

export default PatientDashboard;


