import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AIChatbot from '../ai/AIChatbot';
import aiApi from '../../api/aiApi';

// Mock the AI API
jest.mock('../../api/aiApi');

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, defaultValue) => defaultValue || key,
  }),
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

describe('AIChatbot Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  test('renders chatbot with welcome message', () => {
    render(<AIChatbot />);
    
    expect(screen.getByText('AI Plant Care Assistant')).toBeInTheDocument();
    expect(screen.getByText(/Hello! I'm your AI plant care assistant/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ask me about plant care...')).toBeInTheDocument();
  });

  test('renders with plant context', () => {
    const mockPlant = {
      id: 1,
      name: 'Test Plant',
      species: 'Test Species',
      current_moisture: 45,
      current_temperature: 22,
      current_humidity: 60,
      current_light: 800
    };

    render(<AIChatbot plant={mockPlant} />);
    
    expect(screen.getByText('Helping with Test Plant')).toBeInTheDocument();
    expect(screen.getByText(/questions about Test Plant/)).toBeInTheDocument();
  });

  test('sends message and receives response', async () => {
    const mockResponse = {
      data: {
        response: 'This is a test response from AI',
        confidence: 0.9
      }
    };
    
    aiApi.chatWithAI.mockResolvedValue(mockResponse);

    render(<AIChatbot />);
    
    const input = screen.getByPlaceholderText('Ask me about plant care...');
    const sendButton = screen.getByRole('button');
    
    fireEvent.change(input, { target: { value: 'How often should I water my plant?' } });
    fireEvent.click(sendButton);
    
    // Check if user message appears
    expect(screen.getByText('How often should I water my plant?')).toBeInTheDocument();
    
    // Wait for AI response
    await waitFor(() => {
      expect(screen.getByText('This is a test response from AI')).toBeInTheDocument();
    });
    
    expect(aiApi.chatWithAI).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'How often should I water my plant?',
        chat_id: expect.any(String),
        context: expect.any(Object),
        conversation_history: expect.any(Array)
      })
    );
  });

  test('handles API error gracefully', async () => {
    aiApi.chatWithAI.mockRejectedValue(new Error('API Error'));

    render(<AIChatbot />);
    
    const input = screen.getByPlaceholderText('Ask me about plant care...');
    const sendButton = screen.getByRole('button');
    
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(screen.getByText(/I'm sorry, I'm having trouble connecting/)).toBeInTheDocument();
    });
  });

  test('clears conversation', () => {
    render(<AIChatbot />);
    
    const clearButton = screen.getByText('Clear');
    fireEvent.click(clearButton);
    
    // Should show welcome message
    expect(screen.getByText(/Hello! I'm your AI plant care assistant/)).toBeInTheDocument();
  });

  test('shows typing indicator during API call', async () => {
    const mockResponse = {
      data: {
        response: 'Test response'
      }
    };
    
    // Delay the API response to test typing indicator
    aiApi.chatWithAI.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve(mockResponse), 100))
    );

    render(<AIChatbot />);
    
    const input = screen.getByPlaceholderText('Ask me about plant care...');
    const sendButton = screen.getByRole('button');
    
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(sendButton);
    
    // Should show typing indicator (animated dots)
    await waitFor(() => {
      const typingDots = document.querySelectorAll('.animate-bounce');
      expect(typingDots.length).toBeGreaterThan(0);
    });
  });

  test('saves conversation to localStorage with plant context', async () => {
    const mockPlant = {
      id: 1,
      name: 'Test Plant'
    };
    
    const mockResponse = {
      data: {
        response: 'Test response'
      }
    };
    
    aiApi.chatWithAI.mockResolvedValue(mockResponse);

    render(<AIChatbot plant={mockPlant} />);
    
    const input = screen.getByPlaceholderText('Ask me about plant care...');
    const sendButton = screen.getByRole('button');
    
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'ai_chat_history',
        expect.stringContaining('Test Plant')
      );
    });
  });
});