import axiosClient from "./axiosClient";

const zonesApi = {
  list: () => axiosClient.get("/api/zones"),
  get: (id) => axiosClient.get(`/api/zones/${id}`),
  create: (data) => axiosClient.post("/api/zones", data),
  update: (id, data) => axiosClient.put(`/api/zones/${id}`, data),
  remove: (id) => axiosClient.delete(`/api/zones/${id}`),
};

export default zonesApi;
