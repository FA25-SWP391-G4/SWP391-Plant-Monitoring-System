import Link from "next/link";
<<<<<<< HEAD:client/src/components/Navbar.jsx
import { useState } from "react";
=======
import Image from "next/image";
>>>>>>> 1d1e2513b9e8ac5f36f74d326d2a76f901e82987:client/src/components/navigation/Navbar.jsx
import { useAuth } from "@/providers/AuthProvider";
import LanguageSwitcher from './LanguageSwitcher';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const isPremium = user?.role === "Premium" || user?.role === "Admin";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
<<<<<<< HEAD:client/src/components/Navbar.jsx
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold text-emerald-600">🌱 SmartFarm</span>
=======
    <header className="container mx-auto px-4 py-6 flex items-center justify-between">
      {/* Logo and Brand */}
      <div className="flex items-center">
        <Link href={isAuthenticated ? "/dashboard" : "/"} className="flex items-center">
          <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center">
            <Image src="/app-icon.png" alt="PlantSmart Logo" width={24} height={24} />
          </div>
          <span className="ml-2 text-xl font-semibold text-gray-800">{t('common.appName', 'PlantSmart')}</span>
        </Link>
      </div>

      {/* Mobile Menu Button */}
      <div className="md:hidden">
        <button
          type="button"
          onClick={toggleMobileMenu}
          className="text-gray-600 hover:text-green-600 focus:outline-none"
        >
          {mobileMenuOpen ? (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          )}
        </button>
      </div>

      {/* Desktop Navigation - Changes based on user role */}
      <nav className="hidden md:flex space-x-8">
        {/* Navigation mapping based on availability and role */}
        {!isAuthenticated && (
          <>
            <Link href="/features" className="text-gray-600 hover:text-green-600 transition">
              {t('navigation.features')}
            </Link>
            <Link href="/benefits" className="text-gray-600 hover:text-green-600 transition">
              {t('navigation.benefits')}
            </Link>
            <Link href="/pricing" className="text-gray-600 hover:text-green-600 transition">
              {t('navigation.pricing')}
            </Link>
          </>
        )}

        {/* Authenticated user navigation */}
        {isAuthenticated && (
          <>
            <Link href="/dashboard" className="text-gray-600 hover:text-green-600 transition">
              {t('navigation.dashboard')}
            </Link>
            <Link href="/plants" className="text-gray-600 hover:text-green-600 transition">
              {t('navigation.plants')}
            </Link>

            {/* Premium features */}
            {(isPremium || isAdmin) && (
              <>
                <Link href="/zones" className="text-gray-600 hover:text-green-600 transition">
                  {t('navigation.zones')}
                </Link>
                <Link href="/reports" className="text-gray-600 hover:text-green-600 transition">
                  {t('navigation.reports')}
                </Link>
              </>
            )}

            {/* Admin-only features */}
            {isAdmin && (
              <Link href="/admin" className="text-gray-600 hover:text-green-600 transition">
                {t('navigation.admin')}
              </Link>
            )}
          </>
        )}

        {/* Contact page is always available */}
        <Link href="/contact" className="text-gray-600 hover:text-green-600 transition">
          {t('navigation.contact')}
        </Link>
      </nav>

      {/* Right-side buttons - Change by role */}
      <div className="flex items-center space-x-4">
        {/* User is logged in */}
        {isAuthenticated ? (
          <>
            {/* Show upgrade button for regular users */}
            {user.role === "Regular" && (
              <Link
                href="/premium"
                className="hidden sm:flex items-center text-sm font-medium bg-gradient-to-r from-amber-500 to-amber-600 text-white px-3 py-1.5 rounded-full hover:from-amber-600 hover:to-amber-700 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
                {t('common.upgrade')}
              </Link>
            )}

            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button 
                className="text-gray-500 hover:text-green-600 relative p-2"
                onClick={() => setNotificationDropdownOpen(!notificationDropdownOpen)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bell">
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
                </svg>
                {unreadNotifications > 0 && (
                  <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {unreadNotifications}
                  </span>
                )}
              </button>
              
              {/* Notification dropdown */}
              {notificationDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg border border-gray-100 z-50 overflow-hidden">
                  <div className="py-2 border-b border-gray-100 px-4 flex justify-between items-center">
                    <h3 className="font-medium text-gray-800">{t('notifications.title', 'Notifications')}</h3>
                    {notifications.length > 0 && (
                      <button 
                        onClick={markAllAsRead}
                        className="text-xs text-green-600 hover:text-green-800"
                      >
                        {t('notifications.markAllRead', 'Mark all as read')}
                      </button>
                    )}
                  </div>
                  
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((notification, index) => (
                        <div 
                          key={index}
                          className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${!notification.read ? 'bg-blue-50' : ''}`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex items-start">
                            <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center mr-3 ${notification.read ? 'bg-gray-100' : 'bg-green-100'}`}>
                              {notification.type === 'alert' && (
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600">
                                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"></path>
                                  <line x1="12" y1="9" x2="12" y2="13"></line>
                                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                </svg>
                              )}
                              {notification.type === 'info' && (
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                                  <circle cx="12" cy="12" r="10"></circle>
                                  <line x1="12" y1="16" x2="12" y2="12"></line>
                                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                </svg>
                              )}
                              {notification.type === 'success' && (
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14"></path>
                                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                </svg>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className={`text-sm ${!notification.read ? 'font-medium text-gray-900' : 'text-gray-700'}`}>{notification.title}</p>
                              <p className="text-xs text-gray-500 mt-1">{notification.message}</p>
                              <p className="text-xs text-gray-400 mt-1">{formatNotificationTime(notification.time)}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-6 text-center text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <p>{t('notifications.empty', 'No new notifications')}</p>
                      </div>
                    )}
                  </div>
                  
                  {notifications.length > 0 && (
                    <div className="py-2 text-center border-t border-gray-100">
                      <Link href="/notifications" className="text-sm text-green-600 hover:text-green-800">
                        {t('notifications.viewAll', 'View all notifications')}
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Unified User Menu - combines user profile, language and theme */}
            <UserMenu />
          </>
        ) : (
          /* User is not logged in */
          <>
            <Link href="/login" className="text-green-600 hover:text-green-800 font-medium transition">
              {t('auth.login')}
            </Link>
            <Link
              href="/register"
              className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md font-medium transition"
            >
              {t('common.getStarted')}
>>>>>>> 1d1e2513b9e8ac5f36f74d326d2a76f901e82987:client/src/components/navigation/Navbar.jsx
            </Link>
            
            {/* Main Navigation - Desktop */}
            <div className="hidden md:ml-8 md:flex md:space-x-8">
              <Link href="/dashboard" className="text-gray-900 hover:text-emerald-600 px-3 py-2 text-sm font-medium transition-colors">
                {t('nav.dashboard', 'Dashboard')}
              </Link>
              <Link href="/plants" className="text-gray-900 hover:text-emerald-600 px-3 py-2 text-sm font-medium transition-colors">
                {t('nav.plants', 'Plants')}
              </Link>
              
              {/* AI Features Dropdown */}
              <div className="relative group">
                <button className="text-gray-900 hover:text-emerald-600 px-3 py-2 text-sm font-medium transition-colors flex items-center">
                  <span className="mr-1">🤖</span>
                  {t('nav.ai', 'AI Features')}
                  <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-1">
                    <Link href="/ai/chat" className="block px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600">
                      <span className="mr-2">💬</span>
                      {t('nav.aiChat', 'AI Chatbot')}
                    </Link>
                    <Link href="/ai/predictions" className="block px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600">
                      <span className="mr-2">🔮</span>
                      {t('nav.predictions', 'Watering Predictions')}
                    </Link>
                    <Link href="/ai/image-analysis" className="block px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600">
                      <span className="mr-2">📸</span>
                      {t('nav.imageAnalysis', 'Disease Detection')}
                    </Link>
                    <Link href="/ai/history" className="block px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600">
                      <span className="mr-2">📊</span>
                      {t('nav.aiHistory', 'AI History')}
                    </Link>
                  </div>
                </div>
              </div>
              
              {isPremium && (
                <>
                  <Link href="/zones" className="text-gray-900 hover:text-emerald-600 px-3 py-2 text-sm font-medium transition-colors">
                    {t('nav.zones', 'Zones')}
                  </Link>
                  <Link href="/reports" className="text-gray-900 hover:text-emerald-600 px-3 py-2 text-sm font-medium transition-colors">
                    {t('nav.reports', 'Reports')}
                  </Link>
                  <Link href="/thresholds" className="text-gray-900 hover:text-emerald-600 px-3 py-2 text-sm font-medium transition-colors">
                    {t('nav.thresholds', 'Thresholds')}
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-500 hover:text-gray-700 p-2"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            
            {user ? (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-700">
                  {user.name} 
                  <span className={`ml-1 px-2 py-1 text-xs rounded-full ${
                    user.role === 'Premium' || user.role === 'Admin' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role}
                  </span>
                </span>
                {user.role === "Regular" && (
                  <Link href="/upgrade" className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors">
                    {t('nav.upgrade', 'Upgrade')}
                  </Link>
                )}
                <button 
                  onClick={logout}
                  className="text-gray-500 hover:text-gray-700 px-3 py-1 text-sm font-medium transition-colors"
                >
                  {t('nav.logout', 'Logout')}
                </button>
              </div>
            ) : (
              <Link href="/login" className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                {t('nav.login', 'Login')}
              </Link>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-200">
              <Link 
                href="/dashboard" 
                className="block px-3 py-2 text-base font-medium text-gray-900 hover:text-emerald-600 hover:bg-gray-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('nav.dashboard', 'Dashboard')}
              </Link>
              <Link 
                href="/plants" 
                className="block px-3 py-2 text-base font-medium text-gray-900 hover:text-emerald-600 hover:bg-gray-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('nav.plants', 'Plants')}
              </Link>
              
              {/* AI Features - Mobile */}
              <div className="px-3 py-2">
                <div className="text-sm font-medium text-gray-500 mb-2">
                  🤖 {t('nav.ai', 'AI Features')}
                </div>
                <div className="ml-4 space-y-1">
                  <Link 
                    href="/ai/chat" 
                    className="block px-3 py-2 text-sm text-gray-700 hover:text-emerald-600 hover:bg-gray-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    💬 {t('nav.aiChat', 'AI Chatbot')}
                  </Link>
                  <Link 
                    href="/ai/predictions" 
                    className="block px-3 py-2 text-sm text-gray-700 hover:text-emerald-600 hover:bg-gray-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    🔮 {t('nav.predictions', 'Watering Predictions')}
                  </Link>
                  <Link 
                    href="/ai/image-analysis" 
                    className="block px-3 py-2 text-sm text-gray-700 hover:text-emerald-600 hover:bg-gray-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    📸 {t('nav.imageAnalysis', 'Disease Detection')}
                  </Link>
                  <Link 
                    href="/ai/history" 
                    className="block px-3 py-2 text-sm text-gray-700 hover:text-emerald-600 hover:bg-gray-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    📊 {t('nav.aiHistory', 'AI History')}
                  </Link>
                </div>
              </div>

              {isPremium && (
                <>
                  <Link 
                    href="/zones" 
                    className="block px-3 py-2 text-base font-medium text-gray-900 hover:text-emerald-600 hover:bg-gray-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('nav.zones', 'Zones')}
                  </Link>
                  <Link 
                    href="/reports" 
                    className="block px-3 py-2 text-base font-medium text-gray-900 hover:text-emerald-600 hover:bg-gray-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('nav.reports', 'Reports')}
                  </Link>
                  <Link 
                    href="/thresholds" 
                    className="block px-3 py-2 text-base font-medium text-gray-900 hover:text-emerald-600 hover:bg-gray-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('nav.thresholds', 'Thresholds')}
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
