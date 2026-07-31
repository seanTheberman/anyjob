import Link from "next/link";
import { CheckCircle2, CreditCard, MailCheck } from "lucide-react";

export const dynamic = "force-dynamic";

function messageFor(status: string) {
  if (status === "paid") {
    return {
      title: "Payment received",
      body: "Your selected quote is confirmed. AnyJob admin has been notified and the provider can now coordinate the job.",
      icon: CheckCircle2,
    };
  }
  if (status === "selected") {
    return {
      title: "Quote choice sent",
      body: "Your quote choice has been sent to AnyJob admin. You can pay now to start the job and confirm the provider.",
      icon: MailCheck,
    };
  }
  if (status === "cancelled") {
    return {
      title: "Payment cancelled",
      body: "No payment was taken. Your quote choice is still saved, and you can return to payment when ready.",
      icon: CreditCard,
    };
  }
  return {
    title: "We could not confirm this quote link",
    body: "This link may be expired, already used, or no longer available. AnyJob admin can resend the quote if needed.",
    icon: MailCheck,
  };
}

export default async function AnyJobSelectThankYouPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params = (await searchParams) || {};
  const status = typeof params.status === "string" ? params.status : "";
  const token = typeof params.token === "string" ? params.token : "";
  const job = typeof params.job === "string" ? params.job : "";
  const copy = messageFor(status);
  const Icon = copy.icon;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-16">
      <section className="mx-auto max-w-xl rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
          <Icon className="h-8 w-8" />
        </div>
        <p className="mt-6 text-sm font-black uppercase tracking-wide text-red-600">AnyJob Select</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">{copy.title}</h1>
        <p className="mt-4 text-base leading-7 text-slate-600">{copy.body}</p>
        {job ? <p className="mt-3 text-sm font-bold text-slate-500">Reference: {job}</p> : null}

        <div className="mt-8 flex flex-col gap-3">
          {token && status !== "paid" && status !== "invalid" ? (
            <Link
              href={`/api/payments/anyjob-select-quote-checkout?token=${encodeURIComponent(token)}`}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-red-600 px-5 text-sm font-black text-white hover:bg-red-700"
            >
              <CreditCard className="h-4 w-4" />
              Pay to start the job
            </Link>
          ) : null}
          <Link href="/" className="inline-flex h-12 items-center justify-center rounded-full border border-slate-200 px-5 text-sm font-black text-slate-700 hover:bg-slate-50">
            Back to AnyJob
          </Link>
        </div>
      </section>
    </main>
  );
}
