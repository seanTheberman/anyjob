"use client";

import { Suspense, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Building2, Eye, EyeOff, FileUp, Loader2, ShieldCheck } from "lucide-react";

import { SHIFT_NICHES, WORK_TYPES } from "@/lib/shift-work";
import { createClient } from "@/lib/supabase/client";
import { useMobileCameraCapture } from "@/hooks/useMobileCameraCapture";

const BUSINESS_TYPES = ["Hospital", "Restaurant", "Retail store", "Cleaning company", "Events company", "Warehouse", "Office", "Other"];
const TOTAL_STEPS = 5;
const IRELAND_BUSINESS_DOCUMENTS = [
  {
    key: "registration",
    label: "Company registration / CRO certificate",
    help: "Companies Registration Office certificate, business name registration, or self-employed registration proof.",
    required: true,
  },
  {
    key: "tax",
    label: "VAT / tax registration proof",
    help: "Irish VAT certificate, Revenue registration proof, tax reference evidence, or equivalent.",
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
    help: "Required where applicable in Ireland for healthcare, security, transport, childcare, food service, or other regulated work.",
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

type BusinessDocumentKey = (typeof IRELAND_BUSINESS_DOCUMENTS)[number]["key"];
type BusinessDocumentRecord = Record<BusinessDocumentKey, string>;

type BusinessSignupForm = {
  businessName: string;
  legalName: string;
  registrationNumber: string;
  businessType: string;
  industry: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  password: string;
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

function emptyDocumentRecord(): BusinessDocumentRecord {
  return IRELAND_BUSINESS_DOCUMENTS.reduce((record, document) => {
    record[document.key] = "";
    return record;
  }, {} as BusinessDocumentRecord);
}

function initialForm(): BusinessSignupForm {
  return {
    businessName: "",
    legalName: "",
    registrationNumber: "",
    businessType: BUSINESS_TYPES[0],
    industry: SHIFT_NICHES[0].industry,
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    password: "",
    address: "",
    city: "",
    postalCode: "",
    country: "Ireland",
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

function hasRequiredBusinessDocument(form: BusinessSignupForm) {
  return Boolean(form.documentLinks.registration.trim() || form.documentDataUrls.registration);
}

function buildBusinessDocuments(form: BusinessSignupForm) {
  return IRELAND_BUSINESS_DOCUMENTS.map((document) => ({
    type: document.key,
    label: document.label,
    required: document.required,
    link: form.documentLinks[document.key].trim(),
    upload: form.documentDataUrls[document.key]
      ? {
          fileName: form.documentFileNames[document.key],
          dataUrl: form.documentDataUrls[document.key],
        }
      : null,
  })).filter((document) => document.link || document.upload);
}

function safeRedirect(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/dashboard/business";
  return value;
}

function splitContactName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || "Business",
    lastName: parts.slice(1).join(" "),
  };
}

function BusinessSignupContent() {
  const searchParams = useSearchParams();
  const redirectTarget = safeRedirect(searchParams.get("redirect"));
  const supabase = createClient();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<BusinessSignupForm>(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isMobileCamera, requestingCameraPermission, cameraError, requestCameraCapture } = useMobileCameraCapture();

  const selectedNiche = useMemo(
    () => SHIFT_NICHES.find((item) => item.industry === form.industry) || SHIFT_NICHES[0],
    [form.industry]
  );

  function updateField(field: keyof BusinessSignupForm, value: string | string[]) {
    setForm((current) => ({ ...current, [field]: value }));
    setError(null);
  }

  function updateDocumentLink(key: BusinessDocumentKey, value: string) {
    setForm((current) => ({
      ...current,
      documentLinks: { ...current.documentLinks, [key]: value },
    }));
    setError(null);
  }

  function toggleWorkType(value: string) {
    setForm((current) => ({
      ...current,
      typicalWorkTypes: current.typicalWorkTypes.includes(value)
        ? current.typicalWorkTypes.filter((item) => item !== value)
        : [...current.typicalWorkTypes, value],
    }));
  }

  function handleIndustryChange(value: string) {
    const niche = SHIFT_NICHES.find((item) => item.industry === value) || SHIFT_NICHES[0];
    setForm((current) => ({
      ...current,
      industry: niche.industry,
      typicalRolesNeeded: niche.roles.slice(0, 2),
    }));
  }

  function toggleRole(value: string) {
    setForm((current) => ({
      ...current,
      typicalRolesNeeded: current.typicalRolesNeeded.includes(value)
        ? current.typicalRolesNeeded.filter((item) => item !== value)
        : [...current.typicalRolesNeeded, value],
    }));
  }

  function addCustomRole() {
    const role = form.customRoleInput.trim();
    if (!role) return;
    setForm((current) => ({
      ...current,
      typicalRolesNeeded: current.typicalRolesNeeded.includes(role)
        ? current.typicalRolesNeeded
        : [...current.typicalRolesNeeded, role],
      customRoleInput: "",
    }));
    setError(null);
  }

  function handleFileUpload(key: BusinessDocumentKey, event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Upload a PDF, JPG, PNG, or WebP business document.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setForm((current) => ({
        ...current,
        documentDataUrls: { ...current.documentDataUrls, [key]: typeof reader.result === "string" ? reader.result : "" },
        documentFileNames: { ...current.documentFileNames, [key]: file.name },
      }));
    };
    reader.readAsDataURL(file);
  }

  function validateStep(currentStep = step) {
    if (currentStep === 1) return form.typicalWorkTypes.length > 0;
    if (currentStep === 2) return Boolean(form.industry && form.typicalRolesNeeded.length && Number(form.expectedWorkerCount) > 0);
    if (currentStep === 3) return Boolean(form.businessName && form.registrationNumber && form.businessType);
    if (currentStep === 4) {
      return Boolean(
        form.contactName &&
        form.contactEmail.includes("@") &&
        form.contactPhone &&
        form.address &&
        form.city &&
        form.password.length >= 6
      );
    }
    if (currentStep === 5) return hasRequiredBusinessDocument(form);
    return true;
  }

  function goNext() {
    if (!validateStep()) {
      setError("Complete the required fields before continuing.");
      return;
    }
    setError(null);
    setStep((current) => Math.min(current + 1, TOTAL_STEPS));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validateStep(5)) {
      setError("Company registration / CRO certificate is required before admin review.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const cleanEmail = form.contactEmail.trim().toLowerCase();
    const { firstName, lastName } = splitContactName(form.contactName);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: form.password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            role: "client",
            business_onboarding: true,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (data.user) {
        const { error: profileError } = await supabase
          .from("eloo_profiles")
          .upsert({
            id: data.user.id,
            role: "client",
            first_name: firstName,
            last_name: lastName,
            email: cleanEmail,
            phone: form.contactPhone,
            has_business_profile: false,
            business_registration_status: "not_started",
            updated_at: new Date().toISOString(),
          }, { onConflict: "id" });

        if (profileError) {
          setError(profileError.message);
          return;
        }
      }

      const response = await fetch("/api/business/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, contactEmail: cleanEmail, documents: buildBusinessDocuments(form) }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(payload.error || "Business registration failed");
        return;
      }

      window.location.href = redirectTarget;
    } catch {
      setError("Business registration failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <Image
            src="/anyjoblogo-removebg-preview.png"
            alt="AnyJob"
            width={145}
            height={53}
            priority
            className="mx-auto h-14 w-auto"
          />
          <p className="mt-3 text-sm font-bold uppercase tracking-wide text-red-600">Create business account</p>
          <h1 className="mt-2 text-3xl font-bold text-gray-950">Register your business for work shifts</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-gray-600">
            One flow creates the business owner account and submits the business registration. Your contact email becomes the login email, so there is no duplicate credential step.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <Progress step={step} />

          {step === 1 ? <WorkTypeStep form={form} toggleWorkType={toggleWorkType} /> : null}
          {step === 2 ? (
            <WorkerMatchStep
              form={form}
              selectedNiche={selectedNiche}
              updateField={updateField}
              handleIndustryChange={handleIndustryChange}
              toggleRole={toggleRole}
              addCustomRole={addCustomRole}
            />
          ) : null}
          {step === 3 ? <BusinessDetailsStep form={form} updateField={updateField} /> : null}
          {step === 4 ? (
            <ContactStep
              form={form}
              updateField={updateField}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
            />
          ) : null}
          {step === 5 ? (
            <DocumentsStep
              form={form}
              updateDocumentLink={updateDocumentLink}
              handleFileUpload={handleFileUpload}
              isMobileCamera={isMobileCamera}
              requestingCameraPermission={requestingCameraPermission}
              cameraError={cameraError}
              requestCameraCapture={requestCameraCapture}
            />
          ) : null}

          {error ? <div className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

          <div className="mt-8 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep((current) => Math.max(current - 1, 1))}
              disabled={step === 1 || submitting}
              className="inline-flex items-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </button>
            {step < TOTAL_STEPS ? (
              <button type="button" onClick={goNext} className="inline-flex items-center rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700">
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            ) : (
              <button disabled={submitting} className="inline-flex items-center rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create account and submit
              </button>
            )}
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have a business account?{" "}
          <Link href="/login?redirect=/register-business" className="font-semibold text-red-600 hover:text-red-700">
            Sign in
          </Link>
        </p>
      </div>
    </main>
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

function WorkTypeStep({ form, toggleWorkType }: { form: BusinessSignupForm; toggleWorkType: (value: string) => void }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-950">What kind of work will this business post?</h2>
      <p className="mt-2 text-sm leading-6 text-gray-600">Choose all that apply.</p>
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {WORK_TYPES.map((type) => (
          <button
            key={type.value}
            type="button"
            onClick={() => toggleWorkType(type.value)}
            className={`rounded-lg border p-4 text-left ${form.typicalWorkTypes.includes(type.value) ? "border-red-600 bg-red-50 ring-2 ring-red-100" : "border-gray-200 hover:border-gray-300"}`}
          >
            <span className="block text-sm font-bold text-gray-950">{type.label}</span>
            <span className="mt-2 block text-xs leading-5 text-gray-600">
              {type.value === "freelance_service" ? "Business service work." : type.value === "part_time_day_wage" ? "Short day-wage staffing." : "Recurring or longer shift staffing."}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function WorkerMatchStep({
  form,
  selectedNiche,
  updateField,
  handleIndustryChange,
  toggleRole,
  addCustomRole,
}: {
  form: BusinessSignupForm;
  selectedNiche: (typeof SHIFT_NICHES)[number];
  updateField: (field: keyof BusinessSignupForm, value: string | string[]) => void;
  handleIndustryChange: (value: string) => void;
  toggleRole: (value: string) => void;
  addCustomRole: () => void;
}) {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-950">Which provider niche should receive your work?</h2>
      <p className="mt-2 text-sm leading-6 text-gray-600">This routes shift posts to matching workers.</p>
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold text-gray-700">Business industry *</span>
          <select value={form.industry} onChange={(event) => handleIndustryChange(event.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2">
            {SHIFT_NICHES.map((niche) => <option key={niche.value} value={niche.industry}>{niche.industry}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-gray-700">How many workers do you usually need? *</span>
          <input type="number" min="1" value={form.expectedWorkerCount} onChange={(event) => updateField("expectedWorkerCount", event.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2" />
        </label>
      </div>
      <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <p className="text-sm font-semibold text-gray-800">Typical roles needed *</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedNiche.roles.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => toggleRole(role)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium ${form.typicalRolesNeeded.includes(role) ? "border-red-600 bg-red-600 text-white" : "border-gray-200 bg-white text-gray-700"}`}
            >
              {role}
            </button>
          ))}
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
          <input
            value={form.customRoleInput}
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
            {form.typicalRolesNeeded.map((role) => (
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
      </div>
      <label className="mt-6 block">
        <span className="text-sm font-semibold text-gray-700">Worker plan</span>
        <textarea value={form.workerPlan} onChange={(event) => updateField("workerPlan", event.target.value)} rows={4} className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2" />
      </label>
    </div>
  );
}

function BusinessDetailsStep({ form, updateField }: { form: BusinessSignupForm; updateField: (field: keyof BusinessSignupForm, value: string | string[]) => void }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-950">Business details</h2>
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold text-gray-700">Business name *</span>
          <input value={form.businessName} onChange={(event) => updateField("businessName", event.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2" />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-gray-700">Legal name</span>
          <input value={form.legalName} onChange={(event) => updateField("legalName", event.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2" />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-gray-700">Business registration number *</span>
          <input value={form.registrationNumber} onChange={(event) => updateField("registrationNumber", event.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2" />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-gray-700">Business type *</span>
          <select value={form.businessType} onChange={(event) => updateField("businessType", event.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2">
            {BUSINESS_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </label>
      </div>
    </div>
  );
}

function ContactStep({
  form,
  updateField,
  showPassword,
  setShowPassword,
}: {
  form: BusinessSignupForm;
  updateField: (field: keyof BusinessSignupForm, value: string | string[]) => void;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
}) {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-950">Contact, location, and account access</h2>
      <p className="mt-2 text-sm leading-6 text-gray-600">
        The contact email becomes the business account login email. No separate email/name form is needed.
      </p>
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold text-gray-700">Contact name *</span>
          <input value={form.contactName} onChange={(event) => updateField("contactName", event.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2" />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-gray-700">Contact email / login email *</span>
          <input type="email" value={form.contactEmail} onChange={(event) => updateField("contactEmail", event.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2" />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-gray-700">Contact phone *</span>
          <input value={form.contactPhone} onChange={(event) => updateField("contactPhone", event.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="+353 87 123 4567" />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-gray-700">Password for this business account *</span>
          <div className="relative mt-2">
            <input type={showPassword ? "text" : "password"} value={form.password} onChange={(event) => updateField("password", event.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700" aria-label={showPassword ? "Hide password" : "Show password"}>
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </label>
        <label className="block md:col-span-2">
          <span className="text-sm font-semibold text-gray-700">Business address *</span>
          <input value={form.address} onChange={(event) => updateField("address", event.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="12 O'Connell Street, Dublin 1" />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-gray-700">City *</span>
          <input value={form.city} onChange={(event) => updateField("city", event.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="Dublin" />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-gray-700">Eircode</span>
          <input value={form.postalCode} onChange={(event) => updateField("postalCode", event.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="D01 F5P2" />
        </label>
      </div>
    </div>
  );
}

function DocumentsStep({
  form,
  updateDocumentLink,
  handleFileUpload,
  isMobileCamera,
  requestingCameraPermission,
  cameraError,
  requestCameraCapture,
}: {
  form: BusinessSignupForm;
  updateDocumentLink: (key: BusinessDocumentKey, value: string) => void;
  handleFileUpload: (key: BusinessDocumentKey, event: React.ChangeEvent<HTMLInputElement>) => void;
  isMobileCamera: boolean;
  requestingCameraPermission: boolean;
  cameraError: string | null;
  requestCameraCapture: (captureMode: "user" | "environment", openCaptureInput: () => void) => Promise<boolean>;
}) {
  const submittedDocuments = buildBusinessDocuments(form);

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-950">Business verification documents</h2>
      <p className="mt-2 text-sm leading-6 text-gray-600">
        Add the documents admins normally need for Ireland-based businesses. The registration document is required; the
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
        {IRELAND_BUSINESS_DOCUMENTS.map((document) => (
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
                  value={form.documentLinks[document.key]}
                  onChange={(event) => updateDocumentLink(document.key, event.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2"
                  placeholder="https://example.com/business-document.pdf"
                />
              </label>
              <div className="grid gap-2">
                <label className="flex min-h-20 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 px-5 py-4 text-center text-sm font-semibold text-gray-700 hover:bg-gray-100">
                  <FileUp className="mb-2 h-5 w-5" />
                  Upload document
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="sr-only" onChange={(event) => handleFileUpload(document.key, event)} />
                  {form.documentFileNames[document.key] ? (
                    <span className="mt-2 max-w-48 break-all text-xs font-medium text-emerald-700">{form.documentFileNames[document.key]}</span>
                  ) : null}
                </label>
                {isMobileCamera ? (
                  <label
                    onClick={(event) => {
                      event.preventDefault();
                      if (requestingCameraPermission) return;
                      const input = event.currentTarget.querySelector("input") as HTMLInputElement | null;
                      void requestCameraCapture("environment", () => input?.click());
                    }}
                    className="flex cursor-pointer items-center justify-center rounded-lg border border-red-100 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                  >
                    {requestingCameraPermission ? "Allow camera..." : "Capture with camera"}
                    <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(event) => handleFileUpload(document.key, event)} />
                  </label>
                ) : null}
              </div>
            </div>
          </div>
        ))}
        {cameraError ? <p className="text-sm font-semibold text-red-600">{cameraError}</p> : null}
      </div>
      <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm">
        <p className="font-bold text-gray-950">Review summary</p>
        <p className="mt-2 text-gray-600">{form.businessName || "Business name not set"} · {form.industry} · {form.contactEmail || "Email not set"}</p>
        <p className="mt-2 text-gray-600">
          Documents added: {submittedDocuments.length ? submittedDocuments.map((document) => document.label).join(" / ") : "None yet"}
        </p>
      </div>
    </div>
  );
}

export default function BusinessSignupPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <BusinessSignupContent />
    </Suspense>
  );
}
