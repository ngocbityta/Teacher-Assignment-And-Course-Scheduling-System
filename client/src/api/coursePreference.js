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

export const coursePreferenceAPI = {
  list: () => request(`/course-preferences`, { method: "GET" }),
  get: (id) => request(`/course-preferences/${id}`, { method: "GET" }),
  create: (payload) => request(`/course-preferences`, { method: "POST", body: JSON.stringify(payload) }),
  update: (id, payload) => request(`/course-preferences/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  remove: (id) => request(`/course-preferences/${id}`, { method: "DELETE" }),
};

export default coursePreferenceAPI;
