import { apiRequest, toItemArray, withSemester } from "../lib/apiClient";

export const classroomAPI = {
  list: async (params = {}) =>
    toItemArray(
      await apiRequest("/classrooms", {
        query: params,
        includeSemester: true,
      })
    ),
  listWithMeta: (params = {}) =>
    apiRequest("/classrooms", {
      query: params,
      includeSemester: true,
    }),
  get: (id) => apiRequest(`/classrooms/${id}`),
  create: (payload) =>
    apiRequest("/classrooms", { method: "POST", body: withSemester(payload) }),
  update: (id, payload) =>
    apiRequest(`/classrooms/${id}`, { method: "PUT", body: withSemester(payload) }),
  remove: (id) => apiRequest(`/classrooms/${id}`, { method: "DELETE" }),
};

export default classroomAPI;
