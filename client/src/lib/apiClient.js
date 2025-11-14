import { API_BASE, getSelectedSemester } from "../api";

if (!API_BASE) {
  throw new Error("VITE_API_BASE is not set. See .env.example");
}

const JSON_HEADERS = { "Content-Type": "application/json" };

function buildSearchParams(query = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params.append(key, value);
  });
  return params;
}

function prepareBody(body) {
  if (body === undefined || body === null) return undefined;
  if (typeof body === "string" || body instanceof FormData || body instanceof Blob) {
    return body;
  }
  return JSON.stringify(body);
}

export async function apiRequest(path, options = {}) {
  const {
    method = "GET",
    body,
    headers,
    query,
    includeSemester = false,
  } = options;

  const params = buildSearchParams(query);

  if (includeSemester && !params.has("semester")) {
    const semester = getSelectedSemester();
    if (semester) {
      params.set("semester", semester);
    }
  }

  const queryString = params.toString();
  const url = `${API_BASE}${path}${queryString ? `?${queryString}` : ""}`;

  const preparedBody = prepareBody(body);
  const isFormData = preparedBody instanceof FormData;

  const config = {
    method,
    headers: isFormData ? headers : { ...JSON_HEADERS, ...headers },
    body: preparedBody,
  };

  if (preparedBody === undefined) {
    delete config.body;
  }

  if (isFormData && config.headers && config.headers["Content-Type"]) {
    delete config.headers["Content-Type"];
  }

  const response = await fetch(url, config);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || response.statusText);
  }

  if (response.status === 204) return null;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
}

export function toItemArray(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.content)) return data.content;
  return [];
}

export function toPageResult(data) {
  const items = toItemArray(data);
  if (data && typeof data === "object" && !Array.isArray(data)) {
    return {
      items,
      total: data.totalElements ?? items.length,
      page: data.number ?? 0,
      size: data.size ?? items.length,
    };
  }
  return { items, total: items.length, page: 0, size: items.length };
}

export function withSemester(payload, fallbackSemester) {
  if (payload && payload.semester) return payload;
  const semester = fallbackSemester || getSelectedSemester();
  if (!semester) return payload;
  return { ...payload, semester };
}

