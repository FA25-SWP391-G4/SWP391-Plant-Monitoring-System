const { By, until } = require('selenium-webdriver');

class BasePage {
  constructor(driver) {
    this.driver = driver;
    this.timeout = 10000;
  }

  /**
   * Wait for page to load completely
   */
  async waitForPageLoad() {
    await this.driver.wait(
      async () => {
        const readyState = await this.driver.executeScript('return document.readyState');
        return readyState === 'complete';
      },
      this.timeout,
      'Page did not load completely'
    );
  }

  /**
   * Find element with error handling
   * @param {By} locator - Element locator
   */
  async findElement(locator) {
    try {
      return await this.driver.wait(until.elementLocated(locator), this.timeout);
    } catch (error) {
      throw new Error(`Element not found: ${locator.toString()}`);
    }
  }

  /**
   * Find multiple elements
   * @param {By} locator - Element locator
   */
  async findElements(locator) {
    return await this.driver.findElements(locator);
  }

  /**
   * Click element with wait
   * @param {By} locator - Element locator
   */
  async clickElement(locator) {
    const element = await this.findElement(locator);
    await this.driver.wait(until.elementIsEnabled(element), this.timeout);
    await element.click();
  }

  /**
   * Type text into input field
   * @param {By} locator - Input element locator
   * @param {string} text - Text to type
   */
  async typeText(locator, text) {
    const element = await this.findElement(locator);
    await element.clear();
    await element.sendKeys(text);
  }

  /**
   * Get text content of element
   * @param {By} locator - Element locator
   */
  async getText(locator) {
    const element = await this.findElement(locator);
    return await element.getText();
  }

  /**
   * Get attribute value
   * @param {By} locator - Element locator
   * @param {string} attributeName - Attribute name
   */
  async getAttribute(locator, attributeName) {
    const element = await this.findElement(locator);
    return await element.getAttribute(attributeName);
  }

  /**
   * Check if element is displayed
   * @param {By} locator - Element locator
   */
  async isDisplayed(locator) {
    try {
      const element = await this.findElement(locator);
      return await element.isDisplayed();
    } catch (error) {
      return false;
    }
  }

  /**
   * Wait for element to be invisible
   * @param {By} locator - Element locator
   */
  async waitForElementToDisappear(locator) {
    await this.driver.wait(
      until.stalenessOf(await this.findElement(locator)),
      this.timeout
    );
  }

  /**
   * Wait for URL to contain specific text
   * @param {string} urlPart - Part of URL to wait for
   */
  async waitForUrlContains(urlPart) {
    await this.driver.wait(
      until.urlContains(urlPart),
      this.timeout,
      `URL did not contain: ${urlPart}`
    );
  }

  /**
   * Get current URL
   */
  async getCurrentUrl() {
    return await this.driver.getCurrentUrl();
  }

  /**
   * Get page title
   */
  async getPageTitle() {
    return await this.driver.getTitle();
  }

  /**
   * Navigate to specific URL
   * @param {string} url - Full URL to navigate to
   */
  async navigateTo(url) {
    await this.driver.get(url);
    await this.waitForPageLoad();
  }

  /**
   * Scroll to element
   * @param {By} locator - Element locator
   */
  async scrollToElement(locator) {
    const element = await this.findElement(locator);
    await this.driver.executeScript('arguments[0].scrollIntoView(true);', element);
  }

  /**
   * Take screenshot
   */
  async takeScreenshot() {
    return await this.driver.takeScreenshot();
  }
}

module.exports = BasePage;