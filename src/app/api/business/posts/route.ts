import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SHIFT_NICHES, WORK_TYPES } from "@/lib/shift-work";
import { NextRequest, NextResponse } from "next/server";

const VALID_WORK_TYPES = new Set(WORK_TYPES.map((type) => type.value));
const VALID_NICHES = new Set(SHIFT_NICHES.map((niche) => niche.value));

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function nullableText(value: unknown) {
  const cleaned = text(value);
  return cleaned ? cleaned : null;
}

function numberOrNull(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function dateTimeOrNull(date: unknown, time: unknown) {
  const day = text(date);
  const clock = text(time);
  if (!day || !clock) return null;
  const value = new Date(`${day}T${clock}:00`);
  return Number.isNaN(value.getTime()) ? null : value.toISOString();
}

async function getApprovedBusiness(userId: string) {
  const admin = createAdminSupabaseClient();
  const adminDb = admin as never as {
    from: (table: string) => {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          order: (column: string, options?: { ascending?: boolean }) => {
            limit: (count: number) => {
              maybeSingle: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }>;
            };
          };
        };
      };
    };
  };

  const { data, error } = await adminDb
    .from("business_profiles")
    .select("*")
    .eq("owner_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: posts, error: postsError } = await supabase
      .from("business_work_posts")
      .select("*")
      .eq("owner_user_id", user.id)
      .order("created_at", { ascending: false });

    if (postsError) {
      return NextResponse.json({ error: postsError.message }, { status: 500 });
    }

    return NextResponse.json({ posts: posts || [] });
  } catch (error) {
    console.error("Business posts lookup failed:", error);
    return NextResponse.json({ error: "Failed to load business posts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Sign in before posting business work" }, { status: 401 });
    }

    const business = await getApprovedBusiness(user.id);
    if (!business) {
      return NextResponse.json({ error: "Register as a business before posting jobs" }, { status: 403 });
    }

    if (business.status !== "approved") {
      return NextResponse.json(
        { error: "Business approval is required before posting jobs or shifts", status: business.status },
        { status: 403 }
      );
    }

    if (!business.registration_number || !business.document_url) {
      return NextResponse.json(
        { error: "Business registration number and document are required before posting" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const workType = text(body.workType);
    const niche = text(body.niche);
    const industry = text(body.industry);
    const roleTitle = text(body.roleTitle);
    const description = text(body.description);
    const address = text(body.address);
    const city = text(body.city);
    const headcount = Math.max(1, Number(body.headcount || 1));
    const startsAt = dateTimeOrNull(body.startDate, body.startTime);
    const endsAt = dateTimeOrNull(body.endDate || body.startDate, body.endTime);

    if (!VALID_WORK_TYPES.has(workType as never)) {
      return NextResponse.json({ error: "Choose a valid work type" }, { status: 400 });
    }

    if (!VALID_NICHES.has(niche as never)) {
      return NextResponse.json({ error: "Choose a valid worker niche" }, { status: 400 });
    }

    if (!industry || !roleTitle || description.length < 10 || !address || !city) {
      return NextResponse.json(
        { error: "Industry, role, description, address, and city are required" },
        { status: 400 }
      );
    }

    if ((workType === "part_time_day_wage" || workType === "long_duration_shift") && (!startsAt || !endsAt)) {
      return NextResponse.json({ error: "Start and end date/time are required for day-wage and shift work" }, { status: 400 });
    }

    if (startsAt && endsAt && new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
      return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });
    }

    const admin = createAdminSupabaseClient();
    const adminDb = admin as never as {
      from: (table: string) => {
        insert: (values: Record<string, unknown>) => {
          select: (columns?: string) => {
            single: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }>;
          };
        };
      };
    };

    const { data: post, error: insertError } = await adminDb
      .from("business_work_posts")
      .insert({
        business_id: business.id,
        owner_user_id: user.id,
        work_type: workType,
        industry,
        niche,
        role_title: roleTitle,
        description,
        location_name: nullableText(body.locationName),
        address,
        city,
        postal_code: nullableText(body.postalCode),
        starts_at: startsAt,
        ends_at: endsAt,
        headcount,
        business_preferred_hourly_rate: numberOrNull(body.hourlyRate),
        business_preferred_day_rate: numberOrNull(body.dayRate),
        accepts_worker_rate_variation: body.acceptsWorkerRateVariation !== false,
        requirements: nullableText(body.requirements),
        uniform: nullableText(body.uniform),
        break_policy: nullableText(body.breakPolicy),
        contact_name: nullableText(body.contactName) || business.contact_name,
        contact_phone: nullableText(body.contactPhone) || business.contact_phone,
        status: "submitted",
      })
      .select("*")
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error("Business post creation failed:", error);
    return NextResponse.json({ error: "Failed to create business work post" }, { status: 500 });
  }
}
