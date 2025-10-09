/**
 * Language Controller Mock
 */

// Get all available languages
const getAvailableLanguages = async (req, res) => {
    try {
        // Mock data for available languages
        const languages = [
            { code: 'en', name: 'English' },
            { code: 'vi', name: 'Vietnamese' },
            { code: 'fr', name: 'French' },
            { code: 'de', name: 'German' },
            { code: 'es', name: 'Spanish' },
            { code: 'ja', name: 'Japanese' }
        ];
        
        return res.json(languages);
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching languages', error: error.message });
    }
};

// Set user language preference
const setUserLanguagePreference = async (req, res) => {
    try {
        const { languageCode } = req.body;
        const userId = req.user.id;
        
        // Validate language code
        const validLanguages = ['en', 'vi', 'fr', 'de', 'es', 'ja'];
        if (!validLanguages.includes(languageCode)) {
            return res.status(400).json({ message: 'Invalid language code' });
        }
        
        // In real implementation, this would update the user's language preference in DB
        // Mock successful update
        return res.json({ 
            success: true, 
            message: `Language preference updated to ${languageCode}`,
            languageCode
        });
    } catch (error) {
        return res.status(500).json({ message: 'Error updating language preference', error: error.message });
    }
};

// Get user's current language preference
const getUserLanguagePreference = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // In real implementation, this would fetch from user profile in DB
        // Mock response with a default language
        const preference = {
            languageCode: 'en',
            languageName: 'English'
        };
        
        return res.json(preference);
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching language preference', error: error.message });
    }
};

// Translate text to target language
const translateText = async (req, res) => {
    try {
        const { text, targetLanguage } = req.body;
        
        // Basic validation
        if (!text || !text.trim()) {
            return res.status(400).json({ message: 'Text is required' });
        }
        
        // Validate target language
        const validLanguages = ['en', 'vi', 'fr', 'de', 'es', 'ja'];
        if (!validLanguages.includes(targetLanguage)) {
            return res.status(400).json({ message: 'Invalid target language' });
        }
        
        // Mock translation - in real app would call a translation API
        let translatedText;
        
        switch(targetLanguage) {
            case 'vi':
                translatedText = text === 'Hello' ? 'Xin chào' : `${text} (translated to Vietnamese)`;
                break;
            case 'fr':
                translatedText = text === 'Hello' ? 'Bonjour' : `${text} (translated to French)`;
                break;
            case 'de':
                translatedText = text === 'Hello' ? 'Hallo' : `${text} (translated to German)`;
                break;
            case 'es':
                translatedText = text === 'Hello' ? 'Hola' : `${text} (translated to Spanish)`;
                break;
            case 'ja':
                translatedText = text === 'Hello' ? 'こんにちは' : `${text} (translated to Japanese)`;
                break;
            default:
                translatedText = text; // Default to original text for English
        }
        
        return res.json({
            original: text,
            translated: translatedText,
            targetLanguage
        });
    } catch (error) {
        return res.status(500).json({ message: 'Error translating text', error: error.message });
    }
};

module.exports = {
    getAvailableLanguages,
    setUserLanguagePreference,
    getUserLanguagePreference,
    translateText
};