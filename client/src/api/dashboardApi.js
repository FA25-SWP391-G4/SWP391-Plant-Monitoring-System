import axiosClient from "./axiosClient";

const dashboardApi = {
  getLayout: () => axiosClient.get("/dashboard/layout"),
  saveLayout: (layout) => axiosClient.put("/dashboard/layout", { layout }),
};
export default dashboardApi;
