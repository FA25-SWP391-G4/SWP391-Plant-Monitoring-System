import axios from 'axios';
import Cookies from 'js-cookie';
import { setupRedirectInterceptor } from '@/utils/redirectHandler';
import axiosClient from '@/api/axiosClient';

// Mock dependencies
jest.mock('axios');
jest.mock('js-cookie');
jest.mock('@/utils/redirectHandler');

// Mock console methods to avoid noise in tests
const mockConsole = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
};

describe('axiosClient', () => {
  let mockAxiosInstance;
  let mockRequest;
  let mockResponse;
  let originalWindow;
  let originalLocalStorage;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock axios.create
    mockAxiosInstance = {
      interceptors: {
        request: {
          use: jest.fn()
        },
        response: {
          use: jest.fn()
        }
      }
    };
    axios.create.mockReturnValue(mockAxiosInstance);

    // Mock window and localStorage
    originalWindow = global.window;
    originalLocalStorage = global.localStorage;
    
    global.window = {
      location: {
        pathname: '/dashboard',
        href: ''
      }
    };
    
    global.localStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn()
    };

    // Mock console
    global.console = mockConsole;

    // Setup mock request and response objects
    mockRequest = {
      method: 'get',
      url: '/api/test',
      baseURL: 'http://localhost:3000',
      headers: {},
      data: null
    };

    mockResponse = {
      status: 200,
      statusText: 'OK',
      data: { success: true },
      config: mockRequest,
      headers: {}
    };
  });

  afterEach(() => {
    global.window = originalWindow;
    global.localStorage = originalLocalStorage;
    global.console = console;
  });

  describe('Initialization', () => {
    it('should create axios instance with correct configuration', () => {
      expect(axios.create).toHaveBeenCalledWith({
        baseURL: process.env.NEXT_PUBLIC_API_URL,
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        },
        maxRedirects: 0
      });
    });

    it('should setup request and response interceptors', () => {
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });

    it('should setup redirect interceptor', () => {
      expect(setupRedirectInterceptor).toHaveBeenCalledWith(mockAxiosInstance);
    });
  });

  describe('Request Interceptor', () => {
    let requestInterceptor;

    beforeEach(() => {
      // Get the request interceptor function
      requestInterceptor = mockAxiosInstance.interceptors.request.use.mock.calls[0][0];
    });

    it('should add token from cookies to Authorization header', () => {
      const mockToken = 'mock-jwt-token';
      Cookies.get.mockReturnValue(mockToken);

      const config = requestInterceptor(mockRequest);

      expect(Cookies.get).toHaveBeenCalledWith('token');
      expect(config.headers.Authorization).toBe(`Bearer ${mockToken}`);
    });

    it('should fallback to token_client cookie if token cookie not found', () => {
      const mockToken = 'mock-client-token';
      Cookies.get.mockImplementation((key) => {
        if (key === 'token') return null;
        if (key === 'token_client') return mockToken;
        return null;
      });

      const config = requestInterceptor(mockRequest);

      expect(config.headers.Authorization).toBe(`Bearer ${mockToken}`);
    });

    it('should fallback to localStorage if no cookies found', () => {
      const mockToken = 'mock-localStorage-token';
      Cookies.get.mockReturnValue(null);
      global.localStorage.getItem.mockReturnValue(mockToken);

      const config = requestInterceptor(mockRequest);

      expect(global.localStorage.getItem).toHaveBeenCalledWith('auth_token');
      expect(config.headers.Authorization).toBe(`Bearer ${mockToken}`);
    });

    it('should trim token whitespace', () => {
      const mockToken = '  mock-token-with-spaces  ';
      Cookies.get.mockReturnValue(mockToken);

      const config = requestInterceptor(mockRequest);

      expect(config.headers.Authorization).toBe('Bearer mock-token-with-spaces');
    });

    it('should not add Authorization header if no token found', () => {
      Cookies.get.mockReturnValue(null);
      global.localStorage.getItem.mockReturnValue(null);

      const config = requestInterceptor(mockRequest);

      expect(config.headers.Authorization).toBeUndefined();
    });

    it('should handle server-side rendering (no window)', () => {
      global.window = undefined;

      const config = requestInterceptor(mockRequest);

      expect(config.headers.Authorization).toBeUndefined();
    });

    it('should mask password in debug logs', () => {
      process.env.NODE_ENV = 'development';
      const configWithPassword = {
        ...mockRequest,
        data: { username: 'test', password: 'secret123' }
      };

      requestInterceptor(configWithPassword);

      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('[AXIOS DEBUG] Request payload:'),
        expect.objectContaining({
          username: 'test',
          password: '********'
        })
      );
    });

    it('should log payment request warnings when no token', () => {
      process.env.NODE_ENV = 'development';
      const paymentConfig = { ...mockRequest, url: '/payment/create' };
      Cookies.get.mockReturnValue(null);
      global.localStorage.getItem.mockReturnValue(null);

      requestInterceptor(paymentConfig);

      expect(mockConsole.warn).toHaveBeenCalledWith(
        '[PAYMENT DEBUG] WARNING: Making payment request without authentication token!'
      );
    });
  });

  describe('Response Interceptor Success', () => {
    let responseSuccessInterceptor;

    beforeEach(() => {
      responseSuccessInterceptor = mockAxiosInstance.interceptors.response.use.mock.calls[0][0];
    });

    it('should return response unchanged', () => {
      const result = responseSuccessInterceptor(mockResponse);

      expect(result).toBe(mockResponse);
    });

    it('should log response in development mode', () => {
      process.env.NODE_ENV = 'development';

      responseSuccessInterceptor(mockResponse);

      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('[AXIOS DEBUG] Response received from'),
        expect.objectContaining({
          status: 200,
          statusText: 'OK',
          data: { success: true }
        })
      );
    });
  });

  describe('Response Interceptor Error', () => {
    let responseErrorInterceptor;

    beforeEach(() => {
      responseErrorInterceptor = mockAxiosInstance.interceptors.response.use.mock.calls[0][1];
    });

    it('should handle 401 errors by clearing cookies and redirecting', async () => {
      const error = {
        response: {
          status: 401,
          statusText: 'Unauthorized',
          data: { message: 'Token expired' },
          headers: {},
          config: mockRequest
        }
      };

      await expect(responseErrorInterceptor(error)).rejects.toBe(error);

      expect(Cookies.remove).toHaveBeenCalledWith('token');
      expect(Cookies.remove).toHaveBeenCalledWith('user');
      expect(global.localStorage.setItem).toHaveBeenCalledWith('redirectAfterLogin', '/dashboard');
      expect(global.window.location.href).toBe('/login');
    });

    it('should not redirect if already on login page', async () => {
      global.window.location.pathname = '/login';
      const error = {
        response: {
          status: 401,
          statusText: 'Unauthorized',
          data: {},
          headers: {},
          config: mockRequest
        }
      };

      await expect(responseErrorInterceptor(error)).rejects.toBe(error);

      expect(global.window.location.href).toBe('');
      expect(mockConsole.log).toHaveBeenCalledWith(
        '[AXIOS DEBUG] Already on login page, not redirecting'
      );
    });

    it('should handle 405 Method Not Allowed errors', async () => {
      process.env.NODE_ENV = 'development';
      const error = {
        response: {
          status: 405,
          statusText: 'Method Not Allowed',
          data: {},
          headers: { allow: 'GET, POST' },
          config: mockRequest
        }
      };

      await expect(responseErrorInterceptor(error)).rejects.toBe(error);

      expect(mockConsole.error).toHaveBeenCalledWith(
        '[AXIOS DEBUG] 405 Method Not Allowed error:',
        expect.objectContaining({
          url: mockRequest.url,
          method: mockRequest.method,
          allowedMethods: 'GET, POST'
        })
      );
    });

    it('should handle network errors (no response)', async () => {
      const error = {
        request: { status: 0 },
        message: 'Network Error'
      };

      await expect(responseErrorInterceptor(error)).rejects.toBe(error);

      expect(mockConsole.error).toHaveBeenCalledWith(
        '[AXIOS DEBUG] No response received:',
        error.request
      );
    });

    it('should handle request setup errors', async () => {
      const error = {
        message: 'Request setup failed'
      };

      await expect(responseErrorInterceptor(error)).rejects.toBe(error);

      expect(mockConsole.error).toHaveBeenCalledWith(
        '[AXIOS DEBUG] Request setup error:',
        'Request setup failed'
      );
    });

    it('should log detailed error information in development mode', async () => {
      process.env.NODE_ENV = 'development';
      const error = {
        response: {
          status: 500,
          statusText: 'Internal Server Error',
          data: { error: 'Database error' },
          headers: { 'content-type': 'application/json' },
          config: mockRequest
        }
      };

      await expect(responseErrorInterceptor(error)).rejects.toBe(error);

      expect(mockConsole.error).toHaveBeenCalledWith(
        '[AXIOS DEBUG] Response error (500):',
        expect.objectContaining({
          status: 500,
          statusText: 'Internal Server Error',
          data: { error: 'Database error' }
        })
      );
    });

    it('should handle 401 error in server-side environment', async () => {
      global.window = undefined;
      const error = {
        response: {
          status: 401,
          statusText: 'Unauthorized',
          data: {},
          headers: {},
          config: mockRequest
        }
      };

      await expect(responseErrorInterceptor(error)).rejects.toBe(error);

      expect(Cookies.remove).toHaveBeenCalledWith('token');
      expect(Cookies.remove).toHaveBeenCalledWith('user');
    });
  });

  describe('Request Interceptor Error Handler', () => {
    let requestErrorInterceptor;

    beforeEach(() => {
      requestErrorInterceptor = mockAxiosInstance.interceptors.request.use.mock.calls[0][1];
    });

    it('should handle request errors and log in development mode', async () => {
      process.env.NODE_ENV = 'development';
      const error = new Error('Request configuration error');

      await expect(requestErrorInterceptor(error)).rejects.toBe(error);

      expect(mockConsole.error).toHaveBeenCalledWith(
        '[AXIOS DEBUG] Request error:',
        error
      );
    });

    it('should not log in production mode', async () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Request error');

      await expect(requestErrorInterceptor(error)).rejects.toBe(error);

      expect(mockConsole.error).not.toHaveBeenCalled();
    });
  });
});