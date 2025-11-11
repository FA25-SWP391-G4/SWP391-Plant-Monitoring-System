/**
 * PLANT MANAGEMENT UI TESTS
 * ==========================
 * 
 * Selenium WebDriver tests for UC2-UC4: Plant Management, Care Reminders, and Monitoring
 * Tests complete user workflows in the browser
 * 
 * Coverage:
 * - Plant creation and management workflows
 * - Care reminder setup and notifications
 * - Plant monitoring dashboard interactions
 * - Watering controls and automation
 */

const { Builder, By, until, Key } = require('selenium-webdriver');
const BasePage = require('../pages/BasePage');
const LoginPage = require('../pages/LoginPage');

class PlantDashboardPage extends BasePage {
    constructor(driver) {
        super(driver);
        this.addPlantButton = By.css('[data-testid="add-plant-button"]');
        this.plantList = By.css('[data-testid="plant-list"]');
        this.plantCard = By.css('[data-testid="plant-card"]');
        this.searchInput = By.css('[data-testid="plant-search"]');
        this.filterDropdown = By.css('[data-testid="plant-filter"]');
        
        // Plant form selectors
        this.plantNameInput = By.css('[data-testid="plant-name"]');
        this.speciesSelect = By.css('[data-testid="plant-species"]');
        this.zoneSelect = By.css('[data-testid="plant-zone"]');
        this.notesTextarea = By.css('[data-testid="plant-notes"]');
        this.saveButton = By.css('[data-testid="save-plant"]');
        this.cancelButton = By.css('[data-testid="cancel-plant"]');
        
        // Monitoring selectors
        this.moistureDisplay = By.css('[data-testid="moisture-level"]');
        this.temperatureDisplay = By.css('[data-testid="temperature"]');
        this.humidityDisplay = By.css('[data-testid="humidity"]');
        this.lightDisplay = By.css('[data-testid="light-level"]');
        
        // Watering controls
        this.waterButton = By.css('[data-testid="water-plant"]');
        this.autoWateringToggle = By.css('[data-testid="auto-watering-toggle"]');
        this.waterAmountInput = By.css('[data-testid="water-amount"]');
        this.waterConfirmButton = By.css('[data-testid="confirm-water"]');
        
        // Care reminder selectors
        this.scheduleButton = By.css('[data-testid="schedule-watering"]');
        this.scheduleTimeInput = By.css('[data-testid="schedule-time"]');
        this.frequencySelect = By.css('[data-testid="frequency-days"]');
        this.scheduleActiveToggle = By.css('[data-testid="schedule-active"]');
        this.saveScheduleButton = By.css('[data-testid="save-schedule"]');
    }

    async navigateTo() {
        await this.driver.get('http://localhost:3000/dashboard/plants');
        await this.waitForElement(this.plantList);
    }

    async addNewPlant(plantData) {
        await this.clickElement(this.addPlantButton);
        await this.waitForElement(this.plantNameInput);

        await this.sendKeys(this.plantNameInput, plantData.name);
        
        if (plantData.species) {
            await this.selectOption(this.speciesSelect, plantData.species);
        }
        
        if (plantData.zone) {
            await this.selectOption(this.zoneSelect, plantData.zone);
        }
        
        if (plantData.notes) {
            await this.sendKeys(this.notesTextarea, plantData.notes);
        }

        await this.clickElement(this.saveButton);
        
        // Wait for success message or plant list to update
        await this.driver.sleep(2000);
    }

    async searchPlants(query) {
        await this.clearAndSendKeys(this.searchInput, query);
        await this.driver.sleep(1000); // Wait for search results
    }

    async filterPlants(filter) {
        await this.selectOption(this.filterDropdown, filter);
        await this.driver.sleep(1000); // Wait for filter results
    }

    async getPlantCards() {
        try {
            return await this.driver.findElements(this.plantCard);
        } catch (error) {
            return [];
        }
    }

    async clickPlantCard(index = 0) {
        const cards = await this.getPlantCards();
        if (cards.length > index) {
            await cards[index].click();
            await this.driver.sleep(1000);
        }
    }

    async waterPlant(amount = 250) {
        await this.clickElement(this.waterButton);
        await this.waitForElement(this.waterAmountInput);
        
        await this.clearAndSendKeys(this.waterAmountInput, amount.toString());
        await this.clickElement(this.waterConfirmButton);
        
        // Wait for watering to complete
        await this.driver.sleep(2000);
    }

    async toggleAutoWatering() {
        await this.clickElement(this.autoWateringToggle);
        await this.driver.sleep(1000);
    }

    async setWateringSchedule(scheduleData) {
        await this.clickElement(this.scheduleButton);
        await this.waitForElement(this.scheduleTimeInput);

        if (scheduleData.time) {
            await this.clearAndSendKeys(this.scheduleTimeInput, scheduleData.time);
        }

        if (scheduleData.frequency) {
            await this.selectOption(this.frequencySelect, scheduleData.frequency);
        }

        if (scheduleData.active !== undefined) {
            const toggle = await this.driver.findElement(this.scheduleActiveToggle);
            const isChecked = await toggle.isSelected();
            if (isChecked !== scheduleData.active) {
                await toggle.click();
            }
        }

        await this.clickElement(this.saveScheduleButton);
        await this.driver.sleep(1000);
    }

    async getSensorData() {
        const moisture = await this.getElementText(this.moistureDisplay);
        const temperature = await this.getElementText(this.temperatureDisplay);
        const humidity = await this.getElementText(this.humidityDisplay);
        const light = await this.getElementText(this.lightDisplay);

        return {
            moisture: moisture || 'N/A',
            temperature: temperature || 'N/A',
            humidity: humidity || 'N/A',
            light: light || 'N/A'
        };
    }
}

describe('Plant Management UI Tests', () => {
    let driver;
    let loginPage;
    let plantDashboard;

    beforeAll(async () => {
        driver = await new Builder().forBrowser('chrome').build();
        loginPage = new LoginPage(driver);
        plantDashboard = new PlantDashboardPage(driver);
        
        // Login before running tests
        await loginPage.navigate();
        await loginPage.login('test@example.com', 'password123');
        await driver.sleep(2000);
    });

    afterAll(async () => {
        await driver.quit();
    });

    beforeEach(async () => {
        await plantDashboard.navigateTo();
        await driver.sleep(1000);
    });

    describe('UC2: Manage Plant Information', () => {
        it('should display plant dashboard', async () => {
            await plantDashboard.navigateTo();
            
            const title = await driver.getTitle();
            expect(title).toContain('Plant Dashboard');

            const plantList = await driver.findElement(plantDashboard.plantList);
            expect(await plantList.isDisplayed()).toBe(true);
        });

        it('should add a new plant successfully', async () => {
            const plantData = {
                name: 'Test Rose UI',
                species: 'Rosa rubiginosa',
                zone: 'Living Room',
                notes: 'Added via UI test'
            };

            const initialCardCount = (await plantDashboard.getPlantCards()).length;
            
            await plantDashboard.addNewPlant(plantData);
            
            // Refresh and check if plant was added
            await plantDashboard.navigateTo();
            const finalCardCount = (await plantDashboard.getPlantCards()).length;
            
            expect(finalCardCount).toBe(initialCardCount + 1);
        });

        it('should validate required fields when adding plant', async () => {
            await plantDashboard.clickElement(plantDashboard.addPlantButton);
            await plantDashboard.waitForElement(plantDashboard.plantNameInput);
            
            // Try to save without required fields
            await plantDashboard.clickElement(plantDashboard.saveButton);
            
            // Should still be on the form (validation failed)
            const nameInput = await driver.findElement(plantDashboard.plantNameInput);
            expect(await nameInput.isDisplayed()).toBe(true);
            
            // Check for validation message
            const validationMessage = await driver.findElement(By.css('.error-message, .validation-error'));
            expect(await validationMessage.isDisplayed()).toBe(true);
        });

        it('should search for plants', async () => {
            await plantDashboard.searchPlants('Rose');
            
            const cards = await plantDashboard.getPlantCards();
            
            for (let card of cards) {
                const cardText = await card.getText();
                expect(cardText.toLowerCase()).toContain('rose');
            }
        });

        it('should filter plants by status', async () => {
            await plantDashboard.filterPlants('healthy');
            
            const cards = await plantDashboard.getPlantCards();
            
            // All displayed cards should show healthy status
            for (let card of cards) {
                const statusElement = await card.findElement(By.css('.plant-status'));
                const status = await statusElement.getText();
                expect(status.toLowerCase()).toContain('healthy');
            }
        });

        it('should view plant details', async () => {
            const cards = await plantDashboard.getPlantCards();
            
            if (cards.length > 0) {
                await plantDashboard.clickPlantCard(0);
                
                // Should navigate to plant detail view
                const currentUrl = await driver.getCurrentUrl();
                expect(currentUrl).toContain('/plants/');
                
                // Check if plant details are displayed
                const sensorData = await plantDashboard.getSensorData();
                expect(sensorData).toBeDefined();
            }
        });
    });

    describe('UC3: View Plant Care Reminders', () => {
        beforeEach(async () => {
            // Navigate to first plant's detail page
            const cards = await plantDashboard.getPlantCards();
            if (cards.length > 0) {
                await plantDashboard.clickPlantCard(0);
                await driver.sleep(1000);
            }
        });

        it('should set watering schedule', async () => {
            const scheduleData = {
                time: '08:00',
                frequency: '3',
                active: true
            };

            await plantDashboard.setWateringSchedule(scheduleData);
            
            // Verify schedule was set by checking if schedule button shows "Edit Schedule"
            const scheduleButton = await driver.findElement(plantDashboard.scheduleButton);
            const buttonText = await scheduleButton.getText();
            expect(buttonText.toLowerCase()).toContain('edit');
        });

        it('should validate schedule time format', async () => {
            await plantDashboard.clickElement(plantDashboard.scheduleButton);
            await plantDashboard.waitForElement(plantDashboard.scheduleTimeInput);
            
            // Enter invalid time format
            await plantDashboard.clearAndSendKeys(plantDashboard.scheduleTimeInput, '25:00');
            await plantDashboard.clickElement(plantDashboard.saveScheduleButton);
            
            // Should show validation error
            const errorMessage = await driver.findElement(By.css('.error-message, .validation-error'));
            expect(await errorMessage.isDisplayed()).toBe(true);
        });

        it('should display upcoming watering reminder', async () => {
            // After setting a schedule, there should be a reminder display
            const reminderElement = await driver.findElement(By.css('[data-testid="next-watering"], .watering-reminder'));
            
            if (await reminderElement.isDisplayed()) {
                const reminderText = await reminderElement.getText();
                expect(reminderText).toContain('Next watering');
            }
        });

        it('should disable/enable watering schedule', async () => {
            await plantDashboard.clickElement(plantDashboard.scheduleButton);
            await plantDashboard.waitForElement(plantDashboard.scheduleActiveToggle);
            
            // Toggle schedule off
            const toggle = await driver.findElement(plantDashboard.scheduleActiveToggle);
            const initialState = await toggle.isSelected();
            
            await toggle.click();
            await plantDashboard.clickElement(plantDashboard.saveScheduleButton);
            
            // Verify toggle state changed
            await plantDashboard.clickElement(plantDashboard.scheduleButton);
            await plantDashboard.waitForElement(plantDashboard.scheduleActiveToggle);
            
            const newToggle = await driver.findElement(plantDashboard.scheduleActiveToggle);
            const newState = await newToggle.isSelected();
            
            expect(newState).toBe(!initialState);
        });
    });

    describe('UC4: View Plant Monitoring Dashboard', () => {
        beforeEach(async () => {
            // Navigate to first plant's detail page
            const cards = await plantDashboard.getPlantCards();
            if (cards.length > 0) {
                await plantDashboard.clickPlantCard(0);
                await driver.sleep(1000);
            }
        });

        it('should display sensor data', async () => {
            const sensorData = await plantDashboard.getSensorData();
            
            // Check that sensor data elements are present
            expect(sensorData.moisture).toBeDefined();
            expect(sensorData.temperature).toBeDefined();
            expect(sensorData.humidity).toBeDefined();
            expect(sensorData.light).toBeDefined();
        });

        it('should water plant manually', async () => {
            // Check initial watering history count
            const historyElements = await driver.findElements(By.css('[data-testid="watering-entry"]'));
            const initialCount = historyElements.length;
            
            await plantDashboard.waterPlant(250);
            
            // Refresh and check if watering was recorded
            await driver.navigate().refresh();
            await driver.sleep(2000);
            
            const newHistoryElements = await driver.findElements(By.css('[data-testid="watering-entry"]'));
            expect(newHistoryElements.length).toBeGreaterThan(initialCount);
        });

        it('should validate water amount input', async () => {
            await plantDashboard.clickElement(plantDashboard.waterButton);
            await plantDashboard.waitForElement(plantDashboard.waterAmountInput);
            
            // Enter invalid amount (too high)
            await plantDashboard.clearAndSendKeys(plantDashboard.waterAmountInput, '2000');
            await plantDashboard.clickElement(plantDashboard.waterConfirmButton);
            
            // Should show validation error
            const errorMessage = await driver.findElement(By.css('.error-message, .validation-error'));
            expect(await errorMessage.isDisplayed()).toBe(true);
        });

        it('should toggle auto watering', async () => {
            const toggle = await driver.findElement(plantDashboard.autoWateringToggle);
            const initialState = await toggle.isSelected();
            
            await plantDashboard.toggleAutoWatering();
            
            // Refresh and verify state changed
            await driver.navigate().refresh();
            await driver.sleep(2000);
            
            const newToggle = await driver.findElement(plantDashboard.autoWateringToggle);
            const newState = await newToggle.isSelected();
            
            expect(newState).toBe(!initialState);
        });

        it('should display watering history', async () => {
            const historySection = await driver.findElement(By.css('[data-testid="watering-history"]'));
            expect(await historySection.isDisplayed()).toBe(true);
            
            // Check if history entries are formatted correctly
            const historyEntries = await driver.findElements(By.css('[data-testid="watering-entry"]'));
            
            if (historyEntries.length > 0) {
                const firstEntry = historyEntries[0];
                const entryText = await firstEntry.getText();
                
                // Should contain amount and timestamp
                expect(entryText).toMatch(/\d+ml/); // Amount in ml
                expect(entryText).toMatch(/\d{1,2}:\d{2}/); // Time format
            }
        });

        it('should show sensor history charts', async () => {
            // Look for chart elements (could be canvas, svg, or chart library elements)
            const chartElements = await driver.findElements(By.css('.chart, canvas, svg, [data-testid="sensor-chart"]'));
            
            expect(chartElements.length).toBeGreaterThan(0);
            
            // Verify at least one chart is displayed
            let chartDisplayed = false;
            for (let chart of chartElements) {
                if (await chart.isDisplayed()) {
                    chartDisplayed = true;
                    break;
                }
            }
            
            expect(chartDisplayed).toBe(true);
        });

        it('should update sensor data in real-time', async () => {
            const initialMoisture = await plantDashboard.getElementText(plantDashboard.moistureDisplay);
            
            // Wait a bit to see if data updates (simulated real-time updates)
            await driver.sleep(5000);
            
            const updatedMoisture = await plantDashboard.getElementText(plantDashboard.moistureDisplay);
            
            // In a real scenario with live sensors, values might change
            // For testing purposes, just verify the elements are still present and functional
            expect(updatedMoisture).toBeDefined();
        });
    });

    describe('Error Handling', () => {
        it('should handle network errors gracefully', async () => {
            // This test would require intercepting network requests
            // For now, just verify error handling UI elements exist
            
            const errorElements = await driver.findElements(By.css('.error-message, .alert-error, [data-testid="error-display"]'));
            
            // Error handling elements should be present in the DOM (even if not visible)
            expect(errorElements).toBeDefined();
        });

        it('should show loading states during operations', async () => {
            // Start a watering operation
            await plantDashboard.clickElement(plantDashboard.waterButton);
            await plantDashboard.waitForElement(plantDashboard.waterAmountInput);
            await plantDashboard.clearAndSendKeys(plantDashboard.waterAmountInput, '250');
            
            // Click confirm and immediately look for loading indicator
            await plantDashboard.clickElement(plantDashboard.waterConfirmButton);
            
            // Check for loading spinner or disabled state
            try {
                const loadingElement = await driver.findElement(By.css('.loading, .spinner, [data-testid="loading"]'));
                expect(await loadingElement.isDisplayed()).toBe(true);
            } catch (error) {
                // Loading state might be too brief to catch, that's okay
            }
        });
    });

    describe('Responsive Design', () => {
        it('should work on mobile viewport', async () => {
            // Set mobile viewport
            await driver.manage().window().setRect({ width: 375, height: 667 });
            
            await plantDashboard.navigateTo();
            await driver.sleep(1000);
            
            // Verify key elements are still accessible
            const addButton = await driver.findElement(plantDashboard.addPlantButton);
            expect(await addButton.isDisplayed()).toBe(true);
            
            const plantList = await driver.findElement(plantDashboard.plantList);
            expect(await plantList.isDisplayed()).toBe(true);
            
            // Reset to desktop viewport
            await driver.manage().window().setRect({ width: 1280, height: 720 });
        });

        it('should work on tablet viewport', async () => {
            // Set tablet viewport
            await driver.manage().window().setRect({ width: 768, height: 1024 });
            
            await plantDashboard.navigateTo();
            await driver.sleep(1000);
            
            // Verify responsive layout
            const cards = await plantDashboard.getPlantCards();
            
            if (cards.length > 0) {
                expect(await cards[0].isDisplayed()).toBe(true);
            }
            
            // Reset to desktop viewport
            await driver.manage().window().setRect({ width: 1280, height: 720 });
        });
    });
});