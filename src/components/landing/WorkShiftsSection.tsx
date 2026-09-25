import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, CalendarClock, Users } from "lucide-react";

const shiftBenefits = [
  {
    icon: CalendarClock,
    title: "Post the shift",
    text: "Add the role, date, hours, location, and rate.",
  },
  {
    icon: Users,
    title: "Reach matching workers",
    text: "Your shift is shown to Jobbers with the right niche and availability.",
  },
  {
    icon: BriefcaseBusiness,
    title: "Choose your team",
    text: "Review applicants and confirm the people you want to hire.",
  },
];

export function WorkShiftsSection() {
  return (
    <section className="border-y border-slate-200 bg-slate-950 px-4 py-14 text-white sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-300">Work shifts</p>
          <h2 className="mt-3 text-3xl font-extrabold leading-tight sm:text-4xl">
            Need extra people for a shift?
          </h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">
            Hire hourly, daily, temporary, or recurring help without mixing shift work with one-off service jobs.
          </p>
          <Link
            href="/register-business"
            className="mt-7 inline-flex items-center rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700"
          >
            Hire for shifts
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {shiftBenefits.map(({ icon: Icon, title, text }) => (
            <article key={title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <Icon className="h-6 w-6 text-red-300" aria-hidden="true" />
              <h3 className="mt-4 font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
