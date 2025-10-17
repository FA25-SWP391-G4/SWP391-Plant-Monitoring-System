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
  createPaymentUrl: (data) => {
    // For direct redirects, we need to handle differently
    if (data.directRedirect) {
      // Open a new window directly with the payment URL to avoid CORS issues with headers
      window.open(`${process.env.NEXT_PUBLIC_API_URL}/payment/create?directRedirect=true&amount=${data.amount}&orderInfo=${encodeURIComponent(data.orderInfo)}&orderType=${data.orderType || 'premium_subscription'}`);
      return Promise.resolve({ directRedirecting: true });
    }
    // Regular JSON response
    return axiosClient.post("/payment/create", data);
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