import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import authApi from "../api/authApi";
import { motion } from "framer-motion";
import { FiMail, FiLock, FiUser, FiArrowRight, FiEye, FiEyeOff, FiCheck } from "react-icons/fi";

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!formData.email || !formData.full_name || !formData.password || !formData.confirmPassword) {
      setError("All fields are required");
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }
    
    try {
      setLoading(true);
      await authApi.register(formData.email, formData.password, formData.confirmPassword, formData.full_name);
      setLoading(false);
      alert("Registration successful! Please log in.");
      navigate("/login");
    } catch (err) {
      setLoading(false);
      setError(err?.response?.data?.error || "Registration failed. Please try again.");
    }
  };

  const passwordStrength = formData.password.length >= 6 ? "strong" : formData.password.length >= 4 ? "medium" : "weak";

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
        style={{ width: "100%", maxWidth: "500px" }}
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
            Create your account to get started
          </p>
        </motion.div>

        {/* Register Card */}
        <motion.div 
          className="sf-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: "20px" }}>
            {/* Full Name Input */}
            <div>
              <label style={{ 
                display: "block", 
                marginBottom: "8px", 
                color: "var(--sf-text)",
                fontSize: "14px",
                fontWeight: "500"
              }}>
                Full Name
              </label>
              <div style={{ position: "relative" }}>
                <FiUser style={{ 
                  position: "absolute", 
                  left: "16px", 
                  top: "50%", 
                  transform: "translateY(-50%)",
                  color: "var(--sf-text-dim)"
                }} />
                <input 
                  className="sf-input" 
                  placeholder="Enter your full name" 
                  type="text"
                  name="full_name"
                  value={formData.full_name} 
                  onChange={handleChange}
                  style={{ paddingLeft: "44px" }}
                  required
                />
              </div>
            </div>

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
                  name="email"
                  value={formData.email} 
                  onChange={handleChange}
                  style={{ paddingLeft: "44px" }}
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label style={{ 
                display: "block", 
                marginBottom: "8px", 
                color: "var(--sf-text)",
                fontSize: "14px",
                fontWeight: "500"
              }}>
                Password
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
                  placeholder="Create a password" 
                  name="password"
                  value={formData.password} 
                  onChange={handleChange}
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
              {formData.password && (
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
                Confirm Password
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
                  placeholder="Confirm your password" 
                  name="confirmPassword"
                  value={formData.confirmPassword} 
                  onChange={handleChange}
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
              {formData.confirmPassword && (
                <div style={{ marginTop: "8px", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}>
                  {formData.password === formData.confirmPassword ? (
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

            {/* Register Button */}
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
                  Create Account <FiArrowRight />
                </>
              )}
            </motion.button>
          </form>
        </motion.div>

        {/* Login Link */}
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
          Already have an account?{" "}
          <Link 
            to="/login" 
            style={{ 
              color: "var(--sf-accent)", 
              textDecoration: "none",
              fontWeight: "600"
            }}
          >
            Sign in
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
