/**
 * PAYMENT PAGE OBJECT
 * ==================
 * 
 * Page Object Model for payment-related UI interactions
 * Handles payment modal, bank selection, and payment processing
 */

const { By, until } = require('selenium-webdriver');

class PaymentPage {
    constructor(driver) {
        this.driver = driver;
        
        // Payment modal elements
        this.paymentModal = By.css('[data-testid="payment-modal"]');
        this.selectedPlan = By.css('[data-testid="selected-plan"]');
        this.paymentAmount = By.css('[data-testid="payment-amount"]');
        this.bankSelect = By.css('[data-testid="bank-select"]');
        this.submitPaymentButton = By.css('[data-testid="submit-payment-btn"]');
        this.paymentProcessing = By.css('[data-testid="payment-processing"]');
        this.closeModalButton = By.css('[data-testid="close-payment-modal"]');
        
        // Bank selection elements
        this.bankOption = (bankCode) => By.css(`[data-testid="bank-option"][data-value="${bankCode}"]`);
        this.bankError = By.css('[data-testid="bank-error"]');
        
        // Payment success/failure elements
        this.paymentSuccess = By.css('[data-testid="payment-success"]');
        this.paymentFailed = By.css('[data-testid="payment-failed"]');
        this.successMessage = By.css('[data-testid="success-message"]');
        this.failureMessage = By.css('[data-testid="failure-message"]');
        this.continueButton = By.css('[data-testid="continue-btn"]');
        this.retryPaymentButton = By.css('[data-testid="retry-payment-btn"]');
        this.orderInfo = By.css('[data-testid="order-info"]');
        this.amountInfo = By.css('[data-testid="amount-info"]');
        this.errorReason = By.css('[data-testid="error-reason"]');
    }

    async waitForPaymentModal() {
        await this.driver.wait(until.elementLocated(this.paymentModal), 10000);
        return await this.driver.findElement(this.paymentModal);
    }

    async getSelectedPlan() {
        const element = await this.driver.findElement(this.selectedPlan);
        return await element.getText();
    }

    async getPaymentAmount() {
        const element = await this.driver.findElement(this.paymentAmount);
        return await element.getText();
    }

    async selectBank(bankCode) {
        // Open bank dropdown
        const bankSelect = await this.driver.findElement(this.bankSelect);
        await bankSelect.click();
        
        // Select specific bank
        const bankOption = await this.driver.findElement(this.bankOption(bankCode));
        await bankOption.click();
    }

    async submitPayment() {
        const submitButton = await this.driver.findElement(this.submitPaymentButton);
        await this.driver.wait(until.elementIsEnabled(submitButton), 5000);
        await submitButton.click();
    }

    async waitForProcessing() {
        await this.driver.wait(until.elementLocated(this.paymentProcessing), 10000);
        return await this.driver.findElement(this.paymentProcessing);
    }

    async getBankError() {
        const element = await this.driver.findElement(this.bankError);
        return await element.getText();
    }

    async closeModal() {
        const closeButton = await this.driver.findElement(this.closeModalButton);
        await closeButton.click();
    }

    async waitForSuccessPage() {
        await this.driver.wait(until.elementLocated(this.paymentSuccess), 10000);
        return await this.driver.findElement(this.paymentSuccess);
    }

    async waitForFailurePage() {
        await this.driver.wait(until.elementLocated(this.paymentFailed), 10000);
        return await this.driver.findElement(this.paymentFailed);
    }

    async getSuccessMessage() {
        const element = await this.driver.findElement(this.successMessage);
        return await element.getText();
    }

    async getFailureMessage() {
        const element = await this.driver.findElement(this.failureMessage);
        return await element.getText();
    }

    async getOrderInfo() {
        const element = await this.driver.findElement(this.orderInfo);
        return await element.getText();
    }

    async getAmountInfo() {
        const element = await this.driver.findElement(this.amountInfo);
        return await element.getText();
    }

    async getErrorReason() {
        const element = await this.driver.findElement(this.errorReason);
        return await element.getText();
    }

    async clickContinue() {
        const continueButton = await this.driver.findElement(this.continueButton);
        await continueButton.click();
    }

    async clickRetryPayment() {
        const retryButton = await this.driver.findElement(this.retryPaymentButton);
        await retryButton.click();
    }

    async validatePaymentModal() {
        const modal = await this.waitForPaymentModal();
        const isVisible = await modal.isDisplayed();
        
        if (!isVisible) {
            throw new Error('Payment modal is not visible');
        }

        // Validate modal components
        const plan = await this.driver.findElement(this.selectedPlan);
        const amount = await this.driver.findElement(this.paymentAmount);
        const bankSelect = await this.driver.findElement(this.bankSelect);
        
        return {
            plan: await plan.getText(),
            amount: await amount.getText(),
            hasBankSelect: await bankSelect.isDisplayed()
        };
    }

    async performCompletePaymentFlow(bankCode) {
        // Wait for modal
        await this.waitForPaymentModal();
        
        // Select bank
        await this.selectBank(bankCode);
        
        // Submit payment
        await this.submitPayment();
        
        // Wait for processing
        await this.waitForProcessing();
    }
}

module.exports = PaymentPage;