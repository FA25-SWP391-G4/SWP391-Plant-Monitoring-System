import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AIChatbot from '../components/AIChatbot';

// Mock the custom hooks
jest.mock('../hooks/useMqtt', () => ({
  __esModule: true,
  default: () => ({
    isConnected: true,
    connectionStatus: 'connected',
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    error: null
  })
}));

jest.mock('../hooks/useChatSession', () => ({
  __esModule: true,
  default: () => ({
    currentSessionId: 'test-session-123',
    sessions: [],
    chatHistory: [
      {
        id: 1,
        text: 'Xin chào! Tôi là trợ lý AI chăm sóc cây trồng. Tôi có thể giúp gì cho bạn?',
        sender: 'bot',
        timestamp: new Date().toISOString()
      }
    ],
    isLoading: false,
    error: null,
    startNewSession: jest.fn(),
    loadChatSessions: jest.fn(),
    deleteSession: jest.fn(),
    addMessage: jest.fn()
  })
}));

jest.mock('../hooks/useSensorData', () => ({
  __esModule: true,
  default: () => ({
    sensorData: {
      soilMoisture: 65,
      temperature: 24.5,
      humidity: 70,
      lightLevel: 450
    },
    plantInfo: {
      name: 'Cây test',
      type: 'Cây cảnh',
      location: 'Phòng test'
    },
    wateringHistory: [],
    getFormattedSensorData: () => ({
      soilMoisture: { value: 65, unit: '%', status: 'good', label: 'Độ ẩm đất' },
      temperature: { value: 24.5, unit: '°C', status: 'good', label: 'Nhiệt độ' },
      humidity: { value: 70, unit: '%', status: 'good', label: 'Độ ẩm không khí' },
      lightLevel: { value: 450, unit: 'lux', status: 'good', label: 'Cường độ ánh sáng' }
    }),
    getPlantHealthSummary: () => ({
      status: 'good',
      message: 'Cây đang phát triển tốt',
      criticalCount: 0,
      warningCount: 0
    }),
    isConnected: true,
    lastUpdate: new Date().toISOString()
  })
}));

// Mock the AI API
jest.mock('../api/aiApi', () => ({
  chatWithAI: jest.fn(() => Promise.resolve({
    data: {
      success: true,
      response: 'Đây là phản hồi test từ AI',
      confidence: 0.9,
      fallback: false
    }
  }))
}));

describe('AIChatbot Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders chatbot interface correctly', () => {
    render(<AIChatbot userId={1} plantId={1} />);
    
    // Check if main elements are present
    expect(screen.getByText('Trợ lý AI chăm sóc cây trồng')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Nhập câu hỏi về chăm sóc cây trồng...')).toBeInTheDocument();
    expect(screen.getByText('Gửi')).toBeInTheDocument();
    
    // Check if initial bot message is displayed
    expect(screen.getByText('Xin chào! Tôi là trợ lý AI chăm sóc cây trồng. Tôi có thể giúp gì cho bạn?')).toBeInTheDocument();
  });

  test('displays connection status correctly', () => {
    render(<AIChatbot userId={1} plantId={1} />);
    
    // Should show connected status (WiFi icon should be present)
    const wifiIcon = document.querySelector('[data-testid="WifiIcon"]');
    expect(wifiIcon).toBeTruthy();
  });

  test('allows user to type and send messages', async () => {
    render(<AIChatbot userId={1} plantId={1} />);
    
    const input = screen.getByPlaceholderText('Nhập câu hỏi về chăm sóc cây trồng...');
    const sendButton = screen.getByText('Gửi');
    
    // Type a message
    fireEvent.change(input, { target: { value: 'Cây của tôi có lá vàng' } });
    expect(input.value).toBe('Cây của tôi có lá vàng');
    
    // Send button should be enabled
    expect(sendButton).not.toBeDisabled();
    
    // Click send button
    fireEvent.click(sendButton);
    
    // Input should be cleared
    expect(input.value).toBe('');
  });

  test('handles Enter key press to send message', () => {
    render(<AIChatbot userId={1} plantId={1} />);
    
    const input = screen.getByPlaceholderText('Nhập câu hỏi về chăm sóc cây trồng...');
    
    // Type a message
    fireEvent.change(input, { target: { value: 'Test message' } });
    
    // Press Enter
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });
    
    // Input should be cleared
    expect(input.value).toBe('');
  });

  test('shows sensor data when enabled', () => {
    render(<AIChatbot userId={1} plantId={1} showSensorData={true} />);
    
    // Click the info button to show sensor panel
    const infoButton = document.querySelector('[data-testid="InfoIcon"]')?.closest('button');
    if (infoButton) {
      fireEvent.click(infoButton);
      
      // Should show sensor data after clicking
      waitFor(() => {
        expect(screen.getByText('Thông tin cây trồng')).toBeInTheDocument();
      });
    }
  });

  test('disables send button when input is empty', () => {
    render(<AIChatbot userId={1} plantId={1} />);
    
    const sendButton = screen.getByText('Gửi');
    const input = screen.getByPlaceholderText('Nhập câu hỏi về chăm sóc cây trồng...');
    
    // Initially should be disabled (empty input)
    expect(sendButton).toBeDisabled();
    
    // Type something
    fireEvent.change(input, { target: { value: 'Test' } });
    expect(sendButton).not.toBeDisabled();
    
    // Clear input
    fireEvent.change(input, { target: { value: '' } });
    expect(sendButton).toBeDisabled();
  });

  test('shows session history when enabled', () => {
    render(<AIChatbot userId={1} plantId={1} showSessionHistory={true} />);
    
    // Should show history icon
    const historyIcon = document.querySelector('[data-testid="HistoryIcon"]');
    expect(historyIcon).toBeTruthy();
  });

  test('handles different heights correctly', () => {
    const { rerender } = render(<AIChatbot userId={1} plantId={1} height="400px" />);
    
    let chatContainer = document.querySelector('[style*="height: 400px"]');
    expect(chatContainer).toBeTruthy();
    
    // Change height
    rerender(<AIChatbot userId={1} plantId={1} height="800px" />);
    
    chatContainer = document.querySelector('[style*="height: 800px"]');
    expect(chatContainer).toBeTruthy();
  });
});

describe('AIChatbot Integration', () => {
  test('integrates with all required hooks', () => {
    // This test verifies that the component properly integrates with all custom hooks
    const { container } = render(<AIChatbot userId={1} plantId={1} />);
    
    // Component should render without errors
    expect(container.firstChild).toBeInTheDocument();
    
    // Should have chat interface elements
    expect(screen.getByText('Trợ lý AI chăm sóc cây trồng')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Nhập câu hỏi về chăm sóc cây trồng...')).toBeInTheDocument();
  });
});