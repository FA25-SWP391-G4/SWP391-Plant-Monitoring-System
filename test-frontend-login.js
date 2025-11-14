const puppeteer = require('puppeteer');

async function testFrontendLogin() {
  console.log('🔍 Testing Frontend Login Flow...\n');
  
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: false, // Set to true for headless mode
      defaultViewport: null,
      args: ['--start-maximized']
    });
    
    const page = await browser.newPage();
    
    // Navigate to login page
    console.log('📱 Navigating to login page...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
    
    // Fill login form
    console.log('✍️ Filling login form...');
    await page.type('input[type="email"]', 'test@example.com');
    await page.type('input[type="password"]', 'password123');
    
    // Submit form
    console.log('🚀 Submitting login...');
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    
    // Check if redirected to dashboard
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);
    
    // Check cookies
    const cookies = await page.cookies();
    const tokenCookie = cookies.find(c => c.name === 'token');
    const userCookie = cookies.find(c => c.name === 'user');
    
    console.log('🍪 Cookies:');
    console.log(`   Token: ${tokenCookie ? 'Found' : 'Not found'}`);
    console.log(`   User: ${userCookie ? 'Found' : 'Not found'}`);
    
    if (tokenCookie && userCookie) {
      console.log('✅ Login successful - cookies set');
      
      // Test AI pages
      const aiPages = [
        '/ai/chat',
        '/ai/image-analysis', 
        '/ai/predictions'
      ];
      
      for (const aiPage of aiPages) {
        console.log(`\n🤖 Testing ${aiPage}...`);
        try {
          await page.goto(`http://localhost:3000${aiPage}`, { waitUntil: 'networkidle2' });
          
          // Wait for page to load
          await page.waitForTimeout(2000);
          
          // Check if page loaded successfully
          const title = await page.title();
          const hasError = await page.$('.error') !== null;
          
          if (!hasError) {
            console.log(`✅ ${aiPage}: Loaded successfully`);
            console.log(`   Title: ${title}`);
          } else {
            console.log(`❌ ${aiPage}: Error found on page`);
          }
          
        } catch (error) {
          console.log(`❌ ${aiPage}: Failed to load - ${error.message}`);
        }
      }
      
    } else {
      console.log('❌ Login failed - cookies not set');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Check if puppeteer is available
try {
  testFrontendLogin();
} catch (error) {
  console.log('⚠️  Puppeteer not available. Manual testing required.');
  console.log('\n📋 Manual Testing Steps:');
  console.log('1. Open http://localhost:3000/login');
  console.log('2. Login with: test@example.com / password123');
  console.log('3. Try accessing:');
  console.log('   - http://localhost:3000/ai/chat');
  console.log('   - http://localhost:3000/ai/image-analysis');
  console.log('   - http://localhost:3000/ai/predictions');
  console.log('\n🔍 Check browser console for any errors');
}