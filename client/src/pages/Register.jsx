import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import authApi from "../api/authApi";
import { ButtonLoading } from "../components/Loading";
import './Auth.css';

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
  const [step, setStep] = useState(1);
  const [plantPreferences, setPlantPreferences] = useState({
    location: '',
    experience: '',
    interests: []
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePreferenceChange = (field, value) => {
    setPlantPreferences(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleInterestToggle = (interest) => {
    setPlantPreferences(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (step === 1) {
      // Validate step 1
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
      
      if (formData.password.length < 8) {
        setError("Password must be at least 8 characters");
        return;
      }
      
      setStep(2);
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

  const renderStep1 = () => (
    <div className="auth-form-container">
      <div className="auth-title">
        <h3>Create your account</h3>
        <p>We'll set up your PlantSmart profile to personalize recommendations.</p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="full_name">Full name</label>
          <div className="input-wrapper">
            <span className="input-icon">👤</span>
            <input 
              id="full_name"
              className="auth-input" 
              type="text"
              name="full_name"
              placeholder="Alex Green" 
              value={formData.full_name} 
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <div className="input-wrapper">
            <span className="input-icon">📧</span>
            <input 
              id="email"
              className="auth-input" 
              type="email"
              name="email"
              placeholder="alex@greens.com" 
              value={formData.email} 
              onChange={handleChange}
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
              name="password"
              placeholder="At least 8 characters" 
              value={formData.password} 
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <div className="input-wrapper">
            <span className="input-icon">🔒</span>
            <input 
              id="confirmPassword"
              className="auth-input" 
              type="password" 
              name="confirmPassword"
              placeholder="Confirm your password" 
              value={formData.confirmPassword} 
              onChange={handleChange}
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

        <button className="auth-btn primary" type="submit">
          Continue
        </button>
      </form>
    </div>
  );

  const renderStep2 = () => (
    <div className="auth-form-container">
      <div className="auth-title">
        <h3>Tell us about your plants</h3>
        <p>We'll tailor care plans based on your preferences.</p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label>Where are your plants?</label>
          <div className="choice-buttons">
            <button 
              type="button"
              className={`choice-btn ${plantPreferences.location === 'indoor' ? 'active' : ''}`}
              onClick={() => handlePreferenceChange('location', 'indoor')}
            >
              Indoor
            </button>
            <button 
              type="button"
              className={`choice-btn ${plantPreferences.location === 'outdoor' ? 'active' : ''}`}
              onClick={() => handlePreferenceChange('location', 'outdoor')}
            >
              Outdoor
            </button>
          </div>
        </div>

        <div className="form-group">
          <label>Your experience level</label>
          <div className="choice-buttons">
            <button 
              type="button"
              className={`choice-btn ${plantPreferences.experience === 'beginner' ? 'active' : ''}`}
              onClick={() => handlePreferenceChange('experience', 'beginner')}
            >
              Beginner
            </button>
            <button 
              type="button"
              className={`choice-btn ${plantPreferences.experience === 'intermediate' ? 'active' : ''}`}
              onClick={() => handlePreferenceChange('experience', 'intermediate')}
            >
              Intermediate
            </button>
            <button 
              type="button"
              className={`choice-btn ${plantPreferences.experience === 'expert' ? 'active' : ''}`}
              onClick={() => handlePreferenceChange('experience', 'expert')}
            >
              Expert
            </button>
          </div>
        </div>

        <div className="form-group">
          <label>What are you into?</label>
          <div className="interest-tags">
            {['Succulents', 'Tropical', 'Herbs', 'Flowering', 'Foliage'].map(interest => (
              <button
                key={interest}
                type="button"
                className={`interest-tag ${plantPreferences.interests.includes(interest) ? 'active' : ''}`}
                onClick={() => handleInterestToggle(interest)}
              >
                {interest}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="auth-error animate-fade-in">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        <div className="step-buttons">
          <button 
            type="button" 
            className="auth-btn outline" 
            onClick={() => setStep(1)}
          >
            Back
          </button>
          <button 
            className="auth-btn primary" 
            type="submit" 
            disabled={loading}
          >
            {loading ? <ButtonLoading /> : 'Continue'}
          </button>
        </div>
      </form>
    </div>
  );

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
              <span>🌟</span>
              <span>Join thousands of happy gardeners</span>
            </div>
            
            <h1 className="welcome-title">
              Start Your
              <br />
              Smart Garden
              <br />
              Journey
            </h1>
            
            <p className="welcome-description">
              Create your account and discover the joy of effortless plant care with AI-powered insights and real-time monitoring.
            </p>
            
            <div className="feature-highlights">
              <div className="highlight-item">
                <span className="highlight-icon">🤖</span>
                <span>AI-powered plant recommendations</span>
              </div>
              <div className="highlight-item">
                <span className="highlight-icon">📊</span>
                <span>Real-time monitoring & alerts</span>
              </div>
              <div className="highlight-item">
                <span className="highlight-icon">🌱</span>
                <span>Personalized care schedules</span>
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
              <h2>PlantSmart Onboarding</h2>
            </div>
            <div className="auth-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{width: `${(step / 2) * 100}%`}}></div>
              </div>
            </div>
          </div>

          {step === 1 ? renderStep1() : renderStep2()}

          <div className="auth-footer">
            <p>
              Already have an account? 
              <Link to="/login" className="auth-link"> Sign In</Link>
            </p>
            <Link to="/" className="back-link">Back to Site</Link>
          </div>

          <div className="auth-features">
            <div className="feature-item">
              <span className="feature-icon">✅</span>
              <span>14-day free trial</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🔒</span>
              <span>We never share your data</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
