"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Building2,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  FileCheck2,
  FileUp,
  MapPin,
  Loader2,
  ShieldCheck,
  Users,
  WalletCards,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SHIFT_NICHES, WORK_TYPES } from "@/lib/shift-work";

type BusinessProfile = {
  id: string;
  business_name: string;
  registration_number: string;
  status: string;
  rejection_reason?: string | null;
};

const EUROPE_BUSINESS_DOCUMENTS = [
  {
    key: "registration",
    label: "Company registration / Kbis / Companies House / Handelsregister",
    help: "Official company certificate, business register extract, or self-employed registration proof.",
    required: true,
  },
  {
    key: "tax",
    label: "VAT / tax number / SIRET / UTR proof",
    help: "VAT certificate, tax office proof, SIREN/SIRET evidence, UTR, Steuernummer, or equivalent.",
    required: false,
  },
  {
    key: "insurance",
    label: "Professional liability / public liability insurance",
    help: "Insurance certificate for the business, especially for services carried out at client sites.",
    required: false,
  },
  {
    key: "license",
    label: "Trade license / regulated activity permit",
    help: "Required where applicable for healthcare, security, transport, childcare, food service, or other regulated work.",
    required: false,
  },
  {
    key: "representative",
    label: "Director / owner / authorized representative ID",
    help: "Passport, national ID, residence permit, or signed authorization for the business representative.",
    required: false,
  },
  {
    key: "address",
    label: "Business address proof / lease / utility / bank letter",
    help: "Official correspondence, utility bill, lease, bank letter, or other proof of operating address.",
    required: false,
  },
] as const;

type BusinessDocumentKey = (typeof EUROPE_BUSINESS_DOCUMENTS)[number]["key"];
type BusinessDocumentRecord = Record<BusinessDocumentKey, string>;

type BusinessRegistrationForm = {
  businessName: string;
  legalName: string;
  registrationNumber: string;
  businessType: string;
  industry: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  documentLinks: BusinessDocumentRecord;
  documentDataUrls: BusinessDocumentRecord;
  documentFileNames: BusinessDocumentRecord;
  typicalWorkTypes: string[];
  typicalRolesNeeded: string[];
  customRoleInput: string;
  expectedWorkerCount: string;
  workerPlan: string;
};

const BUSINESS_TYPES = ["Hospital", "Restaurant", "Retail store", "Cleaning company", "Events company", "Warehouse", "Office", "Other"];
const TOTAL_STEPS = 5;

const BUSINESS_STEPS = [
  {
    icon: ClipboardList,
    title: "Choose work type",
    text: "Tell AnyJob whether your company needs a one-off business service, day-wage staffing, long-duration shift cover, or a mix of all three.",
    detail: "This decides which posting tools open after approval and how providers see your work.",
  },
  {
    icon: Users,
    title: "Match by niche",
    text: "Pick your industry, common roles, expected worker count, and staffing plan so irrelevant providers are filtered out before you post.",
    detail: "Hospitals can reach healthcare workers, restaurants can reach kitchen and service staff, and cleaning companies can reach cleaners.",
  },
  {
    icon: ShieldCheck,
    title: "Verify business",
    text: "Submit business identity details and a document so admins can approve the account before posting is unlocked.",
    detail: "Approval keeps business shift posts tied to a real company contact, location, and registration record.",
  },
];

const BUSINESS_OVERVIEW = [
  {
    icon: BriefcaseBusiness,
    title: "What a business account is for",
    text: "Use this when a company, clinic, restaurant, shop, warehouse, venue, agency, or office needs to hire providers under the business name instead of a personal buyer account.",
  },
  {
    icon: CalendarClock,
    title: "What you can post after approval",
    text: "Approved businesses can post freelance service requests, same-day or short day-wage shifts, and longer assignments where the same workers may be needed repeatedly.",
  },
  {
    icon: BadgeCheck,
    title: "Why approval is required",
    text: "Admins check the registration number, document, location, and business contact so workers know the opportunity is coming from a verified workplace.",
  },
  {
    icon: WalletCards,
    title: "How the work flow works",
    text: "After approval, you post the work, matching providers apply or are invited, you agree on the fee and schedule, then completion and payment records stay tied to the business account.",
  },
];

const WORK_TYPE_EXPLAINERS = [
  {
    title: "Freelance business service",
    text: "Best for outcome-based work such as design, admin help, marketing, maintenance, cleaning contracts, repairs, or other services where you need a finished result.",
  },
  {
    title: "Part-time day wage",
    text: "Best for urgent or short staffing needs such as one-day cover, event support, kitchen help, reception support, movers, cleaners, or warehouse help.",
  },
  {
    title: "Long-duration shift",
    text: "Best when your business needs the same type of worker over many days or weeks, such as healthcare cover, recurring cleaning, retail shifts, or regular office support.",
  },
];

const APPROVAL_REQUIREMENTS = [
  "Business display name and legal or registered name",
  "Registration number or official business identifier",
  "Primary contact person, phone, email, address, and city",
  "Industry, role categories, worker count, and typical staffing plan",
  "Company registration plus any VAT/tax, insurance, license, representative ID, or address proof available",
];

function emptyDocumentRecord(): BusinessDocumentRecord {
  return EUROPE_BUSINESS_DOCUMENTS.reduce((record, document) => {
    record[document.key] = "";
    return record;
  }, {} as BusinessDocumentRecord);
}

function defaultForm(): BusinessRegistrationForm {
  return {
    businessName: "",
    legalName: "",
    registrationNumber: "",
    businessType: BUSINESS_TYPES[0],
    industry: SHIFT_NICHES[0].industry,
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "France",
    documentLinks: emptyDocumentRecord(),
    documentDataUrls: emptyDocumentRecord(),
    documentFileNames: emptyDocumentRecord(),
    typicalWorkTypes: ["part_time_day_wage", "long_duration_shift"],
    typicalRolesNeeded: SHIFT_NICHES[0].roles.slice(0, 2),
    customRoleInput: "",
    expectedWorkerCount: "2",
    workerPlan: "",
  };
}

function hasRequiredBusinessDocument(formData: BusinessRegistrationForm) {
  return Boolean(formData.documentLinks.registration.trim() || formData.documentDataUrls.registration);
}

function buildBusinessDocuments(formData: BusinessRegistrationForm) {
  return EUROPE_BUSINESS_DOCUMENTS.map((document) => ({
    type: document.key,
    label: document.label,
    required: document.required,
    link: formData.documentLinks[document.key].trim(),
    upload: formData.documentDataUrls[document.key]
      ? {
          fileName: formData.documentFileNames[document.key],
          dataUrl: formData.documentDataUrls[document.key],
        }
      : null,
  })).filter((document) => document.link || document.upload);
}

export default function RegisterBusinessPage() {
  const router = useRouter();
  const supabase = createClient();
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [existingBusiness, setExistingBusiness] = useState<BusinessProfile | null>(null);
  const [loadingBusiness, setLoadingBusiness] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<BusinessRegistrationForm>(defaultForm);

  const selectedNiche = useMemo(
    () => SHIFT_NICHES.find((item) => item.industry === formData.industry) || SHIFT_NICHES[0],
    [formData.industry]
  );

  useEffect(() => {
    async function load() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        setIsAuthenticated(Boolean(user));
        if (user?.email) {
          setFormData((current) => ({ ...current, contactEmail: current.contactEmail || user.email || "" }));
        }

        if (!user) return;

        const response = await fetch("/api/business/register");
        if (response.ok) {
          const payload = await response.json();
          setExistingBusiness(payload.business || null);
        }
      } catch (loadError) {
        console.error("Business registration status lookup failed:", loadError);
        setError("We could not load your business status. You can still continue the registration questionnaire.");
      } finally {
        setAuthLoading(false);
        setLoadingBusiness(false);
      }
    }

    load();
  }, [supabase]);

  function updateField(field: keyof BusinessRegistrationForm, value: string | string[]) {
    setFormData((current) => ({ ...current, [field]: value }));
    setError(null);
    setMessage(null);
  }

  function updateDocumentLink(key: BusinessDocumentKey, value: string) {
    setFormData((current) => ({
      ...current,
      documentLinks: { ...current.documentLinks, [key]: value },
    }));
    setError(null);
    setMessage(null);
  }

  function toggleWorkType(value: string) {
    setFormData((current) => {
      const typicalWorkTypes = current.typicalWorkTypes.includes(value)
        ? current.typicalWorkTypes.filter((item) => item !== value)
        : [...current.typicalWorkTypes, value];
      return { ...current, typicalWorkTypes };
    });
  }

  function toggleRole(value: string) {
    setFormData((current) => {
      const typicalRolesNeeded = current.typicalRolesNeeded.includes(value)
        ? current.typicalRolesNeeded.filter((item) => item !== value)
        : [...current.typicalRolesNeeded, value];
      return { ...current, typicalRolesNeeded };
    });
  }

  function addCustomRole() {
    const role = formData.customRoleInput.trim();
    if (!role) return;
    setFormData((current) => ({
      ...current,
      typicalRolesNeeded: current.typicalRolesNeeded.includes(role)
        ? current.typicalRolesNeeded
        : [...current.typicalRolesNeeded, role],
      customRoleInput: "",
    }));
    setError(null);
    setMessage(null);
  }

  function handleIndustryChange(value: string) {
    const niche = SHIFT_NICHES.find((item) => item.industry === value) || SHIFT_NICHES[0];
    setFormData((current) => ({
      ...current,
      industry: niche.industry,
      typicalRolesNeeded: niche.roles.slice(0, 2),
    }));
  }

  function handleFileUpload(key: BusinessDocumentKey, event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["application/pdf", "image/jpeg", "image/png"].includes(file.type)) {
      setError("Upload a PDF, JPG, or PNG business document.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFormData((current) => ({
        ...current,
        documentDataUrls: { ...current.documentDataUrls, [key]: typeof reader.result === "string" ? reader.result : "" },
        documentFileNames: { ...current.documentFileNames, [key]: file.name },
      }));
    };
    reader.readAsDataURL(file);
  }

  function validateStep(step = currentStep) {
    if (step === 1) return formData.typicalWorkTypes.length > 0;
    if (step === 2) return Boolean(formData.industry && formData.typicalRolesNeeded.length && Number(formData.expectedWorkerCount) > 0);
    if (step === 3) return Boolean(formData.businessName && formData.registrationNumber && formData.businessType);
    if (step === 4) return Boolean(formData.contactName && formData.contactEmail && formData.contactPhone && formData.address && formData.city);
    if (step === 5) return hasRequiredBusinessDocument(formData);
    return true;
  }

  function goNext() {
    if (!validateStep()) {
      setError("Complete the required fields before continuing.");
      return;
    }
    setError(null);
    setCurrentStep((step) => Math.min(step + 1, TOTAL_STEPS));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validateStep(5)) {
      setError("Company registration / Kbis / Companies House document is required before admin review.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/business/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, documents: buildBusinessDocuments(formData) }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(payload.error || "Business registration failed");
        return;
      }

      setExistingBusiness(payload.business);
      setMessage("Business registration submitted. Admin approval is required before posting jobs or shifts.");
      router.refresh();
    } catch {
      setError("Business registration failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || loadingBusiness) {
    return (
      <main className="min-h-screen bg-gray-50 pt-28">
        <div className="mx-auto flex max-w-xl items-center justify-center px-4 py-20 text-gray-600">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading business registration...
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-white pt-24">
        <BusinessHero />
        <BusinessExplanation />
        <div className="mx-auto max-w-xl px-4 py-12">
          <div className="rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm">
            <Building2 className="mx-auto mb-4 h-10 w-10 text-red-600" />
            <h1 className="text-2xl font-bold text-gray-950">Create or sign in to register a business</h1>
            <p className="mt-2 text-sm text-gray-600">
              Business registration is saved to a business owner account before admin review.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/login?redirect=/register-business" className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                Login
              </Link>
              <Link href="/business-signup?redirect=/register-business" className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
                Create business account
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (existingBusiness) {
    return (
      <main className="min-h-screen bg-gray-50 pt-28">
        <div className="mx-auto max-w-2xl px-4 py-12">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-1 h-6 w-6 text-emerald-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-950">{existingBusiness.business_name}</h1>
                <p className="mt-1 text-sm text-gray-600">Registration number: {existingBusiness.registration_number}</p>
                <p className="mt-4 inline-flex rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-800">
                  Status: {existingBusiness.status}
                </p>
                {existingBusiness.rejection_reason ? (
                  <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{existingBusiness.rejection_reason}</p>
                ) : null}
                <p className="mt-4 text-sm text-gray-600">
                  Admin approval is required before this business can post freelance, day-wage, or long-duration shift jobs.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href="/dashboard/business" className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
                    Business dashboard
                  </Link>
                  <Link href="/admin/businesses" className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                    Admin review
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white pt-24">
      <BusinessHero />
      <BusinessExplanation />
      <section className="bg-white py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-wide text-red-600">How registration works</p>
            <h2 className="mt-2 text-3xl font-bold text-gray-950">A short approval flow before business posting opens</h2>
            <p className="mt-3 leading-7 text-gray-600">
              AnyJob asks for enough detail to route work to the correct provider marketplace and to help admins confirm that
              the account belongs to a real business. Once approved, your dashboard can be used to create business posts,
              review provider matches, and manage shift or service requests.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {BUSINESS_STEPS.map((step) => (
              <div key={step.title} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600">
                  <step.icon className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-bold text-gray-950">{step.title}</h2>
                <p className="mt-2 text-sm leading-6 text-gray-600">{step.text}</p>
                <p className="mt-3 text-sm leading-6 text-gray-500">{step.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-950">Business registration questionnaire</h2>
            <p className="mt-2 text-gray-600">
              Tell AnyJob what kind of workers you need, where the work happens, and who admins should contact.
              Approval unlocks business posting, provider browsing, and matching by industry niche.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <Progress step={currentStep} />
            <RegistrationRequirements />

            {currentStep === 1 ? (
              <StepWorkType formData={formData} toggleWorkType={toggleWorkType} />
            ) : null}
            {currentStep === 2 ? (
              <StepWorkerMatch
                formData={formData}
                selectedNiche={selectedNiche}
                updateField={updateField}
                handleIndustryChange={handleIndustryChange}
                toggleRole={toggleRole}
                addCustomRole={addCustomRole}
              />
            ) : null}
            {currentStep === 3 ? (
              <StepBusinessDetails formData={formData} updateField={updateField} />
            ) : null}
            {currentStep === 4 ? (
              <StepContact formData={formData} updateField={updateField} />
            ) : null}
            {currentStep === 5 ? (
              <StepDocuments formData={formData} handleFileUpload={handleFileUpload} updateDocumentLink={updateDocumentLink} />
            ) : null}

            {error ? <div className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
            {message ? <div className="mt-5 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div> : null}

            <div className="mt-8 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep((step) => Math.max(step - 1, 1))}
                disabled={currentStep === 1 || submitting}
                className="inline-flex items-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </button>
              {currentStep < TOTAL_STEPS ? (
                <button type="button" onClick={goNext} className="inline-flex items-center rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700">
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              ) : (
                <button disabled={submitting} className="inline-flex items-center rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Submit for admin approval
                </button>
              )}
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}

function BusinessHero() {
  return (
    <section className="bg-[#f5f5f5] py-14">
      <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="relative order-2 aspect-[4/3] overflow-hidden rounded-lg lg:order-1">
          <Image
            src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1200&auto=format&fit=crop"
            alt="Business team planning staffing"
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="order-1 lg:order-2">
          <p className="text-sm font-bold uppercase tracking-wide text-red-600">Register as a business</p>
          <h1 className="mt-3 text-4xl font-bold text-gray-900 sm:text-5xl">Post work to the right provider pool</h1>
          <p className="mt-5 text-lg leading-8 text-gray-600">
            Register once, get admin approved, then post freelance business jobs, day-wage work, or long-duration shifts.
            AnyJob routes shift jobs only to providers whose niche matches your business.
          </p>
          <div className="mt-6 grid gap-3 text-sm text-gray-700">
            <HeroPoint icon={MapPin} text="Add your business location so nearby providers understand where the work is based." />
            <HeroPoint icon={CreditCard} text="Keep business work, agreed fees, completion records, and future posts under one company account." />
          </div>
          <div className="mt-6 rounded-lg bg-white p-5 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-3">
              <Stat label="Work types" value="3" />
              <Stat label="Admin check" value="Required" />
              <Stat label="Worker match" value="By niche" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function BusinessExplanation() {
  return (
    <section className="bg-white py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-wide text-red-600">Before you register</p>
          <h2 className="mt-2 text-3xl font-bold text-gray-950">What businesses can do on AnyJob</h2>
          <p className="mt-3 leading-7 text-gray-600">
            A business registration is different from a normal buyer account. It is for companies that need to hire
            verified providers for operational work, repeat staffing, urgent cover, or professional services under a
            business profile that admins can review.
          </p>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {BUSINESS_OVERVIEW.map((item) => (
            <div key={item.title} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-950">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-gray-600">{item.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
            <h3 className="text-lg font-bold text-gray-950">The three posting modes explained</h3>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {WORK_TYPE_EXPLAINERS.map((item) => (
                <div key={item.title} className="rounded-lg border border-gray-200 bg-white p-4">
                  <p className="text-sm font-bold text-gray-950">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-gray-600">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex items-start gap-3">
              <FileCheck2 className="mt-1 h-5 w-5 shrink-0 text-emerald-700" />
              <div>
                <h3 className="text-lg font-bold text-emerald-950">What approval unlocks</h3>
                <p className="mt-2 text-sm leading-6 text-emerald-900">
                  After admin approval, your business can post work, use the business dashboard, receive provider
                  matches by niche, and keep each request connected to the approved company profile.
                </p>
                <p className="mt-3 text-sm leading-6 text-emerald-900">
                  If admins need more proof, the status page will show the reason so you can update the registration.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function RegistrationRequirements() {
  return (
    <div className="mb-8 rounded-lg border border-blue-100 bg-blue-50 p-4">
      <div className="flex items-start gap-3">
        <FileCheck2 className="mt-1 h-5 w-5 shrink-0 text-blue-700" />
        <div>
          <h3 className="text-sm font-bold text-blue-950">Have these details ready</h3>
          <div className="mt-3 grid gap-2 text-sm leading-6 text-blue-900 md:grid-cols-2">
            {APPROVAL_REQUIREMENTS.map((item) => (
              <div key={item} className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroPoint({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
      <span className="leading-6">{text}</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-2xl font-bold text-gray-950">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}

function Progress({ step }: { step: number }) {
  return (
    <div className="mb-8">
      <div className="mb-3 flex items-center justify-between text-sm font-semibold text-gray-600">
        <span>Step {step} of {TOTAL_STEPS}</span>
        <span>{Math.round((step / TOTAL_STEPS) * 100)}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-red-600 transition-all" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
      </div>
    </div>
  );
}

function StepWorkType({ formData, toggleWorkType }: { formData: BusinessRegistrationForm; toggleWorkType: (value: string) => void }) {
  return (
    <div>
      <h3 className="text-xl font-bold text-gray-950">What kind of work will this business post?</h3>
      <p className="mt-2 text-sm leading-6 text-gray-600">
        Choose all that apply. This tells AnyJob which posting tools your business needs and which provider marketplace
        surfaces should show your work after approval.
      </p>
      <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm leading-6 text-gray-600">
        You can select more than one. For example, a restaurant may need freelance menu design, same-day wait staff,
        and longer kitchen cover. AnyJob keeps those as separate posting modes so providers see work that fits how they
        operate.
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {WORK_TYPES.map((type) => (
          <button
            key={type.value}
            type="button"
            onClick={() => toggleWorkType(type.value)}
            className={`rounded-lg border p-4 text-left ${
              formData.typicalWorkTypes.includes(type.value) ? "border-red-600 bg-red-50 ring-2 ring-red-100" : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <span className="block text-sm font-bold text-gray-950">{type.label}</span>
            <span className="mt-2 block text-xs leading-5 text-gray-600">
              {type.value === "freelance_service"
                ? "For one-off business service requests handled by freelancers."
                : type.value === "part_time_day_wage"
                  ? "For short staffing needs paid by the day or shift."
                  : "For recurring or longer assignments shown to matching shift workers."}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepWorkerMatch({
  formData,
  selectedNiche,
  updateField,
  handleIndustryChange,
  toggleRole,
  addCustomRole,
}: {
  formData: BusinessRegistrationForm;
  selectedNiche: (typeof SHIFT_NICHES)[number];
  updateField: (field: keyof BusinessRegistrationForm, value: string | string[]) => void;
  handleIndustryChange: (value: string) => void;
  toggleRole: (value: string) => void;
  addCustomRole: () => void;
}) {
  return (
    <div>
      <h3 className="text-xl font-bold text-gray-950">Which provider niche should receive your work?</h3>
      <p className="mt-2 text-sm leading-6 text-gray-600">
        This is how AnyJob prevents irrelevant providers from seeing business shift jobs. A hospital, for example, routes
        to healthcare workers, while a cleaning company routes to cleaning providers.
      </p>
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold text-gray-700">Business industry *</span>
          <select value={formData.industry} onChange={(event) => handleIndustryChange(event.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2">
            {SHIFT_NICHES.map((niche) => <option key={niche.value} value={niche.industry}>{niche.industry}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-gray-700">How many workers do you usually need? *</span>
          <input type="number" min="1" value={formData.expectedWorkerCount} onChange={(event) => updateField("expectedWorkerCount", event.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2" />
        </label>
      </div>
      <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <p className="text-sm font-semibold text-gray-800">Typical roles needed *</p>
        <p className="mt-1 text-sm leading-6 text-gray-600">
          Select the roles you usually need so the business profile can pre-filter provider matches when you create a
          shift or staffing post.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedNiche.roles.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => toggleRole(role)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
                formData.typicalRolesNeeded.includes(role) ? "border-red-600 bg-red-600 text-white" : "border-gray-200 bg-white text-gray-700"
              }`}
            >
              {role}
            </button>
          ))}
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
          <input
            value={formData.customRoleInput}
            onChange={(event) => updateField("customRoleInput", event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addCustomRole();
              }
            }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
            placeholder="Write any role you need..."
          />
          <button
            type="button"
            onClick={addCustomRole}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
          >
            Add role
          </button>
        </div>
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Selected roles</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {formData.typicalRolesNeeded.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => toggleRole(role)}
                className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
              >
                {role} ×
              </button>
            ))}
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-500">Market average: EUR {selectedNiche.hourlyAverage}/hour or EUR {selectedNiche.dayAverage}/day. Workers can accept, increase, or decrease their own preferred fee.</p>
      </div>
      <label className="mt-6 block">
        <span className="text-sm font-semibold text-gray-700">List the individuals or worker profile you need</span>
        <textarea
          value={formData.workerPlan}
          onChange={(event) => updateField("workerPlan", event.target.value)}
          rows={4}
          className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2"
          placeholder="Example: 2 care assistants for night shifts, 1 hospital porter for weekends, backup workers for urgent cover..."
        />
      </label>
      <div className="mt-4 rounded-lg border border-red-100 bg-red-50 p-4 text-sm leading-6 text-red-900">
        Be specific about shift length, certifications, language needs, uniform or equipment expectations, and whether
        you need backup workers. Better details create better matches after approval.
      </div>
    </div>
  );
}

function StepBusinessDetails({ formData, updateField }: { formData: BusinessRegistrationForm; updateField: (field: keyof BusinessRegistrationForm, value: string | string[]) => void }) {
  return (
    <div>
      <h3 className="text-xl font-bold text-gray-950">Business details</h3>
      <p className="mt-2 text-sm leading-6 text-gray-600">
        Admin reviews the business identity before job or shift posting is unlocked. Use the public business name workers
        will recognize, and add the legal name if it is different from the brand name.
      </p>
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold text-gray-700">Business name *</span>
          <input value={formData.businessName} onChange={(event) => updateField("businessName", event.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2" />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-gray-700">Legal name</span>
          <input value={formData.legalName} onChange={(event) => updateField("legalName", event.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2" />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-gray-700">Business registration number *</span>
          <input value={formData.registrationNumber} onChange={(event) => updateField("registrationNumber", event.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2" />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-gray-700">Business type *</span>
          <select value={formData.businessType} onChange={(event) => updateField("businessType", event.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2">
            {BUSINESS_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </label>
      </div>
      <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        The registration number should match the verification document you upload in the final step. If the number and
        document do not match, admins may ask for a corrected document before approving the account.
      </div>
    </div>
  );
}

function StepContact({ formData, updateField }: { formData: BusinessRegistrationForm; updateField: (field: keyof BusinessRegistrationForm, value: string | string[]) => void }) {
  return (
    <div>
      <h3 className="text-xl font-bold text-gray-950">Contact and location</h3>
      <p className="mt-2 text-sm leading-6 text-gray-600">
        AnyJob uses this contact for admin review and future business work posts. Workers do not need this full review
        contact on the marketplace card, but admins need a reachable person for account approval.
      </p>
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold text-gray-700">Contact name *</span>
          <input value={formData.contactName} onChange={(event) => updateField("contactName", event.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2" />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-gray-700">Contact email *</span>
          <input type="email" value={formData.contactEmail} onChange={(event) => updateField("contactEmail", event.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2" />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-gray-700">Contact phone *</span>
          <input value={formData.contactPhone} onChange={(event) => updateField("contactPhone", event.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2" />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-gray-700">Country</span>
          <input value={formData.country} onChange={(event) => updateField("country", event.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2" />
        </label>
        <label className="block md:col-span-2">
          <span className="text-sm font-semibold text-gray-700">Business address *</span>
          <input value={formData.address} onChange={(event) => updateField("address", event.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2" />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-gray-700">City *</span>
          <input value={formData.city} onChange={(event) => updateField("city", event.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2" />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-gray-700">Postal code</span>
          <input value={formData.postalCode} onChange={(event) => updateField("postalCode", event.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2" />
        </label>
      </div>
      <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm leading-6 text-gray-600">
        Add the main work location, not only the billing office, if providers usually need to arrive on site. You can
        still create future posts with different addresses after the business account is approved.
      </div>
    </div>
  );
}

function StepDocuments({
  formData,
  handleFileUpload,
  updateDocumentLink,
}: {
  formData: BusinessRegistrationForm;
  handleFileUpload: (key: BusinessDocumentKey, event: React.ChangeEvent<HTMLInputElement>) => void;
  updateDocumentLink: (key: BusinessDocumentKey, value: string) => void;
}) {
  const submittedDocuments = buildBusinessDocuments(formData);

  return (
    <div>
      <h3 className="text-xl font-bold text-gray-950">Business verification documents</h3>
      <p className="mt-2 text-sm leading-6 text-gray-600">
        Add the documents admins normally need for Europe-based businesses. The registration document is required; the
        other fields help verify tax, insurance, licensing, identity, and address where applicable.
      </p>
      <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 text-amber-700" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-950">Company registration document required before admin review</p>
            <p className="mt-1 text-sm leading-6 text-amber-900">
              Upload a PDF/JPG/PNG or paste a secure document link for each proof you have.
            </p>
          </div>
        </div>
      </div>
      <div className="mt-5 grid gap-4">
        {EUROPE_BUSINESS_DOCUMENTS.map((document) => (
          <div key={document.key} className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-gray-950">{document.label}</p>
                <p className="mt-1 text-sm leading-6 text-gray-600">{document.help}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${document.required ? "bg-red-50 text-red-700" : "bg-gray-100 text-gray-600"}`}>
                {document.required ? "Required" : "Recommended"}
              </span>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Document link</span>
                <input
                  type="url"
                  value={formData.documentLinks[document.key]}
                  onChange={(event) => updateDocumentLink(document.key, event.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2"
                  placeholder="https://example.com/business-document.pdf"
                />
              </label>
              <label className="flex min-h-20 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 px-5 py-4 text-center text-sm font-semibold text-gray-700 hover:bg-gray-100">
                <FileUp className="mb-2 h-5 w-5" />
                Upload document
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" onChange={(event) => handleFileUpload(document.key, event)} />
                {formData.documentFileNames[document.key] ? (
                  <span className="mt-2 max-w-48 break-all text-xs font-medium text-emerald-700">{formData.documentFileNames[document.key]}</span>
                ) : null}
              </label>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <p className="text-sm font-bold text-gray-950">Review summary</p>
        <dl className="mt-3 grid gap-3 text-sm md:grid-cols-2">
          <div><dt className="text-gray-500">Business</dt><dd className="font-semibold text-gray-950">{formData.businessName || "Not set"}</dd></div>
          <div><dt className="text-gray-500">Work types</dt><dd className="font-semibold text-gray-950">{formData.typicalWorkTypes.length} selected</dd></div>
          <div><dt className="text-gray-500">Industry</dt><dd className="font-semibold text-gray-950">{formData.industry}</dd></div>
          <div><dt className="text-gray-500">Roles</dt><dd className="font-semibold text-gray-950">{formData.typicalRolesNeeded.join(", ") || "Not set"}</dd></div>
          <div className="md:col-span-2">
            <dt className="text-gray-500">Documents added</dt>
            <dd className="font-semibold text-gray-950">
              {submittedDocuments.length ? submittedDocuments.map((document) => document.label).join(" / ") : "None yet"}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
