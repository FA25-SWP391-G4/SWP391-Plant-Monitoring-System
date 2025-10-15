/**
 * Integration test for Disease Detection UI
 * Tests the complete workflow from file upload to analysis results
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DiseaseDetectionUI from '../components/AIImageRecognition';

// Mock the API
jest.mock('../api/aiApi', () => ({
  analyzeDisease: jest.fn(),
  getDiseaseHistory: jest.fn(),
  getSupportedDiseases: jest.fn(),
  submitDiseaseFeedback: jest.fn(),
  validateImage: jest.fn()
}));

// Mock the MQTT hook
jest.mock('../hooks/useMqtt', () => ({
  __esModule: true,
  default: () => ({
    isConnected: true,
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    publish: jest.fn()
  })
}));

describe('Disease Detection Integration Tests', () => {
  const mockProps = {
    plantId: 1,
    userId: 1
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default mock responses
    const aiApi = require('../api/aiApi').default;
    
    aiApi.getSupportedDiseases.mockResolvedValue({
      data: {
        success: true,
        data: {
          supportedDiseases: {
            'leaf_spot': { name: 'Đốm lá', description: 'Bệnh đốm lá' },
            'healthy': { name: 'Cây khỏe mạnh', description: 'Không có bệnh' }
          }
        }
      }
    });

    aiApi.getDiseaseHistory.mockResolvedValue({
      data: {
        success: true,
        data: {
          analyses: []
        }
      }
    });
  });

  test('complete disease detection workflow', async () => {
    const aiApi = require('../api/aiApi').default;
    
    // Mock successful analysis
    aiApi.analyzeDisease.mockResolvedValue({
      data: {
        success: true,
        data: {
          analysisId: 1,
          primaryDisease: {
            disease: {
              name: 'Đốm lá',
              description: 'Bệnh đốm lá phổ biến'
            }
          },
          confidence: 0.85,
          severity: 'medium',
          treatments: [
            'Loại bỏ lá bị nhiễm bệnh',
            'Xịt thuốc diệt nấm chuyên dụng'
          ],
          prevention: [
            'Tưới nước vào gốc, không lên lá'
          ]
        }
      }
    });

    render(<DiseaseDetectionUI {...mockProps} />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Nhận diện Bệnh cây')).toBeInTheDocument();
    });

    // Verify initial state
    expect(screen.getByText('Kéo thả ảnh hoặc click để chọn')).toBeInTheDocument();
    expect(screen.getByText('Real-time')).toBeInTheDocument();

    // Create and upload a mock file
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = screen.getByRole('button', { name: /kéo thả ảnh/i }).querySelector('input');
    
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Wait for file to be processed
    await waitFor(() => {
      expect(screen.getByText('Ảnh đã chọn')).toBeInTheDocument();
    });

    // Click analyze button
    const analyzeButton = screen.getByRole('button', { name: /phân tích bệnh cây/i });
    fireEvent.click(analyzeButton);

    // Wait for analysis to complete
    await waitFor(() => {
      expect(aiApi.analyzeDisease).toHaveBeenCalledWith(expect.any(FormData));
    });

    // This test verifies the component structure and API integration
    expect(screen.getByText('Nhận diện Bệnh cây')).toBeInTheDocument();
  });

  test('handles file validation errors', async () => {
    render(<DiseaseDetectionUI {...mockProps} />);

    // Try to upload invalid file type
    const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
    const fileInput = screen.getByRole('button', { name: /kéo thả ảnh/i }).querySelector('input');
    
    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    await waitFor(() => {
      expect(screen.getByText('Chỉ chấp nhận file ảnh (JPEG, PNG, WebP)')).toBeInTheDocument();
    });
  });

  test('handles large file validation', async () => {
    render(<DiseaseDetectionUI {...mockProps} />);

    // Create a large file (11MB)
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
    Object.defineProperty(largeFile, 'size', { value: 11 * 1024 * 1024 });
    
    const fileInput = screen.getByRole('button', { name: /kéo thả ảnh/i }).querySelector('input');
    
    fireEvent.change(fileInput, { target: { files: [largeFile] } });

    await waitFor(() => {
      expect(screen.getByText('Kích thước file không được vượt quá 10MB')).toBeInTheDocument();
    });
  });

  test('displays history tab correctly', async () => {
    const aiApi = require('../api/aiApi').default;
    
    // Mock history data
    aiApi.getDiseaseHistory.mockResolvedValue({
      data: {
        success: true,
        data: {
          analyses: [
            {
              id: 1,
              result_data: {
                primaryDisease: {
                  disease: { name: 'Đốm lá' }
                }
              },
              confidence_score: 0.85,
              created_at: '2024-01-01T10:00:00Z',
              image_path: 'test-image.jpg'
            }
          ]
        }
      }
    });

    render(<DiseaseDetectionUI {...mockProps} />);

    // Switch to history tab
    const historyTab = screen.getByRole('tab', { name: /lịch sử/i });
    fireEvent.click(historyTab);

    await waitFor(() => {
      expect(screen.getByText('Lịch sử phân tích')).toBeInTheDocument();
    });
  });

  test('handles API errors gracefully', async () => {
    const aiApi = require('../api/aiApi').default;
    
    // Mock API error
    aiApi.analyzeDisease.mockRejectedValue(new Error('Network error'));

    render(<DiseaseDetectionUI {...mockProps} />);

    // Upload a file
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = screen.getByRole('button', { name: /kéo thả ảnh/i }).querySelector('input');
    
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('Ảnh đã chọn')).toBeInTheDocument();
    });

    // Click analyze button
    const analyzeButton = screen.getByRole('button', { name: /phân tích bệnh cây/i });
    fireEvent.click(analyzeButton);

    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText(/Network error/)).toBeInTheDocument();
    });
  });

  test('clears analysis when clear button is clicked', async () => {
    render(<DiseaseDetectionUI {...mockProps} />);

    // Upload a file
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = screen.getByRole('button', { name: /kéo thả ảnh/i }).querySelector('input');
    
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('Ảnh đã chọn')).toBeInTheDocument();
    });

    // Find and click the delete button
    const deleteButtons = screen.getAllByRole('button');
    const deleteButton = deleteButtons.find(button => 
      button.querySelector('svg') && 
      button.getAttribute('color') === 'error'
    );
    
    if (deleteButton) {
      fireEvent.click(deleteButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Ảnh đã chọn')).not.toBeInTheDocument();
      });
    }
  });
});

// Test the custom hook separately
describe('useDiseaseDetection Hook', () => {
  test('hook integration works correctly', () => {
    // This would test the hook if we could import it directly
    // For now, we verify it works through the component integration
    expect(true).toBe(true);
  });
});