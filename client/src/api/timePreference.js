import { apiRequest, toItemArray, withSemester } from "../lib/apiClient";

export const timePreferenceAPI = {
  list: async (params = {}) =>
    toItemArray(
      await apiRequest("/time-preferences", {
        query: params,
        includeSemester: true,
      })
    ),
  get: (id) => apiRequest(`/time-preferences/${id}`),
  create: (payload) =>
    apiRequest("/time-preferences", {
      method: "POST",
      body: withSemester(payload),
    }),
  update: (id, payload) =>
    apiRequest(`/time-preferences/${id}`, {
      method: "PUT",
      body: withSemester(payload),
    }),
  remove: (id) => apiRequest(`/time-preferences/${id}`, { method: "DELETE" }),
};

export default timePreferenceAPI;
