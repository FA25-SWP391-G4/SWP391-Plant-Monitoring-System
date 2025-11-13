const { getLanguagePreferences, updateLanguagePreferences, getAvailableLanguages } = require('./languageController');
const { User } = require('../models');

// Mock the User model
jest.mock('../models', () => ({
    User: {
        findByPk: jest.fn(),
    },
}));

// Mock console.error to avoid cluttering test output
console.error = jest.fn();

describe('Language Controller', () => {
    let req, res;

    beforeEach(() => {
        req = {
            user: { id: 1 },
            body: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        jest.clearAllMocks();
    });

    describe('getLanguagePreferences', () => {
        it('should return user language preference when set', async () => {
            const mockUser = { languagePreference: 'vi' };
            User.findByPk.mockResolvedValue(mockUser);

            await getLanguagePreferences(req, res);

            expect(User.findByPk).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ language: 'vi' });
        });

        it('should return default language when no preference is set', async () => {
            const mockUser = { languagePreference: null };
            User.findByPk.mockResolvedValue(mockUser);

            await getLanguagePreferences(req, res);

            expect(User.findByPk).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ language: 'en' });
        });

        it('should handle database errors', async () => {
            User.findByPk.mockRejectedValue(new Error('Database error'));

            await getLanguagePreferences(req, res);

            expect(console.error).toHaveBeenCalledWith('Error getting language preferences:', expect.any(Error));
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Error retrieving language preferences' });
        });
    });

    describe('updateLanguagePreferences', () => {
        it('should successfully update language preference', async () => {
            const mockUser = {
                languagePreference: 'en',
                save: jest.fn().mockResolvedValue()
            };
            User.findByPk.mockResolvedValue(mockUser);
            req.body.language = 'vi';

            await updateLanguagePreferences(req, res);

            expect(User.findByPk).toHaveBeenCalledWith(1);
            expect(mockUser.languagePreference).toBe('vi');
            expect(mockUser.save).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Language preference updated successfully',
                language: 'vi'
            });
        });

        it('should reject invalid language code', async () => {
            req.body.language = 'invalid';

            await updateLanguagePreferences(req, res);

            expect(User.findByPk).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid language code. Supported: en, vi' });
        });

        it('should reject empty language code', async () => {
            req.body.language = '';

            await updateLanguagePreferences(req, res);

            expect(User.findByPk).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid language code. Supported: en, vi' });
        });

        it('should reject missing language code', async () => {
            // req.body.language is undefined

            await updateLanguagePreferences(req, res);

            expect(User.findByPk).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid language code. Supported: en, vi' });
        });

        it('should accept valid English language code', async () => {
            const mockUser = {
                languagePreference: 'vi',
                save: jest.fn().mockResolvedValue()
            };
            User.findByPk.mockResolvedValue(mockUser);
            req.body.language = 'en';

            await updateLanguagePreferences(req, res);

            expect(mockUser.languagePreference).toBe('en');
            expect(mockUser.save).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should handle database errors during update', async () => {
            User.findByPk.mockRejectedValue(new Error('Database error'));
            req.body.language = 'vi';

            await updateLanguagePreferences(req, res);

            expect(console.error).toHaveBeenCalledWith('Error updating language preferences:', expect.any(Error));
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Error updating language preferences' });
        });

        it('should handle save errors', async () => {
            const mockUser = {
                languagePreference: 'en',
                save: jest.fn().mockRejectedValue(new Error('Save error'))
            };
            User.findByPk.mockResolvedValue(mockUser);
            req.body.language = 'vi';

            await updateLanguagePreferences(req, res);

            expect(console.error).toHaveBeenCalledWith('Error updating language preferences:', expect.any(Error));
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Error updating language preferences' });
        });
    });

    describe('getAvailableLanguages', () => {
        it('should return list of available languages', async () => {
            await getAvailableLanguages(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                languages: [
                    { code: 'en', name: 'English', flag: '🇬🇧' },
                    { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' }
                ]
            });
        });

        it('should handle unexpected errors gracefully', async () => {
            // Force an error by making res.json throw
            res.json.mockImplementation(() => {
                throw new Error('Unexpected error');
            });

            await getAvailableLanguages(req, res);

            expect(console.error).toHaveBeenCalledWith('Error getting available languages:', expect.any(Error));
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });
});