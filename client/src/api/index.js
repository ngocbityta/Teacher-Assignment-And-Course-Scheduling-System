import { getStoredSemester } from "../store/semester";

export const API_BASE = import.meta.env.VITE_API_BASE;

if (!API_BASE) {
  console.warn("VITE_API_BASE is not set. Please add it to your .env file (e.g., VITE_API_BASE=http://localhost:8080/api)");
}

export function getSelectedSemester() {
  return getStoredSemester();
}
