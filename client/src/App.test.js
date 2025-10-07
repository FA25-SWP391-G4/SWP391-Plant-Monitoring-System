import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import App from './App';

// Mock axiosClient
jest.mock('./api/axiosClient', () => {
  return {
    __esModule: true,
    default: {
      get: jest.fn().mockResolvedValue({ data: {} }),
      post: jest.fn().mockResolvedValue({ data: {} }),
      put: jest.fn().mockResolvedValue({ data: {} }),
      delete: jest.fn().mockResolvedValue({ data: {} })
    }
  };
});

// Mock useAuth hook
jest.mock('./auth/AuthContext', () => {
  const originalModule = jest.requireActual('./auth/AuthContext');
  return {
    ...originalModule,
    useAuth: jest.fn(() => ({
      isAuthenticated: false,
      user: null,
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn()
    }))
  };
});

test('renders app without crashing', () => {
  render(
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  );
  // Just verify the app renders without errors
  expect(document.body).toBeInTheDocument();
});
