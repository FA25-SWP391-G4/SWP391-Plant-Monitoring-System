import axiosClient from "./axiosClient";

/**
 * Payment API client for VNPay integration
 */
const paymentApi = {
  /**
   * Create payment URL for VNPay
   * 
   * @param {Object} data Payment data
   * @param {number} data.amount Payment amount in VND
   * @param {string} data.orderInfo Order information description
   * @param {string} data.orderType Order type (premium_upgrade, subscription, feature_access)
   * @param {string} data.bankCode Bank code (optional)
   * @param {boolean} data.directRedirect If true, server will redirect directly to VNPay instead of returning URL
   * @returns {Promise} Promise with payment URL data (unless directRedirect=true, then browser redirects)
   */
  createPaymentUrl: async (data) => {
    try {
      console.log('[PAYMENT] Creating payment URL with data:', {
        ...data,
        directRedirect: data.directRedirect ? true : false
      });

      if (data.directRedirect) {
        // For direct redirect, open the URL in a new window/tab
        // This avoids CORS issues with redirects
        const response = await axiosClient.post("/payment/create", {
          ...data,
          returnUrl: window.location.origin + "/payment-return"
        }, {
          // Don't use blob responseType as it causes issues with CORS
          headers: {
            'X-Direct-Redirect': 'true'
          }
        });

        console.log('[PAYMENT] Received payment URL:', response.data);
        
        // Handle the redirect manually by opening payment URL
        if (response.data && response.data.data && response.data.data.paymentUrl) {
          console.log('[PAYMENT] Opening payment URL:', response.data.data.paymentUrl);
          window.open(response.data.data.paymentUrl, '_blank');
          return response.data;
        } else {
          throw new Error('Invalid payment URL response');
        }
      }
      
      // Regular JSON response
      const response = await axiosClient.post("/payment/create", data);
      console.log('[PAYMENT] Payment URL created:', response.data);
      return response.data;
    } catch (error) {
      console.error('[PAYMENT] Error creating payment URL:', error);
      throw error;
    }
  },

  /**
   * Get payment status by orderId
   * 
   * @param {string} orderId Order ID to check
   * @returns {Promise} Promise with payment status
   */
  getPaymentStatus: (orderId) => 
    axiosClient.get(`/payment/status/${orderId}`),
    
  /**
   * Get payment history for current user
   * 
   * @returns {Promise} Promise with payment history
   */
  getPaymentHistory: () => 
    axiosClient.get("/payment/history")
};

export default paymentApi;