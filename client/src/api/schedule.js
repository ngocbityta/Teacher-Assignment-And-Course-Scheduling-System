import { apiRequest, withSemester } from "../lib/apiClient";

export const scheduleAPI = {
  list: (params = {}) =>
    apiRequest("/schedules", { query: params, includeSemester: true }),
  get: (id) => apiRequest(`/schedules/${id}`),
  create: (payload) =>
    apiRequest("/schedules", { method: "POST", body: withSemester(payload) }),
  update: (id, payload) =>
    apiRequest(`/schedules/${id}`, { method: "PUT", body: withSemester(payload) }),
  remove: (id) => apiRequest(`/schedules/${id}`, { method: "DELETE" }),
};

export default scheduleAPI;
