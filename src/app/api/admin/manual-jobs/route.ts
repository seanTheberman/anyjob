import { NextResponse } from "next/server";

import { anyJobSelectRequirements } from "@/lib/anyjob-select";
import { adminForbidden, getAdminApiUser, logAdminAction } from "@/lib/auth/admin-api";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function readBody(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return { body: await request.json(), isFormPost: false };
  }

  const formData = await request.formData();
  const body: Record<string, string> = {};
  for (const [key, value] of (formData as any).entries()) {
    body[key] = typeof value === "string" ? value : "";
  }
  return { body, isFormPost: true };
}

function clean(value: unknown) {
  return String(value || "").trim();
}

function numberOrNull(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function redirectAfter(request: Request, params: Record<string, string>) {
  const url = new URL("/admin/jobs", request.url);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return NextResponse.redirect(url, { status: 303 });
}

export async function POST(request: Request) {
  try {
    const admin = await getAdminApiUser();
    if (!admin) return adminForbidden();

    const { body, isFormPost } = await readBody(request);
    const recipientEmail = clean(body.select_quote_recipient_email || body.recipientEmail).toLowerCase();
    const description = clean(body.job_description || body.description);
    const categorySlug = clean(body.category_slug || body.category) || "custom";
    const subcategorySlug = clean(body.subcategory_slug || body.subcategory) || "custom-job";
    const city = clean(body.city) || "Ireland launch area";
    const title = clean(body.job_title || body.title);

    if (!emailPattern.test(recipientEmail)) {
      if (isFormPost) return redirectAfter(request, { manualJobError: "Enter a valid quote recipient email." });
      return NextResponse.json({ error: "Enter a valid quote recipient email." }, { status: 400 });
    }

    if (description.length < 10) {
      if (isFormPost) return redirectAfter(request, { manualJobError: "Job description must be at least 10 characters." });
      return NextResponse.json({ error: "Job description must be at least 10 characters." }, { status: 400 });
    }

    const now = new Date().toISOString();
    const storedDescription = title ? `${title}\n\n${description}` : description;
    const supabase = createAdminSupabaseClient() as never as { from(table: string): any };
    const baseInsert = {
        user_id: admin.id,
        email: recipientEmail,
        phone: clean(body.phone) || null,
        first_name: clean(body.first_name || body.recipient_name) || "AnyJob",
        last_name: clean(body.last_name) || "Select",
        category_slug: categorySlug,
        subcategory_slug: subcategorySlug,
        service_type: clean(body.service_type) || "one_time",
        job_description: storedDescription,
        job_urgency: clean(body.job_urgency) || "soon",
        preferred_date: clean(body.preferred_date) || null,
        preferred_time_start: clean(body.preferred_time_start) || "09:00",
        preferred_time_end: clean(body.preferred_time_end) || null,
        flexible_timing: body.flexible_timing === "on" || body.flexible_timing === true,
        address: clean(body.address) || null,
        city,
        postal_code: clean(body.postal_code) || null,
        coarse_location_label: clean(body.coarse_location_label) || city,
        estimated_duration_hours: numberOrNull(body.estimated_duration_hours),
        number_of_people_needed: numberOrNull(body.number_of_people_needed) || 1,
        budget_range_min: numberOrNull(body.budget_range_min) || 0,
        budget_range_max: numberOrNull(body.budget_range_max) || 999999,
        specific_requirements: anyJobSelectRequirements(clean(body.specific_requirements || body.select_quote_note)),
        equipment_needed: clean(body.equipment_needed) || null,
        materials_provided: body.materials_provided === "on" || body.materials_provided === true,
        status: "submitted",
        submitted_at: now,
      };
    const selectInsert = {
        ...baseInsert,
        admin_posted: true,
        admin_posted_by: admin.id,
        anyjob_select: true,
        select_quote_recipient_email: recipientEmail,
        select_quote_recipient_name: clean(body.select_quote_recipient_name || body.recipient_name) || null,
        select_quote_note: clean(body.select_quote_note) || null,
        select_quote_payment_status: "unpaid",
      };
    let insertResult = await supabase
      .from("service_inquiries")
      .insert(selectInsert)
      .select("id")
      .single();

    if (
      insertResult.error &&
      (insertResult.error.code === "PGRST204" || /admin_posted|anyjob_select|select_quote/i.test(insertResult.error.message || ""))
    ) {
      insertResult = await supabase
        .from("service_inquiries")
        .insert(baseInsert)
        .select("id")
        .single();
    }

    const { data: inquiry, error } = insertResult;

    if (error) {
      if (isFormPost) return redirectAfter(request, { manualJobError: error.message });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAdminAction({
      actorId: admin.id,
      action: "jobs.create_anyjob_select",
      targetType: "service_inquiry",
      targetId: inquiry.id,
      metadata: { recipientEmail, categorySlug, subcategorySlug },
    });

    if (isFormPost) {
      return redirectAfter(request, {
        tab: "live",
        q: String(inquiry.id).slice(0, 8),
        manualJobSuccess: "AnyJob Select job posted.",
      });
    }

    return NextResponse.json({ ok: true, inquiryId: inquiry.id });
  } catch (error) {
    console.error("Manual AnyJob Select job creation failed:", error);
    return NextResponse.json({ error: "Failed to create manual job" }, { status: 500 });
  }
}
