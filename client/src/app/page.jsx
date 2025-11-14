'use client'

import { useAuth } from '@/providers/AuthProvider'
import { redirect } from 'next/navigation'
import { useEffect } from 'react'
import MainLayout from '@/components/MainLayout'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import Head from 'next/head'
import Navbar from "@/components/Navbar";

export default function Home() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  
  useEffect(() => {
    if (!loading && user) {
      redirect('/dashboard');
    }
  }, [user, loading]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">{t('common.loading', 'Loading...')}</div>;
  }

  return (
    <>
      <Head>
        <title>{t('home.pageTitle', 'Plant Monitoring System - Smart Plant Care')}</title>
        <meta name="description" content={t('home.metaDescription', 'Monitor and care for your plants with our smart plant monitoring system')} />
      </Head>
      <div className="bg-gradient-to-b from-green-50 to-white min-h-screen">
        {/* Header/Navigation */}
        <Navbar/>
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-12 md:py-20 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-8 md:mb-0 md:pr-12">
            <div className="inline-block bg-green-100 text-green-600 text-sm font-semibold py-1 px-3 rounded-full mb-4">
              🌱 {t('landing.smartPlantCare')}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              <span className="block">
                {t('landing.neverKill')}
              </span>
              <span className="text-green-500">
                {t('landing.anotherPlant')}
              </span>
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              {t('landing.transformHome', 'Transform your home into a thriving garden with AI-powered plant monitoring. Get real-time alerts, automated watering, and expert care recommendations.')}
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <Link
                href="/register"
                className="bg-green-500 hover:bg-green-600 text-white text-center py-3 px-6 rounded-md font-medium transition"
              >
                {t('landing.freeTrialDays', 'Start Free Trial')}
              </Link>
              <Link
                href="#demo"
                className="border border-gray-300 hover:border-green-500 text-gray-700 hover:text-green-500 text-center py-3 px-6 rounded-md font-medium transition"
              >
                {t('landing.watchDemo', 'Watch Demo')}
              </Link>
            </div>
            <div className="flex items-center mt-6 text-sm text-gray-500">
              <span className="flex items-center mr-6">
                ✓ {t('landing.freeTrial', '14-day free trial')}
              </span>
              <span className="flex items-center">
                ✓ {t('landing.noCardRequired', 'No credit card required')}
              </span>
            </div>
          </div>
          <div className="md:w-1/2">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="bg-green-50 rounded-lg p-6">
                <div className="flex justify-center mb-4">
                  <img src="/leaf-icon.svg" alt={t('alt.plantIcon', 'Plant Icon')} className="h-10 w-10" />
                </div>
                <h2 className="text-xl font-semibold text-center text-gray-800">{t('plants.monsteraDeliciosa', 'Monstera Deliciosa')}</h2>
                <div className="mt-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">{t('sensors.moisture', 'Moisture')}</span>
                    <span className="text-green-500 font-medium">85%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">{t('sensors.light', 'Light')}</span>
                    <span className="text-amber-500 font-medium">{t('status.perfect', 'Perfect')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">{t('sensors.health', 'Health')}</span>
                    <span className="text-green-500 font-medium">{t('status.excellent', 'Excellent')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-white py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <div className="inline-block bg-green-100 text-green-600 text-sm font-semibold py-1 px-3 rounded-full mb-4">
                ✨ {t('landing.featuredFeatures', 'Featured Features')}
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {t('landing.everythingYouNeed', 'Everything You Need for')}
                <span className="block text-green-500">{t('landing.perfectPlantCare', 'Perfect Plant Care')}</span>
              </h2>
              <p className="max-w-2xl mx-auto text-lg text-gray-600">
                {t('landing.comprehensiveSystem', 'Our comprehensive smart plant management system combines cutting-edge technology with intuitive design to make plant care effortless and enjoyable.')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-xl shadow-sm">
                <div className="bg-blue-100 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                  <svg className="h-8 w-8 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,20A6,6 0 0,1 6,14C6,10 12,3.25 12,3.25C12,3.25 18,10 18,14A6,6 0 0,1 12,20Z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">{t('feature.smartWatering.title', 'Smart Watering')}</h3>
                <p className="text-gray-600">
                  {t('feature.smartWatering.description', 'Automated watering system that delivers the perfect amount of water based on soil moisture, plant type, and environmental conditions.')}
                </p>
                <Link href="/features" className="inline-flex items-center text-blue-500 mt-4 font-medium">
                  {t('common.learnMore', 'Learn more')} →
                </Link>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-sm">
                <div className="bg-amber-100 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                  <svg className="h-8 w-8 text-amber-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9Z" />
                    <path d="M12,2L14.39,5.42C13.65,5.15 12.84,5 12,5C11.16,5 10.35,5.15 9.61,5.42L12,2M3.34,7L7.5,6.65C6.9,7.16 6.36,7.78 5.94,8.5C5.5,9.24 5.25,10 5.11,10.79L3.34,7M3.36,17L5.12,13.23C5.26,14 5.53,14.78 5.95,15.5C6.37,16.24 6.91,16.86 7.5,17.37L3.36,17M20.65,7L18.88,10.79C18.74,10 18.47,9.23 18.05,8.5C17.63,7.78 17.1,7.15 16.5,6.64L20.65,7M20.64,17L16.5,17.36C17.09,16.85 17.62,16.22 18.04,15.5C18.46,14.77 18.73,14 18.87,13.21L20.64,17M12,22L9.59,18.56C10.33,18.83 11.14,19 12,19C12.82,19 13.63,18.83 14.37,18.56L12,22Z" />
                </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">{t('feature.lightOptimization.title', 'Light Optimization')}</h3>
                <p className="text-gray-600">
                  {t('feature.lightOptimization.description', 'Advanced light sensors monitor and optimize lighting conditions, ensuring your plants receive the ideal spectrum and intensity.')}
                </p>
                <Link href="/features" className="inline-flex items-center text-amber-500 mt-4 font-medium">
                  {t('common.learnMore', 'Learn more')} →
                </Link>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-sm">
                <div className="bg-rose-100 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                  <svg className="h-8 w-8 text-rose-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M10,21H14A2,2 0 0,1 12,23A2,2 0 0,1 10,21M21,19V20H3V19L5,17V11C5,7.9 7.03,5.17 10,4.29C10,4.19 10,4.1 10,4A2,2 0 0,1 12,2A2,2 0 0,1 14,4C14,4.1 14,4.19 14,4.29C16.97,5.17 19,7.9 19,11V17L21,19M17,11A5,5 0 0,0 12,6A5,5 0 0,0 7,11V18H17V11M19.75,3.19L18.33,4.61C20.04,6.3 21,8.6 21,11H23C23,8.07 21.84,5.25 19.75,3.19M1,11H3C3,8.6 3.96,6.3 5.67,4.61L4.25,3.19C2.16,5.25 1,8.07 1,11Z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">{t('feature.healthAlerts.title', 'Health Alerts')}</h3>
                <p className="text-gray-600">
                  {t('feature.healthAlerts.description', 'Instant notifications about plant health issues, diseases, or care requirements sent directly to your smartphone.')}
                </p>
                <Link href="/features" className="inline-flex items-center text-rose-500 mt-4 font-medium">
                  {t('common.learnMore', 'Learn more')} →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <div className="inline-block bg-green-100 text-green-600 text-sm font-semibold py-1 px-3 rounded-full mb-4">
                ❤️ {t('landing.happyPlantParents', 'Happy Plant Parents')}
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {t('landing.lovedByThousands', 'Loved by Thousands of')}
                <span className="block text-green-500">{t('landing.plantEnthusiasts', 'Plant Enthusiasts')}</span>
              </h2>
              <p className="max-w-2xl mx-auto text-lg text-gray-600">
                {t('landing.testimonialSubheader', 'Don\'t just take our word for it. See what our community of plant lovers has to say about their PlantSmart experience.')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Testimonial 1 */}
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex mb-4">
                  <div className="text-green-500 text-4xl mr-2">"</div>
                </div>
                <div className="flex text-amber-400 mb-3">★★★★★</div>
                <p className="text-gray-600 mb-6">
                  {t('testimonials.testimonial1.quote', '"PlantSmart completely transformed my plant care routine. I used to kill every plant I touched, but now my apartment is a thriving jungle! The AI recommendations are incredibly accurate."')}
                </p>
                <div className="flex items-center">
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-xl">👩</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">{t('testimonials.testimonial1.name', 'Sarah Chen')}</h4>
                    <p className="text-sm text-gray-500">{t('testimonials.testimonial1.location', 'San Francisco, CA')}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center">
                  <span className="bg-green-100 text-green-600 text-xs py-1 px-2 rounded-full flex items-center">
                    <svg className="h-3 w-3 mr-1" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12,2L4.5,20.29L5.21,21L18.79,21L19.5,20.29L12,2Z" />
                    </svg>
                    {t('testimonials.plantsThriving', '{{count}} plants thriving', { count: 12 })}
                  </span>
                  <span className="ml-auto text-xs text-gray-400">{t('testimonials.verified', 'Verified Review')}</span>
                </div>
              </div>

              {/* Testimonial 2 */}
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex mb-4">
                  <div className="text-green-500 text-4xl mr-2">"</div>
                </div>
                <div className="flex text-amber-400 mb-3">★★★★★</div>
                <p className="text-gray-600 mb-6">
                  {t('testimonials.testimonial2.quote', '"As a busy entrepreneur, I never had time for proper plant care. The automated watering system is a game-changer. My plants have never looked better, and I get peace of mind."')}
                </p>
                <div className="flex items-center">
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-xl">👨</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">{t('testimonials.testimonial2.name', 'Marcus Rodriguez')}</h4>
                    <p className="text-sm text-gray-500">{t('testimonials.testimonial2.location', 'Austin, TX')}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center">
                  <span className="bg-green-100 text-green-600 text-xs py-1 px-2 rounded-full flex items-center">
                    <svg className="h-3 w-3 mr-1" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12,2L4.5,20.29L5.21,21L18.79,21L19.5,20.29L12,2Z" />
                    </svg>
                    {t('testimonials.plantsSaved', '{{count}} plants saved', { count: 8 })}
                  </span>
                  <span className="ml-auto text-xs text-gray-400">{t('testimonials.verified', 'Verified Review')}</span>
                </div>
              </div>

              {/* Testimonial 3 */}
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex mb-4">
                  <div className="text-green-500 text-4xl mr-2">"</div>
                </div>
                <div className="flex text-amber-400 mb-3">★★★★★</div>
                <p className="text-gray-600 mb-6">
                  {t('testimonials.testimonial3.quote', '"The health alerts saved my fiddle leaf fig from a pest infestation I never would have caught early. The mobile app makes monitoring so convenient and actually fun!"')}
                </p>
                <div className="flex items-center">
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-xl">👩</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">{t('testimonials.testimonial3.name', 'Emily Watson')}</h4>
                    <p className="text-sm text-gray-500">{t('testimonials.testimonial3.location', 'Portland, OR')}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center">
                  <span className="bg-green-100 text-green-600 text-xs py-1 px-2 rounded-full flex items-center">
                    <svg className="h-3 w-3 mr-1" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12,2L4.5,20.29L5.21,21L18.79,21L19.5,20.29L12,2Z" />
                    </svg>
                    {t('testimonials.plantsMonitored', '{{count}} plants monitored', { count: 15 })}
                  </span>
                  <span className="ml-auto text-xs text-gray-400">{t('testimonials.verified', 'Verified Review')}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Additional Features */}
        <section className="bg-white py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-xl shadow-sm">
                <div className="bg-green-100 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                  <svg className="h-8 w-8 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17,2H7C5.9,2 5,2.9 5,4V20C5,21.1 5.9,22 7,22H17C18.1,22 19,21.1 19,20V4C19,2.9 18.1,2 17,2M12,4C13.1,4 14,4.9 14,6C14,7.1 13.1,8 12,8C10.9,8 10,7.1 10,6C10,4.9 10.9,4 12,4M17,20H7V17H17V20M17,15H7V10H17V15Z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">{t('features.mobileDashboard.title', 'Mobile Dashboard')}</h3>
                <p className="text-gray-600">
                  {t('features.mobileDashboard.description', 'Complete plant management from your phone with real-time monitoring, care schedules, and growth tracking.')}
                </p>
                <Link href="/features" className="inline-flex items-center text-green-500 mt-4 font-medium">
                  {t('features.mobileDashboard.cta', 'Learn More')} →
                </Link>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-sm">
                <div className="bg-purple-100 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                  <svg className="h-8 w-8 text-purple-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13,3V9H21V3M13,21H21V11H13M3,21H11V15H3M3,13H11V3H3V13Z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">{t('features.aiDoctor.title', 'AI Plant Doctor')}</h3>
                <p className="text-gray-600">
                  {t('features.aiDoctor.description', 'Machine learning algorithms analyze your plant data to provide personalized care recommendations and predict potential issues.')}
                </p>
                <Link href="/features" className="inline-flex items-center text-purple-500 mt-4 font-medium">
                  {t('features.aiDoctor.cta', 'Learn More')} →
                </Link>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-sm">
                <div className="bg-gray-100 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                  <svg className="h-8 w-8 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,21L15.6,16.2C14.6,15.45 13.35,15 12,15C10.65,15 9.4,15.45 8.4,16.2L12,21M12,3C7.95,3 4.21,4.34 1.2,6.6L3,9C5.5,7.12 8.62,6 12,6C15.38,6 18.5,7.12 21,9L22.8,6.6C19.79,4.34 16.05,3 12,3M12,9C9.3,9 6.81,9.89 4.8,11.4L6.6,13.8C8.1,12.67 9.97,12 12,12C14.03,12 15.9,12.67 17.4,13.8L19.2,11.4C17.19,9.89 14.7,9 12,9Z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">{t('features.iotSensors.title', 'IoT Sensors')}</h3>
                <p className="text-gray-600">
                  {t('features.iotSensors.description', 'Network of wireless sensors monitoring temperature, humidity, soil pH, and nutrients for comprehensive plant care.')}
                </p>
                <Link href="/features" className="inline-flex items-center text-gray-500 mt-4 font-medium">
                  {t('features.iotSensors.cta', 'Learn More')} →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Test AI Features Section */}
        <section className="py-16 bg-blue-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">🤖 Test AI Features</h2>
              <p className="text-gray-600 mb-6">Try our AI-powered plant care features</p>
              <div className="bg-white p-6 rounded-xl shadow-sm max-w-md mx-auto">
                <h3 className="font-semibold mb-4">Quick Login for Testing</h3>
                <div className="text-sm text-gray-600 mb-4">
                  <p><strong>Email:</strong> test@example.com</p>
                  <p><strong>Password:</strong> password123</p>
                </div>
                <div className="space-y-2">
                  <Link
                    href="/login"
                    className="block bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded text-center transition"
                  >
                    Login to Test
                  </Link>
                  <Link
                    href="/test-auth"
                    className="block bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded text-center transition"
                  >
                    Check Auth Status
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="text-4xl mb-4">💬</div>
                <h3 className="text-xl font-semibold mb-2">AI Chatbot</h3>
                <p className="text-gray-600 mb-4">Chat with AI about plant care</p>
                <Link
                  href="/ai/chat"
                  className="inline-block bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded transition"
                >
                  Try Chat
                </Link>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="text-4xl mb-4">📸</div>
                <h3 className="text-xl font-semibold mb-2">Disease Detection</h3>
                <p className="text-gray-600 mb-4">Upload plant photos for analysis</p>
                <Link
                  href="/ai/image-analysis"
                  className="inline-block bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded transition"
                >
                  Analyze Image
                </Link>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="text-4xl mb-4">🔮</div>
                <h3 className="text-xl font-semibold mb-2">Watering Prediction</h3>
                <p className="text-gray-600 mb-4">AI-powered watering recommendations</p>
                <Link
                  href="/ai/predictions"
                  className="inline-block bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition"
                >
                  Get Predictions
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-green-50">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">{t('landing.ctaTitle', 'Ready to Transform Your Plant Care?')}</h2>
              <p className="max-w-2xl mx-auto text-lg text-gray-600 mb-8">
                {t('landing.ctaSubtitle', 'Join thousands of plant parents who never worry about their green friends again.')}
              </p>
              <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                <Link
                  href="/register"
                  className="bg-green-500 hover:bg-green-600 text-white py-3 px-8 rounded-md font-medium text-lg transition"
                >
                  {t('landing.startFreeTrial', 'Start Free Trial')}
                </Link>
                <Link
                  href="/demo"
                  className="border border-gray-300 hover:border-green-500 text-gray-700 hover:text-green-500 py-3 px-8 rounded-md font-medium text-lg transition"
                >
                  {t('landing.scheduleDemo', 'Schedule Demo')}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              <div>
                <div className="flex items-center mb-4">
                  <svg
                    className="h-6 w-6 text-green-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M7,17.2C5.4,16.5,4,14.9,4,12c0-3.9,3.1-7,7-7c3.9,0,7,3.1,7,7c0,2.9-2.1,5.3-4.8,6.4" />
                    <path d="M12,22c-1.6,0-3-1.3-3-3c0-1.1,0.6-2,1.5-2.5c-0.3-0.5-0.5-1-0.5-1.6c0-1.8,1.5-3.3,3.3-3.3c1.8,0,3.3,1.5,3.3,3.3" />
                  </svg>
                  <span className="ml-2 text-lg font-semibold">{t('common.appName', 'PlantSmart')}</span>
                </div>
                <p className="text-gray-400 text-sm">
                  {t('footer.tagline', 'The future of intelligent plant care. Never let your plants suffer again.')}
                </p>
                <div className="flex space-x-4 mt-4">
                  <a href="#" className="text-gray-400 hover:text-white">
                    <span className="sr-only">{t('accessibility.email', 'Email')}</span>
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20,4H4C2.9,4 2,4.9 2,6V18C2,19.1 2.9,20 4,20H20C21.1,20 22,19.1 22,18V6C22,4.9 21.1,4 20,4M20,18H4V8L12,13L20,8V18M20,6L12,11L4,6V6H20V6Z" />
                    </svg>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-white">
                    <span className="sr-only">{t('accessibility.phone', 'Phone')}</span>
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6.62,10.79C8.06,13.62 10.38,15.94 13.21,17.38L15.41,15.18C15.69,14.9 16.08,14.82 16.43,14.93C17.55,15.3 18.75,15.5 20,15.5A1,1 0 0,1 21,16.5V20A1,1 0 0,1 20,21A17,17 0 0,1 3,4A1,1 0 0,1 4,3H7.5A1,1 0 0,1 8.5,4C8.5,5.25 8.7,6.45 9.07,7.57C9.18,7.92 9.1,8.31 8.82,8.59L6.62,10.79Z" />
                    </svg>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-white">
                    <span className="sr-only">{t('accessibility.location', 'Location')}</span>
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9A7,7 0 0,0 12,2Z" />
                    </svg>
                  </a>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-4">{t('footer.product')}</h3>
                <ul className="space-y-2">
                  <li><Link href="/features" className="text-gray-400 hover:text-green-500 transition">{t('navigation.features')}</Link></li>
                  <li><Link href="/pricing" className="text-gray-400 hover:text-green-500 transition">{t('navigation.pricing')}</Link></li>
                  <li><Link href="/security" className="text-gray-400 hover:text-green-500 transition">{t('footer.security')}</Link></li>
                  <li><Link href="/integrations" className="text-gray-400 hover:text-green-500 transition">{t('footer.integrations')}</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-4">{t('footer.company')}</h3>
                <ul className="space-y-2">
                  <li><Link href="/about" className="text-gray-400 hover:text-green-500 transition">{t('footer.about')}</Link></li>
                  <li><Link href="/blog" className="text-gray-400 hover:text-green-500 transition">{t('footer.blog')}</Link></li>
                  <li><Link href="/careers" className="text-gray-400 hover:text-green-500 transition">{t('footer.careers')}</Link></li>
                  <li><Link href="/contact" className="text-gray-400 hover:text-green-500 transition">{t('navigation.contact')}</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-4">{t('footer.support')}</h3>
                <ul className="space-y-2">
                  <li><Link href="/help-center" className="text-gray-400 hover:text-green-500 transition">{t('footer.helpCenter')}</Link></li>
                  <li><Link href="/documentation" className="text-gray-400 hover:text-green-500 transition">{t('footer.documentation')}</Link></li>
                  <li><Link href="/community" className="text-gray-400 hover:text-green-500 transition">{t('footer.community')}</Link></li>
                  <li><Link href="/status" className="text-gray-400 hover:text-green-500 transition">{t('footer.status')}</Link></li>
                </ul>
              </div>
            </div>
            <div className="pt-8 border-t border-gray-800 text-sm text-gray-400 flex flex-col md:flex-row justify-between items-center">
              <p>© {new Date().getFullYear()} {t('common.appName')}. {t('landing.allRightsReserved')}</p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <Link href="/privacy" className="hover:text-green-500 transition">{t('footer.privacyPolicy')}</Link>
                <Link href="/terms" className="hover:text-green-500 transition">{t('footer.termsOfService')}</Link>
                <Link href="/cookies" className="hover:text-green-500 transition">{t('footer.cookies')}</Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
