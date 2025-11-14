import { apiRequest, toPageResult } from "../lib/apiClient";

const DEFAULT_PAGE = { page: 0, size: 20 };

export const sectionAPI = {
  list: async (params = {}) =>
    toPageResult(
      await apiRequest("/sections", {
        query: { ...DEFAULT_PAGE, ...params },
        includeSemester: true,
      })
    ),
  listWithMeta: (params = {}) =>
    apiRequest("/sections", {
      query: { ...DEFAULT_PAGE, ...params },
      includeSemester: true,
    }),
  get: (id) => apiRequest(`/sections/${id}`),
  create: (payload) =>
    apiRequest("/sections", { method: "POST", body: payload }),
  update: (id, payload) =>
    apiRequest(`/sections/${id}`, { method: "PUT", body: payload }),
  remove: (id) => apiRequest(`/sections/${id}`, { method: "DELETE" }),
};

export default sectionAPI;
