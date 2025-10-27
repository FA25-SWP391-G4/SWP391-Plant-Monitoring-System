// client/src/api/sensorApi.js
import axiosClient from './axiosClient';

const sensorApi = {
  async getLatest() {
    // Express backend endpoint you already confirmed works:
    const url = '/api/sensor/latest';
    const res = await axiosClient.get(url);
    return res.data;
  },
};

export default sensorApi;
