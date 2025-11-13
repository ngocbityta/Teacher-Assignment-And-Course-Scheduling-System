import { API_BASE } from "./index";

if (!API_BASE) throw new Error("VITE_API_BASE is not set. See .env.example");

// Fixed period definitions matching backend Period enum
export const PERIODS = [
  { id: "CA1", name: "CA1 (Buổi 1)", start: "07:30", end: "09:30" },
  { id: "CA2", name: "CA2 (Buổi 2)", start: "09:45", end: "11:45" },
  { id: "CA3", name: "CA3 (Buổi 3)", start: "13:00", end: "15:00" },
  { id: "CA4", name: "CA4 (Buổi 4)", start: "15:15", end: "17:15" },
  { id: "CA5", name: "CA5 (Buổi 5)", start: "18:00", end: "20:00" },
];

// Periods API - read-only (no create, update, delete)
export const periodsAPI = {
  list: () => Promise.resolve(PERIODS),
  get: (id) => Promise.resolve(PERIODS.find(p => p.id === id)),
};

export default periodsAPI;
