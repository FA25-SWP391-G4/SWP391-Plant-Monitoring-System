import axiosClient from "./axiosClient";

const billingApi = {
  createCheckout: (provider) => axiosClient.post(`/billing/create-checkout`, { provider }), // 'vnpay' | 'stripe' | 'paypal'
  verify: (params) => axiosClient.get("/billing/verify", { params }), // callback
};
export default billingApi;
