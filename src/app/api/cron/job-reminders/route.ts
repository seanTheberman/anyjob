import { NextRequest, NextResponse } from "next/server";

import { notifyJobEvent } from "@/lib/notifications/email-functions";

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await notifyJobEvent({
    action: "process_live_job_reminders",
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error || "Reminder job failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true, result: result.body });
}
