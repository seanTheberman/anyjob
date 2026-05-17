import { redirect } from "next/navigation";

export default function NewBookingPage({
  searchParams,
}: {
  searchParams: Promise<{ inquiry?: string; provider?: string }>;
}) {
  return searchParams.then((params) => {
    const query = new URLSearchParams();

    if (params.inquiry) query.set("inquiry", params.inquiry);
    if (params.provider) query.set("provider", params.provider);

    redirect(`/dashboard/bookings/new${query.size ? `?${query.toString()}` : ""}`);
  });
}
