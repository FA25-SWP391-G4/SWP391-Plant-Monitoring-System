import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import authApi from "../api/authApi";
import { useAuth } from "../auth/AuthContext";
import { ButtonLoading } from "../components/Loading";
import '../assets/css/Auth.css';

export default function Login(){
  const nav = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault(); 
    setErr("");
    setIsLoading(true);
    
    try{
      const { data } = await authApi.login(email, password);
      login(data.token, data.user);
      nav("/");
    }catch(e){
      setErr(e?.response?.data?.message || "Login failed");
    } finally {
      setIsLoading(false);
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
    <div className="auth-container-2col">
      {/* Left Column - Branding */}
      <div className="auth-left">
        <div className="auth-branding">
          <Link to="/" className="brand-link">
            <div className="brand-logo">🌱</div>
            <span className="brand-text">PlantSmart</span>
          </Link>
          
          <div className="welcome-content">
            <div className="welcome-badge">
              <span className="badge-icon">🌱</span>
              Welcome Back
            </div>
            
            <h1 className="welcome-title">
              Welcome Back to<br />
              <span className="text-gradient">PlantSmart</span>
            </h1>
            
            <p className="welcome-description">
              Sign in to continue nurturing your green sanctuary with intelligent care,
              real-time insights, and friendly reminders.
            </p>
            
            <div className="feature-highlights">
              <div className="highlight-item">
                <span className="highlight-icon">✅</span>
                <span>Smart watering schedules tailored to each plant</span>
              </div>
              <div className="highlight-item">
                <span className="highlight-icon">✅</span>
                <span>Health alerts and expert recommendations</span>
              </div>
              <div className="highlight-item">
                <span className="highlight-icon">✅</span>
                <span>Beautiful dashboard across all your devices</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Column - Form */}
      <div className="auth-right">
        <div className="auth-form-container animate-fade-in">
          <div className="form-header">
            <h2 className="form-title">Sign in to your account</h2>
            <p className="form-subtitle">
              Don't have an account? 
              <Link to="/register" className="auth-link"> Create account</Link>
            </p>
          </div>

            <form onSubmit={onSubmit} className="auth-form">
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
                    onChange={e=>setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="input-wrapper">
                  <span className="input-icon">🔒</span>
                  <input 
                    id="password"
                    className="auth-input" 
                    type="password" 
                    placeholder="••••••••" 
                    value={password} 
                    onChange={e=>setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-options">
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={e=>setRememberMe(e.target.checked)}
                  />
                  <span className="checkmark"></span>
                  Remember me
                </label>
                <Link to="/forgot-password" className="forgot-link">
                  Forgot password?
                </Link>
              </div>

              {err && (
                <div className="auth-error animate-fade-in">
                  <span className="error-icon">⚠️</span>
                  {err}
                </div>
              )}

              <button 
                className="auth-btn primary" 
                type="submit" 
                disabled={isLoading}
              >
                {isLoading ? <ButtonLoading /> : 'Sign In'}
              </button>

              <div className="auth-divider">
                <span>OR</span>
              </div>

              <div className="social-buttons">
                <button type="button" className="social-btn google">
                  <span className="social-icon">🔍</span>
                  Google
                </button>
                <button type="button" className="social-btn apple">
                  <span className="social-icon">🍎</span>
                  Apple
                </button>
                <button type="button" className="social-btn facebook">
                  <span className="social-icon">📘</span>
                  Facebook
                </button>
              </div>

              <div className="dev-section">
                <button 
                  className="auth-btn outline" 
                  type="button" 
                  onClick={devBypass}
                >
                  Dev bypass (Premium)
                </button>
              </div>
            </form>

            <div className="form-footer">
              <Link to="/" className="back-link">← Back to Site</Link>
            </div>
          </div>
        </div>
    </div>
  );
}
