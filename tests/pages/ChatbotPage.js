/**
 * CHATBOT PAGE OBJECT
 * ===================
 * 
 * Page Object Model for AI chatbot consultation UI
 * Handles chat interactions, message sending, and conversation management
 */

const { By, until } = require('selenium-webdriver');

class ChatbotPage {
    constructor(driver) {
        this.driver = driver;
        
        // Main chatbot elements
        this.consultationPage = By.css('[data-testid="ai-consultation-page"]');
        this.chatInterface = By.css('[data-testid="chat-interface"]');
        this.messageInput = By.css('[data-testid="message-input"]');
        this.sendMessageButton = By.css('[data-testid="send-message-btn"]');
        this.chatHistory = By.css('[data-testid="chat-history"]');
        
        // Message elements
        this.userMessage = By.css('[data-testid="user-message"]');
        this.aiMessage = By.css('[data-testid="ai-message"]');
        this.aiTyping = By.css('[data-testid="ai-typing"]');
        this.suggestedAction = By.css('[data-testid="suggested-action"]');
        this.followupQuestion = By.css('[data-testid="followup-question"]');
        
        // Plant context elements
        this.consultationPlantSelect = By.css('[data-testid="consultation-plant-select"]');
        this.plantContext = By.css('[data-testid="plant-context"]');
        
        // Conversation starters
        this.conversationStarter = By.css('[data-testid="conversation-starter"]');
        
        // Error handling
        this.messageError = By.css('[data-testid="message-error"]');
        this.accessDenied = By.css('[data-testid="access-denied"]');
        this.accessMessage = By.css('[data-testid="access-message"]');
        
        // History page elements
        this.chatHistoryPage = By.css('[data-testid="chat-history-page"]');
        this.conversationList = By.css('[data-testid="conversation-list"]');
        this.conversationSearch = By.css('[data-testid="conversation-search"]');
        this.searchConversationsButton = By.css('[data-testid="search-conversations-btn"]');
        this.dateFilter = By.css('[data-testid="date-filter"]');
        this.filterToday = By.css('[data-testid="filter-today"]');
        this.searchResults = By.css('[data-testid="search-results"]');
    }

    async navigateToConsultation() {
        await this.driver.get('http://localhost:3000/ai/consultation');
        await this.driver.wait(until.elementLocated(this.consultationPage), 10000);
    }

    async navigateToChatHistory() {
        await this.driver.get('http://localhost:3000/ai/consultation/history');
        await this.driver.wait(until.elementLocated(this.chatHistoryPage), 10000);
    }

    async sendMessage(messageText) {
        const messageInput = await this.driver.findElement(this.messageInput);
        const sendButton = await this.driver.findElement(this.sendMessageButton);
        
        await messageInput.clear();
        await messageInput.sendKeys(messageText);
        await sendButton.click();
        
        // Wait for user message to appear
        await this.driver.wait(until.elementLocated(this.userMessage), 10000);
    }

    async waitForAIResponse() {
        // Wait for typing indicator
        try {
            await this.driver.wait(until.elementLocated(this.aiTyping), 5000);
        } catch (e) {
            // Typing indicator might not appear for fast responses
        }
        
        // Wait for AI response
        await this.driver.wait(until.elementLocated(this.aiMessage), 15000);
    }

    async getLastUserMessage() {
        const userMessages = await this.driver.findElements(this.userMessage);
        if (userMessages.length > 0) {
            const lastMessage = userMessages[userMessages.length - 1];
            return await lastMessage.getText();
        }
        return null;
    }

    async getLastAIMessage() {
        const aiMessages = await this.driver.findElements(this.aiMessage);
        if (aiMessages.length > 0) {
            const lastMessage = aiMessages[aiMessages.length - 1];
            return await lastMessage.getText();
        }
        return null;
    }

    async getAllUserMessages() {
        const userMessages = await this.driver.findElements(this.userMessage);
        const messages = [];
        
        for (let message of userMessages) {
            messages.push(await message.getText());
        }
        
        return messages;
    }

    async getAllAIMessages() {
        const aiMessages = await this.driver.findElements(this.aiMessage);
        const messages = [];
        
        for (let message of aiMessages) {
            messages.push(await message.getText());
        }
        
        return messages;
    }

    async getSuggestedActions() {
        const suggestions = await this.driver.findElements(this.suggestedAction);
        const actions = [];
        
        for (let suggestion of suggestions) {
            actions.push(await suggestion.getText());
        }
        
        return actions;
    }

    async getFollowupQuestions() {
        const followUps = await this.driver.findElements(this.followupQuestion);
        const questions = [];
        
        for (let question of followUps) {
            questions.push(await question.getText());
        }
        
        return questions;
    }

    async selectPlantForConsultation(plantIndex = 0) {
        try {
            const plantSelect = await this.driver.findElement(this.consultationPlantSelect);
            await plantSelect.click();
            
            const plantOptions = await this.driver.findElements(By.css('[data-testid="plant-option"]'));
            if (plantOptions.length > plantIndex) {
                await plantOptions[plantIndex].click();
            }
            
            // Wait for plant context to appear
            await this.driver.wait(until.elementLocated(this.plantContext), 5000);
        } catch (e) {
            // Plant selection might not be available
        }
    }

    async isPlantContextVisible() {
        try {
            const plantContext = await this.driver.findElement(this.plantContext);
            return await plantContext.isDisplayed();
        } catch (e) {
            return false;
        }
    }

    async clickConversationStarter(starterIndex = 0) {
        const starters = await this.driver.findElements(this.conversationStarter);
        if (starters.length > starterIndex) {
            await starters[starterIndex].click();
        }
    }

    async getMessageInputValue() {
        const messageInput = await this.driver.findElement(this.messageInput);
        return await messageInput.getAttribute('value');
    }

    async isTypingIndicatorVisible() {
        try {
            const typingIndicator = await this.driver.findElement(this.aiTyping);
            return await typingIndicator.isDisplayed();
        } catch (e) {
            return false;
        }
    }

    async getMessageError() {
        try {
            const error = await this.driver.findElement(this.messageError);
            return await error.getText();
        } catch (e) {
            return null;
        }
    }

    async isAccessDenied() {
        try {
            const accessDenied = await this.driver.findElement(this.accessDenied);
            return await accessDenied.isDisplayed();
        } catch (e) {
            return false;
        }
    }

    async getAccessMessage() {
        try {
            const message = await this.driver.findElement(this.accessMessage);
            return await message.getText();
        } catch (e) {
            return null;
        }
    }

    async searchConversations(searchTerm) {
        const searchInput = await this.driver.findElement(this.conversationSearch);
        const searchButton = await this.driver.findElement(this.searchConversationsButton);
        
        await searchInput.clear();
        await searchInput.sendKeys(searchTerm);
        await searchButton.click();
        
        // Wait for search results
        await this.driver.wait(until.elementLocated(this.searchResults), 5000);
    }

    async filterConversationsByDate() {
        const dateFilter = await this.driver.findElement(this.dateFilter);
        await dateFilter.click();
        
        const todayOption = await this.driver.findElement(this.filterToday);
        await todayOption.click();
        
        // Wait for filtering to complete
        await this.driver.wait(until.elementLocated(By.css('[data-testid="filtered-conversations"]')), 5000);
    }

    async getConversationCount() {
        const conversations = await this.driver.findElements(By.css('[data-testid="conversation-item"]'));
        return conversations.length;
    }

    async validateChatInterface() {
        const chatInterface = await this.driver.findElement(this.chatInterface);
        const messageInput = await this.driver.findElement(this.messageInput);
        const sendButton = await this.driver.findElement(this.sendMessageButton);
        
        return {
            chatInterfaceVisible: await chatInterface.isDisplayed(),
            messageInputVisible: await messageInput.isDisplayed(),
            sendButtonVisible: await sendButton.isDisplayed()
        };
    }

    async performChatConversation(messages) {
        const responses = [];
        
        for (let message of messages) {
            await this.sendMessage(message);
            await this.waitForAIResponse();
            
            const aiResponse = await this.getLastAIMessage();
            responses.push({
                userMessage: message,
                aiResponse: aiResponse
            });
        }
        
        return responses;
    }

    async getConversationLength() {
        const userMessages = await this.driver.findElements(this.userMessage);
        const aiMessages = await this.driver.findElements(this.aiMessage);
        
        return {
            userMessages: userMessages.length,
            aiMessages: aiMessages.length
        };
    }
}

module.exports = ChatbotPage;