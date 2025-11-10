'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import paymentApi from '@/api/paymentApi';

export default function PremiumPage() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  
  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      console.log('User not authenticated, redirecting to login');
      router.push('/login?redirect=premium');
      return;
    }
    
    if (user) {
      console.log(`User authenticated: ID=${user.user_id}, Name=${user.full_name || 'Not available'}, Email=${user.email || 'Not available'}`);
    }
  }, [user, loading, router]);
  
  // Clean up any stored order IDs when component mounts
  useEffect(() => {
    // We'll keep a function to clean up any pending order IDs
    const cleanupPendingPayments = () => {
      // Remove any pending order ID from localStorage since we now have a dedicated result page
      if (localStorage.getItem('pendingOrderId')) {
        localStorage.removeItem('pendingOrderId');
      }
    };
    
    cleanupPendingPayments();
  }, []);
  
  // Handle upgrade button click - go directly to payment
  const handleUpgradeClick = async (planType) => {
    if (!user) {
      router.push('/login?redirect=premium');
      return;
    }
    
    // Go directly to payment without showing dialog
    setSelectedPlan(planType);
    await handlePayment(planType);
  };
  
  // Process payment - simplified without payment method selection
  const handlePayment = async (paymentType) => {
    setIsProcessing(true);
    setPaymentError(null);
    
    try {
      // Verify user is authenticated
      if (!user || !user.user_id) {
        console.error('Payment attempted without authentication');
        setPaymentError(t('payment.authError', 'You must be logged in to make a payment. Please log in and try again.'));
        router.push('/login?redirect=premium');
        return;
      }
      
      console.log(`Processing payment for user ID: ${user.user_id}, Name: ${user.full_name || 'Not set'}`);
      
      // Determine amount based on selected plan and payment type
      let amount = 0;
      let description = '';
      
      if (paymentType === 'monthly') {
        amount = 15000; // 15,000 VND per month
        description = 'Monthly Premium Subscription - Plant Monitoring System';
      } else if (paymentType === 'annual') {
        amount = 150000; // 150,000 VND per year (17% off)
        description = 'Annual Premium Subscription - Plant Monitoring System (17% off)';
      } else if (paymentType === 'lifetime') {
        amount = 299000; // 299,000 VND one-time payment
        description = 'Lifetime Premium Subscription - Plant Monitoring System';
      } else if (paymentType === 'ultimate-monthly') {
        amount = 45000; // 45,000 VND per month
        description = 'Monthly Ultimate Subscription - Plant Monitoring System';
      } else if (paymentType === 'ultimate-annual') {
        amount = 399000; // 399,000 VND per year (26% off)
        description = 'Annual Ultimate Subscription - Plant Monitoring System (26% off)';
      }
      
      // Create payment data without bankCode to allow all payment methods
      const paymentData = {
        amount,
        orderInfo: description,
        planType: paymentType
        // Don't include bankCode - let VNPay show all payment methods
      };
      
      // Create payment URL through backend
      console.log(`Sending payment request: amount=${amount}, user_id=${user.user_id}`);
      const response = await paymentApi.createPaymentUrl(paymentData);
      
      // For server-side redirection, the browser will be redirected by the server
      // This client-side code should not execute if server-side redirect works
      // But we keep it as fallback
      if (response.data && response.data.paymentUrl) {
        // Store order ID for verification on return
        if (response.data.orderId) {
          localStorage.setItem('pendingOrderId', response.data.orderId);
        }
        
        // Redirect to VNPay payment page (fallback)
        console.log("Server-side redirect didn't happen, using client-side fallback");
        window.location.href = response.data.paymentUrl;
      } else {
        setPaymentError(t('payment.createPaymentError', 'Failed to create payment. Please try again.'));
      }
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentError(t('payment.genericError', 'An error occurred. Please try again later.'));
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="text-sm breadcrumbs">
          <ul>
            <li>
              <a href="/dashboard">
                {t('navigation.dashboard', 'Dashboard')}
              </a>
            </li>
            <li className="font-medium">
              {t('navigation.premium', 'Premium')}
            </li>
          </ul>
        </div>
      </div>
      
      {/* Premium Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          {t('premium.upgradeToday', 'Upgrade to Premium Today')}
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          {t('premium.unlockDescription', 'Take your plant care to the next level with advanced features, detailed analytics, and premium support.')}
        </p>
        
        {/* Plan toggle */}
        <div className="inline-flex items-center bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setSelectedPlan('monthly')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              selectedPlan === 'monthly' 
                ? 'bg-white text-emerald-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('premium.monthly', 'Monthly')}
          </button>
          <button
            onClick={() => setSelectedPlan('annual')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              selectedPlan === 'annual' 
                ? 'bg-white text-emerald-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('premium.annual', 'Annual')} 
            <span className="ml-1 text-emerald-600 font-semibold">
              {t('premium.save', 'Save 20%')}
            </span>
          </button>
        </div>
      </div>
      
      {/* Pricing Comparison */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Free Plan */}
          <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {t('premium.basic', 'Basic')}
              </h2>
              <p className="text-gray-500 mb-4">
                {t('premium.basicDesc', 'Essential features for casual plant owners')}
              </p>
              <div className="mb-6">
                <span className="text-3xl font-bold text-gray-900">0₫</span>
                <span className="text-gray-500 ml-1">{t('premium.forever', 'forever')}</span>
              </div>
              <button
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors"
                disabled
              >
                {t('premium.currentPlan', 'Current Plan')}
              </button>
            </div>
            <div className="border-t border-gray-200 p-6">
              <h3 className="font-medium text-gray-900 mb-4">
                {t('premium.includes', 'Includes:')}
              </h3>
              <ul className="space-y-3">
                <PlanFeature text={t('premium.features.basic1', 'Up to 5 plants')} />
                <PlanFeature text={t('premium.features.basic2', 'Basic plant monitoring')} />
                <PlanFeature text={t('premium.features.basic3', 'Watering reminders')} />
                <PlanFeature text={t('premium.features.basic4', 'Limited data history (30 days)')} />
                <PlanFeature text={t('premium.features.basic5', 'Community support')} />
              </ul>
            </div>
          </div>
          
          {/* Premium Plan */}
          <div className="bg-white rounded-xl overflow-hidden border border-emerald-200 shadow-sm relative">
            <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold py-1 px-3 rounded-bl-lg">
              {t('premium.recommended', 'RECOMMENDED')}
            </div>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {t('premium.premium', 'Premium')}
              </h2>
              <p className="text-gray-500 mb-4">
                {t('premium.premiumDesc', 'Advanced features for serious plant enthusiasts')}
              </p>
              <div className="mb-6">
                {selectedPlan === 'monthly' ? (
                  <>
                    <span className="text-3xl font-bold text-emerald-600">15,000₫</span>
                    <span className="text-gray-500 ml-1">{t('premium.perMonth', 'per month')}</span>
                  </>
                ) : (
                  <>
                    <span className="text-3xl font-bold text-emerald-600">150,000₫</span>
                    <span className="text-gray-500 ml-1">{t('premium.perYear', 'per year')}</span>
                    <div className="text-sm text-emerald-600 font-medium mt-1">
                      {t('premium.billed', 'Billed annually (17% off)')}
                    </div>
                  </>
                )}
              </div>
              <div className="space-y-2">
                <button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                  onClick={() => handleUpgradeClick(selectedPlan)}
                >
                  {selectedPlan === 'monthly' ? 
                    t('premium.monthlyUpgrade', 'Get Monthly Plan') : 
                    t('premium.annualUpgrade', 'Get Annual Plan')}
                </button>
                <button
                  className="w-full bg-white border border-emerald-600 hover:bg-emerald-50 text-emerald-600 py-2 px-4 rounded-lg font-medium transition-colors"
                  onClick={() => handleUpgradeClick('lifetime')}
                >
                  {t('premium.lifetimeUpgrade', 'Lifetime Access - 299,000₫')}
                </button>
              </div>
            </div>
            <div className="border-t border-gray-200 p-6">
              <h3 className="font-medium text-gray-900 mb-4">
                {t('premium.includes', 'Includes everything in Basic, plus:')}
              </h3>
              <ul className="space-y-3">
                <PlanFeature text={t('premium.features.premium1', 'Unlimited plants')} highlighted={true} />
                <PlanFeature text={t('premium.features.premium2', 'Custom zones & plant groups')} highlighted={true} />
                <PlanFeature text={t('premium.features.premium3', 'Advanced analytics & reports')} highlighted={true} />
                <PlanFeature text={t('premium.features.premium4', 'Automated watering schedules')} highlighted={true} />
                <PlanFeature text={t('premium.features.premium5', 'Unlimited data history')} highlighted={true} />
                <PlanFeature text={t('premium.features.premium7', 'Priority customer support')} highlighted={true} />
                <PlanFeature text={t('premium.features.premium8', 'Export data (CSV, PDF)')} highlighted={true} />
              </ul>
            </div>
          </div>

          {/* Ultimate Plan */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl overflow-hidden border-2 border-purple-300 shadow-lg relative transform hover:scale-105 transition-all duration-300">
            <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-500 via-purple-600 to-indigo-700 text-white text-xs font-bold py-1 px-3 rounded-bl-lg shadow-lg animate-pulse">
              ✨ {t('premium.ultimate', 'ULTIMATE')}
            </div>
            <div className="p-6">
              <h2 className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                {t('premium.ultimate', 'Ultimate')}
              </h2>
              <p className="text-gray-600 mb-4">
                {t('premium.ultimateDesc', 'Everything Premium has + AI intelligence & real-time monitoring')}
              </p>
              <div className="mb-6">
                {selectedPlan === 'monthly' ? (
                  <>
                    <span className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">45,000₫</span>
                    <span className="text-gray-500 ml-1">{t('premium.perMonth', 'per month')}</span>
                  </>
                ) : (
                  <>
                    <span className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">399,000₫</span>
                    <span className="text-gray-500 ml-1">{t('premium.perYear', 'per year')}</span>
                    <div className="text-sm text-purple-600 font-medium mt-1">
                      {t('premium.ultimateBilled', 'Billed annually (26% off)')}
                    </div>
                  </>
                )}
              </div>
              <div className="space-y-2">
                <button
                  className="w-full bg-gradient-to-r from-purple-500 via-purple-600 to-indigo-700 hover:from-purple-600 hover:via-purple-700 hover:to-indigo-800 text-white py-2 px-4 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/50"
                  onClick={() => handleUpgradeClick(selectedPlan === 'monthly' ? 'ultimate-monthly' : 'ultimate-annual')}
                >
                  {selectedPlan === 'monthly' ? 
                    t('premium.ultimateMonthlyUpgrade', 'Get Ultimate Monthly') : 
                    t('premium.ultimateAnnualUpgrade', 'Get Ultimate Annual')}
                </button>
              </div>
            </div>
            <div className="border-t border-purple-200 p-6 bg-white/50">
              <h3 className="font-medium text-gray-900 mb-4">
                {t('premium.includes', 'Includes everything in Premium, plus:')}
              </h3>
              <ul className="space-y-3">
                <PlanFeature text={t('premium.features.ultimate1', '🤖 AI-powered plant recommendations')} highlighted={true} />
                <PlanFeature text={t('premium.features.ultimate2', '📹 Real-time camera monitoring')} highlighted={true} />
                <PlanFeature text={t('premium.features.ultimate3', '🔬 Advanced plant health analysis')} highlighted={true} />
                <PlanFeature text={t('premium.features.ultimate4', '📱 Smart notifications & alerts')} highlighted={true} />
                <PlanFeature text={t('premium.features.ultimate5', '🌡️ Environmental pattern recognition')} highlighted={true} />
                <PlanFeature text={t('premium.features.ultimate6', '⚡ Instant priority support')} highlighted={true} />
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      {/* Premium Features Showcase */}
      <div className="mb-16">
        <h2 className="text-2xl font-semibold text-gray-900 text-center mb-8">
          {t('premium.featuresTitle', 'Premium Features')}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="rounded-full bg-emerald-100 w-12 h-12 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t('premium.advancedAnalytics', 'Advanced Analytics')}
            </h3>
            <p className="text-gray-600">
              {t('premium.advancedAnalyticsDesc', "Get detailed insights into your plant's health over time with comprehensive data visualization and trend analysis.")}
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="rounded-full bg-emerald-100 w-12 h-12 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t('premium.automatedSchedules', 'Automated Schedules')}
            </h3>
            <p className="text-gray-600">
              {t('premium.automatedSchedulesDesc', "Create smart watering schedules tailored to each plant's needs, with automatic adjustments based on real-time sensor data.")}
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="rounded-full bg-emerald-100 w-12 h-12 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t('premium.aiRecommendations', 'AI Recommendations')}
            </h3>
            <p className="text-gray-600">
              {t('premium.aiRecommendationsDesc', "Receive personalized care recommendations from our AI system, which learns from your plants' specific conditions and growth patterns.")}
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="rounded-full bg-emerald-100 w-12 h-12 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t('premium.customZones', 'Custom Zones')}
            </h3>
            <p className="text-gray-600">
              {t('premium.customZonesDesc', 'Organize plants into custom zones based on location, type, or care requirements to streamline monitoring and management.')}
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="rounded-full bg-emerald-100 w-12 h-12 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t('premium.dataExport', 'Data Export')}
            </h3>
            <p className="text-gray-600">
              {t('premium.dataExportDesc', 'Export your plant data in various formats, including CSV and PDF, for record-keeping or further analysis.')}
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="rounded-full bg-emerald-100 w-12 h-12 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t('premium.prioritySupport', 'Priority Support')}
            </h3>
            <p className="text-gray-600">
              {t('premium.prioritySupportDesc', 'Get priority access to our support team with faster response times and dedicated assistance for any issues.')}
            </p>
          </div>
        </div>
      </div>
      
      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto mb-16">
        <h2 className="text-2xl font-semibold text-gray-900 text-center mb-8">
          {t('premium.faqTitle', 'Frequently Asked Questions')}
        </h2>
        
        <div className="space-y-4">
          <FAQ 
            question={t('premium.faq1', 'How does the Premium subscription work?')}
            answer={t('premium.faqAnswer1', "When you upgrade to Premium, you'll immediately gain access to all premium features. You can choose between monthly or annual billing. Annual billing saves you 20% compared to monthly payments.")}
          />
          
          <FAQ 
            question={t('premium.faq2', 'Can I cancel my subscription anytime?')}
            answer={t('premium.faqAnswer2', 'Yes, you can cancel your Premium subscription at any time. Your access to premium features will continue until the end of your current billing period. We don\'t offer refunds for partial subscription periods.')}
          />
          
          <FAQ 
            question={t('premium.faq3', 'What happens to my data if I downgrade to Basic?')}
            answer={t('premium.faqAnswer3', "If you downgrade from Premium to Basic, you'll still have access to your core plant data, but premium features will be disabled. Historical data beyond 30 days will be archived but not deleted, so if you upgrade again later, you can regain access to it.")}
          />
          
          <FAQ 
            question={t('premium.faq4', 'Is there a limit to how many plants I can add with Premium?')}
            answer={t('premium.faqAnswer4', 'No, Premium subscribers can add unlimited plants to their account. This is compared to the Basic plan, which allows up to 5 plants.')}
          />
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-8 text-white text-center max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">
          {t('premium.readyToUpgrade', 'Ready to upgrade your plant care?')}
        </h2>
        <p className="mb-6 max-w-xl mx-auto">
          {t('premium.ctaDescription', 'Join thousands of plant enthusiasts who have transformed their plant care routine with PlantSmart Premium.')}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button 
            className="bg-white text-emerald-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-medium transition-colors"
            onClick={() => handleUpgradeClick('monthly')}
          >
            {t('premium.getStartedMonthly', 'Get Started - 15,000₫/month')}
          </button>
          <button 
            className="bg-white text-emerald-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-medium transition-colors"
            onClick={() => handleUpgradeClick('lifetime')}
          >
            {t('premium.getLifetime', 'Get Lifetime - 399,000₫')}
          </button>
        </div>
        <p className="mt-3 text-sm opacity-80">
          {t('premium.securePayment', 'Secure payment processing by VNPay')}
        </p>
      </div>
      
      {/* Processing and Error Display */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              <span className="ml-2 text-lg font-medium">{t('payment.processing', 'Processing payment...')}</span>
            </div>
            <p className="text-gray-600">{t('payment.redirecting', 'Redirecting to VNPay payment gateway...')}</p>
          </div>
        </div>
      )}
      
      {/* Payment Error Message */}
      {paymentError && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="text-center mb-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.82 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t('payment.error', 'Payment Error')}</h3>
              <p className="text-sm text-gray-600 mb-4">{paymentError}</p>
            </div>
            <div className="flex justify-center">
              <button
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                onClick={() => setPaymentError(null)}
              >
                {t('common.close', 'Close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PlanFeature({ text, highlighted = false }) {
  return (
    <li className="flex items-start">
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className={`h-5 w-5 mr-2 ${
          highlighted ? 'text-emerald-500' : 'text-gray-500'
        }`} 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
      <span className={highlighted ? 'text-gray-900' : 'text-gray-600'}>{text}</span>
    </li>
  );
}

function FAQ({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        className="flex items-center justify-between w-full text-left p-4 focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="font-medium text-gray-900">{question}</h3>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className={`h-5 w-5 text-gray-500 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <p className="text-gray-600">{answer}</p>
        </div>
      )}
    </div>
  );
}