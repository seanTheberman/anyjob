"use client";

import Image from "next/image";
import { PhoneCall, Zap } from "lucide-react";

const ANYJOB_EMERGENCY_PHONE = "+448001234567";
const ANYJOB_EMERGENCY_DISPLAY = "+44 800 123 4567";

const EMERGENCY_SERVICES = [
  {
    title: "Emergency move",
    description: "Last-minute loading, lifting, and moving help.",
    image: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?q=80&w=900&auto=format&fit=crop",
  },
  {
    title: "Emergency cleaning",
    description: "Same-day cleanup after spills, guests, or incidents.",
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=900&auto=format&fit=crop",
  },
  {
    title: "Emergency repair",
    description: "Urgent help for leaks, fixtures, and small repairs.",
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=900&auto=format&fit=crop",
  },
];

const EMERGENCY_STEPS = [
  ["1", "Call AnyJob", "Use the emergency line directly."],
  ["2", "We match fast", "We find an available provider fast."],
  ["3", "Get contacts", "Start quickly with contact details."],
] as const;

export function EmergencyJobsSection() {
  return (
    <section className="mx-auto w-full max-w-[58rem] overflow-hidden rounded-3xl bg-gray-950 text-white shadow-2xl">
      <div className="grid gap-0 lg:grid-cols-[40%_60%]">
        <div className="relative min-h-[20rem] p-6 sm:p-8 lg:min-h-[28rem] lg:p-9">
          <Image
            src="https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?q=80&w=1400&auto=format&fit=crop"
            alt="Emergency home service dispatch"
            fill
            sizes="(max-width: 1024px) 100vw, 45vw"
            className="object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/80 to-gray-950/30" />
          <div className="relative z-10 flex min-h-[inherit] flex-col justify-between">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-red-500/20 px-4 py-2 text-sm font-bold text-red-100 ring-1 ring-red-300/20">
                <Zap className="h-4 w-4" />
                Emergency jobs
              </div>
              <h2 className="max-w-[320px] text-3xl font-extrabold leading-tight sm:text-4xl lg:text-[2.9rem]">
                Need someone urgently?
              </h2>
              <p className="mt-5 max-w-[330px] text-sm leading-6 text-gray-200 sm:text-base">
                Skip the questionnaire. Call AnyJob and we dispatch the best available provider immediately.
              </p>
            </div>
            <a
              href={`tel:${ANYJOB_EMERGENCY_PHONE}`}
              className="mt-6 inline-flex w-fit items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-gray-950 transition hover:bg-gray-100"
            >
              <PhoneCall className="h-4 w-4" />
              Call {ANYJOB_EMERGENCY_DISPLAY}
            </a>
          </div>
        </div>

        <div className="bg-gray-950 p-4 sm:p-5 lg:p-6">
          <div className="grid gap-3 sm:grid-cols-3">
            {EMERGENCY_STEPS.map(([number, title, detail]) => (
              <div key={number} className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-sm font-extrabold text-white">
                  {number}
                </div>
                <h3 className="text-sm font-extrabold">{title}</h3>
                <p className="mt-1.5 text-xs leading-4 text-gray-300">{detail}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3">
            {EMERGENCY_SERVICES.map((service) => (
              <a
                key={service.title}
                href={`tel:${ANYJOB_EMERGENCY_PHONE}`}
                className="group grid gap-3 overflow-hidden rounded-2xl bg-white/10 p-2.5 ring-1 ring-white/10 transition hover:bg-white/15 sm:grid-cols-[88px_1fr_auto] sm:items-center"
              >
                <div className="relative h-24 overflow-hidden rounded-xl sm:h-16">
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    sizes="88px"
                    className="object-cover transition duration-700 group-hover:scale-105"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold">{service.title}</h3>
                  <p className="mt-1 text-xs leading-4 text-gray-300">{service.description}</p>
                </div>
                <span className="inline-flex items-center whitespace-nowrap text-sm font-bold text-red-200">
                  Call now <PhoneCall className="ml-2 h-4 w-4" />
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
