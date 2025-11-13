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

export const teachersAPI = {
  /**
   * List teachers. By default returns an array for compatibility with existing pages.
   * Accepts optional params: { page, size, keyword }
   * If you need full page metadata, call teachersAPI.listWithMeta(params)
   */
  list: async (params = {}) => {
    const path = `/teachers${buildQuery(params)}`;
    const res = await request(path, { method: "GET" });
    // Backend returns a Page<TeacherDTO> with `content` array. Normalize to array.
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.content)) return res.content;
    return [];
  },

  /** Return the full page response (content + metadata) */
  listWithMeta: async (params = {}) => {
    const path = `/teachers${buildQuery(params)}`;
    return request(path, { method: "GET" });
  },

  get: (id) => request(`/teachers/${id}`, { method: "GET" }),
  create: (payload) => request(`/teachers`, { method: "POST", body: JSON.stringify(payload) }),
  update: (id, payload) => request(`/teachers/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  remove: (id) => request(`/teachers/${id}`, { method: "DELETE" }),
};

export default teachersAPI;
