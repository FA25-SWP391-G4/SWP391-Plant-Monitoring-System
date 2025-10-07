import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import ChangePassword from './pages/ChangePassword';
// Test API mapping
import ApiTester from './tests/ApiTester';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import SearchReports from './pages/SearchReports';
import CustomizeDashboard from './pages/CustomizeDashboard';
import Thresholds from './pages/Thresholds';
import Zones from './pages/Zones';
import Upgrade from './pages/Upgrade';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, isAuthenticated } = useAuth();
  
  // Debug: Log protected route access
  console.log('ProtectedRoute - Path:', window.location.pathname, '- Auth:', isAuthenticated, '- Role Required:', requiredRole, '- User Role:', user?.role);
  
  // BREAKPOINT: Add breakpoint on the next line to debug protected routes
  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    console.log('ProtectedRoute - Redirecting to login (not authenticated)');
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRole && user?.role !== requiredRole) {
    // Redirect to dashboard if role doesn't match
    console.log('ProtectedRoute - Redirecting to dashboard (role mismatch)');
    return <Navigate to="/" replace />;
  }
  
  console.log('ProtectedRoute - Access granted');
  return children;
};

function App() {
  const { isAuthenticated, user } = useAuth();
  
  // Debug point - Log authentication state
  console.log('App rendering - Authentication state:', { 
    isAuthenticated, 
    user, 
    path: window.location.pathname 
  });
  
  // BREAKPOINT: Add breakpoint here to debug the App component render cycle
  
  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
      <main className="flex-grow-1">
        {/* Debug element to show current auth state */}
        <div style={{ position: 'fixed', bottom: '10px', right: '10px', background: '#f0f0f0', padding: '5px', fontSize: '12px', zIndex: 9999 }}>
          Debug: {isAuthenticated ? 'Authenticated' : 'Not Authenticated'} | Path: {window.location.pathname}
        </div>
        <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              
              {/* Protected Routes - Any authenticated user */}
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/change-password" element={
                <ProtectedRoute>
                  <ChangePassword />
                </ProtectedRoute>
              } />
              {/* Root path removed here - defined explicitly below */}
              <Route path="/reports" element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              } />
              <Route path="/search-reports" element={
                <ProtectedRoute>
                  <SearchReports />
                </ProtectedRoute>
              } />
              
              {/* Premium User Routes */}
              <Route path="/customize-dashboard" element={
                <ProtectedRoute requiredRole="Premium">
                  <CustomizeDashboard />
                </ProtectedRoute>
              } />
              <Route path="/thresholds" element={
                <ProtectedRoute requiredRole="Premium">
                  <Thresholds />
                </ProtectedRoute>
              } />
              <Route path="/zones" element={
                <ProtectedRoute requiredRole="Premium">
                  <Zones />
                </ProtectedRoute>
              } />
              
              {/* Regular User Routes */}
              <Route path="/upgrade" element={
                <ProtectedRoute>
                  <Upgrade />
                </ProtectedRoute>
              } />
              
              {/* Test Routes */}
              <Route path="/api-test" element={<ApiTester />} />
              
              {/* Explicit index route with debug */}
              <Route path="/" element={
                <React.Fragment>
                  {console.log('Root route / accessed - Auth State:', isAuthenticated)}
                  {/* BREAKPOINT: Add breakpoint on the next line to debug routing */}
                  {isAuthenticated ? 
                    <Dashboard /> :
                    <Navigate to="/login" replace />
                  }
                </React.Fragment>
              } />
              
              {/* Catch-all route - redirects to Login if not authenticated, Dashboard otherwise */}
              <Route path="*" element={
                <React.Fragment>
                  {console.log('404 Route - Auth State:', isAuthenticated, 'Path:', window.location.pathname)}
                  {/* BREAKPOINT: Add breakpoint here to catch 404 routes */}
                  {isAuthenticated ? 
                    <Navigate to="/" /> :
                    <Navigate to="/login" />
                  }
                </React.Fragment>
              } />
            </Routes>
          </main>
          <Footer />
        </div>
  );
}

export default App;
