// Central API configuration. Set VITE_API_BASE in your .env file (example: .env.example)
export const API_BASE = import.meta.env.VITE_API_BASE;

if (!API_BASE) {
  // Fail fast in dev so it's clear to set the env var
  // (Don't set a fallback here — the base url should come from environment)
  console.warn("VITE_API_BASE is not set. Please add it to your .env file (VITE_API_BASE=http://localhost:5000/api)");
}
