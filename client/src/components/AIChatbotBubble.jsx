/**
 * AI Chatbot Bubble Component
 * Floating chatbot bubble that appears on all pages for premium users
 * Provides quick access to AI plant care assistance
 */
'use client'

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../providers/AuthProvider';
import aiApi from '../api/aiApi';
import { Button } from './ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/Dialog';
import { Input } from './ui/Input';
import {
  MessageCircle,
  Send,
  X,
  Minimize2,
  Bot,
  User,
  Loader2
} from 'lucide-react';

const AIChatbotBubble = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: t('ai.chatbot.welcomeMessage', 'Hello! I\'m your AI plant care assistant. How can I help you today?'),
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);

  // Check if user has premium access
  const isPremium = user?.role === 'Premium' || user?.role === 'Admin';
  
  // Don't render if user is not premium
  if (!isPremium) {
    return null;
  }

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Reset unread count when chat is opened
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    // Add user message
    const userMessage = {
      id: Date.now(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // Send to AI service
      const response = await aiApi.chatWithAI({
        user_id: user.user_id,
        message: input,
        context: messages.slice(-5).map(m => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text
        }))
      });
      
      // Handle authentication errors
      if (!response.success) {
        let errorMessage = response.error || 'Sorry, I encountered an error. Please try again.';
        
        if (response.requiresLogin) {
          errorMessage = 'Please log in to use the AI chatbot.';
        } else if (response.requiresPremium) {
          errorMessage = 'Premium subscription required to use the AI chatbot.';
        }
        
        const errorBotMessage = {
          id: Date.now() + 1,
          text: errorMessage,
          sender: 'bot',
          timestamp: new Date(),
          isError: true
        };
        
        setMessages(prev => [...prev, errorBotMessage]);
        setIsLoading(false);
        return;
      }
      
      // Add bot response
      const botMessage = {
        id: Date.now() + 1,
        text: response.data.response,
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
      
      // Increment unread count if chat is closed
      if (!isOpen) {
        setUnreadCount(prev => prev + 1);
      }
      
    } catch (error) {
      console.error('Error getting chatbot response:', error);
      
      // Add error message
      const errorMessage = {
        id: Date.now() + 1,
        text: t('ai.chatbot.errorMessage', 'Sorry, I\'m having trouble connecting. Please try again later.'),
        sender: 'bot',
        timestamp: new Date(),
        isError: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
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

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const quickQuestions = [
    t('ai.chatbot.quickQuestions.watering', 'When should I water my plants?'),
    t('ai.chatbot.quickQuestions.light', 'Is my plant getting enough light?'),
    t('ai.chatbot.quickQuestions.yellowing', 'Why are my leaves turning yellow?'),
    t('ai.chatbot.quickQuestions.fertilizer', 'When should I fertilize?')
  ];

  const handleQuickQuestion = (question) => {
    setInput(question);
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative">
          <Button
            onClick={() => setIsOpen(true)}
            className="w-18 h-18 rounded-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
            size="icon"
            title={t('ai.chatbot.tooltip', 'AI Plant Assistant')}
          >
            <MessageCircle className="h-6 w-6 text-white" />
          </Button>
          {unreadCount > 0 && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
              {unreadCount}
            </div>
          )}
        </div>
      </div>

      {/* Chat Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md max-h-[80vh] bg-gradient-to-br from-blue-50 to-green-50 flex flex-col">
          {/* Header */}
          <DialogHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-t-lg -m-6 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-white">
                    {t('ai.chatbot.title', 'AI Plant Assistant')}
                  </DialogTitle>
                  <p className="text-white/80 text-sm">
                    {t('ai.chatbot.subtitle', 'Premium Feature')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="text-white hover:bg-white/20 h-8 w-8"
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white/20 h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-4 max-h-80 mb-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex items-end gap-2 max-w-[85%] ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        message.sender === 'user' ? 'bg-blue-500' : 'bg-green-500'
                      }`}>
                        {message.sender === 'user' ? <User className="h-4 w-4 text-white" /> : <Bot className="h-4 w-4 text-white" />}
                      </div>
                      <div>
                        <div className={`p-3 rounded-2xl ${
                          message.sender === 'user'
                            ? 'bg-blue-500 text-white rounded-br-sm'
                            : message.isError
                            ? 'bg-red-100 text-red-800 rounded-bl-sm'
                            : 'bg-white text-gray-800 rounded-bl-sm shadow-sm'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                        </div>
                        <p className={`text-xs text-gray-500 mt-1 ${message.sender === 'user' ? 'text-right' : ''}`}>
                          {formatTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex items-end gap-2">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                      <div className="bg-white p-3 rounded-2xl rounded-bl-sm shadow-sm">
                        <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Questions */}
              {messages.length <= 1 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    {t('ai.chatbot.quickQuestions.title', 'Quick Questions:')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {quickQuestions.map((question, index) => (
                      <button
                        key={index}
                        onClick={() => handleQuickQuestion(question)}
                        className="px-3 py-1 text-xs border border-gray-300 rounded-full hover:bg-gray-100 transition-colors"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="flex gap-2">
                <Input
                  placeholder={t('ai.chatbot.placeholder', 'Ask about plant care...')}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  size="icon"
                  className="bg-green-500 hover:bg-green-600"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AIChatbotBubble;