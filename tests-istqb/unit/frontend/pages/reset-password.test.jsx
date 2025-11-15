import { render, screen, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import ResetPasswordPage from '@/app/reset-password/page';

// Mock dependencies
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
    useSearchParams: jest.fn(),
}));

jest.mock('@/providers/AuthProvider', () => ({
    useAuth: jest.fn(),
}));

jest.mock('react-i18next', () => ({
    useTranslation: jest.fn(),
}));

jest.mock('@/contexts/ThemeContext', () => ({
    useTheme: jest.fn(),
}));

jest.mock('@/components/auth/ResetPasswordForm', () => ({
    ResetPasswordForm: ({ token }) => (
        <div data-testid="reset-password-form">Reset Password Form - Token: {token}</div>
    ),
}));

jest.mock('next/link', () => {
    return ({ children, href, ...props }) => (
        <a href={href} {...props}>{children}</a>
    );
});

describe('Reset Password Page', () => {
    const mockPush = jest.fn();
    const mockGet = jest.fn();
    const mockT = jest.fn((key, defaultValue) => defaultValue || key);
    const mockGetThemeColor = jest.fn((light, dark) => light);

    beforeEach(() => {
        jest.clearAllMocks();
        
        useRouter.mockReturnValue({
            push: mockPush,
        });

        useSearchParams.mockReturnValue({
            get: mockGet,
        });

        useAuth.mockReturnValue({
            loading: false,
        });

        useTranslation.mockReturnValue({
            t: mockT,
        });

        useTheme.mockReturnValue({
            isDark: false,
            isLight: true,
            getThemeColor: mockGetThemeColor,
        });

        // Mock window.location
        delete window.location;
        window.location = {
            pathname: '/reset-password',
            href: 'http://localhost:3000/reset-password?token=test-token',
        };
    });

    it('should display loading state when auth is loading', () => {
        useAuth.mockReturnValue({
            loading: true,
        });

        render(<ResetPasswordPage />);

        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should redirect to forgot-password when no token is provided', async () => {
        mockGet.mockReturnValue(null);

        render(<ResetPasswordPage />);

        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/forgot-password');
        });
    });

    it('should display invalid reset link message when token is empty after check', async () => {
        mockGet.mockReturnValue('');

        render(<ResetPasswordPage />);

        await waitFor(() => {
            expect(screen.getByText('Invalid Reset Link')).toBeInTheDocument();
        });

        expect(screen.getByText('The password reset link is missing or invalid.')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Request New Reset Link' })).toHaveAttribute('href', '/forgot-password');
    });

    it('should render reset password form with valid token', async () => {
        const testToken = 'valid-reset-token-123';
        mockGet.mockReturnValue(testToken);

        render(<ResetPasswordPage />);

        await waitFor(() => {
            expect(screen.getByTestId('reset-password-form')).toBeInTheDocument();
        });

        expect(screen.getByTestId('reset-password-form')).toHaveTextContent(`Token: ${testToken}`);
    });

    it('should display correct UI elements in main view', async () => {
        mockGet.mockReturnValue('test-token');

        render(<ResetPasswordPage />);

        await waitFor(() => {
            expect(screen.getByText('🔒 Password Reset')).toBeInTheDocument();
        });

        expect(screen.getByText('Reset Your')).toBeInTheDocument();
        expect(screen.getByText('Password')).toBeInTheDocument();
        expect(screen.getByText("Enter your new password below. Make sure it's strong and secure to protect your plant monitoring account.")).toBeInTheDocument();
    });

    it('should display footer with correct branding', async () => {
        mockGet.mockReturnValue('test-token');

        render(<ResetPasswordPage />);

        await waitFor(() => {
            expect(screen.getAllByText('PlantSmart')).toHaveLength(2);
        });

        const currentYear = new Date().getFullYear();
        expect(screen.getByText(`© ${currentYear} PlantSmart. All rights reserved.`)).toBeInTheDocument();
    });

    it('should use dark theme colors when isDark is true', async () => {
        mockGet.mockReturnValue('test-token');
        useTheme.mockReturnValue({
            isDark: true,
            isLight: false,
            getThemeColor: mockGetThemeColor,
        });

        render(<ResetPasswordPage />);

        await waitFor(() => {
            expect(screen.getByTestId('reset-password-form')).toBeInTheDocument();
        });

        expect(mockGetThemeColor).toHaveBeenCalledWith('#16a34a', '#22c55e');
    });

    it('should handle translation keys correctly', async () => {
        mockGet.mockReturnValue('test-token');

        render(<ResetPasswordPage />);

        await waitFor(() => {
            expect(mockT).toHaveBeenCalledWith('auth.passwordReset', 'Password Reset');
        });

        expect(mockT).toHaveBeenCalledWith('auth.resetPasswordHeader', 'Reset Your');
        expect(mockT).toHaveBeenCalledWith('auth.password', 'Password');
        expect(mockT).toHaveBeenCalledWith('auth.resetPasswordMessage', expect.any(String));
    });

    it('should handle invalid reset link translation keys', async () => {
        mockGet.mockReturnValue('');

        render(<ResetPasswordPage />);

        await waitFor(() => {
            expect(mockT).toHaveBeenCalledWith('auth.invalidResetLink', 'Invalid Reset Link');
        });

        expect(mockT).toHaveBeenCalledWith('auth.invalidResetLinkMessage', 'The password reset link is missing or invalid.');
        expect(mockT).toHaveBeenCalledWith('auth.requestNewResetLink', 'Request New Reset Link');
    });

    it('should call getThemeColor for styling elements', async () => {
        mockGet.mockReturnValue('test-token');

        render(<ResetPasswordPage />);

        await waitFor(() => {
            expect(mockGetThemeColor).toHaveBeenCalled();
        });

        expect(mockGetThemeColor).toHaveBeenCalledWith('#dcfce7', '#14532d');
        expect(mockGetThemeColor).toHaveBeenCalledWith('#15803d', '#22c55e');
        expect(mockGetThemeColor).toHaveBeenCalledWith('#16a34a', '#22c55e');
    });

    it('should not redirect authenticated users', async () => {
        mockGet.mockReturnValue('test-token');
        useAuth.mockReturnValue({
            loading: false,
            user: { id: 1, email: 'test@example.com' },
        });

        render(<ResetPasswordPage />);

        await waitFor(() => {
            expect(screen.getByTestId('reset-password-form')).toBeInTheDocument();
        });

        expect(mockPush).not.toHaveBeenCalledWith('/dashboard');
    });
});