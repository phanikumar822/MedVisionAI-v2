import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const res = await api.post('/auth/login', formData);
      await login(res.data.access_token);
      
      const role = JSON.parse(atob(res.data.access_token.split('.')[1])).role;
      
      if (role === 'PATIENT') navigate('/patient');
      else if (role === 'HEALTHCARE_WORKER') navigate('/worker');
      else if (role === 'SPECIALIST') navigate('/specialist');
      else navigate('/worker'); // fallback for admin
    } catch (error) {
      alert('Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full p-8 rounded-2xl shadow-lg border border-slate-100 text-center">
        <div className="flex justify-center mb-6">
          <Eye className="w-12 h-12 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Sign in to MedVisionAI</h2>
        <p className="text-slate-500 mb-8 text-sm">Secure online screening platform</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input 
              type="text" 
              placeholder="Username" 
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium p-3 rounded-lg transition shadow-sm disabled:bg-slate-400"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-sm text-slate-500 mt-4">
          Contact your system administrator if you have forgotten your credentials.
        </p>
      </div>
    </div>
  );
};

export default Login;
