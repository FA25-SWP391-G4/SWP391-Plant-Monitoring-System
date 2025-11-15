'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'

export default function NotFound() {
  const { t } = useTranslation()
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex flex-col items-center justify-center">
      <div className="text-center space-y-6 p-8 max-w-md mx-auto">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center mr-3">
            <Image 
              src="/app-icon.png" 
              alt="PlantSmart Logo" 
              width={32} 
              height={32}
              className="object-contain"
            />
          </div>
          <span className="text-2xl font-bold text-gray-900">
            {t('common.appName', 'PlantSmart')}
          </span>
        </div>

        {/* 404 Error */}
        <div className="space-y-4">
          <h1 className="text-6xl font-bold text-green-600">404</h1>
          <h2 className="text-2xl font-semibold text-gray-900">
            {t('notFound.title', 'Page Not Found')}
          </h2>
          <p className="text-gray-600 text-lg">
            {t('notFound.description', 'The page you are looking for might have been moved, deleted, or does not exist.')}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4 pt-6">
          <Link 
            href="/"
            className="inline-block w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-3 rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {t('notFound.goHome', 'Go Back Home')}
          </Link>
          
          <Link 
            href="/dashboard"
            className="inline-block w-full border-2 border-green-500 text-green-600 px-8 py-3 rounded-lg font-medium hover:bg-green-50 transition-all duration-200"
          >
            {t('notFound.goDashboard', 'Go to Dashboard')}
          </Link>
        </div>

        {/* Help Text */}
        <div className="pt-6 text-sm text-gray-500">
          {t('notFound.helpText', 'If you believe this is an error, please contact support.')}
        </div>
      </div>
    </div>
  )
}