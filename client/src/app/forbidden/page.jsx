'use client'

import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export default function ForbiddenPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex flex-col">
      {/* Header */}
      <header className="w-full border-b border-emerald-100/60 bg-white/80 backdrop-blur-md">
        <nav className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-leaf h-7 w-7 text-emerald-600 mr-2" aria-hidden="true">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"></path>
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"></path>
            </svg>
            <span className="text-xl font-bold text-gray-900">{t('common.appName', 'PlantSmart')}</span>
          </div>
          <div className="hidden sm:flex items-center space-x-6">
            <Link href="/" className="text-gray-600 hover:text-emerald-700 transition-colors">
              <span>{t('navigation.home', 'Home')}</span>
            </Link>
            <Link href="/#features" className="text-gray-600 hover:text-emerald-700 transition-colors">
              <span>{t('navigation.features', 'Features')}</span>
            </Link>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center">
        <div className="container mx-auto px-6 py-16 lg:py-24 text-center">
          <div className="mb-8 inline-flex items-center justify-center">
            <span className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </span>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">{t('forbidden.title', 'Access Denied')}</h1>
          <p className="text-xl text-gray-600 max-w-lg mx-auto mb-10">
            {t('forbidden.message', "You don't have permission to access this page. Please log in or contact your administrator if you believe this is an error.")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login" 
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors shadow-md">
              {t('auth.signIn', 'Sign In')}
            </Link>
            <Link href="/" 
              className="px-6 py-3 border-2 border-emerald-600 text-emerald-700 rounded-lg font-semibold hover:bg-emerald-50 transition-colors">
              {t('forbidden.returnHome', 'Return Home')}
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-emerald-100/60">
        <div className="container mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between">
          <p className="text-sm text-gray-500">
            <span>© {new Date().getFullYear()} {t('common.appName', 'PlantSmart')}. {t('footer.allRightsReserved', 'All rights reserved.')}</span>
          </p>
          <nav className="flex items-center space-x-6 mt-4 sm:mt-0 text-sm">
            <Link href="/" className="text-emerald-700 hover:text-emerald-800 font-medium">
              <span>{t('navigation.returnToMainSite', 'Return to main site')}</span>
            </Link>
            <Link href="/privacy" className="text-gray-500 hover:text-gray-700">
              <span>{t('navigation.privacy', 'Privacy')}</span>
            </Link>
            <Link href="/terms" className="text-gray-500 hover:text-gray-700">
              <span>{t('navigation.terms', 'Terms')}</span>
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}