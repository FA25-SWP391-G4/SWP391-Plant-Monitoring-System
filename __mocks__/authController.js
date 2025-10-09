/**
 * Authentication Controller Mock
 */

// Register new user
const register = async (req, res) => {
    try {
        const { email, password, confirmPassword, fullName } = req.body;
        
        // Validate required fields
        if (!email || !password || !confirmPassword || !fullName) {
            return res.status(400).json({
                error: 'All fields are required'
            });
        }
        
        // Check if passwords match
        if (password !== confirmPassword) {
            return res.status(400).json({
                error: 'Passwords do not match'
            });
        }
        
        // Success response
        res.status(201).json({
            success: true,
            message: 'Registration successful',
            user: {
                email,
                fullName,
                role: 'Regular'
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            error: 'An error occurred during registration'
        });
    }
};

// Login user
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({
                error: 'Email and password are required'
            });
        }
        
        // Mock successful login (would normally validate credentials)
        if (email === 'test@example.com' && password === 'testpass123') {
            return res.status(200).json({
                success: true,
                message: 'Login successful',
                token: 'mock-jwt-token',
                user: {
                    email,
                    fullName: 'Test User',
                    role: 'Regular'
                }
            });
        }
        
        // Invalid credentials response
        res.status(401).json({
            error: 'Invalid email or password'
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            error: 'An error occurred during login'
        });
    }
};

// Logout user
const logout = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            message: 'Logout successful'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            error: 'An error occurred during logout'
        });
    }
};

// Forgot password - request reset
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                error: 'Email is required'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'If the email exists, a reset link has been sent'
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            error: 'An error occurred while processing your request'
        });
    }
};

// Reset password with token
const resetPassword = async (req, res) => {
    try {
        const { token } = req.query;
        const { password, confirmPassword } = req.body;
        
        if (!token) {
            return res.status(400).json({
                error: 'Reset token is required'
            });
        }
        
        if (!password || !confirmPassword) {
            return res.status(400).json({
                error: 'New password and confirmation are required'
            });
        }
        
        if (password !== confirmPassword) {
            return res.status(400).json({
                error: 'Passwords do not match'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Password reset successful. You can now log in with your new password.'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            error: 'An error occurred while resetting your password'
        });
    }
};

// Change password (requires authentication)
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                error: 'All fields are required'
            });
        }
        
        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                error: 'New passwords do not match'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            error: 'An error occurred while changing your password'
        });
    }
};

// Google OAuth login
const googleLogin = async (req, res) => {
    try {
        const { token } = req.body;
        
        if (!token) {
            return res.status(400).json({
                error: 'Google token is required'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Google login successful',
            token: 'mock-jwt-token',
            user: {
                email: 'google-user@example.com',
                fullName: 'Google User',
                role: 'Regular'
            }
        });
    } catch (error) {
        console.error('Google login error:', error);
        res.status(500).json({
            error: 'An error occurred during Google login'
        });
    }
};

module.exports = {
    register,
    login,
    logout,
    forgotPassword,
    resetPassword,
    changePassword,
    googleLogin
};