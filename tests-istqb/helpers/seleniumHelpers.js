/**
 * ============================================================================
 * SELENIUM TEST HELPERS
 * ============================================================================
 * Helper functions for Selenium E2E tests
 */

const { By, until } = require('selenium-webdriver');

/**
 * Wait for element to be visible
 */
async function waitForElement(driver, selector, timeout = 10000) {
  return await driver.wait(until.elementLocated(By.css(selector)), timeout);
}

/**
 * Wait and click element
 */
async function clickElement(driver, selector, timeout = 10000) {
  const element = await waitForElement(driver, selector, timeout);
  await driver.wait(until.elementIsVisible(element), timeout);
  await driver.wait(until.elementIsEnabled(element), timeout);
  await element.click();
  return element;
}

/**
 * Wait and type text into input
 */
async function typeText(driver, selector, text, timeout = 10000) {
  const element = await waitForElement(driver, selector, timeout);
  await driver.wait(until.elementIsVisible(element), timeout);
  await element.clear();
  await element.sendKeys(text);
  return element;
}

/**
 * Get element text
 */
async function getElementText(driver, selector, timeout = 10000) {
  const element = await waitForElement(driver, selector, timeout);
  return await element.getText();
}

/**
 * Check if element exists
 */
async function elementExists(driver, selector) {
  try {
    await driver.findElement(By.css(selector));
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Navigate to URL
 */
async function navigateTo(driver, path, baseUrl = 'http://localhost:3000') {
  const url = baseUrl + path;
  await driver.get(url);
  await driver.wait(until.urlIs(url), 10000);
}

/**
 * Login helper
 */
async function login(driver, email, password) {
  await navigateTo(driver, '/login');
  await typeText(driver, 'input[name="email"]', email);
  await typeText(driver, 'input[name="password"]', password);
  await clickElement(driver, 'button[type="submit"]');
  await driver.wait(until.urlContains('/dashboard'), 10000);
}

/**
 * Logout helper
 */
async function logout(driver) {
  await clickElement(driver, '[data-testid="logout-button"]');
  await driver.wait(until.urlContains('/login'), 10000);
}

/**
 * Take screenshot
 */
async function takeScreenshot(driver, filename) {
  const image = await driver.takeScreenshot();
  const fs = require('fs');
  const path = require('path');
  const screenshotPath = path.join(__dirname, '../screenshots', filename);
  fs.writeFileSync(screenshotPath, image, 'base64');
  return screenshotPath;
}

/**
 * Wait for page load
 */
async function waitForPageLoad(driver, timeout = 30000) {
  await driver.wait(
    async () => {
      const readyState = await driver.executeScript('return document.readyState');
      return readyState === 'complete';
    },
    timeout
  );
}

/**
 * Scroll to element
 */
async function scrollToElement(driver, selector) {
  const element = await driver.findElement(By.css(selector));
  await driver.executeScript('arguments[0].scrollIntoView(true);', element);
  await new Promise(resolve => setTimeout(resolve, 500));
}

/**
 * Select dropdown option
 */
async function selectDropdownOption(driver, selectSelector, optionValue) {
  const select = await driver.findElement(By.css(selectSelector));
  await select.click();
  const option = await driver.findElement(By.css(`option[value="${optionValue}"]`));
  await option.click();
}

/**
 * Upload file
 */
async function uploadFile(driver, inputSelector, filePath) {
  const input = await driver.findElement(By.css(inputSelector));
  await input.sendKeys(filePath);
}

module.exports = {
  waitForElement,
  clickElement,
  typeText,
  getElementText,
  elementExists,
  navigateTo,
  login,
  logout,
  takeScreenshot,
  waitForPageLoad,
  scrollToElement,
  selectDropdownOption,
  uploadFile
};
