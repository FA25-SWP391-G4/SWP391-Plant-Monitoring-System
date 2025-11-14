'use client'

import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';

export default function ResetPasswordPage() {
  const { loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const { isDark, isLight, getThemeColor } = useTheme();
  const [token, setToken] = useState('');
  const [tokenChecked, setTokenChecked] = useState(false);

  // Note: We don't redirect authenticated users away from password reset
  // They should still be able to reset their password if they have a valid token

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    console.log('[RESET PASSWORD] Token from URL:', tokenParam);
    console.log('[RESET PASSWORD] Current pathname:', window.location.pathname);
    console.log('[RESET PASSWORD] Full URL:', window.location.href);
    
    if (tokenParam) {
      setToken(tokenParam);
      console.log('[RESET PASSWORD] Token set:', tokenParam);
    } else {
      console.log('[RESET PASSWORD] No token found, redirecting to forgot-password');
      // Redirect to forgot password page if no token
      router.push('/forgot-password');
      return;
    }
    setTokenChecked(true);
  }, [searchParams, router]);

  if (loading || !tokenChecked) {
    console.log('[RESET PASSWORD] Showing loading state - loading:', loading, 'tokenChecked:', tokenChecked);
    return (
      <div className="flex items-center justify-center h-screen bg-background text-foreground">
        {t('common.loading', 'Loading...')}
      </div>
    );
  }

  if (!token) {
    console.log('[RESET PASSWORD] No token - showing invalid reset link page');
    console.log('[RESET PASSWORD] Token value:', token);
    console.log('[RESET PASSWORD] Token type:', typeof token);
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-muted/20 flex items-center justify-center"
           style={{
             background: isDark 
               ? 'linear-gradient(to bottom right, hsl(var(--background)), hsl(var(--muted)/0.1), hsl(var(--muted)/0.2))'
               : 'linear-gradient(to bottom right, hsl(var(--background)), hsl(var(--muted)/0.1), hsl(var(--muted)/0.2))'
           }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            {t('auth.invalidResetLink', 'Invalid Reset Link')}
          </h1>
          <p className="text-muted-foreground mb-8">
            {t('auth.invalidResetLinkMessage', 'The password reset link is missing or invalid.')}
          </p>
          <Link 
            href="/forgot-password"
            className="px-6 py-2 rounded-lg transition-colors text-white"
            style={{ 
              backgroundColor: getThemeColor('#16a34a', '#22c55e'),
              '&:hover': { backgroundColor: getThemeColor('#15803d', '#16a34a') }
            }}
          >
            {t('auth.requestNewResetLink', 'Request New Reset Link')}
          </Link>
        </div>
      </div>
    );
  }

  console.log('[RESET PASSWORD] Rendering main reset password form with token:', token);

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
              <span>🔒 {t('auth.passwordReset', 'Password Reset')}</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground leading-tight mb-4">
              <span>{t('auth.resetPasswordHeader', 'Reset Your')}</span><br />
              <span style={{ color: getThemeColor('#16a34a', '#22c55e') }}>{t('auth.password', 'Password')}</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
              <span>{t('auth.resetPasswordMessage', "Enter your new password below. Make sure it's strong and secure to protect your plant monitoring account.")}</span>
            </p>
          </div>
          
          {/* Right Column - Reset Password Form */}
          <div style={{ opacity: 1, transform: 'none' }}>
            <ResetPasswordForm token={token} />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-leaf h-5 w-5 mr-2" aria-hidden="true"
                   style={{ color: getThemeColor('#16a34a', '#22c55e') }}>
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"></path>
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"></path>
              </svg>
              <span className="font-medium text-foreground">{t('common.appName', 'PlantSmart')}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              <span>© {new Date().getFullYear()} {t('common.appName', 'PlantSmart')}. {t('footer.allRightsReserved', 'All rights reserved.')}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}