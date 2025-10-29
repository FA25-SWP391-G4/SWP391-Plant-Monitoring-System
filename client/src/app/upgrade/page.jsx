'use client'

import MainLayout from '@/components/MainLayout';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import paymentApi from '@/api/paymentApi';
import { Button } from '@/components/ui/Button';
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/Dialog';
import { CheckCircle, Loader2 } from 'lucide-react';

export default function UpgradePage() {
  const Spinner = () => <Loader2 className="h-4 w-4 animate-spin" />;
  const { user, loading } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  
  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);
  
  // Handle plan selection
  const handleSelectPlan = (planType) => {
    // Set plan details based on the selected plan type
    const planDetails = {
      monthly: { 
        amount: 20000, 
        orderInfo: t('premium.plans.monthly', 'Monthly Premium Subscription') 
      },
      annual: { 
        amount: 200000, 
        orderInfo: t('premium.plans.annual', 'Annual Premium Subscription') 
      },
      lifetime: { 
        amount: 399000, 
        orderInfo: t('premium.plans.lifetime', 'Lifetime Premium Access') 
      }
    };
    
    // Set the selected plan and open the dialog
    setSelectedPlan(planDetails[planType]);
    setPaymentDialogOpen(true);
  };
  
  // Process payment with VNPay
  const processPayment = async () => {
    if (!selectedPlan) return;
    
    setIsProcessing(true);
    setPaymentError(null);
    
    try {
      // Create payment data
      const paymentData = {
        amount: selectedPlan.amount,
        orderInfo: selectedPlan.orderInfo,
        orderType: 'premium_upgrade',
        bankCode: '' // Optional, leave empty for bank selection page
      };
      
      // Debug logs for payment tracking
      console.log('[PAYMENT DEBUG] Processing payment with data:', paymentData);
      console.log('[PAYMENT DEBUG] Selected plan:', selectedPlan);
      
      // Call payment API to get VNPay URL
      const response = await paymentApi.createPaymentUrl(paymentData);
      
      console.log('[PAYMENT DEBUG] Payment API response:', response.data);
      
      if (response?.data?.paymentUrl) {
        // Store order ID in localStorage for verification after return
        if (response.data.orderId) {
          localStorage.setItem('pendingOrderId', response.data.orderId);
          console.log('[PAYMENT DEBUG] Stored order ID in localStorage:', response.data.orderId);
        }
        
        // Redirect to VNPay payment page
        console.log('[PAYMENT DEBUG] Redirecting to payment URL:', response.data.paymentUrl);
        window.location.href = response.data.paymentUrl;
      } else {
        console.error('[PAYMENT DEBUG] Invalid response - missing paymentUrl:', response.data);
        throw new Error('Invalid payment response: Missing payment URL');
      }
    } catch (error) {
      console.error('[PAYMENT DEBUG] Payment error:', error);
      console.error('[PAYMENT DEBUG] Error details:', error.response?.data);
      
      setPaymentError(
        error.response?.data?.message || 
        'Failed to process payment. Please try again.'
      );
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Check if the URL contains return parameters from VNPay
  useEffect(() => {
    const checkPaymentReturn = async () => {
      // Check if we have URL parameters indicating a payment return
      if (typeof window !== 'undefined' && window.location.search && window.location.search.includes('vnp_ResponseCode')) {
        console.log('[PAYMENT RETURN] Detected VNPay return parameters');
        const urlParams = new URLSearchParams(window.location.search);
        const responseCode = urlParams.get('vnp_ResponseCode');
        const orderId = urlParams.get('vnp_TxnRef') || localStorage.getItem('pendingOrderId');
        
        console.log('[PAYMENT RETURN] Response code:', responseCode);
        console.log('[PAYMENT RETURN] Order ID:', orderId);
        console.log('[PAYMENT RETURN] All URL params:', Object.fromEntries(urlParams.entries()));
        
        if (responseCode === '00') {
          console.log('[PAYMENT RETURN] Payment successful');
          // Payment successful
          if (orderId) {
            try {
              // Verify payment status with backend
              console.log('[PAYMENT RETURN] Verifying payment status with backend');
              const statusResponse = await paymentApi.getPaymentStatus(orderId);
              console.log('[PAYMENT RETURN] Status response:', statusResponse.data);
              
              if (statusResponse.data.success) {
                // Show success message
                console.log('[PAYMENT RETURN] Backend confirmed payment success');
                alert(t('payment.successMessage', 'Payment successful! Your account has been upgraded.'));
                // Remove pending order ID
                localStorage.removeItem('pendingOrderId');
              } else {
                console.warn('[PAYMENT RETURN] Backend rejected payment success');
                alert(t('payment.pendingMessage', 'Payment is being processed. Your account will be upgraded soon.'));
              }
            } catch (error) {
              console.error('[PAYMENT RETURN] Payment verification error:', error);
              console.error('[PAYMENT RETURN] Error details:', error.response?.data);
              alert(t('payment.verificationError', 'Error verifying payment status. Please contact support if your account is not upgraded.'));
            }
          } else {
            console.error('[PAYMENT RETURN] Missing order ID in return URL and localStorage');
          }
        } else {
          // Payment failed or cancelled
          console.warn('[PAYMENT RETURN] Payment failed or cancelled, code:', responseCode);
          alert(t('payment.failureMessage', 'Payment was not completed. Please try again.'));
        }
        
        // Remove payment params from URL to prevent reprocessing
        console.log('[PAYMENT RETURN] Cleaning URL parameters');
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };
    
    checkPaymentReturn();
  }, [t]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">{t('premium.title', 'Upgrade to Premium')}</h1>
        
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <p className="text-lg mb-4">{t('premium.description', 'Unlock the full potential of your plant monitoring system with our premium plans.')}</p>
          </div>
          <div className="grid grid-cols-1 gap-8">
            {/* Plans row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {/* Free Plan */}
              <div className="bg-card text-card-foreground rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">{t('premium.free.title', 'Basic')}</h2>
                <p className="text-2xl font-bold mb-4">0 ₫</p>
                <p className="text-sm text-muted-foreground mb-4">{t('premium.free.subtitle', 'Current plan')}</p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span>{t('premium.free.feature1', 'Basic plant monitoring')}</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span>{t('premium.free.feature2', 'Up to 5 plants')}</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span>{t('premium.free.feature3', 'Limited sensor history (7 days)')}</span>
                  </li>
                </ul>
                <Button 
                  className="w-full" 
                  variant="outline"
                  disabled
                >
                  {t('premium.currentPlan', 'Current Plan')}
                </Button>
              </div>
            
              {/* Monthly Plan */}
              <div className="bg-card text-card-foreground rounded-lg shadow p-6">
                <h3 className="text-xl font-bold mb-2">{t('premium.monthly.title', 'Monthly')}</h3>
                <div className="text-2xl font-bold mb-2">20.000 ₫ <span className="text-sm font-normal text-muted-foreground">/ {t('premium.month', 'month')}</span></div>
                <p className="text-muted-foreground mb-6">{t('premium.monthly.description', 'Perfect for trying out premium features')}</p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span>{t('premium.features.unlimitedPlants', 'Unlimited plants')}</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span>{t('premium.features.aiAnalysis', 'AI plant health analysis')}</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span>{t('premium.features.customSchedules', 'Custom watering schedules')}</span>
                  </li>
                </ul>
                <Button 
                  className="w-full" 
                  onClick={() => handleSelectPlan('monthly')}
                  disabled={isProcessing}
                >
                  {isProcessing ? <Spinner /> : t('premium.selectPlan', 'Select Plan')}
                </Button>
              </div>

              {/* Annual Plan */}
              <div className="bg-card text-card-foreground rounded-lg shadow p-6 border-2 border-primary relative">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                  {t('premium.recommended', 'Recommended')}
                </div>
                <h3 className="text-xl font-bold mb-2">{t('premium.annual.title', 'Annual')}</h3>
                <div className="text-2xl font-bold mb-1">200.000 ₫ <span className="text-sm font-normal text-muted-foreground">/ {t('premium.year', 'year')}</span></div>
                <div className="text-sm text-green-600 mb-2">{t('premium.annual.savings', 'Save 20%')}</div>
                <p className="text-muted-foreground mb-6">{t('premium.annual.description', 'Our most popular plan')}</p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span>{t('premium.features.unlimitedPlants', 'Unlimited plants')}</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span>{t('premium.features.aiAnalysis', 'AI plant health analysis')}</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span>{t('premium.features.customSchedules', 'Custom watering schedules')}</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span>{t('premium.features.dataExport', 'Data export')}</span>
                  </li>
                </ul>
                <Button 
                  className="w-full" 
                  variant="default"
                  onClick={() => handleSelectPlan('annual')}
                  disabled={isProcessing}
                >
                  {isProcessing ? <Spinner /> : t('premium.selectPlan', 'Select Plan')}
                </Button>
              </div>

              {/* Lifetime Plan */}
              <div className="bg-card text-card-foreground rounded-lg shadow p-6">
                <h3 className="text-xl font-bold mb-2">{t('premium.lifetime.title', 'Lifetime')}</h3>
                <div className="text-2xl font-bold mb-2">399.000 ₫</div>
                <p className="text-muted-foreground mb-6">{t('premium.lifetime.description', 'One-time payment, lifetime access')}</p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span>{t('premium.features.everythingInAnnual', 'Everything in Annual plan')}</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span>{t('premium.features.lifetimeUpdates', 'Lifetime updates')}</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span>{t('premium.features.exclusiveFeatures', 'Exclusive features')}</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span>{t('premium.features.prioritySupport', 'Priority support')}</span>
                  </li>
                </ul>
                <Button 
                  className="w-full"
                  onClick={() => handleSelectPlan('lifetime')}
                  disabled={isProcessing}
                >
                  {isProcessing ? <Spinner /> : t('premium.selectPlan', 'Select Plan')}
                </Button>
              </div>
            </div>
          </div>
          
          {/* FAQ Section */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-6">{t('premium.faq.title', 'Frequently Asked Questions')}</h2>
            <div className="space-y-4">
              <div className="border-b pb-4">
                <h3 className="text-lg font-medium mb-2">{t('premium.faq.q1', 'How do payments work?')}</h3>
                <p className="text-muted-foreground">{t('premium.faq.a1', 'We process payments securely through VNPay. You will be redirected to their platform to complete your transaction, and upon successful payment, your account will be upgraded instantly.')}</p>
              </div>
              <div className="border-b pb-4">
                <h3 className="text-lg font-medium mb-2">{t('premium.faq.q2', 'Can I cancel my subscription?')}</h3>
                <p className="text-muted-foreground">{t('premium.faq.a2', 'Yes, you can cancel your subscription at any time. Your premium features will remain active until the end of your current billing period.')}</p>
              </div>
              <div className="border-b pb-4">
                <h3 className="text-lg font-medium mb-2">{t('premium.faq.q3', 'What payment methods are supported?')}</h3>
                <p className="text-muted-foreground">{t('premium.faq.a3', 'We support all payment methods available through VNPay, including credit/debit cards, bank transfers, and e-wallets.')}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Payment Dialog */}
        <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('premium.payment.title', 'Confirm Subscription')}</DialogTitle>
              <DialogDescription>
                {selectedPlan && (
                  <div className="py-4">
                    <p className="mb-2">{t('premium.payment.description', 'You are about to subscribe to the following plan:')}</p>
                    <div className="bg-muted p-4 rounded-md my-4">
                      <div className="font-medium mb-1">{selectedPlan.orderInfo}</div>
                      <div className="text-sm text-muted-foreground">
                        {t('premium.payment.price', 'Price: {{price}}', { price: `${selectedPlan.amount.toLocaleString()} VNĐ` })}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{t('premium.payment.redirectNotice', 'You will be redirected to VNPay to complete your payment securely.')}</p>
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>
            {paymentError && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-md my-2">
                {paymentError}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setPaymentDialogOpen(false)} disabled={isProcessing}>
                {t('premium.payment.cancel', 'Cancel')}
              </Button>
              <Button onClick={processPayment} disabled={isProcessing}>
                {isProcessing ? (
                  <div className="flex items-center">
                    <Spinner className="mr-2" /> {t('premium.payment.processing', 'Processing...')}
                  </div>
                ) : (
                  t('premium.payment.confirm', 'Proceed to Payment')
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}