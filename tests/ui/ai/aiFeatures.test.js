/**
 * AI & ML FEATURES UI TESTS
 * =========================
 * 
 * Tests for UC12: Plant Disease Recognition UI
 * Tests for UC13: Growth Prediction & Analytics UI
 * Tests for UC14: AI Chatbot Consultation UI
 * 
 * UI testing with Selenium WebDriver:
 * - Image upload and analysis
 * - Growth prediction displays
 * - AI chatbot interactions
 * - Feature access controls
 */

const { Builder, By, until, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const firefox = require('selenium-webdriver/firefox');
const path = require('path');
const fs = require('fs');
const { setupTestDatabase, cleanupTestDatabase, createTestUser, clearTestUsers } = require('../../helpers/testHelpers');
const AIFeaturesPage = require('../../pages/AIFeaturesPage');
const ChatbotPage = require('../../pages/ChatbotPage');
const AnalyticsPage = require('../../pages/AnalyticsPage');
const LoginPage = require('../../pages/LoginPage');

describe('AI & ML Features UI Tests', () => {
    let driver;
    let aiFeaturesPage, chatbotPage, analyticsPage, loginPage;
    let basicUser, premiumUser, ultimateUser;
    let testImagePath;

    const browsers = process.env.TEST_BROWSER ? [process.env.TEST_BROWSER] : ['chrome'];

    browsers.forEach(browserName => {
        describe(`AI Features UI Tests - ${browserName}`, () => {
            beforeAll(async () => {
                await setupTestDatabase();

                // Create test users
                basicUser = await createTestUser('basic@ai.com', 'user', 'BasicUser123!');
                premiumUser = await createTestUser('premium@ai.com', 'Premium', 'PremiumUser123!');
                ultimateUser = await createTestUser('ultimate@ai.com', 'Ultimate', 'UltimateUser123!');

                // Setup test image
                testImagePath = path.join(__dirname, '../../fixtures/test-plant-disease.jpg');
                if (!fs.existsSync(testImagePath)) {
                    const testImageDir = path.dirname(testImagePath);
                    if (!fs.existsSync(testImageDir)) {
                        fs.mkdirSync(testImageDir, { recursive: true });
                    }
                    // Create a minimal test image
                    fs.writeFileSync(testImagePath, 'fake-image-data-for-testing');
                }

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
                aiFeaturesPage = new AIFeaturesPage(driver);
                chatbotPage = new ChatbotPage(driver);
                analyticsPage = new AnalyticsPage(driver);
                loginPage = new LoginPage(driver);
            });

            afterAll(async () => {
                if (driver) {
                    await driver.quit();
                }
                if (fs.existsSync(testImagePath)) {
                    fs.unlinkSync(testImagePath);
                }
                await clearTestUsers();
                await cleanupTestDatabase();
            });

            beforeEach(async () => {
                await driver.get('http://localhost:3000');
                await driver.manage().deleteAllCookies();
            });

            describe('UC12: Plant Disease Recognition UI', () => {
                describe('Image Analysis Interface', () => {
                    beforeEach(async () => {
                        await loginPage.login(ultimateUser.email, 'UltimateUser123!');
                        await driver.wait(until.urlContains('/dashboard'), 10000);
                    });

                    it('should display disease analysis page', async () => {
                        await driver.get('http://localhost:3000/ai/disease-recognition');
                        
                        await driver.wait(until.elementLocated(By.css('[data-testid="disease-analysis-page"]')), 10000);

                        const analysisPage = await driver.findElement(By.css('[data-testid="disease-analysis-page"]'));
                        expect(await analysisPage.isDisplayed()).toBe(true);

                        // Check for upload interface
                        const uploadArea = await driver.findElement(By.css('[data-testid="image-upload-area"]'));
                        expect(await uploadArea.isDisplayed()).toBe(true);

                        // Check for plant selection
                        const plantSelect = await driver.findElement(By.css('[data-testid="plant-select"]'));
                        expect(await plantSelect.isDisplayed()).toBe(true);

                        // Check for analyze button
                        const analyzeButton = await driver.findElement(By.css('[data-testid="analyze-image-btn"]'));
                        expect(await analyzeButton.isDisplayed()).toBe(true);
                    });

                    it('should handle image upload and selection', async () => {
                        await driver.get('http://localhost:3000/ai/disease-recognition');

                        // Upload image
                        const fileInput = await driver.findElement(By.css('input[type="file"][data-testid="image-upload"]'));
                        await fileInput.sendKeys(testImagePath);

                        // Wait for upload preview
                        await driver.wait(until.elementLocated(By.css('[data-testid="image-preview"]')), 10000);

                        const imagePreview = await driver.findElement(By.css('[data-testid="image-preview"]'));
                        expect(await imagePreview.isDisplayed()).toBe(true);

                        // Check file info display
                        const fileInfo = await driver.findElement(By.css('[data-testid="file-info"]'));
                        expect(await fileInfo.getText()).toContain('test-plant-disease.jpg');
                    });

                    it('should validate file type and size', async () => {
                        await driver.get('http://localhost:3000/ai/disease-recognition');

                        // Try to upload invalid file (create a text file)
                        const invalidFilePath = path.join(__dirname, '../../fixtures/invalid-file.txt');
                        fs.writeFileSync(invalidFilePath, 'This is not an image');

                        const fileInput = await driver.findElement(By.css('input[type="file"][data-testid="image-upload"]'));
                        await fileInput.sendKeys(invalidFilePath);

                        // Should show error message
                        await driver.wait(until.elementLocated(By.css('[data-testid="upload-error"]')), 5000);

                        const errorMessage = await driver.findElement(By.css('[data-testid="upload-error"]'));
                        expect(await errorMessage.getText()).toContain('Invalid file type');

                        fs.unlinkSync(invalidFilePath);
                    });

                    it('should perform disease analysis', async () => {
                        await driver.get('http://localhost:3000/ai/disease-recognition');

                        // Upload image
                        const fileInput = await driver.findElement(By.css('input[type="file"][data-testid="image-upload"]'));
                        await fileInput.sendKeys(testImagePath);

                        await driver.wait(until.elementLocated(By.css('[data-testid="image-preview"]')), 10000);

                        // Select plant (assuming plants exist)
                        const plantSelect = await driver.findElement(By.css('[data-testid="plant-select"]'));
                        await plantSelect.click();

                        const plantOption = await driver.findElement(By.css('[data-testid="plant-option"]:first-child'));
                        await plantOption.click();

                        // Click analyze button
                        const analyzeButton = await driver.findElement(By.css('[data-testid="analyze-image-btn"]'));
                        await analyzeButton.click();

                        // Wait for analysis results
                        await driver.wait(until.elementLocated(By.css('[data-testid="analysis-results"]')), 15000);

                        const results = await driver.findElement(By.css('[data-testid="analysis-results"]'));
                        expect(await results.isDisplayed()).toBe(true);

                        // Check for analysis components
                        const diseaseStatus = await driver.findElement(By.css('[data-testid="disease-status"]'));
                        expect(await diseaseStatus.isDisplayed()).toBe(true);

                        const confidence = await driver.findElement(By.css('[data-testid="confidence-score"]'));
                        expect(await confidence.isDisplayed()).toBe(true);
                    });

                    it('should display disease detection results', async () => {
                        await driver.get('http://localhost:3000/ai/disease-recognition');

                        // Simulate successful analysis (this would typically come from the API)
                        await driver.executeScript(`
                            window.mockAnalysisResult = {
                                disease_detected: true,
                                disease_name: 'Powdery Mildew',
                                confidence: 0.89,
                                severity: 'moderate',
                                treatment_suggestions: [
                                    'Apply fungicide spray',
                                    'Improve air circulation',
                                    'Reduce watering frequency'
                                ]
                            };
                        `);

                        // Trigger analysis display
                        const showResultsButton = await driver.findElement(By.css('[data-testid="show-mock-results"]'));
                        if (await showResultsButton.isDisplayed()) {
                            await showResultsButton.click();

                            // Verify disease information
                            const diseaseName = await driver.findElement(By.css('[data-testid="disease-name"]'));
                            expect(await diseaseName.getText()).toBe('Powdery Mildew');

                            const severity = await driver.findElement(By.css('[data-testid="severity-level"]'));
                            expect(await severity.getText()).toBe('moderate');

                            // Check treatment suggestions
                            const treatments = await driver.findElements(By.css('[data-testid="treatment-item"]'));
                            expect(treatments.length).toBeGreaterThan(0);

                            const firstTreatment = await treatments[0].getText();
                            expect(firstTreatment).toBe('Apply fungicide spray');
                        }
                    });

                    it('should display healthy plant results', async () => {
                        await driver.get('http://localhost:3000/ai/disease-recognition');

                        // Mock healthy plant result
                        await driver.executeScript(`
                            window.mockAnalysisResult = {
                                disease_detected: false,
                                health_score: 0.95,
                                general_condition: 'excellent',
                                care_suggestions: [
                                    'Continue current care routine',
                                    'Monitor for seasonal changes'
                                ]
                            };
                        `);

                        const showResultsButton = await driver.findElement(By.css('[data-testid="show-mock-results"]'));
                        if (await showResultsButton.isDisplayed()) {
                            await showResultsButton.click();

                            const healthStatus = await driver.findElement(By.css('[data-testid="health-status"]'));
                            expect(await healthStatus.getText()).toContain('Healthy');

                            const healthScore = await driver.findElement(By.css('[data-testid="health-score"]'));
                            expect(await healthScore.getText()).toContain('95%');
                        }
                    });

                    it('should show analysis history', async () => {
                        await driver.get('http://localhost:3000/ai/disease-recognition/history');

                        await driver.wait(until.elementLocated(By.css('[data-testid="analysis-history"]')), 10000);

                        const historyContainer = await driver.findElement(By.css('[data-testid="analysis-history"]'));
                        expect(await historyContainer.isDisplayed()).toBe(true);

                        // Check for history items (if any exist)
                        const historyItems = await driver.findElements(By.css('[data-testid="history-item"]'));
                        
                        if (historyItems.length > 0) {
                            const firstItem = historyItems[0];
                            expect(await firstItem.isDisplayed()).toBe(true);

                            const timestamp = await firstItem.findElement(By.css('[data-testid="analysis-date"]'));
                            expect(await timestamp.isDisplayed()).toBe(true);

                            const result = await firstItem.findElement(By.css('[data-testid="analysis-result"]'));
                            expect(await result.isDisplayed()).toBe(true);
                        }
                    });

                    it('should block access for non-Ultimate users', async () => {
                        await driver.manage().deleteAllCookies();
                        await loginPage.login(premiumUser.email, 'PremiumUser123!');

                        await driver.get('http://localhost:3000/ai/disease-recognition');

                        await driver.wait(until.elementLocated(By.css('[data-testid="access-denied"]')), 10000);

                        const accessDenied = await driver.findElement(By.css('[data-testid="access-denied"]'));
                        expect(await accessDenied.isDisplayed()).toBe(true);

                        const upgradeButton = await driver.findElement(By.css('[data-testid="upgrade-ultimate-btn"]'));
                        expect(await upgradeButton.isDisplayed()).toBe(true);
                    });
                });
            });

            describe('UC13: Growth Prediction & Analytics UI', () => {
                describe('Growth Prediction Interface', () => {
                    beforeEach(async () => {
                        await loginPage.login(ultimateUser.email, 'UltimateUser123!');
                        await driver.wait(until.urlContains('/dashboard'), 10000);
                    });

                    it('should display growth prediction page', async () => {
                        await driver.get('http://localhost:3000/ai/growth-prediction');

                        await driver.wait(until.elementLocated(By.css('[data-testid="growth-prediction-page"]')), 10000);

                        const predictionPage = await driver.findElement(By.css('[data-testid="growth-prediction-page"]'));
                        expect(await predictionPage.isDisplayed()).toBe(true);

                        // Check for plant selection
                        const plantSelect = await driver.findElement(By.css('[data-testid="prediction-plant-select"]'));
                        expect(await plantSelect.isDisplayed()).toBe(true);

                        // Check for prediction period input
                        const periodInput = await driver.findElement(By.css('[data-testid="prediction-period"]'));
                        expect(await periodInput.isDisplayed()).toBe(true);

                        // Check for prediction type selection
                        const typeSelect = await driver.findElement(By.css('[data-testid="prediction-type"]'));
                        expect(await typeSelect.isDisplayed()).toBe(true);
                    });

                    it('should configure prediction parameters', async () => {
                        await driver.get('http://localhost:3000/ai/growth-prediction');

                        // Select plant
                        const plantSelect = await driver.findElement(By.css('[data-testid="prediction-plant-select"]'));
                        await plantSelect.click();

                        const plantOption = await driver.findElement(By.css('[data-testid="plant-option"]:first-child'));
                        await plantOption.click();

                        // Set prediction period
                        const periodInput = await driver.findElement(By.css('[data-testid="prediction-period"]'));
                        await periodInput.clear();
                        await periodInput.sendKeys('30');

                        // Select prediction type
                        const typeSelect = await driver.findElement(By.css('[data-testid="prediction-type"]'));
                        await typeSelect.click();

                        const growthRateOption = await driver.findElement(By.css('[data-testid="type-option"][data-value="growth_rate"]'));
                        await growthRateOption.click();

                        // Generate prediction
                        const generateButton = await driver.findElement(By.css('[data-testid="generate-prediction-btn"]'));
                        await generateButton.click();

                        // Wait for prediction results
                        await driver.wait(until.elementLocated(By.css('[data-testid="prediction-results"]')), 15000);

                        const results = await driver.findElement(By.css('[data-testid="prediction-results"]'));
                        expect(await results.isDisplayed()).toBe(true);
                    });

                    it('should display growth timeline chart', async () => {
                        await driver.get('http://localhost:3000/ai/growth-prediction');

                        // Simulate prediction results
                        await driver.executeScript(`
                            window.mockPredictionResult = {
                                predicted_growth_rate: 0.85,
                                growth_timeline: [
                                    { day: 7, expected_height: 12.3 },
                                    { day: 14, expected_height: 14.1 },
                                    { day: 21, expected_height: 15.8 },
                                    { day: 30, expected_height: 18.2 }
                                ],
                                confidence: 0.78
                            };
                        `);

                        const showResultsButton = await driver.findElement(By.css('[data-testid="show-prediction-results"]'));
                        if (await showResultsButton.isDisplayed()) {
                            await showResultsButton.click();

                            // Check for growth chart
                            const growthChart = await driver.findElement(By.css('[data-testid="growth-timeline-chart"]'));
                            expect(await growthChart.isDisplayed()).toBe(true);

                            // Check for prediction metrics
                            const growthRate = await driver.findElement(By.css('[data-testid="growth-rate"]'));
                            expect(await growthRate.getText()).toContain('0.85');

                            const confidence = await driver.findElement(By.css('[data-testid="prediction-confidence"]'));
                            expect(await confidence.getText()).toContain('78%');
                        }
                    });

                    it('should show optimal conditions recommendations', async () => {
                        await driver.get('http://localhost:3000/ai/growth-prediction');

                        // Mock optimal conditions data
                        await driver.executeScript(`
                            window.mockOptimalConditions = {
                                moisture: { min: 60, max: 70 },
                                temperature: { min: 22, max: 26 },
                                light: { min: 600, max: 1000 }
                            };
                        `);

                        const showConditionsButton = await driver.findElement(By.css('[data-testid="show-optimal-conditions"]'));
                        if (await showConditionsButton.isDisplayed()) {
                            await showConditionsButton.click();

                            const conditionsPanel = await driver.findElement(By.css('[data-testid="optimal-conditions"]'));
                            expect(await conditionsPanel.isDisplayed()).toBe(true);

                            const moistureRange = await driver.findElement(By.css('[data-testid="moisture-range"]'));
                            expect(await moistureRange.getText()).toContain('60-70%');

                            const temperatureRange = await driver.findElement(By.css('[data-testid="temperature-range"]'));
                            expect(await temperatureRange.getText()).toContain('22-26°C');
                        }
                    });

                    it('should validate prediction period limits', async () => {
                        await driver.get('http://localhost:3000/ai/growth-prediction');

                        const periodInput = await driver.findElement(By.css('[data-testid="prediction-period"]'));
                        await periodInput.clear();
                        await periodInput.sendKeys('365'); // Invalid: too long

                        const generateButton = await driver.findElement(By.css('[data-testid="generate-prediction-btn"]'));
                        await generateButton.click();

                        const errorMessage = await driver.wait(
                            until.elementLocated(By.css('[data-testid="period-error"]')), 
                            5000
                        );
                        expect(await errorMessage.getText()).toContain('between 1 and 90 days');
                    });

                    it('should allow Premium users access', async () => {
                        await driver.manage().deleteAllCookies();
                        await loginPage.login(premiumUser.email, 'PremiumUser123!');

                        await driver.get('http://localhost:3000/ai/growth-prediction');

                        await driver.wait(until.elementLocated(By.css('[data-testid="growth-prediction-page"]')), 10000);

                        const predictionPage = await driver.findElement(By.css('[data-testid="growth-prediction-page"]'));
                        expect(await predictionPage.isDisplayed()).toBe(true);
                    });

                    it('should block Basic users', async () => {
                        await driver.manage().deleteAllCookies();
                        await loginPage.login(basicUser.email, 'BasicUser123!');

                        await driver.get('http://localhost:3000/ai/growth-prediction');

                        await driver.wait(until.elementLocated(By.css('[data-testid="access-denied"]')), 10000);

                        const accessDenied = await driver.findElement(By.css('[data-testid="access-denied"]'));
                        expect(await accessDenied.isDisplayed()).toBe(true);
                    });
                });

                describe('Growth Analytics Dashboard', () => {
                    beforeEach(async () => {
                        await loginPage.login(ultimateUser.email, 'UltimateUser123!');
                    });

                    it('should display comprehensive growth analytics', async () => {
                        await driver.get('http://localhost:3000/analytics/growth');

                        await driver.wait(until.elementLocated(By.css('[data-testid="growth-analytics"]')), 10000);

                        // Check for analytics components
                        const growthSummary = await driver.findElement(By.css('[data-testid="growth-summary"]'));
                        expect(await growthSummary.isDisplayed()).toBe(true);

                        const environmentalCorrelation = await driver.findElement(By.css('[data-testid="environmental-correlation"]'));
                        expect(await environmentalCorrelation.isDisplayed()).toBe(true);

                        const recommendations = await driver.findElement(By.css('[data-testid="growth-recommendations"]'));
                        expect(await recommendations.isDisplayed()).toBe(true);
                    });

                    it('should show correlation charts', async () => {
                        await driver.get('http://localhost:3000/analytics/growth');

                        const correlationCharts = await driver.findElements(By.css('[data-testid="correlation-chart"]'));
                        expect(correlationCharts.length).toBeGreaterThan(0);

                        for (const chart of correlationCharts) {
                            expect(await chart.isDisplayed()).toBe(true);
                        }
                    });
                });
            });

            describe('UC14: AI Chatbot Consultation UI', () => {
                describe('Chatbot Interface', () => {
                    beforeEach(async () => {
                        await loginPage.login(ultimateUser.email, 'UltimateUser123!');
                        await driver.wait(until.urlContains('/dashboard'), 10000);
                    });

                    it('should display AI consultation page', async () => {
                        await driver.get('http://localhost:3000/ai/consultation');

                        await driver.wait(until.elementLocated(By.css('[data-testid="ai-consultation-page"]')), 10000);

                        const consultationPage = await driver.findElement(By.css('[data-testid="ai-consultation-page"]'));
                        expect(await consultationPage.isDisplayed()).toBe(true);

                        // Check for chat interface
                        const chatInterface = await driver.findElement(By.css('[data-testid="chat-interface"]'));
                        expect(await chatInterface.isDisplayed()).toBe(true);

                        // Check for message input
                        const messageInput = await driver.findElement(By.css('[data-testid="message-input"]'));
                        expect(await messageInput.isDisplayed()).toBe(true);

                        // Check for send button
                        const sendButton = await driver.findElement(By.css('[data-testid="send-message-btn"]'));
                        expect(await sendButton.isDisplayed()).toBe(true);
                    });

                    it('should send and receive chat messages', async () => {
                        await driver.get('http://localhost:3000/ai/consultation');

                        const messageInput = await driver.findElement(By.css('[data-testid="message-input"]'));
                        const sendButton = await driver.findElement(By.css('[data-testid="send-message-btn"]'));

                        // Type message
                        await messageInput.sendKeys('My tomato leaves are turning yellow, what should I do?');

                        // Send message
                        await sendButton.click();

                        // Wait for user message to appear
                        await driver.wait(until.elementLocated(By.css('[data-testid="user-message"]')), 10000);

                        const userMessage = await driver.findElement(By.css('[data-testid="user-message"]'));
                        expect(await userMessage.getText()).toContain('tomato leaves are turning yellow');

                        // Wait for AI response
                        await driver.wait(until.elementLocated(By.css('[data-testid="ai-message"]')), 15000);

                        const aiMessage = await driver.findElement(By.css('[data-testid="ai-message"]'));
                        expect(await aiMessage.isDisplayed()).toBe(true);

                        // Check for response content
                        const responseText = await aiMessage.getText();
                        expect(responseText.length).toBeGreaterThan(0);
                    });

                    it('should display AI response with suggestions', async () => {
                        await driver.get('http://localhost:3000/ai/consultation');

                        // Simulate sending a message and receiving response
                        const messageInput = await driver.findElement(By.css('[data-testid="message-input"]'));
                        await messageInput.sendKeys('What fertilizer should I use?');

                        const sendButton = await driver.findElement(By.css('[data-testid="send-message-btn"]'));
                        await sendButton.click();

                        await driver.wait(until.elementLocated(By.css('[data-testid="ai-message"]')), 15000);

                        // Check for suggested actions
                        const suggestions = await driver.findElements(By.css('[data-testid="suggested-action"]'));
                        if (suggestions.length > 0) {
                            expect(await suggestions[0].isDisplayed()).toBe(true);
                        }

                        // Check for follow-up questions
                        const followUps = await driver.findElements(By.css('[data-testid="followup-question"]'));
                        if (followUps.length > 0) {
                            expect(await followUps[0].isDisplayed()).toBe(true);
                        }
                    });

                    it('should handle plant-specific consultations', async () => {
                        await driver.get('http://localhost:3000/ai/consultation');

                        // Select a specific plant for consultation
                        const plantSelector = await driver.findElement(By.css('[data-testid="consultation-plant-select"]'));
                        if (await plantSelector.isDisplayed()) {
                            await plantSelector.click();

                            const plantOption = await driver.findElement(By.css('[data-testid="plant-option"]:first-child'));
                            await plantOption.click();

                            // Plant context should be displayed
                            const plantContext = await driver.findElement(By.css('[data-testid="plant-context"]'));
                            expect(await plantContext.isDisplayed()).toBe(true);
                        }
                    });

                    it('should show typing indicator during AI processing', async () => {
                        await driver.get('http://localhost:3000/ai/consultation');

                        const messageInput = await driver.findElement(By.css('[data-testid="message-input"]'));
                        await messageInput.sendKeys('Help me with my plant care');

                        const sendButton = await driver.findElement(By.css('[data-testid="send-message-btn"]'));
                        await sendButton.click();

                        // Should show typing indicator
                        const typingIndicator = await driver.wait(
                            until.elementLocated(By.css('[data-testid="ai-typing"]')), 
                            5000
                        );
                        expect(await typingIndicator.isDisplayed()).toBe(true);
                        expect(await typingIndicator.getText()).toContain('AI is typing');
                    });

                    it('should display chat history', async () => {
                        await driver.get('http://localhost:3000/ai/consultation');

                        // Send a few messages to create history
                        const messageInput = await driver.findElement(By.css('[data-testid="message-input"]'));
                        const sendButton = await driver.findElement(By.css('[data-testid="send-message-btn"]'));

                        // First message
                        await messageInput.sendKeys('Hello');
                        await sendButton.click();
                        await driver.wait(until.elementLocated(By.css('[data-testid="user-message"]')), 10000);

                        // Second message
                        await messageInput.clear();
                        await messageInput.sendKeys('How are my plants?');
                        await sendButton.click();

                        // Wait for messages to appear
                        await driver.sleep(2000);

                        const userMessages = await driver.findElements(By.css('[data-testid="user-message"]'));
                        expect(userMessages.length).toBe(2);

                        const chatHistory = await driver.findElement(By.css('[data-testid="chat-history"]'));
                        expect(await chatHistory.isDisplayed()).toBe(true);
                    });

                    it('should show conversation starters', async () => {
                        await driver.get('http://localhost:3000/ai/consultation');

                        const conversationStarters = await driver.findElements(By.css('[data-testid="conversation-starter"]'));
                        
                        if (conversationStarters.length > 0) {
                            expect(await conversationStarters[0].isDisplayed()).toBe(true);

                            // Click on a starter
                            await conversationStarters[0].click();

                            // Should populate message input
                            const messageInput = await driver.findElement(By.css('[data-testid="message-input"]'));
                            const inputValue = await messageInput.getAttribute('value');
                            expect(inputValue.length).toBeGreaterThan(0);
                        }
                    });

                    it('should validate message length', async () => {
                        await driver.get('http://localhost:3000/ai/consultation');

                        const messageInput = await driver.findElement(By.css('[data-testid="message-input"]'));
                        const longMessage = 'a'.repeat(10000); // Very long message
                        
                        await messageInput.sendKeys(longMessage);

                        const sendButton = await driver.findElement(By.css('[data-testid="send-message-btn"]'));
                        await sendButton.click();

                        const errorMessage = await driver.wait(
                            until.elementLocated(By.css('[data-testid="message-error"]')), 
                            5000
                        );
                        expect(await errorMessage.getText()).toContain('Message too long');
                    });

                    it('should require Ultimate subscription', async () => {
                        await driver.manage().deleteAllCookies();
                        await loginPage.login(premiumUser.email, 'PremiumUser123!');

                        await driver.get('http://localhost:3000/ai/consultation');

                        await driver.wait(until.elementLocated(By.css('[data-testid="access-denied"]')), 10000);

                        const accessDenied = await driver.findElement(By.css('[data-testid="access-denied"]'));
                        expect(await accessDenied.isDisplayed()).toBe(true);

                        const message = await driver.findElement(By.css('[data-testid="access-message"]'));
                        expect(await message.getText()).toContain('Ultimate');
                    });
                });

                describe('Chat History Management', () => {
                    beforeEach(async () => {
                        await loginPage.login(ultimateUser.email, 'UltimateUser123!');
                    });

                    it('should display chat history page', async () => {
                        await driver.get('http://localhost:3000/ai/consultation/history');

                        await driver.wait(until.elementLocated(By.css('[data-testid="chat-history-page"]')), 10000);

                        const historyPage = await driver.findElement(By.css('[data-testid="chat-history-page"]'));
                        expect(await historyPage.isDisplayed()).toBe(true);

                        // Check for conversation list
                        const conversationList = await driver.findElement(By.css('[data-testid="conversation-list"]'));
                        expect(await conversationList.isDisplayed()).toBe(true);
                    });

                    it('should filter conversations by date', async () => {
                        await driver.get('http://localhost:3000/ai/consultation/history');

                        const dateFilter = await driver.findElement(By.css('[data-testid="date-filter"]'));
                        await dateFilter.click();

                        const todayOption = await driver.findElement(By.css('[data-testid="filter-today"]'));
                        await todayOption.click();

                        // Conversations should be filtered
                        await driver.wait(until.elementLocated(By.css('[data-testid="filtered-conversations"]')), 5000);
                    });

                    it('should search conversations', async () => {
                        await driver.get('http://localhost:3000/ai/consultation/history');

                        const searchInput = await driver.findElement(By.css('[data-testid="conversation-search"]'));
                        await searchInput.sendKeys('tomato');

                        const searchButton = await driver.findElement(By.css('[data-testid="search-conversations-btn"]'));
                        await searchButton.click();

                        // Should show filtered results
                        await driver.wait(until.elementLocated(By.css('[data-testid="search-results"]')), 5000);
                    });
                });
            });

            describe('Responsive Design Tests', () => {
                it('should work on mobile devices', async () => {
                    await driver.manage().window().setRect({ width: 375, height: 667 });
                    
                    await loginPage.login(ultimateUser.email, 'UltimateUser123!');
                    await driver.get('http://localhost:3000/ai/consultation');

                    const chatInterface = await driver.findElement(By.css('[data-testid="chat-interface"]'));
                    expect(await chatInterface.isDisplayed()).toBe(true);

                    // Mobile input should be responsive
                    const messageInput = await driver.findElement(By.css('[data-testid="message-input"]'));
                    expect(await messageInput.isDisplayed()).toBe(true);
                });

                it('should work on tablet devices', async () => {
                    await driver.manage().window().setRect({ width: 768, height: 1024 });
                    
                    await loginPage.login(ultimateUser.email, 'UltimateUser123!');
                    await driver.get('http://localhost:3000/ai/disease-recognition');

                    const uploadArea = await driver.findElement(By.css('[data-testid="image-upload-area"]'));
                    expect(await uploadArea.isDisplayed()).toBe(true);

                    const plantSelect = await driver.findElement(By.css('[data-testid="plant-select"]'));
                    expect(await plantSelect.isDisplayed()).toBe(true);
                });
            });
        });
    });
});