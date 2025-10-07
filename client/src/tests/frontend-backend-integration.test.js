// src/tests/frontend-backend-integration.test.js
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import Login from '../pages/Login';
import Register from '../pages/Register';
import ForgotPassword from '../pages/ForgotPassword';
import authApi from '../api/authApi';

// Mock axiosClient first (since authApi depends on it)
jest.mock('../api/axiosClient', () => {
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

// Mock the auth API
jest.mock('../api/authApi');

// Helper function to render components with necessary providers
const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Frontend-Backend Integration Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('Login Component Integration', () => {
    test('Login form submits correct data to backend API', async () => {
      // Mock the login API call
      authApi.login.mockResolvedValue({ 
        data: { 
          token: 'test-token', 
          user: { id: 1, email: 'test@example.com', name: 'Test User' } 
        } 
      });
      
      // Render the Login component
      renderWithProviders(<Login />);
      
      // Fill out the login form
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' }
      });
      
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' }
      });
      
      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: /login/i }));
      
      // Wait for the API call to be made
      await waitFor(() => {
        // Check that the login API was called with correct arguments
        expect(authApi.login).toHaveBeenCalledWith(
          'test@example.com', 
          'password123'
        );
      });
    });
    
    test('Login displays error message on API failure', async () => {
      // Mock API failure
      authApi.login.mockRejectedValue({ 
        response: { data: { message: 'Invalid credentials' } } 
      });
      
      // Render the Login component
      renderWithProviders(<Login />);
      
      // Fill out the form
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'wrong@example.com' }
      });
      
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'wrongpassword' }
      });
      
      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: /login/i }));
      
      // Check for error message
      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });
    });
  });
  
  describe('Register Component Integration', () => {
    test('Register form submits correct data to backend API', async () => {
      // Mock the register API call
      authApi.register.mockResolvedValue({ 
        data: { success: true } 
      });
      
      // Render the Register component
      renderWithProviders(<Register />);
      
      // Fill out the register form
      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: 'newuser@example.com' }
      });
      
      fireEvent.change(screen.getByLabelText(/full name/i), {
        target: { value: 'New User' }
      });
      
      fireEvent.change(screen.getByLabelText(/^password$/i), {
        target: { value: 'password123' }
      });
      
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: 'password123' }
      });
      
      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: /register/i }));
      
      // Wait for the API call to be made
      await waitFor(() => {
        // Check that the register API was called with correct arguments
        expect(authApi.register).toHaveBeenCalledWith(
          'newuser@example.com', 
          'password123',
          'password123',
          'New User'
        );
      });
    });
  });
  
  describe('ForgotPassword Component Integration', () => {
    test('Forgot Password form submits correct data to backend API', async () => {
      // Mock the forgotPassword API call
      authApi.forgotPassword.mockResolvedValue({ 
        data: { success: true, message: 'Password reset email sent' } 
      });
      
      // Render the ForgotPassword component
      renderWithProviders(<ForgotPassword />);
      
      // Fill out the form
      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: 'forgot@example.com' }
      });
      
      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: /reset password/i }));
      
      // Wait for the API call to be made
      await waitFor(() => {
        // Check that the forgotPassword API was called with correct argument
        expect(authApi.forgotPassword).toHaveBeenCalledWith('forgot@example.com');
      });
    });
  });
});
