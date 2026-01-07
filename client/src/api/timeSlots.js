import { API_BASE } from "./index";

if (!API_BASE) throw new Error("VITE_API_BASE is not set. See .env.example");

export const PERIODS = [
  { id: "period-ca1", name: "CA1 (Buổi 1)", start: "07:00", end: "08:30" },
  { id: "period-ca2", name: "CA2 (Buổi 2)", start: "08:30", end: "10:00" },
  { id: "period-ca3", name: "CA3 (Buổi 3)", start: "10:00", end: "11:30" },
  { id: "period-ca4", name: "CA4 (Buổi 4)", start: "13:00", end: "14:30" },
  { id: "period-ca5", name: "CA5 (Buổi 5)", start: "14:30", end: "16:00" },
  { id: "period-ca6", name: "CA6 (Buổi 6)", start: "16:00", end: "17:30" },
  { id: "period-ca7", name: "CA7 (Buổi 7)", start: "17:30", end: "19:00" },
  { id: "period-ca8", name: "CA8 (Buổi 8)", start: "19:00", end: "20:30" },
];

export const periodsAPI = {
  list: () => Promise.resolve(PERIODS),
  get: (id) => Promise.resolve(PERIODS.find(p => p.id === id)),
};

export default periodsAPI;
