import axiosClient from './axiosClient';

const planApi = {
  // Get all public plans
  getPublicPlans: async () => {
    try {
      const response = await axiosClient.get('/api/plans');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get all plans (admin only)
  getAllPlans: async () => {
    try {
      const response = await axiosClient.get('/api/plans/all');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get plan by ID
  getPlanById: async (id) => {
    try {
      const response = await axiosClient.get(`/api/plans/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Check admin access
  checkAdminAccess: async () => {
    try {
      const response = await axiosClient.get('/api/plans/admin-access');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create plan (admin only)
  createPlan: async (planData) => {
    try {
      const response = await axiosClient.post('/api/plans', planData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update plan (admin only)
  updatePlan: async (id, planData) => {
    try {
      const response = await axiosClient.put(`/api/plans/${id}`, planData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default planApi;