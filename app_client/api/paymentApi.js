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
   * @param {string} data.planType Plan type (premium_upgrade, ultimate_upgrade)
   * @param {string} data.bankCode Bank code (optional)
   * @returns {Promise} Promise with payment URL data
   */
  createPaymentUrl: async (data) => {
    try {
      console.log('[PAYMENT API] Creating payment URL with data:', data);

      // Prepare payment data - only include bankCode if explicitly provided
      const paymentData = {
        amount: data.amount,
        orderInfo: data.orderInfo,
        planType: data.planType
      };

      // Only add bankCode if it's explicitly provided and not empty
      if (data.bankCode && data.bankCode.trim() !== '' && data.bankCode.trim() !== 'null') {
        paymentData.bankCode = data.bankCode.trim();
        console.log('[PAYMENT API] Using specific bank code:', data.bankCode.trim());
      } else {
        console.log('[PAYMENT API] No bank code specified - VNPay will show all payment methods');
        // Don't include bankCode property at all
      }

      const response = await axiosClient.post("/payment/create", paymentData);

      console.log('[PAYMENT API] Payment URL created:', response.data);
      
      // Check if we got a payment URL in the response
      if (response.data && response.data.success && response.data.paymentUrl) {
        console.log('[PAYMENT API] Redirecting to VNPay URL:', response.data.paymentUrl);
        
        // Redirect to VNPay payment URL
        window.location.href = response.data.paymentUrl;
        
        return response.data;
      } else {
        throw new Error('Invalid payment URL response: ' + JSON.stringify(response.data));
      }
    } catch (error) {
      console.error('[PAYMENT API] Error creating payment URL:', error);
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