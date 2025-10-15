// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock MQTT client
jest.mock('mqtt', () => ({
  connect: jest.fn(() => ({
    on: jest.fn(),
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    publish: jest.fn(),
    end: jest.fn(),
    connected: true
  }))
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn()
  }),
  useSearchParams: () => ({
    get: jest.fn(() => null)
  }),
  usePathname: () => '/'
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock FileReader
global.FileReader = class FileReader {
  constructor() {
    this.readAsDataURL = jest.fn(() => {
      this.onloadend && this.onloadend();
    });
    this.result = 'data:image/jpeg;base64,test';
  }
};

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mocked-url');
global.URL.revokeObjectURL = jest.fn();

// Suppress console warnings during tests
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

beforeAll(() => {
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
});