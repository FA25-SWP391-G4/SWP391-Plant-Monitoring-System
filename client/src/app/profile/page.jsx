'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

/**
 * User Profile Page
 * Displays user information and account details
 */
const ProfilePage = () => {
  const { t } = useTranslation();
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Redirect if user is not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      try {
        setIsLoadingProfile(true);
        
        // If we have a profileApi, use it
        if (typeof window !== 'undefined' && window.profileApi) {
          const response = await window.profileApi.getUserProfile();
          if (response.data) {
            setUserProfile(response.data);
          } else {
            // Fallback to current user data if API doesn't return anything
            setUserProfile(user);
          }
        } else {
          // Fallback to current user data if API is not available
          setUserProfile(user);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setUserProfile(user); // Fallback to current user data
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  // Show loading state while checking authentication
  if (isLoading || isLoadingProfile) {
    return (
      <div className="flex justify-center items-center min-h-[80vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('common.loading', 'Loading...')}</p>
        </div>
      </div>
    );
  }

  // User profile content
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">{t('profile.title', 'User Profile')}</h1>
      
      {userProfile && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Profile header */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-8 text-white">
            <div className="flex flex-col md:flex-row items-center">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-green-600 text-4xl font-bold mb-4 md:mb-0 md:mr-6">
                {userProfile.name?.charAt(0) || 'U'}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{userProfile.name || t('common.user', 'User')}</h2>
                <p className="opacity-90">{userProfile.email}</p>
                {userProfile.role && (
                  <div className="mt-2">
                    <span className={`inline-block px-3 py-1 text-sm rounded-full ${
                      userProfile.role === 'Premium' ? 'bg-amber-400 text-amber-900' :
                      userProfile.role === 'Admin' ? 'bg-purple-400 text-purple-900' :
                      'bg-white/20 text-white'
                    }`}>
                      {userProfile.role === 'Premium' ? t('profile.premiumUser', 'Premium User') :
                       userProfile.role === 'Admin' ? t('profile.adminUser', 'Administrator') :
                       t('profile.standardUser', 'Standard User')}
                    </span>
                  </div>
                )}
              </div>
              <div className="md:ml-auto mt-4 md:mt-0">
                <Link
                  href="/profile/edit"
                  className="bg-white text-green-600 hover:bg-green-50 py-2 px-4 rounded-md font-medium"
                >
                  {t('profile.editProfile', 'Edit Profile')}
                </Link>
              </div>
            </div>
          </div>
          
          {/* Profile content */}
          <div className="p-6">
            {/* Account Information */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4 border-b pb-2">{t('profile.accountInfo', 'Account Information')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">{t('common.fullName', 'Full Name')}</p>
                  <p className="font-medium">{userProfile.name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t('common.email', 'Email')}</p>
                  <p className="font-medium">{userProfile.email || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t('common.phoneNumber', 'Phone Number')}</p>
                  <p className="font-medium">{userProfile.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t('profile.memberSince', 'Member Since')}</p>
                  <p className="font-medium">
                    {userProfile.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : '-'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Account Actions */}
            <div className="flex flex-wrap gap-3">
              <Link
                href="/profile/change-password"
                className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded transition-colors"
              >
                {t('auth.changePassword', 'Change Password')}
              </Link>
              
              {userProfile.role === 'Regular' && (
                <Link
                  href="/premium"
                  className="text-sm bg-gradient-to-r from-amber-500 to-amber-600 text-white py-2 px-4 rounded hover:from-amber-600 hover:to-amber-700 transition-colors"
                >
                  {t('common.upgrade', 'Upgrade to Premium')}
                </Link>
              )}
              
              <Link
                href="/settings"
                className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded transition-colors"
              >
                {t('navigation.settings', 'Settings')}
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;