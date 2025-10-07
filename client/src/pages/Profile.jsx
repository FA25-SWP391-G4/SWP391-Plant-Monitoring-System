// src/pages/Profile.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import userApi from "../api/userApi";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    notification_prefs: {
      email: true,
      browser: true
    }
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Load user data on component mount
  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || "",
        email: user.email || "",
        notification_prefs: user.notification_prefs || {
          email: true,
          browser: true
        }
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleNotificationChange = (type) => {
    setFormData(prev => ({
      ...prev,
      notification_prefs: {
        ...prev.notification_prefs,
        [type]: !prev.notification_prefs[type]
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    
    try {
      setLoading(true);
      const updatedUser = await userApi.updateProfile(formData);
      setLoading(false);
      setSuccess(true);
      
      // Update user context
      updateUser(updatedUser);
      
    } catch (err) {
      setLoading(false);
      setError(err?.response?.data?.error || "Failed to update profile. Please try again.");
    }
  };

  if (!user) {
    return (
      <div className="container py-5">
        <div className="alert alert-warning">
          Please log in to view your profile.
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="row">
        <div className="col-md-4 mb-4">
          <div className="card shadow">
            <div className="card-body text-center">
              <div className="mb-3">
                <div className="profile-image">
                  {user.profile_picture ? (
                    <img 
                      src={user.profile_picture} 
                      alt="Profile" 
                      className="rounded-circle img-fluid" 
                      style={{ width: "150px", height: "150px", objectFit: "cover" }}
                    />
                  ) : (
                    <div className="rounded-circle bg-secondary d-flex align-items-center justify-content-center mx-auto"
                         style={{ width: "150px", height: "150px" }}>
                      <span className="display-4 text-white">{user.full_name?.charAt(0).toUpperCase() || "U"}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <h4>{user.full_name || "User"}</h4>
              <p className="text-muted mb-1">{user.email}</p>
              <p className="mb-2">
                <span className="badge bg-primary">{user.role} User</span>
              </p>
              
              <div className="d-grid gap-2 mt-3">
                <Link to="/change-password" className="btn btn-outline-primary">
                  Change Password
                </Link>
                {user.role !== "Premium" && (
                  <Link to="/upgrade" className="btn btn-warning">
                    Upgrade to Premium
                  </Link>
                )}
              </div>
            </div>
          </div>
          
          <div className="card shadow mt-4">
            <div className="card-body">
              <h5 className="card-title">Account Information</h5>
              <ul className="list-group list-group-flush">
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  Member Since
                  <span>{new Date(user.created_at).toLocaleDateString()}</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  Account Type
                  <span>{user.role}</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  Last Login
                  <span>{user.last_login ? new Date(user.last_login).toLocaleString() : "N/A"}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="col-md-8">
          <div className="card shadow">
            <div className="card-body p-4">
              <h4 className="mb-4">Edit Profile</h4>
              
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="alert alert-success" role="alert">
                  Profile updated successfully!
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="full_name" className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email address</label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled
                  />
                  <div className="form-text">Email cannot be changed</div>
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Notification Preferences</label>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="emailNotif"
                      checked={formData.notification_prefs?.email}
                      onChange={() => handleNotificationChange('email')}
                    />
                    <label className="form-check-label" htmlFor="emailNotif">
                      Email Notifications
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="browserNotif"
                      checked={formData.notification_prefs?.browser}
                      onChange={() => handleNotificationChange('browser')}
                    />
                    <label className="form-check-label" htmlFor="browserNotif">
                      Browser Notifications
                    </label>
                  </div>
                </div>
                
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </form>
            </div>
          </div>
          
          <div className="card shadow mt-4">
            <div className="card-body p-4">
              <h4 className="mb-4">Connected Plants</h4>
              
              {/* You can add a list of user's plants here */}
              <p className="text-muted">
                {user.role === "Premium" ? 
                  "As a premium user, you can manage multiple plant zones." : 
                  "Upgrade to Premium to manage multiple plant zones."}
              </p>
              
              <Link to="/zones" className="btn btn-outline-primary">
                Manage Plant Zones
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
