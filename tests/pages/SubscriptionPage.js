/**
 * SUBSCRIPTION PAGE OBJECT
 * ========================
 * 
 * Page Object Model for subscription management UI
 * Handles plan selection, subscription status, and billing information
 */

const { By, until } = require('selenium-webdriver');

class SubscriptionPage {
    constructor(driver) {
        this.driver = driver;
        
        // Subscription plans elements
        this.subscriptionPlans = By.css('[data-testid="subscription-plans"]');
        this.premiumPlan = By.css('[data-testid="premium-plan"]');
        this.ultimatePlan = By.css('[data-testid="ultimate-plan"]');
        this.premiumPrice = By.css('[data-testid="premium-price"]');
        this.ultimatePrice = By.css('[data-testid="ultimate-price"]');
        this.upgradePremiumButton = By.css('[data-testid="upgrade-premium-btn"]');
        this.upgradeUltimateButton = By.css('[data-testid="upgrade-ultimate-btn"]');
        
        // Plan features
        this.premiumFeatures = By.css('[data-testid="premium-features"] li');
        this.ultimateFeatures = By.css('[data-testid="ultimate-features"] li');
        
        // Subscription management elements
        this.subscriptionStatus = By.css('[data-testid="subscription-status"]');
        this.currentPlan = By.css('[data-testid="current-plan"]');
        this.statusBadge = By.css('[data-testid="status-badge"]');
        this.availableFeatures = By.css('[data-testid="available-features"] li');
        this.planLimitations = By.css('[data-testid="plan-limitations"]');
        
        // Payment history elements
        this.paymentHistory = By.css('[data-testid="payment-history"]');
        this.paymentItem = By.css('[data-testid="payment-item"]');
        this.paymentAmount = By.css('[data-testid="payment-amount"]');
        this.paymentStatus = By.css('[data-testid="payment-status"]');
        
        // Billing information
        this.billingInfo = By.css('[data-testid="billing-info"]');
        this.nextBilling = By.css('[data-testid="next-billing"]');
    }

    async navigateToPlans() {
        await this.driver.get('http://localhost:3000/subscription');
        await this.driver.wait(until.elementLocated(this.subscriptionPlans), 10000);
    }

    async navigateToManagement() {
        await this.driver.get('http://localhost:3000/subscription/manage');
        await this.driver.wait(until.elementLocated(this.subscriptionStatus), 10000);
    }

    async getPremiumPrice() {
        const element = await this.driver.findElement(this.premiumPrice);
        return await element.getText();
    }

    async getUltimatePrice() {
        const element = await this.driver.findElement(this.ultimatePrice);
        return await element.getText();
    }

    async getPremiumFeatures() {
        const elements = await this.driver.findElements(this.premiumFeatures);
        const features = [];
        
        for (let element of elements) {
            features.push(await element.getText());
        }
        
        return features;
    }

    async getUltimateFeatures() {
        const elements = await this.driver.findElements(this.ultimateFeatures);
        const features = [];
        
        for (let element of elements) {
            features.push(await element.getText());
        }
        
        return features;
    }

    async clickUpgradePremium() {
        const button = await this.driver.findElement(this.upgradePremiumButton);
        await this.driver.wait(until.elementIsEnabled(button), 5000);
        await button.click();
    }

    async clickUpgradeUltimate() {
        const button = await this.driver.findElement(this.upgradeUltimateButton);
        await this.driver.wait(until.elementIsEnabled(button), 5000);
        await button.click();
    }

    async getCurrentPlan() {
        const element = await this.driver.findElement(this.currentPlan);
        return await element.getText();
    }

    async getSubscriptionStatus() {
        const element = await this.driver.findElement(this.statusBadge);
        return await element.getText();
    }

    async getAvailableFeatures() {
        const elements = await this.driver.findElements(this.availableFeatures);
        const features = [];
        
        for (let element of elements) {
            features.push(await element.getText());
        }
        
        return features;
    }

    async getPlanLimitations() {
        const element = await this.driver.findElement(this.planLimitations);
        return await element.getText();
    }

    async getPaymentHistory() {
        const elements = await this.driver.findElements(this.paymentItem);
        const payments = [];
        
        for (let element of elements) {
            const amount = await element.findElement(this.paymentAmount);
            const status = await element.findElement(this.paymentStatus);
            
            payments.push({
                amount: await amount.getText(),
                status: await status.getText()
            });
        }
        
        return payments;
    }

    async getBillingInfo() {
        const element = await this.driver.findElement(this.billingInfo);
        return await element.getText();
    }

    async getNextBillingDate() {
        const element = await this.driver.findElement(this.nextBilling);
        return await element.getText();
    }

    async hasUpgradeButtons() {
        const premiumButtons = await this.driver.findElements(this.upgradePremiumButton);
        const ultimateButtons = await this.driver.findElements(this.upgradeUltimateButton);
        
        return {
            hasPremium: premiumButtons.length > 0,
            hasUltimate: ultimateButtons.length > 0
        };
    }

    async waitForPaymentHistoryLoad() {
        try {
            await this.driver.wait(until.elementLocated(this.paymentItem), 10000);
            return true;
        } catch (e) {
            return false; // No payment history
        }
    }

    async validateSubscriptionPlans() {
        await this.navigateToPlans();
        
        // Check if plans container is visible
        const plansContainer = await this.driver.findElement(this.subscriptionPlans);
        const isVisible = await plansContainer.isDisplayed();
        
        if (!isVisible) {
            throw new Error('Subscription plans container is not visible');
        }

        // Validate Premium plan
        const premiumPlan = await this.driver.findElement(this.premiumPlan);
        const premiumVisible = await premiumPlan.isDisplayed();
        const premiumPrice = await this.getPremiumPrice();
        const premiumFeatures = await this.getPremiumFeatures();

        // Validate Ultimate plan
        const ultimatePlan = await this.driver.findElement(this.ultimatePlan);
        const ultimateVisible = await ultimatePlan.isDisplayed();
        const ultimatePrice = await this.getUltimatePrice();
        const ultimateFeatures = await this.getUltimateFeatures();

        return {
            premium: {
                visible: premiumVisible,
                price: premiumPrice,
                features: premiumFeatures
            },
            ultimate: {
                visible: ultimateVisible,
                price: ultimatePrice,
                features: ultimateFeatures
            }
        };
    }

    async validateSubscriptionManagement() {
        await this.navigateToManagement();
        
        const currentPlan = await this.getCurrentPlan();
        const status = await this.getSubscriptionStatus();
        const features = await this.getAvailableFeatures();
        const upgradeButtons = await this.hasUpgradeButtons();

        return {
            currentPlan,
            status,
            features,
            upgradeButtons
        };
    }
}

module.exports = SubscriptionPage;