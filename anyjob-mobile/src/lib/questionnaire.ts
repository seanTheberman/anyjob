export type Category = {
  id: string;
  slug: string;
  name: string;
  color: string;
};

export type Subcategory = {
  id: string;
  slug: string;
  name: string;
  category_id: string;
};

export const CATEGORIES: Category[] = [
  { id: "1", slug: "menage", name: "Cleaning", color: "#EC4899" },
  { id: "2", slug: "bricolage", name: "Handyman", color: "#F59E0B" },
  { id: "3", slug: "jardinage", name: "Gardening", color: "#22C55E" },
  { id: "4", slug: "demenagement", name: "Moving", color: "#8B5CF6" },
  { id: "5", slug: "enfants", name: "Childcare", color: "#F97316" },
  { id: "6", slug: "animaux", name: "Pet care", color: "#14B8A6" },
  { id: "7", slug: "informatique", name: "IT Support", color: "#6366F1" },
  { id: "8", slug: "aide-domicile", name: "Home help", color: "#EF4444" },
  {
    id: "9",
    slug: "cours-particuliers",
    name: "Private tutoring",
    color: "#0EA5E9",
  },
  { id: "10", slug: "hiver", name: "Winter services", color: "#60A5FA" },
];

export const SUBCATEGORIES: Record<string, Subcategory[]> = {
  menage: [
    {
      id: "m1",
      slug: "menage-regulier",
      name: "Regular cleaning",
      category_id: "1",
    },
    { id: "m2", slug: "grand-menage", name: "Deep cleaning", category_id: "1" },
    {
      id: "m3",
      slug: "nettoyage-vitres",
      name: "Window cleaning",
      category_id: "1",
    },
    { id: "m4", slug: "repassage", name: "Ironing", category_id: "1" },
    {
      id: "m5",
      slug: "nettoyage-apres-travaux",
      name: "End of construction cleaning",
      category_id: "1",
    },
  ],
  bricolage: [
    {
      id: "b1",
      slug: "petite-reparation",
      name: "Small repair",
      category_id: "2",
    },
    {
      id: "b2",
      slug: "montage-meubles",
      name: "Furniture assembly",
      category_id: "2",
    },
    {
      id: "b3",
      slug: "pose-etageres",
      name: "Shelf mounting",
      category_id: "2",
    },
    { id: "b4", slug: "peinture", name: "Painting", category_id: "2" },
    { id: "b5", slug: "electricite", name: "Electrical", category_id: "2" },
    { id: "b6", slug: "plomberie", name: "Plumbing", category_id: "2" },
  ],
  jardinage: [
    { id: "j1", slug: "tondre-pelouse", name: "Lawn mowing", category_id: "3" },
    {
      id: "j2",
      slug: "taille-haies",
      name: "Hedge trimming",
      category_id: "3",
    },
    { id: "j3", slug: "desherbage", name: "Weeding", category_id: "3" },
    {
      id: "j4",
      slug: "ramassage-feuilles",
      name: "Leaf picking",
      category_id: "3",
    },
    { id: "j5", slug: "plantation", name: "Planting", category_id: "3" },
  ],
  demenagement: [
    {
      id: "d1",
      slug: "aide-demenagement",
      name: "Moving help",
      category_id: "4",
    },
    { id: "d2", slug: "transport", name: "Transport", category_id: "4" },
    { id: "d3", slug: "emballage", name: "Packing", category_id: "4" },
    {
      id: "d4",
      slug: "demontage-meubles",
      name: "Furniture disassembly",
      category_id: "4",
    },
  ],
  enfants: [
    { id: "e1", slug: "babysitting", name: "Babysitting", category_id: "5" },
    {
      id: "e2",
      slug: "sortie-ecole",
      name: "School pick-up",
      category_id: "5",
    },
    {
      id: "e3",
      slug: "garde-vacances",
      name: "Holiday care",
      category_id: "5",
    },
    { id: "e4", slug: "aide-devoirs", name: "Homework help", category_id: "5" },
  ],
  animaux: [
    {
      id: "a1",
      slug: "promenade-chien",
      name: "Dog walking",
      category_id: "6",
    },
    { id: "a2", slug: "garde-chien", name: "Dog sitting", category_id: "6" },
    { id: "a3", slug: "garde-chat", name: "Cat sitting", category_id: "6" },
    { id: "a4", slug: "visite-animaux", name: "Home visit", category_id: "6" },
  ],
  informatique: [
    { id: "i1", slug: "depannage-pc", name: "PC Repair", category_id: "7" },
    {
      id: "i2",
      slug: "installation-wifi",
      name: "WiFi Setup",
      category_id: "7",
    },
    {
      id: "i3",
      slug: "cours-informatique",
      name: "IT Lessons",
      category_id: "7",
    },
  ],
  "aide-domicile": [
    { id: "ad1", slug: "courses", name: "Errands", category_id: "8" },
    {
      id: "ad2",
      slug: "preparation-repas",
      name: "Meal prep",
      category_id: "8",
    },
    {
      id: "ad3",
      slug: "accompagnement",
      name: "Accompaniment",
      category_id: "8",
    },
    { id: "ad4", slug: "lecture", name: "Reading", category_id: "8" },
  ],
  "cours-particuliers": [
    { id: "cp1", slug: "maths", name: "Mathematics", category_id: "9" },
    { id: "cp2", slug: "francais", name: "French", category_id: "9" },
    { id: "cp3", slug: "anglais", name: "English", category_id: "9" },
    { id: "cp4", slug: "musique", name: "Music", category_id: "9" },
  ],
  hiver: [
    {
      id: "h1",
      slug: "babysitting-hiver",
      name: "Winter babysitting",
      category_id: "10",
    },
    {
      id: "h2",
      slug: "garde-vacances-hiver",
      name: "Winter holiday care",
      category_id: "10",
    },
    {
      id: "h3",
      slug: "dog-sitting-hiver",
      name: "Winter pet sitting",
      category_id: "10",
    },
  ],
};

export const SERVICE_TYPES = [
  { value: "one_time", label: "One time", description: "One-off service" },
  {
    value: "recurring",
    label: "Regular",
    description: "Recurring service (weekly, monthly...)",
  },
  { value: "emergency", label: "Emergency", description: "Immediate need" },
  { value: "project", label: "Project", description: "Multi-day project" },
];

export const URGENCY_OPTIONS = [
  { value: "asap", label: "As soon as possible" },
  { value: "this_week", label: "This week" },
  { value: "this_month", label: "This month" },
  { value: "flexible", label: "Flexible" },
];

export const DURATION_OPTIONS = [
  { value: 1, label: "1 hour" },
  { value: 2, label: "2 hours" },
  { value: 3, label: "3 hours" },
  { value: 4, label: "4 hours" },
  { value: 6, label: "6 hours" },
  { value: 8, label: "8 hours (1 day)" },
  { value: -1, label: "Multi-day" },
];

export const PEOPLE_OPTIONS = [
  { value: 1, label: "1 person" },
  { value: 2, label: "2 people" },
  { value: 3, label: "3 people" },
  { value: 4, label: "4+ people" },
];

export const BUDGET_OPTIONS = [
  { value: "0-50", label: "€0 - €50", min: 0, max: 50 },
  { value: "50-100", label: "€50 - €100", min: 50, max: 100 },
  { value: "100-200", label: "€100 - €200", min: 100, max: 200 },
  { value: "200-500", label: "€200 - €500", min: 200, max: 500 },
  { value: "500+", label: "€500+", min: 500, max: null },
];

const CATEGORY_ALIASES: Record<string, string> = {
  cleaning: "menage",
  handyman: "bricolage",
  gardening: "jardinage",
  moving: "demenagement",
  childcare: "enfants",
  "pet-care": "animaux",
  pets: "animaux",
  "it-support": "informatique",
  "home-help": "aide-domicile",
  tutoring: "cours-particuliers",
  winter: "hiver",
};

export function normalizeCategory(value?: string) {
  if (!value) return "";
  return CATEGORY_ALIASES[value] || value;
}

export function categoryName(slug: string) {
  return (
    CATEGORIES.find((category) => category.slug === slug)?.name ||
    "Custom job request"
  );
}

export function subcategoryName(categorySlug: string, subcategorySlug: string) {
  if (subcategorySlug.startsWith("other-")) return "Other";
  return (
    SUBCATEGORIES[categorySlug]?.find(
      (subcategory) => subcategory.slug === subcategorySlug,
    )?.name || subcategorySlug
  );
}
