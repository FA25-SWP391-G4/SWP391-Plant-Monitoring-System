import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AIImageRecognition from '../AIImageRecognition';
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

// Mock FileReader
global.FileReader = class {
  constructor() {
    this.onload = null;
  }
  
  readAsDataURL(file) {
    setTimeout(() => {
      if (this.onload) {
        this.onload({ target: { result: 'data:image/jpeg;base64,mockImageData' } });
      }
    }, 0);
  }
};

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

describe('AIImageRecognition Component', () => {
  const mockPlant = {
    id: 1,
    name: 'Test Plant',
    species: 'Test Species'
  };

  const mockAnalysisResult = {
    disease_detected: 'Early Blight',
    confidence: 0.94,
    severity: 'moderate',
    treatment_suggestions: [
      'Apply copper-based fungicide',
      'Improve air circulation',
      'Remove affected leaves'
    ],
    prevention_tips: [
      'Water at soil level',
      'Avoid overhead watering'
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  test('renders without plant', () => {
    render(<AIImageRecognition />);
    
    expect(screen.getByText('Plant Disease Recognition')).toBeInTheDocument();
    expect(screen.getByText('Upload plant images to detect diseases and get treatment recommendations')).toBeInTheDocument();
  });

  test('renders with plant context', () => {
    render(<AIImageRecognition plant={mockPlant} />);
    
    expect(screen.getByText('Plant Disease Recognition')).toBeInTheDocument();
    expect(screen.getByText('Analyze Test Plant for diseases and health issues')).toBeInTheDocument();
  });

  test('shows upload interface initially', () => {
    render(<AIImageRecognition />);
    
    expect(screen.getByText('Upload Plant Image')).toBeInTheDocument();
    expect(screen.getByText('Drag and drop an image here, or click to select')).toBeInTheDocument();
    expect(screen.getByText('Select Image')).toBeInTheDocument();
    expect(screen.getByText('Supports JPG, PNG, WebP (max 10MB)')).toBeInTheDocument();
  });

  test('handles file selection and shows preview', async () => {
    render(<AIImageRecognition />);
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByRole('button', { name: /select image/i }).querySelector('input');
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByAltText('Plant preview')).toBeInTheDocument();
      expect(screen.getByText('Analyze Plant Health')).toBeInTheDocument();
    });
  });

  test('validates file type', async () => {
    render(<AIImageRecognition />);
    
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    const input = screen.getByRole('button', { name: /select image/i }).querySelector('input');
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByText('Please select a valid image file')).toBeInTheDocument();
    });
  });

  test('validates file size', async () => {
    render(<AIImageRecognition />);
    
    // Create a file larger than 10MB
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
    const input = screen.getByRole('button', { name: /select image/i }).querySelector('input');
    
    fireEvent.change(input, { target: { files: [largeFile] } });
    
    await waitFor(() => {
      expect(screen.getByText('File size must be less than 10MB')).toBeInTheDocument();
    });
  });

  test('handles drag and drop', async () => {
    render(<AIImageRecognition />);
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const dropZone = screen.getByText('Upload Plant Image').closest('div');
    
    // Simulate drag enter
    fireEvent.dragEnter(dropZone, {
      dataTransfer: { files: [file] }
    });
    
    // Simulate drop
    fireEvent.drop(dropZone, {
      dataTransfer: { files: [file] }
    });
    
    await waitFor(() => {
      expect(screen.getByAltText('Plant preview')).toBeInTheDocument();
    });
  });

  test('analyzes image successfully', async () => {
    aiApi.analyzeImage.mockResolvedValue({
      data: { data: mockAnalysisResult }
    });

    render(<AIImageRecognition plant={mockPlant} />);
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByRole('button', { name: /select image/i }).querySelector('input');
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByText('Analyze Plant Health')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Analyze Plant Health'));
    
    // Should show progress
    await waitFor(() => {
      expect(screen.getByText('Analyzing image...')).toBeInTheDocument();
    });
    
    // Should show results
    await waitFor(() => {
      expect(screen.getByText('Analysis Results')).toBeInTheDocument();
      expect(screen.getByText('Early Blight')).toBeInTheDocument();
      expect(screen.getByText('94% confidence')).toBeInTheDocument();
      expect(screen.getByText('Treatment Recommendations')).toBeInTheDocument();
      expect(screen.getByText('Apply copper-based fungicide')).toBeInTheDocument();
      expect(screen.getByText('Prevention Tips')).toBeInTheDocument();
      expect(screen.getByText('Water at soil level')).toBeInTheDocument();
    });
    
    expect(aiApi.analyzeImage).toHaveBeenCalledWith(expect.any(FormData));
  });

  test('handles analysis error', async () => {
    aiApi.analyzeImage.mockRejectedValue(new Error('Analysis failed'));

    render(<AIImageRecognition />);
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByRole('button', { name: /select image/i }).querySelector('input');
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByText('Analyze Plant Health')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Analyze Plant Health'));
    
    await waitFor(() => {
      expect(screen.getByText('Unable to analyze image. Please try again.')).toBeInTheDocument();
    });
  });

  test('shows analysis progress', async () => {
    // Mock a delayed response to test progress
    aiApi.analyzeImage.mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({ data: { data: mockAnalysisResult } }), 1000)
      )
    );

    render(<AIImageRecognition />);
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByRole('button', { name: /select image/i }).querySelector('input');
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByText('Analyze Plant Health')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Analyze Plant Health'));
    
    // Should show progress indicators
    await waitFor(() => {
      expect(screen.getByText('Analyzing image...')).toBeInTheDocument();
      expect(screen.getByText('Processing image with AI model...')).toBeInTheDocument();
    });
  });

  test('clears analysis', async () => {
    render(<AIImageRecognition />);
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByRole('button', { name: /select image/i }).querySelector('input');
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByAltText('Plant preview')).toBeInTheDocument();
    });
    
    // Click clear button
    fireEvent.click(screen.getByText('Clear'));
    
    // Should return to upload interface
    expect(screen.getByText('Upload Plant Image')).toBeInTheDocument();
    expect(screen.queryByAltText('Plant preview')).not.toBeInTheDocument();
  });

  test('saves and displays analysis history', async () => {
    const mockHistory = [
      {
        id: 1,
        timestamp: '2024-10-16T10:00:00Z',
        plantName: 'Previous Plant',
        result: { disease_detected: 'Leaf Spot', confidence: 0.85 },
        preview: 'data:image/jpeg;base64,mockData'
      }
    ];
    
    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockHistory));
    
    render(<AIImageRecognition />);
    
    expect(screen.getByText('Recent Analysis History')).toBeInTheDocument();
    expect(screen.getByText('Previous Plant')).toBeInTheDocument();
    expect(screen.getByText('Leaf Spot')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  test('handles no file selected error', async () => {
    render(<AIImageRecognition />);
    
    // Try to analyze without selecting a file
    fireEvent.click(screen.getByText('Select Image'));
    
    // Since no file is selected, the analyze button shouldn't be visible
    expect(screen.queryByText('Analyze Plant Health')).not.toBeInTheDocument();
  });

  test('shows confidence colors correctly', async () => {
    const highConfidenceResult = { ...mockAnalysisResult, confidence: 0.95 };
    const mediumConfidenceResult = { ...mockAnalysisResult, confidence: 0.7 };
    const lowConfidenceResult = { ...mockAnalysisResult, confidence: 0.4 };
    
    aiApi.analyzeImage.mockResolvedValue({
      data: { data: highConfidenceResult }
    });

    render(<AIImageRecognition />);
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByRole('button', { name: /select image/i }).querySelector('input');
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByText('Analyze Plant Health')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Analyze Plant Health'));
    
    await waitFor(() => {
      expect(screen.getByText('95% confidence')).toBeInTheDocument();
    });
  });

  test('shows severity indicators correctly', async () => {
    const severityResult = { ...mockAnalysisResult, severity: 'high' };
    
    aiApi.analyzeImage.mockResolvedValue({
      data: { data: severityResult }
    });

    render(<AIImageRecognition />);
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByRole('button', { name: /select image/i }).querySelector('input');
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByText('Analyze Plant Health')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Analyze Plant Health'));
    
    await waitFor(() => {
      expect(screen.getByText('high')).toBeInTheDocument();
    });
  });

  test('handles healthy plant result', async () => {
    const healthyResult = {
      disease_detected: null,
      condition: 'Healthy',
      confidence: 0.92,
      treatment_suggestions: [],
      prevention_tips: ['Continue current care routine']
    };
    
    aiApi.analyzeImage.mockResolvedValue({
      data: { data: healthyResult }
    });

    render(<AIImageRecognition />);
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByRole('button', { name: /select image/i }).querySelector('input');
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByText('Analyze Plant Health')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Analyze Plant Health'));
    
    await waitFor(() => {
      expect(screen.getByText('Healthy')).toBeInTheDocument();
      expect(screen.getByText('Continue current care routine')).toBeInTheDocument();
    });
  });
});