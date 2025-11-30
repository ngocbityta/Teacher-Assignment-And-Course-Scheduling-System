import { apiRequest, toItemArray, withSemester } from "../lib/apiClient";

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
  getAvailableForRegistration: async (semester) => {
    const response = await apiRequest("/teachers/available-for-registration", {
      query: { semester },
    });
    return Array.isArray(response) ? response : [];
  },
  get: (id) => apiRequest(`/teachers/${id}`),
  create: (payload) =>
    apiRequest("/teachers", { method: "POST", body: withSemester(payload) }),
  update: (id, payload) =>
    apiRequest(`/teachers/${id}`, { method: "PUT", body: withSemester(payload) }),
  remove: (id) => apiRequest(`/teachers/${id}`, { method: "DELETE" }),
};

export default teachersAPI;
