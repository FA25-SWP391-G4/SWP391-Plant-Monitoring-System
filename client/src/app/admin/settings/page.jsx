'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, RefreshCw, Settings, Shield, Globe, Database } from 'lucide-react';
import { toast } from 'sonner';
import axiosClient from '@/api/axiosClient';

export default function AdminSettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [languages, setLanguages] = useState({});

  useEffect(() => {
    if (!loading && user && user.role !== 'Admin' && user.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && (user.role === 'Admin' || user.role === 'ADMIN')) {
      fetchSettings();
      fetchLanguageSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const response = await axiosClient.get('/api/admin/settings');
      setSettings(response.data.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLanguageSettings = async () => {
    try {
      const response = await axiosClient.get('/api/admin/languages');
      setLanguages(response.data.data);
    } catch (error) {
      console.error('Error fetching language settings:', error);
    }
  };

  const handleSaveSettings = async (category) => {
    try {
      setIsSaving(true);
      
      const settingsToUpdate = settings[category]?.map(setting => ({
        key: setting.key,
        value: setting.value,
        data_type: setting.data_type
      })) || [];

      await axiosClient.put('/api/admin/settings', {
        settings: settingsToUpdate
      });

      toast.success(`${category} settings saved successfully`);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSettingChange = (category, index, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: prev[category]?.map((setting, i) =>
        i === index ? { ...setting, value } : setting
      ) || []
    }));
  };

  const handleLanguageSettingsUpdate = async (data) => {
    try {
      setIsSaving(true);
      await axiosClient.put('/api/admin/languages', data);
      toast.success('Language settings updated successfully');
      fetchLanguageSettings();
    } catch (error) {
      console.error('Error updating language settings:', error);
      toast.error('Failed to update language settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!user || (user.role !== 'Admin' && user.role !== 'ADMIN')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Access Denied</CardTitle>
            <CardDescription>You do not have permission to access this page.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const renderSettingsCategory = (category, icon) => {
    const Icon = icon;
    const categorySettings = settings[category] || [];
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Icon className="w-5 h-5 mr-2" />
            {category.charAt(0).toUpperCase() + category.slice(1)} Settings
          </CardTitle>
          <CardDescription>
            Configure {category} related settings and parameters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {categorySettings.map((setting, index) => (
            <div key={setting.key} className="space-y-2">
              <Label htmlFor={setting.key}>
                {setting.key.split('.')[1]?.replace(/_/g, ' ').toUpperCase() || setting.key}
              </Label>
              <p className="text-sm text-gray-500">{setting.description}</p>
              
              {setting.data_type === 'boolean' ? (
                <Switch
                  id={setting.key}
                  checked={setting.value}
                  onCheckedChange={(value) => handleSettingChange(category, index, value)}
                />
              ) : setting.data_type === 'number' ? (
                <Input
                  id={setting.key}
                  type="number"
                  value={setting.value}
                  onChange={(e) => handleSettingChange(category, index, parseFloat(e.target.value) || 0)}
                />
              ) : (
                <Input
                  id={setting.key}
                  value={setting.value}
                  onChange={(e) => handleSettingChange(category, index, e.target.value)}
                />
              )}
            </div>
          ))}
          
          <Button 
            onClick={() => handleSaveSettings(category)}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save {category} Settings
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
          <p className="mt-2 text-gray-600">
            Configure global system settings and parameters
          </p>
        </div>
        <Button variant="outline" onClick={fetchSettings}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="system" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
          <TabsTrigger value="language">Language</TabsTrigger>
        </TabsList>

        <TabsContent value="system" className="space-y-6">
          {renderSettingsCategory('system', Settings)}
          
          {/* Additional system settings */}
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
              <CardDescription>Current system status and version information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>System Version</Label>
                  <p className="text-sm text-gray-600">
                    {settings.system?.find(s => s.key === 'system.version')?.value || '1.0.0'}
                  </p>
                </div>
                <div>
                  <Label>Maintenance Mode</Label>
                  <p className="text-sm text-gray-600">
                    {settings.system?.find(s => s.key === 'system.maintenance_mode')?.value ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          {renderSettingsCategory('security', Shield)}
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          {renderSettingsCategory('notifications', Settings)}
        </TabsContent>

        <TabsContent value="payment" className="space-y-6">
          {renderSettingsCategory('payment', Database)}
        </TabsContent>

        <TabsContent value="language" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="w-5 h-5 mr-2" />
                Language Settings
              </CardTitle>
              <CardDescription>
                Manage system languages and translations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Default Language</Label>
                  <Input
                    value={languages.defaultLanguage || 'en'}
                    onChange={(e) => setLanguages(prev => ({
                      ...prev,
                      defaultLanguage: e.target.value
                    }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Available Languages</Label>
                  <Input
                    value={languages.availableLanguages?.join(', ') || 'en'}
                    onChange={(e) => setLanguages(prev => ({
                      ...prev,
                      availableLanguages: e.target.value.split(', ').map(l => l.trim())
                    }))}
                    placeholder="en, vi, fr, es"
                  />
                </div>
              </div>

              {/* Language Usage Statistics */}
              {languages.languageUsage && languages.languageUsage.length > 0 && (
                <div>
                  <Label>Language Usage Statistics</Label>
                  <div className="mt-2 space-y-2">
                    {languages.languageUsage.map((usage, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm">{usage.language_preference || 'Not set'}</span>
                        <span className="text-sm font-medium">{usage.user_count} users</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Translation Status */}
              {languages.translationStatus && (
                <div>
                  <Label>Translation Status</Label>
                  <div className="mt-2 space-y-2">
                    {languages.translationStatus.map((status, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm">{status.language}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">{status.keyCount} keys</span>
                          <div className={`w-2 h-2 rounded-full ${status.complete ? 'bg-green-500' : 'bg-red-500'}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button
                onClick={() => handleLanguageSettingsUpdate({
                  defaultLanguage: languages.defaultLanguage,
                  availableLanguages: languages.availableLanguages
                })}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Language Settings
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}