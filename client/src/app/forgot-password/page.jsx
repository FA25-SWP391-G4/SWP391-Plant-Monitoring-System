'use client'

import { ForgotPasswordForm } from '@/components/ForgotPasswordForm';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export default function ForgotPasswordPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">{t('common.loading', 'Loading...')}</div>;
  }

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
              <span>{t('navigation.home')}</span>
            </Link>
            <Link href="/#features" className="text-gray-600 hover:text-emerald-700 transition-colors">
              <span>{t('navigation.features')}</span>
            </Link>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <section className="container mx-auto px-6 py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Welcome Text */}
          <div style={{ opacity: 1, transform: 'none' }}>
            <div className="inline-flex items-center px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium mb-4">
              <span>🔑 {t('auth.passwordRecovery', 'Password Recovery')}</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-4">
              <span>{t('auth.forgotPasswordHeader', 'Forgot Your Password?')}</span><br />
              <span className="text-emerald-600">{t('auth.noWorries', 'No Worries')}</span>
            </h1>
            <p className="text-lg text-gray-600 max-w-xl leading-relaxed">
              <span>{t('auth.forgotPasswordMessage', "We'll help you reset your password and get back to caring for your plants in no time.")}</span>
            </p>
            
            {/* Feature List - Hidden on Mobile */}
            <div className="hidden lg:block mt-10">
              <div className="bg-white/70 backdrop-blur rounded-2xl p-6 shadow-lg border border-emerald-100">
                <ul className="space-y-4">
                  <li className="flex items-center text-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-check h-5 w-5 text-emerald-600 mr-3" aria-hidden="true">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="m9 12 2 2 4-4"></path>
                    </svg>
                    <span>{t('auth.simplifiedRecovery', 'Simple and secure password recovery')}</span>
                  </li>
                  <li className="flex items-center text-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-check h-5 w-5 text-emerald-600 mr-3" aria-hidden="true">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="m9 12 2 2 4-4"></path>
                    </svg>
                    <span>{t('auth.quickReset', 'Quick reset process via email')}</span>
                  </li>
                  <li className="flex items-center text-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-check h-5 w-5 text-emerald-600 mr-3" aria-hidden="true">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="m9 12 2 2 4-4"></path>
                    </svg>
                    <span>{t('auth.accountSecurity', 'Enhanced account security')}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* Right Column - Forgot Password Form */}
          <div style={{ opacity: 1, transform: 'none' }}>
            <ForgotPasswordForm />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-emerald-100/60">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-leaf h-5 w-5 text-emerald-600 mr-2" aria-hidden="true">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"></path>
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"></path>
              </svg>
              <span className="font-medium text-gray-900">{t('common.appName', 'PlantSmart')}</span>
            </div>
            <div className="text-sm text-gray-500">
              <span>© {new Date().getFullYear()} {t('common.appName', 'PlantSmart')}. {t('footer.allRightsReserved', 'All rights reserved.')}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}