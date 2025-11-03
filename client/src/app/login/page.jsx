'use client'

import { LoginForm } from '@/components/auth/LoginForm';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const { isDark, isLight, getThemeColor } = useTheme();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-foreground">
        {t('common.loading', 'Loading...')}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-muted/20 flex flex-col"
         style={{
           background: isDark 
             ? 'linear-gradient(to bottom right, hsl(var(--background)), hsl(var(--muted)/0.1), hsl(var(--muted)/0.2))'
             : 'linear-gradient(to bottom right, hsl(var(--background)), hsl(var(--muted)/0.1), hsl(var(--muted)/0.2))'
         }}>

      {/* Main Content */}
      <main className="flex-1">
        <section className="container mx-auto px-6 py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Welcome Text */}
          <div style={{ opacity: 1, transform: 'none' }}>
            <div className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium mb-4"
                 style={{ 
                   backgroundColor: getThemeColor('#dcfce7', '#14532d'),
                   color: getThemeColor('#15803d', '#22c55e')
                 }}>
              <span>🌱 {t('auth.welcomeBack', 'Welcome Back')}</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground leading-tight mb-4">
              <span>{t('auth.welcomeBackTo', 'Welcome Back to')}</span><br />
              <span style={{ color: getThemeColor('#16a34a', '#22c55e') }}>{t('common.appName', 'PlantSmart')}</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
              <span>{t('auth.loginMessage', 'Sign in to continue nurturing your green sanctuary with intelligent care, real-time insights, and friendly reminders.')}</span>
            </p>
            
            {/* Feature List - Hidden on Mobile */}
            <div className="hidden lg:block mt-10">
              <div className="bg-card/70 backdrop-blur rounded-2xl p-6 shadow-lg border border-border">
                <ul className="space-y-4">
                  <li className="flex items-center text-foreground">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-check h-5 w-5 mr-3" aria-hidden="true"
                         style={{ color: getThemeColor('#16a34a', '#22c55e') }}>
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="m9 12 2 2 4-4"></path>
                    </svg>
                    <span>{t('features.smartWatering.description', 'Smart watering schedules tailored to each plant')}</span>
                  </li>
                  <li className="flex items-center text-foreground">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-check h-5 w-5 mr-3" aria-hidden="true"
                         style={{ color: getThemeColor('#16a34a', '#22c55e') }}>
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="m9 12 2 2 4-4"></path>
                    </svg>
                    <span>{t('features.healthAlerts.description', 'Health alerts and expert recommendations')}</span>
                  </li>
                  <li className="flex items-center text-foreground">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-check h-5 w-5 mr-3" aria-hidden="true"
                         style={{ color: getThemeColor('#16a34a', '#22c55e') }}>
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="m9 12 2 2 4-4"></path>
                    </svg>
                    <span>{t('features.dashboard', 'Beautiful dashboard across all your devices')}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* Right Column - Login Form */}
          <div style={{ opacity: 1, transform: 'none' }}>
            <LoginForm />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border">
        <div className="container mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between">
          <p className="text-sm text-muted-foreground">
            <span>© {new Date().getFullYear()} {t('common.appName', 'PlantSmart')}. {t('footer.allRightsReserved', 'All rights reserved.')}</span>
          </p>
          <nav className="flex items-center space-x-6 mt-4 sm:mt-0 text-sm">
            <Link href="/" className="font-medium transition-colors hover:opacity-80"
                  style={{ color: getThemeColor('#15803d', '#22c55e') }}>
              <span>{t('navigation.returnToMain', 'Return to main site')}</span>
            </Link>
            <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
              <span>{t('navigation.privacy', 'Privacy')}</span>
            </Link>
            <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
              <span>{t('navigation.terms', 'Terms')}</span>
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}