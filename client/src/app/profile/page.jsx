'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
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
import { authApi } from '@/api';

/**
 * User Profile Page
 * Displays and allows editing of user information
 */
const ProfilePage = () => {
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

  // Redirect if user is not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Initialize form data when user is loaded
  useEffect(() => {
    if (user) {
      setFormData({
        given_name: user.given_name || '',
        family_name: user.family_name || '',
        email: user.email || '',
        phone_number: user.phone_number || '',
        country_code: user.country_code || '+84',
      });
    }
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const token = getAuthToken();

      const response = await axios.put(
        `${API_URL}/users/profile`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        toast.success('Profile updated successfully');
        setIsEditing(false);
        // Update user in context
        if (updateUser) {
          updateUser({ ...user, ...formData });
        }
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsSaving(true);
    try {
      const response = await authApi.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
      });

      if (response.data.success) {
        toast.success('Password changed successfully');
        setIsChangingPassword(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      }
    } catch (error) {
      console.error('Failed to change password:', error);
      toast.error(error.response?.data?.error || 'Failed to change password');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        given_name: user.given_name || '',
        family_name: user.family_name || '',
        email: user.email || '',
        phone_number: user.phone_number || '',
        country_code: user.country_code || '+84',
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
      <div className="container mx-auto px-4 py-8 fade-in">
        <div className="mb-8 stagger-item">
          <h1 className="text-3xl font-bold text-foreground">User Profile</h1>
          <p className="mt-2 text-muted-foreground">Manage your account information</p>
        </div>

      {/* Profile Information Card */}
      <Card className="mb-6 stagger-item">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </div>
            <div>
              {!isEditing ? (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 btn-transition slide-in-right"
                >
                  <Edit className="h-4 w-4" />
                  Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2 slide-in-right">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 btn-transition stagger-item"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="flex items-center gap-2 btn-transition stagger-item"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Role Badge */}
          <div className="stagger-item">
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              {user && <UserRoleBadge role={user.role || 'free'} className="ml-2" />}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* First Name */}
            <div className="stagger-item">
              <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
              {isEditing ? (
                <Input
                  value={formData.given_name}
                  onChange={(e) => setFormData({ ...formData, given_name: e.target.value })}
                  placeholder="Enter first name"
                  className="slide-in"
                />
              ) : (
                <p className="text-gray-900">{user.given_name || '-'}</p>
              )}
            </div>

            {/* Last Name */}
            <div className="stagger-item">
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
              {isEditing ? (
                <Input
                  value={formData.family_name}
                  onChange={(e) => setFormData({ ...formData, family_name: e.target.value })}
                  placeholder="Enter last name"
                  className="slide-in"
                />
              ) : (
                <p className="text-gray-900">{user.family_name || '-'}</p>
              )}
            </div>

            {/* Email */}
            <div className="stagger-item">
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              {isEditing ? (
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email"
                  className="slide-in"
                />
              ) : (
                <p className="text-gray-900">{user.email || '-'}</p>
              )}
            </div>

            {/* Phone Number */}
            <div className="stagger-item">
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              {isEditing ? (
                <PhoneInput
                  value={formData.phone_number}
                  countryCode={formData.country_code}
                  onChange={(phone) => setFormData({ ...formData, phone_number: phone })}
                  onCountryChange={(code) => setFormData({ ...formData, country_code: code })}
                  className="slide-in"
                />
              ) : (
                <p className="text-gray-900">
                  {user.country_code && user.phone_number
                    ? `${user.country_code} ${user.phone_number}`
                    : '-'}
                </p>
              )}
            </div>
          </div>

          {/* Account Created Date */}
          <div className="stagger-item">
            <label className="block text-sm font-medium text-gray-700 mb-2">Member Since</label>
            <p className="text-gray-900">
              {user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }) : '-'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Password Change Card */}
      <Card className="stagger-item">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Password
              </CardTitle>
              <CardDescription>Update your password</CardDescription>
            </div>
            <div>
              {!isChangingPassword && (
                <Button
                  variant="outline"
                  onClick={() => setIsChangingPassword(true)}
                  className="btn-transition slide-in-right"
                >
                  Change Password
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        {isChangingPassword && (
          <CardContent className="space-y-4 slide-in">
            <div className="stagger-item">
              <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
              <Input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                placeholder="Enter current password"
                className="slide-in"
              />
            </div>

            <div className="stagger-item">
              <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
              <Input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                placeholder="Enter new password"
                className="slide-in"
              />
            </div>

            <div className="stagger-item">
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
              <Input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                placeholder="Confirm new password"
                className="slide-in"
              />
            </div>

            <div className="flex gap-3 pt-4 stagger-item">
              <Button
                onClick={handleChangePassword}
                disabled={isSaving}
                className="flex items-center gap-2 btn-transition slide-in-right"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Lock className="h-4 w-4" />
                )}
                Update Password
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsChangingPassword(false);
                  setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                  });
                }}
                disabled={isSaving}
                className="btn-transition slide-in-right"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
      </div>
  );
};

export default ProfilePage;
