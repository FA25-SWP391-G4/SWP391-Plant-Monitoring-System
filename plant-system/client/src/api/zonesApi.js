const zonesApi = {
  list: () => axiosClient.get("/api/zones"),
  create: (payload) => axiosClient.post("/api/zones", payload),
  remove: (id) => axiosClient.delete(`/api/zones/${id}`),
  assignDevice: (z, d) => axiosClient.post(`/api/zones/${z}/devices`, { deviceId:d }),
  unassignDevice: (z, d) => axiosClient.delete(`/api/zones/${z}/devices/${d}`),
  assignPump: (z, p) => axiosClient.post(`/api/zones/${z}/pump`, { pumpId:p }),
};
export default zonesApi;
