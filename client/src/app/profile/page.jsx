'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import PhoneInput from '@/components/forms/PhoneInput';
import { toast } from 'sonner';
import { Loader2, Edit, Save, X, Lock, User as UserIcon } from 'lucide-react';
import axios from 'axios';
import { getAuthToken } from '@/utils/auth';
import { useTheme } from '@/contexts/ThemeContext';
import UserRoleBadge from '@/components/shared/UserRoleBadge';
import { authApi, userApi } from '@/api';
import { useTranslation } from 'react-i18next';
import { parsePhoneNumber, combinePhoneNumber } from '@/utils/phoneUtils';

/**
 * User Profile Page
 * Displays and allows editing of user information
 */
const ProfilePage = () => {
  const { t, i18n } = useTranslation();
  const { user, loading: isLoading, updateUser } = useAuth();
  const router = useRouter();
  const { isDark, isLight, getThemeColor } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [formData, setFormData] = useState({
    given_name: '',
    family_name: '',
    email: '',
    phone_number: '',
    country_code: '+84',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const localeMap = {
      'en': 'en-US',
      'vi': 'vi-VN', 
      'es': 'es-ES',
      'fr': 'fr-FR',
      'ja': 'ja-JP',
      'kr': 'ko-KR',
      'zh': 'zh-CN'
    };
    
  const locale = localeMap[i18n.language] || 'en-US';
 

  // Redirect if user is not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Initialize form data when user is loaded
  useEffect(() => {
    if (user) {
      // Parse phone number using utility function
      const { phoneNumber, countryCode } = parsePhoneNumber(user.phone_number, '+84');
      
      setFormData({
        given_name: user.given_name || '',
        family_name: user.family_name || '',
        email: user.email || '',
        phone_number: phoneNumber,
        country_code: countryCode,
      });
    }
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      console.log('Sending profile update:', {
        given_name: formData.given_name,
        family_name: formData.family_name,
        email: formData.email,
        phone_number: combinePhoneNumber(formData.country_code, formData.phone_number)
      });
      
      const response = await userApi.updateProfile({
        given_name: formData.given_name,
        family_name: formData.family_name,
        email: formData.email,
        phone_number: combinePhoneNumber(formData.country_code, formData.phone_number)
      });

      console.log('Profile update response:', response);

      if (response.success) {
        toast.success(t('profile.profileUpdated'));
        setIsEditing(false);
        // Update user in context with the returned data from server
        if (updateUser && response.data) {
          updateUser({ ...user, ...response.data });
        }
      } else {
        toast.error(response.error || t('profile.updateProfileError'));
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      console.error('Error details:', error.response?.data);
      const errorMessage = error.response?.data?.error || error.message || t('profile.updateProfileError');
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error(t('profile.passwordsDoNotMatch'));
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error(t('profile.passwordTooShort'));
      return;
    }

    setIsSaving(true);
    try {
      console.log('Sending password change request...');
      
      const response = await authApi.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
      });

      console.log('Password change response:', response);

      if (response.success) {
        toast.success(t('profile.passwordChanged'));
        setIsChangingPassword(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      }
    } catch (error) {
      console.error('Failed to change password:', error);
      toast.error(error.response?.data?.error || t('profile.changePasswordError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      // Parse phone number using utility function
      const { phoneNumber, countryCode } = parsePhoneNumber(user.phone_number, '+84');
      
      setFormData({
        given_name: user.given_name || '',
        family_name: user.family_name || '',
        email: user.email || '',
        phone_number: phoneNumber,
        country_code: countryCode,
      });
    }
    setIsEditing(false);
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin" 
                 style={{ color: getThemeColor('#16a34a', '#22c55e') }} />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-700 dark:from-emerald-600 dark:to-emerald-800 rounded-xl shadow-lg mb-8 p-6 text-white flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-lg">
              <UserIcon className="h-8 w-8" />
            </div>
            
            <div>
              <h1 className="text-2xl font-bold mb-2">
                {t('profile.title')}
              </h1>
              <p className="opacity-90">
                {t('profile.subtitle')}
              </p>
            </div>
          </div>
        </div>

      {/* Profile Information Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                {t('profile.information')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">{t('profile.informationDesc')}</p>
            </div>
            <div>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  {t('profile.editProfile')}
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {t('profile.save')}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                    {t('profile.cancel')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="p-6 space-y-6">
          {/* Role Badge */}
          <div className="">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('profile.role')}</label>
              {user && <UserRoleBadge role={user.role || 'free'} className="ml-2" />}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* First Name */}
            <div className="">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('profile.firstName')}</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.given_name}
                  onChange={(e) => setFormData({ ...formData, given_name: e.target.value })}
                  placeholder={t('profile.enterFirstName')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              ) : (
                <p className="text-gray-900 dark:text-white">{user.given_name || '-'}</p>
              )}
            </div>

            {/* Last Name */}
            <div className="">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('profile.lastName')}</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.family_name}
                  onChange={(e) => setFormData({ ...formData, family_name: e.target.value })}
                  placeholder={t('profile.enterLastName')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              ) : (
                <p className="text-gray-900 dark:text-white">{user.family_name || '-'}</p>
              )}
            </div>

            {/* Email */}
            <div className="">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('profile.email')}</label>
              {isEditing ? (
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={t('profile.enterEmail')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              ) : (
                <p className="text-gray-900 dark:text-white">{user.email || '-'}</p>
              )}
            </div>

            {/* Phone Number */}
          <div className="">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('profile.phoneNumber')}</label>
            {isEditing ? (
            <PhoneInput
              value={formData.phone_number}
              countryCode={formData.country_code}
              onChange={(phone) => setFormData({ ...formData, phone_number: phone })}
              onCountryChange={(code) => setFormData({ ...formData, country_code: code })}
              className=""
            />
            ) : (
            <p className="text-gray-900 dark:text-white">
              {user.phone_number ? 
              (() => {
                const phoneMatch = user.phone_number.match(/^(\+\d+)(\d{9})$/);
                if (phoneMatch) {
                const [, countryCode, number] = phoneMatch;
                const formatted = `${number.slice(0, 3)}-${number.slice(3, 6)}-${number.slice(6)}`;
                return `${countryCode}${formatted}`;
                }
                return user.phone_number;
              })()
              : '-'
              }
            </p>
            )}
          </div>
          </div>

          {/* Account Created Date */}
          <div className="">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('profile.memberSince')}</label>
            <p className="text-gray-900 dark:text-white">
              {user.created_at ? new Date(user.created_at).toLocaleDateString(locale, {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }) : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Password Change Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                <Lock className="h-5 w-5" />
                {t('profile.password', 'Password')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">{t('profile.passwordDesc')}</p>
            </div>
            <div>
              {!isChangingPassword && (
                <button
                  onClick={() => setIsChangingPassword(true)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  {t('profile.changePassword', 'Change Password')}
                </button>
              )}
            </div>
          </div>
        </div>
        {isChangingPassword && (
          <div className="p-6 space-y-4">
            <div className="">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('profile.currentPassword')}</label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                placeholder={t('profile.enterCurrentPassword')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('profile.newPassword')}</label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                placeholder={t('profile.enterNewPassword')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('profile.confirmNewPassword')}</label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                placeholder={t('profile.confirmNewPassword')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="flex gap-3 pt-4 stagger-item">
              <button
                onClick={handleChangePassword}
                disabled={isSaving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Lock className="h-4 w-4" />
                )}
                {t('profile.updatePassword')}
              </button>
              <button
                onClick={() => {
                  setIsChangingPassword(false);
                  setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                  });
                }}
                disabled={isSaving}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {t('profile.cancel', 'Cancel')}
              </button>
            </div>
          </div>
        )}
      </div>
      </main>
      </div>
  );
};

export default ProfilePage;
