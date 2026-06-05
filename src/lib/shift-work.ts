export const WORK_TYPES = [
  { value: "freelance_service", label: "Freelance service job" },
  { value: "part_time_day_wage", label: "Part-time day-wage job" },
  { value: "long_duration_shift", label: "Long-duration shift work" },
] as const;

export const SHIFT_NICHES = [
  {
    value: "healthcare",
    label: "Healthcare",
    industry: "Healthcare",
    roles: ["Healthcare support worker", "Care assistant", "Clinic support", "Hospital porter"],
    hourlyAverage: 22,
    dayAverage: 165,
  },
  {
    value: "hospitality",
    label: "Hospitality",
    industry: "Hospitality",
    roles: ["Wait staff", "Bar staff", "Kitchen porter", "Host"],
    hourlyAverage: 17,
    dayAverage: 130,
  },
  {
    value: "cleaning",
    label: "Cleaning",
    industry: "Cleaning",
    roles: ["Commercial cleaner", "Housekeeping", "Deep-clean crew", "Site cleaner"],
    hourlyAverage: 18,
    dayAverage: 135,
  },
  {
    value: "retail",
    label: "Retail",
    industry: "Retail",
    roles: ["Retail assistant", "Stock assistant", "Cashier", "Customer support"],
    hourlyAverage: 16,
    dayAverage: 120,
  },
  {
    value: "logistics",
    label: "Logistics",
    industry: "Logistics",
    roles: ["Warehouse operative", "Picker packer", "Loading assistant", "Driver helper"],
    hourlyAverage: 18,
    dayAverage: 140,
  },
  {
    value: "events",
    label: "Events",
    industry: "Events",
    roles: ["Event staff", "Brand ambassador", "Ticketing support", "Setup crew"],
    hourlyAverage: 18,
    dayAverage: 140,
  },
] as const;

export type WorkType = (typeof WORK_TYPES)[number]["value"];
export type ShiftNiche = (typeof SHIFT_NICHES)[number]["value"];

export function getShiftNiche(value?: string | null) {
  return SHIFT_NICHES.find((niche) => niche.value === value) || SHIFT_NICHES[0];
}
