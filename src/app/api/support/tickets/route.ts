import { NextRequest, NextResponse } from "next/server";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  SUPPORT_CATEGORIES,
  SUPPORT_PRIORITIES,
  SUPPORT_REQUESTER_TYPES,
  mapSupportTicketRow,
  sanitizeSupportOption,
  type SupportRequesterType,
} from "@/lib/support/tickets";

type AdminClient = { from(table: string): any };
type AnyRecord = Record<string, unknown>;

const ticketSelect = `
  *,
  support_ticket_messages (
    id,
    ticket_id,
    sender_role,
    body,
    internal_note,
    created_at
  )
`;

function cleanString(value: unknown, max = 2000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function displayName(row: AnyRecord | null | undefined, fallback = "User") {
  if (!row) return fallback;
  const full = cleanString(row.full_name || row.display_name || row.name, 120);
  const first = cleanString(row.first_name, 80);
  const last = cleanString(row.last_name, 80);
  return full || [first, last].filter(Boolean).join(" ") || fallback;
}

function providerAccountType(row: AnyRecord | null | undefined) {
  const availability = row?.availability && typeof row.availability === "object" ? row.availability as AnyRecord : {};
  return cleanString(availability.providerAccountType, 40).toLowerCase();
}

async function resolveRequester(admin: AdminClient, userId: string, email: string, requestedType: SupportRequesterType) {
  const [sellerResult, elooResult, userProfileResult, businessResult] = await Promise.all([
    admin.from("sellers").select("id,first_name,last_name,email,availability").eq("id", userId).maybeSingle(),
    admin.from("eloo_profiles").select("id,first_name,last_name,full_name,email,role,has_business_profile").eq("id", userId).maybeSingle(),
    admin.from("user_profiles").select("id,full_name,email,role").eq("id", userId).maybeSingle(),
    admin.from("business_profiles").select("id,business_name,contact_email,owner_user_id,status").eq("owner_user_id", userId).order("created_at", { ascending: false }).limit(1),
  ]);

  const seller = sellerResult.data as AnyRecord | null;
  const elooProfile = elooResult.data as AnyRecord | null;
  const userProfile = userProfileResult.data as AnyRecord | null;
  const business = Array.isArray(businessResult.data) ? businessResult.data[0] as AnyRecord | undefined : undefined;
  const accountType = providerAccountType(seller);
  const isContractor = accountType === "business" || accountType === "agency";
  const isProvider = Boolean(seller?.id);
  const hasBusiness = Boolean(business?.id || elooProfile?.has_business_profile);

  const requesterType: SupportRequesterType =
    requestedType === "business" && hasBusiness ? "business" :
    requestedType === "contractor" && isContractor ? "contractor" :
    requestedType === "provider" && isProvider ? isContractor ? "contractor" : "provider" :
    isContractor ? "contractor" :
    isProvider ? "provider" :
    requestedType === "business" ? "business" :
    "user";

  const name =
    requesterType === "business" && business
      ? cleanString(business.business_name, 160)
      : displayName(seller, displayName(elooProfile, displayName(userProfile, email.split("@")[0] || "User")));

  return {
    requesterType,
    requesterName: name || email,
  };
}

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Sign in to view support tickets" }, { status: 401 });
    }

    const admin = createAdminSupabaseClient() as never as AdminClient;
    const { data, error: ticketsError } = await admin
      .from("support_tickets")
      .select(ticketSelect)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (ticketsError) {
      return NextResponse.json({ error: ticketsError.message }, { status: 500 });
    }

    const tickets = ((data || []) as AnyRecord[])
      .map(mapSupportTicketRow)
      .sort((left, right) => right.priorityScore - left.priorityScore || new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());

    return NextResponse.json({ tickets });
  } catch (error) {
    console.error("Support tickets lookup failed:", error);
    return NextResponse.json({ error: "Failed to load support tickets" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user?.email) {
      return NextResponse.json({ error: "Sign in to raise a support ticket" }, { status: 401 });
    }

    const body = await request.json();
    const title = cleanString(body.title || body.subject, 160);
    const description = cleanString(body.description || body.details, 5000);
    const category = sanitizeSupportOption(body.category, SUPPORT_CATEGORIES, "other");
    const priority = sanitizeSupportOption(body.priority, SUPPORT_PRIORITIES, "normal");
    const requestedType = sanitizeSupportOption(body.requesterType, SUPPORT_REQUESTER_TYPES, "user");
    const sourcePath = cleanString(body.sourcePath, 300);
    const relatedJobId = cleanString(body.relatedJobId, 120);

    if (!title || !description) {
      return NextResponse.json({ error: "Ticket title and details are required" }, { status: 400 });
    }

    const admin = createAdminSupabaseClient() as never as AdminClient;
    const requester = await resolveRequester(admin, user.id, user.email, requestedType);
    const now = new Date().toISOString();
    const { data: ticket, error: insertError } = await admin
      .from("support_tickets")
      .insert({
        user_id: user.id,
        requester_email: user.email.toLowerCase(),
        requester_name: requester.requesterName,
        requester_type: requester.requesterType,
        title,
        description,
        category,
        priority,
        status: "open",
        source_path: sourcePath || null,
        related_job_id: relatedJobId || null,
        last_user_response_at: now,
        metadata: {
          userAgent: cleanString(request.headers.get("user-agent"), 300),
        },
      })
      .select("*")
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    await admin.from("support_ticket_messages").insert({
      ticket_id: ticket.id,
      sender_user_id: user.id,
      sender_role: "user",
      body: description,
      internal_note: false,
    });

    return NextResponse.json({ ticket: mapSupportTicketRow({ ...(ticket as AnyRecord), support_ticket_messages: [] }) }, { status: 201 });
  } catch (error) {
    console.error("Support ticket creation failed:", error);
    return NextResponse.json({ error: "Failed to create support ticket" }, { status: 500 });
  }
}
