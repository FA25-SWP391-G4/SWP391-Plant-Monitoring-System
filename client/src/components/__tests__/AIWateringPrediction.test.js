import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AIWateringPrediction from '../AIWateringPrediction';
import aiApi from '../../api/aiApi';

// Mock the AI API
jest.mock('../../api/aiApi');

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, defaultValue, options) => {
      if (options && typeof defaultValue === 'string') {
        return defaultValue.replace(/\{\{(\w+)\}\}/g, (match, key) => options[key] || match);
      }
      return defaultValue || key;
    },
  }),
}));

describe('AIWateringPrediction Component', () => {
  const mockPlant = {
    id: 1,
    name: 'Test Plant',
    species: 'Test Species',
    current_moisture: 45,
    current_temperature: 22,
    current_humidity: 60,
    current_light: 800,
    last_watered: '2024-10-15T10:00:00Z',
    location: 'Living Room'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear any existing timers
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('renders without plant', () => {
    render(<AIWateringPrediction />);
    
    expect(screen.getByText('Select a plant to view watering predictions')).toBeInTheDocument();
  });

  test('renders with plant and shows current conditions', async () => {
    const mockResponse = {
      data: {
        data: {
          should_water: true,
          confidence: 0.85,
          recommended_amount: 250,
          reasoning: 'Low moisture level detected'
        }
      }
    };
    
    aiApi.predictWatering.mockResolvedValue(mockResponse);

    render(<AIWateringPrediction plant={mockPlant} />);
    
    expect(screen.getByText('AI Watering Predictions')).toBeInTheDocument();
    expect(screen.getByText('Smart watering recommendations for Test Plant')).toBeInTheDocument();
    
    // Wait for API call and predictions to load
    await waitFor(() => {
      expect(screen.getByText('Current Conditions')).toBeInTheDocument();
      expect(screen.getByText('45%')).toBeInTheDocument(); // Moisture
      expect(screen.getByText('22°C')).toBeInTheDocument(); // Temperature
      expect(screen.getByText('60%')).toBeInTheDocument(); // Humidity
      expect(screen.getByText('800')).toBeInTheDocument(); // Light
    });
  });

  test('generates prediction timeline', async () => {
    const mockResponse = {
      data: {
        data: {
          should_water: true,
          confidence: 0.85,
          recommended_amount: 250
        }
      }
    };
    
    aiApi.predictWatering.mockResolvedValue(mockResponse);

    render(<AIWateringPrediction plant={mockPlant} />);
    
    await waitFor(() => {
      expect(screen.getByText('7-Day Watering Timeline')).toBeInTheDocument();
      expect(screen.getByText('Today')).toBeInTheDocument();
    });
    
    expect(aiApi.predictWatering).toHaveBeenCalledWith({
      plant_id: 1,
      sensor_data: {
        moisture: 45,
        temperature: 22,
        humidity: 60,
        light: 800,
        plant_type: 'Test Species',
        last_watered: '2024-10-15T10:00:00Z',
        location: 'Living Room'
      },
      prediction_days: 7
    });
  });

  test('handles API error with fallback predictions', async () => {
    aiApi.predictWatering.mockRejectedValue(new Error('API Error'));

    render(<AIWateringPrediction plant={mockPlant} />);
    
    await waitFor(() => {
      expect(screen.getByText('Unable to generate watering predictions. Please try again.')).toBeInTheDocument();
      expect(screen.getByText('Basic')).toBeInTheDocument(); // Fallback indicator
    });
  });

  test('manual override functionality', async () => {
    const mockResponse = {
      data: {
        data: {
          should_water: false,
          confidence: 0.75,
          recommended_amount: 200
        }
      }
    };
    
    aiApi.predictWatering.mockResolvedValue(mockResponse);

    render(<AIWateringPrediction plant={mockPlant} />);
    
    await waitFor(() => {
      expect(screen.getByText('Today')).toBeInTheDocument();
    });
    
    // Find and click the manual override button for today
    const overrideButton = screen.getByText('Water');
    fireEvent.click(overrideButton);
    
    // Should show manual override indicator
    await waitFor(() => {
      expect(screen.getByText('Manual')).toBeInTheDocument();
    });
  });

  test('clear manual override functionality', async () => {
    const mockResponse = {
      data: {
        data: {
          should_water: true,
          confidence: 0.85,
          recommended_amount: 250
        }
      }
    };
    
    aiApi.predictWatering.mockResolvedValue(mockResponse);

    render(<AIWateringPrediction plant={mockPlant} />);
    
    await waitFor(() => {
      expect(screen.getByText('Today')).toBeInTheDocument();
    });
    
    // Apply manual override first
    const overrideButton = screen.getByText('Skip');
    fireEvent.click(overrideButton);
    
    await waitFor(() => {
      expect(screen.getByText('Manual')).toBeInTheDocument();
    });
    
    // Clear the override
    const clearButton = screen.getByText('Clear');
    fireEvent.click(clearButton);
    
    // Should call API again to refresh predictions
    await waitFor(() => {
      expect(aiApi.predictWatering).toHaveBeenCalledTimes(2);
    });
  });

  test('refresh button functionality', async () => {
    const mockResponse = {
      data: {
        data: {
          should_water: true,
          confidence: 0.85,
          recommended_amount: 250
        }
      }
    };
    
    aiApi.predictWatering.mockResolvedValue(mockResponse);

    render(<AIWateringPrediction plant={mockPlant} />);
    
    // Wait for initial load
    await waitFor(() => {
      expect(aiApi.predictWatering).toHaveBeenCalledTimes(1);
    });
    
    // Click refresh button
    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);
    
    // Should call API again
    await waitFor(() => {
      expect(aiApi.predictWatering).toHaveBeenCalledTimes(2);
    });
  });

  test('shows confidence indicators with correct colors', async () => {
    const mockResponse = {
      data: {
        data: {
          predictions: [
            {
              date: '2024-10-16',
              should_water: true,
              confidence: 0.9,
              recommended_amount: 250,
              reasoning: 'High confidence prediction'
            },
            {
              date: '2024-10-17',
              should_water: false,
              confidence: 0.7,
              recommended_amount: 200,
              reasoning: 'Medium confidence prediction'
            },
            {
              date: '2024-10-18',
              should_water: true,
              confidence: 0.5,
              recommended_amount: 300,
              reasoning: 'Low confidence prediction'
            }
          ]
        }
      }
    };
    
    aiApi.predictWatering.mockResolvedValue(mockResponse);

    render(<AIWateringPrediction plant={mockPlant} />);
    
    await waitFor(() => {
      // High confidence (90%) - should be green
      expect(screen.getByText('90% confidence')).toBeInTheDocument();
      // Medium confidence (70%) - should be yellow
      expect(screen.getByText('70% confidence')).toBeInTheDocument();
      // Low confidence (50%) - should be red
      expect(screen.getByText('50% confidence')).toBeInTheDocument();
    });
  });

  test('displays legend correctly', async () => {
    const mockResponse = {
      data: {
        data: {
          should_water: true,
          confidence: 0.85,
          recommended_amount: 250
        }
      }
    };
    
    aiApi.predictWatering.mockResolvedValue(mockResponse);

    render(<AIWateringPrediction plant={mockPlant} />);
    
    await waitFor(() => {
      expect(screen.getByText('Legend')).toBeInTheDocument();
      expect(screen.getByText('Watering recommended')).toBeInTheDocument();
      expect(screen.getByText('Skip watering')).toBeInTheDocument();
      expect(screen.getByText('Manual override')).toBeInTheDocument();
      expect(screen.getByText('High confidence (80%+)')).toBeInTheDocument();
    });
  });

  test('shows loading state', () => {
    // Mock API to never resolve to test loading state
    aiApi.predictWatering.mockImplementation(() => new Promise(() => {}));

    render(<AIWateringPrediction plant={mockPlant} />);
    
    // Should show loading skeletons
    const loadingElements = document.querySelectorAll('.animate-pulse');
    expect(loadingElements.length).toBeGreaterThan(0);
  });
});