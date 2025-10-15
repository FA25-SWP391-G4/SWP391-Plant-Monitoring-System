import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import IrrigationPredictionDashboard from '../components/IrrigationPredictionDashboard';

// Mock the hooks
jest.mock('../hooks/useIrrigationPrediction', () => {
  return jest.fn(() => ({
    prediction: {
      shouldWater: true,
      confidence: 0.85,
      hoursUntilWater: 2.5,
      waterAmount: 250,
      timestamp: new Date().toISOString()
    },
    schedule: {
      frequency: 'daily',
      startTime: '06:00',
      duration: 5,
      waterAmount: 250,
      createdAt: new Date().toISOString()
    },
    recommendations: [
      {
        message: 'Plant needs watering soon based on soil moisture levels',
        timestamp: new Date().toISOString()
      }
    ],
    loading: false,
    error: null,
    lastUpdate: new Date().toISOString(),
    alerts: [],
    performance: {
      averageResponseTime: 1.2,
      accuracy: 0.89,
      totalPredictions: 150
    },
    predictIrrigation: jest.fn(),
    createSchedule: jest.fn(),
    clearAlerts: jest.fn(),
    clearError: jest.fn(),
    getPredictionHistory: jest.fn(() => [
      {
        confidence: 0.85,
        waterAmount: 250,
        timestamp: new Date().toISOString()
      }
    ]),
    mqttConnected: true
  }));
});

jest.mock('../hooks/useSensorData', () => {
  return jest.fn(() => ({
    sensorData: {
      soilMoisture: 35,
      temperature: 24,
      humidity: 65,
      lightLevel: 800
    },
    loading: false
  }));
});

jest.mock('../hooks/useToast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}));

// Mock Chart.js components
jest.mock('react-chartjs-2', () => ({
  Line: ({ data, options }) => <div data-testid="line-chart">Line Chart</div>,
  Doughnut: ({ data, options }) => <div data-testid="doughnut-chart">Doughnut Chart</div>,
  Bar: ({ data, options }) => <div data-testid="bar-chart">Bar Chart</div>
}));

// Mock Chart.js registration
jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn()
  },
  CategoryScale: {},
  LinearScale: {},
  PointElement: {},
  LineElement: {},
  Title: {},
  Tooltip: {},
  Legend: {},
  ArcElement: {},
  BarElement: {}
}));

describe('IrrigationPredictionDashboard', () => {
  const defaultProps = {
    plantId: 1,
    plantName: 'Test Plant'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders dashboard with plant name', () => {
    render(<IrrigationPredictionDashboard {...defaultProps} />);
    
    expect(screen.getByText('Irrigation Prediction')).toBeInTheDocument();
    expect(screen.getByText(/AI-powered watering recommendations for Test Plant/)).toBeInTheDocument();
  });

  test('displays current prediction information', () => {
    render(<IrrigationPredictionDashboard {...defaultProps} />);
    
    expect(screen.getByText('Current Prediction')).toBeInTheDocument();
    expect(screen.getByText('Watering Needed')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument(); // Confidence
    expect(screen.getByText('250ml')).toBeInTheDocument(); // Water amount
  });

  test('shows MQTT connection status', () => {
    render(<IrrigationPredictionDashboard {...defaultProps} />);
    
    expect(screen.getByText('Live')).toBeInTheDocument();
  });

  test('displays sensor data', () => {
    render(<IrrigationPredictionDashboard {...defaultProps} />);
    
    expect(screen.getByText('Current Sensor Data')).toBeInTheDocument();
    expect(screen.getByText('35%')).toBeInTheDocument(); // Soil moisture
    expect(screen.getByText('24°C')).toBeInTheDocument(); // Temperature
    expect(screen.getByText('65%')).toBeInTheDocument(); // Humidity
    expect(screen.getByText('800 lux')).toBeInTheDocument(); // Light level
  });

  test('shows schedule information when available', () => {
    render(<IrrigationPredictionDashboard {...defaultProps} />);
    
    expect(screen.getByText('Schedule & Recommendations')).toBeInTheDocument();
    expect(screen.getByText('Active Schedule')).toBeInTheDocument();
    expect(screen.getByText('daily')).toBeInTheDocument();
    expect(screen.getByText('06:00')).toBeInTheDocument();
  });

  test('displays recommendations', () => {
    render(<IrrigationPredictionDashboard {...defaultProps} />);
    
    expect(screen.getByText('Recent Recommendations')).toBeInTheDocument();
    expect(screen.getByText('Plant needs watering soon based on soil moisture levels')).toBeInTheDocument();
  });

  test('renders charts', () => {
    render(<IrrigationPredictionDashboard {...defaultProps} />);
    
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getByTestId('doughnut-chart')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  test('handles refresh button click', async () => {
    const mockPredictIrrigation = jest.fn();
    const useIrrigationPrediction = require('../hooks/useIrrigationPrediction');
    useIrrigationPrediction.mockReturnValue({
      ...useIrrigationPrediction(),
      predictIrrigation: mockPredictIrrigation
    });

    render(<IrrigationPredictionDashboard {...defaultProps} />);
    
    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(mockPredictIrrigation).toHaveBeenCalled();
    });
  });

  test('opens schedule creation modal', () => {
    render(<IrrigationPredictionDashboard {...defaultProps} />);
    
    const createScheduleButton = screen.getByText('Create Schedule');
    fireEvent.click(createScheduleButton);

    expect(screen.getByText('Create Irrigation Schedule')).toBeInTheDocument();
    expect(screen.getByText(/Based on current prediction: 250ml needed/)).toBeInTheDocument();
  });

  test('handles schedule creation', async () => {
    const mockCreateSchedule = jest.fn();
    const useIrrigationPrediction = require('../hooks/useIrrigationPrediction');
    useIrrigationPrediction.mockReturnValue({
      ...useIrrigationPrediction(),
      createSchedule: mockCreateSchedule
    });

    render(<IrrigationPredictionDashboard {...defaultProps} />);
    
    // Open modal
    const createScheduleButton = screen.getByText('Create Schedule');
    fireEvent.click(createScheduleButton);

    // Click create in modal
    const createButton = screen.getAllByText('Create Schedule')[1]; // Second one is in modal
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(mockCreateSchedule).toHaveBeenCalledWith({
        predictionBased: true,
        waterAmount: 250,
        frequency: 'daily',
        startTime: '06:00',
        duration: 3
      });
    });
  });

  test('toggles alerts', () => {
    render(<IrrigationPredictionDashboard {...defaultProps} />);
    
    const alertButton = screen.getByText('Alerts On');
    fireEvent.click(alertButton);

    expect(screen.getByText('Alerts Off')).toBeInTheDocument();
  });

  test('displays error state', () => {
    const useIrrigationPrediction = require('../hooks/useIrrigationPrediction');
    useIrrigationPrediction.mockReturnValue({
      ...useIrrigationPrediction(),
      error: 'Failed to connect to AI service'
    });

    render(<IrrigationPredictionDashboard {...defaultProps} />);
    
    expect(screen.getByText('Failed to connect to AI service')).toBeInTheDocument();
    expect(screen.getByText('Dismiss')).toBeInTheDocument();
  });

  test('displays loading state', () => {
    const useIrrigationPrediction = require('../hooks/useIrrigationPrediction');
    useIrrigationPrediction.mockReturnValue({
      ...useIrrigationPrediction(),
      loading: true,
      prediction: null
    });

    render(<IrrigationPredictionDashboard {...defaultProps} />);
    
    expect(screen.getByText('Predicting...')).toBeInTheDocument();
  });

  test('shows no prediction state', () => {
    const useIrrigationPrediction = require('../hooks/useIrrigationPrediction');
    useIrrigationPrediction.mockReturnValue({
      ...useIrrigationPrediction(),
      prediction: null,
      loading: false
    });

    render(<IrrigationPredictionDashboard {...defaultProps} />);
    
    expect(screen.getByText('No prediction available')).toBeInTheDocument();
    expect(screen.getByText('Get Prediction')).toBeInTheDocument();
  });

  test('displays alerts when present', () => {
    const useIrrigationPrediction = require('../hooks/useIrrigationPrediction');
    useIrrigationPrediction.mockReturnValue({
      ...useIrrigationPrediction(),
      alerts: [
        {
          id: 1,
          type: 'urgent_watering',
          message: 'Plant needs immediate watering',
          waterAmount: 300,
          timestamp: new Date().toISOString()
        }
      ]
    });

    render(<IrrigationPredictionDashboard {...defaultProps} />);
    
    expect(screen.getByText('Active Alerts (1)')).toBeInTheDocument();
    expect(screen.getByText('Plant needs immediate watering')).toBeInTheDocument();
    expect(screen.getByText('300ml needed')).toBeInTheDocument();
  });

  test('clears alerts', () => {
    const mockClearAlerts = jest.fn();
    const useIrrigationPrediction = require('../hooks/useIrrigationPrediction');
    useIrrigationPrediction.mockReturnValue({
      ...useIrrigationPrediction(),
      alerts: [{ id: 1, message: 'Test alert', timestamp: new Date().toISOString() }],
      clearAlerts: mockClearAlerts
    });

    render(<IrrigationPredictionDashboard {...defaultProps} />);
    
    const clearButton = screen.getByText('Clear All');
    fireEvent.click(clearButton);

    expect(mockClearAlerts).toHaveBeenCalled();
  });

  test('formats time until watering correctly', () => {
    const useIrrigationPrediction = require('../hooks/useIrrigationPrediction');
    
    // Test hours
    useIrrigationPrediction.mockReturnValue({
      ...useIrrigationPrediction(),
      prediction: {
        shouldWater: true,
        confidence: 0.85,
        hoursUntilWater: 2.5,
        waterAmount: 250
      }
    });

    render(<IrrigationPredictionDashboard {...defaultProps} />);
    expect(screen.getByText('3 hours')).toBeInTheDocument();
  });

  test('shows calendar component', () => {
    render(<IrrigationPredictionDashboard {...defaultProps} />);
    
    expect(screen.getByText('Irrigation Calendar')).toBeInTheDocument();
  });
});