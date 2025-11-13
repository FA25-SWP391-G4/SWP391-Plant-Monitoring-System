import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SettingsPage from '../settings/page';
import { useAuth } from '@/providers/AuthProvider';
import { useSettings } from '@/providers/SettingsProvider';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import settingsApi from '@/api/settingsApi';

// Mock dependencies
jest.mock('@/providers/AuthProvider');
jest.mock('@/providers/SettingsProvider');
jest.mock('next/navigation');
jest.mock('react-i18next');
jest.mock('@/api/settingsApi');

describe('SettingsPage', () => {
    const mockRouter = { push: jest.fn() };
    const mockUpdateSettings = jest.fn();
    const mockT = jest.fn((key) => key);
    const mockI18n = { language: 'en' };

    beforeEach(() => {
        jest.clearAllMocks();
        useRouter.mockReturnValue(mockRouter);
        useSettings.mockReturnValue({ updateSettings: mockUpdateSettings });
        useTranslation.mockReturnValue({ t: mockT, i18n: mockI18n });
    });

    describe('Authentication', () => {
        it('should redirect to login when not authenticated', () => {
            useAuth.mockReturnValue({ user: null, loading: false });
            render(<SettingsPage />);
            expect(mockRouter.push).toHaveBeenCalledWith('/login');
        });

        it('should show loading state while checking authentication', () => {
            useAuth.mockReturnValue({ user: null, loading: true });
            render(<SettingsPage />);
            expect(screen.getByText(/loading/i)).toBeInTheDocument();
        });

        it('should render settings when authenticated', () => {
            useAuth.mockReturnValue({ user: { id: 1, name: 'Test User' }, loading: false });
            settingsApi.getUserSettings.mockResolvedValue({ data: {} });
            render(<SettingsPage />);
            expect(mockRouter.push).not.toHaveBeenCalled();
        });
    });

    describe('Settings Loading', () => {
        beforeEach(() => {
            useAuth.mockReturnValue({ user: { id: 1 }, loading: false });
        });

        it('should fetch user settings on mount', async () => {
            const mockSettings = {
                appearance: { theme: 'dark' },
                language: { preferred: 'vi' },
                notifications: { email: true },
                privacy: { shareData: false },
                widgets: { showPlantOverview: true }
            };
            settingsApi.getUserSettings.mockResolvedValue({ data: mockSettings });

            render(<SettingsPage />);

            await waitFor(() => {
                expect(settingsApi.getUserSettings).toHaveBeenCalled();
            });
        });

        it('should handle settings fetch error gracefully', async () => {
            settingsApi.getUserSettings.mockRejectedValue(new Error('API Error'));

            render(<SettingsPage />);

            await waitFor(() => {
                expect(screen.queryByText(/error/i)).toBeInTheDocument();
            });
        });

        it('should merge fetched settings with defaults', async () => {
            const partialSettings = {
                widgets: { showPlantOverview: false }
            };
            settingsApi.getUserSettings.mockResolvedValue({ data: partialSettings });

            render(<SettingsPage />);

            await waitFor(() => {
                expect(settingsApi.getUserSettings).toHaveBeenCalled();
            });
        });
    });

    describe('Widget Settings', () => {
        beforeEach(() => {
            useAuth.mockReturnValue({ user: { id: 1 }, loading: false });
            settingsApi.getUserSettings.mockResolvedValue({ data: {} });
        });

        it('should toggle widget visibility', async () => {
            render(<SettingsPage />);

            await waitFor(() => {
                const toggleButton = screen.getByRole('switch', { name: /showPlantOverview/i });
                fireEvent.click(toggleButton);
            });
        });

        it('should update global settings when widget setting changes', async () => {
            settingsApi.updateUserSettings.mockResolvedValue({ data: {} });

            render(<SettingsPage />);

            await waitFor(() => {
                const saveButton = screen.getByRole('button', { name: /save/i });
                fireEvent.click(saveButton);
            });

            expect(mockUpdateSettings).toHaveBeenCalled();
        });
    });

    describe('Tab Navigation', () => {
        beforeEach(() => {
            useAuth.mockReturnValue({ user: { id: 1 }, loading: false });
            settingsApi.getUserSettings.mockResolvedValue({ data: {} });
        });

        it('should default to widgets tab', () => {
            render(<SettingsPage />);
            expect(screen.getByRole('tab', { selected: true })).toHaveTextContent(/widgets/i);
        });

        it('should switch between tabs', () => {
            render(<SettingsPage />);
            
            const appearanceTab = screen.getByRole('tab', { name: /appearance/i });
            fireEvent.click(appearanceTab);
            
            expect(appearanceTab).toHaveAttribute('aria-selected', 'true');
        });
    });

    describe('Settings Persistence', () => {
        beforeEach(() => {
            useAuth.mockReturnValue({ user: { id: 1 }, loading: false });
            settingsApi.getUserSettings.mockResolvedValue({ data: {} });
        });

        it('should save settings successfully', async () => {
            settingsApi.updateUserSettings.mockResolvedValue({ data: { success: true } });

            render(<SettingsPage />);

            const saveButton = screen.getByRole('button', { name: /save/i });
            fireEvent.click(saveButton);

            await waitFor(() => {
                expect(settingsApi.updateUserSettings).toHaveBeenCalled();
                expect(screen.getByText(/success/i)).toBeInTheDocument();
            });
        });

        it('should handle save errors', async () => {
            settingsApi.updateUserSettings.mockRejectedValue(new Error('Save failed'));

            render(<SettingsPage />);

            const saveButton = screen.getByRole('button', { name: /save/i });
            fireEvent.click(saveButton);

            await waitFor(() => {
                expect(screen.getByText(/error/i)).toBeInTheDocument();
            });
        });

        it('should show loading state while saving', async () => {
            settingsApi.updateUserSettings.mockImplementation(
                () => new Promise(resolve => setTimeout(resolve, 100))
            );

            render(<SettingsPage />);

            const saveButton = screen.getByRole('button', { name: /save/i });
            fireEvent.click(saveButton);

            expect(screen.getByText(/saving/i)).toBeInTheDocument();
        });
    });

    describe('Language Settings', () => {
        beforeEach(() => {
            useAuth.mockReturnValue({ user: { id: 1 }, loading: false });
            settingsApi.getUserSettings.mockResolvedValue({ data: {} });
        });

        it('should update language preference', async () => {
            render(<SettingsPage />);

            const languageTab = screen.getByRole('tab', { name: /language/i });
            fireEvent.click(languageTab);

            const languageSelect = screen.getByRole('combobox', { name: /preferred/i });
            fireEvent.change(languageSelect, { target: { value: 'vi' } });

            expect(languageSelect).toHaveValue('vi');
        });
    });

    describe('Notification Settings', () => {
        beforeEach(() => {
            useAuth.mockReturnValue({ user: { id: 1 }, loading: false });
            settingsApi.getUserSettings.mockResolvedValue({ data: {} });
        });

        it('should toggle notification preferences', async () => {
            render(<SettingsPage />);

            const notificationsTab = screen.getByRole('tab', { name: /notifications/i });
            fireEvent.click(notificationsTab);

            const emailToggle = screen.getByRole('switch', { name: /email/i });
            fireEvent.click(emailToggle);
        });
    });

    describe('Privacy Settings', () => {
        beforeEach(() => {
            useAuth.mockReturnValue({ user: { id: 1 }, loading: false });
            settingsApi.getUserSettings.mockResolvedValue({ data: {} });
        });

        it('should update privacy settings', async () => {
            render(<SettingsPage />);

            const privacyTab = screen.getByRole('tab', { name: /privacy/i });
            fireEvent.click(privacyTab);

            const shareDataToggle = screen.getByRole('switch', { name: /shareData/i });
            fireEvent.click(shareDataToggle);
        });
    });
});