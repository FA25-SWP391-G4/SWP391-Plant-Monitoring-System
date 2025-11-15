import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import ForgotPasswordPage from '@/app/forgot-password/page';
const mockUseAuth = require('@/providers/AuthProvider').useAuth;
const mockUseTheme = require('@/contexts/ThemeContext').useTheme;

// Mock dependencies
jest.mock('next/navigation', () => ({
    useRouter: jest.fn()
}));

jest.mock('@/components/auth/ForgotPasswordForm', () => ({
    ForgotPasswordForm: () => <div data-testid="forgot-password-form">Forgot Password Form</div>
}));

jest.mock('@/providers/AuthProvider', () => ({
    useAuth: jest.fn()
}));

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key, fallback) => fallback || key
    })
}));

jest.mock('@/contexts/ThemeContext', () => ({
    useTheme: () => ({
        isDark: false,
        isLight: true,
        getThemeColor: (light, dark) => light
    })
}));

const mockPush = jest.fn();

beforeEach(() => {
    jest.clearAllMocks();
    useRouter.mockReturnValue({
        push: mockPush
    });
});

describe('ForgotPasswordPage', () => {
    it('should render loading state when loading is true', () => {
        mockUseAuth.mockReturnValue({
            user: null,
            loading: true
        });

        render(<ForgotPasswordPage />);

        expect(screen.getByText('Loading...')).toBeInTheDocument();
        expect(screen.queryByTestId('forgot-password-form')).not.toBeInTheDocument();
    });

    it('should redirect to home when user is authenticated', async () => {
        mockUseAuth.mockReturnValue({
            user: { id: 1, email: 'test@example.com' },
            loading: false
        });

        render(<ForgotPasswordPage />);

        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/');
        });
    });

    it('should render forgot password page when user is not authenticated', () => {
        mockUseAuth.mockReturnValue({
            user: null,
            loading: false
        });

        render(<ForgotPasswordPage />);

        expect(screen.getByText('Password Recovery')).toBeInTheDocument();
        expect(screen.getByText('Forgot Your Password?')).toBeInTheDocument();
        expect(screen.getByText('No Worries')).toBeInTheDocument();
        expect(screen.getByTestId('forgot-password-form')).toBeInTheDocument();
    });

    it('should display correct translated content', () => {
        mockUseAuth.mockReturnValue({
            user: null,
            loading: false
        });

        render(<ForgotPasswordPage />);

        expect(screen.getByText('Password Recovery')).toBeInTheDocument();
        expect(screen.getByText('Forgot Your Password?')).toBeInTheDocument();
        expect(screen.getByText('No Worries')).toBeInTheDocument();
        expect(screen.getByText("We'll help you reset your password and get back to caring for your plants in no time.")).toBeInTheDocument();
        expect(screen.getByText('PlantSmart')).toBeInTheDocument();
        expect(screen.getByText('All rights reserved.')).toBeInTheDocument();
    });

    it('should render footer with correct content', () => {
        mockUseAuth.mockReturnValue({
            user: null,
            loading: false
        });

        render(<ForgotPasswordPage />);

        const currentYear = new Date().getFullYear();
        expect(screen.getByText(`© ${currentYear} PlantSmart. All rights reserved.`)).toBeInTheDocument();
    });

    it('should apply dark theme styles correctly', () => {
        mockUseTheme.mockReturnValue({
            isDark: true,
            isLight: false,
            getThemeColor: (light, dark) => dark
        });

        mockUseAuth.mockReturnValue({
            user: null,
            loading: false
        });

        render(<ForgotPasswordPage />);

        const mainDiv = screen.getByRole('main').parentElement;
        expect(mainDiv).toHaveStyle({
            background: 'linear-gradient(to bottom right, hsl(var(--background)), hsl(var(--muted)/0.1), hsl(var(--muted)/0.2))'
        });
    });

    it('should not redirect when loading is true even if user exists', () => {
        mockUseAuth.mockReturnValue({
            user: { id: 1, email: 'test@example.com' },
            loading: true
        });

        render(<ForgotPasswordPage />);

        expect(mockPush).not.toHaveBeenCalled();
    });
});