import type { ImageSource } from "expo-image";

const covers = {
  cleaning: require("../../assets/images/services/cleaning.jpg"),
  handyman: require("../../assets/images/services/handyman.jpg"),
  moving: require("../../assets/images/services/moving.jpg"),
  painting: require("../../assets/images/services/painting.jpg"),
} satisfies Record<string, ImageSource>;

export function serviceCover(category?: string | null): ImageSource {
  const value = String(category || "").toLowerCase();
  if (/clean|menage|maid|housekeep/.test(value)) return covers.cleaning;
  if (/move|transport|delivery|removal/.test(value)) return covers.moving;
  if (/paint|decorat/.test(value)) return covers.painting;
  return covers.handyman;
}

export const serviceCategories = [
  { title: "Cleaning", subtitle: "Home & deep clean", image: covers.cleaning },
  { title: "Handyman", subtitle: "Repairs & assembly", image: covers.handyman },
  { title: "Moving", subtitle: "Packing & lifting", image: covers.moving },
  { title: "Painting", subtitle: "Walls & decorating", image: covers.painting },
] as const;
