import axiosClient from "./axiosClient";

const reportsApi = {
  summary: (zoneId, from, to) => axiosClient.get("/reports/summary", { params: { zoneId, from, to } }),
  timeseries: (zoneId, from, to, metrics) => axiosClient.get("/reports/timeseries", { params: { zoneId, from, to, metrics } }),
  search: (query) => axiosClient.get("/reports/search", { params: query }), // zoneId?, from?, to?, keyword?
};
export default reportsApi;
