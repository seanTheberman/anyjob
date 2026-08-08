import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const auth = await createServerSupabaseClient();
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = createAdminSupabaseClient() as never as {
    from(table: string): any;
  };
  const [buyer, seller, files] = await Promise.all([
    admin
      .from("buyers")
      .select(
        "kyc_status,id_document_url,selfie_video_url,email_verified,phone_verified",
      )
      .eq("id", user.id)
      .maybeSingle(),
    admin
      .from("sellers")
      .select(
        "status,id_document_url,selfie_video_url,insurance_document_url,email_verified,phone_verified",
      )
      .eq("id", user.id)
      .maybeSingle(),
    admin
      .from("user_images")
      .select("id,image_type,title,created_at")
      .eq("user_id", user.id)
      .in("image_type", ["id_document", "selfie_video"])
      .order("created_at", { ascending: false }),
  ]);
  const row = seller.data || buyer.data || {};
  const approved = seller.data
    ? row.status === "approved"
    : row.kyc_status === "approved";
  const identityFiles =
    files.data?.filter((file: any) => file.image_type === "id_document") || [];
  const frontFile =
    identityFiles.find((file: any) =>
      String(file.title || "")
        .toLowerCase()
        .includes("front"),
    ) || identityFiles[0];
  const backFile =
    identityFiles.find((file: any) =>
      String(file.title || "")
        .toLowerCase()
        .includes("back"),
    ) || identityFiles.find((file: any) => file.id !== frontFile?.id);
  return NextResponse.json({
    verification: {
      approved,
      status: seller.data ? row.status : row.kyc_status,
      emailVerified: Boolean(row.email_verified || user.email_confirmed_at),
      phoneVerified: Boolean(row.phone_verified),
      idUploaded: Boolean(row.id_document_url || identityFiles.length),
      idFrontUploaded: Boolean(row.id_document_url || frontFile),
      idBackUploaded: Boolean(row.id_document_url || backFile),
      selfieUploaded: Boolean(
        row.selfie_video_url ||
        files.data?.some((file: any) => file.image_type === "selfie_video"),
      ),
      insuranceUploaded: seller.data
        ? Boolean(row.insurance_document_url)
        : undefined,
    },
    files: files.data || [],
  });
}

export async function PATCH(request: NextRequest) {
  const auth = await createServerSupabaseClient();
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as {
    kind?: unknown;
    url?: unknown;
  };
  const kind = String(body.kind || "");
  const url = String(body.url || "").trim();
  if (kind !== "insurance" || !/^https:\/\//i.test(url))
    return NextResponse.json(
      { error: "A valid insurance document URL is required" },
      { status: 400 },
    );
  const admin = createAdminSupabaseClient() as never as {
    from(table: string): any;
  };
  const { error } = await admin
    .from("sellers")
    .update({
      insurance_document_url: url,
      verification_status: "pending",
      kyc_submitted_at: new Date().toISOString(),
    })
    .eq("id", user.id);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
