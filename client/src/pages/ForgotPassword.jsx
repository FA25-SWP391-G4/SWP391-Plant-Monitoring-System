import { useState } from "react";
import { Link } from "react-router-dom";
import authApi from "../api/authApi";
import { ButtonLoading } from "../components/Loading";
import './Auth.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    
    // Validate email
    if (!email) {
      setError("Email is required");
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }
    
    try {
      setLoading(true);
      await authApi.forgotPassword(email);
      setLoading(false);
      setSuccess(true);
    } catch (err) {
      setLoading(false);
      setError(err?.response?.data?.error || "Failed to send password reset email. Please try again.");
    }
  };

  return (
    <div className="auth-container-2col">
      <div className="auth-left">
        <div className="auth-branding">
          <Link to="/" className="brand-link">
            <span className="brand-logo">🌱</span>
            <span className="brand-text">PlantSmart</span>
          </Link>
          
          <div className="welcome-content">
            <div className="welcome-badge">
              <span>🔒</span>
              <span>Secure password recovery</span>
            </div>
            
            <h1 className="welcome-title">
              Forgot Your
              <br />
              Password?
              <br />
              No Problem!
            </h1>
            
            <p className="welcome-description">
              Enter your email address and we'll send you a secure link to reset your password and get back to caring for your plants.
            </p>
            
            <div className="feature-highlights">
              <div className="highlight-item">
                <span className="highlight-icon">⚡</span>
                <span>Quick and secure recovery</span>
              </div>
              <div className="highlight-item">
                <span className="highlight-icon">🔐</span>
                <span>Bank-level security</span>
              </div>
              <div className="highlight-item">
                <span className="highlight-icon">📧</span>
                <span>Email verification required</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="auth-right">
        <div className="auth-card animate-fade-in">
          <div className="auth-header">
            <div className="auth-logo">
              <div className="logo-icon">🌱</div>
              <h2>PlantSmart</h2>
            </div>
          </div>

          <div className="auth-form-container">
            {success ? (
              <div className="success-container">
                <div className="success-icon">✅</div>
                <div className="auth-title">
                  <h3>Email verification sent to</h3>
                  <p className="email-display">{email}</p>
                </div>
                <div className="success-message">
                  <p>We've sent a password reset link to your email address. Please check your inbox and follow the instructions.</p>
                  <p className="text-muted">The link will expire in 1 hour.</p>
                </div>
                <Link to="/login" className="auth-btn primary">
                  Return to Login
                </Link>
              </div>
            ) : (
              <>
                <div className="auth-title">
                  <h3>Reset your password</h3>
                  <p>Enter your email address and we'll send you a link to reset your password.</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                  <div className="form-group">
                    <label htmlFor="email">Email address</label>
                    <div className="input-wrapper">
                      <span className="input-icon">📧</span>
                      <input 
                        id="email"
                        className="auth-input" 
                        type="email"
                        placeholder="you@greenspace.com" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="auth-error animate-fade-in">
                      <span className="error-icon">⚠️</span>
                      {error}
                    </div>
                  )}

                  <button 
                    className="auth-btn primary" 
                    type="submit" 
                    disabled={loading}
                  >
                    {loading ? <ButtonLoading /> : 'Send Reset Link'}
                  </button>
                </form>
              </>
            )}
          </div>

          <div className="auth-footer">
            <p>
              Remember your password? 
              <Link to="/login" className="auth-link"> Sign In</Link>
            </p>
            <Link to="/" className="back-link">Back to Site</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
