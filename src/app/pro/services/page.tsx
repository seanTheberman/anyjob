"use client";

import { CATEGORIES } from "@/lib/categories";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  CircleDollarSign,
  Eye,
  FileQuestion,
  ImagePlus,
  Loader2,
  Plus,
  Save,
  Search,
  Sparkles,
  Trash2,
  Video,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useMobileCameraCapture } from "@/hooks/useMobileCameraCapture";

type GigPackage = {
  tier: "starter" | "standard" | "premium";
  title: string;
  description: string;
  price: number;
  deliveryDays: number;
  revisions: number;
};

type GigFaq = {
  question: string;
  answer: string;
};

type GigMediaFile = {
  id: string;
  image_url: string;
  public_id?: string;
  image_type: string;
  title?: string | null;
  description?: string | null;
};

type GigDetails = {
  category?: string;
  packages: GigPackage[];
  faqs: GigFaq[];
  mediaUrls: string[];
  mediaFiles?: GigMediaFile[];
  videoUrl: string;
  videoFile?: GigMediaFile | null;
  requirementQuestions: string[];
};

type GigService = {
  id: string;
  title: string;
  description: string;
  hourly_rate: number;
  min_hours: number | null;
  max_radius_km: number | null;
  is_active: boolean | null;
  tags: string[] | null;
  gig_details?: GigDetails | null;
  created_at?: string | null;
};

type GigDraft = {
  id?: string;
  title: string;
  category: string;
  description: string;
  hourlyRate: number;
  minHours: number;
  maxRadiusKm: number;
  keywords: string;
  isActive: boolean;
  packages: GigPackage[];
  faqs: GigFaq[];
  mediaUrls: string[];
  mediaFiles: Array<GigMediaFile | null>;
  videoUrl: string;
  videoFile: GigMediaFile | null;
  requirementQuestions: string[];
};

type GigStepId = "overview" | "pricing" | "media" | "faq" | "requirements" | "review";

const packageDefaults: GigPackage[] = [
  {
    tier: "starter",
    title: "Starter",
    description: "Small, focused version of this service.",
    price: 45,
    deliveryDays: 1,
    revisions: 0,
  },
  {
    tier: "standard",
    title: "Standard",
    description: "Most common package with the core job completed.",
    price: 90,
    deliveryDays: 2,
    revisions: 1,
  },
  {
    tier: "premium",
    title: "Premium",
    description: "Larger or more complete version with extra time included.",
    price: 160,
    deliveryDays: 4,
    revisions: 2,
  },
];

const blankDraft: GigDraft = {
  title: "",
  category: "",
  description: "",
  hourlyRate: 25,
  minHours: 1,
  maxRadiusKm: 25,
  keywords: "",
  isActive: true,
  packages: packageDefaults,
  faqs: [
    { question: "What is included in this gig?", answer: "The package includes the work described above. Any extra materials or special requests are confirmed before the order starts." },
  ],
  mediaUrls: ["", "", "", ""],
  mediaFiles: [null, null, null, null],
  videoUrl: "",
  videoFile: null,
  requirementQuestions: [
    "What exactly do you need done?",
    "Where is the work located?",
    "Do you have photos, measurements, access notes, or timing constraints?",
  ],
};

function withPackageFallback(details?: GigDetails | null) {
  return packageDefaults.map((fallback, index) => ({
    ...fallback,
    ...(details?.packages?.[index] || {}),
    tier: fallback.tier,
  }));
}

function withMediaFallback(details?: GigDetails | null) {
  return [...(details?.mediaUrls || details?.mediaFiles?.map((item) => item.image_url) || []), "", "", "", ""].slice(0, 4);
}

function withMediaFilesFallback(details?: GigDetails | null) {
  return [...(details?.mediaFiles || []), null, null, null, null].slice(0, 4);
}

function draftFromService(service: GigService): GigDraft {
  const tags = service.tags || [];
  const details = service.gig_details || null;
  return {
    ...blankDraft,
    id: service.id,
    title: service.title || "",
    category: details?.category || "",
    description: service.description || "",
    hourlyRate: Number(service.hourly_rate || 25),
    minHours: Number(service.min_hours || 1),
    maxRadiusKm: Number(service.max_radius_km || 25),
    keywords: tags.join(", "),
    isActive: service.is_active !== false,
    packages: withPackageFallback(details),
    faqs: (details?.faqs?.length ? details.faqs : blankDraft.faqs).slice(0, 10),
    mediaUrls: withMediaFallback(details),
    mediaFiles: withMediaFilesFallback(details),
    videoUrl: details?.videoUrl || "",
    videoFile: details?.videoFile || null,
    requirementQuestions: (details?.requirementQuestions?.length ? details.requirementQuestions : blankDraft.requirementQuestions).slice(0, 10),
  };
}

function keywords(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function characterHint(value: string, max: number) {
  return `${value.length}/${max}`;
}

export default function ServicesPage() {
  const [services, setServices] = useState<GigService[]>([]);
  const [draft, setDraft] = useState<GigDraft>(blankDraft);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<GigStepId>("overview");
  const { isMobileCamera, requestingCameraPermission, cameraError, requestCameraCapture } = useMobileCameraCapture();

  const activeServices = useMemo(() => services.filter((service) => service.is_active !== false), [services]);
  const inactiveServices = useMemo(() => services.filter((service) => service.is_active === false), [services]);
  const currentKeywords = keywords(draft.keywords);
  const steps = useMemo(() => [
    { id: "overview" as const, label: "Overview", done: Boolean(draft.title.trim()) && draft.description.trim().length >= 80 && currentKeywords.length >= 3 },
    { id: "pricing" as const, label: "Packages", done: draft.packages.every((item) => item.title.trim() && item.description.trim() && item.price > 0) },
    { id: "media" as const, label: "Media", done: draft.mediaFiles.some(Boolean) || Boolean(draft.videoFile) },
    { id: "faq" as const, label: "FAQ", done: draft.faqs.some((item) => item.question.trim() && item.answer.trim()) },
    { id: "requirements" as const, label: "Requirements", done: draft.requirementQuestions.filter((item) => item.trim()).length >= 2 },
    { id: "review" as const, label: "Review", done: Boolean(draft.title.trim()) },
  ], [currentKeywords.length, draft.description, draft.faqs, draft.mediaFiles, draft.packages, draft.requirementQuestions, draft.title, draft.videoFile]);
  const currentStepIndex = steps.findIndex((step) => step.id === currentStep);
  const currentStepLabel = steps[currentStepIndex]?.label || "Overview";

  function goToNextStep() {
    const next = steps[currentStepIndex + 1];
    if (next) setCurrentStep(next.id);
  }

  function goToPreviousStep() {
    const previous = steps[currentStepIndex - 1];
    if (previous) setCurrentStep(previous.id);
  }

  async function loadServices() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/provider/services", { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload.error || "Could not load gigs.");
        setServices([]);
        return;
      }
      setServices(payload.services || []);
      if (!draft.id && !draft.title && payload.services?.[0]) {
        setDraft(draftFromService(payload.services[0]));
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveGig() {
    setSaving(true);
    setError(null);
    setMessage(null);

    const payload = {
      id: draft.id,
      title: draft.title,
      description: draft.description,
      hourlyRate: draft.hourlyRate,
      minHours: draft.minHours,
      maxRadiusKm: draft.maxRadiusKm,
      tags: currentKeywords,
      isActive: draft.isActive,
      gigDetails: {
        category: draft.category,
        packages: draft.packages,
        faqs: draft.faqs.filter((faq) => faq.question.trim() || faq.answer.trim()),
        mediaFiles: draft.mediaFiles.filter(Boolean).slice(0, 4),
        mediaUrls: draft.mediaFiles.map((file) => file?.image_url || "").filter(Boolean).slice(0, 4),
        videoFile: draft.videoFile,
        videoUrl: draft.videoFile?.image_url || "",
        requirementQuestions: draft.requirementQuestions.filter((question) => question.trim()).slice(0, 10),
      },
    };

    const response = await fetch("/api/provider/services", {
      method: draft.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => ({}));

    setSaving(false);
    if (!response.ok) {
      setError(result.error || "Could not save this gig.");
      return;
    }

    const saved = result.service as GigService;
    setServices((current) => {
      const exists = current.some((service) => service.id === saved.id);
      return exists ? current.map((service) => service.id === saved.id ? saved : service) : [saved, ...current];
    });
    setDraft(draftFromService(saved));
    setMessage(draft.id ? "Gig updated." : "Gig created.");
  }

  async function deleteGig(id: string) {
    setSaving(true);
    setError(null);
    const response = await fetch(`/api/provider/services?id=${id}`, { method: "DELETE" });
    const payload = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      setError(payload.error || "Could not delete this gig.");
      return;
    }
    setServices((current) => current.filter((service) => service.id !== id));
    if (draft.id === id) setDraft(blankDraft);
    setMessage("Gig deleted.");
  }

  function updateDraft(updates: Partial<GigDraft>) {
    setDraft((current) => ({ ...current, ...updates }));
    setMessage(null);
    setError(null);
  }

  function updatePackage(index: number, updates: Partial<GigPackage>) {
    setDraft((current) => ({
      ...current,
      packages: current.packages.map((item, itemIndex) => itemIndex === index ? { ...item, ...updates } : item),
    }));
    setMessage(null);
    setError(null);
  }

  function updateFaq(index: number, updates: Partial<GigFaq>) {
    setDraft((current) => ({
      ...current,
      faqs: current.faqs.map((item, itemIndex) => itemIndex === index ? { ...item, ...updates } : item),
    }));
    setMessage(null);
    setError(null);
  }

  function addFaq() {
    if (draft.faqs.length >= 10) return;
    updateDraft({ faqs: [...draft.faqs, { question: "", answer: "" }] });
  }

  function removeFaq(index: number) {
    updateDraft({ faqs: draft.faqs.filter((_, itemIndex) => itemIndex !== index) });
  }

  function updateRequirement(index: number, value: string) {
    setDraft((current) => ({
      ...current,
      requirementQuestions: current.requirementQuestions.map((item, itemIndex) => itemIndex === index ? value.slice(0, 160) : item),
    }));
    setMessage(null);
    setError(null);
  }

  function addRequirement() {
    if (draft.requirementQuestions.length >= 10) return;
    updateDraft({ requirementQuestions: [...draft.requirementQuestions, ""] });
  }

  function removeRequirement(index: number) {
    updateDraft({ requirementQuestions: draft.requirementQuestions.filter((_, itemIndex) => itemIndex !== index) });
  }

  async function uploadGigFile(file: File, imageType: "gig_image" | "gig_video") {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("image_type", imageType);
    formData.append("title", file.name);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "Upload failed");
    return payload.image as GigMediaFile;
  }

  async function handleGigImageUpload(index: number, fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const uploaded = await uploadGigFile(file, "gig_image");
      setDraft((current) => {
        const nextFiles = [...current.mediaFiles];
        nextFiles[index] = uploaded;
        const nextUrls = nextFiles.map((item) => item?.image_url || "");
        return { ...current, mediaFiles: nextFiles, mediaUrls: nextUrls };
      });
      setMessage("Image uploaded to Cloudinary.");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Image upload failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleGigVideoUpload(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const uploaded = await uploadGigFile(file, "gig_video");
      updateDraft({ videoFile: uploaded, videoUrl: uploaded.image_url });
      setMessage("Video uploaded to Cloudinary.");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Video upload failed.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteUploadedMedia(file: GigMediaFile | null, callback: () => void) {
    setError(null);
    setMessage(null);
    try {
      if (file?.id) {
        const response = await fetch(`/api/upload?id=${file.id}`, { method: "DELETE" });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || "Could not remove upload.");
        }
      }
      callback();
      setMessage("Upload removed.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not remove upload.");
    }
  }

  function clearGigImage(index: number) {
    const file = draft.mediaFiles[index] || null;
    void deleteUploadedMedia(file, () => {
      setDraft((current) => {
        const nextFiles = [...current.mediaFiles];
        nextFiles[index] = null;
        const nextUrls = nextFiles.map((item) => item?.image_url || "");
        return { ...current, mediaFiles: nextFiles, mediaUrls: nextUrls };
      });
    });
  }

  function clearGigVideo() {
    void deleteUploadedMedia(draft.videoFile, () => updateDraft({ videoFile: null, videoUrl: "" }));
  }

  return (
      <div className="min-h-screen bg-[#f4f5f9] pt-24">
      <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-blue-600">Provider profile builder</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-blue-950">Create a service gig</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Fill out one step at a time: overview, packages, media, FAQ, requirements, then review and publish.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setDraft(blankDraft);
              setCurrentStep("overview");
            }}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            New gig
          </button>
        </div>

        {error ? <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div> : null}
        {message ? <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{message}</div> : null}

        <div className="mb-5 rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">Step {currentStepIndex + 1} of {steps.length}</p>
              <h2 className="mt-1 text-xl font-black text-blue-950">{currentStepLabel}</h2>
            </div>
            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {steps.map((step, index) => (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setCurrentStep(step.id)}
                  className={`flex min-h-14 items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs font-black transition ${
                    currentStep === step.id
                      ? "border-blue-200 bg-blue-600 text-white shadow-sm"
                      : step.done
                        ? "border-green-100 bg-green-50 text-green-700 hover:bg-green-100"
                        : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] ${
                    currentStep === step.id ? "bg-white text-blue-600" : step.done ? "bg-green-600 text-white" : "bg-slate-100 text-slate-500"
                  }`}>
                    {step.done ? <Check className="h-3 w-3" /> : index + 1}
                  </span>
                  {step.label}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }} />
          </div>
        </div>

        <div className={`grid gap-5 ${currentStep === "review" ? "" : "lg:grid-cols-[330px_minmax(0,1fr)]"}`}>
          {currentStep !== "review" ? <aside className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-black text-blue-950">Your public gigs</h2>
                {loading ? <Loader2 className="h-4 w-4 animate-spin text-slate-400" /> : <span className="text-xs font-bold text-slate-500">{services.length} total</span>}
              </div>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded-lg bg-slate-100" />)}
                </div>
              ) : services.length ? (
                <div className="space-y-3">
                  {[...activeServices, ...inactiveServices].map((service) => (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => setDraft(draftFromService(service))}
                      className={`w-full rounded-lg border p-3 text-left transition ${draft.id === service.id ? "border-blue-200 bg-blue-50" : "border-slate-200 hover:bg-slate-50"}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="line-clamp-2 text-sm font-black text-blue-950">{service.title}</h3>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${service.is_active === false ? "bg-slate-100 text-slate-500" : "bg-green-100 text-green-700"}`}>
                          {service.is_active === false ? "Draft" : "Live"}
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{service.description || "No description yet."}</p>
                      <p className="mt-2 text-xs font-black text-slate-700">€{service.hourly_rate}/h · {service.min_hours || 1}h min</p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-200 p-5 text-center">
                  <Sparkles className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                  <p className="text-sm font-semibold text-slate-600">No gigs yet. Create your first public service.</p>
                </div>
              )}
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <h2 className="font-black text-blue-950">Gig readiness</h2>
              <div className="mt-3 space-y-2 text-sm">
                {[
                  ["Title", Boolean(draft.title.trim())],
                  ["Description", draft.description.trim().length >= 80],
                  ["Packages", draft.packages.every((item) => item.title.trim() && item.description.trim() && item.price > 0)],
                  ["Keywords", currentKeywords.length >= 3],
                  ["FAQs", draft.faqs.some((item) => item.question.trim() && item.answer.trim())],
                  ["Requirements", draft.requirementQuestions.filter((item) => item.trim()).length >= 2],
                ].map(([label, done]) => (
                  <div key={String(label)} className="flex items-center gap-2">
                    <span className={`flex h-5 w-5 items-center justify-center rounded-full ${done ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-400"}`}>
                      <Check className="h-3 w-3" />
                    </span>
                    <span className={done ? "font-semibold text-slate-700" : "text-slate-500"}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside> : null}

          <section className="space-y-5">
            {currentStep === "overview" ? <div className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="mb-5 flex items-center gap-2">
                <Search className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-black text-blue-950">Gig overview</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="md:col-span-2">
                  <span className="mb-1 block text-sm font-bold text-slate-700">Gig title</span>
                  <input
                    value={draft.title}
                    onChange={(event) => updateDraft({ title: event.target.value })}
                    placeholder="I will professionally assemble furniture in your home"
                    className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label>
                  <span className="mb-1 block text-sm font-bold text-slate-700">Primary category</span>
                  <select
                    value={draft.category}
                    onChange={(event) => updateDraft({ category: event.target.value })}
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Choose category</option>
                    {CATEGORIES.map((category) => <option key={category.slug} value={category.name}>{category.name}</option>)}
                  </select>
                </label>
                <label>
                  <span className="mb-1 block text-sm font-bold text-slate-700">Search keywords</span>
                  <input
                    value={draft.keywords}
                    onChange={(event) => updateDraft({ keywords: event.target.value })}
                    placeholder="furniture, ikea, wardrobe, handyman"
                    className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="md:col-span-2">
                  <span className="mb-1 block text-sm font-bold text-slate-700">Description</span>
                  <textarea
                    value={draft.description}
                    onChange={(event) => updateDraft({ description: event.target.value })}
                    rows={7}
                    placeholder="Explain what the customer gets, how you work, what is included, what is not included, and what you need from them before arrival."
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm leading-6 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
              </div>
            </div> : null}

            {currentStep === "pricing" ? <div className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="mb-5 flex items-center gap-2">
                <CircleDollarSign className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-black text-blue-950">Pricing and packages</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <label>
                  <span className="mb-1 block text-sm font-bold text-slate-700">Hourly rate</span>
                  <input type="number" min="1" value={draft.hourlyRate} onChange={(event) => updateDraft({ hourlyRate: Number(event.target.value) })} className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100" />
                </label>
                <label>
                  <span className="mb-1 block text-sm font-bold text-slate-700">Minimum hours</span>
                  <input type="number" min="1" value={draft.minHours} onChange={(event) => updateDraft({ minHours: Number(event.target.value) })} className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100" />
                </label>
                <label>
                  <span className="mb-1 block text-sm font-bold text-slate-700">Service radius km</span>
                  <input type="number" min="0" value={draft.maxRadiusKm} onChange={(event) => updateDraft({ maxRadiusKm: Number(event.target.value) })} className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100" />
                </label>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {draft.packages.map((item, index) => (
                  <div key={item.tier} className="rounded-lg border border-slate-200 p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-blue-600">{item.tier}</p>
                    <label className="mt-3 block">
                      <span className="mb-1 flex items-center justify-between text-xs font-bold text-slate-600">
                        Package title
                        <span>{characterHint(item.title, 45)}</span>
                      </span>
                      <input
                        value={item.title}
                        maxLength={45}
                        onChange={(event) => updatePackage(index, { title: event.target.value.slice(0, 45) })}
                        className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-bold outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                      />
                    </label>
                    <label className="mt-3 block">
                      <span className="mb-1 flex items-center justify-between text-xs font-bold text-slate-600">
                        What is included
                        <span>{characterHint(item.description, 220)}</span>
                      </span>
                      <textarea
                        value={item.description}
                        maxLength={220}
                        rows={5}
                        onChange={(event) => updatePackage(index, { description: event.target.value.slice(0, 220) })}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm leading-5 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                      />
                    </label>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <label>
                        <span className="mb-1 block text-xs font-bold text-slate-600">Price</span>
                        <input type="number" min="1" value={item.price} onChange={(event) => updatePackage(index, { price: Number(event.target.value) })} className="h-10 w-full rounded-lg border border-slate-200 px-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100" />
                      </label>
                      <label>
                        <span className="mb-1 block text-xs font-bold text-slate-600">Days</span>
                        <input type="number" min="1" value={item.deliveryDays} onChange={(event) => updatePackage(index, { deliveryDays: Number(event.target.value) })} className="h-10 w-full rounded-lg border border-slate-200 px-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100" />
                      </label>
                      <label>
                        <span className="mb-1 block text-xs font-bold text-slate-600">Revisions</span>
                        <input type="number" min="0" max="10" value={item.revisions} onChange={(event) => updatePackage(index, { revisions: Number(event.target.value) })} className="h-10 w-full rounded-lg border border-slate-200 px-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100" />
                      </label>
                    </div>
                    <p className="mt-4 text-2xl font-black text-slate-900">€{Number(item.price || 0)}</p>
                  </div>
                ))}
              </div>
            </div> : null}

            {currentStep === "media" ? <div className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="mb-5 flex items-center gap-2">
                <ImagePlus className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-black text-blue-950">Media</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {draft.mediaFiles.map((file, index) => (
                  <div key={index} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="mb-2 flex items-center justify-between text-sm font-bold text-slate-700">
                      <span className="inline-flex items-center gap-2"><ImagePlus className="h-4 w-4" /> Image {index + 1}</span>
                      <span className="text-xs text-slate-400">{index === 0 ? "thumbnail" : "optional"}</span>
                    </div>
                    {file ? (
                      <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-white">
                        <img src={file.image_url} alt={file.title || `Gig image ${index + 1}`} className="h-44 w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => clearGigImage(index)}
                          className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white shadow"
                          aria-label={`Remove image ${index + 1}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <div className="border-t border-slate-100 px-3 py-2 text-xs font-semibold text-slate-500">{file.title || "Cloudinary image"}</div>
                      </div>
                    ) : (
                      <div className="grid gap-2">
                        <label className="flex h-36 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-white text-center transition hover:border-blue-300 hover:bg-blue-50">
                          {saving ? <Loader2 className="mb-2 h-6 w-6 animate-spin text-slate-400" /> : <ImagePlus className="mb-2 h-6 w-6 text-slate-400" />}
                          <span className="text-sm font-black text-slate-700">Upload image</span>
                          <span className="mt-1 text-xs font-semibold text-slate-400">JPG, PNG, WebP, GIF · max 10MB</span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            className="sr-only"
                            disabled={saving}
                            onChange={(event) => void handleGigImageUpload(index, event.target.files)}
                          />
                        </label>
	                        {isMobileCamera ? (
	                          <label
	                            onClick={(event) => {
	                              event.preventDefault();
	                              if (saving || requestingCameraPermission) return;
	                              const input = event.currentTarget.querySelector("input") as HTMLInputElement | null;
	                              void requestCameraCapture("environment", () => input?.click());
	                            }}
	                            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs font-black text-red-700 hover:bg-red-100"
	                          >
	                            <Camera className="h-4 w-4" />
	                            {requestingCameraPermission ? "Allow camera..." : "Use camera"}
	                            <input
	                              type="file"
	                              accept="image/*"
	                              capture="environment"
	                              className="sr-only"
	                              disabled={saving}
	                              onChange={(event) => void handleGigImageUpload(index, event.target.files)}
	                            />
	                          </label>
	                        ) : null}
                      </div>
                    )}
                  </div>
                ))}
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 md:col-span-2">
                  <div className="mb-2 flex items-center justify-between text-sm font-bold text-slate-700">
                    <span className="inline-flex items-center gap-2"><Video className="h-4 w-4" /> Gig video</span>
                    <span className="text-xs text-slate-400">1 allowed</span>
                  </div>
                  {draft.videoFile ? (
                    <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-white">
                      <video src={draft.videoFile.image_url} controls className="h-72 w-full bg-black object-contain" />
                      <button
                        type="button"
                        onClick={clearGigVideo}
                        className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white shadow"
                        aria-label="Remove gig video"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <div className="border-t border-slate-100 px-3 py-2 text-xs font-semibold text-slate-500">{draft.videoFile.title || "Cloudinary video"}</div>
                    </div>
                  ) : (
                    <div className="grid gap-2">
                      <label className="flex h-40 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-white text-center transition hover:border-blue-300 hover:bg-blue-50">
                        {saving ? <Loader2 className="mb-2 h-6 w-6 animate-spin text-slate-400" /> : <Video className="mb-2 h-6 w-6 text-slate-400" />}
                        <span className="text-sm font-black text-slate-700">Upload one video</span>
                        <span className="mt-1 text-xs font-semibold text-slate-400">MP4, WebM, MOV · max 100MB</span>
                        <input
                          type="file"
                          accept="video/mp4,video/webm,video/quicktime"
                          className="sr-only"
                          disabled={saving}
                          onChange={(event) => void handleGigVideoUpload(event.target.files)}
                        />
                      </label>
	                      {isMobileCamera ? (
	                        <label
	                          onClick={(event) => {
	                            event.preventDefault();
	                            if (saving || requestingCameraPermission) return;
	                            const input = event.currentTarget.querySelector("input") as HTMLInputElement | null;
	                            void requestCameraCapture("user", () => input?.click());
	                          }}
	                          className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs font-black text-red-700 hover:bg-red-100"
	                        >
	                          <Camera className="h-4 w-4" />
	                          {requestingCameraPermission ? "Allow camera..." : "Record with camera"}
	                          <input
	                            type="file"
	                            accept="video/*"
	                            capture="user"
	                            className="sr-only"
	                            disabled={saving}
	                            onChange={(event) => void handleGigVideoUpload(event.target.files)}
	                          />
	                        </label>
	                      ) : null}
	                    </div>
	                  )}
	                  {cameraError ? <p className="mt-2 text-xs font-bold text-red-600">{cameraError}</p> : null}
	                </div>
              </div>
              <p className="mt-3 text-xs font-semibold text-slate-500">Files upload to Cloudinary through AnyJob. Each gig can carry up to 4 images and 1 video. The first image is used as the marketplace thumbnail.</p>
            </div> : null}

            {currentStep === "faq" ? <div className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <FileQuestion className="h-5 w-5 text-blue-600" />
                  <h2 className="text-lg font-black text-blue-950">FAQ</h2>
                </div>
                <button
                  type="button"
                  onClick={addFaq}
                  disabled={draft.faqs.length >= 10}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-slate-200 px-4 text-xs font-black text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  Add FAQ ({draft.faqs.length}/10)
                </button>
              </div>
              <div className="space-y-4">
                {draft.faqs.map((faq, index) => (
                  <div key={index} className="rounded-lg border border-slate-200 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-sm font-black text-blue-950">FAQ {index + 1}</p>
                      {draft.faqs.length > 1 ? (
                        <button type="button" onClick={() => removeFaq(index)} aria-label={`Remove FAQ ${index + 1}`} title={`Remove FAQ ${index + 1}`} className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-600">
                          <X className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>
                    <label className="block">
                      <span className="mb-1 flex items-center justify-between text-xs font-bold text-slate-600">
                        Question
                        <span>{characterHint(faq.question, 120)}</span>
                      </span>
                      <input
                        value={faq.question}
                        maxLength={120}
                        onChange={(event) => updateFaq(index, { question: event.target.value.slice(0, 120) })}
                        placeholder="What should customers know before ordering?"
                        className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                      />
                    </label>
                    <label className="mt-3 block">
                      <span className="mb-1 flex items-center justify-between text-xs font-bold text-slate-600">
                        Answer
                        <span>{characterHint(faq.answer, 500)}</span>
                      </span>
                      <textarea
                        value={faq.answer}
                        maxLength={500}
                        rows={4}
                        onChange={(event) => updateFaq(index, { answer: event.target.value.slice(0, 500) })}
                        placeholder="Write a clear answer for customers."
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm leading-5 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                      />
                    </label>
                  </div>
                ))}
              </div>
            </div> : null}

            {currentStep === "requirements" ? <div className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <FileQuestion className="h-5 w-5 text-blue-600" />
                    <h2 className="text-lg font-black text-blue-950">Order requirements</h2>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Customers answer these after payment starts the request-to-order. The provider can still reject if the requirements show the job is not suitable.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addRequirement}
                  disabled={draft.requirementQuestions.length >= 10}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-slate-200 px-4 text-xs font-black text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  Add requirement ({draft.requirementQuestions.length}/10)
                </button>
              </div>
              <div className="space-y-3">
                {draft.requirementQuestions.map((question, index) => (
                  <div key={index} className="flex gap-2">
                    <label className="flex-1">
                      <span className="mb-1 flex items-center justify-between text-xs font-bold text-slate-600">
                        Requirement question {index + 1}
                        <span>{characterHint(question, 160)}</span>
                      </span>
                      <input
                        value={question}
                        maxLength={160}
                        onChange={(event) => updateRequirement(index, event.target.value)}
                        placeholder="Ask what you need before accepting this order"
                        className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                      />
                    </label>
                    {draft.requirementQuestions.length > 1 ? (
                      <button type="button" onClick={() => removeRequirement(index)} aria-label={`Remove requirement ${index + 1}`} title={`Remove requirement ${index + 1}`} className="mt-6 inline-flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:border-red-200 hover:bg-red-50 hover:text-red-600">
                        <X className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            </div> : null}

            {currentStep === "review" ? (
              <div className="space-y-5">
                <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                  <div className="flex items-start gap-3">
                    <Eye className="mt-1 h-5 w-5 shrink-0 text-blue-600" />
                    <div>
                      <h2 className="text-lg font-black text-blue-950">Full public gig preview</h2>
                      <p className="mt-1 text-sm leading-6 text-blue-900/70">
                        This is the full page buyers will see before ordering. It includes the saved overview, media, pricing packages, FAQ, and the requirement questions collected after payment starts the request.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white">
                  <div className="border-b border-slate-200 px-6 py-4">
                    <p className="text-xs font-black uppercase tracking-wide text-blue-600">{draft.category || "AnyJob service"}</p>
                    <h3 className="mt-2 text-3xl font-black tracking-tight text-blue-950">{draft.title || "Untitled gig"}</h3>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-600">
                      <span className="rounded-full bg-green-100 px-3 py-1 text-green-700">Provider preview</span>
                      <span>Verified provider profile</span>
                      <span>Request-to-order enabled</span>
                    </div>
                  </div>

                  <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_380px]">
                    <div className="space-y-8 p-6">
                      <section>
                        <div className="aspect-video overflow-hidden rounded-lg bg-slate-100">
                          {draft.videoFile ? (
                            <video src={draft.videoFile.image_url} controls className="h-full w-full bg-black object-contain" />
                          ) : draft.mediaFiles.find(Boolean) ? (
                            <img src={draft.mediaFiles.find(Boolean)?.image_url} alt={draft.title || "Gig preview"} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center p-8 text-center text-sm font-bold text-slate-400">
                              Uploaded gig image or video appears here for buyers.
                            </div>
                          )}
                        </div>
                        <div className="mt-3 grid grid-cols-4 gap-3">
                          {draft.mediaFiles.map((file, index) => (
                            <div key={file?.id || index} className="aspect-video overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                              {file ? (
                                <img src={file.image_url} alt={`Gig image ${index + 1}`} className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full items-center justify-center text-xs font-bold text-slate-300">Image {index + 1}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </section>

                      <section className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-lg font-black text-white">P</div>
                            <div>
                              <p className="font-black text-blue-950">Your provider profile</p>
                              <p className="text-xs font-semibold text-slate-500">Shown to buyers</p>
                            </div>
                          </div>
                          <div className="mt-4 space-y-2 text-sm text-slate-600">
                            <p><span className="font-bold text-slate-900">Radius:</span> {draft.maxRadiusKm} km</p>
                            <p><span className="font-bold text-slate-900">Min booking:</span> {draft.minHours} hour(s)</p>
                            <p><span className="font-bold text-slate-900">Hourly reference:</span> €{draft.hourlyRate}/h</p>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-xl font-black text-blue-950">About this gig</h4>
                          <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">{draft.description || "No description yet."}</p>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {currentKeywords.length ? currentKeywords.map((item) => (
                              <span key={item} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">{item}</span>
                            )) : <span className="text-sm font-semibold text-slate-400">No keywords added yet.</span>}
                          </div>
                        </div>
                      </section>

                      <section>
                        <h4 className="text-xl font-black text-blue-950">Compare packages</h4>
                        <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
                          <div className="grid bg-slate-50 text-sm font-black text-slate-600 md:grid-cols-4">
                            <div className="p-4">Package</div>
                            {draft.packages.map((item) => <div key={item.tier} className="border-t border-slate-200 p-4 md:border-l md:border-t-0">{item.tier}</div>)}
                          </div>
                          <div className="grid text-sm md:grid-cols-4">
                            <div className="border-t border-slate-200 p-4 font-bold text-slate-600">Title</div>
                            {draft.packages.map((item) => <div key={item.tier} className="border-t border-slate-200 p-4 font-black text-blue-950 md:border-l">{item.title || "Package title"}</div>)}
                          </div>
                          <div className="grid text-sm md:grid-cols-4">
                            <div className="border-t border-slate-200 p-4 font-bold text-slate-600">Description</div>
                            {draft.packages.map((item) => <div key={item.tier} className="border-t border-slate-200 p-4 leading-6 text-slate-600 md:border-l">{item.description || "Package description"}</div>)}
                          </div>
                          <div className="grid text-sm md:grid-cols-4">
                            <div className="border-t border-slate-200 p-4 font-bold text-slate-600">Delivery</div>
                            {draft.packages.map((item) => <div key={item.tier} className="border-t border-slate-200 p-4 text-slate-700 md:border-l">{item.deliveryDays} day(s)</div>)}
                          </div>
                          <div className="grid text-sm md:grid-cols-4">
                            <div className="border-t border-slate-200 p-4 font-bold text-slate-600">Revisions</div>
                            {draft.packages.map((item) => <div key={item.tier} className="border-t border-slate-200 p-4 text-slate-700 md:border-l">{item.revisions}</div>)}
                          </div>
                          <div className="grid text-sm md:grid-cols-4">
                            <div className="border-t border-slate-200 p-4 font-bold text-slate-600">Price</div>
                            {draft.packages.map((item) => <div key={item.tier} className="border-t border-slate-200 p-4 text-xl font-black text-blue-950 md:border-l">€{Number(item.price || 0)}</div>)}
                          </div>
                        </div>
                      </section>

                      <section>
                        <h4 className="text-xl font-black text-blue-950">FAQ</h4>
                        <div className="mt-4 divide-y divide-slate-100 rounded-lg border border-slate-200">
                          {draft.faqs.filter((faq) => faq.question || faq.answer).map((faq, index) => (
                            <div key={index} className="p-4">
                              <p className="font-black text-slate-900">{faq.question || "Question"}</p>
                              <p className="mt-2 text-sm leading-6 text-slate-600">{faq.answer || "Answer"}</p>
                            </div>
                          ))}
                        </div>
                      </section>

                      <section>
                        <h4 className="text-xl font-black text-blue-950">Requirement form buyers fill after payment</h4>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          Payment starts the order request. Buyers then answer these questions so you can accept or reject with the right context.
                        </p>
                        <div className="mt-4 space-y-3">
                          {draft.requirementQuestions.filter(Boolean).map((question, index) => (
                            <div key={index} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                              <p className="text-xs font-black uppercase tracking-wide text-slate-400">Question {index + 1}</p>
                              <p className="mt-1 font-bold text-slate-800">{question}</p>
                            </div>
                          ))}
                        </div>
                      </section>
                    </div>

                    <aside className="border-t border-slate-200 bg-slate-50 p-6 lg:border-l lg:border-t-0">
                      <div className="sticky top-28 space-y-4">
                        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                          <p className="text-xs font-black uppercase tracking-wide text-blue-600">Selected package preview</p>
                          <h4 className="mt-2 text-xl font-black text-blue-950">{draft.packages[1]?.title || draft.packages[0]?.title || "Standard package"}</h4>
                          <p className="mt-2 text-sm leading-6 text-slate-600">{draft.packages[1]?.description || draft.packages[0]?.description || "Package description"}</p>
                          <div className="mt-4 flex items-end justify-between">
                            <div>
                              <p className="text-xs font-bold uppercase text-slate-400">Buyer sees price</p>
                              <p className="text-3xl font-black text-blue-950">€{Number(draft.packages[1]?.price || draft.packages[0]?.price || 0)}</p>
                            </div>
                            <p className="text-sm font-bold text-slate-500">{draft.packages[1]?.deliveryDays || draft.packages[0]?.deliveryDays || 1} day(s)</p>
                          </div>
                          <button type="button" className="mt-5 h-12 w-full rounded-full bg-blue-600 text-sm font-black text-white">
                            Continue to order
                          </button>
                          <p className="mt-3 text-xs font-semibold leading-5 text-slate-500">
                            Public buyers will pay first, then complete the requirement form before your final acceptance.
                          </p>
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-white p-4">
                          <h3 className="font-black text-blue-950">Owner publish checklist</h3>
                          <div className="mt-3 space-y-2 text-sm">
                            {steps.slice(0, 5).map((step) => (
                              <div key={step.id} className="flex items-center gap-2">
                                <span className={`flex h-5 w-5 items-center justify-center rounded-full ${step.done ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-400"}`}>
                                  <Check className="h-3 w-3" />
                                </span>
                                <span className={step.done ? "font-semibold text-slate-700" : "text-slate-500"}>{step.label}</span>
                              </div>
                            ))}
                          </div>
                          <div className="mt-5 border-t border-slate-200 pt-4 text-sm leading-6 text-slate-600">
                            <p><span className="font-bold text-slate-900">Images:</span> {draft.mediaFiles.filter(Boolean).length}/4</p>
                            <p><span className="font-bold text-slate-900">Video:</span> {draft.videoFile ? "1/1" : "0/1"}</p>
                            <p><span className="font-bold text-slate-900">FAQs:</span> {draft.faqs.filter((faq) => faq.question || faq.answer).length}/10</p>
                            <p><span className="font-bold text-slate-900">Requirements:</span> {draft.requirementQuestions.filter(Boolean).length}/10</p>
                          </div>
                        </div>
                      </div>
                    </aside>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="sticky bottom-0 z-10 rounded-lg border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm font-bold text-slate-600">
                  {currentStep === "review" ? "Review your gig, then publish it to your provider profile." : "Complete each step, then publish from the final review screen."}
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <button type="button" onClick={goToPreviousStep} disabled={currentStepIndex <= 0} className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-slate-200 px-5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </button>
                  {currentStep !== "review" ? (
                    <button type="button" onClick={goToNextStep} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-blue-600 px-6 text-sm font-bold text-white hover:bg-blue-700">
                      Continue
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : null}
                  {draft.id ? (
                    <button type="button" onClick={() => void deleteGig(draft.id!)} disabled={saving || currentStep !== "review"} className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-red-200 px-5 text-sm font-bold text-red-600 hover:bg-red-50 disabled:hidden">
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  ) : null}
                  {currentStep === "review" ? (
                    <button type="button" onClick={() => void saveGig()} disabled={saving} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-blue-600 px-6 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      {draft.id ? "Publish changes" : "Publish gig"}
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
