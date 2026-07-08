import { NextRequest, NextResponse } from "next/server";

import { invokeEmailFunction } from "@/lib/notifications/email-functions";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    const result = await invokeEmailFunction({
      functionName: "forgot-password",
      payload: {
        tenantSlug: "default",
        email,
      },
      useServiceRole: true,
    });

    if (!result.ok) {
      console.error("Forgot password function failed:", result);
      return NextResponse.json(
        {
          ok: true,
          emailQueued: false,
          message: "If an AnyJob account exists for this email, a reset link will be sent when email delivery is available.",
        },
        { status: 202 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: "If an AnyJob account exists for this email, a reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password request failed:", error);
    return NextResponse.json({ error: "Password reset email could not be sent." }, { status: 500 });
  }
}
