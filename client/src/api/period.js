import { apiRequest, toItemArray } from "../lib/apiClient";

export const periodAPI = {
  list: async (params = {}) =>
    toItemArray(
      await apiRequest("/periods", {
        query: params,
      })
    ),
  get: (id) => apiRequest(`/periods/${id}`),
  create: (payload) =>
    apiRequest("/periods", { method: "POST", body: payload }),
  update: (id, payload) =>
    apiRequest(`/periods/${id}`, { method: "PUT", body: payload }),
  remove: (id) => apiRequest(`/periods/${id}`, { method: "DELETE" }),
};

export default periodAPI;



