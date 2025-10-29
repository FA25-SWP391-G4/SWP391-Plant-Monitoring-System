import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function DashboardHeader({ user }) {
  const { t } = useTranslation();
  const { isDark, themeColors } = useTheme();
  
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and title */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="h-10 w-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sprout">
                  <path d="M7 20h10"></path>
                  <path d="M10 20c5.5-2.5.8-6.4 3-10"></path>
                  <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"></path>
                  <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"></path>
                </svg>
              </div>
              <span className="font-semibold text-lg hidden sm:inline">PlantSmart</span>
            </Link>
            
            {/* Navigation links - hidden on mobile */}
            <nav className="hidden md:flex ml-8 space-x-6">
              <Link href="/dashboard" className="text-gray-900 font-medium hover:text-emerald-600 py-2">
                {t('nav.dashboard', 'Dashboard')}
              </Link>
              <Link href="/plants" className="text-gray-500 hover:text-emerald-600 py-2">
                {t('nav.plants', 'My Plants')}
              </Link>
              <Link href="/devices" className="text-gray-500 hover:text-emerald-600 py-2">
                {t('nav.devices', 'Devices')}
              </Link>
              <Link href="/reports" className="text-gray-500 hover:text-emerald-600 py-2">
                {t('nav.reports', 'Reports')}
              </Link>
            </nav>
          </div>
          
          {/* User menu and actions */}
          <div className="flex items-center space-x-4">
            {/* Upgrade Button */}
            {!user?.isPremium && (
              <Link href="/upgrade" className="hidden sm:flex items-center text-sm font-medium bg-gradient-to-r from-amber-500 to-amber-600 text-white px-3 py-1.5 rounded-full hover:from-amber-600 hover:to-amber-700 transition">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
                {t('common.upgrade', 'Upgrade')}
              </Link>
            )}
            
            {/* Notifications */}
            <div className="relative">
              <button className="text-gray-500 hover:text-emerald-600 relative p-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bell">
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
                </svg>
                <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">3</span>
              </button>
              
              {/* Notification dropdown would go here */}
            </div>
            
            {/* User menu */}
            <div className="relative">
              <div className="flex items-center cursor-pointer">
                <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mr-2">
                  {user?.firstName?.charAt(0) || 'U'}
                </div>
                <span className="hidden sm:block font-medium">{user?.firstName || 'User'}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1 text-gray-500">
                  <path d="m6 9 6 6 6-6"></path>
                </svg>
              </div>
              
              {/* User dropdown would go here */}
            </div>
            
            {/* Language Switcher */}
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>
            
            {/* Mobile menu button */}
            <button className="md:hidden text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-menu">
                <line x1="4" x2="20" y1="12" y2="12"></line>
                <line x1="4" x2="20" y1="6" y2="6"></line>
                <line x1="4" x2="20" y1="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}