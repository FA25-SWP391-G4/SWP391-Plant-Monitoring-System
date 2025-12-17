'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import MainLayout from '@/components/MainLayout';
import paymentApi from '@/api/paymentApi';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { XCircle, AlertTriangle, RefreshCw, ArrowLeft, HelpCircle, Phone, Mail } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function PaymentFailedPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get URL parameters
  const orderId = searchParams.get('orderId');
  const error = searchParams.get('error');
  const amount = searchParams.get('amount');

  // Load payment details if available
  useEffect(() => {
    const loadPaymentDetails = async () => {
      try {
        if (orderId) {
          const response = await paymentApi.getPaymentStatus(orderId);
          if (response.data && response.data.payment) {
            setPaymentDetails(response.data.payment);
          }
        }
        
        // Set error details based on error parameter
        if (error) {
          setErrorDetails(getErrorDetails(error));
        }
      } catch (err) {
        console.error('Error loading payment details:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadPaymentDetails();
  }, [orderId, error]);

  // Map error codes to user-friendly messages
  const getErrorDetails = (errorCode) => {
    const errorMap = {
      'invalid_signature': {
        title: t('payment.failed.errors.invalidSignature.title', 'Security Error'),
        description: t('payment.failed.errors.invalidSignature.description', 'The payment verification failed due to a security issue. Please try again.'),
        icon: AlertTriangle,
        severity: 'high'
      },
      'system_error': {
        title: t('payment.failed.errors.systemError.title', 'System Error'),
        description: t('payment.failed.errors.systemError.description', 'A technical error occurred while processing your payment. Our team has been notified.'),
        icon: XCircle,
        severity: 'high'
      },
      'cancelled': {
        title: t('payment.failed.errors.cancelled.title', 'Payment Cancelled'),
        description: t('payment.failed.errors.cancelled.description', 'You cancelled the payment process. You can try again anytime.'),
        icon: XCircle,
        severity: 'low'
      },
      'insufficient_funds': {
        title: t('payment.failed.errors.insufficientFunds.title', 'Insufficient Funds'),
        description: t('payment.failed.errors.insufficientFunds.description', 'Your account does not have sufficient funds for this transaction.'),
        icon: XCircle,
        severity: 'medium'
      },
      'expired': {
        title: t('payment.failed.errors.expired.title', 'Payment Expired'),
        description: t('payment.failed.errors.expired.description', 'The payment session has expired. Please start a new payment.'),
        icon: XCircle,
        severity: 'medium'
      },
      'bank_error': {
        title: t('payment.failed.errors.bankError.title', 'Bank Error'),
        description: t('payment.failed.errors.bankError.description', 'There was an issue with your bank or payment method. Please try a different payment method.'),
        icon: XCircle,
        severity: 'medium'
      }
    };

    return errorMap[errorCode] || {
      title: t('payment.failed.errors.unknown.title', 'Payment Failed'),
      description: t('payment.failed.errors.unknown.description', 'Your payment could not be processed. Please try again or contact support.'),
      icon: XCircle,
      severity: 'medium'
    };
  };

  const handleRetryPayment = () => {
    router.push('/premium');
  };

  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };

  const handleContactSupport = () => {
    // You can implement this to open a support modal or redirect to support page
    toast({
      title: t('payment.failed.support.title', 'Contact Support'),
      description: t('payment.failed.support.description', 'Please email us at support@plantmonitor.com or call our hotline.'),
      variant: 'info',
    });
  };

  const handleGoBack = () => {
    router.back();
  };

  if (isLoading) {
    return (
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto p-8">
            <div className="text-center py-12">
              <RefreshCw className="h-16 w-16 animate-spin mx-auto mb-6 text-muted-foreground" />
              <h2 className="text-2xl font-semibold mb-4">
                {t('payment.failed.loading.title', 'Loading...')}
              </h2>
              <p className="text-muted-foreground">
                {t('payment.failed.loading.description', 'Please wait while we load your payment information.')}
              </p>
            </div>
          </Card>
        </div>
    );
  }

  const ErrorIcon = errorDetails?.icon || XCircle;
  const isHighSeverity = errorDetails?.severity === 'high';
  const isLowSeverity = errorDetails?.severity === 'low';

  return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto p-8">
          <div className="text-center">
            {/* Error Header */}
            <div className="mb-8">
              <ErrorIcon className={`h-20 w-20 mx-auto mb-6 ${
                isHighSeverity ? 'text-red-500' : 
                isLowSeverity ? 'text-yellow-500' : 'text-orange-500'
              }`} />
              <h1 className="text-3xl font-bold text-destructive mb-2">
                {errorDetails?.title || t('payment.failed.title', 'Payment Failed')}
              </h1>
              <p className="text-lg text-muted-foreground">
                {errorDetails?.description || t('payment.failed.description', 'We were unable to process your payment. Please try again.')}
              </p>
            </div>

            {/* Payment Details (if available) */}
            {paymentDetails && (
              <div className="bg-muted rounded-lg p-6 mb-8 text-left">
                <h3 className="font-semibold mb-4 text-center">
                  {t('payment.failed.details.title', 'Payment Information')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {t('payment.failed.details.orderId', 'Order ID')}:
                      </span>
                      <span className="font-mono">{paymentDetails.order_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {t('payment.failed.details.amount', 'Amount')}:
                      </span>
                      <span>
                        {paymentDetails.formatted_amount || new Intl.NumberFormat('vi-VN').format(paymentDetails.amount)} VNĐ
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {t('payment.failed.details.date', 'Date')}:
                      </span>
                      <span>{new Date(paymentDetails.created_at).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {t('payment.failed.details.status', 'Status')}:
                      </span>
                      <span className="text-destructive font-semibold">
                        {t('payment.failed.details.statusValue', 'Failed')}
                      </span>
                    </div>
                  </div>
                </div>
                {paymentDetails.status_message && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
                    <span className="font-medium">
                      {t('payment.failed.details.reason', 'Reason')}: 
                    </span>
                    {paymentDetails.status_message}
                  </div>
                )}
              </div>
            )}

            {/* What went wrong section */}
            <div className="bg-blue-50 rounded-lg p-6 mb-8 text-left">
              <div className="flex items-center mb-4">
                <HelpCircle className="h-6 w-6 text-blue-600 mr-3" />
                <h3 className="text-lg font-semibold text-blue-900">
                  {t('payment.failed.troubleshoot.title', 'What can you do?')}
                </h3>
              </div>
              <ul className="space-y-3 text-sm text-blue-800">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                  <span>{t('payment.failed.troubleshoot.step1', 'Check your internet connection and try again')}</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                  <span>{t('payment.failed.troubleshoot.step2', 'Verify your payment method has sufficient funds')}</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                  <span>{t('payment.failed.troubleshoot.step3', 'Try using a different payment method')}</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                  <span>{t('payment.failed.troubleshoot.step4', 'Contact our support team if the problem persists')}</span>
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              {/* Primary Actions */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={handleRetryPayment} size="lg" className="min-w-[200px]">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {t('payment.failed.actions.retry', 'Try Again')}
                </Button>
                <Button variant="outline" onClick={handleGoToDashboard} size="lg" className="min-w-[200px]">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t('payment.failed.actions.dashboard', 'Go to Dashboard')}
                </Button>
              </div>

              {/* Secondary Actions */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="ghost" onClick={handleContactSupport} size="sm">
                  <Mail className="h-4 w-4 mr-2" />
                  {t('payment.failed.actions.support', 'Contact Support')}
                </Button>
                <Button variant="ghost" onClick={handleGoBack} size="sm">
                  {t('payment.failed.actions.back', 'Go Back')}
                </Button>
              </div>
            </div>

            {/* Support Information */}
            <div className="mt-8 pt-6 border-t border-muted">
              <p className="text-sm text-muted-foreground mb-2">
                {t('payment.failed.support.needHelp', 'Need help? Contact our support team:')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm">
                <div className="flex items-center justify-center">
                  <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>support@plantmonitor.com</span>
                </div>
                <div className="flex items-center justify-center">
                  <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>+84 123 456 789</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
  );
}