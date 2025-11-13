/**
 * ============================================================================
 * SELENIUM WEBDRIVER CONFIGURATION
 * ============================================================================
 */

const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const firefox = require('selenium-webdriver/firefox');
const edge = require('selenium-webdriver/edge');

/**
 * Browser configuration
 */
const browserConfig = {
  // Chrome options
  chrome: () => {
    const options = new chrome.Options();
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-gpu');
    
    // Run headless in CI environment
    if (process.env.CI) {
      options.addArguments('--headless');
    }
    
    // Set window size
    options.addArguments('--window-size=1920,1080');
    
    return options;
  },

  // Firefox options
  firefox: () => {
    const options = new firefox.Options();
    
    if (process.env.CI) {
      options.addArguments('--headless');
    }
    
    options.addArguments('--width=1920');
    options.addArguments('--height=1080');
    
    return options;
  },

  // Edge options
  edge: () => {
    const options = new edge.Options();
    
    if (process.env.CI) {
      options.addArguments('--headless');
    }
    
    return options;
  }
};

/**
 * Create WebDriver instance
 */
async function createDriver(browser = 'chrome') {
  const builder = new Builder().forBrowser(browser);
  
  switch (browser) {
    case 'chrome':
      builder.setChromeOptions(browserConfig.chrome());
      break;
    case 'firefox':
      builder.setFirefoxOptions(browserConfig.firefox());
      break;
    case 'edge':
      builder.setEdgeOptions(browserConfig.edge());
      break;
  }
  
  return await builder.build();
}

/**
 * Test URLs
 */
const testUrls = {
  base: process.env.TEST_BASE_URL || 'http://localhost:3000',
  api: process.env.TEST_API_URL || 'http://localhost:5000',
  
  // Page URLs
  login: '/login',
  register: '/register',
  dashboard: '/dashboard',
  plants: '/plants',
  zones: '/zones',
  profile: '/profile',
  premium: '/premium'
};

/**
 * Test timeouts
 */
const timeouts = {
  implicit: 10000,
  pageLoad: 30000,
  script: 30000,
  element: 10000
};

module.exports = {
  createDriver,
  browserConfig,
  testUrls,
  timeouts
};
