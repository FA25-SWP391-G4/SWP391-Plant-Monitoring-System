/**
 * Frontend Rendering Tests with I18n
 * 
 * This test suite verifies that frontend components render correctly with different language settings.
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import { I18nextProvider, useTranslation } from 'react-i18next';
import i18n from '../src/i18n/i18n';
import Zones from '../src/pages/Zones';
import Navbar from '../src/components/Navbar';
import { AuthProvider } from '../src/auth/AuthContext';

// Mock the authentication context and APIs
jest.mock('../src/auth/AuthContext', () => {
  const mockAuthContext = {
    user: { name: 'Test User', role: 'Premium' },
    logout: jest.fn(),
  };

  return {
    __esModule: true,
    default: ({ children }) => (
      <div data-testid="auth-provider">
        {children}
      </div>
    ),
    useAuth: () => mockAuthContext,
  };
});

// Mock API calls
jest.mock('../src/api/zonesApi', () => ({
  list: jest.fn().mockResolvedValue({ data: [] }),
  create: jest.fn().mockResolvedValue({}),
  remove: jest.fn().mockResolvedValue({}),
  assignDevice: jest.fn().mockResolvedValue({}),
  unassignDevice: jest.fn().mockResolvedValue({}),
  assignPump: jest.fn().mockResolvedValue({}),
}));

jest.mock('../src/api/axiosClient', () => ({
  get: jest.fn().mockImplementation((url) => {
    if (url === '/devices/unassigned') {
      return Promise.resolve({ data: [] });
    }
    if (url === '/devices/pumps') {
      return Promise.resolve({ data: [] });
    }
    return Promise.resolve({ data: [] });
  }),
  post: jest.fn().mockResolvedValue({ data: {} }),
  delete: jest.fn().mockResolvedValue({}),
}));

// Create a custom render function with necessary providers
const renderWithProviders = (component, { language = 'en' } = {}) => {
  // Change language before rendering
  i18n.changeLanguage(language);
  
  return render(
    <I18nextProvider i18n={i18n}>
      <Router>
        {component}
      </Router>
    </I18nextProvider>
  );
};

describe('Frontend Rendering with I18n', () => {
  // Test Navbar with English language
  test('Navbar renders correctly with English language', async () => {
    renderWithProviders(<Navbar />, { language: 'en' });
    
    await waitFor(() => {
      expect(screen.getByText('Zones')).toBeInTheDocument();
      expect(screen.getByText('Reports')).toBeInTheDocument();
      expect(screen.getByText('Thresholds')).toBeInTheDocument();
      expect(screen.getByText('Search Reports')).toBeInTheDocument();
    });
  });
  
  // Test Navbar with Vietnamese language
  test('Navbar renders correctly with Vietnamese language', async () => {
    renderWithProviders(<Navbar />, { language: 'vi' });
    
    await waitFor(() => {
      expect(screen.getByText('Khu vườn')).toBeInTheDocument();
      expect(screen.getByText('Báo cáo')).toBeInTheDocument();
      expect(screen.getByText('Ngưỡng cảnh báo')).toBeInTheDocument();
      expect(screen.getByText('Tìm kiếm báo cáo')).toBeInTheDocument();
    });
  });

  // Test Zones page with English language
  test('Zones page renders correctly with English language', async () => {
    renderWithProviders(<Zones />, { language: 'en' });
    
    await waitFor(() => {
      expect(screen.getByText('Manage Multiple Plant Zones')).toBeInTheDocument();
      expect(screen.getByText('Create Zone')).toBeInTheDocument();
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('Unassigned Devices')).toBeInTheDocument();
      expect(screen.getByText('No unassigned devices available')).toBeInTheDocument();
    });
  });
  
  // Test Zones page with Vietnamese language
  test('Zones page renders correctly with Vietnamese language', async () => {
    renderWithProviders(<Zones />, { language: 'vi' });
    
    await waitFor(() => {
      expect(screen.getByText('Quản lý nhiều khu vườn')).toBeInTheDocument();
      expect(screen.getByText('Tạo khu vườn')).toBeInTheDocument();
      expect(screen.getByText('Tên')).toBeInTheDocument();
      expect(screen.getByText('Mô tả')).toBeInTheDocument();
      expect(screen.getByText('Thiết bị chưa gán')).toBeInTheDocument();
      expect(screen.getByText('Không còn thiết bị trống')).toBeInTheDocument();
    });
  });
  
  // Test language switching
  test('Language switching works correctly', async () => {
    // Render with English initially
    const { rerender } = renderWithProviders(<Zones />, { language: 'en' });
    
    await waitFor(() => {
      expect(screen.getByText('Manage Multiple Plant Zones')).toBeInTheDocument();
    });
    
    // Change language and re-render
    i18n.changeLanguage('vi');
    rerender(
      <I18nextProvider i18n={i18n}>
        <Router>
          <Zones />
        </Router>
      </I18nextProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Quản lý nhiều khu vườn')).toBeInTheDocument();
    });
  });
});