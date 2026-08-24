export const WORK_TYPES = [
  {
    value: "freelance_service",
    label: "Freelance service job",
    description: "An outcome-based business service request for freelancers.",
  },
  {
    value: "part_time_day_wage",
    label: "Part-time day-wage job",
    description: "Short day-wage staffing with a defined start and end.",
  },
  {
    value: "long_duration_shift",
    label: "Long-duration shift work",
    description: "Recurring or longer staffing over several days or weeks.",
  },
] as const;

export const SHIFT_NICHES = [
  [
    "healthcare",
    "Healthcare",
    [
      "Healthcare support worker",
      "Care assistant",
      "Clinic support",
      "Hospital porter",
    ],
    22,
    165,
  ],
  [
    "hospitality",
    "Hospitality",
    ["Wait staff", "Bar staff", "Kitchen porter", "Host"],
    17,
    130,
  ],
  [
    "cleaning",
    "Cleaning",
    ["Commercial cleaner", "Housekeeping", "Deep-clean crew", "Site cleaner"],
    18,
    135,
  ],
  [
    "retail",
    "Retail",
    ["Retail assistant", "Stock assistant", "Cashier", "Customer support"],
    16,
    120,
  ],
  [
    "logistics",
    "Logistics",
    [
      "Warehouse operative",
      "Picker packer",
      "Loading assistant",
      "Driver helper",
    ],
    18,
    140,
  ],
  [
    "events",
    "Events",
    ["Event staff", "Brand ambassador", "Ticketing support", "Setup crew"],
    18,
    140,
  ],
  [
    "home_help",
    "Home help",
    [
      "Home assistant",
      "Meal prep assistant",
      "Errand runner",
      "Companion support",
    ],
    18,
    135,
  ],
  [
    "childcare",
    "Childcare",
    [
      "Babysitter",
      "After-school helper",
      "Holiday care assistant",
      "Child activity support",
    ],
    17,
    130,
  ],
  [
    "pet_care",
    "Pet care",
    ["Dog walker", "Pet sitter", "Home pet visitor", "Pet transport helper"],
    16,
    120,
  ],
  [
    "it_support",
    "IT support",
    [
      "IT support technician",
      "Device setup helper",
      "Network setup assistant",
      "Software support",
    ],
    24,
    185,
  ],
  [
    "education",
    "Education and tutoring",
    [
      "Private tutor",
      "Homework helper",
      "Language tutor",
      "Music lesson assistant",
    ],
    24,
    180,
  ],
  [
    "handyman",
    "Handyman and maintenance",
    [
      "Maintenance worker",
      "Furniture assembler",
      "Repair assistant",
      "Painting helper",
    ],
    22,
    170,
  ],
  [
    "gardening",
    "Gardening",
    [
      "Gardener",
      "Lawn care worker",
      "Hedge trimming helper",
      "Garden cleanup crew",
    ],
    19,
    145,
  ],
  [
    "moving",
    "Moving",
    [
      "Moving helper",
      "Packing assistant",
      "Furniture mover",
      "Heavy lifting assistant",
    ],
    20,
    155,
  ],
  [
    "security",
    "Security",
    ["Security guard", "Door supervisor", "Event security", "Site watch"],
    20,
    155,
  ],
  [
    "beauty_wellness",
    "Beauty and wellness",
    [
      "Salon assistant",
      "Spa attendant",
      "Makeup assistant",
      "Wellness reception",
    ],
    18,
    135,
  ],
  [
    "automotive",
    "Automotive",
    [
      "Vehicle cleaner",
      "Garage assistant",
      "Driver helper",
      "Car delivery support",
    ],
    19,
    145,
  ],
  [
    "winter_services",
    "Winter services",
    [
      "Snow removal worker",
      "Winter pet sitter",
      "Holiday cover helper",
      "Seasonal support worker",
    ],
    20,
    150,
  ],
].map(([value, label, roles, hourlyAverage, dayAverage]) => ({
  value: value as string,
  label: label as string,
  industry: label as string,
  roles: roles as string[],
  hourlyAverage: hourlyAverage as number,
  dayAverage: dayAverage as number,
}));

export function getShiftNiche(value?: string | null) {
  return SHIFT_NICHES.find((niche) => niche.value === value) || SHIFT_NICHES[0];
}

export const BUSINESS_TYPES = [
  "Hospital",
  "Restaurant",
  "Retail store",
  "Cleaning company",
  "Events company",
  "Warehouse",
  "Office",
  "Other",
].map((value) => ({ value, label: value }));

export const BUSINESS_DOCUMENTS = [
  ["registration", "Company registration / CRO certificate", true],
  ["tax", "VAT / tax registration proof", false],
  ["insurance", "Professional or public liability insurance", false],
  ["license", "Trade license / regulated activity permit", false],
  ["representative", "Director / representative ID", false],
  ["address", "Business address proof", false],
] as const;
