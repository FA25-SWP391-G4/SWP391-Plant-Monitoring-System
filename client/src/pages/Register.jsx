// src/pages/Register.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import authApi from "../api/authApi";

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
    
    // Validate inputs
    if (!formData.email || !formData.full_name || !formData.password || !formData.confirmPassword) {
      setError("All fields are required");
      return;
    }
    
    // Check email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }
    
    // Check password match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    // Check password strength
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }
    
    try {
      setLoading(true);
      await authApi.register(formData.email, formData.password, formData.confirmPassword, formData.full_name);
      setLoading(false);
      // Show success message and redirect to login
      alert("Registration successful! Please log in.");
      navigate("/login");
    } catch (err) {
      setLoading(false);
      setError(err?.response?.data?.error || "Registration failed. Please try again.");
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow">
            <div className="card-body p-4">
              <h2 className="text-center mb-4">Create an Account</h2>
              
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email address</label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="full_name" className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength="6"
                  />
                  <div className="form-text">Password must be at least 6 characters long</div>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                  <input
                    type="password"
                    className="form-control"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <button 
                  type="submit" 
                  className="btn btn-primary w-100 mb-3"
                  disabled={loading}
                >
                  {loading ? "Creating Account..." : "Register"}
                </button>
                
                <div className="text-center">
                  Already have an account? <Link to="/login">Login here</Link>
                </div>
              </form>
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <p>Or register with:</p>
            <button 
              className="btn btn-outline-danger" 
              onClick={() => window.location.href = "/auth/google"}
            >
              <i className="fab fa-google me-2"></i>Continue with Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
