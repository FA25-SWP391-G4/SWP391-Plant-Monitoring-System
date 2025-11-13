const { initiateGoogleAuth, googleAuthCallback, revokeGoogleAccess } = require('./googleAuthController');
const { google } = require('googleapis');
const crypto = require('crypto');
const User = require('../models/User');
const { storeOAuthState, verifyOAuthState } = require('../services/oauthStateStore');
const { login } = require('./authController');

// Mock dependencies
jest.mock('googleapis');
jest.mock('crypto');
jest.mock('../models/User');
jest.mock('../services/oauthStateStore');
jest.mock('./authController');

describe('Google Auth Controller', () => {
    let req, res, mockOAuth2Client;

    beforeEach(() => {
        req = {
            sessionID: 'test-session-id',
            session: {
                save: jest.fn()
            },
            query: {},
            user: { user_id: 'test-user-id' },
            body: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            redirect: jest.fn(),
            json: jest.fn()
        };

        mockOAuth2Client = {
            generateAuthUrl: jest.fn(),
            getToken: jest.fn(),
            setCredentials: jest.fn(),
            revokeToken: jest.fn()
        };

        google.auth = {
            OAuth2: jest.fn().mockReturnValue(mockOAuth2Client)
        };
        google.people = jest.fn().mockReturnValue({
            people: {
                get: jest.fn()
            }
        });

        // Clear all mocks
        jest.clearAllMocks();
    });

    describe('initiateGoogleAuth', () => {
        beforeEach(() => {
            crypto.randomBytes = jest.fn().mockReturnValue({
                toString: jest.fn().mockReturnValue('mock-state-value')
            });
            mockOAuth2Client.generateAuthUrl.mockReturnValue('https://accounts.google.com/oauth/authorize?test=true');
            storeOAuthState.mockResolvedValue(true);
        });

        it('should initiate Google auth successfully', async () => {
            req.session.save.mockImplementation((callback) => callback(null));

            await initiateGoogleAuth(req, res);

            expect(crypto.randomBytes).toHaveBeenCalledWith(32);
            expect(req.session.oauthState).toBe('mock-state-value');
            expect(storeOAuthState).toHaveBeenCalledWith('mock-state-value', 'test-session-id');
            expect(mockOAuth2Client.generateAuthUrl).toHaveBeenCalledWith({
                access_type: 'offline',
                scope: [
                    'https://www.googleapis.com/auth/userinfo.email',
                    'https://www.googleapis.com/auth/userinfo.profile'
                ],
                include_granted_scopes: true,
                state: 'mock-state-value',
                prompt: 'consent'
            });
            expect(res.redirect).toHaveBeenCalledWith('https://accounts.google.com/oauth/authorize?test=true');
        });

        it('should handle missing session', async () => {
            req.session = null;

            await initiateGoogleAuth(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.redirect).toHaveBeenCalledWith('http://localhost:3000/login?error=session_not_configured');
        });

        it('should handle session save error', async () => {
            const saveError = new Error('Session save failed');
            req.session.save.mockImplementation((callback) => callback(saveError));

            await initiateGoogleAuth(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.redirect).toHaveBeenCalledWith('http://localhost:3000/login?error=google_auth_initiation_failed');
        });

        it('should store redirect URL from query parameter', async () => {
            req.query.redirect = '/custom-redirect';
            req.session.save.mockImplementation((callback) => callback(null));

            await initiateGoogleAuth(req, res);

            expect(req.session.redirectAfterLogin).toBe('/custom-redirect');
        });

        it('should handle storeOAuthState error', async () => {
            req.session.save.mockImplementation((callback) => callback(null));
            storeOAuthState.mockRejectedValue(new Error('Database error'));

            await initiateGoogleAuth(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.redirect).toHaveBeenCalledWith('http://localhost:3000/login?error=google_auth_initiation_failed');
        });
    });

    describe('googleAuthCallback', () => {
        const mockTokens = {
            access_token: 'mock-access-token',
            refresh_token: 'mock-refresh-token',
            id_token: 'mock-id-token',
            expires_in: 3600
        };

        const mockProfileData = {
            data: {
                emailAddresses: [{ value: 'test@example.com' }],
                names: [{
                    givenName: 'John',
                    familyName: 'Doe',
                    metadata: { source: { id: 'google-user-id' } }
                }],
                photos: [{ url: 'https://example.com/photo.jpg' }]
            }
        };

        beforeEach(() => {
            req.query = {
                code: 'mock-auth-code',
                state: 'mock-state-value'
            };
            req.session.oauthState = 'mock-state-value';
            
            mockOAuth2Client.getToken.mockResolvedValue({ tokens: mockTokens });
            verifyOAuthState.mockResolvedValue(true);
            
            const mockPeopleApi = {
                people: {
                    get: jest.fn().mockResolvedValue(mockProfileData)
                }
            };
            google.people.mockReturnValue(mockPeopleApi);
        });

        it('should handle OAuth error from Google', async () => {
            req.query.error = 'access_denied';

            await googleAuthCallback(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.redirect).toHaveBeenCalledWith('http://localhost:3000/login?error=oauth_access_denied');
        });

        it('should handle missing authorization code', async () => {
            req.query.code = undefined;

            await googleAuthCallback(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.redirect).toHaveBeenCalledWith('http://localhost:3000/login?error=missing_code');
        });

        it('should handle missing state parameter', async () => {
            req.query.state = undefined;

            await googleAuthCallback(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.redirect).toHaveBeenCalledWith('http://localhost:3000/login?error=missing_state');
        });

        it('should handle invalid state parameter', async () => {
            req.session.oauthState = 'different-state';
            verifyOAuthState.mockResolvedValue(false);

            await googleAuthCallback(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.redirect).toHaveBeenCalledWith('http://localhost:3000/login?error=invalid_state');
        });

        it('should handle token exchange failure', async () => {
            mockOAuth2Client.getToken.mockRejectedValue(new Error('Token exchange failed'));

            await googleAuthCallback(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.redirect).toHaveBeenCalledWith('http://localhost:3000/login?error=token_exchange_failed');
        });

        it('should handle profile fetch failure', async () => {
            const mockPeopleApi = {
                people: {
                    get: jest.fn().mockRejectedValue(new Error('Profile fetch failed'))
                }
            };
            google.people.mockReturnValue(mockPeopleApi);

            await googleAuthCallback(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.redirect).toHaveBeenCalledWith('http://localhost:3000/login?error=profile_fetch_failed');
        });

        it('should handle incomplete profile data', async () => {
            const incompleteProfileData = {
                data: {
                    emailAddresses: [],
                    names: [{ givenName: 'John' }]
                }
            };
            const mockPeopleApi = {
                people: {
                    get: jest.fn().mockResolvedValue(incompleteProfileData)
                }
            };
            google.people.mockReturnValue(mockPeopleApi);

            await googleAuthCallback(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.redirect).toHaveBeenCalledWith('http://localhost:3000/login?error=profile_incomplete');
        });

        it('should redirect new user to registration', async () => {
            User.findByEmail.mockResolvedValue(null);

            await googleAuthCallback(req, res);

            const expectedData = {
                email: 'test@example.com',
                google_id: 'google-user-id',
                given_name: 'John',
                family_name: 'Doe',
                profile_picture: 'https://example.com/photo.jpg',
                google_refresh_token: 'mock-refresh-token'
            };
            const encodedData = Buffer.from(JSON.stringify(expectedData)).toString('base64');
            const expectedUrl = `http://localhost:3000/register?source=google&data=${encodedData}`;

            expect(User.findByEmail).toHaveBeenCalledWith('test@example.com');
            expect(res.redirect).toHaveBeenCalledWith(expectedUrl);
        });

        it('should login existing user', async () => {
            const existingUser = {
                user_id: 'existing-user-id',
                email: 'test@example.com',
                google_id: 'google-user-id'
            };
            User.findByEmail.mockResolvedValue(existingUser);
            login.mockImplementation((req, res) => res.status(200).json({ success: true }));

            await googleAuthCallback(req, res);

            expect(User.findByEmail).toHaveBeenCalledWith('test@example.com');
            expect(req.body).toEqual({
                email: 'test@example.com',
                googleId: 'google-user-id',
                refreshToken: 'mock-refresh-token',
                loginMethod: 'google'
            });
            expect(login).toHaveBeenCalledWith(req, res);
        });

        it('should handle user lookup failure', async () => {
            User.findByEmail.mockRejectedValue(new Error('Database error'));

            await googleAuthCallback(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.redirect).toHaveBeenCalledWith('http://localhost:3000/login?error=user_lookup_failed');
        });

        it('should handle session state validation when db state is valid', async () => {
            req.session.oauthState = 'different-state';
            verifyOAuthState.mockResolvedValue(true);
            User.findByEmail.mockResolvedValue(null);

            await googleAuthCallback(req, res);

            expect(verifyOAuthState).toHaveBeenCalledWith('mock-state-value');
            expect(res.redirect).toHaveBeenCalled();
        });

        it('should handle general errors', async () => {
            mockOAuth2Client.getToken.mockImplementation(() => {
                throw new Error('Unexpected error');
            });

            await googleAuthCallback(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('google_auth_failed'));
        });
    });

    describe('revokeGoogleAccess', () => {
        it('should revoke Google access successfully', async () => {
            const mockUser = {
                google_refresh_token: 'mock-refresh-token',
                update: jest.fn().mockResolvedValue(true)
            };
            User.findById.mockResolvedValue(mockUser);
            mockOAuth2Client.revokeToken.mockResolvedValue(true);

            await revokeGoogleAccess(req, res);

            expect(User.findById).toHaveBeenCalledWith('test-user-id');
            expect(mockOAuth2Client.setCredentials).toHaveBeenCalledWith({
                refresh_token: 'mock-refresh-token'
            });
            expect(mockOAuth2Client.revokeToken).toHaveBeenCalledWith('mock-refresh-token');
            expect(mockUser.update).toHaveBeenCalledWith({ google_refresh_token: null });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Google access revoked successfully'
            });
        });

        it('should handle user not found', async () => {
            User.findById.mockResolvedValue(null);

            await revokeGoogleAccess(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'No Google account connected or token not found'
            });
        });

        it('should handle user without Google refresh token', async () => {
            const mockUser = {
                google_refresh_token: null
            };
            User.findById.mockResolvedValue(mockUser);

            await revokeGoogleAccess(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'No Google account connected or token not found'
            });
        });

        it('should handle revoke token failure', async () => {
            const mockUser = {
                google_refresh_token: 'mock-refresh-token',
                update: jest.fn()
            };
            User.findById.mockResolvedValue(mockUser);
            mockOAuth2Client.revokeToken.mockRejectedValue(new Error('Revoke failed'));

            await revokeGoogleAccess(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Failed to revoke Google access'
            });
        });

        it('should handle database update failure', async () => {
            const mockUser = {
                google_refresh_token: 'mock-refresh-token',
                update: jest.fn().mockRejectedValue(new Error('Update failed'))
            };
            User.findById.mockResolvedValue(mockUser);
            mockOAuth2Client.revokeToken.mockResolvedValue(true);

            await revokeGoogleAccess(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Failed to revoke Google access'
            });
        });
    });
});