/**
 * PAYMENT & SUBSCRIPTION UI TESTS
 * ===============================
 * 
 * Tests for UC9: Payment Processing UI
 * Tests for UC10: Subscription Management UI
 * Tests for UC11: Premium Feature Access UI
 * 
 * UI testing with Selenium WebDriver:
 * - Payment flow interactions
 * - Subscription management interface
 * - Premium feature access validation
 * - VNPay integration testing
 */

const { Builder, By, until, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const firefox = require('selenium-webdriver/firefox');
const { setupTestDatabase, cleanupTestDatabase, createTestUser, clearTestUsers } = require('../../helpers/testHelpers');
const PaymentPage = require('../../pages/PaymentPage');
const SubscriptionPage = require('../../pages/SubscriptionPage');
const PremiumFeaturesPage = require('../../pages/PremiumFeaturesPage');
const LoginPage = require('../../pages/LoginPage');

describe('Payment & Subscription UI Tests', () => {
    let driver;
    let paymentPage, subscriptionPage, premiumFeaturesPage, loginPage;
    let testUser, premiumUser, ultimateUser;

    const browsers = process.env.TEST_BROWSER ? [process.env.TEST_BROWSER] : ['chrome'];

    browsers.forEach(browserName => {
        describe(`Payment UI Tests - ${browserName}`, () => {
            beforeAll(async () => {
                await setupTestDatabase();

                // Create test users
                testUser = await createTestUser('testuser@payment.com', 'user', 'TestUser123!');
                premiumUser = await createTestUser('premium@payment.com', 'Premium', 'PremiumUser123!');
                ultimateUser = await createTestUser('ultimate@payment.com', 'Ultimate', 'UltimateUser123!');

                // Setup WebDriver
                const options = browserName === 'firefox' ? 
                    new firefox.Options() : new chrome.Options();
                
                if (process.env.CI) {
                    options.addArguments('--headless');
                    options.addArguments('--no-sandbox');
                    options.addArguments('--disable-dev-shm-usage');
                }

                driver = await new Builder()
                    .forBrowser(browserName)
                    .setChromeOptions(browserName === 'chrome' ? options : undefined)
                    .setFirefoxOptions(browserName === 'firefox' ? options : undefined)
                    .build();

                await driver.manage().window().setRect({ width: 1280, height: 1024 });

                // Initialize page objects
                paymentPage = new PaymentPage(driver);
                subscriptionPage = new SubscriptionPage(driver);
                premiumFeaturesPage = new PremiumFeaturesPage(driver);
                loginPage = new LoginPage(driver);
            });

            afterAll(async () => {
                if (driver) {
                    await driver.quit();
                }
                await clearTestUsers();
                await cleanupTestDatabase();
            });

            beforeEach(async () => {
                // Start fresh for each test
                await driver.get('http://localhost:3000');
                await driver.manage().deleteAllCookies();
            });

            describe('UC9: Payment Processing UI', () => {
                describe('Premium Subscription Purchase Flow', () => {
                    beforeEach(async () => {
                        await loginPage.login(testUser.email, 'TestUser123!');
                        await driver.wait(until.urlContains('/dashboard'), 10000);
                    });

                    it('should navigate to subscription plans', async () => {
                        await driver.get('http://localhost:3000/premium');
                        await driver.wait(until.elementLocated(By.css('[data-testid="subscription-plans"]')), 10000);

                        const plansContainer = await driver.findElement(By.css('[data-testid="subscription-plans"]'));
                        expect(await plansContainer.isDisplayed()).toBe(true);

                        // Verify Premium plan is displayed
                        const premiumPlan = await driver.findElement(By.css('[data-testid="premium-plan"]'));
                        expect(await premiumPlan.isDisplayed()).toBe(true);

                        const premiumPrice = await driver.findElement(By.css('[data-testid="premium-price"]'));
                        expect(await premiumPrice.getText()).toContain('200.000 ₫');

                        // Verify Ultimate plan is displayed
                        const ultimatePlan = await driver.findElement(By.css('[data-testid="ultimate-plan"]'));
                        expect(await ultimatePlan.isDisplayed()).toBe(true);

                        const ultimatePrice = await driver.findElement(By.css('[data-testid="ultimate-price"]'));
                        expect(await ultimatePrice.getText()).toContain('400.000 ₫');
                    });

                    it('should display plan features correctly', async () => {
                        await driver.get('http://localhost:3000/subscription');

                        // Premium plan features
                        const premiumFeatures = await driver.findElements(By.css('[data-testid="premium-features"] li'));
                        expect(premiumFeatures.length).toBeGreaterThan(0);

                        const featureTexts = await Promise.all(
                            premiumFeatures.map(feature => feature.getText())
                        );
                        expect(featureTexts).toContain('Unlimited plants');
                        expect(featureTexts).toContain('Advanced analytics');

                        // Ultimate plan features
                        const ultimateFeatures = await driver.findElements(By.css('[data-testid="ultimate-features"] li'));
                        const ultimateTexts = await Promise.all(
                            ultimateFeatures.map(feature => feature.getText())
                        );
                        expect(ultimateTexts).toContain('AI plant disease detection');
                        expect(ultimateTexts).toContain('Expert consultation');
                    });

                    it('should initiate premium payment flow', async () => {
                        await driver.get('http://localhost:3000/subscription');

                        const premiumButton = await driver.findElement(By.css('[data-testid="upgrade-premium-btn"]'));
                        await driver.wait(until.elementIsEnabled(premiumButton), 5000);
                        await premiumButton.click();

                        // Wait for payment modal or redirect
                        await driver.wait(until.elementLocated(By.css('[data-testid="payment-modal"]')), 10000);

                        const paymentModal = await driver.findElement(By.css('[data-testid="payment-modal"]'));
                        expect(await paymentModal.isDisplayed()).toBe(true);

                        // Verify payment details
                        const planType = await driver.findElement(By.css('[data-testid="selected-plan"]'));
                        expect(await planType.getText()).toContain('Premium');

                        const amount = await driver.findElement(By.css('[data-testid="payment-amount"]'));
                        expect(await amount.getText()).toContain('200.000 ₫');
                    });

                    it('should show bank selection in payment modal', async () => {
                        await driver.get('http://localhost:3000/subscription');
                        
                        const premiumButton = await driver.findElement(By.css('[data-testid="upgrade-premium-btn"]'));
                        await premiumButton.click();

                        await driver.wait(until.elementLocated(By.css('[data-testid="payment-modal"]')), 10000);

                        // Check bank selection
                        const bankSelect = await driver.findElement(By.css('[data-testid="bank-select"]'));
                        await bankSelect.click();

                        const bankOptions = await driver.findElements(By.css('[data-testid="bank-option"]'));
                        expect(bankOptions.length).toBeGreaterThan(0);

                        // Verify popular banks are available
                        const bankTexts = await Promise.all(
                            bankOptions.slice(0, 5).map(option => option.getText())
                        );
                        expect(bankTexts.some(text => text.includes('NCB'))).toBe(true);
                        expect(bankTexts.some(text => text.includes('VCB'))).toBe(true);
                    });

                    it('should process payment submission', async () => {
                        await driver.get('http://localhost:3000/subscription');
                        
                        const premiumButton = await driver.findElement(By.css('[data-testid="upgrade-premium-btn"]'));
                        await premiumButton.click();

                        await driver.wait(until.elementLocated(By.css('[data-testid="payment-modal"]')), 10000);

                        // Select bank
                        const bankSelect = await driver.findElement(By.css('[data-testid="bank-select"]'));
                        await bankSelect.click();

                        const ncbOption = await driver.findElement(By.css('[data-testid="bank-option"][data-value="NCB"]'));
                        await ncbOption.click();

                        // Submit payment
                        const submitButton = await driver.findElement(By.css('[data-testid="submit-payment-btn"]'));
                        await driver.wait(until.elementIsEnabled(submitButton), 5000);
                        await submitButton.click();

                        // Wait for redirect or processing indicator
                        await driver.wait(until.elementLocated(By.css('[data-testid="payment-processing"]')), 10000);

                        const processingIndicator = await driver.findElement(By.css('[data-testid="payment-processing"]'));
                        expect(await processingIndicator.isDisplayed()).toBe(true);
                    });

                    it('should handle payment form validation', async () => {
                        await driver.get('http://localhost:3000/subscription');
                        
                        const premiumButton = await driver.findElement(By.css('[data-testid="upgrade-premium-btn"]'));
                        await premiumButton.click();

                        await driver.wait(until.elementLocated(By.css('[data-testid="payment-modal"]')), 10000);

                        // Try to submit without selecting bank
                        const submitButton = await driver.findElement(By.css('[data-testid="submit-payment-btn"]'));
                        await submitButton.click();

                        // Check for validation error
                        const errorMessage = await driver.wait(
                            until.elementLocated(By.css('[data-testid="bank-error"]')), 
                            5000
                        );
                        expect(await errorMessage.getText()).toContain('Please select a bank');
                    });

                    it('should handle ultimate payment flow', async () => {
                        await driver.get('http://localhost:3000/subscription');

                        const ultimateButton = await driver.findElement(By.css('[data-testid="upgrade-ultimate-btn"]'));
                        await ultimateButton.click();

                        await driver.wait(until.elementLocated(By.css('[data-testid="payment-modal"]')), 10000);

                        // Verify ultimate payment details
                        const planType = await driver.findElement(By.css('[data-testid="selected-plan"]'));
                        expect(await planType.getText()).toContain('Ultimate');

                        const amount = await driver.findElement(By.css('[data-testid="payment-amount"]'));
                        expect(await amount.getText()).toContain('400.000 ₫');

                        // Select bank and submit
                        const bankSelect = await driver.findElement(By.css('[data-testid="bank-select"]'));
                        await bankSelect.click();

                        const vcbOption = await driver.findElement(By.css('[data-testid="bank-option"][data-value="VCB"]'));
                        await vcbOption.click();

                        const submitButton = await driver.findElement(By.css('[data-testid="submit-payment-btn"]'));
                        await submitButton.click();

                        await driver.wait(until.elementLocated(By.css('[data-testid="payment-processing"]')), 10000);
                    });
                });

                describe('Payment Success/Failure Pages', () => {
                    it('should display payment success page', async () => {
                        await driver.get('http://localhost:3000/payment/success?orderId=PREMIUM_123456789_1234&amount=200000');

                        await driver.wait(until.elementLocated(By.css('[data-testid="payment-success"]')), 10000);

                        const successMessage = await driver.findElement(By.css('[data-testid="success-message"]'));
                        expect(await successMessage.getText()).toContain('Payment successful');

                        const orderInfo = await driver.findElement(By.css('[data-testid="order-info"]'));
                        expect(await orderInfo.getText()).toContain('PREMIUM_123456789_1234');

                        const amountInfo = await driver.findElement(By.css('[data-testid="amount-info"]'));
                        expect(await amountInfo.getText()).toContain('200.000 ₫');

                        // Verify continue button
                        const continueButton = await driver.findElement(By.css('[data-testid="continue-btn"]'));
                        expect(await continueButton.isDisplayed()).toBe(true);
                    });

                    it('should display payment failure page', async () => {
                        await driver.get('http://localhost:3000/payment/failed?orderId=PREMIUM_123456789_5678&error=cancelled');

                        await driver.wait(until.elementLocated(By.css('[data-testid="payment-failed"]')), 10000);

                        const failureMessage = await driver.findElement(By.css('[data-testid="failure-message"]'));
                        expect(await failureMessage.getText()).toContain('Payment failed');

                        const errorReason = await driver.findElement(By.css('[data-testid="error-reason"]'));
                        expect(await errorReason.getText()).toContain('cancelled');

                        // Verify retry button
                        const retryButton = await driver.findElement(By.css('[data-testid="retry-payment-btn"]'));
                        expect(await retryButton.isDisplayed()).toBe(true);
                    });

                    it('should handle navigation from success page', async () => {
                        await loginPage.login(testUser.email, 'TestUser123!');
                        await driver.get('http://localhost:3000/payment/success?orderId=PREMIUM_123456789_1234');

                        const continueButton = await driver.findElement(By.css('[data-testid="continue-btn"]'));
                        await continueButton.click();

                        await driver.wait(until.urlContains('/dashboard'), 10000);
                        expect(await driver.getCurrentUrl()).toContain('/dashboard');
                    });
                });
            });

            describe('UC10: Subscription Management UI', () => {
                describe('Premium User Subscription Dashboard', () => {
                    beforeEach(async () => {
                        await loginPage.login(premiumUser.email, 'PremiumUser123!');
                        await driver.wait(until.urlContains('/dashboard'), 10000);
                    });

                    it('should display current subscription status', async () => {
                        await driver.get('http://localhost:3000/subscription/manage');

                        await driver.wait(until.elementLocated(By.css('[data-testid="subscription-status"]')), 10000);

                        const status = await driver.findElement(By.css('[data-testid="current-plan"]'));
                        expect(await status.getText()).toContain('Premium');

                        const statusBadge = await driver.findElement(By.css('[data-testid="status-badge"]'));
                        expect(await statusBadge.getText()).toContain('Active');

                        // Verify features available
                        const features = await driver.findElements(By.css('[data-testid="available-features"] li'));
                        expect(features.length).toBeGreaterThan(0);
                    });

                    it('should show payment history', async () => {
                        await driver.get('http://localhost:3000/subscription/manage');

                        const historySection = await driver.findElement(By.css('[data-testid="payment-history"]'));
                        expect(await historySection.isDisplayed()).toBe(true);

                        // Check if payment history loads
                        await driver.wait(until.elementLocated(By.css('[data-testid="payment-item"]')), 10000);

                        const paymentItems = await driver.findElements(By.css('[data-testid="payment-item"]'));
                        if (paymentItems.length > 0) {
                            const firstPayment = paymentItems[0];
                            const amount = await firstPayment.findElement(By.css('[data-testid="payment-amount"]'));
                            const status = await firstPayment.findElement(By.css('[data-testid="payment-status"]'));
                            
                            expect(await amount.isDisplayed()).toBe(true);
                            expect(await status.isDisplayed()).toBe(true);
                        }
                    });

                    it('should allow upgrade to Ultimate', async () => {
                        await driver.get('http://localhost:3000/subscription/manage');

                        const upgradeButton = await driver.findElement(By.css('[data-testid="upgrade-ultimate-btn"]'));
                        expect(await upgradeButton.isDisplayed()).toBe(true);

                        await upgradeButton.click();

                        // Should redirect to payment flow
                        await driver.wait(until.elementLocated(By.css('[data-testid="payment-modal"]')), 10000);

                        const planType = await driver.findElement(By.css('[data-testid="selected-plan"]'));
                        expect(await planType.getText()).toContain('Ultimate');
                    });

                    it('should display billing information', async () => {
                        await driver.get('http://localhost:3000/subscription/manage');

                        const billingSection = await driver.findElement(By.css('[data-testid="billing-info"]'));
                        expect(await billingSection.isDisplayed()).toBe(true);

                        // Check next billing date (if applicable)
                        const nextBilling = await driver.findElement(By.css('[data-testid="next-billing"]'));
                        expect(await nextBilling.isDisplayed()).toBe(true);
                    });
                });

                describe('Ultimate User Subscription Dashboard', () => {
                    beforeEach(async () => {
                        await loginPage.login(ultimateUser.email, 'UltimateUser123!');
                        await driver.wait(until.urlContains('/dashboard'), 10000);
                    });

                    it('should display Ultimate subscription status', async () => {
                        await driver.get('http://localhost:3000/subscription/manage');

                        const status = await driver.findElement(By.css('[data-testid="current-plan"]'));
                        expect(await status.getText()).toContain('Ultimate');

                        // Verify no upgrade button for Ultimate users
                        const upgradeButtons = await driver.findElements(By.css('[data-testid*="upgrade-"][data-testid*="-btn"]'));
                        expect(upgradeButtons.length).toBe(0);

                        // Verify Ultimate features
                        const features = await driver.findElements(By.css('[data-testid="available-features"] li'));
                        const featureTexts = await Promise.all(features.map(f => f.getText()));
                        expect(featureTexts.some(text => text.includes('AI consultation'))).toBe(true);
                    });
                });

                describe('Basic User Subscription Dashboard', () => {
                    beforeEach(async () => {
                        await loginPage.login(testUser.email, 'TestUser123!');
                        await driver.wait(until.urlContains('/dashboard'), 10000);
                    });

                    it('should show upgrade options for basic users', async () => {
                        await driver.get('http://localhost:3000/subscription/manage');

                        const currentPlan = await driver.findElement(By.css('[data-testid="current-plan"]'));
                        expect(await currentPlan.getText()).toContain('Basic');

                        // Should show upgrade options
                        const premiumUpgrade = await driver.findElement(By.css('[data-testid="upgrade-premium-btn"]'));
                        const ultimateUpgrade = await driver.findElement(By.css('[data-testid="upgrade-ultimate-btn"]'));

                        expect(await premiumUpgrade.isDisplayed()).toBe(true);
                        expect(await ultimateUpgrade.isDisplayed()).toBe(true);
                    });

                    it('should show feature limitations', async () => {
                        await driver.get('http://localhost:3000/subscription/manage');

                        const limitations = await driver.findElement(By.css('[data-testid="plan-limitations"]'));
                        expect(await limitations.isDisplayed()).toBe(true);

                        const limitText = await limitations.getText();
                        expect(limitText).toContain('10 plants maximum');
                        expect(limitText).toContain('Basic analytics only');
                    });
                });
            });

            describe('UC11: Premium Feature Access UI', () => {
                describe('Premium Feature Navigation', () => {
                    it('should show premium features to premium users', async () => {
                        await loginPage.login(premiumUser.email, 'PremiumUser123!');
                        await driver.wait(until.urlContains('/dashboard'), 10000);

                        // Navigate to premium analytics
                        await driver.get('http://localhost:3000/analytics/advanced');

                        await driver.wait(until.elementLocated(By.css('[data-testid="premium-analytics"]')), 10000);

                        const analyticsPage = await driver.findElement(By.css('[data-testid="premium-analytics"]'));
                        expect(await analyticsPage.isDisplayed()).toBe(true);

                        // Check for premium charts and data
                        const charts = await driver.findElements(By.css('[data-testid="advanced-chart"]'));
                        expect(charts.length).toBeGreaterThan(0);
                    });

                    it('should block premium features for basic users', async () => {
                        await loginPage.login(testUser.email, 'TestUser123!');
                        await driver.wait(until.urlContains('/dashboard'), 10000);

                        await driver.get('http://localhost:3000/analytics/advanced');

                        await driver.wait(until.elementLocated(By.css('[data-testid="access-denied"]')), 10000);

                        const accessDenied = await driver.findElement(By.css('[data-testid="access-denied"]'));
                        expect(await accessDenied.isDisplayed()).toBe(true);

                        const upgradeButton = await driver.findElement(By.css('[data-testid="upgrade-now-btn"]'));
                        expect(await upgradeButton.isDisplayed()).toBe(true);
                    });

                    it('should show ultimate features to ultimate users', async () => {
                        await loginPage.login(ultimateUser.email, 'UltimateUser123!');
                        await driver.wait(until.urlContains('/dashboard'), 10000);

                        await driver.get('http://localhost:3000/ai/consultation');

                        await driver.wait(until.elementLocated(By.css('[data-testid="ai-consultation"]')), 10000);

                        const consultationPage = await driver.findElement(By.css('[data-testid="ai-consultation"]'));
                        expect(await consultationPage.isDisplayed()).toBe(true);

                        const chatInterface = await driver.findElement(By.css('[data-testid="ai-chat-interface"]'));
                        expect(await chatInterface.isDisplayed()).toBe(true);
                    });

                    it('should block ultimate features for premium users', async () => {
                        await loginPage.login(premiumUser.email, 'PremiumUser123!');
                        await driver.wait(until.urlContains('/dashboard'), 10000);

                        await driver.get('http://localhost:3000/ai/consultation');

                        await driver.wait(until.elementLocated(By.css('[data-testid="access-denied"]')), 10000);

                        const message = await driver.findElement(By.css('[data-testid="access-message"]'));
                        expect(await message.getText()).toContain('Ultimate');

                        const upgradeButton = await driver.findElement(By.css('[data-testid="upgrade-ultimate-btn"]'));
                        expect(await upgradeButton.isDisplayed()).toBe(true);
                    });
                });

                describe('Plant Limit Enforcement', () => {
                    it('should enforce plant limits for basic users', async () => {
                        await loginPage.login(testUser.email, 'TestUser123!');
                        await driver.wait(until.urlContains('/dashboard'), 10000);

                        await driver.get('http://localhost:3000/plants');

                        // Try to add plant when at limit
                        const addPlantButton = await driver.findElement(By.css('[data-testid="add-plant-btn"]'));
                        await addPlantButton.click();

                        // If at limit, should show upgrade modal
                        try {
                            await driver.wait(until.elementLocated(By.css('[data-testid="plant-limit-modal"]')), 5000);
                            
                            const limitModal = await driver.findElement(By.css('[data-testid="plant-limit-modal"]'));
                            expect(await limitModal.isDisplayed()).toBe(true);

                            const upgradeButton = await driver.findElement(By.css('[data-testid="upgrade-for-plants-btn"]'));
                            expect(await upgradeButton.isDisplayed()).toBe(true);
                        } catch (e) {
                            // If not at limit, plant form should appear
                            const plantForm = await driver.findElement(By.css('[data-testid="plant-form"]'));
                            expect(await plantForm.isDisplayed()).toBe(true);
                        }
                    });

                    it('should show unlimited plants message for premium users', async () => {
                        await loginPage.login(premiumUser.email, 'PremiumUser123!');
                        await driver.wait(until.urlContains('/dashboard'), 10000);

                        await driver.get('http://localhost:3000/plants');

                        const plantsCounter = await driver.findElement(By.css('[data-testid="plants-counter"]'));
                        expect(await plantsCounter.getText()).toContain('Unlimited');

                        const addPlantButton = await driver.findElement(By.css('[data-testid="add-plant-btn"]'));
                        await addPlantButton.click();

                        // Should always show plant form
                        await driver.wait(until.elementLocated(By.css('[data-testid="plant-form"]')), 10000);
                        const plantForm = await driver.findElement(By.css('[data-testid="plant-form"]'));
                        expect(await plantForm.isDisplayed()).toBe(true);
                    });
                });

                describe('Feature Tooltips and Hints', () => {
                    it('should show premium hints to basic users', async () => {
                        await loginPage.login(testUser.email, 'TestUser123!');
                        await driver.wait(until.urlContains('/dashboard'), 10000);

                        await driver.get('http://localhost:3000/dashboard');

                        // Look for premium feature hints
                        const premiumHints = await driver.findElements(By.css('[data-testid*="premium-hint"]'));
                        expect(premiumHints.length).toBeGreaterThan(0);

                        if (premiumHints.length > 0) {
                            const hint = premiumHints[0];
                            expect(await hint.isDisplayed()).toBe(true);
                            
                            // Check if clicking opens upgrade modal
                            await hint.click();
                            
                            await driver.wait(until.elementLocated(By.css('[data-testid="upgrade-modal"]')), 5000);
                            const upgradeModal = await driver.findElement(By.css('[data-testid="upgrade-modal"]'));
                            expect(await upgradeModal.isDisplayed()).toBe(true);
                        }
                    });

                    it('should not show upgrade hints to premium users', async () => {
                        await loginPage.login(premiumUser.email, 'PremiumUser123!');
                        await driver.wait(until.urlContains('/dashboard'), 10000);

                        await driver.get('http://localhost:3000/dashboard');

                        // Premium users shouldn't see basic upgrade hints
                        const premiumHints = await driver.findElements(By.css('[data-testid*="premium-hint"]'));
                        expect(premiumHints.length).toBe(0);

                        // But might see Ultimate upgrade hints
                        const ultimateHints = await driver.findElements(By.css('[data-testid*="ultimate-hint"]'));
                        // Ultimate hints are optional for premium users
                    });
                });
            });

            describe('Responsive Design Tests', () => {
                it('should work on mobile devices', async () => {
                    await driver.manage().window().setRect({ width: 375, height: 667 });
                    
                    await loginPage.login(testUser.email, 'TestUser123!');
                    await driver.get('http://localhost:3000/subscription');

                    await driver.wait(until.elementLocated(By.css('[data-testid="subscription-plans"]')), 10000);

                    // Plans should stack vertically on mobile
                    const plansContainer = await driver.findElement(By.css('[data-testid="subscription-plans"]'));
                    expect(await plansContainer.isDisplayed()).toBe(true);

                    // Mobile upgrade buttons should be visible
                    const upgradeButton = await driver.findElement(By.css('[data-testid="upgrade-premium-btn"]'));
                    expect(await upgradeButton.isDisplayed()).toBe(true);
                });

                it('should work on tablet devices', async () => {
                    await driver.manage().window().setRect({ width: 768, height: 1024 });
                    
                    await loginPage.login(premiumUser.email, 'PremiumUser123!');
                    await driver.get('http://localhost:3000/subscription/manage');

                    await driver.wait(until.elementLocated(By.css('[data-testid="subscription-status"]')), 10000);

                    const status = await driver.findElement(By.css('[data-testid="subscription-status"]'));
                    expect(await status.isDisplayed()).toBe(true);

                    // Payment history should be visible
                    const history = await driver.findElement(By.css('[data-testid="payment-history"]'));
                    expect(await history.isDisplayed()).toBe(true);
                });
            });
        });
    });
});