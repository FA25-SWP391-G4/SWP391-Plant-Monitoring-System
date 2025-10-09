import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import authApi from "../api/authApi";
import { useAuth } from "../auth/AuthContext";
import { motion } from "framer-motion";
import { FiMail, FiLock, FiArrowRight, FiEye, FiEyeOff } from "react-icons/fi";

export default function Login(){
  const nav = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault(); 
    setErr("");
    setLoading(true);
    
    try{
      const { data } = await authApi.login(email, password);
      login(data.token, data.user);
      nav("/");
    }catch(e){
      setErr(e?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const devBypass = () => {
    const fake = {
      token: "dev-token",
      user: { id: 1, name: "Dev User", role: "Premium" },
    };
    login(fake.token, fake.user);
    localStorage.setItem("token", fake.token);
    localStorage.setItem("user", JSON.stringify(fake.user));
    nav("/");
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
            Sign in to manage your plants
          </p>
        </motion.div>

        {/* Login Card */}
        <motion.div 
          className="sf-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <form onSubmit={onSubmit} style={{ display: "grid", gap: "20px" }}>
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
                  onChange={e=>setEmail(e.target.value)}
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
                  placeholder="Enter your password" 
                  value={password} 
                  onChange={e=>setPassword(e.target.value)}
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
            </div>

            {/* Forgot Password Link */}
            <div style={{ textAlign: "right" }}>
              <Link 
                to="/forgot-password" 
                style={{ 
                  color: "var(--sf-accent)", 
                  textDecoration: "none",
                  fontSize: "14px",
                  fontWeight: "500"
                }}
              >
                Forgot password?
              </Link>
            </div>

            {/* Error Message */}
            {err && (
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
                {err}
              </motion.div>
            )}

            {/* Login Button */}
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
                  Sign In <FiArrowRight />
                </>
              )}
            </motion.button>

            {/* Dev Bypass Button */}
            <button 
              className="sf-btn" 
              type="button" 
              onClick={devBypass}
              style={{ 
                width: "100%",
                fontSize: "14px",
                justifyContent: "center"
              }}
            >
              Dev bypass (Premium)
            </button>
          </form>
        </motion.div>

        {/* Register Link */}
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
          Don't have an account?{" "}
          <Link 
            to="/register" 
            style={{ 
              color: "var(--sf-accent)", 
              textDecoration: "none",
              fontWeight: "600"
            }}
          >
            Sign up
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
