const SeleniumSetup = require('../setup/selenium.setup');
const LoginPage = require('./LoginPage');

describe('Authentication UI Tests', () => {
  let seleniumSetup;
  let driver;
  let loginPage;

  beforeAll(async () => {
    seleniumSetup = new SeleniumSetup();
    driver = await seleniumSetup.initializeDriver('chrome', { headless: process.env.CI });
    loginPage = new LoginPage(driver);
  });

  afterAll(async () => {
    await seleniumSetup.cleanup();
  });

  beforeEach(async () => {
    await loginPage.navigateToLogin();
  });

  describe('Login Page Elements', () => {
    test('should display all required login form elements', async () => {
      const isFormDisplayed = await loginPage.isLoginFormDisplayed();
      expect(isFormDisplayed).toBe(true);

      const elements = await loginPage.verifyPageElements();
      elements.forEach(element => {
        expect(element.present).toBe(true);
      });
    });

    test('should display login page title correctly', async () => {
      const title = await loginPage.getPageTitle();
      expect(title).toContain('Login');
    });
  });

  describe('User Authentication Flow', () => {
    test('should handle valid login credentials', async () => {
      const testEmail = 'admin@plantmonitor.com';
      const testPassword = 'Admin123!';

      await loginPage.login(testEmail, testPassword);
      
      // Wait for redirect to dashboard
      await loginPage.waitForLoginSuccess();
      
      const currentUrl = await loginPage.getCurrentUrl();
      expect(currentUrl).toContain('/dashboard');
    });

    test('should show error message for invalid credentials', async () => {
      const invalidEmail = 'invalid@test.com';
      const invalidPassword = 'wrongpassword';

      await loginPage.login(invalidEmail, invalidPassword);
      
      // Wait for error message
      await driver.sleep(2000);
      
      const errorMessage = await loginPage.getErrorMessage();
      expect(errorMessage).toBeTruthy();
      expect(errorMessage.toLowerCase()).toContain('invalid');
    });

    test('should validate email format', async () => {
      const invalidEmail = 'notanemail';
      const validPassword = 'Password123!';

      await loginPage.typeText(loginPage.emailInput, invalidEmail);
      await loginPage.typeText(loginPage.passwordInput, validPassword);
      
      // Try to submit form
      await loginPage.clickElement(loginPage.loginButton);
      
      // Check for validation error
      const hasEmailError = await loginPage.hasEmailValidationError();
      expect(hasEmailError).toBe(true);
    });

    test('should validate required password field', async () => {
      const validEmail = 'test@example.com';
      
      await loginPage.typeText(loginPage.emailInput, validEmail);
      // Leave password empty
      await loginPage.clickElement(loginPage.loginButton);
      
      // Check for validation error
      const hasPasswordError = await loginPage.hasPasswordValidationError();
      expect(hasPasswordError).toBe(true);
    });
  });

  describe('Navigation Links', () => {
    test('should navigate to registration page', async () => {
      await loginPage.clickRegisterLink();
      
      const currentUrl = await loginPage.getCurrentUrl();
      expect(currentUrl).toContain('/register');
    });

    test('should navigate to forgot password page', async () => {
      await loginPage.clickForgotPasswordLink();
      
      const currentUrl = await loginPage.getCurrentUrl();
      expect(currentUrl).toContain('/forgot');
    });
  });

  describe('Responsive Design', () => {
    test('should be responsive on mobile viewport', async () => {
      // Set mobile viewport
      await driver.manage().window().setRect({ width: 375, height: 667 });
      
      await loginPage.navigateToLogin();
      
      const isFormDisplayed = await loginPage.isLoginFormDisplayed();
      expect(isFormDisplayed).toBe(true);
      
      // Reset viewport
      await driver.manage().window().setRect({ width: 1920, height: 1080 });
    });

    test('should be responsive on tablet viewport', async () => {
      // Set tablet viewport
      await driver.manage().window().setRect({ width: 768, height: 1024 });
      
      await loginPage.navigateToLogin();
      
      const isFormDisplayed = await loginPage.isLoginFormDisplayed();
      expect(isFormDisplayed).toBe(true);
      
      // Reset viewport
      await driver.manage().window().setRect({ width: 1920, height: 1080 });
    });
  });

  describe('Security Features', () => {
    test('should mask password input', async () => {
      await loginPage.typeText(loginPage.passwordInput, 'testpassword');
      
      const passwordType = await loginPage.getAttribute(loginPage.passwordInput, 'type');
      expect(passwordType).toBe('password');
    });

    test('should handle multiple failed login attempts', async () => {
      const invalidEmail = 'test@test.com';
      const invalidPassword = 'wrongpassword';

      // Attempt multiple failed logins
      for (let i = 0; i < 3; i++) {
        await loginPage.login(invalidEmail, invalidPassword);
        await driver.sleep(1000);
        await loginPage.navigateToLogin(); // Reset form
      }

      // Check if rate limiting or account lockout message appears
      const errorMessage = await loginPage.getErrorMessage();
      // This test may need adjustment based on actual implementation
      expect(errorMessage).toBeTruthy();
    });
  });

  afterEach(async () => {
    // Take screenshot on test failure
    const testState = expect.getState();
    if (testState.currentTestName) {
      const screenshotPath = await seleniumSetup.takeScreenshot(
        `login-test-${testState.currentTestName.replace(/[^a-zA-Z0-9]/g, '_')}`
      );
      if (screenshotPath) {
        console.log(`Screenshot saved: ${screenshotPath}`);
      }
    }
  });
});