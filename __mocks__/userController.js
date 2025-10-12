/**
 * User Controller Mock
 */

// Get user profile
const getUserProfile = async (req, res) => {
    try {
        // Mock user from request
        const user = req.user;

        // Mock profile data
        const userProfile = {
            id: user.id,
            email: user.email,
            fullName: 'Test User',
            phoneNumber: '1234567890',
            location: 'Test City',
            avatar: 'https://example.com/avatar.jpg',
            isPremium: false,
            joinDate: '2023-01-15T10:30:00Z',
            preferences: {
                language: 'en',
                notifications: true,
                emailUpdates: true
            }
        };
        
        return res.json(userProfile);
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching user profile', error: error.message });
    }
};

// Update user profile
const updateUserProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const updates = req.body;
        
        // Mock user profile before update
        const userProfile = {
            id: userId,
            email: req.user.email,
            fullName: 'Test User',
            phoneNumber: '0987654321',
            location: 'Old City',
            avatar: 'https://example.com/avatar.jpg',
            isPremium: false,
            joinDate: '2023-01-15T10:30:00Z',
            preferences: {
                language: 'en',
                notifications: true,
                emailUpdates: true
            }
        };
        
        // Apply updates
        const updatedProfile = {
            ...userProfile,
            ...updates
        };
        
        return res.json(updatedProfile);
    } catch (error) {
        return res.status(500).json({ message: 'Error updating user profile', error: error.message });
    }
};

// Change user password
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        
        // Validate inputs
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: 'New passwords do not match' });
        }
        
        // Mock password verification - only 'password123' is valid
        if (currentPassword !== 'password123') {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }
        
        // Mock successful password change
        return res.json({ 
            message: 'Password changed successfully',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        return res.status(500).json({ message: 'Error changing password', error: error.message });
    }
};

// Upgrade user to premium
const upgradeToPremiom = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Mock user profile before upgrade
        const userProfile = {
            id: userId,
            email: req.user.email,
            fullName: 'Test User',
            isPremium: false
        };
        
        // Calculate premium expiry - 1 month from now
        const premiumExpiry = new Date();
        premiumExpiry.setMonth(premiumExpiry.getMonth() + 1);
        
        // Apply premium upgrade
        const upgradedProfile = {
            ...userProfile,
            isPremium: true,
            premiumExpiry: premiumExpiry.toISOString(),
            premiumFeatures: ['AI Recommendations', 'Advanced Analytics', 'Priority Support']
        };
        
        return res.json(upgradedProfile);
    } catch (error) {
        return res.status(500).json({ message: 'Error upgrading to premium', error: error.message });
    }
};

module.exports = {
    getUserProfile,
    updateUserProfile,
    changePassword,
    upgradeToPremiom
};