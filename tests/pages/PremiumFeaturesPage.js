/**
 * PREMIUM FEATURES PAGE OBJECT
 * ============================
 * 
 * Page Object Model for premium feature access and limitations
 * Handles feature access validation, upgrade prompts, and restrictions
 */

const { By, until } = require('selenium-webdriver');

class PremiumFeaturesPage {
    constructor(driver) {
        this.driver = driver;
        
        // Premium feature elements
        this.premiumAnalytics = By.css('[data-testid="premium-analytics"]');
        this.advancedChart = By.css('[data-testid="advanced-chart"]');
        this.aiConsultation = By.css('[data-testid="ai-consultation"]');
        this.aiChatInterface = By.css('[data-testid="ai-chat-interface"]');
        
        // Access control elements
        this.accessDenied = By.css('[data-testid="access-denied"]');
        this.accessMessage = By.css('[data-testid="access-message"]');
        this.upgradeNowButton = By.css('[data-testid="upgrade-now-btn"]');
        this.upgradeUltimateButton = By.css('[data-testid="upgrade-ultimate-btn"]');
        this.upgradeModal = By.css('[data-testid="upgrade-modal"]');
        
        // Plant limit elements
        this.addPlantButton = By.css('[data-testid="add-plant-btn"]');
        this.plantForm = By.css('[data-testid="plant-form"]');
        this.plantLimitModal = By.css('[data-testid="plant-limit-modal"]');
        this.upgradeForPlantsButton = By.css('[data-testid="upgrade-for-plants-btn"]');
        this.plantsCounter = By.css('[data-testid="plants-counter"]');
        
        // Feature hints and prompts
        this.premiumHints = By.css('[data-testid*="premium-hint"]');
        this.ultimateHints = By.css('[data-testid*="ultimate-hint"]');
    }

    async navigateToPremiumAnalytics() {
        await this.driver.get('http://localhost:3000/analytics/advanced');
    }

    async navigateToAIConsultation() {
        await this.driver.get('http://localhost:3000/ai/consultation');
    }

    async navigateToPlants() {
        await this.driver.get('http://localhost:3000/plants');
    }

    async navigateToDashboard() {
        await this.driver.get('http://localhost:3000/dashboard');
    }

    async isPremiumAnalyticsAccessible() {
        try {
            await this.driver.wait(until.elementLocated(this.premiumAnalytics), 10000);
            const element = await this.driver.findElement(this.premiumAnalytics);
            return await element.isDisplayed();
        } catch (e) {
            return false;
        }
    }

    async isAIConsultationAccessible() {
        try {
            await this.driver.wait(until.elementLocated(this.aiConsultation), 10000);
            const element = await this.driver.findElement(this.aiConsultation);
            return await element.isDisplayed();
        } catch (e) {
            return false;
        }
    }

    async isAccessDenied() {
        try {
            await this.driver.wait(until.elementLocated(this.accessDenied), 10000);
            const element = await this.driver.findElement(this.accessDenied);
            return await element.isDisplayed();
        } catch (e) {
            return false;
        }
    }

    async getAccessMessage() {
        const element = await this.driver.findElement(this.accessMessage);
        return await element.getText();
    }

    async getAdvancedCharts() {
        const elements = await this.driver.findElements(this.advancedChart);
        return elements.length;
    }

    async hasAIChatInterface() {
        try {
            const element = await this.driver.findElement(this.aiChatInterface);
            return await element.isDisplayed();
        } catch (e) {
            return false;
        }
    }

    async clickUpgradeNow() {
        const button = await this.driver.findElement(this.upgradeNowButton);
        await button.click();
    }

    async clickUpgradeUltimate() {
        const button = await this.driver.findElement(this.upgradeUltimateButton);
        await button.click();
    }

    async waitForUpgradeModal() {
        await this.driver.wait(until.elementLocated(this.upgradeModal), 10000);
        return await this.driver.findElement(this.upgradeModal);
    }

    async clickAddPlant() {
        const button = await this.driver.findElement(this.addPlantButton);
        await button.click();
    }

    async isPlantFormVisible() {
        try {
            await this.driver.wait(until.elementLocated(this.plantForm), 10000);
            const element = await this.driver.findElement(this.plantForm);
            return await element.isDisplayed();
        } catch (e) {
            return false;
        }
    }

    async isPlantLimitModalVisible() {
        try {
            await this.driver.wait(until.elementLocated(this.plantLimitModal), 5000);
            const element = await this.driver.findElement(this.plantLimitModal);
            return await element.isDisplayed();
        } catch (e) {
            return false;
        }
    }

    async clickUpgradeForPlants() {
        const button = await this.driver.findElement(this.upgradeForPlantsButton);
        await button.click();
    }

    async getPlantsCounter() {
        const element = await this.driver.findElement(this.plantsCounter);
        return await element.getText();
    }

    async getPremiumHints() {
        const elements = await this.driver.findElements(this.premiumHints);
        return elements.length;
    }

    async getUltimateHints() {
        const elements = await this.driver.findElements(this.ultimateHints);
        return elements.length;
    }

    async clickFirstPremiumHint() {
        const hints = await this.driver.findElements(this.premiumHints);
        if (hints.length > 0) {
            await hints[0].click();
            return true;
        }
        return false;
    }

    async validatePremiumAccess() {
        await this.navigateToPremiumAnalytics();
        
        const hasAccess = await this.isPremiumAnalyticsAccessible();
        const isDenied = await this.isAccessDenied();
        
        if (hasAccess) {
            const chartCount = await this.getAdvancedCharts();
            return {
                access: true,
                charts: chartCount
            };
        } else if (isDenied) {
            const message = await this.getAccessMessage();
            return {
                access: false,
                message: message
            };
        } else {
            throw new Error('Unknown access state for premium analytics');
        }
    }

    async validateUltimateAccess() {
        await this.navigateToAIConsultation();
        
        const hasAccess = await this.isAIConsultationAccessible();
        const isDenied = await this.isAccessDenied();
        
        if (hasAccess) {
            const hasChatInterface = await this.hasAIChatInterface();
            return {
                access: true,
                chatInterface: hasChatInterface
            };
        } else if (isDenied) {
            const message = await this.getAccessMessage();
            return {
                access: false,
                message: message
            };
        } else {
            throw new Error('Unknown access state for AI consultation');
        }
    }

    async testPlantLimitEnforcement() {
        await this.navigateToPlants();
        
        const counter = await this.getPlantsCounter();
        await this.clickAddPlant();
        
        const isFormVisible = await this.isPlantFormVisible();
        const isLimitModalVisible = await this.isPlantLimitModalVisible();
        
        return {
            counter: counter,
            canAddPlant: isFormVisible,
            hitLimit: isLimitModalVisible
        };
    }

    async validateFeatureHints() {
        await this.navigateToDashboard();
        
        const premiumHintCount = await this.getPremiumHints();
        const ultimateHintCount = await this.getUltimateHints();
        
        let upgradeModalShown = false;
        if (premiumHintCount > 0) {
            const clicked = await this.clickFirstPremiumHint();
            if (clicked) {
                try {
                    await this.waitForUpgradeModal();
                    upgradeModalShown = true;
                } catch (e) {
                    // Modal didn't appear
                }
            }
        }
        
        return {
            premiumHints: premiumHintCount,
            ultimateHints: ultimateHintCount,
            upgradeModalShown: upgradeModalShown
        };
    }

    async validateFeatureAccess(userRole) {
        const results = {
            userRole: userRole,
            premiumAccess: null,
            ultimateAccess: null,
            plantLimits: null,
            hints: null
        };

        try {
            results.premiumAccess = await this.validatePremiumAccess();
        } catch (e) {
            results.premiumAccess = { error: e.message };
        }

        try {
            results.ultimateAccess = await this.validateUltimateAccess();
        } catch (e) {
            results.ultimateAccess = { error: e.message };
        }

        try {
            results.plantLimits = await this.testPlantLimitEnforcement();
        } catch (e) {
            results.plantLimits = { error: e.message };
        }

        try {
            results.hints = await this.validateFeatureHints();
        } catch (e) {
            results.hints = { error: e.message };
        }

        return results;
    }
}

module.exports = PremiumFeaturesPage;