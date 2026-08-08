import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { getProviderProfileById } from "@/lib/real-providers";

const getCachedProviderProfile = unstable_cache(
  (providerId: string) => getProviderProfileById(providerId),
  ["public-provider-profile"],
  { revalidate: 60 },
);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: profileId } = await params;

  // Use service role key to bypass RLS
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  try {
    const preferProvider =
      new URL(request.url).searchParams.get("role") === "provider";
    const loadProvider = async () => {
      const { data: seller } = await supabase
        .from("sellers")
        .select("id")
        .eq("id", profileId)
        .eq("status", "approved")
        .single();

      if (!seller) return null;
      const { data: services } = await supabase
        .from("eloo_provider_services")
        .select(
          "id,title,description,hourly_rate,min_hours,max_radius_km,tags,gig_details,created_at",
        )
        .eq("provider_id", profileId)
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      const provider = await getCachedProviderProfile(profileId);
      return NextResponse.json({ provider, gigs: services || [] });
    };

    if (preferProvider) {
      const providerResponse = await loadProvider();
      if (providerResponse) return providerResponse;
    }

    // Try to get from buyers table first
    const { data: buyer } = await supabase
      .from("buyers")
      .select(
        "id,first_name,last_name,profile_image_url,city,rating,review_count,kyc_status",
      )
      .eq("id", profileId)
      .single();

    if (buyer) {
      return NextResponse.json(buyer);
    }

    // Try sellers table
    const providerResponse = await loadProvider();
    if (providerResponse) return providerResponse;

    // Try eloo_profiles
    const { data: profile } = await supabase
      .from("eloo_profiles")
      .select(
        "id,first_name,last_name,avatar_url,bio,city,is_verified,rating,review_count",
      )
      .eq("id", profileId)
      .single();

    if (profile) {
      return NextResponse.json(profile);
    }

    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 },
    );
  }
}
