import { API_BASE } from "./index";

if (!API_BASE) throw new Error("VITE_API_BASE is not set. See .env.example");

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.status === 204 ? null : res.json();
}

function buildQuery(params) {
  const q = new URLSearchParams();
  if (params.page) q.append("page", params.page);
  if (params.size) q.append("size", params.size);
  if (params.sort) q.append("sort", params.sort);
  if (params.search) q.append("search", params.search);
  return q.toString() ? `?${q.toString()}` : "";
}

export const coursesAPI = {
  list: (params = {}) => {
    const query = buildQuery({ page: params.page || 0, size: params.size || 20, ...params });
    return request(`/courses${query}`, { method: "GET" }).then((data) => {
      if (data && data.content) {
        return { items: data.content, total: data.totalElements, page: data.number };
      }
      return Array.isArray(data) ? data : [];
    });
  },
  listWithMeta: (params = {}) => {
    const query = buildQuery({ page: params.page || 0, size: params.size || 20, ...params });
    return request(`/courses${query}`, { method: "GET" });
  },
  get: (id) => request(`/courses/${id}`, { method: "GET" }),
  create: (payload) => request(`/courses`, { method: "POST", body: JSON.stringify(payload) }),
  update: (id, payload) => request(`/courses/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  remove: (id) => request(`/courses/${id}`, { method: "DELETE" }),
};

export default coursesAPI;
