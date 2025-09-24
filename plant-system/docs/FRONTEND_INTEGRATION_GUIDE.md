# Frontend Integration Guide - Plant Monitoring System API

## 🚀 Backend API Documentation for React Frontend Team

### 📍 Base URL
```
http://localhost:3010
```

### 🔄 Recent Updates
```
✅ ADDED: Profile Management API - View and edit user profiles
✅ ADDED: Premium Upgrade API - User role upgrade after payment
✅ UPDATED: Better authentication with middleware protection
✅ ADDED: User password change endpoint with validation
```

---

## 🔐 Authentication Endpoints

### 1. **Forgot Password Request**
```http
POST /auth/forgot-password
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password reset email sent successfully",
  "data": {
    "email": "user@example.com",
    "resetUrl": "http://localhost:3000/reset-password?token=abc123xyz",
    "expiresIn": "1 hour"
  }
}
```

**Error Responses:**
```json
// 400 - Missing email
{
  "error": "Email is required"
}

// 400 - Invalid email format  
{
  "error": "Please provide a valid email address"
}

// 404 - User not found (returns 200 for security)
{
  "success": true,
  "message": "If the email exists, a reset link has been sent"
}

// 500 - Server error
{
  "error": "Failed to send password reset email. Please try again later."
}
```

---

### 2. **Reset Password**
```http
POST /auth/reset-password
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "token": "reset-token-from-email",
  "newPassword": "newSecurePassword123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

**Error Responses:**
```json
// 400 - Missing required fields
{
  "error": "Email, token, and new password are required"
}

// 400 - Invalid token or expired
{
  "error": "Invalid or expired reset token"
}

// 404 - User not found
{
  "error": "User not found"
}

// 500 - Server error
{
  "error": "Failed to reset password. Please try again later."
}
```

---

## � Profile Management Endpoints

### 1. **Get User Profile**
```http
GET /users/profile
```

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user_id": 1,
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "Regular",
    "notification_prefs": {
      "email": true,
      "push": false
    },
    "created_at": "2025-09-01T08:00:00.000Z"
  }
}
```

**Error Responses:**
```json
// 401 - Unauthorized
{
  "success": false,
  "error": "Authentication required. No token provided."
}

// 404 - User not found
{
  "success": false,
  "error": "User not found"
}
```

### 2. **Update User Profile**
```http
PUT /users/profile
```

**Request Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "full_name": "John Smith",
  "notification_prefs": {
    "email": true,
    "push": true
  }
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user_id": 1,
    "email": "user@example.com",
    "full_name": "John Smith",
    "role": "Regular",
    "notification_prefs": {
      "email": true,
      "push": true
    },
    "created_at": "2025-09-01T08:00:00.000Z"
  }
}
```

### 3. **Change Password**
```http
PUT /users/change-password
```

**Request Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword456"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Responses:**
```json
// 400 - Bad Request
{
  "success": false,
  "error": "Current password and new password are required"
}

// 401 - Current password incorrect
{
  "success": false,
  "error": "Current password is incorrect"
}
```

### 4. **Upgrade to Premium**
```http
POST /users/upgrade-to-premium
```

**Request Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "paymentId": 123
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Successfully upgraded to Premium",
  "data": {
    "user_id": 1,
    "email": "user@example.com",
    "full_name": "John Smith",
    "role": "Premium",
    "notification_prefs": {
      "email": true,
      "push": true
    },
    "created_at": "2025-09-01T08:00:00.000Z"
  }
}
```

### 5. **Get Premium Status**
```http
GET /users/premium-status
```

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "isPremium": true,
    "role": "Premium",
    "premiumFeatures": [
      "Advanced plant analytics",
      "Multiple plant zones management",
      "Custom dashboard widgets",
      "Advanced sensor thresholds",
      "Priority customer support"
    ]
  }
}
```

---

## �💳 Payment Endpoints (VNPay Integration)

### 1. **Create Payment**
```http
POST /payment/create
```

**Request Body:**
```json
{
  "userId": 1,
  "amount": 299000,
  "orderInfo": "Payment for premium subscription"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Payment URL created successfully",
  "data": {
    "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=29900000&vnp_Command=pay&...",
    "orderId": "TXN1727158200123",
    "amount": 299000,
    "expiresAt": "2025-09-24T08:09:57.285Z"
  }
}
```

---

### 2. **Payment Return Handler**
```http
GET /payment/vnpay-return?vnp_ResponseCode=00&vnp_TxnRef=TXN123...
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Payment completed successfully",
  "data": {
    "transactionStatus": "success",
    "amount": 299000,
    "transactionId": "TXN1727158200123",
    "responseCode": "00"
  }
}
```

---

### 3. **Get Payment Status**
```http
GET /payment/status/:orderId
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "orderId": "TXN1727158200123",
    "status": "completed",
    "amount": 299000,
    "createdAt": "2025-09-24T07:09:57.285Z"
  }
}
```

---

### 4. **Get Payment History**
```http
GET /payment/history?userId=1
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "payment_id": 1,
        "amount": 299000,
        "status": "completed",
        "created_at": "2025-09-24T07:09:57.285Z",
        "formatted_amount": "299,000 VND"
      }
    ],
    "totalPayments": 5,
    "totalAmount": 1495000
  }
}
```

---

## 🎯 Frontend Implementation Guidelines

### **React Router Setup**
```jsx
// App.js
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <Routes>
        {/* Password Reset Flow */}
        <Route path="/forgot-password" element={<ForgotPasswordForm />} />
        <Route path="/reset-password" element={<ResetPasswordForm />} />
        
        {/* Profile Management Flow */}
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/profile/edit" element={<EditProfile />} />
        <Route path="/profile/change-password" element={<ChangePassword />} />
        
        {/* Premium Flow */}
        <Route path="/premium" element={<PremiumFeatures />} />
        <Route path="/premium/upgrade" element={<PremiumUpgrade />} />
        
        {/* Payment Flow */}
        <Route path="/payment" element={<PaymentForm />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/history" element={<PaymentHistory />} />
      </Routes>
    </Router>
  );
}
```

---

### **Forgot Password Component**
```jsx
// components/ForgotPasswordForm.jsx
import { useState } from 'react';
import axios from 'axios';

const ForgotPasswordForm = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.post('http://localhost:3010/auth/forgot-password', {
        email: email
      });
      
      setMessage('Password reset email sent! Check your inbox.');
    } catch (error) {
      setMessage(error.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Sending...' : 'Send Reset Link'}
      </button>
      {message && <p>{message}</p>}
    </form>
  );
};
```

---

### **Reset Password Component**
```jsx
// components/ResetPasswordForm.jsx
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ResetPasswordForm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setMessage('Invalid reset link');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    setLoading(true);
    
    try {
      const response = await axios.post('http://localhost:3010/auth/reset-password', {
        email: formData.email,
        token: token,
        newPassword: formData.newPassword
      });
      
      setMessage('Password reset successfully! You can now login.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({...formData, email: e.target.value})}
        placeholder="Enter your email"
        required
      />
      <input
        type="password"
        value={formData.newPassword}
        onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
        placeholder="New Password"
        required
      />
      <input
        type="password"
        value={formData.confirmPassword}
        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
        placeholder="Confirm Password"
        required
      />
      <button type="submit" disabled={loading || !token}>
        {loading ? 'Resetting...' : 'Reset Password'}
      </button>
      {message && <p>{message}</p>}
    </form>
  );
};
```

---

### **User Profile Component**
```jsx
// components/UserProfile.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const UserProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:3010/users/profile', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        setProfile(response.data.data);
      } catch (err) {
        setError('Failed to load profile. Please try again later.');
        console.error('Profile error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, []);
  
  if (loading) return <div>Loading profile...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!profile) return <div>No profile data found</div>;
  
  return (
    <div className="profile-container">
      <h2>User Profile</h2>
      <div className="profile-info">
        <p><strong>Name:</strong> {profile.full_name}</p>
        <p><strong>Email:</strong> {profile.email}</p>
        <p><strong>Account Type:</strong> {profile.role}</p>
        <p><strong>Member Since:</strong> {new Date(profile.created_at).toLocaleDateString()}</p>
      </div>
      
      <div className="profile-actions">
        <Link to="/profile/edit" className="btn btn-primary">Edit Profile</Link>
        <Link to="/profile/change-password" className="btn btn-secondary">Change Password</Link>
        {profile.role !== 'Premium' && (
          <Link to="/premium/upgrade" className="btn btn-highlight">Upgrade to Premium</Link>
        )}
      </div>
    </div>
  );
};
```

### **Edit Profile Component**
```jsx
// components/EditProfile.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const EditProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    notification_prefs: {
      email: false,
      push: false
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:3010/users/profile', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        setProfile(response.data.data);
        setFormData({
          full_name: response.data.data.full_name || '',
          notification_prefs: response.data.data.notification_prefs || {
            email: false,
            push: false
          }
        });
      } catch (err) {
        setError('Failed to load profile. Please try again later.');
        console.error('Profile error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, []);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    setFormData({
      ...formData,
      notification_prefs: {
        ...formData.notification_prefs,
        [name]: checked
      }
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:3010/users/profile', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      navigate('/profile');
    } catch (err) {
      setError('Failed to update profile. Please try again.');
      console.error('Update error:', err);
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) return <div>Loading profile...</div>;
  if (error) return <div className="error">{error}</div>;
  
  return (
    <div className="edit-profile-container">
      <h2>Edit Profile</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="full_name">Full Name</label>
          <input
            type="text"
            id="full_name"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="notification-prefs">
          <h3>Notification Preferences</h3>
          <label>
            <input
              type="checkbox"
              name="email"
              checked={formData.notification_prefs.email}
              onChange={handleNotificationChange}
            />
            Email Notifications
          </label>
          <label>
            <input
              type="checkbox"
              name="push"
              checked={formData.notification_prefs.push}
              onChange={handleNotificationChange}
            />
            Push Notifications
          </label>
        </div>
        
        <div className="form-actions">
          <button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button type="button" onClick={() => navigate('/profile')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
```

### **Premium Upgrade Component**
```jsx
// components/PremiumUpgrade.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const PremiumUpgrade = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState(299000);
  const [loading, setLoading] = useState(false);
  const [premiumStatus, setPremiumStatus] = useState(null);
  
  // Check if user is already premium
  useEffect(() => {
    const checkPremiumStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:3010/users/premium-status', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        setPremiumStatus(response.data.data);
        
        // If already premium, redirect to premium features page
        if (response.data.data.isPremium) {
          navigate('/premium');
        }
      } catch (err) {
        console.error('Premium status check error:', err);
      }
    };
    
    checkPremiumStatus();
  }, [navigate]);
  
  const handlePayment = async () => {
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:3010/payment/create', 
        {
          amount: amount,
          orderInfo: 'Premium subscription payment'
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // Store payment info in session for later use
      sessionStorage.setItem('pendingPaymentId', response.data.data.orderId);
      
      // Redirect to VNPay
      window.location.href = response.data.data.paymentUrl;
    } catch (error) {
      console.error('Payment error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="premium-upgrade-container">
      <h2>Upgrade to Premium</h2>
      
      <div className="premium-benefits">
        <h3>Premium Benefits</h3>
        <ul>
          <li>Advanced plant analytics and detailed health metrics</li>
          <li>Multiple plant zones management</li>
          <li>Custom dashboard widgets and layouts</li>
          <li>Advanced sensor thresholds for precise plant care</li>
          <li>Priority customer support</li>
        </ul>
      </div>
      
      <div className="payment-details">
        <h3>Payment Details</h3>
        <p className="price">Price: {amount.toLocaleString()} VND</p>
        <p>Subscription duration: 1 year</p>
      </div>
      
      <button
        className="upgrade-button"
        onClick={handlePayment}
        disabled={loading}
      >
        {loading ? 'Processing...' : 'Upgrade Now'}
      </button>
    </div>
  );
};
```

### **Payment Component**
```jsx
// components/PaymentForm.jsx
import { useState } from 'react';
import axios from 'axios';

const PaymentForm = () => {
  const [amount, setAmount] = useState(299000);
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:3010/payment/create', 
        {
          amount: amount,
          orderInfo: 'Premium subscription payment'
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // Redirect to VNPay
      window.location.href = response.data.data.paymentUrl;
    } catch (error) {
      console.error('Payment error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Payment</h2>
      <p>Amount: {amount.toLocaleString()} VND</p>
      <button onClick={handlePayment} disabled={loading}>
        {loading ? 'Processing...' : 'Pay Now'}
      </button>
    </div>
  );
};
```

---

## 🔧 Environment Variables for Frontend

```bash
# .env
REACT_APP_API_BASE_URL=http://localhost:3010
REACT_APP_FRONTEND_URL=http://localhost:3000
```

---

## 📝 Testing the APIs

### **Using curl:**

```bash
# Test forgot password
curl -X POST http://localhost:3010/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# Test get profile (requires authentication)
curl -X GET http://localhost:3010/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test update profile (requires authentication)
curl -X PUT http://localhost:3010/users/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"full_name": "Updated Name", "notification_prefs": {"email": true, "push": false}}'

# Test change password (requires authentication)
curl -X PUT http://localhost:3010/users/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"currentPassword": "oldPassword123", "newPassword": "newPassword456"}'

# Test premium status (requires authentication)
curl -X GET http://localhost:3010/users/premium-status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test payment creation
curl -X POST http://localhost:3010/payment/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"amount": 299000, "orderInfo": "Test payment"}'

# Test premium upgrade (requires authentication and valid payment)
curl -X POST http://localhost:3010/users/upgrade-to-premium \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"paymentId": 123}'
```

### **Using Postman:**
Import the collection from `tests/password-reset-postman.json` for ready-to-use API tests.

---

## 🚨 Important Notes for Frontend Team

1. **No HTML emails**: Backend only sends plain text emails. All UI styling should be done in React.

2. **Security**: 
   - Always validate user inputs
   - Use HTTPS in production
   - Store tokens securely (consider using secure cookies)
   - Include Authorization header in all protected requests

3. **Error Handling**:
   - Always check `response.data.success` for API success/failure
   - Display user-friendly error messages
   - Handle network errors gracefully
   - Handle 401 errors by redirecting to login

4. **Authentication Flow**:
   - Store JWT token after login (localStorage or secure cookies)
   - Add token to all authenticated requests
   - Handle token expiration and refresh
   - Clear token on logout

5. **Payment Flow**:
   - User clicks "Pay" → redirects to VNPay → returns to `/payment/vnpay-return` → show success/failure
   - After successful payment, call `/users/upgrade-to-premium` to update user role

6. **Password Reset Flow**:
   - User enters email → receives plain text email with reset link → clicks link → enters new password

7. **Premium Upgrade Flow**:
   - Check premium status → make payment → verify payment → call upgrade endpoint
   - Hide premium features for non-premium users
   - Show premium badge/icon for premium users

8. **State Management**: Consider using React Context or Redux for managing authentication state.

---

## 🧪 Available Tests

Run backend tests to verify API functionality:
```bash
npm test -- tests/email-simple.test.js  # Email functionality
node tests/vnpay-test.js                 # VNPay integration
```

This documentation provides everything needed for the React frontend team to integrate with the backend APIs successfully!
