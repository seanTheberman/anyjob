import { NextRequest, NextResponse } from "next/server";
import { getFastAuthUser } from "@/lib/auth/fast-user";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const REPORT_REASONS = new Set([
  "harassment",
  "scam_or_fraud",
  "inappropriate_content",
  "safety_concern",
  "other",
]);

function clean(value: unknown, maxLength = 1000) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

async function authenticatedUser() {
  const auth = await createServerSupabaseClient();
  return getFastAuthUser(auth);
}

function untypedDatabase() {
  return createAdminSupabaseClient() as never as { from(table: string): any };
}

export async function GET() {
  const user = await authenticatedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await untypedDatabase()
    .from("user_blocks")
    .select("blocked_user_id,created_at")
    .eq("blocker_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ blocks: data || [] });
}

export async function POST(request: NextRequest) {
  const user = await authenticatedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const action = clean(body.action, 20);
  const targetUserId = clean(body.targetUserId, 80);
  if (!targetUserId || targetUserId === user.id) {
    return NextResponse.json({ error: "Choose another user." }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  const { data: target } = await admin.auth.admin.getUserById(targetUserId);
  if (!target.user) return NextResponse.json({ error: "User not found." }, { status: 404 });

  if (action === "block") {
    const { error } = await untypedDatabase().from("user_blocks").upsert({
      blocker_id: user.id,
      blocked_user_id: targetUserId,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, blocked: true });
  }

  if (action !== "report") {
    return NextResponse.json({ error: "Invalid safety action." }, { status: 400 });
  }

  const reason = clean(body.reason, 40);
  if (!REPORT_REASONS.has(reason)) {
    return NextResponse.json({ error: "Choose a report reason." }, { status: 400 });
  }

  const conversationId = clean(body.conversationId, 80) || null;
  if (conversationId) {
    const { data: conversation } = await untypedDatabase()
      .from("eloo_conversations")
      .select("id,client_id,provider_id")
      .eq("id", conversationId)
      .maybeSingle();
    if (
      !conversation ||
      ![conversation.client_id, conversation.provider_id].includes(user.id) ||
      ![conversation.client_id, conversation.provider_id].includes(targetUserId)
    ) {
      return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    }
  }

  const { data, error } = await untypedDatabase()
    .from("user_safety_reports")
    .insert({
      reporter_id: user.id,
      reported_user_id: targetUserId,
      reason,
      details: clean(body.details, 2000) || null,
      conversation_id: conversationId,
      source_path: clean(body.sourcePath, 300) || null,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, reportId: data.id }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const user = await authenticatedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const targetUserId = clean(new URL(request.url).searchParams.get("targetUserId"), 80);
  if (!targetUserId) return NextResponse.json({ error: "User is required." }, { status: 400 });

  const { error } = await untypedDatabase()
    .from("user_blocks")
    .delete()
    .eq("blocker_id", user.id)
    .eq("blocked_user_id", targetUserId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, blocked: false });
}
