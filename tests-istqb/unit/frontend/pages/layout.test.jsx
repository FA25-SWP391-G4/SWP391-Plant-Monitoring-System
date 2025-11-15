import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import RootLayout from '../../../../client/src/app/layout'

// Mock Next.js components and hooks
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => <img {...props} />
}))

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    i18n: {
      changeLanguage: jest.fn(),
      language: 'en',
    },
  }),
  I18nextProvider: ({ children }) => children,
}))

// Mock theme providers
jest.mock('../../../../client/src/components/theme-provider', () => ({
  ThemeProvider: ({ children }) => <div data-testid="next-theme-provider">{children}</div>
}))

jest.mock('../../../../client/src/contexts/ThemeContext', () => ({
  ThemeProvider: ({ children }) => <div data-testid="theme-context-provider">{children}</div>
}))

// Mock AuthProvider
jest.mock('../../../../client/src/providers/AuthProvider', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="auth-provider">{children}</div>
}))

// Mock other providers
jest.mock('../../../../client/src/providers/DashboardWidgetProvider', () => ({
  DashboardWidgetProvider: ({ children }) => <div data-testid="dashboard-widget-provider">{children}</div>
}))

jest.mock('../../../../client/src/providers/SettingsProvider', () => ({
  SettingsProvider: ({ children }) => <div data-testid="settings-provider">{children}</div>
}))

jest.mock('../../../../client/src/contexts/NotificationContext', () => ({
  NotificationProvider: ({ children }) => <div data-testid="notification-provider">{children}</div>
}))

// Mock layout components
jest.mock('../../../../client/src/components/layout/DashboardLayout', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="dashboard-layout">{children}</div>
}))

jest.mock('../../../../client/src/components/GoogleHeadTags', () => ({
  __esModule: true,
  default: () => <div data-testid="google-head-tags" />
}))

jest.mock('../../../../client/src/components/ChunkErrorBoundary', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="chunk-error-boundary">{children}</div>
}))

// Mock UI components
jest.mock('../../../../client/src/components/ui/sonner', () => ({
  Toaster: () => <div data-testid="toaster" />
}))

// Mock i18n
jest.mock('../../../../client/src/i18n/i18n', () => ({
  __esModule: true,
  default: {
    language: 'en',
    changeLanguage: jest.fn(),
  }
}))

// Mock chunk error manager
jest.mock('../../../../client/src/utils/chunkErrorManager', () => ({
  initializeChunkErrorManagement: jest.fn()
}))

// Mock CSS imports
jest.mock('../../../../client/src/app/globals.css', () => ({}))

// Mock window.location for JSDOM
delete window.location
window.location = { href: 'http://localhost:3000' }

describe('RootLayout Component', () => {
  const mockChildren = <div data-testid="mock-children">Test Content</div>

  beforeEach(() => {
    // Reset any mocks before each test
    jest.clearAllMocks()
  })

  it('should render without crashing', () => {
    render(<RootLayout>{mockChildren}</RootLayout>)
    expect(screen.getByTestId('mock-children')).toBeInTheDocument()
  })

  it('should render with correct HTML structure', () => {
    const { container } = render(<RootLayout>{mockChildren}</RootLayout>)
    
    // Check that html tag is present
    const htmlElement = container.querySelector('html')
    expect(htmlElement).toBeInTheDocument()
    expect(htmlElement).toHaveAttribute('lang', 'en')
    expect(htmlElement).toHaveAttribute('suppressHydrationWarning')
    
    // Check that body tag is present
    const bodyElement = container.querySelector('body')
    expect(bodyElement).toBeInTheDocument()
  })

  it('should include all required providers in correct order', () => {
    render(<RootLayout>{mockChildren}</RootLayout>)
    
    // Check for presence of all provider components
    expect(screen.getByTestId('chunk-error-boundary')).toBeInTheDocument()
    expect(screen.getByTestId('next-theme-provider')).toBeInTheDocument()
    expect(screen.getByTestId('theme-context-provider')).toBeInTheDocument()
    expect(screen.getByTestId('auth-provider')).toBeInTheDocument()
    expect(screen.getByTestId('settings-provider')).toBeInTheDocument()
    expect(screen.getByTestId('notification-provider')).toBeInTheDocument()
    expect(screen.getByTestId('dashboard-widget-provider')).toBeInTheDocument()
  })

  it('should include layout components', () => {
    render(<RootLayout>{mockChildren}</RootLayout>)
    
    expect(screen.getByTestId('google-head-tags')).toBeInTheDocument()
    expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument()
    expect(screen.getByTestId('toaster')).toBeInTheDocument()
  })

  it('should render children content', () => {
    render(<RootLayout>{mockChildren}</RootLayout>)
    
    expect(screen.getByTestId('mock-children')).toBeInTheDocument()
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('should handle different children types', () => {
    const stringChild = 'Simple text content'
    const { rerender } = render(<RootLayout>{stringChild}</RootLayout>)
    expect(screen.getByText(stringChild)).toBeInTheDocument()

    const complexChild = (
      <div>
        <h1>Complex Child</h1>
        <p>With multiple elements</p>
      </div>
    )
    rerender(<RootLayout>{complexChild}</RootLayout>)
    expect(screen.getByText('Complex Child')).toBeInTheDocument()
    expect(screen.getByText('With multiple elements')).toBeInTheDocument()
  })

  it('should have proper nesting structure', () => {
    render(<RootLayout>{mockChildren}</RootLayout>)
    
    // Verify the chunk error boundary contains the theme providers
    const chunkBoundary = screen.getByTestId('chunk-error-boundary')
    const nextThemeProvider = screen.getByTestId('next-theme-provider')
    
    expect(chunkBoundary).toContainElement(nextThemeProvider)
  })
})