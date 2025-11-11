/**
 * LANGUAGE CONTROLLER TESTS
 * =========================
 * 
 * Unit tests for language controller
 * Tests internationalization and multi-language support
 */

const languageController = require('../../../controllers/languageController');
const { pool } = require('../../../config/db');
const fs = require('fs');
const path = require('path');

// Mock dependencies
jest.mock('../../../config/db');
jest.mock('fs');
jest.mock('path');

describe('Language Controller', () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
        mockReq = {
            body: {},
            params: {},
            query: {},
            user: {
                id: 'user-123',
                email: 'user@test.com'
            }
        };
        
        mockRes = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis()
        };
        
        mockNext = jest.fn();

        // Reset mocks
        jest.clearAllMocks();
    });

    describe('getAvailableLanguages', () => {
        it('should get list of available languages', async () => {
            const mockLanguages = {
                availableLanguages: ['en', 'es', 'fr', 'zh'],
                defaultLanguage: 'en',
                supportedLanguages: {
                    en: { name: 'English', flag: 'en.svg' },
                    es: { name: 'Español', flag: 'es.svg' },
                    fr: { name: 'Français', flag: 'fr.svg' },
                    zh: { name: '中文', flag: 'zh.svg' }
                }
            };

            // Mock file system to check available translation files
            fs.readdirSync.mockReturnValue(['en.json', 'es.json', 'fr.json', 'zh.json']);
            fs.existsSync.mockReturnValue(true);

            await languageController.getAvailableLanguages(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({
                languages: mockLanguages
            });
        });

        it('should handle file system errors gracefully', async () => {
            fs.readdirSync.mockImplementation(() => {
                throw new Error('Directory not found');
            });

            await languageController.getAvailableLanguages(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Failed to load available languages'
            });
        });
    });

    describe('getTranslations', () => {
        it('should get translations for specific language', async () => {
            mockReq.params.language = 'es';

            const mockTranslations = {
                common: {
                    welcome: 'Bienvenido',
                    goodbye: 'Adiós',
                    save: 'Guardar',
                    cancel: 'Cancelar'
                },
                navigation: {
                    dashboard: 'Panel de Control',
                    plants: 'Plantas',
                    devices: 'Dispositivos'
                },
                plants: {
                    addPlant: 'Agregar Planta',
                    plantName: 'Nombre de la Planta',
                    plantType: 'Tipo de Planta'
                }
            };

            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(JSON.stringify(mockTranslations));

            await languageController.getTranslations(mockReq, mockRes);

            expect(fs.readFileSync).toHaveBeenCalledWith(
                expect.stringContaining('es.json'),
                'utf8'
            );
            expect(mockRes.json).toHaveBeenCalledWith({
                language: 'es',
                translations: mockTranslations
            });
        });

        it('should handle non-existent language', async () => {
            mockReq.params.language = 'invalid';

            fs.existsSync.mockReturnValue(false);

            await languageController.getTranslations(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Language not found'
            });
        });

        it('should validate language code format', async () => {
            mockReq.params.language = 'invalid-lang-code';

            await languageController.getTranslations(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Invalid language code format'
            });
        });

        it('should handle malformed JSON files', async () => {
            mockReq.params.language = 'en';

            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue('invalid json content');

            await languageController.getTranslations(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Failed to parse language file'
            });
        });
    });

    describe('getUserLanguagePreference', () => {
        it('should get user language preference', async () => {
            mockReq.params.userId = 'user-123';

            pool.query.mockResolvedValue({
                rows: [{ language: 'es' }]
            });

            await languageController.getUserLanguagePreference(mockReq, mockRes);

            expect(pool.query).toHaveBeenCalledWith(
                'SELECT language FROM user_preferences WHERE user_id = $1',
                ['user-123']
            );
            expect(mockRes.json).toHaveBeenCalledWith({
                language: 'es'
            });
        });

        it('should return default language if no preference set', async () => {
            mockReq.params.userId = 'user-123';

            pool.query.mockResolvedValue({
                rows: []
            });

            await languageController.getUserLanguagePreference(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({
                language: 'en' // Default language
            });
        });

        it('should handle database errors', async () => {
            mockReq.params.userId = 'user-123';

            pool.query.mockRejectedValue(new Error('Database connection failed'));

            await languageController.getUserLanguagePreference(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Failed to get user language preference'
            });
        });
    });

    describe('setUserLanguagePreference', () => {
        it('should set user language preference', async () => {
            mockReq.params.userId = 'user-123';
            mockReq.body = { language: 'fr' };

            // Mock checking if language exists
            fs.existsSync.mockReturnValue(true);

            // Mock database upsert operation
            pool.query.mockResolvedValue({ rowCount: 1 });

            await languageController.setUserLanguagePreference(mockReq, mockRes);

            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO user_preferences'),
                ['user-123', 'fr']
            );
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Language preference updated successfully',
                language: 'fr'
            });
        });

        it('should validate language exists', async () => {
            mockReq.params.userId = 'user-123';
            mockReq.body = { language: 'invalid' };

            fs.existsSync.mockReturnValue(false);

            await languageController.setUserLanguagePreference(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Language not supported'
            });
        });

        it('should validate language code format', async () => {
            mockReq.params.userId = 'user-123';
            mockReq.body = { language: 'invalid-format' };

            await languageController.setUserLanguagePreference(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Invalid language code format'
            });
        });

        it('should require language in request body', async () => {
            mockReq.params.userId = 'user-123';
            mockReq.body = {}; // Missing language

            await languageController.setUserLanguagePreference(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Language is required'
            });
        });

        it('should handle database errors during update', async () => {
            mockReq.params.userId = 'user-123';
            mockReq.body = { language: 'es' };

            fs.existsSync.mockReturnValue(true);
            pool.query.mockRejectedValue(new Error('Database update failed'));

            await languageController.setUserLanguagePreference(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Failed to update language preference'
            });
        });
    });

    describe('getTranslationKeys', () => {
        it('should get all translation keys for a language', async () => {
            mockReq.params.language = 'en';

            const mockTranslations = {
                common: {
                    welcome: 'Welcome',
                    save: 'Save'
                },
                navigation: {
                    dashboard: 'Dashboard',
                    plants: 'Plants'
                }
            };

            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(JSON.stringify(mockTranslations));

            await languageController.getTranslationKeys(mockReq, mockRes);

            const expectedKeys = [
                'common.welcome',
                'common.save',
                'navigation.dashboard',
                'navigation.plants'
            ];

            expect(mockRes.json).toHaveBeenCalledWith({
                language: 'en',
                keys: expectedKeys
            });
        });

        it('should handle nested translation structures', async () => {
            mockReq.params.language = 'en';

            const mockTranslations = {
                forms: {
                    validation: {
                        required: 'This field is required',
                        email: 'Invalid email format'
                    },
                    buttons: {
                        submit: 'Submit',
                        reset: 'Reset'
                    }
                }
            };

            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(JSON.stringify(mockTranslations));

            await languageController.getTranslationKeys(mockReq, mockRes);

            const expectedKeys = [
                'forms.validation.required',
                'forms.validation.email',
                'forms.buttons.submit',
                'forms.buttons.reset'
            ];

            expect(mockRes.json).toHaveBeenCalledWith({
                language: 'en',
                keys: expectedKeys
            });
        });
    });

    describe('validateTranslationCompleteness', () => {
        it('should validate translation completeness across languages', async () => {
            const mockEnTranslations = {
                common: { welcome: 'Welcome', save: 'Save' },
                navigation: { dashboard: 'Dashboard' }
            };

            const mockEsTranslations = {
                common: { welcome: 'Bienvenido' }, // Missing 'save'
                navigation: { dashboard: 'Panel de Control' }
            };

            fs.readdirSync.mockReturnValue(['en.json', 'es.json']);
            fs.readFileSync
                .mockReturnValueOnce(JSON.stringify(mockEnTranslations))
                .mockReturnValueOnce(JSON.stringify(mockEsTranslations));

            await languageController.validateTranslationCompleteness(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({
                validation: {
                    en: { completion: 100, missing: [] },
                    es: { 
                        completion: expect.any(Number),
                        missing: ['common.save']
                    }
                },
                summary: {
                    totalKeys: 3,
                    languages: 2
                }
            });
        });

        it('should handle validation errors', async () => {
            fs.readdirSync.mockImplementation(() => {
                throw new Error('Cannot read directory');
            });

            await languageController.validateTranslationCompleteness(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Failed to validate translations'
            });
        });
    });

    describe('exportTranslations', () => {
        it('should export translations in specified format', async () => {
            mockReq.query = { 
                language: 'en',
                format: 'json'
            };

            const mockTranslations = {
                common: { welcome: 'Welcome' },
                navigation: { dashboard: 'Dashboard' }
            };

            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(JSON.stringify(mockTranslations));

            await languageController.exportTranslations(mockReq, mockRes);

            expect(mockRes.set).toHaveBeenCalledWith({
                'Content-Type': 'application/json',
                'Content-Disposition': 'attachment; filename="translations_en.json"'
            });
            expect(mockRes.send).toHaveBeenCalledWith(JSON.stringify(mockTranslations, null, 2));
        });

        it('should export translations as CSV', async () => {
            mockReq.query = { 
                language: 'en',
                format: 'csv'
            };

            const mockTranslations = {
                common: { welcome: 'Welcome', save: 'Save' }
            };

            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(JSON.stringify(mockTranslations));

            await languageController.exportTranslations(mockReq, mockRes);

            expect(mockRes.set).toHaveBeenCalledWith({
                'Content-Type': 'text/csv',
                'Content-Disposition': 'attachment; filename="translations_en.csv"'
            });
            expect(mockRes.send).toHaveBeenCalledWith(
                expect.stringContaining('Key,Translation\ncommon.welcome,Welcome\ncommon.save,Save')
            );
        });

        it('should validate export format', async () => {
            mockReq.query = { 
                language: 'en',
                format: 'invalid'
            };

            await languageController.exportTranslations(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Invalid export format. Supported formats: json, csv'
            });
        });
    });

    describe('importTranslations', () => {
        it('should import translations from uploaded file', async () => {
            mockReq.params.language = 'es';
            mockReq.file = {
                buffer: Buffer.from(JSON.stringify({
                    common: { welcome: 'Bienvenido', save: 'Guardar' }
                })),
                mimetype: 'application/json'
            };

            fs.writeFileSync.mockImplementation(() => {});
            fs.existsSync.mockReturnValue(true);

            await languageController.importTranslations(mockReq, mockRes);

            expect(fs.writeFileSync).toHaveBeenCalledWith(
                expect.stringContaining('es.json'),
                expect.any(String),
                'utf8'
            );
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Translations imported successfully',
                language: 'es',
                keysImported: 2
            });
        });

        it('should validate file format', async () => {
            mockReq.params.language = 'es';
            mockReq.file = {
                buffer: Buffer.from('invalid json'),
                mimetype: 'application/json'
            };

            await languageController.importTranslations(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Invalid JSON format'
            });
        });

        it('should require file upload', async () => {
            mockReq.params.language = 'es';
            // No file uploaded

            await languageController.importTranslations(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Translation file is required'
            });
        });

        it('should handle file system errors during import', async () => {
            mockReq.params.language = 'es';
            mockReq.file = {
                buffer: Buffer.from(JSON.stringify({ common: { test: 'prueba' } })),
                mimetype: 'application/json'
            };

            fs.writeFileSync.mockImplementation(() => {
                throw new Error('Write failed');
            });

            await languageController.importTranslations(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Failed to save translation file'
            });
        });
    });

    // Utility function tests
    describe('Utility Functions', () => {
        describe('flattenTranslationKeys', () => {
            it('should flatten nested translation objects', () => {
                const nestedObj = {
                    common: {
                        welcome: 'Welcome',
                        buttons: {
                            save: 'Save',
                            cancel: 'Cancel'
                        }
                    },
                    forms: {
                        validation: {
                            required: 'Required'
                        }
                    }
                };

                const result = languageController.flattenTranslationKeys(nestedObj);

                expect(result).toEqual([
                    'common.welcome',
                    'common.buttons.save',
                    'common.buttons.cancel',
                    'forms.validation.required'
                ]);
            });
        });

        describe('convertToCSV', () => {
            it('should convert translations to CSV format', () => {
                const translations = {
                    'common.welcome': 'Welcome',
                    'common.save': 'Save',
                    'navigation.dashboard': 'Dashboard'
                };

                const result = languageController.convertToCSV(translations);

                expect(result).toBe(
                    'Key,Translation\n' +
                    'common.welcome,Welcome\n' +
                    'common.save,Save\n' +
                    'navigation.dashboard,Dashboard'
                );
            });

            it('should handle special characters in CSV', () => {
                const translations = {
                    'message.comma': 'Hello, World',
                    'message.quote': 'Say "Hello"',
                    'message.newline': 'Line 1\nLine 2'
                };

                const result = languageController.convertToCSV(translations);

                expect(result).toBe(
                    'Key,Translation\n' +
                    'message.comma,"Hello, World"\n' +
                    'message.quote,"Say ""Hello"""\n' +
                    'message.newline,"Line 1\nLine 2"'
                );
            });
        });
    });
});