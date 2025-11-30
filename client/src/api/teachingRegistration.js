import { apiRequest, toItemArray, withSemester } from "../lib/apiClient";

export const teachingRegistrationAPI = {
  list: async (params = {}) =>
    toItemArray(
      await apiRequest("/teaching-registrations", {
        query: params,
        includeSemester: true,
      })
    ),
  getByStatus: async (status) => {
    const response = await apiRequest(`/teaching-registrations/status/${status}`);
    return Array.isArray(response) ? response : [];
  },
  get: (id) => apiRequest(`/teaching-registrations/${id}`),
  create: (payload) =>
    apiRequest("/teaching-registrations", {
      method: "POST",
      body: withSemester(payload),
    }),
  update: (id, payload) =>
    apiRequest(`/teaching-registrations/${id}`, {
      method: "PUT",
      body: withSemester(payload),
    }),
  approve: (id) =>
    apiRequest(`/teaching-registrations/${id}/approve`, { method: "POST" }),
  reject: (id) =>
    apiRequest(`/teaching-registrations/${id}/reject`, { method: "POST" }),
  remove: (id) =>
    apiRequest(`/teaching-registrations/${id}`, { method: "DELETE" }),
};

export default teachingRegistrationAPI;
