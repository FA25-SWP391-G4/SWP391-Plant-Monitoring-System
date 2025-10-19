import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { LanguageSwitcher } from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const isPremium = user?.role === "Premium" || user?.role === "Admin";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold text-emerald-600">🌱 SmartFarm</span>
            </Link>
            
            {/* Main Navigation - Desktop */}
            <div className="hidden md:ml-8 md:flex md:space-x-8">
              <Link href="/dashboard" className="text-gray-900 hover:text-emerald-600 px-3 py-2 text-sm font-medium transition-colors">
                {t('nav.dashboard', 'Dashboard')}
              </Link>
              <Link href="/plants" className="text-gray-900 hover:text-emerald-600 px-3 py-2 text-sm font-medium transition-colors">
                {t('nav.plants', 'Plants')}
              </Link>
              
              {/* AI Features Dropdown */}
              <div className="relative group">
                <button className="text-gray-900 hover:text-emerald-600 px-3 py-2 text-sm font-medium transition-colors flex items-center">
                  <span className="mr-1">🤖</span>
                  {t('nav.ai', 'AI Features')}
                  <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-1">
                    <Link href="/ai/chat" className="block px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600">
                      <span className="mr-2">💬</span>
                      {t('nav.aiChat', 'AI Chatbot')}
                    </Link>
                    <Link href="/ai/predictions" className="block px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600">
                      <span className="mr-2">🔮</span>
                      {t('nav.predictions', 'Watering Predictions')}
                    </Link>
                    <Link href="/ai/image-analysis" className="block px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600">
                      <span className="mr-2">📸</span>
                      {t('nav.imageAnalysis', 'Disease Detection')}
                    </Link>
                    <Link href="/ai/history" className="block px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600">
                      <span className="mr-2">📊</span>
                      {t('nav.aiHistory', 'AI History')}
                    </Link>
                  </div>
                </div>
              </div>
              
              {isPremium && (
                <>
                  <Link href="/zones" className="text-gray-900 hover:text-emerald-600 px-3 py-2 text-sm font-medium transition-colors">
                    {t('nav.zones', 'Zones')}
                  </Link>
                  <Link href="/reports" className="text-gray-900 hover:text-emerald-600 px-3 py-2 text-sm font-medium transition-colors">
                    {t('nav.reports', 'Reports')}
                  </Link>
                  <Link href="/thresholds" className="text-gray-900 hover:text-emerald-600 px-3 py-2 text-sm font-medium transition-colors">
                    {t('nav.thresholds', 'Thresholds')}
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-500 hover:text-gray-700 p-2"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            
            {user ? (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-700">
                  {user.name} 
                  <span className={`ml-1 px-2 py-1 text-xs rounded-full ${
                    user.role === 'Premium' || user.role === 'Admin' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role}
                  </span>
                </span>
                {user.role === "Regular" && (
                  <Link href="/upgrade" className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors">
                    {t('nav.upgrade', 'Upgrade')}
                  </Link>
                )}
                <button 
                  onClick={logout}
                  className="text-gray-500 hover:text-gray-700 px-3 py-1 text-sm font-medium transition-colors"
                >
                  {t('nav.logout', 'Logout')}
                </button>
              </div>
            ) : (
              <Link href="/login" className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                {t('nav.login', 'Login')}
              </Link>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-200">
              <Link 
                href="/dashboard" 
                className="block px-3 py-2 text-base font-medium text-gray-900 hover:text-emerald-600 hover:bg-gray-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('nav.dashboard', 'Dashboard')}
              </Link>
              <Link 
                href="/plants" 
                className="block px-3 py-2 text-base font-medium text-gray-900 hover:text-emerald-600 hover:bg-gray-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('nav.plants', 'Plants')}
              </Link>
              
              {/* AI Features - Mobile */}
              <div className="px-3 py-2">
                <div className="text-sm font-medium text-gray-500 mb-2">
                  🤖 {t('nav.ai', 'AI Features')}
                </div>
                <div className="ml-4 space-y-1">
                  <Link 
                    href="/ai/chat" 
                    className="block px-3 py-2 text-sm text-gray-700 hover:text-emerald-600 hover:bg-gray-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    💬 {t('nav.aiChat', 'AI Chatbot')}
                  </Link>
                  <Link 
                    href="/ai/predictions" 
                    className="block px-3 py-2 text-sm text-gray-700 hover:text-emerald-600 hover:bg-gray-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    🔮 {t('nav.predictions', 'Watering Predictions')}
                  </Link>
                  <Link 
                    href="/ai/image-analysis" 
                    className="block px-3 py-2 text-sm text-gray-700 hover:text-emerald-600 hover:bg-gray-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    📸 {t('nav.imageAnalysis', 'Disease Detection')}
                  </Link>
                  <Link 
                    href="/ai/history" 
                    className="block px-3 py-2 text-sm text-gray-700 hover:text-emerald-600 hover:bg-gray-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    📊 {t('nav.aiHistory', 'AI History')}
                  </Link>
                </div>
              </div>

              {isPremium && (
                <>
                  <Link 
                    href="/zones" 
                    className="block px-3 py-2 text-base font-medium text-gray-900 hover:text-emerald-600 hover:bg-gray-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('nav.zones', 'Zones')}
                  </Link>
                  <Link 
                    href="/reports" 
                    className="block px-3 py-2 text-base font-medium text-gray-900 hover:text-emerald-600 hover:bg-gray-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('nav.reports', 'Reports')}
                  </Link>
                  <Link 
                    href="/thresholds" 
                    className="block px-3 py-2 text-base font-medium text-gray-900 hover:text-emerald-600 hover:bg-gray-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('nav.thresholds', 'Thresholds')}
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
