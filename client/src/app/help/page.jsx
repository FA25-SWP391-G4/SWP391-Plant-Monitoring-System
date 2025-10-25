'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';

export default function HelpPage() {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState('general');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFaqs, setFilteredFaqs] = useState([]);
  
  // Sample FAQs data
  const faqCategories = {
    general: [
      {
        id: 'faq-1',
        question: t('faq.general.q1', 'What is PlantSmart?'),
        answer: t('faq.general.a1', 'PlantSmart is a comprehensive plant monitoring system that helps you track and maintain the health of your plants using smart sensors, automated watering systems, and AI-powered recommendations. It offers real-time monitoring of soil moisture, light levels, temperature, and humidity to ensure your plants thrive.')
      },
      {
        id: 'faq-2',
        question: t('faq.general.q2', 'How does the plant monitoring system work?'),
        answer: t('faq.general.a2', "Our system uses IoT sensors that you place in your plant pots. These sensors collect data about soil moisture, light exposure, temperature, and humidity. The data is sent to our platform where it's analyzed to provide you with real-time insights and automated care recommendations tailored to each plant species.")
      },
      {
        id: 'faq-3',
        question: t('faq.general.q3', 'What devices are compatible with PlantSmart?'),
        answer: t('faq.general.a3', 'PlantSmart is compatible with our proprietary sensors and watering systems, as well as select third-party IoT devices. For a complete list of compatible devices, please check our Devices page or contact our support team.')
      },
    ],
    account: [
      {
        id: 'faq-4',
        question: t('faq.account.q1', 'How do I create an account?'),
        answer: t('faq.account.a1', "To create an account, click on 'Register' in the top-right corner of our homepage. You'll need to provide your email address, create a password, and fill in some basic information. You can also sign up using your Google or Apple account for faster registration.")
      },
      {
        id: 'faq-5',
        question: t('faq.account.q2', 'What are the different subscription plans?'),
        answer: t('faq.account.a2', "We offer a free Basic plan that includes essential monitoring features. Our Premium plan includes advanced features like automated watering schedules, custom zones, detailed analytics, and priority support. For larger installations, we also offer Enterprise plans. You can view detailed plan comparisons on our Pricing page.")
      },
      {
        id: 'faq-6',
        question: t('faq.account.q3', 'How do I reset my password?'),
        answer: t('faq.account.a3', "To reset your password, click on 'Login' then select 'Forgot Password'. Enter the email address associated with your account, and we'll send you instructions to reset your password. For security reasons, the password reset link is valid for 24 hours.")
      },
    ],
    technical: [
      {
        id: 'faq-7',
        question: t('faq.technical.q1', 'How do I connect my sensors to the system?'),
        answer: t('faq.technical.a1', "After purchasing sensors, download our mobile app and follow the in-app setup wizard. Make sure your mobile device's Bluetooth is turned on. The app will guide you through the process of connecting sensors to your WiFi network and assigning them to specific plants.")
      },
      {
        id: 'faq-8',
        question: t('faq.technical.q2', 'What if my sensors are not connecting to WiFi?'),
        answer: t('faq.technical.a2', 'If your sensors aren\'t connecting to WiFi, try these steps: 1) Ensure your WiFi network is working, 2) Verify the sensor is within range of your WiFi router, 3) Check if your WiFi network is 2.4GHz (our sensors don\'t support 5GHz), 4) Restart the sensor by removing and reinserting the battery, 5) Try the setup process again. If issues persist, please contact our support team.')
      },
      {
        id: 'faq-9',
        question: t('faq.technical.q3', 'How accurate are the moisture readings?'),
        answer: t('faq.technical.a3', 'Our sensors provide moisture readings with approximately 95% accuracy. The readings are calibrated for most common potting soils. For specialized soil mixes, you may need to adjust the moisture thresholds in the app settings. We recommend placing the sensor in the middle of the pot, halfway between the center and edge, for the most accurate readings.')
      },
    ],
    billing: [
      {
        id: 'faq-10',
        question: t('faq.billing.q1', 'How do I update my payment method?'),
        answer: t('faq.billing.a1', 'To update your payment method, go to Settings > Billing and click on "Payment Methods". From there, you can add a new payment method or edit existing ones. You can use credit/debit cards, PayPal, or local payment options depending on your region.')
      },
      {
        id: 'faq-11',
        question: t('faq.billing.q2', 'Can I get a refund?'),
        answer: t('faq.billing.a2', 'We offer a 30-day satisfaction guarantee for our Premium subscription. If you\'re not satisfied, you can request a refund within 30 days of your initial purchase. For hardware purchases, we follow our Return Policy which allows returns within 14 days of delivery for unused items in original packaging.')
      },
      {
        id: 'faq-12',
        question: t('faq.billing.q3', 'How do I cancel my subscription?'),
        answer: t('faq.billing.a3', 'To cancel your subscription, go to Settings > Billing > Subscription and click on "Cancel Subscription". Your access to Premium features will continue until the end of your current billing period. You can reactivate your subscription at any time. Please note that we don\'t provide partial refunds for unused portions of a billing period.')
      },
    ],
  };
  
  // Set initial filtered FAQs
  useEffect(() => {
    setFilteredFaqs(faqCategories[activeCategory] || []);
  }, [activeCategory]);
  
  // Handle search
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredFaqs(faqCategories[activeCategory] || []);
      return;
    }
    
    // Search across all categories
    const results = Object.values(faqCategories)
      .flat()
      .filter(faq => 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    setFilteredFaqs(results);
  }, [searchQuery, activeCategory]);
  
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
              {t('navigation.help', 'Help & Support')}
            </li>
          </ul>
        </div>
      </div>
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {t('help.title', 'Help & Support Center')}
        </h1>
        <p className="text-gray-600 max-w-3xl">
          {t('help.description', "Find answers to common questions about using PlantSmart. Can't find what you're looking for? Contact our support team for personalized assistance.")}
        </p>
      </div>
      
      {/* Search bar */}
      <div className="mb-8">
        <div className="relative max-w-xl">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder={t('help.searchPlaceholder', 'Search for answers...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
      </div>
      
      {/* Quick links */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {t('help.quickLinks', 'Quick Links')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/help/getting-started" className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-colors">
            <div className="rounded-full bg-emerald-100 p-3 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{t('help.gettingStarted', 'Getting Started')}</h3>
              <p className="text-sm text-gray-500">{t('help.gettingStartedDesc', 'Set up your account and devices')}</p>
            </div>
          </Link>
          
          <Link href="/help/troubleshooting" className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-colors">
            <div className="rounded-full bg-emerald-100 p-3 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{t('help.troubleshooting', 'Troubleshooting')}</h3>
              <p className="text-sm text-gray-500">{t('help.troubleshootingDesc', 'Fix common issues')}</p>
            </div>
          </Link>
          
          <Link href="/help/contact" className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-colors">
            <div className="rounded-full bg-emerald-100 p-3 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{t('help.contactSupport', 'Contact Support')}</h3>
              <p className="text-sm text-gray-500">{t('help.contactSupportDesc', 'Get personalized help')}</p>
            </div>
          </Link>
        </div>
      </div>
      
      {/* FAQ section */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          {t('help.frequentlyAsked', 'Frequently Asked Questions')}
        </h2>
        
        {/* Category tabs */}
        <div className="flex flex-wrap border-b border-gray-200 mb-6">
          {Object.keys(faqCategories).map((category) => (
            <button
              key={category}
              onClick={() => {
                setActiveCategory(category);
                setSearchQuery('');
              }}
              className={`px-4 py-2 text-sm font-medium ${
                activeCategory === category ? 'text-emerald-600 border-b-2 border-emerald-500' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t(`help.categories.${category}`, category.charAt(0).toUpperCase() + category.slice(1))}
            </button>
          ))}
        </div>
        
        {/* FAQ accordion */}
        <div className="space-y-4">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq) => (
              <FaqItem key={faq.id} faq={faq} />
            ))
          ) : (
            <div className="text-center py-8">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t('help.noResults', 'No results found')}
              </h3>
              <p className="text-gray-500">
                {t('help.tryDifferent', 'Try different keywords or browse categories')}
              </p>
            </div>
          )}
        </div>
        
        {/* Still need help */}
        <div className="bg-gray-50 rounded-lg p-6 mt-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t('help.stillNeedHelp', 'Still need help?')}
          </h3>
          <p className="text-gray-600 mb-4">
            {t('help.reachOut', 'Our support team is ready to assist you with any questions or issues you may have.')}
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/help/contact" className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
              {t('help.contactUs', 'Contact Us')}
            </Link>
            <Link href="/help/live-chat" className="px-4 py-2 bg-white text-emerald-600 border border-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors">
              {t('help.liveChat', 'Start Live Chat')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function FaqItem({ faq }) {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();
  
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        className="flex items-center justify-between w-full text-left p-4 focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="font-medium text-gray-900">{faq.question}</h3>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className={`h-5 w-5 text-gray-500 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
          aria-label={isOpen ? t('common.collapse', 'Collapse') : t('common.expand', 'Expand')}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <p className="text-gray-600">{faq.answer}</p>
        </div>
      )}
    </div>
  );
}