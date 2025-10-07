// src/pages/ResetPassword.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import authApi from "../api/authApi";

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Extract token from URL query parameters
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const tokenParam = queryParams.get("token");
    
    if (!tokenParam) {
      setError("Invalid password reset link. Please request a new one.");
    } else {
      setToken(tokenParam);
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    // Validate inputs
    if (!password || !confirmPassword) {
      setError("All fields are required");
      return;
    }
    
    // Check password match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    // Check password strength
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }
    
    try {
      setLoading(true);
      await authApi.resetPassword(token, password);
      setLoading(false);
      setSuccess(true);
      
      // Auto-redirect to login after 5 seconds
      setTimeout(() => {
        navigate("/login");
      }, 5000);
      
    } catch (err) {
      setLoading(false);
      setError(err?.response?.data?.error || "Password reset failed. Please try again.");
    }
  };

  if (!token && !success) {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="alert alert-danger" role="alert">
              <h5>Invalid Password Reset Link</h5>
              <p>The password reset link is invalid or has expired. Please request a new one.</p>
              <div className="mt-3">
                <Link to="/forgot-password" className="btn btn-primary">Request New Link</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow">
            <div className="card-body p-4">
              <h2 className="text-center mb-4">Reset Your Password</h2>
              
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
              
              {success ? (
                <div className="alert alert-success" role="alert">
                  <h5>Password Reset Successful!</h5>
                  <p>Your password has been reset successfully.</p>
                  <p>You will be redirected to the login page in 5 seconds...</p>
                  <div className="mt-3">
                    <Link to="/login" className="btn btn-primary">Login Now</Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="password" className="form-label">New Password</label>
                    <input
                      type="password"
                      className="form-control"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength="6"
                    />
                    <div className="form-text">Password must be at least 6 characters long</div>
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="confirmPassword" className="form-label">Confirm New Password</label>
                    <input
                      type="password"
                      className="form-control"
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                  
                  <button 
                    type="submit" 
                    className="btn btn-primary w-100 mb-3"
                    disabled={loading}
                  >
                    {loading ? "Resetting..." : "Reset Password"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
