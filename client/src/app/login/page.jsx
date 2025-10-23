<<<<<<< HEAD
'use client'

import { LoginForm } from '@/components/LoginForm';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
=======
"use client";

import LoginForm from '@/components/LoginForm';
import { useAuth } from "@/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
>>>>>>> aa9e4b2 (chore: remove mock data and mockApi for production integration)

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

<<<<<<< HEAD
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">{t('common.loading', 'Loading...')}</div>;
=======
  // ✅ Safe redirect inside useEffect
  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  // ✅ Loading screen
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-600 text-lg">
        {t("common.loading", "Loading...")}
      </div>
    );
>>>>>>> aa9e4b2 (chore: remove mock data and mockApi for production integration)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex flex-col">
      {/* Header */}
      <header className="w-full border-b border-emerald-100/60 bg-white/80 backdrop-blur-md">
        <nav className="container mx-auto px-6 py-4 flex items-center justify-between">
<<<<<<< HEAD
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
=======
          {/* ✅ App Logo */}
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-leaf h-7 w-7 text-emerald-600 mr-2"
              aria-hidden="true"
            >
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
            </svg>
            <span className="text-xl font-bold text-gray-900">
              {t("common.appName", "PlantSmart")}
            </span>
          </div>

          {/* ✅ Navigation links */}
          <div className="hidden sm:flex items-center space-x-6">
            <Link
              href="/"
              className="text-gray-600 hover:text-emerald-700 transition-colors"
            >
              {t("navigation.home", "Home")}
            </Link>
            <Link
              href="/#features"
              className="text-gray-600 hover:text-emerald-700 transition-colors"
            >
              {t("navigation.features", "Features")}
>>>>>>> aa9e4b2 (chore: remove mock data and mockApi for production integration)
            </Link>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <section className="container mx-auto px-6 py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
<<<<<<< HEAD
          {/* Left Column - Welcome Text */}
          <div style={{ opacity: 1, transform: 'none' }}>
            <div className="inline-flex items-center px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium mb-4">
              <span>🌱 {t('auth.welcomeBack', 'Welcome Back')}</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-4">
              <span>{t('auth.welcomeBackTo', 'Welcome Back to')}</span><br />
              <span className="text-emerald-600">{t('common.appName', 'PlantSmart')}</span>
            </h1>
            <p className="text-lg text-gray-600 max-w-xl leading-relaxed">
              <span>{t('auth.loginMessage', 'Sign in to continue nurturing your green sanctuary with intelligent care, real-time insights, and friendly reminders.')}</span>
            </p>
            
            {/* Feature List - Hidden on Mobile */}
=======
          {/* ✅ Left Column - Welcome Text */}
          <div>
            <div className="inline-flex items-center px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium mb-4">
              🌱 {t("auth.welcomeBack", "Welcome Back")}
            </div>

            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-4">
              {t("auth.welcomeBackTo", "Welcome Back to")}
              <br />
              <span className="text-emerald-600">
                {t("common.appName", "PlantSmart")}
              </span>
            </h1>

            <p className="text-lg text-gray-600 max-w-xl leading-relaxed">
              {t(
                "auth.loginMessage",
                "Sign in to continue nurturing your green sanctuary with intelligent care, real-time insights, and friendly reminders."
              )}
            </p>

            {/* ✅ Feature list (hidden on mobile) */}
>>>>>>> aa9e4b2 (chore: remove mock data and mockApi for production integration)
            <div className="hidden lg:block mt-10">
              <div className="bg-white/70 backdrop-blur rounded-2xl p-6 shadow-lg border border-emerald-100">
                <ul className="space-y-4">
                  <li className="flex items-center text-gray-700">
<<<<<<< HEAD
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-check h-5 w-5 text-emerald-600 mr-3" aria-hidden="true">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="m9 12 2 2 4-4"></path>
                    </svg>
                    <span>{t('features.smartWatering.description', 'Smart watering schedules tailored to each plant')}</span>
                  </li>
                  <li className="flex items-center text-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-check h-5 w-5 text-emerald-600 mr-3" aria-hidden="true">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="m9 12 2 2 4-4"></path>
                    </svg>
                    <span>{t('features.healthAlerts.description', 'Health alerts and expert recommendations')}</span>
                  </li>
                  <li className="flex items-center text-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-check h-5 w-5 text-emerald-600 mr-3" aria-hidden="true">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="m9 12 2 2 4-4"></path>
                    </svg>
                    <span>{t('features.dashboard', 'Beautiful dashboard across all your devices')}</span>
=======
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-circle-check h-5 w-5 text-emerald-600 mr-3"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                    <span>
                      {t(
                        "features.smartWatering.description",
                        "Smart watering schedules tailored to each plant"
                      )}
                    </span>
                  </li>

                  <li className="flex items-center text-gray-700">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-circle-check h-5 w-5 text-emerald-600 mr-3"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                    <span>
                      {t(
                        "features.healthAlerts.description",
                        "Health alerts and expert recommendations"
                      )}
                    </span>
                  </li>

                  <li className="flex items-center text-gray-700">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-circle-check h-5 w-5 text-emerald-600 mr-3"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                    <span>
                      {t(
                        "features.dashboard",
                        "Beautiful dashboard across all your devices"
                      )}
                    </span>
>>>>>>> aa9e4b2 (chore: remove mock data and mockApi for production integration)
                  </li>
                </ul>
              </div>
            </div>
          </div>
<<<<<<< HEAD
          
          {/* Right Column - Login Form */}
          <div style={{ opacity: 1, transform: 'none' }}>
=======

          {/* ✅ Right Column - Login Form */}
          <div>
>>>>>>> aa9e4b2 (chore: remove mock data and mockApi for production integration)
            <LoginForm />
          </div>
        </section>
      </main>

<<<<<<< HEAD
      {/* Footer */}
      <footer className="bg-white border-t border-emerald-100/60">
        <div className="container mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between">
          <p className="text-sm text-gray-500">
            <span>© {new Date().getFullYear()} {t('common.appName', 'PlantSmart')}. {t('footer.allRightsReserved', 'All rights reserved.')}</span>
          </p>
          <nav className="flex items-center space-x-6 mt-4 sm:mt-0 text-sm">
            <Link href="/" className="text-emerald-700 hover:text-emerald-800 font-medium">
              <span>{t('navigation.returnToMain', 'Return to main site')}</span>
            </Link>
            <Link href="/privacy" className="text-gray-500 hover:text-gray-700">
              <span>{t('navigation.privacy', 'Privacy')}</span>
            </Link>
            <Link href="/terms" className="text-gray-500 hover:text-gray-700">
              <span>{t('navigation.terms', 'Terms')}</span>
=======
      {/* ✅ Footer */}
      <footer className="bg-white border-t border-emerald-100/60">
        <div className="container mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()}{" "}
            {t("common.appName", "PlantSmart")}.{" "}
            {t("footer.allRightsReserved", "All rights reserved.")}
          </p>

          <nav className="flex items-center space-x-6 mt-4 sm:mt-0 text-sm">
            <Link
              href="/"
              className="text-emerald-700 hover:text-emerald-800 font-medium"
            >
              {t("navigation.returnToMain", "Return to main site")}
            </Link>
            <Link
              href="/privacy"
              className="text-gray-500 hover:text-gray-700"
            >
              {t("navigation.privacy", "Privacy")}
            </Link>
            <Link href="/terms" className="text-gray-500 hover:text-gray-700">
              {t("navigation.terms", "Terms")}
>>>>>>> aa9e4b2 (chore: remove mock data and mockApi for production integration)
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> aa9e4b2 (chore: remove mock data and mockApi for production integration)
