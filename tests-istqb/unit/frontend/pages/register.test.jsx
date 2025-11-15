import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useRouter } from 'next/navigation';
import RegisterPage from '@/app/register/page';
const { useAuth } = require('@/providers/AuthProvider');

// Mock dependencies
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));

jest.mock('@/providers/AuthProvider', () => ({
    useAuth: jest.fn(),
}));

jest.mock('@/components/auth/RegisterForm', () => ({
    RegisterForm: () => <div data-testid="register-form">Register Form</div>,
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


describe('Register Page', () => {
    const mockPush = jest.fn();

    beforeEach(() => {
        useRouter.mockReturnValue({
            push: mockPush,
        });
        jest.clearAllMocks();
    });

    it('should render loading state when auth is loading', () => {
        useAuth.mockReturnValue({
            user: null,
            loading: true,
        });

        render(<RegisterPage />);

        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should redirect to dashboard when user is already authenticated', async () => {
        useAuth.mockReturnValue({
            user: { id: 1, email: 'test@example.com' },
            loading: false,
        });

        render(<RegisterPage />);

        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/dashboard');
        });
    });

    it('should render register form when user is not authenticated', () => {
        useAuth.mockReturnValue({
            user: null,
            loading: false,
        });

        render(<RegisterPage />);

        expect(screen.getByTestId('register-form')).toBeInTheDocument();
        expect(screen.getByText('Create an Account')).toBeInTheDocument();
        expect(screen.getByText('Start Growing')).toBeInTheDocument();
    });

    it('should display registration welcome message', () => {
        useAuth.mockReturnValue({
            user: null,
            loading: false,
        });

        render(<RegisterPage />);

        expect(screen.getByText('Join our community of plant enthusiasts and start monitoring your plants with intelligent care and real-time insights.')).toBeInTheDocument();
    });

    it('should display feature list on desktop', () => {
        useAuth.mockReturnValue({
            user: null,
            loading: false,
        });

        render(<RegisterPage />);

        expect(screen.getByText('Smart watering schedules tailored to each plant')).toBeInTheDocument();
        expect(screen.getByText('Health alerts and expert recommendations')).toBeInTheDocument();
        expect(screen.getByText('Beautiful dashboard across all your devices')).toBeInTheDocument();
    });

    it('should display sign in link', () => {
        useAuth.mockReturnValue({
            user: null,
            loading: false,
        });

        render(<RegisterPage />);

        expect(screen.getByText('Already have an account?')).toBeInTheDocument();
        const signInLink = screen.getByText('Sign in');
        expect(signInLink).toBeInTheDocument();
        expect(signInLink.closest('a')).toHaveAttribute('href', '/login');
    });

    it('should display footer with copyright and navigation links', () => {
        useAuth.mockReturnValue({
            user: null,
            loading: false,
        });

        render(<RegisterPage />);

        const currentYear = new Date().getFullYear();
        expect(screen.getByText(`© ${currentYear} PlantSmart. All rights reserved.`)).toBeInTheDocument();
        
        const returnLink = screen.getByText('Return to main site');
        expect(returnLink.closest('a')).toHaveAttribute('href', '/');
        
        const privacyLink = screen.getByText('Privacy');
        expect(privacyLink.closest('a')).toHaveAttribute('href', '/privacy');
        
        const termsLink = screen.getByText('Terms');
        expect(termsLink.closest('a')).toHaveAttribute('href', '/terms');
    });

    it('should display join us badge', () => {
        useAuth.mockReturnValue({
            user: null,
            loading: false,
        });

        render(<RegisterPage />);

        expect(screen.getByText('🌱 Join Us')).toBeInTheDocument();
    });

    it('should not redirect when loading is true even with user', () => {
        useAuth.mockReturnValue({
            user: { id: 1, email: 'test@example.com' },
            loading: true,
        });

        render(<RegisterPage />);

        expect(mockPush).not.toHaveBeenCalled();
        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });