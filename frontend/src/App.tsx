import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Landing from './pages/Landing';
import Login from './pages/Login';
import PatientDashboard from './pages/PatientDashboard';
import WorkerDashboard from './pages/WorkerDashboard';
import SetPassword from './pages/SetPassword';

const SpecialistDashboard = WorkerDashboard;

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] text-[#23211E] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-[#1E1E1E] flex items-center justify-center shadow-md animate-pulse">
          <span className="text-white text-xl font-bold">MV</span>
        </div>
        <p className="text-xs font-semibold text-[#706B63] tracking-wide uppercase">Securing Session & Validating Credentials…</p>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/set-password" element={<SetPassword />} />
      <Route path="/patient/*" element={<ProtectedRoute allowedRoles={['PATIENT']}><PatientDashboard /></ProtectedRoute>} />
      <Route path="/worker/*" element={<ProtectedRoute allowedRoles={['HEALTHCARE_WORKER', 'ADMIN']}><WorkerDashboard /></ProtectedRoute>} />
      <Route path="/specialist/*" element={<ProtectedRoute allowedRoles={['SPECIALIST', 'ADMIN']}><SpecialistDashboard /></ProtectedRoute>} />
    </Routes>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
