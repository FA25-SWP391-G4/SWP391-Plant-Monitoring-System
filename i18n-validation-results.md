# Internationalization (i18n) Implementation Validation

_Generated on 00:12:09 29/9/2025_

## Directory Structure

✅ i18n directory found at C:\Users\l\OneDrive\DUE\Project\SWP391-Plant-Monitoring-System\plant-system\client\src\i18n

✅ i18n.js configuration file found

```javascript
// src/i18n/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Import translation resources
import translationEN from './locales/en/translation.json';
import translationVI from './locales/vi/translation.json';

// Translation resources
const resources = {
  en: {
    translation: translationEN
  },
  vi: {
    translation: translationVI
  }
};

i18n
  // Use backend for loading translations from server (optional)
  .use(Backend)
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Init i18next
  .init({
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    // Detect language from localStorage or navigator
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
```

i18next imported: ✅
react-i18next imported: ✅
Language detector imported: ✅

✅ Locales directory found

✅ English translations directory found
✅ English translation file found with 3 keys

Sample English translations:
```json
{
  "common": {
    "submit": "Submit",
    "cancel": "Cancel",
    "delete": "Delete",
    "add": "Add",
    "edit": "Edit",
    "save": "Save",
    "close": "Close",
    "back": "Back",
    "next": "Next"
  },
  "navigation": {
    "home": "Home",
    "dashboard": "Dashboard",
    "zones": "Zones",
    "reports": "Reports",
    "searchReports": "Search Reports",
    "thresholds": "Thresholds",
    "upgrade": "Upgrade",
    "login": "Login",
    "logout": "Logout",
    "profile": "Profile"
  },
  "zones": {
    "title": "Manage Multiple Plant Zones",
    "createZone": "Create Zone",
    "zoneName": "Name",
    "zoneDescription": "Description",
    "devices": "Devices",
    "unassignedDevices": "Unassigned Devices",
    "device": "Device",
    "deviceType": "Type",
    "assignTo": "Assign to",
    "noDevices": "No unassigned devices available",
    "selectPump": "Select pump for Zone",
    "assignPump": "-- Assign pump for {{zone}} --",
    "deleteZoneConfirm": "Delete this zone?",
    "deleteZone": "Delete zone",
    "zoneDevices": "Devices in zone",
    "unassign": "Unassign",
    "noZoneDevices": "No devices in this zone"
  }
}
```

✅ Vietnamese translations directory found
✅ Vietnamese translation file found with 3 keys

Sample Vietnamese translations:
```json
{
  "common": {
    "submit": "Gửi",
    "cancel": "Hủy bỏ",
    "delete": "Xóa",
    "add": "Thêm",
    "edit": "Sửa",
    "save": "Lưu",
    "close": "Đóng",
    "back": "Quay lại",
    "next": "Tiếp theo"
  },
  "navigation": {
    "home": "Trang chủ",
    "dashboard": "Bảng điều khiển",
    "zones": "Khu vườn",
    "reports": "Báo cáo",
    "searchReports": "Tìm kiếm báo cáo",
    "thresholds": "Ngưỡng cảnh báo",
    "upgrade": "Nâng cấp",
    "login": "Đăng nhập",
    "logout": "Đăng xuất",
    "profile": "Hồ sơ"
  },
  "zones": {
    "title": "Quản lý nhiều khu vườn",
    "createZone": "Tạo khu vườn",
    "zoneName": "Tên",
    "zoneDescription": "Mô tả",
    "devices": "Thiết bị",
    "unassignedDevices": "Thiết bị chưa gán",
    "device": "Thiết bị",
    "deviceType": "Loại",
    "assignTo": "Gán vào",
    "noDevices": "Không còn thiết bị trống",
    "selectPump": "Chọn bơm cho Zone",
    "assignPump": "-- Gán bơm cho {{zone}} --",
    "deleteZoneConfirm": "Xóa khu vườn này?",
    "deleteZone": "Xóa zone",
    "zoneDevices": "Thiết bị trong zone",
    "unassign": "Bỏ gán",
    "noZoneDevices": "Chưa có thiết bị"
  }
}
```

## Language Switcher Component

✅ LanguageSwitcher.jsx component found

useTranslation imported: ✅
i18n reference: ✅

Language changing logic: ✅

Code snippet:
```jsx
const fetchUserPreference = async () => {
      if (user) {
        try {
          const response = await languageApi.getPreferences();
          if (response.data?.language) {
            i18n.changeLanguage(response.data.language);
            setCurrentLanguage(response.data.language);
          }
        } catch (error) {
          console.error('Error fetching user language preferen
```

## i18n Integration in App

✅ App.jsx found

i18n import or provider: ❌

## i18n Usage in Pages

Found 8 page files

❓ CustomizeDashboard.jsx does not appear to use i18n

❓ Dashboard.jsx does not appear to use i18n

✅ Login.jsx uses i18n
  - Uses translation function

✅ Reports.jsx uses i18n
  - Uses translation function
  - Translation keys used: YYYY-MM-DD, YYYY-MM-DD, /zones, MM/DD HH:mm

✅ SearchReports.jsx uses i18n
  - Uses translation function
  - Translation keys used: YYYY-MM-DD, YYYY-MM-DD, /zones

✅ Thresholds.jsx uses i18n
  - Uses translation function
  - Translation keys used: /zones, Đã lưu ngưỡng/rules cho zone!

✅ Upgrade.jsx uses i18n
  - Uses translation function
  - Translation keys used: vnpay, stripe, paypal

✅ Zones.jsx uses i18n
  - Imports useTranslation
  - Uses translation function
  - Translation keys used: /devices/unassigned, /devices/pumps, zones.deleteZoneConfirm, zones.title, zones.createZone...

6 out of 8 pages use i18n

## Backend Language API

✅ languageController.js found

```javascript
/**
 * Language Controller
 * Handles API requests related to language settings and preferences
 */

const { User } = require('../models');

/**
 * Get language preferences for the current user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getLanguagePreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);
    
    // Default to English if no preference is set
    const language = user.languagePreference || 'en';
    
    return res.status(200).json({ language });
  } catch (error) {
    console.error('Error getting language preferences:', error);
    return res.status(500).json({ message: 'Error retrieving language preferences' });
  }
};

/**
 * Update language preferences for the current user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateLanguagePreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const { language } = req.body;
    
    // Validate language code
    if (!language || !['en', 'vi'].includes(language)) {
      return res.status(400).json({ message: 'Invalid language code. Supported: en, vi' });
    }
    
    // Update user preferences
    const user = await User.findByPk(userId);
    user.languagePreference = language;
    await user.save();
    
    return res.status(200).json({ 
      message: 'Language preference updated successfully', 
      language 
    });
  } catch (error) {
    console.error('Error updating language preferences:', error);
    return res.status(500).json({ message: 'Error updating language preferences' });
  }
};

/**
 * Get available languages
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAvailableLanguages = async (req, res) => {
  try {
    // List of available languages in the system
    const languages = [
      { code: 'en', name: 'English', flag: '🇬🇧' },
      { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' }
    ];
    
    return res.status(200).json({ languages });
  } catch (error) {
    console.error('Error getting available languages:', error);
    return res.status(500).json({ message: 'Error retrieving available languages' });
  }
};

module.exports = {
  getLanguagePreferences,
  updateLanguagePreferences,
  getAvailableLanguages
};
```

✅ Language route file found: language.js

```javascript
/**
 * Language Settings Routes
 * Routes for managing language preferences and internationalization
 */

const express = require('express');
const router = express.Router();
const languageController = require('../controllers/languageController');
const { authenticate } = require('../middlewares/authMiddleware');

/**
 * @route GET /api/language/preferences
 * @desc Get user language preferences
 * @access Private
 */
router.get('/preferences', authenticate, languageController.getLanguagePreferences);

/**
 * @route PUT /api/language/preferences
 * @desc Update user language preferences
 * @access Private
 */
router.put('/preferences', authenticate, languageController.updateLanguagePreferences);

/**
 * @route GET /api/language/available
 * @desc Get available languages
 * @access Public
 */
router.get('/available', languageController.getAvailableLanguages);

module.exports = router;
```

✅ User.js model found

✅ User model has language preference field

```javascript
        this.languagePreference = userData.language_preference || 'en'; // Default language
            const validFields = ['full_name', 'notification_prefs', 'role', 'language_preference'];
                                  key === 'language_preference' ? 'language_preference' : key} = $${paramIndex}`);
                this.languagePreference = updatedUser.language_preference;
```

## Summary

Overall, the internationalization (i18n) implementation appears to be mostly complete with a few minor issues.

### Recommendations


Review the detailed findings above to address specific issues with the i18n implementation.
