import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useRouter } from 'next/navigation';
import Home from '@/app/page';
const mockUseAuth = require('@/providers/AuthProvider').useAuth;
const mockUseTheme = require('@/contexts/ThemeContext').useTheme;
const mockUseTranslation = require('react-i18next').useTranslation;
const mockRedirect = require('next/navigation').redirect;

// Mock dependencies
jest.mock('next/navigation', () => ({
    redirect: jest.fn(),
    useRouter: jest.fn()
}));

jest.mock('@/providers/AuthProvider', () => ({
    useAuth: jest.fn()
}));

jest.mock('@/contexts/ThemeContext', () => ({
    useTheme: jest.fn()
}));

jest.mock('react-i18next', () => ({
    useTranslation: jest.fn()
}));

jest.mock('next/link', () => {
    return function MockLink({ children, href, ...props }) {
        return <a href={href} {...props}>{children}</a>;
    };
});

jest.mock('next/image', () => {
    return function MockImage({ src, alt, ...props }) {
        return <img src={src} alt={alt} {...props} />;
    };
});

jest.mock('next/head', () => {
    return function MockHead({ children }) {
        return <div data-testid="head">{children}</div>;
    };
});

// Mock unused components
jest.mock('@/components/MainLayout', () => {
    return function MockMainLayout({ children }) {
        return <div data-testid="main-layout">{children}</div>;
    };
});

jest.mock('@/components/LanguageSwitcher', () => {
    return function MockLanguageSwitcher() {
        return <div data-testid="language-switcher">Language Switcher</div>;
    };
});

jest.mock('@/components/dashboard/navigation/Navbar', () => {
    return function MockNavbar() {
        return <div data-testid="navbar">Navbar</div>;
    };
});

describe('Home Page Component', () => {

    const defaultAuthState = {
        user: null,
        loading: false
    };

    const defaultThemeState = {
        isDark: false,
        isLight: true,
        themeColors: {
            background: '#ffffff',
            foreground: '#000000'
        },
        getThemeColor: jest.fn()
    };

    const defaultTranslation = {
        t: (key, fallback) => fallback || key
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockUseAuth.mockReturnValue(defaultAuthState);
        mockUseTheme.mockReturnValue(defaultThemeState);
        mockUseTranslation.mockReturnValue(defaultTranslation);
    });

    describe('Component Rendering', () => {
        it('should render loading state when authentication is loading', () => {
            mockUseAuth.mockReturnValue({
                user: null,
                loading: true
            });

            render(<Home />);
            
            expect(screen.getByText('Loading...')).toBeInTheDocument();
        });

        it('should render the home page when user is not authenticated', () => {
            render(<Home />);
            
            expect(screen.getByText('Plant Monitoring System - Smart Plant Care')).toBeInTheDocument();
            expect(screen.getByText('Never Kill Another Plant')).toBeInTheDocument();
        });

        it('should redirect to dashboard when user is authenticated', async () => {
            mockUseAuth.mockReturnValue({
                user: { id: 1, name: 'Test User' },
                loading: false
            });

            render(<Home />);
            
            await waitFor(() => {
                expect(mockRedirect).toHaveBeenCalledWith('/dashboard');
            });
        });
    });

    describe('Theme Support', () => {
        it('should apply dark theme classes when isDark is true', () => {
            mockUseTheme.mockReturnValue({
                ...defaultThemeState,
                isDark: true,
                isLight: false
            });

            render(<Home />);
            
            const mainContainer = screen.getByRole('main', { hidden: true }) || document.querySelector('[class*="bg-gradient-to-b"]');
            expect(mainContainer).toHaveClass('from-gray-900', 'to-gray-800');
        });

        it('should apply light theme classes when isDark is false', () => {
            render(<Home />);
            
            const mainContainer = document.querySelector('[class*="bg-gradient-to-b"]');
            expect(mainContainer).toHaveClass('from-green-50', 'to-white');
        });

        it('should use theme colors for loading state', () => {
            mockUseAuth.mockReturnValue({
                user: null,
                loading: true
            });

            mockUseTheme.mockReturnValue({
                ...defaultThemeState,
                themeColors: {
                    background: '#1a202c',
                    foreground: '#ffffff'
                }
            });

            render(<Home />);
            
            const loadingDiv = screen.getByText('Loading...').parentElement;
            expect(loadingDiv).toHaveStyle({
                backgroundColor: '#1a202c',
                color: '#ffffff'
            });
        });
    });

    describe('Internationalization', () => {
        it('should display translated content using i18n', () => {
            const mockT = jest.fn((key, fallback) => {
                const translations = {
                    'home.pageTitle': 'Sistema de Monitoreo de Plantas',
                    'landing.smartPlantCare': 'Cuidado Inteligente de Plantas',
                    'landing.neverKill': 'Nunca Mates',
                    'landing.anotherPlant': 'Otra Planta'
                };
                return translations[key] || fallback || key;
            });

            mockUseTranslation.mockReturnValue({ t: mockT });

            render(<Home />);
            
            expect(mockT).toHaveBeenCalledWith('home.pageTitle', 'Plant Monitoring System - Smart Plant Care');
            expect(mockT).toHaveBeenCalledWith('landing.smartPlantCare');
            expect(screen.getByText('Sistema de Monitoreo de Plantas')).toBeInTheDocument();
        });

        it('should use fallback text when translation is not available', () => {
            const mockT = jest.fn((key, fallback) => fallback || key);
            mockUseTranslation.mockReturnValue({ t: mockT });

            render(<Home />);
            
            expect(screen.getByText('Plant Monitoring System - Smart Plant Care')).toBeInTheDocument();
            expect(screen.getByText('Start Free Trial')).toBeInTheDocument();
        });
    });

    describe('Navigation Elements', () => {
        it('should render CTA buttons with correct links', () => {
            render(<Home />);
            
            const registerLinks = screen.getAllByText('Start Free Trial');
            expect(registerLinks[0].closest('a')).toHaveAttribute('href', '/register');
            
            const demoLink = screen.getByText('Watch Demo');
            expect(demoLink.closest('a')).toHaveAttribute('href', '#demo');
        });

        it('should render footer navigation links', () => {
            render(<Home />);
            
            expect(screen.getByText('Features').closest('a')).toHaveAttribute('href', '/features');
            expect(screen.getByText('Pricing').closest('a')).toHaveAttribute('href', '/pricing');
            expect(screen.getByText('Contact').closest('a')).toHaveAttribute('href', '/contact');
        });
    });

    describe('Content Sections', () => {
        it('should render hero section with plant monitoring demo', () => {
            render(<Home />);
            
            expect(screen.getByText('Monstera Deliciosa')).toBeInTheDocument();
            expect(screen.getByText('85%')).toBeInTheDocument(); // Moisture level
            expect(screen.getByText('Perfect')).toBeInTheDocument(); // Light status
            expect(screen.getByText('Excellent')).toBeInTheDocument(); // Health status
        });

        it('should render features section with three main features', () => {
            render(<Home />);
            
            expect(screen.getByText('Smart Watering')).toBeInTheDocument();
            expect(screen.getByText('Light Optimization')).toBeInTheDocument();
            expect(screen.getByText('Health Alerts')).toBeInTheDocument();
        });

        it('should render testimonials section', () => {
            render(<Home />);
            
            expect(screen.getByText('Sarah Chen')).toBeInTheDocument();
            expect(screen.getByText('Marcus Rodriguez')).toBeInTheDocument();
            expect(screen.getByText('Emily Watson')).toBeInTheDocument();
        });

        it('should render additional features section', () => {
            render(<Home />);
            
            expect(screen.getByText('Mobile Dashboard')).toBeInTheDocument();
            expect(screen.getByText('AI Plant Doctor')).toBeInTheDocument();
            expect(screen.getByText('IoT Sensors')).toBeInTheDocument();
        });
    });

    describe('SEO and Metadata', () => {
        it('should render Head component with title and meta description', () => {
            render(<Home />);
            
            const headElement = screen.getByTestId('head');
            expect(headElement).toBeInTheDocument();
            expect(screen.getByText('Plant Monitoring System - Smart Plant Care')).toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('should include screen reader labels for social media icons', () => {
            render(<Home />);
            
            expect(screen.getByText('Email')).toBeInTheDocument();
            expect(screen.getByText('Phone')).toBeInTheDocument();
            expect(screen.getByText('Location')).toBeInTheDocument();
        });

        it('should have proper heading hierarchy', () => {
            render(<Home />);
            
            const h1Elements = screen.getAllByRole('heading', { level: 1 });
            const h2Elements = screen.getAllByRole('heading', { level: 2 });
            const h3Elements = screen.getAllByRole('heading', { level: 3 });
            
            expect(h1Elements.length).toBeGreaterThan(0);
            expect(h2Elements.length).toBeGreaterThan(0);
            expect(h3Elements.length).toBeGreaterThan(0);
        });
    });

    describe('Error Handling', () => {
        it('should handle missing translation gracefully', () => {
            const mockT = jest.fn((key, fallback) => {
                if (key === 'missing.key') return key;
                return fallback || key;
            });
            mockUseTranslation.mockReturnValue({ t: mockT });

            expect(() => render(<Home />)).not.toThrow();
        });

        it('should handle theme context errors gracefully', () => {
            mockUseTheme.mockReturnValue({
                isDark: false,
                isLight: true,
                themeColors: null, // Simulate missing theme colors
                getThemeColor: jest.fn()
            });

            expect(() => render(<Home />)).not.toThrow();
        });
    });

    describe('Component Integration', () => {
        it('should not render navigation components when user is not authenticated', () => {
            render(<Home />);
            
            // MainLayout and Navbar should not be rendered on landing page
            expect(screen.queryByTestId('main-layout')).not.toBeInTheDocument();
            expect(screen.queryByTestId('navbar')).not.toBeInTheDocument();
        });

        it('should render app logo with correct attributes', () => {
            render(<Home />);
            
            const logoImages = screen.getAllByAltText('PlantSmart Logo');
            expect(logoImages[0]).toHaveAttribute('src', '/app-icon.png');
            expect(logoImages[0]).toHaveAttribute('width', '16');
            expect(logoImages[0]).toHaveAttribute('height', '16');
        });
    });

    describe('Dynamic Content', () => {
        it('should display current year in footer', () => {
            render(<Home />);
            
            const currentYear = new Date().getFullYear();
            expect(screen.getByText(new RegExp(`© ${currentYear}`))).toBeInTheDocument();
        });

        it('should render star ratings in testimonials', () => {
            render(<Home />);
            
            const starRatings = screen.getAllByText('★★★★★');
            expect(starRatings).toHaveLength(3); // One for each testimonial
        });


    });
});