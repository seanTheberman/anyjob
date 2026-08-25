import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Direct payment has moved to the full request flow. Send the provider your requirements first; payment unlocks after they accept and quote.",
      requestFlow: "/questionnaire",
    },
    { status: 410 },
  );
}
