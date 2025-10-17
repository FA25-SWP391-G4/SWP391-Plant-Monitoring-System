'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import MainLayout from '@/components/MainLayout';
import paymentApi from '@/api/paymentApi';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function PaymentReturnContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState('processing'); // 'processing', 'success', 'error'
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Process payment return
  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Get orderId from localStorage
        const pendingOrderId = localStorage.getItem('pendingOrderId');
        
        if (!pendingOrderId) {
          setStatus('error');
          setErrorMessage(t('payment.return.noOrderId', 'No pending payment found'));
          return;
        }
        
        // Check payment status
        const response = await paymentApi.getPaymentStatus(pendingOrderId);
        
        if (response.data && response.data.success) {
          // Payment successful
          setStatus('success');
          setPaymentDetails(response.data.payment);
          
          // Clear the pending order ID
          localStorage.removeItem('pendingOrderId');
          
          // Refresh user to get updated premium status
          await refreshUser();
          
          // Show success toast
          toast({
            title: t('payment.return.successTitle', 'Payment Successful'),
            description: t('payment.return.successMessage', 'Your account has been upgraded to premium!'),
            variant: 'success',
          });
        } else {
          // Payment failed or pending
          setStatus('error');
          setErrorMessage(response.data?.message || t('payment.return.defaultError', 'Payment verification failed'));
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        setStatus('error');
        setErrorMessage(error.message || t('payment.return.defaultError', 'Payment verification failed'));
      }
    };

    verifyPayment();
  }, [t, refreshUser, toast]);

  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };

  const handleRetry = () => {
    router.push('/upgrade');
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-lg mx-auto p-6">
          {status === 'processing' && (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
              <h2 className="text-xl font-semibold mb-2">{t('payment.return.processing.title', 'Processing Payment')}</h2>
              <p className="text-muted-foreground">{t('payment.return.processing.description', 'Please wait while we verify your payment...')}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center py-8">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">{t('payment.return.success.title', 'Payment Successful!')}</h2>
              <p className="mb-6">{t('payment.return.success.description', 'Your account has been upgraded to premium successfully.')}</p>
              
              {paymentDetails && (
                <div className="bg-muted rounded-md p-4 mb-6 text-left">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-muted-foreground">{t('payment.return.orderInfo', 'Order Info')}:</div>
                    <div>{paymentDetails.order_info}</div>
                    <div className="text-muted-foreground">{t('payment.return.amount', 'Amount')}:</div>
                    <div>{new Intl.NumberFormat('vi-VN').format(paymentDetails.amount)} VNĐ</div>
                    <div className="text-muted-foreground">{t('payment.return.date', 'Date')}:</div>
                    <div>{new Date(paymentDetails.created_at).toLocaleString()}</div>
                  </div>
                </div>
              )}
              
              <Button onClick={handleGoToDashboard} size="lg">
                {t('payment.return.goToDashboard', 'Go to Dashboard')}
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center py-8">
              <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">{t('payment.return.error.title', 'Payment Failed')}</h2>
              <p className="mb-6">{errorMessage}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="outline" onClick={handleRetry}>
                  {t('payment.return.tryAgain', 'Try Again')}
                </Button>
                <Button onClick={handleGoToDashboard}>
                  {t('payment.return.goToDashboard', 'Go to Dashboard')}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </MainLayout>
  );
}