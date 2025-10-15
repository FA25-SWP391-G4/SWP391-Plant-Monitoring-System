import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import IrrigationPredictionPage from '../app/irrigation-prediction/page';

// Mock Next.js router
const mockPush = jest.fn();
const mockBack = jest.fn();
const mockSearchParams = {
  get: jest.fn((key) => {
    if (key === 'plantId') return '1';
    if (key === 'plantName') return 'Test Plant';
    return null;
  })
};

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack
  }),
  useSearchParams: () => mockSearchParams
}));

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
    schedule: null,
    recommendations: [],
    loading: false,
    error: null,
    lastUpdate: new Date().toISOString(),
    alerts: [],
    performance: null,
    predictIrrigation: jest.fn(),
    createSchedule: jest.fn(),
    clearAlerts: jest.fn(),
    clearError: jest.fn(),
    getPredictionHistory: jest.fn(() => []),
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
  Line: () => <div data-testid="line-chart">Line Chart</div>,
  Doughnut: () => <div data-testid="doughnut-chart">Doughnut Chart</div>,
  Bar: () => <div data-testid="bar-chart">Bar Chart</div>
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

describe('Irrigation Prediction Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders complete irrigation prediction page', async () => {
    render(<IrrigationPredictionPage />);
    
    // Check header
    expect(screen.getByText('Irrigation Prediction')).toBeInTheDocument();
    
    // Check main dashboard components
    await waitFor(() => {
      expect(screen.getByText('Current Prediction')).toBeInTheDocument();
      expect(screen.getByText('Prediction Trends')).toBeInTheDocument();
      expect(screen.getByText('Current Sensor Data')).toBeInTheDocument();
      expect(screen.getByText('Schedule & Recommendations')).toBeInTheDocument();
      expect(screen.getByText('Irrigation Calendar')).toBeInTheDocument();
    });
  });

  test('displays plant information from URL params', () => {
    render(<IrrigationPredictionPage />);
    
    expect(screen.getByText(/AI-powered watering recommendations for Test Plant/)).toBeInTheDocument();
  });

  test('shows MQTT connection status', () => {
    render(<IrrigationPredictionPage />);
    
    expect(screen.getByText('Live')).toBeInTheDocument();
  });

  test('handles back navigation', () => {
    render(<IrrigationPredictionPage />);
    
    const backButton = screen.getByText('Back');
    fireEvent.click(backButton);
    
    expect(mockBack).toHaveBeenCalled();
  });

  test('displays prediction data correctly', () => {
    render(<IrrigationPredictionPage />);
    
    expect(screen.getByText('Watering Needed')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument(); // Confidence
    expect(screen.getByText('250ml')).toBeInTheDocument(); // Water amount
  });

  test('shows sensor data visualization', () => {
    render(<IrrigationPredictionPage />);
    
    expect(screen.getByText('35%')).toBeInTheDocument(); // Soil moisture
    expect(screen.getByText('24°C')).toBeInTheDocument(); // Temperature
    expect(screen.getByText('65%')).toBeInTheDocument(); // Humidity
    expect(screen.getByText('800 lux')).toBeInTheDocument(); // Light level
  });

  test('renders all chart components', () => {
    render(<IrrigationPredictionPage />);
    
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getByTestId('doughnut-chart')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  test('handles plant selection change', async () => {
    render(<IrrigationPredictionPage />);
    
    // The plant selector should be present
    expect(screen.getByText('Plant:')).toBeInTheDocument();
  });

  test('shows calendar integration', () => {
    render(<IrrigationPredictionPage />);
    
    expect(screen.getByText('Irrigation Calendar')).toBeInTheDocument();
  });

  test('handles error states gracefully', () => {
    const useIrrigationPrediction = require('../hooks/useIrrigationPrediction');
    useIrrigationPrediction.mockReturnValue({
      ...useIrrigationPrediction(),
      error: 'Connection failed',
      prediction: null
    });

    render(<IrrigationPredictionPage />);
    
    expect(screen.getByText('Connection failed')).toBeInTheDocument();
  });

  test('shows loading states', () => {
    const useIrrigationPrediction = require('../hooks/useIrrigationPrediction');
    useIrrigationPrediction.mockReturnValue({
      ...useIrrigationPrediction(),
      loading: true,
      prediction: null
    });

    render(<IrrigationPredictionPage />);
    
    expect(screen.getByText('Predicting...')).toBeInTheDocument();
  });
});

describe('Irrigation Calendar Integration', () => {
  test('calendar displays correctly within dashboard', () => {
    render(<IrrigationPredictionPage />);
    
    // Calendar should be present
    expect(screen.getByText('Irrigation Calendar')).toBeInTheDocument();
    
    // Calendar navigation should be present
    const currentDate = new Date();
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const currentMonthName = monthNames[currentDate.getMonth()];
    
    expect(screen.getByText(new RegExp(currentMonthName))).toBeInTheDocument();
  });

  test('calendar legend is displayed', () => {
    render(<IrrigationPredictionPage />);
    
    expect(screen.getByText('Scheduled')).toBeInTheDocument();
    expect(screen.getByText('Predicted')).toBeInTheDocument();
    expect(screen.getByText('Urgent')).toBeInTheDocument();
    expect(screen.getByText('Today')).toBeInTheDocument();
  });
});

describe('Real-time Updates Integration', () => {
  test('MQTT connection status is displayed', () => {
    render(<IrrigationPredictionPage />);
    
    expect(screen.getByText('Live')).toBeInTheDocument();
  });

  test('alert toggle functionality works', () => {
    render(<IrrigationPredictionPage />);
    
    const alertButton = screen.getByText('Alerts On');
    fireEvent.click(alertButton);
    
    expect(screen.getByText('Alerts Off')).toBeInTheDocument();
  });

  test('refresh functionality is available', () => {
    render(<IrrigationPredictionPage />);
    
    const refreshButton = screen.getByText('Refresh');
    expect(refreshButton).toBeInTheDocument();
    expect(refreshButton).not.toBeDisabled();
  });
});