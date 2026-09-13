import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Eye, ShieldCheck, UserCheck, Sparkles } from 'lucide-react';
import './Login.css';

const Login = () => {
  const [mode, setMode] = useState<'doctor' | 'patient'>('doctor');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append('username', username.trim());
      formData.append('password', password);

      const res = await api.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      const token = res.data.access_token;
      await login(token);

      const meRes = await api.get('/auth/me');
      const userData = meRes.data;

      if (userData.role === 'PATIENT') {
        navigate('/patient');
      } else {
        navigate('/worker');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <section className="grid-bg-section">
        {/* Render 180 interactive background grid tiles */}
        {Array.from({ length: 180 }).map((_, i) => (
          <span key={i} />
        ))}

        <div className="signin">
          <div className="content">
            
            {/* Header Brand */}
            <div className="brand-header">
              <div className="brand-logo-box">
                <Eye className="w-5 h-5 text-white" />
              </div>
              <span className="brand-title">MedVision<span>AI</span></span>
            </div>

            {/* Portal Segment Toggle Pill */}
            <div className="portal-toggle-pill">
              <button
                type="button"
                className={`toggle-btn ${mode === 'doctor' ? 'active' : ''}`}
                onClick={() => { setMode('doctor'); setError(''); }}
              >
                <ShieldCheck className="w-4 h-4" /> DOCTOR PORTAL
              </button>
              <button
                type="button"
                className={`toggle-btn ${mode === 'patient' ? 'active' : ''}`}
                onClick={() => { setMode('patient'); setError(''); }}
              >
                <UserCheck className="w-4 h-4" /> PATIENT PORTAL
              </button>
            </div>

            <h2>{mode === 'doctor' ? 'Clinician Sign In' : 'Patient Sign In'}</h2>

            {error && <div className="auth-error-banner">{error}</div>}

            <form onSubmit={handleSubmit} className="form">
              <div className="inputBox">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <i>{mode === 'doctor' ? 'Doctor / Admin Username' : 'Patient Username'}</i>
              </div>

              <div className="inputBox">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <i>Password</i>
              </div>

              <div className="inputBox">
                <button type="submit" className="submit-btn" disabled={loading}>
                  <Sparkles className="w-4 h-4" />
                  {loading ? 'Authenticating...' : `Sign In to ${mode === 'doctor' ? 'Doctor Portal' : 'Patient Portal'}`}
                </button>
              </div>
            </form>

          </div>
        </div>
      </section>
    </div>
  );
};

export default Login;
