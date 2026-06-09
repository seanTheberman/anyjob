"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Wallet,
  ClipboardList,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  Home,
  Zap,
  Package,
  Info,
  Sparkles,
  X,
  Building2,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, addDays, startOfDay } from "date-fns";
import { enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { CategoryIcon, SubcategoryIcon } from "@/components/shared/CategoryIcon";
import type { User } from "@supabase/supabase-js";
import { SHIFT_NICHES, WORK_TYPES, getShiftNiche } from "@/lib/shift-work";

// Types
interface Category {
  id: string;
  slug: string;
  name: string;
  color: string;
  icon?: string;
}

interface Subcategory {
  id: string;
  slug: string;
  name: string;
  category_id: string;
}

const CATEGORIES: Category[] = [
  { id: "1", slug: "menage", name: "Cleaning", color: "#EC4899" },
  { id: "2", slug: "bricolage", name: "Handyman", color: "#F59E0B" },
  { id: "3", slug: "jardinage", name: "Gardening", color: "#22C55E" },
  { id: "4", slug: "demenagement", name: "Moving", color: "#8B5CF6" },
  { id: "5", slug: "enfants", name: "Childcare", color: "#F97316" },
  { id: "6", slug: "animaux", name: "Pet care", color: "#14B8A6" },
  { id: "7", slug: "informatique", name: "IT Support", color: "#6366F1" },
  { id: "8", slug: "aide-domicile", name: "Home help", color: "#EF4444" },
  { id: "9", slug: "cours-particuliers", name: "Private tutoring", color: "#0EA5E9" },
  { id: "10", slug: "hiver", name: "Winter services", color: "#60A5FA" },
];

const SUBCATEGORIES: Record<string, Subcategory[]> = {
  menage: [
    { id: "m1", slug: "menage-regulier", name: "Regular cleaning", category_id: "1" },
    { id: "m2", slug: "grand-menage", name: "Deep cleaning", category_id: "1" },
    { id: "m3", slug: "nettoyage-vitres", name: "Window cleaning", category_id: "1" },
    { id: "m4", slug: "repassage", name: "Ironing", category_id: "1" },
    { id: "m5", slug: "nettoyage-apres-travaux", name: "End of construction cleaning", category_id: "1" },
  ],
  bricolage: [
    { id: "b1", slug: "petite-reparation", name: "Small repair", category_id: "2" },
    { id: "b2", slug: "montage-meubles", name: "Furniture assembly", category_id: "2" },
    { id: "b3", slug: "pose-etageres", name: "Shelf mounting", category_id: "2" },
    { id: "b4", slug: "peinture", name: "Painting", category_id: "2" },
    { id: "b5", slug: "electricite", name: "Electrical", category_id: "2" },
    { id: "b6", slug: "plomberie", name: "Plumbing", category_id: "2" },
  ],
  jardinage: [
    { id: "j1", slug: "tondre-pelouse", name: "Lawn mowing", category_id: "3" },
    { id: "j2", slug: "taille-haies", name: "Hedge trimming", category_id: "3" },
    { id: "j3", slug: "desherbage", name: "Weeding", category_id: "3" },
    { id: "j4", slug: "ramassage-feuilles", name: "Leaf picking", category_id: "3" },
    { id: "j5", slug: "plantation", name: "Planting", category_id: "3" },
  ],
  demenagement: [
    { id: "d1", slug: "aide-demenagement", name: "Moving help", category_id: "4" },
    { id: "d2", slug: "transport", name: "Transport", category_id: "4" },
    { id: "d3", slug: "emballage", name: "Packing", category_id: "4" },
    { id: "d4", slug: "demontage-meubles", name: "Furniture disassembly", category_id: "4" },
  ],
  enfants: [
    { id: "e1", slug: "babysitting", name: "Babysitting", category_id: "5" },
    { id: "e2", slug: "sortie-ecole", name: "School pick-up", category_id: "5" },
    { id: "e3", slug: "garde-vacances", name: "Holiday care", category_id: "5" },
    { id: "e4", slug: "aide-devoirs", name: "Homework help", category_id: "5" },
  ],
  animaux: [
    { id: "a1", slug: "promenade-chien", name: "Dog walking", category_id: "6" },
    { id: "a2", slug: "garde-chien", name: "Dog sitting", category_id: "6" },
    { id: "a3", slug: "garde-chat", name: "Cat sitting", category_id: "6" },
    { id: "a4", slug: "visite-animaux", name: "Home visit", category_id: "6" },
  ],
  informatique: [
    { id: "i1", slug: "depannage-pc", name: "PC Repair", category_id: "7" },
    { id: "i2", slug: "installation-wifi", name: "WiFi Setup", category_id: "7" },
    { id: "i3", slug: "cours-informatique", name: "IT Lessons", category_id: "7" },
  ],
  "aide-domicile": [
    { id: "ad1", slug: "courses", name: "Errands", category_id: "8" },
    { id: "ad2", slug: "preparation-repas", name: "Meal prep", category_id: "8" },
    { id: "ad3", slug: "accompagnement", name: "Accompaniment", category_id: "8" },
    { id: "ad4", slug: "lecture", name: "Reading", category_id: "8" },
  ],
  "cours-particuliers": [
    { id: "cp1", slug: "maths", name: "Mathematics", category_id: "9" },
    { id: "cp2", slug: "francais", name: "French", category_id: "9" },
    { id: "cp3", slug: "anglais", name: "English", category_id: "9" },
    { id: "cp4", slug: "musique", name: "Music", category_id: "9" },
  ],
  hiver: [
    { id: "h1", slug: "babysitting-hiver", name: "Winter babysitting", category_id: "10" },
    { id: "h2", slug: "garde-vacances-hiver", name: "Winter holiday care", category_id: "10" },
    { id: "h3", slug: "dog-sitting-hiver", name: "Winter pet sitting", category_id: "10" },
  ],
};

function getSubcategoryDisplayName(categorySlug: string, subcategorySlug: string) {
  if (subcategorySlug.startsWith("other-")) return "Other";
  return SUBCATEGORIES[categorySlug]?.find((subcategory) => subcategory.slug === subcategorySlug)?.name || subcategorySlug;
}

const SERVICE_TYPES = [
  { value: "one_time", label: "One time", description: "One-off service" },
  { value: "recurring", label: "Regular", description: "Recurring service (weekly, monthly...)" },
  { value: "emergency", label: "Emergency", description: "Immediate need" },
  { value: "project", label: "Project", description: "Multi-day project" },
];

const URGENCY_OPTIONS = [
  { value: "asap", label: "As soon as possible", icon: Zap },
  { value: "this_week", label: "This week", icon: Calendar },
  { value: "this_month", label: "This month", icon: Calendar },
  { value: "flexible", label: "Flexible", icon: Clock },
];

const DURATION_OPTIONS = [
  { value: 1, label: "1 hour" },
  { value: 2, label: "2 hours" },
  { value: 3, label: "3 hours" },
  { value: 4, label: "4 hours" },
  { value: 6, label: "6 hours" },
  { value: 8, label: "8 hours (1 day)" },
  { value: -1, label: "Multi-day" },
];

const PEOPLE_OPTIONS = [
  { value: 1, label: "1 person" },
  { value: 2, label: "2 people" },
  { value: 3, label: "3 people" },
  { value: 4, label: "4+ people" },
];

const BUDGET_OPTIONS = [
  { value: "0-50", label: "0€ - 50€", min: 0, max: 50 },
  { value: "50-100", label: "50€ - 100€", min: 50, max: 100 },
  { value: "100-200", label: "100€ - 200€", min: 100, max: 200 },
  { value: "200-500", label: "200€ - 500€", min: 200, max: 500 },
  { value: "500+", label: "500€+", min: 500, max: null },
];

function roundToCoarseCoordinate(value: number) {
  return Math.round(value * 100) / 100;
}

function buildCoarseLocationLabel(city: string, postalCode: string) {
  const postalPrefix = postalCode.trim().slice(0, 3);
  return [city.trim(), postalPrefix ? `${postalPrefix} area` : ""].filter(Boolean).join(", ");
}

interface FormData {
  category_slug: string;
  subcategory_slug: string;
  service_type: string;
  job_description: string;
  job_urgency: string;
  preferred_date: Date | undefined;
  preferred_time_start: string;
  preferred_time_end: string;
  flexible_timing: boolean;
  address: string;
  city: string;
  postal_code: string;
  latitude: number | null;
  longitude: number | null;
  coarse_latitude: number | null;
  coarse_longitude: number | null;
  location_accuracy_meters: number | null;
  coarse_location_label: string;
  estimated_duration_hours: number;
  number_of_people_needed: number;
  budget_range: string;
  materials_provided: boolean;
  equipment_needed: string;
  custom_tags: string[];
  tag_input: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  isNewUser: boolean;
  work_images: File[];
}

type ShiftAudience = "" | "business" | "individual";

type BusinessProfile = {
  id: string;
  business_name: string;
  status: string;
  industry?: string | null;
  contact_name?: string | null;
  contact_phone?: string | null;
  address?: string | null;
  city?: string | null;
  postal_code?: string | null;
};

type ShiftBusinessPostForm = {
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

const INITIAL_FORM_DATA: FormData = {
  category_slug: "",
  subcategory_slug: "",
  service_type: "",
  job_description: "",
  job_urgency: "",
  preferred_date: undefined,
  preferred_time_start: "09:00",
  preferred_time_end: "17:00",
  flexible_timing: false,
  address: "",
  city: "",
  postal_code: "",
  latitude: null,
  longitude: null,
  coarse_latitude: null,
  coarse_longitude: null,
  location_accuracy_meters: null,
  coarse_location_label: "",
  estimated_duration_hours: 2,
  number_of_people_needed: 1,
  budget_range: "",
  materials_provided: false,
  equipment_needed: "",
  custom_tags: [],
  tag_input: "",
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  password: "",
  isNewUser: true,
  work_images: [],
};

const TOTAL_STEPS = 9;
const SHIFT_TOTAL_STEPS = 5;

function initialShiftBusinessPostForm(): ShiftBusinessPostForm {
  const niche = SHIFT_NICHES[0];
  return {
    workType: "part_time_day_wage",
    niche: niche.value,
    industry: niche.industry,
    roleTitle: niche.roles[0],
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
    hourlyRate: String(niche.hourlyAverage),
    dayRate: String(niche.dayAverage),
    acceptsWorkerRateVariation: true,
    requirements: "",
    uniform: "",
    breakPolicy: "",
    contactName: "",
    contactPhone: "",
  };
}

// Main page component wrapped in Suspense
export default function QuestionnairePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <QuestionnaireShell />
    </Suspense>
  );
}

function QuestionnaireShell() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Check if coming from dashboard (has from_dashboard param or referrer is dashboard)
  const isFromDashboard = searchParams.get('from_dashboard') === 'true' || 
                          (typeof window !== 'undefined' && window.document?.referrer?.includes('/dashboard'));

  const content = (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <ServiceQuestionnaireContent />
    </Suspense>
  );

  // Use DashboardLayout if coming from dashboard
  if (isFromDashboard) {
    return <DashboardLayout>{content}</DashboardLayout>;
  }

  return content;
}

// Inner component that uses useSearchParams
function ServiceQuestionnaireContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const isShiftQuestionnaire = searchParams.get("work_type") === "shifts";

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [shiftAudience, setShiftAudience] = useState<ShiftAudience>("");
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [businessLoading, setBusinessLoading] = useState(false);
  const [shiftFormData, setShiftFormData] = useState<ShiftBusinessPostForm>(initialShiftBusinessPostForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [stepKey, setStepKey] = useState(1);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const isTaskrabbitSelection = searchParams.get("source") === "taskrabbit";
  const selectedCustomJobName = formData.category_slug === "custom" ? formData.custom_tags[0] : "";
  const selectedShiftNiche = useMemo(() => getShiftNiche(shiftFormData.niche), [shiftFormData.niche]);

  // Get pre-selected category from URL
  useEffect(() => {
    if (isShiftQuestionnaire) {
      setCurrentStep(1);
      setStepKey(1);
      return;
    }

    const cat = searchParams.get("category");
    const subcategory = searchParams.get("subcategory");
    const urgency = searchParams.get("urgency");
    const customQuery = searchParams.get("custom_query")?.trim();
    const providerId = searchParams.get("provider");
    const isTaskrabbitSelection = searchParams.get("source") === "taskrabbit";
    if (cat && !providerId) {
      setFormData((prev) => ({
        ...prev,
        category_slug: cat,
        subcategory_slug: subcategory || (cat === "custom" ? "custom-job" : prev.subcategory_slug),
        service_type: urgency === "emergency" ? "emergency" : prev.service_type,
        job_urgency: urgency === "emergency" ? "asap" : prev.job_urgency,
        custom_tags: cat === "custom" && customQuery
          ? Array.from(new Set([...prev.custom_tags, customQuery])).slice(0, 8)
          : prev.custom_tags,
        tag_input: "",
      }));
      // Taskrabbit dropdown selections already name the custom job, so skip tag collection.
      const nextStep = isTaskrabbitSelection && cat === "custom" && customQuery
        ? 3
        : subcategory
          ? 3
          : 2;
      setCurrentStep(nextStep);
      setStepKey(nextStep);
    }
  }, [searchParams, isShiftQuestionnaire]);

  useEffect(() => {
    let mounted = true;

    async function loadCurrentUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted) return;
      setCurrentUser(user);

      if (user) {
        const { data: profile } = await supabase
          .from("eloo_profiles")
          .select("first_name,last_name,email,phone")
          .eq("id", user.id)
          .maybeSingle();

        if (!mounted) return;
        setFormData((prev) => ({
          ...prev,
          first_name: prev.first_name || profile?.first_name || user.user_metadata?.first_name || "",
          last_name: prev.last_name || profile?.last_name || user.user_metadata?.last_name || "",
          email: prev.email || profile?.email || user.email || "",
          phone: prev.phone || profile?.phone || "",
          isNewUser: false,
        }));
      }
    }

    loadCurrentUser();
    return () => {
      mounted = false;
    };
  }, [supabase]);

  useEffect(() => {
    let mounted = true;
    if (!isShiftQuestionnaire || !currentUser) {
      setBusiness(null);
      setBusinessLoading(false);
      return;
    }

    async function loadBusinessStatus() {
      setBusinessLoading(true);
      try {
        const response = await fetch("/api/business/register");
        const payload = await response.json().catch(() => ({}));
        if (!mounted) return;
        const profile = response.ok ? payload.business || null : null;
        setBusiness(profile);
        if (profile) {
          setShiftFormData((current) => ({
            ...current,
            industry: profile.industry || current.industry,
            address: profile.address || current.address,
            city: profile.city || current.city,
            postalCode: profile.postal_code || current.postalCode,
            contactName: profile.contact_name || current.contactName,
            contactPhone: profile.contact_phone || current.contactPhone,
          }));
        }
      } catch (error) {
        console.error("Business status lookup failed:", error);
        if (mounted) setBusiness(null);
      } finally {
        if (mounted) setBusinessLoading(false);
      }
    }

    loadBusinessStatus();
    return () => {
      mounted = false;
    };
  }, [currentUser, isShiftQuestionnaire]);

  const updateFormData = (field: keyof FormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateShiftFormData = (field: keyof ShiftBusinessPostForm, value: string | boolean) => {
    setShiftFormData((prev) => ({ ...prev, [field]: value }));
    setSubmitError(null);
  };

  const handleShiftNicheChange = (value: string) => {
    const niche = getShiftNiche(value);
    setShiftFormData((prev) => ({
      ...prev,
      niche: niche.value,
      industry: niche.industry,
      roleTitle: niche.roles[0],
      hourlyRate: String(niche.hourlyAverage),
      dayRate: String(niche.dayAverage),
    }));
    setSubmitError(null);
  };

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((prev) => prev + 1);
      setStepKey((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      setStepKey((prev) => prev - 1);
    }
  };

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 1:
        return !!formData.category_slug;
      case 2:
        return !!formData.subcategory_slug;
      case 3:
        return !!formData.service_type && !!formData.job_urgency;
      case 4:
        return formData.job_description.length >= 10;
      case 5:
        return !!formData.preferred_date;
      case 6:
        return !!formData.address && !!formData.city;
      case 7:
        return formData.estimated_duration_hours > 0 && !!formData.budget_range;
      case 8:
        return true; // Image upload step - always valid (optional)
      case 9:
        if (currentUser) {
          return true;
        }
        if (formData.isNewUser) {
          return !!formData.email && 
                 formData.email.includes("@") && 
                 !!formData.password && 
                 formData.password.length >= 6;
        } else {
          return !!formData.email && formData.email.includes("@");
        }
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      let userId = currentUser?.id;

      if (!userId) {
        // First, check if user exists or create new account
        const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password || '',
        });

        if (signInError && signInError.message !== 'Invalid login credentials') {
          throw signInError;
        }

        userId = user?.id;
      }

      // If user doesn't exist, create new account
      if (!userId) {
        const { data: { user: newUser }, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password || generateRandomPassword(),
          options: {
            data: {
              first_name: formData.first_name,
              last_name: formData.last_name,
              role: 'client',
            },
          },
        });

        if (signUpError) throw signUpError;
        userId = newUser?.id;

        if (!userId) {
          throw new Error('Failed to create user account');
        }

        // Create client profile in eloo_profiles table
        const { error: profileError } = await supabase
          .from('eloo_profiles')
          .insert({
            id: userId,
            first_name: formData.first_name,
            last_name: formData.last_name,
            email: formData.email,
            phone: formData.phone,
            role: 'client',
            is_verified: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          // Don't throw error, continue with service inquiry creation
        }
      }

      // Get or create session ID
      let sessionId = localStorage.getItem("inquiry_session_id");
      if (!sessionId) {
        sessionId = crypto.randomUUID();
        localStorage.setItem("inquiry_session_id", sessionId);
      }

      // Parse budget range
      const budgetOption = BUDGET_OPTIONS.find((b) => b.value === formData.budget_range);

      // Create service request (now that user is authenticated)
      const { data: inquiry, error: inquiryError } = await supabase
        .from("service_inquiries")
        .insert({
          user_id: userId, // Link to the authenticated user
          email: formData.email || currentUser?.email,
          phone: formData.phone,
          first_name: formData.first_name,
          last_name: formData.last_name,
          category_slug: formData.category_slug,
          subcategory_slug: formData.subcategory_slug,
          custom_tags: formData.custom_tags,
          service_type: formData.service_type,
          job_description: formData.job_description,
          job_urgency: formData.job_urgency,
          preferred_date: formData.preferred_date?.toISOString().split("T")[0],
          preferred_time_start: formData.preferred_time_start,
          preferred_time_end: formData.preferred_time_end,
          flexible_timing: formData.flexible_timing,
          address: formData.address,
          city: formData.city,
          postal_code: formData.postal_code,
          latitude: formData.latitude,
          longitude: formData.longitude,
          coarse_latitude: formData.coarse_latitude,
          coarse_longitude: formData.coarse_longitude,
          location_accuracy_meters: formData.location_accuracy_meters,
          coarse_location_label: formData.coarse_location_label || buildCoarseLocationLabel(formData.city, formData.postal_code),
          estimated_duration_hours: formData.estimated_duration_hours,
          number_of_people_needed: formData.number_of_people_needed,
          budget_range_min: budgetOption?.min || 0,
          budget_range_max: budgetOption?.max || 999999,
          materials_provided: formData.materials_provided,
          equipment_needed: formData.equipment_needed,
          status: "pending",
          session_id: sessionId,
          submitted_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (inquiryError) throw inquiryError;

      // Upload images if any were provided
      if (formData.work_images.length > 0) {
        try {
          for (const file of formData.work_images) {
            const uploadFormData = new FormData();
            uploadFormData.append("file", file);
            uploadFormData.append("image_type", "work_image");
            uploadFormData.append("inquiry_id", inquiry.id);

            const uploadResponse = await fetch("/api/upload", {
              method: "POST",
              body: uploadFormData,
            });

            if (!uploadResponse.ok) {
              const uploadError = await uploadResponse.json().catch(() => ({}));
              throw new Error(uploadError.error || "Image upload failed");
            }
          }
        } catch (imageError) {
          console.error('Image upload error:', imageError);
          // Don't fail the entire submission if images fail to upload
          setSubmitError("Service request submitted successfully, but some images failed to upload. You can add them later.");
        }
      }

      // Store inquiry ID for the suggestions page
      localStorage.setItem("last_inquiry_id", inquiry.id);

      // Navigate to dashboard to show the new request
      router.push("/dashboard/requests");
    } catch (error) {
      console.error("Error submitting inquiry:", error);
      setSubmitError("An error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleShiftSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch("/api/business/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(shiftFormData),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setSubmitError(payload.error || "Unable to create business shift post.");
        return;
      }
      router.push("/dashboard/business");
      router.refresh();
    } catch (error) {
      console.error("Shift post creation failed:", error);
      setSubmitError("Unable to create business shift post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to generate random password for auto-signup
  const generateRandomPassword = () => {
    return Math.random().toString(36).slice(-8) + 'A1!';
  };

  const renderStep = () => {
    if (isShiftQuestionnaire) {
      switch (currentStep) {
        case 1:
          return (
            <Step1ShiftAudience
              audience={shiftAudience}
              setAudience={setShiftAudience}
              onNext={handleNext}
            />
          );
        case 2:
          return (
            <ShiftBusinessAccessStep
              business={business}
              businessLoading={businessLoading}
              currentUser={currentUser}
              onNext={handleNext}
              onPrevious={handlePrevious}
            />
          );
        case 3:
          return (
            <ShiftRoleStep
              formData={shiftFormData}
              selectedNiche={selectedShiftNiche}
              updateFormData={updateShiftFormData}
              handleNicheChange={handleShiftNicheChange}
              onNext={handleNext}
              onPrevious={handlePrevious}
            />
          );
        case 4:
          return (
            <ShiftScheduleLocationStep
              formData={shiftFormData}
              updateFormData={updateShiftFormData}
              onNext={handleNext}
              onPrevious={handlePrevious}
            />
          );
        case 5:
          return (
            <ShiftPayRequirementsStep
              formData={shiftFormData}
              selectedNiche={selectedShiftNiche}
              updateFormData={updateShiftFormData}
              onPrevious={handlePrevious}
              onSubmit={handleShiftSubmit}
              isSubmitting={isSubmitting}
              error={submitError}
            />
          );
        default:
          return null;
      }
    }

    switch (currentStep) {
      case 1:
        return (
          <Step1Category
            formData={formData}
            updateFormData={updateFormData}
            onNext={handleNext}
          />
        );
      case 2:
        return (
          <Step2Subcategory
            formData={formData}
            updateFormData={updateFormData}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 3:
        return (
          <Step3ServiceType
            formData={formData}
            updateFormData={updateFormData}
            onNext={handleNext}
            onPrevious={handlePrevious}
            showPrevious={!isTaskrabbitSelection}
            selectedCustomJobName={selectedCustomJobName}
          />
        );
      case 4:
        return (
          <Step4JobDetails
            formData={formData}
            updateFormData={updateFormData}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 5:
        return (
          <Step5Schedule
            formData={formData}
            updateFormData={updateFormData}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 6:
        return (
          <Step6Location
            formData={formData}
            updateFormData={updateFormData}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 7:
        return (
          <Step7Scope
            formData={formData}
            updateFormData={updateFormData}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 8:
        return (
          <Step8Images
            formData={formData}
            updateFormData={updateFormData}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 9:
        return (
          <Step9Contact
            formData={formData}
            updateFormData={updateFormData}
            onSubmit={handleSubmit}
            onPrevious={handlePrevious}
            isSubmitting={isSubmitting}
            error={submitError}
            isLoggedIn={Boolean(currentUser)}
            displayEmail={currentUser?.email || formData.email}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-20">
      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        {isShiftQuestionnaire && shiftAudience !== "individual" ? (
          <div className="mb-6 rounded-full bg-white px-4 py-2 text-center text-sm font-semibold text-gray-600 shadow-sm ring-1 ring-gray-200">
            Work shifts step {currentStep} of {SHIFT_TOTAL_STEPS}
          </div>
        ) : null}
        <motion.div
          key={stepKey}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderStep()}
        </motion.div>
      </main>
    </div>
  );
}

function Step1ShiftAudience({
  audience,
  setAudience,
  onNext,
}: {
  audience: ShiftAudience;
  setAudience: (audience: ShiftAudience) => void;
  onNext: () => void;
}) {
  const isIndividual = audience === "individual";

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600">
          <ClipboardList className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Who is posting this work shift?</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Work shifts are business-only posts because they involve staffing, payroll-style scheduling, and verified company details.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setAudience("business")}
          className={cn(
            "rounded-2xl border-2 p-5 text-left transition-all",
            audience === "business" ? "border-red-600 bg-red-50 ring-4 ring-red-100" : "border-gray-200 bg-white hover:border-gray-300"
          )}
        >
          <Building2 className="mb-3 h-7 w-7 text-red-600" />
          <span className="block text-base font-bold text-gray-950">I am a business</span>
          <span className="mt-2 block text-sm leading-6 text-gray-600">
            Continue to the shift job questionnaire for verified businesses.
          </span>
        </button>
        <button
          type="button"
          onClick={() => setAudience("individual")}
          className={cn(
            "rounded-2xl border-2 p-5 text-left transition-all",
            audience === "individual" ? "border-amber-500 bg-amber-50 ring-4 ring-amber-100" : "border-gray-200 bg-white hover:border-gray-300"
          )}
        >
          <Home className="mb-3 h-7 w-7 text-amber-600" />
          <span className="block text-base font-bold text-gray-950">I am an individual</span>
          <span className="mt-2 block text-sm leading-6 text-gray-600">
            Use day-to-day jobs for personal home services and one-off help.
          </span>
        </button>
      </div>

      {isIndividual ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div>
              <h2 className="font-bold">This is a business-only feature</h2>
              <p className="mt-2 text-sm leading-6 text-amber-900">
                Individuals should not post work shifts. Please post your request under day-to-day jobs so it goes through
                the normal home-service questionnaire.
              </p>
              <Link
                href="/questionnaire"
                className="mt-4 inline-flex items-center rounded-xl bg-amber-900 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-950"
              >
                Post under day-to-day jobs
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex justify-end pt-2">
        <Button
          onClick={onNext}
          disabled={audience !== "business"}
          className="bg-red-600 px-8 text-white hover:bg-red-700"
        >
          Continue <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function ShiftBusinessAccessStep({
  business,
  businessLoading,
  currentUser,
  onNext,
  onPrevious,
}: {
  business: BusinessProfile | null;
  businessLoading: boolean;
  currentUser: User | null;
  onNext: () => void;
  onPrevious: () => void;
}) {
  const approved = business?.status === "approved";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Business shift access</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          AnyJob checks that this account has an approved business before showing the shift posting questions.
        </p>
      </div>

      {businessLoading ? (
        <div className="flex items-center rounded-2xl border border-gray-200 bg-white p-5 text-gray-600">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Checking business approval...
        </div>
      ) : null}

      {!businessLoading && !currentUser ? (
        <ShiftAccessMessage
          title="Sign in before posting work shifts"
          text="Work shift posts must be attached to a verified business account."
          href="/login?redirect=/register-business"
          cta="Login"
          secondaryHref="/business-signup?redirect=/register-business"
          secondaryCta="Create business account"
        />
      ) : null}

      {!businessLoading && currentUser && !business ? (
        <ShiftAccessMessage
          title="Register your business first"
          text="You need a business profile, registration number, and verification document before posting shift jobs."
          href="/register-business"
          cta="Register as a business"
        />
      ) : null}

      {!businessLoading && business && !approved ? (
        <ShiftAccessMessage
          title={`Business approval is ${business.status}`}
          text="Admin approval is required before this account can post day-wage or shift work."
          href="/register-business"
          cta="View registration"
        />
      ) : null}

      {!businessLoading && approved ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-950">
          <div className="flex items-start gap-3">
            <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
            <div>
              <h2 className="font-bold">{business.business_name} is approved</h2>
              <p className="mt-2 text-sm leading-6 text-emerald-900">
                Continue to post shift work with role, schedule, location, headcount, rates, and requirements.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onPrevious}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button onClick={onNext} disabled={!approved} className="bg-red-600 px-8 text-white hover:bg-red-700">
          Continue <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function ShiftAccessMessage({
  title,
  text,
  href,
  cta,
  secondaryHref,
  secondaryCta,
}: {
  title: string;
  text: string;
  href: string;
  cta: string;
  secondaryHref?: string;
  secondaryCta?: string;
}) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
      <div className="flex items-start gap-3">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
        <div>
          <h2 className="font-bold">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-amber-900">{text}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href={href} className="inline-flex items-center rounded-xl bg-amber-900 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-950">
              {cta}
            </Link>
            {secondaryHref && secondaryCta ? (
              <Link href={secondaryHref} className="inline-flex items-center rounded-xl border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-100">
                {secondaryCta}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function ShiftRoleStep({
  formData,
  selectedNiche,
  updateFormData,
  handleNicheChange,
  onNext,
  onPrevious,
}: {
  formData: ShiftBusinessPostForm;
  selectedNiche: ReturnType<typeof getShiftNiche>;
  updateFormData: (field: keyof ShiftBusinessPostForm, value: string | boolean) => void;
  handleNicheChange: (value: string) => void;
  onNext: () => void;
  onPrevious: () => void;
}) {
  const canContinue = Boolean(formData.niche && formData.roleTitle && formData.description.trim().length >= 10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Role and worker niche</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          These questions are different from day-to-day jobs. Only matching shift workers can see this business post.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold text-gray-700">Worker niche *</span>
          <select value={formData.niche} onChange={(event) => handleNicheChange(event.target.value)} className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-3">
            {SHIFT_NICHES.map((niche) => (
              <option key={niche.value} value={niche.value}>{niche.label}</option>
            ))}
          </select>
          <span className="mt-1 block text-xs text-gray-500">Market average: EUR {selectedNiche.hourlyAverage}/hour or EUR {selectedNiche.dayAverage}/day</span>
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-gray-700">Role *</span>
          <select value={formData.roleTitle} onChange={(event) => updateFormData("roleTitle", event.target.value)} className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-3">
            {selectedNiche.roles.map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="text-sm font-semibold text-gray-700">Shift duties and expectations *</span>
        <Textarea
          value={formData.description}
          onChange={(event) => updateFormData("description", event.target.value)}
          rows={6}
          className="mt-2 min-h-40 resize-none"
          placeholder="Describe the shift duties, experience needed, must-have certifications, language needs, and how workers should report on arrival."
        />
        <span className="mt-1 block text-xs text-gray-500">Minimum 10 characters • {formData.description.length} characters</span>
      </label>

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onPrevious}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button onClick={onNext} disabled={!canContinue} className="bg-red-600 px-8 text-white hover:bg-red-700">
          Continue <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function ShiftScheduleLocationStep({
  formData,
  updateFormData,
  onNext,
  onPrevious,
}: {
  formData: ShiftBusinessPostForm;
  updateFormData: (field: keyof ShiftBusinessPostForm, value: string | boolean) => void;
  onNext: () => void;
  onPrevious: () => void;
}) {
  const canContinue = Boolean(formData.address && formData.city && formData.startDate && formData.startTime && formData.endTime && Number(formData.headcount) > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Schedule, location, and headcount</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Shift posts need exact timing and workplace details so workers can decide if they are available.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold text-gray-700">Work type *</span>
          <select value={formData.workType} onChange={(event) => updateFormData("workType", event.target.value)} className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-3">
            {WORK_TYPES.filter((type) => type.value !== "freelance_service").map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-gray-700">Headcount *</span>
          <Input type="number" min="1" value={formData.headcount} onChange={(event) => updateFormData("headcount", event.target.value)} className="mt-2" />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-gray-700">Start date *</span>
          <Input type="date" value={formData.startDate} onChange={(event) => updateFormData("startDate", event.target.value)} className="mt-2" />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-gray-700">Start time *</span>
          <Input type="time" value={formData.startTime} onChange={(event) => updateFormData("startTime", event.target.value)} className="mt-2" />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-gray-700">End date</span>
          <Input type="date" value={formData.endDate} onChange={(event) => updateFormData("endDate", event.target.value)} className="mt-2" />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-gray-700">End time *</span>
          <Input type="time" value={formData.endTime} onChange={(event) => updateFormData("endTime", event.target.value)} className="mt-2" />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-sm font-semibold text-gray-700">Location name</span>
          <Input value={formData.locationName} onChange={(event) => updateFormData("locationName", event.target.value)} className="mt-2" placeholder="Main venue, ward, store, warehouse..." />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-sm font-semibold text-gray-700">Address *</span>
          <Textarea value={formData.address} onChange={(event) => updateFormData("address", event.target.value)} className="mt-2 min-h-20 resize-none" />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-gray-700">City *</span>
          <Input value={formData.city} onChange={(event) => updateFormData("city", event.target.value)} className="mt-2" />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-gray-700">Postal code</span>
          <Input value={formData.postalCode} onChange={(event) => updateFormData("postalCode", event.target.value)} className="mt-2" />
        </label>
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onPrevious}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button onClick={onNext} disabled={!canContinue} className="bg-red-600 px-8 text-white hover:bg-red-700">
          Continue <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function ShiftPayRequirementsStep({
  formData,
  selectedNiche,
  updateFormData,
  onPrevious,
  onSubmit,
  isSubmitting,
  error,
}: {
  formData: ShiftBusinessPostForm;
  selectedNiche: ReturnType<typeof getShiftNiche>;
  updateFormData: (field: keyof ShiftBusinessPostForm, value: string | boolean) => void;
  onPrevious: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  error: string | null;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pay, requirements, and contact</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Businesses set preferred rates, then workers can apply, accept, or request a variation.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold text-gray-700">Preferred hourly rate</span>
          <Input type="number" min="1" value={formData.hourlyRate} onChange={(event) => updateFormData("hourlyRate", event.target.value)} className="mt-2" />
          <span className="mt-1 block text-xs text-gray-500">Market average for {selectedNiche.label}: EUR {selectedNiche.hourlyAverage}/hour</span>
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-gray-700">Preferred day rate</span>
          <Input type="number" min="1" value={formData.dayRate} onChange={(event) => updateFormData("dayRate", event.target.value)} className="mt-2" />
          <span className="mt-1 block text-xs text-gray-500">Market average for {selectedNiche.label}: EUR {selectedNiche.dayAverage}/day</span>
        </label>
        <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-700 sm:col-span-2">
          <input
            type="checkbox"
            checked={formData.acceptsWorkerRateVariation}
            onChange={(event) => updateFormData("acceptsWorkerRateVariation", event.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          Accept worker fee variations above or below this preferred rate
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-gray-700">Requirements</span>
          <Textarea value={formData.requirements} onChange={(event) => updateFormData("requirements", event.target.value)} rows={3} className="mt-2 resize-none" placeholder="Certifications, experience, language, safety requirements..." />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-gray-700">Uniform/equipment</span>
          <Textarea value={formData.uniform} onChange={(event) => updateFormData("uniform", event.target.value)} rows={3} className="mt-2 resize-none" placeholder="Uniform, PPE, shoes, tools, ID checks..." />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-gray-700">Break policy</span>
          <Input value={formData.breakPolicy} onChange={(event) => updateFormData("breakPolicy", event.target.value)} className="mt-2" />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-gray-700">Business contact phone</span>
          <Input value={formData.contactPhone} onChange={(event) => updateFormData("contactPhone", event.target.value)} className="mt-2" />
        </label>
      </div>

      {error ? <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onPrevious} disabled={isSubmitting}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button onClick={onSubmit} disabled={isSubmitting} className="bg-red-600 px-8 text-white hover:bg-red-700">
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Post business shift
        </Button>
      </div>
    </div>
  );
}

// Step 1: Category Selection
function Step1Category({
  formData,
  updateFormData,
  onNext,
}: {
  formData: FormData;
  updateFormData: (field: keyof FormData, value: unknown) => void;
  onNext: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          What service are you looking for?
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Select the category that matches your need
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {CATEGORIES.map((category) => (
          <button
            key={category.slug}
            onClick={() => {
              updateFormData("category_slug", category.slug);
              updateFormData("subcategory_slug", "");
            }}
            className={cn(
              "p-4 rounded-xl border-2 text-left transition-all duration-200",
              formData.category_slug === category.slug
                ? "border-red-600 bg-red-50 dark:bg-red-950/20"
                : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
            )}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center mb-2"
              style={{ backgroundColor: `${category.color}20`, color: category.color }}
            >
              <CategoryIcon slug={category.slug} className="w-5 h-5" />
            </div>
            <span className="font-medium text-gray-900 dark:text-white text-sm">
              {category.name}
            </span>
          </button>
        ))}
      </div>

      <button
        onClick={() => {
          updateFormData("category_slug", "custom");
          updateFormData("subcategory_slug", "custom-job");
        }}
        className={cn(
          "w-full rounded-2xl border-2 p-5 text-left transition-all duration-200",
          "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-600/20 hover:shadow-xl",
          formData.category_slug === "custom" ? "border-red-900 ring-4 ring-red-100" : "border-red-500"
        )}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <div className="text-base font-bold">Custom Job</div>
              <div className="text-sm text-white/85">
                Post a flexible request with your own tags and work details.
              </div>
            </div>
          </div>
          <span className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-red-700">
            Create custom job
          </span>
        </div>
      </button>

      <div className="flex justify-end pt-4">
        <Button
          onClick={onNext}
          disabled={!formData.category_slug}
          className="bg-red-600 hover:bg-red-700 text-white px-8"
        >
          Continue <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

// Step 2: Subcategory Selection
function Step2Subcategory({
  formData,
  updateFormData,
  onNext,
  onPrevious,
}: {
  formData: FormData;
  updateFormData: (field: keyof FormData, value: unknown) => void;
  onNext: () => void;
  onPrevious: () => void;
}) {
  const subcategories = SUBCATEGORIES[formData.category_slug] || [];
  const category = CATEGORIES.find((c) => c.slug === formData.category_slug);
  const visibleSubcategories = category
    ? [
        ...subcategories,
        {
          id: `${category.id}-other`,
          slug: `other-${category.slug}`,
          name: "Other",
          category_id: category.id,
        },
      ]
    : subcategories;

  const addCustomTag = () => {
    const tag = formData.tag_input.trim();
    if (!tag || formData.custom_tags.includes(tag) || formData.custom_tags.length >= 8) return;
    updateFormData("custom_tags", [...formData.custom_tags, tag]);
    updateFormData("tag_input", "");
  };

  if (formData.category_slug === "custom") {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600">
            <Sparkles className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Tag your custom job
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Add the skills, category words, or materials sellers should see.
          </p>
        </div>

        <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
          <Label htmlFor="custom-tags" className="text-sm font-semibold text-gray-900">
            Custom tags
          </Label>
          <div className="mt-2 flex gap-2">
            <Input
              id="custom-tags"
              value={formData.tag_input}
              onChange={(e) => updateFormData("tag_input", e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustomTag();
                }
              }}
              placeholder="e.g. mural painting, event setup, same-day help"
              className="bg-white"
            />
            <Button type="button" onClick={addCustomTag} className="bg-red-600 hover:bg-red-700 text-white">
              Add
            </Button>
          </div>
          <div className="mt-3 flex min-h-8 flex-wrap gap-2">
            {formData.custom_tags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-sm font-medium text-red-700 ring-1 ring-red-200">
                {tag}
                <button
                  type="button"
                  onClick={() => updateFormData("custom_tags", formData.custom_tags.filter((item) => item !== tag))}
                  className="text-red-500 hover:text-red-700"
                  aria-label={`Remove ${tag}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
            {formData.custom_tags.length === 0 && (
              <span className="text-sm text-gray-500">Add at least one tag so sellers can spot the job.</span>
            )}
          </div>
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onPrevious}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <Button
            onClick={onNext}
            disabled={formData.custom_tags.length === 0}
            className="bg-red-600 hover:bg-red-700 text-white px-8"
          >
            Continue <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        {/* Show selected category */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${category?.color}20`, color: category?.color }}
          >
            {category && <CategoryIcon slug={category.slug} className="w-6 h-6" />}
          </div>
          <span className="text-lg font-semibold text-gray-900 dark:text-white">
            {category?.name}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Specify your need
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          What type of {category?.name.toLowerCase()} service?
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {visibleSubcategories.map((sub) => (
          <button
            key={sub.slug}
            onClick={() => updateFormData("subcategory_slug", sub.slug)}
            className={cn(
              "p-4 rounded-xl border-2 text-left transition-all duration-200 flex items-center gap-3",
              formData.subcategory_slug === sub.slug
                ? "border-red-600 bg-red-50 dark:bg-red-950/20"
                : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
            )}
          >
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 relative"
              style={{
                backgroundColor: `${category?.color}20`,
                color: category?.color,
              }}
            >
              <SubcategoryIcon slug={sub.slug} categorySlug={formData.category_slug} className="w-6 h-6" />
              {formData.subcategory_slug === sub.slug && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white ring-2 ring-white dark:ring-gray-950">
                  <Check className="h-3.5 w-3.5" />
                </span>
              )}
            </div>
            <span className="font-medium text-gray-900 dark:text-white">{sub.name}</span>
          </button>
        ))}
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onPrevious}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!formData.subcategory_slug}
          className="bg-red-600 hover:bg-red-700 text-white px-8"
        >
          Continue <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

// Step 3: Service Type & Urgency
function Step3ServiceType({
  formData,
  updateFormData,
  onNext,
  onPrevious,
  showPrevious = true,
  selectedCustomJobName = "",
}: {
  formData: FormData;
  updateFormData: (field: keyof FormData, value: unknown) => void;
  onNext: () => void;
  onPrevious: () => void;
  showPrevious?: boolean;
  selectedCustomJobName?: string;
}) {
  return (
    <div className="space-y-8">
      {selectedCustomJobName && (
        <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm dark:border-red-950 dark:bg-gray-900">
          <div className="text-sm font-semibold uppercase text-red-600">Selected service</div>
          <div className="mt-2 text-2xl font-bold text-gray-950 dark:text-white">
            {selectedCustomJobName}
          </div>
        </div>
      )}

      {/* Service Type */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Service Type
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {SERVICE_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => updateFormData("service_type", type.value)}
              className={cn(
                "p-4 rounded-xl border-2 text-left transition-all duration-200",
                formData.service_type === type.value
                  ? "border-red-600 bg-red-50 dark:bg-red-950/20"
                  : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
              )}
            >
              <div className="font-medium text-gray-900 dark:text-white">{type.label}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{type.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Urgency */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          When do you need it?
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {URGENCY_OPTIONS.map((urgency) => {
            const Icon = urgency.icon;
            return (
              <button
                key={urgency.value}
                onClick={() => updateFormData("job_urgency", urgency.value)}
                className={cn(
                  "p-4 rounded-xl border-2 text-center transition-all duration-200",
                  formData.job_urgency === urgency.value
                    ? "border-red-600 bg-red-50 dark:bg-red-950/20"
                    : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
                )}
              >
                <Icon className="w-6 h-6 mx-auto mb-2 text-gray-600 dark:text-gray-400" />
                <span className="font-medium text-gray-900 dark:text-white text-sm">
                  {urgency.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-between pt-4">
        {showPrevious ? (
          <Button variant="outline" onClick={onPrevious}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
        ) : (
          <div />
        )}
        <Button
          onClick={onNext}
          disabled={!formData.service_type || !formData.job_urgency}
          className="bg-red-600 hover:bg-red-700 text-white px-8"
        >
          Continue <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

// Step 4: Job Description
function Step4JobDetails({
  formData,
  updateFormData,
  onNext,
  onPrevious,
}: {
  formData: FormData;
  updateFormData: (field: keyof FormData, value: unknown) => void;
  onNext: () => void;
  onPrevious: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Describe your need
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          The more details you provide, the better we can match you with the right provider
        </p>
      </div>

      <div className="space-y-4">
        <Textarea
          placeholder="Describe what you need to do...

For example:
- I need to clean my 60m2 apartment
- There are 2 bedrooms, 1 living room, 1 kitchen, 1 bathroom
- I would like the windows to be cleaned too
- I have a dog but it will be outside"
          value={formData.job_description}
          onChange={(e) => updateFormData("job_description", e.target.value)}
          className="min-h-[200px] resize-none"
        />
        <p className="text-sm text-gray-500">
          Minimum 10 characters • {formData.job_description.length} characters
        </p>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onPrevious}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <Button
          onClick={onNext}
          disabled={formData.job_description.length < 10}
          className="bg-red-600 hover:bg-red-700 text-white px-8"
        >
          Continue <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

// Step 5: Schedule
function Step5Schedule({
  formData,
  updateFormData,
  onNext,
  onPrevious,
}: {
  formData: FormData;
  updateFormData: (field: keyof FormData, value: unknown) => void;
  onNext: () => void;
  onPrevious: () => void;
}) {
  const today = new Date();
  const todayStart = startOfDay(today);
  const maxDate = addDays(today, 90);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          When do you want the service?
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Select a date and a time slot
        </p>
      </div>

      <div className="space-y-4">
        {/* Date Picker */}
        <div>
          <Label className="text-base">Desired date</Label>
          <Popover key="date-popover">
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal mt-2",
                  !formData.preferred_date && "text-muted-foreground"
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {formData.preferred_date ? (
                  format(formData.preferred_date, "PPP", { locale: enUS })
                ) : (
                  <span>Select a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[22rem] max-w-[calc(100vw-2rem)] p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={formData.preferred_date}
                onSelect={(date) => updateFormData("preferred_date", date)}
                disabled={(date) => date < todayStart || date > maxDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Time Range */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-base">Start time</Label>
            <Select
              key="time-start-select"
              value={formData.preferred_time_start}
              onValueChange={(value) => updateFormData("preferred_time_start", value)}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 24 }, (_, i) => (
                  <SelectItem key={`start-${i}`} value={`${i.toString().padStart(2, "0")}:00`}>
                    {i.toString().padStart(2, "0")}:00
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-base">Estimated end time</Label>
            <Select
              key="time-end-select"
              value={formData.preferred_time_end}
              onValueChange={(value) => updateFormData("preferred_time_end", value)}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 24 }, (_, i) => (
                  <SelectItem key={`end-${i}`} value={`${i.toString().padStart(2, "0")}:00`}>
                    {i.toString().padStart(2, "0")}:00
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Flexible Timing Checkbox */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="flexible"
            checked={formData.flexible_timing}
            onChange={(e) => updateFormData("flexible_timing", e.target.checked)}
            className="w-4 h-4 rounded border-gray-300"
          />
          <Label htmlFor="flexible" className="text-sm cursor-pointer">
            I&apos;m flexible with timings
          </Label>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onPrevious}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!formData.preferred_date}
          className="bg-red-600 hover:bg-red-700 text-white px-8"
        >
          Continue <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

// Step 6: Location
function Step6Location({
  formData,
  updateFormData,
  onNext,
  onPrevious,
}: {
  formData: FormData;
  updateFormData: (field: keyof FormData, value: unknown) => void;
  onNext: () => void;
  onPrevious: () => void;
}) {
  const [locationStatus, setLocationStatus] = useState<string | null>(null);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("Location access is not available in this browser.");
      return;
    }

    setLocationStatus("Requesting location access...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        updateFormData("latitude", latitude);
        updateFormData("longitude", longitude);
        updateFormData("coarse_latitude", roundToCoarseCoordinate(latitude));
        updateFormData("coarse_longitude", roundToCoarseCoordinate(longitude));
        updateFormData("location_accuracy_meters", Math.round(position.coords.accuracy));
        updateFormData("coarse_location_label", buildCoarseLocationLabel(formData.city, formData.postal_code));
        setLocationStatus("Location saved. Providers will only see the approximate area until their quote is accepted.");
      },
      () => {
        setLocationStatus("Location access was not granted. You can still continue with city and address.");
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Where will the service take place?
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Enter the full address. Providers only see the approximate area before quoting.
        </p>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-950">Share approximate location</p>
              <p className="text-sm text-blue-700">This helps nearby providers estimate travel before they quote.</p>
            </div>
            <Button type="button" variant="outline" onClick={requestLocation} className="bg-white">
              <MapPin className="w-4 h-4 mr-2" /> Use my location
            </Button>
          </div>
          {locationStatus && <p className="mt-3 text-sm text-blue-800">{locationStatus}</p>}
        </div>

        <div>
          <Label>Full address</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Textarea
              placeholder="123 Main St, Apartment 4B..."
              value={formData.address}
              onChange={(e) => {
                updateFormData("address", e.target.value);
                updateFormData("coarse_location_label", buildCoarseLocationLabel(formData.city, formData.postal_code));
              }}
              className="min-h-[80px] pl-10 resize-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>City</Label>
            <div className="relative">
              <Home className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Paris"
                value={formData.city}
                onChange={(e) => {
                  updateFormData("city", e.target.value);
                  updateFormData("coarse_location_label", buildCoarseLocationLabel(e.target.value, formData.postal_code));
                }}
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <Label>Postal code</Label>
            <Input
              placeholder="75001"
              value={formData.postal_code}
              onChange={(e) => {
                updateFormData("postal_code", e.target.value);
                updateFormData("coarse_location_label", buildCoarseLocationLabel(formData.city, e.target.value));
              }}
              maxLength={10}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onPrevious}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!formData.address || !formData.city}
          className="bg-red-600 hover:bg-red-700 text-white px-8"
        >
          Continue <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

// Step 7: Scope (Duration, People, Budget)
function Step7Scope({
  formData,
  updateFormData,
  onNext,
  onPrevious,
}: {
  formData: FormData;
  updateFormData: (field: keyof FormData, value: unknown) => void;
  onNext: () => void;
  onPrevious: () => void;
}) {
  return (
    <div className="space-y-8">
      {/* Duration */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Estimated Duration
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {DURATION_OPTIONS.map((duration) => (
            <button
              key={duration.value}
              onClick={() => updateFormData("estimated_duration_hours", duration.value)}
              className={cn(
                "p-3 rounded-xl border-2 text-center transition-all duration-200",
                formData.estimated_duration_hours === duration.value
                  ? "border-red-600 bg-red-50 dark:bg-red-950/20"
                  : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
              )}
            >
              <Clock className="w-5 h-5 mx-auto mb-1 text-gray-600 dark:text-gray-400" />
              <span className="font-medium text-gray-900 dark:text-white text-sm">
                {duration.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Number of People */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Number of people needed
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {PEOPLE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => updateFormData("number_of_people_needed", option.value)}
              className={cn(
                "p-3 rounded-xl border-2 text-center transition-all duration-200",
                formData.number_of_people_needed === option.value
                  ? "border-red-600 bg-red-50 dark:bg-red-950/20"
                  : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
              )}
            >
              <Users className="w-5 h-5 mx-auto mb-1 text-gray-600 dark:text-gray-400" />
              <span className="font-medium text-gray-900 dark:text-white text-sm">
                {option.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Budget */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Estimated budget
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {BUDGET_OPTIONS.map((budget) => (
            <button
              key={budget.value}
              onClick={() => updateFormData("budget_range", budget.value)}
              className={cn(
                "p-3 rounded-xl border-2 text-center transition-all duration-200",
                formData.budget_range === budget.value
                  ? "border-red-600 bg-red-50 dark:bg-red-950/20"
                  : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
              )}
            >
              <Wallet className="w-5 h-5 mx-auto mb-1 text-gray-600 dark:text-gray-400" />
              <span className="font-medium text-gray-900 dark:text-white text-sm">
                {budget.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Equipment */}
      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Package className="w-4 h-4" /> Materials and Equipment
        </h3>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="materials"
              checked={formData.materials_provided}
              onChange={(e) => updateFormData("materials_provided", e.target.checked)}
              className="w-4 h-4 rounded border-gray-300"
            />
            <Label htmlFor="materials" className="text-sm cursor-pointer">
              I provide the necessary materials and products
            </Label>
          </div>
          <div>
            <Label className="text-sm">Specific equipment needs</Label>
            <Input
              placeholder="E.g.: Vacuum, Ladder, Drill..."
              value={formData.equipment_needed}
              onChange={(e) => updateFormData("equipment_needed", e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onPrevious}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!formData.estimated_duration_hours || !formData.budget_range}
          className="bg-red-600 hover:bg-red-700 text-white px-8"
        >
          Continue <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

// Step 8: Work Images Upload
function Step8Images({
  formData,
  updateFormData,
  onNext,
  onPrevious,
}: {
  formData: FormData;
  updateFormData: (field: keyof FormData, value: unknown) => void;
  onNext: () => void;
  onPrevious: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate files
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/');
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB max
      return isValidType && isValidSize;
    });

    if (validFiles.length !== files.length) {
      setUploadError('Some files were invalid. Only images under 10MB are allowed.');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      // For now, just store the files. We'll upload them during form submission
      updateFormData('work_images', [...formData.work_images, ...validFiles]);
      setUploadError(null);
    } catch (error) {
      console.error('File selection error:', error);
      setUploadError('Failed to process files. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const newImages = formData.work_images.filter((_, i) => i !== index);
    updateFormData('work_images', newImages);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Add Work Images (Optional)
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Upload photos of the work area to help providers understand the job better
        </p>
      </div>

      <div className="space-y-6">
        {/* Upload Area */}
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-red-500 transition-colors">
          <div className="mb-4">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Upload Work Images
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Drag and drop images here, or click to select files
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
              Maximum 10MB per file. JPG, PNG, GIF supported.
            </p>
          </div>
          
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
            id="image-upload"
          />
          
          <Button
            type="button"
            onClick={() => document.getElementById('image-upload')?.click()}
            disabled={uploading}
            variant="outline"
            className="mt-4"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Package className="w-4 h-4 mr-2" />
                Select Images
              </>
            )}
          </Button>
        </div>

        {/* Upload Error */}
        {uploadError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-600 dark:text-red-400">{uploadError}</p>
          </div>
        )}

        {/* Image Previews */}
        {formData.work_images.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Selected Images ({formData.work_images.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {formData.work_images.map((file, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Work image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <span className="sr-only">Remove image</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <div className="mt-2">
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            Why add images?
          </h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Help providers understand the scope of work</li>
            <li>• Show the specific area that needs attention</li>
            <li>• Reduce questions and get more accurate bids</li>
            <li>• Get better responses from qualified providers</li>
          </ul>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onPrevious}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <Button
          onClick={onNext}
          className="bg-red-600 hover:bg-red-700 text-white px-8"
        >
          Continue <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </motion.div>
  );
}

// Step 9: Contact Information & Integrated Signup
function Step9Contact({
  formData,
  updateFormData,
  onSubmit,
  onPrevious,
  isSubmitting,
  error,
  isLoggedIn,
  displayEmail,
}: {
  formData: FormData;
  updateFormData: (field: keyof FormData, value: unknown) => void;
  onSubmit: () => void;
  onPrevious: () => void;
  isSubmitting: boolean;
  error: string | null;
  isLoggedIn: boolean;
  displayEmail: string;
}) {
  const validateStep = (): boolean => {
    if (isLoggedIn) return true;

    if (formData.isNewUser) {
      return !!formData.email && 
             formData.email.includes("@") && 
             !!formData.password && 
             formData.password.length >= 6 &&
             !!formData.first_name &&
             !!formData.last_name;
    } else {
      return !!formData.email && 
             formData.email.includes("@") &&
             !!formData.first_name &&
             !!formData.last_name;
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Last step!
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {isLoggedIn ? "Review and submit your service request." : "Create your account to submit your service request"}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        {isLoggedIn ? (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4">
            <p className="text-sm font-semibold text-green-900">Posting from your signed-in account</p>
            <p className="mt-1 text-sm text-green-800">{displayEmail}</p>
          </div>
        ) : (
          <div>
            <Label className="text-base font-medium">Do you have an account?</Label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <button
                onClick={() => updateFormData("isNewUser", true)}
                className={cn(
                  "p-3 rounded-xl border-2 text-center transition-all duration-200",
                  formData.isNewUser
                    ? "border-red-600 bg-red-50 dark:bg-red-950/20"
                    : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
                )}
              >
                <div className="font-medium text-gray-900 dark:text-white">New User</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Create account</div>
              </button>
              <button
                onClick={() => updateFormData("isNewUser", false)}
                className={cn(
                  "p-3 rounded-xl border-2 text-center transition-all duration-200",
                  !formData.isNewUser
                    ? "border-red-600 bg-red-50 dark:bg-red-950/20"
                    : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
                )}
              >
                <div className="font-medium text-gray-900 dark:text-white">Existing User</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">I have an account</div>
              </button>
            </div>
          </div>
        )}

        {/* Name Fields */}
        {!isLoggedIn && <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>First name</Label>
            <Input
              placeholder="John"
              value={formData.first_name}
              onChange={(e) => updateFormData("first_name", e.target.value)}
              required
            />
          </div>
          <div>
            <Label>Last name</Label>
            <Input
              placeholder="Doe"
              value={formData.last_name}
              onChange={(e) => updateFormData("last_name", e.target.value)}
              required
            />
          </div>
        </div>}

        {/* Email Field */}
        {!isLoggedIn && <div>
          <Label>Email *</Label>
          <Input
            type="email"
            placeholder="john.doe@email.com"
            value={formData.email}
            onChange={(e) => updateFormData("email", e.target.value)}
            required
          />
        </div>}

        {/* Password Field (only for new users) */}
        {!isLoggedIn && formData.isNewUser && (
          <div>
            <Label>Password *</Label>
            <Input
              type="password"
              placeholder="Create a password (min 6 characters)"
              value={formData.password}
              onChange={(e) => updateFormData("password", e.target.value)}
              required
              minLength={6}
            />
            <p className="text-sm text-gray-500 mt-1">
              Minimum 6 characters. Include numbers and letters for security.
            </p>
          </div>
        )}

        {/* Phone Field */}
        {!isLoggedIn && <div>
          <Label>Phone (optional)</Label>
          <Input
            type="tel"
            placeholder="06 12 34 56 78"
            value={formData.phone}
            onChange={(e) => updateFormData("phone", e.target.value)}
          />
        </div>}
      </div>

      {/* Request Summary */}
      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl">
        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
          Summary of your request
        </h4>
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <p>
            <span className="font-medium">Service:</span>{" "}
            {formData.category_slug === "custom"
              ? "Custom job request"
              : `${CATEGORIES.find((c) => c.slug === formData.category_slug)?.name} - ${getSubcategoryDisplayName(formData.category_slug, formData.subcategory_slug)}`}
          </p>
          {formData.custom_tags.length > 0 && (
            <p>
              <span className="font-medium">Tags:</span> {formData.custom_tags.join(", ")}
            </p>
          )}
          <p>
            <span className="font-medium">Date:</span>{" "}
            {formData.preferred_date ? format(formData.preferred_date, "PPP", { locale: enUS }) : "-"}
          </p>
          <p>
            <span className="font-medium">Location:</span> {formData.city}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onPrevious} disabled={isSubmitting}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <Button
          onClick={onSubmit}
          disabled={isSubmitting || !validateStep()}
          className="bg-red-600 hover:bg-red-700 text-white px-8"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...
            </>
          ) : (
            <>
              {isLoggedIn ? "Post Job" : formData.isNewUser ? "Create Account & Submit Request" : "Submit Request"} <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
