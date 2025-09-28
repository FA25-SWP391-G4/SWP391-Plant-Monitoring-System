import axiosClient from "./axiosClient";

const thresholdsApi = {
  get: (zoneId) => axiosClient.get(`/thresholds/${zoneId}`),
  save: (zoneId, payload) => axiosClient.put(`/thresholds/${zoneId}`, payload), // rules JSON
};
export default thresholdsApi;
