/**
 * AI FEATURES PAGE OBJECT
 * =======================
 * 
 * Page Object Model for AI disease recognition UI
 * Handles image upload, analysis, and results display
 */

const { By, until } = require('selenium-webdriver');

class AIFeaturesPage {
    constructor(driver) {
        this.driver = driver;
        
        // Disease Analysis elements
        this.diseaseAnalysisPage = By.css('[data-testid="disease-analysis-page"]');
        this.imageUploadArea = By.css('[data-testid="image-upload-area"]');
        this.imageUpload = By.css('input[type="file"][data-testid="image-upload"]');
        this.imagePreview = By.css('[data-testid="image-preview"]');
        this.fileInfo = By.css('[data-testid="file-info"]');
        this.uploadError = By.css('[data-testid="upload-error"]');
        this.plantSelect = By.css('[data-testid="plant-select"]');
        this.plantOption = By.css('[data-testid="plant-option"]');
        this.analyzeImageButton = By.css('[data-testid="analyze-image-btn"]');
        
        // Analysis Results elements
        this.analysisResults = By.css('[data-testid="analysis-results"]');
        this.diseaseStatus = By.css('[data-testid="disease-status"]');
        this.diseaseName = By.css('[data-testid="disease-name"]');
        this.confidenceScore = By.css('[data-testid="confidence-score"]');
        this.severityLevel = By.css('[data-testid="severity-level"]');
        this.treatmentItem = By.css('[data-testid="treatment-item"]');
        this.healthStatus = By.css('[data-testid="health-status"]');
        this.healthScore = By.css('[data-testid="health-score"]');
        
        // Analysis History elements
        this.analysisHistory = By.css('[data-testid="analysis-history"]');
        this.historyItem = By.css('[data-testid="history-item"]');
        this.analysisDate = By.css('[data-testid="analysis-date"]');
        this.analysisResult = By.css('[data-testid="analysis-result"]');
        
        // Access Control elements
        this.accessDenied = By.css('[data-testid="access-denied"]');
        this.upgradeUltimateButton = By.css('[data-testid="upgrade-ultimate-btn"]');
    }

    async navigateToDiseaseAnalysis() {
        await this.driver.get('http://localhost:3000/ai/disease-recognition');
        await this.driver.wait(until.elementLocated(this.diseaseAnalysisPage), 10000);
    }

    async navigateToAnalysisHistory() {
        await this.driver.get('http://localhost:3000/ai/disease-recognition/history');
        await this.driver.wait(until.elementLocated(this.analysisHistory), 10000);
    }

    async uploadImage(imagePath) {
        const fileInput = await this.driver.findElement(this.imageUpload);
        await fileInput.sendKeys(imagePath);
        
        // Wait for preview to appear
        await this.driver.wait(until.elementLocated(this.imagePreview), 10000);
    }

    async selectPlant(plantIndex = 0) {
        const plantSelect = await this.driver.findElement(this.plantSelect);
        await plantSelect.click();
        
        const plantOptions = await this.driver.findElements(this.plantOption);
        if (plantOptions.length > plantIndex) {
            await plantOptions[plantIndex].click();
        }
    }

    async analyzeImage() {
        const analyzeButton = await this.driver.findElement(this.analyzeImageButton);
        await analyzeButton.click();
        
        // Wait for results
        await this.driver.wait(until.elementLocated(this.analysisResults), 15000);
    }

    async getAnalysisResults() {
        const results = {};
        
        try {
            const diseaseStatus = await this.driver.findElement(this.diseaseStatus);
            results.diseaseDetected = (await diseaseStatus.getText()).includes('Disease Detected');
            
            if (results.diseaseDetected) {
                const diseaseName = await this.driver.findElement(this.diseaseName);
                results.diseaseName = await diseaseName.getText();
                
                const severity = await this.driver.findElement(this.severityLevel);
                results.severity = await severity.getText();
                
                const treatments = await this.driver.findElements(this.treatmentItem);
                results.treatments = await Promise.all(
                    treatments.map(treatment => treatment.getText())
                );
            } else {
                const healthScore = await this.driver.findElement(this.healthScore);
                results.healthScore = await healthScore.getText();
            }
            
            const confidence = await this.driver.findElement(this.confidenceScore);
            results.confidence = await confidence.getText();
        } catch (e) {
            results.error = e.message;
        }
        
        return results;
    }

    async getFileInfo() {
        const fileInfo = await this.driver.findElement(this.fileInfo);
        return await fileInfo.getText();
    }

    async getUploadError() {
        try {
            const error = await this.driver.findElement(this.uploadError);
            return await error.getText();
        } catch (e) {
            return null;
        }
    }

    async getAnalysisHistory() {
        const historyItems = await this.driver.findElements(this.historyItem);
        const history = [];
        
        for (let item of historyItems) {
            const date = await item.findElement(this.analysisDate);
            const result = await item.findElement(this.analysisResult);
            
            history.push({
                date: await date.getText(),
                result: await result.getText()
            });
        }
        
        return history;
    }

    async isAccessDenied() {
        try {
            const accessDenied = await this.driver.findElement(this.accessDenied);
            return await accessDenied.isDisplayed();
        } catch (e) {
            return false;
        }
    }

    async hasUpgradeButton() {
        try {
            const upgradeButton = await this.driver.findElement(this.upgradeUltimateButton);
            return await upgradeButton.isDisplayed();
        } catch (e) {
            return false;
        }
    }

    async validateImageUploadInterface() {
        const uploadArea = await this.driver.findElement(this.imageUploadArea);
        const plantSelect = await this.driver.findElement(this.plantSelect);
        const analyzeButton = await this.driver.findElement(this.analyzeImageButton);
        
        return {
            uploadAreaVisible: await uploadArea.isDisplayed(),
            plantSelectVisible: await plantSelect.isDisplayed(),
            analyzeButtonVisible: await analyzeButton.isDisplayed()
        };
    }

    async performCompleteAnalysis(imagePath, plantIndex = 0) {
        await this.uploadImage(imagePath);
        await this.selectPlant(plantIndex);
        await this.analyzeImage();
        return await this.getAnalysisResults();
    }
}

module.exports = AIFeaturesPage;