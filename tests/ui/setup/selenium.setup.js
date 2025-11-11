const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const firefox = require('selenium-webdriver/firefox');

class SeleniumSetup {
  constructor() {
    this.driver = null;
    this.defaultTimeout = global.SELENIUM_TIMEOUT || 10000;
    this.appUrl = global.APP_URL || 'http://localhost:3000';
  }

  /**
   * Initialize WebDriver with specified browser
   * @param {string} browserName - 'chrome', 'firefox', or 'edge'
   * @param {Object} options - Browser-specific options
   */
  async initializeDriver(browserName = 'chrome', options = {}) {
    try {
      let builder = new Builder();

      switch (browserName.toLowerCase()) {
        case 'chrome':
          const chromeOptions = new chrome.Options();
          if (process.env.CI || options.headless) {
            chromeOptions.addArguments('--headless');
          }
          chromeOptions.addArguments('--no-sandbox');
          chromeOptions.addArguments('--disable-dev-shm-usage');
          chromeOptions.addArguments('--window-size=1920,1080');
          builder = builder.forBrowser('chrome').setChromeOptions(chromeOptions);
          break;

        case 'firefox':
          const firefoxOptions = new firefox.Options();
          if (process.env.CI || options.headless) {
            firefoxOptions.addArguments('--headless');
          }
          firefoxOptions.addArguments('--width=1920');
          firefoxOptions.addArguments('--height=1080');
          builder = builder.forBrowser('firefox').setFirefoxOptions(firefoxOptions);
          break;

        case 'edge':
          const edgeOptions = new chrome.Options();
          if (process.env.CI || options.headless) {
            edgeOptions.addArguments('--headless');
          }
          edgeOptions.addArguments('--no-sandbox');
          edgeOptions.addArguments('--disable-dev-shm-usage');
          edgeOptions.addArguments('--window-size=1920,1080');
          builder = builder.forBrowser('edge').setEdgeOptions(edgeOptions);
          break;

        default:
          throw new Error(`Unsupported browser: ${browserName}`);
      }

      this.driver = await builder.build();
      await this.driver.manage().setTimeouts({
        implicit: this.defaultTimeout,
        pageLoad: this.defaultTimeout * 3,
        script: this.defaultTimeout * 2
      });

      return this.driver;
    } catch (error) {
      console.error('Failed to initialize WebDriver:', error);
      throw error;
    }
  }

  /**
   * Navigate to a specific page
   * @param {string} path - Path relative to app URL
   */
  async navigateTo(path = '') {
    if (!this.driver) {
      throw new Error('Driver not initialized. Call initializeDriver() first.');
    }
    
    const fullUrl = `${this.appUrl}${path}`;
    await this.driver.get(fullUrl);
    await this.driver.wait(until.titleMatches(/.+/), this.defaultTimeout);
  }

  /**
   * Take screenshot for test evidence
   * @param {string} fileName - Screenshot file name
   */
  async takeScreenshot(fileName = `screenshot_${Date.now()}`) {
    if (!this.driver) return null;

    try {
      const screenshot = await this.driver.takeScreenshot();
      const fs = require('fs');
      const path = require('path');
      
      const screenshotDir = path.join(__dirname, '../screenshots');
      if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
      }
      
      const filePath = path.join(screenshotDir, `${fileName}.png`);
      fs.writeFileSync(filePath, screenshot, 'base64');
      
      return filePath;
    } catch (error) {
      console.error('Failed to take screenshot:', error);
      return null;
    }
  }

  /**
   * Wait for element to be present and visible
   * @param {By} locator - Element locator
   * @param {number} timeout - Optional timeout override
   */
  async waitForElement(locator, timeout = this.defaultTimeout) {
    if (!this.driver) {
      throw new Error('Driver not initialized');
    }
    
    return await this.driver.wait(
      until.elementLocated(locator),
      timeout,
      `Element not found: ${locator}`
    );
  }

  /**
   * Wait for element to be clickable
   * @param {By} locator - Element locator
   * @param {number} timeout - Optional timeout override
   */
  async waitForClickable(locator, timeout = this.defaultTimeout) {
    const element = await this.waitForElement(locator, timeout);
    await this.driver.wait(
      until.elementIsEnabled(element),
      timeout,
      `Element not clickable: ${locator}`
    );
    return element;
  }

  /**
   * Close driver and cleanup
   */
  async cleanup() {
    if (this.driver) {
      await this.driver.quit();
      this.driver = null;
    }
  }

  /**
   * Get current driver instance
   */
  getDriver() {
    return this.driver;
  }
}

module.exports = SeleniumSetup;