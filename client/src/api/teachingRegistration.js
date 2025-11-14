import { apiRequest, toItemArray, withSemester } from "../lib/apiClient";

export const teachingRegistrationAPI = {
  list: async (params = {}) =>
    toItemArray(
      await apiRequest("/teaching-registrations", {
        query: params,
        includeSemester: true,
      })
    ),
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
  remove: (id) =>
    apiRequest(`/teaching-registrations/${id}`, { method: "DELETE" }),
};

export default teachingRegistrationAPI;
