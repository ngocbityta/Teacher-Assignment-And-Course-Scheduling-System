const SEMESTER_STORAGE_KEY = "selectedSemester";
const DEFAULT_SEMESTER = "S_20251";

const SEMESTER_OPTIONS = [
  { value: "S_20231", label: "2023-1" },
  { value: "S_20232", label: "2023-2" },
  { value: "S_20233", label: "2023-3" },
  { value: "S_20241", label: "2024-1" },
  { value: "S_20242", label: "2024-2" },
  { value: "S_20243", label: "2024-3" },
  { value: "S_20251", label: "2025-1" },
  { value: "S_20252", label: "2025-2" },
  { value: "S_20253", label: "2025-3" },
];

const VALID_SEMESTERS = new Set(SEMESTER_OPTIONS.map((option) => option.value));

function getStorage() {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage;
    }
    if (typeof localStorage !== "undefined") {
      return localStorage;
    }
  } catch {
    return null;
  }
  return null;
}

export function isValidSemester(value) {
  return typeof value === "string" && VALID_SEMESTERS.has(value);
}

export function getStoredSemester() {
  const storage = getStorage();
  if (!storage) return null;
  try {
    const value = storage.getItem(SEMESTER_STORAGE_KEY);
    return isValidSemester(value) ? value : null;
  } catch {
    return null;
  }
}

export function setStoredSemester(value) {
  const storage = getStorage();
  if (!storage) return null;
  try {
    if (!value) {
      storage.removeItem(SEMESTER_STORAGE_KEY);
      return null;
    }
    if (!isValidSemester(value)) {
      throw new Error(`Invalid semester value: ${value}`);
    }
    storage.setItem(SEMESTER_STORAGE_KEY, value);
    return value;
  } catch (err) {
    console.warn("Could not persist semester", err);
    return null;
  }
}

export function ensureDefaultSemester() {
  const current = getStoredSemester();
  if (current) return current;
  return setStoredSemester(DEFAULT_SEMESTER) || DEFAULT_SEMESTER;
}

export { SEMESTER_OPTIONS, SEMESTER_STORAGE_KEY, DEFAULT_SEMESTER };

