'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import Cookies from 'js-cookie';
import MainLayout from '@/components/MainLayout';
import paymentApi from '@/api/paymentApi';
import authApi from '@/api/authApi';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CheckCircle2, Loader2, Gift, Crown, Star } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function PaymentSuccessPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, login } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [isUpgradeProcessing, setIsUpgradeProcessing] = useState(true);

  // Get URL parameters
  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');
  const newToken = searchParams.get('token');

  // Verify payment and update user status
  useEffect(() => {
    const verifyPaymentSuccess = async () => {
      try {
        if (!orderId) {
          setStatus('error');
          setIsUpgradeProcessing(false);
          return;
        }

        // Get payment details from API
        const response = await paymentApi.getPaymentStatus(orderId);
        
        if (response.data && response.data.success) {
          setPaymentDetails(response.data.payment);
          setStatus('success');
          
          // If we have a new token from the payment controller, use it directly
          if (newToken) {
            try {
              // Use the new token and refresh user data
              const refreshResponse = await authApi.refreshToken();
              if (refreshResponse.data && refreshResponse.data.success) {
                // Update the user data and token in the auth context
                login(refreshResponse.data.token, refreshResponse.data.user);
                console.log('[PAYMENT SUCCESS] Updated user session with refreshed token and data');
              } else {
                // If refresh fails, use the provided token
                login(newToken, user);
                console.log('[PAYMENT SUCCESS] Used provided token from payment controller');
              }
            } catch (refreshError) {
              console.warn('Failed to refresh token via API, using provided token:', refreshError);
              // Fallback to using the provided token
              login(newToken, user);
            }
          } else {
            // No new token provided, refresh user data with existing token
            try {
              const refreshResponse = await authApi.refreshToken();
              if (refreshResponse.data && refreshResponse.data.success) {
                // Update the user data and token in the auth context
                login(refreshResponse.data.token, refreshResponse.data.user);
                console.log('[PAYMENT SUCCESS] Refreshed user session with updated data');
              }
            } catch (refreshError) {
              console.warn('Failed to refresh user data via API:', refreshError);
              // Don't fail the whole process if user refresh fails
            }
          }
          
          // Show success toast
          toast({
            title: t('payment.success.toast.title', 'Payment Successful!'),
            description: t('payment.success.toast.description', 'Welcome to Premium! Your account has been upgraded.'),
            variant: 'success',
          });
        } else {
          setStatus('error');
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        setStatus('error');
      } finally {
        setIsUpgradeProcessing(false);
      }
    };

    verifyPaymentSuccess();
  }, [orderId, newToken, user, login, toast, t]);

  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };

  const handleExplorePremiumFeatures = () => {
    router.push('/premium-features');
  };

  const isPremiumUpgrade = paymentDetails?.order_info?.toLowerCase().includes('premium');
  const isUltimateUpgrade = paymentDetails?.order_info?.toLowerCase().includes('ultimate');

  return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto p-8">
          {status === 'verifying' && (
            <div className="text-center py-12">
              <Loader2 className="h-16 w-16 animate-spin mx-auto mb-6 text-primary" />
              <h2 className="text-2xl font-semibold mb-4">
                {t('payment.success.verifying.title', 'Verifying Payment...')}
              </h2>
              <p className="text-muted-foreground">
                {t('payment.success.verifying.description', 'Please wait while we confirm your payment and upgrade your account.')}
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              {/* Success Header */}
              <div className="mb-8">
                <div className="relative mb-6">
                  <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto" />
                  {isUltimateUpgrade && (
                    <Crown className="h-8 w-8 text-yellow-500 absolute -top-2 -right-2" />
                  )}
                  {isPremiumUpgrade && (
                    <Star className="h-8 w-8 text-blue-500 absolute -top-2 -right-2" />
                  )}
                </div>
                <h1 className="text-3xl font-bold text-green-600 mb-2">
                  {t('payment.success.title', 'Payment Successful!')}
                </h1>
                <p className="text-lg text-muted-foreground">
                  {isUltimateUpgrade && t('payment.success.ultimate.subtitle', 'Welcome to Ultimate! You now have access to all premium features.')}
                  {isPremiumUpgrade && t('payment.success.premium.subtitle', 'Welcome to Premium! You now have access to advanced features.')}
                  {!isPremiumUpgrade && !isUltimateUpgrade && t('payment.success.general.subtitle', 'Your account has been successfully upgraded.')}
                </p>
              </div>

              {/* Payment Details */}
              {paymentDetails && (
                <div className="bg-muted rounded-lg p-6 mb-8 text-left">
                  <h3 className="font-semibold mb-4 text-center">
                    {t('payment.success.details.title', 'Payment Details')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          {t('payment.success.details.orderId', 'Order ID')}:
                        </span>
                        <span className="font-mono">{paymentDetails.order_id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          {t('payment.success.details.amount', 'Amount')}:
                        </span>
                        <span className="font-semibold text-green-600">
                          {paymentDetails.formatted_amount || new Intl.NumberFormat('vi-VN').format(paymentDetails.amount)} VNĐ
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          {t('payment.success.details.date', 'Date')}:
                        </span>
                        <span>{new Date(paymentDetails.pay_date || paymentDetails.created_at).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          {t('payment.success.details.status', 'Status')}:
                        </span>
                        <span className="text-green-600 font-semibold">
                          {t('payment.success.details.statusValue', 'Completed')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* User Status Update */}
              {!isUpgradeProcessing && (
                <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6 mb-8">
                  <div className="flex items-center justify-center mb-4">
                    <Gift className="h-8 w-8 text-primary mr-3" />
                    <h3 className="text-xl font-semibold">
                      {t('payment.success.upgrade.title', 'Account Upgraded!')}
                    </h3>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    {isUltimateUpgrade && t('payment.success.upgrade.ultimate', 'You now have access to all Ultimate features including unlimited plants, advanced AI predictions, and priority support.')}
                    {isPremiumUpgrade && t('payment.success.upgrade.premium', 'You now have access to Premium features including advanced monitoring, AI predictions, and enhanced analytics.')}
                    {!isPremiumUpgrade && !isUltimateUpgrade && t('payment.success.upgrade.general', 'Your account has been upgraded with new features and capabilities.')}
                  </p>
                  
                  {/* Feature highlights */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                        <span>{t('payment.success.features.monitoring', 'Advanced Plant Monitoring')}</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                        <span>{t('payment.success.features.ai', 'AI Health Predictions')}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                        <span>{t('payment.success.features.analytics', 'Enhanced Analytics')}</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                        <span>{t('payment.success.features.support', 'Priority Support')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={handleGoToDashboard} size="lg" className="min-w-[200px]">
                  {t('payment.success.actions.dashboard', 'Go to Dashboard')}
                </Button>
                <Button variant="outline" onClick={handleExplorePremiumFeatures} size="lg" className="min-w-[200px]">
                  {t('payment.success.actions.explore', 'Explore Premium Features')}
                </Button>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center py-12">
              <CheckCircle2 className="h-16 w-16 text-yellow-500 mx-auto mb-6" />
              <h2 className="text-2xl font-bold mb-4">
                {t('payment.success.error.title', 'Payment Received')}
              </h2>
              <p className="text-muted-foreground mb-6">
                {t('payment.success.error.description', 'Your payment was received, but we\'re still processing your account upgrade. Please check back in a few minutes.')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={handleGoToDashboard} size="lg">
                  {t('payment.success.error.dashboard', 'Go to Dashboard')}
                </Button>
                <Button variant="outline" onClick={() => window.location.reload()} size="lg">
                  {t('payment.success.error.refresh', 'Refresh Page')}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
  );
}