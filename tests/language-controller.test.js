/**
 * Language Controller Tests
 */
const { 
    getAvailableLanguages, 
    setUserLanguagePreference,
    getUserLanguagePreference,
    translateText
} = require('../__mocks__/languageController');

describe('Language Controller Tests', () => {
    let mockRequest;
    let mockResponse;
    
    beforeEach(() => {
        // Mock request and response objects
        mockRequest = {
            params: {},
            body: {},
            user: {
                id: 'user123',
                email: 'test@example.com'
            }
        };
        
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });
    
    describe('UC17: Language Management', () => {
        it('should get available languages', async () => {
            // Call the controller
            await getAvailableLanguages(mockRequest, mockResponse);
            
            // Check if the response contains languages
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({ code: 'en', name: 'English' }),
                    expect.objectContaining({ code: 'vi', name: 'Vietnamese' })
                ])
            );
        });
        
        it('should set user language preference', async () => {
            // Setup request body
            mockRequest.body = { languageCode: 'vi' };
            
            // Call the controller
            await setUserLanguagePreference(mockRequest, mockResponse);
            
            // Check response
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: expect.any(String)
                })
            );
        });
        
        it('should get user language preference', async () => {
            // Call the controller
            await getUserLanguagePreference(mockRequest, mockResponse);
            
            // Check response
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    languageCode: expect.any(String),
                    languageName: expect.any(String)
                })
            );
        });
        
        it('should reject invalid language code', async () => {
            // Setup request with invalid language
            mockRequest.body = { languageCode: 'invalid' };
            
            // Call the controller
            await setUserLanguagePreference(mockRequest, mockResponse);
            
            // Check error response
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining('Invalid language code')
                })
            );
        });
    });
    
    describe('UC18: Text Translation', () => {
        it('should translate text to target language', async () => {
            // Setup request
            mockRequest.body = { 
                text: 'Hello',
                targetLanguage: 'vi'
            };
            
            // Call the controller
            await translateText(mockRequest, mockResponse);
            
            // Check response
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    original: 'Hello',
                    translated: expect.any(String),
                    targetLanguage: 'vi'
                })
            );
        });
        
        it('should handle translation errors', async () => {
            // Setup request with problematic input
            mockRequest.body = { 
                text: '',  // Empty text
                targetLanguage: 'xx'  // Invalid language
            };
            
            // Call the controller
            await translateText(mockRequest, mockResponse);
            
            // Check error response
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.any(String)
                })
            );
        });
    });
});