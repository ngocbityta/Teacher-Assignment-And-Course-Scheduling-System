import { apiRequest, withSemester } from "../lib/apiClient";
import { getSelectedSemester } from "./index";

export const scheduleAPI = {
  list: (params = {}) =>
    apiRequest("/schedules", { query: params, includeSemester: true }),
  get: (id) => apiRequest(`/schedules/${id}`),
  create: (payload) =>
    apiRequest("/schedules", { method: "POST", body: withSemester(payload) }),
  update: (id, payload) =>
    apiRequest(`/schedules/${id}`, { method: "PUT", body: withSemester(payload) }),
  remove: (id) => apiRequest(`/schedules/${id}`, { method: "DELETE" }),
  generate: (semester) =>
    apiRequest("/schedules/generate", { 
      method: "POST", 
      query: { semester: semester || getSelectedSemester() } 
    }),
  evaluate: (semester) =>
    apiRequest("/schedules/evaluate", {
      method: "GET",
      query: { semester: semester || getSelectedSemester() }
    }),
};

export default scheduleAPI;
