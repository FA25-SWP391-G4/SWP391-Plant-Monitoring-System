import { useState } from "react";
import { Link } from "react-router-dom";
import authApi from "../api/authApi";
import { motion } from "framer-motion";
import { FiMail, FiArrowRight, FiCheckCircle } from "react-icons/fi";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    
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
            Reset your password
          </p>
        </motion.div>

        {/* Forgot Password Card */}
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
                Email Sent!
              </h3>
              <p style={{ color: "var(--sf-text-dim)", marginBottom: "8px", lineHeight: "1.6" }}>
                We've sent a password reset link to your email address. 
              </p>
              <p style={{ color: "var(--sf-text-dim)", marginBottom: "24px", lineHeight: "1.6" }}>
                Please check your inbox and follow the instructions.
              </p>
              <p style={{ 
                color: "var(--sf-text-dim)", 
                fontSize: "13px",
                marginBottom: "24px"
              }}>
                The link will expire in 1 hour.
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
                  Return to Login
                </motion.button>
              </Link>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: "20px" }}>
              <p style={{ 
                color: "var(--sf-text-dim)", 
                margin: "0",
                lineHeight: "1.6"
              }}>
                Enter your email address below and we'll send you a link to reset your password.
              </p>

              {/* Email Input */}
              <div>
                <label style={{ 
                  display: "block", 
                  marginBottom: "8px", 
                  color: "var(--sf-text)",
                  fontSize: "14px",
                  fontWeight: "500"
                }}>
                  Email Address
                </label>
                <div style={{ position: "relative" }}>
                  <FiMail style={{ 
                    position: "absolute", 
                    left: "16px", 
                    top: "50%", 
                    transform: "translateY(-50%)",
                    color: "var(--sf-text-dim)"
                  }} />
                  <input 
                    className="sf-input" 
                    placeholder="Enter your email" 
                    type="email"
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ paddingLeft: "44px" }}
                    required
                  />
                </div>
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
                    Send Reset Link <FiArrowRight />
                  </>
                )}
              </motion.button>
            </form>
          )}
        </motion.div>

        {/* Back to Login Link */}
        {!success && (
          <motion.div 
            style={{ 
              textAlign: "center", 
              marginTop: "24px",
              color: "var(--sf-text-dim)",
              fontSize: "14px"
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <Link 
              to="/login" 
              style={{ 
                color: "var(--sf-accent)", 
                textDecoration: "none",
                fontWeight: "600"
              }}
            >
              ← Back to Login
            </Link>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
