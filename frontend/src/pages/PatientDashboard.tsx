import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { FileText, MessageSquare, Clock, Eye } from 'lucide-react';

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
  const { user } = useAuth();
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: 'assistant', content: 'Hello! I can help you understand your MedVisionAI screening report. What would you like to know?' }
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

    // Build history in google-genai format (exclude initial greeting)
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
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Welcome, {user?.username}</h1>
            <p className="text-sm text-slate-500">Your secure MedVisionAI health portal</p>
          </div>
          <button onClick={() => setChatOpen(!chatOpen)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition shadow-sm">
            <MessageSquare className="w-5 h-5" />
            <span>Ask MedVisionAI</span>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Latest Result Card */}
        {latestScreening ? (
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Clock className="w-6 h-6 text-blue-500" /> Latest Result
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-slate-50 p-6 rounded-xl border text-center">
                <p className="text-sm text-slate-500 font-medium mb-1">Status</p>
                <p className={`text-2xl font-bold ${latestScreening.prediction === 'DR PRESENT' ? 'text-red-600' : 'text-emerald-600'}`}>
                  {latestScreening.prediction}
                </p>
              </div>
              <div className="bg-slate-50 p-6 rounded-xl border text-center">
                <p className="text-sm text-slate-500 font-medium mb-1">Model Confidence</p>
                <p className="text-2xl font-bold text-slate-800">{(latestScreening.confidence * 100).toFixed(0)}%</p>
              </div>
              <div className="bg-slate-50 p-6 rounded-xl border text-center flex flex-col justify-center items-center gap-3">
                <button onClick={() => handleDownloadReport(latestScreening.id)}
                  className="flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-800 transition">
                  <FileText className="w-5 h-5" /> Download PDF Report
                </button>
                <button onClick={() => setChatOpen(true)}
                  className="flex items-center gap-2 text-slate-500 text-sm hover:text-blue-600 transition">
                  <Eye className="w-4 h-4" /> Ask about this result
                </button>
              </div>
            </div>

            {latestScreening.prediction === 'DR PRESENT' && (
              <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 text-sm">
                ⚠️ Signs of diabetic retinopathy were detected. Please consult a qualified ophthalmologist promptly for a full clinical evaluation. This is an AI screening tool and does not replace professional medical assessment.
              </div>
            )}
          </section>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
            <Eye className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No screening results yet</p>
            <p className="text-sm mt-1">Your doctor will upload and publish your results here once your screening is complete.</p>
          </div>
        )}

        {/* History Table */}
        <section>
          <h3 className="text-lg font-bold text-slate-800 mb-4">Screening History</h3>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {['Date', 'Screening ID', 'Result', 'Confidence', 'Report'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {screenings.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400 text-sm">No results yet.</td></tr>
                )}
                {screenings.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-600">{new Date(s.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm font-mono text-slate-800">{s.screening_id}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${s.prediction === 'DR PRESENT' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {s.prediction}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{(s.confidence * 100).toFixed(0)}%</td>
                    <td className="px-6 py-4">
                      <button onClick={() => handleDownloadReport(s.id)}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center gap-1">
                        <FileText className="w-3 h-3" /> Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* RAG Chatbot Drawer */}
      {chatOpen && (
        <div className="fixed bottom-0 right-4 w-96 bg-white border border-slate-200 shadow-2xl rounded-t-2xl flex flex-col h-[550px] z-50">
          <div className="bg-slate-900 text-white p-4 rounded-t-2xl flex justify-between items-center">
            <div>
              <h3 className="font-bold text-sm">MedVisionAI Assistant</h3>
              <p className="text-xs text-slate-400">Answers grounded in your authorized reports only</p>
            </div>
            <button onClick={() => setChatOpen(false)} className="text-slate-400 hover:text-white text-xl leading-none">&times;</button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto bg-slate-50 flex flex-col gap-3">
            {messages.map((msg, i) => (
              <div key={i} className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'assistant'
                  ? 'bg-white border border-slate-200 text-slate-800 self-start rounded-tl-none shadow-sm'
                  : 'bg-blue-600 text-white self-end rounded-tr-none'
              }`}>
                {msg.content}
              </div>
            ))}
            {chatLoading && (
              <div className="self-start bg-white border border-slate-200 rounded-2xl rounded-tl-none px-4 py-3 text-sm text-slate-400 shadow-sm">
                Thinking…
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 bg-white flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder="e.g. What does DR PRESENT mean?"
              className="flex-1 border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={chatLoading}
            />
            <button type="submit" disabled={chatLoading || !chatInput.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-4 py-2 rounded-xl text-sm font-medium transition">
              Send
            </button>
          </form>
          <p className="text-[10px] text-slate-400 text-center pb-2 px-4">
            For medical decisions, please consult a qualified healthcare professional.
          </p>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;
