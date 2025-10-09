import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import authApi from "../api/authApi";
import { motion } from "framer-motion";
import { FiLock, FiArrowRight, FiCheckCircle, FiEye, FiEyeOff, FiCheck } from "react-icons/fi";

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    
    if (!password || !confirmPassword) {
      setError("All fields are required");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }
    
    try {
      setLoading(true);
      await authApi.resetPassword(token, password);
      setLoading(false);
      setSuccess(true);
      
      setTimeout(() => {
        navigate("/login");
      }, 5000);
      
    } catch (err) {
      setLoading(false);
      setError(err?.response?.data?.error || "Password reset failed. Please try again.");
    }
  };

  const passwordStrength = password.length >= 6 ? "strong" : password.length >= 4 ? "medium" : "weak";

  if (!token && !success) {
    return (
      <div style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--sf-bg)",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px"
      }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ width: "100%", maxWidth: "420px" }}
        >
          <div className="sf-card">
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <h3 style={{ color: "var(--sf-text)", marginBottom: "12px", fontSize: "20px", fontWeight: "600" }}>
                Invalid Password Reset Link
              </h3>
              <p style={{ color: "var(--sf-text-dim)", marginBottom: "24px", lineHeight: "1.6" }}>
                The password reset link is invalid or has expired. Please request a new one.
              </p>
              <Link to="/forgot-password">
                <button className="sf-btn primary" style={{ width: "100%", padding: "12px", justifyContent: "center" }}>
                  Request New Link
                </button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      background: "var(--sf-bg)",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px"
    }}>
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ width: "100%", maxWidth: "420px" }}
      >
        {/* Logo/Brand Section */}
        <motion.div 
          style={{ textAlign: "center", marginBottom: "32px" }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div style={{ 
            display: "inline-flex", 
            alignItems: "center", 
            gap: "12px",
            fontSize: "28px",
            fontWeight: "700",
            color: "var(--sf-text)"
          }}>
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                width: "16px",
                height: "16px",
                borderRadius: "50%",
                background: "var(--sf-accent)"
              }}
            />
            SmartFarm
          </div>
          <p style={{ color: "var(--sf-text-dim)", marginTop: "8px", fontSize: "15px" }}>
            Create your new password
          </p>
        </motion.div>

        {/* Reset Password Card */}
        <motion.div 
          className="sf-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ textAlign: "center", padding: "20px 0" }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <FiCheckCircle 
                  size={64} 
                  color="var(--sf-accent)" 
                  style={{ margin: "0 auto 20px" }}
                />
              </motion.div>
              <h3 style={{ 
                color: "var(--sf-text)", 
                marginBottom: "12px",
                fontSize: "20px",
                fontWeight: "600"
              }}>
                Password Reset Successful!
              </h3>
              <p style={{ color: "var(--sf-text-dim)", marginBottom: "8px", lineHeight: "1.6" }}>
                Your password has been reset successfully.
              </p>
              <p style={{ 
                color: "var(--sf-text-dim)", 
                fontSize: "13px",
                marginBottom: "24px"
              }}>
                You will be redirected to the login page in 5 seconds...
              </p>
              <Link to="/login">
                <motion.button
                  className="sf-btn primary"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{ 
                    width: "100%",
                    padding: "12px",
                    fontSize: "15px",
                    fontWeight: "600",
                    justifyContent: "center"
                  }}
                >
                  Login Now
                </motion.button>
              </Link>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: "20px" }}>
              {/* Password Input */}
              <div>
                <label style={{ 
                  display: "block", 
                  marginBottom: "8px", 
                  color: "var(--sf-text)",
                  fontSize: "14px",
                  fontWeight: "500"
                }}>
                  New Password
                </label>
                <div style={{ position: "relative" }}>
                  <FiLock style={{ 
                    position: "absolute", 
                    left: "16px", 
                    top: "50%", 
                    transform: "translateY(-50%)",
                    color: "var(--sf-text-dim)"
                  }} />
                  <input 
                    className="sf-input" 
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a new password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ paddingLeft: "44px", paddingRight: "44px" }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "16px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "var(--sf-text-dim)",
                      cursor: "pointer",
                      padding: "4px"
                    }}
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                {password && (
                  <div style={{ marginTop: "8px", fontSize: "12px", color: "var(--sf-text-dim)" }}>
                    Password strength: <span style={{ 
                      color: passwordStrength === "strong" ? "#22c55e" : passwordStrength === "medium" ? "#f59e0b" : "#ef4444",
                      fontWeight: "500"
                    }}>
                      {passwordStrength === "strong" ? "Strong" : passwordStrength === "medium" ? "Medium" : "Weak"}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm Password Input */}
              <div>
                <label style={{ 
                  display: "block", 
                  marginBottom: "8px", 
                  color: "var(--sf-text)",
                  fontSize: "14px",
                  fontWeight: "500"
                }}>
                  Confirm New Password
                </label>
                <div style={{ position: "relative" }}>
                  <FiLock style={{ 
                    position: "absolute", 
                    left: "16px", 
                    top: "50%", 
                    transform: "translateY(-50%)",
                    color: "var(--sf-text-dim)"
                  }} />
                  <input 
                    className="sf-input" 
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your new password" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{ paddingLeft: "44px", paddingRight: "44px" }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: "absolute",
                      right: "16px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "var(--sf-text-dim)",
                      cursor: "pointer",
                      padding: "4px"
                    }}
                  >
                    {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                {confirmPassword && (
                  <div style={{ marginTop: "8px", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}>
                    {password === confirmPassword ? (
                      <>
                        <FiCheck color="#22c55e" />
                        <span style={{ color: "#22c55e" }}>Passwords match</span>
                      </>
                    ) : (
                      <span style={{ color: "#ef4444" }}>Passwords do not match</span>
                    )}
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    padding: "12px 16px",
                    borderRadius: "8px",
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    color: "#ef4444",
                    fontSize: "14px"
                  }}
                >
                  {error}
                </motion.div>
              )}

              {/* Submit Button */}
              <motion.button 
                className="sf-btn primary" 
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{ 
                  width: "100%",
                  padding: "14px",
                  fontSize: "16px",
                  fontWeight: "600",
                  justifyContent: "center"
                }}
              >
                {loading ? (
                  <div className="spinner" style={{ width: "20px", height: "20px", borderWidth: "2px" }}></div>
                ) : (
                  <>
                    Reset Password <FiArrowRight />
                  </>
                )}
              </motion.button>
            </form>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
