import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import PremiumDashboard from './pages/PremiumDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import DeviceSetup from './pages/DeviceSetup.jsx';

const getUser = () => {
  try { return JSON.parse(localStorage.getItem('sg_user') || 'null'); } catch { return null; }
};

const rolePath = (role) => (role === 'admin' ? '/admin' : role === 'premium' ? '/premium' : '/regular');

/** Redirect to correct route based on current user role */
function RedirectByRole() {
  const user = getUser();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={rolePath(user.role)} replace />;
}

/** Guard a route by expected role */
function RequireRole({ role, children }) {
  const user = getUser();
  const loc = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: loc }} />;
  if (user.role !== role) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />

      {/* Role redirect hub */}
      <Route path="/dashboard" element={<RedirectByRole />} />

      {/* Role-specific dashboards */}
      <Route path="/regular" element={<RequireRole role="regular"><Dashboard /></RequireRole>} />
      <Route path="/premium" element={<RequireRole role="premium"><PremiumDashboard /></RequireRole>} />
      <Route path="/admin" element={<RequireRole role="admin"><AdminDashboard /></RequireRole>} />

      {/* Shared page */}
      <Route path="/device-setup" element={<DeviceSetup />} />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
