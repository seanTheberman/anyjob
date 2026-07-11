"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ArrowLeft, Loader2, ShieldAlert } from "lucide-react";
import { SHIFT_NICHES, WORK_TYPES, getShiftNiche } from "@/lib/shift-work";

type BusinessProfile = {
  id: string;
  business_name: string;
  status: string;
  industry: string;
  contact_name: string;
  contact_phone: string;
  address: string;
  city: string;
  postal_code?: string | null;
};

type BusinessPostForm = {
  workType: string;
  niche: string;
  industry: string;
  roleTitle: string;
  description: string;
  locationName: string;
  address: string;
  city: string;
  postalCode: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  headcount: string;
  hourlyRate: string;
  dayRate: string;
  acceptsWorkerRateVariation: boolean;
  requirements: string;
  uniform: string;
  breakPolicy: string;
  contactName: string;
  contactPhone: string;
};

export default function NewBusinessPostPage() {
  const router = useRouter();
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<BusinessPostForm>({
    workType: "part_time_day_wage",
    niche: SHIFT_NICHES[0].value,
    industry: SHIFT_NICHES[0].industry,
    roleTitle: SHIFT_NICHES[0].roles[0],
    description: "",
    locationName: "",
    address: "",
    city: "",
    postalCode: "",
    startDate: "",
    startTime: "09:00",
    endDate: "",
    endTime: "17:00",
    headcount: "1",
    hourlyRate: String(SHIFT_NICHES[0].hourlyAverage),
    dayRate: String(SHIFT_NICHES[0].dayAverage),
    acceptsWorkerRateVariation: true,
    requirements: "",
    uniform: "",
    breakPolicy: "",
    contactName: "",
    contactPhone: "",
  });

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/business/register");
      if (response.ok) {
        const payload = await response.json();
        const profile = payload.business || null;
        setBusiness(profile);
        if (profile) {
          setFormData((current) => ({
            ...current,
            industry: profile.industry || current.industry,
            address: profile.address || current.address,
            city: profile.city || current.city,
            postalCode: profile.postal_code || current.postalCode,
            contactName: profile.contact_name || current.contactName,
            contactPhone: profile.contact_phone || current.contactPhone,
          }));
        }
      }
      setLoading(false);
    }
    load();
  }, []);

  const selectedNiche = useMemo(() => getShiftNiche(formData.niche), [formData.niche]);

  function updateField(field: string, value: string | boolean) {
    setFormData((current) => ({ ...current, [field]: value }));
    setError(null);
  }

  function handleNicheChange(value: string) {
    const niche = getShiftNiche(value);
    setFormData((current) => ({
      ...current,
      niche: niche.value,
      industry: niche.industry,
      roleTitle: niche.roles[0],
      hourlyRate: String(niche.hourlyAverage),
      dayRate: String(niche.dayAverage),
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const submittedForm = new FormData(event.currentTarget);
    const formText = (field: keyof BusinessPostForm) => {
      const value = submittedForm.get(field);
      return typeof value === "string" ? value.trim() : "";
    };
    const submitPayload: BusinessPostForm = {
      ...formData,
      niche: formText("niche") || formData.niche,
      roleTitle: formText("roleTitle") || formData.roleTitle,
      description: formText("description") || formData.description,
      locationName: formText("locationName") || formData.locationName,
      address: formText("address") || formData.address,
      city: formText("city") || formData.city,
      postalCode: formText("postalCode") || formData.postalCode,
      startDate: formText("startDate") || formData.startDate,
      startTime: formText("startTime") || formData.startTime,
      endDate: formText("endDate") || formData.endDate || formText("startDate") || formData.startDate,
      endTime: formText("endTime") || formData.endTime,
      headcount: formText("headcount") || formData.headcount,
      hourlyRate: formText("hourlyRate") || formData.hourlyRate,
      dayRate: formText("dayRate") || formData.dayRate,
      acceptsWorkerRateVariation: submittedForm.get("acceptsWorkerRateVariation") === "on",
      requirements: formText("requirements") || formData.requirements,
      uniform: formText("uniform") || formData.uniform,
      breakPolicy: formText("breakPolicy") || formData.breakPolicy,
    };

    try {
      const response = await fetch("/api/business/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitPayload),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload.error || "Unable to create business post");
        return;
      }
      router.push("/dashboard/business");
      router.refresh();
    } catch {
      setError("Unable to create business post");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center rounded-lg border border-gray-200 bg-white p-6 text-gray-600">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading posting access...
        </div>
      </DashboardLayout>
    );
  }

  if (!business || business.status !== "approved") {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-2xl rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-900">
          <ShieldAlert className="mb-3 h-7 w-7" />
          <h1 className="text-xl font-bold">Business approval required</h1>
          <p className="mt-2 text-sm">Admin must approve your business registration number and business document before you can post any business job or shift.</p>
          <div className="mt-5 flex gap-3">
            <Link href="/register-business" className="rounded-lg bg-amber-900 px-4 py-2 text-sm font-semibold text-white">
              View registration
            </Link>
            <Link href="/admin/businesses" className="rounded-lg border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-900">
              Admin review
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl">
        <Link href="/dashboard/business" className="mb-4 inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-950">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to business
        </Link>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-950">Post business work</h1>
          <p className="mt-1 text-sm text-gray-600">Choose the work type first so AnyJob can route it to the right provider pool.</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="grid gap-3 md:grid-cols-3">
            {WORK_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => updateField("workType", type.value)}
                className={`rounded-lg border p-4 text-left ${
                  formData.workType === type.value ? "border-red-600 bg-red-50 ring-2 ring-red-100" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <span className="block text-sm font-bold text-gray-950">{type.label}</span>
                <span className="mt-1 block text-xs text-gray-600">
                  {type.value === "freelance_service" ? "A business service request for freelancers." : type.value === "part_time_day_wage" ? "Short day-wage staffing." : "Recurring or longer shift staffing."}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-gray-700">Worker niche *</span>
              <select name="niche" value={formData.niche} onChange={(e) => handleNicheChange(e.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2">
                {SHIFT_NICHES.map((niche) => <option key={niche.value} value={niche.value}>{niche.label}</option>)}
              </select>
              <span className="mt-1 block text-xs text-gray-500">Only matching shift workers will see this business shift job.</span>
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-gray-700">Role *</span>
              <select name="roleTitle" value={formData.roleTitle} onChange={(e) => updateField("roleTitle", e.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2">
                {selectedNiche.roles.map((role) => <option key={role} value={role}>{role}</option>)}
              </select>
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm font-semibold text-gray-700">Description *</span>
              <textarea name="description" value={formData.description} onChange={(e) => updateField("description", e.target.value)} rows={5} className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2" required placeholder="Describe duties, expectations, experience, and any must-have requirements." />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-gray-700">Location name</span>
              <input name="locationName" value={formData.locationName} onChange={(e) => updateField("locationName", e.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="Main venue, ward, store, warehouse..." />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-gray-700">Headcount *</span>
              <input name="headcount" type="number" min="1" value={formData.headcount} onChange={(e) => updateField("headcount", e.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2" required />
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm font-semibold text-gray-700">Address *</span>
              <input name="address" value={formData.address} onChange={(e) => updateField("address", e.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2" required />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-gray-700">City *</span>
              <input name="city" value={formData.city} onChange={(e) => updateField("city", e.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2" required />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-gray-700">Eircode</span>
              <input name="postalCode" value={formData.postalCode} onChange={(e) => updateField("postalCode", e.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2" />
            </label>
          </div>

          {formData.workType !== "freelance_service" ? (
            <div className="mt-6 grid gap-5 rounded-lg border border-gray-200 bg-gray-50 p-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Start date *</span>
                <input name="startDate" type="date" value={formData.startDate} onChange={(e) => updateField("startDate", e.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2" required />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Start time *</span>
                <input name="startTime" type="time" value={formData.startTime} onChange={(e) => updateField("startTime", e.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2" required />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">End date</span>
                <input name="endDate" type="date" value={formData.endDate} onChange={(e) => updateField("endDate", e.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2" />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">End time *</span>
                <input name="endTime" type="time" value={formData.endTime} onChange={(e) => updateField("endTime", e.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2" required />
              </label>
            </div>
          ) : null}

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-gray-700">Preferred hourly rate</span>
              <input name="hourlyRate" type="number" min="1" value={formData.hourlyRate} onChange={(e) => updateField("hourlyRate", e.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2" />
              <span className="mt-1 block text-xs text-gray-500">Market average for {selectedNiche.label}: €{selectedNiche.hourlyAverage}/hour</span>
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-gray-700">Preferred day rate</span>
              <input name="dayRate" type="number" min="1" value={formData.dayRate} onChange={(e) => updateField("dayRate", e.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2" />
              <span className="mt-1 block text-xs text-gray-500">Market average for {selectedNiche.label}: €{selectedNiche.dayAverage}/day</span>
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-700 md:col-span-2">
              <input name="acceptsWorkerRateVariation" type="checkbox" checked={formData.acceptsWorkerRateVariation} onChange={(e) => updateField("acceptsWorkerRateVariation", e.target.checked)} />
              Accept worker fee variations above or below this preferred rate
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-gray-700">Requirements</span>
              <textarea name="requirements" value={formData.requirements} onChange={(e) => updateField("requirements", e.target.value)} rows={3} className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2" />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-gray-700">Uniform/equipment</span>
              <textarea name="uniform" value={formData.uniform} onChange={(e) => updateField("uniform", e.target.value)} rows={3} className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2" />
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm font-semibold text-gray-700">Break policy</span>
              <input name="breakPolicy" value={formData.breakPolicy} onChange={(e) => updateField("breakPolicy", e.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2" />
            </label>
          </div>

          {error ? <div className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

          <div className="mt-6 flex justify-end">
            <button disabled={submitting} className="inline-flex items-center rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Post business work
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
