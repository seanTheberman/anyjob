export interface Job {
  id: string;
  title: string;
  description: string;
  client: {
    name: string;
    photo?: string;
    rating?: number;
    reviewCount?: number;
  };
  budget: {
    min: number;
    max: number;
    currency: string;
  };
  location: {
    city: string;
    state?: string;
    distance?: string;
  };
  category: string;
  postedAt: string;
  urgency: "low" | "medium" | "high";
  isInStream: boolean;
  bid_count?: number;
  my_bid?: any;
  work_image_count?: number;
  work_images?: Array<{
    id: string;
    image_url: string;
    public_id: string;
    created_at: string;
  }>;
}
