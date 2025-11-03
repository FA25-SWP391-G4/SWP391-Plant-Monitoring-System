const axios = require('axios');

const API_BASE = 'http://localhost:3010';

async function getGoogleOAuthUrl() {
    console.log('🎯 Getting Google OAuth URL for testing...\n');
    
    try {
        // Get the Google OAuth URL
        const response = await axios.get(`${API_BASE}/auth/google/login`, {
            maxRedirects: 0, // Don't follow redirects
            validateStatus: function (status) {
                return status < 400; // Accept redirects
            }
        });
        
        if (response.status === 302 && response.headers.location) {
            const oauthUrl = response.headers.location;
            console.log('✅ Google OAuth URL Generated!');
            console.log('\n📋 COPY THIS URL AND PASTE IN BROWSER:');
            console.log('='.repeat(80));
            console.log(oauthUrl);
            console.log('='.repeat(80));
            console.log('\n🔍 URL Analysis:');
            console.log('  - Points to Google:', oauthUrl.includes('accounts.google.com'));
            console.log('  - Has client_id:', oauthUrl.includes('client_id'));
            console.log('  - Has redirect_uri:', oauthUrl.includes('redirect_uri'));
            console.log('  - Redirect URI points to backend (3010):', oauthUrl.includes('localhost%3A3010'));
            console.log('\n🚀 After clicking the URL:');
            console.log('  1. Google will ask you to sign in and authorize');
            console.log('  2. Google will redirect to backend (localhost:3010)');
            console.log('  3. Backend will process and redirect to frontend callback');
            console.log('  4. Frontend callback page should log messages in browser console');
            console.log('\n👀 Watch for logs in:');
            console.log('  - Backend terminal (this window)');
            console.log('  - Browser developer console (F12)');
        } else {
            console.log('❌ Unexpected response:', response.status);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Run the function
getGoogleOAuthUrl();