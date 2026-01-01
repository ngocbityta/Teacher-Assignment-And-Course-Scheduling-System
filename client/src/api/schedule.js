import { apiRequest, withSemester } from "../lib/apiClient";
import { getSelectedSemester } from "./index";

export const scheduleAPI = {
  list: (params = {}) =>
    apiRequest("/schedules", { query: params, includeSemester: true }),
  listSets: (semester) =>
    apiRequest("/schedules/sets", { query: { semester: semester || getSelectedSemester() } }),
  get: (id) => apiRequest(`/schedules/${id}`),
  create: (payload) =>
    apiRequest("/schedules", { method: "POST", body: withSemester(payload) }),
  update: (id, payload) =>
    apiRequest(`/schedules/${id}`, { method: "PUT", body: withSemester(payload) }),
  remove: (id) => apiRequest(`/schedules/${id}`, { method: "DELETE" }),
  removeSet: (name, semester) =>
    apiRequest(`/schedules/sets`, {
      method: "DELETE",
      query: {
        name: name,
        semester: semester || getSelectedSemester()
      }
    }),
  generate: (semester, algorithm = 'heuristic', scheduleName = null) =>
    apiRequest("/schedules/generate", {
      method: "POST",
      query: {
        semester: semester || getSelectedSemester(),
        algorithm,
        ...(scheduleName ? { scheduleName } : {})
      }
    }),
  evaluate: (semester, name = null) =>
    apiRequest("/schedules/evaluate", {
      method: "GET",
      query: {
        semester: semester || getSelectedSemester(),
        ...(name ? { name } : {})
      }
    }),
};

export default scheduleAPI;
