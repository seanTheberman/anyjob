import { NextResponse } from "next/server";

import { getProviderInsuranceNotice } from "@/lib/safety/insurance-notice-settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const notice = await getProviderInsuranceNotice();

  return NextResponse.json(notice, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
