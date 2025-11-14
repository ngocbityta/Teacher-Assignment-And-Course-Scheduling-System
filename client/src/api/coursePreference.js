import { apiRequest, toItemArray, withSemester } from "../lib/apiClient";

export const coursePreferenceAPI = {
  list: async (params = {}) =>
    toItemArray(
      await apiRequest("/course-preferences", {
        query: params,
        includeSemester: true,
      })
    ),
  get: (id) => apiRequest(`/course-preferences/${id}`),
  create: (payload) =>
    apiRequest("/course-preferences", {
      method: "POST",
      body: withSemester(payload),
    }),
  update: (id, payload) =>
    apiRequest(`/course-preferences/${id}`, {
      method: "PUT",
      body: withSemester(payload),
    }),
  remove: (id) => apiRequest(`/course-preferences/${id}`, { method: "DELETE" }),
};

export default coursePreferenceAPI;
