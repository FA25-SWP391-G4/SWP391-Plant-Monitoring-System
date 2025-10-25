'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import paymentApi from '@/api/paymentApi'
import { useAuth } from '@/providers/AuthProvider'

// Loading component for Suspense fallback
function PaymentResultLoading() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto bg-gradient-to-b from-white to-emerald-50 rounded-xl shadow-lg overflow-hidden md:max-w-2xl border border-emerald-100">
        <div className="p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-500"></div>
          </div>
          <h1 className="text-2xl font-bold text-emerald-800 mb-4">
            Processing Payment
          </h1>
          <p className="text-gray-700 mb-6">
            Please wait while we verify your payment...
          </p>
        </div>
      </div>
    </div>
  );
}

// Client component that uses searchParams
function PaymentResultClient() {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { updateUser } = useAuth()
  
  // Extract parameters from URL
  const [paymentStatus, setPaymentStatus] = useState({
    isSuccess: false,
    isLoading: true,
    code: searchParams.get('code'),
    orderId: searchParams.get('orderId'),
    amount: searchParams.get('amount'),
    message: searchParams.get('message') || 'Processing payment result...',
    statusCode: searchParams.get('status')
  })
  
  // Counter for auto-redirect
  const [redirectCounter, setRedirectCounter] = useState(5)

  // Verify payment status on component mount
  useEffect(() => {
    const verifyPayment = async () => {
      if (!paymentStatus.orderId) {
        setPaymentStatus(prev => ({
          ...prev,
          isLoading: false,
          message: t('payment.noOrderId', 'No order ID found in payment response')
        }))
        return
      }

      try {
        // Verify payment status with backend
        const response = await paymentApi.getPaymentStatus(paymentStatus.orderId)
        
        if (response.data.success) {
          // If payment was successful, update user status
          if (response.data.status === 'completed') {
            setPaymentStatus(prev => ({
              ...prev,
              isSuccess: true,
              isLoading: false,
              message: t('payment.successVerified', 'Payment successfully verified! Your account has been upgraded.')
            }))
            
            // Update user data to reflect premium status
            updateUser()
          } else {
            setPaymentStatus(prev => ({
              ...prev,
              isLoading: false,
              message: t('payment.statusMessage', 'Payment status: {{status}}', { status: response.data.status })
            }))
          }
        } else {
          setPaymentStatus(prev => ({
            ...prev,
            isLoading: false,
            message: response.data.message || t('payment.verificationFailed', 'Payment verification failed')
          }))
        }
      } catch (error) {
        console.error('Payment verification error:', error)
        setPaymentStatus(prev => ({
          ...prev,
          isLoading: false,
          message: t('payment.errorVerifying', 'Error verifying payment. Please contact support.')
        }))
      }
    }

    verifyPayment()
  }, [paymentStatus.orderId, t, updateUser])
  
  // Auto-redirect countdown effect
  useEffect(() => {
    // Only start countdown for successful payments
    if ((paymentStatus.isSuccess || paymentStatus.code === '00') && !paymentStatus.isLoading) {
      const timer = setInterval(() => {
        setRedirectCounter((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            // Redirect to dashboard when counter reaches zero
            router.push('/dashboard');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [paymentStatus.isSuccess, paymentStatus.code, paymentStatus.isLoading, router])

  // Determine which icon to show based on payment status
  const getStatusIcon = () => {
    if (paymentStatus.isLoading) {
      return (
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-500"></div>
      )
    } else if (paymentStatus.isSuccess || paymentStatus.code === '00') {
      return (
        <div className="bg-emerald-100 rounded-full p-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )
    } else {
      return (
        <div className="bg-red-100 rounded-full p-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      )
    }
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto bg-gradient-to-b from-white to-emerald-50 rounded-xl shadow-lg overflow-hidden md:max-w-2xl border border-emerald-100">
        <div className="p-8 text-center">
          {/* Status Icon */}
          <div className="flex justify-center mb-6">
            {getStatusIcon()}
          </div>
          
          {/* Title */}
          <h1 className="text-2xl font-bold text-emerald-800 mb-4">
            {paymentStatus.isSuccess || paymentStatus.code === '00'
              ? t('payment.paymentSuccessful', 'Payment Successful!')
              : t('payment.paymentStatus', 'Payment Status')}
          </h1>
          
          {/* Message */}
          <p className="text-gray-700 mb-6">
            {paymentStatus.message}
          </p>
          
          {/* Auto-redirect message for successful payments */}
          {(paymentStatus.isSuccess || paymentStatus.code === '00') && !paymentStatus.isLoading && (
            <div className="mb-6 bg-emerald-100 p-3 rounded-lg text-sm">
              <p className="text-emerald-700">
                {t('payment.redirectCountdown', 'Redirecting to dashboard in {{seconds}} seconds...', 
                   { seconds: redirectCounter })}
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div 
                  className="bg-emerald-500 h-2.5 rounded-full transition-all duration-1000" 
                  style={{ width: `${(redirectCounter / 5) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
          
          {/* Payment Details */}
          {paymentStatus.orderId && (
            <div className="border-t border-emerald-200 pt-4 mt-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="text-left text-gray-600 font-medium">{t('payment.orderId', 'Order ID')}:</div>
                <div className="text-right font-semibold text-gray-800">{paymentStatus.orderId}</div>
                
                {paymentStatus.amount && (
                  <>
                    <div className="text-left text-gray-600 font-medium">{t('payment.amount', 'Amount')}:</div>
                    <div className="text-right font-semibold text-emerald-700">{parseInt(paymentStatus.amount).toLocaleString()} ₫</div>
                  </>
                )}
                
                {/* Add transaction date */}
                <div className="text-left text-gray-600 font-medium">{t('payment.date', 'Date')}:</div>
                <div className="text-right font-semibold text-gray-800">
                  {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
                </div>
                
                {/* Add payment status */}
                <div className="text-left text-gray-600 font-medium">{t('payment.status', 'Status')}:</div>
                <div className="text-right">
                  {paymentStatus.isSuccess || paymentStatus.code === '00' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {t('payment.statusSuccess', 'Success')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {t('payment.statusFailed', 'Failed')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Actions */}
          <div className="mt-8 space-y-3">
            <Link href="/dashboard" className="block w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 rounded-lg font-medium transition-colors shadow-sm">
              {t('payment.returnToDashboard', 'Return to Dashboard')}
            </Link>
            
            <Link href="/premium" className="block w-full bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-600 py-2.5 px-4 rounded-lg font-medium transition-colors shadow-sm">
              {t('payment.viewPremiumFeatures', 'View Premium Features')}
            </Link>
            
            {!paymentStatus.isSuccess && paymentStatus.code !== '00' && (
              <Link href="/contact" className="text-emerald-600 hover:text-emerald-700 text-sm font-medium mt-2 inline-block">
                {t('payment.contactSupport', 'Contact Support')}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Main export component with Suspense
export default function PaymentResultPage() {
  return (
    <Suspense fallback={<PaymentResultLoading />}>
      <PaymentResultClient />
    </Suspense>
  );
}