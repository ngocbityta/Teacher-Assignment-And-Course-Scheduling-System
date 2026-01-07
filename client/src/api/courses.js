import { apiRequest, toPageResult } from "../lib/apiClient";

const DEFAULT_PAGE = { page: 0, size: 20 };

export const coursesAPI = {
  list: async (params = {}) =>
    toPageResult(
      await apiRequest("/courses", {
        query: { ...DEFAULT_PAGE, ...params },
        includeSemester: true,
      })
    ),
  // Fetch all courses (for lookup purposes where we need complete data)
  listAll: async (params = {}) =>
    toPageResult(
      await apiRequest("/courses", {
        query: { page: 0, size: 500, ...params },
        includeSemester: true,
      })
    ),
  listWithMeta: (params = {}) =>
    apiRequest("/courses", {
      query: { ...DEFAULT_PAGE, ...params },
      includeSemester: true,
    }),
  get: (id) => apiRequest(`/courses/${id}`),
  create: (payload) =>
    apiRequest("/courses", { method: "POST", body: payload }),
  update: (id, payload) =>
    apiRequest(`/courses/${id}`, { method: "PUT", body: payload }),
  remove: (id) => apiRequest(`/courses/${id}`, { method: "DELETE" }),
};

export default coursesAPI;
