import { NextRequest, NextResponse } from "next/server";

import { invokeEmailFunction } from "@/lib/notifications/email-functions";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const token = typeof body.token === "string" ? body.token.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !token) {
      return NextResponse.json({ error: "Reset link is invalid." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long." }, { status: 400 });
    }

    const result = await invokeEmailFunction({
      functionName: "reset-password",
      payload: {
        tenantSlug: "default",
        email,
        token,
        password,
      },
      useServiceRole: true,
    });

    if (!result.ok) {
      console.error("Reset password function failed:", result);
      return NextResponse.json({ error: result.error || "Password could not be reset." }, { status: 502 });
    }

    return NextResponse.json({ ok: true, message: "Password reset successful." });
  } catch (error) {
    console.error("Reset password request failed:", error);
    return NextResponse.json({ error: "Password could not be reset." }, { status: 500 });
  }
}
