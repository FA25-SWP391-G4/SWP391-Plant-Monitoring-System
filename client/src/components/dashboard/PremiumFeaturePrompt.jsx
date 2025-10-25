import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export default function PremiumFeaturePrompt() {
  const { t } = useTranslation();
  
  return (
    <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl shadow-sm border border-amber-200 p-5">
      <div className="flex items-center mb-4">
        <div className="bg-amber-200 p-2 rounded-full text-amber-700 mr-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2 L18.5 7 L17 13 L12 16 L7 13 L5.5 7 Z"></path>
            <path d="M7 13 L5 19 L12 22 L19 19 L17 13"></path>
          </svg>
        </div>
        <h3 className="font-semibold text-amber-900">{t('premium.unlockPremium', 'Unlock Premium Features')}</h3>
      </div>
      
      <p className="text-sm text-amber-800 mb-4">
        {t('premium.upgradeMessage', 'Upgrade to access advanced analytics, automated watering, and more!')}
      </p>
      
      <ul className="space-y-2 mb-4">
        <li className="flex items-start text-sm text-amber-800">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 mr-2 flex-shrink-0 mt-0.5">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <path d="m9 11 3 3L22 4"></path>
          </svg>
          {t('premium.feature1', 'AI-powered plant health analysis')}
        </li>
        <li className="flex items-start text-sm text-amber-800">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 mr-2 flex-shrink-0 mt-0.5">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <path d="m9 11 3 3L22 4"></path>
          </svg>
          {t('premium.feature2', 'Unlimited plant tracking')}
        </li>
        <li className="flex items-start text-sm text-amber-800">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 mr-2 flex-shrink-0 mt-0.5">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <path d="m9 11 3 3L22 4"></path>
          </svg>
          {t('premium.feature3', 'Customizable dashboard widgets')}
        </li>
      </ul>
      
      <Link href="/premium" className="w-full inline-block text-center py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors">
        {t('premium.upgradeNow', 'Upgrade Now')}
      </Link>
    </div>
  );
}