// src/pages/ForgotPassword.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import authApi from "../api/authApi";

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
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow">
            <div className="card-body p-4">
              <h2 className="text-center mb-4">Forgot Password</h2>
              
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
              
              {success ? (
                <div className="alert alert-success" role="alert">
                  <h5>Email Sent!</h5>
                  <p>We've sent a password reset link to your email address. Please check your inbox and follow the instructions.</p>
                  <p>The link will expire in 1 hour.</p>
                  <div className="mt-3">
                    <Link to="/login" className="btn btn-primary">Return to Login</Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <p className="text-muted mb-4">
                    Enter your email address below and we'll send you a link to reset your password.
                  </p>
                  
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">Email address</label>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  
                  <button 
                    type="submit" 
                    className="btn btn-primary w-100 mb-3"
                    disabled={loading}
                  >
                    {loading ? "Sending..." : "Send Reset Link"}
                  </button>
                  
                  <div className="text-center">
                    <Link to="/login">Back to Login</Link>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
