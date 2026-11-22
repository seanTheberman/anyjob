import { NextRequest, NextResponse } from "next/server";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PAYMENT_RESULTS = new Set(["cancelled", "failed"]);

export async function GET(request: NextRequest) {
  const inquiryId = request.nextUrl.searchParams.get("inquiry_id") || "";
  const requestedResult = request.nextUrl.searchParams.get("payment") || "cancelled";
  const payment = PAYMENT_RESULTS.has(requestedResult) ? requestedResult : "cancelled";

  if (!UUID_PATTERN.test(inquiryId)) {
    return NextResponse.json({ error: "Invalid inquiry" }, { status: 400 });
  }

  const location = `anyjob://requests/${encodeURIComponent(inquiryId)}?payment=${encodeURIComponent(payment)}`;
  return new NextResponse(null, { status: 302, headers: { Location: location } });
}
