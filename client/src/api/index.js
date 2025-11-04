// src/api/index.js
// Central export for all API modules

export { default as authApi } from './authApi';
export { default as userApi } from './userApi';
export { default as plantApi } from './plantApi';
export { default as dashboardApi } from './dashboardApi';
export { default as paymentApi } from './paymentApi';
export { default as aiApi } from './aiApi';
export { default as sensorApi } from './sensorApi';
export { default as reportApi } from './reportApi';
export { default as notificationApi } from './notificationApi';
export { default as axiosClient } from './axiosClient';

// Named exports for convenience
import authApi from './authApi';
import userApi from './userApi';
import plantApi from './plantApi';
import dashboardApi from './dashboardApi';
import paymentApi from './paymentApi';
import aiApi from './aiApi';
import sensorApi from './sensorApi';
import reportApi from './reportApi';
import notificationApi from './notificationApi';

export const api = {
  auth: authApi,
  user: userApi,
  plant: plantApi,
  dashboard: dashboardApi,
  payment: paymentApi,
  ai: aiApi,
  sensor: sensorApi,
  report: reportApi,
  notification: notificationApi,
};

export default api;