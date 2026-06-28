import { NextRequest, NextResponse } from "next/server";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type ProviderServiceInput = {
  id?: string;
  title?: string;
  description?: string;
  hourlyRate?: number;
  minHours?: number;
  maxRadiusKm?: number;
  tags?: string[];
  isActive?: boolean;
  gigDetails?: unknown;
};

type ServiceRow = {
  id: string;
  title: string;
  description: string | null;
  hourly_rate: number;
  min_hours: number | null;
  max_radius_km: number | null;
  is_active: boolean | null;
  tags: string[] | null;
  gig_details: Record<string, unknown> | null;
  created_at: string | null;
};

type ServiceQuery = {
  select(columns: string): {
    eq(column: string, value: string): ServiceQuery;
    order(column: string, options?: { ascending?: boolean }): Promise<{ data: ServiceRow[] | null; error: { message: string } | null }>;
    single(): Promise<{ data: ServiceRow | null; error: { message: string } | null }>;
  };
  order(column: string, options?: { ascending?: boolean }): Promise<{ data: ServiceRow[] | null; error: { message: string } | null }>;
  insert(payload: Record<string, unknown>): ServiceQuery;
  update(payload: Record<string, unknown>): ServiceQuery;
  delete(): ServiceQuery;
  eq(column: string, value: string): ServiceQuery;
};

type ProviderServicesClient = {
  from(table: "eloo_provider_services"): ServiceQuery;
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function numberValue(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function tagsValue(value: unknown) {
  return Array.isArray(value)
    ? value.map((item) => text(item)).filter(Boolean).slice(0, 20)
    : [];
}

function limitedText(value: unknown, maxLength: number) {
  return text(value).slice(0, maxLength);
}

function positiveNumber(value: unknown, fallback: number) {
  return Math.max(1, numberValue(value, fallback));
}

function mediaFileValue(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const source = value as Record<string, unknown>;
  const id = limitedText(source.id, 100);
  const imageUrl = limitedText(source.image_url, 500);
  if (!id || !imageUrl) return null;
  return {
    id,
    image_url: imageUrl,
    public_id: limitedText(source.public_id, 250),
    image_type: limitedText(source.image_type, 50),
    title: limitedText(source.title, 160),
    description: limitedText(source.description, 300),
  };
}

function gigDetailsValue(value: unknown) {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};

  const rawPackages = Array.isArray(source.packages) ? source.packages : [];
  const packages = ["starter", "standard", "premium"].map((tier, index) => {
    const item = rawPackages[index] && typeof rawPackages[index] === "object"
      ? rawPackages[index] as Record<string, unknown>
      : {};
    return {
      tier,
      title: limitedText(item.title, 45) || (index === 0 ? "Starter" : index === 1 ? "Standard" : "Premium"),
      description: limitedText(item.description, 220),
      price: positiveNumber(item.price, index === 0 ? 45 : index === 1 ? 90 : 160),
      deliveryDays: positiveNumber(item.deliveryDays, index + 1),
      revisions: Math.min(10, Math.max(0, numberValue(item.revisions, index))),
    };
  });

  const faqs = (Array.isArray(source.faqs) ? source.faqs : [])
    .map((item) => item && typeof item === "object" ? item as Record<string, unknown> : {})
    .map((item) => ({
      question: limitedText(item.question, 120),
      answer: limitedText(item.answer, 500),
    }))
    .filter((item) => item.question || item.answer)
    .slice(0, 10);

  const mediaFiles = (Array.isArray(source.mediaFiles) ? source.mediaFiles : [])
    .map(mediaFileValue)
    .filter(Boolean)
    .slice(0, 4);

  const mediaUrls = (mediaFiles.length ? mediaFiles.map((item) => item?.image_url || "") : Array.isArray(source.mediaUrls) ? source.mediaUrls : [])
    .map((item) => limitedText(item, 500))
    .filter(Boolean)
    .slice(0, 4);

  const videoFile = mediaFileValue(source.videoFile);

  const requirementQuestions = (Array.isArray(source.requirementQuestions) ? source.requirementQuestions : [])
    .map((item) => limitedText(item, 160))
    .filter(Boolean)
    .slice(0, 10);

  return {
    packages,
    faqs,
    mediaFiles,
    mediaUrls,
    videoFile,
    videoUrl: videoFile?.image_url || limitedText(source.videoUrl, 500),
    requirementQuestions,
  };
}

function servicePayload(input: ProviderServiceInput, providerId: string) {
  const title = text(input.title);
  const description = text(input.description);

  if (!title) return { error: "Gig title is required" };
  if (!description) return { error: "Gig description is required" };

  return {
    provider_id: providerId,
    title,
    description,
    hourly_rate: Math.max(1, numberValue(input.hourlyRate, 25)),
    min_hours: Math.max(1, numberValue(input.minHours, 1)),
    max_radius_km: Math.max(0, numberValue(input.maxRadiusKm, 25)),
    tags: tagsValue(input.tags),
    is_active: input.isActive !== false,
    gig_details: gigDetailsValue(input.gigDetails),
  };
}

async function getUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user;
}

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabaseClient() as never as ProviderServicesClient;
  const { data, error } = await admin
    .from("eloo_provider_services")
    .select("id,title,description,hourly_rate,min_hours,max_radius_km,is_active,tags,gig_details,created_at")
    .eq("provider_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ services: data || [] });
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const payload = servicePayload(body, user.id);
  if ("error" in payload) return NextResponse.json({ error: payload.error }, { status: 400 });

  const admin = createAdminSupabaseClient() as never as ProviderServicesClient;
  const { data, error } = await admin
    .from("eloo_provider_services")
    .insert(payload)
    .select("id,title,description,hourly_rate,min_hours,max_radius_km,is_active,tags,gig_details,created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ service: data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const id = text(body.id);
  if (!id) return NextResponse.json({ error: "Service id is required" }, { status: 400 });

  const payload = servicePayload(body, user.id);
  if ("error" in payload) return NextResponse.json({ error: payload.error }, { status: 400 });

  const admin = createAdminSupabaseClient() as never as ProviderServicesClient;
  const { data, error } = await admin
    .from("eloo_provider_services")
    .update(payload)
    .eq("id", id)
    .eq("provider_id", user.id)
    .select("id,title,description,hourly_rate,min_hours,max_radius_km,is_active,tags,gig_details,created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ service: data });
}

export async function DELETE(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = text(searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "Service id is required" }, { status: 400 });

  const admin = createAdminSupabaseClient() as never as ProviderServicesClient;
  const { error } = await admin
    .from("eloo_provider_services")
    .delete()
    .eq("id", id)
    .eq("provider_id", user.id)
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
