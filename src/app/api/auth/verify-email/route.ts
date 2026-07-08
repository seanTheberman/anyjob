import { NextRequest, NextResponse } from "next/server";

import { invokeEmailFunction } from "@/lib/notifications/email-functions";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const token = typeof body.token === "string" ? body.token.trim() : "";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !token) {
      return NextResponse.json({ error: "Verification link is invalid." }, { status: 400 });
    }

    const result = await invokeEmailFunction({
      functionName: "email-verification",
      payload: {
        tenantSlug: "default",
        action: "confirm",
        email,
        token,
      },
      useServiceRole: true,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error || "Email could not be verified." }, { status: 502 });
    }

    return NextResponse.json({ ok: true, message: "Email verified successfully." });
  } catch (error) {
    console.error("Verify email request failed:", error);
    return NextResponse.json({ error: "Email could not be verified." }, { status: 500 });
  }
}
