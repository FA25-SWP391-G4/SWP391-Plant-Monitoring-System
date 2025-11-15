import React from 'react';
import { render, screen } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import LoginPage from '@/app/login/page';
const { useAuth } = require('@/providers/AuthProvider');

// Mock dependencies
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));

jest.mock('@/providers/AuthProvider', () => ({
    useAuth: jest.fn(),
}));

jest.mock('@/components/auth/LoginForm', () => ({
    LoginForm: jest.fn(() => <div data-testid="login-form">Login Form</div>),
}));

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key, defaultValue) => defaultValue || key,
    }),
}));

jest.mock('@/contexts/ThemeContext', () => ({
    useTheme: () => ({
        isDark: false,
        isLight: true,
        getThemeColor: (lightColor, darkColor) => lightColor,
    }),
}));

jest.mock('next/link', () => {
    return ({ children, href, ...props }) => (
        <a href={href} {...props}>
            {children}
        </a>
    );
});


describe('LoginPage', () => {
    const mockPush = jest.fn();

    beforeEach(() => {
        useRouter.mockReturnValue({
            push: mockPush,
        });
        jest.clearAllMocks();
    });

    it('renders loading state when loading is true', () => {
        useAuth.mockReturnValue({
            user: null,
            loading: true,
        });

        render(<LoginPage />);

        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('redirects to dashboard when user is authenticated', () => {
        useAuth.mockReturnValue({
            user: { id: 1, email: 'test@example.com' },
            loading: false,
        });

        render(<LoginPage />);

        expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });

    it('renders login page content when not loading and no user', () => {
        useAuth.mockReturnValue({
            user: null,
            loading: false,
        });

        render(<LoginPage />);

        expect(screen.getByText('Welcome Back to')).toBeInTheDocument();
        expect(screen.getByText('PlantSmart')).toBeInTheDocument();
        expect(screen.getByTestId('login-form')).toBeInTheDocument();
    });

    it('renders welcome back badge', () => {
        useAuth.mockReturnValue({
            user: null,
            loading: false,
        });

        render(<LoginPage />);

        expect(screen.getByText('🌱 Welcome Back')).toBeInTheDocument();
    });

    it('renders login message', () => {
        useAuth.mockReturnValue({
            user: null,
            loading: false,
        });

        render(<LoginPage />);

        expect(screen.getByText('Sign in to continue nurturing your green sanctuary with intelligent care, real-time insights, and friendly reminders.')).toBeInTheDocument();
    });

    it('renders feature list items', () => {
        useAuth.mockReturnValue({
            user: null,
            loading: false,
        });

        render(<LoginPage />);

        expect(screen.getByText('Smart watering schedules tailored to each plant')).toBeInTheDocument();
        expect(screen.getByText('Health alerts and expert recommendations')).toBeInTheDocument();
        expect(screen.getByText('Beautiful dashboard across all your devices')).toBeInTheDocument();
    });

    it('renders footer with copyright and navigation links', () => {
        useAuth.mockReturnValue({
            user: null,
            loading: false,
        });

        render(<LoginPage />);

        const currentYear = new Date().getFullYear();
        expect(screen.getByText(`© ${currentYear} PlantSmart. All rights reserved.`)).toBeInTheDocument();
        expect(screen.getByText('Return to main site')).toBeInTheDocument();
        expect(screen.getByText('Privacy')).toBeInTheDocument();
        expect(screen.getByText('Terms')).toBeInTheDocument();
    });

    it('renders navigation links with correct hrefs', () => {
        useAuth.mockReturnValue({
            user: null,
            loading: false,
        });

        render(<LoginPage />);

        expect(screen.getByRole('link', { name: /return to main site/i })).toHaveAttribute('href', '/');
        expect(screen.getByRole('link', { name: /privacy/i })).toHaveAttribute('href', '/privacy');
        expect(screen.getByRole('link', { name: /terms/i })).toHaveAttribute('href', '/terms');
    });

    it('does not redirect when loading is true even with user', () => {
        useAuth.mockReturnValue({
            user: { id: 1, email: 'test@example.com' },
            loading: true,
        });

        render(<LoginPage />);

        expect(mockPush).not.toHaveBeenCalled();
        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('renders LoginForm component', () => {
        useAuth.mockReturnValue({
            user: null,
            loading: false,
        });

        render(<LoginPage />);

        expect(screen.getByTestId('login-form')).toBeInTheDocument();
    });
});