export type AppRole = "client" | "buyer" | "seller" | "provider" | "contractor" | "business";

export type AppUser = {
  id: string;
  email: string | null;
  role: AppRole;
  displayName: string;
  hasBusinessProfile: boolean;
  businessRegistrationStatus: string | null;
  providerWorkMode: string | null;
  canWorkFreelance: boolean;
  canWorkShifts: boolean;
  rating?: number;
  reviewCount?: number;
};

export type Job = {
  id: string;
  title?: string;
  service_name?: string;
  description?: string;
  city?: string;
  location_city?: string;
  budget_min?: number;
  budget_max?: number;
  scheduled_date?: string;
  status?: string;
  anyjob_select?: boolean;
  bid_count?: number;
  my_bid?: Bid | null;
  [key: string]: unknown;
};

export type Bid = { id: string; amount: number; status: string; message?: string; provider_id?: string; created_at?: string; [key: string]: unknown };
export type Conversation = { id: string; client_id: string; provider_id: string; unread_count?: number; last_message?: { content?: string }; client?: Person; provider?: Person };
export type Person = { id?: string; first_name?: string; last_name?: string; avatar_url?: string; profile_image_url?: string };
export type Review = { id: string; rating: number; title?: string; comment?: string; created_at?: string; review_type?: string; reviewer?: Person; reviewee?: Person };
