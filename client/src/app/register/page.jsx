'use client'

import { RegisterForm } from '@/components/auth/RegisterForm';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';

export default function RegisterPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
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
            <div className="w-7 h-7 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center mr-2">
              <Image src="/app-icon.png" alt="PlantSmart Logo" width={20} height={20} />
            </div>
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
              <span>🌱 {t('auth.joinUs', 'Join Us')}</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-4">
              <span>{t('auth.createAccount', 'Create an Account')}</span><br />
              <span className="text-emerald-600">{t('auth.startGrowing', 'Start Growing')}</span>
            </h1>
            <p className="text-lg text-gray-600 max-w-xl leading-relaxed">
              {t('auth.registerMessage', 'Join our community of plant enthusiasts and start monitoring your plants with intelligent care and real-time insights.')}
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
                    {t('features.smartWatering', 'Smart watering schedules tailored to each plant')}
                  </li>
                  <li className="flex items-center text-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-check h-5 w-5 text-emerald-600 mr-3" aria-hidden="true">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="m9 12 2 2 4-4"></path>
                    </svg>
                    {t('features.healthAlerts', 'Health alerts and expert recommendations')}
                  </li>
                  <li className="flex items-center text-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-check h-5 w-5 text-emerald-600 mr-3" aria-hidden="true">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="m9 12 2 2 4-4"></path>
                    </svg>
                    {t('features.dashboard', 'Beautiful dashboard across all your devices')}
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* Right Column - Registration Form */}
          <div style={{ opacity: 1, transform: 'none' }}>
            <RegisterForm />
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                {t('auth.alreadyHaveAccount', 'Already have an account?')}{' '}
                <Link href="/login" className="font-medium text-emerald-600 hover:text-emerald-500">
                  {t('auth.signIn', 'Sign in')}
                </Link>
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}