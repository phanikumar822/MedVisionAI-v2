import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
      await login(username, password);
      // Determine redirection based on login profile response
      const meRes = await fetch('/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const userData = await meRes.json();
      
      if (userData.role === 'PATIENT') {
        navigate('/patient');
      } else {
        // Doctor or Admin role goes to Doctor/Admin portal
        navigate('/worker');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid username or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Generate 75 grid spans for interactive background
  const gridSpans = Array.from({ length: 75 });

  return (
    <div className="auth-wrapper">
      <section className="auth-section">
        {gridSpans.map((_, i) => (
          <span key={i}></span>
        ))}

        <div className="auth-card">
          <div className="content">

            {/* Glowing Brand Header with Animated Retina Laser Scanner */}
            <div className="brand-header">
              <div className="eye-scanner-icon">
                <div className="iris-pulse"></div>
                <div className="scanner-beam"></div>
              </div>
              <h2 className="brand-title">
                MEDVISION <span className="ai-badge">AI</span>
              </h2>
              <div className="badge-pill">
                AI-Assisted Diabetic Retinopathy Platform
              </div>
            </div>

            {/* Mode Switcher Buttons: Doctor / Admin vs Patient */}
            <div className="role-toggle">
              <button
                type="button"
                className={`role-btn ${mode === 'doctor' ? 'active' : ''}`}
                onClick={() => { setMode('doctor'); setError(''); }}
              >
                🩺 Doctor / Admin
              </button>
              <button
                type="button"
                className={`role-btn ${mode === 'patient' ? 'active' : ''}`}
                onClick={() => { setMode('patient'); setError(''); }}
              >
                👤 Patient
              </button>
            </div>

            {error && <div className="error-banner">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="inputBox">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder=" "
                />
                <i>{mode === 'doctor' ? 'Doctor / Admin Username' : 'Patient Username'}</i>
              </div>

              <div className="inputBox">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder=" "
                />
                <i>Password</i>
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Authenticating…' : `Login as ${mode === 'doctor' ? 'Doctor / Admin' : 'Patient'}`}
              </button>
            </form>

            <p className="hint-text">
              {mode === 'doctor'
                ? '🔒 Admin credentials allow system-wide access and CSV data exports.'
                : '🔑 Use the username & password set via your email activation link.'}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Login;
