import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/providers/AuthProvider";
import { useTranslation } from "react-i18next";
import UserMenu from './UserMenu';
import { useState, useRef, useEffect } from "react";
import { useTheme } from '@/contexts/ThemeContext';
import LogoutConfirmationModal from '../LogoutConfirmationModal';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { isDark, isLight, getThemeColor } = useTheme();

  // No longer needed since UserMenu handles its own state

  // Determine user role for conditional rendering
  const isPremium = user?.role === "Premium";
  const isAdmin = user?.role === "Admin";
  const isAuthenticated = !!user;

  // Check if we're on a page where navbar should be hidden
  const location = typeof window !== 'undefined' ? window.location : { pathname: '' };
  const isAuthPage = location.pathname.includes('/login') || location.pathname.includes('/register') || location.pathname.includes('/forget-password') || location.pathname.includes('/reset-password');

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className="container mx-auto px-4 py-6 flex items-center justify-between">
      {/* Logo and Brand */}
      <a href="/" className="flex items-center">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center mr-2"
              style={{ 
                background: `linear-gradient(to bottom right, ${getThemeColor('#4ade80', '#22c55e')}, ${getThemeColor('#16a34a', '#15803d')})` 
              }}>
          <Image src="/app-icon.png" alt="PlantSmart Logo" width={20} height={20} />
        </div>
        <span className="text-xl font-bold text-foreground">{t('common.appName', 'PlantSmart')}</span>
      </a>

      {/* Mobile Menu Button */}
      <div className="md:hidden">
        <button
          type="button"
          onClick={toggleMobileMenu}
          className="text-gray-600 hover:text-green-600 focus:outline-none"
        >
          {mobileMenuOpen ? (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          )}
        </button>
      </div>

      {/* Desktop Navigation - Only show on non-auth pages */}
        {!isAuthPage && (
          <>
            <nav className="hidden md:flex space-x-8">
          <Link href="/features" className="text-gray-600 hover:text-green-600 transition">
            {t('navigation.features')}
          </Link>
          <Link href="/benefits" className="text-gray-600 hover:text-green-600 transition">
            {t('navigation.benefits')}
          </Link>
          <Link href="/pricing" className="text-gray-600 hover:text-green-600 transition">
            {t('navigation.pricing')}
          </Link>
          {/* Contact page is always available */}
          <Link href="/contact" className="text-gray-600 hover:text-green-600 transition">
            {t('navigation.contact')}
          </Link>
            </nav>

            {/* Right-side buttons - Change by role */}
          </>
        )}
      <div className="flex items-center space-x-4">
            <Link href="/login" className="text-green-600 hover:text-green-800 font-medium transition">
              {t('auth.login')}
            </Link>
            <Link
              href="/register"
              className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md font-medium transition"
            >
              {t('common.getStarted')}
            </Link>
            
            {/* Language and theme for non-authenticated users */}
            <UserMenu />
      </div>

      {/* Mobile Menu - Shows when menu button is clicked */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-20 left-0 right-0 bg-white border-t border-b border-gray-100 py-4 px-4 z-50">
          <nav className="flex flex-col space-y-4">
            {/* Mobile navigation with same logic as desktop */}
            {!isAuthenticated ? (
              <>
                <Link href="/features" className="text-gray-600 hover:text-green-600 py-2" onClick={() => setMobileMenuOpen(false)}>
                  {t('navigation.features')}
                </Link>
                <Link href="/benefits" className="text-gray-600 hover:text-green-600 py-2" onClick={() => setMobileMenuOpen(false)}>
                  {t('navigation.benefits')}
                </Link>
                <Link href="/pricing" className="text-gray-600 hover:text-green-600 py-2" onClick={() => setMobileMenuOpen(false)}>
                  {t('navigation.pricing')}
                </Link>
              </>
            ) : (
              <>
                <Link href="/dashboard" className="text-gray-600 hover:text-green-600 py-2" onClick={() => setMobileMenuOpen(false)}>
                  {t('navigation.dashboard')}
                </Link>
                <Link href="/plants" className="text-gray-600 hover:text-green-600 py-2" onClick={() => setMobileMenuOpen(false)}>
                  {t('navigation.plants')}
                </Link>

                {(isPremium || isAdmin) && (
                  <>
                    <Link href="/zones" className="text-gray-600 hover:text-green-600 py-2" onClick={() => setMobileMenuOpen(false)}>
                      {t('navigation.zones')}
                    </Link>
                    <Link href="/reports" className="text-gray-600 hover:text-green-600 py-2" onClick={() => setMobileMenuOpen(false)}>
                      {t('navigation.reports')}
                    </Link>
                  </>
                )}

                {isAdmin && (
                  <Link href="/admin" className="text-gray-600 hover:text-green-600 py-2" onClick={() => setMobileMenuOpen(false)}>
                    {t('navigation.admin')}
                  </Link>
                )}
              </>
            )}

            <Link href="/contact" className="text-gray-600 hover:text-green-600 py-2" onClick={() => setMobileMenuOpen(false)}>
              {t('navigation.contact')}
            </Link>

            {/* Auth buttons for mobile */}
            <div className="pt-4 border-t border-gray-100">
              {isAuthenticated ? (
                <div className="flex flex-col space-y-3">
                  {user.role === "Regular" && (
                    <Link href="/upgrade" className="text-amber-600 hover:text-amber-800 font-medium py-2" onClick={() => setMobileMenuOpen(false)}>
                      {t('common.upgrade')}
                    </Link>
                  )}
                  <Link href="/settings" className="text-gray-600 hover:text-green-600 font-medium py-2" onClick={() => setMobileMenuOpen(false)}>
                    {t('navigation.settings')}
                  </Link>
                  <button onClick={() => { setShowLogoutModal(true); setMobileMenuOpen(false); }} className="text-left text-red-600 hover:text-red-800 py-2">
                    {t('auth.logout')}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col space-y-3">
                  <Link href="/login" className="text-green-600 hover:text-green-800 font-medium py-2" onClick={() => setMobileMenuOpen(false)}>
                    {t('auth.login')}
                  </Link>
                  <Link href="/register" className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md font-medium text-center" onClick={() => setMobileMenuOpen(false)}>
                    {t('common.getStarted')}
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      <LogoutConfirmationModal 
        isOpen={showLogoutModal} 
        onClose={() => setShowLogoutModal(false)} 
      />
    </header>
  );
}
