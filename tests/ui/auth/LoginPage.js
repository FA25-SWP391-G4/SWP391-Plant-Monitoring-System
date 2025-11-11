const { By } = require('selenium-webdriver');
const BasePage = require('../utils/BasePage');

class LoginPage extends BasePage {
  constructor(driver) {
    super(driver);
    
    // Locators
    this.emailInput = By.css('input[type="email"], input[name="email"]');
    this.passwordInput = By.css('input[type="password"], input[name="password"]');
    this.loginButton = By.css('button[type="submit"], .login-button');
    this.registerLink = By.css('a[href*="register"], .register-link');
    this.forgotPasswordLink = By.css('a[href*="forgot"], .forgot-password-link');
    this.errorMessage = By.css('.error-message, .alert-danger, .text-red-500');
    this.successMessage = By.css('.success-message, .alert-success, .text-green-500');
    
    // Google Auth
    this.googleLoginButton = By.css('.google-login, [data-testid="google-login"]');
    
    // Remember me
    this.rememberMeCheckbox = By.css('input[type="checkbox"][name*="remember"]');
    
    // Form validation
    this.emailValidation = By.css('.email-error, [data-testid="email-error"]');
    this.passwordValidation = By.css('.password-error, [data-testid="password-error"]');
  }

  /**
   * Navigate to login page
   */
  async navigateToLogin() {
    await this.navigateTo(`${process.env.APP_URL || 'http://localhost:3000'}/login`);
  }

  /**
   * Perform login with credentials
   * @param {string} email - User email
   * @param {string} password - User password
   */
  async login(email, password) {
    await this.typeText(this.emailInput, email);
    await this.typeText(this.passwordInput, password);
    await this.clickElement(this.loginButton);
  }

  /**
   * Check if login form is displayed
   */
  async isLoginFormDisplayed() {
    return await this.isDisplayed(this.emailInput) && 
           await this.isDisplayed(this.passwordInput) && 
           await this.isDisplayed(this.loginButton);
  }

  /**
   * Get error message text
   */
  async getErrorMessage() {
    if (await this.isDisplayed(this.errorMessage)) {
      return await this.getText(this.errorMessage);
    }
    return null;
  }

  /**
   * Get success message text
   */
  async getSuccessMessage() {
    if (await this.isDisplayed(this.successMessage)) {
      return await this.getText(this.successMessage);
    }
    return null;
  }

  /**
   * Click register link
   */
  async clickRegisterLink() {
    await this.clickElement(this.registerLink);
  }

  /**
   * Click forgot password link
   */
  async clickForgotPasswordLink() {
    await this.clickElement(this.forgotPasswordLink);
  }

  /**
   * Click Google login button
   */
  async clickGoogleLogin() {
    await this.clickElement(this.googleLoginButton);
  }

  /**
   * Toggle remember me checkbox
   */
  async toggleRememberMe() {
    await this.clickElement(this.rememberMeCheckbox);
  }

  /**
   * Check if email validation error is shown
   */
  async hasEmailValidationError() {
    return await this.isDisplayed(this.emailValidation);
  }

  /**
   * Check if password validation error is shown
   */
  async hasPasswordValidationError() {
    return await this.isDisplayed(this.passwordValidation);
  }

  /**
   * Get email validation error text
   */
  async getEmailValidationError() {
    if (await this.hasEmailValidationError()) {
      return await this.getText(this.emailValidation);
    }
    return null;
  }

  /**
   * Get password validation error text
   */
  async getPasswordValidationError() {
    if (await this.hasPasswordValidationError()) {
      return await this.getText(this.passwordValidation);
    }
    return null;
  }

  /**
   * Wait for login to complete (redirect to dashboard)
   */
  async waitForLoginSuccess() {
    await this.waitForUrlContains('/dashboard');
  }

  /**
   * Verify login page elements are present
   */
  async verifyPageElements() {
    const elements = [
      { name: 'Email input', locator: this.emailInput },
      { name: 'Password input', locator: this.passwordInput },
      { name: 'Login button', locator: this.loginButton },
      { name: 'Register link', locator: this.registerLink }
    ];

    const results = [];
    for (const element of elements) {
      const isPresent = await this.isDisplayed(element.locator);
      results.push({ name: element.name, present: isPresent });
    }

    return results;
  }
}

module.exports = LoginPage;