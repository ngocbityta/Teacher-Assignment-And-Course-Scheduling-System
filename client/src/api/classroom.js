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

function buildQuery(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    qs.append(k, String(v));
  });
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export const classroomAPI = {
  /**
   * List classrooms. Returns an array (normalizes Page response).
   * Accepts optional params: { page, size, keyword }
   */
  list: async (params = {}) => {
    const path = `/classrooms${buildQuery(params)}`;
    const res = await request(path, { method: "GET" });
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.content)) return res.content;
    return [];
  },

  /** Return full page response with metadata */
  listWithMeta: async (params = {}) => {
    const path = `/classrooms${buildQuery(params)}`;
    return request(path, { method: "GET" });
  },

  get: (id) => request(`/classrooms/${id}`, { method: "GET" }),
  create: (payload) => request(`/classrooms`, { method: "POST", body: JSON.stringify(payload) }),
  update: (id, payload) => request(`/classrooms/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  remove: (id) => request(`/classrooms/${id}`, { method: "DELETE" }),
};

export default classroomAPI;
