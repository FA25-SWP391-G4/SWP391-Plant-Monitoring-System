require('dotenv').config({ path: './ai_service/.env' });
const axios = require('axios');

async function quickTest() {
    console.log('Testing OpenRouter API connection...');
    
    const apiKey = process.env.OPENROUTER_API_KEY;
    console.log('API Key configured:', !!apiKey);
    console.log('API Key length:', apiKey?.length);
    
    if (!apiKey || apiKey === 'YOUR_ACTUAL_API_KEY_HERE') {
        console.log('❌ API key not configured properly');
        return;
    }
    
    try {
        const response = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                model: 'mistralai/mistral-7b-instruct',
                messages: [
                    { role: 'user', content: 'Hello, can you help with plant care?' }
                ],
                max_tokens: 50
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            }
        );
        
        console.log('✅ API connection successful!');
        console.log('Response:', response.data.choices[0].message.content);
        
    } catch (error) {
        console.log('❌ API connection failed:');
        console.log('Status:', error.response?.status);
        console.log('Message:', error.response?.data?.error?.message || error.message);
    }
}

quickTest();