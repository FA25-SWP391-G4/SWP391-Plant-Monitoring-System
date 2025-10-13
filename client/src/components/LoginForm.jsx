import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

/**
 * LoginForm component
 * Based on the PlantSmart design system
 */
export function LoginForm() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // In a real implementation, this would call the authentication API
      console.log('Login data:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Example login - replace with actual API call
      const fakeToken = 'fake-jwt-token';
      const fakeUser = { id: 1, email: formData.email, name: 'Test User', role: 'Premium' };
      
      // Call login function from auth provider
      login(fakeToken, fakeUser);
      
      // Redirect to dashboard after successful login
      router.push('/');
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  return (
    <section aria-labelledby="signin-heading" className="bg-white rounded-2xl shadow-xl border border-emerald-100/70 p-6 sm:p-8">
      <h2 id="signin-heading" className="text-xl font-semibold text-gray-900 mb-6">
        {t('auth.loginTitle', 'Sign in to your account')}
      </h2>
      
      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            {t('common.email', 'Email address')}
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mail h-5 w-5 text-gray-400" aria-hidden="true">
                <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"></path>
                <rect x="2" y="4" width="20" height="16" rx="2"></rect>
              </svg>
            </div>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              autoComplete="email"
              required
              aria-invalid="false"
              placeholder="you@greenspace.com"
              className="w-full rounded-lg border border-gray-200 pl-10 pr-3 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              {t('common.password', 'Password')}
            </label>
            <Link href="/forgot-password" className="text-sm text-emerald-700 hover:text-emerald-800 font-medium">
              {t('auth.forgotPassword', 'Forgot password?')}
            </Link>
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-lock h-5 w-5 text-gray-400" aria-hidden="true">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              autoComplete="current-password"
              required
              aria-invalid="false"
              placeholder="••••••••"
              className="w-full rounded-lg border border-gray-200 pl-10 pr-3 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <label htmlFor="remember" className="inline-flex items-center select-none cursor-pointer">
            <input
              id="rememberMe"
              name="rememberMe"
              type="checkbox"
              checked={formData.rememberMe}
              onChange={handleInputChange}
              className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
            />
            <span className="ml-2 text-sm text-gray-700">
              {t('auth.rememberMe', 'Remember me')}
            </span>
          </label>
          <Link href="/register" className="text-sm text-emerald-700 hover:text-emerald-800 font-medium">
            {t('auth.createAccount', 'Create account')}
          </Link>
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-4 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors shadow-md"
        >
          {isLoading ? t('common.loading', 'Loading...') : t('auth.login', 'Sign In')}
        </button>
        
        <div className="flex items-center my-4">
          <div className="flex-1 h-px bg-gray-200" aria-hidden="true"></div>
          <span className="px-3 text-xs uppercase tracking-wider text-gray-500">
            {t('common.or', 'or')}
          </span>
          <div className="flex-1 h-px bg-gray-200" aria-hidden="true"></div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button type="button" className="w-full inline-flex items-center justify-center gap-2 border border-gray-200 hover:border-emerald-300 text-gray-700 hover:text-emerald-800 rounded-lg py-2.5 transition-colors bg-white">
            <span className="sr-only">Continue with Google</span>
            <span className="text-gray-700">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" focusable="false">
                <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.26-1.66 3.7-5.5 3.7-3.32 0-6.02-2.75-6.02-6.05S8.18 5.7 11.5 5.7c1.9 0 3.18.8 3.9 1.48l2.65-2.56C16.6 2.6 14.3 1.7 11.5 1.7 6.4 1.7 2.2 5.92 2.2 11s4.2 9.3 9.3 9.3c5.4 0 8.95-3.8 8.95-9.15 0-.62-.07-1.1-.16-1.6H12z"></path>
                <path fill="#34A853" d="M3.1 7.4l3.2 2.3C7.1 7.3 9.1 5.7 11.5 5.7c1.9 0 3.18.8 3.9 1.48l2.65-2.56C16.6 2.6 14.3 1.7 11.5 1.7 7.9 1.7 4.86 3.7 3.1 7.4z"></path>
                <path fill="#FBBC05" d="M11.5 20.3c3.84 0 5.26-2.44 5.5-3.7H12v-3.9h8.29c.09.5.16.98.16 1.6 0 5.35-3.55 9.15-8.95 9.15-3.9 0-7.18-2.6-8.35-6.12l3.26-2.54c.78 2.3 2.95 4.5 5.88 4.5z"></path>
                <path fill="#4285F4" d="M21.29 12.7H12v-2.5h9.29c.06.3.11.66.11 1.25 0 .46-.04.88-.11 1.25z"></path>
              </svg>
            </span>
            <span className="text-sm font-medium">Google</span>
          </button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <Link href="/register" className="w-full px-4 py-3 border-2 border-emerald-600 text-emerald-700 rounded-lg font-semibold hover:bg-emerald-50 transition-colors text-center">
            {t('auth.createAccount', 'Create Account')}
          </Link>
          <Link href="/" className="w-full px-4 py-3 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors text-center">
            {t('common.backToSite', 'Back to Site')}
          </Link>
        </div>
        
        <p className="text-center text-xs text-gray-500 mt-2">
          {t('auth.termsNotice', 'By continuing, you agree to our Terms of Service and Privacy Policy.')}
        </p>
      </form>
    </section>
  );
}

export default LoginForm;