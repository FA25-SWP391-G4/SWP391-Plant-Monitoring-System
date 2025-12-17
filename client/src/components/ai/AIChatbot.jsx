import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import aiApi from '../../api/aiApi';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

const AIChatbot = ({ plant = null, className = '' }) => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Initialize conversation with welcome message
  useEffect(() => {
    const welcomeMessage = {
      id: Date.now(),
      text: plant 
        ? t('chatbot.welcomeWithPlant', `Hello! I'm your AI plant care assistant. I can help you with questions about {{plantName}}. What would you like to know?`, { plantName: plant.name })
        : t('chatbot.welcome', 'Hello! I\'m your AI plant care assistant. I can help you with plant care questions. What would you like to know?'),
      sender: 'bot',
      timestamp: new Date().toISOString(),
      plant_context: plant ? {
        name: plant.name,
        species: plant.species,
        current_moisture: plant.current_moisture,
        current_temperature: plant.current_temperature,
        current_humidity: plant.current_humidity,
        current_light: plant.current_light,
        last_watered: plant.last_watered
      } : null
    };
    
    setMessages([welcomeMessage]);
    
    // Generate conversation ID
    setConversationId(`conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  }, [plant, t]);

  // Auto-scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load conversation history from localStorage
  useEffect(() => {
    const savedConversations = localStorage.getItem('ai_chat_history');
    if (savedConversations && plant) {
      try {
        const conversations = JSON.parse(savedConversations);
        const plantConversation = conversations[plant.id];
        if (plantConversation && plantConversation.messages.length > 1) {
          setMessages(plantConversation.messages);
          setConversationId(plantConversation.conversationId);
        }
      } catch (error) {
        console.error('Error loading conversation history:', error);
      }
    }
  }, [plant]);

  // Save conversation to localStorage
  const saveConversation = useCallback((updatedMessages) => {
    if (!plant) return;
    
    try {
      const savedConversations = localStorage.getItem('ai_chat_history');
      const conversations = savedConversations ? JSON.parse(savedConversations) : {};
      
      conversations[plant.id] = {
        conversationId,
        messages: updatedMessages,
        lastUpdated: new Date().toISOString(),
        plantName: plant.name
      };
      
      localStorage.setItem('ai_chat_history', JSON.stringify(conversations));
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  }, [plant, conversationId]);

  // Simulate typing indicator
  const showTypingIndicator = useCallback(() => {
    setIsTyping(true);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set random typing duration (1-3 seconds)
    const typingDuration = Math.random() * 2000 + 1000;
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, typingDuration);
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage = {
      id: Date.now(),
      text: input.trim(),
      sender: 'user',
      timestamp: new Date().toISOString()
    };
    
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);
    setError(null);
    
    // Show typing indicator
    showTypingIndicator();
    
    try {
      // Prepare context for AI
      const context = {
        plant_id: plant?.id,
        plant_type: plant?.species || plant?.name,
        current_moisture: plant?.current_moisture,
        current_temperature: plant?.current_temperature,
        current_humidity: plant?.current_humidity,
        current_light: plant?.current_light,
        last_watered: plant?.last_watered,
        location: plant?.location,
        care_info: plant?.care_info
      };
      
      // Send to AI service
      const response = await aiApi.chatWithAI({
        message: input.trim(),
        plant_id: plant?.id,
        conversation_id: conversationId,
        context: context,
        conversation_history: messages.slice(-10).map(m => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text
        }))
      });
      
      // Clear typing indicator
      setIsTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      // Handle authentication errors
      if (!response.success) {
        let errorMessage = response.error || 'Sorry, I encountered an error. Please try again.';
        
        if (response.requiresLogin || response.code === 'TOKEN_EXPIRED' || response.code === 'INVALID_TOKEN') {
          errorMessage = 'Your session has expired. Please refresh the page and log in again.';
        } else if (response.requiresUltimate || response.code === 'ULTIMATE_REQUIRED') {
          errorMessage = 'Ultimate subscription required to use the AI chatbot.';
        }
        
        const errorBotMessage = {
          id: messages.length + 2,
          text: errorMessage,
          sender: 'bot',
          isError: true
        };
        
        setMessages(prev => [...prev, errorBotMessage]);
        setIsLoading(false);
        return;
      }
      
      // Add bot response
      const botMessage = {
        id: Date.now() + 1,
        text: response.data.response || response.data.data?.response || 'I apologize, but I couldn\'t generate a proper response. Please try again.',
        sender: 'bot',
        timestamp: new Date().toISOString(),
        confidence: response.data.confidence || response.data.data?.confidence,
        suggestions: response.data.suggestions || response.data.data?.suggestions || []
      };
      
      const finalMessages = [...updatedMessages, botMessage];
      setMessages(finalMessages);
      saveConversation(finalMessages);
      
    } catch (error) {
      console.error('Error getting chatbot response:', error);
      
      // Clear typing indicator
      setIsTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Add error message
      const errorMessage = {
        id: Date.now() + 1,
        text: t('chatbot.error', 'I\'m sorry, I\'m having trouble connecting right now. Please try again in a moment.'),
        sender: 'bot',
        timestamp: new Date().toISOString(),
        isError: true
      };
      
      const finalMessages = [...updatedMessages, errorMessage];
      setMessages(finalMessages);
      setError(t('chatbot.connectionError', 'Connection error. Please check your internet connection.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearConversation = () => {
    const welcomeMessage = {
      id: Date.now(),
      text: plant 
        ? t('chatbot.welcomeWithPlant', `Hello! I'm your AI plant care assistant. I can help you with questions about {{plantName}}. What would you like to know?`, { plantName: plant.name })
        : t('chatbot.welcome', 'Hello! I\'m your AI plant care assistant. I can help you with plant care questions. What would you like to know?'),
      sender: 'bot',
      timestamp: new Date().toISOString()
    };
    
    setMessages([welcomeMessage]);
    setError(null);
    
    // Clear from localStorage
    if (plant) {
      try {
        const savedConversations = localStorage.getItem('ai_chat_history');
        if (savedConversations) {
          const conversations = JSON.parse(savedConversations);
          delete conversations[plant.id];
          localStorage.setItem('ai_chat_history', JSON.stringify(conversations));
        }
      } catch (error) {
        console.error('Error clearing conversation:', error);
      }
    }
  };

  return (
    <Card className={`h-[600px] flex flex-col ${className}`}>
      <CardHeader className="flex-shrink-0 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div>
              <CardTitle className="text-lg">
                {t('chatbot.title', 'AI Plant Care Assistant')}
              </CardTitle>
              {plant && (
                <p className="text-sm text-gray-500">
                  {t('chatbot.helpingWith', 'Helping with {{plantName}}', { plantName: plant.name })}
                </p>
              )}
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearConversation}
            className="text-xs"
          >
            {t('chatbot.clear', 'Clear')}
          </Button>
        </div>
        {error && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
            {error}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.map((message) => (
            <div 
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start space-x-2`}>
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.sender === 'user' 
                    ? 'bg-blue-500 text-white ml-2' 
                    : 'bg-green-100 text-green-600 mr-2'
                }`}>
                  {message.sender === 'user' ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  )}
                </div>
                
                {/* Message Bubble */}
                <div className={`rounded-lg px-4 py-2 ${
                  message.sender === 'user' 
                    ? 'bg-blue-500 text-white' 
                    : message.isError 
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-gray-100 text-gray-800'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                  
                  {/* Suggestions */}
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs opacity-75">{t('chatbot.suggestions', 'Suggestions:')}</p>
                      {message.suggestions.map((suggestion, index) => (
                        <div key={index} className="text-xs bg-white bg-opacity-20 rounded px-2 py-1">
                          {suggestion}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Timestamp */}
                  <p className="text-xs opacity-50 mt-1">
                    {message.timestamp ? (() => {
                      try {
                        const date = new Date(message.timestamp);
                        return isNaN(date.getTime()) ? '' : date.toLocaleTimeString();
                      } catch (error) {
                        return '';
                      }
                    })() : ''}
                  </p>
                </div>
              </div>
            </div>
          ))}
          
          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-2">
                <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <div className="bg-gray-100 rounded-lg px-4 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input Area */}
        <div className="flex-shrink-0 border-t border-gray-200 p-4">
          <div className="flex space-x-2">
            <div className="flex-1">
              <Input
                placeholder={t('chatbot.placeholder', 'Ask me about plant care...')}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                className="resize-none"
              />
            </div>
            <Button 
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="px-4"
            >
              {isLoading ? (
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </Button>
          </div>
          
          {/* Plant Context Indicator */}
          {plant && (
            <div className="mt-2 flex items-center text-xs text-gray-500">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              {t('chatbot.contextActive', 'Plant context active: {{plantName}}', { plantName: plant.name })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AIChatbot;