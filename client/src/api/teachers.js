import { apiRequest, toItemArray } from "../lib/apiClient";

export const teachersAPI = {
  list: async (params = {}) =>
    toItemArray(
      await apiRequest("/teachers", {
        query: params,
        includeSemester: true,
      })
    ),
  listWithMeta: (params = {}) =>
    apiRequest("/teachers", {
      query: params,
      includeSemester: true,
    }),
  get: (id) => apiRequest(`/teachers/${id}`),
  create: (payload) =>
    apiRequest("/teachers", { method: "POST", body: payload }),
  update: (id, payload) =>
    apiRequest(`/teachers/${id}`, { method: "PUT", body: payload }),
  remove: (id) => apiRequest(`/teachers/${id}`, { method: "DELETE" }),
};

export default teachersAPI;
