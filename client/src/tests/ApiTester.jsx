// src/tests/ApiTester.jsx
import React, { useState } from 'react';
import authApi from '../api/authApi';

export default function ApiTester() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const logResult = (name, success, data, error = null) => {
    const result = {
      name,
      success,
      data: data || null,
      error: error ? (error.response?.data || error.message) : null,
      timestamp: new Date().toISOString()
    };
    
    setResults(prev => [result, ...prev]);
  };

  const runTest = async (name, apiCall) => {
    try {
      setLoading(true);
      const response = await apiCall();
      logResult(name, true, response.data);
      return response.data;
    } catch (error) {
      logResult(name, false, null, error);
      console.error(`API Test Failed: ${name}`, error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const testRegister = () => {
    const email = `test-${Date.now()}@example.com`;
    return runTest('Register', () => 
      authApi.register(email, 'Password123!', 'Password123!', 'Test User')
    );
  };

  const testLogin = () => {
    return runTest('Login', () => 
      authApi.login('test@example.com', 'Password123!')
    );
  };

  const testForgotPassword = () => {
    return runTest('Forgot Password', () => 
      authApi.forgotPassword('test@example.com')
    );
  };

  const testChangePassword = () => {
    return runTest('Change Password', () => 
      authApi.changePassword({
        currentPassword: 'OldPass123',
        newPassword: 'NewPass456'
      })
    );
  };

  const testLogout = () => {
    return runTest('Logout', () => authApi.logout());
  };

  const testResetPassword = () => {
    return runTest('Reset Password', () => 
      authApi.resetPassword('fake-token-123', 'NewPassword789!')
    );
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="container py-5">
      <h2>API Mapping Tester</h2>
      <p>Use the buttons below to test the API mapping between frontend and backend.</p>
      
      <div className="row mb-4">
        <div className="col-md-12">
          <div className="d-flex flex-wrap gap-2">
            <button 
              className="btn btn-primary" 
              onClick={testRegister}
              disabled={loading}
            >
              Test Register
            </button>
            <button 
              className="btn btn-success" 
              onClick={testLogin}
              disabled={loading}
            >
              Test Login
            </button>
            <button 
              className="btn btn-info" 
              onClick={testForgotPassword}
              disabled={loading}
            >
              Test Forgot Password
            </button>
            <button 
              className="btn btn-warning" 
              onClick={testChangePassword}
              disabled={loading}
            >
              Test Change Password
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={testLogout}
              disabled={loading}
            >
              Test Logout
            </button>
            <button 
              className="btn btn-dark" 
              onClick={testResetPassword}
              disabled={loading}
            >
              Test Reset Password
            </button>
            <button 
              className="btn btn-outline-danger" 
              onClick={clearResults}
            >
              Clear Results
            </button>
          </div>
        </div>
      </div>
      
      <div className="row">
        <div className="col-md-12">
          <h3>Results</h3>
          {results.length === 0 ? (
            <div className="alert alert-info">No tests run yet</div>
          ) : (
            <div className="list-group">
              {results.map((result, idx) => (
                <div 
                  key={idx} 
                  className={`list-group-item ${result.success ? 'list-group-item-success' : 'list-group-item-danger'}`}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-1">{result.name}</h5>
                    <span className="badge bg-primary rounded-pill">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="mb-1">
                    {result.success ? 'Success' : 'Failed'}
                  </p>
                  {result.success ? (
                    <pre className="mb-0 mt-2 bg-light p-2 rounded">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  ) : (
                    <pre className="mb-0 mt-2 bg-light p-2 rounded text-danger">
                      {JSON.stringify(result.error, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
