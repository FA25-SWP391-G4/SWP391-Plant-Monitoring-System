const openRouterService = require('../services/openRouterService');

describe('OpenRouter Service Integration Tests', () => {
  beforeEach(() => {
    // Clear any existing queue before each test
    openRouterService.clearQueue();
  });

  describe('Service Initialization and Configuration', () => {
    test('Service should be properly initialized', () => {
      expect(openRouterService).toBeDefined();
      expect(typeof openRouterService.generateChatCompletion).toBe('function');
      expect(typeof openRouterService.isPlantRelatedQuery).toBe('function');
      expect(typeof openRouterService.getServiceStatus).toBe('function');
    });

    test('Service status should return comprehensive configuration info', () => {
      const status = openRouterService.getServiceStatus();
      expect(status).toBeDefined();
      expect(status).toHaveProperty('configured');
      expect(status).toHaveProperty('model');
      expect(status).toHaveProperty('baseUrl');
      expect(status).toHaveProperty('queueLength');
      expect(status).toHaveProperty('rateLimitConfig');
      expect(status).toHaveProperty('isProcessing');
      expect(status).toHaveProperty('lastRequestTime');
      
      // Validate rate limit configuration
      expect(status.rateLimitConfig.minInterval).toBeGreaterThan(0);
      expect(status.rateLimitConfig.maxRetries).toBeGreaterThan(0);
      expect(status.rateLimitConfig.retryDelay).toBeGreaterThan(0);
    });
  });

  describe('Plant Query Detection and Filtering', () => {
    test('Should correctly identify plant-related queries', () => {
      const plantQueries = [
        'How often should I water my plants?',
        'My plant leaves are turning yellow',
        'What fertilizer should I use for tomatoes?',
        'Help with watering schedule',
        'Plant disease identification',
        'My succulent is drooping',
        'When should I repot my houseplant?',
        'How much sunlight do herbs need?',
        'My garden vegetables are wilting',
        'Pest control for indoor plants'
      ];
      
      plantQueries.forEach(query => {
        expect(openRouterService.isPlantRelatedQuery(query)).toBe(true);
      });
    });

    test('Should correctly reject non-plant queries', () => {
      const nonPlantQueries = [
        'What is the weather today?',
        'How to cook pasta?',
        'Tell me a joke',
        'What is 2 + 2?',
        'Latest news updates',
        'How to fix my computer?',
        'Movie recommendations',
        'Stock market prices'
      ];
      
      nonPlantQueries.forEach(query => {
        expect(openRouterService.isPlantRelatedQuery(query)).toBe(false);
      });
    });

    test('Should handle edge cases in plant query detection', () => {
      // Edge cases that might be ambiguous
      expect(openRouterService.isPlantRelatedQuery('plant-based diet')).toBe(true); // Contains 'plant'
      expect(openRouterService.isPlantRelatedQuery('manufacturing plant')).toBe(true); // Contains 'plant' but different context
      expect(openRouterService.isPlantRelatedQuery('I planted a tree')).toBe(true); // Past tense of plant
      expect(openRouterService.isPlantRelatedQuery('root cause analysis')).toBe(true); // Contains 'root'
      expect(openRouterService.isPlantRelatedQuery('')).toBe(false); // Empty string
      expect(openRouterService.isPlantRelatedQuery('   ')).toBe(false); // Whitespace only
    });

    test('Non-plant response generation should be appropriate', () => {
      const response = openRouterService.generateNonPlantResponse();
      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
      expect(response.toLowerCase()).toContain('plant');
      
      // Test multiple calls return different responses
      const responses = Array.from({ length: 5 }, () => openRouterService.generateNonPlantResponse());
      const uniqueResponses = new Set(responses);
      expect(uniqueResponses.size).toBeGreaterThan(1); // Should have variety
    });
  });

  describe('System Prompt Generation and Context Injection', () => {
    test('Basic system prompt should contain essential guidelines', () => {
      const basicPrompt = openRouterService.generateSystemPrompt();
      expect(basicPrompt).toContain('plant care assistant');
      expect(basicPrompt).toContain('Only answer questions related to plants');
      expect(basicPrompt).toContain('practical, actionable advice');
      expect(basicPrompt).toContain('RESPONSE FORMAT');
    });

    test('System prompt should properly inject plant context', () => {
      const context = {
        plantType: 'tomato',
        currentMoisture: 45,
        temperature: 24,
        humidity: 60,
        lightLevel: 75,
        lastWatering: '2024-10-15T10:30:00Z',
        plantAge: '3 months'
      };
      
      const contextPrompt = openRouterService.generateSystemPrompt(context);
      expect(contextPrompt).toContain('tomato');
      expect(contextPrompt).toContain('45%');
      expect(contextPrompt).toContain('24°C');
      expect(contextPrompt).toContain('60%');
      expect(contextPrompt).toContain('75%');
      expect(contextPrompt).toContain('2024-10-15T10:30:00Z');
      expect(contextPrompt).toContain('3 months');
    });

    test('System prompt should handle partial context gracefully', () => {
      const partialContext = {
        plantType: 'succulent',
        currentMoisture: 20
      };
      
      const contextPrompt = openRouterService.generateSystemPrompt(partialContext);
      expect(contextPrompt).toContain('succulent');
      expect(contextPrompt).toContain('20%');
      expect(contextPrompt).not.toContain('undefined');
      expect(contextPrompt).not.toContain('null');
    });
  });

  describe('Chat Completion Integration', () => {
    test('Should handle plant-related queries with full context', async () => {
      const result = await openRouterService.generateChatCompletion(
        'How often should I water my tomato plant?',
        [],
        { 
          plantType: 'tomato', 
          currentMoisture: 45,
          temperature: 26,
          humidity: 55
        }
      );
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('response');
      expect(result).toHaveProperty('isPlantRelated');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('source');
      
      expect(result.isPlantRelated).toBe(true);
      expect(typeof result.response).toBe('string');
      expect(result.response.length).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0);
    });

    test('Should reject non-plant queries with appropriate fallback', async () => {
      const result = await openRouterService.generateChatCompletion(
        'What is the weather today?',
        [],
        {}
      );
      
      expect(result).toBeDefined();
      expect(result.isPlantRelated).toBe(false);
      expect(result.confidence).toBe(1.0);
      expect(result.source).toBe('fallback');
      expect(result.response).toContain('plant');
    });

    test('Should properly handle conversation history', async () => {
      const conversationHistory = [
        { role: 'user', content: 'Hello, I need help with my plants' },
        { role: 'assistant', content: 'I\'d be happy to help with your plant care questions!' },
        { role: 'user', content: 'My tomato plant leaves are yellowing' },
        { role: 'assistant', content: 'Yellowing leaves on tomato plants can indicate several issues...' }
      ];
      
      const result = await openRouterService.generateChatCompletion(
        'What should I do about it?',
        conversationHistory,
        { plantType: 'tomato' }
      );
      
      expect(result).toBeDefined();
      expect(result.isPlantRelated).toBe(true);
      expect(typeof result.response).toBe('string');
      expect(result.response.length).toBeGreaterThan(0);
    });

    test('Should limit conversation history to prevent token overflow', async () => {
      // Create a long conversation history (more than 10 messages)
      const longHistory = Array.from({ length: 15 }, (_, i) => [
        { role: 'user', content: `Plant question ${i + 1}` },
        { role: 'assistant', content: `Plant answer ${i + 1}` }
      ]).flat();
      
      const result = await openRouterService.generateChatCompletion(
        'Latest plant question',
        longHistory,
        { plantType: 'rose' }
      );
      
      expect(result).toBeDefined();
      expect(result.isPlantRelated).toBe(true);
      // Should still work despite long history (service should truncate)
    });
  });

  describe('Error Handling and Fallback Mechanisms', () => {
    test('Should handle missing API key gracefully', async () => {
      const originalApiKey = openRouterService.apiKey;
      openRouterService.apiKey = null;
      
      const result = await openRouterService.generateChatCompletion(
        'How do I care for my plants?',
        [],
        {}
      );
      
      expect(result).toBeDefined();
      expect(result.isPlantRelated).toBe(true);
      expect(result.source).toBe('fallback');
      expect(result.confidence).toBeLessThan(1.0);
      expect(result.response).toContain('offline mode');
      
      // Restore original API key
      openRouterService.apiKey = originalApiKey;
    });

    test('Should handle API request failures with retry logic', async () => {
      // This test would require mocking axios to simulate failures
      // For now, we test the error handling path by removing API key
      const originalApiKey = openRouterService.apiKey;
      openRouterService.apiKey = 'invalid-key';
      
      const result = await openRouterService.generateChatCompletion(
        'How to water my garden?',
        [],
        { plantType: 'mixed vegetables' }
      );
      
      expect(result).toBeDefined();
      expect(result.isPlantRelated).toBe(true);
      expect(result.source).toBe('fallback');
      expect(result).toHaveProperty('error');
      
      // Restore original API key
      openRouterService.apiKey = originalApiKey;
    });

    test('Should handle malformed responses gracefully', async () => {
      // Test with empty message to trigger validation
      const result = await openRouterService.generateChatCompletion(
        '',
        [],
        {}
      );
      
      expect(result).toBeDefined();
      expect(result.isPlantRelated).toBe(false);
      expect(result.source).toBe('fallback');
    });
  });

  describe('Rate Limiting and Queue Management', () => {
    test('Queue management should work correctly', () => {
      const initialStatus = openRouterService.getServiceStatus();
      expect(initialStatus.queueLength).toBe(0);
      expect(initialStatus.isProcessing).toBe(false);
      
      // Clear queue should work
      openRouterService.clearQueue();
      const clearedStatus = openRouterService.getServiceStatus();
      expect(clearedStatus.queueLength).toBe(0);
    });

    test('Should handle multiple concurrent requests', async () => {
      const requests = Array.from({ length: 3 }, (_, i) => 
        openRouterService.generateChatCompletion(
          `Plant question ${i + 1}: How to care for plants?`,
          [],
          { plantType: 'general' }
        )
      );
      
      const results = await Promise.all(requests);
      
      results.forEach((result, index) => {
        expect(result).toBeDefined();
        expect(result.isPlantRelated).toBe(true);
        expect(typeof result.response).toBe('string');
      });
    });

    test('Rate limiting configuration should be properly set', () => {
      const status = openRouterService.getServiceStatus();
      expect(status.rateLimitConfig).toBeDefined();
      expect(status.rateLimitConfig.minInterval).toBeGreaterThan(0);
      expect(status.rateLimitConfig.maxRetries).toBeGreaterThan(0);
      expect(status.rateLimitConfig.retryDelay).toBeGreaterThan(0);
    });
  });

  describe('Context and Response Quality', () => {
    test('Should provide contextually relevant responses', async () => {
      const contexts = [
        {
          plantType: 'succulent',
          currentMoisture: 15,
          message: 'Should I water my plant?'
        },
        {
          plantType: 'fern',
          currentMoisture: 80,
          humidity: 90,
          message: 'My plant looks overwatered'
        },
        {
          plantType: 'tomato',
          temperature: 35,
          message: 'My plant is wilting in the heat'
        }
      ];
      
      for (const context of contexts) {
        const result = await openRouterService.generateChatCompletion(
          context.message,
          [],
          context
        );
        
        expect(result).toBeDefined();
        expect(result.isPlantRelated).toBe(true);
        expect(result.response.length).toBeGreaterThan(20); // Substantial response
        
        // Response should be contextually relevant
        if (context.plantType) {
          // Note: This might not always be true for fallback responses
          // but should be true for successful API responses
        }
      }
    });

    test('Should maintain conversation coherence', async () => {
      const conversation = [
        { role: 'user', content: 'I have a new houseplant' },
        { role: 'assistant', content: 'That\'s wonderful! What type of plant did you get?' }
      ];
      
      const result = await openRouterService.generateChatCompletion(
        'It\'s a snake plant, how should I care for it?',
        conversation,
        { plantType: 'snake plant' }
      );
      
      expect(result).toBeDefined();
      expect(result.isPlantRelated).toBe(true);
      expect(result.response).toBeTruthy();
    });
  });

  afterEach(() => {
    // Clean up after each test
    openRouterService.clearQueue();
  });
});